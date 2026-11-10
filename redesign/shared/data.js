/* נתוני הדגמה משותפים לכל כיווני העיצוב — window.TZ_DATA
   כל השמות והסכומים מומצאים. אין לשנות קובץ זה מתוך תיקיית כיוון. */
window.TZ_DATA = (function () {
  var fmt = function (n) { return '₪' + Math.round(n).toLocaleString('en-US'); };

  var settings = {
    orgName: 'צדקת רבי שמעון',
    orgSub: 'עזרת חתנים',
    campaignYear: 'תשפ״ו',
    todayHebrewYear: 'תשפ״ז',
    todayLabel: '10/11/2026',
    user: { name: 'מנהל המערכת', role: 'הרשאת מנהל', initial: 'מ' },
    targets: { 'חיידר': 0, 'ישי״ק': 450, 'ישי״ג': 1100, 'קיבוץ': 0 },
    gifts: [
      { name: 'טיול', threshold: 700 },
      { name: 'מתנה', threshold: 2000 }
    ]
  };

  // סיכום כלל האוכלוסייה (438 בחורים) — המספרים שמוצגים בלוח הבקרה
  var summary = {
    activeMembers: 438, withTarget: 290,
    collected: 148650, baseTarget: 221500, pastDebt: 38400, required: 259900,
    missing: 121300, progressPct: 57,
    metTarget: 96, debtors: 47, notStarted: 86, nearEligible: 23, missingDetails: 12,
    deposits: 312, depositors: 204, avgDeposit: 476,
    collectedLastYear: 139900, growthPct: 6.3,
    purimThisYear: 92600, purimAddresses: 570,
    expensesTotal: 61840, grantsCost: 84500, grooms: 13, packageValue: 6500,
    cashShare: 62, creditShare: 38
  };

  var frameworks = [
    { key: 'ישי״ג', name: 'ישיבה גדולה', members: 140, target: 1100, collected: 104300, required: 172600, met: 52, pct: 60 },
    { key: 'ישי״ק', name: 'ישיבה קטנה', members: 150, target: 450, collected: 44350, required: 87300, met: 44, pct: 51 },
    { key: 'קיבוץ', name: 'קיבוץ', members: 90, target: 0, eligible: 71, withDebt: 19, note: 'ללא יעד שנתי · זכאות למי שאין לו חוב עבר' },
    { key: 'חיידר', name: 'חיידר', members: 58, target: 0, note: 'עדיין לא בגיל הזכאות' }
  ];

  var yeshivas = [
    { name: 'אהלי תורה', members: 118, collected: 46200, pct: 64 },
    { name: 'שערי ציון', members: 96, collected: 35450, pct: 58 },
    { name: 'נחלת דוד', members: 104, collected: 36900, pct: 55 },
    { name: 'בית מאיר', members: 62, collected: 30100, pct: 52 },
    { name: 'תפארת בנים', members: 58, collected: 0, pct: null, note: 'חיידר' }
  ];

  // הכנסות והוצאות לפי שנה (בחורים / פורים / הוצאות כולל מענקים)
  var yearly = [
    { year: 'תשפ״ג', boys: 118400, purim: 71200, expenses: 121300 },
    { year: 'תשפ״ד', boys: 131200, purim: 78500, expenses: 129800 },
    { year: 'תשפ״ה', boys: 139900, purim: 84300, expenses: 138200 },
    { year: 'תשפ״ו', boys: 148650, purim: 92600, expenses: 146340 }
  ];

  // גבייה מבחורים לפי חודש עברי בשנת הקמפיין (סה״כ 148,650) + שנה קודמת להשוואה
  var monthly = [
    { month: 'תשרי', amount: 6200, lastYear: 5400 },
    { month: 'חשוון', amount: 9800, lastYear: 9100 },
    { month: 'כסלו', amount: 14300, lastYear: 12800 },
    { month: 'טבת', amount: 11900, lastYear: 12300 },
    { month: 'שבט', amount: 12700, lastYear: 11600 },
    { month: 'אדר', amount: 18450, lastYear: 16900 },
    { month: 'ניסן', amount: 21300, lastYear: 19800 },
    { month: 'אייר', amount: 10900, lastYear: 10200 },
    { month: 'סיוון', amount: 9650, lastYear: 9900 },
    { month: 'תמוז', amount: 8400, lastYear: 8100 },
    { month: 'אב', amount: 7250, lastYear: 7600 },
    { month: 'אלול', amount: 17800, lastYear: 16200 }
  ];

  var expenseCategories = [
    { name: 'כנסים ואירועים', amount: 18600 },
    { name: 'מתנות ופרסים', amount: 14200 },
    { name: 'סעודות ואוכל', amount: 12300 },
    { name: 'הדפסות', amount: 9400 },
    { name: 'תפעול ופרסום', amount: 5140 },
    { name: 'שונות', amount: 2200 }
  ];

  var alerts = [
    { key: 'near', tone: 'warn', title: 'קרובים לזכאות', detail: 'חסר להם עד ₪500 להשלמת היעד', count: 23 },
    { key: 'debt', tone: 'bad', title: 'בחורים עם חוב עבר', detail: 'סך החובות ' + fmt(38400), count: 47 },
    { key: 'idle', tone: 'idle', title: 'טרם התחילו לגבות השנה', detail: 'בחורים עם יעד וללא הפקדות', count: 86 },
    { key: 'details', tone: 'idle', title: 'כרטיסים עם פרטים חסרים', detail: 'ללא טלפון, ישיבה או סוג מסגרת', count: 12 },
    { key: 'newyear', tone: 'info', title: 'התחילה שנה עברית חדשה', detail: 'לעדכן את שנת הקמפיין לתשפ״ז בהגדרות', count: null }
  ];

  var activity = [
    { type: 'in', title: 'דוד פרידמן', method: 'מזומן', date: '09/11/2026', time: '18:42', amount: 300 },
    { type: 'out', title: 'הדפסות · עלוני קמפיין', method: null, date: '09/11/2026', time: '14:10', amount: 850 },
    { type: 'in', title: 'משה כהן', method: 'אשראי', date: '08/11/2026', time: '21:05', amount: 550 },
    { type: 'in', title: 'שמעון וייס', method: 'מזומן', date: '08/11/2026', time: '19:30', amount: 200 },
    { type: 'in', title: 'אפרים זילברשטיין', method: 'אשראי', date: '08/11/2026', time: '12:16', amount: 400 },
    { type: 'out', title: 'סעודות ואוכל · כנס פתיחה', method: null, date: '05/11/2026', time: '16:00', amount: 1240 },
    { type: 'in', title: 'אהרן שטרן', method: 'אשראי', date: '04/11/2026', time: '20:48', amount: 450 },
    { type: 'in', title: 'יהודה לנדאו', method: 'מזומן', date: '04/11/2026', time: '13:22', amount: 250 }
  ];

  // דוגמת בחורים לרשימה (28 מתוך 438). base = יעד בסיס, debt = חוב עבר (קנס)
  var RAW = [
    ['משה', 'כהן', 'יעקב', 'אהלי תורה', 'ישי״ג', 'ב׳', 'ירושלים', 1100, 1100, 0],
    ['יוסף', 'לוי', 'אברהם', 'נחלת דוד', 'ישי״ק', 'א׳', 'בני ברק', 450, 450, 0],
    ['דוד', 'פרידמן', 'שמואל', 'שערי ציון', 'ישי״ג', 'א׳', 'ביתר עילית', 800, 1100, 0],
    ['אברהם', 'רוזנברג', 'מאיר', 'אהלי תורה', 'ישי״ג', 'ג׳', 'ירושלים', 600, 1100, 900],
    ['יצחק', 'גולדברג', 'חיים', 'בית מאיר', 'ישי״ק', 'א׳', 'מודיעין עילית', 0, 450, 0],
    ['שמעון', 'וייס', 'דוב', 'נחלת דוד', 'ישי״ק', 'ב׳', 'בני ברק', 200, 450, 0],
    ['אהרן', 'שטרן', 'יוסף', 'שערי ציון', 'ישי״ג', 'ב׳', 'אשדוד', 2150, 1100, 0],
    ['מנחם', 'קליין', 'צבי', 'אהלי תורה', 'קיבוץ', 'ב׳', 'ירושלים', 0, 0, 0],
    ['נתן', 'הורוביץ', 'אליעזר', 'בית מאיר', 'ישי״ג', 'א׳', 'בית שמש', 250, 1100, 0],
    ['אליהו', 'ברגר', 'נחום', 'נחלת דוד', 'ישי״ק', 'ג׳', 'ביתר עילית', 0, 450, 900],
    ['חיים', 'שפירא', 'ברוך', 'אהלי תורה', 'ישי״ג', 'ג׳', 'ירושלים', 1450, 1100, 0],
    ['ישראל מאיר', 'דייטש', 'פנחס', 'תפארת בנים', 'חיידר', '', 'ירושלים', 0, 0, 0],
    ['בנימין', 'הלפרין', 'זאב', 'שערי ציון', 'ישי״ק', 'ב׳', 'אשדוד', 450, 450, 0],
    ['יהודה', 'לנדאו', 'מרדכי', 'בית מאיר', 'ישי״ג', 'ב׳', 'בית שמש', 950, 1100, 0],
    ['רפאל', 'מנדלוביץ', 'גדליה', 'נחלת דוד', 'ישי״ג', 'א׳', 'בני ברק', 0, 1100, 0],
    ['צבי', 'אייזנבך', 'שלום', 'אהלי תורה', 'קיבוץ', 'ד׳', 'ירושלים', 300, 0, 600],
    ['עקיבא', 'טננבאום', 'יחזקאל', 'שערי ציון', 'ישי״ק', 'ג׳', 'ביתר עילית', 700, 450, 0],
    ['אלחנן', 'וולך', 'נפתלי', 'בית מאיר', 'ישי״ג', 'ג׳', 'מודיעין עילית', 1100, 1100, 400],
    ['יחיאל', 'פולק', 'אשר', 'נחלת דוד', 'ישי״ק', 'א׳', 'בני ברק', 150, 450, 0],
    ['מרדכי', 'גרוס', 'יונה', 'אהלי תורה', 'ישי״ג', 'א׳', 'ירושלים', 1100, 1100, 0],
    ['פנחס', 'רוטנברג', 'שמחה', 'שערי ציון', 'ישי״ג', 'ב׳', 'אשדוד', 500, 1100, 0],
    ['נחמן', 'ליברמן', 'אורי', 'בית מאיר', 'קיבוץ', 'א׳', 'בית שמש', 0, 0, 0],
    ['שמואל', 'בלוי', 'הלל', 'נחלת דוד', 'ישי״ק', 'ב׳', 'בני ברק', 450, 450, 0],
    ['אפרים', 'זילברשטיין', 'טוביה', 'אהלי תורה', 'ישי״ג', 'ג׳', 'ירושלים', 2400, 1100, 0],
    ['גרשון', 'קרויס', 'יואל', 'תפארת בנים', 'חיידר', '', 'ביתר עילית', 0, 0, 0],
    ['ברוך', 'וינברג', 'עזריאל', 'שערי ציון', 'ישי״ק', 'ג׳', 'מודיעין עילית', 300, 450, 0],
    ['דב', 'ויסברג', 'אלימלך', 'בית מאיר', 'ישי״ג', 'א׳', 'בית שמש', 0, 1100, 0],
    ['מאיר', 'שיינפלד', 'לייב', 'נחלת דוד', 'ישי״ג', 'ב׳', 'בני ברק', 1250, 1100, 0]
  ];

  var STATUS = {
    ok: { key: 'ok', tone: 'good', label: 'עמד ביעד' },
    eligible: { key: 'ok', tone: 'good', label: 'זכאי' },
    near: { key: 'near', tone: 'warn', label: 'קרוב ליעד' },
    prog: { key: 'prog', tone: 'neutral', label: 'בתהליך' },
    debt: { key: 'debt', tone: 'bad', label: 'חוב עבר' },
    none: { key: 'none', tone: 'idle', label: 'טרם התחיל' },
    notarget: { key: 'notarget', tone: 'idle', label: 'ללא יעד' }
  };

  function statusOf(m) {
    if (m.type === 'חיידר') return STATUS.notarget;
    if (m.type === 'קיבוץ') return m.gap > 0 ? STATUS.debt : STATUS.eligible;
    if (m.gap === 0) return STATUS.ok;
    if (m.debt > 0) return STATUS.debt;
    if (m.collected === 0) return STATUS.none;
    if (m.gap <= 500) return STATUS.near;
    return STATUS.prog;
  }

  var DATES = ['04/11/2026', '21/09/2026', '02/07/2026', '14/04/2026', '08/02/2026', '17/12/2025'];
  function depositsOf(i, collected) {
    if (!collected) return [];
    var parts = collected >= 1200 ? 4 : collected >= 700 ? 3 : collected >= 300 ? 2 : 1;
    var out = [], left = collected;
    for (var k = 0; k < parts; k++) {
      var amt = k === parts - 1 ? left : Math.round((collected / parts) / 50) * 50;
      left -= amt;
      out.push({ date: DATES[(i + k) % DATES.length], amount: amt, method: (i + k) % 3 === 0 ? 'אשראי' : 'מזומן', year: 'תשפ״ו' });
    }
    return out;
  }

  var members = RAW.map(function (r, i) {
    var m = {
      id: 'm' + (i + 1), first: r[0], last: r[1], father: r[2], yeshiva: r[3], type: r[4], shiur: r[5], city: r[6],
      collected: r[7], base: r[8], debt: r[9],
      phone: '05' + (i % 5) + '-555-01' + String(i + 10),
      address: 'רחוב הדוגמה ' + (i + 3) + ', ' + r[6]
    };
    m.full = m.first + ' ' + m.last;
    m.frame = m.shiur ? m.type + ' ' + m.shiur : m.type;
    m.required = m.base + m.debt;
    m.gap = Math.max(0, m.required - m.collected);
    m.hasTarget = m.required > 0;
    m.pct = m.hasTarget ? Math.min(100, Math.round((m.collected / m.required) * 100)) : null;
    m.status = statusOf(m);
    m.gifts = settings.gifts.map(function (g) { return { name: g.name, threshold: g.threshold, earned: m.collected >= g.threshold, missing: Math.max(0, g.threshold - m.collected) }; });
    m.deposits = depositsOf(i, m.collected);
    return m;
  });

  // היסטוריית זכאות לדוגמה (לפי כללי החוב המצטבר: חוסר ביעד × 2 עובר לשנה הבאה)
  function historyOf(m) {
    if (m.type === 'חיידר') return [];
    var t = m.base || settings.targets[m.type] || 0;
    if (m.debt === 900 && m.type === 'ישי״ג') {
      return [
        { year: 'תשפ״ד', frame: 'ישי״ג א׳', target: 1100, required: 1100, collected: 1100, status: 'עמד ביעד', tone: 'good' },
        { year: 'תשפ״ה', frame: 'ישי״ג ב׳', target: 1100, required: 1100, collected: 650, status: 'חסר ₪450 · קנס כפול ₪900', tone: 'bad' },
        { year: 'תשפ״ו', frame: m.frame, target: 1100, required: 2000, collected: m.collected, status: m.gap > 0 ? 'חסר ' + fmt(m.gap) : 'עמד ביעד', tone: m.gap > 0 ? 'bad' : 'good' }
      ];
    }
    if (m.debt > 0) {
      return [
        { year: 'תשפ״ה', frame: 'שנה קודמת', target: t || 450, required: t || 450, collected: Math.max(0, (t || 450) - m.debt / 2), status: 'חסר ' + fmt(m.debt / 2) + ' · קנס כפול ' + fmt(m.debt), tone: 'bad' },
        { year: 'תשפ״ו', frame: m.frame, target: m.base, required: m.required, collected: m.collected, status: m.gap > 0 ? 'חסר ' + fmt(m.gap) : 'עמד ביעד', tone: m.gap > 0 ? 'bad' : 'good' }
      ];
    }
    return [
      { year: 'תשפ״ה', frame: 'שנה קודמת', target: t, required: t, collected: t, status: t ? 'עמד ביעד' : 'ללא יעד', tone: t ? 'good' : 'idle' },
      { year: 'תשפ״ו', frame: m.frame, target: m.base, required: m.required, collected: m.collected, status: m.status.label, tone: m.status.tone }
    ];
  }

  var leaderboard = members.slice().sort(function (a, b) { return b.collected - a.collected; }).slice(0, 5)
    .map(function (m, i) { return { rank: i + 1, id: m.id, name: m.full, yeshiva: m.yeshiva, frame: m.frame, amount: m.collected }; });

  // מפת חום: 26 שבועות × 7 ימים (ראשון..שבת). בשבת אין הפקדות.
  var heatmap = (function () {
    var seed = 7, weeks = [];
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    var start = new Date(2026, 4, 10); // יום ראשון 10/05/2026
    for (var w = 0; w < 26; w++) {
      var days = [];
      for (var d = 0; d < 7; d++) {
        var dt = new Date(start.getTime() + (w * 7 + d) * 86400000);
        var r = rnd(), amount = 0;
        if (d !== 6) {
          var boost = (w > 17 && w < 22) ? 1.9 : (w > 23 ? 1.5 : 1);
          amount = r < 0.34 ? 0 : Math.round((r * r * 2200 * boost) / 50) * 50;
        }
        var dd = String(dt.getDate()).padStart(2, '0'), mm = String(dt.getMonth() + 1).padStart(2, '0');
        days.push({ date: dd + '/' + mm + '/' + dt.getFullYear(), dow: d, amount: amount, count: amount ? Math.max(1, Math.round(amount / 420)) : 0 });
      }
      weeks.push(days);
    }
    return { weeks: weeks, dayNames: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] };
  })();

  var grants = {
    grooms: 13, packageValue: 6500, cost: 84500,
    stores: [
      { store: 'ביגוד', expected: 39000, paid: 39000, status: 'שולם' },
      { store: 'נעליים', expected: 15600, paid: 15600, status: 'שולם' },
      { store: 'מגבות ומצעים', expected: 18200, paid: 9100, status: 'שולם חלקית' },
      { store: 'כלי בית', expected: 11700, paid: 0, status: 'לא שולם' }
    ]
  };

  var nav = [
    { key: 'dashboard', label: 'לוח בקרה', group: 'ראשי' },
    { key: 'members', label: 'בחורים', group: 'ניהול' },
    { key: 'grants', label: 'מענקים', group: 'ניהול' },
    { key: 'purim', label: 'כתובות פורים', group: 'ניהול' },
    { key: 'transactions', label: 'דו״ח תנועות', group: 'כספים' },
    { key: 'expenses', label: 'סיכום הוצאות', group: 'כספים' },
    { key: 'rules', label: 'תקנון', group: 'כללי' },
    { key: 'settings', label: 'הגדרות', group: 'כללי' }
  ];

  var quickActions = [
    { key: 'deposit', label: 'רישום הפקדה' },
    { key: 'member', label: 'הוספת בחור' },
    { key: 'expense', label: 'רישום הוצאה' },
    { key: 'credit', label: 'סליקת אשראי' },
    { key: 'report', label: 'דו״ח תנועות' },
    { key: 'grants', label: 'מענקים' }
  ];


  // תמונות שהלקוח מספק בעצמו. images[key] = כתובת התמונה (מחרוזת), או null כל עוד לא סופקה — אז מציגים מקום שמור.
  // kind: 'scene' = תמונה רחבה עם רקע משלה (16:9) · 'object' = חפץ בודד על רקע לבן או שקוף (1:1)
  var imageSlots = [
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
  var images = {};
  imageSlots.forEach(function (sl) { images[sl.key] = null; });

  return {
    imageSlots: imageSlots, images: images,
    fmt: fmt, settings: settings, summary: summary, frameworks: frameworks, yeshivas: yeshivas,
    yearly: yearly, monthly: monthly, expenseCategories: expenseCategories, alerts: alerts,
    activity: activity, members: members, historyOf: historyOf, statusOf: statusOf,
    leaderboard: leaderboard, heatmap: heatmap, grants: grants, nav: nav, quickActions: quickActions,
    statusFilters: [
      { key: 'all', label: 'הכל', count: 438 },
      { key: 'ok', label: 'עמדו ביעד', count: 96 },
      { key: 'near', label: 'קרובים ליעד', count: 23 },
      { key: 'debt', label: 'חוב עבר', count: 47 },
      { key: 'none', label: 'טרם התחילו', count: 86 }
    ]
  };
})();
