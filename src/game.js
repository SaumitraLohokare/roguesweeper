// Game logic and mechanics

import { SpriteSheet } from './rendering/SpriteSheet.js';
import { SpriteRenderer } from './rendering/SpriteRenderer.js';
import { PLAYER_MOVE_RESULT, Room, SIDE } from './Room.js';
import { Input } from './Input.js';
import { Player } from './Player.js';
import { getSoundManager } from './Sound.js';
import { ParticleSystem } from './rendering/ParticleSystem.js';
import { FloatingTextSystem } from './rendering/FloatingText.js';

const DIFFICULTY_TIERS = [
    { maxRoom: 3, config: { width: 12, height: 12, coinCount: 3, bombCount: 10, enemyCount: 3, innerWallDensity: 0.15 } },
    { maxRoom: 6, config: { width: 18, height: 18, coinCount: 5, bombCount: 15, enemyCount: 8, innerWallDensity: 0.45, minChunkSize: 6 } },
    { maxRoom: 10, config: { width: 24, height: 24, coinCount: 8, bombCount: 25, enemyCount: 14, innerWallDensity: 0.55, minChunkSize: 6 } },
    { maxRoom: Infinity, config: { width: 30, height: 30, coinCount: 10, bombCount: 35, enemyCount: 20, innerWallDensity: 0.60, minChunkSize: 9 } }
];

const TUTORIAL_COMPLETED_KEY = 'roguesweeper_tutorial_finished';

function getTutorialCompletedLevel() {
    return parseInt(localStorage.getItem(TUTORIAL_COMPLETED_KEY)) || 0;
}

function isTutorialFinished() {
    return getTutorialCompletedLevel() == -1;
}

function setTutorialCompletedLevel(completedLevel) {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, completedLevel);
}

// Tutorial levels - premade levels that play before random generation
const TUTORIAL_LEVELS = [
    {
        width: 7,
        height: 7,
        entranceSide: SIDE.TOP,
        exitSide: SIDE.BOTTOM,
        bombPositions: [
            { x: 3, y: 3 },
        ],
        enemyPositions: [
        ],
        coinPositions: [
        ],
        innerWallPositions: [
            { x: 5, y: 5 },
        ],
        tutorialText: "Welcome! Use WASD to move. Reach the exit at the bottom."
    },
    {
        width: 7,
        height: 9,
        entranceSide: SIDE.TOP,
        exitSide: SIDE.BOTTOM,
        bombPositions: [],
        enemyPositions: [
            { x: 3, y: 5, isVertical: true },
        ],
        coinPositions: [
        ],
        innerWallPositions: [
            { x: 1, y: 5 },
            { x: 2, y: 5 },
            { x: 4, y: 5 },
            { x: 5, y: 5 },
        ],
        tutorialText: "Enemies move when you do. Use Arrow Keys to attack them!"
    },
    {
        width: 4,
        height: 10,
        entranceSide: SIDE.TOP,
        exitSide: SIDE.BOTTOM,
        bombPositions: [
            { x: 1, y: 3 },
            { x: 1, y: 7 },
        ],
        enemyPositions: [
        ],
        coinPositions: [
        ],
        innerWallPositions: [
        ],
        tutorialText: "Switch to Bomb Detector with Space. Mark suspect tiles with Arrow Keys."
    },
    {
        width: 3,
        height: 10,
        entranceSide: SIDE.TOP,
        exitSide: SIDE.BOTTOM,
        bombPositions: [],
        enemyPositions: [
        ],
        coinPositions: [
            { x: 1, y: 3 },
            { x: 1, y: 6 },
        ],
        innerWallPositions: [
        ],
        tutorialText: "Collect coins! You can buy more detectors with 'B' (30 coins)."
    },
    // {
    //     width: 30,
    //     height: 15,
    //     entranceSide: SIDE.TOP,
    //     exitSide: SIDE.BOTTOM,
    //     bombPositions: [
    //         { x: 3, y: 3 },
    //         { x: 4, y: 3 },
    //         { x: 5, y: 3 },
    //         { x: 4, y: 4 },
    //         { x: 4, y: 5 },

    //         { x: 8, y: 3 },
    //         { x: 8, y: 4 },
    //         { x: 8, y: 5 },
    //         { x: 9, y: 4 },
    //         { x: 10, y: 3 },
    //         { x: 10, y: 4 },
    //         { x: 10, y: 5 },

    //         { x: 13, y: 4 },
    //         { x: 13, y: 5 },
    //         { x: 14, y: 3 },
    //         { x: 15, y: 4 },
    //         { x: 15, y: 5 },

    //         { x: 13, y: 4 },
    //         { x: 13, y: 5 },
    //         { x: 14, y: 3 },
    //         { x: 15, y: 4 },
    //         { x: 15, y: 5 },

    //         { x: 18, y: 5 },
    //         { x: 18, y: 4 },
    //         { x: 18, y: 3 },
    //         { x: 19, y: 3 },
    //         { x: 20, y: 4 },

    //         { x: 21, y: 3 },
    //         { x: 21, y: 4 },
    //         { x: 21, y: 5 },

    //         { x: 24, y: 3 },
    //         { x: 24, y: 4 },
    //         { x: 24, y: 5 },
    //         { x: 25, y: 4 },
    //         { x: 26, y: 3 },
    //         { x: 26, y: 5 },

    //         { x: 3, y: 9 },
    //         { x: 4, y: 10 },
    //         { x: 5, y: 9 },
    //         { x: 4, y: 11 },

    //         { x: 8, y: 9 },
    //         { x: 9, y: 9 },
    //         { x: 10, y: 9 },
    //         { x: 8, y: 10 },
    //         { x: 10, y: 10 },
    //         { x: 8, y: 11 },
    //         { x: 9, y: 11 },
    //         { x: 10, y: 11 },

    //         { x: 14, y: 9 },
    //         { x: 14, y: 10 },
    //         { x: 14, y: 11 },
    //         { x: 15, y: 11 },
    //         { x: 16, y: 11 },
    //         { x: 16, y: 10 },
    //         { x: 16, y: 9 },
    //     ],
    //     enemyPositions: [
    //     ],
    //     coinPositions: [
    //     ],
    //     innerWallPositions: [
    //     ],
    //     tutorialText: "The floor is yours. Good luck reaching the deep dungeon!"
    // }

];

/**
 * Gets the available middle panel size for room rendering
 * @returns {{width: number, height: number}} Available dimensions in pixels
 */
function getMiddlePanelSize() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return { width: 800, height: 600 }; // Default fallback

    const width = canvas.width;
    const height = canvas.height;
    const minSidePanelWidth = 250;
    const maxMiddleWidth = width - (minSidePanelWidth * 2);

    let middleSize = Math.min(height, maxMiddleWidth);
    if (middleSize < 0) middleSize = width;

    return { width: middleSize, height: middleSize };
}

function getRoomConfig(roomNumber) {
    const tier = DIFFICULTY_TIERS.find(t => roomNumber <= t.maxRoom);
    return tier ? tier.config : DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1].config;
}

let gameState = {
    running: false,
    spriteSheets: {},  // Store multiple sprite sheets by name
    spriteRenderer: null,
    currentRoom: null,  // Current room being displayed
    input: null,
    player: null,
    gameOver: false,
    coins: 0,
    score: 0,
    roomNumber: 1,
    volume: 0.8,
    isDraggingVolume: false,
    volumeSlider: { x: 0, y: 0, w: 100, h: 20 }, // Store slider layout for click detection
    currentTutorialIndex: 0,  // Track tutorial progress: 0-based index, -1 means tutorials complete
    particleSystem: null,
    floatingTextSystem: null,
    transitioning: false,
    transitionAlpha: 0,
    transitionState: 'IN', // 'IN' (fading in new room) or 'OUT' (fading out old room)
};

export function initGame(canvas, ctx) {
    console.log('Game initialized');

    // Initialize sprite renderer (works with multiple sheets)
    gameState.spriteRenderer = new SpriteRenderer();
    gameState.particleSystem = new ParticleSystem();
    gameState.floatingTextSystem = new FloatingTextSystem();

    // Initialize input
    gameState.input = new Input();

    // Sync initial volume
    getSoundManager().setMasterVolume(gameState.volume);

    // Load sprite sheet(s) - you can add more sheets here in the future
    gameState.spriteSheets.sheet_1 = new SpriteSheet('./assets/images/sheet_1.png', 10, 10, () => {
        console.log('sheet_1 loaded');
        checkAllSheetsLoaded(canvas, ctx);
    });

    // Register the sprite sheet with the renderer
    gameState.spriteRenderer.registerSpriteSheet('sheet_1', gameState.spriteSheets.sheet_1);

    registerInputs(canvas);
}

function registerInputs(canvas) {
    // Helper to update volume from mouse position
    const updateVolumeFromMouse = (clientX, clientY) => {
        if (!gameState.volumeSlider) return;
        const vs = gameState.volumeSlider;
        // Check if within reasonable horizontal bounds specifically for the slider
        // Just rely on X projection for the slider knob position
        let newVol = (clientX - vs.x) / vs.w;
        newVol = Math.max(0, Math.min(1, newVol));

        gameState.volume = newVol;
        getSoundManager().setMasterVolume(newVol);
    };

    canvas.addEventListener('mousedown', (event) => {
        // Ensure audio context is resume and music is started on first interaction
        getSoundManager().startMusic();

        // Check if hitting volume slider
        if (gameState.volumeSlider) {
            const vs = gameState.volumeSlider;
            const mx = event.clientX;
            const my = event.clientY;
            const padding = 15; // Generous hit area

            if (mx >= vs.x - padding && mx <= vs.x + vs.w + padding && my >= vs.y - padding && my <= vs.y + vs.h + padding) {
                gameState.isDraggingVolume = true;
                updateVolumeFromMouse(mx, my);
                return;
            }
        }
    });

    window.addEventListener('mousemove', (event) => {
        if (gameState.isDraggingVolume) {
            updateVolumeFromMouse(event.clientX, event.clientY);
        }
    });

    window.addEventListener('mouseup', () => {
        gameState.isDraggingVolume = false;
    });

    // Keep click for board interactions to prevent accidental flag placement while dragging
    canvas.addEventListener('click', (event) => {
        // If we were just dragging (or mouseup happened), don't place flag? 
        // Actually, if isDraggingVolume was just set to false in mouseup, we might need a way to know "did we drag"?
        // But simpler: if the click is ON the slider, we ignore it (handled by mousedown/drag).
        // If click is on board, we process it. 

        // However, standard click logic might fire after mousedown/up.
        // Let's check collision again.

        if (gameState.volumeSlider) {
            const vs = gameState.volumeSlider;
            const mx = event.clientX;
            const my = event.clientY;
            const padding = 15;

            if (mx >= vs.x - padding && mx <= vs.x + vs.w + padding && my >= vs.y - padding && my <= vs.y + vs.h + padding) {
                return; // Ignore click on slider (handled by drag)
            }
        }

        const width = canvas.width;
        const height = canvas.height;
        let minSize = Math.min(height, width);

        const middleX = (width - minSize) / 2;
        const middleY = (height - minSize) / 2;

        const roomPixelWidth = gameState.currentRoom.width * gameState.currentRoom.cellSize;
        const roomPixelHeight = gameState.currentRoom.height * gameState.currentRoom.cellSize;

        const offsetX = middleX + (minSize - roomPixelWidth) / 2;
        const offsetY = middleY + (minSize - roomPixelHeight) / 2;

        let mouseXPosition = event.clientX - offsetX;
        let mouseYPosition = event.clientY - offsetY;

        let mouseXPixel = Math.floor(mouseXPosition / gameState.currentRoom.cellSize);
        let mouseYPixel = Math.floor(mouseYPosition / gameState.currentRoom.cellSize);

        gameState.currentRoom.placeFlag(mouseXPixel, mouseYPixel);
    });
}

function checkAllSheetsLoaded(canvas, ctx) {
    // Check if all sprite sheets are loaded
    const allLoaded = Object.values(gameState.spriteSheets).every(sheet => sheet.isReady());

    if (allLoaded && !gameState.running) {
        console.log('All sprite sheets ready, starting game loop');

        startNewGame();

        gameState.running = true;
        gameLoop(canvas, ctx);
    }
}

function startNewGame() {
    console.log('Starting new game...');

    // Reset Game State
    gameState.gameOver = false;
    gameState.coins = 0;
    gameState.score = 0;
    gameState.roomNumber = 1;

    if (isTutorialFinished()) {
        console.log('Tutorial already completed, skipping to random rooms');
        gameState.currentTutorialIndex = -1;
        startRandomLevel(SIDE.TOP); // Initial room always enters from top
    } else {
        let currentTutorialIndex = getTutorialCompletedLevel();
        gameState.currentTutorialIndex = currentTutorialIndex;  // Start from first tutorial
        loadTutorialLevel(currentTutorialIndex);
        console.log(`Tutorial level ${currentTutorialIndex} loaded`);
    }

    gameState.player.health = 3;
    gameState.player.bombDetectorCount = 3;
}

function loadTutorialLevel(index) {
    if (index < 0 || index >= TUTORIAL_LEVELS.length) {
        console.error(`Invalid tutorial index: ${index}`);
        return;
    }

    const tutorialConfig = TUTORIAL_LEVELS[index];

    // Get available screen dimensions
    const panelSize = getMiddlePanelSize();

    // Create room with manual setup enabled
    gameState.currentRoom = new Room({
        width: tutorialConfig.width,
        height: tutorialConfig.height,
        availableWidth: panelSize.width,
        availableHeight: panelSize.height,
        entranceSide: tutorialConfig.entranceSide,
        exitSide: tutorialConfig.exitSide,
        exitPos: tutorialConfig.exitPos, // Optional
        manualSetup: true  // Skip random generation
    });

    // Place inner walls
    tutorialConfig.innerWallPositions.forEach(pos => {
        gameState.currentRoom.manualPlaceInnerWall(pos.x, pos.y);
    });

    // Place bombs
    tutorialConfig.bombPositions.forEach(pos => {
        gameState.currentRoom.manualPlaceBomb(pos.x, pos.y);
    });

    // Place enemies
    tutorialConfig.enemyPositions.forEach(pos => {
        gameState.currentRoom.manualPlaceEnemy(pos.x, pos.y, pos.isVertical);
    });

    // Place coins
    tutorialConfig.coinPositions.forEach(pos => {
        gameState.currentRoom.manualPlaceCoin(pos.x, pos.y);
    });

    // Calculate hints after all entities are placed
    gameState.currentRoom.calculateHints();

    // Create player at entrance
    const entrance = gameState.currentRoom.entrancePos;
    gameState.player = new Player(entrance.x, entrance.y, 1);

    // Trigger initial room logic for player start position
    gameState.currentRoom.onPlayerEnter(gameState.player.x, gameState.player.y);

    // Trigger Spawn Particles
    if (gameState.particleSystem) {
        gameState.particleSystem.emit(gameState.player.x, gameState.player.y, 'spawn', 30, gameState.currentRoom.cellSize);
    }
}

function startNextLevel() {
    console.log("Starting transition to next level...");
    gameState.transitioning = true;
    gameState.transitionState = 'OUT';
    gameState.transitionAlpha = 0;
}

function performNextLevel() {
    // Increment level
    let currentTutorialIndex = getTutorialCompletedLevel();

    // Check if we're still in tutorial mode
    if (currentTutorialIndex >= 0) {
        if (gameState.currentTutorialIndex < TUTORIAL_LEVELS.length - 1) {
            // Load next tutorial level
            gameState.currentTutorialIndex++;
            setTutorialCompletedLevel(gameState.currentTutorialIndex);
            loadTutorialLevel(gameState.currentTutorialIndex);
            console.log(`Tutorial level ${gameState.currentTutorialIndex + 1} loaded`);
            return;
        }

        // Last tutorial level finished
        console.log('All tutorial levels completed!');
        gameState.currentTutorialIndex = -1;
        setTutorialCompletedLevel(-1);
        if (gameState.player) {
            gameState.player.health = 3;
            gameState.player.bombDetectorCount = 3;
        }
        // Room number stays at 1 for the first random room
    } else {
        // Already in random generation mode, continue as normal
        gameState.roomNumber++;
    }

    // Already in random generation mode, or just finished last tutorial
    const previousExitSide = gameState.currentRoom.exitSide;
    const newEntranceSide = Room.getOppositeSide(previousExitSide);
    startRandomLevel(newEntranceSide);
}

function startRandomLevel(entranceSide) {
    // Get config for new level
    const config = getRoomConfig(gameState.roomNumber);

    // Get available screen dimensions
    const panelSize = getMiddlePanelSize();

    // Create new room
    gameState.currentRoom = new Room({
        ...config,
        availableWidth: panelSize.width,
        availableHeight: panelSize.height,
        entranceSide: entranceSide
    });

    const entrance = gameState.currentRoom.entrancePos;

    if (!gameState.player) {
        gameState.player = new Player(entrance.x, entrance.y, 3);
    } else {
        // Move player to new entrance
        gameState.player.setPlayerPosition(entrance.x, entrance.y, gameState.currentRoom);
    }

    gameState.currentRoom.onPlayerEnter(gameState.player.x, gameState.player.y);

    // Trigger Spawn Particles
    if (gameState.particleSystem) {
        gameState.particleSystem.emit(gameState.player.x, gameState.player.y, 'spawn', 30, gameState.currentRoom.cellSize);
    }
}

function gameLoop(canvas, ctx) {
    if (!gameState.running) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    update();

    // Handle Transition
    if (gameState.transitioning) {
        if (gameState.transitionState === 'OUT') {
            gameState.transitionAlpha += 0.01; // Slower fade
            if (gameState.transitionAlpha >= 1) {
                gameState.transitionAlpha = 1;
                performNextLevel();
                gameState.transitionState = 'IN';
            }
        } else if (gameState.transitionState === 'IN') {
            gameState.transitionAlpha -= 0.01; // Slower fade
            if (gameState.transitionAlpha <= 0) {
                gameState.transitionAlpha = 0;
                gameState.transitioning = false;
            }
        }
    }

    // Render game
    render(ctx);

    // Continue loop
    requestAnimationFrame(() => gameLoop(canvas, ctx));
}

function update() {
    if (!gameState.player || !gameState.input) return;

    // Handle Game Over Input
    if (gameState.gameOver) {
        if (gameState.input.isJustPressed('KeyR')) {
            startNewGame();
        }
        gameState.input.update(); // Make sure to consume inputs
        return;
    }

    let actionTaken = false;

    // --- Equipment Toggle (Space) ---
    if (gameState.input.isJustPressed('Space')) {
        gameState.player.toggleEquip();
    }

    // --- Buy Bomb Detector (B key) ---
    if (gameState.input.isJustPressed('KeyB')) {
        if (gameState.coins >= 30) {
            gameState.coins -= 30;
            gameState.player.addBombDetector();
            console.log('Bought a bomb detector! Bomb Detectors: ' + gameState.player.bombDetectorCount);
        } else {
            console.log('Not enough coins to buy a bomb detector (need 30)');
        }
    }

    // --- Movement Controls (WASD) ---
    let dx = 0;
    let dy = 0;

    if (gameState.input.isJustPressed('KeyW')) dy = -1;
    else if (gameState.input.isJustPressed('KeyS')) dy = 1;

    if (gameState.input.isJustPressed('KeyA')) dx = -1;
    else if (gameState.input.isJustPressed('KeyD')) dx = 1;

    if (dx !== 0 || dy !== 0) {
        if (gameState.player.move(dx, dy, gameState.currentRoom)) {
            const playerEnterResultState = gameState.currentRoom.onPlayerEnter(gameState.player.x, gameState.player.y);
            if (playerEnterResultState != PLAYER_MOVE_RESULT.INVALID) {
                actionTaken = true;
            }

            switch (playerEnterResultState) {
                case PLAYER_MOVE_RESULT.REACHED_EXIT:
                    console.log("We have reached exit");
                    getSoundManager().playWin();
                    startNextLevel();
                    break;
                case PLAYER_MOVE_RESULT.NORMAL:
                    getSoundManager().playMove();
                    break;
                case PLAYER_MOVE_RESULT.COIN:
                    getSoundManager().playCoin();

                    // Calculate coin count position for floating text
                    // The coin count is displayed at the top-right of the middle panel
                    const canvas = document.getElementById('gameCanvas');
                    if (canvas && gameState.floatingTextSystem) {
                        const width = canvas.width;
                        const height = canvas.height;
                        const minSidePanelWidth = 250;
                        const maxMiddleWidth = width - (minSidePanelWidth * 2);
                        let middleSize = Math.min(height, maxMiddleWidth);
                        if (middleSize < 0) middleSize = width;
                        const middleX = (width - middleSize) / 2;
                        const middleY = (height - middleSize) / 2;
                        const guiPadding = 20;

                        // Position below the coin counter (top-right of middle section)
                        const coinCountX = middleX + middleSize - guiPadding;
                        const coinCountY = middleY + guiPadding + 30; // +30 to position below the text

                        gameState.floatingTextSystem.spawn('+10', coinCountX, coinCountY, {
                            color: '#ffcc00',
                            duration: 1200,
                            riseDistance: 50,
                            fontSize: '16px'
                        });
                    }

                    gameState.coins += 10;
                    gameState.score += 10;
                    break;
                case PLAYER_MOVE_RESULT.ENEMY:
                    // Enemy hit - play damage sound
                    const enemyHealthRemaining = gameState.player.takeDamage(1);
                    console.log(`Hit by enemy! Health: ${enemyHealthRemaining}`);
                    gameState.particleSystem.emit(gameState.player.x, gameState.player.y, 'explosion', 20, gameState.currentRoom.cellSize);
                    break;
                case PLAYER_MOVE_RESULT.BOMB:
                    // Bomb explosion - play bomb sound only (not damage sound)
                    getSoundManager().playBomb();
                    const bombHealthRemaining = gameState.player.takeDamage(1, false);
                    console.log(`Hit by bomb! Health: ${bombHealthRemaining}`);
                    gameState.particleSystem.emit(gameState.player.x, gameState.player.y, 'explosion', 20, gameState.currentRoom.cellSize);
                    break;

            }

        }
    }

    // --- Arrow Key Controls (Attack or Place Bomb Detector based on equipped item) ---
    if (!actionTaken) {
        let arrowDx = 0;
        let arrowDy = 0;

        if (gameState.input.isJustPressed('ArrowUp')) arrowDy = -1;
        else if (gameState.input.isJustPressed('ArrowDown')) arrowDy = 1;
        else if (gameState.input.isJustPressed('ArrowLeft')) arrowDx = -1;
        else if (gameState.input.isJustPressed('ArrowRight')) arrowDx = 1;

        if (arrowDx !== 0 || arrowDy !== 0) {
            const targetX = gameState.player.x + arrowDx;
            const targetY = gameState.player.y + arrowDy;

            if (gameState.player.equippedItem === 'bombDetector') {
                // --- Bomb Detector Placement ---
                // Check if target tile is hidden
                if (gameState.currentRoom.isHidden(targetX, targetY)) {
                    // Try to use a bomb detector
                    if (gameState.player.useBombDetector()) {
                        // Place the bomb detector
                        if (gameState.currentRoom.placeBombDetector(targetX, targetY)) {
                            actionTaken = true;
                        } else {
                            // Failed to place, refund the bomb detector
                            gameState.player.addBombDetector();
                        }
                    } else {
                        console.log('No bomb detectors available!');
                    }
                } else {
                    console.log('Can only place bomb detectors on hidden tiles');
                }
            } else {
                // --- Attack (sword equipped) ---
                if (gameState.player.attack(arrowDx, arrowDy, gameState.currentRoom, gameState.particleSystem)) {
                    actionTaken = true;
                }
            }
        }
    }

    // --- Enemy Turn ---
    // Trigger only if player performed an action (Move or Attack)
    if (actionTaken) {
        if (gameState.player.health > 0) {
            gameState.currentRoom.updateEnemies(gameState.player, gameState.particleSystem);
        }

        // --- Game State Check ---
        if (gameState.player.health <= 0) {
            gameState.gameOver = true;
            getSoundManager().playLose();
            console.log("Game Over!");
        }
    }

    // Update particles
    if (gameState.particleSystem) {
        gameState.particleSystem.update();
    }

    // Update floating texts
    if (gameState.floatingTextSystem) {
        gameState.floatingTextSystem.update();
    }

    if (gameState.currentRoom) {
        gameState.currentRoom.update();
    }
    // Update input state at the end of the frame
    gameState.input.update();
}

// Helper to draw a keycap
// Helper to draw a keycap
function drawKey(ctx, text, x, y, width = 30, scale = 1) {
    const height = 30 * scale;
    const scaledWidth = width * scale;

    // Key shadow (side)
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 2 * scale, y + 4 * scale, scaledWidth, height);

    // Key top
    ctx.fillStyle = '#eee';
    ctx.fillRect(x, y, scaledWidth, height);

    // Label or Arrow
    ctx.fillStyle = '#111';

    if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(text)) {
        drawArrow(ctx, text, x, y, scaledWidth, height, scale);
    } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.floor(12 * scale)}px "Press Start 2P", monospace`;
        ctx.fillText(text, x + scaledWidth / 2, y + height / 2);
    }
}

function drawArrow(ctx, direction, x, y, keyWidth, keyHeight, scale = 1) {
    const cx = x + keyWidth / 2;
    const cy = y + keyHeight / 2;
    const size = 6 * scale; // Arrow size

    ctx.beginPath();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (direction) {
        case 'UP':
            ctx.moveTo(cx, cy + size);
            ctx.lineTo(cx, cy - size);
            ctx.moveTo(cx - size, cy);
            ctx.lineTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            break;
        case 'DOWN':
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx, cy + size);
            ctx.moveTo(cx - size, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx + size, cy);
            break;
        case 'LEFT':
            ctx.moveTo(cx + size, cy);
            ctx.lineTo(cx - size, cy);
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx - size, cy);
            ctx.lineTo(cx, cy + size);
            break;
        case 'RIGHT':
            ctx.moveTo(cx - size, cy);
            ctx.lineTo(cx + size, cy);
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size);
            break;
    }
    ctx.stroke();
}

// Helper to separate calculating height from rendering
const renderLeftPanel = (ctx, centerX, startY, panelWidth, calculateHeightOnly = false) => {
    // Calculate dynamic scale based on panel width (base: 250px)
    const baseWidth = 250;
    const scale = Math.max(0.7, Math.min(1.3, panelWidth / baseWidth));

    let y = startY || 0;
    const startYPos = y;

    // Title
    if (!calculateHeightOnly) {
        ctx.font = `${Math.floor(24 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#d35400';
        ctx.shadowOffsetY = 4 * scale;
        ctx.fillText('ROGUE', centerX, y);
    }
    y += 35 * scale;
    if (!calculateHeightOnly) {
        ctx.fillText('SWEEPER', centerX, y);
        ctx.shadowColor = 'transparent'; // Reset shadow
    }
    y += 50 * scale;

    // Theme Box
    if (!calculateHeightOnly) {
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - 90 * scale, y - 20 * scale, 180 * scale, 40 * scale);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(centerX - 90 * scale, y - 20 * scale, 180 * scale, 40 * scale);

        ctx.font = `${Math.floor(14 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#ff6666';
        ctx.fillText('THEME: MASK', centerX, y + 5 * scale);
    }
    y += 60 * scale;

    // Description
    const lineHeight = 20 * scale;
    const lines = [
        "The dungeon is",
        "full of secrets.",
        "",
        "Tiles are MASKED",
        "until you step",
        "or mark them.",
        "",
        "Watch the hints.",
        "Survive."
    ];

    if (!calculateHeightOnly) {
        ctx.font = `${Math.floor(10 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#aaaaaa';
        lines.forEach(line => {
            ctx.fillText(line, centerX, y);
            y += lineHeight;
        });
    } else {
        y += lines.length * lineHeight;
    }

    return y - startYPos;
};

const renderRightPanel = (ctx, centerX, startY, panelWidth, calculateHeightOnly = false) => {
    // Calculate dynamic scale based on panel width (base: 250px)
    const baseWidth = 250;
    const scale = Math.max(0.7, Math.min(1.3, panelWidth / baseWidth));

    let y = startY || 0;
    const startYPos = y;
    const sectionGap = 70 * scale;
    const labelGap = 47.5 * scale;

    // --- Volume Slider (Absolute Top Right) ---
    if (!calculateHeightOnly) {
        const sliderWidth = 100 * scale;
        const sliderHeight = 10 * scale;
        const paddingRight = 20 * scale;
        const paddingTop = 20 * scale;

        // Absolute positioning relative to canvas
        const sliderX = ctx.canvas.width - sliderWidth - paddingRight;
        const sliderY = paddingTop;

        // Update hit rect for click/drag handler
        gameState.volumeSlider = { x: sliderX, y: sliderY, w: sliderWidth, h: sliderHeight };

        // Draw track
        ctx.fillStyle = '#444';
        ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);

        // Draw fill
        ctx.fillStyle = '#ffcc00';
        const fillWidth = sliderWidth * gameState.volume;
        ctx.fillRect(sliderX, sliderY, fillWidth, sliderHeight);

        // Draw knob
        ctx.fillStyle = '#fff';
        ctx.fillRect(sliderX + fillWidth - 2 * scale, sliderY - 2 * scale, 4 * scale, sliderHeight + 4 * scale);

        // Label
        ctx.font = `${Math.floor(8 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText('VOL', sliderX - 25 * scale, sliderY + 8 * scale);
    }
    // No y increment -> slider is out of flow

    // Title
    if (!calculateHeightOnly) {
        ctx.font = `${Math.floor(20 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#d35400';
        ctx.shadowOffsetY = 4 * scale;
        ctx.fillText('CONTROLS', centerX, y);
        ctx.shadowColor = 'transparent';
    }
    y += 60 * scale; // Title margin

    // Controls Layout
    // WASD
    if (!calculateHeightOnly) {
        drawKey(ctx, 'W', centerX - 15 * scale, y, 30, scale);
        drawKey(ctx, 'A', centerX - 50 * scale, y + 35 * scale, 30, scale);
        drawKey(ctx, 'S', centerX - 15 * scale, y + 35 * scale, 30, scale);
        drawKey(ctx, 'D', centerX + 20 * scale, y + 35 * scale, 30, scale);
    }
    y += (35 + 30) * scale; // W row + ASD row (approx)

    if (!calculateHeightOnly) {
        ctx.font = `${Math.floor(10 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText('MOVEMENT', centerX, y + 20 * scale);
    }
    y += sectionGap;

    // Arrows
    if (!calculateHeightOnly) {
        // Up
        drawKey(ctx, 'UP', centerX - 15 * scale, y, 30, scale);
        // Left, Down, Right
        drawKey(ctx, 'LEFT', centerX - 50 * scale, y + 35 * scale, 30, scale);
        drawKey(ctx, 'DOWN', centerX - 15 * scale, y + 35 * scale, 30, scale);
        drawKey(ctx, 'RIGHT', centerX + 20 * scale, y + 35 * scale, 30, scale);

        ctx.font = `${Math.floor(10 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText('ATTACK / MARK', centerX, y + 35 * scale + labelGap);
    }
    y += (35 + 35) * scale + labelGap; // Up row + Down row + Label gap

    // Space
    if (!calculateHeightOnly) {
        drawKey(ctx, 'SPACE', centerX - 50 * scale, y, 100, scale);
        ctx.font = `${Math.floor(10 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText('SWITCH ITEM', centerX, y + labelGap);
    }
    y += sectionGap + 20 * scale;

    // B
    if (!calculateHeightOnly) {
        drawKey(ctx, 'B', centerX - 15 * scale, y, 30, scale);
        ctx.font = `${Math.floor(10 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText('SHOP (30g)', centerX, y + labelGap);
    }
    y += 30 * scale + labelGap;

    // Mouse Click
    if (!calculateHeightOnly) {
        // Draw a simple mouse icon with highlighted left button
        const mouseWidth = 24 * scale;
        const mouseHeight = 32 * scale;

        // Mouse body (shadow/outline)
        ctx.fillStyle = '#444';
        ctx.fillRect(centerX - 12 * scale + 2 * scale, y + 4 * scale, mouseWidth, mouseHeight);

        // Mouse body (main)
        ctx.fillStyle = '#eee';
        ctx.fillRect(centerX - 12 * scale, y, mouseWidth, mouseHeight);

        // Inner area (dark background)
        ctx.fillStyle = '#444';
        ctx.fillRect(centerX - 12 * scale + 2 * scale, y + 2 * scale, 20 * scale, 28 * scale);

        // Center divider
        ctx.fillStyle = '#222';
        ctx.fillRect(centerX - 1 * scale, y + 2 * scale, 2 * scale, 14 * scale);

        // Left button (highlighted)
        ctx.fillStyle = '#ffcc00'; // Yellow highlight for left button
        ctx.fillRect(centerX - 12 * scale + 2 * scale, y + 2 * scale, 9 * scale, 14 * scale);

        ctx.font = `${Math.floor(10 * scale)}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#888';
        ctx.fillText('PLACE FLAG', centerX, y + mouseHeight + labelGap);
    }
    y += 32 * scale + labelGap; // Final height adjustment

    return y - startYPos;
};

function render(ctx) {
    const renderer = gameState.spriteRenderer;

    if (!renderer) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear background (main background)
    ctx.fillStyle = '#1a1a1a'; // Match slightly lighter "black" used elsewhere
    ctx.fillRect(0, 0, width, height);

    // --- Layout Calculations ---
    const minSidePanelWidth = 250;
    const maxMiddleWidth = width - (minSidePanelWidth * 2);

    let middleSize = Math.min(height, maxMiddleWidth);
    if (middleSize < 0) middleSize = width;

    const middleX = (width - middleSize) / 2;
    const middleY = (height - middleSize) / 2;

    const leftPanelWidth = middleX;
    const rightPanelStart = middleX + middleSize;
    const rightPanelWidth = width - rightPanelStart;

    // --- Render Panels Backgrounds ---
    // Left Panel
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, leftPanelWidth, height);

    // Right Panel
    ctx.fillStyle = '#222';
    ctx.fillRect(rightPanelStart, 0, rightPanelWidth, height);

    // --- Draw Separators (Borders) ---
    ctx.fillStyle = '#333';
    ctx.fillRect(leftPanelWidth - 2, 0, 2, height);
    ctx.fillRect(rightPanelStart, 0, 2, height);


    // --- Render Left Panel (Theme & Title) ---
    if (leftPanelWidth > 120) {
        ctx.textAlign = 'center';
        const centerX = leftPanelWidth / 2;

        // Calculate total height first to center it
        const contentHeight = renderLeftPanel(ctx, centerX, 0, leftPanelWidth, true);
        const startY = (height - contentHeight) / 2 + 10; // +10 optical adjustment using title baseline

        renderLeftPanel(ctx, centerX, startY, leftPanelWidth, false);
    }

    // --- Render Right Panel (Controls) ---
    if (rightPanelWidth > 120) {
        ctx.textAlign = 'center';
        const centerX = rightPanelStart + rightPanelWidth / 2;

        // Calculate total height first to center it
        const contentHeight = renderRightPanel(ctx, centerX, 0, rightPanelWidth, true);
        const startY = (height - contentHeight) / 2 + 10;

        renderRightPanel(ctx, centerX, startY, rightPanelWidth, false);
    }

    // --- Render Middle Section (Game) ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(middleX, 0, middleSize, height);
    ctx.clip();

    // Background for game area specifically
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(middleX, 0, middleSize, height);

    if (gameState.currentRoom) {
        // Center the room within the middle section
        const roomPixelWidth = gameState.currentRoom.width * gameState.currentRoom.cellSize;
        const roomPixelHeight = gameState.currentRoom.height * gameState.currentRoom.cellSize;

        const offsetX = middleX + (middleSize - roomPixelWidth) / 2;
        const offsetY = middleY + (middleSize - roomPixelHeight) / 2;

        gameState.currentRoom.render(ctx, renderer, offsetX, offsetY);

        // Render player
        if (gameState.player) {
            gameState.player.render(ctx, renderer, gameState.currentRoom.cellSize, offsetX, offsetY);
        }

        // Render Particles (Game Space)
        if (gameState.particleSystem) {
            gameState.particleSystem.render(ctx, offsetX, offsetY, gameState.currentRoom.cellSize);
        }

        // --- GUI (Relative to Middle Section) ---
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;

        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';

        const guiPadding = 20;

        // Draw Health (Top Left of Middle)
        ctx.textAlign = 'left';
        ctx.fillText(`Health: ${gameState.player.health}`, middleX + guiPadding, middleY + guiPadding);

        // Draw Coins (Top Right of Middle)
        ctx.textAlign = 'right';
        ctx.fillText(`Coins: ${gameState.coins}`, middleX + middleSize - guiPadding, middleY + guiPadding);

        // Draw Room Number (Top Center of Middle)
        ctx.textAlign = 'center';
        const displayRoomNumber = gameState.currentTutorialIndex >= 0 ? 0 : gameState.roomNumber;
        ctx.fillText(`Room: ${displayRoomNumber}`, middleX + middleSize / 2, middleY + guiPadding);

        // Draw Equipped Item and Flag Count (Bottom Left of Middle)
        ctx.textAlign = 'left';
        ctx.font = '14px "Press Start 2P", monospace';

        const swordIndicator = gameState.player.equippedItem === 'sword' ? '> ' : '  ';
        const bombDetectorIndicator = gameState.player.equippedItem === 'bombDetector' ? '> ' : '  ';

        ctx.fillStyle = gameState.player.equippedItem === 'sword' ? '#ffcc00' : '#888888';
        ctx.fillText(`${swordIndicator}Sword`, middleX + guiPadding, middleY + middleSize - 60);

        ctx.fillStyle = gameState.player.equippedItem === 'bombDetector' ? '#ffcc00' : '#888888';
        ctx.fillText(`${bombDetectorIndicator}Detector x${gameState.player.bombDetectorCount}`, middleX + guiPadding, middleY + middleSize - 35);

        ctx.shadowBlur = 0; // Reset

        // Render Floating Texts (UI Space - rendered last so they appear on top)
        if (gameState.floatingTextSystem) {
            gameState.floatingTextSystem.render(ctx);
        }
    }

    // --- Render Tutorial Text (Overlay on middle section) ---
    if (gameState.currentTutorialIndex >= 0 && TUTORIAL_LEVELS[gameState.currentTutorialIndex].tutorialText) {
        const text = TUTORIAL_LEVELS[gameState.currentTutorialIndex].tutorialText;
        ctx.font = '12px "Press Start 2P", monospace';

        const maxWidth = middleSize - 60; // Leave some space
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        const lineHeight = 20;
        const padding = 15;
        const longestLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const boxWidth = longestLineWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;

        const boxX = middleX + (middleSize - boxWidth) / 2;
        const boxY = middleY + middleSize - boxHeight - 80; // Moved higher 

        // Draw background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, index) => {
            ctx.fillText(line, middleX + middleSize / 2, boxY + padding + index * lineHeight + lineHeight / 2);
        });
    }

    ctx.restore();

    // --- Render Game Over Overlay (Full Screen) ---
    if (gameState.gameOver && gameState.currentRoom) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '40px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', width / 2, height / 2 - 20);

        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffcc00'; // Highlight color (yellow)
        ctx.fillText(`Total Score: ${gameState.score}`, width / 2, height / 2 + 50);

        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = 'white';
        ctx.fillText('Press R to Restart', width / 2, height / 2 + 100);
    }
    // --- Transition Overlay ---
    if (gameState.transitioning) {
        // Only cover the middle panel area
        const middleSize = Math.min(width, height);
        const middleX = (width - middleSize) / 2;
        const middleY = (height - middleSize) / 2;

        ctx.fillStyle = `rgba(0, 0, 0, ${gameState.transitionAlpha})`;
        ctx.fillRect(middleX, middleY, middleSize, middleSize);
    }
}
