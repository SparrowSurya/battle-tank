/**
 * Pseudo-random number generator using the mulberry32 algorithm.
 * Generates repeatable, deterministic random decimals based on a seed.
 * 
 * @param {number} seed - The starting seed.
 * @returns {function} A function that returns a pseudo-random float between 0 (inclusive) and 1 (exclusive).
 */
export function mulberry32(seed) {
    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Returns a random integer between a minimum and maximum boundary (inclusive).
 * Uses Math.random() under the hood (non-deterministic).
 * 
 * @param {object} [options={}] - Range configuration.
 * @param {number} [options.min=0] - The lower bound.
 * @param {number} [options.max=1] - The upper bound.
 * @returns {number}
 */
export function randomInt({ min = 0, max = 1 } = {}) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
