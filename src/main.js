import GameEngine from './game/engine.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("id_canvas");
    if (!canvas) {
        console.error("Canvas element #id_canvas not found.");
        return;
    }

    const engine = new GameEngine(canvas);
    engine.start();
});
