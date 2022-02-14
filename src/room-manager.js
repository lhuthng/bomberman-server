const { generateUniqueId, provoke, createResChain } = require('./utils');
const playerManager = require('./player-manager');
const utils = require('./utils');
const roomNamePool = [
    ["ultimate", "powerful", "prestige", "tiny", "huge", "enormouse"],
    ["stupid", "smart", "gay", "nani", "ching chong", "ching chang chong"],
    ["castle", "room", "panda", "pink guy", "gary the gay", "jerry", "tom", "jom and terry"],
];
const roomManager = () => {
    const rooms = { };

    const validateId = id => rooms[id] !== undefined;
    const validateRoomRes = ({ id, callback }, shared, next) => {
        if (validateId(id)) {
            shared.room = rooms[id];
            next();
        }
        else provoke(callback, "failed", "invalid room");
    }
    const getRooms = createResChain(({ callback }) => {
        provoke(callback, "received", rooms);
    });
    const getRoom = createResChain(validateRoomRes, ({ callback }, shared) => {
        provoke(callback, "received", shared.room);
    });
    const createRoom = createResChain(({ hostId, capacity, callback }) => {
        capacity = utils.constrain(capacity, 2, 4);
        if (playerManager.getRoomId(hostId) === Number) {
            provoke(callback, "failed", "already joined a room");
        }
        else {
            const id = generateUniqueId(30, validateId);
            const room = {
                id,
                name: utils.randomPick(' ', roomNamePool),
                status: "waiting",
                hostId,
                playerIds: [ hostId ],
            };
            room.playerIds.length = capacity;
            rooms[id] = room;
            provoke(callback, "created", room);
        }
    });
    const deleteRoomRes = ({ id, callback }) => {
        delete rooms[id];
        provoke(callback, "deleted", id);
    }
    const deleteRoom = createResChain(validateRoomRes, deleteRoomRes);
    const joinRoom = createResChain(validateRoomRes, ({ playerId, callback }, shared) => {
        const lastIndex = shared.room.playerIds.findIndex(id => id === undefined);
        if (lastIndex >= 0) {
            shared.room.playerIds[lastIndex] = playerId;
            provoke(callback, "joined", shared.room, lastIndex);
        } 
        else provoke(callback, "failed", "full room"); 
    });
    const leaveRoom = createResChain(validateRoomRes, (args, shared, next) => {
        const { playerId, callback} = args;
        shared.index = shared.room.playerIds.findIndex(pid => pid === playerId);
        if (shared.index !== -1) next();
        else provoke(callback, "failed", "invalid player");
    }, ({ id, playerId, callback}, shared, next) => {
        delete shared.room.playerIds[shared.index];
        provoke(callback, "left", id, playerId);
        if (playerId === shared.room.hostId) next();
    }, ({ id, callback }, shared, next) => {
        const firstIndex = shared.room.playerIds.findIndex(id => id === Number);
        if (firstIndex >= 0) {
            shared.room.hostId = shared.room.playerIds[firstIndex];
            provoke(callback, "promoted", id, shared.room.hostId);
        }
        else next();
    }, deleteRoomRes);
    return {
        getRooms, createRoom, deleteRoom, joinRoom, leaveRoom
    };
}

// const manager = new RoomManager();
const manager = roomManager();

module.exports = manager;