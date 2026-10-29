/* Нет, это ненормально — эффекты и плеер */
(function () {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Неразрывные пробелы ---------- */

  function typograph(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      let t = node.nodeValue;
      for (let i = 0; i < 2; i++) {
        t = t.replace(/(^|[\s(«„])([а-яёА-ЯЁ]{1,2})\s+/g, '$1$2 ');
      }
      t = t.replace(/\s+—/g, ' —').replace(/(\d)\s+(?=[а-яё])/g, '$1 ');
      node.nodeValue = t;
    }
  }
  $$('[data-typo]').forEach(typograph);

  /* ---------- Рваные края ---------- */

  function tear(el) {
    const edges = (el.dataset.tear || '').split(/\s+/);
    const amp = parseFloat(el.dataset.amp || '10');
    const has = (e) => edges.includes(e);
    const w = el.offsetWidth || 1000;
    const h = el.offsetHeight || 600;
    const step = Math.max(9, amp * 1.5);
    const nx = Math.max(8, Math.round(w / step));
    const ny = Math.max(8, Math.round(h / step));
    let v = amp / 2;
    const walk = () => {
      v = clamp(v + (Math.random() - 0.5) * amp * 1.1, 0, amp);
      return v.toFixed(1);
    };
    const pts = [];
    for (let i = 0; i <= nx; i++) pts.push(`${(i / nx * 100).toFixed(2)}% ${has('top') ? walk() : 0}px`);
    if (has('right')) for (let i = 1; i < ny; i++) pts.push(`calc(100% - ${walk()}px) ${(i / ny * 100).toFixed(2)}%`);
    for (let i = nx; i >= 0; i--) pts.push(`${(i / nx * 100).toFixed(2)}% calc(100% - ${has('bottom') ? walk() : 0}px)`);
    if (has('left')) for (let i = ny - 1; i > 0; i--) pts.push(`${walk()}px ${(i / ny * 100).toFixed(2)}%`);
    el.style.clipPath = `polygon(${pts.join(',')})`;
  }
  $$('[data-tear]').forEach(tear);

  /* ---------- Глаза в логотипе ---------- */

  const EYES = [
    { cx: 14.4, cy: 18.3, travel: 4.2, px: 10.71, py: 17.1 },
    { cx: 100.6, cy: 7.9, travel: 3.4, px: 102.03, py: 5.99 },
    { cx: 148.4, cy: 43.3, travel: 2.4, px: 146.3, py: 43.2 },
    { cx: 9.3, cy: 57.6, travel: 1.4, px: 8.92, py: 56.04 },
  ];
  const logos = $$('.nen-logo').map((svg) => ({
    svg,
    pupils: $$('.nen-logo__pupil', svg),
    cur: EYES.map((e) => ({ x: e.px - e.cx, y: e.py - e.cy })),
  }));
  let pointer = null;
  let wander = { x: -1, y: -0.2 };
  let scrollVel = 0;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') pointer = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer = null; });

  if (!reduced) {
    setInterval(() => {
      const a = rand(0, Math.PI * 2);
      wander = { x: Math.cos(a), y: Math.sin(a) * 0.8 };
    }, 1800);
  }

  function updateLogos() {
    for (const logo of logos) {
      const r = logo.svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const scale = r.width / 175;
      EYES.forEach((eye, i) => {
        let ox, oy;
        if (pointer) {
          const dx = (pointer.x - r.left) / scale - eye.cx;
          const dy = (pointer.y - r.top) / scale - eye.cy;
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 30) * eye.travel;
          ox = dx / d * k;
          oy = dy / d * k;
        } else if (Math.abs(scrollVel) > 0.25) {
          // Без мыши глаза смотрят туда, куда листают
          ox = 0;
          oy = Math.sign(scrollVel) * eye.travel;
        } else {
          ox = wander.x * eye.travel * 0.85;
          oy = wander.y * eye.travel * 0.85;
        }
        const c = logo.cur[i];
        c.x += (ox - c.x) * 0.18;
        c.y += (oy - c.y) * 0.18;
        logo.pupils[i].setAttribute('transform',
          `translate(${(eye.cx + c.x - eye.px).toFixed(2)} ${(eye.cy + c.y - eye.py).toFixed(2)})`);
      });
    }
  }

  if (!reduced) {
    logos.forEach((logo) => {
      const blink = () => {
        logo.svg.classList.add('is-blinking');
        setTimeout(() => logo.svg.classList.remove('is-blinking'), 240);
        setTimeout(blink, rand(2600, 7000));
      };
      setTimeout(blink, rand(1500, 4000));
    });
  }

  /* ---------- Мигающее «не» ---------- */

  const neon = $('[data-neon]');
  if (neon) {
    if (reduced) {
      neon.classList.remove('is-off');
    } else {
      const run = (steps, done) => {
        let i = 0;
        (function next() {
          if (i >= steps.length) return done && done();
          const [on, ms] = steps[i++];
          neon.classList.toggle('is-off', !on);
          setTimeout(next, ms);
        })();
      };
      const schedule = () => setTimeout(() => {
        const long = Math.random() < 0.35;
        run(long
          ? [[0, 60], [1, 50], [0, rand(1400, 2400)], [1, 70], [0, 110], [1, 40], [0, 70], [1, 0]]
          : [[0, 45], [1, 90], [0, 35], [1, 0]], schedule);
      }, rand(2600, 7000));
      setTimeout(() => run([[1, 60], [0, 140], [1, 40], [0, 320], [1, 0]], schedule), 1300);
    }
  }

  /* ---------- Коллаж на первом экране ---------- */

  const hero = $('[data-hero]');
  const board = $('[data-board]');
  const layers = board ? $$('[data-depth]', board).map((el) => ({ el, d: parseFloat(el.dataset.depth), x: 0, y: 0, sr: 0, cx: 0, cy: 0 })) : [];
  const rip = board && $('[data-rip]', board);
  let ripAmount = 0;
  let stagePointer = null;
  let heroVisible = true;

  // Где деталь лежит на доске: от середины коллаж и разлетается
  function measureLayers() {
    const bw = board.clientWidth || 1;
    const bh = board.clientHeight || 1;
    layers.forEach((L) => {
      L.cx = (L.el.offsetLeft + L.el.offsetWidth / 2) / bw - 0.5;
      L.cy = (L.el.offsetTop + L.el.offsetHeight / 2) / bh - 0.5;
    });
  }

  if (hero && board && !reduced) {
    measureLayers();
    window.addEventListener('resize', measureLayers);
    window.addEventListener('load', measureLayers);
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      stagePointer = { nx: (e.clientX - r.left) / r.width - 0.5, ny: (e.clientY - r.top) / r.height - 0.5, cx: e.clientX, cy: e.clientY };
    });
    hero.addEventListener('pointerleave', () => { stagePointer = null; });
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe(hero);
  }

  function updateStage(now) {
    if (!heroVisible) return;
    const sy = Math.min(scrollY, innerHeight * 1.5);
    const k = sy / innerHeight;
    const t = now / 1000;
    for (const L of layers) {
      let tx, ty;
      if (stagePointer) {
        tx = -stagePointer.nx * 46 * L.d;
        ty = -stagePointer.ny * 30 * L.d;
      } else {
        // Без мыши детали чуть дышат
        tx = Math.sin(t * 0.6 + L.d * 7) * 6 * L.d;
        ty = Math.cos(t * 0.5 + L.d * 5) * 5 * L.d;
      }
      // При прокрутке коллаж разлетается от середины, ближние детали быстрее
      tx += L.cx * k * 320 * (0.4 + L.d);
      ty += L.cy * k * 160 * (0.4 + L.d) - sy * L.d * 0.35;
      const sr = (L.cx < 0 ? -1 : 1) * k * 22 * L.d;
      L.x += (tx - L.x) * 0.1;
      L.y += (ty - L.y) * 0.1;
      L.sr += (sr - L.sr) * 0.1;
      L.el.style.translate = `${L.x.toFixed(1)}px ${L.y.toFixed(1)}px`;
      L.el.style.setProperty('--sr', L.sr.toFixed(2) + 'deg');
    }
    // Снимок братьев Менендес рвется пополам
    if (rip) {
      ripAmount += (clamp(k * 2.2, 0, 1) - ripAmount) * 0.12;
      rip.style.setProperty('--tear', ripAmount.toFixed(3));
    }
  }

  /* ---------- Эффекты по прокрутке ---------- */

  // Лид разбит на слова, они проступают по мере прокрутки
  const scrub = $('[data-scrub]');
  let words = [];
  let litCount = -1;
  if (scrub) {
    const walker = document.createTreeWalker(scrub, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/( +)/).forEach((part) => {
        if (!part) return;
        if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    words = $$('.w', scrub);
    if (reduced) words.forEach((w) => w.classList.add('is-lit'));
  }

  const develops = $$('[data-develop]').map((el) => ({ el, img: $('img', el), done: false }));
  const eps = $$('.ep').map((el, i) => ({ el, cover: $('.ep__cover', el), ghost: $('.ep__ghost', el), dir: i % 2 ? -1 : 1, armed: true }));
  const roomHand = $('[data-rise]');
  if (reduced && roomHand) roomHand.style.setProperty('--rise', '0%');

  function updateScrollFx() {
    const vh = innerHeight;
    if (scrub) {
      const r = scrub.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.3), 0, 1);
        const n = Math.round(p * words.length * 1.08);
        if (n !== litCount) {
          litCount = n;
          words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
        }
      }
    }
    // Портреты проявляются из негатива, как пленка
    for (const D of develops) {
      const r = D.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const p = clamp((vh * 0.95 - r.top) / (vh * 0.5), 0, 1);
      D.img.style.setProperty('--neg', clamp(1 - p * 1.3, 0, 1).toFixed(3));
      D.img.style.setProperty('--dev', (0.35 + 0.65 * p).toFixed(3));
      if (p >= 1 && !D.done) {
        D.done = true;
        D.el.classList.add('is-flash');
        setTimeout(() => D.el.classList.remove('is-flash'), 600);
      } else if (p < 0.3) {
        D.done = false;
      }
    }
    // Обложки ложатся на стол и вспыхивают, как кадр в проекторе
    for (const E of eps) {
      const r = E.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const cc = r.top + E.cover.offsetTop + E.cover.offsetHeight / 2;
      const d = clamp((cc - vh / 2) / vh, -1, 1);
      E.cover.style.setProperty('--sy', (d * 60).toFixed(1) + 'px');
      E.cover.style.setProperty('--srot', (d * 10 * E.dir).toFixed(2) + 'deg');
      E.cover.style.setProperty('--ss', (1 - Math.abs(d) * 0.1).toFixed(3));
      E.ghost.style.setProperty('--gy', (d * -150).toFixed(1) + 'px');
      if (E.armed && Math.abs(d) < 0.12) {
        E.armed = false;
        E.cover.classList.remove('is-flicker');
        void E.cover.offsetWidth;
        E.cover.classList.add('is-flicker');
      } else if (Math.abs(d) > 0.45) {
        E.armed = true;
      }
    }
    // Из темноты поднимается рука и показывает на плашку
    if (roomHand && room) {
      const r = room.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp((vh - r.top) / (r.height * 0.85), 0, 1);
        roomHand.style.setProperty('--rise', ((1 - p * (2 - p)) * 100).toFixed(1) + '%');
      }
    }
  }

  /* ---------- Появление при прокрутке ---------- */

  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealer.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach((el) => revealer.observe(el));

  /* ---------- Шапка и параллакс ---------- */

  const topbar = $('[data-topbar]');
  const parallax = $$('[data-parallax]').map((el) => ({ el, k: parseFloat(el.dataset.parallax), box: el.closest('section') }));

  const tabbar = $('[data-tabbar]');
  const tabs = $$('[data-tab]');
  let lastY = scrollY;
  let lastT = performance.now();
  let glitchTimer;

  function onScroll() {
    topbar.classList.toggle('is-solid', scrollY > 40);
    const now = performance.now();
    scrollVel = (scrollY - lastY) / Math.max(1, now - lastT);
    lastY = scrollY;
    lastT = now;

    // Таб-бар появляется, когда первый экран уехал, и подсвечивает выпуск на экране
    const on = scrollY > (hero ? hero.offsetHeight * 0.55 : 300);
    tabbar.classList.toggle('is-on', on);
    document.body.classList.toggle('has-tabbar', on);
    const mid = innerHeight / 2;
    let active = '';
    for (const E of eps) {
      const r = E.el.getBoundingClientRect();
      if (r.top < mid && r.bottom > mid) { active = E.el.id; break; }
    }
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === active));

    if (reduced) return;
    // Резкая прокрутка — помеха, как на старой кассете
    if (Math.abs(scrollVel) > 3.5) {
      document.body.classList.add('is-glitch');
      clearTimeout(glitchTimer);
      glitchTimer = setTimeout(() => document.body.classList.remove('is-glitch'), 170);
    }
    for (const p of parallax) {
      const r = p.box.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      p.el.style.transform = `translate3d(0, ${((r.top - innerHeight * 0.2) * p.k).toFixed(1)}px, 0)`;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Наклон обложек ---------- */

  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Тост ---------- */

  const toastEl = $('[data-toast]');
  let toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  }

  /* ---------- Плеер ---------- */

  const audio = new Audio();
  audio.preload = 'none';
  const player = $('[data-player]');
  const pCover = $('.player__cover', player);
  const pNum = $('[data-player-num]');
  const pTitle = $('[data-player-title]');
  const pToggle = $('[data-player-toggle]');
  const pSeek = $('[data-player-seek]');
  const pTime = $('[data-player-time]');
  const playButtons = $$('[data-play]');
  let current = null;
  let seeking = false;

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (t) => {
    if (!isFinite(t)) return '0:00';
    t = Math.floor(t);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    return (h ? `${h}:${pad(m)}` : `${m}`) + `:${pad(t % 60)}`;
  };

  function setPlayingUI(on) {
    playButtons.forEach((b) => b.classList.toggle('is-playing', on && b === current));
    if (current) $('.play__label', current).textContent = on ? 'Пауза' : 'Слушать';
    player.classList.toggle('is-playing', on);
    const epId = current && current.closest('.ep') ? current.closest('.ep').id : '';
    tabs.forEach((t) => t.classList.toggle('is-playing', on && t.dataset.tab === epId));
    pToggle.setAttribute('aria-label', on ? 'Пауза' : 'Слушать');
  }

  playButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (current === btn && audio.src) {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
        return;
      }
      if (current) $('.play__label', current).textContent = 'Слушать';
      current = btn;
      audio.src = btn.dataset.src;
      pCover.src = btn.dataset.cover;
      pNum.textContent = btn.dataset.num;
      pTitle.textContent = btn.dataset.title;
      pSeek.value = 0;
      pSeek.style.setProperty('--p', '0%');
      pTime.textContent = '0:00';
      if ('mediaSession' in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: btn.dataset.title,
          artist: 'Нет, это ненормально',
          album: 'НЭН',
          artwork: [{ src: btn.dataset.cover, sizes: '1000x1000', type: 'image/jpeg' }],
        });
      }
      audio.play().catch(() => {});
    });
  });

  audio.addEventListener('playing', () => {
    player.hidden = false;
    setPlayingUI(true);
  });
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('ended', () => setPlayingUI(false));
  audio.addEventListener('error', () => {
    if (!audio.getAttribute('src')) return;
    setPlayingUI(false);
    audio.removeAttribute('src');
    current = null;
    player.hidden = true;
    toast('Не получилось включить выпуск. Попробуйте еще раз');
  });
  audio.addEventListener('timeupdate', () => {
    if (seeking || !audio.duration) return;
    const p = audio.currentTime / audio.duration;
    pSeek.value = Math.round(p * 1000);
    pSeek.style.setProperty('--p', (p * 100).toFixed(2) + '%');
    pTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  });
  pSeek.addEventListener('input', () => {
    seeking = true;
    pSeek.style.setProperty('--p', pSeek.value / 10 + '%');
    if (audio.duration) pTime.textContent = `${fmt(pSeek.value / 1000 * audio.duration)} / ${fmt(audio.duration)}`;
  });
  pSeek.addEventListener('change', () => {
    if (audio.duration) audio.currentTime = pSeek.value / 1000 * audio.duration;
    seeking = false;
  });
  pToggle.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
  $('[data-player-close]').addEventListener('click', () => {
    audio.pause();
    player.hidden = true;
  });

  /* ---------- Тёмная комната: глаза и замок ---------- */

  const room = $('[data-room]');
  const eyesBox = $('[data-eyes]');
  const lockBtn = $('[data-lock]');
  let pairs = [];
  let roomPointer = null;
  let roomVisible = false;
  let locked = false;
  let builtWidth = 0;

  function buildEyes() {
    builtWidth = room.clientWidth;
    eyesBox.innerHTML = '';
    pairs = [];
    const W = room.clientWidth;
    const H = room.clientHeight;
    const rr = room.getBoundingClientRect();
    const ir = $('.room__inner', room).getBoundingClientRect();
    const avoid = { l: ir.left - rr.left - 24, r: ir.right - rr.left + 24, t: ir.top - rr.top - 28, b: ir.bottom - rr.top + 28 };
    const n = clamp(Math.round(W * H / 26000), 12, 44);
    let tries = 0;
    while (pairs.length < n && tries++ < n * 60) {
      const x = rand(28, W - 28);
      const y = rand(28, H - 28);
      if (x > avoid.l && x < avoid.r && y > avoid.t && y < avoid.b) continue;
      if (pairs.some((p) => Math.hypot(p.x - x, p.y - y) < 74)) continue;
      const s = rand(0.55, 1.45);
      const el = document.createElement('span');
      el.className = 'pair';
      el.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--s:${s.toFixed(2)};--o:${(0.3 + s * 0.48).toFixed(2)};` +
        `--rot:${rand(-9, 9).toFixed(1)}deg;--d:${rand(-9, 0).toFixed(2)}s;--bd:${rand(4, 10).toFixed(1)}s`;
      el.innerHTML = '<span class="pair__lids"><span class="eye"><i></i></span><span class="eye"><i></i></span></span>';
      eyesBox.appendChild(el);
      pairs.push({ el, x, y, s, shut: false, reopen: 0, wake: rand(0.08, 0.9) });
    }
  }

  function shut(p, on) {
    p.shut = on;
    p.el.classList.toggle('is-shut', on);
  }

  function updateRoom(now) {
    if (!roomVisible) return;
    const rr = room.getBoundingClientRect();
    const wakeP = reduced ? 1 : clamp((innerHeight - rr.top) / (innerHeight * 0.95), 0, 1);
    for (const p of pairs) {
      // Пока не долистали, часть глаз еще закрыта; если листать обратно, они снова закрываются
      if (wakeP < p.wake) {
        if (!p.shut) shut(p, true);
        p.reopen = 0;
        continue;
      }
      if (roomPointer) {
        const dx = roomPointer.x - p.x;
        const dy = roomPointer.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 160);
        p.el.style.setProperty('--px', (dx / d * 6 * p.s * k).toFixed(1) + 'px');
        p.el.style.setProperty('--py', (dy / d * 1.6 * p.s * k).toFixed(1) + 'px');
        if (d < 150) {
          if (!p.shut) shut(p, true);
          p.reopen = 0;
          continue;
        }
      }
      if (p.shut && !locked) {
        if (!p.reopen) p.reopen = now + rand(500, 1600);
        else if (now > p.reopen) { shut(p, false); p.reopen = 0; }
      }
    }
  }

  if (room) {
    room.addEventListener('pointermove', (e) => {
      const r = room.getBoundingClientRect();
      roomPointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    room.addEventListener('pointerdown', (e) => {
      const r = room.getBoundingClientRect();
      roomPointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (e.pointerType === 'touch') setTimeout(() => { roomPointer = null; }, 1200);
    });
    room.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'touch') roomPointer = null;
      pairs.forEach((p) => { p.el.style.setProperty('--px', '0px'); p.el.style.setProperty('--py', '0px'); });
    });
    new IntersectionObserver(([en]) => { roomVisible = en.isIntersecting; }).observe(room);

    lockBtn.addEventListener('click', () => {
      if (locked) return;
      locked = true;
      lockBtn.classList.add('is-locked');
      lockBtn.setAttribute('aria-pressed', 'true');
      const rr = room.getBoundingClientRect();
      const lr = lockBtn.getBoundingClientRect();
      const lx = lr.left + lr.width / 2 - rr.left;
      const ly = lr.top + lr.height / 2 - rr.top;
      pairs.forEach((p) => {
        setTimeout(() => shut(p, true), Math.hypot(p.x - lx, p.y - ly) * 0.9);
      });
      // Через несколько секунд замок открывается сам
      setTimeout(() => {
        lockBtn.classList.remove('is-locked');
        lockBtn.setAttribute('aria-pressed', 'false');
        locked = false;
        pairs.forEach((p) => { p.reopen = performance.now() + rand(300, 3000); });
      }, 5200);
    });

    const build = () => { if (room.clientWidth !== builtWidth) buildEyes(); };
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 250); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildEyes);
    else window.addEventListener('load', buildEyes);
  }

  /* ---------- Вкладка ---------- */

  const baseTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Проверьте, заперта ли дверь' : baseTitle;
  });

  /* ---------- Цикл анимации ---------- */

  function frame(now) {
    updateLogos();
    scrollVel *= 0.92;
    if (!reduced) {
      updateStage(now);
      updateScrollFx();
    }
    updateRoom(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
