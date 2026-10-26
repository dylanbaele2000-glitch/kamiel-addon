/* Plattegrond: the floor plan in Kamiel Studio (the tab "Plattegrond").
   Operate: floors, a drawing with rooms, lamps/switches/speakers/sensors on it, scenes per room, "Heel huis".
   Edit: upload a drawing, click the corners of rooms, pick devices from Home Assistant and click where they stand.
   Everything is stored by the add-on (/data), nothing of the house is in this file.
   The look is Windows 95 on purpose (a fixed palette, also in dark mode): it is a little window inside the Studio. */
(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const root = $('p-plan'), tabBtn = $('tab-plan');
if (!root || !tabBtn) return;
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mq = window.matchMedia ? window.matchMedia('(max-width: 900px), (pointer: coarse)') : null;
const narrow = () => !!(mq && mq.matches);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const newId = () => Math.random().toString(16).slice(2, 10).padEnd(8, '0');

/* ---------- state ---------- */
let H = { floors: [], devices: [], scenes: [] };     // what is saved
let ST = {};                                          // Home Assistant states of the devices on the plan, by entity
let connected = true, started = false, edit = false;
let floorId = null, tab = 'house', sel = null, selRoom = null;
let tool = null;          // { kind: 'room', pts: [[x, y]] } or { kind: 'place', entity, name }
let RUN = {}, full = false, fsAsked = false, knopEd = null;
let drag = null, busy = false, armed = '', armedT = null;
let ENTS = null, ACTS = null, entQ = '', picking = false;
let timer = null, saveT = null, saving = Promise.resolve(), toastT = null;

/* ---------- small helpers ---------- */
async function api(method, url, body, raw) {
  const opt = { method, headers: {} };
  if (body !== undefined) {
    if (raw) opt.body = body; else { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  }
  const r = await fetch(url, opt);
  if (!r.ok) { let t = ''; try { t = await r.text(); } catch (e) { /* no text */ } throw new Error(t && t.length < 200 ? t : 'Fout ' + r.status); }
  return r.json();
}
function setHTML(el, html) { if (el && el._h !== html) { el._h = html; el.innerHTML = html; } }
const FL = () => H.floors.find(f => f.id === floorId) || null;
const devsHere = () => H.devices.filter(d => d.floor === floorId);
const devById = (id) => H.devices.find(d => d.id === id) || null;
const stOf = (d) => ST[d.knop ? d.status : d.entity] || null;
function kind(d) {
  if (d.knop) return 'knop';
  const dom = d.entity.split('.')[0];
  return dom === 'media_player' ? 'speaker' : dom === 'sensor' ? 'sensor' : dom === 'binary_sensor' ? 'binary' : dom === 'light' ? 'light' : 'switch';
}
function isOn(d) { const s = stOf(d); if (!s) return false; return kind(d) === 'speaker' ? s.state === 'playing' : s.state === 'on'; }
function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function roomOf(d) { const f = H.floors.find(x => x.id === d.floor); if (!f) return null; return [...f.rooms].reverse().find(r => inPoly(d.x, d.y, r.poly)) || null; }
const roomById = (id) => { for (const f of H.floors) { const r = f.rooms.find(x => x.id === id); if (r) return r; } return null; };
function fmtNum(v) { const n = Number(v); return isFinite(n) && String(v).trim() !== '' ? n.toLocaleString('nl-BE', { maximumFractionDigits: 1 }) : String(v); }
const BIN = { door: ['Open', 'Dicht'], window: ['Open', 'Dicht'], garage_door: ['Open', 'Dicht'], opening: ['Open', 'Dicht'], motion: ['Beweging', 'Geen beweging'],
  occupancy: ['Bezet', 'Vrij'], presence: ['Thuis', 'Weg'], moisture: ['Nat', 'Droog'], smoke: ['Rook!', 'Ok'], gas: ['Gas!', 'Ok'], problem: ['Probleem', 'Ok'],
  battery: ['Laag', 'Ok'], lock: ['Open', 'Op slot'], plug: ['Ingeplugd', 'Los'], connectivity: ['Verbonden', 'Niet verbonden'], light: ['Licht', 'Donker'],
  vibration: ['Trilt', 'Stil'], tamper: ['Geknoeid', 'Ok'], cold: ['Koud', 'Ok'], heat: ['Heet', 'Ok'] };
function sensorText(d) {
  const s = stOf(d);
  if (!s || !s.ok) return '—';
  if (kind(d) === 'binary') { const t = BIN[s.dc] || ['Aan', 'Uit']; return s.state === 'on' ? t[0] : t[1]; }
  return fmtNum(s.state) + (s.unit ? (/^[%°]/.test(s.unit) ? '' : ' ') + s.unit : '');
}
function toast(t, bad) {
  const el = $('hs-st2'); if (!el) return;
  el.textContent = t; el.className = bad ? 'bad' : '';
  clearTimeout(toastT); toastT = setTimeout(() => { el.textContent = ''; }, 4000);
}
function warn(key) { // two clicks for anything that deletes
  if (armed === key) { armed = ''; return true; }
  armed = key; clearTimeout(armedT); armedT = setTimeout(() => { armed = ''; redrawEditor(); }, 3000); redrawEditor(); return false;
}

/* ---------- saving ---------- */
function setSave(t, bad) { const el = $('hs-save'); if (el) { el.textContent = t; el.className = bad ? 'bad' : ''; } }
function queueSave() { clearTimeout(saveT); setSave('Bewaren…'); saveT = setTimeout(flush, 500); }
function flush() { clearTimeout(saveT); saveT = null; saving = saving.then(doSave); return saving; }
async function doSave() {
  try {
    await api('PUT', 'api/house', { floors: H.floors.map(f => ({ id: f.id, name: f.name, rooms: f.rooms })), devices: H.devices, scenes: H.scenes });
    setSave('Bewaard');
  } catch (e) { setSave('Niet bewaard: ' + e.message, true); }
}

/* ---------- start ---------- */
const CSS = `
.hs{--face:#c0c0c0;--hi:#fff;--soft:#dfdfdf;--lo:#808080;--dark:#404040;--ink:#000;--navy:#000080;--navy2:#1084d0;--on:#00a000;--lit:#fff3a8;--off:#4a4a4a;
 background:#008080;padding:12px;display:flex;flex-direction:column;gap:10px;color:#000;font:14px/1.35 "MS Sans Serif","Microsoft Sans Serif",Tahoma,"Segoe UI",Arial,sans-serif}
.hs *{box-sizing:border-box}
.hs .raised{background:var(--face);border:2px solid;border-color:var(--hi) var(--dark) var(--dark) var(--hi);box-shadow:inset -1px -1px var(--lo),inset 1px 1px var(--soft)}
.hs .sunken{background:var(--hi);border:2px solid;border-color:var(--lo) var(--hi) var(--hi) var(--lo);box-shadow:inset 1px 1px var(--dark),inset -1px -1px var(--soft)}
.hs button.b{font:14px/1.2 inherit;font-family:inherit;color:#000;background:var(--face);border:2px solid;border-color:var(--hi) var(--dark) var(--dark) var(--hi);border-radius:0;box-shadow:inset -1px -1px var(--lo),inset 1px 1px var(--soft);padding:4px 12px;min-height:30px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;font-weight:400}
.hs button.b:active,.hs button.b[aria-pressed="true"]{border-color:var(--dark) var(--hi) var(--hi) var(--dark);box-shadow:inset 1px 1px var(--lo),inset -1px -1px var(--soft);padding:5px 11px 3px 13px}
.hs button.b[aria-pressed="true"]{background:repeating-conic-gradient(var(--face) 0 25%,var(--hi) 0 50%) 0 0/2px 2px}
.hs button.b:disabled{color:var(--lo);cursor:default;text-shadow:1px 1px var(--hi)}
.hs button.b.big{min-height:44px;font-weight:700;font-size:15px;width:100%}
.hs button.b.sm{min-height:24px;padding:1px 9px;font-size:13px}
.hs button.b.x{min-height:22px;min-width:24px;padding:0 6px}
.hs button:focus-visible,.hs input:focus-visible,.hs select:focus-visible,.hs [tabindex]:focus-visible{outline:1px dotted #000;outline-offset:-5px}
.hs input[type=text],.hs input[type=search],.hs select{width:100%;min-width:0;font:14px inherit;font-family:inherit;color:#000;background:var(--hi);border:2px solid;border-color:var(--lo) var(--hi) var(--hi) var(--lo);border-radius:0;box-shadow:inset 1px 1px var(--dark);padding:3px 5px;min-height:28px}
.hs input[type=range]{width:100%;min-width:0;accent-color:var(--navy);min-height:28px;margin:0}
.hs input[type=color]{width:44px;height:30px;padding:0;border:2px solid;border-color:var(--hi) var(--dark) var(--dark) var(--hi);background:var(--face);border-radius:0;cursor:pointer}
.hs-title{display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,var(--navy),var(--navy2));color:#fff;padding:3px 6px;margin:2px}
.hs-title b{flex:1;font-size:13px}
.hs-ico{width:14px;height:14px;background:linear-gradient(135deg,#fff 0 50%,var(--lit) 50%);border:1px solid #000;flex:none}
.hs-body{padding:6px;display:flex;flex-direction:column;gap:8px}
.hs-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.hs-bar .sp{flex:1}
.hs-led{display:inline-block;width:10px;height:10px;border:1px solid #000;background:var(--off);flex:none}
.hs-led.on{background:#19e619;box-shadow:inset 0 0 0 1px var(--on)}
.hs-led.round{border-radius:50%}
.hs-banner{padding:6px 8px;background:#ffffe1;border:1px solid #000;color:#000}
.hs-tabs{display:flex;align-items:flex-end;padding-left:6px;position:relative;z-index:1;margin-bottom:-2px;overflow-x:auto;scrollbar-width:thin}
.hs-tab{flex:none;white-space:nowrap;font:14px inherit;font-family:inherit;color:#000;background:var(--face);border:2px solid;border-color:var(--hi) var(--dark) var(--face) var(--hi);border-radius:0;box-shadow:inset 1px 1px var(--soft);padding:2px 12px 3px;margin:0 2px 2px 0;cursor:pointer;min-height:26px;display:inline-flex;gap:6px;align-items:center}
.hs-tab[aria-selected="true"]{margin-bottom:0;padding:4px 14px 5px;font-weight:700;min-height:30px}
.hs-panel{border:2px solid;border-color:var(--hi) var(--dark) var(--dark) var(--hi);box-shadow:inset -1px -1px var(--lo),inset 1px 1px var(--soft);padding:8px;background:var(--face)}
.hs-main{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:8px;align-items:start}
.hs-plan{min-width:0;overflow:hidden}
#hs-svg{display:block;width:100%;height:auto;max-height:76vh;user-select:none;-webkit-user-select:none}
#hs-svg.tool{touch-action:none;cursor:crosshair}
.hs .room{fill:transparent;cursor:pointer}
.hs .room.lit{fill:rgba(255,214,90,.30)}
.hs .room.cur{fill:rgba(0,0,128,.07);stroke:var(--navy);stroke-width:2px;stroke-dasharray:6 4;vector-effect:non-scaling-stroke}
.hs .room.out{stroke:#000;stroke-width:3px;vector-effect:non-scaling-stroke}
.hs .room.ed{stroke:#808080;stroke-width:1.5px;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}
.hs .room.sel{stroke:var(--navy);stroke-width:2.5px;stroke-dasharray:none;fill:rgba(0,0,128,.10)}
.hs .rname{fill:#555;font-weight:700;letter-spacing:.06em;text-transform:uppercase;pointer-events:none}
.hs .mk{cursor:pointer;outline:none}
.hs.ed .mk{cursor:grab;touch-action:none}
.hs .vh{fill:#fff;stroke:var(--navy);stroke-width:2px;vector-effect:non-scaling-stroke;cursor:move;touch-action:none}
.hs .mlabel{fill:#000;stroke:#fff;stroke-width:4px;paint-order:stroke;stroke-linejoin:round}
.hs .selbox{fill:none;stroke:var(--navy);stroke-width:2px;stroke-dasharray:5 3;vector-effect:non-scaling-stroke}
.hs-side{display:flex;flex-direction:column;gap:8px;min-width:0}
.hs-ct{padding:8px;display:flex;flex-direction:column;gap:8px}
.hs-ct .h{display:flex;justify-content:space-between;align-items:center;gap:6px}
.hs-ct .h b{overflow-wrap:anywhere}
.hs .ent{font:11px ui-monospace,Menlo,Consolas,monospace;color:var(--lo);overflow-wrap:anywhere}
.hs .dim{color:var(--dark)}
.hs .val{font:700 30px/1.1 ui-monospace,Menlo,Consolas,monospace;padding:8px;background:#000;color:#19e619;overflow-wrap:anywhere}
.hs .np{font:16px/1.2 ui-monospace,Menlo,Consolas,monospace;padding:6px 8px;background:#000;color:#19e619;overflow-wrap:anywhere;min-height:2.6em}
.hs .sl{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.hs .sl output{font:700 15px ui-monospace,Menlo,Consolas,monospace}
.hs .trip{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:6px}
.hs .vol{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:center}
.hs .sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.hs .swb{width:30px;height:30px;padding:0;border:2px solid;border-color:var(--hi) var(--dark) var(--dark) var(--hi);border-radius:0;cursor:pointer}
.hs .swb[aria-pressed="true"]{outline:2px solid #000;outline-offset:1px}
.hs .rhead{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid var(--lo);box-shadow:0 1px var(--hi)}
.hs .scenes{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:8px}
.hs .scn{justify-content:flex-start;text-align:left;min-height:42px}
.hs .scn .ic{width:16px;text-align:center;flex:none;font-weight:700}
.hs .scn .tx{display:flex;flex-direction:column;min-width:0}
.hs .scn .tx b{font-weight:700;overflow-wrap:anywhere}
.hs .list{display:flex;flex-direction:column;background:var(--hi);border:2px solid;border-color:var(--lo) var(--hi) var(--hi) var(--lo);box-shadow:inset 1px 1px var(--dark)}
.hs .gh{background:var(--face);padding:2px 6px;font-weight:700;border-bottom:1px solid var(--lo)}
.hs .row{display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:2px 8px;align-items:center;width:100%;text-align:left;background:transparent;border:0;border-radius:0;color:#000;font:14px inherit;font-family:inherit;padding:6px 8px;cursor:pointer;min-height:34px}
.hs .row:hover{background:var(--navy);color:#fff}
.hs .row:hover .ent{color:var(--soft)}
.hs .row.cur{outline:1px dashed var(--navy);outline-offset:-2px}
.hs .row .nm{overflow-wrap:anywhere}
.hs .row .rv{font:13px ui-monospace,Menlo,Consolas,monospace;color:var(--dark)}
.hs .row:hover .rv{color:#fff}
.hs .empty{padding:10px;color:var(--lo);font-style:italic}
.hs .welcome{padding:14px;display:flex;flex-direction:column;gap:10px;max-width:60ch}
.hs .welcome ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px}
.hs h3{margin:6px 0 2px;font-size:14px;font-weight:700;color:#000}
.hs .ed-box{padding:8px;display:flex;flex-direction:column;gap:6px}
.hs .er{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center;padding:4px;border-bottom:1px dotted var(--lo)}
.hs .er.sel{outline:2px dashed var(--navy);outline-offset:-2px;background:#eef}
.hs .er label.chk{display:flex;gap:5px;align-items:center;grid-column:1 / -1;font-size:13px}
.hs .er .sub{grid-column:1 / -1}
.hs .er.dv{grid-template-columns:minmax(0,1fr) auto}
.hs .pick{max-height:260px;overflow-y:auto}
.hs .pr{display:flex;gap:8px;align-items:baseline;justify-content:flex-start;text-align:left;width:100%;background:transparent;border:0;border-radius:0;color:#000;font:14px inherit;font-family:inherit;padding:6px 8px;cursor:pointer;min-height:34px}
.hs .pr:hover{background:var(--navy);color:#fff}
.hs .pr i{font-style:normal;font-size:11px;background:var(--face);color:#000;border:1px solid var(--lo);padding:0 4px;flex:none}
.hs .st{display:flex;flex-wrap:wrap;gap:4px}
.hs .st>div{padding:2px 8px;border:1px solid;border-color:var(--lo) var(--hi) var(--hi) var(--lo);min-height:22px;flex:1 1 150px}
.hs .st .bad,.hs .bad{color:#a00000;font-weight:700}
.hs .hint{color:var(--dark);font-size:13px}
.hs-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.hs .stp{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:5px 4px;border-bottom:1px dotted var(--lo)}
.hs .stp select,.hs .stp input[type=text]{flex:1 1 140px;width:auto}
.hs .stp .sw{margin-left:auto;flex-wrap:nowrap}
html.hs-full header,html.hs-full nav[role=tablist]{display:none!important}
html.hs-full .wrap{padding:0!important;margin:0!important;max-width:none!important}
html.hs-full body{background:#008080}
html.hs-full .hs{min-height:100vh}
@media (max-width:900px){
 .hs-main{grid-template-columns:minmax(0,1fr)}.hs{padding:6px}
 .hs-bar{flex-direction:column;align-items:stretch}.hs-bar .sp{display:none}
 .hs-row{flex-wrap:nowrap}.hs-row .b{flex:1 1 0;min-height:44px}
 #hs-svg{max-height:62vh}
 .hs.ed .hs-plan{position:sticky;top:0;z-index:5;box-shadow:0 4px 0 var(--face)}
 .hs.ed #hs-svg{max-height:42vh}
 html.hs-full .hs-title{display:none}
 .hs .stp select,.hs .stp input[type=text]{flex-basis:100%}
}
@media (pointer:coarse){.hs button.b{min-height:40px}.hs button.b.sm{min-height:36px}.hs button.b.x{min-height:34px;min-width:36px}.hs .hs-tab{min-height:36px}.hs .row{min-height:44px}.hs .swb{width:38px;height:38px}.hs input[type=range]{min-height:36px}.hs input[type=text],.hs select{min-height:38px}}
`;

function skeleton() {
  return `<style>${CSS}</style>
<div class="hs" id="hs">
 <section class="hs-win raised" aria-labelledby="hs-t">
  <div class="hs-title"><span class="hs-ico"></span><b id="hs-t">Plattegrond.exe</b></div>
  <div class="hs-body">
   <div class="hs-bar" id="hs-bar"></div>
   <div id="hs-banner" class="hs-banner" hidden>Home Assistant is nu niet bereikbaar. Je ziet wat er staat, maar bedienen lukt even niet.</div>
   <div id="hs-wrap"></div>
   <div class="st" aria-live="polite"><div id="hs-st1"></div><div id="hs-st2"></div><div id="hs-save" style="flex:0 0 auto"></div></div>
  </div>
 </section>
</div>
<input type="file" id="hs-file" accept="image/*" hidden>`;
}

async function start() {
  root.innerHTML = skeleton();
  bind();
  try { const j = await api('GET', 'api/house'); H = j.house; connected = j.connected; }
  catch (e) { setHTML($('hs-wrap'), `<div class="hs-panel"><div class="empty">De plattegrond kon niet geladen worden: ${esc(e.message)}</div></div>`); return; }
  floorId = (H.floors[0] || {}).id || null;
  try { if (narrow() && localStorage.getItem('kamiel-hs-full') === '1') { full = true; document.documentElement.classList.add('hs-full'); } } catch (e) { /* fine */ }
  drawAll();
  await poll();
  timer = setInterval(() => { if (!root.hidden && document.visibilityState === 'visible') poll(); }, 4000);
  window.addEventListener('resize', () => { drawPlan(); });
  if (mq && mq.addEventListener) mq.addEventListener('change', () => drawAll());
}
tabBtn.addEventListener('click', () => { if (!started) { started = true; start(); } else poll(); });
try { if (localStorage.getItem('kamiel-tab') === 'tab-plan') tabBtn.click(); } catch (e) { /* fine */ }

/* ---------- reading the states ---------- */
async function poll() {
  if (!H.devices.length) { drawStatus(); return; }
  if (saveT) await flush();                 // a device that was just placed must be saved before its state can be asked
  try {
    const j = await api('GET', 'api/house/states');
    connected = j.connected;
    if (connected) ST = j.states || {};     // when Home Assistant does not answer, keep showing the last known values
  } catch (e) { connected = false; }
  const b = $('hs-banner'); if (b) b.hidden = connected;
  drawPlan(); drawStatus();
  if (!edit) { drawRoomPanel(); if (!busy) drawCtl(); }
}

/* ---------- commands ---------- */
function quick(d) {
  const k = kind(d);
  if (k === 'light' || k === 'switch') cmd(d, 'toggle');
  else if (k === 'knop') { drawPlan(); drawCtl(); drawRoomPanel(); pressKnop(d); }
  else { drawPlan(); drawCtl(); drawRoomPanel(); }
}
async function pressKnop(d, force) {
  if ((RUN[d.id] || 0) > Date.now()) { toast(d.name + ' is nog bezig.'); return; }
  const s = stOf(d), hasOff = (d.off || []).length > 0, hasOn = (d.on || []).length > 0;
  const which = force || (s && s.state === 'on' && hasOff ? 'off' : 'on');
  if ((which === 'on' && !hasOn) || (which === 'off' && !hasOff)) { toast(d.name + ' heeft hiervoor nog geen stappen. Zet Bewerken aan.', true); return; }
  if (s && !force && d.status) s.state = which === 'on' ? 'on' : 'off';
  RUN[d.id] = Date.now() + 1500; drawPlan(); drawCtl(); drawRoomPanel();
  let secs = 0;
  try {
    await flush();
    const j = await api('POST', 'api/house/knop', { id: d.id, which });
    if (!j.ok) throw new Error(j.busy ? 'is nog bezig.' : 'lukte niet.');
    secs = j.secs || 0; RUN[d.id] = Date.now() + secs * 1000 + 800;
  } catch (e) { RUN[d.id] = 0; toast(d.name + ': ' + e.message, true); }
  setTimeout(() => { poll(); drawPlan(); drawCtl(); drawRoomPanel(); }, (secs + 1) * 1000);
}
let sendT = {};
async function cmd(d, c, value, soon) {
  const s = ST[d.entity] || (ST[d.entity] = { state: 'unknown', ok: true });
  if (c === 'toggle') s.state = s.state === 'on' ? 'off' : 'on';
  else if (c === 'on' || c === 'off') s.state = c;
  else if (c === 'brightness') { s.bri = value; s.state = 'on'; }
  else if (c === 'color') { s.rgb = value; s.state = 'on'; }
  else if (c === 'temp') { s.k = value; s.state = 'on'; }
  else if (c === 'volume') s.vol = value;
  else if (c === 'playpause') s.state = s.state === 'playing' ? 'paused' : 'playing';
  drawPlan(); drawStatus(); if (!edit) { drawRoomPanel(); if (!busy) drawCtl(); }
  const send = async () => {
    try { const j = await api('POST', 'api/house/do', { id: d.id, cmd: c, value }); if (!j.ok) throw new Error('Home Assistant deed het niet.'); }
    catch (e) { toast(d.name + ': ' + e.message, true); }
    setTimeout(poll, 800);
  };
  if (soon) { clearTimeout(sendT[d.id + c]); sendT[d.id + c] = setTimeout(send, 180); } else send();
}
async function groupCmd(ids, on) {
  const list = ids.map(devById).filter(Boolean).filter(d => ['light', 'switch'].includes(kind(d)));
  list.forEach(d => { (ST[d.entity] || (ST[d.entity] = { ok: true })).state = on ? 'on' : 'off'; });
  drawPlan(); drawStatus(); drawRoomPanel(); drawCtl();
  try { const j = await api('POST', 'api/house/all', { on, ids: list.map(d => d.id) }); if (!j.ok) throw new Error('Home Assistant deed het niet.'); }
  catch (e) { toast(e.message, true); }
  setTimeout(poll, 900);
}
async function houseCmd(on) {
  H.devices.filter(d => d.heel).forEach(d => {
    const s = ST[d.entity] || (ST[d.entity] = { ok: true });
    if (kind(d) === 'speaker') { if (!on) s.state = 'paused'; } else s.state = on ? 'on' : 'off';
  });
  drawPlan(); drawStatus(); drawRoomPanel(); drawCtl();
  try {
    const j = await api('POST', 'api/house/all', { on });
    if (!j.ok) throw new Error('Home Assistant deed het niet.');
    toast(j.count ? `Heel huis ${on ? 'aan' : 'uit'} (${j.count} apparaten)` : 'Er doen nog geen apparaten mee. Vink ze aan bij Bewerken.');
  } catch (e) { toast(e.message, true); }
  setTimeout(poll, 900);
}
async function runScene(id) {
  const sc = H.scenes.find(s => s.id === id); if (!sc) return;
  try { const j = await api('POST', 'api/house/run', { id }); toast(j.ok ? `"${sc.name}" gestart` : `"${sc.name}" lukte niet`, !j.ok); }
  catch (e) { toast(e.message, true); }
  setTimeout(poll, 1200);
}

/* ---------- full screen: hides the Studio's own header and tabs, and asks the browser for real full screen where that exists ---------- */
function setFull(on) {
  full = on;
  document.documentElement.classList.toggle('hs-full', on);
  try { localStorage.setItem('kamiel-hs-full', on ? '1' : ''); } catch (e) { /* fine */ }
  const el = document.documentElement;
  if (on && !document.fullscreenElement && el.requestFullscreen) { fsAsked = true; el.requestFullscreen().catch(() => { fsAsked = false; }); }
  else if (!on && document.fullscreenElement && document.exitFullscreen) { fsAsked = false; document.exitFullscreen().catch(() => {}); }
  drawBar(); drawPlan();
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && fsAsked && full) { fsAsked = false; setFull(false); } });
tabBtn.addEventListener('click', () => { document.documentElement.classList.toggle('hs-full', full); });
document.querySelectorAll('[role=tab]').forEach(t => { if (t !== tabBtn) t.addEventListener('click', () => { document.documentElement.classList.remove('hs-full'); }); });

/* ---------- drawing ---------- */
function drawAll() { drawBar(); drawWrap(); drawStatus(); }

function drawBar() {
  const canFull = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) || narrow();
  const h = `<div class="hs-row"><button type="button" class="b" data-a="all-on"><span class="hs-led on"></span>Heel huis aan</button>
    <button type="button" class="b" data-a="all-off"><span class="hs-led"></span>Heel huis uit</button></div>
    <span class="sp"></span>
    <div class="hs-row">${canFull ? `<button type="button" class="b" data-a="full" aria-pressed="${full}">${full ? 'Normaal scherm' : 'Volledig scherm'}</button>` : ''}
    <button type="button" class="b" data-a="edit" aria-pressed="${edit}">Bewerken</button></div>`;
  setHTML($('hs-bar'), h);
  $('hs').classList.toggle('ed', edit);
}

function floorTabs() {
  let h = H.floors.map(f => {
    const n = H.devices.filter(d => d.floor === f.id && kind(d) === 'light' && isOn(d)).length;
    return `<button type="button" class="hs-tab" role="tab" data-a="floor" data-floor="${f.id}" aria-selected="${f.id === floorId}">${esc(f.name)}${n ? ` <span class="hs-led on"></span>${n}` : ''}</button>`;
  }).join('');
  if (edit && H.floors.length < 6) h += `<button type="button" class="hs-tab" data-a="floor-add">+ Verdieping</button>`;
  return `<div class="hs-tabs" role="tablist" aria-label="Verdiepingen">${h}</div>`;
}

function roomTabs() {
  const f = FL(); if (!f) return '';
  const t = [{ id: 'house', name: 'Heel huis' }].concat(f.rooms.map(r => ({ id: r.id, name: r.name })));
  return `<div class="hs-tabs" role="tablist" aria-label="Ruimtes">${t.map(x => `<button type="button" class="hs-tab" role="tab" data-a="tab" data-tab="${x.id}" aria-selected="${x.id === tab}">${esc(x.name)}</button>`).join('')}</div>`;
}

function drawWrap() {
  const wrap = $('hs-wrap');
  if (!H.floors.length) {
    setHTML(wrap, `<div class="hs-panel welcome"><b>Nog geen plattegrond</b>
      <ol><li>Voeg een verdieping toe en kies je eigen tekening.</li><li>Klik de hoeken van elke ruimte aan op de tekening.</li><li>Kies je lampen, speakers en sensoren uit Home Assistant en klik waar ze staan.</li></ol>
      <div><button type="button" class="b" data-a="start">Verdieping toevoegen</button></div></div>`);
    return;
  }
  if (!FL()) floorId = H.floors[0].id;
  if (tab !== 'house' && !(FL().rooms.some(r => r.id === tab))) tab = 'house';
  const html = `<div>${floorTabs()}<div class="hs-panel"><div class="hs-main">
      <div class="hs-plan sunken"><svg id="hs-svg" role="group" aria-label="Plattegrond van ${esc(FL().name)}"></svg></div>
      <aside class="hs-side" id="hs-side" aria-label="Bediening"></aside></div></div></div>
    <div>${roomTabs()}<div class="hs-panel" id="hs-rp"></div></div>`;
  // the frame is only rebuilt when something structural changed
  const key = html;
  if (wrap._k !== key) { wrap._k = key; wrap.innerHTML = html; $('hs-svg')._h = null; }
  drawPlan(); drawSide(); drawRoomPanel();
}

function viewBox(f) {
  if (narrow() && tab !== 'house' && !edit) {
    const r = f.rooms.find(x => x.id === tab);
    if (r) {
      const xs = r.poly.map(p => p[0] * f.w), ys = r.poly.map(p => p[1] * f.h);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const mx = Math.max(40, (x1 - x0) * .08), my = Math.max(40, (y1 - y0) * .08);
      let w = x1 - x0 + 2 * mx, h = y1 - y0 + 2 * my;
      const ar = f.w / f.h;                                   // keep the shape of the drawing, so nothing stretches
      if (w / h < ar) w = h * ar; else h = w / ar;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return [Math.max(0, Math.min(f.w - w, cx - w / 2)), Math.max(0, Math.min(f.h - h, cy - h / 2)), Math.min(w, f.w), Math.min(h, f.h)];
    }
  }
  return [0, 0, f.w, f.h];
}

function markerSVG(d, u, zoomed) {
  const f = FL(), s = stOf(d), k = kind(d), on = isOn(d);
  const cx = d.x * f.w, cy = d.y * f.h, z = narrow() ? 1.25 : 1;
  const right = d.x < (narrow() ? 0.55 : 0.72);
  const showName = !narrow() || zoomed || sel === d.id || edit;
  let g = `<g class="mk" data-id="${d.id}" tabindex="0" role="button" aria-label="${esc(d.name)}" aria-pressed="${on}" transform="translate(${cx} ${cy}) scale(${u * z})">`;
  g += `<rect x="-22" y="-22" width="44" height="44" fill="transparent"/>`;
  if (sel === d.id) g += `<rect class="selbox" x="-21" y="-21" width="42" height="42"/>`;
  let w = 15;
  if (k === 'knop') {
    const col = on ? '#0a7a0a' : '#000';
    g += `<rect x="-15" y="-15" width="30" height="30" fill="#c0c0c0" stroke="#000" stroke-width="1.5"/><path d="M-14 14V-14H14" fill="none" stroke="#fff" stroke-width="2"/><path d="M-13 14H14V-13" fill="none" stroke="#808080" stroke-width="2"/>`;
    const ic = d.icon || 'power';
    if (ic === 'power') g += `<path d="M-5.5-5.5A8 8 0 1 0 5.5-5.5M0-10V0" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>`;
    else if (ic === 'lamp') g += `<circle cx="0" cy="-3" r="6" fill="${on ? '#ffd54a' : '#fff'}" stroke="#000" stroke-width="1.5"/><rect x="-3.5" y="3" width="7" height="5" fill="#808080" stroke="#000"/>`;
    else if (ic === 'tv') g += `<rect x="-9" y="-7" width="18" height="12" fill="${on ? '#8fd0ff' : '#fff'}" stroke="#000" stroke-width="1.5"/><path d="M-4 9H4" stroke="#000" stroke-width="2"/>`;
    else g += `<path d="M0-9L2.6-3 9-2.5 4.2 1.7 5.6 8 0 4.7-5.6 8-4.2 1.7-9-2.5-2.6-3Z" fill="${on ? '#ffd54a' : '#fff'}" stroke="#000" stroke-width="1.2"/>`;
    if (d.status) g += `<circle cx="12" cy="-12" r="3.5" fill="${on ? '#19e619' : '#4a4a4a'}" stroke="#000"/>`;
    if ((RUN[d.id] || 0) > Date.now()) g += `<rect x="-15" y="-15" width="30" height="30" fill="rgba(255,255,255,.55)"/>`;
  } else if (k === 'sensor' || k === 'binary') {
    const t = sensorText(d), tw = Math.max(34, t.length * 8.4 + 12);
    w = tw / 2;
    const warn = s && !s.ok;
    g += `<rect x="${-w}" y="-12" width="${tw}" height="24" fill="${k === 'binary' && on ? '#ffe9a8' : '#fff'}" stroke="#000" stroke-width="1.5"/>`;
    g += `<path d="M${-w + 1} 11V-11H${w - 1}" fill="none" stroke="#808080" stroke-width="2"/>`;
    g += `<text x="0" y="5" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="13" font-weight="700" fill="${warn ? '#a00000' : '#000'}">${esc(t)}</text>`;
  } else {
    g += `<rect x="-15" y="-15" width="30" height="30" fill="#c0c0c0" stroke="#000" stroke-width="1.5"/><path d="M-14 14V-14H14" fill="none" stroke="#fff" stroke-width="2"/><path d="M-13 14H14V-13" fill="none" stroke="#808080" stroke-width="2"/>`;
    if (k === 'light') {
      const col = on ? (s && s.rgb ? `rgb(${s.rgb.join(',')})` : '#ffd54a') : '#4a4a4a';
      g += `<rect x="-7" y="-7" width="14" height="14" fill="${col}" stroke="#000"/>`;
    } else if (k === 'switch') g += `<circle r="7" fill="${on ? '#19e619' : '#4a4a4a'}" stroke="#000"/>`;
    else if (k === 'speaker') {
      g += `<path d="M-10 -4H-5L1 -9V9L-5 4H-10Z" fill="#000"/>`;
      if (on) g += `<path d="M5 -5Q9 0 5 5M8 -9Q14 0 8 9" fill="none" stroke="#19a319" stroke-width="2"/>`;
    }
  }
  if (showName) g += `<text class="mlabel" x="${right ? w + 7 : -w - 7}" y="${(k === 'sensor' || k === 'binary') ? 5 : 5}" text-anchor="${right ? 'start' : 'end'}" font-size="13">${esc(d.name)}</text>`;
  return g + '</g>';
}

function drawPlan() {
  const svg = $('hs-svg'), f = FL(); if (!svg || !f) return;
  const vb = viewBox(f);
  svg.setAttribute('viewBox', vb.join(' '));
  const wpx = svg.getBoundingClientRect().width;
  const u = wpx > 0 ? vb[2] / wpx : f.w / 800;          // units per screen pixel: markers keep their size on every screen
  const zoomed = vb[2] < f.w - 1;
  const here = devsHere();
  const lit = new Set();
  here.forEach(d => { if (kind(d) === 'light' && isOn(d)) { const r = roomOf(d); if (r) lit.add(r.id); } });
  const pts = (r) => r.poly.map(p => (p[0] * f.w).toFixed(1) + ',' + (p[1] * f.h).toFixed(1)).join(' ');
  let h = '<defs>';
  here.forEach(d => { if (kind(d) === 'light' && isOn(d)) { const s = stOf(d), c = s && s.rgb ? `rgb(${s.rgb.join(',')})` : '#ffd54a', o = s && s.bri ? .35 + .5 * s.bri / 100 : .8;
    h += `<radialGradient id="g-${d.id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`; } });
  h += '</defs>';
  h += f.image ? `<image href="api/house/img/${esc(f.image)}" x="0" y="0" width="${f.w}" height="${f.h}" preserveAspectRatio="none"/>` : `<rect x="0" y="0" width="${f.w}" height="${f.h}" fill="#fff"/>`;
  f.rooms.forEach(r => {
    const cls = ['room', lit.has(r.id) ? 'lit' : '', !f.image ? 'out' : '', edit ? (selRoom === r.id ? 'sel' : 'ed') : (tab === r.id ? 'cur' : '')].filter(Boolean).join(' ');
    h += `<polygon class="${cls}" data-room="${r.id}" points="${pts(r)}"/>`;
  });
  here.forEach(d => { if (kind(d) === 'light' && isOn(d)) h += `<circle cx="${d.x * f.w}" cy="${d.y * f.h}" r="${95 * u}" fill="url(#g-${d.id})" pointer-events="none"/>`; });
  if (!f.image || edit) f.rooms.forEach(r => {
    const cx = r.poly.reduce((a, p) => a + p[0], 0) / r.poly.length * f.w, cy = r.poly.reduce((a, p) => a + p[1], 0) / r.poly.length * f.h;
    h += `<text class="rname" x="${cx}" y="${cy}" text-anchor="middle" font-size="${12 * u}">${esc(r.name)}</text>`;
  });
  here.forEach(d => { h += markerSVG(d, u, zoomed); });
  if (edit && selRoom && !tool) {
    const r = f.rooms.find(x => x.id === selRoom);
    if (r) r.poly.forEach((p, i) => { h += `<circle class="vh" data-room="${r.id}" data-i="${i}" cx="${p[0] * f.w}" cy="${p[1] * f.h}" r="${9 * u}"/>`; });
  }
  if (tool && tool.kind === 'room' && tool.pts.length) {
    const pp = tool.pts.map(p => (p[0] * f.w) + ',' + (p[1] * f.h)).join(' ');
    h += `<polyline points="${pp}" fill="none" stroke="#000080" stroke-width="2.5" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
    tool.pts.forEach((p, i) => { h += `<circle cx="${p[0] * f.w}" cy="${p[1] * f.h}" r="${(i === 0 ? 9 : 5) * u}" fill="${i === 0 ? '#ffd54a' : '#000080'}" stroke="#000" pointer-events="none"/>`; });
  }
  setHTML(svg, h);
  svg.classList.toggle('tool', !!tool);
}

function drawStatus() {
  const lights = H.devices.filter(d => kind(d) === 'light'), n = lights.filter(isOn).length;
  setHTML($('hs-st1'), H.devices.length ? `${n} van ${lights.length} lampen aan` : 'Nog geen apparaten op de plattegrond');
}

/* ---------- the control of one device ---------- */
function drawSide() { if (edit) { drawEditor(); } else drawCtl(); }
function drawCtl() {
  const side = $('hs-side'); if (!side || edit) return;
  const d = sel && devById(sel);
  if (!d || d.floor !== floorId) { setHTML(side, `<div class="hs-ct raised"><div class="hint">Tik op een apparaat op de plattegrond om het te bedienen.</div></div>`); return; }
  const s = stOf(d) || { ok: true, state: 'unknown' }, k = kind(d), on = isOn(d);
  let h = `<div class="hs-ct raised"><div class="h"><b>${esc(d.name)}</b><button type="button" class="b x" data-a="close" aria-label="Sluiten">✕</button></div><div class="ent">${esc(d.knop ? 'Eigen knop' : d.entity)}</div>`;
  if (!s.ok && k !== 'knop') h += `<div class="bad">Niet bereikbaar</div>`;
  if (k === 'light' || k === 'switch') {
    h += `<button type="button" class="b big" data-a="toggle" aria-pressed="${on}"><span class="hs-led ${on ? 'on' : ''}"></span>${on ? 'Aan' : 'Uit'}</button>`;
    if (k === 'light' && s.dim) h += `<div class="sl"><label for="hs-bri">Helderheid</label><output id="hs-briv">${s.bri || (on ? 100 : 0)}%</output></div><input type="range" id="hs-bri" min="1" max="100" value="${s.bri || 100}">`;
    if (k === 'light' && s.color) {
      const cur = s.rgb ? '#' + s.rgb.map(x => x.toString(16).padStart(2, '0')).join('') : '#ffd9a0';
      h += `<div class="sl"><span id="hs-collab">Kleur</span></div><div class="sw" role="group" aria-labelledby="hs-collab">`
        + ['#ffd9a0', '#fff4e0', '#dfefff', '#ff4d4d', '#ff9a3c', '#ffe45c', '#4dd964', '#3ca0ff', '#b06bff', '#ff6bd6'].map(c => `<button type="button" class="swb" data-a="swatch" data-c="${c}" style="background:${c}" aria-label="Kleur ${c}" aria-pressed="${cur.toLowerCase() === c}"></button>`).join('')
        + `<input type="color" id="hs-col" value="${cur}" aria-label="Eigen kleur"></div>`;
    }
    if (k === 'light' && s.ct) h += `<div class="sl"><label for="hs-k">Wit: warm tot koel</label><output id="hs-kv">${s.k || ''} K</output></div><input type="range" id="hs-k" min="${s.kmin}" max="${s.kmax}" step="50" value="${s.k || Math.round((s.kmin + s.kmax) / 2)}">`;
  } else if (k === 'knop') {
    const hasOff = (d.off || []).length > 0, busyK = (RUN[d.id] || 0) > Date.now();
    if (!(d.on || []).length && !hasOff) h += `<div class="hint">Deze knop heeft nog geen stappen. Zet Bewerken aan en kies de knop.</div>`;
    else if (hasOff && d.status) h += `<button type="button" class="b big" data-a="knop" aria-pressed="${on}" ${busyK ? 'disabled' : ''}><span class="hs-led ${on ? 'on' : ''}"></span>${busyK ? 'Bezig…' : on ? 'Aan (tik voor uit)' : 'Uit (tik voor aan)'}</button>`;
    else {
      h += `<button type="button" class="b big" data-a="knop-on" ${busyK ? 'disabled' : ''}>${busyK ? 'Bezig…' : hasOff ? 'Aan' : 'Start'}</button>`;
      if (hasOff) h += `<button type="button" class="b big" data-a="knop-off" ${busyK ? 'disabled' : ''}>Uit</button>`;
    }
  } else if (k === 'speaker') {
    const f = s.feat || 0, tt = s.title ? s.title + (s.artist ? ' – ' + s.artist : '') : (on ? 'Speelt' : s.state === 'paused' ? 'Gepauzeerd' : s.state === 'off' || s.state === 'standby' ? 'Uit' : 'Niets aan het spelen');
    h += `<div class="np">${esc(tt)}</div><div class="trip">`
      + `<button type="button" class="b" data-a="prev" ${f & 16 ? '' : 'disabled'} aria-label="Vorige">|◀</button>`
      + `<button type="button" class="b" data-a="playpause" ${(f & 1 || f & 16384 || on) ? '' : 'disabled'}>${on ? 'Pauze' : 'Afspelen'}</button>`
      + `<button type="button" class="b" data-a="next" ${f & 32 ? '' : 'disabled'} aria-label="Volgende">▶|</button></div>`;
    if (s.vol != null) h += `<div class="sl"><label for="hs-vol">Volume</label><output id="hs-volv">${s.vol}%</output></div><div class="vol"><button type="button" class="b sm" data-a="vminus" aria-label="Zachter">–</button><input type="range" id="hs-vol" min="0" max="100" value="${s.vol}"><button type="button" class="b sm" data-a="vplus" aria-label="Luider">+</button></div>`;
  } else {
    h += `<div class="val">${esc(sensorText(d))}</div>`;
    if (s.dc) h += `<div class="hint">${esc(s.dc.replace(/_/g, ' '))}</div>`;
  }
  setHTML(side, h + '</div>');
}

/* ---------- the room under the plan: scenes, and its devices ---------- */
function actIcon(e) { const d = e.split('.')[0]; return d === 'scene' ? '✦' : d === 'script' ? '▶' : d === 'automation' ? '⚙' : '•'; }
function drawRoomPanel() {
  const el = $('hs-rp'); if (!el) return;
  const f = FL(); if (!f) return;
  if (edit) { drawRoomEditor(); return; }
  const rm = f.rooms.find(r => r.id === tab);
  const here = devsHere().filter(d => tab === 'house' || (roomOf(d) && roomOf(d).id === tab));
  let h = '';
  if (rm) {
    const sw = here.filter(d => ['light', 'switch'].includes(kind(d))), n = sw.filter(isOn).length;
    h += `<div class="rhead"><b>${esc(rm.name)}</b><span>${sw.length ? n + ' van ' + sw.length + ' aan' : ''}</span>${sw.length ? `<span class="sw"><button type="button" class="b sm" data-a="room-on">Alles aan</button><button type="button" class="b sm" data-a="room-off">Alles uit</button></span>` : ''}</div>`;
  } else h += `<div class="rhead"><b>Voor het hele huis</b></div>`;
  const scs = H.scenes.filter(s => s.room === (rm ? rm.id : 'house'));
  if (scs.length) h += `<div class="scenes">${scs.map(s => `<button type="button" class="b scn" data-a="run" data-sid="${s.id}"><span class="ic" aria-hidden="true">${actIcon(s.entity)}</span><span class="tx"><b>${esc(s.name)}</b><span class="ent">${esc(s.entity)}</span></span></button>`).join('')}</div>`;
  const row = (d) => {
    const k = kind(d), s = stOf(d);
    const rv = k === 'sensor' || k === 'binary' ? sensorText(d) : k === 'speaker' ? (s && s.title ? s.title.slice(0, 22) : '') : '';
    return `<button type="button" class="row${sel === d.id ? ' cur' : ''}" data-a="row" data-id="${d.id}" aria-pressed="${isOn(d)}"><span class="hs-led ${k === 'switch' ? 'round ' : ''}${isOn(d) ? 'on' : ''}"></span><span class="nm">${esc(d.name)}</span><span class="rv">${esc(rv)}</span></button>`;
  };
  if (tab === 'house') {
    const groups = [...f.rooms.map(r => ({ n: r.name, l: here.filter(d => { const x = roomOf(d); return x && x.id === r.id; }) })), { n: 'Elders', l: here.filter(d => !roomOf(d)) }].filter(g => g.l.length);
    h += groups.length ? `<div class="list">${groups.map(g => `<div class="gh">${esc(g.n)}</div>${g.l.map(row).join('')}`).join('')}</div>` : (scs.length ? '' : `<div class="empty">Nog geen apparaten op deze verdieping. Zet Bewerken aan om ze toe te voegen.</div>`);
  } else h += here.length ? `<div class="list">${here.map(row).join('')}</div>` : (scs.length ? '' : `<div class="empty">Nog geen apparaten in deze ruimte.</div>`);
  setHTML(el, h);
}

/* ---------- editing ---------- */
const DOMAIN_NL = { light: 'Lamp', switch: 'Schakelaar', input_boolean: 'Schakelaar', media_player: 'Speaker', sensor: 'Sensor', binary_sensor: 'Sensor' };
async function ensureEnts() {
  if (!ENTS) { try { const j = await api('GET', 'api/entities?domain=light,switch,input_boolean,media_player,sensor,binary_sensor,remote,fan'); ENTS = j.entities || []; } catch (e) { ENTS = []; } }
  if (!ACTS) { try { const j = await api('GET', 'api/entities?domain=scene,script,automation,button,input_button'); ACTS = j.entities || []; } catch (e) { ACTS = []; } }
}
function redrawEditor() { if (edit) { drawEditor(); drawRoomEditor(); } }
function drawEditor() {
  const side = $('hs-side'); if (!side || !edit) return;
  const f = FL(); if (!f) return;
  const mine = devsHere();
  let h = `<div class="ed-box raised"><h3>Verdieping</h3>
    <input type="text" id="hs-fn" data-f="fname" value="${esc(f.name)}" aria-label="Naam van de verdieping" maxlength="30" autocomplete="off">
    <div class="sw"><button type="button" class="b sm" data-a="img">${f.image ? 'Andere tekening kiezen' : 'Tekening kiezen'}</button>
      ${f.image ? `<button type="button" class="b sm" data-a="img-del">Tekening weg</button>` : ''}
      <button type="button" class="b sm" data-a="floor-del">${armed === 'floor' ? 'Zeker? Nog een keer' : 'Verdieping verwijderen'}</button></div>
    ${f.image ? '' : `<div class="hint">Zonder tekening zie je alleen de ruimtes die je zelf tekent.</div>`}
    <h3>Ruimtes</h3>`;
  h += f.rooms.map(r => `<div class="er${selRoom === r.id ? ' sel' : ''}" data-room="${r.id}"><input type="text" data-f="rname" data-room="${r.id}" value="${esc(r.name)}" aria-label="Naam van de ruimte" maxlength="30" autocomplete="off"><button type="button" class="b sm" data-a="room-pick" data-room="${r.id}" aria-pressed="${selRoom === r.id}">Hoeken</button><button type="button" class="b x" data-a="room-del" data-room="${r.id}" aria-label="Ruimte verwijderen">${armed === 'r' + r.id ? '?' : '✕'}</button></div>`).join('');
  if (tool && tool.kind === 'room') h += `<div class="hint"><b>Klik de hoeken</b> van de ruimte op de tekening (${tool.pts.length} gezet). Klik op de gele eerste hoek of op Klaar om te sluiten.</div><div class="sw"><button type="button" class="b sm" data-a="room-done" ${tool.pts.length < 3 ? 'disabled' : ''}>Klaar</button><button type="button" class="b sm" data-a="tool-cancel">Annuleren</button></div>`;
  else h += `<div><button type="button" class="b sm" data-a="room-new">+ Ruimte tekenen</button></div>${selRoom ? `<div class="hint">Sleep de witte punten om de hoeken te verplaatsen.</div>` : ''}`;
  h += `<h3>Apparaten</h3>`;
  if (knopEd && devById(knopEd) && devById(knopEd).floor === floorId) { setHTML(side, knopEditorHTML(devById(knopEd))); return; }
  knopEd = null;
  h += mine.map(d => d.knop ? `<div class="er dv${sel === d.id ? ' sel' : ''}" data-id="${d.id}"><input type="text" data-f="dname" data-id="${d.id}" value="${esc(d.name)}" aria-label="Naam van de knop" maxlength="40" autocomplete="off"><button type="button" class="b x" data-a="dev-del" data-id="${d.id}" aria-label="Knop verwijderen">${armed === 'd' + d.id ? '?' : '✕'}</button>
    <div class="sub"><button type="button" class="b sm" data-a="knop-edit" data-id="${d.id}">Stappen bewerken</button> <span class="ent">Eigen knop</span></div></div>` : `<div class="er dv${sel === d.id ? ' sel' : ''}" data-id="${d.id}"><input type="text" data-f="dname" data-id="${d.id}" value="${esc(d.name)}" aria-label="Naam van het apparaat" maxlength="40" autocomplete="off"><button type="button" class="b x" data-a="dev-del" data-id="${d.id}" aria-label="Apparaat verwijderen">${armed === 'd' + d.id ? '?' : '✕'}</button>
    <div class="ent sub">${esc(d.entity)}</div>${/^(light|switch|input_boolean|media_player)\./.test(d.entity) ? `<label class="chk"><input type="checkbox" data-f="heel" data-id="${d.id}"${d.heel ? ' checked' : ''}> Doet mee met Heel huis${d.entity.startsWith('media_player.') ? ' (pauzeert bij uit)' : ''}</label>` : ''}</div>`).join('');
  if (tool && tool.kind === 'place') h += `<div class="hint"><b>${esc(tool.knop ? 'Nieuwe knop' : tool.name)}</b>: klik op de plattegrond waar het staat.</div><div><button type="button" class="b sm" data-a="tool-cancel">Annuleren</button></div>`;
  else if (picking) h += pickerHTML();
  else h += `<div class="sw"><button type="button" class="b sm" data-a="dev-add">+ Apparaat toevoegen</button><button type="button" class="b sm" data-a="knop-new">+ Eigen knop</button></div>`;
  setHTML(side, h + '</div>');
}
const STEP_NL = { aan: 'Zet aan', uit: 'Zet uit', wissel: 'Wissel aan/uit', start: 'Start scène/script', ir: 'IR-commando', wacht: 'Wacht' };
const POWER = ['light', 'switch', 'input_boolean', 'media_player', 'remote', 'fan'];
function entOptions(list, cur) {
  const has = list.some(e => e.id === cur);
  return `<option value="">Kies…</option>` + (cur && !has ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '') + list.map(e => `<option value="${esc(e.id)}"${e.id === cur ? ' selected' : ''}>${esc(e.name)} (${esc(e.id)})</option>`).join('');
}
function stepHTML(w, st, i, n) {
  let h = `<div class="stp" data-w="${w}" data-i="${i}"><select data-f="stype" data-w="${w}" data-i="${i}" aria-label="Soort stap">${Object.keys(STEP_NL).map(t => `<option value="${t}"${t === st.t ? ' selected' : ''}>${STEP_NL[t]}</option>`).join('')}</select>`;
  if (st.t === 'wacht') h += `<input type="text" inputmode="decimal" data-f="ssec" data-w="${w}" data-i="${i}" value="${esc(st.s == null ? 1 : st.s)}" aria-label="Seconden" style="max-width:90px"> <span>seconden</span>`;
  else {
    const list = st.t === 'start' ? (ACTS || []) : st.t === 'ir' ? (ENTS || []).filter(e => e.id.startsWith('remote.')) : (ENTS || []).filter(e => POWER.includes(e.id.split('.')[0]));
    h += `<select data-f="sent" data-w="${w}" data-i="${i}" aria-label="Apparaat">${entOptions(list, st.e || '')}</select>`;
    if (st.t === 'ir') h += `<input type="text" data-f="scmd" data-w="${w}" data-i="${i}" value="${esc(st.c || '')}" placeholder="Commando (meer: scheid met komma)" aria-label="IR-commando" maxlength="80"><input type="text" data-f="sdev" data-w="${w}" data-i="${i}" value="${esc(st.d || '')}" placeholder="Apparaatnaam (mag leeg)" aria-label="Apparaat voor IR" maxlength="40">`;
  }
  return h + `<span class="sw"><button type="button" class="b x" data-a="knop-up" data-w="${w}" data-i="${i}" aria-label="Omhoog" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" class="b x" data-a="knop-down" data-w="${w}" data-i="${i}" aria-label="Omlaag" ${i === n - 1 ? 'disabled' : ''}>▼</button><button type="button" class="b x" data-a="knop-sdel" data-w="${w}" data-i="${i}" aria-label="Stap verwijderen">✕</button></span></div>`;
}
function knopEditorHTML(d) {
  const statusList = (ENTS || []).filter(e => DOMAIN_NL[e.id.split('.')[0]]);
  const block = (w, title, help) => `<h3>${title}</h3><div class="hint">${help}</div>` + (d[w] || []).map((st, i, a) => stepHTML(w, st, i, a.length)).join('')
    + `<div class="sw"><button type="button" class="b sm" data-a="knop-sadd" data-w="${w}">+ Stap</button>${(d[w] || []).length ? `<button type="button" class="b sm" data-a="knop-test" data-w="${w}">Proberen</button>` : ''}</div>`;
  return `<div class="ed-box raised"><div class="h" style="display:flex;justify-content:space-between;align-items:center"><b>Eigen knop</b><button type="button" class="b sm" data-a="knop-done">Klaar</button></div>
    <input type="text" data-f="dname" data-id="${d.id}" value="${esc(d.name)}" aria-label="Naam van de knop" maxlength="40" autocomplete="off">
    <label class="hint" for="hs-ki">Icoon</label><select id="hs-ki" data-f="kicon" aria-label="Icoon">${[['power', 'Aan/uit-knop'], ['lamp', 'Lamp'], ['tv', 'Scherm'], ['ster', 'Ster']].map(x => `<option value="${x[0]}"${(d.icon || 'power') === x[0] ? ' selected' : ''}>${x[1]}</option>`).join('')}</select>
    <label class="hint" for="hs-ks">Welk apparaat zegt of het aan is? (mag leeg)</label><select id="hs-ks" data-f="kstatus" aria-label="Status-apparaat">${entOptions(statusList, d.status || '')}</select>
    ${block('on', 'Aan-reeks', 'Wat er gebeurt als je de knop aanzet (of op Start tikt). De stappen gaan één voor één.')}
    ${block('off', 'Uit-reeks (mag leeg)', 'Wat er gebeurt als je de knop uitzet. Zonder uit-reeks is het een gewone startknop.')}</div>`;
}
function pickerHTML() {
  const used = new Set(H.devices.map(d => d.entity)), q = entQ.trim().toLowerCase();
  const list = (ENTS || []).filter(e => DOMAIN_NL[e.id.split('.')[0]] && !used.has(e.id) && (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))).slice(0, 80);
  return `<div class="sunken" style="padding:6px;display:flex;flex-direction:column;gap:6px"><input type="search" id="hs-q" data-f="q" placeholder="Zoek een lamp, speaker of sensor" value="${esc(entQ)}" aria-label="Zoeken" autocomplete="off">
    <div class="pick">${ENTS ? (list.length ? list.map(e => `<button type="button" class="pr" data-a="dev-pick" data-ent="${esc(e.id)}"><i>${DOMAIN_NL[e.id.split('.')[0]] || ''}</i><span>${esc(e.name)}</span></button>`).join('') : `<div class="empty">${connected ? 'Niets gevonden.' : 'Home Assistant is niet bereikbaar.'}</div>`) : `<div class="empty">Laden…</div>`}</div>
    <div><button type="button" class="b sm" data-a="tool-cancel">Sluiten</button></div></div>`;
}
function drawRoomEditor() {
  const el = $('hs-rp'); if (!el || !edit) return;
  const f = FL(); if (!f) return;
  const rm = f.rooms.find(r => r.id === tab), key = rm ? rm.id : 'house';
  const scs = H.scenes.filter(s => s.room === key);
  const used = new Set(scs.map(s => s.entity));
  let h = `<div class="rhead"><b>Scenes en scripts voor ${rm ? esc(rm.name) : 'het hele huis'}</b></div><div class="hint">Je maakt ze zelf in Home Assistant. Hier kies je welke bij deze ruimte horen.</div>`;
  h += scs.map(s => `<div class="er" data-sid="${s.id}"><input type="text" data-f="sname" data-sid="${s.id}" value="${esc(s.name)}" aria-label="Naam" maxlength="40" autocomplete="off"><span class="ent">${esc(s.entity)}</span><button type="button" class="b x" data-a="scene-del" data-sid="${s.id}" aria-label="Verwijderen">${armed === 's' + s.id ? '?' : '✕'}</button></div>`).join('');
  h += `<div class="sw" style="margin-top:6px"><select id="hs-sc" aria-label="Scène of script kiezen" style="max-width:360px"><option value="">Kies een scène of script…</option>${(ACTS || []).filter(e => !used.has(e.id)).map(e => `<option value="${esc(e.id)}">${esc(e.name)} (${esc(e.id)})</option>`).join('')}</select><button type="button" class="b sm" data-a="scene-add">Toevoegen</button></div>`;
  setHTML(el, h);
}

function addFloor() {
  const f = { id: newId(), name: 'Verdieping ' + (H.floors.length + 1), image: '', w: 1600, h: 900, rooms: [] };
  H.floors.push(f); floorId = f.id; tab = 'house'; sel = selRoom = null; tool = null;
  edit = true; queueSave(); drawAll(); setTimeout(() => { const i = $('hs-fn'); if (i) { i.focus(); i.select(); } }, 30);
}
async function shrinkToPng(file, max) {
  let bmp;
  try { bmp = await createImageBitmap(file); }
  catch (e) { bmp = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = URL.createObjectURL(file); }); }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight, k = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('Omzetten mislukt')), 'image/png'));
}
async function uploadImage(file) {
  const f = FL(); if (!f || !file) return;
  setSave('Tekening verwerken…');
  try {
    const blob = await shrinkToPng(file, 1800);
    await flush();
    const j = await api('POST', 'api/house/floors/' + f.id + '/image', blob, true);
    f.image = j.image; f.w = j.w; f.h = j.h;
    setSave('Bewaard'); wrapDirty(); drawAll();
  } catch (e) { setSave('Tekening niet gelukt: ' + e.message, true); }
}
function wrapDirty() { const w = $('hs-wrap'); if (w) w._k = null; }

function addRoomPoint(e) {
  const p = toFrac(e), f = FL(); if (!p || !f) return;
  const t = tool;
  if (t.pts.length >= 3) {                       // click on the first corner = close
    const m = $('hs-svg').getScreenCTM(), pt = $('hs-svg').createSVGPoint();
    pt.x = t.pts[0][0] * f.w; pt.y = t.pts[0][1] * f.h;
    const q = pt.matrixTransform(m);
    if (Math.hypot(q.x - e.clientX, q.y - e.clientY) < 18) { finishRoom(); return; }
  }
  t.pts.push([p.x, p.y]); drawPlan(); drawEditor();
}
function finishRoom() {
  const f = FL(); if (!f || !tool || tool.pts.length < 3) return;
  const r = { id: newId(), name: 'Ruimte ' + (f.rooms.length + 1), poly: tool.pts };
  f.rooms.push(r); tool = null; selRoom = r.id; queueSave(); wrapDirty(); drawAll();
  setTimeout(() => { const i = document.querySelector(`input[data-f="rname"][data-room="${r.id}"]`); if (i) { i.focus(); i.select(); } }, 30);
}
function placeDevice(e) {
  const p = toFrac(e), f = FL(); if (!p || !f || !tool) return;
  const d = tool.knop ? { id: newId(), floor: f.id, knop: true, entity: '', name: 'Nieuwe knop', x: p.x, y: p.y, heel: false, icon: 'power', status: '', on: [], off: [] }
    : { id: newId(), floor: f.id, entity: tool.entity, name: tool.name, x: p.x, y: p.y, heel: /^(light|switch|input_boolean)\./.test(tool.entity) };
  H.devices.push(d); tool = null; picking = false; sel = d.id; if (d.knop) knopEd = d.id; queueSave(); drawAll(); poll();
}
function toFrac(e) {
  const svg = $('hs-svg'), f = FL(); if (!svg || !f) return null;
  const m = svg.getScreenCTM(); if (!m) return null;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const q = pt.matrixTransform(m.inverse());
  return { x: clamp01(q.x / f.w), y: clamp01(q.y / f.h) };
}

/* ---------- events ---------- */
function select(id) { sel = id; const d = devById(id); if (d) { const r = roomOf(d); if (r && !edit && narrow()) { /* stay on the same view */ } } }
function setTab(id) { tab = id; wrapDirty(); drawWrap(); }

function bind() {
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-a]');
    if (!t) {
      const mk = e.target.closest('#hs-svg .mk');
      if (!edit && mk) { const d = devById(mk.dataset.id); if (d) { select(d.id); quick(d); } return; }
      const rm = e.target.closest('#hs-svg .room');
      if (!edit && rm) setTab(rm.dataset.room);
      return;
    }
    const a = t.dataset.a, id = t.dataset.id, d = id ? devById(id) : (sel ? devById(sel) : null);
    switch (a) {
      case 'all-on': houseCmd(true); break;
      case 'all-off': houseCmd(false); break;
      case 'edit': edit = !edit; knopEd = null; tool = null; picking = false; selRoom = null; armed = ''; wrapDirty(); drawAll(); if (edit) ensureEnts().then(() => { redrawEditor(); }); break;
      case 'start': addFloor(); ensureEnts(); break;
      case 'floor': floorId = t.dataset.floor; tab = 'house'; tool = null; selRoom = null; sel = (d && d.floor === floorId) ? sel : null; wrapDirty(); drawAll(); break;
      case 'floor-add': addFloor(); break;
      case 'tab': setTab(t.dataset.tab); break;
      case 'close': sel = null; drawPlan(); drawCtl(); drawRoomPanel(); break;
      case 'toggle': if (d) cmd(d, 'toggle'); break;
      case 'knop': if (d) pressKnop(d); break;
      case 'knop-on': if (d) pressKnop(d, 'on'); break;
      case 'knop-off': if (d) pressKnop(d, 'off'); break;
      case 'full': setFull(!full); break;
      case 'swatch': if (d) { const c = t.dataset.c; cmd(d, 'color', [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]); } break;
      case 'prev': case 'next': case 'playpause': if (d) cmd(d, a); break;
      case 'vminus': case 'vplus': { const s = d && stOf(d); if (d && s) { const v = Math.max(0, Math.min(100, (s.vol || 0) + (a === 'vplus' ? 5 : -5))); cmd(d, 'volume', v); } break; }
      case 'row': if (d) { select(d.id); quick(d); } break;
      case 'room-on': case 'room-off': { const here = devsHere().filter(x => { const r = roomOf(x); return r && r.id === tab; }); groupCmd(here.map(x => x.id), a === 'room-on'); break; }
      case 'run': runScene(t.dataset.sid); break;
      /* editing */
      case 'img': $('hs-file').click(); break;
      case 'img-del': { const f = FL(); if (f) { await flush(); try { await api('DELETE', 'api/house/floors/' + f.id + '/image'); f.image = ''; f.w = 1600; f.h = 900; wrapDirty(); drawAll(); } catch (er) { setSave(er.message, true); } } break; }
      case 'floor-del': if (warn('floor')) { const f = FL(); H.devices = H.devices.filter(x => x.floor !== f.id); H.scenes = H.scenes.filter(s => !f.rooms.some(r => r.id === s.room)); H.floors = H.floors.filter(x => x.id !== f.id); floorId = (H.floors[0] || {}).id || null; tab = 'house'; sel = selRoom = null; queueSave(); wrapDirty(); drawAll(); } break;
      case 'room-new': tool = { kind: 'room', pts: [] }; picking = false; selRoom = null; drawPlan(); drawEditor(); break;
      case 'room-done': finishRoom(); break;
      case 'tool-cancel': tool = null; picking = false; drawPlan(); drawEditor(); break;
      case 'room-pick': selRoom = selRoom === t.dataset.room ? null : t.dataset.room; drawPlan(); drawEditor(); break;
      case 'room-del': if (warn('r' + t.dataset.room)) { const f = FL(); f.rooms = f.rooms.filter(r => r.id !== t.dataset.room); H.scenes = H.scenes.filter(s => s.room !== t.dataset.room); if (tab === t.dataset.room) tab = 'house'; if (selRoom === t.dataset.room) selRoom = null; queueSave(); wrapDirty(); drawAll(); } break;
      case 'knop-new': tool = { kind: 'place', knop: true }; picking = false; drawPlan(); drawEditor(); break;
      case 'knop-edit': knopEd = id; sel = id; await ensureEnts(); drawPlan(); drawEditor(); break;
      case 'knop-done': knopEd = null; drawEditor(); break;
      case 'knop-sadd': { const k = devById(knopEd); if (k) { (k[t.dataset.w] = k[t.dataset.w] || []).push({ t: 'aan', e: '' }); queueSave(); drawEditor(); } break; }
      case 'knop-sdel': { const k = devById(knopEd); if (k) { k[t.dataset.w].splice(+t.dataset.i, 1); queueSave(); drawEditor(); } break; }
      case 'knop-up': case 'knop-down': { const k = devById(knopEd); if (k) { const arr = k[t.dataset.w], i = +t.dataset.i, j = a === 'knop-up' ? i - 1 : i + 1; if (arr[j]) { [arr[i], arr[j]] = [arr[j], arr[i]]; queueSave(); drawEditor(); } } break; }
      case 'knop-test': { const k = devById(knopEd); if (k) pressKnop(k, t.dataset.w); break; }
      case 'dev-add': picking = true; entQ = ''; drawEditor(); await ensureEnts(); drawEditor(); { const q = $('hs-q'); if (q) q.focus(); } break;
      case 'dev-pick': { const en = (ENTS || []).find(x => x.id === t.dataset.ent); tool = { kind: 'place', entity: t.dataset.ent, name: (en && en.name) || t.dataset.ent }; picking = false; drawPlan(); drawEditor(); break; }
      case 'dev-del': if (warn('d' + id)) { H.devices = H.devices.filter(x => x.id !== id); if (sel === id) sel = null; queueSave(); drawAll(); } break;
      case 'scene-add': { const v = $('hs-sc').value; if (!v) break; const en = (ACTS || []).find(x => x.id === v), f = FL(), rm = f.rooms.find(r => r.id === tab); H.scenes.push({ id: newId(), room: rm ? rm.id : 'house', entity: v, name: (en && en.name) || v }); queueSave(); drawRoomEditor(); break; }
      case 'scene-del': if (warn('s' + t.dataset.sid)) { H.scenes = H.scenes.filter(s => s.id !== t.dataset.sid); queueSave(); drawRoomEditor(); } break;
    }
  });
  root.addEventListener('focusin', (e) => {
    const r = e.target.closest('.er[data-id]'); if (edit && r && sel !== r.dataset.id) { sel = r.dataset.id; selectRows(); drawPlan(); }
  });
  function selectRows() { root.querySelectorAll('.er[data-id]').forEach(n => n.classList.toggle('sel', n.dataset.id === sel)); }
  root.addEventListener('input', (e) => {
    const t = e.target, f = FL();
    if (t.id === 'hs-bri') { busy = true; const d = devById(sel); $('hs-briv').textContent = t.value + '%'; if (d) cmd(d, 'brightness', +t.value, true); return; }
    if (t.id === 'hs-vol') { busy = true; const d = devById(sel); $('hs-volv').textContent = t.value + '%'; if (d) cmd(d, 'volume', +t.value, true); return; }
    if (t.id === 'hs-k') { busy = true; const d = devById(sel); $('hs-kv').textContent = t.value + ' K'; if (d) cmd(d, 'temp', +t.value, true); return; }
    if (t.id === 'hs-col') { busy = true; const d = devById(sel), c = t.value; if (d) cmd(d, 'color', [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)], true); return; }
    const fld = t.dataset.f; if (!fld) return;
    if (fld === 'q') { entQ = t.value; const p = document.querySelector('#hs-side .pick'); if (p) { const tmp = document.createElement('div'); tmp.innerHTML = pickerHTML(); const np = tmp.querySelector('.pick'); if (np) p.innerHTML = np.innerHTML; } return; }
    if (fld === 'fname' && f) { f.name = t.value; queueSave(); const tb = root.querySelector(`.hs-tab[data-floor="${f.id}"]`); if (tb) tb.firstChild.textContent = t.value; wrapDirty(); return; }
    if (fld === 'rname' && f) { const r = f.rooms.find(x => x.id === t.dataset.room); if (r) { r.name = t.value; queueSave(); drawPlan(); const tb = root.querySelector(`.hs-tab[data-tab="${r.id}"]`); if (tb) tb.textContent = t.value; wrapDirty(); } return; }
    if (fld === 'dname') { const d = devById(t.dataset.id); if (d) { d.name = t.value; queueSave(); drawPlan(); } return; }
    if (['scmd', 'sdev', 'ssec'].includes(fld)) {
      const k = devById(knopEd), st = k && (k[t.dataset.w] || [])[+t.dataset.i];
      if (st) { if (fld === 'scmd') st.c = t.value; else if (fld === 'sdev') st.d = t.value; else { const v = parseFloat(String(t.value).replace(',', '.')); st.s = isFinite(v) ? v : 1; } queueSave(); }
      return;
    }
    if (fld === 'sname') { const s = H.scenes.find(x => x.id === t.dataset.sid); if (s) { s.name = t.value; queueSave(); } }
  });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'hs-file') { const file = t.files && t.files[0]; t.value = ''; uploadImage(file); return; }
    if (['stype', 'sent', 'kicon', 'kstatus'].includes(t.dataset.f)) {
      const k = devById(knopEd); if (!k) return;
      if (t.dataset.f === 'kicon') k.icon = t.value;
      else if (t.dataset.f === 'kstatus') { k.status = t.value; poll(); }
      else {
        const st = (k[t.dataset.w] || [])[+t.dataset.i]; if (!st) return;
        if (t.dataset.f === 'sent') st.e = t.value;
        else { st.t = t.value; st.e = ''; if (st.t === 'wacht') st.s = 1; else delete st.s; }
      }
      queueSave(); drawEditor(); drawPlan(); return;
    }
    if (t.dataset.f === 'heel') { const d = devById(t.dataset.id); if (d) { d.heel = t.checked; queueSave(); } return; }
    if (['hs-bri', 'hs-vol', 'hs-k', 'hs-col'].includes(t.id)) { busy = false; poll(); }
  });
  root.addEventListener('pointerup', () => { if (busy) setTimeout(() => { busy = false; }, 300); });

  /* the plan itself: placing, drawing and moving (editing); in operating mode a plain click does the work (see above) */
  root.addEventListener('pointerdown', (e) => {
    const svg = $('hs-svg'); if (!svg || !svg.contains(e.target) || !edit) return;
    if (tool && tool.kind === 'room') { e.preventDefault(); addRoomPoint(e); return; }
    if (tool && tool.kind === 'place') { e.preventDefault(); placeDevice(e); return; }
    const vh = e.target.closest('.vh');
    if (vh) { e.preventDefault(); drag = { kind: 'v', room: vh.dataset.room, i: +vh.dataset.i }; svg.setPointerCapture(e.pointerId); return; }
    const mk = e.target.closest('.mk');
    if (mk) { e.preventDefault(); sel = mk.dataset.id; drag = { kind: 'd', id: mk.dataset.id }; try { svg.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } selectRows(); drawPlan(); const row = root.querySelector(`.er[data-id="${sel}"]`); if (row) row.scrollIntoView({ block: 'nearest' }); return; }
    const rm = e.target.closest('.room');
    if (rm) { selRoom = rm.dataset.room; tab = rm.dataset.room; wrapDirty(); drawAll(); }
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toFrac(e), f = FL(); if (!p || !f) return;
    if (drag.kind === 'd') { const d = devById(drag.id); if (d) { d.x = p.x; d.y = p.y; drawPlan(); } }
    else { const r = f.rooms.find(x => x.id === drag.room); if (r && r.poly[drag.i]) { r.poly[drag.i] = [p.x, p.y]; drawPlan(); } }
  });
  const end = () => { if (!drag) return; drag = null; queueSave(); drawStatus(); drawRoomEditor(); };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('keydown', (e) => {
    const mk = e.target.closest && e.target.closest('#hs-svg .mk'); if (!mk) return;
    const d = devById(mk.dataset.id); if (!d) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (edit) { sel = d.id; selectRows(); drawPlan(); return; }
      select(d.id); quick(d);
      return;
    }
    if (edit && /^Arrow/.test(e.key)) {
      e.preventDefault(); const s = e.shiftKey ? .03 : .01;
      if (e.key === 'ArrowLeft') d.x = clamp01(d.x - s); if (e.key === 'ArrowRight') d.x = clamp01(d.x + s);
      if (e.key === 'ArrowUp') d.y = clamp01(d.y - s); if (e.key === 'ArrowDown') d.y = clamp01(d.y + s);
      queueSave(); drawPlan();
    }
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (tool || picking) && !root.hidden) { tool = null; picking = false; drawPlan(); drawEditor(); } });
}
})();
