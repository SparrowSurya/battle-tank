export default class InputManager {
    constructor() {
        this.keyboard = {
            key: null,
            repeat: null
        };
        this.mouse = {
            x: 0,
            y: 0,
            present: false,
            clicked: false
        };
    }

    listen(canvas) {
        window.addEventListener('keydown', (e) => {
            this.keyboard.key = e.key;
            this.keyboard.repeat = e.repeat;
        });

        window.addEventListener('keyup', (e) => {
            if (this.keyboard.key === e.key) {
                this.keyboard.key = null;
                this.keyboard.repeat = null;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
            this.mouse.present = true;
        });

        canvas.addEventListener('mouseleave', () => {
            this.mouse.present = false;
        });

        canvas.addEventListener('mousedown', () => {
            this.mouse.clicked = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
    }

    getSnapshot() {
        return {
            keyboard: { ...this.keyboard },
            mouse: { ...this.mouse }
        };
    }
}
