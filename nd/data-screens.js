/* nd/data-screens.js
   מתאם נתונים לקריאה בלבד לשישה מסכים של העיצוב החדש:
   מענקים, כתובות פורים, דו"ח תנועות, סיכום הוצאות, תקנון והגדרות.

   נטען אחרי script.js (סקריפט רגיל, לא מודול) וקורא את state ואת פונקציות החישוב של המערכת הקיימת.
   חושף:  window.NDScreens.build()  ->  { grantsX, purimX, transactionsX, expensesX, rulesX, settingsX, frames }
   באותם מבנים של redesign/shared/data-screens.js (שם הם נבנים מנתוני הדגמה).

   כללים:
   - קריאה בלבד: לא כותב ל-DOM, לא משנה את state, לא פונה לרשת
     (חוץ מ-settingsX.loadAudit, שקוראת את יומן הפעולות רק כשמפעילים אותה).
   - לא זורק שגיאה ולא מחזיר NaN / undefined במספרים, גם כשהנתונים ריקים או חלקיים.
   - תוויות שנה נשארות כפי שהן שמורות במסד (גרשיים רגילים: תשפ"ו).
   - build(opts) מקבל באופן רשות:
       { grantsYear }  להציג שנת מענקים אחרת מזו של שנת הפעילות;
       { year }        להוסיף ל-transactionsX.grantsByYear שנה שנבחרה לתצוגה, גם אם אינה בגרף הקיים. */
(function () {
  'use strict';

  var YEARS_FALLBACK = ['תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט', 'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט', 'תש"צ'];
  var DEFAULT_YEAR = 'תשפ"ו';
  var DEFAULT_CATS = ['הדפסות', 'כנסים', 'סעודות', 'מתנות', 'תפעול', 'שונות'];
  // שנת המענקים רצה מפורים עד פורים: מחצית א׳ = ניסן–אלול, מחצית ב׳ = תשרי–אדר של השנה שאחריה
  var HALF_LABELS = { 'א': 'מחצית א׳ · ניסן–אלול', 'ב': 'מחצית ב׳ · תשרי–אדר' };
  var PERMS = [['canEdit', 'הוספה ועריכה'], ['canViewIncome', 'הכנסות ופורים'], ['canViewExpenses', 'הוצאות'], ['canViewGrants', 'מענקים'], ['canViewHistory', 'היסטוריית זכאות']];
  var ACTIONS = { create: 'הוספה', update: 'עדכון', 'delete': 'מחיקה', 'import': 'ייבוא', paid: 'סימון תשלום', upload: 'העלאת קבלה' };
  var ENTITIES = { member: 'בחור', donation: 'הפקדה', expense: 'הוצאה', purim: 'כתובות פורים', settings: 'הגדרות', 'expense-category': 'קטגוריית הוצאה',
    'grant-recipient': 'מקבל מענק', 'grant-package': 'תכולת מענק', 'grant-year': 'שנת מענקים', 'store-bill': 'תשלום לחנות', backup: 'גיבוי', profile: 'הרשאות משתמש' };
  var SHIURIM = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];

  /* ---------- עזרים כלליים ---------- */
  function arr(v) { return Array.isArray(v) ? v : []; }
  function obj(v) { return v && typeof v === 'object' ? v : {}; }
  function str(v) { return v == null ? '' : String(v); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }          // כמו Number(x) || 0 במערכת הקיימת
  function r2(v) { return Math.round(num(v) * 100) / 100; }
  function pad(v) { return (v < 10 ? '0' : '') + v; }
  function map0() { return Object.create(null); }
  function uniq(list) { var seen = map0(), out = []; list.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
  function warn(what, e) { try { if (window.console && console.warn) console.warn('NDScreens: ' + what, e); } catch (x) {} }

  // state של המערכת הקיימת (משתנה let גלובלי של script.js). בלעדיו הכול ריק.
  function appState() {
    try { if (typeof state !== 'undefined' && state && typeof state === 'object') return state; } catch (e) {}
    return {};
  }
  function settings() { return obj(appState().settings); }
  function yearsOrder() {
    try { if (typeof HEBREW_YEARS_ORDER !== 'undefined' && Array.isArray(HEBREW_YEARS_ORDER) && HEBREW_YEARS_ORDER.length) return HEBREW_YEARS_ORDER; } catch (e) {}
    return YEARS_FALLBACK;
  }
  function campaignYear() { return str(settings().campaignYear) || DEFAULT_YEAR; }

  // תאריכים: אותם פורמטים של parseAppDate / formatDateDisplay בקוד הקיים
  function parseDate(val) {
    try { if (typeof parseAppDate === 'function') return parseAppDate(val); } catch (e) {}
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    var s = String(val).trim(), m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), d;
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/);
    if (m) return new Date(m[3].length === 2 ? 2000 + (+m[3]) : +m[3], +m[2] - 1, +m[1]);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) { d = new Date(s); return isNaN(d.getTime()) ? null : d; }
    return null;
  }
  // dd/mm/yyyy; תאריך שלא מתפענח חוזר כפי שנשמר (כמו במערכת הקיימת); ריק -> ''
  function fmtDate(val) {
    if (!val) return '';
    var d = parseDate(val);
    return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : String(val);
  }
  function fmtDateTime(val) {
    var d = new Date(val);
    return isNaN(d.getTime()) ? '' : pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  // מהחדש לישן; תאריך שלא מתפענח בסוף; סדר יציב (כמו compareDatesDesc + sort במסך הקיים)
  function sortNewestFirst(list, dateOf) {
    return list.map(function (x, i) { var d = parseDate(dateOf(x)); return { x: x, i: i, t: d ? d.getTime() : -Infinity }; })
      .sort(function (a, b) { return a.t === b.t ? a.i - b.i : (b.t > a.t ? 1 : -1); })
      .map(function (w) { return w.x; });
  }
  // סדר שנים: שנים מוכרות לפי הלוח, תוויות אחרות (למשל "כללי") לפניהן לפי א"ב
  function sortYearsAsc(list) {
    var order = yearsOrder();
    return list.slice().sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return 1;
      if (ib !== -1) return -1;
      return String(a).localeCompare(String(b), 'he');
    });
  }
  // סכום שהוקלד כטקסט ("1,200", "₪180") -> מספר; טקסט שאינו מספר -> 0
  function looseAmount(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var t = str(v).replace(/[,₪\s]/g, '');
    if (!t) return 0;
    return num(t);
  }
  function emptyHalves() {
    return { 'א': { label: HALF_LABELS['א'], grooms: 0, bills: [] }, 'ב': { label: HALF_LABELS['ב'], grooms: 0, bills: [] } };
  }

  /* ---------- מענקים ---------- */
  function grantsArchive() {
    // getGrantsArchive מחזיר עותק ממוזג עם ברירות המחדל, ולא נוגע ב-state
    try { if (typeof getGrantsArchive === 'function') { var a = getGrantsArchive(); if (a && typeof a === 'object') { if (!a.years || typeof a.years !== 'object') a.years = {}; return a; } } } catch (e) { warn('grants archive', e); }
    var raw = obj(appState().grantsArchive);
    return { years: obj(raw.years), 'package': arr(raw['package']), payments: arr(raw.payments) };
  }
  function grantYearsAsc(archive) {
    try { if (typeof getSortedGrantYears === 'function') return arr(getSortedGrantYears(archive)); } catch (e) {}
    var order = yearsOrder();
    return Object.keys(obj(archive.years)).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, 'he');
    });
  }
  // כמות של פריט: 0 היא באמת 0; רק כמות חסרה נחשבת 1 (pkgQty בקוד הקיים)
  function qtyOf(item) {
    var q = item ? item.qty : undefined;
    return (q === undefined || q === null || q === '') ? 1 : num(q);
  }
  function packageGroups(archive, year) {
    var yd = obj(obj(archive.years)[year]);
    return Array.isArray(yd['package']) ? yd['package'] : arr(archive['package']);
  }
  // עלות לארגון לחתן בכל חנות (getStoreCostPerGroom)
  function storeCosts(archive, year) {
    var out = {};
    packageGroups(archive, year).forEach(function (group) {
      group = obj(group);
      var store = str(group.store).trim();
      if (!store) return;
      var cost = arr(group.items).reduce(function (sum, it) { it = obj(it); return sum + (it.value != null ? num(it.value) : num(it.orgPrice) * qtyOf(it)); }, 0);
      out[store] = (out[store] || 0) + cost;
    });
    return out;
  }
  // המחצית של חתן לפי התאריך שלו, רק אם התאריך בתוך שנת המענקים (כמו countGroomsByHalf). אחרת ''.
  function halfOfRecipient(dateVal, year) {
    try {
      var d = parseDate(dateVal), h;
      if (!d) return '';
      // כלל המחציות של המנוע: שנת מענקים מפורים עד פורים (ניסן–אלול = א׳, תשרי–אדר של השנה שאחריה = ב׳)
      if (typeof getGrantHalf === 'function') { h = getGrantHalf(d, year); return h === 'א' || h === 'ב' ? h : ''; }
      return '';
    } catch (e) { return ''; }
  }
  function legacyBills(archive, year, half, storeNames) {
    try { if (typeof getLegacyBillsForHalf === 'function') return arr(getLegacyBillsForHalf(archive, year, half, storeNames)); } catch (e) { warn('legacy bills', e); }
    return [];
  }
  function billRow(store, bill, expected, first) {
    var legacy = !!(bill && bill.legacy), paid = !!(bill && (legacy || bill.paid));
    return {
      store: store, shop: store,
      expected: r2(expected),
      billed: bill ? r2(bill.amount) : 0,
      status: !bill ? 'טרם הוזן חיוב' : paid ? 'שולם' : 'ממתין לתשלום',
      ref: bill ? str(bill.reference) : '',
      // תשלום מהשיטה הקודמת: התאריך הוא טקסט חופשי ("אדר תשפ"ו"); אם אינו מתפענח הוא חוזר כפי שנשמר
      paidOn: !bill || !paid ? '' : legacy ? fmtDate(bill.legacyDate) : fmtDate(bill.paidDate),
      method: bill && paid ? str(bill.method) : '',
      receipt: !!(bill && bill.receipt && bill.receipt.path),
      id: !bill ? '' : legacy ? str(bill.key) : str(bill.bid),
      notes: bill ? str(bill.notes) : '',
      legacy: legacy,          // נרשם בשיטה הקודמת: אין לו חיוב לעריכה, רק שיוך למחצית (id = מפתח התשלום הישן)
      first: !!first           // הצפי מוצג רק בשורה הראשונה של כל חנות, כמו בטבלה הקיימת
    };
  }
  function buildGrants(opts) {
    var cy = campaignYear(), archive = grantsArchive();
    var yearsAsc = grantYearsAsc(archive), allYears = obj(archive.years);
    var year = (opts && opts.grantsYear && allYears[opts.grantsYear]) ? opts.grantsYear
      : allYears[cy] ? cy : (yearsAsc.length ? yearsAsc[yearsAsc.length - 1] : cy);
    var yd = obj(allYears[year]);
    var counts = { 'א': 0, 'ב': 0, none: 0 };

    var recipients = arr(yd.recipients).map(function (r, i) {
      r = obj(r);
      var half = halfOfRecipient(r.date, year);
      counts[half || 'none']++;
      return { n: i + 1, name: str(r.name), idn: str(r.id), phone: str(r.phone), date: fmtDate(r.date), half: half, rid: str(r.rid) };
    });

    var pkg = packageGroups(archive, year).map(function (group) {
      group = obj(group);
      var total = 0, cost = 0;
      var items = arr(group.items).map(function (it) {
        it = obj(it);
        var q = qtyOf(it), value = num(it.storePrice) * q, c = it.value != null ? num(it.value) : num(it.orgPrice) * q;
        total += value; cost += c;
        return { name: str(it.name), qty: q, value: r2(value), cost: r2(c) };   // value = שווי (מחיר מלא × כמות) · cost = עלות לארגון
      });
      return { store: str(group.store), shop: str(group.store), discount: str(group.discount), items: items, total: r2(total), cost: r2(cost) };
    });

    var costs = storeCosts(archive, year), costNames = Object.keys(costs);
    var storeBills = arr(yd.storeBills).filter(function (b) { return b && typeof b === 'object'; });
    var halves = emptyHalves();
    ['א', 'ב'].forEach(function (half) {
      var bills = storeBills.filter(function (b) { return b.half === half; }).concat(legacyBills(archive, year, half, costNames));
      var names = uniq(costNames.concat(bills.map(function (b) { return str(b.store); })));
      var grooms = counts[half], rows = [];
      names.forEach(function (store) {
        var own = bills.filter(function (b) { return str(b.store) === store; });
        var expected = costs[store] && grooms ? costs[store] * grooms : 0;
        if (own.length) own.forEach(function (b, i) { rows.push(billRow(store, b, i === 0 ? expected : 0, i === 0)); });
        else rows.push(billRow(store, null, expected, true));
      });
      halves[half].grooms = grooms;
      halves[half].bills = rows;
    });

    return { year: year, years: yearsAsc.slice().reverse(), recipients: recipients, 'package': pkg, halves: halves,
      noHalf: counts.none };   // חתנים בלי תאריך בשנה הזו: לא נכללים בצפי של אף מחצית
  }
  function emptyGrants() { return { year: campaignYear(), years: [], recipients: [], 'package': [], halves: emptyHalves(), noHalf: 0 }; }

  /* ---------- כתובות פורים ---------- */
  // 4 השנים האחרונות עד שנת הפעילות (כמו getPurimYearsToShow במצב הרגיל)
  function purimYears() {
    var order = yearsOrder(), cy = campaignYear(), idx = order.indexOf(cy);
    if (idx === -1) idx = order.indexOf(DEFAULT_YEAR);
    if (idx === -1) return [cy];
    return order.slice(Math.max(0, idx - 3), idx + 1);
  }
  function buildPurim() {
    var years = purimYears(), manual = obj(settings().purimManualSums);
    var cities = [], byCity = map0();
    // אותו קיבוץ ואותו סדר של renderPurimGroups: עיר ואז קבוצה, לפי סדר ההופעה ברשימה
    arr(appState().purimAddresses).forEach(function (row) {
      if (!row || typeof row !== 'object') return;
      var city = String(row['עיר'] || 'ללא עיר').trim(), group = String(row['קבוצה'] || 'ללא שיוך').trim();
      if (!byCity[city]) { byCity[city] = { names: [], groups: map0() }; cities.push(city); }
      if (!byCity[city].groups[group]) { byCity[city].groups[group] = []; byCity[city].names.push(group); }
      byCity[city].groups[group].push(row);
    });
    var groups = [];
    cities.forEach(function (city) {
      byCity[city].names.forEach(function (group) {
        var list = byCity[city].groups[group], gs = obj(manual[group]), sums = {};
        years.forEach(function (y) { sums[y] = num(gs[y]); });   // המפתח הוא שם הקבוצה בלבד, כמו במערכת הקיימת
        var rows = list.map(function (row, i) {
          var rawN = str(row["מס'"]).trim(), amounts = {};
          years.forEach(function (y) { amounts[y] = looseAmount(row[y]); });
          return {
            n: !rawN ? i + 1 : /^\d+$/.test(rawN) ? Number(rawN) : rawN,
            family: str(row['משפחה']), first: str(row['שם']),
            // אם אין עמודת "רחוב" ויש שדה כתובת אחד בטקסט חופשי, הוא נכנס ל-street
            street: str(row['רחוב'] || row['כתובת'] || ''), house: str(row['מספר']), apt: str(row['דירה']),
            amounts: amounts, note: str(row['הערות']),
            win: null, stay: 0, stairs: false,
            sbId: str(row.__sbId)
          };
        });
        groups.push({ city: city, group: group, addresses: list.length, sums: sums, rows: rows });
      });
    });
    // סך הפורים לשנה כפי שהמערכת הקיימת מחשבת אותו (getDashboardPurimTotal): כל שם קבוצה נספר פעם אחת,
    // גם אם הוא מופיע בכמה ערים וגם אם אין לו כתובות. סכימה של groups[].sums עלולה לספור קבוצה כזו פעמיים.
    var totals = {};
    years.forEach(function (y) {
      totals[y] = r2(Object.keys(manual).reduce(function (sum, name) { var gs = manual[name]; return sum + (gs && gs[y] ? num(gs[y]) : 0); }, 0));
    });
    return { years: years, groups: groups, cities: cities, totals: totals };
  }

  /* ---------- דו"ח תנועות ---------- */
  function memberNames() {
    var out = map0();
    arr(appState().members).forEach(function (m) {
      if (!m) return;
      out[String(m.id).trim()] = (str(m.firstName) + ' ' + str(m.lastName)).trim();
    });
    return out;
  }
  function methodOf(notes) {
    var t = str(notes).replace(/^\s+/, '');
    return (/^\(אשראי\)/.test(t) || /^אשראי/.test(t) || t.indexOf('נדרים פלוס') > -1) ? 'אשראי' : 'מזומן';
  }
  function financeYears() {
    try { if (typeof getFinanceYears === 'function') return arr(getFinanceYears()); } catch (e) { warn('finance years', e); }
    return [campaignYear()];
  }
  function buildTransactions(opts) {
    var S = appState(), cy = campaignYear(), names = memberNames();
    var donations = arr(S.donations).filter(function (d) { return d && typeof d === 'object'; });
    var expenses = arr(S.expenses).filter(function (e) { return e && typeof e === 'object'; });
    function inc(d) {
      return { id: str(d.id), date: fmtDate(d.date), name: names[String(d.memberId).trim()] || str(d.memberNameSnapshot).trim() || 'הפקדה כללית',
        method: methodOf(d.notes), amount: num(d.amount), year: str(d.year) };
    }
    function exp(e) {
      return { id: str(e.id), date: fmtDate(e.date), title: str(e.description) || str(e.category), category: str(e.category), amount: num(e.amount), year: str(e.year) };
    }
    function dateOf(x) { return x.date; }
    var incAll = sortNewestFirst(donations, dateOf), expAll = sortNewestFirst(expenses, dateOf);
    var grantsByYear = {};
    // השנים של גרף "גבייה מול הוצאות" הקיים; opts.year מוסיף שנה שנבחרה לתצוגה גם אם אין בה נתונים
    var chartYears = financeYears();
    if (opts && opts.year && chartYears.indexOf(String(opts.year)) === -1) chartYears = chartYears.concat([String(opts.year)]);
    chartYears.forEach(function (y) {
      var cost = 0;
      try { if (typeof getDashboardYearGrantCost === 'function') cost = num(obj(getDashboardYearGrantCost(y, cy)).cost); } catch (e) { warn('grant cost ' + y, e); }
      grantsByYear[y] = r2(cost);
    });
    return {
      periods: [['today', 'היום'], ['yesterday', 'אתמול'], ['week', 'השבוע'], ['year', 'השנה'], ['all', 'כל התקופות']],
      income: incAll.filter(function (d) { return d.year === cy; }).map(inc),
      incomeAll: incAll.map(inc),
      expenses: expAll.filter(function (e) { return e.year === cy; }).map(exp),
      expensesAll: expAll.map(exp),
      grantsByYear: grantsByYear
    };
  }
  function emptyTransactions() {
    var g = {}; g[campaignYear()] = 0;
    return { periods: [['today', 'היום'], ['yesterday', 'אתמול'], ['week', 'השבוע'], ['year', 'השנה'], ['all', 'כל התקופות']], income: [], incomeAll: [], expenses: [], expensesAll: [], grantsByYear: g };
  }

  /* ---------- סיכום הוצאות ---------- */
  function expenseCategories() {
    var cats = settings().expenseCategories;
    return (Array.isArray(cats) && cats.length ? cats : DEFAULT_CATS).map(str).filter(function (c) { return c; });
  }
  function buildExpenses() {
    var cy = campaignYear(), tree = map0(), seenYears = map0(), yearList = [], count = 0, extra = [];
    // אותן ברירות מחדל של renderExpensesSummaryTable: שנה חסרה = "כללי", קטגוריה חסרה = "שונות", פירוט חסר = "כללי"
    arr(appState().expenses).forEach(function (e) {
      if (!e || typeof e !== 'object') return;
      var y = str(e.year) || 'כללי', c = str(e.category) || 'שונות', d = str(e.description) || 'כללי', a = num(e.amount);
      if (!seenYears[y]) { seenYears[y] = 1; yearList.push(y); }
      if (!tree[c]) { tree[c] = { total: map0(), subs: map0(), names: [] }; extra.push(c); }
      if (!tree[c].subs[d]) { tree[c].subs[d] = map0(); tree[c].names.push(d); }
      tree[c].total[y] = (tree[c].total[y] || 0) + a;
      tree[c].subs[d][y] = (tree[c].subs[d][y] || 0) + a;
      if (y === cy) count++;
    });
    if (!seenYears[cy]) yearList.push(cy);
    var years = sortYearsAsc(yearList);
    if (years.length > 4) {
      years = years.slice(-4);
      if (years.indexOf(cy) === -1) years = sortYearsAsc([cy].concat(years.slice(-3)));
    }
    var fromSettings = expenseCategories();
    var names = uniq(fromSettings.concat(extra.filter(function (c) { return fromSettings.indexOf(c) === -1; }).sort()));
    var categories = names.map(function (name) {
      var node = tree[name] || { total: map0(), subs: map0(), names: [] }, byYear = {};
      years.forEach(function (y) { byYear[y] = r2(node.total[y]); });
      var items = node.names.slice().sort().map(function (d) {
        var o = { name: d };
        years.forEach(function (y) { o[y] = r2(node.subs[d][y]); });
        return o;
      });
      return { name: name, byYear: byYear, items: items };
    });
    return { years: years, year: cy, categories: categories, count: count };
  }
  function emptyExpenses() {
    var cy = campaignYear();
    return { years: [cy], year: cy, categories: DEFAULT_CATS.map(function (name) { var b = {}; b[cy] = 0; return { name: name, byYear: b, items: [] }; }), count: 0 };
  }

  /* ---------- תקנון ---------- */
  function buildRules() {
    return {
      rules: [
        ['יעד שנתי', 'לכל בחור יש יעד שנתי לפי שלב הלימוד שלו. בחיידר ובקיבוץ אין יעד.'],
        ['חוסר עובר הלאה', 'מי שלא השלים את היעד, החוסר שלו עובר לשנה הבאה כקנס כפול ומצטרף לנדרש.'],
        ['זכאות למענק', 'בחור שעמד בכל הנדרש ממנו זכאי למענק החתן. בקיבוץ הזכאות נשמרת כל עוד אין חוב פתוח.'],
        ['מתנות', 'מי שעבר את סף המתנה במהלך השנה מקבל אותה, בלי קשר לחוב משנים קודמות.']
      ],
      extra: str(settings().additionalRules)
    };
  }

  /* ---------- הגדרות ---------- */
  // אותה ישיבה בכתיבים שונים: ההבדל רק בגרש / גרשיים / מירכאות, ברווחים מיותרים או ב"ישיבת " בהתחלה
  function yeshivaKey(name) {
    var k = str(name).replace(/["'`´׳״‘’‚“”„′″]/g, '').replace(/\s+/g, ' ').trim();
    var bare = k.replace(/^ישיבת /, '').trim();
    return bare || k;
  }
  function spellingGroups(members) {
    var groups = map0(), keys = [];
    members.forEach(function (m) {
      var raw = str(m && m.yeshiva).trim();
      if (!raw) return;
      var k = yeshivaKey(raw);
      if (!k) return;
      if (!groups[k]) { groups[k] = []; keys.push(k); }
      if (groups[k].indexOf(raw) === -1) groups[k].push(raw);
    });
    return keys.filter(function (k) { return groups[k].length > 1; }).length;
  }
  function healthRow(key, title, sub, count, sev) {
    return { key: key, title: title, sub: sub, count: count, tone: count === 0 ? 'good' : sev };
  }
  function isOn(v) {
    try { if (typeof isTrue === 'function') return !!isTrue(v); } catch (e) {}
    return v === true || v === 1 || v === '1' || v === 'TRUE' || v === 'V' || v === 'כן' || v === 'Y' || v === 'YES';
  }
  function displayName(u) {
    try { if (typeof profileDisplayName === 'function') return str(profileDisplayName(u)); } catch (e) {}
    return str(u.displayName).trim() || str(u.username).trim();
  }
  function permFields() {
    try { if (typeof PERM_FIELDS !== 'undefined' && Array.isArray(PERM_FIELDS) && PERM_FIELDS.length === 5) return PERM_FIELDS; } catch (e) {}
    return PERMS;
  }
  function lastSync() {
    var ts = null;
    try { ts = sessionStorage.getItem('ezer_last_sync'); } catch (e) {}
    if (!ts) return 'טרם סונכרן';
    var d = new Date(ts);
    return isNaN(d.getTime()) ? '—' : fmtDateTime(d);
  }
  function auditDetails(d) {
    try { if (typeof describeAuditDetails === 'function') return str(describeAuditDetails(d)); } catch (e) {}
    if (!d || typeof d !== 'object') return '';
    if (d.before && d.after) {
      return Object.keys(d.after).filter(function (k) { return JSON.stringify(d.before[k]) !== JSON.stringify(d.after[k]); })
        .map(function (k) { return k + ': ' + (d.before[k] == null ? '—' : d.before[k]) + ' ← ' + (d.after[k] == null ? '—' : d.after[k]); }).join(' · ');
    }
    return Object.keys(d).filter(function (k) { var v = d[k]; return v !== '' && v != null && typeof v !== 'object'; })
      .map(function (k) { return k + ': ' + d[k]; }).join(' · ');
  }
  function auditLabels() {
    var a = ACTIONS, e = ENTITIES;
    try { if (typeof AUDIT_ACTIONS !== 'undefined' && AUDIT_ACTIONS) a = AUDIT_ACTIONS; } catch (x) {}
    try { if (typeof AUDIT_ENTITIES !== 'undefined' && AUDIT_ENTITIES) e = AUDIT_ENTITIES; } catch (x) {}
    return { actions: a, entities: e };
  }
  // יומן הפעולות: 300 האחרונות, באותן תוויות ובאותו פירוט של המסך הקיים. בשגיאה (או בלי הרשאה) מחזיר [].
  function loadAudit() {
    var p;
    try {
      if (!window.SB || typeof window.SB.selectAudit !== 'function') return Promise.resolve([]);
      p = Promise.resolve(window.SB.selectAudit(300));
    } catch (e) { return Promise.resolve([]); }
    return p.then(function (rows) {
      var L = auditLabels();
      return arr(rows).map(function (r) {
        r = obj(r);
        return [fmtDateTime(r.created_at), str(r.username), str(L.actions[r.action] || r.action), str(L.entities[r.entity] || r.entity), auditDetails(r.details)];
      });
    }).then(null, function () { return []; });
  }
  function buildSettings() {
    var S = appState(), members = arr(S.members).filter(function (m) { return m && typeof m === 'object'; });
    function blank(field) { return members.filter(function (m) { return !str(m[field]).trim(); }).length; }
    var nameCounts = map0(), dupes = 0;
    members.forEach(function (m) {
      var n = (str(m.firstName).trim() + ' ' + str(m.lastName).trim()).trim();
      if (n) nameCounts[n] = (nameCounts[n] || 0) + 1;
    });
    Object.keys(nameCounts).forEach(function (n) { if (nameCounts[n] > 1) dupes++; });

    var fields = permFields();
    var users = arr(S.users).filter(function (u) { return u && u.username && String(u.username).trim() !== ''; }).map(function (u) {
      var admin = u.isAdmin === true || String(u.username).trim() === 'מנהל';
      return { id: str(u.id), name: displayName(u) || str(u.username), login: str(u.username), admin: admin,
        perms: fields.map(function (f) { return admin || isOn(u[f[0]]) ? 1 : 0; }) };   // שורת מנהל מוצגת מסומנת כולה, כמו בטבלה הקיימת
    });

    var recipients = 0, archive = grantsArchive();
    Object.keys(obj(archive.years)).forEach(function (y) { recipients += arr(obj(archive.years[y]).recipients).length; });

    return {
      categories: expenseCategories(),
      health: [
        healthRow('type', 'בחורים ללא סוג מסגרת', 'פוגע בזכאות וביעדים', blank('yeshivaType'), 'bad'),
        healthRow('yeshiva', 'בחורים ללא ישיבה', 'לא ייכנסו לדירוג הישיבות', blank('yeshiva'), 'warn'),
        healthRow('phone', 'בחורים ללא מספר טלפון', 'אי אפשר ליצור איתם קשר', blank('phone'), 'warn'),
        healthRow('dupes', 'שמות כפולים אפשריים', 'אותו שם פרטי ומשפחה', dupes, 'warn'),
        healthRow('spell', 'ישיבות שנכתבות בכמה צורות', 'אותה ישיבה בכתיבים שונים', spellingGroups(members), 'warn')
      ],
      counts: [['בחורים', members.length], ['הפקדות', arr(S.donations).length], ['הוצאות', arr(S.expenses).length], ['כתובות פורים', arr(S.purimAddresses).length], ['מקבלי מענק', recipients]],
      lastSync: lastSync(),
      users: users,
      perms: fields.map(function (f) { return f[1]; }),
      audit: [],
      loadAudit: loadAudit
    };
  }
  function emptySettings() {
    return {
      categories: DEFAULT_CATS.slice(),
      health: [
        healthRow('type', 'בחורים ללא סוג מסגרת', 'פוגע בזכאות וביעדים', 0, 'bad'),
        healthRow('yeshiva', 'בחורים ללא ישיבה', 'לא ייכנסו לדירוג הישיבות', 0, 'warn'),
        healthRow('phone', 'בחורים ללא מספר טלפון', 'אי אפשר ליצור איתם קשר', 0, 'warn'),
        healthRow('dupes', 'שמות כפולים אפשריים', 'אותו שם פרטי ומשפחה', 0, 'warn'),
        healthRow('spell', 'ישיבות שנכתבות בכמה צורות', 'אותה ישיבה בכתיבים שונים', 0, 'warn')
      ],
      counts: [['בחורים', 0], ['הפקדות', 0], ['הוצאות', 0], ['כתובות פורים', 0], ['מקבלי מענק', 0]],
      lastSync: 'טרם סונכרן', users: [], perms: PERMS.map(function (f) { return f[1]; }), audit: [], loadAudit: loadAudit
    };
  }

  /* ---------- מסגרות ושיעורים ---------- */
  // בטופס הבחור הקיים יש רשימת שיעורים אחת (א–ט) לכל המסגרות, ובחיידר השדה מוסתר והערך ריק.
  // הערכים הם מה שנשמר במסד ("א"), לא התווית שמוצגת ("א'").
  function buildFrames() {
    var list = [];
    try {
      var sel = document.getElementById('member-shiur');
      if (sel && sel.options) list = Array.prototype.map.call(sel.options, function (o) { return str(o.value); }).filter(function (v) { return v; });
    } catch (e) {}
    if (!list.length) list = SHIURIM.slice();
    return { 'חיידר': [], 'ישי״ק': list.slice(), 'ישי״ג': list.slice(), 'קיבוץ': list.slice() };
  }

  /* ---------- הרכבה ---------- */
  function safe(name, fn, fallback) {
    try { return fn(); } catch (e) { warn(name, e); }
    try { return fallback(); } catch (e2) { return {}; }
  }
  // רשת ביטחון אחרונה: מספר שאינו סופי הופך ל-0, וערך undefined נמחק
  function scrub(v) {
    if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) v[i] = scrubValue(v[i]); return v; }
    if (v && typeof v === 'object') { Object.keys(v).forEach(function (k) { var x = scrubValue(v[k]); if (x === undefined) delete v[k]; else v[k] = x; }); }
    return v;
  }
  function scrubValue(x) {
    if (typeof x === 'number') return isFinite(x) ? x : 0;
    if (x && typeof x === 'object') return scrub(x);
    return x;
  }
  function build(opts) {
    opts = obj(opts);
    return scrub({
      grantsX: safe('grantsX', function () { return buildGrants(opts); }, emptyGrants),
      purimX: safe('purimX', buildPurim, function () { var t = {}; t[campaignYear()] = 0; return { years: [campaignYear()], groups: [], cities: [], totals: t }; }),
      transactionsX: safe('transactionsX', function () { return buildTransactions(opts); }, emptyTransactions),
      expensesX: safe('expensesX', buildExpenses, emptyExpenses),
      rulesX: safe('rulesX', buildRules, function () { return { rules: [], extra: '' }; }),
      settingsX: safe('settingsX', buildSettings, emptySettings),
      frames: safe('frames', buildFrames, function () { return { 'חיידר': [], 'ישי״ק': SHIURIM.slice(), 'ישי״ג': SHIURIM.slice(), 'קיבוץ': SHIURIM.slice() }; })
    });
  }

  window.NDScreens = { build: build };
})();
