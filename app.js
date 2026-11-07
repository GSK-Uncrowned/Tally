// ---- Date helpers ----
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
const weekStart = d => { const t = parse(ymd(d)); return addDays(t, -((t.getDay() + 6) % 7)); }; // Monday
const short = d => d.toLocaleDateString(loc(), {month:'short', day:'numeric'});
const peso = n => {
  n = Math.round(n * 100) / 100;
  return '₱' + (Number.isInteger(n) ? n.toLocaleString('en-PH') : n.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tr = k => I18N.t(k);
const loc = () => I18N.lang() === 'fil' ? 'fil-PH' : 'en-PH';
const DOW = () => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => tr('dow.' + d));
const cmp = e => e.qty * e.price;
const k = n => n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k' : String(n);

async function sendMyEmail() {
  const response = await fetch('/api/send-email', {method: 'POST'});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Email could not be sent.');
  return data;
}

// ---- Data layer (later: replace these two functions with Supabase calls) ----
const KEY = 'tally-entries-v2';
const RATE_KEY = 'tally-rates-v1';
const CATALOG_KEY = 'tally-catalog-v1';
function loadEntries() {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s).filter(e => !e.demo).map(e => ({sewer:'', pay:0, ...e})); } catch (e) {}
  return [];
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
// Cloud mode turns on once config.js has real Supabase values; otherwise the app runs locally in the browser
const cloud = typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR');
const sb = cloud ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const authTest = ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).has('auth-test');
let entries = [], me = null, people = [], organization = null, periods = {};
const profileNames = new Map();
let rates = [], catalog = {item: [], color: [], size: [], supplier: []};
let realtimeChannel = null, realtimeState = 'DISCONNECTED';
let demoMode = false, demoBackup = null;
let view = 'log', sel = null, month = new Date(), pendingDel = null, swWeek = weekStart(new Date()), swSel = null, spSel = null, logWeek = weekStart(new Date()), spWeek = weekStart(new Date());
let pendingInvite = new URLSearchParams(window.location.search).get('invite') || '';
const isOwner = () => me && me.role === 'owner';
const isSewer = () => me && me.role === 'sewer';
const remote = () => cloud && !demoMode;
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
// ---- Finalized weeks (locked, with saved payslips) ----
const PKEY = 'tally-periods-v1';
const isLocked = d => !!periods[ymd(weekStart(parse(d)))];
function savePeriods() { try { localStorage.setItem(PKEY, JSON.stringify(periods)); } catch (e) {} }
async function loadPeriods() {
  if (demoMode) return;
  if (!cloud) { try { periods = JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { periods = {}; } return; }
  const {data, error} = await sb.from('salary_periods').select('week_start, finalized_at, salary_statements(sewer_id, sewer_name, pieces, total, lines)').eq('organization_id', organization.id);
  periods = {};
  if (error) return; // the table may not exist yet: the app still works, weeks just can't be finalized
  (data || []).forEach(p => { periods[p.week_start] = {finalized_at: p.finalized_at, statements: p.salary_statements || []}; });
}
if (!cloud) loadPeriods();
function buildStatements(ws) {
  const a = ymd(ws), b = ymd(addDays(ws, 6)), by = {};
  entries.filter(e => e.date >= a && e.date <= b && e.sewer).forEach(e => {
    const k = e.sewer_id || e.sewer;
    const st = by[k] = by[k] || {sewer_id: e.sewer_id || null, sewer_name: e.sewer, pieces: 0, total: 0, rows: {}};
    const lk = [e.client, e.item, e.color, e.size, e.pay].join('|').toLowerCase();
    const l = st.rows[lk] = st.rows[lk] || {supplier: e.client, item: e.item, color: e.color, size: e.size, qty: 0, pay: e.pay};
    l.qty += e.qty; st.pieces += e.qty; st.total += e.qty * e.pay;
  });
  return Object.values(by).map(st => ({sewer_id: st.sewer_id, sewer_name: st.sewer_name, pieces: st.pieces, total: st.total,
    lines: Object.values(st.rows).sort((x, y) => textCmp(x.supplier, y.supplier) || textCmp(x.item, y.item))}));
}
async function finalizeWeek(ws) {
  const key = ymd(ws), statements = buildStatements(ws);
  if (remote()) {
    const {error} = await sb.rpc('finalize_week', {target_organization: organization.id, target_week: key, statements});
    if (error) { alert(tr('err.finalize') + error.message + '\n(If it mentions a missing function, run supabase-finalize.sql in Supabase first.)'); return false; }
    await loadPeriods();
  } else { periods[key] = {finalized_at: new Date().toISOString(), statements}; if (!demoMode) savePeriods(); }
  return true;
}
async function reopenWeek(ws) {
  const key = ymd(ws);
  if (remote()) {
    const {error} = await sb.rpc('reopen_week', {target_organization: organization.id, target_week: key});
    if (error) { alert(tr('err.reopen') + error.message); return false; }
    await loadPeriods();
  } else { delete periods[key]; if (!demoMode) savePeriods(); }
  return true;
}
const LOCKI = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const DLI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
const weekText = ws => short(ws) + ' – ' + short(addDays(ws, 6));
function weekNav(act, s) {
  const cur = s >= weekStart(new Date()), p = periods[ymd(s)];
  const pill = p ? `<span class="wk-pill on">${LOCKI}Finalized · ${short(new Date(p.finalized_at))}</span>` : `<span class="wk-pill">${cur ? tr('wk.inProgress') : tr('wk.notFinal')}</span>`;
  return `<div class="weekbar"><button class="wk-arr" data-act="${act}" data-d="-1" aria-label="${tr('aria.prev')}">‹</button>
    <div class="wl">${weekText(s)}<br>${pill}</div>
    <button class="wk-arr" data-act="${act}" data-d="1" aria-label="${tr('aria.next')}" ${cur ? 'disabled' : ''}>›</button></div>`;
}
function monthNav() {
  const current = new Date();
  const isCurrentMonth = month.getFullYear() === current.getFullYear() && month.getMonth() === current.getMonth();
  return `<div class="weekbar"><button class="wk-arr" data-act="mshift" data-d="-1" aria-label="${tr('aria.prevMonth')}">‹</button>
    <div class="wl">${month.toLocaleDateString(loc(), {month:'long', year:'numeric'})}</div>
    <button class="wk-arr" data-act="mshift" data-d="1" aria-label="${tr('aria.nextMonth')}" ${isCurrentMonth ? 'disabled' : ''}>›</button></div>`;
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
  if (s === t) return tr('wiz.today');
  if (s === ymd(addDays(new Date(), -1))) return tr('day.yesterday');
  return parse(s).toLocaleDateString(loc(), {weekday:'short', month:'short', day:'numeric'});
}
function entryPanel(e, del, noClient) {
  const r = currentRate(e);
  const missing = !rates.some(x => rateKey(x.supplier, x.item, x.size) === rateKey(e.client, e.item, e.size));
  del = del && !isLocked(e.date);
  const w = del && pendingDel == e.id;
  return `<div class="panel ${w ? 'warn' : ''}">
    <div class="main"><div class="title"><strong>${esc(noClient ? e.item : e.client)}</strong>${e.sewer ? `<span class="tag">by ${esc(e.sewer)}</span>` : ''}</div>
      <div class="muted">${noClient ? '' : esc(e.item) + ', '}${esc(e.color)}, ${esc(e.size)}</div></div>
    <div class="r"><strong>${missing ? tr('rate.needed') : peso(e.qty * r.price)}</strong><div class="muted">${e.qty} × ${missing ? '—' : peso(r.price)}</div></div>
    ${del ? `<button class="trash" data-act="ask" data-id="${e.id}" aria-label="${tr('aria.delete')}">${TRASH}</button>` : ''}
    ${w ? `<div class="confirm" role="alert"><p>${WARN}<span>${tr('entry.deleteAsk')}</span></p>
      <button class="btn" data-act="keep">${tr('entry.keep')}</button>
      <button class="danger" data-act="del" data-id="${e.id}">${tr('entry.delete')}</button></div>` : ''}
  </div>`;
}
function weekLabel(ws) {
  const diff = Math.round((weekStart(new Date()) - ws) / 604800000);
  if (diff === 0) return tr('wk.this');
  if (diff === 1) return tr('wk.last');
  if (diff === -1) return tr('wk.next');
  return short(ws) + ' ' + tr('word.to') + ' ' + short(addDays(ws, 6));
}
function logView() {
  const s = logWeek, a = ymd(s), b = ymd(addDays(s, 6));
  const list = entries.filter(e => e.date >= a && e.date <= b).sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
  let out = `<h1 class="page-title">${tr('nav.log')}</h1>${weekNav('lw', s)}` +
    (periods[a] ? '<p class="muted fin-note" style="text-align:left;margin:0 0 4px">' + tr('log.locked') + '</p>' : ''), last = '';
  list.forEach(e => {
    if (e.date !== last) { out += `<div class="day">${dayLabel(e.date)}</div>`; last = e.date; }
    out += entryPanel(e, canDelete());
  });
  if (!list.length) out += '<p class="empty">' + tr('log.none') + '</p>';
  return out + '<button class="fab" data-act="add">' + tr('log.add') + '</button>';
}

function myLogView() {
  const previous = entries;
  entries = entries.filter(e => e.sewer_id === me.id || e.created_by === me.id);
  const output = logView().replace('<h1 class="page-title">' + tr('nav.log') + '</h1>', '<h1 class="page-title">' + tr('nav.myLogs') + '</h1>');
  entries = previous;
  return output;
}

function mySalaryView() {
  const s = swWeek, a = ymd(s), b = ymd(addDays(s, 6));
  const list = entries.filter(e => e.sewer_id === me.id && e.date >= a && e.date <= b);
  const total = list.reduce((sum, e) => sum + e.qty * e.pay, 0);
  const pieces = list.reduce((sum, e) => sum + e.qty, 0);
  const bySupplier = group(list, 'client');
  const detail = Object.keys(bySupplier).sort().map(supplier => {
    const rows = bySupplier[supplier].slice().sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
    return `<div class="grp"><div class="sup-head"><strong>${esc(supplier)}</strong><span>${peso(rows.reduce((sum, e) => sum + e.qty * e.pay, 0))}</span></div><div class="kids">` +
      rows.map(e => `<div class="slog"><div><div>${esc(e.item)}</div><div class="muted">${esc(e.color)}, ${esc(e.size)}, ${dayLabel(e.date)}</div></div>
        <div class="r"><strong>${peso(e.qty * e.pay)}</strong><div class="muted">${e.qty.toLocaleString()} ${tr('unit.pcs')} × ${peso(e.pay)}</div></div></div>`).join('') + '</div></div>';
  }).join('');
  const p = periods[a], st = p && (p.statements || []).find(x => x.sewer_id === me.id);
  const foot = st ? `<button class="fin-btn" data-act="slip" data-self="1">${DLI}${tr('btn.dlSlip')}</button>`
    : p ? '' : '<p class="muted fin-note">' + tr('fin.inProgressMine') + '</p>';
  const bar = foot ? '<div class="fin-bar">' + foot + '</div>' : '';
  return `<h1 class="page-title">${tr('view.mySalary')}</h1>${weekNav('sw', s)}
    <div class="tot-l">${tr('tot.yourPay')}</div><div class="tot-v">${peso(total)}</div><p class="muted" style="margin:0">${pieces.toLocaleString()} ${tr('unit.pieces')}</p>
    ${detail || '<p class="empty">' + tr('log.noneMine') + '</p>'}${bar}`;
}

function myFinanceView() {
  const list = entries.filter(e => e.sewer_id === me.id);
  const byDay = {};
  list.forEach(e => byDay[e.date] = (byDay[e.date] || 0) + e.qty * e.pay);
  const y = month.getFullYear(), m = month.getMonth(), days = new Date(y, m + 1, 0).getDate();
  let cells = '<div class="cal-label">Wk</div>' + DOW().map(d => `<div class="dow">${d}</div>`).join('');
  const first = new Date(y, m, 1), last = new Date(y, m, days);
  let monthTotal = 0;
  for (let ws = weekStart(first); ws <= last; ws = addDays(ws, 7)) {
    const wk = ymd(ws), wsel = sel && sel.t === 'week' && sel.d === wk;
    cells += `<button class="wbtn ${wsel ? 'on' : ''}" data-act="week" data-d="${wk}" title="${tr('aria.seeWeek')}" aria-label="${tr('fin.weekOf')} ${short(ws)}">${CHEV}</button>`;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(ws, i), key = ymd(dt);
      if (dt.getMonth() !== m) { cells += '<div class="cell off"></div>'; continue; }
      const value = byDay[key] || 0;
      monthTotal += value;
      cells += `<button class="cell ${value ? 'has' : ''} ${wsel ? 'wsel' : ''} ${sel && sel.t === 'day' && sel.d === key ? 'dsel' : ''}" data-act="day" data-d="${key}"><span>${dt.getDate()}</span><b>${value ? k(value) : ''}</b></button>`;
    }
  }
  const detail = myFinanceDetail(list);
  return `<h1 class="page-title">${tr('view.myFinance')}</h1>${monthNav()}
    <div class="stats"><div class="stat"><span class="muted">${tr('fin.yourEarnings')}</span><b>${peso(monthTotal)}</b></div></div>
    <div class="cal" style="margin-top:20px">${cells}</div><div id="detail">${detail}</div>`;
}

function myFinanceDetail(list) {
  if (!sel) return '<p class="empty">' + tr('fin.tapMine') + '</p>';
  const week = sel.t === 'week', start = parse(sel.d), end = ymd(addDays(start, 6));
  const rows = week ? list.filter(e => e.date >= sel.d && e.date <= end) : list.filter(e => e.date === sel.d);
  const total = rows.reduce((sum, e) => sum + e.qty * e.pay, 0);
  const pieces = rows.reduce((sum, e) => sum + e.qty, 0);
  const title = week ? `Week of ${short(start)} to ${short(addDays(start, 6))}` :
    start.toLocaleDateString(loc(), {weekday:'long', month:'long', day:'numeric'});
  const grouped = group(rows, 'client');
  const logs = Object.keys(grouped).sort().map(supplier => `<div class="grp"><div class="sup-head"><strong>${esc(supplier)}</strong></div><div class="kids">` +
    grouped[supplier].slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).map(e =>
      `<div class="slog"><div><div>${esc(e.item)}</div><div class="muted">${esc(e.color)}, ${esc(e.size)}, ${dayLabel(e.date)}</div></div>
      <div class="r"><strong>${peso(e.qty * e.pay)}</strong><div class="muted">${e.qty.toLocaleString()} ${tr('unit.pcs')} × ${peso(e.pay)}</div></div></div>`).join('') +
    '</div></div>').join('');
  return `<h2 style="margin-top:32px;font-size:1.2rem">${title}</h2>
    <div class="stats"><div class="stat"><span class="muted">${tr('fin.earnings')}</span><b>${peso(total)}</b></div><div class="stat"><span class="muted">${tr('unit.piecesCap')}</span><b>${pieces.toLocaleString()}</b></div></div>
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
    html: names.map(n => `<div class="panel"><div class="main"><strong>${esc(n)}</strong><div class="muted">${pay[n].qty.toLocaleString()} ${tr('unit.pieces')}</div></div>
      <div class="r"><strong>${peso(pay[n].amt)}</strong><div class="muted">${tr('sal.lower')}</div></div></div>`).join('') || '<p class="muted">' + tr('sal.noSewers') + '</p>'
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
  if (!sel) return '<p class="empty">' + tr('fin.tapWeek') + '</p>';
  const week = sel.t === 'week', s = parse(sel.d), end = ymd(addDays(s, 6));
  const list = week ? entries.filter(e => e.date >= sel.d && e.date <= end) : entries.filter(e => e.date === sel.d);
  const title = week ? `${tr('fin.weekOf')} ${short(s)} ${tr('word.to')} ${short(addDays(s, 6))}` : s.toLocaleDateString(loc(), {weekday:'long', month:'long', day:'numeric'});
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
  let cells = '<div class="cal-label">Wk</div>' + DOW().map(d => `<div class="dow">${d}</div>`).join('');
  let monthTotal = 0, monthPay = 0;
  const first = new Date(y, m, 1), last = new Date(y, m, days);
  for (let ws = weekStart(first); ws <= last; ws = addDays(ws, 7)) {
    const wk = ymd(ws), wsel = sel && sel.t === 'week' && sel.d === wk;
    cells += `<button class="wbtn ${wsel ? 'on' : ''}" data-act="week" data-d="${wk}" title="${tr('aria.seeWeek')}" aria-label="${tr('fin.weekOf')} ${short(ws)}">${CHEV}</button>`;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(ws, i), key = ymd(dt);
      if (dt.getMonth() !== m) { cells += '<div class="cell off"></div>'; continue; }
      const v = byDay[key] || 0; monthTotal += v; monthPay += payDay[key] || 0;
      cells += `<button class="cell ${v ? 'has' : ''} ${wsel ? 'wsel' : ''} ${sel && sel.t === 'day' && sel.d === key ? 'dsel' : ''}" data-act="day" data-d="${key}"><span>${dt.getDate()}</span><b>${v ? k(v) : ''}</b></button>`;
    }
  }
  return `<h1 class="page-title">${tr('nav.finance')}</h1>
    ${monthNav()}
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
  const s = swWeek, a = ymd(s), b = ymd(addDays(s, 6));
  const by = group(entries.filter(x => x.date >= a && x.date <= b && x.sewer), 'sewer');
  const p = periods[a], names = Object.keys(by).sort();
  const total = n => by[n].reduce((t, x) => t + x.qty * x.pay, 0), pcs = n => by[n].reduce((t, x) => t + x.qty, 0);
  const grand = names.reduce((t, n) => t + total(n), 0);
  let bar = '';
  if (p) bar = `<button class="fin-btn" data-act="sum">${DLI}${tr('btn.dlAll')}</button><button class="fin-btn ghost" data-act="reopen-open">${tr('fin.reopenWeek')}</button><p class="muted fin-note">${tr('fin.entriesLocked')}</p>`;
  else if (names.length) bar = `<button class="fin-btn" data-act="fin-open">${tr('fin.finalizeWeek')}</button>`;
  return `<h1 class="page-title">${tr('nav.salary')}</h1>${weekNav('sw', s)}
    <div class="tot-l">${tr('tot.sewerPay')}</div><div class="tot-v">${peso(grand)}</div>
    <div class="mini-grid">${names.map(n => miniCard('sewer', n, peso(total(n)), pcs(n).toLocaleString() + ' ' + tr('unit.pieces'), false)).join('')}</div>` +
    (names.length ? '' : '<p class="empty">' + tr('sal.noneWeek') + '</p>') + (bar ? `<div class="fin-bar">${bar}</div>` : '');
}
// The receipt: tap a sewer or supplier card to see everything for that week in a scrollable popup
function openReceipt(kind, n) {
  const ws = kind === 'sewer' ? swWeek : spWeek, a = ymd(ws), b = ymd(addDays(ws, 6));
  let rows, body, total, foot = '';
  if (kind === 'sewer') {
    rows = entries.filter(x => x.date >= a && x.date <= b && x.sewer === n);
    total = rows.reduce((t, x) => t + x.qty * x.pay, 0);
    const sup = group(rows, 'client');
    body = Object.keys(sup).sort().map(c => {
      const l = sup[c].sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
      return `<div class="grp"><div class="sup-head"><strong>${esc(c)}</strong><span>${peso(l.reduce((t, x) => t + x.qty * x.pay, 0))}</span></div><div class="kids">` +
        l.map(x => `<div class="slog"><div><div>${esc(x.item)}</div><div class="muted">${esc(x.color)}, ${esc(x.size)}, ${dayLabel(x.date)}</div></div>
          <div class="r"><strong>${peso(x.qty * x.pay)}</strong><div class="muted">${x.qty} ${tr('unit.pcs')} × ${peso(x.pay)}</div></div></div>`).join('') + '</div></div>';
    }).join('');
    foot = periods[a] ? `<button class="fin-btn" data-act="slip" data-n="${esc(n)}">${DLI}${tr('btn.dlSlip')}</button>`
      : '<p class="muted fin-note">' + tr('fin.notFinalSlip') + '</p>';
  } else {
    rows = entries.filter(x => x.date >= a && x.date <= b && x.client === n);
    total = rows.reduce((t, x) => t + cmp(x), 0);
    body = sewerTree(rows);
    foot = periods[a] ? `<button class="fin-btn" data-act="sup-slip" data-n="${esc(n)}">${DLI}${tr('btn.dlStmt')}</button>`
      : '<p class="muted fin-note">' + tr('fin.notFinalStmt') + '</p>';
  }
  const pieces = rows.reduce((t, x) => t + x.qty, 0);
  $('receipt-dlg').innerHTML = `<button class="onboarding-close" data-act="receipt-close" aria-label="${tr('aria.close')}">&times;</button>
    <div class="rc-head"><div class="rc-brand">Tally</div><div class="rc-name">${esc(n)}</div><div class="muted">${weekText(ws)} · ${pieces.toLocaleString()} ${tr('unit.pieces')}</div></div>
    <div class="rc-body">${body || '<p class="empty">' + tr('fin.nothingWeek') + '</p>'}</div>
    <div class="rc-foot"><div class="rc-total"><span>${kind === 'sewer' ? tr('fin.totalPay') : tr('fin.total')}</span><span>${peso(total)}</span></div>${foot}</div>`;
  $('receipt-dlg').showModal();
}
function openFinalizeSheet() {
  const s = swWeek, a = ymd(s), b = ymd(addDays(s, 6));
  const list = entries.filter(x => x.date >= a && x.date <= b && x.sewer), by = group(list, 'sewer');
  const names = Object.keys(by).sort(), tot = n => by[n].reduce((t, x) => t + x.qty * x.pay, 0);
  const missing = list.filter(e => !rates.some(x => rateKey(x.supplier, x.item, x.size) === rateKey(e.client, e.item, e.size))).length;
  $('fin-dlg').innerHTML = `<button class="onboarding-close" data-act="fin-close" aria-label="${tr('aria.close')}">&times;</button><div class="fin-grab"></div><h2>${tr('fin.finalizeTitle').replace('{week}', weekText(s))}</h2><p class="muted">${tr('fin.payPer')}</p>` +
    `<div class="fin-scroll">${names.map(n => `<div class="fin-row"><span>${esc(n)}</span><span>${peso(tot(n))}</span></div>`).join('')}</div>` +
    `<div class="fin-row fin-total"><span>${tr('fin.total')}</span><span>${peso(names.reduce((t, n) => t + tot(n), 0))}</span></div>` +
    (missing ? `<div class="fin-warn">${tr(missing === 1 ? 'fin.missing1' : 'fin.missingN').replace('{n}', missing)}</div>` : '') +
    `<p class="muted">${tr('fin.afterNote')}</p>
    <div class="fin-actions"><button class="btn" data-act="fin-close">${tr('common.cancel')}</button><button class="primary" data-act="fin-go">${tr('fin.finalize')}</button></div>`;
  $('fin-dlg').showModal();
}
function openReopenSheet() {
  $('fin-dlg').innerHTML = `<button class="onboarding-close" data-act="fin-close" aria-label="${tr('aria.close')}">&times;</button><div class="fin-grab"></div><h2>${tr('fin.reopenTitle').replace('{week}', weekText(swWeek))}</h2>
    <p class="muted">${tr('fin.reopenNote')}</p>
    <div class="fin-actions"><button class="btn" data-act="fin-close">${tr('common.cancel')}</button><button class="primary" data-act="reopen-go">${tr('fin.reopen')}</button></div>`;
  $('fin-dlg').showModal();
}
async function runSheet(act, label, fn) {
  const btn = $('fin-dlg').querySelector(`[data-act="${act}"]`);
  btn.disabled = true; btn.textContent = label;
  if (await fn(swWeek)) { $('fin-dlg').close(); render(); } else { btn.disabled = false; btn.textContent = label.replace('…', '').replace('Finalizing', 'Finalize').replace('Reopening', 'Reopen'); }
}

// ---- Payslip images ----
function statementSection(st, withHead) {
  const by = {};
  (st.lines || []).forEach(l => (by[l.supplier] = by[l.supplier] || []).push(l));
  return {head: withHead ? {name: st.sewer_name, total: peso(Number(st.total)), sub: Number(st.pieces).toLocaleString() + ' ' + tr('unit.pieces')} : null,
    groups: Object.keys(by).sort(textCmp).map(sup => ({s: sup, rows: by[sup].map(l => ({a: l.item,
      b: [l.color, l.size].filter(v => v && v !== 'Any').join(', ') + (l.color === 'Any' && l.size === 'Any' ? '' : ' · ') + Number(l.qty).toLocaleString() + ' × ' + peso(Number(l.pay)),
      c: peso(Number(l.qty) * Number(l.pay))}))}))};
}
async function drawSheet(o) {
  await Promise.all(['54px "Gochi Hand"', '700 20px "DM Sans"', '600 20px "DM Sans"', '400 20px "DM Sans"'].map(f => document.fonts.load(f)));
  const Wd = 720, P = 44, F = f => f + ' "DM Sans",sans-serif';
  let h = 300;
  o.sections.forEach((s, sectionIndex) => {
    if (s.head) h += 110 + (sectionIndex ? 44 : 0);
    s.groups.forEach((g, groupIndex) => { h += 56 + g.rows.length * 84 + (groupIndex ? 28 : 0); });
    h += 24;
  });
  h += 230;
  const c = document.createElement('canvas'); c.width = Wd; c.height = h;
  const x = c.getContext('2d');
  const fit = (t, w) => { while (t.length > 1 && x.measureText(t).width > w) t = t.slice(0, -2) + '…'; return t; };
  x.fillStyle = '#fff'; x.fillRect(0, 0, Wd, h);
  x.strokeStyle = '#111'; x.lineCap = 'round'; x.lineWidth = 6;
  [[10, 11, 10.9, 38], [19, 10, 18.3, 39.5], [28, 12.5, 28.8, 37], [37, 10, 36.8, 38.5], [2.5, 37, 45.5, 12]].forEach(l => {
    x.beginPath(); x.moveTo(P + l[0] * 1.6, P - 8 + l[1] * 1.6); x.lineTo(P + l[2] * 1.6, P - 8 + l[3] * 1.6); x.stroke();
  });
  x.fillStyle = '#111'; x.textBaseline = 'middle'; x.font = '54px "Gochi Hand",cursive';
  x.fillText('Tally', P + 96, P - 8 + 39.6 + 2); // vertically centred on the logo marks
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#6b6b6b'; x.font = F('600 22px'); x.fillText(o.title.toUpperCase(), P, 160);
  x.fillStyle = '#111'; x.font = F('700 54px'); x.fillText(fit(o.name, Wd - 2 * P), P, 222);
  x.fillStyle = '#6b6b6b'; x.font = F('400 26px'); x.fillText(o.sub, P, 266);
  let y = 300;
  o.sections.forEach((s, sectionIndex) => {
    if (s.head && sectionIndex) {
      y += 20;
      x.strokeStyle = '#111'; x.lineWidth = 3; x.setLineDash([]);
      x.beginPath(); x.moveTo(P, y); x.lineTo(Wd - P, y); x.stroke();
      y += 24;
    }
    if (s.head) {
      y += 44; x.fillStyle = '#111'; x.font = F('700 34px'); x.fillText(fit(s.head.name, 380), P, y);
      x.textAlign = 'right'; x.fillText(s.head.total, Wd - P, y); x.textAlign = 'left';
      y += 36; x.fillStyle = '#6b6b6b'; x.font = F('400 22px'); x.fillText(s.head.sub, P, y); y += 30;
    }
    s.groups.forEach((g, groupIndex) => {
      if (groupIndex) {
        y += 12;
        x.strokeStyle = '#b8b8b8'; x.lineWidth = 2; x.setLineDash([]);
        x.beginPath(); x.moveTo(P, y); x.lineTo(P + (Wd - 2 * P) * .52, y); x.stroke();
        y += 16;
      }
      y += 40; x.fillStyle = '#6b6b6b'; x.font = F('600 20px'); x.fillText(g.s.toUpperCase(), P, y); y += 16;
      g.rows.forEach(r => {
        y += 34; x.fillStyle = '#111'; x.font = F('600 28px'); x.fillText(fit(r.a, Wd - 2 * P - 190), P, y);
        x.textAlign = 'right'; x.fillText(r.c, Wd - P, y); x.textAlign = 'left';
        y += 34; x.fillStyle = '#6b6b6b'; x.font = F('400 22px'); x.fillText(fit(r.b, Wd - 2 * P), P, y); y += 16;
      });
    });
    if (s.head) { x.fillStyle = '#e6e6e6'; x.fillRect(P, y + 4, Wd - 2 * P, 2); }
    y += 24;
  });
  y += 30; x.fillStyle = '#111'; x.fillRect(P, y, Wd - 2 * P, 3); y += 60;
  x.font = F('600 30px'); x.fillText(o.totalLabel || tr('fin.totalPay'), P, y);
  x.textAlign = 'right'; x.font = F('700 46px'); x.fillText(o.total, Wd - P, y); x.textAlign = 'left';
  y += 70; x.fillStyle = '#6b6b6b'; x.font = F('400 22px'); x.fillText(o.foot, P, y);
  return c;
}
function saveCanvas(c, name) {
  c.toBlob(b => {
    const u = URL.createObjectURL(b), l = document.createElement('a');
    l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }, 'image/png');
}
const finDate = p => new Date(p.finalized_at).toLocaleDateString(loc(), {month:'short', day:'numeric', year:'numeric'});
async function downloadSlip(d) {
  const key = ymd(swWeek), p = periods[key];
  const st = p && (p.statements || []).find(x => d.self ? x.sewer_id === me.id : x.sewer_name === d.n);
  if (!st) { alert(tr('err.noSlip')); return; }
  const c = await drawSheet({title: tr('sheet.payslip'), name: st.sewer_name, sub: weekText(swWeek) + ', ' + addDays(swWeek, 6).getFullYear(),
    sections: [statementSection(st, false)], total: peso(Number(st.total)), foot: tr('sheet.finalizedOn') + finDate(p)});
  saveCanvas(c, `Tally-payslip-${st.sewer_name.replace(/\s+/g, '-')}-${key}.png`);
}
async function downloadSupplierSlip(d) {
  const key = ymd(spWeek), p = periods[key];
  if (!p) { alert(tr('err.noStmt')); return; }
  const a = key, b = ymd(addDays(spWeek, 6));
  const rows = entries.filter(x => x.date >= a && x.date <= b && x.client === d.n);
  if (!rows.length) { alert(tr('err.noSupRows')); return; }
  // One line per item/color/size/price, item first and bold like the sewer payslip. Sewer names and sewer pay stay out of it.
  const by = {};
  rows.forEach(e => {
    const k = [e.item, e.color, e.size, e.price].join('|').toLowerCase();
    const r = by[k] = by[k] || {item: e.item, color: e.color, size: e.size, price: e.price, qty: 0};
    r.qty += e.qty;
  });
  const groups = [{s: d.n, rows: Object.values(by).sort((x, y) => textCmp(x.item, y.item) || textCmp(x.color, y.color) || sizeRank(x.size) - sizeRank(y.size)).map(r => ({
    a: r.item,
    b: [r.color, r.size].filter(v => v && v !== 'Any').join(', ') + (r.color === 'Any' && r.size === 'Any' ? '' : ' · ') + r.qty.toLocaleString() + ' × ' + peso(r.price),
    c: peso(r.qty * r.price)}))}];
  const total = rows.reduce((t, x) => t + cmp(x), 0), pieces = rows.reduce((t, x) => t + x.qty, 0);
  const c = await drawSheet({title: tr('sheet.statement'), name: d.n, sub: weekText(spWeek) + ', ' + addDays(spWeek, 6).getFullYear() + ' · ' + pieces.toLocaleString() + ' ' + tr('unit.pieces'),
    sections: [{head: null, groups}], totalLabel: tr('fin.total'), total: peso(total), foot: tr('sheet.finalizedOn') + finDate(p)});
  saveCanvas(c, `Tally-statement-${d.n.replace(/\s+/g, '-')}-${key}.png`);
}
async function downloadSummary() {
  const key = ymd(swWeek), p = periods[key];
  if (!p) return;
  const sts = (p.statements || []).slice().sort((x, y) => textCmp(x.sewer_name, y.sewer_name));
  const c = await drawSheet({title: tr('sheet.weeklyReport'), name: (organization && organization.name) || tr('sheet.allSewers'), sub: weekText(swWeek) + ', ' + addDays(swWeek, 6).getFullYear(),
    sections: sts.map(st => statementSection(st, true)), totalLabel: tr('tot.sewerPay'), total: peso(sts.reduce((t, st) => t + Number(st.total), 0)), foot: tr('sheet.finalizedOn') + finDate(p)});
  saveCanvas(c, `Tally-salary-report-${key}.png`);
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
    return `<div class="grp sm"><div class="sup-head"><strong>${esc(n || tr('sal.noSewerName'))}</strong><span>${peso(total)}</span></div><div class="kids">` +
      l.map(r => `<div class="slog"><div><div>${esc(r.item)}</div><div class="muted">${esc(r.color)}, ${esc(r.size)}</div></div>
        <div class="r"><strong>${peso(r.qty * r.price)}</strong><div class="muted">${r.qty.toLocaleString()} × ${peso(r.price)}</div></div></div>`).join('') + '</div></div>';
  }).join('');
}
function suppliersView() {
  const a = ymd(spWeek), b = ymd(addDays(spWeek, 6));
  const by = group(entries.filter(x => x.date >= a && x.date <= b && x.client), 'client');
  const names = Object.keys(by).sort();
  const total = n => by[n].reduce((t, x) => t + cmp(x), 0), pcs = n => by[n].reduce((t, x) => t + x.qty, 0);
  const grand = names.reduce((t, n) => t + total(n), 0);
  return `<h1 class="page-title">${tr('nav.suppliers')}</h1>${weekNav('sp', spWeek)}
    <div class="tot-l">${tr('tot.fromSuppliers')}</div><div class="tot-v">${peso(grand)}</div>
    <div class="mini-grid">${names.map(n => miniCard('supplier', n, peso(total(n)), pcs(n).toLocaleString() + ' ' + tr('unit.pieces'), false)).join('')}</div>` +
    (names.length ? '' : '<p class="empty">' + tr('sup.none') + '</p>');
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
  const cards = (kind, label) => `<section class="setup-section"><div class="bar"><h2>${label}</h2><button class="btn" data-act="catalog-add" data-kind="${kind}">${tr('common.add')}</button></div>
    <div class="option-list">${catalogValues(kind).map(v => `<span class="option-chip">${esc(v)}</span>`).join('') || '<span class="muted">' + tr('setup.noValues') + '</span>'}</div></section>`;
  return `<h1 class="page-title">${tr('nav.setup')}</h1>
    <p class="muted">${tr('setup.manage')}</p>
    <section class="setup-section"><div class="bar"><h2>${tr('setup.needs')} <span class="tag">${missing.length}</span></h2></div>
      ${missing.length ? missing.map(c => `<div class="rate-card missing"><div><strong>${esc(c.supplier)}</strong><div class="muted">${esc(c.item)} · ${esc(c.size)}</div></div><button class="primary" data-act="rate-edit" data-supplier="${esc(c.supplier)}" data-item="${esc(c.item)}" data-size="${esc(c.size)}">${tr('setup.setRate')}</button></div>`).join('') : '<p class="empty">' + tr('setup.allSet') + '</p>'}
    </section>
    <section class="setup-section"><div class="bar"><h2>${tr('setup.priceTitle')}</h2><button class="btn" data-act="rate-add">${tr('setup.addRate')}</button></div>
      ${rateRows.length ? rateRows.map(r => `<div class="rate-card"><div><strong>${esc(r.supplier)}</strong><div class="muted">${esc(r.item)} · ${esc(r.size)}</div></div><div class="r"><strong>${peso(r.price)}</strong><div class="muted">${tr('rate.payShort')} ${peso(r.pay)}</div></div><button class="btn" data-act="rate-edit" data-supplier="${esc(r.supplier)}" data-item="${esc(r.item)}" data-size="${esc(r.size)}">${tr('common.edit')}</button></div>`).join('') : '<p class="empty">' + tr('setup.noRates') + '</p>'}
    </section>${cards('item', tr('setup.items'))}${cards('size', tr('setup.sizes'))}${cards('color', tr('setup.colors'))}${cards('supplier', tr('setup.suppliers'))}`;
}
let settingsFrom = 'log', settingsSection = 'general';
const SETTINGS_SECTIONS = ['general', 'profile', 'workspace', 'help'];
const ico = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SET_ICO = {
  settings: ico('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>'),
  general: ico('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  profile: ico('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>'),
  workspace: ico('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
  help: ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'),
  logout: ico('<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>'),
  invite: ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5"/><path d="M19 8v6M16 11h6"/>'),
  demo: ico('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
  play: ico('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor"/>'),
  practice: ico('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  tour: ico('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>')
};
const TALLY_MARK = '<svg viewBox="0 7 48 35" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" aria-hidden="true"><line x1="10" y1="11" x2="10.9" y2="38"/><line x1="19" y1="10" x2="18.3" y2="39.5"/><line x1="28" y1="12.5" x2="28.8" y2="37"/><line x1="37" y1="10" x2="36.8" y2="38.5"/><line x1="2.5" y1="37" x2="45.5" y2="12" stroke-width="3.2"/></svg>';
function settingsRow(label, hint, ctrl, stack) {
  return `<div class="set-row${stack ? ' stack' : ''}"><div class="set-text"><strong>${esc(label)}</strong>${hint ? `<span class="muted">${esc(hint)}</span>` : ''}</div><div class="set-ctrl">${ctrl}</div></div>`;
}
// A whole tappable row: icon badge, title, hint and a chevron (no separate button that repeats the title)
function settingsAction(icon, title, hint, act, tone) {
  return `<button class="set-action${tone ? ' ' + tone : ''}" data-act="${act}"><span class="act-ico">${SET_ICO[icon]}</span><span class="act-text"><strong>${esc(title)}</strong>${hint ? `<span class="muted">${esc(hint)}</span>` : ''}</span><span class="act-go" aria-hidden="true">›</span></button>`;
}
function settingsView() {
  const t = I18N.t, owner = isOwner();
  if (!SETTINGS_SECTIONS.includes(settingsSection)) settingsSection = 'general';
  const sec = settingsSection, role = owner ? t('role.owner') : t('role.sewer');
  const tile = (act, v, on, main, extra) => `<button class="set-tile${on ? ' on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${on}">${extra || ''}<span class="tile-main">${esc(main)}</span><span class="tile-check" aria-hidden="true">✓</span></button>`;
  let body = '';
  if (sec === 'general') {
    const lang = I18N.lang(), size = I18N.textSize();
    body = `<div class="set-group">
      ${settingsRow(t('settings.language'), t('set.lang.hint'), `<div class="set-tiles">${tile('set-lang', 'en', lang === 'en', 'English', '<span class="tile-badge">EN</span>')}${tile('set-lang', 'fil', lang === 'fil', 'Filipino', '<span class="tile-badge">FIL</span>')}</div>`, true)}
      ${settingsRow(t('settings.textSize'), t('set.size.hint'), `<div class="set-tiles">${tile('set-textsize', 'normal', size === 'normal', t('settings.size.normal'), '<span class="tile-aa">Aa</span>')}${tile('set-textsize', 'large', size === 'large', t('settings.size.large'), '<span class="tile-aa big">Aa</span>')}</div>`, true)}
    </div>`;
  } else if (sec === 'profile') {
    const initial = esc((me.name || '?').trim().charAt(0).toUpperCase());
    body = `<div class="set-card profile-card"><span class="avatar-lg">${initial}</span><div><strong class="pc-name">${esc(me.name || '')}</strong><span class="badge">${esc(role)}</span></div></div>
    ${demoMode ? '' : `<div class="set-group">${settingsRow(t('settings.name'), t('set.name.hint'), `<div class="settings-row"><input class="in" id="set-name" aria-label="${esc(t('settings.name'))}" maxlength="80" autocomplete="name" value="${esc(me.name || '')}"><button class="btn-accent" data-act="set-name">${SET_ICO.check}<span>${esc(t('settings.name.save'))}</span></button></div><p class="muted settings-status" id="set-name-status" role="status"></p>`, true)}</div>`}
    <div class="set-group">${demoMode
      ? settingsAction('workspace', t('menu.demoExit'), '', 'demo-exit')
      : settingsAction('logout', t('menu.logout'), t('set.logout.hint'), 'logout', 'danger')}</div>`;
  } else if (sec === 'workspace') {
    body = `<div class="set-card org-card"><span class="org-ico">${SET_ICO.workspace}</span><div class="org-text"><span class="muted set-kicker">${esc(t('settings.org'))}</span><strong class="org-name">${esc((organization && organization.name) || '')}</strong><span class="badge">${esc(role)}</span></div></div>
    ${owner && !demoMode ? `<div class="set-group">${settingsAction('invite', t('settings.invite'), t('set.invite.hint'), 'invite')}${settingsAction('demo', t('settings.demo'), t('set.demo.hint'), 'demo-data')}</div>` : ''}`;
  } else {
    body = `<div class="set-group">${settingsAction('play', t('settings.tutorial.replay'), t('set.tutorial.hint'), 'tutorial-start')}</div>
    <div class="set-card about-card"><span class="about-logo">${TALLY_MARK}</span><div><strong>Tally</strong><span class="muted">${esc(t('settings.about.text'))}</span></div></div>`;
  }
  return `<div class="set-page"><button class="btn settings-back" data-act="settings-back">← ${esc(t('common.back'))}</button>
    <div class="set-head"><span class="set-head-ico">${SET_ICO[sec]}</span><div><p class="set-kicker muted">${esc(t('settings.title'))}</p><h1 class="page-title set-title">${esc(t('set.nav.' + sec))}</h1><p class="muted set-sub">${esc(t('set.sub.' + sec))}</p></div></div>
    ${body}</div>`;
}
// While Settings is open the sidebar (bottom bar on phones) lists the Settings sections, and the Tally logo is the exit.
function renderSettingsNav() {
  const app = document.querySelector('.app'), nav = document.querySelector('nav');
  if (!app || !nav) return;
  const on = view === 'settings';
  app.classList.toggle('settings-mode', on);
  const brand = nav.querySelector('.brand');
  if (brand) { ['role', 'tabindex', 'aria-label'].forEach(a => brand.removeAttribute(a)); delete brand.dataset.back; }
  let g = nav.querySelector('.settings-nav');
  if (!g) { g = document.createElement('div'); g.className = 'settings-nav'; nav.appendChild(g); }
  if (!on) { g.innerHTML = ''; return; }
  g.innerHTML = SETTINGS_SECTIONS.map(k => `<button data-act="settings-section" data-v="${k}"${settingsSection === k ? ' aria-current="page"' : ''}>${SET_ICO[k]}<span>${esc(tr('set.nav.' + k))}</span></button>`).join('')
    + (demoMode ? '' : `<button class="settings-logout" data-act="logout">${SET_ICO.logout}<span>${esc(tr('menu.logout'))}</span></button>`);
}
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('nav .brand[role="button"]')) { e.preventDefault(); e.target.click(); }
});
async function saveSettingsName() {
  const t = I18N.t, input = $('set-name'), status = $('set-name-status');
  if (!input || !status) return;
  const name = input.value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) { input.classList.add('invalid'); status.textContent = t('settings.name.short'); return; }
  input.classList.remove('invalid');
  if (name !== me.name) {
    if (cloud) {
      const r = await sb.from('profiles').update({name}).eq('id', me.id).select('id');
      if (r.error || !r.data || !r.data.length) {
        const f = await sb.rpc('set_profile_name', {new_name: name});
        if (f.error) { status.textContent = t('settings.name.fail') + f.error.message; return; }
      }
    }
    me.name = name;
    if (profileNames && profileNames.set) profileNames.set(me.id, name);
    if (Array.isArray(people)) people.forEach(x => { if (x.id === me.id) x.name = name; });
    renderTopbar();
  }
  status.textContent = t('settings.name.saved');
}
const views = {settings: settingsView, log: logView, sewers: sewersView, suppliers: suppliersView, finance: financeView, setup: setupView, 'my-log': myLogView, 'my-finance': myFinanceView, 'my-salary': mySalaryView};
function renderTopbar() {
  const topbar = $('topbar');
  if (!me) { topbar.hidden = true; topbar.innerHTML = ''; return; }
  topbar.hidden = false;
  const t = I18N.t;
  const realtimeLive = realtimeState === 'SUBSCRIBED';
  topbar.innerHTML = `<span class="live-status ${demoMode ? 'demo-status' : (realtimeLive ? 'live' : '')}" role="status" title="${demoMode ? tr('status.demo') : (realtimeLive ? tr('status.live') : tr('status.reconnecting'))}">
      <span class="live-dot" aria-hidden="true"></span><span class="live-label">${demoMode ? 'Demo' : (cloud ? (realtimeLive ? 'Live' : 'Syncing') : 'Local')}</span>
    </span><details class="profile-menu">
    <summary><span class="avatar">${esc(me.name[0].toUpperCase())}</span><span class="profile-name">${esc(me.name)}</span></summary>
    <div class="profile-popover">
      <strong>${esc(me.name)} <span class="muted">· ${isOwner() ? t('role.owner') : t('role.sewer')}</span></strong>
      <button class="menu-btn" data-act="settings"><span class="menu-ico">${SET_ICO.settings}</span><span>${esc(t('menu.settings'))}</span></button>
      ${demoMode ? `<button class="menu-btn" data-act="demo-exit"><span class="menu-ico">${SET_ICO.demo}</span><span>${esc(t('menu.demoExit'))}</span></button>` : `<button class="menu-btn" data-act="logout"><span class="menu-ico">${SET_ICO.logout}</span><span>${esc(t('menu.logout'))}</span></button>`}
    </div>
  </details>`;
}
function tryDemoData() {
  if (demoMode) return;
  demoBackup = {me, organization, entries, people, periods, rates, catalog, view, profileNames: new Map(profileNames)};
  const owner = {id: 'demo-owner', name: 'Demo Owner', role: 'owner', active: true};
  const sewers = [
    {id: 'demo-sewer-1', name: 'Unot', role: 'sewer', active: true},
    {id: 'demo-sewer-2', name: 'Lawrence', role: 'sewer', active: true},
    {id: 'demo-sewer-3', name: 'Tarik', role: 'sewer', active: true},
    {id: 'demo-sewer-4', name: 'Princess', role: 'sewer', active: true},
    {id: 'demo-sewer-5', name: 'Ana', role: 'sewer', active: true}
  ];
  demoMode = true;
  me = owner;
  people = [owner, ...sewers];
  organization = {id: 'demo-organization', name: 'Tally Demo Workspace'};
  periods = {};
  profileNames.clear();
  people.forEach(person => profileNames.set(person.id, person.name));
  const suppliers = ['Marvin', 'Jenny', 'Ronald', 'John', 'Grace'];
  const items = ['Dress', 'Blouse', 'Pants', 'Skirt', 'Uniform', 'Curtains', 'Pillowcase'];
  const colors = ['Black', 'Navy', 'Cream', 'Sage', 'Rose', 'Denim', 'Mustard'];
  const sizes = ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL'];
  const demo = [];
  const start = weekStart(addDays(new Date(), -84));
  for (let i = 0; i < 180; i++) {
    const day = addDays(start, (i * 11) % 91);
    const supplier = suppliers[i % suppliers.length];
    const item = items[(i * 3) % items.length];
    const sewer = sewers[(i + Math.floor(i / sewers.length)) % sewers.length]; // shifts each round so every supplier works with several sewers
    demo.push({
      id: `demo-${i}`, demo: true, date: ymd(day), item,
      color: colors[(i * 5) % colors.length], size: sizes[(i * 7) % sizes.length],
      client: supplier, qty: 2 + ((i * 17) % 29),
      price: 85 + ((i * 23) % 116), pay: 18 + ((i * 7) % 28),
      sewer: sewer.name, sewer_id: sewer.id, created_by: owner.id
    });
  }
  entries = demo;
  rates = [];
  catalog = {item: [], color: [], size: [], supplier: []};
  demo.forEach(e => {
    const key = rateKey(e.client, e.item, e.size);
    if (!rates.some(rate => rateKey(rate.supplier, rate.item, rate.size) === key)) {
      rates.push({supplier: e.client, item: e.item, size: e.size, price: e.price, pay: e.pay});
    }
    [['item', e.item], ['color', e.color], ['size', e.size], ['supplier', e.client]].forEach(([kind, value]) => {
      if (!catalog[kind].includes(value)) catalog[kind].push(value);
    });
  });
  logWeek = weekStart(new Date()); swWeek = weekStart(new Date()); spWeek = weekStart(new Date());
  render();
}
function exitDemoData() {
  if (!demoMode || !demoBackup) return;
  ({me, organization, entries, people, periods, rates, catalog, view} = demoBackup);
  profileNames.clear();
  demoBackup.profileNames.forEach((name, id) => profileNames.set(id, name));
  demoBackup = null;
  demoMode = false;
  render();
}
function loaderHTML(label, small) {
  return `<div class="tl${small ? ' sm' : ''}" aria-hidden="true">
    <svg viewBox="0 7 48 35">
      <line class="tl-l m0" x1="10" y1="11" x2="10.9" y2="38" pathLength="1"/>
      <line class="tl-l m1" x1="19" y1="10" x2="18.3" y2="39.5" pathLength="1"/>
      <line class="tl-l m2" x1="28" y1="12.5" x2="28.8" y2="37" pathLength="1"/>
      <line class="tl-l m3" x1="37" y1="10" x2="36.8" y2="38.5" pathLength="1"/>
      <line class="tl-l sl" x1="2.5" y1="37" x2="45.5" y2="12" pathLength="1"/>
    </svg>
    <span class="tl-word${label.length > 8 ? ' long' : ''}">${esc(label)}</span>
  </div>`;
}
let busyText = '';
function showBusy(text) {
  const b = $('busy');
  if (busyText !== (text || '') || !b.firstChild) { // same loader already drawn: keep it, so the animation doesn't restart
    b.innerHTML = loaderHTML(text || 'Tally');
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
  I18N.apply();
  if (isOwner() && ['my-log', 'my-finance', 'my-salary'].includes(view)) view = 'log';
  if (isSewer() && !['my-log', 'my-finance', 'my-salary', 'settings'].includes(view)) view = 'my-log';
  const nextView = view;
  document.getElementById('main').innerHTML = views[nextView]();
  renderTopbar();
  document.querySelectorAll('nav [data-view]').forEach(b => {
    const ownerOnly = ['log', 'sewers', 'suppliers', 'finance', 'setup'].includes(b.dataset.view);
    const sewerOnly = ['my-log', 'my-finance', 'my-salary'].includes(b.dataset.view);
    b.hidden = (ownerOnly && !isOwner()) || (sewerOnly && !isSewer());
    if (b.dataset.view === nextView) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const shortOwnerNav = isOwner() && I18N.lang() === 'fil' && window.matchMedia('(max-width: 700px)').matches;
  document.querySelectorAll('nav [data-nav-en]').forEach(b => {
    if (shortOwnerNav) b.textContent = b.dataset.navEn;
    else b.textContent = tr(b.dataset.i18n);
  });
  renderSettingsNav();
  if (window.TUTORIAL) TUTORIAL.event('render', {view: nextView, section: settingsSection, lang: I18N.lang(), size: I18N.textSize()}); // TUTORIAL
}
const $ = id => document.getElementById(id);
showBusy('');
const WIZARD_STEPS = [
  {key: 'client', get label() { return tr('wiz.client'); }, kind: 'supplier'},
  {key: 'item', get label() { return tr('wiz.item'); }, kind: 'item'},
  {key: 'color', get label() { return tr('wiz.color'); }, kind: 'color'},
  {key: 'size', get label() { return tr('wiz.size'); }, kind: 'size'},
  {key: 'qty', get label() { return tr('wiz.qtyQ'); }, kind: 'quantity'}
];
function wizardOptions(kind) {
  if (wizard.practice && window.TUTORIAL && TUTORIAL.quickEntry()) {
    const quickValues = TUTORIAL.quickEntryValues(kind);
    return quickValues.length ? quickValues : catalogValues(kind);
  }
  return catalogValues(kind);
}
function openDialog(practice) {
  if (practice === undefined) practice = !!(window.TUTORIAL && TUTORIAL.interceptAdd()); // TUTORIAL
  wizard = {step: 0, values: {}, date: ymd(new Date()), other: false, practice: !!practice};
  $('err').textContent = '';
  renderWizard();
  $('dlg').showModal();
}
function renderWizard() {
  const s = WIZARD_STEPS[wizard.step], values = wizardOptions(s.kind);
  const selected = wizard.values[s.key];
  const cards = values.map(v => `<button class="choice-card ${selected === v ? 'selected' : ''}" data-act="wizard-choice" data-key="${s.key}" data-value="${esc(v)}">${esc(v)}</button>`).join('');
  const other = `<button class="choice-card other ${wizard.other ? 'selected' : ''}" data-act="wizard-other" data-key="${s.key}"><span class="other-icon">＋</span>${tr('wiz.other')}</button>`;
  const custom = wizard.other ? `<input class="in wizard-other-input" id="wizard-other-input" placeholder="${tr('wiz.new_' + s.key)}" value="${esc(selected || '')}" autofocus>` : '';
  const qty = s.kind === 'quantity' ? `<input class="in wizard-quantity" id="wizard-quantity" type="number" min="1" inputmode="numeric" placeholder="${tr('wiz.qty')}" value="${esc(selected || '')}" autofocus>` : '';
  $('wizard').innerHTML = `<button type="button" class="wizard-close" data-act="close-wizard" aria-label="${tr('wiz.close')}">&times;</button>
    <div class="wizard-progress"><span>${tr('wiz.step').replace('{n}', wizard.step + 1).replace('{total}', WIZARD_STEPS.length)}</span><span>${wizard.date === ymd(new Date()) ? tr('wiz.today') : wizard.date}</span></div>
    ${wizard.practice ? `<p class="practice-note">${tr('tut.practiceNote')}</p>` : ''}<h2 class="wizard-title">${s.label}</h2><div class="choice-grid">${s.kind === 'quantity' ? qty : cards + other}</div>
    ${custom}<button class="textbtn date-toggle" data-act="wizard-date">${tr('wiz.usingToday')}</button>`;
  $('dlg').querySelector('[data-act="wizard-back"]').hidden = wizard.step === 0;
  const next = $('dlg').querySelector('[data-act="wizard-next"]');
  next.textContent = wizard.step === WIZARD_STEPS.length - 1 ? tr('wiz.save') : tr('common.continue');
  next.hidden = s.kind !== 'quantity' && !wizard.other;
  if (window.TUTORIAL) TUTORIAL.event('wizard', {step: wizard.step, other: wizard.other, values: wizard.values}); // TUTORIAL
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
    $('err').textContent = s.kind === 'quantity' ? tr('wiz.errQty') : tr('wiz.errChoose');
    return;
  }
  wizard.values[s.key] = s.kind === 'quantity' ? Number(value) : value;
  wizard.other = false;
  if (wizard.step < WIZARD_STEPS.length - 1) { wizard.step++; renderWizard(); return; }
  if (wizard.practice) { $('dlg').close(); if (window.TUTORIAL) TUTORIAL.event('practice-done'); return; } // TUTORIAL: practice never saves
  saveEntry();
}
function wizardBack() {
  if (wizard.step > 0) { wizard.step--; wizard.other = false; renderWizard(); }
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
      client: v.client || 'Unknown', sewer: demoMode ? me.name : (remote() ? me.name : ''), qty: Number(v.qty)};
    const r = currentRate(e);
    e.price = r.price; e.pay = r.pay;
    if (isLocked(e.date)) { $('err').textContent = tr('err.weekFinal'); return; }

    if (!remote()) {
      e.id = Date.now(); entries.push(e);
      [['item', e.item], ['color', e.color], ['size', e.size], ['supplier', e.client]].forEach(([kind, value]) => {
        if (!catalog[kind].includes(value)) catalog[kind].push(value);
      });
      if (!demoMode) { saveEntries(); saveLocalSetup(); }
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
      alert(tr('err.saveEntry') + error.message);
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
    const date = prompt(tr('wiz.datePrompt'), wizard.date);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { wizard.date = date; renderWizard(); }
    return;
  }
  else if (d.act === 'save') { saveEntry(); return; }
  else if (d.act === 'rate-add') { addRateFlow(); return; }
  else if (d.act === 'rate-edit') { openRateDialog(d.supplier, d.item, d.size); return; }
  else if (d.act === 'rate-cancel') { $('rate-dlg').close(); return; }
  else if (d.act === 'fin-open') { openFinalizeSheet(); return; }
  else if (d.act === 'reopen-open') { openReopenSheet(); return; }
  else if (d.act === 'fin-close') { $('fin-dlg').close(); return; }
  else if (d.act === 'fin-go') { runSheet('fin-go', 'Finalizing…', finalizeWeek); return; }
  else if (d.act === 'reopen-go') { runSheet('reopen-go', 'Reopening…', reopenWeek); return; }
  else if (d.act === 'slip') { downloadSlip(d); return; }
  else if (d.act === 'sup-slip') { downloadSupplierSlip(d); return; }
  else if (d.act === 'sum') { downloadSummary(); return; }
  else if (d.act === 'rate-save') { saveRate(); return; }
  else if (d.act === 'catalog-add') { addCatalogValue(d.kind); return; }
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
  else if (d.act === 'name-submit') { saveName(); return; }
  else if (d.act === 'onboarding-exit') { exitOnboarding(); return; }
  else if (d.act === 'onboarding-close') { hideOnboarding(); return; }
  else if (d.act === 'invite') { createInvite(); return; }
  else if (d.act === 'demo-data') { tryDemoData(); return; }
  else if (d.act === 'demo-exit') { exitDemoData(); return; }
  else if (d.act === 'auth-mode') { setAuthMode(authMode === 'login' ? 'signup' : 'login'); return; }
  else if (d.act === 'logout') { logout(); return; }
  else if (d.act === 'settings-back') { view = settingsFrom || 'log'; sel = null; swSel = null; spSel = null; pendingDel = null; }
  else if (d.act === 'settings-section') { settingsSection = d.v; }
  else if (d.act === 'brand') { if (view !== 'settings') return; view = settingsFrom || 'log'; sel = null; swSel = null; spSel = null; pendingDel = null; }
  else if (d.act === 'settings') { if (view !== 'settings') settingsFrom = view; view = 'settings'; settingsSection = 'general'; sel = null; swSel = null; spSel = null; pendingDel = null; }
  else if (d.act === 'set-lang') { I18N.setLang(d.v); }
  else if (d.act === 'set-textsize') { I18N.setTextSize(d.v); }
  else if (d.act === 'set-name') { saveSettingsName(); return; }
  else if (d.act === 'tutorial-start') { if (window.TUTORIAL) TUTORIAL.start('main'); return; } // TUTORIAL
  else if (d.act === 'week' || d.act === 'day') {
    const t = d.act, same = sel && sel.t === t && sel.d === d.d;
    sel = same ? null : {t, d: d.d};
  }
  else if (d.act === 'lw') logWeek = addDays(logWeek, 7 * Number(d.d));
  else if (d.act === 'sw') swWeek = addDays(swWeek, 7 * Number(d.d));
  else if (d.act === 'sewer') { openReceipt('sewer', d.n); return; }
  else if (d.act === 'receipt-close') { $('receipt-dlg').close(); return; }
  else if (d.act === 'supplier') { openReceipt('supplier', d.n); return; }
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
  } else if (ev.target.id === 'profile-name-in') {
    ev.preventDefault();
    saveName();
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
  const supplier = prompt(tr('prompt.supplier'));
  if (!supplier || !supplier.trim()) return;
  const item = prompt(tr('prompt.item'));
  if (!item || !item.trim()) return;
  const size = prompt(tr('prompt.size'));
  if (!size || !size.trim()) return;
  openRateDialog(supplier.trim(), item.trim(), size.trim());
}
async function saveRate() {
  const price = Number($('r-price').value), pay = Number($('r-pay').value);
  if (!editingRate || !(price >= 0) || !(pay >= 0) || $('r-price').value === '' || $('r-pay').value === '') {
    $('rate-err').textContent = tr('rate.errBoth'); return;
  }
  const r = {...editingRate, price, pay};
  const existing = rates.findIndex(x => rateKey(x.supplier, x.item, x.size) === rateKey(r.supplier, r.item, r.size));
  const previousRate = existing >= 0 ? {...rates[existing]} : null;
  if (existing >= 0) rates[existing] = {...rates[existing], ...r}; else rates.push(r);
  const start = ymd(weekStart(new Date()));
  const inCurrentWeek = e => e.date >= start && e.date <= ymd(addDays(parse(start), 6)) &&
    rateKey(e.client, e.item, e.size) === rateKey(r.supplier, r.item, r.size);
  const affected = entries.filter(e => inCurrentWeek(e) && !isLocked(e.date));
  const previousEntries = affected.map(e => ({e, price:e.price, pay:e.pay}));
  affected.forEach(e => { e.price = price; e.pay = pay; });
  if (remote()) {
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
  } else if (!demoMode) { saveEntries(); saveLocalSetup(); }
  $('rate-dlg').close(); render();
}
async function addCatalogValue(kind) {
  const label = kind === 'supplier' ? 'supplier' : kind;
  const value = prompt(`Add a new ${label}:`);
  if (!value || !value.trim()) return;
  const clean = value.trim();
  if (!catalog[kind].some(v => v.toLowerCase() === clean.toLowerCase())) catalog[kind].push(clean);
  if (remote()) {
    const {error} = await sb.from('tally_catalog_values').insert({organization_id:organization.id, kind, value:clean, created_by:me.id});
    if (error && error.code !== '23505') { alert(tr('err.addOption') + error.message); return; }
  } else if (!demoMode) saveLocalSetup();
  render();
}
// ---- Cloud (Supabase) ----
const canDelete = () => isOwner();
let authMode = 'login';
let nameConfirmedFor = null;
function showOnboarding() {
  hideLoading();
  $('onboarding').hidden = false;
  $('onboarding-status').textContent = '';
  if (nameConfirmedFor === me.id) showOnboardingChoices(); else showNameStep();
}
// First step for every new account: confirm the name teammates will see (Google names are not always real names)
function showNameStep() {
  $('onboarding-title').textContent = tr('onb.nameQ');
  document.querySelector('.onboarding-panel').classList.add('name-mode');
  $('onboarding-content').innerHTML = `<div class="onboarding-form">
    <input class="in" id="profile-name-in" aria-label="${tr('auth.name')}" placeholder="${tr('onb.nameLabel')}" autocomplete="name" maxlength="80" value="${esc(me.name || '')}">
    <button class="primary" data-act="name-submit">${tr('common.continue')}</button>
  </div>`;
  $('profile-name-in').focus();
}
async function saveName() {
  const input = $('profile-name-in'), name = input.value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) { input.classList.add('invalid'); $('onboarding-status').textContent = tr('settings.name.short'); return; }
  input.classList.remove('invalid');
  $('onboarding-status').textContent = '';
  if (name !== me.name) {
    let ok = false;
    const r = await sb.from('profiles').update({name}).eq('id', me.id).select('id');
    if (!r.error && r.data && r.data.length) ok = true;
    else {
      const f = await sb.rpc('set_profile_name', {new_name: name});
      if (!f.error) ok = true; else $('onboarding-status').textContent = tr('settings.name.fail') + f.error.message;
    }
    if (!ok) return;
    me.name = name;
  }
  nameConfirmedFor = me.id;
  showOnboardingChoices();
}
function showOnboardingChoices() {
  $('onboarding-title').textContent = tr('onb.title');
  document.querySelector('.onboarding-panel').classList.remove('name-mode');
  $('onboarding-content').innerHTML = `<div class="onboarding-actions">
    <button class="onboarding-card create-card" data-act="create-org"><span class="onboarding-icon">＋</span><span><strong>${tr('onb.create')}</strong></span><span class="onboarding-arrow">→</span></button>
    <button class="onboarding-card join-card" data-act="join-org"><span class="onboarding-icon">⌁</span><span><strong>${tr('onb.join')}</strong></span><span class="onboarding-arrow">→</span></button>
  </div>`;
  if (pendingInvite) showJoinOrganization();
}
function hideOnboarding() {
  $('onboarding').hidden = true;
  const panel = document.querySelector('.onboarding-panel');
  const x = panel.querySelector('.onboarding-close');
  panel.classList.remove('invite-mode', 'name-mode');
  x.dataset.act = 'onboarding-exit';
  x.setAttribute('aria-label', tr('onb.exit'));
  $('onboarding-title').textContent = tr('onb.title');
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
    <label class="required" for="organization-name">${tr('onb.orgName')}</label>
    <input class="in" id="organization-name" placeholder="${tr('onb.orgPh')}" maxlength="120" autofocus>
    <button class="primary" data-act="create-submit">${tr('onb.createBtn')}</button>
    <button class="textbtn" data-act="onboarding-back">${tr('common.back')}</button>
  </div>`;
}
async function createOrganization() {
  const name = $('organization-name').value.trim();
  if (!name) {
    $('organization-name').classList.add('invalid');
    $('onboarding-status').textContent = tr('onb.errName');
    return;
  }
  $('onboarding-status').textContent = '';
  showBusy(tr('onb.creating'));
  const {data, error} = await sb.rpc('create_organization', {organization_name: name.trim()});
  if (error) { hideBusy(); $('onboarding-status').textContent = error.message; return; }
  organization = data;
  await enter();
}
function showJoinOrganization() {
  $('onboarding-content').innerHTML = `<div class="onboarding-form">
    <label class="required" for="join-token">${tr('onb.codeLabel')}</label>
    <input class="in invite-code-input" id="join-token" inputmode="numeric" maxlength="7" placeholder="000-000" value="${esc(pendingInvite)}">
    <button class="primary" data-act="join-submit">${tr('onb.joinBtn')}</button>
    <button class="btn" data-act="scan-invite">${tr('onb.scan')}</button>
    <button class="textbtn" data-act="onboarding-back">${tr('common.back')}</button>
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
  scanTimer = setTimeout(() => { closeScanner(); joinOrganization(); }, 1900);
}
function scanInvite() {
  if (typeof Html5Qrcode !== 'function') {
    $('onboarding-status').textContent = tr('onb.qrNo');
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
        $('scan-status').textContent = tr('onb.qrBad');
        return;
      }
      $('join-token').value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      scanSuccess();
    },
    () => {}
  ).catch(error => {
    closeScanner();
    $('onboarding-status').textContent = tr('onb.camera');
    console.error('Could not start QR scanner:', error);
  });
}
let joinCooldownTimer = null;
function startJoinCooldown(seconds) {
  clearInterval(joinCooldownTimer);
  const btn = document.querySelector('[data-act="join-submit"]');
  const status = $('onboarding-status');
  let left = Math.ceil(seconds);
  const tick = () => {
    if (left <= 0) {
      clearInterval(joinCooldownTimer);
      if (btn) btn.disabled = false;
      status.textContent = '';
      return;
    }
    const m = Math.floor(left / 60), s = String(left % 60).padStart(2, '0');
    status.textContent = `Too many wrong codes. Try again in ${m}:${s}.`;
    if (btn) btn.disabled = true;
    left--;
  };
  tick();
  joinCooldownTimer = setInterval(tick, 1000);
}

async function joinOrganization() {
  const input = $('join-token'), status = $('onboarding-status');
  const token = input.value.replace(/\D/g, '');
  input.classList.remove('invalid');
  if (!/^\d{6}$/.test(token)) {
    input.classList.add('invalid');
    status.textContent = tr('onb.sixDigits');
    return;
  }
  status.textContent = '';
  showBusy(tr('onb.joining'));
  const {data, error} = await sb.rpc('accept_organization_invite', {raw_token: token});
  if (error) { hideBusy(); status.textContent = error.message; return; }
  if (!data || !data.ok) {
    hideBusy();
    if (data && data.reason === 'locked') { startJoinCooldown(data.retry_after); return; }
    input.classList.add('invalid');
    input.focus();
    if (data && data.retry_after) startJoinCooldown(data.retry_after);
    else status.textContent = `That code is invalid or expired. ${data ? data.attempts_left : 0} tries left before a cooldown.`;
    return;
  }
  organization = data.organization;
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
  $('onboarding-title').textContent = tr('inv.title');
  $('onboarding-status').textContent = '';
  $('onboarding-content').innerHTML = '<div class="invite-code-display"><span>' + tr('inv.code') + '</span><div class="invite-qr invite-wait">' + loaderHTML('Tally', true) + '</div><strong>···</strong></div>';
  $('onboarding').hidden = false;
}
function showInvite(token, expiresAt) {
  const displayCode = `${token.slice(0, 3)}-${token.slice(3)}`;
  const until = new Date(expiresAt).toLocaleString([], {weekday: 'short', hour: 'numeric', minute: '2-digit'});
  navigator.clipboard && navigator.clipboard.writeText(displayCode).catch(() => {});
  $('onboarding-content').innerHTML = `<div class="invite-code-display"><span>${tr('inv.code')}</span><div class="invite-qr" id="invite-qr"></div><strong>${esc(displayCode)}</strong><small>Scan this QR code or share the six-digit code. Valid until ${until}.</small></div>`;
  if (typeof QRCode === 'function') {
    new QRCode($('invite-qr'), {text: token, width: 180, height: 180});
  }
}
async function createInvite() {
  if (!organization || !organization.id) {
    $('onboarding-status').textContent = tr('err.orgNotLoaded');
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
      alert(tr('err.invite') + (error ? error.message : 'Supabase returned no invite token.'));
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
  $('a-title').textContent = m === 'signup' ? tr('auth.createTitle') : tr('auth.welcome');
  $('a-go').textContent = m === 'signup' ? tr('auth.signup') : tr('auth.login');
  $('a-switch').innerHTML = m === 'signup' ? tr('auth.switchToLogin') : tr('auth.switchToSignup');
  $('a-sub').textContent = m === 'signup' ? tr('auth.createTitle') : tr('auth.loginSub');
  $('a-err').textContent = '';
}
function confirmationRedirectUrl() {
  return window.location.origin + window.location.pathname;
}
function showConfirmation(email) {
  const panel = document.querySelector('.confirm-panel');
  panel.classList.remove('loading');
  $('confirm-icon').textContent = '✉';
  $('confirm-title').textContent = tr('auth.checkEmail');
  $('confirm-message').innerHTML = tr('auth.confirmMsg');
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
  $('confirm-icon').innerHTML = loaderHTML('Tally', true);
  $('confirm-title').textContent = tr('auth.creating');
  $('confirm-message').textContent = tr('auth.settingUp').replace('{email}', email);
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
  entries = [];
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
  $('confirm-status').textContent = error ? error.message : tr('auth.resent');
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
  if (error) { alert(tr('err.loadEntries') + error.message); return; }
  profileNames.clear();
  data.forEach(r => {
    if (r.sewer_id && r.profiles && r.profiles.name) profileNames.set(r.sewer_id, r.profiles.name);
  });
  entries = data.map(entryFromRow);
  const [rateRes, catalogRes] = await Promise.all([
    sb.from('tally_rates').select('supplier, item, size, price, pay').eq('organization_id', organization.id),
    sb.from('tally_catalog_values').select('kind, value').eq('organization_id', organization.id).order('value')
  ]);
  if (rateRes.error) { alert(tr('err.loadRates') + rateRes.error.message); return; }
  if (catalogRes.error) { alert(tr('err.loadCatalog') + catalogRes.error.message); return; }
  rates = rateRes.data || [];
  catalog = {item: [], color: [], size: [], supplier: []};
  (catalogRes.data || []).forEach(x => { if (catalog[x.kind]) catalog[x.kind].push(x.value); });
  enrichEntries();
  await loadPeriods();
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
  if (demoMode) return;
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
  if (demoMode) return;
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
    .on('postgres_changes', {event: '*', schema: 'public', table: 'salary_periods'}, async () => { if (!demoMode) { await loadPeriods(); render(); } })
    .subscribe(status => {
      realtimeState = status;
      renderTopbar();
      if (!demoMode && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) refresh();
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
    showAuth(tr('err.session'));
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
    showAuth(tr('err.orgLoad'));
    return;
  }
  if (!org.id) {
    showAuth(tr('err.orgIncomplete'));
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
  if (window.TUTORIAL) TUTORIAL.autoStart({id: me.id, role: me.role, demo: demoMode}); // TUTORIAL
}
async function authGo() {
  const email = $('a-email').value.trim(), password = $('a-pass').value;
  const authFields = ['a-email', 'a-pass'];
  if (!validateRequired(authFields)) return;
  if (!email || password.length < 6) {
    if (password.length < 6) $('a-pass').classList.add('invalid');
    $('a-err').textContent = authMode === 'signup' ? tr('auth.errSignup') : tr('auth.errLogin'); return;
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
      ? await sb.auth.signUp({email, password, options: {emailRedirectTo: confirmationRedirectUrl()}})
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
    showAuth(tr('err.connect'));
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
  if (demoMode) { exitDemoData(); return; }
  if (!cloud) {
    me = null; entries = []; people = []; profileNames.clear(); organization = null;
    showAuth(); renderTopbar(); return;
  }
  await unsubscribeRealtime();
  await sb.auth.signOut();
  me = null; entries = []; people = []; profileNames.clear(); organization = null;
  setAuthMode('login'); showAuth(); renderTopbar();
}
async function removeEntry(id) {
  if (String(id).startsWith('tmp-')) return; // still saving, nothing to delete yet
  const removed = entries.find(e => e.id == id);
  if (!removed) return;
  if (isLocked(removed.date)) { alert(tr('err.deleteLocked')); return; }

  entries = entries.filter(e => e.id != id);
  pendingDel = null;
  render();

  if (!remote()) { if (!demoMode) saveEntries(); return; }

  const {data, error} = await sb.from('entries').delete().eq('id', id).select();
  if (error || !data || data.length === 0) {
    alert(error
      ? tr('err.delEntry') + error.message
      : tr('err.delPerm'));
    await refresh(); // resync with the real data instead of guessing
    render();
  }
}
async function boot() {
  if (authTest) { showAuth(); return; }
  if (!cloud) { me = {id: 'local-user', name: 'Local owner', role: 'owner'}; organization = {id: 'local-org', name: 'Local workspace'}; entries = loadEntries(); deriveLocalRates(); hideLoading(); render(); if (window.TUTORIAL) TUTORIAL.autoStart({id: me.id, role: me.role, demo: demoMode}); return; } // TUTORIAL
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
      await withTimeout(enter(), 12000, tr('err.workspaceLate'));
    } else {
      showAuth();
    }
  } catch (error) {
    console.error('Tally startup failed:', error);
    showAuth(error.message || tr('err.startup'));
  }
}
initMeshBackground();
I18N.ready.then(boot);