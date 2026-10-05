/* Kamiel's wardrobe: pixel-art clothes drawn on top of him.
   Coordinates are in the full-size Kamiel frame (780 × 1370, facing left); one block = 20 px,
   about the size of his own pixels. Shared by the tablet and the Studio. */
(function () {
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
  ];
  const SLOTS = [['hoofd', 'Hoofd'], ['ogen', 'Ogen'], ['nek', 'Nek'], ['neus', 'Neus']];
  const FRAME_W = 780, FRAME_H = 1370, U = 20;

  // draw the chosen pieces on Kamiel; (x, y, w, h) is where his frame is drawn
  function draw(g, ids, x, y, w, h) {
    const sx = w / FRAME_W, sy = h / FRAME_H;
    for (const id of ids || []) {
      const o = OUTFITS.find(z => z.id === id); if (!o) continue;
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
    const cx = o.x + o.rows[0].length * U / 2, cy = o.y + o.rows.length * U / 2, span = 440;
    const crop = [Math.max(-60, Math.min(FRAME_W - span, cx - span / 2)), Math.max(-140, cy - span / 2), span, span];
    const sx = img.width / FRAME_W, k = size / span;
    g.clearRect(0, 0, size, size);
    g.imageSmoothingEnabled = false;
    // the frame image has no pixels above y=0: draw only the part that exists
    const y0 = Math.max(0, crop[1]), x0 = Math.max(0, crop[0]);
    g.drawImage(img, x0 * sx, y0 * sx, (crop[0] + span - x0) * sx, (crop[1] + span - y0) * sx, (x0 - crop[0]) * k, (y0 - crop[1]) * k, (crop[0] + span - x0) * k, (crop[1] + span - y0) * k);
    draw(g, [id], -crop[0] * k, -crop[1] * k, FRAME_W * k, FRAME_H * k);
  }
  window.KamielOutfits = { OUTFITS, SLOTS, draw, preview };
})();
