/**
 * @file main.js
 * @description Application entry point. Bootstraps the GameEngine on DOMContentLoaded.
 */

import GameEngine from './game/engine.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("id_canvas");
    if (!canvas) {
        console.error("Canvas element #id_canvas not found.");
        return;
    }

    // Initialize and start the core game engine
    const engine = new GameEngine(canvas);
    engine.start();
});
