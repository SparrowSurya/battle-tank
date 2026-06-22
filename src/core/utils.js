import Vec2 from './vec2.js';

export function deepcopy(obj) {
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

export const isSome = (x) => x !== undefined && x !== null;
export const slope = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
export const lerp = (a, b, t) => a + (b - a) * t;
export const avg = (...values) => {
    const arr = values.flat();
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
};

export const inRange = (val, min, max) => min <= val && val < max;

export const toDeg = (radians) => radians * (180 / Math.PI);

export const updateProjectile = (pos, vel, g, dt) => { return {
    pos: new Vec2(
        pos.x + vel.x * dt,
        pos.y + vel.y * dt + 0.5 * g * dt * dt,
    ),
    vel: new Vec2(
        vel.x,
        vel.y + g * dt,
    ),
}};
