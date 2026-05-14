
class Rect {
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

    get left() { return this.x; }
    get right() { return this.x + this.w; }
    get top() { return this.y; }
    get bottom() { return this.y + this.h; }

    get center() {
        return new Vec2(this.x + this.w / 2, this.y + this.h / 2);
    }

    get size() {
        return new Vec2(this.w, this.h);
    }

    get pos() {
        return new Vec2(this.x, this.y);
    }

    static fromCenter(center, w, h) {
        return new Rect(center.x - w / 2, center.y - h / 2, w, h);
    }

    static fromSize(width, height) {
        if (width instanceof Vec2) {
            return Rect(0, 0, width.width, width.height);
        }
        return Rect(0, 0, width, height);
    }

    contains(point) {
        if (!(point instanceof Vec2)) return false;
        return point.x >= this.left && point.x <= this.right &&
               point.y >= this.top && point.y <= this.bottom;
    }

    overlaps(other) {
        if (!(other instanceof Rect)) return false;
        return this.left < other.right && this.right > other.left &&
               this.top < other.bottom && this.bottom > other.top;
    }

    copy() {
        return new Rect(this.x, this.y, this.w, this.h);
    }

    move(v) {
        if (v instanceof Vec2) {
            return new Rect(this.x + v.x, this.y + v.y, this.w, this.h);
        }
        return new Rect(this.x + v, this.y + v, this.w, this.h);
    }

    scale(s) {
        if (s instanceof Vec2) {
            return new Rect(this.x, this.y, this.w * s.x, this.h * s.y);
        }
        return new Rect(this.x, this.y, this.w * s, this.h * s);
    }
}
