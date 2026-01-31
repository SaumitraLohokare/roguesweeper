// Bomb Detector entity class
// Represents a bomb detector placed on a hidden tile to mark it as dangerous or safe

import { SPRITES } from './rendering/spriteDefinitions.js';

export class BombDetector {
    /**
     * Creates a new bomb detector
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @param {boolean} isDanger - True if placed on a bomb tile
     */
    constructor(x, y, isDanger) {
        this.x = x;
        this.y = y;
        this.isDanger = isDanger;
        this.sprite = isDanger ? SPRITES.BOMB_DETECTOR_DANGER : SPRITES.BOMB_DETECTOR_SAFE;
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
        const pixelX = offsetX + 2 + this.x * cellSize;
        const pixelY = offsetY + 2 + this.y * cellSize;
        const scale = cellSize / 12; // Assuming 10x10 pixel sprites

        renderer.drawSprite(ctx, this.sprite, pixelX, pixelY, scale);
    }
}
