
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
    const name = req.body.userName;
    const email = req.body.userEmail;
    const password = req.body.password;
    const user = {
        name: name,
        email: email,
        password: password
    };
    try {
        const newUser = await userModel.create(user);
        res.json(newUser);
    } catch (err) {
        res.status(500).send(err);
    }
});

//Login (verify user email and password) if match retrieve user data

// listening port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`);
});