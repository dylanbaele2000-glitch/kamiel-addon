/* Kamiel's world events: little things that happen now and then, so Kamiel feels alive.
   Every event lasts at most a minute. The list below is also read by the add-on (Studio, Telegram /event),
   so keep one event per line, written exactly like this: id, name, cat.
   cat: 'lama' = the daily visit, 'intern' = only when the house asks for it (doorbell, camera), 'vaak' = a few times a day, 'soms' = a few times a week. */
(function () {
  const LIST = [
    { id: 'lama', name: 'Heidi komt langs (de witte lama)', cat: 'lama' },
    { id: 'wifi', name: 'Wifi wil spelen', cat: 'dier' },
    { id: 'snoet', name: 'Snoet, de kleine tornado', cat: 'dier' },
    { id: 'pippa', name: 'Pippa komt kijken', cat: 'dier' },
    { id: 'pebbels', name: 'Pebbels op ontdekking', cat: 'dier' },
    { id: 'dobby', name: 'Dobby het konijn', cat: 'dier' },
    { id: 'omdraaien', name: 'Verkeerde kant op', cat: 'vaak' },
    { id: 'camera', name: 'De camera volgt niet', cat: 'vaak' },
    { id: 'inspecteren', name: 'Een object inspecteren', cat: 'vaak' },
    { id: 'schrikken', name: 'Heel hard verschieten', cat: 'vaak' },
    { id: 'rondje', name: 'Uit beeld en aan de andere kant terug', cat: 'vaak' },
    { id: 'springen', name: 'Springen', cat: 'vaak' },
    { id: 'vergeten', name: 'Vergeten door te lopen, dan sprinten', cat: 'vaak' },
    { id: 'rondkijken', name: 'Verbaasd rondkijken', cat: 'vaak' },
    { id: 'lucht', name: 'Naar iets in de lucht kijken', cat: 'vaak' },
    { id: 'slapen', name: 'In slaap vallen', cat: 'vaak' },
    { id: 'yoga', name: 'Yoga', cat: 'vaak' },
    { id: 'strekken', name: 'Zich uitstrekken', cat: 'vaak' },
    { id: 'passen', name: 'Hoeden en brillen passen', cat: 'vaak' },
    { id: 'verstoppen', name: 'Verstoppen achter een horizonobject', cat: 'vaak' },
    { id: 'omduwen', name: 'Een horizonobject proberen omduwen', cat: 'vaak' },
    { id: 'duizelig', name: 'Duizelig', cat: 'vaak' },
    { id: 'triest', name: 'Triest', cat: 'vaak' },
    { id: 'blij', name: 'Gelukkig', cat: 'vaak' },
    { id: 'zweten', name: 'Zweten', cat: 'vaak' },
    { id: 'koud', name: 'Het koud hebben', cat: 'vaak' },
    { id: 'grondje', name: 'Een klein object op de grond bekijken', cat: 'vaak' },
    { id: 'zweven', name: 'Zweven', cat: 'vaak' },
    { id: 'reus', name: 'Reuzegroot worden', cat: 'vaak' },
    { id: 'oordeel', name: 'Judgemental naar een foto staren', cat: 'vaak' },
    { id: 'verliefd', name: 'Verliefd naar een foto staren', cat: 'vaak' },
    { id: 'dansen', name: 'Dansen', cat: 'vaak' },
    { id: 'ijsberen', name: 'IJsberen', cat: 'vaak' },
    { id: 'wegrennen', name: 'Verschieten en wegrennen', cat: 'vaak' },
    { id: 'wolk', name: 'Een wolk volgen', cat: 'vaak' },
    { id: 'moonwalk-weg', name: 'Moonwalk naar de volgende scene', cat: 'vaak' },
    { id: 'moonwalk', name: 'Moonwalk ter plekke', cat: 'vaak' },
    { id: 'zoom', name: 'De camera zoomt in', cat: 'vaak' },
    { id: 'sniper', name: 'Een laser op Kamiel gericht', cat: 'vaak' },
    { id: 'laser', name: 'Een laser vangen als een kat', cat: 'vaak' },
    { id: 'verveeld', name: 'Verveeld weg, bang terug', cat: 'vaak' },
    { id: 'lens-staren', name: 'Onscherp in de lens staren', cat: 'vaak' },
    { id: 'lens-ruiken', name: 'Aan de lens ruiken', cat: 'vaak' },
    { id: 'lens-likken', name: 'Aan de lens likken', cat: 'vaak' },
    { id: 'lens-breken', name: 'De lens breken', cat: 'vaak' },
    { id: 'vuur', name: 'Vuur spuwen', cat: 'vaak' },
    { id: 'bubbels', name: 'Bubbels blazen', cat: 'vaak' },
    { id: 'scheet', name: 'Een scheetje', cat: 'vaak' },
    { id: 'bevriezen', name: 'Bevriezen', cat: 'vaak' },
    { id: 'zingen', name: 'Iets zingen of roepen', cat: 'vaak' },
    { id: 'rondjes', name: 'Rondjes draaien', cat: 'vaak' },
    { id: 'dronken', name: 'Duizelig naar de volgende scene', cat: 'vaak' },
    { id: 'stip', name: 'Naar de horizon wandelen', cat: 'vaak' },
    { id: 'crash', name: 'De wereld crasht', cat: 'vaak' },
    { id: 'tweeling', name: 'De tweelingbroer', cat: 'soms' },
    { id: 'mol', name: 'Een mol', cat: 'soms' },
    { id: 'raket', name: 'Als een raket naar de zon of maan', cat: 'soms' },
    { id: 'zinkgat', name: 'Een zinkgat', cat: 'soms' },
    { id: 'wolkrit', name: 'Op een wolk naar de volgende scene', cat: 'soms' },
    { id: 'rave', name: 'Een rave', cat: 'soms' },
    { id: 'upsidedown', name: 'De Upside Down', cat: 'soms' },
    { id: 'vuurwerk', name: 'Vuurwerkshow', cat: 'soms' },
    { id: 'schuin', name: 'De wereld gaat schuin', cat: 'soms' },
    { id: 'aardbeving', name: 'Aardbeving', cat: 'soms' },
    { id: 'tornado', name: 'Tornado', cat: 'soms' },
    { id: 'vloedgolf', name: 'Vloedgolf', cat: 'soms' },
    { id: 'muis-pesten', name: 'Een computermuis pest Kamiel', cat: 'soms' },
    { id: 'muis-slepen', name: 'Een computermuis versleept Kamiel', cat: 'soms' },
    { id: 'echte-muis', name: 'Een echte muis', cat: 'soms' },
    { id: 'lucht-valt', name: 'De lucht valt naar beneden', cat: 'soms' },
    { id: 'deurbel', name: 'Er wordt aangebeld', cat: 'intern' },
    { id: 'kijken', name: 'Iemand staat voor de tablet', cat: 'intern' },
    { id: 'begroeten', name: 'Een huisdier komt Kamiel begroeten', cat: 'intern' },
    { id: 'dansfeest', name: 'Dansfeest: iedereen danst op het nummer', cat: 'muziek' },
    { id: 'heidiwraak', name: 'Heidi\u2019s wraak: ze kaapt het scherm', cat: 'verhaal' },
    { id: 'ufo', name: 'Dobby wordt ontvoerd door een ufo', cat: 'verhaal' },
    { id: 'verhuis', name: 'De grote verhuis', cat: 'verhaal' },
    { id: 'ogen', name: 'Ogen in het donker', cat: 'verhaal' },
    { id: 'brengen', name: 'Een huisdier sleept iets de scène in', cat: 'verhaal' },
    { id: 'skydive', name: 'Skydiven, met de parachute op Kamiel', cat: 'verhaal' },
    { id: 'verdwaald', name: 'Een huisdier is de weg kwijt', cat: 'verhaal' },
    { id: 'sprint', name: 'Een wilde achtervolging door de scène', cat: 'verhaal' },
    { id: 'toren', name: 'Een toren van huisdieren', cat: 'verhaal' },
    { id: 'sluipen', name: 'Sluipen achter Kamiel', cat: 'verhaal' },
    { id: 'taart', name: 'Verjaardagstaart', cat: 'feest' },
    { id: 'spook', name: 'Het spook (Halloween)', cat: 'feest' },
    { id: 'slee', name: 'De slee door de lucht (Kerstmis)', cat: 'feest' },
    { id: 'eieren', name: 'Dobby verstopt eieren (Pasen)', cat: 'feest' },
    { id: 'vuurwerkfeest', name: 'Groot vuurwerk (Nieuwjaar)', cat: 'feest' },
    { id: 'verliefd', name: 'Verliefd (Valentijn)', cat: 'feest' },
    { id: 'pepernoten', name: 'Pepernoten (Sinterklaas)', cat: 'feest' },
  ];

  const CATS = { verhaal: 'Verhaaltjes', feest: 'Op feestdagen', muziek: 'Op muziek', lama: 'Elke dag', dier: 'Huisdieren', vaak: 'Vaak (een paar keer per dag)', soms: 'Soms (een paar keer per week)' };
  const PETS = ['wifi', 'snoet', 'pippa', 'pebbels', 'dobby'];

  /* ---------- the plan: when today's events happen ---------- */
  // seeded random, so a day's plan stays the same after a reload
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    let a = h >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const ymd = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  // any minute of the day can happen; 17:00-19:30 is three times as likely
  function minuteOf(r, evening) {
    if (evening && r() < 300 / 1740) return 1020 + Math.floor(r() * 150);
    return Math.floor(r() * 1440);
  }
  const num = (v, d) => (v === undefined || v === null || v === '') ? d : +v;
  function planFor(d, cfg, fest, boost) {
    const out = [], r = seeded('dag ' + ymd(d)), ev = cfg.evening !== false, B = fest ? Math.max(1, boost || 3) : 1;
    // on a feast day (or a birthday) much more happens, and things of the day itself, mostly during the day and evening
    for (let k = 0; k < Math.round(num(cfg.lama_per_day, 1) * B); k++) out.push({ at: minuteOf(r, ev), cat: 'lama' });
    for (let k = 0; k < Math.round(num(cfg.common_per_day, 3) * B); k++) out.push({ at: minuteOf(r, ev), cat: 'vaak' });
    const pd = cfg.pets_per_day || {};
    for (const p of PETS) for (let k = 0; k < Math.round(num(pd[p], 2) * Math.min(B, 2)); k++) out.push({ at: minuteOf(r, ev), cat: 'dier', id: p });
    if (fest) for (let k = 0; k < 2 + B; k++) out.push({ at: 480 + Math.floor(r() * 900), cat: 'feest' });
    // the little stories: a few times a week, the same plan all week
    const monS = new Date(d); monS.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const rs = seeded('verhaal ' + ymd(monS)), todayS = (d.getDay() + 6) % 7;
    for (let k = 0; k < num(cfg.stories_per_week, 3) * (fest ? 2 : 1); k++) { const day = Math.floor(rs() * 7), at = 540 + Math.floor(rs() * 780); if (day === todayS || fest) out.push({ at: fest ? 480 + Math.floor(r() * 900) : at, cat: 'verhaal' }); }
    // "a few times a week": spread over the week, the same plan all week long
    const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const rw = seeded('week ' + ymd(mon)), today = (d.getDay() + 6) % 7;
    for (let k = 0; k < num(cfg.normal_per_week, 4); k++) { const day = Math.floor(rw() * 7), at = minuteOf(rw, ev); if (day === today) out.push({ at, cat: 'soms' }); }
    return out.sort((a, b) => a.at - b.at);
  }

  /* ---------- little pixel sprites ---------- */
  const SP = {
    '!': { pal: { K: '#1a1020', Y: '#ffd23f' }, rows: ['KKK', 'KYK', 'KYK', 'KYK', 'KYK', 'KKK', 'KYK', 'KKK'] },
    '?': { pal: { K: '#1a1020', Y: '#7ee0ff' }, rows: ['.KKKKK.', 'KYYYYYK', 'KYKKKYK', 'KKK.KYK', '..KKYYK', '..KYYKK', '..KYK..', '..KKK..', '..KYK..', '..KKK..'] },
    heart: { pal: { K: '#3a0a1a', P: '#ff3d8b', W: '#ffd0e4' }, rows: ['.KK.KK.', 'KPPKPPK', 'KPWPPPK', 'KPPPPPK', '.KPPPK.', '..KPK..', '...K...'] },
    drop: { pal: { K: '#12304a', B: '#7ec8ff', W: '#ffffff' }, rows: ['..K..', '.KBK.', '.KBK.', 'KBBWK', 'KBBBK', '.KKK.'] },
    star: { pal: { K: '#4a3000', Y: '#ffd23f' }, rows: ['...K...', '..KYK..', 'KKKYKKK', 'KYYYYYK', '.KYYYK.', '.KYKYK.', '.K...K.'] },
    note: { pal: { K: '#14102a', W: '#ffffff' }, rows: ['...KKK', '...KWK', '...KWK', '...K.K', '.KKK..', 'KWWK..', 'KWWK..', '.KK...'] },
    snow: { pal: { W: '#ffffff' }, rows: ['..W..', 'W.W.W', '.WWW.', 'WWWWW', '.WWW.', 'W.W.W', '..W..'] },
    spark: { pal: { W: '#ffffff', Y: '#fff3a0' }, rows: ['..W..', '..W..', 'WWYWW', '..W..', '..W..'] },
    angry: { pal: { R: '#e2202b' }, rows: ['RR.RR', 'R...R', '.....', 'R...R', 'RR.RR'] },
    mole: { pal: { K: '#1a1210', D: '#4a3a33', d: '#6a5548', P: '#ff8fa3', W: '#f0d9c0', E: '#000000' },
      rows: ['...KKKKKK...', '..KDDdDDDK..', '.KDDDDDDDDK.', '.KDEDDDDEDK.', '.KDDDDDDDDK.', '.KDDDPPDDDK.', '..KDDPPDDK..', '.WWKDDDDKWW.', 'WWW.KDDK.WWW', '...KDDDDK...'] },
    mouse: { pal: { K: '#222', G: '#8d8d8d', g: '#b0b0b0', P: '#ff9aae', E: '#000' },
      rows: ['......KK...', '.....KPPK..', '..KKKKGGKK.', '.KGGGGGGEGK', 'KGgGGGGGGGP', '.KGGGGGGKK.', '..K.K..K.K.'] },
    cursor: { pal: { K: '#000', W: '#fff' }, rows: ['K...........', 'KK..........', 'KWK.........', 'KWWK........', 'KWWWK.......', 'KWWWWK......', 'KWWWWWK.....',
      'KWWWWWWK....', 'KWWWWWWWK...', 'KWWWWWWWWK..', 'KWWWWWKKKKK.', 'KWWKWWK.....', 'KWK.KWWK....', 'KK..KWWK....', 'K....KWWK...', '.....KWWK...', '......KK....'] },
    hand: { pal: { K: '#000', W: '#fff' }, rows: ['....KK......', '...KWWK.....', '...KWWK.....', '...KWWKKK...', '...KWWKWWKK.', '.KKKWWKWWKWK', 'KWWKWWWWWKWK',
      'KWWWWWWWWWWK', '.KWWWWWWWWWK', '..KWWWWWWWK.', '..KWWWWWWWK.', '...KWWWWWK..', '...KKKKKKK..'] },
    ufo: { pal: { C: '#9fe8ff', c: '#d8f7ff', G: '#9aa3b0', g: '#6c7480', Y: '#ffe14d', K: '#2a2f38' },
      rows: ['.......CCCC.......', '.....CCcCCCCC.....', '....CCcCCCCCCC....', '..KGGGGGGGGGGGGK..', '.GGYGGYGGYGGYGGYG.', 'KGGGGGGGGGGGGGGGGK', '.KggggggggggggggK.', '...KKKKKKKKKKKK...'] },
    rocket: { pal: { R: '#e2343a', W: '#f2f2f2', B: '#4aa3ff', K: '#333' },
      rows: ['...R...', '..RRR..', '..WWW..', '.WWWWW.', '.WBBWW.', '.WBBWW.', '.WWWWW.', '.WWWWW.', '.WWWWW.', 'RWWWWWR', 'RRWWWRR', 'RR.K.RR'] },
    balloon: { pal: { R: '#e2343a', r: '#a8202a', W: '#ffb0b0' },
      rows: ['..RRRRR..', '.RRWRRRR.', 'RRWRRRRRR', 'RRRRRRRRR', 'RRRRRRRRr', '.RRRRRRr.', '..RRRRr..', '...RRr...', '....r....'] },
    cloud: { pal: { W: '#ffffff', w: '#dfe6f2', K: '#9aa6bb' },
      rows: ['......WWWW..........', '....WWWWWWWW..WWW...', '..WWWWWWWWWWWWWWWWW.', '.WWWWWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwwwwwww', '.KKKKKKKKKKKKKKKKKK.'] },
    burst: { pal: { Y: '#ffd23f', W: '#ffffff', K: '#3a2400' }, rows: ['K...K...K', '.K.KYK.K.', '..KYWYK..', 'KKYWWWYKK', '..KYWYK..', '.K.KYK.K.', 'K...K...K'] },
    raincloud: { pal: { G: '#7a8494', g: '#5d6573' }, rows: ['...GGG.....', '..GGGGGGG..', '.GGGGGGGGG.', 'GGGGGGGGGGG', 'ggggggggggg'] },
  };
  function spr(g, s, x, y, u, flip) {
    const rows = s.rows, n = rows[0].length;
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < n; c++) {
      const col = s.pal[rows[r][c]]; if (!col) continue;
      const cc = flip ? n - 1 - c : c;
      g.fillStyle = col; g.fillRect(Math.round(x + cc * u), Math.round(y + r * u), Math.ceil(u), Math.ceil(u));
    }
  }
  const sprC = (g, s, cx, cy, u, flip) => spr(g, s, cx - s.rows[0].length * u / 2, cy - s.rows.length * u / 2, u, flip);

  function create(A) {
    const W = A.W, H = A.H, FEET = A.FEET, kam = A.kam, rnd = Math.random;
    const cfg = A.settings || {};
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const lerp = (a, b, p) => a + (b - a) * p;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ez = (p) => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const st = { dt: 1 / 60 };
    let cur = null, queue = [], walkEvent = null, plan = [], planDay = '';

    /* ---------- Kamiel and friends ---------- */
    const KO = () => A.kamObj();
    const kp = (fx, fy) => A.llamaPoint(KO(), fx, fy);
    const kface = () => kam.face || A.dir();
    const kx = () => W / 2 + kam.x;   // Kamiel's middle on screen
    const kfeet = () => kam.feet !== null ? kam.feet : FEET - kam.y;
    function actor(o) {
      const a = Object.assign({ cx: 0, feet: FEET, s: 1, face: -1, pose: 'stand', wt: 0, rate: 6, r: 0, sq: 1, sx: 1, head: 0, eyes: '', eyeT: 0,
        mouth: 0, outfit: [], tint: '', alpha: 1, dissolve: 0, layer: 'back', blinkT: 2 + rnd() * 3 }, o);
      cur.actors.push(a); return a;
    }
    const vis = (hh) => hh.x + hh.w > 40 && hh.x < W - 40;
    const hitsOf = (layer, f) => A.hits().filter(hh => hh.layer === layer && vis(hh) && (!f || f(hh)));
    const groundHits = () => hitsOf(2, hh => !hh.it.tv && !hh.it.board && !hh.it.timer && Math.abs(hh.x + hh.w / 2 - W / 2) < 400);
    const photoHits = () => hitsOf(2, hh => hh.it.o.kind === 'kader' && !hh.it.tv && hh.it.photo);
    const skyThings = () => hitsOf(0).map(hh => ({ x: hh.x + hh.w / 2, y: hh.y + hh.h / 2 }))
      .concat(A.clouds().filter(c => c.sx !== undefined && c.sx + c.sw > 60 && c.sx < W - 60).map(c => ({ x: c.sx + c.sw / 2, y: c.sy + c.sh / 2 })))
      .concat(A.sky() ? [A.sky()] : []);

    /* ---------- effects ---------- */
    let clock = 0;
    const rfx = [];   // effects of the residents, when no event is running
    function fx(layer, dur, draw) { const f = cur ? { layer, dur, born: cur.t, draw } : { layer, dur, born: clock, draw, own: true }; (cur ? cur.fx : rfx).push(f); return f; }
    const stop = (f) => { if (!f) return; if (cur) cur.fx = cur.fx.filter(x => x !== f); const k = rfx.indexOf(f); if (k >= 0) rfx.splice(k, 1); };
    const headOf = (who) => who ? (who.pet ? (p => ({ x: p.x, y: p.y - 4 }))(A.petPoint(who, 'head')) : A.llamaPoint(who, 200, -30)) : kp(200, -30);
    const uOf = (who) => who && who.pet ? 3.6 : clamp(5.5 * (who ? who.s : kam.s), 3.5, 9);
    function emote(kind, dur, who) {
      return fx('screen', dur || 2, (g, age) => {
        const p = headOf(who), u = uOf(who), pop = Math.min(1, age * 6), y = p.y - 8 - 12 * pop;
        if (kind === 'zzz') {
          g.save(); g.fillStyle = '#fff'; g.strokeStyle = '#14102a'; g.lineWidth = 3;
          for (let k = 0; k < 3; k++) { const a = (age * .6 + k / 3) % 1, fs = Math.round((14 + 10 * a) * u / 4);
            g.font = fs + 'px VT323, monospace'; g.globalAlpha = 1 - a; g.strokeText('Z', p.x + 20 * a * u / 4 + k * 4, y - 50 * a * u / 4); g.fillText('Z', p.x + 20 * a * u / 4 + k * 4, y - 50 * a * u / 4); }
          g.restore(); return;
        }
        if (kind === 'stars') { for (let k = 0; k < 5; k++) { const a = age * 4 + k * 1.2566; sprC(g, SP.star, p.x + Math.cos(a) * 34 * u / 4, p.y + 26 + Math.sin(a) * 9 * u / 4, u * .7); } return; }
        if (kind === 'dots') { const n = Math.min(3, Math.floor(age * 2.5) + 1); g.fillStyle = '#fff'; for (let k = 0; k < n; k++) g.fillRect(p.x - 3 * u + k * 3 * u, y, u * 1.6, u * 1.6); return; }
        if (kind === 'sweat') { for (let k = 0; k < 3; k++) { const a = (age * 1.3 + k / 3) % 1; sprC(g, SP.drop, p.x + (k - 1) * 22 * u / 4 + (k - 1) * 30 * a, p.y + 20 - 26 * Math.sin(a * Math.PI) + 30 * a, u * .7); } return; }
        if (kind === 'notes' || kind === 'hearts' || kind === 'sparks' || kind === 'snow') {
          const s = SP[{ notes: 'note', hearts: 'heart', sparks: 'spark', snow: 'snow' }[kind]];
          for (let k = 0; k < 3; k++) { const a = (age * .7 + k / 3) % 1; g.globalAlpha = 1 - a * a;
            sprC(g, s, p.x + (k - 1) * 30 + Math.sin(age * 3 + k) * 10, p.y - 60 * a * u / 4, u * .8); }
          g.globalAlpha = 1; return;
        }
        if (kind === 'tears') { const e = who ? A.llamaPoint(who, 225, 300) : kp(225, 300);
          for (let k = 0; k < 2; k++) { const a = (age * 1.4 + k / 2) % 1; sprC(g, SP.drop, e.x + (k ? 6 : -4), e.y + 70 * a * u / 4, u * .55); } return; }
        if (kind === 'sniff') { const n = kp(10, 340), f = kface(); g.fillStyle = 'rgba(255,255,255,.85)';
          for (let k = 0; k < 3; k++) { const a = (age * 3 + k / 3) % 1; g.fillRect(n.x + f * (10 + 30 * a), n.y - 12 + k * 10, 10 * (1 - a) + 3, 3); } return; }
        if (kind === 'stink') { const b = kp(770, 650); g.strokeStyle = 'rgba(150,210,70,.9)'; g.lineWidth = 3;
          for (let k = 0; k < 3; k++) { g.beginPath(); for (let j = 0; j < 8; j++) { const y = b.y - j * 6 - age * 20, x = b.x + (k - 1) * 12 + Math.sin(j * 1.3 + age * 6 + k) * 4; j ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } return; }
        if (kind === '!?') { sprC(g, SP['!'], p.x - 4 * u, y, u); sprC(g, SP['?'], p.x + 5 * u, y, u); return; }
        if (SP[kind]) sprC(g, SP[kind], p.x, y, u);
      });
    }
    // particles: a simple list that moves and fades by itself
    function particles(layer, opts) {
      const ps = [];
      const f = fx(layer, opts.dur || 0, (g) => {
        const dt = st.dt;
        if (opts.emit && (!opts.until || cur.t < opts.until)) opts.emit(ps, dt);
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i]; p.age += dt;
          if (p.age > p.life) { ps.splice(i, 1); continue; }
          p.vy += (p.grav || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          opts.draw(g, p, p.age / p.life);
        }
      });
      f.ps = ps; return f;
    }
    const P = (o) => Object.assign({ x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, grav: 0 }, o);

    /* ---------- building blocks (generators: one step per frame) ---------- */
    function* wait(s) { let a = 0; while (a < s) { a += st.dt; yield; } }
    function* tween(s, fn) { let a = 0; for (;;) { a += st.dt; const p = Math.min(1, a / s); fn(p); if (p >= 1) return; yield; } }
    function* until(cond, max) { let a = 0; while (!cond() && a < (max || 60)) { a += st.dt; yield; } }
    function* walkTo(x, speed, rate) {
      speed = speed || 70; const d = x > kam.x ? 1 : -1;
      kam.face = d; kam.pose = 'walk'; kam.rate = rate || 6 * Math.max(.6, speed / 70);
      while ((x - kam.x) * d > 0) { kam.x = d > 0 ? Math.min(x, kam.x + speed * st.dt) : Math.max(x, kam.x - speed * st.dt); yield; }
      kam.pose = '';
    }
    function* actorTo(a, x, speed) {
      const d = x > a.cx ? 1 : -1; a.face = d; a.pose = 'walk'; a.rate = 6 * Math.max(.6, speed / 70);
      while ((x - a.cx) * d > 0) { a.cx = d > 0 ? Math.min(x, a.cx + speed * st.dt) : Math.max(x, a.cx - speed * st.dt); yield; }
      a.pose = 'stand';
    }
    // to the next scene, the camera following along
    function* travel(d, speed, o) {
      o = o || {};
      const target = A.center(d);
      kam.face = o.face || d; kam.pose = o.pose === undefined ? 'walk' : o.pose; kam.rate = o.rate || 6 * Math.max(.6, speed / 70);
      for (;;) {
        const c = A.cam(), nx = c + d * speed * st.dt;
        if ((nx - target) * d >= 0) { A.setCam(target); break; }
        A.setCam(nx); if (o.each) o.each(); yield;
      }
      kam.pose = ''; A.arrive();
    }
    function* par() { let live = Array.prototype.slice.call(arguments); while (live.length) { live = live.filter(g => !g.next().done); if (live.length) yield; } }
    function* hop(height, secs) { yield* tween(.12, p => { kam.sq = 1 - .12 * p; }); yield* tween(secs || .5, p => { kam.sq = 1; kam.y = Math.sin(p * Math.PI) * height; }); kam.y = 0; yield* tween(.12, p => { kam.sq = .9 + .1 * p; }); kam.sq = 1; }
    function* shiver(secs, amp) { const x0 = kam.x; yield* tween(secs, () => { kam.x = x0 + (rnd() - .5) * (amp || 3); }); kam.x = x0; }
    // walk toward the camera until a point of his frame sits at (W/2, ty)
    function* approach(sTo, fx_, fy, ty, secs) {
      const f = kface(), x0 = kam.x, s0 = kam.s, f0 = kfeet(), w = 128.3 * sTo, h = 225 * sTo;
      const xTo = -(-w / 2 + fx_ / 780 * w) * (f > 0 ? -1 : 1), feetTo = ty + h - fy / 1370 * h;
      kam.pose = 'walk'; kam.rate = 4;
      yield* tween(secs, p => { const e = ez(p); kam.s = lerp(s0, sTo, e); kam.x = lerp(x0, xTo, e); kam.feet = lerp(f0, feetTo, e); });
      kam.pose = '';
    }
    function* backOff(secs) {
      const x0 = kam.x, s0 = kam.s, f0 = kfeet(), b0 = kam.blur;
      kam.pose = 'walk'; kam.rate = -4;
      yield* tween(secs, p => { const e = ez(p); kam.s = lerp(s0, 1, e); kam.x = lerp(x0, 0, e); kam.feet = lerp(f0, FEET, e); kam.blur = lerp(b0, 0, e); });
      kam.pose = ''; kam.feet = null; kam.blur = 0;
    }
    // the whole picture moves: zoom, tilt, shake
    function view(v) {
      cur.post = (g, pc) => {
        g.save(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.translate(W / 2 + (v.dx || 0), H / 2 + (v.dy || 0)); g.rotate(v.rot || 0); g.scale(v.z || 1, v.z || 1);
        g.translate(-(v.cx === undefined ? W / 2 : v.cx), -(v.cy === undefined ? H / 2 : v.cy));
        g.drawImage(pc, 0, 0); g.restore();
        if (v.glitch) glitch(g, pc, v.glitch);
      };
      return v;
    }
    function glitch(g, pc, amount) {
      for (let k = 0; k < 3 + amount * 10; k++) {
        const y = Math.floor(rnd() * H), hh = 3 + Math.floor(rnd() * 26 * amount), dx = (rnd() - .5) * 90 * amount;
        g.drawImage(pc, 0, y, W, hh, dx, y, W, hh);
      }
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .25 * amount; g.drawImage(pc, 6 * amount, 0); g.restore();
    }
    const shake = (v, amp) => { v.dx = (rnd() - .5) * 2 * amp; v.dy = (rnd() - .5) * 2 * amp; };
    function withOutfit(add) {   // try something on for the event; his own clothes come back afterwards
      const O = KamielOutfits.OUTFITS, slots = add.map(id => (O.find(o => o.id === id) || {}).slot);
      kam.outfit = A.outfit().filter(id => !slots.includes((O.find(o => o.id === id) || {}).slot)).concat(add);
    }
    const sideOfRoom = () => kam.x > 0 ? -1 : kam.x < 0 ? 1 : (rnd() < .5 ? -1 : 1);

    /* ---------- the housemates ---------- */
    const PET = { wifi: { s: 1, run: 95 }, snoet: { s: .85, run: 150 }, pippa: { s: 1, run: 60 }, pebbels: { s: 1.03, run: 45 }, dobby: { s: .95, run: 60 } };
    const DOGS = ['wifi', 'snoet'], CATS2 = ['pippa', 'pebbels'];
    function pet(name, side) {
      return actor({ pet: name, s: PET[name].s, cx: W / 2 + side * (W / 2 + 70), feet: FEET, face: -side, rate: 9, lift: 0 });
    }
    const hold = (a, pose) => { a.lockPose = !!pose; a.pose = pose || 'stand'; };
    function* petTo(a, x, speed) { yield* actorTo(a, x, speed); a.rate = 9; }
    function* petJump(a, height, secs, toX) {
      const x0 = a.cx; hold(a, 'jump');
      yield* tween(secs || .5, p => { a.lift = Math.sin(p * Math.PI) * height; if (toX !== undefined) a.cx = lerp(x0, toX, p); });
      a.lift = 0; hold(a, null);
    }
    function* petLeave(a, side, speed) {
      if (a.stay) { a.stay = false; yield* settle(a); return; }   // it stays a while: see the residents
      yield* petTo(a, W / 2 + side * (W / 2 + 90), speed); a.alpha = 0;
    }
    const back = (fx) => kp(fx, 470);   // a spot on Kamiel's back
    function ballFx(ball) {
      return fx('front', 0, (g) => { if (!ball.on) return; const x = ball.x, y = ball.y; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, FEET + 2, 6, 2, 0, 0, 7); g.fill();
        g.fillStyle = '#e2343a'; g.fillRect(x - 5, y - 10, 10, 10); g.fillStyle = '#ff8a8a'; g.fillRect(x - 3, y - 8, 3, 3); g.fillStyle = '#ffd23f'; g.fillRect(x - 5, y - 6, 10, 2); });
    }

    // Wifi: playful, and keeps insisting until Kamiel plays along
    function* wifi(a, side) {
      const ball = { on: true, x: 0, y: 0 }; let held = true;
      const f = fx('front', 0, () => { if (held) { const n = A.petPoint(a, 'nose'); ball.x = n.x; ball.y = n.y + 6; } });
      ballFx(ball);
      yield* petTo(a, kx() + side * 120, PET.wifi.run); a.face = -side; kam.face = side;
      held = false; ball.y = FEET - 1;
      for (let k = 0; k < 3; k++) { hold(a, 'down'); yield* wait(.45); hold(a, null); yield* petJump(a, 14, .3); emote('burst', .5, a); yield* wait(.3); }
      kam.face = -side; emote('dots', 2.2); yield* wait(2.2);
      // insisting: pushes the ball closer and bounces around him
      held = true; yield* petTo(a, kx() + side * 70, 70); a.face = -side; held = false; ball.y = FEET - 1;
      a.layer = 'front';
      yield* petJump(a, 30, .5, kx() - side * 70); a.face = side; emote('burst', .5, a);
      yield* petJump(a, 30, .5, kx() + side * 70); a.face = -side; emote('burst', .5, a);
      a.layer = 'back';
      kam.face = side; kam.eyes = 'blij'; kam.head = .15; yield* wait(.4); kam.head = 0;
      // Kamiel gives the ball a push; off she goes
      const bx0 = ball.x, bx1 = ball.x + side * 700;
      yield* par((function* () { yield* tween(1.4, p => { ball.x = lerp(bx0, bx1, p); ball.y = FEET - 1 - Math.abs(Math.sin(p * 9)) * 40 * (1 - p); }); })(),
                 (function* () { yield* wait(.2); yield* petTo(a, W / 2 + side * (W / 2 + 80), PET.wifi.run * 1.8); })());
      ball.on = false; yield* wait(1.5);
      ball.on = true; held = true; yield* petTo(a, kx() + side * 90, PET.wifi.run * 1.4); a.face = -side; held = false; ball.y = FEET - 1;
      emote('heart', 2, a); emote('hearts', 2.5);
      for (let k = 0; k < 2; k++) yield* petJump(a, 22, .35);
      held = true; yield* wait(.6); kam.eyes = '';
      yield* petLeave(a, side, PET.wifi.run); stop(f); ball.on = false;
    }
    // Snoet: a small tornado. Over and on everything and everyone, licks and cuddles.
    function* snoet(a, side) {
      a.rate = 16;
      for (let k = 0; k < 2; k++) { a.layer = k ? 'back' : 'front'; yield* petTo(a, kx() - side * 160, PET.snoet.run); yield* petTo(a, kx() + side * 160, PET.snoet.run); }
      kam.face = side; kam.eyes = 'groot'; emote('!', 1.2);
      // up onto Kamiel's back, along to his head, and lick
      a.layer = 'front'; const b0 = back(side > 0 ? 740 : 300);
      yield* petJump(a, 0, .01); hold(a, 'jump');
      yield* tween(.5, p => { a.cx = lerp(a.cx, b0.x, p); a.feet = lerp(FEET, b0.y, p) - Math.sin(p * Math.PI) * 40; });
      hold(a, null); a.face = -kface();
      yield* tween(1.2, p => { const bb = back(lerp(700, 330, p)); a.cx = bb.x; a.feet = bb.y; a.pose = 'walk'; a.wt += st.dt * 14; });
      a.pose = 'stand'; kam.eyes = 'dicht'; kam.blush = true; emote('hearts', 3, a);
      yield* tween(2.5, p => { a.sx = 1 + Math.sin(p * 40) * .05; }); a.sx = 1;
      // and off again, onto something on the ground if there's something
      const gh = groundHits().filter(h => h.w < 200);
      const t = gh.length ? pick(gh) : null;
      hold(a, 'jump'); const x0 = a.cx, y0 = a.feet, tx = t ? t.x + t.w / 2 : kx() - side * 200, ty = t ? t.y + t.h * .12 : FEET;
      yield* tween(.6, p => { a.cx = lerp(x0, tx, p); a.feet = lerp(y0, ty, p) - Math.sin(p * Math.PI) * 50; }); hold(a, null);
      kam.eyes = 'blij'; kam.blush = false;
      for (let k = 0; k < 4; k++) { a.face = -a.face; yield* wait(.25); }
      if (t) { hold(a, 'jump'); const x1 = a.cx, y1 = a.feet; yield* tween(.45, p => { a.cx = x1 + side * 40 * p; a.feet = lerp(y1, FEET, p) - Math.sin(p * Math.PI) * 30; }); hold(a, null); }
      // cuddles against his leg
      yield* petTo(a, kx() + side * 50, PET.snoet.run); a.face = -side; a.layer = 'front';
      emote('hearts', 2.5, a); kam.eyes = 'blij'; emote('heart', 2);
      yield* tween(2.2, p => { a.sx = 1 + Math.sin(p * 30) * .04; }); a.sx = 1;
      kam.eyes = ''; yield* petLeave(a, side, PET.snoet.run);
    }
    // Pippa: very sure of herself; sometimes ready to fight, sometimes suddenly scared
    function* pippa(a, side) {
      a.rate = 6;
      yield* petTo(a, kx() + side * 140, PET.pippa.run); a.face = -side; a.layer = 'front';
      hold(a, 'down'); yield* wait(2.5); hold(a, 'blink'); yield* wait(.5); hold(a, 'down'); yield* wait(1.5); hold(a, null);
      const mood = pick(['boos', 'bang', 'baas']);
      if (mood === 'boos') {
        kam.face = side; yield* walkTo(side * 45, 35); kam.face = side;
        yield* petJump(a, 8, .2); a.sq = 1.12; a.sx = .92; emote('angry', 2, a); emote('burst', .6, a);
        kam.eyes = 'groot'; emote('sweat', 2.5); yield* walkTo(-side * 60, 120); kam.face = side; yield* wait(1.2);
        a.sq = 1; a.sx = 1; yield* wait(1); emote('dots', 1.5, a);
        yield* petLeave(a, side, PET.pippa.run); kam.eyes = ''; yield* walkTo(0, 50);
      } else if (mood === 'bang') {
        const bx = W / 2 + (rnd() - .5) * 500;
        fx('screen', .5, (g, age) => { sprC(g, SP.burst, bx, FEET - 60, 4 + age * 6); });
        a.sx = 1.18; a.sq = 1.08; a.eyes = 'groot';
        yield* petJump(a, 70, .55); kam.eyes = 'groot'; emote('!?', 1.6);
        a.layer = 'back'; a.rate = 18; yield* petTo(a, W / 2 + side * (W / 2 + 60), 260);
        yield* wait(1.5); a.sx = 1; a.sq = 1; a.eyes = '';
        yield* petTo(a, W / 2 + side * (W / 2 - 40), 30); a.face = -side; yield* wait(2.5); kam.eyes = ''; emote('?', 1.5);
        yield* petLeave(a, side, 40);
      } else {   // she's the boss: lies down right in front of him and stays
        yield* petTo(a, kx() + side * 20, 40); a.face = -side; hold(a, 'down');
        kam.eyes = 'triest'; yield* wait(3); kam.face = -side; yield* wait(1.5); kam.face = side; emote('dots', 2.5); yield* wait(4);
        hold(a, 'blink'); yield* wait(.6); hold(a, 'down'); yield* wait(2); hold(a, null); kam.eyes = '';
        yield* petLeave(a, -side, PET.pippa.run);
      }
    }
    // Pebbels: calmer, curious and on her own; sometimes startled by random things
    function* pebbels(a, side) {
      a.rate = 5;
      const gh = groundHits(), t = gh.length ? gh.sort((p, q) => Math.abs(p.x - W / 2) - Math.abs(q.x - W / 2))[0] : null;
      const tx = t ? t.x + t.w / 2 + (t.x + t.w / 2 > W / 2 ? -1 : 1) * (t.w / 2 + 30) : kx() + side * 170;
      yield* petTo(a, tx, PET.pebbels.run); if (t) a.face = t.x + t.w / 2 > a.cx ? 1 : -1;
      hold(a, 'down'); emote('?', 2, a); yield* wait(2.5); hold(a, null); yield* wait(.8);
      // something startles her
      const lx = a.cx + a.face * 90; let leafY = 120, leafOn = true;
      const leaf = fx('front', 0, (g) => { if (!leafOn) return; g.fillStyle = '#d98a2b'; g.fillRect(lx + Math.sin(cur.t * 3) * 16 - 4, leafY, 8, 5); g.fillStyle = '#9a5a1a'; g.fillRect(lx + Math.sin(cur.t * 3) * 16 - 1, leafY + 1, 2, 3); });
      yield* tween(3, p => { leafY = lerp(120, FEET - 6, p); });
      a.eyes = 'groot'; a.sx = 1.12; yield* petJump(a, 45, .45, a.cx - a.face * 60); hold(a, 'down'); yield* wait(2); a.sx = 1; a.eyes = '';
      // ... then, carefully, a closer look
      hold(a, null); yield* petTo(a, lx - a.face * 30, 16); hold(a, 'down'); emote('?', 1.5, a); yield* wait(2); hold(a, null);
      leafOn = false; stop(leaf); emote('heart', 1.5, a); yield* wait(1);
      if (rnd() < .5) { hold(a, 'down'); emote('zzz', 6, a); yield* wait(6); hold(a, null); }
      yield* petLeave(a, a.cx > W / 2 ? 1 : -1, PET.pebbels.run);
    }
    // Dobby: a quiet rabbit; nibbles, freezes, thumps, and does a happy jump now and then
    function* dobby(a, side) {
      a.rate = 7;
      yield* petTo(a, kx() + side * 150, PET.dobby.run); a.face = -side;
      const nib = particles('front', { until: cur.t + 5, emit: (ps) => { if (rnd() < .15) { const n = A.petPoint(a, 'nose'); ps.push(P({ x: n.x, y: FEET - 2, vx: (rnd() - .5) * 30, vy: -30, grav: 120, life: .6 })); } },
        draw: (g, p, k) => { g.fillStyle = `rgba(90,170,60,${1 - k})`; g.fillRect(p.x, p.y, 3, 2); } });
      hold(a, 'down'); yield* tween(5, p => { a.sq = 1 + Math.sin(p * 60) * .02; }); a.sq = 1; hold(a, null); stop(nib);
      const what = pick(['binky', 'stamp', 'flop']);
      if (what === 'binky') {   // the happy jump with a twist
        kam.face = side; for (let k = 0; k < 2; k++) { hold(a, 'jump'); yield* tween(.6, p => { a.lift = Math.sin(p * Math.PI) * 55; a.r = Math.sin(p * Math.PI * 2) * .4; if (p > .5) a.face = side; }); a.lift = 0; a.r = 0; hold(a, null); a.face = -side; yield* wait(.5); }
        emote('hearts', 2, a); kam.eyes = 'blij'; yield* wait(2);
      } else if (what === 'stamp') {   // freezes, then thumps the ground
        a.eyes = 'groot'; yield* wait(2.5);
        const v = view({}); for (let k = 0; k < 2; k++) { a.sq = .9; yield* tween(.2, () => shake(v, 4)); a.sq = 1; yield* wait(.3); } cur.post = null;
        kam.eyes = 'groot'; emote('!', 1.5); yield* wait(2); a.eyes = ''; kam.eyes = '';
      } else {   // flops over for a nap
        hold(a, 'down'); a.r = side * .2; emote('zzz', 7, a); yield* wait(7); a.r = 0; hold(a, null);
      }
      kam.eyes = ''; yield* petLeave(a, side, PET.dobby.run);
    }
    // a second housemate comes along now and then
    function* buddy(b, lead, side) {
      yield* wait(2 + rnd() * 3);
      yield* petTo(b, (lead.cx + W / 2) / 2 - side * 120, PET[b.pet].run);
      b.face = lead.cx > b.cx ? 1 : -1;
      if (CATS2.includes(b.pet) && DOGS.includes(lead.pet) && rnd() < .7) {   // a cat and a dog: not always friends
        b.sq = 1.1; emote('angry', 2, b); yield* wait(1.5); b.sq = 1;
        yield* petTo(b, W / 2 - side * (W / 2 + 90), PET[b.pet].run * 2.5);
      } else if (DOGS.includes(b.pet) && DOGS.includes(lead.pet)) {   // two dogs: a chase
        for (let k = 0; k < 2; k++) { yield* petTo(b, W / 2 + (k % 2 ? -1 : 1) * 260, PET[b.pet].run * 1.5); }
        emote('hearts', 1.5, b); yield* petTo(b, W / 2 - side * (W / 2 + 90), PET[b.pet].run);
      } else {   // a sniff and a hello
        hold(b, 'down'); emote('heart', 1.5, b); yield* wait(2); hold(b, null); yield* wait(2 + rnd() * 4);
        yield* petTo(b, W / 2 - side * (W / 2 + 90), PET[b.pet].run);
      }
      b.alpha = 0;
    }
    function* petVisit(name) {
      const r0 = isRes(name);
      if (r0 && onScreen(r0) && !r0.busy) { yield* greetRun(r0); return; }   // it was lying here already
      if (r0 && !r0.busy) { r0.gone = true; residents.splice(residents.indexOf(r0), 1); }   // it got up somewhere else and comes over
      const side = rnd() < .5 ? -1 : 1, a = pet(name, side);
      a.stay = residents.length < MAXRES && rnd() * 100 < (cfg.pets_stay === undefined ? 35 : +cfg.pets_stay);
      const runs = { wifi, snoet, pippa, pebbels, dobby };
      const others = PETS.filter(p => p !== name && !(cfg.off || []).includes(p));
      const together = rnd() * 100 < (cfg.pets_together === undefined ? 25 : +cfg.pets_together) && others.length;
      kam.face = side;
      if (together) { const b = pet(pick(others), -side); yield* par(runs[name](a, side), buddy(b, a, -side)); }
      else yield* runs[name](a, side);
      kam.eyes = ''; kam.blush = false;
    }


    /* ---------- housemates that stay a while ----------
       A resident belongs to a spot in the world (wx), not to an event: it keeps lying there when Kamiel walks on,
       it is sometimes already there when he arrives, it looks at him and comes to say hello.
       Each one runs its own little life (a generator), with moves that suit that animal. */
    const residents = [];
    const MAXRES = 3;
    const wrapD = (d) => { const P = A.PW; return ((d + P / 2) % P + P) % P - P / 2; };
    const scrX = (wx) => W / 2 + wrapD(wx - A.cam());
    const worldX = (sx) => A.cam() + sx - W / 2;
    const onScreen = (a) => a.cx > -50 && a.cx < W + 50;
    const isRes = (name) => residents.find(r => r.pet === name);
    const depthS = (feet) => 1 + (feet - FEET) / 320;
    const LIE = (a) => a.pet === 'dobby' ? 'lie' : 'lie';
    const SIT = (a) => a.pet === 'dobby' ? 'up' : 'sit';
    const DOGLIKE = (a) => DOGS.includes(a.pet);
    const NAMES = { wifi: 'Wifi', snoet: 'Snoet', pippa: 'Pippa', pebbels: 'Pebbels', dobby: 'Dobby' };
    const lg = (text) => { if (A.log) A.log('dier', text); };
    const toward = (a, sx) => { a.face = sx > a.cx ? 1 : -1; };
    const noseDown = (a, amt) => amt * (a.face > 0 ? 1 : -1);
    function resetPose(a) { a.r = 0; a.sq = 1; a.sx = 1; a.lift = 0; a.eyes = ''; }
    function makeResident(name, wx, feet, o) {
      const a = Object.assign({ pet: name, s: PET[name].s * depthS(feet), wx, cx: scrX(wx), feet, face: rnd() < .5 ? -1 : 1, pose: 'lie', lockPose: true,
        wt: 0, rate: 9, r: 0, sq: 1, sx: 1, lift: 0, alpha: 1, eyes: '', home: wx, place: A.placeAt(wx),
        until: Date.now() + Math.max(5, +(cfg.pets_stay_min || 45)) * 60000 * (.7 + rnd() * .6) }, o || {});
      if (name === 'wifi') a.ball = { wx: wx + (a.face > 0 ? 1 : -1) * 42, h: 0, vx: 0, vh: 0, moving: false, held: false };   // her ball lies in front of her
      a.brain = life(a);
      residents.push(a); return a;
    }
    /* Wifi's ball: swipe it on the tablet and she goes after it */
    function ballStep(a, dt) {
      const b = a.ball; if (!b) return;
      if (b.held) { const n = A.petPoint(a, 'nose'); b.wx = worldX(n.x); b.h = Math.max(0, a.feet - n.y - 4); return; }
      if (!b.moving) return;
      b.vh -= 900 * dt; b.h += b.vh * dt; b.wx += b.vx * dt;
      const [l, r] = area(a);
      if (b.wx < l - 120 || b.wx > r + 120) { b.wx = clamp(b.wx, l - 120, r + 120); b.vx = -b.vx * .5; }
      if (b.h <= 0) { b.h = 0; if (Math.abs(b.vh) > 80) { b.vh = -b.vh * .45; b.vx *= .75; } else { b.vh = 0; b.vx *= Math.pow(.15, dt); } }
      if (b.h === 0 && b.vh === 0 && Math.abs(b.vx) < 6) { b.vx = 0; b.moving = false; }
    }
    function drawBall(g, a) {
      const b = a.ball; if (!b || a.alpha <= 0) return;
      const x = scrX(b.wx), y = a.feet - 1 - b.h; if (x < -30 || x > W + 30) return;
      const k = Math.max(.3, 1 - b.h / 200);
      g.fillStyle = `rgba(0,0,0,${.2 * k})`; g.beginPath(); g.ellipse(x, a.feet + 1, 7 * k, 2.2 * k, 0, 0, 7); g.fill();
      g.fillStyle = '#e2343a'; g.fillRect(x - 6, y - 12, 12, 12); g.fillStyle = '#ff8a8a'; g.fillRect(x - 4, y - 10, 3, 3); g.fillStyle = '#ffd23f'; g.fillRect(x - 6, y - 7, 12, 2);
    }
    function throwBall(p0, p1, secs) {
      for (const a of residents) {
        const b = a.ball; if (!b || b.held || a.busy || !onScreen(a)) continue;
        const bx = scrX(b.wx), by = a.feet - 7 - b.h;
        if (Math.hypot(p0.x - bx, p0.y - by) > 48) continue;
        const dt = Math.max(.06, secs), dx = p1.x - p0.x, dy = p1.y - p0.y;
        if (Math.hypot(dx, dy) < 12) { b.vx = (rnd() < .5 ? -1 : 1) * (160 + rnd() * 120); b.vh = 280; }   // a tap: a little toss
        else { b.vx = clamp(dx / dt, -950, 950); b.vh = clamp(-dy / dt, 120, 750); }
        b.moving = true;
        a.brain = fetchBall(a);
        return true;
      }
      return false;
    }
    function* fetchBall(a, inner) {
      resetPose(a); const b = a.ball;
      if (a.pose === 'sleep' || a.pose === 'lie') { a.eyes = 'groot'; emote('!', 1, a); hold(a, 'stand'); yield* wait(.35); a.eyes = ''; }
      if (Math.abs(b.vx) > 500 && onScreen(a)) emote('burst', .6, a);
      // chase it, as long as it moves
      for (let t = 0; t < 20; t++) {
        let n = 0;
        while ((b.moving || Math.abs(wrapD(b.wx - a.wx)) > 16) && n < 600) {
          const d = wrapD(b.wx - a.wx), sp = PET.wifi.run * 1.6;
          a.face = d > 0 ? 1 : -1; a.pose = 'walk'; a.lockPose = true; a.rate = 14;
          a.wx += Math.sign(d) * Math.min(Math.abs(d) - 14 > 0 ? Math.abs(d) - 14 : 0, sp * st.dt);
          if (b.h > 25 && Math.abs(d) < 40 && a.lift === 0 && rnd() < .05) yield* rJump(a, 30, .35);   // jumps for it in the air
          n++; yield;
          if (!b.moving && Math.abs(d) <= 16) break;
        }
        if (!b.moving) break;
      }
      hold(a, 'down'); yield* wait(.35); b.held = true; hold(a, null);
      if (onScreen(a)) emote('heart', 1.4, a);
      // proud trot back to her spot, and the ball goes down in front of her again
      yield* rTo(a, clampArea(a, a.home), PET.wifi.run * .9);
      a.face = rnd() < .5 ? -1 : 1; hold(a, 'sit'); yield* wait(.6);
      b.held = false; b.h = 0; b.wx = a.wx + (a.face > 0 ? 1 : -1) * 42;
      emote('hearts', 1.6, a); yield* wait(2.5);
      yield* lieDown(a);
      if (!inner) yield* life(a);
    }
    // walking and jumping for residents happen in world coordinates, so they stay put when the camera moves
    function* rTo(a, wx, speed) {
      const d = wrapD(wx - a.wx) > 0 ? 1 : -1; a.face = d; hold(a, 'walk'); a.rate = 6 * Math.max(.7, speed / 60);
      let left = Math.abs(wrapD(wx - a.wx));
      while (left > 0) { const step = Math.min(left, speed * st.dt); a.wx += d * step; left -= step; yield; }
      hold(a, null); a.rate = 9;
    }
    function* rJump(a, height, secs, dwx) {
      const x0 = a.wx; hold(a, 'jump');
      yield* tween(secs || .45, p => { a.lift = Math.sin(p * Math.PI) * height; if (dwx) a.wx = x0 + dwx * p; });
      a.lift = 0; hold(a, null);
    }
    const area = (a) => { const c0 = A.placeCenter(a.place), c = a.wx - wrapD(a.wx - c0); return [c - A.PLACE / 2 + 70, c + A.PLACE / 2 - 70]; };
    const clampArea = (a, wx) => { const [l, r] = area(a); return clamp(wx, l, r); };
    function* lieDown(a) {
      if (DOGLIKE(a)) {   // dogs turn around once or twice before they lie down
        for (let k = 0; k < 2 + Math.floor(rnd() * 2); k++) { a.face = -a.face; yield* rJump(a, 4, .22); }
      } else if (a.pet !== 'dobby') { hold(a, 'down'); yield* wait(.6); }
      hold(a, LIE(a));
    }
    function* getUp(a) {
      if (a.pose === 'sleep') { hold(a, LIE(a)); yield* wait(.5); }
      hold(a, 'stand');
      if (a.pet !== 'dobby') {   // a good stretch: front down, bottom up
        hold(a, 'down'); yield* tween(.5, p => { a.r = noseDown(a, .16 * p); }); yield* wait(.8);
        yield* tween(.4, p => { a.r = noseDown(a, .16 * (1 - p)); }); a.r = 0;
      }
      hold(a, null);
    }

    /* the common things everyone does */
    function* doze(a) {
      hold(a, 'sleep'); const n = 12 + rnd() * 25, z = onScreen(a) ? emote('zzz', n, a) : null;
      yield* tween(n, p => { a.sq = 1 + Math.sin(p * n * 1.6) * .025; });
      a.sq = 1; stop(z);
    }
    function* rest(a) {
      hold(a, LIE(a));
      for (let k = 0, n = 3 + Math.floor(rnd() * 4); k < n; k++) {
        yield* wait(2 + rnd() * 4);
        if (rnd() < .4) a.face = -a.face;
        else { hold(a, 'sleep'); yield* wait(.15); hold(a, LIE(a)); }   // a slow blink
      }
    }
    function* sitUp(a) {
      if (a.pose === 'sleep' || a.pose === 'lie') { hold(a, LIE(a)); yield* wait(.4); }
      hold(a, SIT(a)); toward(a, kx());
      if (rnd() < .4 && onScreen(a)) emote(pick(['?', 'heart', 'dots']), 1.6, a);
      yield* wait(3 + rnd() * 5);
      if (rnd() < .5) { a.face = -a.face; yield* wait(1.5 + rnd() * 2); }
    }
    function* shift(a) {
      yield* getUp(a);
      const to = clampArea(a, a.wx + (rnd() < .5 ? -1 : 1) * (40 + rnd() * 110));
      yield* rTo(a, to, PET[a.pet].run * .45);
      yield* lieDown(a);
    }

    /* what makes each of them themselves */
    function* wifiDig(a) {
      yield* getUp(a); hold(a, 'down');
      const dirt = rParts((ps) => { if (rnd() < .5) ps.push(P({ x: a.cx + (a.face > 0 ? -16 : 16), y: a.feet - 3, vx: (a.face > 0 ? -1 : 1) * (40 + rnd() * 60), vy: -60 - rnd() * 60, grav: 300, life: .7 })); },
        (g, p, t) => { g.fillStyle = `rgba(110,80,50,${1 - t})`; g.fillRect(p.x, p.y, 4, 4); });
      yield* tween(3.5, p => { a.lift = Math.abs(Math.sin(p * 40)) * 2; });
      stop(dirt); a.lift = 0; if (onScreen(a)) emote('sparks', 1.4, a);
      hold(a, 'sit'); yield* wait(2); yield* lieDown(a);
    }
    function* wifiToy(a) {
      if (a.ball && !a.ball.held) {   // plays with her own ball: a nudge with the nose, and after it
        yield* getUp(a); a.ball.vx = (a.face > 0 ? 1 : -1) * (120 + rnd() * 160); a.ball.vh = 160 + rnd() * 120; a.ball.moving = true;
        return yield* fetchBall(a, true);
      }
      yield* getUp(a);
      const ball = { on: true, x: a.cx, y: a.feet - 1 }; let off = 0;
      const f = ballFx(ball);
      for (let k = 0; k < 3; k++) {
        const t0x = a.wx + (rnd() < .5 ? -1 : 1) * (50 + rnd() * 60), to = clampArea(a, t0x);
        yield* tween(.6, p => { off = wrapD(to - a.wx) * p; ball.x = a.cx + off; ball.y = a.feet - 1 - Math.sin(p * Math.PI) * 30; });
        yield* rTo(a, to - (to > a.wx ? 14 : -14), PET.wifi.run); hold(a, 'down'); yield* wait(.4); hold(a, null);
        ball.x = a.cx + (a.face > 0 ? 14 : -14);
      }
      if (onScreen(a)) emote('heart', 1.4, a);
      yield* lieDown(a); yield* wait(4); stop(f);
    }
    function* wifiBeg(a) {
      if (!onScreen(a)) return yield* rest(a);
      if (a.pose !== 'sit') yield* getUp(a);
      hold(a, 'sit'); toward(a, kx());
      for (let k = 0; k < 3; k++) { yield* wait(.8); yield* rJump(a, 10, .3); hold(a, 'sit'); }
      emote('hearts', 2, a); yield* wait(2.5);
    }
    function* snoetSpin(a) {   // chasing his own tail
      yield* getUp(a);
      for (let k = 0; k < 10; k++) { a.face = -a.face; yield* rJump(a, 6, .16); }
      if (onScreen(a)) emote('stars', 2, a);
      yield* tween(1.6, p => { a.r = Math.sin(p * 18) * .12 * (1 - p); }); a.r = 0;
      yield* lieDown(a);
    }
    function* snoetSneeze(a) {
      const p0 = a.pose; hold(a, p0 === 'sleep' ? 'lie' : p0);
      yield* tween(.5, p => { a.sq = 1 - .06 * p; }); a.sq = 1.08;
      if (onScreen(a)) { let once = true; const sn = rParts((ps) => { if (!once) return; once = false; const n = A.petPoint(a, 'nose');
        for (let k = 0; k < 8; k++) ps.push(P({ x: n.x, y: n.y, vx: (a.face > 0 ? 1 : -1) * (40 + rnd() * 70), vy: (rnd() - .5) * 50, life: .5 })); },
        (g, p, t) => { g.fillStyle = `rgba(255,255,255,${1 - t})`; g.fillRect(p.x, p.y, 3, 3); }); setTimeout(() => stop(sn), 1500); }
      yield* wait(.15); a.sq = 1; yield* wait(1.2);
      if (rnd() < .4) { yield* tween(.4, p => { a.sq = 1 - .06 * p; }); a.sq = 1.08; yield* wait(.15); a.sq = 1; }
      yield* wait(2);
    }
    function* snoetBark(a) {   // something in the sky needs to be told off
      if (a.pose !== 'sit') yield* getUp(a);
      hold(a, 'sit'); a.r = noseDown(a, -.2);
      for (let k = 0; k < 4; k++) { if (onScreen(a)) emote('burst', .4, a); yield* rJump(a, 5, .2); hold(a, 'sit'); yield* wait(.35 + rnd() * .5); }
      a.r = 0; yield* wait(1.5); yield* lieDown(a);
    }
    function* snoetZoom(a) {
      yield* getUp(a);
      const [l, r] = area(a);
      for (let k = 0; k < 3; k++) { yield* rTo(a, k % 2 ? l + 20 : r - 20, PET.snoet.run * 2.2); }
      if (onScreen(a)) emote('sweat', 2, a);
      yield* rTo(a, clampArea(a, a.home), PET.snoet.run); hold(a, 'sit'); yield* wait(1.5); yield* lieDown(a);
    }
    function* pippaGroom(a) {
      if (a.pose !== 'sit') { hold(a, 'sit'); yield* wait(1); }
      for (let k = 0; k < 6; k++) { hold(a, 'paw'); a.r = noseDown(a, .05); yield* wait(.35); a.r = 0; yield* wait(.25); }
      hold(a, 'sit'); yield* wait(1.5);
      if (rnd() < .6) { hold(a, 'down'); yield* tween(.8, p => { a.r = noseDown(a, .1 * Math.sin(p * Math.PI)); }); a.r = 0; hold(a, 'sit'); }   // and the back
      yield* wait(2); hold(a, LIE(a));
    }
    function* pippaKnead(a) {
      hold(a, 'down');
      yield* tween(4 + rnd() * 3, p => { a.lift = (Math.floor(p * 18) % 2) * 1.5; a.sx = 1 + (Math.floor(p * 18) % 2) * .015; });
      a.lift = 0; a.sx = 1; if (onScreen(a)) emote('heart', 1.4, a);
      hold(a, LIE(a)); a.sx = 1.05; a.sq = .96; yield* wait(8 + rnd() * 10); a.sx = 1; a.sq = 1;   // a loaf
    }
    function* pippaStare(a) {   // she looks at Kamiel. For a long time. She does not blink.
      if (!onScreen(a)) return yield* rest(a);
      hold(a, 'sit'); toward(a, kx()); yield* wait(4);
      if (rnd() < .4) emote('angry', 1.4, a);
      yield* wait(3); a.face = -a.face; yield* wait(2); hold(a, LIE(a));
    }
    function* pebbelsHunt(a) {   // a butterfly. He will get it. (He won't.)
      if (!onScreen(a)) return yield* rest(a);
      yield* getUp(a);
      const bf = { x: a.cx + (a.face > 0 ? 1 : -1) * 120, y: a.feet - 60, t: 0, gone: false };
      const f = fx('front', 0, (g) => { bf.t += st.dt; const x = bf.x + Math.sin(bf.t * 2.1) * 30, y = bf.y + Math.sin(bf.t * 3.3) * 14, w = Math.abs(Math.sin(bf.t * 18)) * 6 + 1;
        g.fillStyle = '#ffd23f'; g.fillRect(x - w, y - 4, w, 6); g.fillRect(x + 1, y - 4, w, 6); g.fillStyle = '#2a1408'; g.fillRect(x, y - 4, 1, 7); });
      toward(a, bf.x); hold(a, 'down');
      yield* tween(2.4, p => { a.sx = 1 + Math.sin(p * 30) * .03; });   // the wiggle
      a.sx = 1;
      const dist = worldX(bf.x) - a.wx - (a.face > 0 ? 20 : -20);
      yield* rJump(a, 40, .5, dist * .8);
      yield* tween(1.2, () => { bf.y -= 120 * st.dt; bf.x += 50 * st.dt; });
      hold(a, 'sit'); toward(a, bf.x); if (onScreen(a)) emote('?', 2, a);
      yield* tween(2.5, () => { bf.y -= 80 * st.dt; }); stop(f);
      yield* wait(1); yield* lieDown(a);
    }
    function* pebbelsRoll(a) {
      hold(a, LIE(a));
      yield* tween(3, p => { a.r = Math.sin(p * Math.PI * 4) * .22; }); a.r = 0;
      if (onScreen(a)) emote('heart', 1.5, a); yield* wait(3);
    }
    function* dobbyBinky(a) {   // the happy rabbit jump: up, a twist in the air, down
      if (a.pose !== 'stand') { hold(a, 'stand'); yield* wait(.3); }
      for (let k = 0, n = 1 + Math.floor(rnd() * 3); k < n; k++) {
        const s0 = a.face; hold(a, 'jump');
        yield* tween(.55, p => { a.lift = Math.sin(p * Math.PI) * 38; a.r = Math.sin(p * Math.PI * 2) * .5; a.sx = p > .3 && p < .6 ? -1 : 1; a.wx += (s0 > 0 ? 1 : -1) * 70 * st.dt; });
        a.lift = 0; a.r = 0; a.sx = 1; hold(a, null); yield* wait(.25);
      }
      if (onScreen(a)) emote('sparks', 1.4, a);
      yield* wait(1);
    }
    function* dobbyFlop(a) {   // falls over on his side, very dramatic, and sleeps
      hold(a, 'lie'); yield* wait(1.5);
      const side = rnd() < .5 ? -1 : 1;
      yield* tween(.25, p => { a.r = side * 1.3 * p * p; }); a.r = side * 1.3;
      hold(a, 'sleep'); a.r = side * 1.3; yield* wait(10 + rnd() * 15);
      yield* tween(.4, p => { a.r = side * 1.3 * (1 - p); }); a.r = 0; hold(a, 'lie');
    }
    function* dobbyMunch(a) {
      if (a.pose !== 'stand') { hold(a, 'stand'); yield* wait(.4); }
      hold(a, 'down');
      const bits = rParts((ps) => { if (rnd() < .08) { const n = A.petPoint(a, 'nose'); ps.push(P({ x: n.x, y: a.feet - 2, vx: (rnd() - .5) * 20, vy: -20, grav: 90, life: .5 })); } },
        (g, p, t) => { g.fillStyle = `rgba(90,170,60,${1 - t})`; g.fillRect(p.x, p.y, 2, 4); });
      yield* tween(5 + rnd() * 4, p => { a.sq = 1 + Math.sin(p * 90) * .015; }); a.sq = 1; stop(bits);
      hold(a, 'lie');
    }
    function* dobbyLook(a) {
      hold(a, 'up'); for (let k = 0; k < 3; k++) { yield* wait(1 + rnd()); a.face = -a.face; }
      yield* wait(1); hold(a, 'lie');
    }
    const PERS = {
      wifi: [[doze, 4], [rest, 3], [sitUp, 2], [shift, 2], [wifiDig, 1], [wifiToy, 1.5], [wifiBeg, 1]],
      snoet: [[doze, 3], [rest, 2], [sitUp, 2], [shift, 1], [snoetSpin, 1.5], [snoetSneeze, 1], [snoetBark, 1], [snoetZoom, 1]],
      pippa: [[doze, 5], [rest, 3], [sitUp, 1], [pippaGroom, 2], [pippaKnead, 1.5], [pippaStare, 1], [shift, .5]],
      pebbels: [[doze, 5], [rest, 3], [sitUp, 1.5], [pebbelsHunt, 1.5], [pebbelsRoll, 1.5], [shift, 1]],
      dobby: [[doze, 3], [rest, 3], [dobbyBinky, 1.5], [dobbyFlop, 1.5], [dobbyMunch, 2], [dobbyLook, 1.5], [shift, .5]],
    };
    const wpick = (list) => { let r = rnd() * list.reduce((s, x) => s + x[1], 0); for (const x of list) { r -= x[1]; if (r <= 0) return x[0]; } return list[0][0]; };
    function* life(a) {
      for (;;) {
        if (Date.now() > a.until) { yield* rLeave(a); return; }
        resetPose(a);
        yield* wpick(PERS[a.pet])(a);
      }
    }
    function* rLeave(a) {
      if (onScreen(a)) {
        yield* getUp(a);
        const side = a.cx < W / 2 ? -1 : 1;
        yield* rTo(a, worldX(W / 2 + side * (W / 2 + 90)), PET[a.pet].run * .7);
      }
      if (a.ball) a.ball.held = true;
      lg(`${NAMES[a.pet]} is weer vertrokken.`);
      a.gone = true;
    }
    // Kamiel arrives: those that are awake look at him; sometimes one comes over to say hello
    function* notice(a) {
      resetPose(a);
      lg(`Kamiel komt aan en ${NAMES[a.pet]} ligt daar ${a.pose === 'sleep' ? 'te slapen' : 'te luieren'}.`);
      if (a.pose === 'sleep' && rnd() < .35) return yield* life(a);   // fast asleep
      if (a.pose === 'sleep') { hold(a, LIE(a)); yield* wait(.6 + rnd()); }
      hold(a, SIT(a)); toward(a, kx()); emote('!', 1.2, a);
      yield* wait(1.5);
      if (!greetFor && rnd() < .65) { greetFor = a; request('begroeten'); yield* wait(8); if (greetFor === a && !a.busy) greetFor = null; }
      yield* life(a);
    }
    let greetFor = null;
    function arrived() {
      for (const a of residents) if (!a.busy && onScreen(a)) a.brain = notice(a);
    }
    // a new scene is made somewhere out of sight: whoever lay there has gone home; sometimes someone lies there already
    function placeNew(i) {
      for (const a of residents.slice()) if (a.place === i && !onScreen(a) && !a.busy) { a.gone = true; residents.splice(residents.indexOf(a), 1); }
      if (cfg.on === false || residents.length >= MAXRES || rnd() * 100 >= (cfg.pets_lying === undefined ? 20 : +cfg.pets_lying)) return;
      const free = PETS.filter(p => !isRes(p) && !(cfg.off || []).includes(p)); if (!free.length) return;
      const name = pick(free), c = A.placeCenter(i);
      let dx = 0; for (let t = 0; t < 12; t++) { dx = (rnd() * 2 - 1) * (A.PLACE / 2 - 90); if (Math.abs(dx) > 150 && residents.every(r => Math.abs(wrapD(r.wx - c - dx)) > 100)) break; }
      const a = makeResident(name, c + dx, FEET + (rnd() * 40 - 12), { pose: rnd() < .6 ? 'sleep' : LIE({ pet: name }) });
      a.brain = (function* () { yield* wait(rnd() * 20); yield* life(a); })();
    }
    // after a visit: sometimes they don't leave, they look for a spot and lie down
    function* settle(a) {
      let sx = W / 2; for (let t = 0; t < 20; t++) { sx = 90 + rnd() * (W - 180); if (Math.abs(sx - kx()) > 150 && residents.every(r => Math.abs(r.cx - sx) > 100)) break; }
      yield* petTo(a, sx, PET[a.pet].run * .5);
      const r = makeResident(a.pet, worldX(a.cx), a.feet, { face: a.face, pose: 'stand', lockPose: false });
      a.alpha = 0; r.brain = (function* () { yield* lieDown(r); yield* tween(.6, p => { r.feet = FEET + 14 * p; r.s = PET[r.pet].s * depthS(r.feet); }); yield* life(r); })();
      lg(`${NAMES[a.pet]} blijft nog wat en gaat liggen.`);
    }
    // tapping a resident on the tablet
    function tapPet(x, y) {
      for (const a of residents) {
        const u = 3.3 * a.s, w = 36 * u, h = 31 * u;
        if (a.busy || Math.abs(x - a.cx) > w / 2 || y < a.feet - h || y > a.feet + 6) continue;
        a.brain = (function* () {
          resetPose(a);
          if (a.pose === 'sleep') { hold(a, LIE(a)); emote('!', 1.2, a); yield* rJump(a, 10, .25); }
          hold(a, SIT(a)); emote('hearts', 2, a); a.eyes = 'hart'; yield* wait(2.2); a.eyes = '';
          yield* life(a);
        })();
        return true;
      }
      return false;
    }
    // the hello: the resident comes to Kamiel and does its own thing
    const GREET = {
      wifi: function* (a, side) { hold(a, 'down'); yield* tween(.4, p => { a.r = noseDown(a, .16 * p); }); yield* wait(.8); a.r = 0;
        for (let k = 0; k < 3; k++) { yield* rJump(a, 18, .3); emote('burst', .4, a); } hold(a, 'sit'); emote('hearts', 2, a); kam.eyes = 'blij'; yield* wait(2); },
      snoet: function* (a) { for (let k = 0; k < 8; k++) { a.face = -a.face; yield* rJump(a, 6, .15); }
        toward(a, kx()); for (let k = 0; k < 2; k++) { yield* rJump(a, 32, .4); emote('heart', .8, a); } kam.eyes = 'blij'; emote('hearts', 2); yield* wait(1.5); },
      pippa: function* (a, side) { const x0 = a.wx; yield* rTo(a, worldX(kx() - side * 70), 28); emote('hearts', 2, a); kam.eyes = 'dicht'; kam.blush = true;
        yield* rTo(a, x0, 28); a.face = -side; hold(a, 'sit'); yield* wait(1); hold(a, 'paw'); yield* wait(1.5); hold(a, 'sit'); kam.blush = false; },
      pebbels: function* (a, side) { kam.head = .2; hold(a, 'sit'); yield* wait(.6); yield* rJump(a, 22, .4); emote('?', 1.2, a);
        yield* wait(.5); emote('heart', 1.6, a); kam.eyes = 'blij'; yield* wait(1.6); kam.head = 0; },
      dobby: function* (a) { yield* dobbyBinky(a); toward(a, kx()); kam.head = .22; hold(a, 'up'); yield* wait(.8); emote('hearts', 2, a); kam.eyes = 'blij'; yield* wait(2); kam.head = 0; },
    };
    function* greetRun(a) {
      a.busy = true;
      try {
        resetPose(a);
        const side = a.cx > kx() ? 1 : -1; kam.face = side; kam.eyes = 'groot'; emote('!', 1); yield* wait(.8); kam.eyes = '';
        if (a.pose === 'sleep' || a.pose === 'lie') { hold(a, 'stand'); yield* wait(.4); }
        yield* rTo(a, worldX(kx() + side * 90), PET[a.pet].run * .8); toward(a, kx());
        yield* GREET[a.pet](a, side);
        kam.eyes = ''; kam.head = 0;
        if (rnd() < .5) yield* rTo(a, clampArea(a, a.home), PET[a.pet].run * .5);   // back to its spot, or it stays close
        else { const near = clampArea(a, worldX(kx() + side * 150)); yield* rTo(a, near, PET[a.pet].run * .4); }
        yield* lieDown(a);
        lg(`${NAMES[a.pet]} kwam Kamiel begroeten.`);
      } finally { a.busy = false; a.brain = life(a); greetFor = null; }
    }
    // particles that belong to a resident (not to an event)
    function rParts(emit, drawP) {
      const ps = [];
      return fx('front', 0, (g) => {
        const dt = st.dt; emit(ps, dt);
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.age += dt; if (p.age > p.life) { ps.splice(i, 1); continue; } p.vy += (p.grav || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; drawP(g, p, p.age / p.life); }
      });
    }

    /* ---------- the events ---------- */
    const DEF = {
      // a resident housemate comes to say hello (see "housemates that stay a while")
      // a song with a tempo is playing and, now and then, everyone comes out for a big musical number, on the beat
      dansfeest: { long: true, run: function* () {
        const live0 = A.beat(), test = !live0, t0 = cur.t;
        const beatNow = () => { const b = A.beat(); if (b) return b; return test ? { bpm: 112, pos: (cur.t - t0) * 112 / 60 } : null; };
        const bpm = beatNow().bpm, solo = bpm >= 90 ? 4 : 2;
        const frac = (x) => x - Math.floor(x), hop = (x) => Math.sin(Math.PI * frac(x));
        // who dances: the housemates (not those switched off) and Heidi, in a row with Kamiel in the middle
        const names = PETS.filter(p => !(cfg.off || []).includes(p));
        const slotsX = [-405, -290, -175, 175, 290, 405, 420].map(x => W / 2 + x);
        const cast = [];
        names.forEach((n, i) => {
          const side = slotsX[i] < W / 2 ? -1 : 1, a = pet(n, side), r = residents.find(x => x.pet === n && onScreen(x) && !x.busy);
          if (r) { r.busy = true; r.hidden = r.alpha; r.alpha = 0; a.cx = r.cx; a.res = r; }   // the one lying here gets up and joins
          a.tx = slotsX[i]; a.sx0 = a.cx; a.home = a.cx; cast.push(a);
        });
        const heidiOn = !(cfg.off || []).includes('lama');
        const hd = heidiOn ? actor({ cx: W + 140, s: .78, set: 'heidi', face: -1, eyes: 'vies' }) : null;
        if (hd) { hd.tx = slotsX[names.length] || W / 2 + 400; hd.sx0 = hd.cx; hd.home = hd.cx; hd.llama = true; cast.push(hd); }
        // the stage: pools of light on the grass, beams from above, notes and confetti
        const COL = ['255,80,170', '80,200,255', '255,220,80', '170,120,255'];
        let glow = 0, beamOn = 0;
        fx('ground', 0, (g) => { if (glow <= 0) return; for (const a of cast.concat([{ cx: kx() }])) {
          const c = COL[Math.floor(beatNow() ? beatNow().pos : 0) % 4], gr = g.createRadialGradient(a.cx, FEET + 4, 4, a.cx, FEET + 4, 90);
          gr.addColorStop(0, `rgba(${c},${.35 * glow})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(a.cx, FEET + 4, 90, 20, 0, 0, 7); g.fill(); } });
        fx('screen', 0, (g) => { if (beamOn <= 0) return; const b = beatNow(); if (!b) return;
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 4; k++) { const sw = Math.sin(b.pos * Math.PI / 4 + k * 1.6), x0 = W * (.12 + k * .25), x1 = x0 + sw * 220;
            const gr = g.createLinearGradient(x0, 0, x1, FEET); gr.addColorStop(0, `rgba(${COL[k]},${.28 * beamOn})`); gr.addColorStop(1, `rgba(${COL[k]},0)`);
            g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - 10, -10); g.lineTo(x0 + 10, -10); g.lineTo(x1 + 90, FEET + 20); g.lineTo(x1 - 90, FEET + 20); g.closePath(); g.fill(); }
          g.restore(); });
        const conf = []; let confOn = false;
        fx('screen', 0, (g) => { const dt = st.dt;
          if (confOn) for (let k = 0; k < 3; k++) conf.push({ x: rnd() * W, y: -10, vx: (rnd() - .5) * 60, vy: 60 + rnd() * 90, r: rnd() * 6, c: COL[Math.floor(rnd() * 4)], life: 6 });
          for (let i = conf.length - 1; i >= 0; i--) { const p = conf[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6; if (p.life < 0 || p.y > H) { conf.splice(i, 1); continue; }
            g.fillStyle = `rgb(${p.c})`; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-4, -2, 8, 4); g.restore(); } });
        const notes = [];
        fx('screen', 0, (g) => { const dt = st.dt; for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; n.t += dt; if (n.t > 2) { notes.splice(i, 1); continue; }
          g.globalAlpha = 1 - n.t / 2; sprC(g, SP.note, n.x + Math.sin(n.t * 4) * 10, n.y - n.t * 50, 3.2); } g.globalAlpha = 1; });
        const burstNotes = () => { for (const a of cast) if (rnd() < .5) notes.push({ x: a.cx, y: a.feet - 110, t: 0 }); };
        // set a dancer for this frame (pets have lift, llamas lift their feet)
        const put = (a, o) => {
          if (a.llama) { a.feet = FEET - (o.lift || 0); a.r = o.r || 0; a.sq = o.sq || 1; a.lockPose = !!o.pose; a.pose = o.pose || 'stand'; }
          else { a.lift = o.lift || 0; a.r = o.r || 0; a.sq = o.sq || 1; a.sx = o.sx || 1; a.lockPose = !!o.pose; a.pose = o.pose || 'stand'; }
          if (o.cx !== undefined) a.cx = o.cx; if (o.face) a.face = o.face; a.rate = 9;
        };
        // the plan, in beats
        const S = { in: 0, bounce: 8, wave: 16, solo: 24 }; S.chorus = S.solo + (cast.length + 1) * solo; S.finale = S.chorus + 8; S.out = S.finale + 6; S.end = S.out + 6;
        try {
        kam.eyes = 'groot'; emote('!', 1.4);
        let b0 = null, lastBeat = -1, stopped = false, prevPos = 0;
        for (;;) {
          const bt = beatNow();
          if (!bt) { stopped = true; break; }   // the music stopped: the show is over
          if (b0 === null) b0 = Math.ceil(bt.pos) + 1;
          // the speaker jumped (another position report, a skip): keep the dance going, still on the beat
          else { const diff = bt.pos - (prevPos + st.dt * bpm / 60); if (Math.abs(diff) > .5) b0 += Math.round(diff); }
          prevPos = bt.pos;
          const lb = bt.pos - b0, beat = Math.floor(lb), fr = frac(lb);
          if (beat !== lastBeat) { lastBeat = beat; if (beat >= S.bounce && beat < S.out && beat % 2 === 0) burstNotes(); }
          glow = clamp((lb + 2) / 4, 0, 1) * (lb > S.out ? clamp(1 - (lb - S.out) / 4, 0, 1) : 1);
          beamOn = clamp((lb - S.bounce + 2) / 4, 0, 1) * (lb > S.finale + 2 ? clamp(1 - (lb - S.finale - 2) / 3, 0, 1) : 1);
          confOn = lb >= S.chorus && lb < S.finale + 3;
          if (lb < 0) { kam.head = .12 * hop(bt.pos); yield; continue; }   // Kamiel hears it coming
          kam.eyes = lb < S.finale ? 'blij' : kam.eyes;
          // Kamiel himself: a happy bounce, his own solo, the kick line
          if (lb < S.solo) { kam.y = hop(lb) * 16; kam.head = .1 * hop(lb); kam.sq = 1 - .06 * Math.exp(-fr * 8); kam.face = Math.floor(lb / 4) % 2 ? 1 : -1; }
          cast.forEach((a, i) => {
            const P = PET[a.pet] || { s: 1 }, wiggle = (i % 2 ? 1 : -1);
            if (lb < S.bounce) {   // the entrance: hopping in, one after another, like a parade
              const p = clamp((lb - i * .5) / 6, 0, 1);
              put(a, { cx: lerp(a.sx0, a.tx, ez(p)), lift: p > 0 && p < 1 ? hop(lb) * 14 : 0, pose: p > 0 && p < 1 ? 'walk' : 'stand', face: p < 1 ? (a.tx > a.sx0 ? 1 : -1) : (a.tx < W / 2 ? 1 : -1) });
            } else if (lb < S.wave) {   // everyone bounces together
              const up = hop(lb);
              put(a, { cx: a.tx, lift: up * 18, sq: 1 - .12 * Math.exp(-fr * 8), pose: a.llama ? (up > .3 ? 'tilt' : 'stand') : (up > .3 ? 'jump' : 'stand'), face: Math.floor(lb / 2) % 2 ? 1 : -1 });
            } else if (lb < S.solo) {   // the wave, rolling through the line
              const local = lb - S.wave - i * .35, on = local >= 0 && (local % 2) < 1;
              put(a, { cx: a.tx, lift: on ? hop(local) * 30 : 0, pose: on ? (a.llama ? 'tilt' : 'jump') : 'stand', r: on ? wiggle * .1 * hop(local) : 0, face: a.tx < W / 2 ? 1 : -1 });
            }
          });
          // the solos: one after the other in the spotlight; the others sway
          if (lb >= S.solo && lb < S.chorus) {
            const k = Math.floor((lb - S.solo) / solo), t = (lb - S.solo) - k * solo;
            cast.forEach((a, i) => { if (i !== k) put(a, { cx: a.tx, r: Math.sin(lb * Math.PI) * .07, pose: a.llama ? 'stand' : (a.pet === 'dobby' ? 'stand' : 'sit') }); });
            if (k < cast.length) {
              const a = cast[k], f = frac(t);
              kam.y = 0; kam.sq = 1; kam.head = .06 * hop(lb); kam.face = a.cx > kx() ? 1 : -1;
              if (a.llama) {   // Heidi: refuses. Then does one perfect pirouette. Then pretends it never happened.
                if (t < solo / 2) { put(a, { cx: a.tx, pose: 'stand', face: a.tx > W / 2 ? -1 : 1 }); a.eyes = 'vies'; if (f < .05 && t < 1) emote('angry', 1, a); }
                else { a.eyes = 'blij'; put(a, { cx: a.tx, lift: hop(t / 2) * 26, pose: 'tilt', face: Math.floor(t * 4) % 2 ? 1 : -1 }); if (t > solo - .2) { a.eyes = 'vies'; emote('dots', 1.5, a); } }
              } else if (a.pet === 'wifi') put(a, { cx: a.tx, lift: hop(t * 2) * 18, pose: 'jump', face: Math.floor(t * 2) % 2 ? 1 : -1 });   // spinning, spinning
              else if (a.pet === 'snoet') put(a, { cx: a.tx, lift: hop(t / 2) * 75, pose: 'jump', r: frac(t / 2) * Math.PI * 2 });   // a twirl, high in the air
              else if (a.pet === 'pippa') { put(a, { cx: a.tx, lift: 14 + hop(t) * 12, pose: 'jump', r: Math.sin(t * Math.PI / 2) * .3 }); if (f < .04) emote('sparks', .8, a); }   // ballet
              else if (a.pet === 'pebbels') { const dir = a.face > 0 ? 1 : -1; a.pose = 'walk'; a.lockPose = true; a.rate = -9; a.cx = a.tx - dir * 60 * (t / solo); a.lift = 0; a.r = 0; }   // the moonwalk
              else if (a.pet === 'dobby') put(a, { cx: a.tx, lift: hop(t) * 46, pose: 'jump', r: Math.sin(f * Math.PI * 2) * .6, sx: f > .35 && f < .65 ? -1 : 1 });   // binkies
              if (f < .04 && (a.pet === 'wifi' || a.pet === 'snoet')) emote('burst', .4, a);
            } else {   // Kamiel's own solo, last: the big finish of the solos
              kam.y = hop(t) * 46; kam.r = Math.sin(t * Math.PI / 2) * .18; kam.face = Math.floor(t) % 2 ? 1 : -1; kam.head = .15 * hop(t);
              if (frac(t) < .04) emote('sparks', .8);
            }
          }
          // the kick line: everyone in time, tilting left, right, left
          if (lb >= S.chorus && lb < S.finale) {
            const side = Math.floor(lb) % 2 ? 1 : -1;
            cast.forEach(a => put(a, { cx: a.tx, lift: hop(lb * 2) * 10, r: side * .16, pose: a.llama ? 'tilt' : 'jump', face: side }));
            kam.r = side * .12; kam.y = hop(lb * 2) * 10; kam.face = side; kam.head = .08;
          }
          // the finale: one big jump together, and then the pose
          if (lb >= S.finale && lb < S.out) {
            const t = lb - S.finale;
            if (t < 1) { cast.forEach(a => put(a, { cx: a.tx, lift: hop(t) * 70, pose: a.llama ? 'tilt' : 'jump', face: a.tx < W / 2 ? 1 : -1 })); kam.y = hop(t) * 80; kam.r = 0; }
            else {
              if (lastBeat === S.finale + 1 && fr < .05) { cast.forEach(a => emote('hearts', 2.5, a)); emote('hearts', 2.5); for (let k = 0; k < 60; k++) conf.push({ x: kx() + (rnd() - .5) * 200, y: FEET - 150, vx: (rnd() - .5) * 600, vy: -200 - rnd() * 300, r: 0, c: COL[k % 4], life: 3 }); }
              cast.forEach(a => { put(a, { cx: a.tx, pose: a.llama ? 'tilt' : (a.pet === 'dobby' ? 'up' : 'sit'), face: a.tx < W / 2 ? 1 : -1 }); if (a.llama) a.eyes = 'blij'; });
              kam.y = 0; kam.r = 0; kam.head = -.1; kam.eyes = 'blij'; kam.sq = 1;
            }
          }
          // and off they go (those that were lying here go back to their spot)
          if (lb >= S.out) {
            const p = clamp((lb - S.out) / 5, 0, 1);
            cast.forEach(a => { const to = a.res ? a.res.cx : a.home; put(a, { cx: lerp(a.tx, to, ez(p)), lift: p < 1 ? hop(lb) * 10 : 0, pose: p < 1 ? 'walk' : 'stand', face: to > a.tx ? 1 : -1 }); });
            kam.head = 0; kam.eyes = '';
            if (lb >= S.end) break;
          }
          yield;
        }
        if (stopped) { kam.eyes = 'groot'; emote('?', 1.5); cast.forEach(a => { if (!a.llama) { a.pose = 'stand'; a.lift = 0; } }); yield* wait(1); }
        } finally {
          for (const a of cast) { a.alpha = 0; if (a.res) { a.res.alpha = a.res.hidden || 1; a.res.busy = false; } }
          kam.y = 0; kam.r = 0; kam.head = 0; kam.eyes = ''; kam.sq = 1;
        }
      } },
      /* ---------- little stories without words ---------- */
      // Heidi's revenge: she pushes Kamiel out of the picture and takes over the whole screen, until the gang comes back for her
      heidiwraak: { long: true, run: function* () {
        const side = rnd() < .5 ? -1 : 1;
        const h = actor({ cx: W / 2 + side * (W / 2 + 130), s: .86, set: 'heidi', face: -side, eyes: 'vies' });
        yield* actorTo(h, kx() + side * 125, 70); h.face = -side;
        emote('angry', 1.4, h); kam.face = side; kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.4);
        // the shove
        yield* actorTo(h, kx() + side * 70, 140);
        kam.eyes = 'x'; emote('stars', 1.5);
        yield* tween(1, p => { kam.x = lerp(0, -side * (W / 2 + 160), ez(p)); kam.r = -side * .35 * Math.sin(p * Math.PI); kam.y = Math.sin(p * Math.PI) * 50; });
        kam.r = 0; kam.y = 0; kam.eyes = '';
        // the takeover: she walks to the middle and comes much too close
        yield* actorTo(h, W / 2, 60); h.face = side; yield* wait(.8); h.face = -side; yield* wait(.6);
        h.layer = 'front'; h.lockPose = true; h.pose = 'walk'; h.rate = 3;
        yield* tween(3.2, p => { const e = ez(p); h.s = lerp(.86, 2.6, e); h.feet = lerp(FEET, H + 300, e); });
        h.pose = 'tilt'; h.eyes = 'blij'; h.outfit = ['kroon']; emote('sparks', 1.6, h);
        const glow = fx('screen', 0, (g) => { g.fillStyle = 'rgba(255,240,250,.06)'; g.fillRect(0, 0, W, H); });
        for (let k = 0; k < 7; k++) {   // she chews, she looks at you, she does not care
          yield* tween(2.6, p => { h.sq = 1 + Math.sin(p * 30) * .015; });
          h.face = k % 2 ? side : -side; h.eyes = pick(['blij', 'vies', 'dicht', 'blij']);
          if (k === 3) emote('dots', 2, h);
        }
        stop(glow);
        // here they come: Kamiel and the whole gang, marching in
        const gang = PETS.filter(p => !(cfg.off || []).includes(p)).map((n, i) => { const a = pet(n, -side); a.cx -= side * i * 50; return a; });
        kam.x = -side * (W / 2 + 120); kam.eyes = 'boos';
        yield* par(walkTo(-side * 240, 90), ...gang.map((a, i) => petTo(a, W / 2 - side * (300 + i * 26), PET[a.pet].run)));
        emote('angry', 1.5); gang.forEach(a => emote('burst', .6, a)); yield* wait(1.2);
        h.eyes = 'groot'; emote('!?', 1.4, h);
        // she shrinks back to her own size, and out she goes
        yield* tween(1.6, p => { const e = ez(p); h.s = lerp(2.6, .86, e); h.feet = lerp(H + 300, FEET, e); });
        h.layer = 'back'; h.pose = 'walk'; h.lockPose = false; h.outfit = [];
        yield* par(actorTo(h, W / 2 + side * (W / 2 + 170), 170), walkTo(side * 80, 130), ...gang.map((a, i) => petTo(a, W / 2 + side * (40 + i * 30), PET[a.pet].run * 1.3)));
        kam.eyes = 'blij'; emote('hearts', 2.5); gang.forEach(a => { emote('hearts', 2, a); });
        for (let k = 0; k < 2; k++) yield* par(hop(40, .5), ...gang.map(a => petJump(a, 24, .4)));
        yield* wait(1.2);
        yield* par(walkTo(0, 70), ...gang.map(a => petLeave(a, -side, PET[a.pet].run)));
        kam.eyes = '';
      } },
      // a ufo comes for Dobby, and brings him back… a little different
      ufo: { long: true, run: function* () {
        const side = rnd() < .5 ? -1 : 1, d = pet('dobby', side);
        yield* petTo(d, kx() + side * 170, 60); hold(d, 'down');
        const U = { x: W / 2 - side * (W / 2 + 140), y: 70, beam: 0, wob: 0 };
        fx('back', 0, (g) => {
          U.wob += st.dt;
          if (U.beam > 0) { const gr = g.createLinearGradient(0, U.y, 0, FEET + 10); gr.addColorStop(0, `rgba(170,255,200,${.55 * U.beam})`); gr.addColorStop(1, `rgba(170,255,200,${.12 * U.beam})`);
            g.fillStyle = gr; g.beginPath(); g.moveTo(U.x - 18, U.y + 18); g.lineTo(U.x + 18, U.y + 18); g.lineTo(U.x + 70, FEET + 10); g.lineTo(U.x - 70, FEET + 10); g.closePath(); g.fill(); }
          sprC(g, SP.ufo, U.x, U.y + Math.sin(U.wob * 3) * 5, 6);
        });
        yield* tween(3, p => { U.x = lerp(W / 2 - side * (W / 2 + 140), d.cx, ez(p)); });
        kam.face = side; kam.eyes = 'groot'; emote('!', 1.5);
        yield* tween(.8, p => { U.beam = p; });
        hold(d, 'jump'); d.eyes = 'groot';
        yield* tween(3, p => { d.lift = (FEET - U.y - 40) * ez(p); d.r = Math.sin(p * 12) * .3; d.s = PET.dobby.s * (1 - .5 * p); });
        d.alpha = 0; yield* tween(.5, p => { U.beam = 1 - p; });
        yield* tween(1.2, p => { U.y = 70 - 200 * ez(p); });
        // panic
        kam.eyes = 'groot'; emote('sweat', 4);
        for (let k = 0; k < 3; k++) { yield* walkTo(k % 2 ? -120 : 120, 200, 16); }
        yield* walkTo(0, 150, 14); kam.face = side; emote('?', 2); yield* wait(2.5);
        // he's back
        U.x = d.cx; yield* tween(1.4, p => { U.y = -130 + 200 * ez(p); });
        yield* tween(.6, p => { U.beam = p; });
        d.alpha = 1; d.eyes = 'groot';
        const ant = fx('front', 0, (g) => { if (d.alpha <= 0) return; const h0 = A.petPoint(d, 'head'); g.strokeStyle = '#3aff6a'; g.lineWidth = 2;
          for (const o of [-5, 5]) { g.beginPath(); g.moveTo(h0.x + o, h0.y); g.lineTo(h0.x + o * 2, h0.y - 22); g.stroke(); g.fillStyle = '#3aff6a'; g.beginPath(); g.arc(h0.x + o * 2, h0.y - 23, 3.5, 0, 7); g.fill(); } });
        yield* tween(2.5, p => { d.lift = (FEET - U.y - 40) * (1 - ez(p)); d.s = PET.dobby.s * (.5 + .5 * p); d.r = Math.sin(p * 10) * .2 * (1 - p); });
        d.lift = 0; d.r = 0; hold(d, null);
        yield* tween(.5, p => { U.beam = 1 - p; });
        yield* tween(1.5, p => { U.x = lerp(d.cx, W / 2 + side * (W / 2 + 160), ez(p)); U.y = 70 - 60 * p; });
        kam.eyes = ''; emote('?', 1.5); yield* wait(1);
        for (let k = 0; k < 2; k++) { yield* petJump(d, 34, .45); emote('sparks', .8, d); }
        emote('dots', 2); yield* wait(1.5);
        yield* petLeave(d, side, 60); stop(ant);
      } },
      // the housemates move house: they carry something away, and bring it back… upside down
      verhuis: { can: () => groundHits().length > 0, long: true, run: function* () {
        const hh = groundHits().filter(x => !x.it.on).sort((a, b) => Math.abs(a.x + a.w / 2 - W / 2) - Math.abs(b.x + b.w / 2 - W / 2))[0]; if (!hh) return;
        const cx0 = hh.x + hh.w / 2, side = cx0 < W / 2 ? -1 : 1, foot = hh.foot;
        const crew = ['wifi', 'snoet', 'pebbels'].filter(p => !(cfg.off || []).includes(p)).map(n => pet(n, side));
        const off = { x: 0, y: 0, r: 0 };
        cur.itemOff = (it) => it === hh.it ? off : null;
        yield* par(...crew.map((a, i) => petTo(a, cx0 + (i - 1) * hh.w * .3, PET[a.pet].run)));
        kam.face = side; emote('?', 2);
        crew.forEach(a => hold(a, 'down')); yield* wait(.8);
        yield* tween(.6, p => { off.y = -16 * p; }); crew.forEach(a => { hold(a, null); a.lift = 6; });
        const exit = side * (W / 2 + hh.w + 80);
        yield* par(tween(5, p => { const e = ez(p); off.x = (exit - (cx0 - W / 2)) * e; off.r = Math.sin(p * 20) * .04; crew.forEach((a, i) => { a.cx = cx0 + (i - 1) * hh.w * .3 + off.x; a.pose = 'walk'; a.face = side; }); }));
        crew.forEach(a => { a.alpha = 0; });
        kam.eyes = 'groot'; emote('!?', 1.8); yield* wait(2); kam.eyes = ''; emote('dots', 2.5); yield* wait(3);
        // back it comes, the wrong way up
        crew.forEach(a => { a.alpha = 1; a.face = -side; });
        yield* tween(5, p => { const e = ez(p); off.x = (exit - (cx0 - W / 2)) * (1 - e); off.r = Math.PI * Math.min(1, p * 1.2); off.y = -16 - Math.sin(p * Math.PI) * 6 + (hh.h * .9) * Math.min(1, p * 1.2) * 0;
          crew.forEach((a, i) => { a.cx = cx0 + (i - 1) * hh.w * .3 + off.x; a.pose = 'walk'; }); });
        off.y = 0; crew.forEach(a => { a.lift = 0; hold(a, 'sit'); emote('hearts', 1.6, a); });
        kam.eyes = 'groot'; emote('?', 2); yield* wait(2.5); kam.eyes = ''; emote('dots', 2); yield* wait(2);
        yield* par(...crew.map(a => petLeave(a, rnd() < .5 ? -1 : 1, PET[a.pet].run)));
        // it stays upside down: keep that for this place
        hh.it.flipY = true; cur.itemOff = null;
      } },
      // at night: everything goes dark, and two eyes come closer… it's only Pippa
      ogen: { can: () => A.night(), run: function* () {
        let dark = 0;
        fx('screen', 0, (g) => { if (dark > 0) { g.fillStyle = `rgba(0,0,6,${.93 * dark})`; g.fillRect(0, 0, W, H); } });
        const E = { x: 120, y: FEET - 34, on: 0, blink: 0 };
        fx('screen', 0, (g) => { if (E.on <= 0) return; const open = E.blink > 0 ? .15 : 1;
          for (const o of [-16, 16]) { g.fillStyle = `rgba(255,230,60,${E.on})`; g.beginPath(); g.ellipse(E.x + o, E.y, 10, 10 * open, 0, 0, 7); g.fill();
            g.fillStyle = `rgba(0,0,0,${E.on})`; g.fillRect(E.x + o - 1, E.y - 5 * open, 2, 10 * open); } E.blink = Math.max(0, E.blink - st.dt); });
        yield* tween(2, p => { dark = p; });
        kam.eyes = 'groot'; emote('sweat', 3); yield* wait(2);
        E.on = 1; yield* wait(1.5); E.blink = .2; yield* wait(1.2);
        yield* shiver(1.2, 4);
        yield* tween(4, p => { E.x = lerp(120, kx() - 150, ez(p)); if (p > .5 && p < .55) E.blink = .2; });
        kam.eyes = 'x'; emote('!', 1.2); yield* tween(.3, p => { kam.y = Math.sin(p * Math.PI) * 50; }); kam.y = 0;
        const c = pet('pippa', -1); c.cx = E.x; hold(c, 'sit'); c.face = 1;
        E.on = 0; yield* tween(1.2, p => { dark = 1 - p; });
        emote('dots', 2, c); kam.eyes = ''; yield* wait(1.5); emote('heart', 1.5, c); kam.eyes = 'blij'; emote('sweat', 2); yield* wait(2);
        hold(c, null); yield* petLeave(c, -1, PET.pippa.run);
      } },

      /* ---------- more little stories with the housemates ---------- */
      // one of them drags something into the scene, all by itself, and is very proud of it
      brengen: { run: function* () {
        const pool = A.OBJ.filter(o => o.kind === 'grond' && !o.sign && !o.tv && o.size && A.ready(o.img)); if (!pool.length) return;
        const o = pick(pool), name = (pick(PETS.filter(p => !(cfg.off || []).includes(p))) || 'wifi'), side = rnd() < .5 ? -1 : 1;
        const h = clamp(90 + rnd() * 50, 60, 150), w = h * o.size[0] / o.size[1], to = W / 2 + side * (150 + rnd() * 140);
        let x = W / 2 + side * (W / 2 + w / 2 + 60), r = 0;
        const it = fx('back', 0, (g) => { g.save(); g.translate(x, FEET + 10); g.rotate(r); g.drawImage(o.img, -w / 2, -h, w, h); g.restore(); });
        const a = pet(name, side); a.cx = x + side * (w / 2 + 20); a.face = -side;
        kam.face = side; emote('?', 2);
        // pushing, with little stops to catch its breath
        while (Math.abs(x - to) > 2) {
          const step = Math.min(Math.abs(x - to), 120);
          a.pose = 'walk'; a.lockPose = true; a.rate = 5;
          yield* tween(1.3, p => { const nx = x - side * step * st.dt / 1.3; x = Math.abs(nx - to) < 2 ? to : nx; r = Math.sin(cur.t * 9) * .03; a.cx = x + side * (w / 2 + 20); });
          a.lockPose = false; hold(a, 'down'); emote('sweat', .8, a); yield* wait(.6); hold(a, null);
        }
        r = 0; stop(it); A.addItem(o, x - W / 2, h);
        yield* petTo(a, x - side * (w / 2 + 40), PET[name].run * .6); a.face = side; hold(a, name === 'dobby' ? 'up' : 'sit');
        emote('sparks', 1.5, a); kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.5);
        kam.eyes = 'blij'; emote('heart', 1.6); emote('hearts', 1.8, a); yield* wait(2); kam.eyes = '';
        hold(a, null); yield* petLeave(a, -side, PET[name].run);
      } },
      // skydiving in, with a parachute that lands right on Kamiel's head
      skydive: { long: true, run: function* () {
        const name = (pick(PETS.filter(p => !(cfg.off || []).includes(p))) || 'snoet'), a = pet(name, 1);
        let ax = W / 2 + (rnd() < .5 ? -1 : 1) * (120 + rnd() * 160), cy = -60, open = 0, chute = { x: 0, y: 0, on: true, drop: 0 };
        a.cx = ax; a.feet = cy; a.layer = 'front'; hold(a, 'jump');
        const COL = ['#ff3d8b', '#ffffff', '#3db8ff', '#ffffff', '#ffd23f', '#ffffff'];
        fx('front', 0, (g) => {
          if (!chute.on) return;
          const cx = chute.x, top = chute.y, rw = 70 * open, rh = 44 * open; if (open <= 0) return;
          if (!chute.drop) { g.strokeStyle = 'rgba(40,40,40,.7)'; g.lineWidth = 1.2; const hp = A.petPoint(a, 'head');
            for (const dx of [-rw, -rw / 2, rw / 2, rw]) { g.beginPath(); g.moveTo(cx + dx, top); g.lineTo(hp.x, hp.y); g.stroke(); } }
          for (let k = 0; k < 6; k++) { g.fillStyle = COL[k]; g.beginPath(); g.moveTo(cx, top - rh * (1 - chute.drop * .7)); g.arc(cx, top, rw, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); g.closePath(); g.fill(); }
        });
        emote('!', 1.2); kam.head = -.25; kam.eyes = 'groot';
        yield* tween(1.2, p => { cy = -60 + 120 * p * p; a.feet = cy; a.r = Math.sin(p * 20) * .5; });   // free fall, spinning
        a.r = 0; yield* tween(.5, p => { open = ez(p); });
        // floating down, swaying
        const fallFrom = cy;
        yield* tween(8, p => { cy = lerp(fallFrom, FEET, p); a.feet = cy; a.cx = ax + Math.sin(p * 9) * 40; a.r = Math.cos(p * 9) * .15;
          chute.x = a.cx; chute.y = cy - 120; kam.head = -.25 + .2 * p; kam.face = a.cx > kx() ? 1 : -1; });
        a.r = 0; a.feet = FEET; hold(a, 'down'); emote('burst', .5, a); yield* wait(.3); hold(a, null);
        // the parachute sails on… onto Kamiel
        chute.drop = 1; const c0x = chute.x, c0y = chute.y, hd = () => kp(260, 120);
        yield* tween(1.6, p => { chute.x = lerp(c0x, hd().x, ez(p)); chute.y = lerp(c0y, hd().y + 30, ez(p)); open = 1 + .3 * p; });
        kam.eyes = 'dicht'; emote('?', 1.5); yield* shiver(1.5, 4);
        yield* tween(1.2, p => { chute.x = hd().x; chute.y = hd().y + 30; kam.x = Math.sin(p * 12) * 15; }); kam.x = 0;
        // the housemate pulls it off him
        yield* petTo(a, kx() + 90, PET[name].run); a.face = -1; hold(a, 'down'); yield* wait(.4);
        yield* tween(.8, p => { chute.x = lerp(hd().x, a.cx + 60, p); chute.y = lerp(hd().y + 30, FEET - 10, p); open = 1.3 - .9 * p; });
        kam.eyes = 'groot'; emote('!', 1); yield* wait(.8); kam.eyes = 'blij'; emote('heart', 1.4, a); hold(a, null);
        yield* tween(2.5, p => { a.cx += 90 * st.dt; chute.x = a.cx + 40; a.pose = 'walk'; });
        chute.on = false; yield* petLeave(a, 1, PET[name].run); kam.eyes = ''; kam.head = 0;
      } },
      // lost: it doesn't know the way, looks around, gets sad, and Kamiel walks it to the right side
      verdwaald: { long: true, run: function* () {
        const name = (pick(PETS.filter(p => !(cfg.off || []).includes(p))) || 'dobby'), side = rnd() < .5 ? -1 : 1, a = pet(name, side);
        yield* petTo(a, W / 2 + side * 260, PET[name].run * .6);
        for (const tx of [W / 2 + side * 120, W / 2 + side * 360, W / 2 + side * 200]) {
          hold(a, 'stand'); a.face = -a.face; emote('?', 1.4, a); yield* wait(1.4); hold(a, null);
          yield* petTo(a, tx, PET[name].run * .5);
        }
        hold(a, name === 'dobby' ? 'lie' : 'sit'); emote('tears', 3, a); yield* wait(3);
        kam.face = side; emote('!', 1.2); yield* walkTo(side * 120, 60);
        kam.head = .2; a.face = -side; hold(a, name === 'dobby' ? 'up' : 'sit'); emote('heart', 1.5, a); emote('heart', 1.5); yield* wait(1.8); kam.head = 0;
        // follow me
        const way = -side;
        hold(a, null);
        yield* par(walkTo(way * (W / 2 - 60), 55), (function* () { yield* wait(.8); yield* petTo(a, W / 2 + way * (W / 2 - 160), 50); })());
        kam.face = -way; a.face = way; emote('hearts', 2, a); yield* petJump(a, 24, .4); yield* wait(.4);
        yield* petLeave(a, way, PET[name].run * 1.2);
        kam.eyes = 'blij'; emote('sparks', 1.4); yield* wait(1); kam.eyes = '';
        yield* walkTo(0, 70);
      } },
      // all of a sudden: a chase, one after the other through the whole scene, and back again
      sprint: { run: function* () {
        const names = PETS.filter(p => !(cfg.off || []).includes(p)); if (!names.length) return;
        const order = names.slice().sort(() => rnd() - .5), side = rnd() < .5 ? -1 : 1;
        kam.eyes = 'groot'; emote('!', 1);
        for (let lap = 0; lap < 2; lap++) {
          const dir = lap ? side : -side, runners = order.map((n, i) => { const a = pet(n, -dir); a.cx -= -dir * i * 70; a.rate = 18; return a; });
          const dust = particles('front', { until: cur.t + 4, emit: (ps) => { for (const a of runners) if (rnd() < .4 && a.cx > 0 && a.cx < W) ps.push(P({ x: a.cx - dir * 20, y: FEET - 2, vx: -dir * 30, vy: -20, life: .6 })); },
            draw: (g, p, tt) => { g.fillStyle = `rgba(200,180,140,${.6 * (1 - tt)})`; g.beginPath(); g.arc(p.x, p.y, 4 + tt * 6, 0, 7); g.fill(); } });
          yield* par(...runners.map(a => (function* () { yield* petTo(a, W / 2 + dir * (W / 2 + 120), 360 + rnd() * 80); if (rnd() < .3) emote('burst', .4, a); a.alpha = 0; })()),
            (function* () { yield* tween(2.6, p => { const lead = runners.reduce((m, a) => a.alpha > 0 && Math.abs(a.cx - W / 2) < Math.abs(m - W / 2) ? a.cx : m, W); kam.face = lead > kx() ? 1 : -1; }); })());
          stop(dust); yield* wait(.8);
        }
        kam.eyes = 'x'; emote('stars', 2.5); yield* tween(2.5, p => { kam.r = Math.sin(p * 14) * .1 * (1 - p); }); kam.r = 0; kam.eyes = '';
      } },
      // a tower: the housemates climb on top of each other… and fall over
      toren: { run: function* () {
        const names = ['pebbels', 'wifi', 'pippa', 'snoet', 'dobby'].filter(p => !(cfg.off || []).includes(p)); if (names.length < 2) return;
        const side = rnd() < .5 ? -1 : 1, x = W / 2 + side * 210, stack = [];
        const crew = names.map((n, i) => pet(n, i % 2 ? -side : side));
        yield* par(...crew.map((a, i) => petTo(a, i ? x + (i % 2 ? -1 : 1) * (80 + i * 22) : x, PET[a.pet].run * 1.3)));
        crew.forEach(a => { a.face = a.cx < x ? 1 : a.cx > x ? -1 : -side; });
        for (const [i, a] of crew.entries()) {   // one by one they climb up
          if (i) { const h0 = stack.reduce((sum, b) => sum + 58 * b.s, 0); yield* petJump(a, h0 + 30, .5, x); a.lift = h0; a.face = -side; hold(a, 'stand'); }
          stack.push(a); emote('sparks', .6, a); yield* wait(.3);
        }
        kam.face = side; kam.eyes = 'groot'; emote('!?', 2);
        yield* tween(3, p => { stack.forEach((a, i) => { a.cx = x + Math.sin(cur.t * 4 + i * .3) * i * 4 * (.5 + p); a.r = Math.sin(cur.t * 4) * .04 * i; }); });
        // timber!
        emote('!', 1.2, stack[stack.length - 1]);
        yield* tween(1, p => { stack.forEach((a, i) => { a.cx = x + side * i * 50 * ez(p); a.lift = Math.max(0, a.lift * (1 - p * p)); a.r = side * i * .3 * p; }); });
        stack.forEach(a => { a.lift = 0; a.r = 0; hold(a, a.pet === 'dobby' ? 'lie' : 'lie'); emote(pick(['stars', 'dots', 'sweat']), 2, a); });
        kam.eyes = ''; emote('sweat', 2); yield* wait(2.5);
        stack.forEach(a => hold(a, null));
        yield* par(...stack.map(a => petLeave(a, rnd() < .5 ? -1 : 1, PET[a.pet].run)));
      } },
      // sneaking up behind Kamiel: every time he turns around, they freeze and look the other way
      sluipen: { long: true, run: function* () {
        const names = PETS.filter(p => !(cfg.off || []).includes(p)).slice(0, 4); if (!names.length) return;
        const side = kface() > 0 ? -1 : 1;   // they come from behind him
        kam.face = -side;
        const gang = names.map((n, i) => { const a = pet(n, side); a.cx += side * i * 60; return a; });
        let dist = W / 2 + 60;
        for (let round = 0; round < 4; round++) {
          dist -= 85;
          yield* par(...gang.map((a, i) => (function* () { a.rate = 3; yield* petTo(a, kx() + side * (dist + i * 55), 40); })()));
          yield* wait(.5 + rnd());
          kam.face = side; kam.eyes = 'groot'; emote('?', 1);
          gang.forEach(a => { hold(a, a.pet === 'dobby' ? 'stand' : 'sit'); a.face = side; });   // innocent
          yield* wait(1.6); kam.eyes = ''; emote('dots', 1.2); yield* wait(1); kam.face = -side; gang.forEach(a => hold(a, null));
        }
        // got him
        yield* par(...gang.map((a, i) => petJump(a, 30, .4, kx() + side * (40 + i * 30))));
        kam.eyes = 'groot'; emote('!', 1.2); yield* tween(.3, p => { kam.y = Math.sin(p * Math.PI) * 60; }); kam.y = 0;
        kam.face = side; emote('hearts', 2); gang.forEach(a => emote('hearts', 2, a)); kam.eyes = 'blij'; yield* wait(2.5);
        yield* par(...gang.map(a => petLeave(a, side, PET[a.pet].run))); kam.eyes = '';
      } },

      /* ---------- feast days ---------- */
      // the birthday cake: everyone comes, Kamiel blows out the candles
      taart: { fest: ['verjaardag'], long: true, run: function* () {
        const f = kface(), cx = kx() + f * 110;
        let lit = 5, cakeOn = 0;
        fx('front', 0, (g) => {
          if (cakeOn <= 0) return; g.globalAlpha = cakeOn; const y = FEET + 6;
          g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cx, y + 2, 50, 7, 0, 0, 7); g.fill();
          g.fillStyle = '#f7c6d9'; g.fillRect(cx - 44, y - 30, 88, 30); g.fillStyle = '#ffffff'; g.fillRect(cx - 44, y - 34, 88, 6);
          g.fillStyle = '#f4a3c0'; g.fillRect(cx - 30, y - 54, 60, 20); g.fillStyle = '#fff'; g.fillRect(cx - 30, y - 57, 60, 5);
          for (let k = 0; k < 9; k++) { g.fillStyle = ['#ff3d8b', '#3db8ff', '#ffd23f'][k % 3]; g.fillRect(cx - 40 + k * 10, y - 20, 4, 4); }
          for (let k = 0; k < 5; k++) { const x = cx - 22 + k * 11; g.fillStyle = ['#7ee0a0', '#3db8ff', '#ffd23f', '#ff3d8b', '#b98cff'][k]; g.fillRect(x - 2, y - 72, 4, 15);
            if (k < lit) { const fl = Math.sin(cur.t * 20 + k) * 1.5; g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(x, y - 78 + fl * .3, 3, 6 + fl, 0, 0, 7); g.fill(); g.fillStyle = '#fff6c0'; g.fillRect(x - 1, y - 78, 2, 4); } }
          g.globalAlpha = 1;
        });
        yield* tween(1, p => { cakeOn = p; });
        kam.eyes = 'groot'; emote('!', 1.2); kam.face = f; yield* wait(1.2); kam.eyes = 'blij'; emote('hearts', 2);
        const gang = PETS.filter(p => !(cfg.off || []).includes(p)).map((n, i) => pet(n, i % 2 ? -1 : 1));
        yield* par(...gang.map((a, i) => petTo(a, cx + (i - 2) * 58 + (i >= 2 ? 40 : -40), PET[a.pet].run)));
        gang.forEach(a => { hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.face = a.cx < cx ? 1 : -1; });
        yield* wait(1.5);
        for (let k = 0; k < 4; k++) { gang.forEach(a => a.lift = (k % 2) * 6); yield* wait(.5); }   // a little song, they bob along
        gang.forEach(a => { a.lift = 0; });
        // blow!
        kam.head = .12; kam.mouth = .7;
        particles('front', { until: cur.t + 2, emit: (ps) => { const m = kp(20, 395); ps.push(P({ x: m.x, y: m.y, vx: f * (180 + rnd() * 80), vy: (rnd() - .5) * 40, life: .6 })); },
          draw: (g, p, tt) => { g.fillStyle = `rgba(255,255,255,${.6 * (1 - tt)})`; g.fillRect(p.x, p.y, 6, 2); } });
        for (let k = 0; k < 5; k++) { yield* wait(.35); lit--; }
        kam.mouth = 0; kam.head = 0;
        particles('screen', { until: cur.t + .1, emit: (ps) => { for (let k = 0; k < 60; k++) ps.push(P({ x: cx, y: FEET - 80, vx: (rnd() - .5) * 500, vy: -200 - rnd() * 300, grav: 500, life: 2, c: k % 4 })); },
          draw: (g, p, tt) => { g.fillStyle = ['#ff3d8b', '#3db8ff', '#ffd23f', '#7ee0a0'][p.c]; g.globalAlpha = 1 - tt; g.fillRect(p.x, p.y, 6, 3); g.globalAlpha = 1; } });
        gang.forEach(a => emote('hearts', 2.5, a)); emote('hearts', 2.5);
        for (let k = 0; k < 2; k++) yield* par(hop(36, .45), ...gang.map(a => petJump(a, 22, .4)));
        yield* wait(2);
        yield* par(...gang.map(a => petLeave(a, a.cx < W / 2 ? -1 : 1, PET[a.pet].run)), tween(1.5, p => { cakeOn = 1 - p; }));
        kam.eyes = '';
      } },
      // Halloween: a ghost! (it is Heidi under a sheet, which is to say: Heidi)
      spook: { fest: ['halloween'], run: function* () {
        const side = rnd() < .5 ? -1 : 1, g0 = actor({ cx: W / 2 + side * (W / 2 + 140), s: .86, set: 'heidi', face: -side, alpha: .5, eyes: 'groot' });
        const wit = pet(pick(['snoet', 'pippa', 'wifi']), -side); wit.cx = kx() - side * 160; hold(wit, 'sit'); wit.face = side;
        yield* tween(5, p => { g0.cx = lerp(W / 2 + side * (W / 2 + 140), kx() + side * 140, ez(p)); g0.feet = FEET - 30 - Math.sin(p * 9) * 10; g0.r = Math.sin(p * 7) * .06; });
        kam.eyes = 'groot'; emote('!', 1.5); emote('!', 1.2, wit); yield* shiver(1.5, 5);
        hold(wit, null); emote('sweat', 2, wit); yield* petTo(wit, W / 2 - side * (W / 2 + 90), PET[wit.pet].run * 2.5);
        yield* tween(2, p => { g0.feet = FEET - 30 - Math.sin(p * 9) * 10; g0.cx = lerp(kx() + side * 140, kx() + side * 80, p); });
        // she trips over her own sheet
        yield* tween(.5, p => { g0.r = side * .6 * p; g0.feet = FEET - 30 + 30 * p; });
        g0.alpha = 1; g0.eyes = 'vies'; emote('angry', 2, g0); kam.eyes = ''; emote('?', 2);
        yield* wait(1.5); g0.r = 0; emote('dots', 2); yield* wait(1.5);
        yield* actorTo(g0, W / 2 + side * (W / 2 + 160), 60);
      } },
      // Christmas: a sleigh through the sky, pulled by the housemates, with Heidi in it (of course)
      slee: { fest: ['kerst'], run: function* () {
        const d = rnd() < .5 ? -1 : 1, crew = PETS.filter(p => !(cfg.off || []).includes(p)).map(n => pet(n, -d));
        const sl = actor({ cx: 0, s: .32, set: 'heidi', face: d, eyes: 'blij', layer: 'front' });
        crew.forEach(a => { a.s *= .45; a.layer = 'front'; a.pose = 'jump'; a.lockPose = true; a.face = d; });
        kam.face = d; kam.head = -.22; emote('?', 2);
        fx('front', 0, (g) => { g.fillStyle = '#b8202a'; g.fillRect(sl.cx - 26, sl.feet - 6, 52, 14); g.fillStyle = '#e8c46a'; g.fillRect(sl.cx - 30, sl.feet + 8, 60, 3); });
        const trail = particles('front', { until: cur.t + 12, emit: (ps) => { if (rnd() < .6) ps.push(P({ x: sl.cx - d * 30, y: sl.feet, vx: -d * 20, vy: 10, life: 1.2 })); },
          draw: (g, p, tt) => { g.fillStyle = `rgba(255,240,150,${1 - tt})`; g.fillRect(p.x, p.y, 3, 3); } });
        yield* tween(10, p => {
          const x = lerp(-d * (W / 2 + 260), d * (W / 2 + 420), p) + W / 2, y = 150 + Math.sin(p * Math.PI * 2) * 30;
          sl.cx = x; sl.feet = y;
          crew.forEach((a, i) => { a.cx = x + d * (60 + i * 40); a.feet = y + 6 + Math.sin(cur.t * 8 + i) * 3; a.lift = 0; });
        });
        kam.eyes = 'blij'; emote('sparks', 2); kam.head = 0; yield* wait(2); kam.eyes = '';
        crew.forEach(a => { a.alpha = 0; }); sl.alpha = 0; stop(trail);
      } },
      // Easter: Dobby hops through with a basket and hides eggs (go and find them on the tablet)
      eieren: { fest: ['pasen'], run: function* () {
        const side = rnd() < .5 ? -1 : 1, d = pet('dobby', side);
        const bask = fx('front', 0, (g) => { const n = A.petPoint(d, 'nose'); g.fillStyle = '#b07a3a'; g.fillRect(n.x - 9, n.y + 4, 18, 10); g.strokeStyle = '#7a4a1a'; g.lineWidth = 2; g.beginPath(); g.arc(n.x, n.y + 4, 9, Math.PI, 0); g.stroke();
          ['#ff8ac1', '#8ad0ff', '#ffe066'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.ellipse(n.x - 5 + k * 5, n.y + 3, 3, 4, 0, 0, 7); g.fill(); }); });
        for (let k = 0; k < 6; k++) {
          const x = lerp(W / 2 + side * (W / 2 + 40), W / 2 - side * (W / 2 + 60), (k + 1) / 7);
          yield* petJump(d, 26, .45, x); hold(d, 'down'); emote('sparks', .8, d); yield* wait(.5); hold(d, null);
          if (k === 2) { kam.face = d.cx > kx() ? 1 : -1; emote('?', 1.5); }
        }
        stop(bask); yield* petLeave(d, -side, 60);
        kam.head = .15; emote('dots', 2); yield* wait(2); kam.head = 0;
      } },
      // New Year: the big fireworks, everybody looks up
      vuurwerkfeest: { fest: ['nieuwjaar'], long: true, run: function* () {
        const gang = PETS.filter(p => !(cfg.off || []).includes(p)).map((n, i) => pet(n, i % 2 ? -1 : 1));
        yield* par(...gang.map((a, i) => petTo(a, W / 2 + (i - 2) * 120 + (i >= 2 ? 80 : -80), PET[a.pet].run)));
        gang.forEach(a => { hold(a, a.pet === 'dobby' ? 'up' : 'sit'); a.r = a.face > 0 ? -.2 : .2; });
        kam.head = -.25; kam.eyes = 'groot';
        const bursts = [];
        fx('screen', 0, (g) => {
          if (rnd() < .06 && bursts.length < 6) bursts.push({ x: 120 + rnd() * (W - 240), y: 60 + rnd() * 150, t0: cur.t, hue: Math.floor(rnd() * 360), heart: rnd() < .2 });
          for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i], a = cur.t - b.t0; if (a > 2.6) { bursts.splice(i, 1); continue; }
            g.fillStyle = `hsla(${b.hue},95%,70%,${Math.max(0, 1 - a / 2.6)})`;
            for (let k = 0; k < 36; k++) { const an = k / 36 * Math.PI * 2; let dx = Math.cos(an), dy = Math.sin(an);
              if (b.heart) { dx = 16 * Math.pow(Math.sin(an), 3) / 16; dy = -(13 * Math.cos(an) - 5 * Math.cos(2 * an) - 2 * Math.cos(3 * an) - Math.cos(4 * an)) / 16; }
              const r = 24 + a * 90; g.fillRect(b.x + dx * r - 2, b.y + dy * r + a * a * 14 - 2, 5, 5); } }
        });
        for (let k = 0; k < 6; k++) { yield* wait(3); if (k % 2) { emote('hearts', 1.5); gang.forEach(a => emote(pick(['heart', 'sparks', '!']), 1.2, a)); } }
        kam.eyes = 'blij'; kam.head = 0; gang.forEach(a => { a.r = 0; hold(a, null); });
        yield* par(...gang.map(a => petLeave(a, a.cx < W / 2 ? -1 : 1, PET[a.pet].run)));
        kam.eyes = '';
      } },
      // Valentine: Kamiel is in love with Heidi. Heidi is not.
      verliefd: { fest: ['valentijn'], run: function* () {
        const side = rnd() < .5 ? -1 : 1, h = actor({ cx: W / 2 + side * (W / 2 + 130), s: .86, set: 'heidi', face: -side, eyes: '' });
        yield* actorTo(h, kx() + side * 170, 55); h.face = -side;
        kam.face = side; kam.eyes = 'groot'; kam.blush = true; emote('hearts', 3); yield* wait(2.5);
        h.eyes = 'vies'; emote('dots', 2, h); yield* wait(1.5); h.face = side; emote('angry', 1.2, h);
        yield* actorTo(h, W / 2 + side * (W / 2 + 150), 70);
        kam.blush = false; kam.eyes = 'triest'; emote('tears', 3); yield* wait(3);
        const gang = PETS.filter(p => !(cfg.off || []).includes(p)).map((n, i) => pet(n, i % 2 ? -1 : 1));
        yield* par(...gang.map((a, i) => petTo(a, kx() + (i - 2) * 50 + (i >= 2 ? 70 : -70), PET[a.pet].run)));
        gang.forEach(a => { a.face = a.cx < kx() ? 1 : -1; emote('heart', 2, a); });
        kam.eyes = 'blij'; emote('hearts', 2.5); yield* wait(2.5);
        yield* par(...gang.map(a => petLeave(a, a.cx < W / 2 ? -1 : 1, PET[a.pet].run)));
        kam.eyes = '';
      } },
      // Sinterklaas: it rains pepernoten, and everybody tries to catch them
      pepernoten: { fest: ['sinterklaas'], run: function* () {
        const gang = PETS.filter(p => !(cfg.off || []).includes(p)).map((n, i) => pet(n, i % 2 ? -1 : 1));
        const nuts = particles('front', { until: cur.t + 14, emit: (ps) => { if (rnd() < .5) ps.push(P({ x: 60 + rnd() * (W - 120), y: -10, vy: 160 + rnd() * 80, vx: (rnd() - .5) * 20, life: 3.4 })); },
          draw: (g, p) => { if (p.y > FEET + 4) { p.vy = 0; p.vx = 0; } g.fillStyle = '#9a5a2a'; g.beginPath(); g.arc(p.x, Math.min(p.y, FEET + 4), 4, 0, 7); g.fill(); } });
        kam.head = -.2; kam.mouth = .6; emote('!', 1.2);
        yield* par(...gang.map((a, i) => (function* () { yield* petTo(a, 120 + i * (W - 240) / 4, PET[a.pet].run); for (let k = 0; k < 5; k++) { hold(a, 'down'); yield* wait(.6); hold(a, null); yield* petJump(a, 14, .3, a.cx + (rnd() - .5) * 60); } })(),
          (function* () { for (let k = 0; k < 8; k++) { yield* walkTo((rnd() - .5) * 300, 140, 12); yield* hop(20, .3); } })()));
        kam.mouth = 0; kam.head = 0; kam.eyes = 'blij'; emote('hearts', 2); gang.forEach(a => emote('heart', 1.4, a)); yield* wait(2); stop(nuts);
        yield* par(walkTo(0, 70), ...gang.map(a => petLeave(a, a.cx < W / 2 ? -1 : 1, PET[a.pet].run)));
        kam.eyes = '';
      } },
      begroeten: { can: () => !!greetFor && !greetFor.gone && !greetFor.busy && onScreen(greetFor), run: function* () { yield* greetRun(greetFor); } },
      // Heidi: the white lama. Lots of personality, mostly annoying: she won't cooperate and hates everything.
      lama: { run: function* () {
        const side = rnd() < .5 ? -1 : 1, H0 = { cx: W / 2 + side * (W / 2 + 130), s: .86, set: 'heidi', face: -side, eyes: 'vies' };
        const h = actor(H0);
        const near = () => kx() + side * 210;
        const huff = () => emote(pick(['angry', 'dots', 'angry']), 1.6, h);
        const smug = function* (sec) { h.lockPose = true; h.pose = 'tilt'; yield* wait(sec); h.lockPose = false; h.pose = 'stand'; };
        const leave = function* (slow) {
          h.eyes = 'vies'; h.face = side; yield* smug(1.2);
          yield* actorTo(h, W / 2 + side * (W / 2 + 150), slow ? 26 : 38);
        };
        const spit = function* () {
          h.face = kx() > h.cx ? 1 : -1; h.eyes = 'vies'; h.mouth = .4; yield* wait(.5); h.mouth = 1;
          const m0 = A.llamaPoint(h, 30, 380); let p = 0, hit = false;
          const f = fx('front', 0, (g) => {
            const t2 = kp(120, 300), x = lerp(m0.x, t2.x, p), y = lerp(m0.y, t2.y, p) - Math.sin(p * Math.PI) * 60;
            g.fillStyle = 'rgba(235,245,240,.92)';
            if (!hit) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillRect(x - 12 * h.face, y - 3, 10, 6); }
            else { const t3 = kp(120, 300); for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(t3.x + Math.cos(k * 1.7) * 18, t3.y + Math.sin(k * 2.3) * 14 + (cur.t % 4) * 2, 6 - k * .5, 0, 7); g.fill(); } }
          });
          yield* tween(.55, q => { p = q; }); h.mouth = 0; hit = true;
          kam.eyes = 'dicht'; kam.x += -h.face * 6; emote('sweat', 3); yield* shiver(.6, 4);
          return f;
        };
        kam.face = side;
        yield* actorTo(h, near(), 30);
        h.face = -side; emote('?', 2);
        const plan = (A.params && A.params.get('heidi')) || pick(['spuug', 'blokkeer', 'hoed', 'koppig', 'naapen', 'kont', 'trap']);
        if (plan === 'spuug') {
          yield* wait(2.5); h.eyes = 'rol'; h.eyeT = 0; yield* wait(3); huff(); yield* wait(1.5);
          const f = yield* spit(); yield* wait(1.5);
          h.eyes = 'blij'; yield* smug(3); h.eyes = 'vies'; yield* wait(1.2);
          kam.eyes = 'boos'; emote('angry', 2); yield* wait(2.2); stop(f);
          yield* leave(true); kam.eyes = ''; emote('dots', 2.5); yield* wait(2.5);
        } else if (plan === 'blokkeer') {   // she plants herself right in front of him, again and again
          h.layer = 'front';
          for (let k = 0; k < 4; k++) {
            const tx = kx() + (k % 2 ? -1 : 1) * 25;
            yield* actorTo(h, tx, 70); h.face = k % 2 ? 1 : -1; h.eyes = 'vies';
            yield* wait(1.4);
            const dx = (k % 2 ? 1 : -1) * 120; kam.eyes = 'boos';
            yield* walkTo(dx, 80); kam.face = dx > 0 ? -1 : 1; yield* wait(.6);
            if (k === 1) { h.eyes = 'rol'; h.eyeT = 0; yield* wait(2); }
          }
          huff(); yield* wait(1.2); h.layer = 'back';
          yield* leave(false); kam.eyes = ''; yield* walkTo(0, 60); emote('dots', 2); yield* wait(2);
        } else if (plan === 'hoed') {   // she takes his hat and walks off with it (he gets it back later)
          const O = KamielOutfits.OUTFITS, hat = A.outfit().find(id => (O.find(o => o.id === id) || {}).slot === 'hoofd');
          yield* actorTo(h, kx() + side * 110, 40); h.face = -side; yield* wait(1.2);
          if (hat) {
            kam.eyes = 'groot'; h.head = .15; yield* wait(.4); kam.outfit = A.outfit().filter(id => id !== hat); h.outfit = [hat]; h.head = 0; emote('sparks', 1, h);
            yield* wait(1); emote('!', 1.5); kam.eyes = 'triest'; h.eyes = 'blij'; yield* smug(2.5);
          } else {
            h.outfit = ['kroon']; emote('sparks', 1.2, h); h.eyes = 'blij'; yield* smug(2.5); kam.eyes = 'groot'; emote('?', 2);
          }
          h.eyes = 'vies';
          for (let k = 0; k < 2; k++) { yield* actorTo(h, kx() - side * 180, 45); h.lockPose = true; h.pose = 'tilt'; yield* wait(1); h.lockPose = false; yield* actorTo(h, kx() + side * 200, 45); }
          yield* leave(true); kam.eyes = ''; yield* wait(1.5);
        } else if (plan === 'koppig') {   // he asks her to move; she won't
          yield* actorTo(h, kx() + side * 140, 30); h.face = -side; yield* wait(1.5);
          kam.face = side; kam.head = .12; yield* walkTo(side * 55, 40); kam.face = side;
          for (let k = 0; k < 3; k++) {   // nudge, nudge, push
            const x0 = kam.x; yield* tween(.25, q => { kam.x = x0 + side * 14 * Math.sin(q * Math.PI); });
            h.sq = .96; yield* wait(.2); h.sq = 1; if (k === 1) { h.eyes = 'boos'; huff(); } yield* wait(.8);
          }
          h.sq = .82; h.eyes = 'dicht'; emote('dots', 4, h); kam.head = 0;   // she lies down. on purpose.
          yield* wait(3); kam.eyes = 'triest'; emote('sweat', 2);
          yield* walkTo(0, 45); kam.face = side; yield* wait(4);
          h.sq = 1; h.eyes = 'vies'; yield* wait(1.2);
          yield* leave(true); kam.eyes = ''; yield* wait(1.5);
        } else if (plan === 'naapen') {   // she mocks everything he does, badly
          yield* wait(1.5);
          yield* hop(55, .5); yield* wait(.5);
          h.sq = .9; yield* wait(.25); h.sq = 1; yield* tween(.7, q => { h.feet = FEET - Math.sin(q * Math.PI) * 18; }); h.feet = FEET;
          h.eyes = 'rol'; h.eyeT = 0; yield* wait(2.2); h.eyes = 'vies';
          kam.face = -side; yield* wait(1); h.face = side; yield* wait(1.2); kam.face = side; yield* wait(.5); h.face = -side;
          kam.eyes = 'blij'; emote('heart', 1.5); yield* wait(1.5); h.eyes = 'dicht'; emote('dots', 2, h); yield* wait(2); kam.eyes = 'triest';
          huff(); yield* leave(false); kam.eyes = ''; yield* wait(1.5);
        } else if (plan === 'kont') {   // turns her back on him, wiggles, and something smells
          yield* wait(1.5); h.face = side; h.eyes = 'vies'; yield* wait(1);
          yield* tween(1.2, q => { h.sx = 1 + Math.sin(q * 25) * .04; }); h.sx = 1;
          const b = A.llamaPoint(h, 770, 650);
          const gas = particles('front', { until: cur.t + 1.6, emit: (ps) => { if (rnd() < .5) ps.push(P({ x: b.x, y: b.y, vx: (rnd() - .5) * 40 - side * 30, vy: -10 - rnd() * 20, life: 4 })); },
            draw: (g, p, a) => { g.fillStyle = `rgba(140,200,60,${.35 * (1 - a)})`; g.beginPath(); g.arc(p.x, p.y, 8 + a * 34, 0, 7); g.fill(); } });
          yield* wait(1.5); kam.eyes = 'groot'; emote('!?', 2); kam.face = -side; yield* wait(2.5); kam.eyes = 'dicht'; emote('sweat', 3);
          yield* actorTo(h, W / 2 + side * (W / 2 + 150), 34); stop(gas); kam.face = side; kam.eyes = ''; yield* wait(2);
        } else {   // trap: she kicks something over (well, she tries)
          const gh = groundHits();
          if (gh.length) {
            const tgt = gh.sort((a2, b2) => Math.abs(a2.x - h.cx) - Math.abs(b2.x - h.cx))[0], tx = tgt.x + tgt.w / 2;
            yield* actorTo(h, tx + (h.cx > tx ? 1 : -1) * (tgt.w / 2 + 50), 40); h.face = h.cx > tx ? -1 : 1;
            h.eyes = 'boos'; let wob = 0;
            cur.itemOff = (it) => it === tgt.it ? { r: Math.sin(wob * 18) * .1 * Math.max(0, 1 - wob / 2) } : null;
            h.head = .18; yield* wait(.2); h.head = 0; yield* tween(2.2, () => { wob += st.dt; });
            cur.itemOff = null; h.face = kx() > h.cx ? 1 : -1; h.eyes = 'vies'; yield* smug(2);
          } else { h.eyes = 'rol'; h.eyeT = 0; yield* wait(3); }
          kam.eyes = 'groot'; emote('!?', 2); yield* wait(2); kam.eyes = '';
          yield* leave(false); yield* wait(1.5);
        }
      } },
      // the doorbell: a camera still appears in a frame next to Kamiel, and he goes to have a look
      deurbel: { run: function* () {
        kam.eyes = 'groot'; emote('!', 1.6);
        yield* tween(.3, p => { kam.y = Math.sin(p * Math.PI) * 45; }); kam.y = 0;
        yield* until(() => hitsOf(2, hh => hh.it.door).length > 0, 1.5);
        const hh = hitsOf(2, h2 => h2.it.door)[0], dogs = A.doorPets ? A.doorPets() : !!(hh && hh.it.doorPets);
        // with a camera still: walk up to its frame. Without: look at the edge of the screen, where the door would be
        const side = hh ? (hh.x + hh.w / 2 - W / 2 > kam.x ? 1 : -1) : sideOfRoom();
        const fx0 = hh ? hh.x + hh.w / 2 : W / 2 + side * (W / 2 + 40);
        if (hh) yield* walkTo(clamp(fx0 - W / 2 - side * (hh.w / 2 + 70), -W / 2 + 90, W / 2 - 90), 110, 10);
        else yield* walkTo(side * 140, 90);
        kam.face = side; kam.eyes = ''; kam.head = .1; emote('?', 2); yield* wait(2);
        yield* tween(2.2, p => { kam.head = .08 + Math.sin(p * 14) * .05; });
        kam.head = 0;
        if (dogs) {   // the dogs hear it too
          const a = pet('wifi', -side), b = pet('snoet', -side);
          const spot = (dx) => clamp(fx0 + side * dx, 60, W - 60);
          yield* par(
            (function* () { yield* petTo(a, spot(-60), PET.wifi.run * 1.4); for (let k = 0; k < 4; k++) { yield* petJump(a, 16, .28); emote('burst', .45, a); yield* wait(.25); } })(),
            (function* () { yield* wait(.5); yield* petTo(b, spot(-110), PET.snoet.run * 1.4); for (let k = 0; k < 5; k++) { yield* petJump(b, 12, .22); emote('burst', .4, b); yield* wait(.2); } })());
          kam.eyes = 'groot'; emote('sweat', 2.5); yield* wait(1.5);
          yield* par(petLeave(a, -side, PET.wifi.run * 1.6), (function* () { yield* wait(.3); yield* petLeave(b, -side, PET.snoet.run * 1.6); })());
        } else { emote('dots', 2.2); yield* wait(2.2); }
        kam.eyes = 'blij'; emote(rnd() < .5 ? 'heart' : '!', 1.6); yield* wait(1.8); kam.eyes = '';
        yield* walkTo(0, 70);
      } },
      // someone stands in front of the tablet: Kamiel comes closer to have a look, then goes back
      kijken: { run: function* () {
        kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.1); kam.eyes = '';
        yield* approach(1.6, 390, 1370, FEET + 75, 2.6);
        kam.head = .06; yield* wait(.6); kam.eyes = 'dicht'; yield* wait(.2); kam.eyes = ''; yield* wait(.8);
        emote(pick(['heart', '?', 'hearts']), 2); kam.eyes = 'blij'; yield* wait(2.2);
        kam.eyes = ''; kam.head = 0; yield* wait(.5);
        yield* backOff(2.4);
      } },
      wifi: { run: function* () { yield* petVisit('wifi'); } },
      snoet: { run: function* () { yield* petVisit('snoet'); } },
      pippa: { run: function* () { yield* petVisit('pippa'); } },
      pebbels: { run: function* () { yield* petVisit('pebbels'); } },
      dobby: { run: function* () { yield* petVisit('dobby'); } },
      omdraaien: { walk: true, run: function* () {
        const d = rnd() < .5 ? -1 : 1;
        yield* walkTo(d * 150, 70); yield* wait(.8); emote('?', 1.8); yield* wait(1.6);
        kam.face = -d; kam.eyes = 'groot'; emote('!', 1.2); yield* wait(1.1); kam.eyes = '';
        yield* walkTo(0, 85); yield* travel(-d, 70);
      } },
      camera: { walk: true, run: function* () {
        const d = rnd() < .5 ? -1 : 1;
        yield* walkTo(d * (W / 2 + 90), 70); yield* wait(2.5);
        yield* walkTo(d * (W / 2 - 120), 55); kam.face = -d;
        yield* wait(.5); emote('dots', 3.5); yield* wait(3.5); emote('!?', 1.6); yield* wait(1.6);
        // now the camera does follow
        const target = A.center(d); let kw = A.cam() + kam.x;
        kam.face = d; kam.pose = 'walk'; kam.rate = 6;
        while (Math.abs(A.cam() - target) > .5 || Math.abs(kw - target) > .5) {
          const c = A.cam(); A.setCam(Math.abs(target - c) < 120 * st.dt ? target : c + d * 120 * st.dt);
          kw = Math.abs(target - kw) < 70 * st.dt ? target : kw + d * 70 * st.dt;
          kam.x = kw - A.cam(); if (Math.abs(kw - target) < .5) kam.pose = '';
          yield;
        }
        kam.x = 0; kam.pose = ''; A.arrive();
      } },
      inspecteren: { can: () => groundHits().length > 0, run: function* () {
        const hh = pick(groundHits()), tx = hh.x + hh.w / 2 - W / 2, side = tx > kam.x ? 1 : -1;
        yield* walkTo(clamp(tx - side * (hh.w / 2 + 60), -W / 2 + 80, W / 2 - 80), 60);
        kam.face = side; kam.head = .12; emote('?', 2.4); yield* wait(2.4);
        yield* tween(3, p => { kam.head = .1 + Math.sin(p * 22) * .05; });
        kam.head = -.05; yield* wait(.8); kam.head = .15; yield* wait(1.2); kam.head = 0;
        emote(rnd() < .5 ? '!' : 'dots', 1.8); yield* wait(1.8);
        yield* walkTo(0, 60);
      } },
      schrikken: { run: function* () {
        kam.eyes = 'groot'; emote('!', 2.6);
        yield* tween(.35, p => { kam.y = Math.sin(p * Math.PI) * 70; kam.sq = 1 + .1 * Math.sin(p * Math.PI); }); kam.y = 0; kam.sq = 1;
        yield* shiver(1.6, 7); emote('sweat', 3); yield* shiver(2, 2.5);
        kam.eyes = ''; yield* wait(1);
      } },
      rondje: { run: function* () {
        const d = rnd() < .5 ? -1 : 1;
        yield* walkTo(d * (W / 2 + 90), 75); yield* wait(1.5);
        kam.x = -d * (W / 2 + 90); yield* walkTo(0, 75);
        emote('dots', 2); yield* wait(2);
      } },
      springen: { run: function* () {
        for (let k = 0; k < 3; k++) { yield* hop(70 + k * 25, .55 + k * .08); yield* wait(.25); }
        emote('sparks', 2); yield* wait(1.5);
      } },
      vergeten: { walk: true, run: function* () {
        const d = rnd() < .5 ? -1 : 1;
        yield* wait(5); emote('dots', 3); yield* wait(3.5);
        kam.eyes = 'groot'; emote('!', 1.4); yield* wait(1); kam.face = d; yield* wait(.4); kam.eyes = '';
        yield* travel(d, 280, { rate: 16 });
        kam.mouth = .5; emote('sweat', 3); yield* tween(3, p => { kam.sq = 1 + Math.sin(p * 30) * .02; kam.mouth = .3 + .3 * Math.abs(Math.sin(p * 15)); });
        kam.mouth = 0; kam.sq = 1;
      } },
      rondkijken: { run: function* () {
        for (let k = 0; k < 6; k++) {
          kam.face = -kface(); kam.head = pick([0, -.12, .06]);
          if (k % 2) emote(k === 5 ? '!?' : '?', 1); yield* wait(.6 + rnd() * .9);
        }
        kam.head = 0; yield* wait(1);
      } },
      lucht: { can: () => skyThings().length > 0, run: function* () {
        const t = pick(skyThings()); kam.face = t.x > kx() ? 1 : -1;
        yield* tween(1, p => { kam.head = -.24 * ez(p); });
        emote('sparks', 5); yield* wait(5.5);
        kam.eyes = 'blij'; yield* wait(1.5); kam.eyes = '';
        yield* tween(1, p => { kam.head = -.24 * (1 - ez(p)); });
      } },
      slapen: { run: function* () {
        kam.eyes = 'dicht'; yield* tween(2, p => { kam.head = .18 * ez(p); });
        emote('zzz', 13); yield* tween(13, p => { kam.sq = 1 + Math.sin(p * 18) * .015; });
        kam.eyes = 'groot'; kam.head = -.05; emote('!', 1.8);
        yield* tween(.3, p => { kam.y = Math.sin(p * Math.PI) * 50; }); kam.y = 0;
        yield* shiver(1.2, 4); kam.head = 0; yield* wait(1.2); kam.eyes = '';
      } },
      yoga: { run: function* () {
        kam.eyes = 'dicht'; emote('sparks', 3.5); yield* wait(3);
        yield* tween(2, p => { kam.r = -.28 * ez(p); }); yield* wait(3);
        yield* tween(2, p => { kam.r = -.28 + .56 * ez(p); }); yield* wait(3);
        yield* tween(1.5, p => { kam.r = .28 * (1 - ez(p)); kam.sq = 1 - .18 * ez(p); kam.head = .2 * ez(p); }); yield* wait(3);
        yield* tween(1.5, p => { kam.sq = .82 + .18 * ez(p); kam.head = .2 - .4 * ez(p); kam.y = 14 * ez(p); }); yield* wait(2.5);
        yield* tween(1, p => { kam.head = -.2 * (1 - p); kam.y = 14 * (1 - p); });
        kam.eyes = 'blij'; emote('sparks', 2); yield* wait(2); kam.eyes = '';
      } },
      strekken: { run: function* () {
        yield* tween(1.8, p => { const e = ez(p); kam.sq = 1 + .18 * e; kam.sx = 1 - .08 * e; kam.head = -.18 * e; }); kam.eyes = 'dicht'; kam.mouth = .7;
        yield* wait(1.4); kam.mouth = 0;
        yield* tween(1, p => { const e = ez(p); kam.sq = 1.18 - .28 * e; kam.sx = .92 + .28 * e; kam.head = -.18 + .3 * e; });
        yield* wait(1.4);
        yield* tween(1, p => { const e = ez(p); kam.sq = .9 + .1 * e; kam.sx = 1.2 - .2 * e; kam.head = .12 * (1 - e); });
        kam.eyes = 'blij'; yield* wait(1.5); kam.eyes = '';
      } },
      passen: { run: function* () {
        const O = KamielOutfits.OUTFITS, hats = O.filter(o => o.slot === 'hoofd').map(o => o.id), eyes = O.filter(o => o.slot === 'ogen').map(o => o.id);
        for (let k = 0; k < 14; k++) {
          const pickd = [pick(hats)]; if (rnd() < .6) pickd.push(pick(eyes));
          withOutfit(pickd); emote('sparks', .5); kam.face = k % 3 ? kam.face : -kface();
          yield* wait(.65);
        }
        emote(pick(['heart', '!', 'dots']), 2); yield* wait(2.5);
        kam.outfit = null; yield* wait(.8);
      } },
      verstoppen: { can: () => hitsOf(1).length > 0, run: function* () {
        const hh = pick(hitsOf(1)), tx = hh.x + hh.w / 2 - W / 2, sTo = clamp(hh.h * .7 / 225, .2, .7), fTo = hh.foot - 3;
        kam.face = tx > kam.x ? 1 : -1; kam.pose = 'walk'; kam.rate = 5;
        yield* tween(5, p => { const e = ez(p); kam.x = lerp(0, tx, e); kam.s = lerp(1, sTo, e); kam.feet = lerp(FEET, fTo, e); if (p > .55) kam.layer = 'far'; else if (p > .2) kam.layer = 'mid'; });
        kam.pose = ''; yield* wait(4);
        // peeks out, twice
        for (let k = 0; k < 2; k++) {
          const dx = (k ? -1 : 1) * hh.w * .45; kam.face = dx > 0 ? 1 : -1; const x0 = kam.x;
          yield* tween(.8, p => { kam.x = x0 + dx * ez(p); }); kam.layer = 'mid'; emote('?', 1.4, null); yield* wait(1.4);
          kam.layer = 'far'; yield* tween(.6, p => { kam.x = x0 + dx * (1 - ez(p)); }); yield* wait(2.5);
        }
        kam.face = tx > 0 ? -1 : 1; kam.pose = 'walk'; const x1 = kam.x;
        yield* tween(5, p => { const e = ez(p); kam.x = lerp(x1, 0, e); kam.s = lerp(sTo, 1, e); kam.feet = lerp(fTo, FEET, e); kam.layer = p > .8 ? 'front' : p > .45 ? 'mid' : 'far'; });
        kam.feet = null; kam.pose = ''; kam.layer = 'front';
      } },
      omduwen: { can: () => hitsOf(1).length > 0, run: function* () {
        const hh = pick(hitsOf(1)), tx = hh.x + hh.w / 2 - W / 2, side = tx > 0 ? 1 : -1, sTo = clamp(hh.h * .45 / 225, .18, .6), fTo = hh.foot + 2;
        const goalX = tx - side * (hh.w / 2 + 128 * sTo * .35);
        kam.face = side; kam.eyes = 'boos'; emote('angry', 1.5); yield* wait(1.2);
        kam.pose = 'walk'; kam.rate = 14; kam.layer = 'mid';
        yield* tween(2.4, p => { kam.x = lerp(0, goalX, p); kam.s = lerp(1, sTo, p); kam.feet = lerp(FEET, fTo, p); });
        let wob = 0;
        cur.itemOff = (it) => it === hh.it ? { r: Math.sin(wob * 20) * .06 * Math.max(0, 1 - wob / 2.5) } : null;
        kam.pose = ''; kam.eyes = 'x';
        const x0 = kam.x;
        yield* tween(.6, p => { wob += st.dt; kam.x = x0 - side * 40 * sTo * Math.sin(p * Math.PI / 2); kam.r = -side * .3 * (1 - p); });
        emote('stars', 3.5);
        yield* tween(3, () => { wob += st.dt; }); kam.r = 0; kam.eyes = '';
        kam.face = -side; kam.pose = 'walk'; kam.rate = 5; const x1 = kam.x;
        yield* tween(4.5, p => { const e = ez(p); kam.x = lerp(x1, 0, e); kam.s = lerp(sTo, 1, e); kam.feet = lerp(fTo, FEET, e); });
        kam.feet = null; kam.pose = ''; kam.layer = 'front';
      } },
      duizelig: { run: function* () {
        kam.eyes = 'spiraal'; emote('stars', 9);
        yield* tween(9, p => { const a = p * 9 * 2.2; kam.r = Math.sin(a) * .12; kam.x = Math.sin(a * .5) * 14; });
        kam.r = 0; kam.x = 0; kam.eyes = ''; yield* wait(1);
      } },
      triest: { run: function* () {
        kam.eyes = 'triest'; yield* tween(1.5, p => { kam.head = .15 * ez(p); });
        const drops = particles('front', { until: 10.5, emit: (ps) => { if (rnd() < .5) { const h = kp(200, -150); ps.push(P({ x: h.x - 40 + rnd() * 80, y: h.y + 10, vy: 260, life: .5 })); } },
          draw: (g, p) => { g.fillStyle = 'rgba(126,200,255,.9)'; g.fillRect(p.x, p.y, 2, 9); } });
        const cl = fx('front', 0, (g) => { const h = kp(200, -150); sprC(g, SP.raincloud, h.x, h.y, 7); });
        emote('tears', 11); yield* wait(11); stop(cl); stop(drops);
        yield* tween(1.2, p => { kam.head = .15 * (1 - ez(p)); }); kam.eyes = '';
      } },
      blij: { run: function* () {
        kam.eyes = 'blij'; emote('hearts', 8);
        for (let k = 0; k < 4; k++) { yield* hop(30, .4); kam.face = -kface(); yield* wait(.5); }
        emote('sparks', 3); yield* wait(3); kam.eyes = '';
      } },
      zweten: { run: function* () {
        emote('sweat', 10); kam.eyes = 'triest';
        yield* tween(10, p => { kam.mouth = .3 + .35 * Math.abs(Math.sin(p * 40)); kam.sq = 1 + Math.sin(p * 40) * .012; kam.head = .06; });
        kam.mouth = 0; kam.eyes = ''; kam.head = 0; kam.sq = 1;
      } },
      koud: { run: function* () {
        emote('snow', 12);
        yield* tween(1.5, p => { kam.cold = p; });
        const breath = particles('front', { until: 11, emit: (ps) => { if (rnd() < .06) { const m = kp(20, 390); ps.push(P({ x: m.x, y: m.y, vx: kface() * 30, vy: -14, life: 1.6 })); } },
          draw: (g, p, a) => { g.fillStyle = `rgba(240,248,255,${.6 * (1 - a)})`; g.beginPath(); g.arc(p.x, p.y, 4 + a * 14, 0, 7); g.fill(); } });
        yield* shiver(4, 3);
        withOutfit(['muts', 'sjaal']); emote('sparks', .6);
        yield* shiver(6, 2.4);
        stop(breath);
        yield* tween(1.5, p => { kam.cold = 1 - p; });
        yield* wait(1); kam.outfit = null;
      } },
      grondje: { can: () => groundHits().length > 0, run: function* () {
        const hh = groundHits().sort((a, b) => a.h - b.h)[0], tx = hh.x + hh.w / 2 - W / 2, side = tx > kam.x ? 1 : -1;
        kam.head = .2;
        yield* walkTo(clamp(tx - side * (hh.w / 2 + 50), -W / 2 + 80, W / 2 - 80), 40);
        kam.face = side; emote('?', 2); yield* wait(2.5);
        yield* tween(2, p => { kam.head = .2 + Math.sin(p * 12) * .04; });
        emote(rnd() < .5 ? 'heart' : 'dots', 2); yield* wait(2);
        kam.head = 0; yield* walkTo(0, 55);
      } },
      zweven: { run: function* () {
        emote('sparks', 9); kam.eyes = 'groot';
        yield* tween(3, p => { kam.y = 130 * ez(p); kam.r = .08 * Math.sin(p * 4); }); kam.eyes = 'blij';
        yield* tween(4, p => { kam.y = 130 + Math.sin(p * 9) * 10; kam.r = .1 * Math.sin(p * 6); });
        yield* tween(2.5, p => { kam.y = 130 * (1 - ez(p)); kam.r = .08 * (1 - p) * Math.sin(p * 5); });
        kam.y = 0; kam.r = 0; kam.sq = .9; yield* wait(.15); kam.sq = 1; kam.eyes = ''; yield* wait(1);
      } },
      reus: { run: function* () {
        const v = view({});
        yield* tween(3, p => { kam.s = 1 + 1.3 * ez(p); });
        emote('!', 1.5); yield* tween(2.5, () => shake(v, 4)); v.dx = v.dy = 0;
        yield* wait(1.5);
        yield* tween(2.5, p => { kam.s = 2.3 - 1.3 * ez(p); }); kam.s = 1; cur.post = null;
        emote('dots', 2); yield* wait(2);
      } },
      oordeel: { can: () => photoHits().length > 0, run: function* () {
        const hh = pick(photoHits()), tx = hh.x + hh.w / 2 - W / 2, side = tx > kam.x ? 1 : -1;
        yield* walkTo(clamp(tx - side * (hh.w / 2 + 70), -W / 2 + 80, W / 2 - 80), 55);
        kam.face = side; kam.eyes = 'vies'; kam.head = -.06; emote('dots', 4); yield* wait(4.5);
        kam.face = -side; yield* wait(1.2); kam.face = side; yield* wait(1.5);   // looks at the camera: "really?"
        emote('angry', 1.6); yield* wait(2); kam.head = 0; kam.eyes = '';
        yield* walkTo(0, 55);
      } },
      verliefd: { can: () => photoHits().length > 0, run: function* () {
        const hh = pick(photoHits()), tx = hh.x + hh.w / 2 - W / 2, side = tx > kam.x ? 1 : -1;
        yield* walkTo(clamp(tx - side * (hh.w / 2 + 70), -W / 2 + 80, W / 2 - 80), 55);
        kam.face = side; kam.eyes = 'hart'; kam.blush = true; emote('hearts', 8);
        yield* tween(8, p => { kam.head = .05 + Math.sin(p * 10) * .04; kam.sq = 1 + Math.sin(p * 20) * .01; });
        kam.head = 0; kam.eyes = ''; kam.blush = false; yield* walkTo(0, 55);
      } },
      dansen: { run: function* () {
        withOutfit([]); emote('notes', 14);
        const lights = fx('front', 0, (g) => { g.save(); g.globalCompositeOperation = 'lighter';
          ['rgba(255,60,160,.18)', 'rgba(60,200,255,.18)', 'rgba(255,230,60,.15)'].forEach((c, k) => { const x = W / 2 + Math.sin(cur.t * 2 + k * 2) * 260;
            g.fillStyle = c; g.beginPath(); g.ellipse(x, FEET - 6, 90, 18, 0, 0, 7); g.fill(); }); g.restore(); });
        yield* tween(14, p => { const b = p * 14 / .45, ph = b % 1; kam.y = Math.abs(Math.sin(ph * Math.PI)) * 18; kam.face = Math.floor(b / 2) % 2 ? 1 : -1;
          kam.r = Math.sin(p * 14 * 7) * .08; kam.head = Math.sin(ph * Math.PI * 2) * .1; kam.eyes = Math.floor(b / 8) % 2 ? 'blij' : ''; });
        stop(lights); kam.y = 0; kam.r = 0; kam.head = 0; kam.eyes = ''; kam.outfit = null; yield* wait(.8);
      } },
      ijsberen: { run: function* () {
        emote('dots', 3);
        for (let k = 0; k < 4; k++) { yield* walkTo(k % 2 ? -120 : 120, 60); yield* wait(.4); }
        yield* walkTo(0, 60); emote('?', 1.5); yield* wait(1.5);
      } },
      wegrennen: { run: function* () {
        const d = sideOfRoom();
        kam.eyes = 'groot'; emote('!', 1.5); yield* tween(.3, p => { kam.y = Math.sin(p * Math.PI) * 50; }); kam.y = 0;
        yield* walkTo(d * (W / 2 + 100), 300, 18); kam.eyes = '';
        yield* wait(4);
        kam.eyes = 'groot'; emote('sweat', 9);
        const x0 = kam.x; kam.face = -d; kam.pose = 'walk'; kam.rate = 3;
        yield* tween(8, p => { kam.x = lerp(x0, 0, p) + (rnd() - .5) * 3; if ((p * 8) % 2 > 1.7) kam.face = d; else kam.face = -d; });
        kam.pose = ''; kam.face = -d; yield* shiver(1.5, 2); kam.eyes = '';
      } },
      wolk: { run: function* () {
        const d = 1;   // the clouds drift with the wind, to the right
        kam.face = d; kam.head = -.22; emote('sparks', 2);
        yield* walkTo(W / 2 - 72, 40);
        // bonk: the edge of the scene
        const v = view({}); kam.eyes = 'x'; emote('stars', 3.5); emote('burst', .9);
        yield* tween(.4, p => { kam.x = W / 2 - 72 - 30 * Math.sin(p * Math.PI / 2); kam.r = -.25 * (1 - p); shake(v, 6 * (1 - p)); });
        cur.post = null; kam.r = 0; kam.head = 0; yield* wait(3); kam.eyes = '';
        yield* walkTo(0, 60);
      } },
      'moonwalk-weg': { walk: true, run: function* () {
        const d = rnd() < .5 ? -1 : 1;
        withOutfit(['zonnebril', 'hoed']); emote('sparks', 1); yield* wait(1.2);
        emote('notes', 16);
        yield* travel(d, 55, { face: -d, rate: -5, each: () => { kam.head = Math.sin(cur.t * 8) * .05; } });
        kam.head = 0; kam.face = -d; yield* wait(1.5); emote('sparks', 1); yield* wait(.4); kam.outfit = null;
      } },
      moonwalk: { run: function* () {
        withOutfit(['zonnebril', 'hoed']); emote('sparks', 1); yield* wait(1.2); emote('notes', 11);
        for (let k = 0; k < 4; k++) {
          const d = k % 2 ? 1 : -1, x0 = kam.x, x1 = d * 90; kam.face = -d; kam.pose = 'walk'; kam.rate = -5;
          yield* tween(Math.abs(x1 - x0) / 55, p => { kam.x = lerp(x0, x1, p); });
        }
        const x0 = kam.x; kam.face = x0 > 0 ? -1 : 1;
        yield* tween(Math.abs(x0) / 55, p => { kam.x = lerp(x0, 0, p); });
        kam.pose = ''; yield* hop(25, .35); kam.head = -.15; yield* wait(1.2); kam.head = 0; kam.outfit = null;
      } },
      zoom: { run: function* () {
        const v = view({ z: 1 });
        const at = (p) => { const h = kp(190, 250); v.z = lerp(1, 3.6, p); v.cx = lerp(W / 2, h.x, p); v.cy = lerp(H / 2, h.y, p); };
        yield* tween(7, p => at(ez(p)));
        yield* wait(1.5); kam.pose = 'blink'; yield* wait(.18); kam.pose = ''; yield* wait(.9); kam.pose = 'blink'; yield* wait(.15); kam.pose = '';
        yield* wait(1.5);
        yield* tween(4.5, p => at(1 - ez(p))); cur.post = null;
      } },
      sniper: { run: function* () {
        const from = rnd() < .5 ? { x: -30, y: 60 + rnd() * 120 } : { x: W + 30, y: 60 + rnd() * 120 };
        let on = 0, dot = { x: 0, y: 0 };
        fx('front', 0, (g) => {
          if (on <= 0) return;
          const b = kp(470, 800); dot.x = b.x + Math.sin(cur.t * 2.3) * 22 + Math.sin(cur.t * 7.1) * 5; dot.y = b.y + Math.cos(cur.t * 1.7) * 26;
          g.save(); g.globalAlpha = on; g.strokeStyle = 'rgba(255,30,40,.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(dot.x, dot.y); g.stroke();
          g.fillStyle = 'rgba(255,40,40,.35)'; g.beginPath(); g.arc(dot.x, dot.y, 9, 0, 7); g.fill(); g.fillStyle = '#ff2020'; g.beginPath(); g.arc(dot.x, dot.y, 3.5, 0, 7); g.fill(); g.restore();
        });
        yield* tween(1.5, p => { on = p; });
        yield* wait(1.5); kam.eyes = 'groot'; kam.face = from.x < W / 2 ? -1 : 1; emote('!', 1.8); yield* wait(1.4);
        emote('sweat', 6); yield* shiver(6, 3);
        yield* tween(.5, p => { on = 1 - p; }); on = 0;
        yield* wait(1); kam.eyes = ''; emote('dots', 2); yield* wait(2);
      } },
      laser: { run: function* () {
        const dot = { x: kx() + 200, y: FEET - 8, on: 0 };
        fx('front', 0, (g) => { if (!dot.on) return; g.save(); g.globalAlpha = dot.on; g.fillStyle = 'rgba(255,40,40,.35)'; g.beginPath(); g.ellipse(dot.x, dot.y, 12, 5, 0, 0, 7); g.fill();
          g.fillStyle = '#ff2020'; g.beginPath(); g.ellipse(dot.x, dot.y, 4, 2.4, 0, 0, 7); g.fill(); g.restore(); });
        yield* tween(.6, p => { dot.on = p; });
        kam.eyes = 'groot'; kam.face = dot.x > kx() ? 1 : -1; kam.head = .12; emote('!', 1.2); yield* wait(1.5);
        for (let k = 0; k < 5; k++) {
          const tx = dot.x - W / 2 - (dot.x > kx() ? 1 : -1) * 60;
          kam.face = dot.x > kx() ? 1 : -1;
          yield* tween(.4, p => { kam.sq = 1 - .12 * p; });
          const x0 = kam.x; kam.sq = 1;
          yield* tween(.5, p => { kam.x = lerp(x0, tx, p); kam.y = Math.sin(p * Math.PI) * 45; }); kam.y = 0;
          // the dot zips away just before he lands on it
          const nx = clamp(W / 2 + (rnd() - .5) * 600, 100, W - 100), ox = dot.x;
          yield* tween(.25, p => { dot.x = lerp(ox, nx, p); });
          yield* wait(.5 + rnd() * .8);
        }
        yield* tween(.4, p => { dot.on = 1 - p; }); dot.on = 0;
        kam.head = 0; kam.eyes = ''; emote('?', 2); yield* wait(1); kam.face = -kface(); yield* wait(1.2);
        yield* walkTo(0, 60);
      } },
      verveeld: { run: function* () {
        const d = rnd() < .5 ? -1 : 1, t0 = cur.t;
        emote('dots', 2.5); yield* tween(1.5, p => { kam.sq = 1 - .05 * Math.sin(p * Math.PI); }); yield* wait(.8);
        yield* walkTo(d * (W / 2 + 100), 60);
        yield* until(() => cur.t - t0 > 47, 50);
        kam.eyes = 'groot'; kam.mouth = .6;
        yield* walkTo(0, 280, 18);
        kam.face = d; emote('sweat', 5);
        yield* tween(4, p => { kam.mouth = .3 + .4 * Math.abs(Math.sin(p * 30)); kam.sq = 1 + Math.sin(p * 30) * .02; if (p > .5) kam.face = -d; });
        kam.mouth = 0; kam.sq = 1; kam.eyes = '';
      } },
      'lens-staren': { run: function* () {
        yield* approach(3.2, 190, 250, H * .45, 4);
        yield* tween(2, p => { kam.blur = 3 * p; });
        yield* wait(2); kam.pose = 'blink'; yield* wait(.2); kam.pose = ''; yield* wait(3);
        yield* backOff(4);
      } },
      'lens-ruiken': { run: function* () {
        yield* approach(4.3, 40, 330, H * .5, 4);
        kam.blur = 1.2;
        const fog = fx('screen', 0, (g) => { const n = kp(10, 340), a = Math.min(.4, (cur.t - fogT) * .05);
          const gr = g.createRadialGradient(n.x, n.y, 10, n.x, n.y, 260); gr.addColorStop(0, `rgba(235,240,245,${a})`); gr.addColorStop(1, 'rgba(235,240,245,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
        const fogT = cur.t;
        for (let k = 0; k < 6; k++) { emote('sniff', .5); yield* tween(.35, p => { kam.s = 4.3 + Math.sin(p * Math.PI) * .08; }); yield* wait(.3); }
        yield* wait(1.2); kam.eyes = 'blij'; yield* wait(1.2); kam.eyes = '';
        yield* backOff(4); stop(fog);
      } },
      'lens-likken': { run: function* () {
        yield* approach(4, 60, 380, H * .55, 4); kam.blur = 1;
        const smears = [];
        fx('screen', 0, (g) => { for (const s of smears) { const a = Math.max(0, .22 - (cur.t - s.t) * .02); g.strokeStyle = `rgba(230,240,255,${a})`; g.lineWidth = 34; g.lineCap = 'round';
          g.beginPath(); g.moveTo(s.x0, s.y0); g.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1); g.stroke(); } });
        for (let k = 0; k < 3; k++) {
          kam.mouth = 1; let tip = null; const m = kp(40, 400), x0 = m.x, y0 = m.y;
          const tongue = fx('screen', 0, (g) => { if (!tip) return; g.strokeStyle = '#d8576a'; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(tip.x, tip.y); g.stroke();
            g.strokeStyle = '#ef8a98'; g.lineWidth = 16; g.beginPath(); g.moveTo(x0, y0); g.lineTo(tip.x, tip.y - 6); g.stroke(); });
          const sx = x0 + (rnd() - .5) * 200;
          yield* tween(.7, p => { tip = { x: lerp(x0, sx, p), y: lerp(y0, y0 - 300, Math.sin(p * Math.PI)) }; });
          smears.push({ t: cur.t, x0, y0, cx: sx, cy: y0 - 380, x1: sx + 60, y1: y0 - 120 });
          stop(tongue); kam.mouth = 0; yield* wait(.6);
        }
        kam.eyes = 'blij'; yield* wait(1.5); kam.eyes = '';
        yield* backOff(4); yield* wait(4);
      } },
      'lens-breken': { run: function* () {
        yield* approach(3.2, 190, 250, H * .45, 3.5);
        yield* tween(.5, p => { kam.s = 3.2 - .3 * ez(p); });
        yield* tween(.14, p => { kam.s = 2.9 + 1 * p; });
        // crack!
        const hit = kp(60, 200), lines = [];
        for (let k = 0; k < 11; k++) { let x = hit.x, y = hit.y, a = k / 11 * Math.PI * 2 + rnd() * .3; const pts = [[x, y]];
          for (let s = 0; s < 6; s++) { a += (rnd() - .5) * .7; x += Math.cos(a) * (30 + rnd() * 70); y += Math.sin(a) * (30 + rnd() * 70); pts.push([x, y]); } lines.push(pts); }
        const t0 = cur.t;
        fx('screen', 0, (g) => { const a = cur.t - t0 < 6 ? 1 : Math.max(0, 1 - (cur.t - t0 - 6)); if (!a) return;
          if (cur.t - t0 < .12) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, W, H); }
          g.save(); g.globalAlpha = a; g.lineJoin = 'round';
          for (const col of [['rgba(0,0,0,.45)', 4], ['rgba(255,255,255,.9)', 1.5]]) { g.strokeStyle = col[0]; g.lineWidth = col[1];
            for (const pts of lines) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } }
          g.restore(); });
        const v = view({ glitch: 1 }); kam.eyes = 'groot'; emote('!', 1.5);
        yield* tween(.6, p => { v.glitch = 1 - p; shake(v, 8 * (1 - p)); }); cur.post = null;
        yield* backOff(3.5); emote('sweat', 3); yield* wait(4); kam.eyes = '';
      } },
      vuur: { run: function* () {
        kam.eyes = 'boos'; emote('angry', 1.2); yield* wait(1.2); kam.mouth = 1;
        const fire = particles('front', { until: cur.t + 10, emit: (ps) => { const m = kp(20, 395), f = kface();
            for (let k = 0; k < 7; k++) ps.push(P({ x: m.x, y: m.y, vx: f * (230 + rnd() * 200), vy: (rnd() - .5) * 90 - 20, life: .45 + rnd() * .45, r: 4 + rnd() * 6 })); },
          draw: (g, p, a) => { g.fillStyle = a < .25 ? '#fff6b0' : a < .5 ? '#ffc23a' : a < .75 ? '#ff6a1a' : `rgba(90,80,80,${1 - a})`; const r = p.r * (1 + a * 1.8); g.fillRect(p.x - r / 2, p.y - r / 2, r, r); } });
        const glow = fx('screen', 0, (g) => { if (cur.t > fire.born + 10) return; const m = kp(20, 395); const gr = g.createRadialGradient(m.x, m.y, 10, m.x, m.y, 380);
          gr.addColorStop(0, 'rgba(255,160,40,.28)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
        yield* tween(10, () => { kam.x = (rnd() - .5) * 2; });
        kam.mouth = 0; kam.x = 0; yield* wait(1.2); stop(glow); stop(fire);
        const smoke = particles('front', { until: cur.t + 1.5, emit: (ps) => { if (rnd() < .3) { const m = kp(20, 395); ps.push(P({ x: m.x, y: m.y, vy: -30, vx: (rnd() - .5) * 10, life: 1.6 })); } },
          draw: (g, p, a) => { g.fillStyle = `rgba(120,120,130,${.5 * (1 - a)})`; g.beginPath(); g.arc(p.x, p.y, 5 + a * 10, 0, 7); g.fill(); } });
        kam.eyes = ''; emote('dots', 2.5); yield* wait(2.8); stop(smoke);
      } },
      bubbels: { run: function* () {
        kam.mouth = .35;
        const bub = particles('front', { until: cur.t + 11, emit: (ps) => { if (rnd() < .18) { const m = kp(20, 395); ps.push(P({ x: m.x, y: m.y, vx: kface() * (20 + rnd() * 40), vy: -25 - rnd() * 40, life: 2.5 + rnd() * 2, r: 4 + rnd() * 10, ph: rnd() * 6 })); } },
          draw: (g, p, a) => { const x = p.x + Math.sin(p.age * 3 + p.ph) * 8; g.strokeStyle = `rgba(220,240,255,${a > .95 ? 0 : .85})`; g.lineWidth = 2; g.beginPath(); g.arc(x, p.y, p.r, 0, 7); g.stroke();
            g.fillStyle = 'rgba(200,230,255,.15)'; g.fill(); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - p.r * .45, p.y - p.r * .5, 3, 3); } });
        emote('sparks', 3);
        yield* tween(11, p => { kam.mouth = .25 + .15 * Math.abs(Math.sin(p * 25)); });
        kam.mouth = 0; kam.eyes = 'blij'; yield* wait(3); kam.eyes = ''; stop(bub);
      } },
      scheet: { run: function* () {
        emote('dots', 2); yield* wait(2.2);
        emote('stink', 2.5); kam.sq = .96; yield* wait(.15); kam.sq = 1;
        const gas = particles('front', { until: cur.t + 2, emit: (ps) => { if (rnd() < .5) { const b = kp(770, 700); ps.push(P({ x: b.x, y: b.y, vx: -kface() * (20 + rnd() * 40), vy: -10 - rnd() * 20, life: 4 + rnd() * 2 })); } },
          draw: (g, p, a) => { g.fillStyle = `rgba(140,200,60,${.35 * (1 - a)})`; g.beginPath(); g.arc(p.x, p.y, 8 + a * 34, 0, 7); g.fill(); } });
        yield* wait(1.5); kam.face = -kface(); kam.eyes = 'groot'; emote('!?', 1.5); yield* wait(2);
        kam.eyes = 'triest'; kam.blush = true; emote('sweat', 3); yield* wait(3);
        kam.face = -kface(); yield* wait(1); kam.blush = false; kam.eyes = ''; stop(gas);
      } },
      bevriezen: { run: function* () {
        let ice = 0, cracks = 0;
        fx('front', 0, (g) => { if (ice <= 0) return; const top = kp(200, -40), f = kfeet(); const x0 = kx() - 95, y0 = top.y - 10, w = 190, h = f - y0 + 6;
          g.save(); g.globalAlpha = ice; g.fillStyle = 'rgba(170,225,255,.35)'; g.fillRect(x0, y0, w, h); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.strokeRect(x0, y0, w, h);
          g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x0 + 12, y0 + 12, 10, h * .5); g.fillRect(x0 + 28, y0 + 12, 5, h * .3);
          if (cracks) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < cracks * 6; k++) { const a = k * 1.7; g.moveTo(x0 + w / 2, y0 + h / 2); g.lineTo(x0 + w / 2 + Math.cos(a) * w * .6, y0 + h / 2 + Math.sin(a) * h * .45); } g.stroke(); }
          g.restore(); });
        kam.pose = 'stand';
        yield* tween(1.2, p => { kam.cold = p; ice = p; }); emote('snow', 7);
        yield* wait(6);
        yield* tween(1.2, p => { cracks = p; kam.x = (rnd() - .5) * 4; }); kam.x = 0;
        ice = 0;
        particles('front', { until: cur.t + .1, emit: (ps) => { for (let k = 0; k < 30; k++) ps.push(P({ x: kx() + (rnd() - .5) * 180, y: kfeet() - rnd() * 230, vx: (rnd() - .5) * 400, vy: -rnd() * 300, grav: 900, life: 1.2 })); },
          draw: (g, p, a) => { g.fillStyle = `rgba(200,235,255,${1 - a})`; g.fillRect(p.x, p.y, 7, 5); } });
        kam.pose = ''; yield* shiver(1, 4); yield* tween(2, p => { kam.cold = 1 - p; }); emote('dots', 1.5); yield* wait(1.5);
      } },
      zingen: { run: function* () {
        emote('notes', 11);
        yield* tween(11, p => { kam.mouth = Math.abs(Math.sin(p * 30)) * .9; kam.head = -.08 + Math.sin(p * 15) * .05; });
        kam.mouth = 0; kam.head = 0; yield* wait(1);
      } },
      rondjes: { run: function* () {
        let acc = 0;
        yield* tween(5, p => { acc += st.dt; const iv = lerp(.45, .07, p); if (acc > iv) { acc = 0; kam.face = -kface(); } });
        kam.eyes = 'spiraal'; emote('stars', 5);
        yield* tween(5, p => { kam.r = Math.sin(p * 14) * .14 * (1 - p); kam.x = Math.sin(p * 7) * 12 * (1 - p); });
        kam.r = 0; kam.x = 0; kam.eyes = ''; yield* wait(.8);
      } },
      dronken: { walk: true, run: function* () {
        const d = rnd() < .5 ? -1 : 1; kam.eyes = 'spiraal'; emote('stars', 15);
        yield* travel(d, 45, { rate: 4, each: () => { kam.r = Math.sin(cur.t * 2.3) * .13; kam.x = Math.sin(cur.t * 1.1) * 40; kam.face = Math.sin(cur.t * .7) > .85 ? -d : d; } });
        const x0 = kam.x, r0 = kam.r; kam.face = d;
        yield* tween(1.2, p => { kam.x = x0 * (1 - p); kam.r = r0 * (1 - p); }); kam.eyes = ''; emote('dots', 1.5); yield* wait(1.5);
      } },
      stip: { run: function* () {
        const hy = A.horY(W / 2) + 2, d = rnd() < .5 ? -1 : 1;
        kam.face = d; kam.pose = 'walk'; kam.rate = 4;
        yield* tween(11, p => { kam.s = lerp(1, .05, ez(p)); kam.feet = lerp(FEET, hy, ez(p)); kam.x = d * 50 * Math.sin(p * Math.PI); if (p > .15) kam.layer = 'mid'; });
        kam.pose = ''; yield* wait(2.5); kam.face = -d; kam.pose = 'walk';
        yield* tween(10, p => { kam.s = lerp(.05, 1, ez(p)); kam.feet = lerp(hy, FEET, ez(p)); kam.x = -d * 40 * Math.sin(p * Math.PI); if (p > .85) kam.layer = 'front'; });
        kam.pose = ''; kam.feet = null; kam.layer = 'front'; kam.x = 0;
      } },
      crash: { run: function* () {
        const v = view({ glitch: 0 });
        yield* tween(2, p => { v.glitch = p * 1.5; shake(v, 6 * p); });
        cur.post = null; cur.hide = true; kam.eyes = 'groot';
        emote('!?', 2);
        for (let k = 0; k < 6; k++) { kam.face = -kface(); yield* shiver(.7 + rnd() * .6, 3); }
        emote('sweat', 2.5); yield* wait(2.5);
        // reboot
        const t0 = cur.t;
        const boot = fx('screen', 0, (g) => { const a = cur.t - t0; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8c8c8'; g.font = '30px VT323, monospace';
          const lines = ['KAMIEL OS 95  (C) KAMIELLAND', '', 'GEHEUGEN TESTEN ... 640K OK', 'WOLKEN LADEN ...', 'LAMA ZOEKEN ... GEVONDEN', 'WERELD HERSTELLEN ...'];
          lines.forEach((l, i) => { if (a > i * .45) g.fillText(l, 60, 90 + i * 34); });
          const p = clamp((a - 2.2) / 1.6, 0, 1); g.strokeStyle = '#c8c8c8'; g.strokeRect(60, 330, 400, 26); g.fillRect(64, 334, 392 * p, 18); });
        yield* wait(4.2); stop(boot); cur.hide = false; kam.eyes = '';
        const v2 = view({ glitch: 1 }); yield* tween(.8, p => { v2.glitch = 1 - p; }); cur.post = null;
        emote('?', 2); yield* wait(2);
      } },
      tweeling: { run: function* () {
        const side = rnd() < .5 ? -1 : 1, a = actor({ cx: W / 2 + side * (W / 2 + 110), tint: 'tweeling', face: -side });
        yield* actorTo(a, W / 2 + kam.x + side * 230, 50);
        a.face = -side; kam.face = side;
        emote('?', 2); yield* wait(1); emote('?', 2, a); yield* wait(3);
        a.eyeT = 0; kam.eyes = 'groot'; a.eyes = 'groot'; yield* wait(3); kam.eyes = ''; a.eyes = '';
        emote('!', 1.4); emote('!', 1.4, a); yield* wait(2);
        const how = pick(['weg', 'stof', 'vlieg']);
        if (how === 'weg') { a.face = side; yield* actorTo(a, W / 2 + side * (W / 2 + 120), 60); }
        else if (how === 'stof') { a.eyes = 'dicht'; yield* tween(3, p => { a.dissolve = p; a.cx += (rnd() - .5) * 2; }); a.alpha = 0; }
        else { emote('sparks', 3, a); yield* tween(4, p => { a.feet = FEET - 700 * p * p; a.r = side * .4 * p; }); a.alpha = 0; }
        yield* wait(1.2); emote('!?', 2.5); yield* wait(2.5);
      } },
      mol: { run: function* () {
        const side = rnd() < .5 ? -1 : 1, front = () => kx() + kface() * 120;
        let mx = W / 2 + side * (W / 2 + 60), up = 0, mound = 1;
        const trail = [];
        fx('ground', 0, (g) => { for (const t of trail) { const a = Math.max(0, 1 - (cur.t - t.t) / 6) * mound; if (!a) continue; g.fillStyle = `rgba(92,64,40,${a})`;
          g.beginPath(); g.ellipse(t.x, FEET - 2, 16, 7, 0, Math.PI, 0); g.fill(); } });
        fx('back', 0, (g) => {
          g.fillStyle = `rgba(110,78,48,${mound})`; g.beginPath(); g.ellipse(mx, FEET + 2, 34, 18, 0, Math.PI, 0); g.fill();
          if (up > 0) { g.save(); g.beginPath(); g.rect(0, 0, W, FEET - 4); g.clip(); sprC(g, SP.mole, mx, FEET + 20 - up * 46, 4); g.restore(); }
          g.fillStyle = `rgba(92,64,40,${mound})`; for (let k = 0; k < 5; k++) g.fillRect(mx - 30 + k * 13, FEET - 6 - (k % 2) * 4, 7, 6);
        });
        kam.face = side; kam.head = .12;
        let acc = 0;
        yield* tween(5, p => { mx = lerp(W / 2 + side * (W / 2 + 60), front(), p); acc += st.dt; if (acc > .25) { acc = 0; trail.push({ x: mx, t: cur.t }); } kam.face = mx > kx() ? 1 : -1; });
        emote('?', 2); yield* wait(1.5);
        yield* tween(.8, p => { up = ez(p); }); yield* wait(1.5);
        emote('!', 1.5); kam.eyes = 'groot'; yield* wait(2); kam.eyes = ''; yield* wait(1.5);
        emote('heart', 1.5); yield* wait(2);
        yield* tween(.8, p => { up = 1 - ez(p); });
        yield* tween(2, p => { mound = 1 - p; }); kam.head = 0; emote('dots', 2); yield* wait(2);
      } },
      raket: { run: function* () {
        withOutfit(['astrohelm', 'astropak']); emote('sparks', 1); yield* wait(1.2);
        for (let k = 0; k < 3; k++) { emote('!', .6); yield* wait(.8); }
        const flame = particles('back', { emit: (ps) => { if (!fly) return; const f = { x: kx(), y: kfeet() };
            for (let k = 0; k < 6; k++) ps.push(P({ x: f.x + (rnd() - .5) * 50 * kam.s, y: f.y, vx: (rnd() - .5) * 60, vy: 180 + rnd() * 200, life: .35 + rnd() * .3, r: 5 + rnd() * 7 })); },
          draw: (g, p, a) => { g.fillStyle = a < .3 ? '#fff6b0' : a < .6 ? '#ffb02e' : `rgba(150,150,160,${.7 * (1 - a)})`; const r = p.r * (1 + a * 2); g.fillRect(p.x - r / 2, p.y - r / 2, r, r); } });
        let fly = true; kam.eyes = 'groot';
        yield* shiver(1.4, 4);
        yield* tween(3.2, p => { kam.y = 820 * p * p; }); fly = false;
        // a tiny flame on its way to the sun or the moon
        const target = A.sky() || { x: W * .78, y: 90 }; let dotP = 0;
        const trip = fx('screen', 0, (g) => { if (dotP <= 0 || dotP >= 1) return; const x = lerp(kx(), target.x, dotP), y = lerp(-10, target.y, Math.sqrt(dotP)) + (dotP < .1 ? 40 * (1 - dotP * 10) : 0);
          g.fillStyle = '#fff6b0'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = 'rgba(255,170,40,.7)'; g.fillRect(x - 1, y + 3, 2, 6); });
        yield* tween(7, p => { dotP = p; }); dotP = 1; stop(trip);
        fx('screen', 2, (g, age) => { const a = 1 - age / 2; g.fillStyle = `rgba(255,255,255,${a})`; sprC(g, SP.spark, target.x, target.y, 3 + age * 3); });
        yield* until(() => cur.t > 3.6 + 1.4 + 3.2 + 42, 45);
        // back to earth
        fly = true; kam.eyes = 'groot';
        yield* tween(4, p => { kam.y = 820 * (1 - ez(p)); });
        kam.y = 0; fly = false; kam.sq = .85; yield* wait(.2); kam.sq = 1; stop(flame);
        kam.eyes = 'spiraal'; emote('stars', 2.5); yield* wait(2.5); kam.eyes = ''; kam.outfit = null;
      } },
      zinkgat: { run: function* () {
        const f = kface(), hole = { wx: A.cam() + kam.x + f * 160, r: 0 };
        const hx = () => hole.wx - A.cam() + W / 2;
        fx('ground', 0, (g) => { if (hole.r <= 0) return; g.fillStyle = '#4a3220'; g.beginPath(); g.ellipse(hx(), FEET - 2, 70 * hole.r + 8, 18 * hole.r + 4, 0, 0, 7); g.fill();
          g.fillStyle = '#0b0705'; g.beginPath(); g.ellipse(hx(), FEET - 1, 64 * hole.r, 15 * hole.r, 0, 0, 7); g.fill(); });
        kam.eyes = 'groot'; emote('!', 1.5);
        yield* tween(2.2, p => { hole.r = ez(p); kam.x = (rnd() - .5) * 2; }); kam.x = 0;
        kam.eyes = ''; yield* walkTo(hx() - W / 2 - f * 105, 50); kam.face = f; kam.head = .16; emote('?', 2); yield* wait(2);
        const what = pick(['raket', 'ballon', 'ufo', 'object', 'gas', 'baken', 'val']);
        const clipHole = (g, draw) => { g.save(); g.beginPath(); g.rect(0, 0, W, FEET - 1); g.clip(); draw(); g.restore(); };
        if (what === 'raket' || what === 'ballon' || what === 'ufo') {
          const s = SP[{ raket: 'rocket', ballon: 'balloon', ufo: 'ufo' }[what]], u = what === 'ufo' ? 6 : 5;
          let y = FEET + 40, x = hx(), beam = 0;
          fx('back', 0, (g) => clipHole(g, () => {
            if (what === 'ballon') { g.strokeStyle = '#eee'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 24); g.quadraticCurveTo(x + 10, y + 60, x, y + 90); g.stroke(); }
            if (beam) { g.fillStyle = `rgba(150,240,255,${.25 * beam})`; g.beginPath(); g.moveTo(x - 20, y + 20); g.lineTo(x + 20, y + 20); g.lineTo(kx() + 70, FEET); g.lineTo(kx() - 70, FEET); g.closePath(); g.fill(); }
            sprC(g, s, x, y, u);
            if (what === 'raket') { g.fillStyle = rnd() < .5 ? '#ffb02e' : '#fff6b0'; g.fillRect(x - 6, y + 32, 12, 14 + rnd() * 14); }
          }));
          kam.head = -.15;
          if (what === 'raket') { emote('!', 1.5); yield* tween(4, p => { y = lerp(FEET + 40, -120, p * p); }); }
          else if (what === 'ballon') { emote('heart', 2); yield* tween(10, p => { y = lerp(FEET + 40, -140, p); x = hx() + Math.sin(p * 9) * 30; kam.head = -.1 - .2 * p; }); }
          else {
            yield* tween(3, p => { y = lerp(FEET + 40, 200, ez(p)); }); kam.eyes = 'groot';
            yield* tween(1, p => { beam = p; x = lerp(hx(), kx(), p); }); emote('sweat', 4);
            yield* tween(3, p => { kam.y = 26 * Math.sin(p * Math.PI); x = kx() + Math.sin(p * 9) * 10; }); kam.y = 0; beam = 0;
            const x0 = x; yield* tween(1.4, p => { x = x0 + 600 * p * p; y = 200 - 320 * p * p; }); kam.eyes = '';
          }
          kam.head = 0; emote('!?', 2); yield* wait(2);
        } else if (what === 'object') {
          const pool = A.OBJ.filter(o => o.kind === 'grond' && !o.sign && !o.tv);
          if (pool.length) {
            const o = pick(pool), h = 120, w = h * o.size[0] / o.size[1]; let y = FEET + 10, x = hx();
            const it = fx('back', 0, (g) => { if (!A.ready(o.img)) return; clipHole(g, () => g.drawImage(o.img, x - w / 2, y - h, w, h)); });
            kam.eyes = 'groot'; yield* tween(3, p => { y = lerp(FEET + 10 + h * .2, FEET - 30, ez(p)); });
            const lx = x - f * 160; yield* tween(1, p => { x = lerp(hx(), lx, p); y = FEET - 30 - Math.sin(p * Math.PI) * 60 + 30 * p; });
            stop(it); A.addItem(o, x - W / 2, h); kam.eyes = '';
            emote('!', 1.5); yield* wait(2);
          }
        } else if (what === 'gas') {
          const gas = particles('back', { until: cur.t + 40, emit: (ps) => { if (rnd() < .35) ps.push(P({ x: hx() + (rnd() - .5) * 80, y: FEET - 6, vx: (rnd() - .5) * 30, vy: -30 - rnd() * 40, life: 3 + rnd() * 3 })); },
            draw: (g, p, a) => { g.fillStyle = `rgba(120,210,80,${.3 * (1 - a)})`; g.beginPath(); g.arc(p.x, p.y, 10 + a * 40, 0, 7); g.fill(); } });
          yield* wait(3); kam.eyes = 'spiraal'; kam.head = 0; emote('stars', 40);
          yield* tween(40, p => { kam.r = Math.sin(p * 40) * .12; kam.x = hx() - W / 2 - f * 105 + Math.sin(p * 20) * 16; });
          stop(gas); kam.r = 0; kam.eyes = '';
        } else if (what === 'baken') {
          const beacon = fx('back', 0, (g) => { const x = hx(), fl = .8 + .2 * Math.sin(cur.t * 20);
            const gr = g.createLinearGradient(x - 26, 0, x + 26, 0); gr.addColorStop(0, 'rgba(120,255,255,0)'); gr.addColorStop(.5, `rgba(220,255,255,${.85 * fl})`); gr.addColorStop(1, 'rgba(120,255,255,0)');
            g.fillStyle = gr; g.fillRect(x - 26, 0, 52, FEET);
            for (let k = 0; k < 8; k++) { const yy = (FEET - ((cur.t * 90 + k * 70) % FEET)); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - 4 + Math.sin(k + cur.t) * 10, yy, 6, 6); } });
          kam.head = -.25; kam.eyes = 'groot'; emote('sparks', 41); yield* wait(3); kam.eyes = 'blij';
          yield* wait(40); stop(beacon); kam.head = 0; kam.eyes = '';
        } else {   // falls in and comes out of the ground in the next scene
          yield* walkTo(hx() - W / 2, 60); kam.clipY = FEET - 1; kam.eyes = 'groot'; emote('!', 1);
          yield* tween(.6, p => { kam.feet = FEET + 300 * p * p; }); kam.hide = true;
          const d = f; yield* travel(d, 600, { pose: '' });
          hole.wx = A.cam(); kam.x = 0;
          yield* wait(.6); kam.hide = false;
          yield* tween(.7, p => { kam.feet = FEET + 300 * (1 - ez(p)); }); kam.feet = null; kam.clipY = null; yield* hop(40, .4);
          kam.eyes = 'spiraal'; emote('stars', 2.5); yield* wait(2.5); kam.eyes = '';
        }
        kam.head = 0;
        if (kam.x !== 0) yield* walkTo(0, 50);
        yield* tween(1.5, p => { hole.r = 1 - ez(p); }); hole.r = 0;
      } },
      wolkrit: { walk: true, run: function* () {
        const d = rnd() < .5 ? -1 : 1, img = A.CL.length ? pick(A.CL).img : null;
        const cl = { x: kx(), y: -120, w: 300 };
        fx('front', 0, (g) => { if (img && A.ready(img)) { const h = cl.w * img.height / img.width; g.drawImage(img, cl.x - cl.w / 2, cl.y - h * .35, cl.w, h); } else sprC(g, SP.cloud, cl.x, cl.y, 15); });
        kam.head = -.25; emote('?', 2);
        yield* tween(3.5, p => { cl.y = lerp(-120, FEET - 12, ez(p)); cl.x = kx(); }); kam.head = 0;
        kam.eyes = 'blij'; yield* hop(40, .45); emote('sparks', 2);
        yield* tween(2.5, p => { kam.y = 150 * ez(p); cl.y = FEET - 12 - kam.y; });
        yield* travel(d, 120, { pose: '', each: () => { kam.y = 150 + Math.sin(cur.t * 3) * 6; cl.y = FEET - 12 - kam.y; cl.x = kx(); } });
        yield* tween(2.5, p => { kam.y = 150 * (1 - ez(p)); cl.y = FEET - 12 - kam.y; });
        kam.y = 0; yield* hop(30, .4); kam.eyes = '';
        const y0 = cl.y; yield* tween(4, p => { cl.y = y0 - 760 * ez(p); cl.x = kx() - d * 200 * p; });
      } },
      rave: { run: function* () {
        withOutfit(['zonnebril']); let on = 0;
        fx('screen', 0, (g) => {
          if (!on) return; const tt = cur.t;
          g.fillStyle = `rgba(10,0,30,${.55 * on})`; g.fillRect(0, 0, W, H);
          g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 3;
          const cols = ['#ff2bd6', '#2bf5ff', '#7dff2b', '#ffe12b'];
          for (let k = 0; k < 8; k++) { const ox = k % 2 ? W - 60 : 60, a = Math.PI / 2 + Math.sin(tt * (1 + k * .17) + k) * .9;
            g.strokeStyle = cols[k % 4]; g.globalAlpha = .55 * on; g.beginPath(); g.moveTo(ox, -10); g.lineTo(ox + Math.cos(a) * 1200, -10 + Math.sin(a) * 1200); g.stroke(); }
          g.globalAlpha = on; for (let k = 0; k < 3; k++) { g.fillStyle = cols[(k + Math.floor(tt * 2)) % 4] + '44'; g.beginPath(); g.ellipse(W / 2 + Math.sin(tt * 1.3 + k * 2) * 330, FEET - 4, 110, 22, 0, 0, 7); g.fill(); }
          g.restore();
          if (Math.floor(tt * 4) % 4 === 0 && (tt * 4) % 1 < .25) { g.fillStyle = `rgba(255,255,255,${.18 * on})`; g.fillRect(0, 0, W, H); }
        });
        yield* tween(2, p => { on = p; }); emote('notes', 42);
        yield* tween(41, p => { const b = p * 41 / .47, ph = b % 1; kam.y = Math.abs(Math.sin(ph * Math.PI)) * 16; kam.face = Math.floor(b / 2) % 2 ? 1 : -1;
          kam.head = Math.sin(ph * Math.PI * 2) * .14; kam.r = Math.sin(p * 41 * 5) * .07; });
        kam.y = 0; kam.head = 0; kam.r = 0;
        yield* tween(2, p => { on = 1 - p; }); kam.outfit = null;
      } },
      upsidedown: { run: function* () {
        let on = 0; const spores = [];
        for (let k = 0; k < 90; k++) spores.push({ x: rnd() * W, y: rnd() * H, s: 1 + rnd() * 2.5, v: 6 + rnd() * 14, ph: rnd() * 6 });
        let flash = 0;
        fx('screen', 0, (g) => { if (!on) return;
          g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(${lerp(255, 70, on) | 0},${lerp(255, 80, on) | 0},${lerp(255, 120, on) | 0},1)`; g.fillRect(0, 0, W, H); g.restore();
          g.fillStyle = `rgba(120,0,20,${.18 * on})`; g.fillRect(0, 0, W, H);
          if (flash > 0) { g.fillStyle = `rgba(255,40,40,${flash * .35})`; g.fillRect(0, 0, W, H * .45); flash -= st.dt * 3; } else if (rnd() < .006) flash = 1;
          g.fillStyle = `rgba(230,230,240,${.55 * on})`;
          for (const s of spores) { s.y -= s.v * st.dt; if (s.y < -5) s.y = H + 5; g.fillRect(s.x + Math.sin(cur.t + s.ph) * 8, s.y, s.s, s.s); } });
        yield* tween(3, p => { on = p; kam.cold = p * .5; });
        kam.eyes = 'groot'; emote('!?', 2);
        for (let k = 0; k < 10; k++) { kam.face = -kface(); yield* shiver(1.5 + rnd() * 1.5, 2); if (k === 4) emote('sweat', 4); }
        yield* until(() => cur.t > 43, 30);
        yield* tween(2.5, p => { on = 1 - p; kam.cold = .5 * (1 - p); }); kam.eyes = ''; emote('dots', 1.5);
      } },
      vuurwerk: { run: function* () {
        let dark = 0; const bursts = [];
        fx('sky', 0, (g) => { if (dark) { g.fillStyle = `rgba(0,0,25,${.55 * dark})`; g.fillRect(0, 0, W, H); } });
        fx('screen', 0, (g) => {
          if (cur.t < 44 && rnd() < .1) bursts.push({ x: 80 + rnd() * (W - 160), y: 60 + rnd() * 190, t: 0, hue: Math.floor(rnd() * 360), n: 24 + Math.floor(rnd() * 20), up: .7 });
          for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += st.dt; if (b.t > b.up + 2.4) { bursts.splice(i, 1); continue; }
            if (b.t < b.up) { const p = b.t / b.up; g.fillStyle = '#ffe9b0'; g.fillRect(b.x - 1, lerp(FEET - 40, b.y, p), 2, 6); continue; }
            const a = b.t - b.up, rad = 10 + a * 70, fade = Math.max(0, 1 - a / 2.4); g.fillStyle = `hsla(${b.hue},95%,${60 + 20 * fade}%,${fade})`;
            for (let k = 0; k < b.n; k++) { const an = k / b.n * Math.PI * 2; g.fillRect(b.x + Math.cos(an) * rad, b.y + Math.sin(an) * rad + a * a * 14, 4, 4); g.fillRect(b.x + Math.cos(an) * rad * .7, b.y + Math.sin(an) * rad * .7 + a * a * 14, 2, 2); } } });
        yield* tween(2, p => { dark = p; }); kam.head = -.22; kam.eyes = 'blij';
        emote('hearts', 6);
        yield* until(() => cur.t > 44, 44);
        yield* tween(2, p => { dark = 1 - p; }); kam.head = 0; kam.eyes = '';
      } },
      schuin: { run: function* () {
        const d = rnd() < .5 ? -1 : 1, v = view({ z: 1.14 }); let slide = 0;
        cur.itemOff = (it, layer) => ({ x: d * slide * (layer === 0 ? .6 : 1) });
        cur.cloudOff = () => ({ x: d * slide * .5 });
        kam.eyes = 'groot'; emote('!', 1.5);
        yield* tween(3, p => { v.rot = d * .12 * ez(p); });
        kam.face = -d; kam.pose = 'walk'; kam.rate = 7;
        yield* tween(34, p => { slide = 170 * ez(Math.min(1, p * 3)); kam.x = d * slide * .3 + Math.sin(p * 30) * 4; if (p > .3) kam.eyes = 'triest'; });
        kam.pose = ''; emote('!?', 2);
        yield* tween(5, p => { v.rot = d * .12 * (1 - ez(p)); slide = 170 * (1 - ez(p)); kam.x = d * slide * .3; });
        cur.post = null; cur.itemOff = null; cur.cloudOff = null; kam.x = 0; kam.eyes = ''; yield* wait(1);
      } },
      aardbeving: { run: function* () {
        const v = view({}); let I = 0;
        cur.itemOff = (it, layer) => I ? { y: (rnd() - .5) * 5 * I, r: layer ? (rnd() - .5) * .07 * I : 0 } : null;
        const dust = particles('front', { until: cur.t + 12, emit: (ps) => { if (rnd() < I * .6) ps.push(P({ x: rnd() * W, y: FEET + (rnd() - .5) * 30, vy: -20 - rnd() * 30, vx: (rnd() - .5) * 30, life: 1.5 })); },
          draw: (g, p, a) => { g.fillStyle = `rgba(170,140,100,${.4 * (1 - a)})`; g.beginPath(); g.arc(p.x, p.y, 4 + a * 12, 0, 7); g.fill(); } });
        kam.eyes = 'groot'; emote('!', 2);
        yield* tween(13, p => { I = Math.sin(p * Math.PI) * (.6 + .4 * Math.sin(p * 30)); shake(v, 12 * I); if (rnd() < .01) emote('sweat', 2); kam.y = Math.abs(Math.sin(p * 60)) * 8 * I; });
        I = 0; cur.post = null; cur.itemOff = null; kam.y = 0; stop(dust); kam.eyes = ''; emote('dots', 2); yield* wait(2);
      } },
      tornado: { run: function* () {
        const d = rnd() < .5 ? -1 : 1; let tx = W / 2 - d * (W / 2 + 200);
        const near = (x) => Math.max(0, 1 - Math.abs(x - tx) / 180);
        cur.itemOff = (it, layer, sx, y, w) => { const n = near(sx + w / 2); return n ? { y: -70 * n * (layer === 0 ? .3 : 1), r: Math.sin(cur.t * 9 + sx) * .4 * n, x: (tx - (sx + w / 2)) * .25 * n } : null; };
        fx('front', 0, (g) => { for (let k = 0; k < 16; k++) { const y = FEET - k * 32, rx = 14 + k * k * .85, ox = Math.sin(cur.t * 5 + k * .55) * 12 * (k / 16);
            g.fillStyle = `rgba(${70 + k * 5},${72 + k * 5},${80 + k * 5},${.88 - k * .02})`; g.beginPath(); g.ellipse(tx + ox, y, rx, 9 + k * .6, 0, 0, 7); g.fill(); }
          g.fillStyle = 'rgba(90,70,50,.8)'; for (let k = 0; k < 14; k++) { const a = cur.t * 6 + k * 1.3, rr = 30 + (k * 23) % 120; g.fillRect(tx + Math.cos(a) * rr, FEET - 40 - (k * 37) % 360 + Math.sin(a) * 8, 5, 4); } });
        kam.eyes = 'groot'; emote('!', 2);
        yield* tween(24, p => { tx = lerp(W / 2 - d * (W / 2 + 200), W / 2 + d * (W / 2 + 200), p);
          const n = near(kx()); kam.y = 60 * n; kam.r = (tx > kx() ? 1 : -1) * .25 * n; kam.sx = 1 + .1 * n; kam.face = tx > kx() ? -1 : 1; if (n > .5 && rnd() < .02) emote('sweat', 2); });
        cur.itemOff = null; kam.y = 0; kam.r = 0; kam.sx = 1; kam.eyes = ''; emote('!?', 2); yield* wait(2);
      } },
      vloedgolf: { run: function* () {
        const d = rnd() < .5 ? -1 : 1; let fx_ = W / 2 - d * (W / 2 + 160), level = 0;
        const wave = fx('front', 0, (g) => {
          const top = FEET - 120 * level, x0 = d > 0 ? -10 : fx_, x1 = d > 0 ? fx_ : W + 10;
          g.fillStyle = 'rgba(40,120,210,.72)'; g.fillRect(Math.min(x0, x1), top, Math.abs(x1 - x0), H - top);
          g.fillStyle = 'rgba(150,215,255,.8)'; for (let x = Math.min(x0, x1); x < Math.max(x0, x1); x += 16) g.fillRect(x, top - 4 + Math.sin(x * .05 + cur.t * 4) * 4, 10, 5);
          if (fx_ > -150 && fx_ < W + 150) { g.fillStyle = 'rgba(40,120,210,.85)'; g.beginPath(); g.arc(fx_, top - 40, 70, 0, 7); g.fill();
            g.fillStyle = '#fff'; for (let k = 0; k < 10; k++) g.fillRect(fx_ + d * 20 + Math.cos(k * .7 + cur.t * 6) * 60, top - 90 + Math.sin(k * .9) * 20, 8, 8); } });
        cur.itemOff = (it, layer, sx, y, w) => { const wet = d > 0 ? sx + w / 2 < fx_ : sx + w / 2 > fx_; return wet && level > .3 && layer > 0 ? { y: Math.sin(cur.t * 3 + sx) * 6 * level, r: Math.sin(cur.t * 2 + sx) * .05 } : null; };
        emote('!', 1.5); kam.face = -d;
        yield* tween(10, p => { fx_ = lerp(W / 2 - d * (W / 2 + 160), W / 2 + d * (W / 2 + 200), p); level = Math.min(1, p * 2.5);
          const wet = d > 0 ? kx() < fx_ : kx() > fx_; if (wet) { kam.eyes = 'groot'; kam.y = lerp(kam.y, 95 + Math.sin(cur.t * 3) * 8, .1); kam.x += d * 25 * st.dt; kam.r = Math.sin(cur.t * 2) * .1; } });
        emote('sweat', 3);
        yield* tween(6, p => { level = 1 - p; kam.y = (95 + Math.sin(cur.t * 3) * 8) * (1 - ez(p)); kam.r *= .95; });
        stop(wave); cur.itemOff = null; kam.y = 0; kam.r = 0; kam.eyes = '';
        yield* walkTo(0, 55); emote('dots', 2); yield* wait(2);
      } },
      'muis-pesten': { run: function* () {
        const c = { x: W + 30, y: 160 + rnd() * 120, s: SP.cursor };
        fx('screen', 0, (g) => sprC(g, c.s, c.x + 18, c.y + 25, 3));
        const moveTo = function* (tx, ty, secs) { const x0 = c.x, y0 = c.y; yield* tween(secs, p => { c.x = lerp(x0, tx, ez(p)); c.y = lerp(y0, ty, ez(p)); }); };
        let h = kp(200, 120); yield* moveTo(h.x + 50, h.y - 60, 2.2);
        for (let k = 0; k < 3; k++) { h = kp(200, 140); yield* moveTo(h.x, h.y, .2); kam.eyes = 'groot'; kam.x += (rnd() - .5) * 8; emote('!', .7); yield* moveTo(h.x + 30, h.y - 30, .3); yield* wait(.5); }
        kam.eyes = 'vies';
        yield* tween(4, p => { const hh = kp(200, 200), a = p * Math.PI * 4; c.x = hh.x + Math.cos(a) * 90; c.y = hh.y + Math.sin(a) * 60; kam.face = c.x > kx() ? 1 : -1; });
        const n = kp(10, 340); yield* moveTo(n.x, n.y, .5); emote('angry', 2); kam.eyes = 'boos'; yield* wait(1.2);
        yield* tween(.25, p => { kam.head = .2 * Math.sin(p * Math.PI); kam.x += kface() * 60 * st.dt; });
        emote('burst', .8);
        yield* moveTo(c.x + (kface() > 0 ? 1 : -1) * 900, c.y - 300, .8);
        kam.eyes = 'blij'; yield* wait(2); kam.eyes = ''; if (kam.x) yield* walkTo(0, 50);
      } },
      'muis-slepen': { run: function* () {
        const c = { x: -30, y: 140, s: SP.cursor };
        fx('screen', 0, (g) => sprC(g, c.s, c.x + 18, c.y + 25, 3));
        const moveTo = function* (tx, ty, secs) { const x0 = c.x, y0 = c.y; yield* tween(secs, p => { c.x = lerp(x0, tx, ez(p)); c.y = lerp(y0, ty, ez(p)); }); };
        let b = kp(420, 520); yield* moveTo(b.x, b.y, 2.4); c.s = SP.hand; yield* wait(.6);
        kam.eyes = 'groot'; emote('!', 1.5); yield* wait(.3);
        const tx = (rnd() < .5 ? -1 : 1) * (180 + rnd() * 120), x0 = kam.x;
        yield* tween(.5, p => { kam.y = 50 * ez(p); b = kp(420, 520); c.x = b.x; c.y = b.y; });
        yield* tween(3, p => { kam.x = lerp(x0, tx, ez(p)); kam.r = Math.sin(p * 12) * .12; b = kp(420, 520); c.x = b.x; c.y = b.y; });
        c.s = SP.cursor; kam.r = 0;
        yield* tween(.3, p => { kam.y = 50 * (1 - p * p); }); kam.y = 0; kam.sq = .85; yield* wait(.15); kam.sq = 1;
        kam.eyes = 'spiraal'; emote('stars', 3);
        yield* moveTo(W + 60, -40, 1.6); yield* wait(1.2); kam.eyes = 'boos'; emote('angry', 1.5); yield* wait(1.5); kam.eyes = '';
        yield* walkTo(0, 55);
      } },
      'echte-muis': { run: function* () {
        const side = rnd() < .5 ? -1 : 1, m = { x: W / 2 + side * (W / 2 + 40), y: FEET - 10, f: -side };
        fx('front', 0, (g) => { sprC(g, SP.mouse, m.x, m.y, 3, m.f < 0); g.strokeStyle = '#ff9aae'; g.lineWidth = 2; g.beginPath(); g.moveTo(m.x - m.f * 16, m.y + 4); g.quadraticCurveTo(m.x - m.f * 30, m.y - 6 + Math.sin(cur.t * 20) * 4, m.x - m.f * 40, m.y + 2); g.stroke(); });
        const runTo = function* (x, y, secs) { const x0 = m.x, y0 = m.y; m.f = x > x0 ? 1 : -1; yield* tween(secs, p => { m.x = lerp(x0, x, p); m.y = lerp(y0, y, p) - Math.abs(Math.sin(p * 20)) * 3; }); };
        yield* runTo(kx() + side * 200, FEET - 10, 1.4); kam.face = side; kam.eyes = 'groot'; emote('!', 1.5); yield* wait(1);
        yield* runTo(kx() - side * 160, FEET - 10, .9); kam.face = -side; yield* wait(.4);
        // up his back, over his head, and down
        const bk = kp(720, 560), hd = kp(250, 0); yield* runTo(bk.x, bk.y - 10, .5); yield* runTo(hd.x, hd.y - 10, .6);
        emote('!?', 1.5); yield* runTo(kx() + kface() * 120, FEET - 10, .5);
        for (let k = 0; k < 3; k++) { kam.face = m.x > kx() ? 1 : -1; const x0 = kam.x, tx = m.x - W / 2;
          yield* tween(.45, p => { kam.y = Math.sin(p * Math.PI) * 50; kam.x = lerp(x0, tx, p * .8); }); kam.y = 0; kam.sq = .88;
          yield* runTo(clamp(m.x + (rnd() < .5 ? -1 : 1) * 200, 60, W - 60), FEET - 10, .5); kam.sq = 1; }
        yield* runTo(m.x > W / 2 ? W + 60 : -60, FEET - 10, 1);
        kam.eyes = 'boos'; emote('angry', 1.5); yield* wait(1.8); kam.eyes = ''; yield* walkTo(0, 55);
      } },
      'lucht-valt': { run: function* () {
        const land = new Map(); let p = 0;
        const target = (key, y, h) => { if (!land.has(key)) land.set(key, FEET - 6 - rnd() * 30 - h); return land.get(key) - y; };
        const bounce = (q) => q < .7 ? (q / .7) * (q / .7) : 1 - Math.sin((q - .7) / .3 * Math.PI) * .08;
        cur.itemOff = (it, layer, sx, y, w, h) => layer === 0 ? { y: target(it, y, h) * bounce(p), r: (land.has(it) ? .1 : 0) * p } : null;
        cur.cloudOff = (cl, x, y, w, h) => ({ y: target(cl, y, h * .7) * bounce(p) });
        kam.head = -.2; emote('?', 1.5); yield* wait(1);
        yield* tween(1.4, q => { p = q; }); p = 1; kam.head = 0; kam.eyes = 'groot'; emote('!?', 2);
        const v = view({}); yield* tween(.6, q => shake(v, 8 * (1 - q))); cur.post = null;
        yield* wait(1); kam.eyes = '';
        const fallen = hitsOf(0).map(hh => hh.x + hh.w / 2 - W / 2).filter(x => Math.abs(x) < W / 2 - 100);
        for (let k = 0; k < Math.min(3, fallen.length); k++) { yield* walkTo(clamp(fallen[k] - 90, -W / 2 + 90, W / 2 - 90), 55); kam.face = fallen[k] > kam.x ? 1 : -1; kam.head = .12; emote('?', 2); yield* wait(2.5); kam.head = 0; }
        yield* until(() => cur.t > 40, 40);
        kam.head = -.2; yield* tween(3, q => { p = 1 - ez(q); }); p = 0;
        cur.itemOff = null; cur.cloudOff = null; kam.head = 0; emote('dots', 1.5);
        if (kam.x) yield* walkTo(0, 55);
      } },
    };

    /* ---------- the engine ---------- */
    const offList = () => (cfg.off || []);
    const can = (id) => { const d = DEF[id]; try { return !!d && (!d.can || d.can()); } catch (e) { return false; } };
    function choose(cat, forced) {
      const fk = A.festival ? (A.festival() || {}).kind : null;
      const pool = LIST.filter(e => (cat ? e.cat === cat : e.cat !== 'intern' && e.cat !== 'muziek') && (e.cat !== 'feest' || (DEF[e.id] && (DEF[e.id].fest || []).includes(fk))) && (forced || !offList().includes(e.id)) && can(e.id));
      return pool.length ? pick(pool).id : null;
    }
    function start(id) {
      const def = DEF[id]; if (!def) return false;
      const face = A.dir();
      A.kamReset(); kam.face = face;
      cur = { id, t: 0, fx: [], actors: [], post: null, itemOff: null, cloudOff: null, hide: false, cleanup: [] };
      cur.gen = def.run();
      const e = LIST.find(x => x.id === id); if (A.onStart && e) A.onStart(id, e.name, e.cat);
      return true;
    }
    function finish() {
      const c = cur; cur = null;
      try { if (c.gen && c.gen.return) c.gen.return(); } catch (e) { }
      c.cleanup.forEach(f => { try { f(); } catch (e) { } });
      const center = A.center(0);   // always end up in a place, never between two
      if (Math.abs(A.cam() - center) > 1) { A.setCam(center); A.arrive(); }
      const f = kam.face; A.kamReset(); if (f) A.setDir(f);
    }
    function tick(dt) {
      st.dt = dt; clock += dt;
      for (const a of residents.slice()) {
        a.cx = scrX(a.wx); a.s = PET[a.pet].s * depthS(a.feet); ballStep(a, dt);
        if (a.pose === 'walk') a.wt += a.rate * dt;
        if (!a.busy && a.brain) { let done = false; try { done = a.brain.next().done; } catch (e) { console.error('huisdier', a.pet, e); done = true; } if (done) a.gone = true; }
        // when Kamiel walks on, those that are awake watch him go
        if (A.walking() && !a.busy && onScreen(a) && (a.pose === 'sit' || a.pose === 'up' || a.pose === 'stand')) a.face = a.cx < W / 2 ? 1 : -1;
      }
      for (let i = residents.length - 1; i >= 0; i--) if (residents[i].gone) residents.splice(i, 1);
      if (!cur) return;
      cur.t += dt;
      if (kam.pose === 'walk') kam.wt += kam.rate * dt;
      kam.eyeT += dt;
      for (const a of cur.actors) {
        if (a.pose === 'walk') a.wt += a.rate * dt; a.eyeT += dt;
        if (a.pose !== 'walk' && !a.lockPose) { a.blinkT -= dt; a.pose = a.blinkT < 0 ? 'blink' : 'stand'; if (a.blinkT < -.14) a.blinkT = 2 + rnd() * 4; }
      }
      let done = false;
      try { done = cur.gen.next().done; } catch (e) { console.error('event', cur.id, e); done = true; }
      if (done || cur.t > (DEF[cur.id] && DEF[cur.id].long ? 150 : 66)) finish();
    }
    function draw(layer, g) {
      if (layer === 'back' || layer === 'front') for (const a of residents) if (a.alpha > 0 && (a.feet > FEET + 2) === (layer === 'front') && a.cx > -90 && a.cx < W + 90) { A.drawPet(g, a); if (a.ball) drawBall(g, a); }
      for (const f of rfx.slice()) {
        if (f.layer !== layer) continue;
        const age = clock - f.born;
        if (f.dur && age > f.dur) { stop(f); continue; }
        g.save(); try { f.draw(g, age); } catch (e) { console.error(e); stop(f); } g.restore();
      }
      if (!cur) return;
      if (layer === 'back' || layer === 'front') for (const a of cur.actors) if ((a.layer || 'back') === layer && a.alpha > 0) { if (a.pet) A.drawPet(g, a); else A.drawLlama(g, a); }
      for (const f of cur.fx.slice()) {
        if (f.layer !== layer) continue;
        const age = cur.t - f.born;
        if (f.dur && age > f.dur) { stop(f); continue; }
        g.save(); try { f.draw(g, age); } catch (e) { console.error(e); stop(f); } g.restore();
      }
    }
    const pc = document.createElement('canvas'); pc.width = W; pc.height = H;
    function post(g, cv) {
      if (!cur || !cur.post) return;
      const pg = pc.getContext('2d'); pg.clearRect(0, 0, W, H); pg.drawImage(cv, 0, 0);
      cur.post(g, pc);
    }
    function check(d) {
      if (cfg.on === false) return;
      const key = ymd(d), m = d.getHours() * 60 + d.getMinutes();
      if (key !== planDay) {
        const first = !planDay; plan = planFor(d, cfg, A.festival ? A.festival(d) : null, A.festBoost ? A.festBoost() : 3); planDay = key;
        if (first) plan.forEach(p => { if (p.at < m) p.done = true; });   // after a reload: what's past is past
      }
      for (const p of plan) if (!p.done && p.at <= m) { p.done = true; if (m - p.at <= 20) queue.push({ cat: p.cat, id: p.id }); }
    }
    function pump(msToWalk) {
      if (cur || A.walking() || !queue.length) return;
      const q = queue[0];
      if (q.forced) {
        queue.shift();
        const id = q.id && DEF[q.id] && can(q.id) ? q.id : choose(q.id && DEF[q.id] ? LIST.find(e => e.id === q.id).cat : null, true);
        if (id) start(id);
        return;
      }
      if (q.cat === 'dier' && q.id) { queue.shift(); if (!offList().includes(q.id) && msToWalk > 50000) start(q.id); else if (msToWalk <= 50000) queue.push(q); return; }
      if (!q.id) { q.id = choose(q.cat); if (!q.id) { queue.shift(); return; } }
      if (DEF[q.id].walk) { walkEvent = q.id; queue.shift(); return; }   // waits for the walk timer
      if (msToWalk > 70000) { queue.shift(); if (can(q.id)) start(q.id); else { const alt = choose(q.cat); if (alt && !DEF[alt].walk) start(alt); } }
      // otherwise: right after the next walk
    }
    function walkNow() {
      const id = walkEvent; walkEvent = null;
      return !!(id && can(id) && start(id));
    }
    // ?ev=lama on the tablet's address: try an event right away
    if (A.params && A.params.get('ev')) setTimeout(() => request(A.params.get('ev')), 2500);
    function request(id) { queue.unshift({ forced: true, id: id || '' }); }

    return {
      get active() { return !!cur; },
      check, pump, walkNow, tick, draw, post, request, arrived, placeNew, tapPet, throwBall,
      residents: () => residents.map(a => ({ pet: a.pet, pose: a.pose, x: Math.round(a.cx), busy: !!a.busy, ball: a.ball ? { x: scrX(a.ball.wx), y: a.feet - 7 - a.ball.h, moving: a.ball.moving, held: a.ball.held } : null })),
      // over a reload of the page: who lies where
      keepResidents: () => residents.filter(a => !a.gone).map(a => ({ pet: a.pet, wx: a.wx, feet: a.feet, face: a.face, pose: ['sleep', 'lie', 'sit', 'up'].includes(a.pose) ? a.pose : 'lie', place: a.place, until: a.until, home: a.home })),
      restoreResidents: (list) => { for (const r of list || []) if (PET[r.pet] && !isRes(r.pet)) makeResident(r.pet, r.wx, r.feet, { face: r.face, pose: r.pose, place: r.place, until: r.until, home: r.home }); },
      itemOff: (it, layer, sx, y, w, h) => cur && cur.itemOff ? cur.itemOff(it, layer, sx, y, w, h) : null,
      cloudOff: (cl, x, y, w, h) => cur && cur.cloudOff ? cur.cloudOff(cl, x, y, w, h) : null,
      hideWorld: () => !!(cur && cur.hide),
      walkPending: () => !!walkEvent,
      current: () => cur && cur.id,
      plan: () => plan,
    };
  }

  window.KamielEvents = { LIST, CATS, create, planFor };
})();
