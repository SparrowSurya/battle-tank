class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        Object.freeze(this);
    }

    static zero() {
        return new Vec2(0, 0);
    }

    static all(v) {
        return new Vec2(v, v);
    }

    add(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x + other.x, this.y + other.y);
        }
        return new Vec2(this.x + other, this.y + other);
    }

    sub(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x - other.x, this.y - other.y);
        }
        return new Vec2(this.x - other, this.y - other);
    }

    mul(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x * other.x, this.y * other.y);
        }
        return new Vec2(this.x * other, this.y * other);
    }

    div(other) {
        if (other instanceof Vec2) {
            return new Vec2(this.x / other.x, this.y / other.y);
        }
        return new Vec2(this.x / other, this.y / other);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    equals(other) {
        if (!(other instanceof Vec2)) return false;
        return this.x === other.x && this.y === other.y;
    }

    copy() {
        return new Vec2(this.x, this.y);
    }

    distance(v) {
        return this.sub(v).length();
    }

    normalise() {
        const len = this.length();
        if (len == 0) {
            return Vec2.zero();
        }
        return this.div(len);
    }
}
