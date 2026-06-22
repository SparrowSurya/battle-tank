import Vec2 from './vec2.js';

/**
 * Creates a deep copy of a given array or object.
 * Primitives are returned as-is.
 * 
 * @param {*} obj - The target value to copy.
 * @returns {*} The deep copy.
 */
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

/**
 * Checks if a value is defined and not null.
 * 
 * @param {*} x - The value to check.
 * @returns {boolean}
 */
export const isSome = (x) => x !== undefined && x !== null;

/**
 * Calculates the slope between two points.
 * 
 * @param {number} x1 - X coordinate of first point.
 * @param {number} y1 - Y coordinate of first point.
 * @param {number} x2 - X coordinate of second point.
 * @param {number} y2 - Y coordinate of second point.
 * @returns {number} The slope value.
 */
export const slope = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);

/**
 * Clamps a number within a specified range.
 * 
 * @param {number} val - The input value.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} The clamped value.
 */
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * Linearly interpolates between two numbers.
 * 
 * @param {number} a - Start value.
 * @param {number} b - End value.
 * @param {number} t - Interpolation factor (usually 0.0 to 1.0).
 * @returns {number} The interpolated value.
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Computes the average of a list of numbers. Flat arrays are supported.
 * 
 * @param {...number|number[]} values - Numbers to average.
 * @returns {number} The mean average.
 */
export const avg = (...values) => {
    const arr = values.flat();
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
};

/**
 * Checks if a value falls within a range (min inclusive, max exclusive).
 * 
 * @param {number} val - The value to check.
 * @param {number} min - Lower bound (inclusive).
 * @param {number} max - Upper bound (exclusive).
 * @returns {boolean}
 */
export const inRange = (val, min, max) => min <= val && val < max;

/**
 * Converts radians to degrees.
 * 
 * @param {number} radians - Angle in radians.
 * @returns {number} Angle in degrees.
 */
export const toDeg = (radians) => radians * (180 / Math.PI);

/**
 * Simulates a single physics step for a ballistics projectile affected by gravity.
 * 
 * @param {Vec2} pos - Current position of the projectile.
 * @param {Vec2} vel - Current velocity vector.
 * @param {number} g - Gravity acceleration (pixels/second^2).
 * @param {number} dt - Time delta for the step in seconds.
 * @returns {{pos: Vec2, vel: Vec2}} The updated position and velocity.
 */
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
