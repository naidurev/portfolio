/* =============================================
   ANIMATION 2 — NEURAL SPARKS
   A web of nodes with animated spark pulses
   that radiate outward from the cursor.
   ============================================= */
(function () {
    const canvas = document.getElementById('bgCanvas');
    const ctx    = canvas.getContext('2d');

    let W, H, nodes, sparks;
    const mouse  = { x: -9999, y: -9999 };
    const LINK_R = 160;   /* connection radius between nodes */
    const NODE_R = 200;   /* mouse activation radius */

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', () => { resize(); init(); });
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    /* ---- node ---- */
    function Node() {
        this.x    = Math.random() * W;
        this.y    = Math.random() * H;
        this.vx   = (Math.random() - 0.5) * 0.3;
        this.vy   = (Math.random() - 0.5) * 0.3;
        this.r    = Math.random() * 2 + 1;
        this.hue  = 215 + Math.random() * 60;
        this.lit  = 0;   /* 0–1 glow intensity */
    }
    Node.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y < 0 || this.y > H) this.vy *= -1;
        /* proximity to mouse lights it up */
        const d = Math.hypot(this.x - mouse.x, this.y - mouse.y);
        const target = d < NODE_R ? (1 - d / NODE_R) * 0.9 : 0;
        this.lit += (target - this.lit) * 0.08;
    };
    Node.prototype.draw = function () {
        const a = 0.2 + this.lit * 0.8;
        /* halo */
        if (this.lit > 0.05) {
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 8 * this.lit);
            g.addColorStop(0, `hsla(${this.hue},80%,70%,${this.lit * 0.6})`);
            g.addColorStop(1, `hsla(${this.hue},80%,70%,0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 8 * this.lit, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + this.lit * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue},80%,75%,${a})`;
        ctx.fill();
    };

    /* ---- spark ---- */
    /* A spark travels along an edge from nodeA to nodeB */
    function Spark(a, b) {
        this.ax  = a.x; this.ay = a.y;
        this.bx  = b.x; this.by = b.y;
        this.t   = 0;               /* 0 → 1 progress */
        this.spd = 0.012 + Math.random() * 0.018;
        this.hue = 210 + Math.random() * 80;
        this.alive = true;
    }
    Spark.prototype.update = function () {
        /* follow moving nodes by re-reading position each frame */
        this.t += this.spd;
        if (this.t >= 1) this.alive = false;
    };
    Spark.prototype.draw = function () {
        const x  = this.ax + (this.bx - this.ax) * this.t;
        const y  = this.ay + (this.by - this.ay) * this.t;
        const tail = Math.max(0, this.t - 0.08);
        const tx = this.ax + (this.bx - this.ax) * tail;
        const ty = this.ay + (this.by - this.ay) * tail;

        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, `hsla(${this.hue},100%,70%,0)`);
        grad.addColorStop(1, `hsla(${this.hue},100%,80%,0.9)`);

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        /* head glow */
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue},100%,85%,0.9)`;
        ctx.fill();
    };

    /* ---- edges ---- */
    let sparkTimer = 0;
    function drawEdges() {
        sparkTimer++;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx   = nodes[i].x - nodes[j].x;
                const dy   = nodes[i].y - nodes[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist > LINK_R) continue;

                const bright = nodes[i].lit + nodes[j].lit;
                const a = Math.min(0.08 + bright * 0.3, 0.5) * (1 - dist / LINK_R);

                ctx.beginPath();
                ctx.strokeStyle = `rgba(129,140,248,${a})`;
                ctx.lineWidth   = 0.6 + bright * 0.8;
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();

                /* spawn sparks along lit edges */
                if (sparkTimer % 4 === 0 && bright > 0.3 && Math.random() < 0.04) {
                    sparks.push(new Spark(nodes[i], nodes[j]));
                    if (Math.random() < 0.5) sparks.push(new Spark(nodes[j], nodes[i]));
                }
            }
        }
    }

    /* ---- mouse hub connections ---- */
    function drawMouseEdges() {
        nodes.forEach((n, idx) => {
            const dist = Math.hypot(n.x - mouse.x, n.y - mouse.y);
            if (dist > NODE_R) return;
            const prox = 1 - dist / NODE_R;

            /* edge */
            ctx.beginPath();
            const grad = ctx.createLinearGradient(mouse.x, mouse.y, n.x, n.y);
            grad.addColorStop(0, `rgba(167,139,250,${prox * 0.9})`);
            grad.addColorStop(1, `rgba(129,140,248,0)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 1 + prox * 1.2;
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();

            /* sparks from cursor */
            if (sparkTimer % 3 === 0 && prox > 0.4 && Math.random() < 0.12) {
                const fakeOrigin = { x: mouse.x, y: mouse.y };
                sparks.push(new Spark(fakeOrigin, n));
            }
        });

        /* cursor ring */
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167,139,250,0.9)';
        ctx.fill();

        const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 32);
        halo.addColorStop(0, 'rgba(167,139,250,0.25)');
        halo.addColorStop(1, 'rgba(167,139,250,0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 32, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
    }

    /* ---- init ---- */
    function init() {
        const n = Math.min(80, Math.floor(W * H / 14000));
        nodes  = Array.from({ length: n }, () => new Node());
        sparks = [];
    }

    /* ---- loop ---- */
    function loop() {
        ctx.clearRect(0, 0, W, H);

        nodes.forEach(n => n.update());
        drawEdges();
        drawMouseEdges();
        nodes.forEach(n => n.draw());

        sparks = sparks.filter(s => s.alive);
        sparks.forEach(s => { s.update(); s.draw(); });

        requestAnimationFrame(loop);
    }

    resize();
    init();
    loop();
})();
