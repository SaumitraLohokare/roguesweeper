// Game logic and mechanics

import { SpriteSheet } from './rendering/SpriteSheet.js';
import { SpriteRenderer } from './rendering/SpriteRenderer.js';
import { PLAYER_MOVE_RESULT, Room, SIDE } from './Room.js';
import { Input } from './Input.js';
import { Player } from './Player.js';
import { getSoundManager } from './Sound.js';

const DIFFICULTY_TIERS = [
    { maxRoom: 2, config: { width: 15, height: 15, cellSize: 30, coinCount: 3, bombCount: 10, enemyCount: 5, innerWallDensity: 0.15 } },
    { maxRoom: 5, config: { width: 18, height: 18, cellSize: 30, coinCount: 5, bombCount: 15, enemyCount: 8, innerWallDensity: 0.45, minChunkSize: 6 } },
    { maxRoom: 9, config: { width: 24, height: 24, cellSize: 24, coinCount: 8, bombCount: 25, enemyCount: 14, innerWallDensity: 0.55, minChunkSize: 6 } },
    { maxRoom: Infinity, config: { width: 30, height: 30, cellSize: 20, coinCount: 10, bombCount: 35, enemyCount: 20, innerWallDensity: 0.60, minChunkSize: 9 } }
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
        cellSize: 40,
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
        ]
    },
    {
        width: 7,
        height: 9,
        cellSize: 32,
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
        ]
    }
];

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
    roomNumber: 1,
    currentTutorialIndex: 0  // Track tutorial progress: 0-based index, -1 means tutorials complete
};

export function initGame(canvas, ctx) {
    console.log('Game initialized');

    // Initialize sprite renderer (works with multiple sheets)
    gameState.spriteRenderer = new SpriteRenderer();

    // Initialize input
    gameState.input = new Input();

    // Load sprite sheet(s) - you can add more sheets here in the future
    gameState.spriteSheets.sheet_1 = new SpriteSheet('./assets/images/sheet_1.png', 10, 10, () => {
        console.log('sheet_1 loaded');
        checkAllSheetsLoaded(canvas, ctx);
    });

    // Register the sprite sheet with the renderer
    gameState.spriteRenderer.registerSpriteSheet('sheet_1', gameState.spriteSheets.sheet_1);

    registerClicks(canvas);
}

function registerClicks(canvas) {
    canvas.addEventListener('click', (event) => {
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
}

function loadTutorialLevel(index) {
    if (index < 0 || index >= TUTORIAL_LEVELS.length) {
        console.error(`Invalid tutorial index: ${index}`);
        return;
    }

    const tutorialConfig = TUTORIAL_LEVELS[index];

    // Create room with manual setup enabled
    gameState.currentRoom = new Room({
        width: tutorialConfig.width,
        height: tutorialConfig.height,
        cellSize: tutorialConfig.cellSize,
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
}

function startNextLevel() {
    // Increment level
    gameState.roomNumber++;
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
        }
    }

    // Already in random generation mode, or just finished last tutorial
    const previousExitSide = gameState.currentRoom.exitSide;
    const newEntranceSide = Room.getOppositeSide(previousExitSide);
    startRandomLevel(newEntranceSide);
}

function startRandomLevel(entranceSide) {
    // Get config for new level
    const config = getRoomConfig(gameState.roomNumber);

    // Create new room
    gameState.currentRoom = new Room({
        ...config,
        entranceSide: entranceSide
    });

    const entrance = gameState.currentRoom.entrancePos;

    if (!gameState.player) {
        gameState.player = new Player(entrance.x, entrance.y, 3);
    } else {
        // Move player to new entrance
        gameState.player.x = entrance.x;
        gameState.player.y = entrance.y;
    }

    gameState.currentRoom.onPlayerEnter(gameState.player.x, gameState.player.y);
}

function gameLoop(canvas, ctx) {
    if (!gameState.running) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    update();

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
        if (gameState.coins >= 50) {
            gameState.coins -= 50;
            gameState.player.addBombDetector();
            console.log('Bought a bomb detector! Bomb Detectors: ' + gameState.player.bombDetectorCount);
        } else {
            console.log('Not enough coins to buy a bomb detector (need 50)');
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
                    startNextLevel();
                    break;
                case PLAYER_MOVE_RESULT.NORMAL:
                    getSoundManager().playMove();
                    break;
                case PLAYER_MOVE_RESULT.COIN:
                    getSoundManager().playCoin();
                    gameState.coins += 10;
                    break;
                case PLAYER_MOVE_RESULT.ENEMY:
                case PLAYER_MOVE_RESULT.BOMB:
                    const remainingHealth = gameState.player.takeDamage(1);
                    console.log(`Hit! Health: ${remainingHealth}`);
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
                if (gameState.player.attack(arrowDx, arrowDy, gameState.currentRoom)) {
                    actionTaken = true;
                }
            }
        }
    }

    // --- Enemy Turn ---
    // Trigger only if player performed an action (Move or Attack)
    if (actionTaken) {
        if (gameState.player.health > 0) {
            gameState.currentRoom.updateEnemies(gameState.player);
        }

        // --- Game State Check ---
        if (gameState.player.health <= 0) {
            gameState.gameOver = true;
            getSoundManager().playLose();
            console.log("Game Over!");
        }
    }

    // Update input state at the end of the frame
    gameState.input.update();
}

// Helper to draw a keycap
// Helper to draw a keycap
function drawKey(ctx, text, x, y, width = 30) {
    const height = 30;

    // Key shadow (side)
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 2, y + 4, width, height);

    // Key top
    ctx.fillStyle = '#eee';
    ctx.fillRect(x, y, width, height);

    // Label or Arrow
    ctx.fillStyle = '#111';

    if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(text)) {
        drawArrow(ctx, text, x, y, width, height);
    } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(text, x + width / 2, y + height / 2);
    }
}

function drawArrow(ctx, direction, x, y, keyWidth, keyHeight) {
    const cx = x + keyWidth / 2;
    const cy = y + keyHeight / 2;
    const size = 6; // Arrow size

    ctx.beginPath();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
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
const renderLeftPanel = (ctx, centerX, startY, calculateHeightOnly = false) => {
    let y = startY || 0;
    const startYPos = y;

    // Title
    if (!calculateHeightOnly) {
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#d35400';
        ctx.shadowOffsetY = 4;
        ctx.fillText('ROGUE', centerX, y);
    }
    y += 35;
    if (!calculateHeightOnly) {
        ctx.fillText('SWEEPER', centerX, y);
        ctx.shadowColor = 'transparent'; // Reset shadow
    }
    y += 50;

    // Theme Box
    if (!calculateHeightOnly) {
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - 90, y - 20, 180, 40);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 90, y - 20, 180, 40);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff6666';
        ctx.fillText('THEME: MASK', centerX, y + 5);
    }
    y += 60;

    // Description
    const lineHeight = 20;
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
        ctx.font = '10px "Press Start 2P", monospace';
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

const renderRightPanel = (ctx, centerX, startY, calculateHeightOnly = false) => {
    let y = startY || 0;
    const startYPos = y;
    const sectionGap = 70;
    const labelGap = 47.5;

    // Title
    if (!calculateHeightOnly) {
        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#d35400';
        ctx.shadowOffsetY = 4;
        ctx.fillText('CONTROLS', centerX, y);
        ctx.shadowColor = 'transparent';
    }
    y += 60; // Title margin

    // Controls Layout
    // WASD
    if (!calculateHeightOnly) {
        drawKey(ctx, 'W', centerX - 15, y);
        drawKey(ctx, 'A', centerX - 50, y + 35);
        drawKey(ctx, 'S', centerX - 15, y + 35);
        drawKey(ctx, 'D', centerX + 20, y + 35);
    }
    y += 35 + 30; // W row + ASD row (approx)

    if (!calculateHeightOnly) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('MOVEMENT', centerX, y + 20);
    }
    y += sectionGap;

    // Arrows
    if (!calculateHeightOnly) {
        // Up
        drawKey(ctx, 'UP', centerX - 15, y);
        // Left, Down, Right
        drawKey(ctx, 'LEFT', centerX - 50, y + 35);
        drawKey(ctx, 'DOWN', centerX - 15, y + 35);
        drawKey(ctx, 'RIGHT', centerX + 20, y + 35);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('ACT / MARK', centerX, y + 35 + labelGap);
    }
    y += 35 + 35 + labelGap; // Up row + Down row + Label gap

    // Space
    if (!calculateHeightOnly) {
        drawKey(ctx, 'SPACE', centerX - 50, y, 100);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('SWITCH ITEM', centerX, y + labelGap);
    }
    y += sectionGap + 20;

    // B
    if (!calculateHeightOnly) {
        drawKey(ctx, 'B', centerX - 15, y);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('SHOP (50g)', centerX, y + labelGap);
    }
    y += 30 + labelGap; // Final height adjustment

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
        const contentHeight = renderLeftPanel(ctx, centerX, 0, true);
        const startY = (height - contentHeight) / 2 + 10; // +10 optical adjustment using title baseline

        renderLeftPanel(ctx, centerX, startY, false);
    }

    // --- Render Right Panel (Controls) ---
    if (rightPanelWidth > 120) {
        ctx.textAlign = 'center';
        const centerX = rightPanelStart + rightPanelWidth / 2;

        // Calculate total height first to center it
        const contentHeight = renderRightPanel(ctx, centerX, 0, true);
        const startY = (height - contentHeight) / 2 + 10;

        renderRightPanel(ctx, centerX, startY, false);
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
        ctx.fillText(`Room: ${gameState.roomNumber}`, middleX + middleSize / 2, middleY + guiPadding);

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
        ctx.fillStyle = 'white';
        ctx.fillText('Press R to Restart', width / 2, height / 2 + 50);
    }
}
