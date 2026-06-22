/**
 * Represents a 2-dimensional vector used for coordinates, sizes, velocities, and math.
 */
export default class Vec2 {
    /**
     * Creates a new Vec2 instance.
     * @param {number|object} [x=0] - The X coordinate, or an object with x and y properties.
     * @param {number} [y=0] - The Y coordinate (ignored if x is an object).
     */
    constructor(x = 0, y = 0) {
        if (typeof x === 'object' && x !== null) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
        Object.freeze(this);
    }

    /**
     * Gets the width (alias for x).
     * @returns {number}
     */
    get width() { return this.x; }

    /**
     * Gets the height (alias for y).
     * @returns {number}
     */
    get height() { return this.y; }

    /**
     * Gets the columns count (alias for x).
     * @returns {number}
     */
    get cols() { return this.x; }

    /**
     * Gets the rows count (alias for y).
     * @returns {number}
     */
    get rows() { return this.y; }

    /**
     * Creates a zero vector (0, 0).
     * @returns {Vec2}
     */
    static zero() {
        return new Vec2(0, 0);
    }

    /**
     * Creates a vector with both components set to the same value.
     * @param {number} v - The value for both components.
     * @returns {Vec2}
     */
    static all(v) {
        return new Vec2(v, v);
    }

    /**
     * Adds another vector or scalar value to this vector.
     * @param {Vec2|number} other - The vector or scalar to add.
     * @returns {Vec2} A new vector containing the sum.
     */
    add(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x + other.x, this.y + other.y);
        }
        return new Vec2(this.x + other, this.y + other);
    }

    /**
     * Subtracts another vector or scalar value from this vector.
     * @param {Vec2|number} other - The vector or scalar to subtract.
     * @returns {Vec2} A new vector containing the difference.
     */
    sub(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x - other.x, this.y - other.y);
        }
        return new Vec2(this.x - other, this.y - other);
    }

    /**
     * Multiplies this vector by another vector or scalar value.
     * @param {Vec2|number} other - The vector or scalar to multiply by.
     * @returns {Vec2} A new vector containing the product.
     */
    mul(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x * other.x, this.y * other.y);
        }
        return new Vec2(this.x * other, this.y * other);
    }

    /**
     * Divides this vector by another vector or scalar value.
     * @param {Vec2|number} other - The vector or scalar divisor.
     * @returns {Vec2} A new vector containing the division result.
     */
    div(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x / other.x, this.y / other.y);
        }
        return new Vec2(this.x / other, this.y / other);
    }

    /**
     * Computes the magnitude (length) of the vector.
     * @returns {number}
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Checks if this vector is equal to another vector.
     * @param {*} other - The object to compare with.
     * @returns {boolean} True if components are identical.
     */
    equals(other) {
        if (!(other instanceof Vec2)) return false;
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Returns a copy of this vector.
     * @returns {Vec2}
     */
    copy() {
        return new Vec2(this.x, this.y);
    }

    /**
     * Returns a negated copy of this vector.
     * @returns {Vec2}
     */
    neg() {
        return new Vec2(-this.x, -this.y);
    }

    /**
     * Calculates the Euclidean distance between this vector and another vector.
     * @param {Vec2} v - The other vector.
     * @returns {number}
     */
    distance(v) {
        return this.sub(v).length();
    }

    /**
     * Normalizes this vector (scales it to have a length of 1).
     * If length is 0, returns a zero vector.
     * @returns {Vec2}
     */
    normalise() {
        const len = this.length();
        return len == 0 ? Vec2.zero() : this.div(len);
    }
}
