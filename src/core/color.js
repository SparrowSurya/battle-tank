/**
 * Represents an immutable RGBA color.
 */
export default class Color {
    /**
     * Creates a new Color instance.
     * @param {number} [r=255] - Red value (0-255).
     * @param {number} [g=255] - Green value (0-255).
     * @param {number} [b=255] - Blue value (0-255).
     * @param {number} [a=1.0] - Alpha/opacity value (0.0-1.0).
     */
    constructor(r = 255, g = 255, b = 255, a = 1.0) {
        this.r = Math.max(0, Math.min(255, r));
        this.g = Math.max(0, Math.min(255, g));
        this.b = Math.max(0, Math.min(255, b));
        this.a = Math.max(0, Math.min(1.0, a));
        Object.freeze(this);
    }

    /**
     * Creates a Color instance from a hex value.
     * Supports numerical hexes (e.g. 0xff0000) or strings (e.g. "#fff", "0x556B2F").
     * @param {number|string} hex - The hex value.
     * @returns {Color}
     */
    static fromHex(hex) {
        if (typeof hex === 'number') {
            const r = (hex >> 16) & 255;
            const g = (hex >> 8) & 255;
            const b = hex & 255;
            return new Color(r, g, b);
        }
        if (typeof hex === 'string') {
            const h = hex.replace(/^#|^0x|^0X/, '');
            if (h.length === 3) {
                const r = parseInt(h[0] + h[0], 16);
                const g = parseInt(h[1] + h[1], 16);
                const b = parseInt(h[2] + h[2], 16);
                return new Color(r, g, b);
            }
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            return new Color(r, g, b);
        }
        return new Color();
    }

    /**
     * Creates a grayscale color where red, green, and blue have the same value.
     * @param {number} v - The intensity value (0-255).
     * @param {number} [a=1.0] - The alpha value.
     * @returns {Color}
     */
    static all(v, a = 1.0) {
        return new Color(v, v, v, a);
    }

    /**
     * Returns a Color based on standard named CSS colors.
     * @param {string} name - Color name (e.g. 'red', 'black', 'white', 'gray').
     * @returns {Color}
     */
    static fromName(name) {
        const names = {
            black: [0, 0, 0],
            white: [255, 255, 255],
            red: [255, 0, 0],
            green: [0, 255, 0],
            blue: [0, 0, 255],
            yellow: [255, 255, 0],
            magenta: [255, 0, 255],
            cyan: [0, 255, 255],
            gray: [128, 128, 128],
            orange: [255, 165, 0],
            transparent: [0, 0, 0, 0]
        };
        const c = names[name.toLowerCase()];
        if (c) return new Color(...c);
        return new Color();
    }

    /**
     * Creates a new Color with modified components.
     * @param {object} params - Override parameters.
     * @param {number} [params.r]
     * @param {number} [params.g]
     * @param {number} [params.b]
     * @param {number} [params.a]
     * @returns {Color}
     */
    withValue({ r, g, b, a } = {}) {
        return new Color(
            r ?? this.r,
            g ?? this.g,
            b ?? this.b,
            a ?? this.a
        );
    }

    /**
     * Creates a new Color with a modified alpha value.
     * @param {number} a - The new alpha value.
     * @returns {Color}
     */
    withAlpha(a) {
        return new Color(this.r, this.g, this.b, a);
    }

    /**
     * Formats the color into an rgba(r,g,b,a) CSS string.
     * @returns {string}
     */
    toRGBAString() {
        return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a})`;
    }

    /**
     * Converts to string (delegates to toRGBAString).
     * @returns {string}
     */
    toString() { return this.toRGBAString(); }

    /**
     * Formats the color as a hex code (e.g. #ff0000). Alpha is discarded.
     * @returns {string}
     */
    toHexString() {
        const r = Math.round(this.r).toString(16).padStart(2, '0');
        const g = Math.round(this.g).toString(16).padStart(2, '0');
        const b = Math.round(this.b).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    /**
     * Linearly interpolates (lerps) between this color and another color.
     * @param {Color} other - The destination color.
     * @param {number} t - Interpolation weight (0.0 to 1.0).
     * @returns {Color}
     */
    lerp(other, t) {
        if (!(other instanceof Color)) return this;
        return new Color(
            this.r + (other.r - this.r) * t,
            this.g + (other.g - this.g) * t,
            this.b + (other.b - this.b) * t,
            this.a + (other.a - this.a) * t
        );
    }

    /**
     * Converts the color to grayscale based on luminance factors.
     * @returns {Color}
     */
    grayscale() {
        const v = this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
        return new Color(v, v, v, this.a);
    }
}
