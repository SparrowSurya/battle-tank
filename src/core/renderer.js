import Color from './color.js';
import Vec2 from './vec2.js';
import Rect from './rect.js';

/**
 * Handles drawing shapes, text, and gradients on a 2D HTML5 canvas.
 */
export default class CanvasRenderer {
    /**
     * Creates a new CanvasRenderer instance.
     * @param {HTMLCanvasElement} canvas - The canvas element to render to.
     */
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
    }

    /**
     * Clears the entire canvas with a single color.
     * @param {Color|string} color - The color to clear with.
     */
    clear(color) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.fillStyle = c;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draws a line between two points.
     * @param {Vec2} v1 - Start point.
     * @param {Vec2} v2 - End point.
     * @param {Color|string} color - The stroke color.
     * @param {number} [thickness=1] - The stroke line width.
     */
    drawLine(v1, v2, color, thickness = 1) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(v2.x, v2.y);
        this.ctx.stroke();
    }

    /**
     * Draws a rectangle. Fill or outline is decided by thickness.
     * @param {Rect} rect - The rectangle dimensions.
     * @param {Color|string} color - The rect color.
     * @param {number|null} [thickness=null] - Border thickness (null for filled rectangle).
     */
    drawRect(rect, color, thickness = null) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        if (thickness === null) {
            this.ctx.fillStyle = c;
            this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        } else {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = thickness;
            this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
    }

    /**
     * Draws a circle. Fill or outline is decided by thickness.
     * @param {Vec2} center - The center position.
     * @param {number} radius - The radius of the circle.
     * @param {Color|string} color - The circle color.
     * @param {number|null} [thickness=null] - Border thickness (null for filled circle).
     */
    drawCircle(center, radius, color, thickness = null) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        if (thickness === null) {
            this.ctx.fillStyle = c;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = thickness;
            this.ctx.stroke();
        }
    }

    /**
     * Draws a polygon from a list of vertices.
     * @param {Vec2[]} points - Array of vertex coordinates.
     * @param {Color|string} color - The shape color.
     * @param {number|null} [thickness=null] - Border thickness (null for filled polygon).
     * @param {boolean} [closePath=true] - Whether to connect the last vertex to the first.
     */
    drawPolygon(points, color, thickness = null, closePath = true) {
        if (points.length < 2) return;
        const c = color instanceof Color ? color.toRGBAString() : color;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        if (closePath) this.ctx.closePath();

        if (thickness === null) {
            this.ctx.fillStyle = c;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = thickness;
            this.ctx.stroke();
        }
    }

    /**
     * Draws text on the canvas.
     * @param {string} text - The text string.
     * @param {Vec2} pos - Position of the text.
     * @param {Color|string} color - Text color.
     * @param {object} [options={}] - Styling configuration.
     * @param {string} [options.fontFamily="sans-serif"] - Font family.
     * @param {number} [options.fontSize=10] - Font size in pixels.
     * @param {string} [options.align="center"] - Text horizontal alignment.
     * @param {string} [options.baseline="middle"] - Text vertical alignment baseline.
     * @param {number|null} [options.thickness=null] - Border outline thickness (null for filled text).
     */
    drawText(text, pos, color, options = {}) {
        const {
            fontFamily = "sans-serif",
            fontSize = 10,
            align = "center",
            baseline = "middle",
            thickness = null
        } = options;

        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (thickness === null) {
            this.ctx.fillStyle = c;
            this.ctx.fillText(text, pos.x, pos.y);
        } else {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = thickness;
            this.ctx.strokeText(text, pos.x, pos.y);
        }
    }

    /**
     * Draws a single point (pixel rect).
     * @param {Vec2} pos - Position of the point.
     * @param {Color|string} color - Point color.
     * @param {number} [size=1] - Point width/height.
     */
    drawPoint(pos, color, size = 1) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.fillStyle = c;
        this.ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
    }

    /**
     * Fills a rectangular region with a linear gradient.
     * @param {Rect} rect - Bounding box to fill.
     * @param {Vec2} start - Start point of the gradient.
     * @param {Vec2} end - End point of the gradient.
     * @param {object[]} colorStops - Gradient stops array containing `{ value, color }` pairs.
     */
    drawLinearGradient(rect, start, end, colorStops) {
        const gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        for (const stop of colorStops) {
            const c = stop.color instanceof Color ? stop.color.toRGBAString() : stop.color;
            gradient.addColorStop(stop.value, c);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    /**
     * Fills a rectangular region with a radial gradient.
     * @param {Rect} rect - Bounding box to fill.
     * @param {Vec2} startCenter - Inner circle center.
     * @param {number} startRadius - Inner circle radius.
     * @param {Vec2} endCenter - Outer circle center.
     * @param {number} endRadius - Outer circle radius.
     * @param {object[]} colorStops - Gradient stops array containing `{ value, color }` pairs.
     */
    drawRadialGradient(rect, startCenter, startRadius, endCenter, endRadius, colorStops) {
        const gradient = this.ctx.createRadialGradient(
            startCenter.x, startCenter.y, startRadius,
            endCenter.x, endCenter.y, endRadius
        );

        for (const stop of colorStops) {
            const c = stop.color instanceof Color ? stop.color.toRGBAString() : stop.color;
            gradient.addColorStop(stop.value, c);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    /**
     * Draws an image or sub-image onto the canvas.
     * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} image - Source image.
     * @param {Rect} [srcRect] - Region to crop from source image.
     * @param {Rect} [dstRect] - Region to draw onto canvas.
     */
    drawImage(image, srcRect, dstRect) {
        if (srcRect && dstRect) {
            this.ctx.drawImage(image, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dstRect.x, dstRect.y, dstRect.w, dstRect.h);
        } else if (dstRect) {
            this.ctx.drawImage(image, dstRect.x, dstRect.y, dstRect.w, dstRect.h);
        } else if (srcRect) {
            this.ctx.drawImage(image, srcRect.x, srcRect.y);
        }
    }
}
