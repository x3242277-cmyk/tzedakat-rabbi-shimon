/* העיצוב החדש על המערכת האמיתית: שכבת החיבור.
   נטען אחרי script.js, nd/data.js, nd/data-screens.js ו-nd/ui.js.

   איך זה עובד:
   - המנוע הקיים (script.js) ממשיך לעבוד כרגיל: טעינה, חישובים, שמירה, תור שינויים, הרשאות, ניתוק אוטומטי.
     המסך הישן שלו נשאר בדף, מוסתר (body.nd-on).
   - העיצוב החדש (nd/ui.js) מצויר בתוך shadow root, כך שהסגנונות של שני העולמות לא נוגעים זה בזה.
     הוא מקבל את הנתונים מ-NDData.build() ומ-NDScreens.build(), שקוראים את הנתונים האמיתיים.
   - כל שמירה עוברת דרך הפונקציות הקיימות (handleSaveDonation, handleSaveMember, handleSaveExpense):
     ממלאים את הטופס הישן (המוסתר) ומפעילים את השמירה שלו. כך אין שכפול של חוקי שמירה.
   - מה שעוד לא חובר נפתח ב"מסך הקודם" (body.nd-classic), עם כפתור חזרה. */
(function () {
  'use strict';

  // רשת ביטחון: בדפדפן ישן שלא מכיר את מה שהעיצוב החדש צריך, המערכת נשארת במסך הקודם כמו שהיה
  function supported() {
    try { return !!(window.Element && Element.prototype.attachShadow && window.CSS && CSS.supports && CSS.supports('selector(&)') && window.TZ_DIRS && window.TZ_DIRS.b1 && window.NDData && window.NDScreens); }
    catch (e) { return false; }
  }
  if (!supported()) return;
  document.body.classList.add('nd-on');

  var MAP = {
    dashboard: 'dashboard-screen', members: 'members-screen', transactions: 'daily-report-screen', expenses: 'expenses-summary-screen',
    purim: 'purim-registration-screen', grants: 'grants-screen', rules: 'rules-screen', settings: 'settings-screen'
  };
  var REV = {}; Object.keys(MAP).forEach(function (k) { REV[MAP[k]] = k; });
  var SET_TAB = { targets: 'targets', cats: 'categories', health: 'health', backup: 'backup', users: 'users', purim: 'purim-sums', audit: 'audit' };
  var TYPE_OLD = { 'ישי״ג': 'ישיבה גדולה', 'ישי״ק': 'ישיבה קטנה', 'קיבוץ': 'קיבוץ', 'חיידר': 'חיידר' };

  var ui = null, mounted = false, classic = false, pending = false, inGo = false;
  var year = null, grantsYear = null, capture = null;
  var orig = {}, decorators = [], dead = false;

  function el(id) { return document.getElementById(id); }
  function fn(name) { return typeof window[name] === 'function' ? window[name] : null; }
  function appState() { try { return typeof state !== 'undefined' && state ? state : {}; } catch (e) { return {}; } }
  function campaign() { try { return fn('getCampaignYear') ? window.getCampaignYear() : ''; } catch (e) { return ''; } }
  function loggedIn() { var m = el('main-screen'); return !!m && !m.classList.contains('hidden-layout'); }
  function body() { return document.body; }

  /* ---------- נתונים ---------- */
  function hebYears() { try { return typeof HEBREW_YEARS_ORDER !== 'undefined' && HEBREW_YEARS_ORDER ? HEBREW_YEARS_ORDER : []; } catch (e) { return []; } }
  function yearOptions() {
    // אותן שנים שהמערכת מציעה בחלון הפקדה והוצאה: ארבע אחורה, שנת הקמפיין, ואחת קדימה. שנת הקמפיין ראשונה.
    var all = hebYears(), c = campaign(), i = all.indexOf(c), list;
    if (i === -1) return c ? [c] : [];
    list = all.slice(Math.max(0, i - 4), i + 2).filter(function (y) { return y !== c; }).reverse();
    return [c].concat(list);
  }
  function dashboardYears() {
    var sel = el('dashboard-year-filter'), out = [], c = campaign();
    if (sel) Array.prototype.forEach.call(sel.options, function (o) { if (o.value && out.indexOf(o.value) === -1) out.push(o.value); });
    if (c && out.indexOf(c) === -1) out.push(c);
    var order = hebYears();
    out.sort(function (a, b) { return order.indexOf(b) - order.indexOf(a); });
    return out;
  }
  function normalize(d) {
    var X, years;
    d.yearly = d.yearly || []; d.monthly = d.monthly || []; d.alerts = d.alerts || []; d.activity = d.activity || [];
    d.leaderboard = d.leaderboard || []; d.frameworks = d.frameworks || []; d.yeshivas = d.yeshivas || []; d.expenseCategories = d.expenseCategories || [];
    d.grants = d.grants || { grooms: 0, packageValue: 0, cost: 0, stores: [] }; d.grants.stores = d.grants.stores || [];
    d.frames = d.frames || {};
    ['חיידר', 'ישי״ק', 'ישי״ג', 'קיבוץ'].forEach(function (k) { if (!Array.isArray(d.frames[k])) d.frames[k] = []; });
    X = d.expensesX;
    if (X) {
      years = X.years || (X.years = []);
      (X.categories || (X.categories = [])).forEach(function (c) {
        c.byYear = c.byYear || {}; c.items = c.items || [];
        years.forEach(function (y) { if (!(c.byYear[y] > 0)) c.byYear[y] = c.byYear[y] || 0; c.items.forEach(function (it) { if (it[y] == null) it[y] = 0; }); });
      });
    }
    X = d.purimX;
    if (X) {
      (X.groups || (X.groups = [])).forEach(function (g) {
        g.rows = g.rows || []; g.sums = g.sums || {}; if (g.addresses == null) g.addresses = g.rows.length;
        (X.years || []).forEach(function (y) { if (g.sums[y] == null) g.sums[y] = 0; g.rows.forEach(function (r) { r.amounts = r.amounts || {}; if (r.amounts[y] == null) r.amounts[y] = 0; }); });
      });
      X.cities = X.cities || [];
    }
    X = d.transactionsX;
    if (X) { X.grantsByYear = X.grantsByYear || {}; d.yearly.forEach(function (y) { if (X.grantsByYear[y.year] == null) X.grantsByYear[y.year] = 0; }); }
    if (d.settingsX && !Array.isArray(d.settingsX.categories)) d.settingsX.categories = [];
    return d;
  }
  function build() {
    if (!window.NDData || !window.NDScreens) return null;
    var d = window.NDData.build(year || undefined), x, k;
    if (!d) return null;
    try { x = window.NDScreens.build({ grantsYear: grantsYear }); } catch (e) { x = null; try { console.error('NDScreens.build failed', e); } catch (e2) {} }
    if (x) for (k in x) if (Object.prototype.hasOwnProperty.call(x, k)) d[k] = x[k];
    d.years = dashboardYears();
    d.yearOptions = yearOptions();
    normalize(d);
    // תוספות נתונים של מודולי החיבור (nd/host-*.js)
    decorators.forEach(function (f) { try { f(d); } catch (e) { try { console.error('nd decorate', e); } catch (e2) {} } });
    return d;
  }

  /* ---------- הצגה ---------- */
  function mount() {
    var host = el('nd-root');
    if (!host || !window.TZ_DIRS || !window.TZ_DIRS.b1 || typeof window.TZ_BODY !== 'string') return false;
    var shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'nd/ui.css';
    var ready = function () { if (!dead) body().classList.add('nd-ready'); };
    link.addEventListener('load', ready); link.addEventListener('error', ready);
    setTimeout(ready, 2500);   // גם אם אירוע הטעינה לא הגיע, לא משאירים מסך ריק
    var root = document.createElement('div');
    root.className = 'tz-b1'; root.id = 'tz-b1'; root.setAttribute('dir', 'rtl'); root.setAttribute('lang', 'he');
    root.innerHTML = window.TZ_BODY;
    shadow.appendChild(link); shadow.appendChild(root);
    ui = window.TZ_DIRS.b1;
    ui.mount(root); ui.show();
    mounted = true;
    var want = REV[(location.hash || '').replace('#', '')];
    if (want && want !== 'dashboard') { inGo = true; try { ui.go(want); } finally { inGo = false; } }
    return true;
  }
  // אם העיצוב החדש לא הצליח לעלות, חוזרים למסך הקודם: עדיף מערכת עובדת במראה הישן ממסך ריק
  function fallback(why) {
    if (dead) return;
    dead = true; classic = true;
    try { console.error('העיצוב החדש לא עלה, מוצג המסך הקודם:', why); } catch (e) {}
    body().classList.remove('nd-on', 'nd-ready', 'nd-classic');
    try { if (orig.renderAll) orig.renderAll(); } catch (e2) {}
  }
  function sync() {
    if (dead || !loggedIn() || classic) return false;
    var d = build();
    if (!d) { if (!mounted) fallback('הנתונים לא נבנו'); return false; }
    window.TZ_DATA = d;
    if (!mounted) {
      try { if (!mount()) { fallback('הרכיב לא נטען'); return false; } }
      catch (e) { fallback(e); return false; }
      return true;
    }
    try { ui.update(); } catch (e2) { fallback(e2); return false; }
    return true;
  }
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; try { sync(); } catch (e) { try { console.error('nd sync', e); } catch (e2) {} } }, 0);
  }

  /* ---------- עטיפות של המנוע הקיים ---------- */
  function wrap(name, after) {
    var f = fn(name);
    if (!f) return;
    orig[name] = f;
    window[name] = function () { var r = f.apply(this, arguments); try { after.apply(this, arguments); } catch (e) { try { console.error('nd ' + name, e); } catch (e2) {} } return r; };
  }
  wrap('renderAll', schedule);
  wrap('applyPermissions', schedule);
  wrap('switchScreen', function (screenId) {
    // חזרה אחורה בדפדפן, או ניווט שהמנוע הקיים יזם: העיצוב החדש עובר לאותו מסך
    if (classic || !mounted || inGo) return;
    var v = REV[screenId];
    if (v && ui.view() !== v) { inGo = true; try { ui.go(v); } finally { inGo = false; } }
  });
  // הודעות של המנוע הקיים מוצגות בעיצוב החדש
  (function () {
    var f = fn('showToast');
    if (!f) return;
    orig.showToast = f;
    window.showToast = function (msg, type) {
      // בזמן שמירה שהעיצוב החדש הפעיל: הודעת שגיאה חוזרת למי שביקש את השמירה, והוא מציג אותה במקום הנכון (לא פעמיים)
      if (capture) { capture.push({ msg: String(msg), type: type || 'success' }); if (type === 'danger' || type === 'warning') return; }
      if (mounted && !classic && body().classList.contains('nd-on')) { ui.toast(String(msg).replace(/^[^֐-׿A-Za-z0-9]+\s*/, ''), type === 'danger' || type === 'warning' ? 'info' : 'check'); return; }
      return f.apply(this, arguments);
    };
  })();

  /* ---------- כלי עזר לטפסים של המנוע הקיים ---------- */
  function iso(d) { var p = String(d || '').split('/'); return p.length === 3 ? p[2] + '-' + ('0' + p[1]).slice(-2) + '-' + ('0' + p[0]).slice(-2) : ''; }
  function setVal(id, v) { var e = el(id); if (e) e.value = v == null ? '' : v; return e; }
  function setSelect(id, v) {
    var e = el(id); if (!e) return;
    v = v == null ? '' : String(v);
    if (v && !Array.prototype.some.call(e.options, function (o) { return o.value === v; })) { var o = document.createElement('option'); o.value = v; o.textContent = v; e.appendChild(o); }
    e.value = v;
  }
  function closeOld(id) { var m = el(id); if (m) m.classList.remove('open'); }
  // מפעיל שמירה של המנוע הקיים ואוסף את הודעות השגיאה שלה. החלק שמעדכן את הנתונים רץ מיד; השליחה לשרת ממשיכה ברקע.
  function run(call) {
    var box = capture = [];
    try { call(); } catch (e) { box.push({ msg: 'אירעה שגיאה בשמירה', type: 'danger' }); try { console.error('nd save', e); } catch (e2) {} }
    capture = null;
    var bad = box.filter(function (t) { return t.type === 'danger' || t.type === 'warning'; })[0];
    return bad ? { ok: false, error: bad.msg } : { ok: true };
  }
  function canEdit() { try { return fn('canEditUser') ? !!window.canEditUser() : false; } catch (e) { return false; } }

  /* ---------- מה שהעיצוב החדש מבקש מהמערכת ---------- */
  window.TZ_HOST = {
    // לשימוש מודולי החיבור (nd/host-*.js): כלים משותפים
    _: {
      sync: function () { return sync(); }, run: run, setVal: setVal, setSelect: setSelect, closeOld: closeOld, canEdit: canEdit, el: el, fn: fn, iso: iso,
      state: appState, campaign: campaign, orig: orig, ui: function () { return ui; }, isClassic: function () { return classic; },
      decorate: function (f) { decorators.push(f); }, grantsYear: function () { return grantsYear; }, setGrantsYear: function (y) { grantsYear = y || null; }
    },
    year: function () { return year || campaign(); },
    setYear: function (y) {
      year = y && y !== campaign() ? y : null;
      var sel = el('dashboard-year-filter');
      if (sel) { setSelect('dashboard-year-filter', y); try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }
      sync();
    },
    setGrantsYear: function (y) { grantsYear = y || null; sync(); },
    onGo: function (view) {
      if (inGo || !MAP[view] || !orig.switchScreen) return;
      if (appState().activeScreen === MAP[view]) return;
      inGo = true; try { window.switchScreen(MAP[view], true); } catch (e) {} finally { inGo = false; }
    },
    refresh: function (done) {
      var f = fn('fetchDataFromServer');
      if (!f) { if (done) done(false); return; }
      Promise.resolve(f(false)).then(function (ok) { if (done) done(!!ok); }, function () { if (done) done(false); });
    },
    logout: function () { if (fn('performLogout')) window.performLogout(false); },

    saveDeposit: function (o) {
      if (!canEdit()) return { ok: false, error: 'אין לך הרשאת עריכה' };
      var st = appState(), before = (st.donations || []).length, res;
      window.openDonationModal(o.memberId);
      closeOld('add-donation-modal');
      setVal('donation-date', iso(o.date));
      setVal('donation-amount', o.amount);
      setVal('donation-notes', o.note || '');
      setSelect('donation-year', o.year || campaign());
      var r = document.querySelector('input[name="donation_payment_method"][value="' + (o.method === 'אשראי' ? 'credit' : 'cash') + '"]');
      if (r) r.checked = true;
      res = run(function () { window.handleSaveDonation(); });
      if (res.ok && (appState().donations || []).length <= before) res = { ok: false, error: 'ההפקדה לא נשמרה. אפשר לנסות שוב' };
      if (res.ok) sync();
      return res;
    },
    saveMember: function (o) {
      if (!canEdit()) return { ok: false, error: 'אין לך הרשאת עריכה' };
      var res, type = TYPE_OLD[o.type] || 'ישיבה קטנה', typeSel;
      window.openMemberModal(o.id || null);
      closeOld('add-member-modal');
      setVal('member-first-name', o.first); setVal('member-last-name', o.last); setVal('member-father-name', o.father);
      setVal('member-phone', o.phone); setVal('member-yeshiva', o.yeshiva);
      setSelect('member-yeshiva-type', type);
      typeSel = el('member-yeshiva-type');
      if (typeSel) { try { typeSel.dispatchEvent(new Event('change')); } catch (e) {} }
      setSelect('member-shiur', type === 'חיידר' ? '' : String(o.shiur || '').replace(/['׳"״\s]/g, ''));
      setSelect('member-marital-status', o.married ? 'נשוי' : 'רווק');
      setVal('member-address', o.address); setVal('member-notes', o.notes);
      res = run(function () { window.handleSaveMember(false); });
      if (res.ok) sync();
      return res;
    },
    saveExpense: function (o) {
      if (!canEdit()) return { ok: false, error: 'אין לך הרשאת עריכה' };
      var st = appState(), before = (st.expenses || []).length, res;
      window.openExpenseModal(null);
      closeOld('add-expense-modal');
      setVal('expense-date', iso(o.date));
      setSelect('expense-category', o.category || 'שונות');
      setVal('expense-description', o.description || '');
      setVal('expense-amount', o.amount);
      setSelect('expense-year', o.year || campaign());
      res = run(function () { window.handleSaveExpense(); });
      if (res.ok && (appState().expenses || []).length <= before) res = { ok: false, error: 'ההוצאה לא נשמרה. אפשר לנסות שוב' };
      if (res.ok) sync();
      return res;
    },
    // עריכה ומחיקה של תנועה קיימת, וסליקת אשראי: נפתחים בחלונות הקיימים של המערכת, מעל העיצוב החדש
    editDeposit: function (id) { if (fn('openDonationModal')) window.openDonationModal(null, id); },
    editExpense: function (id) { if (fn('openExpenseModal')) window.openExpenseModal(id); },
    credit: function () { if (fn('openNedarimModal')) window.openNedarimModal(); },

    // מה שעוד לא חובר: עוברים למסך הקודם של אותו נושא
    classic: function (view, hint) {
      if (!mounted || dead) return;
      classic = true;
      ui.closeAll();
      body().classList.remove('nd-on'); body().classList.add('nd-classic');
      try { if (orig.renderAll) orig.renderAll(); } catch (e) {}
      inGo = true;
      try {
        if (view === 'settings' && SET_TAB[hint] && fn('openSettingsTab')) window.openSettingsTab(SET_TAB[hint]);
        else window.switchScreen(MAP[view] || 'dashboard-screen', true);
      } catch (e) {} finally { inGo = false; }
      try { window.scrollTo(0, 0); } catch (e) {}
      if (orig.showToast) orig.showToast('הפעולה הזאת עדיין נעשית במסך הקודם. לחזרה: הכפתור "לעיצוב החדש" בתחתית', 'success');
    },
    back: function () {
      if (!classic || dead) return;
      classic = false;
      body().classList.remove('nd-classic'); body().classList.add('nd-on');
      try { window.scrollTo(0, 0); } catch (e) {}
      sync();
      var v = REV[appState().activeScreen] || 'dashboard';
      inGo = true; try { if (!ui.go(v)) ui.go('dashboard'); } finally { inGo = false; }
    }
  };

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#nd-back') : null;
    if (b) window.TZ_HOST.back();
  });

  // אם המערכת כבר פתוחה (סשן פעיל), מציגים מיד
  schedule();
})();
