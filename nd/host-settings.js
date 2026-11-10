/* העיצוב החדש על המערכת האמיתית: חיבור מסך ההגדרות.
   נטען אחרי nd/boot.js ומוסיף פעולות ל-window.TZ_HOST.

   העיקרון כמו ב-boot.js: לא כותבים מחדש חוקי שמירה. ממלאים את הטופס הישן (המוסתר) ומפעילים את הפעולה הקיימת
   של script.js: saveSettings, addExpenseCategory, removeExpenseCategory, saveUserPermissions, openDataHealthDetail,
   exportFullBackup, importFullBackup. כך האימות, יומן הפעולות, תור השינויים ו"בטל פעולה" נשארים במקום אחד.

   הרשאות: בפעולות האלה המנוע הקיים כמעט לא בודק בעצמו (רק שמירת הרשאות וייבוא גיבוי בודקים מנהל),
   כי מסך ההגדרות מוצע בתפריט למנהל בלבד, והשרת מסרב לכתיבת הגדרות ממי שאינו מנהל. לכן כאן כל הפעולות למנהל בלבד. */
(function () {
  'use strict';

  var H = window.TZ_HOST;
  if (!H || !H._) return;
  var _ = H._, el = _.el, fn = _.fn;

  var MSG_ADMIN = 'רק מנהל יכול לשנות הגדרות';
  var MSG_NA = 'הפעולה לא זמינה כרגע. אפשר לרענן את הדף ולנסות שוב';
  var MSG_FAIL = 'אירעה שגיאה. אפשר לנסות שוב';
  // המפתחות כמו בעיצוב החדש (בלי הגרשיים), מול שדות הטופס הישן
  var TARGET_INPUT = { 'חיידר': 'target-chaider', 'ישיק': 'target-ktana', 'ישיג': 'target-gedola', 'קיבוץ': 'target-kibbutz' };
  var GIFT_INPUT = [
    { name: 'gift1-name', threshold: 'target-tiyul', enabled: 'gift1-enabled', image: 'gift1-image' },
    { name: 'gift2-name', threshold: 'target-shay', enabled: 'gift2-enabled', image: 'gift2-image' }
  ];
  var PERM_ORDER = ['canEdit', 'canViewIncome', 'canViewExpenses', 'canViewGrants', 'canViewHistory'];   // הסדר של settingsX.perms
  var HEALTH_KEYS = ['type', 'yeshiva', 'phone', 'dupes'];

  function no(msg) { return { ok: false, error: msg }; }
  function str(v) { return v == null ? '' : String(v); }
  function isAdmin() { try { return fn('isAdminUser') ? !!window.isAdminUser() : false; } catch (e) { return false; } }
  function newUiOn() { return !!_.ui() && !_.isClassic() && document.body.classList.contains('nd-on'); }
  function sync() { try { return _.sync(); } catch (e) { try { console.error('nd settings sync', e); } catch (e2) {} return false; } }
  // פעולה של TZ_HOST לא זורקת שגיאה לעולם
  function guard(f) {
    return function () {
      try { return f.apply(this, arguments); }
      catch (e) { try { console.error('nd settings', e); } catch (e2) {} return no(MSG_FAIL); }
    };
  }
  function cats() {
    try { if (fn('getExpenseCategories')) return window.getExpenseCategories() || []; } catch (e) {}
    var c = (_.state().settings || {}).expenseCategories;
    return Array.isArray(c) ? c : [];
  }
  function pendingCount() { try { return fn('readPendingWrites') ? (window.readPendingWrites() || []).length : 0; } catch (e) { return 0; } }
  function numText(v) { return typeof v === 'number' ? (isFinite(v) ? String(v) : '') : str(v).trim(); }

  /* ---------- הודעות של המנוע הקיים ---------- */
  // 1. מאזינים זמניים (לתוצאה של שמירת הרשאות, שמגיעה רק אחרי תשובת השרת).
  // 2. כשחלון תיקון הנתונים הישן פתוח מעל העיצוב החדש, ההודעה מוצגת בסגנון הישן, מעל החלון
  //    (ההודעות של העיצוב החדש נמצאות מתחת לרקע הכהה של החלון).
  var toastWatch = [];
  function healthOpen() { var m = el('data-health-modal'); return !!m && m.classList.contains('open'); }
  (function () {
    var prev = fn('showToast');
    if (!prev) return;
    window.showToast = function (msg, type) {
      var i, list = toastWatch.slice();
      for (i = 0; i < list.length; i++) { try { list[i](String(msg), type || 'success'); } catch (e) {} }
      if (_.orig.showToast && healthOpen() && newUiOn()) return _.orig.showToast.apply(this, arguments);
      return prev.apply(this, arguments);
    };
  })();

  /* ---------- חלון תיקון הנתונים: נמצא בתוך #main-screen, שמוסתר בעיצוב החדש. מעבירים אותו לרמת הדף ---------- */
  (function () {
    var m = el('data-health-modal');
    if (m && m.parentNode !== document.body) document.body.appendChild(m);
  })();

  // "פתח פרופיל" בחלון הכפילויות: בעיצוב החדש נפתח כרטיס הבחור החדש. במסך הקודם: ההתנהגות הקיימת
  (function () {
    var prev = fn('openMemberFromHealth');
    window.openMemberFromHealth = function (memberId) {
      if (!newUiOn()) { if (prev) return prev.apply(this, arguments); return; }
      _.closeOld('data-health-modal');
      var opened = false;
      try { opened = !!_.ui().openMember(str(memberId)); } catch (e) { try { console.error('nd openMember', e); } catch (e2) {} }
      if (!opened && fn('showToast')) window.showToast('הבחור לא נמצא ברשימה', 'warning');
    };
  })();

  // תיקון מתוך החלון: המנוע הקיים מעדכן רק את המסך הישן (בלי renderAll), לכן מרעננים כאן את העיצוב החדש
  (function () {
    var prev = fn('applyHealthFix');
    if (!prev) return;
    window.applyHealthFix = function () {
      var r = prev.apply(this, arguments);
      sync();
      return r;
    };
  })();

  /* ---------- מונה השינויים שממתינים לשליחה ---------- */
  // התור משתנה גם בלי שהנתונים עצמם משתנים (שמירה בלי חיבור, חיבור שחזר). המספר שבנתונים מתעדכן תמיד,
  // והמסך מצויר מחדש רק כשמסך ההגדרות פתוח (רק שם המספר מוצג).
  (function () {
    var prev = fn('updatePendingBanner'), timer = null;
    if (!prev) return;
    window.updatePendingBanner = function () {
      var r = prev.apply(this, arguments);
      if (!timer) timer = setTimeout(function () {
        timer = null;
        var d = window.TZ_DATA, X = d && d.settingsX, n = pendingCount(), view = null;
        if (!X || X.pendingWrites === n) return;
        X.pendingWrites = n;
        try { view = _.ui() ? _.ui().view() : null; } catch (e) {}
        if (view === 'settings') sync();
      }, 400);
      return r;
    };
  })();

  /* ---------- תוספת לנתונים של מסך ההגדרות ---------- */
  _.decorate(function (d) {
    var s = _.state().settings || {}, X = d.settingsX || (d.settingsX = {});
    function gift(nameKey, sumKey, onKey, imgKey, defName, defSum) {
      // אותן ברירות מחדל שהטופס הישן מציג (cacheSettingsInputs)
      return { name: str(s[nameKey]).trim() || defName, threshold: s[sumKey] != null ? (Number(s[sumKey]) || 0) : defSum, enabled: s[onKey] !== false, image: str(s[imgKey]) };
    }
    X.giftsAll = [gift('gift1Name', 'targetTiyul', 'gift1Enabled', 'gift1Image', 'טיול', 700), gift('gift2Name', 'targetShayTotal', 'gift2Enabled', 'gift2Image', 'מתנה', 2000)];
    X.pendingWrites = pendingCount();
    X.isAdmin = isAdmin();
  });

  /* ---------- הפעולות ---------- */
  var permBusy = {};

  function healthCount(key) {
    var members = _.state().members || [], names = {}, n = 0;
    if (key !== 'dupes') return fn('getHealthAffected') ? (window.getHealthAffected(key) || []).length : 0;
    members.forEach(function (m) {
      var full = (str(m && m.firstName).trim() + ' ' + str(m && m.lastName).trim()).trim();
      if (full) names[full] = (names[full] || 0) + 1;
    });
    Object.keys(names).forEach(function (k) { if (names[k] > 1) n++; });
    return n;
  }

  Object.assign(H, {
    // "שמור יעדים": ממלאים את הטופס הישן ומפעילים את saveSettings של המנוע. שדה שלא נשלח נשאר כמו שהוא שמור.
    // שינוי שנת הקמפיין: בדיוק מה שהשמירה הישנה עושה (הערך נשמר בהגדרות, והכול מחושב מחדש). בלי שום פעולה נוספת.
    saveSettings: guard(function (o) {
      var t, res;
      o = o || {};
      if (!isAdmin()) return no(MSG_ADMIN);
      if (!fn('saveSettings') || !fn('cacheSettingsInputs') || !el('current-campaign-year')) return no(MSG_NA);
      window.cacheSettingsInputs();   // הטופס הישן מתחיל מהמצב השמור, כמו בכניסה למסך ההגדרות
      if (o.campaignYear !== undefined) _.setVal('current-campaign-year', str(o.campaignYear));
      t = o.targets && typeof o.targets === 'object' ? o.targets : {};
      Object.keys(t).forEach(function (k) {
        var id = TARGET_INPUT[String(k).replace(/["״'׳]/g, '')];
        if (id && t[k] !== undefined) _.setVal(id, numText(t[k]));
      });
      (Array.isArray(o.gifts) ? o.gifts : []).slice(0, 2).forEach(function (g, i) {
        var ids = GIFT_INPUT[i], box;
        if (!g || typeof g !== 'object') return;
        if (g.name !== undefined) _.setVal(ids.name, str(g.name));
        if (g.threshold !== undefined) _.setVal(ids.threshold, numText(g.threshold));
        if (g.image !== undefined) _.setVal(ids.image, str(g.image));
        box = el(ids.enabled);
        if (box && g.enabled !== undefined) box.checked = !!g.enabled;
      });
      if (o.extra !== undefined) _.setVal('additional-rules', str(o.extra));
      res = _.run(function () { window.saveSettings(); });
      try { window.cacheSettingsInputs(); } catch (e) {}   // הטופס המוסתר חוזר להציג את מה שנשמר בפועל
      if (res.ok) sync();
      return res;
    }),

    // הוספת קטגוריית הוצאה: השדה הישן + addExpenseCategory
    addCategory: guard(function (name) {
      var input = el('new-expense-category'), val, res;
      if (!isAdmin()) return no(MSG_ADMIN);
      if (!input || !fn('addExpenseCategory')) return no(MSG_NA);
      input.value = str(name);
      val = input.value.trim();
      if (!val) { input.value = ''; return no('יש להזין שם קטגוריה'); }   // המסך הישן פשוט לא מגיב לשם ריק
      res = _.run(function () { window.addExpenseCategory(); });
      input.value = '';
      if (res.ok && cats().indexOf(val) === -1) res = no('הקטגוריה לא נוספה. אפשר לנסות שוב');
      if (res.ok) sync();
      return res;
    }),

    // הסרת קטגוריה: removeExpenseCategory של המנוע, כולל הודעת "בטל פעולה" שלו (ההסרה נשלחת לשרת רק אחרי כמה שניות)
    removeCategory: guard(function (name) {
      var index, res, sched = fn('scheduleUndoableDelete');
      if (!isAdmin()) return no(MSG_ADMIN);
      if (!fn('removeExpenseCategory')) return no(MSG_NA);
      index = cats().indexOf(str(name));
      if (index === -1) return no('הקטגוריה לא נמצאה');
      // "בטל פעולה" מחזיר את הקטגוריה בלי renderAll, לכן מוסיפים לביטול של המחיקה הזאת רענון של העיצוב החדש
      if (sched) window.scheduleUndoableDelete = function (job) {
        var undo = job && job.undo;
        if (typeof undo === 'function') job.undo = function () { var r = undo.apply(this, arguments); sync(); return r; };
        return sched.apply(this, arguments);
      };
      try { res = _.run(function () { window.removeExpenseCategory(index); }); }
      finally { if (sched) window.scheduleUndoableDelete = sched; }
      if (res.ok && cats().indexOf(str(name)) !== -1) res = no('הקטגוריה לא הוסרה. אפשר לנסות שוב');
      if (res.ok) sync();
      return res;
    }),

    // "שמור" בשורת משתמש: מסמנים את התיבות בשורה הישנה ומפעילים את saveUserPermissions.
    // השמירה הישנה מעדכנת את הנתונים רק אחרי שהשרת אישר, לכן { ok: true } כאן פירושו "נשלח".
    // התוצאה הסופית מגיעה ב-done (Promise של { ok } או { ok: false, error }), ואז העיצוב החדש מתרענן.
    saveUserPerms: guard(function (userId, flags) {
      var id = str(userId), body, tr = null, btn, p = null, res, errors = [], watch;
      if (!isAdmin()) return no('רק מנהל יכול לשנות הרשאות');
      if (!Array.isArray(flags) || flags.length !== PERM_ORDER.length) return no('רשימת ההרשאות אינה תקינה');
      if (!id || !fn('saveUserPermissions')) return no(MSG_NA);
      if (permBusy[id]) return no('השמירה הקודמת של המשתמש הזה עדיין לא הסתיימה');
      if (fn('renderUsersTable')) window.renderUsersTable();   // השורה הישנה מצוירת מהנתונים העדכניים
      body = el('users-table-body');
      Array.prototype.forEach.call(body ? body.querySelectorAll('tr[data-user-id]') : [], function (row) { if (!tr && row.getAttribute('data-user-id') === id) tr = row; });
      if (!tr) return no('המשתמש לא נמצא');
      btn = tr.querySelector('.users-save-btn');
      if (!btn) return no('אי אפשר לשנות הרשאות של מנהל');   // בשורת מנהל אין כפתור שמירה במסך הישן
      PERM_ORDER.forEach(function (f, i) { var box = tr.querySelector('input[data-perm="' + f + '"]'); if (box) box.checked = !!flags[i]; });
      watch = function (msg, type) { if (type === 'danger') errors.push(msg); };
      toastWatch.push(watch);
      permBusy[id] = true;
      res = _.run(function () { p = window.saveUserPermissions(id, btn); });
      res.done = Promise.resolve(p).then(null, function () { errors.push(MSG_FAIL); }).then(function () {
        var i = toastWatch.indexOf(watch);
        if (i !== -1) toastWatch.splice(i, 1);
        delete permBusy[id];
        sync();
        return errors.length ? no(errors[0]) : { ok: true };
      });
      return res;
    }),

    // חלון התיקון הקיים של "תקינות נתונים", מעל העיצוב החדש. כמו במסך הישן: נפתח רק כשיש מה לתקן
    openHealth: guard(function (key) {
      if (!isAdmin()) return no('תיקון הנתונים פתוח למנהל בלבד');
      if (HEALTH_KEYS.indexOf(key) === -1) return no('לבדיקה הזאת אין חלון תיקון');
      if (!fn('openDataHealthDetail') || !el('data-health-modal')) return no(MSG_NA);
      if (!healthCount(key)) return no('הכול תקין כאן');
      window.openDataHealthDetail(key);
      return { ok: true };
    }),

    // ייצוא גיבוי: exportFullBackup של המנוע (קובץ JSON יורד למחשב)
    exportBackup: guard(function () {
      if (!isAdmin()) return no('רק מנהל יכול לייצא גיבוי');
      if (!fn('exportFullBackup')) return no(MSG_NA);
      return _.run(function () { window.exportFullBackup(); });
    }),

    // ייבוא גיבוי: פותח את בחירת הקובץ של המסך הישן. ההמשך (בדיקת הקובץ, חלון האישור, ההעלאה והרענון) הוא של המנוע.
    // אפשר גם להעביר קובץ שכבר נבחר.
    importBackup: guard(function (file) {
      var input = el('import-backup-file'), btn = el('btn-import-backup');
      if (!isAdmin()) return no('רק מנהל יכול לייבא גיבוי');
      if (btn && btn.disabled) return no('ייבוא קודם עדיין מעלה נתונים לשרת');
      if (file) {
        if (!fn('importFullBackup')) return no(MSG_NA);
        return _.run(function () { window.importFullBackup(file); });
      }
      if (!input) return no(MSG_NA);
      input.click();
      return { ok: true };
    })
  });
})();
