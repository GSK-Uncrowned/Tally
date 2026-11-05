/* Tally tutorials: dim the screen, spotlight a real control and explain it in a speech bubble.
   The main tour includes the tab-by-tab walkthrough and hands-on Add entry practice.
   Interactive steps wait for the user to really do the thing (app.js reports it through TUTORIAL.event).
   Texts (English + Filipino, first draft) are registered with I18N.extend().
   To remove: delete this file, tutorial.css, their two tags in index.html and the lines marked TUTORIAL in app.js. */
(function () {
  const en = {
    'tut.continue': 'Continue', 'tut.done': 'Done', 'tut.skip': 'Skip', 'tut.skipStep': 'Skip step', 'tut.tapHint': 'Tap the highlighted option to continue.', 'tut.step': 'Step {n} of {total}',
    // main tour
    'tut.owner.add.title': 'Add entry',
    'tut.owner.add.text': 'Tap here to log work. The first time, you type in new values: the supplier, the item, the color and the size. Tally saves them, so next time you just pick them from the list.',
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
    'tut.sewer.add.title': 'Add entry',
    'tut.sewer.add.text': 'Tap here to log what you sewed. The first time, type in new values: the supplier, the item, the color and the size. Tally saves them, so next time you just pick them from the list.',
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
    'tut.p.start.text': 'Tap Add entry to begin. This is only practice, so nothing will be saved.',
    'tut.p.client.title': 'Who is it from?',
    'tut.p.client.text': 'When a value is already saved, just tap it. Start by choosing the supplier for this work.',
    'tut.p.item.title': 'What are you sewing?',
    'tut.p.item.text': 'Choose the saved item from the list. You only type a new item once.',
    'tut.p.color.title': 'What color is it?',
    'tut.p.color.text': 'Choose the saved color. Existing entries make this step a quick tap.',
    'tut.p.size.title': 'What size is it?',
    'tut.p.size.text': 'Choose the saved size. The next field opens automatically.',
    'tut.p.qty.title': 'How many pieces?',
    'tut.p.qty.text': 'Type how many pieces you finished, then tap Save entry.',
    'tut.p.done.title': 'Great job!',
    'tut.p.done.text': 'That was only practice, so nothing was saved. Real entries work the same way, and the new values you type are remembered for next time.',
    'tut.quick.intro.title': 'Next time is faster',
    'tut.quick.intro.text': 'Once your usual values are saved, adding another entry is just a few taps: supplier, item, color and size. Then enter the quantity.',
    'tut.quick.start.title': 'Try a repeat entry',
    'tut.quick.start.text': 'Tap Add entry and watch how quickly a familiar entry can be recorded.',
    'tut.quick.client.title': 'Tap the saved supplier',
    'tut.quick.client.text': 'Choose the supplier you already use.',
    'tut.quick.item.title': 'Tap the saved item',
    'tut.quick.item.text': 'Choose the item. No typing needed.',
    'tut.quick.color.title': 'Tap the saved color',
    'tut.quick.color.text': 'Choose the color with one tap.',
    'tut.quick.size.title': 'Tap the saved size',
    'tut.quick.size.text': 'Choose the size. The next field opens automatically.',
    'tut.quick.qty.title': 'Enter the quantity',
    'tut.quick.qty.text': 'Type the number of pieces and save the entry.',
    'tut.quick.done.title': 'That is it!',
    'tut.quick.done.text': 'For familiar work, it is just tap, tap, tap, tap, quantity, done.',
  };
  const fil = {
    'tut.continue': 'Magpatuloy', 'tut.done': 'Tapos na', 'tut.skip': 'Laktawan', 'tut.skipStep': 'Laktawan ang hakbang', 'tut.tapHint': 'Pindutin ang naka-highlight na pagpipilian para magpatuloy.', 'tut.step': 'Hakbang {n} ng {total}',
    'tut.owner.add.title': 'Magdagdag ng tala',
    'tut.owner.add.text': 'Dito ka magtatala ng trabaho. Sa unang beses, ilagay ang supplier, item, kulay at laki. Sa susunod, piliin na lang sila sa listahan.',
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
    'tut.sewer.add.title': 'Magdagdag ng tala',
    'tut.sewer.add.text': 'Dito itatala ang tinahi mo. Sa unang beses, ilagay ang supplier, item, kulay at laki. Sa susunod, piliin na lang sila.',
    'tut.sewer.logs.title': 'Aking talaan',
    'tut.sewer.logs.text': 'Lahat ng tinahi mo, araw-araw.',
    'tut.sewer.pay.title': 'Sahod at Pananalapi',
    'tut.sewer.pay.text': 'Ipinapakita ng Sahod ang kita mo sa linggo. Ipinapakita ng Pananalapi ang kita sa kalendaryo.',
    'tut.sewer.settings.title': 'Iyong account',
    'tut.sewer.settings.text': 'Dito ang Settings: wika, laki ng letra at tutorial.',
    'tut.practiceNote': 'Pagsasanay lang: walang mase-save. Karamihan ng field ay may laman na, kaya mabilis lang ang pagpindot.',
    'tut.p.otherHint': 'I-type ang bagong pangalan, saka pindutin ang Magpatuloy.',
    'tut.p.start.title': 'Magsanay tayo',
    'tut.p.start.text': 'Pindutin ang Magdagdag ng tala para magsimula. Pagsasanay lang ito, kaya walang mase-save.',
    'tut.p.client.title': 'Kanino galing ito?',
    'tut.p.client.text': 'Kapag naka-save na ang halaga, pindutin lang ito. Piliin muna ang supplier ng trabahong ito.',
    'tut.p.item.title': 'Ano ang tinatahi mo?',
    'tut.p.item.text': 'Piliin ang naka-save na item sa listahan. Isang beses mo lang ita-type ang bagong item.',
    'tut.p.color.title': 'Anong kulay ito?',
    'tut.p.color.text': 'Piliin ang naka-save na kulay. Mabilis lang ito kapag may mga dating tala.',
    'tut.p.size.title': 'Anong laki ito?',
    'tut.p.size.text': 'Piliin ang naka-save na laki. Awtomatikong bubukas ang susunod na field.',
    'tut.p.qty.title': 'Ilang piraso?',
    'tut.p.qty.text': 'I-type kung ilang piraso ang natapos mo, saka pindutin ang I-save ang tala.',
    'tut.p.done.title': 'Mahusay!',
    'tut.p.done.text': 'Pagsasanay lang iyon, kaya walang na-save. Ganito rin ang mga tunay na tala, at maaalala ang mga bagong halagang ita-type mo sa susunod.',
    'tut.quick.intro.title': 'Mas mabilis sa susunod',
    'tut.quick.intro.text': 'Kapag naka-save na ang mga karaniwang halaga, ilang pindot na lang: supplier, item, kulay at laki. Saka ilagay ang dami.',
    'tut.quick.start.title': 'Subukan ang paulit-ulit na tala',
    'tut.quick.start.text': 'Pindutin ang Magdagdag ng tala at tingnan kung gaano kabilis magtala ng pamilyar na trabaho.',
    'tut.quick.client.title': 'Pindutin ang naka-save na supplier',
    'tut.quick.client.text': 'Piliin ang dati mong supplier.',
    'tut.quick.item.title': 'Pindutin ang naka-save na item',
    'tut.quick.item.text': 'Piliin ang item. Hindi na kailangang mag-type.',
    'tut.quick.color.title': 'Pindutin ang naka-save na kulay',
    'tut.quick.color.text': 'Piliin ang kulay sa isang pindot.',
    'tut.quick.size.title': 'Pindutin ang naka-save na laki',
    'tut.quick.size.text': 'Piliin ang laki. Awtomatikong bubukas ang susunod na field.',
    'tut.quick.qty.title': 'Ilagay ang dami',
    'tut.quick.qty.text': 'I-type ang bilang ng piraso at i-save ang tala.',
    'tut.quick.done.title': 'Iyon na!',
    'tut.quick.done.text': 'Para sa pamilyar na trabaho, pindot, pindot, pindot, pindot, dami, tapos.',
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
    practiceStep({sel: practiceTarget, wait: wizAt(1), other: true}, 'client'),
    practiceStep({sel: practiceTarget, wait: wizAt(2), other: true}, 'item'),
    practiceStep({sel: practiceTarget, wait: wizAt(3), other: true}, 'color'),
    practiceStep({sel: practiceTarget, wait: wizAt(4), other: true}, 'size'),
    practiceStep({sel: '#dlg', wait: name => name === 'practice-done'}, 'qty'),
    practiceStep({center: true}, 'done')
  ];
  const QUICK_STEPS = [
    quickStep({center: true}, 'intro'),
    quickStep({view: 'HOME', sel: '.fab', wait: name => name === 'wizard'}, 'start'),
    quickStep({sel: practiceTarget, wait: wizAt(1)}, 'client'),
    quickStep({sel: practiceTarget, wait: wizAt(2)}, 'item'),
    quickStep({sel: practiceTarget, wait: wizAt(3)}, 'color'),
    quickStep({sel: practiceTarget, wait: wizAt(4)}, 'size'),
    quickStep({sel: '#dlg', wait: name => name === 'practice-done'}, 'qty'),
    quickStep({center: true}, 'done')
  ];
  const SETS = {
    owner: [
      { view: 'log', sel: '.fab', k: 'add' },
      { view: 'setup', sel: NAV('setup'), k: 'setup' },
      { view: 'sewers', sel: NAV('sewers'), k: 'salary' },
      { view: 'suppliers', sel: NAV('suppliers'), k: 'suppliers' },
      { view: 'finance', sel: NAV('finance'), k: 'finance' },
      { view: 'log', sel: MENU, k: 'settings' },
      ...PRACTICE_STEPS,
      ...QUICK_STEPS
    ],
    sewer: [
      { view: 'my-log', sel: '.fab', k: 'add' },
      { view: 'my-log', sel: NAV('my-log'), k: 'logs' },
      { view: 'my-salary', sel: NAV('my-salary'), k: 'pay' },
      { view: 'my-log', sel: MENU, k: 'settings' },
      ...PRACTICE_STEPS,
      ...QUICK_STEPS
    ],
  };
  const PREFIX = { owner: 'tut.owner.', sewer: 'tut.sewer.', practice: 'tut.p.', quick: 'tut.quick.' };
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
    const d = dlgEl(); if (d) d.addEventListener('close', onDlgClose);
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

  function finish(completed) {
    token++;
    const was = type;
    if (ui) { ui.remove(); ui = null; }
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    const d = dlgEl(); if (d) d.removeEventListener('close', onDlgClose);
    if (userId && FLAG[was]) store.set(FLAG[was] + userId, '1');
    type = null;
    if (was === 'main') { const h = document.querySelector(NAV(home())); if (h && !h.hidden) h.click(); }
    if (d && d.open) d.close();
  }

  async function go(i) {
    const my = ++token;
    if (i >= steps.length) { finish(true); return; }
    idx = i;
    const step = steps[i];
    step.base = { lang: I18N.lang(), size: I18N.textSize() };
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
    if (!step.center && !visible(typeof step.sel === 'function' ? step.sel() : document.querySelector(step.sel))) { go(i + 1); return; }  // target not on screen: skip
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
    const r = el.getBoundingClientRect(), pad = 6;
    const hx = Math.max(0, r.left - pad), hy = Math.max(0, r.top - pad), hw = r.width + 2 * pad, hh = r.height + 2 * pad;
    hole.style.left = hx + 'px'; hole.style.top = hy + 'px'; hole.style.width = hw + 'px'; hole.style.height = hh + 'px';
    const radius = getComputedStyle(el).borderRadius;
    hole.style.borderRadius = radius === '0px' ? '12px' : radius;
    const pointer = ui.querySelector('.tut-pointer');
    pointer.style.display = step.wait ? 'block' : 'none';
    pointer.style.left = Math.max(8, Math.min(vw - 40, r.left + r.width / 2 - 16)) + 'px';
    pointer.style.top = Math.max(8, r.top - 48) + 'px';
    if (step.wait) {   // interactive: everything outside the spotlight is blocked, the spotlight itself is tappable
      block.style.display = 'none';
      const rects = [[0, 0, vw, hy], [0, hy + hh, vw, Math.max(0, vh - hy - hh)], [0, hy, hx, hh], [hx + hw, hy, Math.max(0, vw - hx - hw), hh]];
      masks.forEach((m, n) => { m.style.display = 'block'; m.style.left = rects[n][0] + 'px'; m.style.top = rects[n][1] + 'px'; m.style.width = rects[n][2] + 'px'; m.style.height = rects[n][3] + 'px'; });
    } else {
      block.style.display = 'block'; masks.forEach(m => { m.style.display = 'none'; });
    }
    const gap = 16;
    const below = (vh - r.bottom - pad) >= bh + gap + 8 || (r.top - pad) < bh + gap + 8;
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    const top = below ? r.bottom + pad + gap : Math.max(12, r.top - pad - gap - bh);
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
    bubble.classList.toggle('below', below); bubble.classList.toggle('above', !below);
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

  window.TUTORIAL = {
    start(kind) { start(kind || 'main'); },
    practicing() { return !!ui && type === 'practice'; },
    quickEntry() { return !!ui && steps[idx] && steps[idx].prefix === 'quick'; },
    quickEntryValues(kind) { return quickValues[kind] ? [quickValues[kind]] : []; },
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
