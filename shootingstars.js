/* Background shooting stars (Homepage + Personal Information).
   One transparent canvas sits right above the page's star field and below all the content. Every few seconds a star
   streaks across the sky from the upper right to the lower left, with a glowing head and a fading tail.
   The loop only runs while a star is in flight, and it is skipped when the visitor prefers reduced motion. */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var anchor = document.getElementById('hp-sky') || document.getElementById('pi-stars');
    if (!anchor) return;

    var cv = document.createElement('canvas');
    cv.id = 'bg-shooters';
    cv.setAttribute('aria-hidden', 'true');
    anchor.parentNode.insertBefore(cv, anchor.nextSibling);
    var ctx = cv.getContext('2d');

    var W = 0, H = 0, stars = [], raf = 0, last = 0, spawnTimer = 0;
    var TINTS = [[200, 246, 255], [200, 246, 255], [165, 243, 252], [221, 214, 254]];

    function size() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
        var ang = (18 + Math.random() * 24) * Math.PI / 180;        /* flight angle below the horizontal */
        var dir = [-Math.cos(ang), Math.sin(ang)];
        var scale = Math.max(0.8, Math.min(1.6, W / 1440));
        var tail = (130 + Math.random() * 130) * scale;
        var dist = (420 + Math.random() * 380) * scale;
        /* start in the upper right part of the sky, so the star crosses the empty top and the margins */
        var x0 = W * (0.3 + Math.random() * 0.75);
        var y0 = -20 + Math.random() * H * 0.36;
        stars.push({
            x0: x0, y0: y0, dx: dir[0], dy: dir[1], dist: dist, tail: tail,
            speed: (620 + Math.random() * 520) * scale, t: 0,
            c: TINTS[Math.floor(Math.random() * TINTS.length)], w: (1.5 + Math.random() * 0.9) * Math.min(scale, 1.3)
        });
        if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }

    function frame(now) {
        var dt = last ? Math.min(50, now - last) : 16;
        last = now;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (var i = stars.length - 1; i >= 0; i--) {
            var s = stars[i];
            s.t += dt / 1000;
            var d = s.t * s.speed;                                  /* distance travelled by the head */
            if (d > s.dist + s.tail) { stars.splice(i, 1); continue; }
            var head = Math.min(d, s.dist);
            var tl = Math.min(s.tail, d);                           /* the tail grows out of the head, then shrinks away */
            var life = d < s.dist ? Math.min(1, d / 60) : Math.max(0, 1 - (d - s.dist) / s.tail);
            var hx = s.x0 + s.dx * head, hy = s.y0 + s.dy * head;
            var tx = hx - s.dx * tl, ty = hy - s.dy * tl;
            var c = s.c, rgb = c[0] + ',' + c[1] + ',' + c[2];
            var g = ctx.createLinearGradient(hx, hy, tx, ty);
            g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * life).toFixed(3) + ')');
            g.addColorStop(0.25, 'rgba(' + rgb + ',' + (0.55 * life).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(' + rgb + ',0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = s.w;
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
            /* a soft glow along the tail, and a small sparkling head */
            ctx.lineWidth = s.w * 3.4;
            ctx.globalAlpha = 0.22;
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - s.dx * tl * 0.55, hy - s.dy * tl * 0.55); ctx.stroke();
            ctx.globalAlpha = 1;
            var R = 7 + s.w * 3;
            var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);
            hg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * life).toFixed(3) + ')');
            hg.addColorStop(1, 'rgba(' + rgb + ',0)');
            ctx.fillStyle = hg;
            ctx.beginPath(); ctx.arc(hx, hy, R, 0, 6.2832); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        if (stars.length) raf = requestAnimationFrame(frame);
        else { raf = 0; ctx.clearRect(0, 0, W, H); }
    }

    function schedule(first) {
        clearTimeout(spawnTimer);
        spawnTimer = setTimeout(function () {
            if (!document.hidden) {
                spawn();
                if (Math.random() < 0.28) setTimeout(spawn, 260 + Math.random() * 380);      /* now and then, a pair */
            }
            schedule(false);
        }, first ? 900 : 2200 + Math.random() * 3600);
    }

    size();
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { cancelAnimationFrame(raf); raf = 0; stars = []; ctx.clearRect(0, 0, W, H); }
    });
    schedule(true);
})();
