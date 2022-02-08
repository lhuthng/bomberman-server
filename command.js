const roomManager = require('./room-manager');
const playerManager = require('./player-manager');
const utils = require('./utils');
const players = playerManager.getPlayers();
class Command {
    constructor(server) {
        const io = require('socket.io')(server);
        
        io.on('connection', socket => {
            let pid;

            //

            const createPlayer = id => {
                socket.emit('created player', id);
                pid = id;
            }
            const createRoom = id => {
                socket.emit('created room', id);
                socket.join(id);
            };
            const joinRoom = (id, playerId) => {
                socket.emit('joined room', id, playerId);
                io.in(id).emit('another joins room', playerId);
                socket.join(id);
            };
            const leaveRoom = (id, playerId) => {
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
            socket.on('create room', (name, hostId) =>  utils.packFunc(roomManager.createRoom, { name, hostId }, {
                created: createRoom,
                failed: failedAction('creating room')
            }));
            socket.on('join room', (id, playerId) => utils.packFunc(roomManager.joinRoom, { id, playerId }, {
                joined: joinRoom,
                failed: failedAction('joining room')
            }));
            socket.on('leave room', (id, playerId) => utils.packFunc(roomManager.leaveRoom, { id, playerId }, {
                left: leaveRoom,
                deleted: deleteRoom,
                promoted: promotePlayer,
                failed: failedAction('leaving room')
            }));
            socket.on('disconnect', () => {
                if (pid !== undefined) playerManager.deletePlayer({ id });
            });
        });
    }
}

module.exports = (server) => new Command(server);