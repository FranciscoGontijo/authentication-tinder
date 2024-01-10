
const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middlewares/auth');


const router = express.Router();

//POST Register new user
router.post('/createnewuser', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const user = {
        name: name,
        email: email,
        password: password
    };

    //check if user already exists and add it if not
    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
        res.send("One account with this Email already exists.");
    } else {
        try {
            // hash password before insert it at database
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            user.password = hashedPassword; // replace password inside user object


            await userModel.create(user);

            const tokenuser = { email: email };
            const accessToken = jwt.sign(tokenuser, process.env.ACCESS_TOKEN_SECRET);

            res.status(200).json({ accessToken: accessToken, user: user });
        } catch (err) {
            res.status(500).send(err);
        }
    };

});

//POST Login (verify user email and password) if match retrieve user data
router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await userModel.findOne({ email: email });
        if (!user) {
            return res.status(404).send("Email not found");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).send("Password incorrect");
        }

        // Here, you might generate a JWT token for authentication and send it back as a response
        // Example: const token = generateToken(user);
        const accessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);

        res.status(200).json({ accessToken: accessToken, user: user });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

//GET user list to display at home page swiper cards
router.get('/userlist', authenticateToken, async (req, res) => {
    const email = req.user.email;

    try {
        const userlist = await userModel.find();
        if (!userlist || userlist.length === 0) {
            console.log("User list is empty or not retrieved properly.");
            return res.status(404).send("User list not found");
        };

        const responseUserList = userlist
            .filter((user) => user.email !== email)
            .map((user) => {
                // Convert ObjectId to string for _id field
                return {
                    ...user._doc,
                    _id: user._id.toString(),
                };
            });

        res.status(200).json(responseUserList);
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send("Internal server error");
    }
});

//PUT request to update liked Array
router.put('/likeuser/:userid', authenticateToken, async (req, res) => {
    const email = req.user.email;
    const likedUserId = req.params.userid;

    try {
        const loggedInUser = await userModel.findOne({ email: email });

        if (!loggedInUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        let message = 'User added to liked users';

        if (loggedInUser.likedList.includes(likedUserId)) {
            message = 'User already liked';
        } else {
            loggedInUser.likedList.push(likedUserId);
            await loggedInUser.save();
        };

        const likedUser = await userModel.findOne({ _id: likedUserId });

        // Add to matched list if matched and create a chat object
        if (likedUser.likedList.includes(loggedInUser._id.toString()) && !loggedInUser.matchedList.includes(likedUserId)) {
            //Add to matched list
            likedUser.matchedList.push(loggedInUser._id.toString());
            loggedInUser.matchedList.push(likedUserId);
            //Create chat object
            const chatObj = {
                chat: [],
                users: [loggedInUser._id.toString(), likedUserId]
            };
            loggedInUser.chatList.push(chatObj);
            likedUser.chatList.push(chatObj);

            await likedUser.save();
            await loggedInUser.save();

            message = 'You got a Match';
        };

        res.status(200).json({ message: message });

    } catch (error) {
        res.status(500).send("Internal server error" + error);
    };

});

//GET Matched user list
router.get('/matchedlist', authenticateToken, async (req, res) => {
    const email = req.user.email;
    let completeMatchedList = [];

    try {
        const loggedInUser = await userModel.findOne({ email: email });

        if (!loggedInUser) {
            return res.status(404).json({ message: 'User not found' });
        };

        //Retreive last message to display at matched list
        
        const userDetailsPromises = loggedInUser.matchedList.map(async (user) => {
            let userDetails = await userModel.findOne({ _id: user }, { name: 1, photoUrl: 1, _id: 1 });

            const chatObj = loggedInUser.chatList.find(chatItem => chatItem.users.includes(loggedInUser._id.toString()) && chatItem.users.includes(user));

            const lastMessage = chatObj.chat[chatObj.chat.length - 1];

            console.log(userDetails);

            userDetails.lastMessage = lastMessage;

            return userDetails; 
        });

        const userDetailsResults = await Promise.all(userDetailsPromises);

        userDetailsResults.forEach((userDetails) => {
            if (userDetails) {
                completeMatchedList.push({ name: userDetails.name, photoUrl: userDetails.photoUrl, _id: userDetails._id.toString(), lastMessage: userDetails.lastMessage });
            };
        });

        if (completeMatchedList.length === 0) {
            return res.status(404).json({ message: 'No matched users found' });
        }

        res.status(200).json(completeMatchedList);
    } catch (error) {
        console.error('Error fetching matched users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//GET chat messages(get complete chat or just last 20 messages to display at chat window)
router.get('/chat/:userid', authenticateToken, async (req, res) => {
    const email = req.user.email;
    const likedUserId = req.params.userid;
    // const page = 1;
    // const pageSize = 20;

    try {
        const loggedInUser = await userModel.findOne({ email });

        if (!loggedInUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const chatObj = loggedInUser.chatList.find(chatItem => chatItem.users.includes(loggedInUser._id.toString()) && chatItem.users.includes(likedUserId));

        if (!chatObj) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        res.status(200).json(chatObj.chat);
    } catch (error) {
        console.error('Error fetching matched users:', error);
        res.status(500).json({ message: 'Internal server error' });
    };
});

//PUT chat messages(update the chat array with the new messages that was sent)
router.post('/chatupdate/:userid', authenticateToken, async (req, res) => {
    const chatArray = req.body.chat;
    const likedUserId = req.params.userid;
    const email = req.user.email;

    try {
        const loggedInUser = await userModel.findOne({ email });
        const likedUser = await userModel.findOne({ _id: likedUserId });

        if (!loggedInUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const chatItemToUpdate = loggedInUser.chatList.find(chatItem => chatItem.users.includes(loggedInUser._id.toString()) && chatItem.users.includes(likedUserId));
        const otherUserChatItemToUpdate = likedUser.chatList.find(chatItem => chatItem.users.includes(loggedInUser._id.toString()) && chatItem.users.includes(likedUserId));

        if (!chatItemToUpdate) {
            return res.status(404).json({ message: 'Chat item not found' });
        };

        //Update the chat at model
        chatItemToUpdate.chat = chatArray;
        otherUserChatItemToUpdate.chat = chatArray;

        // Save the changes
        await loggedInUser.save();
        await likedUser.save();

        res.status(200).json({ message: 'Chat array updated successfully' });

    } catch (error) {
        console.error('Error fetching matched users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//If you get just the last 20, you need to make the logic to update the chat array just with the new messages. 

module.exports = router;
