class NeuralNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 100 };
        // Increased opacity to ensure it remains visible on both light and dark themes
        this.colors = [
            'rgba(56, 189, 248, 0.8)',  // primary blue
            'rgba(129, 140, 248, 0.8)', // secondary indigo
            'rgba(168, 85, 247, 0.8)',  // purple
            'rgba(52, 211, 153, 0.8)',  // ai green
            'rgba(148, 163, 184, 0.6)'  // neutral slate
        ];
        
        this.init();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    init() {
        this.resize();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const numParticles = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 12000), 100);
        for (let i = 0; i < numParticles; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 1.5 + 1.2; // Slightly larger base size
            const speedX = (Math.random() - 0.5) * 0.35; // Kept movement slow
            const speedY = (Math.random() - 0.5) * 0.35;
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.particles.push(new Particle(x, y, speedX, speedY, size, color, this.canvas, this.ctx, this.mouse));
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            this.particles[i].draw();
            
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 110) {
                    this.ctx.beginPath();
                    
                    let gradient = this.ctx.createLinearGradient(
                        this.particles[i].x, this.particles[i].y,
                        this.particles[j].x, this.particles[j].y
                    );
                    gradient.addColorStop(0, this.particles[i].color);
                    gradient.addColorStop(1, this.particles[j].color);
                    
                    this.ctx.strokeStyle = gradient;
                    // Increased line visibility
                    this.ctx.globalAlpha = (1 - (distance / 110)) * 0.85;
                    this.ctx.lineWidth = 1.0;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }
}

class Particle {
    constructor(x, y, speedX, speedY, size, color, canvas, ctx, mouse) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.size = size;
        this.color = color;
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;
        this.density = (Math.random() * 20) + 5;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > this.canvas.width) {
            this.x = this.canvas.width;
            this.speedX = -Math.abs(this.speedX);
        } else if (this.x < 0) {
            this.x = 0;
            this.speedX = Math.abs(this.speedX);
        }
        
        if (this.y > this.canvas.height) {
            this.y = this.canvas.height;
            this.speedY = -Math.abs(this.speedY);
        } else if (this.y < 0) {
            this.y = 0;
            this.speedY = Math.abs(this.speedY);
        }

        if (this.mouse.x != null && this.mouse.y != null) {
            let dx = this.mouse.x - this.x;
            let dy = this.mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const directionX = forceDirectionX * force * this.density * 0.2; // Slightly increased for responsiveness
                const directionY = forceDirectionY * force * this.density * 0.2;
                
                this.x -= directionX;
                this.y -= directionY;
            }
        }
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        // Added a very subtle shadow for pop, but keeping it low so it's not flashy
        this.ctx.shadowBlur = 3;
        this.ctx.shadowColor = this.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new NeuralNetwork("neural-network-canvas");
});
