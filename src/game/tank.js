import Vec2 from '../core/vec2.js';
import Color from '../core/color.js';
import { clamp, isSome, inRange, updateProjectile } from '../core/utils.js';
import Projectile from './projectile.js';

/**
 * Handles the tank physics, movement, gravity/falling updates, aiming barrel, charge power, and projectile path prediction.
 */
export default class Tank {
    /**
     * Creates a new Tank instance.
     * @param {number} x - Horizontal starting pixel coordinate.
     * @param {number} [width=32] - Width of the tank box.
     */
    constructor(x, width = 32) {
        this.x = x;
        this.y = null; // Set dynamically on start or first update
        this.velY = 0; // Vertical velocity for falling gravity physics
        this.width = width;
        this.height = 20;
        this.velocity = new Vec2(80, 30);
        this.color = Color.fromHex('#556B2F');
        this.minPower = 10;
        this.maxPower = 120;
        this.face = 1; // 1 for right, -1 for left
        this.trigger = {
            powerMul: 3,
            power: 0,
            aimStart: null,
        };
    }

    /**
     * Helper to resolve the average ground height and slope directly beneath the tank's width.
     * @param {Terrain} terrain - Terrain entity.
     * @returns {{y: number, slope: number, hasGround: boolean}} Ground profile details.
     */
    getSurfaceHeightAndSlope(terrain) {
        const tankWidth = this.width;
        const leftX = Math.floor(this.x - tankWidth / 2);
        const rightX = Math.floor(this.x + tankWidth / 2);

        let sumY = 0;
        let sumSlope = 0;
        let count = 0;

        for (let x = leftX; x <= rightX; x++) {
            const info = terrain.surfaceInfo(x);
            if (info && info.y !== null) {
                sumY += info.y;
                sumSlope += info.slope;
                count++;
            }
        }

        if (count > 0) {
            return {
                y: (sumY / count) + 1,
                slope: sumSlope / count,
                hasGround: true
            };
        }
        return {
            y: terrain.size.y, // Fallback to bottom of the screen
            slope: 0,
            hasGround: false
        };
    }

    /**
     * Updates the tank's physics state (horizontal movements, gravity vertical fall, landing, aiming limits).
     * @param {number} dt - Time delta in seconds.
     * @param {object} input - Snapshot of active input manager states.
     * @param {Terrain} terrain - Game terrain entity.
     * @param {number} gravity - Gravity rate (pixels/second^2).
     * @param {number} activeProjectilesCount - Count of currently active projectiles in the air.
     * @returns {Projectile|null} A new Projectile instance if fired, otherwise null.
     */
    update(dt, input, terrain, gravity, activeProjectilesCount) {
        const { keyboard, mouse } = input;
        
        // 0. Initialize Y coordinate to surface height if not yet set
        const initialSurface = this.getSurfaceHeightAndSlope(terrain);
        if (this.y === null) {
            this.y = initialSurface.y;
        }

        // 1. Move tank horizontally along the terrain profile
        if (isSome(keyboard.key)) {
            const isLeft = keyboard.key === 'ArrowLeft';
            const isRight = keyboard.key === 'ArrowRight';

            if (isLeft) this.face = -1;
            if (isRight) this.face = 1;

            if (isLeft || isRight) {
                const info = terrain.surfaceInfo(this.x);
                const slopeVal = info ? info.slope : 0;
                const speed = this.velocity.x;
                // Adjust horizontal movement to maintain constant speed along the slope
                const dx = (speed * dt) / Math.sqrt(1 + slopeVal * slopeVal);
                
                let newX = isLeft ? this.x - dx : this.x + dx;
                this.x = clamp(newX, this.width / 2, terrain.size.width);
            }
        }

        // 2. Apply falling vertical gravity physics
        const currentSurface = this.getSurfaceHeightAndSlope(terrain);
        const inAirThreshold = 1.0;
        
        if (this.y < currentSurface.y - inAirThreshold) {
            // Apply gravity update
            this.velY += gravity * dt;
            this.y += this.velY * dt;

            // Check if we hit the ground this frame
            if (this.y >= currentSurface.y) {
                this.y = currentSurface.y;
                this.velY = 0;
            }
        } else {
            // Snap to surface profile and reset vertical velocity
            this.y = currentSurface.y;
            this.velY = 0;
        }

        // 3. Firing trigger logic (only allowed if there are no active projectiles)
        let firedProjectile = null;
        const nozzleInfo = this.getNozzleInfo(terrain);

        if (nozzleInfo && activeProjectilesCount === 0) {
            const { nozzlePos } = nozzleInfo;
            if (mouse.clicked === true) {
                if (!this.trigger.aimStart && mouse.present) {
                    this.trigger.aimStart = new Vec2(mouse.x, mouse.y);
                }
                if (this.trigger.aimStart) {
                    const drag = new Vec2(mouse.x - this.trigger.aimStart.x, mouse.y - this.trigger.aimStart.y);
                    this.trigger.power = clamp(drag.length(), this.minPower, this.maxPower);
                }
            } else {
                if (this.trigger.aimStart) {
                    const drag = new Vec2(mouse.x - this.trigger.aimStart.x, mouse.y - this.trigger.aimStart.y);
                    const power = clamp(drag.length(), this.minPower, this.maxPower);
                    const vel = drag.neg().normalise().mul(power * this.trigger.powerMul);

                    firedProjectile = new Projectile(nozzlePos, vel);

                    this.trigger.aimStart = null;
                    this.trigger.power = 0;
                }
            }
        } else if (activeProjectilesCount > 0) {
            // Lock aiming states if shots are currently active in the air
            this.trigger.aimStart = null;
            this.trigger.power = 0;
        }

        return firedProjectile;
    }

    /**
     * Calculates the barrel nozzle coordinates. If the tank is airborne, slope calculations are bypassed.
     * @param {Terrain} terrain - Terrain entity.
     * @returns {{nozzlePos: Vec2, slopeAngle: number, info: object}|null} Nozzle information details.
     */
    getNozzleInfo(terrain) {
        const info = terrain.surfaceInfo(this.x);
        const surface = this.getSurfaceHeightAndSlope(terrain);
        const inAir = this.y !== null && this.y < (surface.y - 1.0);
        
        const slopeAngle = inAir ? 0 : (info ? Math.atan(info.slope) : 0);
        
        const nozzleOffset = 10;
        const currentY = this.y !== null ? this.y : (info ? info.y : terrain.size.y);
        const nozzlePos = new Vec2(
            this.x + nozzleOffset * Math.sin(slopeAngle),
            currentY - nozzleOffset * Math.cos(slopeAngle)
        );
        return { nozzlePos, slopeAngle, info };
    }

    /**
     * Draws the tank. Supports drawing the loaded sprite, falling back to vector polygon.
     * @param {CanvasRenderer} renderer - Renderer object.
     * @param {Terrain} terrain - Terrain entity.
     * @param {HTMLCanvasElement|null} [spriteCanvas=null] - Loaded and processed sprite canvas.
     */
    draw(renderer, terrain, spriteCanvas = null) {
        if (!spriteCanvas) {
            this.drawVectorTank(renderer, terrain);
            return;
        }

        const surface = this.getSurfaceHeightAndSlope(terrain);
        const inAir = this.y !== null && this.y < (surface.y - 1.0);
        const angle = inAir ? 0 : Math.atan(surface.slope);

        const spriteHeight = this.height;
        const spriteWidth = spriteHeight * (spriteCanvas.width / spriteCanvas.height);

        renderer.ctx.save();
        renderer.ctx.translate(this.x, this.y);
        renderer.ctx.rotate(angle);
        renderer.ctx.scale(this.face, 1);

        renderer.ctx.drawImage(
            spriteCanvas,
            -spriteWidth / 2,
            -spriteHeight,
            spriteWidth,
            spriteHeight
        );

        renderer.ctx.restore();
    }

    /**
     * Draws the tank body polygon. Stays flat while airborne, aligns to slope when grounded.
     * @param {CanvasRenderer} renderer - Renderer object.
     * @param {Terrain} terrain - Terrain entity.
     */
    drawVectorTank(renderer, terrain) {
        const tankWidth = this.width;
        const tankHeight = this.height;

        const surface = this.getSurfaceHeightAndSlope(terrain);
        const inAir = this.y !== null && this.y < (surface.y - 1.0);
        const angle = inAir ? 0 : Math.atan(surface.slope);

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const hw = tankWidth / 2;
        const h = tankHeight;

        const corners = [
            { x: -hw, y: 0 },
            { x: hw, y: 0 },
            { x: hw, y: -h },
            { x: -hw, y: -h }
        ];

        const points = corners.map(p => new Vec2(
            this.x + (p.x * cos - p.y * sin),
            this.y + (p.x * sin + p.y * cos)
        ));

        renderer.drawPolygon(points, this.color);
    }

    /**
     * Renders the white barrel nozzle line or the rotating gun barrel sprite, along with drag aiming lines.
     * @param {CanvasRenderer} renderer - Renderer object.
     * @param {Terrain} terrain - Terrain entity.
     * @param {object} mouse - Current mouse coordinates snapshot.
     * @param {HTMLCanvasElement|null} [barrelCanvas=null] - Pre-processed barrel/turret sprite canvas.
     */
    drawAim(renderer, terrain, mouse, barrelCanvas = null) {
        const nozzleInfo = this.getNozzleInfo(terrain);
        if (!nozzleInfo) return;
        const { nozzlePos, slopeAngle } = nozzleInfo;

        // Calculate absolute barrel angle
        let angle = 0;
        let isAiming = false;

        if (this.trigger.aimStart && mouse.present) {
            const drag = new Vec2(mouse.x - this.trigger.aimStart.x, mouse.y - this.trigger.aimStart.y);
            const dragLength = drag.length();
            const nozzleDir = dragLength > 0 ? drag.neg().normalise() : new Vec2(this.face, 0);
            angle = Math.atan2(nozzleDir.y, nozzleDir.x);
            isAiming = true;
        } else {
            angle = slopeAngle + (this.face === -1 ? Math.PI : 0);
        }

        if (!barrelCanvas) {
            const nozzleDir = new Vec2(Math.cos(angle), Math.sin(angle));
            // Draw nozzle line
            renderer.drawLine(nozzlePos, nozzlePos.add(nozzleDir.mul(15)), 'white', 4);
            
            if (isAiming) {
                // Draw pull back line
                renderer.drawLine(this.trigger.aimStart, new Vec2(mouse.x, mouse.y), Color.fromName('black'), 1);
            }
            return;
        }

        // Draw barrel sprite
        const barrelHeight = this.height * 0.7;
        const barrelWidth = barrelHeight * (barrelCanvas.width / barrelCanvas.height);

        renderer.ctx.save();
        // Translate to the turret mounting point on top of hull
        renderer.ctx.translate(nozzlePos.x, nozzlePos.y);
        renderer.ctx.rotate(angle);

        // Pivot point at X=25% of width, Y=60% of height (turret center of sprite)
        const px = barrelWidth * 0.25;
        const py = barrelHeight * 0.60;

        renderer.ctx.drawImage(
            barrelCanvas,
            -px,
            -py,
            barrelWidth,
            barrelHeight
        );

        renderer.ctx.restore();

        if (isAiming) {
            // Draw pull back line
            renderer.drawLine(this.trigger.aimStart, new Vec2(mouse.x, mouse.y), Color.fromName('black'), 1);
        }
    }

    /**
     * Predicts and renders the dotted/solid orange path representing initial projectile trajectory.
     * @param {CanvasRenderer} renderer - Renderer object.
     * @param {Terrain} terrain - Terrain entity.
     * @param {object} mouse - Current mouse coordinates snapshot.
     * @param {number} gravity - Gravity rate.
     */
    drawProjectilePath(renderer, terrain, mouse, gravity) {
        if (!this.trigger.aimStart || !mouse.present) return;

        const nozzleInfo = this.getNozzleInfo(terrain);
        if (!nozzleInfo) return;
        const { nozzlePos } = nozzleInfo;

        const drag = new Vec2(mouse.x - this.trigger.aimStart.x, mouse.y - this.trigger.aimStart.y);
        const power = clamp(drag.length(), this.minPower, this.maxPower);
        const vel = drag.neg().normalise().mul(power * this.trigger.powerMul);

        const points = [nozzlePos];
        const stepDt = 0.05;
        let currentVel = vel;
        let currentPos = nozzlePos;

        for (let i = 0; i < 200; i++) {
            const next = updateProjectile(currentPos, currentVel, gravity, stepDt);
            currentPos = next.pos;
            currentVel = next.vel;

            if (currentPos.y > terrain.size.y || !inRange(currentPos.x, 0, terrain.size.x)) break;
            
            const sY = terrain.surfaceY(currentPos.x);
            if (currentPos.y > sY) {
                points.push(currentPos);
                break;
            }

            points.push(currentPos);
        }

        renderer.drawPolygon(points, Color.fromName('orange').withAlpha(0.5), 2, false);
    }
}
