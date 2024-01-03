const socketIO = require('socket.io');

let io;

const init = (server) => {
    io = socketIO(server);

    io.on('connection', socket => {
        console.log('A user connected:', socket.id);

        //Not working need to fix everyone
        socket.on('login', (userId) => {
            socket.join(userId); // Join a global room for the user upon login
            console.log(`User ${userId} joined the global room`);
        });

        socket.on('openChat', ({ senderId, recipientId }) => {
            const chatRoomId = [senderId, recipientId].sort().join('-'); // Create a unique room ID for the chat
            socket.join(chatRoomId); // Join the private room for this chat
            console.log(`User ${senderId} joined the chat room with ${recipientId}`);
        });

        socket.on('sendMessage', ({ chatRoomId, message, name, userId }) => {
            console.log(chatRoomId + ' ' + message);
            io.to(chatRoomId).emit('Receive Message', {message: message, name: name, userId: userId});
        });
    });
};

module.exports = { init };