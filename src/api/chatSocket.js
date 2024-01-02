const socketIO = require('socket.io');

let io;

const init = (server) => {
    io = socketIO(server);

    io.on('connection', socket => {
        console.log('a user connected :D');
        
        socket.on('send message', msg => {
            console.log(msg);
            io.emit('receive message', msg);
        });
    
        socket.on('user', user => {
            console.log('message sent by' + user);
        });
    });
};

module.exports = { init };