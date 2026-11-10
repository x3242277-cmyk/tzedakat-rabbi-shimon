/* nd/data.js — מתאם נתונים בין המערכת הקיימת (script.js) לעיצוב החדש.
   נטען אחרי script.js. חושף window.NDData.build(year): מחזיר אובייקט חדש במבנה של window.TZ_DATA
   (ראו redesign/shared/data.js), מחושב מהנתונים האמיתיים שב-state ומהפונקציות של המערכת הקיימת.
   הקובץ קורא בלבד: אינו כותב ל-DOM, אינו משנה את state ואינו פונה לרשת.
   כללי החישוב עצמם (יעד, חוב, קנס, זכאות) נשארים ב-script.js ואינם משוכפלים כאן. */
(function () {
  'use strict';

  /* ---------- קבועים ---------- */
  var YEARS_FALLBACK = ['תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט', 'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט', 'תש"צ'];
  var TYPE_KEY = { 'ישיבה גדולה': 'ישי״ג', 'ישיבה קטנה': 'ישי״ק', 'קיבוץ': 'קיבוץ', 'חיידר': 'חיידר' };
  var TYPE_NAME = { 'ישי״ג': 'ישיבה גדולה', 'ישי״ק': 'ישיבה קטנה', 'קיבוץ': 'קיבוץ', 'חיידר': 'חיידר' };
  var TYPE_ORDER = ['ישי״ג', 'ישי״ק', 'קיבוץ', 'חיידר'];
  var TARGET_SETTING = { 'חיידר': 'targetChaider', 'ישי״ק': 'targetKtana', 'ישי״ג': 'targetGedola', 'קיבוץ': 'targetKibbutz' };
  var NOTE_NO_TARGET = 'ללא יעד שנתי · זכאות למי שאין לו חוב עבר';
  var NOTE_CHEDER = 'עדיין לא בגיל הזכאות';
  var HEB_MONTHS = ['תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול'];
  var DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var NEAR_LIMIT = 500; // "קרובים לזכאות": חסר עד ₪500 (כמו במערכת הקיימת)
  var STATUS_MAP = {
    'עמד ביעד': { key: 'ok', tone: 'good' },
    'חיידר': { key: 'cheder', tone: 'neutral' },
    'חוב פתוח': { key: 'debt', tone: 'bad' },
    'בתהליך': { key: 'prog', tone: 'warn' },
    'טרם החל': { key: 'none', tone: 'idle' }
  };
  var STATUS_FILTERS = [
    { key: 'all', label: 'הכל' }, { key: 'ok', label: 'עמדו ביעד' }, { key: 'prog', label: 'בתהליך' },
    { key: 'debt', label: 'חוב פתוח' }, { key: 'none', label: 'טרם התחילו' }, { key: 'cheder', label: 'חיידר' },
    { key: 'near', label: 'קרובים ליעד' }
  ];
  var NAV = [
    { key: 'dashboard', label: 'לוח בקרה', group: 'ראשי' },
    { key: 'members', label: 'בחורים', group: 'ניהול' },
    { key: 'grants', label: 'מענקים', group: 'ניהול' },
    { key: 'purim', label: 'כתובות פורים', group: 'ניהול' },
    { key: 'transactions', label: 'דו״ח תנועות', group: 'כספים' },
    { key: 'expenses', label: 'סיכום הוצאות', group: 'כספים' },
    { key: 'rules', label: 'תקנון', group: 'כללי' },
    { key: 'settings', label: 'הגדרות', group: 'כללי' }
  ];
  var QUICK_ACTIONS = [
    { key: 'deposit', label: 'רישום הפקדה' },
    { key: 'member', label: 'הוספת בחור' },
    { key: 'expense', label: 'רישום הוצאה' },
    { key: 'credit', label: 'סליקת אשראי' },
    { key: 'report', label: 'דו״ח תנועות' },
    { key: 'grants', label: 'מענקים' }
  ];
  var IMAGE_SLOTS = [
    { key: 'hero', kind: 'scene', w: 1920, h: 1080, label: 'חופה מקושטת באור זהוב', use: 'תמונת הפתיחה של לוח הבקרה' },
    { key: 'kupa', kind: 'object', w: 1024, h: 1024, label: 'קופת צדקה עם מטבעות זהב', use: 'רישום הפקדה והודעת הצלחה' },
    { key: 'coins', kind: 'object', w: 1024, h: 1024, label: 'ערימות מטבעות זהב', use: 'נגבה השנה / הכנסות' },
    { key: 'gedola', kind: 'object', w: 1024, h: 1024, label: 'סטנדר עם ספר פתוח', use: 'מסגרת: ישיבה גדולה' },
    { key: 'ktana', kind: 'object', w: 1024, h: 1024, label: 'ערימת ספרי קודש', use: 'מסגרת: ישיבה קטנה' },
    { key: 'kibbutz', kind: 'object', w: 1024, h: 1024, label: 'בניין בית מדרש', use: 'מסגרת: קיבוץ' },
    { key: 'cheder', kind: 'object', w: 1024, h: 1024, label: 'ילקוט ולוח כתיבה', use: 'מסגרת: חיידר' },
    { key: 'tiyul', kind: 'object', w: 1024, h: 1024, label: 'אוטובוס טיולים', use: 'מתנה: טיול (מ-₪700)' },
    { key: 'matana', kind: 'object', w: 1024, h: 1024, label: 'קופסת מתנה עם סרט זהב', use: 'מתנה (מ-₪2,000)' },
    { key: 'gavia', kind: 'object', w: 1024, h: 1024, label: 'גביע וזר דפנה', use: 'מובילי הגבייה' },
    { key: 'maanakim', kind: 'scene', w: 1920, h: 1080, label: 'חבילת חתן: חליפה, כובע, נעליים ומגבות', use: 'מסך מענקים' },
    { key: 'purim', kind: 'scene', w: 1920, h: 1080, label: 'מגילה, משלוח מנות ורעשן', use: 'מסך כתובות פורים' },
    { key: 'tnuot', kind: 'scene', w: 1920, h: 1080, label: 'פנקס חשבונות, עט ומטבעות', use: 'מסך דו״ח תנועות' },
    { key: 'hotzaot', kind: 'scene', w: 1920, h: 1080, label: 'קבלות, מחשבון וארנק', use: 'מסך סיכום הוצאות' },
    { key: 'takanon', kind: 'scene', w: 1920, h: 1080, label: 'מגילת קלף עם חותם זהב', use: 'מסך תקנון' },
    { key: 'hagdarot', kind: 'scene', w: 1920, h: 1080, label: 'גלגלי שיניים ומפתח מפליז', use: 'מסך הגדרות' },
    { key: 'empty', kind: 'object', w: 1024, h: 1024, label: 'תיבת עץ ריקה', use: 'מצב ״אין נתונים״' }
  ];
  var IMAGE_BASE = 'assets/img/nd/';

  /* ---------- עזרים כלליים ---------- */
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function r2(v) { return Math.round(num(v) * 100) / 100; } // סכומים: עיגול לאגורות, בלי שאריות של נקודה צפה
  function str(v) { return v == null ? '' : String(v); }
  function trim(v) { return str(v).replace(/^\s+|\s+$/g, ''); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isFn(f) { return typeof f === 'function'; }
  function arr(a) { return Object.prototype.toString.call(a) === '[object Array]' ? a : []; }
  function dict() { return Object.create(null); }
  function fmt(n) { return '₪' + Math.round(num(n)).toLocaleString('en-US'); }
  function clone(list) {
    return list.map(function (o) { var c = {}, k; for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) c[k] = o[k]; return c; });
  }

  // state ו-HEBREW_YEARS_ORDER מוגדרים ב-script.js ב-let/const ברמה העליונה: נגישים מכאן, אך אינם על window
  function appState() { try { return (typeof state !== 'undefined' && state) ? state : {}; } catch (e) { return {}; } }
  function yearsOrder() { try { return (typeof HEBREW_YEARS_ORDER !== 'undefined' && arr(HEBREW_YEARS_ORDER).length) ? HEBREW_YEARS_ORDER : YEARS_FALLBACK; } catch (e) { return YEARS_FALLBACK; } }

  /* ---------- תאריכים ---------- */
  function parseDate(v) {
    try { var d = isFn(window.parseAppDate) ? window.parseAppDate(v) : null; return d && !isNaN(d.getTime()) ? d : null; } catch (e) { return null; }
  }
  function dmy(d) { return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); }
  // תאריך לתצוגה: dd/mm/yyyy. תאריך שלא ניתן לפענח מוחזר כפי שנשמר (כמו במערכת הקיימת)
  function dateLabel(v) { var d = parseDate(v); return d ? dmy(d) : trim(v); }
  function dayKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function timeLabel(createdAt) {
    if (!createdAt) return '';
    var d = new Date(createdAt);
    return isNaN(d.getTime()) ? '' : pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function stamp(v) { if (!v) return 0; var t = new Date(v).getTime(); return isNaN(t) ? 0 : t; }
  // מהחדש לישן לפי תאריך הרשומה; בתאריך זהה - לפי מועד הרישום; רשומות בלי תאריך תקין בסוף
  function byNewest(a, b) {
    var da = parseDate(a.date), db = parseDate(b.date);
    if (da && db) { var diff = db.getTime() - da.getTime(); if (diff) return diff; }
    else if (da) return -1;
    else if (db) return 1;
    return stamp(b.createdAt) - stamp(a.createdAt);
  }
  // חודש עברי (0 = תשרי ... 11 = אלול). אדר, אדר א' ואדר ב' -> אדר. -1 כשאי אפשר לקבוע
  function hebMonthIndex(date) {
    var p = null;
    try { p = isFn(window.getHebrewDateParts) ? window.getHebrewDateParts(date) : null; } catch (e) { p = null; }
    if (!p || !p.month) return -1;
    var m = String(p.month).toLowerCase();
    if (m.indexOf('adar') === 0) return 5;
    if (m.indexOf('tis') === 0) return 0;
    if (m.indexOf('hes') === 0 || m.indexOf('che') === 0 || m.indexOf('mar') === 0) return 1;
    if (m.indexOf('kis') === 0) return 2;
    if (m.indexOf('tev') === 0) return 3;
    if (m.indexOf('sh') === 0) return 4;
    if (m.indexOf('nis') === 0) return 6;
    if (m.indexOf('iy') === 0) return 7;
    if (m.indexOf('siv') === 0) return 8;
    if (m.indexOf('tam') === 0) return 9;
    if (m.indexOf('av') === 0) return 10;
    if (m.indexOf('elu') === 0) return 11;
    return -1;
  }

  /* ---------- מסגרת, שיעור, ישיבה ---------- */
  function typeKey(oldType) { var k = TYPE_KEY[trim(oldType)]; return k || ''; }
  function shiurLabel(tKey, shiur) {
    if (tKey === 'חיידר') return '';
    var s = trim(str(shiur).replace(/["'`׳״’‘]/g, ''));
    if (!s) return '';
    return /^[א-ת]{1,2}$/.test(s) ? s + '׳' : s;
  }
  function frameLabel(tKey, sLabel) { return tKey ? (sLabel ? tKey + ' ' + sLabel : tKey) : 'ללא מסגרת'; }
  // מפתח השוואה לשם ישיבה: בלי גרש / גרשיים / מירכאות, בלי רווחים כפולים ובלי "ישיבת " בתחילה
  function yeshivaKey(name) {
    var s = trim(str(name).replace(/["'`׳״’‘“”´]/g, '').replace(/\s+/g, ' '));
    return s.replace(/^ישיבת /, '');
  }
  function cleanSpaces(v) { return trim(str(v).replace(/\s+/g, ' ')); }
  // לכל ישיבה: הכתיב הנפוץ ביותר בין כל הבחורים (בשוויון - הראשון שהופיע)
  function yeshivaDisplayNames(members) {
    var counts = dict(), best = dict();
    members.forEach(function (m) {
      var raw = cleanSpaces(m && m.yeshiva), key = yeshivaKey(raw);
      if (!key) return;
      if (!counts[key]) counts[key] = { order: [], n: dict() };
      if (!counts[key].n[raw]) { counts[key].n[raw] = 0; counts[key].order.push(raw); }
      counts[key].n[raw]++;
    });
    Object.keys(counts).forEach(function (key) {
      var c = counts[key], top = c.order[0];
      c.order.forEach(function (raw) { if (c.n[raw] > c.n[top]) top = raw; });
      best[key] = top;
    });
    return best;
  }

  /* ---------- הפקדות ---------- */
  // אשראי מסומן בהערות: "(אשראי) ..." מהטופס הרגיל, "אשראי - נדרים פלוס" מהסליקה
  function isCredit(notes) {
    var s = trim(notes);
    return /^\(אשראי\)/.test(s) || /^אשראי/.test(s) || s.indexOf('נדרים פלוס') !== -1;
  }
  function methodLabel(notes) { return isCredit(notes) ? 'אשראי' : 'מזומן'; }
  function cleanNote(notes) { return trim(trim(notes).replace(/^\(אשראי\)\s*/, '')); }
  function memberKey(id) { return trim(id); }

  function married(row) {
    try { if (isFn(window.isMemberMarried)) return !!window.isMemberMarried(row); } catch (e) { /* ממשיכים לבדיקה המקומית */ }
    return !!row && (row.maritalStatus === 'נשוי' || str(row.notes).indexOf('התחתן') !== -1);
  }
  // כמו ההתראה "פרטים חסרים בכרטיסי בחורים" במערכת הקיימת: טלפון, ישיבה או סוג מסגרת
  function lacksDetails(m) { return !trim(m.phone) || !trim(m.yeshiva) || !trim(m.yeshivaType); }

  // כיסוי החובה של קבוצה: עודף של בחור אחד אינו מכסה חוסר של אחר (כמו getDashboardProgress)
  function coveragePct(rows) {
    var required = 0, covered = 0;
    rows.forEach(function (r) {
      var req = num(r.totalRequiredThisYear);
      required += req;
      covered += Math.min(num(r.collectedThisYear), req);
    });
    return required > 0 ? Math.min(100, Math.round(covered / required * 100)) : null;
  }

  /* ---------- הבנייה ---------- */
  function build(year) {
    var errors = [];
    function safe(name, fn, fallback) {
      try { var v = fn(); return v === undefined || v === null ? fallback : v; }
      catch (e) { errors.push(name + ': ' + (e && e.message ? e.message : e)); return fallback; }
    }

    var st = appState();
    var settingsRaw = st.settings && typeof st.settings === 'object' ? st.settings : {};
    var order = yearsOrder();
    var campaignYear = str(safe('campaignYear', function () { return window.getCampaignYear(); }, '')) || str(settingsRaw.campaignYear) || 'תשפ"ו';
    var selYear = year ? String(year) : campaignYear;
    var selIdx = order.indexOf(selYear);
    var prevYear = selIdx > 0 ? order[selIdx - 1] : null;
    var allMembers = arr(st.members), allDonations = arr(st.donations), allExpenses = arr(st.expenses);

    /* הרשאות: אותה לוגיקה כמו applyPermissions() */
    var can = safe('can', function () {
      var u = st.currentUserObj || null;
      var admin = isFn(window.isAdminUser) ? !!window.isAdminUser() : false;
      function flag(k) { return admin ? true : (u && isFn(window.isTrue) ? !!window.isTrue(u[k]) : false); }
      return { admin: admin, edit: flag('canEdit'), income: flag('canViewIncome'), expenses: flag('canViewExpenses'), grants: flag('canViewGrants'), history: flag('canViewHistory') };
    }, { admin: false, edit: false, income: false, expenses: false, grants: false, history: false });

    /* הגדרות */
    var gifts = [];
    [['gift1Name', 'targetTiyul', 'gift1Enabled', 'טיול'], ['gift2Name', 'targetShayTotal', 'gift2Enabled', 'מתנה']].forEach(function (g) {
      var threshold = num(settingsRaw[g[1]]);
      if (settingsRaw[g[2]] !== false && threshold > 0) gifts.push({ name: trim(settingsRaw[g[0]]) || g[3], threshold: threshold });
    });
    var targets = {};
    Object.keys(TARGET_SETTING).forEach(function (k) { targets[k] = num(settingsRaw[TARGET_SETTING[k]]); });
    var hebrewNow = str(safe('hebrewNow', function () { return window.getCurrentHebrewYearLabel(); }, ''));
    var userName = trim(st.currentUser) || 'אורח';
    var settings = {
      orgName: 'צדקת רבי שמעון', orgSub: 'עזרת חתנים',
      campaignYear: campaignYear,
      todayHebrewYear: hebrewNow || campaignYear,
      todayLabel: dmy(new Date()),
      user: { name: userName, role: can.admin ? 'הרשאת מנהל' : 'משתמש', initial: userName.charAt(0) },
      targets: targets,
      gifts: gifts
    };

    /* שורות הסיכום של המערכת הקיימת */
    var campaignRows = safe('buildMemberSummaries', function () { return arr(window.buildMemberSummaries(campaignYear)); }, []);
    var activeRows = selYear === campaignYear
      ? campaignRows.filter(function (r) { return !married(r); })
      : safe('buildActiveMemberSummaries', function () { return arr(window.buildActiveMemberSummaries(selYear)); }, []);

    /* אינדקסים על ההפקדות (מעבר אחד) */
    var donByMember = dict(), donByYear = dict();
    allDonations.forEach(function (d) {
      if (!d) return;
      var mk = memberKey(d.memberId), y = str(d.year);
      (donByMember[mk] || (donByMember[mk] = [])).push(d);
      (donByYear[y] || (donByYear[y] = [])).push(d);
    });
    function donationsOf(y) { return donByYear[str(y)] || []; }
    function sumAmounts(list) { var s = 0; list.forEach(function (x) { s += num(x && x.amount); }); return s; }
    function purimTotal(y) { return y ? num(safe('purim', function () { return window.getDashboardPurimTotal(y); }, 0)) : 0; }
    function expensesOf(y) { return allExpenses.filter(function (e) { return e && e.year === y; }); }

    var memberNames = dict();
    allMembers.forEach(function (m) { if (m) memberNames[memberKey(m.id)] = trim(str(m.firstName) + ' ' + str(m.lastName)); });
    var yeshivaNames = yeshivaDisplayNames(allMembers);
    function yeshivaGroup(name) { var k = yeshivaKey(name); return k ? (yeshivaNames[k] || cleanSpaces(name)) : ''; }

    function rowType(r) { return typeKey(r.currentYearType); }
    function rowFrame(r) { var k = rowType(r); return frameLabel(k, shiurLabel(k, r.currentYearShiur)); }

    /* מענקים: מתוך ארכיון המענקים דרך הפונקציות הקיימות */
    var grants = safe('grants', function () {
      var empty = { grooms: 0, packageValue: 0, cost: 0, stores: [] };
      // אין ארכיון שמור (למשל משתמש בלי הרשאת מענקים, שהשרת לא מחזיר לו אותו): הכל אפס
      if (!st.grantsArchive || typeof st.grantsArchive !== 'object') return empty;
      var archive = window.getGrantsArchive();
      if (!archive) return empty;
      var yd = (archive.years && archive.years[selYear]) || {};
      var grooms = arr(yd.recipients).length;
      var pkg = window.getGrantPackageForYear(archive, selYear);
      var costPer = window.getStoreCostPerGroom(archive, selYear) || {};
      var storeNames = Object.keys(costPer);
      var paid = dict(), due = dict(), extra = [];
      function addBill(store, amount, isPaid) {
        var s = trim(store);
        if (!s) return;
        if (!(s in costPer) && extra.indexOf(s) === -1) extra.push(s);
        due[s] = (due[s] || 0) + num(amount);
        if (isPaid) paid[s] = (paid[s] || 0) + num(amount);
      }
      arr(window.getStoreBills(archive, selYear)).forEach(function (b) { if (b) addBill(b.store, b.amount, !!b.paid); });
      // תשלומים מהשיטה הקודמת ששויכו למחצית נחשבים חיובים ששולמו (כמו בטבלת התשלומים לחנויות)
      ['א', 'ב'].forEach(function (half) {
        arr(window.getLegacyBillsForHalf(archive, selYear, half, storeNames)).forEach(function (b) { if (b) addBill(b.store, b.amount, true); });
      });
      var stores = [];
      storeNames.concat(extra).forEach(function (s) {
        var expected = r2(num(costPer[s]) * grooms), p = r2(paid[s] || 0);
        if (!(expected > 0) && !(p > 0)) return;
        stores.push({
          store: s, expected: expected, paid: p, due: r2(due[s] || 0),
          status: !(p > 0) ? 'לא שולם' : (expected > 0 && p + 0.005 < expected ? 'שולם חלקית' : 'שולם')
        });
      });
      return {
        grooms: grooms,
        packageValue: r2(window.getGrantPackageRetailTotal(pkg)),      // שווי החבילה לחתן (מחיר מלא בחנות)
        cost: r2(num(window.getGrantPackageTotal(pkg)) * grooms),       // עלות לארגון × מקבלי המענק של השנה
        stores: stores
      };
    }, { grooms: 0, packageValue: 0, cost: 0, stores: [] });

    /* סיכום לשנה שנבחרה */
    var yearDonations = donationsOf(selYear);
    var donationsSum = sumAmounts(yearDonations);
    var purimThisYear = purimTotal(selYear);
    var yearExpenses = expensesOf(selYear);

    var summary = safe('summary', function () {
      var baseTarget = 0, pastDebt = 0, required = 0, missing = 0;
      var withTarget = 0, metTarget = 0, debtors = 0, notStarted = 0, nearEligible = 0;
      activeRows.forEach(function (r) {
        var target = num(r.currentYearTarget), debt = num(r.totalDebtFromPast), gap = num(r.missingAmount);
        baseTarget += target; pastDebt += debt; required += num(r.totalRequiredThisYear); missing += gap;
        if (target > 0) withTarget++;
        if (r.isEligible) metTarget++;
        if (debt > 0) debtors++;
        if (target > 0 && num(r.collectedThisYear) === 0) notStarted++;
        if (!r.isEligible && gap > 0 && gap <= NEAR_LIMIT) nearEligible++;
      });
      var depositorSet = dict(), depositors = 0, creditSum = 0;
      yearDonations.forEach(function (d) {
        var mk = memberKey(d.memberId);
        if (mk && mk !== 'null' && mk !== 'undefined' && !depositorSet[mk]) { depositorSet[mk] = 1; depositors++; }
        if (isCredit(d.notes)) creditSum += num(d.amount);
      });
      var collected = donationsSum + purimThisYear;
      var lastYear = prevYear ? sumAmounts(donationsOf(prevYear)) + purimTotal(prevYear) : 0;
      var creditShare = donationsSum > 0 ? Math.max(0, Math.min(100, Math.round(creditSum / donationsSum * 100))) : 0;
      return {
        activeMembers: activeRows.length, withTarget: withTarget,
        collected: r2(collected), baseTarget: r2(baseTarget), pastDebt: r2(pastDebt), required: r2(required),
        missing: r2(missing),
        progressPct: num(isFn(window.getDashboardProgress) ? window.getDashboardProgress(activeRows) : coveragePct(activeRows)),
        metTarget: metTarget, debtors: debtors, notStarted: notStarted, nearEligible: nearEligible,
        missingDetails: allMembers.filter(function (m) { return m && !married(m) && lacksDetails(m); }).length,
        deposits: yearDonations.length, depositors: depositors,
        avgDeposit: yearDonations.length ? Math.round(donationsSum / yearDonations.length) : 0,
        collectedLastYear: r2(lastYear),
        growthPct: lastYear > 0 ? Math.round((collected - lastYear) / lastYear * 1000) / 10 : 0,
        purimThisYear: r2(purimThisYear), purimAddresses: arr(st.purimAddresses).length,
        expensesTotal: r2(sumAmounts(yearExpenses)),
        grantsCost: grants.cost, grooms: grants.grooms, packageValue: grants.packageValue,
        cashShare: donationsSum > 0 ? 100 - creditShare : 0, creditShare: creditShare
      };
    }, {
      activeMembers: 0, withTarget: 0, collected: 0, baseTarget: 0, pastDebt: 0, required: 0, missing: 0, progressPct: 0,
      metTarget: 0, debtors: 0, notStarted: 0, nearEligible: 0, missingDetails: 0, deposits: 0, depositors: 0, avgDeposit: 0,
      collectedLastYear: 0, growthPct: 0, purimThisYear: 0, purimAddresses: 0, expensesTotal: 0, grantsCost: 0, grooms: 0,
      packageValue: 0, cashShare: 0, creditShare: 0
    });

    /* מסגרות */
    var frameworks = safe('frameworks', function () {
      var groups = dict();
      activeRows.forEach(function (r) { var k = rowType(r); if (k) (groups[k] || (groups[k] = [])).push(r); });
      var out = [];
      TYPE_ORDER.forEach(function (k) {
        var rows = groups[k];
        if (!rows || !rows.length) return;
        var target = targets[k] || 0, collected = 0, required = 0, met = 0, withDebt = 0;
        rows.forEach(function (r) {
          collected += num(r.collectedThisYear); required += num(r.totalRequiredThisYear);
          if (r.isEligible) met++;
          if (num(r.totalDebtFromPast) > 0) withDebt++;
        });
        if (target > 0) {
          out.push({ key: k, name: TYPE_NAME[k], members: rows.length, target: target, collected: r2(collected), required: r2(required), met: met, pct: coveragePct(rows) || 0 });
        } else if (k === 'חיידר') {
          out.push({ key: k, name: TYPE_NAME[k], members: rows.length, target: 0, note: NOTE_CHEDER });
        } else {
          out.push({ key: k, name: TYPE_NAME[k], members: rows.length, target: 0, eligible: met, withDebt: withDebt, note: NOTE_NO_TARGET });
        }
      });
      return out;
    }, []);

    /* ישיבות */
    var yeshivas = safe('yeshivas', function () {
      var groups = dict(), keys = [];
      activeRows.forEach(function (r) {
        var k = yeshivaKey(r.yeshiva);
        if (!k) return;
        if (!groups[k]) { groups[k] = []; keys.push(k); }
        groups[k].push(r);
      });
      var list = keys.map(function (k) {
        var rows = groups[k], collected = 0;
        rows.forEach(function (r) { collected += num(r.collectedThisYear); });
        var pct = coveragePct(rows);
        var item = { name: yeshivaNames[k] || k, members: rows.length, collected: r2(collected), pct: pct };
        if (pct === null) item.note = 'ללא יעד';
        return item;
      });
      list.sort(function (a, b) {
        if (a.pct === null || b.pct === null) { if (a.pct !== b.pct) return a.pct === null ? 1 : -1; }
        else if (a.pct !== b.pct) return b.pct - a.pct;
        return (b.collected - a.collected) || (b.members - a.members) || a.name.localeCompare(b.name, 'he');
      });
      return list.slice(0, 5);
    }, []);

    /* הכנסות והוצאות לפי שנה: אותן שורות כמו בגרף "גבייה מול הוצאות" */
    var yearly = safe('yearly', function () {
      var endIdx = Math.max(selIdx, order.indexOf(campaignYear));
      var list = arr(window.getFinanceYears()).filter(function (y) { return endIdx === -1 || order.indexOf(y) <= endIdx; });
      if (list.indexOf(selYear) === -1) list.push(selYear); // השנה שנבחרה מוצגת גם כשעדיין אין בה נתונים
      list.sort(function (a, b) {
        var ia = order.indexOf(a), ib = order.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        return ia !== -1 ? -1 : ib !== -1 ? 1 : 0;
      });
      return arr(window.buildFinanceRows(list.slice(-4))).map(function (row) {
        return { year: str(row.year), boys: r2(row.members), purim: r2(row.purim), expenses: r2(num(row.expenses) + num(row.grants)) };
      });
    }, [{ year: selYear, boys: r2(donationsSum), purim: r2(purimThisYear), expenses: r2(sumAmounts(yearExpenses)) }]);

    /* גבייה לפי חודש עברי */
    var monthly = safe('monthly', function () {
      var out = HEB_MONTHS.map(function (m) { return { month: m, amount: 0, lastYear: 0 }; });
      function fill(list, field) {
        list.forEach(function (d) {
          var date = parseDate(d.date);
          var i = date ? hebMonthIndex(date) : -1;
          if (i !== -1) out[i][field] += num(d.amount);
        });
      }
      fill(yearDonations, 'amount');
      if (prevYear) fill(donationsOf(prevYear), 'lastYear');
      out.forEach(function (m) { m.amount = r2(m.amount); m.lastYear = r2(m.lastYear); });
      return out;
    }, HEB_MONTHS.map(function (m) { return { month: m, amount: 0, lastYear: 0 }; }));

    /* הוצאות לפי קטגוריה */
    var expenseCategories = safe('expenseCategories', function () {
      var sums = dict(), names = [];
      yearExpenses.forEach(function (e) {
        var c = trim(e.category) || 'שונות';
        if (!(c in sums)) { sums[c] = 0; names.push(c); }
        sums[c] += num(e.amount);
      });
      return names.map(function (c) { return { name: c, amount: r2(sums[c]) }; })
        .filter(function (c) { return c.amount > 0; })
        .sort(function (a, b) { return b.amount - a.amount; });
    }, []);

    /* דורש טיפול: אותם תנאים ואותו סדר כמו renderDashboardAttention */
    var alerts = safe('alerts', function () {
      var items = [];
      var campIdx = order.indexOf(campaignYear);
      if (can.admin && hebrewNow && campIdx !== -1 && order.indexOf(hebrewNow) > campIdx) {
        items.push({ key: 'newyear', tone: 'info', title: 'התחילה שנה עברית חדשה', detail: 'לעדכן את שנת הקמפיין ל' + hebrewNow + ' בהגדרות', count: null });
      }
      if (summary.nearEligible) items.push({ key: 'near', tone: 'warn', title: 'קרובים לזכאות', detail: 'חסר להם עד ' + fmt(NEAR_LIMIT) + ' להשלמת היעד', count: summary.nearEligible });
      if (summary.debtors) items.push({ key: 'debt', tone: 'bad', title: 'בחורים עם חוב עבר', detail: 'סך החובות ' + fmt(summary.pastDebt), count: summary.debtors });
      if (summary.notStarted) items.push({ key: 'idle', tone: 'idle', title: 'טרם התחילו לגבות השנה', detail: 'בחורים עם יעד וללא הפקדות', count: summary.notStarted });
      if (summary.missingDetails) items.push({ key: 'details', tone: 'idle', title: 'כרטיסים עם פרטים חסרים', detail: 'ללא טלפון, ישיבה או סוג מסגרת', count: summary.missingDetails });
      var exp = safe('expenseAlert', function () { return window.getDashboardExpenseCategoryAlert(selYear); }, null);
      if (exp && exp.title) {
        // הכותרת והפירוט בנוסח של המערכת הקיימת ("הוצאה חריגה: ..." / "קטגוריית הוצאה מובילה: ...")
        items.push({ key: 'expense', tone: 'warn', title: str(exp.title), detail: str(exp.sub), count: null, category: str(exp.category), amount: r2(exp.value) });
      }
      return items.slice(0, 5);
    }, []);

    /* פעילות אחרונה */
    var activity = safe('activity', function () {
      var items = [];
      yearDonations.forEach(function (d) {
        items.push({
          id: str(d.id), type: 'in',
          title: memberNames[memberKey(d.memberId)] || trim(d.memberNameSnapshot) || 'הפקדה כללית',
          method: methodLabel(d.notes), date: d.date, createdAt: d.createdAt, amount: r2(d.amount)
        });
      });
      yearExpenses.forEach(function (e) {
        var cat = trim(e.category), desc = trim(e.description);
        items.push({
          id: str(e.id), type: 'out',
          title: cat && desc && cat !== desc ? cat + ' · ' + desc : (desc || cat || 'הוצאה'),
          method: null, date: e.date, createdAt: e.createdAt, amount: r2(e.amount)
        });
      });
      items.sort(byNewest);
      return items.slice(0, 8).map(function (x) {
        return { id: x.id, type: x.type, title: x.title, method: x.method, date: dateLabel(x.date), time: timeLabel(x.createdAt), amount: x.amount };
      });
    }, []);

    /* בחורים: תמיד לפי שנת הקמפיין, כמו רשימת הבחורים במערכת הקיימת */
    var rowById = dict();
    var members = safe('members', function () {
      return campaignRows.map(function (r) {
        var id = str(r.id), tKey = rowType(r), sLabel = shiurLabel(tKey, r.currentYearShiur);
        var collected = r2(r.collectedThisYear), base = r2(r.currentYearTarget), debt = r2(r.totalDebtFromPast);
        var required = r2(r.totalRequiredThisYear), gap = r2(r.missingAmount);
        var old = isFn(window.getMemberStatus) ? window.getMemberStatus(r) : { label: 'טרם החל' };
        var mapped = STATUS_MAP[old.label] || STATUS_MAP['טרם החל'];
        var address = trim(r.address);
        var deposits = (donByMember[memberKey(r.id)] || []).slice().sort(byNewest).map(function (d) {
          return { id: str(d.id), date: dateLabel(d.date), amount: r2(d.amount), method: methodLabel(d.notes), year: str(d.year), note: cleanNote(d.notes) };
        });
        rowById[id] = r;
        return {
          id: id, first: trim(r.firstName), last: trim(r.lastName), full: trim(r.fullName) || trim(str(r.firstName) + ' ' + str(r.lastName)),
          // yeshiva = הכתיב המאוחד (אותו שם כמו ב-yeshivas, כדי שסינון לפי ישיבה יתפוס את כל הכתיבים); yeshivaRaw = כפי שנשמר בכרטיס
          father: trim(r.fatherName), yeshiva: yeshivaGroup(r.yeshiva), yeshivaRaw: cleanSpaces(r.yeshiva),
          type: tKey, shiur: sLabel, frame: frameLabel(tKey, sLabel),
          city: address ? trim(address.split(',').pop()) : '',
          phone: trim(r.phone), address: address, notes: str(r.notes), married: married(r),
          collected: collected, base: base, debt: debt, required: required, gap: gap,
          hasTarget: required > 0,
          pct: required > 0 ? Math.min(100, Math.floor(collected / required * 100)) : null,
          status: { key: mapped.key, tone: mapped.tone, label: str(old.label) || 'טרם החל' },
          near: !r.isEligible && gap > 0 && gap <= NEAR_LIMIT,
          missingDetails: lacksDetails(r),
          gifts: gifts.map(function (g) { return { name: g.name, threshold: g.threshold, earned: collected >= g.threshold, missing: r2(Math.max(0, g.threshold - collected)) }; }),
          deposits: deposits
        };
      });
    }, []);

    var statusFilters = STATUS_FILTERS.map(function (f) {
      var count = 0;
      members.forEach(function (m) {
        if (m.married) return;
        if (f.key === 'all' || (f.key === 'near' ? m.near : m.status.key === f.key)) count++;
      });
      return { key: f.key, label: f.label, count: count };
    });

    /* היסטוריית זכאות של בחור, מהשנה הישנה לחדשה */
    function historyOf(m) {
      try {
        var r = rowById[str(m && typeof m === 'object' ? m.id : m)];
        if (!r) return [];
        var list = arr(r.yearlyData).slice().reverse();
        if (!can.history) list = list.filter(function (d) { return str(d.year) === str(r.currentYear); });
        return list.map(function (d) {
          var tKey = typeKey(d.historicalType);
          var target = r2(d.target), collected = r2(d.collected);
          var required = r2(d.requiredTotal != null ? d.requiredTotal : d.target);
          var debtOut = r2(d.debtOut);
          var isCurrent = str(d.year) === str(r.currentYear);
          var status, tone;
          if (!(target > 0)) {
            status = 'ללא יעד' + (debtOut > 0 ? ' · חוב ' + fmt(debtOut) + ' ממתין' : ''); tone = 'idle';
          } else if (collected >= required && required > 0) {
            status = 'עמד ביעד'; tone = 'good';
          } else if (isCurrent) {
            status = 'חסר ' + fmt(required - collected); tone = 'warn'; // השנה עדיין פתוחה: אין עדיין קנס
          } else {
            status = 'חסר ' + fmt(required - collected) + (debtOut > 0 ? ' · קנס עובר הלאה ' + fmt(debtOut) : ''); tone = 'bad';
          }
          return { year: str(d.year), frame: frameLabel(tKey, shiurLabel(tKey, d.historicalShiur)), target: target, required: required, collected: collected, status: status, tone: tone };
        });
      } catch (e) { return []; }
    }
    function statusOf(m) { return m && m.status ? m.status : { key: 'none', tone: 'idle', label: 'טרם החל' }; }

    /* מובילי הגבייה: רק למי שמורשה לראות הכנסות */
    var leaderboard = safe('leaderboard', function () {
      if (!can.income) return [];
      return activeRows.filter(function (r) { return num(r.collectedThisYear) > 0; })
        .sort(function (a, b) { return (num(b.collectedThisYear) - num(a.collectedThisYear)) || str(a.fullName).localeCompare(str(b.fullName), 'he'); })
        .slice(0, 5)
        .map(function (r, i) {
          return { rank: i + 1, id: str(r.id), name: trim(r.fullName), yeshiva: yeshivaGroup(r.yeshiva), frame: rowFrame(r), amount: r2(r.collectedThisYear) };
        });
    }, []);

    /* מפת חום: 26 שבועות עד השבוע הנוכחי, ראשון עד שבת, מכל ההפקדות לפי תאריך */
    var heatmap = safe('heatmap', function () {
      var perDay = dict();
      allDonations.forEach(function (d) {
        var date = d ? parseDate(d.date) : null;
        if (!date) return;
        var k = dayKey(date);
        if (!perDay[k]) perDay[k] = { amount: 0, count: 0 };
        perDay[k].amount += num(d.amount); perDay[k].count++;
      });
      var now = new Date(), weeks = [];
      var sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      for (var w = 0; w < 26; w++) {
        var days = [];
        for (var dow = 0; dow < 7; dow++) {
          var dt = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() - (25 - w) * 7 + dow);
          var cell = perDay[dayKey(dt)];
          days.push({ date: dmy(dt), dow: dow, amount: cell ? r2(cell.amount) : 0, count: cell ? cell.count : 0 });
        }
        weeks.push(days);
      }
      return { weeks: weeks, dayNames: DAY_NAMES.slice() };
    }, { weeks: [], dayNames: DAY_NAMES.slice() });

    /* ניווט ופעולות מהירות לפי הרשאות */
    function allowed(key) {
      if (key === 'purim') return can.income;
      if (key === 'expenses') return can.expenses;
      if (key === 'transactions' || key === 'report') return can.income || can.expenses;
      if (key === 'grants') return can.grants;
      if (key === 'settings') return can.admin;
      if (key === 'deposit' || key === 'member' || key === 'expense' || key === 'credit') return can.edit;
      return true;
    }
    var nav = clone(NAV).filter(function (n) { return allowed(n.key); });
    var quickActions = clone(QUICK_ACTIONS).filter(function (q) { return allowed(q.key); });

    var imageSlots = clone(IMAGE_SLOTS), images = {};
    imageSlots.forEach(function (sl) { images[sl.key] = IMAGE_BASE + sl.key + '.webp'; });

    api.lastErrors = errors;
    if (errors.length && typeof console !== 'undefined' && console.warn) console.warn('NDData.build:', errors.join(' | '));

    return {
      year: selYear,
      imageSlots: imageSlots, images: images,
      fmt: fmt, settings: settings, can: can, summary: summary, frameworks: frameworks, yeshivas: yeshivas,
      yearly: yearly, monthly: monthly, expenseCategories: expenseCategories, alerts: alerts,
      activity: activity, members: members, historyOf: historyOf, statusOf: statusOf,
      leaderboard: leaderboard, heatmap: heatmap, grants: grants, nav: nav, quickActions: quickActions,
      statusFilters: statusFilters
    };
  }

  var api = {
    lastErrors: [],
    build: function (year) {
      try { return build(year); }
      catch (e) {
        // רשת ביטחון אחרונה: build לא אמור להגיע לכאן, אבל אסור לו לזרוק
        api.lastErrors = ['build: ' + (e && e.message ? e.message : e)];
        if (typeof console !== 'undefined' && console.error) console.error('NDData.build failed', e);
        return null;
      }
    }
  };
  window.NDData = api;
})();
