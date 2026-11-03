/* Tally language + text size. Loaded before app.js.
   Step 1: only Settings, the account menu and the language screen use t().
   Other screens are translated in step 2 by adding keys here and calling t('key') in app.js.
   Filipino wording is a first draft: ask a native speaker to check it. */
(function () {
  const LANG_KEY = 'tally.lang', SIZE_KEY = 'tally.textsize';

  const dict = {
    en: {
      'lang.title': 'Choose your language',
      'lang.hint': 'You can change this later in Settings.',
      'role.owner': 'Owner',
      'role.sewer': 'Sewer',
      'menu.settings': 'Settings',
      'menu.logout': 'Log out',
      'menu.demoExit': 'Back to my workspace',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.textSize': 'Text size',
      'settings.size.normal': 'Normal',
      'settings.size.large': 'Large',
      'settings.name': 'My name',
      'settings.name.save': 'Save',
      'settings.name.saved': 'Saved.',
      'settings.name.short': 'Please enter your name.',
      'settings.name.fail': 'Could not save your name: ',
      'settings.tutorial': 'Tutorial',
      'settings.tutorial.replay': 'Replay tutorial',
      'settings.tutorial.soon': 'Coming soon',
      'settings.workspace': 'Workspace',
      'settings.org': 'Organization',
      'settings.role': 'Your role',
      'settings.invite': 'Invite sewers',
      'settings.demo': 'Try isolated demo data',
      'settings.about': 'About',
      'settings.about.text': 'Tally is a simple sewing log and income tracker.',
      'settings.version': 'Version'
    },
    fil: {
      'lang.title': 'Piliin ang wika',
      'lang.hint': 'Mababago mo ito mamaya sa Settings.',
      'role.owner': 'May-ari',
      'role.sewer': 'Mananahi',
      'menu.settings': 'Settings',
      'menu.logout': 'Mag-log out',
      'menu.demoExit': 'Bumalik sa aking workspace',
      'settings.title': 'Settings',
      'settings.language': 'Wika',
      'settings.textSize': 'Laki ng letra',
      'settings.size.normal': 'Karaniwan',
      'settings.size.large': 'Malaki',
      'settings.name': 'Aking pangalan',
      'settings.name.save': 'I-save',
      'settings.name.saved': 'Nai-save na.',
      'settings.name.short': 'Pakilagay ang iyong pangalan.',
      'settings.name.fail': 'Hindi na-save ang iyong pangalan: ',
      'settings.tutorial': 'Tutorial',
      'settings.tutorial.replay': 'Panoorin muli ang tutorial',
      'settings.tutorial.soon': 'Malapit na',
      'settings.workspace': 'Workspace',
      'settings.org': 'Organisasyon',
      'settings.role': 'Iyong tungkulin',
      'settings.invite': 'Mag-imbita ng mga mananahi',
      'settings.demo': 'Subukan ang demo data',
      'settings.about': 'Tungkol sa app',
      'settings.about.text': 'Ang Tally ay isang simpleng talaan ng mga tinahi at kita.',
      'settings.version': 'Bersyon'
    }
  };

  // Step 2, part A: navigation, rate dialog, login screen
  Object.assign(dict.en, {
      "common.back": "Back",
      "common.cancel": "Cancel",
      "common.continue": "Continue",
      "nav.log": "Log",
      "nav.salary": "Salary",
      "nav.suppliers": "Suppliers",
      "nav.finance": "Finance",
      "nav.setup": "Setup",
      "nav.myLogs": "My logs",
      "rate.title": "Set price & sewer pay",
      "rate.price": "Price per piece (₱)",
      "rate.pay": "Sewer pay per piece (₱)",
      "rate.save": "Save rate",
      "auth.name": "Your name",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.or": "or",
      "auth.google": "Continue with Google",
      "auth.createTitle": "Create your account",
      "auth.welcome": "Welcome back",
      "auth.signup": "Sign up",
      "auth.login": "Log in",
      "auth.loginSub": "Log in to continue",
      "auth.switchToLogin": "Already have an account? <strong>Log in</strong>",
      "auth.switchToSignup": "Don't have an account? <strong>Sign up</strong>",
      "auth.checkEmail": "Check your email",
      "auth.confirmMsg": "We sent a confirmation link to <strong id=\"confirm-email\"></strong>. Open it to activate your account.",
      "auth.creating": "Creating your account…",
      "auth.settingUp": "Setting up {email}. Just a moment.",
      "auth.resend": "Resend email",
      "auth.backToSignup": "Back to sign up"
  });
  Object.assign(dict.fil, {
      "common.back": "Bumalik",
      "common.cancel": "Kanselahin",
      "common.continue": "Magpatuloy",
      "nav.log": "Talaan",
      "nav.salary": "Sahod",
      "nav.suppliers": "Mga Supplier",
      "nav.finance": "Pananalapi",
      "nav.setup": "Setup",
      "nav.myLogs": "Aking talaan",
      "rate.title": "Itakda ang presyo at bayad sa mananahi",
      "rate.price": "Presyo bawat piraso (₱)",
      "rate.pay": "Bayad sa mananahi bawat piraso (₱)",
      "rate.save": "I-save ang rate",
      "auth.name": "Iyong pangalan",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.or": "o",
      "auth.google": "Magpatuloy gamit ang Google",
      "auth.createTitle": "Gumawa ng account",
      "auth.welcome": "Maligayang pagbabalik",
      "auth.signup": "Mag-sign up",
      "auth.login": "Mag-log in",
      "auth.loginSub": "Mag-log in para magpatuloy",
      "auth.switchToLogin": "May account ka na? <strong>Mag-log in</strong>",
      "auth.switchToSignup": "Wala ka pang account? <strong>Mag-sign up</strong>",
      "auth.checkEmail": "Tingnan ang iyong email",
      "auth.confirmMsg": "Nagpadala kami ng confirmation link sa <strong id=\"confirm-email\"></strong>. Buksan ito para ma-activate ang iyong account.",
      "auth.creating": "Ginagawa ang iyong account…",
      "auth.settingUp": "Inihahanda ang {email}. Sandali lang po.",
      "auth.resend": "Ipadala muli ang email",
      "auth.backToSignup": "Bumalik sa sign up"
  });

  // Step 2, part B: main screens
  Object.assign(dict.en, {
      "entry.delete": "Delete entry",
      "entry.keep": "Keep it",
      "entry.deleteAsk": "Delete this entry? This can't be undone.",
      "log.add": "Add entry",
      "log.locked": "This week is finalized, so its entries are locked.",
      "log.none": "Nothing logged this week.",
      "log.noneMine": "No logs this week.",
      "view.mySalary": "My salary",
      "tot.yourPay": "Your pay",
      "view.myFinance": "My finance",
      "fin.yourEarnings": "Your earnings",
      "fin.tapMine": "Tap a week or day to see your earnings and logs.",
      "fin.earnings": "Earnings",
      "unit.piecesCap": "Pieces",
      "sal.lower": "salary",
      "sal.noSewers": "No sewers recorded.",
      "fin.tapWeek": "Tap a week on the left, or any day, to see what was sewn.",
      "fin.reopenWeek": "Reopen week",
      "fin.entriesLocked": "Entries for this week are locked.",
      "fin.finalizeWeek": "Finalize week",
      "tot.sewerPay": "Total sewer pay",
      "sal.noneWeek": "No sewers were logged this week.",
      "fin.notFinalSlip": "Not final yet. You can download the payslip after the week is finalized.",
      "fin.notFinalStmt": "Not final yet. You can download the statement after the week is finalized.",
      "fin.inProgressMine": "In progress, not final. You can download your payslip once the owner finalizes the week.",
      "fin.nothingWeek": "Nothing this week.",
      "fin.total": "Total",
      "fin.payPer": "Pay for this week, per sewer",
      "fin.afterNote": "After this, entries for this week can’t be added or deleted, and each sewer gets a saved payslip. You can reopen the week later.",
      "fin.finalize": "Finalize",
      "fin.reopenNote": "The week unlocks and its saved payslips are removed. Finalize it again when you’re done.",
      "fin.reopen": "Reopen",
      "tot.fromSuppliers": "Total from suppliers",
      "sup.none": "No suppliers logged this week.",
      "setup.noValues": "No values yet.",
      "setup.manage": "Manage rates and the options used when logging work.",
      "setup.setRate": "Set rate",
      "setup.allSet": "Everything used in your entries has a price and sewer pay.",
      "setup.priceTitle": "Price &amp; sewer pay",
      "setup.addRate": "Add rate",
      "common.edit": "Edit",
      "setup.noRates": "No rates yet.",
      "common.add": "Add",
      "wk.inProgress": "In progress",
      "wk.notFinal": "Not finalized",
      "rate.needed": "Rate needed",
      "wk.this": "This week",
      "wk.last": "Last week",
      "wk.next": "Next week",
      "word.to": "to",
      "fin.weekOf": "Week of",
      "fin.totalPay": "Total pay",
      "fin.finalizeTitle": "Finalize {week}?",
      "fin.reopenTitle": "Reopen {week}?",
      "setup.needs": "Needs attention",
      "setup.items": "Items",
      "setup.sizes": "Sizes",
      "setup.colors": "Colors",
      "setup.suppliers": "Suppliers",
      "fin.missing1": "1 entry has no rate yet. Set it in Setup first so nobody is underpaid.",
      "fin.missingN": "{n} entries have no rate yet. Set them in Setup first so nobody is underpaid.",
      "aria.prev": "Previous week",
      "aria.next": "Next week",
      "aria.delete": "Delete this entry",
      "aria.close": "Close",
      "dow.mon": "Mon",
      "dow.tue": "Tue",
      "dow.wed": "Wed",
      "dow.thu": "Thu",
      "dow.fri": "Fri",
      "dow.sat": "Sat",
      "dow.sun": "Sun",
      "unit.pcs": "pcs",
      "unit.pieces": "pieces"
  });
  Object.assign(dict.fil, {
      "entry.delete": "Burahin ang tala",
      "entry.keep": "Huwag burahin",
      "entry.deleteAsk": "Burahin ang tala na ito? Hindi na ito maibabalik.",
      "log.add": "Magdagdag ng tala",
      "log.locked": "Tapos na ang linggong ito, kaya naka-lock ang mga tala.",
      "log.none": "Walang naitalang tinahi ngayong linggo.",
      "log.noneMine": "Walang tala ngayong linggo.",
      "view.mySalary": "Aking sahod",
      "tot.yourPay": "Iyong sahod",
      "view.myFinance": "Aking kita",
      "fin.yourEarnings": "Iyong kinita",
      "fin.tapMine": "Pindutin ang isang linggo o araw para makita ang iyong kita at mga tala.",
      "fin.earnings": "Kita",
      "unit.piecesCap": "Piraso",
      "sal.lower": "sahod",
      "sal.noSewers": "Walang naitalang mananahi.",
      "fin.tapWeek": "Pindutin ang isang linggo sa kaliwa, o anumang araw, para makita ang mga tinahi.",
      "fin.reopenWeek": "Buksan muli ang linggo",
      "fin.entriesLocked": "Naka-lock ang mga tala ngayong linggo.",
      "fin.finalizeWeek": "Tapusin ang linggo",
      "tot.sewerPay": "Kabuuang sahod ng mga mananahi",
      "sal.noneWeek": "Walang mananahing naitala ngayong linggo.",
      "fin.notFinalSlip": "Hindi pa tapos. Maaari mong i-download ang payslip pagkatapos tapusin ang linggo.",
      "fin.notFinalStmt": "Hindi pa tapos. Maaari mong i-download ang statement pagkatapos tapusin ang linggo.",
      "fin.inProgressMine": "Isinasagawa pa, hindi pa tapos. Maaari mong i-download ang iyong payslip kapag natapos na ng may-ari ang linggo.",
      "fin.nothingWeek": "Wala ngayong linggo.",
      "fin.total": "Kabuuan",
      "fin.payPer": "Sahod ngayong linggo, bawat mananahi",
      "fin.afterNote": "Pagkatapos nito, hindi na maidaragdag o mabubura ang mga tala ngayong linggo, at bawat mananahi ay magkakaroon ng naka-save na payslip. Maaari mong buksan muli ang linggo mamaya.",
      "fin.finalize": "Tapusin",
      "fin.reopenNote": "Mabubuksan ang linggo at buburahin ang mga naka-save na payslip. Tapusin itong muli kapag tapos ka na.",
      "fin.reopen": "Buksan muli",
      "tot.fromSuppliers": "Kabuuang mula sa mga supplier",
      "sup.none": "Walang supplier na naitala ngayong linggo.",
      "setup.noValues": "Wala pang laman.",
      "setup.manage": "Pamahalaan ang mga rate at mga opsyon na ginagamit sa pagtatala ng trabaho.",
      "setup.setRate": "Itakda ang rate",
      "setup.allSet": "Lahat ng ginamit sa iyong mga tala ay may presyo at bayad sa mananahi.",
      "setup.priceTitle": "Presyo at bayad sa mananahi",
      "setup.addRate": "Magdagdag ng rate",
      "common.edit": "I-edit",
      "setup.noRates": "Wala pang rate.",
      "common.add": "Idagdag",
      "wk.inProgress": "Isinasagawa",
      "wk.notFinal": "Hindi pa tapos",
      "rate.needed": "Kailangan ng rate",
      "wk.this": "Ngayong linggo",
      "wk.last": "Nakaraang linggo",
      "wk.next": "Susunod na linggo",
      "word.to": "hanggang",
      "fin.weekOf": "Linggo ng",
      "fin.totalPay": "Kabuuang sahod",
      "fin.finalizeTitle": "Tapusin ang {week}?",
      "fin.reopenTitle": "Buksan muli ang {week}?",
      "setup.needs": "Kailangan ng pansin",
      "setup.items": "Mga item",
      "setup.sizes": "Mga laki",
      "setup.colors": "Mga kulay",
      "setup.suppliers": "Mga supplier",
      "fin.missing1": "May 1 tala na wala pang rate. Itakda muna ito sa Setup para walang makulangan ng bayad.",
      "fin.missingN": "May {n} tala na wala pang rate. Itakda muna ang mga ito sa Setup para walang makulangan ng bayad.",
      "aria.prev": "Nakaraang linggo",
      "aria.next": "Susunod na linggo",
      "aria.delete": "Burahin ang tala na ito",
      "aria.close": "Isara",
      "dow.mon": "Lun",
      "dow.tue": "Mar",
      "dow.wed": "Miy",
      "dow.thu": "Huw",
      "dow.fri": "Biy",
      "dow.sat": "Sab",
      "dow.sun": "Lin",
      "unit.pcs": "pcs",
      "unit.pieces": "piraso"
  });

  // Step 2, part C: entry wizard and messages
  Object.assign(dict.en, {
      "wiz.client": "Who is it from?",
      "wiz.item": "What are you sewing?",
      "wiz.color": "What color is it?",
      "wiz.size": "What size is it?",
      "wiz.qtyQ": "How many pieces?",
      "wiz.other": "Other",
      "wiz.new_client": "Type a new supplier",
      "wiz.new_item": "Type a new item",
      "wiz.new_color": "Type a new color",
      "wiz.new_size": "Type a new size",
      "wiz.qty": "Quantity",
      "wiz.close": "Close add entry",
      "wiz.step": "Step {n} of {total}",
      "wiz.today": "Today",
      "wiz.usingToday": "Using today · Change date",
      "wiz.save": "Save entry",
      "wiz.errQty": "Enter a quantity above 0.",
      "wiz.errChoose": "Choose an option or add a new value.",
      "wiz.datePrompt": "Use a different date (YYYY-MM-DD), or cancel to keep today:",
      "prompt.supplier": "Supplier name:",
      "prompt.item": "Item name:",
      "rate.errBoth": "Enter both a valid price and sewer pay.",
      "err.saveEntry": "Could not save entry: ",
      "err.addOption": "Could not add option: ",
      "err.delEntry": "Could not delete entry: ",
      "err.finalize": "Could not finalize this week: ",
      "err.reopen": "Could not reopen this week: ",
      "err.deleteLocked": "This week is finalized. Reopen it first to delete entries.",
      "err.noSlip": "There is no saved payslip for this person.",
      "err.noStmt": "Finalize this week first to download a statement.",
      "err.noSupRows": "Nothing logged for this supplier this week."
  });
  Object.assign(dict.fil, {
      "wiz.client": "Kanino galing ito?",
      "wiz.item": "Ano ang tinatahi mo?",
      "wiz.color": "Anong kulay ito?",
      "wiz.size": "Anong laki ito?",
      "wiz.qtyQ": "Ilang piraso?",
      "wiz.other": "Iba pa",
      "wiz.new_client": "Mag-type ng bagong supplier",
      "wiz.new_item": "Mag-type ng bagong item",
      "wiz.new_color": "Mag-type ng bagong kulay",
      "wiz.new_size": "Mag-type ng bagong laki",
      "wiz.qty": "Dami",
      "wiz.close": "Isara ang pagdagdag ng tala",
      "wiz.step": "Hakbang {n} ng {total}",
      "wiz.today": "Ngayon",
      "wiz.usingToday": "Ngayon ang petsa · Baguhin",
      "wiz.save": "I-save ang tala",
      "wiz.errQty": "Maglagay ng dami na higit sa 0.",
      "wiz.errChoose": "Pumili ng opsyon o magdagdag ng bago.",
      "wiz.datePrompt": "Gumamit ng ibang petsa (YYYY-MM-DD), o i-cancel para manatiling ngayon:",
      "prompt.supplier": "Pangalan ng supplier:",
      "prompt.item": "Pangalan ng item:",
      "rate.errBoth": "Maglagay ng tamang presyo at bayad sa mananahi.",
      "err.saveEntry": "Hindi na-save ang tala: ",
      "err.addOption": "Hindi naidagdag ang opsyon: ",
      "err.delEntry": "Hindi nabura ang tala: ",
      "err.finalize": "Hindi natapos ang linggo: ",
      "err.reopen": "Hindi nabuksan muli ang linggo: ",
      "err.deleteLocked": "Tapos na ang linggong ito. Buksan muna ito para makapagbura ng tala.",
      "err.noSlip": "Walang naka-save na payslip para sa taong ito.",
      "err.noStmt": "Tapusin muna ang linggo para ma-download ang statement.",
      "err.noSupRows": "Walang naitala para sa supplier na ito ngayong linggo."
  });

  Object.assign(dict.en, {"day.yesterday": "Yesterday", "rate.payShort": "pay"});
  Object.assign(dict.fil, {"day.yesterday": "Kahapon", "rate.payShort": "sahod"});

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: just don't remember */ }
    }
  };

  const saved = store.get(LANG_KEY);
  let lang = (saved === 'en' || saved === 'fil') ? saved : 'en';
  let size = store.get(SIZE_KEY) === 'large' ? 'large' : 'normal';

  // Fills static HTML marked with data-i18n="key" (nav, login screen, dialogs)
  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  }
  function applyLang() { document.documentElement.lang = lang === 'fil' ? 'fil' : 'en'; }
  function applySize() { document.documentElement.dataset.textsize = size; }
  applyLang(); applySize();

  function t(key) {
    const row = dict[lang] || dict.en;
    return row[key] != null ? row[key] : (dict.en[key] != null ? dict.en[key] : key);
  }

  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });

  function setLang(next) {
    if (next !== 'en' && next !== 'fil') return;
    lang = next; store.set(LANG_KEY, next); applyLang(); apply();
  }
  function setTextSize(next) {
    size = next === 'large' ? 'large' : 'normal'; store.set(SIZE_KEY, size); applySize();
  }

  // First open: a full-screen language picker. The app only starts after a choice.
  function showChooser() {
    const wrap = document.createElement('div');
    wrap.className = 'lang-screen';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Choose your language / Piliin ang wika');
    wrap.innerHTML =
      '<svg class="lang-logo" viewBox="0 7 48 35" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" aria-hidden="true">' +
      '<line x1="10" y1="11" x2="10.9" y2="38"/><line x1="19" y1="10" x2="18.3" y2="39.5"/><line x1="28" y1="12.5" x2="28.8" y2="37"/>' +
      '<line x1="37" y1="10" x2="36.8" y2="38.5"/><line x1="2.5" y1="37" x2="45.5" y2="12" stroke-width="3.2"/></svg>' +
      '<h1>Choose your language</h1><p class="lang-sub">Piliin ang wika</p>' +
      '<button class="lang-btn" data-lang="en" type="button">English</button>' +
      '<button class="lang-btn" data-lang="fil" type="button">Filipino</button>';
    wrap.addEventListener('click', ev => {
      const b = ev.target.closest('[data-lang]');
      if (!b) return;
      setLang(b.dataset.lang);
      wrap.remove();
      resolveReady();
    });
    document.body.appendChild(wrap);
    const first = wrap.querySelector('.lang-btn');
    if (first) first.focus();
  }

  apply();
  if (saved === 'en' || saved === 'fil') resolveReady(); else showChooser();

  window.I18N = {
    t, ready, apply, setLang, setTextSize,
    lang: () => lang,
    textSize: () => size
  };
})();
