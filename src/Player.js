import { SPRITES } from './rendering/spriteDefinitions.js';
import { getSoundManager } from './Sound.js';

export const EQUIPMENTS = {
    SWORD: "SWORD",
    BOMB_DETECTOR: "BOMB_DETECTOR",
}

export class Player {

    constructor(x, y, initialHealth = 3, bombDetectorCount = 3) {
        this.x = x;
        this.y = y;

        // Visual coordinates for smooth animation
        this.visualX = x;
        this.visualY = y;
        this.isMoving = false;
        this.moveStartTime = 0;
        this.moveDuration = 150; // ms
        this.startX = x;
        this.startY = y;

        // Bump animation (when blocked)
        this.isBumping = false;
        this.bumpStartTime = 0;
        this.bumpDuration = 150;
        this.bumpDx = 0;
        this.bumpDy = 0;

        this.health = initialHealth;

        this.equippedItem = 'sword';  // 'sword' or 'bombDetector'

        this.bombDetectorCount = bombDetectorCount;  // Start with 3 bomb detectors

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
     * @param {boolean} playSound - Whether to play the damage sound (default true)
     * @returns {number} Current health
     */
    takeDamage(amount, playSound = true) {
        this.health -= amount;
        if (playSound) {
            getSoundManager().playDamage();
        }

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
            // Setup move animation
            this.startX = this.visualX; // Start from current visual pos to handle mid-move interrupts smoothly
            this.startY = this.visualY;
            this.x = newX;
            this.y = newY;
            this.isMoving = true;
            this.moveStartTime = performance.now();
            return true;
        } else {
            // Trigger bump animation
            this.isBumping = true;
            this.bumpStartTime = performance.now();
            this.bumpDx = dx;
            this.bumpDy = dy;
        }

        return false;
    }

    /**
     * Force sets the player position (e.g. initial spawn)
     */
    setPlayerPosition(newX, newY, room) {
        // Just checking valitidy, but for spawn we usually assume it's valid or forced.
        // But let's keep validity check if provided.
        if (room && !room.isValidMove(newX, newY)) {
            // Maybe allow anyway if it's spawn? 
            // Implementation maintained from original but adding visual sync
        }

        this.x = newX;
        this.y = newY;
        this.visualX = newX;
        this.visualY = newY;
        this.isMoving = false;
        return true;
    }

    /**
     * Attacks in the specified direction
     * @param {number} dx 
     * @param {number} dy 
     * @param {Room} room 
     * @returns {boolean} True if an attack was performed
     */
    attack(dx, dy, room, particleSystem = null) {
        const targetX = this.x + dx;
        const targetY = this.y + dy;

        // Visual bump for attack
        this.isBumping = true;
        this.bumpStartTime = performance.now();
        this.bumpDx = dx;
        this.bumpDy = dy;

        // Check for entity at target
        const entityObj = room.getEntityAt(targetX, targetY);

        // Always emit subtle attack particles at target
        if (particleSystem) {
            particleSystem.emit(targetX, targetY, 'attack', 5, room.cellSize);
        }

        if (entityObj && entityObj.type === 'enemy') {
            const enemy = entityObj.entity;
            const remainingHealth = enemy.takeDamage(1);
            console.log(`Player attacked Enemy! HP: ${remainingHealth}`);

            // Blood on hit
            if (particleSystem) {
                particleSystem.emit(targetX, targetY, 'blood', 10, room.cellSize);
            }

            if (remainingHealth <= 0) {
                room.removeEntity(entityObj);
                console.log("Enemy defeated!");
                if (particleSystem) {
                    // More blood on death
                    particleSystem.emit(targetX, targetY, 'blood', 20, room.cellSize);
                }
            }
        } else {
            // Attack executed on empty space or wall - particles already handled above
        }

        getSoundManager().playAttack();
        return true;
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
                // Snap back to sync (just in case)
                if (!this.isMoving) {
                    this.visualX = this.x;
                    this.visualY = this.y;
                }
            } else {
                // Sine wave bump: 0 -> 1 -> 0
                // We want it to go out about 0.3 tiles and back
                const bumpAmount = 0.3 * Math.sin(t * Math.PI);

                // If we are ALSO moving (unlikely to overlap logic-wise, but just in case), add to visual
                // But normally bump happens when NOT moving.
                if (!this.isMoving) {
                    this.visualX = this.x + this.bumpDx * bumpAmount;
                    this.visualY = this.y + this.bumpDy * bumpAmount;
                }
            }
        }
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
        this.updateVisuals();

        const pixelX = offsetX + this.visualX * cellSize;
        const pixelY = offsetY + this.visualY * cellSize;
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

