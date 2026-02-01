// Enemy entity class
// Represents an enemy placed in the room grid

import { SPRITES } from './rendering/spriteDefinitions.js';
import { HorizontalChaseStrategy } from './ai/EnemyBehaviors.js';

export class Enemy {
    /**
     * Creates a new enemy
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @param {Object} behavior - AI Behavior Strategy (default: HorizontalChaseStrategy)
     * @param {Object} sprite - Sprite definition (default: SPRITES.ENEMY)
     */
    constructor(x, y, behavior = null, sprite = null) {
        // Internal storage for logical position
        this._x = x;
        this._y = y;

        // Visual position
        this.visualX = x;
        this.visualY = y;
        this.startX = x;
        this.startY = y;
        this.isMoving = false;
        this.moveStartTime = 0;
        this.moveDuration = 150; // ms

        // Bump animation
        this.isBumping = false;
        this.bumpStartTime = 0;
        this.bumpDuration = 150;
        this.bumpDx = 0;
        this.bumpDy = 0;

        this.active = false;

        // Default to Horizontal Strategy if none provided
        this.behavior = behavior || new HorizontalChaseStrategy();

        // Default to standard enemy sprite if none provided
        this.sprite = sprite || SPRITES.ENEMY;
        this.activeSprite = this.sprite;

        this.health = 1;
    }

    // Getters and Setters to intercept position changes
    get x() { return this._x; }
    set x(value) {
        if (this._x !== value) {
            this.startX = this.visualX;
            this.startY = this.visualY;
            this._x = value;
            this.isMoving = true;
            this.moveStartTime = performance.now();
        }
    }

    get y() { return this._y; }
    set y(value) {
        if (this._y !== value) {
            this.startX = this.visualX;
            this.startY = this.visualY;
            this._y = value;
            this.isMoving = true;
            this.moveStartTime = performance.now();
        }
    }

    /**
     * Reduces enemy health
     * @param {number} amount
     * @returns {number} Current health
     */
    takeDamage(amount) {
        this.health -= amount;
        return this.health;
    }

    /**
     * Executes the enemy's turn
     * @param {Object} player - The player object
     * @param {Room} room - The current room
     * @returns {boolean} True if the enemy moved or acted
     */
    takeTurn(player, room, particleSystem = null) {
        const result = this.behavior.takeTurn(this, player, room, particleSystem);

        // Sync active state from behavior (if it changed)
        if (this.behavior.active && !this.active) {
            this.active = true;
        }

        // Check if blocked to trigger bump
        if (!result.moved && this.behavior.lastDesiredMove && this.behavior.active) {
            // Trigger bump towards the desired move
            const dx = this.behavior.lastDesiredMove.x - this.x;
            const dy = this.behavior.lastDesiredMove.y - this.y;

            // Only bump if it's a cardinal move (sanity check)
            if (dx !== 0 || dy !== 0) {
                this.isBumping = true;
                this.bumpStartTime = performance.now();
                this.bumpDx = Math.sign(dx);
                this.bumpDy = Math.sign(dy);
            }
        }

        return result.moved;
    }

    updateVisuals() {
        const now = performance.now();

        // Handle Moving
        if (this.isMoving) {
            const t = (now - this.moveStartTime) / this.moveDuration;
            if (t >= 1) {
                this.visualX = this.x;
                this.visualY = this.y;
                this.isMoving = false;
            } else {
                // Ease Out Quad
                const ease = 1 - (1 - t) * (1 - t);
                this.visualX = this.startX + (this.x - this.startX) * ease;
                this.visualY = this.startY + (this.y - this.startY) * ease;
            }
        }

        // Handle Bumping
        if (this.isBumping) {
            const t = (now - this.bumpStartTime) / this.bumpDuration;
            if (t >= 1) {
                this.isBumping = false;
                if (!this.isMoving) {
                    this.visualX = this.x;
                    this.visualY = this.y;
                }
            } else {
                // Sine wave bump
                const bumpAmount = 0.3 * Math.sin(t * Math.PI);
                if (!this.isMoving) {
                    this.visualX = this.x + this.bumpDx * bumpAmount;
                    this.visualY = this.y + this.bumpDy * bumpAmount;
                }
            }
        }
    }

    /**
     * Renders the enemy to the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {SpriteRenderer} renderer - Sprite renderer instance
     * @param {number} cellSize - Size of each cell in pixels
     * @param {number} offsetX - X offset for rendering (in pixels)
     * @param {number} offsetY - Y offset for rendering (in pixels)
     */
    render(ctx, renderer, cellSize, offsetX = 0, offsetY = 0) {
        this.updateVisuals();

        const pixelX = offsetX + this.visualX * cellSize;
        const pixelY = offsetY + this.visualY * cellSize;
        const scale = cellSize / 10; // Assuming 10x10 pixel sprites

        renderer.drawSprite(ctx, this.sprite, pixelX, pixelY, scale);
    }
}
