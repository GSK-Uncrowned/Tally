// ---- Date helpers ----
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
const weekStart = d => { const t = parse(ymd(d)); return addDays(t, -((t.getDay() + 6) % 7)); }; // Monday
const short = d => d.toLocaleDateString('en-PH', {month:'short', day:'numeric'});
const peso = n => {
  n = Math.round(n * 100) / 100;
  return '₱' + (Number.isInteger(n) ? n.toLocaleString('en-PH') : n.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cmp = e => e.qty * e.price;
const k = n => n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k' : String(n);

// ---- Data layer (later: replace these two functions with Supabase calls) ----
const KEY = 'tally-entries-v2';
const RATE_KEY = 'tally-rates-v1';
const CATALOG_KEY = 'tally-catalog-v1';
// [days ago, item, color, size, qty, from, price, sewer, sewer pay]
const DEMO = [
  [0,'Plain t-shirt','White','Medium',200,'Marvin',4,'Ana',1.5],[0,'Plain t-shirt','White','Small',400,'Marvin',4,'Ben',1.5],
  [0,'Polo shirt','Navy','Large',60,'Aling Nena',35,'Carla',12],[1,'Plain t-shirt','White','Large',600,'Marvin',4,'Ana',1.5],
  [1,'Apron','Black','Medium',80,'Ate Joy',20,'Dino',7],[1,'Pillowcase','Cream','Standard',150,'Mang Lito',15,'Elmer',5],
  [2,'Polo shirt','Navy','Medium',80,'Aling Nena',35,'Carla',12],[2,'School uniform','Blue','Small',40,'Mang Lito',90,'Elmer',30],
  [2,'Plain t-shirt','Black','Medium',300,'Marvin',4,'Ben',1.5],[3,'Apron','Red','Large',50,'Ate Joy',20,'Dino',7],
  [3,'Barong','Ivory','Medium',6,'Aling Nena',350,'Carla',120],[4,'Plain t-shirt','Gray','Small',250,'Marvin',4,'Ana',1.5],
  [5,'Curtains','Beige','Standard',24,'Mang Lito',120,'Elmer',40],[5,'Plain t-shirt','White','Medium',350,'Marvin',4,'Ben',1.5],
  [6,'Polo shirt','Maroon','Large',45,'Aling Nena',35,'Carla',12],[8,'Plain t-shirt','Black','Large',500,'Marvin',4,'Ana',1.5],
  [8,'Apron','Green','Medium',70,'Ate Joy',20,'Dino',7],[9,'School uniform','Blue','Medium',55,'Mang Lito',90,'Elmer',30],
  [10,'Plain t-shirt','White','Small',420,'Marvin',4,'Ben',1.5],[10,'Polo shirt','Navy','Small',35,'Aling Nena',35,'Carla',12],
  [11,'Pillowcase','White','Standard',200,'Mang Lito',15,'Elmer',5],[12,'Plain t-shirt','Gray','Large',380,'Marvin',4,'Ana',1.5],
  [13,'Apron','Black','Large',90,'Ate Joy',20,'Dino',7],[15,'Barong','Cream','Large',8,'Aling Nena',350,'Carla',120],
  [16,'Plain t-shirt','White','Medium',450,'Marvin',4,'Ben',1.5],[17,'Curtains','Gray','Standard',30,'Mang Lito',120,'Elmer',40],
  [19,'Plain t-shirt','Black','Small',300,'Marvin',4,'Ana',1.5],[20,'School uniform','Blue','Large',60,'Mang Lito',90,'Dino',30],
  [21,'Polo shirt','Navy','Medium',50,'Aling Nena',35,'Carla',12],
  [0,'School uniform','Blue','Medium',25,'Mang Lito',90,'Ana',30],[1,'Polo shirt','Navy','Small',40,'Aling Nena',35,'Ana',12],
  [2,'Pillowcase','White','Standard',120,'Mang Lito',15,'Ana',5],[2,'Apron','Green','Large',45,'Ate Joy',20,'Ana',7],
  [9,'Polo shirt','Maroon','Medium',30,'Aling Nena',35,'Ana',12],[10,'Apron','Red','Medium',60,'Ate Joy',20,'Ana',7]
];
const DEMO_V = 3; // bump this when DEMO changes so old demo entries refresh
function demoEntries() {
  return DEMO.map((r, i) => ({id: 9e12 + i, date: ymd(addDays(new Date(), -r[0])), item: r[1], color: r[2], size: r[3],
    qty: r[4], client: r[5], price: r[6], sewer: r[7], pay: r[8], demo: DEMO_V}));
}
function seed() { return demoEntries(); }
function loadEntries() {
  try { const s = localStorage.getItem(KEY); if (s) { const list = JSON.parse(s).map(e => ({sewer:'', pay:0, ...e})); return list.some(e => e.demo && e.demo !== DEMO_V) ? list.filter(e => !e.demo).concat(demoEntries()) : list; } } catch (e) {}
  return seed();
}
function saveEntries() { try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (e) {} }
function saveLocalSetup() {
  try { localStorage.setItem(RATE_KEY, JSON.stringify(rates)); localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog)); } catch (e) {}
}
function deriveLocalRates() {
  const by = {};
  entries.forEach(e => {
    const key = rateKey(e.client, e.item, e.size);
    if (!key || by[key] || !(Number(e.price) >= 0) || !(Number(e.pay) >= 0)) return;
    by[key] = {supplier:e.client, item:e.item, size:e.size, price:Number(e.price), pay:Number(e.pay)};
  });
  rates = Object.values(by);
  catalog = {item: [], color: [], size: [], supplier: []};
  entries.forEach(e => {
    [['item', e.item], ['color', e.color], ['size', e.size], ['supplier', e.client]].forEach(([kind, value]) => {
      if (value && !catalog[kind].includes(value)) catalog[kind].push(value);
    });
  });
  try {
    const savedRates = JSON.parse(localStorage.getItem(RATE_KEY) || 'null');
    const savedCatalog = JSON.parse(localStorage.getItem(CATALOG_KEY) || 'null');
    if (Array.isArray(savedRates)) rates = savedRates;
    if (savedCatalog && typeof savedCatalog === 'object') Object.keys(catalog).forEach(k => {
      if (Array.isArray(savedCatalog[k])) catalog[k] = [...new Set([...catalog[k], ...savedCatalog[k]])];
    });
  } catch (e) {}
}

// ---- State ----
// Cloud mode turns on once config.js has real Supabase values; otherwise the app runs locally with demo data
const cloud = typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR');
const sb = cloud ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const authTest = ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).has('auth-test');
let entries = [], me = null, people = [], demoMode = false, organization = null;
const profileNames = new Map();
let rates = [], catalog = {item: [], color: [], size: [], supplier: []};
let realtimeChannel = null, realtimeState = 'DISCONNECTED';
let view = 'log', sel = null, month = new Date(), pendingDel = null, swWeek = weekStart(new Date()), swSel = null, spSel = null, logWeek = weekStart(new Date()), spWeek = weekStart(new Date());
let pendingInvite = new URLSearchParams(window.location.search).get('invite') || '';
const isOwner = () => me && me.role === 'owner';
const isSewer = () => me && me.role === 'sewer';
let wizard = {step: 0, values: {}, date: ymd(new Date()), other: false};
month.setDate(1);

function rateKey(supplier, item, size) {
  return [supplier, item, size].map(v => String(v || '').trim().toLowerCase()).join('|');
}
function currentRate(e) {
  if (e.price !== undefined && e.price !== null && e.pay !== undefined && e.pay !== null) {
    return {price: Number(e.price) || 0, pay: Number(e.pay) || 0};
  }
  const r = rates.find(x => rateKey(x.supplier, x.item, x.size) === rateKey(e.client, e.item, e.size));
  return r ? {price: Number(r.price), pay: Number(r.pay)} : {price: Number(e.price) || 0, pay: Number(e.pay) || 0};
}
function enrichEntries() {
  entries.forEach(e => {
    const r = currentRate(e);
    e.price = Number(e.price) || r.price;
    e.pay = Number(e.pay) || r.pay;
  });
}
function catalogValues(kind) {
  const values = new Set(catalog[kind] || []);
  entries.forEach(e => {
    const field = kind === 'supplier' ? 'client' : kind;
    if (e[field]) values.add(e[field]);
  });
  return [...values].filter(Boolean).sort((a, b) => {
    const field = kind === 'supplier' ? 'client' : kind;
    const aEntries = entries.filter(e => e[field] === a);
    const bEntries = entries.filter(e => e[field] === b);
    if (aEntries.length !== bEntries.length) return bEntries.length - aEntries.length;
    const latest = list => list.reduce((date, e) => e.date > date ? e.date : date, '');
    const latestDiff = latest(bEntries).localeCompare(latest(aEntries));
    return latestDiff || String(a).localeCompare(String(b));
  });
}

const TRASH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>';
const WARN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d92d20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3zM12 10v5M12 18v.5"/></svg>';

const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

function initMeshBackground() {
  const canvas = $('mesh-background');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let points = [], width = 0, height = 0, frame = 0, last = 0;
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(42, Math.min(128, Math.round(width * height / 12500)));
    points = Array.from({length: count}, () => {
      const x = Math.random() * width, y = Math.random() * height;
      return {
        x, y, homeX: x, homeY: y,
        driftX: 18 + Math.random() * 28, driftY: 18 + Math.random() * 28,
        phase: Math.random() * Math.PI * 2,
        speed: .0001 + Math.random() * .00006
      };
    });
    const cornerPoints = [
      [0, 0, 1, 1], [width, 0, -1, 1],
      [0, height, 1, -1], [width, height, -1, -1]
    ];
    cornerPoints.forEach(([x, y, dx, dy]) => {
      points.push({x, y, homeX: x, homeY: y, driftX: 0, driftY: 0, phase: 0, speed: 0, anchor: true});
      for (let i = 0; i < 3; i++) {
        const distance = 45 + Math.random() * 100;
        const pointX = x + dx * distance, pointY = y + dy * distance;
        points.push({
          x: pointX, y: pointY, homeX: pointX, homeY: pointY,
          driftX: 14 + Math.random() * 22, driftY: 14 + Math.random() * 22,
          phase: Math.random() * Math.PI * 2,
          speed: .0001 + Math.random() * .00006
        });
      }
    });
    draw();
  };
  const draw = (time = 0) => {
    last = time;
    ctx.clearRect(0, 0, width, height);
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#fff';
    for (const point of points) {
      if (!reducedMotion && !point.anchor) {
        point.x = Math.max(0, Math.min(width, point.homeX + Math.sin(time * point.speed + point.phase) * point.driftX));
        point.y = Math.max(0, Math.min(height, point.homeY + Math.cos(time * point.speed * .87 + point.phase) * point.driftY));
      }
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j], dx = a.x - b.x, dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 165) continue;
        ctx.strokeStyle = ink;
        ctx.globalAlpha = .5 * (1 - distance / 165);
        ctx.lineWidth = .75;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (!reducedMotion) frame = requestAnimationFrame(draw);
  };
  window.addEventListener('resize', resize, {passive: true});
  resize();
}

// ---- Log ----
function dayLabel(s) {
  const t = ymd(new Date());
  if (s === t) return 'Today';
  if (s === ymd(addDays(new Date(), -1))) return 'Yesterday';
  return parse(s).toLocaleDateString('en-PH', {weekday:'short', month:'short', day:'numeric'});
}
function entryPanel(e, del, noClient) {
  const r = currentRate(e);
  const missing = !rates.some(x => rateKey(x.supplier, x.item, x.size) === rateKey(e.client, e.item, e.size));
  const w = del && pendingDel == e.id;
  return `<div class="panel ${w ? 'warn' : ''}">
    <div class="main"><div class="title"><strong>${esc(noClient ? e.item : e.client)}</strong>${e.sewer ? `<span class="tag">by ${esc(e.sewer)}</span>` : ''}</div>
      <div class="muted">${noClient ? '' : esc(e.item) + ', '}${esc(e.color)}, ${esc(e.size)}</div></div>
    <div class="r"><strong>${missing ? 'Rate needed' : peso(e.qty * r.price)}</strong><div class="muted">${e.qty} × ${missing ? '—' : peso(r.price)}</div></div>
    ${del ? `<button class="trash" data-act="ask" data-id="${e.id}" aria-label="Delete this entry">${TRASH}</button>` : ''}
    ${w ? `<div class="confirm" role="alert"><p>${WARN}<span>Delete this entry? This can't be undone.</span></p>
      <button class="btn" data-act="keep">Keep it</button>
      <button class="danger" data-act="del" data-id="${e.id}">Delete entry</button></div>` : ''}
  </div>`;
}
function weekLabel(ws) {
  const diff = Math.round((weekStart(new Date()) - ws) / 604800000);
  if (diff === 0) return 'This week';
  if (diff === 1) return 'Last week';
  if (diff === -1) return 'Next week';
  return short(ws) + ' to ' + short(addDays(ws, 6));
}
function logView() {
  const s = logWeek, a = ymd(s), b = ymd(addDays(s, 6));
  const nextDisabled = s >= weekStart(new Date());
  const list = entries.filter(e => e.date >= a && e.date <= b).sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
  const label = weekLabel(s), range = short(s) + ' to ' + short(addDays(s, 6));
  let out = `<h1 class="page-title">Log</h1>
    <div class="bar"><span class="sp" style="text-align:left">${label}${label !== range ? ` <span class="muted">${range}</span>` : ''}</span>
      <button class="btn" data-act="lw" data-d="-1" aria-label="Previous week">‹</button>
      <button class="btn" data-act="lw" data-d="1" aria-label="Next week" ${nextDisabled ? 'disabled' : ''}>›</button></div>`, last = '';
  list.forEach(e => {
    if (e.date !== last) { out += `<div class="day">${dayLabel(e.date)}</div>`; last = e.date; }
    out += entryPanel(e, canDelete());
  });
  if (!list.length) out += '<p class="empty">Nothing logged this week.</p>';
  return out + '<button class="fab" data-act="add">Add entry</button>';
}

function myLogView() {
  const previous = entries;
  entries = entries.filter(e => e.sewer_id === me.id || e.created_by === me.id);
  const output = logView().replace('<h1 class="page-title">Log</h1>', '<h1 class="page-title">My logs</h1>');
  entries = previous;
  return output;
}

function mySalaryView() {
  const s = swWeek, end = addDays(s, 6), a = ymd(s), b = ymd(end);
  const list = entries.filter(e => e.sewer_id === me.id && e.date >= a && e.date <= b);
  const total = list.reduce((sum, e) => sum + e.qty * e.pay, 0);
  const pieces = list.reduce((sum, e) => sum + e.qty, 0);
  const bySupplier = group(list, 'client');
  const detail = Object.keys(bySupplier).sort().map(supplier => {
    const rows = bySupplier[supplier].slice().sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
    const supplierTotal = rows.reduce((sum, e) => sum + e.qty * e.pay, 0);
    return `<div class="grp"><div class="sup-head"><strong>${esc(supplier)}</strong><span>${peso(supplierTotal)}</span></div><div class="kids">` +
      rows.map(e => `<div class="slog"><div><div>${esc(e.item)}</div><div class="muted">${esc(e.color)}, ${esc(e.size)}, ${dayLabel(e.date)}</div></div>
        <div class="r"><strong>${peso(e.qty * e.pay)}</strong><div class="muted">${e.qty.toLocaleString()} pcs × ${peso(e.pay)}</div></div></div>`).join('') +
      '</div></div>';
  }).join('');
  const current = a === ymd(weekStart(new Date()));
  return `<h1 class="page-title">My salary</h1>
    <div class="bar"><span class="sp" style="text-align:left">${short(s)} to ${short(end)}${current ? ' (this week)' : ''}</span>
      <button class="btn" data-act="sw" data-d="-1" aria-label="Previous week">‹</button>
      <button class="btn" data-act="sw" data-d="1" aria-label="Next week" ${current ? 'disabled' : ''}>›</button></div>
    <div class="stats"><div class="stat"><span class="muted">Salary</span><b>${peso(total)}</b></div><div class="stat"><span class="muted">Pieces</span><b>${pieces.toLocaleString()}</b></div></div>
    ${detail || '<p class="empty">No logs this week.</p>'}`;
}

function myFinanceView() {
  const list = entries.filter(e => e.sewer_id === me.id);
  const byDay = {};
  list.forEach(e => byDay[e.date] = (byDay[e.date] || 0) + e.qty * e.pay);
  const y = month.getFullYear(), m = month.getMonth(), days = new Date(y, m + 1, 0).getDate();
  let cells = '<div class="cal-label">Wk</div>' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="dow">${d}</div>`).join('');
  const first = new Date(y, m, 1), last = new Date(y, m, days);
  let monthTotal = 0;
  for (let ws = weekStart(first); ws <= last; ws = addDays(ws, 7)) {
    const wk = ymd(ws), wsel = sel && sel.t === 'week' && sel.d === wk;
    cells += `<button class="wbtn ${wsel ? 'on' : ''}" data-act="week" data-d="${wk}" title="See this week" aria-label="Week of ${short(ws)}">${CHEV}</button>`;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(ws, i), key = ymd(dt);
      if (dt.getMonth() !== m) { cells += '<div class="cell off"></div>'; continue; }
      const value = byDay[key] || 0;
      monthTotal += value;
      cells += `<button class="cell ${value ? 'has' : ''} ${wsel ? 'wsel' : ''} ${sel && sel.t === 'day' && sel.d === key ? 'dsel' : ''}" data-act="day" data-d="${key}"><span>${dt.getDate()}</span><b>${value ? k(value) : ''}</b></button>`;
    }
  }
  const detail = myFinanceDetail(list);
  return `<h1 class="page-title">My finance</h1><div class="bar"><span class="sp" style="text-align:left">${month.toLocaleDateString('en-PH', {month:'long', year:'numeric'})}</span>
    <button class="btn" data-act="mshift" data-d="-1" aria-label="Previous month">‹</button><button class="btn" data-act="mshift" data-d="1" aria-label="Next month">›</button></div>
    <div class="stats"><div class="stat"><span class="muted">Your earnings</span><b>${peso(monthTotal)}</b></div></div>
    <div class="cal" style="margin-top:20px">${cells}</div><div id="detail">${detail}</div>`;
}

function myFinanceDetail(list) {
  if (!sel) return '<p class="empty">Tap a week or day to see your earnings and logs.</p>';
  const week = sel.t === 'week', start = parse(sel.d), end = ymd(addDays(start, 6));
  const rows = week ? list.filter(e => e.date >= sel.d && e.date <= end) : list.filter(e => e.date === sel.d);
  const total = rows.reduce((sum, e) => sum + e.qty * e.pay, 0);
  const pieces = rows.reduce((sum, e) => sum + e.qty, 0);
  const title = week ? `Week of ${short(start)} to ${short(addDays(start, 6))}` :
    start.toLocaleDateString('en-PH', {weekday:'long', month:'long', day:'numeric'});
  const grouped = group(rows, 'client');
  const logs = Object.keys(grouped).sort().map(supplier => `<div class="grp"><div class="sup-head"><strong>${esc(supplier)}</strong></div><div class="kids">` +
    grouped[supplier].slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).map(e =>
      `<div class="slog"><div><div>${esc(e.item)}</div><div class="muted">${esc(e.color)}, ${esc(e.size)}, ${dayLabel(e.date)}</div></div>
      <div class="r"><strong>${peso(e.qty * e.pay)}</strong><div class="muted">${e.qty.toLocaleString()} pcs × ${peso(e.pay)}</div></div></div>`).join('') +
    '</div></div>').join('');
  return `<h2 style="margin-top:32px;font-size:1.2rem">${title}</h2>
    <div class="stats"><div class="stat"><span class="muted">Earnings</span><b>${peso(total)}</b></div><div class="stat"><span class="muted">Pieces</span><b>${pieces.toLocaleString()}</b></div></div>
    ${logs || `<p class="empty">Nothing was logged ${week ? 'this week' : 'this day'}.</p>`}`;
}

// ---- Finance ----
function sewerBlock(list) {
  const pay = {};
  list.forEach(e => {
    if (!e.sewer) return;
    const p = pay[e.sewer] = pay[e.sewer] || {qty:0, amt:0};
    p.qty += e.qty; p.amt += e.qty * e.pay;
  });
  const names = Object.keys(pay).sort();
  return {
    paid: names.reduce((s, n) => s + pay[n].amt, 0),
    html: names.map(n => `<div class="panel"><div class="main"><strong>${esc(n)}</strong><div class="muted">${pay[n].qty.toLocaleString()} pieces</div></div>
      <div class="r"><strong>${peso(pay[n].amt)}</strong><div class="muted">salary</div></div></div>`).join('') || '<p class="muted">No sewers recorded.</p>'
  };
}
function stats(income, pay) {
  const cell = (l, v) => `<div class="stat"><span class="muted">${l}</span><b>${peso(v)}</b></div>`;
  return `<div class="stats">${cell('Income', income)}${cell('Sewers', pay)}${cell('Profit', income - pay)}</div>`;
}
function supplierTree(list, inner) {
  const by = group(list, 'client');
  return Object.keys(by).sort().map(c => `<div class="grp"><div class="sup-head"><strong>${esc(c)}</strong><span>${peso(by[c].reduce((t, x) => t + cmp(x), 0))}</span></div><div class="kids">${inner(by[c])}</div></div>`).join('');
}
function detailView() {
  if (!sel) return '<p class="empty">Tap a week on the left, or any day, to see what was sewn.</p>';
  const week = sel.t === 'week', s = parse(sel.d), end = ymd(addDays(s, 6));
  const list = week ? entries.filter(e => e.date >= sel.d && e.date <= end) : entries.filter(e => e.date === sel.d);
  const title = week ? `Week of ${short(s)} to ${short(addDays(s, 6))}` : s.toLocaleDateString('en-PH', {weekday:'long', month:'long', day:'numeric'});
  const income = list.reduce((a, e) => a + cmp(e), 0), sw = sewerBlock(list);
  return `<h2 style="margin-top:32px;font-size:1.2rem">${title}</h2>${stats(income, sw.paid)}` +
    (supplierTree(list, week ? sewerTree : l => l.map(e => entryPanel(e, false, true)).join(''))
      || `<p class="empty">Nothing ${week ? 'was sewn this week' : 'was logged this day'}.</p>`);
}
function financeView() {
  const y = month.getFullYear(), m = month.getMonth(), days = new Date(y, m + 1, 0).getDate();
  const byDay = {};
  entries.forEach(e => byDay[e.date] = (byDay[e.date] || 0) + cmp(e));
  const payDay = {};
  entries.forEach(e => payDay[e.date] = (payDay[e.date] || 0) + e.qty * e.pay);
  const weekTotal = ws => { let t = 0; for (let i = 0; i < 7; i++) t += byDay[ymd(addDays(ws, i))] || 0; return t; };
  let cells = '<div class="cal-label">Wk</div>' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="dow">${d}</div>`).join('');
  let monthTotal = 0, monthPay = 0;
  const first = new Date(y, m, 1), last = new Date(y, m, days);
  for (let ws = weekStart(first); ws <= last; ws = addDays(ws, 7)) {
    const wk = ymd(ws), wsel = sel && sel.t === 'week' && sel.d === wk;
    cells += `<button class="wbtn ${wsel ? 'on' : ''}" data-act="week" data-d="${wk}" title="See this week" aria-label="Week of ${short(ws)}">${CHEV}</button>`;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(ws, i), key = ymd(dt);
      if (dt.getMonth() !== m) { cells += '<div class="cell off"></div>'; continue; }
      const v = byDay[key] || 0; monthTotal += v; monthPay += payDay[key] || 0;
      cells += `<button class="cell ${v ? 'has' : ''} ${wsel ? 'wsel' : ''} ${sel && sel.t === 'day' && sel.d === key ? 'dsel' : ''}" data-act="day" data-d="${key}"><span>${dt.getDate()}</span><b>${v ? k(v) : ''}</b></button>`;
    }
  }
  return `<h1 class="page-title">Finance</h1>
    <div class="bar"><span class="sp" style="text-align:left">${month.toLocaleDateString('en-PH', {month:'long', year:'numeric'})}</span>
      <button class="btn" data-act="mshift" data-d="-1" aria-label="Previous month">‹</button>
      <button class="btn" data-act="mshift" data-d="1" aria-label="Next month">›</button></div>
    ${stats(monthTotal, monthPay)}
    <div class="cal" style="margin-top:20px">${cells}</div>
    <div id="detail">${detailView()}</div>`;
}

// ---- Salary ----
function miniCard(act, name, big, small, on) {
  return `<button class="mini ${on ? 'on' : ''}" data-act="${act}" data-n="${esc(name)}">
    <span class="top"><span class="avatar sm">${esc(name[0].toUpperCase())}</span><span>${esc(name)}</span></span>
    <strong>${big}</strong><span class="muted">${small}</span></button>`;
}
function group(list, f) {
  const by = {};
  list.forEach(x => (by[x[f]] = by[x[f]] || []).push(x));
  return by;
}
function sewersView() {
  const s = swWeek, e = addDays(s, 6), a = ymd(s), b = ymd(e);
  const by = group(entries.filter(x => x.date >= a && x.date <= b && x.sewer), 'sewer');
  const cur = a === ymd(weekStart(new Date()));
  const total = n => by[n].reduce((t, x) => t + x.qty * x.pay, 0), pcs = n => by[n].reduce((t, x) => t + x.qty, 0);
  let detail = '';
  if (swSel) {
    const rows = by[swSel] || [], sup = group(rows, 'client');
    detail = rows.length
      ? `<p class="muted" style="margin-top:24px">${pcs(swSel).toLocaleString()} pieces, ${peso(total(swSel))} salary this week</p>` +
        Object.keys(sup).sort().map(c => {
          const l = sup[c].sort((p, q) => q.date.localeCompare(p.date) || q.id - p.id);
          return `<div class="grp"><div class="sup-head"><strong>${esc(c)}</strong><span>${peso(l.reduce((t, x) => t + x.qty * x.pay, 0))}</span></div><div class="kids">` +
            l.map(x => `<div class="slog"><div><div>${esc(x.item)}</div><div class="muted">${esc(x.color)}, ${esc(x.size)}, ${dayLabel(x.date)}</div></div>
              <div class="r"><strong>${peso(x.qty * x.pay)}</strong><div class="muted">${x.qty} pcs × ${peso(x.pay)}</div></div></div>`).join('') + '</div></div>';
        }).join('')
      : '<p class="empty">No logs this week.</p>';
  }
  return `<h1 class="page-title">Salary</h1>
    <div class="bar"><span class="sp" style="text-align:left">${short(s)} to ${short(e)}${cur ? ' (this week)' : ''}</span>
      <button class="btn" data-act="sw" data-d="-1" aria-label="Previous week">‹</button>
      <button class="btn" data-act="sw" data-d="1" aria-label="Next week" ${cur ? 'disabled' : ''}>›</button></div>
    <div class="mini-grid">${Object.keys(by).sort().map(n => miniCard('sewer', n, peso(total(n)), pcs(n).toLocaleString() + ' pieces', swSel === n)).join('')}</div>` +
    (Object.keys(by).length ? '' : '<p class="empty">No sewers were logged this week.</p>') + `<div id="detail">${detail}</div>`;
}

// ---- Suppliers (the people the cloth comes from) ----
const textCmp = (a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'});
const sizeRank = z => { const i = ['xs', 'small', 'medium', 'large', 'xl', 'xxl'].indexOf(z.toLowerCase()); return i < 0 ? 9 : i; };
// Groups one supplier's entries per sewer, then lists items sorted by name (same names end up together)
function sewerTree(list) {
  const by = group(list, 'sewer');
  return Object.keys(by).sort((a, b) => (!a - !b) || textCmp(a, b)).map(n => {
    const rows = {};
    by[n].forEach(e => {
      const k = [e.item, e.color, e.size, e.price].join('|').toLowerCase();
      const r = rows[k] = rows[k] || {item:e.item, color:e.color, size:e.size, price:e.price, qty:0};
      r.qty += e.qty;
    });
    const l = Object.values(rows).sort((a, b) => textCmp(a.item, b.item) || textCmp(a.color, b.color) || sizeRank(a.size) - sizeRank(b.size));
    const total = l.reduce((t, r) => t + r.qty * r.price, 0);
    return `<div class="grp sm"><div class="sup-head"><strong>${esc(n || 'No sewer')}</strong><span>${peso(total)}</span></div><div class="kids">` +
      l.map(r => `<div class="slog"><div><div>${esc(r.item)}</div><div class="muted">${esc(r.color)}, ${esc(r.size)}</div></div>
        <div class="r"><strong>${peso(r.qty * r.price)}</strong><div class="muted">${r.qty.toLocaleString()} × ${peso(r.price)}</div></div></div>`).join('') + '</div></div>';
  }).join('');
}
function weekBar(s, act) {
  const label = weekLabel(s), range = short(s) + ' to ' + short(addDays(s, 6));
  const nextDisabled = s >= weekStart(new Date());
  return `<div class="bar"><span class="sp" style="text-align:left">${label}${label !== range ? ` <span class="muted">${range}</span>` : ''}</span>
    <button class="btn" data-act="${act}" data-d="-1" aria-label="Previous week">‹</button>
    <button class="btn" data-act="${act}" data-d="1" aria-label="Next week" ${nextDisabled ? 'disabled' : ''}>›</button></div>`;
}
function suppliersView() {
  const a = ymd(spWeek), b = ymd(addDays(spWeek, 6));
  const by = group(entries.filter(x => x.date >= a && x.date <= b && x.client), 'client');
  const total = n => by[n].reduce((t, x) => t + cmp(x), 0), pcs = n => by[n].reduce((t, x) => t + x.qty, 0);
  const detail = spSel ? `<h2 style="margin-top:28px;font-size:1.2rem">${esc(spSel)}</h2>` + (by[spSel] ? sewerTree(by[spSel]) : '<p class="empty">Nothing from them this week.</p>') : '';
  return `<h1 class="page-title">Suppliers</h1>${weekBar(spWeek, 'sp')}
    <div class="mini-grid">${Object.keys(by).sort().map(n => miniCard('supplier', n, peso(total(n)), pcs(n).toLocaleString() + ' pieces', spSel === n)).join('')}</div>` +
    (Object.keys(by).length ? '' : '<p class="empty">No suppliers logged this week.</p>') + `<div id="detail">${detail}</div>`;
}

// ---- Render + events ----
function setupView() {
  const combos = {};
  entries.forEach(e => {
    if (!e.client || !e.item || !e.size) return;
    const key = rateKey(e.client, e.item, e.size);
    combos[key] = combos[key] || {supplier:e.client, item:e.item, size:e.size};
  });
  const missing = Object.values(combos).filter(c => !rates.some(r => rateKey(r.supplier, r.item, r.size) === rateKey(c.supplier, c.item, c.size)));
  const rateRows = rates.slice().sort((a, b) => rateKey(a.supplier, a.item, a.size).localeCompare(rateKey(b.supplier, b.item, b.size)));
  const cards = (kind, label) => `<section class="setup-section"><div class="bar"><h2>${label}</h2><button class="btn" data-act="catalog-add" data-kind="${kind}">Add</button></div>
    <div class="option-list">${catalogValues(kind).map(v => `<span class="option-chip">${esc(v)}</span>`).join('') || '<span class="muted">No values yet.</span>'}</div></section>`;
  return `<h1 class="page-title">Setup</h1>
    <p class="muted">Manage rates and the options used when logging work.</p>
    <section class="setup-section"><div class="bar"><h2>Needs attention <span class="tag">${missing.length}</span></h2></div>
      ${missing.length ? missing.map(c => `<div class="rate-card missing"><div><strong>${esc(c.supplier)}</strong><div class="muted">${esc(c.item)} · ${esc(c.size)}</div></div><button class="primary" data-act="rate-edit" data-supplier="${esc(c.supplier)}" data-item="${esc(c.item)}" data-size="${esc(c.size)}">Set rate</button></div>`).join('') : '<p class="empty">Everything used in your entries has a price and sewer pay.</p>'}
    </section>
    <section class="setup-section"><div class="bar"><h2>Price &amp; sewer pay</h2><button class="btn" data-act="rate-add">Add rate</button></div>
      ${rateRows.length ? rateRows.map(r => `<div class="rate-card"><div><strong>${esc(r.supplier)}</strong><div class="muted">${esc(r.item)} · ${esc(r.size)}</div></div><div class="r"><strong>${peso(r.price)}</strong><div class="muted">pay ${peso(r.pay)}</div></div><button class="btn" data-act="rate-edit" data-supplier="${esc(r.supplier)}" data-item="${esc(r.item)}" data-size="${esc(r.size)}">Edit</button></div>`).join('') : '<p class="empty">No rates yet.</p>'}
    </section>${cards('item', 'Items')}${cards('size', 'Sizes')}${cards('color', 'Colors')}${cards('supplier', 'Suppliers')}`;
}
const views = {log: logView, sewers: sewersView, suppliers: suppliersView, finance: financeView, setup: setupView, 'my-log': myLogView, 'my-finance': myFinanceView, 'my-salary': mySalaryView};
function renderTopbar() {
  const topbar = $('topbar');
  if (!cloud || !me) { topbar.hidden = true; topbar.innerHTML = ''; return; }
  topbar.hidden = false;
  const realtimeLive = realtimeState === 'SUBSCRIBED';
  topbar.innerHTML = `<span class="live-status ${realtimeLive ? 'live' : ''}" role="status" title="${realtimeLive ? 'Realtime updates are connected' : 'Realtime updates are reconnecting'}">
      <span class="live-dot" aria-hidden="true"></span><span class="live-label">${realtimeLive ? 'Live' : 'Syncing'}</span>
    </span><details class="profile-menu">
    <summary><span class="avatar">${esc(me.name[0].toUpperCase())}</span><span class="profile-name">${esc(me.name)}</span></summary>
    <div class="profile-popover">
      <strong>${esc(me.name)} <span class="muted">· ${isOwner() ? 'Owner' : 'Sewer'}</span></strong>
      ${isOwner() ? '<button class="menu-btn" data-act="invite">Invite sewers</button>' : ''}
      <button class="menu-btn" data-act="demo">${demoMode ? 'Exit demo mode' : 'Try demo data'}</button>
      <button class="menu-btn" data-act="logout">Log out</button>
    </div>
  </details>`;
}
let busyText = '';
function showBusy(text) {
  const b = $('busy');
  if (busyText !== (text || '') || !b.firstChild) { // same loader already drawn: keep it, so the animation doesn't restart
    b.innerHTML = text
      ? `<div class="busy-word" aria-hidden="true">${[...text].map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join('')}</div>`
      : '<span class="tally-loader" aria-hidden="true">T</span>';
    busyText = text || '';
  }
  b.setAttribute('aria-label', text || 'Loading Tally');
  b.hidden = false;
}
function hideBusy() { $('busy').hidden = true; }
function renderLoading(text) {
  document.body.classList.add('loading-screen');
  showBusy(text);
  $('main').innerHTML = '';
}
function hideLoading() {
  document.body.classList.remove('loading-screen');
  hideBusy();
}
function withTimeout(promise, milliseconds, message) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}
function render() {
  if (isOwner() && ['my-log', 'my-finance', 'my-salary'].includes(view)) view = 'log';
  if (isSewer() && !['my-log', 'my-finance', 'my-salary'].includes(view)) view = 'my-log';
  const nextView = view;
  document.getElementById('main').innerHTML = views[nextView]();
  renderTopbar();
  document.querySelectorAll('nav [data-view]').forEach(b => {
    const ownerOnly = ['log', 'sewers', 'suppliers', 'finance', 'setup'].includes(b.dataset.view);
    const sewerOnly = ['my-log', 'my-finance', 'my-salary'].includes(b.dataset.view);
    b.hidden = (ownerOnly && !isOwner()) || (sewerOnly && !isSewer());
    if (b.dataset.view === nextView) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
const $ = id => document.getElementById(id);
const WIZARD_STEPS = [
  {key: 'client', label: 'Who is it from?', kind: 'supplier'},
  {key: 'item', label: 'What are you sewing?', kind: 'item'},
  {key: 'color', label: 'What color is it?', kind: 'color'},
  {key: 'size', label: 'What size is it?', kind: 'size'},
  {key: 'qty', label: 'How many pieces?', kind: 'quantity'}
];
function wizardOptions(kind) {
  if (kind !== 'item' || !wizard.values.client) return catalogValues(kind);
  const linked = new Set(entries.filter(e => e.client === wizard.values.client).map(e => e.item));
  const values = catalogValues(kind);
  return values.filter(v => linked.has(v));
}
function openDialog() {
  wizard = {step: 0, values: {}, date: ymd(new Date()), other: false};
  $('err').textContent = '';
  renderWizard();
  $('dlg').showModal();
}
function renderWizard() {
  const s = WIZARD_STEPS[wizard.step], values = wizardOptions(s.kind);
  const selected = wizard.values[s.key];
  const cards = values.map(v => `<button class="choice-card ${selected === v ? 'selected' : ''}" data-act="wizard-choice" data-key="${s.key}" data-value="${esc(v)}">${esc(v)}</button>`).join('');
  const other = `<button class="choice-card other ${wizard.other ? 'selected' : ''}" data-act="wizard-other" data-key="${s.key}"><span class="other-icon">＋</span>Other</button>`;
  const custom = wizard.other ? `<input class="in wizard-other-input" id="wizard-other-input" placeholder="Type a new ${s.label.toLowerCase()}" value="${esc(selected || '')}" autofocus>` : '';
  const qty = s.kind === 'quantity' ? `<input class="in wizard-quantity" id="wizard-quantity" type="number" min="1" inputmode="numeric" placeholder="Quantity" value="${esc(selected || '')}" autofocus>` : '';
  $('wizard').innerHTML = `<button type="button" class="wizard-close" data-act="close-wizard" aria-label="Close add entry">&times;</button>
    <div class="wizard-progress"><span>Step ${wizard.step + 1} of ${WIZARD_STEPS.length}</span><span>${wizard.date === ymd(new Date()) ? 'Today' : wizard.date}</span></div>
    <h2 class="wizard-title">${s.label}</h2><div class="choice-grid">${s.kind === 'quantity' ? qty : cards + other}</div>
    ${custom}<button class="textbtn date-toggle" data-act="wizard-date">Using today · Change date</button>`;
  $('dlg').querySelector('[data-act="wizard-back"]').hidden = wizard.step === 0;
  const next = $('dlg').querySelector('[data-act="wizard-next"]');
  next.textContent = wizard.step === WIZARD_STEPS.length - 1 ? 'Save entry' : 'Continue';
  next.hidden = s.kind !== 'quantity' && !wizard.other;
}
function wizardValue() {
  const s = WIZARD_STEPS[wizard.step];
  if (s.kind === 'quantity') return $('wizard-quantity').value.trim();
  if (wizard.other) return $('wizard-other-input').value.trim();
  return wizard.values[s.key] || '';
}
function wizardNext() {
  const s = WIZARD_STEPS[wizard.step], value = wizardValue();
  if (!value || (s.kind === 'quantity' && !(Number(value) > 0))) {
    $('err').textContent = s.kind === 'quantity' ? 'Enter a quantity above 0.' : 'Choose an option or add a new value.';
    return;
  }
  wizard.values[s.key] = s.kind === 'quantity' ? Number(value) : value;
  wizard.other = false;
  if (wizard.step < WIZARD_STEPS.length - 1) { wizard.step++; renderWizard(); return; }
  saveEntry();
}
function wizardBack() {
  if (wizard.step > 0) { wizard.step--; wizard.other = false; renderWizard(); }
}
async function toggleDemo() {
  if (demoMode) {
    demoMode = false;
    if (cloud) await refresh();
    else { entries = loadEntries(); deriveLocalRates(); }
    render();
    return;
  }
  demoMode = true;
  entries = demoEntries();
  deriveLocalRates();
  render();
}
function validateRequired(ids) {
  let first = null;
  ids.forEach(id => {
    const field = $(id);
    const invalid = !field.value.trim() || !field.checkValidity();
    field.classList.toggle('invalid', invalid);
    if (invalid && !first) first = field;
  });
  if (first) {
    first.focus();
    return false;
  }
  return true;
}
let saving = false;
async function saveEntry() {
  if (saving) return;
  saving = true;
  try {
    const v = wizard.values, e = {date: wizard.date, item: v.item, color: v.color || 'Any', size: v.size || 'Any',
      client: v.client || 'Unknown', sewer: cloud ? me.name : '', qty: Number(v.qty)};
    const r = currentRate(e);
    e.price = r.price; e.pay = r.pay;

    if (!cloud) {
      e.id = Date.now(); entries.push(e);
      [['item', e.item], ['color', e.color], ['size', e.size], ['supplier', e.client]].forEach(([kind, value]) => {
        if (!catalog[kind].includes(value)) catalog[kind].push(value);
      });
      saveEntries(); saveLocalSetup();
      logWeek = weekStart(parse(e.date)); $('dlg').close(); render();
      return;
    }

    const sewerId = isOwner() && v.sewer_id ? v.sewer_id : me.id;
    const sw = people.find(p => p.id === sewerId);
    const tmp = {...e, id: 'tmp-' + Date.now(), sewer_id: sewerId, sewer: sw ? sw.name : me.name};

    // show it and close the modal right away
    entries.push(tmp);
    logWeek = weekStart(parse(e.date));
    $('dlg').close(); render();

    const {error} = await sb.from('entries').insert({organization_id: organization.id, created_by: me.id, date: e.date, item: e.item,
      color: e.color, size: e.size, client: e.client, qty: e.qty, price: e.price, pay: e.pay, sewer_id: sewerId});
    if (error) {
      entries = entries.filter(x => x.id !== tmp.id);
      render();
      alert('Could not save entry: ' + error.message);
      return;
    }

    const additions = [['item', e.item], ['color', e.color], ['size', e.size], ['supplier', e.client]]
      .filter(([kind, value]) => !catalog[kind].includes(value))
      .map(([kind, value]) => ({kind, value, organization_id: organization.id, created_by: me.id}));
    if (additions.length) {
      const {error: catalogError} = await sb.from('tally_catalog_values').upsert(additions, {onConflict:'organization_id,kind,value'});
      if (catalogError) console.warn('Catalog not updated:', catalogError.message); // entry is saved, so don't treat as failure
    }

    entries = entries.filter(x => x.id !== tmp.id);
    await refresh();
    render();
  } finally {
    saving = false;
  }
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act],[data-view]');
  if (!b) return;
  const d = b.dataset;
  if (d.act !== 'ask') pendingDel = null;
  if (d.view) {
    if (view === d.view) return;
    view = d.view;
    sel = null;
    swSel = null;
    spSel = null;
    pendingDel = null;
  }
  else if (d.act === 'add') { openDialog(); return; }
  else if (d.act === 'cancel' || d.act === 'close-wizard') { $('dlg').close(); return; }
  else if (d.act === 'wizard-choice') {
    wizard.values[d.key] = d.value;
    wizard.other = false;
    if (d.key === 'client') {
      delete wizard.values.item;
      delete wizard.values.color;
      delete wizard.values.size;
    }
    wizardNext();
    return;
  }
  else if (d.act === 'wizard-other') { wizard.other = true; renderWizard(); return; }
  else if (d.act === 'wizard-next') { wizardNext(); return; }
  else if (d.act === 'wizard-back') { wizardBack(); return; }
  else if (d.act === 'wizard-date') {
    const date = prompt('Use a different date (YYYY-MM-DD), or cancel to keep today:', wizard.date);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { wizard.date = date; renderWizard(); }
    return;
  }
  else if (d.act === 'save') { saveEntry(); return; }
  else if (d.act === 'rate-add') { addRateFlow(); return; }
  else if (d.act === 'rate-edit') { openRateDialog(d.supplier, d.item, d.size); return; }
  else if (d.act === 'rate-cancel') { $('rate-dlg').close(); return; }
  else if (d.act === 'rate-save') { saveRate(); return; }
  else if (d.act === 'catalog-add') { addCatalogValue(d.kind); return; }
  else if (d.act === 'demo') { toggleDemo(); return; }
  else if (d.act === 'ask') pendingDel = d.id;
  else if (d.act === 'del') { removeEntry(d.id); return; }
  else if (d.act === 'auth-go') { authGo(); return; }
  else if (d.act === 'auth-google') { authGoogle(); return; }
  else if (d.act === 'auth-resend') { resendConfirmation(); return; }
  else if (d.act === 'auth-back') { hideConfirmation(); setAuthMode('login'); return; }
  else if (d.act === 'auth-test-confirm') { enterAuthTestWorkspace(); return; }
  else if (d.act === 'create-org') { showCreateOrganization(); return; }
  else if (d.act === 'create-submit') { createOrganization(); return; }
  else if (d.act === 'join-org') { showJoinOrganization(); return; }
  else if (d.act === 'join-submit') { joinOrganization(); return; }
  else if (d.act === 'scan-invite') { scanInvite(); return; }
  else if (d.act === 'scan-close') { closeScanner(); return; }
  else if (d.act === 'onboarding-back') { showOnboarding(); return; }
  else if (d.act === 'onboarding-exit') { exitOnboarding(); return; }
  else if (d.act === 'onboarding-close') { hideOnboarding(); return; }
  else if (d.act === 'invite') { createInvite(); return; }
  else if (d.act === 'auth-mode') { setAuthMode(authMode === 'login' ? 'signup' : 'login'); return; }
  else if (d.act === 'logout') { logout(); return; }
  else if (d.act === 'week' || d.act === 'day') {
    const t = d.act, same = sel && sel.t === t && sel.d === d.d;
    sel = same ? null : {t, d: d.d};
  }
  else if (d.act === 'lw') logWeek = addDays(logWeek, 7 * Number(d.d));
  else if (d.act === 'sw') swWeek = addDays(swWeek, 7 * Number(d.d));
  else if (d.act === 'sewer') swSel = swSel === d.n ? null : d.n;
  else if (d.act === 'supplier') spSel = spSel === d.n ? null : d.n;
  else if (d.act === 'sp') spWeek = addDays(spWeek, 7 * Number(d.d));
  else if (d.act === 'mshift') { month = new Date(month.getFullYear(), month.getMonth() + Number(d.d), 1); sel = null; }
  render();
});
document.addEventListener('input', ev => {
  if (ev.target.matches('.in')) ev.target.classList.remove('invalid');
  if (ev.target.id === 'join-token') {
    const digits = ev.target.value.replace(/\D/g, '').slice(0, 6);
    ev.target.value = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
  }
});
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' || ev.target.tagName !== 'INPUT') return;
  if (ev.target.closest('#auth')) {
    ev.preventDefault();
    authGo();
  } else if (ev.target.closest('#dlg')) {
    ev.preventDefault();
    wizardNext();
  } else if (ev.target.closest('#rate-dlg')) {
    ev.preventDefault();
    saveRate();
  }
});
let editingRate = null;
function openRateDialog(supplier = '', item = '', size = '') {
  editingRate = {supplier, item, size};
  const r = rates.find(x => rateKey(x.supplier, x.item, x.size) === rateKey(supplier, item, size));
  $('rate-context').textContent = `${supplier || 'Supplier'} · ${item || 'Item'} · ${size || 'Size'}`;
  $('r-price').value = r ? r.price : '';
  $('r-pay').value = r ? r.pay : '';
  $('rate-err').textContent = '';
  $('rate-dlg').showModal();
}
function addRateFlow() {
  const supplier = prompt('Supplier name:');
  if (!supplier || !supplier.trim()) return;
  const item = prompt('Item name:');
  if (!item || !item.trim()) return;
  const size = prompt('Size:');
  if (!size || !size.trim()) return;
  openRateDialog(supplier.trim(), item.trim(), size.trim());
}
async function saveRate() {
  const price = Number($('r-price').value), pay = Number($('r-pay').value);
  if (!editingRate || !(price >= 0) || !(pay >= 0) || $('r-price').value === '' || $('r-pay').value === '') {
    $('rate-err').textContent = 'Enter both a valid price and sewer pay.'; return;
  }
  const r = {...editingRate, price, pay};
  const existing = rates.findIndex(x => rateKey(x.supplier, x.item, x.size) === rateKey(r.supplier, r.item, r.size));
  const previousRate = existing >= 0 ? {...rates[existing]} : null;
  if (existing >= 0) rates[existing] = {...rates[existing], ...r}; else rates.push(r);
  const start = ymd(weekStart(new Date()));
  const inCurrentWeek = e => e.date >= start && e.date <= ymd(addDays(parse(start), 6)) &&
    rateKey(e.client, e.item, e.size) === rateKey(r.supplier, r.item, r.size);
  const affected = entries.filter(inCurrentWeek);
  const previousEntries = affected.map(e => ({e, price:e.price, pay:e.pay}));
  affected.forEach(e => { e.price = price; e.pay = pay; });
  if (cloud) {
    const {error} = await sb.from('tally_rates').upsert({organization_id:organization.id, supplier:r.supplier, item:r.item, size:r.size, price, pay, created_by:me.id},
      {onConflict:'organization_id,supplier,item,size'});
    if (error) {
      if (previousRate) rates[existing] = previousRate; else rates.splice(rates.length - 1, 1);
      previousEntries.forEach(x => { x.e.price = x.price; x.e.pay = x.pay; });
      $('rate-err').textContent = error.message; return;
    }
    if (affected.length) {
      const ids = affected.map(e => e.id);
      const {error: updateError} = await sb.from('entries').update({price, pay}).in('id', ids);
      if (updateError) {
        if (previousRate) rates[existing] = previousRate; else rates.splice(rates.length - 1, 1);
        previousEntries.forEach(x => { x.e.price = x.price; x.e.pay = x.pay; });
        $('rate-err').textContent = updateError.message; return;
      }
    }
  } else { saveEntries(); saveLocalSetup(); }
  $('rate-dlg').close(); render();
}
async function addCatalogValue(kind) {
  const label = kind === 'supplier' ? 'supplier' : kind;
  const value = prompt(`Add a new ${label}:`);
  if (!value || !value.trim()) return;
  const clean = value.trim();
  if (!catalog[kind].some(v => v.toLowerCase() === clean.toLowerCase())) catalog[kind].push(clean);
  if (cloud) {
    const {error} = await sb.from('tally_catalog_values').insert({organization_id:organization.id, kind, value:clean, created_by:me.id});
    if (error && error.code !== '23505') { alert('Could not add option: ' + error.message); return; }
  } else saveLocalSetup();
  render();
}
// ---- Cloud (Supabase) ----
const canDelete = () => isOwner();
let authMode = 'login';
function showOnboarding() {
  hideLoading();
  $('onboarding').hidden = false;
  $('onboarding-status').textContent = '';
  $('onboarding-content').innerHTML = `<div class="onboarding-actions">
    <button class="onboarding-card create-card" data-act="create-org"><span class="onboarding-icon">＋</span><span><strong>Create an organization</strong><span class="muted">Set up your sewing business and invite your team.</span></span><span class="onboarding-arrow">→</span></button>
    <button class="onboarding-card join-card" data-act="join-org"><span class="onboarding-icon">⌁</span><span><strong>Join an organization</strong><span class="muted">Scan the invitation from your owner to get started.</span></span><span class="onboarding-arrow">→</span></button>
  </div>`;
  if (pendingInvite) showJoinOrganization();
}
function hideOnboarding() {
  $('onboarding').hidden = true;
  const panel = document.querySelector('.onboarding-panel');
  const x = panel.querySelector('.onboarding-close');
  panel.classList.remove('invite-mode');
  x.dataset.act = 'onboarding-exit';
  x.setAttribute('aria-label', 'Exit organization setup');
  $('onboarding-title').textContent = 'Set up your workspace';
}
async function exitOnboarding() {
  if (cloud) await sb.auth.signOut();
  me = null;
  organization = null;
  entries = [];
  people = [];
  profileNames.clear();
  hideOnboarding();
  setAuthMode('login');
  showAuth();
}
function showCreateOrganization() {
  $('onboarding-content').innerHTML = `<div class="onboarding-form">
    <label class="required" for="organization-name">Organization name</label>
    <input class="in" id="organization-name" placeholder="e.g. Maria's Sewing Shop" maxlength="120" autofocus>
    <button class="primary" data-act="create-submit">Create organization</button>
    <button class="textbtn" data-act="onboarding-back">Back</button>
  </div>`;
}
async function createOrganization() {
  const name = $('organization-name').value.trim();
  if (!name) {
    $('organization-name').classList.add('invalid');
    $('onboarding-status').textContent = 'Enter an organization name.';
    return;
  }
  $('onboarding-status').textContent = '';
  showBusy('Creating organization');
  const {data, error} = await sb.rpc('create_organization', {organization_name: name.trim()});
  if (error) { hideBusy(); $('onboarding-status').textContent = error.message; return; }
  organization = data;
  await enter();
}
function showJoinOrganization() {
  $('onboarding-content').innerHTML = `<div class="onboarding-form">
    <label class="required" for="join-token">Six-digit invite code</label>
    <input class="in invite-code-input" id="join-token" inputmode="numeric" maxlength="7" placeholder="000-000" value="${esc(pendingInvite)}">
    <button class="primary" data-act="join-submit">Join organization</button>
    <button class="btn" data-act="scan-invite">Scan QR code</button>
    <button class="textbtn" data-act="onboarding-back">Back</button>
  </div>`;
}
async function stopScanner() {
  const s = window.tallyQrScanner;
  window.tallyQrScanner = null;
  if (!s) return;
  try { await s.stop(); } catch (e) {}
  try { s.clear(); } catch (e) {}
}
let scanTimer = null;
function closeScanner() {
  clearTimeout(scanTimer);
  $('scan-modal').hidden = true;
  document.querySelector('.scan-panel').classList.remove('done');
  stopScanner();
}
function scanSuccess() {
  stopScanner();
  document.querySelector('.scan-panel').classList.add('done');
  clearTimeout(scanTimer);
  scanTimer = setTimeout(closeScanner, 1900);
}
function scanInvite() {
  if (typeof Html5Qrcode !== 'function') {
    $('onboarding-status').textContent = 'QR scanning is unavailable. Enter the six-digit code instead.';
    return;
  }
  $('scan-status').textContent = '';
  $('scan-modal').hidden = false;
  const scanner = new Html5Qrcode('qr-reader');
  window.tallyQrScanner = scanner;
  scanner.start(
    {facingMode: 'environment'},
    {fps: 10, qrbox: 200, aspectRatio: 1},
    text => {
      if (window.tallyQrScanner !== scanner) return;
      const digits = text.replace(/\D/g, '').slice(-6);
      if (digits.length !== 6) {
        $('scan-status').textContent = 'That QR code is not a Tally invite code.';
        return;
      }
      $('join-token').value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      scanSuccess();
    },
    () => {}
  ).catch(error => {
    closeScanner();
    $('onboarding-status').textContent = 'Could not access the camera. Enter the six-digit code instead.';
    console.error('Could not start QR scanner:', error);
  });
}
async function joinOrganization() {
  const token = $('join-token').value.replace(/\D/g, '');
  if (!/^\d{6}$/.test(token)) { $('onboarding-status').textContent = 'Enter the six digits shown by the owner.'; return; }
  $('onboarding-status').textContent = '';
  showBusy('Joining organization');
  const {data, error} = await sb.rpc('accept_organization_invite', {raw_token: token});
  if (error) { hideBusy(); $('onboarding-status').textContent = error.message; return; }
  if (!data || !data.id) { hideBusy(); $('onboarding-status').textContent = 'That code is invalid or expired.'; return; }
  organization = data;
  pendingInvite = '';
  await enter();
}
let inviteCache = null, inviting = false;
function openInviteModal() {
  const panel = document.querySelector('.onboarding-panel');
  const x = panel.querySelector('.onboarding-close');
  panel.classList.add('invite-mode');
  x.dataset.act = 'onboarding-close'; // in this view the corner X only closes the modal (the normal one signs out)
  x.setAttribute('aria-label', 'Close');
  $('onboarding-title').textContent = 'Invite a sewer';
  $('onboarding-status').textContent = '';
  $('onboarding-content').innerHTML = '<div class="invite-code-display"><span>Invite code</span><div class="invite-qr invite-wait"><span class="tally-loader" aria-hidden="true">T</span></div><strong>···</strong></div>';
  $('onboarding').hidden = false;
}
function showInvite(token, expiresAt) {
  const displayCode = `${token.slice(0, 3)}-${token.slice(3)}`;
  const until = new Date(expiresAt).toLocaleString([], {weekday: 'short', hour: 'numeric', minute: '2-digit'});
  navigator.clipboard && navigator.clipboard.writeText(displayCode).catch(() => {});
  $('onboarding-content').innerHTML = `<div class="invite-code-display"><span>Invite code</span><div class="invite-qr" id="invite-qr"></div><strong>${esc(displayCode)}</strong><small>Scan this QR code or share the six-digit code. Valid until ${until}.</small></div>`;
  if (typeof QRCode === 'function') {
    new QRCode($('invite-qr'), {text: token, width: 180, height: 180});
  }
}
async function createInvite() {
  if (!organization || !organization.id) {
    $('onboarding-status').textContent = 'Your organization is not loaded yet. Please refresh and try again.';
    $('onboarding').hidden = false;
    return;
  }
  if (inviting) return;
  openInviteModal(); // open right away, fill in the code when it arrives
  if (inviteCache && inviteCache.org === organization.id && new Date(inviteCache.expires) > new Date()) {
    showInvite(inviteCache.token, inviteCache.expires); // same code for 24 hours, no need to ask Supabase again
    return;
  }
  inviting = true;
  try {
    const {data, error} = await sb.rpc('create_organization_invite', {target_organization: organization.id});
    if (error || !data || !data[0] || !data[0].invite_token) {
      hideOnboarding();
      alert('Could not create invite: ' + (error ? error.message : 'Supabase returned no invite token.'));
      return;
    }
    inviteCache = {org: organization.id, token: data[0].invite_token, expires: data[0].expires_at};
    showInvite(inviteCache.token, inviteCache.expires);
  } finally {
    inviting = false;
  }
}
function showAuth(msg) {
  hideLoading();
  document.body.classList.add('auth-screen');
  $('topbar').hidden = true;
  $('auth').hidden = false;
  $('confirm-modal').hidden = true;
  $('a-err').textContent = msg || '';
}
function showAuthError(message, ids = []) {
  showAuth(message);
  ids.forEach(id => $(id).classList.add('invalid'));
  const box = document.querySelector('.authbox');
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
}
function hideAuth() {
  hideLoading();
  document.body.classList.remove('auth-screen');
  $('auth').hidden = true;
}
function setAuthMode(m) {
  authMode = m;
  hideConfirmation();
  $('a-name').hidden = $('a-name-l').hidden = m !== 'signup';
  $('a-name').required = m === 'signup';
  $('a-name').classList.remove('invalid');
  $('a-title').textContent = m === 'signup' ? 'Create your account' : 'Welcome back';
  $('a-go').textContent = m === 'signup' ? 'Sign up' : 'Log in';
  $('a-switch').innerHTML = m === 'signup'
    ? 'Already have an account? <strong>Log in</strong>'
    : "Don't have an account? <strong>Sign up</strong>";
  $('a-sub').textContent = m === 'signup' ? 'Create your account' : 'Log in to continue';
  $('a-err').textContent = '';
}
function confirmationRedirectUrl() {
  return window.location.origin + window.location.pathname;
}
function showConfirmation(email) {
  const panel = document.querySelector('.confirm-panel');
  panel.classList.remove('loading');
  $('confirm-icon').textContent = '✉';
  $('confirm-title').textContent = 'Check your email';
  $('confirm-message').innerHTML = 'We sent a confirmation link to <strong id="confirm-email"></strong>. Open it to activate your account.';
  $('confirm-email').textContent = email;
  $('confirm-actions').hidden = false;
  document.querySelector('[data-act="auth-test-confirm"]').hidden = !authTest;
  $('confirm-status').textContent = '';
  $('confirm-modal').hidden = false;
  $('a-err').textContent = '';
}
function showConfirmationLoading(email) {
  const panel = document.querySelector('.confirm-panel');
  panel.classList.add('loading');
  $('confirm-icon').innerHTML = '<span class="tally-loader">T</span>';
  $('confirm-title').textContent = 'Creating your account…';
  $('confirm-message').textContent = `Setting up ${email}. Just a moment.`;
  $('confirm-actions').hidden = true;
  $('confirm-status').textContent = '';
  $('confirm-modal').hidden = false;
}
function hideConfirmation() {
  const panel = document.querySelector('.confirm-panel');
  panel.classList.remove('loading');
  $('confirm-actions').hidden = false;
  document.querySelector('[data-act="auth-test-confirm"]').hidden = true;
  $('confirm-modal').hidden = true;
}
function enterAuthTestWorkspace() {
  hideConfirmation();
  document.body.classList.remove('auth-screen');
  $('auth').hidden = true;
  me = {id: 'auth-test-user', name: 'Test user', role: 'owner'};
  organization = {id: 'auth-test-org', name: 'Test organization'};
  entries = demoEntries();
  demoMode = true;
  deriveLocalRates();
  view = 'log';
  render();
}
async function resendConfirmation() {
  const email = $('confirm-email').textContent.trim();
  if (!email) return;
  if (authTest) {
    $('confirm-status').textContent = 'Test mode: no email was sent.';
    return;
  }
  const button = document.querySelector('[data-act="auth-resend"]');
  button.disabled = true;
  $('confirm-status').textContent = 'Sending…';
  const {error} = await sb.auth.resend({type: 'signup', email, options: {emailRedirectTo: confirmationRedirectUrl()}});
  button.disabled = false;
  $('confirm-status').textContent = error ? error.message : 'A new confirmation email is on its way.';
}
async function fetchAllEntries() {
  const PAGE = 1000; // Supabase returns at most 1000 rows per request, so load in pages
  let all = [];
  for (let from = 0; ; from += PAGE) {
    const {data, error} = await sb.from('entries')
      .select('id, organization_id, created_by, date, item, color, size, qty, client, price, pay, sewer_id, profiles(name)')
      .eq('organization_id', organization.id)
      .order('date', {ascending: false})
      .order('id', {ascending: false})
      .range(from, from + PAGE - 1);
    if (error) return {error};
    all = all.concat(data);
    if (data.length < PAGE) break;
  }
  return {data: all};
}
async function refresh() {
  const {data, error} = await fetchAllEntries();
  if (error) { alert('Could not load entries: ' + error.message); return; }
  profileNames.clear();
  data.forEach(r => {
    if (r.sewer_id && r.profiles && r.profiles.name) profileNames.set(r.sewer_id, r.profiles.name);
  });
  entries = data.map(entryFromRow);
  const [rateRes, catalogRes] = await Promise.all([
    sb.from('tally_rates').select('supplier, item, size, price, pay').eq('organization_id', organization.id),
    sb.from('tally_catalog_values').select('kind, value').eq('organization_id', organization.id).order('value')
  ]);
  if (rateRes.error) { alert('Could not load rates: ' + rateRes.error.message); return; }
  if (catalogRes.error) { alert('Could not load catalog: ' + catalogRes.error.message); return; }
  rates = rateRes.data || [];
  catalog = {item: [], color: [], size: [], supplier: []};
  (catalogRes.data || []).forEach(x => { if (catalog[x.kind]) catalog[x.kind].push(x.value); });
  enrichEntries();
}
function entryFromRow(r) {
  return {id: r.id, organization_id:r.organization_id, created_by:r.created_by, sewer_id:r.sewer_id, date: r.date, item: r.item, color: r.color, size: r.size, qty: r.qty, client: r.client,
    price: Number(r.price), pay: Number(r.pay),
    sewer: r.profiles ? r.profiles.name : (r.sewer_id === me.id ? me.name : profileNames.get(r.sewer_id) || 'Unknown sewer')};
}
async function loadRealtimeProfile(sewerId) {
  if (!sewerId || profileNames.has(sewerId)) return profileNames.get(sewerId) || 'Unknown sewer';
  const {data, error} = await sb.from('profiles').select('name').eq('id', sewerId).single();
  if (error) {
    console.error('Could not load the sewer profile for a realtime entry:', error);
    return 'Unknown sewer';
  }
  profileNames.set(sewerId, data.name);
  return data.name;
}
async function applyRealtimeEntry(payload) {
  if (demoMode) return;
  const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
  if (!row) return;
  const index = entries.findIndex(e => String(e.id) === String(row.id));
  if (payload.eventType === 'DELETE') {
    if (index >= 0) entries.splice(index, 1);
  } else {
    const next = entryFromRow(row);
    if (index >= 0) entries[index] = {...entries[index], ...next};
    else entries.push(next);
    if (row.sewer_id && !profileNames.has(row.sewer_id)) {
      next.sewer = await loadRealtimeProfile(row.sewer_id);
      const currentIndex = entries.findIndex(e => String(e.id) === String(row.id));
      if (currentIndex >= 0) entries[currentIndex].sewer = next.sewer;
    }
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id));
  render();
}
function applyRealtimeRate(payload) {
  const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
  if (!row) return;
  const key = rateKey(row.supplier, row.item, row.size);
  const index = rates.findIndex(r => rateKey(r.supplier, r.item, r.size) === key);
  if (payload.eventType === 'DELETE') {
    if (index >= 0) rates.splice(index, 1);
  } else {
    const next = {supplier: row.supplier, item: row.item, size: row.size, price: Number(row.price), pay: Number(row.pay)};
    if (index >= 0) rates[index] = next; else rates.push(next);
  }
  enrichEntries();
  render();
}
function applyRealtimeCatalog(payload) {
  const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
  if (!row || !catalog[row.kind]) return;
  if (payload.eventType === 'DELETE') {
    catalog[row.kind] = catalog[row.kind].filter(value => value !== row.value);
  } else if (!catalog[row.kind].includes(row.value)) {
    catalog[row.kind].push(row.value);
  }
  render();
}
function subscribeRealtime() {
  if (!cloud || !me) return;
  if (realtimeChannel) sb.removeChannel(realtimeChannel);
  realtimeState = 'CONNECTING';
  realtimeChannel = sb.channel(`tally:${me.id}`)
    .on('postgres_changes', {event: '*', schema: 'public', table: 'entries'}, applyRealtimeEntry)
    .on('postgres_changes', {event: '*', schema: 'public', table: 'tally_rates'}, applyRealtimeRate)
    .on('postgres_changes', {event: '*', schema: 'public', table: 'tally_catalog_values'}, applyRealtimeCatalog)
    .subscribe(status => {
      realtimeState = status;
      renderTopbar();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') refresh();
    });
}
async function unsubscribeRealtime() {
  if (realtimeChannel) await sb.removeChannel(realtimeChannel);
  realtimeChannel = null;
  realtimeState = 'DISCONNECTED';
}
async function enter() {
  const word = $('busy').hidden ? '' : busyText; // keep "Creating/Joining organization" on screen while the app loads
  hideAuth();
  renderLoading(word);
  const {data: u} = await sb.auth.getUser();
  if (!u || !u.user || !u.user.id) {
    showAuth('Your session expired. Please log in again.');
    return;
  }
  const {data: p, error} = await sb.from('profiles').select('id, name, role, organization_id, active').eq('id', u.user.id).single();
  if (error || !p || p.active === false) {
    await sb.auth.signOut();
    showAuth('Could not load your profile. Make sure your Supabase profiles table and signup trigger are configured.');
    return;
  }
  if (!p.organization_id || !p.role) {
    me = p;
    hideAuth();
    showOnboarding();
    return;
  }
  const {data: org, error: orgError} = await sb.from('organizations').select('id, name, created_by').eq('id', p.organization_id).single();
  if (orgError || !org) {
    showAuth('Could not load your organization. Ask the owner to check the organization setup.');
    return;
  }
  if (!org.id) {
    showAuth('Your organization record is incomplete. Ask the owner to recreate it.');
    return;
  }
  organization = org;
  me = p;
  const {data: memberRows} = await sb.from('profiles').select('id, name, role, active').eq('organization_id', organization.id).eq('active', true);
  people = memberRows || [p];
  profileNames.set(p.id, p.name);
  await refresh();
  subscribeRealtime();
  hideAuth(); hideOnboarding(); view = isOwner() ? 'log' : 'my-log'; render();
}
async function authGo() {
  const email = $('a-email').value.trim(), password = $('a-pass').value, name = $('a-name').value.trim();
  const authFields = authMode === 'signup' ? ['a-name', 'a-email', 'a-pass'] : ['a-email', 'a-pass'];
  if (!validateRequired(authFields)) return;
  if (!email || password.length < 6 || (authMode === 'signup' && !name)) {
    if (password.length < 6) $('a-pass').classList.add('invalid');
    $('a-err').textContent = authMode === 'signup' ? 'Enter your name, an email, and a password of 6 or more characters.' : 'Enter your email and password.'; return;
  }
  if (authTest) {
    if (authMode === 'signup') {
      showConfirmationLoading(email);
      window.setTimeout(() => showConfirmation(email), 900);
    } else {
      enterAuthTestWorkspace();
    }
    return;
  }
  try {
    if (authMode === 'signup') showConfirmationLoading(email);
    const res = authMode === 'signup'
      ? await sb.auth.signUp({email, password, options: {data: {name}, emailRedirectTo: confirmationRedirectUrl()}})
      : await sb.auth.signInWithPassword({email, password});
    if (res.error) {
      const fields = authMode === 'login' ? ['a-email', 'a-pass'] : ['a-email'];
      showAuthError(res.error.message, fields);
      return;
    }
    if (!res.data.session) { showAuth(); showConfirmation(email); return; }
    renderLoading();
    await enter();
  } catch (e) {
    hideConfirmation();
    showAuth('Could not connect. Check your connection and try again.');
  }
}
async function authGoogle() {
  if (authTest) {
    showConfirmationLoading('your Google account');
    window.setTimeout(enterAuthTestWorkspace, 900);
    return;
  }
  $('a-err').textContent = '';
  $('a-go').disabled = true;
  document.querySelector('[data-act="auth-google"]').disabled = true;
  const {error} = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
      queryParams: {prompt: 'select_account'}
    }
  });
  if (error) {
    $('a-go').disabled = false;
    document.querySelector('[data-act="auth-google"]').disabled = false;
    $('a-err').textContent = error.message;
  }
}
async function logout() {
  await unsubscribeRealtime();
  await sb.auth.signOut();
  me = null; entries = []; people = []; profileNames.clear(); organization = null; demoMode = false;
  setAuthMode('login'); showAuth(); renderTopbar();
}
async function removeEntry(id) {
  if (String(id).startsWith('tmp-')) return; // still saving, nothing to delete yet
  const removed = entries.find(e => e.id == id);
  if (!removed) return;

  entries = entries.filter(e => e.id != id);
  pendingDel = null;
  render();

  if (!cloud) { saveEntries(); return; }

  const {data, error} = await sb.from('entries').delete().eq('id', id).select();
  if (error || !data || data.length === 0) {
    alert(error
      ? 'Could not delete entry: ' + error.message
      : 'Could not delete this entry. You may not have permission, or it was already deleted.');
    await refresh(); // resync with the real data instead of guessing
    render();
  }
}
async function boot() {
  if (authTest) { showAuth(); return; }
  if (!cloud) { me = {id: 'local-user', name: 'Local owner', role: 'owner'}; organization = {id: 'local-org', name: 'Local workspace'}; entries = loadEntries(); deriveLocalRates(); hideLoading(); render(); return; }
  renderLoading();
  try {
    const {data, error} = await withTimeout(sb.auth.getSession(), 8000, 'Supabase took too long to respond.');
    if (error) {
      if (/invalid api key/i.test(error.message || '')) {
        throw new Error('Supabase rejected the publishable API key in config.js. Replace it with the current key from Project Settings > API.');
      }
      throw error;
    }
    if (data.session) {
      await withTimeout(enter(), 12000, 'Could not load your workspace in time.');
    } else {
      showAuth();
    }
  } catch (error) {
    console.error('Tally startup failed:', error);
    showAuth(error.message || 'Tally could not connect to Supabase. Check your connection and try again.');
  }
}
initMeshBackground();
boot();