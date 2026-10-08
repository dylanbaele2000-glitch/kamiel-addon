/* Composing a scene the way a photographer would arrange whatever happens to be there.
   Every place gets one "way of looking" (a style). For that style Kamiel tries many layouts
   and keeps the one that scores best. Some rules always count: nothing just touches anything
   else (no tangents), and ground objects never stand in front of horizon objects. */
(function () {
  // id, weight, what it does (also shown in the Studio)
  const STYLES = [
    ['vrij', 3, 'Vrij: in balans, de belangrijkste dingen op een derde van het beeld'],
    ['held', 2, 'Eén held: één object is duidelijk de hoofdrol, de rest is bijrol'],
    ['diepte', 2, 'Diepte: een groot object vlak vooraan, half uit beeld'],
    ['leegte', 1, 'Leegte: bijna niets, veel ruimte (negeert het minimum)'],
    ['groepje', 2, 'Groepje: drie dingen dicht bij elkaar, de rest los'],
    ['ritme', 1, 'Ritme: hetzelfde element drie keer, steeds kleiner naar achter'],
    ['verhouding', 1, 'Verhouding: soms vooral lucht, soms vooral grond'],
    ['lijn', 1, 'Lijn: van groot vooraan naar klein achteraan, een lijn naar Kamiel'],
  ];

  function create(A) {
    const PLACE = A.PLACE, H = A.H, FEET = A.FEET, HALF = PLACE / 2, EDGE = 24, rnd = Math.random;
    const S = A.S, OBJ = A.OBJ;
    const recent = [];
    let curWx0 = 0;
    const asp = (o) => o.size[0] / o.size[1];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sgn = () => rnd() < .5 ? -1 : 1;

    function pickFrom(list) {
      // seasonal and holiday elements show up a lot more during their own period
      const w = list.map(o => (o.rare === 'zeldzaam' ? 0.25 : o.rare === 'heelzeldzaam' ? 0.06 : 1) * (o.period && o.period !== 'altijd' ? 3 : 1) * (o.weather && o.weather.length ? 3 : 1));
      let r = rnd() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
      return list[list.length - 1];
    }
    function chooseStyle(force) {
      const on = (S.compose && S.compose.styles) || {};
      const list = STYLES.filter(s => on[s[0]] !== false);
      if (force && list.some(s => s[0] === force)) return force;
      if (!list.length) return 'vrij';
      let r = rnd() * list.reduce((a, s) => a + s[1], 0);
      for (const s of list) { r -= s[1]; if (r <= 0) return s[0]; }
      return list[0][0];
    }

    /* ---------- hills: soft shapes far away, behind the horizon ---------- */
    function makeHills() {
      const HS = S.hills || {};
      if (rnd() * 100 >= (HS.chance === undefined ? 40 : +HS.chance)) return null;
      const maxH = (+HS.height || 18) / 100 * H, ranges = [], two = rnd() < .35;
      for (let r = 0; r < (two ? 2 : 1); r++) {
        const back = two && r === 0, bumps = [];
        for (let b = 0, nb = 1 + Math.floor(rnd() * 3); b < nb; b++)
          bumps.push({ cx: (rnd() * 2 - 1) * HALF * .85, w: 220 + rnd() * 420, h: maxH * (back ? .75 + rnd() * .35 : .35 + rnd() * .55) });
        ranges.push({ bumps, back, haze: back ? .5 : .26 });
      }
      return { ranges };
    }
    // height of one range of hills at dx (place coordinates); zero at the place's edges so places fit together
    function hillH(range, dx) {
      const t = clamp((HALF - Math.abs(dx)) / 150, 0, 1), taper = t * t * (3 - 2 * t);
      let m = 0;
      for (const b of range.bumps) { const u = (dx - b.cx) / b.w; if (Math.abs(u) < .5) m = Math.max(m, b.h * (.5 + .5 * Math.cos(u * 2 * Math.PI))); }
      return m * taper;
    }
    const crestH = (hills, dx) => hills ? Math.max.apply(null, hills.ranges.map(r => hillH(r, dx))) : 0;
    const frontH = (hills, dx) => hills ? hillH(hills.ranges[hills.ranges.length - 1], dx) : 0;

    /* ---------- one scene ---------- */
    function compose(i, ctx) {
      const night = ctx.night, ok = ctx.ok, wx0 = i * PLACE + PLACE / 2;
      curWx0 = wx0;
      const hy = (dx) => A.horY(wx0 + dx);
      const style = chooseStyle(ctx.style);
      const colorOn = !(S.compose && S.compose.color === false) && rnd() < .6;
      const sub = rnd() < .5 ? 'lucht' : 'grond';   // for "verhouding"

      // how many of each kind: "at least" to "at most", by day and by night (Studio)
      const DEFC = { grond: [2, 4], horizon: [1, 3], lucht: [1, 2], kader: [0, 1] };
      const cnt = (S.counts && S.counts[night ? 'nacht' : 'dag']) || {};
      const num = (k) => { const r = cnt[k] || DEFC[k], lo = Math.max(0, +r[0] || 0), hi = Math.max(lo, +r[1] || 0); return lo + Math.floor(rnd() * (hi - lo + 1)); };
      let nH = num('horizon'), nS = num('lucht'), nG = num('grond'), nF = num('kader');
      if (style === 'leegte') { nG = rnd() < .5 ? Math.min(nG, 1) : 0; nH = Math.min(Math.max(nH, 1), 1); nS = Math.min(nS, 1); nF = 0; }
      if (style === 'verhouding' && sub === 'lucht') { nS += 1; nG = Math.max(0, nG - 1); }
      if (style === 'verhouding' && sub === 'grond') { nS = Math.max(0, nS - 1); nG += 1; }
      if (style === 'groepje') nG = Math.max(nG, 3);
      const maxO = Math.max(1, +(S.max_objects || 12));
      while (nH + nS + nG + nF > maxO) {
        const opts = []; if (nH) opts.push('h'); if (nS) opts.push('s'); if (nG) opts.push('g'); if (nF) opts.push('f');
        const d = opts[Math.floor(rnd() * opts.length)];
        if (d === 'h') nH--; else if (d === 's') nS--; else if (d === 'g') nG--; else nF--;
      }

      const used = new Set();
      const take = (kinds) => {
        let pool = OBJ.filter(o => kinds.includes(o.kind) && ok(o) && !used.has(o) && !recent.includes(o.id));
        if (!pool.length) pool = OBJ.filter(o => kinds.includes(o.kind) && ok(o) && !used.has(o));
        // asked for more than there are: a ground or horizon element may come twice (never in the sky)
        if (!pool.length && !kinds.includes('lucht')) pool = OBJ.filter(o => kinds.includes(o.kind) && ok(o));
        if (!pool.length) return null;
        const o = pickFrom(pool); used.add(o); recent.push(o.id); if (recent.length > 6) recent.shift(); return o;
      };
      const want = [];
      if (style === 'ritme') {   // one element, three times
        const o = take(['grond']) || take(['horizon']);
        if (o) { for (let k = 0; k < 3; k++) want.push({ o, layer: o.kind === 'horizon' ? 1 : 2, rhythm: k }); if (o.kind === 'grond') nG = Math.max(0, nG - 3); else nH = Math.max(0, nH - 3); }
      }
      for (let k = 0; k < nF; k++) { const o = take(['kader']); if (o) want.push({ o, layer: 2 }); }
      for (let k = 0; k < nG; k++) { const o = take(['grond']); if (o) want.push({ o, layer: 2 }); }
      for (let k = 0; k < nH; k++) { const o = take(['horizon']); if (o) want.push({ o, layer: 1 }); }
      for (let k = 0; k < nS; k++) { const o = take(['lucht']); if (o) want.push({ o, layer: 0 }); }

      const hills = makeHills();
      let best = null;
      const tries = want.length ? 28 : 1;
      for (let t = 0; t < tries; t++) {
        const cand = layout(want, style, sub, hills, hy);
        cand.score = score(cand, style, colorOn, hills, hy);
        if (!best || cand.score > best.score) best = cand;
      }
      const items = best.items;
      stack(items, ok);
      for (const it of items) dress(it);
      items.sort((p, q) => (p.layer - q.layer) || ((p.onHill ? -1 : 0) - (q.onHill ? -1 : 0)) || ((p.depth || 0) - (q.depth || 0)));
      return { items, hills, style, score: best.score };
    }

    function dress(it) {
      const o = it.o;
      if (o.sign && !it.word) { const cs = o.colors || ['paars']; it.color = cs[Math.floor(rnd() * cs.length)]; it.word = A.words[Math.floor(rnd() * A.words.length)]; }
      if (o.kind === 'kader' && it.photo === undefined) it.photo = A.photos[Math.floor(rnd() * A.photos.length)];
    }

    /* one attempt at a layout */
    function layout(want0, style, sub, hills, hy) {
      const DEFSZ = { grond: [10, 40], horizon: [15, 42], lucht: [12, 38], kader: [18, 42] };
      const SZ = Object.assign({}, DEFSZ, S.sizes || {});
      const giantP = (S.giant_chance === undefined ? 10 : +S.giant_chance) / 100;
      const GAP = S.spacing === undefined ? 30 : +S.spacing;
      const LANE = Math.max(64, +(S.lane || 94)), KTOP = FEET - 225;
      const maxW = HALF - LANE - EDGE - 10;
      const sizeFor = (o, t, noGiant) => {
        const [lo, hi] = SZ[o.kind] || DEFSZ.grond;
        let h = (lo + (hi - lo) * t) * H / 100;
        if (!noGiant && rnd() < giantP) h = hi * H / 100 * (1.4 + rnd() * .4);
        return h * (o.scale || 1);
      };
      const fit = (c) => { c.h = Math.max(12, Math.min(c.h, H * .9, maxW / asp(c.o))); c.w = c.h * asp(c.o); };

      const cs = want0.map(c => Object.assign({}, c));
      for (const c of cs) {
        if (c.layer === 2) { c.depth = rnd(); c.h = sizeFor(c.o, .25 * rnd() + .75 * c.depth); }
        else if (c.layer === 1) c.h = sizeFor(c.o, rnd());
        else c.h = sizeFor(c.o, rnd()) * (/oog|eye/i.test(c.o.label || '') ? .6 : 1);
      }
      const standing = cs.filter(c => c.layer > 0 && c.rhythm === undefined);
      if (style === 'held' && standing.length) {
        const hero = standing.sort((a, b) => ((b.o.kind === 'kader') - (a.o.kind === 'kader')) || (rnd() - .5))[0];
        hero.hero = true; hero.h = (SZ[hero.o.kind] || DEFSZ.grond)[1] * H / 100 * (1.05 + rnd() * .25) * (hero.o.scale || 1);
        if (hero.layer === 2) hero.depth = .75 + rnd() * .25;
        for (const c of cs) if (!c.hero) c.h *= .62;
      }
      if (style === 'verhouding') for (const c of cs) {
        if (sub === 'lucht') c.h *= c.layer === 0 ? 1.3 : c.layer === 2 ? .65 : .85;
        else c.h *= c.layer === 0 ? .7 : c.layer === 2 ? 1.3 : 1;
      }
      const grounds = cs.filter(c => c.layer === 2 && c.rhythm === undefined);
      if (style === 'diepte' && grounds.length) {
        const f = grounds[Math.floor(rnd() * grounds.length)];
        f.crop = true; f.depth = 1; f.h = (SZ[f.o.kind] || DEFSZ.grond)[1] * H / 100 * (1.1 + rnd() * .3) * (f.o.scale || 1);
        for (const c of cs) if (c !== f && c.layer === 2) { c.depth *= .7; c.h *= .85; }
      }
      if (style === 'groepje' && grounds.length >= 3) {
        const g = grounds.slice(0, 3), base = sizeFor(g[0].o, .45 + rnd() * .3, true), d = .35 + rnd() * .35;
        g.forEach((c, k) => { c.group = k; c.depth = clamp(d + (rnd() - .5) * .15, 0, 1); c.h = base * (.75 + rnd() * .5) * (c.o.scale || 1); });
      }
      if (style === 'lijn' && grounds.length >= 2) {
        grounds.sort((a, b) => b.h - a.h).forEach((c, k, arr) => { c.line = k; c.depth = 1 - k / Math.max(1, arr.length - 1) * .85; c.h *= 1.15 - k * .18; });
      }
      const rh = cs.filter(c => c.rhythm !== undefined);
      if (rh.length) { const h0 = sizeFor(rh[0].o, .7 + rnd() * .3, true); rh.forEach(c => { c.h = h0 * [1, .72, .52][c.rhythm]; c.depth = [.92, .62, .34][c.rhythm]; }); }
      for (const c of cs) { if (c.crop) { c.h = Math.min(c.h, H * .9); c.w = c.h * asp(c.o); } else fit(c); }

      const items = [], taken = [], takenSky = [], rects = [];
      let missing = 0;
      const free = (l, r, gap, list) => (list || taken).every(([a, b]) => r + gap < a || l - gap > b);
      const moment = () => rects.reduce((a, r) => a + r.wt * (r.x1 - r.x0) * (r.y1 - r.y0) * (r.x0 + r.x1) / 2, 0);
      const lighter = () => { const m = moment(); return m === 0 ? sgn() : (m > 0 ? -1 : 1); };
      const sideSpot = (w, side, gap) => {
        const lo = LANE + w / 2, hi = HALF - EDGE - w / 2; if (hi < lo) return null;
        for (let t = 0; t < 30; t++) { const dx = side * (lo + rnd() * (hi - lo)); if (free(dx - w / 2, dx + w / 2, gap)) return dx; }
        return null;
      };
      const anySpot = (w, gap) => { const s = lighter(); const a = sideSpot(w, s, gap); return a !== null ? a : sideSpot(w, -s, gap); };
      const place = (c, dx) => {
        const o = c.o;
        if (c.layer === 1) {
          const it = { o, layer: 1, dx, h: c.h, flip: rnd() < .35 };
          // sometimes far away, smaller, on the hills
          // it stands a little behind the front hill: its foot rests on the lowest point of the crest under it,
          // the higher parts of the hill hide the rest of its foot. Only where the hill is flat enough for that.
          if (hills && !c.hero && rnd() < .5 && frontH(hills, dx) > 30) {
            const h2 = c.h * .6, half = h2 * asp(o) * .36;
            let lo = -1e9, hi = 1e9, low = 1e9;
            for (let x = dx - half; x <= dx + half + .1; x += Math.max(2, half / 8)) { const y = hy(x) - frontH(hills, x); lo = Math.max(lo, y); hi = Math.min(hi, y); low = Math.min(low, frontH(hills, x)); }
            if (low > 18 && lo - hi <= h2 * .16) { it.onHill = true; it.h = h2; it.base = lo + 1; }
          }
          const w = it.h * asp(o), base = it.onHill ? it.base : A.baseY(curWx0 + dx, w);
          rects.push({ x0: dx - w / 2, x1: dx + w / 2, y0: base - it.h * .95, y1: base, layer: 1, wt: o.wt === undefined ? .5 : o.wt, it, onHill: it.onHill });
          items.push(it); return true;
        }
        let h = c.h, depth = c.depth;
        const y0 = hy(dx), span = Math.max(20, FEET - 22 - y0);
        if (o.grass_only) {   // only on the grass: never sticks out above the horizon
          h = Math.min(h, FEET - 8 - y0 - 12); if (h < 10) return false;
          depth = Math.max(depth, clamp((h * .95 + 6 - 14) / span, 0, 1));
        }
        const foot = y0 + 14 + depth * span;
        const it = { o, layer: 2, dx, depth, h, flip: rnd() < .5 && o.kind === 'grond' && !o.sign };
        const w = h * asp(o);
        rects.push({ x0: dx - w / 2, x1: dx + w / 2, y0: foot - h * .95, y1: foot, layer: 2, wt: o.wt === undefined ? .5 : o.wt, it, hero: c.hero, crop: c.crop });
        items.push(it); return true;
      };
      // biggest and special pieces first, sky last
      const order = cs.slice().sort((p, q) => ((p.layer === 0) - (q.layer === 0)) || ((q.crop || q.hero ? 1 : 0) - (p.crop || p.hero ? 1 : 0))
        || ((p.rhythm === undefined) - (q.rhythm === undefined)) || ((p.group === undefined) - (q.group === undefined)) || (q.w - p.w));
      let rSide = sgn(), rOut = 0, gSide = sgn(), gNext = null, lineSide = sgn();
      for (const c of order) {
        if (c.layer === 0) continue;
        let dx = null;
        if (c.crop) { const s = sgn(); dx = s * (HALF + c.w * (.05 + rnd() * .2) - c.w / 2); if (!free(dx - c.w / 2, dx + c.w / 2, GAP)) dx = null; }
        else if (c.rhythm !== undefined) {
          const d = rSide * (LANE + 16 + rOut + c.w / 2);
          if (Math.abs(d) + c.w / 2 <= HALF - EDGE && free(d - c.w / 2, d + c.w / 2, 14)) { dx = d; rOut += c.w + 18; }
        }
        else if (c.group !== undefined) {
          if (gNext === null) { const d = sideSpot(c.w * 3.4, gSide, GAP); if (d !== null) { dx = d - gSide * c.w * 1.2; } }
          else { const d = gNext + gSide * (c.w / 2 + 14 + rnd() * 6); if (Math.abs(d) - c.w / 2 >= LANE && Math.abs(d) + c.w / 2 <= HALF - EDGE && free(d - c.w / 2, d + c.w / 2, 12)) dx = d; }
          if (dx !== null) gNext = dx + gSide * c.w / 2;
        }
        else if (c.hero) { const s = sgn(); for (let t = 0; t < 12 && dx === null; t++) { const d = s * clamp(160 + (rnd() - .5) * 80, LANE + c.w / 2, HALF - EDGE - c.w / 2); if (free(d - c.w / 2, d + c.w / 2, GAP)) dx = d; } }
        else if (c.line !== undefined) {   // from big at the far side to small near Kamiel
          const tpos = 1 - c.line / Math.max(1, grounds.length - 1) * .75, d = lineSide * clamp(LANE + c.w / 2 + (HALF - EDGE - LANE - c.w) * tpos, LANE + c.w / 2, HALF - EDGE - c.w / 2);
          if (free(d - c.w / 2, d + c.w / 2, GAP)) dx = d;
        }
        if (dx === null) dx = anySpot(c.w, GAP);
        if (dx === null || !place(c, dx)) { missing++; continue; }
        const it = items[items.length - 1], w = it.h * asp(it.o);
        taken.push([dx - w / 2, dx + w / 2]);   // ground and horizon share one row: ground never stands in front of the horizon
      }
      for (const c of order) {
        if (c.layer !== 0) continue;
        let done = false;
        for (let t = 0; t < 40 && !done; t++) {
          const y = 30 + rnd() * Math.max(10, (style === 'verhouding' && sub === 'lucht' ? 360 : 320) - c.h);
          const lane = y + c.h > KTOP - 10;
          const side = sgn(), lo = (lane ? LANE : 0) + c.w / 2, hi = HALF - EDGE - c.w / 2;
          if (hi < lo) continue;
          const dx = side * (lo + rnd() * (hi - lo));
          const x0 = dx - c.w / 2 - 24, x1 = dx + c.w / 2 + 24;
          if (rects.some(r => r.layer > 0 && x0 < r.x1 && x1 > r.x0 && y - 24 < r.y1 && y + c.h + 24 > r.y0)) continue;
          if (!free(dx - c.w / 2, dx + c.w / 2, GAP, takenSky)) continue;
          takenSky.push([dx - c.w / 2, dx + c.w / 2]);
          const it = { o: c.o, layer: 0, dx, y, h: c.h, flip: rnd() < .5 };
          rects.push({ x0: dx - c.w / 2, x1: dx + c.w / 2, y0: y, y1: y + c.h, layer: 0, wt: (c.o.wt === undefined ? .5 : c.o.wt) * .6, it });
          items.push(it); done = true;
        }
        if (!done) missing++;
      }
      // things that look somewhere look toward Kamiel
      for (const it of items) if (it.o.gaze) it.flip = it.dx < 0 ? it.o.gaze === 'links' : it.o.gaze === 'rechts';
      return { items, rects, missing };
    }

    /* how good a layout is: higher is better */
    function score(c, style, colorOn, hills, hy) {
      let s = rnd() * .6 - c.missing * 3;
      s -= 40 * tangents(c.rects, hills, hy);
      const R = c.rects, area = (r) => (r.x1 - r.x0) * (r.y1 - r.y0);
      if (style !== 'leegte' && style !== 'ritme' && R.length) {   // balance like a see-saw: heavy near the middle balances light far out
        let m = 0, tot = 0; for (const r of R) { const w = r.wt * area(r); m += w * (r.x0 + r.x1) / 2; tot += w; }
        s -= 3 * Math.abs(m / (tot * HALF || 1));
      }
      const heavy = R.filter(r => r.layer > 0 && !r.crop).sort((a, b) => b.wt * area(b) - a.wt * area(a)).slice(0, style === 'held' ? 1 : 2);
      for (const r of heavy) s -= .8 * Math.min(200, Math.abs(Math.abs((r.x0 + r.x1) / 2) - 160)) / 160;   // on a third
      if (style === 'diepte') { const d = R.filter(r => r.layer === 2).map(r => r.it.depth); if (d.length > 1) s += Math.max.apply(null, d) - Math.min.apply(null, d); }
      if (colorOn) {
        const cols = R.filter(r => (r.it.o.sat || 0) >= .25).map(r => r.it.o);
        let clash = 0, loud = 0;
        for (let a = 0; a < cols.length; a++) {
          if (cols[a].sat > .6) loud++;
          for (let b = a + 1; b < cols.length; b++) { const d = Math.abs(((cols[a].hue - cols[b].hue) % 360 + 540) % 360 - 180); if (d > 45 && d < 150) clash++; }
        }
        s -= 1.5 * clash / Math.max(1, cols.length) + Math.max(0, loud - 1) * .8;
      }
      return s;
    }

    /* things that just touch look like a mistake: they either overlap clearly or keep a clear distance */
    function tangents(rects, hills, hy) {
      let n = 0;
      const ins = rects.map(r => { const ix = (r.x1 - r.x0) * .04, iy = (r.y1 - r.y0) * .04; return { x0: r.x0 + ix, x1: r.x1 - ix, y0: r.y0 + iy, y1: r.y1 - iy, r }; });
      const touch = (a, b) => {
        const gx = Math.max(a.x0 - b.x1, b.x0 - a.x1), gy = Math.max(a.y0 - b.y1, b.y0 - a.y1);
        if (gx < 0 && gy >= 0 && gy < 10) return true;
        if (gy < 0 && gx >= 0 && gx < 10) return true;
        return gx < 0 && gy < 0 && Math.min(-gx, -gy) < 8;
      };
      const K = { x0: -60, x1: 60, y0: FEET - 220, y1: FEET };
      for (let a = 0; a < ins.length; a++) {
        const A1 = ins[a], r = A1.r, cx = (r.x0 + r.x1) / 2;
        for (let b = a + 1; b < ins.length; b++) if (touch(A1, ins[b])) n++;
        if (r.layer !== 2 && touch(A1, K)) n++;
        if (r.layer === 2 && Math.abs(r.y0 - hy(cx)) < 8) n++;                     // a top right on the horizon line
        if (hills && r.layer === 1 && !r.onHill && Math.abs(r.y0 - (hy(cx) - crestH(hills, cx))) < 8) n++;   // or right on a hilltop
        if (hills && r.layer === 0) { let crest = 1e9; for (let x = r.x0; x <= r.x1; x += 12) crest = Math.min(crest, hy(x) - crestH(hills, x)); const g = crest - r.y1; if (g > -8 && g < 10) n++; }
        if (!r.crop && ((r.x0 > -HALF - 4 && r.x0 < -HALF + 12) || (r.x1 < HALF + 4 && r.x1 > HALF - 12))) n++;   // just touching the edge
      }
      return n;
    }

    /* stacks: things that "can stand on others" on things that "can carry" */
    function stack(items, ok) {
      const ST = S.stack || {}, chance = ST.chance === undefined ? 35 : +ST.chance, max = clamp(+ST.max || 3, 2, 4);
      const pool = OBJ.filter(o => o.stack && ok(o) && o.kind !== 'wolk');
      if (!pool.length || !chance) return;
      for (const base of items.slice()) {
        if (!base.o.carry || base.on || rnd() * 100 >= chance) continue;
        if (base.layer === 0 && base.y < 110) continue;   // no room above it
        let parent = base;
        for (let level = 1; level < max; level++) {
          const choice = pool.filter(o => o !== parent.o); if (!choice.length) break;
          const o = pickFrom(choice), pw = parent.h * asp(parent.o);
          // a logical size: clearly smaller than what it stands on
          let w = pw * (.3 + rnd() * .35), h = w / asp(o);
          if (h > parent.h * .85) { h = parent.h * .85; w = h * asp(o); }
          if (h < 10) break;
          const child = { o, layer: parent.layer, on: parent, ox: (rnd() - .5) * .3, h, flip: rnd() < .5 && !o.sign, depth: (parent.depth || 0) - .0005, dx: parent.dx, y: parent.y, onHill: parent.onHill };
          items.push(child); parent = child;
          if (!o.carry || rnd() < .4) break;
        }
      }
    }

    return { compose, makeHills, hillH, crestH, frontH, pickFrom };
  }

  window.KamielCompose = { STYLES, create };
})();
