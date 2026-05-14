

function createWaves(seed, options = {}) {
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

function createState({ squnit = 2, seed = 42 } = {}) {
    const canvasSize = new Vec2(600, 400);
    const canvasGrid = canvasSize.div(Vec2.all(squnit));

    return {
        canvas: {
            size: canvasSize,
            grid: canvasGrid,
            squnit: squnit,
            background: Color.fromHex("#87CEEB"),
        },
        terrain: {
            threshold: 0.5,
            vertices: Array(canvasGrid.cols+1),
            waves: createWaves(Date.now()),
            surfaceColor: Color.fromHex("#6B8E23"),
            color: Color.fromHex("#6B8E23"),
        },
        pointer: {
            radius: 12,
        },
        random: {
            seed: seed,
            random: mulberry32(),
        },
        maxDigStrength: 0.3,
        tank: {
            minMuzzleVelcity: Vec2.all(10),
            x: canvasSize.width / 2,
            width: 25,
            velocity: new Vec2(80, 30),
            color: Color.fromHex('#556B2F'),
            maxPower: 60,
            trigger: {
                power: 0,
            },
            ammo: null,
        },
        env: {
            gravity: 98,
        },
        debug: {
            strokeColor: Color.fromHex("#D67FA1"),
        }
    };
}

function setup(canvas) {
    const state = createState(canvas);

    canvas.height = state.canvas.size.height;
    canvas.width = state.canvas.size.width;
    canvas.style.backgroundColor = state.canvas.background.toString();

    generateTerrain(state);

    return state;
}

function update(renderer, state) {
    const events = state.events;

    renderer.clear(state.canvas.background);
    drawTerrain(renderer, state);
    drawSurface(renderer, state);
    if (state.canvas.squnit >= 5) drawVertices(renderer, state);
    if (isSome(events.mouse) && events.mouse.present) {
        // drawMouse(renderer, state);
        // modifyTerrain(state);
        settleTerrain(state);
    }
    moveTank(state);
    drawTank(renderer, state);
    aimTank(renderer, state);
    drawProjectilePath(renderer, state);
    if (state.tank.ammo !== null) {
        drawProjectile(renderer, state);
        moveProjectile(state);
    }

    return state;
}

function generateTerrain(state) {
    const { canvas: { grid }, terrain } = state;
    const gradientSpread = 5;
    const ground = Math.floor(grid.rows / 1.5);
    const deltaY = sampleWaves(terrain.waves, grid.cols + 1, 0, Math.PI / 8);

    terrain.vertices.length = 0;
    for (let r = 0; r <= grid.rows; r++) {
        const row = Array(grid.cols + 1);
        for (let c = 0; c <= grid.cols; c++) {
            const terrain_y = ground + deltaY[c];
            let density = (r - terrain_y + 0.5) / gradientSpread;
            row[c] = clamp(density, 0.0, 1.0);
        }
        terrain.vertices.push(row);
    }
}

function drawSurfaceDensity(renderer, state) {
    const { squnit, grid } = state.canvas;
    const vertices = state.terrain.vertices;

    for (let r=0; r < grid.rows; r++) {
        for (let c=0; c < grid.cols; c++) {

            const a0 = avg(vertices[r+0][c+0], vertices[r+0][c+1]);
            const a1 = avg(vertices[r+1][c+0], vertices[r+1][c+1]);

            renderer.drawLinearGradient(
                new Rect(c * squnit, r * squnit, squnit, squnit),
                new Vec2((c + 0) * squnit, (r + 0) * squnit),
                new Vec2((c + 0) * squnit, (r + 1) * squnit),
                [
                    { value: 0.0, color: Color(0, 0, 0, a0) },
                    { value: 1.0, color: Color(0, 0, 0, a1) },
                ],
            );
        }
    }
}

function drawVertices(renderer, state) {
    const { canvas: { grid, squnit }, terrain } = state;
    const radius = Math.min(grid.rows, grid.cols) / squnit;

    for (let r=0; r <= grid.rows; r++) {
        for (let c=0; c <= grid.cols; c++) {
            const ground = terrain.vertices[r][c] > terrain.threshold;
            renderer.drawCircle(
                new Vec2(c * squnit, r * squnit),
                radius * 0.2,
                Color.fromName(ground ? 'white' : 'black'),
            );
        }
    }
}

function drawSurface(renderer, state) {
    const { grid, squnit } = state.canvas;
    const points = [];

    for (let x = 0; x <= grid.cols; x++) {
        const px = x * squnit;
        const py = surfaceY(px, state);
        points.push(new Vec2(px, py));
    }

    renderer.drawPolygon(points, state.terrain.surfaceColor, 3, false);
}

function drawMouse(renderer, state) {
    const { mouse } = state.events;

    renderer.drawLine(
        new Vec2(mouse.x, 0),
        new Vec2(mouse.x, state.canvas.size.height),
        Color.fromName(mouse.clicked ? 'blue' : 'red'),
    );
    renderer.drawCircle(new Vec2(mouse), state.pointer.radius, Color.fromName('red'));
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

    const { squnit, grid } = state.canvas;
    const mouseRadius = state.pointer.radius;
    const maxDigStrength = state.maxDigStrength;

    const center = new Vec2(Math.floor(mouse.x / squnit), Math.floor(mouse.y / squnit));
    const radiusInGrid = Math.ceil(mouseRadius / squnit);

    const min = new Vec2(center.x - radiusInGrid, center.y - radiusInGrid);
    const max = new Vec2(center.x + radiusInGrid, center.y + radiusInGrid);

    const rows = grid.rows + 1;
    const cols = grid.cols + 1;

    for (let y = min.y; y <= max.y; y++) {
        for (let x = min.x; x <= max.x; x++) {
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
                const d = new Vec2(x - center.x, y - center.y)
                const distsqunitd = (d.x * d.x) + (d.y * d.y);
                const radiussqunitd = radiusInGrid * radiusInGrid;

                if (distsqunitd <= radiussqunitd) {
                    const normalizedDistance = Math.sqrt(distsqunitd) / radiusInGrid;
                    const falloff = 1 - (normalizedDistance * normalizedDistance);

                    const amountToSubtract = maxDigStrength * falloff;
                    const value = Math.max(0.0, state.terrain.vertices[y][x] - amountToSubtract);
                    state.terrain.vertices[y][x] = value;
                }
            }
        }
    }
}

function settleTerrain(state) {
    const { grid } = state.canvas;
    const terrain = state.terrain;

    for (let c = 0; c <= grid.cols; c++) {
        let gaps = 0;
        for (let r = grid.rows; r >= 0; r--) {
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
    const tank = state.tank;
    const tankWidth = state.tank.width;
    const tankHeight = 16;

    const leftX = Math.floor(tank.x - tankWidth / 2);
    const rightX = Math.floor(tank.x + tankWidth / 2);

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

        const points = corners.map(p => new Vec2(
            tank.x + (p.x * cos - p.y * sin),
            avgY + (p.x * sin + p.y * cos)
        ));

        renderer.drawPolygon(points, tank.color);
    }
}

function drawProjectilePath(renderer, state) {
    const mouse = state.events.mouse;
    if (!isSome(mouse) || !mouse.present) return;

    const tank = state.tank;
    const info = surfaceInfo(tank.x, state);
    if (info === null) return;

    const pos = new Vec2(tank.x, info.y);

    const canvasSize = state.canvas.size;
    const vel = new Vec2(mouse.x - pos.x, mouse.y - pos.y);
    const g = state.env.gravity;
    const points = [pos];
    let oldVel = vel.normalise().mul(tank.trigger.power);

    for (let i=0; i<250; i++) {
        const oldPos = points[points.length-1];

        const { pos: newPos, vel: newVel } = updateProjectile(oldPos, oldVel, g, state.dt);

        if ((newPos.y > canvasSize.height) || !inRange(newPos.x, 0, canvasSize.width)) break;

        points.push(newPos);
        oldVel = newVel;
    }

    renderer.drawPolygon(points, Color.fromName('orange').withAlpha(0.5), 2, false);
}

function aimTank(renderer, state) {
    const mouse = state.events.mouse;
    const tank = state.tank;
    const info = surfaceInfo(tank.x, state);

    if (info == null || tank.ammo !== null) return;
    if (mouse.clicked !== true) {
        if (tank.trigger.power <= 0) return;

        const power = tank.trigger.power;
        state.tank.trigger.power = 0;

        const pos = new Vec2(tank.x, info.y);
        const vel = new Vec2(mouse.x - pos.x, mouse.y - pos.y).normalise().mul(power*10);

        state.tank.ammo = { pos, vel };
        return;
    }

    state.tank.trigger.power += 60 * state.dt;

    const pos = new Vec2(10, 10);
    const size = new Vec2(60, 8);

    const rect = new Rect(pos.x, pos.y, size.width, size.height);
    const progress = clamp(tank.trigger.power / tank.maxPower, 0, 1);
    const newRect = rect.copyWith({ width: progress * size.width });

    renderer.drawRect(rect, 'black', 4);
    renderer.drawRect(rect, 'black');
    renderer.drawRect(newRect, 'white');
}

function drawProjectile(renderer, state) {
    const ball = state.tank.ammo;
    if (ball == null) return;

    renderer.drawCircle(ball.pos, 5, Color.fromName('black'));
}

function moveProjectile(state) {
    const ball = state.tank.ammo;
    if (ball == null) return;

    const { pos, vel } = updateProjectile(ball.pos, ball.vel, state.env.gravity, state.dt);
    state.tank.ammo = { pos, vel };

    const canvasSize = state.canvas.size;
    if ((pos.y > canvasSize.height) || !inRange(pos.x, 0, canvasSize.width)) {
        state.tank.ammo = null;
        return;
    }
}

function moveTank(state) {
    const { keyboard } = state.events;
    const size = state.canvas.size;
    const tank = state.tank;

    if (!isSome(keyboard.key)) return;

    const isLeft = keyboard.key == 'ArrowLeft';
    const isRight = keyboard.key == 'ArrowRight';

    // TODO: Speed of tank should depend relative to slope and x component. Currently
    // the tank is moving fast on slopes.
    const vel = tank.velocity.mul(state.dt).neg();
    let newX = isLeft ? tank.x - vel.x : (isRight ? tank.x + vel.x : tank.x);
    state.tank.x = clamp(newX, tank.width/2, size.width);
}

function drawTerrain(renderer, state) {
    const { grid, squnit } = state.canvas;
    const { vertices, threshold, surfaceColor } = state.terrain;

    const strokeColor = surfaceColor;
    const fillColor = surfaceColor;
    const fill = true;
    const stroke = !fill;

    for (let i=0; i < grid.rows; i++) {
        for (let j=0; j < grid.cols; j++) {

            // Grid/Points square anatomy:
            //
            //    ----------J------->
            //  |
            //  |.          2
            //  |   B 3 +---+---+ 1 A
            //  |       |       |
            //  | I   4 +       | 0
            //  |       |       |
            //  |   C 5 +---+---+ 7 D
            //  v.          6

            const a = vertices[i+0][j+1] > threshold;
            const b = vertices[i+0][j+0] > threshold;
            const c = vertices[i+1][j+0] > threshold;
            const d = vertices[i+1][j+1] > threshold;

            const points = [
                ...(d && a ? [new Vec2(j+1.0, i+0.5)] : []),
                ...(     a ? [new Vec2(j+1.0, i+0.0)] : []),
                ...(a && b ? [new Vec2(j+0.5, i+0.0)] : []),
                ...(     b ? [new Vec2(j+0.0, i+0.0)] : []),
                ...(b && c ? [new Vec2(j+0.0, i+0.5)] : []),
                ...(     c ? [new Vec2(j+0.0, i+1.0)] : []),
                ...(c && d ? [new Vec2(j+0.5, i+1.0)] : []),
                ...(     d ? [new Vec2(j+1.0, i+1.0)] : []),
            ].map((p) => p.mul(squnit));

            if (points.length < 2) continue;

            if (fill) renderer.drawPolygon(points, fillColor);
            if (stroke) renderer.drawPolygon(points, strokeColor, 1);

        }
    }
}

function surfaceY(x, state) {
    const { grid, squnit } = state.canvas;
    const { vertices, threshold } = state.terrain;

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

function surfaceSlope(col, state) {
    const rows = state.canvas.grid.rows;
    const cols = state.canvas.grid.cols;
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
    const col = Math.floor(x / state.canvas.squnit);
    const info = surfaceSlope(col, state);

    if (info.y === null) {
        return null;
    }

    const y = info.y * state.canvas.squnit;
    return { y, slope: info.slope };
}


function main({ setup, update }) {
    const canvas = document.getElementById("id_canvas");
    const renderer = new CanvasRenderer(canvas);

    let events = {
        keyboard: {
            key: null,
            repeat: null,
        },
        mouse: {
            x: 0,
            y: 0,
            present: false,
        },
        click: false,
    };

    window.addEventListener('keydown', function(e) {
        const keyboard = { key: e.key, repeat: e.repeat };
        events = { ...events, keyboard };
    });

    window.addEventListener('keyup', function(e) {
        const keyboard = { key: null, repeat: null };
        events = { ...events, keyboard };
    });

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
    let lastMillis = 0;

    function animate(currMillis) {
        const dt = (currMillis - lastMillis) / 1000;
        state = update(renderer, { ...state, events: deepcopy(events), dt });
        requestAnimationFrame(animate);
        lastMillis = currMillis;
    }

    animate(lastMillis);
}

/// Entry Point of Program.
main({ setup, update });
