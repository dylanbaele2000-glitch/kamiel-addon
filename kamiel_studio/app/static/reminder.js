/* Reminders: when they are on, and how the text looks.
   Shared by the tablet (display.html) and the preview in Kamiel Studio. */
(function () {
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseDate = (s) => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = (d) => (d.getDay() + 6) % 7 + 1;            // monday = 1 … sunday = 7
  const mondayOf = (d) => { const m = new Date(d.getFullYear(), d.getMonth(), d.getDate()); m.setDate(m.getDate() - iso(m) + 1); return m; };

  // does the reminder have an occurrence that starts on this calendar day?
  function onDay(r, day) {
    const start = parseDate(r.date), key = ymd(day);
    if (r.until && key > r.until) return false;
    switch (r.repeat) {
      case 'once': return r.date === key;
      case 'daily': return !start || key >= r.date;
      case 'weekly': {
        if (start && key < r.date) return false;
        if (!(r.days || []).includes(iso(day))) return false;
        const n = Math.max(1, +r.every_weeks || 1);
        if (n === 1 || !start) return true;
        const weeks = Math.round((mondayOf(day) - mondayOf(start)) / (7 * 864e5));
        return weeks % n === 0;
      }
      case 'monthly': {
        if (start && key < r.date) return false;
        const want = Math.max(1, Math.min(31, +r.month_day || 1));
        const last = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
        return day.getDate() === Math.min(want, last);   // the 31st becomes the last day in short months
      }
      case 'yearly': return !!start && start.getMonth() === day.getMonth() && start.getDate() === day.getDate();
    }
    return false;
  }

  // is it on right now? A window like 22:00–02:00 runs past midnight and belongs to the day it started.
  function isActive(r, d) {
    if (!r || r.active === false || !(r.text || '').trim()) return false;
    const from = r.from || '00:00', to = r.to || '23:59', t = hm(d);
    if (from <= to) return t >= from && t <= to && onDay(r, d);
    if (t >= from) return onDay(r, d);
    if (t <= to) { const y = new Date(d); y.setDate(y.getDate() - 1); return onDay(r, y); }
    return false;
  }

  // the next moment it switches on (for the Studio), or null
  function nextStart(r, d) {
    if (!r || r.active === false) return null;
    const from = (r.from || '00:00').split(':').map(Number);
    for (let k = 0; k < 800; k++) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k, from[0], from[1] || 0);
      if (day > d && onDay(r, day)) return day;
    }
    return null;
  }

  /* The look: chunky bold sans, low resolution, red with a cyan ghost — like a saved-too-often meme. */
  const FONT = "Arimo, Arial, 'Liberation Sans', Helvetica, sans-serif";
  function render(text, opts) {
    const W = opts.width || 960, H = opts.height || 600, F = 2.6;
    const sw = Math.round(W / F), sh = Math.round(H / F);
    const small = document.createElement('canvas'); small.width = sw; small.height = sh;
    const g = small.getContext('2d');
    const color = opts.color || '#c8202a';
    // lines: keep the user's own line breaks, wrap the rest
    const maxW = sw * .72;
    let fs = Math.round(sh * .12), lines;
    for (; fs > 8; fs--) {
      g.font = `700 ${fs}px ${FONT}`;
      lines = [];
      for (const para of String(text).split('\n')) {
        let cur = '';
        for (const word of para.split(/\s+/).filter(Boolean)) {
          const tryL = cur ? cur + ' ' + word : word;
          if (g.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = word; } else cur = tryL;
        }
        lines.push(cur);
      }
      const widest = Math.max(...lines.map(l => g.measureText(l).width));
      if (widest <= maxW && lines.length * fs * 1.12 <= sh * .72) break;
    }
    const lh = fs * 1.12, cy = sh * ({ boven: .3, onder: .66 }[opts.position] || .46);
    const y0 = cy - (lines.length - 1) * lh / 2;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const dark = shade(color, -.45);
    lines.forEach((l, i) => {
      const x = sw / 2, y = y0 + i * lh;
      g.fillStyle = 'rgba(70,235,225,.85)'; g.fillText(l, x - 1.3, y + .7);     // cyan ghost
      g.fillStyle = 'rgba(120,255,150,.30)'; g.fillText(l, x + 1.1, y + 1.2);   // faint green
      g.strokeStyle = dark; g.lineWidth = 1.3; g.strokeText(l, x, y);
      const gr = g.createLinearGradient(0, y - fs / 2, 0, y + fs / 2);
      gr.addColorStop(0, shade(color, .18)); gr.addColorStop(1, color);
      g.fillStyle = gr; g.fillText(l, x, y);
    });
    if (opts.sign) {   // who sent it, small under the text
      const fs2 = Math.max(8, Math.round(fs * .45)), y = y0 + (lines.length - 1) * lh + fs * .55 + fs2;
      g.font = `700 ${fs2}px ${FONT}`; g.textAlign = 'right';
      g.fillStyle = 'rgba(70,235,225,.85)'; g.fillText('— ' + opts.sign.toLowerCase(), sw / 2 + maxW / 2 - 1, y + .5);
      g.fillStyle = color; g.fillText('— ' + opts.sign.toLowerCase(), sw / 2 + maxW / 2, y);
    }
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'low';
    o.drawImage(small, 0, 0, W, H);
    return out;
  }
  function shade(hex, amt) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    const f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  window.KamielReminder = { isActive, nextStart, render, onDay, FONT };
})();
