
const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middlewares/auth');


const router = express.Router();

//Requests
router.get('/', function (req, res) {
    res.status(200).send(`Welcome to login , sign-up api`);
});


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
            user.password = hashedPassword // replace password inside user object


            const newUser = await userModel.create(user);
            res.json(newUser.email);
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
        const tokenuser = { email: email }
        const accessToken = jwt.sign(tokenuser, process.env.ACCESS_TOKEN_SECRET);

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

//PUT request to update liked Array;
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
        }

        const likedUser = await userModel.findOne({ _id: likedUserId });

        // Add to matched list if matched
        if (likedUser.likedList.includes(loggedInUser._id.toString()) && !loggedInUser.matchedList.includes(likedUserId)) {
            likedUser.matchedList.push(loggedInUser._id.toString());
            loggedInUser.matchedList.push(likedUserId);

            await likedUser.save();
            await loggedInUser.save();

            message = 'You got a Match';
        }

        res.status(200).json({ message: message });

    } catch (error) {
        res.status(500).send("Internal server error" + error);
    }

});

//GET Matched user list
router.get('/matchedlist', authenticateToken, async (req, res) => {
    const email = req.user.email;
    let completeMatchedList = [];

    try {
        const loggedInUser = await userModel.findOne({ email: email });
    
        if (!loggedInUser) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        const userDetailsPromises = loggedInUser.matchedList.map(async (user) => {
            const userDetails = await userModel.findOne({ _id: user }, { name: 1, photoUrl: 1, _id: 0 });
            return userDetails;
        });
    
        const userDetailsResults = await Promise.all(userDetailsPromises);
    
        userDetailsResults.forEach((userDetails) => {
            if (userDetails) {
                completeMatchedList.push({ name: userDetails.name, photoUrl: userDetails.photoUrl });
            }
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

module.exports = router
