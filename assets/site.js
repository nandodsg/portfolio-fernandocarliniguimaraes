/* Movimento do site. GSAP + ScrollTrigger servidos pelo próprio site. Tudo é progressivo: sem este arquivo a página
   fica inteira e legível (quadro 9); com "reduzir movimento" o conteúdo aparece pronto (quadro 10). */
(function () {
  'use strict';
  var D = document, H = D.documentElement, CFG = window.CFG || {}, EN = window.EN || {};
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  H.classList.remove('no-js'); H.classList.add('js');
  var WN = window.name;
  var RM = WN === 'rm' ? true : WN === 'norm' ? false : (!!CFG.rm || matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = matchMedia('(pointer: fine)').matches;
  var NARROW = function () { return innerWidth < 860; };
  /* texto grande (passo 2 ou 3 do painel de configurações): a seção de projetos parada na altura da tela não comporta o
     texto, então usa o mesmo desenho do celular, que cresce com o texto */
  var BIG = +(H.dataset.ts || 0) >= 2;
  var DESK = !RM && !NARROW() && !BIG;
  H.classList.toggle('rm', RM); H.classList.toggle('js-desk', DESK); H.classList.toggle('fine', FINE);
  var G = window.gsap, ST = window.ScrollTrigger;
  if (G) G.registerPlugin(ST);
  var ESC = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------------- idioma (no site são duas páginas; no mockup troca no lugar) ---------------- */
  var PT = {}, lang = 'pt';
  $$('[data-i18n]').forEach(function (el) { PT[el.dataset.i18n] = el.innerHTML; });
  $$('[data-i18n-aria]').forEach(function (el) { PT[el.dataset.i18nAria] = el.getAttribute('aria-label'); });
  $$('[data-oi]').forEach(function (el) { PT[el.dataset.oi] = el.dataset.origem; });
  var rede = $('[data-rede]'); if (rede) PT.edges = rede.dataset.edges;
  PT.f3x = 'Fechar o capô deste site'; PT.stampx = 'Fechar o capô deste site';
  function T(k) { return lang === 'en' && EN[k] != null ? EN[k] : PT[k]; }
  var RUN = [];
  function applyLang(l) {
    RUN.forEach(function (el) { cancelAnimationFrame(el._raf); el._run = false; }); RUN = [];
    lang = l;
    $$('[data-i18n]').forEach(function (el) { var v = T(el.dataset.i18n); if (v != null) el.innerHTML = v; });
    $$('[data-i18n-aria]').forEach(function (el) { var v = T(el.dataset.i18nAria); if (v != null) el.setAttribute('aria-label', v); });
    $$('[data-oi]').forEach(function (el) { var v = T(el.dataset.oi); if (v != null) el.dataset.origem = v; });
    if (rede) rede.dataset.edges = T('edges');
    H.lang = l === 'en' ? 'en' : 'pt-BR';
    $$('.lang a').forEach(function (a) { if (a.dataset.lang === l) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  if (CFG.lang === 'en') applyLang('en');

  /* ---------------- utilidades: dado que se decifra, letra que vira peça ---------------- */
  var GL = '01#%/<>=+*[]{}$@&';
  function decode(el, ms) {
    if (RM || !el) return;
    ms = ms || 650;
    if (!el._run) el._fin = el.textContent;
    var fin = el._fin, n = fin.length, t0 = performance.now();
    el._run = true; cancelAnimationFrame(el._raf); RUN.push(el);
    (function f(now) {
      var p = Math.min(1, (now - t0) / ms), rev = Math.floor(p * n), out = '';
      for (var i = 0; i < n; i++) { var ch = fin[i]; out += (i < rev || ch === ' ' || ch === '·') ? ch : GL[(Math.random() * GL.length) | 0]; }
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(f); else { el.textContent = fin; el._run = false; }
    })(t0);
  }
  function split(el) {
    var txt = el.textContent.replace(/\s+/g, ' ').trim();
    el.innerHTML = '<span class="sr">' + ESC(txt) + '</span><span aria-hidden="true">' + txt.split(' ').map(function (w) {
      return '<span class="wd">' + Array.from(w).map(function (c) { return '<span class="c' + (c === '!' ? ' bang' : '') + '">' + ESC(c) + '</span>'; }).join('') + '</span>';
    }).join(' ') + '</span>';
    return $$('.c', el);
  }
  function stretchIn(chars, trigger) {
    if (!G || RM || !chars.length) return;
    G.fromTo(chars, { '--w': 62, '--g': 160 }, { '--w': 125, '--g': 800, duration: 1.15, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: trigger, start: 'top 88%', once: true } });
  }

  /* ---------------- 00 · ignição ---------------- */
  var nameEl = $('[data-name]'), chars = [], ready = RM, heroP = 0, mx = -1e4, my = -1e4;
  function setC(c) { c.el.style.setProperty('--w', c.w.toFixed(1)); c.el.style.setProperty('--g', c.g.toFixed(0)); }
  function buildName() {
    var full = nameEl.dataset.name, parts = full.split(' ');
    var rows = NARROW() ? parts : [parts[0], parts.slice(1).join(' ')];
    nameEl.innerHTML = '<span class="sr">' + ESC(full) + '</span>' + rows.map(function (r) {
      return '<span class="rw" aria-hidden="true">' + Array.from(r).map(function (ch) { return ch === ' ' ? '<span class="sp"></span>' : '<span class="c">' + ESC(ch) + '</span>'; }).join('') + '</span>';
    }).join('');
    var avail = nameEl.clientWidth;
    $$('.rw', nameEl).forEach(function (rw) { rw.style.fontSize = '100px'; var w = rw.getBoundingClientRect().width; rw.style.fontSize = (100 * avail / w * 0.995).toFixed(2) + 'px'; });
    chars = $$('.c', nameEl).map(function (el) { return { el: el, w: 125, g: 800 }; });
  }
  function intro() {
    nameEl.style.opacity = 1;
    if (RM || !G) { ready = true; return; }
    chars.forEach(function (c) { c.w = 62; c.g = 150; setC(c); });
    chars.forEach(function (c, i) {
      G.to(c, { w: 125, g: 800, duration: 1.3, ease: 'expo.out', delay: 0.15 + i * 0.038, onUpdate: function () { setC(c); },
        onComplete: function () { if (i === chars.length - 1) ready = true; } });
    });
    G.fromTo('.spec>div', { '--ln': 0 }, { '--ln': 1, duration: 1.1, ease: 'expo.inOut', stagger: 0.09, delay: 0.55 });
    G.from('.spec dd', { opacity: 0, y: 10, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.85 });
    $$('.spec [data-dec]').forEach(function (el, i) { setTimeout(function () { decode(el, 800); }, 950 + i * 140); });
    G.from('.hd,.cue', { opacity: 0, duration: 0.9, delay: 1.1 });
  }
  if (FINE && !RM) {
    nameEl.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; });
    nameEl.addEventListener('pointerleave', function () { mx = my = -1e4; });
  }
  function heroLoop() {
    var hh = nameEl.parentNode.offsetHeight;
    if (ready && !RM && scrollY < hh) {
      var base = 125 - 58 * heroP, gb = 800 - 420 * heroP;
      for (var k = 0; k < chars.length; k++) {
        var c = chars[k], tw = base, tg = gb;
        if (mx > -1e3) {
          var r = c.el.getBoundingClientRect(), d = Math.hypot(mx - (r.left + r.width / 2), (my - (r.top + r.height / 2)) * 1.5);
          var f = Math.max(0, 1 - d / 260), s = f * f * (3 - 2 * f);
          tw = base - (base - 62) * s; tg = gb - (gb - 200) * f;
        }
        if (Math.abs(tw - c.w) > 0.05 || Math.abs(tg - c.g) > 0.5) { c.w += (tw - c.w) * 0.14; c.g += (tg - c.g) * 0.14; setC(c); }
      }
    }
    requestAnimationFrame(heroLoop);
  }

  /* ---------------- topo, medidor, âncoras ---------------- */
  var top = $('[data-top]'), lastY = 0, secs = $$('[data-sec]'), gl = $$('.gauge a');
  function onScroll() {
    var y = scrollY;
    top.classList.toggle('hide', y > lastY && y > 160); lastY = y;
    var mid = innerHeight * 0.45, k = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) k = i; });
    gl.forEach(function (a, i) { a.classList.toggle('on', i === k); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  D.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    if (a.dataset.lang) {
      if (!CFG.mock) return;
      e.preventDefault();
      var l = a.dataset.lang; if (l === lang) return;
      vt(function () { applyLang(l); afterText(); }, function () { return { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'] }; });
      return;
    }
    var h = a.getAttribute('href') || '';
    if (h.charAt(0) !== '#') return;
    var t = D.getElementById(h.slice(1)); if (!t) return;
    e.preventDefault();
    goTo(function () { return t.getBoundingClientRect().top + scrollY; });
  });

  /* Rolagem até um lugar da página (medidor lateral, setas do teclado). A posição de chegada é medida de novo a cada quadro
     (as sanfonas, os pins e as fontes mudam a altura da página no caminho; com a medida do clique a página pousava no lugar
     errado), e enquanto anda nada abre nem fecha sozinho (navBusy). O visitante que gira o mouse, toca ou aperta outra
     tecla interrompe. Movimento reduzido vai direto. */
  var navBusy = false, navRaf = 0;
  function navStop() { if (!navBusy) return; navBusy = false; cancelAnimationFrame(navRaf); sfTick(); }
  function goTo(yFn) {
    cancelAnimationFrame(navRaf);
    var y0 = scrollY, y1 = yFn(), dist = Math.abs(y1 - y0);
    if (RM || dist < 2) { navBusy = false; scrollTo({ top: y1, left: 0, behavior: 'instant' }); sfTick(); return; }
    var dur = Math.min(1500, 450 + Math.sqrt(dist) * 17), t0 = performance.now(); navBusy = true;
    (function f(now) {
      var p = Math.min(1, (now - t0) / dur), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2, yt = yFn();
      scrollTo({ top: Math.round(y0 + (yt - y0) * e), left: 0, behavior: 'instant' });
      if (p < 1) navRaf = requestAnimationFrame(f);
      else { navBusy = false; sfTick(); }
    })(t0);
  }
  ['wheel', 'touchstart', 'mousedown'].forEach(function (ev) { addEventListener(ev, navStop, { passive: true }); });

  /* ---------------- títulos-pistão e linhas das legendas ---------------- */
  var heads = $$('[data-split]');
  function splitHeads() { heads.forEach(function (h) { h._c = split(h); }); }

  /* ---------------- 01 · lente de raio-x ---------------- */
  var fig = $('[data-lens]'), L = { x: 0, y: 0, r: 0, tx: 0, ty: 0, inside: false, touch: -1e5, intro: null, on: false, first: true };
  var mks = $$('.mk', fig), notes = $$('.notas li'), lbl = $('.lens .lbl', fig), lit = [false, false, false];
  var LR = function () { return fig.clientWidth * 0.3; };
  function lensAt(e) { var b = fig.getBoundingClientRect(); L.tx = e.clientX - b.left; L.ty = e.clientY - b.top; }
  fig.addEventListener('pointermove', function (e) { lensAt(e); L.inside = true; if (e.pointerType !== 'mouse') L.touch = performance.now(); });
  fig.addEventListener('pointerdown', function (e) { lensAt(e); L.inside = true; if (e.pointerType !== 'mouse') L.touch = performance.now(); });
  fig.addEventListener('pointerleave', function () { L.inside = false; });
  function lensTick(now) {
    if (L.on && !H.classList.contains('xray')) {
      var W = fig.clientWidth, Hh = fig.clientHeight, cx, cy, tr;
      if (L.intro) { cx = L.intro.x * W; cy = L.intro.y * Hh; tr = L.intro.r * LR(); }
      else if (FINE) { cx = L.tx; cy = L.ty; tr = L.inside ? LR() : 0; }
      else if (now - L.touch < 2500) { cx = L.tx; cy = L.ty; tr = LR() * 0.85; }
      else if (RM) { cx = W * 0.5; cy = Hh * 0.3; tr = LR() * 0.85; }
      else { var t = now / 1000; cx = W * (0.5 + 0.26 * Math.sin(t * 0.55)); cy = Hh * (0.48 + 0.34 * Math.sin(t * 0.37 + 1.2)); tr = LR() * 0.85; }
      var k = RM ? 1 : 0.16;
      if (L.first) { L.x = cx; L.y = cy; L.first = false; }
      L.x += (cx - L.x) * k; L.y += (cy - L.y) * k; L.r += (tr - L.r) * (RM ? 1 : 0.14);
      fig.style.setProperty('--lx', L.x.toFixed(1) + 'px');
      fig.style.setProperty('--ly', L.y.toFixed(1) + 'px');
      fig.style.setProperty('--lr', Math.max(0, L.r).toFixed(1) + 'px');
      fig.style.setProperty('--lo', L.r > 4 ? 1 : 0);
      lbl.textContent = 'x ' + pad3(L.x) + ' · y ' + pad3(L.y);
      mks.forEach(function (m, i) {
        var inside = L.r > 8 && Math.hypot(m.offsetLeft - L.x, m.offsetTop - L.y) < L.r - 4;
        if (inside && !lit[i]) { lit[i] = true; notes[i].classList.add('on', 'found'); decode($(':scope > span', notes[i]), 650); }
        else if (!inside && lit[i]) { lit[i] = false; notes[i].classList.remove('on'); }
      });
    }
    requestAnimationFrame(lensTick);
  }
  function pad3(v) { v = Math.max(0, Math.round(v)); return (v < 100 ? '0' : '') + (v < 10 ? '0' : '') + v; }
  if ('IntersectionObserver' in window) {
    var seen = false;
    new IntersectionObserver(function (es) {
      L.on = es[0].isIntersecting;
      if (L.on && !seen && es[0].intersectionRatio > 0.45 && !RM && G) {
        seen = true; L.intro = { x: 0.4, y: 0.08, r: 0 }; /* cabeça → olho → peito da foto escolhida (marcas 01–03) */
        G.timeline({ delay: 0.2, onComplete: function () { L.intro = null; } })
          .to(L.intro, { r: 0.85, duration: 0.45, ease: 'power2.out' })
          .to(L.intro, { x: 0.52, y: 0.32, duration: 1.1, ease: 'power2.inOut' }, '<')
          .to(L.intro, { x: 0.62, y: 0.74, duration: 0.9, ease: 'power2.inOut' })
          .to(L.intro, { r: 0, duration: 0.35, ease: 'power2.in' });
      }
    }, { threshold: [0, 0.5] }).observe(fig);
  } else L.on = true;

  /* ---------------- máquinas dos projetos (a amostra aprovada: direcoes/projetos-maquinas.html, sem mudar o desenho) ---------------- */
  var MACH = (function () {
    var NS = 'http://www.w3.org/2000/svg', RED = '#FF3D1F', BONE = '#ECE7DC', BONE2 = '#C9C3B6', BG = '#0C0C0B', MT = [];
    if (G) G.config({ nullTargetWarn: false }); /* a amostra aprovada passa listas vazias pra alguns tweens (linha do gold set sem divergência) */
    function ML(s) { return lang === 'en' && EN.mach && EN.mach[s] != null ? EN.mach[s] : s; }
    function S(tag, a, p) { var e = D.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function TX(p, x, y, s, cls, anchor, nt) {
      var t = S('text', { x: x, y: y, 'class': cls || 'lbl' }, p); if (anchor) t.setAttribute('text-anchor', anchor);
      t.textContent = nt ? s : ML(s); if (!nt) { t._k = s; MT.push(t); } return t;
    }
    function clamp(v) { return Math.max(0, Math.min(1, v)); }
    /* texto que se troca de forma determinística (vai e volta com a rolagem) */
    function morph(t, a, b, p) {
      var n = Math.max(a.length, b.length), s = '';
      for (var i = 0; i < n; i++) {
        var th = (i + 1) / n;
        if (p >= th) s += b[i] || '';
        else if (p > 0 && p >= th - 0.3) s += (b[i] === ' ' ? ' ' : GL[(i * 7 + Math.floor(p * 40)) % GL.length]);
        else s += a[i] || '';
      }
      t.textContent = s;
    }
    /* um ponto que viaja por uma lista de pontos, com velocidade constante */
    function travel(tl, el, pts, t, v) {
      tl.set(el, { x: pts[0][0], y: pts[0][1], autoAlpha: 1 }, t);
      for (var i = 1; i < pts.length; i++) {
        var dur = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / v;
        tl.to(el, { x: pts[i][0], y: pts[i][1], duration: dur, ease: 'none' }, t); t += dur;
      }
      return t;
    }
    function relabel() { MT.forEach(function (t) { t.textContent = ML(t._k); }); }
  /* =============================== A29 · banco de calibração =============================== */
  function so(svg) {
    var tl = G.timeline({ defaults: { ease: 'power2.inOut' } }), M = [];
    var X = function (i) { return 100 + i * 70; }, CX = function (i) { return 127 + i * 70; };
    var cardsG = S('g', {}, svg);
    // esteira
    S('line', { x1: 92, y1: 182, x2: 600, y2: 182, 'class': 'ln' }, svg);
    var run = S('line', { x1: 92, y1: 188, x2: 600, y2: 188, 'class': 'run' }, svg);
    // BigQuery: o cilindro de onde as perguntas saem
    var cyl = S('g', {}, svg);
    S('path', { d: 'M22 118v52a32 9 0 0 0 64 0v-52', 'class': 'st' }, cyl);
    S('ellipse', { cx: 54, cy: 118, rx: 32, ry: 9, 'class': 'st' }, cyl);
    S('path', { d: 'M22 136a32 9 0 0 0 64 0M22 154a32 9 0 0 0 64 0', 'class': 'st2' }, cyl);
    TX(cyl, 54, 204, 'BIGQUERY', 'lbl b', 'middle');
    // perguntas
    var cards = [];
    for (var i = 0; i < 7; i++) {
      var g = S('g', {}, cardsG);
      var r = S('rect', { x: 0, y: 0, width: 54, height: 44, 'class': 'card' }, g);
      S('rect', { x: 8, y: 10, width: 28, height: 3, 'class': 'bar' }, g);
      S('rect', { x: 8, y: 18, width: 38, height: 3, 'class': 'bar' }, g);
      S('rect', { x: 8, y: 26, width: 22, height: 3, 'class': 'bar' }, g);
      var ck = S('path', { d: 'M38 9l4 4 7-7', 'class': 'ck' }, g);
      var grid = S('path', { d: 'M0 34H54M18 34V44M36 34V44', 'class': 'gridl' }, g);
      var und = S('rect', { x: 0, y: 42, width: 54, height: 2, fill: RED }, g);
      G.set(g, { x: 30, y: 134, autoAlpha: 0 }); G.set([ck, grid, und], { autoAlpha: 0 });
      cards.push({ g: g, r: r, ck: ck, grid: grid, und: und });
    }
    // 01 · BigQuery
    M.push(0);
    tl.from(cyl, { autoAlpha: 0, y: 12, duration: 0.5 }, 0);
    cards.forEach(function (c, i) { tl.to(c.g, { x: X(i), autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 0.45 + (6 - i) * 0.17); });

    // 02 · dbt: o pórtico passa por cima da fila e confere cada pergunta
    var gan = S('g', {}, svg);
    S('rect', { x: 0, y: 0, width: 64, height: 16, 'class': 'beam' }, gan);
    TX(gan, 32, 12, 'DBT', 'lbl dk', 'middle');
    S('line', { x1: 4, y1: 16, x2: 4, y2: 90, 'class': 'post' }, gan);
    S('line', { x1: 60, y1: 16, x2: 60, y2: 90, 'class': 'post' }, gan);
    var leds = [0, 1, 2].map(function (k) { return S('circle', { cx: 18 + k * 14, cy: -9, r: 3.4, 'class': 'led' }, gan); });
    TX(gan, 32, -20, 'TESTES', 'lbl sm', 'middle');
    G.set(gan, { x: -90, y: 104, autoAlpha: 0 }); G.set(leds, { fill: 'rgba(255,61,31,0)' });
    var t0 = tl.duration() + 0.2, dur = 3, A = -90, B = 640; M.push(t0);
    tl.set(gan, { autoAlpha: 1 }, t0).to(gan, { x: B, duration: dur, ease: 'none' }, t0);
    cards.forEach(function (c, i) {
      var tp = t0 + dur * ((X(i) - 5) - A) / (B - A);
      tl.to(leds, { fill: RED, duration: 0.05, stagger: 0.04, ease: 'none' }, tp)
        .to(leds, { fill: 'rgba(255,61,31,0)', duration: 0.18, ease: 'none' }, tp + 0.3)
        .fromTo(c.ck, { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, tp + 0.12)
        .to(c.r, { stroke: BONE2, duration: 0.2 }, tp);
    });
    tl.set(gan, { autoAlpha: 0 });

    // 03 · MetricFlow: a camada semântica desce sobre a fila e trava
    var pl = S('g', {}, svg);
    S('rect', { x: 90, y: 124, width: 494, height: 62, 'class': 'plateL' }, pl);
    S('rect', { x: 90, y: 107, width: 214, height: 17, 'class': 'tab' }, pl);
    TX(pl, 98, 119, 'METRICFLOW · CAMADA SEMÂNTICA', 'lbl dk');
    var brk = [['M90 136V124H102'], ['M572 124H584V136'], ['M584 174V186H572'], ['M102 186H90V174']].map(function (d) { return S('path', { d: d[0], 'class': 'brk' }, pl); });
    G.set(pl, { y: -70, autoAlpha: 0 });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to(pl, { autoAlpha: 1, duration: 0.3 }, t0).to(pl, { y: 0, duration: 1.3, ease: 'power3.inOut' }, t0)
      .fromTo(brk, { scale: 2, autoAlpha: 0, transformOrigin: '50% 50%' }, { scale: 1, autoAlpha: 1, duration: 0.45, stagger: 0.06, ease: 'back.out(2)' }, t0 + 1.15)
      .to(cards.map(function (c) { return c.grid; }), { autoAlpha: 1, duration: 0.3, stagger: 0.07 }, t0 + 1.4)
      .to(cards.map(function (c) { return c.und; }), { autoAlpha: 1, duration: 0.3, stagger: 0.07 }, t0 + 1.5);

    // 04 · AI Gateway: o cabeçote liga, o cabo traz a chamada e o medidor de orçamento acorda
    var head = S('g', {}, svg);
    S('rect', { x: 92, y: 208, width: 490, height: 22, 'class': 'head' }, head);
    TX(head, 100, 223, 'LLM · ROTULAGEM', 'lbl b');
    cards.forEach(function (c, i) { S('path', { d: 'M' + (CX(i) - 6) + ' 230h12l-6 8z', 'class': 'noz' }, head); });
    var scanH = S('rect', { x: 92, y: 206, width: 3, height: 26, fill: RED, 'class': 'glow' }, svg);
    G.set(head, { autoAlpha: 0.22 }); G.set(scanH, { autoAlpha: 0 });
    var gw = S('g', {}, svg);
    S('rect', { x: 612, y: 116, width: 98, height: 44, 'class': 'st' }, gw);
    TX(gw, 661, 134, 'VERCEL', 'lbl b', 'middle'); TX(gw, 661, 148, 'AI GATEWAY', 'lbl b', 'middle');
    var cab = S('path', { d: 'M661 160V219H582', 'class': 'cab drw', pathLength: 1 }, svg);
    var flow = S('path', { d: 'M661 160V219H582', 'class': 'flow' }, svg);
    var gg = S('g', {}, svg);
    S('path', { d: 'M621 300A40 40 0 0 1 701 300', 'class': 'arc' }, gg);
    var lp = 0.78, lx = 661 - 40 * Math.cos(lp * Math.PI), ly = 300 - 40 * Math.sin(lp * Math.PI);
    S('path', { d: 'M' + lx.toFixed(1) + ' ' + ly.toFixed(1) + 'A40 40 0 0 1 701 300', 'class': 'arcR' }, gg);
    for (var k = 0; k <= 10; k++) { var a = Math.PI * k / 10, c1 = Math.cos(a), s1 = Math.sin(a); S('line', { x1: 661 - 33 * c1, y1: 300 - 33 * s1, x2: 661 - 29 * c1, y2: 300 - 29 * s1, 'class': 'tick' }, gg); }
    var ndl = S('line', { x1: 661, y1: 300, x2: 629, y2: 300, 'class': 'ndl' }, gg);
    S('circle', { cx: 661, cy: 300, r: 4, 'class': 'piv' }, gg);
    TX(gg, 661, 320, 'ORÇAMENTO', 'lbl', 'middle'); TX(gg, 661, 332, 'POR EXECUÇÃO', 'lbl', 'middle');
    G.set([gw, gg, flow], { autoAlpha: 0 }); G.set(cab, { strokeDashoffset: 1 });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to(gw, { autoAlpha: 1, duration: 0.4 }, t0)
      .to(cab, { strokeDashoffset: 0, duration: 0.8 }, t0 + 0.25)
      .to(head, { autoAlpha: 1, duration: 0.4 }, t0 + 0.95)
      .to(flow, { autoAlpha: 1, duration: 0.2 }, t0 + 0.95)
      .to(gg, { autoAlpha: 1, duration: 0.4 }, t0 + 0.6)
      .fromTo(ndl, { rotation: 0, svgOrigin: '661 300' }, { rotation: 0.3 * 180, svgOrigin: '661 300', duration: 1, ease: 'back.out(2)' }, t0 + 1);

    // 05 · LLM + gold set: rótulos caem na bancada, três modelos contra a referência, o paquímetro escolhe
    var rows = [{ n: 'GOLD SET', y: 300, v: [1, 0, 1, 1, 0, 1, 0] }, { n: 'MODELO A', y: 352, v: [1, 1, 1, 0, 0, 1, 1] },
                { n: 'MODELO B', y: 398, v: [1, 0, 1, 1, 0, 1, 1] }, { n: 'MODELO C', y: 444, v: [0, 0, 1, 1, 1, 0, 0] }];
    var dv = S('line', { x1: 20, y1: 326, x2: 566, y2: 326, 'class': 'dv' }, svg);
    rows.forEach(function (row, r) {
      row.g = S('g', {}, svg);
      row.lb = TX(row.g, 20, row.y + 4, row.n, r ? 'lbl b' : 'lbl big');
      if (!r) row.sub = TX(row.g, 20, row.y + 17, 'REVISADO À MÃO', 'lbl sm');
      row.ch = row.v.map(function (v, i) { return S('rect', { x: CX(i) - 9, y: row.y - 9, width: 18, height: 18, 'class': v ? 'chipF' : 'chipO' }, row.g); });
      row.xm = row.v.map(function (v, i) { if (!r || v === rows[0].v[i]) return null; return S('path', { d: 'M' + (CX(i) - 6) + ' ' + (row.y - 6) + 'l12 12m0 -12l-12 12', 'class': 'xm' }, row.g); });
      G.set(row.ch, { autoAlpha: 0 }); G.set(row.lb, { autoAlpha: 0 }); if (row.sub) G.set(row.sub, { autoAlpha: 0 });
      G.set(row.xm.filter(Boolean), { autoAlpha: 0 });
    });
    G.set(dv, { autoAlpha: 0 });
    var cal = S('g', {}, svg);
    S('path', { d: 'M114 -17h-8v34h8', 'class': 'brk' }, cal);
    S('path', { d: 'M558 -17h8v34h-8', 'class': 'brk' }, cal);
    S('line', { x1: 106, y1: 0, x2: 96, y2: 0, 'class': 'brk' }, cal);
    var calL = S('g', {}, cal);
    TX(calL, 574, -2, '◀ ESCOLHIDO', 'lbl r'); TX(calL, 574, 11, 'POR CONCORDÂNCIA', 'lbl r');
    G.set(cal, { y: 352, autoAlpha: 0 }); G.set(calL, { autoAlpha: 0 });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to([rows[0].lb, rows[0].sub, dv], { autoAlpha: 1, duration: 0.3 }, t0)
      .to(rows[0].ch, { autoAlpha: 1, duration: 0.2, stagger: 0.06 }, t0 + 0.1);
    var tr = t0 + 0.7;
    [1, 2, 3].forEach(function (r) {
      var row = rows[r];
      tl.to(row.lb, { autoAlpha: 1, duration: 0.2 }, tr)
        .fromTo(scanH, { x: 0, autoAlpha: 1 }, { x: 487, duration: 0.7, ease: 'none', immediateRender: false }, tr)
        .set(scanH, { autoAlpha: 0 }, tr + 0.7);
      row.ch.forEach(function (ch, i) { tl.fromTo(ch, { y: 236 - row.y, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.in' }, tr + i * 0.1); });
      tl.to(ndl, { rotation: (0.3 + r * 0.14) * 180, duration: 0.5, ease: 'back.out(2)' }, tr + 0.2);
      tr += 1.05;
    });
    // as divergências acendem, linha por linha
    [1, 2, 3].forEach(function (r) {
      var row = rows[r];
      row.xm.forEach(function (x, i) { if (x) tl.to(row.ch[i], { stroke: RED, fill: row.v[i] ? RED : BG, duration: 0.15 }, tr).fromTo(x, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, tr); });
      tr += 0.35;
    });
    tl.to(cal, { autoAlpha: 1, duration: 0.2 }, tr)
      .to(cal, { y: 398, duration: 0.5 }, tr + 0.35)
      .to(cal, { y: 444, duration: 0.5 }, tr + 1)
      .to(cal, { y: 398, duration: 0.7, ease: 'back.out(2.2)' }, tr + 1.65)
      .to([rows[1].g, rows[3].g], { opacity: 0.28, duration: 0.4 }, tr + 2.2)
      .to(calL, { autoAlpha: 1, duration: 0.3 }, tr + 2.2)
      .to({}, { duration: 0.6 });
    // a esteira e o fluxo do cabo correm a máquina inteira
    tl.fromTo(run, { strokeDashoffset: 0 }, { strokeDashoffset: -260, duration: tl.duration(), ease: 'none' }, 0);
    tl.fromTo(flow, { strokeDashoffset: 0 }, { strokeDashoffset: -120, duration: tl.duration() - M[3], ease: 'none' }, M[3]);
    return { tl: tl, M: M };
  }

  /* =============================== A21 · mesa de cursores =============================== */
  function mz(svg) {
    var tl = G.timeline({ defaults: { ease: 'power2.inOut' } }), M = [];
    var LY = [436, 372, 308, 244, 180], NAMES = ['NOVATO', 'INICIANTE AVANÇADO', 'COMPETENTE', 'PROFICIENTE', 'ESPECIALISTA'];
    var FX = function (f) { return 236 + f * 88; };
    var SV = [3, 2, 4, 3, 1, 2], LD = [2, 1, 3, 3, 2, 3], AG = [2, 2, 3, 3, 2, 3], NX = [3, 2, 3, 3, 2, 4];
    var panel = S('path', { d: 'M36 72H702V490H36Z', 'class': 'panel drw', pathLength: 1 }, svg);
    var rivs = [[48, 84], [690, 84], [48, 478], [690, 478]].map(function (p) { return S('circle', { cx: p[0], cy: p[1], r: 4, 'class': 'riv' }, svg); });
    var hdr = TX(svg, 236, 106, 'COMPETÊNCIAS · SAEM DO CONTEXTO DE CADA TIME', 'lbl');
    // níveis (Dreyfus)
    var lv = LY.map(function (y, l) {
      var g = S('g', {}, svg);
      var ln = S('line', { x1: 196, y1: y, x2: 694, y2: y, 'class': 'lvl' }, g);
      var tx = TX(g, 52, y + 4, NAMES[l], 'lbl b');
      return { ln: ln, tx: tx };
    });
    // trilhos
    var rails = [], letters = [], notches = [];
    for (var f = 0; f < 6; f++) {
      rails.push(S('rect', { x: FX(f) - 3, y: 156, width: 6, height: 296, 'class': 'slot' }, svg));
      letters.push(TX(svg, FX(f), 140, 'abcdef'[f], 'lbl big', 'middle'));
      notches.push(S('path', { d: LY.map(function (y) { return 'M' + (FX(f) - 17) + ' ' + y + 'h9M' + (FX(f) + 8) + ' ' + y + 'h9'; }).join(''), 'class': 'notch' }, svg));
    }
    var polyS = S('polyline', { 'class': 'plS', points: '' }, svg), polyL = S('polyline', { 'class': 'plL', points: '' }, svg);
    var s = [], l = [], kS = [], kL = [];
    for (f = 0; f < 6; f++) {
      s.push({ y: 452 }); l.push({ y: 452 });
      kS.push(S('rect', { x: -17, y: -7, width: 34, height: 14, 'class': 'kS' }, svg));
      var kg = S('g', {}, svg);
      S('rect', { x: -17, y: -7, width: 34, height: 14, 'class': 'kL' }, kg);
      S('line', { x1: -10, y1: 0, x2: 10, y2: 0, stroke: BG, 'stroke-width': 1.5 }, kg);
      kL.push(kg);
    }
    function render() {
      for (var f = 0; f < 6; f++) { kS[f].setAttribute('transform', 'translate(' + FX(f) + ' ' + s[f].y + ')'); kL[f].setAttribute('transform', 'translate(' + FX(f) + ' ' + l[f].y + ')'); }
      polyS.setAttribute('points', s.map(function (o, f) { return FX(f) + ',' + o.y.toFixed(1); }).join(' '));
      polyL.setAttribute('points', l.map(function (o, f) { return FX(f) + ',' + o.y.toFixed(1); }).join(' '));
    }
    render();
    var leg = S('g', {}, svg);
    S('rect', { x: 236, y: 466, width: 14, height: 8, 'class': 'kS' }, leg); TX(leg, 256, 474, 'AUTOAVALIAÇÃO', 'lbl');
    S('rect', { x: 380, y: 466, width: 14, height: 8, 'class': 'kL' }, leg); TX(leg, 400, 474, 'AVALIAÇÃO DO LÍDER', 'lbl');
    G.set(panel, { strokeDashoffset: 1 }); G.set([hdr, leg].concat(rivs, letters, notches), { autoAlpha: 0 });
    G.set(rails, { scaleY: 0, transformOrigin: '50% 0%' });
    G.set(lv.map(function (o) { return o.ln; }), { scaleX: 0, transformOrigin: '0% 50%' }); G.set(lv.map(function (o) { return o.tx; }), { autoAlpha: 0, x: -10 });
    G.set(kS.concat(kL, [polyS, polyL]), { autoAlpha: 0 });

    // 01 · contexto do time: a mesa se desenha e os trilhos descem, um por competência
    M.push(0);
    tl.to(panel, { strokeDashoffset: 0, duration: 1.1 }, 0)
      .to(rivs, { autoAlpha: 1, duration: 0.2, stagger: 0.08 }, 0.8)
      .to(hdr, { autoAlpha: 1, duration: 0.4 }, 0.9)
      .to(rails, { scaleY: 1, duration: 0.7, stagger: 0.14, ease: 'power3.out' }, 1.1)
      .fromTo(letters, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.14 }, 1.3);
    // 02 · competências e níveis: os degraus do Dreyfus atravessam a mesa
    var t0 = tl.duration() + 0.2; M.push(t0);
    tl.to(lv.map(function (o) { return o.ln; }), { scaleX: 1, duration: 0.8, stagger: 0.16, ease: 'power3.out' }, t0)
      .to(lv.map(function (o) { return o.tx; }), { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.16 }, t0 + 0.1)
      .to(notches, { autoAlpha: 1, duration: 0.3, stagger: 0.08 }, t0 + 0.6);
    // 03 · avaliação e devolutiva: dois cursores por competência sobem; a conversa leva os dois pro mesmo lugar
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to(kS.concat(kL), { autoAlpha: 1, duration: 0.25 }, t0).to(leg, { autoAlpha: 1, duration: 0.3 }, t0)
      .to([polyS, polyL], { autoAlpha: 1, duration: 0.3 }, t0 + 0.4);
    for (f = 0; f < 6; f++) {
      tl.to(s[f], { y: LY[SV[f]], duration: 0.8, ease: 'back.out(1.6)', onUpdate: render }, t0 + 0.1 + f * 0.1)
        .to(l[f], { y: LY[LD[f]], duration: 0.8, ease: 'back.out(1.6)', onUpdate: render }, t0 + 0.25 + f * 0.1);
    }
    var tc = t0 + 1.7;
    var ring = S('circle', { cx: FX(1), cy: LY[2], r: 6, 'class': 'ring' }, svg); G.set(ring, { autoAlpha: 0 });
    for (f = 0; f < 6; f++) tl.to(s[f], { y: LY[AG[f]], duration: 0.7, onUpdate: render }, tc + f * 0.06);
    tl.to(l[1], { y: LY[AG[1]], duration: 0.7, onUpdate: render }, tc + 0.3)
      .fromTo(ring, { autoAlpha: 1, attr: { r: 6 } }, { autoAlpha: 0, attr: { r: 30 }, duration: 0.7, ease: 'power2.out', immediateRender: false }, tc + 0.95)
      .to(kS.concat([polyS]), { autoAlpha: 0.25, duration: 0.4 }, tc + 0.9);
    // 04 · mérito e promoção: a régua do próximo nível desce; quem está nela acende
    var d = '';
    for (f = 0; f < 6; f++) { var y = LY[NX[f]]; d += (f ? 'V' + y : 'M' + Math.max(196, FX(f) - 44) + ' ' + y) + 'H' + Math.min(694, FX(f) + 44); }
    var nx = S('path', { d: d, 'class': 'nx drw', pathLength: 1 }, svg);
    var nxl = TX(svg, 646, LY[4] - 12, 'CRITÉRIO DO PRÓXIMO NÍVEL', 'lbl r halo', 'end');
    G.set(nx, { strokeDashoffset: 1 }); G.set(nxl, { autoAlpha: 0 });
    svg.appendChild(polyL); kL.forEach(function (k) { svg.appendChild(k); });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.fromTo(nx, { y: -60 }, { y: 0, duration: 1.1, ease: 'power3.out' }, t0)
      .to(nx, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' }, t0)
      .to(nxl, { autoAlpha: 1, duration: 0.3 }, t0 + 0.9);
    for (f = 0; f < 6; f++) if (AG[f] >= NX[f]) tl.to(kL[f].firstChild, { fill: RED, stroke: RED, duration: 0.2 }, t0 + 1.2 + f * 0.12);
    // 05 · PDI: onde falta, o próximo passo fica marcado
    var gh = [], ar = [];
    for (f = 0; f < 6; f++) if (AG[f] < NX[f]) {
      gh.push(S('rect', { x: FX(f) - 17, y: LY[NX[f]] - 7, width: 34, height: 14, 'class': 'kG' }, svg));
      ar.push(S('path', { d: 'M' + FX(f) + ' ' + (LY[AG[f]] - 10) + 'V' + (LY[NX[f]] + 12) + 'm-5 6l5 -6 5 6', 'class': 'arw' }, svg));
    }
    var pdl = TX(svg, FX(0) + 24, LY[NX[0]] - 12, 'PRÓXIMO PASSO', 'lbl r halo');
    G.set(gh.concat(ar, [pdl]), { autoAlpha: 0 });
    t0 = tl.duration() + 0.3; M.push(t0);
    tl.fromTo(ar, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.2 }, t0)
      .fromTo(gh, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.2, ease: 'back.out(2.5)' }, t0 + 0.3)
      .to(pdl, { autoAlpha: 1, duration: 0.3 }, t0 + 0.6)
      .to({}, { duration: 0.8 });
    return { tl: tl, M: M, onPhase: function (k) { gh.forEach(function (g) { g.classList.toggle('pulse', k === 4); }); } };
  }

  /* =============================== A31 · central de comutação =============================== */
  function crm(svg) {
    var tl = G.timeline({ defaults: { ease: 'power2.inOut' } }), M = [];
    var Y = function (k) { return 84 + k * 32; };
    // dois sistemas de venda, prensa de normalização
    var src = [102, 262].map(function (y, k) {
      var g = S('g', {}, svg);
      S('rect', { x: 16, y: y - 22, width: 100, height: 44, 'class': 'st' }, g);
      TX(g, 66, y - 3, 'VENDAS', 'lbl b', 'middle'); TX(g, 66, y + 10, 'SISTEMA ' + (k + 1), 'lbl', 'middle');
      return g;
    });
    var wires = S('path', { d: 'M116 102H150V182H176M116 262H150V182', 'class': 'wire drw', pathLength: 1 }, svg);
    var press = S('g', {}, svg);
    var rolls = [164, 200].map(function (cy) {
      var g = S('g', {}, press);
      S('circle', { cx: 196, cy: cy, r: 14, 'class': 'roll' }, g);
      S('path', { d: 'M196 ' + (cy - 14) + 'V' + (cy + 14) + 'M182 ' + cy + 'H210', 'class': 'st2' }, g);
      return g;
    });
    TX(press, 196, 140, 'NORMALIZA', 'lbl sm', 'middle');
    var recs = [
      { raw: 'JOANA P. LIMA', norm: 'Joana P. Lima', s: 0, k: 0, o: 0 }, { raw: 'joana pereira lima ', norm: 'Joana Pereira Lima', s: 1, k: 3, o: 1 },
      { raw: 'marcos t silva', norm: 'Marcos T. Silva', s: 0, k: 1, o: 2 }, { raw: 'MARCOS TADEU SILVA', norm: 'Marcos Tadeu Silva', s: 1, k: 4, o: 3 },
      { raw: 'Rita  gomes', norm: 'Rita Gomes', s: 0, k: 2, o: 4 }, { raw: 'bruno ALVES', norm: 'Bruno Alves', s: 1, k: 5, o: 5 }];
    var cardsG = S('g', {}, svg);
    recs.forEach(function (c) {
      c.g = S('g', {}, cardsG);
      c.r = S('rect', { x: 0, y: 0, width: 152, height: 24, 'class': 'card' }, c.g);
      c.t = TX(c.g, 9, 16, c.raw, 'rec', null, true);
      S('circle', { cx: 152, cy: 12, r: 2.5, fill: BONE2 }, c.g);
      c.mo = { p: 0 };
      G.set(c.g, { x: 112, y: [102, 262][c.s] - 12, scale: 0.25, transformOrigin: '0% 50%', autoAlpha: 0 });
    });
    G.set([wires], { strokeDashoffset: 1 }); G.set(press, { autoAlpha: 0 }); G.set(src, { autoAlpha: 0, x: -14 });
    // 01 · ingestão e normalização
    M.push(0);
    tl.to(src, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.15 }, 0)
      .to(wires, { strokeDashoffset: 0, duration: 0.8 }, 0.3)
      .to(press, { autoAlpha: 1, duration: 0.4 }, 0.6);
    var t = 1.0;
    recs.forEach(function (c) {
      var y0 = [102, 262][c.s] - 12;
      var tt = t + c.o * 0.32;
      tl.set(c.g, { autoAlpha: 1 }, tt)
        .to(c.g, { x: 140, duration: 0.2, ease: 'none' }, tt)
        .to(c.g, { y: 170, duration: 0.3, ease: 'none' }, tt + 0.2)
        .to(c.g, { x: 186, duration: 0.18, ease: 'none' }, tt + 0.5)
        .to(c.g, { x: 252, y: Y(c.k) - 12, scale: 1, duration: 0.55, ease: 'power2.out' }, tt + 0.68)
        .to(c.mo, { p: 1, duration: 0.6, ease: 'none', onUpdate: function () { morph(c.t, c.raw, c.norm, c.mo.p); } }, tt + 0.6)
        .to(c.r, { stroke: BONE2, duration: 0.2 }, tt + 1.1);
    });
    rolls.forEach(function (g, i) { tl.fromTo(g, { rotation: 0, svgOrigin: '196 ' + [164, 200][i] }, { rotation: i ? -720 : 720, svgOrigin: '196 ' + [164, 200][i], duration: 2.6, ease: 'none' }, 1); });
    // 02 · deduplicação fuzzy: os parecidos se encontram e viram um só
    var t0 = tl.duration() + 0.2; M.push(t0);
    var R = function (o) { return recs.filter(function (c) { return c.o === o; })[0]; };
    [[0, 1, 'Joana Pereira Lima'], [2, 3, 'Marcos Tadeu Silva']].forEach(function (pr, j) {
      var a = R(pr[0]), b = R(pr[1]), ya = Y(a.k), yb = Y(b.k), tj = t0 + j * 1.3;
      var sim = S('path', { d: 'M404 ' + ya + 'C' + (436 + j * 8) + ' ' + ya + ' ' + (436 + j * 8) + ' ' + yb + ' 404 ' + yb, 'class': 'sim drw', pathLength: 1 }, svg);
      var eq = TX(svg, 438 + j * 8, (ya + yb) / 2 + 8, '≈', 'lbl r'); eq.style.fontSize = '24px';
      G.set(sim, { strokeDashoffset: 1 }); G.set(eq, { autoAlpha: 0 });
      a.mo2 = { p: 0 };
      tl.to(sim, { strokeDashoffset: 0, duration: 0.5 }, tj)
        .to(eq, { autoAlpha: 1, duration: 0.2 }, tj + 0.35)
        .to([a.r, b.r], { stroke: RED, duration: 0.2 }, tj + 0.4)
        .to(b.g, { y: ya - 12 + 5, x: 258, duration: 0.6, ease: 'power3.inOut' }, tj + 0.6)
        .to(b.g, { autoAlpha: 0, duration: 0.25 }, tj + 1.1)
        .to([sim, eq], { autoAlpha: 0, duration: 0.3 }, tj + 1.1)
        .to(a.mo2, { p: 1, duration: 0.5, ease: 'none', onUpdate: function () { morph(a.t, a.norm, pr[2], a.mo2.p); } }, tj + 0.95)
        .to(a.r, { stroke: BONE2, duration: 0.3 }, tj + 1.3);
    });
    var bruno = R(5);
    tl.to(bruno.g, { y: Y(3) - 12, duration: 0.6 }, t0 + 2.7);
    // 03 · caixa de entrada + funil
    var fun = S('path', { d: 'M452 72H688L598 210H542Z', 'class': 'fun drw', pathLength: 1 }, svg);
    var bands = S('path', { d: 'M482 118H658M512 164H628', 'class': 'band' }, svg);
    var bl = [['BASE', 99], ['SEGMENTO', 145], ['CAMPANHA', 191]].map(function (b) { return TX(svg, 570, b[1], b[0], 'lbl', 'middle'); });
    var spout = S('path', { d: 'M570 210V268', 'class': 'wire drw', pathLength: 1 }, svg);
    var inbox = S('g', {}, svg);
    var ibr = S('path', { d: 'M232 410H400V474H232Z', 'class': 'st drw', pathLength: 1 }, inbox);
    TX(inbox, 242, 428, 'CAIXA DE ENTRADA', 'lbl b');
    var msgs = [442, 458].map(function (y) { var g = S('g', {}, inbox); S('rect', { x: 242, y: y - 4, width: 6, height: 6, fill: RED }, g); S('rect', { x: 254, y: y - 3, width: 120, height: 4, 'class': 'msg' }, g); return g; });
    G.set([fun, spout, ibr], { strokeDashoffset: 1, fillOpacity: 0 }); G.set(bl.concat([bands, inbox.querySelector('text')], msgs), { autoAlpha: 0 });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to(fun, { strokeDashoffset: 0, duration: 0.9 }, t0).to([fun, ibr], { fillOpacity: 1, duration: 0.4 }, t0 + 0.7).to(bands, { autoAlpha: 1, duration: 0.3 }, t0 + 0.6)
      .to(ibr, { strokeDashoffset: 0, duration: 0.8 }, t0 + 0.2).to(inbox.querySelector('text'), { autoAlpha: 1, duration: 0.3 }, t0 + 0.7);
    var live = [0, 2, 4, 5].map(R), dots = [];
    live.forEach(function (c, i) {
      for (var j = 0; j < 2; j++) {
        var dt = S('circle', { cx: 0, cy: 0, r: 3.5, 'class': 'dot' }, svg); G.set(dt, { autoAlpha: 0 }); dots.push(dt);
        var yk = c === bruno ? Y(3) : Y(c.k), tx0 = 505 + (i * 2 + j) * 18;
        var te = travel(tl, dt, [[406, yk], [tx0, 76], [570 + (tx0 - 570) * 0.45, 140], [570, 206]], t0 + 0.6 + (i * 2 + j) * 0.14, 300);
        tl.set(dt, { autoAlpha: 0 }, te);
      }
    });
    bl.forEach(function (b, i) { tl.to(b, { autoAlpha: 1, duration: 0.25 }, t0 + 0.9 + i * 0.35).to(b, { fill: BONE, duration: 0.2 }, t0 + 1 + i * 0.35); });
    tl.to(spout, { strokeDashoffset: 0, duration: 0.4 }, t0 + 1.9);
    // 04 · teste A/B/C com guardas de envio
    var XS = [490, 570, 650];
    var bus = S('path', { d: 'M490 268H650M490 268V436M570 268V436M650 268V436', 'class': 'wire drw', pathLength: 1 }, svg);
    var chs = XS.map(function (x, i) {
      var g = S('g', {}, svg);
      TX(g, x + 9, 292, 'ABC'[i], 'lbl big');
      var grd = S('rect', { x: x - 11, y: 336, width: 22, height: 28, 'class': 'grd' }, g);
      S('path', { d: 'M' + x + ' 336v28M' + (x - 5) + ' 345h10M' + (x - 5) + ' 355h10', 'class': 'st2' }, g);
      S('rect', { x: x - 12, y: 436, width: 24, height: 40, rx: 4, 'class': 'st' }, g);
      var scr = S('rect', { x: x - 8, y: 442, width: 16, height: 24, 'class': 'scr' }, g);
      return { g: g, grd: grd, scr: scr };
    });
    var gl1 = TX(svg, 470, 348, 'GUARDA', 'lbl', 'end'), gl2 = TX(svg, 470, 360, 'DE ENVIO', 'lbl', 'end');
    var blk = TX(svg, 570, 326, 'REPETIDO · BARRADO', 'lbl sm r halo', 'middle');
    G.set(bus, { strokeDashoffset: 1 }); G.set(chs.map(function (c) { return c.g; }).concat([gl1, gl2, blk]), { autoAlpha: 0 });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to(bus, { strokeDashoffset: 0, duration: 0.8 }, t0)
      .to(chs.map(function (c) { return c.g; }), { autoAlpha: 1, duration: 0.3, stagger: 0.12 }, t0 + 0.3)
      .to([gl1, gl2], { autoAlpha: 1, duration: 0.3 }, t0 + 0.6);
    XS.forEach(function (x, i) {
      var dt = S('circle', { cx: 0, cy: 0, r: 4, 'class': 'dot' }, svg); G.set(dt, { autoAlpha: 0 });
      var ts = t0 + 0.9 + i * 0.3;
      var te = travel(tl, dt, [[570, 212], [570, 268], [x, 268], [x, 432]], ts, 330);
      tl.to(chs[i].grd, { stroke: BONE, duration: 0.1 }, ts + (Math.abs(x - 570) + 56 + 68) / 330)
        .set(dt, { autoAlpha: 0 }, te).to(chs[i].scr, { fill: BONE2, duration: 0.2 }, te);
    });
    // o envio repetido na linha B bate no fusível e volta
    var dup = S('circle', { cx: 0, cy: 0, r: 4, 'class': 'dot' }, svg); G.set(dup, { autoAlpha: 0 });
    var td = travel(tl, dup, [[570, 212], [570, 330]], t0 + 2.1, 330);
    tl.to(chs[1].grd, { stroke: RED, fill: 'rgba(255,61,31,.25)', duration: 0.12 }, td)
      .to(dup, { y: 300, duration: 0.3, ease: 'power2.out' }, td)
      .to(dup, { autoAlpha: 0, duration: 0.3 }, td + 0.2)
      .to(blk, { autoAlpha: 1, duration: 0.2 }, td)
      .to(chs[1].grd, { stroke: BONE2, fill: '#141412', duration: 0.4 }, td + 0.6);
    // 05 · WhatsApp Cloud API: as respostas voltam pelo webhook e o lacre confere a assinatura
    var ret = S('path', { d: 'M650 476V498H412V452H400M570 476V498M490 476V498', 'class': 'wire dsh' }, svg);
    var seal = S('g', {}, svg);
    S('circle', { cx: 446, cy: 498, r: 11, 'class': 'seal' }, seal);
    var sOk = S('path', { d: 'M440 498l4 4 7-7', 'class': 'ck' }, seal);
    var sNo = S('path', { d: 'M441 493l10 10m0 -10l-10 10', 'class': 'xm' }, seal);
    TX(seal, 446, 517, 'ASSINATURA', 'lbl sm', 'middle');
    var wh = TX(svg, 690, 514, '← WEBHOOK', 'lbl', 'end');
    var ext = S('path', { d: 'M720 498H650', 'class': 'wire dsh' }, svg);
    G.set([ret, seal, wh, ext, sOk, sNo], { autoAlpha: 0 });
    t0 = tl.duration() + 0.2; M.push(t0);
    tl.to([ret, seal, wh], { autoAlpha: 1, duration: 0.4 }, t0);
    var replies = [[490, 0], [650, 1]], tr = t0 + 0.4;
    replies.forEach(function (rp, i) {
      var dt = S('circle', { cx: 0, cy: 0, r: 4, 'class': 'dot' }, svg); G.set(dt, { autoAlpha: 0 });
      var ta = travel(tl, dt, [[rp[0], 478], [rp[0], 498], [458, 498]], tr, 300);
      tl.to(chs[rp[0] === 490 ? 0 : 2].scr, { fill: BG, duration: 0.2 }, tr)
        .fromTo(sOk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, ta)
        .to(sOk, { autoAlpha: 0, duration: 0.2 }, ta + 0.45);
      var tb = travel(tl, dt, [[458, 498], [412, 498], [412, 452], [396, 452]], ta + 0.15, 300);
      tl.set(dt, { autoAlpha: 0 }, tb).to(msgs[rp[1]], { autoAlpha: 1, duration: 0.25 }, tb);
      tr = ta + 0.9;
    });
    // uma mensagem sem lacre tenta entrar e é recusada
    var fk = S('circle', { cx: 0, cy: 0, r: 4, 'class': 'dotO' }, svg); G.set(fk, { autoAlpha: 0 });
    tl.to(ext, { autoAlpha: 1, duration: 0.2 }, tr);
    var tf = travel(tl, fk, [[720, 498], [460, 498]], tr + 0.1, 420);
    tl.fromTo(sNo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, tf)
      .to(fk, { x: 520, duration: 0.4, ease: 'power2.out' }, tf)
      .to(fk, { autoAlpha: 0, duration: 0.3 }, tf + 0.3)
      .to(sNo, { autoAlpha: 0, duration: 0.3 }, tf + 0.9)
      .to(ext, { autoAlpha: 0, duration: 0.3 }, tf + 0.9)
      .to({}, { duration: 0.5 });
    return { tl: tl, M: M };
  }

    return { so: so, mz: mz, crm: crm, relabel: relabel };
  })();

  /* ---------------- 02 · projetos: vista explodida no primeiro, uma máquina em cada um dos outros ---------------- */
  var motor = $('[data-motor]'), projs = $$('.proj', motor), sets = $$('.labels', motor), motorST = null, motorPlace = null, motorRender = function () {}, motorMP = [];
  var MD = 10.2; /* segundos da linha do tempo por máquina = cerca de 3,4 telas de rolagem, como na amostra aprovada */
  function buildLabels() {
    var ol = sets[0];
    if (ol) ol.innerHTML = $$('.pecas li', projs[0]).map(function (li, i) {
      return '<li><b>' + pad2(i + 1) + '</b><strong>' + $('b', li).innerHTML + '</strong><span>' + $('span', li).innerHTML + '</span></li>';
    }).join('');
    projs.forEach(function (p) {
      var strip = $('.pstrip', p); if (!strip) return;
      strip.innerHTML = $$('.pecas li', p).map(function (li, i) {
        var nm = $('b', li).textContent;
        return '<button type="button" aria-label="' + pad2(i + 1) + ' ' + ESC(nm) + '"><i></i><b>' + pad2(i + 1) + '</b><span>' + ESC(nm) + '</span></button>';
      }).join('');
    });
  }
  function capSet(mp, k) {
    var li = $$('.pecas li', projs[mp.k])[k], cap = $('.cap', mp.el);
    cap.innerHTML = '<b>' + pad2(k + 1) + '</b><span>/ 05</span><strong></strong><em></em>';
    decodeTo($('strong', cap), $('b', li).textContent, 380); decodeTo($('em', cap), $('span', li).textContent, 600);
  }
  function decodeTo(el, fin, ms) {
    if (RM) { el.textContent = fin; return; }
    var n = fin.length, t0 = performance.now(); cancelAnimationFrame(el._raf);
    (function f(now) {
      var p = Math.min(1, (now - t0) / ms), rev = Math.floor(p * n), out = '';
      for (var i = 0; i < n; i++) { var ch = fin[i]; out += (i < rev || ch === ' ') ? ch : GL[(Math.random() * GL.length) | 0]; }
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(f);
    })(t0);
  }
  /* ---------------- celular: as mesmas máquinas, com câmera (amostra aprovada: planos/2026-11-13-portfolio/direcoes/projetos-maquinas-celular.html) ---------------- */
  /* [centro x, centro y, largura] em unidades do desenho; a altura sai da proporção da caixa (1:1). 1 ou 2 quadros por etapa: o 2º é pra onde a câmera desliza durante a etapa. */
  var CAMF = {"so": [[[140, 160, 300], [290, 160, 300]], [[20, 150, 300], [560, 150, 300]], [[250, 150, 380], [420, 150, 380]], [[260, 215, 380], [560, 215, 380]], [[172, 375, 340], [490, 385, 420]]], "mz": [[[210, 230, 380], [500, 240, 380]], [[210, 310, 380], [270, 310, 380]], [[440, 320, 480]], [[450, 320, 470]], [[290, 330, 380], [600, 330, 380]]], "crm": [[[160, 170, 360], [290, 170, 360]], [[330, 165, 340]], [[400, 150, 360], [500, 150, 440]], [[520, 360, 400]], [[500, 450, 420]]]};
  var machM = [];
  function mCap(m, k) {
    var li = $$('.pecas li', m.p)[k];
    $('.n', m.cap).innerHTML = '<b>' + pad2(k + 1) + '</b>/ 05';
    decodeTo($('strong', m.cap), $('b', li).textContent, 380); decodeTo($('em', m.cap), $('span', li).textContent, 600);
  }
  /* a parte comum às quatro: caixa quadrada, legenda grande e tira, tudo numa seção parada com pin */
  function mountM(p, boxInner, setup) {
    var anchor = $('.acts', p) || $('.p-note', p), strip = $('.pstrip', p);
    if (!anchor) return;
    if (!strip) {
      strip = D.createElement('div'); strip.className = 'pstrip'; strip.setAttribute('role', 'group'); strip.setAttribute('data-i18n-aria', 'stripa');
      strip.setAttribute('aria-label', T('stripa') || ''); p.insertBefore(strip, anchor); buildLabels();
    }
    p.classList.add('has-m');
    var pin = D.createElement('div'); pin.className = 'mpin';
    pin.innerHTML = '<div class="mach mach-m" aria-hidden="true">' + boxInner + '</div><div class="capc" aria-hidden="true"><div class="n"></div><strong></strong><em></em></div>';
    p.insertBefore(pin, anchor); pin.appendChild(strip);
    var cap = $('.capc', pin), m = setup($('.mach-m', pin));
    var sc = MD / m.T; m.tl.duration(MD);
    var ph = m.M.map(function (x) { return x * sc; }), mm = { p: p, cap: cap, cur: -1, rv: m.rv };
    var st = mm.st = ST.create({
      animation: m.tl, trigger: pin, start: 'top top', pin: true, scrub: 0.6, anticipatePin: 1,
      end: function () { return '+=' + Math.round(innerHeight * MD / 3.6); },
      onUpdate: function (s) {
        var t = s.progress * MD, k = 0; for (var j = 0; j < 5; j++) if (t >= ph[j] - 1e-3) k = j;
        if (k !== mm.cur) { mm.cur = k; mCap(mm, k); if (m.onPhase) m.onPhase(k); }
        $$('button', strip).forEach(function (b, j) {
          var a = ph[j], z = j < 4 ? ph[j + 1] : MD;
          b.style.setProperty('--p', Math.max(0, Math.min(1, (t - a) / (z - a))).toFixed(3)); b.classList.toggle('on', j === k);
        });
      }
    });
    mm.cur = 0; mCap(mm, 0); if (m.onPhase) m.onPhase(0); var b0 = $$('button', strip)[0]; if (b0) b0.classList.add('on');
    strip.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var j = $$('button', strip).indexOf(b);
      scrollTo({ top: st.start + (st.end - st.start) * ((ph[j] + 0.05) / MD) + 2, behavior: 'smooth' });
    });
    addEventListener('resize', m.rv);
    machM.push(mm);
  }
  /* as três máquinas planas: o viewBox do SVG é a câmera */
  function initMachM(p, key, build) {
    mountM(p, '<svg viewBox="0 60 720 466"></svg>', function (box) {
      var svg = $('svg', box), cam = { cx: 0, cy: 0, w: 1 }, frames = CAMF[key];
      function rv() {
        var bw = box.clientWidth || 1, h = cam.w, k = bw / cam.w;
        svg.setAttribute('viewBox', (cam.cx - cam.w / 2).toFixed(1) + ' ' + (cam.cy - h / 2).toFixed(1) + ' ' + cam.w.toFixed(1) + ' ' + h.toFixed(1));
        box.style.backgroundSize = (34 * k * 0.5).toFixed(1) + 'px ' + (34 * k * 0.5).toFixed(1) + 'px'; /* a grade anda com a câmera: é do desenho, não da tela */
        box.style.backgroundPosition = (-(cam.cx - cam.w / 2) * k).toFixed(1) + 'px ' + (-(cam.cy - h / 2) * k).toFixed(1) + 'px';
      }
      function F(a) { return { cx: a[0], cy: a[1], w: a[2] }; }
      cam.cx = frames[0][0][0]; cam.cy = frames[0][0][1]; cam.w = frames[0][0][2]; rv();
      var m = build(svg), T0 = m.tl.duration(), M = m.M.slice();
      frames.forEach(function (fk, i) {
        var a = M[i], z = i < M.length - 1 ? M[i + 1] : T0;
        if (i > 0) m.tl.to(cam, Object.assign(F(fk[0]), { duration: 0.8, ease: 'power2.inOut', onUpdate: rv }), a);
        if (fk[1]) m.tl.to(cam, Object.assign(F(fk[1]), { duration: Math.max(0.6, z - a - (i ? 1.2 : 0.7)), ease: 'sine.inOut', onUpdate: rv }), a + (i ? 1.0 : 0.4));
      });
      return { tl: m.tl, M: M, T: m.tl.duration(), onPhase: m.onPhase, rv: rv };
    });
  }
  /* o Mercado: as mesmas cinco placas e o mesmo sinal do desktop; a pilha é a câmera (sobe até a placa da vez, dá zoom, as outras escurecem) */
  function initMercadoM(p) {
    mountM(p, '<div class="xv"><div class="stack"><div class="spin">' +
      [1, 2, 3, 4, 5].map(function (i) { return '<div class="plate p' + i + '"><i></i><span class="no">0' + i + '</span></div>'; }).join('') + '<div class="sig"></div></div></div></div>', function (box) {
      var stack = $('.stack', box), spin = $('.spin', box), plates = $$('.plate', box), sig = $('.sig', box), st = { sep: 0, f: 0, sg: 0, zoom: 0 };
      function render() {
        var g = Math.min(60, box.clientHeight * 0.17), step = 4 + st.sep * (g - 4);
        box.style.setProperty('--mps', Math.round(box.clientWidth * 0.45) + 'px');
        plates.forEach(function (pl, i) { G.set(pl, { z: i * step }); });
        G.set(stack, { y: st.f * step * 0.866, scale: 1 + 0.22 * st.zoom });
        G.set(sig, { z: st.sg * step + 6, opacity: st.sep > 0.5 ? 1 : 0 });
      }
      G.set(stack, { rotationX: 0, scale: 0.9 }); render();
      var tl = G.timeline({ defaults: { ease: 'power2.inOut' } }), M = [0];
      tl.to(stack, { rotationX: 60, duration: 1.2 }).to(spin, { rotationZ: -45, duration: 1.2 }, '<')
        .to(st, { sep: 1, duration: 1.3, onUpdate: render }, '<.3').to(st, { zoom: 1, duration: 1.2, onUpdate: render }, '<.2');
      for (var k = 1; k < 5; k++) {
        var t0 = tl.duration() + 0.55; M.push(t0);
        tl.to(st, { f: k, sg: k, duration: 1.1, onUpdate: render }, t0);
        if (k >= 2) tl.to(spin, { rotationZ: k === 2 ? -60 : k === 3 ? -30 : -45, duration: 1.4 }, t0 - 0.2);
      }
      tl.to({}, { duration: 1.2 });
      return { tl: tl, M: M, T: tl.duration(), rv: render, onPhase: function (k) { plates.forEach(function (pl, i) { pl.classList.toggle('hot', i === k); pl.classList.toggle('dim', i !== k); }); } };
    });
  }
  function initMotor() {
    if (DESK && G) {
      var stage = $('.stage', motor), xv = $('.xv', motor), stack = $('.stack', motor), spin = $('.spin', motor), plates = $$('.plate', motor), sig = $('.sig', motor);
      var svg = $('.leaders', motor), mw = $('.mwipe', motor), segs = $$('.mseg button', motor), machEls = $$('.mach', motor);
      var MB = [null, MACH.so, MACH.mz, MACH.crm];
      var S = { sep: 0, lab: 0, sig: -1 };
      var GAP = function () { return Math.min(92, stage.clientHeight * 0.16); };
      var render = motorRender = function () {
        var g = GAP();
        plates.forEach(function (p, i) { G.set(p, { z: i * (4 + S.sep * (g - 4)) }); });
        var zTop = 4 * (4 + S.sep * (g - 4));
        G.set(stack, { y: zTop * 0.43 });
        if (S.sig >= 0) G.set(sig, { z: S.sig * zTop + 6, opacity: 1 }); else G.set(sig, { opacity: 0 });
        plates.forEach(function (p, i) { p.classList.toggle('hot', S.sig >= 0 && Math.abs(S.sig * 4 - i) < 0.55); });
        var sr = stage.getBoundingClientRect(), lis = $$('li', sets[0]), d = '', dots = '';
        plates.forEach(function (p, i) {
          var li = lis[i]; if (!li) return;
          var r = p.getBoundingClientRect(), x = r.right - sr.left - 2, y = r.top + r.height / 2 - sr.top;
          var lx = sr.width - li.offsetWidth - 14; li.style.top = y + 'px';
          var o = Math.max(0, Math.min(1, S.lab * 5 - i)); li.style.opacity = o;
          li.classList.toggle('hot', p.classList.contains('hot'));
          if (o > 0.01) { var m = x + (lx - x) * 0.35; d += 'M' + x + ' ' + y + ' L' + m + ' ' + y + ' L' + lx + ' ' + y; dots += '<circle cx="' + x + '" cy="' + y + '" r="3"/>'; }
        });
        svg.innerHTML = '<path d="' + d + '" style="opacity:' + Math.min(1, S.lab * 2) + '"/>' + dots;
      };
      projs.forEach(function (p, k) { G.set(p, { autoAlpha: k ? 0 : 1 }); });
      G.set(machEls, { autoAlpha: 0 });
      G.set(stack, { rotationX: 0, scale: 0.9 }); render();
      var tl = G.timeline({ defaults: { ease: 'power2.inOut' } }), marks = [];
      tl.to(stack, { rotationX: 60, scale: 1, duration: 1, onUpdate: render }).to(spin, { rotationZ: -45, duration: 1 }, '<');
      projs.forEach(function (p, i) {
        marks.push(i === 0 ? 0 : tl.duration());
        if (i === 0) {
          /* O Mercado para Gestores de Dados: a vista explodida em cinco placas */
          tl.to(S, { sep: 1, duration: 1.1, onUpdate: render })
            .to(S, { lab: 1, duration: 0.8, ease: 'none', onUpdate: render }, '<.3')
            .to(S, { sig: 0, duration: 0.01, ease: 'none', onUpdate: render })
            .to(S, { sig: 1, duration: 1.2, ease: 'none', onUpdate: render })
            .to(S, { sig: -1, duration: 0.01, ease: 'none', onUpdate: render })
            .to({}, { duration: 0.35 });
        } else {
          /* os outros três: a máquina da amostra aprovada, com a linha do tempo dela encaixada na da seção */
          var me = machEls[i - 1], m = MB[i]($('svg', me)), t0 = tl.duration(), sc = MD / m.tl.duration();
          tl.add(m.tl.duration(MD), t0);
          motorMP.push({ k: i, el: me, strip: $('.pstrip', p), t0: t0, end: t0 + MD, ph: m.M.map(function (x) { return t0 + x * sc; }), on: m.onPhase, cur: -1 });
        }
        if (i < projs.length - 1) {
          var q = projs[i + 1], L = 'sw' + i, qm = machEls[i], cm = i ? machEls[i - 1] : null;
          if (i === 0) {
            tl.to(S, { lab: 0, duration: 0.35, ease: 'none', onUpdate: render })
              .to(S, { sep: 0.08, duration: 0.75, onUpdate: render }, '<.05')
              .to(spin, { rotationZ: '-=90', duration: 0.75, onUpdate: render }, '<');
          }
          /* a linha vermelha passa pelo texto, o projeto novo entra por trás dela e a máquina nova entra junto */
          tl.addLabel(L)
            .set(q, { autoAlpha: 1 }, L).set(mw, { autoAlpha: 1 }, L).set(qm, { autoAlpha: 1 }, L)
            .fromTo(q, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, immediateRender: false }, L)
            .fromTo(p, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.8, immediateRender: false }, L)
            .fromTo(qm, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, immediateRender: false }, L)
            .fromTo(mw, { left: '0%' }, { left: '100%', duration: 0.8, immediateRender: false }, L);
          if (cm) tl.fromTo(cm, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.8, immediateRender: false }, L).set(cm, { autoAlpha: 0 }, L + '+=0.8');
          else tl.to(xv, { autoAlpha: 0, duration: 0.8 }, L);
          tl.set(mw, { autoAlpha: 0 }, L + '+=0.8').set(p, { autoAlpha: 0 }, L + '+=0.8');
        }
      });
      marks.push(tl.duration());
      motorST = ST.create({
        animation: tl, trigger: $('.pin', motor), start: 'top top', pin: true, scrub: 0.6, anticipatePin: 1,
        end: function () { return '+=' + Math.round(innerHeight * tl.duration() / 3); },
        onUpdate: function (s) {
          var t = s.progress * tl.duration();
          segs.forEach(function (b, k) {
            var a = marks[k], z = marks[k + 1], pp = Math.max(0, Math.min(1, (t - a) / (z - a)));
            b.style.setProperty('--p', pp.toFixed(3));
            b.classList.toggle('on', (t >= a && t < z) || (k === segs.length - 1 && t >= z));
          });
          motorMP.forEach(function (mp) {
            var k = 0; for (var j = 0; j < 5; j++) if (t >= mp.ph[j] - 1e-3) k = j;
            if (mp.cur !== k) { mp.cur = k; capSet(mp, k); if (mp.on) mp.on(k); }
            $$('button', mp.strip).forEach(function (b, j) {
              var a = mp.ph[j], z = j < 4 ? mp.ph[j + 1] : mp.end;
              b.style.setProperty('--p', Math.max(0, Math.min(1, (t - a) / (z - a))).toFixed(3));
              b.classList.toggle('on', j === k);
            });
          });
        }
      });
      motorPlace = function (k) { return motorST.start + (motorST.end - motorST.start) * ((marks[k] + (k ? 0.1 : 0)) / tl.duration()) + 2; };
      segs.forEach(function (b, k) {
        b.addEventListener('click', function () {
          var y = motorST.start + (motorST.end - motorST.start) * ((marks[k] + (k ? 0.1 : 0)) / tl.duration());
          scrollTo({ top: y + 2, behavior: 'smooth' });
        });
      });
      motorMP.forEach(function (mp) {
        mp.strip.addEventListener('click', function (e) {
          var b = e.target.closest('button'); if (!b) return;
          var j = $$('button', mp.strip).indexOf(b);
          var y = motorST.start + (motorST.end - motorST.start) * ((mp.ph[j] + 0.05) / tl.duration());
          scrollTo({ top: y + 2, behavior: 'smooth' });
        });
      });
      addEventListener('resize', render);
    } else if (G && !RM) {
      /* celular e telas estreitas: os quatro projetos ganham a seção parada com pin enquanto se rola: os três com máquina plana e câmera por etapa,
         o Mercado com a vista explodida em 3D (a pilha é a câmera); legenda grande e tira de peças embaixo (amostras aprovadas em planos/2026-11-13-portfolio/direcoes/) */
      H.classList.add('js-mach');
      var KEYS = [null, 'so', 'mz', 'crm'], MBM = [null, MACH.so, MACH.mz, MACH.crm];
      projs.forEach(function (p, k) {
        if (k) initMachM(p, KEYS[k], MBM[k]); else initMercadoM(p);
      });
    }
  }

  /* ---------------- 03 · esqueleto ---------------- */
  /* Sanfona de cada cargo (Item 14). O HTML sai com tudo aberto (sem JavaScript fica assim). Com JavaScript e movimento normal,
     tudo fecha já na partida (sfSetup) e a rolagem abre o cargo que cruza a linha de leitura; o clique do visitante vale até
     ele sair da seção. Com movimento reduzido fica tudo aberto, e o botão ainda abre e fecha.
     Passagem suave (reaberto em 2026-11-14): nada que o visitante está vendo anda sozinho. O cargo novo abre pra baixo (o título
     dele fica parado); o anterior só fecha de vez depois de sair da tela por cima e a rolagem parar, e aí a rolagem é corrigida
     na mesma hora (a página encolhe por cima e o que está na tela não se mexe). Quem sobe pra um cargo de cima vê o de baixo
     fechando embaixo. O cargo ativo sai da posição de agora, não da medida guardada do ScrollTrigger (que só se atualiza depois
     da transição e era a causa de pular o cargo seguinte). */
  /* Barra vermelha da trajetória: vai até o fim do cargo que já passou da linha de leitura (40%) e fica lá. Sai da posição de agora
     de cada quadro (antes era uma proporção da rolagem, que dava um tranco a cada sanfona que abria ou fechava): acompanha a sanfona
     enquanto ela abre e não volta depois. Quando o cargo muda, a diferença entre onde a barra estava e onde ela deve ficar se desfaz
     em ~0,2 s, pra ela não pular. */
  var RL = 0.4; /* linha de leitura da Trajetória: o cargo que cruza 40% da altura da tela abre (o título fica no terço de cima e o texto tem a tela inteira embaixo) */
  var cpOl = null, cpLis = [], cpK = -2, cpOff = 0, cpLast = 0, cpBusy = 0, cpRaf = 0, cpT = 0;
  function cpTarget() {
    var line = innerHeight * RL, k = -1, i;
    for (i = 0; i < cpLis.length; i++) if (cpLis[i].getBoundingClientRect().top <= line) k = i;
    var o = cpOl.getBoundingClientRect();
    return { k: k, y: k < 0 ? 0 : cpLis[k].getBoundingClientRect().bottom - o.top, h: o.height };
  }
  function cpFrame() {
    if (!cpOl) return;
    var now = performance.now(), t = cpTarget(), dt = cpT ? Math.min(100, now - cpT) : 16; cpT = now;
    if (t.k !== cpK) { if (cpK !== -2) cpOff = cpLast - t.y; cpK = t.k; }
    cpOff *= Math.exp(-dt / 200); if (Math.abs(cpOff) < 0.5) cpOff = 0;
    cpLast = t.y + cpOff;
    cpOl.style.setProperty('--cp', Math.max(0, Math.min(1, cpLast / (t.h || 1))).toFixed(4));
    if (cpOff !== 0) cpRun();
    return cpOff !== 0;
  }
  function cpLoop() {
    cpRaf = 0; var more = cpFrame();
    if (!cpRaf) { if (more || performance.now() < cpBusy) cpRaf = requestAnimationFrame(cpLoop); else cpT = 0; }
  }
  function cpRun() { if (!cpRaf && cpOl) cpRaf = requestAnimationFrame(cpLoop); }
  function cpSnap() { cpOff = 0; if (cpOl) { cpFrame(); } }
  var SF = [], sfManual = false, sfTimer = 0, sfIdleT = 0, sfCur = -1, SFAUTO = !!G && !RM;
  function sfSet(s, open, now) {
    var fx = s.b.nextElementSibling;
    if (now && fx) fx.style.transition = 'none';
    s.b.setAttribute('aria-expanded', open ? 'true' : 'false');
    s.open = open;
    if (now && fx) { void fx.offsetHeight; fx.style.transition = ''; }
    cpBusy = performance.now() + (now ? 60 : 900); cpRun();
  }
  function sfRefreshLater() {
    clearTimeout(sfTimer);
    if (G) sfTimer = setTimeout(function () { ST.refresh(); }, 720); /* a página mudou de altura: remede os gatilhos depois da transição */
  }
  function sfShow(s, open) { sfSet(s, open, false); sfRefreshLater(); }
  function sfSetup() {
    SF = $$('.spine>li').map(function (li) { return { li: li, b: $('.sf-b', li), open: true }; }).filter(function (s) { return s.b; });
    SF.forEach(function (s) {
      if (SFAUTO) sfSet(s, false, true); /* fecha na hora, sem transição: os gatilhos do resto da página são medidos já com a Trajetória fechada */
      s.b.addEventListener('click', function () { sfManual = true; sfShow(s, !s.open); });
    });
  }
  /* fecha na hora o cargo que já saiu da tela por cima e corrige a rolagem do tanto que a página encolheu */
  function sfIdle() {
    if (sfManual || !SFAUTO || navBusy) return;
    var ref = $('.traj').nextElementSibling, t0 = ref ? ref.getBoundingClientRect().top : 0;
    /* primeiro mede todos, depois fecha: fechar um cargo move os de baixo e enganaria a medida seguinte */
    var gone = SF.filter(function (s, i) { return s.open && i !== sfCur && s.li.getBoundingClientRect().bottom < -40; });
    if (!gone.length) return;
    gone.forEach(function (s) { sfSet(s, false, true); });
    /* mede de novo o que vem depois da seção: se o navegador já recuou a rolagem (fim da página), só falta o resto */
    if (ref) { var d = ref.getBoundingClientRect().top - t0; if (d) scrollTo({ top: scrollY + d, left: scrollX, behavior: 'instant' }); }
    cpSnap();
    if (G) ST.refresh();
  }
  /* ativa o cargo k (o que cruza a linha de leitura): abre ele e arruma os outros sem mexer no que está à vista */
  function sfActivate(k) {
    sfCur = k;
    SF.forEach(function (s, i) {
      s.li.classList.toggle('on', i === k);
      if (i === k) decode($('.per', s.li), 520);
    });
    if (sfManual || !SFAUTO) return;
    var vh = innerHeight, tops = SF.map(function (s) { return s.li.getBoundingClientRect().top; }); /* mede antes de fechar qualquer um */
    SF.forEach(function (s, i) {
      if (i === k) { if (!s.open) sfShow(s, true); return; }
      if (!s.open) return;
      if (tops[i] > vh + 40) sfSet(s, false, true); /* abaixo da tela: fecha na hora, ninguém vê */
      else if (i > k) sfShow(s, false);                                     /* embaixo do ativo e à vista: fecha com a transição */
      /* em cima do ativo: fica aberto até sair da tela (sfIdle) */
    });
    sfRefreshLater();
  }
  function sfTick() {
    if (!SFAUTO) return;
    cpFrame();
    if (navBusy) return; /* andando por um botão ou seta: nada abre nem fecha até chegar */
    var line = innerHeight * RL, k = -1;
    for (var i = 0; i < SF.length; i++) { var r = SF[i].li.getBoundingClientRect(); if (r.top <= line && r.bottom > line) { k = i; break; } }
    if (k >= 0 && k !== sfCur) sfActivate(k);
    clearTimeout(sfIdleT); sfIdleT = setTimeout(sfIdle, 160);
  }
  sfSetup();

  function initSpine() {
    var ol = $('.spine'), lis = $$('.spine>li');
    if (!G || RM) return;
    ST.create({ trigger: $('.traj'), start: 'top bottom', end: 'bottom top', onUpdate: sfTick, onToggle: function (t) { if (!t.isActive) sfManual = false; sfTick(); } });
    cpOl = ol; cpLis = lis;
    ST.create({ trigger: ol, start: 'top bottom', end: 'bottom top', onUpdate: cpFrame, onLeave: cpFrame, onLeaveBack: cpFrame });
    lis.forEach(function (li) {
      G.fromTo($('.vb', li), { x: -46, rotation: -40, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, ease: 'back.out(2.2)',
        scrollTrigger: { trigger: li, start: 'top 94%', end: 'top 68%', scrub: 0.4 } });
      if (!NARROW()) G.fromTo($('.yr', li), { yPercent: 35 }, { yPercent: -35, ease: 'none', scrollTrigger: { trigger: li, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------------- setas do teclado (Item 17) ---------------- */
  /* → e ↓ andam pro próximo lugar, ← e ↑ pro anterior. Lugares: as seções; dentro da Projetos, um projeto por vez; dentro da
     Trajetória, um cargo por vez. As posições são medidas na hora de cada aperto (a altura da página muda com as sanfonas).
     Não toma a seta de quem está num campo, num botão do painel de configurações ou com Ctrl, Alt, Shift ou Cmd; o painel tem a chave. */
  var ARR = true, TOASTS = { pt: 'Dica: use as setas ← → do teclado para navegar', en: 'Tip: use the ← → arrow keys to move around the site' };
  try { ARR = localStorage.getItem('arr') !== 'off'; } catch (e) {}
  function secY(id) { var el = D.getElementById(id); return function () { return el.getBoundingClientRect().top + scrollY; }; }
  function places() {
    var L = [secY('topo'), secY('quem-sou')], i;
    /* projetos: o pin da seção (computador) ou o de cada projeto (celular e texto grande); sem pin, cada bloco */
    if (motorST && motorPlace) projs.forEach(function (p, k) { L.push(function () { return motorPlace(k); }); });
    else if (machM.length) projs.forEach(function (p, k) { L.push(k && machM[k] ? function () { return machM[k].st.start + 2; } : secY('projetos')); });
    else projs.forEach(function (p, k) { L.push(k ? function () { return p.getBoundingClientRect().top + scrollY - 20; } : secY('projetos')); });
    /* trajetória: o primeiro cargo vem junto com o título da seção; os outros com o cargo cruzando a linha de leitura (é ele que abre) */
    SF.forEach(function (s, k) { L.push(k ? function () { return s.li.getBoundingClientRect().top + scrollY - (innerHeight * RL - 70); } : secY('trajetoria')); });
    L.push(secY('escrita'), secY('contato'));
    return L;
  }
  function stepTo(dir) {
    var ys = places().map(function (f) { return f(); }), cur = scrollY, pick = -1, i;
    if (dir > 0) { for (i = 0; i < ys.length; i++) if (ys[i] > cur + 24) { pick = i; break; } }
    else { for (i = ys.length - 1; i >= 0; i--) if (ys[i] < cur - 24) { pick = i; break; } }
    if (pick < 0) return false;
    goTo(places()[pick]);
    return true;
  }
  var toastEl = null, toastT = 0;
  function toastHide() { clearTimeout(toastT); if (toastEl) { toastEl.classList.remove('on'); } }
  function toastShow() {
    if (!ARR || !FINE) return;
    try { if (localStorage.getItem('arr-visto')) return; localStorage.setItem('arr-visto', '1'); } catch (e) {}
    toastEl = D.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
    toastEl.textContent = TOASTS[lang === 'en' ? 'en' : 'pt']; D.body.appendChild(toastEl);
    requestAnimationFrame(function () { requestAnimationFrame(function () { toastEl.classList.add('on'); }); });
    toastT = setTimeout(toastHide, 7000);
  }
  D.addEventListener('keydown', function (e) {
    var k = e.key, dir = (k === 'ArrowRight' || k === 'ArrowDown') ? 1 : (k === 'ArrowLeft' || k === 'ArrowUp') ? -1 : 0;
    if (k === 'Escape') toastHide();
    if (!dir || !ARR || e.defaultPrevented || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
    var t = e.target;
    if (t && t.closest && t.closest('input,textarea,select,[contenteditable],[role=slider],[role=listbox],[role=menu],[role=tablist],[data-cfg]')) return;
    if (stepTo(dir)) { e.preventDefault(); toastHide(); try { localStorage.setItem('arr-visto', '1'); } catch (er) {} }
  });
  var arrb = $('[data-arr]');
  if (arrb) {
    arrb.setAttribute('aria-pressed', ARR ? 'true' : 'false');
    arrb.addEventListener('click', function () {
      ARR = !ARR; arrb.setAttribute('aria-pressed', ARR ? 'true' : 'false');
      try { if (ARR) localStorage.removeItem('arr'); else localStorage.setItem('arr', 'off'); } catch (e) {}
      if (!ARR) toastHide();
    });
  }

  /* ---------------- 04 · sinapses ---------------- */
  var pulses = [], redeOn = false, NS = 'http://www.w3.org/2000/svg';
  function drawRede() {
    if (!rede) return;
    var svg = $('svg', rede), rb = rede.getBoundingClientRect(), nodes = {}, narrow = NARROW(), html = '', E = [];
    $$('.node', rede).forEach(function (n) {
      var t = $('.tm', n).getBoundingClientRect(), nr = n.getBoundingClientRect(), tt = $('.t', n).getBoundingClientRect();
      nodes[n.dataset.n] = { x: t.left + t.width / 2 - rb.left, y: t.top + t.height / 2 - rb.top, ox: Math.min(nr.right, tt.right + 18) - rb.left };
    });
    rede.dataset.edges.split('|').forEach(function (s, k) {
      var p = s.split(':'), ab = p[0].split('-'), a = nodes[ab[0]], b = nodes[ab[1]], d;
      if (!a || !b) return;
      if (narrow || Math.abs(a.y - b.y) > 40) {
        if (Math.abs(a.x - b.x) < 40) { var bx = Math.min(a.x, b.x) - (narrow ? 12 + 7 * k : 70); d = 'M' + a.x + ' ' + a.y + ' C' + bx + ' ' + (a.y + (b.y - a.y) * 0.2) + ' ' + bx + ' ' + (b.y - (b.y - a.y) * 0.2) + ' ' + b.x + ' ' + b.y; }
        else { var dy = b.y - a.y; d = 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + (a.y + dy * 0.6) + ' ' + b.x + ' ' + (b.y - dy * 0.6) + ' ' + b.x + ' ' + b.y; }
      } else {
        var m = (a.ox + b.x) / 2; d = 'M' + a.ox + ' ' + a.y + ' C' + m + ' ' + a.y + ' ' + m + ' ' + b.y + ' ' + b.x + ' ' + b.y;
        html += '<rect class="port" x="' + (a.ox - 4) + '" y="' + (a.y - 4) + '" width="8" height="8"/>';
      }
      html = '<path class="ed" pathLength="1" d="' + d + '"/>' + html;
      E.push({ a: ab[0], b: ab[1], label: p[1] });
    });
    svg.innerHTML = html + '<g class="lbls"></g><g class="pulses"></g>';
    var paths = $$('.ed', svg).reverse(), g = $('.lbls', svg);
    if (!narrow) paths.forEach(function (pa, i) {
      var Lp = pa.getTotalLength(), m = pa.getPointAtLength(Lp / 2);
      g.insertAdjacentHTML('beforeend', '<text class="elbl" x="' + m.x.toFixed(1) + '" y="' + (m.y - 9).toFixed(1) + '" text-anchor="middle">' + ESC(E[i].label) + '</text>');
    });
    rede._paths = paths; rede._E = E; pulses = [];
  }
  function fire(i, rev) {
    if (RM) return;
    var pa = rede._paths[i]; if (!pa) return;
    var c = D.createElementNS(NS, 'circle'); c.setAttribute('r', 3.4); c.setAttribute('class', 'pl');
    $('.pulses', rede).appendChild(c);
    pulses.push({ pa: pa, L: pa.getTotalLength(), t0: performance.now(), dur: 1150, rev: rev, c: c, i: i });
    pa.classList.add('lit');
  }
  function arrive(p) {
    var E = rede._E[p.i], to = p.rev ? E.a : E.b, n = $('.node[data-n="' + to + '"]', rede);
    if (n) { n.classList.add('lit'); setTimeout(function () { n.classList.remove('lit'); }, 750); }
    if (!pulses.some(function (q) { return q.i === p.i; })) p.pa.classList.remove('lit');
  }
  function redeTick(now) {
    if (redeOn && pulses.length) {
      pulses = pulses.filter(function (p) {
        var t = (now - p.t0) / p.dur;
        if (t >= 1) { p.c.remove(); arrive(p); return false; }
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, pt = p.pa.getPointAtLength((p.rev ? 1 - e : e) * p.L);
        p.c.setAttribute('cx', pt.x); p.c.setAttribute('cy', pt.y);
        return true;
      });
      pulses.forEach(function (p) { p.pa.classList.add('lit'); });
    }
    requestAnimationFrame(redeTick);
  }
  function initRede() {
    if (!rede) return;
    $$('.node', rede).forEach(function (n) {
      var go2 = function () {
        if (!rede._E) return;
        rede._E.forEach(function (E, i) {
          if (E.a === n.dataset.n) fire(i, false);
          if (E.b === n.dataset.n) fire(i, true);
          if (RM && (E.a === n.dataset.n || E.b === n.dataset.n)) rede._paths[i].classList.add('lit');
        });
      };
      n.addEventListener('pointerenter', go2);
      n.addEventListener('focusin', go2);
      n.addEventListener('pointerleave', function () { if (RM) rede._paths.forEach(function (p) { p.classList.remove('lit'); }); });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { redeOn = es[0].isIntersecting; }).observe(rede);
    if (!RM) setInterval(function () { if (redeOn && rede._paths && rede._paths.length && D.visibilityState === 'visible') fire((Math.random() * rede._paths.length) | 0, Math.random() < 0.5); }, 2300);
    if (G && !RM) ST.create({ trigger: rede, start: 'top 75%', once: true, onEnter: function () {
      G.fromTo(rede._paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.18 });
      var deco = $$('.elbl,.port', rede); if (deco.length) G.from(deco, { opacity: 0, duration: 0.6, delay: 0.9, stagger: 0.1 });
      $$('.node .m', rede).forEach(function (m, i) { setTimeout(function () { decode(m, 600); }, i * 110); });
    } });
  }

  /* ---------------- 05 · sinais vitais ---------------- */
  var callme = $('[data-callme]'), cm = [];
  function fitCallme() {
    cm = split(callme);
    var inner = callme.lastChild; callme.style.fontSize = '100px';
    var w = inner.getBoundingClientRect().width;
    callme.style.fontSize = (100 * callme.clientWidth / w * 0.99).toFixed(2) + 'px';
  }
  /* o "ME CHAMA!" só começa a bater depois de esticar até o tamanho final: antes os dois mexiam na mesma largura das letras
     ao mesmo tempo e a primeira chegada ficava caótica */
  var cmReady = false;
  function beatPulse() {
    if (!cm.length || !cmReady) return;
    G.fromTo(cm, { '--w': 125 }, { '--w': 84, duration: 0.11, ease: 'power2.out', yoyo: true, repeat: 1, stagger: { each: 0.03, from: 'center' } });
  }
  function initEcg() {
    var ecg = $('.ecg'); if (!ecg || !G || RM) return;
    var base = $('.base', ecg), tr = $('.trace', ecg), dot = $('.dot', ecg), rect = $('#ecgr', ecg);
    G.fromTo(base, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: ecg, start: 'top 92%', end: 'top 40%', scrub: true } });
    /* varredura de monitor: a cabeça anda em velocidade constante no eixo x (uma máscara com rastro que se apaga),
       o ponto acompanha a curva e o texto pulsa em cada pico do batimento */
    var Lt = base.getTotalLength(), ys = [], N = 1400, k, p, last = 72;
    for (k = 0; k <= N; k++) { p = base.getPointAtLength(Lt * k / N); ys[Math.round(p.x)] = p.y; }
    for (k = 0; k <= 1000; k++) { if (ys[k] === undefined) ys[k] = last; last = ys[k]; }
    var peaks = [95, 330, 565, 800], TAIL = 350, sw = { h: 0 }, ni = 0, SPAN = 1000 + TAIL;
    function paint() {
      var h = sw.h;
      rect.setAttribute('x', (h - TAIL).toFixed(1));
      var hx = Math.min(1000, Math.max(0, h));
      dot.setAttribute('d', 'M' + hx.toFixed(1) + ' ' + ys[Math.round(hx)] + 'h.01');
      dot.style.opacity = h > 0 && h <= 1000 ? 1 : 0;
      while (ni < peaks.length && h >= peaks[ni]) { ni++; beatPulse(); }
    }
    var sweep = G.timeline({ repeat: -1, paused: true, repeatDelay: 0.35, onRepeat: function () { ni = 0; } })
      .fromTo(sw, { h: 0 }, { h: SPAN, duration: 3.9, ease: 'none', onUpdate: paint }, 0);
    paint();
    ST.create({ trigger: ecg, start: 'top bottom', end: 'bottom top', onToggle: function (s) { if (s.isActive) sweep.play(); else sweep.pause(); } });
    G.fromTo(cm, { '--w': 62, '--g': 160 }, { '--w': 125, '--g': 800, duration: 1.15, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: callme, start: 'top 88%', once: true }, onComplete: function () { cmReady = true; } });
    /* a varredura só começa a contar picos quando o texto está pronto; se a página já estava lá embaixo, o pulso espera */
  }

  /* ---------------- capô do site (a página em negativo) ---------------- */
  var xr = false;
  function vt(update, anim) {
    if (!D.startViewTransition || RM) { update(); return; }
    var t = D.startViewTransition(update);
    t.ready.then(function () {
      H.animate(anim(), { duration: 950, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  }
  function setXray(on) {
    xr = on; H.classList.toggle('xray', on);
    $$('[data-capo]').forEach(function (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var fb = $('.rod [data-capo]'); if (fb) fb.textContent = T(on ? 'f3x' : 'f3');
    $('.stamp').setAttribute('aria-label', T(on ? 'stampx' : 'stampa'));
  }
  $$('[data-capo]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      vt(function () { setXray(!xr); }, function () { return { clipPath: ['circle(0px at ' + cx + 'px ' + cy + 'px)', 'circle(' + R + 'px at ' + cx + 'px ' + cy + 'px)'] }; });
    });
  });

  /* ---------------- reduzir movimento (vale pra visita inteira) ---------------- */
  var rmb = $('[data-rm]');
  if (rmb) {
    rmb.setAttribute('aria-pressed', RM ? 'true' : 'false');
    rmb.addEventListener('click', function () { window.name = RM ? 'norm' : 'rm'; location.reload(); });
  }

  /* ---------------- configurações: tamanho do texto, movimento e idioma num painel só ---------------- */
  var cfg = $('[data-cfg]');
  if (cfg) {
    var cb = $('.cfg-b', cfg), cp = $('.cfg-p', cfg), pinned = false, closeT = 0;
    var setOpen = function (o) { if (o) cfg.setAttribute('data-open', ''); else cfg.removeAttribute('data-open'); cb.setAttribute('aria-expanded', o ? 'true' : 'false'); };
    var hoverIn = function () { if (FINE) { clearTimeout(closeT); setOpen(true); } };
    var hoverOut = function () { if (FINE && !pinned) { clearTimeout(closeT); closeT = setTimeout(function () { setOpen(false); }, 350); } };
    [cb, cp].forEach(function (e) { e.addEventListener('pointerenter', hoverIn); e.addEventListener('pointerleave', hoverOut); });
    cb.addEventListener('click', function () { if (pinned || (!FINE && cfg.hasAttribute('data-open'))) { pinned = false; setOpen(false); } else { pinned = true; setOpen(true); } });
    var closeAll = function () { pinned = false; setOpen(false); };
    cfg.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cfg.hasAttribute('data-open')) { closeAll(); cb.focus(); } });
    cfg.addEventListener('focusout', function (e) { if (e.relatedTarget && !cfg.contains(e.relatedTarget)) closeAll(); });
    D.addEventListener('pointerdown', function (e) { if (!cfg.contains(e.target)) closeAll(); });
    var sizes = $$('.cfg-s button', cfg);
    var showTs = function () { var cur = H.dataset.ts || '0'; sizes.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.ts === cur ? 'true' : 'false'); }); };
    showTs();
    sizes.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.ts; if (v === '0') H.removeAttribute('data-ts'); else H.dataset.ts = v;
        try { if (v === '0') localStorage.removeItem('ts'); else localStorage.setItem('ts', v); } catch (e) {}
        showTs();
        /* cruzar a fronteira do texto grande troca o desenho dos projetos: recarrega (window.name guarda o movimento) */
        if ((+v >= 2) !== BIG) { location.reload(); return; }
        requestAnimationFrame(function () { relayout(); });
      });
    });
  }

  /* ---------------- texto trocado (idioma) ---------------- */
  function afterText() {
    buildName(); chars.forEach(setC); splitHeads(); fitCallme(); buildLabels(); MACH.relabel();
    if (xr) { var fb = $('.rod [data-capo]'); if (fb) fb.textContent = T('f3x'); }
    drawRede();
    relayout();
  }
  /* a página mudou de altura (ex.: tamanho do texto): só remede os gatilhos, sem refazer os títulos */
  function relayout() {
    if (G) { ST.refresh(); motorRender(); if (motorST) { motorMP.forEach(function (mp) { mp.cur = -1; }); motorST.update(); }
      machM.forEach(function (mm) { mm.cur = -1; mm.rv(); mm.st.update(); }); }
  }

  /* ---------------- partida ---------------- */
  function start() {
    buildName(); splitHeads(); fitCallme(); buildLabels();
    if (G && !RM) {
      heads.forEach(function (h) { stretchIn(h._c, h); });
      $$('.kick i').forEach(function (i) { G.fromTo(i, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: i, start: 'top 94%', end: 'top 60%', scrub: true } }); });
      G.to('.name', { yPercent: -24, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (s) { heroP = s.progress; } } });
      G.to('.spec,.cue', { opacity: 0.2, y: -36, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } });
    }
    initMotor(); initSpine(); drawRede(); initRede(); initEcg();
    if (G) ST.refresh();
    intro();
    if (FINE) setTimeout(toastShow, 4000);
    requestAnimationFrame(heroLoop); requestAnimationFrame(lensTick); requestAnimationFrame(redeTick);
    if (CFG.xray) setXray(true);
    if (CFG.start) {
      var y;
      if (CFG.start === 'projetos' && motorST) y = motorST.start + 2;
      else { var el = D.getElementById(CFG.start); y = el.getBoundingClientRect().top + scrollY; }
      scrollTo(0, y);
    }
    onScroll();
    var lw = innerWidth;
    addEventListener('resize', function () {
      if (Math.abs(innerWidth - lw) < 40) return; lw = innerWidth;
      buildName(); chars.forEach(setC); fitCallme(); drawRede(); if (G) ST.refresh();
    });
  }
  var fontes = D.fonts ? Promise.all([D.fonts.load('800 100px Archivo'), D.fonts.load('400 12px "JetBrains Mono"')]).then(function () { return D.fonts.ready; }) : Promise.resolve();
  fontes.then(start, start);
})();
