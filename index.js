
function config(canvas, overrides = {}) {
    const {
        canvasSize = 400,
        squareSize = 2,
        seed = 42,
    } = overrides;

    const rows = canvasSize / squareSize;
    const cols = canvasSize / squareSize;

    return {
        canvasHeight: canvasSize ,
        canvasWidth: canvasSize,
        squareSize: squareSize,
        rows: rows,
        cols: cols,
        seed: seed,
        random: mulberry32(seed),
        vertices: Array(cols+1),
        mouseRadius: 10,
        maxDigStrength: 0.3,
        tankWidth: 50,
        renderer: new CanvasRenderer(canvas),
        waves: [
            { amp: 1.0, freq: 1.0, phase: 0.0 },
            { amp: 1, freq: 0.5, phase: 1.2 },
            { amp: 0.2, freq: 3.8, phase: 4.2 },
        ],
    };
}

function setup(canvas, config) {
    canvas.height = config.canvasHeight;
    canvas.width = config.canvasWidth;
    canvas.style.backgroundColor = rgba({r:173, g:216, b:230});

    populateTerrain(config);
}

function update(config, metadata) {
    const renderer = config.renderer;

    renderer.drawRect({
        x: 0, y: 0,
        width: config.canvasWidth,
        height: config.canvasHeight,
        color: rgba({r:173, g:216, b:230}), // Light Blue
    });
    drawSurface(renderer, config);

    if (isValue(metadata.mouse) && metadata.mouse.present) {
        drawMouse(renderer, config, metadata);
        modifyTerrain(config, metadata);
        settleTerrain(config);

        const mousePixelX = metadata.mouse.x;
        const tankWidth = config.tankWidth;
        const halfTankWidth = tankWidth / 2;

        const leftPixelX = mousePixelX - halfTankWidth;
        const rightPixelX = mousePixelX + halfTankWidth;

        const leftInfo = getTerrainInfoAtPixelX(leftPixelX, config);
        const rightInfo = getTerrainInfoAtPixelX(rightPixelX, config);

        if (leftInfo && rightInfo) {
            // Draw a line representing the base of the tank
            renderer.drawLine({
                x1: leftPixelX,
                y1: leftInfo.pixelY,
                x2: rightPixelX,
                y2: rightInfo.pixelY,
                color: rgba({r:255, g:255, b:0}), // Yellow line for tank base
                thickness: 3,
            });

            // Draw a point at the center of the tank base
            const tankCenterY = (leftInfo.pixelY + rightInfo.pixelY) / 2;
            renderer.drawCircle({
                x: mousePixelX,
                y: tankCenterY,
                radius: 4,
                color: rgba({r:255, g:165, b:0}), // Orange point for tank center
            });
            
            // Optionally, the angle for tank rotation can be calculated here
            // const tankAngle = Math.atan2(rightInfo.pixelY - leftInfo.pixelY, rightPixelX - leftPixelX);
        }
    }
}

function isValue(x) {
    return x !== undefined &&x !== null;
}

function drawMouse(renderer, config, metadata) {
    const { mouse } = metadata;
    renderer.drawCircle({
        x: mouse.x, y: mouse.y,
        radius: config.mouseRadius,
        color: mouse.clicked ? 'blue' : 'red',
    });
}

function populateTerrain(config) {
    const ground = Math.floor(config.rows / 1.6);
    config.vertices.length = 0; // Still clears the old grid
    const gradientSpread = 5; // How many grid cells the gradient spans

    const dys = sampleWaves(config.waves, config.cols + 1, 0, Math.PI / 8);

    for (let r = 0; r <= config.rows; r++) {
        const row = Array(config.cols + 1);
        for (let x = 0; x <= config.cols; x++) {
            const terrain_y = ground + dys[x];
            // Calculate density with a smooth gradient
            let density = (r - terrain_y + 0.5) / gradientSpread; // Add 0.5 to center the gradient
            density = Math.max(0.0, Math.min(1.0, density));
            row[x] = density;
        }
        config.vertices.push(row);
    }
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



function modifyTerrain(config, metadata) {
    const { mouse } = metadata;
    if (!isValue(mouse) || mouse.clicked !== true) return;

    const mouseRadius = config.mouseRadius;
    const size = config.squareSize;
    const maxDigStrength = config.maxDigStrength;

    // Convert mouse position to grid indices
    const centerX = Math.floor(mouse.x / size);
    const centerY = Math.floor(mouse.y / size);
    const radiusInGrid = Math.ceil(mouseRadius / size);

    const minX = centerX - radiusInGrid;
    const minY = centerY - radiusInGrid;
    const maxX = centerX + radiusInGrid;
    const maxY = centerY + radiusInGrid;

    const rows = config.rows + 1;
    const cols = config.cols + 1;

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distSquared = (dx * dx) + (dy * dy);
                const radiusSquared = radiusInGrid * radiusInGrid;

                if (distSquared <= radiusSquared) {
                    const normalizedDistance = Math.sqrt(distSquared) / radiusInGrid;
                    const falloff = 1 - (normalizedDistance * normalizedDistance); // Parabolic falloff

                    const amountToSubtract = maxDigStrength * falloff;
                    config.vertices[y][x] = Math.max(0.0, config.vertices[y][x] - amountToSubtract);
                }
            }
        }
    }
}

function settleTerrain(config) {
    const rows = config.rows + 1;
    const cols = config.cols + 1;
    const threshold = 0.5;

    // Iterate through each column
    for (let c = 0; c < cols; c++) {
        let emptySpaces = 0; // Counter for empty cells from the bottom up

        // Iterate from the bottom of the column upwards
        for (let r = rows - 1; r >= 0; r--) {
            if (config.vertices[r][c] <= threshold) {
                emptySpaces++; // Found an empty space
            } else {
                // This cell is solid
                if (emptySpaces > 0) {
                    // Move this solid cell down by 'emptySpaces' amount
                    config.vertices[r + emptySpaces][c] = config.vertices[r][c];
                    config.vertices[r][c] = 0.0; // Clear the original position
                }
            }
        }
    }
}
function drawSurface(renderer, config) {
    const size = config.squareSize;
    const strokColor = rgba({g:25});
    const fillColor = rgba({r:0, g:0,b:0});
    const thickness = 0;
    const fill = true;

    for (let i=0; i<config.rows; i++) {
        for (let j=0; j<config.cols; j++) {

            // Square anatomy:
            //
            // B +------+ A
            //   |      |
            //   |      |
            // C +------+ D

            const a = config.vertices[i+0][j+1] > 0.5;
            const b = config.vertices[i+0][j+0] > 0.5;
            const c = config.vertices[i+1][j+0] > 0.5;
            const d = config.vertices[i+1][j+1] > 0.5;

            const orient = d << 3 | c << 2 | b << 1 | a << 0;
            switch (orient) {
                case 1: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 2: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 3: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 4: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 5: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+0.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+1.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 6: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 7: {
                    if (!fill) renderer.drawLine({
                        x1: (j+1.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 8: {
                    if (!fill) renderer.drawLine({
                        x1: (j+1.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 9: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 10: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (!fill) renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 11: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.5)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 12: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 13: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.0)*size },
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.5)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 14: {
                    if (!fill) renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: strokColor,
                        thickness: thickness,
                    });
                    if (fill) renderer.drawPolygon({
                        points: [
                            { x: (j+1.0)*size, y: (i+0.5)*size },
                            { x: (j+0.5)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+0.0)*size },
                            { x: (j+0.0)*size, y: (i+1.0)*size },
                            { x: (j+1.0)*size, y: (i+1.0)*size },
                        ],
                        color: fillColor,
                    });
                } break;
                case 15: {
                    if (fill) renderer.drawRect({
                        x: j*size,
                        y: i*size,
                        width: size,
                        height: size,
                        color: fillColor,
                    });
                } break;
                default:
                    break;
            }

        }
    }
}


function getSurfaceSlopeAt(x, config) {
    const rows = config.rows + 1;
    const cols = config.cols + 1;
    const threshold = 0.5;

    // 1. Find the surface y-coordinate (approximate)
    let surfaceY = -1;
    for (let r = 0; r < rows - 1; r++) { // Iterate until second to last row
        // Check if density crosses threshold between current row and next
        if (config.vertices[r][x] <= threshold && config.vertices[r + 1][x] > threshold) {
            // Linear interpolate for a more precise y
            const d1 = config.vertices[r][x];
            const d2 = config.vertices[r + 1][x];
            surfaceY = r + (threshold - d1) / (d2 - d1);
            break;
        }
    }

    if (surfaceY === -1) { // No surface found, e.g., all air or all ground
        return { surfaceY: null, slope: 0 };
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
        return config.vertices[r][c];
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


function getTerrainInfoAtPixelX(pixelX, config) {
    const mouseGridX = Math.floor(pixelX / config.squareSize);
    const surfaceInfo = getSurfaceSlopeAt(mouseGridX, config);

    if (surfaceInfo.surfaceY === null) {
        return null; // Or handle as appropriate
    }

    const pixelY = surfaceInfo.surfaceY * config.squareSize;
    return { pixelY: pixelY, slope: surfaceInfo.slope };
}


function main({ config, setup, update }) {
    const canvas = document.getElementById("id_canvas");
    let misc = {
        mouse: { present: false, x: 0, y: 0 },
        click: false,
    };

    canvas.addEventListener('mousemove', function(e) {
        const mouse = { x: e.offsetX, y: e.offsetY, present: true };
        misc = { ...misc, mouse };
    });

    canvas.addEventListener('mouseleave', function(e) {
        const mouse = { present: false };
        misc = { ...misc, mouse };
    });

    canvas.addEventListener('mouseup', function(e) {
        const mouse = { ...misc.mouse, clicked: false };
        misc = { ...misc, mouse };
    });

    canvas.addEventListener('mousedown', function(e) {
        const mouse = { ...misc.mouse, clicked: true };
        misc = { ...misc, mouse };
    });

    const cfg = config(canvas);
    setup(canvas, cfg);

    console.log("Vertices:", cfg.vertices);

    function animate() {
        const metadata = {...misc};
        update(cfg, metadata);
        requestAnimationFrame(animate);
    }

    animate();
}
main({ config, setup, update });
