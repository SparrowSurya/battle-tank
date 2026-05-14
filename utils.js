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

const clamp = (min, max, val) => Math.max(min, Math.min(max, val));
const lerp = (a, b, t) => a + (b - a) * t;
const avg = (x) => x.length == 0 ? 0 :  x.reduce((prev, curr, i, arr)) / x.length;