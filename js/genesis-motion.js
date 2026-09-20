/**
 * GENESIS — Motion Layer
 * Adds the "dynamic" behaviour on top of the shared IIEC animation engine
 * (iiec-animations.js already handles scroll-reveal, count-up and tilt).
 *
 *  1. Hero cursor spotlight + parallax dots
 *  2. Rotating audience line in the hero
 *  3. Cursor spotlight on cards
 *  4. Scroll-driven timeline ("What GENESIS Covered")
 *  5. "What You'll Gain" active-item highlight
 *  6. Section rail (desktop dot navigation)
 *  7. Photo lightbox for the Moments gallery
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ------------------------------------------------------------
     1. Hero spotlight + parallax
     ------------------------------------------------------------ */
  function initHero() {
    var hero = document.querySelector('.genesis-hero');
    if (!hero || !finePointer || reduceMotion) return;

    var raf = null;
    var last = null;

    function paint() {
      raf = null;
      var r = hero.getBoundingClientRect();
      var x = last.clientX - r.left;
      var y = last.clientY - r.top;
      hero.style.setProperty('--hx', x + 'px');
      hero.style.setProperty('--hy', y + 'px');
      hero.style.setProperty('--px', ((x / r.width) * 2 - 1).toFixed(3));
      hero.style.setProperty('--py', ((y / r.height) * 2 - 1).toFixed(3));
    }

    hero.addEventListener('pointermove', function (e) {
      last = e;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--px', 0);
      hero.style.setProperty('--py', 0);
    });
  }

  /* ------------------------------------------------------------
     2. Rotating audience line
     ------------------------------------------------------------ */
  function initRotator() {
    var el = document.getElementById('rot-word');
    if (!el || reduceMotion) return;

    var words = ['student founders', 'builders & coders', 'future marketers', 'campus leaders', 'big ideas'];
    var i = 0;

    setInterval(function () {
      if (document.hidden) return;
      el.classList.add('is-out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove('is-out');
        el.classList.add('is-pre');
        void el.offsetWidth; // commit the "below" position before animating in
        el.classList.remove('is-pre');
      }, 300);
    }, 2400);
  }

  /* ------------------------------------------------------------
     3. Card spotlight (delegated, one listener)
     ------------------------------------------------------------ */
  function initCardSpotlight() {
    if (!finePointer) return;
    var sel = '.genesis-reason-card, .genesis-stat, .genesis-details-card, .cross-banner, .flow-card';

    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest(sel);
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     4. Scroll-driven timeline
     ------------------------------------------------------------ */
  function initFlow() {
    var flow = document.getElementById('genesis-flow');
    if (!flow) return;

    var track = flow.querySelector('.flow-track');
    var items = flow.querySelectorAll('.flow-item');
    var ticking = false;

    function update() {
      ticking = false;
      var line = window.innerHeight * 0.6;
      var t = track.getBoundingClientRect();
      var fill = Math.max(0, Math.min(t.height, line - t.top));
      flow.style.setProperty('--flow-fill', fill + 'px');

      items.forEach(function (item) {
        var n = item.querySelector('.flow-node').getBoundingClientRect();
        item.classList.toggle('is-lit', n.top + n.height / 2 < line);
      });
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ------------------------------------------------------------
     5. "What You'll Gain" active highlight
     Position-based (not IntersectionObserver): on every scroll frame the
     row nearest the screen centre is lit, so it can't be skipped by fast
     scrolling and both items in a two-column row light together.
     ------------------------------------------------------------ */
  function initGains() {
    var section = document.getElementById('gains');
    var items = Array.prototype.slice.call(document.querySelectorAll('.gain-item'));
    if (!section || !items.length) return;

    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var sr = section.getBoundingClientRect();

      // Section off-screen: nothing lit
      if (sr.bottom < 0 || sr.top > vh) {
        items.forEach(function (it) { it.classList.remove('is-active'); });
        return;
      }

      var mid = vh * 0.5;
      var centers = items.map(function (it) {
        var r = it.getBoundingClientRect();
        return r.top + r.height / 2;
      });

      var nearest = 0;
      centers.forEach(function (c, i) {
        if (Math.abs(c - mid) < Math.abs(centers[nearest] - mid)) nearest = i;
      });

      // Everything in the same visual row as the nearest item
      items.forEach(function (it, i) {
        it.classList.toggle('is-active', Math.abs(centers[i] - centers[nearest]) < 48);
      });
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ------------------------------------------------------------
     6. Section rail
     ------------------------------------------------------------ */
  function initRail() {
    var hero = document.querySelector('.genesis-hero');
    if (hero && !hero.id) hero.id = 'genesis-top';

    var map = [
      ['genesis-top', 'Overview'],
      ['about-genesis', 'About'],
      ['why-attend', 'Why Attend'],
      ['topics', 'Topics'],
      ['event-details', 'Details'],
      ['moments', 'Moments'],
      ['gains', 'Gains'],
      ['faq', 'Quick Answers'],
      ['register', 'Status']
    ].filter(function (m) { return document.getElementById(m[0]); });

    if (!map.length) return;

    var rail = document.createElement('nav');
    rail.className = 'genesis-rail';
    rail.setAttribute('aria-label', 'Page sections');

    var links = {};
    map.forEach(function (m) {
      var target = document.getElementById(m[0]);
      target.style.scrollMarginTop = '80px';

      var a = document.createElement('a');
      a.href = '#' + m[0];
      a.setAttribute('data-label', m[1]);
      a.setAttribute('aria-label', m[1]);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      rail.appendChild(a);
      links[m[0]] = a;
    });
    document.body.appendChild(rail);

    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); });
        links[entry.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    map.forEach(function (m) { io.observe(document.getElementById(m[0])); });
  }

  /* ------------------------------------------------------------
     7. Photo lightbox (Moments gallery)
     ------------------------------------------------------------ */
  function initLightbox() {
    var cards = document.querySelectorAll('.moment-card');
    if (!cards.length) return;

    var box = document.createElement('div');
    box.className = 'genesis-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML = '<button type="button" class="lb-close" aria-label="Close photo">&times;</button><img alt=""><p></p>';
    document.body.appendChild(box);

    var img = box.querySelector('img');
    var cap = box.querySelector('p');
    var closeBtn = box.querySelector('.lb-close');
    var opener = null;

    function open(card) {
      opener = card;
      var thumb = card.querySelector('img');
      img.src = card.getAttribute('data-full');
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = card.getAttribute('data-caption') || '';
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (opener) opener.focus();
    }

    cards.forEach(function (c) { c.addEventListener('click', function () { open(c); }); });
    box.addEventListener('click', function (e) { if (e.target !== img) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
    });
  }

  /* ------------------------------------------------------------
     0. Hero intro — timed to the loader lifting
     The reveal used to play *behind* the loader, so the hero looked
     finished (and still) the moment it appeared. Now it is held back and
     choreographed once the loader is gone, then hands over to an idle
     letter-wave and a soft ripple so the top never goes static.
     ------------------------------------------------------------ */
  function initIntro() {
    var hero = document.querySelector('.genesis-hero');
    var content = hero && hero.querySelector('.genesis-hero-content');
    var title = document.getElementById('genesis-title');
    if (!hero || !content || !title || reduceMotion) return;

    // Split the title into letters (screen readers still get the word)
    var word = title.textContent.trim();
    title.setAttribute('aria-label', word);
    title.textContent = '';
    word.split('').forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'hl';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--i', i);
      span.textContent = ch;
      title.appendChild(span);
    });

    // Stagger the rest of the hero around the title
    var kids = Array.prototype.slice.call(content.children);
    var t = kids.indexOf(title);
    kids.forEach(function (el, i) {
      if (el === title || el.classList.contains('genesis-meta-grid')) return;
      var d = i < t ? i * 120 : 650 + (i - t - 1) * 100;
      if (i === kids.length - 1) d = 1300;
      el.style.setProperty('--d', d + 'ms');
    });
    content.querySelectorAll('.genesis-meta-item').forEach(function (el, j) {
      el.style.setProperty('--d', (850 + j * 120) + 'ms');
    });

    // Ripple rings behind the title
    var pulse = document.createElement('div');
    pulse.className = 'hero-pulse';
    pulse.setAttribute('aria-hidden', 'true');
    pulse.innerHTML = '<span></span><span></span><span></span>';
    hero.insertBefore(pulse, hero.querySelector('.container'));

    hero.classList.add('is-prep');

    var started = false;
    function play() {
      if (started) return;
      started = true;
      hero.classList.remove('is-prep');
      hero.classList.add('is-playing', 'is-live');
      setTimeout(function () {
        hero.classList.remove('is-playing');
        hero.classList.add('is-idle');
      }, 3300);
    }

    var loader = document.getElementById('page-loader');
    if (!loader || loader.classList.contains('loaded') || !document.body.contains(loader)) {
      setTimeout(play, 100);
    } else {
      new MutationObserver(function (m, obs) {
        if (loader.classList.contains('loaded')) { obs.disconnect(); play(); }
      }).observe(loader, { attributes: true, attributeFilter: ['class'] });
      setTimeout(play, 3000); // safety net
    }
  }

  ready(function () {
    initIntro();
    initHero();
    initRotator();
    initCardSpotlight();
    initFlow();
    initGains();
    initRail();
    initLightbox();
  });
})();
