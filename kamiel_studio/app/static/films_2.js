/* Kamiel films, part 2: see "cinema" in events.js for the building blocks (K).
   DE UITDRIJVING (film-duivel), DE ANDEREN (film-dubbel), NA HET EINDE (film-apocalyps). */
(function () {
  const F = window.KamielFilms = window.KamielFilms || {};

  /* ---------- little shared helpers (pixel drawing, glows, pets that float and turn) ---------- */
  const PU = 225 / 68.5;   // one pet pixel on the screen
  const ART = () => window.KamielPetArt || {};
  function px(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
  function glow(g, x, y, r, col, a) {
    if (r <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  }
  // a pixel sprite from rows of letters (palette per letter), centred on cx, cy
  function sprite(g, s, cx, cy, u, flip) {
    const rows = s.rows, n = rows[0].length, x0 = cx - n * u / 2, y0 = cy - rows.length * u / 2;
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < n; c++) {
      const col = s.pal[rows[r][c]]; if (!col) continue;
      const cc = flip ? n - 1 - c : c; g.fillStyle = col; g.fillRect(Math.round(x0 + cc * u), Math.round(y0 + r * u), Math.ceil(u), Math.ceil(u));
    }
  }
  const petH = (a) => { const art = ART()[a.pet]; return art ? art.h * PU * (a.s || 1) : 100; };
  // turn a pet around its own middle (it floats, it spins): a.bx and a.bl are where it hangs
  function spin(a, r) { const h = petH(a) / 2; a.r = r; a.cx = a.bx - h * Math.sin(r); a.lift = a.bl + h - h * Math.cos(r); }
  // glowing eyes for pets and llamas: drawn after the darkness and the grade
  function eyeGlow(K, list) {
    return K.over((g, age, L) => {
      const z = K.lensNow.z;
      for (const a of list) {
        if (!a || !(a.glow > 0) || a.alpha === 0) continue;
        const col = a.glowCol || '255,40,40', k = a.glow * (a.blinkGlow ? (Math.sin(K.t * 9) > -.7 ? 1 : 0) : 1);
        if (a.pet) {
          const q = L(K.A.petPoint(a, 'eye')), u = PU * (a.s || 1) * z;
          glow(g, q.x, q.y, 12 * u, col, .6 * k);
          g.globalAlpha = k; px(g, `rgb(${col})`, q.x - u, q.y - u * .8, u * 2, u * 1.6); px(g, '#fff', q.x - u * .3, q.y - u * .3, u * .6, u * .6); g.globalAlpha = 1;
        } else {
          const o = a === K.kam ? null : a, p = o ? K.A.llamaPoint(o, 227, 291) : K.kp(227, 291), q = L(p), s = (o ? o.s : K.kam.s) * z;
          glow(g, q.x, q.y, 34 * s, col, .55 * k);
          g.globalAlpha = k; px(g, `rgb(${col})`, q.x - 6 * s, q.y - 4 * s, 12 * s, 9 * s); px(g, '#fff', q.x - 3 * s, q.y - 2 * s, 5 * s, 4 * s); g.globalAlpha = 1;
        }
      }
    });
  }
  // a pixel candle standing on y; c = { lit (0..1), lean, h }
  function candle(g, x, y, u, c, t) {
    const hh = c.h === undefined ? 7 : c.h;
    px(g, '#2a1e14', x - 3 * u, y - u, 6 * u, u); px(g, '#4a3626', x - 2 * u, y - 2 * u, 4 * u, u);
    px(g, '#eadfc6', x - 1.5 * u, y - (hh + 2) * u, 3 * u, hh * u); px(g, '#bfae8a', x + .5 * u, y - (hh + 2) * u, u, hh * u);
    px(g, '#fff8e8', x - 1.5 * u, y - (hh + 2) * u, u, 2 * u); px(g, '#2b2118', x - .5 * u, y - (hh + 3) * u, u, u);
    if (c.lit > .05) {
      const fl = Math.sin(t * 17 + x) * .5 + Math.sin(t * 29 + x * .3) * .5, lx = x - .5 * u + (c.lean || 0) * u * 2, top = y - (hh + 3) * u, k = c.lit;
      px(g, 'rgba(255,110,30,.95)', lx - .5 * u, top - (3 + fl * .6) * u * k, 2 * u, (3 + fl * .6) * u * k);
      px(g, '#ffd04a', lx, top - 2 * u * k, u, 2 * u * k);
      px(g, '#fff6c8', lx + (c.lean || 0) * u, top - (3.4 + fl) * u * k, u, u);
    }
  }
  // wisps of black smoke
  function smoke(K, layer, at, opts) {
    opts = opts || {};
    return K.particles(layer, { until: opts.until, emit: (ps) => { const p = at(); if (!p) return; if (K.rnd() < (opts.rate || .5)) ps.push(K.P({ x: p.x + (K.rnd() - .5) * (opts.spread || 20), y: p.y, vx: (K.rnd() - .5) * 30 + (opts.vx || 0), vy: -20 - K.rnd() * 40, life: 1 + K.rnd(), sz: 3 + Math.floor(K.rnd() * 3) })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(${opts.col || '18,10,22'},${.75 * (1 - k)})`; const s = p.sz * (1 + k * 1.5); g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s)); } });
  }
  // a jagged pixel lightning bolt from the top of the picture down to (x, y)
  function bolt(K, x, y, secs) {
    const pts = [], n = 9; let cx = x + (K.rnd() - .5) * 200;
    for (let k = 0; k <= n; k++) { pts.push({ x: cx, y: 40 + (y - 40) * k / n }); cx = lerpX(cx, x, k / n) + (K.rnd() - .5) * 60; }
    pts[n].x = x;
    return K.fx('screen', secs || .35, (g, age) => {
      const a = 1 - age / (secs || .35);
      for (let k = 0; k < n; k++) { const p = pts[k], q = pts[k + 1], st = 14;
        for (let j = 0; j <= st; j++) { const xx = p.x + (q.x - p.x) * j / st, yy = p.y + (q.y - p.y) * j / st;
          g.fillStyle = `rgba(190,220,255,${.5 * a})`; g.fillRect(Math.round(xx) - 6, Math.round(yy) - 3, 12, 6);
          g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(Math.round(xx) - 2, Math.round(yy) - 2, 5, 5); } }
    });
  }
  const lerpX = (a, b, p) => a + (b - a) * p;


  /* At night the whole world gets a heavy evening tint. The actors are lifted a little so they still read;
     a film sets its own filters in a.f0 (and K.kam.f0), this keeps the two together every frame. */
  function filters(K, k) {
    const night = !!(K.A.night && K.A.night()), b = night ? ` brightness(${k || 1.7})` : '';
    return K.fx('sky', 0, () => { K.kam.filter = ((K.kam.f0 || '') + b).trim(); for (const a of K.actors) a.filter = ((a.f0 || '') + (a.noLift ? '' : b)).trim(); });
  }
  // colours: mix two '#rrggbb' colours
  const hx = (c) => c[0] === '#' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.replace(/[^0-9,]/g, '').split(',').map(Number);
  function mix(a, b, p) { const A = hx(a), B = hx(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * p)},${Math.round(A[1] + (B[1] - A[1]) * p)},${Math.round(A[2] + (B[2] - A[2]) * p)})`; }
  // a disc of chunky pixels
  function pdisc(g, cx, cy, r, u, col) { g.fillStyle = col; for (let y = -r; y < r; y += u) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - (y + u / 2) * (y + u / 2))) / u) * u; g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, u); } }
  // a crooked bare tree in pixel blocks, growing up from (x, y)
  function ptree(g, x, y, s, col, seed) {
    g.fillStyle = col; const u = 4;
    const branch = (x0, y0, a, len, w, d) => { let xx = x0, yy = y0; for (let k = 0; k < len; k += u) { xx += Math.cos(a) * u; yy += Math.sin(a) * u; g.fillRect(Math.round(xx / u) * u - w / 2, Math.round(yy / u) * u, w, u); a += Math.sin(seed * 3 + k * .07 + d) * .08; }
      if (d < 3) { branch(xx, yy, a - .5 - (seed % 3) * .1, len * .62, Math.max(u, w - u), d + 1); branch(xx, yy, a + .45, len * .55, Math.max(u, w - u), d + 1.3); } };
    branch(x, y, -Math.PI / 2 + (seed % 2 ? .12 : -.12), 110 * s, 12 * s, 0);
  }
  /* a moonlit clearing (for the ritual): painted in the ground layer so the evening light falls on it like on the actors.
     S.dawn 0..1 turns the night into a pink morning. */
  function clearing(K, S) {
    const W = K.W, stars = [];
    for (let k = 0; k < 80; k++) stars.push({ x: (k * 137.5 + 31) % W, y: 70 + (k * 71) % 320, s: k % 6 === 0 ? 4 : 2, ph: k * 1.7 });
    const lift = !!(K.A.night && K.A.night());   // at night the evening tint falls over it: paint it twice as bright
    return K.fx('ground', 0, (g) => { paint(g); if (lift) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .85; paint(g); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
    function paint(g) {
      const d = S.dawn || 0;
      for (let y = 0; y < 480; y += 8) { const p = y / 480; px(g, mix(mix('#121640', '#2e2660', p), mix('#6c7cc4', '#f6b08a', p), d), 0, y, W, 8); }
      for (const st of stars) { const a = (1 - d) * (.55 + .45 * Math.sin(K.t * 2 + st.ph)); if (a > .05) px(g, `rgba(255,250,230,${a})`, st.x, st.y, st.s, st.s); }
      // the moon
      const my = 170 + d * 60;
      g.globalAlpha = 1 - d * .8; pdisc(g, 740, my, 52, 4, '#f6eed2'); pdisc(g, 752, my - 6, 44, 4, '#fff8e4');
      px(g, '#d8cfae', 716, my - 16, 12, 12); px(g, '#d8cfae', 748, my + 14, 16, 12); px(g, '#d8cfae', 770, my - 22, 8, 8); g.globalAlpha = 1;
      // hills far away, and nearer
      const hill = (y0, amp, f, ph, col) => { g.fillStyle = col; for (let x = 0; x < W; x += 8) { const h = y0 - amp * (Math.sin(x * f + ph) * .6 + Math.sin(x * f * 2.3 + ph * 2) * .4); g.fillRect(x, Math.round(h / 4) * 4, 8, 490 - h); } };
      hill(400, 40, .006, 1, mix('#6c64b4', '#c49ab8', d)); hill(440, 28, .011, 4, mix('#4c5096', '#8c86a4', d));
      ptree(g, 110, 452, 1.1, mix('#0b0b1c', '#4a4050', d), 3); ptree(g, 880, 446, .9, mix('#0b0b1c', '#4a4050', d), 6); ptree(g, 640, 430, .45, mix('#14142a', '#5a5464', d), 1);
      // the ground: dark grass, a trampled clearing in the middle
      for (let y = 470; y < K.H; y += 6) px(g, mix(mix('#3a4c58', '#30403a', (y - 470) / 130), mix('#4c6040', '#5e7048', (y - 470) / 130), d), 0, y, W, 6);
      g.fillStyle = mix('#6a5e4c', '#9a8a68', d); g.beginPath(); g.ellipse(S.cx || 420, K.FEET - 12, 300, 34, 0, 0, 7); g.fill();
      g.fillStyle = mix('#2a3a2a', '#6a8a50', d); for (let k = 0; k < 60; k++) { const x = (k * 97) % W, y = 474 + (k * 37) % 70; if (Math.abs(x - (S.cx || 420)) < 300 && y > 500) continue; g.fillRect(x, y, 4, 8); g.fillRect(x + 4, y + 4, 4, 4); }
    }
  }
  // the candle flames again, over the darkness, so they really glow
  function flameGlow(K, list) {
    return K.over((g, age, L) => { const z = K.lensNow.z;
      for (const c of list) { if (!c.placed || c.carry || !(c.lit > .05)) continue; const u = (c.u || 4) * z, hh = c.h === undefined ? 7 : c.h;
        const q = L({ x: c.x - .5 * (c.u || 4) + (c.lean || 0) * (c.u || 4) * 2, y: c.y - (hh + 4.5) * (c.u || 4) });
        glow(g, q.x + u / 2, q.y, 16 * u * c.lit, '255,150,60', .45); px(g, '#ffd04a', q.x, q.y - u, u, 2 * u * c.lit); px(g, '#fff6c8', q.x, q.y - u, u, u); } });
  }

  /* the little devil: a puff of black smoke with horns and red eyes */
  const IMP = { pal: { K: '#140c18', k: '#2c1e34', R: '#ff3a2a', W: '#fff2c0', H: '#3a1020' }, rows: [
    'H.......H', 'HH.....HH', '.KKKKKKK.', 'KKKKKKKKK', 'KKWRKWRKK', 'KKRRKRRKK', 'KKKKKKKKK', 'KkKKKKKkK', '.KKkKkKK.', '..KKKKK..'] };
  const IMP_GRIN = { pal: IMP.pal, rows: [
    'H.......H', 'HH.....HH', '.KKKKKKK.', 'KKKKKKKKK', 'KKRRKRRKK', 'KKKKKKKKK', 'KKWKWKWKK', 'KkKWKWKkK', '.KKkKkKK.', '..KKKKK..'] };
  function impFx(K, imp) {
    return K.fx('front', 0, (g) => {
      if (!imp.on || imp.s <= 0) return;
      const u = imp.u * imp.s, x = imp.x, bob = imp.run ? Math.abs(Math.sin(K.t * 16)) * 4 : Math.sin(K.t * 3) * 3, y = imp.y - bob, spr = imp.grin ? IMP_GRIN : IMP;
      // a soft shadow and a purple rim, so you see it in the dark
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, imp.ground || K.FEET, 5 * u, 1.2 * u, 0, 0, 7); g.fill();
      for (let k = 0; k < 6; k++) { const a = K.t * 2 + k; g.fillStyle = 'rgba(30,18,36,.55)'; g.fillRect(Math.round(x + Math.cos(a) * 5.5 * u - u), Math.round(y - 5 * u + Math.sin(a * 1.3) * 4 * u), Math.ceil(u * 1.6), Math.ceil(u * 1.6)); }
      const rim = { pal: { K: '#7a4a9a', k: '#7a4a9a', R: '#7a4a9a', W: '#7a4a9a', H: '#7a4a9a' }, rows: spr.rows };
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) sprite(g, rim, x + dx * u * .6, y - 5 * u + dy * u * .6, u, imp.face > 0);
      sprite(g, spr, x, y - 5 * u, u, imp.face > 0);
      if (imp.run) { const ph = Math.floor(K.t * 14) % 2; g.fillStyle = '#140c18'; g.fillRect(Math.round(x - 2 * u + ph * u), Math.round(y), Math.ceil(u), Math.ceil(u * 1.5)); g.fillRect(Math.round(x + u - ph * u), Math.round(y), Math.ceil(u), Math.ceil(u * 1.5)); }
      if (imp.sweat) for (let k = 0; k < 2; k++) { const a = (K.t * 1.4 + k / 2) % 1; K.sprC(g, K.SP.drop, x + (k ? 6 : -6) * u * .8 + (k ? 1 : -1) * 20 * a, y - 11 * u + 20 * a, u * .5); }
      if (imp.dizzy) for (let k = 0; k < 3; k++) { const a = K.t * 4 + k * 2.1; K.sprC(g, K.SP.star, x + Math.cos(a) * 7 * u, y - 12 * u + Math.sin(a) * 1.5 * u, u * .45); }
    });
  }
  const CARROT = { pal: { O: '#f08a24', o: '#b85a14', G: '#5cc14a', g: '#2f8a2a' }, rows: [
    '.........G.G', '..........GG', '...OOOOOOOgG', 'OOOoOOOoOOO.', '..OOOoOOOO..'] };

  /* =====================================================================================================
     DE UITDRIJVING — a little devil of black smoke creeps into Pippa. She floats, walks backwards, the
     world trembles. Kamiel puts on a cassock, the others bring candles, a carrot and the red ball, and
     after a ritual with wind, lightning and a column of light the devil flies out and runs off.
     ===================================================================================================== */
  F['film-duivel'] = { can: (K) => K.castNames().includes('pippa'), run: function* (K) {
    const { W, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez } = K;
    const names = K.castNames(); if (!names.includes('pippa')) return;
    const NIGHT = !!(K.A.night && K.A.night()), DK = (v) => NIGHT ? v * .4 : v * 1.25, GN = NIGHT ? .4 : .9;   // at night the world is already darker; by day it must become evening
    const pip = K.pet('pippa', -1);
    const others = names.filter(n => n !== 'pippa').map(n => K.pet(n, 1));
    const by = (n) => others.find(a => a.pet === n);
    const wifi = by('wifi'), snoet = by('snoet'), peb = by('pebbels'), dob = by('dobby');
    const faceTo = (a, x) => { a.face = x > a.cx ? 1 : -1; };
    const seatAll = () => others.forEach(a => hold(a, a.pet === 'dobby' ? 'lie' : 'sit'));

    // the evening: Kamiel by the oil lamp, the gang around, Pippa a bit apart (as always)
    kam.x = 120; kam.face = -1;
    pip.cx = 170; pip.face = -1; hold(pip, 'sit');
    const spots = [440, 770, 850, 360];
    others.forEach((a, i) => { a.cx = spots[i]; faceTo(a, K.kx()); });
    seatAll();
    const lamp = { x: 700, on: 1, k: 1 };
    const lampFx = fx('back', 0, (g) => { const x = lamp.x, y = FEET - 6, u = 4;
      px(g, '#2b2118', x - 6 * u, y - 2 * u, 12 * u, 2 * u); px(g, '#4a3626', x - 4 * u, y - 4 * u, 8 * u, 2 * u);
      px(g, '#6b4a2a', x - 3 * u, y - 9 * u, 6 * u, 5 * u); px(g, '#86603a', x - 3 * u, y - 9 * u, 2 * u, 5 * u);
      px(g, 'rgba(230,240,255,.25)', x - 3 * u, y - 19 * u, 6 * u, 10 * u); px(g, '#2b2118', x - 4 * u, y - 20 * u, 8 * u, u);
      if (lamp.on) { const f = rnd() * .2; px(g, `rgba(255,${150 + Math.floor(rnd() * 50)},60,${(.8 + f) * lamp.k})`, x - u, y - 16 * u, 2 * u, 5 * u); px(g, `rgba(255,240,180,${lamp.k})`, x - .5 * u, y - 14 * u, u, 2 * u); } });
    const lampL = K.light(() => lamp.on ? { x: lamp.x, y: FEET - 60 } : null, 420, { col: '255,170,80', flicker: .06 });
    const glows = eyeGlow(K, [pip]); filters(K);
    const moonPip = K.light(() => pip.alpha > 0 && pip.cx < 400 && !moonPip.gone ? { x: 200, y: FEET - 80 } : null, 230, { col: '150,170,255', a: .8 });
    const fog = fx('front', 0, (g) => { for (let k = 0; k < 4; k++) { const y = FEET - 30 + k * 12, x = ((K.t * (10 + k * 4) + k * 340) % (W + 600)) - 300;
      const gr = g.createRadialGradient(x, y, 10, x, y, 250); gr.addColorStop(0, 'rgba(190,170,210,.10)'); gr.addColorStop(1, 'rgba(190,170,210,0)'); g.fillStyle = gr; g.fillRect(x - 250, y - 60, 500, 120); } });

    yield* K.opening('DE UITDRIJVING', 'EEN GRIEZELFILM MET KAMIEL', 'nacht');
    K.grade('nacht', GN, .01); K.setv('dark', DK(.28), .01); K.setv('vig', NIGHT ? .35 : .6, 2); K.setv('bars', .55, 3);

    /* ---------- part 1: a quiet evening, and something small and black ---------- */
    kam.eyes = 'blij'; emote('notes', 3); yield* wait(2.5);
    if (wifi) { yield* petJump(wifi, 16, .3); emote('heart', 1.5, wifi); }
    yield* wait(1.5); kam.eyes = '';
    // Snoet wants to lick Pippa. Pippa does not want to be licked.
    if (snoet) {
      hold(snoet, null); yield* petTo(snoet, pip.cx + 70, 140); snoet.face = -1; emote('hearts', 1.5, snoet); yield* wait(1);
      pip.face = 1; pip.sq = 1.08; emote('angry', 2, pip); yield* wait(.8);
      yield* petJump(snoet, 30, .45, pip.cx + 170); emote('stars', 2, snoet); hold(snoet, 'sit'); pip.sq = 1;
      yield* wait(1.2); yield* petTo(snoet, spots[1], 140); faceTo(snoet, K.kx()); hold(snoet, 'sit');
      pip.face = -1; kam.eyes = 'blij'; emote('sweat', 2); yield* wait(2); kam.eyes = '';
    } else { pip.face = 1; emote('angry', 2, pip); yield* wait(2.5); pip.face = -1; }
    // bedtime: the lamp burns low
    yield* tween(3, p => { lamp.k = 1 - p * .4; lampL.r = 420 - p * 100; K.setv('dark', DK(.28 + p * .1)); });
    others.forEach(a => hold(a, 'sleep')); kam.eyes = 'dicht'; kam.head = .15;
    const zz = emote('zzz', 30);
    others.forEach((a, i) => emote('zzz', 26 - i, a));
    yield* wait(3);
    yield* K.lensW({ z: 1.5, cx: 260, cy: 400 }, 3);
    pip.face = 1; yield* wait(1.5); pip.face = -1; yield* wait(1.5);
    // from the dark, at the left: a little puff of black smoke comes hopping
    const imp = { on: true, x: -40, y: FEET - 4, s: 1, u: 4, face: 1, run: true, grin: false, ground: FEET };
    const impF = impFx(K, imp);
    const impGlow = K.over((g, age, L) => { if (!imp.on || imp.s <= .05) return; const q = L({ x: imp.x, y: imp.y - 5 * imp.u * imp.s }); glow(g, q.x, q.y, 30 * imp.s * K.lensNow.z, '255,40,30', .35); });
    yield* tween(5, p => { imp.x = lerp(-40, 80, p); imp.y = FEET - 4 - Math.abs(Math.sin(p * Math.PI * 5)) * 18; });
    imp.run = false; imp.y = FEET - 4;
    pip.eyes = 'groot'; emote('!', 1.2, pip); yield* wait(1.2);
    yield* K.lensW({ z: 2.4, cx: 130, cy: 470 }, 1.4);
    yield* wait(1);
    // she hisses
    pip.eyes = ''; pip.sq = 1.12; emote('angry', 1.8, pip); K.lens({ shake: 2 }, 0); yield* wait(.6); K.lens({ shake: 0 }, .3);
    imp.sweat = true; yield* tween(.4, p => { imp.x = 80 - p * 20; }); yield* wait(1.2); pip.sq = 1;
    // … it grins.
    imp.sweat = false; imp.grin = true; yield* wait(1.6);
    // and jumps into her
    const sx = imp.x, ny = K.A.petPoint(pip, 'nose');
    yield* tween(.7, p => { imp.x = lerp(sx, ny.x, p); imp.y = lerp(FEET - 4, ny.y + 20, p) - Math.sin(p * Math.PI) * 90; imp.s = 1 - p * .9; });
    imp.on = false; imp.s = 1; imp.grin = false;
    K.flash(1, '255,40,40', 2); K.lens({ shake: 6 }, 0); pip.eyes = 'groot';
    const puff = smoke(K, 'front', () => K.A.petPoint(pip, 'head'), { until: K.t + 1.2, rate: 1, spread: 40 });
    yield* tween(1.2, p => { pip.r = Math.sin(p * 40) * .08 * (1 - p); }); pip.r = 0; K.lens({ shake: 0 }, .3);
    pip.eyes = ''; yield* wait(1.2);
    // still. Then two red lights.
    K.grade('rood', .45, .3); pip.f0 = 'brightness(.7) sepia(1) saturate(3.5) hue-rotate(-40deg)';
    pip.deco = (g, at, u) => { const hd = at('head'); px(g, '#b0142a', hd.x - 3 * u, hd.y - 1.5 * u, u, 2 * u); px(g, '#b0142a', hd.x + 2 * u, hd.y - 1.5 * u, u, 2 * u); px(g, '#ff4050', hd.x - 3 * u, hd.y - 2.5 * u, u, u); px(g, '#ff4050', hd.x + 2 * u, hd.y - 2.5 * u, u, u); };
    yield* tween(1.5, p => { pip.glow = p; });
    yield* wait(1.5);
    K.grade('nacht', GN, 2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 3);
    // she turns, slowly, to the ones who sleep
    yield* wait(1); pip.face = 1; yield* wait(3);
    stop(puff);
    yield* K.fadeOut(1.8);
    stop(zz);
    yield* K.card('DEEL 2', 'ER IS IETS MET PIPPA', 2.6, { size: 44 });

    /* ---------- part 2: the signs ---------- */
    lamp.k = 1; lampL.r = 420; K.setv('dark', DK(.3), .01); kam.eyes = ''; kam.head = 0;
    others.forEach((a, i) => { a.cx = spots[i]; faceTo(a, K.kx()); }); seatAll();
    pip.cx = 300; pip.face = -1; hold(pip, 'sit');
    yield* K.fadeIn(1.8);
    yield* hop(16, .35); kam.eyes = 'blij'; yield* wait(1.4); kam.eyes = '';
    // Wifi wants to play with her
    const ball = { on: false, x: 0, y: FEET - 1 };
    K.ballFx(ball);
    if (wifi) {
      hold(wifi, null); ball.on = true;
      const carry = fx('back', 0, () => { if (ball.held) { const n = K.A.petPoint(wifi, 'nose'); ball.x = n.x; ball.y = n.y + 6; } }); ball.held = true;
      yield* petTo(wifi, pip.cx + 110, 90); wifi.face = -1; ball.held = false; ball.y = FEET - 1; ball.x = pip.cx + 60; stop(carry);
      for (let k = 0; k < 2; k++) { hold(wifi, 'down'); yield* wait(.4); hold(wifi, null); yield* petJump(wifi, 14, .3); emote('burst', .5, wifi); }
      yield* wait(.8);
    }
    // she turns around
    pip.face = 1; yield* wait(.5);
    yield* K.lensW({ z: 2.6, cx: pip.cx + 10, cy: FEET - 70 }, .35);
    pip.glow = 1.4; pip.sq = 1.12; K.flash(.7, '255,30,30', 2); K.grade('rood', .6, .2); lamp.on = 0; K.lens({ shake: 4 }, 0);
    yield* wait(.9); K.lens({ shake: 0 }, .2); lamp.on = 1; pip.glow = 1; pip.sq = 1;
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .5);
    if (wifi) { wifi.eyes = 'groot'; emote('!', 1.2, wifi); yield* petJump(wifi, 40, .4, wifi.cx + 60); yield* petTo(wifi, K.kx() + 60, 200); wifi.face = -1; hold(wifi, 'down'); wifi.eyes = ''; }
    K.grade('nacht', GN, 1.5);
    // the ball lifts by itself, turns, and drops
    if (ball.on) {
      const b0 = ball.x; yield* tween(2.4, p => { ball.y = FEET - 1 - ez(p) * 120; ball.x = b0 + Math.sin(p * 9) * 8; });
      yield* wait(.8); yield* tween(.3, p => { ball.y = FEET - 121 + p * 120; }); ball.y = FEET - 1; K.lens({ shake: 2 }, 0); yield* wait(.2); K.lens({ shake: 0 }, .3);
      others.forEach(a => { a.eyes = 'groot'; }); kam.eyes = 'groot'; emote('!?', 2); yield* wait(2); others.forEach(a => { a.eyes = ''; });
    }
    // she walks… backwards. All the way across. The world trembles as she passes.
    pip.lockPose = false; hold(pip, 'walk'); pip.rate = 7;
    let trem = 0;
    K.setItemOff((it, layer) => trem > 0 ? { x: (rnd() - .5) * 5 * trem, y: (rnd() - .5) * 3 * trem, r: layer ? (rnd() - .5) * .06 * trem : 0 } : null);
    const x0 = pip.cx;
    yield* tween(9, p => { pip.cx = lerp(x0, 900, p); pip.face = -1; trem = Math.sin(p * Math.PI);
      others.forEach(a => { if (!a.lockPose || a.pose !== 'down') faceTo(a, pip.cx); }); kam.face = pip.cx > K.kx() ? 1 : -1;
      if (peb && Math.abs(pip.cx - peb.cx) < 30 && !peb.jumped) { peb.jumped = true; } });
    trem = 0; hold(pip, 'stand');
    if (peb && peb.jumped) { peb.eyes = 'groot'; emote('!', 1.4, peb); yield* petJump(peb, 50, .45, peb.cx - 60); peb.eyes = ''; hold(peb, 'down'); }
    // the lamp flickers
    for (let k = 0; k < 6; k++) { lamp.on = 0; yield* wait(.06 + rnd() * .18); lamp.on = 1; yield* wait(.08 + rnd() * .3); }
    kam.eyes = 'triest'; emote('sweat', 2.5); yield* wait(1.5);
    // she rises
    pip.bx = pip.cx; pip.bl = 0; pip.face = -1; hold(pip, 'stand');
    const dust = K.particles('front', { until: K.t + 6, emit: (ps) => { if (rnd() < .5) ps.push(K.P({ x: pip.bx + (rnd() - .5) * 60, y: FEET, vx: (rnd() - .5) * 60, vy: -20 - rnd() * 30, life: 1.4 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(150,120,160,${.6 * (1 - k)})`; g.fillRect(Math.round(p.x), Math.round(p.y), 4, 4); } });
    K.grade('rood', .5, 3); trem = .6;
    yield* tween(3, p => { pip.bl = ez(p) * 70; spin(pip, 0); });
    if (dob) { hold(dob, 'down'); dob.sq = .8; K.lens({ shake: 4 }, 0); emote('!', 1.2, dob); yield* wait(.25); dob.sq = 1; K.lens({ shake: 0 }, .3); }
    // the head turns all the way round
    yield* K.lensW({ z: 1.8, cx: pip.bx - 60, cy: FEET - 150 }, 1.5);
    yield* tween(5, p => { spin(pip, ez(p) * Math.PI * 2); pip.bl = 70 + Math.sin(p * Math.PI) * 20; });
    spin(pip, 0);
    if (snoet) { hold(snoet, 'stand'); for (let k = 0; k < 3; k++) { emote('burst', .4, snoet); yield* petJump(snoet, 10, .25); } }
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.2);
    // she floats over to Kamiel, to his face
    const kx = K.kx();
    yield* tween(4, p => { pip.bx = lerp(900, kx - 120, ez(p)); pip.bl = lerp(70, 140, ez(p)); spin(pip, Math.sin(p * 6) * .1); });
    kam.face = -1; kam.eyes = 'groot';
    yield* K.lensW({ z: 2.3, cx: kx - 70, cy: FEET - 190 }, 1.6);
    emote('sweat', 3); yield* wait(1.2);
    for (let k = 0; k < 4; k++) { pip.face = -pip.face; yield* wait(.35); }
    pip.face = 1; yield* wait(1);
    // she burps a black cloud in his face
    const burp = smoke(K, 'front', () => K.A.petPoint(pip, 'nose'), { until: K.t + .8, rate: 1, spread: 10, vx: 80 });
    K.lens({ shake: 2 }, 0); yield* wait(.4); K.lens({ shake: 0 }, .3);
    kam.eyes = 'x'; yield* tween(1.4, p => { kam.head = Math.sin(p * 18) * .12; }); kam.head = 0;
    yield* wait(1); stop(burp);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.2);
    // she drops down, sits, all innocent… then backs off into the dark
    yield* tween(.5, p => { pip.bl = 140 * (1 - p * p); spin(pip, 0); }); pip.lift = 0; pip.r = 0; hold(pip, 'sit'); K.lens({ shake: 3 }, 0); yield* wait(.2); K.lens({ shake: 0 }, .3);
    trem = 0; K.grade('nacht', GN, 2);
    kam.eyes = 'groot'; yield* wait(2);
    hold(pip, 'walk'); pip.rate = 7; const x1 = pip.cx;
    yield* tween(5, p => { pip.cx = lerp(x1, -80, p); pip.face = 1; trem = .4; });
    trem = 0; pip.alpha = 0; pip.cx = -80; hold(pip, 'sit');
    // the others gather around Kamiel
    others.forEach(a => hold(a, null));
    yield* par(...others.map((a, i) => petTo(a, K.kx() + (i % 2 ? 1 : -1) * (90 + i * 25), K.PET[a.pet].run)));
    others.forEach(a => { faceTo(a, K.kx()); hold(a, 'sit'); emote('?', 2, a); });
    kam.face = 1; yield* wait(1.5); kam.face = -1; yield* wait(1);
    kam.eyes = 'boos'; emote('!', 1.5); yield* wait(1.5); emote('sparks', 2); yield* hop(24, .4); yield* wait(1.5);
    yield* K.fadeOut(1.8);
    yield* K.card('DEEL 3', 'DE VOORBEREIDING', 2.6, { size: 44 });

    /* ---------- part 3: the preparation ---------- */
    const Cx = 420, Cy = FEET - 16, RX = 210, RY = 26, FR = { z: 1.12, cx: 480, cy: 340 };
    const places = { dobby: 80, pebbels: 150, wifi: Cx + RX + 50, snoet: Cx + RX + 270 };
    K.withOutfit(['toog', 'boord']);
    kam.x = 60; kam.face = -1; kam.eyes = ''; kam.head = 0;
    others.forEach((a, i) => { a.cx = K.kx() + 120 + i * 55; a.face = -1; hold(a, 'sit'); });
    K.grade('nacht', NIGHT ? .1 : .3, .01); K.setv('dark', DK(.3), .01); lamp.x = 870;
    const SC = { dawn: 0, cx: Cx }; K.stage(() => {}); moonPip.gone = true; const decor = clearing(K, SC);
    const moonL = K.light(() => ({ x: 740, y: 170 + SC.dawn * 60 }), 260, { a: .8 });
    const kamL = K.light(() => K.kp(300, 600), 240, { a: .75 });
    yield* K.lensW({ z: 1.9, cx: K.kx(), cy: FEET - 170 }, 0);
    yield* K.fadeIn(1.4);
    // the priest look: a slow tilt down from the collar to the hooves
    yield* K.lensW({ z: 1.9, cx: K.kx(), cy: FEET - 70 }, 3.5);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.6);
    others.forEach(a => emote('!', 1.2, a)); yield* wait(.4);
    kam.eyes = 'boos'; emote('sparks', 2); yield* wait(2);
    // the circle: he walks along it and scratches it into the ground with a hoof
    const circ = { p: 0, star: 0, glow: 0, col: '255,236,190' };
    const circFx = fx('back', 0, (g) => {
      const n = 64, u = 4;
      for (let k = 0; k < n * circ.p; k++) { const a = -k / n * Math.PI * 2, x = Cx + Math.cos(a) * RX, y = Cy + Math.sin(a) * RY;
        px(g, `rgba(${circ.col},${.8 + .2 * circ.glow})`, x - u / 2, y - u / 2, u, u); px(g, `rgba(255,255,255,${.5 + .5 * circ.glow})`, x - u / 4, y - u / 4, u / 2, u / 2); }
      if (circ.star > 0) {   // a five-pointed star in the middle, flat on the ground, drawn in dots
        const pts = []; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 4 / 5; pts.push({ x: Cx + Math.cos(a) * RX * .62, y: Cy + Math.sin(a) * RY * .62 }); }
        for (let k = 0; k < 5 * circ.star; k++) { const p = pts[k % 5], q = pts[(k + 1) % 5];
          for (let j = 0; j < 14; j++) { const x = p.x + (q.x - p.x) * j / 14, y = p.y + (q.y - p.y) * j / 14; px(g, `rgba(${circ.col},${.75 + .25 * circ.glow})`, x - 2, y - 1, 4, 3); } }
      }
    });
    const circGlow = K.over((g, age, L) => { if (circ.glow <= 0) return; const q = L({ x: Cx, y: Cy });
      g.save(); g.globalCompositeOperation = 'lighter'; const z = K.lensNow.z; g.translate(q.x, q.y); g.scale(1, RY / RX);
      const gr = g.createRadialGradient(0, 0, RX * .7 * z, 0, 0, RX * 1.25 * z); gr.addColorStop(0, `rgba(${circ.col},0)`); gr.addColorStop(.5, `rgba(${circ.col},${.4 * circ.glow})`); gr.addColorStop(1, `rgba(${circ.col},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, RX * 1.25 * z, 0, 7); g.fill(); g.restore(); });
    yield* K.lensW(FR, 1.2);
    yield* walkTo(Cx + RX - W / 2, 60);
    kam.face = -1; kam.head = .25;
    const scratch = K.particles('front', { emit: (ps) => { if (kam.pose === 'walk' && rnd() < .7) { const p = K.kp(80, 1360); ps.push(K.P({ x: p.x, y: FEET - 4, vx: (rnd() - .5) * 50, vy: -40 - rnd() * 40, grav: 200, life: .6 })); } },
      draw: (g, p, k) => { g.fillStyle = `rgba(230,210,170,${1 - k})`; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); } });
    yield* par(walkTo(Cx - RX - W / 2, 45), tween((2 * RX) / 45, p => { circ.p = p * .5; }));
    yield* par(walkTo(Cx + RX - W / 2 + 40, 45), tween((2 * RX + 40) / 45, p => { circ.p = .5 + p * .5; }));
    circ.p = 1; stop(scratch); kam.face = -1;
    yield* tween(2.5, p => { circ.star = p; }); kam.head = 0;
    emote('dots', 2); yield* wait(2);
    yield* walkTo(Cx + RX + 160 - W / 2, 50); kam.face = -1;
    // the candles: the housemates bring them, one by one, in their mouths
    const candles = [];
    for (const deg of [180, 210, 245, 285, 320, 355, 140, 40]) { const a = deg * Math.PI / 180; candles.push({ x: Cx + Math.cos(a) * (RX + 6), y: Cy + Math.sin(a) * RY, lit: 0, lean: 0, h: 7, placed: false, carry: null, front: Math.sin(a) > 0 }); }
    const cdraw = (front) => (g) => { for (const c of candles) { if (c.carry || !c.placed || c.front !== front) continue; candle(g, c.x, c.y, 4, c, K.t); } };
    const cBack = fx('back', 0, cdraw(false)), cFront = fx('front', 0, cdraw(true));
    const cHeld = fx('front', 0, (g) => { for (const c of candles) if (c.carry) { const n = K.A.petPoint(c.carry, 'nose'); candle(g, n.x - c.carry.face * 4, n.y + 26, 2.4, c, K.t); } });
    flameGlow(K, candles);
    candles.forEach(c => { c.light = K.light(() => c.placed && c.lit > .05 ? { x: c.x, y: c.y - 40 } : null, 120, { col: '255,170,80', flicker: .15 }); });
    yield* K.lensW(FR, .01);
    if (others.length) {
      let ci = 0;
      while (ci < candles.length) {
        const batch = others.slice(0, Math.min(others.length, candles.length - ci)).map((a, j) => ({ a, c: candles[ci + j] }));
        ci += batch.length;
        batch.forEach(({ a, c }, j) => { hold(a, null); a.cx = W + 60 + j * 50; a.feet = FEET; c.carry = a; c.placed = true; });
        yield* par(...batch.map(({ a, c }, j) => (function* () { yield* wait(j * .6); yield* petTo(a, c.x + 30, Math.max(75, K.PET[a.pet].run * .8)); a.face = -1; hold(a, 'down'); yield* wait(.5); c.carry = null; hold(a, null); a.face = 1; yield* wait(.4); })()));
        if (ci < candles.length) yield* par(...batch.map(({ a }) => petTo(a, W + 60, Math.max(110, K.PET[a.pet].run))));
      }
      // Pebbels has to sniff one. The candle is not lit, but she startles anyway.
      if (peb) { yield* petTo(peb, candles[2].x + 34, 40); peb.face = -1; hold(peb, 'down'); yield* wait(1.5); hold(peb, null); peb.eyes = 'groot'; emote('!', 1.2, peb); yield* petJump(peb, 40, .4, peb.cx + 50); peb.eyes = ''; }
    } else { for (const c of candles) { c.placed = true; emote('sparks', .5); yield* wait(.5); } }
    // everyone to their places, outside the circle
    yield* par(...others.map((a) => petTo(a, a.pet === 'dobby' ? -60 : places[a.pet], K.PET[a.pet].run * .8)));
    others.forEach(a => { faceTo(a, Cx); hold(a, 'sit'); });
    // two red eyes in the dark at the edge, watching all of this
    const watch = { on: true, a: 0 };
    const watchO = K.over((g, age, L) => { if (!watch.on || watch.a <= 0) return; const z = K.lensNow.z; for (const dx of [0, 22]) { const q = L({ x: 40 + dx, y: FEET - 70 });
      const bl = Math.sin(K.t * 1.7) > .93 ? .1 : 1; glow(g, q.x, q.y, 20 * z, '255,30,30', .6 * watch.a); g.globalAlpha = watch.a * bl; px(g, '#ff3030', q.x - 4 * z, q.y - 3 * z, 8 * z, 5 * z); g.globalAlpha = 1; } });
    yield* tween(2, p => { watch.a = p; });
    yield* K.lensW({ z: 2.4, cx: 90, cy: FEET - 120 }, 1.2);
    yield* wait(2.4);
    yield* K.lensW(FR, 1.2);
    // Dobby brings his holiest thing: a carrot
    const carrot = { x: 0, y: 0, on: false, held: dob || null, glow: 0 };
    const carrotFx = fx('front', 0, (g) => { if (!carrot.on) return; if (carrot.held) { const n = K.A.petPoint(carrot.held, 'nose'); carrot.x = n.x + carrot.held.face * 6; carrot.y = n.y + 8; }
      sprite(g, CARROT, carrot.x, carrot.y, 3, carrot.held ? carrot.held.face > 0 : false); });
    const carrotGlow = K.over((g, age, L) => { if (!carrot.on || carrot.glow <= 0) return; const q = L({ x: carrot.x, y: carrot.y }); glow(g, q.x, q.y, 70 * carrot.glow * K.lensNow.z, '255,180,60', .7); });
    if (dob) {
      hold(dob, null); dob.cx = -60; carrot.on = true;
      yield* par(petTo(dob, places.dobby, 45), tween(2, p => { watch.a = 1 - p; })); dob.face = 1;
      for (let k = 0; k < 2; k++) { yield* petJump(dob, 26, .35); }   // a binky of pride
      hold(dob, 'sit'); emote('sparks', 1.5, dob); yield* wait(1.5);
    }
    // Wifi puts her red ball by the circle
    if (wifi) {
      ball.on = true; ball.held = false; ball.x = wifi.cx + 40; ball.y = FEET - 1;
      hold(wifi, null); yield* petTo(wifi, ball.x + 34, 50); wifi.face = -1; hold(wifi, 'down'); yield* wait(.6); hold(wifi, null);
      yield* par(tween(1.4, p => { ball.x = lerp(wifi.cx - 34, Cx + RX - 10, ez(p)); }), petTo(wifi, places.wifi + 10, 40)); emote('heart', 1.5, wifi); wifi.face = -1; hold(wifi, 'sit');
    }
    // Snoet practises his prayers: bark, bark, bark — and a little song
    if (snoet) {
      hold(snoet, 'stand'); for (let k = 0; k < 4; k++) { emote('burst', .35, snoet); yield* petJump(snoet, 8, .2); yield* wait(.25); }
      emote('notes', 2.5, snoet); yield* wait(2.5); others.forEach(a => { if (a !== snoet) emote('dots', 2, a); }); hold(snoet, 'sit'); yield* wait(1.5);
    }
    // Kamiel bows his head: the candles light, one after the other
    kam.head = .3; kam.eyes = 'dicht'; yield* wait(1.4);
    for (const c of candles) { c.lit = 1; const sp = K.particles('front', { dur: .7, emit: (ps) => { if (ps.length < 8) ps.push(K.P({ x: c.x, y: c.y - 36, vx: (rnd() - .5) * 90, vy: -60 - rnd() * 60, grav: 120, life: .6 })); }, draw: (g, p, k) => { g.fillStyle = `rgba(255,220,120,${1 - k})`; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); } }); yield* wait(.5); }
    yield* tween(2, p => { K.setv('dark', DK(.3 + p * .12)); lamp.k = 1 - p; circ.glow = p * .5; }); lamp.on = 0;
    kam.head = 0; kam.eyes = 'boos'; yield* wait(1.2);
    yield* K.fadeOut(1.8);
    yield* K.card('DEEL 4', 'DE UITDRIJVING', 2.6, { size: 44 });

    /* ---------- part 4: the exorcism ---------- */
    yield* K.lensW(FR, .01);
    yield* K.fadeIn(1.6);
    yield* wait(1);
    // the circle calls her: she comes floating in, struggling
    watch.on = false; pip.alpha = 1; pip.cx = -60; pip.bx = -60; pip.bl = 30; pip.face = 1; hold(pip, 'stand');
    K.grade('rood', .35, 2); circ.glow = .8;
    yield* tween(6, p => { pip.bx = lerp(-60, Cx, ez(p)); pip.bl = lerp(30, 80, ez(p)); spin(pip, Math.sin(p * 30) * .15 * (1 - p)); pip.face = Math.sin(p * 13) > 0 ? -1 : 1; });
    spin(pip, 0); pip.face = 1;
    others.forEach(a => { a.eyes = 'groot'; }); yield* wait(1); others.forEach(a => { a.eyes = ''; });
    // phase 1: the prayer. Kamiel chants, Snoet barks along.
    kam.head = -.25; kam.eyes = 'dicht';
    const chant = emote('notes', 10);
    yield* tween(8, p => { kam.mouth = Math.abs(Math.sin(p * 30)) * .6; pip.bl = 80 + Math.sin(p * 10) * 8; spin(pip, Math.sin(p * 20) * .05);
      if (snoet && Math.floor(p * 16) !== snoet.lastB) { snoet.lastB = Math.floor(p * 16); if (snoet.lastB % 2 === 0) emote('burst', .3, snoet); } });
    kam.mouth = 0; stop(chant);
    // she hisses back: a wind comes up, candles go out, the world shakes
    pip.sq = 1.15; pip.glow = 1.6; K.flash(.6, '255,30,30', 2); K.grade('rood', .65, .4);
    const wind = K.weather('leaves', 2.5), wdust = K.weather('dust', 2);
    trem = 1; K.lens({ shake: 3 }, 0);
    yield* tween(3, p => { candles.forEach(c => { c.lean = -1.2 * Math.sin(p * Math.PI); }); });
    for (const i of [0, 3, 6]) { candles[i].lit = 0; yield* wait(.4); }
    K.setv('dark', DK(.5), .5); K.lens({ shake: 1 }, .5);
    bolt(K, Cx + 120, FEET - 20); K.flash(1, '220,230,255', 2.5); yield* wait(.3);
    kam.eyes = 'groot'; others.forEach(a => { hold(a, 'down'); }); emote('sweat', 2.5); yield* wait(2.5);
    pip.sq = 1; pip.glow = 1;
    // phase 2: Dobby holds up the carrot
    if (dob) {
      hold(dob, null); yield* petTo(dob, Cx - RX + 20, 40); dob.face = 1; hold(dob, 'up');
      yield* tween(1.5, p => { carrot.glow = p; });
      yield* K.lensW({ z: 2, cx: (dob.cx + Cx) / 2, cy: FEET - 120 }, 1);
    } else { yield* K.lensW({ z: 2, cx: Cx, cy: FEET - 120 }, 1); }
    // she recoils, flips upside down, shaking
    yield* tween(2, p => { spin(pip, ez(p) * Math.PI); pip.bx = Cx + Math.sin(p * 50) * 4; });
    yield* wait(1); K.lens({ shake: 4 }, 0);
    yield* tween(1.5, p => { pip.bx = Cx + Math.sin(p * 70) * 5; spin(pip, Math.PI + Math.sin(p * 30) * .2); });
    K.lens({ shake: 1 }, .3);
    // the candles that went out come back
    for (const i of [0, 3, 6]) { candles[i].lit = 1; yield* wait(.3); }
    K.setv('dark', DK(.42), .5);
    yield* K.lensW(FR, 1);
    // phase 3: Wifi rolls the ball into the circle; everyone stands together
    if (wifi && ball.on) { hold(wifi, null); yield* petTo(wifi, ball.x + 30, 60); wifi.face = -1; yield* par(tween(1.2, p => { ball.x = lerp(Cx + RX - 10, Cx + 60, ez(p)); }), petTo(wifi, Cx + RX - 20, 50)); wifi.face = -1; }
    const ballGlow = K.over((g, age, L) => { if (!ball.on || !ball.glow) return; const q = L({ x: ball.x, y: ball.y - 6 }); glow(g, q.x, q.y, 60 * ball.glow * K.lensNow.z, '255,90,90', .6); });
    yield* tween(1, p => { ball.glow = p; });
    others.forEach(a => { hold(a, a.pet === 'dobby' ? 'up' : 'stand'); emote('sparks', 2, a); });
    kam.eyes = 'boos'; kam.head = -.3; emote('sparks', 2); yield* hop(20, .35); yield* hop(20, .35);
    // the column of light
    const beam = { w: 0, a: 0 };
    const beamO = K.over((g, age, L) => { if (beam.a <= 0) return; const q = L({ x: Cx, y: FEET - 20 }), z = K.lensNow.z, w = beam.w * z;
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(q.x - w, 0, q.x + w, 0); gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(.5, `rgba(255,245,210,${.75 * beam.a})`); gr.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = gr; g.fillRect(q.x - w, 0, w * 2, q.y);
      for (let k = 0; k < 10; k++) { const y = (K.t * 300 + k * 60) % q.y; px(g, `rgba(255,255,230,${.6 * beam.a})`, q.x - w * .4 + ((k * 37) % 10) / 10 * w * .8, y, 3 * z, 8 * z); }
      g.restore(); });
    const beamL = K.light(() => beam.a > .1 ? { x: Cx, y: FEET - 160 } : null, 360, { col: '255,240,200' });
    kam.mouth = .8;
    yield* tween(2.5, p => { beam.a = p; beam.w = 20 + p * 60; });
    K.grade('goud', .5, 1.5); K.lens({ shake: 5 }, 0);
    yield* K.lensW({ z: 1.8, cx: Cx, cy: FEET - 160, shake: 5 }, 1.5);
    // she spins faster and faster…
    let rr = Math.PI;
    yield* tween(3, p => { rr += (4 + p * 26) * K.dt; spin(pip, rr); pip.bl = 80 + p * 40; beam.w = 80 + p * 40; });
    // … and out it comes
    K.flash(1, '255,255,255', 1.2); bolt(K, Cx - 140, FEET - 10, .4);
    pip.f0 = ''; pip.deco = null; pip.glow = 0; spin(pip, 0); pip.sq = 1;
    const pc = { x: Cx, y: FEET - 200 };
    imp.on = true; imp.x = pc.x; imp.y = pc.y; imp.s = .2; imp.grin = false; imp.run = false; imp.face = -1;
    stop(wind); stop(wdust); trem = 0; candles.forEach(c => { c.lean = 0; });
    yield* tween(1.2, p => { imp.s = .2 + p * .8; imp.x = lerp(pc.x, Cx + 240, p); imp.y = pc.y - Math.sin(p * Math.PI) * 140 + p * (FEET - 4 - pc.y); });
    imp.y = FEET - 4; K.lens({ shake: 3 }, 0); yield* wait(.15); K.lens({ shake: 0 }, .4);
    yield* tween(1.5, p => { beam.a = 1 - p; });
    K.unlight(beamL); kam.mouth = 0; kam.head = 0;
    // Pippa comes down, softly, and sleeps
    yield* tween(2.5, p => { pip.bl = 120 * (1 - ez(p)); spin(pip, 0); }); pip.lift = 0; hold(pip, 'sleep');
    K.grade('nacht', .35, 2); K.setv('dark', DK(.35), 2); circ.glow = .3; ball.glow = 0; carrot.glow = 0;
    // the devil, dizzy, on the ground. Everybody looks at it.
    imp.dizzy = true;
    yield* K.lensW({ z: 2.6, cx: imp.x, cy: FEET - 60 }, 1.4);
    yield* wait(2); imp.dizzy = false;
    imp.face = 1; yield* wait(.7); imp.face = -1; yield* wait(.7);
    yield* K.lensW(FR, 1);
    others.forEach(a => { hold(a, 'stand'); faceTo(a, imp.x); a.eyes = 'groot'; }); kam.face = imp.x > K.kx() ? 1 : -1; kam.eyes = 'boos';
    yield* wait(1.5);
    // it tries to be scary… nobody flinches
    yield* tween(.5, p => { imp.s = 1 + p * .6; }); imp.grin = true; yield* wait(1.2);
    yield* tween(.5, p => { imp.s = 1.6 - p * .6; }); imp.grin = false; imp.sweat = true; yield* wait(1.4);
    // it runs!
    imp.run = true; imp.face = 1; imp.sweat = false;
    const dustT = K.particles('back', { emit: (ps) => { if (imp.on && imp.run && rnd() < .5) ps.push(K.P({ x: imp.x, y: FEET - 2, vx: -imp.face * 40, vy: -20, life: .7 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(200,180,160,${.7 * (1 - k)})`; g.fillRect(Math.round(p.x), Math.round(p.y), 4, 4); } });
    const ix = imp.x;
    yield* par(tween(1.6, p => { imp.x = lerp(ix, W + 80, p); }), snoet ? (function* () { hold(snoet, null); emote('burst', .4, snoet); yield* petTo(snoet, W - 60, 200); snoet.face = 1; for (let k = 0; k < 3; k++) { emote('burst', .35, snoet); yield* petJump(snoet, 12, .25); } })() : wait(1.6));
    imp.on = false; stop(dustT);
    if (snoet) { yield* petTo(snoet, places.snoet, 120); snoet.face = -1; emote('stars', 2, snoet); hold(snoet, 'sit'); }
    others.forEach(a => { a.eyes = ''; }); kam.eyes = 'blij'; emote('sweat', 2); yield* wait(2.5);
    yield* K.fadeOut(2);
    yield* K.card('DEEL 5', 'DE OCHTEND', 2.6, { size: 44 });

    /* ---------- part 5: morning. Pippa is Pippa again. ---------- */
    stop(fog); K.unover(beamO); K.unover(ballGlow); K.unover(carrotGlow); K.unover(circGlow); K.unover(watchO); K.unover(impGlow);
    K.setv('dark', 0, .01); K.grade('warm', .5, .01); K.setItemOff(null); SC.dawn = 1; K.unlight(moonL);
    candles.forEach(c => { c.lit = 0; c.h = 2 + Math.floor(rnd() * 3); }); circ.col = '200,190,170'; circ.glow = 0;
    carrot.held = null; carrot.on = !!dob; carrot.x = Cx - 120; carrot.y = FEET - 6;
    ball.on = !!wifi; ball.x = Cx + 90; ball.y = FEET - 1;
    kam.x = Cx + 150 - W / 2; kam.face = -1; kam.eyes = 'dicht'; kam.head = .15; kam.mouth = 0;
    pip.cx = Cx; pip.r = 0; pip.lift = 0; pip.face = 1; hold(pip, 'sleep'); pip.alpha = 1;
    const pile = [Cx - 70, Cx + 70, Cx - 130, Cx + 300];
    others.forEach((a, i) => { a.cx = pile[i]; a.lift = 0; faceTo(a, Cx); hold(a, 'sleep'); a.eyes = ''; });
    yield* K.lensW({ z: 1.3, cx: Cx + 60, cy: FEET - 140 }, .01);
    const zz2 = emote('zzz', 8);
    yield* K.fadeIn(2.2);
    yield* wait(2);
    // she wakes up
    hold(pip, 'sit'); yield* wait(1); pip.face = -1; yield* wait(.8); pip.face = 1; emote('?', 2, pip); yield* wait(2.4);
    if (snoet) { hold(snoet, 'stand'); faceTo(snoet, pip.cx); yield* wait(.5); emote('hearts', 1.2, snoet); yield* petTo(snoet, pip.cx - 40, 80); snoet.face = 1;
      pip.face = -1; pip.sq = 1.1; emote('angry', 2, pip); yield* wait(.6); yield* petJump(snoet, 28, .45, snoet.cx - 90); emote('stars', 2.2, snoet); pip.sq = 1; }
    else { emote('angry', 2, pip); yield* wait(2); }
    stop(zz2); kam.eyes = 'blij'; kam.head = 0;
    others.forEach(a => { hold(a, a.pet === 'dobby' ? 'up' : 'sit'); emote('hearts', 2.5, a); }); emote('hearts', 3);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 2);
    // she walks off, tail up, and sits apart — like always
    yield* petTo(pip, 140, 50); pip.face = -1; hold(pip, 'sit'); emote('dots', 2, pip); yield* wait(2.5);
    // the little devil peeks in again, from the left… and walks right into Heidi
    const h = K.heidi(-1, { cx: -120 }); h.eyes = 'vies';
    imp.on = true; imp.x = -30; imp.y = FEET - 4; imp.run = true; imp.face = 1; imp.s = .9; imp.grin = true;
    yield* tween(2.4, p => { imp.x = lerp(-30, 90, p); });
    imp.run = false; yield* wait(.6);
    yield* par(K.actorTo(h, -10, 40), wait(1.6)); h.face = 1; h.lockPose = false;
    imp.face = -1; imp.grin = false; yield* wait(.8);
    yield* K.lensW({ z: 2.2, cx: 70, cy: FEET - 120 }, 1);
    imp.sweat = true; yield* wait(1.8);
    yield* tween(1.2, p => { h.sq = 1 + Math.sin(p * 30) * .015; });
    emote('dots', 2, h); yield* wait(1.5);
    imp.sweat = false; imp.run = true; imp.face = 1;
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .5);
    const iy = imp.x; const dust3 = K.particles('back', { emit: (ps) => { if (imp.on && rnd() < .7) ps.push(K.P({ x: imp.x, y: FEET - 2, vx: -60, vy: -20, life: .6 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(200,180,160,${.7 * (1 - k)})`; g.fillRect(Math.round(p.x), Math.round(p.y), 4, 4); } });
    yield* tween(1.4, p => { imp.x = lerp(iy, W + 80, p); imp.y = FEET - 4 - Math.abs(Math.sin(p * 20)) * 10; });
    imp.on = false; stop(dust3);
    others.forEach(a => emote('?', 1.5, a)); yield* wait(1.5);
    // Heidi sits down next to Pippa. Two who do not care.
    yield* K.actorTo(h, 270, 35); h.face = -1; h.eyes = 'vies';
    yield* K.lensW({ z: 1.5, cx: 200, cy: FEET - 140 }, 2);
    pip.face = 1; yield* wait(1.2); pip.face = -1; emote('dots', 2.5, pip); emote('dots', 2.5, h); yield* wait(3);
    yield* K.ending('EINDE');
  } };
  /* =====================================================================================================
     DE ANDEREN — at night someone far away copies Kamiel. Then dark copies of the pets turn up, one by one,
     and a Kamiel in a red overall who mirrors every move… until he doesn't. A chase, hiding behind a hedge,
     a standoff in the light of a street lamp, the sun. And at the end there is one Dobby too many.
     ===================================================================================================== */
  // a street lamp in the world (wx = world x), with its glass glowing over the darkness
  function streetLamp(K, wx) {
    const L = { wx, on: 1, buzz: 0 };
    L.sx = () => K.toScreen(L.wx);
    L.fx = K.fx('back', 0, (g) => { const x = L.sx(), y = K.FEET + 2, u = 4; if (x < -200 || x > K.W + 200) return;
      px(g, '#15151c', x - 5 * u, y - 3 * u, 10 * u, 3 * u); px(g, '#22222c', x - 3 * u, y - 6 * u, 6 * u, 3 * u);
      px(g, '#2a2a36', x - u, y - 66 * u, 2 * u, 60 * u); px(g, '#3a3a48', x - u, y - 66 * u, u, 60 * u);
      px(g, '#2a2a36', x - u, y - 67 * u, 9 * u, u); px(g, '#2a2a36', x + 7 * u, y - 66 * u, u, 2 * u);
      px(g, '#22222c', x + 3 * u, y - 64 * u, 10 * u, u); px(g, L.on ? '#ffe9a8' : '#4a4a40', x + 4 * u, y - 63 * u, 8 * u, 3 * u); px(g, '#22222c', x + 5 * u, y - 60 * u, 6 * u, u); });
    L.over = K.over((g, age, LP) => { if (!L.on) return; const x = L.sx(); if (x < -300 || x > K.W + 300) return; const z = K.lensNow.z, q = LP({ x: x + 32, y: K.FEET - 248 }), f = LP({ x: x + 32, y: K.FEET });
      glow(g, q.x, q.y, 60 * z, '255,230,160', .8);
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, q.y, 0, f.y); gr.addColorStop(0, 'rgba(255,230,160,.22)'); gr.addColorStop(1, 'rgba(255,230,160,.04)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(q.x - 14 * z, q.y); g.lineTo(q.x + 14 * z, q.y); g.lineTo(f.x + 150 * z, f.y); g.lineTo(f.x - 150 * z, f.y); g.closePath(); g.fill(); g.restore(); });
    L.light = K.light(() => L.on ? { x: L.sx() + 32, y: K.FEET - 90 } : null, 300, { col: '255,220,150', flicker: .04 });
    L.remove = () => { K.stop(L.fx); K.unover(L.over); K.unlight(L.light); };
    return L;
  }
  // a dark copy follows what another one does: mirrored around x = m, or only its gestures (stays where it is)
  function copier(K) {
    const links = [];
    const st = (a) => a === K.kam ? { cx: K.kx(), face: K.kam.face || -1, walk: K.kam.pose === 'walk', wt: K.kam.wt, head: K.kam.head, eyes: K.kam.eyes, mouth: K.kam.mouth, y: K.kam.y, sq: K.kam.sq, r: K.kam.r }
      : { cx: a.cx, face: a.face, walk: a.pose === 'walk', pose: a.pose, wt: a.wt, lift: a.lift, sq: a.sq, r: a.r, head: a.head, eyes: a.eyes, mouth: a.mouth, y: 0 };
    const f = K.fx('sky', 0, () => {
      for (const l of links) { if (!l.on) continue; const s = st(l.src), d = l.dst;
        if (l.m !== undefined) { d.cx = 2 * l.m - s.cx; d.face = l.keepFace ? d.face : -s.face; }
        d.lockPose = true; d.wt = s.wt; d.sq = s.sq; d.r = l.m !== undefined ? -(s.r || 0) : (s.r || 0);
        if (d.pet) { d.pose = s.pose === 'walk' && l.m === undefined ? 'stand' : (s.pose || 'stand'); d.lift = (s.lift || 0) * (l.k || 1); }
        else { d.pose = s.walk && l.m !== undefined ? 'walk' : 'stand'; d.head = s.head; if (!l.keepEyes) d.eyes = s.eyes; if (!l.keepMouth) d.mouth = s.mouth; d.feet = (l.feet || K.FEET) - s.y * (d.s || 1); }
      } });
    return { add: (src, dst, o) => { const l = Object.assign({ src, dst, on: true }, o || {}); links.push(l); return l; }, links, f };
  }

  F['film-dubbel'] = { run: function* (K) {
    const { W, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez } = K;
    const NIGHT = !!(K.A.night && K.A.night()), DK = (v) => NIGHT ? v * .45 : v * 1.2, GN = NIGHT ? .45 : .9;
    const names = K.castNames();
    const gang = names.map(n => K.pet(n, 1));
    const by = (n) => gang.find(a => a.pet === n);
    const faceTo = (a, x) => { a.face = x > a.cx ? 1 : -1; };
    filters(K);
    // the dark ones: same shape, almost black, white eyes
    const DARKF = 'brightness(.28) saturate(.4) contrast(1.3)';
    const shadow = (n) => { const a = K.pet(n, 1); a.f0 = DARKF; a.noLift = true; a.glowCol = '230,240,255'; a.glow = 0; a.alpha = 0; a.cx = W + 100; return a; };
    const darks = {}; names.forEach(n => { darks[n] = shadow(n); });
    // the other Kamiel: his face, his clothes, a red overall
    const O = (window.KamielOutfits || {}).OUTFITS || [];
    const own = (K.A.outfit ? K.A.outfit() : []) || [];
    const red = K.llama({ cx: W + 200, outfit: own.filter(id => { const o = O.find(q => q.id === id); return !o || o.slot !== 'lijf'; }).concat(['roodpak']), tint: 'tweeling', alpha: 0 });
    red.glowCol = '235,245,255'; red.glow = 0;
    const glows = eyeGlow(K, [red].concat(names.map(n => darks[n])));
    const cp = copier(K);
    const fog = fx('front', 0, (g) => { for (let k = 0; k < 5; k++) { const y = FEET - 50 + k * 14, x = ((K.t * (14 + k * 5) + k * 300) % (W + 600)) - 300;
      const gr = g.createRadialGradient(x, y, 10, x, y, 270); gr.addColorStop(0, 'rgba(200,210,225,.12)'); gr.addColorStop(1, 'rgba(200,210,225,0)'); g.fillStyle = gr; g.fillRect(x - 270, y - 70, 540, 140); } });

    // they walk home, late, in a line behind Kamiel
    kam.x = -40; kam.face = -1;
    gang.forEach((a, i) => { a.cx = K.kx() + 120 + i * 60; a.face = -1; });
    yield* K.opening('DE ANDEREN', 'EEN HORRORFILM MET KAMIEL', 'noir');
    K.grade('noir', GN, .01); K.setv('dark', DK(.35), .01); K.setv('vig', NIGHT ? .4 : .65, 2); K.setv('bars', .6, 3);
    const lantern = K.light(() => K.kp(300, 500), 300, { col: '220,210,190' });
    yield* K.journey(-1, 55, gang);
    // a street lamp: they rest under it
    const lamp = streetLamp(K, K.toWorld(250));
    yield* par(walkTo(320 - W / 2, 45), ...gang.map((a, i) => petTo(a, 440 + i * 62, K.PET[a.pet].run * .6)));
    K.unlight(lantern);
    kam.face = 1; gang.forEach((a, i) => { a.face = -1; hold(a, a.pet === 'dobby' ? 'lie' : 'sit'); });
    yield* wait(2);
    kam.face = -1; yield* wait(1.5); kam.face = 1;
    // far away, at the edge of the dark: a figure. It stands like Kamiel stands.
    red.s = .42; red.feet = FEET - 74; red.cx = 820; red.face = -1; red.tint = 'schim'; red.glow = 0; red.alpha = 0;
    const far = cp.add(kam, red, { feet: FEET - 74 }); far.keepEyes = true;
    yield* tween(3, p => { red.alpha = p * .9; });
    yield* wait(1);
    // Kamiel stretches. So does it.
    yield* tween(1.6, p => { kam.head = -Math.sin(p * Math.PI) * .35; });
    yield* hop(14, .35); yield* wait(1.2);
    const wifi = by('wifi'), snoet = by('snoet'), peb = by('pebbels'), dob = by('dobby'), pip = by('pippa');
    const barker = snoet || wifi || gang[0];
    if (barker) { hold(barker, 'stand'); barker.face = 1; emote('!', 1.2, barker); yield* wait(1); for (let k = 0; k < 3; k++) { emote('burst', .35, barker); yield* petJump(barker, 10, .25); } }
    kam.eyes = 'groot'; emote('?', 2); yield* wait(1.4);
    // the camera goes to look
    red.glow = .9;
    yield* K.lensW({ z: 2.6, cx: 820, cy: FEET - 140 }, 2.5);
    yield* wait(1.5);
    yield* K.lensW({ z: 1.8, cx: K.kx() + 40, cy: FEET - 160 }, .6);
    // a nod. It nods.
    yield* tween(1, p => { kam.head = Math.sin(p * Math.PI) * .3; }); yield* wait(.4);
    yield* K.lensW({ z: 2.6, cx: 820, cy: FEET - 140 }, .5); yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.2);
    // he looks at the others… and back: gone.
    kam.face = -1; kam.eyes = 'triest'; emote('sweat', 2); yield* wait(1.8);
    red.alpha = 0; red.glow = 0; far.on = false;
    kam.face = 1; kam.eyes = 'groot'; yield* wait(1.5); emote('?', 2); yield* wait(1.5);
    if (barker) hold(barker, 'sit');
    yield* shiver(1.4, 3);
    yield* K.fadeOut(1.8);
    yield* K.card('DEEL 2', 'ZE KOMEN DICHTERBIJ', 2.6, { size: 44 });

    /* ---------- part 2: the dark ones, one by one ---------- */
    kam.eyes = ''; kam.head = 0; kam.face = 1; kam.x = 320 - W / 2;
    gang.forEach((a, i) => { a.cx = 440 + i * 62; a.face = -1; hold(a, a.pet === 'dobby' ? 'lie' : 'sit'); a.eyes = ''; });
    yield* K.fadeIn(1.6);
    const lineUp = [];   // where the dark ones wait, at the edge of the light
    const edge = () => 700 + lineUp.length * 52;
    function* settle(d) { d.lockPose = false; lineUp.push(d); yield* petTo(d, edge() - 52, 40); d.face = -1; hold(d, d.pet === 'dobby' ? 'up' : 'sit'); }
    if (wifi) {   // Wifi plays with her ball; across the light, another Wifi plays with another ball
      const dw = darks.wifi, M = 620;
      const ball = { on: true, x: wifi.cx, y: FEET - 1 }, dball = { on: true, x: 0, y: FEET - 1 };
      K.ballFx(ball); const dbf = fx('front', 0, (g) => { if (!dball.on) return; dball.x = 2 * M - ball.x; dball.y = ball.y; g.fillStyle = '#16141a'; g.fillRect(dball.x - 5, dball.y - 10, 10, 10); g.fillStyle = '#2a2830'; g.fillRect(dball.x - 3, dball.y - 8, 3, 3); });
      hold(wifi, null); yield* petTo(wifi, 520, 70); wifi.face = 1; ball.x = 560;
      dw.alpha = .95; dw.glow = 1; const lk = cp.add(wifi, dw, { m: M });
      for (let k = 0; k < 3; k++) { hold(wifi, 'down'); yield* wait(.45); hold(wifi, null); yield* par(petJump(wifi, 18, .35), tween(.35, p => { ball.y = FEET - 1 - Math.sin(p * Math.PI) * 30; })); emote('burst', .4, wifi); }
      yield* wait(.6); wifi.eyes = 'groot'; yield* wait(1.4);
      // she stares. It stares.
      yield* K.lensW({ z: 2, cx: M, cy: FEET - 90 }, 1.2); yield* wait(1.5);
      emote('angry', 1.6, wifi); wifi.sq = 1.1; yield* wait(1.2); wifi.sq = 1;
      yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .8);
      lk.on = false; wifi.eyes = ''; hold(wifi, null); yield* par(petTo(wifi, K.kx() + 80, 160), (function* () { yield* wait(.6); dball.on = false; yield* settle(dw); })());
      wifi.face = 1; hold(wifi, 'down'); ball.on = false; stop(dbf);
    }
    if (peb) {   // Pebbels washes her face. Behind her, two white eyes open.
      const dp = darks.pebbels; hold(peb, 'sit'); peb.face = -1; dp.alpha = .95; dp.cx = peb.cx + 90; dp.face = -1; hold(dp, 'sit');
      yield* tween(3, p => { peb.sq = 1 + Math.sin(p * 20) * .02; dp.glow = p > .5 ? 1 : 0; });
      yield* K.lensW({ z: 2.2, cx: peb.cx + 45, cy: FEET - 80 }, 1.4); yield* wait(1);
      peb.face = 1; yield* wait(.5); peb.eyes = 'groot'; emote('!', 1.2, peb);
      const lk = cp.add(peb, dp, { m: peb.cx + 45 });
      yield* petJump(peb, 50, .45); yield* wait(.5);
      yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .8);
      lk.on = false; peb.eyes = ''; yield* par(petTo(peb, K.kx() - 80, 120), settle(dp)); peb.face = 1; hold(peb, 'down');
    }
    if (dob) {   // Dobby thumps. Out of the dark, a thump answers.
      hold(dob, 'down'); dob.sq = .8; K.lens({ shake: 3 }, 0); yield* wait(.2); dob.sq = 1; K.lens({ shake: 0 }, .3); emote('!', 1, dob); yield* wait(1.4);
      K.lens({ shake: 3 }, 0); yield* wait(.2); K.lens({ shake: 0 }, .3);
      dob.eyes = 'groot'; emote('!?', 1.6, dob); yield* wait(1);
      const dd = darks.dobby; dd.alpha = .95; dd.glow = 1; dd.cx = W + 40;
      yield* petTo(dd, edge() + 60, 50); dd.face = -1; hold(dd, 'up'); hold(dob, 'up'); yield* wait(1.2);
      dd.sq = .8; hold(dd, 'down'); K.lens({ shake: 4 }, 0); yield* wait(.2); dd.sq = 1; K.lens({ shake: 0 }, .3); hold(dd, 'up');
      hold(dob, null); dob.eyes = ''; yield* par(petTo(dob, K.kx() - 120, 100), settle(dd)); dob.face = 1; hold(dob, 'lie');
    }
    if (snoet) {   // Snoet spins like a tornado. On the other side of the light, someone spins back.
      const ds = darks.snoet, M = 600; ds.alpha = .95; ds.glow = 1;
      hold(snoet, null); yield* petTo(snoet, 470, 120);
      const lk = cp.add(snoet, ds, { m: M });
      yield* tween(3, p => { snoet.cx = 470 + Math.sin(p * Math.PI * 6) * 40; snoet.face = Math.cos(p * Math.PI * 6) > 0 ? 1 : -1; hold(snoet, 'walk'); });
      hold(snoet, 'stand'); snoet.face = 1; yield* wait(.6); snoet.eyes = 'groot'; emote('!', 1, snoet); yield* wait(1);
      lk.on = false; snoet.eyes = ''; yield* par(petTo(snoet, K.kx() + 130, 200), settle(ds)); snoet.face = 1; hold(snoet, 'sit');
    }
    if (pip) {   // Pippa hisses at the dark. The dark hisses back.
      const dq = darks.pippa; dq.alpha = .95; dq.glow = 1; dq.cx = W + 60;
      hold(pip, 'stand'); pip.face = 1; yield* petTo(dq, edge() + 40, 50); dq.face = -1;
      pip.sq = 1.1; emote('angry', 1.4, pip); yield* wait(.8); dq.sq = 1.1; K.lens({ shake: 2 }, 0); yield* wait(.8); K.lens({ shake: 0 }, .3); pip.sq = 1; dq.sq = 1;
      pip.eyes = 'groot'; yield* par(petTo(pip, K.kx() + 60, 90), settle(dq)); pip.face = 1; hold(pip, 'down'); pip.eyes = '';
    }
    if (!gang.length) { yield* wait(3); }
    // all of them, there at the edge, looking in
    yield* K.lensW({ z: 1.5, cx: 780, cy: FEET - 110 }, 2.5); yield* wait(2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.5);
    gang.forEach(a => { a.eyes = 'groot'; }); kam.eyes = 'groot'; emote('sweat', 3); yield* wait(2);
    // the lamp flickers… and in the light stands someone in a red overall
    for (let k = 0; k < 4; k++) { lamp.on = 0; yield* wait(.08 + rnd() * .2); lamp.on = 1; yield* wait(.1 + rnd() * .3); }
    lamp.on = 0; yield* wait(1);
    red.alpha = 1; red.s = 1; red.feet = FEET; red.tint = 'tweeling'; red.cx = 640; red.face = -1; red.head = .3; red.lockPose = true; red.pose = 'stand'; red.glow = 0; red.eyes = '';
    lamp.on = 1; K.flash(.5, '255,240,220', 2);
    kam.eyes = 'x'; emote('!', 1.5); yield* hop(30, .4); kam.eyes = 'groot';
    yield* wait(1.5);
    yield* tween(2.5, p => { red.head = .3 * (1 - p); });
    red.glow = 1; yield* wait(.6);
    yield* K.lensW({ z: 2.4, cx: 640, cy: FEET - 170 }, 3.5);
    yield* wait(1.5);
    yield* K.fadeOut(1.8);
    yield* K.card('DEEL 3', 'HET SPIEGELBEELD', 2.6, { size: 44 });

    /* ---------- part 3: the mirror ---------- */
    const M = W / 2 + 40;
    kam.x = M - 170 - W / 2; kam.face = 1; kam.eyes = ''; kam.head = 0;
    red.glow = 0; red.eyes = ''; red.head = 0; red.lockPose = true;
    const mir = cp.add(kam, red, { m: M });
    gang.forEach((a, i) => { a.cx = 60 + i * 50; a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.eyes = ''; });
    lineUp.forEach((d, i) => { d.cx = W - 60 - i * 50; d.face = -1; hold(d, d.pet === 'dobby' ? 'up' : 'sit'); d.glow = 1; });
    lamp.on = 0; const lampsOff = lamp.light; lamp.light.off = true;
    const sp1 = K.light(() => ({ x: K.kx(), y: FEET - 120 }), 220, { col: '200,210,255' });
    const sp2 = K.light(() => ({ x: red.cx, y: FEET - 120 }), 220, { col: '255,200,200' });
    K.setv('dark', DK(.5), .01);
    yield* K.fadeIn(1.6);
    yield* wait(1.5);
    // a step forward…
    yield* walkTo(M - 110 - W / 2, 30); kam.face = 1; yield* wait(1.2);
    // the head down… up…
    yield* tween(1.2, p => { kam.head = ez(p) * .3; }); yield* wait(.5); yield* tween(1.2, p => { kam.head = .3 - ez(p) * .55; }); yield* wait(.6); yield* tween(.6, p => { kam.head = -.25 * (1 - p); });
    // close: him… and him
    kam.eyes = 'boos';
    yield* K.lensW({ z: 2.6, cx: K.kx() - 10, cy: FEET - 170 }, .01); yield* wait(1.6);
    yield* K.lensW({ z: 2.6, cx: red.cx + 10, cy: FEET - 170 }, .01); yield* wait(1.6);
    yield* K.lensW({ z: 1.3, cx: M, cy: FEET - 150 }, .01);
    // a quick trick: back, forward, a hop
    yield* walkTo(M - 200 - W / 2, 140); kam.face = 1; yield* wait(.3);
    yield* walkTo(M - 120 - W / 2, 140); kam.face = 1; yield* hop(30, .35); yield* wait(.5);
    kam.mouth = .6; yield* wait(.8); kam.mouth = 0; yield* wait(.6);
    gang.forEach(a => emote('?', 1.5, a)); yield* wait(1.5);
    // he turns his back. Then slowly round again…
    kam.eyes = ''; kam.face = -1; yield* wait(.5);
    mir.keepFace = true; mir.keepEyes = true; mir.keepMouth = true; red.face = -1;
    yield* wait(2.5);
    yield* tween(2, p => { red.r = p * .14; red.mouth = p * .25; });
    red.glow = 1; red.eyes = 'groot';
    kam.face = 1; yield* wait(.25);
    K.flash(.8, '255,255,255', 2); K.lens({ shake: 5 }, 0);
    kam.eyes = 'x'; mir.on = false; emote('!', 1.5);
    yield* par(hop(60, .45), ...gang.map(a => { a.eyes = 'groot'; return petJump(a, 40 + rnd() * 30, .45); }));
    K.lens({ shake: 0 }, .4);
    // and the dark ones all take one step. Together.
    for (let k = 0; k < 3; k++) {
      lineUp.forEach(d => { d.lockPose = false; hold(d, 'walk'); }); red.pose = 'walk';
      yield* tween(.6, p => { lineUp.forEach(d => { d.cx -= 40 * K.dt / .6; }); red.cx -= 30 * K.dt / .6; red.wt += 4 * K.dt; });
      lineUp.forEach(d => hold(d, 'stand')); red.pose = 'stand'; yield* wait(.7);
    }
    kam.eyes = 'groot'; kam.face = -1; yield* wait(.4);
    yield* K.fadeOut(1);
    yield* K.card('DEEL 4', 'RENNEN', 2, { size: 44 });

    /* ---------- part 4: the chase ---------- */
    K.unlight(sp1); K.unlight(sp2); lamp.remove(); K.setv('dark', DK(.4), .01);
    red.r = 0; red.mouth = 0; red.eyes = ''; red.lockPose = false; red.layer = 'back';
    kam.x = -60; kam.face = -1; kam.eyes = 'groot';
    gang.forEach((a, i) => { a.cx = K.kx() + 80 + i * 45; a.face = -1; a.eyes = ''; hold(a, null); });
    const chasers = [red].concat(lineUp);
    chasers.forEach((d, i) => { d.cx = W + 120 + i * 60; d.face = -1; d.glow = 1; d.alpha = d === red ? 1 : .95; });
    const run = K.light(() => K.kp(300, 500), 280, { col: '210,210,230' });
    yield* K.fadeIn(.8);
    K.grade('horror', GN, 1);
    const gain = (to, secs) => tween(secs, p => { chasers.forEach((d, i) => { d.cx = lerp(d.cx, to + i * 55, K.dt * 1.2); if (d.pet) { d.pose = 'walk'; d.lockPose = true; d.wt += 9 * K.dt; } else { d.pose = 'walk'; d.wt += 7 * K.dt; } }); });
    yield* par(K.journey(-1, 170, gang), gain(W - 160, 5));
    // a look back: they are there, all of them, and they stop when he looks
    kam.face = 1; chasers.forEach(d => { d.pose = 'stand'; if (d.pet) hold(d, 'stand'); }); yield* wait(.5);
    yield* K.lensW({ z: 1.7, cx: W - 150, cy: FEET - 140 }, .4); yield* wait(1.4);
    yield* tween(.8, p => { chasers.forEach(d => { d.r = Math.sin(p * Math.PI) * .12 * (d.pet ? 1 : .6); }); });
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .4);
    kam.face = -1; emote('sweat', 2);
    yield* par(K.journey(-1, 190, gang), gain(W - 120, 4), (function* () { K.lens({ shake: 2 }, 0); yield* wait(4); K.lens({ shake: 0 }, .5); })());
    // a hedge: everybody behind it, quick
    const hedge = { wx: K.toWorld(330) };
    const hedgeFx = fx('front', 0, (g) => { const x = K.toScreen(hedge.wx), y = FEET + 8, u = 6;
      for (let k = 0; k < 64; k++) { const hx = x - 170 + (k * 37) % 340, hy = y - 30 - ((k * 53) % 120) - Math.abs(Math.sin(k)) * 20; if (hy < y - 150 + Math.abs(hx - x) * .25) continue;
        g.fillStyle = k % 3 ? '#1d2c1e' : '#26382a'; g.fillRect(Math.round(hx / u) * u, Math.round(hy / u) * u, u * 4, u * 3); }
      g.fillStyle = '#1a281c'; g.fillRect(x - 170, y - 70, 340, 70); for (let k = 0; k < 12; k++) { g.fillStyle = '#2c4430'; g.fillRect(x - 160 + k * 28, y - 120 + ((k * 31) % 50), 6, 6); } });
    chasers.forEach(d => { d.alpha = 0; });
    yield* par(walkTo(330 - W / 2, 120), ...gang.map((a, i) => petTo(a, 230 + i * 50, 200)));
    kam.face = 1; gang.forEach(a => { a.face = 1; hold(a, 'down'); });
    yield* tween(.4, p => { kam.sq = 1 - p * .3; });
    yield* wait(1.2);
    // they come by, slowly, further back
    chasers.forEach((d, i) => { d.alpha = d === red ? 1 : .95; d.feet = FEET - 50; d.s = d.pet ? K.PET[d.pet].s * .8 : .8; d.cx = W + 80 + i * 70; d.face = -1; d.r = 0; });
    let stopAt = null;
    yield* tween(9, p => { chasers.forEach((d, i) => { if (stopAt && d === red) return; d.cx -= 45 * K.dt; d.pose = 'walk'; d.wt += (d.pet ? 8 : 5) * K.dt; if (d.pet) d.lockPose = true; });
      if (!stopAt && red.cx < K.kx() + 40) { stopAt = K.t; red.pose = 'stand'; } });
    red.pose = 'stand'; red.face = 1;   // it stops, right behind the hedge, and turns
    emote('sweat', 3); yield* wait(1.5);
    if (dob) { dob.sq = .8; K.lens({ shake: 3 }, 0); yield* wait(.2); dob.sq = 1; K.lens({ shake: 0 }, .3); }   // Dobby can't help it: thump
    else { yield* wait(.5); }
    red.glow = 1.6; yield* K.lensW({ z: 2, cx: red.cx, cy: FEET - 180 }, .5); yield* wait(1.2);
    yield* tween(1.5, p => { red.feet = lerp(FEET - 50, FEET - 10, p); red.s = lerp(.8, .95, p); });
    // Snoet can't stand it: he jumps out barking — run!
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .3);
    const brave = snoet || wifi || null;
    if (brave) { hold(brave, null); emote('burst', .4, brave); yield* petJump(brave, 50, .4, brave.cx + 40); emote('burst', .4, brave); }
    kam.sq = 1; kam.eyes = 'x'; emote('!', 1.2); yield* wait(.4); kam.eyes = 'groot';
    gang.forEach(a => hold(a, null));
    chasers.forEach((d, i) => { d.feet = FEET; d.s = d.pet ? K.PET[d.pet].s : 1; d.cx = -140 - i * 60; d.face = 1; });
    yield* par(K.journey(1, 190, gang), gain(160, 5));
    stop(hedgeFx);
    yield* K.fadeOut(1.4);
    yield* K.card('DEEL 5', 'DE KRING VAN LICHT', 2.6, { size: 44 });

    /* ---------- part 5: the circle of light ---------- */
    K.unlight(run);
    const lamp2 = streetLamp(K, K.toWorld(W / 2 - 32)); lamp2.light.r = 240;
    kam.x = 0; kam.face = -1; kam.eyes = 'groot'; kam.sq = 1;
    gang.forEach((a, i) => { a.cx = W / 2 + (i % 2 ? 1 : -1) * (80 + Math.floor(i / 2) * 45); a.face = a.cx < W / 2 ? -1 : 1; hold(a, 'stand'); a.eyes = ''; });
    // they stand around the light, the ring closes
    const ring = chasers.map((d, i) => ({ d, side: i % 2 ? 1 : -1, dist: 330 + (i % 3) * 30 }));
    const place = () => ring.forEach(r => { r.d.cx = W / 2 + r.side * r.dist; r.d.face = -r.side; r.d.lockPose = true; r.d.pose = 'stand'; r.d.glow = 1; });
    place(); red.alpha = 1;
    K.setv('dark', DK(.55), .01); K.grade('noir', GN, .01);
    yield* K.fadeIn(1.6);
    yield* wait(1.5);
    gang.forEach(a => emote('sweat', 2, a)); yield* shiver(1.5, 2);
    for (let k = 0; k < 3; k++) {
      yield* wait(1.5);
      // the lamp buzzes and goes out: when it comes back, they are closer
      for (let j = 0; j < 3; j++) { lamp2.on = 0; yield* wait(.07); lamp2.on = 1; yield* wait(.12); }
      lamp2.on = 0; yield* wait(.8);
      ring.forEach(r => { r.dist -= 60 + k * 10; }); place();
      lamp2.on = 1; K.lens({ shake: 2 }, 0); yield* wait(.2); K.lens({ shake: 0 }, .3);
      kam.face = -kam.face; gang.forEach(a => { a.eyes = 'groot'; }); yield* wait(1.2); gang.forEach(a => { a.eyes = ''; });
      if (k === 1) { yield* K.lensW({ z: 1.8, cx: W / 2, cy: FEET - 150 }, 2); }
    }
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1);
    // all together, backs against each other
    gang.forEach(a => hold(a, 'down')); yield* wait(1);
    // the lamp dies. Only the eyes.
    lamp2.on = 0; K.setv('dark', NIGHT ? .7 : .85, .3); yield* wait(2.4);
    ring.forEach(r => { r.dist -= 50; }); place(); yield* wait(1.6);
    // and then: the sun
    const sunL = K.light(() => ({ x: -100, y: 200 }), 900, { col: '255,200,120' });
    K.flash(.8, '255,210,150', .8);
    K.grade('warm', .7, 3); K.setv('dark', 0, 4); K.setv('vig', .3, 4);
    yield* tween(3.5, p => { red.dissolve = p; chasers.forEach(d => { if (d.pet) d.alpha = .95 * (1 - p); d.glow = 1 - p; }); });
    chasers.forEach(d => { d.alpha = 0; d.glow = 0; }); red.dissolve = 0;
    K.unlight(sunL); lamp2.remove(); stop(fog);
    gang.forEach(a => { hold(a, 'sit'); a.eyes = ''; }); kam.eyes = 'dicht'; yield* wait(1.5);
    kam.eyes = 'blij'; emote('hearts', 3); gang.forEach(a => emote('hearts', 2.5, a)); yield* wait(3);
    yield* K.fadeOut(1.6);

    /* ---------- the end… or is it? ---------- */
    K.grade('warm', .6, .01); K.setv('dark', 0, .01);
    kam.x = 120; kam.face = -1; kam.eyes = '';
    gang.forEach((a, i) => { a.cx = K.kx() + 110 + i * 60; a.face = -1; hold(a, null); });
    const twinSrc = dob || gang[gang.length - 1];
    let twin = null;
    if (twinSrc) { twin = K.pet(twinSrc.pet, 1); twin.cx = K.kx() + 110 + gang.length * 60 + 20; twin.face = -1; twin.glowCol = '235,245,255'; twin.glow = 0; }
    const glow2 = eyeGlow(K, twin ? [twin, kam] : [kam]);
    yield* K.fadeIn(1.4);
    // they go home, all in a row, in the morning sun
    const walkers = gang.concat(twin ? [twin] : []);
    walkers.forEach(a => { hold(a, 'walk'); a.face = -1; });
    kam.pose = 'walk'; kam.face = -1; kam.rate = 5;
    yield* tween(9, p => { kam.x -= 40 * K.dt; walkers.forEach(a => { a.cx -= 40 * K.dt; }); });
    if (twin) {   // one stays behind. It turns. It looks at you.
      hold(twin, 'stand'); yield* tween(7, p => { kam.x -= 40 * K.dt; gang.forEach(a => { a.cx -= 40 * K.dt; }); });
      kam.pose = ''; gang.forEach(a => hold(a, 'stand'));
      yield* wait(1); twin.face = 1; yield* wait(1);
      yield* K.lensW({ z: 2.8, cx: twin.cx, cy: FEET - 60 }, 3);
      twin.glow = 1; yield* wait(.25); twin.glow = 0; yield* wait(.4); twin.glow = 1; yield* wait(1.4);
      hold(twin, null); twin.face = -1; twin.glow = 0;
    } else {
      kam.pose = ''; kam.face = 1; yield* K.lensW({ z: 2.6, cx: K.kx(), cy: FEET - 170 }, 3); kam.glowCol = '235,245,255'; kam.glow = 1; yield* wait(.3); kam.glow = 0; yield* wait(1);
    }
    yield* K.ending('EINDE');
  } };
})();
