class NeuralNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.pulses = [];         // Signal packets traveling along synapses
        this.floatingTexts = [];   // Floating AI symbols/tokens
        this.ripples = [];         // Click activation shockwaves
        
        this.mouse = { x: null, y: null, radius: 150, closestNode: null };
        
        // Vibrant colors
        this.colors = [
            'rgba(56, 189, 248, 0.85)',  // cyan/blue
            'rgba(129, 140, 248, 0.85)', // indigo
            'rgba(168, 85, 247, 0.85)',  // purple
            'rgba(52, 211, 153, 0.85)',  // emerald
            'rgba(244, 114, 182, 0.75)'  // pink
        ];

        this.aiTerms = ['w: 0.94', 'RAG', 'LLM', 'f(x)', 'θ_1', 'ReLU', 'Token', 'Loss: 0.01', 'Embed', 'Prompt', 'softmax', '0.98', 'α_i'];
        
        this.init();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            } else {
                this.mouse.x = null;
                this.mouse.y = null;
                this.mouse.closestNode = null;
            }
        });
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
            this.mouse.closestNode = null;
        });
        window.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                this.triggerActivationRipple(e.clientX - rect.left, e.clientY - rect.top);
            }
        });
    }

    init() {
        this.resize();
        this.animate();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent ? parent.offsetWidth : window.innerWidth;
        this.canvas.height = parent ? parent.offsetHeight : 500;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        // Reduced node count for a cleaner, less cluttered look
        const numParticles = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 18000), 55);
        
        for (let i = 0; i < numParticles; i++) {
            const x = Math.random() * (this.canvas.width - 40) + 20;
            const y = Math.random() * (this.canvas.height - 40) + 20;
            const size = Math.random() * 1.8 + 1.2;
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.particles.push(new Particle(i, x, y, size, color, this.canvas, this.ctx, this.mouse));
        }
    }

    triggerActivationRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 240,
            speed: 1.5,
            opacity: 0.85
        });
    }

    maybeSpawnPulse(p1, p2) {
        if (Math.random() < 0.002) {
            this.pulses.push({
                fromX: p1.x,
                fromY: p1.y,
                toX: p2.x,
                toY: p2.y,
                progress: 0,
                // Slightly faster flow speed for good visibility & momentum
                speed: 0.0014 + Math.random() * 0.0016,
                color: p1.color,
                size: Math.random() * 1.5 + 1.8
            });
        }
    }

    maybeSpawnFloatingText(particle) {
        if (Math.random() < 0.0006 && this.floatingTexts.length < 5) {
            const text = this.aiTerms[Math.floor(Math.random() * this.aiTerms.length)];
            this.floatingTexts.push({
                text: text,
                x: particle.x,
                y: particle.y - 10,
                opacity: 0.95,
                color: particle.color,
                speedY: 0.08 + Math.random() * 0.08 // Slower float speed
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let closestDist = Infinity;
        let closestParticle = null;

        // 1. Update and Draw Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            p1.update();
            p1.draw();

            if (this.mouse.x !== null && this.mouse.y !== null) {
                const distToMouse = Math.hypot(this.mouse.x - p1.x, this.mouse.y - p1.y);
                if (distToMouse < closestDist && distToMouse < this.mouse.radius) {
                    closestDist = distToMouse;
                    closestParticle = p1;
                }
            }

            this.maybeSpawnFloatingText(p1);

            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 125) {
                    this.ctx.beginPath();
                    let gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    gradient.addColorStop(0, p1.color);
                    gradient.addColorStop(1, p2.color);
                    
                    this.ctx.strokeStyle = gradient;
                    this.ctx.globalAlpha = (1 - (distance / 125)) * 0.7;
                    this.ctx.lineWidth = 0.85;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;

                    this.maybeSpawnPulse(p1, p2);
                }
            }
        }

        // 2. Animate Signal Pulses along synapses
        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const pulse = this.pulses[i];
            pulse.progress += pulse.speed;
            
            if (pulse.progress >= 1) {
                this.pulses.splice(i, 1);
                continue;
            }

            const currX = pulse.fromX + (pulse.toX - pulse.fromX) * pulse.progress;
            const currY = pulse.fromY + (pulse.toY - pulse.fromY) * pulse.progress;

            this.ctx.beginPath();
            this.ctx.arc(currX, currY, pulse.size, 0, Math.PI * 2);
            this.ctx.fillStyle = pulse.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = pulse.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // 3. Animate Floating AI Tokens / Symbols (Longer lifetime & slower float)
        this.ctx.font = '12px "JetBrains Mono", monospace';
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= ft.speedY;
            ft.opacity -= 0.002; // Slower fade out for readability

            if (ft.opacity <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = ft.opacity;
            this.ctx.fillText(ft.text, ft.x - 12, ft.y);
            this.ctx.globalAlpha = 1;
        }

        // 4. Animate Click Shockwave Ripples (Slower expansion & longer fade)
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += r.speed;
            r.opacity -= 0.004; // Slower fade out

            if (r.opacity <= 0 || r.radius >= r.maxRadius) {
                this.ripples.splice(i, 1);
                continue;
            }

            for (let p of this.particles) {
                const dist = Math.hypot(p.x - r.x, p.y - r.y);
                if (Math.abs(dist - r.radius) < 15) {
                    const angle = Math.atan2(p.y - r.y, p.x - r.x);
                    p.vx += Math.cos(angle) * 1.5;
                    p.vy += Math.sin(angle) * 1.5;
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(56, 189, 248, ' + r.opacity + ')';
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([4, 4]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // 5. Draw Dynamic "Attention Head Weight" near hovered node
        if (closestParticle && closestDist < 120) {
            const weight = (1 - (closestDist / 120)).toFixed(2);
            this.ctx.fillStyle = closestParticle.color;
            this.ctx.font = '11px "JetBrains Mono", monospace';
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillText(`α: ${weight}`, closestParticle.x + 12, closestParticle.y - 12);
            
            this.ctx.beginPath();
            this.ctx.arc(closestParticle.x, closestParticle.y, closestParticle.size + 6, 0, Math.PI * 2);
            this.ctx.strokeStyle = closestParticle.color;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 3]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 1;
        }
    }
}

class Particle {
    constructor(id, x, y, size, color, canvas, ctx, mouse) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = size;
        this.color = color;
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;
        
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.88;
        this.springFactor = 0.04;
        
        this.angle = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.008 + Math.random() * 0.006;
        this.floatRadius = 5 + Math.random() * 6;
    }

    update() {
        this.angle += this.floatSpeed;
        const targetAnchorX = this.baseX + Math.cos(this.angle) * this.floatRadius;
        const targetAnchorY = this.baseY + Math.sin(this.angle) * this.floatRadius;

        if (this.mouse.x != null && this.mouse.y != null) {
            let dx = this.mouse.x - this.x;
            let dy = this.mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            const radius = this.mouse.radius;
            
            if (distance < radius) {
                const force = (radius - distance) / radius;
                const angle = Math.atan2(dy, dx);
                const dodgeForce = force * 4;
                this.vx -= Math.cos(angle) * dodgeForce;
                this.vy -= Math.sin(angle) * dodgeForce;
            }
        }

        const springDx = targetAnchorX - this.x;
        const springDy = targetAnchorY - this.y;
        
        this.vx += springDx * this.springFactor;
        this.vy += springDy * this.springFactor;

        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = this.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new NeuralNetwork("neural-network-canvas");
});
