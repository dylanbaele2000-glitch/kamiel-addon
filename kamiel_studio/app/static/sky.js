/* Kamiel's real sky: the stars and constellations that are really up, the planets, shooting stars (more during the
   real meteor showers), a nebula on some nights, the ISS when it really passes over, solar and lunar eclipses on their
   real dates, a rainbow after the rain, real lightning nearby, planes that really fly over the house, and geese that
   migrate in autumn and spring.
   It uses astronomy-engine (lib/astronomy.min.js) and satellite.js (lib/satellite.min.js), both MIT.
   The screen looks south: east is on the left, west on the right (the same as the sun and the moon). */
(function () {
  const D2R = Math.PI / 180;
  const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const nz = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hsh(i) * (1 - u) + hsh(i + 1) * u; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seeded = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return ((h >>> 0) % 100000) / 100000; };

  /* ---------- stars: [name, RA (hours), Dec (degrees), magnitude] and the lines of the constellations ---------- */
  const STARS = {
    betelgeuse: [5.919, 7.41, .5], rigel: [5.242, -8.20, .1], bellatrix: [5.419, 6.35, 1.6], saiph: [5.796, -9.67, 2.1], alnitak: [5.679, -1.94, 1.8],
    alnilam: [5.604, -1.20, 1.7], mintaka: [5.533, -.30, 2.2], meissa: [5.585, 9.93, 3.4],
    aldebaran: [4.599, 16.51, .9], elnath: [5.438, 28.61, 1.7], zetatau: [5.627, 21.14, 3.0], ain: [4.477, 19.18, 3.5], hyadum: [4.330, 15.63, 3.6],
    alcyone: [3.791, 24.11, 2.9], atlas: [3.819, 24.05, 3.6], electra: [3.749, 24.11, 3.7], maia: [3.763, 24.37, 3.9], merope: [3.772, 23.95, 4.1], taygeta: [3.754, 24.47, 4.3],
    castor: [7.577, 31.89, 1.6], pollux: [7.755, 28.03, 1.1], alhena: [6.629, 16.40, 1.9], mebsuta: [6.732, 25.13, 3.0], wasat: [7.335, 21.98, 3.5], tejat: [6.383, 22.51, 2.9],
    sirius: [6.752, -16.72, -1.5], mirzam: [6.378, -17.96, 2.0], adhara: [6.977, -28.97, 1.5], wezen: [7.140, -26.39, 1.8], aludra: [7.402, -29.30, 2.4],
    procyon: [7.655, 5.22, .4], gomeisa: [7.453, 8.29, 2.9],
    regulus: [10.139, 11.97, 1.4], etaleo: [10.122, 16.76, 3.5], algieba: [10.333, 19.84, 2.0], adhafera: [10.278, 23.42, 3.4], rasalas: [9.879, 26.01, 3.9],
    zosma: [11.235, 20.52, 2.6], chertan: [11.237, 15.43, 3.3], denebola: [11.818, 14.57, 2.1],
    arcturus: [14.261, 19.18, -.05], izar: [14.750, 27.07, 2.4], muphrid: [13.911, 18.40, 2.7], seginus: [14.535, 38.31, 3.0], nekkar: [15.032, 40.39, 3.5], deltaboo: [15.258, 33.31, 3.5],
    spica: [13.420, -11.16, 1.0], porrima: [12.694, -1.45, 2.7], vindemiatrix: [13.036, 10.96, 2.8], zavijava: [11.845, 1.76, 3.6], auva: [12.927, 3.40, 3.4],
    antares: [16.490, -26.43, 1.0], dschubba: [16.006, -22.62, 2.3], acrab: [16.091, -19.81, 2.6], pisco: [15.981, -26.11, 2.9], sigmasco: [16.353, -25.59, 2.9], tausco: [16.598, -28.22, 2.8], epssco: [16.836, -34.29, 2.3],
    kausaus: [18.403, -34.38, 1.8], nunki: [18.921, -26.30, 2.0], ascella: [19.044, -29.88, 2.6], kausmed: [18.350, -29.83, 2.7], kausbor: [18.466, -25.42, 2.8], phisgr: [18.761, -26.99, 3.2], tausgr: [19.116, -27.67, 3.3], alnasl: [18.097, -30.42, 3.0],
    vega: [18.616, 38.78, 0], sheliak: [18.835, 33.36, 3.5], sulafat: [18.982, 32.69, 3.3], zetalyr: [18.746, 37.61, 4.3], deltalyr: [18.908, 36.90, 4.3],
    deneb: [20.690, 45.28, 1.25], sadr: [20.370, 40.26, 2.2], gienah: [20.770, 33.97, 2.5], deltacyg: [19.750, 45.13, 2.9], albireo: [19.512, 27.96, 3.1],
    altair: [19.846, 8.87, .8], tarazed: [19.771, 10.61, 2.7], alshain: [19.922, 6.41, 3.7], zetaaql: [19.090, 13.86, 3.0], lambdaaql: [19.104, -4.88, 3.4],
    markab: [23.079, 15.21, 2.5], scheat: [23.063, 28.08, 2.4], algenib: [.220, 15.18, 2.8], alpheratz: [.140, 29.09, 2.1], enif: [21.736, 9.88, 2.4], homam: [22.717, 10.83, 3.4], biham: [22.170, 6.20, 3.5],
    mirach: [1.162, 35.62, 2.1], almach: [2.065, 42.33, 2.1], deltaand: [.655, 30.86, 3.3],
    capella: [5.278, 46.00, .1], menkalinan: [5.992, 44.95, 1.9], mahasim: [5.995, 37.21, 2.6], hassaleh: [4.950, 33.17, 2.7],
    hamal: [2.120, 23.46, 2.0], sheratan: [1.911, 20.81, 2.6], mesarthim: [1.892, 19.29, 3.9],
    alphard: [9.460, -8.66, 2.0], fomalhaut: [22.961, -29.62, 1.2], diphda: [.726, -17.99, 2.0], menkar: [3.038, 4.09, 2.5], rasalhague: [17.582, 12.56, 2.1],
  };
  const LINES = {
    'Orion': [['betelgeuse', 'bellatrix'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'], ['alnitak', 'alnilam'], ['alnilam', 'mintaka'], ['alnitak', 'saiph'], ['mintaka', 'rigel'], ['betelgeuse', 'meissa'], ['bellatrix', 'meissa']],
    'Stier': [['hyadum', 'aldebaran'], ['aldebaran', 'zetatau'], ['hyadum', 'ain'], ['ain', 'elnath']],
    'Tweelingen': [['castor', 'mebsuta'], ['mebsuta', 'tejat'], ['pollux', 'wasat'], ['wasat', 'alhena'], ['castor', 'pollux']],
    'Grote Hond': [['mirzam', 'sirius'], ['sirius', 'wezen'], ['wezen', 'aludra'], ['wezen', 'adhara']],
    'Kleine Hond': [['procyon', 'gomeisa']],
    'Leeuw': [['regulus', 'etaleo'], ['etaleo', 'algieba'], ['algieba', 'adhafera'], ['adhafera', 'rasalas'], ['algieba', 'zosma'], ['zosma', 'denebola'], ['denebola', 'chertan'], ['chertan', 'regulus'], ['zosma', 'chertan']],
    'Ossenhoeder': [['muphrid', 'arcturus'], ['arcturus', 'izar'], ['izar', 'deltaboo'], ['deltaboo', 'nekkar'], ['nekkar', 'seginus'], ['seginus', 'arcturus']],
    'Maagd': [['spica', 'porrima'], ['porrima', 'auva'], ['auva', 'vindemiatrix'], ['porrima', 'zavijava']],
    'Schorpioen': [['acrab', 'dschubba'], ['dschubba', 'pisco'], ['dschubba', 'sigmasco'], ['sigmasco', 'antares'], ['antares', 'tausco'], ['tausco', 'epssco']],
    'Boogschutter': [['alnasl', 'kausmed'], ['kausmed', 'kausbor'], ['kausbor', 'phisgr'], ['phisgr', 'nunki'], ['nunki', 'tausgr'], ['tausgr', 'ascella'], ['ascella', 'phisgr'], ['kausmed', 'kausaus'], ['kausaus', 'ascella'], ['alnasl', 'kausaus']],
    'Lier': [['vega', 'zetalyr'], ['zetalyr', 'sheliak'], ['sheliak', 'sulafat'], ['sulafat', 'deltalyr'], ['deltalyr', 'zetalyr']],
    'Zwaan': [['deneb', 'sadr'], ['sadr', 'albireo'], ['gienah', 'sadr'], ['sadr', 'deltacyg']],
    'Arend': [['tarazed', 'altair'], ['altair', 'alshain'], ['tarazed', 'zetaaql'], ['altair', 'lambdaaql']],
    'Pegasus': [['markab', 'scheat'], ['scheat', 'alpheratz'], ['alpheratz', 'algenib'], ['algenib', 'markab'], ['markab', 'homam'], ['homam', 'biham'], ['biham', 'enif']],
    'Andromeda': [['alpheratz', 'deltaand'], ['deltaand', 'mirach'], ['mirach', 'almach']],
    'Voerman': [['capella', 'menkalinan'], ['menkalinan', 'mahasim'], ['mahasim', 'elnath'], ['elnath', 'hassaleh'], ['hassaleh', 'capella']],
    'Ram': [['hamal', 'sheratan'], ['sheratan', 'mesarthim']],
  };
  // the big meteor showers: peak (month, day), radiant (RA h, Dec °), rate at the peak (ZHR), how many days it lasts around the peak
  const SHOWERS = [
    { name: 'Quadrantiden', m: 1, d: 3.8, ra: 15.33, dec: 49.5, zhr: 110, w: .6 },
    { name: 'Lyriden', m: 4, d: 22.5, ra: 18.07, dec: 33.6, zhr: 18, w: 1 },
    { name: 'Eta-Aquariiden', m: 5, d: 6, ra: 22.53, dec: -1, zhr: 50, w: 3 },
    { name: 'Perseïden', m: 8, d: 12.6, ra: 3.2, dec: 58, zhr: 100, w: 2.5 },
    { name: 'Orioniden', m: 10, d: 21.5, ra: 6.33, dec: 15.8, zhr: 20, w: 3 },
    { name: 'Leoniden', m: 11, d: 17.5, ra: 10.28, dec: 21.6, zhr: 15, w: 1 },
    { name: 'Geminiden', m: 12, d: 14.2, ra: 7.47, dec: 32.4, zhr: 150, w: 1.2 },
    { name: 'Ursiden', m: 12, d: 22.4, ra: 14.47, dec: 75.3, zhr: 10, w: .8 },
  ];
  const PLANETS = [['Venus', [255, 252, 238]], ['Jupiter', [255, 240, 214]], ['Mars', [255, 150, 110]], ['Saturn', [246, 226, 170]], ['Mercury', [235, 225, 210]]];
  const AIRLINES = { BEL: 'Brussels Airlines', JAF: 'TUI fly Belgium', KLM: 'KLM', RYR: 'Ryanair', EZY: 'easyJet', EJU: 'easyJet', DLH: 'Lufthansa', AFR: 'Air France',
    BAW: 'British Airways', UAE: 'Emirates', QTR: 'Qatar Airways', THY: 'Turkish Airlines', SWR: 'Swiss', AUA: 'Austrian', SAS: 'SAS', IBE: 'Iberia', VLG: 'Vueling',
    WZZ: 'Wizz Air', TAP: 'TAP Air Portugal', TRA: 'Transavia', TVF: 'Transavia', EWG: 'Eurowings', CFG: 'Condor', ETD: 'Etihad', DAL: 'Delta', UAL: 'United',
    AAL: 'American Airlines', ACA: 'Air Canada', ELY: 'El Al', LOT: 'LOT', FIN: 'Finnair', AEE: 'Aegean', BCS: 'DHL', DHK: 'DHL', FDX: 'FedEx', UPS: 'UPS',
    ABR: 'ASL Airlines', TAY: 'ASL Airlines Belgium', CLX: 'Cargolux', NJE: 'NetJets', ITY: 'ITA Airways', RAM: 'Royal Air Maroc', SXS: 'SunExpress', ICE: 'Icelandair', EIN: 'Aer Lingus' };

  function create(A) {
    const W = A.W, H = A.H, HOR0 = A.HOR0, AST = window.Astronomy, SAT = window.satellite;
    const cfg = () => Object.assign({ stars: true, planets: true, meteors: true, nebula: 10, iss: true, eclipses: true, rainbow: true, geese: true, planes: true, lightning: true, lightning_km: 25 }, A.settings().sky || {});
    const force = (k) => (A.params.get('sky') || '').split(',').includes(k);
    let obs = null, obsKey = '';
    const observer = () => { const k = A.lat() + ',' + A.lon(); if (k !== obsKey && AST) { obs = new AST.Observer(A.lat(), A.lon(), 10); obsKey = k; } return obs; };
    const horiz = (d, ra, dec) => { const h = AST.Horizon(d, observer(), ra, dec, 'normal'); return { az: h.azimuth, alt: h.altitude }; };
    const xy = (az, alt) => ({ x: A.azX(az), y: A.altY(alt) });
    const onScreen = (p, m) => p.x > -(m || 20) && p.x < W + (m || 20) && p.y > -(m || 20) && p.y < HOR0 + 4;
    // how dark and clear the sky is: 0 (day, or clouds) .. 1 (a clear night)
    const darkness = (sun) => clamp((-sun.alt - 4) / 10, 0, 1);
    const clearness = () => ({ helder: 1, licht: .75, bewolkt: .15, mist: .1 }[A.weather()] || 0);

    /* ---------- stars, constellations and planets: positions every 20 seconds ---------- */
    let starPos = null, starT = 0, planetPos = [];
    function updateStars(d) {
      if (!AST || (starPos && Math.abs(d - starT) < 20000)) return;
      starT = d.valueOf(); starPos = {};
      for (const k in STARS) { const s = STARS[k], h = horiz(d, s[0], s[1]); starPos[k] = { az: h.az, alt: h.alt, mag: s[2], p: xy(h.az, h.alt) }; }
      planetPos = [];
      for (const [body, col] of PLANETS) {
        try {
          const e = AST.Equator(body, d, observer(), true, true), h = horiz(d, e.ra, e.dec), mag = AST.Illumination(body, d).mag;
          planetPos.push({ body, col, mag, az: h.az, alt: h.alt, p: xy(h.az, h.alt) });
        } catch (e) { }
      }
    }
    function drawStars(g, d, sun) {
      const c = cfg(), dk = darkness(sun) * clearness();
      if ((!c.stars && !c.planets) || !AST) return;
      updateStars(d);
      const t = A.t();
      if (c.stars && dk > .02) {
        g.save();
        // the lines of the constellations: very faint, like a star chart seen through the camcorder
        g.strokeStyle = `rgba(170,190,255,${.16 * dk})`; g.lineWidth = 1;
        g.beginPath();
        for (const name in LINES) for (const [a, b] of LINES[name]) {
          const p = starPos[a], q = starPos[b]; if (!p || !q || p.alt < 3 || q.alt < 3 || !onScreen(p.p, 200) || !onScreen(q.p, 200)) continue;
          if (Math.abs(p.p.x - q.p.x) > W * .6) continue;
          g.moveTo(p.p.x, p.p.y); g.lineTo(q.p.x, q.p.y);
        }
        g.stroke();
        for (const k in starPos) {
          const s = starPos[k]; if (s.alt < 1 || !onScreen(s.p)) continue;
          const low = clamp(s.alt / 12, .25, 1), tw = .7 + .3 * nz(t * 1.7 + k.length * 13.1 + s.mag * 7);
          const r = Math.max(.8, 2.4 - s.mag * .45), a = clamp(1.15 - s.mag * .2, .3, 1) * dk * low * tw;
          if (s.mag < 1.2) { const gl = g.createRadialGradient(s.p.x, s.p.y, 0, s.p.x, s.p.y, r * 4); gl.addColorStop(0, `rgba(230,236,255,${a * .5})`); gl.addColorStop(1, 'rgba(230,236,255,0)'); g.fillStyle = gl; g.fillRect(s.p.x - r * 4, s.p.y - r * 4, r * 8, r * 8); }
          g.fillStyle = `rgba(245,247,255,${a})`; g.beginPath(); g.arc(s.p.x, s.p.y, r, 0, 7); g.fill();
        }
        g.restore();
      }
      if (c.planets) {
        const dkp = clamp((-sun.alt + 1) / 8, 0, 1) * clearness();   // Venus and Jupiter show early, already at dusk
        if (dkp > .02) for (const pl of planetPos) {
          if (pl.alt < 1 || !onScreen(pl.p) || pl.mag > 2) continue;
          const a = clamp(1.2 - (pl.mag + 1) * .25, .35, 1) * dkp * clamp(pl.alt / 8, .3, 1), r = clamp(2.6 - pl.mag * .4, 1.4, 3.6);
          const gl = g.createRadialGradient(pl.p.x, pl.p.y, 0, pl.p.x, pl.p.y, r * 6);
          gl.addColorStop(0, `rgba(${pl.col},${a * .55})`); gl.addColorStop(1, `rgba(${pl.col},0)`);
          g.fillStyle = gl; g.fillRect(pl.p.x - r * 6, pl.p.y - r * 6, r * 12, r * 12);
          g.fillStyle = `rgba(${pl.col},${a})`; g.beginPath(); g.arc(pl.p.x, pl.p.y, r, 0, 7); g.fill();   // planets don't twinkle
        }
      }
    }

    /* ---------- shooting stars: now and then, and many during a real meteor shower ---------- */
    const meteors = [];
    let lastT = 0, showerLogged = '';
    function showerNow(d) {
      let best = null;
      for (const s of SHOWERS) for (const yr of [d.getFullYear() - 1, d.getFullYear(), d.getFullYear() + 1]) {
        const peak = new Date(yr, s.m - 1, Math.floor(s.d), (s.d % 1) * 24), days = (d - peak) / 864e5, act = Math.exp(-(days / s.w) * (days / s.w));
        if (act > .05 && (!best || s.zhr * act > best.rate)) best = { s, rate: s.zhr * act };
      }
      return best;
    }
    function drawMeteors(g, d, sun) {
      const c = cfg(), dt = clamp(A.t() - lastT, 0, .1); lastT = A.t();
      const dk = darkness(sun) * clearness();
      if ((c.meteors && dk > .3) || force('meteoor')) {
        let rate = 1 / 200;   // a sporadic one about every three minutes
        const sh = showerNow(d); let rad = null;
        if (sh) {
          const h = AST ? horiz(d, sh.s.ra, sh.s.dec) : { alt: 30, az: 90 };
          const up = h.alt > 0 ? Math.sin(h.alt * D2R) : .08;
          rate += sh.rate / 1100 * up * (1 - .5 * A.moonLight());
          rad = xy(h.az, Math.max(h.alt, 5));
          const night = d.toDateString();
          if (sh.rate > 12 && showerLogged !== night && dk > .5) { showerLogged = night; A.log('event', 'Vannacht: de ' + sh.s.name + ' (vallende sterren)'); }
        }
        if (force('meteoor')) rate = Math.max(rate, 1 / 2);
        if (Math.random() < rate * dt) spawnMeteor(sh && Math.random() < sh.rate / (sh.rate + 8) ? rad : null);
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]; m.age += dt;
        const p = m.age / m.life; if (p >= 1 && !m.trainLeft) { meteors.splice(i, 1); continue; }
        const head = Math.min(1, p), hx = m.x + m.dx * m.len * head, hy = m.y + m.dy * m.len * head;
        const tail = Math.max(0, head - .35), tx = m.x + m.dx * m.len * tail, ty = m.y + m.dy * m.len * tail;
        const fade = p < .15 ? p / .15 : 1 - Math.max(0, (p - .7) / .3);
        if (p < 1) {
          const gr = g.createLinearGradient(tx, ty, hx, hy);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(${m.col},${m.b * fade})`);
          g.strokeStyle = gr; g.lineWidth = m.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
          g.fillStyle = `rgba(255,255,255,${m.b * fade})`; g.beginPath(); g.arc(hx, hy, m.w * .8, 0, 7); g.fill();
        }
        if (m.fire) {   // a fireball leaves a faint glowing train for a few seconds
          m.trainLeft = m.age < m.life + 4;
          const ta = Math.max(0, Math.min(1, m.age / m.life)) * Math.max(0, 1 - (m.age - m.life) / 4) * .25;
          if (ta > 0) { g.strokeStyle = `rgba(160,255,200,${ta})`; g.lineWidth = 2; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x + m.dx * m.len * head, m.y + m.dy * m.len * head); g.stroke(); }
        }
      }
    }
    function spawnMeteor(rad) {
      let x = 60 + Math.random() * (W - 120), y = 50 + Math.random() * (HOR0 - 200), ang;
      if (rad) { ang = Math.atan2(y - rad.y, x - rad.x) + (Math.random() - .5) * .15; const off = 40 + Math.random() * 160; x = rad.x + Math.cos(ang) * off + (Math.random() - .5) * 300; y = rad.y + Math.sin(ang) * off * .6 + Math.random() * 120; ang = Math.atan2(y - rad.y, x - rad.x); }
      else ang = Math.PI * (.15 + Math.random() * .7) * (Math.random() < .5 ? 1 : -1) + (Math.random() < .5 ? 0 : Math.PI);
      if (Math.sin(ang) < -.2) ang = -ang;   // mostly falling, a few skimming sideways
      const fire = Math.random() < .03;
      meteors.push({ x, y, dx: Math.cos(ang), dy: Math.sin(ang), len: fire ? 260 + Math.random() * 200 : 70 + Math.random() * 190, life: fire ? 1.4 : .35 + Math.random() * .6,
        age: 0, w: fire ? 3 : 1.2 + Math.random() * 1.3, b: fire ? 1 : .55 + Math.random() * .45, fire, col: fire ? '200,255,220' : Math.random() < .2 ? '255,240,200' : '235,245,255' });
    }

    /* ---------- a nebula on some nights: soft colour clouds that drift very slowly ---------- */
    let neb = null;
    function nebulaFor(d) {
      const ev = new Date(d.getTime() - (d.getHours() < 12 ? 864e5 : 0)), key = ev.toDateString();
      if (neb && neb.key === key) return neb;
      const pc = +cfg().nebula || 0, on = force('nevel') || seeded('nevel ' + key) * 100 < pc;
      neb = { key, on };
      if (!on) return neb;
      const r0 = seeded('nevel-kleur ' + key), pal = [[[255, 80, 170], [90, 200, 255]], [[150, 90, 255], [255, 120, 140]], [[60, 220, 200], [190, 100, 255]], [[255, 150, 90], [120, 90, 255]]][Math.floor(r0 * 4)];
      const cw = 240, ch = 150, c1 = document.createElement('canvas'), c2 = document.createElement('canvas'); c1.width = c2.width = cw; c1.height = c2.height = ch;
      const s0 = r0 * 1000;
      const fbm = (x, y, s) => { let v = 0, a = .5, f = 1; for (let o = 0; o < 5; o++) { v += a * (nz(x * f + s + y * f * 7.13) * .5 + nz(y * f * 1.7 + s * 2 + x * f * 3.1) * .5); f *= 2.03; a *= .5; } return v; };
      for (const [cv, col, sh] of [[c1, pal[0], 0], [c2, pal[1], 50]]) {
        const g = cv.getContext('2d'), img = g.createImageData(cw, ch);
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
          const u = x / cw - .5, v = y / ch - .5, fall = Math.max(0, 1 - (u * u * 3.2 + v * v * 5.5));
          const n = fbm(x / 34, y / 30, s0 + sh), wisp = Math.pow(Math.max(0, n - .32) * 2.4, 2.2) * fall;
          const i = (y * cw + x) * 4; img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = clamp(wisp * 255, 0, 210);
        }
        g.putImageData(img, 0, 0);
      }
      const stars = []; for (let k = 0; k < 26; k++) stars.push([hsh(s0 + k) - .5, hsh(s0 + k * 3.7) - .5, hsh(s0 + k * 9.1)]);
      Object.assign(neb, { c1, c2, stars, az: 125 + seeded('nevel-plek ' + key) * 110, alt: 26 + seeded('nevel-hoogte ' + key) * 22, rot: (seeded('nevel-hoek ' + key) - .5) * .8 });
      return neb;
    }
    function drawNebula(g, d, sun) {
      const n = nebulaFor(d), dk = darkness(sun) * clearness() * (1 - .6 * A.moonLight());
      if (!n.on || dk < .05) return;
      const p = xy(n.az, n.alt), t = A.t(), w = 560, h = 350;
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.rotate(n.rot);
      for (const [cv, k, sp] of [[n.c1, 1, .012], [n.c2, -1, .009]]) {   // two layers drifting against each other: it seems to breathe
        const s = 1 + .03 * Math.sin(t * sp * 2 + k), ox = Math.sin(t * sp) * 14 * k, oy = Math.cos(t * sp * .7) * 8;
        g.globalAlpha = .42 * dk; g.drawImage(cv, -w * s / 2 + ox, -h * s / 2 + oy, w * s, h * s);
      }
      g.globalAlpha = 1;
      for (const [u, v, b] of n.stars) { const a = (.25 + .6 * b) * dk * (.7 + .3 * nz(t * 1.3 + b * 40)); g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(u * w * .9, v * h * .9, b > .8 ? 2 : 1.3, b > .8 ? 2 : 1.3); }
      g.restore();
    }

    /* ---------- the ISS: when it really passes over (orbit from the add-on, computed here) ---------- */
    let satrec = null, tleKey = '', iss = null, issTrail = [], issT = 0;
    function setTle(tle) {
      if (!SAT || !tle || !tle[1] || tle.join('|') === tleKey) return;
      try { satrec = SAT.twoline2satrec(tle[1], tle[2]); tleKey = tle.join('|'); issT = 0; } catch (e) { satrec = null; }
    }
    function issNow(d) {
      if (!satrec) return null;
      const pv = SAT.propagate(satrec, d); if (!pv || !pv.position) return null;
      const gd = { latitude: A.lat() * D2R, longitude: A.lon() * D2R, height: .01 }, la = SAT.ecfToLookAngles(gd, SAT.eciToEcf(pv.position, SAT.gstime(d)));
      const geo = SAT.eciToGeodetic(pv.position, SAT.gstime(d)), v = pv.velocity;
      return { az: la.azimuth / D2R, alt: la.elevation / D2R, km: la.rangeSat, height: geo.height, speed: Math.hypot(v.x, v.y, v.z) * 3600 };
    }
    function drawISS(g, d, sun) {
      if (!cfg().iss && !force('iss')) return;
      if (force('iss') && !satrec) return;
      if (d - issT > 400 || d < issT || !issT) { issT = d.valueOf(); iss = issNow(d); if (iss && iss.alt > 0) { issTrail.push(xy(iss.az, iss.alt)); if (issTrail.length > 12) issTrail.shift(); } else issTrail = []; }
      if (!iss || iss.alt < 0) { issHit = null; return; }
      const p = xy(iss.az, iss.alt); if (!onScreen(p, 10)) { issHit = null; return; }
      const dk = darkness(sun), a = clamp(.45 + .55 * dk, .45, 1) * (clearness() > .1 ? 1 : .35);   // anytime: in daylight a small bright dot
      for (let k = 1; k < issTrail.length; k++) { g.strokeStyle = `rgba(255,250,220,${a * .25 * k / issTrail.length})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(issTrail[k - 1].x, issTrail[k - 1].y); g.lineTo(issTrail[k].x, issTrail[k].y); g.stroke(); }
      const gl = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14); gl.addColorStop(0, `rgba(255,252,230,${a * .6})`); gl.addColorStop(1, 'rgba(255,252,230,0)');
      g.fillStyle = gl; g.fillRect(p.x - 14, p.y - 14, 28, 28);
      g.fillStyle = `rgba(255,253,240,${a})`; g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill();
      g.fillStyle = `rgba(200,215,255,${a * .8})`; g.fillRect(p.x - 7, p.y - .6, 14, 1.2);   // the solar panels, just a hint
      issHit = { x: p.x, y: p.y, iss };
    }
    let issHit = null;

    /* ---------- eclipses: the real ones, as you would see them from home ---------- */
    let ecl = null, eclKey = '';
    function eclipses(d) {
      const key = d.toDateString();
      if (eclKey === key || !AST) return ecl;
      eclKey = key; ecl = { sun: null, moon: null };
      try { const s = AST.SearchLocalSolarEclipse(new Date(d.getTime() - 864e5), observer()); if (s && s.partial_begin.time.date - d < 2 * 864e5) ecl.sun = { a: s.partial_begin.time.date, b: s.partial_end.time.date, kind: s.kind, obsc: s.obscuration }; } catch (e) { }
      try { const l = AST.SearchLunarEclipse(new Date(d.getTime() - 864e5)); const pk = l.peak.date; if (Math.abs(pk - d) < 2 * 864e5) ecl.moon = { peak: pk, pen: l.sd_penum, part: l.sd_partial, tot: l.sd_total, kind: l.kind }; } catch (e) { }
      if (force('eclips')) ecl = { sun: { a: new Date(d - 3600e3), b: new Date(+d + 3600e3), obsc: .8, fake: true }, moon: { peak: d, pen: 120, part: 60, tot: 30, fake: true } };
      return ecl;
    }
    // drawn right after the sun: the moon slides in front of it
    function sunEclipse(g, x, y, r, d) {
      if (!cfg().eclipses && !force('eclips')) return 0;
      const e = eclipses(d); if (!e || !e.sun || d < e.sun.a || d > e.sun.b) return 0;
      let dx, dy;
      if (e.sun.fake) { const f = (d - e.sun.a) / (e.sun.b - e.sun.a); dx = (1 - 2 * f) * 2.2; dy = .25; }
      else {
        const s = AST.Equator('Sun', d, observer(), true, true), m = AST.Equator('Moon', d, observer(), true, true);
        const hs = AST.Horizon(d, observer(), s.ra, s.dec, 'normal'), hm = AST.Horizon(d, observer(), m.ra, m.dec, 'normal');
        const R = .2666;   // the sun's radius in degrees
        dx = (hm.azimuth - hs.azimuth) * Math.cos(hs.altitude * D2R) / R; dy = -(hm.altitude - hs.altitude) / R;
      }
      const ox = x + dx * r * 1.6, oy = y + dy * r * 1.6;   // a bit exaggerated, so you can follow it
      g.save(); g.fillStyle = '#05060c'; g.beginPath(); g.arc(ox, oy, r * .98, 0, 7); g.fill(); g.restore();
      const dist = Math.hypot(ox - x, oy - y) / (r * 2); return clamp(1 - dist, 0, 1);   // how much is covered (for darkening the sky)
    }
    // the moon in the earth's shadow: a dark bite, and copper red when it's total
    function moonShadow(d) {
      if (!cfg().eclipses && !force('eclips')) return null;
      const e = eclipses(d); if (!e || !e.moon) return null;
      const min = (d - e.moon.peak) / 60000;
      if (Math.abs(min) > e.moon.pen) return null;
      if (!e.moon.fake && AST) { const m = AST.Equator('Moon', d, observer(), true, true); if (AST.Horizon(d, observer(), m.ra, m.dec, 'normal').altitude < 0) return null; }
      const tot = e.moon.tot && Math.abs(min) < e.moon.tot ? 1 - Math.abs(min) / e.moon.tot * .3 : 0;
      const part = e.moon.part && Math.abs(min) < e.moon.part ? 1 - Math.abs(min) / e.moon.part : 0;
      return { pen: 1 - Math.abs(min) / e.moon.pen, part, tot, side: min < 0 ? -1 : 1 };
    }
    function drawMoonShadow(g, x, y, r, d) {
      const s = moonShadow(d); if (!s) return;
      g.save();
      g.beginPath(); g.arc(x, y, r + .5, 0, 7); g.clip();
      g.fillStyle = `rgba(20,10,10,${.25 * s.pen})`; g.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);   // the faint half-shadow
      if (s.tot) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(150,45,25,${.75 * s.tot})`; g.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4); }
      else if (s.part > 0) { const off = (1 - s.part) * r * 2.1 * s.side; g.fillStyle = 'rgba(40,14,12,.85)'; g.beginPath(); g.arc(x + off, y - off * .2, r * 1.35, 0, 7); g.fill(); }
      g.restore();
    }

    /* ---------- a rainbow, right after the rain while the sun is low ---------- */
    let rainEnd = 0, wasRain = false, bowA = 0;
    function drawRainbow(g, d, sun) {
      const rain = A.rainy();
      if (wasRain && !rain) rainEnd = Date.now();
      wasRain = rain;
      const want = ((cfg().rainbow && !rain && Date.now() - rainEnd < 20 * 60000 && sun.alt > 2 && sun.alt < 40 && A.weather() !== 'mist') || force('regenboog')) ? 1 : 0;
      bowA += Math.sign(want - bowA) * Math.min(Math.abs(want - bowA), 1 / 2400);   // fades in and out over about forty seconds
      if (bowA <= 0) return;
      const left = sun.az > 180 || force('regenboog');   // always on the side opposite the sun
      const cx = left ? W * .26 : W * .74, cy = HOR0 + 120 + sun.alt * 4, R = W * .52;
      const cols = ['255,60,60', '255,150,40', '255,235,60', '80,220,90', '60,150,255', '90,80,230', '170,90,220'];
      g.save(); g.globalCompositeOperation = 'screen';
      for (let k = 0; k < cols.length; k++) {
        g.strokeStyle = `rgba(${cols[k]},${.22 * bowA})`; g.lineWidth = 9;
        g.beginPath(); g.arc(cx, cy, R - k * 8, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
      }
      for (let k = 0; k < cols.length; k++) {   // the faint second bow, colours reversed
        g.strokeStyle = `rgba(${cols[cols.length - 1 - k]},${.07 * bowA})`; g.lineWidth = 10;
        g.beginPath(); g.arc(cx, cy, R * 1.22 - k * 9, Math.PI * 1.03, Math.PI * 1.97); g.stroke();
      }
      g.restore();
    }

    /* ---------- planes (OpenSky in Home Assistant) and migrating geese ---------- */
    const flyers = [], seen = new Set();
    let geeseT = 0;
    function addPlane(p) {
      if (!p || seen.has(p.id)) return; seen.add(p.id);
      if (!cfg().planes) return;
      const alt = +p.alt || 9000, dir = Math.random() < .5 ? 1 : -1, z = clamp(1.3 - alt / 11000, .5, 1.2);
      const cs = String(p.cs || '').trim().toUpperCase(), airline = AIRLINES[cs.slice(0, 3)] || '';
      flyers.push({ kind: 'plane', x: dir > 0 ? -60 : W + 60, y: 70 + (1 - z) * 120 + Math.random() * 60, dir, z, v: (50 + 40 * (1 - z)) * (.8 + Math.random() * .4),
        alt, cs, airline, seed: Math.random() * 100, trail: [], t0: A.t() });
    }
    function addGeese() {
      const autumn = new Date().getMonth() >= 6, dir = autumn ? 1 : -1, n = 7 + Math.floor(Math.random() * 10), birds = [];
      const armL = Math.floor((n - 1) / 2 + (Math.random() - .5) * 3);
      for (let k = 0; k < n; k++) { const side = k === 0 ? 0 : (k <= armL ? -1 : 1), rank = k === 0 ? 0 : k <= armL ? k : k - armL; birds.push({ side, rank, ph: Math.random() * 6, sp: 5.5 + Math.random() * 1.5, wob: Math.random() * 100 }); }
      flyers.push({ kind: 'geese', x: dir > 0 ? -140 : W + 140, y: 80 + Math.random() * 120, dir, v: 38 + Math.random() * 14, birds, seed: Math.random() * 100, z: .8 + Math.random() * .4 });
    }
    function geeseSeason(d) { const m = d.getMonth() + 1, day = d.getDate(); return (m === 9 && day > 15) || m === 10 || m === 11 || m === 2 || m === 3; }
    function drawFlyers(g, d, sun) {
      const dt = clamp(A.t() - flyT, 0, .1); flyT = A.t();
      const light = clamp((sun.alt + 4) / 10, 0, 1);
      if (cfg().geese && geeseSeason(d) && light > .3 && A.t() - geeseT > 60) { geeseT = A.t(); if (Math.random() < 4 / 720) addGeese(); }   // a few flocks a day
      if (force('ganzen') && !flyers.some(f => f.kind === 'geese')) addGeese();
      if (force('vliegtuig') && !flyers.some(f => f.kind === 'plane')) addPlane({ id: 'test' + Math.random(), cs: 'BEL7KM', alt: 2500 + Math.random() * 9000 });
      planeHits = [];
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i]; f.x += f.dir * f.v * dt;
        if (f.dir > 0 ? f.x > W + 200 : f.x < -200) { flyers.splice(i, 1); continue; }
        if (f.kind === 'plane') drawPlane(g, f, light);
        else drawGeese(g, f, light);
      }
    }
    let flyT = 0, planeHits = [];
    function drawPlane(g, f, light) {
      const s = 30 * f.z, y = f.y + Math.sin(A.t() * .3 + f.seed) * 2;
      // a contrail behind high planes, in daylight: thin at the plane, spreading and fading behind it
      if (f.alt > 7000 && light > .4) {
        f.trail.push([f.x, y]); if (f.trail.length > 240) f.trail.shift();
        for (let k = 1; k < f.trail.length; k++) { const a = k / f.trail.length; g.strokeStyle = `rgba(255,255,255,${.35 * a * a * light})`; g.lineWidth = 1 + (1 - a) * 5; g.beginPath(); g.moveTo(f.trail[k - 1][0], f.trail[k - 1][1] + (1 - a) * 4); g.lineTo(f.trail[k][0], f.trail[k][1]); g.stroke(); }
      }
      g.save(); g.translate(f.x, y); g.scale(f.dir, 1);
      g.fillStyle = light > .3 ? 'rgba(226,232,242,.95)' : 'rgba(20,22,30,.9)';   // in daylight a plane shines silver
      g.beginPath(); g.ellipse(0, 0, s, s * .13, 0, 0, 7); g.fill();                                          // body
      g.beginPath(); g.moveTo(s * .15, 0); g.lineTo(-s * .25, -s * .62); g.lineTo(-s * .38, -s * .62); g.lineTo(-s * .12, 0); g.fill();   // far wing
      g.beginPath(); g.moveTo(s * .15, 0); g.lineTo(-s * .2, s * .5); g.lineTo(-s * .33, s * .5); g.lineTo(-s * .12, 0); g.fill();       // near wing
      g.beginPath(); g.moveTo(-s * .8, 0); g.lineTo(-s * 1.02, -s * .38); g.lineTo(-s * .92, -s * .38); g.lineTo(-s * .62, 0); g.fill();   // tail
      g.restore();
      planeHits.push({ x: f.x - s * 1.4, y: y - s, w: s * 2.8, h: s * 2, f });
      f.sy = y;
    }
    function drawGeese(g, f, light) {
      X
      g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1.4;
      for (const b of f.birds) {
        // the V: each bird a little behind and beside the one in front, never quite in line (they keep shifting)
        const x = f.x - f.dir * b.rank * 24 * f.z + (nz(t * .4 + b.wob) - .5) * 8;
        const y = f.y + b.side * b.rank * 12 * f.z + (nz(t * .5 + b.wob + 9) - .5) * 6 + Math.sin(t * .6 + f.seed) * 4;
        const wing = Math.sin(t * b.sp + b.ph);
        g.save(); g.translate(x, y); g.scale(f.dir, 1);
        g.beginPath(); g.ellipse(0, 0, u * .9, u * .28, 0, 0, 7); g.fill();          // body
        g.beginPath(); g.moveTo(u * .7, -u * .05); g.lineTo(u * 1.7, -u * .2); g.stroke();   // the long neck
        g.beginPath(); g.moveTo(-u * .2, 0); g.quadraticCurveTo(-u * .1, -wing * u * 1.4, u * .25, -wing * u * 1.9); g.lineTo(u * .15, 0); g.fill();   // wing
        g.restore();
      }
    }

    /* ---------- real lightning nearby (Blitzortung in Home Assistant) ---------- */
    const bolts = [];
    function addStrike(s) {
      if (!s || seen.has(s.id)) return; seen.add(s.id);
      const c = cfg(); if (!c.lightning) return;
      const km = s.km === null || s.km === undefined ? c.lightning_km / 2 : +s.km; if (km > (+c.lightning_km || 25)) return;
      const near = clamp(1 - km / (+c.lightning_km || 25), .1, 1);
      let x = s.az === null || s.az === undefined ? 80 + Math.random() * (W - 160) : A.azX(+s.az);
      const inView = x > -40 && x < W + 40; x = clamp(x, 20, W - 20);
      const pts = [[x, 40 + Math.random() * 60]]; let px = pts[0][0], py = pts[0][1];
      while (py < HOR0 - 4) { px += (Math.random() - .5) * 38; py += 14 + Math.random() * 22; pts.push([px, Math.min(py, HOR0 - 2)]); }
      bolts.push({ pts, near, inView, age: 0, twice: Math.random() < .6 });
    }
    let boltT = 0;
    function drawLightning(g) {
      const dt = clamp(A.t() - boltT, 0, .1); boltT = A.t();
      if (force('bliksem') && Math.random() < .01) addStrike({ id: 'b' + Math.random(), km: Math.random() * 20, az: 100 + Math.random() * 160 });
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]; b.age += dt;
        const a = b.age < .12 ? 1 - b.age / .12 : (b.twice && b.age > .2 && b.age < .32) ? 1 - (b.age - .2) / .12 : 0;
        if (b.age > .5) { bolts.splice(i, 1); continue; }
        if (a <= 0) continue;
        g.fillStyle = `rgba(230,236,255,${.5 * a * b.near})`; g.fillRect(0, 0, W, H);
        if (b.inView) { g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 1 + 2 * b.near; g.beginPath(); b.pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
      }
    }
    // the plane lights at night, on top of everything (they shine through the night tint)
    function drawLights(g, sun) {
      const night = clamp((-sun.alt + 2) / 8, 0, 1); if (night <= 0) return;
      const t = A.t();
      for (const f of flyers) {
        if (f.kind !== 'plane' || f.sy === undefined) continue;
        const s = 30 * f.z, y = f.sy;
        const dot = (dx, dy, col, a, r) => { g.fillStyle = `rgba(${col},${a * night})`; g.beginPath(); g.arc(f.x + dx * f.dir, y + dy, r, 0, 7); g.fill(); };
        dot(-s * .3, -s * .55, '255,60,60', .9, 1.6); dot(-s * .25, s * .45, '60,255,120', .9, 1.6);   // red and green on the wing tips
        if ((t + f.seed) % 1.3 < .08) { dot(-s * .3, -s * .55, '255,255,255', 1, 3); dot(-s * .25, s * .45, '255,255,255', 1, 3); }   // white strobes
        if ((t * 1.1 + f.seed) % 1 < .5) dot(0, -s * .14, '255,40,40', .8, 1.4);   // the red beacon
      }
    }

    /* ---------- taps: a plane or the ISS opens a little window ---------- */
    function tap(x, y) {
      for (const h of planeHits) if (x >= h.x - 10 && x <= h.x + h.w + 10 && y >= h.y - 10 && y <= h.y + h.h + 10) {
        const f = h.f, m = Math.round(f.alt), ft = Math.round(f.alt * 3.281 / 100) * 100;
        return { title: 'Vlucht.exe', icon: '✈️', rows: [['Vlucht', f.cs || 'onbekend'], ['Maatschappij', f.airline || '–'], ['Hoogte', m.toLocaleString('nl-BE') + ' m (' + ft.toLocaleString('nl-BE') + ' ft)']],
          note: 'Net over jullie huis gevlogen (volgens OpenSky).' };
      }
      if (issHit && Math.hypot(x - issHit.x, y - issHit.y) < 26) {
        const i = issHit.iss, dirs = ['noorden', 'noordoosten', 'oosten', 'zuidoosten', 'zuiden', 'zuidwesten', 'westen', 'noordwesten'];
        return { title: 'ISS.exe', icon: '🛰️', rows: [['Wat', 'Het internationaal ruimtestation'], ['Hoogte', Math.round(i.height) + ' km'], ['Afstand tot jullie', Math.round(i.km) + ' km'], ['Snelheid', Math.round(i.speed / 100) * 100 + ' km/u'], ['Kijk naar het', dirs[Math.round(i.az / 45) % 8] + ', ' + Math.round(i.alt) + '° hoog']],
          note: 'Hij draait in ongeveer anderhalf uur rond de aarde.' };
      }
      return null;
    }

    return {
      back(g, d, sun) { try { drawRainbow(g, d, sun); drawNebula(g, d, sun); drawStars(g, d, sun); drawISS(g, d, sun); drawMeteors(g, d, sun); } catch (e) { console.error('sky', e); } },
      flyers(g, d, sun) { try { drawFlyers(g, d, sun); } catch (e) { console.error('flyers', e); } },
      screen(g, sun) { try { drawLights(g, sun); drawLightning(g); } catch (e) { console.error('sky screen', e); } },
      sunEclipse, drawMoonShadow, moonShadow,
      onState(s) { if (s && s.tle) setTle(s.tle); },
      onLive(s) { if (!s) return; (s.planes || []).forEach(addPlane); (s.strikes || []).forEach(addStrike); },
      tap,
      debug: () => ({ shower: showerNow(A.now()), nebula: neb && neb.on, iss: iss, flyers: flyers.map(f => ({ kind: f.kind, x: f.x, y: f.sy === undefined ? f.y : f.sy })), eclipses: ecl }),
    };
  }
  window.KamielSky = { create, SHOWERS };
})();
