/* Next / Home buttons: while hovered (or keyboard-focused), two shooting stars (ice blue and violet) run around the edges of
   the box, forever, and four-point glints bloom on its corners (the starfield, the twinkles and the launching arrow are in CSS).
   Everything is an SVG outline drawn on top of the button (bright heads with fading tails), so it never changes the layout. */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var NS = 'http://www.w3.org/2000/svg';

    function make(tag, attrs) {
        var el = document.createElementNS(NS, tag);
        for (var k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function build(link) {
        if (link.querySelector('.nsl-star')) return;
        if (getComputedStyle(link).position === 'static') {
            /* the star needs a positioned parent; the offsets stay "auto" so the button does not move */
            link.style.position = 'relative';
            link.style.top = link.style.right = link.style.bottom = link.style.left = 'auto';
        }
        var svg = make('svg', { 'class': 'nsl-star', 'aria-hidden': 'true', focusable: 'false' });
        /* a long faint tail, a medium tail, a short bright tail and the head: all end at the same point.
           The second set (u) is the violet comet, half a lap behind the first. */
        ['nsl-t1', 'nsl-t2', 'nsl-t3', 'nsl-head', 'nsl-u1', 'nsl-u2', 'nsl-u3', 'nsl-uhead'].forEach(function (c) {
            svg.appendChild(make('rect', { 'class': c, pathLength: '100' }));
        });
        /* three four-point glints; fit() puts them on the corners */
        var glints = make('g', { 'class': 'nsl-glints' });
        for (var i = 0; i < 3; i++) {
            var at = make('g', {});
            at.appendChild(make('path', { 'class': 'nsl-glint' }));
            glints.appendChild(at);
        }
        svg.appendChild(glints);
        /* a back arrow launches to the left */
        if (link.querySelector('svg path[d^="M19 12H5"]')) link.classList.add('nsl-back');
        link.appendChild(svg);
        fit(link);
    }

    function fit(link) {
        var svg = link.querySelector('.nsl-star');
        if (!svg) return;
        var r = link.getBoundingClientRect(), cs = getComputedStyle(link);
        var bw = parseFloat(cs.borderTopWidth) || 0;
        var w = link.offsetWidth, h = link.offsetHeight;
        if (!w || !h) return;
        var rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2);
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.style.setProperty('left', -bw + 'px', 'important');
        svg.style.setProperty('top', -bw + 'px', 'important');
        svg.style.setProperty('width', w + 'px', 'important');
        svg.style.setProperty('height', h + 'px', 'important');
        /* glints: top-left edge, right edge, bottom edge */
        var gr = Math.max(5, Math.min(11, h * 0.2)), k = gr * 0.21;
        var d = 'M0,' + -gr + ' L' + k + ',' + -k + ' L' + gr + ',0 L' + k + ',' + k + ' L0,' + gr + ' L' + -k + ',' + k + ' L' + -gr + ',0 L' + -k + ',' + -k + 'Z';
        var spots = [[w * 0.14, 0], [w, h * 0.3], [w * 0.62, h]];
        var gs = svg.querySelectorAll('.nsl-glints > g');
        for (var j = 0; j < gs.length; j++) {
            gs[j].setAttribute('transform', 'translate(' + spots[j][0].toFixed(1) + ' ' + spots[j][1].toFixed(1) + ')');
            gs[j].firstChild.setAttribute('d', d);
        }
        var rects = svg.querySelectorAll('rect');
        for (var i = 0; i < rects.length; i++) {
            rects[i].setAttribute('x', bw / 2);
            rects[i].setAttribute('y', bw / 2);
            rects[i].setAttribute('width', Math.max(0, w - bw));
            rects[i].setAttribute('height', Math.max(0, h - bw));
            rects[i].setAttribute('rx', rad);
        }
    }

    function init() {
        var links = document.querySelectorAll('.next-page-link');
        Array.prototype.forEach.call(links, function (l) {
            build(l);
            /* the buttons scale with the window, so measure again whenever the visitor reaches for one */
            l.addEventListener('pointerenter', function () { fit(l); });
            l.addEventListener('focus', function () { fit(l); });
        });
        window.addEventListener('resize', function () { Array.prototype.forEach.call(links, fit); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
