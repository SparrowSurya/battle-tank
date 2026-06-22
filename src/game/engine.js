import CanvasRenderer from '../core/renderer.js';
import Color from '../core/color.js';
import Vec2 from '../core/vec2.js';
import InputManager from './input.js';
import Terrain from './terrain.js';
import Tank from './tank.js';
import {
    createRedTankHull,
    createBlueTankHull,
    createTankBarrel,
    createProjectileSprite
} from '../core/utils.js';

/**
 * The core controller orchestrating game lifecycle loop, updates, physics step updates, and rendering.
 */
export default class GameEngine {
    /**
     * Creates a new GameEngine instance.
     * @param {HTMLCanvasElement} canvas - HTML5 Canvas element.
     */
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

        // Initialize sprite container and trigger asynchronous asset loading
        this.sprites = {
            tankRed: null,
            tankBlue: null,
            tankBarrel: null,
            projectile: null
        };
        this.loadAssets();
    }

    /**
     * Loads the visual assets asynchronously and processes them to apply transparency.
     */
    loadAssets() {
        this.sprites.tankRed = createRedTankHull();
        this.sprites.tankBlue = createBlueTankHull();
        this.sprites.tankBarrel = createTankBarrel();
        this.sprites.projectile = createProjectileSprite();
    }

    /**
     * Sets canvas background, generates terrain, triggers input listeners and starts the game loop.
     */
    start() {
        // Set canvas styling
        this.canvas.style.backgroundColor = this.background.toString();
        
        // Generate initial terrain
        this.terrain.generate();
        
        // Initialize tank's vertical position on the surface
        this.tank.y = this.tank.getSurfaceHeightAndSlope(this.terrain).y;
        
        // Start listening to inputs
        this.input.listen(this.canvas);
        
        // Run loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    /**
     * Standard animation frame callback loop.
     * @param {number} time - High-resolution timestamp from requestAnimationFrame.
     */
    loop(time) {
        // Cap dt to avoid massive physics jumps if tab goes background
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }

    /**
     * Advances game entity coordinates and resolves physical collisions.
     * @param {number} dt - Time delta in seconds.
     */
    update(dt) {
        const inputSnapshot = this.input.getSnapshot();

        // 1. Settle terrain if mouse is present (matches original logic)
        if (inputSnapshot.mouse.present) {
            this.terrain.settle();
        }

        // 2. Update tank (handles movement & aiming/firing)
        const newProjectile = this.tank.update(dt, inputSnapshot, this.terrain, this.gravity, this.projectiles.length);
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

    /**
     * Directs renderer calls to repaint game elements.
     */
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
        this.tank.drawAim(this.renderer, this.terrain, this.input.getSnapshot().mouse, this.sprites.tankBarrel);
        this.tank.draw(this.renderer, this.terrain, this.sprites.tankRed);

        // 4. Draw projectiles
        for (const p of this.projectiles) {
            p.draw(this.renderer, this.sprites.projectile);
        }
    }
}
