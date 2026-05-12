
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
