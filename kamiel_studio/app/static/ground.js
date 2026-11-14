/* The ground remembers the weather: puddles after the rain (that mirror the sky), snow that stays and melts with the
   real temperature (on the grass, the hills and on top of everything that stands), footprints of Kamiel and the
   housemates in the snow or the wet grass, and fireflies on warm summer evenings.

   window.KamielGround.create(A), A = { W, H, HOR0, PLACE, PW, kx(), horY(wx), weather(), temp(), sunAlt(), now(),
   sky (canvas with the sky of this frame), params }
   It only draws on top of what is there; it never moves or changes anything, so it can't break a scene. */
(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (a, n) => ((a % n) + n) % n;
  function rnd(seed) { const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  function create(A) {
    const W = A.W, H = A.H, HOR0 = A.HOR0;
    const force = (A.params && A.params.get('grond')) || '';   // ?grond=plassen / sneeuw / vuurvliegjes / ijs, to try it out
    // how wet and how snowy the ground is (0..1), remembered across a reload of the page
    let wet = 0, snow = 0, saveT = 0;
    try { const s = JSON.parse(localStorage.getItem('kamiel-grond') || 'null'); if (s && Date.now() - s.t < 48 * 3600e3) { const h = (Date.now() - s.t) / 3600e3; wet = clamp(s.wet - h / 3, 0, 1); snow = clamp(s.snow - (h > 1 ? h / 12 : 0), 0, 1); } } catch (e) { }
    if (force === 'plassen') wet = 1; if (force === 'sneeuw') snow = 1; if (force === 'ijs') wet = 1;
    let lastT = 0;

    function update() {
      const nowT = performance.now() / 1000, dt = lastT ? clamp(nowT - lastT, 0, 1) : 0; lastT = nowT;
      const wx = A.weather(), temp = force === 'ijs' ? -3 : A.temp(), alt = A.sunAlt();
      const raining = wx === 'regen' || wx === 'onweer', snowing = wx === 'sneeuw';
      // wet: soaks in ~10 min of rain; dries in about 3 hours (faster in sun and warmth, slower at night)
      if (raining) wet = Math.min(1, wet + dt / 600);
      else if (force !== 'plassen' && force !== 'ijs') {
        const k = (alt > 0 ? 1.4 : .6) * (temp === null ? 1 : clamp(.5 + temp / 20, .3, 2));
        wet = Math.max(0, wet - dt * k / (3 * 3600));
      }
      // snow: builds up in ~30 min of snowfall (only when it's cold enough); melts above 1 °C, faster the warmer
      if (snowing && (temp === null || temp <= 2)) snow = Math.min(1, snow + dt / 1800);
      else if (force !== 'sneeuw') {
        const melt = temp === null ? 1 / 12 : temp <= 1 ? 0 : (temp - 1) / 18;   // per hour: 3 °C ≈ 9 h, 10 °C ≈ 2 h
        snow = Math.max(0, snow - dt * melt / 3600 * (alt > 10 ? 1.3 : 1));
      }
      if (snow > .3) wet = Math.max(wet, .2);   // melting snow leaves the ground wet
      if (nowT - saveT > 60) { saveT = nowT; try { localStorage.setItem('kamiel-grond', JSON.stringify({ wet, snow, t: Date.now() })); } catch (e) { } }
      for (let i = prints.length - 1; i >= 0; i--) if (Date.now() - prints[i].t > prints[i].life) prints.splice(i, 1);
      for (let i = splashes.length - 1; i >= 0; i--) { const s = splashes[i]; s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 400 * dt; if (s.age > .5) splashes.splice(i, 1); }
    }
    const snowK = () => clamp((snow - .05) / .5, 0, 1);
    const wetK = () => clamp((wet - .1) / .5, 0, 1) * (1 - snowK());
    const frozen = () => { const t = force === 'ijs' ? -3 : A.temp(); return t !== null && t < 0; };

    /* ---------- puddles ---------- */
    const N = Math.max(1, Math.round(A.PW / A.PLACE)), PUD = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < 3; j++) {
      const r = (k) => rnd(i * 31 + j * 7 + k);
      if (j === 2 && r(9) < .5) continue;
      const y = HOR0 + 34 + r(2) * (H - HOR0 - 58);
      PUD.push({ wx: i * A.PLACE + r(1) * A.PLACE, y, rx: 34 + 46 * r(3), seed: i * 10 + j, wob: r(4) });
    }
    const dxOf = (wx) => mod(wx - (A.kx() - W / 2) + A.PW / 2, A.PW) - A.PW / 2;   // world x → screen x, nearest copy around the world
    // a pixel ellipse: rows of 2px, a little uneven at the edge
    function puddlePath(g, x, y, rx, ry, seed) {
      g.beginPath();
      for (let dy = -ry; dy < ry; dy += 2) {
        const k = 1 - ((dy + 1) / ry) ** 2; if (k <= 0) continue;
        const w = rx * Math.sqrt(k) * (.9 + .12 * rnd(seed + dy * .37));
        g.rect(Math.round(x - w), Math.round(y + dy), Math.round(w * 2), 2);
      }
    }
    function drawPuddles(g, t) {
      const k = wetK(); if (k <= 0) return;
      const ice = frozen(), raining = A.weather() === 'regen' || A.weather() === 'onweer';
      for (const p of PUD) {
        const x = dxOf(p.wx), size = (.45 + .55 * k) * (1 - (p.wob < .3 ? (1 - k) * .6 : 0));
        const rx = p.rx * size * (.75 + .25 * (p.y - HOR0) / (H - HOR0)), ry = Math.max(3, rx * (.13 + .12 * (p.y - HOR0) / (H - HOR0)));
        if (x + rx < 0 || x - rx > W || rx < 6) continue;
        g.save();
        puddlePath(g, x, p.y, rx, ry, p.seed); g.clip();
        // the sky, mirrored: the part just above the horizon on the far side, higher sky on the near side
        try {
          g.translate(x, p.y); g.scale(1, -1);
          g.drawImage(A.sky, clamp(x - rx, 0, W - 2 * rx), HOR0 - 210, 2 * rx, 210, -rx, -ry, 2 * rx, 2 * ry);
          g.setTransform(1, 0, 0, 1, 0, 0);
        } catch (e) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#7f9bc4'; g.fillRect(x - rx, p.y - ry, rx * 2, ry * 2); }
        g.fillStyle = 'rgba(25,35,55,.12)'; g.fillRect(x - rx, p.y - ry, rx * 2, ry * 2);   // water is a little darker than the sky
        g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x - rx, p.y - ry, rx * 2, 2);   // the far edge catches the light
        if (ice) {   // frozen: a pale, shiny skin with a few cracks
          g.fillStyle = 'rgba(215,232,250,.55)'; g.fillRect(x - rx, p.y - ry, rx * 2, ry * 2);
          g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath();
          g.moveTo(x - rx * .5, p.y - ry * .2); g.lineTo(x - rx * .1, p.y + ry * .3); g.lineTo(x + rx * .3, p.y - ry * .1); g.stroke();
        } else {
          g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(Math.round(x - rx * .5), Math.round(p.y - ry * .45), Math.round(rx * .6), 2);   // a glint
          if (raining) {   // rings where the drops fall
            g.strokeStyle = 'rgba(230,240,255,.55)'; g.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
              const ph = mod(t * .9 + rnd(p.seed + i) * 3, 1), cx = x + (rnd(p.seed * 3 + i + Math.floor(t * .9 + rnd(p.seed + i) * 3)) - .5) * rx * 1.4, rr = 2 + ph * 10;
              g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(cx, p.y + (rnd(p.seed + i * 5) - .5) * ry, rr, rr * .35, 0, 0, 7); g.stroke();
            }
            g.globalAlpha = 1;
          }
        }
        g.restore();
        // a dark wet rim
        g.fillStyle = 'rgba(40,32,20,.22)'; g.fillRect(Math.round(x - rx * .85), Math.round(p.y + ry - 1), Math.round(rx * 1.7), 2);
      }
    }
    // is (screen x, y) in a puddle? (for splashes)
    function inPuddle(x, y) {
      const k = wetK(); if (k <= 0 || frozen()) return false;
      for (const p of PUD) { const px = dxOf(p.wx), rx = p.rx * (.45 + .55 * k), ry = Math.max(3, rx * .2); if (((x - px) / rx) ** 2 + ((y - p.y) / (ry * 2.2)) ** 2 < 1) return true; }
      return false;
    }

    /* ---------- snow on the ground ---------- */
    function drawSnowGround(g, t, alt) {
      const k = snowK(); if (k <= 0) return;
      const cam = A.kx() - W / 2;
      g.save();
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, A.horY(x + cam) - 1 - 2 * k);
      g.lineTo(W, H); g.closePath();
      g.globalAlpha = .55 + .4 * k; g.fillStyle = '#eef3fb'; g.fill();
      g.clip();
      // soft blue drifts and sparkles in the sun
      g.globalAlpha = .5 * k;
      for (let i = 0; i < 14; i++) {
        const x = mod(rnd(i) * 1400 - cam * 1, W + 200) - 100, y = HOR0 + 18 + rnd(i + 50) * (H - HOR0 - 20);
        g.fillStyle = 'rgba(170,190,225,.6)'; g.fillRect(Math.round(x), Math.round(y), Math.round(60 + 90 * rnd(i + 9)), 2);
      }
      if (alt > 0) for (let i = 0; i < 40; i++) {
        const tw = Math.sin(t * 3 + i * 2.1); if (tw < .85) continue;
        const x = mod(rnd(i + 200) * 1700 - cam, W), y = HOR0 + 10 + rnd(i + 300) * (H - HOR0 - 10);
        g.globalAlpha = (tw - .85) / .15 * k; g.fillStyle = '#fff'; g.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      g.restore();
    }
    // the hills get a white cover too (called with the hill's path still set as the clip)
    function snowHill(g, x, y, w, h) { const k = snowK(); if (k <= 0) return; g.fillStyle = `rgba(236,242,252,${.75 * k})`; g.fillRect(x, y, w, h); }

    /* ---------- snow on top of things ---------- */
    const capCache = new Map();
    function capFor(img, w, h, flip) {
      const key = (img.src || '') + '|' + Math.round(w) + '|' + Math.round(h) + '|' + (flip ? 1 : 0);
      if (capCache.has(key)) return capCache.get(key);
      let out = null;
      try {
        const cw = Math.max(1, Math.round(w)), ch = Math.max(1, Math.round(h));
        const c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d');
        if (flip) { x.translate(cw, 0); x.scale(-1, 1); }
        x.drawImage(img, 0, 0, cw, ch);
        const d = x.getImageData(0, 0, cw, ch).data, top = new Int32Array(cw).fill(-1);
        for (let i = 0; i < cw; i++) for (let j = 0; j < ch; j++) if (d[(j * cw + i) * 4 + 3] > 110) { top[i] = j; break; }
        const o = document.createElement('canvas'); o.width = cw; o.height = ch; const y = o.getContext('2d');
        const th = clamp(Math.round(w / 28), 3, 9);
        for (let i = 2; i < cw - 2; i++) {
          if (top[i] < 0 || top[i - 2] < 0 || top[i + 2] < 0) continue;
          if (Math.abs(top[i + 2] - top[i - 2]) > 7 || top[i] > ch - 6) continue;   // too steep: snow slides off
          const tk = th + (rnd(i * .7) > .7 ? 1 : 0);
          y.fillStyle = '#f5f8ff'; y.fillRect(i, top[i] - tk + 2, 1, tk);
          y.fillStyle = 'rgba(160,180,215,.8)'; y.fillRect(i, top[i] + 2, 1, 1);
        }
        out = o;
      } catch (e) { out = null; }
      if (capCache.size > 300) capCache.clear();
      capCache.set(key, out);
      return out;
    }
    function snowCap(g, img, x, y, w, h, flip) {
      const k = snowK(); if (k <= .05 || !img || !img.complete || !img.naturalWidth || w < 12) return;
      const c = capFor(img, w, h, flip); if (!c) return;
      const a = g.globalAlpha; g.globalAlpha = a * Math.min(1, k * 1.4); g.drawImage(c, x, y, w, h); g.globalAlpha = a;
    }

    /* ---------- footprints ---------- */
    const prints = [], splashes = [], last = new WeakMap(), lastK = {};
    const KIND = { wifi: 'hond', snoet: 'hond', pippa: 'kat', pebbels: 'kat', dobby: 'konijn' };
    // called every frame for whoever is drawn: leaves a print every step while walking on snowy or wet ground
    function track(key, o, kind) {
      kind = KIND[kind] || kind;
      const sk = snowK(), wk = wetK();
      if (o.pose !== 'walk' || (o.lift || 0) > 4 || o.feet < HOR0 + 4 || o.alpha === 0) return;
      const wx = o.cx + A.kx() - W / 2, s = o.s || 1;
      const prev = typeof key === 'string' ? lastK[key] : last.get(key);
      const stride = (kind === 'lama' ? 30 : kind === 'konijn' ? 22 : 16) * s;
      if (prev && Math.abs(wx - prev.wx) < stride) return;
      const side = prev ? -prev.side : 1, rec = { wx, side };
      if (typeof key === 'string') lastK[key] = rec; else last.set(key, rec);
      if (!prev) return;
      if (kind === 'lama' && inPuddle(o.cx, o.feet)) for (let i = 0; i < 6; i++) splashes.push({ x: o.cx + (Math.random() - .5) * 20, y: o.feet, vx: (Math.random() - .5) * 90, vy: -80 - Math.random() * 90, age: 0 });
      if (sk < .25 && wk < .3) return;
      if (prints.length > 260) prints.shift();
      prints.push({ wx, y: o.feet + side * 2.5 * s, kind, s, t: Date.now(), life: sk >= .25 ? 300000 : 90000, snow: sk >= .25, dir: o.face > 0 ? 1 : -1 });
    }
    function drawPrints(g) {
      if (!prints.length) return;
      for (const p of prints) {
        const x = dxOf(p.wx); if (x < -20 || x > W + 20) continue;
        const a = 1 - (Date.now() - p.t) / p.life; if (a <= 0) continue;
        g.fillStyle = p.snow ? `rgba(140,158,192,${.7 * a})` : `rgba(45,34,22,${.35 * a})`;
        const u = Math.max(2, Math.round(3 * p.s)), X = Math.round(x), Y = Math.round(p.y);
        if (p.kind === 'lama') { g.fillRect(X - 2 * u, Y, 2 * u, u + 1); g.fillRect(X + 1, Y, 2 * u, u + 1); }   // a cloven hoof: two halves
        else if (p.kind === 'konijn') { g.fillRect(X - u, Y - 1, 3 * u, u); g.fillRect(X + 3 * u * p.dir, Y, u, u); }
        else {   // a paw: a pad and three toes (cats smaller)
          const v = p.kind === 'kat' ? Math.max(1, u - 1) : u;
          g.fillRect(X - v, Y, 2 * v, v + 1); g.fillRect(X - 2 * v + p.dir * v, Y - v - 1, v, v); g.fillRect(X - v / 2 + p.dir * v | 0, Y - 2 * v - 1, v, v); g.fillRect(X + v + p.dir * v, Y - v - 1, v, v);
        }
      }
    }
    function drawSplashes(g) {
      if (!splashes.length) return;
      g.fillStyle = 'rgba(210,225,245,.85)';
      for (const s of splashes) g.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    }

    /* ---------- fireflies ---------- */
    const FLY = Array.from({ length: 60 }, (_, i) => ({ x: rnd(i + 500) * 2400, y: rnd(i + 600), per: 2 + rnd(i + 700) * 3.5, off: rnd(i + 800) * 6, w: rnd(i + 900) * 6 }));
    function firefliesOn() {
      if (force === 'vuurvliegjes') return true;
      const d = A.now(), m = d.getMonth(), h = d.getHours(), temp = A.temp(), alt = A.sunAlt();
      const season = (m >= 5 && m <= 7) || (m === 4 || m === 8) && temp !== null && temp >= 18;
      const warm = temp === null ? (m >= 5 && m <= 7) : temp >= 15;
      const wx = A.weather();
      return season && warm && alt < -3 && (h >= 18 || h < 2) && wx !== 'regen' && wx !== 'onweer' && wx !== 'sneeuw' && wx !== 'mist';
    }
    let flyFade = 0;
    function drawFireflies(g, t) {
      flyFade = clamp(flyFade + (firefliesOn() ? .01 : -.01), 0, 1);
      if (flyFade <= 0) return;
      const cam = A.kx() * .92;
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const f of FLY) {
        const x = mod(f.x + Math.sin(t * .3 + f.w) * 40 - cam, W + 120) - 60;
        const y = HOR0 - 40 + f.y * (H - HOR0 + 10) + Math.sin(t * .5 + f.w * 2) * 14;
        const ph = mod(t + f.off, f.per), k = ph < 1.1 ? Math.sin(ph / 1.1 * Math.PI) : 0, a = (.08 + .92 * k) * flyFade;
        if (a < .03) continue;
        const gr = g.createRadialGradient(x, y, 0, x, y, 18);
        gr.addColorStop(0, `rgba(215,255,120,${.6 * a})`); gr.addColorStop(.4, `rgba(190,240,80,${.22 * a})`); gr.addColorStop(1, 'rgba(160,220,60,0)');
        g.fillStyle = gr; g.fillRect(x - 18, y - 18, 36, 36);
        g.fillStyle = `rgba(250,255,200,${a})`; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 3, 3);
      }
      g.restore();
    }

    function drawGround(g, t) { update(); drawPuddles(g, t); drawSnowGround(g, t, A.sunAlt()); drawPrints(g); }
    return { drawGround, snowCap, snowHill, track, drawSplashes, drawFireflies, snowK, wetK, debug: () => ({ wet, snow, prints: prints.length }) };
  }
  window.KamielGround = { create };
})();
