import Vec2 from '../core/vec2.js';
import Color from '../core/color.js';
import { inRange, updateProjectile } from '../core/utils.js';

export default class Projectile {
    constructor(pos, vel, radius = 5) {
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.color = Color.fromName('black');
    }

    update(dt, gravity) {
        const next = updateProjectile(this.pos, this.vel, gravity, dt);
        this.pos = next.pos;
        this.vel = next.vel;
    }

    draw(renderer) {
        renderer.drawCircle(this.pos, this.radius, this.color);
    }

    isOutOfBounds(terrain) {
        return this.pos.y > terrain.size.height || !inRange(this.pos.x, 0, terrain.size.width);
    }

    hasCollided(terrain) {
        const sY = terrain.surfaceY(this.pos.x);
        return this.pos.y >= sY;
    }
}
