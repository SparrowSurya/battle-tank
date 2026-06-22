import Vec2 from '../core/vec2.js';
import Rect from '../core/rect.js';
import Color from '../core/color.js';
import { mulberry32 } from '../core/random.js';
import { clamp, lerp, avg, inRange } from '../core/utils.js';

/**
 * Manages the destructible grid terrain, wave rendering, settling, and slope calculation.
 */
export default class Terrain {
    /**
     * Creates a new Terrain instance.
     * @param {number} canvasWidth - Canvas width in pixels.
     * @param {number} canvasHeight - Canvas height in pixels.
     * @param {number} [squnit=2] - The size of each grid square in pixels.
     * @param {number} [seed=Date.now()] - PRNG seed for waves.
     */
    constructor(canvasWidth, canvasHeight, squnit = 2, seed = Date.now()) {
        this.squnit = squnit;
        this.size = new Vec2(canvasWidth, canvasHeight);
        this.grid = {
            rows: Math.floor(this.size.y / this.squnit),
            cols: Math.floor(this.size.x / this.squnit)
        };
        this.threshold = 0.5;
        this.vertices = [];
        this.waves = this.createWaves(seed);
        this.surfaceColor = Color.fromHex("#6B8E23");
        this.color = Color.fromHex("#6B8E23");
        this.maxDigStrength = 0.9;
    }

    /**
     * Generates sine wave profiles representing terrain heights.
     * @param {number} seed - PRNG seed.
     * @param {object} [options={}] - Wave customization settings.
     * @returns {object[]} Array of waves `{ amp, freq, phase }`.
     */
    createWaves(seed, options = {}) {
        const rand = mulberry32(seed);
        const {
            waveCount = 3,
            minAmp = 4,
            maxAmp = 40,
            minFreq = 0.02,
            maxFreq = 0.30,
            ampFalloff = 0.55,
            freqGrowth = 1.8,
        } = options;

        const waves = [];
        let currentMaxAmp = maxAmp;
        let currentMinFreq = minFreq;

        for (let i = 0; i < waveCount; i++) {
            const amp = lerp(minAmp, currentMaxAmp, rand());
            const freq = lerp(currentMinFreq, maxFreq, rand());
            const phase = rand() * Math.PI * 2;

            waves.push({ amp, freq, phase });

            currentMaxAmp *= ampFalloff;
            currentMinFreq *= freqGrowth;
        }

        return waves;
    }

    /**
     * Samples multiple sine waves to generate an elevation profile array.
     * @param {object[]} waves - Waves array.
     * @param {number} length - Number of points to sample.
     * @param {number} start - X start multiplier.
     * @param {number} step - Step size multiplier.
     * @returns {number[]} Height offsets array.
     */
    sampleWaves(waves, length, start, step) {
        const points = [];
        for (let x = 0; x < length; x++) {
            let res = 0;
            for (let wave of waves) {
                const dx = start + step * x;
                res += wave.amp * Math.sin(wave.freq * dx + wave.phase);
            }
            points.push(Math.round(res));
        }
        return points;
    }

    /**
     * Fills the 2D grid vertices density map based on sine wave profiles.
     */
    generate() {
        const { grid, waves } = this;
        const gradientSpread = 5;
        const ground = Math.floor(grid.rows / 1.5);
        const deltaY = this.sampleWaves(waves, grid.cols + 1, 0, Math.PI / 8);

        this.vertices.length = 0;
        for (let r = 0; r <= grid.rows; r++) {
            const row = Array(grid.cols + 1);
            for (let c = 0; c <= grid.cols; c++) {
                const terrain_y = ground + deltaY[c];
                let density = (r - terrain_y + 0.5) / gradientSpread;
                row[c] = clamp(density, 0.0, 1.0);
            }
            this.vertices.push(row);
        }
    }

    /**
     * Carves a spherical crater in the terrain by reducing density of vertices.
     * @param {number} x - Explosion center X (pixels).
     * @param {number} y - Explosion center Y (pixels).
     * @param {number} [radius=36] - Radius of modification.
     */
    modify(x, y, radius = 36) {
        const { squnit, grid, vertices, maxDigStrength } = this;

        const center = new Vec2(Math.floor(x / squnit), Math.floor(y / squnit));
        const radiusInGrid = Math.ceil(radius / squnit);

        const min = new Vec2(center.x - radiusInGrid, center.y - radiusInGrid);
        const max = new Vec2(center.x + radiusInGrid, center.y + radiusInGrid);

        const rows = grid.rows + 1;
        const cols = grid.cols + 1;

        for (let iy = min.y; iy <= max.y; iy++) {
            for (let ix = min.x; ix <= max.x; ix++) {
                if (iy >= 0 && iy < rows && ix >= 0 && ix < cols) {
                    const d = new Vec2(ix - center.x, iy - center.y);
                    const distsq = (d.x * d.x) + (d.y * d.y);
                    const radiussq = radiusInGrid * radiusInGrid;

                    if (distsq <= radiussq) {
                        const normalizedDistance = Math.sqrt(distsq) / radiusInGrid;
                        const falloff = 1 - (normalizedDistance * normalizedDistance);

                        const amountToSubtract = maxDigStrength * falloff;
                        const value = Math.max(0.0, vertices[iy][ix] - amountToSubtract);
                        vertices[iy][ix] = value;
                    }
                }
            }
        }
    }

    /**
     * Sand-like physics that drops floating terrain blocks down into empty spots.
     */
    settle() {
        const { grid, vertices, threshold } = this;

        for (let c = 0; c <= grid.cols; c++) {
            let gaps = 0;
            for (let r = grid.rows; r >= 0; r--) {
                const empty = vertices[r][c] <= threshold;
                if (empty) {
                    gaps++;
                } else if (gaps > 0) {
                    vertices[r + gaps][c] = vertices[r][c];
                    vertices[r][c] = 0.0;
                }
            }
        }
    }

    /**
     * Resolves the Y-coordinate of the surface at a specific horizontal position.
     * @param {number} x - Horizontal coordinate (pixels).
     * @returns {number} Vertical coordinate of the surface (pixels).
     */
    surfaceY(x) {
        const { grid, squnit, vertices, threshold } = this;

        const cFloat = x / squnit;
        const c1 = Math.floor(Math.max(0, Math.min(grid.cols, cFloat)));
        const c2 = Math.min(grid.cols, c1 + 1);
        const lerpX = cFloat - c1;

        const getSurfaceR = (c) => {
            for (let r = 0; r < grid.rows - 1; r++) {
                const d1 = vertices[r][c];
                const d2 = vertices[r + 1][c];
                if (d1 <= threshold && d2 > threshold) {
                    return r + (threshold - d1) / (d2 - d1);
                }
            }
            return grid.rows;
        };

        const r1 = getSurfaceR(c1);
        const r2 = getSurfaceR(c2);
        const surfaceR = r1 + (r2 - r1) * lerpX;

        return surfaceR * squnit;
    }

    /**
     * Computes the slope of the surface at a specific grid column.
     * @param {number} col - Grid column index.
     * @returns {{y: number|null, slope: number}}
     */
    surfaceSlope(col) {
        const rows = this.grid.rows;
        const cols = this.grid.cols;
        const { vertices, threshold } = this;

        let surfaceR = -1;
        for (let r = 0; r < rows - 1; r++) {
            if (vertices[r][col] <= threshold && vertices[r + 1][col] > threshold) {
                const d1 = vertices[r][col];
                const d2 = vertices[r + 1][col];
                surfaceR = r + (threshold - d1) / (d2 - d1);
                break;
            }
        }

        if (surfaceR === -1) return { y: null, slope: 0 };

        const rInt = Math.floor(surfaceR);
        const getD = (r, c) => vertices[Math.min(rows, Math.max(0, r))][Math.min(cols, Math.max(0, c))];

        const gradX = (getD(rInt, col + 1) - getD(rInt, col - 1)) / 2;
        const gradY = (getD(rInt + 1, col) - getD(rInt - 1, col)) / 2;

        if (Math.abs(gradY) < 0.0001) return { y: surfaceR, slope: 0 };
        return { y: surfaceR, slope: -gradX / gradY };
    }

    /**
     * Resolves complete surface info (y position and slope) at a horizontal pixel coordinate.
     * @param {number} x - Horizontal coordinate (pixels).
     * @returns {{y: number, slope: number}|null} Surface info or null if out of grid bounds.
     */
    surfaceInfo(x) {
        const col = Math.floor(x / this.squnit);
        if (col < 0 || col > this.grid.cols) {
            return null;
        }
        const info = this.surfaceSlope(col);

        if (info.y === null) {
            return null;
        }

        const y = info.y * this.squnit;
        return { y, slope: info.slope };
    }

    /**
     * Main drawing method for the terrain.
     * @param {CanvasRenderer} renderer - Renderer object.
     */
    draw(renderer) {
        this.drawTerrain(renderer);
    }

    /**
     * Draws the filled polygon terrain grid using marching squares polygons.
     * @param {CanvasRenderer} renderer - Renderer object.
     */
    drawTerrain(renderer) {
        const { grid, squnit, vertices, threshold, color } = this;
        const strokeColor = color;
        const fillColor = color;
        const fill = true;
        const stroke = !fill;

        for (let i = 0; i < grid.rows; i++) {
            for (let j = 0; j < grid.cols; j++) {
                const a = vertices[i + 0][j + 1] > threshold;
                const b = vertices[i + 0][j + 0] > threshold;
                const c = vertices[i + 1][j + 0] > threshold;
                const d = vertices[i + 1][j + 1] > threshold;

                const points = [
                    ...(d && a ? [new Vec2(j + 1.0, i + 0.5)] : []),
                    ...(     a ? [new Vec2(j + 1.0, i + 0.0)] : []),
                    ...(a && b ? [new Vec2(j + 0.5, i + 0.0)] : []),
                    ...(     b ? [new Vec2(j + 0.0, i + 0.0)] : []),
                    ...(b && c ? [new Vec2(j + 0.0, i + 0.5)] : []),
                    ...(     c ? [new Vec2(j + 0.0, i + 1.0)] : []),
                    ...(c && d ? [new Vec2(j + 0.5, i + 1.0)] : []),
                    ...(     d ? [new Vec2(j + 1.0, i + 1.0)] : []),
                ].map((p) => p.mul(squnit));

                if (points.length < 2) continue;

                if (fill) renderer.drawPolygon(points, fillColor);
                if (stroke) renderer.drawPolygon(points, strokeColor, 1);
            }
        }
    }

    /**
     * Draws a line representing the thin top grass/surface profile.
     * @param {CanvasRenderer} renderer - Renderer object.
     */
    drawSurface(renderer) {
        const { grid, squnit, surfaceColor } = this;
        const points = [];

        for (let x = 0; x <= grid.cols; x++) {
            const px = x * squnit;
            const py = this.surfaceY(px);
            points.push(new Vec2(px, py));
        }

        renderer.drawPolygon(points, surfaceColor, 4, false);
    }

    /**
     * Renders debug markers representing the density vertices.
     * @param {CanvasRenderer} renderer - Renderer object.
     */
    drawVertices(renderer) {
        const { grid, squnit, vertices, threshold } = this;
        const radius = Math.min(grid.rows, grid.cols) / squnit;

        for (let r = 0; r <= grid.rows; r++) {
            for (let c = 0; c <= grid.cols; c++) {
                const ground = vertices[r][c] > threshold;
                renderer.drawCircle(
                    new Vec2(c * squnit, r * squnit),
                    radius * 0.2,
                    Color.fromName(ground ? 'white' : 'black'),
                );
            }
        }
    }
}
