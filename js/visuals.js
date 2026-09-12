/* =============================================================
 * Visuals — hero "neural constellation" + micro-interactions
 * -------------------------------------------------------------
 * - HeroConstellation: pseudo-3D point cloud (fibonacci sphere +
 *   inner core), k-nearest edges precomputed in 3D, perspective
 *   projection, depth fog, mouse parallax, travelling signal
 *   pulses, floating "tokens", and an excitement level that the
 *   AI assistant drives while it thinks.
 * - Spotlight + tilt effects for cards, scroll progress, magnetic
 *   buttons. All respect prefers-reduced-motion.
 * ============================================================= */
(function () {
    'use strict';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    /* ---------------- Hero constellation ---------------- */
    class HeroConstellation {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.nodes = [];
            this.edges = [];
            this.pulses = [];
            this.tokens = [];
            this.rot = { x: 0.25, y: 0, targetX: 0.25, targetY: 0 };
            this.mouse = { x: 0, y: 0, active: false };
            this.excitement = 0; this.targetExcitement = 0;
            this.time = 0;
            this.visible = true;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.terms = ['w₁·x + b', 'softmax', 'RAG', 'LLM', 'attention', 'θ', 'ReLU', 'embed', 'token', 'σ(z)', 'k-NN', 'BM25', 'ctx', 'agent', 'loss ↓', 'α: 0.92', 'vector', 'prompt'];
            this.palette = this.buildPalette();
            this.resize();
            this.buildGraph();
            this.bind();
            this.last = performance.now();
            this.render(0);
            if (!reduceMotion) requestAnimationFrame(t => this.frame(t));
        }
        buildPalette() {
            return isDark()
                ? { node: ['56,189,248', '129,140,248', '168,85,247', '52,211,153', '244,114,182'], edge: '148,163,184', glow: '52,211,153' }
                : { node: ['8,145,178', '79,70,229', '147,51,234', '5,150,105', '219,39,119'], edge: '71,85,105', glow: '5,150,105' };
        }
        resize() {
            const parent = this.canvas.parentElement;
            const w = parent ? parent.clientWidth : window.innerWidth;
            const h = parent ? parent.clientHeight : 600;
            this.w = w; this.h = h;
            this.canvas.width = Math.floor(w * this.dpr); this.canvas.height = Math.floor(h * this.dpr);
            this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.radius = Math.min(w, h) * (w < 768 ? 0.42 : 0.36);
            // keep the constellation behind the assistant panel, away from the copy column
            this.center = { x: w < 992 ? w * 0.5 : w * 0.7, y: w < 992 ? h * 0.55 : h * 0.48 };
            this.focal = Math.max(w, h) * 0.9;
        }
        buildGraph() {
            const N = this.w < 768 ? 90 : 150;
            const nodes = [];
            const golden = Math.PI * (3 - Math.sqrt(5));
            for (let i = 0; i < N; i++) {
                const shell = i % 5 === 0 ? 0.55 : 1; // some inner-core nodes
                const y = 1 - (i / (N - 1)) * 2;
                const r = Math.sqrt(1 - y * y);
                const theta = golden * i;
                const jitter = 0.9 + Math.random() * 0.2;
                nodes.push({
                    x: Math.cos(theta) * r * shell * jitter, y: y * shell * jitter, z: Math.sin(theta) * r * shell * jitter,
                    size: 1.2 + Math.random() * 1.6,
                    color: this.palette.node[i % this.palette.node.length],
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.4 + Math.random() * 0.8,
                    px: 0, py: 0, scale: 1, depth: 0
                });
            }
            // k-nearest edges (k=3) computed once in 3D — rotation preserves distances
            const edges = [];
            const seen = new Set();
            for (let i = 0; i < N; i++) {
                const d = [];
                for (let j = 0; j < N; j++) if (i !== j) {
                    const a = nodes[i], b = nodes[j];
                    d.push({ j, dist: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 });
                }
                d.sort((p, q) => p.dist - q.dist);
                for (let k = 0; k < 3; k++) {
                    const j = d[k].j, key = i < j ? i + '-' + j : j + '-' + i;
                    if (!seen.has(key)) { seen.add(key); edges.push({ a: i, b: j }); }
                }
            }
            this.nodes = nodes; this.edges = edges;
        }
        bind() {
            window.addEventListener('resize', () => { this.resize(); });
            const hero = this.canvas.parentElement;
            const onMove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5, y = (e.clientY - rect.top) / rect.height - 0.5;
                this.mouse.x = x; this.mouse.y = y; this.mouse.active = true;
                this.rot.targetY = x * 0.8; this.rot.targetX = 0.25 + y * 0.5;
            };
            hero.addEventListener('mousemove', onMove, { passive: true });
            hero.addEventListener('mouseleave', () => { this.mouse.active = false; this.rot.targetY = 0; this.rot.targetX = 0.25; });
            hero.addEventListener('click', (e) => {
                if (e.target.closest('a, button, input, textarea, .ai-panel')) return;
                this.burst(6 + Math.floor(Math.random() * 6));
            });
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; }, { threshold: 0.02 }).observe(this.canvas);
            }
            document.addEventListener('visibilitychange', () => { this.last = performance.now(); if (!document.hidden) this.render(0); });
            new MutationObserver(() => { this.palette = this.buildPalette(); this.nodes.forEach((n, i) => n.color = this.palette.node[i % this.palette.node.length]); })
                .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }
        setExcitement(v) { this.targetExcitement = Math.max(0, Math.min(1, v)); if (v > 0.5) this.burst(10); }
        burst(n) { for (let i = 0; i < n; i++) this.spawnPulse(); }
        spawnPulse() {
            if (!this.edges.length) return;
            const e = this.edges[Math.floor(Math.random() * this.edges.length)];
            const flip = Math.random() < 0.5;
            this.pulses.push({ a: flip ? e.b : e.a, b: flip ? e.a : e.b, t: 0, speed: 0.4 + Math.random() * 0.6, color: this.nodes[e.a].color, hops: 1 + Math.floor(Math.random() * 3) });
        }
        spawnToken(node) {
            if (this.w < 992 || this.tokens.length > 5) return; // floating labels only where they can't sit over text
            this.tokens.push({ text: this.terms[Math.floor(Math.random() * this.terms.length)], node, life: 1, dy: 0, color: node.color });
        }
        project() {
            const { x: rx, y: ry } = this.rot;
            const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
            const R = this.radius, f = this.focal, t = this.time;
            for (const n of this.nodes) {
                // gentle breathing
                const breathe = 1 + Math.sin(t * n.speed + n.phase) * 0.035;
                let x = n.x * breathe, y = n.y * breathe, z = n.z * breathe;
                // rotate Y then X
                let x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
                let y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
                const depth = z2; // -1 .. 1
                const scale = f / (f + depth * R * 1.4);
                n.px = this.center.x + x1 * R * scale;
                n.py = this.center.y + y1 * R * scale;
                n.scale = scale; n.depth = depth;
            }
        }
        frame(now) {
            requestAnimationFrame(t => this.frame(t));
            const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
            if (!this.visible || document.hidden) return;
            this.time += dt;
            this.excitement += (this.targetExcitement - this.excitement) * 0.06;
            const spin = 0.08 + this.excitement * 0.35;
            if (!this.mouse.active) this.rot.targetY += spin * dt;
            else this.rot.targetY += spin * dt * 0.4;
            this.rot.x += (this.rot.targetX - this.rot.x) * 0.05;
            this.rot.y += (this.rot.targetY - this.rot.y) * 0.05;
            // ambient pulses
            if (Math.random() < (0.05 + this.excitement * 0.5)) this.spawnPulse();
            if (Math.random() < 0.006 + this.excitement * 0.02) this.spawnToken(this.nodes[Math.floor(Math.random() * this.nodes.length)]);
            this.render(dt);
        }
        render(dt) {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.w, this.h);
            this.project();
            const dark = isDark();
            const ex = this.excitement;

            // soft core glow
            const g = ctx.createRadialGradient(this.center.x, this.center.y, 0, this.center.x, this.center.y, this.radius * 1.3);
            g.addColorStop(0, `rgba(${this.palette.glow},${(dark ? 0.16 : 0.10) + ex * 0.15})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, this.w, this.h);

            // edges (sorted back-to-front for nicer overlaps)
            ctx.lineWidth = 1;
            for (const e of this.edges) {
                const a = this.nodes[e.a], b = this.nodes[e.b];
                const d = (a.depth + b.depth) / 2; // -1 (front) .. 1 (back)
                const alpha = (0.05 + (1 - d) * 0.5 * (dark ? 0.32 : 0.28)) * (1 + ex * 0.6);
                ctx.strokeStyle = `rgba(${this.palette.edge},${Math.min(0.75, alpha)})`;
                ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
            }

            // pulses
            for (let i = this.pulses.length - 1; i >= 0; i--) {
                const p = this.pulses[i];
                p.t += dt * p.speed * (1 + ex * 1.5);
                const a = this.nodes[p.a], b = this.nodes[p.b];
                if (p.t >= 1) {
                    p.hops--;
                    if (p.hops <= 0) { this.pulses.splice(i, 1); continue; }
                    // hop to a neighbouring edge
                    const next = this.edges.filter(e => e.a === p.b || e.b === p.b);
                    const ne = next[Math.floor(Math.random() * next.length)];
                    if (!ne) { this.pulses.splice(i, 1); continue; }
                    p.a = p.b; p.b = ne.a === p.a ? ne.b : ne.a; p.t = 0;
                    if (Math.random() < 0.15 + ex * 0.3) this.spawnToken(this.nodes[p.a]);
                    continue;
                }
                const x = a.px + (b.px - a.px) * p.t, y = a.py + (b.py - a.py) * p.t;
                const s = 1.6 + (1 - a.depth) * 1.2 + ex;
                ctx.shadowBlur = 12; ctx.shadowColor = `rgba(${p.color},0.9)`;
                ctx.fillStyle = `rgba(${p.color},0.95)`;
                ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                // trail
                const tx = a.px + (b.px - a.px) * Math.max(0, p.t - 0.12), ty = a.py + (b.py - a.py) * Math.max(0, p.t - 0.12);
                const grad = ctx.createLinearGradient(tx, ty, x, y);
                grad.addColorStop(0, `rgba(${p.color},0)`); grad.addColorStop(1, `rgba(${p.color},0.8)`);
                ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke(); ctx.lineWidth = 1;
            }

            // nodes
            const order = [...this.nodes].sort((p, q) => q.depth - p.depth);
            for (const n of order) {
                const fog = (1 - n.depth) / 2; // 0 back .. 1 front
                const alpha = 0.25 + fog * 0.75;
                const size = n.size * (0.6 + fog * 0.9) * (1 + ex * 0.3);
                ctx.fillStyle = `rgba(${n.color},${alpha})`;
                if (fog > 0.6) { ctx.shadowBlur = 8 + ex * 10; ctx.shadowColor = `rgba(${n.color},0.8)`; }
                ctx.beginPath(); ctx.arc(n.px, n.py, size, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            }

            // tokens
            ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
            for (let i = this.tokens.length - 1; i >= 0; i--) {
                const t = this.tokens[i];
                t.life -= dt * 0.35; t.dy -= dt * 14;
                if (t.life <= 0) { this.tokens.splice(i, 1); continue; }
                ctx.fillStyle = `rgba(${t.color},${Math.min(1, t.life) * 0.9})`;
                ctx.fillText(t.text, t.node.px + 8, t.node.py - 8 + t.dy);
            }

            // hovered node readout
            if (this.mouse.active) {
                const mx = (this.mouse.x + 0.5) * this.w, my = (this.mouse.y + 0.5) * this.h;
                let best = null, bd = 90 * 90;
                for (const n of this.nodes) { const d = (n.px - mx) ** 2 + (n.py - my) ** 2; if (d < bd) { bd = d; best = n; } }
                if (best) {
                    ctx.strokeStyle = `rgba(${best.color},0.9)`; ctx.setLineDash([2, 3]);
                    ctx.beginPath(); ctx.arc(best.px, best.py, best.size + 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                    ctx.fillStyle = `rgba(${best.color},0.95)`;
                    ctx.fillText(`α ${(1 - Math.sqrt(bd) / 90).toFixed(2)}`, best.px + 12, best.py - 10);
                }
            }
        }
    }

    /* ---------------- Micro-interactions ---------------- */
    function initSpotlight() {
        const els = document.querySelectorAll('.spot, .stat-box');
        if (!els.length || reduceMotion) return;
        els.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
                el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
            }, { passive: true });
        });
    }
    function initTilt() {
        if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
        document.querySelectorAll('.tilt').forEach(el => {
            let raf = null;
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => { el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`; });
            }, { passive: true });
            el.addEventListener('mouseleave', () => { if (raf) cancelAnimationFrame(raf); el.style.transform = ''; });
        });
    }
    function initMagnetic() {
        if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
        document.querySelectorAll('.magnetic').forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
                // Tracking the cursor needs to be instant — the element's own hover
                // transition (var(--t-med)) would otherwise chase a target that keeps
                // moving faster than it can settle, reading as a constant wiggle.
                el.style.transitionDuration = '0s';
                el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
            }, { passive: true });
            el.addEventListener('mouseleave', () => {
                el.style.transitionDuration = '';
                el.style.transform = '';
            });
        });
    }
    function initScrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
        };
        window.addEventListener('scroll', update, { passive: true }); update();
    }

    window.AjithVisuals = {
        hero: null,
        setExcitement(v) { if (this.hero) this.hero.setExcitement(v); },
        burst(n) { if (this.hero) this.hero.burst(n || 8); }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('hero-canvas');
        if (canvas) window.AjithVisuals.hero = new HeroConstellation(canvas);
        initSpotlight(); initTilt(); initMagnetic(); initScrollProgress();
    });
})();
