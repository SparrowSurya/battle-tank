function deepcopy(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        const arrCopy = [];
        for (let i = 0; i < obj.length; i++) {
            arrCopy.push(deepcopy(obj[i]));
        }
        return arrCopy;
    }

    const objCopy = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            objCopy[key] = deepcopy(obj[key]);
        }
    }
    return objCopy;
}

const isSome = (x) => x !== undefined && x !== null;
const slope = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const lerp = (a, b, t) => a + (b - a) * t;
const avg = (...values) => {
    const arr = values.flat();
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
};

const inRange = (val, min, max) => min <= val && val < max;

const toDeg = (radians) => radians * (180 / Math.PI);

const updateProjectile = (pos, vel, g, dt) => { return {
    pos: new Vec2(
        pos.x + vel.x * dt,
        pos.y + vel.y * dt + 0.5 * g * dt * dt,
    ),
    vel: new Vec2(
        vel.x,
        vel.y + g * dt,
    ),
}};
