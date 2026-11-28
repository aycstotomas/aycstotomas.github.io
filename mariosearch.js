/* Personal Information: the pixel-art "me" stands on the top-right edge of the info box with a chat bubble.
   Type what you are looking for (Age, email, mole, family...) and the matching spots on the page light up
   while everything else dims. Matching is word-based and understands a few everyday synonyms (mom, phone, waist...).
   Laptops and desktops only (the page is a fixed, no-scroll layout there). Reduced motion: highlights stay, the hop and pulse are off. */
(function () {
    var panel = document.querySelector('.pi-panel');
    if (!panel) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var body = document.body;

    /* ---------- the sprite (same little me as the homepage), 12 x 16 + a 1px starlight rim ---------- */
    var PAL = {
        H: '#1c2536', h: '#4a5a7d', S: '#d9a278', E: '#3a2212', M: '#6b3d24',
        W: '#f4f7fb', T: '#a5f3fc', K: '#2b3a59', k: '#1b2740', B: '#0c1220'
    };
    var HEAD = ['...HHHHHH...', '..HHhHHHHH..', '..HHHHHHHH..', '..HSSSSSSH..', '..HSESSESH..', '..SSSSSSMS..', '...SSSSSS...', '....WTTW....'];
    var TORSO = ['..KKWTTWKK..', '.SKKKTTKKKS.', '.SKKkTTkKKS.', '..KKKKKKKK..'];
    var TORSO_UP = ['S.KKWTTWKK.S', 'SSKKKTTKKKSS', '..KKkTTkKK..', '..KKKKKKKK..'];
    var LEG_STAND = ['..KKK..KKK..', '..kkk..kkk..', '..BBB..BBB..', '.BBBB..BBBB.'];
    var LEG_JUMP = ['.KKK....KKK.', 'KKk......kKK', 'BB........BB', '............'];
    function drawSprite(cv, rows) {
        var w = 12, h = rows.length, g = cv.getContext('2d');
        cv.width = w + 2; cv.height = h + 2;
        g.clearRect(0, 0, cv.width, cv.height);
        var solid = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== '.'; };
        g.fillStyle = 'rgba(150,222,244,0.6)';
        for (var y = -1; y <= h; y++) for (var x = -1; x <= w; x++) {
            if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
        }
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
            var k = rows[yy][xx];
            if (k !== '.') { g.fillStyle = PAL[k]; g.fillRect(xx + 1, yy + 1, 1, 1); }
        }
    }
    var STAR = ['..#..', '.###.', '#####', '.###.', '.#.#.'];

    /* ---------- build the widget ---------- */
    var root = document.createElement('div');
    root.id = 'pi-ask';
    root.setAttribute('role', 'search');
    root.innerHTML =
        '<label class="pi-ask-bubble">' +
            '<span class="pi-ask-sr">Search this page</span>' +
            '<input type="text" id="pi-ask-input" placeholder="Looking for something?" autocomplete="off" spellcheck="false" maxlength="40">' +
            '<span class="pi-ask-status" id="pi-ask-status" aria-live="polite"></span>' +
        '</label>' +
        '<div class="pi-ask-man" aria-hidden="true"><canvas class="pi-ask-sprite"></canvas><canvas class="pi-ask-star" width="5" height="5"></canvas></div>';
    document.body.appendChild(root);
    var bubble = root.querySelector('.pi-ask-bubble');
    var input = root.querySelector('input');
    var status = root.querySelector('.pi-ask-status');
    var man = root.querySelector('.pi-ask-man');
    var sprite = root.querySelector('.pi-ask-sprite');
    var starCv = root.querySelector('.pi-ask-star');
    var SPR_STAND = HEAD.concat(TORSO, LEG_STAND), SPR_JUMP = HEAD.concat(TORSO_UP, LEG_JUMP);
    drawSprite(sprite, SPR_STAND);
    (function () {
        var g = starCv.getContext('2d');
        for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (STAR[r][c] === '#') { g.fillStyle = (r === 2 && c === 2) ? '#ffffff' : '#ffe58a'; g.fillRect(c, r, 1, 1); }
    })();

    /* ---------- placement: he stands on the top-right edge of the box, the bubble sits to his left ---------- */
    function place() {
        if (window.innerWidth < 769) { root.style.display = 'none'; return; }
        var pr = panel.getBoundingClientRect(), nav = document.querySelector('.navbar');
        var navB = nav ? nav.getBoundingClientRect().bottom : 0;
        if (!(pr.width > 0)) return;
        var P = Math.max(2, Math.min(3, Math.floor((pr.top - navB - 6) / 18)));
        var mw = 14 * P, mh = 18 * P;
        var left = pr.right - 28 - mw, top = pr.top - mh + P;
        root.style.display = 'block';
        man.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + mw + 'px;height:' + mh + 'px';
        starCv.style.width = starCv.style.height = (5 * P) + 'px';
        var bh = Math.round(P * 11 + 2), bw = Math.min(280, Math.max(190, window.innerWidth * 0.2));
        var bTop = Math.max(navB + 4, Math.min(top + 3 * P, pr.top - bh - 4));
        bubble.style.cssText = 'left:' + (left - 12 - bw) + 'px;top:' + bTop + 'px;width:' + bw + 'px;height:' + bh + 'px';
        bubble.style.setProperty('--tail', (top + 7 * P - bTop - 5) + 'px');
        starCv.style.left = (mw / 2 - 2.5 * P) + 'px';
    }

    /* ---------- what can be found ---------- */
    var ALIAS = {
        'student id': 'id|student number|school id', 'birthday': 'birthdate|birth date|bday|dob|born|birth', 'age': 'old|how old|years',
        'birthplace': 'place of birth|born|pob|hometown|birth', 'nationality': 'citizen|citizenship|country',
        'cultural background': 'ethnicity|origin|culture|heritage|race', 'religion': 'faith|church|belief', 'pronouns': 'gender|he him',
        'civil status': 'marital|status|relationship|single', 'height': 'tall|feet|ft', 'weight': 'kg|kilos|heavy', 'bmi': 'body mass',
        'blood type': 'blood', 'body type': 'somatotype|physique|build|body', 'waistline': 'waist|inches|size', 'eyesight': 'vision|eyes|glasses|sight',
        'shoe size': 'shoes|footwear|feet', 'ring size': 'ring|finger', 'shirt size': 'shirt|clothes|clothing', 'pants size': 'pants|clothes|clothing',
        'dominant hand': 'handed|left|right|lefty|righty', 'allergy': 'allergic|allergies', 'phobia': 'fear|afraid|scared|fears',
        'disabilities': 'disability|pwd|disabled', 'criminal record': 'crime|police|clean|nbi|record',
        'hair color': 'hair', 'hair style': 'hair|haircut', 'eye color': 'eyes|eye', 'skin tone': 'skin|complexion',
        'distinguishing mark': 'mole|mark|birthmark|scar|face',
        'nickname': 'alias|called|yanyan', 'personality': 'extrovert|introvert|type', 'mbti': 'personality type|16 personalities|estj',
        'zodiac sign': 'horoscope|star sign|pisces|astrology', 'chinese zodiac': 'zodiac|rat|horoscope|astrology|animal',
        'love language': 'love|romance', 'core values': 'values|principles', 'weaknesses': 'weakness|flaw|flaws',
        'pet peeve': 'peeve|annoys|annoying|dislike', 'hidden talent': 'talent|typing|guitar|skill', 'childhood dream job': 'dream|childhood|kid',
        'pets': 'pet|dog|cat|animal',
        'current address': 'address|home|live|where|location|house', 'permanent address': 'address|home|live|where|location',
        'mobile': 'phone|number|cell|call|contact|text', 'backup': 'phone|number|cell|call|contact', 'school email': 'email|mail|school',
        'personal email': 'email|mail|gmail', 'social media': 'socials|facebook|fb|instagram|ig|tiktok|github|follow',
        'mother': 'mom|mama|mommy|parent|parents|emergency|emergency contact|almira|family',
        'father': 'dad|papa|daddy|parent|parents|arnel|family',
        'younger siblings': 'sibling|brother|sister|siblings|florentin|ariah|family|eldest',
        'course': 'degree|program|bsit|major|study|college', 'favorite subject': 'subject|class|cc1', 'favorite teacher': 'teacher|professor|prof|doc',
        'languages': 'language|speak|tagalog|filipino|english', 'preferred learning style': 'learn|learning|study',
        'work experience': 'job|ojt|internship|work|prosecutor', 'hobbies and interests': 'hobby|hobbies|interests|games|editing',
        'sports': 'sport|play|badminton|cycling|jogging', 'core skills and strengths': 'skills|strengths|strength|debate|speaking',
        'technical skills': 'tech|programming|code|coding|skills|tools|java|python',
        'organization / clubs': 'club|clubs|org|organization|guild|debate', 'future job': 'career|job|goal|work', 'future company': 'company|dream job|emirates',
        'dream travel destination': 'travel|trip|japan|vacation', 'bucket list': 'bucket|goals|wishlist',
        'sleep schedule': 'sleep|night owl|bed', 'daily sleep': 'sleep|hours', 'usual sleep and wake time': 'sleep|wake|bedtime|schedule',
        'commute': 'car|ride|transport|travel', 'routine': 'jog|jogging|weekend', 'favorite editing app': 'editor|editing|vscode|code',
        'os preference': 'windows|operating system|os', 'current pc specs': 'computer|laptop|ram|cpu|ryzen|specs|gpu|pc'
    };
    var GROUP_ALIAS = {
        'identity': 'about|who|basic|info', 'body and health': 'body|health|physical|medical', 'appearance': 'looks|look|face|features',
        'clubs and dreams': 'clubs|dreams|goals|future', 'personality': 'traits|character', 'contact': 'reach|touch|contacts',
        'studies and skills': 'school|education|study|skills|college|work', 'favorites': 'fave|faves|favourite|favourites|likes|loves|best',
        'daily life and tech': 'daily|tech|pc|computer|routine|life', 'family': 'parents|relatives|mom|dad|siblings|brother|sister|emergency'
    };
    var STORY_ALIAS = { 'background': 'about|bio|story|intro|me|who', 'goal and plan': 'goal|plan|future|career|dream|erp' };

    function norm(s) { return String(s || '').toLowerCase().replace(/&middot;|\u00b7/g, ' ').replace(/[^a-z0-9\/'.\- ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
    function wordStart(hay, q) {
        var i = -1;
        while ((i = hay.indexOf(q, i + 1)) > -1) { if (i === 0 || /[^a-z0-9]/.test(hay.charAt(i - 1))) return true; }
        return false;
    }
    function keysFor(label, map) { return norm(label) + '|' + (map[norm(label)] || ''); }

    var groups = [], leaves = [], articles = [];
    Array.prototype.forEach.call(panel.querySelectorAll('.pi-group'), function (g) {
        var h2 = g.querySelector('h2'), name = h2 ? norm(h2.textContent) : '';
        var gi = { el: g, h2: h2, keys: name + '|' + (GROUP_ALIAS[name] || ''), fields: [] };
        Array.prototype.forEach.call(g.querySelectorAll('.pi-field'), function (f) {
            if (f.classList.contains('pi-duo')) {
                var parts = [];
                Array.prototype.forEach.call(f.children, function (d) {
                    var dt = d.querySelector('dt'), dd = d.querySelector('dd');
                    if (!dt) return;
                    var it = { el: d, parent: f, keys: keysFor(dt.textContent, ALIAS), text: norm(dd ? dd.textContent : ''), group: gi };
                    parts.push(it); gi.fields.push(it); leaves.push(it);
                });
                f._parts = parts;
            } else {
                var dt2 = f.querySelector('dt'), dd2 = f.querySelector('dd');
                if (!dt2) return;
                var it2 = { el: f, keys: keysFor(dt2.textContent, ALIAS), text: norm(dd2 ? dd2.textContent : ''), group: gi };
                gi.fields.push(it2); leaves.push(it2);
            }
        });
        groups.push(gi);
    });
    Array.prototype.forEach.call(panel.querySelectorAll('.pi-story article'), function (a) {
        var h = a.querySelector('h2'), name = h ? norm(h.textContent) : '';
        articles.push({ el: a, h2: h, keys: name + '|' + (STORY_ALIAS[name] || ''), text: norm(a.textContent) });
    });
    var duos = Array.prototype.slice.call(panel.querySelectorAll('.pi-duo'));

    /* ---------- search ---------- */
    function search(q) {
        var hitLeaf = [], hitGroup = [], hitArt = [], i;
        for (i = 0; i < groups.length; i++) if (wordStart(groups[i].keys, q)) hitGroup.push(groups[i]);
        for (i = 0; i < leaves.length; i++) if (wordStart(leaves[i].keys, q)) hitLeaf.push(leaves[i]);
        for (i = 0; i < articles.length; i++) if (wordStart(articles[i].keys, q)) hitArt.push(articles[i]);
        if (!hitLeaf.length && !hitGroup.length && !hitArt.length) {            /* nothing by name: look inside the answers */
            for (i = 0; i < leaves.length; i++) if (wordStart(leaves[i].text, q)) hitLeaf.push(leaves[i]);
            for (i = 0; i < articles.length; i++) if (wordStart(articles[i].text, q)) hitArt.push(articles[i]);
        }
        if (!hitLeaf.length && !hitGroup.length && !hitArt.length && q.length >= 3) {   /* last try: anywhere in a label or an answer */
            for (i = 0; i < leaves.length; i++) if (leaves[i].keys.indexOf(q) > -1 || leaves[i].text.indexOf(q) > -1) hitLeaf.push(leaves[i]);
        }
        return { leaf: hitLeaf, group: hitGroup, art: hitArt };
    }

    var lastSig = '', hopT = 0, shakeT = 0, hopBusy = false;
    function clearAll() {
        body.classList.remove('pi-searching');
        panel.querySelectorAll('.pi-hit, .pi-dim').forEach(function (e) { e.classList.remove('pi-hit', 'pi-dim'); });
    }
    function apply(res) {
        clearAll();
        var hitSet = [], i, n = 0;
        res.group.forEach(function (g) { g.fields.forEach(function (f) { if (hitSet.indexOf(f) < 0) hitSet.push(f); }); });
        res.leaf.forEach(function (f) { if (hitSet.indexOf(f) < 0) hitSet.push(f); });
        var groupHasHit = {};
        hitSet.forEach(function (f) { groupHasHit[groups.indexOf(f.group)] = true; });
        res.group.forEach(function (g) { groupHasHit[groups.indexOf(g)] = true; });
        body.classList.add('pi-searching');
        for (i = 0; i < leaves.length; i++) leaves[i].el.classList.add(hitSet.indexOf(leaves[i]) > -1 ? 'pi-hit' : 'pi-dim');
        duos.forEach(function (d) {
            var any = (d._parts || []).some(function (p) { return hitSet.indexOf(p) > -1; });
            d.classList.toggle('pi-dim', !any);
        });
        groups.forEach(function (g, gi) {
            if (!g.h2) return;
            if (res.group.indexOf(g) > -1) g.h2.classList.add('pi-hit');
            else if (!groupHasHit[gi]) g.h2.classList.add('pi-dim');
        });
        articles.forEach(function (a) { a.el.classList.add(res.art.indexOf(a) > -1 ? 'pi-hit' : 'pi-dim'); });
        n = hitSet.length + res.art.length;
        return n;
    }
    function hop() {
        if (reduce || hopBusy) return;
        hopBusy = true;
        drawSprite(sprite, SPR_JUMP);
        man.classList.remove('hop'); void man.offsetWidth; man.classList.add('hop');
        clearTimeout(hopT);
        hopT = setTimeout(function () { drawSprite(sprite, SPR_STAND); man.classList.remove('hop'); hopBusy = false; }, 560);
    }
    function shake() {
        if (reduce) return;
        man.classList.remove('shake'); void man.offsetWidth; man.classList.add('shake');
        clearTimeout(shakeT);
        shakeT = setTimeout(function () { man.classList.remove('shake'); }, 520);
    }
    function run() {
        var q = norm(input.value);
        if (q.length < 2) {
            clearAll(); status.textContent = ''; status.className = 'pi-ask-status'; lastSig = '';
            return;
        }
        var res = search(q), n = apply(res);
        if (!n) {
            clearAll();                                         /* nothing found: leave the page as it was */
            status.textContent = 'not found'; status.className = 'pi-ask-status none';
            if (lastSig !== 'none') shake();
            lastSig = 'none';
            return;
        }
        status.textContent = n + ' found'; status.className = 'pi-ask-status';
        var sig = n + ':' + res.leaf.length + ':' + res.group.length + ':' + res.art.length + ':' + q.charAt(0);
        if (sig !== lastSig) hop();
        lastSig = sig;
    }
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { input.value = ''; run(); input.blur(); }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== input && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) {
            e.preventDefault(); input.focus();
        }
    });
    man.addEventListener('click', function () { input.focus(); });

    /* ---------- show it after the page's own intro has played ---------- */
    var shown = false;
    function show() {
        place();
        if (!shown) { shown = true; root.classList.add('on'); }
    }
    var rz = 0;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(place, 120); });
    if (window.ResizeObserver) new ResizeObserver(place).observe(panel);
    function start() { setTimeout(show, reduce ? 300 : 1700); setTimeout(place, 2600); setTimeout(place, 4200); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else window.addEventListener('load', start);
})();
