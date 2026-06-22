import Vec2 from '../core/vec2.js';
import Color from '../core/color.js';
import { inRange, updateProjectile } from '../core/utils.js';

/**
 * Handles a ballistics projectile moving through space with gravity.
 */
export default class Projectile {
    /**
     * Creates a new Projectile instance.
     * @param {Vec2} pos - Initial position.
     * @param {Vec2} vel - Initial velocity vector.
     * @param {number} [radius=5] - Radius of the projectile circle.
     */
    constructor(pos, vel, radius = 5) {
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.color = Color.fromName('black');
    }

    /**
     * Advances the projectile physical state by a time step.
     * @param {number} dt - Time delta in seconds.
     * @param {number} gravity - Gravity acceleration rate.
     */
    update(dt, gravity) {
        const next = updateProjectile(this.pos, this.vel, gravity, dt);
        this.pos = next.pos;
        this.vel = next.vel;
    }

    /**
     * Renders the projectile on screen.
     * @param {CanvasRenderer} renderer - The canvas renderer object.
     * @param {HTMLCanvasElement|null} [spriteCanvas=null] - The processed sprite canvas.
     */
    draw(renderer, spriteCanvas = null) {
        if (!spriteCanvas) {
            renderer.drawCircle(this.pos, this.radius, this.color);
            return;
        }

        const w = this.radius * 4;
        const h = w * (spriteCanvas.height / spriteCanvas.width);

        renderer.ctx.save();
        renderer.ctx.translate(this.pos.x, this.pos.y);
        const angle = Math.atan2(this.vel.y, this.vel.x);
        renderer.ctx.rotate(angle);

        renderer.ctx.drawImage(
            spriteCanvas,
            -w / 2,
            -h / 2,
            w,
            h
        );

        renderer.ctx.restore();
    }

    /**
     * Checks if the projectile has travelled outside the game boundaries.
     * @param {Terrain} terrain - The terrain entity to evaluate bounds against.
     * @returns {boolean} True if out of bounds.
     */
    isOutOfBounds(terrain) {
        return this.pos.y > terrain.size.height || !inRange(this.pos.x, 0, terrain.size.width);
    }

    /**
     * Evaluates whether the projectile has impacted the surface of the terrain.
     * @param {Terrain} terrain - The terrain entity.
     * @returns {boolean} True if collided.
     */
    hasCollided(terrain) {
        const sY = terrain.surfaceY(this.pos.x);
        return this.pos.y >= sY;
    }
}
