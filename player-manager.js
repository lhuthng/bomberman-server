const { generateUniqueId, createResChain, provoke } = require('./utils');

const playerManager = () => {
    const players = { };
    const getPlayers = () => players;

    const validateId = id => players[id] !== undefined;
    const validatePlayer = createResChain(({ id, callback }, _, next) => {
        if (validateId(id)) next();
        else provoke(callback, "failed", "invalid player");
    });
    const createPlayer = createResChain(({ socket, callback }) => {
        const id = generateUniqueId(30, validateId);
        const player = {
            id, socket, name: "unnamed", roomId: undefined
        }
        players[id] = player;
        provoke(callback, "created", id);
    }); 
    const deletePlayer = createResChain(validatePlayer, ({ id, callback }) => {
        delete players[id];
        provoke(callback, "deleted", id);
    });
    return { getPlayers, createPlayer, deletePlayer };
}

const manager = playerManager();

module.exports = manager;