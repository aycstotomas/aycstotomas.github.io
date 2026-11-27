/* Achievements page effects (laptop / desktop).
   1. SKY: faint twinkling stars and a big violet heart constellation behind the cards (the blue background stays).
      The shooting stars in the sky come from shootingstars.js.
   2. TRACE: once the cards have flipped, a shooting star runs around the border of each card, every card in its own
      colour (its accent). Now and then one more star laps a random card.
   Both are plain canvases with no per-frame allocations, and everything is skipped when the visitor prefers reduced motion. */
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sky = document.getElementById('ach-sky');
    var tcv = document.getElementById('ach-trace');
    if (!sky || !tcv) return;
    var PI = Math.PI, TAU = PI * 2;
    var dpr = 1, W = 0, H = 0;

    function seeded(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function sizeCanvas(cv) {
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* =================== 1. SKY =================== */
    var sctx = sky.getContext('2d');
    var stars = [], nodes = [], links = [], drawStart = 0, skyRaf = 0, lastDraw = 0, built = false;
    var VIOLET = '167,139,250', LILAC = '221,214,254';
    var HEART = 0.3;                                             /* how strong the heart is: kept faint so the cards lead */
    var halo = document.createElement('canvas');                 /* one soft violet glow, reused for every heart star */
    halo.width = halo.height = 64;
    (function () {
        var h = halo.getContext('2d'), g = h.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(196,181,253,0.85)'); g.addColorStop(0.35, 'rgba(167,139,250,0.32)'); g.addColorStop(1, 'rgba(167,139,250,0)');
        h.fillStyle = g; h.fillRect(0, 0, 64, 64);
    })();

    function heartPt(t) {                                        /* the classic heart curve, y pointing down */
        return [16 * Math.pow(Math.sin(t), 3),
                -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
    }

    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        sizeCanvas(sky); sizeCanvas(tcv);
        var rnd = seeded(1407), i;

        stars = [];
        var count = Math.max(60, Math.min(150, Math.round(W * H / 9500)));
        var tints = ['255,255,255', '215,235,255', '190,224,255', '221,214,254'];
        for (i = 0; i < count; i++) {
            var big = rnd() > 0.93;
            stars.push({ x: rnd() * W, y: rnd() * H, r: big ? 1.2 + rnd() * 0.5 : 0.5 + rnd() * 0.8,
                         a: big ? 0.85 : 0.35 + rnd() * 0.35, ph: rnd() * TAU, sp: 0.6 + rnd() * 1.4,
                         c: tints[Math.floor(rnd() * tints.length)], big: big });
        }

        /* heart: an outer ring of stars, a smaller ring inside it and a few spokes between them */
        var s = Math.min(W * 0.64 / 32, H * 0.86 / 29), cx = W / 2, cy = H * 0.56 - 2.5 * s;
        nodes = []; links = [];
        var N = 26, M = 11, k;
        for (i = 0; i < N; i++) {
            var p = heartPt(i / N * TAU), j = 1 + (rnd() - 0.5) * 0.05;
            nodes.push({ x: cx + p[0] * s * j, y: cy + p[1] * s * j, r: (i % 5 === 0) ? 2.5 : (i % 2 ? 1.5 : 1.9), ph: rnd() * TAU });
        }
        for (i = 0; i < N; i++) links.push([i, (i + 1) % N]);
        var inner0 = nodes.length;
        for (k = 0; k < M; k++) {
            var q = heartPt(k / M * TAU);
            nodes.push({ x: cx + q[0] * s * 0.5, y: cy + 1.2 * s + q[1] * s * 0.5, r: (k % 3 === 0) ? 2 : 1.4, ph: rnd() * TAU });
        }
        for (k = 0; k < M; k++) links.push([inner0 + k, inner0 + (k + 1) % M]);
        [[0, 0], [5, 2], [13, 6], [21, 9], [8, 3]].forEach(function (sp) { links.push([sp[0], inner0 + sp[1]]); });
        drawStart = performance.now();
    }

    function drawSky(now) {
        sctx.clearRect(0, 0, W, H);
        var t = now / 1000, i, n, l;
        for (i = 0; i < stars.length; i++) {
            var st = stars[i], a = st.a * (reduce ? 0.9 : 0.55 + 0.45 * Math.sin(t * st.sp + st.ph));
            sctx.fillStyle = 'rgba(' + st.c + ',' + a.toFixed(2) + ')';
            sctx.beginPath(); sctx.arc(st.x, st.y, st.r, 0, TAU); sctx.fill();
            if (st.big) {
                sctx.strokeStyle = 'rgba(' + st.c + ',' + (a * 0.35).toFixed(2) + ')'; sctx.lineWidth = 0.6;
                sctx.beginPath();
                sctx.moveTo(st.x - st.r * 3.4, st.y); sctx.lineTo(st.x + st.r * 3.4, st.y);
                sctx.moveTo(st.x, st.y - st.r * 3.4); sctx.lineTo(st.x, st.y + st.r * 3.4);
                sctx.stroke();
            }
        }
        /* the heart draws itself in line by line, then keeps a slow violet shimmer */
        var age = reduce ? 99 : (now - drawStart) / 1000 - 0.25;
        var per = 2.6 / links.length;
        sctx.lineCap = 'round';
        for (i = 0; i < links.length; i++) {
            var f = Math.max(0, Math.min(1, (age - i * per) / 0.5));
            if (f <= 0) continue;
            l = links[i];
            var A = nodes[l[0]], B = nodes[l[1]];
            sctx.strokeStyle = 'rgba(' + VIOLET + ',' + (HEART * (0.22 + 0.08 * Math.sin(t * 0.9 + i))).toFixed(3) + ')';
            sctx.lineWidth = 4.5;
            sctx.beginPath(); sctx.moveTo(A.x, A.y); sctx.lineTo(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f); sctx.stroke();
            sctx.strokeStyle = 'rgba(' + LILAC + ',' + (HEART * (0.8 + 0.15 * Math.sin(t * 0.9 + i))).toFixed(3) + ')';
            sctx.lineWidth = 1.4;
            sctx.beginPath(); sctx.moveTo(A.x, A.y); sctx.lineTo(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f); sctx.stroke();
        }
        for (n = 0; n < nodes.length; n++) {
            var nd = nodes[n], pop = Math.max(0, Math.min(1, (age - (n < 26 ? n : n - 26) * per) / 0.4));
            if (pop <= 0) continue;
            var tw = 0.7 + 0.3 * Math.sin(t * 1.6 + nd.ph), R = nd.r * 7 * (0.6 + 0.4 * pop);
            sctx.globalAlpha = pop * tw * HEART;
            sctx.drawImage(halo, nd.x - R, nd.y - R, R * 2, R * 2);
            sctx.globalAlpha = pop * (0.35 + HEART);
            sctx.fillStyle = '#f5f3ff';
            sctx.beginPath(); sctx.arc(nd.x, nd.y, nd.r * pop, 0, TAU); sctx.fill();
        }
        sctx.globalAlpha = 1;
    }

    function skyLoop(now) {
        skyRaf = requestAnimationFrame(skyLoop);
        if (now - lastDraw < 33) return;                          /* 30 fps is plenty for a slow twinkle */
        lastDraw = now;
        drawSky(now);
    }
    function startSky() {
        cancelAnimationFrame(skyRaf);
        if (reduce) { drawSky(performance.now()); return; }
        skyRaf = requestAnimationFrame(skyLoop);
    }

    /* =================== 2. TRACE =================== */
    var tctx = tcv.getContext('2d');
    var jobs = [], dust = [], traceRaf = 0, traceLast = 0, idle = 0;

    function outline(x, y, w, h, r) {                            /* rounded rectangle, starting top right, counter-clockwise */
        var pts = [], step = 3;
        function line(ax, ay, bx, by) {
            var n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
            for (var i = 0; i < n; i++) pts.push(ax + (bx - ax) * i / n, ay + (by - ay) * i / n);
        }
        function arc(cx, cy, a0, a1) {
            var n = Math.max(1, Math.ceil(Math.abs(a1 - a0) * r / step));
            for (var i = 0; i < n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
        }
        line(x + w - r, y, x + r, y); arc(x + r, y + r, -PI / 2, -PI);
        line(x, y + r, x, y + h - r); arc(x + r, y + h - r, PI, PI / 2);
        line(x + r, y + h, x + w - r, y + h); arc(x + w - r, y + h - r, PI / 2, 0);
        line(x + w, y + h - r, x + w, y + r); arc(x + w - r, y + r, 0, -PI / 2);
        pts.push(x + w - r, y);
        return pts;
    }

    function startLap(card, delay) {
        var el = card.querySelector('.tarot-back') || card;
        var r = card.getBoundingClientRect();
        if (!(r.width > 0)) return;
        var rgb = (card.style.getPropertyValue('--acc-rgb') || '165,243,252').trim();
        var rad = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14, r.width / 2, r.height / 2);
        var pts = outline(r.left + 0.5, r.top + 0.5, r.width - 1, r.height - 1, rad);
        var cum = [0], i;
        for (i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
        var total = cum[cum.length - 1];
        jobs.push({ pts: pts, cum: cum, total: total, rgb: rgb, start: performance.now() + (delay || 0),
                    T: 1500, tail: Math.min(260, total * 0.2), lit: false, doneAt: 0, card: card });
        if (!traceRaf) { traceLast = 0; traceRaf = requestAnimationFrame(traceFrame); }
    }

    function pointAt(j, u) {
        var c = j.cum, lo = 0, hi = c.length - 1;
        if (u <= 0) return [j.pts[0], j.pts[1]];
        if (u >= j.total) return [j.pts[hi * 2], j.pts[hi * 2 + 1]];
        while (hi - lo > 1) { var m = (lo + hi) >> 1; if (c[m] <= u) lo = m; else hi = m; }
        var f = (u - c[lo]) / ((c[hi] - c[lo]) || 1);
        return [j.pts[lo * 2] + (j.pts[hi * 2] - j.pts[lo * 2]) * f, j.pts[lo * 2 + 1] + (j.pts[hi * 2 + 1] - j.pts[lo * 2 + 1]) * f];
    }

    function traceFrame(now) {
        var dt = traceLast ? Math.min(50, now - traceLast) : 16, i;
        traceLast = now;
        tctx.clearRect(0, 0, W, H);
        tctx.globalCompositeOperation = 'lighter';
        tctx.lineCap = 'round';
        for (i = jobs.length - 1; i >= 0; i--) {
            var j = jobs[i];
            if (now < j.start) continue;
            var k = Math.min(1, (now - j.start) / j.T);
            var e = 1 - Math.pow(1 - k, 2.2);                      /* quick start, gentle landing */
            var u = j.total * e;
            if (k >= 1 && !j.doneAt) { j.doneAt = now; flare(j.card); }
            var post = j.doneAt ? now - j.doneAt : 0;
            if (post > 450) { jobs.splice(i, 1); continue; }
            var fade = j.doneAt ? 1 - post / 450 : 1;
            var rgb = j.rgb, hp = pointAt(j, u), N = 16, prev = hp, q, f, a;
            for (var s = 1; s <= N; s++) {                          /* the glowing tail */
                var us = u - j.tail * (j.doneAt ? 1 - post / 450 : 1) * s / N;
                if (us <= 0) break;
                q = pointAt(j, us); f = s / N; a = fade * Math.pow(1 - f, 1.5);
                tctx.beginPath(); tctx.moveTo(prev[0], prev[1]); tctx.lineTo(q[0], q[1]);
                tctx.strokeStyle = 'rgba(' + rgb + ',' + (a * 0.3).toFixed(3) + ')'; tctx.lineWidth = (1 - f) * 8 + 1; tctx.stroke();
                tctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')'; tctx.lineWidth = (1 - f) * 2.4 + 0.4; tctx.stroke();
                prev = q;
            }
            var R = 16, g = tctx.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], R);
            g.addColorStop(0, 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')');
            g.addColorStop(0.3, 'rgba(' + rgb + ',' + (0.5 * fade).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(' + rgb + ',0)');
            tctx.fillStyle = g; tctx.beginPath(); tctx.arc(hp[0], hp[1], R, 0, TAU); tctx.fill();
            var L = 8, rot = u / 40;
            tctx.lineWidth = 1; tctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * fade).toFixed(3) + ')';
            tctx.beginPath();
            tctx.moveTo(hp[0] - L * Math.cos(rot), hp[1] - L * Math.sin(rot)); tctx.lineTo(hp[0] + L * Math.cos(rot), hp[1] + L * Math.sin(rot));
            tctx.moveTo(hp[0] + L * Math.sin(rot), hp[1] - L * Math.cos(rot)); tctx.lineTo(hp[0] - L * Math.sin(rot), hp[1] + L * Math.cos(rot));
            tctx.stroke();
            if (!j.doneAt && Math.random() < 0.5)
                dust.push({ x: hp[0], y: hp[1], vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, age: 0, life: 350 + Math.random() * 300, rgb: rgb });
        }
        for (i = dust.length - 1; i >= 0; i--) {
            var d = dust[i]; d.age += dt;
            if (d.age > d.life) { dust.splice(i, 1); continue; }
            d.x += d.vx * dt / 1000; d.y += d.vy * dt / 1000;
            tctx.fillStyle = 'rgba(' + d.rgb + ',' + (0.8 * (1 - d.age / d.life)).toFixed(3) + ')';
            tctx.beginPath(); tctx.arc(d.x, d.y, 1.1, 0, TAU); tctx.fill();
        }
        tctx.globalCompositeOperation = 'source-over';
        if (jobs.length || dust.length) traceRaf = requestAnimationFrame(traceFrame);
        else { traceRaf = 0; tctx.clearRect(0, 0, W, H); }
    }

    function flare(card) {                                        /* the border lights up in the card's colour when the star arrives */
        card.classList.remove('ach-lit'); void card.offsetWidth; card.classList.add('ach-lit');
    }

    function cardsList() { return [].slice.call(document.querySelectorAll('.tarot')); }
    function lapAll() { cardsList().forEach(function (c, i) { startLap(c, i * 220); }); }
    function idleLap() {
        clearTimeout(idle);
        idle = setTimeout(function () {
            var box = document.getElementById('ach-lightbox');
            if (!document.hidden && !(box && box.open) && !jobs.length) {
                var cs = cardsList(); startLap(cs[Math.floor(Math.random() * cs.length)], 0);
            }
            idleLap();
        }, 6500 + Math.random() * 4000);
    }

    function onFlipped() {
        if (reduce || window.innerWidth < 769) return;
        setTimeout(function () { lapAll(); idleLap(); }, 750);    /* once the flip has settled */
    }

    /* =================== boot =================== */
    build(); startSky();
    if (window.__achFlipped) onFlipped(); else window.addEventListener('ach:flipped', onFlipped);
    var rt = 0;
    window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { jobs = []; dust = []; build(); startSky(); }, 150);
    });
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) cancelAnimationFrame(skyRaf); else startSky();
    });
})();
