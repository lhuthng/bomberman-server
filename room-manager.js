const utils = require('./utils');
const { generateUniqueId, provoke, createResChain } = require('./utils');

// class RoomManager {
//     constructor() {
//         this.rooms = { };

//         this.validateId = this.validateId.bind(this);
//         this.getRooms = this.getRooms.bind(this);
//         this.createRoom = this.createRoom.bind(this);
//         this.deleteRoom = this.deleteRoom.bind(this);
//     }
//     getRooms() {
//         return this.rooms;
//     }
//     createRoom(name, playerId, callback) {
//         if (this.rooms[name] === undefined) {
//             const id = generateUniqueId(30, this.validateId);
//             const room = {
//                 name, id, 
//                 status: "waiting",
//                 host: playerId,
//                 playerIds: [ playerId ]
//             }
//             this.rooms[id] = room;
//             provoke(callback, "create", id);
//         }
//         provoke(callback, "invalid");
//     }
//     deleteRoom(id, callback) {
//         if (!this.validateId(id)) return "deleted";
//         else provoke(callback, "invalid"); 
//     }
//     joinRoom(id, playerId, callback) {
//         if (!this.validateId(id)) {
//             this.rooms[id].playerIds.push(playerId);
//             provoke(callback, "join");
//         }
//         else provoke(callback, "invalid");
//     }
//     leaveRoom(id, playerId, callback) {
//         if (!this.validateId(id)) {
//             const room = this.rooms[id];
//             const index = room.playerIds.findIndex(id => id === playerId);
//             if (index != -1) {
//                 room.playerIds.splice(index, 1);
//                 if (playerId === room.host) {
//                     if (room.playerIds.length() > 0) {
//                         host = room.playerIds[0];
//                         provoke(callback, "promote", host);
//                     }
//                     else {
//                         this.deleteRoom(id);
//                         provoke(callback, "delete")
//                     }
//                 }
//                 else provoke(callback, "leave");
//             }
//         }
//         else provoke(callback, "invalid");
//     }
//     startRoom(id, callback) {

//     }
//     validateId(id) {
//         return this.rooms[id] === undefined;
//     }
// }

const _roomManager = () => {
    const rooms = { };

    const validateId = id => rooms[id] !== undefined;
    const getRooms = () => rooms;
    const validateRoom = (args, _, next) => {
        const { id, callback } = args;
        if (validateId(id)) next();
        else provoke(callback, "error", "invalid room");
    }
    const createRoom = utils.createResChain(({ name, playerId, callback }) => {
        const id = generateUniqueId(30, validateId);
        const room = {
            name, id,
            status: "waiting",
            hostId: playerId,
            playerIds: [ playerId ]
        };
        rooms[id] = room;
        provoke(callback, "create", id);
    });
    const deleteRoom = utils.createResChain(validateRoom, ({ id, callback }) => {
        provoke(callback, "delete", id);
    });
    const joinRoom = utils.createResChain(validateRoom, ({ id, playerId, callback }) => {
        if (rooms[id].playerIds.length < 4) {
            rooms[id].playerIds.push(playerId);
            provoke(callback, "join", id, playerId);
        } 
        else {
            provoke(callback, "error", "full room");
        }
    });
    const leaveRoom = utils.createResChain(validateRoom, ({ id, playerId, callback}, shared, next) => {
        shared.index = rooms[id].playerIds.findIndex(pid => pid === playerId);
        if (shared.index !== -1) next();
        else provoke(callback, "error", "invalid player");
    }, ({ id, playerId, callback}, shared, next) => {
        rooms[id].playerIds.splice(shared.index, 1);
        provoke(callback, "leave", id, playerId);
        if (playerId === rooms[id].hostId) next();
    }, ({ id, callback }) => {
        if (rooms[id].playerIds.length > 0) {
            rooms[id].hostId = rooms[id].playerIds[0];
            provoke(callback, "promote", id, rooms[id].hostId);
        }
        else {
            deleteRoom(id);
            provoke(callback, "delete", id);
        }
    });
    return {
        getRooms, createRoom, deleteRoom, joinRoom, leaveRoom
    };
}

// const manager = new RoomManager();
const manager = _roomManager();

module.exports = manager;