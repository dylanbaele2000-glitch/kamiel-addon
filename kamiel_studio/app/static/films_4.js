/* Kamiel films, part 4: see "cinema" in events.js for the building blocks (K).
   KANAAL 9 (film-tv), HET REGIME (film-revolutie), DE TOVERSCHOOL (film-magie). */
(function () {
  const F = window.KamielFilms = window.KamielFilms || {};

  /* ---------- shared little helpers: chunky pixels ---------- */
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const disc = (c, cx, cy, r, col) => { for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy))); R(c, cx - hw, cy + dy, hw * 2 + 1, 1, col); } };
  const ring = (c, cx, cy, r, col, u) => { u = u || 1; for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; R(c, cx + Math.cos(a) * r - u / 2, cy + Math.sin(a) * r - u / 2, u, u, col); } };
  // a grid of characters, each one a block of u×u (a palette maps characters to colours)
  const grid = (c, rows, pal, x, y, u, flip) => { const n = rows[0].length;
    for (let r = 0; r < rows.length; r++) for (let k = 0; k < n; k++) { const col = pal[rows[r][flip ? n - 1 - k : k]]; if (col) R(c, x + k * u, y + r * u, u, u, col); } };
  const gridC = (c, rows, pal, cx, cy, u, flip) => grid(c, rows, pal, cx - rows[0].length * u / 2, cy - rows.length * u / 2, u, flip);
  const glow = (g, x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a === undefined ? .5 : a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); };
  const petTears = (K, a, secs) => K.fx('screen', secs, (g, age) => { const e = K.A.petPoint(a, 'eye'); for (let k = 0; k < 2; k++) { const q = (age * 1.4 + k / 2) % 1; K.sprC(g, K.SP.drop, e.x + (a.face > 0 ? 3 : -3) * (a.s || 1) * 3, e.y + 6 + 40 * q * (a.s || 1), 2.4 * Math.max(.5, a.s || 1)); } });
  const noiseCvs = {};
  function noise(w, h) {   // a fresh canvas of television snow
    const key = w + 'x' + h; let cv = noiseCvs[key]; if (!cv) { cv = noiseCvs[key] = document.createElement('canvas'); cv.width = w; cv.height = h; }
    const c = cv.getContext('2d'), im = c.createImageData(w, h), a = im.data;
    for (let i = 0; i < a.length; i += 4) { const k = Math.random() < .5 ? Math.random() * 90 : 150 + Math.random() * 105; a[i] = a[i + 1] = a[i + 2] = k; a[i + 3] = 255; }
    c.putImageData(im, 0, 0); return cv;
  }
  // the screen frame of an old television, laid over the whole picture (rounded corners, scanlines)
  function crtOver(K, a) {
    return K.over((g) => { const A = a ? a() : 1; if (A <= 0) return; const W = K.W, H = K.H;
      g.globalAlpha = A; g.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
      g.fillStyle = 'rgba(255,255,255,.035)'; const sy = (K.t * 90) % (H + 200) - 100; g.fillRect(0, sy, W, 60);
      g.beginPath(); g.rect(0, 0, W, H); const x0 = 10, y0 = 62, x1 = W - 10, y1 = H - 62, r = 70;
      g.moveTo(x0 + r, y0); g.arcTo(x1, y0, x1, y1, r); g.arcTo(x1, y1, x0, y1, r); g.arcTo(x0, y1, x0, y0, r); g.arcTo(x0, y0, x1, y0, r); g.closePath();
      g.fillStyle = 'rgba(4,6,10,.92)'; g.fill('evenodd'); });
  }

  /* ---------- the channels: little worlds drawn on a grid (w×h blocks, the floor at h-8) ---------- */
  const CH = {
    weer: (c, w, h, t) => {
      R(c, 0, 0, w, h, '#173a7a'); for (let y = 2; y < h; y += 6) R(c, 0, y, w, 2, '#1c4590');
      const mx = Math.round(w * .16), my = 5, mw = Math.round(w * .68), mh = h - 20;
      R(c, mx - 1, my - 1, mw + 2, mh + 2, '#0b1a3c'); R(c, mx, my, mw, mh, '#2f73d8');
      for (let y = 0; y < mh - 4; y++) { const half = mw * .3 * Math.sin((y + 1) / (mh - 3) * Math.PI) + Math.sin(y * .9) * 1.5 + 2, cx = mx + mw * .5 + Math.sin(y * .33) * 3;
        R(c, cx - half, my + 2 + y, half * 2, 1, '#43a83c'); if (y % 5 === 2) R(c, cx - half * .4, my + 2 + y, half * .5, 1, '#5cc451'); }
      const sun = (x, y) => { disc(c, x, y, 3, '#ffd23f'); if (Math.sin(t * 4) > 0) { R(c, x - 6, y, 2, 1, '#ffd23f'); R(c, x + 5, y, 2, 1, '#ffd23f'); R(c, x, y - 6, 1, 2, '#ffd23f'); R(c, x, y + 5, 1, 2, '#ffd23f'); } };
      const cloud = (x, y, col) => { R(c, x - 5, y - 1, 11, 3, col); R(c, x - 3, y - 3, 6, 2, col); R(c, x + 1, y - 4, 3, 2, col); };
      sun(mx + mw * .3, my + mh * .3); cloud(mx + mw * .66, my + mh * .25, '#ffffff');
      cloud(mx + mw * .55, my + mh * .62, '#9aa6bb'); for (let k = 0; k < 4; k++) R(c, mx + mw * .55 - 4 + k * 3, my + mh * .62 + 3 + ((t * 14 + k * 2) % 5), 1, 2, '#7ec8ff');
      if (Math.sin(t * 2.3) > .6) { const bx = mx + mw * .36, by = my + mh * .7; R(c, bx, by, 2, 3, '#ffe14d'); R(c, bx - 1, by + 3, 3, 1, '#ffe14d'); R(c, bx - 1, by + 4, 2, 3, '#ffe14d'); }
      R(c, 0, h - 8, w, 8, '#0f2350'); R(c, 0, h - 8, w, 1, '#3a64b8');
      R(c, 0, h - 4, w, 4, '#c3202b'); for (let k = 0; k < 8; k++) R(c, ((k * 16 - t * 12) % (w + 16) + w + 16) % (w + 16) - 8, h - 3, 9, 2, '#ffffff');
      R(c, w - 14, 3, 11, 6, '#c3202b'); R(c, w - 12, 5, 7, 2, '#ffffff');
    },
    kook: (c, w, h, t) => {
      for (let y = 0; y < h - 20; y += 4) for (let x = 0; x < w; x += 4) R(c, x, y, 4, 4, ((x + y) / 4) % 2 ? '#f1e4c4' : '#e2cfa4');
      R(c, w * .1, 5, 16, 12, '#ffffff'); R(c, w * .1 + 1, 6, 14, 10, '#9fd8ff'); R(c, w * .1 + 7, 6, 2, 10, '#ffffff'); R(c, w * .1 + 1, 10, 14, 2, '#ffffff');
      R(c, w * .45, 8, w * .4, 2, '#7a4a28'); for (let k = 0; k < 3; k++) { const x = w * .48 + k * 9; R(c, x + 2, 10, 1, 3, '#555'); disc(c, x + 2, 15, 3, '#3a3a3a'); R(c, x + 1, 14, 2, 1, '#6a6a6a'); }
      R(c, 0, h - 20, w, 12, '#b8572f'); R(c, 0, h - 20, w, 2, '#efe6d6'); for (let x = 3; x < w; x += 12) R(c, x, h - 16, 8, 6, '#a04a26');
      const cx = w * .22; R(c, cx, h - 27, 13, 7, '#ff8fb8'); R(c, cx, h - 25, 13, 1, '#ffffff'); R(c, cx + 1, h - 29, 11, 2, '#ffd0e4'); R(c, cx + 5, h - 31, 2, 2, '#e2202b');
      const px = w * .66; R(c, px - 2, h - 21, 20, 1, '#333'); R(c, px, h - 29, 16, 8, '#2b2b2b'); R(c, px - 1, h - 30, 18, 2, '#5a5a5a'); R(c, px + 2, h - 27, 3, 2, '#4a4a4a');
      for (let k = 0; k < 6; k++) { const a = (t * .6 + k / 6) % 1; R(c, px + 3 + k * 2 + Math.sin(t * 3 + k) * 2, h - 31 - a * 18, 2, 2, `rgba(255,255,255,${.7 * (1 - a)})`); }
      for (let y = h - 8; y < h; y += 3) for (let x = 0; x < w; x += 3) R(c, x, y, 3, 3, ((x + y) / 3) % 2 ? '#2b2b33' : '#e8e8e8');
    },
    western: (c, w, h, t) => {
      for (let y = 0; y < h - 10; y++) { const v = Math.round(225 - y * 1.6); R(c, 0, y, w, 1, `rgb(${v},${v},${v})`); }
      disc(c, w * .76, 11, 5, '#f8f8f8');
      R(c, w * .02, h - 27, w * .24, 17, '#8c8c8c'); R(c, w * .05, h - 31, w * .16, 4, '#8c8c8c'); R(c, w * .3, h - 22, w * .14, 12, '#9c9c9c');
      const sx = w * .56; R(c, sx, h - 33, w * .32, 23, '#6a6a6a'); R(c, sx + 2, h - 37, w * .32 - 4, 4, '#6a6a6a'); R(c, sx + w * .1, h - 40, w * .12, 3, '#6a6a6a');
      R(c, sx + 3, h - 29, 6, 5, '#2a2a2a'); R(c, sx + w * .32 - 9, h - 29, 6, 5, '#2a2a2a'); R(c, sx + w * .13, h - 20, 7, 10, '#3a3a3a'); R(c, sx, h - 24, w * .32, 1, '#4a4a4a');
      const kx = w * .16; R(c, kx, h - 25, 3, 16, '#444'); R(c, kx - 4, h - 20, 4, 2, '#444'); R(c, kx - 4, h - 24, 2, 4, '#444'); R(c, kx + 3, h - 18, 4, 2, '#444'); R(c, kx + 5, h - 22, 2, 4, '#444');
      R(c, 0, h - 10, w, 10, '#b4b4b4'); for (let k = 0; k < 9; k++) R(c, hash(k) * w, h - 8 + hash(k + 4) * 6, 2, 1, '#8a8a8a');
      const tx = ((t * 13) % (w + 24)) - 12, ty = h - 13 - Math.abs(Math.sin(t * 4)) * 4;
      for (let k = 0; k < 10; k++) { const a = k * .7 + t * 5; R(c, tx + Math.cos(a) * 3, ty + Math.sin(a) * 3, 2, 2, '#5a5a5a'); }
      if (Math.sin(t * 7) > .5) R(c, (hash(Math.floor(t * 3)) * w), 0, 1, h, 'rgba(250,250,250,.5)');
    },
    test: (c, w, h, t) => {
      const cols = ['#e8e8e8', '#e8e800', '#00e8e8', '#00e800', '#e800e8', '#e80000', '#0000e8'], bw = w / 7;
      for (let k = 0; k < 7; k++) R(c, k * bw, 0, bw + 1, h * .64, cols[k]);
      const low = ['#0000e8', '#151515', '#e800e8', '#151515', '#00e8e8', '#151515', '#e8e8e8'];
      for (let k = 0; k < 7; k++) R(c, k * bw, h * .64, bw + 1, h * .08, low[k]);
      R(c, 0, h * .72, w, h * .28, '#151515'); for (let k = 0; k < 4; k++) R(c, w * .08 + k * w * .1, h * .76, w * .08, h * .12, ['#0a1a50', '#ffffff', '#2a0a60', '#151515'][k]);
      ring(c, w / 2, h * .38, Math.min(w, h) * .3, '#151515', 1.2); R(c, w / 2 - .5, h * .1, 1, h * .56, '#151515'); R(c, w * .2, h * .38, w * .6, 1, '#151515');
    },
    ruimte: (c, w, h, t) => {
      R(c, 0, 0, w, h, '#140b2e'); for (let y = 0; y < h; y += 8) R(c, 0, y, w, 3, '#190f3a');
      for (let k = 0; k < 46; k++) { const x = hash(k) * w, y = hash(k + 50) * (h - 10); if (Math.sin(t * 2.5 + k * 1.7) > -.4) R(c, x, y, 1, 1, k % 5 ? '#ffffff' : '#ffe9a0'); }
      for (let k = 0; k < 3; k++) { const x = hash(k + 7) * w, y = hash(k + 17) * h * .6; R(c, x - 2, y, 5, 1, '#fff6c0'); R(c, x, y - 2, 1, 5, '#fff6c0'); }
      const pxx = w * .72, py = h * .3; for (let dy = -2; dy <= 2; dy++) R(c, pxx - 15 + Math.abs(dy), py + dy, 30 - Math.abs(dy) * 2, 1, '#ffd9a0');
      disc(c, pxx, py, 8, '#ff9a3c'); R(c, pxx - 7, py - 2, 15, 2, '#d9702a'); R(c, pxx - 6, py + 3, 13, 1, '#d9702a'); R(c, pxx - 4, py - 6, 3, 2, '#ffc27a');
      for (let dy = 0; dy <= 2; dy++) R(c, pxx - 15 + dy * 2, py + dy, 9, 1, '#ffd9a0');
      disc(c, w * .2, h * .22, 4, '#c9c9e0'); R(c, w * .2 - 2, h * .22 - 1, 2, 2, '#a0a0bc');
      const cx = ((t * 9) % (w + 40)) - 20, cy = 8 + ((t * 9) % (w + 40)) * .15; R(c, cx, cy, 2, 2, '#ffffff'); for (let k = 1; k < 6; k++) R(c, cx - k * 2, cy - k * .3, 2, 1, `rgba(170,220,255,${1 - k / 6})`);
      R(c, 0, h - 8, w, 8, '#8a8aa0'); R(c, 0, h - 8, w, 1, '#b8b8d0'); for (let k = 0; k < 6; k++) { const x = hash(k + 30) * w; R(c, x, h - 5 + (k % 2), 6, 2, '#6a6a80'); R(c, x + 1, h - 6 + (k % 2), 4, 1, '#5a5a70'); }
    },
    zee: (c, w, h, t) => {
      for (let y = 0; y < h; y++) { const p = y / h; R(c, 0, y, w, 1, `rgb(${Math.round(20 - 12 * p)},${Math.round(96 - 50 * p)},${Math.round(170 - 80 * p)})`); }
      for (let k = 0; k < 4; k++) { const x = w * (.15 + k * .25) + Math.sin(t * .5 + k) * 3; for (let y = 0; y < h - 10; y += 2) R(c, x + y * .25, y, 3, 2, 'rgba(180,230,255,.08)'); }
      for (let k = 0; k < 16; k++) { const x = hash(k) * w + Math.sin(t * 2 + k) * 1.5, y = h - ((t * 9 + hash(k + 3) * h) % h); R(c, x, y, 1, 1, '#bfe8ff'); if (k % 4 === 0) R(c, x + 1, y - 1, 1, 1, '#ffffff'); }
      for (let k = 0; k < 3; k++) { const d = k % 2 ? 1 : -1, x = (((t * (6 + k * 3) * d) % (w + 30)) + w + 30) % (w + 30) - 15, y = 10 + k * 11;
        R(c, x - 4, y - 2, 8, 4, ['#ff8a2a', '#ffd23f', '#ff5a8a'][k]); R(c, x - 3, y - 3, 5, 6, ['#ff8a2a', '#ffd23f', '#ff5a8a'][k]); R(c, x - d * 6, y - 3, 2, 6, ['#d9661a', '#d9a020', '#d93a6a'][k]); R(c, x + d * 2, y - 1, 1, 1, '#111'); }
      for (let k = 0; k < 7; k++) { const x0 = w * (.05 + k * .14); for (let s = 0; s < 9 + (k % 3) * 3; s++) R(c, x0 + Math.sin(t * 2 + s * .5 + k) * (s * .25), h - 9 - s * 1.6, 2, 2, s % 2 ? '#2f9a4a' : '#3fb85a'); }
      R(c, 0, h - 8, w, 8, '#d8c07a'); R(c, 0, h - 8, w, 1, '#efd894'); for (let k = 0; k < 5; k++) R(c, hash(k + 60) * w, h - 5, 3, 2, '#f4a0b0');
    },
  };
  const CHLIGHT = { weer: '120,170,255', kook: '255,200,140', western: '230,230,230', test: '230,230,255', ruimte: '190,140,255', zee: '110,220,255', sneeuw: '200,210,230' };

  /* a film set of our own: the world goes away, we paint the decor, and we draw the cast ourselves on top of it
     (so the night tint of the world never makes them muddy). Actors added with set.add(a) are ours. */
  function filmSet(K, bg) {
    const S = { bg, back: [], front: [], kam: true, out: false };
    K.kam.hide = true;
    const paint = (g) => {
      S.bg(g);
      for (const f of S.back.slice()) f(g);
      const acts = K.actors.filter(a => a.layer === 'none' && a.alpha > 0);
      const one = (a) => { if (a.pet) K.A.drawPet(g, a); else K.A.drawLlama(g, a); };
      acts.forEach(a => { if (!a.front) one(a); });
      if (S.kam && K.kam.alpha !== 0) K.A.drawLlama(g, K.A.kamObj());
      acts.forEach(a => { if (a.front) one(a); });
      for (const f of S.front.slice()) f(g);
    };
    S.fx = K.stage(paint);
    S.add = (a, front) => { a.layer = S.out ? (front ? 'front' : 'back') : 'none'; a.front = !!front; a.ours = true; return a; };
    // out into the real world for a while (the cast is drawn by the engine again), and back onto the set
    S.leave = () => { K.unstage(); K.kam.hide = false; S.out = true; K.actors.forEach(a => { if (a.ours) a.layer = a.front ? 'front' : 'back'; }); };
    S.enter = () => { S.fx = K.stage(paint); K.kam.hide = true; S.out = false; K.actors.forEach(a => { if (a.ours) a.layer = 'none'; }); };
    S.drop = (list, f) => { const k = list.indexOf(f); if (k >= 0) list.splice(k, 1); };
    return S;
  }
  // Heidi, as a portrait (16×20 blocks)
  const HEIDI_FACE = ['..WW........WW..', '.WPPW......WPPW.', '.WPPW......WPPW.', '..WWWWWWWWWWWW..', '.WWwWWWWWWWWwWW.', 'WWWWWWWWWWWWWWWW', 'WWWFFFFFFFFFFWWW', '.WFFFFFFFFFFFFW.',
    '.WFfffFFFFfffFW.', '.WFKKKFFFFKKKFW.', '.WFFFFFFFFFFFFW.', '..FFFFFFFFFFFF..', '..FFFFFnnFFFFF..', '..FFFFFFFFFFFF..', '..FFFmmmmmFFFF..', '...FFFFFFmFFF...', '...FFFFFFFFFF...', '....WWWWWWWW....', '...WWWWWWWWWW...', '..WWWWWWWWWWWW..'];
  const HEIDI_PAL = { W: '#f6f2ea', w: '#d9d2c6', P: '#e9a3a8', F: '#ecdccb', f: '#c9b4a2', K: '#2a1a14', n: '#8a6a5a', m: '#6a4a3a' };

  // the living room (for KANAAL 9)
  function paintRoom(K, g) {
    const W = K.W, hr = (K.A.now ? K.A.now() : new Date()).getHours(), night = hr >= 20 || hr < 7;
    R(g, 0, 0, W, 480, '#3b4f6b');
    for (let y = 84, row = 0; y < 410; y += 42, row++) for (let x = (row % 2) * 30; x < W; x += 60) { R(g, x + 6, y, 6, 6, '#4a6383'); R(g, x, y + 6, 18, 6, '#4a6383'); R(g, x + 6, y + 12, 6, 6, '#4a6383'); }
    R(g, 0, 420, W, 60, '#5a3a28'); R(g, 0, 420, W, 6, '#7a5238'); for (let x = 40; x < W; x += 80) R(g, x, 434, 4, 38, '#4a2e1e');
    R(g, 0, 480, W, 120, '#6b4428'); for (const y of [498, 520, 548, 582]) R(g, 0, y, W, 3, '#553420');
    for (let k = 0; k < 14; k++) R(g, (k * 137) % W, [480, 498, 520, 548][k % 4], 3, [18, 22, 28, 34][k % 4], '#553420');
    R(g, 0, 480, W, 6, '#3a2416');
    // window, curtains
    R(g, 44, 104, 192, 232, '#e8dcc0'); R(g, 52, 112, 176, 216, night ? '#13204a' : '#8fc8ff');
    if (night) { disc(g, 180, 160, 16, '#f4ecc8'); disc(g, 186, 156, 14, '#13204a'); for (let k = 0; k < 14; k++) if (Math.sin(K.t * 2 + k) > -.5) R(g, 56 + hash(k) * 168, 116 + hash(k + 5) * 200, 3, 3, '#ffffff'); }
    else { disc(g, 180, 160, 14, '#fff3a0'); R(g, 70, 230, 60, 12, '#ffffff'); R(g, 82, 220, 30, 10, '#ffffff'); R(g, 150, 280, 50, 10, '#f0f6ff'); }
    R(g, 136, 112, 8, 216, '#e8dcc0'); R(g, 52, 216, 176, 8, '#e8dcc0');
    R(g, 24, 92, 232, 8, '#c9a050'); disc(g, 24, 96, 7, '#c9a050'); disc(g, 256, 96, 7, '#c9a050');
    for (const cx of [30, 214]) { R(g, cx, 100, 36, 250, '#8a2c4a'); for (let k = 0; k < 3; k++) R(g, cx + 6 + k * 11, 100, 4, 250, '#6e2038'); R(g, cx - 2, 250, 40, 10, '#c9a050'); }
    // Heidi's portrait on the wall (she was always here)
    R(g, 356, 126, 116, 128, '#c9a050'); R(g, 362, 132, 104, 116, '#7a5a3a'); R(g, 368, 138, 92, 104, '#d8c7e0'); grid(g, HEIDI_FACE, HEIDI_PAL, 382, 148, 4);
    // floor lamp
    const lx = 290; R(g, lx - 18, 528, 36, 10, '#2b2b2b'); R(g, lx - 3, 250, 6, 280, '#2b2b2b');
    for (let k = 0; k < 8; k++) R(g, lx - 20 - k * 3, 196 + k * 7, 40 + k * 6, 7, k % 3 === 2 ? '#d8b860' : '#e8c870');
    // plant
    R(g, 880, 470, 50, 60, '#b8572f'); R(g, 876, 466, 58, 8, '#d06a3a');
    for (let k = 0; k < 7; k++) { const a = -1.2 + k * .4; for (let s = 0; s < 8; s++) R(g, 905 + Math.sin(a) * s * 9 + Math.sin(K.t + k) * s * .3, 462 - Math.cos(a) * s * 11, 8, 8, s % 2 ? '#3f9a3a' : '#2f7a2e'); }
    // rug
    for (let y = 488; y < 540; y += 4) { const q = (y - 513) / 26, hw = 300 * Math.sqrt(Math.max(0, 1 - q * q)); R(g, 640 - hw, y, hw * 2, 4, Math.abs(q) > .8 ? '#c9a050' : '#8a2c3a'); if (Math.abs(q) < .5) R(g, 640 - hw * .7, y, hw * 1.4, 4, (y / 4) % 2 ? '#9a3a48' : '#8a2c3a'); }
  }

  /* ======================================================================
     KANAAL 9 — a big old television appears. Pebbels touches the screen and is sucked in; the others try
     everything to get her out (the dial, barking, the cable, a bump, the antenna). In the end Kamiel goes in
     after her, chases her through the channels, and they jump out together. The set goes off: the white dot.
     ====================================================================== */
  F['film-tv'] = { can: (K) => K.castNames().includes('pebbels'), run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez } = K;
    const names = K.castNames(); if (!names.includes('pebbels')) return;
    const has = (n) => names.includes(n);

    /* the television */
    const T = { x: W / 2 + 190, base: FEET + 4, a: 0, glitch: 0, ch: 'sneeuw', stat: 1, power: 1, off: 0, roll: 0, shake: 0, dial: 0, antL: 0, antR: 0, bulge: 0, heidi: 0, wave: 0 };
    const L0 = () => T.x - 170, TOP = () => T.base - 280;
    const S = { get x() { return L0() + 24; }, get y() { return TOP() + 26; }, w: 240, h: 180, get cx() { return L0() + 144; }, get cy() { return TOP() + 116; } };
    const mini = { pet: 'pebbels', on: false, mx: 120, dy: 0, s: .36, face: -1, pose: 'stand', wt: 0, lift: 0, r: 0, sq: 1, sx: 1, alpha: 1, mode: 'still', cx: 0, feet: 0, eyes: '' };
    const minK = { on: false, mx: 70, dy: 0, s: .3, face: 1, pose: 'stand', wt: 0, r: 0, sq: 1, sx: 1, alpha: 1, eyes: 'groot', outfit: [], y: 0, head: 0 };
    const heidiTV = { set: 'heidi', s: 1.9, face: -1, pose: 'stand', eyes: 'vies', outfit: [], r: 0, sq: 1, alpha: 1, head: 0, wt: 0 };
    const ol = '#24150c', wood = '#7b4a28', woodL = '#9b6236', woodD = '#5e3820';
    function drawScreen(g, dx, dy) {
      const x = S.x + dx, y = S.y + dy, w = S.w, h = S.h;
      g.save(); g.beginPath(); const r = 22; g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.clip();
      if (T.power <= 0) { R(g, x, y, w, h, '#0f1512'); R(g, x + 16, y + 14, 50, 8, 'rgba(255,255,255,.06)'); R(g, x + 16, y + 26, 22, 6, 'rgba(255,255,255,.05)'); g.restore(); return; }
      const ch = CH[T.ch], roll = ((T.roll % h) + h) % h;
      if (ch) for (const oy of roll ? [roll, roll - h] : [0]) {
        g.save(); g.translate(x, y + oy); if (T.wave > 0) g.translate(Math.sin(K.t * 20) * 6 * T.wave, 0); g.scale(3, 3); ch(g, 80, 60, K.t); g.restore();
        if (roll) R(g, x, y + roll - 6, w, 6, '#050505');
      }
      if (mini.on) {   // Pebbels, small, inside the programme
        const m = mini;
        if (m.mode === 'pace') { m.mx = 120 + Math.sin(K.t * .9) * 75; m.face = Math.cos(K.t * .9) > 0 ? 1 : -1; m.pose = 'walk'; m.wt += 9 * K.dt; m.lift = 0; m.r = 0; }
        else if (m.mode === 'float') { m.lift = 34 + Math.sin(K.t * 1.6) * 12; m.r = Math.sin(K.t * .7) * .5; m.pose = 'jump'; }
        else if (m.mode === 'wave') { m.lift = Math.abs(Math.sin(K.t * 5)) * 16; m.pose = 'jump'; m.r = 0; }
        else if (m.mode === 'sit') { m.pose = 'sit'; m.lift = 0; m.r = 0; }
        else if (m.mode === 'dizzy') { m.pose = 'stand'; m.r = Math.sin(K.t * 6) * .35; m.lift = 0; }
        m.cx = x + m.mx; m.feet = y + 158 + m.dy;
        K.A.drawPet(g, m);
      }
      if (minK.on) { const o = minK; K.A.drawLlama(g, { set: 'kamiel', cx: x + o.mx, feet: y + 158 + o.dy - o.y, s: o.s, face: o.face, pose: o.pose, wt: o.wt, r: o.r, sq: o.sq, sx: o.sx, eyes: o.eyes, eyeT: K.t, outfit: o.outfit, head: o.head, alpha: o.alpha }); }
      if (T.heidi > 0) { g.globalAlpha = T.heidi; R(g, x, y, w, h, '#3a2050'); glow(g, x + w / 2, y + h / 2, 160, '255,160,220', .4); K.A.drawLlama(g, Object.assign({}, heidiTV, { cx: x + 185, feet: y + 440, eyeT: K.t, sq: 1 + Math.sin(K.t * 9) * .02 })); g.globalAlpha = 1; }
      if (T.stat > 0) { g.globalAlpha = Math.min(1, T.stat); g.imageSmoothingEnabled = false; g.drawImage(noise(80, 60), x, y, w, h); g.globalAlpha = 1; }
      g.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 0; k < h; k += 3) g.fillRect(x, y + k, w, 1);
      const vg = g.createRadialGradient(x + w / 2, y + h / 2, h * .35, x + w / 2, y + h / 2, w * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(x, y, w, h);
      if (T.off > 0) {   // switching off: the picture folds into a line, the line into a dot, the dot goes out
        const o = T.off; g.fillStyle = `rgba(6,8,8,${Math.min(1, o * 6)})`; g.fillRect(x, y, w, h);
        let lw, lh, a = 1;
        if (o < .35) { lw = w; lh = Math.max(4, h * (1 - o / .35)); } else if (o < .75) { lw = Math.max(8, w * (1 - (o - .35) / .4)); lh = 4; } else { lw = 8 * (1 - (o - .75) / .25) + 2; lh = lw; a = 1 - (o - .75) / .25 * .8; }
        glow(g, x + w / 2, y + h / 2, Math.max(lw, 30) * .8, '200,230,255', .5 * a);
        g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(Math.round(x + w / 2 - lw / 2), Math.round(y + h / 2 - lh / 2), Math.round(lw), Math.round(lh));
      }
      R(g, x + 14, y + 10, 46, 6, 'rgba(255,255,255,.13)'); R(g, x + 14, y + 16, 18, 6, 'rgba(255,255,255,.1)'); R(g, x + w - 30, y + h - 18, 16, 5, 'rgba(255,255,255,.07)');
      g.restore();
    }
    function drawTV(g) {
      if (T.a <= 0) return;
      const dx = T.shake ? (rnd() - .5) * 2 * T.shake : 0, dy = T.shake ? (rnd() - .5) * T.shake : 0, L = L0() + dx, Tp = TOP() + dy;
      g.save(); g.globalAlpha = T.a;
      if (T.bulge > 0) { const sc = 1 + T.bulge * .06; g.translate(T.x, T.base); g.scale(sc, 1 + T.bulge * .04); g.translate(-T.x, -T.base); }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(T.x, T.base - 2, 190, 12, 0, 0, 7); g.fill();
      // antenna (rabbit ears)
      const ax = T.x + dx, ay = Tp - 6;
      for (const [side, wob] of [[-1, T.antL], [1, T.antR]]) { const ex = ax + side * (70 + wob * 40 * side), ey = ay - 128 + Math.abs(wob) * 20;
        for (let k = 0; k <= 22; k++) R(g, lerp(ax, ex, k / 22) - 2, lerp(ay, ey, k / 22) - 2, 4, 4, k > 20 ? '#e8e8f0' : '#a8a8b4'); disc(g, ex, ey, 5, '#d8d8e4'); R(g, ex - 2, ey - 3, 2, 2, '#fff'); }
      R(g, ax - 22, ay - 8, 44, 14, '#2b2b2b'); R(g, ax - 16, ay - 14, 32, 6, '#3a3a3a'); R(g, ax - 10, ay - 12, 8, 3, '#5a5a5a');
      for (const lx of [L + 34, L + 290]) { R(g, lx, Tp + 254, 18, 26, ol); R(g, lx + 4, Tp + 254, 10, 22, '#3a2416'); }
      R(g, L + 8, Tp, 324, 258, ol); R(g, L, Tp + 8, 340, 242, ol); R(g, L + 4, Tp + 4, 332, 250, ol);
      R(g, L + 8, Tp + 4, 324, 246, wood); R(g, L + 4, Tp + 8, 332, 238, wood);
      R(g, L + 8, Tp + 4, 324, 8, woodL); R(g, L + 4, Tp + 12, 4, 200, woodL); R(g, L + 8, Tp + 226, 324, 24, woodD); R(g, L + 8, Tp + 226, 324, 4, '#4a2c18');
      for (let k = 0; k < 5; k++) R(g, L + 30 + hash(k) * 220, Tp + 232 + (k % 3) * 5, 40 + hash(k + 3) * 50, 2, '#4a2c18');
      R(g, S.x - 16 + dx, S.y - 16 + dy, S.w + 32, S.h + 32, '#1c1714'); R(g, S.x - 12 + dx, S.y - 12 + dy, S.w + 24, S.h + 24, '#4a423c'); R(g, S.x - 12 + dx, S.y - 12 + dy, S.w + 24, 4, '#6a605a');
      R(g, S.x - 12 + dx, S.y + S.h + 8 + dy, S.w + 24, 4, '#2c2622');
      drawScreen(g, dx, dy);
      const px = L + 282; R(g, px, Tp + 24, 44, 204, woodD); R(g, px + 2, Tp + 26, 40, 200, '#4e2e1a');
      const dcx = px + 22, dcy = Tp + 62; disc(g, dcx, dcy, 17, '#1c1714'); disc(g, dcx, dcy, 15, '#cfc6b8'); disc(g, dcx, dcy, 10, '#9a9086');
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; R(g, dcx + Math.cos(a) * 13 - 1, dcy + Math.sin(a) * 13 - 1, 2, 2, '#5a524a'); }
      const da = T.dial * Math.PI / 6 - Math.PI / 2; for (let k = 2; k < 12; k += 2) R(g, dcx + Math.cos(da) * k - 2, dcy + Math.sin(da) * k - 2, 4, 4, '#c3202b');
      disc(g, dcx, Tp + 112, 9, '#1c1714'); disc(g, dcx, Tp + 112, 7, '#3a3a3a'); R(g, dcx - 3, Tp + 107, 3, 3, '#7a7a7a');
      disc(g, dcx, Tp + 142, 7, '#1c1714'); disc(g, dcx, Tp + 142, 5, '#3a3a3a');
      for (let k = 0; k < 7; k++) R(g, px + 8, Tp + 164 + k * 7, 28, 3, ol);
      const lit = T.power > 0 && T.off < 1; R(g, px + 18, Tp + 216, 8, 5, lit ? '#ff3a3a' : '#401010'); if (lit) glow(g, px + 22, Tp + 218, 14, '255,60,60', .5);
      g.restore();
      if (T.glitch > 0) {   // tuning in: slices of the set jump sideways
        for (let k = 0; k < 8; k++) { const yy = TOP() - 140 + rnd() * 420, hh = 4 + rnd() * 16; g.save(); g.globalAlpha = .6 * T.glitch; g.fillStyle = rnd() < .5 ? 'rgba(120,255,240,.5)' : 'rgba(255,60,160,.5)'; g.fillRect(L0() - 20 + (rnd() - .5) * 60 * T.glitch, yy, 380, hh); g.restore(); }
      }
      if (T.a > .5 && T.power > 0 && T.off < .9) glow(g, S.cx, S.cy, 260, tvLight.col, .22);
    }
    const cab = { cut: 0 };
    function drawCable(g) { if (T.a <= 0) return; g.save(); g.globalAlpha = T.a;
      const x0 = L0() + 10, y0 = T.base - 40, x1 = 26, y1 = 470;
      for (let k = 0; k <= 50; k++) { const p = k / 50; if (cab.cut && Math.abs(p - .5) < .02) continue; const x = lerp(x0, x1, p), y = p < .8 ? lerp(y0, FEET - 2, Math.min(1, p * 3)) + Math.sin(p * 9) * 2 : lerp(FEET - 2, y1, (p - .8) / .2); R(g, x - 2, y - 2, 5, 4, '#1a1a1a'); }
      R(g, x1 - 10, y1 - 14, 20, 26, '#e8e2d4'); R(g, x1 - 6, y1 - 6, 3, 6, '#333'); R(g, x1 + 2, y1 - 6, 3, 6, '#333'); g.restore(); }

    /* the set: the living room, or the inside of the television */
    let inside = null, crt = null;
    const set = filmSet(K, (g) => {
      if (!inside) { paintRoom(K, g); drawCable(g); drawTV(g); return; }
      if (inside === 'glas') { drawGlass(g); return; }
      g.save(); g.scale(8, 8); (CH[inside] || CH.test)(g, 120, 75, K.t); g.restore();
    });
    const tvLight = K.light(() => !inside && T.a > .3 && T.power > 0 && T.off < .8 ? { x: S.cx, y: S.cy + 40 } : null, 430, { col: CHLIGHT.sneeuw, flicker: .12, a: .95 });
    const lampLight = K.light(() => !inside ? { x: 290, y: 240 } : null, 300, { col: '255,200,120', a: .8 });
    const setCh = (ch) => { T.ch = ch; tvLight.col = CHLIGHT[ch] || CHLIGHT.sneeuw; };
    function* zap(ch, secs) { T.stat = 1; T.dial += 1; yield* wait(secs || .4); setCh(ch); yield* tween(.45, p => { T.stat = 1 - p; }); T.stat = 0; }
    const closeTV = (z, secs) => K.lensW({ z: z || 2.3, cx: S.cx, cy: S.cy + 10 }, secs || 1.6);
    const wide = (secs) => K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, secs || 1.4);
    const sparks = (x, y, n, col) => K.particles('sky', { dur: 1.6, emit: (ps) => { if (n-- > 0) for (let k = 0; k < 3; k++) ps.push(K.P({ x, y, vx: (rnd() - .5) * 260, vy: -60 - rnd() * 200, grav: 500, life: .5 + rnd() * .4 })); },
      draw: (g, p, k) => { g.fillStyle = col || `rgba(255,${200 + Math.floor(rnd() * 55)},90,${1 - k})`; g.fillRect(p.x, p.y, 5, 5); } });
    const puff = (x, y, n, col) => K.particles('sky', { dur: 2.2, emit: (ps) => { if (n-- > 0) for (let k = 0; k < 4; k++) ps.push(K.P({ x: x + (rnd() - .5) * 30, y: y + (rnd() - .5) * 20, vx: (rnd() - .5) * 120, vy: -30 - rnd() * 60, life: .9 + rnd() * .5, sz: 8 + rnd() * 10 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(${col || '230,230,230'},${.8 * (1 - k)})`; const s = Math.round((p.sz * (1 + k)) / 6) * 6; g.fillRect(Math.round(p.x / 6) * 6 - s / 2, Math.round(p.y / 6) * 6 - s / 2, s, s); } });
    let suckUntil = 0;
    const suck = (from, into, cols) => K.particles('sky', { dur: 2.4, emit: (ps) => { if (K.t < suckUntil) for (let k = 0; k < 4; k++) { const f = from(); ps.push(K.P({ x: f.x + (rnd() - .5) * 90, y: f.y + (rnd() - .5) * 70, life: .7, col: K.pick(cols), into })); } },
      draw: (g, p, k) => { const e = k * k; g.fillStyle = p.col; g.fillRect(lerp(p.x, p.into.x, e), lerp(p.y, p.into.y, e), 6 - 4 * k, 6 - 4 * k); } });

    /* the cast */
    const peb = set.add(K.pet('pebbels', 1));
    const others = names.filter(n => n !== 'pebbels').map((n, i) => set.add(K.pet(n, i % 2 ? 1 : -1)));
    const all = [peb].concat(others);
    const by = (n) => all.find(a => a.pet === n);
    const spotsOf = { wifi: 150, snoet: 230, pippa: 66, dobby: 905, pebbels: 340 };

    yield* K.opening('KANAAL 9', 'EEN FILM OP ALLE ZENDERS', 'warm');
    K.grade('warm', .45, .01); K.setv('dark', .34, .01); K.setv('vig', .55, 2);
    kam.x = -40; kam.face = -1;
    /* ---------- part 1: an evening like any other… ---------- */
    all.forEach(a => { a.cx = spotsOf[a.pet] < W / 2 ? -60 - rnd() * 80 : W + 60; });
    yield* par(...all.map(a => petTo(a, spotsOf[a.pet], Math.max(90, K.PET[a.pet].run * 1.3))));
    all.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; hold(a, a.pet === 'dobby' || a.pet === 'wifi' ? 'lie' : 'sit'); });
    yield* wait(1.2); kam.mouth = .7; kam.eyes = 'dicht'; yield* wait(1.2); kam.mouth = 0; kam.eyes = ''; emote('dots', 2.5);
    yield* wait(1.5);
    if (has('dobby')) { hold(by('dobby'), 'sleep'); emote('zzz', 6, by('dobby')); }
    if (has('wifi')) { const w = by('wifi'); hold(w, null); yield* petJump(w, 14, .3); emote('notes', 1.5, w); kam.face = -1; yield* wait(1.4); emote('dots', 2); hold(w, 'lie'); emote('sweat', 1.5, w); }
    yield* wait(2);
    // a hum… sparks in the air… and there it is
    kam.face = 1; kam.eyes = 'groot'; emote('?', 2); all.forEach(a => { a.face = a.cx < T.x ? 1 : -1; });
    K.particles('sky', { dur: 6, emit: (ps) => { if (rnd() < .7) ps.push(K.P({ x: T.x + (rnd() - .5) * 360, y: TOP() - 100 + rnd() * 380, vy: -20, life: .6 + rnd() * .5 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(${rnd() < .5 ? '140,255,240' : '255,120,220'},${1 - k})`; g.fillRect(Math.round(p.x / 6) * 6, Math.round(p.y / 6) * 6, 6, 6); } });
    K.lens({ cx: T.x - 40, cy: FEET - 190, z: 1.25 }, 5);
    yield* tween(4.5, p => { T.a = p < .7 ? (rnd() < p ? p : 0) : p; T.glitch = 1 - p * .7; });
    T.a = 1; T.glitch = 0; K.flash(.9, '200,255,250', 2.5); K.lens({ shake: 5 }, 0);
    all.forEach(a => { a.eyes = 'groot'; }); emote('!', 1.5);
    yield* par(hop(40, .4), ...all.map(a => petJump(a, 34 + rnd() * 20, .4)));
    K.lens({ shake: 0 }, .5);
    all.forEach(a => hold(a, a.pet === 'dobby' ? 'up' : 'sit'));
    yield* wait(2.5); all.forEach(a => { a.eyes = ''; }); kam.eyes = '';
    // it hisses snow. Who dares?
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 2);
    if (has('pippa')) { const p = by('pippa'); hold(p, null); yield* petTo(p, T.x - 230, 50); p.face = 1; hold(p, 'sit'); yield* wait(1.4); emote('dots', 2, p); yield* wait(2); hold(p, null); p.face = -1; emote('angry', 1.5, p); yield* petTo(p, 66, 60); p.face = 1; hold(p, 'sit'); }
    if (has('snoet')) { const s = by('snoet'); hold(s, null); s.face = 1; for (let k = 0; k < 3; k++) { yield* petJump(s, 12, .2); emote('burst', .4, s); } hold(s, 'sit'); }
    yield* wait(1);
    // channel: the sea. Pebbels is enchanted by the fish
    T.stat = 1; yield* wait(.4); setCh('zee'); yield* tween(.8, p => { T.stat = 1 - p; }); T.stat = 0;
    hold(peb, null); peb.eyes = 'groot'; emote('!', 1.2, peb); yield* wait(1);
    peb.front = true; yield* petTo(peb, S.cx - 30, 40); peb.face = 1; hold(peb, 'sit'); peb.eyes = '';
    yield* closeTV(1.7, 2.5);
    for (let k = 0; k < 4; k++) { peb.face = k % 2 ? 1 : -1; yield* wait(.9); }   // her head follows the fish
    emote('heart', 1.6, peb); yield* wait(1.6);
    kam.face = 1; yield* K.lensW({ z: 2.6, cx: K.kx() + 30, cy: FEET - 170 }, .01); kam.eyes = 'groot'; yield* wait(1.4);   // Kamiel, worried
    yield* K.lensW({ z: 1.7, cx: S.cx - 20, cy: S.cy + 40 }, .01);
    // the paw…
    hold(peb, 'paw'); yield* wait(1.2);
    yield* petJump(peb, 20, .3); hold(peb, 'paw'); peb.lift = 26;
    T.wave = 1; T.stat = .25; peb.eyes = 'groot'; emote('!', 1, peb); yield* wait(.6);
    suckUntil = K.t + 1.4; suck(() => ({ x: peb.cx, y: FEET - 40 - peb.lift }), { x: S.cx, y: S.cy }, ['#e8a050', '#f4e6c2', '#ffffff', '#3a2a1a']);
    const x0 = peb.cx;
    yield* tween(1.6, p => { peb.cx = lerp(x0, S.cx, ez(p)); peb.lift = lerp(26, FEET - S.cy - 20, ez(p)); peb.sx = lerp(1, .1, p * p); peb.sq = lerp(1, 2, p); peb.r = Math.sin(p * 20) * .25 * p; peb.alpha = 1 - p * p; T.stat = .25 + p * .75; });
    peb.alpha = 0; peb.sx = 1; peb.sq = 1; peb.r = 0; peb.lift = 0; hold(peb, null);
    K.flash(1, '220,255,255', 2); K.lens({ shake: 6 }, 0); yield* wait(.3); K.lens({ shake: 0 }, .4);
    mini.on = true; mini.mx = 120; mini.mode = 'float'; mini.face = -1; T.wave = 0;
    yield* tween(.8, p => { T.stat = 1 - p; }); T.stat = 0;
    yield* closeTV(2.4, 1.8);
    emote('!?', 2, mini); yield* wait(2.4);
    // everyone frozen
    K.flash(.8); K.grade('sepia', 1, .01); K.setv('ab', 1);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    kam.eyes = 'x'; others.forEach(a => { a.eyes = 'groot'; hold(a, a.pet === 'dobby' ? 'up' : 'stand'); });
    yield* wait(2.6);
    K.setv('ab', 0, .6); K.grade('warm', .45, .8);
    emote('!', 1.5); yield* hop(30, .35); kam.eyes = 'groot';
    others.forEach(a => hold(a, null));
    yield* par(walkTo(S.cx - W / 2 - 200, 140), ...others.map((a, i) => petTo(a, a.pet === 'dobby' ? 880 : 120 + i * 80, K.PET[a.pet].run * 1.4)));
    kam.face = 1; others.forEach(a => { a.face = a.cx < S.cx ? 1 : -1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); });
    emote('sweat', 2.5); yield* wait(2.5);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 2', 'ZAPPEN', 2.6, { size: 44 });

    /* ---------- part 2: everything they try ---------- */
    others.forEach((a, i) => { a.eyes = ''; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.cx = a.pet === 'dobby' ? 900 : 70 + i * 80; a.face = 1; });
    kam.x = -150; kam.face = 1; kam.eyes = '';
    mini.mode = 'wave';
    yield* K.fadeIn(1.4);
    yield* closeTV(2.1, 2); emote('!', 1.2, mini); yield* wait(2.4);
    yield* wide(1.4);
    // the nose against the glass: nothing
    yield* walkTo(S.cx - W / 2 - 120, 60); kam.face = 1; kam.head = .15; yield* wait(.5); kam.sx = .96; yield* wait(.4); kam.sx = 1; kam.head = 0; emote('?', 1.5); yield* wait(1.5);
    // the dial: click, click, click
    yield* walkTo(L0() + 304 - W / 2 + 70, 70); kam.face = -1; kam.head = -.05;
    const shows = ['weer', 'kook', 'western', 'test', 'ruimte'];
    const miniFor = { weer: ['pace', 120], kook: ['sit', 150], western: ['still', 70], test: ['sit', 120], ruimte: ['float', 150] };
    for (let k = 0; k < shows.length; k++) {
      kam.head = .1; yield* wait(.2); kam.head = -.05;
      yield* zap(shows[k], .35);
      mini.mode = miniFor[shows[k]][0]; mini.mx = miniFor[shows[k]][1]; mini.face = -1; mini.lift = 0; mini.r = 0; mini.pose = 'stand';
      if (k % 2 === 0) {
        yield* K.cut(() => K.lens({ z: 2.3, cx: S.cx, cy: S.cy + 10 }, 0), .12);
        if (shows[k] === 'weer') { yield* wait(2.2); mini.mode = 'still'; mini.face = 1; mini.pose = 'stand'; emote('sweat', 2, mini); yield* wait(2); }
        else if (shows[k] === 'western') { yield* wait(1.2); mini.eyes = 'groot'; emote('!', 1.2, mini); yield* tween(1.8, p => { mini.mx = 70 + p * 120; mini.pose = 'walk'; mini.wt += 9 * K.dt; mini.face = 1; }); mini.pose = 'stand'; mini.eyes = ''; yield* wait(.8); }
        else { mini.mode = 'float'; yield* wait(1.4); emote('heart', 1.4, mini); yield* wait(1.6); }
        yield* K.cut(() => K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0), .12);
        kam.eyes = k === 4 ? 'triest' : ''; emote(k === 4 ? 'sweat' : '?', 1.4); yield* wait(1.2);
      } else {
        if (shows[k] === 'kook') { yield* wait(1); emote('heart', 1.2, mini); }
        yield* wait(1.5); kam.eyes = 'boos'; emote('dots', 1.5); yield* wait(1.2); kam.eyes = '';
      }
    }
    mini.mode = 'float';
    yield* walkTo(S.cx - W / 2 - 190, 70); kam.face = 1;
    // Wifi barks at it
    if (has('wifi')) {
      const w = by('wifi'); hold(w, null); w.front = true; yield* petTo(w, S.cx - 60, 110); w.face = 1;
      for (let k = 0; k < 5; k++) { yield* petJump(w, 22, .25); emote('burst', .5, w); T.shake = 3; yield* wait(.15); T.shake = 0; }
      yield* K.cut(() => K.lens({ z: 2.3, cx: S.cx, cy: S.cy + 10 }, 0), .1);
      mini.mode = 'still'; mini.face = -1; mini.pose = 'down'; emote('sweat', 2, mini); yield* wait(2.2); mini.mode = 'float';
      yield* K.cut(() => K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0), .1);
      emote('dots', 1.5); yield* petTo(w, 150, 100); w.face = 1; hold(w, 'sit'); w.front = false;
    }
    // Pippa: a paw, very sure of herself… and a shock
    if (has('pippa')) {
      const p = by('pippa'); hold(p, null); p.front = true; yield* petTo(p, S.cx + 40, 55); p.face = -1; hold(p, 'sit'); yield* wait(1); emote('dots', 1.5, p); yield* wait(1.4);
      hold(p, 'paw'); yield* wait(.8);
      K.flash(.9, '180,220,255', 3); T.stat = 1; p.eyes = 'groot'; emote('stars', 2, p); sparks(S.cx + 20, S.y + S.h - 20, 6, 'rgba(160,220,255,.9)');
      p.sq = 1.25; p.sx = 1.1; yield* petJump(p, 70, .55, S.cx + 200); p.sq = 1.25;
      yield* tween(.5, q => { T.stat = 1 - q; }); T.stat = 0; setCh('zee');
      yield* wait(1.2); p.sq = 1; p.sx = 1; p.eyes = ''; emote('angry', 2, p); hold(p, 'sit'); p.face = -1;
      yield* wait(1.4);
    }
    // Dobby and the cable
    if (has('dobby')) {
      const d = by('dobby'); hold(d, null); d.front = true; yield* petTo(d, 250, 60); d.face = -1; hold(d, 'down');
      yield* K.lensW({ z: 2, cx: 250, cy: FEET - 60 }, 1.2);
      for (let k = 0; k < 4; k++) { d.sq = .95; yield* wait(.25); d.sq = 1; yield* wait(.25); }
      K.flash(1, '255,240,160', 3); sparks(d.cx - 20, FEET - 10, 10); T.power = 0; d.eyes = 'groot'; d.sq = 1.3; d.sx = 1.2; emote('stars', 2.5, d);
      puff(d.cx, FEET - 40, 4, '90,90,90');
      yield* wait(1.4); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
      emote('!', 1.2); kam.eyes = 'groot';
      for (let k = 0; k < 4; k++) { T.power = 1; T.stat = 1; yield* wait(.12); T.power = 0; yield* wait(.18); }
      T.power = 1; setCh('test'); T.stat = .3; yield* tween(.6, q => { T.stat = .3 * (1 - q); }); T.stat = 0;
      mini.mode = 'sit'; mini.mx = 120; d.sq = 1; d.sx = 1; d.eyes = ''; hold(d, 'up'); yield* wait(1.4); emote('sweat', 2, d); yield* wait(1);
      hold(d, null); yield* petTo(d, 380, 60); d.face = 1; hold(d, 'up');
    }
    // a good bump
    kam.eyes = 'boos'; emote('angry', 1.5); yield* walkTo(S.cx - W / 2 - 330, 60); kam.face = 1; yield* wait(.6);
    yield* walkTo(S.cx - W / 2 - 150, 330, 16);
    T.shake = 9; K.lens({ shake: 8 }, 0); kam.eyes = 'x'; emote('stars', 2.5);
    const kx0 = kam.x; yield* tween(.4, p => { kam.x = kx0 - 60 * Math.sin(p * Math.PI / 2); kam.r = -.15 * Math.sin(p * Math.PI); });
    K.lens({ shake: 0 }, .5); T.shake = 0; kam.r = 0;
    T.stat = .6; yield* tween(2.2, p => { T.roll = p * 540; T.stat = .6 * (1 - p); }); T.roll = 0; T.stat = 0; setCh('western');
    mini.mode = 'dizzy'; mini.mx = 120;
    yield* K.cut(() => K.lens({ z: 2.3, cx: S.cx, cy: S.cy + 10 }, 0), .1);
    emote('stars', 2.5, mini); yield* wait(2.6);
    yield* K.cut(() => K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0), .1);
    kam.eyes = 'triest'; yield* wait(1.4); kam.eyes = '';
    // the antenna
    T.stat = .7; mini.mode = 'float'; setCh('ruimte');
    const sn = by('snoet');
    if (sn) {
      hold(sn, null); sn.front = true; yield* petTo(sn, T.x - 140, 150); sn.face = 1;
      const fx0 = sn.cx; hold(sn, 'jump'); yield* tween(.6, p => { sn.cx = lerp(fx0, T.x - 50, p); sn.feet = lerp(FEET, TOP() - 4, p) - Math.sin(p * Math.PI) * 60; }); hold(sn, 'stand');
      for (let k = 0; k < 6; k++) { sn.face = k % 2 ? 1 : -1; T.antL = Math.sin(k * 1.7) * .8; T.stat = k % 2 ? .1 : .9; yield* wait(.5); }
      emote('burst', .6, sn);
      hold(sn, 'jump'); const fx1 = sn.cx; yield* tween(.6, p => { sn.cx = lerp(fx1, T.x - 260, p); sn.feet = lerp(TOP() - 4, FEET, p) - Math.sin(p * Math.PI) * 50; }); sn.feet = FEET; hold(sn, 'sit'); sn.face = 1; sn.front = false;
      T.antL = 0; T.stat = .7;
    }
    // Kamiel holds the antenna: on tiptoe, the head tilted… a perfect picture
    yield* walkTo(T.x - W / 2 - 120, 60); kam.face = 1;
    yield* tween(1.2, p => { kam.r = .22 * ez(p); kam.y = 30 * ez(p); T.antL = -.6 * p; kam.head = -.25 * p; T.stat = .7 * (1 - p); });
    kam.eyes = 'dicht'; T.stat = 0;
    yield* K.lensW({ z: 1.6, cx: S.cx - 60, cy: S.cy - 20 }, 1.2); yield* wait(1.2);
    yield* K.lensW({ z: 2.3, cx: S.cx, cy: S.cy + 10 }, 1.2);
    mini.mode = 'drift'; const m0 = mini.mx;
    yield* tween(5, p => { mini.mx = m0 + p * 40; mini.s = .36 * (1 - p * .7); mini.lift = 40 + p * 40; mini.r += .02; mini.pose = 'jump'; });
    petTears(K, mini, 2); yield* wait(1.2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    kam.eyes = 'groot'; emote('!', 1.2);
    yield* tween(.4, p => { kam.r = .22 * (1 - p); kam.y = 30 * (1 - p); kam.head = -.25 * (1 - p); T.antL = -.6 * (1 - p); T.stat = p * .8; });
    kam.r = 0; kam.y = 0; kam.head = 0;
    yield* wait(1); others.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; }); kam.face = -1; yield* wait(1.2);
    kam.eyes = 'boos'; kam.face = 1; emote('angry', 1.5); yield* wait(1.6);
    // in he goes
    yield* walkTo(S.cx - W / 2 - 60, 50); kam.face = 1;
    kam.sq = .9; yield* wait(.5); kam.sq = 1;
    T.wave = 1; T.stat = .4; suckUntil = K.t + 1.6; suck(() => K.kp(300, 500), { x: S.cx, y: S.cy }, ['#8a5a32', '#6b4426', '#f4e6c2', '#2c180c']);
    const kx1 = kam.x;
    others.forEach(a => { a.eyes = 'groot'; });
    yield* tween(1.8, p => { kam.x = lerp(kx1, S.cx - W / 2, ez(p)); kam.y = lerp(0, 120, ez(p)); kam.sx = lerp(1, .1, p * p); kam.sq = lerp(1, 1.6, p); kam.alpha = 1 - p * p; T.stat = .4 + p * .6; });
    kam.alpha = 0; K.flash(1, '220,255,255', 2);
    yield* par(...others.map(a => petJump(a, 40, .45)));
    minK.on = true; minK.mx = 60; minK.face = 1; minK.eyes = 'groot';
    yield* tween(.6, p => { T.stat = 1 - p; }); T.stat = 0; T.wave = 0;
    yield* closeTV(2.2, 1.4); yield* wait(1.4);
    // the big zoom: into the set
    K.lens({ z: 6.5, cx: S.cx, cy: S.cy }, 3, (p) => p * p * p);
    yield* tween(3, p => { T.stat = p * p; });
    K.flash(1, '255,255,255', 1.5);
    yield* K.cut(() => { K.lens({ z: 1, cx: W / 2, cy: H / 2, rot: 0 }, 0); }, .3);
    yield* K.card('DEEL 3', 'ACHTER HET GLAS', 2.6, { size: 44 });

    /* ---------- part 3: inside the television ---------- */
    inside = 'ruimte'; mini.on = false; minK.on = false;
    others.forEach(a => { a.alpha = 0; });
    K.setv('dark', 0, .01); K.setv('vig', .5);
    crt = crtOver(K);
    K.grade('neon', .5, .01);
    // static doors between the channels
    const door = { x: W - 110, on: false, a: 0 };
    set.back.push((g) => { if (!door.on) return; const x = door.x, y = FEET - 196; g.save(); g.globalAlpha = door.a;
      g.imageSmoothingEnabled = false; g.drawImage(noise(15, 33), x - 45, y, 90, 198);
      g.fillStyle = 'rgba(140,255,240,.9)'; g.fillRect(x - 51, y - 6, 102, 6); g.fillRect(x - 51, y + 198, 102, 6); g.fillRect(x - 51, y, 6, 198); g.fillRect(x + 45, y, 6, 198); g.restore(); glow(g, x, y + 95, 150, '140,255,240', .3 * door.a); });
    let props = [];   // the drawings of one channel, cleared at the next
    const prop = (list, f) => { list.push(f); props.push([list, f]); return f; };
    const clearProps = () => { props.forEach(([l, f]) => set.drop(l, f)); props = []; };
    function* through(a, isKam) {   // into the static door
      if (isKam) { yield* tween(.5, p => { kam.sx = 1 - p * .9; kam.alpha = 1 - p; }); kam.alpha = 0; kam.sx = 1; }
      else { yield* tween(.4, p => { a.sx = 1 - p * .9; a.alpha = 1 - p; }); a.alpha = 0; a.sx = 1; }
    }
    function* channel(ch, grade, gs) { yield* K.cut(() => { clearProps(); inside = ch; if (grade) K.grade(grade, gs === undefined ? .5 : gs, .01); }, .25); }
    // space: Kamiel floats down in a helmet
    K.withOutfit(['astrohelm']); peb.alpha = 1; peb.cx = 700; peb.face = -1; hold(peb, 'jump'); peb.feet = FEET; peb.front = false;
    kam.x = -220; kam.y = 330; kam.alpha = 1; kam.sx = 1; kam.sq = 1; kam.face = 1; kam.eyes = 'groot'; kam.pose = '';
    peb.floaty = true;
    const star = { x: 640, y: FEET - 170 };
    prop(set.back, () => { if (peb.floaty) { peb.lift = 60 + Math.sin(K.t * 1.4) * 18; peb.r = Math.sin(K.t * .8) * .4; } });
    prop(set.front, (g) => { K.sprC(g, K.SP.star, star.x, star.y + Math.sin(K.t * 2) * 6, 6); });
    yield* K.fadeIn(.8);
    yield* tween(5, p => { kam.y = 330 * (1 - ez(p)) + Math.sin(p * 9) * 8 * (1 - p); kam.r = Math.sin(p * 6) * .12 * (1 - p); });
    kam.y = 0; kam.r = 0; kam.eyes = '';
    yield* K.lensW({ z: 1.6, cx: 640, cy: FEET - 150 }, 1.4);
    peb.face = 1; yield* wait(.6); peb.face = -1; yield* tween(.8, p => { star.x = lerp(640, 540, p); star.y = FEET - 170 - p * 40; }); emote('notes', 2, peb); yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    emote('heart', 1.5);
    for (let k = 0; k < 2; k++) { const x0 = kam.x; yield* tween(1.3, p => { kam.x = x0 + 90 * p; kam.y = Math.sin(p * Math.PI) * 110; kam.r = .1 * Math.sin(p * Math.PI); }); kam.y = 0; kam.r = 0; }
    door.on = true; yield* tween(.6, p => { door.a = p; });
    peb.eyes = 'groot'; emote('!', 1, peb); peb.face = 1;
    yield* tween(1.6, p => { peb.cx = lerp(700, door.x, ez(p)); }); peb.floaty = false; peb.lift = 0; peb.r = 0; hold(peb, null);
    yield* through(peb);
    kam.eyes = 'boos'; yield* walkTo(door.x - W / 2 - 40, 110); yield* through(null, true);
    // the weather: a rain cloud follows Kamiel everywhere
    yield* channel('weer', 'neon', .45);
    K.withOutfit([]);
    door.x = W - 100; door.a = 1; peb.alpha = 1; peb.cx = 800; peb.face = -1; hold(peb, 'sit');
    kam.alpha = 1; kam.x = -330; kam.face = 1; kam.eyes = '';
    const rc = { x: K.kx(), y: 150, rain: 0, bolt: 0 };
    prop(set.front, (g) => { K.sprC(g, K.SP.raincloud, rc.x, rc.y, 14);
      if (rc.rain) for (let k = 0; k < 10; k++) { const yy = ((K.t * 500 + k * 47) % 300); R(g, rc.x - 60 + k * 13, rc.y + 34 + yy, 4, 14, 'rgba(126,200,255,.85)'); }
      if (rc.bolt > 0) { g.fillStyle = '#ffe14d'; const bx = rc.x, by = rc.y + 30; [[0, 0], [-12, 30], [6, 30], [-14, 70], [4, 70], [-10, 120]].forEach(([dx, dy]) => g.fillRect(bx + dx - 6, by + dy, 14, 34)); } });
    prop(set.back, (g) => { gridC(g, ['..Y.Y..', 'Y.YYY.Y', '.YYYYY.', 'YYYYYYY', '.YYYYY.', 'Y.YYY.Y', '..Y.Y..'], { Y: '#ffd23f' }, 800, 150 + Math.sin(K.t * 2) * 4, 14); });
    yield* wait(1); rc.rain = 1; kam.eyes = 'triest'; emote('sweat', 2); yield* wait(2);
    yield* walkTo(-150, 90); rc.rain = 0; yield* tween(.8, p => { rc.x = lerp(rc.x, K.kx(), p); }); rc.rain = 1; emote('dots', 1.5); yield* wait(1.6);
    yield* walkTo(-330, 140); yield* tween(.5, p => { rc.x = lerp(rc.x, K.kx(), p); }); kam.face = -1; kam.eyes = 'boos'; emote('angry', 1.4); yield* wait(1.4);
    rc.bolt = 1; K.flash(1, '255,250,200', 3); kam.eyes = 'x'; kam.mouth = .6; emote('stars', 2.5); puff(K.kx(), FEET - 200, 3, '80,80,80');
    kam.filter = 'brightness(.55) contrast(1.3)'; yield* wait(.3); rc.bolt = 0;
    yield* K.lensW({ z: 2.2, cx: K.kx(), cy: FEET - 170 }, .01); yield* wait(2); kam.mouth = 0;
    yield* K.lensW({ z: 1.8, cx: 800, cy: FEET - 120 }, .01); peb.face = -1; emote('notes', 2, peb); yield* wait(2.2);   // she sits in the sun, dry
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .8);
    kam.filter = ''; rc.rain = 0; kam.eyes = 'boos'; kam.face = 1;
    yield* par(walkTo(100, 150), (function* () { yield* wait(.4); peb.eyes = 'groot'; hold(peb, null); peb.face = 1; yield* petTo(peb, door.x, 150); yield* through(peb); peb.eyes = ''; })());
    yield* walkTo(door.x - W / 2 - 40, 150); yield* through(null, true);
    // the western: a standoff
    yield* channel('western', 'noir', .9);
    K.withOutfit(['cowboy']);
    door.on = false; peb.alpha = 1; peb.cx = 780; peb.face = -1; hold(peb, null); kam.alpha = 1; kam.x = -300; kam.face = 1; kam.eyes = 'boos';
    const dust = K.weather('dust', .8);
    const tw = { x: -80 };
    prop(set.front, (g) => { const y = FEET - 30 - Math.abs(Math.sin(K.t * 5)) * 30; for (let k = 0; k < 26; k++) { const a = k * .9 + K.t * 6; R(g, tw.x + Math.cos(a) * (14 + (k % 3) * 8), y + Math.sin(a * 1.3) * (12 + (k % 4) * 6), 6, 6, k % 2 ? '#6a5030' : '#8a6a40'); } });
    yield* wait(1.5);
    yield* K.lensW({ z: 3.2, cx: K.kx() + 40, cy: FEET - 190 }, .01); yield* wait(1.8);
    yield* K.lensW({ z: 3.2, cx: peb.cx - 20, cy: FEET - 70 }, .01); yield* wait(1.8);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    yield* tween(3.5, p => { tw.x = lerp(-80, W + 80, p); });
    yield* K.lensW({ z: 3.6, cx: K.kx() + 40, cy: FEET - 190 }, .01); yield* wait(1.2);
    yield* K.lensW({ z: 3.6, cx: peb.cx - 20, cy: FEET - 70 }, .01); yield* wait(.8); hold(peb, 'lie'); emote('zzz', 1.6, peb); yield* wait(1.5);   // she yawns
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01); kam.eyes = 'groot'; emote('!?', 1.5); yield* wait(1);
    hold(peb, null); peb.face = 1; door.on = true; door.x = W - 70; door.a = 1;
    yield* par((function* () { yield* petTo(peb, door.x, 160); yield* through(peb); })(), (function* () { yield* wait(.5); kam.eyes = 'boos'; yield* walkTo(door.x - W / 2 - 40, 170, 16); })());
    yield* through(null, true); stop(dust);
    // the cooking show: flour everywhere
    yield* channel('kook', 'warm', .45);
    K.withOutfit([]);
    door.x = 80; door.on = false; peb.alpha = 1; peb.cx = 270; peb.feet = FEET - 104; peb.face = 1; hold(peb, 'sit');   // on the counter, next to the cake
    kam.alpha = 1; kam.x = 360; kam.face = -1; kam.eyes = 'groot';
    yield* wait(1); emote('!', 1);
    yield* walkTo(140, 200, 18);
    yield* tween(1, p => { kam.r = -p * Math.PI * 2; kam.y = Math.sin(p * Math.PI) * 90; kam.x = 140 - p * 60; }); kam.r = 0; kam.y = 0;
    K.lens({ shake: 6 }, 0); puff(K.kx(), FEET - 80, 10, '250,250,250'); kam.filter = 'brightness(1.6) saturate(.15)'; kam.eyes = 'x';
    yield* wait(.4); K.lens({ shake: 0 }, .4); yield* wait(1.4);
    yield* K.lensW({ z: 2.2, cx: peb.cx, cy: peb.feet - 60 }, .01); peb.face = -1; emote('notes', 2.2, peb); yield* wait(2.2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    kam.eyes = 'dicht'; yield* shiver(1, 8); puff(K.kx(), FEET - 120, 6, '250,250,250'); kam.filter = ''; kam.eyes = 'boos'; emote('angry', 1.5); yield* wait(1);
    door.on = true; door.a = 0; yield* tween(.4, p => { door.a = p; });
    hold(peb, 'jump'); const pf = peb.cx; yield* tween(.7, p => { peb.cx = lerp(pf, 170, p); peb.feet = lerp(FEET - 104, FEET, p) - Math.sin(p * Math.PI) * 60; }); peb.feet = FEET; hold(peb, null);
    peb.face = -1; yield* petTo(peb, door.x, 150); yield* through(peb);
    yield* walkTo(door.x - W / 2 + 40, 150); yield* through(null, true);
    // the test card: everything stands still. She is tired. He finds her.
    yield* channel('test', 'neon', .25);
    door.on = false; peb.alpha = 1; peb.cx = 560; peb.face = -1; hold(peb, 'lie'); peb.eyes = '';
    kam.alpha = 1; kam.x = -320; kam.face = 1; kam.eyes = '';
    yield* wait(1.5); emote('dots', 2); yield* wait(1);
    yield* walkTo(-20, 45); kam.head = .25; yield* wait(1);
    yield* K.lensW({ z: 1.9, cx: 520, cy: FEET - 120 }, 1.8);
    hold(peb, 'sit'); peb.face = -1; yield* wait(.8); emote('heart', 2, peb); kam.eyes = 'blij'; emote('hearts', 2.5); yield* wait(2.5);
    kam.head = 0; yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.4);
    // a light from the side: the way out
    const gx = 600, gy = 70, gw = 330, gh = 430;
    const giants = others.map((a, i) => ({ pet: a.pet, s: 3, face: -1, pose: 'stand', cx: gx + 60 + i * 95, feet: gy + gh + 80 - (i % 2) * 40, lift: 0, r: 0, sq: 1, sx: 1, alpha: 1, eyes: 'groot', noShadow: true, ph: i }));
    let lick = 0;
    function drawGlass(g) {
      R(g, 0, 0, W, H, '#060814');
      for (let k = 0; k < 9; k++) { const p = k / 9, x0 = lerp(0, 300, p), y0 = lerp(0, 230, p); g.strokeStyle = `rgba(80,140,255,${.08 + p * .1})`; g.lineWidth = 4; g.strokeRect(x0, y0, Math.max(10, lerp(W, 300, p) - x0), Math.max(10, lerp(H, 370, p) - y0)); }
      R(g, 0, FEET - 6, W, H - FEET + 6, '#0b1024'); for (let x = 0; x < W; x += 48) R(g, x, FEET - 6, 3, H, 'rgba(80,140,255,.15)');
      g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip();
      R(g, gx, gy, gw, gh, '#3b4f6b'); R(g, gx, gy + gh * .62, gw, gh * .38, '#6b4428'); glow(g, gx + 40, gy + 90, 140, '255,190,120', .4);
      for (const o of giants) { o.lift = Math.abs(Math.sin(K.t * 3 + o.ph)) * 26; K.A.drawPet(g, o); }
      if (lick > 0) { const o = giants.find(q => q.pet === 'snoet') || giants[0]; if (o) { const n = K.A.petPoint(o, 'nose'); R(g, n.x - 18, n.y - 4, 30, 26 + Math.sin(K.t * 16) * 10, 'rgba(255,120,150,.9)'); } }
      g.fillStyle = 'rgba(90,150,255,.2)'; g.fillRect(gx, gy, gw, gh);
      g.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(gx + 30 + k * 110, gy); g.lineTo(gx + 70 + k * 110, gy); g.lineTo(gx - 40 + k * 110, gy + gh); g.lineTo(gx - 80 + k * 110, gy + gh); g.closePath(); g.fill(); }
      g.restore();
      R(g, gx - 8, gy - 8, gw + 16, 8, '#9fd8ff'); R(g, gx - 8, gy + gh, gw + 16, 8, '#9fd8ff'); R(g, gx - 8, gy, 8, gh, '#9fd8ff'); R(g, gx + gw, gy, 8, gh, '#9fd8ff');
      glow(g, gx + gw / 2, gy + gh / 2, 380, '120,190,255', .25);
    }
    yield* channel('glas', 'neon', .3);
    yield* wait(1.2); kam.face = 1; kam.eyes = 'groot'; emote('!', 1.5); peb.face = 1; emote('!', 1.2, peb); yield* wait(1.4);
    yield* K.lensW({ z: 1.5, cx: gx + gw / 2, cy: gy + gh / 2 }, 2);
    lick = 1; yield* wait(2.4); lick = 0; yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    kam.eyes = 'blij'; emote('hearts', 2); yield* wait(1.6);
    // together: a run and a jump
    hold(peb, null); kam.eyes = 'boos';
    yield* par(walkTo(-80, 160, 16), petTo(peb, 380, 160));
    yield* par((function* () { const x0 = kam.x; yield* tween(.8, p => { kam.x = lerp(x0, gx + 140 - W / 2, p); kam.y = Math.sin(p * Math.PI) * 140; kam.r = -.15; }); })(),
      (function* () { const x0 = peb.cx; hold(peb, 'jump'); yield* tween(.8, p => { peb.cx = lerp(x0, gx + 200, p); peb.lift = Math.sin(p * Math.PI) * 160; }); })());
    K.flash(1, '255,255,255', 1.2); kam.y = 0; kam.r = 0; peb.lift = 0;
    clearProps(); inside = null; K.unover(crt); K.grade('warm', .45, .01); K.setv('dark', .34, .01); K.setv('vig', .55);
    /* ---------- part 4: out of the set ---------- */
    setCh('sneeuw'); T.stat = 1; T.wave = 1;
    kam.alpha = 0; peb.alpha = 0; others.forEach((a, i) => { a.alpha = 1; a.cx = a.pet === 'dobby' ? 400 : 70 + i * 80; a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.eyes = ''; a.front = false; });
    yield* wait(1.2);
    yield* K.lensW({ z: 1.3, cx: T.x - 80, cy: FEET - 200 }, 1);
    for (let k = 0; k < 3; k++) { yield* tween(.35, p => { T.bulge = Math.sin(p * Math.PI) * (1 + k * .5); }); yield* wait(.3); }
    // out they fly
    K.flash(1, '230,255,255', 1.6); K.lens({ shake: 8 }, 0); T.bulge = 0;
    kam.alpha = 1; peb.alpha = 1; peb.front = true; kam.face = -1; peb.face = -1; hold(peb, 'jump'); kam.eyes = 'x'; peb.eyes = 'groot';
    puff(S.cx, S.cy, 6, '200,240,255');
    yield* par(tween(1, p => { kam.x = lerp(S.cx - W / 2, -60, p); kam.y = lerp(140, 0, p) + Math.sin(p * Math.PI) * 120; kam.sx = lerp(.2, 1, Math.min(1, p * 2)); kam.sq = lerp(1.6, 1, Math.min(1, p * 2)); kam.r = -p * Math.PI * 2; }),
      tween(1.1, p => { peb.cx = lerp(S.cx, 250, p); peb.lift = lerp(FEET - S.cy, 0, p) + Math.sin(p * Math.PI) * 100; peb.sx = lerp(.2, 1, Math.min(1, p * 2)); peb.sq = lerp(1.8, 1, Math.min(1, p * 2)); peb.r = -p * 6.28; }));
    kam.x = -60; kam.y = 0; kam.r = 0; kam.sx = 1; kam.sq = .85; peb.r = 0; peb.lift = 0; peb.sx = 1; peb.sq = 1; hold(peb, 'lie');
    K.lens({ shake: 0 }, .5); T.wave = 0; puff(K.kx(), FEET - 20, 5); yield* wait(.2); kam.sq = 1;
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    kam.eyes = 'spiraal'; emote('stars', 2.5); yield* wait(2.4); kam.eyes = 'blij'; hold(peb, 'sit'); peb.eyes = '';
    // everyone on top of them
    others.forEach(a => hold(a, null));
    yield* par(...others.map((a, i) => petTo(a, i < 2 ? 120 + i * 60 : 330 + i * 50, K.PET[a.pet].run * 1.6)));
    others.forEach(a => { a.face = a.cx < 250 ? 1 : -1; emote('hearts', 2.5, a); }); emote('hearts', 2.5); emote('heart', 2.5, peb);
    yield* par(...others.map(a => petJump(a, 30, .4)), hop(30, .4));
    if (sn) { sn.front = true; yield* petTo(sn, peb.cx + 50, 120); sn.face = -1; hold(sn, 'down'); emote('hearts', 2, sn); yield* wait(1.6); hold(sn, null); }
    yield* wait(1.2);
    // and now… off with it
    T.stat = .5; kam.eyes = 'boos'; kam.face = 1; all.forEach(a => { a.face = 1; }); emote('dots', 2); yield* wait(2);
    const dob = by('dobby');
    if (dob) { yield* petTo(dob, 300, 80); dob.face = -1; hold(dob, 'down'); yield* wait(.8); sparks(dob.cx - 20, FEET - 10, 8); cab.cut = 1; dob.eyes = 'groot'; emote('!', 1, dob); }
    else { yield* walkTo(-380, 80); kam.face = -1; kam.head = .3; yield* wait(.8); cab.cut = 1; kam.head = 0; sparks(40, FEET - 10, 6); }
    T.stat = 0;
    yield* K.lensW({ z: 2.1, cx: S.cx, cy: S.cy + 10 }, 1);
    yield* tween(2.4, p => { T.off = p; });
    T.power = 0; T.off = 0;
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.6);
    yield* wait(1); kam.eyes = 'dicht'; emote('sweat', 2); all.forEach(a => { if (a.alpha) emote('dots', 2, a); }); yield* wait(2.5);
    kam.eyes = ''; if (dob) { hold(dob, null); dob.eyes = ''; }
    // …one last time, by itself
    T.power = 1; T.heidi = 1; tvLight.col = '240,220,255'; K.flash(.4, '240,220,255', 3);
    yield* K.lensW({ z: 2.1, cx: S.cx, cy: S.cy + 10 }, .01);
    yield* wait(2.4); heidiTV.eyes = 'blij'; yield* wait(1.2); heidiTV.eyes = 'vies';
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    kam.eyes = 'groot'; emote('!?', 2); all.forEach(a => { a.eyes = 'groot'; emote('!', 1.6, a); }); yield* hop(30, .35); yield* wait(1.4);
    yield* K.lensW({ z: 2.1, cx: S.cx, cy: S.cy + 10 }, .6);
    yield* tween(1.8, p => { T.off = p; }); T.power = 0;
    yield* wait(1);
    yield* K.ending('EINDE');
  } };

  /* ======================================================================
     HET REGIME — Heidi puts on a crown and an army coat and takes over the farm square: her portrait on a
     billboard, banners, goose-stepping, all the hay is hers. At night the resistance meets in the cellar
     (Kamiel in a beret, a red flag with a carrot), makes a plan and sabotages. The uprising: the podium
     caves in, the portrait falls in slow motion, the red flag goes up, Heidi flees. Epilogue: a vote.
     ====================================================================== */
  const CROWN = ['Y..Y..Y', 'YY.Y.YY', 'YYYYYYY', 'YRYBYRY', 'yyyyyyy'];
  const CROWN_PAL = { Y: '#f5c518', y: '#b8860b', R: '#e23b3b', B: '#3b6be2' };
  const HAY = ['.Y.Y.Y.', 'Y.YYY.Y', '.YYYYY.', '..YYY..', '.RRRRR.', '..YYY..', '.YYYYY.', 'Y.YYY.Y', '.Y.Y.Y.'];
  const CARROT = ['....G.G', '.....GG', '....OOG', '...OOO.', '..OOO..', '.OOO...', 'OO.....'];
  const KAM_FACE = ['.BB......BB.', '.BbB....BbB.', '..BBBBBBBB..', '.BBBBBBBBBB.', '.BCCCCCCCCB.', '.BCKCCCCKCB.', '.BCCCCCCCCB.', '..CCCnnCCC..', '..CCCCCCCC..', '..CCmmmmCC..', '...CCCCCC...', '...BBBBBB...'];
  const KAM_PAL = { B: '#8a5a32', b: '#e9a3a8', C: '#b07a48', K: '#2a1a14', n: '#5a3a22', m: '#4a2a1a' };
  const CHALK = {
    crown: ['W..W..W', 'WW.W.WW', 'WWWWWWW', 'W.....W', 'WWWWWWW'],
    arrow: ['...W...', '....W..', 'WWWWWW.', '....W..', '...W...'],
    dog: ['W.....W', 'WW...WW', 'WWWWWWW', 'W.W.W.W', 'WWWWWWW', '.WW.WW.', '..WWW..'],
    bunny: ['.W...W.', '.W...W.', '.W...W.', '.WWWWW.', 'W.W.W.W', 'WWWWWWW', '.WWWWW.'],
    podium: ['WWWWWWWWW', 'W.......W', 'W.......W', 'WWWWWWWWW', '.........', '..W.W.W..', '....W....', '....W.W.W'],
    frame: ['WWWWWWW', 'W.....W', 'W.W.W.W', 'W.....W', 'W..W..W', 'W.....W', 'WWWWWWW'],
    down: ['..W..', '..W..', '..W..', 'WWWWW', '.WWW.', '..W..'],
    flag: ['WRRRRR', 'WRRRRR', 'WRRRRR', 'WRRRRR', 'W.....', 'W.....', 'W.....', 'W.....'],
  };
  F['film-revolutie'] = { run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez } = K;
    const names = K.castNames();
    const has = (n) => names.includes(n);
    const ST = { place: 'plein', night: 0, banners: 0, portrait: 0, pRot: 0, pDown: false, mustache: 0, fence: 0, hay: 1, podium: 0, sink: 0, hflag: 1, rflag: 0, board: 0, tunnel: 0, rope: 1, ballot: 0, tallyK: 0, tallyH: 0, pick: '' };
    const PIV = { x: 556, y: FEET - 8 };   // the billboard falls over its right foot
    function paintPlein(g) {
      const night = ST.night;
      for (let y = 0; y < 470; y += 6) { const p = y / 470; R(g, 0, y, W, 6, night ? `rgb(${Math.round(14 + 20 * p)},${Math.round(20 + 26 * p)},${Math.round(52 + 40 * p)})` : `rgb(${Math.round(120 + 90 * p)},${Math.round(180 + 50 * p)},${Math.round(240 + 10 * p)})`); }
      if (night) { for (let k = 0; k < 40; k++) if (Math.sin(K.t * 2 + k * 3) > -.6) R(g, hash(k) * W, hash(k + 9) * 300, 3, 3, '#ffffff'); disc(g, 760, 120, 22, '#f4ecc8'); disc(g, 770, 112, 20, 'rgb(20,28,62)'); }
      else { disc(g, 790, 110, 30, '#fff3a0'); R(g, 80, 120, 90, 14, '#ffffff'); R(g, 100, 108, 46, 12, '#ffffff'); R(g, 560, 80, 70, 12, '#ffffff'); }
      for (let x = 0; x < W; x += 6) { const h1 = 380 + Math.sin(x * .008) * 30 + Math.sin(x * .021) * 12; R(g, x, h1, 6, 480 - h1, night ? '#1d3a2a' : '#6aa85a'); }
      // the house on the left
      R(g, 10, 300, 200, 180, night ? '#5a5040' : '#e8d8b0'); for (let k = 0; k < 9; k++) R(g, 0 + k * 12, 300 - k * 12, 220 - k * 24, 12, night ? '#3a2416' : '#7a4a2a');
      R(g, 40, 340, 50, 50, night ? (ST.place === 'plein' ? '#ffd88a' : '#2a2a3a') : '#8fc8ff'); R(g, 63, 340, 4, 50, '#5a3a22'); R(g, 40, 363, 50, 4, '#5a3a22'); R(g, 130, 380, 50, 100, '#6a4428');
      // the barn
      const bc = night ? '#5a1e1a' : '#a8322a', tr = night ? '#a0a0a0' : '#f4efe6';
      R(g, 290, 200, 380, 280, bc); for (let k = 0; k < 10; k++) R(g, 280 + k * 20, 200 - k * 10, 400 - k * 40, 10, night ? '#2a1a14' : '#5a3a28');
      for (let x = 300; x < 670; x += 24) R(g, x, 200, 3, 280, night ? '#4a1612' : '#8e2a22');
      R(g, 290, 200, 380, 6, tr); R(g, 290, 200, 6, 280, tr); R(g, 664, 200, 6, 280, tr);
      R(g, 452, 226, 56, 50, tr); R(g, 458, 232, 44, 44, '#2a1a10'); for (let k = 0; k < 6; k++) R(g, 460 + k * 7, 262 - (k % 3) * 4, 4, 14, '#e8c35a');
      R(g, 410, 330, 140, 150, tr); R(g, 416, 336, 128, 144, night ? '#4a1612' : '#8e2a22'); for (let k = 0; k < 18; k++) { R(g, 416 + k * 7, 336 + k * 8, 8, 8, tr); R(g, 536 - k * 7, 336 + k * 8, 8, 8, tr); } R(g, 477, 336, 6, 144, tr);
      // the watchtower
      R(g, 856, 170, 8, 310, '#4a3020'); R(g, 924, 170, 8, 310, '#4a3020'); for (let y = 200; y < 470; y += 60) { R(g, 856, y, 76, 5, '#4a3020'); }
      R(g, 840, 150, 108, 20, '#5a3a28'); R(g, 846, 120, 8, 30, '#5a3a28'); R(g, 934, 120, 8, 30, '#5a3a28'); R(g, 840, 112, 108, 10, '#3a2416');
      R(g, 876, 130, 34, 20, '#2b2b2b'); R(g, 868, 136, 10, 12, ST.night ? '#fff4c0' : '#9a9a9a');
      // the flagpole: Heidi's flag, or the red one
      R(g, 244, 90, 6, 390, '#c9c9d0'); disc(g, 247, 88, 6, '#f5c518');
      if (ST.hflag > 0) { const fy = lerp(440, 100, ST.hflag); for (let k = 0; k < 14; k++) R(g, 250 + k * 6, fy + Math.sin(K.t * 4 - k * .5) * 3, 6, 50, '#5a2a7a'); gridC(g, CROWN, CROWN_PAL, 292, fy + 25 + Math.sin(K.t * 4 - 7 * .5) * 3, 4); }
      if (ST.rflag > 0) { const fy = lerp(440, 100, ST.rflag); for (let k = 0; k < 16; k++) R(g, 250 + k * 6, fy + Math.sin(K.t * 5 - k * .5) * 4, 6, 60, k % 5 === 0 ? '#a8181e' : '#d8242c'); gridC(g, CARROT, { O: '#ffb040', G: '#6ad860' }, 298, fy + 30 + Math.sin(K.t * 5 - 8 * .5) * 4, 5); }
      // the ground
      R(g, 0, 470, W, H - 470, night ? '#4a4438' : '#b8a888');
      for (let y = 476, r = 0; y < H; y += 16, r++) for (let x = (r % 2) * 18; x < W; x += 36) R(g, x, y, 30, 10, night ? '#555044' : '#c8b898');
      // banners on the barn
      if (ST.banners > 0) for (const bx of [312, 600]) { const bh = 170 * ST.banners; R(g, bx, 210, 48, bh, '#c3202b'); R(g, bx, 210, 48, 4, '#8a1520');
        g.save(); g.beginPath(); g.rect(bx, 210, 48, bh); g.clip(); grid(g, HEIDI_FACE, HEIDI_PAL, bx + 4, 226, 2.5); gridC(g, HAY, { Y: '#ffd23f', R: '#8a1520' }, bx + 24, 330, 4); g.restore(); R(g, bx - 4, 206, 56, 6, '#f5c518'); }
      // the hay (behind a fence, once it is hers)
      if (ST.hay > 0) { const hx = 765, s = ST.hay * 1.5; for (let k = 0; k < 9; k++) { const w = (150 - k * 14) * s; R(g, hx - w / 2, FEET - 30 - k * 10 * s, w, 12 * s, k % 2 ? '#e8c35a' : '#d8a840'); }
        for (let k = 0; k < 22; k++) R(g, hx - 60 * s + hash(k) * 120 * s, FEET - 50 - hash(k + 3) * 80 * s, 4, 14, '#f4d878'); }
      if (ST.fence > 0) { const a = ST.fence; for (let x = 670; x < 860; x += 24) R(g, x, FEET - 70 * a + 10, 8, 70 * a, '#7a5a3a'); R(g, 666, FEET - 50 * a + 10, 200, 6, '#8a6a4a'); R(g, 666, FEET - 25 * a + 10, 200, 6, '#8a6a4a'); }
    }
    function drawBillboard(g) {   // poles, ropes and Heidi's portrait (in front of the barn)
      if (ST.portrait <= 0) return;
      // the rope to the peg on the left
      if (ST.rope > 0 && !ST.pDown) { for (let k = 0; k < 24; k++) R(g, lerp(405, 330, k / 24), lerp(170, FEET - 6, k / 24), 3, 3, '#d8c8a0'); R(g, 324, FEET - 12, 10, 14, '#5a3a22'); }
      else if (ST.rope <= 0 && !ST.pDown) { R(g, 324, FEET - 12, 10, 14, '#5a3a22'); for (let k = 0; k < 6; k++) R(g, 330 + k * 3, FEET - 14 - k * 6, 3, 3, '#d8c8a0'); }
      g.save(); g.translate(PIV.x, PIV.y); g.rotate(ST.pRot); g.translate(-PIV.x, -PIV.y);
      const top = 150, uh = Math.round(254 * ST.portrait);
      R(g, 412, top, 10, FEET - top - 8, '#5a3a22'); R(g, 546, top, 10, FEET - top - 8, '#5a3a22');
      g.beginPath(); g.rect(390, top - 6, 190, uh + 12); g.clip();
      R(g, 398, top, 164, 254, '#c9a050'); R(g, 404, top + 6, 152, 242, '#e9d8f0'); R(g, 404, top + 6, 152, 242, 'rgba(120,60,160,.25)');
      gridC(g, CROWN, CROWN_PAL, 480, top + 30, 9);
      grid(g, HEIDI_FACE, HEIDI_PAL, 408, top + 58, 9);
      if (ST.mustache > 0) { const mx = 480, my = top + 58 + 13.4 * 9; R(g, mx - 40, my, 80 * ST.mustache, 12, '#1a1a1a'); R(g, mx - 52, my - 10, 14, 12, '#1a1a1a'); R(g, mx + 38, my - 10, 14 * ST.mustache, 12, '#1a1a1a'); }
      R(g, 398, top + uh - 4, 164, 8, '#c9a050');
      g.restore();
    }
    function paintKelder(g) {
      R(g, 0, 0, W, H, '#2a1c14'); for (let x = 0; x < W; x += 40) R(g, x, 0, 4, H, '#22160f');
      R(g, 0, 70, W, 34, '#1c120c'); for (let x = 60; x < W; x += 220) R(g, x, 70, 26, 470, '#1c120c');
      // barrels
      for (const bx of [70, 170]) { R(g, bx - 40, 400, 80, 140, '#5a3a22'); R(g, bx - 44, 420, 88, 10, '#3a3a3a'); R(g, bx - 44, 500, 88, 10, '#3a3a3a'); R(g, bx - 30, 400, 6, 140, '#6a4a2a'); }
      // the chalkboard: the plan
      R(g, 590, 130, 330, 270, '#6a4a2a'); R(g, 600, 140, 310, 250, '#1c2a24');
      const ch = { W: 'rgba(240,240,230,.92)', R: '#d8242c' };
      if (ST.board >= 1) { grid(g, CHALK.crown, ch, 620, 160, 6); grid(g, CHALK.arrow, ch, 676, 160, 6); grid(g, CHALK.dog, ch, 730, 154, 6); }
      if (ST.board >= 2) { grid(g, CHALK.podium, ch, 800, 156, 6); grid(g, CHALK.bunny, ch, 812, 208, 5); }
      if (ST.board >= 3) { grid(g, CHALK.frame, ch, 630, 260, 6); grid(g, CHALK.down, ch, 680, 272, 6); grid(g, CHALK.dog, ch, 730, 270, 5); }
      if (ST.board >= 4) { grid(g, CHALK.flag, ch, 810, 260, 8); }
      R(g, 0, 520, W, H - 520, '#3a2a1e'); for (let x = 0; x < W; x += 60) R(g, x + 10, 530, 30, 4, '#2a1c14');
      // the crate with the candle
      R(g, 420, 470, 120, 78, '#7a5a3a'); R(g, 420, 470, 120, 6, '#9a7a4a'); R(g, 426, 480, 108, 4, '#5a3a22'); R(g, 426, 510, 108, 4, '#5a3a22');
      R(g, 474, 438, 12, 32, '#f4efe6'); const fl = Math.sin(K.t * 17) * 2; R(g, 477 + fl, 424, 6, 12, '#ffd23f'); R(g, 478 + fl, 428, 4, 6, '#ffffff'); glow(g, 480, 430, 60, '255,200,100', .5);
    }
    function paintBallot(g) {
      if (ST.ballot <= 0) return; const a = ST.ballot;
      g.save(); g.globalAlpha = a; R(g, 330, 160, 300, 230, '#6a4a2a'); R(g, 338, 168, 284, 214, '#f4efe6');
      for (const [i, face, pal, tally] of [[0, KAM_FACE, KAM_PAL, ST.tallyK], [1, HEIDI_FACE, HEIDI_PAL, ST.tallyH]]) {
        const cx = 410 + i * 140, hl = ST.pick === (i ? 'h' : 'k');
        if (hl) R(g, cx - 54, 174, 108, 140, '#ffd23f');
        R(g, cx - 48, 180, 96, 128, '#d8e8f0'); gridC(g, face, pal, cx, 244, i ? 5 : 7);
        for (let k = 0; k < tally; k++) { if (k === 4) R(g, cx - 40, 336, 60, 5, '#2a1a14'); else R(g, cx - 34 + k * 14, 320, 5, 40, '#2a1a14'); }
      }
      g.restore();
    }
    let tunnel = 0;
    const set = filmSet(K, (g) => { if (ST.place === 'kelder') { paintKelder(g); return; } paintPlein(g); paintBallot(g); drawBillboard(g);
      if (ST.podium > 0) { const y = FEET - 60 + ST.sink; R(g, 422, y, 116, 68 - ST.sink, '#7a5a3a'); R(g, 422, y, 116, 8, '#9a7a4a'); R(g, 430, y + 16, 100, 4, '#5a3a22'); R(g, 430, y + 40, 100, 4, '#5a3a22'); gridC(g, CROWN, CROWN_PAL, 480, y + 30, 4); }
      if (tunnel > 0) { R(g, 300, FEET + 4, 180 * tunnel, 14, '#2a1c14'); R(g, 300, FEET + 2, 180 * tunnel, 3, '#5a4a38'); } });
    // props drawn with the cast: straws, the stolen crown, the red flag in Kamiel's hand
    const straw = (a) => (g) => { if (!a.straw || a.alpha <= 0) return; const n = K.A.petPoint(a, 'nose'), d = a.face > 0 ? 1 : -1; for (let k = 0; k < 8; k++) R(g, n.x + d * k * 4, n.y + 4 - k * 1.5, 4, 3, '#f4d060'); };
    let flagKam = 0;
    set.front.push((g) => { if (!flagKam) return; const p = K.kp(560, 640), top = p.y - 230, x = p.x;
      R(g, x - 3, top, 6, 240, '#8a6a4a'); for (let k = 0; k < 14; k++) R(g, x + 3 + k * 7 * (kam.face > 0 ? -1 : 1) - (kam.face > 0 ? 7 : 0), top + Math.sin(K.t * 6 - k * .6) * 4, 7, 56, k % 5 === 0 ? '#a8181e' : '#d8242c');
      gridC(g, CARROT, { O: '#ffb040', G: '#6ad860' }, x + (kam.face > 0 ? -50 : 50), top + 28 + Math.sin(K.t * 6 - 7 * .6) * 4, 4, kam.face > 0); });
    // searchlights
    const SL = { on: 0, x: 400 };
    set.front.push((g) => { if (!SL.on) return; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,240,170,.12)'; g.beginPath(); g.moveTo(880, 140); g.lineTo(SL.x - 80, FEET + 10); g.lineTo(SL.x + 80, FEET + 10); g.closePath(); g.fill(); g.restore(); });
    const slLight = K.light(() => SL.on ? { x: SL.x, y: FEET - 70 } : null, 170, { col: '255,240,170', a: 1 });
    const towerLamp = K.light(() => SL.on ? { x: 880, y: 140 } : null, 60, { col: '255,240,170' });
    const sweep = () => { SL.x = 480 + Math.sin(K.t * .55) * 400; };
    const candle = K.light(() => ST.place === 'kelder' ? { x: 480, y: 430 } : null, 360, { col: '255,190,110', flicker: .1 });
    const dustAt = (x, y, n, col) => K.particles('sky', { dur: 2.4, emit: (ps) => { if (n-- > 0) for (let k = 0; k < 6; k++) ps.push(K.P({ x: x + (rnd() - .5) * 60, y: y + (rnd() - .5) * 20, vx: (rnd() - .5) * 200, vy: -40 - rnd() * 90, life: 1 + rnd() * .6, sz: 8 + rnd() * 12 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(${col || '200,180,140'},${.8 * (1 - k)})`; const s = Math.round(p.sz * (1 + k) / 6) * 6; g.fillRect(Math.round(p.x / 6) * 6 - s / 2, Math.round(p.y / 6) * 6 - s / 2, s, s); } });

    /* the cast */
    const gang = names.map((n, i) => set.add(K.pet(n, i % 2 ? 1 : -1)));
    const by = (n) => gang.find(a => a.pet === n);
    gang.forEach(a => { set.front.push(straw(a)); });
    const h = set.add(K.heidi(1, { outfit: ['kroon', 'legerjas'], eyes: 'vies' }));
    const crownOn = { who: null };
    set.front.push((g) => { const a = crownOn.who; if (!a || a.alpha <= 0) return; const p = K.A.petPoint(a, a.crownAt || 'head'); gridC(g, CROWN, CROWN_PAL, p.x, p.y - (a.crownAt === 'nose' ? -6 : 10), 3.5); });

    yield* K.opening('HET REGIME', 'EEN OPSTANDIG DRAMA', 'warm');
    K.grade('warm', .4, .01); K.setv('vig', .5, 2);
    /* ---------- prologue: a sunny morning, hay for everyone ---------- */
    kam.x = 140; kam.face = 1;
    const eatSpots = [660, 700, 820, 860, 900];
    gang.forEach((a, i) => { a.cx = eatSpots[i]; a.face = a.cx < 760 ? 1 : -1; hold(a, a.pet === 'dobby' ? 'down' : (i % 2 ? 'down' : 'sit')); });
    yield* wait(1);
    const munch = (secs) => tween(secs, p => { gang.forEach((a, i) => { if (a.pet === 'dobby' || i % 2) a.sq = 1 + Math.sin(K.t * 14 + i) * .04; }); kam.head = .25 + Math.sin(K.t * 8) * .04; });
    yield* munch(3); emote('hearts', 2); gang.forEach(a => emote('heart', 1.6, a));
    const wf = by('wifi'); if (wf) { hold(wf, null); yield* petJump(wf, 30, .4); emote('notes', 1.6, wf); hold(wf, 'sit'); }
    const sn = by('snoet'); if (sn) { hold(sn, null); for (let k = 0; k < 4; k++) { sn.face = -sn.face; yield* petJump(sn, 10, .18); } hold(sn, 'sit'); }
    yield* munch(2.5);
    // she arrives
    K.lens({ z: 1.15, cx: W / 2 + 120, cy: H / 2 + 20 }, 6);
    h.cx = W + 140; h.face = -1;
    yield* K.actorTo(h, W - 140, 40);
    gang.forEach(a => { a.sq = 1; a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); }); kam.head = 0; kam.face = 1; emote('?', 1.5);
    yield* wait(1.4);
    yield* K.lensW({ z: 2.6, cx: h.cx - 30, cy: FEET - 170 }, .01); h.eyes = 'vies'; yield* wait(2.4);   // the crown. The coat. The look.
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    yield* K.actorTo(h, 760, 40); h.face = -1;
    gang.forEach(a => { a.eyes = 'groot'; }); emote('dots', 2, h); yield* wait(2);
    // she stamps: everybody away from the hay
    h.sq = .9; K.lens({ shake: 6 }, 0); dustAt(h.cx, FEET - 10, 3); yield* wait(.2); h.sq = 1; K.lens({ shake: 0 }, .3);
    emote('angry', 2, h);
    yield* par(...gang.map((a, i) => { hold(a, null); return petTo(a, 120 + i * 70, K.PET[a.pet].run * 1.6); }), walkTo(-150, 120));
    gang.forEach(a => { a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.eyes = ''; }); kam.face = 1; emote('sweat', 2);
    yield* wait(1);
    // the new order: banners unroll, a fence, the portrait rises
    K.flash(.7, '255,240,200', 2);
    yield* tween(1.4, p => { ST.fence = ez(p); });
    yield* K.actorTo(h, 620, 50); h.face = 1; yield* wait(.4); h.face = -1;
    yield* tween(2.2, p => { ST.banners = ez(p); });
    ST.podium = 1; K.lens({ shake: 4 }, 0); yield* wait(.3); K.lens({ shake: 0 }, .3);
    K.grade('sepia', .55, 3);
    yield* K.lensW({ z: 1.25, cx: 480, cy: 290 }, 1.5);
    yield* tween(3, p => { ST.portrait = ez(p); });
    K.flash(.5); yield* wait(.8);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    // up on the podium
    yield* K.actorTo(h, 480, 45); h.face = -1;
    yield* tween(.6, p => { h.feet = FEET - Math.sin(p * Math.PI / 2) * 60 - Math.sin(p * Math.PI) * 30; }); h.feet = FEET - 60;
    h.lockPose = true; h.pose = 'tilt'; h.eyes = 'dicht';
    // low angle
    yield* K.lensW({ z: 1.9, cx: 480, cy: 360, rot: -.04 }, 2.2); yield* wait(2.2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2, rot: 0 }, 1.6);
    gang.forEach(a => emote('?', 1.8, a)); yield* wait(1); emote('dots', 2.5); yield* wait(2.5);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 1', 'DE NIEUWE ORDE', 2.6, { size: 44 });

    /* ---------- part 1: the new order ---------- */
    h.lockPose = true; h.pose = 'stand'; h.eyes = 'vies';
    kam.x = -560; kam.face = 1;
    const line = gang.slice();
    line.forEach((a, i) => { a.cx = -120 - i * 90; a.face = 1; hold(a, 'walk'); a.rate = 7; a.front = true; });
    yield* K.fadeIn(1.4);
    // the march: stiff legs, chins up, in step
    function* march(secs, speed, dir) {
      kam.face = dir; line.forEach(a => { a.face = dir; });
      yield* tween(secs, p => {
        const ph = K.t * 5;
        line.forEach((a, i) => { a.cx += dir * speed * K.dt; hold(a, 'walk'); a.lift = Math.max(0, Math.sin(ph)) * 16; a.r = -dir * Math.max(0, Math.sin(ph)) * .12; });
        kam.x += dir * speed * K.dt; kam.pose = 'walk'; kam.y = Math.max(0, Math.sin(ph)) * 12; kam.head = -.18;
      });
      line.forEach(a => { a.lift = 0; a.r = 0; hold(a, 'stand'); }); kam.pose = ''; kam.y = 0; kam.head = 0;
    }
    yield* par(march(6, 90, 1), (function* () { yield* wait(2); h.face = -1; yield* wait(2); h.eyes = 'dicht'; emote('dots', 2, h); })());
    yield* K.cut(() => K.lens({ z: 2.2, cx: kam.x + W / 2, cy: FEET - 150 }, 0), .1);
    yield* march(2, 90, 1);
    yield* K.cut(() => K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0), .1);
    // Dobby falls out of step: a little happy jump
    const db = by('dobby');
    if (db) { yield* par(march(1.6, 90, 1), (function* () { yield* wait(.6); db.front = true; yield* petJump(db, 40, .5); emote('notes', 1.2, db); })());
      h.eyes = 'boos'; emote('angry', 1.6, h); yield* K.lensW({ z: 2.4, cx: h.cx - 20, cy: FEET - 230 }, .01); yield* wait(1.4);
      yield* K.lensW({ z: 2.4, cx: db.cx, cy: FEET - 60 }, .01); db.eyes = 'groot'; emote('sweat', 1.4, db); yield* wait(1.4); db.eyes = ''; yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01); h.eyes = 'vies'; }
    // and back again
    yield* march(4.5, 120, -1);
    line.forEach(a => { a.face = 1; }); kam.face = 1;
    // the hay: everybody gets one straw
    yield* K.cut(() => { line.forEach((a, i) => { a.cx = 600 - i * 80; a.face = 1; hold(a, 'stand'); }); kam.x = -330; kam.face = 1; h.feet = FEET; h.cx = 700; h.face = -1; h.lockPose = false; }, .3);
    yield* wait(1);
    for (let i = 0; i < line.length; i++) {
      const a = line[i];
      a.front = true; yield* petTo(a, 640, 120); a.face = 1; yield* wait(.4);
      h.sq = .96; yield* wait(.2); h.sq = 1; a.straw = true; emote('dots', 1, a);
      if (a.pet === 'dobby') { yield* K.lensW({ z: 2.6, cx: a.cx + 10, cy: FEET - 60 }, .01); hold(a, 'up'); a.eyes = ''; petTears(K, a, 2.6); yield* wait(2.6); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01); }
      hold(a, null); yield* petTo(a, 120 + i * 70, 120); a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit');
    }
    // Heidi on her mountain of hay, chewing
    yield* K.actorTo(h, 770, 40); h.face = -1;
    yield* K.lensW({ z: 2.2, cx: 760, cy: FEET - 170 }, 1.4);
    for (let k = 0; k < 3; k++) { yield* tween(1.2, p => { h.sq = 1 + Math.sin(p * 30) * .015; }); h.face = -h.face; }
    emote('hearts', 1.6, h); yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    // Kamiel tries to take a little bit… the stare
    yield* walkTo(150, 50); kam.face = 1; kam.head = .25; yield* wait(1);
    h.eyes = 'vies'; h.face = -1;
    yield* K.lensW({ z: 3, cx: h.cx - 40, cy: FEET - 200 }, 3);
    yield* K.lensW({ z: 2.6, cx: K.kx() + 40, cy: FEET - 190 }, .01); kam.eyes = 'groot'; emote('sweat', 2.2); yield* wait(2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01); kam.head = 0; kam.eyes = 'triest';
    yield* walkTo(-330, 70); kam.face = 1; yield* wait(1.2);
    // night falls: the searchlight
    yield* K.fadeOut(1.4);
    ST.night = 1; SL.on = 1; K.grade('noir', .5, .01); K.setv('dark', .45, .01);
    gang.forEach((a, i) => { a.straw = false; a.cx = 100 + i * 70; hold(a, 'sleep'); a.face = 1; a.front = false; });
    kam.x = -170; kam.face = 1; kam.eyes = 'dicht';
    h.cx = 780; h.feet = FEET - 50; h.face = -1; h.eyes = 'dicht';
    const zH = emote('zzz', 30, h);
    const sweepFx = fx('sky', 0, () => { if (SL.on) sweep(); });
    yield* K.fadeIn(1.6);
    yield* wait(3); kam.eyes = ''; yield* wait(.8); kam.face = -1; yield* wait(.8); kam.face = 1;
    emote('dots', 2); yield* wait(2.2);
    yield* K.fadeOut(1.4);
    yield* K.card('DEEL 2', 'HET VERZET', 2.6, { size: 44 });

    /* ---------- part 2: the resistance meets in the cellar ---------- */
    ST.place = 'kelder'; SL.on = 0; K.grade('warm', .3, .01); K.setv('dark', .5, .01);
    kam.x = 0; kam.face = 1; kam.eyes = ''; gang.forEach((a, i) => { a.cx = W / 2 + (i < 2 ? -200 - i * 70 : 160 + (i - 2) * 70); a.face = a.cx < W / 2 ? 1 : -1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.front = true; });
    h.alpha = 0;
    yield* K.fadeIn(1.6);
    // the huddle: heads together, whispers
    yield* K.lensW({ z: 1.5, cx: 480, cy: FEET - 140 }, 2);
    for (let k = 0; k < 3; k++) { const a = gang[k % gang.length]; emote('dots', 1.4, a); a.r = (a.face > 0 ? .1 : -.1); yield* wait(1.2); a.r = 0; }
    kam.head = .2; emote('dots', 2); yield* wait(2); kam.head = 0;
    // the beret
    K.withOutfit(['baret']); emote('sparks', 2); gang.forEach(a => emote('!', 1.2, a)); yield* wait(1.8);
    // the flag
    const pp = by('pippa') || gang[0];
    const flagUp = { a: 0 };
    const flagFx = (g) => { if (flagUp.a <= 0) return; const x = 300, y = 220; g.save(); g.globalAlpha = flagUp.a; R(g, x - 4, y - 20, 8, 300, '#8a6a4a');
      for (let k = 0; k < 18; k++) R(g, x + 4 + k * 8, y + Math.sin(K.t * 3 - k * .5) * 4, 8, 90 * flagUp.a, k % 6 === 0 ? '#a8181e' : '#d8242c'); gridC(g, CARROT, { O: '#ffb040', G: '#6ad860' }, x + 76, y + 44, 7); g.restore(); };
    set.back.push(flagFx);
    if (pp) { yield* petTo(pp, 360, 60); pp.face = -1; hold(pp, 'paw'); yield* wait(.8); }
    yield* tween(2, p => { flagUp.a = ez(p); });
    if (pp) { hold(pp, 'sit'); emote('stars', 1.6, pp); }
    yield* K.lensW({ z: 1.8, cx: 380, cy: 280 }, 1.6); yield* wait(1.6);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    kam.eyes = 'blij'; emote('hearts', 2); gang.forEach(a => emote('heart', 1.5, a)); yield* wait(2); kam.eyes = '';
    // the plan, on the board
    yield* walkTo(180, 50); kam.face = 1;
    yield* K.lensW({ z: 1.9, cx: 755, cy: 265 }, 1.6);
    const sayYes = (n) => { const a = by(n); if (a) { emote('!', 1.2, a); } };
    ST.board = 1; yield* wait(2.4); sayYes('snoet');
    ST.board = 2; yield* wait(2.4); sayYes('dobby');
    ST.board = 3; yield* wait(2.4); sayYes('wifi'); sayYes('pippa');
    ST.board = 4; yield* wait(2.6);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    kam.face = -1; kam.eyes = 'boos'; emote('angry', 1.4); gang.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; hold(a, null); });
    yield* par(...gang.map(a => petJump(a, 26, .4)), hop(26, .4));
    gang.forEach(a => hold(a, a.pet === 'dobby' ? 'up' : 'sit'));
    yield* wait(1);
    yield* K.fadeOut(1.2);
    /* the sabotage, under the searchlight */
    set.drop(set.back, flagFx);
    ST.place = 'plein'; ST.board = 0; SL.on = 1; K.grade('noir', .5, .01); K.setv('dark', .45, .01);
    gang.forEach(a => { a.alpha = 0; a.front = true; }); kam.x = -560; kam.alpha = 1;
    h.alpha = 1; h.cx = 780; h.feet = FEET - 50; h.face = -1; h.eyes = 'dicht'; h.lockPose = false;
    yield* K.fadeIn(1.2);
    // Dobby digs under the podium
    if (db) {
      db.alpha = 1; db.cx = 280; db.face = 1; hold(db, 'down');
      const dirt = K.particles('sky', { until: K.t + 6, emit: (ps) => { if (rnd() < .6) ps.push(K.P({ x: db.cx - 20, y: FEET - 8, vx: -60 - rnd() * 90, vy: -90 - rnd() * 60, grav: 320, life: .7 })); },
        draw: (g, p, k) => { g.fillStyle = `rgba(110,80,50,${1 - k})`; g.fillRect(p.x, p.y, 6, 6); } });
      yield* K.lensW({ z: 1.8, cx: 360, cy: FEET - 60 }, 1);
      yield* tween(6, p => { tunnel = p; db.cx = 280 + p * 120; db.alpha = 1 - Math.max(0, p - .7) / .3; });
      db.alpha = 0;
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    }
    // Snoet steals the crown
    const thief = sn || gang[0];
    thief.alpha = 1; thief.cx = -60; thief.face = 1; thief.eyes = '';
    yield* petTo(thief, 420, 90);
    SL.x = 420; const sweepWas = sweepFx.draw; sweepFx.draw = () => {};
    yield* tween(1.4, p => { SL.x = lerp(200, thief.cx, p); });
    hold(thief, 'jump'); thief.lift = 18; thief.filter = 'grayscale(1) brightness(.8)'; thief.eyes = 'groot';
    yield* K.lensW({ z: 2.4, cx: thief.cx, cy: FEET - 80 }, .4); yield* wait(2.2);   // a statue. A very still statue.
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .4);
    yield* tween(1.6, p => { SL.x = lerp(thief.cx, 820, p); });
    sweepFx.draw = sweepWas; thief.filter = ''; thief.lift = 0; hold(thief, null); thief.eyes = '';
    yield* petTo(thief, 690, 90); thief.face = 1;
    yield* K.lensW({ z: 2.2, cx: 740, cy: FEET - 160 }, 1);
    hold(thief, 'jump'); yield* tween(.5, p => { thief.lift = Math.sin(p * Math.PI) * 120; thief.cx = 690 + p * 30; });
    h.outfit = ['legerjas']; crownOn.who = thief; thief.crownAt = 'nose'; hold(thief, null); thief.lift = 0;
    emote('dots', 1.6, h); h.eyes = 'dicht'; yield* wait(1.4); emote('stars', 1.4, thief);
    thief.face = -1; yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .8); yield* petTo(thief, -80, 160); thief.alpha = 0;
    // Wifi gnaws the rope
    if (wf) { wf.alpha = 1; wf.cx = -60; wf.face = 1; yield* petTo(wf, 300, 100); wf.face = 1; hold(wf, 'down');
      yield* K.lensW({ z: 2.6, cx: 330, cy: FEET - 40 }, .8);
      for (let k = 0; k < 6; k++) { wf.sq = .93; yield* wait(.2); wf.sq = 1; yield* wait(.2); }
      ST.rope = .5; emote('notes', 1.4, wf); yield* wait(1); hold(wf, null); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .6); yield* petTo(wf, -80, 120); wf.alpha = 0; }
    // Pippa adds a moustache to the portrait
    if (pp && pp.pet === 'pippa') { pp.alpha = 1; pp.cx = -60; pp.face = 1; yield* petTo(pp, 440, 80); pp.face = 1;
      hold(pp, 'jump'); yield* tween(.6, p => { pp.lift = Math.sin(p * Math.PI / 2) * 150; }); hold(pp, 'paw');
      yield* K.lensW({ z: 2, cx: 480, cy: 280 }, 1); yield* tween(2, p => { ST.mustache = p; }); emote('stars', 1.6, pp); yield* wait(1.6);
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .8); hold(pp, 'jump'); yield* tween(.4, p => { pp.lift = 150 * (1 - p); }); pp.lift = 0; hold(pp, null); yield* petTo(pp, -80, 120); pp.alpha = 0; }
    // Pebbels keeps watch… and startles at her own shadow
    const pb = by('pebbels');
    if (pb) { pb.alpha = 1; pb.cx = 120; pb.face = 1; hold(pb, 'sit'); yield* wait(1.2); pb.face = -1; yield* wait(.8); pb.eyes = 'groot'; emote('!', 1, pb); yield* petJump(pb, 50, .4); emote('sweat', 1.5, pb); yield* wait(1.2); pb.eyes = ''; hold(pb, null); yield* petTo(pb, -80, 120); pb.alpha = 0; }
    stop(zH);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 3', 'DE OPSTAND', 2.6, { size: 44 });

    /* ---------- part 3: the uprising ---------- */
    ST.night = 0; SL.on = 0; stop(sweepFx); K.grade('goud', .5, .01); K.setv('dark', 0, .01);
    h.cx = 780; h.feet = FEET - 50; h.face = -1; h.eyes = 'dicht';
    yield* K.fadeIn(1.6);
    yield* wait(1); h.eyes = ''; yield* wait(.6); h.eyes = 'groot'; emote('!?', 2, h);   // where is my crown?
    yield* K.lensW({ z: 2.4, cx: h.cx - 30, cy: h.feet - 180 }, .01); yield* wait(1.8); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    h.eyes = 'boos'; emote('angry', 2, h);
    yield* tween(.6, p => { h.feet = FEET - 50 + 50 * p - Math.sin(p * Math.PI) * 30; }); h.feet = FEET;
    yield* K.actorTo(h, 480, 70); h.face = -1;
    yield* tween(.5, p => { h.feet = FEET - Math.sin(p * Math.PI / 2) * 60 - Math.sin(p * Math.PI) * 30; }); h.feet = FEET - 60;
    yield* wait(.6);
    // CRACK: the podium caves in
    K.lens({ shake: 9 }, 0); dustAt(480, FEET - 30, 8);
    yield* tween(.5, p => { ST.sink = 40 * p; h.feet = FEET - 60 + 60 * p; }); h.feet = FEET + 6; h.eyes = 'x'; emote('stars', 2.5, h);
    K.lens({ shake: 0 }, .6); tunnel = 0;
    yield* wait(1.6);
    // here they come: the drums (the screen thumps), the flag, the dust
    const drum = fx('sky', 0, () => { K.lens({ shake: (Math.floor(K.t * 4) % 2 === 0 && (K.t * 4) % 1 < .15) ? 3 : 0 }, 0); });
    const dust = K.weather('dust', .7);
    flagKam = 1; kam.x = -W / 2 - 140; kam.face = 1; kam.eyes = 'boos';
    const army = gang.slice(); army.forEach((a, i) => { a.alpha = 1; a.cx = -200 - i * 80; a.face = 1; a.front = true; a.eyes = ''; hold(a, null); });
    if (sn) { crownOn.who = sn; sn.crownAt = 'head'; }
    yield* par(walkTo(-230, 70), ...army.map((a, i) => petTo(a, 330 - i * 60 + (i > 1 ? 0 : 0), 70)));
    stop(drum); K.lens({ shake: 0 }, 0);
    army.forEach(a => { a.face = 1; hold(a, 'stand'); });
    // heroic close-ups, one by one
    const heroes = [() => ({ x: K.kx() + 30, y: FEET - 180 })].concat(army.slice(0, 3).map(a => () => ({ x: a.cx, y: FEET - 60 })));
    for (const hz of heroes) { const p = hz(); yield* K.cut(() => K.lens({ z: 2.6, cx: p.x, cy: p.y, rot: -.03 }, 0), .08); yield* wait(1.1); }
    yield* K.cut(() => K.lens({ z: 1, cx: W / 2, cy: H / 2, rot: 0 }, 0), .08);
    // the standoff
    h.eyes = 'vies'; yield* tween(.4, p => { h.feet = FEET + 6 - 6 * p; });
    yield* K.lensW({ z: 3.2, cx: h.cx - 50, cy: FEET - 200 }, .01); yield* wait(1.6);
    yield* K.lensW({ z: 3.2, cx: K.kx() + 50, cy: FEET - 200 }, .01); yield* wait(1.6);
    yield* K.lensW({ z: 1.2, cx: W / 2, cy: H / 2 + 20 }, .01); yield* wait(1);
    // the rope gives way: the portrait falls, in slow motion
    ST.rope = 0; emote('!', 1.2, h); h.eyes = 'groot';
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .5);
    yield* K.actorTo(h, 380, 160); h.face = 1;
    K.grade('sepia', .8, .5); K.setv('ab', .7, .5); K.setv('vig', .8, .5);
    yield* tween(5, p => { ST.pRot = (Math.PI / 2) * (p * p); });
    ST.pDown = true; K.flash(1, '255,240,200', 1.5); K.lens({ shake: 12 }, 0); dustAt(750, FEET - 20, 14); dustAt(620, FEET - 20, 10);
    K.grade('goud', .5, .4); K.setv('ab', 0, .4); K.setv('vig', .5, .4);
    yield* wait(.5); K.lens({ shake: 0 }, .8); yield* wait(1);
    // the flags change
    yield* tween(2, p => { ST.hflag = 1 - p; });
    flagKam = 0;
    yield* walkTo(-180, 60); kam.face = -1;
    K.grade('goud', .7, 2); const conf = K.weather('confetti', .9);
    yield* K.lensW({ z: 1.5, cx: 280, cy: 240 }, 1.4);
    yield* tween(4, p => { ST.rflag = ez(p); });
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    kam.eyes = 'blij'; emote('hearts', 2.5); army.forEach(a => emote('hearts', 2, a));
    yield* par(hop(36, .45), ...army.map(a => petJump(a, 34, .45)));
    yield* par(hop(36, .45), ...army.map(a => petJump(a, 34, .45)));
    // Heidi flees…
    h.eyes = 'groot'; emote('sweat', 2, h);
    const trail = K.particles('sky', { until: K.t + 2, emit: (ps) => { ps.push(K.P({ x: h.cx, y: FEET - 10, vx: (rnd() - .5) * 40, vy: -20 - rnd() * 30, life: .8, sz: 10 })); }, draw: (g, p, k) => { g.fillStyle = `rgba(210,190,150,${.8 * (1 - k)})`; g.fillRect(p.x, p.y, p.sz, p.sz); } });
    h.face = 1; yield* K.actorTo(h, W + 160, 380);
    yield* wait(1.2);
    h.cx = W + 40; h.face = -1; h.eyes = 'boos'; emote('angry', 1.6, h); yield* wait(1.8); h.cx = W + 160;   // …and peeks back once
    stop(dust);
    yield* wait(1.2); K.stop(conf);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 4', 'DE STEMMING', 2.6, { size: 44 });

    /* ---------- epilogue: the vote ---------- */
    ST.portrait = 0; ST.pRot = 0; ST.pDown = false; ST.podium = 0; ST.banners = 0; ST.mustache = 0; ST.fence = 0; ST.ballot = 1; ST.hflag = 0; ST.rflag = 1;
    K.grade('warm', .4, .01);
    crownOn.who = null;
    h.cx = 620; h.feet = FEET; h.face = -1; h.outfit = []; h.eyes = 'vies'; h.lockPose = false;
    kam.x = -40; kam.face = 1; kam.eyes = '';
    army.forEach((a, i) => { a.cx = 90 + i * 70; a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.eyes = ''; });
    yield* K.fadeIn(1.6);
    yield* K.lensW({ z: 1.5, cx: 480, cy: 280 }, 1.6); yield* wait(1.4);
    // for Kamiel: every paw goes up
    ST.pick = 'k'; yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    for (const a of army) { if (a.pet === 'pippa' || a.pet === 'pebbels') hold(a, 'paw'); else if (a.pet === 'dobby') hold(a, 'up'); else { hold(a, 'jump'); a.lift = 10; } ST.tallyK++; emote('!', .8, a); yield* wait(.7); }
    yield* wait(1.2); army.forEach(a => { a.lift = 0; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); });
    // for Heidi: one hoof (her own)
    ST.pick = 'h'; yield* wait(.8); h.lockPose = true; h.pose = 'tilt'; yield* wait(.8); ST.tallyH = 1; emote('dots', 2, h); yield* wait(2); h.lockPose = false;
    ST.pick = 'k'; K.flash(.6, '255,240,180', 2); const conf2 = K.weather('confetti', .8);
    kam.eyes = 'blij'; emote('hearts', 2.5); army.forEach(a => emote('heart', 1.6, a));
    yield* wait(2.4); K.stop(conf2);
    // hay for everyone; Heidi is just one of us now (she chews, grumpily)
    yield* par(...army.map((a, i) => { hold(a, null); return petTo(a, [660, 700, 860, 900, 820][i], K.PET[a.pet].run); }), walkTo(140, 60), K.actorTo(h, 760, 30));
    army.forEach((a, i) => { a.face = a.cx < 760 ? 1 : -1; hold(a, a.pet === 'dobby' ? 'down' : (i % 2 ? 'down' : 'sit')); });
    kam.face = 1; h.face = -1; h.eyes = 'vies';
    yield* K.lensW({ z: 1.4, cx: 700, cy: FEET - 150 }, 1.6);
    yield* par(munch(4), (function* () { yield* wait(1); emote('angry', 1.6, h); yield* wait(2); })());
    // when nobody looks: a big mouthful
    army.forEach(a => { a.face = 1; }); kam.face = 1;
    h.sq = 1.08; yield* wait(.3); h.sq = 1; h.eyes = 'blij'; emote('sparks', 1.6, h); yield* wait(1.6);
    K.flash(1, '255,255,255', 1.4); K.grade('sepia', 1, .01); K.setv('ab', .6);
    yield* wait(3.5);
    yield* K.ending('EINDE');
  } };

  /* ======================================================================
     DE TOVERSCHOOL — a falling star brings Kamiel a hat and a robe; he becomes the teacher of a little magic
     school. Each pet gets a wand and a colour of magic (a floating ball, a cloud that becomes a cat, Dobby
     popping from place to place, Pebbels floating, and Snoet… who turns everyone into tiny Kamiels).
     A tournament outside: the whole world floats, clouds take shapes, a duel of beams — and the spell runs
     away: a giant creature of stars. Only together do they turn it into northern lights. One thing stays.
     ====================================================================== */
  const WIZHAT = ['..............BB......', '.............BBB......', '............BBB.......', '...........BBBB.......', '..........BBBBB.......', '.........BBBYBBB......',
    '.........BBBBBBB......', '........BBBBBBBBB.....', '........BBYBBBBBBB....', '.......BBBBBBBBYBB....', '.......BBBBBBBBBBBB...', '......bbbbbbbbbbbbb...', '......YYyYYyYYyYYyY...', 'BBBBBBBBBBBBBBBBBBBBBB', '.bbbbbbbbbbbbbbbbbbbb.'];
  const WIZPAL = { B: '#27306e', b: '#18204a', Y: '#ffd23f', y: '#c99a12' };
  const CHEST_LID = ['.KKKKKKKKKKKK.', 'KbbbbbbbbbbbbK', 'KbYYbbbbbbYYbK', 'KKKKKKKKKKKKKK'];
  const CHEST_BOX = ['KbbbbbYYbbbbbK', 'KbbbbYkkYbbbbK', 'KbbbbbYYbbbbbK', 'KbYYbbbbbbYYbK', 'KbbbbbbbbbbbbK', 'KKKKKKKKKKKKKK'];
  const CHEST_PAL = { K: '#2a1a10', b: '#7a4a28', Y: '#f5c518', k: '#2a1a10' };
  const SHAPES = {
    cloud: ['......WWWW..........', '....WWWWWWWW..WWW...', '..WWWWWWWWWWWWWWWWW.', '.WWWWWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWW', '.WWWWWWWWWWWWWWWWWW.'],
    cat: ['W...W........', 'WW.WW........', 'WWWWW........', 'W.W.W........', 'WWWWW......W.', '.WWWW.....W..', '.WWWWWW...W..', 'WWWWWWWW.W...', 'WWWWWWWWWW...', 'WWWWWWWWW....', '.WW.WW.WW....'],
    heart: ['.WW...WW.', 'WWWW.WWWW', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.', '..WWWWW..', '...WWW...', '....W....'],
    fish: ['....WWWW.....', '..WWWWWWWW..W', '.WW.WWWWWWWWW', 'WWWWWWWWWWWW.', '.WWWWWWWWWWWW', '..WWWWWWWW..W', '....WWWW.....'],
    llama: ['.W.W.....', '.WWW.....', 'W.WW.....', 'WWWW.....', '.WWW.....', '..WW.....', '..WW.....', '..WWWWWW.', '..WWWWWWW', '..WWWWWW.', '..W.W.W.W'],
  };
  const cells = (rows) => { const out = []; rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') out.push([x - r.length / 2, y - rows.length / 2]); }); return out; };
  const STARLING = ['...Y...', '..YYY..', 'YYYYYYY', '.YKYKY.', '.YYYYY.', '.YY.YY.', '.Y...Y.'];
  F['film-magie'] = { run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez } = K;
    const names = K.castNames();
    const has = (n) => names.includes(n);
    const COL = { wifi: '255,150,40', pippa: '255,90,200', dobby: '90,230,110', pebbels: '90,220,255', snoet: '255,230,60', kamiel: '200,160,255' };

    /* the school: crooked towers under a violet sky */
    const lanterns = [0, 1, 2, 3, 4, 5].map(k => ({ x: 80 + k * 150 + hash(k) * 60, y: 120 + hash(k + 3) * 140, ph: k }));
    function paintSchool(g) {
      for (let y = 0; y < 470; y += 6) { const p = y / 470; R(g, 0, y, W, 6, `rgb(${Math.round(26 + 60 * p)},${Math.round(15 + 30 * p)},${Math.round(58 + 50 * p)})`); }
      for (let k = 0; k < 50; k++) if (Math.sin(K.t * 2 + k * 1.3) > -.4) R(g, hash(k) * W, hash(k + 21) * 330, k % 7 ? 3 : 6, k % 7 ? 3 : 6, k % 4 ? '#ffffff' : '#ffe9a0');
      disc(g, 820, 120, 44, '#f4ecc8'); disc(g, 806, 110, 8, '#d8d0b0'); disc(g, 836, 136, 6, '#d8d0b0'); disc(g, 828, 100, 4, '#d8d0b0'); glow(g, 820, 120, 140, '255,240,200', .25);
      for (let x = 0; x < W; x += 6) { const h1 = 360 + Math.sin(x * .011) * 26 + Math.sin(x * .037) * 10; R(g, x, h1, 6, 470 - h1, '#2a1a4a'); }
      const tower = (x, w, top, roofH, lean) => {
        R(g, x, top, w, 470 - top, '#5a5470'); for (let y = top + 10; y < 470; y += 20) for (let bx = x + ((y / 20) % 2) * 10; bx < x + w - 6; bx += 24) R(g, bx, y, 14, 4, '#4a4460');
        for (let k = 0; k < roofH / 6; k++) { const p = k / (roofH / 6), rw = (w + 20) * (1 - p); R(g, x + w / 2 - rw / 2 + lean * p * 30, top - k * 6, rw, 6, k % 4 === 0 ? '#1d2558' : '#27306e'); }
        gridC(g, ['..Y..', '.YYY.', 'YYYYY', '.YYY.', '..Y..'], { Y: '#ffd23f' }, x + w / 2 + lean * 30, top - roofH - 8, 4);
        for (let wy = top + 40; wy < 420; wy += 90) { R(g, x + w / 2 - 12, wy, 24, 34, '#2a1a10'); R(g, x + w / 2 - 9, wy + 4, 18, 28, Math.sin(K.t * 3 + wy) > -.8 ? '#ffd88a' : '#d8a050'); R(g, x + w / 2 - 6, wy - 3, 12, 4, '#2a1a10'); }
      };
      tower(70, 110, 190, 110, -.5); tower(200, 90, 120, 130, .6); R(g, 300, 270, 280, 200, '#5a5470');
      for (let y = 280; y < 470; y += 20) for (let bx = 300 + ((y / 20) % 2) * 12; bx < 574; bx += 28) R(g, bx, y, 16, 4, '#4a4460');
      for (let k = 0; k < 14; k++) R(g, 300 + k * 10, 270 - k * 6, 280 - k * 20, 6, '#27306e');
      ring(g, 440, 330, 34, '#2a1a10', 8); disc(g, 440, 330, 28, '#ffd88a'); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; R(g, 440 + Math.cos(a) * 16 - 4, 330 + Math.sin(a) * 16 - 4, 8, 8, ['#ff6fb5', '#7ec8ff', '#7ee0a0', '#ffd23f'][k % 4]); }
      R(g, 412, 392, 56, 78, '#3a2416'); R(g, 418, 384, 44, 10, '#3a2416'); R(g, 436, 400, 4, 70, '#2a1a10');
      tower(590, 80, 210, 100, .3);
      R(g, 0, 470, W, H - 470, '#3a3450'); for (let y = 476, r = 0; y < H; y += 16, r++) for (let x = (r % 2) * 20; x < W; x += 40) R(g, x, y, 34, 10, '#4a4460');
      // the chalkboard on its easel, and the cauldron
      R(g, 700, 300, 8, 248, '#5a3a22'); R(g, 800, 300, 8, 248, '#5a3a22'); R(g, 684, 296, 140, 110, '#6a4a2a'); R(g, 690, 302, 128, 98, '#1c2a24');
      const ch = { W: 'rgba(240,240,230,.9)' };
      grid(g, ['..W..', '.WWW.', 'WWWWW', '.W.W.'], ch, 704, 318, 5); grid(g, ['.WW', 'W..', 'W..', '.WW'], ch, 744, 318, 6); ring(g, 790, 336, 12, 'rgba(240,240,230,.9)', 4);
      grid(g, ['W.......W', '.W.....W.', '..W...W..', '...W.W...', '....W....'], ch, 712, 362, 4); R(g, 770, 372, 30, 4, 'rgba(240,240,230,.9)');
      const cx = 890; R(g, cx - 46, 470, 92, 60, '#1a1a22'); R(g, cx - 52, 462, 104, 12, '#2a2a34'); R(g, cx - 40, 530, 10, 16, '#1a1a22'); R(g, cx + 30, 530, 10, 16, '#1a1a22');
      R(g, cx - 44, 464, 88, 8, '#5aff7a'); for (let k = 0; k < 5; k++) { const a = (K.t * .8 + k / 5) % 1; R(g, cx - 30 + k * 14, 456 - a * 60, 8, 8, `rgba(120,255,140,${1 - a})`); }
      glow(g, cx, 460, 90, '120,255,140', .3);
      for (const l of lanterns) { const y = l.y + Math.sin(K.t * .9 + l.ph) * 10; R(g, l.x - 7, y - 10, 14, 18, '#ff9a3c'); R(g, l.x - 5, y - 8, 10, 14, '#ffd27a'); R(g, l.x - 7, y - 12, 14, 3, '#7a3a1a'); glow(g, l.x, y, 40, '255,170,80', .35); }
    }
    const set = filmSet(K, paintSchool);
    set.leave();   // the story starts out in the world

    // drawings that work in the world and on the set alike: the screen layer
    const tipOf = (a) => { if (!a) { const p = K.kp(240, -120); return { x: p.x, y: p.y }; } const n = K.A.petPoint(a, 'nose'), d = a.face > 0 ? 1 : -1; return { x: n.x + d * 26, y: n.y - 30 }; };
    const wands = [];
    fx('screen', 0, (g) => { for (const a of wands) { if (a.alpha <= 0 || !a.wand) continue; const n = K.A.petPoint(a, 'nose'), t = tipOf(a);
      for (let k = 0; k <= 6; k++) R(g, lerp(n.x, t.x, k / 6) - 3, lerp(n.y, t.y, k / 6) - 3, 6, 6, a.wand === 'carrot' ? (k > 4 ? '#5ad860' : '#ff8a2a') : (k % 2 ? '#7a4a28' : '#8a5a32'));
      glow(g, t.x, t.y, a.casting ? 60 : 22, COL[a.pet], a.casting ? .7 : .4); R(g, t.x - 3, t.y - 3, 6, 6, '#ffffff'); } });
    const trails = K.particles('screen', { emit: (ps) => { for (const a of wands) if (a.casting && a.alpha > 0) { const t = tipOf(a); for (let k = 0; k < 2; k++) ps.push(K.P({ x: t.x, y: t.y, vx: (rnd() - .5) * 90, vy: (rnd() - .5) * 90 - 20, life: .8 + rnd() * .5, col: COL[a.pet] })); }
      if (kam.casting) { const t = tipOf(null); for (let k = 0; k < 2; k++) ps.push(K.P({ x: t.x, y: t.y, vx: (rnd() - .5) * 90, vy: (rnd() - .5) * 90, life: .9, col: COL.kamiel })); } },
      draw: (g, p, k) => { g.fillStyle = `rgba(${p.col},${1 - k})`; const s = k < .5 ? 6 : 4; g.fillRect(Math.round(p.x / 3) * 3, Math.round(p.y / 3) * 3, s, s); if (k < .3) { g.fillStyle = `rgba(255,255,255,${.8 - k * 2})`; g.fillRect(Math.round(p.x / 3) * 3 + 1, Math.round(p.y / 3) * 3 + 1, 2, 2); } } });
    const beams = [];
    fx('screen', 0, (g) => { for (const b of beams) { const a = b.from(), z = b.to(), n = Math.max(2, Math.floor(Math.hypot(z.x - a.x, z.y - a.y) / 8));
      for (let k = 0; k <= n; k++) { const p = k / n, j = Math.sin(K.t * 30 + k) * 4 * (b.wob || 1); const x = lerp(a.x, z.x, p), y = lerp(a.y, z.y, p) + j; R(g, x - 6, y - 6, 12, 12, `rgba(${b.col},.85)`); R(g, x - 2, y - 2, 4, 4, '#ffffff'); }
      glow(g, z.x, z.y, 70, b.col, .6); } });
    const beam = (from, to, col) => { const b = { from, to, col }; beams.push(b); return b; };
    const unbeam = (b) => { const k = beams.indexOf(b); if (k >= 0) beams.splice(k, 1); };
    const pop = (x, y, col) => K.particles('screen', { dur: 1.4, emit: (ps) => { if (!ps.done) { ps.done = 1; for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2, v = 80 + rnd() * 160; ps.push(K.P({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .5 + rnd() * .4, sz: 10 + rnd() * 12 })); } } },
      draw: (g, p, k) => { const s = Math.round(p.sz * (1 - k * .6) / 3) * 3; g.fillStyle = k < .3 ? '#ffffff' : `rgba(${col},${.9 * (1 - k)})`; g.fillRect(Math.round(p.x / 3) * 3 - s / 2, Math.round(p.y / 3) * 3 - s / 2, s, s); } });
    // shapes made of blocks that can morph into each other (clouds, the cat, the heart…)
    function morpher(o) {
      o = Object.assign({ x: 300, y: 150, u: 10, from: 'cloud', to: 'cloud', p: 0, col: '255,255,255', a: 1, tint: 0 }, o);
      o.fx = fx('screen', 0, (g) => { if (o.a <= 0) return; const A0 = cells(SHAPES[o.from]), B0 = cells(SHAPES[o.to]), n = Math.max(A0.length, B0.length), e = ez(o.p);
        for (let i = 0; i < n; i++) { const a = A0[i % A0.length], b = B0[i % B0.length], wob = Math.sin(K.t * 2 + i) * 2 * (1 - Math.abs(e - .5) * 2);
          const x = o.x + lerp(a[0], b[0], e) * o.u + wob * 3, y = o.y + lerp(a[1], b[1], e) * o.u + Math.sin(K.t * 1.5 + i * .3) * 2;
          g.fillStyle = `rgba(${o.tint ? o.col : '255,255,255'},${o.a})`; g.fillRect(Math.round(x), Math.round(y), o.u, o.u); }
        if (o.tint) glow(g, o.x, o.y, o.u * 12, o.col, .3 * o.a); });
      return o;
    }

    /* the cast */
    const gang = names.map((n, i) => set.add(K.pet(n, -1), true));
    const by = (n) => gang.find(a => a.pet === n);
    const wf = by('wifi'), pp = by('pippa'), db = by('dobby'), pb = by('pebbels'), sn = by('snoet');

    yield* K.opening('DE TOVERSCHOOL', 'EEN BETOVERENDE FILM', 'magie');
    K.grade('magie', .3, .01); K.setv('dark', .08, .01); K.setv('vig', .45, 2);
    /* ---------- prologue: a falling star ---------- */
    kam.x = -120; kam.face = 1;
    yield* wait(1.5); kam.head = -.2; emote('?', 1.5); yield* wait(1);
    const fall = { x: W + 40, y: 40, on: true };
    fx('screen', 3, (g) => { if (!fall.on) return; for (let k = 0; k < 14; k++) { const q = k / 14; R(g, fall.x + k * 14, fall.y - k * 7, 10 - q * 6, 10 - q * 6, `rgba(255,240,180,${1 - q})`); } glow(g, fall.x, fall.y, 60, '255,240,180', .8); });
    yield* tween(1.6, p => { fall.x = lerp(W + 40, 700, p); fall.y = lerp(40, FEET - 20, p * p); });
    fall.on = false;
    K.flash(1, '255,240,200', 2); K.lens({ shake: 7 }, 0); pop(700, FEET - 20, '255,230,140');
    const chest = { x: 700, y: FEET - 6, a: 1, open: 0 };
    const chestFx = fx('front', 0, (g) => { if (chest.a <= 0) return; g.save(); g.globalAlpha = chest.a; const u = 6, x = chest.x - 42, y = chest.y - 60;
      grid(g, CHEST_BOX, CHEST_PAL, x, y + 24, u);
      if (chest.open > 0) { glow(g, chest.x, y + 20, 120 + chest.open * 80, '255,230,140', .7 * chest.open); g.fillStyle = `rgba(255,240,180,${.35 * chest.open})`; g.beginPath(); g.moveTo(x + 6, y + 24); g.lineTo(x + 78, y + 24); g.lineTo(x + 140, y - 260); g.lineTo(x - 56, y - 260); g.closePath(); g.fill(); }
      g.translate(x, y + 24); g.rotate(-chest.open * 1.9); grid(g, CHEST_LID, CHEST_PAL, 0, -24, u); g.restore(); });
    const chestLight = K.light(() => chest.a > 0 ? { x: chest.x, y: chest.y - 60 } : null, 200 + chest.open * 120, { col: '255,220,140', flicker: .1 });
    kam.eyes = 'x'; yield* hop(40, .4); yield* wait(.3); K.lens({ shake: 0 }, .4); kam.eyes = 'groot'; emote('!', 1.4); yield* wait(1.6);
    yield* walkTo(70, 45); kam.face = 1; kam.head = .25; yield* wait(1);
    yield* K.lensW({ z: 1.8, cx: 660, cy: FEET - 120 }, 1.5);
    yield* tween(1.6, p => { chest.open = ez(p); });
    K.flash(.6, '255,240,200', 2); const sp = K.weather('sparks', 1.2); yield* wait(1.5);
    // a hat and a robe float out… and onto him
    const flyHat = { x: 700, y: FEET - 80, on: true };
    const hatFx = fx('screen', 0, (g) => { if (flyHat.on) gridC(g, WIZHAT, WIZPAL, flyHat.x, flyHat.y, 3.3); });
    const hd = K.kp(260, -60);
    yield* tween(2.2, p => { flyHat.x = lerp(700, hd.x, ez(p)); flyHat.y = lerp(FEET - 80, hd.y, ez(p)) - Math.sin(p * Math.PI) * 120; });
    flyHat.on = false; stop(hatFx); K.withOutfit(['tovenaarshoed', 'mantel']); K.flash(.8, '220,200,255', 2); pop(K.kx(), FEET - 140, COL.kamiel);
    kam.head = 0; kam.eyes = 'blij'; emote('sparks', 2.5);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.4);
    kam.head = .3; yield* wait(1); kam.head = 0; for (let k = 0; k < 4; k++) { kam.face = -kam.face; yield* wait(.25); } emote('hearts', 2); yield* wait(1.5);
    stop(sp); yield* tween(.8, p => { chest.a = 1 - p; }); stop(chestFx); K.unlight(chestLight);
    // a door of light: the school
    const portal = { x: 820, a: 0 };
    const portalFx = fx('front', 0, (g) => { if (portal.a <= 0) return; g.save(); g.globalAlpha = portal.a; for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2 + K.t * 1.5, r = 1 + Math.sin(K.t * 4 + k) * .05;
      R(g, portal.x + Math.cos(a) * 70 * r - 5, FEET - 140 + Math.sin(a) * 130 * r - 5, 10, 10, ['#b98cff', '#ffffff', '#7ec8ff'][k % 3]); }
      g.fillStyle = 'rgba(200,170,255,.35)'; g.beginPath(); g.ellipse(portal.x, FEET - 140, 62, 120, 0, 0, 7); g.fill(); g.restore(); glow(g, portal.x, FEET - 140, 200, '200,170,255', .4 * portal.a); });
    yield* tween(1.4, p => { portal.a = p; });
    kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.2); kam.eyes = '';
    yield* walkTo(320, 55);
    yield* tween(.6, p => { kam.alpha = 1 - p; kam.sx = 1 - p * .6; }); kam.alpha = 0; kam.sx = 1;
    K.flash(1, '230,220,255', 1.2);
    yield* K.card('DEEL 1', 'DE EERSTE LES', 2.6, { size: 44 });

    /* ---------- part 1: the first lesson ---------- */
    stop(portalFx); set.enter(); K.setv('dark', .2, .01); K.grade('magie', .35, .01);
    const lightOn = K.light(() => set.out ? null : { x: 440, y: 330 }, 260, { col: '255,210,140', a: .7 });
    const cauldronL = K.light(() => set.out ? null : { x: 890, y: 450 }, 200, { col: '120,255,140', a: .8 });
    kam.alpha = 1; kam.x = 170; kam.face = -1; kam.eyes = '';
    const seat = (i) => 110 + i * 85;
    gang.forEach((a, i) => { a.cx = -80 - i * 70; a.face = 1; a.alpha = 1; });
    yield* K.fadeIn(1.4);
    yield* par(...gang.map((a, i) => petTo(a, seat(i), K.PET[a.pet].run * 1.2)));
    gang.forEach((a, i) => { a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); });
    emote('notes', 2); gang.forEach(a => emote('?', 1.4, a)); yield* wait(2);
    // the wands come flying out of the cauldron
    kam.casting = true; K.lens({ z: 1.2, cx: 420, cy: 380 }, 3);
    for (const [i, a] of gang.entries()) {
      const w = { x: 890, y: 440 }, f = fx('screen', 0, (g) => { R(g, w.x - 3, w.y - 14, 6, 28, a.pet === 'pebbels' ? '#ff8a2a' : '#8a5a32'); glow(g, w.x, w.y, 30, COL[a.pet], .6); });
      const t0 = tipOf(a); yield* tween(.9, p => { w.x = lerp(890, t0.x, ez(p)); w.y = lerp(440, t0.y, ez(p)) - Math.sin(p * Math.PI) * 140; });
      stop(f); a.wand = a.pet === 'pebbels' ? 'carrot' : 'stick'; wands.push(a); emote('!', .8, a);
    }
    kam.casting = false;
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    // first, the teacher shows how: the lanterns come and dance in a ring
    kam.eyes = 'dicht'; kam.head = -.15; kam.casting = true; yield* wait(1);
    const homeL = lanterns.map(l => ({ x: l.x, y: l.y }));
    yield* tween(2, p => { lanterns.forEach((l, i) => { const a = i / lanterns.length * Math.PI * 2; l.x = lerp(homeL[i].x, 440 + Math.cos(a) * 170, ez(p)); l.y = lerp(homeL[i].y, 230 + Math.sin(a) * 70, ez(p)); }); });
    kam.eyes = 'blij';
    yield* tween(4, p => { lanterns.forEach((l, i) => { const a = i / lanterns.length * Math.PI * 2 + p * Math.PI * 3; l.x = 440 + Math.cos(a) * 170; l.y = 230 + Math.sin(a) * 70; }); });
    gang.forEach(a => emote('!', 1.4, a));
    yield* tween(2, p => { lanterns.forEach((l, i) => { const a = i / lanterns.length * Math.PI * 2 + Math.PI * 3; l.x = lerp(440 + Math.cos(a) * 170, homeL[i].x, ez(p)); l.y = lerp(230 + Math.sin(a) * 70, homeL[i].y, ez(p)); }); });
    kam.casting = false; kam.head = 0; kam.eyes = ''; gang.forEach(a => emote('hearts', 1.4, a)); yield* wait(1.6);
    // Wifi: his ball goes up and round… and down on Kamiel's head
    if (wf) {
      kam.head = .1; emote('dots', 1.2); yield* wait(1.2); kam.head = 0;
      const ball = { x: wf.cx + 40, y: FEET - 8, on: true };
      const ballF = fx('screen', 0, (g) => { if (!ball.on) return; R(g, ball.x - 8, ball.y - 8, 16, 16, '#e2343a'); R(g, ball.x - 5, ball.y - 5, 5, 5, '#ff8a8a'); R(g, ball.x - 8, ball.y - 1, 16, 3, '#ffd23f'); glow(g, ball.x, ball.y, 30, COL.wifi, .4 * (ball.y < FEET - 20 ? 1 : 0)); });
      hold(wf, null); yield* petJump(wf, 24, .35); wf.casting = true;
      yield* tween(1.2, p => { ball.y = FEET - 8 - ez(p) * 150; });
      yield* tween(3.4, p => { const a = p * Math.PI * 4; ball.x = 420 + Math.cos(a) * 200; ball.y = 330 + Math.sin(a) * 70; });
      wf.casting = false; emote('burst', .6, wf);
      const hd2 = K.kp(250, -10); yield* tween(.8, p => { ball.x = lerp(ball.x, hd2.x, p); ball.y = lerp(ball.y, hd2.y, p * p); });
      kam.eyes = 'x'; kam.sq = .9; emote('stars', 2); yield* tween(.6, p => { ball.x = hd2.x + p * 90; ball.y = hd2.y - Math.sin(p * Math.PI) * 60 + p * (FEET - 8 - hd2.y); });
      kam.sq = 1; yield* wait(1); kam.eyes = 'boos'; emote('angry', 1.2); wf.eyes = 'groot'; emote('sweat', 1.4, wf); yield* wait(1.4); kam.eyes = ''; wf.eyes = ''; ball.on = false; stop(ballF);
      hold(wf, 'sit');
    }
    // Pippa: a cloud becomes… Pippa
    let cat = null;
    if (pp) {
      cat = morpher({ x: 300, y: 150, u: 10 });
      pp.casting = true; hold(pp, 'paw'); const bp = beam(() => tipOf(pp), () => ({ x: cat.x, y: cat.y }), COL.pippa);
      yield* wait(1); yield* tween(2.6, p => { cat.p = p; }); cat.from = 'cat'; cat.p = 0; cat.to = 'cat'; cat.tint = 1; cat.col = COL.pippa;
      unbeam(bp); pp.casting = false; hold(pp, 'sit'); pop(cat.x, cat.y, COL.pippa);
      yield* K.lensW({ z: 1.6, cx: 320, cy: 230 }, 1.2); emote('stars', 2, pp); yield* wait(1.6);
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1); kam.eyes = 'blij'; yield* hop(26, .35); emote('hearts', 1.6); kam.eyes = '';
    }
    // Dobby: pop! pop! pop!
    if (db) {
      db.casting = true; yield* wait(.8);
      const jumps = [[750, 296], [kam.x + W / 2 + 10, FEET - 172], [db.cx, FEET]];
      for (const [k, [x, f]] of jumps.entries()) {
        pop(db.cx, db.feet - 40, COL.dobby); db.alpha = 0; yield* wait(.5);
        db.cx = x; db.feet = f; db.alpha = 1; pop(x, f - 40, COL.dobby); db.face = k === 2 ? -1 : 1;
        if (k === 0) { gang.forEach(a => { if (a !== db) { a.face = 1; emote('!', 1, a); } }); }
        if (k === 1) { kam.eyes = 'groot'; kam.head = -.2; emote('!?', 1.6); }
        yield* wait(1.6); kam.head = 0;
      }
      db.casting = false; db.feet = FEET; kam.eyes = ''; emote('dots', 1.4); hold(db, 'up'); yield* wait(1); db.face = 1; emote('notes', 1.2, db);
    }
    // Pebbels floats… and does not like it
    if (pb) {
      pb.casting = true; hold(pb, 'jump'); yield* tween(2.4, p => { pb.lift = ez(p) * 140; pb.r = Math.sin(p * 9) * .2; });
      pb.eyes = 'groot'; emote('!', 1.2, pb); yield* tween(1.4, p => { pb.r = Math.sin(p * 30) * .35; });
      yield* walkTo(pb.cx - W / 2 + 70, 120); kam.face = -1;
      yield* tween(1.8, p => { pb.lift = 140 * (1 - ez(p)); pb.r = 0; }); pb.lift = 0; pb.casting = false; hold(pb, 'sit'); pb.eyes = '';
      emote('heart', 1.6, pb); kam.eyes = 'blij'; yield* wait(1.6); kam.eyes = '';
      yield* walkTo(170, 90); kam.face = -1;
    }
    // Snoet: too much. Everything spins… and everyone is a tiny Kamiel
    if (sn) {
      hold(sn, null); for (let k = 0; k < 8; k++) { sn.face = -sn.face; yield* petJump(sn, 10, .15); }
      sn.casting = true; emote('burst', .6, sn); yield* wait(.6);
      const wild = beam(() => tipOf(sn), () => ({ x: 480 + Math.cos(K.t * 9) * 300, y: 250 + Math.sin(K.t * 7) * 150 }), COL.snoet); wild.wob = 3;
      yield* wait(1.2);
      K.lens({ rot: Math.PI * 2, z: 1.15 }, 2.4); yield* wait(2.4); K.lens({ rot: 0, z: 1 }, 0);
      unbeam(wild); sn.casting = false;
      K.flash(1, '255,240,120', 1.6);
      const minis = gang.map(a => { a.alpha = 0; return set.add(K.llama({ cx: a.cx, feet: FEET, s: .42, face: 1, outfit: [] }), true); });
      gang.forEach(a => pop(a.cx, FEET - 40, COL.snoet));
      yield* wait(1);
      kam.eyes = 'groot'; emote('!?', 2); yield* wait(1.6);
      yield* K.lensW({ z: 2.3, cx: minis[0].cx + 60, cy: FEET - 70 }, 1.4);
      for (let k = 0; k < 2; k++) { minis.forEach(m => { m.eyes = 'dicht'; }); yield* wait(.2); minis.forEach(m => { m.eyes = ''; }); yield* wait(.8); }
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
      for (let k = 0; k < 3; k++) { yield* tween(.35, p => { minis.forEach((m, i) => { m.feet = FEET - Math.sin(p * Math.PI) * 30; }); }); }
      minis.forEach(m => { m.face = -1; }); yield* wait(.6); minis.forEach(m => { m.face = 1; });
      kam.eyes = 'dicht'; emote('sweat', 1.6); yield* wait(1.6);
      // Kamiel puts it right
      kam.eyes = 'boos'; kam.casting = true; const fix = beam(() => tipOf(null), () => ({ x: minis[Math.floor(K.t * 4) % minis.length].cx, y: FEET - 60 }), COL.kamiel);
      yield* wait(1.8); unbeam(fix); kam.casting = false;
      minis.forEach((m, i) => { m.alpha = 0; gang[i].alpha = 1; pop(m.cx, FEET - 40, COL.kamiel); }); K.flash(.7, '220,200,255', 2);
      yield* wait(1); kam.eyes = ''; sn.eyes = 'groot'; emote('sweat', 1.8, sn); hold(sn, 'sit'); yield* wait(1.8); sn.eyes = '';
    }
    gang.forEach(a => { emote('hearts', 1.6, a); }); emote('hearts', 1.6); yield* wait(1.8);
    if (cat) { stop(cat.fx); cat = null; }
    yield* K.fadeOut(1.4);
    yield* K.card('DEEL 2', 'HET TOERNOOI', 2.6, { size: 44 });

    /* ---------- part 2: the tournament, out in the world ---------- */
    set.leave(); K.setv('dark', .05, .01); K.grade('magie', .3, .01);
    kam.x = 0; kam.face = -1; kam.eyes = '';
    const left = [wf, pp, db].filter(Boolean), right = [pb, sn].filter(Boolean);
    left.forEach((a, i) => { a.cx = 120 + i * 90; a.face = 1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.alpha = 1; });
    right.forEach((a, i) => { a.cx = W - 250 - i * 90; a.face = -1; hold(a, 'sit'); a.alpha = 1; });
    // the jury: Heidi, with a card of stars
    const h = set.add(K.heidi(1, { eyes: 'vies' }), false);
    const card = { n: 0, a: 0 }, GREY = { pal: { K: '#3a3a3a', Y: '#9a9a9a' }, rows: K.SP.star.rows };
    fx('screen', 0, (g) => { if (card.a <= 0 || h.alpha <= 0) return; const p = K.A.llamaPoint(h, 200, -60); g.globalAlpha = card.a;
      R(g, p.x - 3, p.y - 20, 6, 40, '#5a3a22'); R(g, p.x - 56, p.y - 74, 112, 56, '#5a3a22'); R(g, p.x - 50, p.y - 68, 100, 44, '#f4efe6');
      for (let k = 0; k < 3; k++) K.sprC(g, k < card.n ? K.SP.star : GREY, p.x - 30 + k * 30, p.y - 46, 3.4); g.globalAlpha = 1; });
    function* score(n) { card.n = n; yield* tween(.4, p => { card.a = p; }); yield* wait(2); yield* tween(.3, p => { card.a = 1 - p; }); }
    yield* K.fadeIn(1.4);
    yield* K.actorTo(h, W - 80, 70); h.face = -1;
    emote('notes', 1.6); emote('dots', 1.6, h); yield* wait(1.6);
    // round 1: Wifi lifts the whole world
    let lev = 0, storm = 0;
    K.setItemOff((it, layer, sx, y, w, h) => { const s = (sx * 13.7 + y * 3.1) % 1; const up = lev * (50 + (Math.abs(Math.sin(sx * .013)) * 90)) * (layer === 0 ? .4 : 1);
      if (!lev && !storm) return null; return { y: -up + Math.sin(K.t * 2 + sx * .02) * 8 * lev, r: Math.sin(K.t * 1.3 + sx) * .08 * lev + Math.sin(K.t * 9 + sx) * .07 * storm, x: Math.sin(K.t * 3 + sx) * 10 * storm }; });
    K.setCloudOff((cl, x, y) => ({ y: -lev * 30 + Math.sin(K.t + x) * 6 * lev, x: storm * Math.sin(K.t * 2 + y) * 30 }));
    if (wf) { hold(wf, null); yield* petJump(wf, 20, .3); wf.casting = true; const b = beam(() => tipOf(wf), () => ({ x: 480 + Math.sin(K.t * 2) * 300, y: 330 }), COL.wifi);
      yield* tween(3, p => { lev = ez(p); }); unbeam(b); wf.casting = false; hold(wf, 'sit');
      kam.eyes = 'groot'; kam.head = -.2; emote('!', 1.4); right.forEach(a => emote('!', 1.2, a));
      yield* K.lensW({ z: 1.3, cx: W / 2, cy: H / 2 - 40, rot: .03 }, 3); yield* wait(1.4);
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2, rot: 0 }, 1.5);
      yield* tween(2.4, p => { lev = 1 - ez(p); }); lev = 0; kam.head = 0; kam.eyes = '';
      yield* score(2); emote('dots', 1.2, wf);
    }
    // round 2: Pippa draws with the clouds
    if (pp) { hold(pp, 'paw'); pp.casting = true;
      const shapes = [morpher({ x: 220, y: 140, u: 9 }), morpher({ x: 480, y: 120, u: 9 }), morpher({ x: 740, y: 150, u: 9 })];
      const targets = ['heart', 'fish', 'llama'];
      for (let k = 0; k < 3; k++) { const o = shapes[k]; const b = beam(() => tipOf(pp), () => ({ x: o.x, y: o.y }), COL.pippa); o.to = targets[k];
        yield* tween(1.6, p => { o.p = p; }); o.from = o.to; o.p = 0; o.tint = 1; o.col = COL.pippa; unbeam(b); pop(o.x, o.y, COL.pippa); yield* wait(.4); }
      pp.casting = false; hold(pp, 'sit'); emote('stars', 1.8, pp); kam.eyes = 'blij'; emote('hearts', 1.6); yield* wait(2.2);
      yield* score(1); pp.eyes = ''; emote('angry', 1.8, pp); yield* wait(1);
      for (const o of shapes) { yield* tween(.3, p => { o.a = 1 - p; }); stop(o.fx); } kam.eyes = ''; }
    // round 3: Pebbels makes it snow
    if (pb) { pb.casting = true; hold(pb, 'paw'); const b = beam(() => tipOf(pb), () => ({ x: 480, y: 90 }), COL.pebbels); yield* wait(1.6); unbeam(b); pb.casting = false; hold(pb, 'sit');
      const snow = K.weather('snow', 1.6); kam.head = -.25; kam.eyes = 'blij'; gang.forEach(a => emote('snow', 2, a)); yield* wait(2.4);
      if (wf) { hold(wf, null); for (let k = 0; k < 3; k++) { yield* petJump(wf, 44, .4, wf.cx + 30); } hold(wf, 'sit'); }
      h.eyes = 'blij'; yield* score(3); h.eyes = 'vies'; emote('heart', 1.6, pb); kam.head = 0; kam.eyes = ''; K.stop(snow); yield* wait(.6); }
    // round 4: Dobby pops all over the place… and lands on the jury
    if (db) { db.casting = true; const home = db.cx;
      const spots = [[480, FEET], [K.kx() + 6, FEET - 218], [h.cx + 14, K.A.llamaPoint(h, 560, 540).y]];
      for (const [k, [x, f]] of spots.entries()) { pop(db.cx, db.feet - 40, COL.dobby); db.alpha = 0; yield* wait(.4); db.cx = x; db.feet = f; db.alpha = 1; pop(x, f - 40, COL.dobby); db.face = 1;
        if (k === 1) { kam.eyes = 'groot'; kam.head = -.2; emote('!?', 1.4); } yield* wait(1.4); kam.head = 0; kam.eyes = ''; }
      h.eyes = 'boos'; emote('angry', 1.8, h); yield* K.lensW({ z: 2, cx: h.cx - 30, cy: FEET - 170 }, .6); yield* wait(1.4); yield* score(0); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .6);
      pop(db.cx, db.feet - 40, COL.dobby); db.alpha = 0; yield* wait(.4); db.cx = home; db.feet = FEET; db.alpha = 1; pop(home, FEET - 40, COL.dobby); db.casting = false; db.face = 1; h.eyes = 'vies'; emote('sweat', 1.4, db); yield* wait(1.2); }
    // round 3: the duel
    const d1 = db || wf || gang[0], d2 = sn || pb || gang[gang.length - 1];
    hold(d1, null); hold(d2, null);
    yield* par(walkTo(-330, 90), petTo(d1, 320, 80), petTo(d2, 680, 80)); d1.face = 1; d2.face = -1; kam.face = 1;
    // Kamiel moves to the back as the referee
    yield* K.lensW({ z: 2.2, cx: d1.cx + 40, cy: FEET - 70 }, .01); d1.eyes = ''; yield* wait(1);
    yield* K.lensW({ z: 2.2, cx: d2.cx - 40, cy: FEET - 70 }, .01); yield* wait(1);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    kam.head = -.1; emote('!', 1); yield* wait(.8); kam.head = 0;
    d1.casting = true; d2.casting = true;
    const mid = { x: 480, y: FEET - 90, r: 14 };
    const midFx = fx('screen', 0, (g) => { const r = mid.r + Math.sin(K.t * 20) * 3; disc(g, Math.round(mid.x), Math.round(mid.y), Math.round(r), '#ffffff'); glow(g, mid.x, mid.y, r * 4, '255,255,220', .6); });
    const midL = K.light(() => ({ x: mid.x, y: mid.y }), 200, { col: '255,240,200' });
    const b1 = beam(() => tipOf(d1), () => mid, COL[d1.pet]), b2 = beam(() => tipOf(d2), () => mid, COL[d2.pet]);
    const zap = K.particles('screen', { emit: (ps) => { for (let k = 0; k < 3; k++) ps.push(K.P({ x: mid.x, y: mid.y, vx: (rnd() - .5) * 300, vy: (rnd() - .5) * 300, life: .4 + rnd() * .3, col: rnd() < .5 ? COL[d1.pet] : COL[d2.pet] })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(${p.col},${1 - k})`; g.fillRect(p.x, p.y, 5, 5); } });
    for (let k = 0; k < 4; k++) { const to = 480 + (k % 2 ? 90 : -90); const x0 = mid.x; yield* tween(1.3, p => { mid.x = lerp(x0, to, ez(p)); d1.sq = 1 - .06 * Math.sin(p * Math.PI); d2.sq = d1.sq; mid.r = 14 + k * 6 + p * 6; }); K.lens({ shake: 2 + k }, 0); }
    // it grows… and grows… and rises
    yield* tween(2.2, p => { mid.r = 38 + p * 30; mid.x = lerp(mid.x, 480, p); });
    unbeam(b1); unbeam(b2); d1.casting = false; d2.casting = false; stop(zap); K.lens({ shake: 0 }, .3);
    d1.eyes = 'groot'; d2.eyes = 'groot'; kam.eyes = 'groot'; emote('!?', 1.6);
    yield* tween(2, p => { mid.y = lerp(FEET - 90, 200, ez(p)); mid.r = 68 + p * 20; });
    K.flash(1, '255,255,255', 1.2); K.lens({ shake: 10 }, 0); stop(midFx); K.unlight(midL);
    yield* wait(.4); K.lens({ shake: 0 }, .6);
    yield* K.fadeOut(.8);
    yield* K.card('DEEL 3', 'DE STERRENSTORM', 2.6, { size: 44 });

    /* ---------- part 3: a storm of stars ---------- */
    K.grade('ruimte', .5, .01); K.setv('dark', .3, .01);
    gang.forEach((a, i) => { a.eyes = 'groot'; a.cx = 140 + i * 70; a.face = 1; hold(a, 'stand'); });
    kam.x = -40; kam.face = 1; kam.eyes = 'groot';
    // the creature: a long serpent made of stars, with big eyes
    const C = { x: 900, y: 140, tx: 700, ty: 160, a: 1, hist: [], dir: -1, size: 1, look: 0, glowA: 1, mood: 'boos' };
    const creature = fx('screen', 0, (g) => {
      if (C.a <= 0) return;
      C.x += (C.tx + Math.sin(K.t * 1.7) * 60 - C.x) * Math.min(1, K.dt * 1.6); C.y += (C.ty + Math.sin(K.t * 2.3) * 40 - C.y) * Math.min(1, K.dt * 1.6);
      const vx = C.x - (C.px === undefined ? C.x : C.px); C.px = C.x; if (Math.abs(vx) > .2) C.dir += (Math.sign(vx) - C.dir) * Math.min(1, K.dt * 1.5);
      g.save(); g.globalAlpha = C.a;
      for (let i = 28; i > 0; i--) { const q = i / 28, x = C.x - C.dir * i * 22 * C.size + Math.sin(K.t * 2 - i * .35) * 20 * q, y = C.y + Math.sin(K.t * 3 - i * .45) * 40 * q + i * 2.5,
          s = Math.round((34 - q * 24) * C.size / 6) * 6, col = ['255,230,90', '120,220,255', '255,120,220', '255,255,255'][(i + Math.floor(K.t * 6)) % 4];
        glow(g, x, y, s * 2, col, .3); g.fillStyle = `rgb(${col})`; g.fillRect(Math.round((x - s / 2) / 6) * 6, Math.round((y - s / 2) / 6) * 6, s, s);
        if (i % 4 === 0) { R(g, x - 3, y - s / 2 - 14, 6, 10, '#fff3a0'); R(g, x - 3, y + s / 2 + 4, 6, 10, '#fff3a0'); }
        if (i % 6 === 0) K.sprC(g, K.SP.spark, x + Math.sin(K.t * 5 + i) * 20, y - s - 6, 3); }
      const r = Math.round(46 * C.size / 6) * 6; glow(g, C.x, C.y, r * 3.5, '255,240,180', .55 * C.glowA);
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .38; for (let j = 0; j < 4; j++) R(g, C.x + Math.cos(a) * (r + j * 9) - 4, C.y + Math.sin(a) * (r + j * 9) - 4, 9 - j * 2, 9 - j * 2, '#fff3a0'); }
      disc(g, C.x, C.y, r, '#ffe680'); disc(g, C.x, C.y + 6, r - 10, '#fff3b0');
      const ex = Math.sign(K.kx() - C.x) * 6 * C.size;
      for (const d of [-1, 1]) { const x = C.x + d * r * .42, y = C.y - r * .12; R(g, x - 14 * C.size, y - 16 * C.size, 28 * C.size, 30 * C.size, '#ffffff'); R(g, x - 6 * C.size + ex, y - 6 * C.size, 12 * C.size, 14 * C.size, '#1a1030');
        if (C.mood === 'boos') R(g, x - 16 * C.size, y - (d > 0 ? 24 : 20) * C.size - (d > 0 ? 0 : 0), 32 * C.size, 7 * C.size, '#c98a20'); }
      if (C.mood === 'boos') R(g, C.x - r * .4, C.y + r * .42, r * .8, 10 * C.size, '#1a1030'); else { R(g, C.x - r * .3, C.y + r * .4, r * .6, 6 * C.size, '#1a1030'); R(g, C.x - r * .4, C.y + r * .3, 8, 8, '#1a1030'); R(g, C.x + r * .3, C.y + r * .3, 8, 8, '#1a1030'); }
      g.restore(); });
    const cLight = K.light(() => C.a > 0 ? { x: C.x, y: C.y } : null, 380, { col: '255,230,150', a: .9 });
    const stars = K.weather('sparks', 1.4);
    storm = 1;
    yield* K.fadeIn(1);
    K.lens({ shake: 2 }, 0);
    yield* wait(1.5);
    // it swoops low over them: everyone ducks behind Kamiel
    C.tx = 200; C.ty = FEET - 160; yield* wait(1.6);
    yield* par(...gang.map((a, i) => petTo(a, K.kx() + 90 + i * 34, 260)));
    gang.forEach(a => { a.face = -1; hold(a, 'down'); }); kam.face = -1;
    C.tx = 820; C.ty = 120; yield* shiver(1.6, 4);
    yield* K.lensW({ z: 1.5, cx: C.x, cy: C.y + 40 }, 1.2); yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    C.tx = 300; C.ty = 160; yield* wait(1.6); C.tx = 620; C.ty = 220; yield* wait(1.4);
    // it goes for Snoet: a chase
    const prey = sn || gang[0];
    hold(prey, null); prey.eyes = 'groot'; emote('!', 1, prey); C.tx = prey.cx + 200; C.ty = FEET - 150;
    yield* par(petTo(prey, 860, 280), (function* () { yield* wait(.5); C.tx = 800; })());
    prey.face = -1; yield* wait(.4);
    yield* par(petTo(prey, 120, 320), (function* () { yield* wait(.4); C.tx = 180; C.ty = FEET - 160; })());
    // Kamiel throws up a shield over all of them
    kam.casting = true; kam.eyes = 'boos'; kam.face = 1; const sh = { a: 0, r: 0 };
    const shield = fx('screen', 0, (g) => { if (sh.a <= 0) return; const cx = K.kx(), cy = FEET;
      g.fillStyle = `rgba(200,160,255,${.14 * sh.a})`; g.beginPath(); g.ellipse(cx, cy, 300 * sh.r, 250 * sh.r, 0, Math.PI, 0); g.fill();
      for (let k = 0; k <= 48; k++) { const a = Math.PI + k / 48 * Math.PI; R(g, cx + Math.cos(a) * 300 * sh.r - 6, cy + Math.sin(a) * 250 * sh.r - 6, 12, 12, `rgba(${k % 3 ? '200,160,255' : '255,255,255'},${.9 * sh.a})`); } });
    yield* par(tween(.8, p => { sh.a = p; sh.r = ez(p); }), ...gang.map((a, i) => petTo(a, K.kx() - 150 + i * 60 + (i > 1 ? 140 : 0), 260)));
    gang.forEach(a => { a.face = 1; hold(a, 'down'); });
    for (let k = 0; k < 2; k++) {
      C.tx = K.kx() + (k ? 120 : -60); C.ty = FEET - 300; yield* wait(1.3);
      K.flash(.8, '220,200,255', 3); K.lens({ shake: 9 }, 0); pop(C.x, C.y + 40, COL.kamiel); C.tx = 760; C.ty = 130; yield* wait(.5); K.lens({ shake: 2 }, .5); yield* wait(1);
    }
    yield* tween(.8, p => { sh.a = 1 - p; sh.r = 1 + p * .2; }); stop(shield); kam.casting = false; emote('sweat', 1.6); yield* wait(1.4);
    // Kamiel tries alone: a little purple beam… and it fizzles
    kam.face = 1; kam.eyes = 'boos'; yield* walkTo(-120, 70); kam.face = 1;
    kam.casting = true; const solo = beam(() => tipOf(null), () => ({ x: C.x, y: C.y }), COL.kamiel);
    yield* wait(1.4); C.mood = 'boos'; K.lens({ shake: 7 }, 0); K.flash(.6, '255,240,180', 3);
    unbeam(solo); kam.casting = false; yield* tween(.5, p => { kam.x = -120 - 80 * ez(p); kam.r = -.2 * Math.sin(p * Math.PI); }); kam.r = 0;
    K.lens({ shake: 2 }, .5); kam.eyes = 'triest'; emote('sweat', 2); pop(K.kx(), FEET - 220, '120,120,140');
    yield* wait(2);
    yield* K.lensW({ z: 2.4, cx: K.kx() + 30, cy: FEET - 180 }, 1.2); yield* wait(1.4);
    // he looks at them. They look at him.
    kam.face = -1; kam.eyes = ''; yield* wait(1);
    yield* K.lensW({ z: 1.4, cx: K.kx() - 140, cy: FEET - 100 }, 1.2);
    gang.forEach(a => { hold(a, 'stand'); a.eyes = ''; }); yield* wait(.6); gang.forEach(a => emote('!', 1.2, a)); yield* wait(1.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    yield* K.fadeOut(1.2);
    yield* K.card('DEEL 4', 'SAMEN', 2.6, { size: 44 });

    /* ---------- part 4: together ---------- */
    C.tx = 480; C.ty = 170; C.x = 480; C.y = 170; C.hist.length = 0; K.lens({ shake: 1.5 }, 0);
    kam.x = 0; kam.face = -1; kam.eyes = 'boos';
    const ring5 = [-300, -200, 200, 300, -110].slice(0, gang.length);
    gang.forEach((a, i) => { a.cx = W / 2 + ring5[i]; a.face = a.cx < W / 2 ? 1 : -1; hold(a, 'stand'); a.eyes = ''; });
    yield* K.fadeIn(1);
    yield* wait(1);
    // one by one, every colour joins
    const focus = { x: 480, y: 300 };
    const bs = [];
    for (const a of gang) { a.casting = true; hold(a, a.pet === 'pippa' || a.pet === 'pebbels' ? 'paw' : (a.pet === 'dobby' ? 'up' : 'jump')); bs.push(beam(() => tipOf(a), () => focus, COL[a.pet])); emote('!', .8, a); yield* wait(.9); }
    kam.casting = true; bs.push(beam(() => tipOf(null), () => focus, COL.kamiel)); yield* wait(.8);
    const ballFocus = fx('screen', 0, (g) => { const r = 20 + Math.sin(K.t * 18) * 4; disc(g, focus.x, focus.y, r, '#ffffff'); glow(g, focus.x, focus.y, 120, '255,255,255', .7); });
    yield* K.lensW({ z: 1.3, cx: 480, cy: 300 }, 1.4);
    // the rainbow beam
    const rainbow = fx('screen', 0, (g) => { const cols = ['#ff5a5a', '#ffb040', '#ffe14d', '#5ad860', '#5ab8ff', '#b98cff']; const a = focus, z = { x: C.x, y: C.y }, n = Math.floor(Math.hypot(z.x - a.x, z.y - a.y) / 6), dx = (z.x - a.x) / n, dy = (z.y - a.y) / n, nx = -dy / 6, ny = dx / 6;
      for (let k = 0; k <= n; k++) for (let c = 0; c < 6; c++) { const o = (c - 2.5) * 6 * (1 + Math.sin(K.t * 20 + k) * .1); g.fillStyle = cols[c]; g.fillRect(Math.round(a.x + dx * k + nx * o) - 3, Math.round(a.y + dy * k + ny * o) - 3, 7, 7); }
      glow(g, z.x, z.y, 160, '255,255,255', .6); });
    K.flash(.8); K.lens({ shake: 6 }, 0);
    yield* tween(3, p => { C.glowA = 1 + p; C.size = 1 + p * .5; C.a = 1; });
    C.mood = 'blij';
    // it bursts into light
    K.flash(1, '255,255,255', .8); K.lens({ shake: 0 }, 0); stop(rainbow); stop(ballFocus); bs.forEach(unbeam); gang.forEach(a => { a.casting = false; hold(a, 'sit'); }); kam.casting = false;
    C.a = 0; K.unlight(cLight); storm = 0; stop(stars);
    K.grade('magie', .35, 2); K.setv('dark', .15, 2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .01);
    const aur = { a: 0 };
    const aurora = fx('sky', 0, (g) => { if (aur.a <= 0) return; for (let x = 0; x < W; x += 6) { const h1 = 120 + Math.sin(x * .012 + K.t * .7) * 50 + Math.sin(x * .031 - K.t * 1.1) * 25, top = 40 + Math.sin(x * .008 + K.t * .4) * 30;
      const gr = g.createLinearGradient(0, top, 0, top + h1); gr.addColorStop(0, 'rgba(190,120,255,0)'); gr.addColorStop(.4, `rgba(170,110,255,${.45 * aur.a})`); gr.addColorStop(1, `rgba(80,255,170,${.6 * aur.a})`); g.fillStyle = gr; g.fillRect(x, top, 6, h1); } });
    const fw = K.particles('screen', { emit: (ps) => { if (aur.a > .5 && rnd() < .05) { const x = 100 + rnd() * 760, y = 80 + rnd() * 160, col = K.pick(['255,120,200', '120,220,255', '255,230,90', '140,255,160']); for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, v = 60 + rnd() * 70; ps.push(K.P({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, grav: 40, life: 1.4, col })); } } },
      draw: (g, p, k) => { g.fillStyle = `rgba(${p.col},${1 - k})`; g.fillRect(Math.round(p.x / 3) * 3, Math.round(p.y / 3) * 3, 5, 5); } });
    const gentle = K.weather('sparks', .8);
    yield* tween(3, p => { aur.a = p; });
    gang.forEach(a => { a.face = 1; a.eyes = ''; }); kam.eyes = 'blij';
    yield* K.lensW({ z: 1.25, cx: W / 2, cy: H / 2 - 50 }, 4);
    yield* wait(2);
    gang.forEach(a => emote('hearts', 2.4, a)); emote('hearts', 2.4); yield* wait(2);
    for (let k = 0; k < 3; k++) { yield* par(hop(34, .45), ...gang.map((a, i) => (function* () { yield* wait(i * .08); yield* petJump(a, 30, .4); })())); yield* wait(.3); }
    yield* K.lensW({ z: 1.5, cx: 480, cy: 160 }, 3); yield* wait(2);
    // what is left of the creature: a tiny star, with eyes
    const tiny = { x: 480, y: 80, on: true, sit: null };
    const tinyFx = fx('screen', 0, (g) => { if (!tiny.on) return; let x = tiny.x, y = tiny.y; if (tiny.sit) { const hp = K.A.petPoint(tiny.sit, 'head'); x = hp.x; y = hp.y - 16 + Math.sin(K.t * 3) * 2; }
      glow(g, x, y, 40, '255,240,160', .6); gridC(g, STARLING, { Y: '#ffe14d', K: '#1a1030' }, x, y, 4); });
    const host = db || gang[0];
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.4);
    const hp0 = K.A.petPoint(host, 'head');
    yield* tween(4, p => { tiny.x = lerp(480, hp0.x, ez(p)) + Math.sin(p * 12) * 40 * (1 - p); tiny.y = lerp(80, hp0.y - 16, ez(p)); });
    tiny.sit = host; host.eyes = 'groot'; emote('!', 1.2, host); yield* wait(1.2); host.eyes = ''; emote('heart', 1.6, host); yield* wait(2);
    yield* K.fadeOut(1.6);

    /* ---------- epilogue: the next morning. Everything is normal. Almost. ---------- */
    stop(aurora); stop(fw); stop(gentle); K.setItemOff(null); K.setCloudOff(null); aur.a = 0; wands.length = 0;
    K.grade('warm', .35, .01); K.setv('dark', 0, .01); K.lens({ shake: 0 }, 0);
    kam.x = -40; kam.face = 1; kam.eyes = '';
    gang.forEach((a, i) => { a.cx = 150 + i * 70 + (i > 1 ? 380 : 0); a.face = a.cx < W / 2 ? 1 : -1; hold(a, a.pet === 'dobby' ? 'up' : 'lie'); });
    yield* K.fadeIn(1.6);
    yield* wait(1);
    // the hat comes off… and stays up there
    K.withOutfit(['mantel']);
    const fh = { up: 0 };
    const floatHat = fx('screen', 0, (g) => { const p = K.kp(250, -60); gridC(g, WIZHAT, WIZPAL, p.x + Math.sin(K.t * 1.3) * 6, p.y - 30 - fh.up + Math.sin(K.t * 2) * 8, 3.3, kam.face > 0); K.sprC(g, K.SP.spark, p.x + 30 + Math.sin(K.t * 3) * 20, p.y - 70 - fh.up, 3); });
    pop(K.kx(), FEET - 250, COL.kamiel);
    yield* wait(1.5); kam.head = -.25; kam.eyes = 'groot'; emote('?', 2); yield* wait(2.2);
    yield* hop(50, .45); yield* tween(.6, p => { fh.up = 40 * Math.sin(p * Math.PI / 2); }); kam.head = -.2; yield* wait(1);
    yield* tween(1.4, p => { fh.up = 40 * (1 - p); }); kam.head = 0; kam.eyes = 'dicht'; emote('dots', 2); yield* wait(2);
    kam.eyes = 'blij'; emote('heart', 1.6); if (tiny.sit) { const s = tiny.sit; emote('notes', 1.6, s); }
    yield* K.lensW({ z: 1.6, cx: K.kx() + 20, cy: FEET - 230 }, 2.2); yield* wait(2.2);
    yield* K.ending('EINDE');
  } };
})();
