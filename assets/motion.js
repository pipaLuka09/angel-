/*
  Premium motion layer: GSAP + ScrollTrigger + Lenis + SplitType.
  Falls back to fully visible, statically-scrolling content if any
  vendor script fails to load, or if the visitor prefers reduced motion —
  in both cases we do not want elements pre-hidden by CSS to stay hidden.

  Initialization is split into small chunks scheduled via
  requestIdleCallback instead of running as one long synchronous block.
  Total work is the same, but no single chunk becomes a "long task"
  (>50ms) that inflates Total Blocking Time.
*/
(function () {
  function revealEverythingInstantly() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    revealEverythingInstantly();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function schedule(fn) {
    if (window.requestIdleCallback) {
      requestIdleCallback(fn, { timeout: 300 });
    } else {
      setTimeout(fn, 0);
    }
  }

  /* ---------------------------------------------------------------------
     Lenis smooth scroll — desktop/trackpad only. Mobile keeps native
     momentum scrolling (better feel, less battery/jank on touch devices).
     --------------------------------------------------------------------- */
  function initLenis() {
    if (isFinePointer && window.Lenis) {
      var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------------------------------------------------------------------
     Word-by-word title reveals (SplitType)
     --------------------------------------------------------------------- */
  function splitWords(heading) {
    if (!window.SplitType || heading.dataset.splitDone) return null;
    heading.dataset.splitDone = 'true';
    heading.classList.add('split-heading');
    var split = new SplitType(heading, { types: 'words' });
    gsap.set(heading, { opacity: 1 });
    gsap.set(split.words, { opacity: 0, y: '55%', filter: 'blur(5px)' });
    return split;
  }

  var heroHeading = document.querySelector('.hero__heading');

  /* Hero text is visible from first paint (no CSS pre-hide, protects LCP).
     Only the heading gets a subtle word-by-word reveal; eyebrow/subheading/
     actions stay static since motion.js now loads after window.load and a
     delayed positional jump would look broken rather than premium. */
  function initHeroSplit() {
    var heroSplit = heroHeading ? splitWords(heroHeading) : null;
    if (heroSplit) {
      gsap.to(heroSplit.words, {
        opacity: 1,
        y: '0%',
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: 0.055,
        ease: 'power3.out'
      });
    }
  }

  function initSectionSplits() {
    document
      .querySelectorAll('.section__heading, .newsletter__heading, .collection-header h1, .product-info__title')
      .forEach(function (heading) {
        if (heading === heroHeading) return;
        var split = splitWords(heading);
        if (!split) return;
        gsap.to(split.words, {
          opacity: 1,
          y: '0%',
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 88%', toggleActions: 'play none none reverse' }
        });
      });
  }

  /* ---------------------------------------------------------------------
     Scroll reveals: fade + rise + scale + blur.
     Grid items (product/collection cards, why-us) batch together so
     whatever enters the viewport at once staggers in as one wave.
     --------------------------------------------------------------------- */
  var gridSelector = '.product-card.reveal, .collection-card.reveal, .why-us-item.reveal, .related-card.reveal';

  function initScrollReveals() {
    if (window.ScrollTrigger.batch) {
      ScrollTrigger.batch(gridSelector, {
        start: 'top 90%',
        onEnter: function (batch) {
          gsap.fromTo(
            batch,
            { opacity: 0, y: 36, scale: 0.95, filter: 'blur(6px)' },
            { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true }
          );
        }
      });
    }

    gsap.utils.toArray('.reveal').forEach(function (el) {
      if (el.matches(gridSelector)) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.97, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        }
      );
    });
  }

  /* ---------------------------------------------------------------------
     Hero parallax
     --------------------------------------------------------------------- */
  function initParallax() {
    var heroSection = document.querySelector('.hero');
    var heroParallax = document.querySelector('[data-hero-parallax]');
    if (heroSection && heroParallax) {
      gsap.to(heroParallax, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ---------------------------------------------------------------------
     3D tilt on cards + magnetic buttons + image zoom — pointer devices only.
     --------------------------------------------------------------------- */
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      gsap.set(card, { transformPerspective: 700, transformStyle: 'preserve-3d' });
      var rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      var rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });

      card.addEventListener('mousemove', function (event) {
        var rect = card.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        rotateX(py * -8);
        rotateY(px * 8);
      });
      card.addEventListener('mouseleave', function () {
        rotateX(0);
        rotateY(0);
      });
    });
  }

  function initMagneticButtons() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      var strength = 0.35;
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });

      btn.addEventListener('mousemove', function (event) {
        var rect = btn.getBoundingClientRect();
        var relX = event.clientX - (rect.left + rect.width / 2);
        var relY = event.clientY - (rect.top + rect.height / 2);
        xTo(relX * strength);
        yTo(relY * strength);
      });
      btn.addEventListener('mouseleave', function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  function initZoom() {
    document.querySelectorAll('[data-zoom]').forEach(function (zoomEl) {
      var img = zoomEl.querySelector('img');
      if (!img) return;
      var scaleTo = gsap.quickTo(img, 'scale', { duration: 0.35, ease: 'power2.out' });
      var xTo = gsap.quickTo(img, 'xPercent', { duration: 0.35, ease: 'power2.out' });
      var yTo = gsap.quickTo(img, 'yPercent', { duration: 0.35, ease: 'power2.out' });

      zoomEl.addEventListener('mousemove', function (event) {
        var rect = zoomEl.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        scaleTo(1.8);
        xTo(px * -30);
        yTo(py * -30);
      });
      zoomEl.addEventListener('mouseleave', function () {
        scaleTo(1);
        xTo(0);
        yTo(0);
      });
    });
  }

  schedule(initLenis);
  schedule(initHeroSplit);
  schedule(initSectionSplits);
  schedule(initScrollReveals);
  schedule(initParallax);
  if (isFinePointer) {
    schedule(initTilt);
    schedule(initMagneticButtons);
    schedule(initZoom);
  }
})();
