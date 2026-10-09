/*
  Page behaviour, shared by every page: the background that pushes into the
  sky, the product carousel, the decoding headings, the reveals, the card at
  the close and the shop with its product sheet. Each part checks that its
  elements exist, so either page can load the same file. Runs as soon as it is
  parsed; only the smooth scroll waits for window.load.
*/
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  /* ----------------------------------------------------------- background */
  // One clip behind the page. Scrolling the first screen pushes it in toward
  // its sky (--z from 0 to 1), so the rest of the page sits on that same sky.
  var bg = document.querySelector('.bg:not(.bg--sky)');
  var ticking = false;
  function paint() {
    ticking = false;
    if (!bg || still) return;
    var z = ease(scrollY / (innerHeight * 0.95));
    bg.style.setProperty('--z', z.toFixed(4));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  paint();
  var bgv = document.querySelector('.bg video');
  if (bgv && still) { bgv.removeAttribute('autoplay'); bgv.pause(); }

  /* ------------------------------------------------- word-by-word titles */
  // The big italic lines rise word by word out of a blur. Words stay visible
  // until the line is told to play, so nothing waits hidden for a script.
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (still) return;
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" style="--i:' + i + '">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
    }).join(' ');
    el.classList.add('split');
  });
  var hero = document.querySelector('.hero [data-split]');
  if (hero) hero.classList.add('go');

  /* ------------------------------------------------------------ the tap */
  // The real card: tap it and it jumps, sends out NFC rings and turns over,
  // and the contact appears. Left alone on screen, it turns itself.
  var close = document.querySelector('.close');
  var tcard = document.querySelector('.tcard');
  var tapped = false, autoTap = null;
  function doTap() {
    clearTimeout(autoTap);
    tcard.classList.toggle('is-flipped');
    tcard.classList.remove('bump'); void tcard.offsetWidth; tcard.classList.add('bump');
    if (!tapped) { tapped = true; close.classList.add('tapped'); }
  }
  if (tcard) {
    tcard.addEventListener('click', doTap);
    if (fine) {
      tcard.addEventListener('mousemove', function (e) {
        var r = tcard.getBoundingClientRect();
        tcard.style.setProperty('--tx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        tcard.style.setProperty('--ty', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
      });
      tcard.addEventListener('mouseleave', function () { tcard.style.setProperty('--tx', 0); tcard.style.setProperty('--ty', 0); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        clearTimeout(autoTap);
        if (es[0].isIntersecting && !tapped) autoTap = setTimeout(doTap, 4500);
        var h = close.querySelector('[data-split]');
        if (es[0].isIntersecting && h) h.classList.add('go');
      }, { threshold: 0.45 }).observe(close);
    }
  }

  /* -------------------------------------------------- decoding headings */
  var GLYPHS = '▮▯▪/\\<>_=+*#01';
  function decode(el) {
    if (still || el.dataset.decoded) return;
    el.dataset.decoded = '1';
    var nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push({ n: walker.currentNode, t: walker.currentNode.nodeValue });
    var total = nodes.reduce(function (s, x) { return s + x.t.length; }, 0);
    var start = performance.now(), dur = 520 + total * 14;
    (function step(now) {
      var k = clamp((now - start) / dur, 0, 1), shown = Math.floor(k * total), i = 0;
      nodes.forEach(function (x) {
        var out = '';
        for (var c = 0; c < x.t.length; c++, i++) {
          var ch = x.t[c];
          out += (i < shown || ch === ' ' || ch === '\n') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        x.n.nodeValue = out;
      });
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ----------------------------------------------------------- reveals */
  // Only what is still below the fold gets hidden, so the page is complete at
  // rest: a link preview, a slow phone or a blocked script still see it all.
  var revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('rv-in');
      if (el.hasAttribute('data-decode')) decode(el);
      el.querySelectorAll('[data-count]').forEach(count);
      revealIO.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;

  function count(el) {
    if (still || el.dataset.counted) return;
    el.dataset.counted = '1';
    var to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    var start = performance.now();
    (function step(now) {
      var k = ease((now - start) / 1100);
      el.textContent = (to * k).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }

  document.querySelectorAll('.rv, [data-decode]').forEach(function (el) {
    if (!revealIO || still) return;
    if (el.getBoundingClientRect().top > innerHeight * 0.92 && el.classList.contains('rv')) el.classList.add('rv-pre');
    revealIO.observe(el);
  });

  /* ---------------------------------------------------------- carousel */
  var car = document.querySelector('.car');
  if (car) (function () {
    var slides = [].slice.call(car.querySelectorAll('.slide'));
    var tabs = [].slice.call(document.querySelectorAll('.segs [data-seg]'));
    var info = document.querySelector('.car-info');
    var bar = document.querySelector('.car-info__bar i');
    var pp = document.querySelector('[data-car="toggle"]');
    var n = slides.length, cur = 0, inView = false, paused = still;

    function vid(i) { return slides[i].querySelector('video'); }
    function field(k) { return info.querySelector('[data-f="' + k + '"]'); }

    function layout() {
      slides.forEach(function (s, i) {
        var o = i - cur;
        if (o > n / 2) o -= n; if (o < -n / 2) o += n;
        var a = Math.abs(o);
        s.style.setProperty('--o', o);
        s.style.setProperty('--a', a);
        s.style.zIndex = String(20 - a);
        s.style.visibility = a > 2 ? 'hidden' : '';
        s.classList.toggle('is-on', o === 0);
        s.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
        var v = vid(i);
        if (a <= 1 && v.preload === 'none') v.preload = 'metadata';
        if (o !== 0 && !v.paused) v.pause();
      });
    }

    function fill() {
      var d = slides[cur].dataset;
      field('seg').textContent = d.segName;
      field('code').textContent = d.code;
      field('name').textContent = d.name;
      field('kind').textContent = d.kind;
      field('line').textContent = d.line;
      field('cta').textContent = d.cta;
      field('wa').href = d.wa;
      field('n').textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      tabs.forEach(function (t) {
        var on = t.dataset.seg === d.seg;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
    }

    function playCur() {
      var v = vid(cur);
      if (paused || !inView) { v.pause(); return; }
      v.preload = 'auto';
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }

    function go(i) {
      var prev = vid(cur);
      cur = ((i % n) + n) % n;
      if (prev !== vid(cur)) { prev.pause(); }
      vid(cur).currentTime = 0;
      layout(); fill(); playCur();
    }

    slides.forEach(function (s, i) {
      var v = vid(i);
      v.addEventListener('ended', function () { if (i === cur && inView) go(cur + 1); });
      s.addEventListener('click', function () {
        if (i !== cur) { go(i); return; }
        paused = !paused; syncToggle(); playCur();
      });
    });

    function syncToggle() {
      if (!pp) return;
      pp.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pp.querySelector('span').textContent = paused ? 'Reproducir' : 'Pausar';
      car.classList.toggle('is-paused', paused);
    }
    if (pp) pp.addEventListener('click', function () { paused = !paused; syncToggle(); playCur(); });

    document.querySelector('[data-car="prev"]').addEventListener('click', function () { go(cur - 1); });
    document.querySelector('[data-car="next"]').addEventListener('click', function () { go(cur + 1); });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        for (var i = 0; i < n; i++) if (slides[i].dataset.seg === t.dataset.seg) { go(i); break; }
      });
    });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    });

    // Swipe: a horizontal drag of 40px moves one slide; a vertical one scrolls.
    var sx = null, sy = 0;
    car.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; }, { passive: true });
    car.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(cur + (dx < 0 ? 1 : -1)); car.dataset.swiped = '1'; }
    });
    car.addEventListener('click', function (e) {
      if (car.dataset.swiped) { e.stopPropagation(); e.preventDefault(); delete car.dataset.swiped; }
    }, true);

    (function tick() {
      var v = vid(cur);
      if (bar && v.duration) bar.style.transform = 'scaleX(' + (v.currentTime / v.duration).toFixed(4) + ')';
      requestAnimationFrame(tick);
    })();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting; playCur();
      }, { threshold: 0.4 }).observe(car);
    }
    layout(); fill(); syncToggle();
  })();

  /* ------------------------------------------------- not-yet-built door */
  document.querySelectorAll('.door--soon .door__go').forEach(function (btn) {
    var note = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      note.hidden = !open;
    });
  });

  /* ---------------------------------------------------------------- shop */
  var shop = document.querySelector('.shop');
  if (shop) (function () {
    var data = JSON.parse(document.getElementById('shop-data').textContent);
    var items = [].slice.call(shop.querySelectorAll('.item'));
    var chips = [].slice.call(document.querySelectorAll('.shopbar [data-seg]'));
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.toggle('is-on', x === c); });
        items.forEach(function (it) { it.hidden = c.dataset.seg !== '*' && it.dataset.seg !== c.dataset.seg; });
      });
    });
    // Hover shows the product's reel in place of the photo, like a second shot.
    if (fine && !still) items.forEach(function (it) {
      var v = it.querySelector('video');
      it.querySelector('.item__media').addEventListener('mouseenter', function () {
        v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {});
        it.classList.add('is-live');
      });
      it.querySelector('.item__media').addEventListener('mouseleave', function () { v.pause(); it.classList.remove('is-live'); });
    });

    var dlg = document.getElementById('sheet');
    function f(k) { return dlg.querySelector('[data-s="' + k + '"]'); }
    var reel = f('reel'), img = f('img');
    function view(which) {
      var vid = which === 'reel';
      img.hidden = vid; reel.hidden = !vid;
      dlg.querySelectorAll('[data-view]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.view === which); });
      if (vid) { var p = reel.play(); if (p && p.catch) p.catch(function () {}); } else reel.pause();
    }
    dlg.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () { view(b.dataset.view); }); });
    function open(id) {
      var d = data[id];
      f('seg').textContent = d.seg; f('code').textContent = d.code; f('name').textContent = d.name;
      f('kind').textContent = d.kind + ' · ' + d.client; f('text').textContent = d.text; f('cta').textContent = d.cta;
      f('wa').href = d.wa; f('soon').hidden = !d.soon;
      var pg = f('page'); pg.hidden = !d.page; if (d.page) pg.href = d.page;
      img.src = d.img; img.alt = d.name; f('thumb').src = d.img; f('poster').src = d.poster;
      reel.poster = d.poster; reel.src = d.reel;
      var dl = f('specs'); dl.textContent = '';
      d.specs.forEach(function (row) {
        var dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = row[0]; dd.textContent = row[1]; dl.appendChild(dt); dl.appendChild(dd);
      });
      view('img');
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    items.forEach(function (it) {
      it.querySelector('.item__media').addEventListener('click', function () { open(it.dataset.id); });
      it.querySelector('.item__more').addEventListener('click', function () { open(it.dataset.id); });
    });
    dlg.querySelector('.sheet__x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { reel.pause(); });
  })();

  /* ------------------------------------------------------------ back link */
  // Coming from the home page, "Volver" goes back in history, so the visitor
  // lands where they left the carousel instead of at the top.
  document.querySelectorAll('a.back').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (history.length > 1 && document.referrer && document.referrer.indexOf(location.host) !== -1) {
        e.preventDefault(); history.back();
      }
    });
  });

  /* ----------------------------------------------- deferred: smooth scroll */
  function load(src) {
    return new Promise(function (ok, no) {
      var el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = no;
      document.body.appendChild(el);
    });
  }
  addEventListener('load', function () {
    if (!fine || still) return;
    load('js/lenis.min.js').then(function () {
      if (!window.Lenis) return;
      var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'), el = id.length > 1 && document.querySelector(id);
          if (!el) return;
          e.preventDefault(); lenis.scrollTo(el, { offset: -70 });
        });
      });
    }).catch(function () {});
  });
})();
