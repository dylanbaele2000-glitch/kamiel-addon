/* Kamiel films, part 3: see "cinema" in events.js for the building blocks (K).
   HOOG IN DE WOLKEN (film-wolk), DE RODE BAL (film-bal), WAAR IS SNOET? (film-snoet). */
(function () {
  const F = window.KamielFilms = window.KamielFilms || {};

  /* ---------- shared bits for the three films: pixel props, a pixel cloud, tears, wind, puffs ---------- */
  function kit(K) {
    const { W, H, FEET, fx, stop, rnd, lerp } = K;
    const T = {};
    T.cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // paint at low resolution (one canvas pixel = one art pixel), drawn big without smoothing: chunky pixels
    T.paint = (w, h, fn) => { const c = T.cv(w, h), g = c.getContext('2d'); fn((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }, g); return c; };
    T.px = (g, c, x, y, u) => { g.imageSmoothingEnabled = false; g.drawImage(c, Math.round(x), Math.round(y), Math.round(c.width * u), Math.round(c.height * u)); };
    // the same, centred on its bottom middle, turned by r
    T.pxAt = (g, c, x, y, u, r, flip) => { g.save(); g.translate(Math.round(x), Math.round(y)); if (r) g.rotate(r); if (flip) g.scale(-1, 1); T.px(g, c, -c.width * u / 2, -c.height * u, u); g.restore(); };
    // a puffy pixel cloud from circles [cx, cy, r], cut flat at the bottom
    T.cloud = (w, h, circ, bottom, pal) => {
      pal = pal || {};
      const ins = (x, y) => y <= bottom && y >= 0 && circ.some(c => (x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]) <= c[2] * c[2]);
      return T.paint(w, h, (r) => {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (!ins(x + .5, y + .5)) continue;
          const edge = !ins(x - .5, y + .5) || !ins(x + 1.5, y + .5) || !ins(x + .5, y - .5) || !ins(x + .5, y + 1.5);
          let own = circ[0], best = -1e9;
          for (const c of circ) { const d = c[2] - Math.hypot(x + .5 - c[0], y + .5 - c[1]); if (d > best) { best = d; own = c; } }
          const rel = (y + .5 - own[1]) / own[2];
          const col = edge ? (pal.edge || '#8e9ab8') : !ins(x + .5, y - 1.5) ? (pal.hi || '#ffffff') : y > bottom - 3 ? (pal.deep || '#b4bfd8')
            : rel > .45 ? (pal.shade || '#cdd5e8') : rel > .1 ? (pal.mid || '#e6ebf6') : (pal.white || '#f6f8ff');
          r(x, y, 1, 1, col);
        }
      });
    };
    // little props, all pixel art
    T.P = {
      crate: T.paint(18, 15, (r) => { r(0, 0, 18, 15, '#4a2e16'); r(1, 1, 16, 13, '#a8743e'); r(1, 1, 16, 1, '#c99456'); r(1, 5, 16, 1, '#7c5028'); r(1, 10, 16, 1, '#7c5028');
        r(1, 1, 2, 13, '#6e4622'); r(15, 1, 2, 13, '#6e4622'); for (let k = 0; k < 12; k++) r(3 + k, 13 - Math.floor(k * 12 / 12), 1, 1, '#6e4622');
        r(2, 2, 1, 1, '#2b1a0c'); r(15, 2, 1, 1, '#2b1a0c'); r(2, 12, 1, 1, '#2b1a0c'); r(15, 12, 1, 1, '#2b1a0c'); }),
      hay: T.paint(22, 12, (r) => { r(0, 1, 22, 11, '#8a6a1c'); r(1, 0, 20, 12, '#d9b44a'); r(1, 0, 20, 2, '#f0d27a');
        for (let k = 0; k < 14; k++) r(1 + (k * 7) % 20, 2 + (k * 5) % 9, 2, 1, k % 2 ? '#b8922e' : '#f0d27a');
        r(5, 0, 2, 12, '#7a4a20'); r(15, 0, 2, 12, '#7a4a20'); r(0, 11, 22, 1, '#6e5214'); r(0, 1, 1, 10, '#a8862a'); r(21, 1, 1, 10, '#a8862a'); }),
      cup: T.paint(9, 7, (r) => { r(1, 0, 6, 5, '#f4f0ea'); r(1, 0, 6, 1, '#ffffff'); r(1, 2, 6, 1, '#ff7aa8'); r(7, 1, 2, 1, '#e0dad2'); r(8, 1, 1, 3, '#e0dad2'); r(7, 3, 2, 1, '#e0dad2');
        r(2, 5, 4, 1, '#d8d0c6'); r(0, 6, 8, 1, '#c8beb2'); r(1, 0, 1, 5, '#e0dad2'); }),
      stool: T.paint(15, 13, (r) => { r(0, 0, 15, 3, '#c0392b'); r(0, 0, 15, 1, '#e8604c'); r(0, 2, 15, 1, '#8e2a20');
        r(1, 3, 2, 10, '#6e4622'); r(12, 3, 2, 10, '#6e4622'); r(6, 3, 2, 9, '#5a3a1e'); r(2, 8, 11, 1, '#7c5028'); }),
      tire: T.paint(18, 7, (r) => { r(1, 0, 16, 7, '#26262a'); r(0, 1, 18, 5, '#26262a'); r(2, 1, 14, 1, '#4a4a52'); r(4, 3, 10, 2, '#111114'); r(3, 6, 12, 1, '#151518'); }),
      books: T.paint(14, 11, (r) => { r(0, 7, 14, 4, '#2f6fb0'); r(0, 7, 14, 1, '#5a9ad8'); r(1, 10, 12, 1, '#f0ead8'); r(1, 3, 12, 4, '#c0392b'); r(1, 3, 12, 1, '#e8604c'); r(2, 6, 10, 1, '#f0ead8');
        r(2, 0, 10, 3, '#3a9a5a'); r(2, 0, 10, 1, '#62c07e'); r(3, 2, 8, 1, '#f0ead8'); }),
      apple: T.paint(7, 8, (r) => { r(3, 0, 1, 2, '#5a3a1e'); r(4, 0, 2, 1, '#4caf50'); r(1, 2, 5, 6, '#d22a2a'); r(0, 3, 7, 4, '#d22a2a'); r(1, 3, 2, 1, '#ff8a8a'); r(1, 7, 5, 1, '#9a1a1a'); r(6, 4, 1, 2, '#9a1a1a'); }),
      stone: T.paint(8, 6, (r) => { r(1, 0, 6, 6, '#8a8a92'); r(0, 1, 8, 4, '#8a8a92'); r(1, 1, 3, 1, '#b8b8c2'); r(1, 5, 6, 1, '#5a5a62'); r(7, 2, 1, 3, '#6a6a72'); r(4, 3, 1, 1, '#6a6a72'); }),
      carrot: T.paint(10, 4, (r) => { r(0, 1, 7, 2, '#f08a24'); r(1, 0, 5, 1, '#f08a24'); r(1, 3, 4, 1, '#c86a14'); r(6, 1, 1, 1, '#c86a14'); r(7, 0, 1, 1, '#4caf50'); r(8, 1, 2, 1, '#4caf50'); r(7, 2, 2, 2, '#3a8a3c'); r(2, 1, 1, 1, '#ffb060'); }),
      ball: T.paint(7, 7, (r) => { r(1, 0, 5, 7, '#e2343a'); r(0, 1, 7, 5, '#e2343a'); r(1, 1, 2, 2, '#ff9a9a'); r(0, 3, 7, 1, '#ffd23f'); r(1, 6, 5, 1, '#a8202a'); r(6, 2, 1, 3, '#a8202a'); }),
      balloon: T.paint(9, 11, (r) => { r(2, 0, 5, 1, '#e2343a'); r(1, 1, 7, 1, '#e2343a'); r(0, 2, 9, 4, '#e2343a'); r(1, 6, 7, 1, '#e2343a'); r(2, 7, 5, 1, '#c42830'); r(3, 8, 3, 1, '#a8202a');
        r(4, 9, 1, 1, '#a8202a'); r(3, 10, 3, 1, '#a8202a'); r(2, 2, 2, 2, '#ffb0b0'); r(2, 1, 1, 1, '#ffd0d0'); r(7, 3, 1, 3, '#a8202a'); }),
      bush: T.paint(30, 18, (r) => { const c = [[7, 11, 7], [15, 8, 8], [23, 11, 7], [11, 13, 6], [20, 13, 6]];
        const ins = (x, y) => y < 18 && c.some(q => (x - q[0]) * (x - q[0]) + (y - q[1]) * (y - q[1]) <= q[2] * q[2]);
        for (let y = 0; y < 18; y++) for (let x = 0; x < 30; x++) { if (!ins(x + .5, y + .5)) continue; const e = !ins(x - .5, y + .5) || !ins(x + 1.5, y + .5) || !ins(x + .5, y - .5);
          r(x, y, 1, 1, e ? '#1f4a22' : !ins(x + .5, y - 1.5) ? '#7cc46a' : y > 13 ? '#2f6a30' : ((x * 7 + y * 3) % 11 === 0 ? '#5aa04c' : '#3f8a3c')); }
        [[8, 7], [19, 5], [24, 10], [13, 11]].forEach(([x, y]) => { r(x, y, 2, 2, '#ff8ab8'); r(x, y, 1, 1, '#ffd0e4'); }); }),
      rock: T.paint(22, 12, (r) => { r(3, 1, 15, 11, '#7d7f8a'); r(1, 3, 20, 9, '#7d7f8a'); r(6, 0, 8, 1, '#7d7f8a'); r(3, 1, 8, 2, '#a5a8b4'); r(1, 3, 4, 2, '#a5a8b4');
        r(1, 10, 20, 2, '#55575f'); r(18, 4, 3, 6, '#62646d'); r(9, 5, 1, 3, '#55575f'); r(10, 7, 3, 1, '#55575f'); r(14, 2, 3, 1, '#c5c8d2'); r(0, 4, 1, 7, '#55575f'); r(21, 4, 1, 7, '#55575f'); }),
      log: T.paint(26, 10, (r) => { r(2, 1, 22, 9, '#6e4622'); r(2, 1, 22, 2, '#8e6232'); r(2, 8, 22, 2, '#4a2e16'); for (let k = 0; k < 5; k++) r(5 + k * 4, 3 + (k % 2) * 2, 3, 1, '#5a3a1e');
        r(0, 2, 4, 7, '#c99456'); r(1, 1, 2, 9, '#c99456'); r(1, 4, 2, 3, '#3a2210'); r(23, 2, 3, 7, '#4a2e16'); r(3, 0, 2, 1, '#4caf50'); r(12, 0, 3, 1, '#4caf50'); }),
      lamp: T.paint(9, 46, (r) => { r(1, 0, 7, 2, '#2a2a34'); r(2, 2, 5, 6, '#ffe9a8'); r(1, 2, 1, 6, '#2a2a34'); r(7, 2, 1, 6, '#2a2a34'); r(1, 8, 7, 1, '#2a2a34'); r(4, 9, 1, 34, '#2a2a34'); r(3, 9, 1, 34, '#3e3e4c');
        r(2, 42, 5, 2, '#2a2a34'); r(1, 44, 7, 2, '#2a2a34'); r(3, 3, 2, 2, '#ffffff'); }),
      door: T.paint(16, 28, (r) => { r(0, 0, 16, 28, '#3a1e3a'); r(1, 1, 14, 27, '#c86a9a'); r(2, 2, 12, 11, '#b05888'); r(2, 15, 12, 11, '#b05888'); r(3, 3, 10, 9, '#d87aa8'); r(3, 16, 10, 9, '#d87aa8');
        r(11, 14, 2, 2, '#ffd23f'); r(1, 1, 14, 1, '#f0a0c8'); }),
      butterfly: [T.paint(7, 5, (r) => { r(0, 0, 3, 2, '#ffb02e'); r(4, 0, 3, 2, '#ffb02e'); r(0, 2, 2, 2, '#ff7a2e'); r(5, 2, 2, 2, '#ff7a2e'); r(3, 0, 1, 5, '#2a1a10'); r(1, 0, 1, 1, '#2a1a10'); r(5, 0, 1, 1, '#2a1a10'); }),
        T.paint(7, 5, (r) => { r(1, 1, 2, 2, '#ffb02e'); r(4, 1, 2, 2, '#ffb02e'); r(2, 3, 1, 1, '#ff7a2e'); r(4, 3, 1, 1, '#ff7a2e'); r(3, 0, 1, 5, '#2a1a10'); })],
    };
    // the ground things of this world (the user's own elements), so they start loading now
    T.objs = () => { const pool = (K.A.OBJ || []).filter(o => o.kind === 'grond' && !o.sign && !o.tv && !o.board && !o.timer && o.size); pool.forEach(o => { try { void o.img; } catch (e) { } }); return pool; };
    T.ready = (o) => { try { return K.A.ready(o.img); } catch (e) { return false; } };
    // tears for a housemate (the emote is made for llamas)
    T.tears = (a, dur) => fx('screen', dur || 3, (g, age) => { if (a.alpha <= 0) return; const e = K.A.petPoint(a, 'eye'), f = a.face > 0 ? 1 : -1;
      for (let k = 0; k < 2; k++) { const p = (age * 1.3 + k / 2) % 1; g.globalAlpha = 1 - p * p; K.sprC(g, K.SP.drop, e.x + f * (k ? 3 : -2), e.y + 6 + 26 * p, 2.2); } g.globalAlpha = 1; });
    // a burst of square dust puffs
    T.puff = (x, y, n, col, spread, layer) => { let done = false;
      return K.particles(layer || 'front', { dur: 3, emit: (ps) => { if (done) return; done = true; for (let k = 0; k < n; k++) { const an = rnd() * Math.PI * 2, sp = (spread || 90) * (.35 + rnd() * .65);
        ps.push(K.P({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp * .45 - 25, life: .7 + rnd() * .8, sz: 6 + rnd() * 8 })); } },
        draw: (g, p, k) => { const s = Math.max(4, Math.round(p.sz * (1 + k) / 4) * 4); g.fillStyle = `rgba(${col || '230,220,200'},${.85 * (1 - k)})`; g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); } }); };
    // wind: streaks across the picture (o.a = strength 0..1, o.d = direction)
    T.wind = () => { const o = { a: 0, d: 1, s: [] }; for (let k = 0; k < 46; k++) o.s.push({ x: rnd() * W, y: 70 + rnd() * (H - 150), l: 30 + rnd() * 90, v: 500 + rnd() * 600 });
      o.f = fx('screen', 0, (g) => { if (o.a <= .01) return; g.fillStyle = `rgba(255,255,255,${.28 * Math.min(1, o.a)})`;
        o.s.forEach((s, i) => { if (i > o.s.length * Math.min(1, o.a)) return; s.x += o.d * s.v * K.dt * (.4 + o.a); if (s.x > W + 120) { s.x = -120; s.y = 70 + rnd() * (H - 150); } if (s.x < -120) { s.x = W + 120; s.y = 70 + rnd() * (H - 150); }
          g.fillRect(Math.round(s.x), Math.round(s.y + Math.sin(K.t * 3 + i) * 4), Math.round(s.l * (.5 + o.a * .5)), 2); }); });
      return o; };
    // a little "zoom" of film speed lines for slow motion: the picture gets dreamy
    T.slowIn = (look) => { K.flash(.5, '255,255,255', 3); K.setv('ab', .7, .3); K.setv('vig', 1, .4); if (look) K.grade(look, .5, .3); };
    T.slowOut = (look, s) => { K.setv('ab', 0, .6); K.setv('vig', .55, 1); if (look) K.grade(look, s === undefined ? .6 : s, .8); };
    // a freeze frame: flash, sepia, colour fringes; back to the look after
    T.freeze = function* (secs, look, s) { K.flash(1, '255,255,255', 1.6); K.grade('sepia', 1, .01); K.setv('ab', 1); yield* K.wait(secs); K.setv('ab', 0, .5); K.grade(look || null, s === undefined ? .6 : s, .5); };
    // the opening with the scene set up behind the black, so the first picture is already a composed shot
    T.opening = function* (title, sub, look, s, setup) {
      K.setv('bars', 1, 1.6); K.setv('vig', .55, 2); K.setv('grain', .6, 2); yield* K.wait(1.2);
      yield* K.card(title, sub, 3.6); if (setup) setup();
      // at night the world is already dark: lift the shadows a little so the film stays readable on the wall
      try { if (K.A.night && K.A.night()) K.over((g) => { g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(70,62,84,.24)'; g.fillRect(0, 0, W, H); }); } catch (e) { } if (look) K.grade(look, s === undefined ? 1 : s, .01); yield* K.setvW('black', 0, 2.2);
    };
    // a hook: runs every frame (an invisible effect)
    T.each = (fn) => fx('sky', 0, () => { try { fn(); } catch (e) { console.error(e); } });
    // a pet's walk animation while something else moves it
    T.walking = (a, on, rate) => { if (on) { a.lockPose = true; a.pose = 'walk'; a.rate = rate || 9; } else { a.lockPose = false; a.pose = 'stand'; } };
    // something small in a pet's mouth (o.on = false to drop it)
    T.carry = (a, cv, u) => { const o = { on: true, cv, u };
      o.f = fx('front', 0, (g) => { if (!o.on || a.alpha <= 0) return; const n = K.A.petPoint(a, 'nose'); T.pxAt(g, o.cv, n.x + (a.face > 0 ? 5 : -5), n.y + o.cv.height * o.u * .55, o.u, 0, a.face > 0); }); return o; };
    // a hard cut to another place of the world (d places further)
    T.goto = (d) => { K.A.setCam(K.A.center(d)); if (K.A.arrive) K.A.arrive(); };
    // things that belong to a spot in the world (they stay behind when the camera moves on): [{ wx, cv, u, y, flip, on }]
    T.props = (layer) => { const list = []; list.f = fx(layer || 'back', 0, (g) => { for (const p of list) { if (p.on === false) continue; const x = K.toScreen(p.wx); if (x < -300 || x > W + 300) continue;
      if (p.draw) p.draw(g, x); else T.pxAt(g, p.cv, x, p.y === undefined ? FEET + 8 : p.y, p.u || 4, p.r || 0, p.flip); } }); return list; };
    // a sunset: the sky turns violet and orange, a big striped pixel sun sinks behind the hills, everything gets warm
    const sunCv = T.paint(26, 26, (r) => { for (let y = 0; y < 26; y++) for (let x = 0; x < 26; x++) { const d = Math.hypot(x - 12.5, y - 12.5); if (d > 12.6) continue;
      if (y > 13 && (y % 4 === 0 || (y > 19 && y % 4 === 1))) continue;
      r(x, y, 1, 1, y < 6 ? '#fff3a0' : y < 11 ? '#ffd23f' : y < 16 ? '#ffa040' : y < 21 ? '#ff6a5a' : '#ff4a8a'); } });
    T.sunset = (sx, sy) => { const S = { x: sx, y: sy, a: 1 };
      S.sky = fx('sky', 0, (g) => { const gr = g.createLinearGradient(0, 40, 0, FEET); gr.addColorStop(0, `rgba(70,30,110,${.6 * S.a})`); gr.addColorStop(.55, `rgba(255,110,90,${.5 * S.a})`); gr.addColorStop(1, `rgba(255,190,110,${.6 * S.a})`);
        g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = S.a; const glow = g.createRadialGradient(S.x, S.y, 20, S.x, S.y, 260); glow.addColorStop(0, 'rgba(255,200,120,.55)'); glow.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = glow; g.fillRect(S.x - 260, S.y - 260, 520, 520); T.px(g, sunCv, S.x - 65, S.y - 65, 5); g.globalAlpha = 1; });
      S.warm = fx('screen', 0, (g) => { g.globalCompositeOperation = 'overlay'; g.fillStyle = `rgba(255,120,50,${.22 * S.a})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; });
      S.stop = () => { stop(S.sky); stop(S.warm); }; return S; };
    // a world x for a screen x in the next place (d further), so things are already there when we arrive
    T.wxNext = (sx, d) => K.A.center(d === undefined ? 1 : d) + sx - W / 2;
    return T;
  }

  /* =====================================================================================================
     HOOG IN DE WOLKEN — Dobby does a binky so big he lands on a cloud. The gang tries everything to get him
     down: jumping, a balloon, a tower of pets, and finally a crooked tower of things. About 7 minutes.
     ===================================================================================================== */
  F['film-wolk'] = { can: (K) => K.castNames().includes('dobby'), run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez, clamp } = K;
    const T = kit(K);
    const names = K.castNames(); if (!names.includes('dobby')) return;
    const pool = T.objs();
    const gang = {}; names.forEach(n => { gang[n] = K.pet(n, 1); gang[n].alpha = 0; });
    const G = (n) => gang[n] || null;
    const D = gang.dobby, others = names.filter(n => n !== 'dobby').map(n => gang[n]);
    const firstOf = (list) => { for (const n of list) if (gang[n]) return gang[n]; return null; };
    const LOOK = 'warm';

    /* ---- the cloud: big pixel art; Dobby sits in the little dip on top ---- */
    const cloudCv = T.cloud(100, 40, [[16, 28, 10], [29, 22, 12], [42, 17, 11], [50, 21, 10], [60, 16, 12], [74, 21, 12], [86, 28, 9], [40, 30, 10], [62, 30, 10], [26, 31, 8], [80, 31, 7]], 37);
    const lipCv = T.cloud(100, 40, [[45, 15, 3.6], [50, 16, 3.6], [55, 15, 3.6]], 40, { edge: '#eef2fa', hi: '#ffffff', shade: '#e6ebf6', mid: '#eef2fa' });
    const CL = { x: W + 260, y: 104, sq: 1, on: true, bob: 0 };
    const cTop = () => CL.y + 42 + CL.bob;   // where Dobby sits
    fx('back', 0, (g) => { if (!CL.on) return; CL.bob = Math.sin(K.t * .9) * 3; g.save(); g.translate(CL.x, CL.y + 160 + CL.bob); g.scale(1, CL.sq); T.px(g, cloudCv, -200, -160, 4); g.restore(); });
    fx('front', 0, (g) => { if (!CL.on || !ON.lip) return; g.save(); g.translate(CL.x, CL.y + 160 + CL.bob); g.scale(1, CL.sq); T.px(g, lipCv, -200, -160, 4); g.restore(); });

    /* ---- the balloon ---- */
    const BAL = { on: false, x: 0, y: 0, mode: 'nose', who: null, ax: 0, ay: 0 };
    const balAnchor = () => {
      if (BAL.mode === 'nose' && BAL.who) { const n = K.A.petPoint(BAL.who, 'nose'); return { x: n.x, y: n.y + 4 }; }
      if (BAL.mode === 'dobby') { const n = K.A.petPoint(D, 'head'); return { x: n.x + 4, y: n.y + 10 }; }
      if (BAL.mode === 'snag') return { x: CL.x + BAL.ax, y: CL.y + BAL.ay + CL.bob };
      return null;
    };
    fx('front', 0, (g) => { if (!BAL.on) return; const a = balAnchor(), bx = BAL.x + Math.sin(K.t * 1.7) * 4, by = BAL.y + Math.sin(K.t * 2.3) * 3;
      g.fillStyle = '#f4f0ea'; const ex = a ? a.x : bx + Math.sin(K.t * 2) * 8, ey = a ? a.y : by + 80;
      for (let k = 0; k <= 16; k++) { const p = k / 16; g.fillRect(Math.round(lerp(bx, ex, p) + Math.sin(p * 6 + K.t * 3) * 3 * (1 - p)), Math.round(lerp(by + 22, ey, p)), 2, 4); }
      T.pxAt(g, T.P.balloon, bx, by + 24, 4.4, Math.sin(K.t * 1.3) * .08); });

    /* ---- the tower of things: pieces stack in a crooked pile that sways ---- */
    const ST = { x: 392, base: FEET + 6, sway: 0, v: 0, k: 7, pieces: [], gust: 0, wild: false };
    const pieceH = (n) => { let h = 0; for (let i = 0; i < n && i < ST.pieces.length; i++) h += ST.pieces[i].h - ST.pieces[i].sink; return h; };
    const local2 = (dx, dy) => { const c = Math.cos(ST.sway), s = Math.sin(ST.sway); return { x: ST.x + dx * c - dy * s, y: ST.base + dx * s + dy * c }; };
    const topPt = (n) => { const p = ST.pieces[n - 1]; return local2(p ? p.dx : 0, -pieceH(n)); };
    const drawPiece = (g, p) => { if (p.cv) T.px(g, p.cv, -p.w / 2, -p.h, p.u); else if (T.ready(p.o)) g.drawImage(p.o.img, -p.w / 2, -p.h, p.w, p.h); };
    fx('back', 0, (g) => {
      g.save(); g.translate(ST.x, ST.base); g.rotate(ST.sway);
      let y = 0; for (const p of ST.pieces) { if (!p.loose) { g.save(); g.translate(p.dx, -y); g.rotate(p.r); drawPiece(g, p); g.restore(); } y += p.h - p.sink; }
      g.restore();
      for (const p of FREE) { if (!p.free) continue; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); drawPiece(g, p); g.restore(); }
    });
    const FREE = [];
    const mkPiece = (src, hh) => {
      if (src.cv) return { cv: src.cv, u: src.u, w: src.cv.width * src.u, h: src.cv.height * src.u, sink: src.sink || 4, dx: 0, r: 0, name: src.name };
      const h = hh, w = Math.min(130, h * src.size[0] / src.size[1]); return { o: src, w, h, sink: 8, dx: 0, r: 0, name: 'obj' };
    };

    /* ---- who is where (the hook keeps riders in place every frame) ---- */
    const ON = { kam: 0, kdx: 0, dob: 'cloud', ddx: 0, lip: true, bfx: 560 };
    T.each(() => {
      // the tower sways like a spring, pushed by the wind
      if (ST.pieces.length && !ST.wild) { const n = Math.sin(K.t * 1.4) * .6 + Math.sin(K.t * 3.7) * .4; ST.v += (-ST.k * ST.sway - 1.5 * ST.v + n * ST.gust) * K.dt; ST.sway += ST.v * K.dt; }
      if (ON.kam) { const t = topPt(ON.kam); kam.x = t.x - W / 2 + ON.kdx; kam.feet = t.y; kam.r = ST.sway; }
      if (ON.dob === 'cloud') { D.cx = CL.x + ON.ddx; D.feet = cTop() + 6; }
      else if (ON.dob === 'back') { const b = K.kp(ON.bfx, 470); D.cx = b.x; D.feet = b.y + 8; D.r = kam.r; }
    });

    const wnd = T.wind();
    const dobS = .8;   // Dobby is small: and far away up there
    const sitAll = () => others.forEach(a => hold(a, a.pet === 'pebbels' ? 'lie' : 'sit'));
    const look = (a, x) => { a.face = x > a.cx ? 1 : -1; };
    const lookUpAll = () => { others.forEach(a => look(a, CL.x)); kam.face = CL.x > K.kx() ? 1 : -1; };

    /* ================= DEEL 1: the binky ================= */
    const spots = { wifi: 180, snoet: 290, pippa: 770, pebbels: 870 };
    yield* T.opening('HOOG IN DE WOLKEN', 'EEN AVONTUUR MET DOBBY', LOOK, .55, () => {
      kam.x = -70; kam.face = 1; kam.eyes = 'blij';
      others.forEach(a => { a.alpha = 1; a.cx = spots[a.pet]; a.face = a.cx < W / 2 ? 1 : -1; hold(a, a.pet === 'wifi' || a.pet === 'pebbels' ? 'lie' : 'sit'); });
      D.alpha = 1; D.s = dobS; D.cx = 590; D.feet = FEET; D.face = -1; ON.dob = null; ON.lip = false; hold(D, 'down');
      K.lens({ z: 1.35, cx: 470, cy: 400 }, 0);
    });
    // a lazy afternoon. A cloud sails in.
    const cloudIn = (function* () { yield* tween(26, p => { CL.x = lerp(W + 260, 660, ez(p)); }); })();
    const life = (function* () {
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 6);
      emote('notes', 4); yield* wait(2);
      const nib = K.particles('front', { until: K.t + 6, emit: (ps) => { if (rnd() < .2) { const n = K.A.petPoint(D, 'nose'); ps.push(K.P({ x: n.x, y: FEET - 4, vx: (rnd() - .5) * 40, vy: -40, grav: 160, life: .6 })); } },
        draw: (g, p, k) => { g.fillStyle = `rgba(90,170,60,${1 - k})`; g.fillRect(Math.round(p.x), Math.round(p.y), 4, 3); } });
      yield* tween(5, p => { D.sq = 1 + Math.sin(p * 60) * .03; }); D.sq = 1; stop(nib);
      const sn = G('snoet'), wf = G('wifi');
      if (sn && wf) {   // Snoet licks Wifi awake
        hold(sn, null); yield* petTo(sn, wf.cx + 70, 110); sn.face = -1; hold(sn, 'down'); emote('hearts', 2.5, sn);
        yield* tween(2.2, p => { sn.sx = 1 + Math.sin(p * 40) * .06; }); sn.sx = 1; wf.eyes = 'groot'; yield* wait(.5); wf.eyes = ''; emote('dots', 1.5, wf);
        hold(sn, null); yield* petTo(sn, spots.snoet + 20, 90); sn.face = 1; hold(sn, 'sit');
      } else yield* wait(4);
      const pp = G('pippa'); if (pp) { hold(pp, 'paw'); yield* wait(2.4); hold(pp, 'sit'); }
    })();
    yield* par(cloudIn, life);
    // a small binky…
    yield* K.lensW({ z: 1.5, cx: D.cx, cy: FEET - 120 }, 2);
    const binky = function* (h, secs) { hold(D, 'jump'); yield* tween(secs, p => { D.lift = Math.sin(p * Math.PI) * h; D.r = Math.sin(p * Math.PI * 2) * .5; if (p > .5) D.face = 1; }); D.lift = 0; D.r = 0; D.face = -1; hold(D, 'down'); };
    hold(D, 'stand'); yield* wait(.6);
    yield* binky(40, .55); emote('hearts', 1.6, D); yield* wait(1.2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.4);
    const pb = G('pebbels'); if (pb) { pb.eyes = 'groot'; hold(pb, null); yield* petJump(pb, 30, .4); pb.eyes = ''; hold(pb, 'lie'); emote('angry', 1.4, pb); }
    yield* binky(90, .75); kam.eyes = 'blij'; emote('heart', 1.6); others.forEach(a => emote('heart', 1.4, a)); yield* wait(1.4);
    // … and the big one
    hold(D, 'down'); emote('sparks', 1.4, D);
    yield* K.lensW({ z: 2.2, cx: D.cx, cy: FEET - 70 }, 1.2);
    yield* tween(1.4, p => { D.sq = 1 - .22 * ez(p); D.sx = 1 + .12 * ez(p) + Math.sin(p * 70) * .02; });
    K.lens({ shake: 4 }, 0); yield* wait(.25); K.lens({ shake: 0 }, .3);
    D.sq = 1; D.sx = 1; hold(D, 'jump'); D.layer = 'front';
    const x0 = D.cx, apx = 650, apy = 40;
    T.puff(x0, FEET - 4, 10, '200,180,140', 70);
    yield* tween(.9, p => { const e = 1 - (1 - p) * (1 - p); D.cx = lerp(x0, apx, p); D.feet = lerp(FEET, apy + 80, e); D.r = p * Math.PI * 3;
      K.lens({ z: 2.2 - .6 * p, cx: D.cx, cy: D.feet - 40 }, 0); });
    D.r = Math.PI * .15;
    yield* T.freeze(2.4, LOOK, .55);   // frozen in the air, ears flying
    yield* tween(.75, p => { D.cx = lerp(apx, CL.x, p); D.feet = lerp(apy + 80, cTop() + 6, p * p); D.r = Math.PI * .15 * (1 - p) + p * Math.PI * 2;
      K.lens({ z: 1.6, cx: D.cx, cy: D.feet - 30 }, 0); });
    D.r = 0; ON.dob = 'cloud'; ON.ddx = 0; ON.lip = true; hold(D, 'down');
    T.puff(CL.x, cTop() + 10, 14, '255,255,255', 110);
    yield* tween(.6, p => { CL.sq = 1 - Math.sin(p * Math.PI) * .12; }); CL.sq = 1;
    yield* wait(.6);
    // below: what? where?
    yield* K.cut(() => { K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0); });
    kam.eyes = 'groot'; kam.face = -1; emote('?', 1.6); others.forEach(a => { hold(a, a.pet === 'pebbels' ? 'sit' : 'sit'); a.face = a.cx < 590 ? 1 : -1; emote('?', 1.6, a); });
    yield* wait(1.8); kam.face = 1; yield* wait(.8); kam.face = -1; yield* wait(.8);
    D.eyes = ''; hold(D, 'stand'); yield* wait(1.2);
    // Dobby peeks over the edge
    ON.ddx = -10;
    lookUpAll(); kam.head = -.35; kam.eyes = 'groot'; emote('!', 1.6); others.forEach(a => { a.eyes = 'groot'; emote('!', 1.4, a); });
    yield* wait(2.2);
    yield* K.lensW({ z: 2.4, cx: CL.x, cy: cTop() + 10 }, 2.4);
    D.face = -1; hold(D, 'stand'); yield* wait(1); D.face = 1; yield* wait(1); D.face = -1;
    yield* tween(1.6, p => { ON.ddx = lerp(-10, -70, p); T.walking(D, true, 5); }); T.walking(D, false); hold(D, 'down');
    D.eyes = 'groot'; emote('!', 1.4, D); yield* wait(1.2);
    // the long way down: the camera slides down with his eyes
    yield* K.lensW({ z: 2.2, cx: CL.x - 60, cy: 520, rot: .05 }, 4.5);
    yield* wait(1.2);
    yield* K.lensW({ z: 2.4, cx: CL.x - 60, cy: cTop() + 10, rot: 0 }, 1.2);
    yield* tween(1, p => { ON.ddx = lerp(-70, 0, p); T.walking(D, true, 14); }); T.walking(D, false); hold(D, 'down'); D.face = -1;
    let tz = T.tears(D, 7);
    yield* tween(3, p => { D.sx = 1 + Math.sin(p * 90) * .03; }); D.sx = 1;
    // a close-up on Kamiel, looking up
    yield* K.cut(() => { const h = K.kp(220, 260); K.lens({ z: 2.6, cx: h.x + 40, cy: h.y }, 0); kam.eyes = 'triest'; });
    emote('sweat', 3); yield* wait(3);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 2.5);
    yield* wait(1);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 2', 'DE POGINGEN', 2.6, { size: 44 });

    /* ================= DEEL 2: jumping, a balloon, a tower of pets ================= */
    stop(tz); D.eyes = 'groot'; kam.eyes = ''; kam.head = 0; others.forEach(a => { a.eyes = ''; });
    kam.x = 30; kam.face = 1;
    yield* K.fadeIn(1.6);
    // 1. Kamiel jumps
    yield* walkTo(CL.x - W / 2 - 30, 60); kam.face = 1; kam.head = -.35; yield* wait(.8);
    for (const [h, s] of [[40, .45], [75, .55], [115, .7]]) { yield* hop(h, s); yield* wait(.3); }
    kam.head = -.55; kam.sq = 1.08; yield* hop(120, .8); kam.sq = 1; kam.head = 0;
    K.lens({ shake: 3 }, 0); yield* wait(.2); K.lens({ shake: 0 }, .3);
    emote('sweat', 2); kam.eyes = 'triest'; yield* wait(1.6);
    yield* walkTo(-120, 70); kam.face = 1; kam.eyes = '';
    // 2. the dogs jump
    const dogs = others.filter(a => a.pet === 'wifi' || a.pet === 'snoet');
    for (const a of dogs) {
      hold(a, null); yield* petTo(a, CL.x - 40, K.PET[a.pet].run * 1.2); a.face = 1; hold(a, 'down'); yield* wait(.4);
      emote('burst', .5, a);
      if (a.pet === 'wifi') { yield* petJump(a, 150, .8); yield* petJump(a, 170, .85); }
      else { // Snoet spins higher and higher… and comes down on Pippa
        hold(a, 'jump'); yield* tween(.8, p => { a.lift = Math.sin(p * Math.PI) * 160; a.r = p * Math.PI * 2; }); a.r = 0; a.lift = 0;
        const pp = G('pippa');
        if (pp) { const x0 = a.cx, x1 = pp.cx; yield* tween(1, p => { a.lift = Math.sin(p * Math.PI) * 210; a.cx = lerp(x0, x1, p); a.r = -p * Math.PI * 2; }); a.r = 0; a.lift = 52;
          pp.sq = .6; pp.sx = 1.25; pp.eyes = 'groot'; K.lens({ shake: 4 }, 0); emote('stars', 2.4, pp); yield* wait(.3); K.lens({ shake: 0 }, .3); yield* wait(1.2);
          pp.sq = 1.1; pp.sx = .95; emote('angry', 2.5, pp); a.eyes = 'groot'; yield* petJump(a, 30, .4, x1 - 90); a.lift = 0; a.face = 1; emote('sweat', 2, a); pp.eyes = '';
          yield* wait(1.2); pp.sq = 1; pp.sx = 1; hold(pp, 'sit');
        } else { yield* tween(1, p => { a.lift = Math.sin(p * Math.PI) * 210; a.r = -p * Math.PI * 2; }); a.r = 0; a.lift = 0; }
      }
      hold(a, null); emote('dots', 1.5, a);
    }
    D.eyes = ''; T.tears(D, 3); yield* wait(2);
    // 3. a balloon, so he can float down
    const carrier = firstOf(['wifi', 'snoet', 'pebbels', 'pippa']);
    yield* K.cut(() => { kam.x = -150; kam.face = 1; });
    if (carrier) {
      emote('!', 1.2, carrier); yield* petTo(carrier, W + 90, K.PET[carrier.pet].run * 1.5); yield* wait(1.4);
      emote('dots', 2.2); yield* wait(1.8);
      BAL.on = true; BAL.mode = 'nose'; BAL.who = carrier;
      const follow = T.each(() => { if (BAL.mode === 'nose') { const n = K.A.petPoint(carrier, 'nose'); BAL.x = n.x + carrier.face * 10; BAL.y = n.y - 110; } });
      yield* petTo(carrier, CL.x - 140, K.PET[carrier.pet].run * .7); carrier.face = 1; hold(carrier, 'sit');
      emote('sparks', 1.4, carrier); kam.eyes = 'blij'; emote('!', 1.2); yield* wait(1.4);
      // let go…
      BAL.mode = 'free'; stop(follow); const bx0 = BAL.x, by0 = BAL.y;
      yield* par(tween(5, p => { BAL.x = lerp(bx0, CL.x - 120, ez(p)) + Math.sin(p * 9) * 14; BAL.y = lerp(by0, CL.y - 6, ez(p)); }),
        K.lensW({ z: 1.7, cx: CL.x - 100, cy: 240 }, 4));
      BAL.mode = 'snag'; BAL.ax = -120; BAL.ay = 34;   // caught on the cloud
      T.puff(CL.x - 120, CL.y + 34, 5, '255,255,255', 40);
      D.face = -1; D.eyes = 'groot'; emote('?', 1.6, D); yield* wait(1.6);
      // Dobby reaches out… the cloud wobbles… no.
      hold(D, 'stand'); yield* tween(1.2, p => { ON.ddx = lerp(0, -40, p); T.walking(D, true, 4); }); T.walking(D, false); hold(D, 'stand');
      yield* tween(.6, p => { CL.sq = 1 + Math.sin(p * Math.PI * 3) * .05; });
      emote('!', 1, D); yield* tween(.5, p => { ON.ddx = lerp(-40, 0, p); }); hold(D, 'down'); D.face = 1; T.tears(D, 3);
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.6);
      carrier.eyes = ''; emote('dots', 2, carrier); kam.eyes = 'triest'; yield* wait(2.2);
      hold(carrier, null);
    } else {   // no dog: a balloon comes floating by on the wind and gets stuck up there anyway
      BAL.on = true; BAL.mode = 'free'; BAL.x = -40; BAL.y = 260;
      yield* tween(6, p => { BAL.x = lerp(-40, CL.x - 120, p); BAL.y = lerp(260, CL.y - 6, p) + Math.sin(p * 10) * 10; }); BAL.mode = 'snag'; BAL.ax = -120; BAL.ay = 34; yield* wait(1.5);
    }
    // 4. a tower of pets
    const tow = ['pippa', 'pebbels', 'wifi', 'snoet'].map(n => gang[n]).filter(Boolean);
    if (tow.length >= 2) {
      const tx = CL.x - 70;
      yield* K.cut(() => { tow.forEach((a, i) => { hold(a, null); a.cx = tx + (i % 2 ? 1 : -1) * (110 + i * 30); a.face = a.cx < tx ? 1 : -1; a.lift = 0; }); kam.x = -220; kam.face = 1; });
      emote('sparks', 1.4, tow[0]); yield* petTo(tow[0], tx, 60); tow[0].face = 1; hold(tow[0], 'stand'); yield* wait(.5);
      const stack = [tow[0]];
      for (let i = 1; i < tow.length; i++) {
        const a = tow[i], h0 = stack.reduce((s, b) => s + 56 * b.s, 0);
        yield* petTo(a, tx + (a.cx < tx ? -70 : 70), 90); a.face = a.cx < tx ? 1 : -1;
        yield* petJump(a, h0 + 40, .55, tx); a.lift = h0; hold(a, 'stand'); a.face = 1; a.layer = 'front';
        stack.push(a); emote('sparks', .6, a); yield* tween(.8, p => { stack.forEach((b, j) => { b.cx = tx + Math.sin(p * Math.PI * 2) * j * 4; }); });
        if (a.pet === 'pippa') emote('angry', 1.4, stack[0]);
      }
      // so close: the top one stretches up, Dobby leans down
      const top = stack[stack.length - 1];
      yield* K.lensW({ z: 1.7, cx: tx + 40, cy: (top.feet - top.lift + cTop()) / 2 - 20 }, 1.8);
      hold(top, 'jump'); top.r = -.25; emote('!', 1.2, top);
      hold(D, 'stand'); D.face = -1; yield* tween(1.4, p => { ON.ddx = lerp(0, -55, p); T.walking(D, true, 4); }); T.walking(D, false); hold(D, 'down');
      yield* tween(3, p => { stack.forEach((b, j) => { b.cx = tx + Math.sin(K.t * 5 + j * .4) * j * 5 * (.4 + p); b.r = (b === top ? -.25 : 0) + Math.sin(K.t * 5) * .04 * j; }); });
      // a leaf drifts onto the nose of… the one who startles easily
      const pebT = stack.find(b => b.pet === 'pebbels') || stack[1];
      const leaf = { x: pebT.cx + 120, y: pebT.feet - pebT.lift - 260, on: true };
      const lf = fx('front', 0, (g) => { if (!leaf.on) return; g.fillStyle = '#d98a2b'; g.fillRect(Math.round(leaf.x + Math.sin(K.t * 3) * 12), Math.round(leaf.y), 10, 6); g.fillStyle = '#9a5a1a'; g.fillRect(Math.round(leaf.x + Math.sin(K.t * 3) * 12) + 3, Math.round(leaf.y) + 2, 4, 2); });
      yield* tween(2.6, p => { const n = K.A.petPoint(pebT, 'nose'); leaf.x = lerp(pebT.cx + 120, n.x - 6, p); leaf.y = lerp(pebT.feet - pebT.lift - 260, n.y - 6, p); stack.forEach((b, j) => { b.cx = tx + Math.sin(K.t * 5 + j * .4) * j * 5; }); });
      pebT.eyes = 'groot'; pebT.sx = 1.15; emote('!', 1, pebT); yield* wait(.3);
      leaf.on = false; stop(lf);
      // timber!
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .4);
      yield* tween(1.1, p => { stack.forEach((b, j) => { b.cx = tx - j * 60 * ez(p); b.lift = Math.max(0, b.lift * (1 - p * p)); b.r = -j * .35 * p; }); });
      K.lens({ shake: 5 }, 0); stack.forEach(b => { b.lift = 0; b.r = 0; b.sx = 1; b.layer = 'back'; hold(b, 'lie'); T.puff(b.cx, FEET - 6, 5, '200,180,140', 50); emote(['stars', 'dots', 'stars', 'sweat'][stack.indexOf(b) % 4], 2.4, b); });
      yield* wait(.4); K.lens({ shake: 0 }, .4);
      ON.ddx = 0; D.face = 1; T.tears(D, 4); yield* wait(2.6);
      stack.forEach(b => { b.eyes = ''; });
    }
    // dusk. Everyone is tired. Kamiel looks around… and gets an idea.
    K.grade('goud', .5, 4);
    yield* K.cut(() => { kam.x = -60; kam.face = 1; kam.head = 0; others.forEach((a, i) => { hold(a, 'lie'); a.cx = [170, 260, 790, 880][i]; a.face = a.cx < W / 2 ? 1 : -1; a.layer = 'back'; }); }, .6);
    kam.eyes = 'triest'; emote('dots', 3); yield* wait(3.2);
    K.lens({ z: 1.6, cx: K.kx(), cy: FEET - 150 }, 3); yield* wait(1.5);
    kam.face = -1; yield* wait(1.2); kam.face = 1; kam.head = .2; yield* wait(1.4);
    kam.eyes = 'groot'; kam.head = -.1; emote('!', 1.4); K.flash(.5, '255,240,200', 3); emote('sparks', 2.2); yield* wait(2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 3', 'DE BOUW', 2.6, { size: 44 });

    /* ================= DEEL 3: building a tower of things ================= */
    K.grade(LOOK, .55, .01);
    const objs = pool.filter(o => T.ready(o)).sort(() => rnd() - .5);
    const S = (cv, u, name, sink) => ({ cv, u, name, sink: sink || 4 });
    const plan = [S(T.P.crate, 4.4, 'crate'), objs[0] || S(T.P.tire, 4.6, 'tire'), S(T.P.hay, 4, 'hay'), S(T.P.cup, 3.6, 'cup', 2), objs[1] || S(T.P.books, 4.4, 'books'), S(T.P.stool, 4.2, 'stool')];
    const dxs = [0, 14, -12, 8, -6, 10], rs = [0, .05, -.06, .08, -.05, .04];
    const pieces = plan.map((src, i) => { const p = mkPiece(src, src.cv ? 70 : 100); p.dx = dxs[i]; p.r = rs[i]; return p; });
    const crews = [['wifi'], ['pippa', 'pebbels'], ['snoet', 'wifi'], ['snoet'], ['wifi', 'snoet', 'pippa', 'pebbels'], ['pebbels', 'pippa']];
    others.forEach(a => { hold(a, null); a.alpha = 1; a.r = 0; a.lift = 0; a.eyes = ''; });
    kam.x = ST.x - W / 2 - 130; kam.face = 1; kam.eyes = ''; kam.head = 0;
    yield* K.fadeIn(1.2);
    // Kamiel shows them the spot: here.
    yield* walkTo(ST.x - W / 2 - 40, 40); kam.face = -1; kam.head = .35; yield* wait(.6); kam.head = 0; emote('!', 1.2);
    others.forEach(a => { a.cx = a.cx < W / 2 ? -80 : W + 80; });
    yield* walkTo(ST.x - W / 2 - 150, 50); kam.face = 1;
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      let crew = crews[i].map(n => gang[n]).filter(Boolean); if (!crew.length) crew = others.slice(0, 1);
      const side = i % 2 ? -1 : 1;   // they come from alternating sides
      const drop = ST.x + side * 150;
      // the delivery: a low shot following the thing along the ground
      p.free = true; p.x = side > 0 ? W + p.w : -p.w; p.y = ST.base; p.rot = 0; FREE.push(p);
      yield* K.cut(() => { K.lens({ z: 1.5, cx: p.x, cy: FEET - 110 }, 0); crew.forEach((a, j) => { a.cx = p.x + side * (p.w / 2 + 30 + j * 46); a.face = -side; a.layer = 'front'; a.alpha = 1; }); }, .5);
      const pushers = crew.length ? crew : [];
      let x = p.x, napped = false;
      while (Math.abs(x - drop) > 2) {
        const step = Math.min(Math.abs(x - drop), p.name === 'cup' ? 400 : 150);
        pushers.forEach(a => T.walking(a, true, 6));
        yield* tween(p.name === 'cup' ? .9 : 1.5, (q) => { const nx = x - side * step * K.dt / (p.name === 'cup' ? .9 : 1.5); x = side > 0 ? Math.max(drop, nx) : Math.min(drop, nx); p.x = x; p.rot = Math.sin(K.t * 9) * .03;
          pushers.forEach((a, j) => { a.cx = x + side * (p.w / 2 + 30 + j * 46); }); K.lens({ cx: x, cy: FEET - 110, z: 1.5 }, 0); });
        pushers.forEach(a => { T.walking(a, false); hold(a, 'down'); emote('sweat', .9, a); });
        // a nap on the way (Pebbels), and a nudge from Pippa
        if (!napped && i === 1 && G('pebbels') && G('pippa')) { napped = true; const pb2 = G('pebbels'), pp = G('pippa'); hold(pb2, 'sleep'); const zz = emote('zzz', 4, pb2); yield* wait(3);
          pp.face = pp.cx < pb2.cx ? 1 : -1; emote('angry', 1.4, pp); yield* petJump(pp, 16, .25); stop(zz); pb2.eyes = 'groot'; yield* petJump(pb2, 30, .35); pb2.eyes = ''; pb2.face = -side; }
        yield* wait(.5); pushers.forEach(a => hold(a, null));
      }
      p.rot = 0;
      if (p.name === 'cup') {   // Snoet brings… a teacup. Very proud.
        const sn = pushers[0]; if (sn) { hold(sn, 'sit'); sn.face = -side; emote('sparks', 1.6, sn); }
        yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .8); kam.eyes = 'groot'; kam.face = 1; emote('dots', 2.4); yield* wait(2.4);
        kam.eyes = 'blij'; emote('heart', 1.4); yield* wait(1);
      } else yield* K.lensW({ z: 1.15, cx: ST.x + 60, cy: FEET - 200 }, .8);
      // up it goes: Kamiel tosses it on top with his head
      yield* walkTo(drop + side * (p.w / 2 + 60) - W / 2, 90); kam.face = -side;
      kam.head = .4; yield* wait(.4); kam.head = -.4;
      const fx0 = p.x, fy0 = p.y, ty = ST.base - pieceH(ST.pieces.length), tx = ST.x + p.dx;
      yield* tween(.9, q => { p.x = lerp(fx0, tx, q); p.y = lerp(fy0, ty, q) - Math.sin(q * Math.PI) * 120; p.rot = q * Math.PI * 2 * (side > 0 ? -1 : 1) + p.r * q; });
      p.free = false; FREE.splice(FREE.indexOf(p), 1); ST.pieces.push(p); ST.v += (i % 2 ? -1 : 1) * (.25 + i * .05);
      T.puff(tx, ty, 6, '230,220,200', 50); kam.head = 0;
      // everyone holds their breath
      others.forEach(a => { a.eyes = 'groot'; }); kam.eyes = 'groot';
      yield* wait(2.2); others.forEach(a => { a.eyes = ''; }); kam.eyes = 'blij'; emote('sparks', 1.2); crew.forEach(a => emote('heart', 1.2, a));
      yield* wait(.6); kam.eyes = '';
      crew.forEach(a => { a.layer = 'back'; });
      if (i === 2) {   // Heidi walks by, chewing. She looks at the tower. She does not care.
        const hd = K.heidi(-1, { eyes: 'vies' }); hd.cx = -140;
        yield* K.actorTo(hd, ST.x - 40, 45); hd.face = 1; hd.lockPose = true; hd.pose = 'stand';
        yield* tween(2.4, q => { hd.sq = 1 + Math.sin(q * 30) * .015; hd.head = -.15 * Math.sin(q * Math.PI); });
        emote('dots', 2, hd); kam.face = -1; kam.eyes = 'blij'; emote('heart', 1.2); yield* wait(1.6);
        hd.lockPose = false; hd.face = -1; yield* tween(1.6, q => { hd.sq = 1 + Math.sin(q * 30) * .015; }); kam.eyes = 'triest';
        yield* K.actorTo(hd, W + 160, 55); hd.alpha = 0; kam.face = 1; emote('dots', 1.6); yield* wait(1);
      }
    }
    // the whole thing, from the bottom to the cloud
    yield* K.cut(() => { others.forEach((a, i) => { a.cx = ST.x + 120 + i * 60; a.face = -1; hold(a, 'sit'); a.layer = 'back'; }); kam.x = ST.x - W / 2 - 150; kam.face = 1; K.lens({ z: 2, cx: ST.x + 40, cy: FEET - 60 }, 0); }, .6);
    yield* K.lensW({ z: 2, cx: ST.x + 120, cy: 150 }, 6);
    D.eyes = 'groot'; emote('!', 1.4, D); hold(D, 'stand'); yield* wait(1.6); emote('heart', 1.6, D); yield* wait(1.2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 2);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 4', 'DE REDDING', 2.6, { size: 44 });

    /* ================= DEEL 4: up, the jump, the fall ================= */
    K.grade('goud', .45, .01);
    wnd.a = .25; ST.gust = .15;
    const leaves = K.weather('leaves', .5);
    yield* K.fadeIn(1.4);
    yield* wait(1);
    // Kamiel climbs, piece by piece
    others.forEach(a => { a.face = -1; hold(a, 'sit'); });
    kam.feet = FEET; kam.face = 1;
    for (let n = 1; n <= ST.pieces.length; n++) {
      const from = { x: kam.x, f: kam.feet }, t = topPt(n);
      kam.head = -.2; kam.sq = .9; yield* wait(.25); kam.sq = 1; ON.kam = 0;
      yield* tween(.6, q => { kam.x = lerp(from.x, t.x - W / 2, q); kam.feet = lerp(from.f, t.y, q) - Math.sin(q * Math.PI) * 50; });
      ON.kam = n; ON.kdx = 0; kam.head = 0; ST.v += (n % 2 ? .3 : -.3);
      if (n === 2) { others.forEach(a => { a.eyes = 'groot'; }); const pp = G('pippa'); if (pp) { hold(pp, 'lie'); emote('sweat', 2, pp); } }
      if (n === 4) { emote('sweat', 1.6); yield* K.lensW({ z: 1.3, cx: t.x, cy: t.y - 60 }, 1); }
      yield* wait(n === ST.pieces.length ? .4 : .9);
    }
    kam.face = 1; kam.eyes = 'groot';
    yield* K.lensW({ z: 1.9, cx: (K.kx() + CL.x) / 2 - 20, cy: cTop() + 10 }, 1.8);
    // at the top: a long neck, a frightened rabbit
    kam.head = -.3; kam.eyes = 'blij'; yield* wait(1);
    hold(D, 'stand'); D.face = -1; yield* tween(1.6, p => { ON.ddx = lerp(0, -70, p); T.walking(D, true, 4); }); T.walking(D, false); hold(D, 'down');
    D.eyes = 'groot'; emote('sweat', 2, D);
    for (let k = 0; k < 3; k++) { D.face = 1; yield* wait(.25); D.face = -1; yield* wait(.25); }   // no no no
    kam.blush = true; emote('heart', 2.4); yield* wait(2);
    yield* K.lensW({ z: 2.6, cx: CL.x - 70, cy: cTop() - 20 }, 1.4);
    D.eyes = ''; yield* wait(.8); emote('!', 1.4, D); hold(D, 'down'); D.sq = .85; yield* wait(.8); D.sq = 1;
    // SLOW MOTION: the jump
    T.slowIn('magie');
    yield* K.lensW({ z: 2, cx: (K.kx() + CL.x - 70) / 2, cy: cTop() + 20 }, .6);
    ON.dob = null; ON.lip = false; hold(D, 'jump'); D.layer = 'front';
    const sparkle = K.particles('front', { until: K.t + 3.6, emit: (ps) => { if (rnd() < .4) ps.push(K.P({ x: D.cx, y: D.feet - 30, vx: (rnd() - .5) * 30, vy: (rnd() - .5) * 30, life: 1.4 })); },
      draw: (g, p, k) => { g.globalAlpha = 1 - k; K.sprC(g, K.SP.spark, p.x, p.y, 2.4); g.globalAlpha = 1; } });
    const jx0 = D.cx, jy0 = D.feet;
    yield* tween(3.6, p => { const b = K.kp(ON.bfx, 470); D.cx = lerp(jx0, b.x, p); D.feet = lerp(jy0, b.y + 8, p) - Math.sin(p * Math.PI) * 70; D.r = -Math.sin(p * Math.PI) * .5;
      others.forEach(a => { a.eyes = 'groot'; }); });
    ON.dob = 'back'; D.r = 0; hold(D, 'down');
    T.slowOut('goud', .45); K.flash(.6, '255,240,200', 2);
    kam.eyes = 'blij'; kam.blush = false; emote('hearts', 2.6); emote('hearts', 2.4, D); kam.head = 0;
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.5);
    others.forEach(a => { a.eyes = ''; hold(a, null); });
    yield* par(...others.map(a => (function* () { yield* wait(rnd() * .4); yield* petJump(a, 30, .4); emote('heart', 1.4, a); yield* petJump(a, 24, .35); })()));
    // the cloud sails on, and lets go of the balloon
    const cloudOut = (function* () { yield* wait(1.5); if (BAL.on) BAL.mode = 'free';
      const bx = BAL.x, by = BAL.y; yield* tween(7, p => { CL.x = lerp(660, W + 320, ez(p)); if (BAL.on) { BAL.x = lerp(bx, 470, p); BAL.y = lerp(by, 90, p); } }); CL.on = false; })();
    // a gust
    const gust = (function* () { yield* wait(2.5); wnd.a = 1; ST.gust = 1.6; K.lens({ shake: 1.5 }, 0); others.forEach(a => { a.eyes = 'groot'; emote('!', 1.4, a); }); kam.eyes = 'groot'; emote('sweat', 3);
      yield* tween(5, p => { ST.gust = 1.6 + p * 2.4; }); })();
    yield* par(cloudOut, gust);
    // the teacup slips out
    const cup = ST.pieces.find(p => p.name === 'cup') || ST.pieces[Math.min(3, ST.pieces.length - 1)];
    const cupN = ST.pieces.indexOf(cup);
    K.lens({ shake: 0 }, .2);
    yield* K.lensW({ z: 2.6, cx: local2(cup.dx, -pieceH(cupN)).x, cy: local2(cup.dx, -pieceH(cupN)).y - 20 }, .8);
    cup.r0 = cup.r; yield* tween(1.2, p => { cup.dx = lerp(8, 30, p * p); cup.r = lerp(cup.r0, .4, p); });
    yield* wait(.3);
    emote('!', 1.2); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .5);
    // SLOW MOTION: everything comes down
    T.slowIn('koud');
    ST.wild = true; wnd.a = .6;
    const abs = ST.pieces.map((p, i) => { const c = local2(p.dx, -pieceH(i)); return { p, x: c.x, y: c.y, r: ST.sway + p.r, vx: (i - cupN) * 30 + (rnd() - .5) * 40 + (i === cupN ? 260 : 0), vr: (rnd() - .5) * 2 }; });
    ST.pieces.forEach(p => { p.loose = true; });
    abs.forEach(q => { q.p.free = true; q.p.x = q.x; q.p.y = q.y; q.p.rot = q.r; FREE.push(q.p); });
    ON.kam = 0; const kx0 = kam.x, kf0 = kam.feet;
    BAL.mode = 'free';
    const bal0 = { x: BAL.x, y: BAL.y };
    let grabbed = false;
    yield* tween(3.4, p => {
      abs.forEach(q => { q.p.x = q.x + q.vx * p * 1.2; q.p.y = Math.min(ST.base, q.y + 200 * p * p * (1 + (q.y < 300 ? 1 : 0))); q.p.rot = q.r + q.vr * p; });
      kam.x = kx0 + 50 * p; kam.feet = kf0 + (FEET - 40 - kf0) * p * p * .5; kam.r = p * .9;
      // Dobby is flung up, towards the balloon
      if (!grabbed) { const b = K.kp(ON.bfx, 470); const t = Math.min(1, p * 1.4); D.cx = lerp(b.x, BAL.x, t); D.feet = lerp(b.y + 8, BAL.y + 150, t) - Math.sin(t * Math.PI) * 40; D.r = t * Math.PI * 2; if (p === 1 || t >= 1) { grabbed = true; } }
      if (ON.dob === 'back') { ON.dob = null; hold(D, 'jump'); }
      BAL.x = bal0.x + Math.sin(p * 4) * 6; BAL.y = bal0.y + p * 10;
    });
    BAL.mode = 'dobby'; D.r = 0; hold(D, 'stand');
    yield* T.freeze(2.2, 'koud', .5);   // he's got it
    T.slowOut(LOOK, .5);
    // and the rest falls, for real
    const kx1 = kam.x, kf1 = kam.feet, kr1 = kam.r;
    yield* tween(.55, p => { kam.x = kx1 + 30 * p; kam.feet = lerp(kf1, FEET - 46, p * p); kam.r = lerp(kr1, Math.PI / 2, p);
      abs.forEach(q => { q.p.y = lerp(q.p.y, ST.base, p * p); q.p.rot = q.p.rot * (1 - p * .1); }); });
    abs.forEach(q => { q.p.y = ST.base; q.p.rot = Math.round(q.p.rot / (Math.PI / 2)) * (Math.PI / 2) * .1 + (rnd() - .5) * .3; T.puff(q.p.x, ST.base - 10, 4, '200,180,140', 60); });
    K.lens({ shake: 9 }, 0); T.puff(K.kx() + 110, FEET - 20, 22, '200,180,140', 160); kam.eyes = 'spiraal'; emote('stars', 4);
    others.forEach(a => { a.eyes = 'groot'; hold(a, null); });
    yield* par(...others.map(a => petJump(a, 50, .45, a.cx + 80)));
    K.lens({ shake: 0 }, .8); wnd.a = 0; ST.gust = 0; K.stop(leaves);
    const dust = K.weather('dust', .4);
    yield* wait(2);
    // quiet. Is he… ? Where is Dobby?
    yield* par(...others.map((a, i) => petTo(a, K.kx() - 90 - i * 44, K.PET[a.pet].run)));
    others.forEach(a => { a.face = 1; hold(a, 'down'); });
    const wf2 = G('wifi') || others[0]; if (wf2) T.tears(wf2, 4);
    yield* wait(2.4);
    others.forEach(a => { hold(a, 'sit'); emote('?', 1.6, a); }); yield* wait(1.4);
    others.forEach(a => { a.face = -1; }); yield* wait(1); others.forEach(a => { a.face = 1; }); yield* wait(1);
    const spotter = G('pippa') || others[0];
    if (spotter) { spotter.eyes = 'groot'; emote('!', 1.6, spotter); }
    K.stop(dust);
    // up there: Dobby, under a red balloon, coming down like a feather
    K.grade('goud', .7, 2);
    const glow = K.over((g, age, lp) => { const q = lp({ x: D.cx, y: D.feet - 60 }); const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 160); gr.addColorStop(0, 'rgba(255,220,150,.25)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(q.x - 160, q.y - 160, 320, 320); });
    const dx0 = D.cx, dy0 = D.feet, land = { x: K.kx() + 120, y: FEET - 96 };
    BAL.mode = 'dobby';
    const follow2 = T.each(() => { const h = K.A.petPoint(D, 'head'); BAL.x = h.x + 6; BAL.y = h.y - 120; });
    yield* K.lensW({ z: 1.9, cx: D.cx, cy: D.feet - 40 }, 2);
    yield* tween(9, p => { D.cx = lerp(dx0, land.x, ez(p)) + Math.sin(p * 10) * 30 * (1 - p); D.feet = lerp(dy0, land.y, p); D.r = Math.sin(p * 10) * .12 * (1 - p);
      K.lens({ z: 1.9 - .7 * p, cx: D.cx, cy: D.feet - 40 + 60 * p }, 0); });
    D.r = 0; hold(D, 'down'); emote('heart', 1.4, D);
    yield* wait(1);
    // he wakes up
    kam.eyes = 'groot'; yield* wait(1); kam.eyes = 'blij'; emote('hearts', 3); emote('hearts', 3, D);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.5);
    stop(follow2); BAL.mode = 'free'; const bx2 = BAL.x, by2 = BAL.y;
    const balAway = (function* () { yield* tween(6, p => { BAL.x = bx2 + p * 120; BAL.y = by2 - p * 420; }); BAL.on = false; })();
    const getUp = (function* () { const d0 = { x: D.cx, f: D.feet }; hold(D, 'jump'); yield* tween(.5, p => { D.cx = lerp(d0.x, K.kx() + 170, p); D.feet = lerp(d0.f, FEET, p) - Math.sin(p * Math.PI) * 40; }); hold(D, null); D.face = 1;
      yield* tween(1, p => { kam.r = lerp(Math.PI / 2, 0, ez(p)); kam.feet = lerp(FEET - 46, FEET, ez(p)); }); kam.feet = null; kam.r = 0; kam.face = 1; })();
    yield* par(balAway, getUp);
    stop(glow);
    // everyone piles in
    others.forEach(a => { a.eyes = ''; hold(a, null); });
    yield* par(...others.map((a, i) => petTo(a, D.cx + (i % 2 ? 1 : -1) * (60 + i * 26), K.PET[a.pet].run)));
    others.forEach(a => { look(a, D.cx); emote('hearts', 3, a); }); kam.eyes = 'blij'; kam.blush = true;
    const sn2 = G('snoet'); if (sn2) { hold(sn2, 'down'); yield* tween(2, p => { sn2.sx = 1 + Math.sin(p * 40) * .06; }); sn2.sx = 1; hold(sn2, null); } else yield* wait(2);
    yield* par(hop(30, .4), ...others.map(a => petJump(a, 26, .4)));
    yield* wait(1.4);
    yield* K.fadeOut(1.6);

    /* ================= epilogue: sunset ================= */
    FREE.forEach(p => { p.free = false; }); ST.pieces = [];
    K.grade('warm', .6, .01); K.setv('vig', .8, .01); const sunset = T.sunset(740, 400);
    kam.x = 20; kam.face = -1; kam.blush = false; kam.eyes = 'dicht'; kam.r = 0;
    D.cx = W / 2 - 60; D.feet = FEET; D.face = 1; D.s = dobS; hold(D, 'down'); D.layer = 'front';
    others.forEach((a, i) => { a.cx = [170, 270, 680, 780][i]; a.face = a.cx < W / 2 ? 1 : -1; hold(a, i % 2 ? 'lie' : 'sit'); a.layer = 'back'; });
    // a far little cloud on the evening sky
    CL.on = true; CL.x = -200; CL.y = 80;
    const farCl = fx('sky', 0, (g) => { T.px(g, cloudCv, CL.x - 100, 90, 2); });
    CL.on = false;
    yield* K.fadeIn(2.2);
    const drift = (function* () { yield* tween(24, p => { CL.x = lerp(-200, W + 200, p); }); })();
    const end = (function* () {
      yield* wait(2.5); kam.eyes = 'blij'; emote('notes', 3); yield* wait(3);
      // a little binky…
      hold(D, 'stand'); yield* wait(.6); hold(D, 'jump'); D.lift = 0;
      yield* tween(.35, p => { D.lift = Math.sin(p * Math.PI * .5) * 30; });
      kam.eyes = 'x'; emote('!', 1.4); others.forEach(a => { a.eyes = 'groot'; emote('!', 1.2, a); });
      yield* par(tween(.35, p => { D.lift = 30 * (1 - p); }), ...others.map(a => petJump(a, 40, .45, D.cx + (a.cx < D.cx ? -40 : 40))));
      D.lift = 0; hold(D, 'down');
      // a pile of pets on top of a very small rabbit
      others.forEach((a, i) => { hold(a, 'lie'); a.layer = 'front'; a.cx = D.cx + (i - 1.5) * 34; a.lift = (i % 2) * 20; });
      K.lens({ shake: 3 }, 0); yield* wait(.3); K.lens({ shake: 0 }, .3); yield* wait(1.2);
      D.layer = 'front'; hold(D, 'jump'); yield* tween(.5, p => { D.lift = Math.sin(p * Math.PI) * 50; D.cx += 60 * K.dt; }); D.lift = 0; hold(D, 'stand'); emote('?', 1.8, D);
      others.forEach(a => { a.eyes = ''; a.lift = 0; emote('sweat', 1.8, a); }); kam.eyes = 'blij'; emote('notes', 3); yield* wait(2.6);
      others.forEach(a => { hold(a, 'sit'); emote('hearts', 2, a); }); emote('hearts', 2.4, D);
      yield* K.lensW({ z: 1.5, cx: W / 2, cy: 200 }, 4);
      D.face = 1; yield* wait(2);
    })();
    yield* par(drift, end, tween(24, p => { sunset.y = 400 + p * 90; }));
    stop(farCl);
    yield* K.ending('EINDE');
  } };
  /* =====================================================================================================
     DE RODE BAL — Wifi's red ball flies off much too far. The whole gang searches high and low, through
     day, rain and night, finds the wrong balls, follows the trail… and finds it in Heidi's mouth. About 7 minutes.
     ===================================================================================================== */
  F['film-bal'] = { can: (K) => K.castNames().includes('wifi'), run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez, clamp } = K;
    const T = kit(K);
    const names = K.castNames(); if (!names.includes('wifi')) return;
    const gang = {}; names.forEach(n => { gang[n] = K.pet(n, 1); gang[n].alpha = 0; });
    const G = (n) => gang[n] || null;
    const WF = gang.wifi, others = names.filter(n => n !== 'wifi').map(n => gang[n]), all = names.map(n => gang[n]);
    const LOOK = 'warm';
    const look = (a, x) => { a.face = x > a.cx ? 1 : -1; };
    const SIT = (a) => a.pet === 'dobby' ? 'up' : 'sit';

    /* ---- the ball: in a mouth, in Heidi's mouth, or flying free (x, y = the bottom of the ball on screen) ---- */
    const BALL = { on: true, mode: 'nose', who: WF, x: 0, y: FEET, spin: 0, u: 3 };
    let HD = null;
    const ballPos = () => {
      if (BALL.mode === 'nose' && BALL.who) { const n = K.A.petPoint(BALL.who, 'nose'); return { x: n.x + (BALL.who.face > 0 ? 6 : -6), y: n.y + 14 }; }
      if (BALL.mode === 'heidi' && HD) { const m = K.A.llamaPoint(HD, 70, 355); return { x: m.x, y: m.y + 14 }; }
      return { x: BALL.x, y: BALL.y };
    };
    fx('front', 0, (g) => { if (!BALL.on) return; const p = ballPos(); BALL.sx = p.x; BALL.sy = p.y;
      if (BALL.mode === 'free' && p.y > FEET - 200) { const k = clamp(1 - (FEET - p.y) / 200, .2, 1); g.fillStyle = `rgba(0,0,0,${.2 * k})`; g.fillRect(Math.round(p.x - 10 * k), FEET + 2, Math.round(20 * k), 4); }
      T.pxAt(g, T.P.ball, p.x, p.y, BALL.u, BALL.spin); });
    const freeBall = () => { const p = ballPos(); BALL.mode = 'free'; BALL.x = p.x; BALL.y = p.y; };
    const ballArc = function* (x1, y1, secs, h, spin) { freeBall(); const x0 = BALL.x, y0 = BALL.y;
      yield* tween(secs, p => { BALL.x = lerp(x0, x1, p); BALL.y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * h; BALL.spin += (spin || 8) * K.dt; }); };
    const ballRoll = function* (x1, secs, h0, n) { freeBall(); const x0 = BALL.x, y0 = BALL.y;
      yield* tween(secs, p => { const e = 1 - (1 - p) * (1 - p); BALL.x = lerp(x0, x1, e); const ph = p * n, k = Math.floor(ph); BALL.y = lerp(y0, FEET, Math.min(1, p * 4)) - Math.abs(Math.sin(ph * Math.PI)) * h0 * Math.pow(.5, k); BALL.spin += 10 * K.dt * (1 - p) * Math.sign(x1 - x0); });
      BALL.y = FEET; };
    // everyone's eyes follow the ball (like at a tennis match)
    let watchBall = false;
    T.each(() => { if (!watchBall || BALL.sx === undefined) return; all.forEach(a => { if (a.watch !== false && Math.abs(BALL.sx - a.cx) > 20 && !a.busy) a.face = BALL.sx > a.cx ? 1 : -1; }); });

    /* ================= the ball flies away ================= */
    const spots = { snoet: 170, pippa: 260, dobby: 790, pebbels: 880 };
    yield* T.opening('DE RODE BAL', 'EEN ZOEKTOCHT MET WIFI', LOOK, .5, () => {
      kam.x = -60; kam.face = 1;
      WF.alpha = 1; WF.cx = 660; WF.face = -1; hold(WF, 'sit');
      others.forEach(a => { a.alpha = 1; a.cx = spots[a.pet]; a.face = a.cx < W / 2 ? 1 : -1; hold(a, a.pet === 'pebbels' ? 'lie' : SIT(a)); });
      K.lens({ z: 2.2, cx: 640, cy: FEET - 70 }, 0);
    });
    // a close-up: the ball, the dog, the tail
    yield* tween(2.5, p => { WF.sx = 1 + Math.sin(p * 40) * .02; }); WF.sx = 1;
    hold(WF, null); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 2.5);
    yield* petTo(WF, K.kx() + 100, 70); WF.face = -1;
    freeBall(); yield* ballArc(K.kx() + 62, FEET, .35, 10, 0);
    for (let k = 0; k < 2; k++) { hold(WF, 'down'); yield* wait(.4); hold(WF, null); yield* petJump(WF, 16, .3); emote('burst', .5, WF); }
    watchBall = true;
    // throw 1: a nudge with the head
    kam.head = .45; yield* wait(.35); kam.head = -.1; kam.eyes = 'blij';
    yield* par(ballRoll(840, 1.6, 50, 3), (function* () { yield* wait(.2); yield* petTo(WF, 820, K.PET.wifi.run * 1.6); })());
    BALL.mode = 'nose'; BALL.who = WF; emote('heart', 1.2, WF); yield* wait(.4);
    yield* petTo(WF, K.kx() + 100, K.PET.wifi.run * 1.3); WF.face = -1; freeBall(); yield* ballArc(K.kx() + 62, FEET, .3, 8, 0);
    hold(WF, 'down'); yield* wait(.6); hold(WF, null);
    // throw 2: the other way, and Snoet wants it too
    kam.face = -1; yield* walkTo(-30, 50); kam.face = -1;
    freeBall(); BALL.x = K.kx() - 60;
    kam.head = .45; yield* wait(.3); kam.head = -.1;
    const sn = G('snoet');
    yield* par(ballRoll(120, 1.6, 60, 3), (function* () { yield* wait(.2); yield* petTo(WF, 140, K.PET.wifi.run * 1.7); })(),
      sn ? (function* () { hold(sn, null); yield* wait(.4); yield* petTo(sn, 170, 220); })() : wait(.1));
    BALL.mode = 'nose'; BALL.who = WF; if (sn) { sn.face = -1; WF.face = 1; emote('burst', .6, sn); yield* petJump(sn, 30, .35); emote('dots', 1.5, sn); hold(sn, SIT(sn)); }
    yield* petTo(WF, K.kx() - 100, K.PET.wifi.run * 1.3); WF.face = 1; freeBall(); yield* ballArc(K.kx() - 60, FEET, .3, 8, 0);
    hold(WF, 'down'); emote('burst', .5, WF); yield* wait(.6); hold(WF, null);
    // throw 3: much too hard
    kam.eyes = 'groot'; kam.head = .5; yield* wait(.5); kam.sq = .9; yield* wait(.2); kam.sq = 1; kam.head = -.55;
    K.lens({ shake: 3 }, 0); emote('burst', .6);
    freeBall(); const bx0 = BALL.x;
    yield* tween(1.5, p => { BALL.x = lerp(bx0, W + 300, p); BALL.y = FEET - Math.sin(p * Math.PI * .8) * 620; BALL.spin += 20 * K.dt;
      K.lens({ z: 1 + .6 * Math.min(1, p * 2), cx: BALL.x, cy: clamp(BALL.y, 100, 500), shake: 3 * (1 - p) }, 0); });
    BALL.on = false;
    yield* K.lensW({ z: 1.6, cx: W - 200, cy: 150, shake: 0 }, .4);
    yield* wait(1.2);
    watchBall = false;
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    all.forEach(a => { a.face = 1; hold(a, a.pet === 'pebbels' || a.pet === 'dobby' ? null : SIT(a)); }); kam.face = 1; kam.head = -.2; emote('!?', 2);
    // far away: a tiny "boing"
    fx('screen', 1, (g, age) => { K.sprC(g, K.SP.burst, W - 60, 260, 2 + age * 3); });
    yield* wait(1.6); kam.eyes = 'groot'; kam.head = 0;
    hold(WF, null); emote('!', 1, WF); yield* petTo(WF, W + 90, K.PET.wifi.run * 2.2);
    emote('sweat', 2.5); others.forEach(a => emote('dots', 2, a)); yield* wait(3);
    others.forEach(a => { look(a, K.kx()); }); yield* wait(1.5); others.forEach(a => { a.face = 1; });
    // she comes back. Slowly. Without the ball.
    yield* petTo(WF, K.kx() + 160, 28); WF.face = -1; hold(WF, 'sit');
    yield* K.lensW({ z: 2.5, cx: WF.cx - 10, cy: FEET - 60 }, 2);
    let tz = T.tears(WF, 8);
    yield* wait(2.4); hold(WF, 'lie'); K.grade('koud', .35, 3); yield* wait(2.6);
    yield* K.lensW({ z: 1.2, cx: WF.cx - 120, cy: FEET - 140 }, 1.5);
    kam.eyes = 'triest'; yield* walkTo(WF.cx - W / 2 - 110, 40); kam.face = 1; kam.head = .4; emote('heart', 2);
    yield* wait(2.4); kam.head = 0;
    // one by one the others come to comfort her
    for (const a of others) { hold(a, null); yield* petTo(a, WF.cx + 60 + others.indexOf(a) * 36, K.PET[a.pet].run); a.face = -1; hold(a, a.pet === 'snoet' ? 'down' : SIT(a)); emote('heart', 1.6, a); yield* wait(.6); }
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    // and then: Kamiel looks to where it went. We'll find it.
    stop(tz); K.grade(LOOK, .5, 2);
    kam.face = 1; kam.eyes = 'boos'; kam.head = -.1; emote('!', 1.6); yield* wait(1);
    WF.eyes = 'groot'; hold(WF, 'sit'); emote('?', 1.4, WF); yield* wait(1.2); WF.eyes = '';
    yield* par(hop(30, .4), ...others.map(a => { hold(a, null); return petJump(a, 30, .4); })); emote('heart', 2, WF); hold(WF, null);
    yield* wait(1);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 2', 'OVERAL ZOEKEN', 2.6, { size: 44 });

    /* ================= DEEL 2: searching everywhere ================= */
    kam.eyes = ''; kam.head = 0; kam.x = 0; kam.face = 1;
    all.forEach((a, i) => { hold(a, null); a.cx = W / 2 - 140 - i * 70; a.face = 1; a.eyes = ''; });
    // what's waiting in the next place: a bush, a rock, a log
    const props = T.props('ground');
    const bush = { wx: T.wxNext(170), cv: T.P.bush, u: 4.4 }, rock = { wx: T.wxNext(720), cv: T.P.rock, u: 4.6 }, log = { wx: T.wxNext(470), cv: T.P.log, u: 4 };
    props.push(bush, rock, log);
    const holes = T.props('ground');
    yield* K.fadeIn(1.2);
    yield* K.journey(1, 85, all);
    // the search
    all.forEach(a => { a.face = 1; });
    const searchKam = (function* () {
      kam.head = -.4; emote('?', 1.6); yield* wait(2); kam.face = -1; yield* wait(1.2); kam.head = .55; emote('?', 1.6); yield* wait(2.2);   // up in the sky? under his own feet?
      kam.head = 0; kam.face = 1; emote('dots', 1.6);
    })();
    const pb = G('pebbels'), pp = G('pippa'), db = G('dobby');
    const searchPeb = pb ? (function* () { yield* petTo(pb, K.toScreen(bush.wx) + 40, 50); pb.face = -1; hold(pb, 'down'); pb.layer = 'back';
      const rustle = K.particles('front', { until: K.t + 2.5, emit: (ps) => { if (rnd() < .3) ps.push(K.P({ x: K.toScreen(bush.wx) + (rnd() - .5) * 100, y: FEET - 30 - rnd() * 40, vx: (rnd() - .5) * 60, vy: -40, grav: 120, life: .8 })); },
        draw: (g, p, k) => { g.fillStyle = `rgba(80,160,70,${1 - k})`; g.fillRect(Math.round(p.x), Math.round(p.y), 5, 4); } });
      yield* wait(2.6); hold(pb, null); emote('?', 1.6, pb); yield* wait(1); })() : wait(1);
    const searchPip = pp ? (function* () { yield* petTo(pp, K.toScreen(rock.wx) - 60, 60); pp.face = 1; yield* petJump(pp, 70, .5, K.toScreen(rock.wx)); pp.lift = 44; hold(pp, 'sit'); pp.face = -1; pp.busy = true;
      yield* wait(1.2); emote('dots', 2, pp); yield* wait(2); pp.face = 1; yield* wait(1.4); pp.face = -1; })() : wait(1);
    yield* par(searchKam, searchPeb, searchPip);
    // Dobby digs next to the log
    if (db) {
      yield* petTo(db, K.toScreen(log.wx) + 90, 60); db.face = -1; hold(db, 'down');
      yield* K.lensW({ z: 1.8, cx: db.cx, cy: FEET - 70 }, 1);
      const dirt = K.particles('front', { until: K.t + 3, emit: (ps) => { if (rnd() < .7) ps.push(K.P({ x: db.cx + 10, y: FEET - 4, vx: 40 + rnd() * 120, vy: -100 - rnd() * 80, grav: 340, life: .7 })); },
        draw: (g, p, k) => { g.fillStyle = `rgba(110,80,50,${1 - k})`; g.fillRect(Math.round(p.x), Math.round(p.y), 5, 5); } });
      const hw = K.toWorld(db.cx - 20);
      holes.push({ wx: hw, draw: (g, x) => { g.fillStyle = '#3b2a1c'; g.fillRect(Math.round(x - 22), FEET + 4, 44, 10); g.fillStyle = '#5a4128'; g.fillRect(Math.round(x - 30), FEET + 2, 8, 6); g.fillRect(Math.round(x + 22), FEET + 2, 10, 6); } });
      yield* tween(3, p => { db.sq = 1 + Math.sin(p * 50) * .05; }); db.sq = 1; stop(dirt);
      // a carrot! Not a ball. But a carrot!
      hold(db, null); const car = T.carry(db, T.P.carrot, 3.4); db.carrot = car;
      yield* petJump(db, 26, .35); emote('hearts', 2, db); WF.face = db.cx > WF.cx ? 1 : -1; emote('!', 1, WF); WF.eyes = 'groot'; yield* wait(1);
      WF.eyes = ''; emote('dots', 2, WF); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
      yield* wait(1);
    }
    if (pp) { pp.busy = false; yield* petJump(pp, 30, .4, pp.cx - 60); pp.lift = 0; }
    pb && (pb.layer = 'back');
    bush.on = false; rock.on = false; log.on = false; holes.length = 0;
    // montage: short scenes, the day goes by
    // — noon: Snoet comes running with something red and round
    yield* K.cut(() => { T.goto(1); K.grade('goud', .75, .01); all.forEach((a, i) => { hold(a, i % 2 ? SIT(a) : null); a.cx = 200 + i * 60; a.face = 1; a.lift = 0; }); if (sn) { sn.cx = W + 80; hold(sn, null); } kam.x = 60; kam.face = 1; if (pp) hold(pp, 'sit'); }, .5);
    if (sn) {
      const ap = T.carry(sn, T.P.apple, 3); sn.apple = ap;
      yield* petTo(sn, WF.cx + 90, 200); sn.face = -1;
      WF.eyes = 'groot'; emote('!', 1.2, WF); hold(WF, null); yield* petJump(WF, 34, .4); emote('hearts', 1.6, WF);
      ap.on = false; const apple = { wx: K.toWorld(sn.cx - 50), cv: T.P.apple, u: 3, y: FEET + 4 }; props.push(apple);
      yield* K.lensW({ z: 2.8, cx: sn.cx - 50, cy: FEET - 30 }, .8);
      yield* wait(1.4);
      yield* K.lensW({ z: 1.6, cx: WF.cx + 40, cy: FEET - 80 }, .6);
      hold(WF, 'down'); emote('dots', 1.6, WF); yield* wait(1.4); WF.eyes = ''; hold(WF, 'sit'); WF.sq = .92; T.tears(WF, 2); yield* wait(1.6); WF.sq = 1;
      apple.on = false; ap.on = true; emote('sparks', 1.2, sn); hold(sn, 'sit'); yield* wait(1);   // Snoet keeps it: you never know
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .8);
    } else yield* wait(2);
    // — afternoon: Pebbels and a butterfly
    const BF = { x: -40, y: 300, on: false, follow: null, fx: 0, fy: 0 };
    fx('front', 0, (g) => { if (!BF.on) return; if (BF.follow) { const h = K.A.petPoint(BF.follow, 'head'); BF.x = h.x + Math.sin(K.t * 2.3) * 22 + BF.fx; BF.y = h.y - 30 + Math.sin(K.t * 3.1) * 10 + BF.fy; }
      T.px(g, T.P.butterfly[Math.floor(K.t * 9) % 2], BF.x - 10, BF.y - 7, 3); });
    if (pb) {
      yield* K.cut(() => { T.goto(1); K.grade('sepia', .6, .01); all.forEach((a, i) => { hold(a, null); a.cx = 160 + i * 55; a.face = 1; }); kam.x = -40; pb.cx = 640; pb.face = -1; BF.on = true; BF.x = W + 30; BF.y = 260; }, .5);
      // everyone searches on, sniffing to the left; Pebbels sees something
      all.forEach(a => { if (a !== pb) hold(a, 'down'); });
      yield* tween(3, p => { BF.x = lerp(W + 30, 700, p); BF.y = 260 + Math.sin(p * 9) * 30; });
      pb.face = 1; pb.eyes = 'groot'; emote('!', 1.2, pb); yield* wait(.8); pb.eyes = '';
      const flut = (function* () { yield* tween(9, p => { BF.x = 700 + Math.sin(p * 6) * 160 + p * 200; BF.y = 300 + Math.sin(p * 11) * 70; }); })();
      const chase = (function* () { for (let k = 0; k < 4; k++) { yield* petTo(pb, clamp(BF.x, 80, W + 140), 90); pb.face = BF.x > pb.cx ? 1 : -1; hold(pb, 'paw'); yield* wait(.35); hold(pb, null); yield* petJump(pb, 40, .4); } })();
      yield* par(flut, chase);
      yield* tween(1.5, p => { BF.x = lerp(BF.x, W + 80, p); }); yield* petTo(pb, W + 80, 90); pb.alpha = 0;
      all.forEach(a => { if (a !== pb) hold(a, null); });
      if (pp) { pp.face = 1; emote('angry', 1.6, pp); yield* wait(1); yield* petTo(pp, W + 80, 120); pp.alpha = 0; yield* wait(1.5);
        pb.alpha = 1; pp.alpha = 1; pb.cx = W + 60; pp.cx = W + 140; BF.follow = pb; BF.on = true;
        yield* par(petTo(pb, 640, 50), petTo(pp, 720, 50)); pb.face = -1; pp.face = -1; emote('angry', 1.4, pp); emote('sweat', 1.6, pb); emote('heart', 1.2, pb);
      } else { pb.alpha = 1; pb.cx = W + 60; BF.follow = pb; yield* petTo(pb, 640, 50); pb.face = -1; }
      kam.eyes = 'blij'; emote('dots', 1.6); yield* wait(2); kam.eyes = '';
    }
    // — rain: everyone shelters under Kamiel; Snoet finds a round grey thing
    yield* K.cut(() => { T.goto(1); K.grade('koud', .75, .01); kam.x = 0; kam.face = 1; all.forEach((a, i) => { hold(a, 'down'); a.cx = K.kx() - 70 + i * 40; a.face = i % 2 ? -1 : 1; a.layer = 'back'; }); if (sn) { sn.cx = W + 80; hold(sn, null); } }, .5);
    const rain = K.weather('rain', 1.2);
    kam.eyes = 'triest'; emote('sweat', 3); all.forEach(a => { if (a !== sn) a.eyes = ''; });
    yield* K.lensW({ z: 1.5, cx: K.kx(), cy: FEET - 120 }, 3);
    if (sn) {
      if (sn.apple) sn.apple.on = false;
      const st = T.carry(sn, T.P.stone, 3.4);
      yield* petTo(sn, K.kx() + 140, 180); sn.face = -1; emote('sparks', 1, sn); WF.eyes = 'groot'; WF.face = 1; yield* wait(.8);
      st.on = false; const stone = { wx: K.toWorld(sn.cx - 40), cv: T.P.stone, u: 3.4, y: FEET + 4 }; props.push(stone);
      hold(WF, null); yield* petTo(WF, sn.cx - 80, 60); WF.face = 1; hold(WF, 'down'); yield* wait(1.2); emote('dots', 1.6, WF); hold(WF, null); WF.eyes = '';
      T.tears(WF, 2.5); WF.face = -1; yield* petTo(WF, K.kx() - 20, 50); hold(WF, 'down');
      emote('sweat', 1.6, sn); yield* petTo(sn, K.kx() + 60, 80); hold(sn, 'down'); stone.on = false;
    }
    yield* wait(2); K.stop(rain); kam.head = -.3; yield* wait(1.4); kam.head = 0;
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    // — night: a round light in a puddle
    const puddle = { on: false, x: 640, splash: 0 };
    fx('ground', 0, (g) => { if (!puddle.on) return; const x = puddle.x, y = FEET + 14;
      g.fillStyle = '#1c2a4a'; g.fillRect(x - 64, y - 8, 128, 16); g.fillRect(x - 76, y - 4, 152, 8); g.fillStyle = '#2c4070'; g.fillRect(x - 60, y - 8, 120, 4);
      const s = Math.sin(K.t * 2) * 2; g.fillStyle = 'rgba(250,245,220,.95)'; g.fillRect(Math.round(x - 12 + s), y - 6, 24, 8); g.fillRect(Math.round(x - 8 + s), y - 8, 16, 12); g.fillStyle = 'rgba(250,245,220,.5)'; g.fillRect(Math.round(x - 18 - s), y + 3, 36, 2); });
    yield* K.cut(() => { T.goto(1); const nt = K.A.night && K.A.night(); K.grade('nacht', nt ? .35 : .7, .01); K.setv('dark', nt ? .16 : .38, .01); puddle.on = true; kam.x = -200; kam.face = 1; kam.eyes = '';
      all.forEach((a, i) => { hold(a, 'lie'); a.cx = 120 + i * 50; a.face = 1; a.eyes = ''; }); if (sn) { hold(sn, null); sn.cx = 420; sn.face = 1; } }, .6);
    const moonL = K.light(() => ({ x: puddle.x, y: FEET - 40 }), 220, { col: '220,230,255' });
    const kamL = K.light(() => ({ x: K.kx(), y: FEET - 140 }), 300, { col: '200,210,255', a: .7 });
    if (sn) {
      yield* wait(1.2); sn.eyes = 'groot'; emote('!', 1.2, sn); yield* wait(1);
      yield* K.lensW({ z: 2.2, cx: puddle.x - 60, cy: FEET - 60 }, 1.2);
      hold(sn, 'down'); yield* tween(1.5, p => { sn.cx = lerp(420, 520, p); }); yield* wait(.6);   // sneaking up on it
      yield* petJump(sn, 50, .5, puddle.x);
      // splash
      const sp = K.particles('front', { until: K.t + .3, emit: (ps) => { for (let k = 0; k < 6; k++) ps.push(K.P({ x: puddle.x + (rnd() - .5) * 60, y: FEET + 6, vx: (rnd() - .5) * 220, vy: -160 - rnd() * 160, grav: 600, life: .9 })); },
        draw: (g, p, k) => { g.fillStyle = `rgba(160,200,255,${1 - k})`; g.fillRect(Math.round(p.x), Math.round(p.y), 5, 5); } });
      sn.eyes = 'x'; K.lens({ shake: 3 }, 0); yield* wait(.3); K.lens({ shake: 0 }, .3); yield* wait(1);
      sn.eyes = ''; yield* tween(1.4, p => { sn.sx = 1 + Math.sin(p * 60) * .1; sn.r = Math.sin(p * 60) * .08; }); sn.sx = 1; sn.r = 0;   // a wet shake
      emote('sweat', 2, sn); yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
      yield* petTo(sn, 100, 120); sn.face = 1; hold(sn, 'lie');
    }
    // they sleep. Wifi doesn't.
    all.forEach(a => { if (a !== WF) hold(a, 'sleep'); }); kam.eyes = 'dicht'; const zz = emote('zzz', 9);
    hold(WF, 'sit'); WF.face = 1; yield* K.lensW({ z: 2, cx: WF.cx + 60, cy: FEET - 120 }, 2);
    T.tears(WF, 3); yield* wait(3);
    // a shooting star
    const star = fx('screen', 1.6, (g, age) => { const p = age / 1.6, x = lerp(W * .75, W * .35, p), y = lerp(90, 200, p); g.fillStyle = `rgba(255,250,220,${1 - p})`; for (let k = 0; k < 10; k++) g.fillRect(Math.round(x + k * 9), Math.round(y - k * 2.6), 6 - k * .5, 3); K.sprC(g, K.SP.star, x, y, 2.6); });
    yield* K.lensW({ z: 1.2, cx: W / 2, cy: 260 }, 1.4); WF.eyes = 'groot'; emote('!', 1.4, WF); yield* wait(1.2); WF.eyes = ''; emote('heart', 2, WF);
    hold(WF, 'lie'); yield* wait(2);
    stop(zz); yield* K.fadeOut(2);
    K.unlight(moonL); K.unlight(kamL); K.setv('dark', 0); puddle.on = false;
    yield* K.card('DEEL 3', 'HET SPOOR', 2.6, { size: 44 });

    /* ================= DEEL 3: the trail ================= */
    K.grade(LOOK, .6, .01); T.goto(1);
    kam.x = -120; kam.face = 1; kam.eyes = 'dicht';
    all.forEach((a, i) => { hold(a, 'sleep'); a.cx = 150 + i * 60; a.face = 1; a.eyes = ''; });
    WF.cx = 470; hold(WF, 'lie');
    // little round dents in the earth, a red fleck in each: the ball bounced here
    const marks = T.props('ground');
    for (let k = 0; k < 18; k++) { const wx = K.toWorld(560) + k * 150 + (k % 3) * 30; marks.push({ wx, draw: (g, x) => { g.fillStyle = '#5a4128'; g.fillRect(Math.round(x - 14), FEET + 10, 28, 6); g.fillStyle = '#3b2a1c'; g.fillRect(Math.round(x - 10), FEET + 12, 20, 4); g.fillStyle = '#e2343a'; g.fillRect(Math.round(x + 4), FEET + 8, 4, 3); } }); }
    yield* K.fadeIn(2);
    yield* wait(1.4);
    hold(WF, null); WF.face = 1; yield* wait(.6); hold(WF, 'down'); emote('dots', 1.8, WF); yield* wait(1.4);
    yield* petTo(WF, 540, 30); hold(WF, 'down'); yield* K.lensW({ z: 2.6, cx: 570, cy: FEET - 30 }, 1.4);
    yield* wait(1.2); WF.eyes = 'groot'; emote('!', 1.4, WF); yield* wait(1);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .6);
    hold(WF, null); for (let k = 0; k < 3; k++) { yield* petJump(WF, 24, .3); emote('burst', .4, WF); }   // barking: wake up!
    all.forEach(a => { if (a !== WF) { hold(a, null); a.eyes = 'groot'; } }); kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.2);
    all.forEach(a => { a.eyes = ''; }); kam.eyes = '';
    // follow it: Wifi in front, nose to the ground
    yield* par(petTo(WF, 660, 80), ...others.map((a, i) => petTo(a, 330 + i * 55, 80)), walkTo(-200, 60));
    for (let s = 0; s < 2; s++) {
      WF.lockPose = false;
      yield* K.journey(1, 95, all);
      hold(WF, 'down'); emote('dots', 1.4, WF); yield* wait(1.4); hold(WF, null); emote('!', 1, WF); yield* wait(.6);
      if (s === 0 && db) { emote('hearts', 1.4, db); }   // Dobby nibbles his carrot on the way
    }
    // there she is: Heidi, chewing, her back to us
    HD = K.heidi(1, { eyes: 'vies' }); HD.cx = W + 200; HD.face = 1;
    const hdIn = (function* () { HD.face = -1; yield* K.actorTo(HD, 820, 60); HD.face = 1; })();
    yield* hdIn;
    HD.lockPose = true; HD.pose = 'stand';
    BALL.on = false; BALL.mode = 'heidi'; BALL.u = 2.6;
    const chew = T.each(() => { if (HD.chew) HD.sq = 1 + Math.sin(K.t * 9) * .012; });
    HD.chew = true;
    all.forEach(a => { a.face = 1; }); kam.face = 1;
    yield* petTo(WF, 640, 50); hold(WF, 'down'); emote('dots', 1.6, WF); yield* wait(1.6); hold(WF, 'stand');
    // she turns around… (slowly)
    yield* K.lensW({ z: 1.6, cx: 740, cy: FEET - 150 }, 1.4);
    yield* wait(.8); HD.face = -1; BALL.on = true; yield* wait(.7);
    K.flash(1, '255,255,255', 2); yield* K.lensW({ z: 3.2, cx: BALL.sx || 760, cy: (BALL.sy || 420) - 30 }, .25);
    all.forEach(a => { a.eyes = 'groot'; }); kam.eyes = 'groot';
    yield* T.freeze(2.2, LOOK, .6);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .8);
    emote('!', 1.6); all.forEach(a => emote('!', 1.4, a)); yield* wait(1.2);
    yield* K.fadeOut(1.2);
    yield* K.card('DEEL 4', 'DE ONDERHANDELING', 2.6, { size: 44 });

    /* ================= DEEL 4: Heidi ================= */
    all.forEach((a, i) => { a.eyes = ''; hold(a, SIT(a)); a.cx = 200 + i * 60; a.face = 1; }); kam.x = -160; kam.face = 1; kam.eyes = '';
    HD.cx = 720; HD.face = -1; HD.eyes = 'vies';
    yield* K.fadeIn(1.2);
    yield* wait(1);
    // Kamiel asks nicely
    yield* walkTo(HD.cx - W / 2 - 200, 35); kam.face = 1; kam.head = .3; emote('heart', 2); kam.eyes = 'blij'; yield* wait(2);
    HD.eyes = 'vies'; HD.face = 1; yield* wait(1.6); emote('dots', 2, HD); HD.face = -1; yield* wait(1); kam.head = 0; kam.eyes = 'triest';
    yield* walkTo(-170, 60); kam.face = 1;
    // Wifi begs
    hold(WF, null); yield* petTo(WF, HD.cx - 110, 50); WF.face = 1; hold(WF, 'sit'); WF.eyes = 'groot';
    yield* K.lensW({ z: 1.7, cx: HD.cx - 60, cy: FEET - 130 }, 1.2);
    emote('heart', 2, WF); yield* tween(2.4, p => { WF.sx = 1 + Math.sin(p * 30) * .03; }); WF.sx = 1;
    HD.eyes = 'rol'; yield* wait(2.2); HD.eyes = 'vies';
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    // Snoet offers the apple
    let deal = false;
    if (sn) {
      if (!sn.apple) sn.apple = T.carry(sn, T.P.apple, 3);
      sn.apple.on = true; hold(sn, null); yield* petTo(sn, HD.cx - 80, 80); sn.face = 1; sn.apple.on = false;
      const ap2 = { wx: K.toWorld(HD.cx - 50), cv: T.P.apple, u: 3, y: FEET + 4 }; props.push(ap2);
      yield* petTo(sn, HD.cx - 160, 60); sn.face = 1; hold(sn, 'sit');
      HD.lockPose = false; HD.head = .35; HD.eyes = ''; yield* wait(1.6);
      HD.chew = false; emote('dots', 1.4, HD); yield* wait(1.4);
      // she drops the ball to take the apple
      freeBall(); yield* ballRoll(HD.cx - 150, 1, 30, 2);
      ap2.on = false; HD.head = 0; HD.eyes = 'blij'; HD.chew = true; emote('hearts', 1.6, HD); deal = true;
    } else { HD.chew = false; freeBall(); yield* ballRoll(HD.cx - 150, 1, 30, 2); HD.chew = true; }
    WF.eyes = 'groot'; emote('!', 1, WF); hold(WF, null); yield* wait(.3);
    yield* petTo(WF, BALL.x + 40, 160);
    // …but she's faster: the ball is hers again, and off she goes
    HD.lockPose = false; HD.head = .5; yield* wait(.15);
    const hb0 = { x: BALL.x, y: BALL.y }; yield* tween(.3, p => { const m = K.A.llamaPoint(HD, 70, 355); BALL.x = lerp(hb0.x, m.x, p); BALL.y = lerp(hb0.y, m.y + 14, p); });
    BALL.mode = 'heidi'; HD.head = 0; HD.eyes = 'blij'; emote('sparks', 1.2, HD);
    WF.eyes = ''; emote('angry', 1.4, WF);
    // the chase
    const runners = [WF].concat(others);
    const dust = K.particles('front', { until: K.t + 20, emit: (ps) => { for (const a of runners.concat([HD])) if (a.pose === 'walk' && rnd() < .3) ps.push(K.P({ x: a.cx - a.face * 30, y: FEET - 4, vx: -a.face * 30, vy: -20, life: .6 })); },
      draw: (g, p, k) => { g.fillStyle = `rgba(200,180,140,${.6 * (1 - k)})`; const s = 6 + Math.round(k * 6); g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); } });
    for (let lap = 0; lap < 3; lap++) {
      const d = lap % 2 ? -1 : 1, end = W / 2 + d * (W / 2 + 200);
      if (lap) { HD.cx = W / 2 - d * (W / 2 + 160); runners.forEach((a, i) => { a.cx = HD.cx - d * (150 + i * 60); }); kam.x = HD.cx - W / 2 - d * 300; }
      HD.rate = 14;
      yield* par(K.actorTo(HD, end, 300), ...runners.map((a, i) => (function* () { yield* wait(.1 * i); yield* petTo(a, end - d * 40, 290 - i * 8); })()),
        (function* () { yield* wait(.6); if (lap === 2) { kam.eyes = 'groot'; emote('sweat', 2.5); } yield* walkTo(end - W / 2 - d * 100, 270, 18); })());
    }
    // she stops in the middle; they all pile up behind her
    HD.cx = -150; runners.forEach((a, i) => { a.cx = -330 - i * 70; }); kam.x = -W / 2 - 150;
    yield* K.actorTo(HD, 600, 260); HD.face = 1; HD.lockPose = true; HD.pose = 'stand';
    yield* par(...runners.map((a, i) => (function* () { yield* petTo(a, 600 - 110 - i * 34, 300); a.face = 1; a.eyes = 'x'; a.sq = .8; emote('stars', 2, a); })()));
    K.lens({ shake: 4 }, 0); yield* wait(.3); K.lens({ shake: 0 }, .4); stop(dust);
    yield* walkTo(-200, 120); kam.face = 1; kam.eyes = 'groot'; emote('sweat', 2);
    runners.forEach(a => { a.sq = 1; a.eyes = ''; hold(a, 'sit'); });
    // the butterfly (still with Pebbels) lands on her nose
    BF.follow = null; BF.on = true; if (!pb) { BF.x = -30; BF.y = 200; }
    const nose = () => K.A.llamaPoint(HD, 10, 340);
    const bf0 = { x: BF.x, y: BF.y };
    yield* K.lensW({ z: 2.2, cx: HD.cx - 40, cy: FEET - 190 }, 1.2);
    yield* tween(3, p => { const n = nose(); BF.x = lerp(bf0.x, n.x, ez(p)) + Math.sin(p * 12) * 20 * (1 - p); BF.y = lerp(bf0.y, n.y - 8, ez(p)); });
    BF.follow = null;
    HD.eyes = 'spiraal'; HD.chew = false; yield* wait(1);
    // ah… ah…
    yield* tween(1.6, p => { HD.head = -.25 * ez(p); HD.sq = 1 + .05 * p; const n = nose(); BF.x = n.x; BF.y = n.y - 8; });
    // ACHOO
    HD.head = .3; HD.sq = .94; HD.eyes = 'dicht'; K.flash(.8); K.lens({ shake: 7 }, 0); emote('burst', .8, HD);
    T.puff(nose().x - 30, nose().y, 10, '255,255,255', 120);
    BF.x -= 60; BF.y -= 40;
    freeBall(); yield* wait(.2); K.lens({ shake: 0 }, .4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .3);
    // SLOW MOTION: up… up… and down
    T.slowIn('goud');
    const bxs = BALL.x, bys = BALL.y;
    const bfAway = (function* () { yield* tween(4, p => { BF.x -= 60 * K.dt; BF.y -= 30 * K.dt; }); BF.on = false; })();
    all.forEach(a => { hold(a, SIT(a)); a.eyes = 'groot'; }); kam.head = -.4;
    yield* par(bfAway, tween(3.6, p => { BALL.x = lerp(bxs, 470, p); BALL.y = bys - Math.sin(p * Math.PI * .5) * 330; BALL.spin += 4 * K.dt;
      K.lens({ z: 1.6, cx: BALL.x, cy: BALL.y - 20 }, 0); all.forEach(a => { look(a, BALL.x); }); }));
    // Wifi runs underneath
    hold(WF, null); WF.eyes = '';
    const by1 = BALL.y;
    yield* par(petTo(WF, 520, 120), tween(1.4, p => { BALL.y = by1 + p * 60; K.lens({ z: 1.6 - .4 * p, cx: lerp(BALL.x, 500, p), cy: lerp(BALL.y, 380, p) }, 0); }));
    WF.face = -1;
    hold(WF, 'jump'); const jy0 = BALL.y, jx0 = BALL.x;
    yield* tween(1.3, p => { WF.lift = Math.sin(p * Math.PI / 2) * 150; const n = K.A.petPoint(WF, 'nose'); BALL.x = lerp(jx0, n.x - 6, p); BALL.y = lerp(jy0, n.y + 14, p); });
    BALL.mode = 'nose'; BALL.who = WF; BALL.u = 3;
    yield* T.freeze(2.4, 'goud', .5);
    T.slowOut(LOOK, .55);
    yield* tween(.5, p => { WF.lift = 150 * (1 - p * p); }); WF.lift = 0; hold(WF, null);
    T.puff(WF.cx, FEET - 6, 8, '200,180,140', 70);
    // joy
    WF.eyes = 'hart'; emote('hearts', 3, WF); kam.eyes = 'blij'; kam.head = 0; emote('hearts', 3);
    all.forEach(a => { if (a !== WF) { a.eyes = ''; emote('hearts', 2.5, a); } });
    yield* par(...all.map(a => (function* () { yield* wait(rnd() * .5); hold(a, null); yield* petJump(a, 34, .4); yield* petJump(a, 24, .35); })()), hop(36, .45));
    hold(WF, 'lie'); WF.r = -.2; yield* tween(1.6, p => { WF.sx = 1 + Math.sin(p * 30) * .05; }); WF.sx = 1; WF.r = 0; hold(WF, null); WF.eyes = '';
    // Heidi: chews on. She got an apple out of it.
    HD.lockPose = false; HD.eyes = 'vies'; HD.head = 0; HD.sq = 1; HD.chew = deal; emote('dots', 2, HD); yield* wait(1.6);
    HD.face = 1; yield* K.actorTo(HD, W + 180, 50); HD.alpha = 0; stop(chew);
    yield* K.fadeOut(1.8);

    /* ================= finale: playing until the sun goes down ================= */
    K.grade('warm', .6, .01); K.setv('vig', .8, .01); BF.on = false; const sunset = T.sunset(760, 410);
    props.forEach(p => { p.on = false; }); marks.length = 0; holes.length = 0;
    kam.x = -40; kam.face = 1; kam.eyes = 'blij';
    const ring = [G('snoet'), G('pippa'), G('dobby'), G('pebbels')].filter(Boolean);
    const rx = [600, 720, 820, 900];
    ring.forEach((a, i) => { a.cx = rx[i]; a.face = -1; hold(a, SIT(a)); a.layer = 'back'; a.alpha = 1; });
    WF.cx = 300; WF.face = 1; hold(WF, 'sit'); BALL.mode = 'nose'; BALL.who = WF;
    watchBall = true;
    yield* K.fadeIn(2.2);
    yield* petTo(WF, K.kx() + 90, 70); WF.face = -1; freeBall(); yield* ballArc(K.kx() + 60, FEET, .3, 8, 0); hold(WF, 'down'); yield* wait(.6); hold(WF, null);
    // the ball goes round: from head to head
    kam.head = .45; yield* wait(.3); kam.head = -.3; kam.face = 1;
    let bx = BALL.x, by = BALL.y;
    for (const [i, a] of ring.entries()) {
      const hx = a.cx, top = FEET - 110;
      yield* par(ballArc(hx, top, .9, 120, 10), (function* () { yield* wait(.55); hold(a, null); yield* petJump(a, 40, .4); })());
      emote('burst', .4, a); if (a.pet === 'pebbels') { a.eyes = 'groot'; }
    }
    // the last header: high, high up, and Wifi takes it in slow motion against the setting sun
    T.slowIn('goud');
    const lx = BALL.x, ly = BALL.y;
    hold(WF, null); const wfRun = petTo(WF, 420, 110);
    yield* par(wfRun, tween(3, p => { BALL.x = lerp(lx, 440, p); BALL.y = ly - Math.sin(p * Math.PI) * 240 + p * 30; K.lens({ z: 1.4, cx: lerp(lx, 440, p), cy: 300 }, 0); }));
    WF.face = 1; yield* par(petJump(WF, 90, 1.4), tween(.7, p => { BALL.x = lerp(440, 420, p); BALL.y = lerp(BALL.y, FEET - 90 - 40, p); }));
    BALL.mode = 'nose'; BALL.who = WF;
    T.slowOut('warm', 1);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    WF.eyes = 'hart'; emote('hearts', 3, WF); ring.forEach(a => { a.eyes = ''; emote('hearts', 2.5, a); });
    // one photo of everyone
    watchBall = false;
    yield* par(walkTo(60, 50), ...all.map((a, i) => petTo(a, [300, 380, 650, 730, 820][i], K.PET[a.pet].run * .7)));
    all.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; hold(a, SIT(a)); }); kam.face = -1;
    yield* K.lensW({ z: 1.2, cx: W / 2 + 40, cy: FEET - 150 }, 2);
    for (let k = 3; k > 0; k--) { emote('dots', .9); yield* wait(1); }
    K.flash(1, '255,255,255', 1.4); K.grade('sepia', 1, .01); K.setv('ab', .6);
    yield* wait(3.2);
    K.setv('ab', 0, 1); K.grade('warm', 1, 1.2);
    // …and the ball rolls away, and stops against a white hoof
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.4);
    freeBall(); BALL.y = FEET;
    HD.alpha = 1; HD.cx = W + 60; HD.face = -1; HD.eyes = 'vies'; HD.lockPose = false;
    yield* par(ballRoll(W - 80, 2.2, 14, 3), K.actorTo(HD, W - 20, 40));
    HD.face = -1; HD.eyes = 'blij'; WF.eyes = 'groot'; emote('!', 1.4, WF); all.forEach(a => { a.face = 1; }); kam.face = 1; kam.eyes = 'groot'; emote('!?', 1.6);
    yield* K.lensW({ z: 2.2, cx: W - 100, cy: FEET - 120 }, 1.6);
    yield* wait(2);
    yield* K.ending('EINDE');
  } };
  /* =====================================================================================================
     WAAR IS SNOET? — Snoet chases a little light and runs off into strange places: an endless pink corridor,
     a chess floor with floating doors, a forest of lamp posts. The others search for him, day and night,
     until a howl and a lantern bring them together. Then they walk home in the sunset. About 7 minutes.
     ===================================================================================================== */
  F['film-snoet'] = { can: (K) => K.castNames().includes('snoet'), run: function* (K) {
    const { W, H, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez, clamp } = K;
    const T = kit(K);
    const names = K.castNames(); if (!names.includes('snoet')) return;
    const gang = {}; names.forEach(n => { gang[n] = K.pet(n, 1); gang[n].alpha = 0; });
    const G = (n) => gang[n] || null;
    const SN = gang.snoet, others = names.filter(n => n !== 'snoet').map(n => gang[n]);
    const SIT = (a) => a.pet === 'dobby' ? 'up' : 'sit';
    const look = (a, x) => { a.face = x > a.cx ? 1 : -1; };
    const LOOK = 'warm';

    /* ---- the dream decors: painted at a quarter of the resolution, blown up: chunky pixels ---- */
    const LW = 240, LH = 150, low = T.cv(LW, LH), lg = low.getContext('2d'), img = lg.createImageData(LW, LH), buf = new Uint32Array(img.data.buffer);
    const hex = (h) => { const n = parseInt(h.slice(1), 16); return (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16); };   // ABGR
    const mix = (a, b, t) => { const p = (c, s) => (c >> s) & 255; const m = (s) => Math.round(p(a, s) + (p(b, s) - p(a, s)) * t) << s; return ((255 << 24) | m(16) | m(8) | m(0)) >>> 0; };
    const DEC = { scroll: 0, speed: 0 };
    T.each(() => { DEC.scroll += DEC.speed * K.dt; });
    const blit = (g) => { lg.putImageData(img, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W, H); };
    // A. the endless pink corridor: one-point perspective, a checker floor, doors in the walls, lamps on the ceiling
    const C = { floorA: hex('#f9cfe2'), floorB: hex('#e27aae'), wall: hex('#f2a0c6'), wallD: hex('#9a3a70'), door: hex('#c25a92'), doorF: hex('#6a2050'), ceil: hex('#fbdaea'), lamp: hex('#fff6d8'), voidC: hex('#2a0c26') };
    function corridor(g) {
      const vx = 120, vy = 62, sc = DEC.scroll;
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
        const fx_ = Math.abs(x + .5 - vx) / vx, fy = y + .5 > vy ? (y + .5 - vy) / (LH - vy) : (vy - y - .5) / vy, f = Math.max(fx_, fy);
        let col;
        if (f < .07) col = C.voidC;
        else if (fy >= fx_) {   // floor or ceiling
          const z = 1 / f, row = Math.floor(z * 1.4 + sc), u = (x + .5 - vx) / (vx * f), colN = Math.floor(u * 3 + 10);
          if (y + .5 > vy) col = (row + colN) % 2 ? C.floorA : C.floorB;
          else col = (row % 3 === 0 && Math.abs(u) < .25) ? C.lamp : C.ceil;
          col = mix(col, C.voidC, clamp((.35 - f) * 2.2, 0, 1));
        } else {   // walls, with a door every few steps
          const z = 1 / f, row = Math.floor(z * 1.4 + sc), rel = (y + .5 - (vy - vy * f)) / ((vy + (LH - vy) * f) - (vy - vy * f)), part = (z * 1.4 + sc) % 1;
          col = C.wall;
          if (row % 3 === 1 && rel > .32 && rel < 1) col = (part < .12 || part > .88 || rel < .36) ? C.doorF : C.door;
          if (row % 3 === 1 && rel > .62 && rel < .68 && part > .7 && part < .8) col = hex('#ffd23f');
          col = mix(col, C.wallD, clamp(1 - f, 0, 1) * .7);
          col = mix(col, C.voidC, clamp((.35 - f) * 2.2, 0, 1));
        }
        buf[y * LW + x] = col;
      }
      blit(g);
      // a soft light at the far end
      const gr = g.createRadialGradient(W / 2, vy * 4, 4, W / 2, vy * 4, 160); gr.addColorStop(0, 'rgba(255,230,250,.35)'); gr.addColorStop(1, 'rgba(255,230,250,0)'); g.fillStyle = gr; g.fillRect(W / 2 - 160, vy * 4 - 160, 320, 320);
    }
    // B. the chess floor to the horizon, a pastel sky, doors floating
    const doors = [{ x: 150, y: 170, u: 3, ph: 0, open: 0 }, { x: 380, y: 120, u: 2, ph: 2, open: 0 }, { x: 610, y: 210, u: 4, ph: 4, open: 0 }, { x: 830, y: 140, u: 2.4, ph: 1, open: 0 }, { x: 980, y: 250, u: 3.4, ph: 3, open: 0 }];
    const skyTop = hex('#b8a4f0'), skyBot = hex('#ffd2c4'), chA = hex('#f4f0ea'), chB = hex('#2a2440'), haze = hex('#ffe4dc');
    function chess(g) {
      const vy = 74, sc = DEC.scroll;
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
        let col;
        if (y < vy) col = mix(skyTop, skyBot, y / vy);
        else { const f = (y + .5 - vy) / (LH - vy), z = 1 / f, row = Math.floor(z * 1.2), u = (x + .5 - 120) * z / 120 + sc * .05, cN = Math.floor(u * 2.2 + 100);
          col = (row + cN) % 2 ? chA : chB; col = mix(col, haze, clamp(1.2 - f * 3, 0, 1)); }
        buf[y * LW + x] = col;
      }
      blit(g);
      for (const d of doors) { const x = ((d.x - sc * 4 * d.u / 3) % (W + 300) + W + 300) % (W + 300) - 150, y = d.y + Math.sin(K.t * .8 + d.ph) * 10;
        g.fillStyle = 'rgba(40,30,60,.18)'; g.fillRect(Math.round(x - 8 * d.u), Math.round(FEET - 40 + d.u * 10), Math.round(16 * d.u), Math.round(3 * d.u));   // its shadow on the floor
        if (d.open > 0) { g.fillStyle = `rgba(255,250,220,${d.open})`; g.fillRect(Math.round(x - 7 * d.u), Math.round(y - 27 * d.u), Math.round(14 * d.u), Math.round(26 * d.u));
          const gl = g.createRadialGradient(x, y - 14 * d.u, 4, x, y - 14 * d.u, 60 * d.u); gl.addColorStop(0, `rgba(255,250,220,${.45 * d.open})`); gl.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = gl; g.fillRect(x - 60 * d.u, y - 74 * d.u, 120 * d.u, 120 * d.u); }
        g.save(); if (d.open > 0) { g.translate(x - 7 * d.u, 0); g.scale(1 - d.open * .75, 1); g.translate(-(x - 7 * d.u), 0); }
        T.pxAt(g, T.P.door, x, y, d.u); g.restore(); }
    }
    // C. a misty forest of lamp posts, at night
    const lamps = []; for (let k = 0; k < 16; k++) lamps.push({ x: k * 97 + (k % 3) * 31, z: .35 + ((k * 7) % 10) / 15, on: 1 });
    lamps.sort((a, b) => a.z - b.z);
    const nTop = hex('#151c4a'), nBot = hex('#4a3f86'), gnd = hex('#28324e'), gnd2 = hex('#323e62'), hz = hex('#6a5a9a');
    const lampN = T.paint(9, 46, (r) => { r(1, 0, 7, 2, '#5a5a78'); r(2, 2, 5, 6, '#fff3c0'); r(1, 2, 1, 6, '#5a5a78'); r(7, 2, 1, 6, '#5a5a78'); r(1, 8, 7, 1, '#5a5a78'); r(4, 9, 1, 34, '#4a4a66'); r(3, 9, 1, 34, '#7a7a9a');
      r(2, 42, 5, 2, '#5a5a78'); r(1, 44, 7, 2, '#4a4a66'); r(3, 3, 2, 2, '#ffffff'); });
    const lampX = (l) => { const span = W + 200; return ((l.x - DEC.scroll * l.z) % span + span) % span - 100; };
    const lampBase = (l) => FEET + 10 - (1 - l.z) * 110;
    function forest(g) {
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) buf[y * LW + x] = y < 96 ? mix(nTop, nBot, y / 96) : y < 100 ? hz : ((x * 3 + y * 7) % 23 === 0 ? gnd2 : gnd);
      blit(g);
      g.fillStyle = 'rgba(255,255,240,.8)'; for (let k = 0; k < 34; k++) if (Math.sin(K.t * 2 + k) > -.6) g.fillRect((k * 131) % W, 70 + (k * 47) % 200, 3, 3);   // stars
      for (const l of lamps) { const x = lampX(l), b = lampBase(l), u = 1.4 + l.z * 3.2;
        if (l.on > 0) { g.fillStyle = `rgba(255,230,160,${.16 * l.on * l.z})`; g.beginPath(); g.ellipse(x, b, 40 * u, 6 * u, 0, 0, 7); g.fill(); }   // a pool of light on the ground
        g.globalAlpha = .55 + l.z * .45; T.pxAt(g, lampN, x, b, u); g.globalAlpha = 1;
        const hy = b - 41 * u;
        if (l.on > 0) { const gl = g.createRadialGradient(x, hy, 2, x, hy, 20 * u); gl.addColorStop(0, `rgba(255,240,180,${.5 * l.on})`); gl.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gl; g.fillRect(x - 20 * u, hy - 20 * u, 40 * u, 40 * u); }
        else { g.fillStyle = 'rgba(30,30,50,.9)'; g.fillRect(Math.round(x - 2.5 * u), Math.round(b - 44 * u), Math.round(5 * u), Math.round(6 * u)); } }
    }
    const mist = (strength) => fx('front', 0, (g) => { for (let k = 0; k < 4; k++) { const y = FEET - 30 + k * 16, x = ((K.t * (14 + k * 6) + k * 280) % (W + 600)) - 300;
      const gr = g.createRadialGradient(x, y, 10, x, y, 280); gr.addColorStop(0, `rgba(190,200,240,${.12 * strength})`); gr.addColorStop(1, 'rgba(200,210,240,0)'); g.fillStyle = gr; g.fillRect(x - 280, y - 70, 560, 140); } });

    /* ---- the little light that Snoet chases ---- */
    const WISP = { on: false, x: 0, y: 0, a: 1 };
    fx('front', 0, (g) => { if (!WISP.on) return; g.globalAlpha = WISP.a; const tw = 2.6 + Math.sin(K.t * 9) * .5; K.sprC(g, K.SP.spark, WISP.x, WISP.y, tw); K.sprC(g, K.SP.spark, WISP.x + Math.sin(K.t * 5) * 14, WISP.y + Math.cos(K.t * 4) * 10, 1.4); g.globalAlpha = 1; });
    const wispGlow = K.over((g, age, lp) => { if (!WISP.on) return; const q = lp({ x: WISP.x, y: WISP.y }), r = 70; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      gr.addColorStop(0, `rgba(190,255,240,${.5 * WISP.a})`); gr.addColorStop(1, 'rgba(190,255,240,0)'); g.fillStyle = gr; g.fillRect(q.x - r, q.y - r, 2 * r, 2 * r); });
    // sound: arcs coming out of a mouth (calling, howling, barking far away)
    const call = (at, dir, secs, col) => fx('screen', secs || 2, (g, age) => { const p = at(); g.fillStyle = col || 'rgba(255,255,255,.85)';
      for (let k = 0; k < 3; k++) { const a = (age * 1.2 + k / 3) % 1, r = 14 + a * 60; g.globalAlpha = 1 - a;
        for (let j = -3; j <= 3; j++) { const an = j * .22 + (dir < 0 ? Math.PI : 0) + (dir === 0 ? -Math.PI / 2 : 0); g.fillRect(Math.round(p.x + Math.cos(an) * r), Math.round(p.y + Math.sin(an) * r), 4, 4); } } g.globalAlpha = 1; });
    const kamMouth = () => K.kp(20, 400);
    // Snoet alone (the others are elsewhere), or the others without him
    const solo = (on) => { kam.alpha = on ? 0 : 1; others.forEach(a => { a.alpha = on ? 0 : 1; }); SN.alpha = on ? 1 : 0; };
    // Kamiel's lantern
    const LAN = { on: false };
    const lan = K.light(() => LAN.on && kam.alpha > 0 ? K.kp(30, 380) : null, 330, { col: '255,180,80', flicker: .08 });
    fx('front', 0, (g) => { if (!LAN.on || kam.alpha <= 0) return; const p = K.kp(30, 380), sw = Math.sin(K.t * 5) * 4; g.fillStyle = '#2b2118'; g.fillRect(Math.round(p.x - 7 + sw), Math.round(p.y), 14, 3);
      g.fillStyle = `rgba(255,${190 + Math.floor(rnd() * 40)},90,.95)`; g.fillRect(Math.round(p.x - 5 + sw), Math.round(p.y + 3), 10, 14); g.fillStyle = '#2b2118'; g.fillRect(Math.round(p.x - 7 + sw), Math.round(p.y + 17), 14, 3); });

    /* ================= the light ================= */
    const spots = { wifi: 200, pippa: 280, pebbels: 720, dobby: 800 };
    yield* T.opening('WAAR IS SNOET?', 'EEN VERHAAL OVER VERDWALEN', LOOK, .5, () => {
      kam.x = 0; kam.face = -1; kam.eyes = 'blij';
      others.forEach(a => { a.alpha = 1; a.cx = spots[a.pet]; a.face = a.cx < W / 2 ? 1 : -1; hold(a, SIT(a)); });
      SN.alpha = 1; SN.cx = -80; SN.face = 1; SN.rate = 16;
    });
    // Snoet: a tornado. Round and round everyone.
    for (let k = 0; k < 2; k++) { SN.layer = k ? 'back' : 'front'; yield* petTo(SN, W + 60, 330); yield* petTo(SN, -60, 330); }
    others.forEach(a => { a.eyes = 'groot'; }); kam.eyes = 'groot'; emote('!', 1);
    yield* petTo(SN, K.kx() - 90, 200); SN.face = 1; SN.layer = 'front';
    yield* petJump(SN, 60, .45, K.kx() - 40); kam.face = -1; kam.eyes = 'dicht'; kam.blush = true; emote('hearts', 2.5, SN);
    yield* tween(1.6, p => { SN.sx = 1 + Math.sin(p * 40) * .06; }); SN.sx = 1;
    // he licks them all, quick quick quick
    for (const a of others) { yield* petTo(SN, a.cx + (a.cx < K.kx() ? 60 : -60), 260); look(SN, a.cx); a.eyes = 'dicht'; emote('heart', 1, a); yield* tween(.5, p => { SN.sx = 1 + Math.sin(p * 30) * .06; }); SN.sx = 1; a.eyes = ''; }
    kam.blush = false; kam.eyes = 'blij'; others.forEach(a => { a.eyes = ''; });
    // nap time. For everyone except one.
    K.grade('goud', .5, 4);
    others.forEach(a => hold(a, a.pet === 'dobby' ? 'lie' : 'sleep')); kam.eyes = 'dicht';
    const zz = emote('zzz', 30);
    yield* petTo(SN, K.kx() + 130, 120); SN.face = -1; hold(SN, 'lie'); yield* wait(2.4);
    for (let k = 0; k < 3; k++) { SN.face = -SN.face; yield* wait(.7); }
    hold(SN, 'sit'); emote('dots', 1.6, SN); yield* wait(1.6);
    // a little light
    WISP.on = true; WISP.x = W + 30; WISP.y = 300;
    yield* tween(4, p => { WISP.x = lerp(W + 30, SN.cx + 120, ez(p)); WISP.y = 300 + Math.sin(p * 8) * 40 + p * 120; look(SN, WISP.x); });
    SN.eyes = 'groot'; emote('!', 1.2, SN);
    yield* K.lensW({ z: 2.2, cx: SN.cx + 50, cy: FEET - 80 }, 1);
    yield* tween(1.6, p => { WISP.x = SN.cx + 120 - p * 60; WISP.y = FEET - 110 + Math.sin(p * 9) * 12; });
    hold(SN, 'down'); SN.eyes = ''; yield* tween(1.2, p => { SN.sx = 1 + Math.sin(p * 25) * .04; });   // the tail…
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .4);
    hold(SN, null); SN.face = 1;
    yield* par(tween(2.2, p => { WISP.x = lerp(SN.cx + 60, W + 60, p); WISP.y = FEET - 110 - Math.sin(p * Math.PI * 3) * 60; }), (function* () { yield* petJump(SN, 50, .45, SN.cx + 60); yield* petTo(SN, W + 80, 300); })());
    WISP.on = false;
    yield* wait(1.2);
    // nobody noticed
    yield* K.lensW({ z: 1.5, cx: K.kx(), cy: FEET - 120 }, 4);
    yield* wait(1.5);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 2', 'VERDWAALD', 2.6, { size: 44 });

    /* ================= DEEL 2: lost, and missed ================= */
    // the corridor: he runs into it, smaller and smaller
    K.grade('magie', .25, .01); K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0);
    const stA = K.stage(corridor); DEC.speed = 0;
    solo(true); SN.cx = W + 40; SN.feet = FEET; SN.s = .85; SN.face = -1; hold(SN, null);
    WISP.on = true; WISP.x = W / 2 + 60; WISP.y = 380; WISP.a = 1;
    yield* K.fadeIn(1.4);
    yield* petTo(SN, W / 2 + 140, 260);
    T.walking(SN, true, 18);
    yield* tween(5, p => { const e = ez(p); SN.cx = lerp(W / 2 + 140, W / 2 + 6, e); SN.feet = lerp(FEET, 300, e); SN.s = lerp(.85, .22, e); WISP.x = lerp(W / 2 + 60, W / 2, e); WISP.y = lerp(380, 250, e); WISP.a = 1 - p * .5; });
    T.walking(SN, false); WISP.on = false; K.flash(.3, '255,230,250', 3);
    yield* wait(.8);
    emote('?', 1.8, SN); yield* wait(1); SN.face = 1; yield* wait(.8); SN.face = -1; yield* wait(.8);
    // closer: alone in an endless corridor
    yield* K.cut(() => { SN.cx = W / 2 + 40; SN.feet = FEET; SN.s = .85; SN.face = -1; hold(SN, 'stand'); K.lens({ z: 1.6, cx: W / 2 + 40, cy: FEET - 100 }, 0); }, .4);
    SN.eyes = 'groot'; yield* wait(1); SN.face = 1; yield* wait(.9); SN.face = -1; yield* wait(.6);
    // he runs back… the corridor just goes on
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    SN.face = 1; T.walking(SN, true, 16); DEC.speed = -2.4; yield* tween(4, p => { SN.cx = W / 2 + 40 + Math.sin(p * Math.PI) * 30; }); DEC.speed = 0; T.walking(SN, false);
    SN.face = -1; T.walking(SN, true, 16); DEC.speed = 2.4; yield* wait(3); DEC.speed = 0; T.walking(SN, false);
    emote('!?', 1.8, SN); yield* wait(1.5);
    // far away at the end of the corridor: another little dog. Is it…? It's him. An echo.
    const echo = K.pet('snoet', 1); echo.cx = W / 2 + 4; echo.feet = 296; echo.s = .2; echo.face = 1; echo.alpha = 0; echo.filter = 'brightness(0.55) saturate(0.6)';
    yield* tween(1.5, p => { echo.alpha = p * .9; });
    SN.eyes = 'groot'; emote('!', 1.2, SN); yield* wait(.8); SN.eyes = ''; emote('heart', 1.2, SN); yield* tween(.8, p => { SN.sx = 1 + Math.sin(p * 30) * .05; }); SN.sx = 1;
    echo.face = -1; yield* wait(.6);
    T.walking(SN, true, 18); const ex0 = SN.cx;
    yield* tween(4, p => { const e = ez(p); SN.cx = lerp(ex0, W / 2 + 20, e); SN.feet = lerp(FEET, 320, e); SN.s = lerp(.85, .26, e); echo.alpha = .9 * (1 - p); });
    T.walking(SN, false); echo.alpha = 0; hold(SN, 'stand');
    emote('?', 1.6, SN); yield* wait(1.2); SN.face = 1; yield* wait(.6); SN.face = -1; yield* wait(1);
    yield* K.cut(() => { SN.cx = W / 2 + 40; SN.feet = FEET; SN.s = .85; SN.face = -1; }, .5);
    hold(SN, 'sit'); SN.eyes = ''; T.tears(SN, 4);
    yield* K.lensW({ z: 2.6, cx: SN.cx, cy: FEET - 60 }, 3);
    yield* wait(1.4);
    // back home: the others wake up
    yield* K.cut(() => { K.unstage(); K.grade('goud', .5, .01); K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0); solo(false); }, .6);
    yield* wait(2);
    const wf = G('wifi') || others[0];
    if (wf) { hold(wf, null); wf.eyes = ''; yield* wait(.6); look(wf, K.kx() + 130); emote('?', 1.6, wf); yield* petTo(wf, K.kx() + 130, 50); hold(wf, 'down'); emote('dots', 1.6, wf); yield* wait(1.8);
      hold(wf, null); wf.eyes = 'groot'; emote('!', 1.2, wf); for (let k = 0; k < 3; k++) { yield* petJump(wf, 22, .28); emote('burst', .4, wf); } }
    stop(zz); kam.eyes = 'groot'; kam.face = 1; emote('!', 1.2); others.forEach(a => { hold(a, SIT(a)); a.eyes = ''; });
    yield* wait(1);
    // Kamiel counts them: one, two, three, four… where is Snoet?
    const row = others.slice().sort((a, b) => a.cx - b.cx);
    for (const a of row) { yield* K.lensW({ z: 2.2, cx: a.cx, cy: FEET - 70 }, .7); emote('dots', .8); yield* wait(.5); }
    yield* K.lensW({ z: 2.2, cx: K.kx() + 130, cy: FEET - 70 }, .7);
    yield* wait(1);   // an empty spot in the grass
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .5);
    kam.eyes = 'groot'; emote('!?', 1.8); others.forEach(a => { a.eyes = 'groot'; emote('!', 1.4, a); }); yield* wait(1.6);
    // he calls
    kam.mouth = .8; kam.head = -.15; call(kamMouth, -1, 2.4); yield* wait(2.4); kam.mouth = 0; kam.head = 0; yield* wait(.8);
    kam.mouth = .8; kam.face = -1; call(kamMouth, 1, 2.4); yield* wait(2.4); kam.mouth = 0; kam.face = 1;
    others.forEach(a => { a.eyes = ''; }); kam.eyes = 'boos'; emote('!', 1.4);
    yield* par(hop(24, .35), ...others.map(a => { hold(a, null); return petJump(a, 24, .35); }));
    // the search starts: out into the world
    yield* K.journey(1, 90, others);
    others.forEach(a => { a.face = 1; }); kam.eyes = '';
    // sniffing: little paw prints, and then… nothing, just a glitter of light
    const prints = T.props('ground');
    for (let k = 0; k < 9; k++) { const wx = K.toWorld(120 + k * 70); prints.push({ wx, draw: (g, x) => { g.fillStyle = 'rgba(60,40,30,.55)'; g.fillRect(Math.round(x), FEET + 14 + (k % 2) * 8, 8, 6); g.fillRect(Math.round(x) - 2, FEET + 10 + (k % 2) * 8, 3, 3); g.fillRect(Math.round(x) + 3, FEET + 9 + (k % 2) * 8, 3, 3); g.fillRect(Math.round(x) + 8, FEET + 10 + (k % 2) * 8, 3, 3); } }); }
    const glit = { wx: K.toWorld(760), draw: (g, x) => { for (let k = 0; k < 6; k++) { if (Math.sin(K.t * 5 + k * 1.7) > .3) K.sprC(g, K.SP.spark, x + (k * 37) % 70 - 35, FEET - 10 - (k * 23) % 60, 2); } } };
    prints.push(glit);
    if (wf) { hold(wf, 'down'); emote('dots', 1.4, wf); yield* wait(.6);
      for (const x of [300, 440, 580, 700]) { hold(wf, null); yield* petTo(wf, x, 70); hold(wf, 'down'); yield* wait(.6); }
      hold(wf, 'sit'); wf.eyes = 'groot'; emote('?', 2, wf); }
    yield* walkTo(80, 50); kam.face = 1; kam.head = .3; emote('?', 2); yield* wait(2.4); kam.head = 0;
    // the chess floor, the doors
    yield* K.cut(() => { K.stage(chess); K.grade('magie', .2, .01); DEC.scroll = 0; solo(true); SN.cx = 200; SN.feet = FEET; SN.s = .85; SN.face = 1; SN.eyes = ''; hold(SN, null); }, .6);
    T.walking(SN, true, 9); DEC.speed = 18;
    yield* tween(5, p => { SN.cx = 200 + p * 120; });
    T.walking(SN, false); DEC.speed = 0; hold(SN, 'stand');
    // a door comes down, close by, and opens
    const dd = doors[2]; dd.open = 0;
    yield* K.lensW({ z: 1.4, cx: 520, cy: 330 }, 1.6);
    yield* tween(2, p => { dd.open = p; }); SN.eyes = 'groot'; emote('!', 1.2, SN);
    yield* wait(1); hold(SN, 'down'); SN.eyes = 'groot';
    // a brave little bark
    hold(SN, null); for (let k = 0; k < 3; k++) { yield* petJump(SN, 18, .25); emote('burst', .4, SN); }
    // SLAM
    yield* tween(.15, p => { dd.open = 1 - p; }); K.lens({ shake: 6 }, 0); yield* wait(.25); K.lens({ shake: 0 }, .3);
    SN.eyes = 'x'; emote('!', 1, SN); yield* petJump(SN, 50, .4, SN.cx - 60);
    SN.eyes = ''; SN.face = -1; T.walking(SN, true, 20); DEC.speed = -60; yield* wait(1.8);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .6);
    yield* wait(1.4); DEC.speed = 0; T.walking(SN, false);
    hold(SN, 'sit'); emote('sweat', 2, SN); yield* wait(2);
    // the missing poster: Snoet's face, nothing else
    const portrait = T.cv(36, 31); { const pg = portrait.getContext('2d'); K.A.drawPet(pg, { pet: 'snoet', cx: 18, feet: 31 - 3.28 * .305, s: .305, face: -1, pose: 'stand', noShadow: true }); }
    const poster = T.paint(30, 38, (r, g) => { r(0, 0, 30, 38, '#c8b896'); r(1, 1, 28, 36, '#f4ecd8'); r(1, 36, 28, 1, '#ddd0b4'); r(3, 3, 24, 22, '#ffffff'); r(3, 3, 24, 1, '#e8e0cc');
      g.imageSmoothingEnabled = false; g.drawImage(portrait, 0, 0, 24, 24, 4, 3, 22, 22);
      r(5, 28, 3, 3, '#7a4a2a'); r(4, 27, 1, 1, '#7a4a2a'); r(6, 26, 1, 1, '#7a4a2a'); r(8, 27, 1, 1, '#7a4a2a');   // a paw
      r(19, 27, 2, 1, '#ff3d8b'); r(23, 27, 2, 1, '#ff3d8b'); r(18, 28, 8, 2, '#ff3d8b'); r(19, 30, 6, 1, '#ff3d8b'); r(20, 31, 4, 1, '#ff3d8b'); r(21, 32, 2, 1, '#ff3d8b');   // a heart
      r(12, 0, 6, 2, 'rgba(255,255,255,.6)'); });
    const post = T.paint(5, 52, (r) => { r(1, 0, 3, 52, '#6e4622'); r(1, 0, 1, 52, '#8e6232'); r(0, 50, 5, 2, '#4a2e16'); });
    yield* K.cut(() => { K.unstage(); K.grade('sepia', .45, .01); T.goto(1); solo(false); kam.x = -100; kam.face = 1; others.forEach((a, i) => { hold(a, SIT(a)); a.cx = 150 + i * 60; a.face = 1; a.eyes = ''; }); }, .6);
    const posters = T.props('back');
    const pst = { wx: K.toWorld(640), on: true, draw: (g, x) => { T.pxAt(g, post, x, FEET + 6, 4); T.pxAt(g, poster, x, FEET - 110, 3.4); } };
    posters.push(pst);
    yield* walkTo(40, 45); kam.face = 1;
    const pp = G('pippa'), pb = G('pebbels'), db = G('dobby');
    if (pp) { yield* petTo(pp, 560, 60); pp.face = 1; hold(pp, 'paw'); yield* wait(1.2); hold(pp, 'sit'); emote('sparks', 1, pp); }
    yield* K.lensW({ z: 2.4, cx: 640, cy: FEET - 170 }, 2.2);
    yield* wait(2);
    if (pb) { pb.cx = 760; pb.face = -1; hold(pb, 'sit'); }
    yield* K.lensW({ z: 1.6, cx: 680, cy: FEET - 140 }, 1.2);
    if (pb) { pb.eyes = 'groot'; yield* wait(.8); pb.eyes = ''; T.tears(pb, 3); yield* wait(2); }
    if (db) { db.cx = 860; db.face = -1; hold(db, 'down'); yield* wait(.4); db.sq = .9; K.lens({ shake: 3 }, 0); yield* wait(.2); db.sq = 1; K.lens({ shake: 0 }, .2); yield* wait(.4); db.sq = .9; K.lens({ shake: 3 }, 0); yield* wait(.2); db.sq = 1; K.lens({ shake: 0 }, .2); emote('angry', 1.4, db); yield* wait(1); }
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
    // Pippa climbs on Kamiel to look out over the land
    if (pp) { hold(pp, null); yield* petTo(pp, K.kx() - 70, 80); pp.layer = 'front'; hold(pp, 'jump'); const x0 = pp.cx;
      yield* tween(.5, p => { const b = K.kp(560, 470); pp.cx = lerp(x0, b.x, p); pp.feet = lerp(FEET, b.y + 8, p) - Math.sin(p * Math.PI) * 50; });
      hold(pp, 'sit'); const rideP = T.each(() => { const b = K.kp(560, 470); pp.cx = b.x; pp.feet = b.y + 8; });
      yield* K.lensW({ z: 1.7, cx: K.kx(), cy: FEET - 230 }, 1.2);
      for (const f of [1, -1, 1]) { pp.face = f; kam.face = f; kam.head = -.15; emote('?', 1.2, pp); yield* wait(1.5); }
      emote('dots', 1.6, pp); yield* wait(1.4); kam.head = 0;
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
      stop(rideP); hold(pp, 'jump'); const x1 = pp.cx, y1 = pp.feet; yield* tween(.5, p => { pp.cx = x1 + 90 * p; pp.feet = lerp(y1, FEET, p) - Math.sin(p * Math.PI) * 40; }); hold(pp, 'sit'); pp.layer = 'back'; }
    kam.eyes = 'triest'; emote('dots', 2); yield* wait(2);
    yield* K.fadeOut(1.8);
    posters.forEach(p => { p.on = false; });
    yield* K.card('DEEL 3', 'DE NACHT', 2.6, { size: 44 });

    /* ================= DEEL 3: the night, the lamp posts, a howl ================= */
    // Snoet among the lamp posts
    K.stage(forest); K.grade('nacht', .3, .01); K.setv('dark', .38, .01); DEC.scroll = 0; DEC.speed = 0;
    const lampLights = lamps.filter(l => l.z > .8).map(l => K.light(() => l.on > 0 ? { x: lampX(l), y: lampBase(l) - 41 * (1.4 + l.z * 3.2) + 70 } : null, 200, { flicker: .05 }));
    const mst = mist(.6);
    solo(true); SN.cx = 260; SN.face = 1; SN.feet = FEET; hold(SN, null); SN.eyes = '';
    const snL = K.light(() => SN.alpha > 0 ? { x: SN.cx, y: FEET - 50 } : null, 170, { a: .8 });
    yield* K.fadeIn(1.8);
    T.walking(SN, true, 8); DEC.speed = 40; yield* wait(5); DEC.speed = 0; T.walking(SN, false);
    // a long shadow… his own
    const shad = { on: true, k: 0 };
    const shF = fx('ground', 0, (g) => { if (!shad.on) return; const x = SN.cx, y = FEET; g.fillStyle = `rgba(0,0,10,${.55 * shad.k})`; g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x + 30, y); g.lineTo(x + 260 * shad.k, y - 170 * shad.k); g.lineTo(x + 170 * shad.k, y - 190 * shad.k); g.closePath(); g.fill(); });
    yield* tween(2, p => { shad.k = p; });
    SN.face = 1; SN.eyes = 'groot'; emote('!', 1, SN); yield* petJump(SN, 40, .35, SN.cx - 40);
    hold(SN, 'down'); for (let k = 0; k < 3; k++) { emote('burst', .4, SN); yield* tween(.3, p => { SN.sq = 1 + Math.sin(p * Math.PI) * .08; }); }
    yield* wait(.8); hold(SN, null); SN.eyes = ''; SN.face = -1; yield* wait(.5); SN.face = 1; emote('sweat', 1.6, SN); yield* wait(1.2);   // oh. That's me.
    shad.on = false; stop(shF);
    // one by one, the lamps go out behind him
    const behind = lamps.filter(l => l.z > .55).sort((a, b) => lampX(a) - lampX(b));
    for (const l of behind.slice(0, 5)) { l.on = 0; yield* wait(.6); l.on = 1; yield* wait(.15); l.on = 0; SN.face = -SN.face; yield* wait(.5); }
    K.setv('dark', .42, 2);
    hold(SN, 'lie'); SN.eyes = ''; T.tears(SN, 5);
    yield* K.lensW({ z: 2.4, cx: SN.cx + 10, cy: FEET - 50 }, 3);
    yield* wait(2.2);
    // cut: the others, at night, with a lantern
    yield* K.cut(() => { K.unstage(); stop(mst); lampLights.forEach(l => { l.off = true; }); solo(false); K.lens({ z: 1, cx: W / 2, cy: H / 2 }, 0); K.setv('dark', .45, .01); K.grade('nacht', .6, .01);
      T.goto(1); LAN.on = true; kam.x = 0; kam.face = 1; kam.eyes = ''; others.forEach((a, i) => { hold(a, null); a.cx = 140 + i * 70; a.face = 1; a.eyes = ''; }); }, .6);
    const moon = fx('sky', 0, (g) => { g.fillStyle = 'rgba(250,245,220,.95)'; g.beginPath(); g.arc(760, 150, 34, 0, 7); g.fill(); g.fillStyle = 'rgba(200,195,180,.5)'; g.fillRect(745, 140, 10, 8); g.fillRect(768, 158, 12, 8); });
    yield* K.journey(1, 70, others);
    others.forEach(a => { a.face = 1; });
    kam.mouth = .8; call(kamMouth, -1, 2); yield* wait(2); kam.mouth = 0;
    // Wifi howls at the moon; the others join in
    const howler = G('wifi') || others[0];
    if (howler) {
      hold(howler, 'sit'); howler.face = 1; yield* K.lensW({ z: 1.8, cx: howler.cx + 60, cy: FEET - 130 }, 1.4);
      howler.r = -.4; emote('notes', 4, howler); call(() => { const n = K.A.petPoint(howler, 'nose'); return { x: n.x, y: n.y - 6 }; }, 0, 4);
      yield* wait(2.4);
      yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.2);
      others.forEach(a => { if (a !== howler) { hold(a, SIT(a)); a.r = -.3; emote('notes', 3, a); } }); kam.head = -.35; kam.mouth = .6; emote('notes', 3);
      yield* wait(3); others.forEach(a => { a.r = 0; }); kam.head = 0; kam.mouth = 0; howler.r = 0;
    }
    // cut: in the lamp forest, a tired dog lifts his head
    yield* K.cut(() => { K.stage(forest); K.grade('nacht', .35, .01); K.setv('dark', .4, .01); solo(true); K.lens({ z: 2.4, cx: SN.cx + 10, cy: FEET - 50 }, 0); }, .5);
    const mst2 = mist(.6);
    yield* wait(1);
    // far away: a howl
    call(() => ({ x: 60, y: 300 }), 1, 3, 'rgba(255,230,180,.8)');
    yield* wait(1); hold(SN, 'stand'); SN.eyes = 'groot'; emote('!', 1.4, SN); yield* wait(.6); SN.face = -1; yield* wait(.4);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1);
    hold(SN, null); for (let k = 0; k < 3; k++) { yield* petJump(SN, 26, .3); emote('burst', .4, SN); }
    call(() => { const n = K.A.petPoint(SN, 'nose'); return n; }, -1, 2);
    // and a warm light between the posts
    const warm = { on: true, x: -60, a: 0 };
    const warmL = K.light(() => warm.on ? { x: warm.x, y: FEET - 120 } : null, 260, { col: '255,170,80', a: .8 });
    yield* tween(2, p => { warm.x = lerp(-60, 60, p); });
    SN.eyes = ''; emote('heart', 1.4, SN); yield* wait(.6);
    yield* K.cut(() => { stop(mst2); K.unstage(); K.grade('nacht', .6, .01); K.setv('dark', .45, .01); solo(false); warm.on = false; others.forEach(a => { hold(a, null); }); }, .4);
    // here: a tiny bark, far away. Everyone hears it.
    call(() => ({ x: W - 40, y: 320 }), -1, 2.4, 'rgba(255,255,255,.8)');
    yield* wait(.8); kam.eyes = 'groot'; emote('!', 1.4); others.forEach(a => { a.eyes = 'groot'; a.face = 1; emote('!', 1.2, a); }); yield* wait(1.4);
    others.forEach(a => { a.eyes = ''; });
    yield* K.journey(1, 150, others);
    // into the lamp forest: they see each other
    stop(moon);
    yield* K.cut(() => { K.stage(forest); K.grade('nacht', .3, .01); K.setv('dark', .36, .01); LAN.on = true; lamps.forEach(l => { l.on = 1; }); lampLights.forEach(l => { l.off = false; });
      kam.x = -260; kam.face = 1; kam.alpha = 1; others.forEach((a, i) => { a.cx = 40 + i * 50; a.face = 1; a.alpha = 1; }); SN.alpha = 1; SN.cx = W - 120; SN.face = -1; hold(SN, 'stand'); SN.eyes = ''; }, .6);
    const mst3 = mist(.5);
    yield* wait(.8);
    SN.eyes = 'groot'; kam.eyes = 'groot'; others.forEach(a => { a.eyes = 'groot'; }); yield* wait(1);
    yield* K.lensW({ z: 2.2, cx: SN.cx, cy: FEET - 60 }, .5); yield* wait(1);
    yield* K.lensW({ z: 1.8, cx: K.kx() + 40, cy: FEET - 130 }, .5); yield* wait(1);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, .5);
    // SLOW MOTION: running toward each other
    T.slowIn(); K.grade('warm', .5, 1.5); K.setv('dark', .2, 3);
    const hearts = K.particles('front', { until: K.t + 6, emit: (ps) => { if (rnd() < .2) ps.push(K.P({ x: rnd() * W, y: FEET - rnd() * 200, vy: -30, life: 2 })); },
      draw: (g, p, k) => { g.globalAlpha = Math.sin(k * Math.PI); K.sprC(g, K.SP.heart, p.x, p.y, 3); g.globalAlpha = 1; } });
    const meet = W / 2 + 40;
    T.walking(SN, true, 6);
    others.forEach(a => T.walking(a, true, 5)); kam.pose = 'walk'; kam.rate = 3; kam.face = 1;
    const sx0 = SN.cx, kx0 = kam.x, ox = others.map(a => a.cx);
    yield* tween(5.5, p => { SN.cx = lerp(sx0, meet + 30, p); SN.lift = Math.abs(Math.sin(p * Math.PI * 4)) * 14; kam.x = lerp(kx0, meet - W / 2 - 190, p);
      others.forEach((a, i) => { a.cx = lerp(ox[i], meet - 70 - i * 40, p); a.lift = Math.abs(Math.sin(p * Math.PI * 4 + i)) * 10; }); });
    SN.lift = 0; others.forEach(a => { a.lift = 0; T.walking(a, false); }); T.walking(SN, false); kam.pose = '';
    // the jump into everyone's arms
    yield* petJump(SN, 90, .9, meet - 60);
    K.flash(.8, '255,240,210', 2); T.slowOut('warm', .55);
    stop(hearts);
    kam.eyes = 'blij'; kam.blush = true; emote('hearts', 3); others.forEach(a => { a.eyes = ''; emote('hearts', 3, a); }); emote('hearts', 3, SN);
    // licks for everyone
    for (const a of others) { yield* petTo(SN, a.cx + 50, 200); SN.face = -1; a.eyes = 'dicht'; yield* tween(.6, p => { SN.sx = 1 + Math.sin(p * 30) * .07; }); SN.sx = 1; a.eyes = ''; emote('heart', 1, a); }
    yield* petTo(SN, K.kx() + 90, 200); SN.face = -1; hold(SN, 'down'); kam.eyes = 'dicht'; kam.head = .35; emote('hearts', 2.4); emote('hearts', 2.4, SN);
    yield* tween(2.2, p => { SN.sx = 1 + Math.sin(p * 30) * .06; }); SN.sx = 1; kam.head = 0; kam.eyes = 'blij';
    // the lamps all burn bright; the dark lifts
    // everyone close together, around him
    yield* par(...others.map((a, i) => petTo(a, SN.cx + (i % 2 ? 1 : -1) * (50 + Math.floor(i / 2) * 40), 120)));
    others.forEach(a => { look(a, SN.cx); hold(a, 'down'); emote('heart', 2.4, a); }); hold(SN, 'sit'); SN.eyes = 'hart';
    yield* K.lensW({ z: 1.8, cx: SN.cx - 40, cy: FEET - 120 }, 4);
    lamps.forEach(l => { l.on = 1; }); K.setv('dark', 0, 3);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 1.5); SN.eyes = '';
    yield* par(hop(30, .4), ...others.concat([SN]).map(a => { hold(a, null); return petJump(a, 30, .4); }));
    yield* wait(1.5);
    yield* K.fadeOut(1.8);
    yield* K.card('DEEL 4', 'NAAR HUIS', 2.6, { size: 44 });

    /* ================= DEEL 4: home, in the sunset ================= */
    stop(mst3); K.unstage(); lampLights.forEach(l => K.unlight(l)); LAN.on = false; K.unlight(warmL); prints.length = 0;
    K.setv('dark', 0, .01); K.grade('warm', .6, .01); K.setv('vig', .75, .01); kam.blush = false;
    const sunset = T.sunset(800, 420);
    kam.x = 0; kam.face = -1; kam.eyes = 'blij';
    others.forEach((a, i) => { a.cx = W / 2 + 140 + i * 60; a.face = -1; a.eyes = ''; hold(a, null); });
    // Snoet rides on Kamiel's back, falling asleep
    SN.layer = 'front'; hold(SN, 'lie'); SN.face = -1;
    const ride = T.each(() => { const b = K.kp(640, 470); SN.cx = b.x; SN.feet = b.y + 10; });
    yield* K.fadeIn(2.2);
    const zzS = emote('zzz', 30, SN);
    yield* K.journey(-1, 55, others);
    kam.eyes = 'dicht'; yield* wait(1.4); kam.eyes = 'blij';
    yield* K.lensW({ z: 1.8, cx: K.kx() + 40, cy: FEET - 190 }, 2.5);
    yield* wait(2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: H / 2 }, 2);
    const dbh = G('dobby'); if (dbh) { for (let k = 0; k < 2; k++) { hold(dbh, 'jump'); yield* tween(.6, p => { dbh.lift = Math.sin(p * Math.PI) * 50; dbh.r = Math.sin(p * Math.PI * 2) * .4; }); dbh.lift = 0; dbh.r = 0; hold(dbh, null); yield* wait(.3); } emote('hearts', 1.6, dbh); kam.eyes = 'blij'; yield* wait(1.2); }
    yield* K.journey(-1, 55, others);
    // home: everyone lies down close together
    stop(ride); stop(zzS);
    yield* tween(.6, p => { const b = K.kp(640, 470); SN.cx = lerp(b.x, K.kx() + 110, p); SN.feet = lerp(b.y + 10, FEET, p) - Math.sin(p * Math.PI) * 20; });
    SN.layer = 'back'; hold(SN, 'sleep'); SN.face = -1;
    yield* par(...others.map((a, i) => petTo(a, K.kx() + 170 + i * 50, K.PET[a.pet].run * .5)));
    others.forEach(a => { a.face = -1; hold(a, a.pet === 'dobby' ? 'lie' : 'sleep'); });
    kam.face = 1; kam.head = .35; kam.eyes = 'dicht';
    const zz2 = emote('zzz', 20);
    yield* wait(3);
    // the little light comes back…
    WISP.on = true; WISP.a = 1; WISP.x = W + 30; WISP.y = 280;
    yield* tween(4, p => { WISP.x = lerp(W + 30, SN.cx + 60, ez(p)); WISP.y = 280 + Math.sin(p * 7) * 30 + p * 170; });
    yield* K.lensW({ z: 2.4, cx: SN.cx + 30, cy: FEET - 70 }, 1.6);
    hold(SN, 'lie'); SN.eyes = 'groot'; yield* wait(1.4);
    // …Kamiel's head comes down on him. Not tonight.
    kam.head = .55; yield* wait(1); SN.eyes = ''; hold(SN, 'sleep'); emote('heart', 2, SN);
    yield* tween(3, p => { WISP.a = 1 - p; WISP.y -= 20 * K.dt; WISP.x += 30 * K.dt; }); WISP.on = false;
    yield* K.lensW({ z: 1.2, cx: K.kx() + 100, cy: FEET - 160 }, 3);
    yield* wait(2.5);
    stop(zz2); K.unover(wispGlow);
    yield* K.ending('EINDE');
    sunset.stop();
  } };
})();
