require('dotenv').config();

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./src/mongo/connection');
const userModel = require('./src/models/user');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./src/middlewares/auth');

const app = express();

// app use
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());
app.use(cors());

//Requests
app.get('/', function (req, res) {
    res.status(200).send(`Welcome to login , sign-up api`);
});

/*
 Storing sensitive information such as passwords in plain text in the request body (req.body) is not recommended. 
 Consider using HTTPS and possibly implementing token-based authentication (like JWT) instead of handling passwords directly. 
 */

//Register new user
app.post('/createnewuser', async (req, res) => {
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

//Login (verify user email and password) if match retrieve user data
app.post('/login', async (req, res) => {
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
        const tokenuser = { email: email}
        const accessToken = jwt.sign(tokenuser, process.env.ACCESS_TOKEN_SECRET);

        res.status(200).json({ accessToken: accessToken, user: user });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

//GET user list to display at home page swiper cards
app.get('/userlist', authenticateToken, async (req, res) => {
    const email = req.user.email;

    try {
        const userlist = await userModel.find();
        if (!userlist || userlist.length === 0) {
            console.log("User list is empty or not retrieved properly.");
            return res.status(404).send("User list not found");
        };

        const responseUserList = userlist.filter((user) => user.email !== email);
        res.status(200).json(responseUserList);
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send("Internal server error");
    }
});

//Matching algorithm
app.get('/chat', (req, res) => {
    const email = req.body.email;

    try {

    } catch (error) {

    }
});

// listening port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`);
});