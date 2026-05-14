class Color {
    constructor(r = 255, g = 255, b = 255, a = 1.0) {
        this.r = Math.max(0, Math.min(255, r));
        this.g = Math.max(0, Math.min(255, g));
        this.b = Math.max(0, Math.min(255, b));
        this.a = Math.max(0, Math.min(1.0, a));
        Object.freeze(this);
    }

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

    static all(v, a = 1.0) {
        return new Color(v, v, v, a);
    }

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

    withValue({ r, g, b, a } = {}) {
        return new Color(
            r ?? this.r,
            g ?? this.g,
            b ?? this.b,
            a ?? this.a
        );
    }

    toRGBAString() {
        return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a})`;
    }

    toString() { return this.toRGBAString(); }

    toHexString() {
        const r = Math.round(this.r).toString(16).padStart(2, '0');
        const g = Math.round(this.g).toString(16).padStart(2, '0');
        const b = Math.round(this.b).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    lerp(other, t) {
        if (!(other instanceof Color)) return this;
        return new Color(
            this.r + (other.r - this.r) * t,
            this.g + (other.g - this.g) * t,
            this.b + (other.b - this.b) * t,
            this.a + (other.a - this.a) * t
        );
    }

    grayscale() {
        const v = this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
        return new Color(v, v, v, this.a);
    }
}
