/* =============================================
   ANIMATION 3 — RIPPLE DOT GRID
   A grid of dots that ripples outward from
   the cursor position. Multiple overlapping
   ripples create interference patterns.
   ============================================= */
(function () {
    const canvas = document.getElementById('bgCanvas');
    const ctx    = canvas.getContext('2d');

    let W, H, cols, rows, dots;
    const SPACING  = 36;    /* grid cell size in px */
    const DOT_BASE = 1.4;   /* base dot radius */
    const ripples  = [];    /* active ripple events */

    const mouse = { x: -9999, y: -9999 };
    let lastSpawn = 0;

    /* ---- resize ---- */
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        buildGrid();
    }
    window.addEventListener('resize', resize);

    /* ---- mouse — spawn ripple on move (throttled) ---- */
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        const now = performance.now();
        if (now - lastSpawn > 80) {           /* max 1 ripple per 80 ms */
            ripples.push({ x: e.clientX, y: e.clientY, born: now });
            lastSpawn = now;
        }
    });
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    /* ---- click — strong burst ---- */
    window.addEventListener('click', e => {
        ripples.push({ x: e.clientX, y: e.clientY, born: performance.now(), burst: true });
    });

    /* ---- grid ---- */
    function buildGrid() {
        const offX = (W % SPACING) / 2;
        const offY = (H % SPACING) / 2;
        cols = Math.ceil(W / SPACING) + 1;
        rows = Math.ceil(H / SPACING) + 1;
        dots = [];
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                dots.push({
                    ox: offX + c * SPACING,   /* original x */
                    oy: offY + r * SPACING,   /* original y */
                });
            }
        }
    }

    /* ---- loop ---- */
    const SPEED     = 260;    /* ripple expand speed px/s */
    const WAVE_W    = 60;     /* wave band width px */
    const LIFETIME  = 1.8;    /* seconds before a ripple dies (normal) */
    const BURST_LT  = 2.4;    /* lifetime for click bursts */

    function loop(now) {
        ctx.clearRect(0, 0, W, H);

        /* remove dead ripples */
        for (let i = ripples.length - 1; i >= 0; i--) {
            const lt = ripples[i].burst ? BURST_LT : LIFETIME;
            if ((now - ripples[i].born) / 1000 > lt) ripples.splice(i, 1);
        }

        dots.forEach(d => {
            let displacement = 0;   /* sum of ripple contributions */
            let maxProx      = 0;   /* proximity to mouse 0–1 */

            /* mouse proximity hover glow */
            const mdist = Math.hypot(d.ox - mouse.x, d.oy - mouse.y);
            if (mdist < 80) maxProx = Math.max(maxProx, 1 - mdist / 80);

            /* ripple contributions */
            ripples.forEach(rip => {
                const age      = (now - rip.born) / 1000;
                const radius   = age * SPEED;
                const strength = rip.burst ? 1.6 : 1.0;
                const dist     = Math.hypot(d.ox - rip.x, d.oy - rip.y);

                /* is this dot inside the wave band? */
                const diff = dist - radius;
                if (diff > -WAVE_W && diff < WAVE_W * 0.5) {
                    const wave = Math.cos((diff / WAVE_W) * Math.PI * 0.5);
                    /* fade out with age */
                    const lt    = rip.burst ? BURST_LT : LIFETIME;
                    const decay = Math.max(0, 1 - age / lt);
                    displacement += wave * decay * strength;
                }
            });

            /* clamp */
            displacement = Math.max(-1, Math.min(2, displacement));

            /* draw */
            const scale  = DOT_BASE + displacement * 4.5 + maxProx * 3;
            const alpha  = 0.18 + Math.min(displacement * 0.45, 0.55) + maxProx * 0.5;
            const hue    = 215 + displacement * 40 + maxProx * 30;  /* indigo → violet */

            if (scale < 0.2) return;

            /* glow when displaced */
            if (displacement > 0.3 || maxProx > 0.2) {
                const gRad = scale * 5;
                const g    = ctx.createRadialGradient(d.ox, d.oy, 0, d.ox, d.oy, gRad);
                g.addColorStop(0, `hsla(${hue},80%,70%,${alpha * 0.5})`);
                g.addColorStop(1, `hsla(${hue},80%,70%,0)`);
                ctx.beginPath();
                ctx.arc(d.ox, d.oy, gRad, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(d.ox, d.oy, Math.max(0, scale), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue},75%,72%,${alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(loop);
    }

    resize();
    requestAnimationFrame(loop);
})();
