# 2D Destructible Terrain Battle Tank Game

A 2D battle tank game built in vanilla HTML5 and JavaScript. The game features a fully destructible grid-based terrain using marching squares rendering, sand/gravel settling physics, and parabolic projectile trajectory simulation.

---

## 🎮 Gameplay & Controls

* **Left Arrow / Right Arrow**: Move the tank left and right. The tank dynamically climbs and descends slopes while maintaining a uniform speed.
* **Left Click & Drag (Mouse)**: Click on the screen to anchor the aim, and pull back to charge weapon velocity. Releasing the click fires the projectile.
* **Terrain Destruction**: Projectile hits dynamically modify the density map of the terrain, carving out circular craters.
* **Active Settling**: Gaps and floating terrain settle downward automatically whenever the mouse pointer is active inside the screen.

---

## 🚀 How to Run the Game

Because this project utilizes standard **ES6 Modules** (`type="module"`), modern browser security restrictions (CORS) prevent loading the module files directly over the `file://` protocol (e.g. by double-clicking `index.html`).

You **must** run a simple local HTTP server to play the game. Here are the easiest ways to do so:

### Option 1: Python (Built-in)
If you have Python installed, open your terminal in the project directory and run:
```bash
python3 -m http.server 8000
```
Then open your browser and navigate to: **[http://localhost:8000](http://localhost:8000)**

### Option 2: Node.js / npm (npx)
If you have Node.js installed, run:
```bash
npx serve
```
Then open your browser and navigate to the address shown in the terminal (usually **[http://localhost:3000](http://localhost:3000)** or **[http://localhost:5000](http://localhost:5000)**).

### Option 3: VS Code "Live Server" Extension
If you are using Visual Studio Code:
1. Install the **Live Server** extension.
2. Click **Go Live** at the bottom-right corner of the status bar.

---

## 📁 Architecture & File Structure

The project has been refactored from a procedural prototype into a clean, object-oriented, and modular codebase:

```
tank-battle/
├── index.html                   # HTML entry point (loads src/main.js)
├── README.md                    # Project documentation
├── src/
│   ├── core/                    # Engine & mathematical primitives
│   │   ├── vec2.js              # 2D Vector math class with utilities
│   │   ├── rect.js              # Axis-aligned bounding box (AABB) helper
│   │   ├── color.js             # Hex & RGBA color parser and lerper
│   │   ├── noise.js             # 2D Perlin Noise implementation
│   │   ├── random.js            # Mulberry32 PRNG and random helpers
│   │   ├── renderer.js          # Canvas 2D drawing wrapper class
│   │   └── utils.js             # General interpolation & projectile physics
│   │
│   ├── game/                    # Game specific domain classes
│   │   ├── input.js             # Normalized input manager for mouse & keys
│   │   ├── terrain.js           # Destructible grid terrain & settling logic
│   │   ├── tank.js              # Tank controller, aiming draw, & slope speed correction
│   │   ├── projectile.js        # Gravitational projectile & boundary checker
│   │   └── engine.js            # Game lifecycle loops, physics updates, and draw orchestration
│   │
│   └── main.js                  # Boots the GameEngine when DOM is ready
```

---

## 🛠️ Key Technical Features

1. **Marching Squares Terrain**: The terrain is defined by a density map on a 2D grid. The boundary is calculated and rendered as crisp polygons utilizing a custom Marching Squares-style geometry pipeline.
2. **Slope-Adjusted Linear Speed**: The tank's horizontal velocity is dynamically adjusted based on the surface slope angle ($\vec{v} = v_{\text{speed}} \cdot \cos(\theta)$), preventing the tank from moving excessively fast on steep inclines and maintaining constant speed.
3. **Circular Dig Crater**: Projectile impacts calculate local grid points within a specified radius, reducing densities smoothly based on distance to carve realistic craters.
