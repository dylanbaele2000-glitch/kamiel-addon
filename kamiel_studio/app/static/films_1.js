/* Kamiel films, part 1: see "cinema" in events.js for the building blocks (K). */
(function () {
  const F = window.KamielFilms = window.KamielFilms || {};

  /* HET SPOOK — a ghost haunts the gang at night. They follow the hoofprints, set a trap with hay,
     pull the sheet off… and it's Heidi, chewing. About 6 minutes. */
  F['film-spook'] = { run: function* (K) {
    const { W, FEET, kam, wait, tween, par, walkTo, hop, shiver, emote, fx, stop, hold, petTo, petJump, rnd, lerp, ez, clamp } = K;
    const names = K.castNames(); if (!names.length) return;
    const has = (n) => names.includes(n);
    const camX = () => K.A.cam();
    const scr = (wx) => W / 2 + wx - camX();   // a spot in the world on the screen (things that stay behind when we walk on)

    yield* K.opening('HET SPOOK', 'EEN GRIEZELFILM MET KAMIEL', 'nacht');
    K.grade('nacht', .6, .01); K.setv('dark', .45, .01); K.setv('vig', .7, 2);

    // the lantern on the ground next to Kamiel, and the light it gives
    const lan = { x: K.kx() + 70, y: FEET + 8, on: 1 };
    const lanFx = fx('front', 0, (g) => { if (!lan.on) return; const x = lan.x, y = lan.y;
      g.fillStyle = '#2b2118'; g.fillRect(x - 9, y - 30, 18, 4); g.fillRect(x - 2, y - 36, 4, 6);
      g.fillStyle = `rgba(255,${190 + Math.floor(rnd() * 40)},90,.95)`; g.fillRect(x - 7, y - 26, 14, 20);
      g.fillStyle = '#2b2118'; g.fillRect(x - 9, y - 6, 18, 4); g.fillRect(x - 8, y - 26, 2, 20); g.fillRect(x + 6, y - 26, 2, 20); });
    const lamp = K.light(() => ({ x: lan.x, y: lan.y - 60 }), 340, { col: '255,180,80', flicker: .08 });
    const fog = fx('front', 0, (g) => { for (let k = 0; k < 5; k++) { const y = FEET - 40 + k * 14, x = ((K.t * (12 + k * 5) + k * 300) % (W + 600)) - 300;
      const gr = g.createRadialGradient(x, y, 10, x, y, 260); gr.addColorStop(0, 'rgba(200,210,230,.13)'); gr.addColorStop(1, 'rgba(200,210,230,0)'); g.fillStyle = gr; g.fillRect(x - 260, y - 60, 520, 120); } });

    // the gang sits close to the lantern
    const spots = [-210, -140, 150, 215, 280];
    const gang = names.map((n, i) => { const a = K.pet(n, i % 2 ? 1 : -1); a.cx = W / 2 + (i % 2 ? 1 : -1) * (W / 2 + 60 + i * 30); return a; });
    yield* par(...gang.map((a, i) => petTo(a, K.kx() + spots[i], K.PET[a.pet].run * .7)));
    gang.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; hold(a, a.pet === 'dobby' ? 'lie' : 'sit'); });
    kam.face = -1; kam.eyes = 'triest';
    for (let k = 0; k < 3; k++) { yield* wait(2.4); const a = K.pick(gang); a.face = -a.face; if (rnd() < .5) emote('sweat', 1.6, a); }
    yield* shiver(1.2, 2);

    /* ---------- the ghost: a white sheet over… someone with four white hooves ---------- */
    const h = K.heidi(-1, { alpha: 0 });   // she's under the sheet the whole time
    const G = { x: -200, feet: FEET - 6, a: 0, face: -1, bob: 0, pull: 0, chew: 0, on: true };
    function sheetPath(g, x, f, s, face, pull) {
      const X = (dx) => x + dx * s * face * -1, Y = (dy) => f - dy * s;   // drawn for a ghost looking left
      g.beginPath(); g.moveTo(X(-78), Y(18));
      for (let k = 0; k <= 8; k++) { const xx = -78 + k * 19.5; g.lineTo(X(xx + pull * 20 * (k / 8)), Y(18 + (k % 2 ? 9 : -2) + Math.sin(K.t * 5 + k) * 3)); }
      g.lineTo(X(84 + pull * 26), Y(118)); g.quadraticCurveTo(X(40 + pull * 10), Y(142), X(-6), Y(126));
      g.lineTo(X(-4), Y(206 - G.chew * 6)); g.quadraticCurveTo(X(-40), Y(232 - G.chew * 6), X(-84), Y(196 - G.chew * 10));
      g.lineTo(X(-82), Y(150)); g.quadraticCurveTo(X(-66), Y(128), X(-60), Y(100)); g.closePath();
    }
    const ghostFx = fx('back', 0, (g) => {
      if (!G.on || G.a <= 0) return; const bob = Math.sin(K.t * 2.2) * 6 * G.bob, x = G.x, f = G.feet - bob, s = 1, face = G.face;
      g.globalAlpha = G.a;
      g.fillStyle = '#efe9df'; g.fillRect(x - 46, G.feet - 4, 10, 8); g.fillRect(x - 22, G.feet - 4, 10, 8); g.fillRect(x + 20, G.feet - 4, 10, 8); g.fillRect(x + 42, G.feet - 4, 10, 8);   // hooves
      sheetPath(g, x, f, s, face, G.pull); g.fillStyle = 'rgba(244,244,250,.93)'; g.fill();
      g.strokeStyle = 'rgba(160,170,190,.6)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(190,198,215,.55)'; for (let k = 0; k < 3; k++) g.fillRect(x + (-30 + k * 30) * -face, f - 90 + k * 8, 3, 60);   // folds
      g.fillStyle = '#0b0a12'; const ex = (dx) => x + dx * -face; g.beginPath(); g.ellipse(ex(-58), f - 176 + G.chew * 4, 7, 10, 0, 0, 7); g.ellipse(ex(-34), f - 180 + G.chew * 4, 7, 10, 0, 0, 7); g.fill();
    });
    const gGlow = K.light(() => G.a > .2 ? { x: G.x, y: G.feet - 120 } : null, 130, { col: '190,210,255', a: .55 });

    // far away, a white shape drifts past at the back
    yield* wait(2);
    G.feet = FEET - 70; G.x = -120; G.bob = 1;
    yield* tween(9, p => { G.x = lerp(-120, W + 140, p); G.a = Math.min(1, p * 4, (1 - p) * 4) * .7; });
    G.a = 0;
    const seer = gang.find(a => a.pet === 'snoet') || gang[0];
    seer.eyes = 'groot'; emote('!', 1.5, seer); hold(seer, 'stand'); yield* wait(1.2);
    for (let k = 0; k < 3; k++) { yield* K.petJump(seer, 10, .25); emote('burst', .4, seer); }   // barks at the dark
    kam.eyes = 'groot'; kam.face = 1; emote('?', 2); gang.forEach(a => { a.face = 1; }); yield* wait(2.5);
    seer.eyes = ''; hold(seer, 'sit'); kam.eyes = 'triest'; kam.face = -1; gang.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; });
    yield* wait(3);
    // they try to sleep; Pebbels sees it again, but by the time the others look, it's gone
    gang.forEach(a => hold(a, 'sleep')); kam.eyes = 'dicht'; const zz = emote('zzz', 14);
    yield* wait(5);
    const peb = gang.find(a => a.pet === 'pebbels') || gang[gang.length - 1];
    G.feet = FEET - 40; G.x = W + 120; G.face = -1; G.bob = 1;
    hold(peb, 'sit'); peb.face = 1; yield* wait(1);
    yield* par(tween(6, p => { G.x = lerp(W + 120, W - 160, ez(Math.min(1, p * 2))); G.a = Math.min(.8, p * 3); }),
      (function* () { yield* wait(2.5); peb.eyes = 'groot'; emote('!', 1.5, peb); yield* K.petJump(peb, 26, .35); for (let k = 0; k < 3; k++) { peb.face = -peb.face; yield* wait(.3); } })());
    stop(zz); kam.eyes = 'groot'; gang.forEach(a => { if (a !== peb) hold(a, a.pet === 'dobby' ? 'up' : 'sit'); });
    G.a = 0; peb.face = 1; yield* wait(.4);
    kam.face = 1; gang.forEach(a => { a.face = 1; }); yield* wait(2); emote('dots', 2.5); gang.forEach(a => { if (a !== peb) emote('?', 2, a); });
    yield* wait(2.5); peb.eyes = ''; emote('angry', 2, peb); kam.eyes = 'triest'; kam.face = -1; yield* wait(3);
    gang.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; hold(a, a.pet === 'dobby' ? 'lie' : 'sit'); });
    yield* wait(3);
    // the lantern flickers… goes out…
    for (let k = 0; k < 5; k++) { lamp.off = true; lan.on = 0; yield* wait(.08 + rnd() * .2); lamp.off = false; lan.on = 1; yield* wait(.1 + rnd() * .4); }
    lamp.off = true; lan.on = 0; yield* wait(1.6);
    // lightning: it stands RIGHT behind them
    G.x = K.kx() - 330; G.feet = FEET - 6; G.face = 1; G.a = 1; G.bob = .3;
    K.flash(1, '230,235,255', 1.6); K.setv('dark', .2); K.lens({ shake: 7 }, 0);
    yield* wait(.25); K.lens({ shake: 0 }, .6);
    kam.eyes = 'x'; kam.face = -1; emote('!', 1.6);
    yield* par(hop(70, .5), ...gang.map(a => { a.eyes = 'groot'; return petJump(a, 50 + rnd() * 40, .45, a.cx + (rnd() - .5) * 60); }));
    K.setv('dark', .7, .4); yield* wait(.5); G.a = 0; lamp.off = false; lan.on = 1; K.setv('dark', .45, 1);
    yield* wait(1); gang.forEach(a => { a.eyes = ''; }); kam.eyes = 'groot'; emote('sweat', 3);
    // they all pile up behind Kamiel
    yield* par(...gang.map((a, i) => petTo(a, K.kx() + 80 + i * 26, 160)));
    gang.forEach(a => { a.face = -1; hold(a, 'down'); }); yield* shiver(2.5, 3); gang.forEach(a => hold(a, null));
    yield* K.fadeOut(1.8);
    yield* K.card('DEEL 2', 'DE SPOREN', 2.6, { size: 44 });

    /* ---------- part 2: the hoofprints ---------- */
    lan.x = K.kx() + 70; K.withOutfit(['nerdbril', 'hoed']);
    gang.forEach((a, i) => { a.cx = K.kx() + 140 + i * 40; a.face = -1; hold(a, null); });
    const prints = [];   // in world coordinates
    for (let k = 0; k < 26; k++) prints.push({ wx: camX() - 260 - k * 70, dy: (k % 2) * 10 });
    const printFx = fx('ground', 0, (g) => { g.fillStyle = 'rgba(240,236,228,.75)'; for (const p of prints) { const x = scr(p.wx); if (x < -20 || x > W + 20) continue;
      g.beginPath(); g.ellipse(x - 5, FEET + 18 + p.dy, 5, 3, 0, 0, 7); g.ellipse(x + 5, FEET + 18 + p.dy, 5, 3, 0, 0, 7); g.fill(); } });
    yield* K.fadeIn(2);
    kam.eyes = ''; yield* walkTo(-120, 40); kam.face = -1; kam.head = .25; emote('?', 2); yield* wait(2.5); kam.head = 0;
    const sniffer = gang.find(a => a.pet === 'wifi') || gang[0];
    yield* petTo(sniffer, K.kx() - 90, 60); hold(sniffer, 'down'); emote('dots', 2.5, sniffer); yield* wait(2.5); hold(sniffer, null);
    emote('!', 1.2, sniffer); yield* K.petJump(sniffer, 18, .3); kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1);
    // follow the prints: two scenes along, the lantern swinging
    lan.on = 0; lamp.off = true;
    const carry = K.light(() => K.kp(30, 380), 320, { col: '255,180,80', flicker: .08 });
    const lanHand = fx('front', 0, (g) => { const p = K.kp(30, 380), sw = Math.sin(K.t * 5) * 4; g.fillStyle = '#2b2118'; g.fillRect(p.x - 7 + sw, p.y, 14, 3);
      g.fillStyle = `rgba(255,${190 + Math.floor(rnd() * 40)},90,.95)`; g.fillRect(p.x - 5 + sw, p.y + 3, 10, 14); g.fillStyle = '#2b2118'; g.fillRect(p.x - 7 + sw, p.y + 17, 14, 3); });
    kam.x = 0;
    for (let s = 0; s < 2; s++) {
      yield* K.journey(-1, 75, gang);
      kam.face = -1; gang.forEach(a => { a.face = -1; }); emote('dots', 2); yield* wait(2.2);
      if (s === 0) { const lag = gang[gang.length - 1]; lag.face = 1; emote('?', 1.5, lag); yield* wait(1.6); lag.face = -1; }
      if (s === 1) {   // something white in the dark… a plastic bag on the wind
        const bag = { x: -60, y: FEET - 160 };
        const bagFx = fx('back', 0, (g) => { const x = bag.x, y = bag.y + Math.sin(K.t * 3) * 14; g.fillStyle = 'rgba(240,240,245,.9)'; g.beginPath(); g.moveTo(x - 18, y - 20);
          g.quadraticCurveTo(x, y - 30 + Math.sin(K.t * 6) * 5, x + 18, y - 20); g.lineTo(x + 14, y + 18); g.quadraticCurveTo(x, y + 24, x - 14, y + 18); g.closePath(); g.fill();
          g.fillRect(x - 14, y - 26, 5, 8); g.fillRect(x + 9, y - 26, 5, 8); });
        const bl = K.light(() => ({ x: bag.x, y: bag.y }), 90, { a: .5 });
        yield* tween(3, p => { bag.x = lerp(-60, K.kx() - 260, ez(p)); });
        kam.eyes = 'x'; emote('!', 1.4); gang.forEach(a => { a.eyes = 'groot'; }); yield* par(hop(50, .45), ...gang.map(a => petJump(a, 40, .4)));
        yield* par(...gang.map((a, i) => petTo(a, K.kx() + 90 + i * 30, 200))); gang.forEach(a => { a.face = -1; hold(a, 'down'); });
        yield* shiver(1.5, 3);
        yield* tween(4, p => { bag.x = lerp(K.kx() - 260, K.kx() - 120, p); bag.y = FEET - 160 + p * 120; });
        kam.head = .25; kam.eyes = 'groot'; emote('?', 2); yield* wait(2.2);
        yield* tween(3.5, p => { bag.x = lerp(K.kx() - 120, W + 80, ez(p)); bag.y = FEET - 40 - p * 300; });
        stop(bagFx); K.unlight(bl); kam.head = 0;
        kam.eyes = 'blij'; emote('sweat', 2.5); gang.forEach(a => { a.eyes = ''; hold(a, null); emote('dots', 2, a); }); yield* wait(3);
        kam.eyes = ''; gang.forEach((a, i) => { a.face = -1; });
        yield* par(...gang.map((a, i) => petTo(a, K.kx() + 120 + i * 40, 80))); gang.forEach(a => { a.face = -1; });
        yield* K.journey(-1, 75, gang);
        kam.face = -1; emote('dots', 2); yield* wait(2);
      }
    }
    // a clue: a tuft of white wool on the ground
    const tuft = { x: K.kx() - 180, on: true, glint: 0 };
    const tuftFx = fx('back', 0, (g) => { if (!tuft.on) return; const x = tuft.x, y = FEET + 4;
      g.fillStyle = '#f2ede4'; for (let k = 0; k < 7; k++) g.fillRect(x - 12 + (k * 7) % 22, y - 8 - (k * 5) % 10, 8, 7);
      if (Math.sin(K.t * 3) > .7) { K.sprC(g, K.SP.spark, x + 10, y - 22, 2.4); } });
    yield* walkTo(-100, 40); kam.face = -1; kam.head = .3; emote('!', 1.4); yield* wait(1.5);
    // close-up on the clue
    yield* K.lensW({ z: 2.3, cx: tuft.x, cy: FEET - 30 }, 2.2);
    yield* wait(2.5);
    const nose = gang.find(a => a.pet === 'pippa') || gang[0];
    yield* petTo(nose, tuft.x + 40, 40); nose.face = -1; hold(nose, 'down'); yield* wait(1.6); hold(nose, null);
    nose.sq = 1.1; emote('angry', 2.5, nose); yield* wait(1.4); nose.sq = 1;   // she knows that smell
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 1.8);
    kam.head = 0; emote('dots', 2.5); gang.forEach(a => { a.face = a.cx < K.kx() ? 1 : -1; }); yield* wait(3);
    tuft.on = false; stop(tuftFx); stop(printFx);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 3', 'DE VAL', 2.6, { size: 44 });

    /* ---------- part 3: the trap ---------- */
    const hay = { x: K.kx() - 210, on: true, left: 1 };
    const hayFx = fx('back', 0, (g) => { if (!hay.on) return; const x = hay.x, y = FEET + 10;
      g.fillStyle = '#6b4a2a'; g.fillRect(x - 34, y - 34, 68, 34); g.fillStyle = '#86603a'; g.fillRect(x - 34, y - 34, 68, 6); g.fillRect(x - 34, y - 14, 68, 4);
      g.fillStyle = '#e8c35a'; for (let k = 0; k < 16 * hay.left; k++) { const a = k * 1.7; g.fillRect(x - 30 + (k * 13) % 60, y - 40 - (k * 7) % 22 * hay.left, 3, 12 + (k % 3) * 4); } });
    gang.forEach((a, i) => { a.cx = K.kx() + 120 + i * 45; a.face = -1; });
    yield* K.fadeIn(1.8);
    emote('sparks', 1.5); yield* wait(1.5);
    // the plan: everyone hides
    const hide = [];
    for (const [i, a] of gang.entries()) {
      const tx = i % 2 ? K.kx() + 140 + i * 30 : K.kx() + 70 + i * 20;
      hide.push(petTo(a, tx, K.PET[a.pet].run * .8));
    }
    yield* par(walkTo(60, 50), ...hide);
    kam.face = -1; gang.forEach(a => { a.face = -1; hold(a, a.pet === 'dobby' ? 'lie' : 'lie'); });
    const dob = gang.find(a => a.pet === 'dobby');
    let mound = null;
    if (dob) {   // Dobby digs himself in: only his ears stick out
      const dirt = K.particles('front', { until: K.t + 2, emit: (ps) => { if (rnd() < .6) ps.push(K.P({ x: dob.cx, y: FEET - 4, vx: (rnd() - .5) * 120, vy: -90 - rnd() * 60, grav: 320, life: .7 })); },
        draw: (g, p, k) => { g.fillStyle = `rgba(110,80,50,${1 - k})`; g.fillRect(p.x, p.y, 4, 4); } });
      hold(dob, 'down'); yield* wait(2); stop(dirt); dob.alpha = 0;
      const mx = dob.cx;
      mound = fx('back', 0, (g) => { g.fillStyle = '#5a4128'; g.beginPath(); g.ellipse(mx, FEET + 2, 26, 9, 0, Math.PI, 0); g.fill();
        g.fillStyle = '#3b2b20'; g.fillRect(mx - 8, FEET - 22 + Math.sin(K.t * 2) * 1, 5, 16); g.fillRect(mx + 2, FEET - 24, 5, 18); });
    }
    kam.eyes = 'boos'; kam.head = .1; yield* wait(2);
    yield* tween(3, p => { K.setv('dark', lerp(.45, .6, p)); });
    yield* wait(3);
    const sleepy = gang.find(a => a.pet === 'wifi');
    if (sleepy) { hold(sleepy, 'sleep'); const zz = emote('zzz', 9, sleepy); yield* wait(4.5); kam.face = 1; kam.eyes = 'boos'; emote('angry', 1.5); yield* wait(1.8);
      stop(zz); hold(sleepy, 'lie'); sleepy.eyes = 'groot'; yield* wait(1); sleepy.eyes = ''; kam.face = -1; }
    yield* wait(4);
    // here it comes
    G.on = true; G.face = 1; G.feet = FEET - 6; G.x = -110; G.bob = 1;
    yield* tween(7, p => { G.x = lerp(-110, hay.x - 60, ez(p)); G.a = Math.min(1, p * 3); });
    G.face = -1; yield* wait(1); G.face = 1; G.bob = .2;
    // it eats the hay. It chews like someone we know.
    yield* tween(8, p => { G.chew = Math.abs(Math.sin(p * 28)); hay.left = 1 - p * .6; });
    G.chew = 0;
    kam.head = 0; kam.eyes = 'groot'; emote('!', 1.2); yield* hop(30, .35);
    // ATTACK
    gang.forEach(a => { a.eyes = 'groot'; hold(a, null); });
    if (dob) { stop(mound); dob.alpha = 1; dob.cx = hay.x + 120; yield* K.petJump(dob, 60, .45, hay.x + 60); }
    K.lens({ shake: 4 }, 0);
    yield* par(...gang.filter(a => a !== dob).map((a, i) => petTo(a, G.x + 70 + i * 22, 260)), walkTo(G.x - W / 2 + 150, 120));
    K.lens({ shake: 0 }, .4);
    // tug of war
    const pullers = gang.filter(a => a.pet !== 'dobby');
    pullers.forEach((a, i) => { a.face = -1; hold(a, 'down'); a.cx = G.x + 85 + i * 24; });
    if (dob) { dob.cx = G.x + 60; dob.face = 1; }
    emote('angry', 3); pullers.forEach(a => emote('burst', .6, a));
    for (let k = 0; k < 4; k++) {
      yield* tween(1.1, p => { G.pull = Math.sin(p * Math.PI) * (1 + k * .4); pullers.forEach((a, i) => { a.cx = G.x + 85 + i * 24 + G.pull * 18; a.r = .12 * G.pull; }); });
      if (dob && k === 1) { dob.sq = .85; K.lens({ shake: 3 }, 0); yield* wait(.2); dob.sq = 1; K.lens({ shake: 0 }, .3); }   // a stamp of the hind paw
      yield* wait(.25);
    }
    // the sheet comes off: freeze frame
    let sheetFly = { x: G.x, y: FEET - 120, r: 0, on: true };
    G.on = false; h.alpha = 1; h.cx = G.x; h.face = -1; h.feet = FEET - 6; h.eyes = 'vies'; h.pose = 'stand'; h.lockPose = true;
    const flyFx = fx('front', 0, (g) => { if (!sheetFly.on) return; g.save(); g.translate(sheetFly.x, sheetFly.y); g.rotate(sheetFly.r);
      g.fillStyle = 'rgba(244,244,250,.95)'; g.beginPath(); g.moveTo(-70, -30); g.quadraticCurveTo(0, -60, 70, -20); g.lineTo(60, 30); g.quadraticCurveTo(0, 10, -60, 34); g.closePath(); g.fill();
      g.fillStyle = '#0b0a12'; g.fillRect(-30, -20, 9, 12); g.fillRect(-10, -24, 9, 12); g.restore(); });
    yield* tween(.6, p => { sheetFly.x = G.x + 200 * p; sheetFly.y = FEET - 120 - Math.sin(p * Math.PI) * 60 + p * 90; sheetFly.r = p * 2; pullers.forEach(a => { a.r = .3 * (1 - p); a.cx += 140 * K.dt; }); });
    pullers.forEach(a => { a.r = 0; hold(a, 'lie'); });
    K.flash(1, '255,255,255', 1.2); K.setv('dark', 0, .01); K.grade('sepia', 1, .01); K.setv('ab', 1);
    yield* K.lensW({ z: 2.6, cx: h.cx - 20, cy: FEET - 160 }, .5);
    yield* wait(3.2);   // frozen: Heidi, chewing hay
    K.setv('ab', 0, 1); K.grade('nacht', 1, 1.5); K.setv('dark', .4, 1.5);
    lan.x = K.kx() + 60; lan.on = 1; stop(lanHand); K.unlight(carry); lamp.off = false;
    yield* K.lensW({ z: 1.6, cx: h.cx + 40, cy: FEET - 120 }, 1.5);
    for (let k = 0; k < 3; k++) { yield* tween(1.2, p => { h.sq = 1 + Math.sin(p * 30) * .015; }); h.face = k % 2 ? -1 : 1; }   // she keeps chewing. She does not care.
    emote('dots', 2.5, h);
    kam.eyes = 'groot'; emote('!?', 2); gang.forEach(a => { hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.face = a.cx < h.cx ? 1 : -1; emote('?', 2, a); });
    yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 2);
    yield* wait(1.5);
    yield* K.fadeOut(1.6);
    yield* K.card('DEEL 4', 'HET EINDE VAN DE NACHT', 2.6, { size: 44 });

    /* ---------- part 4: morning; she has the last laugh ---------- */
    stop(fog); K.setv('dark', 0, .01); K.grade('warm', .8, .01); stop(hayFx); stop(flyFx); lan.on = 0; K.unlight(lamp); K.unlight(gGlow);
    kam.outfit = null; kam.x = 0; kam.face = -1; kam.eyes = ''; kam.head = 0;
    h.lockPose = false; h.cx = W / 2 - 220; h.face = 1; h.eyes = 'vies';
    gang.forEach((a, i) => { a.cx = W / 2 + 120 + i * 50; a.face = -1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.eyes = ''; a.r = 0; });
    yield* K.fadeIn(2.2);
    yield* wait(2);
    // she leaves, with dignity…
    yield* K.actorTo(h, -140, 45); h.alpha = 0; yield* wait(2);
    kam.eyes = 'blij'; emote('hearts', 2); gang.forEach(a => emote('heart', 1.5, a)); yield* wait(3);
    // … and comes back as the ghost one last time
    G.on = true; G.a = 1; G.face = 1; G.x = -120; G.feet = FEET - 6; G.bob = 1; G.pull = 0;
    yield* tween(1.2, p => { G.x = lerp(-120, W / 2 - 60, ez(p)); });
    K.lens({ shake: 5 }, 0);
    kam.eyes = 'x'; emote('!', 1.5); yield* par(hop(60, .45), ...gang.map(a => petJump(a, 45 + rnd() * 30, .45)));
    K.lens({ shake: 0 }, .5); yield* wait(.6);
    // the sheet slides off: Heidi grins (as much as a llama can)
    G.on = false; h.alpha = 1; h.cx = W / 2 - 60; h.face = 1; h.eyes = 'blij'; emote('sparks', 2, h);
    yield* wait(2.2);
    kam.eyes = 'blij'; emote('hearts', 3); gang.forEach(a => emote('hearts', 3, a));
    // Dobby wants to be a ghost too
    if (dob) {
      dob.deco = (g, at, u) => { const hd = at('head'); g.fillStyle = 'rgba(244,244,250,.95)'; g.beginPath(); g.moveTo(hd.x - 14 * u, hd.y + 30 * u); g.quadraticCurveTo(hd.x - 16 * u, hd.y - 6 * u, hd.x, hd.y - 4 * u);
        g.quadraticCurveTo(hd.x + 18 * u, hd.y - 4 * u, hd.x + 20 * u, hd.y + 30 * u); g.closePath(); g.fill(); g.fillStyle = '#0b0a12'; g.fillRect(hd.x - 6 * u, hd.y + 8 * u, 2 * u, 3 * u); g.fillRect(hd.x - 1 * u, hd.y + 8 * u, 2 * u, 3 * u); };
      const snoet = gang.find(a => a.pet === 'snoet') || gang[0];
      yield* petTo(dob, snoet.cx - 40, 50); dob.face = 1; yield* K.petJump(dob, 20, .3);
      if (snoet !== dob) { snoet.eyes = 'groot'; yield* K.petJump(snoet, 50, .45, snoet.cx + 80); snoet.eyes = ''; emote('heart', 2, dob); }
      yield* wait(2);
    }
    yield* par(...gang.map(a => (function* () { yield* wait(rnd()); yield* K.petJump(a, 20, .35); })()), hop(30, .4));
    yield* wait(2);
    // one photo, all together: Heidi in the middle, of course
    yield* par(K.actorTo(h, W / 2 - 40, 40), walkTo(110, 40), ...gang.map((a, i) => petTo(a, W / 2 - 200 + i * 90 + (i > 1 ? 160 : 0), K.PET[a.pet].run * .6)));
    h.face = -1; kam.face = -1; gang.forEach(a => { a.face = -1; hold(a, a.pet === 'dobby' ? 'up' : 'sit'); });
    yield* K.lensW({ z: 1.25, cx: W / 2 + 20, cy: FEET - 110 }, 2);
    yield* wait(1.5); kam.eyes = 'blij'; h.eyes = 'blij';
    for (let k = 3; k > 0; k--) { emote('dots', .9); yield* wait(1); }
    K.flash(1, '255,255,255', 1.4); K.grade('sepia', 1, .01); K.setv('ab', .6);
    yield* wait(3.5);
    K.setv('ab', 0, 1); K.grade('warm', .8, 1.5); yield* K.lensW({ z: 1, cx: W / 2, cy: K.H / 2 }, 2);
    h.eyes = 'vies'; emote('dots', 2, h); yield* wait(2.5);
    yield* K.ending('EINDE');
  } };
})();
