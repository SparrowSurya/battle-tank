
class CanvasRenderer {
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
    }

    drawLine(args = {}) {
        const {
            x1, y1,
            x2, y2,
            color,
            thickness = 1,
        } = args;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRect(args = {}) {
        const {
            x, y,
            width, height,
            color,
            thickness,
        } = args;

        if (!isSome(thickness)) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.lineWidth = thickness;
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(x, y, width, height);
        }
    }

    drawCircle(args = {}) {
        const {
            x, y,
            radius,
            color,
            thickness,
            angle = Math.PI*2,
            offset = 0,
        } = args;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, offset, angle);
        if (!isSome(thickness)) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.lineWidth = thickness;
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    drawPolygon(args = {}) {
        const {
            points,
            color,
            thickness,
        } = args;

        const begin = points[0];
        this.ctx.moveTo(begin.x, begin.y);
        this.ctx.beginPath();

        for (let i=0; i<points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        if (thickness === 0 || thickness === undefined || thickness == null) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    drawLinearGradient(args = {}) {
        const {
            gx0, gy0,
            gx1, gy1,
            colorStops,
            x, y,
            width,
            height,
        } = args;

        const gradient = this.ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        for (const stop of colorStops) {
            gradient.addColorStop(stop.value, stop.color);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }

    drawText(args = {}) {
        const {
            fontFamily = "sans-serif",
            fontSize = 10,
            align = "center",
            baseline = "middle",
            text,
            color,
            thickness,
            x, y,
        } = args;

        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (!isSome(thickness)) {
            this.ctx.fillStyle = color;
            this.ctx.fillText(text, x, y);
        } else {
            this.ctx.lineWidth = thickness;
            this.ctx.strokeStyle = color;
            this.ctx.strokeText(text, x, y);
        }
    }
}

class CanvasRenderer2 {
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
    }

    clear(color) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.fillStyle = c;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(v1, v2, color, thickness = 1) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(v2.x, v2.y);
        this.ctx.stroke();
    }

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

    drawPolygon(points, color, thickness = null) {
        if (points.length < 2) return;
        const c = color instanceof Color ? color.toRGBAString() : color;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();

        if (thickness === null) {
            this.ctx.fillStyle = c;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = thickness;
            this.ctx.stroke();
        }
    }

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

    drawPoint(pos, color, size = 1) {
        const c = color instanceof Color ? color.toRGBAString() : color;
        this.ctx.fillStyle = c;
        this.ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
    }

    drawLinearGradient(rect, start, end, colorStops) {
        const gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        for (const stop of colorStops) {
            const c = stop.color instanceof Color ? stop.color.toRGBAString() : stop.color;
            gradient.addColorStop(stop.value, c);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

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

    drawImage(image, srcRect, dstRect) {
        if (srcRect && dstRect) {
            this.ctx.drawImage(image, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dstRect.x, dstRect.y, dstRect.w, dstRect.h);
        } else if (dstRect) {
            this.ctx.drawImage(image, dstRect.x, dstRect.y, dstRect.w, dstRect.h);
        } else if (srcRect) {
            // Using srcRect as position if only one is provided and it's used as destination
            this.ctx.drawImage(image, srcRect.x, srcRect.y);
        }
    }
}
