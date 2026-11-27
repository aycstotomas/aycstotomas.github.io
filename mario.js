/* Homepage: a little pixel-art "me" (8-bit, Mario style) runs along a brick ledge under the social squares.
   He stops under each square, jumps, bumps it with his head like a lucky block, and the square plays its hover
   animation and hops (the .mario-hit class in styles.css) while a spinning star pops out of it.
   Laptops and desktops only (the squares need room underneath); skipped when the visitor prefers reduced motion. */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var social = document.querySelector('.social-links');
    if (!social) return;
    var blocks = Array.prototype.slice.call(social.querySelectorAll('a'));
    if (!blocks.length) return;
    var html = document.documentElement;

    /* ---------- the sprite: 12 x 16 pixels, drawn facing right ---------- */
    var PAL = {
        H: '#1c2536', h: '#4a5a7d',                 /* black hair (straight, slightly curved) and its highlight */
        S: '#d9a278', E: '#3a2212', M: '#6b3d24',   /* skin, brown eyes, the mole on the left side of the face */
        W: '#f4f7fb', T: '#a5f3fc',                 /* white shirt, ice-blue tie */
        K: '#2b3a59', k: '#1b2740', B: '#0c1220'    /* black suit (lit and shaded) and shoes */
    };
    var HEAD = [
        '...HHHHHH...',
        '..HHhHHHHH..',
        '..HHHHHHHH..',
        '..HSSSSSSH..',
        '..HSESSESH..',
        '..SSSSSSMS..',
        '...SSSSSS...',
        '....WTTW....'
    ];
    var TORSO = [
        '..KKWTTWKK..',
        '.SKKKTTKKKS.',
        '.SKKkTTkKKS.',
        '..KKKKKKKK..'
    ];
    var TORSO_JUMP = [
        'S.KKWTTWKK.S',
        'SSKKKTTKKKSS',
        '..KKkTTkKK..',
        '..KKKKKKKK..'
    ];
    var LEGS = {
        stand: ['..KKK..KKK..', '..kkk..kkk..', '..BBB..BBB..', '.BBBB..BBBB.'],
        step:  ['.KKK....KKK.', '.kkk....kkk.', '.BBB....BBB.', 'BBBB....BBBB'],
        pass:  ['...KKKKKK...', '...kkkkkk...', '...BBBBBB...', '..BBBBBBBB..'],
        jump:  ['.KKK....KKK.', 'KKk......kKK', 'BB........BB', '............']
    };

    function build(rows) {
        var w = 12, h = rows.length, c = document.createElement('canvas');
        c.width = w + 2; c.height = h + 2;
        var g = c.getContext('2d');
        var solid = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== '.'; };
        g.fillStyle = 'rgba(150,222,244,0.6)';                /* a thin starlight rim keeps the dark suit readable on the night sky */
        for (var y = -1; y <= h; y++) for (var x = -1; x <= w; x++) {
            if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
        }
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
            var k = rows[yy][xx];
            if (k !== '.') { g.fillStyle = PAL[k]; g.fillRect(xx + 1, yy + 1, 1, 1); }
        }
        return c;
    }
    var SPR = {
        stand: build(HEAD.concat(TORSO, LEGS.stand)),
        step:  build(HEAD.concat(TORSO, LEGS.step)),
        pass:  build(HEAD.concat(TORSO, LEGS.pass)),
        jump:  build(HEAD.concat(TORSO_JUMP, LEGS.jump))
    };
    var STAR = ['..#..', '.###.', '#####', '.###.', '.#.#.'];

    /* ---------- stage ---------- */
    var cv = document.createElement('canvas');
    cv.id = 'mario-stage';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');

    var on = false, running = false, raf = 0, last = 0, begun = false;
    var P = 3, gap = 40, groundY = 0, top = 0, cw = 0, cx = [], bTop = [], stageW = 0, speed = 140, v0 = 300, grav = 1000;
    var m = { x: -60, off: 0, vy: 0, face: 1, state: 'walk', wait: 0, walkT: 0, hit: false, p: 0 };
    var pops = [];

    /* ---------- what he says: friendly facts from the Personal Information page (kept short; no private details) ---------- */
    var LINES = [
        "Hi! I'm Arnelius, but everyone calls me YanYan.",
        "Born and raised in Baguio City.",
        "1st-year BSIT student at the University of the Cordilleras.",
        "I'm the Broadcasting Club Director of UC's Publication Guild.",
        "My goal: become an ERP developer who builds practical systems.",
        "Hidden talents: typing 187 WPM and playing guitar!",
        "I love debate, public speaking and critical thinking.",
        "I code in Java, JavaScript, Python, HTML and CSS.",
        "Pisces, ESTJ. My weakness? Procrastination!",
        "Favorites: sisig, matcha latte and ice cream.",
        "Fave game: Ghost of Tsushima. Fave movie: Weathering with You.",
        "Badminton, cycling and jogging keep me moving.",
        "Dream trip: Japan! Fave time of day: sunset.",
        "I have 2 siblings, and I'm the eldest.",
        "Want more? Open the Personal Information page!"
    ];
    var say = document.createElement('div');
    say.id = 'mario-say';
    say.setAttribute('aria-hidden', 'true');
    document.body.appendChild(say);
    var talk = { text: '', t: 0, shown: false };
    function placeSay() {
        var vw = window.innerWidth, w = say.offsetWidth, h = say.offsetHeight, gapX = P * 5;
        var toRight = m.x < vw * 0.55;
        var left = toRight ? m.x + cw / 2 + gapX : m.x - cw / 2 - gapX - w;
        left = Math.max(8, Math.min(vw - w - 8, left));
        say.className = 'on ' + (toRight ? 'right' : 'left');
        say.style.left = left + 'px';
        say.style.top = Math.max(70, groundY - 10 * P - h / 2) + 'px';
    }
    function sayLine(text) {
        talk.text = text; talk.t = 0; talk.shown = true;
        say.textContent = text;             /* measure the full text first so the bubble does not resize while typing */
        say.style.visibility = 'hidden'; say.className = 'on';
        placeSay();
        say.textContent = '';
        say.style.visibility = '';
        say.style.minWidth = '';
        say.style.width = Math.min(250, Math.max(120, text.length * 7.4 + 30)) + 'px';
        placeSay();
    }
    function hideSay() { talk.shown = false; say.className = ''; }
    function typeSay(dt) {
        if (!talk.shown) return;
        talk.t += dt;
        var n = Math.min(talk.text.length, Math.floor(talk.t * 48));
        var t = talk.text.slice(0, n);
        if (say.textContent !== t) say.textContent = t;
    }
    var SEQ = [];
    for (var i = 0; i < blocks.length; i++) SEQ.push(i);
    for (var j = blocks.length - 2; j > 0; j--) SEQ.push(j);          /* 0 1 2 3 4 3 2 1, then around again */

    function layout() {
        var vw = window.innerWidth, vh = window.innerHeight;
        var rects = blocks.map(function (b) { return b.getBoundingClientRect(); });
        var foot = document.querySelector('footer');
        var footTop = foot ? foot.getBoundingClientRect().top : vh;
        if (vw < 1024 || vh < 540 || !(rects[0].width > 0)) { on = false; cv.style.display = 'none'; hideSay(); return false; }
        var bw = rects[0].width, bottom = Math.max.apply(null, rects.map(function (r) { return r.bottom; }));
        var avail = footTop - 12 - bottom;
        P = Math.max(2, Math.min(4, Math.floor(avail / 1.9 / 16), Math.round(bw / 15)));
        var charH = 16 * P;
        gap = Math.max(P * 3, Math.min(charH * 0.85, avail - charH));
        groundY = bottom + gap + charH;
        if (groundY + 4 * P > footTop - 2) { on = false; cv.style.display = 'none'; hideSay(); return false; }
        cx = rects.map(function (r) { return r.left + r.width / 2; });
        bTop = rects.map(function (r) { return r.top; });
        top = Math.max(0, Math.min.apply(null, bTop) - 60);
        stageW = Math.min(vw, rects[rects.length - 1].right + P * 40);
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var h = groundY + 4 * P + 4 - top;
        cv.width = Math.round(stageW * dpr); cv.height = Math.round(h * dpr);
        cv.style.cssText = 'display:block;left:0;top:' + top + 'px;width:' + stageW + 'px;height:' + h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
        speed = 46 * P;
        var H = gap + P * 2.5, tUp = 0.3;                     /* the jump would peak a little above the block */
        v0 = 2 * H / tUp; grav = 2 * H / (tUp * tUp);
        cw = 12 * P;
        on = true;
        return true;
    }

    /* ---------- drawing ---------- */
    function ground() {
        var t = 4 * P, x0 = 0, x1 = stageW;
        ctx.fillStyle = 'rgba(120,200,235,0.13)'; ctx.fillRect(x0, groundY, x1 - x0, 2 * P * 2);
        ctx.fillStyle = 'rgba(165,243,252,0.4)';  ctx.fillRect(x0, groundY, x1 - x0, P * 0.8);
        ctx.fillStyle = 'rgba(165,243,252,0.2)';
        for (var r = 0; r < 2; r++) {                         /* brick joints, staggered row by row */
            ctx.fillRect(x0, groundY + (r * 2 + 2) * P - P * 0.4, x1 - x0, P * 0.5);
            for (var x = x0 + (r ? t / 2 : 0); x < x1; x += t) ctx.fillRect(x, groundY + r * 2 * P, P * 0.55, 2 * P);
        }
        ctx.save();                                          /* the ledge fades away at its right end */
        ctx.globalCompositeOperation = 'destination-out';
        var g = ctx.createLinearGradient(x1 - P * 36, 0, x1, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = g; ctx.fillRect(x1 - P * 36, groundY - 2, P * 36, 4 * P + 8);
        g = ctx.createLinearGradient(0, 0, P * 14, 0);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, groundY - 2, P * 14, 4 * P + 8);
        ctx.restore();
    }
    function popStar(p) {
        var k = p.t / 0.8, y = p.y - 8 - 40 * (1 - Math.pow(1 - Math.min(1, k), 2));
        var a = k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.45), sx = Math.abs(Math.cos(p.t * 14));
        var s = P * 0.8;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, y);
        ctx.scale(Math.max(0.18, sx), 1);
        for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
            if (STAR[r][c] === '#') { ctx.fillStyle = (r === 2 && c === 2) ? '#ffffff' : '#ffe58a'; ctx.fillRect((c - 2.5) * s, (r - 2.5) * s, s + 0.5, s + 0.5); }
        }
        ctx.restore();
    }
    function draw() {
        ctx.clearRect(0, top, stageW + 4, groundY + 4 * P + 8);
        ground();
        pops.forEach(popStar);
        var f = m.state === 'jump' ? 'jump' : (m.state === 'walk' ? ((Math.floor(m.walkT / 0.11) % 2) ? 'pass' : 'step') : 'stand');
        var spr = SPR[f], w = spr.width * P, h = spr.height * P;
        var y = groundY - m.off - h + P;                     /* the rim row sits just below the feet */
        ctx.imageSmoothingEnabled = false;
        ctx.save();
        ctx.translate(m.x, 0);
        if (m.face < 0) ctx.scale(-1, 1);
        ctx.drawImage(spr, -w / 2, y, w, h);
        ctx.restore();
    }

    /* ---------- behaviour ---------- */
    function hitBlock(i) {
        var a = blocks[i];
        a.classList.remove('mario-hit');
        void a.offsetWidth;
        a.classList.add('mario-hit');
        setTimeout(function () { a.classList.remove('mario-hit'); }, 760);
        pops.push({ x: cx[i], y: bTop[i], t: 0 });
    }
    function update(dt) {
        for (var i = pops.length - 1; i >= 0; i--) { pops[i].t += dt; if (pops[i].t > 0.8) pops.splice(i, 1); }
        var target = cx[SEQ[m.p % SEQ.length]];
        if (m.state === 'walk') {
            var dx = target - m.x, st = speed * dt;
            m.walkT += dt;
            if (Math.abs(dx) <= st) { m.x = target; m.state = 'jump'; m.vy = v0; m.off = 0; m.hit = false; m.walkT = 0; }
            else { m.x += Math.sign(dx) * st; m.face = dx > 0 ? 1 : -1; }
        } else if (m.state === 'jump') {
            m.vy -= grav * dt;
            m.off += m.vy * dt;
            if (!m.hit && m.off >= gap) {                       /* head meets the block */
                m.off = gap; m.vy = -Math.abs(m.vy) * 0.12 - 30; m.hit = true;
                hitBlock(SEQ[m.p % SEQ.length]);
            }
            if (m.off <= 0 && m.vy < 0) {
                m.off = 0; m.vy = 0; m.state = 'pause';
                var line = LINES[m.p % LINES.length];
                m.p++;
                sayLine(line);
                m.wait = Math.max(2.4, 1 + line.length * 0.05);  /* he stands and talks long enough to read it */
            }
        } else {
            m.wait -= dt;
            if (m.wait <= 0) { hideSay(); m.state = 'walk'; m.walkT = 0; layoutSoft(); }
        }
    }
    /* the squares are at rest between hits, so re-measure them in case the layout shifted a little */
    function layoutSoft() { if (!blocks.some(function (b) { return b.classList.contains('mario-hit'); })) layout(); }

    function frame(now) {
        raf = 0;
        if (!on || document.hidden) { running = false; return; }
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
        last = now;
        update(dt);
        typeSay(dt);
        draw();
        raf = requestAnimationFrame(frame);
    }
    function start() {
        if (running || !on) return;
        running = true; last = 0;
        raf = requestAnimationFrame(frame);
    }

    function begin() {
        if (begun) return;
        begun = true;
        m.x = -cw; m.state = 'walk'; m.p = 0;
        if (layout()) start();
    }
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!begun) return;
            if (layout()) { m.x = Math.max(m.x, -cw); hideSay(); if (m.state === 'jump') { m.state = 'walk'; m.off = 0; m.vy = 0; } start(); }
            else { cancelAnimationFrame(raf); running = false; }
        }, 150);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) hideSay(); else { last = 0; start(); } });

    /* wait until the intro (the shooting stars drawing the pill and the squares) is over, then run in from the left */
    function ready() {
        var wait = html.classList.contains('trace-on') ? 1800 : 500;   /* he runs in while the last squares are still being drawn */
        setTimeout(begin, wait);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else window.addEventListener('load', ready);
})();
