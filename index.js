
function config(canvas, overrides = {}) {
    const {
        canvasSize = 400,
        squareSize = 5,
        seed = 42,
    } = overrides;

    const rows = canvasSize / squareSize;
    const cols = canvasSize / squareSize;

    return {
        canvasHeight: canvasSize,
        canvasWidth: canvasSize,
        squareSize: squareSize,
        rows: rows,
        cols: cols,
        seed: seed,
        random: mulberry32(seed),
        vertices: Array(cols+1),
        renderer: new CanvasRenderer(canvas),
        waves: [
            { amp: 1.0, freq: 1.0, phase: 0.0 },
            { amp: 1, freq: 0.5, phase: 1.0 },
            { amp: -0.2, freq: 3.8, phase: 4.2 },
        ],
    };
}

function setup(canvas, config) {
    canvas.height = config.canvasHeight;
    canvas.width = config.canvasWidth;
    canvas.style.backgroundColor = rgba();

    populateVertices(config);
}

function update(canvas, config) {
    const renderer = config.renderer;

    renderer.drawRect({
        x: 0, y: 0,
        width: config.canvasWidth,
        height: config.canvasHeight,
        color: rgba(),
    });
    drawVertices(renderer, config);
    drawContour(renderer, config);
    drawMouse();
}

function drawMouse() {
    // TODO
}

function populateVertices(config) {
    const ground = Math.floor(config.rows / 1.6);
    config.vertices.length = 0;

    const dys = sampleWaves(config.waves, config.cols + 1, 0, Math.PI / 8);

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
                color: rgba({ r:0, g:0, b:0, a: value > 0.5 ? 1.0 : 0.2}),
            });
        }
    }
}

function drawContour(renderer, config) {
    const size = config.squareSize;
    const color = rgba({g:25});
    const thickness = 1;

    for (let i=0; i<config.rows; i++) {
        for (let j=0; j<config.cols; j++) {
            const a = config.vertices[i+0][j+1] > 0.5;
            const b = config.vertices[i+0][j+0] > 0.5;
            const c = config.vertices[i+1][j+0] > 0.5;
            const d = config.vertices[i+1][j+1] > 0.5;

            const orient = d << 3 | c << 2 | b << 1 | a << 0;
            switch (orient) {
                case 1: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 2: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 3: {
                    renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 4: {
                    renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 5: {
                    renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+0.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+1.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 6: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 7: {
                    renderer.drawLine({
                        x1: (j+1.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 8: {
                    renderer.drawLine({
                        x1: (j+1.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 9: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 10: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                    renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 11: {
                    renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+0.5)*size,
                        y2: (i+1.0)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 12: {
                    renderer.drawLine({
                        x1: (j+0.0)*size,
                        y1: (i+0.5)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 13: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+0.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
                    });
                } break;
                case 14: {
                    renderer.drawLine({
                        x1: (j+0.5)*size,
                        y1: (i+0.0)*size,
                        x2: (j+1.0)*size,
                        y2: (i+0.5)*size,
                        color: color,
                        thickness: thickness,
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
    const cfg = config(canvas);
    setup(canvas, cfg);

    function animate() {
        update(canvas, cfg)
        requestAnimationFrame(animate);
    }

    animate();
}
main({ config, setup, update });
