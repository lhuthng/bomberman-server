const { generateUniqueId, createResChain, provoke } = require('./utils');

const playerManager = () => {
    const players = { };
    const getPlayers = () => players;

    const validateId = id => players[id] !== undefined;
    const getName = id => {
        if (players[id] === undefined) console.log(id);
        return players[id] && players[id].name;
    }
    const setRoomId = (id, roomId) => {
        if (players[id]) players[id].roomId = roomId;
    }
    const getRoomId = id => {
        if (players[id]) return players[id].roomId;
    };
    const validatePlayer = ({ id, callback }, shared, next) => {
        if (validateId(id)) {
            shared.player = players[id];
            next();
        }
        else provoke(callback, "failed", "invalid player");
    };
    const updateName = createResChain(validatePlayer, ({ newName, callback }, shared) => {
        if (newName !== "") {
            shared.player.name = newName;
            provoke(callback, "updated", newName);
        }
        else provoke(callback, "failed", "empty name");
    });
    const createPlayer = createResChain(({ socket, callback }) => {
        const id = generateUniqueId(30, validateId);
        const name = "unnamed";
        const player = {
            id, socket, name, roomId: undefined
        }
        players[id] = player;
        provoke(callback, "created", id, name);
    }); 
    const deletePlayer = createResChain(validatePlayer, ({ id, callback }) => {
        delete players[id];
        provoke(callback, "deleted", id);
    });
    return { getName, setRoomId, getRoomId, updateName, getPlayers, createPlayer, deletePlayer };
}

const manager = playerManager();

module.exports = manager;