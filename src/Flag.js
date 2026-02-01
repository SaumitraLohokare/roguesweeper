// Bomb Detector entity class
// Represents a bomb detector placed on a hidden tile to mark it as dangerous or safe

import { SPRITES } from './rendering/spriteDefinitions.js';

export class Flag {
    /**
     * Creates a new flag
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = SPRITES.FLAG;
    }

    /**
     * Renders the bomb detector to the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {SpriteRenderer} renderer - Sprite renderer instance
     * @param {number} cellSize - Size of each cell in pixels
     * @param {number} offsetX - X offset for rendering (in pixels)
     * @param {number} offsetY - Y offset for rendering (in pixels)
     */
    render(ctx, renderer, cellSize, offsetX = 0, offsetY = 0) {
        const pixelX = offsetX + 2.5 + this.x * cellSize;
        const pixelY = offsetY + 2.5 + this.y * cellSize;
        const scale = cellSize / 12; // Assuming 10x10 pixel sprites

        renderer.drawSprite(ctx, this.sprite, pixelX, pixelY, scale);
    }
}
