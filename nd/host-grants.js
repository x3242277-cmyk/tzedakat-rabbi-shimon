/* מודול חיבור: מסך המענקים.
   נטען אחרי nd/boot.js. מוסיף ל-TZ_HOST את הפעולות של מסך המענקים, ול-TZ_DATA.grantsX את מה שהמסך צריך כדי לערוך.

   הכלל כמו ב-boot.js: לא משכפלים חוקי שמירה. ממלאים את הטופס הישן (המוסתר) או מפעילים את מצב העריכה הישן,
   וקוראים לפונקציה הקיימת של המנוע (script.js). כך האימות, יומן הפעולות, תור השמירה ו"בטל פעולה" נשארים במקום אחד.
   חלונות שכבר קיימים במערכת (תשלום לחנות, שיוך תשלום ישן) נפתחים כמו שהם, מעל העיצוב החדש.

   כל פעולת כתיבה מחזירה מיד { ok: true } או { ok: false, error: 'הודעה בעברית' }, ואף פעם לא זורקת שגיאה. */
(function () {
  'use strict';

  var H = window.TZ_HOST, _ = H && H._;
  if (!H || !_) return;

  var NO_EDIT = 'אין לך הרשאת עריכה';
  var FAILED = 'הפעולה לא הצליחה. אפשר לנסות שוב';
  var BAD_DATE = 'התאריך לא תקין. יש להקליד יום/חודש/שנה';

  var timer = null, lastSig = null;

  /* ---------- כלי עזר ---------- */
  function st() { return _.state(); }
  function ok(extra) { var r = { ok: true }, k; if (extra) for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) r[k] = extra[k]; return r; }
  function no(msg) { return { ok: false, error: msg || FAILED }; }
  function str(v) { return v == null ? '' : String(v); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function pad(v) { return (v < 10 ? '0' : '') + v; }
  function has() { for (var i = 0; i < arguments.length; i++) if (!_.fn(arguments[i])) return false; return true; }
  function log(e) { try { console.error('nd grants', e); } catch (e2) {} }
  // פעולה שלא זורקת: כל תקלה חוזרת כהודעה
  function safe(f) { return function () { try { return f.apply(this, arguments) || no(); } catch (e) { log(e); return no(); } }; }
  function quiet(p) { if (p && typeof p.then === 'function') p.then(null, function () {}); }

  // מאגר המענקים כפי שהמנוע רואה אותו (עותק ממוזג עם ברירות המחדל; לא נוגע ב-state)
  function archive() {
    var a = null;
    try { if (_.fn('getGrantsArchive')) a = window.getGrantsArchive(); } catch (e) { a = null; }
    if (!a || typeof a !== 'object') a = {};
    if (!a.years || typeof a.years !== 'object') a.years = {};
    return a;
  }
  function sortedYears(a) {
    try { if (_.fn('getSortedGrantYears')) return window.getSortedGrantYears(a) || []; } catch (e) {}
    return Object.keys(a.years);
  }
  // השנה שהמסך החדש מציג: אותו כלל של buildGrants ב-nd/data-screens.js
  function shownYear(a) {
    a = a || archive();
    var want = _.grantsYear(), cy = _.campaign(), list;
    if (want && a.years[want]) return want;
    if (a.years[cy]) return cy;
    list = sortedYears(a);
    return list.length ? list[list.length - 1] : cy;
  }
  // לפני כל פעולה: המנוע הקיים עובד על אותה שנה שהמסך החדש מציג
  function useYear() {
    var y = shownYear();
    if (st().grantsArchiveYear !== y) {
      if (_.fn('selectGrantsArchiveYear')) window.selectGrantsArchiveYear(y); else st().grantsArchiveYear = y;
    }
    return y;
  }
  function yearData(a, year) { var y = a.years[year]; return y && typeof y === 'object' ? y : {}; }
  function recipientsOf(year) { var l = yearData(archive(), year).recipients; return Array.isArray(l) ? l : []; }
  function billsOf(a, year) { var l = yearData(a, year).storeBills; return Array.isArray(l) ? l : []; }
  function findBill(a, year, id) { return billsOf(a, year).filter(function (b) { return b && String(b.bid) === id; })[0] || null; }
  function legacyOf(a, year) { try { return window.getGrantPaymentsForYear(a, year) || []; } catch (e) { return []; } }
  function findLegacy(a, year, key) { return legacyOf(a, year).filter(function (p) { return window.legacyPaymentKey(p) === key; })[0] || null; }
  function isOpen(id) { var m = _.el(id); return !!m && m.classList.contains('open'); }

  // מזהה חתן: rid (מחרוזת), או { index: n } / מספר לרשומות ישנות בלי rid (כך גם המסך הישן מזהה שורה: לפי מיקום)
  function recipientIndex(list, ref) {
    var i = null, rid = null, k;
    if (ref && typeof ref === 'object') { if (ref.rid) rid = String(ref.rid); else if (ref.index != null && ref.index !== '') i = Number(ref.index); }
    else if (typeof ref === 'number') i = ref;
    else if (ref != null && ref !== '') rid = String(ref);
    if (rid !== null) { for (k = 0; k < list.length; k++) if (list[k] && str(list[k].rid) === rid) return k; return -1; }
    return i !== null && i === Math.floor(i) && i >= 0 && i < list.length ? i : -1;
  }

  // 'dd/mm/yyyy' (או yyyy-mm-dd) -> 'yyyy-mm-dd' כמו שדה התאריך הישן שומר. ריק -> ''. לא תקין -> null
  function isoDate(v) {
    var s = str(v).trim(), m, y, mo, d, dt;
    if (!s) return '';
    if ((m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else return null;
    dt = new Date(y, mo - 1, d);
    if (y < 1900 || y > 2200 || dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return y + '-' + pad(mo) + '-' + pad(d);
  }
  // כותב תאריך לשדה הישן. תאריך ישן בטקסט חופשי ("אדר תשפ"ד") לא נכנס לשדה מסוג date, ולכן השדה הופך לרגע לטקסט
  function putDate(value) {
    var e = _.el('grants-add-date'), raw;
    if (!e) return function () {};
    raw = !!value && !/^\d{4}-\d{2}-\d{2}$/.test(value);
    if (raw) e.type = 'text';
    e.value = value || '';
    return function () { if (raw) { e.value = ''; e.type = 'date'; } };
  }

  /* ---------- רענון העיצוב החדש אחרי שהמנוע שינה את נתוני המענקים ---------- */
  // חלון התשלום לחנות, שיוך תשלום ישן, מחיקה ו"בטל פעולה" מסתיימים ב-renderGrantsArchive ולא ב-renderAll.
  // לכן עוטפים גם אותה. מרעננים רק אם הנתונים באמת השתנו מאז הבנייה האחרונה של TZ_DATA.
  function sig() {
    try { return JSON.stringify([st().grantsArchive || null, shownYear(), _.canEdit(), st().billsHalf || '']); } catch (e) { return String(Math.random()); }
  }
  function check() { timer = null; try { if (sig() !== lastSig) _.sync(); } catch (e) { log(e); } }
  function later() { if (timer === null) timer = setTimeout(check, 20); }
  (function () {
    var f = _.fn('renderGrantsArchive');
    if (!f) return;
    _.orig.renderGrantsArchive = f;
    window.renderGrantsArchive = function () { var r = f.apply(this, arguments); later(); return r; };
  })();

  // חלונות של המנוע שנפתחים מעל העיצוב החדש חייבים להיות מחוץ למסך הישן (שמוסתר)
  ['store-bill-modal', 'legacy-assign-modal'].forEach(function (id) {
    var m = _.el(id);
    if (m && m.closest && m.closest('#main-screen')) document.body.appendChild(m);
  });

  /* ---------- תוספות ל-TZ_DATA.grantsX ---------- */
  _.decorate(function (d) {
    var X = d && d.grantsX, a, year, groups;
    if (!X) return;
    a = archive(); year = X.year;
    try { groups = _.fn('getGrantPackageForYear') ? window.getGrantPackageForYear(a, year) : []; } catch (e) { groups = []; }
    groups = Array.isArray(groups) ? groups : [];

    // תכולת החבילה: מה שעורך התכולה הישן מציג בשדות (הנחה, מחיר בחנות ליחידה, עלות לארגון ליחידה)
    (X['package'] || []).forEach(function (p, i) {
      var g = groups[i] && typeof groups[i] === 'object' ? groups[i] : {}, items = Array.isArray(g.items) ? g.items : [];
      p.discount = str(g.discount);
      (p.items || []).forEach(function (it, j) {
        var s = items[j] && typeof items[j] === 'object' ? items[j] : {};
        it.storePrice = num(s.storePrice);
        it.orgPrice = num(s.orgPrice != null ? s.orgPrice : (s.value || 0));
      });
    });

    // מקבלי המענק: מיקום ברשימה השמורה, לזיהוי רשומות ישנות בלי rid
    (X.recipients || []).forEach(function (r, i) { r.index = i; });

    // מי רשאי לערוך: אותו תנאי של המסך הישן
    X.canEdit = _.canEdit();

    // תשלומים מהשיטה הקודמת שעוד לא שויכו למחצית (הלוח "תשלומים שנרשמו בשיטה הקודמת")
    X.legacy = [];
    try {
      if (has('getGrantPaymentsForYear', 'getLegacyPaymentHalf', 'legacyPaymentKey')) {
        X.legacy = legacyOf(a, year).filter(function (p) { return p && !window.getLegacyPaymentHalf(a, year, p); }).map(function (p) {
          return { id: window.legacyPaymentKey(p), store: str(p.store), date: str(p.date), description: str(p.description), method: str(p.method), amount: num(p.amount) };
        });
      }
    } catch (e) { log(e); X.legacy = []; }

    // שורות התשלומים: id = מזהה החיוב (bid). בשורה מהשיטה הקודמת id הוא מפתח התשלום הישן, והוא מופיע גם ב-legacyId
    ['א', 'ב'].forEach(function (h) {
      var half = X.halves && X.halves[h];
      ((half && half.bills) || []).forEach(function (row) { if (row && row.legacy) row.legacyId = row.id; });
    });

    // המחצית שהמנוע עומד עליה (אחרי שמירת תשלום הוא עובר למחצית של התשלום)
    X.billsHalf = st().billsHalf === 'ב' ? 'ב' : 'א';

    lastSig = sig();
  });

  /* ---------- מקבלי המענק: הטופס הישן ---------- */
  // ממלא את הטופס הישן ומפעיל את השמירה שלו. fields: רק מה שהוגדר נכתב (בעריכה, השאר נשאר כפי שהטופס הישן מילא)
  function submitGroom(fields, date) {
    var restore, res;
    if (fields.name !== undefined) _.setVal('grants-add-name', str(fields.name));
    if (fields.idn !== undefined) _.setVal('grants-add-id', str(fields.idn));
    if (fields.phone !== undefined) _.setVal('grants-add-phone', str(fields.phone));
    restore = putDate(date);
    try { res = _.run(function () { window.submitGrantsAddRecipient(); }); }
    finally { restore(); try { window.toggleGrantsAddForm(false); } catch (e) {} }   // סוגר ומנקה את הטופס הישן, גם אם השמירה סירבה
    return res;
  }

  Object.assign(H, {
    /* --- שנה --- */
    // עובר לשנה אחרת, גם במנוע הקיים וגם בנתונים של העיצוב החדש. ערך ריק = חזרה לשנת ברירת המחדל
    setGrantsYear: safe(function (year) {
      var y = str(year).trim(), a = archive();
      if (y && !a.years[y]) return no('השנה ' + y + ' לא קיימת ברשימת המענקים');
      _.setGrantsYear(y || null);
      y = shownYear(a);
      if (_.fn('selectGrantsArchiveYear')) window.selectGrantsArchiveYear(y); else st().grantsArchiveYear = y;
      _.sync();
      return ok({ year: y });
    }),

    // מוסיף שנת מענקים, כמו כפתור ה"+" הישן (בלי חלון ההקלדה שלו: הטקסט מגיע מהעיצוב החדש), ועובר אליה
    addGrantsYear: safe(function (year) {
      var y = str(year).trim(), norm = y.replace(/״/g, '"'), a = archive(), s = st(), exists, p;
      if (!_.canEdit()) return no(NO_EDIT);
      if (!y) return no('יש להקליד את שם השנה');
      if (!has('mutateGrantsArchive', 'renderGrantsArchive', 'reportSave', 'logAudit')) return no();
      exists = a.years[y] ? y : a.years[norm] ? norm : '';
      if (exists) {
        _.setGrantsYear(exists);
        if (_.fn('selectGrantsArchiveYear')) window.selectGrantsArchiveYear(exists); else s.grantsArchiveYear = exists;
        _.sync();
        try { window.showToast('השנה כבר קיימת - עברת אליה', 'warning'); } catch (e) {}
        return ok({ year: exists, existed: true });
      }
      // מכאן: אותן שורות של addGrantsArchiveYear אחרי חלון ההקלדה
      y = norm;
      s.grantsPackageEditMode = false; s.grantsPackageDraft = null;
      s.grantsArchiveYear = y;
      p = window.mutateGrantsArchive(function (x) { if (!x.years[y]) x.years[y] = { recipients: [] }; });
      window.renderGrantsArchive();
      quiet(p.then(function (saved) { window.reportSave(saved, 'נוספה שנת ' + y + ' - הוסף כעת מקבלי מענק'); window.logAudit('create', 'grant-year', y); }));
      _.setGrantsYear(y);
      _.sync();
      return ok({ year: y });
    }),

    /* --- מקבלי המענק --- */
    addGroom: safe(function (o) {
      var date, year, before, list, res;
      o = o || {};
      if (!_.canEdit()) return no(NO_EDIT);
      if (!has('submitGrantsAddRecipient', 'toggleGrantsAddForm')) return no();
      date = isoDate(o.date);
      if (date === null) return no(BAD_DATE);
      year = useYear();
      before = recipientsOf(year).length;
      window.toggleGrantsAddForm(false);   // מנקה את הטופס הישן ויוצא ממצב עריכה אם נשאר כזה
      res = submitGroom({ name: str(o.name), idn: str(o.idn), phone: str(o.phone) }, date);
      list = recipientsOf(year);
      if (res.ok && list.length <= before) res = no('החתן לא נוסף. אפשר לנסות שוב');
      if (!res.ok) return res;
      _.sync();
      return ok({ rid: str(list[list.length - 1] && list[list.length - 1].rid) });
    }),

    updateGroom: safe(function (ref, o) {
      var year, list, idx, r, stored, date, s, f, res, now;
      o = o || {};
      if (!_.canEdit()) return no(NO_EDIT);
      if (!has('submitGrantsAddRecipient', 'editGrantsArchiveRecipient', 'toggleGrantsAddForm')) return no();
      year = useYear();
      list = recipientsOf(year);
      idx = recipientIndex(list, ref);
      if (idx === -1) return no('החתן לא נמצא ברשימה. כדאי לרענן את הנתונים');
      r = list[idx] || {};
      stored = str(r.date).trim();
      if (o.date === undefined || o.date === null) {
        // התאריך לא נשלח: נשאר כמו שהוא (תאריך שמתפענח נשמר בפורמט של השדה, כמו בעריכה הישנה)
        f = _.fn('toDateInputValue');
        date = (f && f(stored)) || stored;
      } else {
        s = str(o.date).trim();
        date = isoDate(s);
        if (date === null) {
          if (s !== stored) return no(BAD_DATE);
          date = stored;   // תאריך ישן בטקסט חופשי שלא שונה: נשאר כפי שנשמר
        }
      }
      window.editGrantsArchiveRecipient(idx);   // מצב העריכה הישן: זוכר את הרשומה וממלא את הטופס
      if (!st().grantsEditingRecipient) { try { window.toggleGrantsAddForm(false); } catch (e) {} return no(); }
      res = submitGroom({ name: o.name, idn: o.idn, phone: o.phone }, date);
      if (!res.ok) return res;
      _.sync();
      now = recipientsOf(year)[idx];
      return ok({ rid: str(now && now.rid) });
    }),

    // הסרה עם "בטל פעולה", כמו במסך הישן
    removeGroom: safe(function (ref) {
      var year, list, idx, res;
      if (!_.canEdit()) return no(NO_EDIT);
      if (!has('removeGrantsArchiveRecipient')) return no();
      year = useYear();
      list = recipientsOf(year);
      idx = recipientIndex(list, ref);
      if (idx === -1) return no('החתן לא נמצא ברשימה. כדאי לרענן את הנתונים');
      res = _.run(function () { window.removeGrantsArchiveRecipient(idx); });
      if (res.ok && recipientsOf(year).length >= list.length) res = no('החתן לא הוסר. אפשר לנסות שוב');
      if (res.ok) _.sync();
      return res;
    }),

    /* --- תכולת החבילה: עורך התכולה הישן --- */
    // groups = [{ store, discount, items: [{ name, qty, storePrice, orgPrice }] }]
    savePackage: safe(function (groups) {
      var s = st(), bad, res;
      if (!_.canEdit()) return no(NO_EDIT);
      if (!Array.isArray(groups)) return no();
      if (!has('toggleGrantsPackageEditMode', 'cancelGrantsPackageEdit', 'addGrantsPkgGroup', 'addGrantsPkgItem', 'removeGrantsPkgItem', 'updateGrantsPkgGroupField', 'updateGrantsPkgItemField')) return no();
      bad = groups.some(function (g) { return !g || typeof g !== 'object' || !str(g.store).trim(); });
      if (bad) return no('יש להזין שם חנות');
      useYear();
      if (s.grantsPackageEditMode) window.cancelGrantsPackageEdit();
      window.toggleGrantsPackageEditMode();            // נכנס למצב עריכה: טיוטה של התכולה הנוכחית
      if (!s.grantsPackageEditMode) return no();
      try {
        s.grantsPackageDraft = [];                     // הטיוטה נבנית מחדש בפעולות של העורך הישן
        groups.forEach(function (g, gi) {
          var items = Array.isArray(g.items) ? g.items : [];
          window.addGrantsPkgGroup();                  // חנות חדשה עם שורת מוצר אחת ריקה
          window.updateGrantsPkgGroupField(gi, 'store', str(g.store));
          window.updateGrantsPkgGroupField(gi, 'discount', str(g.discount));
          if (!items.length) window.removeGrantsPkgItem(gi, 0);
          items.forEach(function (it, ii) {
            it = it && typeof it === 'object' ? it : {};
            if (ii > 0) window.addGrantsPkgItem(gi);
            window.updateGrantsPkgItemField(gi, ii, 'name', str(it.name));
            window.updateGrantsPkgItemField(gi, ii, 'qty', it.qty);
            window.updateGrantsPkgItemField(gi, ii, 'storePrice', it.storePrice);
            window.updateGrantsPkgItemField(gi, ii, 'orgPrice', it.orgPrice);
          });
        });
      } catch (e) {
        log(e);
        try { window.cancelGrantsPackageEdit(); } catch (e2) {}
        return no();
      }
      res = _.run(function () { window.toggleGrantsPackageEditMode(); });   // "שמור תכולה"
      if (s.grantsPackageEditMode) { try { window.cancelGrantsPackageEdit(); } catch (e) {} if (res.ok) res = no(); }
      if (res.ok) _.sync();
      return res;
    }),

    /* --- תשלומים לחנויות: החלונות הקיימים --- */
    // { id } חיוב קיים · { store, half } חיוב חדש לחנות במחצית · { half } חנות אחרת · { legacyId } שיוך תשלום ישן למחצית
    openBill: safe(function (arg) {
      var year, a, id, key, res, modal;
      arg = arg && typeof arg === 'object' ? arg : {};
      if (!_.canEdit()) return no(NO_EDIT);
      if (!has('openStoreBillModal', 'openLegacyAssign', 'legacyPaymentKey', 'getGrantPaymentsForYear')) return no();
      year = useYear(); a = archive();
      key = arg.legacyId != null && arg.legacyId !== '' ? String(arg.legacyId) : null;
      id = arg.id != null && arg.id !== '' ? String(arg.id) : null;
      if (!key && id && !findBill(a, year, id) && findLegacy(a, year, id)) { key = id; id = null; }   // שורה מהשיטה הקודמת שנשלחה עם id
      if (key) {
        if (!findLegacy(a, year, key)) return no('התשלום לא נמצא. כדאי לרענן את הנתונים');
        modal = 'legacy-assign-modal';
        res = _.run(function () { window.openLegacyAssign(key); });
      } else {
        if (id && !findBill(a, year, id)) return no('התשלום לא נמצא. כדאי לרענן את הנתונים');
        if (!id && (arg.half === 'א' || arg.half === 'ב') && _.fn('switchBillsHalf')) window.switchBillsHalf(arg.half);   // המחצית שהחלון יציע
        modal = 'store-bill-modal';
        res = _.run(function () { window.openStoreBillModal(id, id ? '' : str(arg.store)); });
      }
      if (res.ok && !isOpen(modal)) res = no();
      return res;
    }),

    // צפייה בקבלה סרוקה (נפתחת בלשונית חדשה; תקלה מוצגת כהודעה)
    viewReceipt: safe(function (billId) {
      var year, b;
      if (!has('viewStoreBillReceipt')) return no();
      year = useYear();
      b = findBill(archive(), year, str(billId));
      if (!b || !b.receipt || !b.receipt.path) return no('לא צורפה קבלה לתשלום הזה');
      quiet(window.viewStoreBillReceipt(b.bid));
      return ok();
    }),

    /* --- ייצוא --- */
    // 'recipients' -> קובץ מקבלי המענק · 'bills', מחצית -> קובץ התשלומים לחנויות של המחצית
    exportGrants: safe(function (kind, half) {
      var s = st(), prevView, prevHalf, tbody;
      if (!has('renderGrantsArchive')) return no();
      useYear();
      if (kind === 'bills') {
        if (!has('exportGrantsToExcel', 'switchBillsHalf')) return no();
        prevView = s.grantsActiveView; prevHalf = s.billsHalf;
        half = half === 'ב' || half === 'א' ? half : (prevHalf === 'ב' ? 'ב' : 'א');
        s.grantsActiveView = 'payments';
        try {
          window.switchBillsHalf(half);                 // מצייר את טבלת המחצית (במסך הישן, המוסתר)
          // הייצוא הישן קורא innerText. בטבלה מוסתרת אין שבירת שורה בין הסטטוס להערה שמתחתיו, ולכן מוסיפים אותה
          tbody = _.el('store-bills-tbody');
          if (tbody && !tbody.getClientRects().length) {
            Array.prototype.forEach.call(tbody.querySelectorAll('.bill-notes'), function (n) { n.parentNode.insertBefore(document.createTextNode('\n'), n); });
          }
          window.exportGrantsToExcel();
        } finally {
          s.grantsActiveView = prevView;
          window.switchBillsHalf(prevHalf);
        }
        return ok();
      }
      if (kind === 'recipients' || kind == null) {
        if (!has('exportGrantsArchiveRecipients')) return no();
        window.renderGrantsArchive();                   // הטבלה הישנה מעודכנת לשנה המוצגת
        window.exportGrantsArchiveRecipients();
        return ok();
      }
      return no();
    })
  });
})();
