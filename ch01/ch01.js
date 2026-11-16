/* 1장 — 슬라이드별 움직임과 조작 */
(() => {
  const D = Deck, { $, $$ } = D;
  const rand = (a) => a[(Math.random() * a.length) | 0];
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const kick = (tl, el) => tl.from($('.kicker', el), { x: -50, opacity: 0, duration: 0.6 }, 0);

  /* ───────── 01 표지 ───────── */
  D.define('cover', {
    build(el) {
      const tl = D.tl(); kick(tl, el);
      tl.from($('.cover-print', el), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'power3.inOut' }, 0)
        .from($('.cover-print img', el), { scale: 1.22, duration: 2.4, ease: 'power2.out' }, 0)
        .add(D.typed($('.cover-title', el), { dur: 2.7 }), 0.6)
        .from($('.cover-seal', el), { scale: 0, rotation: -140, duration: 0.8, ease: 'back.out(2)' }, 1.0)
        .from($('.cover-note', el), { y: 330, rotation: -16, duration: 0.9, ease: 'back.out(1.3)' }, 3.1);
      return [tl];
    },
    live(el) {
      const img = $('.cover-print img', el), seal = $('.cover-seal', el);
      const qx = gsap.quickTo(img, 'x', { duration: 1, ease: 'power3' }), qy = gsap.quickTo(img, 'y', { duration: 1, ease: 'power3' });
      const sx = gsap.quickTo(seal, 'x', { duration: 1.4, ease: 'power3' });
      const tick = () => { qx((D.pointer.x - 960) * -0.024); qy((D.pointer.y - 540) * -0.024); sx((D.pointer.x - 960) * 0.012); };
      gsap.ticker.add(tick);
      let f = 0;
      const id = setInterval(() => { const em = $('.cover-title em', el); if (em) { f = (f + 1) % 4; em.dataset.f = f; } }, 900);
      return () => { gsap.ticker.remove(tick); clearInterval(id); };
    },
  });

  /* ───────── 02 이상한 기분 ───────── */
  D.define('hook', {
    build(el) {
      const tl = D.tl(); kick(tl, el);
      tl.from($$('.bub', el), { y: 50, opacity: 0, scale: 0.8, transformOrigin: (i) => (i === 1 ? '0% 100%' : '100% 100%'), stagger: 0.7, duration: 0.5, ease: 'back.out(1.7)' }, 0.3)
        .add(D.typed($('.thought', el), { dur: 1.7 }), 2.4);
      const s1 = D.tl().from($('.hook-2', el), { y: 40, opacity: 0 });
      const s2 = D.tl();
      s2.from($('.yearbox', el), { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, 0)
        .add(D.count($('.yr', el), new Date().getFullYear(), 1950, 1.9, (v) => String(Math.round(v)), 'power3.inOut'), 0.45)
        .from($$('.yr-txt > *', el), { x: 90, opacity: 0, stagger: 0.2 }, 1.7);
      return [tl, s1, s2];
    },
  });

  /* ───────── 03 에니그마 ───────── */
  D.define('enigma', {
    build(el) {
      const tl = D.tl(), path = $('.leader path', el), len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len });
      kick(tl, el);
      tl.from($('.enigma-ill', el), { y: 140, rotation: 5, opacity: 0, duration: 1.1, ease: 'power4.out' }, 0.1)
        .add(D.scramble($('.enigma-title', el), '에니그마', 1.3), 0.3)
        .from($('.enigma-sub', el), { opacity: 0, x: -30 }, 1.4)
        .from($('.c2', el), { y: 220, rotation: -12, opacity: 0, ease: 'back.out(1.2)' }, 1.6);
      const s1 = D.tl()
        .from($('.c1', el), { x: 240, rotation: 14, opacity: 0, ease: 'back.out(1.2)' }, 0)
        .from(path, { strokeDashoffset: len, duration: 0.45, ease: 'power2.inOut' }, 0.4)
        .from($('.leader circle', el), { scale: 0, transformOrigin: '50% 50%', duration: 0.3, ease: 'back.out(3)' }, 0.8);
      const s2 = D.tl().from($('.c3', el), { y: 220, rotation: 10, opacity: 0, ease: 'back.out(1.2)' }, 0);
      return [tl, s1, s2];
    },
  });

  /* ───────── 04 에니그마 타건 ─────────
     에니그마 I: 로터 I·II·III, 반사판 B, 링 설정 A, 플러그보드 없음. 초기 AAA 에서 AAAAA → BDZGO */
  const ROT = [['EKMFLGDQVZNTOWYHXUSPAIBRCJ', 16], ['AJDKSIRUXBLHWTMCQGZNPYFVOE', 4], ['BDFHJLCPRTXVZNYEIWGAKMUSQO', 21]];
  const REF = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  function makeEnigma() {
    const pos = [0, 0, 0];
    const fwd = (c, r) => (ROT[r][0].charCodeAt((c + pos[r]) % 26) - 65 - pos[r] + 26) % 26;
    const bwd = (c, r) => (ROT[r][0].indexOf(ABC[(c + pos[r]) % 26]) - pos[r] + 26) % 26;
    return {
      pos,
      press(ch) {
        if (pos[1] === ROT[1][1]) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
        else if (pos[2] === ROT[2][1]) pos[1] = (pos[1] + 1) % 26;
        pos[2] = (pos[2] + 1) % 26;
        let c = ABC.indexOf(ch);
        c = fwd(c, 2); c = fwd(c, 1); c = fwd(c, 0);
        c = REF.charCodeAt(c) - 65;
        c = bwd(c, 0); c = bwd(c, 1); c = bwd(c, 2);
        return ABC[c];
      },
    };
  }
  D.makeEnigma = makeEnigma;

  D.define('play', {
    build(el, c) {
      const rows = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
      $('.lamps', el).innerHTML = rows.map((r) => `<div class="row">${[...r].map((k) => `<span class="lamp" data-k="${k}">${k}</span>`).join('')}</div>`).join('');
      $('.keys', el).innerHTML = rows.map((r) => `<div class="row">${[...r].map((k) => `<button class="key" data-k="${k}" aria-label="${k}">${k}</button>`).join('')}</div>`).join('');
      const M = makeEnigma(), st = { last: '', run: [] };
      const msg = $('.en-msg', el), list = $('.en-tape ol', el), rot = $$('.rotor b', el);
      const drawRot = (anim) => rot.forEach((b, i) => {
        const ch = ABC[M.pos[i]];
        if (b.textContent === ch) return;
        b.textContent = ch;
        if (anim) gsap.fromTo(b, { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.22, ease: 'power2.out' });
      });
      c.timers = [];
      c.press = (k) => {
        const out = M.press(k);
        if (k === st.last) st.run.push(out); else { st.last = k; st.run = [out]; }
        drawRot(true); D.sfx('key');
        const key = $(`.key[data-k="${k}"]`, el), lamp = $(`.lamp[data-k="${out}"]`, el);
        key.classList.add('down'); setTimeout(() => key.classList.remove('down'), 130);
        $$('.lamp.on', el).forEach((l) => l.classList.remove('on')); lamp.classList.add('on');
        clearTimeout(c.lt); c.lt = setTimeout(() => lamp.classList.remove('on'), 1800);
        $$('.key.hint', el).forEach((x) => x.classList.remove('hint'));
        const li = document.createElement('li'); li.innerHTML = `${k} → <em>${out}</em>`; list.prepend(li);
        gsap.from(li, { height: 0, opacity: 0, duration: 0.22 });
        while (list.children.length > 12) list.lastChild.remove();
        const n = st.run.length;
        msg.innerHTML = n > 1
          ? `<b>${k}</b>를 ${n}번 눌렀는데, 불이 켜진 글자는<br><b>${st.run.slice(-8).join(' · ')}</b><br>매번 다릅니다. 누를 때마다 로터가 돌아 회로가 통째로 바뀌기 때문입니다.`
          : `<b>${k}</b>를 누르자 <b>${out}</b>에 불이 켜졌습니다.<br>같은 글자를 한 번 더 눌러 보세요.`;
      };
      c.reset = (midnight) => {
        c.timers.forEach(clearTimeout); c.timers = [];
        st.last = ''; st.run = [];
        M.pos.forEach((_, i) => { M.pos[i] = midnight ? (Math.random() * 26) | 0 : 0; });
        if (midnight) {
          rot.forEach((b, i) => { const o = { v: 0 }; gsap.to(o, { v: 14, duration: 0.7 + i * 0.15, ease: 'power2.out', onUpdate() { b.textContent = o.v >= 13.5 ? ABC[M.pos[i]] : rand(ABC); } }); });
          msg.innerHTML = `자정이 지났습니다. 새 설정은 <b>${M.pos.map((p) => ABC[p]).join(' · ')}</b>.<br>어제 알아낸 설정은 이제 쓸모가 없습니다. 다시 처음부터.`;
          D.sfx('bell');
        } else {
          drawRot(false); list.innerHTML = '';
          msg.innerHTML = '자판의 <b>A</b>를 여러 번 눌러 보세요.';
          $$('.lamp.on', el).forEach((l) => l.classList.remove('on'));
          $('.key[data-k="A"]', el).classList.add('hint');
        }
      };
      el.addEventListener('click', (e) => {
        const k = e.target.closest('.key'), b = e.target.closest('[data-act]');
        if (k) c.press(k.dataset.k);
        else if (b) c.reset(b.dataset.act === 'midnight');
      });
      const tl = D.tl(); kick(tl, el);
      tl.from($$('.en-left > *', el), { y: 50, opacity: 0, stagger: 0.12 }, 0.5)
        .from($$('.rotor', el), { y: -80, opacity: 0, stagger: 0.1, ease: 'back.out(1.6)' }, 0.6)
        .from($$('.lamp', el), { scale: 0, opacity: 0, stagger: { each: 0.018, from: 'center' }, duration: 0.4, ease: 'back.out(2)' }, 0.8)
        .from($$('.keys .row', el), { y: 50, opacity: 0, stagger: 0.1, duration: 0.5 }, 1.0)
        .from($('.en-tape', el), { x: 320, rotation: 10, duration: 0.8 }, 1.1);
      return [tl, D.tl()];
    },
    enter(el, c) { c.reset(false); },
    step(n, c, fwd) {
      if (n === 1 && fwd) for (let i = 0; i < 5; i++) c.timers.push(setTimeout(() => c.press('A'), 300 + i * 430));
    },
    leave(el, c) { c.timers.forEach(clearTimeout); c.timers = []; },
    key(e, c) {
      const m = /^Key([A-Z])$/.exec(e.code || '');
      if (m && !e.repeat) { c.press(m[1]); return true; }
      return false;
    },
  });

  /* ───────── 05 경우의 수 ───────── */
  D.define('number', {
    build(el) {
      const box = $('.big-num', el);
      box.innerHTML = [...box.dataset.num].map((ch, i) => (ch === ','
        ? '<span class="c">,</span>'
        : `<span class="d"><span class="strip">${Array.from({ length: 9 }, (_, k) => `<i>${(i * 7 + k * 3) % 10}</i>`).join('')}<i>${ch}</i></span></span>`)).join('');
      const strips = $$('.strip', el).reverse();
      const tl = D.tl(); kick(tl, el);
      tl.fromTo(strips, { yPercent: 0 }, { yPercent: -90, duration: 1.7, ease: 'power4.out', stagger: 0.055 }, 0.3)
        .from($$('.big-num .c', el), { opacity: 0, y: -30, stagger: 0.05, duration: 0.3 }, 1.6)
        .from($$('.kor-num .u', el), { y: 50, opacity: 0, stagger: 0.13, ease: 'back.out(2)' }, 2.2);
      const s1 = D.tl().from($('.num-sim', el), { y: 460, rotation: 4, duration: 0.9, ease: 'power4.out' });

      const N = 158962555217826360000, YEAR = 31557600, UNIV = 1.38e10, HUMAN = 3e5;
      const range = $('input', el), ppl = $('.ppl', el), yrs = $('.yrs', el), cmp = $('.cmp', el), mark = $('.sim-bar .u', el);
      const r1 = (v) => (v >= 10 ? Math.round(v).toLocaleString('ko-KR') : String(Math.round(v * 10) / 10));
      const upd = () => {
        const p = Math.round(10 ** +range.value), y = N / p / YEAR;
        ppl.textContent = p >= 10000 ? `${r1(p / 10000)}만 명` : `${p.toLocaleString('ko-KR')}명`;
        yrs.textContent = y >= 1e12 ? `약 ${r1(y / 1e12)}조 년` : y >= 1e8 ? `약 ${r1(y / 1e8)}억 년` : `약 ${r1(y / 1e4)}만 년`;
        const big = y >= UNIV, ref = big ? UNIV : HUMAN;
        cmp.textContent = big ? `우주의 나이(138억 년)의 약 ${r1(y / ref)}배` : `인류(호모 사피엔스) 30만 년 역사의 약 ${r1(y / ref)}배`;
        mark.style.left = `${Math.max(0.3, (ref / y) * 100)}%`;
        mark.dataset.l = big ? '← 우주의 나이' : '← 인류의 역사';
      };
      range.addEventListener('input', upd); upd();
      return [tl, s1];
    },
  });

  /* ───────── 06 봄 ───────── */
  D.define('bombe', {
    build(el, c) {
      const tl = D.tl(); kick(tl, el);
      tl.from($('.bombe-ill', el), { x: -260, opacity: 0, duration: 1.1, ease: 'power4.out' }, 0.1)
        .add(D.typed($('.bombe-title', el), { dur: 1.5 }), 0.4)
        .from($$('.wheel', el), { y: -120, opacity: 0, stagger: 0.1, ease: 'bounce.out', duration: 0.8 }, 1.3)
        .from($('.hunt-side', el), { x: 60, opacity: 0 }, 1.7);
      const s1 = D.tl()
        .from($$('.stat', el), { x: 160, opacity: 0, stagger: 0.4, duration: 0.6 }, 0)
        .from($('.n1', el), { scale: 2.4, transformOrigin: '30% 80%', duration: 0.5, ease: 'back.out(2)' }, 0.05)
        .add(D.count($('.n2', el), 0, 1400, 1.5), 0.45)
        .from($('.stats small', el), { opacity: 0 }, 1.5);

      const wheels = $$('.wheel', el), wb = $$('.wheel b', el), nEl = $('.hunt-n b', el), msg = $('.hunt-msg', el), btn = $('.hunt .btn', el);
      c.hunt = () => {
        if (c.tw) return;
        btn.disabled = true; wheels.forEach((w) => w.classList.remove('found'));
        const target = [rand(ABC), rand(ABC), rand(ABC)], total = 1800 + ((Math.random() * 6000) | 0), o = { n: 0 };
        msg.textContent = '드럼이 돌며 가능한 설정을 하나씩 지워 나갑니다…';
        c.tw = gsap.to(o, {
          n: total, duration: 3.4, ease: 'power1.in',
          onUpdate() {
            const n = Math.round(o.n); nEl.textContent = n.toLocaleString('ko-KR');
            wb.forEach((b, i) => { b.textContent = ABC[Math.floor(n / [676, 26, 1][i]) % 26]; });
            if (n % 7 === 0) D.sfx('tick');
          },
          onComplete() {
            wb.forEach((b, i) => { b.textContent = target[i]; wheels[i].classList.add('found'); });
            gsap.from(wheels, { scale: 1.3, stagger: 0.09, duration: 0.5, ease: 'back.out(3)' });
            msg.innerHTML = `설정 발견 — <b>${target.join(' · ')}</b>. 오늘의 암호가 열렸습니다. 하지만 자정이 지나면 다시 처음부터.`;
            btn.textContent = '다음 날 — 다시 찾기'; btn.disabled = false; c.tw = null; D.sfx('bell');
          },
        });
      };
      btn.addEventListener('click', c.hunt);
      return [tl, s1];
    },
    leave(el, c) { if (c.tw) { c.tw.kill(); c.tw = null; $('.hunt .btn', el).disabled = false; } },
  });

  /* ───────── 07 튜링 머신 ───────── */
  const PROGS = {
    flip: { name: '뒤집기', desc: '0은 1로, 1은 0으로', rules: { A0: ['1', 'R', 'A'], A1: ['0', 'R', 'A'], A_: ['_', 'S', 'H'] } },
    inc: { name: '1 더하기', desc: '이진수에 1을 더한다', rules: { A0: ['0', 'R', 'A'], A1: ['1', 'R', 'A'], A_: ['_', 'L', 'B'], B1: ['0', 'L', 'B'], B0: ['1', 'S', 'H'], B_: ['1', 'S', 'H'] } },
    erase: { name: '지우기', desc: '테이프를 깨끗이 비운다', rules: { A0: ['_', 'R', 'A'], A1: ['_', 'R', 'A'], A_: ['_', 'S', 'H'] } },
  };
  const INPUT = '1011', CW = 130;
  D.define('tm', {
    build(el, c) {
      const cellsEl = $('.tm-cells', el), rulesEl = $('.tm-rules ol', el), stateEl = $('.state', el), outEl = $('.tm-out', el), cardsEl = $('.cards', el);
      cardsEl.innerHTML = Object.entries(PROGS).map(([k, p], i) => `<button class="pc" data-p="${k}"><i class="mono">CARD 0${i + 1}</i><b>${p.name}</b><span>${p.desc}</span></button>`).join('');
      let html = '';
      for (let k = -9; k <= 14; k++) html += `<div class="tm-cell blank" data-k="${k}" style="left:${k * CW - CW / 2}px">·</div>`;
      cellsEl.innerHTML = html;
      const cell = (k) => $(`.tm-cell[data-k="${k}"]`, cellsEl);
      const S = (c.S = { key: 'flip', tape: {}, h: 0, q: 'A', halt: false });
      const paint = (k, anim) => {
        const el2 = cell(k); if (!el2) return;
        const v = S.tape[k] || '_';
        el2.textContent = v === '_' ? '·' : v; el2.classList.toggle('blank', v === '_');
        if (anim) { gsap.fromTo(el2, { rotationX: -90, color: '#E23D1F' }, { rotationX: 0, color: '', duration: 0.3, ease: 'back.out(2)', clearProps: 'color' }); D.sfx('key'); }
      };
      const word = () => { let s = ''; for (let k = -9; k <= 14; k++) s += S.tape[k] && S.tape[k] !== '_' ? S.tape[k] : ''; return s; };
      const ruleText = (key, [w, mv, nq]) => {
        const q = key[0], sym = key[1];
        return `${q} · ${sym === '_' ? '빈칸' : sym} 읽으면 → ${w === '_' ? '지우고' : w + ' 쓰고'} ${mv === 'R' ? '오른쪽 →' : mv === 'L' ? '← 왼쪽' : '제자리'}${nq === 'H' ? ' · 정지' : nq !== q ? ' · 상태 ' + nq : ''}`;
      };
      c.load = (key) => {
        if (c.dc) { c.dc.kill(); c.dc = null; }
        S.key = key; S.tape = {}; S.h = 0; S.q = 'A'; S.halt = false;
        [...INPUT].forEach((ch, i) => { S.tape[i] = ch; });
        for (let k = -9; k <= 14; k++) paint(k, false);
        gsap.to(cellsEl, { x: 0, duration: 0.5, ease: 'power3.out' });
        const p = PROGS[key];
        rulesEl.innerHTML = Object.entries(p.rules).map(([k, r]) => `<li data-r="${k}">${ruleText(k, r)}</li>`).join('');
        gsap.from($$('li', rulesEl), { x: 40, opacity: 0, stagger: 0.05, duration: 0.3 });
        $$('.pc', el).forEach((b) => b.classList.toggle('on', b.dataset.p === key));
        stateEl.textContent = '상태 A';
        outEl.innerHTML = `입력 테이프 <em>${INPUT}</em>${key === 'inc' ? ' (십진수 11)' : ''}<br>▶ 실행을 눌러 보세요`;
        $('[data-act=run]', el).disabled = false; $('[data-act=one]', el).disabled = false;
      };
      c.one = () => {
        if (S.halt) return false;
        const sym = S.tape[S.h] || '_', key = S.q + sym, r = PROGS[S.key].rules[key];
        $$('li', rulesEl).forEach((li) => li.classList.toggle('on', li.dataset.r === key));
        if (r[0] !== sym) { S.tape[S.h] = r[0]; paint(S.h, true); } else D.sfx('tick');
        if (r[1] === 'R') S.h++; else if (r[1] === 'L') S.h--;
        gsap.to(cellsEl, { x: -S.h * CW, duration: 0.3, ease: 'power2.inOut' });
        if (r[2] === 'H') {
          S.halt = true; stateEl.textContent = '정지';
          const w = word();
          outEl.innerHTML = `결과 테이프 <em>${w || '(빈 테이프)'}</em>${S.key === 'inc' ? ` (십진수 ${parseInt(w, 2)})` : ''}<br>같은 기계, 다른 카드를 끼워 보세요`;
          $('[data-act=run]', el).disabled = true; $('[data-act=one]', el).disabled = true; D.sfx('bell');
          return false;
        }
        S.q = r[2]; stateEl.textContent = '상태 ' + S.q;
        return true;
      };
      c.run = () => { if (c.dc) return; const loop = () => { c.dc = c.one() ? gsap.delayedCall(0.45, loop) : null; }; loop(); };
      el.addEventListener('click', (e) => {
        const pc = e.target.closest('.pc'), b = e.target.closest('[data-act]');
        if (pc) { c.load(pc.dataset.p); D.sfx('flip'); }
        else if (b) ({ run: c.run, one: () => { if (c.dc) { c.dc.kill(); c.dc = null; } c.one(); }, reset: () => c.load(S.key) })[b.dataset.act]();
      });
      c.load('flip');

      const tl = D.tl(); kick(tl, el);
      tl.from($('.tm-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.tm-lead', el), { x: 50, opacity: 0 }, 0.5)
        .from($('.tm-band', el), { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, ease: 'power4.inOut' }, 0.4)
        .from($$('.tm-cell', el), { yPercent: -110, stagger: { each: 0.02, from: 'center' }, duration: 0.45, ease: 'back.out(1.5)' }, 0.9)
        .from($('.tm-head', el), { y: -420, duration: 0.8, ease: 'bounce.out' }, 1.2)
        .from($$('.pc', el), { y: 240, rotation: () => gsap.utils.random(-14, 14), stagger: 0.1, ease: 'back.out(1.3)', clearProps: 'transform' }, 1.3)
        .from([$('.tm-progs h3', el), $('.tm-rules', el), $('.tm-ctl', el)], { y: 40, opacity: 0, stagger: 0.12 }, 1.5);
      const s1 = D.tl().from($('.tm-uni', el), { x: 560, rotation: 14, duration: 0.9, ease: 'back.out(1.2)' });
      return [tl, s1];
    },
    enter(el, c) { c.load('flip'); },
    leave(el, c) { if (c.dc) { c.dc.kill(); c.dc = null; } },
  });

  /* ───────── 08 기계는 생각할 수 있는가 ───────── */
  D.define('question', {
    build(el, c) {
      c.chs = D.split($('.q-line', el));
      const tl = D.tl(); kick(tl, el);
      tl.from($('.q-mark', el), { scale: 0.5, rotation: -30, opacity: 0, duration: 1.5, ease: 'power3.out' }, 0)
        .from(c.chs, { yPercent: 130, rotation: () => gsap.utils.random(-28, 28), opacity: 0, stagger: 0.06, duration: 0.7, ease: 'back.out(1.8)' }, 0.3)
        .from($('.q-en', el), { opacity: 0, letterSpacing: '0.7em', duration: 1.1 }, 1.3);
      const s1 = D.tl()
        .from($('.q-old', el), { opacity: 0, y: 30 }, 0)
        .from($('.q-old i', el), { scaleX: 0, duration: 0.45, ease: 'power2.inOut' }, 0.8)
        .from($('.q-new', el), { opacity: 0, y: 40 }, 1.2);
      return [tl, s1];
    },
    live(el, c) {
      const line = $('.q-line', el), mark = $('.q-mark', el), t0 = performance.now();
      let cx = null;
      const tick = () => {
        if (!cx) cx = c.chs.map((ch) => line.offsetLeft + ch.offsetLeft + ch.offsetWidth / 2);
        const t = (performance.now() - t0) / 1000, idle = performance.now() - D.pointer.moved > 2500;
        const px = idle ? 960 + Math.sin(t * 0.9) * 800 : D.pointer.x;
        c.chs.forEach((ch, i) => { const d = (cx[i] - px) / 280; ch.style.fontWeight = Math.round(170 + 730 * Math.exp(-d * d)); });
        mark.style.translate = `0 ${Math.sin(t * 0.6) * 14}px`;
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
  });

  /* ───────── 09 이미테이션 게임 ───────── */
  D.define('parlor', {
    build(el) {
      const q1 = $('.q1', el), q2 = $('.q2', el), a1 = $('.a1', el), a2 = $('.a2', el);
      gsap.set($$('.f2, .t2', el), { autoAlpha: 0 });
      const tl = D.tl(); kick(tl, el);
      tl.from($('.par-title', el), { y: 50, opacity: 0 }, 0.1)
        .from($('.par-print', el), { clipPath: 'inset(0% 100% 0% 0%)', duration: 1, ease: 'power3.inOut' }, 0.3)
        .from($$('.room', el), { y: 200, opacity: 0, stagger: 0.2, duration: 0.9, ease: 'power4.out' }, 0.4)
        .from($('.asker', el), { y: 140, opacity: 0, ease: 'back.out(1.4)' }, 1.0);
      const s1 = D.tl();
      s1.fromTo([q1, q2], { autoAlpha: 0, x: 400, y: 300, rotation: 0, scaleY: 1 }, { autoAlpha: 1, y: 270, duration: 0.25 }, 0)
        .to(q1, { x: 20, y: 400, rotation: -5, duration: 0.7, ease: 'power2.inOut' }, 0.35)
        .to(q2, { x: 760, y: 400, rotation: 5, duration: 0.7, ease: 'power2.inOut' }, 0.45)
        .to([q1, q2], { y: 428, scaleY: 0.1, autoAlpha: 0, duration: 0.22, ease: 'power1.in' }, 1.15)
        .fromTo(a1, { autoAlpha: 0, x: 60, y: 428, scaleY: 0.1, rotation: 0 }, { autoAlpha: 1, scaleY: 1, y: 410, duration: 0.25 }, 1.9)
        .to(a1, { x: 165, y: 250, rotation: -5, duration: 0.7, ease: 'power2.out' }, 2.1)
        .fromTo(a2, { autoAlpha: 0, x: 810, y: 428, scaleY: 0.1, rotation: 0 }, { autoAlpha: 1, scaleY: 1, y: 410, duration: 0.25 }, 2.3)
        .to(a2, { x: 700, y: 262, rotation: 4, duration: 0.7, ease: 'power2.out' }, 2.5)
        .from($('.huh', el), { scale: 0, rotation: -50, duration: 0.5, ease: 'back.out(3)' }, 3.2)
        .from($('.par-foot', el), { opacity: 0, y: 30 }, 3.3);
      const s2 = D.tl();
      s2.to($$('.t1', el), { autoAlpha: 0, y: -20, duration: 0.3 }, 0)
        .to($$('.t2', el), { autoAlpha: 1, duration: 0.5 }, 0.3)
        .to($('.par-kick', el), { opacity: 0.35, duration: 0.3 }, 0)
        .to($('.ra .door', el), { rotationY: 360, duration: 0.9, ease: 'power3.inOut' }, 0.1)
        .to($('.ra .door', el), { backgroundColor: '#E23D1F', duration: 0.3 }, 0.45)
        .to($$('.who .f1, .pnote .f1', el), { autoAlpha: 0, duration: 0.2 }, 0.4)
        .to($$('.who .f2, .pnote .f2', el), { autoAlpha: 1, duration: 0.35 }, 0.6)
        .fromTo($('.huh', el), { scale: 1 }, { scale: 1.5, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.2);
      return [tl, s1, s2];
    },
  });

  /* ───────── 10 당신이 질문자 ───────── */
  const QA = [ // [질문, 한쪽 방의 답, 다른 쪽 방의 답] — 모두 미리 써 둔 대본. 세 번째가 '기계' 역
    ['어젯밤에 무슨 꿈 꿨어요?', '기억이 잘 안 나요. 뭔가에 쫓겼던 것 같기도 하고… 깨고 나니 목이 말랐어요.', '꿈은 잘 기억 못 하는 편인데, 어제는 오래된 학교 복도를 걷고 있었어요. 이상하게 조용했죠.'],
    ['17 곱하기 23은 얼마죠?', '어… 잠깐만요. 391? 계산기 쓰면 안 되나요.', '음, 400이 조금 안 될 것 같은데요. 391인가요? 암산은 자신 없어요.'],
    ['비 오는 날, 좋아해요?', '집에 있을 땐 좋아요. 출근할 땐 싫고요.', '창밖으로 볼 때만요. 우산 들고 걷는 건 질색이에요.'],
    ['당신은 사람인가요?', '네, 그럼요. 근데 그걸 어떻게 증명하죠?', '당연하죠. 이런 질문은 처음 받아 보네요.'],
    ['시 한 줄만 지어 줄래요?', '저 그런 거 못 해요. 국어 시간에도 늘 졸았거든요.', '그건 좀 봐주세요. 시는 한 번도 써 본 적이 없어요.'],
  ];
  D.define('game', {
    build(el, c) {
      const qs = $('.g-qs', el), verdict = $('.g-verdict', el), res = $('.g-result', el), lead = $('.g-lead', el);
      qs.innerHTML = QA.map((q, i) => `<button class="gq" data-q="${i}">${q[0]}</button>`).join('');
      const ans = { A: $('.ga .g-ans', el), B: $('.gb .g-ans', el) }, vb = $$('.g-verdict .btn', el), doors = $$('.g-room .door', el), ins = $$('.inside', el);
      const G = {}; c.timers = [];
      c.reset = () => {
        c.timers.forEach(clearTimeout); c.timers = [];
        G.machine = Math.random() < 0.5 ? 'A' : 'B'; G.asked = 0; G.done = false;
        ans.A.innerHTML = ans.B.innerHTML = '';
        $$('.gq', el).forEach((b) => { b.disabled = false; });
        vb.forEach((b) => { b.disabled = true; });
        gsap.killTweensOf([res, ...doors]);
        gsap.set(res, { autoAlpha: 0 }); gsap.set(doors, { rotationY: 0 });
        gsap.set([qs, verdict, lead], { autoAlpha: 1 });
      };
      const ask = (i, btn) => {
        if (G.done || G.asked >= 3) return;
        G.asked++; btn.disabled = true; D.sfx('flip');
        ['A', 'B'].forEach((side) => {
          const li = document.createElement('li');
          li.innerHTML = `<b>쪽지 ${G.asked} · ${QA[i][0]}</b><span class="a">…</span>`;
          ans[side].appendChild(li);
          gsap.from(li, { x: side === 'A' ? 300 : -300, opacity: 0, duration: 0.5, ease: 'power3.out' });
          const text = QA[i][side === G.machine ? 2 : 1], span = li.querySelector('.a');
          c.timers.push(setTimeout(() => D.typed(span, { text, dur: text.length * 0.05 }), 800 + Math.random() * 900));
        });
        if (G.asked >= 2) vb.forEach((b) => { b.disabled = false; });
        if (G.asked >= 3) $$('.gq', el).forEach((b) => { b.disabled = true; });
      };
      const judge = (v) => {
        if (G.done) return; G.done = true;
        const ok = v === G.machine;
        ins.forEach((d, i) => { const m = 'AB'[i] === G.machine; d.textContent = m ? '기계' : '사람'; d.classList.toggle('m', m); });
        gsap.to(doors, { rotationY: -80, duration: 0.9, ease: 'power3.inOut', stagger: 0.15 }); D.sfx('thud');
        $('h3', res).textContent = ok ? '맞혔습니다' : '속았습니다';
        $('p', res).innerHTML = ok
          ? `기계는 <b>${G.machine}</b>방에 있었습니다.<br>그런데 — 확신이 있었나요, 아니면 찍으셨나요?`
          : `기계는 <b>${G.machine}</b>방에 있었습니다.<br>방금, 기계 하나가 당신의 시험을 통과했습니다.`;
        gsap.to([qs, verdict, lead], { autoAlpha: 0, duration: 0.3 });
        gsap.fromTo(res, { autoAlpha: 0, y: 80, rotation: -5 }, { autoAlpha: 1, y: 0, rotation: -1.2, duration: 0.7, delay: 0.9, ease: 'back.out(1.4)' });
      };
      el.addEventListener('click', (e) => {
        const q = e.target.closest('.gq'), v = e.target.closest('[data-v]'), a = e.target.closest('[data-act=again]');
        if (q) ask(+q.dataset.q, q); else if (v) judge(v.dataset.v); else if (a) c.reset();
      });
      c.reset();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.ga', el), { x: -500, duration: 0.9, ease: 'power4.out' }, 0.2)
        .from($('.gb', el), { x: 500, duration: 0.9, ease: 'power4.out' }, 0.3)
        .from([$('.g-mid .h-m', el), lead], { y: 50, opacity: 0, stagger: 0.15 }, 0.5)
        .from($$('.gq', el), { y: 60, opacity: 0, rotation: () => gsap.utils.random(-6, 6), stagger: 0.09, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, 0.9)
        .from(verdict, { opacity: 0 }, 1.6);
      return [tl];
    },
    enter(el, c) { c.reset(); },
    leave(el, c) { c.timers.forEach(clearTimeout); c.timers = []; },
  });

  /* ───────── 11 구별 실패 ───────── */
  D.define('tv', {
    build(el) {
      const N = 14, NS = 'http://www.w3.org/2000/svg';
      const mk = (svg, tag, cls, attrs = {}) => { const e = document.createElementNS(NS, tag); e.setAttribute('class', cls); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
      const draws = $$('.tvc', el).map((card, ci) => {
        const svg = $('svg', card), kind = card.dataset.kind;
        const h = Array.from({ length: N }, (_, i) => D.clamp(0.5 + 0.34 * Math.sin(i * 0.9 + ci * 2.1) + 0.13 * Math.sin(i * 2.3 + ci), 0.05, 0.95));
        const a0 = Array.from({ length: N }, (_, i) => D.clamp(0.5 + 0.36 * Math.sin(i * 1.6 + ci * 1.3 + 2.4) + 0.1 * Math.cos(i * 0.7), 0.05, 0.95));
        const X = (i) => 22 + i * 30.5, OFF = 5;
        if (kind === 'notes') {
          for (let k = 0; k < 5; k++) mk(svg, 'line', 'st', { x1: 8, x2: 432, y1: 60 + k * 30, y2: 60 + k * 30 });
          const A = h.map(() => mk(svg, 'ellipse', 'af', { rx: 11, ry: 8 })), H = h.map((v, i) => mk(svg, 'ellipse', 'hf', { rx: 11, ry: 8, cx: X(i), cy: 210 - v * 180 }));
          void H;
          return (p) => A.forEach((e, i) => { e.setAttribute('cx', X(i) + OFF); e.setAttribute('cy', 210 - (a0[i] + (h[i] - a0[i]) * p) * 180 + OFF); });
        }
        if (kind === 'chart') {
          const A = mk(svg, 'polyline', 'ap'); mk(svg, 'polyline', 'hp', { points: h.map((v, i) => `${X(i)},${215 - v * 185}`).join(' ') });
          return (p) => A.setAttribute('points', h.map((v, i) => `${X(i) + OFF},${215 - (a0[i] + (v - a0[i]) * p) * 185 + OFF}`).join(' '));
        }
        const A = h.map(() => mk(svg, 'rect', 'af', { width: 14, rx: 7 }));
        h.forEach((v, i) => mk(svg, 'rect', 'hf', { width: 14, rx: 7, x: X(i) - 7, y: 120 - v * 100, height: v * 200 }));
        return (p) => A.forEach((e, i) => { const v = a0[i] + (h[i] - a0[i]) * p; e.setAttribute('x', X(i) - 7 + OFF); e.setAttribute('y', 120 - v * 100 + OFF); e.setAttribute('height', v * 200); });
      });
      const o = { p: 0 }, paint = () => draws.forEach((d) => d(o.p)); paint();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.tv-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($$('.tvc', el), { y: 320, opacity: 0, rotation: () => gsap.utils.random(-10, 10), stagger: 0.15, duration: 0.9, ease: 'back.out(1.1)' }, 0.4)
        .from($('.tv-legend', el), { opacity: 0 }, 1.3);
      const s1 = D.tl()
        .to(o, { p: 1, duration: 2, ease: 'power2.inOut', onUpdate: paint }, 0)
        .from($$('.stamp', el), { scale: 3.2, opacity: 0, stagger: 0.22, duration: 0.3, ease: 'power3.in' }, 2.0)
        .from($('.tv-foot', el), { x: 80, opacity: 0 }, 2.5);
      return [tl, s1];
    },
  });

  /* ───────── 12 학습하는 기계 — 3목 강화학습(표 형태 Q-러닝, 자기 대국) ───────── */
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function makeRL() {
    const Q = new Map();
    const empty = (b) => { const r = []; for (let i = 0; i < 9; i++) if (!b[i]) r.push(i); return r; };
    const winner = (b) => { for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x]; return empty(b).length ? 0 : 3; };
    const row = (b) => { const k = b.join(''); let v = Q.get(k); if (!v) { v = new Float32Array(9); Q.set(k, v); } return v; };
    const best = (b) => {
      const m = empty(b), v = Q.get(b.join('')); if (!v) return rand(m);
      let mx = -1e9, pick = [];
      for (const i of m) { if (v[i] > mx + 1e-6) { mx = v[i]; pick = [i]; } else if (v[i] > mx - 1e-6) pick.push(i); }
      return rand(pick);
    };
    const selfPlay = (eps) => {
      const b = [0, 0, 0, 0, 0, 0, 0, 0, 0]; let p = 1;
      for (;;) {
        const a = Math.random() < eps ? rand(empty(b)) : best(b), qv = row(b);
        b[a] = p; const w = winner(b); let tg;
        if (w === p) tg = 1; else if (w === 3) tg = 0;
        else { const nv = Q.get(b.join('')); let mx = 0; if (nv) { mx = -1e9; for (const i of empty(b)) if (nv[i] > mx) mx = nv[i]; } tg = -0.9 * mx; }
        qv[a] += 0.3 * (tg - qv[a]);
        if (w) return w;
        p = 3 - p;
      }
    };
    const evalO = (n) => {
      let ok = 0;
      for (let g = 0; g < n; g++) { const b = [0, 0, 0, 0, 0, 0, 0, 0, 0]; let p = 1, w = 0; while (!(w = winner(b))) { b[p === 1 ? rand(empty(b)) : best(b)] = p; p = 3 - p; } if (w !== 1) ok++; }
      return ok / n;
    };
    return { Q, empty, winner, best, evalO, train(n) { for (let i = 0; i < n; i++) selfPlay(0.3); } };
  }
  D.makeRL = makeRL;

  D.define('learn', {
    build(el, c) {
      const board = $('.rl-board', el), msg = $('.rl-msg', el), gEl = $('.rl-stat b', el), ln = $('.rl-graph .ln', el), btns = $$('.rl-btns .btn', el);
      board.innerHTML = Array.from({ length: 9 }, (_, i) => `<button class="cell" data-i="${i}" aria-label="${i + 1}번 칸"></button>`).join('');
      const cells = $$('.cell', board);
      const RL = makeRL(), S = { b: Array(9).fill(0), over: false, busy: false, games: 0, pts: [] };
      c.timers = [];
      const graph = () => {
        const mx = Math.max(31000, S.games);
        ln.setAttribute('d', S.pts.map(([g, r], i) => `${i ? 'L' : 'M'}${36 + (g / mx) * 378} ${160 - r * 150}`).join(''));
      };
      const put = (i, p) => {
        S.b[i] = p; cells[i].innerHTML = `<i class="stone ${p === 1 ? 'x' : 'o'}"></i>`;
        gsap.from(cells[i].firstChild, { scale: 1.9, opacity: 0, duration: 0.22, ease: 'power2.in' }); D.sfx('thud');
      };
      const fresh = () => { S.b.fill(0); S.over = false; S.busy = false; cells.forEach((x) => { x.innerHTML = ''; x.classList.remove('win'); }); };
      const finish = (w) => {
        S.over = true;
        const line = LINES.find(([x, y, z]) => S.b[x] && S.b[x] === S.b[y] && S.b[x] === S.b[z]);
        if (line) line.forEach((i) => cells[i].classList.add('win'));
        msg.innerHTML = w === 1 ? (S.games ? '당신이 이겼습니다. 아직 연습이 모자라네요.' : '당신이 이겼습니다. 아무렇게나 두는 <b>아이 기계</b>니까요. 이제 연습을 시켜 보세요.')
          : w === 2 ? '기계가 이겼습니다. <b>사탕 하나</b> — 이 수는 다음에도 둘 겁니다.'
            : (S.games >= 20000 ? '비겼습니다. 이제 이 기계는 좀처럼 지지 않습니다.' : '비겼습니다.');
        c.timers.push(setTimeout(fresh, 1900));
      };
      const move = (i) => {
        if (S.over || S.busy || S.b[i] || S.training) return;
        put(i, 1); let w = RL.winner(S.b); if (w) return finish(w);
        S.busy = true;
        c.timers.push(setTimeout(() => { put(RL.best(S.b), 2); S.busy = false; w = RL.winner(S.b); if (w) finish(w); }, 420));
      };
      const train = (n) => {
        if (S.training) return; S.training = true; btns.forEach((b) => { b.disabled = true; });
        c.timers.forEach(clearTimeout); c.timers = []; fresh();
        const chunk = Math.ceil(n / 45), goal = S.games + n;
        msg.innerHTML = '기계가 혼자서 대국을 두는 중… 이기면 +1, 지면 −1.';
        const loop = () => {
          const k = Math.min(chunk, goal - S.games);
          RL.train(k); S.games += k; S.pts.push([S.games, RL.evalO(140)]);
          gEl.textContent = S.games.toLocaleString('ko-KR'); graph();
          if (S.games < goal && S.training) c.raf = requestAnimationFrame(loop);
          else {
            S.training = false; btns.forEach((b) => { b.disabled = false; });
            const r = Math.round(S.pts[S.pts.length - 1][1] * 100);
            msg.innerHTML = `${S.games.toLocaleString('ko-KR')}판을 스스로 뒀습니다. 지지 않는 비율 <b>${r}%</b>. 다시 한 판 둬 보세요.`;
          }
        };
        loop();
      };
      c.reset = () => {
        cancelAnimationFrame(c.raf); c.timers.forEach(clearTimeout); c.timers = [];
        S.training = false; RL.Q.clear(); S.games = 0; S.pts = [[0, RL.evalO(400)]];
        gEl.textContent = '0'; graph(); fresh(); btns.forEach((b) => { b.disabled = false; });
        msg.innerHTML = '먼저 한 판 둬 보세요. 당신이 <b>흑</b>, 세 개를 나란히 놓으면 이깁니다.';
      };
      el.addEventListener('click', (e) => {
        const cell = e.target.closest('.cell'), b = e.target.closest('.rl-btns .btn');
        if (cell) move(+cell.dataset.i);
        else if (b) (b.dataset.n ? train(+b.dataset.n) : c.reset());
      });
      c.stop = () => { cancelAnimationFrame(c.raf); S.training = false; btns.forEach((b) => { b.disabled = false; }); c.timers.forEach(clearTimeout); c.timers = []; };
      c.reset();

      const tl = D.tl(); kick(tl, el);
      tl.from($('.learn-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.learn-lead', el), { y: 40, opacity: 0 }, 0.4)
        .from($('.learn-ill', el), { y: 260, rotation: -8, opacity: 0, duration: 1.1, ease: 'back.out(1.1)' }, 0.5)
        .from($('.rl-board', el), { scale: 0.6, rotation: 12, opacity: 0, duration: 0.8, ease: 'back.out(1.4)' }, 0.6)
        .from($$('.rl-side > *', el), { x: 80, opacity: 0, stagger: 0.1 }, 0.9)
        .from(msg, { opacity: 0 }, 1.5);
      const s1 = D.tl().from($('.rl-note', el), { y: 420, rotation: 5, duration: 0.9, ease: 'back.out(1.1)' });
      return [tl, s1];
    },
    leave(el, c) { c.stop(); },
  });

  /* ───────── 13 예언 ───────── */
  D.define('prophecy', {
    build(el, c) {
      const jit = $('.jit', el), knob = $('.tl-knob', el), fill = $('.tl-fill', el), evs = $$('.tl-ev', el), hint = $('.tl-hint', el), track = $('.tl', el);
      c.chs = D.split(jit); c.p = { v: 0 };
      const mix = gsap.utils.interpolate('#E23D1F', '#17130F');
      c.set = (v) => {
        c.p.v = D.clamp(v, 0, 1);
        gsap.set(knob, { x: c.p.v * 1500 }); gsap.set(fill, { scaleX: c.p.v });
        evs.forEach((e) => e.classList.toggle('on', c.p.v >= parseFloat(e.style.getPropertyValue('--x')) - 0.005));
        jit.style.color = mix(c.p.v);
      };
      c.set(0);
      let drag = false;
      const at = (e) => { c.set((D.toStage(e).x - 210) / 1500); hint.style.opacity = 0; };
      track.addEventListener('pointerdown', (e) => { drag = true; track.setPointerCapture(e.pointerId); at(e); });
      track.addEventListener('pointermove', (e) => { if (drag) at(e); });
      track.addEventListener('pointerup', () => { drag = false; });
      track.addEventListener('pointercancel', () => { drag = false; });

      const tl = D.tl(); kick(tl, el);
      tl.from($('.pq', el), { y: 60, opacity: 0, duration: 0.9 }, 0.2)
        .from($('.tl-line', el), { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, ease: 'power3.inOut' }, 0.8)
        .from(evs, { y: 40, autoAlpha: 0, stagger: 0.12 }, 1.1)
        .from(knob, { scale: 0, duration: 0.5, ease: 'back.out(3)' }, 1.5)
        .from(hint, { opacity: 0 }, 1.9);
      const s1 = D.tl().to(c.p, { v: 1, duration: 2.8, ease: 'power2.inOut', onUpdate: () => c.set(c.p.v) }, 0).to(hint, { opacity: 0, duration: 0.3 }, 0);
      const s2 = D.tl().from($('.pf', el), { y: 40, opacity: 0 });
      return [tl, s1, s2];
    },
    live(el, c) {
      const t0 = performance.now();
      const tick = () => {
        const t = (performance.now() - t0) / 1000, amp = 1 - c.p.v;
        c.chs.forEach((ch, i) => { ch.style.transform = `translateY(${Math.sin(t * 7 + i * 2.3) * 10 * amp}px) rotate(${Math.sin(t * 9 + i * 1.7) * 11 * amp}deg)`; });
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
  });

  /* ───────── 14 튜링상 ───────── */
  D.define('award', {
    build(el, c) {
      c.cards = $$('.lc', el); c.timers = [];
      c.cards.forEach((b) => b.addEventListener('click', () => { b.classList.toggle('on'); D.sfx('flip'); }));
      const tl = D.tl(); kick(tl, el);
      tl.from($('.award-ill', el), { y: -140, rotation: -10, opacity: 0, duration: 1.1, ease: 'back.out(1.2)' }, 0.1)
        .from($('.award-title', el), { y: 100, opacity: 0, duration: 0.8 }, 0.2)
        .from($('.award-sub', el), { x: -50, opacity: 0 }, 0.7)
        .from($('.prize', el), { opacity: 0, y: 30 }, 1.0)
        .add(D.count($('.prize b', el), 0, 1000000, 1.6), 1.0)
        .from($$('.grp h3', el), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.15, duration: 0.6 }, 1.3)
        .from(c.cards, { y: 300, rotation: () => gsap.utils.random(-16, 16), stagger: 0.09, duration: 0.8, ease: 'back.out(1.2)' }, 1.4)
        .from($('.award-foot', el), { opacity: 0 }, 2.2);
      return [tl, D.tl()];
    },
    step(n, c, fwd) {
      c.timers.forEach(clearTimeout);
      c.timers = c.cards.map((b, i) => setTimeout(() => b.classList.toggle('on', n === 1 && fwd), i * 130));
    },
    enter(el, c) { c.cards.forEach((b) => b.classList.remove('on')); },
    leave(el, c) { c.timers.forEach(clearTimeout); },
  });

  /* ───────── 15 한 사람의 삶 ───────── */
  D.define('life', {
    build(el) {
      const li = $$('.life-tl li', el), tl = D.tl(); kick(tl, el);
      tl.from($('.life-print', el), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'power3.inOut' }, 0.1)
        .from($('.life-print img', el), { scale: 1.2, duration: 3, ease: 'power2.out' }, 0.1)
        .from($('.life-title', el), { opacity: 0, y: 40, duration: 1.2 }, 0.8)
        .from(li.slice(0, 2), { opacity: 0, x: 50, stagger: 0.8, duration: 1 }, 1.8);
      const s1 = D.tl().from(li.slice(2), { opacity: 0, x: 50, stagger: 0.6, duration: 0.9 });
      return [tl, s1];
    },
  });

  /* ───────── 16 당신의 답 ───────── */
  D.define('end', {
    build(el, c) {
      const out = $('.vote-out', el), vbs = $$('.vb', el);
      const SAY = {
        y: '튜링과 같은 편에 서셨습니다. 구별할 수 없다면 지능이 있다고 보자는 것 — 그것이 그의 제안이었습니다.',
        n: '그렇다면 한 가지 더 묻겠습니다. ‘진짜 생각’과 ‘완벽한 흉내’는 무엇으로 가려낼 수 있을까요?',
      };
      vbs.forEach((b) => b.addEventListener('click', () => {
        vbs.forEach((x) => { x.classList.toggle('on', x === b); x.classList.toggle('off', x !== b); });
        if (c.tw) c.tw.kill(); out.style.minHeight = '';
        c.tw = D.typed(out, { text: SAY[b.dataset.v], dur: 1.6 });
      }));
      c.clear = () => { if (c.tw) c.tw.kill(); out.innerHTML = ''; vbs.forEach((x) => x.classList.remove('on', 'off')); };
      const tl = D.tl(); kick(tl, el);
      tl.from($('.end-title', el), { y: 70, opacity: 0, duration: 0.9 }, 0.2)
        .from(vbs, { y: 220, rotation: (i) => (i ? 8 : -8), opacity: 0, stagger: 0.15, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }, 0.8);
      const s1 = D.tl()
        .from($$('.recap .note', el), { y: 380, rotation: () => gsap.utils.random(-12, 12), stagger: 0.14, duration: 0.8, ease: 'back.out(1.1)' }, 0)
        .from($('.next-note', el), { x: 1900, duration: 0.9, ease: 'power4.out' }, 0.6);
      return [tl, s1];
    },
    enter(el, c) { c.clear(); },
  });
})();
