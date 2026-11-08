/* Tally tutorials: dim the screen, spotlight a real control and explain it in a speech bubble.
   The main tour includes the tab-by-tab walkthrough and hands-on Add entry practice.
   Interactive steps wait for the user to really do the thing (app.js reports it through TUTORIAL.event).
   Texts (English + Filipino, first draft) are registered with I18N.extend().
   To remove: delete this file, tutorial.css, their two tags in index.html and the lines marked TUTORIAL in app.js. */
(function () {
  const en = {
    'tut.continue': 'Continue', 'tut.done': 'Done', 'tut.skip': 'Skip', 'tut.skipStep': 'Skip step', 'tut.tapHint': 'Tap the highlighted option to continue.', 'tut.step': 'Step {n} of {total}',
    // main tour
    'tut.owner.setup.title': 'Setup',
    'tut.owner.setup.text': 'Set the price and the sewer’s pay for each item here. Tally uses them to work out salaries and profit.',
    'tut.owner.salary.title': 'Salary',
    'tut.owner.salary.text': 'See each sewer’s pay for the week. When the week is done, tap Finalize to lock it and save the payslips.',
    'tut.owner.suppliers.title': 'Suppliers',
    'tut.owner.suppliers.text': 'See how much each supplier owes for the week, and download a statement once the week is finalized.',
    'tut.owner.finance.title': 'Finance',
    'tut.owner.finance.text': 'See your income, sewer pay and profit on a calendar. Tap a week or a day for the details.',
    'tut.owner.settings.title': 'Your account',
    'tut.owner.settings.text': 'Tap here for Settings: invite sewers, change the language and text size, or replay this tutorial.',
    'tut.sewer.logs.title': 'My logs',
    'tut.sewer.logs.text': 'Everything you sewed, day by day.',
    'tut.sewer.pay.title': 'Salary and Finance',
    'tut.sewer.pay.text': 'Salary shows your pay for the week. Finance shows your earnings on a calendar.',
    'tut.sewer.settings.title': 'Your account',
    'tut.sewer.settings.text': 'Tap here for Settings: change the language and text size, or replay this tutorial.',
    // practice
    'tut.practiceNote': 'Practice mode: nothing is saved. Most fields are already filled, so you can tap through them quickly.',
    'tut.p.otherHint': 'Type the new name, then tap Continue.',
    'tut.p.start.title': 'Let’s practice',
    'tut.p.start.text': 'Tap Add entry to log your work. This is only practice, so nothing will be saved.',
    'tut.p.form.title': 'Fill in the form',
    'tut.p.form.text': 'Pick or type the supplier, item, color and size. Most are filled in already, so just tap through. Then enter how many pieces and save.',
    'tut.p.done.title': 'Great job!',
    'tut.p.done.text': 'Tally remembers what you entered. Now try again and see how fast it is.',
    'tut.quick.start.title': 'Try a repeat entry',
    'tut.quick.start.text': 'Tap Add entry again. This time your saved values are ready to tap.',
    'tut.quick.form.title': 'Tap, don’t type',
    'tut.quick.form.text': 'Tap the saved supplier, item, color and size. Then enter the quantity and save.',
    'tut.quick.done.title': 'That is it!',
    'tut.quick.done.text': 'For familiar work, it is just tap, tap, tap, tap, quantity, done.',
    'tut.tab.finance.pick.title': 'Tap a week',
    'tut.tab.finance.pick.text': 'Tap the highlighted arrow beside a week to see what the whole week earned.',
    'tut.tab.finance.detail.title': 'Income, pay and profit',
    'tut.tab.finance.detail.text': 'Income is what your suppliers pay. Sewer pay is what your sewers earned. Profit is what is left. You can also tap a single day.',
    'tut.tab.salary.pick.title': 'Tap a sewer',
    'tut.tab.salary.pick.text': 'See what each sewer earned this week. Tap a name to open their receipt.',
    'tut.tab.salary.receipt.title': 'Their receipt',
    'tut.tab.salary.receipt.text': 'This shows everything they sewed this week and the pay they are owed.',
    'tut.tab.salary.finalize.title': 'You close the week',
    'tut.tab.salary.finalize.text': 'Tally never closes a week by itself. Rush orders and overtime mean the last day is not always the same, so you decide when the week is done. Tap the highlighted button when you are ready.',
    'tut.tab.salary.sheet.title': 'Check, then finalize',
    'tut.tab.salary.sheet.text': 'Here is each sewer’s total. Tap Finalize to lock the week and save every payslip. This is a demo, so nothing real is closed.',
    'tut.tab.salary.download.title': 'Save the summary',
    'tut.tab.salary.download.text': 'The week is closed. Tap the highlighted button to save the whole weekly summary as a picture you can send or print.',
    'tut.tab.salary.done.title': 'That’s Salary',
    'tut.tab.salary.done.text': 'Finalize closes the week and the download button saves the summary. Closed a week too early? Use the Reopen button on that week to unlock it.',
    'tut.tab.salary.saved': 'Saved to downloads',
    'tut.tab.suppliers.pick.title': 'Tap a supplier',
    'tut.tab.suppliers.pick.text': 'See how much each supplier owes you this week. Tap one to open their statement.',
    'tut.tab.suppliers.receipt.title': 'Their statement',
    'tut.tab.suppliers.receipt.text': 'This lists the work you did for them and the total they owe. You can download it once the week is finalized.',
    'tut.tab.setup.rates.title': 'Added to your prices',
    'tut.tab.setup.rates.text': 'It now appears in your price list, so Tally can work out salaries and profit. Tap Add rate any time to set one for a new item.',
    'tut.tab.setup.missing.title': 'Oh no, a missing price!',
    'tut.tab.setup.missing.text': 'You logged this item, but Tally doesn’t know its price or the sewer’s pay yet. Tap the button on the highlighted card to fix it.',
    'tut.tab.setup.dialog.title': 'Set the price and pay',
    'tut.tab.setup.dialog.text': 'Type the price per piece and the sewer’s pay, then tap Save. This is a demo, so nothing real is saved.',
  };
  const fil = {
    'tut.continue': 'Magpatuloy', 'tut.done': 'Tapos na', 'tut.skip': 'Laktawan', 'tut.skipStep': 'Laktawan ang hakbang', 'tut.tapHint': 'Pindutin ang naka-highlight na pagpipilian para magpatuloy.', 'tut.step': 'Hakbang {n} ng {total}',
    'tut.owner.setup.title': 'Setup',
    'tut.owner.setup.text': 'Itakda rito ang presyo at bayad sa mananahi para makalkula ang sahod at tubo.',
    'tut.owner.salary.title': 'Sahod',
    'tut.owner.salary.text': 'Makikita rito ang sahod sa linggo. Kapag tapos na, pindutin ang Tapusin para i-save ang mga payslip.',
    'tut.owner.suppliers.title': 'Mga Supplier',
    'tut.owner.suppliers.text': 'Makikita rito ang dapat bayaran sa bawat supplier. I-download ang statement kapag tapos na ang linggo.',
    'tut.owner.finance.title': 'Pananalapi',
    'tut.owner.finance.text': 'Makikita rito ang kita, sahod at tubo. Pindutin ang isang linggo o araw para sa detalye.',
    'tut.owner.settings.title': 'Iyong account',
    'tut.owner.settings.text': 'Dito ang Settings: mga imbitasyon, wika, laki ng letra at tutorial.',
    'tut.sewer.logs.title': 'Aking talaan',
    'tut.sewer.logs.text': 'Lahat ng tinahi mo, araw-araw.',
    'tut.sewer.pay.title': 'Sahod at Pananalapi',
    'tut.sewer.pay.text': 'Ipinapakita ng Sahod ang kita mo sa linggo. Ipinapakita ng Pananalapi ang kita sa kalendaryo.',
    'tut.sewer.settings.title': 'Iyong account',
    'tut.sewer.settings.text': 'Dito ang Settings: wika, laki ng letra at tutorial.',
    'tut.practiceNote': 'Pagsasanay lang: walang mase-save. Karamihan ng field ay may laman na, kaya mabilis lang ang pagpindot.',
    'tut.p.otherHint': 'I-type ang bagong pangalan, saka pindutin ang Magpatuloy.',
    'tut.p.start.title': 'Magsanay tayo',
    'tut.p.start.text': 'Pindutin ang Magdagdag ng tala para magtala ng trabaho. Pagsasanay lang ito, kaya walang mase-save.',
    'tut.p.form.title': 'Punan ang form',
    'tut.p.form.text': 'Piliin o i-type ang supplier, item, kulay at laki. Halos nakalagay na ang mga ito, kaya pindutin lang. Pagkatapos, ilagay ang dami at i-save.',
    'tut.p.done.title': 'Mahusay!',
    'tut.p.done.text': 'Naaalala ng Tally ang inilagay mo. Subukan ulit at tingnan kung gaano ito kabilis.',
    'tut.quick.start.title': 'Subukan ang paulit-ulit na tala',
    'tut.quick.start.text': 'Pindutin ulit ang Magdagdag ng tala. Ngayon, handa nang pindutin ang mga naka-save mong halaga.',
    'tut.quick.form.title': 'Pindot lang, walang type',
    'tut.quick.form.text': 'Pindutin ang naka-save na supplier, item, kulay at laki. Pagkatapos, ilagay ang dami at i-save.',
    'tut.quick.done.title': 'Iyon na!',
    'tut.quick.done.text': 'Para sa pamilyar na trabaho, pindot, pindot, pindot, pindot, dami, tapos.',
    'tut.tab.finance.pick.title': 'Pumili ng linggo',
    'tut.tab.finance.pick.text': 'Pindutin ang naka-highlight na arrow sa tabi ng isang linggo para makita ang kinita ng buong linggo.',
    'tut.tab.finance.detail.title': 'Kita, sahod at tubo',
    'tut.tab.finance.detail.text': 'Ang kita ay ang binabayad ng mga supplier. Ang sahod ay ang kinita ng mga mananahi. Ang tubo ay ang natitira. Puwede ka ring pumili ng isang araw.',
    'tut.tab.salary.pick.title': 'Pumili ng mananahi',
    'tut.tab.salary.pick.text': 'Tingnan kung magkano ang kinita ng bawat mananahi ngayong linggo. Pindutin ang pangalan para buksan ang resibo.',
    'tut.tab.salary.receipt.title': 'Ang resibo nila',
    'tut.tab.salary.receipt.text': 'Dito makikita ang lahat ng tinahi nila ngayong linggo at ang sahod na dapat nilang matanggap.',
    'tut.tab.salary.finalize.title': 'Ikaw ang nagsasara ng linggo',
    'tut.tab.salary.finalize.text': 'Hindi kusang nagsasara ng linggo ang Tally. May mga linggong may biglaang trabaho at overtime, kaya ikaw ang magdedesisyon kung kailan tapos na. Pindutin ang naka-highlight na button kapag handa ka na.',
    'tut.tab.salary.sheet.title': 'Suriin, saka tapusin',
    'tut.tab.salary.sheet.text': 'Narito ang kabuuan ng bawat mananahi. Pindutin ang Tapusin para i-lock ang linggo at i-save ang bawat payslip. Demo lang ito, kaya walang totoong isasara.',
    'tut.tab.salary.download.title': 'I-save ang buod',
    'tut.tab.salary.download.text': 'Sarado na ang linggo. Pindutin ang naka-highlight na button para i-save ang buong buod ng linggo bilang larawan na puwede mong ipadala o i-print.',
    'tut.tab.salary.done.title': 'Iyan ang Salary',
    'tut.tab.salary.done.text': 'Isinasara ng Tapusin ang linggo at sine-save ng download button ang buod. Napaaga ang pagsara? Gamitin ang Reopen button sa linggong iyon para i-unlock.',
    'tut.tab.salary.saved': 'Na-save sa downloads',
    'tut.tab.suppliers.pick.title': 'Pumili ng supplier',
    'tut.tab.suppliers.pick.text': 'Tingnan kung magkano ang utang ng bawat supplier ngayong linggo. Pindutin ang isa para buksan ang statement.',
    'tut.tab.suppliers.receipt.title': 'Ang statement nila',
    'tut.tab.suppliers.receipt.text': 'Nakalista dito ang trabahong ginawa mo para sa kanila at ang kabuuang utang nila. Puwede mo itong i-download kapag tapos na ang linggo.',
    'tut.tab.setup.rates.title': 'Nadagdag na sa presyo',
    'tut.tab.setup.rates.text': 'Lumabas na ito sa listahan ng presyo, kaya makukuwenta na ng Tally ang sahod at tubo. Pindutin ang Magdagdag ng rate anumang oras para sa bagong item.',
    'tut.tab.setup.missing.title': 'Naku, kulang ang presyo!',
    'tut.tab.setup.missing.text': 'Naitala mo ang item na ito, pero hindi pa alam ng Tally ang presyo o sahod ng mananahi. Pindutin ang button sa naka-highlight na card para ayusin.',
    'tut.tab.setup.dialog.title': 'Ilagay ang presyo at sahod',
    'tut.tab.setup.dialog.text': 'I-type ang presyo kada piraso at ang sahod ng mananahi, saka pindutin ang I-save. Demo lang ito, kaya walang totoong mase-save.',
  };
  I18N.extend(en, fil);

  const NAV = v => 'nav [data-view="' + v + '"]';
  const SNAV = v => 'nav [data-act="settings-section"][data-v="' + v + '"]';
  const MENU = '.profile-menu > summary';
  const wizAt = n => (name, d) => name === 'wizard' && d.step >= n;
  const practiceTarget = () => document.querySelector(
    wizState.other ? '#wizard .wizard-other-input' : '#wizard .choice-card:not(.other)'
  ) || document.querySelector('#wizard .choice-grid');
  const practiceStep = (step, key) => Object.assign({practice: true, prefix: 'practice', k: key}, step);
  const quickStep = (step, key) => Object.assign({practice: true, prefix: 'quick', k: key}, step);
  const PRACTICE_STEPS = [
    practiceStep({view: 'HOME', sel: '.fab', wait: name => name === 'wizard'}, 'start'),
    practiceStep({sel: '#dlg', wait: name => name === 'practice-done'}, 'form'),
    practiceStep({center: true}, 'done')
  ];
  const QUICK_STEPS = [
    quickStep({view: 'HOME', sel: '.fab', wait: name => name === 'wizard'}, 'start'),
    quickStep({sel: '#dlg', wait: name => name === 'practice-done'}, 'form'),
    quickStep({center: true}, 'done')
  ];
  const SETS = {
    owner: [
      ...PRACTICE_STEPS,
      ...QUICK_STEPS,
      { view: 'setup', sel: NAV('setup'), k: 'setup' },
      { view: 'sewers', sel: NAV('sewers'), k: 'salary' },
      { view: 'suppliers', sel: NAV('suppliers'), k: 'suppliers' },
      { view: 'finance', sel: NAV('finance'), k: 'finance' },
      { view: 'log', sel: MENU, k: 'settings' }
    ],
    sewer: [
      ...PRACTICE_STEPS,
      ...QUICK_STEPS,
      { view: 'my-log', sel: NAV('my-log'), k: 'logs' },
      { view: 'my-salary', sel: NAV('my-salary'), k: 'pay' },
      { view: 'my-log', sel: MENU, k: 'settings' }
    ],
  };
  // First-visit mini tutorials: one short lesson per tab, shown once, with real (or demo) data.
  const TABFLAG = 'tally.tutorial.tab.';
  const weekTarget = () => {   // a calendar week that has entries, otherwise the first week
    const bs = [...document.querySelectorAll('#main .wbtn[data-act="week"]')];
    const hasData = b => { let n = b.nextElementSibling, c = 0; while (n && c < 7) { if (n.classList.contains('has')) return true; n = n.nextElementSibling; c++; } return false; };
    return bs.find(hasData) || bs[0] || null;
  };
  const rowRect = (el, n) => {   // one rectangle around an element and the n siblings after it (a whole calendar row)
    const f = el.getBoundingClientRect();
    let L = f.left, T = f.top, R = f.right, B = f.bottom, sib = el.nextElementSibling;
    for (let i = 0; i < n && sib; i++, sib = sib.nextElementSibling) {
      const q = sib.getBoundingClientRect();
      L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom);
    }
    return { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T };
  };
  const tabStep = (step, key) => Object.assign({prefix: 'tab', k: key}, step);
  const TAB_SETS = {
    finance: [
      tabStep({sel: weekTarget, pad: 12, pulse: true, wait: name => name === 'select'}, 'finance.pick'),
      tabStep({sel: '#detail'}, 'finance.detail')
    ],
    sewers: [
      tabStep({sel: '#main .mini[data-act="sewer"]', wait: name => name === 'receipt'}, 'salary.pick'),
      tabStep({sel: '#receipt-dlg', keepDlg: true}, 'salary.receipt'),
      tabStep({sel: '#main .fin-bar [data-act="fin-open"]', pad: 10, pulse: true, wait: name => name === 'fin-open'}, 'salary.finalize'),
      tabStep({sel: '#fin-dlg', keepDlg: true, wait: name => name === 'fin-done'}, 'salary.sheet'),
      tabStep({sel: '#main [data-act="sum"]', pad: 10, pulse: true, wait: () => false}, 'salary.download'),   // advances itself when the download animation ends
      tabStep({center: true}, 'salary.done')
    ],
    suppliers: [
      tabStep({sel: '#main .mini[data-act="supplier"]', wait: name => name === 'receipt'}, 'suppliers.pick'),
      tabStep({sel: '#receipt-dlg', keepDlg: true}, 'suppliers.receipt')
    ],
    setup: [
      tabStep({sel: '#main .rate-card.missing [data-act="rate-edit"]', pad: 10, pulse: true, wait: name => name === 'rate-open'}, 'setup.missing'),
      tabStep({sel: '#rate-dlg', keepDlg: true, wait: name => name === 'rate-saved'}, 'setup.dialog'),
      tabStep({sel: () => { const b = document.querySelector('#main [data-act="rate-add"]'); return b && b.closest('.setup-section'); }}, 'setup.rates')
    ]
  };
  const TAB_ALWAYS_DEMO = { setup: true, sewers: true };   // lessons that need demo data even when the account has real entries
  const PREFIX = { owner: 'tut.owner.', sewer: 'tut.sewer.', practice: 'tut.p.', quick: 'tut.quick.', tab: 'tut.tab.' };
  const FLAG = { main: 'tally.tutorial.done:' };
  const quickValues = {};

  const t = k => I18N.t(k);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    }
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  let ui = null, steps = [], type = null, role = 'owner', idx = 0, userId = null, token = 0;
  let tabView = null, enteredDemo = false, visitTimer = null;
  let offset = 0;   // steps skipped at the start (practice opened straight from Add entry)
  let cur = { view: '', section: '', lang: '', size: '' }, wizState = { step: 0, other: false };

  const home = () => (role === 'owner' ? 'log' : 'my-log');
  const dlgEl = () => document.getElementById('dlg');

  function build() {
    ui = document.createElement('div');
    ui.className = 'tut';
    ui.innerHTML =
      '<div class="tut-block"></div>' +
      '<div class="tut-mask"></div><div class="tut-mask"></div><div class="tut-mask"></div><div class="tut-mask"></div>' +
      '<div class="tut-hole"></div>' +
      '<div class="tut-bubble" role="dialog" aria-modal="true" aria-labelledby="tut-title">' +
      '<div class="tut-arrow"></div><div class="tut-pointer" aria-hidden="true"><svg viewBox="0 0 32 40"><path d="M12 2c-2 0-3 1.6-3 3.5v13L6.5 16c-1.4-1-3.1-.7-4 .6-.8 1.2-.5 2.8.6 3.7l8.5 7.2c1.7 1.4 3.8 2.2 6 2.2h1.2c4.8 0 8.7-3.9 8.7-8.7V14c0-1.7-1.3-3-3-3-.8 0-1.5.3-2 .8V9c0-1.7-1.3-3-3-3-.8 0-1.5.3-2 .8V5c0-1.7-1.3-3-3-3Z" fill="currentColor" stroke="var(--bg)" stroke-width="1.5" stroke-linejoin="round"/></svg></div><p class="tut-count"></p><h3 id="tut-title" class="tut-title"></h3><p class="tut-text"></p>' +
      '<div class="tut-actions"><button type="button" class="tut-skip"></button><button type="button" class="tut-next"></button></div></div>';
    document.body.appendChild(ui);
    ui.querySelector('.tut-next').addEventListener('click', () => go(idx + 1));
    ui.querySelector('.tut-skip').addEventListener('click', () => finish(false));
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    const d = dlgEl(); if (d) d.addEventListener('close', onDlgClose);
  }
  let scrollQueued = false;
  function onScroll() {   // keep the spotlight on its target while the page scrolls
    if (!ui || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; place(); });
  }
  function onKey(ev) { if (ui && ev.key === 'Escape' && type !== 'practice') finish(false); }
  function onDlgClose() {
    if (!ui) return;
    mount();
    if (type === 'practice' && idx < steps.length - 1) { offset = 0; go(0); }   // closed the practice form early: start over
  }

  // The Add entry form is a modal <dialog>; only things inside it can be tapped, so the overlay moves in while it is open.
  function mount() {
    if (!ui) return;
    const host = document.querySelector('dialog[open]') || document.body;
    if (ui.parentNode !== host) host.appendChild(ui);
    ui.style.left = '0px'; ui.style.top = '0px'; ui.style.width = window.innerWidth + 'px'; ui.style.height = window.innerHeight + 'px';
    const r = ui.getBoundingClientRect();
    ui.style.left = (-r.left) + 'px'; ui.style.top = (-r.top) + 'px';
  }

  function finish(completed, noFlag) {
    token++;
    const was = type;
    if (ui) { ui.remove(); ui = null; }
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', onScroll, true);
    const d = dlgEl(); if (d) d.removeEventListener('close', onDlgClose);
    if (userId && FLAG[was]) store.set(FLAG[was] + userId, '1');
    type = null;
    if (was === 'tab') {
      if (userId && tabView && !noFlag) store.set(TABFLAG + tabView + ':' + userId, '1');
      ['receipt-dlg', 'rate-dlg', 'fin-dlg'].forEach(id => { const x = document.getElementById(id); if (x && x.open) x.close(); });
      if (enteredDemo) { enteredDemo = false; if (window.TallyDemo) window.TallyDemo.exit(); }
      tabView = null;
    }
    if (was === 'main') { const h = document.querySelector(NAV(home())); if (h && !h.hidden) h.click(); }
    if (d && d.open) d.close();
  }

  async function go(i) {
    const my = ++token;
    if (i >= steps.length) { finish(true); return; }
    idx = i;
    const step = steps[i];
    step.base = { lang: I18N.lang(), size: I18N.textSize() };
    if (type === 'tab') { const rd = document.getElementById('receipt-dlg'); if (rd && rd.open && !step.keepDlg) rd.close(); }
    if (step.view) {
      const v = step.view === 'HOME' ? home() : step.view;
      const b = document.querySelector(NAV(v));
      if (b && !b.hidden && cur.view !== v) b.click();
    }
    if (step.section && cur.section !== step.section) {
      const b = document.querySelector(SNAV(step.section));
      if (b) b.click();
    }
    await wait(step.center ? 40 : 220);
    if (my !== token || !ui) return;
    if (!step.center && !visible(typeof step.sel === 'function' ? step.sel() : document.querySelector(step.sel))) { if (type === 'tab' && i === 0) { finish(false, true); return; } go(i + 1); return; }  // target not on screen: skip (a tab lesson that cannot start is retried next visit)
    if (type === 'tab' && !step.center) { const tg = typeof step.sel === 'function' ? step.sel() : document.querySelector(step.sel); if (tg && !tg.closest('dialog')) tg.scrollIntoView({block: 'nearest'}); }   // bring the target on screen
    renderStep();
    const nb = ui.querySelector('.tut-next');
    if (!nb.hidden) nb.focus({ preventScroll: true });
  }

  function renderStep() {
    if (!ui) return;
    const step = steps[idx]; if (!step) return;
    const base = PREFIX[step.prefix || (type === 'main' ? role : type)] + step.k;
    const last = idx === steps.length - 1, interactive = !!step.wait;
    ui.querySelector('.tut-count').textContent = t('tut.step').replace('{n}', idx + 1 - offset).replace('{total}', steps.length - offset);
    ui.querySelector('.tut-title').textContent = t(base + '.title');
    ui.querySelector('.tut-text').textContent = (step.other && wizState.other) ? t('tut.p.otherHint') : t(base + '.text');
    const next = ui.querySelector('.tut-next'), skip = ui.querySelector('.tut-skip');
    next.hidden = interactive && !step.skippable;
    next.classList.toggle('ghost', interactive);
    next.textContent = interactive ? t('tut.skipStep') : (last ? t('tut.done') : t('tut.continue'));
    skip.textContent = t('tut.skip');
    skip.hidden = last;
    place();
  }

  // Spotlight on the target; the bubble goes above or below it with an arrow pointing at it.
  function place() {
    if (!ui) return;
    const step = steps[idx]; if (!step) return;
    mount();
    const vw = window.innerWidth, vh = window.innerHeight;
    const hole = ui.querySelector('.tut-hole'), block = ui.querySelector('.tut-block'), masks = ui.querySelectorAll('.tut-mask');
    const bubble = ui.querySelector('.tut-bubble');
    bubble.style.maxWidth = (vw - 24) + 'px';
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    if (step.center) {
      hole.style.display = 'none'; masks.forEach(m => { m.style.display = 'none'; });
      ui.querySelector('.tut-pointer').style.display = 'none';
      block.style.display = 'block'; block.classList.add('dim');
      bubble.classList.add('center'); bubble.classList.remove('below', 'above');
      bubble.style.left = Math.max(12, (vw - bw) / 2) + 'px'; bubble.style.top = Math.max(12, (vh - bh) / 2) + 'px';
      return;
    }
    bubble.classList.remove('center'); block.classList.remove('dim'); hole.style.display = 'block';
    const el = typeof step.sel === 'function' ? step.sel() : document.querySelector(step.sel);
    if (!visible(el)) return;
    const r = el.getBoundingClientRect(), pad = step.pad || 6;
    const hx = Math.max(0, r.left - pad), hy = Math.max(0, r.top - pad), hw = r.width + 2 * pad, hh = r.height + 2 * pad;
    if (step.pulse && !hole._pulse) hole._pulse = hole.animate(
      [{ boxShadow: '0 0 0 0 rgba(255,255,255,.95)' }, { boxShadow: '0 0 0 16px rgba(255,255,255,0)' }],
      { duration: 1100, iterations: Infinity });
    if (!step.pulse && hole._pulse) { hole._pulse.cancel(); hole._pulse = null; }
    hole.style.left = hx + 'px'; hole.style.top = hy + 'px'; hole.style.width = hw + 'px'; hole.style.height = hh + 'px';
    const radius = getComputedStyle(el).borderRadius;
    hole.style.borderRadius = radius === '0px' ? '12px' : radius;
    const pointer = ui.querySelector('.tut-pointer');
    pointer.style.display = 'none';   // the spotlight already shows where to tap
    pointer.style.left = Math.max(8, Math.min(vw - 40, r.left + r.width / 2 - 16)) + 'px';
    pointer.style.top = Math.max(8, r.top - 48) + 'px';
    if (step.wait) {   // interactive: everything outside the spotlight is blocked, the spotlight itself is tappable
      block.style.display = 'none';
      const rects = [[0, 0, vw, hy], [0, hy + hh, vw, Math.max(0, vh - hy - hh)], [0, hy, hx, hh], [hx + hw, hy, Math.max(0, vw - hx - hw), hh]];
      masks.forEach((m, n) => { m.style.display = 'block'; m.style.left = rects[n][0] + 'px'; m.style.top = rects[n][1] + 'px'; m.style.width = rects[n][2] + 'px'; m.style.height = rects[n][3] + 'px'; });
    } else {
      block.style.display = 'block'; masks.forEach(m => { m.style.display = 'none'; });
    }
    const gap = 16, need = bh + gap + 8, roomBelow = vh - r.bottom - pad, roomAbove = r.top - pad;
    const fits = roomBelow >= need || roomAbove >= need;
    const below = roomBelow >= need || (roomAbove < need && roomBelow >= roomAbove);
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    let top = below ? r.bottom + pad + gap : r.top - pad - gap - bh;
    top = Math.max(12, Math.min(vh - bh - 12, top));   // never leave the screen
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
    bubble.classList.toggle('below', below && fits); bubble.classList.toggle('above', !below && fits);
    bubble.querySelector('.tut-arrow').style.display = fits ? '' : 'none';
    const ax = Math.max(22, Math.min(bw - 22, r.left + r.width / 2 - left));
    bubble.querySelector('.tut-arrow').style.left = (ax - 7) + 'px';
  }

  function start(kind, from) {
    if (ui) finish(false);
    type = kind;
    offset = (kind === 'practice' && from) ? from : 0;
    role = role === 'sewer' ? 'sewer' : 'owner';
    steps = (SETS[kind === 'main' ? role : kind]).filter(s => !s.only || s.only === role);
    build();
    go(from || 0);
  }

  // app.js reports what happens: 'render' {view, section, lang, size}, 'wizard' {step, other}, 'practice-done'
  function event(name, d) {
    d = d || {};
    if (name === 'render') {
      cur = { view: d.view, section: d.section, lang: d.lang, size: d.size };
      if (!ui) return;
    }
    if (name === 'wizard') {
      wizState = { step: d.step, other: !!d.other };
      if (type === 'main' && steps[idx] && steps[idx].prefix === 'practice' && d.values) {
        Object.assign(quickValues, d.values);
      }
    }
    if (!ui) return;
    const st = steps[idx];
    if (st && st.wait && st.wait(name, d, st)) { go(idx + 1); return; }
    renderStep();
  }

  function startTab(view) {
    const D = window.TallyDemo;
    tabView = view;
    if (D && !D.active() && (TAB_ALWAYS_DEMO[view] || !D.hasEntries())) { D.enter(); enteredDemo = true; if (view === 'setup') D.dropRate(); }   // empty account: borrow the demo data for the lesson
    type = 'tab'; offset = 0;
    steps = TAB_SETS[view];
    build();
    go(0);
  }
  // Called by app.js after every render: opens that tab's lesson the first time an owner visits it.
  function visit(view) {
    if (ui || visitTimer || !userId || role !== 'owner' || !TAB_SETS[view]) return;
    if (!store.get(FLAG.main + userId) || store.get(TABFLAG + view + ':' + userId)) return;
    visitTimer = setTimeout(() => {
      visitTimer = null;
      if (ui || cur.view !== view) return;
      startTab(view);
    }, 600);
  }

  // Download demo: the real weekly-summary picture pops up, flies into the button, and the button confirms it was saved.
  let playing = false;
  async function playDownload() {
    if (playing) return;
    playing = true;
    const my = token, D = window.TallyDemo;
    const btn = document.querySelector('#main [data-act="sum"]');
    let src = null; try { src = D && D.summaryPreview ? await D.summaryPreview() : null; } catch (e) { /* use the plain paper below */ }
    if (my !== token || !ui || !btn) { playing = false; return; }
    const vw = window.innerWidth, vh = window.innerHeight, W = 170, H = 230;
    const Z = '2147483600';
    const card = document.createElement('div');
    card.style.cssText = 'position:fixed;pointer-events:none;z-index:' + Z + ';left:' + (vw / 2 - W / 2) + 'px;top:' + (vh / 2 - H / 2) + 'px;width:' + W + 'px;height:' + H + 'px;background:#fff;border-radius:8px;box-shadow:0 14px 44px rgba(0,0,0,.4);overflow:hidden;border:1px solid rgba(0,0,0,.12)';
    card.innerHTML = src ? '<img alt="" style="display:block;width:100%;object-fit:cover;object-position:top" src="' + src + '">'
      : '<div style="padding:16px"><div style="height:10px;width:60%;background:#111;margin-bottom:14px"></div>' + '<div style="height:7px;background:#ddd;margin-bottom:9px"></div>'.repeat(9) + '</div>';
    document.body.appendChild(card);
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = n => (calm ? 1 : n);
    try {
      await card.animate([{ opacity: 0, transform: 'scale(.5) translateY(30px)' }, { opacity: 1, transform: 'scale(1) translateY(0)' }],
        { duration: ms(380), easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' }).finished;
      await wait(calm ? 0 : 450);
      const tx = (vw - 40) - vw / 2, ty = 36 - vh / 2;   // fly to the top-right corner, where the browser shows downloads
      await card.animate([{ transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 }, { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.08) rotate(12deg)', opacity: .9 }],
        { duration: ms(750), easing: 'cubic-bezier(.5,0,.85,.45)', fill: 'forwards' }).finished;
    } catch (e) { /* animation cancelled */ }
    card.remove();
    // a small "browser download" chip drops into the top-right corner, then turns into a tick
    const chip = document.createElement('div'), icon = document.createElement('span'), label = document.createElement('span');
    icon.textContent = '↓'; label.textContent = 'Tally-salary-report.png';
    icon.style.cssText = 'width:26px;height:26px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font:700 15px "DM Sans",sans-serif';
    chip.style.cssText = 'position:fixed;pointer-events:none;z-index:' + Z + ';right:10px;top:calc(env(safe-area-inset-top, 0px) + 10px);display:flex;align-items:center;gap:8px;background:#111;color:#fff;padding:7px 14px 7px 7px;border-radius:999px;font:600 14px "DM Sans",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:calc(100vw - 20px)';
    chip.append(icon, label);
    document.body.appendChild(chip);
    chip.animate([{ opacity: 0, transform: 'translateY(-14px) scale(.9)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: ms(260), fill: 'forwards' });
    icon.animate([{ transform: 'translateY(-4px)' }, { transform: 'translateY(3px)' }], { duration: ms(280), iterations: calm ? 1 : 3, direction: 'alternate' });
    await wait(calm ? 0 : 900);
    icon.textContent = '✓'; label.textContent = t('tut.tab.salary.saved');
    await wait(calm ? 400 : 1500);
    chip.remove(); playing = false;
    if (my === token && ui) go(idx + 1);
  }
  // app.js calls this when Download all is tapped: during the lesson it plays the animation instead of saving a file.
  function interceptDownload() {
    if (!ui || type !== 'tab') return false;
    const st = steps[idx];
    if (!st || st.k !== 'salary.download') return false;
    playDownload();
    return true;
  }

  window.TUTORIAL = {
    visit, interceptDownload,
    start(kind) {
      if ((kind || 'main') === 'main' && userId) Object.keys(TAB_SETS).forEach(v => store.set(TABFLAG + v + ':' + userId, ''));   // replay also replays the tab lessons
      start(kind || 'main');
    },
    practicing() { return !!ui && type === 'practice'; },
    quickEntry() { return !!ui && steps[idx] && steps[idx].prefix === 'quick'; },
    quickEntryValues(kind) {
      const key = kind === 'supplier' ? 'client' : kind;
      return quickValues[key] ? [quickValues[key]] : [];
    },
    // Called when Add entry is tapped. Returns true when the form should open in practice mode.
    interceptAdd() {
      if (!ui) return false;
      const step = steps[idx];
      return type === 'main' ? !!(step && step.practice) : type === 'practice';
    },
    event,
    // Called by app.js once the workspace has loaded. Shows the main tour once per account on this device.
    autoStart(u) {
      if (!u || !u.id || u.demo) return;
      userId = u.id; role = u.role === 'sewer' ? 'sewer' : 'owner';
      if (store.get(FLAG.main + u.id)) return;
      setTimeout(() => {
        const auth = document.getElementById('auth'), onb = document.getElementById('onboarding');
        if ((auth && !auth.hidden) || (onb && !onb.hidden) || ui) return;
        start('main');
      }, 700);
    }
  };
})();
