/* Pyro: when a song by one of the artists in the Studio plays (Doja Cat out of the box), the world goes up in flames.
   Flame cannons along the ground fire on the beat, embers and sparks rise everywhere, fireballs burst in the sky,
   and the sky glows red. How hard depends on the song: every song gets its own level, from "already very intense"
   to "hell", and it swells and breathes along the song. Drawn on the screen layer, on top of the world, under the
   windows; it never touches the scenes, the events or the elements, so it can't break them.

   window.KamielPyro.create(A) with A = { W, H, ground, beat() -> {bpm, pos} | null, t() }
   returns { set(on, key), draw(g, dt), level(), active() } */
(function () {
  'use strict';
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // smooth noise, so the fire breathes instead of flickering at random
  function nz(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f), r = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; return r(i) * (1 - u) + r(i + 1) * u; }
  // fire colours, from white-hot to deep red smoke
  const HOT = ['#fffbe6', '#ffe9a3', '#ffc94a', '#ff9a1f', '#ff6a10', '#e8380c', '#b81f0a', '#6e1206'];

  function create(A) {
    const W = A.W, H = A.H;
    let on = false, fade = 0, key = '', base = .7, lvl = 0, lastBeat = -1, startT = 0, flash = 0;
    const parts = [];          // flames, embers, sparks, smoke
    const bursts = [];         // fireballs in the sky (rings that expand)
    const cannons = [];        // flame jets along the ground
    function layout() {
      cannons.length = 0;
      // six cannons, none right in front of Kamiel in the middle
      [.07, .19, .31, .69, .81, .93].forEach((f, i) => cannons.push({ x: f * W, fire: 0, h: 0, side: i % 2, seed: hash('c' + i) * 100 }));
    }
    layout();

    function set(isOn, songKey) {
      if (isOn && songKey !== key) {   // a new song: its own level, between very intense (.55) and hell (1)
        key = songKey; base = .55 + .45 * hash(songKey || String(Math.random())); startT = A.t();
      }
      if (!isOn) key = '';
      on = !!isOn;
    }
    function add(p) { if (parts.length < 900) parts.push(p); }
    function flame(x, y, vy, size, life, spread) {
      add({ k: 'f', x, y, vx: (Math.random() - .5) * spread, vy, s: size, life, age: 0 });
    }
    function ember(x, y) {
      add({ k: 'e', x, y, vx: (Math.random() - .5) * 30, vy: -40 - Math.random() * 90, s: 2 + Math.random() * 3, life: 2 + Math.random() * 3, age: 0, w: Math.random() * 6 });
    }
    function spark(x, y, sp) {
      const a = Math.random() * Math.PI * 2, v = sp * (.4 + Math.random() * .8);
      add({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, s: 2 + Math.random() * 2, life: .6 + Math.random() * .9, age: 0 });
    }
    function smoke(x, y) {
      add({ k: 'm', x, y, vx: (Math.random() - .5) * 20, vy: -25 - Math.random() * 25, s: 14 + Math.random() * 18, life: 3 + Math.random() * 2, age: 0 });
    }

    function step(dt) {
      fade = clamp(fade + (on ? dt / 1.5 : -dt / 2.5), 0, 1);
      if (fade <= 0 && !parts.length && !bursts.length) { lvl = 0; return; }
      const t = A.t(), b = A.beat ? A.beat() : null, bpm = (b && b.bpm) || 112;
      const pos = b ? b.pos : (t - startT) * bpm / 60;
      // how hot right now: the song's own level, swelling over the first 40 s, breathing with slow noise,
      // and every 16 beats a big surge (the drop)
      const into = clamp((t - startT) / 40, 0, 1), phrase = (pos % 16) / 16;
      const surge = phrase > .875 ? (phrase - .875) * 8 : 0;
      lvl = fade * clamp(base * (.75 + .25 * into) + (nz(t * .15) - .5) * .18 + surge * .25, .45, 1.12);
      const hell = clamp((lvl - .8) / .3, 0, 1);
      const ground = A.ground;

      // on every beat: cannons fire (all of them on the downbeat, alternating sides in between)
      const beatN = Math.floor(pos);
      if (on && beatN !== lastBeat) {
        const down = beatN % 4 === 0;
        lastBeat = beatN;
        for (const c of cannons) if (down || (c.side === beatN % 2) || Math.random() < lvl * .4) c.fire = .35 + lvl * .5;
        if (down) flash = Math.max(flash, .12 + hell * .3);
        // fireballs in the sky, more of them the hotter it is
        const nb = Math.random() < lvl ? 1 + Math.floor(lvl * lvl * 3 * Math.random()) : 0;
        for (let i = 0; i < nb; i++) {
          const bx = 60 + Math.random() * (W - 120), by = 60 + Math.random() * (ground - 220);
          bursts.push({ x: bx, y: by, r: 4, R: 40 + 70 * lvl * Math.random() + 20, age: 0, life: .9 });
          for (let k = 0; k < 14 + lvl * 26; k++) spark(bx, by, 160 + 160 * lvl);
        }
      }
      // the cannons: a column of flame while they fire, taller the hotter
      for (const c of cannons) {
        const want = c.fire > 0 ? (150 + 230 * lvl) * (.85 + .3 * nz(t * 9 + c.seed)) : 0;
        c.h += (want - c.h) * Math.min(1, dt * (want > c.h ? 22 : 7));   // shoots up fast, dies down a little slower
        if (c.fire > 0) {
          c.fire -= dt;
          if (Math.random() < dt * 30) flame(c.x + (Math.random() - .5) * 10, ground - c.h * .7, -(120 + 200 * lvl), 8 + 6 * lvl, .5, 60);
          if (Math.random() < dt * 18) spark(c.x, ground - c.h * .9, 200);
        }
      }
      // embers drifting up all over the screen, smoke above the fire in hell
      for (let i = 0; i < (8 + 30 * lvl + 40 * hell) * dt * 6; i++) ember(Math.random() * W, H - Math.random() * (H - ground + 40));
      if (hell > 0 && Math.random() < hell * dt * 8) smoke(Math.random() * W, ground - 30);

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        if (p.k === 'f') { p.vy *= 1 - dt * 1.2; p.vx += (nz(p.y * .02 + t) - .5) * 40 * dt; }
        else if (p.k === 'e') { p.vx += Math.sin(t * 3 + p.w) * 25 * dt; }
        else if (p.k === 's') { p.vy += 260 * dt; p.vx *= 1 - dt; }
        else if (p.k === 'm') { p.s += 12 * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = bursts.length - 1; i >= 0; i--) { const f = bursts[i]; f.age += dt; if (f.age >= f.life) bursts.splice(i, 1); }
      flash = Math.max(0, flash - dt * 1.8);
    }

    let lastT = 0;
    function draw(g) {
      const now = performance.now() / 1000, dt = lastT ? now - lastT : 1 / 60; lastT = now;
      step(clamp(dt, 0, .05));
      if (fade <= 0 && !parts.length && !bursts.length) return;
      const ground = A.ground, hell = clamp((lvl - .8) / .3, 0, 1), t = A.t();
      g.save();
      // the sky glows: orange low, red higher up; in hell the whole sky turns deep red and pulses
      const pulse = .85 + .15 * Math.sin(t * 6);
      // only the sky changes colour (it stops above the horizon, so Kamiel and the world keep their own colours)
      const hz = A.horizon || ground - 30, sky = g.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, `rgba(${70 + 70 * hell | 0},0,0,${(.1 + .2 * lvl + .3 * hell) * fade * pulse})`);
      sky.addColorStop(.6, `rgba(255,${60 - 40 * hell | 0},0,${(.08 + .12 * lvl + .1 * hell) * fade})`);
      sky.addColorStop(1, `rgba(255,${120 - 60 * hell | 0},20,${(.1 + .12 * lvl) * fade})`);
      g.fillStyle = sky; g.fillRect(0, 0, W, hz);
      // smoke first (behind the fire), not additive
      for (const p of parts) if (p.k === 'm') {
        const a = (1 - p.age / p.life) * .28 * fade;
        g.fillStyle = `rgba(30,8,4,${a})`; g.fillRect(p.x - p.s / 2 | 0, p.y - p.s / 2 | 0, p.s | 0, p.s | 0);
      }
      // walls of fire: far away along the horizon (small), and close by along the bottom of the screen (big)
      fireWall(g, A.horizon || ground - 30, (8 + 18 * lvl + 30 * hell) * fade, t, 6, .55, 0);
      g.globalCompositeOperation = 'lighter';
      for (const c of cannons) if (c.h > 4) jet(g, c.x, ground, c.h * fade, t + c.seed);
      for (const f of bursts) {   // fireballs: a hot core and an expanding ring
        const k = f.age / f.life, r = f.r + (f.R - f.r) * Math.sqrt(k), a = (1 - k) * fade;
        const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        gr.addColorStop(0, `rgba(255,240,180,${a})`); gr.addColorStop(.35, `rgba(255,150,30,${a * .8})`); gr.addColorStop(1, 'rgba(200,30,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y, r, 0, Math.PI * 2); g.fill();
      }
      for (const p of parts) {
        if (p.k === 'm') continue;
        const k = p.age / p.life, s = (p.k === 'f' ? p.s * (1 - k * .6) : p.s) | 0 || 1;
        const col = p.k === 'f' ? HOT[Math.min(HOT.length - 1, (k * HOT.length) | 0)] : p.k === 's' ? HOT[(k * 3) | 0] : HOT[2 + ((k * 4) | 0)];
        g.globalAlpha = (p.k === 'f' ? (1 - k) * .85 : 1 - k) * fade;
        g.fillStyle = col; g.fillRect(p.x - s / 2 | 0, p.y - s / 2 | 0, s, s);   // square, chunky pixels: the world is pixel art
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      fireWall(g, H + 4, (16 + 46 * lvl + 120 * hell) * fade, t * 1.3, 4, 1, 1);
      // the ground itself glows
      // firelight: everything near the ground is lit warm (added light, so nothing gets darker)
      g.globalCompositeOperation = 'lighter';
      const gl = g.createLinearGradient(0, (A.horizon || ground) - 120, 0, H);
      gl.addColorStop(0, 'rgba(255,90,0,0)'); gl.addColorStop(1, `rgba(150,${50 - 20 * hell | 0},0,${(.18 + .22 * lvl) * fade})`);
      g.fillStyle = gl; g.fillRect(0, (A.horizon || ground) - 120, W, H);
      // Kamiel (in the middle) catches the firelight
      const kx = A.kamX ? A.kamX() : W / 2, ky = (A.horizon || ground) - 40, kr = g.createRadialGradient(kx, ky, 10, kx, ky, 170);
      kr.addColorStop(0, `rgba(255,120,30,${(.1 + .12 * lvl) * fade * (.85 + .15 * Math.sin(t * 11))})`); kr.addColorStop(1, 'rgba(255,80,0,0)');
      g.fillStyle = kr; g.fillRect(kx - 170, ky - 170, 340, 340);
      g.globalCompositeOperation = 'source-over';
      if (flash > 0) { g.fillStyle = `rgba(255,200,120,${flash * fade})`; g.fillRect(0, 0, W, H); }
      g.restore();
    }
    // a flame thrower: a tapering tongue with a white-hot core, chunky 4px steps, flickering edges
    function jet(g, x, y0, h, t) {
      const step = 4, base = 16 + h * .06;
      for (let y = 0; y < h; y += step) {
        const k = y / h, wob = (nz(t * 14 + y * .05) - .5) * 10 * k;
        const w = Math.max(2, base * (1 - k * .85) * (.8 + .4 * nz(t * 20 + y * .1)));
        const cx = x + wob;
        g.fillStyle = `rgba(255,${60 + 50 * (1 - k) | 0},10,${.55 * (1 - k * .6)})`; g.fillRect(Math.round((cx - w) / step) * step, y0 - y - step, Math.round(w * 2 / step) * step || step, step);
        g.fillStyle = `rgba(255,${170 + 60 * (1 - k) | 0},40,${.6 * (1 - k)})`; g.fillRect(Math.round((cx - w * .6) / step) * step, y0 - y - step, Math.round(w * 1.2 / step) * step || step, step);
        if (k < .55) { g.fillStyle = `rgba(255,250,215,${.75 * (1 - k / .55)})`; g.fillRect(Math.round((cx - w * .25) / step) * step, y0 - y - step, Math.round(w * .5 / step) * step || step, step); }
      }
    }
    // a row of flame tongues standing on a line: red at the back and tallest, orange, then yellow in front
    function fireWall(g, y0, h, t, px, alpha, mid) {
      if (h < 3) return;
      const layers = [[1, '#9e1a08', .9], [.72, '#ff5a12', .9], [.42, '#ffc23a', .95]];
      for (const [hk, col, a] of layers) {
        g.fillStyle = col; g.globalAlpha = a * alpha;
        for (let x = 0; x < W; x += px) {
          // tongues: two noises at different speeds, sharpened into peaks
          let n = nz(x * .035 + t * 2.2 + hk * 9) * .65 + nz(x * .11 - t * 3.1 + hk * 3) * .35;
          n = Math.pow(n, 1.6);
          let hh = h * hk * (.35 + 1.1 * n);
          if (mid) hh *= .55 + .45 * Math.min(1, Math.abs(x - W / 2) / 170);   // lower in front of Kamiel, so he stays visible
          hh = Math.round(hh / px) * px;
          if (hh > 0) g.fillRect(x, y0 - hh, px, hh);
        }
      }
      g.globalAlpha = 1;
    }
    return { set, draw, level: () => lvl, active: () => fade > 0 };
  }
  window.KamielPyro = { create };
})();
