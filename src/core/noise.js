import { mulberry32 } from './random.js';

export default class PerlinNoise {
    /**
     * Initializes the Perlin Noise generator.
     * @param {number} seed - The seed value to ensure repeatable noise.
     */
    constructor(seed) {
        this.random = mulberry32(seed);

        // Initialize and shuffle permutation table
        this.permutation = Array.from({ length: 256 }, (_, i) => i);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            const temp = this.permutation[i];
            this.permutation[i] = this.permutation[j];
            this.permutation[j] = temp;
        }

        // Duplicate the permutation table to avoid out of bounds lookup
        this.p = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i & 255];
        }
    }

    /**
     * Fade function as defined by Ken Perlin.
     * 6t^5 - 15t^4 + 10t^3
     */
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Linear interpolation.
     */
    lerp(t, a, b) {
        return a + t * (b - a);
    }

    /**
     * Gradient function.
     */
    grad(hash, x, y) {
        const h = hash & 7; // 8 gradient directions in 2D
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    }

    /**
     * Generates Perlin Noise for a given (x, y) coordinate.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {number} - A noise value between -1 and 1.
     */
    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.p[A], xf, yf),
                         this.grad(this.p[B], xf - 1, yf)),
            this.lerp(u, this.grad(this.p[A + 1], xf, yf - 1),
                         this.grad(this.p[B + 1], xf - 1, yf - 1))
        );
    }
}
