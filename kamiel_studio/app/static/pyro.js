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

    /* Three moods, chosen per song (the same song always gets the same one):
       - 94 %: a concert. Flame cannons along the ground puff short bursts with a billowing top, on the beat, in patterns
         (all at once on the drop, a chase from left to right, the outer pair, then the inner pair…), with rests in between.
       - 5 %: very intense: flame throwers, walls of fire, sparks, fireballs, a glowing sky.
       - 1 %: literally hell.  ?pyro=concert / intens / hel forces one (to try it out). */
    let mode = 'concert';
    function set(isOn, songKey) {
      if (isOn && songKey !== key) {
        key = songKey; startT = A.t(); lastBeat = -1;
        const forced = /^test-(concert|intens|hel)$/.exec(songKey || ''), r = hash(songKey || String(Math.random()));
        mode = forced ? forced[1] : r < .01 ? 'hel' : r < .06 ? 'intens' : 'concert';
        const r2 = hash('lvl' + songKey);
        base = mode === 'hel' ? 1.08 : mode === 'intens' ? .6 + .2 * r2 : .5 + .5 * r2;   // concert: how many cannons go at once
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
      if (fade <= 0 && !parts.length && !bursts.length && !puffs.length) { lvl = 0; return; }
      const t = A.t(), b = A.beat ? A.beat() : null, bpm = (b && b.bpm) || 112;
      const pos = b ? b.pos : (t - startT) * bpm / 60;
      if (mode === 'concert') { concertStep(dt, t, pos); return; }
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
      if (fade <= 0 && !parts.length && !bursts.length && !puffs.length) return;
      if (mode === 'concert') { concertDraw(g); return; }
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
    /* ---------- the concert ---------- */
    const puffs = [];   // one burst of one cannon: a column that shoots up, then a fireball that lifts off and fades
    let pattern = null;
    function puff(c, power) {
      puffs.push({ x: c.x, age: 0, life: .75 + .25 * power, h: (110 + 90 * power) * (.9 + .2 * Math.random()), seed: Math.random() * 100 });
      for (let i = 0; i < 3 + power * 4; i++) spark(c.x + (Math.random() - .5) * 20, A.ground - 120 * power, 120);
    }
    function concertStep(dt, t, pos) {
      lvl = fade * base;
      const beatN = Math.floor(pos), half = Math.floor(pos * 2);
      if (on && half !== lastBeat) {
        lastBeat = half;
        const inBar = half % 8, bar = Math.floor(half / 8);
        if (inBar === 0) {   // a new bar: pick what the cannons do in it (and often nothing: the rests make the hits count)
          const drop = bar % 4 === 3, r = hash(key + 'bar' + bar);
          pattern = drop ? 'all' : r < .38 ? null : r < .55 ? 'chase' : r < .7 ? 'outin' : r < .85 ? 'pairs' : 'one';
        }
        const n = cannons.length, onBeat = half % 2 === 0, beatInBar = inBar >> 1;
        const fire = (i, pw) => { if (cannons[i]) puff(cannons[i], pw); };
        if (pattern === 'all' && inBar === 0) for (let i = 0; i < n; i++) fire(i, 1);
        else if (pattern === 'all' && inBar === 4 && base > .7) for (let i = 0; i < n; i++) fire(i, .8);
        else if (pattern === 'chase' && inBar < n) fire(inBar, .75);   // left to right on the half beats
        else if (pattern === 'outin' && onBeat) { const k = beatInBar % 3; fire(k, .8); fire(n - 1 - k, .8); }
        else if (pattern === 'pairs' && onBeat && beatInBar % 2 === 0) { const k = (beatInBar / 2) % 2; for (let i = k; i < n; i += 2) fire(i, .7); }
        else if (pattern === 'one' && onBeat && beatInBar === 0) fire(Math.floor(hash(key + bar) * n), .9);
      }
      for (let i = puffs.length - 1; i >= 0; i--) { puffs[i].age += dt; if (puffs[i].age >= puffs[i].life) puffs.splice(i, 1); }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        if (p.k === 's') { p.vy += 260 * dt; p.vx *= 1 - dt; } else if (p.k === 'm') p.s += 14 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }
    // a round blob of chunky 4px pixels
    function blob(g, x, y, r, col) {
      if (r < 2) return; g.fillStyle = col;
      for (let dy = -r; dy < r; dy += 4) { const w = Math.sqrt(Math.max(0, r * r - (dy + 2) * (dy + 2))); g.fillRect(Math.round((x - w) / 4) * 4, Math.round((y + dy) / 4) * 4, Math.max(4, Math.round(w * 2 / 4) * 4), 4); }
    }
    function concertDraw(g) {
      const ground = A.ground, t = A.t();
      g.save();
      // a warm glow behind the cannons while they fire (like the light on stage), nothing else changes colour
      let heat = 0; for (const p of puffs) heat += Math.max(0, 1 - p.age / p.life);
      if (heat > 0) {
        g.globalCompositeOperation = 'lighter';
        const gl = g.createLinearGradient(0, ground - 260, 0, H);
        gl.addColorStop(0, 'rgba(255,110,20,0)'); gl.addColorStop(.75, `rgba(255,110,20,${Math.min(.22, heat * .035)})`); gl.addColorStop(1, `rgba(255,90,10,${Math.min(.12, heat * .02)})`);
        g.fillStyle = gl; g.fillRect(0, ground - 260, W, H - ground + 260);
        g.globalCompositeOperation = 'source-over';
      }
      for (const p of puffs) {
        const k = p.age / p.life, rise = Math.min(1, p.age / .13);   // the column shoots up in about a tenth of a second
        const top = ground - p.h * rise, a = k < .7 ? 1 : 1 - (k - .7) / .3;
        g.globalCompositeOperation = 'source-over';
        // the column: full while it shoots up, then it lifts off from the bottom
        const lift = Math.max(0, (p.age - .32) * 300);
        if (lift < p.h * rise) {
          const ct = g.globalAlpha; g.globalAlpha = a;
          jet(g, p.x, ground - lift, Math.max(4, p.h * rise - lift), t * 1.5 + p.seed);
          g.globalAlpha = ct;
        }
        // the plume on top: billows out and drifts up like a flame, wider low and tongued higher up,
        // red outside, orange, a yellow-white heart (painted, not added, so it stays fiery against a blue day sky)
        g.globalCompositeOperation = 'source-over';
        const bk = Math.max(0, (p.age - .06) / (p.life - .06)), grow = Math.sqrt(bk), br = 12 + 34 * grow * (.9 + .2 * nz(p.seed));
        const by = top - 6 - bk * 30, layers = [['#b8280a', 1], ['#ff6a14', .78], ['#ffb22e', .55], ['#fff0b8', .3]];
        for (const [col, sc] of layers) {
          g.globalAlpha = a * (sc < .5 ? 1 - bk * .7 : 1);
          for (let i = 0; i < 10; i++) {
            const u = i / 9;   // 0 = bottom of the plume, 1 = the tip
            const ox = (nz(p.seed + i * 3.1 + t * 3) - .5) * br * (1.3 - u * .5), oy = -u * br * 1.8 * (.8 + .4 * nz(p.seed + i * 2 + t * 2));
            blob(g, p.x + ox, by + oy, br * sc * (.85 - u * .5), col);
          }
        }
        g.globalAlpha = 1;
        // a dark puff of smoke when it's spent
        if (k > .75) { g.globalAlpha = (1 - k) * 1.2; blob(g, p.x, by - br * 1.6, br * .9, 'rgba(40,20,14,.35)'); g.globalAlpha = 1; }
      }
      g.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        if (p.k !== 's') continue;
        const k = p.age / p.life; g.globalAlpha = (1 - k) * fade; g.fillStyle = HOT[(k * 3) | 0]; g.fillRect(p.x | 0, p.y | 0, 3, 3);
      }
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
