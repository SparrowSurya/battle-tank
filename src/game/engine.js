import CanvasRenderer from '../core/renderer.js';
import Color from '../core/color.js';
import Vec2 from '../core/vec2.js';
import Rect from '../core/rect.js';
import InputManager from './input.js';
import Terrain from './terrain.js';
import Tank from './tank.js';
import { spawnExplosion } from './particle.js';
import {
    createRedTankHull,
    createBlueTankHull,
    createTankBarrel,
    createProjectileSprite
} from '../core/utils.js';

/**
 * The core controller orchestrating game lifecycle loop, turn state resolutions, physics, and sci-fi HUD rendering.
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
        
        this.background = Color.fromHex("#121824"); // Dark space themed background
        this.gravity = 250;
        
        this.terrain = new Terrain(canvas.width, canvas.height, squnit, seed);
        
        // Two players: Blue (left) and Red (right)
        this.tanks = {
            blue: new Tank(canvas.width * 0.15, 'blue'),
            red: new Tank(canvas.width * 0.85, 'red')
        };
        // Blue tank faces right, Red tank faces left
        this.tanks.blue.face = 1;
        this.tanks.red.face = -1;

        this.input = new InputManager();
        
        this.projectiles = [];
        this.particles = [];
        
        // Turn state management variables
        this.activePlayer = 'blue'; // 'blue' or 'red'
        this.turnState = 'waiting_for_input'; // 'waiting_for_input' | 'projectile_active' | 'post_collision_delay' | 'game_over'
        this.turnTimer = 0;
        this.winner = null;
        
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
        
        // Initialize tanks Y positions on the surface
        this.tanks.blue.y = this.tanks.blue.getSurfaceHeightAndSlope(this.terrain).y;
        this.tanks.red.y = this.tanks.red.getSurfaceHeightAndSlope(this.terrain).y;
        
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
     * Resets the entire match state for a restart.
     */
    resetGame() {
        this.terrain.generate();
        
        this.tanks.blue.x = this.canvas.width * 0.15;
        this.tanks.blue.y = null; // Re-resolve on next update
        this.tanks.blue.health = 100;
        this.tanks.blue.fuel = this.tanks.blue.maxFuel;
        this.tanks.blue.face = 1;

        this.tanks.red.x = this.canvas.width * 0.85;
        this.tanks.red.y = null;
        this.tanks.red.health = 100;
        this.tanks.red.fuel = this.tanks.red.maxFuel;
        this.tanks.red.face = -1;

        this.projectiles = [];
        this.particles = [];
        
        this.activePlayer = 'blue';
        this.turnState = 'waiting_for_input';
        this.winner = null;
    }

    /**
     * Swaps the active player and resets budgets.
     */
    swapTurns() {
        this.activePlayer = this.activePlayer === 'blue' ? 'red' : 'blue';
        
        // Reset fuel/movement budget for both players
        this.tanks.blue.fuel = this.tanks.blue.maxFuel;
        this.tanks.red.fuel = this.tanks.red.maxFuel;
        
        this.turnState = 'waiting_for_input';
    }

    /**
     * Advances game entity coordinates, updates particles, checks collisions, and resolves turn states.
     * @param {number} dt - Time delta in seconds.
     */
    update(dt) {
        const inputSnapshot = this.input.getSnapshot();

        // 1. Settle terrain gravel/sand
        this.terrain.settle();

        // 2. Update active explosions/particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 3. Handle Game Over state
        if (this.turnState === 'game_over') {
            const clicked = inputSnapshot.mouse.clicked;
            const mousePos = new Vec2(inputSnapshot.mouse.x, inputSnapshot.mouse.y);
            const buttonClicked = clicked && this.restartBtnRect && this.restartBtnRect.contains(mousePos);

            if (inputSnapshot.keyboard.key === 'Enter' || buttonClicked) {
                // Prevent immediate click registration in next turn
                inputSnapshot.mouse.clicked = false;
                this.input.mouse.clicked = false;
                this.resetGame();
            }
            return; // Skip all other updates
        }

        // 4. Update tanks (handles movement, gravity, aiming, and firing checks)
        const isBlueTurn = this.activePlayer === 'blue' && this.turnState === 'waiting_for_input';
        const isRedTurn = this.activePlayer === 'red' && this.turnState === 'waiting_for_input';

        const projBlue = this.tanks.blue.update(dt, inputSnapshot, this.terrain, this.gravity, this.projectiles.length, isBlueTurn);
        const projRed = this.tanks.red.update(dt, inputSnapshot, this.terrain, this.gravity, this.projectiles.length, isRedTurn);

        // Spawn fired projectile
        const newProjectile = projBlue || projRed;
        if (newProjectile) {
            this.projectiles.push(newProjectile);
            this.turnState = 'projectile_active';
        }

        // 5. Update active projectiles and resolve collisions (with tanks or terrain)
        if (this.turnState === 'projectile_active') {
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.update(dt, this.gravity);

                let hit = false;
                let hitPos = null;

                const shooterTank = this.tanks[p.shooter];
                const shooterBounds = shooterTank.getBoundingBox();
                if (p.ignoreShooter && !shooterBounds.contains(p.pos)) {
                    p.ignoreShooter = false;
                }

                // Check collision against Blue Tank
                const hitBlue = !(p.shooter === 'blue' && p.ignoreShooter) && this.tanks.blue.getBoundingBox().contains(p.pos);
                // Check collision against Red Tank
                const hitRed = !(p.shooter === 'red' && p.ignoreShooter) && this.tanks.red.getBoundingBox().contains(p.pos);

                if (hitBlue) {
                    this.tanks.blue.health = Math.max(0, this.tanks.blue.health - 20);
                    hit = true;
                    hitPos = p.pos;
                }
                else if (hitRed) {
                    this.tanks.red.health = Math.max(0, this.tanks.red.health - 20);
                    hit = true;
                    hitPos = p.pos;
                }
                // Check collision against Terrain surface
                else if (p.hasCollided(this.terrain)) {
                    this.terrain.modify(p.pos.x, p.pos.y);
                    this.terrain.settle();
                    hit = true;
                    hitPos = p.pos;
                }
                // Check if out of bounds (off screen left, right, or bottom)
                else if (p.isOutOfBounds(this.terrain)) {
                    hit = true;
                }

                if (hit) {
                    this.projectiles.splice(i, 1);
                    if (hitPos) {
                        // Spawn explosion sparks
                        spawnExplosion(this.particles, hitPos, 30);
                    }

                    // Check win/loss state
                    if (this.tanks.blue.health <= 0) {
                        this.turnState = 'game_over';
                        this.winner = 'Red';
                    } else if (this.tanks.red.health <= 0) {
                        this.turnState = 'game_over';
                        this.winner = 'Blue';
                    } else {
                        // Start 1.5s delay before swapping turn
                        this.turnState = 'post_collision_delay';
                        this.turnTimer = 1.5;
                    }
                }
            }
        }

        // 6. Handle turn transition timer delay
        if (this.turnState === 'post_collision_delay') {
            this.turnTimer -= dt;
            if (this.turnTimer <= 0) {
                this.swapTurns();
            }
        }
    }

    /**
     * Renders game elements, HUD elements with neon accents, and the end game overlay.
     */
    draw() {
        // 1. Clear screen
        this.renderer.clear(this.background);

        // 2. Draw terrain
        this.terrain.draw(this.renderer);
        this.terrain.drawSurface(this.renderer);
        
        if (this.terrain.squnit >= 5) {
            this.terrain.drawVertices(this.renderer);
        }

        const inputSnapshot = this.input.getSnapshot();

        // 3. Draw Red and Blue tanks (hull and aiming turrets)
        this.tanks.blue.drawProjectilePath(this.renderer, this.terrain, inputSnapshot.mouse, this.gravity);
        this.tanks.blue.drawAim(this.renderer, this.terrain, inputSnapshot.mouse, this.sprites.tankBarrel);
        this.tanks.blue.draw(this.renderer, this.terrain, this.sprites.tankBlue);

        this.tanks.red.drawProjectilePath(this.renderer, this.terrain, inputSnapshot.mouse, this.gravity);
        this.tanks.red.drawAim(this.renderer, this.terrain, inputSnapshot.mouse, this.sprites.tankBarrel);
        this.tanks.red.draw(this.renderer, this.terrain, this.sprites.tankRed);

        // 4. Draw projectiles
        for (const p of this.projectiles) {
            p.draw(this.renderer, this.sprites.projectile);
        }

        // 5. Draw particles
        for (const p of this.particles) {
            p.draw(this.renderer);
        }

        // 6. Render Sci-Fi HUD
        this.drawHUD();

        // 7. Render Game Over overlay
        if (this.turnState === 'game_over') {
            this.drawGameOverOverlay();
        }
    }

    /**
     * Draws the sci-fi themed HUD containing health bars, fuel gauges, and active turn indicators.
     */
    drawHUD() {
        const width = this.canvas.width;
        
        // A. Header background panel (glassmorphism panel)
        const hudPanel = new Rect(10, 5, width - 20, 48);
        this.renderer.drawRect(hudPanel, Color.fromHex('#0f172a').withAlpha(0.75));
        this.renderer.drawRect(hudPanel, Color.fromHex('#334155').withAlpha(0.4), 1);

        // B. Pulsing glow factor for turn highlight
        const glowPulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
        const activeGlowAlpha = 0.3 + 0.45 * glowPulse;

        // C. Blue Player Panel (LHS)
        const isBlueActive = this.activePlayer === 'blue' && this.turnState === 'waiting_for_input';
        if (isBlueActive) {
            // Draw glowing panel around active player
            const glowBox = new Rect(15, 8, 160, 42);
            this.renderer.drawRect(glowBox, Color.fromHex('#00ffff').withAlpha(activeGlowAlpha * 0.3));
            this.renderer.drawRect(glowBox, Color.fromHex('#00ffff').withAlpha(activeGlowAlpha), 1);
        }
        
        // Draw "Blue" text
        this.renderer.drawText("BLUE", new Vec2(50, 20), Color.fromHex('#00ffff'), {
            fontSize: 13,
            fontFamily: 'monospace',
            align: 'left'
        });

        // Draw Blue Health Bar (LHS, no text)
        const blueHPBox = new Rect(50, 30, 110, 8);
        this.renderer.drawRect(blueHPBox, Color.fromHex('#000000').withAlpha(0.6));
        const blueHPFillWidth = 110 * (this.tanks.blue.health / 100);
        if (blueHPFillWidth > 0) {
            const blueHPFill = new Rect(50, 30, blueHPFillWidth, 8);
            this.renderer.drawRect(blueHPFill, Color.fromHex('#00e5ff'));
        }

        // Draw Blue Fuel Bar (thin, below health) only if active
        if (isBlueActive) {
            const blueFuelBox = new Rect(50, 41, 110, 3);
            this.renderer.drawRect(blueFuelBox, Color.fromHex('#000000').withAlpha(0.6));
            const blueFuelWidth = 110 * (this.tanks.blue.fuel / this.tanks.blue.maxFuel);
            if (blueFuelWidth > 0) {
                const blueFuelFill = new Rect(50, 41, blueFuelWidth, 3);
                this.renderer.drawRect(blueFuelFill, Color.fromHex('#ffaa00'));
            }
        }

        // D. Top Center Title: "Battle Tanks"
        this.renderer.drawText("BATTLE TANKS", new Vec2(width / 2, 28), Color.fromHex('#f8fafc'), {
            fontSize: 16,
            fontFamily: 'sans-serif',
            align: 'center'
        });

        // E. Red Player Panel (RHS)
        const isRedActive = this.activePlayer === 'red' && this.turnState === 'waiting_for_input';
        if (isRedActive) {
            // Draw glowing panel around active player
            const glowBox = new Rect(width - 175, 8, 160, 42);
            this.renderer.drawRect(glowBox, Color.fromHex('#ff3366').withAlpha(activeGlowAlpha * 0.3));
            this.renderer.drawRect(glowBox, Color.fromHex('#ff3366').withAlpha(activeGlowAlpha), 1);
        }

        // Draw "Red" text
        this.renderer.drawText("RED", new Vec2(width - 50, 20), Color.fromHex('#ff3366'), {
            fontSize: 13,
            fontFamily: 'monospace',
            align: 'right'
        });

        // Draw Red Health Bar (RHS, no text)
        const redHPBox = new Rect(width - 160, 30, 110, 8);
        this.renderer.drawRect(redHPBox, Color.fromHex('#000000').withAlpha(0.6));
        const redHPFillWidth = 110 * (this.tanks.red.health / 100);
        if (redHPFillWidth > 0) {
            const redHPFill = new Rect(width - 160, 30, redHPFillWidth, 8);
            this.renderer.drawRect(redHPFill, Color.fromHex('#ff1744'));
        }

        // Draw Red Fuel Bar (thin, below health) only if active
        if (isRedActive) {
            const redFuelBox = new Rect(width - 160, 41, 110, 3);
            this.renderer.drawRect(redFuelBox, Color.fromHex('#000000').withAlpha(0.6));
            const redFuelWidth = 110 * (this.tanks.red.fuel / this.tanks.red.maxFuel);
            if (redFuelWidth > 0) {
                const redFuelFill = new Rect(width - 160, 41, redFuelWidth, 3);
                this.renderer.drawRect(redFuelFill, Color.fromHex('#ffaa00'));
            }
        }
    }

    /**
     * Draws the overlay screen when the game ends and a winner is announced.
     */
    drawGameOverOverlay() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Dark transparent background overlay
        const overlay = new Rect(0, 0, width, height);
        this.renderer.drawRect(overlay, Color.fromHex('#0f172a').withAlpha(0.85));

        // Winner Text
        const winnerColor = this.winner === 'Blue' ? Color.fromHex('#00ffff') : Color.fromHex('#ff3366');
        this.renderer.drawText(`${this.winner.toUpperCase()} PLAYER WINS!`, new Vec2(width / 2, height / 2 - 30), winnerColor, {
            fontSize: 28,
            fontFamily: 'monospace',
            align: 'center'
        });

        // Subtext instructions
        this.renderer.drawText("Press ENTER or click restart to play again", new Vec2(width / 2, height / 2 + 10), Color.fromHex('#94a3b8'), {
            fontSize: 12,
            fontFamily: 'sans-serif',
            align: 'center'
        });

        // Restart Button Box
        const btnW = 120;
        const btnH = 34;
        const btnX = width / 2 - btnW / 2;
        const btnY = height / 2 + 35;
        this.restartBtnRect = new Rect(btnX, btnY, btnW, btnH);

        // Hover Check
        const mouse = this.input.getSnapshot().mouse;
        const mousePos = new Vec2(mouse.x, mouse.y);
        const hovered = this.restartBtnRect.contains(mousePos);

        // Draw button
        const btnColor = hovered ? Color.fromHex('#334155') : Color.fromHex('#1e293b');
        const borderColor = hovered ? winnerColor : Color.fromHex('#475569');
        
        this.renderer.drawRect(this.restartBtnRect, btnColor);
        this.renderer.drawRect(this.restartBtnRect, borderColor, 2);

        this.renderer.drawText("RESTART", new Vec2(width / 2, btnY + btnH / 2), Color.fromHex('#f8fafc'), {
            fontSize: 12,
            fontFamily: 'monospace',
            align: 'center'
        });
    }
}
