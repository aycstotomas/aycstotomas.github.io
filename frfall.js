/* Family and Friends backdrop: puts the falling figure's heart exactly on the page's glowing heart (the hub in the
   middle of the four cases), and sizes the picture to cover the window. The picture itself is fixed and never scrolls. */
(function () {
    var box = document.querySelector('.fr-fall');
    if (!box) return;
    var anchor = box.querySelector('.fr-fall-anchor'), stage = document.querySelector('.fr-stage'), hub = document.querySelector('.fr-hub');

    function place() {
        var W = window.innerWidth, H = window.innerHeight, x = W / 2, y = H * 0.45;
        if (hub && getComputedStyle(hub).display !== 'none') {
            /* the hub is animated, so measure the stage instead: the hub sits at 50% across and 344 / 752 down it */
            var r = stage.getBoundingClientRect();
            if (r.height) { x = r.left + r.width / 2; y = r.top + r.height * 344 / 752; }
        }
        /* the figure is 1365 px wide at scale 1; scale it with the window (a laptop at 1440 x 810 is about 0.95) */
        var u = Math.min(W / 1440, H / 810);
        box.style.setProperty('--fw', Math.round(Math.max(1365 * 0.95 * u, 640)) + 'px');
        anchor.style.left = x + 'px';
        anchor.style.top = y + 'px';
    }
    place();
    /* the page slides in when it opens, so measure again once it has settled */
    document.addEventListener('animationend', place, true);
    setTimeout(place, 1200); setTimeout(place, 3000);
    window.addEventListener('resize', place);
    window.addEventListener('load', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();
