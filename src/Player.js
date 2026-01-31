import { SPRITES } from './rendering/spriteDefinitions.js';
import { getSoundManager } from './Sound.js';

export const EQUIPMENTS = {
    SWORD: "SWORD",
    BOMB_DETECTOR: "BOMB_DETECTOR",
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.health = 3;

        this.equippedItem = 'sword';  // 'sword' or 'bombDetector'

        this.bombDetectorCount = 3;  // Start with 3 bomb detectors

        this.isDamageFlashing = false  // Track damage flash effect
    }

    /**
     * Toggles between sword and bomb detector equipment
     */
    toggleEquip() {
        this.equippedItem = this.equippedItem === 'sword' ? 'bombDetector' : 'sword';
        console.log(`Equipped: ${this.equippedItem}`);
    }

    /**
     * Uses a bomb detector (decrements count)
     * @returns {boolean} True if bomb detector was used, false if none available
     */
    useBombDetector() {
        if (this.bombDetectorCount > 0) {
            this.bombDetectorCount--;
            return true;
        }
        return false;
    }

    /**
     * Adds a bomb detector to inventory
     */
    addBombDetector() {
        this.bombDetectorCount++;
    }

    /**
     * Reduces player health by the given amount
     * @param {number} amount 
     * @returns {number} Current health
     */
    takeDamage(amount) {
        this.health -= amount;
        getSoundManager().playDamage();

        // Trigger red flash effect
        this.isDamageFlashing = true;
        setTimeout(() => {
            this.isDamageFlashing = false;
        }, 250); // Flash for 0.5 seconds

        return this.health;
    }

    /**
     * Attempts to move the player
     * @param {number} dx - Change in x (-1, 0, 1)
     * @param {number} dy - Change in y (-1, 0, 1)
     * @param {Room} room - The current room to check collisions against
     * @returns {boolean} - True if moved, false if blocked
     */
    move(dx, dy, room) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (room.isValidMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }

        return false;
    }

    /**
     * Attempts to move the player
     * @param {number} dx - Change in x (-1, 0, 1)
     * @param {number} dy - Change in y (-1, 0, 1)
     * @param {Room} room - The current room to check collisions against
     * @returns {boolean} - True if moved, false if blocked
     */
    setPlayerPosition(newX, newY, room) {
        if (room.isValidMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }

        return false;
    }

    /**
     * Attacks in the specified direction
     * @param {number} dx 
     * @param {number} dy 
     * @param {Room} room 
     * @returns {boolean} True if an attack was performed (even if it missed/hit nothing? Or only if successful? Plan said true if turn consumed. Let's return true.)
     */
    attack(dx, dy, room) {
        const targetX = this.x + dx;
        const targetY = this.y + dy;

        // Check for entity at target
        const entityObj = room.getEntityAt(targetX, targetY);

        if (entityObj && entityObj.type === 'enemy') {
            const enemy = entityObj.entity;
            const remainingHealth = enemy.takeDamage(1);
            console.log(`Player attacked Enemy! HP: ${remainingHealth}`);

            if (remainingHealth <= 0) {
                room.removeEntity(entityObj);
                console.log("Enemy defeated!");
            }
        }
        getSoundManager().playAttack();
        return true;
    }

    /**
     * Renders the player
     * @param {CanvasRenderingContext2D} ctx 
     * @param {SpriteRenderer} renderer 
     * @param {number} cellSize 
     * @param {number} offsetX 
     * @param {number} offsetY 
     */
    render(ctx, renderer, cellSize, offsetX, offsetY) {
        const pixelX = offsetX + this.x * cellSize;
        const pixelY = offsetY + this.y * cellSize;
        const scale = cellSize / 10; // Assuming 10x10 sprites

        // Apply red flash effect if taking damage
        if (this.isDamageFlashing) {
            ctx.save();

            // Draw the sprite normally first
            renderer.drawSprite(ctx, SPRITES.PLAYER, pixelX, pixelY, scale);

            // Apply red tint overlay only to the sprite pixels
            // Using 'multiply' blend mode to tint only visible pixels
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgb(255, 100, 100)'; // Light red tint
            ctx.fillRect(pixelX, pixelY, cellSize, cellSize);


            ctx.restore();
            return;
        }
        renderer.drawSprite(ctx, SPRITES.PLAYER, pixelX, pixelY, scale);
    }
}
