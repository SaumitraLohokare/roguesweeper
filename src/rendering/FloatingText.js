// FloatingText.js - System for displaying floating text animations (like "+10" for coins)

export class FloatingTextSystem {
    constructor() {
        this.texts = [];
    }

    /**
     * Spawns a new floating text
     * @param {string} text - The text to display (e.g., "+10")
     * @param {number} x - Screen X position (in pixels)
     * @param {number} y - Screen Y position (in pixels)
     * @param {Object} options - Optional configuration
     * @param {string} options.color - Text color (default: '#ffcc00')
     * @param {number} options.duration - Animation duration in ms (default: 1000)
     * @param {number} options.riseDistance - How far the text rises in pixels (default: 40)
     * @param {string} options.fontSize - Font size (default: '20px')
     */
    spawn(text, x, y, options = {}) {
        const floatingText = {
            text,
            x,
            y,
            startY: y,
            startTime: performance.now(),
            duration: options.duration || 1000,
            riseDistance: options.riseDistance || 40,
            color: options.color || '#ffcc00',
            fontSize: options.fontSize || '20px',
        };

        this.texts.push(floatingText);
    }

    /**
     * Updates all floating texts
     */
    update() {
        const now = performance.now();

        // Remove expired texts
        this.texts = this.texts.filter(text => {
            const elapsed = now - text.startTime;
            return elapsed < text.duration;
        });
    }

    /**
     * Renders all floating texts
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        const now = performance.now();

        this.texts.forEach(text => {
            const elapsed = now - text.startTime;
            const progress = elapsed / text.duration; // 0 to 1

            // Ease out cubic for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            // Calculate position (moves up)
            const currentY = text.startY - (text.riseDistance * easeProgress);

            // Calculate opacity (fades out)
            const opacity = 1 - progress;

            // Draw text
            ctx.save();
            ctx.font = `${text.fontSize} "Press Start 2P", monospace`;
            ctx.fillStyle = text.color;
            ctx.globalAlpha = opacity;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText(text.text, text.x, currentY);
            ctx.restore();
        });
    }

    /**
     * Clears all floating texts
     */
    clear() {
        this.texts = [];
    }
}
