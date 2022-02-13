const roomManager = require('./room-manager');
const playerManager = require('./player-manager');
const utils = require('./utils');
const players = playerManager.getPlayers();
class Socket {
    constructor(server) {
        const io = require('socket.io')(server);
        
        io.on('connection', socket => {
            let pid;

            //

            const createPlayer = (id, name) => {
                socket.emit('created player', id, name);
                pid = id;
            }
            const updateName = (name) => {
                console.log(name);
                socket.emit('updated name', name);
            }
            const getRooms = rooms => {
                const array = Object.values(rooms).map(room => ({
                    ...room,
                    playerNames: room.playerIds.map(id => playerManager.getName(id))
                }));
                socket.emit('received rooms', array);
            }
            const createRoom = id => {
                playerManager.setRoomId(pid, id);
                socket.emit('created room', id);
                socket.join(id);
            };
            const joinRoom = (id, playerId) => {
                playerManager.setRoomId(playerId, id);
                socket.emit('joined room', id, playerId);
                io.in(id).emit('another joins room', playerId);
                socket.join(id);
            };
            const leaveRoom = (id, playerId) => {
                playerManager.setRoomId(playerId);
                io.in(id).emit('left room', playerId);
                socket.leave(id);
            };
            const deleteRoom = () => {};
            const promotePlayer = (id, hostId) => {
                io.in(id).emit('promoted host', hostId);
            }
            const failedAction = (action) => (...args) => socket.emit(`failed ${action}`, ...args);
            //

            utils.packFunc(playerManager.createPlayer, { socket }, {
                created: createPlayer,
                failed: failedAction('creating player')
            });
            socket.on('update name', (newName) => utils.packFunc(playerManager.updateName, { newName, id: pid }, {
                updated: updateName,
                failed: failedAction('updating name')
            }));
            socket.on('get rooms', () => utils.packFunc(roomManager.getRooms, {}, {
                received: getRooms,
                failed: failedAction('getting rooms')
            }));
            socket.on('create room', (name) =>  utils.packFunc(roomManager.createRoom, { name, hostId: pid }, {
                created: createRoom,
                failed: failedAction('creating room')
            }));
            socket.on('join room', (id) => utils.packFunc(roomManager.joinRoom, { id, playerId: pid }, {
                joined: joinRoom,
                failed: failedAction('joining room')
            }));
            socket.on('leave room', (id) => utils.packFunc(roomManager.leaveRoom, { id, playerId: pid }, {
                left: leaveRoom,
                deleted: deleteRoom,
                promoted: promotePlayer,
                failed: failedAction('leaving room')
            }));
            socket.on('disconnect', () => {
                const roomId = playerManager.getRoomId(pid);
                console.log(roomId);
                if (roomId) {
                    playerManager.setRoomId(roomId);
                    roomManager.leaveRoom({ id: roomId });
                }
                playerManager.deletePlayer({ id: pid });
            });
        });
    }
}

module.exports = (server) => new Socket(server);