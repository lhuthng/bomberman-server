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
                console.log(pid);
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
            const createRoom = (room) => {
                const { id } = room;
                playerManager.setRoomId(pid, id);
                socket.emit('created room', {
                    ...room,
                    playerNames: room.playerIds.map(id => playerManager.getName(id))
                });
                socket.join(id);
            };
            const joinRoom = (room, index) => {
                const { id } = room;
                const playerId = room.playerIds[index]
                playerManager.setRoomId(playerId, id);
                socket.emit('joined room', {
                    ...room,
                    playerNames: room.playerIds.map(id => playerManager.getName(id))
                });
                io.in(id).emit('broadcast joined room', playerId, playerManager.getName(playerId), index);
                console.log("join", id);
                socket.join(id);
            };
            const leaveRoom = (id, playerId) => {
                playerManager.setRoomId(playerId, undefined);
                socket.emit('left room');
                socket.leave(id);
                io.in(id).emit('broadcast left room', playerId);
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
            socket.on('get room', (id) => utils.packFunc(roomManager.getRoom, { id }, {
                failed: failedAction('getting room')
            }));
            socket.on('get rooms', () => utils.packFunc(roomManager.getRooms, {}, {
                received: getRooms,
                failed: failedAction('getting rooms')
            }));
            socket.on('create room', (capacity) =>  utils.packFunc(roomManager.createRoom, { capacity, hostId: pid }, {
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
                if (roomId !== undefined) {
                    utils.packFunc(roomManager.leaveRoom, { id: roomId, playerId: pid }, {
                        left: leaveRoom,
                        deleted: deleteRoom,
                        promoted: promotePlayer,
                        failed: failedAction('leaving room')
                    });
                }
                playerManager.deletePlayer({ id: pid });
            });
        });
    }
}

module.exports = (server) => new Socket(server);