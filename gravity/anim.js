/* =============================================
   ANIMATION 1 — GRAVITY PARTICLE FIELD
   Particles are pulled toward the cursor.
   They glow, trail, and orbit the mouse.
   ============================================= */
(function () {
    const canvas = document.getElementById('bgCanvas');
    const ctx    = canvas.getContext('2d');

    let W, H, particles;
    const mouse   = { x: null, y: null };
    const ATTRACT = 0.09;   // pull strength
    const DAMP    = 0.97;   // velocity damping
    const CONNECT = 100;    // connection distance between particles
    const PULL_R  = 200;    // mouse influence radius

    /* ---- resize ---- */
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', () => { resize(); spawn(); });

    /* ---- mouse ---- */
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    /* ---- particle ---- */
    function Particle() { this.init(); }
    Particle.prototype.init = function () {
        this.x    = Math.random() * W;
        this.y    = Math.random() * H;
        this.vx   = (Math.random() - 0.5) * 0.6;
        this.vy   = (Math.random() - 0.5) * 0.6;
        this.base = Math.random() * 1.8 + 0.5;
        this.r    = this.base;
        this.hue  = 210 + Math.random() * 70;   // indigo–violet range
        this.a    = Math.random() * 0.4 + 0.15;
    };

    Particle.prototype.update = function () {
        /* gravity toward mouse */
        if (mouse.x !== null) {
            const dx   = mouse.x - this.x;
            const dy   = mouse.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < PULL_R && dist > 1) {
                const f  = ATTRACT * (1 - dist / PULL_R);
                this.vx += (dx / dist) * f;
                this.vy += (dy / dist) * f;
                /* glow when close */
                const prox = 1 - dist / PULL_R;
                this.r = this.base + prox * 5;
                this.a = 0.25 + prox * 0.75;
            } else {
                this.r += (this.base - this.r) * 0.08;
                this.a += (0.25 - this.a) * 0.04;
            }
        }

        this.vx *= DAMP;
        this.vy *= DAMP;
        this.x  += this.vx;
        this.y  += this.vy;

        /* wrap edges */
        if (this.x < -20) this.x = W + 20;
        if (this.x > W + 20) this.x = -20;
        if (this.y < -20) this.y = H + 20;
        if (this.y > H + 20) this.y = -20;
    };

    Particle.prototype.draw = function () {
        /* glow halo */
        if (this.r > this.base + 1) {
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
            g.addColorStop(0, `hsla(${this.hue},80%,70%,${this.a * 0.5})`);
            g.addColorStop(1, `hsla(${this.hue},80%,70%,0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        }
        /* core dot */
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue},80%,75%,${this.a})`;
        ctx.fill();
    };

    /* ---- spawn ---- */
    function spawn() {
        const n = Math.min(160, Math.floor(W * H / 9000));
        particles = Array.from({ length: n }, () => new Particle());
    }

    /* ---- connect ---- */
    function connect() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx   = particles[i].x - particles[j].x;
                const dy   = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < CONNECT) {
                    const a = (1 - dist / CONNECT) * 0.25;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(129,140,248,${a})`;
                    ctx.lineWidth   = 0.6;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        /* mouse connections */
        if (mouse.x === null) return;
        particles.forEach(p => {
            const dx   = p.x - mouse.x;
            const dy   = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < PULL_R) {
                const prox = 1 - dist / PULL_R;
                const grad = ctx.createLinearGradient(mouse.x, mouse.y, p.x, p.y);
                grad.addColorStop(0, `rgba(167,139,250,${prox * 0.8})`);
                grad.addColorStop(1, `rgba(129,140,248,0)`);
                ctx.beginPath();
                ctx.strokeStyle = grad;
                ctx.lineWidth   = prox * 1.8;
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        });

        /* cursor dot */
        const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 24);
        cg.addColorStop(0, 'rgba(167,139,250,0.8)');
        cg.addColorStop(1, 'rgba(167,139,250,0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = cg;
        ctx.fill();
    }

    /* ---- loop ---- */
    function loop() {
        /* trail effect — semi-transparent wipe */
        ctx.fillStyle = 'rgba(6,6,15,0.18)';
        ctx.fillRect(0, 0, W, H);

        particles.forEach(p => p.update());
        connect();
        particles.forEach(p => p.draw());

        requestAnimationFrame(loop);
    }

    resize();
    spawn();
    loop();
})();
