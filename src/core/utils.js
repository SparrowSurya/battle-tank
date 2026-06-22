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

/**
 * Programmatically keys out black background pixels and crops the image to the exact sprite bounding box.
 * 
 * @param {HTMLImageElement} image - The source image element.
 * @param {number} [threshold=10] - RGB value below which a pixel is considered black.
 * @returns {HTMLCanvasElement} A canvas element containing the cropped, transparent sprite.
 */
export function processSprite(image, threshold = 10) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r < threshold && g < threshold && b < threshold) {
                data[i + 3] = 0; // Make pixel fully transparent
            } else {
                // Expand bounding box of non-transparent pixels
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);

    // If no non-transparent pixels found, return uncropped canvas
    if (maxX < minX || maxY < minY) {
        return canvas;
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = maxX - minX + 1;
    croppedCanvas.height = maxY - minY + 1;
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
        canvas,
        minX, minY, croppedCanvas.width, croppedCanvas.height,
        0, 0, croppedCanvas.width, croppedCanvas.height
    );

    return croppedCanvas;
}

/**
 * Programmatically draws a simple, retro-style Red Tank Hull on a 32x20 canvas.
 * @returns {HTMLCanvasElement}
 */
export function createRedTankHull() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    // Draw wheels/treads (dark grey)
    ctx.fillStyle = '#333333';
    ctx.fillRect(2, 14, 28, 6);
    
    // Draw wheels (grey circles)
    ctx.fillStyle = '#666666';
    for (let x = 5; x <= 27; x += 5) {
        ctx.beginPath();
        ctx.arc(x, 17, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw red chassis base (trapezoid)
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(30, 14);
    ctx.lineTo(26, 6);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    
    // Draw simple armor highlights (light red)
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(8, 8, 16, 2);
    
    return canvas;
}

/**
 * Programmatically draws a simple, retro-style Blue Tank Hull on a 32x20 canvas.
 * @returns {HTMLCanvasElement}
 */
export function createBlueTankHull() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    // Draw wheels/treads (dark grey)
    ctx.fillStyle = '#333333';
    ctx.fillRect(2, 14, 28, 6);
    
    // Draw wheels (grey circles)
    ctx.fillStyle = '#666666';
    for (let x = 5; x <= 27; x += 5) {
        ctx.beginPath();
        ctx.arc(x, 17, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw blue chassis base (trapezoid)
    ctx.fillStyle = '#0066cc';
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(30, 14);
    ctx.lineTo(26, 6);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    
    // Draw simple armor highlights (light blue)
    ctx.fillStyle = '#3399ff';
    ctx.fillRect(8, 8, 16, 2);
    
    return canvas;
}

/**
 * Programmatically draws a simple, retro-style Tank Turret & Barrel on a 24x12 canvas.
 * @returns {HTMLCanvasElement}
 */
export function createTankBarrel() {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 12;
    const ctx = canvas.getContext('2d');
    
    // Draw turret base (dark grey semicircle)
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.arc(6, 8, 4, Math.PI, 0);
    ctx.fill();
    
    // Draw gun barrel (dark grey tube extending to the right)
    ctx.fillStyle = '#555555';
    ctx.fillRect(10, 6, 12, 3);
    
    // Muzzle brake (barrel tip)
    ctx.fillStyle = '#222222';
    ctx.fillRect(20, 5, 2, 5);
    
    return canvas;
}

/**
 * Programmatically draws a simple, retro-style Projectile Sprite on a 12x6 canvas.
 * @returns {HTMLCanvasElement}
 */
export function createProjectileSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 6;
    const ctx = canvas.getContext('2d');
    
    // Draw missile body (yellow capsule)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(2, 1, 8, 4);
    
    // Missile tip (red tip)
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.lineTo(12, 3);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();
    
    // Flame tail (orange triangle extending left)
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(0, 3);
    ctx.lineTo(2, 4);
    ctx.closePath();
    ctx.fill();
    
    return canvas;
}
