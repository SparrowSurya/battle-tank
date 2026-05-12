

function createState(canvas, overrides = {}) {
    const {
        canvasSize = 400,
        square = 10,
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
            toRow: (y) => Math.floor(y / rows) * square,
            toCol: (x) => Math.floor(x / cols) * square,
            background: rgba(),
        },
        terrain: {
            threshold: 0.5,
            vertices: Array(cols+1),
            waves: [
                { amp: 1.0, freq: 1.0, phase: 0.0 },
                { amp: 1, freq: 0.5, phase: 1.2 },
                { amp: 0.2, freq: 3.8, phase: 4.2 },
            ],
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
            height: 20,
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
    drawSurface(renderer, state);
    drawVertices(renderer, state);

    if (isSome(events.mouse) && events.mouse.present) {
        drawMouse(renderer, state);
        modifyTerrain(state);
        settleTerrain(state);
        drawSlope(renderer, state);
    }

    drawTank(renderer, state);

    return state;
}

function createSurface(state) {
    const { canvas, terrain } = state;
    terrain.vertices.length = 0;
    const gradientSpread = 5;
    const ground = Math.floor(canvas.rows / 2.5);
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
    for (let r=0; r<=canvas.rows; r++) {
        for (let c=0; c<=canvas.cols; c++) {
            const ground = terrain.vertices[r][c] > terrain.threshold;
            renderer.drawCircle({
                x: c * canvas.square,
                y: r * canvas.square,
                radius: radius * 0.25,
                color: ground ? 'white' : 'black',
            });
        }
    }
}

function drawSurface(renderer, state) {
    const { height, cols, square } = state.canvas;
    const surface = [];

    for (let x=0; x<=cols; x++) {
        const y = surfaceY(x * square, state) ?? height;
        surface.push({ x: x * square, y: y+(square/2) });
    }

    console.log("Surface:", surface);
    for (let i=0; i<cols; i++) {
        const p1 = surface[i];
        const p2 = surface[i+1];
        renderer.drawLine({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            color: 'magenta',
        });
    }
}

function drawSlope(renderer, state) {
    const { mouse } = state.events;

    const x1 = mouse.x - state.tank.height / 2;
    const y1 = surfaceY(x1, state);

    const x2 = mouse.x + state.tank.height / 2;
    const y2 = surfaceY(x2, state);

    // renderer.drawCircle({
    //     x: x1, y: y1,
    //     radius: state.mouse.radius,
    //     color: mouse.clicked ? 'blue' : 'red',
    // });

    // renderer.drawCircle({
    //     x: x2, y: y2,
    //     radius: state.mouse.radius,
    //     color: mouse.clicked ? 'blue' : 'red',
    // });

    // renderer.drawLine({
    //     x1, y1, x2, y2,
    //     color: 'green',
    // });
}

function drawMouse(renderer, state) {
    const { mouse } = state.events;

    renderer.drawCircle({
        x: mouse.x, y: mouse.y,
        radius: state.mouse.radius,
        color: mouse.clicked ? 'blue' : 'red',
    });

    renderer.drawLine({
        x1: mouse.x,
        y1: 0,
        x2: mouse.x,
        y2: state.canvas.height,
        color: 'red',
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

function drawTank(renderer, config) {

    // const mouseX = metadata.mouse.x;
    // const mouseY = metadata.mouse.y;
    // const leftX = mouseX - config.tankWidth / 2;
    // const rightX = mouseX + config.tankWidth / 2;

    // const surface = surfaceSlope(mouseX, config);

    // renderer.drawLine({
    //     x1: leftX,
    //     y1: mouseY,
    //     x2: rightX,
    //     y2: mouseY,
    //     thickness: 1,
    //     color: 'magenta',
    // });

    // if (isSome(surface)) {
    //     console.log("Surface:", surface);
    //     renderer.drawCircle({
    //         x: mouseX,
    //         y: surface.y * 2,
    //         radius: 3,
    //         color: 'green',
    //     });
    // }

    // const leftInfo = surfaceInfo(leftX, config);
    // const rightInfo = surfaceInfo(rightX, config);

    // console.log("Left:", leftInfo);
    // console.log("Right:", rightInfo);


    // if (leftInfo && rightInfo) {
    //     const tankHeight = config.tankHeight;

    //     // Calculate vector along the base of the tank
    //     const vBaseX = rightX - leftX;
    //     const vBaseY = rightInfo.pixelY - leftInfo.pixelY;
    //     const baseLength = Math.sqrt(vBaseX * vBaseX + vBaseY * vBaseY);

    //     // Calculate normalized vector perpendicular to the base (pointing upwards)
    //     // Need to handle potential division by zero if baseLength is 0 (flat terrain)
    //     const vUpX = -vBaseY / (baseLength || 1); // Use 1 to avoid division by zero
    //     const vUpY = vBaseX / (baseLength || 1);

    //     // Scale the perpendicular vector by tankHeight
    //     const scaledUpX = vUpX * tankHeight;
    //     const scaledUpY = vUpY * tankHeight;

    //     // Define the four corners of the rotated rectangle
    //     const p1 = { x: leftX, y: leftInfo.pixelY };
    //     const p2 = { x: rightX, y: rightInfo.pixelY };
    //     const p3 = { x: rightX + scaledUpX, y: rightInfo.pixelY + scaledUpY };
    //     const p4 = { x: leftX + scaledUpX, y: leftInfo.pixelY + scaledUpY };

    //     // console.log("Tank points:", p1, p2, p3, p4);

    //     // Draw the rotated tank rectangle
    //     renderer.drawPolygon({
    //         points: [p1, p2, p3, p4],
    //         color: rgba({r:0, g:0, b:255}), // Blue tank
    //     });

    //     // Optionally, draw a point at the center of the tank base (for reference)
    //     renderer.drawCircle({
    //         x: mouseX,
    //         y: (p1.y + p2.y) / 2, // Center of the base line
    //         radius: 4,
    //         color: rgba({r:255, g:165, b:0}), // Orange point
    //     });
    // }
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
    const { rows, square, toCol } = state.canvas;
    const { vertices, threshold } = state.terrain;
    const c = toCol(x);

    for (let r = 0; r < rows; r++) {
        if (vertices[r][c] >= threshold) {
            return r * square;
        }
    }
}

const slope = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1);

function surfaceSlope(x, state) {
    const rows = state.canvas.rows + 1;
    const cols = state.canvas.cols + 1;
    const threshold = 0;

    let surfaceY;
    for (let r = 0; r < rows - 1; r++) {
        if (state.vertices[r][x] == threshold && state.vertices[r + 1][x] > threshold) {
            const d1 = state.vertices[r][x];
            const d2 = state.vertices[r + 1][x];
            surfaceY = r + (threshold - d1) / (d2 - d1);
            break;
        }
    }

    if (surfaceY === -1) { // No surface found, e.g., all air or all ground
        return { y: null, slope: 0 };
    }

    // Convert surfaceY to integer for grid access
    const yFloor = Math.floor(surfaceY);
    const yCeil = Math.ceil(surfaceY); // Not used currently, but might be useful for more advanced interpolation

    // Get density values at points around the surface
    // Handle boundary conditions carefully
    const getDensity = (r, c) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return 0.0; // Assume air outside bounds
        }
        return state.vertices[r][c];
    };

    // Use central difference for gradient components
    // Approx gradient at (x, surfaceY)
    let gradX, gradY;

    // Calculate gradX
    if (x > 0 && x < cols - 1) {
        gradX = (getDensity(yFloor, x + 1) - getDensity(yFloor, x - 1)) / 2;
    } else if (x === 0) { // Forward difference for left edge
        gradX = (getDensity(yFloor, x + 1) - getDensity(yFloor, x));
    } else { // Backward difference for right edge
        gradX = (getDensity(yFloor, x) - getDensity(yFloor, x - 1));
    }

    // Calculate gradY
    if (yFloor > 0 && yFloor < rows - 1) {
        gradY = (getDensity(yFloor + 1, x) - getDensity(yFloor - 1, x)) / 2;
    } else if (yFloor === 0) { // Forward difference for top edge
        gradY = (getDensity(yFloor + 1, x) - getDensity(yFloor, x));
    } else { // Backward difference for bottom edge
        gradY = (getDensity(yFloor, x) - getDensity(yFloor - 1, x));
    }

    // Slope of the contour (dy/dx) = - (dD/dx) / (dD/dy)
    if (Math.abs(gradY) < 0.0001) { // Avoid division by zero if gradient in y is flat
        return gradX > 0 ? Infinity : (gradX < 0 ? -Infinity : 0); // Vertical or horizontal line
    }

    return -gradX / gradY;
}


function surfaceInfo(x, state) {
    const col = Math.floor(x / state.canvas.square);
    const surfaceInfo = surfaceSlope(col, state);

    if (surfaceInfo.surfaceY === null) {
        return null;
    }

    const pixelY = surfaceInfo.surfaceY * state.canvas.square;
    return { pixelY: pixelY, slope: surfaceInfo.slope };
}


function main({ setup, update }) {
    const canvas = document.getElementById("id_canvas");
    const renderer = new CanvasRenderer(canvas);

    let events = {
        mouse: { present: false, x: 0, y: 0 },
        click: false,
    };

    canvas.addEventListener('mousemove', function(e) {
        const mouse = { x: e.offsetX, y: e.offsetY, present: true };
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
