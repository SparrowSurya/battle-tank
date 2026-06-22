import Vec2 from '../core/vec2.js';
import Color from '../core/color.js';

/**
 * Represents a single visual particle that moves, fades, and decays over time.
 */
export class Particle {
    /**
     * Creates a new Particle.
     * @param {Vec2} pos - Initial position coordinates.
     * @param {Vec2} vel - Speed and direction vector.
     * @param {Color} color - Base color.
     * @param {number} size - Radius of the particle.
     * @param {number} life - Total lifetime of the particle in seconds.
     */
    constructor(pos, vel, color, size, life) {
        this.pos = pos;
        this.vel = vel;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
    }

    /**
     * Updates particle position and decays lifetime.
     * @param {number} dt - Time delta in seconds.
     */
    update(dt) {
        this.pos = this.pos.add(this.vel.mul(dt));
        this.life -= dt;
    }

    /**
     * Renders the particle using alpha fading.
     * @param {CanvasRenderer} renderer - The drawing renderer.
     */
    draw(renderer) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const c = this.color.withAlpha(alpha);
        renderer.drawCircle(this.pos, this.size, c);
    }
}

/**
 * Spawns a radial explosion of sparks/particles at a specific location.
 * @param {Particle[]} particlesList - The list to append generated particles into.
 * @param {Vec2} pos - The collision/explosion origin coordinates.
 * @param {number} [count=30] - Count of sparks to generate.
 */
export function spawnExplosion(particlesList, pos, count = 30) {
    const colors = [
        Color.fromHex('#ff3300'), // Neon Red
        Color.fromHex('#ff6600'), // Orange
        Color.fromHex('#ffcc00'), // Yellow
        Color.fromHex('#ffffff')  // White hot core
    ];

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 100;
        const vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 1.5 + Math.random() * 3.5;
        const life = 0.3 + Math.random() * 0.5;

        particlesList.push(new Particle(pos, vel, color, size, life));
    }
}
