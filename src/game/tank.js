import Vec2 from '../core/vec2.js';
import Color from '../core/color.js';
import { clamp, isSome, inRange, updateProjectile } from '../core/utils.js';
import Projectile from './projectile.js';

export default class Tank {
    constructor(x, width = 25) {
        this.x = x;
        this.width = width;
        this.height = 16;
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

    update(dt, input, terrain) {
        const { keyboard, mouse } = input;
        
        // 1. Move tank with uniform velocity along the terrain profile
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

        // 2. Firing trigger logic
        let firedProjectile = null;
        const nozzleInfo = this.getNozzleInfo(terrain);

        if (nozzleInfo) {
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
        }

        return firedProjectile;
    }

    getNozzleInfo(terrain) {
        const info = terrain.surfaceInfo(this.x);
        if (info === null) return null;

        const nozzleOffset = 10;
        const slopeAngle = Math.atan(info.slope);
        const nozzlePos = new Vec2(
            this.x + nozzleOffset * Math.sin(slopeAngle),
            info.y - nozzleOffset * Math.cos(slopeAngle)
        );
        return { nozzlePos, slopeAngle, info };
    }

    draw(renderer, terrain) {
        const tankWidth = this.width;
        const tankHeight = this.height;

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
            const avgY = (sumY / count) + 1;
            const avgSlope = sumSlope / count;
            const angle = Math.atan(avgSlope);

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
                avgY + (p.x * sin + p.y * cos)
            ));

            renderer.drawPolygon(points, this.color);
        }
    }

    drawAim(renderer, terrain, mouse) {
        const nozzleInfo = this.getNozzleInfo(terrain);
        if (!nozzleInfo) return;
        const { nozzlePos, slopeAngle } = nozzleInfo;

        if (this.trigger.aimStart && mouse.present) {
            const drag = new Vec2(mouse.x - this.trigger.aimStart.x, mouse.y - this.trigger.aimStart.y);
            const dragLength = drag.length();
            const nozzleDir = dragLength > 0 ? drag.neg().normalise() : new Vec2(this.face, 0);

            // Draw nozzle line
            renderer.drawLine(nozzlePos, nozzlePos.add(nozzleDir.mul(15)), 'white', 4);
            // Draw pull back line
            renderer.drawLine(this.trigger.aimStart, new Vec2(mouse.x, mouse.y), Color.fromName('black'), 1);
        } else {
            const defaultAngle = slopeAngle + (this.face === -1 ? Math.PI : 0);
            const nozzleDir = new Vec2(Math.cos(defaultAngle), Math.sin(defaultAngle));
            renderer.drawLine(nozzlePos, nozzlePos.add(nozzleDir.mul(15)), 'white', 4);
        }
    }

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
