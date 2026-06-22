/**
 * Manages event listeners and tracks mouse and keyboard state relative to the game canvas.
 */
export default class InputManager {
    /**
     * Initializes the InputManager with default state.
     */
    constructor() {
        /**
         * @property {object} keyboard - Tracks key codes and repeated events.
         * @property {string|null} keyboard.key - The active key code.
         * @property {boolean|null} keyboard.repeat - Whether the key is repeated.
         */
        this.keyboard = {
            key: null,
            repeat: null
        };

        /**
         * @property {object} mouse - Tracks mouse coords and click actions.
         * @property {number} mouse.x - Cursor horizontal offset.
         * @property {number} mouse.y - Cursor vertical offset.
         * @property {boolean} mouse.present - True if cursor is inside the canvas.
         * @property {boolean} mouse.clicked - True if mouse button is held down.
         */
        this.mouse = {
            x: 0,
            y: 0,
            present: false,
            clicked: false
        };
    }

    /**
     * Attaches browser event listeners to the canvas and window.
     * @param {HTMLCanvasElement} canvas - The HTML5 Canvas.
     */
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

        window.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
    }

    /**
     * Returns a snapshot of the current input states.
     * @returns {{keyboard: object, mouse: object}}
     */
    getSnapshot() {
        return {
            keyboard: { ...this.keyboard },
            mouse: { ...this.mouse }
        };
    }
}
