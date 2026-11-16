/* 생존을 위한 최소한의 AI 교양 — 슬라이드 엔진
   무대 1920×1080 을 화면에 맞춰 축소한다. 슬라이드마다 [등장, 단계1, 단계2…] 타임라인을 갖는다. */
(() => {
  const W = 1920, H = 1080;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = (window.Deck = {
    defs: {}, ctx: [], cur: -1, step: 0, scale: 1, sound: false,
    pointer: { x: W / 2, y: H / 2, moved: 0 }, $, $$,
  });
  let stage, trans = null, nav;

  D.define = (id, def) => { D.defs[id] = def; };
  D.tl = (o = {}) => gsap.timeline({ paused: true, defaults: { ease: 'power3.out', duration: 0.7 }, ...o });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  D.clamp = clamp;

  /* ---------- 한글 타자: ㄱ → 기 → 긱 처럼 자모가 조립되며 찍힌다 ---------- */
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function parse(src) {
    let plain = '', ranges = [], open = -1;
    for (const ch of src.replace(/\\n/g, '\n')) {
      if (ch === '{') open = plain.length;
      else if (ch === '}') ranges.push([open, plain.length]);
      else plain += ch;
    }
    return { plain, ranges };
  }
  function frames(plain) {
    const out = [{ n: 0, tail: '' }];
    for (let i = 0; i < plain.length; i++) {
      const c = plain.charCodeAt(i);
      if (c >= 0xac00 && c <= 0xd7a3) {
        const k = c - 0xac00, cho = Math.floor(k / 588), jung = Math.floor((k % 588) / 28), jong = k % 28;
        out.push({ n: i, tail: CHO[cho] });
        if (jong) out.push({ n: i, tail: String.fromCharCode(0xac00 + cho * 588 + jung * 28) });
      }
      out.push({ n: i + 1, tail: '' });
    }
    return out;
  }
  function renderTyped(plain, ranges, f) {
    const s = plain.slice(0, f.n) + f.tail;
    let html = '', inEm = false;
    for (let i = 0; i < s.length; i++) {
      const em = ranges.some(([a, b]) => i >= a && i < b);
      if (em !== inEm) { html += em ? '<em>' : '</em>'; inEm = em; }
      html += s[i] === '\n' ? '<br>' : s[i];
    }
    return html + (inEm ? '</em>' : '');
  }
  /** data-type 문자열을 타자하는 트윈. 줄 높이를 미리 잡아 두어 아래 요소가 밀리지 않는다. */
  D.typed = (el, { dur, text } = {}) => {
    const { plain, ranges } = parse(text || el.dataset.type || '');
    const fr = frames(plain), last = fr.length - 1;
    el.innerHTML = renderTyped(plain, ranges, fr[last]);
    el.style.minHeight = el.offsetHeight + 'px';
    el.innerHTML = '';
    const o = { i: 0 }; let shown = 0;
    return gsap.to(o, {
      i: last, duration: dur || Math.max(0.5, last * 0.03), ease: 'none',
      onUpdate() {
        const k = Math.round(o.i);
        if (k === shown) return;
        if (k > shown && k % 3 === 0) D.sfx('tick');
        shown = k; el.innerHTML = renderTyped(plain, ranges, fr[k]);
      },
    });
  };
  /** 암호가 풀리듯 무작위 글자에서 제 글자로 */
  D.scramble = (el, text, dur = 1.3) => {
    const pool = '갇낟닫랃맏받삳앋잗찯칻탇팓핟긔늬븨ABDEGHKMNQRSTVXZ';
    const o = { p: 0 }; el.textContent = '';
    return gsap.to(o, {
      p: 1, duration: dur, ease: 'none',
      onUpdate() {
        let s = '';
        for (let i = 0; i < text.length; i++) {
          const th = (i / text.length) * 0.6;
          if (text[i] === ' ' || o.p >= th + 0.4) s += text[i];
          else if (o.p > th) s += pool[(Math.random() * pool.length) | 0];
          else s += ' ';
        }
        el.textContent = o.p <= 0 ? '' : s;
      },
    });
  };
  D.count = (el, from, to, dur = 1.4, fmt = (v) => Math.round(v).toLocaleString('ko-KR'), ease = 'power4.out') => {
    const o = { v: from }; el.textContent = fmt(from);
    return gsap.to(o, { v: to, duration: dur, ease, onUpdate() { el.textContent = fmt(o.v); } });
  };
  D.split = (el, text) => {
    el.innerHTML = [...(text || el.dataset.split || el.textContent)]
      .map((c) => (c === ' ' ? '<span class="sp">&nbsp;</span>' : `<span class="ch">${c}</span>`)).join('');
    return $$('.ch', el);
  };

  /* ---------- 소리(기본 꺼짐) ---------- */
  let ac;
  D.sfx = (type) => {
    if (!D.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const P = { key: [170, 55, 0.09, 0.22, 'square'], tick: [1900, 800, 0.022, 0.035, 'square'], lamp: [620, 600, 0.2, 0.07, 'sine'],
        bell: [1568, 1560, 0.7, 0.1, 'sine'], thud: [95, 40, 0.18, 0.3, 'sine'], flip: [520, 260, 0.06, 0.08, 'triangle'] }[type];
      if (!P) return;
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = P[4]; o.frequency.setValueAtTime(P[0], t); o.frequency.exponentialRampToValueAtTime(P[1], t + P[2]);
      g.gain.setValueAtTime(P[3], t); g.gain.exponentialRampToValueAtTime(0.0001, t + P[2]);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + P[2] + 0.02);
    } catch (e) { /* 소리는 없어도 된다 */ }
  };

  /* ---------- 무대 ---------- */
  function fit() {
    D.scale = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${D.scale})`;
  }
  function toStage(e) {
    const r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) / D.scale, y: (e.clientY - r.top) / D.scale };
  }
  D.toStage = toStage;

  function transition(a, b, type, dir) {
    if (trans) trans.progress(1);
    b.style.visibility = 'visible';
    if (!a) return;
    a.style.zIndex = 1; b.style.zIndex = 2;
    const tl = gsap.timeline({ onComplete() {
      a.style.visibility = 'hidden';
      gsap.set([a, b], { clearProps: 'transform,opacity,clipPath,zIndex' });
      trans = null;
    } });
    if (type === 'iris') {
      tl.fromTo(b, { clipPath: 'circle(0px at 960px 470px)' }, { clipPath: 'circle(1250px at 960px 470px)', duration: 1.0, ease: 'power3.inOut' }, 0)
        .to(a, { scale: 0.96, duration: 1.0, ease: 'power2.in' }, 0);
    } else {
      tl.fromTo(b, { x: dir * 1960, rotation: dir * 2.4, transformOrigin: '50% 130%' }, { x: 0, rotation: 0, duration: 0.8, ease: 'power4.out' }, 0)
        .to(a, { x: -dir * 560, rotation: -dir * 1.6, opacity: 0, transformOrigin: '50% 130%', duration: 0.55, ease: 'power2.in' }, 0);
    }
    trans = tl;
  }

  function show(i, dir = 1, atEnd = false) {
    i = clamp(i, 0, D.ctx.length - 1);
    if (i === D.cur) return;
    const A = D.ctx[D.cur], B = D.ctx[i];
    if (A) { A.cleanup && A.cleanup(); A.cleanup = null; A.def.leave && A.def.leave(A.el, A); A.tls.forEach((t) => t.pause()); }
    for (let k = B.tls.length - 1; k >= 0; k--) B.tls[k].pause().progress(0);
    if (atEnd) B.tls.forEach((t) => t.progress(1));
    D.cur = i; D.step = atEnd ? B.steps : 0;
    const night = B.el.classList.contains('night');
    stage.classList.toggle('is-night', night); document.body.classList.toggle('is-night', night);
    transition(A && A.el, B.el, A && (B.trans === 'iris' || A.trans === 'iris') ? 'iris' : 'slip', dir);
    if (!atEnd) B.tls[0].timeScale(1).play(0);
    if (B.def.live) B.cleanup = B.def.live(B.el, B) || null;
    B.def.enter && B.def.enter(B.el, B, { dir, atEnd });
    chrome();
    history.replaceState(null, '', '#' + (i + 1));
  }
  D.go = (i) => show(i, i > D.cur ? 1 : -1);
  D.next = () => {
    const c = D.ctx[D.cur];
    if (D.step < c.steps) {
      D.step++; c.tls[D.step].timeScale(1).play();
      c.def.step && c.def.step(D.step, c, true); chrome();
    } else if (D.cur < D.ctx.length - 1) show(D.cur + 1, 1);
  };
  D.prev = () => {
    const c = D.ctx[D.cur];
    if (D.step > 0) {
      c.tls[D.step].timeScale(2.4).reverse(); D.step--;
      c.def.step && c.def.step(D.step, c, false); chrome();
    } else if (D.cur > 0) show(D.cur - 1, -1, true);
  };

  /* ---------- 하단 테이프: 헤드가 지나간 칸에 1을 쓴다 ---------- */
  function buildChrome() {
    nav = document.createElement('nav'); nav.className = 'tape';
    nav.innerHTML = `
      <div class="tp-side l"><a class="tp-home" href="../">목록</a><span class="tp-title"></span></div>
      <button class="tp-arrow" data-d="-1" aria-label="이전">←</button>
      <div class="tp-cells">${D.ctx.map((c, i) => `<button class="tp-cell" data-i="${i}" title="${String(i + 1).padStart(2, '0')} ${c.title}"><b>0</b></button>`).join('')}<i class="tp-head"></i></div>
      <button class="tp-arrow" data-d="1" aria-label="다음">→</button>
      <div class="tp-side r"><span class="tp-steps"></span><button class="tp-btn" data-act="snd">소리 켜기</button><button class="tp-btn" data-act="fs">전체 화면</button></div>`;
    stage.appendChild(nav);
    nav.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.d) (+t.dataset.d > 0 ? D.next : D.prev)();
      else if (t.dataset.i) D.go(+t.dataset.i);
      else if (t.dataset.act === 'fs') (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch?.(() => {});
      else if (t.dataset.act === 'snd') { D.sound = !D.sound; t.textContent = D.sound ? '소리 끄기' : '소리 켜기'; D.sfx('bell'); }
    });
  }
  function chrome() {
    const c = D.ctx[D.cur];
    $$('.tp-cell', nav).forEach((el, i) => { const on = i <= D.cur; el.classList.toggle('on', on); el.firstChild.textContent = on ? '1' : '0'; });
    gsap.to($('.tp-head', nav), { x: D.cur * 34, duration: 0.55, ease: 'back.out(1.6)' });
    $('.tp-title', nav).textContent = `${String(D.cur + 1).padStart(2, '0')} / ${D.ctx.length} · ${c.title}`;
    $('.tp-steps', nav).innerHTML = Array.from({ length: c.steps }, (_, k) => `<i class="${k < D.step ? 'on' : ''}"></i>`).join('');
    $$('.tp-arrow', nav)[1].classList.toggle('more', D.step < c.steps);
  }

  /* ---------- 입력 ---------- */
  function bind() {
    addEventListener('resize', fit);
    addEventListener('pointermove', (e) => { const p = toStage(e); D.pointer.x = p.x; D.pointer.y = p.y; D.pointer.moved = performance.now(); });
    addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button'); if (b) b.blur(); });
    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.matches && e.target.matches('input,textarea')) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); D.next(); return; }
      if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); D.prev(); return; }
      if (k === 'Home') { D.go(0); return; }
      if (k === 'End') { D.go(D.ctx.length - 1); return; }
      const c = D.ctx[D.cur];
      if (c && c.def.key && c.def.key(e, c)) { e.preventDefault(); return; }
      if (k === 'f' || k === 'F') $('[data-act=fs]', nav).click();
    });
    let sx = 0, sy = 0, ok = false;
    addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; ok = !e.target.closest('[data-nodrag],input,button,.tape'); }, { passive: true });
    addEventListener('touchend', (e) => {
      if (!ok) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? D.next : D.prev)();
    }, { passive: true });
    addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n && n - 1 !== D.cur) D.go(n - 1); });
  }

  D.start = async () => {
    stage = $('#stage'); fit();
    const txt = $$('[data-type],[data-split],[data-scr]').map((e) => e.dataset.type || e.dataset.split || e.dataset.scr).join('') + '0123456789';
    try {
      await Promise.race([
        Promise.all([document.fonts.load('900 40px Hahmlet', txt), document.fonts.load('700 40px Hahmlet', txt), document.fonts.load('300 40px Hahmlet', txt),
          document.fonts.load('700 40px "JetBrains Mono"', 'A0'), document.fonts.load('700 40px "Nanum Gothic Coding"', txt), document.fonts.ready]),
        new Promise((r) => setTimeout(r, 3500)),
      ]);
    } catch (e) { /* 폰트가 늦어도 진행 */ }
    $$('.slide', stage).forEach((el, i) => D.ctx.push({ el, i, def: D.defs[el.id] || {}, title: el.dataset.title || el.id, trans: el.dataset.trans || 'slip', tls: [] }));
    D.ctx.forEach((c) => {
      c.tls = (c.def.build && c.def.build(c.el, c)) || [];
      if (!c.tls.length) c.tls = [D.tl()];
      c.steps = c.tls.length - 1;
    });
    buildChrome(); bind();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.globalTimeline.timeScale(6);
    show(clamp((parseInt(location.hash.slice(1), 10) || 1) - 1, 0, D.ctx.length - 1), 1, false);
    document.body.classList.add('ready');
  };
})();
