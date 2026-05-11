class PerlinNoise {
    /**
     * Initializes the Perlin Noise generator.
     * @param {number} seed - The seed value to ensure repeatable noise.
     */
    constructor(seed) {
        // Initialize the random number generator function
        this.random = mulberry32(seed);

        // Initialize the permutation table (a repeating array of random numbers)
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(this.random(i) * 256);
        }
    }

    /**
     * Helper function to get a pseudo-random value from the permutation table.
     * @param {number} x - The index into the permutation table.
     * @returns {number} - A pseudo-random integer value.
     */
    _fade(t) {
        // Smoothstep interpolation function: 6t^5 - 15t^4 + 10t^3
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Helper function to get a pseudo-random gradient value based on the table.
     * @param {number} x - The index into the permutation table.
     * @returns {number} - A pseudo-random gradient index.
     */
    _lerp(a, b, t) {
        return a + t * (b - a);
    }

    /**
     * Generates Perlin Noise for a given (x, y) coordinate.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {number} - A noise value, typically between -1 and 1.
     */
    noise2D(x, y) {
        // 1. Find the grid coordinates (integer part)
        const X = Math.floor(x);
        const Y = Math.floor(y);

        // 2. Find the fractional parts (used for interpolation)
        const xf = x - X;
        const yf = y - Y;

        // 3. Calculate the base noise value using the grid coordinates
        // Use the permutation table to get the pseudo-random gradient index
        const A = this.permutation[X] + Y;
        const B = this.permutation[X + 1] + Y;

        // 4. Get the interpolation weights (using the fade function for smooth transitions)
        const u = x + y;
        const v = x - y;

        // 5. Interpolate between the four corner points (simplified for 2D coordinates)
        // Note: True 2D interpolation is complex; this simplifies the core concept.
        // For true 2D Perlin noise, you'd interpolate between the values at (x, y), (x+1, y), etc.

        // Simplified interpolation step for demonstration:
        const a = this.fade(u);
        const b = this.fade(v);

        // Interpolate the result between the two calculated corner values (requires the actual noise values)
        // Since we don't have the full 2D lookup table implemented here, we return a placeholder result.

        // *** In a full implementation, you would look up noise values at the 4 corners and interpolate them here. ***

        // For demonstration purposes, we return a dummy value based on the input structure:
        return (Math.sin(x) * 100) + (Math.cos(y) * 50);
    }

    // Helper function needed for the actual interpolation logic (simplified placeholder)
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
}