/* =========================================================
   Interface behaviour
   loader · navigation · reveals · counters · chart · tilt
   magnetic buttons · cursor · card spotlight
   ========================================================= */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------ loader */
  document.body.classList.add('is-loading');
  const loader = $('#loader');
  const heroTitle = $('.hero__title');

  function finishLoading() {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    heroTitle && heroTitle.classList.add('is-in');
    // hero reveals follow the headline
    $$('.hero .reveal').forEach((el) => {
      el.style.setProperty('--d', (parseInt(el.dataset.delay || 0, 10) + 300) + 'ms');
      el.classList.add('is-in');
    });
    setTimeout(() => $('#chart') && $('#chart').classList.add('is-in'), 500);
    setTimeout(startDashCounters, 900);
  }

  const minimum = reduced ? 0 : 1900;
  const started = performance.now();
  const ready = () => {
    const wait = Math.max(0, minimum - (performance.now() - started));
    setTimeout(finishLoading, wait);
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ready);
    setTimeout(ready, 3500); // safety net if fonts stall
  } else {
    window.addEventListener('load', ready);
  }

  /* -------------------------------------------- navigation */
  const nav = $('#nav');
  const burger = $('#burger');
  const mobileMenu = $('#mobileMenu');
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (y > 500 && y > lastY + 6 && !mobileMenu.classList.contains('is-open')) {
      nav.classList.add('is-hidden');
    } else if (y < lastY - 6 || y < 200) {
      nav.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => toggleMenu());
  $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  // active link tracking
  const sections = ['hero', 'services', 'insights', 'about'].map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.nav__links a');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id === 'hero' ? 'top' : e.target.id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => sectionObserver.observe(s));

  $('#toTop') && $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ----------------------------------------------- reveals */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.style.setProperty('--d', (el.dataset.delay || 0) + 'ms');
      el.classList.add('is-in');
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => {
    if (el.closest('.hero')) return; // handled after the loader
    revealObserver.observe(el);
  });

  /* ---------------------------------------------- counters */
  const fmt = (v, el) => {
    const dec = parseInt(el.dataset.decimals || 0, 10);
    const n = dec ? v.toFixed(dec) : Math.round(v).toString();
    return el.dataset.format === 'comma' ? n.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : n;
  };
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  function countUp(el, duration = 2200) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseFloat(el.dataset.count);
    if (reduced) { el.textContent = fmt(target, el); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = fmt(target * easeOut(p), el);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function startDashCounters() {
    $$('.dash [data-count]').forEach((el, i) => setTimeout(() => countUp(el, 2000), i * 180));
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countUp(e.target, 2400);
      counterObserver.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  $$('.stats [data-count]').forEach((el) => counterObserver.observe(el));

  /* ------------------------------------------------- chart */
  const chartLine = $('#chartLine');
  const chartDot = $('#chartDot');
  const chartHalo = $('#chartHalo');
  if (chartLine && chartDot && !reduced) {
    const len = chartLine.getTotalLength();
    chartLine.style.strokeDasharray = len;
    chartLine.style.strokeDashoffset = len;
    let start = null;
    const drawMs = 2600, delayMs = 400;
    const chart = $('#chart');
    function moveDot(now) {
      if (!chart.classList.contains('is-in')) { requestAnimationFrame(moveDot); return; }
      if (start === null) start = now + delayMs;
      const p = Math.min(1, Math.max(0, (now - start) / drawMs));
      // match the CSS ease-in-out used for the stroke
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const pt = chartLine.getPointAtLength(len * eased);
      chartDot.setAttribute('cx', pt.x); chartDot.setAttribute('cy', pt.y);
      chartHalo.setAttribute('cx', pt.x); chartHalo.setAttribute('cy', pt.y);
      if (p < 1) requestAnimationFrame(moveDot);
    }
    requestAnimationFrame(moveDot);
  }

  /* -------------------------------------------------- tilt */
  const dash = $('#dash');
  if (dash && finePointer && !reduced) {
    const wrap = dash.parentElement;
    let rx = 0, ry = 0, tx = 0, ty = 0, raf;
    const update = () => {
      rx += (tx - rx) * 0.08;
      ry += (ty - ry) * 0.08;
      dash.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) raf = requestAnimationFrame(update);
      else raf = null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    wrap.addEventListener('pointermove', (e) => {
      const r = dash.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = -py * 7; ty = px * 9;
      kick();
    });
    wrap.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  }

  /* --------------------------------------------- magnetic */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      let raf;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.style.transform = `translate(${x}px, ${y}px)`; });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ----------------------------------------------- cursor */
  const cursor = $('#cursor');
  if (cursor && finePointer && !reduced) {
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2, mx = cx, my = cy, shown = false;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; cursor.classList.add('is-visible'); cx = mx; cy = my; }
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('pointerenter', () => shown && cursor.classList.add('is-visible'));
    const hoverables = 'a, button, [data-magnetic], .card, .post, .dash__stat';
    document.addEventListener('pointerover', (e) => cursor.classList.toggle('is-hover', !!e.target.closest(hoverables)));
    (function follow() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.translate = `${cx}px ${cy}px`;
      requestAnimationFrame(follow);
    })();
  }

  /* ------------------------------------------ card spotlight */
  if (finePointer) {
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ------------------------------------ about media parallax */
  const aboutMedia = $('.about__media');
  const aboutScene = aboutMedia && $('.scene', aboutMedia);
  if (aboutScene && !reduced) {
    const parallax = () => {
      const r = aboutMedia.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      aboutScene.style.transform = `scale(1.12) translateY(${(p * -6).toFixed(2)}%)`;
    };
    window.addEventListener('scroll', parallax, { passive: true });
    parallax();
  }

  /* ---------------------------------- smooth anchor offset */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
})();
