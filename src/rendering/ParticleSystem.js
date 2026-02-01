
export class Particle {
    constructor(x, y, vx, vy, life, color, size, decay = 0.95) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.decay = decay; // Velocity decay
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.decay;
        this.vy *= this.decay;
        this.life--;
    }

    render(ctx, offsetX, offsetY, cellSize) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        // Convert grid coordinates to pixel coordinates if needed, 
        // but assuming particles use pixel coordinates relative to the room origin (0,0)
        // Adjusting for camera offset (offsetX, offsetY)

        ctx.beginPath();
        ctx.arc(offsetX + this.x, offsetY + this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, type, count = 10, cellSize = 30) {
        console.log(`[ParticleSystem] Emit ${type} at ${x},${y} (count: ${count})`);
        const pixelX = x * cellSize + cellSize / 2;
        const pixelY = y * cellSize + cellSize / 2;

        for (let i = 0; i < count; i++) {
            let vx, vy, life, color, size;

            switch (type) {
                case 'attack':
                    // "Very little", white, subtle
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 1.5 + 0.5; // Slower
                    vx = Math.cos(angle) * speed;
                    vy = Math.sin(angle) * speed;
                    life = 10 + Math.random() * 10; // Short life
                    color = '#ffffff';
                    size = Math.random() * 1.5 + 0.5; // Small
                    this.particles.push(new Particle(pixelX, pixelY, vx, vy, life, color, size, 0.8)); // Fast decay
                    break;

                case 'blood':
                    // Red splatter - Subtle
                    const bAngle = Math.random() * Math.PI * 2;
                    const bSpeed = Math.random() * 2 + 0.5; // Slower splatter
                    vx = Math.cos(bAngle) * bSpeed;
                    vy = Math.sin(bAngle) * bSpeed;
                    life = 30 + Math.random() * 15; // Shorter life
                    const bloodColors = ['#aa0000', '#880000', '#660000']; // Darker red
                    color = bloodColors[Math.floor(Math.random() * bloodColors.length)];
                    size = Math.random() * 1.5 + 1; // Smaller
                    this.particles.push(new Particle(pixelX, pixelY, vx, vy, life, color, size, 0.9));
                    break;

                case 'explosion':
                    // Red/Orange/Yellow debris
                    const exAngle = Math.random() * Math.PI * 2;
                    const exSpeed = Math.random() * 4 + 2;
                    vx = Math.cos(exAngle) * exSpeed;
                    vy = Math.sin(exAngle) * exSpeed;
                    life = 40 + Math.random() * 20;
                    const colors = ['#ff0000', '#ffaa00', '#ffff00', '#444444'];
                    color = colors[Math.floor(Math.random() * colors.length)];
                    size = Math.random() * 4 + 2;
                    this.particles.push(new Particle(pixelX, pixelY, vx, vy, life, color, size, 0.9));
                    break;

                case 'block':
                    // Small grey dust
                    vx = (Math.random() - 0.5) * 2;
                    vy = (Math.random() - 0.5) * 2;
                    life = 15 + Math.random() * 10;
                    color = '#cccccc';
                    size = Math.random() * 2;
                    this.particles.push(new Particle(pixelX, pixelY, vx, vy, life, color, size));
                    break;

                case 'spawn':
                    // "Beaming in" effect - vertical lines or rising particles
                    // Blue/Cyan/White colors
                    const spawnAngle = -Math.PI / 2; // Upwards
                    const spawnSpeed = Math.random() * 2 + 0.5;
                    const spawnSpread = (Math.random() - 0.5) * 1; // Slight horizontal jitter for "beam" feel

                    vx = spawnSpread;
                    vy = -Math.abs(Math.random() * 3 + 1); // Only go up

                    life = 30 + Math.random() * 20;

                    const spawnColors = ['#00ffff', '#ffffff', '#8888ff'];
                    color = spawnColors[Math.floor(Math.random() * spawnColors.length)];
                    size = Math.random() * 2 + 1;

                    this.particles.push(new Particle(pixelX, pixelY, vx, vy, life, color, size, 0.9));
                    break;
            }
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx, offsetX, offsetY, cellSize) {
        this.particles.forEach(p => p.render(ctx, offsetX, offsetY, cellSize));
    }
}
