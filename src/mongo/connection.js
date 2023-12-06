const mongoose = require("mongoose");

require("dotenv").config();

const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

//change to true when you have all the schemas ready
mongoose.set("strictQuery", false);

const connection = mongoose.connect(process.env.DB_CONNECTION, connectionParams)
    .then(() => console.log("Connected to cloud"))
    .catch((err) => console.log(err));

module.exports = connection;