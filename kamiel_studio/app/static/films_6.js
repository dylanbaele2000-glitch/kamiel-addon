/* Kamiel films, part 6: see "cinema" in events.js for the building blocks (K). */
(function () {
  const F = window.KamielFilms = window.KamielFilms || {};

  const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // a colour between the wasteland (a) and the healed world (b), darkened by the night (n)
  function colr(a, b, p, n, k) {
    const A = hex(a), B = hex(b), N = [12, 16, 40], kk = k === undefined ? .8 : k;
    return 'rgb(' + A.map((v, i) => { const c = v + (B[i] - v) * p; return Math.round(c + (N[i] - c) * n * kk); }).join(',') + ')';
  }
  const R = (g, x, y, w, h, c) => { if (c) g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  function disc(g, cx, cy, r, u, col, flat) {
    g.fillStyle = col; const f = flat || 1;
    for (let dy = -r; dy < r; dy += u) { const yy = dy + u / 2, hw = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) / u) * u; if (hw > 0) g.fillRect(Math.round(cx - hw), Math.round(cy + dy * f), hw * 2, Math.ceil(u * f)); }
  }
  const HZ = 430;   // the horizon of the wasteland

  /* the decor: an orange, dusty world after the end, that turns green again as S.heal goes from 0 to 1 */
  function wasteland(K, S) {
    const W = K.W, H = K.H;
    const SKY = [['#3a2626', '#2c5fb8'], ['#5a3324', '#3f78cc'], ['#7d4428', '#5690dc'], ['#a0582e', '#6ea6e4'], ['#c0703a', '#88baea'], ['#d88a4a', '#a3cbee'], ['#e6a462', '#c0dcf0']];
    return (g) => {
      const cam = K.A.cam(), heal = S.heal, n = S.night, bh = HZ / SKY.length;
      SKY.forEach((b, i) => {
        R(g, 0, Math.floor(i * bh), W, Math.ceil(bh) + 1, colr(b[0], b[1], heal, n));
        if (i < SKY.length - 1) { g.fillStyle = colr(SKY[i + 1][0], SKY[i + 1][1], heal, n); for (let x = (i % 2) * 4; x < W; x += 8) g.fillRect(x, Math.floor((i + 1) * bh) - 4, 4, 4); }
      });
      if (n > .05) for (let i = 0; i < 110; i++) {   // stars
        const tw = .5 + .5 * Math.sin(K.t * (1 + hash(i) * 3) + i), s = hash(i * 7) < .12 ? 3 : 2;
        g.fillStyle = `rgba(255,248,225,${n * (.3 + .7 * tw)})`; g.fillRect(Math.round(hash(i + 3) * W), Math.round(20 + hash(i * 5) * (HZ - 90)), s, s);
      }
      // the sun (or the moon), a pale disc in the haze
      const sa = S.sun, sx = 60 + sa * (W - 120), sy = HZ + 20 - Math.sin(sa * Math.PI) * 330;
      if (sy < HZ + 10) {
        const moon = n > .5, rr = moon ? 20 : 30;
        const gl = g.createRadialGradient(sx, sy, rr, sx, sy, rr * 4.5);
        gl.addColorStop(0, moon ? 'rgba(220,230,255,.22)' : `rgba(255,${200 + Math.round(heal * 40)},150,.38)`); gl.addColorStop(1, 'rgba(255,200,150,0)');
        g.fillStyle = gl; g.fillRect(sx - rr * 5, sy - rr * 5, rr * 10, rr * 10);
        disc(g, sx, sy, rr, 4, moon ? '#e8ecf4' : colr('#f2d49a', '#fff6d6', heal, 0));
      }
      if (S.shoot > 0 && S.shoot < 1) {   // a shooting star
        const p = S.shoot, x = 700 - p * 420, y = 70 + p * 120;
        for (let k = 0; k < 14; k++) R(g, x + k * 6, y - k * 1.7, 4, 3, `rgba(255,250,220,${(1 - k / 14) * (1 - p * .6)})`);
      }
      // far ruins (slow parallax); ivy grows on them when the world heals
      const off = -cam * .12, span = W + 520;
      for (let b = 0; b < 15; b++) {
        const x = (((b * 181 + off) % span) + span) % span - 260, w = 40 + Math.floor(hash(b) * 9) * 8, h = 60 + hash(b + 9) * 140;
        const col = colr('#5e3a2c', '#6a7888', heal * .7, n, .75), dark = colr('#3a2219', '#3c4652', heal * .7, n, .75);
        R(g, x, HZ - h + 24, w, h, col);
        for (let k = 0; k < w / 8; k++) { const up = Math.floor(hash(b * 31 + k) * 5) * 6; if (up) R(g, x + k * 8, HZ - h + 24 - up, 8, up, col); }
        for (let r = 0; r < h / 22 - 1; r++) for (let c = 0; c < w / 14 - 1; c++) if (hash(b * 7 + r * 13 + c) < .45) R(g, x + 6 + c * 14, HZ - h + 34 + r * 22, 5, 8, dark);
        if (heal > 0) { g.fillStyle = colr('#3f7a2e', '#4f9a38', 0, n, .7); for (let k = 0; k < w / 8; k++) { const len = heal * h * hash(b * 3 + k * 5); if (hash(b + k * 11) < .55) for (let y = 0; y < len; y += 6) if (hash(k + y) < .8) g.fillRect(Math.round(x + k * 8 + (hash(y + k) < .5 ? 0 : 4)), Math.round(HZ - h + 24 + y), 4, 4); } }
      }
      // dunes in between (middle parallax)
      const off2 = -cam * .35;
      g.fillStyle = colr('#8a6040', '#5b8a3c', heal, n, .75);
      for (let x = 0; x < W; x += 8) { const wx = x - off2, h = 18 + 14 * Math.sin(wx * .007) + 8 * Math.sin(wx * .019 + 2); const y = HZ - Math.round(h / 4) * 4; g.fillRect(x, y, 8, H - y); }
      // the ground
      R(g, 0, HZ, W, H - HZ, colr('#7a5b3e', '#5f9a3e', heal, n, .75));
      for (let k = 0; k < 4; k++) R(g, 0, HZ + 18 + k * 34, W, 4 + k * 2, colr('#86684a', '#6aa84a', heal, n, .75));
      // the near ground: cracks, pebbles, dead shrubs, and grass where life came back
      const T = 64, i0 = Math.floor((cam - W / 2 - T) / T), i1 = Math.floor((cam + W / 2 + T) / T);
      const crack = colr('#4a3524', '#3f6a2a', heal, n, .75), peb = colr('#9a7a58', '#8a8a78', heal * .5, n, .75);
      for (let i = i0; i <= i1; i++) {
        const x = W / 2 + i * T - cam, h1 = hash(i * 13.7), wx = i * T;
        if (h1 < .4 && heal < .9) { g.globalAlpha = 1 - heal; let cx = x, cy = K.FEET + 8 + hash(i) * 30; for (let s = 0; s < 6; s++) { R(g, cx, cy, 8, 3, crack); cx += 8; cy += (hash(i + s) < .5 ? -3 : 3); } g.globalAlpha = 1; }
        for (let k = 0; k < 3; k++) if (hash(i * 5 + k) < .5) R(g, x + hash(i + k * 9) * T, HZ + 30 + hash(i * 3 + k) * (H - HZ - 40), 4, 3, peb);
        if (hash(i * 3.1) < .14) {   // a dead shrub on the plain (later: a green one)
          const bx = x + 20, by = HZ + 26 + hash(i * 2) * 50, c = colr('#3b2a1e', '#2f6a28', heal, n, .75);
          R(g, bx, by - 22, 3, 22, c); R(g, bx - 9, by - 18, 9, 3, c); R(g, bx + 3, by - 26, 8, 3, c); R(g, bx - 12, by - 24, 3, 7, c); R(g, bx + 10, by - 32, 3, 7, c);
          if (heal > .5) { g.fillStyle = colr('#4f9a38', '#6cc04a', heal, n, .7); for (let k = 0; k < 10; k++) g.fillRect(Math.round(bx - 12 + hash(i + k) * 26), Math.round(by - 34 + hash(i * 2 + k) * 18), 4, 4); }
        }
        if (heal > 0 && Math.abs(wx - S.treeWX) < S.grassR) {   // grass and flowers
          g.fillStyle = colr('#4f9a38', '#78c858', hash(i), n, .7);
          for (let k = 0; k < 9; k++) { const gx = x + hash(i * 7 + k) * T, gy = HZ + 14 + hash(i * 11 + k) * (H - HZ - 20), gh = 4 + Math.floor(hash(k + i) * 3) * 3; g.fillRect(Math.round(gx), Math.round(gy - gh), 3, gh); g.fillRect(Math.round(gx + 4), Math.round(gy - gh + 3), 3, gh - 3); }
          if (heal > .6) for (let k = 0; k < 2; k++) if (hash(i * 17 + k) < .6) { const fx_ = x + hash(i * 19 + k) * T, fy = HZ + 20 + hash(i * 23 + k) * (H - HZ - 30); R(g, fx_, fy, 4, 4, ['#ffd23f', '#ff8fb8', '#ffffff', '#b98cff'][Math.floor(hash(i + k * 3) * 4)]); }
        }
      }
    };
  }

  /* the things lying around in this world (world coordinates: they stay put while the camera walks on) */
  function wrecks(K) {
    const list = [];
    const draw = {
      car: (g, x, o) => {   // a rusted car, sunk into the sand
        const u = 4, y = K.FEET + 6, rust = '#8a4a2a', dk = '#5e2e1a', lt = '#b0683a';
        R(g, x - 16 * u, y - 9 * u, 32 * u, 7 * u, rust); R(g, x - 9 * u, y - 14 * u, 16 * u, 5 * u, rust);
        R(g, x - 7 * u, y - 13 * u, 6 * u, 4 * u, '#2a1a14'); R(g, x, y - 13 * u, 6 * u, 4 * u, '#2a1a14');
        R(g, x - 16 * u, y - 9 * u, 32 * u, u, lt); R(g, x - 9 * u, y - 14 * u, 16 * u, u, lt); R(g, x - 16 * u, y - 4 * u, 32 * u, u, dk);
        for (let k = 0; k < 8; k++) R(g, x - 14 * u + hash(k * 3) * 28 * u, y - 8 * u + hash(k * 5) * 4 * u, u, u, dk);
        R(g, x - 13 * u, y - 3 * u, 6 * u, 4 * u, '#1a1410'); R(g, x + 8 * u, y - 3 * u, 6 * u, 4 * u, '#1a1410');
        if (!o.doorOff) { R(g, x + 1 * u, y - 8 * u, 7 * u, 5 * u, '#7a3e22'); R(g, x + 6 * u, y - 7 * u, u, u, '#d8c8a0'); }
        else R(g, x + 1 * u, y - 8 * u, 7 * u, 5 * u, '#2a1a14');
      },
      bus: (g, x) => {   // an old bus on its side… well, half of one
        const u = 4, y = K.FEET + 8, b = '#b5632e', dk = '#6e3218', lt = '#d88a4a';
        R(g, x - 40 * u, y - 24 * u, 74 * u, 24 * u, b); R(g, x - 40 * u, y - 24 * u, 74 * u, 2 * u, lt); R(g, x - 40 * u, y - 6 * u, 74 * u, 2 * u, dk);
        for (let k = 0; k < 8; k++) R(g, x - 36 * u + k * 9 * u, y - 19 * u, 6 * u, 6 * u, '#2a1a14');
        R(g, x + 34 * u, y - 22 * u, 4 * u, 20 * u, b); R(g, x + 36 * u, y - 16 * u, 4 * u, 12 * u, dk);   // the crumpled front
        for (let k = 0; k < 14; k++) R(g, x - 38 * u + hash(k * 7) * 70 * u, y - 23 * u + hash(k * 3) * 20 * u, u * (1 + (k % 2)), u, dk);
        R(g, x - 30 * u, y - 2 * u, 8 * u, 4 * u, '#1a1410'); R(g, x + 18 * u, y - 2 * u, 8 * u, 4 * u, '#1a1410');
      },
      sign: (g, x) => {   // a crooked road sign (no words left on it)
        const u = 4, y = K.FEET - 6;
        R(g, x, y - 34 * u, u, 34 * u, '#5a5048');
        g.save(); g.translate(x, y - 34 * u); g.rotate(-.18);
        R(g, -10 * u, -8 * u, 20 * u, 9 * u, '#d8a838'); for (let k = 0; k < 5; k++) R(g, -10 * u + k * 4 * u, -8 * u, 2 * u, 9 * u, '#2a2018');
        g.restore();
      },
      pipe: (g, x, o) => {   // an old water pipe sticking out of the ground
        const u = 4, y = K.FEET + 4;
        R(g, x - 3 * u, y - 18 * u, 6 * u, 18 * u, '#7a7e86'); R(g, x - 3 * u, y - 18 * u, 2 * u, 18 * u, '#9aa0aa');
        R(g, x - 3 * u, y - 22 * u, 14 * u, 5 * u, '#7a7e86'); R(g, x + 9 * u, y - 23 * u, 3 * u, 7 * u, '#5a5e66');
        R(g, x - 6 * u, y - 14 * u, 12 * u, 2 * u, '#a8442a'); R(g, x - u, y - 16 * u, 2 * u, 6 * u, '#a8442a');   // the valve wheel
        if (o.rust) for (let k = 0; k < 6; k++) R(g, x - 2 * u + hash(k) * 4 * u, y - 17 * u + hash(k + 4) * 16 * u, u, u, '#8a4a2a');
      },
      rock: (g, x) => {
        const u = 4, y = K.FEET + 6;
        disc(g, x, y - 10 * u, 16 * u, u, '#6e6258', .6); disc(g, x - 3 * u, y - 13 * u, 9 * u, u, '#8a7e72', .55);
        R(g, x - 14 * u, y - 3 * u, 28 * u, 3 * u, '#4e443c');
      },
    };
    const fxr = K.fx('ground', 0, (g) => { for (const o of list) { if (o.on === false) continue; const x = K.toScreen(o.wx); if (x < -400 || x > K.W + 400) continue; draw[o.kind](g, x, o); } });
    return { list, add: (o) => { list.push(o); return o; }, fx: fxr };
  }

  /* NA HET EINDE — the world after the end: dust, ash and rust. The gang wanders through it with Kamiel's cart,
     finds water, shelters from a dust storm (and goes back into it for whoever got lost), and plants the one
     seed they find. The seed turns the world green again. Heidi turns out to have been fine all along. ~7 minutes. */
  F['film-apocalyps'] = { can: (K) => K.castNames().length > 0, run: function* (K) {
    const { W, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez, pick, P } = K;
    const names = K.castNames(); if (!names.length) return;
    const has = (n) => names.includes(n);
    const S = { heal: 0, night: 0, sun: .66, shoot: 0, treeWX: 0, treeH: 0, grassR: 0, flower: 0, bitten: 0 };
    const goggles = (g, at, u) => { const e = at('eye'); R(g, e.x - 6 * u, e.y - u, 13 * u, 2 * u, '#2a2018'); R(g, e.x - 2 * u, e.y - 2 * u, 4 * u, 4 * u, '#5a4030'); R(g, e.x - 1.5 * u, e.y - 1.5 * u, 3 * u, 3 * u, '#e0a040'); R(g, e.x - u, e.y - u, u, u, '#ffe8b0'); };

    // before the title: the world is already gone
    kam.x = W / 2 + 170; kam.face = -1;
    K.withOutfit(['gasmasker', 'stofbril', 'legerjas']);
    K.stage(wasteland(K, S));
    const WR = wrecks(K);
    const ash = K.weather('ash', .7); let dust = K.weather('dust', .25);
    yield* K.opening('NA HET EINDE', 'EEN OVERLEVINGSFILM MET KAMIEL', 'apocalyps');
    K.setv('vig', .6, 2); K.setv('bars', .55, 2);   // thinner bars: the ground (and what lies on it) stays in view

    /* ---------- part 1: the wanderers ---------- */
    const cart = { on: true, x: 0, y: FEET };
    const cartFx = fx('back', 0, (g) => {
      if (!cart.on) return; const x = K.kx() - kam.face * 160, y = FEET + 6, bob = kam.pose === 'walk' ? Math.abs(Math.sin(K.t * 6)) * 2 : 0; cart.x = x;
      const rp = K.kp(720, 640); g.strokeStyle = '#3a2a1e'; g.lineWidth = 3; g.beginPath(); g.moveTo(rp.x, rp.y); g.lineTo(x + kam.face * 40, y - 30 - bob); g.stroke();
      R(g, x - 40, y - 44 - bob, 80, 30, '#6b4a2a'); R(g, x - 40, y - 44 - bob, 80, 4, '#8a6440'); R(g, x - 40, y - 26 - bob, 80, 3, '#4a3020');
      R(g, x - 30, y - 62 - bob, 18, 18, '#c03a2a'); R(g, x - 28, y - 66 - bob, 6, 4, '#c03a2a'); R(g, x - 8, y - 58 - bob, 30, 14, '#8a8a6a'); R(g, x + 22, y - 54 - bob, 14, 10, '#5a6a8a');
      R(g, x - 30, y - 14, 12, 12, '#2a2018'); R(g, x + 18, y - 14, 12, 12, '#2a2018'); R(g, x - 26, y - 10, 4, 4, '#6a5a48'); R(g, x + 22, y - 10, 4, 4, '#6a5a48');
    });
    // the gang, in a line behind the cart
    const gang = names.map((n, i) => { const a = K.pet(n, 1); a.cx = W / 2 + 330 + i * 58; a.deco = goggles; return a; });
    const lineX = (i) => W / 2 + 40 + 250 + i * 56;
    const T1 = (kam.x - 40) / 40;
    yield* par(walkTo(40, 40), ...gang.map((a, i) => petTo(a, lineX(i), Math.max(20, (a.cx - lineX(i)) / T1))));
    gang.forEach(a => { a.face = -1; });
    // slowly closer: the dust in their goggles, the heat
    K.lens({ z: 1.35, cx: K.kx() + 60, cy: FEET - 140 }, 7);
    yield* wait(2); kam.face = 1; emote('dots', 2.2); yield* wait(2.4); kam.face = -1; yield* wait(1.5);
    // the canteen: shaken, upside down… one drop
    const can = { on: true, tip: 0 };
    const canFx = fx('front', 0, (g) => { if (!can.on) return; const p = K.kp(10, 430); g.save(); g.translate(p.x, p.y); g.rotate(can.tip * kam.face * -1);
      R(g, -9, -14, 18, 24, '#5a6a4a'); R(g, -9, -14, 18, 3, '#7a8a6a'); R(g, -4, -20, 8, 6, '#3a3a3a'); R(g, -9, 4, 18, 3, '#3e4a32'); g.restore(); });
    yield* wait(.8);
    yield* tween(1, p => { can.tip = p * 2.4; });
    yield* shiver(1.4, 3);
    const dropAt = K.kp(-20, 400); let dy = dropAt.y;
    const dropFx = fx('front', 1.4, (g, age) => { dy = dropAt.y + age * age * 260; K.sprC(g, K.SP.drop, dropAt.x, Math.min(FEET, dy), 3); });
    yield* wait(1.5);
    yield* K.lensW({ z: 2.2, cx: dropAt.x, cy: FEET - 40 }, 1.2);
    yield* wait(1.4);
    yield* tween(.6, p => { can.tip = 2.4 * (1 - p); }); can.on = false;
    kam.eyes = 'triest'; emote('tears', 3);
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 2);
    gang.forEach((a, i) => { if (a.pet === 'dobby') hold(a, 'lie'); else if (i % 2) hold(a, 'sit'); if (i % 2 === 0) emote('sweat', 2.5, a); });
    yield* wait(3.5);
    // the nose of a dog: water, somewhere that way
    const sn = gang.find(a => a.pet === 'snoet') || gang.find(a => a.pet === 'wifi') || gang[0];
    hold(sn, 'stand'); sn.face = -1; yield* wait(.6); hold(sn, 'down'); emote('dots', 2, sn); yield* wait(2); hold(sn, null);
    sn.eyes = 'groot'; emote('!', 1.4, sn); yield* petJump(sn, 24, .35); sn.eyes = '';
    yield* petTo(sn, -120, K.PET[sn.pet].run * 1.2); sn.alpha = 0;
    kam.eyes = 'groot'; emote('?', 1.6); gang.forEach(a => { if (a !== sn) { hold(a, null); a.face = -1; } }); yield* wait(1.8); kam.eyes = '';
    const walkers = gang.filter(a => a !== sn);
    // after her: one scene on, past an old car
    const car = WR.add({ kind: 'car', wx: K.A.center(-1) - 260 });
    WR.add({ kind: 'sign', wx: K.A.center(-1) + 520 });
    yield* K.journey(-1, 70, walkers);
    kam.face = -1; walkers.forEach(a => { a.face = -1; });
    yield* wait(1);
    // the car: Kamiel peeks in, Pebbels gets onto the roof, the door falls off
    yield* walkTo(-150, 45); kam.face = -1; kam.head = .2; emote('?', 1.8); yield* wait(2); kam.head = 0;
    const climber = walkers.find(a => a.pet === 'pebbels') || walkers.find(a => K.CATS.includes(a.pet)) || walkers[0];
    if (climber) {
      const cx = K.toScreen(car.wx);
      yield* petTo(climber, cx + 60, 60); climber.face = -1;
      hold(climber, 'jump'); const x0 = climber.cx; yield* tween(.5, p => { climber.cx = lerp(x0, cx + 10, p); climber.feet = FEET - Math.sin(p * Math.PI) * 50 - p * 52; }); hold(climber, 'sit'); climber.feet = FEET - 52;
      yield* wait(1.5); climber.face = 1; yield* wait(1);
      car.doorOff = true; K.lens({ shake: 4 }, 0);
      const door = { x: cx + 18, y: FEET - 22, r: 0 };
      const doorFx = fx('front', 1.4, (g) => { g.save(); g.translate(door.x, door.y); g.rotate(door.r); R(g, -14, -10, 28, 20, '#7a3e22'); g.restore(); });
      yield* tween(.5, p => { door.x = cx + 18 + p * 50; door.y = FEET - 22 + p * 26; door.r = p * 1.4; });
      K.lens({ shake: 0 }, .3);
      climber.eyes = 'groot'; kam.eyes = 'x'; emote('!', 1.2); emote('!', 1.2, climber);
      yield* par(hop(40, .4), petJump(climber, 60, .5, cx + 110)); climber.feet = FEET; hold(climber, null);
      yield* wait(.5); climber.eyes = ''; kam.eyes = 'groot'; emote('sweat', 2);
      walkers.forEach(a => { if (a !== climber) emote('dots', 1.8, a); });
      yield* wait(2.2); kam.eyes = '';
    }
    yield* par(walkTo(40, 50), ...walkers.map((a, i) => petTo(a, W / 2 + 40 + 250 + i * 56, 70)));
    walkers.forEach(a => { a.face = -1; });
    // and one more scene: there she is, digging at an old pipe
    const pipe = WR.add({ kind: 'pipe', wx: K.A.center(-1) - 200, rust: true });
    yield* K.journey(-1, 70, walkers);
    const px = () => K.toScreen(pipe.wx);
    sn.alpha = 1; sn.cx = px() + 46; sn.face = -1; hold(sn, 'down');
    const dirt = K.particles('front', { emit: (ps) => { if (rnd() < .5 && sn.alpha > 0 && sn.pose === 'down') ps.push(P({ x: sn.cx + 10, y: FEET - 4, vx: 40 + rnd() * 90, vy: -80 - rnd() * 70, grav: 360, life: .7 })); },
      draw: (g, p, k) => { R(g, p.x, p.y, 4, 4, `rgba(120,86,54,${1 - k})`); } });
    yield* wait(1.5);
    kam.face = -1; emote('!', 1.4); yield* wait(.8);
    yield* par(walkTo(-20, 55), ...walkers.map((a, i) => petTo(a, px() + 120 + i * 50, 80)));
    walkers.forEach(a => { a.face = -1; });
    const digger2 = walkers.find(a => a.pet === 'dobby') || walkers.find(a => a.pet === 'wifi');
    if (digger2) { yield* petTo(digger2, px() + 80, 60); digger2.face = -1; hold(digger2, 'down'); }
    yield* K.lensW({ z: 1.9, cx: px() + 40, cy: FEET - 70 }, 2);
    yield* wait(3);
    hold(sn, null); if (digger2) hold(digger2, null); stop(dirt);
    emote('dots', 2, sn); yield* wait(2);
    yield* K.lensW({ z: 1.2, cx: px() + 140, cy: FEET - 130 }, 1.4);
    // Kamiel gives the valve a good push with his head
    yield* walkTo(px() - W / 2 + 120, 40); kam.face = -1;
    for (let k = 0; k < 3; k++) { yield* tween(.25, p => { kam.head = .35 * p; kam.x -= 20 * K.dt; }); K.lens({ shake: 2 }, 0); yield* tween(.3, p => { kam.head = .35 * (1 - p); }); K.lens({ shake: 0 }, .2); yield* wait(.5); }
    emote('sweat', 1.5); yield* wait(1);
    yield* tween(.25, p => { kam.head = .45 * p; }); K.lens({ shake: 6 }, 0);
    // WATER
    pipe.rust = false;
    const spray = { on: true, rate: 5 };
    const fountain = K.particles('front', { emit: (ps) => { if (!spray.on) return; for (let k = 0; k < spray.rate; k++) ps.push(P({ x: px() + 40 + (rnd() - .5) * 6, y: FEET - 90, vx: -40 + (rnd() - .3) * 110, vy: -380 - rnd() * 160, grav: 900, life: 1.2 })); },
      draw: (g, p, k) => { if (p.y > FEET + 10) return; R(g, p.x, p.y, 4, 5, rnd() < .25 ? '#effbff' : '#7ec8ff'); } });
    const pud = { r: 0 };
    const pudFx = fx('ground', 0, (g) => { if (pud.r <= 0) return; const x = px() + 10, y = FEET + 18, rx = pud.r, ry = pud.r * .22;
      for (let dy = -ry; dy < ry; dy += 3) { const hw = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) * (dy / ry))); R(g, x - hw, y + dy, hw * 2, 3, dy < 0 ? '#5a9ad0' : '#4a86c0'); }
      for (let k = 0; k < 4; k++) { const a = (K.t * .8 + k / 4) % 1; R(g, x - rx * .6 * a - 10, y - 2 + k * 2, 20 * a + 6, 2, `rgba(220,240,255,${.6 * (1 - a)})`); } });
    const bow = { a: 0 };
    const bowFx = fx('back', 0, (g) => { if (bow.a <= 0) return; const cx = px() + 30, cy = FEET - 60, cols = ['#ff5a5a', '#ffa040', '#ffe060', '#6ad060', '#5aa8ff', '#9a6aff'];
      cols.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = bow.a * .55; const r = 170 - i * 7; for (let t = .1; t < Math.PI - .1; t += .022) g.fillRect(Math.round(cx + Math.cos(t) * r * 1.2), Math.round(cy - Math.sin(t) * r), 6, 6); });
      g.globalAlpha = 1; });
    K.flash(.8, '220,240,255', 2); kam.head = 0; K.lens({ shake: 0 }, .6);
    kam.eyes = 'x'; emote('!', 1.2); yield* hop(50, .45);
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 1.6);
    K.grade('warm', .6, 2); K.setv('grain', .4, 2);
    yield* par(tween(4, p => { pud.r = 40 + p * 110; bow.a = Math.min(1, p * 2); }),
      (function* () { kam.eyes = 'blij'; emote('hearts', 3); gang.forEach(a => { a.eyes = 'groot'; emote('!', 1, a); }); yield* wait(.8);
        yield* par(...gang.map(a => (function* () { yield* wait(rnd() * .6); a.eyes = ''; for (let k = 0; k < 2; k++) yield* petJump(a, 30 + rnd() * 20, .4); })())); })());
    // drinking, splashing, shaking off
    yield* par(...gang.map((a, i) => petTo(a, px() - 40 + i * 30 + (i % 2 ? 100 : 0), 90)));
    gang.forEach((a, i) => { a.face = a.cx < px() + 10 ? 1 : -1; hold(a, 'down'); });
    can.on = true; can.tip = 0; yield* wait(3);
    const splasher = gang.find(a => a.pet === 'snoet') || gang[0];
    hold(splasher, null); yield* petJump(splasher, 50, .5, px() + 10);
    const splash = K.particles('front', { dur: 1.5, emit: (ps) => { if (ps.done) return; ps.done = true; for (let k = 0; k < 26; k++) ps.push(P({ x: px() + 10, y: FEET, vx: (rnd() - .5) * 320, vy: -150 - rnd() * 200, grav: 700, life: .9 })); },
      draw: (g, p, k) => { R(g, p.x, p.y, 4, 4, `rgba(140,200,255,${1 - k})`); } });
    gang.forEach(a => { if (a !== splasher) { hold(a, null); a.eyes = 'groot'; } }); kam.eyes = 'groot';
    yield* wait(.8);
    yield* par(...gang.map(a => tween(1.2, p => { a.sx = 1 + Math.sin(p * 50) * .08 * (1 - p); })), tween(1.2, p => { kam.sx = 1 + Math.sin(p * 40) * .03 * (1 - p); }));
    gang.forEach(a => { a.eyes = ''; a.sx = 1; }); kam.sx = 1; kam.eyes = 'blij'; emote('notes', 3);
    yield* wait(1);
    yield* tween(1.2, p => { can.tip = Math.sin(p * Math.PI) * .6; }); can.on = false; emote('sparks', 1.5);
    gang.forEach(a => { hold(a, a.pet === 'dobby' ? 'lie' : 'sit'); });
    yield* wait(3.5);
    // a rumble: on the horizon, a brown wall is growing
    K.grade('apocalyps', 1, 3);
    const storm = { rise: 0, x: W + 200, cover: 0 };
    const stormFar = fx('sky', 0, (g) => {   // far away, at the horizon
      if (storm.rise <= 0) return; const H0 = storm.rise * 210, x0 = 300;
      for (let x = x0; x < W; x += 8) { const k = Math.min(1, (x - x0) / 360), h = k * H0 * (1 + .12 * Math.sin(x * .021 + K.t * .8)); R(g, x, HZ - h + 4, 8, h, '#7a5236'); R(g, x, HZ - h * .45, 8, h * .45, '#5e3e28'); }
      for (let i = 0; i < 26; i++) {   // the billows on top, rolling
        const bx = x0 + 40 + hash(i) * (W - x0), k = Math.min(1, (bx - x0) / 360), r = (18 + hash(i + 3) * 30) * storm.rise, by = HZ - k * H0 * (1 + .12 * Math.sin(bx * .021 + K.t * .8)) + 6 + Math.sin(K.t * 1.3 + i) * 4;
        disc(g, bx, by, r, 4, '#9a6a44'); disc(g, bx - r * .3, by - r * .25, r * .6, 4, '#b8865a');
      }
      for (let i = 0; i < 10; i++) { const y = HZ - hash(i + 9) * H0 * .8, x = ((K.t * (60 + hash(i) * 50) * -1 + hash(i + 2) * 900) % 700 + 700) % 700 + x0; R(g, x, y, 40 + hash(i) * 50, 3, 'rgba(210,170,120,.5)'); }
    });
    const peb = gang.find(a => a.pet === 'pebbels') || gang[gang.length - 1];
    hold(peb, 'stand'); peb.face = 1; yield* wait(.8); peb.eyes = 'groot'; emote('!', 1.5, peb);
    yield* par(tween(6, p => { storm.rise = p; }), K.lensW({ z: 2, cx: W - 200, cy: HZ - 60 }, 3.5));
    yield* wait(1.5);
    K.lens({ z: 1, cx: W / 2, cy: K.H / 2 }, .5); yield* wait(.5);
    kam.face = 1; kam.eyes = 'groot'; emote('!?', 2); gang.forEach(a => { hold(a, null); a.face = 1; a.eyes = 'groot'; }); K.lens({ shake: 2 }, 0);
    yield* shiver(1.5, 3); K.lens({ shake: 0 }, .5);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 2', 'DE STORM', 2.6, { size: 44 });

    /* ---------- part 2: the storm ---------- */
    stop(fountain); stop(pudFx); stop(bowFx); pipe.on = false; car.on = false; stop(stormFar); cart.on = false; stop(cartFx);
    gang.forEach(a => { a.eyes = ''; a.sx = 1; });
    const bus = WR.add({ kind: 'bus', wx: K.toWorld(W / 2 + 110) });
    const lost = gang.find(a => a.pet === 'pippa') || gang[gang.length - 1];
    const crew = gang.filter(a => a !== lost);
    kam.x = -150; kam.face = 1; kam.eyes = 'dicht';
    crew.forEach((a, i) => { a.cx = W / 2 - 120 + i * 55; a.face = 1; hold(a, 'lie'); });
    lost.alpha = 0;
    K.setv('dark', .32, .01);
    const head = K.light(() => K.kp(60, 260), 300, { col: '255,230,170' });
    const beam = { on: true };
    const beamO = K.over((g, age, lp) => { if (!beam.on) return; const p = lp(K.kp(40, 250)), f = kam.face || -1, z = K.lensNow.z, len = 520 * z, sp = 120 * z;
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(p.x, p.y, p.x + f * len, p.y);
      gr.addColorStop(0, 'rgba(255,235,180,.32)'); gr.addColorStop(1, 'rgba(255,235,180,0)'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(p.x, p.y - 6 * z); g.lineTo(p.x + f * len, p.y - sp + 40 * z); g.lineTo(p.x + f * len, p.y + sp + 40 * z); g.lineTo(p.x, p.y + 6 * z); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,250,220,.9)'; g.fillRect(p.x - 3 * z, p.y - 3 * z, 6 * z, 6 * z); g.restore(); });
    K.stop(dust); dust = K.weather('dust', 3);
    const haze = { a: .24 };
    const hazeFx = fx('screen', 0, (g) => { if (haze.a <= 0) return; R(g, 0, 0, W, K.H, `rgba(130,90,55,${haze.a})`);
      for (let k = 0; k < 14; k++) { const y = 60 + hash(k) * (K.H - 120), x = ((K.t * (260 + hash(k + 3) * 300) + hash(k + 5) * 2000) % (W + 400)) - 200; R(g, W - x, y, 120 + hash(k) * 160, 3, `rgba(170,130,90,${haze.a * .9})`); } });
    K.lens({ shake: 1.2 }, 0);
    yield* K.fadeIn(1.8);
    yield* shiver(2, 2);
    for (let k = 0; k < 3; k++) {   // lightning inside the dust
      yield* wait(1.6 + rnd() * 1.4); K.flash(.55, '255,170,90', 3);
      crew.forEach(a => { a.eyes = 'groot'; }); yield* wait(.4); crew.forEach(a => { a.eyes = ''; });
      if (k === 1) { const c = pick(crew); if (c) emote('sweat', 2, c); }
    }
    // counting heads…
    kam.eyes = ''; yield* wait(1);
    for (let k = 0; k < crew.length; k++) { kam.head = .1; yield* wait(.5); }
    kam.head = 0; emote('?', 2); yield* wait(1.5);
    const gapX = W / 2 - 120 + crew.length * 55;
    yield* K.lensW({ z: 2.2, cx: gapX, cy: FEET - 40 }, 1.6);
    const print = fx('ground', 0, (g) => { R(g, gapX - 6, FEET + 14, 6, 4, 'rgba(60,40,26,.8)'); R(g, gapX + 6, FEET + 18, 6, 4, 'rgba(60,40,26,.8)'); });
    yield* wait(2.2);
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 1.2);
    kam.eyes = 'groot'; emote('!', 1.5); crew.forEach(a => { hold(a, 'sit'); a.face = -1; emote('?', 1.5, a); }); yield* wait(2);
    // he goes out into it, alone
    kam.eyes = 'boos'; yield* wait(1);
    yield* walkTo(W / 2 + 160, 45); stop(print);
    yield* K.cut(() => {
      bus.on = false; crew.forEach(a => { a.keepA = 1; a.alpha = 0; });
      kam.x = -W / 2 - 110; kam.face = 1; K.setv('dark', .42); haze.a = .3;
    }, .7);
    const rock = WR.add({ kind: 'rock', wx: K.toWorld(650) });
    lost.alpha = 1; lost.cx = 650; lost.feet = FEET - 50; lost.face = -1; hold(lost, 'sleep'); lost.deco = goggles;
    const shake2 = fx('screen', 0, () => { lost.sx = 1 + Math.sin(K.t * 40) * .03; });
    // against the wind
    kam.r = -.05;
    yield* walkTo(-80, 30);
    kam.r = 0; kam.face = 1; emote('?', 1.5); yield* wait(1.5);
    yield* walkTo(30, 30);
    stop(shake2); lost.sx = 1; hold(lost, 'sit'); lost.eyes = 'groot'; emote('!', 1.5, lost); yield* wait(1.2);
    lost.eyes = ''; emote('heart', 2, lost); kam.eyes = 'blij'; emote('heart', 2);
    yield* K.lensW({ z: 1.6, cx: 560, cy: FEET - 140 }, 1.5);
    yield* wait(1.5);
    // onto his back
    hold(lost, 'jump'); const bx0 = lost.cx, by0 = lost.feet; lost.layer = 'front';
    yield* tween(.6, p => { const b = K.kp(520, 470); lost.cx = lerp(bx0, b.x, p); lost.feet = lerp(by0, b.y, p) - Math.sin(p * Math.PI) * 40; });
    hold(lost, 'lie');
    const ride = fx('screen', 0, () => { const b = K.kp(520, 470); lost.cx = b.x; lost.feet = b.y; lost.face = kam.face; });
    emote('hearts', 2.5, lost);
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 1.4);
    kam.face = -1; yield* walkTo(-W / 2 - 120, 40);
    yield* K.cut(() => { rock.on = false; bus.on = true; crew.forEach(a => { a.alpha = 1; }); K.setv('dark', .32); haze.a = .24; kam.x = W / 2 + 150; }, .7);
    yield* walkTo(-20, 42);
    crew.forEach(a => { a.eyes = 'groot'; a.face = 1; emote('!', 1.2, a); }); yield* wait(.6);
    yield* par(...crew.map(a => (function* () { hold(a, null); for (let k = 0; k < 2; k++) yield* petJump(a, 30 + rnd() * 20, .4); a.eyes = ''; emote('hearts', 2, a); })()));
    stop(ride); hold(lost, 'jump'); const lx0 = lost.cx, ly0 = lost.feet;
    yield* tween(.5, p => { lost.cx = lerp(lx0, gapX, p); lost.feet = lerp(ly0, FEET, p) - Math.sin(p * Math.PI) * 30; });
    lost.feet = FEET; lost.layer = 'back'; hold(lost, 'lie'); lost.face = 1;
    kam.face = 1; kam.eyes = 'dicht';
    crew.forEach(a => { hold(a, 'lie'); a.face = 1; });
    // all close together; the storm wears itself out, the night comes
    yield* wait(2);
    yield* par(tween(10, p => { haze.a = .24 * (1 - p); S.night = p; }), (function* () { yield* wait(3); K.stop(dust); dust = K.weather('dust', .4); K.lens({ shake: 0 }, 2); K.grade('nacht', .55, 6); K.setv('dark', .35, 6); })());
    stop(hazeFx); K.unlight(head); beam.on = false; K.unover(beamO);
    gang.forEach(a => hold(a, 'sleep')); const zz = emote('zzz', 6);
    yield* wait(4);
    stop(zz);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 3', 'HET ZAADJE', 2.6, { size: 44 });

    /* ---------- part 3: the seed ---------- */
    K.stop(dust); dust = null; bus.on = false;
    kam.x = -40; kam.face = 1; kam.eyes = ''; S.night = 1; S.sun = .5;
    const fire = { x: W / 2 + 120, on: true };
    const fireFx = fx('back', 0, (g) => { if (!fire.on) return; const x = fire.x, y = FEET + 4;
      for (let k = 0; k < 7; k++) R(g, x - 30 + k * 9, y - 6 - (k % 2) * 3, 10, 6, k % 2 ? '#6b6258' : '#8a8076');   // stones
      R(g, x - 22, y - 14, 44, 7, '#4a3020'); R(g, x - 14, y - 19, 28, 6, '#5e3e28');
      for (let k = 0; k < 9; k++) { const h = 16 + Math.abs(Math.sin(K.t * 9 + k * 2.1)) * 44 * (1 - Math.abs(k - 4) / 5.5); R(g, x - 22 + k * 5, y - 18 - h, 5, h, k % 2 ? '#ff9a2a' : '#ffcf40'); R(g, x - 22 + k * 5, y - 18 - h * .4, 5, h * .4, '#ff5a1a'); } });
    const fireL = K.light(() => fire.on ? { x: fire.x, y: FEET - 30 } : null, 360, { col: '255,150,60', flicker: .14 });
    const fireGlow = K.over((g, age, lp) => { if (!fire.on) return; const q = lp({ x: fire.x, y: FEET - 30 }), r = (230 + Math.sin(age * 13) * 12) * K.lensNow.z;
      const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); gr.addColorStop(0, 'rgba(255,150,60,.38)'); gr.addColorStop(.5, 'rgba(255,120,40,.12)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(q.x - r, q.y - r, r * 2, r * 2); });
    const sparks = K.particles('front', { emit: (ps) => { if (fire.on && rnd() < .2) ps.push(P({ x: fire.x + (rnd() - .5) * 20, y: FEET - 30, vx: (rnd() - .5) * 20, vy: -50 - rnd() * 40, life: 1.6 })); },
      draw: (g, p, k) => { R(g, p.x + Math.sin(p.age * 6) * 4, p.y, 3, 3, `rgba(255,${150 + Math.floor(rnd() * 80)},60,${1 - k})`); } });
    const ring = [110, 180, -80, 250, 50];
    gang.forEach((a, i) => { a.cx = fire.x + ring[i % ring.length] + (i > 4 ? 30 : 0); a.feet = FEET; a.face = a.cx < fire.x ? 1 : -1; hold(a, 'sleep'); a.layer = i % 2 ? 'front' : 'back'; });
    K.grade('nacht', .55, .01); K.setv('dark', .42, .01);
    yield* K.fadeIn(2);
    const zz2 = emote('zzz', 9, gang[0]);
    yield* wait(2.5);
    kam.head = -.25; yield* wait(2);
    yield* tween(1.4, p => { S.shoot = p; }); S.shoot = 0;
    kam.eyes = 'groot'; emote('sparks', 2); yield* wait(2); kam.eyes = ''; kam.head = 0;
    yield* wait(1.5); stop(zz2);
    // Dobby sneezes, and something tiny flies out of his fur
    const sneezer = gang.find(a => a.pet === 'dobby') || gang[0];
    hold(sneezer, 'sit'); yield* wait(.6);
    yield* tween(.5, p => { sneezer.sq = 1 - .08 * Math.sin(p * Math.PI); });
    sneezer.sq = 1.1; emote('burst', .5, sneezer); K.lens({ shake: 2 }, 0); yield* wait(.15); sneezer.sq = 1; K.lens({ shake: 0 }, .2);
    const seed = { x: sneezer.cx, y: FEET - 30, on: true, glow: 0 };
    const sx0 = seed.x, sx1 = K.kx() - 150;
    const seedFx = fx('front', 0, (g) => { if (!seed.on) return; R(g, seed.x - 3, seed.y - 4, 6, 8, '#8a5a2a'); R(g, seed.x - 1, seed.y - 3, 2, 5, '#c08a4a');
      if (seed.glow > 0 && Math.sin(K.t * 4) > 0) K.sprC(g, K.SP.spark, seed.x + 8, seed.y - 10, 2); });
    yield* tween(1, p => { seed.x = lerp(sx0, sx1, p); seed.y = FEET - 30 - Math.sin(p * Math.PI) * 80 + p * 32; });
    seed.glow = 1;
    const seedL = K.light(() => seed.on ? { x: seed.x, y: seed.y } : null, 80, { col: '255,240,170' });
    kam.eyes = 'groot'; emote('!?', 2); gang.forEach(a => { if (a !== sneezer) { hold(a, 'sit'); a.eyes = 'groot'; } }); yield* wait(1.5);
    kam.face = -1; yield* walkTo(sx1 - W / 2 + 70, 30); kam.face = -1; kam.head = .35;
    yield* K.lensW({ z: 2.6, cx: seed.x, cy: FEET - 40 }, 2);
    yield* wait(3);
    gang.forEach(a => { a.eyes = ''; });
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 2); kam.head = 0;
    yield* K.fadeOut(1.4);
    // dawn: they plant it
    stop(sparks); fire.on = false; K.unlight(fireL); K.unover(fireGlow); S.night = 0; S.sun = .12;
    K.grade('apocalyps', .8, .01); K.setv('dark', 0, .01);
    S.treeWX = K.toWorld(seed.x);
    const tx = () => K.toScreen(S.treeWX);
    const sprout = fx('ground', 0, (g) => {
      const x = tx(), y = FEET + 14, h = S.treeH;
      if (S.mound) { R(g, x - 14, y - 6, 28, 6, '#5e4228'); R(g, x - 8, y - 9, 16, 3, '#6e5032'); }
      if (h <= 0) return;
      if (h < .25) {   // a little sprout
        const st = 4 + h * 200; R(g, x - 2, y - 6 - st, 4, st, '#4f9a38');
        for (let k = 1; k <= Math.min(4, Math.floor(h * 20) + 1); k++) { const ly = y - 6 - st * k / 5; R(g, x + (k % 2 ? 2 : -10), ly, 8, 4, '#6cc04a'); }
        if (S.flower > 0) { const fs = 4 + S.flower * 6; R(g, x - fs / 2, y - 10 - st - fs, fs, fs, '#ff8fb8'); R(g, x - 2, y - 8 - st - fs / 2 - 2, 4, 4, '#ffe060'); }
        return;
      }
      // a tree
      const sc = (h - .2) / .8, th = 30 + sc * 190, tw = 6 + sc * 22, cr = 26 + sc * 130;
      R(g, x - tw / 2, y - th, tw, th, '#5a3a26'); R(g, x - tw / 2, y - th, tw / 3, th, '#6e4a32');
      R(g, x - tw / 2 - sc * 30, y - th * .7, sc * 30, 6, '#5a3a26'); R(g, x + tw / 2, y - th * .8, sc * 34, 6, '#5a3a26');
      const n = Math.floor(40 + sc * 160);
      for (let i = 0; i < n; i++) { const a = hash(i) * Math.PI * 2, rr = Math.sqrt(hash(i + 31)) * cr, bx = x + Math.cos(a) * rr * 1.25, by = y - th - cr * .2 + Math.sin(a) * rr * .65;
        const pink = hash(i + 6) < .3, gone = pink && i < S.bitten * 4;
        if (gone) continue;
        R(g, Math.round(bx / 4) * 4, Math.round(by / 4) * 4, 8, 8, pink ? (hash(i + 5) < .5 ? '#ff9ec4' : '#ffd6e6') : (hash(i + 7) < .5 ? '#4f9a38' : '#6cc04a')); }
    });
    gang.forEach((a, i) => { a.cx = tx() + 90 + i * 50; a.face = -1; hold(a, 'sit'); a.layer = 'back'; });
    kam.x = tx() - W / 2 - 120; kam.face = 1; seed.on = false; S.mound = false;
    yield* K.fadeIn(2);
    // a hole, the seed, a little earth on top, and the last of the water
    const dig = gang.find(a => a.pet === 'dobby') || gang.find(a => a.pet === 'wifi') || gang[0];
    yield* petTo(dig, tx() + 30, 50); dig.face = -1; hold(dig, 'down');
    const earth = K.particles('front', { until: K.t + 2.5, emit: (ps) => { if (rnd() < .6) ps.push(P({ x: dig.cx - 10, y: FEET - 2, vx: (rnd() - .2) * 120, vy: -90 - rnd() * 60, grav: 340, life: .7 })); },
      draw: (g, p, k) => { R(g, p.x, p.y, 4, 4, `rgba(110,80,50,${1 - k})`); } });
    yield* wait(2.6); stop(earth); hold(dig, 'sit'); S.mound = true;
    kam.head = .3; yield* wait(1.2);
    can.on = true; can.tip = 0;
    yield* tween(1, p => { can.tip = -p * 1.8; });
    const pour = K.particles('front', { until: K.t + 2.2, emit: (ps) => { const p = K.kp(-20, 420); ps.push(P({ x: p.x, y: p.y, vx: 20 * kam.face, vy: 60, grav: 600, life: .5 })); },
      draw: (g, p) => { R(g, p.x, p.y, 3, 5, '#7ec8ff'); } });
    yield* wait(2.4); stop(pour);
    yield* tween(.8, p => { can.tip = -1.8 * (1 - p); }); can.on = false; kam.head = 0;
    // and now: wait
    yield* K.lensW({ z: 1.8, cx: tx(), cy: FEET - 60 }, 2);
    yield* wait(2.5); emote('dots', 2.5); gang.forEach(a => emote('dots', 2.5, a)); yield* wait(3);
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 1.6);
    // days go by: sun, moon, sun, moon… and the little green thing grows
    K.setv('grain', .8, 1);
    const poses = ['sit', 'lie', 'sleep', 'stand', 'down'];
    for (let day = 0; day < 5; day++) {
      yield* K.cut(() => {
        gang.forEach((a, i) => { a.cx = tx() + (i % 2 ? 1 : -1) * (90 + (i + day) % 3 * 60); a.face = a.cx < tx() ? 1 : -1; hold(a, poses[(i + day) % poses.length]); });
        kam.x = tx() - W / 2 + (day % 2 ? 150 : -150); kam.face = kam.x + W / 2 < tx() ? 1 : -1; kam.eyes = day % 2 ? 'dicht' : ''; kam.head = day % 2 ? .2 : 0;
      }, .12);
      yield* tween(2.2, p => { S.sun = p; S.night = 0; S.treeH = (day + p) * .04; K.setv('dark', 0); });
      yield* tween(1.2, p => { S.night = Math.sin(p * Math.PI); K.setv('dark', .3 * Math.sin(p * Math.PI)); });
    }
    S.night = 0; S.sun = .2; K.setv('dark', 0); K.setv('grain', .6, 1);
    kam.eyes = ''; kam.head = 0;
    yield* K.cut(() => { gang.forEach((a, i) => { a.cx = tx() + (i % 2 ? 1 : -1) * (80 + i * 26); a.face = a.cx < tx() ? 1 : -1; hold(a, 'sit'); }); kam.x = tx() - W / 2 - 150; kam.face = 1; }, .3);
    // a bud
    yield* K.lensW({ z: 2.4, cx: tx(), cy: FEET - 70 }, 2.2);
    yield* tween(3, p => { S.flower = p; });
    const budL = K.over((g, age, lp) => { const q = lp({ x: tx(), y: FEET - 70 }), r = 60 + Math.sin(age * 3) * 8; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      gr.addColorStop(0, 'rgba(255,220,240,.45)'); gr.addColorStop(1, 'rgba(255,220,240,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(q.x - r, q.y - r, r * 2, r * 2); });
    yield* wait(2.5);
    yield* K.lensW({ z: 1.2, cx: tx() + 40, cy: FEET - 120 }, 1.6);
    kam.eyes = 'groot'; emote('!', 1.5); gang.forEach(a => { a.eyes = 'groot'; hold(a, 'stand'); }); yield* wait(2);
    yield* K.fadeOut(1.4);
    yield* K.card('DEEL 4', 'GROEN', 2.6, { size: 44 });

    /* ---------- part 4: green ---------- */
    gang.forEach(a => { a.eyes = ''; });
    yield* K.fadeIn(1.2);
    K.flash(1, '255,250,230', .7); K.unover(budL);
    K.stop(ash);
    const leaves = K.weather('leaves', .5), glit = K.weather('sparks', .4);
    K.grade('warm', .55, 9); K.setv('grain', .3, 9); K.setv('vig', .4, 9);
    yield* par(
      tween(10, p => { const e = ez(p); S.heal = e; S.grassR = e * 3000; S.treeH = .2 + e * .8; S.sun = .2 + p * .25; }),
      K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 4),
      (function* () {
        yield* wait(2); gang.forEach(a => { a.eyes = 'groot'; emote('!', 1.2, a); });
        yield* wait(2); kam.eyes = 'groot'; kam.head = -.2; emote('!?', 2);
        yield* wait(3); gang.forEach(a => { a.eyes = ''; });
      })());
    // he takes off the mask, and breathes in
    kam.outfit = null; kam.head = -.25; kam.eyes = 'dicht'; emote('sparks', 2.5);
    yield* tween(2.4, p => { kam.sq = 1 + Math.sin(p * Math.PI) * .04; }); kam.sq = 1;
    kam.eyes = 'blij'; kam.head = 0; emote('hearts', 3);
    gang.forEach(a => { a.deco = null; });
    yield* wait(1.5);
    // everybody, everywhere
    const zoom = gang.find(a => a.pet === 'snoet');
    const bink = gang.find(a => a.pet === 'dobby');
    const climb = gang.find(a => a.pet === 'pippa');
    const chase = gang.find(a => a.pet === 'pebbels');
    const bfly = { x: W / 2 + 200, y: FEET - 120, on: !!chase };
    const bflyFx = fx('front', 0, (g) => { if (!bfly.on) return; const f = Math.sin(K.t * 18) > 0; R(g, bfly.x - 1, bfly.y - 4, 2, 8, '#2a2018');
      R(g, bfly.x - (f ? 8 : 5), bfly.y - 6, f ? 7 : 4, 6, '#ffd23f'); R(g, bfly.x + 1, bfly.y - 6, f ? 7 : 4, 6, '#ffd23f'); R(g, bfly.x - (f ? 6 : 4), bfly.y, f ? 5 : 3, 4, '#ff9a2a'); R(g, bfly.x + 1, bfly.y, f ? 5 : 3, 4, '#ff9a2a'); });
    yield* par(
      zoom ? (function* () { hold(zoom, null); zoom.rate = 16; for (let k = 0; k < 3; k++) { yield* petTo(zoom, 120, 260); yield* petTo(zoom, W - 120, 260); } yield* petTo(zoom, tx() + 160, 200); zoom.face = -1; hold(zoom, 'sit'); })() : wait(1),
      bink ? (function* () { hold(bink, null); for (let k = 0; k < 6; k++) { yield* petJump(bink, 40 + rnd() * 30, .45, bink.cx + (rnd() - .5) * 60); emote('heart', .8, bink); yield* wait(.4); } hold(bink, 'up'); })() : wait(1),
      climb ? (function* () { hold(climb, null); yield* petTo(climb, tx() + 20, 70); hold(climb, 'jump'); const y0 = climb.feet; const th = 30 + 190 * ((S.treeH - .2) / .8);
        yield* tween(.8, p => { climb.feet = lerp(y0, FEET - th + 6, ez(p)) - Math.sin(p * Math.PI) * 30; climb.cx = tx() + 20 - p * 10; }); hold(climb, 'lie'); climb.face = 1; climb.layer = 'front'; })() : wait(1),
      chase ? (function* () { hold(chase, null); for (let k = 0; k < 5; k++) { const bx = 140 + rnd() * (W - 280), by = FEET - 60 - rnd() * 160; yield* par(tween(1.6, p => { bfly.x = lerp(bfly.x, bx, p * .3); bfly.y = lerp(bfly.y, by, p * .3) + Math.sin(K.t * 5) * 2; }), petTo(chase, bx, 90));
          yield* petJump(chase, 50, .4); } bfly.on = false; hold(chase, 'sit'); })() : wait(1),
      (function* () { yield* wait(1); yield* hop(30, .45); yield* wait(1.5); yield* hop(40, .5); kam.eyes = 'blij'; emote('notes', 4); })());
    stop(bflyFx);
    yield* wait(2);
    // and who comes strolling in, spotless, sunglasses on, chewing? Of course.
    const h = K.heidi(1, { outfit: ['zonnebril'] });
    yield* K.actorTo(h, tx() + 90, 40); h.face = -1;
    kam.eyes = 'groot'; emote('!?', 2); gang.forEach(a => { if (a !== climb) { a.face = a.cx < h.cx ? 1 : -1; emote('?', 2, a); } });
    yield* K.lensW({ z: 1.5, cx: h.cx - 40, cy: FEET - 180 }, 1.6);
    h.head = -.25;
    for (let k = 0; k < 4; k++) { yield* tween(1, p => { h.sq = 1 + Math.sin(p * 24) * .015; }); S.bitten += 2;
      K.particles('front', { dur: 1, emit: (ps) => { if (ps.d) return; ps.d = 1; for (let j = 0; j < 4; j++) ps.push(P({ x: h.cx - 50, y: FEET - 230, vx: (rnd() - .5) * 60, vy: 20, grav: 60, life: 1 })); }, draw: (g, p, k2) => { R(g, p.x, p.y, 4, 4, `rgba(255,158,196,${1 - k2})`); } }); }
    h.head = 0; h.sq = 1; h.eyes = 'vies'; emote('dots', 2.5, h);
    yield* wait(2.5);
    kam.eyes = ''; emote('dots', 2.5); gang.forEach(a => emote('dots', 2.5, a)); yield* wait(2.8);
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 1.6);
    // she turns her back on all of them, in the best spot in the shade
    h.face = 1; yield* K.actorTo(h, tx() - 60, 30); h.face = 1; h.eyes = 'dicht'; const hz = emote('zzz', 8, h);
    yield* wait(2.5);
    kam.eyes = 'blij'; emote('heart', 2);
    // the whole gang under the tree, the camera goes up to the blue sky
    yield* par(walkTo(tx() - W / 2 + 170, 40), ...gang.filter(a => a !== climb).map((a, i) => petTo(a, tx() + 270 + i * 46, 60)));
    kam.face = -1; gang.forEach(a => { if (a !== climb) { a.face = -1; hold(a, a.pet === 'dobby' ? 'lie' : 'sleep'); } });
    stop(hz); kam.eyes = 'dicht';
    yield* wait(2);
    yield* K.lensW({ z: 1.3, cx: W / 2, cy: 200 }, 5);
    yield* wait(2.5);
    K.stop(leaves); K.stop(glit);
    yield* K.ending('EINDE');
  } };
})();
