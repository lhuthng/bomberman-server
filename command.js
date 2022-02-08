const roomManager = require('./room-manager');

class Command {
    constructor(server) {
        const io = require('socket.io')(server);
        io.on('connection', socket => {
            console.log(`${socket} connected`);
            
            socket.on('disconnect', () => {
                console.log(`${socket} disconnected`);
            });
        });
        let roomId = 0, roomId2 = 0;;
        const callback = (...args) => console.log(...args);
        roomManager.createRoom({
            name: "test", 
            playerId: 1, 
            callback: (type, id) => roomId = id
        });
        roomManager.createRoom({
            name: "test2",
            playerId: 10,
            callback: (type, id) => roomId2 = id
        });
        roomManager.joinRoom({
            id: roomId,
            playerId: 2,
            callback
        });
        roomManager.joinRoom({
            id: roomId,
            playerId: 3,
            callback
        });
        roomManager.joinRoom({
            id: roomId,
            playerId: 4,
            callback
        });
        roomManager.joinRoom({
            id: roomId,
            playerId: 5,
            callback
        });
        roomManager.joinRoom({
            id: roomId2,
            playerId: 5,
            callback
        });
        roomManager.leaveRoom({
            id: roomId,
            playerId: 3,
            callback
        });
        roomManager.leaveRoom({
            id: roomId,
            playerId: 1,
            callback
        });
        console.log(roomManager.getRooms());
    }
}

module.exports = (server) => new Command(server);