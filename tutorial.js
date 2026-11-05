/* Tally tutorial: dims the screen, spotlights a real button and explains it in a speech bubble.
   Runs once for each new account, and again from Settings > Replay tutorial.
   Texts live here (English + Filipino, first draft) and are registered with I18N.extend().
   To remove: delete this file, tutorial.css, their two tags in index.html and the lines marked TUTORIAL in app.js. */
(function () {
  const en = {
    'tut.continue': 'Continue', 'tut.done': 'Done', 'tut.skip': 'Skip', 'tut.step': 'Step {n} of {total}',
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
    'tut.sewer.settings.text': 'Tap here for Settings: change the language and text size, or replay this tutorial.'
  };
  const fil = {
    'tut.continue': 'Magpatuloy', 'tut.done': 'Tapos na', 'tut.skip': 'Laktawan', 'tut.step': 'Hakbang {n} ng {total}',
    'tut.owner.add.title': 'Magdagdag ng tala',
    'tut.owner.add.text': 'Pindutin ito para magtala ng trabaho. Sa unang beses, ita-type mo ang mga bagong halaga: ang supplier, ang item, ang kulay at ang laki. Sine-save ito ng Tally, kaya sa susunod ay pipiliin mo na lang ito sa listahan.',
    'tut.owner.setup.title': 'Setup',
    'tut.owner.setup.text': 'Dito mo itatakda ang presyo at ang bayad sa mananahi para sa bawat item. Ginagamit ito ng Tally para kalkulahin ang sahod at tubo.',
    'tut.owner.salary.title': 'Sahod',
    'tut.owner.salary.text': 'Makikita rito ang sahod ng bawat mananahi sa linggo. Kapag tapos na ang linggo, pindutin ang Tapusin para i-lock ito at i-save ang mga payslip.',
    'tut.owner.suppliers.title': 'Mga Supplier',
    'tut.owner.suppliers.text': 'Makikita rito kung magkano ang dapat bayaran ng bawat supplier sa linggo, at puwede mong i-download ang statement kapag natapos na ang linggo.',
    'tut.owner.finance.title': 'Pananalapi',
    'tut.owner.finance.text': 'Makikita rito ang iyong kita, ang sahod ng mga mananahi at ang tubo sa kalendaryo. Pindutin ang isang linggo o araw para sa detalye.',
    'tut.owner.settings.title': 'Iyong account',
    'tut.owner.settings.text': 'Pindutin ito para sa Settings: mag-imbita ng mga mananahi, palitan ang wika at laki ng letra, o panoorin muli ang tutorial.',
    'tut.sewer.add.title': 'Magdagdag ng tala',
    'tut.sewer.add.text': 'Pindutin ito para itala ang tinahi mo. Sa unang beses, i-type ang mga bagong halaga: ang supplier, ang item, ang kulay at ang laki. Sine-save ito ng Tally, kaya sa susunod ay pipiliin mo na lang ito sa listahan.',
    'tut.sewer.logs.title': 'Aking talaan',
    'tut.sewer.logs.text': 'Lahat ng tinahi mo, araw-araw.',
    'tut.sewer.pay.title': 'Sahod at Pananalapi',
    'tut.sewer.pay.text': 'Ipinapakita ng Sahod ang iyong sahod sa linggo. Ipinapakita ng Pananalapi ang iyong kinita sa kalendaryo.',
    'tut.sewer.settings.title': 'Iyong account',
    'tut.sewer.settings.text': 'Pindutin ito para sa Settings: palitan ang wika at laki ng letra, o panoorin muli ang tutorial.'
  };
  I18N.extend(en, fil);

  const NAV = v => 'nav [data-view="' + v + '"]';
  const MENU = '.profile-menu > summary';
  const STEPS = {
    owner: [
      { view: 'log', sel: '.fab', k: 'add' },
      { view: 'setup', sel: NAV('setup'), k: 'setup' },
      { view: 'sewers', sel: NAV('sewers'), k: 'salary' },
      { view: 'suppliers', sel: NAV('suppliers'), k: 'suppliers' },
      { view: 'finance', sel: NAV('finance'), k: 'finance' },
      { view: 'log', sel: MENU, k: 'settings' }
    ],
    sewer: [
      { view: 'my-log', sel: '.fab', k: 'add' },
      { view: 'my-log', sel: NAV('my-log'), k: 'logs' },
      { view: 'my-salary', sel: NAV('my-salary'), k: 'pay' },
      { view: 'my-log', sel: MENU, k: 'settings' }
    ]
  };

  const t = k => I18N.t(k);
  const doneKey = id => 'tally.tutorial.done:' + id;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    }
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  let ui = null, steps = [], role = 'owner', idx = 0, userId = null, token = 0;

  function build() {
    ui = document.createElement('div');
    ui.className = 'tut';
    ui.innerHTML =
      '<div class="tut-block"></div><div class="tut-hole"></div>' +
      '<div class="tut-bubble" role="dialog" aria-modal="true" aria-labelledby="tut-title">' +
      '<div class="tut-arrow"></div><p class="tut-count"></p><h3 id="tut-title" class="tut-title"></h3><p class="tut-text"></p>' +
      '<div class="tut-actions"><button type="button" class="tut-skip"></button><button type="button" class="tut-next"></button></div></div>';
    document.body.appendChild(ui);
    ui.querySelector('.tut-next').addEventListener('click', () => go(idx + 1));
    ui.querySelector('.tut-skip').addEventListener('click', finish);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
  }
  function onKey(ev) { if (ui && ev.key === 'Escape') finish(); }

  function goHome() {
    const home = document.querySelector(NAV(role === 'owner' ? 'log' : 'my-log'));
    if (home && !home.hidden) home.click();
  }
  function finish() {
    token++;
    if (ui) { ui.remove(); ui = null; }
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    if (userId) store.set(doneKey(userId), '1');
    goHome();
  }

  async function go(i) {
    const my = ++token;
    if (i >= steps.length) { finish(); return; }
    idx = i;
    const step = steps[i];
    const btn = document.querySelector(NAV(step.view));
    if (btn && !btn.hidden) btn.click();
    await wait(220);
    if (my !== token || !ui) return;
    const el = document.querySelector(step.sel);
    if (!visible(el)) { go(i + 1); return; }  // target not on screen: skip this step
    const base = 'tut.' + role + '.' + step.k;
    ui.querySelector('.tut-count').textContent = t('tut.step').replace('{n}', i + 1).replace('{total}', steps.length);
    ui.querySelector('.tut-title').textContent = t(base + '.title');
    ui.querySelector('.tut-text').textContent = t(base + '.text');
    const last = i === steps.length - 1;
    const next = ui.querySelector('.tut-next');
    next.textContent = last ? t('tut.done') : t('tut.continue');
    const skip = ui.querySelector('.tut-skip');
    skip.textContent = t('tut.skip');
    skip.hidden = last;
    ui.dataset.target = step.sel;
    place();
    next.focus({ preventScroll: true });
  }

  // Put the spotlight on the target and the bubble (with its arrow) next to it.
  function place() {
    if (!ui) return;
    const el = document.querySelector(ui.dataset.target || '');
    if (!visible(el)) return;
    const r = el.getBoundingClientRect(), pad = 6, vw = window.innerWidth, vh = window.innerHeight;
    const hole = ui.querySelector('.tut-hole');
    hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
    hole.style.width = (r.width + 2 * pad) + 'px'; hole.style.height = (r.height + 2 * pad) + 'px';
    hole.style.borderRadius = getComputedStyle(el).borderRadius === '0px' ? '12px' : getComputedStyle(el).borderRadius;
    const bubble = ui.querySelector('.tut-bubble');
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, gap = 16;
    const below = (vh - r.bottom - pad) >= bh + gap + 8 || (r.top - pad) < bh + gap + 8;
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    const top = below ? r.bottom + pad + gap : Math.max(12, r.top - pad - gap - bh);
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
    bubble.classList.toggle('below', below); bubble.classList.toggle('above', !below);
    const ax = Math.max(22, Math.min(bw - 22, r.left + r.width / 2 - left));
    bubble.querySelector('.tut-arrow').style.left = (ax - 7) + 'px';
  }

  function start(r, id) {
    if (ui) finish();
    role = r === 'sewer' ? 'sewer' : 'owner';
    steps = STEPS[role]; userId = id || userId;
    build();
    go(0);
  }

  window.TUTORIAL = {
    start(r) { start(r, userId); },
    // Called by app.js once the workspace has loaded. Shows the tutorial once per account on this device.
    autoStart(u) {
      if (!u || !u.id || u.demo) return;
      userId = u.id;
      if (store.get(doneKey(u.id))) return;
      setTimeout(() => {
        const auth = document.getElementById('auth'), onb = document.getElementById('onboarding');
        if ((auth && !auth.hidden) || (onb && !onb.hidden) || ui) return;
        start(u.role, u.id);
      }, 700);
    }
  };
})();
