/* Homepage: four floating "constellation" blocks (Java, Python, HTML, CSS) around the portrait.
   Intro: for each block a shooting star streaks in from the upper right, then flies from star to star and draws the
   constellation frame around the label, which fades in when the last line is closed. After that the blocks drift
   gently and their stars twinkle. Laptops and desktops only (the phone layout has no free sky next to the portrait).
   With "reduce motion" the blocks simply appear, static. */
(function () {
    var portrait = document.querySelector('.profile-portrait');
    if (!portrait) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var DEFS = [
        { label: 'Java',   ax: -0.36, ay: 0.20, shape: [[-.70,-.45],[-.15,-1.0],[.62,-.62],[.78,.40],[.10,1.0],[-.62,.62]] },
        { label: 'Python', ax:  0.36, ay: 0.11, shape: [[-.66,-.62],[.05,-1.0],[.72,-.40],[.60,.66],[-.10,.96],[-.74,.30]] },
        { label: 'HTML',   ax: -0.40, ay: 0.57, shape: [[-.74,-.30],[-.20,-.98],[.66,-.55],[.76,.52],[.00,.90],[-.58,.70]] },
        { label: 'CSS',    ax:  0.34, ay: 0.50, shape: [[-.60,-.66],[.18,-.92],[.76,-.30],[.66,.60],[-.04,1.0],[-.76,.44]] }
    ];

    var layer = document.createElement('div');
    layer.id = 'tech-layer';
    layer.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    cv.id = 'tech-fx';
    layer.appendChild(cv);
    var ctx = cv.getContext('2d');
    var chips = DEFS.map(function (d, i) {
        var el = document.createElement('div');
        el.className = 'tech-chip';
        el.textContent = d.label;
        layer.appendChild(el);
        return { d: d, el: el, i: i, cx: 0, cy: 0, w: 0, h: 0, nodes: [], seg: [], start: 0, done: reduce, doneAt: 0, lit: [], phase: i * 1.7 };
    });
    document.body.appendChild(layer);

    var W = 0, H = 0, S = 1, visible = false, raf = 0, T0 = 0, started = false, scheduled = false;

    function layout() {
        W = window.innerWidth; H = window.innerHeight;
        if (W < 900 || H < 420 || document.documentElement.scrollHeight > H + 4) { visible = false; layer.style.display = 'none'; return false; }
        var r = portrait.getBoundingClientRect();
        if (!(r.width > 0)) { visible = false; layer.style.display = 'none'; return false; }
        S = Math.max(0.8, Math.min(1.35, W / 1366));
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        layer.style.display = 'block';
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var pcx = r.left + r.width / 2;
        chips.forEach(function (c) {
            c.el.style.fontSize = (15 * S) + 'px';
            c.w = c.el.offsetWidth; c.h = c.el.offsetHeight;
            c.cx = Math.max(c.w / 2 + 26, Math.min(W - c.w / 2 - 26, pcx + c.d.ax * r.height));
            c.cy = r.top + c.d.ay * r.height;
            c.nodes = c.d.shape.map(function (p) { return [p[0] * (c.w / 2 + 16 * S), p[1] * (c.h / 2 + 12 * S)]; });
            var pts = c.nodes.concat([c.nodes[0]]);
            c.seg = [];
            for (var k = 0; k < pts.length - 1; k++) c.seg.push(Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]));
        });
        visible = true;
        return true;
    }

    var ANG = 28 * Math.PI / 180, APPROACH = 760, FLY = 1700, TRACE = 520;
    function streak(x, y, dx, dy, len, a, w) {
        var g = ctx.createLinearGradient(x, y, x - dx * len, y - dy * len);
        g.addColorStop(0, 'rgba(225,250,255,' + a + ')');
        g.addColorStop(0.35, 'rgba(165,243,252,' + (a * 0.45) + ')');
        g.addColorStop(1, 'rgba(165,243,252,0)');
        ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * len, y - dy * len); ctx.stroke();
        var rg = ctx.createRadialGradient(x, y, 0, x, y, 9 * S);
        rg.addColorStop(0, 'rgba(255,255,255,' + a + ')'); rg.addColorStop(0.4, 'rgba(165,243,252,' + (a * 0.55) + ')'); rg.addColorStop(1, 'rgba(165,243,252,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 9 * S, 0, 7); ctx.fill();
    }
    function node(x, y, r, glow) {
        var g = ctx.createRadialGradient(x, y, 0, x, y, r * 4 + glow);
        g.addColorStop(0, 'rgba(210,248,255,0.9)'); g.addColorStop(0.3, 'rgba(165,243,252,0.35)'); g.addColorStop(1, 'rgba(165,243,252,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4 + glow, 0, 7); ctx.fill();
        ctx.fillStyle = '#f2feff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }

    function drawChip(c, t) {
        var amp = 0, ox = 0, oy = 0;
        if (c.done && !reduce) {
            amp = Math.min(1, (t - c.doneAt) / 1.6);
            ox = Math.cos(t * 0.55 + c.phase) * 3 * amp; oy = Math.sin(t * 0.8 + c.phase) * 6 * amp;
        }
        var bx = c.cx + ox, by = c.cy + oy, N = c.nodes.length;
        var pts = c.nodes.map(function (p) { return [bx + p[0], by + p[1]]; });
        pts.push(pts[0]);
        var e = t - c.start, head = null, dir = null, tail = 0, a = 1, drawn = 0, frac = 0;
        if (c.done) { drawn = N; }
        else if (e >= 0) {
            var dA = APPROACH / FLY, d0 = [Math.cos(ANG), -Math.sin(ANG)];
            if (e < dA) {
                var k0 = e / dA;
                head = [pts[0][0] + d0[0] * APPROACH * (1 - k0), pts[0][1] + d0[1] * APPROACH * (1 - k0)];
                dir = [-d0[0], -d0[1]]; tail = 190 * S;
            } else {
                var rem = e - dA, j = 0;
                if (!c.lit[0]) c.lit[0] = t;
                while (j < N && rem > c.seg[j] / TRACE) { rem -= c.seg[j] / TRACE; j++; if (j < N && !c.lit[j]) c.lit[j] = t; }
                if (j >= N) { c.done = true; c.doneAt = t; c.el.classList.add('on'); drawn = N; }
                else {
                    drawn = j; frac = rem * TRACE / c.seg[j];
                    var A = pts[j], B = pts[j + 1];
                    head = [A[0] + (B[0] - A[0]) * frac, A[1] + (B[1] - A[1]) * frac];
                    dir = [(B[0] - A[0]) / c.seg[j], (B[1] - A[1]) / c.seg[j]]; tail = 70 * S;
                }
            }
        }
        /* constellation lines */
        ctx.lineWidth = 1.2 * Math.min(S, 1.2); ctx.lineCap = 'round';
        ctx.strokeStyle = c.done ? 'rgba(165,243,252,0.46)' : 'rgba(165,243,252,0.6)';
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (var s = 0; s < drawn; s++) ctx.lineTo(pts[s + 1][0], pts[s + 1][1]);
        if (!c.done && head && drawn < N && e >= APPROACH / FLY) ctx.lineTo(head[0], head[1]);
        ctx.stroke();
        /* stars (lit as the shooting star reaches them) */
        for (var n = 0; n < N; n++) {
            var lit = c.done ? 0 : c.lit[n];
            if (!c.done && !lit) continue;
            var pulse = c.done ? 0.5 + 0.5 * Math.sin(t * 1.6 + n * 1.3 + c.phase) : Math.max(0, 1 - (t - lit) / 0.6);
            node(pts[n][0], pts[n][1], (1.9 + (c.done ? 0.35 * pulse : 1.6 * pulse)) * Math.min(S, 1.2), c.done ? 4 * pulse : 14 * pulse);
        }
        if (head) streak(head[0], head[1], dir[0], dir[1], tail, a, 2 * Math.min(S, 1.3));
        c.el.style.transform = 'translate(' + Math.round(bx - c.w / 2) + 'px,' + Math.round(by - c.h / 2) + 'px)';
    }

    function frame(now) {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;
        var t = (now - T0) / 1000;
        ctx.clearRect(0, 0, W, H);
        chips.forEach(function (c) { drawChip(c, t); });
    }
    function begin() {
        if (started) return;
        started = true;
        if (!layout()) return;
        T0 = performance.now();
        chips.forEach(function (c, i) { c.start = 0.2 + i * 1.15; if (reduce) c.el.classList.add('on'); });
        raf = requestAnimationFrame(frame);
    }
    var rt = 0;
    window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
            if (!started) return;
            var was = visible;
            layout();
            if (!was && visible && !raf) raf = requestAnimationFrame(frame);
            if (reduce && visible) { ctx.clearRect(0, 0, W, H); chips.forEach(function (c) { drawChip(c, 0); }); }
        }, 150);
    });
    /* start after the page's own intro (the portrait pops in) has settled */
    function ready() { setTimeout(begin, document.documentElement.classList.contains('trace-on') ? 2400 : 400); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else window.addEventListener('load', ready);
})();
