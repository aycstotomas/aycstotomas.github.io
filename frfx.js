/* Family and Friends sky: faint twinkling stars on a transparent canvas, under the page content.
   The shooting stars come from shootingstars.js. 30 fps, skipped (drawn once) when the visitor prefers reduced motion. */
(function () {
    var cv = document.getElementById('fr-canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d'), reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, stars = [], raf = 0, last = 0, TAU = Math.PI * 2;

    function seeded(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function build() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2), rnd = seeded(77), tints = ['255,255,255', '215,250,255', '165,243,252', '221,214,254'];
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars = [];
        var n = Math.max(70, Math.min(170, Math.round(W * H / 8000)));
        for (var i = 0; i < n; i++) {
            var big = rnd() > 0.93;
            stars.push({ x: rnd() * W, y: rnd() * H, r: big ? 1.2 + rnd() * 0.6 : 0.5 + rnd() * 0.8, a: big ? 0.85 : 0.35 + rnd() * 0.35,
                         ph: rnd() * TAU, sp: 0.6 + rnd() * 1.4, c: tints[Math.floor(rnd() * tints.length)], big: big });
        }
        draw(performance.now());
    }
    function draw(now) {
        ctx.clearRect(0, 0, W, H);
        var t = now / 1000;
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i], a = s.a * (reduce ? 0.9 : 0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
            ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(2) + ')';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
            if (s.big) {
                ctx.strokeStyle = 'rgba(' + s.c + ',' + (a * 0.35).toFixed(2) + ')'; ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(s.x - s.r * 3.4, s.y); ctx.lineTo(s.x + s.r * 3.4, s.y);
                ctx.moveTo(s.x, s.y - s.r * 3.4); ctx.lineTo(s.x, s.y + s.r * 3.4);
                ctx.stroke();
            }
        }
    }
    function loop(now) { raf = requestAnimationFrame(loop); if (now - last < 33) return; last = now; draw(now); }
    function start() { cancelAnimationFrame(raf); if (!reduce) raf = requestAnimationFrame(loop); }
    build(); start();
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); start(); }, 150); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else start(); });
})();
