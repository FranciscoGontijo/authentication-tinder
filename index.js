
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./src/mongo/connection');
const userModel = require('./src/models/user');

const app = express();

// app use
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());

//Requests
app.get('/', function (req, res) {
    res.status(200).send(`Welcome to login , sign-up api`);
});

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
            res.json(newUser);
        } catch (err) {
            res.status(500).send(err);
        }
    };

});

//Login (verify user email and password) if match retrieve user data
app.get('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const check = await userModel.findOne({ email: email })
        const isPasswordMatch = null;
        if (check) {
            isPasswordMatch = await bcrypt.compare(password, check.password);
        }
        if (!check) {
            res.send("Email not found");
        } else if (!isPasswordMatch) {
            res.send("Password incorrect");
        } else {
            //login
            //Login and retrive user data
            res.send("Verified")
        }
    } catch (error) {
        res.send("Wrong detail")
    }
});

// listening port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`);
});