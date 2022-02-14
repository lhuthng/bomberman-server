const { generateUniqueId, provoke, createResChain } = require('./utils');
const playerManager = require('./player-manager');
const roomManager = () => {
    const rooms = { };

    const validateId = id => rooms[id] !== undefined;
    const validateRoom = ({ id, callback }, shared, next) => {
        if (validateId(id)) {
            shared.room = rooms[id];
            next();
        }
        else provoke(callback, "failed", "invalid room");
    }
    const getRooms = createResChain(({ callback }) => {
        provoke(callback, "received", rooms);
    });
    const getRoom = createResChain(validateRoom, ({ callback }, shared) => {
        provoke(callback, "received", shared.room);
    });
    const createRoom = createResChain(({ name, hostId, callback }) => {
        if (playerManager.getRoomId(hostId) !== undefined) {
            provoke(callback, "failed", "already joined a room");
        }
        else {
            const id = generateUniqueId(30, validateId);
            const room = {
                name, id,
                status: "waiting",
                hostId,
                playerIds: [ hostId ]
            };
            rooms[id] = room;
            provoke(callback, "created", id, name);
        }
    });
    const deleteRoom = createResChain(validateRoom, ({ id, callback }) => {
        delete rooms[id];
        provoke(callback, "deleted", id);
    });
    const joinRoom = createResChain(validateRoom, ({ playerId, callback }, shared) => {
        if (shared.room.playerIds.length < 4) {
            shared.room.playerIds.push(playerId);
            provoke(callback, "joined", id, playerId);
        } 
        else provoke(callback, "failed", "full room"); 
    });
    const leaveRoom = createResChain(validateRoom, ({ playerId, callback}, shared, next) => {
        shared.index = shared.room.playerIds.findIndex(pid => pid === playerId);
        if (shared.index !== -1) next();
        else provoke(callback, "failed", "invalid player");
    }, ({ playerId, callback}, shared, next) => {
        shared.room.playerIds.splice(shared.index, 1);
        provoke(callback, "left", id, playerId);
        if (playerId === shared.room.hostId) next();
    }, ({ callback }, shared) => {
        if (shared.room.playerIds.length > 0) {
            shared.room.hostId = shared.room.playerIds[0];
            provoke(callback, "promoted", id, shared.room.hostId);
        }
        else deleteRoom({ id });
    });
    return {
        getRooms, createRoom, deleteRoom, joinRoom, leaveRoom
    };
}

// const manager = new RoomManager();
const manager = roomManager();

module.exports = manager;