import Vec2 from './vec2.js';

/**
 * Represents a 2D axis-aligned rectangle.
 */
export default class Rect {
    /**
     * Creates a new Rect instance.
     * @param {number|object} [x=0] - The X coordinate of the top-left corner, or an object with x, y, w, h properties.
     * @param {number} [y=0] - The Y coordinate of the top-left corner (ignored if x is an object).
     * @param {number} [w=0] - The width of the rectangle (ignored if x is an object).
     * @param {number} [h=0] - The height of the rectangle (ignored if x is an object).
     */
    constructor(x = 0, y = 0, w = 0, h = 0) {
        if (typeof x === 'object' && x !== null) {
            this.x = x.x ?? 0;
            this.y = x.y ?? 0;
            this.w = x.w ?? x.width ?? 0;
            this.h = x.h ?? x.height ?? 0;
        } else {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }
        Object.freeze(this);
    }

    /**
     * Gets the left boundary of the rectangle.
     * @returns {number}
     */
    get left() { return this.x; }

    /**
     * Gets the right boundary of the rectangle.
     * @returns {number}
     */
    get right() { return this.x + this.w; }

    /**
     * Gets the top boundary of the rectangle.
     * @returns {number}
     */
    get top() { return this.y; }

    /**
     * Gets the bottom boundary of the rectangle.
     * @returns {number}
     */
    get bottom() { return this.y + this.h; }

    /**
     * Gets the center point of the rectangle.
     * @returns {Vec2}
     */
    get center() {
        return new Vec2(this.x + this.w / 2, this.y + this.h / 2);
    }

    /**
     * Gets the size of the rectangle as a Vec2.
     * @returns {Vec2}
     */
    get size() {
        return new Vec2(this.w, this.h);
    }

    /**
     * Gets the position of the top-left corner as a Vec2.
     * @returns {Vec2}
     */
    get pos() {
        return new Vec2(this.x, this.y);
    }

    /**
     * Creates a new Rect centered at a specific position.
     * @param {Vec2} center - The center position.
     * @param {number} w - The width.
     * @param {number} h - The height.
     * @returns {Rect}
     */
    static fromCenter(center, w, h) {
        return new Rect(center.x - w / 2, center.y - h / 2, w, h);
    }

    /**
     * Creates a new Rect with specified width and height, positioned at (0, 0).
     * @param {number|Vec2} width - The width, or a Vec2 representing size.
     * @param {number} [height] - The height (ignored if width is a Vec2).
     * @returns {Rect}
     */
    static fromSize(width, height) {
        if (width instanceof Vec2) {
            return new Rect(0, 0, width.width, width.height);
        }
        return new Rect(0, 0, width, height);
    }

    /**
     * Checks if a point is contained inside the bounds of this rectangle (inclusive).
     * @param {Vec2} point - The point to test.
     * @returns {boolean}
     */
    contains(point) {
        if (!(point instanceof Vec2)) return false;
        return point.x >= this.left && point.x <= this.right &&
               point.y >= this.top && point.y <= this.bottom;
    }

    /**
     * Checks if this rectangle overlaps with another rectangle.
     * @param {Rect} other - The other rectangle.
     * @returns {boolean}
     */
    overlaps(other) {
        if (!(other instanceof Rect)) return false;
        return this.left < other.right && this.right > other.left &&
               this.top < other.bottom && this.bottom > other.top;
    }

    /**
     * Creates a copy of the rectangle with optional overridden properties.
     * @param {object} params - Override parameters.
     * @param {number} [params.x]
     * @param {number} [params.y]
     * @param {number} [params.width]
     * @param {number} [params.height]
     * @returns {Rect}
     */
    copyWith({ x, y, width, height }) {
        return new Rect(x ?? this.x, y ?? this.y, width ?? this.w, height ?? this.h);
    }

    /**
     * Moves the rectangle by a displacement vector or scalar offset.
     * @param {Vec2|number} v - The offset vector or scalar.
     * @returns {Rect} A new moved Rect.
     */
    move(v) {
        if (v instanceof Vec2) {
            return new Rect(this.x + v.x, this.y + v.y, this.w, this.h);
        }
        return new Rect(this.x + v, this.y + v, this.w, this.h);
    }

    /**
     * Scales the size of this rectangle by a scale factor.
     * @param {Vec2|number} s - The scale factor vector or scalar.
     * @returns {Rect} A new scaled Rect.
     */
    scale(s) {
        if (s instanceof Vec2) {
            return new Rect(this.x, this.y, this.w * s.x, this.h * s.y);
        }
        return new Rect(this.x, this.y, this.w * s, this.h * s);
    }
}
