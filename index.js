require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./src/mongo/connection');
const cors = require('cors');
const crudApi = require('./src/api/crudApi');
const socketHandler = require('./src/api/chatSocket');


const app = express();
const server = require('http').createServer(app);


// app use
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());
app.use(cors());

//Use CRUD API at the '/api' endpoint
app.use('/api', crudApi);

const PORT = process.env.PORT || 5000;

//Start express on specified port
app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`);
});

//User socket for chat message handling
socketHandler.init(server);