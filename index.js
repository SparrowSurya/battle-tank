

function createWaves() {
    return [
        { amp: 35.0, freq: 0.05, phase: 0.0 },
        { amp: 15.0, freq: 0.12, phase: 1.5 },
        { amp:  5.0, freq: 0.25, phase: 3.2 },
    ];
}


function createState(canvas, overrides = {}) {
    const {
        canvasSize = 400,
        square = 2,
        seed = 42,
    } = overrides;

    const rows = canvasSize / square;
    const cols = canvasSize / square;

    return {
        canvas: {
            height: canvasSize,
            width: canvasSize,
            square: square,
            rows: rows,
            cols: cols,
            toRow: (y) => Math.floor(y / square),
            toCol: (x) => Math.floor(x / square),
            background: rgba(),
        },
        terrain: {
            threshold: 0.5,
            vertices: Array(cols+1),
            waves: createWaves(),
        },
        mouse: {
            radius: 3,
        },
        random: {
            seed: seed,
            random: mulberry32(seed),
        },
        maxDigStrength: 0.3,
        tank: {
            width: 25,
            color: 'green',
        },
        renderer: new CanvasRenderer(canvas),
        color: {
            background: rgba(),
        },
        backgroundColor: rgba(),
    };
}

function setup(canvas) {
    const state = createState(canvas);

    canvas.height = state.canvas.height;
    canvas.width = state.canvas.width;
    canvas.style.backgroundColor = state.canvas.background;

    createSurface(state);

    return state;
}

function update(renderer, state) {
    const events = state.events;

    renderer.drawRect({
        x: 0, y: 0,
        width: state.canvas.width,
        height: state.canvas.height,
        color: state.canvas.background,
    });

    drawTerrain(renderer, state);

    if (isSome(events.mouse) && events.mouse.present) {
        drawMouse(renderer, state);
        modifyTerrain(state);
        settleTerrain(state);
    }

    drawTank(renderer, state);

    return state;
}

function createSurface(state) {
    const { canvas, terrain } = state;
    terrain.vertices.length = 0;
    const gradientSpread = 5;
    const ground = Math.floor(canvas.rows / 2);
    const deltaY = sampleWaves(terrain.waves, canvas.cols + 1, 0, Math.PI / 8);

    for (let r = 0; r <= canvas.rows; r++) {
        const row = Array(canvas.cols + 1);
        for (let c = 0; c <= canvas.cols; c++) {
            const terrain_y = ground + deltaY[c];
            let density = (r - terrain_y + 0.5) / gradientSpread;
            row[c] = clamp(0.0, 1.0, density);
        }
        terrain.vertices.push(row);
    }
}

function drawSurfaceDensity(renderer, state) {
    const { square, rows, cols } = state.canvas;
    const vertices = state.terrain.vertices;

    for (let r=0; r<rows; r++) {
        for (let c=0; c<cols; c++) {
            const a0 = (vertices[r+0][c+0] + vertices[r+0][c+1]) / 2;
            const a1 = (vertices[r+1][c+0] + vertices[r+1][c+1]) / 2;
            renderer.drawLinearGradient({
                x: c * square,
                y: r * square,
                width: square,
                height: square,
                gx0: (c + 0) * square,
                gy0: (r + 0) * square,
                gx1: (c + 0) * square,
                gy1: (r + 1) * square,
                colorStops: [
                    { value: 0.0, color: rgba({ r:0, g:0, b:0, a: a0 }) },
                    { value: 1.0, color: rgba({ r:0, g:0, b:0, a: a1 }) },
                ],
            });
        }
    }
}

function drawVertices(renderer, state) {
    const { canvas, terrain } = state;
    const radius = Math.min(canvas.rows, canvas.cols) / canvas.square;
    if (canvas.square < 5) return;

    for (let r=0; r<=canvas.rows; r++) {
        for (let c=0; c<=canvas.cols; c++) {
            const ground = terrain.vertices[r][c] > terrain.threshold;
            renderer.drawCircle({
                x: c * canvas.square,
                y: r * canvas.square,
                radius: radius * 0.2,
                color: ground ? 'white' : 'black',
            });
        }
    }
}

function drawSurface(renderer, state) {
    const { cols, square } = state.canvas;
    const surface = [];

    for (let x = 0; x <= cols; x++) {
        const px = x * square;
        const py = surfaceY(px, state);
        surface.push({ x: px, y: py });
    }

    for (let i = 0; i < cols; i++) {
        const p1 = surface[i];
        const p2 = surface[i + 1];
        renderer.drawLine({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            color: 'magenta',
            thickness: 1,
        });
    }
}

function drawMouse(renderer, state) {
    const { mouse } = state.events;

    renderer.drawLine({
        x1: mouse.x,
        y1: 0,
        x2: mouse.x,
        y2: state.canvas.height,
        color: mouse.clicked ? 'blue' : 'red',
    });
}

function sampleWaves(waves, length, start, step) {
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

function modifyTerrain(state) {
    const { mouse } = state.events;
    if (!isSome(mouse) || mouse.clicked !== true) return;

    const canvas = state.canvas;
    const mouseRadius = state.mouse.radius;
    const maxDigStrength = state.maxDigStrength;
    const square = canvas.square;

    const centerX = Math.floor(mouse.x / square);
    const centerY = Math.floor(mouse.y / square);
    const radiusInGrid = Math.ceil(mouseRadius / square);

    const minX = centerX - radiusInGrid;
    const minY = centerY - radiusInGrid;
    const maxX = centerX + radiusInGrid;
    const maxY = centerY + radiusInGrid;

    const rows = canvas.rows + 1;
    const cols = canvas.cols + 1;

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distSquared = (dx * dx) + (dy * dy);
                const radiusSquared = radiusInGrid * radiusInGrid;

                if (distSquared <= radiusSquared) {
                    const normalizedDistance = Math.sqrt(distSquared) / radiusInGrid;
                    const falloff = 1 - (normalizedDistance * normalizedDistance);

                    const amountToSubtract = maxDigStrength * falloff;
                    state.terrain.vertices[y][x] = Math.max(0.0, state.terrain.vertices[y][x] - amountToSubtract);
                }
            }
        }
    }
}

function settleTerrain(state) {
    const { rows, cols } = state.canvas;
    const terrain = state.terrain;

    for (let c = 0; c <= cols; c++) {
        let gaps = 0;
        for (let r = rows; r >= 0; r--) {
            const empty = terrain.vertices[r][c] <= terrain.threshold;
            if (empty) {
                gaps++;
            } else if (gaps > 0) {
                terrain.vertices[r + gaps][c] = terrain.vertices[r][c];
                terrain.vertices[r][c] = 0.0;
            }
        }
    }
}

function drawTank(renderer, state) {
    const { mouse } = state.events;
    if (!isSome(mouse) || !mouse.present) return;

    const mouseX = mouse.x;
    const tankWidth = state.tank.width;
    const tankHeight = 12;

    const leftX = Math.floor(mouseX - tankWidth / 2);
    const rightX = Math.floor(mouseX + tankWidth / 2);

    let sumY = 0;
    let sumSlope = 0;
    let count = 0;

    for (let x = leftX; x <= rightX; x++) {
        const info = surfaceInfo(x, state);
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

        const points = corners.map(p => ({
            x: mouseX + (p.x * cos - p.y * sin),
            y: avgY + (p.x * sin + p.y * cos)
        }));

        renderer.drawPolygon({
            points: points,
            color: state.tank.color || 'blue',
        });
    }
}


function drawTerrain(renderer, state) {
    const { rows, cols, square } = state.canvas;
    const { vertices, threshold } = state.terrain;
    const strokeColor = 'magenta';
    const fillColor = rgba({ r:0, g:0, b:0 });
    const thickness = 0;
    const fill = true;
    const stroke = !fill;

    for (let i=0; i<rows; i++) {
        for (let j=0; j<cols; j++) {

            // Square anatomy:
            //
            // B +------+ A
            //   |      |
            //   |      |
            // C +------+ D

            const a = vertices[i+0][j+1] > threshold;
            const b = vertices[i+0][j+0] > threshold;
            const c = vertices[i+1][j+0] > threshold;
            const d = vertices[i+1][j+1] > threshold;

            const orient = d << 3 | c << 2 | b << 1 | a << 0;
            // console.log(`${i}, ${j}, ${orient}`);
            switch (orient) {
                case 1: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+1.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 2: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+0.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 3: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+1.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 4: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 5: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+0.5)*square,
                        y2: (i+0.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+1.0)*square,
                        x2: (j+1.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 6: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 7: {
                    if (stroke) renderer.drawLine({
                        x1: (j+1.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 8: {
                    if (stroke) renderer.drawLine({
                        x1: (j+1.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 9: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 10: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+1.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (stroke) renderer.drawLine({
                        x1: (j+0.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 11: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+0.5)*square,
                        y2: (i+1.0)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.5)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 12: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.0)*square,
                        y1: (i+0.5)*square,
                        x2: (j+1.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 13: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+0.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.0)*square },
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.5)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 14: {
                    if (stroke) renderer.drawLine({
                        x1: (j+0.5)*square,
                        y1: (i+0.0)*square,
                        x2: (j+1.0)*square,
                        y2: (i+0.5)*square,
                        color: strokeColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*square, y: (i+0.5)*square },
                            { x: (j+0.5)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+0.0)*square },
                            { x: (j+0.0)*square, y: (i+1.0)*square },
                            { x: (j+1.0)*square, y: (i+1.0)*square },
                        ],
                        color: fillColor,
                    });
                } break;
                case 15: {
                    if (fill) renderer.drawRect({
                        x: j*square,
                        y: i*square,
                        width: square,
                        height: square,
                        color: fillColor,
                    });
                } break;
                default:
                    break;
            }

        }
    }
}

function surfaceY(x, state) {
    const { rows, cols, square } = state.canvas;
    const { vertices, threshold } = state.terrain;

    const cFloat = x / square;
    const c1 = Math.floor(Math.max(0, Math.min(cols, cFloat)));
    const c2 = Math.min(cols, c1 + 1);
    const lerpX = cFloat - c1;

    const getSurfaceR = (c) => {
        for (let r = 0; r < rows - 1; r++) {
            const d1 = vertices[r][c];
            const d2 = vertices[r + 1][c];
            if (d1 <= threshold && d2 > threshold) {
                return r + (threshold - d1) / (d2 - d1);
            }
        }
        return rows;
    };

    const r1 = getSurfaceR(c1);
    const r2 = getSurfaceR(c2);
    const surfaceR = r1 + (r2 - r1) * lerpX;

    return surfaceR * square;
}

const slope = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);

function surfaceSlope(col, state) {
    const { rows, cols } = state.canvas;
    const { vertices, threshold } = state.terrain;

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


function surfaceInfo(x, state) {
    const col = Math.floor(x / state.canvas.square);
    const info = surfaceSlope(col, state);

    if (info.y === null) {
        return null;
    }

    const y = info.y * state.canvas.square;
    return { y, slope: info.slope };
}


function main({ setup, update }) {
    const canvas = document.getElementById("id_canvas");
    const renderer = new CanvasRenderer(canvas);

    let events = {
        mouse: { present: false, x: 0, y: 0 },
        click: false,
    };

    canvas.addEventListener('mousemove', function(e) {
        const mouse = { ...events.mouse, x: e.offsetX, y: e.offsetY, present: true };
        events = { ...events, mouse };
    });

    canvas.addEventListener('mouseleave', function(e) {
        const mouse = { present: false };
        events = { ...events, mouse };
    });

    canvas.addEventListener('mouseup', function(e) {
        const mouse = { ...events.mouse, clicked: false };
        events = { ...events, mouse };
    });

    canvas.addEventListener('mousedown', function(e) {
        const mouse = { ...events.mouse, clicked: true };
        events = { ...events, mouse };
    });

    let state = setup(canvas);

    function animate() {
        state = update(renderer, { ...state, events: deepcopy(events) });
        requestAnimationFrame(animate);
    }

    animate();
}

/// Entry Point of Program.
main({ setup, update });
