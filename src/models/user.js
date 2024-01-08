const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    likedList: {
        type: [String],
        required: false
    },
    photoUrl: {
        type: String,
        required: false
    },
    matchedList: {
        type: [String],
        required: false
    },
    chatList: [
        {
            chat: [
                {
                    name: String,
                    message: String,
                    userId: String, // User ID as string
                    //timestamp: { type: Date, default: Date.now }
                }
            ],
            users: [String] // Array of user IDs involved in the chat
        }
    ]
});

module.exports = mongoose.model('Profiles', userSchema);