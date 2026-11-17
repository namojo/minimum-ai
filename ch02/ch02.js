/* 2장 — 규칙에서 학습으로: 슬라이드별 움직임과 조작 */
(() => {
  const D = Deck, { $, $$ } = D;
  const rand = (a) => a[(Math.random() * a.length) | 0];
  const kick = (tl, el) => tl.from($('.kicker', el), { x: -50, opacity: 0, duration: 0.6 }, 0);
  const PAPER = '#F6F1E4', INK = '#17130F', RED = '#E23D1F', SOFT = '#6B6051';
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (parent, tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  /** 씨앗이 있는 난수(같은 그림을 매번 똑같이 그리기 위해) */
  const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r() + 1e-9)) * Math.cos(6.2832 * r());
  const josa = (w, a, b) => w + ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? a : b);
  const clearTimers = (c) => { (c.timers || []).forEach(clearTimeout); c.timers = []; };
  // overflow:clip 을 모르는 브라우저를 위한 안전망: 무대 안의 어떤 상자도 스크롤되지 않게 되돌린다
  if (typeof document !== 'undefined') document.addEventListener('scroll', (e) => {
    const t = e.target;
    if (t && t.nodeType === 1 && (t.scrollTop || t.scrollLeft) && t.closest('#viewport')) { t.scrollTop = 0; t.scrollLeft = 0; }
  }, true);

  /* ═════════ 알고리즘(화면과 분리 — node 로 따로 검증한다) ═════════ */

  /* 규칙 엔진: 나중에 넣은 규칙이 먼저 적용된다. 걸리는 규칙이 없으면 '고양이 아님'. */
  const ANIMALS = [
    { id: 'cat', name: '고양이', ear: 'p', fur: 1, snout: 's', cat: 1 },
    { id: 'dog', name: '귀가 늘어진 개', ear: 'd', fur: 1, snout: 'l', cat: 0 },
    { id: 'fold', name: '스코티시 폴드', ear: 'f', fur: 1, snout: 's', cat: 1, book: 1 },
    { id: 'shep', name: '귀가 선 개', ear: 'p', fur: 1, snout: 'l', cat: 0 },
    { id: 'sphynx', name: '스핑크스', ear: 'p', fur: 0, snout: 's', cat: 1, book: 1 },
    { id: 'pug', name: '얼굴이 납작한 개', ear: 'f', fur: 1, snout: 's', cat: 0 },
    { id: 'nude', name: '털 없는 개', ear: 'p', fur: 0, snout: 'l', cat: 0 },
    { id: 'spitz', name: '귀가 선 작은 개', ear: 'p', fur: 1, snout: 's', cat: 0 },
  ];
  const RULES = [
    { id: 'A', iff: '귀가 뾰족하면', then: '고양이다', v: 1, t: (a) => a.ear === 'p', book: 1 },
    { id: 'B', iff: '털이 없으면', then: '고양이가 아니다', v: 0, t: (a) => !a.fur, book: 1 },
    { id: 'C', iff: '귀가 접혀도 주둥이가 짧으면', then: '고양이다', v: 1, t: (a) => a.ear === 'f' && a.snout === 's' },
    { id: 'D', iff: '귀가 뾰족해도 주둥이가 길면', then: '고양이가 아니다', v: 0, t: (a) => a.ear === 'p' && a.snout === 'l' },
    { id: 'E', iff: '털이 없어도 주둥이가 짧으면', then: '고양이다', v: 1, t: (a) => !a.fur && a.snout === 's' },
  ];
  const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]));
  function judge(stack, a) {
    const hits = stack.filter((id) => RULE[id].t(a)), top = hits[hits.length - 1];
    return { v: top ? RULE[top].v : 0, by: top || null, clash: new Set(hits.map((id) => RULE[id].v)).size > 1 };
  }
  /** 지금 규칙표가 틀리는, 아직 등장하지 않은 동물 하나(방금 넣은 규칙이 틀리게 만든 동물이 먼저) */
  function nextException(stack, shown) {
    const hid = ANIMALS.filter((a) => !shown.includes(a.id)), last = stack[stack.length - 1];
    const bad = hid.filter((a) => judge(stack, a).v !== a.cat);
    return bad.find((a) => a.book) || bad.find((a) => judge(stack, a).by === last) || bad[0] || null;
  }

  /* 나이브 베이즈 스팸 분류기(단어 개수, 라플라스 평활) */
  const tokens = (s) => s.toLowerCase().split(/[\s\[\]!?,()@]+/).filter(Boolean);
  function makeNB() {
    const cnt = [new Map(), new Map()], tot = [0, 0], docs = [0, 0], vocab = new Set();
    const llr = (t) => Math.log(((cnt[1].get(t) || 0) + 1) / (tot[1] + vocab.size)) - Math.log(((cnt[0].get(t) || 0) + 1) / (tot[0] + vocab.size));
    return {
      vocab, docs, llr,
      learn(text, y) { docs[y]++; for (const t of tokens(text)) { cnt[y].set(t, (cnt[y].get(t) || 0) + 1); tot[y]++; vocab.add(t); } },
      prob(text) { let z = Math.log((docs[1] + 1) / (docs[0] + 1)); for (const t of tokens(text)) if (vocab.has(t)) z += llr(t); return 1 / (1 + Math.exp(-z)); },
      top(n) { return [...vocab].map((t) => [t, llr(t)]).sort((a, b) => b[1] - a[1]).slice(0, n); },
    };
  }
  // 시연용으로 지어낸 메일. y: 1 스팸, 0 정상
  const TRAIN = [
    ['promo@lucky-shop.example', '[광고] 무료 쿠폰 지금 받으세요', 1], ['event@bigsale.example', '이벤트 당첨 축하 지금 클릭', 1],
    ['win@prize-777.example', '무료 상품권 당첨 클릭 한 번으로', 1], ['ad@loan-fast.example', '[광고] 대출 한도 무료 조회 지금', 1],
    ['gift@lucky-shop.example', '축하합니다 경품 당첨 무료 배송', 1], ['info@bigsale.example', '마지막 기회 특가 이벤트 지금 클릭', 1],
    ['bonus@prize-777.example', '지금 가입 하면 포인트 무료 지급', 1], ['ad@cheap-deal.example', '[광고] 특가 할인 쿠폰 당첨', 1],
    ['minji@company.example', '내일 회의 자료 공유 드립니다', 0], ['no-reply@google.com', '보안 알림 새 기기 로그인', 0],
    ['teacher@school.example', '가을 운동회 이벤트 일정 안내', 0], ['mom@family.example', '주말 저녁 같이 먹자', 0],
    ['jisoo@company.example', '보고서 검토 부탁 드립니다', 0], ['library@city.example', '도서 반납 일정 안내', 0],
    ['no-reply@google.com', '계정 보안 점검 안내', 0], ['club@school.example', '동아리 모임 회의 일정 공유', 0],
  ];
  const WAVES = [
    [['newsale@bigsale.example', '[광고] 무료 쿠폰 이벤트 지금 클릭', 1], ['hr@company.example', '사내 체육 이벤트 일정 안내', 0],
      ['lucky@prize-777.example', '경품 당첨 축하 무료 배송', 1], ['no-reply@google.com', '새 기기 로그인 보안 알림', 0]],
    [['promo@lucky-shop.example', '무.료 쿠폰 지금 받으세요', 1], ['security@gogle.com', '계정 보안 점검 안내', 1],
      ['jisoo@company.example', '무료 폰트 로 만든 보고서 공유', 0], ['win@prize-777.example', '무.료 상품권 당.첨 축하', 1]],
    [['security@gogle.com', '계정 잠김 지금 확인', 1], ['promo@lucky-shop.example', '무_료 쿠폰 지금 받으세요', 1],
      ['teacher@school.example', '가을 운동회 이벤트 사진 공유', 0], ['win@prize-777.example', '무/료 상품권 당/첨 축하', 1]],
  ];
  const RULES0 = ['광고', '이벤트', '무료'], RULES_ADD = ['무.료', 'gogle.com', '당.첨'];
  const ruleHit = (rules, text) => rules.find((k) => text.includes(k)) || null;

  /* 로지스틱 회귀(경사 하강). 좌표는 −1…1 */
  function makeLR() {
    const w = [0, 0, 0];
    const p = (x, y) => 1 / (1 + Math.exp(-(w[0] * x + w[1] * y + w[2])));
    return {
      w, p, reset() { w[0] = w[1] = w[2] = 0; },
      step(pts, lr = 1.2) {
        let g0 = 0, g1 = 0, g2 = 0;
        for (const q of pts) { const e = p(q.x, q.y) - q.c; g0 += e * q.x; g1 += e * q.y; g2 += e; }
        const n = pts.length || 1; w[0] -= lr * g0 / n; w[1] -= lr * g1 / n; w[2] -= lr * g2 / n;
        return (Math.abs(g0) + Math.abs(g1) + Math.abs(g2)) / n;
      },
      right(pts) { return pts.filter((q) => (p(q.x, q.y) >= 0.5 ? 1 : 0) === q.c).length; },
    };
  }

  /* k-평균: 무작위로 고른 점 k개에서 출발해, 배정 → 중심 이동을 되풀이 */
  function makeKM(pts, k, rnd = Math.random) {
    const idx = pts.map((_, i) => i), cs = [];
    while (cs.length < k && idx.length) { const i = idx.splice((rnd() * idx.length) | 0, 1)[0]; cs.push({ x: pts[i].x, y: pts[i].y }); }
    const asg = pts.map(() => -1);
    return {
      cs, asg,
      assign() {
        let ch = 0;
        pts.forEach((q, i) => { let b = 0, bd = 1e9; cs.forEach((c, j) => { const d = (q.x - c.x) ** 2 + (q.y - c.y) ** 2; if (d < bd) { bd = d; b = j; } }); if (asg[i] !== b) { asg[i] = b; ch++; } });
        return ch;
      },
      means() {
        return cs.map((c, j) => { let sx = 0, sy = 0, n = 0; pts.forEach((q, i) => { if (asg[i] === j) { sx += q.x; sy += q.y; n++; } }); return n ? { x: sx / n, y: sy / n } : { x: c.x, y: c.y }; });
      },
    };
  }

  /* 밴딧 강화 학습: 동작마다 가치 Q, 소프트맥스로 고르고 보상으로 고친다 */
  function makeBandit(n, alpha = 0.5, tau = 0.3) {
    const q = Array(n).fill(0);
    const probs = () => { const e = q.map((v) => Math.exp(v / tau)), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
    return {
      q, probs,
      pick(r = Math.random()) { const p = probs(); let i = 0; while (i < n - 1 && (r -= p[i]) > 0) i++; return i; },
      reward(a, r) { q[a] += alpha * (r - q[a]); },
      reset() { q.fill(0); },
    };
  }

  /* 벽돌탑: 벽돌은 바로 아래 벽돌(물리)과, 보이지 않는 다른 벽돌 하나(숨은 의존)에 기대고 있다 */
  const BW = 128, BH = 54, BG = 4, ROWS = 11, COLS = 6;
  function makeTower(rnd = Math.random) {
    const bricks = [];
    for (let r = 0; r < ROWS; r++) {
      const odd = r % 2, n = odd ? COLS - 1 : COLS;
      for (let c = 0; c < n; c++) bricks.push({ id: bricks.length, r, x: (c + (odd ? 0.5 : 0)) * (BW + BG), y: (ROWS - 1 - r) * (BH + BG), sup: [], dep: null, gone: false });
    }
    bricks.forEach((b) => {
      if (!b.r) return;
      b.sup = bricks.filter((o) => o.r === b.r - 1 && Math.abs(o.x - b.x) < BW).map((o) => o.id);
      if (rnd() < 0.8) { const lower = bricks.filter((o) => o.r < b.r && o.r >= b.r - 4); b.dep = lower[(rnd() * lower.length) | 0].id; }
    });
    return {
      bricks,
      /** id 를 빼고, 연쇄로 무너지는 벽돌을 물결(파) 단위로 돌려준다 */
      pull(id) {
        bricks[id].gone = true; const waves = [];
        for (;;) {
          const fall = bricks.filter((b) => !b.gone && ((b.dep !== null && bricks[b.dep].gone) || (b.r > 0 && b.sup.every((s) => bricks[s].gone))));
          if (!fall.length) break;
          fall.forEach((b) => { b.gone = true; }); waves.push(fall.map((b) => b.id));
        }
        return waves;
      },
    };
  }

  const LR_DEMO = [[-0.3, 0.8], [-0.62, 0.78], [-0.05, 0.74]]; // 단계 시연: 왼쪽 위에 '고양이' 예제 셋을 더 찍는다
  D.ch2 = { LR_DEMO, ANIMALS, RULES, judge, nextException, tokens, makeNB, TRAIN, WAVES, RULES0, RULES_ADD, ruleHit, makeLR, makeKM, makeBandit, makeTower, rng, gauss };

  /* ═════════ 01 표지 ═════════ */
  D.define('cover', {
    build(el) {
      const tl = D.tl(); kick(tl, el);
      tl.from($('.cover-print', el), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'power3.inOut' }, 0)
        .from($('.cover-print img', el), { scale: 1.22, duration: 2.4, ease: 'power2.out' }, 0)
        .add(D.typed($('.cover-title', el), { dur: 2.3 }), 0.6)
        .from($('.cover-seal', el), { scale: 0, rotation: -140, duration: 0.8, ease: 'back.out(2)' }, 1.0)
        .from($$('.cover-rule > *', el), { opacity: 0, x: -24, stagger: 0.22, duration: 0.4 }, 2.7)
        .from($('.cover-note', el), { y: 330, rotation: -16, duration: 0.9, ease: 'back.out(1.3)' }, 3.3);
      return [tl];
    },
    live(el) {
      const img = $('.cover-print img', el), seal = $('.cover-seal', el);
      const qx = gsap.quickTo(img, 'x', { duration: 1, ease: 'power3' }), qy = gsap.quickTo(img, 'y', { duration: 1, ease: 'power3' });
      const sx = gsap.quickTo(seal, 'x', { duration: 1.4, ease: 'power3' });
      const tick = () => { qx((D.pointer.x - 960) * -0.024); qy((D.pointer.y - 540) * -0.024); sx((D.pointer.x - 960) * 0.012); };
      gsap.ticker.add(tick);
      // '규칙'이라는 낱말에서 카드가 한 장씩 빠져나와 기계 옆 카드 더미로 날아간다
      const live = new Set();
      const fly = () => {
        const em = $('.cover-title em', el); if (!em || el.style.visibility === 'hidden') return;
        const card = document.createElement('i'); card.className = 'fly mono'; card.textContent = 'IF'; el.appendChild(card);
        const x0 = em.offsetLeft + $('.cover-title', el).offsetLeft + em.offsetWidth * (0.25 + Math.random() * 0.5), y0 = em.offsetTop + $('.cover-title', el).offsetTop + 30;
        const x1 = 1120 + Math.random() * 90, y1 = 640 + Math.random() * 70, tl = gsap.timeline({ onComplete() { card.remove(); live.delete(tl); } });
        tl.fromTo(card, { x: x0, y: y0, scale: 0.3, rotation: -20, opacity: 0 }, { x: x1, duration: 1.5, ease: 'none' }, 0)
          .to(card, { scale: 1, opacity: 1, duration: 0.3 }, 0)
          .to(card, { y: y0 - 46, rotation: 12, duration: 0.6, ease: 'power2.out' }, 0)
          .to(card, { y: y1, rotation: 40 + Math.random() * 60, duration: 0.9, ease: 'power2.in' }, 0.6)
          .to(card, { opacity: 0, scale: 0.5, duration: 0.25 }, 1.25);
        tl.card = card; live.add(tl);
      };
      const id = setInterval(fly, 620);
      return () => { gsap.ticker.remove(tick); clearInterval(id); live.forEach((t) => { t.kill(); t.card.remove(); }); };
    },
  });

  /* ═════════ 02 자전거 ═════════ */
  D.define('bike', {
    build(el) {
      const svg = $('.tracks', el), fails = [], Y0 = 708;
      const LEN = [170, 300, 250, 470, 390, 700, 980];
      LEN.forEach((len, i) => {
        const r = rng(11 + i * 7), y0 = Y0 + i * 22, f = 0.03 + r() * 0.012, ph = r() * 6;
        let d = '';
        for (let x = 0; x <= len; x += 6) { const t = x / len; d += `${x ? 'L' : 'M'}${140 + x} ${(y0 + (2 + 15 * t ** 3) * Math.sin(x * f + ph)).toFixed(1)}`; }
        const path = mk(svg, 'path', { d, class: 'tr' }), ex = 140 + len + 16, ey = y0 + 15 * Math.sin(len * f + ph);
        const xm = mk(svg, 'path', { d: `M${ex - 9} ${ey - 9}L${ex + 9} ${ey + 9}M${ex + 9} ${ey - 9}L${ex - 9} ${ey + 9}`, class: 'tx' });
        fails.push([path, xm]);
      });
      // 마지막 한 번: 비틀거림이 잦아들며 끝까지
      const yF = Y0 + LEN.length * 22 + 10; let d = '';
      for (let x = 0; x <= 1620; x += 6) d += `${x ? 'L' : 'M'}${140 + x} ${(yF + 16 * Math.exp(-x / 260) * Math.sin(x * 0.034)).toFixed(1)}`;
      const fin = mk(svg, 'path', { d, class: 'tr fin' }), head = mk(svg, 'path', { d: `M1756 ${yF - 14}L1784 ${yF}L1756 ${yF + 14}Z`, class: 'th' });
      [...fails.map((f) => f[0]), fin].forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });

      const notes = $$('.bike-rules .note', el), tl = D.tl(); kick(tl, el);
      tl.from($('.bike-print', el), { clipPath: 'inset(0% 0% 0% 100%)', duration: 1.2, ease: 'power3.inOut' }, 0.1)
        .from($('.bike-print img', el), { scale: 1.18, duration: 2.2, ease: 'power2.out' }, 0.1)
        .from(notes, { x: -420, rotation: () => gsap.utils.random(-14, 14), opacity: 0, stagger: 0.32, duration: 0.7, ease: 'back.out(1.3)' }, 0.5);
      const s1 = D.tl();
      s1.to($('.bike-rules', el), { x: -80, y: 60, rotation: -7, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0)
        .add(D.typed($('.bike-h1', el), { dur: 0.9 }), 0.45)
        .from($('.bike-cap', el), { opacity: 0, duration: 0.4 }, 0.6);
      fails.forEach(([p, xm], i) => {
        const at = 0.8 + i * 0.36;
        s1.to(p, { strokeDashoffset: 0, duration: 0.34, ease: 'power1.in' }, at)
          .from(xm, { scale: 0, rotation: 90, transformOrigin: '50% 50%', autoAlpha: 0, duration: 0.22, ease: 'back.out(3)' }, at + 0.32);
      });
      const s2 = D.tl();
      s2.add(D.typed($('.bike-h2', el), { dur: 1.0 }), 0)
        .to(fin, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.3)
        .from(head, { autoAlpha: 0, x: -30, duration: 0.3 }, 1.7)
        .from($('.bike-body', el), { autoAlpha: 0, y: 30 }, 1.3)
        .from($$('.bike-tags > *', el), { autoAlpha: 0, y: 40, stagger: 0.18, ease: 'back.out(1.6)' }, 1.9);
      return [tl, s1, s2];
    },
  });

  /* ═════════ 03 IF-THEN ═════════ */
  D.define('ifthen', {
    build(el, c) {
      const range = $('.ifm input', el), outT = $('.ifm output', el), out = $('.ifm-out', el), msg = $('.ifm-msg', el);
      const cond = (k) => $(`.cond[data-k="${k}"]`, el), S = (c.S = { temp: 36.5, throat: false, cough: false, was: false });
      c.upd = () => {
        const t = S.temp >= 38, n = [t, S.throat, S.cough].filter(Boolean).length, all = n === 3;
        cond('temp').classList.toggle('on', t); cond('throat').classList.toggle('on', S.throat); cond('cough').classList.toggle('on', S.cough);
        outT.textContent = S.temp.toFixed(1) + '℃'; range.value = S.temp;
        out.classList.toggle('on', all);
        msg.textContent = all ? '세 조건이 모두 참 — 규칙이 발동했습니다.' : n ? `조건 세 개 중 ${n}개만 참입니다. 규칙은 움직이지 않습니다.` : '조건 세 개가 모두 참이어야 규칙이 움직입니다.';
        if (all && !S.was) { gsap.fromTo($('b', out), { scale: 1.5, rotation: -4 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2.5)' }); D.sfx('bell'); }
        S.was = all;
      };
      c.reset = () => { clearTimers(c); if (c.tw) c.tw.kill(); S.temp = 36.5; S.throat = S.cough = false; c.upd(); };
      range.addEventListener('input', () => { S.temp = +range.value; c.upd(); });
      range.addEventListener('pointerup', () => range.blur()); // 손을 떼면 화살표 키가 다시 넘김으로 돌아간다
      el.addEventListener('click', (e) => {
        const b = e.target.closest('button.cond'); if (!b) return;
        S[b.dataset.k] = !S[b.dataset.k]; D.sfx('key'); c.upd();
      });
      c.reset();
      const tl = D.tl(); kick(tl, el);
      tl.add(D.typed($('.if-quote', el), { dur: 2.0 }), 0.3)
        .from($('.ifm', el), { x: 900, rotation: 6, duration: 1.0, ease: 'power4.out' }, 0.5)
        .from($$('.ifm > *', el), { opacity: 0, y: 30, stagger: 0.09, duration: 0.5 }, 1.0)
        .from($('.if-name', el), { opacity: 0, y: 50 }, 2.4)
        .from($('.if-how', el), { opacity: 0, y: 30 }, 2.8);
      return [tl, D.tl()];
    },
    enter(el, c) { c.reset(); },
    step(n, c, fwd) {
      c.reset();
      if (!(n === 1 && fwd)) return;
      const S = c.S;
      c.tw = gsap.to(S, { temp: 38.6, duration: 1.3, delay: 0.3, ease: 'power2.inOut', onUpdate: c.upd });
      c.timers.push(setTimeout(() => { S.throat = true; D.sfx('key'); c.upd(); }, 1900), setTimeout(() => { S.cough = true; D.sfx('key'); c.upd(); }, 2500));
    },
    leave(el, c) { clearTimers(c); if (c.tw) c.tw.kill(); },
  });

  /* ═════════ 04 마이신 ═════════ */
  D.define('mycin', {
    build(el, c) {
      const wall = $('.my-cards', el);
      wall.innerHTML = Array.from({ length: 450 }, () => '<i></i>').join('');
      c.cards = $$('i', wall);
      const tl = D.tl(), crt = $$('.my-crt .ln', el); kick(tl, el);
      tl.add(D.scramble($('.my-title', el), '마이신', 1.1), 0.2)
        .from($('.my-sub', el), { opacity: 0, x: -30 }, 1.1)
        .from(c.cards, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(2)', stagger: { each: 0.0032, from: 'random' } }, 0.4)
        .from($('.my-count', el), { opacity: 0, y: 30 }, 1.6)
        .add(D.count($('.my-count b', el), 0, 450, 1.5), 1.2)
        .from($('.my-crt', el), { y: 500, rotation: -5, duration: 0.9, ease: 'power4.out' }, 0.9)
        .add(D.typed(crt[0], { dur: 0.7 }), 1.8).from(crt[1], { opacity: 0, duration: 0.2 }, 2.55)
        .add(D.typed(crt[2], { dur: 0.9 }), 2.9).from(crt[3], { opacity: 0, duration: 0.2 }, 3.85)
        .from(crt[4], { opacity: 0, x: -20, duration: 0.4 }, 4.2)
        .from($('.my-crt-cap', el), { opacity: 0 }, 2.0);
      const s1 = D.tl()
        .from($('.my-eval', el), { autoAlpha: 0, y: 60, duration: 0.5 }, 0)
        .from($('.my-eval .fill', el), { scaleX: 0, transformOrigin: '0 50%', duration: 1.0, ease: 'power3.out' }, 0.3)
        .from($('.my-eval .range', el), { scaleX: 0, transformOrigin: '0 50%', duration: 0.8, ease: 'power3.out' }, 0.7)
        .from($$('.my-eval .ev b', el), { opacity: 0, x: -20, stagger: 0.4 }, 0.9)
        .from($('.my-eval p', el), { opacity: 0 }, 1.6);
      return [tl, s1];
    },
    live(el, c) {
      // 규칙을 하나씩 훑는 불빛 + 포인터 가까이의 카드가 들린다
      const wallEl = $('.my-wall', el); let k = 0, on = [];
      const tick = () => {
        on.forEach((i) => c.cards[i].classList.remove('up')); on = [];
        k = (k + 1) % 450; for (let j = 0; j < 3; j++) on.push((k + j) % 450);
        const px = D.pointer.x - wallEl.offsetLeft, py = D.pointer.y - wallEl.offsetTop;
        if (px > -40 && px < 940 && py > -40 && py < 380 && performance.now() - D.pointer.moved < 3000) {
          const cx = Math.floor(px / 30), cy = Math.floor(py / 22);
          for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (x >= 0 && x < 30 && y >= 0 && y < 15 && Math.abs(x - cx) + Math.abs(y - cy) < 4) on.push(y * 30 + x);
        }
        on.forEach((i) => c.cards[i].classList.add('up'));
      };
      gsap.ticker.add(tick);
      return () => { gsap.ticker.remove(tick); on.forEach((i) => c.cards[i].classList.remove('up')); };
    },
  });

  /* ═════════ 05 쓰이지 못한 명의 — 확신도 ═════════ */
  D.define('legacy', {
    build(el, c) {
      const range = $('.cf input', el), dots = $('.cf-dots', el), o1 = $('.cf-rule output', el), o2 = $('.cf-read b', el);
      dots.innerHTML = Array.from({ length: 50 }, () => '<i></i>').join('');
      const ds = $$('i', dots);
      c.set = (v) => { range.value = v; const n = Math.round(v * 50); ds.forEach((d, i) => d.classList.toggle('on', i < n)); o1.textContent = (+v).toFixed(2); o2.textContent = Math.round(v * 100) + '%'; };
      range.addEventListener('input', () => c.set(+range.value)); c.set(0.7);
      range.addEventListener('pointerup', () => range.blur());
      const tl = D.tl(); kick(tl, el);
      tl.from($('.lg-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.lg-print', el), { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0.3)
        .from($('.lg-print img', el), { scale: 1.15, duration: 2.2, ease: 'power2.out' }, 0.3)
        .from($('.lg-stamp', el), { scale: 3.4, opacity: 0, duration: 0.32, ease: 'power3.in' }, 1.5)
        .from($$('.lg-why', el), { x: 700, rotation: () => gsap.utils.random(6, 14), opacity: 0, stagger: 0.3, duration: 0.8, ease: 'back.out(1.2)' }, 1.9)
        .from($('.lg-q', el), { opacity: 0, y: 50, duration: 0.8 }, 2.5);
      const o = { v: 0 };
      const s1 = D.tl()
        .to($('.lg-q .in', el), { x: -60, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0)
        .from($('.cf', el), { y: 620, rotation: 4, autoAlpha: 0, duration: 0.9, ease: 'power4.out' }, 0.15)
        .fromTo(o, { v: 0 }, { v: 0.7, duration: 1.2, ease: 'power2.out', onUpdate: () => c.set(o.v) }, 0.5);
      return [tl, s1];
    },
  });

  /* ═════════ 06 지금도 일하는 규칙 ═════════ */
  const TMAIL = [
    ['shop@market.example', '[광고] 주말 특가 안내'],
    ['club@hobby.example', '가입 감사 이벤트 당첨 안내'],
    ['minsu@office.example', '내일 회의 자료 보냅니다'],
  ];
  D.define('today', {
    build(el, c) {
      const box = $('.tr-mails', el), chip = $('.chip', el), log = $('.tr-log', el), gates = $$('.gate', el), bins = { in: $('.bin.inbox', el), sp: $('.bin.spam', el) };
      box.innerHTML = TMAIL.map((m, i) => `<button class="tm" data-i="${i}"><i class="mono">${m[0]}</i><b>${m[1]}</b></button>`).join('');
      const KW = ['광고', '이벤트'], GX = [400, 790];
      const line = (html, cls = '') => { const li = document.createElement('li'); li.className = cls; li.innerHTML = html; log.appendChild(li); gsap.from(li, { opacity: 0, x: -20, duration: 0.25 }); };
      c.clear = () => {
        if (c.run) { c.run.kill(); c.run = null; }
        log.innerHTML = ''; gsap.set(chip, { x: 0, y: 0, rotation: 0, autoAlpha: 0 });
        gates.forEach((g) => g.classList.remove('hit', 'pass')); bins.in.classList.remove('on'); bins.sp.classList.remove('on');
        $$('.tm', el).forEach((b) => b.classList.remove('on'));
      };
      c.go = (i) => {
        c.clear(); $$('.tm', el)[i].classList.add('on');
        const text = TMAIL[i][1], tl = (c.run = gsap.timeline());
        tl.set(chip, { autoAlpha: 1 }).fromTo(chip, { x: 0, y: 0, scale: 0.4 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
        let caught = -1;
        KW.forEach((kw, k) => {
          if (caught >= 0) return;
          const hit = text.includes(kw);
          tl.to(chip, { x: GX[k], duration: 0.5, ease: 'power2.inOut' })
            .call(() => { gates[k].classList.add(hit ? 'hit' : 'pass'); D.sfx(hit ? 'thud' : 'tick'); line(`규칙 0${k + 1}<br>‘${kw}’ 포함? <b>${hit ? '예' : '아니오'}</b>`, hit ? 'hit' : ''); })
            .to(chip, { duration: 0.4 });
          if (hit) caught = k;
        });
        if (caught >= 0) {
          tl.to(chip, { y: 139, rotation: 12, duration: 0.45, ease: 'power2.in' })
            .call(() => { bins.sp.classList.add('on'); line(`→ <em>스팸함</em><small>이유: 규칙 0${caught + 1}</small>`, 'res'); });
        } else {
          tl.to(chip, { x: 1140, duration: 0.5, ease: 'power2.inOut' }).to(chip, { y: 28, duration: 0.2, ease: 'power2.out' })
            .call(() => { bins.in.classList.add('on'); line('→ <em>받은편지함</em><small>걸린 규칙이 없습니다</small>', 'res'); D.sfx('bell'); });
        }
      };
      box.addEventListener('click', (e) => { const b = e.target.closest('.tm'); if (b) c.go(+b.dataset.i); });
      const tl = D.tl(); kick(tl, el);
      tl.from($('.td-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.td-xcon', el), { x: 80, opacity: 0 }, 0.5)
        .add(D.count($('.td-xcon b', el), 0, 4000, 1.5), 0.6)
        .from($('.trace h3', el), { opacity: 0, x: -30 }, 0.9)
        .from($('.rail', el), { scaleX: 0, duration: 1.1, ease: 'power3.inOut' }, 0.9)
        .from($$('.tm', el), { y: -70, opacity: 0, rotation: () => gsap.utils.random(-8, 8), stagger: 0.1, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, 1.1)
        .from(gates, { y: -260, opacity: 0, stagger: 0.18, duration: 0.7, ease: 'bounce.out' }, 1.3)
        .from([bins.in, bins.sp], { opacity: 0, scale: 0.8, stagger: 0.15, ease: 'back.out(2)' }, 1.8)
        .from($('.tr-rcpt', el), { y: -920, duration: 0.9, ease: 'power4.out' }, 1.5)
        .from($('.td-loan', el), { opacity: 0, y: 30 }, 2.2);
      return [tl, D.tl()];
    },
    enter(el, c) { c.clear(); },
    step(n, c, fwd) { if (n === 1 && fwd) c.go(1); else c.clear(); },
    leave(el, c) { if (c.run) { c.run.kill(); c.run = null; } },
  });

  /* ═════════ 07 규칙으로 고양이 찾기 ═════════ */
  function face(a) {
    const F = a.fur ? INK : PAPER, L = a.fur ? PAPER : INK, st = `stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;
    let s = '';
    if (a.ear === 'p') s += `<path d="M28 64L34 10L68 46ZM112 64L106 10L72 46Z" fill="${F}" ${st}/>`;
    else if (a.ear === 'f') s += `<path d="M26 62L40 28L66 46ZM114 62L100 28L74 46Z" fill="${F}" ${st}/><path d="M40 28L56 52L30 56ZM100 28L84 52L110 56Z" fill="${a.fur ? SOFT : PAPER}" ${st}/>`;
    else s += `<ellipse cx="22" cy="86" rx="14" ry="32" transform="rotate(12 22 86)" fill="${F}" ${st}/><ellipse cx="118" cy="86" rx="14" ry="32" transform="rotate(-12 118 86)" fill="${F}" ${st}/>`;
    s += `<ellipse cx="70" cy="80" rx="${a.cat ? 47 : 42}" ry="${a.cat ? 38 : 43}" fill="${F}" ${st}/>`;
    if (!a.fur) s += `<path d="M52 50q18-9 36 0M57 59q13-6 26 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    if (a.snout === 'l') s += `<ellipse cx="70" cy="104" rx="23" ry="21" fill="${PAPER}" ${st}/>`;
    else s += `<ellipse cx="70" cy="98" rx="19" ry="13" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
    if (a.cat) {
      s += `<ellipse cx="50" cy="74" rx="9" ry="7" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><ellipse cx="90" cy="74" rx="9" ry="7" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><rect x="48.5" y="68" width="3" height="12" fill="${INK}"/><rect x="88.5" y="68" width="3" height="12" fill="${INK}"/>`;
      s += `<path d="M64 92h12l-6 7z" fill="${RED}"/><path d="M70 99v4M70 103q-5 5-9 1M70 103q5 5 9 1" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
      s += `<path d="M48 96L10 88M48 100L8 100M48 104L10 112M92 96L130 88M92 100L132 100M92 104L130 112" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`;
    } else {
      const ny = a.snout === 'l' ? 92 : 91;
      s += `<circle cx="52" cy="72" r="6" fill="${L}"/><circle cx="88" cy="72" r="6" fill="${L}"/>`;
      s += `<ellipse cx="70" cy="${ny}" rx="9" ry="6.5" fill="${INK}"/><path d="M70 ${ny + 6}v7" stroke="${INK}" stroke-width="2.5"/>`;
      s += `<path d="M63 ${ny + 13}h14v7a7 7 0 0 1-14 0z" fill="${RED}" stroke="${INK}" stroke-width="2"/>`;
    }
    return `<svg viewBox="0 0 140 132" aria-hidden="true">${s}</svg>`;
  }
  const FEAT = { p: '귀 뾰족', f: '귀 접힘', d: '귀 늘어짐', s: '주둥이 짧음', l: '주둥이 김' };
  const featSay = (a) => `${{ p: '귀가 뾰족하고', f: '귀가 접혀 있고', d: '귀가 늘어져 있고' }[a.ear]}, ${a.fur ? '털이 있고' : '털이 없고'}, ${a.snout === 's' ? '주둥이가 짧습니다' : '주둥이가 깁니다'}`;
  D.define('cats', {
    build(el, c) {
      const list = $('.ct-list', el), grid = $('.ct-grid', el), msg = $('.ct-msg', el), sc = $('.ct-score b', el), tot = $('.ct-score i', el);
      list.innerHTML = RULES.map((r) => `<button class="rc" data-id="${r.id}"><i class="ord mono"></i><span class="tx"><b class="mono">IF</b> ${r.iff} <b class="mono">THEN</b> <u>${r.then}</u></span>${r.book ? '' : '<em>예시</em>'}</button>`).join('');
      const S = (c.S = { stack: [], shown: [] });
      const A = (id) => ANIMALS.find((a) => a.id === id);
      const card = (a, anim) => {
        const d = document.createElement('div'); d.className = 'an'; d.dataset.id = a.id;
        d.innerHTML = `${face(a)}<b>${a.name}</b><p class="ft"><span>${FEAT[a.ear]}</span><span>${a.fur ? '털 있음' : '털 없음'}</span><span>${FEAT[a.snout]}</span></p><p class="vd"><i class="mk"></i><span></span></p>`;
        const ph = $('.an.ph', grid); if (ph) grid.replaceChild(d, ph); else grid.appendChild(d);
        if (anim) { gsap.from(d, { y: -260, rotation: gsap.utils.random(-14, 14), opacity: 0, duration: 0.6, ease: 'back.out(1.4)' }); D.sfx('thud'); }
      };
      c.paint = () => {
        let ok = 0;
        S.shown.forEach((id) => {
          const a = A(id), j = judge(S.stack, a), good = j.v === a.cat, d = $(`.an[data-id="${id}"]`, grid);
          if (good) ok++;
          d.classList.toggle('bad', !good); d.classList.toggle('good', good);
          $('.vd span', d).innerHTML = `${j.v ? '고양이' : '고양이 아님'}<small>${j.by ? `규칙 ${S.stack.indexOf(j.by) + 1}${j.clash ? ' · 규칙끼리 충돌' : ''}` : '걸린 규칙 없음'}</small>`;
        });
        sc.textContent = ok; tot.textContent = S.shown.length;
        $$('.rc', list).forEach((b) => { const k = S.stack.indexOf(b.dataset.id); b.classList.toggle('on', k >= 0); $('.ord', b).textContent = k >= 0 ? k + 1 : '+'; });
        return ok;
      };
      const twins = () => {
        for (const id of S.shown) {
          const a = A(id); if (judge(S.stack, a).v === a.cat) continue;
          const b = S.shown.map(A).find((o) => o.cat !== a.cat && o.ear === a.ear && o.fur === a.fur && o.snout === a.snout);
          if (b) return a.cat ? [a, b] : [b, a];
        }
        return null;
      };
      c.say = (arrived) => {
        const ok = c.paint(), n = S.shown.length, tw = twins();
        if (!S.stack.length) msg.innerHTML = '규칙이 하나도 없으면 컴퓨터는 전부 ‘고양이 아님’이라고 답합니다. 왼쪽에서 <b>규칙 카드</b>를 눌러 보세요.';
        else if (arrived) {
          const j = judge(S.stack, arrived);
          msg.innerHTML = `새 예외 — <b>${arrived.name}</b>. ${featSay(arrived)}. 규칙표의 답은 ‘${j.v ? '고양이' : '고양이 아님'}’. <b>틀렸습니다.</b>`;
        } else if (tw && S.stack.length >= 3) msg.innerHTML = `<b>${josa(tw[0].name, '과', '와')} ${josa(tw[1].name, '은', '는')}</b> 귀·털·주둥이가 똑같습니다. 어떤 규칙을 더해도 둘 중 하나는 틀립니다. 그런데 당신은 한눈에 가려냈죠.`;
        else if (ok === n) msg.innerHTML = '지금은 전부 맞습니다. 하지만 세상에는 아직 만나지 못한 동물이 남아 있습니다.';
        else msg.innerHTML = `규칙 ${S.stack.length}개로 ${n}마리 중 ${n - ok}마리를 틀립니다. 규칙을 더 넣거나, 넣은 규칙을 다시 빼 보세요.`;
      };
      c.toggle = (id) => {
        const k = S.stack.indexOf(id), added = k < 0;
        if (added) S.stack.push(id); else S.stack.splice(k, 1);
        D.sfx('flip'); clearTimers(c); c.say(null);
        if (!added) return;
        c.timers.push(setTimeout(() => {
          const a = nextException(S.stack, S.shown); if (!a) return;
          S.shown.push(a.id); card(a, true); c.say(a);
        }, 750));
      };
      c.reset = () => { clearTimers(c); S.stack = []; S.shown = ['cat', 'dog']; grid.innerHTML = '<div class="an ph"><b>?</b><span>아직 만나지 못한 동물</span></div>'.repeat(8); S.shown.forEach((id) => card(A(id), false)); c.say(null); };
      el.addEventListener('click', (e) => {
        const r = e.target.closest('.rc'), b = e.target.closest('[data-act=reset]');
        if (r) c.toggle(r.dataset.id); else if (b) c.reset();
      });
      c.reset();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.ct-title', el), { y: 50, opacity: 0 }, 0.1)
        .from($('.ct-rules h3', el), { opacity: 0 }, 0.5)
        .from($$('.rc', el), { x: -500, rotation: () => gsap.utils.random(-8, 8), opacity: 0, stagger: 0.09, duration: 0.7, ease: 'back.out(1.2)', clearProps: 'transform,opacity' }, 0.5)
        .from(grid, { opacity: 0, y: 80, duration: 0.8 }, 0.7)
        .from([$('.ct-foot', el), $('.ct-reset', el), $('.ct-cap', el)], { opacity: 0, stagger: 0.1 }, 1.3);
      return [tl, D.tl()];
    },
    enter(el, c) { c.reset(); },
    step(n, c, fwd) {
      c.reset();
      if (n === 1 && fwd) c.timers.push(setTimeout(() => { c.toggle('A'); c.timers.push(setTimeout(() => c.toggle('B'), 2600)); }, 350));
    },
    leave(el, c) { clearTimers(c); },
  });

  /* ═════════ 08 암묵지 ═════════ */
  const TAC = [ // 책의 세 사례(도예가·조종사·어머니)를 규칙으로 옮겨 보려는, 지어낸 예시 문장
    ['흙이 조금 무르다 싶으면', '손끝의 힘을 조금… 얼마나?'],
    ['기체가 이런 식으로 떨리면', '조종간을… 어떻게?'],
    ['울음소리가 이렇게 들리면', '배가 고픈… 아니, 아픈 건가?'],
  ];
  D.define('tacit', {
    build(el, c) {
      const iff = $('.tc-if', el), then = $('.tc-then', el), chips = $$('.tcc', el);
      const erase = (node) => { const o = { i: node.textContent.length }, full = node.textContent; return gsap.to(o, { i: 0, duration: Math.max(0.3, full.length * 0.028), ease: 'none', onUpdate() { node.textContent = full.slice(0, Math.round(o.i)); if (Math.round(o.i) % 3 === 0) D.sfx('tick'); } }); };
      c.blank = () => { if (c.run) { c.run.kill(); c.run = null; } iff.textContent = ''; then.textContent = ''; iff.style.minHeight = then.style.minHeight = ''; chips.forEach((b) => b.classList.remove('on', 'fail')); };
      c.play = (k) => {
        c.blank(); chips[k].classList.add('on');
        const tl = (c.run = gsap.timeline());
        tl.add(D.typed(iff, { text: TAC[k][0], dur: 0.9 }))
          .add(D.typed(then, { text: TAC[k][1], dur: 1.0 }), '+=0.25')
          .call(() => { iff.textContent = TAC[k][0]; then.textContent = TAC[k][1]; }, null, '+=0.8')
          .add(() => tl.add(erase(then)).add(erase(iff), '-=0.1').call(() => { then.textContent = '…… 말로 옮길 수 없음'; chips[k].classList.add('fail'); D.sfx('thud'); }));
      };
      el.addEventListener('click', (e) => { const b = e.target.closest('.tcc'); if (b) { clearTimers(c); c.play(+b.dataset.k); } });
      const tl = D.tl(); kick(tl, el);
      tl.from($('.tc-q', el), { opacity: 0, y: 20 }, 0.2)
        .add(D.typed($('.tc-a', el), { dur: 1.5 }), 0.8)
        .from($('.tc-print', el), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0.4)
        .from($('.tc-print img', el), { scale: 1.2, duration: 2.4, ease: 'power2.out' }, 0.4)
        .from($('.tc-card', el), { x: 1000, rotation: 5, duration: 1.0, ease: 'power4.out' }, 1.0)
        .from(chips, { y: 40, opacity: 0, stagger: 0.1, ease: 'back.out(1.8)', clearProps: 'transform,opacity' }, 1.6);
      const s1 = D.tl()
        .from($('.tc-pol blockquote', el), { autoAlpha: 0, y: 50, duration: 0.8 }, 0)
        .from($('.tc-pol .who', el), { autoAlpha: 0, x: -30 }, 0.6)
        .from($$('.tc-pol .defs p', el), { autoAlpha: 0, y: 30, stagger: 0.25 }, 0.9);
      const s2 = D.tl().from($('.tc-stamp', el), { scale: 3.4, autoAlpha: 0, duration: 0.32, ease: 'power3.in' }, 0);
      return [tl, s1, s2];
    },
    enter(el, c, o) { c.blank(); clearTimers(c); if (!o.atEnd) c.timers.push(setTimeout(() => c.play(0), 2900)); },
    leave(el, c) { clearTimers(c); if (c.run) { c.run.kill(); c.run = null; } },
  });

  /* ═════════ 09 벽돌탑 ═════════ */
  D.define('tower', {
    build(el, c) {
      const box = $('.tw-bricks', el), links = $('.tw-links', el), n1 = $('.n1', el), n2 = $('.n2', el), msg = $('.tw-msg', el);
      const S = (c.S = { T: null, pulled: 0, fell: 0 });
      const GY = 656; // 바닥선(탑 좌표)
      c.rebuild = () => {
        gsap.killTweensOf($$('.brick', box)); clearTimers(c);
        S.T = makeTower(); S.pulled = S.fell = 0; n1.textContent = n2.textContent = '0'; links.innerHTML = '';
        box.innerHTML = S.T.bricks.map((b) => `<button class="brick" data-id="${b.id}" style="left:${b.x}px;top:${b.y + 18}px"><span class="mono">#${String(1000 + ((b.id * 7919 + 4217) % 9000)).slice(0, 4)}</span></button>`).join('');
        msg.textContent = '아무 벽돌이나 하나 눌러서 빼 보세요.';
      };
      c.pull = (id) => {
        const b = S.T.bricks[id]; if (!b || b.gone) return;
        const el2 = (i) => $(`.brick[data-id="${i}"]`, box), waves = S.T.pull(id), cnt = waves.reduce((a, w) => a + w.length, 0);
        S.pulled++; S.fell += cnt; n1.textContent = S.pulled; D.sfx('flip');
        const me = el2(id); me.classList.add('out');
        gsap.to(me, { scale: 1.25, y: -14, duration: 0.18, ease: 'power2.out' }); gsap.to(me, { autoAlpha: 0, x: -90, duration: 0.4, delay: 0.18, ease: 'power2.in' });
        waves.forEach((w, wi) => w.forEach((fid) => {
          const f = S.T.bricks[fid], fe = el2(fid), at = 0.3 + wi * 0.24 + Math.random() * 0.1;
          if (f.dep !== null && S.T.bricks[f.dep].gone) {
            const d = S.T.bricks[f.dep], ln = mk(links, 'path', { d: `M${d.x + BW / 2} ${d.y + 18 + BH / 2}L${f.x + BW / 2} ${f.y + 18 + BH / 2}` });
            gsap.fromTo(ln, { opacity: 0 }, { opacity: 1, duration: 0.15, delay: at - 0.15 }); gsap.to(ln, { opacity: 0, duration: 0.9, delay: at + 0.9 });
          }
          fe.classList.add('fall');
          gsap.to(fe, { y: GY - BH - (f.y + 18) - Math.random() * 30, x: gsap.utils.random(-70, 70), rotation: gsap.utils.random(-80, 80), duration: 0.45 + (ROWS - f.r) * 0.03, delay: at, ease: 'power2.in', onComplete() { D.sfx('thud'); } });
        }));
        c.timers.push(setTimeout(() => {
          n2.textContent = S.fell;
          msg.innerHTML = cnt ? `규칙 하나를 뺐을 뿐인데 <b>${cnt}개</b>가 함께 무너졌습니다. 붉은 선이 보이지 않던 의존 관계입니다.` : '이번에는 아무것도 무너지지 않았습니다. 운이 좋았네요 — 다음 벽돌도 그럴까요?';
        }, 350 + waves.length * 240));
      };
      box.addEventListener('click', (e) => { const b = e.target.closest('.brick'); if (b) c.pull(+b.dataset.id); });
      el.addEventListener('click', (e) => { if (e.target.closest('[data-act=rebuild]')) { c.rebuild(); gsap.from($$('.brick', box), { y: -600, opacity: 0, duration: 0.5, ease: 'bounce.out', stagger: { each: 0.012, from: 'end' } }); } });
      c.rebuild();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.tw-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.tw-body', el), { y: 40, opacity: 0 }, 0.5)
        .from($('.tw-ground', el), { scaleX: 0, duration: 0.7, ease: 'power3.inOut' }, 0.3)
        .from(box, { y: -900, duration: 1.0, ease: 'bounce.out' }, 0.5)
        .from($$('.tw-side > :not(.btn)', el), { opacity: 0, y: 30, stagger: 0.1 }, 1.3)
        .from($('.tw-side .btn', el), { opacity: 0, duration: 0.4 }, 1.6);
      return [tl, D.tl()];
    },
    enter(el, c) { c.rebuild(); },
    step(n, c, fwd) {
      if (n === 1 && fwd) { const low = c.S.T.bricks.filter((b) => b.r <= 2 && !b.gone); c.timers.push(setTimeout(() => c.pull(rand(low).id), 300)); } else c.rebuild();
    },
    leave(el, c) { clearTimers(c); },
  });

  /* ═════════ 10 발상의 전환 ═════════ */
  D.define('turn', {
    build(el, c) {
      const eq = $('.eq', el), say = $('.eq-say', el), tile = { r: $('.t-r', el), d: $('.t-d', el), o: $('.t-o', el) }, SLOT = [0, 440, 880];
      const ORD = { rule: ['r', 'd', 'o'], ml: ['d', 'o', 'r'] }, note = $('.tn-note', el);
      c.set = (m, instant) => {
        c.m = m; eq.classList.toggle('ml', m === 'ml');
        $$('.eqb', el).forEach((b) => b.classList.toggle('on', b.dataset.m === m));
        ORD[m].forEach((k, i) => gsap.to(tile[k], { x: SLOT[i], duration: instant ? 0 : 0.85, ease: 'power3.inOut', overwrite: 'auto' }));
        if (!instant) { gsap.fromTo(tile.r, { rotation: m === 'ml' ? -7 : 7 }, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,0.5)' }); D.sfx('flip'); }
        gsap.to(note, { autoAlpha: m === 'ml' ? 1 : 0, y: m === 'ml' ? 0 : 60, duration: instant ? 0 : 0.6, delay: instant || m !== 'ml' ? 0 : 0.5, ease: 'back.out(1.4)', overwrite: 'auto' });
        say.innerHTML = m === 'ml' ? '<b>데이터 + 결과 = 규칙</b> — 사람은 예시와 정답만 주고, 규칙은 컴퓨터가 찾습니다' : '<b>규칙 + 데이터 = 결과</b> — 사람이 규칙을 쓰고, 컴퓨터는 답을 냅니다';
      };
      el.addEventListener('click', (e) => { const b = e.target.closest('.eqb'); if (b) c.set(b.dataset.m); });
      c.set('rule', true);
      const tl = D.tl(); kick(tl, el);
      tl.add(D.typed($('.tn-quote', el), { dur: 2.4 }), 0.3)
        .from($('.tn-print', el), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0.3)
        .from($('.tn-print img', el), { scale: 1.2, duration: 2.4, ease: 'power2.out' }, 0.3)
        .from($('.eq-sw', el), { opacity: 0, y: 30 }, 1.6)
        .from($$('.tile > b', el), { yPercent: 160, opacity: 0, stagger: 0.14, duration: 0.6, ease: 'back.out(1.6)' }, 1.8)
        .from($$('.eq .op', el), { scale: 0, opacity: 0, stagger: 0.14, ease: 'back.out(3)' }, 2.0)
        .from($$('.tile .caps', el), { opacity: 0, duration: 0.5 }, 2.4);
      return [tl, D.tl()];
    },
    enter(el, c, o) { c.set(o.atEnd ? 'ml' : 'rule', true); },
    step(n, c) { c.set(n === 1 ? 'ml' : 'rule'); },
  });

  /* ═════════ 11 스팸 필터의 진화 ═════════ */
  D.define('spam', {
    build(el, c) {
      const rows = $('.sp-rows', el), rulesEl = $('.sp-rules', el), toksEl = $('.sp-toks', el), msg = $('.sp-msg', el), go = $('.sp-go', el);
      const bAdd = $('[data-act=addrule]', el), bLearn = $('[data-act=learn]', el), stR = $('.sp-l .sp-stat b', el), stM = $('.sp-r .sp-stat b', el);
      const S = (c.S = {});
      const paintRules = (fresh = []) => {
        rulesEl.innerHTML = S.rules.map((k) => `<li class="${fresh.includes(k) ? 'new' : ''}"><b>IF</b> ‘${k}’ 포함 <b>→</b> 스팸</li>`).join('');
        if (fresh.length) gsap.from($$('li.new', rulesEl), { x: -60, opacity: 0, stagger: 0.12, duration: 0.4 });
      };
      const paintToks = (anim) => {
        const top = S.nb.top(5), fresh = [...S.nb.vocab].filter((t) => !S.old.has(t) && S.nb.llr(t) > 0.3).map((t) => [t, S.nb.llr(t), 1]).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const all = [...top, ...fresh], mx = all[0][1];
        toksEl.innerHTML = all.map(([t, w, nw]) => `<li class="${nw ? 'new' : ''}"><span>${t}</span><i style="width:${Math.round((w / mx) * 100)}%"></i>${nw ? '<em>새로 배움</em>' : ''}</li>`).join('');
        $('.sp-r .nd', el).textContent = S.nb.docs[0] + S.nb.docs[1];
        if (anim) gsap.from($$('li i', toksEl), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.06, duration: 0.5, ease: 'power3.out' });
      };
      c.reset = () => {
        clearTimers(c);
        S.stage = 0; S.rules = [...RULES0]; S.nb = makeNB(); TRAIN.forEach(([f, s, y]) => S.nb.learn(f + ' ' + s, y)); S.old = new Set(S.nb.vocab);
        S.wR = S.wM = 0; S.added = S.learned = false; stR.textContent = stM.textContent = '0';
        rows.innerHTML = '<div class="row ph"><div class="v"></div><div class="mail">아직 도착한 메일이 없습니다</div><div class="v"></div></div>'.repeat(4); paintRules(); paintToks(false);
        $('.sp-head .day', el).textContent = '1일째'; $('.sp-head .what', el).textContent = '오늘 온 메일 네 통';
        go.textContent = '메일 받기'; go.disabled = false; bAdd.disabled = bLearn.disabled = true;
        msg.innerHTML = '버튼을 눌러 두 필터에 같은 메일을 넣어 보세요.';
      };
      const cell = (blocked, spam, why) => {
        const bad = blocked !== !!spam;
        return `<b>${blocked ? '차단' : '통과'}</b><small>${why}</small>${bad ? `<i class="x">${spam ? '놓침' : '잘못 막음'}</i>` : ''}`;
      };
      c.wave = () => {
        const w = WAVES[S.stage]; S.stage++; go.disabled = true; bAdd.disabled = bLearn.disabled = true;
        $('.sp-head .day', el).textContent = S.stage + '일째';
        $('.sp-head .what', el).textContent = ['오늘 온 메일 네 통', '스팸 발송자가 수법을 바꿨습니다', '또 다른 변형이 왔습니다'][S.stage - 1];
        rows.innerHTML = w.map(([f, s, y]) => `<div class="row"><div class="v vl"></div><div class="mail"><i class="mono">${f}</i><b>${s}</b><u class="truth">${y ? '실제로는 스팸' : '실제로는 정상 메일'}</u></div><div class="v vr"></div></div>`).join('');
        const rs = $$('.row', rows); let okR = 0, okM = 0;
        gsap.from(rs, { y: -40, opacity: 0, stagger: 0.12, duration: 0.4, ease: 'back.out(1.5)' });
        msg.textContent = '두 필터가 같은 메일을 한 통씩 판정합니다…';
        w.forEach(([f, s, y], i) => c.timers.push(setTimeout(() => {
          const text = f + ' ' + s, kw = ruleHit(S.rules, text), p = S.nb.prob(text), mb = p >= 0.5, r = rs[i];
          $('.vl', r).innerHTML = cell(!!kw, y, kw ? `‘${kw}’ 포함` : '걸린 규칙 없음'); $('.vr', r).innerHTML = cell(mb, y, `스팸일 확률 ${Math.round(p * 100)}%`);
          $('.vl', r).classList.toggle('bad', !!kw !== !!y); $('.vr', r).classList.toggle('bad', mb !== !!y); r.classList.add('done');
          if (!!kw === !!y) okR++; else S.wR++; if (mb === !!y) okM++; else S.wM++;
          stR.textContent = S.wR; stM.textContent = S.wM;
          gsap.from([$('.vl', r), $('.vr', r)], { scale: 1.6, opacity: 0, duration: 0.25, ease: 'power3.in' }); D.sfx(!!kw === !!y && mb === !!y ? 'tick' : 'thud');
          if (i < w.length - 1) return;
          const sum = `<b>규칙 기반 ${okR}/4 · 머신러닝 ${okM}/4.</b> `;
          if (S.stage === 1) { msg.innerHTML = sum + '규칙 필터는 ‘이벤트’라는 단어 하나 때문에 회사 메일을 막았습니다. 그래도 왜 막았는지는 분명합니다.'; go.textContent = '스팸 발송자의 새 수법'; go.disabled = false; }
          else if (S.stage === 2) { msg.innerHTML = sum + '‘무료’를 ‘무.료’로, google.com을 gogle.com으로 바꿨을 뿐입니다. 양쪽 필터를 각자의 방식으로 고쳐 보세요.'; bAdd.disabled = S.added; bLearn.disabled = S.learned; go.textContent = '다음 날'; }
          else { msg.innerHTML = sum + `규칙은 ${S.rules.length}개로 늘었지만 ‘무_료’, ‘무/료’에 또 뚫렸습니다. 머신러닝 필터에는 규칙을 한 줄도 쓰지 않았습니다.`; go.textContent = '처음부터'; go.disabled = false; }
        }, 700 + i * 650)));
      };
      const both = () => { if (S.added && S.learned) { go.disabled = false; msg.innerHTML = '왼쪽은 사람이 규칙 세 줄을 더 썼고, 오른쪽은 신고한 메일 네 통을 예시에 보탰을 뿐입니다. <b>다음 날</b>로 가 보세요.'; } };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
        if (b.dataset.act === 'go') { if (S.stage >= 3) c.reset(); else c.wave(); }
        else if (b.dataset.act === 'addrule') { S.rules.push(...RULES_ADD); S.added = true; b.disabled = true; paintRules(RULES_ADD); D.sfx('key'); msg.innerHTML = '뚫린 단어마다 규칙을 한 줄씩. 내일은 또 어떤 변형이 올까요?'; both(); }
        else if (b.dataset.act === 'learn') { WAVES[1].forEach(([f, s, y]) => S.nb.learn(f + ' ' + s, y)); S.learned = true; b.disabled = true; paintToks(true); D.sfx('bell'); msg.innerHTML = '오늘 온 메일 네 통에 정답을 붙여 예시에 보탰습니다. 필터가 새 단서를 스스로 찾아냈습니다.'; both(); }
      });
      c.reset();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.sp-l', el), { x: -520, duration: 0.9, ease: 'power4.out' }, 0.2)
        .from($('.sp-r', el), { x: 520, duration: 0.9, ease: 'power4.out' }, 0.3)
        .from($$('.sp-mid > *', el), { y: 40, opacity: 0, stagger: 0.15 }, 0.6)
        .from($('.sp-cap', el), { opacity: 0 }, 1.4);
      return [tl, D.tl()];
    },
    enter(el, c) { c.reset(); },
    step(n, c, fwd) { c.reset(); if (n === 1 && fwd) c.timers.push(setTimeout(c.wave, 300)); },
    leave(el, c) { clearTimers(c); },
  });

  /* ═════════ 12·13 공용: 점 찍는 판 ═════════ */
  const PW = 900, PH = 700, PX = (x) => ((x + 1) / 2) * PW, PY = (y) => ((1 - y) / 2) * PH;
  const plotXY = (cv, e) => { const r = cv.getBoundingClientRect(); return { x: D.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -0.96, 0.96), y: D.clamp(1 - ((e.clientY - r.top) / r.height) * 2, -0.96, 0.96) }; };
  const FONT = '"Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif';

  /* ═════════ 12 지도 학습 ═════════ */
  D.define('sup', {
    build(el, c) {
      const cv = $('canvas', el), g = cv.getContext('2d'), stat = $('.lr-stat', el), LR = makeLR();
      g.setTransform(2, 0, 0, 2, 0, 0);
      const S = (c.S = { pts: [], q: null, mode: '1', steps: 0, done: false, dirty: true });
      const both = () => S.pts.some((p) => p.c) && S.pts.some((p) => !p.c);
      const wake = () => { S.done = false; S.dirty = true; };
      c.preset = () => {
        const r = rng(5); S.pts = []; S.q = null; LR.reset(); S.steps = 0;
        for (let i = 0; i < 9; i++) S.pts.push({ x: D.clamp(0.42 + gauss(r) * 0.2, -0.9, 0.9), y: D.clamp(0.38 + gauss(r) * 0.22, -0.9, 0.9), c: 1 });
        for (let i = 0; i < 9; i++) S.pts.push({ x: D.clamp(-0.4 + gauss(r) * 0.22, -0.9, 0.9), y: D.clamp(-0.36 + gauss(r) * 0.22, -0.9, 0.9), c: 0 });
        wake();
      };
      c.add = (x, y, m) => {
        if (m === 'q') S.q = { x, y }; else { S.pts.push({ x, y, c: +m, born: performance.now() }); S.steps = 0; }
        D.sfx('key'); wake();
      };
      const draw = () => {
        g.fillStyle = PAPER; g.fillRect(0, 0, PW, PH);
        const ok = both();
        if (ok) {
          g.fillStyle = RED;
          for (let j = 0, y = 12; y < PH; y += 20, j++) for (let x = j % 2 ? 22 : 12; x < PW; x += 20) {
            const r = LR.p((x / PW) * 2 - 1, 1 - (y / PH) * 2) * 7.6; if (r > 0.8) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
          }
          const [a, b, w0] = LR.w; g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath();
          if (Math.abs(b) > Math.abs(a)) { g.moveTo(PX(-1.3), PY(-(a * -1.3 + w0) / b)); g.lineTo(PX(1.3), PY(-(a * 1.3 + w0) / b)); }
          else if (a) { g.moveTo(PX(-(b * -1.3 + w0) / a), PY(-1.3)); g.lineTo(PX(-(b * 1.3 + w0) / a), PY(1.3)); }
          g.stroke();
        }
        const now = performance.now();
        S.pts.forEach((p) => {
          const x = PX(p.x), y = PY(p.y), age = p.born ? Math.min(1, (now - p.born) / 260) : 1, rr = 14 * (2 - age);
          g.beginPath(); g.arc(x, y, rr, 0, 6.3); g.fillStyle = p.c ? RED : INK; g.fill(); g.lineWidth = 4; g.strokeStyle = p.c ? INK : PAPER; g.stroke();
          if (ok && (LR.p(p.x, p.y) >= 0.5 ? 1 : 0) !== p.c) { g.setLineDash([6, 6]); g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.arc(x, y, 25, 0, 6.3); g.stroke(); g.setLineDash([]); }
          if (age < 1) S.dirty = true;
        });
        if (S.q) {
          const x = PX(S.q.x), y = PY(S.q.y), p = LR.p(S.q.x, S.q.y), cat = p >= 0.5;
          const t = ok ? `${cat ? '고양이' : '고양이 아님'} · 확신 ${Math.round((cat ? p : 1 - p) * 100)}%` : '예제가 양쪽 다 있어야 답할 수 있어요';
          g.font = `800 24px ${FONT}`; const tw = g.measureText(t).width + 36, bx = D.clamp(x - tw / 2, 8, PW - tw - 8), by = y > 110 ? y - 84 : y + 36;
          g.fillStyle = INK; g.fillRect(bx, by, tw, 48); g.fillStyle = PAPER; g.textBaseline = 'middle'; g.fillText(t, bx + 18, by + 25);
          g.beginPath(); g.arc(x, y, 18, 0, 6.3); g.fillStyle = PAPER; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
          g.fillStyle = INK; g.font = `900 24px ${FONT}`; g.textAlign = 'center'; g.fillText('?', x, y + 2); g.textAlign = 'left';
        }
        const n = S.pts.length;
        stat.innerHTML = !n ? '판이 비었습니다. 예제를 찍어 주세요.' : !ok ? `예제 ${n}개 — 두 가지 정답이 모두 있어야 선을 그을 수 있습니다.`
          : `예제 <b>${n}</b>개 중 <b>${LR.right(S.pts)}</b>개를 선 하나로 맞게 갈랐습니다 <span class="mono">· 경사 하강 ${S.steps.toLocaleString('ko-KR')}걸음</span>`;
      };
      c.tick = () => {
        if (!S.done && both()) {
          let gr = 1; for (let i = 0; i < 24; i++) gr = LR.step(S.pts);
          S.steps += 24; S.dirty = true; if (gr < 0.004 || S.steps >= 4800) S.done = true;
        }
        if (S.dirty) { S.dirty = false; draw(); }
      };
      cv.addEventListener('pointerdown', (e) => { const p = plotXY(cv, e); c.add(p.x, p.y, S.mode); });
      el.addEventListener('click', (e) => {
        const m = e.target.closest('.lm'), b = e.target.closest('[data-act]');
        if (m) { S.mode = m.dataset.m; $$('.lm', el).forEach((x) => x.classList.toggle('on', x === m)); }
        else if (b) { clearTimers(c); if (b.dataset.act === 'clear') { S.pts = []; S.q = null; LR.reset(); S.steps = 0; wake(); } else c.preset(); }
      });
      c.preset(); draw();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.lr-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.lr-body', el), { y: 40, opacity: 0 }, 0.4)
        .from($('.lr-plot', el), { x: 1000, rotation: 4, duration: 1.0, ease: 'power4.out' }, 0.3)
        .from($$('.lr-ctl > *', el), { y: 30, opacity: 0, stagger: 0.1 }, 0.9)
        .from($$('.lm', el), { scale: 0.6, opacity: 0, stagger: 0.08, ease: 'back.out(2)', clearProps: 'transform,opacity' }, 1.1)
        .from([$('.lr-most', el), $('.lr-cap', el)], { opacity: 0, stagger: 0.2 }, 1.5);
      return [tl, D.tl()];
    },
    live(el, c) { gsap.ticker.add(c.tick); return () => gsap.ticker.remove(c.tick); },
    enter(el, c) { clearTimers(c); c.preset(); },
    step(n, c, fwd) {
      clearTimers(c); c.preset();
      if (n === 1 && fwd) D.ch2.LR_DEMO.forEach(([x, y], i) => c.timers.push(setTimeout(() => c.add(x, y, '1'), 500 + i * 650)));
    },
    leave(el, c) { clearTimers(c); },
  });

  /* ═════════ 13 비지도 학습 ═════════ */
  D.define('unsup', {
    build(el, c) {
      const cv = $('canvas', el), g = cv.getContext('2d'), stat = $('.km-stat', el), runBtn = $('[data-act=run]', el);
      g.setTransform(2, 0, 0, 2, 0, 0);
      const S = (c.S = { pts: [], k: 3, km: null, iter: 0, busy: false });
      const scatter = (r) => {
        S.pts = []; const n = 3 + (r() < 0.35 ? 1 : 0), cs = [];
        while (cs.length < n) { const p = { x: (r() - 0.5) * 1.4, y: (r() - 0.5) * 1.4 }; if (cs.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 0.62)) cs.push(p); }
        cs.forEach((q) => { for (let i = 0; i < 13; i++) S.pts.push({ x: D.clamp(q.x + gauss(r) * 0.15, -0.94, 0.94), y: D.clamp(q.y + gauss(r) * 0.15, -0.94, 0.94) }); });
      };
      const STY = [[RED, RED], [INK, INK], [PAPER, RED], [PAPER, INK]]; // [채움, 테두리]
      const draw = () => {
        g.fillStyle = PAPER; g.fillRect(0, 0, PW, PH);
        const km = S.km;
        if (km) {
          km.asg.forEach((a, i) => { if (a < 0) return; const p = S.pts[i], cc = km.cs[a]; g.strokeStyle = STY[a][1]; g.globalAlpha = 0.5; g.lineWidth = 2.5; g.beginPath(); g.moveTo(PX(p.x), PY(p.y)); g.lineTo(PX(cc.x), PY(cc.y)); g.stroke(); });
          g.globalAlpha = 1;
        }
        S.pts.forEach((p, i) => {
          const a = km ? km.asg[i] : -1, x = PX(p.x), y = PY(p.y);
          g.beginPath(); g.arc(x, y, 12, 0, 6.3);
          if (a < 0) { g.fillStyle = SOFT; g.fill(); } else { g.fillStyle = STY[a][0]; g.fill(); g.lineWidth = 5; g.strokeStyle = STY[a][1]; g.stroke(); }
        });
        if (km) km.cs.forEach((cc, j) => {
          const x = PX(cc.x), y = PY(cc.y);
          g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
          g.fillStyle = PAPER; g.fillRect(-21, -21, 42, 42); g.fillStyle = STY[j][0]; g.fillRect(-15, -15, 30, 30); g.lineWidth = 6; g.strokeStyle = STY[j][1]; g.strokeRect(-15, -15, 30, 30);
          g.restore();
        });
      };
      c.stop = () => { clearTimers(c); if (c.tw) { c.tw.kill(); c.tw = null; } S.busy = false; runBtn.disabled = false; };
      c.fresh = (r) => { c.stop(); if (r) scatter(r); S.km = null; S.iter = 0; draw(); stat.textContent = '점 하나가 시청자 한 명입니다. 판을 눌러 점을 더 찍을 수도 있어요.'; };
      c.run = () => {
        c.stop(); if (S.pts.length < S.k) return;
        S.km = makeKM(S.pts, S.k); S.iter = 0; S.busy = true; runBtn.disabled = true;
        const loop = () => {
          const ch = S.km.assign(); S.iter++; draw(); D.sfx('tick');
          if (!ch) { S.busy = false; runBtn.disabled = false; stat.innerHTML = `<b>${S.iter - 1}번</b> 중심을 옮기고 자리를 잡았습니다. 정답은 한 번도 알려 주지 않았습니다. 다시 누르면 다른 출발점에서 시작합니다.`; D.sfx('bell'); return; }
          stat.innerHTML = `${S.iter}번째 — 점마다 가장 가까운 중심에 붙이고, 중심을 묶음 한가운데로 옮깁니다.`;
          const to = S.km.means(), o = { t: 0 }, from = S.km.cs.map((q) => ({ ...q }));
          c.tw = gsap.to(o, { t: 1, duration: 0.55, ease: 'power2.inOut', onUpdate() { S.km.cs.forEach((q, j) => { q.x = from[j].x + (to[j].x - from[j].x) * o.t; q.y = from[j].y + (to[j].y - from[j].y) * o.t; }); draw(); }, onComplete() { c.timers.push(setTimeout(loop, 260)); } });
        };
        c.timers.push(setTimeout(loop, 350)); draw();
        stat.textContent = `점 ${S.k}개를 아무렇게나 골라 중심으로 삼고 시작합니다.`;
      };
      cv.addEventListener('pointerdown', (e) => { if (S.busy) return; const p = plotXY(cv, e); S.pts.push(p); S.km = null; draw(); D.sfx('key'); });
      el.addEventListener('click', (e) => {
        const k = e.target.closest('.kk'), b = e.target.closest('[data-act]');
        if (k) { S.k = +k.dataset.k; $$('.kk', el).forEach((x) => x.classList.toggle('on', x === k)); c.run(); }
        else if (b) { if (b.dataset.act === 'run') c.run(); else c.fresh(Math.random); }
      });
      c.fresh(rng(21));
      const tl = D.tl(); kick(tl, el);
      tl.from($('.km-plot', el), { x: -1000, rotation: -4, duration: 1.0, ease: 'power4.out' }, 0.2)
        .from($('.km-title', el), { y: 60, opacity: 0 }, 0.3)
        .from($('.km-body', el), { y: 40, opacity: 0 }, 0.6)
        .from($$('.km-ex li', el), { x: 80, opacity: 0, stagger: 0.2 }, 0.9)
        .from($$('.km-ctl > *', el), { y: 30, opacity: 0, stagger: 0.1 }, 1.2)
        .from($('.km-cap', el), { opacity: 0 }, 1.8);
      return [tl, D.tl()];
    },
    enter(el, c) { c.fresh(rng(21)); },
    step(n, c, fwd) { if (n === 1 && fwd) c.run(); else c.fresh(null); },
    leave(el, c) { c.stop(); },
  });

  /* ═════════ 14 강화 학습 ═════════ */
  const ACTS = ['앉기', '한 바퀴 돌기', '점프', '손 흔들기'];
  D.define('rl', {
    build(el, c) {
      const bars = $('.rl-bars', el), say = $('.rl-say b', el), nEl = $('.rl-n b', el), fbs = $$('.fb', el), hint = $('.rl-hint', el);
      const all = $('.b-all', el), up = $('.b-up', el), legs = $('.b-legs', el), ar = $('.b-ar', el), al = $('.b-al', el);
      const B = makeBandit(4), S = (c.S = { a: -1, wait: false, n: 0 });
      bars.innerHTML = ACTS.map((a) => `<li><span>${a}</span><div class="bar"><i></i></div><b class="mono">25%</b><small class="mono">가치 0.00</small></li>`).join('');
      const lis = $$('li', bars);
      const paint = () => {
        const p = B.probs();
        lis.forEach((li, i) => { $('i', li).style.width = Math.max(1, p[i] * 100) + '%'; $('b', li).textContent = Math.round(p[i] * 100) + '%'; $('small', li).textContent = `가치 ${B.q[i] >= 0 ? '+' : '−'}${Math.abs(B.q[i]).toFixed(2)}`; li.classList.toggle('now', i === S.a); });
        nEl.textContent = S.n;
      };
      const still = () => { if (c.act) { c.act.kill(); c.act = null; } gsap.set([all, up, legs, ar, al], { clearProps: 'transform' }); };
      const ANIM = [
        (t) => t.to(up, { y: 46, duration: 0.25, ease: 'power2.out' }).to(legs, { scaleY: 0.4, svgOrigin: '150 354', duration: 0.25, ease: 'power2.out' }, 0).to(al, { rotation: 24, svgOrigin: '52 156', duration: 0.25 }, 0).to(ar, { rotation: -24, svgOrigin: '248 156', duration: 0.25 }, 0)
          .to([up, legs, al, ar], { y: 0, scaleY: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' }, 0.75),
        (t) => t.to(all, { scaleX: -1, svgOrigin: '150 200', duration: 0.22, ease: 'none' }).to(all, { scaleX: 1, duration: 0.22, ease: 'none' }).to(all, { scaleX: -1, duration: 0.22, ease: 'none' }).to(all, { scaleX: 1, duration: 0.22, ease: 'none' }),
        (t) => t.to(all, { scaleY: 0.86, svgOrigin: '150 354', duration: 0.14 }).to(all, { y: -110, scaleY: 1.06, duration: 0.32, ease: 'power2.out' }).to(all, { y: 0, scaleY: 1, duration: 0.3, ease: 'power2.in' }).to(all, { scaleY: 0.9, duration: 0.08 }).to(all, { scaleY: 1, duration: 0.18, ease: 'back.out(3)' }),
        (t) => t.to(ar, { rotation: -150, svgOrigin: '248 156', duration: 0.25, ease: 'back.out(2)' }).to(ar, { rotation: -118, duration: 0.13, yoyo: true, repeat: 3, ease: 'sine.inOut' }).to(ar, { rotation: 0, duration: 0.25, ease: 'power2.in' }),
      ];
      const ready = (v) => { S.wait = v; fbs.forEach((b) => { b.disabled = !v; }); hint.classList.toggle('go', v); };
      c.next = () => {
        still(); S.a = B.pick(); paint(); say.textContent = ACTS[S.a] + '!'; gsap.fromTo(say, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' });
        c.act = gsap.timeline({ onComplete: () => ready(true) }); ANIM[S.a](c.act); D.sfx('flip');
      };
      c.feed = (r) => {
        if (!S.wait) return; ready(false);
        B.reward(S.a, r); S.n++; paint(); D.sfx(r > 0 ? 'bell' : 'thud');
        const b = fbs[r > 0 ? 0 : 1]; gsap.fromTo(b, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', clearProps: 'transform' });
        if (r > 0) gsap.fromTo(all, { y: 0 }, { y: -22, duration: 0.14, yoyo: true, repeat: 3, ease: 'sine.inOut' });
        else gsap.fromTo(all, { x: -10 }, { x: 10, duration: 0.06, yoyo: true, repeat: 5, ease: 'none', onComplete() { gsap.set(all, { x: 0 }); } });
        say.textContent = r > 0 ? '당근이다!' : '아야…';
        clearTimers(c); c.timers.push(setTimeout(c.next, 850));
      };
      c.reset = () => { clearTimers(c); still(); B.reset(); S.n = 0; S.a = -1; ready(false); paint(); say.textContent = '…'; };
      el.addEventListener('click', (e) => {
        const f = e.target.closest('.fb'), b = e.target.closest('[data-act=reset]');
        if (f) c.feed(+f.dataset.r); else if (b) { c.reset(); c.timers.push(setTimeout(c.next, 600)); }
      });
      c.reset();
      const tl = D.tl(); kick(tl, el);
      tl.from($('.rl-title', el), { y: 60, opacity: 0 }, 0.1)
        .from($('.rl-body', el), { y: 40, opacity: 0 }, 0.4)
        .from($('.rl-ill', el), { x: -300, rotation: -8, opacity: 0, duration: 1.1, ease: 'back.out(1.1)' }, 0.5)
        .from($('.bot', el), { y: -700, duration: 0.9, ease: 'bounce.out' }, 0.5)
        .from(fbs, { y: 120, opacity: 0, stagger: 0.12, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, 1.1)
        .from($('.rl-brain', el), { x: 620, rotation: 4, duration: 0.9, ease: 'power4.out' }, 0.6)
        .from([$('.rl-say', el), hint], { opacity: 0, stagger: 0.2 }, 1.4);
      const s1 = D.tl().from($('.rl-note', el), { y: 420, rotation: -6, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.1)' });
      return [tl, s1];
    },
    enter(el, c) { c.reset(); c.timers.push(setTimeout(c.next, 1700)); },
    leave(el, c) { c.reset(); },
    key(e, c) {
      if (e.key === 'ArrowUp') { c.feed(1); return true; }
      if (e.key === 'ArrowDown') { c.feed(-1); return true; }
      return false;
    },
  });

  /* ═════════ 15 뼈대와 근육 ═════════ */
  D.define('hybrid', {
    build(el, c) {
      $('.fl-box.ai .cells', el).innerHTML = '<i></i>'.repeat(8); $('.fl-power .segs', el).innerHTML = '<i></i>'.repeat(8);
      const btn = $('.fl-toggle', el), msg = $('.fl-msg', el), S = (c.S = { on: true, parts: [], cells: Array(8).fill(0), acc: 0, pow: 0 });
      c.set = (on) => {
        S.on = on; btn.textContent = on ? '규칙 걸러 내기 끄기' : '규칙 걸러 내기 켜기'; btn.classList.toggle('on', !on); $('.fl-box.rule', el).classList.toggle('off', !on);
        msg.innerHTML = on ? '규칙이 대부분의 일을 먼저 처리합니다. AI에게는 <b>꼭 필요한 판단만</b> 넘어갑니다.' : '모든 일이 AI로 몰립니다. 칸이 전부 켜지고, <b>일이 밀리기 시작합니다.</b>';
      };
      btn.addEventListener('click', () => { c.set(!S.on); D.sfx('key'); });
      c.set(true);
      const tl = D.tl(); kick(tl, el);
      tl.add(D.typed($('.hy-title', el), { dur: 1.8 }), 0.3)
        .from($('.hy-ill', el), { x: 300, rotation: 8, opacity: 0, duration: 1.2, ease: 'back.out(1.1)' }, 0.2)
        .from($('.hy-body', el), { y: 40, opacity: 0 }, 1.6)
        .from($('.flow', el), { y: 500, duration: 0.9, ease: 'power4.out' }, 1.0);
      return [tl, D.tl()];
    },
    enter(el, c) { c.set(true); },
    step(n, c, fwd) { c.set(!(n === 1 && fwd)); },
    live(el, c) {
      const cv = $('canvas', el), g = cv.getContext('2d'), S = c.S, cells = $$('.cells i', el), segs = $$('.segs i', el);
      g.setTransform(2, 0, 0, 2, 0, 0); S.parts = []; S.cells.fill(0); S.acc = 0; S.pow = 0;
      const V = 300, GATE = 520, AIX = 955, OUT = 1300, LY = 110, LOW = 262;
      const tick = (t, dt) => {
        const d = Math.min(dt || 16, 50) / 1000;
        S.acc += d; while (S.acc > 0.1) { S.acc -= 0.1; S.parts.push({ x: -12, y: LY - 34 + Math.random() * 68, st: 0, t: 0 }); }
        for (let k = 0; k < 8; k++) if (S.cells[k] > 0) S.cells[k] -= d;
        let q = 0;
        for (const p of S.parts) {
          if (p.st === 0) { p.x += V * d; if (p.x >= GATE) p.st = S.on && Math.random() < 0.75 ? 1 : 2; }
          else if (p.st === 1) { p.x += V * d; p.y += (LOW - p.y) * Math.min(1, d * 7); }
          else if (p.st === 2) {
            const stop = AIX - q * 19; q++;
            p.y += (LY - p.y) * Math.min(1, d * 7);
            if (q > 17) { p.st = 5; continue; }
            if (p.x < stop) p.x = Math.min(stop, p.x + V * d);
            if (q === 1 && p.x >= AIX - 1) { const k = S.cells.findIndex((v) => v <= 0); if (k >= 0) { S.cells[k] = 1; p.st = 3; p.t = 1; q--; } }
          } else if (p.st === 3) { p.t -= d; if (p.t <= 0) { p.st = 4; p.x = OUT; p.y = LY; } }
          else if (p.st === 4) p.x += V * d;
          else if (p.st === 5) { p.y -= 160 * d; p.t += d; }
        }
        S.parts = S.parts.filter((p) => p.x < 1700 && !(p.st === 5 && p.t > 0.5));
        const lit = S.cells.filter((v) => v > 0).length; S.pow += (lit - S.pow) * Math.min(1, d * 4);
        cells.forEach((e2, k) => e2.classList.toggle('on', S.cells[k] > 0)); segs.forEach((e2, k) => e2.classList.toggle('on', k < Math.round(S.pow)));
        // 그리기
        g.clearRect(0, 0, 1680, 330);
        g.strokeStyle = 'rgba(23,19,15,.28)'; g.lineWidth = 3; g.setLineDash([4, 10]);
        g.beginPath(); g.moveTo(0, LY); g.lineTo(1680, LY); g.moveTo(610, LY); g.bezierCurveTo(680, LY, 660, LOW, 740, LOW); g.lineTo(1680, LOW); g.stroke(); g.setLineDash([]);
        for (const p of S.parts) {
          if (p.st === 3) continue;
          g.beginPath();
          if (p.st === 0) { g.arc(p.x, p.y, 8, 0, 6.3); g.fillStyle = PAPER; g.fill(); g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke(); }
          else if (p.st === 1) { g.arc(p.x, p.y, 7, 0, 6.3); g.fillStyle = INK; g.fill(); }
          else if (p.st === 4) { g.arc(p.x, p.y, 7, 0, 6.3); g.fillStyle = PAPER; g.fill(); g.lineWidth = 4; g.strokeStyle = RED; g.stroke(); }
          else { g.globalAlpha = p.st === 5 ? Math.max(0, 1 - p.t * 2) : 1; g.arc(p.x, p.y, 8.5, 0, 6.3); g.fillStyle = RED; g.fill(); g.globalAlpha = 1; }
        }
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
  });

  /* ═════════ 16 당신의 답 ═════════ */
  D.define('end', {
    build(el, c) {
      const out = $('.vote-out', el), vbs = $$('.vb', el);
      const SAY = {
        y: '경우의 수가 제한적인 곳에서는 지금도 그렇습니다. 스팸 필터와 대출 심사처럼요. 하지만 세상은 IF-THEN만으로 설명되지 않았습니다.',
        n: '그래서 연구자들은 발상을 바꿨습니다. 규칙을 넣는 대신, 데이터를 보고 스스로 규칙을 찾게 하자고요. 다만 규칙은 지금도 뼈대로 남아 있습니다.',
      };
      vbs.forEach((b) => b.addEventListener('click', () => {
        vbs.forEach((x) => { x.classList.toggle('on', x === b); x.classList.toggle('off', x !== b); });
        if (c.tw) c.tw.kill(); out.style.minHeight = '';
        c.tw = D.typed(out, { text: SAY[b.dataset.v], dur: 1.8 });
      }));
      c.clear = () => { if (c.tw) c.tw.kill(); out.style.minHeight = ''; out.innerHTML = '<span class="hint">← 어느 쪽이든 눌러 보세요.<br>이 장의 대답이 타자됩니다.</span>'; vbs.forEach((x) => x.classList.remove('on', 'off')); };
      const tl = D.tl(); kick(tl, el);
      tl.from($('.end-title', el), { y: 70, opacity: 0, duration: 0.9 }, 0.2)
        .from(vbs, { y: 220, rotation: (i) => (i ? 8 : -8), opacity: 0, stagger: 0.15, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }, 0.8);
      const s1 = D.tl()
        .from($$('.recap .note', el), { y: 560, rotation: () => gsap.utils.random(-12, 12), stagger: 0.14, duration: 0.8, ease: 'back.out(1.1)' }, 0)
        .from($('.next-note', el), { x: 1900, duration: 0.9, ease: 'power4.out' }, 0.6);
      return [tl, s1];
    },
    enter(el, c) { c.clear(); },
  });
})();
