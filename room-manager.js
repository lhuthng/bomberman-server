const { generateUniqueId, provoke, createResChain } = require('./utils');

const roomManager = () => {
    const rooms = { };

    const validateId = id => rooms[id] !== undefined;
    const getRooms = () => rooms;
    const validateRoom = (args, _, next) => {
        const { id, callback } = args;
        if (validateId(id)) next();
        else provoke(callback, "failed", "invalid room");
    }
    const createRoom = createResChain(({ name, hostId, callback }) => {
        const id = generateUniqueId(30, validateId);
        const room = {
            name, id,
            status: "waiting",
            hostId,
            playerIds: [ hostId ]
        };
        rooms[id] = room;
        provoke(callback, "created", id);
    });
    const deleteRoom = createResChain(validateRoom, ({ id, callback }) => {
        provoke(callback, "deleted", id);
    });
    const joinRoom = createResChain(validateRoom, ({ id, playerId, callback }) => {
        if (rooms[id].playerIds.length < 4) {
            rooms[id].playerIds.push(playerId);
            provoke(callback, "joined", id, playerId);
        } 
        else provoke(callback, "failed", "full room"); 
    });
    const leaveRoom = createResChain(validateRoom, ({ id, playerId, callback}, shared, next) => {
        shared.index = rooms[id].playerIds.findIndex(pid => pid === playerId);
        if (shared.index !== -1) next();
        else provoke(callback, "failed", "invalid player");
    }, ({ id, playerId, callback}, shared, next) => {
        rooms[id].playerIds.splice(shared.index, 1);
        provoke(callback, "left", id, playerId);
        if (playerId === rooms[id].hostId) next();
    }, ({ id, callback }) => {
        if (rooms[id].playerIds.length > 0) {
            rooms[id].hostId = rooms[id].playerIds[0];
            provoke(callback, "promoted", id, rooms[id].hostId);
        }
        else deleteRoom(id); 
    });
    return {
        getRooms, createRoom, deleteRoom, joinRoom, leaveRoom
    };
}

// const manager = new RoomManager();
const manager = roomManager();

module.exports = manager;