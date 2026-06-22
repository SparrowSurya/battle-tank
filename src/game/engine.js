import CanvasRenderer from '../core/renderer.js';
import Color from '../core/color.js';
import Vec2 from '../core/vec2.js';
import InputManager from './input.js';
import Terrain from './terrain.js';
import Tank from './tank.js';

export default class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new CanvasRenderer(canvas);
        
        const seed = Date.now();
        const squnit = 2;
        
        this.background = Color.fromHex("#87CEEB");
        this.gravity = 250;
        
        this.terrain = new Terrain(canvas.width, canvas.height, squnit, seed);
        this.tank = new Tank(canvas.width / 2);
        this.input = new InputManager();
        
        this.projectiles = [];
        this.lastTime = 0;
    }

    start() {
        // Set canvas styling
        this.canvas.style.backgroundColor = this.background.toString();
        
        // Generate initial terrain
        this.terrain.generate();
        
        // Start listening to inputs
        this.input.listen(this.canvas);
        
        // Run loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        // Cap dt to avoid massive physics jumps if tab goes background
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        const inputSnapshot = this.input.getSnapshot();

        // 1. Settle terrain if mouse is present (matches original logic)
        if (inputSnapshot.mouse.present) {
            this.terrain.settle();
        }

        // 2. Update tank (handles movement & aiming/firing)
        const newProjectile = this.tank.update(dt, inputSnapshot, this.terrain);
        if (newProjectile) {
            this.projectiles.push(newProjectile);
        }

        // 3. Update projectiles and check collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, this.gravity);

            if (p.isOutOfBounds(this.terrain)) {
                this.projectiles.splice(i, 1);
            } else if (p.hasCollided(this.terrain)) {
                // Destruct terrain at collision point
                this.terrain.modify(p.pos.x, p.pos.y);
                this.terrain.settle();
                // Remove projectile
                this.projectiles.splice(i, 1);
            }
        }
    }

    draw() {
        // 1. Clear screen
        this.renderer.clear(this.background);

        // 2. Draw terrain elements
        this.terrain.draw(this.renderer);
        this.terrain.drawSurface(this.renderer);
        
        if (this.terrain.squnit >= 5) {
            this.terrain.drawVertices(this.renderer);
        }

        // 3. Draw tank aiming helpers and tank itself
        this.tank.drawProjectilePath(this.renderer, this.terrain, this.input.getSnapshot().mouse, this.gravity);
        this.tank.drawAim(this.renderer, this.terrain, this.input.getSnapshot().mouse);
        this.tank.draw(this.renderer, this.terrain);

        // 4. Draw projectiles
        for (const p of this.projectiles) {
            p.draw(this.renderer);
        }
    }
}
