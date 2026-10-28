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
    // the real night sky (about 1600 stars to magnitude 5, and the lines of all constellations): positions every 20 s
    const SD = window.KamielSkyData || null;
    let cat = null, catT = 0, lineSegs = [];
    function lstDeg(d) { const jd = d.valueOf() / 864e5 + 2440587.5; return ((280.46061837 + 360.98564736629 * (jd - 2451545) + A.lon()) % 360 + 360) % 360; }
    function altaz(raH, dec, lst, sinP, cosP) {
      const H = (lst - raH * 15) * D2R, de = dec * D2R;
      const sa = sinP * Math.sin(de) + cosP * Math.cos(de) * Math.cos(H);
      const az = Math.atan2(Math.sin(H), Math.cos(H) * sinP - Math.tan(de) * cosP) / D2R + 180;
      return [az, Math.asin(clamp(sa, -1, 1)) / D2R];
    }
    function updateCatalog(d) {
      if (!SD || (cat && Math.abs(d - catT) < 20000)) return;
      catT = d.valueOf();
      const lst = lstDeg(d), sinP = Math.sin(A.lat() * D2R), cosP = Math.cos(A.lat() * D2R), S0 = SD.STARS, n = S0.length / 4;
      cat = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const [az, alt] = altaz(S0[i * 4], S0[i * 4 + 1], lst, sinP, cosP);
        cat[i * 4] = A.azX(az); cat[i * 4 + 1] = A.altY(alt); cat[i * 4 + 2] = alt; cat[i * 4 + 3] = az;
      }
      lineSegs = [];
      for (const k in SD.LINES) for (const seg of SD.LINES[k]) {
        let prev = null;
        for (const [ra, dec] of seg) {
          const [az, alt] = altaz(ra, dec, lst, sinP, cosP), p = { x: A.azX(az), y: A.altY(alt), alt };
          if (prev && prev.alt > 2 && p.alt > 2 && Math.abs(prev.x - p.x) < W * .5) lineSegs.push(prev.x, prev.y, p.x, p.y);
          prev = p;
        }
      }
    }
    const starCol = (bv) => bv < 0 ? '205,218,255' : bv < .3 ? '228,235,255' : bv < .8 ? '255,250,238' : bv < 1.3 ? '255,226,190' : '255,200,160';
    function drawStars(g, d, sun) {
      const c = cfg(), dk = darkness(sun) * clearness();
      if ((!c.stars && !c.planets) || !AST) return;
      updateStars(d);
      const t = A.t();
      if (c.stars && dk > .02 && SD) {
        updateCatalog(d);
        g.save();
        // the lines of all constellations: very faint, like a star chart seen through the camcorder
        if (c.lines !== false) { g.strokeStyle = `rgba(170,190,255,${.13 * dk})`; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i < lineSegs.length; i += 4) { if (lineSegs[i + 1] > A.HOR0 || lineSegs[i + 3] > A.HOR0) continue; g.moveTo(lineSegs[i], lineSegs[i + 1]); g.lineTo(lineSegs[i + 2], lineSegs[i + 3]); }
        g.stroke(); }
        const S0 = SD.STARS, n = S0.length / 4, moonDim = 1 - .45 * A.moonLight();
        for (let i = 0; i < n; i++) {
          const x = cat[i * 4], y = cat[i * 4 + 1], alt = cat[i * 4 + 2]; if (alt < 1 || x < -4 || x > W + 4 || y < -4) continue;
          const mag = S0[i * 4 + 2], low = clamp(alt / 14, .2, 1);
          // faint stars disappear first when the moon is bright or near the horizon (that's how it really looks)
          let a = clamp(1.4 - mag * .19, .22, 1) * dk * low * (mag > 3.5 ? moonDim : 1);
          if (a < .03) continue;
          const tw = .7 + .3 * nz(t * (1.2 + (i % 7) * .2) + i * 1.37); a *= mag < 2.5 ? tw : .85 + .15 * tw;
          const r = Math.max(.9, 2.5 - mag * .38), col = starCol(S0[i * 4 + 3]);
          if (mag < 1.2) { const gl = g.createRadialGradient(x, y, 0, x, y, r * 4.5); gl.addColorStop(0, `rgba(${col},${a * .45})`); gl.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gl; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10); }
          g.fillStyle = `rgba(${col},${a})`;
          if (r < 1.2) g.fillRect(x - r / 2, y - r / 2, r + .3, r + .3); else { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
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
          if (sh.rate > 12 && showerLogged !== night && dk > .5) { showerLogged = night; A.log('lucht', '☄️ Vannacht: de ' + sh.s.name + ' (meteorenzwerm, tot ' + Math.round(sh.rate) + ' per uur aan de hele hemel)'); }
        }
        if (force('meteoor')) rate = Math.max(rate, 1 / 2);
        if (Math.random() < rate * dt) { const fromShower = sh && Math.random() < sh.rate / (sh.rate + 8); spawnMeteor(fromShower ? rad : null); meteorReport(fromShower ? sh.s.name : ''); }
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
    let metCount = 0, metFrom = Date.now(), metShower = '';
    function meteorReport(name) {
      metCount++; if (name) metShower = name;
      if (Date.now() - metFrom > 3600e3) { A.log('lucht', `☄️ ${metCount} vallende ster${metCount === 1 ? '' : 'ren'} het voorbije uur${metShower ? ' (' + metShower + ')' : ''}.`); metCount = 0; metFrom = Date.now(); metShower = ''; }
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
      note('neb' + n.key, '🌌 Vannacht hangt er een nevel aan de hemel.');
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
      if (!iss || iss.alt < 0) { issHit = null; if (once.iss) forget('iss'); return; }
      if (iss.alt > 5) note('iss', `🛰️ Het ISS komt over: nu ${Math.round(iss.alt)}° hoog, ${Math.round(iss.height)} km boven de aarde.`);
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
      note('ecls' + e.sun.a.toDateString(), `🌘 Zonsverduistering bezig (tot ${Math.round((e.sun.obsc || 0) * 100)}% van de zon bedekt).`);
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
      note('eclm' + d.toDateString(), s.tot ? '🌕 Totale maansverduistering: de maan wordt koperrood.' : '🌖 Maansverduistering bezig.');
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
      if (want) note('bow', '🌈 Een regenboog na de regen.'); else if (once.bow && bowA <= 0) forget('bow');
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
      // the real direction: the screen looks south, so a plane flying east crosses from right to left
      const alt = +p.alt || 9000, dir = p.track !== null && p.track !== undefined ? (Math.sin(+p.track * D2R) > 0 ? -1 : 1) : (Math.random() < .5 ? 1 : -1), z = clamp(1.3 - alt / 11000, .5, 1.2);
      const cs = String(p.cs || '').trim().toUpperCase(), airline = AIRLINES[cs.slice(0, 3)] || '';
      flyers.push({ kind: 'plane', x: dir > 0 ? -60 : W + 60, y: 70 + (1 - z) * 120 + Math.random() * 60, dir, z, v: (50 + 40 * (1 - z)) * (.8 + Math.random() * .4),
        alt, cs, airline, seed: Math.random() * 100, trail: [], t0: A.t() });
    }
    function addGeese() {
      const autumn = new Date().getMonth() >= 6, dir = autumn ? 1 : -1, n = 7 + Math.floor(Math.random() * 10), birds = [];
      const armL = Math.floor((n - 1) / 2 + (Math.random() - .5) * 3);
      for (let k = 0; k < n; k++) { const side = k === 0 ? 0 : (k <= armL ? -1 : 1), rank = k === 0 ? 0 : k <= armL ? k : k - armL; birds.push({ side, rank, ph: Math.random() * 6, sp: 5.5 + Math.random() * 1.5, wob: Math.random() * 100 }); }
      A.log('lucht', `🪿 Een V van ${n} ganzen trekt over (naar het ${autumn ? 'zuidwesten' : 'noordoosten'}).`);
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

    /* ---------- weather you can feel: rain on its way, storm, frost, heat, strong sun ---------- */
    const WX = { temp: null, uv: null, gust: null, bearing: null, rain: null };
    const once = {};
    const note = (key, text) => { if (once[key]) return; once[key] = true; A.log('lucht', text); };
    const forget = (key) => { once[key] = false; };
    function stormK() {
      if (force('storm')) return 1;
      if (cfg().storm === false) return 0;
      const w = Math.max(+A.wind() || 0, (+WX.gust || 0) * .8);
      return clamp((w - 50) / 40, 0, 1);   // from about 50 km/h it gets wild, from 90 km/h it's a real storm
    }
    const frostK = () => force('vorst') ? 1 : cfg().frost_heat === false || WX.temp === null ? 0 : clamp(-WX.temp / 6, 0, 1);
    const heatK = () => force('hitte') ? 1 : cfg().frost_heat === false || WX.temp === null ? 0 : clamp((WX.temp - 28) / 6, 0, 1);
    const uvHigh = () => force('uv') || (cfg().uv !== false && WX.uv !== null && +WX.uv >= 6);
    // the rain cloud: far away behind Kamiel at first, a little closer and darker every minute
    let rcImg = null, rcKey = '';
    function rainCloud(g, sun) {
      const r = WX.rain || (force('regenwolk') ? { in: 15, t0: Date.now() / 1000 - (A.t() % 40) / 40 * 900 } : null);
      if (!r || A.rainy()) { if (once.rain) forget('rain'); return; }
      const total = Math.max(5, +r.in || 15) * 60, p = clamp((Date.now() / 1000 - (+r.t0 || Date.now() / 1000)) / total, 0, 1);
      const cl = A.clouds0(); if (!cl) return;
      if (rcKey !== cl.src) {   // the same cloud picture, but heavy and dark
        rcKey = cl.src; rcImg = document.createElement('canvas'); rcImg.width = cl.width; rcImg.height = cl.height;
        const q = rcImg.getContext('2d'); q.drawImage(cl, 0, 0); q.globalCompositeOperation = 'source-atop';
        const gr = q.createLinearGradient(0, 0, 0, cl.height); gr.addColorStop(0, 'rgba(70,78,96,.82)'); gr.addColorStop(1, 'rgba(30,34,46,.92)'); q.fillStyle = gr; q.fillRect(0, 0, cl.width, cl.height);
      }
      const from = WX.bearing !== null && WX.bearing !== undefined ? (A.azX(+WX.bearing) < W / 2 ? -1 : 1) : 1;
      const w = 320 + 520 * p, h = w * rcImg.height / rcImg.width, x = W / 2 + from * (W * .4) * (1 - p) - w / 2, y = HOR0 - h * .8 - 230 * p * p;
      const L = clamp((sun.alt + 6) / 14, .25, 1);
      g.save(); g.globalAlpha = .55 + .4 * p; g.filter = `brightness(${L})`; g.drawImage(rcImg, x, y, w, h); g.filter = 'none';
      if (p > .65) {   // the first rain falls from it, not yet on Kamiel
        const k = (p - .65) / .35; g.strokeStyle = `rgba(150,165,200,${.35 * k})`; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i < 40 * k; i++) { const rx = x + w * (.15 + .7 * hsh(i * 3.1)), ry = y + h * .7 + ((A.t() * 260 + i * 37) % (HOR0 - y - h * .6)); g.moveTo(rx, ry); g.lineTo(rx - 3, ry + 12); }
        g.stroke();
      }
      g.restore();
      note('rain', `🌧️ De regenwolk is in beeld (regen over ongeveer ${Math.round((1 - p) * total / 60)} min).`);
    }
    // storm: things fly by, everything sways, the sky gets heavy
    const debris = [];
    function drawStorm(g) {
      const k = stormK();
      if (k <= 0) { if (once.storm) forget('storm'); return; }
      note('storm', `🌪️ Storm: wind ${Math.round(Math.max(+A.wind() || 0, +WX.gust || 0))} km/u. Alles waait.`);
      g.fillStyle = `rgba(30,34,48,${.28 * k})`; g.fillRect(0, 0, W, HOR0 + 40);
      const dir = WX.bearing !== null && WX.bearing !== undefined ? (A.azX(+WX.bearing) < W / 2 ? 1 : -1) : 1;
      if (debris.length < 26 * k && Math.random() < .25 * k) debris.push({ x: dir > 0 ? -30 : W + 30, y: 120 + Math.random() * (HOR0 + 60), v: (420 + Math.random() * 420) * dir, r: Math.random() * 6, vr: (Math.random() - .5) * 14, kind: Math.random() < .7 ? 'blad' : 'papier', c: ['#b5651d', '#d9a441', '#8a9a3c', '#c0392b'][Math.floor(Math.random() * 4)], seed: Math.random() * 99 });
      const dt = 1 / 60;
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i]; d.x += d.v * dt; d.y += Math.sin(A.t() * 3 + d.seed) * 60 * dt; d.r += d.vr * dt;
        if (d.x < -60 || d.x > W + 60) { debris.splice(i, 1); continue; }
        g.save(); g.translate(d.x, d.y); g.rotate(d.r);
        if (d.kind === 'blad') { g.fillStyle = d.c; g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, 7); g.fill(); }
        else { g.fillStyle = 'rgba(240,240,232,.9)'; g.fillRect(-8, -6, 16, 12); g.fillStyle = 'rgba(120,120,140,.6)'; g.fillRect(-6, -3, 12, 1); g.fillRect(-6, 1, 9, 1); }
        g.restore();
      }
    }
    // frost: ice crystals grow in from the edges of the screen, and Kamiel's breath shows
    let frostCv = null, breath = [], breathT = 0;
    function makeFrost() {
      frostCv = document.createElement('canvas'); frostCv.width = W; frostCv.height = H; const g = frostCv.getContext('2d');
      g.lineCap = 'round';
      // ice ferns: short straight arms that split at 60°, dense in the corners, thinning out toward the middle
      const branch = (x, y, ang, len, depth, w) => {
        if (depth <= 0 || len < 2) return;
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        g.strokeStyle = `rgba(240,248,255,${.22 + depth * .07})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 1; i <= n; i++) { const f = i / (n + 1), bx = x + (x2 - x) * f, by = y + (y2 - y) * f, bl = len * (.55 - f * .3);
          for (const sd of [-1, 1]) branch(bx, by, ang + sd * Math.PI / 3, bl, depth - 2, w * .6); }
        branch(x2, y2, ang + (Math.random() - .5) * .35, len * .8, depth - 1, w * .85);
      };
      const corner = (cx, cy, base) => { for (let k = 0; k < 9; k++) branch(cx, cy, base + (k / 8) * Math.PI / 2 + (Math.random() - .5) * .15, 18 + Math.random() * 26, 6, 2.4); };
      corner(0, 0, 0); corner(W, 0, Math.PI / 2); corner(W, H, Math.PI); corner(0, H, Math.PI * 1.5);
      for (let k = 0; k < 46; k++) {   // and along the edges
        const e = k % 4, tt = Math.random();
        const x = e === 0 ? tt * W : e === 1 ? W : e === 2 ? tt * W : 0, y = e === 0 ? 0 : e === 1 ? tt * H : e === 2 ? H : tt * H;
        const ang = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][e] + (Math.random() - .5) * 1.1;
        branch(x, y, ang, 10 + Math.random() * 22, 5, 1.8);
      }
      const vg = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .85); vg.addColorStop(0, 'rgba(225,238,255,0)'); vg.addColorStop(.7, 'rgba(225,238,255,.12)'); vg.addColorStop(1, 'rgba(225,238,255,.5)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }
    function drawFrost(g) {
      const k = frostK();
      if (k <= 0) { if (once.frost) forget('frost'); return; }
      note('frost', `❄️ Het vriest (${WX.temp !== null ? Math.round(WX.temp) + '°C' : 'test'}): ijsbloemen op het scherm.`);
      if (!frostCv) makeFrost();
      g.save(); g.globalAlpha = .35 + .65 * k; g.drawImage(frostCv, 0, 0); g.restore();
      // breath: a little cloud from Kamiel's nose every few seconds
      const t = A.t();
      if (t - breathT > 2.6 && !A.eventOn()) { breathT = t; const n = A.nose(); if (n) breath.push({ x: n.x, y: n.y, t0: t, dir: A.face() }); }
      for (let i = breath.length - 1; i >= 0; i--) {
        const b = breath[i], a = t - b.t0; if (a > 1.8) { breath.splice(i, 1); continue; }
        g.fillStyle = `rgba(240,245,255,${.45 * (1 - a / 1.8)})`;
        for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(b.x + b.dir * (8 + a * 26 + j * 6), b.y - a * 10 + j * 2, 4 + a * 8 - j, 0, 7); g.fill(); }
      }
    }
    // heat: the air above the horizon shimmers, a warm haze
    const shimmerCv = document.createElement('canvas');
    function drawHeat(g, cv) {
      const k = heatK();
      if (k <= 0) { if (once.heat) forget('heat'); return; }
      note('heat', `🔥 Het is ${WX.temp !== null ? Math.round(WX.temp) + '°C' : 'heet (test)'}: de lucht trilt boven de horizon.`);
      const y0 = HOR0 - 70, hh = 120; shimmerCv.width = W; shimmerCv.height = hh;
      const q = shimmerCv.getContext('2d'); q.clearRect(0, 0, W, hh); q.drawImage(cv, 0, y0, W, hh, 0, 0, W, hh);
      const t = A.t();
      for (let y = 0; y < hh; y += 2) { const off = Math.sin(y * .25 + t * 6) * 2.2 * k + Math.sin(y * .11 - t * 3.7) * 1.4 * k; g.drawImage(shimmerCv, 0, y, W, 2, off, y0 + y, W, 2); }
      g.fillStyle = `rgba(255,170,90,${.07 * k})`; g.fillRect(0, 0, W, H);
    }
    // strong sun: a soft lens flare (and Kamiel's sunglasses, see display.html)
    function drawFlare(g, sun) {
      if (!uvHigh() || sun.alt < 5) { if (once.uv) forget('uv'); return; }
      note('uv', `😎 UV-index ${WX.uv !== null ? Math.round(WX.uv) : 'hoog (test)'}: Kamiel zet zijn zonnebril op.`);
      const sx = A.azX(sun.az), sy = A.altY(sun.alt); if (sx < -100 || sx > W + 100) return;
      const cx = W / 2, cy = H / 2;
      g.save(); g.globalCompositeOperation = 'screen';
      [[.35, 26, '255,220,150', .12], [.6, 14, '150,220,255', .14], [.85, 40, '255,170,200', .08], [1.25, 20, '200,255,200', .1], [1.5, 60, '255,230,180', .06]].forEach(([f, r, c, a]) => {
        const x = sx + (cx - sx) * f * 2, y = sy + (cy - sy) * f * 2;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(.7, `rgba(${c},${a * .6})`); gr.addColorStop(1, `rgba(${c},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      });
      g.restore();
    }

    /* ---------- the telescope: everything worth seeing tonight, and a look through the eyepiece ---------- */
    const DSO = [
      ['Pleiaden (Zevengesternte)', 'M45', 3.79, 24.1, 'open sterrenhoop'], ['Orionnevel', 'M42', 5.59, -5.39, 'gasnevel waar sterren geboren worden'],
      ['Andromedastelsel', 'M31', .712, 41.27, 'het verste wat je met het blote oog kan zien: 2,5 miljoen lichtjaar'], ['Bijenkorf', 'M44', 8.67, 19.98, 'open sterrenhoop'],
      ['Ringnevel', 'M57', 18.89, 33.03, 'een gestorven ster met een ring van gas'], ['Herculescluster', 'M13', 16.69, 36.46, 'bolhoop van honderdduizenden sterren'],
      ['Dubbele sterrenhoop', 'h+χ Per', 2.33, 57.13, 'twee sterrenhopen naast elkaar'], ['Halternevel', 'M27', 19.99, 22.72, 'planetaire nevel'],
      ['Albireo', 'β Cyg', 19.51, 27.96, 'dubbelster: goud en blauw'], ['Mizar en Alcor', 'ζ UMa', 13.40, 54.93, 'dubbelster in de Grote Beer'],
      ['Lagunenevel', 'M8', 18.06, -24.38, 'gasnevel, laag in het zuiden'], ['Bode-stelsel', 'M81', 9.93, 69.07, 'spiraalstelsel'],
    ];
    const DIRS = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'], dirOf = (az) => DIRS[Math.round(((az % 360) + 360) % 360 / 45) % 8];
    const hm = (dt) => dt ? String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0') : '–';
    const PNL = { Venus: 'Venus', Jupiter: 'Jupiter', Mars: 'Mars', Saturn: 'Saturnus', Mercury: 'Mercurius', Moon: 'Maan' };
    function riseSet(body, d, dir) { try { const r = AST.SearchRiseSet(body, observer(), dir, new Date(d.getTime() - 3 * 3600e3), 1.2); return r ? r.date : null; } catch (e) { return null; } }
    function issPasses(d) {
      if (!satrec) return [];
      const out = []; let cur = null;
      for (let m = 0; m < 12 * 60; m += .5) {
        const t = new Date(d.getTime() + m * 60000), p = issNow(t); if (!p) continue;
        if (p.alt > 10) { if (!cur) cur = { start: t, max: p.alt, az0: p.az, azMax: p.az }; else if (p.alt > cur.max) { cur.max = p.alt; cur.azMax = p.az; } cur.end = t; cur.az1 = p.az; }
        else if (cur) { out.push(cur); cur = null; if (out.length >= 4) break; }
      }
      if (cur) out.push(cur);
      return out;
    }
    function tonight(d) {
      const o = observer(), sec = [];
      if (!AST) return [{ title: 'Kamiel kan de hemel niet uitrekenen', rows: [] }];
      const ill = AST.Illumination('Moon', d), ph = AST.MoonPhase(d), pctLit = Math.round(ill.phase_fraction * 100);
      const phName = ph < 22.5 || ph > 337.5 ? 'nieuwe maan' : ph < 67.5 ? 'wassende sikkel' : ph < 112.5 ? 'eerste kwartier' : ph < 157.5 ? 'wassende maan' : ph < 202.5 ? 'volle maan' : ph < 247.5 ? 'afnemende maan' : ph < 292.5 ? 'laatste kwartier' : 'afnemende sikkel';
      const mEq = AST.Equator('Moon', d, o, true, true), mH = AST.Horizon(d, o, mEq.ra, mEq.dec, 'normal');
      sec.push({ title: 'De maan', rows: [{ id: 'moon', name: phName[0].toUpperCase() + phName.slice(1) + ', ' + pctLit + '% verlicht', info: mH.altitude > 0 ? `nu ${Math.round(mH.altitude)}° hoog in het ${dirOf(mH.azimuth)}` : `komt op om ${hm(riseSet('Moon', d, +1))}` }] });
      const pl = [];
      for (const [body] of PLANETS) {
        try {
          const e = AST.Equator(body, d, o, true, true), h = AST.Horizon(d, o, e.ra, e.dec, 'normal'), mag = AST.Illumination(body, d).mag;
          const up = h.altitude > 3, rise = riseSet(body, d, +1), set = riseSet(body, d, -1);
          pl.push({ id: 'planet:' + body, name: PNL[body], mag, info: up ? `nu ${Math.round(h.altitude)}° hoog in het ${dirOf(h.azimuth)}, gaat onder om ${hm(set)}` : `komt op om ${hm(rise)} (${dirOf(AST.Horizon(rise || d, o, e.ra, e.dec, 'normal').azimuth)})`, up });
        } catch (e) { }
      }
      sec.push({ title: 'Planeten', rows: pl.sort((a, b) => (b.up - a.up) || a.mag - b.mag).map(p => ({ id: p.id, name: p.name + (p.up ? '' : ' (nog niet op)'), info: p.info + ` · helderheid ${p.mag.toFixed(1)}` })) });
      if (SD) {
        const lst = lstDeg(d), sinP = Math.sin(A.lat() * D2R), cosP = Math.cos(A.lat() * D2R), cons = [];
        for (const k in SD.NAMES) { const [nm, ra, dec, rank] = SD.NAMES[k]; if (rank > 2) continue; const [az, alt] = altaz(ra, dec, lst, sinP, cosP); if (alt > 20) cons.push({ nm, az, alt, rank }); }
        cons.sort((a, b) => a.rank - b.rank || b.alt - a.alt);
        sec.push({ title: 'Sterrenbeelden die nu goed staan', rows: cons.slice(0, 8).map(c => ({ id: 'con', name: c.nm, info: `${Math.round(c.alt)}° hoog in het ${dirOf(c.az)}` })) });
        const ds = [];
        for (const [nm, code, ra, dec, what] of DSO) { const [az, alt] = altaz(ra, dec, lst, sinP, cosP); if (alt > 15) ds.push({ id: 'dso:' + code, name: nm + ' (' + code + ')', info: what + ` · ${Math.round(alt)}° hoog in het ${dirOf(az)}` }); }
        if (ds.length) sec.push({ title: 'Voor de telescoop', rows: ds });
      }
      const ps = issPasses(d);
      sec.push({ title: 'Het ISS', rows: ps.length ? ps.map(p => ({ id: 'iss', name: `${hm(p.start)} – ${hm(p.end)}`, info: `van ${dirOf(p.az0)} naar ${dirOf(p.az1)}, hoogste punt ${Math.round(p.max)}° in het ${dirOf(p.azMax)}` }))
        : [{ id: 'iss', name: satrec ? 'Komt de komende 12 uur niet hoog genoeg over' : 'De baan is nog niet binnen', info: '' }] });
      const sh = showerNow(d);
      if (sh && sh.rate > 5) sec.push({ title: 'Vallende sterren', rows: [{ id: 'met', name: 'De ' + sh.s.name, info: `tot ${Math.round(sh.rate)} per uur aan de hele hemel; het best na middernacht` }] });
      try {
        const se = AST.SearchLocalSolarEclipse(d, o), le = AST.SearchLunarEclipse(d), rows = [];
        if (se.peak.time.date - d < 400 * 864e5) rows.push({ id: 'ecl', name: 'Zonsverduistering ' + se.peak.time.date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }), info: `${se.kind === 'partial' ? 'gedeeltelijk' : se.kind === 'total' ? 'totaal' : 'ringvormig'}, ${Math.round(se.obscuration * 100)}% van de zon bedekt, om ${hm(se.peak.time.date)}` });
        if (le.peak.date - d < 400 * 864e5) rows.push({ id: 'ecl', name: 'Maansverduistering ' + le.peak.date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }), info: `${le.kind === 'total' ? 'totaal' : le.kind === 'partial' ? 'gedeeltelijk' : 'bijschaduw'}, hoogtepunt om ${hm(le.peak.date)}` });
        if (rows.length) sec.push({ title: 'Binnenkort', rows });
      } catch (e) { }
      const ss = riseSet('Sun', d, -1), sr = riseSet('Sun', new Date(d.getTime() + 6 * 3600e3), +1);
      sec.push({ title: 'De zon', rows: [{ id: 'sun', name: `Onder om ${hm(ss)}, op om ${hm(sr)}`, info: '' }] });
      return sec;
    }
    // the eyepiece: a round view with the chosen object
    function eyepiece(c, id, d) {
      const g = c.getContext('2d'), R = c.width / 2;
      g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
      g.save(); g.beginPath(); g.arc(R, R, R - 3, 0, 7); g.clip();
      g.fillStyle = '#05060d'; g.fillRect(0, 0, c.width, c.height);
      const rs = (k) => hsh(k * 7.31 + id.length * 3.1);
      for (let k = 0; k < 70; k++) { g.fillStyle = `rgba(255,255,255,${.2 + rs(k) * .6})`; g.fillRect(rs(k + 100) * c.width, rs(k + 200) * c.height, rs(k) > .9 ? 2 : 1, rs(k) > .9 ? 2 : 1); }
      const disc = (r, col, shade) => { const gr = g.createRadialGradient(R - r * .3, R - r * .3, r * .1, R, R, r); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); g.fillStyle = gr; g.beginPath(); g.arc(R, R, r, 0, 7); g.fill(); if (shade) shade(r); };
      if (id === 'moon' || id === 'ecl') {
        const r = R * .78, ph = AST ? AST.MoonPhase(d) / 360 : .5;
        disc(r, ['#f2efe6', '#b9b5aa']);
        g.fillStyle = 'rgba(110,108,100,.35)';
        [[-.3, -.2, .22], [.15, -.3, .15], [.25, .1, .2], [-.15, .3, .14], [-.45, .15, .1], [.4, -.05, .08]].forEach(([u, v, z]) => { g.beginPath(); g.arc(R + u * r, R + v * r, z * r, 0, 7); g.fill(); });
        for (let k = 0; k < 40; k++) { g.strokeStyle = 'rgba(90,88,80,.35)'; g.beginPath(); g.arc(R + (rs(k) - .5) * r * 1.6, R + (rs(k + 50) - .5) * r * 1.6, 2 + rs(k + 9) * 7, 0, 7); g.stroke(); }
        // the dark part: waxing = lit on the right
        const k = Math.cos(ph * 2 * Math.PI), waxing = ph < .5;
        g.fillStyle = 'rgba(3,4,10,.93)'; g.beginPath();
        if (waxing) { g.arc(R, R, r + 1, Math.PI / 2, Math.PI * 1.5); g.ellipse(R, R, Math.abs(k) * r, r + 1, 0, Math.PI * 1.5, Math.PI / 2, k < 0); }
        else { g.arc(R, R, r + 1, -Math.PI / 2, Math.PI / 2); g.ellipse(R, R, Math.abs(k) * r, r + 1, 0, Math.PI / 2, Math.PI * 1.5, k < 0); }
        g.fill();
      } else if (id.startsWith('planet:')) {
        const body = id.split(':')[1];
        if (body === 'Jupiter') {
          disc(R * .32, ['#f3e2c4', '#b89768'], (r) => { for (let b = 0; b < 6; b++) { g.fillStyle = b % 2 ? 'rgba(160,110,70,.45)' : 'rgba(255,240,220,.25)'; g.fillRect(R - r, R - r * .55 + b * r * .2, r * 2, r * .1); } g.fillStyle = 'rgba(190,90,60,.6)'; g.beginPath(); g.ellipse(R + r * .35, R + r * .25, r * .14, r * .08, 0, 0, 7); g.fill(); });
          // the four big moons in their real order and side (squeezed a little so they fit in the eyepiece)
          try { const jm = AST.JupiterMoons(d), r0 = R * .32; ['io', 'europa', 'ganymede', 'callisto'].forEach((k) => { const m = jm[k], x = m.x, off = Math.min(R * .9, r0 + Math.sqrt(Math.abs(x) / .0126) * (R * .86 - r0));
            g.fillStyle = '#fff'; g.beginPath(); g.arc(R + Math.sign(x) * off, R + (m.y > 0 ? -1 : 1) * Math.min(6, Math.abs(m.y) * 400), 2.4, 0, 7); g.fill(); }); } catch (e) { }
        } else if (body === 'Saturn') {
          g.strokeStyle = 'rgba(230,210,160,.85)'; g.lineWidth = 4; g.beginPath(); g.ellipse(R, R, R * .62, R * .17, -.12, 0, 7); g.stroke();
          disc(R * .26, ['#f5e2b0', '#b8995c']);
          g.strokeStyle = 'rgba(230,210,160,.9)'; g.beginPath(); g.ellipse(R, R, R * .62, R * .17, -.12, 0, Math.PI); g.stroke();
        } else if (body === 'Mars') disc(R * .2, ['#ff9b6a', '#a8401f'], (r) => { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(R, R - r * .85, r * .35, r * .14, 0, 0, 7); g.fill(); });
        else if (body === 'Venus') { const f = AST.Illumination('Venus', d).phase_fraction; disc(R * .3, ['#fffbea', '#d9cfae']); g.fillStyle = 'rgba(5,6,13,.97)'; g.beginPath(); g.ellipse(R - R * .3 * (f - .5) * 2, R, R * .3, R * .31, 0, 0, 7); g.fill(); }
        else disc(R * .12, ['#e8e0d0', '#9a9080']);
      } else if (id.startsWith('dso:')) {
        const code = id.split(':')[1];
        if (code === 'M45' || code === 'M44' || code.startsWith('h+')) { for (let k = 0; k < (code === 'M45' ? 14 : 40); k++) { const r = code === 'M45' && k < 7 ? 3.2 : 1.6; g.fillStyle = code === 'M45' ? 'rgba(200,220,255,.95)' : 'rgba(255,245,230,.9)'; g.beginPath(); g.arc(R + (rs(k + 300) - .5) * R * 1.2, R + (rs(k + 400) - .5) * R * 1.2, r, 0, 7); g.fill(); } }
        else if (code === 'M42' || code === 'M8') { const gr = g.createRadialGradient(R, R, 4, R, R, R * .7); gr.addColorStop(0, 'rgba(255,170,190,.7)'); gr.addColorStop(.5, 'rgba(160,110,200,.35)'); gr.addColorStop(1, 'rgba(60,40,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#fff'; [[0, 0], [5, 3], [-4, 4], [2, -5]].forEach(([u, v]) => g.fillRect(R + u, R + v, 2, 2)); }
        else if (code === 'M31' || code === 'M81') { g.save(); g.translate(R, R); g.rotate(-.6); const gr = g.createRadialGradient(0, 0, 2, 0, 0, R * .8); gr.addColorStop(0, 'rgba(255,245,225,.9)'); gr.addColorStop(.3, 'rgba(220,210,200,.35)'); gr.addColorStop(1, 'rgba(120,120,140,0)'); g.scale(1, .3); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * .8, 0, 7); g.fill(); g.restore(); }
        else if (code === 'M57' || code === 'M27') { g.strokeStyle = 'rgba(140,220,200,.75)'; g.lineWidth = R * .12; g.beginPath(); g.ellipse(R, R, R * .32, R * .24, .3, 0, 7); g.stroke(); }
        else if (code === 'M13') { for (let k = 0; k < 220; k++) { const a = rs(k + 500) * 7, r = Math.pow(rs(k + 600), 2) * R * .55; g.fillStyle = 'rgba(255,240,215,.75)'; g.fillRect(R + Math.cos(a) * r, R + Math.sin(a) * r, 1.4, 1.4); } }
        else { g.fillStyle = '#ffcf6a'; g.beginPath(); g.arc(R - 10, R, 5, 0, 7); g.fill(); g.fillStyle = '#7fb0ff'; g.beginPath(); g.arc(R + 10, R + 4, 3.5, 0, 7); g.fill(); }
      } else { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(R, R, 3, 0, 7); g.fill(); }
      g.restore();
      g.strokeStyle = '#222'; g.lineWidth = 6; g.beginPath(); g.arc(R, R, R - 3, 0, 7); g.stroke();
      const v = g.createRadialGradient(R, R, R * .7, R, R, R); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.beginPath(); g.arc(R, R, R - 3, 0, 7); g.fill();
    }

    return {
      back(g, d, sun) { try { drawRainbow(g, d, sun); drawNebula(g, d, sun); drawStars(g, d, sun); drawISS(g, d, sun); drawMeteors(g, d, sun); } catch (e) { console.error('sky', e); } },
      flyers(g, d, sun) { try { drawFlyers(g, d, sun); } catch (e) { console.error('flyers', e); } },
      rainCloud(g, sun) { try { rainCloud(g, sun); } catch (e) { console.error('rain cloud', e); } },
      screen(g, sun, cv) { try { if (cv) drawHeat(g, cv); drawStorm(g); drawLights(g, sun); drawLightning(g); drawFlare(g, sun); drawFrost(g); } catch (e) { console.error('sky screen', e); } },
      storm: stormK, uvHigh,
      sunEclipse, drawMoonShadow, moonShadow,
      onState(s, st) { if (s && s.tle) setTle(s.tle); if (s) WX.rain = s.rain_soon || null; if (st) { WX.temp = st.temp === null || st.temp === undefined ? null : +st.temp; WX.uv = st.uv === null || st.uv === undefined ? null : +st.uv; WX.gust = st.gust; WX.bearing = st.bearing; } },
      onLive(s) { if (!s) return; (s.planes || []).forEach(addPlane); (s.strikes || []).forEach(addStrike); },
      tap, tonight, eyepiece,
      debug: () => ({ shower: showerNow(A.now()), nebula: neb && neb.on, iss: iss, flyers: flyers.map(f => ({ kind: f.kind, x: f.x, y: f.sy === undefined ? f.y : f.sy })), eclipses: ecl }),
    };
  }
  window.KamielSky = { create, SHOWERS };
})();
