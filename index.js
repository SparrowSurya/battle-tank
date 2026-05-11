
function config(canvas, overrides = {}) {
    const {
        canvasSize = 400,
        squareSize = 5,
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
        mouseRadius: 5,
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
    canvas.style.backgroundColor = rgba();

    populateVertices(config);
}

function update(config, metadata) {
    const renderer = config.renderer;

    renderer.drawRect({
        x: 0, y: 0,
        width: config.canvasWidth,
        height: config.canvasHeight,
        color: rgba(),
    });
    drawSurface(renderer, config);
    drawVertices(renderer, config);
    if (isValue(metadata.mouse) && metadata.mouse.present) {
        drawMouse(renderer, config, metadata);
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

function populateVertices(config) {
    const ground = Math.floor(config.rows / 1.6);
    config.vertices.length = 0;

    const dys = sampleWaves(config.waves, config.cols + 1, 0, Math.PI / 12);

    for (let r = 0; r <= config.rows; r++) {
        const row = Array(config.cols + 1);
        for (let x = 0; x <= config.cols; x++) {
            const terrain_y = ground + dys[x];
            row[x] = r >= terrain_y ? 1.0 : 0.0;
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

function drawVertices(renderer, config) {
    const size = config.squareSize;
    for (let r=0; r<=config.rows; r++) {
        for (let c=0; c<=config.cols; c++) {
            const value = config.vertices[r][c];
            renderer.drawCircle({
                x: c * size,
                y: r * size,
                radius: size / 10,
                color: value > 0.5 ? 'white' : 'black',
            });
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

    function animate() {
        const metadata = {...misc};
        update(cfg, metadata);
        requestAnimationFrame(animate);
    }

    animate();
}
main({ config, setup, update });
