/* Site-wide cursor: the mouse pointer is a little shooting star with a glowing four-point head and a fading ice-blue trail.
   Only for real mice / trackpads (touch screens keep their normal behaviour) and skipped when the visitor prefers
   reduced motion, so the normal arrow stays in those cases. Over links and buttons the star grows and gets a ring. */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var st = document.createElement('style');
    st.textContent = 'html.star-cursor, html.star-cursor * { cursor: none !important; }' +
        '#star-cursor { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483000; pointer-events: none; }';
    document.head.appendChild(st);

    var cv = document.createElement('canvas');
    cv.id = 'star-cursor';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    var TRAIL = 600;                                   /* ms a trail point lives */
    var pts = [], sparks = [], mx = -100, my = -100, tx = -100, ty = -100, seen = false, inside = false, hot = 0, hotTarget = 0, raf = 0, lastMove = 0, ang = -0.6;
    var HOT = 'a, button, input, textarea, select, summary, label, [role="button"], [tabindex]:not([tabindex="-1"]), .fr-card, .ach-card';

    function wake() { if (!raf) raf = requestAnimationFrame(frame); }
    document.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY; lastMove = performance.now();
        if (!seen) { seen = true; mx = tx; my = ty; document.documentElement.classList.add('star-cursor'); }
        inside = true;
        var t = e.target;
        hotTarget = (t && t.closest && t.closest(HOT)) ? 1 : 0;
        wake();
    }, { passive: true });
    document.addEventListener('mouseleave', function () { inside = false; });
    document.addEventListener('mouseenter', function () { inside = true; wake(); });
    window.addEventListener('blur', function () { inside = false; });

    function frame(now) {
        raf = 0;
        ctx.clearRect(0, 0, W, H);
        /* the head eases toward the pointer so the trail is smooth even when the mouse jumps */
        var dx = tx - mx, dy = ty - my, d = Math.hypot(dx, dy);
        mx += dx * 0.55; my += dy * 0.55;
        if (d > 1.5) ang = Math.atan2(dy, dx);
        hot += (hotTarget - hot) * 0.2;
        if (inside && seen) {
            var last = pts[pts.length - 1];
            if (!last || Math.hypot(mx - last.x, my - last.y) > 1.2) pts.push({ x: mx, y: my, t: now });
            if (d > 14 && Math.random() < 0.6) sparks.push({ x: mx, y: my, vx: (Math.random() - 0.5) * 24 - Math.cos(ang) * 14, vy: (Math.random() - 0.5) * 24 - Math.sin(ang) * 14, t: now, r: 0.8 + Math.random() * 1.1 });
        }
        while (pts.length && now - pts[0].t > TRAIL) pts.shift();
        /* trail: short segments, thicker and brighter near the head */
        ctx.lineCap = 'round';
        for (var i = 1; i < pts.length; i++) {
            var k = 1 - (now - pts[i].t) / TRAIL;
            if (k <= 0) continue;
            ctx.strokeStyle = 'rgba(' + (165 + Math.round(60 * k)) + ',' + (243 + Math.round(10 * k)) + ',252,' + (0.75 * k * k).toFixed(3) + ')';
            ctx.lineWidth = 1 + 5.5 * k;
            ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
        }
        for (var s = sparks.length - 1; s >= 0; s--) {
            var p = sparks[s], a = 1 - (now - p.t) / 520;
            if (a <= 0) { sparks.splice(s, 1); continue; }
            var ex = p.x + p.vx * (1 - a), ey = p.y + p.vy * (1 - a);
            ctx.fillStyle = 'rgba(200,246,255,' + (a * 0.8).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(ex, ey, p.r * a, 0, 7); ctx.fill();
        }
        if (inside && seen) {
            var sc = 1 + hot * 0.55, tw = 0.9 + 0.1 * Math.sin(now / 140);
            /* glow */
            var g = ctx.createRadialGradient(mx, my, 0, mx, my, 20 * sc);
            g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, 'rgba(165,243,252,0.5)'); g.addColorStop(1, 'rgba(165,243,252,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, 20 * sc, 0, 7); ctx.fill();
            /* four-point star */
            var R = 9 * sc * tw, r = 2.2 * sc;
            ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.PI / 4 * hot);
            ctx.fillStyle = '#f4feff';
            ctx.beginPath();
            for (var q = 0; q < 8; q++) { var rr = q % 2 ? r : R, aa = q * Math.PI / 4 - Math.PI / 2; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
            ctx.closePath(); ctx.fill(); ctx.restore();
            if (hot > 0.05) {                                  /* ring over clickable things */
                ctx.strokeStyle = 'rgba(165,243,252,' + (0.7 * hot).toFixed(3) + ')'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(mx, my, 13 + 5 * hot, 0, 7); ctx.stroke();
            }
        }
        var idle = performance.now() - lastMove > 900 && Math.hypot(tx - mx, ty - my) < 0.5 && !pts.length && !sparks.length;
        if (!idle || (inside && seen && hot > 0.01)) raf = requestAnimationFrame(frame);
        else if (inside && seen) { raf = requestAnimationFrame(frame); }   /* keep the head twinkling while the mouse rests on the page */
    }
})();
