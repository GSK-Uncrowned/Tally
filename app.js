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
const DEMO_V = 2; // bump this when DEMO changes so old demo entries refresh
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

// ---- State ----
// Cloud mode turns on once config.js has real Supabase values; otherwise the app runs locally with demo data
const cloud = typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR');
const sb = cloud ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let entries = [], me = null, people = [], demoMode = false;
let view = 'log', sel = null, month = new Date(), pendingDel = null, swWeek = weekStart(new Date()), swSel = null, spSel = null, logWeek = weekStart(new Date()), spWeek = weekStart(new Date());
month.setDate(1);

const TRASH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>';
const WARN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d92d20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3zM12 10v5M12 18v.5"/></svg>';

const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

// ---- Log ----
function dayLabel(s) {
  const t = ymd(new Date());
  if (s === t) return 'Today';
  if (s === ymd(addDays(new Date(), -1))) return 'Yesterday';
  return parse(s).toLocaleDateString('en-PH', {weekday:'short', month:'short', day:'numeric'});
}
function entryPanel(e, del, noClient) {
  const w = del && pendingDel == e.id;
  return `<div class="panel ${w ? 'warn' : ''}">
    <div class="main"><div class="title"><strong>${esc(noClient ? e.item : e.client)}</strong>${e.sewer ? `<span class="tag">by ${esc(e.sewer)}</span>` : ''}</div>
      <div class="muted">${noClient ? '' : esc(e.item) + ', '}${esc(e.color)}, ${esc(e.size)}</div></div>
    <div class="r"><strong>${peso(cmp(e))}</strong><div class="muted">${e.qty} × ${peso(e.price)}</div></div>
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
  const list = entries.filter(e => e.date >= a && e.date <= b).sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
  const label = weekLabel(s), range = short(s) + ' to ' + short(addDays(s, 6));
  let out = `<h1 class="page-title">Log</h1>
    <div class="bar"><span class="sp" style="text-align:left">${label}${label !== range ? ` <span class="muted">${range}</span>` : ''}</span>
      <button class="btn" data-act="lw" data-d="-1" aria-label="Previous week">‹</button>
      <button class="btn" data-act="lw" data-d="1" aria-label="Next week">›</button></div>`, last = '';
  list.forEach(e => {
    if (e.date !== last) { out += `<div class="day">${dayLabel(e.date)}</div>`; last = e.date; }
    out += entryPanel(e, canDelete());
  });
  if (!list.length) out += '<p class="empty">Nothing logged this week.</p>';
  return out + '<button class="fab" data-act="add">Add entry</button>';
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
  let cells = '<div class="dow">Week</div>' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="dow">${d}</div>`).join('');
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
      <button class="btn" data-act="sw" data-d="1" aria-label="Next week">›</button></div>
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
  return `<div class="bar"><span class="sp" style="text-align:left">${label}${label !== range ? ` <span class="muted">${range}</span>` : ''}</span>
    <button class="btn" data-act="${act}" data-d="-1" aria-label="Previous week">‹</button>
    <button class="btn" data-act="${act}" data-d="1" aria-label="Next week">›</button></div>`;
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
const views = {log: logView, sewers: sewersView, suppliers: suppliersView, finance: financeView};
function renderTopbar() {
  const topbar = $('topbar');
  if (!cloud || !me) { topbar.hidden = true; topbar.innerHTML = ''; return; }
  topbar.hidden = false;
  topbar.innerHTML = `<details class="profile-menu">
    <summary><span class="avatar">${esc(me.name[0].toUpperCase())}</span><span class="profile-name">${esc(me.name)}</span></summary>
    <div class="profile-popover">
      <strong>${esc(me.name)}</strong>
      <button class="menu-btn" data-act="demo">${demoMode ? 'Exit demo mode' : 'Try demo data'}</button>
      <button class="menu-btn" data-act="logout">Log out</button>
    </div>
  </details>`;
}
function renderLoading() {
  const nav = document.querySelector('nav');
  nav.classList.add('loading');
  nav.setAttribute('aria-busy', 'true');
  const topbar = $('topbar');
  topbar.hidden = false;
  topbar.innerHTML = '<div class="topbar-skeleton"></div>';
  $('main').innerHTML = `<div class="app-skeleton" aria-live="polite" aria-label="Loading your workspace">
    <div class="skeleton-heading"></div>
    <div class="skeleton-subheading"></div>
    <div class="skeleton-toolbar"></div>
    <div class="skeleton-day"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-day"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  </div>`;
}
function render() {
  document.getElementById('main').innerHTML = views[view]();
  renderTopbar();
  const nav = document.querySelector('nav');
  nav.classList.remove('loading');
  nav.removeAttribute('aria-busy');
  document.querySelectorAll('nav [data-view]').forEach(b => {
    if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
const $ = id => document.getElementById(id);
function openDialog() {
  const uniq = f => [...new Set(entries.map(e => e[f]))].map(v => `<option value="${esc(v)}">`).join('');
  $('l-item').innerHTML = uniq('item'); $('l-color').innerHTML = uniq('color'); $('l-client').innerHTML = uniq('client'); $('l-sewer').innerHTML = uniq('sewer');
  $('l-size').innerHTML = ['Small', 'Medium', 'Large', 'XL'].map(v => `<option value="${v}">`).join('');
  ['item', 'color', 'size', 'client', 'sewer', 'pay', 'qty', 'price'].forEach(f => $('f-' + f).value = '');
  $('f-date').value = ymd(new Date()); $('err').textContent = '';
  $('sewer-fields').hidden = false;
  if (cloud) {
    $('f-sewer').value = me.name;
    $('f-sewer').readOnly = true;
  } else {
    $('f-sewer').readOnly = false;
  }
  $('dlg').showModal();
}
async function toggleDemo() {
  if (demoMode) {
    demoMode = false;
    if (cloud) await refresh();
    else entries = loadEntries();
    render();
    return;
  }
  demoMode = true;
  entries = demoEntries();
  render();
}
async function saveEntry() {
  const e = {date: $('f-date').value, item: $('f-item').value.trim(), color: $('f-color').value.trim() || 'Any',
    size: $('f-size').value.trim() || 'Any', client: $('f-client').value.trim() || 'Unknown',
    sewer: $('f-sewer').value.trim(), pay: Number($('f-pay').value) || 0,
    qty: Number($('f-qty').value), price: Number($('f-price').value)};
  if (!e.date || !e.item || !(e.qty > 0) || !(e.price >= 0) || $('f-price').value === '') {
    $('err').textContent = 'Add a date, an item name, a quantity above 0, and a price per piece.'; return;
  }
  if (cloud) {
    const {error} = await sb.from('entries').insert({date: e.date, item: e.item, color: e.color, size: e.size, client: e.client,
      qty: e.qty, price: e.price, pay: e.pay, sewer_id: me.id});
    if (error) { $('err').textContent = error.message; return; }
    await refresh();
  } else { e.id = Date.now(); entries.push(e); saveEntries(); }
  logWeek = weekStart(parse(e.date)); $('dlg').close(); render();
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act],[data-view]');
  if (!b) return;
  const d = b.dataset;
  if (d.act !== 'ask') pendingDel = null;
  if (d.view) { view = d.view; }
  else if (d.act === 'add') { openDialog(); return; }
  else if (d.act === 'cancel') { $('dlg').close(); return; }
  else if (d.act === 'save') { saveEntry(); return; }
  else if (d.act === 'demo') { toggleDemo(); return; }
  else if (d.act === 'ask') pendingDel = d.id;
  else if (d.act === 'del') { removeEntry(d.id); return; }
  else if (d.act === 'auth-go') { authGo(); return; }
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
// ---- Cloud (Supabase) ----
const canDelete = () => true;
let authMode = 'login';
function showAuth(msg) {
  const nav = document.querySelector('nav');
  nav.classList.remove('loading');
  nav.removeAttribute('aria-busy');
  $('topbar').hidden = true;
  $('auth').hidden = false;
  $('a-err').textContent = msg || '';
}
function setAuthMode(m) {
  authMode = m;
  $('a-name').hidden = $('a-name-l').hidden = m !== 'signup';
  $('a-title').textContent = m === 'signup' ? 'Create your account' : 'Welcome back';
  $('a-go').textContent = m === 'signup' ? 'Sign up' : 'Log in';
  $('a-switch').textContent = m === 'signup' ? 'Have an account? Log in' : 'No account? Sign up';
  $('a-sub').textContent = m === 'signup' ? 'Create your account' : 'Log in to continue';
  $('a-err').textContent = '';
}
async function refresh() {
  const {data, error} = await sb.from('entries')
    .select('id, date, item, color, size, qty, client, price, pay, sewer_id, profiles(name)')
    .order('date', {ascending: false});
  if (error) { alert('Could not load entries: ' + error.message); return; }
  entries = data.map(r => ({id: r.id, date: r.date, item: r.item, color: r.color, size: r.size, qty: r.qty, client: r.client,
    price: Number(r.price), pay: Number(r.pay), sewer: r.profiles ? r.profiles.name : ''}));
}
async function enter() {
  $('auth').hidden = true;
  renderLoading();
  const {data: u} = await sb.auth.getUser();
  const {data: p, error} = await sb.from('profiles').select('id, name').eq('id', u.user.id).single();
  if (error || !p) {
    await sb.auth.signOut();
    showAuth('Could not load your profile. Make sure your Supabase profiles table and signup trigger are configured.');
    return;
  }
  me = p;
  people = [p];
  await refresh();
  $('auth').hidden = true; view = 'log'; render();
}
async function authGo() {
  const email = $('a-email').value.trim(), password = $('a-pass').value, name = $('a-name').value.trim();
  if (!email || password.length < 6 || (authMode === 'signup' && !name)) {
    $('a-err').textContent = authMode === 'signup' ? 'Enter your name, an email, and a password of 6 or more characters.' : 'Enter your email and password.'; return;
  }
  $('auth').hidden = true;
  renderLoading();
  try {
    const res = authMode === 'signup' ? await sb.auth.signUp({email, password, options: {data: {name}}}) : await sb.auth.signInWithPassword({email, password});
    if (res.error) { showAuth(res.error.message); return; }
    if (!res.data.session) { showAuth('Check your email to confirm your account, then log in.'); return; }
    await enter();
  } catch (e) {
    showAuth('Could not connect. Check your connection and try again.');
  }
}
async function logout() { await sb.auth.signOut(); me = null; entries = []; people = []; demoMode = false; setAuthMode('login'); showAuth(); renderTopbar(); }
async function removeEntry(id) {
  const removed = entries.find(e => e.id == id);
  if (!removed) return;

  entries = entries.filter(e => e.id != id);
  pendingDel = null;
  render();

  if (cloud) {
    const {error} = await sb.from('entries').delete().eq('id', id);
    if (error) {
      entries.push(removed);
      entries.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
      render();
      alert('Could not delete entry: ' + error.message);
    }
  } else {
    saveEntries();
  }
}
async function boot() {
  if (!cloud) { entries = loadEntries(); render(); return; }
  renderLoading();
  const {data} = await sb.auth.getSession();
  if (data.session) await enter(); else showAuth();
}
boot();
