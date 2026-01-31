// Main entry point - minimal startup code
import { initGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to maximum square that fits in viewport
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Re-apply image smoothing setting after resize
    ctx.imageSmoothingEnabled = false;
}

// Initial size
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', resizeCanvas);

// Initialize and start the game
initGame(canvas, ctx);

// Handle Reset Tutorial Progress
const resetBtn = document.getElementById('resetTutorialBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('roguesweeper_tutorial_finished');
        window.location.reload();
    });
}
