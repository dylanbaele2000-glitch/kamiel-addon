/* Kamiel films, part 5: see "cinema" in events.js for the building blocks (K). */
(function () {
  const F = window.KamielFilms = window.KamielFilms || {};

  /* ---------- shared pixel-art helpers for the films in this file ---------- */
  function kit(K) {
    const { W, H, rnd } = K;
    const R = (g, x, y, w, h, c) => { if (c) g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    // a sky in flat bands with a dithered seam between them
    function bands(g, cols, y0, y1) {
      const n = cols.length, hh = (y1 - y0) / n;
      for (let i = 0; i < n; i++) {
        const y = Math.round(y0 + i * hh); R(g, 0, y, W, Math.ceil(hh) + 1, cols[i]);
        if (i < n - 1) { g.fillStyle = cols[i + 1]; const yy = Math.round(y0 + (i + 1) * hh) - 4; for (let x = (i % 2) * 4; x < W; x += 8) g.fillRect(x, yy, 4, 4); }
      }
    }
    const bandAt = (cols, y0, y1, y) => cols[Math.max(0, Math.min(cols.length - 1, Math.floor((y - y0) / ((y1 - y0) / cols.length))))];
    // a round thing made of square pixels
    function disc(g, cx, cy, r, u, col) {
      g.fillStyle = col;
      for (let dy = -r; dy < r; dy += u) { if (cy + dy < -u || cy + dy > H) continue; const yy = dy + u / 2, hw = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) / u) * u; if (hw > 0) g.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2, u); }
    }
    // a mountain ridge in steps
    function ridge(g, seed, base, amp, col, step, bottom) {
      g.fillStyle = col;
      for (let x = 0; x < W; x += step) {
        const h = amp * (.55 + .3 * Math.sin(x * .006 + seed) + .18 * Math.sin(x * .021 + seed * 3) + .07 * Math.sin(x * .053 + seed * 5));
        const hq = Math.round(h / step) * step; g.fillRect(x, base - hq, step, (bottom || H) - base + hq);
      }
    }
    function cloud(g, x, y, u, n, col, shade) {
      for (let k = 0; k < n; k++) { const h = Math.round(1 + 2.5 * Math.sin((k + .5) / n * Math.PI) + hash(k * 7 + n) * 1.6); R(g, x + k * u, y - h * u, u, h * u, col); }
      if (shade) R(g, x + u, y, (n - 2) * u, u, shade);
    }
    function stars(g, n, seed, y1, k) {
      for (let i = 0; i < n; i++) {
        const x = hash(i + seed) * W, y = 30 + hash(i * 3 + seed) * (y1 - 30), s = hash(i * 7 + seed) < .15 ? 4 : 2, tw = .5 + .5 * Math.sin(K.t * (1 + hash(i) * 3) + i);
        g.fillStyle = `rgba(255,250,230,${(.35 + .65 * tw) * (k === undefined ? 1 : k)})`; g.fillRect(Math.round(x), Math.round(y), s, s);
        if (s === 4 && tw > .8) { g.fillRect(Math.round(x) - 4, Math.round(y) + 1, 12, 2); g.fillRect(Math.round(x) + 1, Math.round(y) - 4, 2, 12); }
      }
    }
    // dust, smoke, splashes: chunky squares flying out and fading
    function puff(x, y, n, col, sz, o) {
      o = o || {}; let done = false;
      return K.particles(o.layer || 'front', { dur: o.dur || 1.8, emit: (ps) => { if (done) return; done = true;
        for (let k = 0; k < (n || 10); k++) { const a = o.up ? -Math.PI / 2 + (rnd() - .5) * 1.6 : rnd() * Math.PI * 2, v = (o.v || 60) + rnd() * (o.v || 60) * 1.4;
          ps.push(K.P({ x: x + (rnd() - .5) * (o.w || 10), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - (o.rise || 20), grav: o.grav || 0, life: .6 + rnd() * .8, sz: (sz || 10) * (.6 + rnd() * .8) })); } },
        draw: (g, p, k) => { const s = Math.max(2, Math.round(p.sz * (o.grow === false ? 1 : 1 + k) / 3) * 3); g.fillStyle = `rgba(${col || '225,210,185'},${(o.a || .85) * (1 - k)})`;
          g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); p.vx *= .965; p.vy *= .965; } });
    }
    const burst = (x, y, u) => K.fx('screen', .45, (g, age) => { K.sprC(g, K.SP.burst, x, y, (u || 5) * (1 + age * 3)); });
    // speed lines streaming across the picture
    function speed(dir, dur, col) {
      return K.fx('screen', dur || 0, (g) => {
        g.fillStyle = col || 'rgba(255,255,255,.5)';
        for (let i = 0; i < 18; i++) { const y = 80 + hash(i) * (H - 160), len = 60 + hash(i + 9) * 160, sp = 1300 + hash(i + 4) * 900, x = ((K.t * sp + hash(i + 2) * 2000) % (W + 400)) - 200;
          g.fillRect(Math.round(dir > 0 ? x : W - x - len), Math.round(y), Math.round(len), 3); }
      });
    }
    // dramatic focus lines from the edges (drawn over everything)
    function focus() {
      return K.over((g) => {
        const f = Math.floor(K.t * 12); g.fillStyle = 'rgba(8,4,16,.6)';
        for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2 + (hash(i + f) - .5) * .06, r0 = 260 + hash(i * 3 + f) * 110;
          g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * .62); g.lineTo(W / 2 + Math.cos(a - .03) * 900, H / 2 + Math.sin(a - .03) * 900); g.lineTo(W / 2 + Math.cos(a + .03) * 900, H / 2 + Math.sin(a + .03) * 900); g.closePath(); g.fill(); }
      });
    }
    // big pixel digits (for the countdown)
    const DIG = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'],
      5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };
    function digits(g, str, cx, cy, u, col, sh) {
      const s = String(str), w = s.length * 4 * u - u, x0 = Math.round(cx - w / 2), y0 = Math.round(cy - 2.5 * u);
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < s.length; i++) { const d = DIG[s[i]]; if (!d) continue;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (d[r][c] === '1') R(g, x0 + i * 4 * u + c * u + (pass ? 0 : u * .5), y0 + r * u + (pass ? 0 : u * .5), u, u, pass ? col : (sh || 'rgba(0,0,0,.6)')); }
    }
    function petals(amount) {
      return K.particles('screen', { emit: (ps) => { if (rnd() < amount) ps.push(K.P({ x: rnd() * W * 1.3, y: -10, vx: -40 - rnd() * 40, vy: 40 + rnd() * 30, life: 15, ph: rnd() * 6, sz: 3 + rnd() * 3 })); },
        draw: (g, p) => { const w = Math.sin(K.t * 3 + p.ph); g.fillStyle = w > 0 ? '#ffc6dc' : '#ff8fb8'; g.fillRect(Math.round(p.x + w * 12), Math.round(p.y), Math.round(p.sz * (1 + Math.abs(w) * .7)), Math.round(p.sz)); } });
    }
    // a pagoda with curling roofs; sil = one colour for a far silhouette
    function pagoda(g, x, base, u, sil, floors) {
      const c = (col) => sil || col; floors = floors || 3;
      R(g, x - 20 * u, base - 3 * u, 40 * u, 3 * u, c('#8a8478')); R(g, x - 18 * u, base - 4 * u, 36 * u, u, c('#a39d90'));
      let y = base - 4 * u;
      for (let f = 0; f < floors; f++) {
        const w = (24 - f * 5) * u, hh = (f ? 7 : 10) * u;
        R(g, x - w / 2, y - hh, w, hh, c('#d8c79c'));
        if (!sil) { for (let k = 1; k < w / u / 4; k++) R(g, x - w / 2 + k * 4 * u - u, y - hh + 2 * u, 2 * u, hh - 4 * u, f ? '#5a3a2a' : '#3a2620');
          R(g, x - w / 2, y - hh, u, hh, '#8e2a20'); R(g, x + w / 2 - u, y - hh, u, hh, '#8e2a20'); R(g, x - w / 2, y - u, w, u, '#8e2a20');
          if (!f) R(g, x - 3 * u, y - 7 * u, 6 * u, 7 * u, '#2a1a14'); }
        y -= hh;
        const rw = w + 10 * u;
        R(g, x - rw / 2, y - 2 * u, rw, 2 * u, c('#3a3448')); R(g, x - rw / 2 - 2 * u, y - 3 * u, 3 * u, 2 * u, c('#3a3448')); R(g, x + rw / 2 - u, y - 3 * u, 3 * u, 2 * u, c('#3a3448'));
        R(g, x - rw / 2 - 3 * u, y - 4 * u, 2 * u, u, c('#3a3448')); R(g, x + rw / 2 + u, y - 4 * u, 2 * u, u, c('#3a3448'));
        R(g, x - rw / 2 + 2 * u, y - 4 * u, rw - 4 * u, 2 * u, c('#56506a')); R(g, x - rw / 2 + 5 * u, y - 6 * u, rw - 10 * u, 2 * u, c('#3a3448'));
        if (!sil) R(g, x - rw / 2 + 2 * u, y - 4 * u, rw - 4 * u, u * .5, '#6e6888');
        y -= 6 * u;
      }
      R(g, x - u / 2, y - 9 * u, u, 9 * u, c('#e0b040')); for (let k = 0; k < 3; k++) R(g, x - 1.5 * u, y - (2 + k * 2.5) * u, 3 * u, u, c('#e0b040'));
      return y - 9 * u;   // the top of the spire
    }
    // a blossom tree
    function tree(g, x, base, u, col, col2) {
      R(g, x - 2 * u, base - 30 * u, 4 * u, 30 * u, '#4a3026'); R(g, x - 3 * u, base - 4 * u, 6 * u, 4 * u, '#4a3026');
      R(g, x - 10 * u, base - 30 * u, 9 * u, 2 * u, '#4a3026'); R(g, x + 2 * u, base - 26 * u, 10 * u, 2 * u, '#4a3026'); R(g, x - 12 * u, base - 34 * u, 3 * u, 5 * u, '#4a3026');
      for (let i = 0; i < 70; i++) { const a = hash(i) * Math.PI * 2, rr = Math.sqrt(hash(i + 31)) * 17 * u, bx = x + Math.cos(a) * rr * 1.3, by = base - 36 * u + Math.sin(a) * rr * .7;
        R(g, Math.round(bx / u) * u, Math.round(by / u) * u, 3 * u, 3 * u, hash(i + 5) < .3 ? (col2 || '#ffd6e6') : hash(i + 6) < .5 ? (col || '#ff9ec4') : '#f07aa8'); }
    }
    // a stone lantern (lit or not)
    function lantern(g, x, base, u, lit) {
      R(g, x - 5 * u, base - 2 * u, 10 * u, 2 * u, '#7a766c'); R(g, x - 1.5 * u, base - 12 * u, 3 * u, 10 * u, '#8e897e');
      R(g, x - 4 * u, base - 13 * u, 8 * u, u, '#7a766c'); R(g, x - 3 * u, base - 18 * u, 6 * u, 5 * u, '#8e897e');
      R(g, x - 2 * u, base - 17 * u, 4 * u, 3 * u, lit ? (Math.sin(K.t * 9) > -.6 ? '#ffd27a' : '#ffbb55') : '#3a362e');
      R(g, x - 6 * u, base - 20 * u, 12 * u, 2 * u, '#6a665c'); R(g, x - 4 * u, base - 21 * u, 8 * u, u, '#6a665c'); R(g, x - u, base - 23 * u, 2 * u, 2 * u, '#6a665c');
    }
    const SKY = {
      dawn: { c: ['#2b2a5c', '#4b3a78', '#7a4a86', '#b85c7c', '#e8846a', '#f7b267', '#fcd48a'], m: ['#a56f8c', '#704a72', '#40304f'], sun: '#ffeaa8', cl: '#ffc9b0' },
      day: { c: ['#4f93de', '#5fa2e4', '#72b1ea', '#88c0ee', '#a0cff2', '#badcf2', '#d4e8ee'], m: ['#a4bedb', '#7998bb', '#527394'], sun: '#fff6d0', cl: '#ffffff' },
      dusk: { c: ['#1d1640', '#3a1f5c', '#6b2a6a', '#a53a5e', '#d9534f', '#f08a4b', '#f7b55a'], m: ['#8a3a5e', '#5a2448', '#2e1530'], sun: '#ffd06a', cl: '#ff9f80' },
      night: { c: ['#060918', '#0a0f28', '#0f1838', '#152246', '#1c2c54', '#243762', '#2c4270'], m: ['#2c3870', '#1d2756', '#121a40'], sun: '#f2f0e0', cl: '#3a4878' },
    };
    return { SKY, R, hash, bands, bandAt, disc, ridge, cloud, stars, puff, burst, speed, focus, digits, petals, pagoda, tree, lantern };
  }

  /* =====================================================================================
     DE WEG VAN DE NINJA — one of the housemates comes to the mountain dojo to learn from master Kamiel.
     Training (and failing), a red headband, shadow ninjas in three waves, a duel on a roof at sunset,
     and a black belt under the blossom. About 7 minutes.
     ===================================================================================== */
  F['film-ninja'] = { can: (K) => K.castNames().length > 0, run: function* (K) {
    const { W, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez } = K;
    const names = K.castNames(); if (!names.length) return;
    const T = kit(K), R = T.R, hash = T.hash;
    const want = K.A.params ? K.A.params.get('held') : ''; 
    const hn = names.indexOf(want) >= 0 ? want : K.pick(names);
    const NAME = K.NAMES[hn].toUpperCase();
    const others = names.filter(n => n !== hn);
    const isCatPaw = (n) => n === 'pippa' || n === 'pebbels';
    const sitOf = (a) => a.pet === 'dobby' ? 'up' : 'sit';
    const restOf = (a) => a.pet === 'dobby' ? 'lie' : 'sit';
    const eyeOf = (a) => a.pet ? K.A.petPoint(a, 'eye') : K.A.llamaPoint(a, 227, 291);
    const headOf = (a) => a.pet ? K.A.petPoint(a, 'head') : K.A.llamaPoint(a, 230, 160);

    /* ---------- the decors ---------- */
    const SKY = T.SKY;
    const D = { sky: 'dawn', sunX: 700, sunY: 430, pole: 0, poleX: 600, poleTop: FEET - 150, pole2X: 360, pole2Top: FEET - 110, wall: 0, wallX: 790, wallTop: 236,
      plank: 0, plankX: 600, broke: 0, lit: 0, eyes: 0, wf: 0, bossTop: 0 };
    const plankY = FEET - 58;
    function skyAndHills(g, s, horizon) {
      const P = SKY[s];
      T.bands(g, P.c, 0, horizon);
      if (s === 'night') { T.stars(g, 90, 3, horizon - 60); T.disc(g, D.sunX, D.sunY, 64, 8, 'rgba(242,240,224,.12)'); T.disc(g, D.sunX, D.sunY, 46, 4, P.sun);
        R(g, D.sunX - 16, D.sunY - 12, 12, 12, '#d6d2bc'); R(g, D.sunX + 10, D.sunY + 10, 8, 8, '#d6d2bc'); R(g, D.sunX - 4, D.sunY + 18, 4, 4, '#d6d2bc'); }
      else { g.globalAlpha = .18; T.disc(g, D.sunX, D.sunY, 120, 6, P.sun); g.globalAlpha = .35; T.disc(g, D.sunX, D.sunY, 86, 6, P.sun); g.globalAlpha = 1; T.disc(g, D.sunX, D.sunY, 58, 6, P.sun); }
      for (let k = 0; k < 4; k++) { const x = ((K.t * (4 + k * 2.5) + hash(k + 20) * 1400) % (W + 400)) - 200; T.cloud(g, x, 100 + [0, 70, 30, 110][k], 6, 10 + Math.round(hash(k + 30) * 12), P.cl, 'rgba(0,0,0,.08)'); }
      g.globalAlpha = s === 'night' ? .6 : .9; T.ridge(g, 1, horizon - 50, 120, P.m[0], 8); T.ridge(g, 4, horizon - 10, 80, P.m[1], 8); g.globalAlpha = 1;
      R(g, 0, horizon - 30, W, 8, 'rgba(255,255,255,.08)');
      T.ridge(g, 7, horizon + 25, 45, P.m[2], 8);
    }
    function ground(g) {
      R(g, 0, 494, W, 120, '#55823c'); R(g, 0, 494, W, 6, '#79a94b');
      for (let i = 0; i < 70; i++) R(g, hash(i) * W, 498 + hash(i + 50) * 14, 4, 4, hash(i + 3) < .5 ? '#3f6a2e' : '#8cbb58');
      R(g, 0, 514, W, 100, '#b49470');
      for (let r = 0; r < 5; r++) { const y = 514 + r * 16; R(g, 0, y, W, 2, '#957654'); for (let x = (r % 2) * 40; x < W; x += 80) R(g, x, y, 2, 16, '#957654'); }
    }
    function dojo(g) {
      skyAndHills(g, D.sky, 470);
      D.bossTop = T.pagoda(g, 170, 500, 5);
      T.tree(g, 880, 500, 5);
      ground(g);
      T.lantern(g, 330, 516, 4, D.lit); T.lantern(g, 640, 516, 4, D.lit);
    }
    // the waterfall in the mountains
    function falls(g) {
      T.bands(g, SKY.day.c, 0, 420);
      for (let k = 0; k < 3; k++) T.cloud(g, ((K.t * (6 + k * 3) + k * 420) % (W + 300)) - 150, 120 + k * 40, 6, 12 + k * 3, '#ffffff', 'rgba(0,0,0,.06)');
      T.ridge(g, 2, 380, 120, '#9db7d4', 8);
      // cliffs, left and right, with moss
      for (let x = 0; x < W; x += 12) {
        const left = x < 420, edge = left ? 420 - x : x - 560; if (edge < 0) continue;
        const top = 40 + Math.round((Math.min(230, edge * .6) + hash(Math.floor(x / 24)) * 30) / 12) * 12;
        R(g, x, top, 12, 500 - top, hash(Math.floor(x / 36) + 3) < .5 ? '#6b6f78' : '#62666f');
        if (hash(Math.floor(x / 36) + 9) < .5) R(g, x, top + 12, 12, 500 - top, '#73777f');
        R(g, x, top, 12, 12, '#6f9a44'); R(g, x, top + 12, 12, 12 + (hash(x) < .4 ? 12 : 0), '#4c7432');
        for (let y = top + 48; y < 460; y += 30) if (hash(x * 3 + y) < .35) R(g, x, y, 12, 6, '#4e5259');
        if (hash(x + 77) < .12 && top > 150) { R(g, x + 2, top - 30, 8, 30, '#4a3026'); for (let k = 0; k < 4; k++) R(g, x - 10 + k * 4, top - 36 - k * 14, 32 - k * 8, 14, k % 2 ? '#2f5a34' : '#3a6a3c'); }
      }
      // the water
      for (let x = 420; x < 560; x += 10) for (let k = 0; k < 14; k++) {
        const y = ((K.t * 260 + k * 34 + hash(x) * 300) % 476) + 40, ci = (Math.floor(x / 10) + k) % 3;
        R(g, x, y, 10, 30, ['#bfe6ff', '#8fcdf5', '#6ab4ea'][ci]);
      }
      R(g, 420, 40, 140, 14, '#e8f6ff'); R(g, 408, 30, 164, 12, '#6b6f78');
      // the pool
      R(g, 0, 468, W, 140, '#3c86b8'); R(g, 0, 468, W, 6, '#9fd8f8'); R(g, 0, 500, W, 100, '#2f74a4');
      for (let i = 0; i < 26; i++) { const x = (hash(i) * W + K.t * 20 * (hash(i + 1) - .5)) % W; R(g, x, 480 + hash(i + 7) * 50, 18 + hash(i + 2) * 30, 3, 'rgba(220,245,255,.6)'); }
      for (let i = 0; i < 14; i++) { const a = K.t * 4 + i; R(g, 420 + hash(i) * 140 + Math.sin(a) * 6, 456 + Math.sin(a * 1.3) * 6, 14, 14, 'rgba(255,255,255,.85)'); }
      // a rock for the master
      R(g, 630, 486, 170, 60, '#6b6f78'); R(g, 640, 478, 150, 10, '#7d818a'); R(g, 650, 472, 120, 6, '#6f9a44');
    }
    // the roof for the duel at sunset
    function roof(g) {
      const cols = SKY.dusk.c; T.bands(g, cols, 0, 500);
      g.globalAlpha = .2; T.disc(g, D.sunX, D.sunY, 210, 8, '#ffcf70'); g.globalAlpha = 1;
      T.disc(g, D.sunX, D.sunY, 160, 8, '#ffb24a'); T.disc(g, D.sunX, D.sunY - 30, 120, 8, '#ffd070');
      for (let k = 0; k < 6; k++) { const y = D.sunY + 20 + k * 22 + k * k * 2; R(g, D.sunX - 170, y, 340, 4 + k * 2, T.bandAt(cols, 0, 500, y)); }
      T.ridge(g, 3, 440, 70, '#6a2a52', 8);
      for (let k = 0; k < 6; k++) T.pagoda(g, 60 + k * 170 + (k % 2) * 30, 488 - (k % 2) * 10, 2 + (k % 3) * .5, '#3a1838', 2 + (k % 2));
      T.ridge(g, 9, 492, 18, '#2a1028', 8);
      R(g, 0, 496, W, 14, '#2a1620'); R(g, 0, 494, W, 3, '#5a2e40');
      for (let r = 0; r < 8; r++) { const y = 510 + r * 12; R(g, 0, y, W, 12, r % 2 ? '#4a2434' : '#552a3c'); for (let x = (r % 2) * 14; x < W; x += 28) R(g, x, y, 3, 12, '#2a1620'); }
      // the curled ends of the ridge
      R(g, 0, 470, 26, 26, '#2a1620'); R(g, 20, 478, 10, 10, '#2a1620'); R(g, 6, 460, 10, 12, '#2a1620');
      R(g, W - 26, 470, 26, 26, '#2a1620'); R(g, W - 30, 478, 10, 10, '#2a1620'); R(g, W - 16, 460, 10, 12, '#2a1620');
    }

    /* ---------- props ---------- */
    const props = fx('ground', 0, (g) => {
      if (D.pole) { for (const [x, top] of [[D.poleX, D.poleTop], [D.pole2X, D.pole2Top]]) { if (x === D.pole2X && D.pole < 2) continue;
        R(g, x - 8, top, 16, 520 - top, '#7a5230'); R(g, x - 8, top, 4, 520 - top, '#9a6c40'); R(g, x - 10, top, 20, 6, '#5a3a20'); for (let y = top + 30; y < 510; y += 40) R(g, x - 8, y, 16, 3, '#5a3a20'); } }
      if (D.wall) { const x = D.wallX; R(g, x, D.wallTop, W - x + 40, 520 - D.wallTop, '#8c8478');
        for (let r = 0; D.wallTop + r * 22 < 520; r++) { const y = D.wallTop + r * 22; R(g, x, y, W - x, 3, '#6f685e'); for (let c = (r % 2) * 30; c < W - x; c += 60) R(g, x + c, y, 3, 22, '#6f685e'); }
        R(g, x - 6, D.wallTop - 10, W - x + 20, 12, '#3a3448'); R(g, x, D.wallTop - 14, W - x, 4, '#56506a'); R(g, x, D.wallTop, 6, 520 - D.wallTop, '#a39b8e'); }
      if (D.plank) { const x = D.plankX;
        for (const dx of [-62, 38]) { R(g, x + dx, plankY + 8, 24, FEET - plankY - 18, '#8e897e'); R(g, x + dx, plankY + 8, 24, 5, '#a39d90'); }
        if (!D.broke) { R(g, x - 70, plankY, 140, 10, '#c89458'); R(g, x - 70, plankY, 140, 3, '#e0b070'); for (let k = 0; k < 4; k++) R(g, x - 60 + k * 36, plankY + 4, 14, 2, '#a87440'); }
        else { const b = D.broke; R(g, x - 70 - b * 40, plankY + b * 30, 60, 10, '#c89458'); R(g, x + 10 + b * 40, plankY + b * 34, 60, 10, '#c89458'); }
      }
    });
    // the falling water on whoever sits under it
    const fall = fx('front', 0, (g) => { if (!D.wf) return; const who = D.wf, hp = headOf(who), x0 = 430;
      for (let x = x0; x < x0 + 120; x += 10) for (let k = 0; k < 10; k++) { const y = ((K.t * 300 + k * 50 + hash(x) * 200) % 460) + 40; if (y > hp.y - 10) continue; R(g, x, y, 10, 30, ['rgba(191,230,255,.75)', 'rgba(143,205,245,.7)', 'rgba(106,180,234,.7)'][(x / 10 + k) % 3]); }
      for (let i = 0; i < 10; i++) { const a = (K.t * 2.2 + i / 10) % 1, s = i % 2 ? -1 : 1; R(g, hp.x + s * (10 + a * 70), hp.y - 6 - Math.sin(a * Math.PI) * 40, 6, 6, `rgba(255,255,255,${1 - a})`); } });

    /* ---------- the cast ---------- */
    K.withOutfit(['ninjapak', 'ninjaband']);
    const hero = K.pet(hn, -1); hero.layer = 'front';
    const band = { on: 0, belt: 0, glow: 0 };
    hero.deco = (g, at, u, w, h) => {
      if (band.belt) { const x = -w / 2 + w * .5, top = -h * .58;
        R(g, x, top, 3 * u, h * .42, '#151318'); R(g, x + .6 * u, top, u * .8, h * .42, '#3a3640');
        R(g, x + 2 * u, top + h * .15, 3 * u, u, '#151318'); R(g, x + 3 * u, top + h * .15 + u, 2 * u, 3 * u, '#151318'); R(g, x + 1 * u, top + h * .15 + u, u, 3 * u, '#151318'); }
      if (band.on) { const e = at('eye'), y = e.y - 3.4 * u, wv = Math.sin(K.t * 9);
        R(g, e.x - 2.5 * u, y, 11 * u, 2.2 * u, '#d7262e'); R(g, e.x - 2.5 * u, y, 11 * u, .7 * u, '#ff5a60');
        R(g, e.x + 8.5 * u, y + .2 * u, 2.4 * u, 2.6 * u, '#9e161d');
        R(g, e.x + 10.5 * u, y + (wv > 0 ? 0 : .8) * u, 3 * u, 1.3 * u, '#d7262e'); R(g, e.x + 13.5 * u, y + (wv > 0 ? -.6 : 1.4) * u, 3 * u, 1.3 * u, '#b81d24');
        R(g, e.x + 10.5 * u, y + (wv > 0 ? 2 : 2.6) * u, 2.5 * u, 1.2 * u, '#b81d24'); R(g, e.x + 13 * u, y + (wv > 0 ? 2.6 : 3.4) * u, 2.5 * u, 1.2 * u, '#9e161d'); }
    };
    const heroGlow = K.over((g, age, lp) => { if (band.glow <= 0) return; const p = lp(headOf(hero)), r = 90 * K.lensNow.z, gr = g.createRadialGradient(p.x, p.y + 30, 4, p.x, p.y + 30, r);
      gr.addColorStop(0, `rgba(255,230,140,${.5 * band.glow})`); gr.addColorStop(1, 'rgba(255,200,100,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(p.x - r, p.y + 30 - r, r * 2, r * 2); });
    // the shadow ninjas: black silhouettes with a violet rim and glowing eyes
    const SHADOW = 'grayscale(1) brightness(.16) drop-shadow(0 0 2px rgba(200,150,255,.95)) drop-shadow(0 0 7px rgba(150,90,255,.6))';
    const shades = [];
    function shade(kind, side, o) {
      let a; if (kind === 'llama') a = K.llama(Object.assign({ cx: W / 2 + side * (W / 2 + 110), s: .8, face: -side, filter: SHADOW, outfit: ['ninjaband'] }, o || {}));
      else { a = K.pet(kind, side); a.filter = SHADOW; Object.assign(a, o || {}); }
      a.glow = 1; shades.push(a); return a;
    }
    const shadeEyes = K.over((g, age, lp) => {
      const z = K.lensNow.z;
      for (const a of shades) { if (a.alpha <= 0 || !a.glow) continue; const q = lp(eyeOf(a)), s = (a.pet ? 3.4 : 4.6) * (a.s || 1) * z;
        const gr = g.createRadialGradient(q.x, q.y, 1, q.x, q.y, s * 5); gr.addColorStop(0, 'rgba(255,40,70,.55)'); gr.addColorStop(1, 'rgba(255,40,70,0)'); g.fillStyle = gr; g.fillRect(q.x - s * 5, q.y - s * 5, s * 10, s * 10);
        g.fillStyle = '#ff2a48'; g.fillRect(Math.round(q.x - s * 1.6), Math.round(q.y - s * .5), Math.round(s * 3.2), Math.round(s)); g.fillStyle = '#ffd8de'; g.fillRect(Math.round(q.x - s * .5), Math.round(q.y - s * .5), Math.round(s), Math.round(s)); }
      if (D.eyes > 0) for (let i = 0; i < 9; i++) {   // eyes in the dark, before they come
        const x = 60 + hash(i + 40) * (W - 120), y = 330 + hash(i + 60) * 150, bl = Math.sin(K.t * 1.3 + i * 2) > -.85 ? 1 : 0, s = 3 * z, q = lp({ x, y });
        g.fillStyle = `rgba(255,42,72,${D.eyes * bl * Math.min(1, Math.max(0, D.eyes * 9 - i))})`; g.fillRect(q.x - s * 4, q.y, s * 3, s); g.fillRect(q.x + s, q.y, s * 3, s); }
    });
    function* knock(a, d, o) {
      o = o || {}; const x0 = a.cx, f0 = a.feet; a.glow = 0; emote('stars', 1.2, a); if (a.pet) hold(a, 'jump');
      yield* tween(o.secs || .9, p => { a.cx = x0 + d * (o.far || 420) * p; const hh = Math.sin(p * Math.PI) * (o.h || 140); if (a.pet) a.lift = hh; else a.feet = f0 - hh; a.r += d * .3; });
      T.puff(a.cx, (a.pet ? a.feet - a.lift : a.feet) - 40, 14, '40,26,60', 16, { a: .9 }); a.alpha = 0; a.lift = 0; a.r = 0; a.feet = f0;
    }
    function* strike(tg, o) {
      o = o || {}; const d = tg.cx > hero.cx ? 1 : -1; hero.face = d; const sl = T.speed(-d, 0);
      yield* petJump(hero, o.h || 50, o.secs || .3, tg.cx - d * 46); stop(sl);
      T.burst((hero.cx + tg.cx) / 2, FEET - 70, 5); T.puff(tg.cx, FEET - 10, 8); K.lens({ shake: 6 }, 0); yield* wait(.1); K.lens({ shake: 0 }, .3);
    }
    // the hero's own finishing move
    function* signature(tg) {
      const d = tg.cx > hero.cx ? 1 : -1; hero.face = d;
      if (hn === 'wifi') {   // the red ball, kicked like a comet
        const ball = { on: true, x: hero.cx + d * 30, y: FEET - 4 }; const bf = K.ballFx(ball);
        hold(hero, 'down'); emote('!', .8, hero); yield* wait(.5); hold(hero, null); yield* petJump(hero, 24, .3);
        const tp = headOf(tg), x0 = ball.x; const trail = fx('front', .9, (g) => { for (let k = 1; k < 6; k++) R(g, ball.x - d * k * 14, ball.y - 8 + Math.sin(k) * 2, 10 - k, 6, `rgba(255,${120 + k * 20},60,${.8 - k * .13})`); });
        yield* tween(.4, p => { ball.x = lerp(x0, tp.x, p); ball.y = lerp(FEET - 4, tp.y + 10, p) - Math.sin(p * Math.PI) * 50; });
        stop(trail); T.burst(ball.x, ball.y - 6, 6);
        yield* par(knock(tg, d, { far: 520, h: 200 }), tween(.8, p => { ball.x = lerp(tp.x, hero.cx + d * 30, p); ball.y = lerp(tp.y, FEET - 4, p) - Math.sin(p * Math.PI) * 120; }));
        yield* wait(.4); ball.on = false; stop(bf);
      } else if (hn === 'snoet') {   // the tornado
        const x0 = hero.cx, tx = tg.cx - d * 40; hold(hero, 'jump');
        const whirl = fx('front', 1.8, (g) => { for (let k = 0; k < 16; k++) { const a = K.t * 14 + k * .8, rr = 24 + (k % 4) * 14; R(g, hero.cx + Math.cos(a) * rr * 1.4, FEET - 10 - k * 7 - hero.lift, 8, 6, `rgba(230,215,190,${.85 - k * .04})`); } });
        yield* tween(1.2, p => { hero.cx = lerp(x0, tx, ez(p)); hero.face = Math.sin(p * 40) > 0 ? 1 : -1; hero.lift = Math.sin(p * Math.PI) * 30; });
        hero.face = d; hero.lift = 0; hold(hero, null); T.burst(tg.cx, FEET - 70, 6); stop(whirl); yield* knock(tg, d, { far: 480, h: 240, secs: 1 });
      } else if (hn === 'pippa') {   // puffs up, then three claw slashes
        hold(hero, 'stand'); emote('angry', 1.4, hero);
        yield* tween(.5, p => { hero.sq = 1 + .25 * p; hero.sx = 1 + .15 * p; }); yield* wait(.4);
        yield* petTo(hero, tg.cx - d * 60, 320); hold(hero, 'paw'); hero.sq = 1; hero.sx = 1;
        const hp = headOf(tg), sl = fx('screen', .7, (g, age) => { for (let k = 0; k < 3; k++) { const a = Math.min(1, age * 5 - k * .5); if (a <= 0) continue;
          for (let j = 0; j < 10 * a; j++) R(g, hp.x - 40 + k * 22 + j * 6, hp.y - 30 + j * 9, 7, 7, `rgba(255,255,255,${1 - age})`); } });
        yield* wait(.35); hold(hero, null); yield* knock(tg, d, { far: 440, h: 160 });
      } else if (hn === 'pebbels') {   // a startle jump so high that it comes down on the enemy's head
        hero.eyes = 'groot'; emote('!', 1, hero); yield* wait(.4);
        const x0 = hero.cx; hold(hero, 'jump'); yield* tween(.9, p => { hero.lift = Math.sin(p * Math.PI * .5) * 320; hero.cx = lerp(x0, tg.cx, p); });
        yield* tween(.25, p => { hero.lift = lerp(320, tg.pet ? 70 : 190, p); });
        T.burst(hero.cx, FEET - hero.lift, 7); tg.sq = .7; K.lens({ shake: 7 }, 0); yield* wait(.15); K.lens({ shake: 0 }, .4); tg.sq = 1; hero.eyes = '';
        yield* par(knock(tg, d, { far: 420, h: 120 }), tween(.4, p => { hero.lift = lerp(tg.pet ? 70 : 190, 0, p); hero.cx -= d * 80 * K.dt; })); hold(hero, null);
      } else {   // Dobby: a binky, and a thump that shakes the ground
        hold(hero, 'jump'); yield* tween(.7, p => { hero.lift = Math.sin(p * Math.PI) * 110; hero.r = Math.sin(p * Math.PI * 2) * .5; hero.face = p > .5 ? -d : d; }); hero.r = 0; hero.face = d;
        hold(hero, 'down'); hero.sq = .85; K.lens({ shake: 9 }, 0); emote('burst', .6, hero);
        const x0 = hero.cx; const wave = fx('ground', 1.2, (g, age) => { const rr = age * 520; for (const s of [-1, 1]) for (let k = 0; k < 5; k++) R(g, x0 + s * (rr - k * 14), FEET - 8 - (5 - k) * 4 * (1 - age), 10, (5 - k) * 8 * (1 - age), `rgba(200,170,120,${.9 - k * .15})`); });
        yield* wait(.25); hero.sq = 1; K.lens({ shake: 0 }, .5); hold(hero, null);
        yield* knock(tg, d, { far: 380, h: 220, secs: 1 });
      }
    }
    // little test: the hero bows (or what passes for it)
    function* bow(a, secs) { hold(a, 'down'); yield* wait(secs || 1.2); hold(a, null); }
    function* kbow(secs) { yield* tween(.5, p => { kam.head = .45 * p; }); yield* wait(secs || .8); yield* tween(.5, p => { kam.head = .45 * (1 - p); }); }
    function* kick(d) { kam.face = d; yield* par(hop(40, .4), tween(.5, p => { kam.r = -d * .35 * Math.sin(p * Math.PI); })); kam.r = 0; }
    function* freeze(secs, back, bs) { K.flash(1, '255,255,255', 1.6); K.grade('sepia', 1, .01); K.setv('ab', 1); yield* wait(secs); K.setv('ab', 0, .5); K.grade(back, bs === undefined ? 1 : bs, .4); }

    /* ================= OPENING: the dojo on the mountain, at dawn ================= */
    K.stage(dojo);
    const birds = fx('back', 0, (g) => { if (D.sky === 'night') return; for (let i = 0; i < 5; i++) { const x = ((K.t * 40 + i * 37) % (W + 300)) - 150, y = 160 + i * 12 + Math.sin(K.t + i) * 6, f = Math.sin(K.t * 8 + i) > 0;
      R(g, x, y, 4, 2, '#2a2030'); R(g, x - 6, y - (f ? 3 : -1), 6, 2, '#2a2030'); R(g, x + 4, y - (f ? 3 : -1), 6, 2, '#2a2030'); } });
    kam.x = 150; kam.face = -1; kam.eyes = 'dicht'; kam.head = .12;
    K.lens({ z: 1.7, cx: D.sunX, cy: 380 }, 0);
    yield* K.opening('DE WEG VAN DE NINJA', 'EEN VECHTFILM MET ' + NAME, 'goud');
    yield* par(K.lensW({ z: 1, cx: W / 2, cy: 300 }, 6), tween(9, p => { D.sunY = 430 - 80 * p; }));
    yield* wait(1);
    // the student arrives, tiny and eager
    hero.cx = -80; yield* petTo(hero, 220, K.PET[hn].run * .7);
    hero.face = -1; emote('!', 1.2, hero); yield* wait(1.4); hero.face = 1;   // the pagoda! the master!
    emote('stars', 1.4, hero); yield* petJump(hero, 20, .3); yield* petTo(hero, 400, K.PET[hn].run * .5); hero.face = 1;
    yield* bow(hero, 1.6);
    yield* wait(1.2); emote('dots', 2);   // the master does not move
    yield* wait(1.6); hero.face = 1; yield* bow(hero, .6); yield* petJump(hero, 14, .25); yield* petJump(hero, 14, .25); emote('?', 1.6, hero);
    yield* wait(1.4);
    // a close-up: one eye opens
    yield* K.lensW({ z: 2.3, cx: K.kx() - 30, cy: 320 }, 1.4); kam.eyes = 'vies'; yield* wait(1.8);
    yield* K.lensW({ z: 1.2, cx: W / 2 - 40, cy: 360 }, 1.2);
    // showing off: a huge jump kick… and a crash
    hero.face = 1; hold(hero, 'down'); yield* wait(.6); hold(hero, null);
    const x0 = hero.cx;
    yield* tween(1.1, p => { hero.lift = Math.sin(p * Math.PI) * 150; hero.cx = lerp(x0, x0 + 40, p); hero.r = p * Math.PI * 2.4; hold(hero, 'jump'); });
    hero.lift = 0; hero.r = Math.PI * .5; T.puff(hero.cx, FEET - 6, 12); K.lens({ shake: 5 }, 0); yield* wait(.15); K.lens({ shake: 0 }, .3);
    hold(hero, 'lie'); emote('stars', 2.4, hero); yield* wait(2.4); hero.r = 0;
    kam.eyes = 'rol'; yield* wait(2); kam.eyes = 'dicht';
    hold(hero, restOf(hero)); emote('tears', 2.4, hero); yield* wait(2.6);
    // the master gets up, helps, and bows: a lesson starts
    kam.eyes = ''; kam.head = 0; yield* walkTo(10, 40); kam.face = -1; yield* tween(.6, p => { kam.head = .35 * p; }); emote('heart', 1.8); yield* wait(1.2); kam.head = 0;
    hold(hero, null); hero.face = 1; yield* kbow(1); yield* bow(hero, 1.2); emote('hearts', 2, hero); yield* wait(2.4);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 1', 'DE TRAINING', 2.6, { size: 44 });

    /* ================= TRAINING, round one: everything goes wrong ================= */
    D.sky = 'day'; D.sunX = 760; D.sunY = 160; K.grade('warm', .5, .01); K.lensReset(0);
    // 1. balance on a pole
    D.pole = 2; hero.cx = D.poleX; hero.feet = D.poleTop; hero.noShadow = true; hero.face = -1; hold(hero, 'stand');
    kam.x = D.pole2X - W / 2; kam.feet = D.pole2Top; kam.face = 1; kam.eyes = 'dicht'; kam.head = .1;
    yield* K.fadeIn(1.2);
    yield* tween(4, p => { hero.r = Math.sin(p * 18) * .25 * p; hero.cx = D.poleX + Math.sin(p * 13) * 6 * p; });
    emote('sweat', 1.4, hero); yield* tween(1, p => { hero.r = Math.sin(p * 26) * .45; });
    hold(hero, 'jump'); yield* tween(.6, p => { hero.feet = lerp(D.poleTop, FEET, p * p); hero.r = p * 2; hero.cx = D.poleX + 60 * p; });
    hero.r = 0; hero.feet = FEET; hero.noShadow = false; hold(hero, 'lie'); T.puff(hero.cx, FEET - 6, 12); K.lens({ shake: 5 }, 0); yield* wait(.12); K.lens({ shake: 0 }, .3);
    emote('stars', 2, hero); kam.eyes = 'vies'; yield* wait(1.8); kam.eyes = 'dicht'; yield* wait(.8);
    // 2. catch a fly
    const fly = { on: 0, x: 0, y: 0 };
    const flyFx = fx('front', 0, (g) => { if (!fly.on) return; const f = Math.floor(K.t * 30) % 2; R(g, fly.x - 3, fly.y - 3, 6, 5, '#1a1420'); R(g, fly.x - 4, fly.y - (f ? 8 : 6), 4, 4, 'rgba(220,240,255,.85)'); R(g, fly.x + 1, fly.y - (f ? 8 : 6), 4, 4, 'rgba(220,240,255,.85)'); });
    yield* K.cut(() => { D.pole = 0; kam.feet = null; kam.x = 160; kam.face = -1; kam.eyes = ''; kam.head = 0; hold(hero, 'stand'); hero.cx = 420; hero.face = 1; hero.feet = FEET; fly.on = 1; });
    yield* K.lensW({ z: 1.5, cx: 520, cy: 400 }, .01);
    yield* tween(5, p => { const hp = headOf(hero); fly.x = hp.x + Math.sin(p * 17) * 70; fly.y = hp.y - 30 + Math.sin(p * 23) * 30; hero.face = fly.x > hero.cx ? 1 : -1; });
    yield* petJump(hero, 30, .3); emote('?', 1, hero);
    yield* tween(1.2, p => { const n = K.A.petPoint(hero, 'nose'); fly.x = lerp(fly.x, n.x, .1); fly.y = lerp(fly.y, n.y - 6, .1); });
    hero.eyes = 'groot'; yield* wait(1.6);   // it sits on the nose
    yield* tween(1.6, p => { const m = K.kp(40, 380); fly.x = lerp(fly.x, m.x, .08); fly.y = lerp(fly.y, m.y, .08); }); hero.eyes = '';
    kam.mouth = 1; yield* wait(.12); kam.mouth = 0; fly.on = 0; kam.eyes = 'blij'; yield* wait(1.4);
    hero.eyes = 'groot'; emote('!?', 1.6, hero); yield* wait(1);
    kam.mouth = .6; fly.on = 1; const m0 = K.kp(40, 380); yield* tween(1.2, p => { fly.x = m0.x - p * 300; fly.y = m0.y - Math.sin(p * 9) * 40 - p * 100; }); kam.mouth = 0; fly.on = 0; hero.eyes = '';
    // 3. break a plank
    yield* K.cut(() => { K.lensReset(0); D.plank = 1; hero.cx = D.plankX - 220; hero.face = 1; kam.x = -260; kam.face = 1; kam.eyes = ''; });
    yield* wait(1); hold(hero, 'down'); emote('angry', 1.2, hero); yield* wait(.9); hold(hero, null);
    yield* petJump(hero, 90, .55, D.plankX); hero.feet = plankY + 4; hold(hero, 'down'); hero.sq = .8; K.lens({ shake: 3 }, 0); yield* wait(.1); K.lens({ shake: 0 }, .2); hero.sq = 1;
    hold(hero, null); yield* wait(.5);   // nothing. the plank holds
    hold(hero, 'jump'); yield* tween(.6, p => { hero.feet = lerp(plankY + 4, FEET, p) - Math.sin(p * Math.PI) * 80; hero.cx = D.plankX - 140 * p; });
    hero.feet = FEET; hold(hero, restOf(hero)); emote('tears', 2.4, hero); hero.face = 1; kam.eyes = 'triest'; emote('sweat', 2); yield* wait(2.6); kam.eyes = '';
    // 4. run up a wall
    yield* K.cut(() => { D.plank = 0; D.wall = 1; hero.cx = 200; hero.face = 1; hold(hero, null); kam.x = -300; kam.face = 1; });
    yield* wait(.6); emote('!', .8, hero); const sl1 = T.speed(-1, 0);
    yield* petTo(hero, D.wallX - 20, 300); stop(sl1);
    hold(hero, 'walk'); hero.lockPose = true; hero.noShadow = true;
    yield* tween(.8, p => { hero.r = -Math.PI / 2 * Math.min(1, p * 3); hero.cx = D.wallX - 6; hero.feet = FEET - 20 - 150 * Math.sin(p * Math.PI * .5); hero.wt += .3; });
    hold(hero, 'jump'); yield* wait(.3); emote('sweat', 1, hero);
    yield* tween(1.4, p => { hero.feet = FEET - 170 + 150 * p * p; hero.r = -Math.PI / 2 * (1 - p); hero.cx = D.wallX - 6 - 50 * p; });
    hero.feet = FEET; hero.r = 0; hero.noShadow = false; hold(hero, 'lie'); hero.sq = .6; T.puff(hero.cx, FEET - 6, 12); yield* wait(.2); hero.sq = 1;
    kam.head = .5; kam.eyes = 'dicht'; yield* wait(2.2); kam.head = 0; kam.eyes = '';
    // 5. meditate under the waterfall
    yield* K.cut(() => { D.wall = 0; K.stage(falls); hold(hero, sitOf(hero)); hero.cx = 490; hero.face = -1; kam.x = 230; kam.face = -1; kam.eyes = 'dicht'; D.wf = hero; });
    const spray = K.weather('rain', .25);
    yield* K.lensW({ z: 1.6, cx: 500, cy: 380 }, 2);
    yield* tween(3, p => { hero.sq = 1 - .08 * Math.abs(Math.sin(p * 20)); hero.cx = 490 + Math.sin(p * 30) * 3; });
    hold(hero, 'jump'); D.wf = 0; yield* tween(.8, p => { hero.cx = lerp(490, 330, p); hero.lift = Math.sin(p * Math.PI) * 60; }); hero.lift = 0;
    T.puff(hero.cx, FEET - 30, 16, '200,235,255', 10, { up: true, v: 90 }); hold(hero, 'down'); hero.alpha = .9; yield* wait(1.4); hold(hero, null);
    for (let k = 0; k < 3; k++) { hero.sx = 1.2; T.puff(hero.cx, FEET - 60, 8, '200,235,255', 6); yield* wait(.15); hero.sx = 1; yield* wait(.25); }   // shaking off the water
    emote('angry', 1.6, hero); yield* wait(1.2);
    yield* K.lensW({ z: 1.4, cx: 640, cy: 330 }, 1.6); kam.eyes = 'dicht'; emote('dots', 2.4); yield* wait(2.4);
    K.stop(spray);
    yield* K.fadeOut(1.4);

    /* ================= night: the lesson of the headband ================= */
    K.stage(dojo); D.sky = 'night'; D.sunX = 260; D.sunY = 170; D.lit = 1; D.wf = 0; hero.alpha = 1;
    K.grade('nacht', .5, .01); K.setv('dark', .32, .01); K.lens({ z: 1, cx: W / 2, cy: 300 }, 0);
    const heroL = K.light(() => hero.alpha > 0 ? { x: hero.cx, y: FEET - 70 - (hero.lift || 0) } : null, 170, { a: .75 });
    const l1 = K.light(() => ({ x: 330, y: 470 }), 220, { col: '255,190,90', flicker: .08 }), l2 = K.light(() => ({ x: 640, y: 470 }), 220, { col: '255,190,90', flicker: .08 });
    const moonL = K.light(() => ({ x: D.sunX, y: D.sunY }), 160, { col: '200,210,255', a: .6 });
    hero.cx = 400; hero.face = -1; hold(hero, restOf(hero)); kam.x = 380; kam.face = -1; kam.eyes = ''; kam.head = 0;
    yield* K.fadeIn(2);
    emote('tears', 3, hero); yield* wait(3);
    kam.face = -1; yield* walkTo(40, 30); kam.face = -1; kam.head = .2; yield* wait(1.2);
    hero.face = 1; emote('?', 1.4, hero); yield* wait(1.6);
    kam.head = -.15; kam.face = -1; hero.face = -1; yield* K.lensW({ z: 1.4, cx: 430, cy: 340 }, 3);   // both look up at the moon
    yield* wait(2);
    // he gives his own headband
    const gift = { on: 1, x: 0, y: 0 };
    kam.outfit = (kam.outfit || []).filter(id => id !== 'ninjaband');
    const giftFx = fx('front', 0, (g) => { if (!gift.on) return; R(g, gift.x - 22, gift.y - 4, 44, 8, '#d7262e'); R(g, gift.x - 22, gift.y - 4, 44, 2, '#ff5a60'); R(g, gift.x + 18, gift.y + 2 + Math.sin(K.t * 9) * 3, 16, 5, '#b81d24'); });
    const g0 = K.kp(250, 120); gift.x = g0.x; gift.y = g0.y; kam.head = .3; hero.face = 1;
    yield* tween(2.2, p => { const h1 = headOf(hero); gift.x = lerp(g0.x, h1.x, ez(p)); gift.y = lerp(g0.y, h1.y + 10, ez(p)) - Math.sin(p * Math.PI) * 50; });
    gift.on = 0; stop(giftFx); band.on = 1; emote('sparks', 2, hero); K.flash(.5, '255,220,180', 1.5);
    hold(hero, null); hero.face = 1; yield* wait(1.4); hero.eyes = 'hart'; emote('hearts', 2.4, hero); yield* wait(2); hero.eyes = '';
    yield* bow(hero, 1.2); yield* kbow(.6);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 2);
    yield* K.fadeOut(1.6);
    K.unlight(l1); K.unlight(l2); K.unlight(moonL); K.unlight(heroL); K.setv('dark', 0, .01);
    yield* K.card('DEEL 2', 'NOG EEN KEER', 2.4, { size: 44 });

    /* ================= TRAINING, round two: quick cuts, everything works ================= */
    D.sky = 'dawn'; D.sunX = 600; D.sunY = 300; D.lit = 0; K.grade('goud', 1, .01);
    D.pole = 1; hero.cx = D.poleX; hero.feet = D.poleTop; hero.noShadow = true; hero.face = -1; hold(hero, isCatPaw(hn) ? 'paw' : 'stand'); hero.r = 0;
    kam.x = -250; kam.face = 1; kam.eyes = ''; kam.outfit = (kam.outfit || []).filter(id => id !== 'ninjaband');
    yield* K.fadeIn(1);
    yield* K.lensW({ z: 1.8, cx: D.poleX, cy: D.poleTop - 30 }, 2.5);   // perfectly still, the sun behind
    emote('sparks', 1.6, hero); yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .8); kam.eyes = 'blij'; yield* kbow(.3);
    // the fly: caught (freeze frame), and set free
    yield* K.cut(() => { D.pole = 0; hero.feet = FEET; hero.noShadow = false; hold(hero, 'stand'); hero.cx = 430; hero.face = 1; fly.on = 1; kam.x = 160; kam.face = -1; kam.eyes = ''; K.lens({ z: 1.6, cx: 470, cy: 380 }, 0); }, .25);
    yield* tween(2.4, p => { const hp = headOf(hero); fly.x = hp.x + 40 + Math.sin(p * 15) * 50; fly.y = hp.y - 20 + Math.sin(p * 21) * 26; });
    hero.face = 1; hold(hero, 'jump'); hero.lift = 26; fly.x = K.A.petPoint(hero, 'nose').x + 4; fly.y = K.A.petPoint(hero, 'nose').y;
    yield* freeze(1.6, 'goud');
    hero.lift = 0; hold(hero, 'stand'); fly.on = 0; yield* wait(.8);
    hold(hero, 'stand'); fly.on = 1; const n0 = K.A.petPoint(hero, 'nose'); emote('heart', 1.4, hero);
    yield* tween(1.2, p => { fly.x = n0.x + p * 260; fly.y = n0.y - p * 160 + Math.sin(p * 12) * 20; }); fly.on = 0;
    // the plank: CRACK
    yield* K.cut(() => { K.lens({ z: 1.2, cx: D.plankX - 60, cy: 420 }, 0); D.plank = 1; D.broke = 0; hero.cx = D.plankX - 200; hero.face = 1; kam.x = -330; kam.face = 1; }, .25);
    hold(hero, 'down'); band.glow = .7; yield* wait(.8); hold(hero, null);
    const sl2 = T.speed(-1, 0); yield* petJump(hero, 100, .45, D.plankX); stop(sl2);
    T.burst(D.plankX, plankY, 7); K.lens({ shake: 8 }, 0); K.flash(.6);
    T.puff(D.plankX, plankY, 14, '220,170,110', 6, { v: 120, grav: 300, grow: false });
    yield* tween(.4, p => { D.broke = p; hero.feet = FEET; }); band.glow = 0; K.lens({ shake: 0 }, .3);
    hold(hero, sitOf(hero)); kam.eyes = 'groot'; emote('!', 1.4); yield* wait(1.6); kam.eyes = 'blij';
    // the wall: up, over, and on top
    yield* K.cut(() => { D.plank = 0; D.broke = 0; D.wall = 1; K.lens({ z: 1, cx: W / 2, cy: 300 }, 0); hold(hero, null); hero.cx = 180; hero.face = 1; kam.x = -330; kam.eyes = ''; }, .25);
    const sl3 = T.speed(-1, 0); yield* petTo(hero, D.wallX - 20, 340); stop(sl3);
    hold(hero, 'walk'); hero.lockPose = true; hero.noShadow = true;
    yield* tween(.9, p => { hero.r = -Math.PI / 2 * Math.min(1, p * 4); hero.cx = D.wallX - 6; hero.feet = FEET - 20 - (FEET - 20 - D.wallTop + 20) * p; hero.wt += .4; });
    hold(hero, 'jump'); yield* tween(.5, p => { hero.r = -Math.PI / 2 - p * Math.PI * 1.5; hero.feet = D.wallTop - 20 - Math.sin(p * Math.PI) * 80; hero.cx = D.wallX - 6 + p * 70; });
    hero.r = 0; hero.feet = D.wallTop - 12; hold(hero, sitOf(hero)); hero.face = -1; emote('sparks', 1.6, hero);
    yield* K.lensW({ z: 1.7, cx: D.wallX + 40, cy: D.wallTop - 40 }, 1.6); yield* wait(1.2);
    // the waterfall: it doesn't move an inch, and the water parts around it
    yield* K.cut(() => { D.wall = 0; hero.noShadow = false; hero.feet = FEET; K.stage(falls); hold(hero, sitOf(hero)); hero.cx = 490; hero.face = -1; kam.x = 230; kam.face = -1; kam.eyes = ''; D.wf = hero; K.lens({ z: 1.5, cx: 520, cy: 360 }, 0); }, .25);
    K.grade('warm', .6, .5); band.glow = 1; const spray2 = K.weather('rain', .2);
    yield* wait(2.5); kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.4); yield* kbow(.8); kam.eyes = 'blij'; emote('heart', 1.8); yield* wait(1.6);
    K.stop(spray2); band.glow = 0; D.wf = 0;
    yield* K.fadeOut(1.5);
    yield* K.card('DEEL 3', 'DE SCHADUWEN', 2.6, { size: 44 });

    /* ================= DUSK: the shadows come ================= */
    K.stage(dojo); D.sky = 'dusk'; D.sunX = 760; D.sunY = 440; D.lit = 1; K.grade('goud', .7, .01); K.setv('dark', .2, .01); K.lens({ z: 1, cx: W / 2, cy: 300 }, 0);
    const l3 = K.light(() => ({ x: 330, y: 470 }), 240, { col: '255,190,90', flicker: .08 }), l4 = K.light(() => ({ x: 640, y: 470 }), 240, { col: '255,190,90', flicker: .08 });
    const gang = others.map((n, i) => { const a = K.pet(n, i % 2 ? 1 : -1); a.cx = 70 + i * 70; a.face = 1; hold(a, restOf(a)); return a; });
    hold(hero, null); hero.cx = 560; hero.face = -1; hero.alpha = 1; kam.x = 220; kam.face = -1; kam.eyes = '';
    yield* K.fadeIn(1.6);
    gang.forEach(a => { if (rnd() < .6) emote('notes', 2, a); }); yield* wait(2.4);
    const leaves = K.weather('leaves', 1.6);
    yield* par(K.setvW('dark', .3, 4), tween(4, p => { D.sunY = 440 + 80 * p; }));
    const heroL2 = K.light(() => hero.alpha > 0 ? { x: hero.cx, y: FEET - 70 - (hero.lift || 0) } : null, 190, { a: .7 });
    const moonL2 = K.light(() => ({ x: D.sunX, y: D.sunY }), 200, { col: '200,210,255', a: .5 });
    D.sky = 'night'; D.sunX = 470; D.sunY = 150; K.grade('nacht', .5, 1.5);
    hero.face = 1; hero.eyes = 'groot'; emote('!', 1.2, hero); yield* wait(1);
    yield* tween(3, p => { D.eyes = p; });
    gang.forEach(a => { a.eyes = 'groot'; hold(a, null); emote('!', 1, a); });
    yield* par(...gang.map((a, i) => petTo(a, K.kx() + 60 + i * 26, K.PET[a.pet].run * 1.6)));
    gang.forEach(a => { a.face = -1; hold(a, 'down'); }); kam.eyes = 'groot'; emote('sweat', 2);
    yield* K.lensW({ z: 2.6, cx: eyeOf(hero).x, cy: eyeOf(hero).y }, .6); yield* wait(1.2);   // the eye of the student
    hero.eyes = ''; yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .6);

    // wave one: three shadow foxes
    yield* tween(.6, p => { D.eyes = 1 - p; });
    const w1 = [shade('snoet', 1), shade('snoet', 1), shade('wifi', -1)];
    w1[0].cx = W + 80; w1[1].cx = W + 200; w1[2].cx = -100; hero.cx = 470; hero.face = 1;
    const sl4 = T.speed(-1, 0);
    yield* par(petTo(w1[0], 660, 420), petTo(w1[1], 760, 420), petTo(w1[2], 260, 420)); stop(sl4);
    w1[0].face = -1; w1[1].face = -1; w1[2].face = 1; w1.forEach(a => hold(a, 'down'));
    yield* K.lensW({ z: 1.3, cx: 500, cy: 400 }, .5); yield* wait(1.2);
    w1.forEach(a => hold(a, null));
    yield* strike(w1[0]); yield* knock(w1[0], 1, { far: 500 });
    hero.face = -1; yield* strike(w1[2]); yield* knock(w1[2], -1, { far: 420 });
    // slow motion on the last one
    const slow = T.focus(); K.grade('koud', .7, .3); hero.face = 1; hold(hero, 'jump');
    const sx0 = hero.cx;
    yield* tween(3, p => { hero.lift = Math.sin(p * Math.PI) * 120; hero.cx = lerp(sx0, w1[1].cx - 40, p); w1[1].lift = Math.sin(p * Math.PI) * 50; hold(w1[1], 'jump'); });
    T.burst(w1[1].cx - 20, FEET - 80, 7);
    yield* freeze(1.2, 'nacht', .5); K.unover(slow); hold(hero, null);
    yield* knock(w1[1], 1, { far: 400, h: 200 });
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .6);
    emote('sparks', 1.4, hero); gang.forEach(a => { hold(a, sitOf(a)); emote('hearts', 1.6, a); }); yield* wait(1.6);

    // wave two: shadow llamas, back to back with the master
    const w2 = [shade('llama', -1), shade('llama', 1)];
    w2[0].cx = -120; w2[1].cx = W + 120;
    yield* par(K.actorTo(w2[0], 200, 160), K.actorTo(w2[1], 790, 160), walkTo(60, 60), petTo(hero, 380, 200));
    w2[0].face = 1; w2[1].face = -1; kam.face = 1; hero.face = -1; w2.forEach(a => { a.pose = 'stand'; });
    gang.forEach(a => { a.eyes = 'groot'; }); yield* K.lensW({ z: 1.4, cx: 470, cy: 340 }, 1); yield* wait(1.4);
    // close-ups, eye to eye
    yield* K.cut(() => K.lens({ z: 3, cx: eyeOf(w2[1]).x - 20, cy: eyeOf(w2[1]).y + 10 }, 0), .15); yield* wait(1);
    yield* K.cut(() => K.lens({ z: 3, cx: K.kp(220, 300).x, cy: K.kp(220, 300).y }, 0), .15); kam.eyes = 'boos'; yield* wait(1);
    yield* K.cut(() => K.lens({ z: 1.2, cx: W / 2, cy: 340 }, 0), .15);
    yield* par(K.actorTo(w2[1], K.kx() + 140, 240), (function* () { yield* wait(.3); yield* kick(1); })());
    T.burst(K.kx() + 90, 340, 7); K.lens({ shake: 7 }, 0); yield* wait(.1); K.lens({ shake: 0 }, .3);
    yield* knock(w2[1], 1, { far: 460, h: 160 });
    yield* signature(w2[0]);
    kam.eyes = 'blij'; yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .6); yield* wait(1);

    // wave three: from everywhere at once
    D.eyes = 1; yield* wait(1.4); D.eyes = 0;
    const w3 = [shade('pippa', -1), shade('snoet', 1), shade('pebbels', -1), shade('wifi', 1), shade('llama', 1)];
    w3[2].cx = -260; w3[3].cx = W + 260; w3[4].cx = W + 420;
    hero.face = 1; hold(hero, null);
    const sl5 = T.speed(1, 0);
    yield* par(petTo(w3[0], 250, 380), petTo(w3[1], 690, 380), petTo(w3[2], 160, 300), petTo(w3[3], 790, 300), K.actorTo(w3[4], 880, 260), petTo(hero, 470, 200)); stop(sl5);
    w3.forEach(a => { a.face = a.cx < 470 ? 1 : -1; if (a.pet) hold(a, 'down'); else a.pose = 'stand'; });
    kam.eyes = 'groot'; emote('!', 1.2); yield* K.lensW({ z: 1.25, cx: 470, cy: 360 }, .8); yield* wait(1.4);
    // the spin: everything flies away
    band.glow = 1; hold(hero, 'jump'); K.flash(.5, '255,230,170', 2);
    const sw = fx('front', 2.2, (g) => { for (let k = 0; k < 22; k++) { const a = K.t * 16 + k * .6, rr = 30 + (k % 5) * 18; R(g, hero.cx + Math.cos(a) * rr * 1.6, FEET - 14 - k * 6 - hero.lift * .5, 8, 6, `rgba(255,236,190,${.9 - k * .035})`); } });
    yield* tween(1.6, p => { hero.lift = Math.sin(p * Math.PI) * 70; hero.face = Math.sin(p * 50) > 0 ? 1 : -1; hero.r = Math.sin(p * 30) * .2; });
    hero.r = 0; hero.lift = 0; K.lens({ shake: 9 }, 0); K.flash(.8);
    yield* par(...w3.map(a => knock(a, a.cx < hero.cx ? -1 : 1, { far: 520, h: 180 + rnd() * 120, secs: 1.1 })));
    K.lens({ shake: 0 }, .5); stop(sw); band.glow = 0; hold(hero, null);
    gang.forEach(a => { hold(a, null); a.eyes = ''; }); yield* par(...gang.map(a => petJump(a, 40, .4)), hop(30, .4)); emote('hearts', 2);
    yield* wait(1.6);
    // and then, on top of the pagoda, against the moon: the big one
    D.sunX = 190; D.sunY = D.bossTop - 40;
    const boss = shade('llama', -1, { s: .62, cx: 176, feet: D.bossTop + 46, face: 1 }); boss.alpha = 0;
    yield* K.lensW({ z: 1.45, cx: 260, cy: 260 }, 2);
    yield* tween(1.2, p => { boss.alpha = p; }); K.flash(.6, '200,180,255', 1.2);
    hero.face = -1; kam.face = -1; gang.forEach(a => { a.face = -1; a.eyes = 'groot'; });
    yield* wait(2.4);
    yield* tween(.6, p => { boss.feet = D.bossTop + 46 - Math.sin(p * Math.PI) * 60; boss.cx = 176 - p * 200; }); boss.alpha = 0;   // gone, into the night
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.4);
    hero.face = -1; emote('angry', 2, hero); yield* wait(1.4);
    yield* petTo(hero, -120, 260);
    K.stop(leaves); K.unlight(l3); K.unlight(l4); K.unlight(heroL2); K.unlight(moonL2);
    yield* K.fadeOut(1.6);
    gang.forEach(a => { a.alpha = 0; });
    yield* K.card('DEEL 4', 'HET LAATSTE DUEL', 2.6, { size: 44 });

    /* ================= the duel on the roof, at sunset ================= */
    K.stage(roof); D.sunX = 480; D.sunY = 380; K.setv('dark', 0, .01); K.grade('goud', .8, .01); kam.hide = true;
    const leaves2 = K.weather('leaves', 1.2);
    hero.alpha = 1; hero.cx = 200; hero.face = 1; hold(hero, 'stand'); hero.filter = '';
    boss.alpha = 1; boss.cx = 770; boss.feet = FEET; boss.face = -1; boss.s = 1.05; boss.glow = 1; boss.pose = 'stand';
    K.lens({ z: 1.3, cx: W / 2, cy: 330 }, 0);
    yield* K.fadeIn(2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 4);
    // eyes, band, a leaf, eyes
    yield* K.cut(() => K.lens({ z: 3.2, cx: eyeOf(hero).x + 10, cy: eyeOf(hero).y }, 0), .12); yield* wait(1.4);
    yield* K.cut(() => K.lens({ z: 3.2, cx: eyeOf(boss).x - 10, cy: eyeOf(boss).y }, 0), .12); yield* wait(1.4);
    yield* K.cut(() => K.lens({ z: 2.6, cx: headOf(hero).x + 50, cy: headOf(hero).y + 30 }, 0), .12); yield* wait(1.2);
    yield* K.cut(() => K.lens({ z: 1, cx: W / 2, cy: 300 }, 0), .12); yield* wait(1);
    // the charge
    const sl6 = T.speed(1, 0);
    yield* par(petTo(hero, 400, 320), K.actorTo(boss, 600, 260)); stop(sl6);
    // in the air, in front of the sun: frozen
    hero.filter = 'brightness(0)'; boss.glow = 0; hold(hero, 'jump'); boss.pose = 'walk1';
    yield* tween(.4, p => { hero.lift = Math.sin(p * Math.PI * .5) * 140; hero.cx = lerp(400, 450, p); boss.feet = FEET - Math.sin(p * Math.PI * .5) * 120; boss.cx = lerp(600, 540, p); });
    K.flash(1, '255,240,200', 1.4); K.setv('ab', .8); yield* wait(2.6); K.setv('ab', 0, .5);
    hero.filter = ''; boss.glow = 1;
    T.burst(495, 360, 9); K.lens({ shake: 10 }, 0); K.flash(.7);
    yield* tween(.5, p => { hero.lift = lerp(140, 0, p); hero.cx = lerp(450, 640, p); boss.feet = lerp(FEET - 120, FEET, p); boss.cx = lerp(540, 320, p); });
    K.lens({ shake: 0 }, .4); hero.face = -1; boss.face = 1; boss.pose = 'stand'; hold(hero, 'down');
    yield* wait(1.4);
    // he was too strong: the student falls
    hold(hero, 'lie'); hero.r = .3; emote('stars', 2, hero); yield* wait(.6);
    yield* K.lensW({ z: 1.5, cx: 520, cy: 400 }, 1.4);
    yield* K.actorTo(boss, 470, 40); boss.pose = 'stand'; yield* wait(1);
    // a memory: the master nods (a cut to the courtyard below)
    yield* K.cut(() => { K.stage(dojo); D.sky = 'dusk'; D.sunX = 700; D.sunY = 460; kam.hide = false; kam.x = 0; kam.face = -1; kam.eyes = 'dicht'; hero.alpha = 0; boss.alpha = 0; K.lens({ z: 2, cx: W / 2 - 20, cy: 330 }, 0); K.grade('sepia', .8, .01); }, .2);
    yield* wait(1); kam.eyes = ''; yield* kbow(.5); emote('heart', 1.4); yield* wait(1.2);
    yield* K.cut(() => { K.stage(roof); D.sunX = 480; D.sunY = 380; kam.hide = true; hero.alpha = 1; boss.alpha = 1; K.lens({ z: 1.5, cx: 520, cy: 400 }, 0); K.grade('goud', .8, .01); }, .2);
    // it gets up, with the band glowing
    hero.r = 0; hold(hero, 'down'); band.glow = .5; emote('sparks', 2, hero); yield* wait(1.2); hold(hero, null); hero.face = -1;
    yield* tween(1.2, p => { band.glow = .5 + .5 * p; }); K.flash(.6, '255,230,170', 1.5);
    boss.face = 1; boss.eyes = ''; yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .8);
    yield* signature(boss);
    band.glow = 0; boss.glow = 0;
    // the boss falls apart into leaves
    const lv = T.puff(Math.min(W - 60, Math.max(60, boss.cx)), FEET - 200, 30, '217,138,43', 8, { v: 80, rise: -10, grav: 40, dur: 3, grow: false });
    yield* wait(1.6);
    hero.face = 1; hold(hero, sitOf(hero)); yield* K.lensW({ z: 1.4, cx: hero.cx, cy: 380 }, 3);
    yield* tween(3, p => { D.sunY = 380 + 120 * p; });
    yield* wait(1);
    K.stop(leaves2);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 5', 'DE GROOTMEESTER', 2.6, { size: 44 });

    /* ================= the ceremony under the blossom ================= */
    K.stage(dojo); D.sky = 'day'; D.sunX = 720; D.sunY = 150; D.lit = 0; D.eyes = 0; K.grade('warm', .6, .01); K.lens({ z: 1, cx: W / 2, cy: 300 }, 0);
    kam.hide = false; kam.x = 170; kam.face = -1; kam.eyes = ''; kam.head = 0; kam.outfit = null; K.withOutfit(['ninjapak', 'ninjaband']);
    hero.cx = 470; hero.face = 1; hold(hero, sitOf(hero)); hero.lift = 0; hero.r = 0;
    gang.forEach((a, i) => { a.alpha = 1; a.cx = 90 + i * 62; a.face = 1; a.eyes = ''; hold(a, sitOf(a)); a.layer = 'front'; });
    const heidi = K.heidi(1, { cx: 830, face: -1, eyes: 'vies' });
    const pet1 = T.petals(.6);
    yield* K.fadeIn(2);
    yield* wait(1.5);
    yield* kbow(1); yield* bow(hero, 1.4); hold(hero, sitOf(hero));
    // the black belt drifts down to the student
    const belt = { on: 1, x: K.kx() - 40, y: 120 };
    const beltFx = fx('front', 0, (g) => { if (!belt.on) return; R(g, belt.x - 30, belt.y - 4, 60, 8, '#151318'); R(g, belt.x - 30, belt.y - 4, 60, 2, '#3a3640'); R(g, belt.x - 4, belt.y, 8, 18, '#151318'); });
    const bL = K.light(() => belt.on ? { x: belt.x, y: belt.y } : null, 80, { col: '255,240,200' });
    yield* K.lensW({ z: 1.6, cx: 470, cy: 340 }, 1.6);
    yield* tween(3.2, p => { belt.x = lerp(K.kx() - 40, hero.cx, p) + Math.sin(p * 8) * 30; belt.y = lerp(120, FEET - 50, p); });
    belt.on = 0; stop(beltFx); K.unlight(bL); band.belt = 1; K.flash(.6, '255,240,200', 1.4); emote('sparks', 2.2, hero);
    yield* wait(1); hold(hero, null); hero.eyes = 'hart'; yield* petJump(hero, 40, .4); hero.eyes = '';
    // everyone cheers; Heidi chews
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1);
    const conf = K.weather('confetti', .5);
    gang.forEach(a => { hold(a, null); emote('hearts', 2.4, a); });
    yield* par(...gang.map(a => (function* () { yield* wait(rnd() * .5); yield* petJump(a, 30 + rnd() * 30, .4); yield* petJump(a, 30, .4); })()), hop(30, .4));
    emote('hearts', 2.4);
    yield* K.lensW({ z: 2.2, cx: heidi.cx - 10, cy: FEET - 170 }, 1.2);
    yield* tween(3, p => { heidi.sq = 1 + Math.sin(p * 30) * .012; }); emote('dots', 1.6, heidi); yield* wait(1.2);
    yield* tween(.5, p => { heidi.head = .3 * p; }); yield* tween(.5, p => { heidi.head = .3 * (1 - p); });   // one tiny nod
    heidi.eyes = 'blij'; yield* wait(.8); heidi.eyes = 'vies';
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.2);
    K.stop(conf);
    // the last image: the grandmaster on the pole, at sunset, with the blossom
    yield* K.fadeOut(1.2);
    D.sky = 'dusk'; D.sunX = 600; D.sunY = 400; D.pole = 1; K.grade('goud', 1, .01);
    gang.forEach(a => { a.alpha = 0; }); heidi.alpha = 0; kam.x = -260; kam.face = 1;
    hero.cx = D.poleX; hero.feet = D.poleTop; hero.noShadow = true; hero.face = -1; hold(hero, 'stand');
    K.lens({ z: 2, cx: D.poleX, cy: D.poleTop - 40 }, 0);
    yield* K.fadeIn(1.6);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 6);
    yield* kbow(.6); emote('heart', 1.6);
    hero.filter = 'brightness(.25)'; yield* wait(2.5);
    K.stop(pet1);
    yield* K.ending('EINDE');
  } };
  /* =====================================================================================
     MISSIE KAMIEL — the housemates get ready for space: the selection tests, the training, a rocket built
     piece by piece, suits and helmets, the countdown, a huge launch, floating above the Earth (a carrot,
     a licked window, a spacewalk), and a parachute landing to a heroes' welcome. About 7–8 minutes.
     ===================================================================================== */
  F['film-ruimte'] = { run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez, clamp } = K;
    const names = K.castNames();
    const T = kit(K), R = T.R, hash = T.hash, SKY = T.SKY;
    const sitOf = (a) => a.pet === 'dobby' ? 'up' : 'sit';
    const restOf = (a) => a.pet === 'dobby' ? 'lie' : 'sit';
    const eyeOf = (a) => a.pet ? K.A.petPoint(a, 'eye') : K.A.llamaPoint(a, 227, 291);
    const headOf = (a) => a.pet ? K.A.petPoint(a, 'head') : K.A.llamaPoint(a, 230, 160);
    const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const mix = (a, b, p) => { const A = hx(a), B = hx(b); return `rgb(${Math.round(lerp(A[0], B[0], p))},${Math.round(lerp(A[1], B[1], p))},${Math.round(lerp(A[2], B[2], p))})`; };
    const SPACE = ['#000004', '#02020c', '#040616', '#070a20', '#0a0f2a', '#0e1434', '#121a3e'];

    // the state of the decors
    const D = { sky: 'night', sunX: 720, sunY: 170, chair: 0, spin: 0, fuge: 0, fa: 0, tramp: 0, sag: [0, 0, 0, 0, 0, 0], food: 0,
      parts: 0, drop: null, gantry: 0, crane: 0, cam: 0, ry: 0, fire: 0, sep: 0, sepY: 0, bunting: 0, lick: [], scope: 0 };
    const RX = 520, RBASE = 498, RU = 5, PH = [10, 22, 18, 14, 12];

    /* ---------- decors ---------- */
    function sky(g, s, horizon, hills) {
      const P = SKY[s];
      T.bands(g, P.c, 0, horizon);
      if (s === 'night') { T.stars(g, 110, 5, horizon - 40); T.disc(g, D.sunX, D.sunY, 70, 8, 'rgba(242,240,224,.10)'); T.disc(g, D.sunX, D.sunY, 50, 5, P.sun);
        R(g, D.sunX - 18, D.sunY - 14, 14, 14, '#d6d2bc'); R(g, D.sunX + 12, D.sunY + 8, 10, 10, '#d6d2bc'); R(g, D.sunX - 2, D.sunY + 22, 5, 5, '#d6d2bc'); }
      else { g.globalAlpha = .2; T.disc(g, D.sunX, D.sunY, 110, 6, P.sun); g.globalAlpha = 1; T.disc(g, D.sunX, D.sunY, 56, 6, P.sun); }
      for (let k = 0; k < 4; k++) { const x = ((K.t * (4 + k * 2.5) + hash(k + 20) * 1400) % (W + 400)) - 200; T.cloud(g, x, 100 + [0, 70, 30, 110][k], 6, 10 + Math.round(hash(k + 30) * 12), P.cl, 'rgba(0,0,0,.08)'); }
      if (hills !== false) { T.ridge(g, 2, horizon - 20, 60, P.m[0], 8); T.ridge(g, 6, horizon + 10, 30, P.m[1], 8); }
    }
    function grass(g, y) {
      R(g, 0, y, W, H - y, '#4f8a3a'); R(g, 0, y, W, 6, '#7ab84e');
      for (let i = 0; i < 80; i++) R(g, hash(i) * W, y + 8 + hash(i + 50) * (H - y - 8), 4, 4, hash(i + 3) < .5 ? '#3e7230' : '#86c25a');
    }
    // the prologue: a hill at night, a telescope, the moon
    function hill(g) {
      sky(g, 'night', 470);
      // our house, far away, with a lit window
      R(g, 90, 420, 90, 60, '#141a34'); for (let r = 0; r < 6; r++) R(g, 80 + r * 9, 420 - r * 8, 110 - r * 18, 8, '#10142a'); R(g, 120, 440, 16, 16, '#ffd27a');
      R(g, 0, 480, W, 130, '#20324a'); R(g, 0, 480, W, 6, '#2e4a5e');
      for (let i = 0; i < 40; i++) R(g, hash(i) * W, 488 + hash(i + 9) * 40, 4, 4, '#2a4058');
      // the telescope on its tripod, aimed at the moon
      const x = 466, py = 352; g.fillStyle = '#5a5248';
      for (let k = 0; k < 22; k++) { R(g, x - 4 - k * 2, py + 6 + k * 7, 4, 8); R(g, x + k * 2, py + 6 + k * 7, 4, 8); R(g, x - 2, py + 6 + k * 7, 4, 8); }
      g.save(); g.translate(x, py); g.rotate(-.55); R(g, -50, -10, 110, 20, '#c9b48a'); R(g, -50, -10, 110, 5, '#e6d4aa'); R(g, 54, -13, 14, 26, '#8a7a5a'); R(g, -58, -7, 10, 14, '#3a3430'); g.restore();
    }
    // the hall of the space centre
    function hall(g) {
      T.bands(g, ['#1b2238', '#1f2840', '#243048', '#283652', '#2c3a5a'], 0, 472);
      for (let x = 0; x < W; x += 120) R(g, x, 0, 4, 472, '#151b2e');
      R(g, 0, 170, W, 4, '#151b2e'); R(g, 0, 330, W, 4, '#151b2e');
      for (let x = 12; x < W; x += 120) for (const y of [180, 320]) { R(g, x, y, 4, 4, '#3a4870'); R(g, x + 100, y, 4, 4, '#3a4870'); }
      // the emblem: a ring, a planet, a rocket (no words)
      T.disc(g, 480, 210, 84, 6, '#121830'); T.disc(g, 480, 210, 76, 6, '#2a4a8a'); T.disc(g, 480, 210, 60, 6, '#1d3670');
      T.disc(g, 452, 236, 26, 4, '#e0a040'); R(g, 420, 232, 64, 6, '#f4d080');
      K.sprC(g, K.SP.rocket, 500, 190, 6);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + K.t * .3; K.sprC(g, K.SP.spark, 480 + Math.cos(a) * 96, 210 + Math.sin(a) * 96, 2); }
      // consoles
      for (const x0 of [30, 700]) { R(g, x0, 380, 230, 92, '#3a4256'); R(g, x0, 372, 230, 10, '#4c566e'); R(g, x0 + 10, 300, 210, 70, '#0e1420'); R(g, x0 + 14, 304, 202, 62, '#0f2a24');
        for (let k = 0; k < 20; k++) R(g, x0 + 18 + k * 10, 334 + Math.round(Math.sin(K.t * 3 + k * .7 + x0) * 14), 6, 4, '#5af0a0');
        for (let k = 0; k < 12; k++) R(g, x0 + 14 + k * 18, 396 + (k % 2) * 16, 10, 8, Math.sin(K.t * (2 + k % 3) + k + x0) > 0 ? ['#ff4a5a', '#ffd23f', '#5af0a0', '#4ab8ff'][k % 4] : '#22283a'); }
      // floor
      R(g, 0, 472, W, 140, '#b8bec8');
      for (let r = 0; r < 5; r++) for (let c = 0; c < 26; c++) if ((r + c) % 2) R(g, c * 40 - (r * 8) % 40, 472 + r * 18, 40, 18, '#a3aab6');
      R(g, 0, 472, W, 4, '#d8dde4');
    }
    // under water, in the training pool
    function pool(g) {
      T.bands(g, ['#86d6f2', '#6cc6ec', '#52b2e2', '#3e9ed6', '#2f88c2', '#2574ac', '#1f6298'], 0, 500);
      for (let x = 0; x < W; x += 8) R(g, x, 74 + Math.round(Math.sin(x * .03 + K.t * 2) * 3), 8, 4, 'rgba(255,255,255,.7)');
      g.fillStyle = 'rgba(255,255,255,.07)'; for (let k = 0; k < 6; k++) { const x = 80 + k * 170 + Math.sin(K.t * .5 + k) * 30; g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 50, 70); g.lineTo(x + 200, 500); g.lineTo(x + 110, 500); g.closePath(); g.fill(); }
      R(g, 0, 480, W, 140, '#8fd0e4'); for (let x = 0; x < W; x += 40) R(g, x, 480, 2, 140, '#6cb4cc'); for (let y = 480; y < H; y += 20) R(g, 0, y, W, 2, '#6cb4cc');
      R(g, 0, 500, W, 10, '#1d4a7a');
      for (let k = 0; k < 6; k++) R(g, 860, 120 + k * 60, 40, 6, '#d8dde4'); R(g, 856, 90, 6, 400, '#d8dde4'); R(g, 898, 90, 6, 400, '#d8dde4');
    }
    // outdoors: the training field (trampolines) and the landing field (flags)
    function field(g) {
      sky(g, D.sky, 470);
      // the space centre far away: a dome and a tower
      T.disc(g, 820, 470, 60, 6, '#c8ccd6'); R(g, 760, 440, 120, 30, '#c8ccd6'); R(g, 700, 330, 18, 140, '#a8aebc'); R(g, 694, 320, 30, 12, '#d7262e');
      grass(g, 480);
      if (D.bunting) for (let row = 0; row < 2; row++) for (let k = 0; k < 22; k++) { const x = k * 46 - 10, y = 90 + row * 40 + Math.sin(k / 21 * Math.PI) * 40 + Math.sin(K.t * 1.5 + k) * 3;
        for (let r = 0; r < 6; r++) R(g, x + r * 2, y + r * 4, 26 - r * 4, 4, ['#ff3d8b', '#3db8ff', '#ffd23f', '#7ee0a0', '#b98cff'][(k + row) % 5]); }
    }
    // the launch site
    function site(g) {
      sky(g, D.sky, 470);
      R(g, 0, 470, W, 140, '#6a6e78'); R(g, 0, 470, W, 6, '#8a8e98');
      for (let x = 0; x < W; x += 64) R(g, x, 476, 2, 140, '#5a5e68');
      R(g, RX - 120, 486, 240, 14, '#4a4e58'); R(g, RX - 110, 480, 220, 8, '#7a7e88');
      for (let k = 0; k < 8; k++) R(g, RX - 100 + k * 28, 488, 14, 4, k % 2 ? '#ffd23f' : '#1a1a1a');
    }
    // up through the sky (the camera follows the rocket)
    function ascent(g) {
      const alt = clamp(D.cam / 2600, 0, 1), base = SKY[D.sky].c;
      for (let i = 0; i < 7; i++) { const c = alt < .5 ? mix(base[i], ['#2a56b0', '#2c5cb8', '#3466c0', '#3c70c6', '#4a7ccc', '#5888d0', '#6894d4'][i], alt * 2) : mix(['#2a56b0', '#2c5cb8', '#3466c0', '#3c70c6', '#4a7ccc', '#5888d0', '#6894d4'][i], SPACE[i], (alt - .5) * 2); R(g, 0, i * 86, W, 87, c); }
      if (alt > .3) T.stars(g, 140, 9, H, clamp((alt - .3) * 2, 0, 1));
      for (let i = 0; i < 18; i++) { const y = 420 - hash(i) * 2400 + D.cam * (.8 + hash(i + 3) * .3); if (y < -60 || y > H + 60) continue; T.cloud(g, hash(i + 5) * (W + 200) - 200, y, 8, 12 + Math.round(hash(i + 7) * 14), '#ffffff', 'rgba(150,170,200,.5)'); }
      const gy = 470 + D.cam; if (gy < H) { T.ridge(g, 2, gy - 20, 60, SKY[D.sky].m[0], 8); R(g, 0, gy, W, H, '#6a6e78'); R(g, RX - 120, gy + 16, 240, 14, '#4a4e58'); }
    }
    // space: stars, the Earth below, the moon, the sun
    function earth(g, cx, top, r) {
      const cy = top + r;
      g.globalAlpha = .18; T.disc(g, cx, cy, r + 30, 10, '#7ec8ff'); g.globalAlpha = .35; T.disc(g, cx, cy, r + 14, 8, '#9ad8ff'); g.globalAlpha = 1;
      T.disc(g, cx, cy, r, 8, '#1f5fb0');
      g.save(); g.beginPath(); g.arc(cx, cy, r - 4, 0, 7); g.clip();
      for (let i = 0; i < 30; i++) { const x = ((hash(i) * 2600 + K.t * 10) % 2600) - 800 + cx - W / 2, y = top + 10 + hash(i + 3) * 220;
        for (let k = 0; k < 8; k++) R(g, Math.round((x + hash(i * 9 + k) * 90) / 8) * 8, Math.round((y + hash(i * 5 + k) * 50) / 8) * 8, 16 + Math.round(hash(k + i) * 3) * 8, 16, hash(i + 11) < .6 ? '#4f9a48' : '#c8a868'); }
      for (let i = 0; i < 24; i++) { const x = ((hash(i + 40) * 2600 + K.t * 16) % 2600) - 800 + cx - W / 2, y = top + 6 + hash(i + 43) * 230; const cw = 40 + Math.round(hash(i) * 6) * 8; R(g, Math.round(x / 8) * 8, Math.round(y / 8) * 8, cw, 8, 'rgba(255,255,255,.85)'); R(g, Math.round(x / 8) * 8 + 8, Math.round(y / 8) * 8 - 8, cw - 24, 8, 'rgba(255,255,255,.85)'); }
      g.restore();
      R(g, 0, top + r * .02, 0, 0);
    }
    function space(g) {
      T.bands(g, SPACE, 0, H); T.stars(g, 160, 13, H);
      // the sun, low, with a glare
      if (D.sunX > -200) { g.globalAlpha = .15; T.disc(g, D.sunX, D.sunY, 140, 8, '#fff2c0'); g.globalAlpha = .3; T.disc(g, D.sunX, D.sunY, 80, 6, '#fff2c0'); g.globalAlpha = 1; T.disc(g, D.sunX, D.sunY, 40, 4, '#ffffff');
        R(g, D.sunX - 160, D.sunY - 2, 320, 4, 'rgba(255,255,240,.6)'); R(g, D.sunX - 2, D.sunY - 120, 4, 240, 'rgba(255,255,240,.4)'); }
      // the moon
      T.disc(g, 800, 150, 54, 6, '#d8d6cc'); R(g, 776, 128, 18, 18, '#b4b2a8'); R(g, 812, 160, 12, 12, '#b4b2a8'); R(g, 794, 176, 8, 8, '#b4b2a8'); R(g, 822, 124, 8, 8, '#bebcb2');
      earth(g, W / 2, D.earthTop || 400, 1100);
    }
    // inside the capsule: a big round window on the Earth
    function cabin(g) {
      R(g, 0, 0, W, H, '#cfd4dc');
      for (let x = 0; x < W; x += 96) R(g, x, 0, 4, H, '#b4bac4'); for (let y = 60; y < H; y += 110) R(g, 0, y, W, 4, '#b4bac4');
      for (let x = 8; x < W; x += 96) for (let y = 70; y < H; y += 110) { R(g, x, y, 4, 4, '#9aa0ac'); R(g, x + 80, y, 4, 4, '#9aa0ac'); }
      const wx = 330, wy = 280, wr = 150;
      g.save(); g.beginPath(); g.arc(wx, wy, wr, 0, 7); g.clip();
      T.bands(g, SPACE, wy - wr, wy + wr); T.stars(g, 60, 21, wy + wr);
      T.disc(g, wx + 90, wy - 80, 30, 5, '#d8d6cc'); R(g, wx + 80, wy - 92, 10, 10, '#b4b2a8');
      earth(g, wx + 40, wy + 20, 700);
      g.restore();
      // the smudges of a tongue on the glass
      for (const l of D.lick) { g.fillStyle = `rgba(230,240,255,${l.a})`; R(g, l.x - 10, l.y - 6, 20, 12); R(g, l.x - 6, l.y + 6, 12, 8); }
      g.globalAlpha = .12; R(g, wx - 110, wy - 120, 30, 90, '#ffffff'); R(g, wx - 80, wy - 130, 16, 40, '#ffffff'); g.globalAlpha = 1;
      for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; R(g, wx + Math.cos(a) * (wr + 8) - 9, wy + Math.sin(a) * (wr + 8) - 9, 18, 18, '#8a909c'); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; R(g, wx + Math.cos(a) * (wr + 8) - 3, wy + Math.sin(a) * (wr + 8) - 3, 6, 6, '#5a606c'); }
      // a panel full of lights, a handrail
      R(g, 600, 120, 300, 230, '#3a4256'); R(g, 610, 130, 280, 90, '#0e1420');
      for (let k = 0; k < 26; k++) R(g, 616 + k * 10, 170 + Math.round(Math.sin(K.t * 2 + k * .5) * 20), 6, 4, '#5af0a0');
      for (let k = 0; k < 18; k++) R(g, 620 + (k % 9) * 30, 240 + Math.floor(k / 9) * 40, 16, 12, Math.sin(K.t * (1.5 + k % 4) + k) > 0 ? ['#ff4a5a', '#ffd23f', '#5af0a0', '#4ab8ff'][k % 4] : '#22283a');
      R(g, 560, 400, 380, 10, '#ffd23f'); for (let x = 580; x < 940; x += 90) R(g, x, 400, 8, 40, '#d0a820');
      R(g, 0, 500, W, 100, '#9aa0ac'); R(g, 0, 500, W, 6, '#b4bac4');
    }

    /* ---------- the rocket, piece by piece ---------- */
    function piece(g, k, x, bottom, u, faces) {
      const w = 18 * u, L = x - w / 2;
      if (k === 0) {
        for (const dx of [-5, 0, 5]) { R(g, x + dx * u - 2.5 * u, bottom - 4 * u, 5 * u, 4 * u, '#4a4e58'); R(g, x + dx * u - 2 * u, bottom - 5 * u, 4 * u, u, '#2e3038'); R(g, x + dx * u - 2.5 * u, bottom - u, 5 * u, u, '#2a2c34'); }
        R(g, L + u, bottom - 10 * u, w - 2 * u, 5 * u, '#d8dce2'); R(g, L + u, bottom - 10 * u, w - 2 * u, u, '#ffffff'); R(g, L + w - 4 * u, bottom - 10 * u, 3 * u, 5 * u, '#b0b6c0');
        for (let r = 0; r < 10; r++) { const ww = Math.min(5, Math.floor(r * .6) + 1); R(g, L - ww * u, bottom - 14 * u + r * u, ww * u, u, '#d7262e'); R(g, L + w, bottom - 14 * u + r * u, ww * u, u, '#b81d24'); }
      } else if (k === 1 || k === 2) {
        const hh = PH[k] * u; R(g, L, bottom - hh, w, hh, '#eef0f2'); R(g, L, bottom - hh, 2 * u, hh, '#ffffff'); R(g, L + w - 4 * u, bottom - hh, 4 * u, hh, '#c3c8d0'); R(g, L + w - 2 * u, bottom - hh, 2 * u, hh, '#a8aeb8');
        R(g, L, bottom - u, w, u, '#9aa0ac');
        if (k === 1) { R(g, L, bottom - 16 * u, w, 3 * u, '#d7262e'); R(g, L + w - 4 * u, bottom - 16 * u, 4 * u, 3 * u, '#a81d24'); R(g, L + 4 * u, bottom - 9 * u, 3 * u, 4 * u, '#3a3e48'); }
        else { for (let c = 0; c < 6; c++) R(g, L + c * 3 * u, bottom - 12 * u, 3 * u, 3 * u, c % 2 ? '#1a1c22' : '#eef0f2'); for (let c = 0; c < 6; c++) R(g, L + c * 3 * u, bottom - 9 * u, 3 * u, 3 * u, c % 2 ? '#eef0f2' : '#1a1c22'); }
      } else if (k === 3) {
        const hh = 14 * u; R(g, L, bottom - hh, w, hh, '#b8bec8'); R(g, L, bottom - hh, 2 * u, hh, '#d4d8de'); R(g, L + w - 3 * u, bottom - hh, 3 * u, hh, '#9aa0ac'); R(g, L, bottom - u, w, u, '#7a808c');
        const who = faces || [];
        for (let i = 0; i < 3; i++) { const cx = x + (i - 1) * 6 * u, cy = bottom - 7 * u; T.disc(g, cx, cy, 2.6 * u, u * .5, '#5a606c'); T.disc(g, cx, cy, 2 * u, u * .5, '#1a3a6a');
          const f = who[i]; if (f) { g.save(); g.beginPath(); g.arc(cx, cy, 1.9 * u, 0, 7); g.clip(); g.fillStyle = '#ffd890'; g.fillRect(cx - 2 * u, cy - 2 * u, 4 * u, 4 * u);
            if (f === 'kamiel') K.A.drawLlama(g, { cx: cx + 3, feet: cy + 36, s: .22, face: -1, pose: 'stand', outfit: ['astrohelm'], eyes: D.winEyes || '' });
            else K.A.drawPet(g, { pet: f, cx: cx + 11, feet: cy + 22, s: .36, face: -1, pose: 'stand', noShadow: true });
            g.restore(); }
          R(g, cx - 1.4 * u, cy - 1.4 * u, u * .7, u * .7, 'rgba(255,255,255,.7)'); }
      } else {
        for (let r = 0; r < 12; r++) { const ww = Math.max(2, Math.round(18 - r * 1.45)); R(g, x - ww / 2 * u, bottom - (r + 1) * u, ww * u, u, '#d7262e'); R(g, x + (ww / 2 - 2) * u, bottom - (r + 1) * u, 2 * u, u, '#a81d24'); }
        R(g, x - u / 2, bottom - 14 * u, u, 2 * u, '#eef0f2');
      }
    }
    const faces = names.slice(0, 2).length ? [names[0], 'kamiel', names[1]] : [null, 'kamiel', null];
    function rocket(g, x, base, u, parts) { let y = base; for (let k = 0; k < parts; k++) { piece(g, k, x, y, u, faces); y -= PH[k] * u; } return y; }
    const rocketTop = (parts) => { let y = RBASE; for (let k = 0; k < parts; k++) y -= PH[k] * RU; return y; };
    // the gantry, the crane, the rocket, the flame
    const siteFx = fx('ground', 0, (g) => {
      const off = D.cam;
      if (D.gantry) { const gx = RX + 80, top = 90 + (RBASE - 90) * (1 - D.gantry) + off;
        for (const dx of [0, 40]) R(g, gx + dx, top, 6, RBASE - top + off, '#c84a2a');
        for (let y = top + 10; y < RBASE + off; y += 36) { R(g, gx, y, 46, 4, '#c84a2a'); for (let k = 0; k < 9; k++) R(g, gx + 4 + k * 4, y + 4 + k * 3.6, 4, 4, '#a83a20'); }
        for (const y of [RBASE - 150, RBASE - 290]) if (y + off > top) R(g, gx - 34, y + off, 36, 6, '#a83a20');
        if (Math.sin(K.t * 4) > 0) R(g, gx + 16, top - 10, 12, 10, '#ff3a3a');
        if (D.crane) { R(g, gx - 140, top, 230, 8, '#ffd23f'); for (let k = 0; k < 14; k++) R(g, gx - 136 + k * 16, top + 8, 4, 8, '#c8a020'); R(g, gx + 70, top + 8, 20, 30, '#3a3e48');
          if (D.drop) { R(g, RX - 1, top + 8, 2, D.drop.y - top - 8 - PH[D.drop.k] * RU, '#2a2c34'); R(g, RX - 6, D.drop.y - PH[D.drop.k] * RU - 8, 12, 8, '#3a3e48'); } }
      }
      if (D.parts > 0 || D.drop) {
        const ry = RBASE - D.ry + off;
        if (D.fire > 0) { for (let k = 0; k < 3; k++) { const fx0 = RX + (k - 1) * 5 * RU, len = (40 + 160 * D.fire) * (.8 + .4 * rnd());
          for (let j = 0; j < len; j += 8) { const wdt = (4 * RU) * (1 - j / len * .6); R(g, fx0 - wdt / 2 + (rnd() - .5) * 6, ry + j, wdt, 8, j < len * .3 ? '#fff6d0' : j < len * .6 ? '#ffd23f' : '#ff7a20'); } } }
        if (D.sep < 1) rocket(g, RX, ry, RU, D.parts);
        else { piece(g, 2, RX, ry - (PH[0] + PH[1]) * RU, RU); piece(g, 3, RX, ry - (PH[0] + PH[1] + PH[2]) * RU, RU, faces); piece(g, 4, RX, ry - (PH[0] + PH[1] + PH[2] + PH[3]) * RU, RU);
          const sy = ry + D.sepY; g.save(); g.translate(RX, sy); g.rotate(D.sepY / 900); piece(g, 0, 0, 0, RU); piece(g, 1, 0, -PH[0] * RU, RU); g.restore(); }
        if (D.drop) piece(g, D.drop.k, RX, D.drop.y, RU, faces);
      }
    });

    /* ---------- the cast and their gear ---------- */
    const gang = names.map((n, i) => { const a = K.pet(n, i % 2 ? 1 : -1); a.gear = {}; return a; });
    const byName = (n) => gang.find(a => a.pet === n);
    const first = gang[0];
    function petDeco(a) {
      return (g, at, u, w, h) => {
        const gr = a.gear;
        if (gr.medal) { const x = -w / 2 + 7 * u, y = -h * .42; R(g, x - u, y - 5 * u, u, 5 * u, '#d7262e'); R(g, x + u, y - 5 * u, u, 5 * u, '#3db8ff'); T.disc(g, x + .5 * u, y + 1.5 * u, 2.2 * u, u * .5, '#ffd23f'); R(g, x - .2 * u, y + .6 * u, u, u, '#fff2a0'); }
        if (gr.carrot) { const n = at('nose'), L = gr.carrot; R(g, n.x - (2 + 5 * L) * u, n.y - u * .2, 5 * L * u, 1.6 * u, '#ff8a2a'); R(g, n.x - (2 + 5 * L) * u, n.y + .6 * u, 5 * L * u, .8 * u, '#e06a10'); R(g, n.x - 1.6 * u, n.y - u, 1.4 * u, u, '#4fbf4a'); R(g, n.x - 1 * u, n.y - 1.8 * u, u, u, '#3e9a3a'); }
        if (gr.wrench) { const n = at('nose'); R(g, n.x - 9 * u, n.y, 9 * u, 1.2 * u, '#9aa0ac'); R(g, n.x - 11 * u, n.y - u, 2.4 * u, 3.2 * u, '#9aa0ac'); R(g, n.x - 10.6 * u, n.y - .2 * u, 1.2 * u, 1.4 * u, 'rgba(0,0,0,0)'); }
        if (gr.helm) { const e = at('eye'), cx = e.x + 2 * u, cy = e.y - 3 * u, rr = 10.5 * u;
          g.fillStyle = 'rgba(190,225,255,.22)'; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill();
          for (let k = 0; k < 40; k++) { const an = k / 40 * Math.PI * 2; R(g, cx + Math.cos(an) * rr - u * .5, cy + Math.sin(an) * rr - u * .5, u, u, 'rgba(235,245,255,.85)'); }
          R(g, cx - rr * .55, cy - rr * .6, 2 * u, u, '#ffffff'); R(g, cx - rr * .7, cy - rr * .4, u, 2 * u, '#ffffff'); R(g, cx - rr * .45, cy + rr * .9, rr * .9, 1.5 * u, '#c9ced8'); }
      };
    }
    gang.forEach(a => { a.deco = petDeco(a); });
    // floating (no gravity): a list of who floats where
    const floaters = [];
    const floatFx = fx('sky', 0, () => { for (const f of floaters) { const v = Math.sin(K.t * f.sp + f.ph);
      if (f.a === kam) { kam.feet = f.by + v * f.amp; kam.r = Math.sin(K.t * .45 + f.ph) * f.rot; } else { f.a.lift = f.by + v * f.amp; f.a.r = Math.sin(K.t * .55 + f.ph) * f.rot + (f.flip || 0); f.a.cx += (f.vx || 0) * K.dt; } } });
    const floatOn = (a, by, o) => { const f = Object.assign({ a, by, ph: rnd() * 6, sp: .8 + rnd() * .6, amp: 14, rot: .25 }, o || {}); floaters.push(f); if (a.pet) { a.noShadow = true; hold(a, 'jump'); } return f; };
    const floatOff = () => { floaters.forEach(f => { if (f.a === kam) { kam.feet = null; kam.r = 0; } else { f.a.lift = 0; f.a.r = 0; f.a.noShadow = false; hold(f.a, null); } }); floaters.length = 0; };
    const bubbles = K.particles('front', { emit: (ps) => { if (!D.bub) return; for (const f of floaters) if (rnd() < .06) { const p = f.a === kam ? K.kp(60, 360) : headOf(f.a); ps.push(K.P({ x: p.x, y: p.y, vx: (rnd() - .5) * 20, vy: -60 - rnd() * 40, life: 3, sz: 4 + rnd() * 6 })); } },
      draw: (g, p) => { if (p.y < 80) return; const s = Math.round(p.sz / 2) * 2; g.fillStyle = 'rgba(230,248,255,.75)'; g.fillRect(Math.round(p.x + Math.sin(p.age * 6) * 4), Math.round(p.y), s, s); } });
    const line = (spots) => gang.forEach((a, i) => { a.cx = spots[i]; a.face = -1; a.alpha = 1; hold(a, null); a.lift = 0; a.r = 0; a.sq = 1; a.sx = 1; a.eyes = ''; });

    /* ================= PROLOGUE: a night on the hill ================= */
    K.stage(hill); D.sunX = 720; D.sunY = 170;
    kam.x = -120; kam.face = 1; kam.head = -.25; kam.eyes = '';
    gang.forEach((a, i) => { a.cx = W / 2 - 300 - i * 60; a.face = 1; a.alpha = 0; });
    K.lens({ z: 1.8, cx: 720, cy: 200 }, 0);
    yield* K.opening('MISSIE KAMIEL', 'EEN RUIMTEFILM', 'nacht');
    K.grade('nacht', .45, .01); K.setv('dark', .15, .01);
    const moonL = K.light(() => ({ x: D.sunX, y: D.sunY }), 260, { col: '220,225,255', a: .7 });
    const kamL = K.light(() => ({ x: K.kx(), y: 380 }), 260, { a: .7 });
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 5);
    yield* wait(1.5); kam.head = -.35; emote('dots', 2); yield* wait(2.2);
    // through the telescope
    const scope = fx('screen', 0, (g) => { if (!D.scope) return; g.globalAlpha = D.scope; R(g, 0, 0, W, H, '#05060c');
      const cx = 480 + Math.sin(K.t * .7) * 8, cy = 300 + Math.cos(K.t * .5) * 6; T.disc(g, cx, cy, 230, 10, '#0a0c18'); T.disc(g, cx + 20, cy + 10, 190, 10, '#e8e4d4');
      for (let i = 0; i < 9; i++) T.disc(g, cx + 20 + (hash(i) - .5) * 260, cy + 10 + (hash(i + 4) - .5) * 260, 12 + hash(i + 8) * 26, 6, '#c4c0b0');
      g.fillStyle = '#05060c'; g.beginPath(); g.rect(0, 0, W, H); g.arc(480, 300, 220, 0, 7, true); g.fill();
      R(g, 476, 90, 8, 420, 'rgba(255,60,60,.4)'); R(g, 270, 296, 420, 8, 'rgba(255,60,60,.4)'); g.globalAlpha = 1; });
    yield* tween(1, p => { D.scope = p; }); yield* wait(3.5); yield* tween(.8, p => { D.scope = 1 - p; }); D.scope = 0;
    kam.head = 0; kam.eyes = 'groot'; emote('rocket', 2.4); yield* wait(2.5);   // an idea!
    kam.eyes = 'blij'; yield* hop(30, .4); yield* hop(30, .4);
    // the housemates come running
    gang.forEach(a => { a.alpha = 1; });
    yield* par(...gang.map((a, i) => petTo(a, K.kx() - 120 - i * 64, K.PET[a.pet].run)));
    gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); emote('?', 1.6, a); }); kam.face = -1; yield* wait(1.8);
    kam.face = 1; kam.head = -.3; gang.forEach(a => { a.head = -.2; }); yield* wait(1.2);
    gang.forEach(a => { emote('!', 1.2, a); }); yield* par(...gang.map(a => petJump(a, 30, .4)));
    gang.forEach(a => emote('hearts', 2, a)); yield* wait(2);
    K.unlight(moonL); K.unlight(kamL);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 1', 'DE SELECTIE', 2.6, { size: 44 });

    /* ================= THE SELECTION: chair, beam, centrifuge ================= */
    K.stage(hall); K.setv('dark', 0, .01); K.grade('koud', .35, .01); K.lens({ z: 1, cx: W / 2, cy: 300 }, 0);
    kam.x = 260; kam.face = -1; kam.head = 0; kam.eyes = '';
    line(gang.map((a, i) => 60 + i * 62)); gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); });
    const heidi = K.heidi(-1, { cx: -140, face: 1, eyes: 'vies' });
    // the spinning chair
    const CH = { x: 470, seat: FEET - 70 };
    const chairFx = fx('ground', 0, (g) => { if (!D.chair) return; const x = CH.x;
      R(g, x - 6, CH.seat, 12, FEET - CH.seat - 14, '#5a606c'); R(g, x - 50, FEET - 18, 100, 8, '#3a3e48'); for (const dx of [-50, 42]) R(g, dx + x, FEET - 12, 8, 8, '#22252c');
      R(g, x - 52, CH.seat - 6, 104, 10, '#2a5a9a'); R(g, x - 52, CH.seat - 6, 104, 3, '#4a8ad0');
      if (D.spin > 0) { g.fillStyle = `rgba(255,255,255,${.6 * D.spin})`; for (let k = 0; k < 6; k++) { const a = K.t * 14 + k; R(g, x + Math.cos(a) * 80 - 12, CH.seat - 40 - k * 12 + Math.sin(a) * 6, 24, 3); } } });
    D.chair = 1;
    yield* K.fadeIn(1.4);
    yield* wait(.8);
    function* spinChair(a, secs) {
      const isK = a === kam; if (isK) { kam.x = CH.x - W / 2; kam.feet = CH.seat - 2; } else { a.cx = CH.x; a.feet = CH.seat; a.noShadow = true; hold(a, sitOf(a)); }
      yield* wait(.5);
      yield* tween(secs, p => { D.spin = Math.min(1, p * 3); const f = Math.sin(K.t * (6 + 30 * p)) > 0 ? 1 : -1; if (isK) kam.face = f; else a.face = f; });
      D.spin = 0;
    }
    function* wobble(a, secs, d) {   // dizzy walking
      if (a === kam) { kam.feet = null; kam.eyes = 'spiraal'; yield* par(walkTo(kam.x + d * 160, 40), tween(secs, p => { kam.r = Math.sin(p * 18) * .15; })); kam.r = 0; return; }
      a.feet = FEET; a.noShadow = false; hold(a, null); emote('stars', secs, a);
      yield* par(petTo(a, a.cx + d * 160, 50), tween(secs, p => { a.r = Math.sin(p * 20) * .25; })); a.r = 0;
    }
    const testers = gang.slice(0, 3);
    for (const a of testers) {
      yield* petTo(a, CH.x, K.PET[a.pet].run);
      yield* spinChair(a, 2.6);
      if (a.pet === 'snoet' || a.pet === 'wifi') { a.feet = FEET; a.noShadow = false; hold(a, null); emote('hearts', 1.8, a); yield* petJump(a, 30, .35); yield* petJump(a, 30, .35); yield* petTo(a, 660 + testers.indexOf(a) * 50, 120); }   // more! more!
      else if (a.pet === 'pippa') { yield* wobble(a, 1.8, 1); emote('angry', 1.8, a); yield* wait(.6); }
      else { yield* wobble(a, 1.8, 1); }
      a.face = -1; hold(a, sitOf(a));
    }
    // and the commander himself
    yield* walkTo(CH.x - W / 2, 60); kam.face = -1; yield* spinChair(kam, 3.2);
    yield* K.lensW({ z: 2, cx: K.kx() - 20, cy: 300 }, .5); kam.eyes = 'spiraal'; yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .5);
    yield* wobble(kam, 2, 1); emote('stars', 2); yield* wait(1.4); kam.eyes = '';
    gang.forEach(a => { if (rnd() < .6) emote('notes', 1.6, a); }); yield* wait(1);
    // the centrifuge
    yield* K.cut(() => { D.chair = 0; D.fuge = 1; kam.x = 400; kam.face = -1; kam.feet = null; gang.forEach((a, i) => { a.feet = FEET; a.noShadow = false; a.cx = 40 + i * 50; a.face = 1; hold(a, sitOf(a)); a.layer = 'front'; }); });
    const riders = gang.length > 1 ? [gang.find(a => a.pet === 'snoet') || gang[0], gang.find(a => a.pet === 'dobby' && a !== gang[0]) || gang[1]] : gang.slice(0, 1);
    riders.forEach(a => { a.layer = 'back'; });
    const FU = { cx: 470, y: 300, L: 260 };
    const capPos = (i) => { const an = D.fa + i * Math.PI; return { x: FU.cx + Math.cos(an) * FU.L, z: Math.sin(an) }; };
    const fugeFx = fx('ground', 0, (g) => { if (!D.fuge) return;
      R(g, FU.cx - 20, FU.y, 40, 472 - FU.y, '#4a4e58'); R(g, FU.cx - 60, 460, 120, 14, '#3a3e48'); R(g, FU.cx - 30, FU.y - 14, 60, 18, '#ffd23f');
      for (let i = 0; i < 2; i++) { const p = capPos(i), s = 1 + p.z * .18, x = p.x;
        R(g, Math.min(FU.cx, x), FU.y - 6, Math.abs(x - FU.cx), 12 * s, '#8a909c');
        R(g, x - 60 * s, FU.y + 10, 120 * s, 100 * s, p.z < 0 ? '#3a4a6a' : '#4a5e88'); R(g, x - 54 * s, FU.y + 16, 108 * s, 88 * s, p.z < 0 ? '#1a2a44' : '#22385c'); R(g, x - 8, FU.y + 4, 16, 8, '#5a606c'); } });
    const fugeFront = fx('front', 0, (g) => { if (!D.fuge) return; for (let i = 0; i < riders.length; i++) { const p = capPos(i), s = 1 + p.z * .18, x = p.x;
      R(g, x - 54 * s, FU.y + 16, 108 * s, 88 * s, 'rgba(180,220,255,.16)'); R(g, x - 50 * s, FU.y + 20, 12 * s, 40 * s, 'rgba(255,255,255,.3)');
      if (D.spin > .5) { g.fillStyle = 'rgba(255,255,255,.45)'; for (let k = 0; k < 4; k++) R(g, x - p.z * 0 - 140 * Math.sign(Math.cos(D.fa + i * Math.PI) || 1) * -1 - 60, FU.y + 30 + k * 18, 70, 3); } } });
    const rideFx = fx('sky', 0, () => { if (!D.fuge) return; riders.forEach((a, i) => { const p = capPos(i); a.cx = p.x; a.feet = FU.y + 100 * (1 + p.z * .18); a.s = K.PET[a.pet].s * (.8 + p.z * .14); a.noShadow = true; a.alpha = p.z < -.2 ? .55 : 1; }); });
    riders.forEach(a => hold(a, 'down'));
    yield* K.lensW({ z: 1.1, cx: W / 2, cy: 320 }, .5);
    yield* tween(2, p => { D.fa += p * 4 * K.dt; });
    D.spin = 1; yield* tween(4, p => { D.fa += (4 + 8 * p) * K.dt; riders.forEach(a => { a.sq = 1 - .25 * p; a.sx = 1 + .2 * p; }); });
    // a close-up of a squashed face
    const rf = riders[0];
    yield* K.cut(() => { K.lens({ z: 2.4, cx: FU.cx, cy: FU.y + 50 }, 0); D.fa = Math.PI / 2; }, .15);   // a close-up of a squashed face
    const blur = fx('screen', 2.8, (g) => { g.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 12; k++) R(g, ((K.t * 2400 + k * 230) % (W + 300)) - 150, 90 + k * 36, 140, 4); });
    emote('sweat', 2.6, rf); rf.eyes = 'groot'; yield* wait(2.8); stop(blur); rf.eyes = '';
    yield* K.cut(() => K.lens({ z: 1.1, cx: W / 2, cy: 320 }, 0), .15);
    yield* tween(3, p => { D.fa += 12 * (1 - p) * K.dt; riders.forEach(a => { a.sq = .75 + .25 * p; a.sx = 1.2 - .2 * p; }); }); D.spin = 0;
    stop(rideFx); D.fuge = 0;
    riders.forEach((a, i) => { a.s = K.PET[a.pet].s; a.alpha = 1; a.feet = FEET; a.noShadow = false; a.cx = 360 + i * 230; a.layer = 'front'; a.sq = 1; a.sx = 1; hold(a, null); a.face = -1; });
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .4);
    riders.forEach(a => emote('stars', 2.4, a)); yield* par(...riders.map(a => tween(2.4, p => { a.r = Math.sin(p * 16) * .3 * (1 - p); }))); riders.forEach(a => { a.r = 0; });
    if (riders[0] && riders[0].pet === 'snoet') { emote('hearts', 2, riders[0]); yield* petJump(riders[0], 40, .4); }
    // Heidi takes one look at the machine, and leaves. She is not going.
    yield* K.actorTo(heidi, 140, 70); heidi.pose = 'stand'; heidi.face = 1; yield* wait(1.4); emote('dots', 1.8, heidi); yield* wait(1.8);
    heidi.face = -1; yield* K.actorTo(heidi, -160, 60); heidi.alpha = 0;
    kam.eyes = 'rol'; yield* wait(1.4); kam.eyes = '';
    // everyone passes: a gold star for each
    yield* K.cut(() => { line(gang.map((a, i) => 150 + i * 80)); gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); a.layer = 'front'; }); kam.x = 260; kam.face = -1; });
    for (const a of gang) { const st = fx('screen', 0, (g) => { const p = headOf(a); K.sprC(g, K.SP.star, p.x, p.y - 34 + Math.sin(K.t * 3) * 3, 4); }); a.star = st; emote('sparks', 1, a); yield* wait(.6); }
    yield* kbowS(); gang.forEach(a => emote('hearts', 1.8, a)); yield* wait(2);
    gang.forEach(a => { stop(a.star); });
    yield* K.fadeOut(1.4);
    yield* K.card('DEEL 2', 'DE TRAINING', 2.4, { size: 44 });
    function* kbowS() { yield* tween(.4, p => { kam.head = .35 * p; }); yield* wait(.5); yield* tween(.4, p => { kam.head = .35 * (1 - p); }); }

    /* ================= TRAINING: the pool, the trampolines, the space food ================= */
    K.stage(pool); K.grade('koud', .25, .01);
    K.withOutfit(['astropak', 'astrohelm']);
    gang.forEach((a, i) => { a.gear.helm = 1; a.cx = 150 + i * 130; a.face = i % 2 ? -1 : 1; a.layer = 'front'; a.feet = FEET; floatOn(a, 120 + (i % 3) * 70, { amp: 20, rot: .4 }); });
    kam.x = 230; kam.face = -1; kam.feet = 300;
    D.bub = 1;
    yield* K.fadeIn(1.4);
    yield* wait(1.5);
    // they drift; Kamiel sinks slowly to the bottom, and walks there like on the moon
    yield* tween(5, p => { kam.feet = lerp(300, FEET, ez(p)); kam.r = Math.sin(p * 6) * .1; }); kam.r = 0;
    kam.eyes = 'groot'; emote('!?', 1.6); yield* wait(1.4);
    yield* par(walkTo(60, 14, 2), K.lensW({ z: 1.4, cx: 520, cy: 340 }, 4));
    kam.eyes = 'blij'; yield* hop(140, 2.2); yield* hop(100, 1.8);
    gang.forEach(a => { if (rnd() < .7) emote('hearts', 1.6, a); });
    const flipper = gang[gang.length - 1]; if (flipper) { const f = floaters.find(q => q.a === flipper); yield* tween(2, p => { f.flip = p * Math.PI * 2; }); f.flip = 0; }
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1);
    yield* wait(1);
    D.bub = 0; floatOff();
    // the trampolines
    yield* K.cut(() => { K.stage(field); D.sky = 'day'; D.sunX = 760; D.sunY = 150; D.tramp = 1; K.grade('warm', .4, .01);
      line(gang.map((a, i) => 140 + i * 150)); gang.forEach(a => { a.gear.helm = 0; a.layer = 'front'; }); kam.outfit = null; K.withOutfit(['astropak']); kam.x = 360; kam.face = -1; kam.feet = null; }, .4);
    const trs = gang.map(a => a.cx).concat([K.kx()]);
    const trFx = fx('ground', 0, (g) => { if (!D.tramp) return; trs.forEach((x, i) => { const sg = D.sag[i] || 0, wd = i === trs.length - 1 ? 120 : 80;
      for (const dx of [-wd / 2, wd / 2 - 8]) R(g, x + dx, FEET - 40, 8, 40, '#2a2c34');
      g.fillStyle = '#1a1c22'; g.beginPath(); g.moveTo(x - wd / 2, FEET - 40); g.quadraticCurveTo(x, FEET - 40 + sg * 30, x + wd / 2, FEET - 40); g.lineTo(x + wd / 2, FEET - 34); g.quadraticCurveTo(x, FEET - 34 + sg * 30, x - wd / 2, FEET - 34); g.fill();
      R(g, x - wd / 2 - 4, FEET - 44, wd + 8, 6, '#3db8ff'); }); });
    function* bounce(a, i, n, hgt) {
      for (let k = 0; k < n; k++) { D.sag[i] = 1; a.feet = FEET - 36; hold(a, 'down'); yield* wait(.12); D.sag[i] = 0; hold(a, 'jump');
        const hh = hgt * (.7 + rnd() * .5), flip = rnd() < .35;
        yield* tween(.9 + hh / 400, p => { a.lift = Math.sin(p * Math.PI) * hh; if (flip) a.r = p * Math.PI * 2 * (a.face > 0 ? 1 : -1); }); a.r = 0; a.lift = 0; }
      hold(a, null);
    }
    gang.forEach(a => { a.feet = FEET - 36; a.noShadow = true; });
    yield* wait(.6);
    yield* par(...gang.map((a, i) => (function* () { yield* wait(i * .25); yield* bounce(a, i, 4, 160); })()));
    // a really high one: the camera goes along
    const hi = byName('dobby') || first;
    if (hi) { const i = gang.indexOf(hi); D.sag[i] = 1; hold(hi, 'down'); yield* wait(.3); D.sag[i] = 0; hold(hi, 'jump');
      yield* par(tween(2.6, p => { hi.lift = Math.sin(p * Math.PI) * 380; hi.r = Math.sin(p * Math.PI) * .6; }), (function* () { yield* K.lensW({ z: 1.5, cx: hi.cx, cy: 220 }, 1.2); yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.4); })());
      hi.lift = 0; hi.r = 0; hold(hi, null); emote('hearts', 1.8, hi); }
    // the commander tries: the trampoline sags all the way… and then
    const ki = trs.length - 1; kam.feet = FEET - 36;
    yield* tween(1.2, p => { D.sag[ki] = 1 + p * 1.6; kam.feet = FEET - 36 + p * 30; }); kam.eyes = 'groot'; emote('sweat', 1.2); yield* wait(.4);
    D.sag[ki] = 0; const sl = T.speed(1, 1.4);
    yield* tween(.9, p => { kam.feet = FEET - 6 - 700 * ez(p); });
    gang.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; hold(a, sitOf(a)); a.feet = FEET - 36; emote('!', 1.2, a); }); yield* wait(1.4);
    gang.forEach(a => { a.head = -.2; }); yield* wait(1.2);
    yield* tween(.8, p => { kam.feet = -200 + (FEET - 30 + 200) * p * p; }); kam.feet = FEET - 36;
    K.lens({ shake: 8 }, 0); T.puff(K.kx(), FEET - 30, 18); kam.sq = .8; yield* wait(.15); kam.sq = 1; K.lens({ shake: 0 }, .4);
    kam.eyes = 'x'; emote('stars', 2.4); yield* wait(2.4); kam.eyes = 'blij';
    gang.forEach(a => { a.feet = FEET; a.noShadow = false; hold(a, null); emote('hearts', 1.6, a); }); kam.feet = null; yield* wait(1.4);
    // space food
    yield* K.cut(() => { D.tramp = 0; K.stage(hall); K.grade('koud', .3, .01); D.food = 1; line(gang.map((a, i) => 200 + i * 75)); gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); }); kam.x = 220; kam.face = -1; kam.eyes = ''; }, .4);
    const tray = { items: gang.map((a, i) => ({ x: a.cx + 30, kind: a.pet === 'dobby' ? 'carrot' : ['tube', 'cube', 'tube', 'cube'][i % 4], on: 1 })) };
    const foodFx = fx('back', 0, (g) => { if (!D.food) return; R(g, 140, FEET - 26, gang.length * 75 + 140, 8, '#d8dde4');
      for (const it of tray.items) { if (!it.on) continue; const x = it.x, y = FEET - 32;
        if (it.kind === 'tube') { R(g, x - 6, y - 26, 12, 26, '#e8eaee'); R(g, x - 6, y - 16, 12, 6, '#4ab8ff'); R(g, x - 3, y - 30, 6, 4, '#3a3e48'); }
        else if (it.kind === 'cube') { R(g, x - 10, y - 16, 20, 16, '#c87ad8'); R(g, x - 10, y - 16, 20, 4, '#e0a4ee'); R(g, x - 12, y - 18, 24, 2, 'rgba(255,255,255,.6)'); }
        else { R(g, x - 16, y - 8, 26, 7, '#ff8a2a'); R(g, x + 10, y - 10, 6, 4, '#4fbf4a'); R(g, x - 18, y - 12, 38, 14, 'rgba(220,240,255,.35)'); } } });
    yield* wait(1.2);
    // the commander: a tube, squeezed. a face.
    yield* K.lensW({ z: 2, cx: K.kx() - 40, cy: 320 }, .8); kam.mouth = .6; yield* wait(.5); kam.mouth = 0; kam.eyes = 'vies'; emote('sweat', 1.6); yield* wait(1.8); kam.eyes = '';
    yield* K.lensW({ z: 1.2, cx: W / 2 - 60, cy: 380 }, .8);
    for (const [i, a] of gang.entries()) {
      const it = tray.items[i]; a.face = 1; hold(a, 'down'); yield* wait(.5);
      if (a.pet === 'pippa') { hold(a, sitOf(a)); emote('angry', 1.4, a); a.face = -1; }
      else if (a.pet === 'wifi') { it.on = 0; hold(a, sitOf(a)); emote('hearts', 1.4, a); const nb = tray.items[i + 1]; if (nb && nb.kind !== 'carrot') { yield* wait(.4); a.face = 1; nb.on = 0; emote('notes', 1.2, a); } }
      else if (a.pet === 'dobby') { it.on = 0; a.gear.carrot = 1; hold(a, sitOf(a)); emote('heart', 1.4, a); }
      else if (a.pet === 'pebbels') { hold(a, sitOf(a)); a.eyes = 'groot'; yield* petJump(a, 30, .3); a.eyes = ''; emote('?', 1.2, a); }
      else { it.on = 0; hold(a, sitOf(a)); emote('notes', 1.2, a); }
      yield* wait(.9);
    }
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .6); yield* wait(1);
    yield* K.fadeOut(1.4);
    D.food = 0; gang.forEach(a => { a.gear.carrot = 0; });
    yield* K.card('DEEL 3', 'DE RAKET', 2.4, { size: 44 });

    /* ================= BUILDING THE ROCKET: piece by piece, day and night ================= */
    K.stage(site); D.sky = 'day'; D.sunX = 200; D.sunY = 160; K.grade('warm', .4, .01); D.gantry = 0; D.crane = 0; D.parts = 0;
    kam.outfit = null; K.withOutfit(['stofbril']); kam.x = -200; kam.face = 1; kam.eyes = '';
    line(gang.map((a, i) => 80 + i * 60)); gang.forEach(a => { a.face = 1; a.layer = 'front'; });
    const worker = byName('wifi') || first; if (worker) worker.gear.wrench = 1;
    yield* K.fadeIn(1.4);
    // the gantry rises out of the ground
    yield* tween(3, p => { D.gantry = ez(p); }); D.crane = 1; yield* wait(.6);
    const weld = { on: 0, x: RX, y: RBASE };
    const sparks = K.particles('front', { emit: (ps) => { if (!weld.on) return; for (let k = 0; k < 3; k++) ps.push(K.P({ x: weld.x, y: weld.y, vx: (rnd() - .5) * 260, vy: -80 - rnd() * 160, grav: 600, life: .5 + rnd() * .5 })); },
      draw: (g, p, k) => { g.fillStyle = k < .5 ? '#fff6c0' : '#ffb040'; g.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); } });
    const weldL = K.light(() => weld.on ? { x: weld.x, y: weld.y } : null, 150, { col: '170,210,255', flicker: .5 });
    const days = ['day', 'dusk', 'night', 'dawn', 'day'];
    for (let k = 0; k < 5; k++) {
      // time passes: the sky changes
      D.sky = days[k]; D.sunX = [200, 760, 720, 160, 480][k]; D.sunY = [160, 420, 150, 430, 130][k];
      K.grade(['warm', 'goud', 'nacht', 'goud', 'warm'][k], [.4, .7, .45, .7, .4][k], .6); K.setv('dark', days[k] === 'night' ? .3 : 0, .6);
      // the crane lowers the next piece
      const top = rocketTop(k);
      D.drop = { k, y: 120 };
      yield* tween(2.2, p => { D.drop.y = lerp(120 - PH[k] * RU, top, ez(p)); });
      D.drop = null; D.parts = k + 1;
      // welding, with goggles; the others help
      weld.on = 1; weld.x = RX - 40; weld.y = top;
      const helpers = gang.length ? [gang[k % gang.length]] : [];
      yield* par(walkTo(RX - 120 - W / 2, 80), ...helpers.map(a => petTo(a, RX + (k % 2 ? 70 : -150), K.PET[a.pet].run)));
      kam.face = 1; kam.head = top < 300 ? -.3 : .1;
      const flick = fx('sky', 0, () => { weld.x = RX - 40 + Math.sin(K.t * 7) * 30; });
      if (k === 2 && worker) { emote('notes', 1.4, worker); }
      if (k === 1) { const d = gang[gang.length - 1]; if (d) { hold(d, 'down'); emote('zzz', 2.4, d); } }
      yield* wait(2.2); stop(flick); weld.on = 0; kam.head = 0;
      gang.forEach(a => { hold(a, null); });
      if (k < 4) { yield* K.cut(() => {}, .2); }
    }
    K.unlight(weldL); K.stop(sparks); if (worker) worker.gear.wrench = 0;
    // the reveal at sunset: the camera tilts up from the engines to the nose
    D.sky = 'dusk'; D.sunX = 200; D.sunY = 430; K.grade('goud', .8, 1); K.setv('dark', 0, 1); D.crane = 0;
    kam.outfit = null; kam.x = -150; kam.face = 1; line(gang.map((a, i) => 120 + i * 50)); gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); });
    K.lens({ z: 2.2, cx: RX, cy: 470 }, 0); yield* K.cut(() => {}, .3);
    yield* K.lensW({ z: 2.2, cx: RX, cy: 140 }, 5);
    emote('sparks', 1.4); yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 2);
    kam.eyes = 'blij'; gang.forEach(a => emote('hearts', 2, a)); yield* par(...gang.map(a => petJump(a, 30, .4)), hop(30, .4)); yield* wait(1.6);
    yield* K.fadeOut(1.4);
    yield* K.card('DEEL 4', 'KLAAR VOOR DE START', 2.4, { size: 44 });

    /* ================= SUIT-UP, the walk, the countdown ================= */
    K.stage(hall); K.grade('koud', .3, .01); K.lens({ z: 1, cx: W / 2, cy: 300 }, 0); D.parts = 0; D.gantry = 0;
    kam.x = 120; kam.face = -1; kam.eyes = ''; kam.outfit = null;
    line(gang.map((a, i) => 120 + i * 70)); gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); });
    yield* K.fadeIn(1);
    // the suit, the helmet: flash, flash
    yield* K.lensW({ z: 1.8, cx: K.kx() - 10, cy: 330 }, .8);
    K.flash(.9, '255,255,255', 3); K.withOutfit(['astropak']); emote('sparks', 1.2); yield* wait(1.2);
    K.flash(.9, '255,255,255', 3); K.withOutfit(['astropak', 'astrohelm']); emote('sparks', 1.2); yield* wait(1.4);
    yield* K.lensW({ z: 1.3, cx: 300, cy: 380 }, .6);
    for (const a of gang) { K.flash(.5, '255,255,255', 4); a.gear.helm = 1; emote('sparks', .9, a); hold(a, null); yield* wait(.55); }
    if (byName('pippa')) { emote('angry', 1.2, byName('pippa')); yield* wait(.8); }
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .6);
    // the walk to the rocket, in slow motion, the sun low behind them
    yield* K.cut(() => { K.stage(site); D.sky = 'dusk'; D.sunX = 760; D.sunY = 440; D.gantry = 1; D.parts = 5; K.grade('goud', .9, .01); K.setv('ab', .35); kam.x = -420; kam.face = 1;
      gang.forEach((a, i) => { a.cx = -80 - i * 80; a.face = 1; hold(a, null); }); K.lens({ z: 1.35, cx: 300, cy: 400 }, 0); }, .5);
    const glow = K.over((g) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(255,170,80,0)'); gr.addColorStop(1, 'rgba(255,170,80,.18)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    yield* par(walkTo(-70, 34, 3), ...gang.map((a, i) => (function* () { yield* petTo(a, 320 - i * 66, 34); a.face = 1; })()), K.lensW({ z: 1.2, cx: 360, cy: 380 }, 9));
    K.setv('ab', 0, 1); K.unover(glow);
    heidi.alpha = 1; heidi.cx = W + 140; heidi.face = -1; heidi.eyes = 'vies'; heidi.layer = 'front';
    yield* K.actorTo(heidi, 820, 80); heidi.pose = 'stand'; kam.face = 1; yield* wait(.8); emote('dots', 1.4, heidi);
    yield* tween(.4, p => { heidi.head = .25 * p; }); yield* tween(.4, p => { heidi.head = .25 * (1 - p); }); yield* wait(.6);   // a nod. that's all.
    kam.eyes = 'blij'; emote('heart', 1.6); yield* wait(1.2);
    yield* K.fadeOut(1);
    // the countdown: the pad at night, the floodlights, the faces in the windows
    K.setv('dark', .3, .01); K.grade('nacht', .4, .01); D.sky = 'night'; D.sunX = 760; D.sunY = 140;
    kam.hide = true; gang.forEach(a => { a.alpha = 0; }); heidi.cx = 150; heidi.feet = FEET; heidi.face = 1; heidi.alpha = 1; heidi.eyes = '';
    const flood = [K.light(() => ({ x: RX - 220, y: 160 }), 300, { col: '220,230,255', a: .8 }), K.light(() => ({ x: RX + 200, y: 200 }), 280, { col: '220,230,255', a: .8 })];
    const beams = fx('front', 0, (g) => { if (D.cam > 300) return; g.fillStyle = 'rgba(230,240,255,.07)'; for (const [bx, by, d] of [[RX - 340, 470 + D.cam, 1], [RX + 340, 470 + D.cam, -1]]) { g.beginPath(); g.moveTo(bx, by); g.lineTo(RX - d * 10, 60 + D.cam); g.lineTo(RX + d * 70, 60 + D.cam); g.closePath(); g.fill(); R(g, bx - 16, by - 20, 32, 20, '#3a3e48'); R(g, bx - 12, by - 26, 24, 8, '#f4f8ff'); } });
    const steam = K.particles('front', { emit: (ps) => { if (D.cam > 300 || rnd() > .5 + D.fire) return; ps.push(K.P({ x: RX + (rnd() - .5) * 120, y: RBASE + D.cam - 4, vx: (rnd() < .5 ? -1 : 1) * (60 + rnd() * 120) * (1 + D.fire * 3), vy: -10 - rnd() * 30, life: 2 + rnd() * 2, sz: 18 + rnd() * 20 })); },
      draw: (g, p, k) => { const s = Math.round(p.sz * (1 + k * 2) / 8) * 8; g.fillStyle = `rgba(235,235,240,${.75 * (1 - k)})`; g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); p.vx *= .985; } });
    const count = { n: 0, a: 0 };
    const countO = K.over((g) => { if (!count.n || count.a <= 0) return; g.globalAlpha = count.a; T.digits(g, count.n, W - 150, 150, 14, '#ffe9a8', 'rgba(120,20,30,.8)'); g.globalAlpha = 1; });
    K.lens({ z: 1, cx: W / 2, cy: 300 }, 0);
    yield* K.fadeIn(1.2);
    const showN = function* (n, secs) { count.n = n; count.a = 1; yield* wait(secs || 1); count.a = 0; };
    yield* showN(10); yield* showN(9);
    // close-ups through the windows of the capsule
    const capY = rocketTop(3) - 7 * RU;
    yield* K.cut(() => K.lens({ z: 5, cx: RX, cy: capY }, 0), .12); yield* showN(8, 1.2);
    D.winEyes = 'groot'; yield* showN(7, 1);
    yield* K.cut(() => K.lens({ z: 5, cx: RX - 6 * RU, cy: capY }, 0), .12); yield* showN(6, 1.2);
    yield* K.cut(() => K.lens({ z: 5, cx: RX + 6 * RU, cy: capY }, 0), .12); yield* showN(5, 1.2);
    yield* K.cut(() => K.lens({ z: 2.6, cx: heidi.cx + 10, cy: FEET - 140 }, 0), .12); yield* showN(4, 1.2);   // Heidi, chewing
    yield* K.cut(() => K.lens({ z: 1.6, cx: RX, cy: 420 }, 0), .12);
    D.fire = .1; yield* showN(3, 1); D.fire = .3; yield* showN(2, 1); D.fire = .6; K.lens({ shake: 3 }, 0); yield* showN(1, 1.2);
    K.unover(countO);

    /* ================= LIFT-OFF ================= */
    K.lens({ z: 1, cx: W / 2, cy: 300, shake: 6 }, 0); D.fire = 1; K.flash(.8, '255,220,150', 1.5); K.setv('dark', .1, .5); K.grade('goud', .7, .5);
    const fireL = K.light(() => ({ x: RX, y: RBASE - D.ry + D.cam + 40 }), 420, { col: '255,170,60', flicker: .2 });
    yield* wait(1.5);
    yield* tween(2.6, p => { D.ry = 90 * p * p; heidi.r = -.1 * p; });   // slowly at first
    emote('!', 1.6, heidi);
    // then faster and faster; the camera follows it up
    K.unstage(); K.stage(ascent); heidi.layer = 'front';
    const exh = K.particles('front', { emit: (ps) => { if (D.fire <= 0 || D.ry < 20) return; for (let k = 0; k < 2; k++) ps.push(K.P({ x: RX + (rnd() - .5) * 60, y: RBASE - D.ry + D.cam + 60, vx: (rnd() - .5) * 60, vy: D.vcam * .9 + 60, life: 1.6, sz: 16 + rnd() * 14 })); },
      draw: (g, p, k) => { const s = Math.round(p.sz * (1 + k * 1.5) / 8) * 8; g.fillStyle = `rgba(240,236,230,${.7 * (1 - k)})`; g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); } });
    let last = D.cam;
    yield* tween(14, p => { const e = p * p; D.ry = 90 + 5200 * e + 60 * p; D.cam = Math.max(0, D.ry - 90); D.vcam = (D.cam - last) / Math.max(.001, K.dt); last = D.cam; heidi.feet = FEET + D.cam;
      K.lensNow.shake = 6 * (1 - p) + 1; if (p > .55 && !D.sep) { D.sep = 1; K.flash(.5, '255,240,200', 2); } if (D.sep) D.sepY += 260 * K.dt; });
    K.lens({ shake: 0 }, .5); heidi.alpha = 0;
    yield* wait(1.5);
    K.unlight(fireL); flood.forEach(l => K.unlight(l)); K.stop(steam); stop(beams);
    yield* K.fadeOut(1.2);
    K.stop(exh); D.fire = 0;
    yield* K.card('DEEL 5', 'IN DE RUIMTE', 2.4, { size: 44 });

    /* ================= IN SPACE: the cabin, the carrot, the window, the spacewalk ================= */
    K.unstage(); K.stage(cabin); K.setv('dark', 0, .01); K.grade('ruimte', .5, .01); K.lens({ z: 1, cx: W / 2, cy: 300 }, 0);
    D.parts = 0; D.gantry = 0; D.sep = 0; D.cam = 0; D.ry = 0;
    kam.hide = false; kam.x = 220; kam.face = -1; kam.eyes = 'groot'; K.withOutfit(['astropak', 'astrohelm']);
    gang.forEach((a, i) => { a.alpha = 1; a.layer = 'front'; a.cx = 120 + i * 120; a.face = i % 2 ? -1 : 1; a.feet = FEET; a.gear.helm = 0; floatOn(a, 80 + (i % 3) * 90, { amp: 18, rot: .5 }); });
    floatOn(kam, FEET - 120, { amp: 16, rot: .12 });
    yield* K.fadeIn(1.6);
    yield* wait(1.4); kam.eyes = 'blij'; emote('hearts', 1.8); gang.forEach(a => { if (rnd() < .6) emote('!', 1, a); }); yield* wait(2);
    // the view: everyone drifts to the window
    yield* K.lensW({ z: 1.6, cx: 330, cy: 280 }, 2.4); yield* wait(2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1.2);
    // Dobby and his carrot (or whoever was hungry)
    const dob = byName('dobby');
    if (dob) {
      dob.gear.carrot = 1; const f = floaters.find(q => q.a === dob);
      yield* K.lensW({ z: 1.8, cx: dob.cx, cy: FEET - 60 - f.by }, 1);
      for (let k = 0; k < 3; k++) { dob.gear.carrot = 1 - k * .2; dob.sq = .96; yield* wait(.3); dob.sq = 1; yield* wait(.4); }
      // it floats away from him; he paddles after it
      dob.gear.carrot = 0; const car = { x: K.A.petPoint(dob, 'nose').x - 20, y: K.A.petPoint(dob, 'nose').y, r: 0 };
      const carFx = fx('front', 0, (g) => { g.save(); g.translate(car.x, car.y); g.rotate(car.r); R(g, -12, -3, 22, 6, '#ff8a2a'); R(g, 10, -5, 6, 3, '#4fbf4a'); R(g, 10, 1, 5, 3, '#3e9a3a'); g.restore(); });
      dob.eyes = 'groot'; emote('!', 1, dob);
      yield* par(tween(3.4, p => { car.x -= 60 * K.dt; car.y -= 10 * K.dt; car.r += 1.5 * K.dt; }), (function* () { yield* wait(.6); f.vx = -54; dob.face = -1; })(), K.lensW({ z: 1.4, cx: dob.cx - 120, cy: 300 }, 3));
      f.vx = 0; dob.eyes = ''; stop(carFx); dob.gear.carrot = .6; emote('heart', 1.6, dob); yield* wait(1.4);
      yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 1);
    }
    // Snoet licks the window
    const sn = byName('snoet') || byName('wifi');
    if (sn) {
      const f = floaters.find(q => q.a === sn); const fi = floaters.indexOf(f); if (fi >= 0) floaters.splice(fi, 1);
      yield* tween(1.4, p => { sn.cx = lerp(sn.cx, 360, .08); sn.lift = lerp(sn.lift, 150, .08); sn.r = lerp(sn.r, -.5, .08); }); sn.face = -1;
      yield* K.lensW({ z: 2, cx: 360, cy: FEET - 230 }, .8);
      const tongue = fx('front', 0, (g) => { const n = K.A.petPoint(sn, 'nose'), l = Math.abs(Math.sin(K.t * 9)); R(g, n.x - 4 - l * 8, n.y - 2, 8 + l * 8, 7, '#ff6f8f'); });
      for (let k = 0; k < 6; k++) { const n = K.A.petPoint(sn, 'nose'); D.lick.push({ x: n.x - 10 + (rnd() - .5) * 40, y: n.y - 20 + (rnd() - .5) * 40, a: .55 }); sn.cx += (k % 2 ? 6 : -6); yield* wait(.4); }
      stop(tongue); emote('hearts', 1.6, sn); yield* wait(1);
      kam.eyes = 'rol'; yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, .8); yield* wait(1.4); kam.eyes = '';
      floatOn(sn, 150, { amp: 16, rot: .4 });
    }
    // Pippa floats upside down, offended
    const pip = byName('pippa');
    if (pip) { const f = floaters.find(q => q.a === pip); yield* tween(1.6, p => { f.flip = p * Math.PI; }); emote('angry', 1.8, pip); yield* wait(2); yield* tween(1.2, p => { f.flip = Math.PI * (1 - p); }); f.flip = 0; }
    yield* wait(1);
    yield* K.fadeOut(1);
    floatOff();
    // the spacewalk: outside, on a line, over the Earth
    K.stage(space); D.earthTop = 380; D.sunX = -300; D.sunY = 420; K.grade('ruimte', .3, .01);
    const cap = { x: 250, y: 260 };
    const capFx = fx('ground', 0, (g) => { const u = 6; piece(g, 3, cap.x, cap.y + 14 * u, u, faces); piece(g, 4, cap.x, cap.y, u); R(g, cap.x + 54, cap.y + 20, 14, 50, '#3a3e48');
      // the line, from the hatch to Kamiel
      const p = K.kp(500, 600); g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; g.beginPath(); g.moveTo(cap.x + 60, cap.y + 46); g.quadraticCurveTo((cap.x + 60 + p.x) / 2, Math.max(cap.y + 46, p.y) + 60, p.x, p.y); g.stroke(); });
    kam.x = 110; kam.face = 1; kam.eyes = 'blij'; floatOn(kam, 420, { amp: 24, rot: .25, sp: .5 });
    const walker = byName('wifi') || first;
    gang.forEach(a => { a.alpha = 0; });
    let ball = null, bf = null;
    if (walker) { walker.alpha = 1; walker.cx = 640; walker.face = -1; walker.gear.helm = 1; floatOn(walker, 260, { amp: 20, rot: .6, sp: .6 }); }
    yield* K.fadeIn(1.4);
    yield* K.lensW({ z: 1.2, cx: 420, cy: 320 }, 3);
    yield* tween(3, p => { const f = floaters.find(q => q.a === kam); f.rot = .25 + p * 3; }); floaters.find(q => q.a === kam).rot = .25;   // a slow somersault
    emote('hearts', 1.6);
    if (walker && walker.pet === 'wifi') {   // the red ball floats away… and comes back around the world
      ball = { on: true, x: K.A.petPoint(walker, 'nose').x, y: K.A.petPoint(walker, 'nose').y + 10 }; bf = K.ballFx(ball);
      walker.eyes = 'groot'; emote('!', 1, walker);
      yield* tween(3, p => { ball.x -= 150 * K.dt; ball.y += Math.sin(p * 6) * 1.2; }); walker.eyes = ''; emote('tears', 2, walker); yield* wait(1);
      ball.x = W + 30; ball.y = 200; yield* tween(3, p => { ball.x = lerp(W + 30, K.A.petPoint(walker, 'nose').x, ez(p)); ball.y = lerp(200, K.A.petPoint(walker, 'nose').y + 10, p); });
      emote('hearts', 2, walker); yield* wait(1);
    } else if (walker) { emote('hearts', 2, walker); yield* wait(2); }
    // sunrise over the Earth
    yield* par(K.lensW({ z: 1, cx: W / 2, cy: 300 }, 2), tween(4, p => { D.sunX = lerp(-300, 120, ez(p)); }));
    K.flash(.7, '255,240,200', 1); K.grade('goud', .6, 1.5); kam.eyes = 'groot'; yield* wait(2.2); kam.eyes = 'blij'; emote('sparks', 1.6); yield* wait(2);
    if (bf) { ball.on = false; stop(bf); }
    yield* K.fadeOut(1.2);
    floatOff(); stop(capFx);
    yield* K.card('DEEL 6', 'TERUG NAAR HUIS', 2.4, { size: 44 });

    /* ================= THE RETURN: fire, parachutes, a field, a welcome ================= */
    kam.hide = true; gang.forEach(a => { a.alpha = 0; });
    const pod = { x: 480, y: 280, r: 0, chute: 0, heat: 1 };
    const fall = { cam: 0 };
    K.stage((g) => { const k = clamp(fall.cam / 1800, 0, 1);
      for (let i = 0; i < 7; i++) R(g, 0, i * 86, W, 87, k < .5 ? mix(['#2a0a14', '#3a0e18', '#561620', '#7a2224', '#a83a26', '#d05a2a', '#f08a3a'][i], ['#3c70c6', '#4a7ccc', '#5888d0', '#6894d4', '#7aa2da', '#8ab0de', '#9cbee2'][i], k * 2) : mix(['#3c70c6', '#4a7ccc', '#5888d0', '#6894d4', '#7aa2da', '#8ab0de', '#9cbee2'][i], SKY.day.c[i], (k - .5) * 2));
      for (let i = 0; i < 14; i++) { const y = H + 100 - ((hash(i) * 2200 + K.t * 400 * (1 - pod.chute * .85)) % 2200); if (y < -60 || y > H + 60) continue; T.cloud(g, hash(i + 5) * (W + 200) - 200, y, 8, 10 + Math.round(hash(i + 7) * 14), '#ffffff', 'rgba(150,170,200,.5)'); }
      const gy = H + 900 - fall.cam * .5; if (gy < H) { T.ridge(g, 3, gy - 10, 50, '#7998bb', 8); grass(g, gy); } });
    const podFx = fx('back', 0, (g) => {
      if (pod.heat > 0) { for (let k = 0; k < 18; k++) { const a = (k / 17 - .5) * 1.6, len = 90 + rnd() * 120;
        for (let j = 0; j < len; j += 10) { const q = j / len; g.fillStyle = `rgba(255,${Math.floor(240 - q * 170)},${Math.floor(120 - q * 100)},${pod.heat * (1 - q) * .9})`; R(g, pod.x + Math.sin(a) * (70 + j * .6) - 6, pod.y + 46 - Math.cos(a) * 30 - j, 12, 12); } } }
      if (pod.chute > 0) { const top = pod.y - 140 * pod.chute - 40; g.strokeStyle = 'rgba(40,40,40,.7)'; g.lineWidth = 2;
        for (const dx of [-90, -40, 40, 90]) { g.beginPath(); g.moveTo(pod.x + dx * pod.chute * 1.6, top); g.lineTo(pod.x, pod.y - 40); g.stroke(); }
        for (const [dx, cw] of [[-110, 70], [0, 84], [110, 70]]) for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#ffffff' : '#ff6a2a'; g.beginPath(); g.moveTo(pod.x + dx * pod.chute, top - 10 + Math.abs(dx) * .3); g.arc(pod.x + dx * pod.chute, top + Math.abs(dx) * .3, cw * pod.chute, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); g.closePath(); g.fill(); } }
      g.save(); g.translate(pod.x, pod.y); g.rotate(pod.r); const u = 5;
      piece(g, 3, 0, 40, u, faces); for (let r = 0; r < 6; r++) R(g, -9 * u + r * .75 * u, -30 - r * u, (18 - r * 1.5) * u, u, '#9aa0ac'); R(g, -9 * u, 40, 18 * u, 2 * u, pod.heat > .3 ? '#ff9a40' : '#5a3a2a');
      g.restore();
    });
    const heatL = K.light(() => pod.heat > .1 ? { x: pod.x, y: pod.y + 40 } : null, 300, { col: '255,140,60', flicker: .3 });
    K.grade('rood', .55, .01); K.setv('dark', .15, .01); K.lens({ z: 1, cx: W / 2, cy: 300, shake: 6 }, 0);
    const emb = K.weather('embers', 2);
    yield* K.fadeIn(1);
    yield* tween(5, p => { pod.r = Math.sin(p * 20) * .12; fall.cam = 600 * p; });
    // it cools down; the sky turns blue
    K.stop(emb); K.grade('warm', .4, 2); K.setv('dark', 0, 2); K.lens({ shake: 1 }, 1);
    yield* tween(3, p => { pod.heat = 1 - p; fall.cam = 600 + 500 * p; pod.r = Math.sin(p * 8) * .06; });
    K.unlight(heatL);
    // the parachutes: pop
    K.flash(.4); yield* tween(.8, p => { pod.chute = ez(p); });
    K.lens({ shake: 0 }, .5);
    yield* tween(9, p => { fall.cam = 1100 + 1300 * p; pod.r = Math.sin(K.t * 1.5) * .08; pod.x = 480 + Math.sin(p * 5) * 40; pod.y = lerp(280, 340, Math.min(1, p * 3)); });
    // the field comes up; touchdown
    D.sky = 'day'; D.sunX = 760; D.sunY = 140; D.bunting = 1;
    yield* K.cut(() => { K.stage(field); pod.y = 230; pod.x = 520; }, .4);
    heidi.alpha = 1; heidi.cx = 180; heidi.feet = FEET; heidi.face = 1; heidi.r = 0; heidi.eyes = 'vies'; heidi.layer = 'back';
    yield* tween(3.5, p => { pod.y = lerp(230, FEET - 52, p); pod.r = Math.sin(p * 6) * .06 * (1 - p); });
    pod.r = 0; K.lens({ shake: 6 }, 0); T.puff(pod.x, FEET - 10, 24, '200,180,140', 14); yield* wait(.2); K.lens({ shake: 0 }, .4);
    yield* tween(1.2, p => { pod.chute = 1 - p * .9; });
    // the hatch opens: out they come, dizzy and happy
    kam.hide = false; kam.feet = null; kam.r = 0; kam.outfit = null; K.withOutfit(['astropak']); kam.x = pod.x - W / 2 + 80; kam.face = 1; kam.eyes = 'spiraal';
    gang.forEach((a, i) => { a.alpha = 1; a.cx = pod.x; a.feet = FEET; a.lift = 0; a.r = 0; a.gear.helm = 0; a.gear.carrot = 0; a.layer = 'front'; a.face = -1; hold(a, null); });
    yield* walkTo(kam.x + 120, 50); kam.face = -1;
    yield* par(...gang.map((a, i) => (function* () { yield* wait(i * .5); yield* petTo(a, 380 - i * 60, K.PET[a.pet].run * .7); emote('stars', 1.6, a); yield* tween(1.2, p => { a.r = Math.sin(p * 14) * .2 * (1 - p); }); a.r = 0; })()));
    kam.eyes = 'blij';
    // the welcome: Heidi, the confetti, the medals
    const conf = K.weather('confetti', 1);
    heidi.face = 1; yield* K.actorTo(heidi, 250, 50); heidi.pose = 'stand'; heidi.face = 1;
    yield* wait(1); emote('dots', 1.4, heidi); yield* wait(1.2);
    heidi.eyes = 'blij'; emote('hearts', 2, heidi); yield* wait(1.4); heidi.eyes = 'vies';
    gang.forEach(a => { a.face = 1; hold(a, sitOf(a)); });
    for (const a of gang) { a.gear.medal = 1; K.flash(.3); emote('sparks', 1, a); yield* wait(.5); }
    kam.deco = (g, w, h) => { const x = -w * .18, y = -h * .44; R(g, x - 6, y - 26, 5, 26, '#d7262e'); R(g, x + 3, y - 26, 5, 26, '#3db8ff'); T.disc(g, x + 1, y + 8, 11, 3, '#ffd23f'); R(g, x - 3, y + 3, 4, 4, '#fff2a0'); };
    K.flash(.4); emote('sparks', 1.4); yield* wait(1);
    yield* par(...gang.map(a => (function* () { yield* wait(rnd() * .5); hold(a, null); yield* petJump(a, 40, .45); yield* petJump(a, 30, .4); })()), hop(30, .4));
    // one photo, all together, in front of the scorched capsule
    gang.forEach((a, i) => { a.face = -1; hold(a, sitOf(a)); });
    yield* K.lensW({ z: 1.25, cx: 420, cy: FEET - 120 }, 2);
    kam.eyes = 'blij'; for (let k = 3; k > 0; k--) { emote('dots', .9); yield* wait(1); }
    K.flash(1, '255,255,255', 1.4); K.grade('sepia', 1, .01); K.setv('ab', .6);
    yield* wait(3.2);
    K.setv('ab', 0, 1); K.grade('warm', .5, 1.5); yield* K.lensW({ z: 1, cx: W / 2, cy: 300 }, 2);
    heidi.eyes = 'vies'; emote('dots', 2, heidi); yield* wait(2);
    K.stop(conf); kam.deco = null;
    yield* K.ending('EINDE');
  } };
})();
