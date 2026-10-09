/* Kamiel's wardrobe: pixel-art clothes drawn on top of him.
   Coordinates are in the full-size Kamiel frame (780 × 1370, facing left); one block = 20 px,
   about the size of his own pixels. Shared by the tablet and the Studio. */
(function () {
  const FRAME_W = 780, FRAME_H = 1370, U = 20;
  // a round glass helmet: a ring of blocks with a highlight
  function ring(R) {
    const rows = [];
    for (let j = 0; j < 2 * R + 1; j++) {
      let row = '';
      for (let i = 0; i < 2 * R + 1; i++) {
        const d = Math.hypot(i - R, j - R);
        row += d > R + .2 ? '.' : d > R - 1.1 ? (j > R + 6 ? 'C' : 'G') : (Math.abs(d - (R - 3)) < .7 && i < R - 2 && j < R - 2 ? 'W' : 'g');
      }
      rows.push(row);
    }
    return rows;
  }
  // body clothes: paint over Kamiel's own pixels below the neck, so they follow his legs when he walks
  const suitCv = document.createElement('canvas');
  function suit(fill) {
    return function (g, x, y, w, h, img) {
      if (!img) return;
      const cw = Math.max(1, Math.ceil(w)), ch = Math.max(1, Math.ceil(h));
      if (suitCv.width !== cw || suitCv.height !== ch) { suitCv.width = cw; suitCv.height = ch; }
      const c = suitCv.getContext('2d');
      c.clearRect(0, 0, cw, ch); c.globalCompositeOperation = 'source-over'; c.drawImage(img, 0, 0, w, h);
      c.globalCompositeOperation = 'source-atop';
      fill(c, (v) => v * w / FRAME_W, (v) => v * h / FRAME_H);
      // keep his fur shading a little
      c.globalCompositeOperation = 'source-over';
      g.drawImage(suitCv, x, y, cw, ch);
    };
  }
  const OUTFITS = [
    { id: 'feesthoed', name: 'Feesthoedje', slot: 'hoofd', x: 145, y: -80, pal: { P: '#ff4fa3', D: '#c2307a', W: '#ffffff', Y: '#ffd23f' },
      rows: ['...Y...', '...P...', '..PWP..', '..PPD..', '.PWPPD.', '.PPPWD.', 'PWPPPPD', 'PPPPWPD'] },
    { id: 'kroon', name: 'Kroon', slot: 'hoofd', x: 125, y: -10, pal: { G: '#f5c518', D: '#b8860b', R: '#e23b3b', B: '#3b6be2', W: '#fff6c9' },
      rows: ['G...G...G', 'GG.GWG.GG', 'GGGGGGGGG', 'GRGGBGGRG', 'DDDDDDDDD'] },
    { id: 'muts', name: 'Muts', slot: 'hoofd', x: 30, y: 5, pal: { W: '#f4f1ea', R: '#2f6fd6', r: '#2558ad', B: '#f4f1ea', b: '#d9d3c7' },
      rows: ['........WW........', '.......WWWW.......', '......RRRRRR......', '....RRRRRRRRRR....', '..RRRRRRRRRRRRRRr.',
             '.RRRRRRRRRRRRRRRRr', 'RRRRRRRRRRRRRRRRRr', 'BbBbBbBbBbBbBbBbBb', 'bBbBbBbBbBbBbBbBbB'] },
    { id: 'cowboy', name: 'Cowboyhoed', slot: 'hoofd', x: 0, y: 45, pal: { H: '#c8925a', h: '#9c6b3c', k: '#4a2f1a' },
      rows: ['.....HHHHHHHHHHH.....', '.....HHHHHHhHHHH.....', '....HHHHHHHHHHHHH....', '....kkkkkkkkkkkkk....',
             'HHHHHHHHHHHHHHHHHHHHH', '.hhhhhhhhhhhhhhhhhhh.'] },
    { id: 'bloemen', name: 'Bloemenkrans', slot: 'hoofd', x: 30, y: 60, pal: { G: '#3f9a3a', P: '#ff6fb5', Y: '#ffd23f', W: '#ffffff', O: '#ff9a3c' },
      rows: ['.P..Y..W..O..P..Y.', 'PYPGYOYWYWGOYOPYPY', 'GPGGGYGGWGGGOGGPGG'] },
    { id: 'koptelefoon', name: 'Koptelefoon', slot: 'hoofd', x: 180, y: 65, pal: { K: '#2b2b2b', C: '#3c3c3c', R: '#e8433b', w: '#8a8a8a' },
      rows: ['KKKKK.....', '....KK....', '.....K....', '......K...', '......K...', '.....CCCC.',
             '....CCRRCC', '....CRRRRC', '....CRwRRC', '....CCRRCC', '.....CCCC.'] },
    { id: 'zonnebril', name: 'Zonnebril', slot: 'ogen', x: 0, y: 260, pal: { L: '#111114', K: '#111114', W: '#ffffff', p: '#3b2a5a' },
      rows: ['LLL.......LLLW.....', 'LLLKKKKKKKLLLLKKKKK', 'LpL.......LppL.....', '.L.........LL......'] },
    { id: 'nerdbril', name: 'Ronde bril', slot: 'ogen', x: 0, y: 260, pal: { K: '#3a2414', g: 'rgba(190,225,255,.35)' },
      rows: ['KKK.......KKKK.....', 'KgKKKKKKKKKggKKKKKK', 'KgK.......KggK.....', 'KKK.......KKKK.....'] },
    { id: 'sjaal', name: 'Sjaal', slot: 'nek', x: 60, y: 465, pal: { S: '#d93a3a', s: '#f3e3c3' },
      rows: ['SSSSSSSSSSSSSSSS', 'sSsSsSsSsSsSsSsS', 'SSSSSSSSSSSSSSSS', 'SSSS............', '.SSS............',
             '.sSs............', '.SSS............', '.S.S............'] },
    { id: 'strik', name: 'Strik', slot: 'nek', x: 50, y: 465, pal: { B: '#c0182c', b: '#7e0d1c' },
      rows: ['BB..BB', 'BBbbBB', 'BB..BB'] },
    { id: 'rodeneus', name: 'Rode neus', slot: 'neus', x: 0, y: 330, pal: { R: '#e3202b', W: '#ffd0d0' },
      rows: ['.RR.', 'RWRR', 'RRRR', '.RR.'] },
    { id: 'snor', name: 'Snor', slot: 'neus', x: 10, y: 395, pal: { M: '#2a1a10' },
      rows: ['.MMMM', 'MM..M', 'M....'] },
    { id: 'kerstmuts', name: 'Kerstmuts', slot: 'hoofd', x: 10, y: -20, pal: { R: '#d7262e', r: '#9e1820', W: '#f6f3ee', w: '#d9d3c7' },
      rows: ['.................WW.', '...............rRWWW', '.............RRRR.W.', '...........RRRRRR...', '.........RRRRRRRr...',
             '.......RRRRRRRRRr...', '.....RRRRRRRRRRRr...', '...RRRRRRRRRRRRRRr..', '..WWWWWWWWWWWWWWWWW.', '..WwWwWwWwWwWwWwWwW.'] },
    { id: 'paasoren', name: 'Paasoortjes', slot: 'hoofd', x: 50, y: -190, pal: { W: '#f7f4f0', P: '#ffb0cc', K: '#ff7fb0' },
      rows: ['...WW......WW...', '..WWWW....WWWW..', '..WPPW....WPPW..', '..WPPW....WPPW..', '..WPPW....WPPW..', '..WPPW....WPPW..',
             '..WPPW....WPPW..', '..WPPW....WPPW..', '..WPPW....WPPW..', '..WWWW....WWWW..', '...WW......WW...', 'KKKKKKKKKKKKKKKK'] },
    { id: 'heksenhoed', name: 'Heksenhoed', slot: 'hoofd', x: 20, y: -110, pal: { K: '#231a33', k: '#3a2d52', P: '#8a3cff', Y: '#ffd23f' },
      rows: ['..........K.......', '.........KK.......', '........KkK.......', '.......KKkK.......', '......KKKkKK......', '.....KKKKkKK......',
             '....KKKKKkKKK.....', '....PPPPPPPPP.....', '...PPPYPPPPPPP....', 'KKKKKKKKKKKKKKKKKK'] },
    { id: 'propellerpet', name: 'Propellerpet', slot: 'hoofd', x: 0, y: -30, pal: { R: '#e2343a', Y: '#ffd23f', B: '#2f6fd6', K: '#2b2b2b', G: '#3f9a3a' },
      rows: ['...RRRR.YYYY......', '.......KK.........', '.....RRYYBBGG.....', '...RRRYYYBBBGGG...', '..RRRRYYYBBBGGGG..', 'BBBBBBBBBBBBBBBBB.'] },
    { id: 'piratenhoed', name: 'Piratenhoed', slot: 'hoofd', x: 10, y: 0, pal: { K: '#1a1a1a', W: '#f2f2f2', Y: '#d4a017' },
      rows: ['......KKKKKKKK......', '...KKKKKKKKKKKKKK...', '..KKKKKKWWKKKKKKKK..', 'KKKKKKKWKKWKKKKKKKKK', '.KKKKKKKWWKKKKKKKKK.',
             '..YYYYYYYYYYYYYYYY..'] },
    { id: 'hoed', name: 'Zwarte hoed', slot: 'hoofd', x: 40, y: 20, pal: { K: '#151515', k: '#2c2c2c', G: '#5a5a5a' },
      rows: ['....KKKKKKKK....', '...KKKKkKKKKK...', '...KKKKKKKKKK...', '...GGGGGGGGGG...', 'KKKKKKKKKKKKKKKK', '.kkkkkkkkkkkkkk.'] },
    { id: 'astrohelm', name: 'Ruimtehelm', slot: 'hoofd', x: -70, y: -40, pal: { G: '#c9ced8', g: 'rgba(190,225,255,.22)', W: 'rgba(255,255,255,.75)', C: '#9aa1ad' },
      rows: ring(13) },
    { id: 'hartjesbril', name: 'Hartjesbril', slot: 'ogen', x: 0, y: 250, pal: { P: '#ff3d8b', K: '#2b1020', W: '#ffd0e4' },
      rows: ['PP.PP.....PP.PP....', 'PWPPPKKKKKPWPPPKKKK', '.PPP.......PPP.....', '..P.........P......'] },
    { id: 'ketting', name: 'Gouden ketting', slot: 'nek', x: 50, y: 470, pal: { Y: '#f5c518', D: '#b8860b' },
      rows: ['Y.Y.Y.Y.Y.Y.Y.Y.Y', '.Y.Y.Y.Y.Y.Y.Y.Y.', '..YDY............', '..DYD............'] },
    { id: 'das', name: 'Stropdas', slot: 'nek', x: 60, y: 470, pal: { B: '#2c4fbf', b: '#1b347f', W: '#ffffff' },
      rows: ['WBBBW', '.BBB.', '.BbB.', '.BBB.', 'BBbBB', 'BbBBB', 'BBBbB', '.BBB.', '..B..'] },
    { id: 'astropak', name: 'Ruimtepak', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y, U) => {
        g.fillStyle = '#eceff4'; g.fillRect(X(0), Y(440), X(780), Y(930));
        g.fillStyle = '#c9ced8'; for (let y = 520; y < 1300; y += 120) g.fillRect(X(0), Y(y), X(780), Y(20));
        g.fillStyle = '#8e95a3'; g.fillRect(X(0), Y(980), X(780), Y(40));
        g.fillStyle = '#5b6170'; g.fillRect(X(0), Y(1250), X(780), Y(120));
        g.fillStyle = '#b8bdc8'; g.fillRect(X(220), Y(640), X(160), Y(120));
        g.fillStyle = '#e2343a'; g.fillRect(X(240), Y(660), X(40), Y(40));
        g.fillStyle = '#2f6fd6'; g.fillRect(X(300), Y(660), X(40), Y(40));
        g.fillStyle = '#ffd23f'; g.fillRect(X(240), Y(720), X(100), Y(20));
        g.fillStyle = '#2f6fd6'; g.fillRect(X(520), Y(700), X(100), Y(60)); g.fillStyle = '#fff'; g.fillRect(X(540), Y(720), X(20), Y(20));
      }) },
    { id: 'kersttrui', name: 'Kersttrui', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#c3202b'; g.fillRect(X(0), Y(440), X(780), Y(720));
        g.fillStyle = '#f6f3ee'; for (let x = 0; x < 780; x += 40) { g.fillRect(X(x), Y(760 + (x / 40 % 2) * 20), X(20), Y(20)); g.fillRect(X(x), Y(1000 - (x / 40 % 2) * 20), X(20), Y(20)); }
        g.fillStyle = '#2f8a3a'; g.fillRect(X(0), Y(860), X(780), Y(60)); g.fillRect(X(0), Y(1120), X(780), Y(40));
        g.fillStyle = '#f6f3ee'; for (let x = 20; x < 780; x += 80) g.fillRect(X(x), Y(880), X(20), Y(20));
      }) },
    { id: 'regenjas', name: 'Regenjas', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#f2c230'; g.fillRect(X(0), Y(440), X(780), Y(800));
        g.fillStyle = '#d9a514'; for (let y = 470; y < 1240; y += 100) g.fillRect(X(0), Y(y), X(780), Y(20));
        g.fillStyle = '#5a3d0c'; [600, 740, 880, 1020].forEach(y => g.fillRect(X(200), Y(y), X(30), Y(30)));
      }) },
    // for the films (and the wardrobe)
    { id: 'ninjaband', name: 'Ninjaband', slot: 'hoofd', x: 0, y: 150, pal: { R: '#d7262e', r: '#8e141b', G: '#b9c0c9', g: '#7d858f' },
      rows: ['RRRRRRRRRRRRRRRRRRR....', 'RGGGRRRRRRRRRRRRRRRRr..', 'RgggRRRRRRRRRRRRRRRRRr.', 'rrrrrrrrrrrrrrrrrr.rRRr', '...................r.rR', '....................r.r'] },
    { id: 'tovenaarshoed', name: 'Tovenaarshoed', slot: 'hoofd', x: -20, y: -170, pal: { B: '#27306e', b: '#18204a', Y: '#ffd23f', y: '#c99a12' },
      rows: ['..............BB......', '.............BBB......', '............BBB.......', '...........BBBB.......', '..........BBBBB.......', '.........BBBYBBB......',
             '.........BBBBBBB......', '........BBBBBBBBB.....', '........BBYBBBBBBB....', '.......BBBBBBBBYBB....', '.......BBBBBBBBBBBB...', '......bbbbbbbbbbbbb...',
             '......YYyYYyYYyYYyY...', 'BBBBBBBBBBBBBBBBBBBBBB', '.bbbbbbbbbbbbbbbbbbbb.'] },
    { id: 'baret', name: 'Rode baret', slot: 'hoofd', x: 10, y: 40, pal: { R: '#c3202b', r: '#8a1520', Y: '#ffd23f', k: '#3a0a10' },
      rows: ['......RRRRRRRR......', '...RRRRRRRRRRRRRR...', '.RRRRRRYRRRRRRRRRRR.', 'RRRRRRYYYRRRRRRRRRRr', 'RRRRRRRYRRRRRRRRRRrr', '.kkkkkkkkkkkkkkkkkk.'] },
    { id: 'gasmasker', name: 'Gasmasker', slot: 'neus', x: -30, y: 290, pal: { G: '#4b5148', g: '#6d7468', K: '#1d201c', C: '#8a8f86', c: '#5f645c', k: '#2a2a2a' },
      rows: ['...GGGGGGGG..........', '..GGggggggGG.........', '.GGgKKgKKggGkkkkkkkkk', 'CCGggggggggGG........', 'CcCGgKgKgKgGG........', 'CcCGgggggggGG........', 'CCCGGGGGGGGG.........'] },
    { id: 'stofbril', name: 'Stofbril', slot: 'ogen', x: 140, y: 240, pal: { Y: '#b8862b', y: '#7a5518', g: 'rgba(120,210,170,.55)', W: 'rgba(255,255,255,.8)', K: '#3a2a14' },
      rows: ['..YYYY.............', '.YggggY............', 'YgWgggYKKKKKKKKKKKK', 'YgggggYy...........', '.YggggY............', '..YYYY.............'] },
    { id: 'boord', name: 'Priesterboord', slot: 'nek', x: 70, y: 450, pal: { K: '#16131a', W: '#ffffff' },
      rows: ['KKKKKKKKKKKKKKK', 'KWWKKKKKKKKKKKK', 'KWWKKKKKKKKKKKK'] },
    { id: 'roodpak', name: 'Rode overall', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#b3121b'; g.fillRect(X(0), Y(440), X(780), Y(930));
        g.fillStyle = '#860c14'; for (let y = 560; y < 1300; y += 160) g.fillRect(X(0), Y(y), X(780), Y(14));
        g.fillStyle = '#e0c060'; g.fillRect(X(150), Y(470), X(16), Y(420));
        g.fillStyle = '#3a2a20'; g.fillRect(X(0), Y(1250), X(780), Y(120));
      }) },
    { id: 'ninjapak', name: 'Ninjapak', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#1c1c24'; g.fillRect(X(0), Y(440), X(780), Y(930));
        g.fillStyle = '#2e2e3a'; g.fillRect(X(100), Y(470), X(30), Y(300)); g.fillRect(X(200), Y(470), X(30), Y(260));
        g.fillStyle = '#d7262e'; g.fillRect(X(0), Y(860), X(780), Y(50)); g.fillRect(X(560), Y(900), X(30), Y(110));
        g.fillStyle = '#111116'; g.fillRect(X(0), Y(1250), X(780), Y(120));
      }) },
    { id: 'mantel', name: 'Tovenaarsmantel', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#1e2a6e'; g.fillRect(X(0), Y(440), X(780), Y(820));
        g.fillStyle = '#ffd23f'; [[120, 560], [300, 700], [520, 640], [660, 820], [220, 900], [440, 980], [620, 1080], [100, 1100]].forEach(([x, y]) => { g.fillRect(X(x), Y(y), X(20), Y(20)); g.fillRect(X(x - 20), Y(y + 20), X(60), Y(20)); g.fillRect(X(x), Y(y + 40), X(20), Y(20)); });
        g.fillStyle = '#c99a12'; g.fillRect(X(0), Y(1180), X(780), Y(30));
      }) },
    { id: 'legerjas', name: 'Legerjas', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#4f5a2a'; g.fillRect(X(0), Y(440), X(780), Y(800));
        g.fillStyle = '#3c4520'; g.fillRect(X(260), Y(700), X(120), Y(90)); g.fillRect(X(480), Y(700), X(120), Y(90)); g.fillRect(X(0), Y(900), X(780), Y(24));
        g.fillStyle = '#d4a017'; [560, 660, 760].forEach(y => g.fillRect(X(150), Y(y), X(24), Y(24)));
        g.fillStyle = '#c3202b'; g.fillRect(X(330), Y(600), X(30), Y(30));
      }) },
    { id: 'toog', name: 'Zwarte toog', slot: 'lijf', cx: 450, cy: 800, paint: suit((g, X, Y) => {
        g.fillStyle = '#18151c'; g.fillRect(X(0), Y(440), X(780), Y(860));
        g.fillStyle = '#2a2530'; [520, 600, 680, 760, 840, 920].forEach(y => g.fillRect(X(140), Y(y), X(16), Y(16)));
      }) },
  ];
  const SLOTS = [['hoofd', 'Hoofd'], ['ogen', 'Ogen'], ['nek', 'Nek'], ['neus', 'Neus'], ['lijf', 'Lijf']];

  // draw the chosen pieces on Kamiel; (x, y, w, h) is where his frame is drawn
  // img: the Kamiel frame being drawn (body clothes need it); body clothes go first, under the rest
  function draw(g, ids, x, y, w, h, img) {
    const sx = w / FRAME_W, sy = h / FRAME_H;
    const list = (ids || []).map(id => OUTFITS.find(z => z.id === id)).filter(Boolean).sort((a, b) => (b.slot === 'lijf') - (a.slot === 'lijf'));
    for (const o of list) {
      if (o.paint) { o.paint(g, x, y, w, h, img); continue; }
      o.rows.forEach((row, r) => [...row].forEach((ch, c) => {
        const col = o.pal[ch]; if (!col) return;
        const x0 = Math.round(x + (o.x + c * U) * sx), y0 = Math.round(y + (o.y + r * U) * sy);
        const x1 = Math.round(x + (o.x + (c + 1) * U) * sx), y1 = Math.round(y + (o.y + (r + 1) * U) * sy);
        g.fillStyle = col; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      }));
    }
  }
  // a close-up of Kamiel wearing one piece, centred on that piece
  function preview(g, id, img, size) {
    const o = OUTFITS.find(z => z.id === id); if (!o) return;
    const cx = o.paint ? o.cx : o.x + o.rows[0].length * U / 2, cy = o.paint ? o.cy : o.y + o.rows.length * U / 2, span = o.paint ? 640 : 440;
    const crop = [Math.max(-60, Math.min(FRAME_W - span, cx - span / 2)), Math.max(-140, cy - span / 2), span, span];
    const sx = img.width / FRAME_W, k = size / span;
    g.clearRect(0, 0, size, size);
    g.imageSmoothingEnabled = false;
    // the frame image has no pixels above y=0: draw only the part that exists
    const y0 = Math.max(0, crop[1]), x0 = Math.max(0, crop[0]);
    g.drawImage(img, x0 * sx, y0 * sx, (crop[0] + span - x0) * sx, (crop[1] + span - y0) * sx, (x0 - crop[0]) * k, (y0 - crop[1]) * k, (crop[0] + span - x0) * k, (crop[1] + span - y0) * k);
    if (o.paint) {   // body clothes paint over the whole frame: draw it whole, then crop
      const full = document.createElement('canvas'); full.width = Math.ceil(FRAME_W * k); full.height = Math.ceil(FRAME_H * k);
      const fg = full.getContext('2d'); fg.imageSmoothingEnabled = false;
      o.paint(fg, 0, 0, FRAME_W * k, FRAME_H * k, img);
      g.drawImage(full, -crop[0] * k, -crop[1] * k);
      return;
    }
    draw(g, [id], -crop[0] * k, -crop[1] * k, FRAME_W * k, FRAME_H * k, img);
  }
  window.KamielOutfits = { OUTFITS, SLOTS, draw, preview };
})();
