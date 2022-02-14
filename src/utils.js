const utils = { }

utils.generateUniqueId = (bitNumber, checkerCall) => {
    checkerCall = checkerCall || (_ => 1);
    let result;
    do {
        result = (Math.random() * (1 << bitNumber)) >> 0;
    } while (checkerCall(result));
    return result;
};

utils.provoke = (callback, ...args) => {
    callback && callback(...args);
}

utils.createResChain = (...rest) => {
    const chain = (res, ...rest) => {
        if (res === undefined) return;
        const responsiblity = {
            res,
            call: function(shared, args) { this.res(args, shared, () => this.next && this.next.call(shared, args)); },
            next: chain(...rest),
        };
        return responsiblity;
    }
    const res = chain(...rest);
    return (args) => res.call({}, args);
}

utils.packFunc = (func, props, statusCallback) => {
    func({...props, callback: (status, ...args) => statusCallback[status](...args)});
}
utils.constrain = (value, min, max) => {
    return value < min ? min : value > max ? max : value;
}
utils.randomPick = (separator, pools) => {
    const result = [];
    for (const pool in pools) {
        const index = (Math.random() * pool.length) >> 0;
        result.push(pool[index]);
    }
    return result.join(separator);
}
module.exports = utils;
