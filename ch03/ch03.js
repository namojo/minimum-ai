/* 3장 — 슬라이드별 움직임과 조작 */
(() => {
  const D = Deck, { $, $$ } = D;
  const kick = (tl, el) => tl.from($('.kicker', el), { x: -50, opacity: 0, duration: 0.6 }, 0);
  const esc = (s) => s.replace(/[&<>{}]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '{': '', '}': '' }[ch]));
  const ko = (n) => Math.round(n).toLocaleString('ko-KR');
  const NOW = new Date().getFullYear();
  const RED = '#E23D1F', INK = '#17130F';

  /* 책이 나눈 다섯 계절 */
  const SEASONS = [
    { k: 'sp', name: '첫 번째 봄', a: 1950, b: 1974 },
    { k: 'wi', name: '첫 번째 겨울', a: 1974, b: 1980 },
    { k: 'sp', name: '두 번째 봄', a: 1980, b: 1987 },
    { k: 'wi', name: '두 번째 겨울', a: 1987, b: 1993 },
    { k: 'sp', name: '세 번째 봄', a: 2012, b: NOW },
  ];
  const GAP = { k: 'gap', name: '겨울과 봄 사이' };

  /* 오른쪽 위 계절 표시 */
  $$('.slide[data-season]').forEach((el) => {
    const d = document.createElement('div'); d.className = 'sz';
    d.innerHTML = SEASONS.map((s, i) => `<i class="${s.k}${i + 1 === +el.dataset.season ? ' on' : ''}">${s.k === 'sp' ? '봄' : '겨울'}</i>`).join('');
    el.appendChild(d);
  });

  /* 눈과 꽃잎: 겨울은 느리게 곧장 내리고, 봄은 빠르게 비껴 날린다 */
  function drift(el, kind, n, o = {}) {
    const x0 = o.x0 || 0, x1 = o.x1 || 1920, y0 = o.y0 || 0, y1 = o.y1 || 1000, snow = kind === 'snow';
    const lay = document.createElement('div'); lay.className = 'atmo ' + kind;
    const ps = Array.from({ length: n }, () => {
      const i = document.createElement('i'), s = snow ? 5 + Math.random() * 9 : 10 + Math.random() * 10;
      i.style.width = s + 'px'; i.style.height = (snow ? s : s * 0.6) + 'px'; lay.appendChild(i);
      return { i, x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0), ph: Math.random() * 6.28, v: snow ? 14 + Math.random() * 24 : 36 + Math.random() * 50 };
    });
    el.appendChild(lay);
    const tick = (time, dt) => {
      const d = Math.min(dt || 0, 60) / 1000;
      ps.forEach((p) => {
        p.y += p.v * d; p.x += (snow ? Math.sin(time * 0.6 + p.ph) * 9 : 26 + Math.sin(time * 1.3 + p.ph) * 34) * d;
        if (p.y > y1) { p.y = y0 - 14; p.x = x0 + Math.random() * (x1 - x0); }
        if (p.x > x1) p.x = x0;
        p.i.style.transform = `translate(${p.x}px,${p.y}px) rotate(${snow ? 0 : (time * 50 + p.ph * 57) % 360}deg)`;
      });
    };
    tick(0, 0);
    return { lay, start() { gsap.ticker.add(tick); }, stop() { gsap.ticker.remove(tick); } };
  }
  const withAtmo = (c, ...ds) => { ds.forEach((d) => d.start()); return () => ds.forEach((d) => d.stop()); };

  /* ───────── 01 표지 ───────── */
  D.define('cover', {
    build(el, c) {
      c.snow = drift(el, 'snow', 16, { x0: 1030, x1: 1490, y0: 190, y1: 800 });
      c.pet = drift(el, 'petal', 12, { x0: 1540, x1: 1930, y0: 190, y1: 820 });
      const tl = D.tl(); kick(tl, el);
      tl.from($('.cover-print', el), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'power3.inOut' }, 0)
        .from($('.cover-print img', el), { scale: 1.22, duration: 2.4, ease: 'power2.out' }, 0)
        .from([c.snow.lay, c.pet.lay], { opacity: 0, duration: 1.2 }, 1.1)
        .add(D.typed($('.cover-title', el), { dur: 2.2 }), 0.6)
        .from($('.cover-seal', el), { scale: 0, rotation: -140, duration: 0.8, ease: 'back.out(2)' }, 1.0)
        .from($('.cover-sub', el), { y: 30, opacity: 0 }, 2.7)
        .from($('.cover-note', el), { y: 330, rotation: -16, duration: 0.9, ease: 'back.out(1.3)' }, 3.0);
      return [tl];
    },
    live(el, c) {
      const img = $('.cover-print img', el), seal = $('.cover-seal', el), title = $('.cover-title', el);
      const qx = gsap.quickTo(img, 'x', { duration: 1, ease: 'power3' }), qy = gsap.quickTo(img, 'y', { duration: 1, ease: 'power3' });
      const sx = gsap.quickTo(seal, 'x', { duration: 1.4, ease: 'power3' });
      const tick = () => {
        qx((D.pointer.x - 960) * -0.024); qy((D.pointer.y - 540) * -0.024); sx((D.pointer.x - 960) * 0.012);
        // 타자가 끝나면 '죽었다가'는 가늘어졌다 돌아오고, '살아났을까'는 주홍으로 물든다
        if (!$('.die', title) && title.textContent.endsWith('살아났을까'))
          title.innerHTML = 'AI는 왜 <em>두 번</em>이나<br><span class="die">죽었다가</span><br><span class="live">살아났을까</span>';
      };
      gsap.ticker.add(tick); c.snow.start(); c.pet.start();
      return () => { gsap.ticker.remove(tick); c.snow.stop(); c.pet.stop(); };
    },
  });

  /* ───────── 02 두 번의 겨울, 세 번의 봄 ───────── */
  D.define('seasons', {
    build(el) {
      const band = $('.band', el), X = (y) => ((y - 1950) / (NOW - 1950)) * 1580, HH = [250, 86, 250, 86, 330];
      let n = 0;
      band.innerHTML = '<i class="base"></i>' + SEASONS.map((s, i) => {
        const sp = s.k === 'sp'; if (sp) n++;
        return `<div class="blk ${s.k}${sp ? ' s' + n : ''}" style="left:${X(s.a)}px;width:${X(s.b) - X(s.a)}px;height:${HH[i]}px">${sp ? '<i class="fill"></i>' : ''}<span>${s.name}</span><b>${sp ? '봄' : '겨울'}</b></div>`;
      }).join('') + '<div class="blk q" style="left:1596px"><b>?</b></div>'
        + [1950, 1974, 1980, 1987, 1993, 2012].map((y) => `<u style="left:${X(y)}px">${y}</u>`).join('') + '<u style="left:1580px">지금</u>';
      const blks = $$('.blk:not(.q)', band);
      const tl = D.tl(); kick(tl, el);
      tl.from($('.ss-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.ss-lead', el), { x: 50, opacity: 0 }, 0.5)
        .from($('.base', band), { scaleX: 0, transformOrigin: '0 50%', duration: 1.3, ease: 'power2.inOut' }, 0.7)
        .from($$('u', band), { opacity: 0, y: 14, stagger: 0.16, duration: 0.4 }, 0.9);
      blks.forEach((b, i) => {
        const sp = b.classList.contains('sp'), t = 1.1 + i * 0.42;
        tl.from(b, { scaleY: 0, duration: sp ? 0.8 : 1.3, ease: sp ? 'back.out(1.5)' : 'power1.out' }, t)
          .from($$('b,span', b), { opacity: 0, duration: sp ? 0.4 : 1 }, t + (sp ? 0.35 : 0.5));
      });
      tl.from($('.ss-cap', el), { opacity: 0 }, 3.2);
      const s1 = D.tl()
        .from($('.blk.q', band), { scaleY: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.6)' }, 0)
        .add(D.typed($('.ss-q', el), { dur: 1.8 }), 0.3);
      return [tl, s1];
    },
  });

  /* ───────── 03 1956년 다트머스 ───────── */
  D.define('dartmouth', {
    build(el, c) {
      c.atmo = drift(el, 'petal', 10);
      c.cards = $$('.lg', el);
      c.cards.forEach((b) => b.addEventListener('click', () => { b.classList.toggle('on'); D.sfx('flip'); }));
      const tl = D.tl(); kick(tl, el);
      tl.from($('.dm-ill', el), { y: 120, rotation: 3, opacity: 0, duration: 1.1, ease: 'power4.out' }, 0.1)
        .from($('.dm-title', el), { y: 60, opacity: 0 }, 0.2)
        .from($('.dm-sub', el), { x: -30, opacity: 0 }, 0.7)
        .from($$('.dm-stat > *', el), { y: 40, opacity: 0, stagger: 0.35, ease: 'back.out(1.6)' }, 1.0);
      const s1 = D.tl()
        .from($('.dm-hypo', el), { y: 300, rotation: -9, autoAlpha: 0, ease: 'back.out(1.2)' }, 0)
        .add(D.typed($('.dm-hypo p', el), { dur: 1.5 }), 0.4);
      const s2 = D.tl()
        .from($('.dm-stamp', el), { scale: 3, autoAlpha: 0, rotation: 16, duration: 0.32, ease: 'power3.in' }, 0)
        .to($('.dm-ill', el), { x: 8, duration: 0.05, yoyo: true, repeat: 3 }, 0.32);
      const s3 = D.tl()
        .from(c.cards, { y: 320, autoAlpha: 0, rotation: () => gsap.utils.random(-12, 12), stagger: 0.09, duration: 0.8, ease: 'back.out(1.2)' }, 0)
        .from($('.dm-foot', el), { autoAlpha: 0 }, 0.8);
      return [tl, s1, s2, s3];
    },
    enter(el, c) { c.cards.forEach((b) => b.classList.remove('on')); },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 04 엘리자 — 낱말을 찾아 정해 둔 대답을 꺼내는 패턴 매칭(시연용 규칙) ───────── */
  const EL_FALL = ['계속 말씀해 보세요.', '그 이야기를 조금 더 해 주시겠어요?', '그렇군요. 그때 어떤 기분이 드셨나요?'];
  const EL_RULES = [
    { re: /엄마|아빠|어머니|아버지|부모|가족|동생|언니|오빠|누나/, key: '‘엄마·아빠·가족’', show: '가족 이야기를 더 들려주세요.', say: () => '가족 이야기를 조금 더 들려주세요.' },
    { re: /꿈/, key: '‘꿈’', show: '그 꿈은 무엇을 뜻할까요?', say: () => '그 꿈이 당신에게 무엇을 뜻한다고 생각하세요?' },
    { re: /(.+?)고 ?싶/, key: '‘○○고 싶다’', show: '왜 ○○고 싶으신가요? (말 되돌려주기)', say: (m) => `왜 ${m[1].trim()}고 싶으신가요?` },
    { re: /항상|맨날|언제나|매일|매번/, key: '‘항상·맨날·매일’', show: '구체적인 예를 들어 주시겠어요?', say: () => '구체적인 예를 하나 들어 주시겠어요?' },
    { re: /지쳤|지친|지쳐|힘들|슬프|슬퍼|우울|외로|불안|의욕|무기력|피곤/, key: '‘지치다·힘들다·우울’', show: '언제부터 그런 기분이셨나요?', say: () => '언제부터 그런 기분이 드셨나요?' },
    { re: /같아|같은|같다/, key: '‘~인 것 같다’', show: '왜 그렇게 생각하시나요?', say: () => '왜 그렇게 생각하시나요?' },
    { re: /\?|까요|나요|가요$/, key: '물음표', show: '그 질문이 왜 중요한가요?', say: () => '그 질문이 당신에게 왜 중요한가요?' },
    { re: /[\s\S]/, key: '아무것도 안 걸리면', show: '계속 말씀해 보세요.', say: (m, k) => EL_FALL[k % 3] },
  ];
  const EL_EX = ['요즘 너무 지쳤어요', '엄마가 저를 이해 못 해요', '회사를 그만두고 싶어요', '어젯밤 이상한 꿈을 꿨어요', '저는 항상 혼자인 것 같아요'];
  D.define('eliza', {
    build(el, c) {
      c.atmo = drift(el, 'petal', 8);
      const log = $('.el-log', el), chips = $('.el-chips', el), form = $('.el-form', el), input = $('input', el), rules = $('.el-rules ol', el);
      chips.innerHTML = EL_EX.map((t) => `<button type="button">${t}</button>`).join('');
      rules.innerHTML = EL_RULES.map((r, i) => `<li>${i + 1}. ${r.key}<u>→ ${r.show}</u></li>`).join('');
      c.timers = []; let fb = 0;
      const add = (cls, html) => {
        const li = document.createElement('li'); li.className = cls; li.innerHTML = html; log.appendChild(li);
        while (log.children.length > 7) log.firstChild.remove();
        gsap.from(li, { y: 30, opacity: 0, duration: 0.3 });
        return li;
      };
      c.say = (raw) => {
        const text = esc(raw.trim().slice(0, 40)); if (!text) return;
        add('me', text); D.sfx('flip');
        const idx = EL_RULES.findIndex((r) => r.re.test(text)), r = EL_RULES[idx];
        const out = r.say(text.match(r.re), fb); if (idx === EL_RULES.length - 1) fb++;
        c.timers.push(setTimeout(() => {
          const li = add('ai', `<small>규칙 ${idx + 1}</small><span></span>`);
          D.typed(li.querySelector('span'), { text: out, dur: Math.max(0.5, out.length * 0.04) });
          $$('li', rules).forEach((x, i) => x.classList.toggle('on', i === idx));
        }, 650));
      };
      c.reset = () => {
        c.timers.forEach(clearTimeout); c.timers = []; fb = 0; log.innerHTML = ''; input.value = '';
        $$('li', rules).forEach((x) => x.classList.remove('on'));
        add('ai', '<span>안녕하세요. 무엇이 마음에 걸리시나요?</span>');
      };
      chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) c.say(b.textContent); });
      form.addEventListener('submit', (e) => { e.preventDefault(); c.say(input.value); input.value = ''; });
      $('[data-act=open]', el).addEventListener('click', () => { if (D.step === 0) D.next(); });

      const tl = D.tl(); kick(tl, el);
      tl.add(D.scramble($('.el-title', el), '엘리자', 1.2), 0.2)
        .from($('.el-en', el), { opacity: 0, x: -30 }, 1.2)
        .from($('.el-lead', el), { opacity: 0, y: 30 }, 1.4)
        .from($('.el-chat', el), { y: 900, rotation: 6, duration: 1.0, ease: 'power4.out' }, 0.4)
        .from($('.el-ill', el), { x: 160, opacity: 0, duration: 1.0 }, 0.7)
        .from($('.el-how', el), { y: 240, rotation: -12, opacity: 0, ease: 'back.out(1.2)' }, 1.8)
        .from($('.el-foot', el), { opacity: 0 }, 2.2);
      const s1 = D.tl()
        .to($('.el-ill', el), { opacity: 0, duration: 0.4 }, 0)
        .from($('.el-rules', el), { x: 560, rotation: 9, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.1)' }, 0.1)
        .from($$('.el-rules li', el), { x: 40, opacity: 0, stagger: 0.06, duration: 0.3 }, 0.5);
      return [tl, s1];
    },
    enter(el, c, o) { c.reset(); el.classList.toggle('open', !!(o && o.atEnd)); },
    step(n, c) { c.el.classList.toggle('open', n >= 1); },
    leave(el, c) { c.timers.forEach(clearTimeout); c.timers = []; $('input', el).blur(); },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 05 약속과 현실 — 약속을 끌어올리면 끈이 팽팽해지다 끊어진다(개념도) ───────── */
  D.define('promise', {
    build(el, c) {
      const rig = $('.pr-rig', el), knob = $('.pr-knob', el), real = $('.pr-real', el), band = $('.pr-band', el), hit = $('.pr-hit', el);
      const notes = $$('.pr-note', el), msg = $('.pr-msg', el), rep = $('.pr-report', el), chill = $('.chill', el), hint = $('.pr-hint', el);
      $('.pr-fund .bars', el).innerHTML = '<i></i>'.repeat(17);
      const bars = $$('.pr-fund .bars i', el);
      const BOT = 890, LEN = 680, TH = [0.3, 0.62, 0.92], REAL = 0.09;
      const MSG = [
        '다트머스 이후, AI 연구에는 골드러시처럼 자본과 열정이 몰려들었습니다.<br><b>주홍 손잡이</b>를 위로 끌어, 약속을 키워 보세요.',
        '약속이 커지는 만큼 연구 자금이 따라 올라옵니다.<br>실제 성과도… 조금은 움직입니다.',
        '‘10년 안에 인간 수준의 AI.’ 자금이 쏟아집니다.<br>약속과 실제 사이의 끈이 늘어나기 시작합니다.',
        '약속은 더 대담해지고, 끈은 점점 가늘어집니다.<br>조금만 더 올려 볼까요?',
        '끈이 떨립니다. 이제 거의 한계입니다.',
      ];
      c.snow = drift(el, 'snow', 30); c.pet = drift(el, 'petal', 10);
      c.o = { h: 0 }; c.tws = [];
      const place = (h) => {
        const ky = BOT - h * LEN, ry = BOT - Math.min(h, 1) * REAL * LEN;
        knob.style.top = ky + 'px'; real.style.top = ry + 'px';
        band.style.top = ky + 'px'; band.style.height = Math.max(0, ry - ky) + 'px'; band.style.width = 46 - 38 * h + 'px';
      };
      c.set = (h) => {
        if (c.snapped) return;
        h = D.clamp(h, 0, 1); c.o.h = h; place(h);
        bars.forEach((b, i) => b.classList.toggle('on', i < Math.round(h * 17)));
        notes.forEach((n, i) => n.classList.toggle('on', h >= TH[i]));
        const k = h < 0.03 ? 0 : h < TH[0] ? 1 : h < TH[1] ? 2 : h < TH[2] ? 3 : 4;
        if (k !== c.k) { c.k = k; msg.innerHTML = MSG[k]; }
        hint.style.opacity = h < 0.03 ? 1 : 0;
        rig.classList.toggle('tense', h > 0.84);
        if (h >= 0.985) c.snap();
      };
      c.snap = () => {
        if (c.snapped) return;
        c.snapped = true; rig.classList.remove('tense'); rig.classList.add('snapped'); D.sfx('thud');
        band.style.height = '0px';
        const f = { h: 1, n: 17 };
        c.tws.push(
          gsap.to(f, { h: REAL, duration: 1.1, ease: 'bounce.out', onUpdate() { knob.style.top = BOT - f.h * LEN + 'px'; } }),
          gsap.to(f, { n: 0, duration: 1.5, delay: 0.5, ease: 'power1.in', onUpdate() { bars.forEach((b, i) => b.classList.toggle('on', i < Math.round(f.n))); } }),
          gsap.to(chill, { opacity: 1, duration: 1.8, delay: 0.3 }),
          gsap.to(c.snow.lay, { autoAlpha: 1, duration: 1.5, delay: 0.3 }),
          gsap.to(c.pet.lay, { autoAlpha: 0, duration: 0.6 }),
          gsap.fromTo(rep, { autoAlpha: 0, y: -620, rotation: -15 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.9, delay: 0.55, ease: 'bounce.out' }),
        );
      };
      c.reset = () => {
        c.tws.forEach((t) => t.kill()); c.tws = [];
        if (c.auto) { c.auto.kill(); c.auto = null; }
        c.snapped = false; c.k = -1; rig.classList.remove('snapped');
        gsap.set(rep, { autoAlpha: 0 }); gsap.set(chill, { opacity: 0 }); gsap.set(c.snow.lay, { autoAlpha: 0 }); gsap.set(c.pet.lay, { autoAlpha: 1 });
        c.set(0);
      };
      let drag = false;
      const at = (e) => c.set((BOT - D.toStage(e).y) / LEN);
      hit.addEventListener('pointerdown', (e) => { e.preventDefault(); if (c.snapped) return; if (c.auto) { c.auto.kill(); c.auto = null; } drag = true; hit.setPointerCapture(e.pointerId); at(e); });
      hit.addEventListener('pointermove', (e) => { if (drag) at(e); });
      hit.addEventListener('pointerup', () => { drag = false; });
      hit.addEventListener('pointercancel', () => { drag = false; });
      $('[data-act=again]', el).addEventListener('click', () => c.reset());
      c.reset();

      const tl = D.tl(); kick(tl, el);
      tl.from($('.pr-title', el), { y: 60, opacity: 0 }, 0.1)
        .from(msg, { y: 40, opacity: 0 }, 0.5)
        .from($('.pr-track', el), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'power3.inOut' }, 0.5)
        .from(bars, { scaleX: 0, opacity: 0, stagger: { each: 0.03, from: 'end' }, duration: 0.4 }, 0.6)
        .from($$('.pr-fund b, .pr-fund small', el), { opacity: 0 }, 1.2)
        .from(real, { scale: 0, duration: 0.4, ease: 'back.out(3)' }, 1.2)
        .from(knob, { scale: 0, duration: 0.5, ease: 'back.out(3)' }, 1.4)
        .from(hint, { autoAlpha: 0, x: -20 }, 1.8)
        .from($('.pr-cap', el), { opacity: 0 }, 1.8);
      return [tl, D.tl()];
    },
    enter(el, c, o) { c.reset(); if (o && o.atEnd) c.set(1); },
    step(n, c, fwd) {
      if (n === 1 && fwd) {
        if (c.snapped) return;
        c.auto = gsap.to(c.o, { h: 1, duration: 2.6 * (1 - c.o.h) + 0.2, ease: 'power1.in', onUpdate() { c.set(c.o.h); } });
      } else if (n === 0) c.reset();
    },
    leave(el, c) { c.tws.forEach((t) => t.kill()); c.tws = []; if (c.auto) { c.auto.kill(); c.auto = null; } },
    live(el, c) { return withAtmo(c, c.snow, c.pet); },
  });

  /* ───────── 06 첫 번째 겨울 ───────── */
  D.define('winter1', {
    build(el, c) {
      c.atmo = drift(el, 'snow', 34);
      const chs = D.split($('.w1-title', el));
      const tl = D.tl(); kick(tl, el);
      tl.from(chs, { opacity: 0, y: 30, stagger: 0.08, duration: 0.5 }, 0.2)
        .from(chs, { fontWeight: 900, color: INK, stagger: 0.16, duration: 2.4, ease: 'power1.inOut' }, 0.9)   // 먹이 빠진다
        .from($('.w1-lead', el), { opacity: 0, duration: 1.6, ease: 'power1.out' }, 1.2)
        .from($('.w1-print', el), { clipPath: 'inset(0% 0% 100% 0%)', duration: 2.2, ease: 'power2.inOut' }, 0.6)
        .from($('.w1-print img', el), { scale: 1.16, duration: 4, ease: 'power1.out' }, 0.6);
      tl.from($('.w1-ask', el), { opacity: 0, y: 20, duration: 1.4, ease: 'power1.out' }, 3.2);
      const s1 = D.tl()
        .from($('.w1-why', el), { opacity: 0, duration: 0.8 }, 0)
        .from($$('.why', el), { opacity: 0, y: 26, stagger: 0.9, duration: 1.3, ease: 'power1.out' }, 0.3);
      const s2 = D.tl()
        .from($('.w1-end', el), { opacity: 0, duration: 1.0 }, 0)
        .from($('.w1-end .st i', el), { scaleX: 0, duration: 0.9, ease: 'power2.inOut' }, 0.9)
        .from($('.w1-end small', el), { opacity: 0, duration: 1.0 }, 1.7);
      return [tl, s1, s2];
    },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 07 두 번째 봄 ───────── */
  D.define('expert', {
    build(el, c) {
      c.atmo = drift(el, 'petal', 10);
      const dots = $('.ex-f500 .dots', el);
      dots.innerHTML = Array.from({ length: 500 }, (_, i) => `<i${i % 25 < 12 ? ' class="h"' : ''}></i>`).join('');
      const on = $$('i.h', dots).sort((a, b) => 0).map((d, k) => ({ d, col: k % 12, row: (k / 12) | 0 })).sort((a, b) => a.col - b.col || a.row - b.row).map((x) => x.d);
      const tl = D.tl(); kick(tl, el);
      tl.from($('.ex-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.ex-lead', el), { x: 50, opacity: 0 }, 0.5)
        .from($('.ex-ill', el), { x: -220, rotation: -5, opacity: 0, duration: 1.0, ease: 'back.out(1.1)' }, 0.4)
        .from($('.ex-my', el), { y: 420, rotation: 8, opacity: 0, duration: 0.9, ease: 'back.out(1.2)' }, 0.8)
        .from($('.ex-acc', el), { scale: 0.4, opacity: 0, transformOrigin: '0 80%', duration: 0.5, ease: 'back.out(2)' }, 1.5)
        .from($('.ex-scale i', el), { scaleX: 0, duration: 0.6, ease: 'power3.out' }, 1.8)
        .from($('.ex-vs', el), { opacity: 0, y: 20 }, 2.1);
      const s1 = D.tl()
        .from($('.ex-f500', el), { autoAlpha: 0, y: 40, duration: 0.5 }, 0)
        .from(on, { backgroundColor: 'rgba(23,19,15,0.2)', scale: 0.4, duration: 0.3, stagger: { amount: 1.5 } }, 0.3);
      const s2 = D.tl().add(D.typed($('.ex-q', el), { dur: 1.3 }), 0);
      return [tl, s1, s2];
    },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 08 규칙의 무게 — 규칙이 늘수록 법 개정 한 번에 손볼 곳이 불어난다(시연) ───────── */
  D.define('rules', {
    build(el, c) {
      const grid = $('.ru-grid', el), msg = $('.ru-msg', el), nEl = $('.ru-head .n', el), rEl = $('.ru-head .r', el), tbar = $('.timer u', el);
      const mt = $('.ru-cost .mt', el), mtl = $('.ru-cost b', el), mrow = mt.parentNode, bRev = $('[data-act=revise]', el), bGrow = $('[data-act=grow]', el);
      const ST = [[6, 4], [12, 8], [24, 16], [48, 32]], OP = 40, SEC = 9;
      const S = { st: 0, stale: new Set(), cum: 0, auto: 0 };
      const count = () => ST[S.st][0] * ST[S.st][1];
      const upd = () => {
        rEl.textContent = ko(S.stale.size);
        const ratio = S.cum / OP; mt.style.width = Math.min(ratio * 120, 470) + 'px';
        mrow.classList.toggle('over', ratio >= 1.6);
        mtl.textContent = ratio >= 1 ? `운영 비용의 ${ratio.toFixed(1)}배` : '';
        bGrow.disabled = S.st >= 3; bRev.classList.toggle('go', !S.stale.size && !c.tm);
      };
      const draw = () => {
        const n = count();
        grid.style.gridTemplateColumns = `repeat(${ST[S.st][0]},1fr)`; grid.dataset.st = S.st;
        grid.innerHTML = Array.from({ length: n }, (_, i) => `<i data-k="${i}">${S.st < 2 ? `<b>${S.st ? '' : '규칙 '}${String(i + 1).padStart(2, '0')}</b>` : ''}</i>`).join('');
        nEl.textContent = ko(n); S.stale.clear();
        if (S.st < 2) gsap.from(grid.children, { opacity: 0, scale: 0.7, duration: 0.3, stagger: { amount: 0.4, from: 'random' } });
      };
      const stopTimer = () => { if (c.tm) { c.tm.kill(); c.tm = null; } gsap.set(tbar, { scaleX: 0 }); };
      const revise = (auto) => {
        const n = count(), cells = grid.children, want = n / 4; let added = 0, guard = 0;
        while (added < want && guard++ < n * 20) {
          const i = (Math.random() * n) | 0;
          if (!S.stale.has(i)) { S.stale.add(i); cells[i].classList.remove('ok'); cells[i].classList.add('bad'); added++; }
          if (S.stale.size >= n) break;
        }
        S.cum += added; D.sfx('bell');
        stopTimer();
        c.tm = gsap.fromTo(tbar, { scaleX: 1 }, { scaleX: 0, duration: SEC, ease: 'none', onComplete: expire });
        msg.innerHTML = auto
          ? `다 고치기도 전에 <b>법이 또 바뀌었습니다.</b> 손봐야 할 규칙이 ${ko(S.stale.size)}개로 불어났습니다.`
          : `법이 바뀌었습니다. 빨갛게 변한 규칙 <b>${ko(S.stale.size)}개</b>를 하나하나 눌러(문질러) 고치세요. 다음 개정까지 ${SEC}초.`;
        if (S.cum / OP >= 1) msg.innerHTML += ' <b>유지보수 비용이 운영 비용을 넘어섰습니다.</b>';
        upd();
      };
      function expire() {
        c.tm = null;
        if (!S.stale.size) return;
        if (S.auto < 2) { S.auto++; revise(true); }
        else { msg.innerHTML = `규칙 ${ko(S.stale.size)}개가 낡은 채로 남았습니다. 이 시스템의 답은 이제 믿을 수 없습니다. <b>고치는 손이 법 개정을 따라가지 못합니다.</b>`; upd(); }
      }
      const fix = (cell) => {
        const i = +cell.dataset.k; if (!S.stale.has(i)) return;
        S.stale.delete(i); cell.classList.remove('bad'); cell.classList.add('ok'); D.sfx('tick');
        if (!S.stale.size) {
          stopTimer(); S.auto = 0;
          msg.innerHTML = S.st < 3
            ? '다 고쳤습니다. 이 정도면 할 만하죠.<br>더 똑똑한 시스템을 위해 <b>규칙을 늘려</b> 봅시다.'
            : '전부 고치셨군요. 대단합니다. 그런데 법은 내일도 바뀝니다.';
        }
        upd();
      };
      c.reset = () => {
        stopTimer(); S.st = 0; S.cum = 0; S.auto = 0; draw(); upd();
        msg.innerHTML = '규칙 24개짜리 작은 법률 전문가 시스템입니다.<br>먼저 <b>‘법 개정!’</b>을 눌러 보세요.';
      };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('.ru-btns .btn'); if (!b) return;
        if (b.dataset.act === 'revise') { S.auto = 0; revise(false); }
        else if (b.dataset.act === 'grow' && S.st < 3) {
          stopTimer(); S.st++; S.auto = 0; draw(); upd();
          msg.innerHTML = `규칙이 <b>${ko(count())}개</b>가 됐습니다. 아는 것이 늘어난 만큼 쓸모도 커졌습니다.<br>그런데 — 법은 또 바뀝니다.`;
        } else if (b.dataset.act === 'reset') c.reset();
      });
      let drag = false;
      const hitCell = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY), cell = t && t.closest && t.closest('.ru-grid i'); if (cell) fix(cell); };
      grid.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = true; grid.setPointerCapture(e.pointerId); hitCell(e); });
      grid.addEventListener('pointermove', (e) => { if (drag) hitCell(e); });
      grid.addEventListener('pointerup', () => { drag = false; });
      grid.addEventListener('pointercancel', () => { drag = false; });
      c.stop = stopTimer; c.S = S;
      c.reset();

      const tl = D.tl(); kick(tl, el);
      tl.from($('.ru-title', el), { y: 60, opacity: 0 }, 0.1)
        .from(msg, { y: 30, opacity: 0 }, 0.5)
        .from($('.ru-book', el), { x: 1100, rotation: 4, duration: 1.0, ease: 'power4.out' }, 0.3)
        .from($$('.ru-btns .btn', el), { y: 40, opacity: 0, stagger: 0.1, clearProps: 'transform,opacity' }, 0.9)
        .from($('.ru-cost', el), { opacity: 0, y: 30 }, 1.2);
      const s1 = D.tl().from($('.ru-note', el), { y: 320, rotation: 6, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.1)' });
      return [tl, s1];
    },
    enter(el, c) { c.reset(); },
    leave(el, c) { c.stop(); },
  });

  /* ───────── 09 두 번째 겨울 ───────── */
  const W2 = [
    ['인공지능', '연구자들은 자신의 논문에서 ‘인공지능’이라는 말을 지우기 시작했습니다.'],
    ['기계 학습', '‘기계 학습’ — 중립적인 표현입니다. 이름을 바꿔서라도 연구를 계속하겠다는 집념이었습니다.'],
    ['인지 시스템', '‘인지 시스템’ — 과도한 약속이 만든 기대와 실망이 수면 위로 떠오르자, ‘인공지능’은 피하고 싶은 이름이 됐습니다.'],
  ];
  D.define('winter2', {
    build(el, c) {
      c.atmo = drift(el, 'snow', 34);
      const doms = $$('.dom', el), word = $('.w2-word span', el), say = $('.w2-paper .say', el), hint = $('.w2-paper .hint', el);
      c.setWord = (i, anim) => {
        c.wi = i; if (c.wt) c.wt.kill();
        if (anim) c.wt = D.scramble(word, W2[i][0], 0.6); else word.textContent = W2[i][0];
        say.textContent = i === 0 && anim ? '그리고 이 이름은, 훗날 다시 돌아옵니다.' : W2[i][1];
      };
      $('.w2-word', el).addEventListener('click', () => { c.setWord((c.wi + 1) % 3, true); hint.style.visibility = 'hidden'; D.sfx('flip'); });
      c.hint = hint;
      const tl = D.tl(); kick(tl, el);
      tl.from($('.w2-year', el), { opacity: 0, y: -50, duration: 1.4, ease: 'power1.out' }, 0.1)
        .from($('.w2-title', el), { opacity: 0, duration: 1.4 }, 0.8)
        .from(doms, { y: -360, autoAlpha: 0, stagger: 0.22, duration: 0.9, ease: 'bounce.out' }, 0.6)
        .to(doms, { rotation: (i) => [13, 10, 7][i], transformOrigin: '100% 100%', duration: 0.75, stagger: 0.3, ease: 'power2.in' }, 2.3);
      tl.from($('.w2-paper', el), { x: 900, rotation: 10, autoAlpha: 0, duration: 1.1, ease: 'power3.out' }, 3.3);
      const s1 = D.tl().from($('.w2-term', el), { y: 360, rotation: -8, autoAlpha: 0, duration: 1.0, ease: 'power3.out' });
      return [tl, s1];
    },
    enter(el, c) { c.setWord(0, false); c.hint.style.visibility = ''; },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 10 꺼지지 않은 불(밤) ───────── */
  D.define('hinton', {
    build(el, c) {
      c.atmo = drift(el, 'snow', 40);
      const wall = $('.hi-wall', el), cap = $('.hi-cap', el), KEEP = 16;
      wall.innerHTML = Array.from({ length: 40 }, (_, i) => `<button${i === KEEP ? ' class="lit"' : ''} aria-label="창문">${i === KEEP ? '<span>인공 신경망</span>' : ''}</button>`).join('');
      const wins = $$('button', wall), lit = wins[KEEP], others = wins.filter((w) => w !== lit);
      const CAP0 = cap.textContent;
      wall.addEventListener('click', (e) => {
        const w = e.target.closest('button'); if (!w) return;
        if (w === lit) {
          gsap.fromTo(w, { opacity: 0.15 }, { keyframes: [{ opacity: 1, duration: 0.07 }, { opacity: 0.2, duration: 0.06 }, { opacity: 1, duration: 0.07 }, { opacity: 0.4, duration: 0.05 }, { opacity: 1, duration: 0.4 }] });
          cap.textContent = '이 불은, 두 번의 겨울 내내 꺼지지 않았습니다';
        } else {
          gsap.fromTo(w, { backgroundColor: '#FFC65A' }, { backgroundColor: '#1B1814', duration: 1.1, ease: 'power2.in' });
          cap.textContent = '잠깐 켜졌다가, 다시 꺼집니다';
        }
        D.sfx('lamp');
      });
      c.cap = cap; c.CAP0 = CAP0;
      const tl = D.tl(); kick(tl, el);
      tl.from($('.hi-name', el), { opacity: 0, y: 60, duration: 1.0 }, 0.6)
        .from($('.hi-en', el), { opacity: 0, x: -30 }, 1.2)
        .from(wall, { opacity: 0, duration: 0.8 }, 0.5)
        .from(others, { backgroundColor: '#FFC65A', borderColor: '#FFC65A', duration: 0.7, stagger: { each: 0.055, from: 'random' }, ease: 'power2.in' }, 1.3)
        .from($('span', lit), { opacity: 0, duration: 0.8 }, 3.6)
        .from($('.hi-lead', el), { opacity: 0, y: 30, duration: 0.9 }, 2.2)
        .from($('.hi-q', el), { opacity: 0, x: -40, duration: 1.0 }, 3.2)
        .from(cap, { opacity: 0 }, 4.0);
      const s1 = D.tl()
        .from($('.hi-tl', el), { scaleX: 0, transformOrigin: '0 0', duration: 0.9, ease: 'power3.inOut' }, 0)
        .from($$('.hi-tl li', el), { autoAlpha: 0, y: 30, stagger: 0.28, duration: 0.6 }, 0.4);
      return [tl, s1];
    },
    enter(el, c) { c.cap.textContent = c.CAP0; },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 11 딥러닝 — 아주 작은 신경망(2→12→8→1)이 점의 경계를 스스로 찾는다 ───────── */
  /*NET*/
  function makeNet() {
    const L = [2, 12, 8, 1], nl = L.length - 1, A = L.map((n) => new Float64Array(n));
    let W, B, M, V, t;
    const init = () => {
      t = 0; W = []; B = []; M = []; V = [];
      for (let l = 0; l < nl; l++) {
        const n = L[l] * L[l + 1], sc = Math.sqrt(6 / (L[l] + L[l + 1])) * 1.5;
        W.push(Float64Array.from({ length: n }, () => (Math.random() * 2 - 1) * sc));
        B.push(Float64Array.from({ length: L[l + 1] }, () => (Math.random() * 2 - 1) * 0.4));
        M.push([new Float64Array(n), new Float64Array(L[l + 1])]); V.push([new Float64Array(n), new Float64Array(L[l + 1])]);
      }
    };
    const fwd = (x, y) => {
      A[0][0] = x; A[0][1] = y;
      for (let l = 0; l < nl; l++) {
        const a = A[l], o = A[l + 1], w = W[l], b = B[l], n = L[l], m = L[l + 1];
        for (let j = 0; j < m; j++) { let s = b[j]; for (let i = 0; i < n; i++) s += w[j * n + i] * a[i]; o[j] = l === nl - 1 ? 1 / (1 + Math.exp(-s)) : Math.tanh(s); }
      }
      return A[nl][0];
    };
    const step = (pts, lr = 0.02) => {
      if (!pts.length) return;
      const gW = W.map((w) => new Float64Array(w.length)), gB = B.map((b) => new Float64Array(b.length));
      for (const [x, y, lab] of pts) {
        let del = Float64Array.of(fwd(x, y) - lab);
        for (let l = nl - 1; l >= 0; l--) {
          const a = A[l], n = L[l], m = L[l + 1], w = W[l], prev = new Float64Array(n);
          for (let j = 0; j < m; j++) { const dj = del[j]; gB[l][j] += dj; for (let i = 0; i < n; i++) { gW[l][j * n + i] += dj * a[i]; prev[i] += dj * w[j * n + i]; } }
          if (l > 0) for (let i = 0; i < n; i++) prev[i] *= 1 - a[i] * a[i];
          del = prev;
        }
      }
      t++; const c1 = 1 - 0.9 ** t, c2 = 1 - 0.999 ** t, k = 1 / pts.length;
      for (let l = 0; l < nl; l++) [[W[l], gW[l], 0], [B[l], gB[l], 1]].forEach(([p, g, q]) => {
        const m = M[l][q], v = V[l][q];
        for (let i = 0; i < p.length; i++) { const gi = g[i] * k; m[i] = 0.9 * m[i] + 0.1 * gi; v[i] = 0.999 * v[i] + 0.001 * gi * gi; p[i] -= (lr * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8); }
      });
    };
    init();
    return { init, fwd, step };
  }
  /*END NET*/
  D.makeNet = makeNet;

  D.define('deep', {
    build(el, c) {
      c.atmo = drift(el, 'petal', 8, { x1: 980 });
      const cv = $('canvas', el), g = cv.getContext('2d'), itEl = $('.it', el), erEl = $('.er', el), bTrain = $('[data-act=train]', el), N = 36;
      const net = makeNet(), S = (c.S = { pts: [], color: 1, train: false, it: 0, dirty: true });
      const preset = () => {
        const a = [];
        for (let k = 0; k < 10; k++) { const an = k * 0.628 + 0.3, r = 0.08 + 0.2 * (((k * 7) % 10) / 10); a.push([Math.cos(an) * r, Math.sin(an) * r, 1]); }
        for (let k = 0; k < 18; k++) { const an = k * 0.349, r = 0.7 + 0.07 * Math.sin(k * 2.1); a.push([Math.cos(an) * r, Math.sin(an) * r, 0]); }
        return a;
      };
      const draw = () => {
        g.clearRect(0, 0, 720, 720);
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const p = net.fwd(((i + 0.5) / N) * 2 - 1, ((j + 0.5) / N) * 2 - 1), s = Math.abs(p - 0.5) * 2;
          g.fillStyle = p > 0.5 ? RED : 'rgba(23,19,15,.5)';
          g.beginPath(); g.arc((i + 0.5) * 20, (j + 0.5) * 20, p > 0.5 ? 1.5 + 6.6 * s : 1.5 + 4.2 * s, 0, 6.2832); g.fill();
        }
        let wrong = 0;
        S.pts.forEach(([x, y, l]) => {
          if ((net.fwd(x, y) > 0.5) !== !!l) wrong++;
          g.beginPath(); g.arc((x + 1) * 360, (y + 1) * 360, 15, 0, 6.2832);
          g.fillStyle = l ? RED : INK; g.fill(); g.lineWidth = 5; g.strokeStyle = '#F6F1E4'; g.stroke();
        });
        itEl.textContent = ko(S.it); erEl.textContent = S.pts.length ? `${wrong}개` : '–';
        S.dirty = false;
      };
      c.frame = () => {
        if (S.train && S.pts.length) { net.step(S.pts, 0.005); S.it += 1; S.dirty = true; }
        if (S.dirty) draw();
      };
      c.setTrain = (on) => { S.train = on; bTrain.textContent = on ? '■ 멈추기' : '▶ 학습시키기'; bTrain.classList.toggle('on', on); };
      c.reset = () => { net.init(); S.pts = preset(); S.it = 0; S.dirty = true; c.setTrain(false); draw(); };
      cv.addEventListener('pointerdown', (e) => {
        const r = cv.getBoundingClientRect();
        if (S.pts.length >= 140) S.pts.shift();
        S.pts.push([((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1, S.color]);
        S.dirty = true; D.sfx('tick');
      });
      el.addEventListener('click', (e) => {
        const pk = e.target.closest('.pk'), b = e.target.closest('.dp-btns .btn');
        if (pk) { S.color = +pk.dataset.c; $$('.pk', el).forEach((x) => x.classList.toggle('on', x === pk)); }
        else if (b) {
          if (b.dataset.act === 'train') c.setTrain(!S.train);
          else if (b.dataset.act === 'clear') { S.pts = []; S.dirty = true; }
          else c.reset();
        }
      });
      c.reset();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.dp-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.dp-lead', el), { y: 40, opacity: 0 }, 0.5)
        .from($('.dp-field', el), { scale: 0.7, rotation: 8, opacity: 0, duration: 0.9, ease: 'back.out(1.3)' }, 0.4)
        .from($$('.dp-ctl > *', el), { x: -50, opacity: 0, stagger: 0.12 }, 1.0)
        .from($('.dp-cap', el), { opacity: 0 }, 1.5);
      const s1 = D.tl()
        .from($('.dp-alex', el), { y: 360, rotation: 5, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.1)' }, 0)
        .from($$('.dp-alex .bar i', el), { scaleX: 0, duration: 0.8, stagger: 0.35, ease: 'power3.out' }, 0.6);
      return [tl, s1];
    },
    enter(el, c) { c.reset(); },
    leave(el, c) { c.setTrain(false); },
    live(el, c) { gsap.ticker.add(c.frame); c.atmo.start(); return () => { gsap.ticker.remove(c.frame); c.atmo.stop(); }; },
  });

  /* ───────── 12 세 번째 봄 ───────── */
  D.define('boom', {
    build(el, c) {
      c.atmo = drift(el, 'petal', 14);
      const tl = D.tl(); kick(tl, el);
      tl.from($('.bm-ill', el), { y: 100, opacity: 0, duration: 1.2, ease: 'power3.out' }, 0.1)
        .from($('.bm-row', el), { x: -40, opacity: 0 }, 0.4)
        .from($('.b1', el), { y: 80, opacity: 0, duration: 0.6 }, 0.8)
        .add(D.count($('.n1', el), 0, 10000, 1.8, (v) => (v >= 9999.5 ? '1억 명' : `${ko(v)}만 명`), 'power2.in'), 0.8)
        .from($('.n1', el), { scale: 1.12, transformOrigin: '0 60%', duration: 0.5, ease: 'back.out(3)' }, 2.6)
        .from($('.b2', el), { y: 80, opacity: 0, duration: 0.6 }, 2.4)
        .add(D.count($('.n2', el), 0, 2500, 1.4, (v) => `${ko(v)}억 달러`), 2.4);
      const s1 = D.tl()
        .from($('.bm-q h3', el), { autoAlpha: 0, y: 30 }, 0)
        .from($('.bm-q .a1', el), { x: 900, rotation: 8, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.1)' }, 0.4);
      const s2 = D.tl().from($('.bm-q .a2', el), { x: 900, rotation: -8, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.1)' }, 0);
      return [tl, s1, s2];
    },
    live(el, c) { return withAtmo(c, c.atmo); },
  });

  /* ───────── 13 70년의 곡선 — 손잡이를 끌면 계절에 따라 화면의 기온이 바뀐다(곡선은 개념도) ───────── */
  const CURVE = [[1950, 0.06], [1972, 0.8], [1979, 0.13], [1986, 0.66], [1992, 0.11], [NOW, 1]];
  const E = (yr) => {
    for (let i = 1; i < CURVE.length; i++) {
      const [a, ea] = CURVE[i - 1], [b, eb] = CURVE[i];
      if (yr <= b) { const t = D.clamp((yr - a) / (b - a), 0, 1); return ea + (eb - ea) * (i === CURVE.length - 1 ? t ** 2.3 : (1 - Math.cos(t * Math.PI)) / 2); }
    }
    return 1;
  };
  const EVENTS = [
    [1950, '봄의 시작 — ‘기계가 인간처럼 생각한다’는 꿈'],
    [1956, '다트머스 회의. ‘인공지능’이라는 이름이 태어나다'],
    [1965, '사이먼 “20년 안에 기계가 인간이 할 수 있는 모든 일을 해낼 것”'],
    [1966, '엘리자 — 패턴 매칭만으로 상담받는 듯한 착각을'],
    [1967, '민스키 “한 세대 안에 인공지능 문제는 실질적으로 해결될 것”'],
    [1973, '라이트힐 보고서 “기대했던 성과를 보여주지 못했다”'],
    [1974, '영국의 자금 삭감, 미국 DARPA도 지원을 끊기 시작하다'],
    [1980, '마이신의 성공에 힘입어, 전문가 시스템의 황금기로'],
    [1984, '‘AI 겨울’이라는 말이 쓰이기 시작하다'],
    [1985, '포춘 500대 기업의 거의 절반이 AI 프로젝트를'],
    [1987, '리스프 머신 시장 붕괴. 5세대 컴퓨터 프로젝트 축소'],
    [1990, '논문에서 ‘인공지능’ 대신 ‘기계 학습’이라고 쓰던 시절', '이 무렵'],
    [1993, '이름 붙지 않은 시간. 힌튼은 신경망 연구를 묵묵히 이어 간다'],
    [2012, '알렉스넷 — 오류율을 거의 절반으로. 세 번째 봄의 시작'],
    [2015, 'ResNet, 인간의 인식 능력을 넘어서다'],
    [2023, '챗GPT, 출시 두 달 만에 사용자 1억 명'],
    [2025, '글로벌 AI 시장 2,500억 달러'],
  ];
  D.define('hype', {
    build(el, c) {
      const svg = $('svg', el), knob = $('.hy-knob', el), chart = $('.hy-chart', el), chill = $('.chill', el), hint = $('.hy-hint', el);
      const yrEl = $('.yr', el), snEl = $('.sn', el), evEl = $('.ev', el);
      const X = (y) => ((y - 1950) / (NOW - 1950)) * 1600, Y = (e) => 400 - e * 350;
      const pts = (a, b) => { let s = ''; for (let y = a; y < b + 0.001; y += 0.25) s += `${X(y).toFixed(1)},${Y(E(y)).toFixed(1)} `; return s; };
      const area = (a, b, fill) => `<polygon points="${X(a)},400 ${pts(a, b)}${X(b)},400" fill="url(#${fill})"/>`;
      svg.innerHTML = `<defs>
          <pattern id="hp-sp" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.4" fill="${RED}"/></pattern>
          <pattern id="hp-wi" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2" fill="rgba(23,19,15,.5)"/></pattern>
          <pattern id="hp-gap" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="1.4" fill="rgba(23,19,15,.3)"/></pattern></defs>`
        + SEASONS.map((s) => area(s.a, s.b, s.k === 'sp' ? 'hp-sp' : 'hp-wi')).join('') + area(1993, 2012, 'hp-gap')
        + `<line class="base" x1="0" y1="400" x2="1600" y2="400"/><polyline class="curve" points="${pts(1950, NOW)}"/>`
        + EVENTS.map(([y]) => `<circle class="evd" cx="${X(y)}" cy="${Y(E(y))}" r="7"/>`).join('')
        + SEASONS.map((s) => `<text class="s-${s.k}" x="${(X(s.a) + X(s.b)) / 2}" y="434" text-anchor="middle">${s.name}</text>`).join('')
        + [1950, 1974, 1980, 1987, 1993, 2012].map((y) => `<text class="y" x="${X(y)}" y="468" text-anchor="middle">${y}</text>`).join('')
        + `<text class="y" x="1600" y="468" text-anchor="middle">지금</text><line class="guide" x1="0" y1="0" x2="0" y2="400"/>`
        + `<g class="pin p1"><text x="${X(1969)}" y="${Y(0.8) - 24}" text-anchor="middle">과도한 기대의 정점</text></g>`
        + `<g class="pin p2"><line x1="${X(1978.6)}" y1="54" x2="${X(1978.6)}" y2="${Y(0.13) - 40}"/><text x="${X(1978.6) + 40}" y="40" text-anchor="middle">환멸의 골짜기</text></g>`
        + `<g class="fork"><path d="M1604 46 Q1640 30 1672 2"/><path d="M1604 54 Q1650 80 1672 170"/><text x="1642" y="146">?</text></g>`;
      const guide = $('.guide', svg);
      c.snow = drift(el, 'snow', 30); c.pet = drift(el, 'petal', 12);
      c.o = { y: 1950 };
      const seasonOf = (yr) => SEASONS.find((s, i) => yr >= s.a && (yr < s.b || i === 4)) || GAP;
      c.set = (yr, quick) => {
        yr = D.clamp(yr, 1950, NOW); c.o.y = yr;
        const x = X(yr), y = Y(E(yr)), r = Math.round(yr);
        knob.style.left = 120 + x + 'px'; knob.style.top = 296 + y + 'px';
        guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('y1', y);
        yrEl.textContent = r >= NOW ? '지금' : r;
        const s = seasonOf(yr);
        if (s !== c.s) {
          c.s = s; snEl.textContent = s.name; el.dataset.k = s.k;
          const d = quick ? 0 : 0.7, wi = s.k === 'wi', gap = s.k === 'gap';
          gsap.to(chill, { opacity: wi ? 0.42 : gap ? 0.2 : 0, duration: d, overwrite: true });
          gsap.to(c.snow.lay, { autoAlpha: wi ? 1 : gap ? 0.35 : 0, duration: d, overwrite: true });
          gsap.to(c.pet.lay, { autoAlpha: s.k === 'sp' ? 1 : 0, duration: d, overwrite: true });
        }
        let ev = EVENTS[0]; for (const e of EVENTS) if (e[0] <= r) ev = e;
        if (ev !== c.ev) { c.ev = ev; evEl.innerHTML = `<b class="mono">${ev[2] || ev[0]}</b> ${ev[1]}`; }
      };
      c.move = (to, dur, delay = 0) => { if (c.tw) c.tw.kill(); c.tw = gsap.to(c.o, { y: to, duration: dur, delay, ease: 'power2.inOut', onUpdate() { c.set(c.o.y); } }); };
      let drag = false;
      const at = (e) => { if (c.tw) { c.tw.kill(); c.tw = null; } c.set(1950 + ((D.toStage(e).x - 120) / 1600) * (NOW - 1950)); };
      chart.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = true; chart.setPointerCapture(e.pointerId); at(e); });
      chart.addEventListener('pointermove', (e) => { if (drag) at(e); });
      chart.addEventListener('pointerup', () => { drag = false; });
      chart.addEventListener('pointercancel', () => { drag = false; });
      c.set(1950, true);

      const curve = $('.curve', svg), len = curve.getTotalLength();
      gsap.set(curve, { strokeDasharray: len });
      const tl = D.tl(); kick(tl, el);
      tl.from($('.hy-read', el), { opacity: 0, y: 40 }, 0.2)
        .from($('.base', svg), { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, ease: 'power3.inOut' }, 0.4)
        .from(curve, { strokeDashoffset: len, duration: 2.4, ease: 'power1.inOut' }, 0.7)
        .from($$('polygon', svg), { opacity: 0, stagger: 0.3, duration: 0.6 }, 0.9)
        .from($$('.evd', svg), { scale: 0, transformOrigin: '50% 50%', stagger: 0.07, duration: 0.3, ease: 'back.out(3)' }, 1.4)
        .from($$('svg > text', el), { opacity: 0, stagger: 0.05, duration: 0.4 }, 1.2)
        .from([knob, guide], { opacity: 0, duration: 0.4 }, 2.6)
        .from(knob, { scale: 0, duration: 0.5, ease: 'back.out(3)' }, 2.6)
        .from(hint, { autoAlpha: 0 }, 3.0)
        .from($('.hy-cap', el), { opacity: 0 }, 3.0);
      const s1 = D.tl()
        .to(hint, { autoAlpha: 0, duration: 0.3 }, 0)
        .from($$('.hy-stage li', el), { autoAlpha: 0, y: 40, stagger: 0.25, ease: 'back.out(1.6)' }, 0.2)
        .from($('.p1', svg), { autoAlpha: 0, y: 30, duration: 0.5 }, 0.9)
        .from($('.p2', svg), { autoAlpha: 0, y: -30, duration: 0.5 }, 2.2);
      const s2 = D.tl()
        .from($$('.fork path', svg), { autoAlpha: 0, duration: 0.6, stagger: 0.2 }, 1.6)
        .from($('.fork text', svg), { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' }, 2.0)
        .from($('.hy-q', el), { autoAlpha: 0, x: 60, duration: 0.7 }, 2.0);
      return [tl, s1, s2];
    },
    enter(el, c, o) { if (c.tw) { c.tw.kill(); c.tw = null; } c.s = null; c.set(o && o.atEnd ? NOW : 1950, true); },
    step(n, c, fwd) {
      if (!fwd) { c.move(n === 0 ? 1950 : 1978, 0.8); return; }
      if (n === 1) { c.move(1972, 1.1, 0.2); gsap.delayedCall(1.9, () => { if (D.ctx[D.cur] === c && D.step === 1) c.move(1978, 0.9); }); }
      else if (n === 2) c.move(NOW, 2.0);
    },
    leave(el, c) { if (c.tw) { c.tw.kill(); c.tw = null; } },
    live(el, c) { return withAtmo(c, c.snow, c.pet); },
  });

  /* ───────── 14 이름을 지어 준 사람 ───────── */
  const NAMES = [
    ['사이버네틱스', '당시 비슷한 연구를 하던 분야에 이미 있던 이름입니다. 매카시는 기존 분야에 종속되지 않는 {독립적인 학문 영역}을 만들고 싶었습니다.'],
    ['자동화', '이것도 이미 쓰이던 이름입니다. 새 분야에는, 다른 학문에 딸려 가지 않을 {완전히 새로운 이름}이 필요했습니다.'],
    ['정보 처리', '역시 이미 있던 분야의 이름입니다. 매카시는 이런 이름들 대신 전혀 다른 말을 골랐습니다.'],
    ['자동 추론기', '책이 상상해 본 이름입니다. 어쩌면 이름이 없었더라면, 이 분야 자체가 {하나의 학문으로 자리 잡지 못했을} 수도 있습니다.'],
    ['전자 두뇌', '이것도 책이 상상해 본 이름입니다. ‘인공지능’이 없었다면, 우리는 지금 이 기술을 이렇게 불렀을지도 모릅니다.'],
    ['인공지능', '1955년, 스물여덟 살의 수학자 매카시가 록펠러 재단에 낸 제안서에서 처음 쓴 표현 — {Artificial Intelligence}. 이 대담한 이름은 연구 자금을 끌어오는 데도 효과적이었습니다.'],
  ];
  D.define('namer', {
    build(el, c) {
      const chips = $('.nm-pick .chips', el), slot = $('.nm-book .slot', el), tags = $$('.nm-tags i', el), say = $('.nm-say', el), book = $('.nm-book', el);
      chips.innerHTML = NAMES.map(([n], i) => `<button data-i="${i}"${i === 5 ? ' data-real' : ''}>${n}</button>`).join('');
      const btns = $$('button', chips);
      c.pick = (i) => {
        if (c.t1) c.t1.kill(); if (c.t2) c.t2.kill();
        btns.forEach((b, k) => b.classList.toggle('on', k === i));
        say.style.minHeight = '';
        if (i < 0) { slot.textContent = ''; tags.forEach((t) => { t.textContent = '○○'; }); book.classList.remove('real'); say.textContent = '‘인공지능’이라는 단어가 없었다면 — 다른 이름표를 하나씩 달아 보세요.'; return; }
        const [n, text] = NAMES[i];
        book.classList.toggle('real', i === 5);
        c.t1 = D.scramble(slot, n, 0.55); tags.forEach((t) => { t.textContent = n; });
        c.t2 = D.typed(say, { text, dur: 1.4 });
        if (i === 5) { gsap.fromTo(book, { scale: 1.05 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); D.sfx('thud'); } else D.sfx('flip');
      };
      chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) c.pick(+b.dataset.i); });
      const tl = D.tl(); kick(tl, el);
      tl.from($('.nm-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.nm-ill', el), { y: -120, rotation: 6, opacity: 0, duration: 1.1, ease: 'back.out(1.1)' }, 0.2)
        .from(book, { y: 700, rotation: -14, duration: 1.0, ease: 'back.out(1.1)' }, 0.5)
        .from($('.nm-pick h3', el), { scaleX: 0, transformOrigin: '0 50%', duration: 0.6 }, 1.0)
        .from(btns, { y: 80, opacity: 0, rotation: () => gsap.utils.random(-8, 8), stagger: 0.08, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, 1.1)
        .from(say, { opacity: 0 }, 1.8);
      return [tl, D.tl()];
    },
    enter(el, c, o) { c.pick(o && o.atEnd ? 5 : -1); },
    step(n, c, fwd) { c.pick(n === 1 && fwd ? 5 : -1); },
    leave(el, c) { if (c.t1) c.t1.kill(); if (c.t2) c.t2.kill(); },
  });

  /* ───────── 15 1.7 아인슈타인 ───────── */
  D.define('life', {
    build(el) {
      const li = $$('.lf-steps .note', el), tl = D.tl(); kick(tl, el);
      tl.from($('.lf-title', el), { opacity: 0, y: 50, duration: 0.8 }, 0.1)
        .from($('.lf-lead', el), { opacity: 0, y: 30 }, 0.5)
        .from($('.lf-print', el), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 0.4)
        .from($('.lf-print img', el), { scale: 1.2, duration: 2.8, ease: 'power2.out' }, 0.4)
        .from(li.slice(0, 2), { autoAlpha: 0, y: 260, stagger: 0.45, duration: 0.8, ease: 'back.out(1.2)' }, 1.0);
      const s1 = D.tl().from(li.slice(2), { autoAlpha: 0, y: 260, stagger: 0.4, duration: 0.8, ease: 'back.out(1.2)' });
      const s2 = D.tl()
        .from($('.lf-quote', el), { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, 0)
        .from($('.lf-quote .num', el), { x: -500, opacity: 0, duration: 0.9, ease: 'power4.out' }, 0.5)
        .from($('.lf-quote blockquote', el), { x: 90, opacity: 0, duration: 0.8 }, 0.9)
        .from($('.lf-quote p', el), { opacity: 0 }, 1.6);
      return [tl, s1, s2];
    },
  });

  /* ───────── 16 당신의 예보 ───────── */
  D.define('end', {
    build(el, c) {
      const out = $('.vote-out', el), vbs = $$('.vb', el);
      c.snow = drift(el, 'snow', 30); c.pet = drift(el, 'petal', 16);
      const SAY = {
        y: '힌튼과 같은 쪽에 서셨습니다. 과거의 봄은 지킬 수 없는 약속이었지만, 지금의 AI는 이미 현장에서 눈에 보이는 성과를 내고 있다는 것이 그의 이유였습니다.',
        n: '역사는 당신 편입니다. 과도한 기대는 언제나 실망의 씨앗이었으니까요. 다만 기억할 것 — 겨울에도 연구는 멈추지 않았고, 그 시간이 다음 봄의 토대가 됐습니다.',
      };
      c.mood = (v) => {
        el.classList.toggle('spring', v === 'y'); el.classList.toggle('winter', v === 'n');
        gsap.to(c.pet.lay, { autoAlpha: v === 'y' ? 1 : 0, duration: 0.6, overwrite: true });
        gsap.to(c.snow.lay, { autoAlpha: v === 'n' ? 1 : 0, duration: 0.6, overwrite: true });
      };
      vbs.forEach((b) => b.addEventListener('click', () => {
        vbs.forEach((x) => { x.classList.toggle('on', x === b); x.classList.toggle('off', x !== b); });
        if (c.tw) c.tw.kill(); out.style.minHeight = '';
        c.tw = D.typed(out, { text: SAY[b.dataset.v], dur: 1.8 }); c.mood(b.dataset.v);
      }));
      c.clear = () => { if (c.tw) c.tw.kill(); out.innerHTML = ''; vbs.forEach((x) => x.classList.remove('on', 'off')); c.mood(''); };
      const tl = D.tl(); kick(tl, el);
      tl.from($('.en-title', el), { y: 70, opacity: 0, duration: 0.9 }, 0.2)
        .from(vbs, { y: 220, rotation: (i) => (i ? 8 : -8), opacity: 0, stagger: 0.15, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }, 0.8);
      const s1 = D.tl()
        .from($$('.recap .note', el), { y: 560, rotation: () => gsap.utils.random(-12, 12), stagger: 0.14, duration: 0.8, ease: 'back.out(1.1)' }, 0)
        .from($('.next-note', el), { x: 1900, duration: 0.9, ease: 'power4.out' }, 0.6);
      return [tl, s1];
    },
    enter(el, c) { c.clear(); },
    live(el, c) { return withAtmo(c, c.snow, c.pet); },
  });
})();
