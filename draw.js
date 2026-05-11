
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

        if (thickness === undefined) {
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
        if (thickness === undefined) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.lineWidth = thickness;
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
}

