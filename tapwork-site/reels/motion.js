/*
  Motion layer for the reel page: GSAP + ScrollTrigger + Lenis + SplitType.

  Same choreography as the ShopNow theme (assets/motion.js and the table in
  CLAUDE.md): headings rise word by word out of a blur, cards come in as one
  wave per batch, Lenis smooths the wheel on mouse and trackpad only, pointer
  effects never run on touch. Timings are copied, not re-tuned.

  One difference: nothing is hidden by CSS before this file runs. The page is
  complete at rest (a shared link's preview, a slow connection, a blocked
  script all see every card); cards that are still below the fold are hidden
  here, just before their trigger is armed.
*/
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);
  var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function schedule(fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 300 });
    else setTimeout(fn, 0);
  }

  function initLenis() {
    if (!isFinePointer || !window.Lenis) return;
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    // In-page links go through Lenis so they glide instead of jumping.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var target = id === '#top' ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
      });
    });
  }

  function splitWords(heading) {
    if (!window.SplitType || heading.dataset.splitDone) return null;
    heading.dataset.splitDone = 'true';
    heading.classList.add('split-heading');
    var split = new SplitType(heading, { types: 'words' });
    gsap.set(split.words, { opacity: 0, y: '55%', filter: 'blur(5px)' });
    return split;
  }

  var heroHeading = document.querySelector('.hero__heading');

  function initHeroSplit() {
    var s = heroHeading ? splitWords(heroHeading) : null;
    if (!s) return;
    gsap.to(s.words, { opacity: 1, y: '0%', filter: 'blur(0px)', duration: 0.9, stagger: 0.055, ease: 'power3.out' });
  }

  function initSectionSplits() {
    document.querySelectorAll('.section__heading').forEach(function (heading) {
      var s = splitWords(heading);
      if (!s) return;
      gsap.to(s.words, {
        opacity: 1, y: '0%', filter: 'blur(0px)', duration: 0.8, stagger: 0.05, ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    });
  }

  var gridSelector = '.reel.reveal, .step.reveal, .plan.reveal';

  function belowFold(el) {
    return el.getBoundingClientRect().top > window.innerHeight * 0.9;
  }

  function initScrollReveals() {
    var cards = gsap.utils.toArray(gridSelector);
    gsap.set(cards.filter(belowFold), { opacity: 0, y: 36, scale: 0.95, filter: 'blur(6px)' });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.08,
          ease: 'power3.out', overwrite: true
        });
      }
    });

    gsap.utils.toArray('.reveal').forEach(function (el) {
      if (el.matches(gridSelector)) return;
      gsap.fromTo(el,
        { opacity: 0, y: 40, scale: 0.97, filter: 'blur(6px)' },
        {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out',
          immediateRender: belowFold(el),
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
    });
  }

  function initParallax() {
    var hero = document.querySelector('.hero');
    var layer = document.querySelector('[data-hero-parallax]');
    if (!hero || !layer) return;
    gsap.to(layer, {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      gsap.set(card, { transformPerspective: 700, transformStyle: 'preserve-3d' });
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        rx(((e.clientY - r.top) / r.height - 0.5) * -8);
        ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      });
      card.addEventListener('mouseleave', function () { rx(0); ry(0); });
    });
  }

  function initMagneticButtons() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
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
  }
})();
