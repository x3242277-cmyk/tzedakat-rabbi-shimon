/* ============ המסכים המלאים: מענקים · כתובות פורים · דו״ח תנועות · סיכום הוצאות · תקנון · הגדרות ============
     הקובץ נכנס לתוך script.js בזמן הבנייה (shared/build.js), ולכן הוא משתמש באותן פונקציות עזר: id, esc, nis, g, slot, disc, toast, stampSVG.
     כל הנתונים הם נתוני הדגמה מ-shared/data-screens.js. שינויים נשמרים בזיכרון בלבד. */
  var SC = {
    grants: { view: 'give', half: 'א', editPkg: false },
    purim: { city: '', group: 0, all: false, edit: false },
    transactions: { period: 'week', method: '' },
    expenses: { year: '', open: {} },
    rules: { q: '', mid: '' },
    settings: { tab: 'targets' }
  };
  var HERO_WAVES = '<div class="hero-wave-in" aria-hidden="true"><svg class="hero-wave hero-wave--b" viewBox="0 0 800 640" preserveAspectRatio="none"><path fill="#D1A83C" d="M800,0L190,0C70,80-20,220,40,350C90,460,230,480,180,570C160,605,132,628,120,640L800,640Z"/></svg>' +
    '<svg class="hero-wave hero-wave--f" viewBox="0 0 800 640" preserveAspectRatio="none"><path fill="url(#' + P + 'g1)" d="M800,0L262,0C150,70,62,200,112,330C152,440,300,470,252,560C232,600,204,626,192,640L800,640Z"/></svg></div>' +
    '<svg class="hero-mw" viewBox="0 0 390 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#D7B253" opacity=".6" d="M0,100V30C70,70,150,0,240,26C310,46,350,20,390,40V100Z"/><path fill="#D1A83C" d="M0,100V58C80,20,150,84,240,54C310,32,350,60,390,44V100Z"/></svg>';
  var HERO_EDGE = '<svg class="edge edge-b hero-bot" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path class="w2" d="M0,120V44C240,104,420,24,700,62C980,100,1180,58,1440,92V120Z"/><path d="M0,120V70C180,22,360,98,620,86C900,72,1100,8,1440,56V120Z"/></svg>';

  /* ---------- אבני בניין ---------- */
  function navOf(k) { return D.nav.filter(function (n) { return n.key === k; })[0]; }
  function nisT(s) { return esc(s).replace(/₪[\d,]+/g, function (m) { return ltr(m); }); }
  function pctOf(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function dnum(s) { var p = String(s).split('/'); return (+p[2]) * 10000 + (+p[1]) * 100 + (+p[0]); }
  function shH(lt, bold, extra) { return '<div class="sh"><span class="dot"></span><h2><span class="lt">' + lt + '</span>' + bold + '</h2>' + (extra || '') + '</div>'; }
  function factsH(list) {
    return '<div class="soon-grid' + (list.length === 4 ? ' is-4' : '') + '">' + list.map(function (f, i) {
      var v = String(f[0]);
      return '<div class="fact a" style="--d:' + (.2 + i * .07).toFixed(2) + 's"><span class="dsc' + (v.length > 6 ? ' sm' : '') + '" dir="' + (/[א-ת]/.test(v) ? 'rtl' : 'ltr') + '">' + esc(v) + '</span><span><b>' + esc(f[1]) + '</b><i>' + nisT(f[2]) + '</i></span></div>';
    }).join('') + '</div>';
  }
  function tabsH(items, cur, act, label) {
    return '<div class="filt scr-tabs" role="tablist" aria-label="' + esc(label) + '">' + items.map(function (it) {
      var on = it[0] === cur;
      return '<button type="button" class="ftab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on + '" data-scr="' + act + ':' + esc(it[0]) + '">' + BRUSH + esc(it[1]) + (it[2] != null ? '<small>' + esc(it[2]) + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function selH(label, opts, cur, act, plain) {
    return '<span class="sel' + (cur && !plain ? ' is-set' : '') + '"><select aria-label="' + esc(label) + '" data-scrsel="' + act + '">' +
      opts.map(function (o) { var v = o[0], t = o[1]; return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>' + g('down') + '</span>';
  }
  function togH(label, on, act) { return '<label class="tog"><input type="checkbox" data-scrtog="' + act + '"' + (on ? ' checked' : '') + '><span class="sw"></span>' + esc(label) + '</label>'; }
  function rbtnH(act, label, glyph) { return '<button type="button" class="rbtn rbtn-o" data-scr="' + act + '" aria-label="' + esc(label) + '" data-tip="' + esc(label) + '">' + glyph + '</button>'; }
  var G_DOWNLOAD = '<svg class="g" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
  var G_PRINT = '<svg class="g" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z"/></svg>';
  function tc(label, html, cls) { return '<span class="tc' + (cls ? ' ' + cls : '') + '" data-l="' + esc(label) + '">' + html + '</span>'; }
  function tlH(cols, heads, rows, cls) {
    return '<div class="tl' + (cls ? ' ' + cls : '') + '" style="--cols:' + cols + '"><div class="tl-h">' + heads.map(function (h) { return '<span>' + h + '</span>'; }).join('') + '</div><div class="tl-l">' + rows + '</div></div>';
  }
  function fldH(label, inner, cls, fid) { return '<div class="fld' + (cls ? ' ' + cls : '') + '"><label' + (fid ? ' for="' + P + fid + '"' : '') + '>' + esc(label) + '</label><div class="uin">' + inner + '</div></div>'; }
  function inH(fid, val, attrs) { return '<input id="' + P + fid + '" type="text" value="' + esc(val == null ? '' : val) + '" autocomplete="off"' + (attrs ? ' ' + attrs : '') + '>'; }
  function optH(fid, opts, cur) { return '<select id="' + P + fid + '">' + opts.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' + g('down'); }
  function segH(name, opts, cur) {
    return '<div class="seg" role="radiogroup">' + opts.map(function (o) { return '<label><input type="radio" name="' + P + name + '" value="' + esc(o) + '"' + (o === cur ? ' checked' : '') + '>' + BRUSH + '<span>' + esc(o) + '</span></label>'; }).join('') + '</div>';
  }

  function scrHero(k, o) {
    var nav = navOf(k);
    return '<div class="band hero soon-hero scr-hero"><div class="hero-pic">' + slot(o.slot) + '</div><div class="hero-tint"></div>' + HERO_WAVES +
      '<div class="wrap hero-in"><div class="hero-txt"><p class="eyebrow ld a">' + esc(nav.group) + ' · <b>קמפיין ' + esc(S.year) + '</b></p><h1 class="a" style="--d:.06s">' + esc(nav.label) + '</h1>' +
      '<p class="h-sub a" style="--d:.12s">' + o.sub + '</p><div class="h-cta a" style="--d:.18s">' + o.cta + '</div></div></div>' +
      '<div class="stamp">' + stampSVG(o.stamp[0], o.stamp[1], o.stamp[2], nav.label) + '</div>' + HERO_EDGE + '</div>';
  }
  function renderScreen(k) {
    var sc = SCREENS[k];
    if (!sc || !navOf(k)) return false;
    id('soon').innerHTML = scrHero(k, sc.hero()) + '<div class="wrap scr-body" id="' + P + 'scr">' + sc.body() + '</div>';
    return true;
  }
  function scrDraw() {
    var b = id('scr');
    if (!b || !S.soon || !SCREENS[S.soon]) return;
    b.innerHTML = SCREENS[S.soon].body();
    $$('.a', b).forEach(function (el) { el.classList.remove('a'); });
  }

  /* ---------- מענקים ---------- */
  function billTone(st) { return st === 'שולם' ? 'good' : st === 'ממתין לתשלום' ? 'warn' : 'idle'; }
  function grantsGive() {
    var X = D.grantsX, st = SC.grants;
    var rows = X.recipients.map(function (r) {
      return '<div class="trow">' + tc('מס׳', '<b class="num">' + r.n + '</b>') + tc('שם ומשפחה', '<b>' + esc(r.name) + '</b>') + tc('תעודת זהות', ltr(esc(r.idn))) + tc('טלפון', ltr(esc(r.phone))) + tc('תאריך', ltr(esc(r.date))) +
        tc('מחצית', '<span class="tag t-neutral">מחצית ' + esc(r.half) + '׳</span>') + '<button type="button" class="ic" data-scr="groom-del:' + r.n + '" aria-label="הסרת ' + esc(r.name) + '">' + g('close') + '</button></div>';
    }).join('');
    var total = X.package.reduce(function (a, p) { return a + p.total; }, 0);
    var pk = X.package.map(function (p, pi) {
      return '<div class="pkg"><div class="pkg-h"><span><b>' + esc(p.store) + '</b><i>' + esc(p.shop) + '</i></span><b>' + nis(p.total) + '</b></div>' + p.items.map(function (it, ii) {
        return '<div class="pkg-i"><span>' + esc(it.name) + (it.qty > 1 ? ' <small dir="ltr">×' + it.qty + '</small>' : '') + '</span>' +
          (st.editPkg ? '<label class="uin uin-s" dir="ltr"><span class="pre">₪</span><input type="text" inputmode="numeric" value="' + it.value + '" data-scrin="pkg:' + pi + ':' + ii + '" aria-label="שווי ' + esc(it.name) + '"></label>' : '<span>' + nis(it.value) + '</span>') + '</div>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="scr-2"><div>' + shH('מי קיבל השנה', 'מקבלי המענק') +
      tlH('44px minmax(0,1.5fr) minmax(0,.9fr) minmax(0,1.1fr) minmax(0,.9fr) 96px 40px', ['מס׳', 'שם ומשפחה', 'תעודת זהות', 'טלפון', 'תאריך', 'מחצית', ''], rows, 'tl-grooms') +
      '<p class="ml-foot">' + X.recipients.length + ' חתנים בשנת ' + esc(X.year) + '</p></div>' +
      '<aside class="feed pkg-box"><div class="feed-h"><h3><span class="lt">שווי חבילה לחתן ' + nis(total) + '</span>מה מקבלים</h3>' +
      '<button type="button" class="btn btn-s ' + (st.editPkg ? 'btn-k' : 'btn-o') + '" data-scr="pkg-edit">' + (st.editPkg ? 'שמירה' : g('edit') + 'עריכה') + '</button></div>' + pk + '</aside></div>';
  }
  function grantsPay() {
    var X = D.grantsX, st = SC.grants, H = X.halves[st.half];
    var billed = H.bills.reduce(function (a, b) { return a + b.billed; }, 0);
    var paid = H.bills.reduce(function (a, b) { return a + (b.status === 'שולם' ? b.billed : 0); }, 0);
    var rows = H.bills.map(function (b, i) {
      var actLabel = b.status === 'טרם הוזן חיוב' ? 'הזנת חיוב' : b.status === 'ממתין לתשלום' ? 'סימון כשולם' : 'פרטי התשלום';
      return '<button type="button" class="trow" data-scr="bill:' + i + '" aria-label="' + esc(b.store) + ', ' + esc(b.status) + '">' + tc('חנות', '<b>' + esc(b.store) + '</b><i>' + esc(b.shop) + '</i>') + tc('צפי לפי חתנים', nis(b.expected)) +
        tc('לתשלום לפי קבלות', b.billed ? '<b>' + nis(b.billed) + '</b>' : '<i>—</i>') + tc('קבלה / חשבונית', b.ref ? esc(b.ref) : '<i>—</i>') +
        tc('סטטוס', '<span class="tag t-' + billTone(b.status) + '">' + esc(b.status) + '</span>' + (b.paidOn ? '<i>' + ltr(esc(b.paidOn)) + ' · ' + esc(b.method) + '</i>' : '')) +
        '<span class="tc tc-act">' + esc(actLabel) + g('chev') + '</span></button>';
    }).join('');
    return '<div class="scr-bar">' + tabsH([['א', X.halves['א'].label, X.halves['א'].grooms + ' חתנים'], ['ב', X.halves['ב'].label, X.halves['ב'].grooms + ' חתנים']], st.half, 'half', 'מחצית') + '</div>' +
      factsH([['₪' + num(billed), 'לתשלום לפי קבלות', 'במחצית ' + st.half + '׳'], ['₪' + num(paid), 'שולם', pctOf(paid, billed) + '% מהחיובים'], ['₪' + num(billed - paid), 'נשאר לשלם', billed - paid ? 'ממתין לתשלום' : 'אין חיובים פתוחים']]) +
      tlH('minmax(0,1.2fr) minmax(0,.9fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,1.3fr) 150px', ['חנות', 'צפי לפי חתנים', 'לתשלום לפי קבלות', 'קבלה / חשבונית', 'סטטוס', ''], rows, 'tl-bills') +
      '<p class="scr-note">בכל מחצית משלמים לכל חנות לפי הקבלות על מה שמומש בפועל. הצפי מחושב לפי מספר החתנים במחצית, ולכן הוא בדרך כלל גבוה מהחיוב.</p>';
  }

  /* ---------- כתובות פורים ---------- */
  function purimGroupsOf(city) { return D.purimX.groups.filter(function (gr) { return gr.city === city; }); }
  function purimBody() {
    var X = D.purimX, st = SC.purim;
    if (!st.city) st.city = X.cities[0];
    var groups = purimGroupsOf(st.city), gr = groups[Math.min(st.group, groups.length - 1)];
    var years = st.all ? X.years : X.years.slice(-2), cur = X.years[X.years.length - 1];
    var total = X.groups.reduce(function (a, x) { return a + x.sums[cur]; }, 0), addrs = X.groups.reduce(function (a, x) { return a + x.addresses; }, 0);
    var rows = gr.rows.map(function (r, ri) {
      return '<div class="trow">' + tc('מס׳', '<b class="num">' + r.n + '</b>') + tc('משפחה', '<b>' + esc(r.family) + '</b><i>' + esc(r.first) + '</i>') +
        tc('כתובת', esc(r.street) + ' ' + r.house + '<i>דירה ' + r.apt + '</i>') +
        years.map(function (y) {
          var v = r.amounts[y];
          if (st.edit && y === cur) return tc(y, '<label class="uin uin-s" dir="ltr"><span class="pre">₪</span><input type="text" inputmode="numeric" value="' + (v || '') + '" data-scrin="purim:' + ri + '" aria-label="סכום ' + esc(y) + ' ל' + esc(r.family) + '"></label>', 'yc');
          return tc(y, v ? (y === cur ? '<b>' + nis(v) + '</b>' : nis(v)) : '<i>—</i>', 'yc');
        }).join('') + tc('הערות', r.note ? esc(r.note) : '<i>—</i>', 'note') + '</div>';
    }).join('');
    var colSum = years.map(function (y) { return gr.rows.reduce(function (a, r) { return a + (r.amounts[y] || 0); }, 0); });
    return factsH([[num(addrs), 'כתובות', 'ב-' + X.groups.length + ' קבוצות'], ['₪' + num(total), 'נאסף בפורים', 'בשנת ' + cur], [X.cities.length, 'ערים', X.cities.join(', ')]]) +
      '<div class="scr-bar">' + tabsH(X.cities.map(function (c) { return [c, c, purimGroupsOf(c).reduce(function (a, x) { return a + x.addresses; }, 0)]; }), st.city, 'city', 'עיר') + '</div>' +
      '<div class="scr-bar scr-bar2"><div class="chips">' + groups.map(function (x, i) { return '<button type="button" class="chipb' + (x === gr ? ' is-on' : '') + '" data-scr="group:' + i + '">' + esc(x.group) + '<small>' + x.addresses + '</small></button>'; }).join('') + '</div>' +
      '<span class="scr-sp"></span>' + togH('כל השנים', st.all, 'allyears') +
      (st.edit ? '<button type="button" class="btn btn-s btn-k" data-scr="purim-save">שמירה</button><button type="button" class="btn btn-s btn-o" data-scr="purim-cancel">ביטול</button>'
        : '<button type="button" class="btn btn-s btn-o" data-scr="route">' + g('pin') + 'מסלול במפות</button><button type="button" class="btn btn-s btn-o" data-scr="purim-edit">' + g('edit') + 'עריכה</button>' + rbtnH('demo:הקובץ מוכן להורדה (הדגמה)', 'ייצוא לקובץ', G_DOWNLOAD) + rbtnH('demo:הרשימה נשלחה להדפסה (הדגמה)', 'הדפסת הקבוצה', G_PRINT)) + '</div>' +
      '<div class="sums"><span class="sums-l"><b>' + esc(gr.city) + ' · ' + esc(gr.group) + '</b>סכום סופי לקבוצה</span>' + X.years.map(function (y) {
        return '<span class="sum' + (y === cur ? ' is-now' : '') + '"><i>' + esc(y) + '</i><b>' + nis(gr.sums[y]) + '</b></span>';
      }).join('') + '</div>' +
      tlH('44px minmax(0,1.1fr) minmax(0,1.3fr) ' + years.map(function () { return 'minmax(0,.7fr)'; }).join(' ') + ' minmax(0,1.2fr)', ['מס׳', 'משפחה', 'כתובת'].concat(years.map(esc)).concat(['הערות']), rows, 'tl-purim') +
      '<div class="tl-sum" style="--cols:44px minmax(0,1.1fr) minmax(0,1.3fr) ' + years.map(function () { return 'minmax(0,.7fr)'; }).join(' ') + ' minmax(0,1.2fr)"><span></span><span><b>סך הכול ברשימה</b></span><span></span>' +
      colSum.map(function (v) { return '<span><b>' + nis(v) + '</b></span>'; }).join('') + '<span></span></div>' +
      '<p class="ml-foot">מוצגות ' + gr.rows.length + ' כתובות לדוגמה מתוך ' + gr.addresses + ' בקבוצה</p>';
  }

  /* ---------- מסלול הגבייה במפות גוגל ----------
     כתובות סמוכות באותו רחוב לא נשלחות כל אחת בנפרד: ממילא עוברים שם.
     רחוב שכל הכתובות בו קרובות (עד NEAR מספרי בית) = עצירה אחת. רחוב ארוך = שתי עצירות, בתחילתו ובהמשכו. */
  GL.pin = '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>';
  var ROUTE_NEAR = 10, ROUTE_MAX = 11;
  function purimStops(gr) {
    var by = {}, order = [], stops = [];
    gr.rows.forEach(function (r) { if (!by[r.street]) { by[r.street] = []; order.push(r.street); } by[r.street].push(r.house); });
    order.forEach(function (st) {
      var hs = by[st].slice().sort(function (a, b) { return a - b; }), lo = hs[0], hi = hs[hs.length - 1], mid = (lo + hi) / 2;
      if (hi - lo <= ROUTE_NEAR) stops.push({ street: st, house: lo, covers: hs });
      else {
        stops.push({ street: st, house: lo, covers: hs.filter(function (h) { return h <= mid; }) });
        stops.push({ street: st, house: hi, covers: hs.filter(function (h) { return h > mid; }) });
      }
    });
    return stops;
  }
  function mapsUrl(stops, city) {
    var a = stops.map(function (s) { return s.street + ' ' + s.house + ', ' + city; });
    if (a.length === 1) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a[0]);
    var u = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=' + encodeURIComponent(a[0]) + '&destination=' + encodeURIComponent(a[a.length - 1]);
    if (a.length > 2) u += '&waypoints=' + encodeURIComponent(a.slice(1, -1).join('|'));
    return u;
  }
  // מפות גוגל מקבלות עד 11 נקודות בקישור אחד. מסלול ארוך יותר מתחלק לחלקים, וכל חלק מתחיל בנקודה שבה הקודם נגמר.
  function routeParts(stops) {
    var parts = [], i = 0;
    while (i < stops.length) { parts.push(stops.slice(i, i + ROUTE_MAX)); if (i + ROUTE_MAX >= stops.length) break; i += ROUTE_MAX - 1; }
    return parts;
  }
  function routeHTML(gr) {
    var stops = purimStops(gr), parts = routeParts(stops);
    var X = '<button type="button" class="x" data-close aria-label="סגירה">' + g('close') + '</button>';
    return '<div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">' + esc(gr.city) + ' · ' + esc(gr.group) + '</span>מסלול הגבייה</h2>' +
      '<p class="fnote"><b>' + gr.rows.length + ' כתובות, ' + stops.length + ' עצירות.</b> כתובות סמוכות באותו רחוב מופיעות כעצירה אחת. ברחוב ארוך יש שתי עצירות: בתחילתו ובהמשכו.</p>' +
      '<ol class="rlist route">' + stops.map(function (s, i) {
        return '<li><span class="dsc">' + (i + 1) + '</span><span><b>' + esc(s.street) + ' ' + s.house + '</b>' +
          (s.covers.length > 1 ? 'מכסה ' + s.covers.length + ' כתובות: מספרים ' + s.covers.join(', ') : 'כתובת אחת') + '</span></li>';
      }).join('') + '</ol></div><div class="sheet-f">' + parts.map(function (pt, i) {
        return '<a class="btn" href="' + esc(mapsUrl(pt, gr.city)) + '" target="_blank" rel="noopener">' + g('pin') + (parts.length > 1 ? 'מפות גוגל · חלק ' + (i + 1) : 'פתיחה במפות גוגל') + '</a>';
      }).join('') + '<button type="button" class="btn btn-o" data-close>סגירה</button></div>';
  }

  /* ---------- דו״ח תנועות ---------- */
  function inPeriod(date, period) {
    var t = dnum(D.settings.todayLabel), d = dnum(date);
    if (period === 'today') return d === t;
    if (period === 'yesterday') return d === t - 1;
    if (period === 'week') return d >= t - 6 && d <= t;
    return true;
  }
  function cmpChart() {
    var gy = D.transactionsX.grantsByYear;
    var rows = D.yearly.map(function (y) { var out = y.expenses - gy[y.year]; return { year: y.year, boys: y.boys, purim: y.purim, exp: out, grants: gy[y.year], inc: y.boys + y.purim, total: y.expenses }; });
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.max(r.inc, r.total); }));
    function seg(v, cls, label) { return '<i class="' + cls + '" style="--h:' + (v / mx * 100).toFixed(1) + '" data-tip="' + esc(label) + '|₪' + num(v) + '"></i>'; }
    return '<div class="cmp">' + rows.map(function (r) {
      return '<div class="cmp-y"><div class="cmp-bars"><span class="cmp-col" tabindex="0"><em dir="ltr">₪' + Math.round(r.inc / 1000) + 'K</em>' + seg(r.purim, 'k2', 'פורים ' + r.year) + seg(r.boys, 'k1', 'בחורים ' + r.year) + '</span>' +
        '<span class="cmp-col" tabindex="0"><em dir="ltr">₪' + Math.round(r.total / 1000) + 'K</em>' + seg(r.grants, 'k4', 'עלות מענקים ' + r.year) + seg(r.exp, 'k3', 'הוצאות ' + r.year) + '</span></div><b>' + esc(r.year) + '</b></div>';
    }).join('') + '</div><div class="leg cmp-leg"><span><i class="q1"></i>בחורים</span><span><i class="q2"></i>פורים</span><span><i class="q3"></i>הוצאות</span><span><i class="q4"></i>עלות מענקים</span></div>' +
      tlH('minmax(0,.8fr) repeat(3,minmax(0,1fr))', ['שנה', 'הכנסות', 'הוצאות ומענקים', 'עודף / גירעון'], rows.slice().reverse().map(function (r) {
        var net = r.inc - r.total;
        return '<div class="trow">' + tc('שנה', '<b>' + esc(r.year) + '</b>') + tc('הכנסות', nis(r.inc)) + tc('הוצאות ומענקים', nis(r.total)) + tc('עודף / גירעון', '<b class="' + (net >= 0 ? 'pos' : 'neg') + '" dir="ltr">' + (net >= 0 ? '+' : '−') + '₪' + num(Math.abs(net)) + '</b>') + '</div>';
      }).join(''), 'tl-cmp');
  }
  function transBody() {
    var X = D.transactionsX, st = SC.transactions;
    var inc = X.income.filter(function (r) { return inPeriod(r.date, st.period) && (!st.method || r.method === st.method); });
    var exp = X.expenses.filter(function (r) { return inPeriod(r.date, st.period); });
    var ti = inc.reduce(function (a, r) { return a + r.amount; }, 0), te = exp.reduce(function (a, r) { return a + r.amount; }, 0);
    var label = X.periods.filter(function (p) { return p[0] === st.period; })[0][1];
    function list(items, out) {
      if (!items.length) return '<div class="nodep">' + disc('empty') + '<span><b>אין ' + (out ? 'הוצאות' : 'הפקדות') + ' בתקופה הזו</b><i>אפשר לבחור תקופה אחרת</i></span></div>';
      return items.map(function (r) {
        return '<button type="button" class="act' + (out ? ' is-out' : '') + '" data-scr="demo:כאן תיפתח עריכת התנועה (הדגמה)"><span class="io" aria-hidden="true">' + (out ? '−' : '+') + '</span><span class="tx"><b>' + esc(out ? r.title : r.name) + '</b><i>' + ltr(r.date) + ' · ' + esc(out ? r.category : r.method) + '</i></span>' +
          '<span class="am" dir="ltr">' + (out ? '−' : '+') + '₪' + num(r.amount) + '</span></button>';
      }).join('');
    }
    return '<div class="scr-bar">' + tabsH(X.periods, st.period, 'period', 'תקופה') + '<span class="scr-sp"></span>' +
      selH('אמצעי תשלום', [['', 'אמצעי: הכול'], ['מזומן', 'מזומן'], ['אשראי', 'אשראי']], st.method, 'method') + rbtnH('demo:הדו״ח נשלח להדפסה (הדגמה)', 'הדפסה', G_PRINT) + '</div>' +
      factsH([['₪' + num(ti), 'הכנסות', inc.length + ' הפקדות · ' + label], ['₪' + num(te), 'הוצאות', exp.length + ' תנועות · ' + label], [(ti - te >= 0 ? '+' : '−') + '₪' + num(Math.abs(ti - te)), 'יתרה לתקופה', 'הכנסות פחות הוצאות']]) +
      '<div class="scr-2 scr-2e"><section class="feed"><div class="feed-h"><h3><span class="lt">איסוף מבחורים</span>הכנסות</h3><b class="feed-sum">' + nis(ti) + '</b></div>' + list(inc, false) + '</section>' +
      '<section class="feed feed-r"><div class="feed-h"><h3><span class="lt">הוצאות הקמפיין</span>הוצאות</h3><b class="feed-sum">' + nis(te) + '</b></div>' + list(exp, true) + '</section></div>' +
      '<div class="scr-sec">' + shH('לכל שנה, מה נכנס ומה יצא', 'גבייה מול הוצאות') + '<div class="panel cmp-panel">' + cmpChart() + '</div></div>';
  }

  /* ---------- סיכום הוצאות ---------- */
  function expBody() {
    var X = D.expensesX, st = SC.expenses;
    if (!st.year) st.year = X.year;
    var yi = X.years.indexOf(st.year), prev = yi > 0 ? X.years[yi - 1] : null;
    var cats = X.categories.slice().sort(function (a, b) { return b.byYear[st.year] - a.byYear[st.year]; });
    var tot = cats.reduce(function (a, c) { return a + c.byYear[st.year]; }, 0), ptot = prev ? cats.reduce(function (a, c) { return a + c.byYear[prev]; }, 0) : 0;
    var yr = D.yearly.filter(function (y) { return y.year === st.year; })[0], income = yr ? yr.boys + yr.purim : 0;
    var chg = ptot ? Math.round((tot - ptot) / ptot * 1000) / 10 : null, ratio = pctOf(tot, income);
    var mxY = Math.max.apply(null, X.years.map(function (y) { return X.categories.reduce(function (a, c) { return a + c.byYear[y]; }, 0); }));
    var rows = cats.map(function (c, i) {
      return '<div class="srow xrow" style="--d:' + (i * .05).toFixed(2) + 's"><span class="dsc"><span dir="ltr">' + pctOf(c.byYear[st.year], tot) + '<small>%</small></span></span><span class="tx"><b>' + esc(c.name) + '</b><span class="pbar" style="--p:' + pctOf(c.byYear[st.year], cats[0].byYear[st.year]) + '"><i></i></span></span><b class="xam">' + nis(c.byYear[st.year]) + '</b></div>';
    }).join('');
    var trend = X.years.map(function (y) {
      var t = X.categories.reduce(function (a, c) { return a + c.byYear[y]; }, 0);
      return '<div class="tr-c' + (y === st.year ? ' is-now' : '') + '"><em dir="ltr">₪' + (t / 1000).toFixed(1) + 'K</em><i style="--h:' + (t / mxY * 100).toFixed(1) + '"></i><b>' + esc(y) + '</b></div>';
    }).join('');
    var det = X.categories.map(function (c, ci) {
      var open = !!st.open[ci];
      return '<button type="button" class="trow trow-cat' + (open ? ' is-open' : '') + '" data-scr="cat:' + ci + '" aria-expanded="' + open + '">' + tc('קטגוריה', '<b>' + esc(c.name) + '</b><i>' + (c.items.length === 1 ? 'סעיף אחד' : c.items.length + ' סעיפים') + '</i>') +
        X.years.map(function (y) { return tc(y, y === st.year ? '<b>' + nis(c.byYear[y]) + '</b>' : nis(c.byYear[y]), 'yc'); }).join('') + g('down') + '</button>' +
        (open ? c.items.map(function (it) { return '<div class="trow trow-sub">' + tc('סעיף', esc(it.name)) + X.years.map(function (y) { return tc(y, nis(it[y]), 'yc'); }).join('') + '<span></span></div>'; }).join('') : '');
    }).join('');
    return '<div class="scr-bar">' + selH('שנת ניתוח', X.years.slice().reverse().map(function (y) { return [y, 'שנת ניתוח: ' + y]; }), st.year, 'expyear', true) + '<span class="scr-sp"></span>' + rbtnH('demo:הסיכום נשלח להדפסה (הדגמה)', 'הדפסה', G_PRINT) + '</div>' +
      factsH([['₪' + num(tot), 'סך ההוצאות', chg == null ? 'אין שנה קודמת להשוואה' : (chg >= 0 ? 'עלייה' : 'ירידה') + ' של ' + Math.abs(chg) + '% מאשתקד'], [pctOf(cats[0].byYear[st.year], tot) + '%', cats[0].name, 'הקטגוריה הגדולה · ₪' + num(cats[0].byYear[st.year])],
        ['₪' + num(tot / 12), 'ממוצע חודשי', X.count + ' תנועות בשנה'], [ratio + '%', 'מההכנסות', 'מכל ₪100 שנאספו, ₪' + ratio + ' להוצאות']]) +
      '<div class="scr-2 scr-2e"><section class="panel xp"><div class="panel-h"><h3><span class="lt">לפי קטגוריה · ' + esc(st.year) + '</span>לאן הלך הכסף</h3></div><div class="xrows">' + rows + '</div></section>' +
      '<section class="orb tr-orb"><h3><span class="lt">הוצאות לפי שנה</span>מגמה רב-שנתית</h3><div class="tr">' + trend + '</div></section></div>' +
      '<div class="scr-sec">' + shH('כל סעיף, שנה מול שנה', 'פירוט לפי קטגוריה') +
      tlH('minmax(0,1.6fr) ' + X.years.map(function () { return 'minmax(0,1fr)'; }).join(' ') + ' 22px', ['קטגוריה'].concat(X.years.map(esc)).concat(['']), det, 'tl-exp') + '</div>';
  }

  /* ---------- תקנון ---------- */
  var FW_FULL = { 'ישי״ג': 'ישיבה גדולה', 'ישי״ק': 'ישיבה קטנה', 'קיבוץ': 'קיבוץ', 'חיידר': 'חיידר' };
  var GIFT_SLOT = ['tiyul', 'matana'];
  function rulesMember(m) {
    var gifts = m.gifts.map(function (gf) { return '<span class="tag ' + (gf.earned ? 't-gift' : 't-idle') + '">' + (gf.earned ? 'זכאי ל' + esc(gf.name) : 'חסר ' + nis(gf.missing) + ' ל' + esc(gf.name)) + '</span>'; }).join('');
    return '<div class="rm"><div class="mh"><span class="mg">' + mono(m) + '</span><div><h2>' + esc(m.full) + '</h2><p>' + esc(m.yeshiva) + ' · <b>' + esc(m.frame) + '</b></p><div class="mh-tags"><span class="tag t-' + m.status.tone + '">' + esc(m.status.label) + '</span>' + gifts + '</div></div></div>' +
      '<div class="eq"><span class="coin w" style="--i:0"><i>יעד בסיס</i><b>' + nis(m.base) + '</b></span><span class="op">+</span><span class="coin ' + (m.debt ? 'r' : 'w') + '" style="--i:1"><i>חוב עבר (קנס)</i><b>' + nis(m.debt) + '</b></span><span class="op">=</span>' +
      '<span class="coin y" style="--i:2"><i>סה״כ נדרש</i><b>' + nis(m.required) + '</b></span><span class="op">·</span><span class="coin k" style="--i:3"><i>' + (m.gap ? 'פער' : 'הושלם') + '</i><b>' + nis(m.gap) + '</b></span></div>' +
      '<div class="rm-f"><span>נאסף השנה <b>' + nis(m.collected) + '</b></span><button type="button" class="lnk" data-mid="' + m.id + '"><span>לכרטיס המלא</span>' + g('chev') + '</button></div></div>';
  }
  function rulesBody() {
    var st = SC.rules, t = D.settings.targets, q = st.q.trim().replace(/[-\s]/g, '');
    var fw = ['ישי״ג', 'ישי״ק', 'קיבוץ', 'חיידר'].map(function (k, i) {
      return '<div class="rcard a" style="--d:' + (.1 + i * .06).toFixed(2) + 's">' + disc(FWSLOT[k]) + '<b>' + esc(FW_FULL[k]) + '</b>' + (t[k] ? '<span class="rc-n">' + nis(t[k]) + '</span><i>יעד שנתי לבחור</i>' : '<span class="rc-n rc-0">ללא יעד</span><i>' + (k === 'קיבוץ' ? 'זכאים כל עוד אין חוב' : 'עדיין לא בגיל המענק') + '</i>') + '</div>';
    }).join('');
    var gifts = D.settings.gifts.map(function (gf, i) {
      return '<div class="gcard">' + disc(GIFT_SLOT[i] || 'matana') + '<span><b>' + esc(gf.name) + '</b><i>למי שאסף ' + nis(gf.threshold) + ' ומעלה במהלך השנה</i></span></div>';
    }).join('');
    var found = q ? M.filter(function (m) { return (m.full + m.last + m.first + m.yeshiva + m.phone).replace(/[-\s]/g, '').indexOf(q) > -1; }).slice(0, 6) : [];
    var sel = st.mid ? byId(st.mid) : null;
    return factsH([['₪' + num(t['ישי״ג']), 'יעד ישיבה גדולה', 'לכל בחור, לשנה'], ['₪' + num(t['ישי״ק']), 'יעד ישיבה קטנה', 'לכל בחור, לשנה'], ['×2', 'קנס כפול', 'חוסר ביעד עובר לשנה הבאה']]) +
      '<div class="scr-sec">' + shH('כמה כל אחד צריך להביא', 'היעד לפי מסגרת') + '<div class="rcards">' + fw + '</div></div>' +
      '<div class="scr-2 scr-2e scr-sec"><div>' + shH('ארבעה כללים, בשפה פשוטה', 'הכללים') + '<ol class="rlist">' + D.rulesX.rules.map(function (r, i) { return '<li><span class="dsc">' + (i + 1) + '</span><span><b>' + esc(r[0]) + '</b>' + esc(r[1]) + '</span></li>'; }).join('') + '</ol>' +
      '<div class="rextra"><b>כללים נוספים</b>' + esc(D.rulesX.extra) + '</div></div>' +
      '<div>' + shH('מה מחכה בסוף הדרך', 'המתנות') + '<div class="gcards">' + gifts + '</div></div></div>' +
      '<div class="scr-sec" id="' + P + 'rcheck">' + shH('כמה נדרש מבחור, ולמה', 'בדיקת מצב אישי') +
      '<div class="search rsearch"><svg class="g" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg><input type="search" id="' + P + 'rq" value="' + esc(st.q) + '" placeholder="מקלידים שם של בחור" aria-label="חיפוש בחור לבדיקת מצב אישי" autocomplete="off" data-scrin="rq"></div>' +
      '<div id="' + P + 'rres">' + rulesResults(found, sel, q) + '</div></div>';
  }
  function rulesResults(found, sel, q) {
    if (sel) return rulesMember(sel);
    if (!q) return '<p class="scr-note">הקלידו שם כדי לראות יעד בסיס, קנס, סך הנדרש ומה חסר למתנות.</p>';
    if (!found.length) return '<p class="scr-note">לא נמצא בחור בשם הזה.</p>';
    return '<div class="chips rpick">' + found.map(function (m) { return '<button type="button" class="chipb" data-scr="rpick:' + m.id + '">' + esc(m.full) + '<small>' + esc(m.yeshiva) + '</small></button>'; }).join('') + '</div>';
  }

  /* ---------- הגדרות ---------- */
  var SET_TABS = [['targets', 'יעדים ושנה'], ['cats', 'קטגוריות הוצאות'], ['health', 'תקינות נתונים'], ['backup', 'גיבוי וסנכרון'], ['users', 'משתמשים'], ['purim', 'סכומי פורים'], ['audit', 'יומן פעולות']];
  function setTargets() {
    var t = D.settings.targets;
    return '<form class="panel sform" data-form="settings" novalidate><div class="panel-h"><h3><span class="lt">הסכום שכל בחור צריך להגיע אליו</span>יעדים ושנת פעילות</h3></div>' +
      '<div class="dform sgrid">' + fldH('שנת הקמפיין הנוכחית', inH('s-year', D.settings.campaignYear), '', 's-year') +
      '<p class="fld shint"><b>השנה העברית כבר ' + esc(D.settings.todayHebrewYear) + '.</b> הפקדות חדשות נרשמות לשנת הקמפיין שכאן.</p>' +
      ['חיידר', 'ישי״ק', 'ישי״ג', 'קיבוץ'].map(function (k, i) { return '<div class="fld amt"><label for="' + P + 's-t' + i + '">יעד ' + esc(FW_FULL[k]) + '</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 's-t' + i + '" type="text" inputmode="numeric" value="' + t[k] + '" style="text-align:left"></div></div>'; }).join('') +
      '</div><h4 class="sh4">מתנות ותוספות</h4><div class="dform sgrid">' + D.settings.gifts.map(function (gf, i) {
        return '<div class="gset">' + disc(GIFT_SLOT[i] || 'matana') + '<div class="gset-f">' + fldH('שם המתנה', inH('s-g' + i, gf.name), '', 's-g' + i) +
          '<div class="fld amt"><label for="' + P + 's-gt' + i + '">מסכום של</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 's-gt' + i + '" type="text" inputmode="numeric" value="' + gf.threshold + '" style="text-align:left"></div></div>' + togH('פעילה', true, 'noop') + '</div></div>';
      }).join('') + '</div><h4 class="sh4">כללים נוספים לתקנון</h4><div class="fld w2"><div class="uin"><textarea id="' + P + 's-extra" rows="3" aria-label="כללים נוספים לתקנון">' + esc(D.rulesX.extra) + '</textarea></div></div>' +
      '<div class="sform-f"><button type="submit" class="btn btn-k">שמירת היעדים' + g('chev2') + '</button></div></form>';
  }
  function setCats() {
    return '<div class="panel sform"><div class="panel-h"><h3><span class="lt">יופיעו בטופס רישום הוצאה</span>קטגוריות הוצאות</h3></div><div class="chips cats">' + D.settingsX.categories.map(function (c, i) {
      return '<span class="chipb is-static">' + esc(c) + '<button type="button" class="ic" data-scr="cat-del:' + i + '" aria-label="הסרת ' + esc(c) + '">' + g('close') + '</button></span>';
    }).join('') + '</div><form class="cat-add" data-form="cat" novalidate><label class="uin"><input id="' + P + 's-cat" type="text" placeholder="שם קטגוריה חדשה" aria-label="שם קטגוריה חדשה" autocomplete="off"></label><button type="submit" class="btn btn-s btn-k">' + g('plus') + 'הוספה</button></form></div>';
  }
  function setHealth() {
    return '<div class="rows hrows">' + D.settingsX.health.map(function (h, i) {
      return '<button type="button" class="srow" data-scr="demo:' + (h.count ? 'כאן ייפתח חלון התיקון (הדגמה)' : 'הכול תקין כאן') + '"><span class="dsc">' + h.count + '<u class="t-' + h.tone + '"></u></span><span class="tx"><b>' + esc(h.title) + '</b><i>' + esc(h.sub) + '</i></span>' + g('chev') + '</button>';
    }).join('') + '</div>';
  }
  function setBackup() {
    var X = D.settingsX;
    return factsH(X.counts.slice(0, 3).map(function (c) { return [num(c[1]), c[0], 'רשומות במערכת']; })) +
      '<div class="panel sform bk"><div class="panel-h"><h3><span class="lt">סנכרון אחרון: ' + ltr(esc(X.lastSync)) + '</span>גיבוי וסנכרון</h3><span class="tag t-good">מסונכרן</span></div>' +
      '<p class="scr-note">' + X.counts.slice(3).map(function (c) { return esc(c[0]) + ': <b>' + num(c[1]) + '</b>'; }).join(' · ') + '</p>' +
      '<div class="sform-f"><button type="button" class="btn btn-k" data-scr="demo:הנתונים סונכרנו (הדגמה)">' + 'סנכרון עכשיו' + g('chev2') + '</button><button type="button" class="btn btn-o" data-scr="demo:קובץ הגיבוי מוכן להורדה (הדגמה)">ייצוא גיבוי</button><button type="button" class="btn btn-o" data-scr="demo:ייבוא גיבוי זמין למנהל בלבד (הדגמה)">ייבוא גיבוי</button></div></div>';
  }
  function setUsers() {
    var X = D.settingsX;
    return tlH('minmax(0,1.3fr) repeat(5,minmax(0,1fr)) 96px', ['משתמש'].concat(X.perms.map(esc)).concat(['']), X.users.map(function (u, ui) {
      return '<div class="trow">' + tc('משתמש', '<b>' + esc(u.name) + '</b><i dir="ltr">' + esc(u.login) + '</i>') + X.perms.map(function (p, pi) {
        return tc(p, '<label class="tog tog-s"><input type="checkbox" data-scrtog="perm:' + ui + ':' + pi + '"' + (u.admin || u.perms[pi] ? ' checked' : '') + (u.admin ? ' disabled' : '') + ' aria-label="' + esc(p) + ' · ' + esc(u.name) + '"><span class="sw"></span></label>');
      }).join('') + '<span class="tc tc-act">' + (u.admin ? '<span class="tag t-gift">מנהל</span>' : '<button type="button" class="btn btn-s btn-o" data-scr="demo:ההרשאות של ' + esc(u.name) + ' נשמרו (הדגמה)">שמירה</button>') + '</span></div>';
    }).join(''), 'tl-users') + '<p class="scr-note">מנהל רואה ועושה הכול. הוספת משתמש חדש ואיפוס סיסמה נעשים בלוח הניהול של המסד.</p>';
  }
  function setPurim() {
    var X = D.purimX;
    return tlH('minmax(0,1.4fr) repeat(' + X.years.length + ',minmax(0,1fr))', ['קבוצה'].concat(X.years.map(esc)), X.groups.map(function (gr, gi) {
      return '<div class="trow">' + tc('קבוצה', '<b>' + esc(gr.city) + '</b><i>' + esc(gr.group) + '</i>') + X.years.map(function (y) {
        return tc(y, '<label class="uin uin-s" dir="ltr"><span class="pre">₪</span><input type="text" inputmode="numeric" value="' + gr.sums[y] + '" data-scrin="psum:' + gi + ':' + esc(y) + '" aria-label="סכום ' + esc(y) + ' · ' + esc(gr.city) + ' ' + esc(gr.group) + '"></label>', 'yc');
      }).join('') + '</div>';
    }).join(''), 'tl-psum') + '<div class="sform-f"><button type="button" class="btn btn-k" data-scr="demo:סכומי הפורים נשמרו (הדגמה)">שמירת הסכומים' + g('chev2') + '</button></div>';
  }
  function setAudit() {
    var tone = { 'הוספה': 'good', 'עדכון': 'warn', 'מחיקה': 'bad' };
    return tlH('minmax(0,1fr) minmax(0,.9fr) 96px minmax(0,.7fr) minmax(0,1.6fr)', ['מתי', 'מי', 'פעולה', 'על מה', 'פרטים'], D.settingsX.audit.map(function (a) {
      return '<div class="trow">' + tc('מתי', ltr(esc(a[0]))) + tc('מי', '<b>' + esc(a[1]) + '</b>') + tc('פעולה', '<span class="tag t-' + tone[a[2]] + '">' + esc(a[2]) + '</span>') + tc('על מה', esc(a[3])) + tc('פרטים', nisT(a[4])) + '</div>';
    }).join(''), 'tl-audit') + '<p class="ml-foot">מוצגות ' + D.settingsX.audit.length + ' הפעולות האחרונות לדוגמה</p>';
  }
  function settingsBody() {
    var st = SC.settings, V = { targets: setTargets, cats: setCats, health: setHealth, backup: setBackup, users: setUsers, purim: setPurim, audit: setAudit };
    return '<div class="scr-bar">' + tabsH(SET_TABS, st.tab, 'stab', 'לשוניות הגדרות') + '</div><div class="spane">' + V[st.tab]() + '</div>';
  }

  var SCREENS = {
    grants: {
      hero: function () { var gr = D.grants; return { slot: 'maanakim', sub: 'חבילת החתן, מי קיבל אותה, והתשלומים לחנויות.', stamp: [['מענקי חתנים', 'קמפיין ' + S.year, 'עזרת חתנים'], String(gr.grooms), 'חתנים'],
        cta: '<button type="button" class="btn btn-k" data-scr="form:groom">הוספת חתן' + g('chev2') + '</button><button type="button" class="lnk" data-scr="gview:pay"><span>לתשלומים לחנויות</span>' + g('chev') + '</button>' }; },
      body: function () {
        var st = SC.grants, gr = D.grants;
        return factsH([[D.grantsX.recipients.length, 'חתנים השנה', 'קיבלו חבילת חתן'], ['₪' + num(gr.packageValue), 'שווי חבילה', 'ביגוד, נעליים, מצעים וכלי בית'], ['₪' + num(gr.cost), 'עלות המענקים', gr.stores.length + ' חנויות בהסדר']]) +
          '<div class="scr-bar">' + tabsH([['give', 'נתינת המענק'], ['pay', 'תשלומים לחנויות']], st.view, 'gview', 'תצוגה') + '<span class="scr-sp"></span>' +
          selH('שנה', D.grantsX.years.map(function (y) { return [y, 'שנה: ' + y]; }), D.grantsX.year, 'gyear', true) + rbtnH('demo:הקובץ מוכן להורדה (הדגמה)', 'ייצוא לקובץ', G_DOWNLOAD) + rbtnH('demo:הדף נשלח להדפסה (הדגמה)', 'הדפסה', G_PRINT) + '</div>' +
          (st.view === 'give' ? grantsGive() : grantsPay());
      }
    },
    purim: {
      hero: function () { return { slot: 'purim', sub: 'רשימות הכתובות לפי עיר וקבוצה, והסכומים של כל שנה.', stamp: [['יום הפורים', 'קמפיין ' + S.year, 'כתובות'], String(D.summary.purimAddresses), 'כתובות'],
        cta: '<button type="button" class="btn btn-k" data-scr="purim-edit">הזנת סכומים' + g('chev2') + '</button><button type="button" class="lnk" data-scr="route"><span>מסלול במפות גוגל</span>' + g('chev') + '</button>' }; },
      body: purimBody
    },
    transactions: {
      hero: function () { return { slot: 'tnuot', sub: 'כל הפקדה וכל הוצאה, לפי תקופה.', stamp: [['הכנסות והוצאות', 'קמפיין ' + S.year, 'דו״ח תנועות'], String(D.summary.deposits), 'הפקדות'],
        cta: '<button type="button" class="btn btn-k" data-open="deposit">רישום הפקדה' + g('chev2') + '</button><button type="button" class="lnk" data-scr="form:expense"><span>רישום הוצאה</span>' + g('chev') + '</button>' }; },
      body: transBody
    },
    expenses: {
      hero: function () { var s = D.summary; return { slot: 'hotzaot', sub: 'לאן הולך הכסף: לפי קטגוריה, ושנה מול שנה.', stamp: [['הוצאות הקמפיין', 'קמפיין ' + S.year, 'ללא מענקים'], pctOf(s.expensesTotal, s.collected + s.purimThisYear) + '%', 'מההכנסות'],
        cta: '<button type="button" class="btn btn-k" data-scr="form:expense">רישום הוצאה' + g('chev2') + '</button><button type="button" class="lnk" data-go="transactions"><span>לדו״ח התנועות</span>' + g('chev') + '</button>' }; },
      body: expBody
    },
    rules: {
      hero: function () { return { slot: 'takanon', sub: 'היעדים, הקנס הכפול והזכאות למענק, בשפה פשוטה.', stamp: [['תקנון', 'קמפיין ' + S.year, 'עזרת חתנים'], 'פי 2', 'קנס'],
        cta: '<button type="button" class="btn btn-k" data-scr="rcheck">בדיקת מצב אישי' + g('chev2') + '</button><button type="button" class="lnk" data-go="settings"><span>עדכון היעדים</span>' + g('chev') + '</button>' }; },
      body: rulesBody
    },
    settings: {
      hero: function () { return { slot: 'hagdarot', sub: 'שנת הקמפיין, היעדים, המתנות, המשתמשים והגיבוי.', stamp: [['הגדרות', 'הרשאת מנהל', 'צדקת רבי שמעון'], String(SET_TABS.length), 'לשוניות'],
        cta: '<button type="button" class="btn btn-k" data-scr="stab:targets">יעדים ושנה' + g('chev2') + '</button><button type="button" class="lnk" data-scr="stab:users"><span>משתמשים והרשאות</span>' + g('chev') + '</button>' }; },
      body: settingsBody
    }
  };

  /* ---------- טפסים ---------- */
  var FORM = { kind: '', arg: null, step: 1 };
  function formHTML(kind, arg) {
    var years = [D.settings.campaignYear, D.settings.todayHebrewYear, D.yearly[D.yearly.length - 2].year], h = '', m, b;
    if (kind === 'route') return routeHTML(arg);
    var X = '<button type="button" class="x" data-close aria-label="סגירה">' + g('close') + '</button>';
    function foot(label) { return '<div class="sheet-f"><button type="submit" class="btn">' + label + g('chev2') + '</button><button type="button" class="btn btn-o" data-close>ביטול</button></div>'; }
    if (kind === 'member') {
      m = arg || {};
      var type = m.type || 'ישי״ג';
      h = '<form data-form="member" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">' + (arg ? 'עדכון פרטים' : 'כרטיס חדש') + '</span>' + (arg ? esc(m.full) : 'בחור חדש') + '</h2><div class="dform">' +
        fldH('שם פרטי', inH('m-first', m.first), '', 'm-first') + fldH('שם משפחה', inH('m-last', m.last), '', 'm-last') + fldH('שם האב', inH('m-father', m.father), '', 'm-father') +
        fldH('טלפון', inH('m-phone', m.phone, 'inputmode="tel" dir="ltr" style="text-align:right"'), '', 'm-phone') + fldH('ישיבה', inH('m-yeshiva', m.yeshiva, 'placeholder="שם הישיבה"'), '', 'm-yeshiva') +
        fldH('מסגרת', '<select id="' + P + 'm-type" data-scrsel="mtype">' + Object.keys(D.frames).map(function (k) { return '<option value="' + esc(k) + '"' + (k === type ? ' selected' : '') + '>' + esc(FW_FULL[k]) + '</option>'; }).join('') + '</select>' + g('down'), '', 'm-type') +
        '<div class="fld" id="' + P + 'm-shiur-f"' + (type === 'חיידר' ? ' hidden' : '') + '><label for="' + P + 'm-shiur">שיעור</label><div class="uin">' + optH('m-shiur', D.frames[type], '') + '</div></div>' +
        '<div class="fld"><span class="lb">מצב משפחתי</span>' + segH('m-status', ['רווק', 'נשוי'], 'רווק') + '</div>' +
        fldH('כתובת', inH('m-addr', m.address || (m.city ? 'רחוב הדוגמה 6, ' + m.city : ''), 'placeholder="רחוב ומספר, עיר"'), 'w2', 'm-addr') + fldH('הערות', inH('m-note', '', 'placeholder="לא חובה"'), 'w2', 'm-note') +
        '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot(arg ? 'שמירת השינויים' : 'הוספת הבחור') + '</form>';
    } else if (kind === 'expense') {
      h = '<form data-form="expense" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">הוצאות הקמפיין</span>רישום הוצאה</h2><div class="dform">' +
        fldH('תאריך', inH('e-date', D.settings.todayLabel, 'inputmode="numeric" dir="ltr" style="text-align:right"') + g('calendar'), '', 'e-date') + fldH('שייך לשנת', optH('e-year', years, years[0]), '', 'e-year') +
        fldH('קטגוריה', optH('e-cat', D.settingsX.categories, D.settingsX.categories[0]), '', 'e-cat') +
        '<div class="fld amt"><label for="' + P + 'e-amt">סכום</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 'e-amt" type="text" inputmode="numeric" placeholder="0" autocomplete="off" style="text-align:left" data-scrin="amt"></div></div>' +
        fldH('פירוט', inH('e-note', '', 'placeholder="על מה ההוצאה"'), 'w2', 'e-note') + '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot('שמירת ההוצאה') + '</form>';
    } else if (kind === 'groom') {
      h = '<form data-form="groom" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">מקבלי המענק · ' + esc(D.grantsX.year) + '</span>הוספת חתן</h2><div class="dform">' +
        fldH('בחירה מרשימת הבחורים', '<select id="' + P + 'g-pick" data-scrsel="gpick"><option value="">לא מהרשימה</option>' + M.map(function (x) { return '<option value="' + x.id + '">' + esc(x.full) + ' · ' + esc(x.yeshiva) + '</option>'; }).join('') + '</select>' + g('down'), 'w2', 'g-pick') +
        fldH('שם ומשפחה', inH('g-name', ''), '', 'g-name') + fldH('תעודת זהות', inH('g-idn', '', 'inputmode="numeric" dir="ltr" style="text-align:right"'), '', 'g-idn') +
        fldH('טלפון', inH('g-phone', '', 'inputmode="tel" dir="ltr" style="text-align:right"'), '', 'g-phone') + fldH('תאריך', inH('g-date', D.settings.todayLabel, 'inputmode="numeric" dir="ltr" style="text-align:right"') + g('calendar'), '', 'g-date') +
        '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot('הוספת החתן') + '</form>';
    } else if (kind === 'bill') {
      b = arg;
      h = '<form data-form="bill" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">' + esc(D.grantsX.halves[SC.grants.half].label) + '</span>תשלום ל' + esc(b.shop) + '</h2>' +
        '<p class="fnote">צפי לפי ' + D.grantsX.halves[SC.grants.half].grooms + ' חתנים: <b>' + nis(b.expected) + '</b>. משלמים לפי הקבלות על מה שמומש בפועל.</p><div class="dform">' +
        '<div class="fld amt"><label for="' + P + 'b-amt">לתשלום לפי קבלות</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 'b-amt" type="text" inputmode="numeric" value="' + (b.billed ? num(b.billed) : '') + '" placeholder="0" autocomplete="off" style="text-align:left" data-scrin="amt"></div></div>' +
        fldH('מספר קבלה / חשבונית', inH('b-ref', b.ref, 'inputmode="numeric"'), '', 'b-ref') +
        '<div class="fld"><span class="lb">מצב התשלום</span>' + segH('b-paid', ['ממתין לתשלום', 'שולם'], b.status === 'שולם' ? 'שולם' : 'ממתין לתשלום') + '</div>' +
        fldH('אמצעי תשלום', optH('b-method', ['העברה בנקאית', 'צ׳ק', 'מזומן', 'אשראי', 'אחר'], b.method || 'העברה בנקאית'), 'paid-only' + (b.status === 'שולם' ? '' : ' is-off'), 'b-method') +
        fldH('תאריך התשלום', inH('b-date', b.paidOn || D.settings.todayLabel, 'inputmode="numeric" dir="ltr" style="text-align:right"') + g('calendar'), 'paid-only' + (b.status === 'שולם' ? '' : ' is-off'), 'b-date') +
        '<div class="fld"><span class="lb">קבלה</span><button type="button" class="btn btn-s btn-o upl" data-scr="demo:כאן בוחרים קובץ קבלה, PDF או תמונה (הדגמה)">' + (b.receipt ? 'החלפת הקבלה' : 'צירוף קבלה') + '</button></div>' +
        '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot('שמירת התשלום') + '</form>';
    } else if (kind === 'credit') {
      var step = FORM.step;
      h = '<form data-form="credit" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">נדרים פלוס · שלב ' + step + ' מתוך 3</span>סליקת אשראי</h2><div class="steps">' + [1, 2, 3].map(function (n) { return '<i class="' + (n <= step ? 'on' : '') + '"></i>'; }).join('') + '</div>';
      if (step === 1) h += '<div class="dform">' + fldH('בחור', '<select id="' + P + 'c-member">' + M.map(function (x) { return '<option value="' + x.id + '">' + esc(x.full) + ' · ' + esc(x.yeshiva) + '</option>'; }).join('') + '</select>' + g('down'), 'w2', 'c-member') +
        '<div class="fld amt w2"><label for="' + P + 'c-amt">סכום לחיוב</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 'c-amt" type="text" inputmode="numeric" placeholder="0" autocomplete="off" style="text-align:left" data-scrin="amt"></div></div><p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div>';
      else if (step === 2) h += '<div class="cframe"><b>כאן נפתח חלון הסליקה המאובטח</b><i>פרטי הכרטיס מוקלדים ישירות אצל חברת הסליקה, ולא נשמרים במערכת.</i></div><p class="fnote"><b>האם התשלום עבר?</b> רק אחרי אישור אצל חברת הסליקה רושמים את ההפקדה.</p>';
      else h += '<div class="dform">' + fldH('מספר אישור עסקה', inH('c-ref', '', 'inputmode="numeric" dir="ltr" style="text-align:right" placeholder="מופיע באישור הסליקה"'), 'w2', 'c-ref') + '</div><p class="fnote">ההפקדה תירשם באמצעי <b>אשראי</b>, עם מספר האישור בהערות.</p>';
      h += '</div><div class="sheet-f">' + (step === 2 ? '<button type="submit" class="btn">התשלום עבר' + g('chev2') + '</button><button type="button" class="btn btn-o" data-scr="credit-back">לא עבר, חזרה</button>'
        : '<button type="submit" class="btn">' + (step === 1 ? 'המשך לסליקה' : 'רישום ההפקדה') + g('chev2') + '</button><button type="button" class="btn btn-o" data-close>ביטול</button>') + '</div></form>';
    }
    return h;
  }
  function openForm(kind, arg) {
    if (FORM.kind !== kind || kind !== 'credit' || id('ov-form').hidden) FORM.step = 1;
    FORM.kind = kind; FORM.arg = arg || null;
    id('fsheet').innerHTML = formHTML(kind, FORM.arg);
    id('fsheet').className = 'sheet fsheet fs-' + kind;
    showOv('form');
    var f = $('input:not([type=radio]),select', id('fsheet'));
    later(function () { try { if (f) f.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function formErr(msg) { var e = id('ferr'); if (e) e.textContent = msg; return false; }
  function digits(fid) { var el = id(fid); return el ? parseInt(String(el.value).replace(/[^\d]/g, ''), 10) || 0 : 0; }
  function val(fid) { var el = id(fid); return el ? String(el.value).trim() : ''; }
  function scrSubmit(kind) {
    var X = D.grantsX, amt, name, b;
    if (kind === 'member') {
      if (!val('m-first') || !val('m-last')) return formErr('צריך למלא שם פרטי ושם משפחה');
      closeAll(); toast(FORM.arg ? 'הפרטים נשמרו (הדגמה)' : 'הבחור נוסף (הדגמה)', 'userplus');
    } else if (kind === 'expense') {
      amt = digits('e-amt'); if (!amt) return formErr('צריך להזין סכום גדול מאפס');
      D.transactionsX.expenses.unshift({ date: val('e-date') || D.settings.todayLabel, title: val('e-note') || val('e-cat'), category: val('e-cat'), amount: amt });
      closeAll(); toast('ההוצאה נרשמה: ' + ltr('₪' + num(amt)), 'check'); scrDraw();
    } else if (kind === 'groom') {
      name = val('g-name'); if (!name) return formErr('צריך למלא שם ומשפחה');
      X.recipients.push({ n: X.recipients.length + 1, name: name, idn: val('g-idn') || '—', phone: val('g-phone') || '—', date: val('g-date') || D.settings.todayLabel, half: 'ב' });
      closeAll(); toast('החתן נוסף לרשימה', 'userplus'); SC.grants.view = 'give'; scrDraw();
    } else if (kind === 'bill') {
      b = FORM.arg; amt = digits('b-amt'); if (!amt) return formErr('צריך להזין את הסכום לפי הקבלות');
      var paid = ($('input[name="' + P + 'b-paid"]:checked', id('fsheet')) || {}).value === 'שולם';
      b.billed = amt; b.ref = val('b-ref'); b.status = paid ? 'שולם' : 'ממתין לתשלום'; b.paidOn = paid ? val('b-date') : ''; b.method = paid ? val('b-method') : ''; b.receipt = true;
      closeAll(); toast('התשלום ל' + esc(b.shop) + ' נשמר', 'check'); scrDraw();
    } else if (kind === 'credit') {
      if (FORM.step === 1) { amt = digits('c-amt'); if (!amt) return formErr('צריך להזין סכום לחיוב'); FORM.amt = amt; FORM.mid = val('c-member'); FORM.step = 2; openForm('credit'); }
      else if (FORM.step === 2) { FORM.step = 3; openForm('credit'); }
      else { closeAll(); toast('ההפקדה באשראי נרשמה: ' + ltr('₪' + num(FORM.amt || 0)), 'check'); FORM.step = 1; }
    } else if (kind === 'settings') { toast('היעדים נשמרו (הדגמה)', 'check'); }
    else if (kind === 'cat') {
      name = val('s-cat'); if (!name) return false;
      D.settingsX.categories.push(name); scrDraw(); toast('הקטגוריה נוספה', 'check');
    }
    return true;
  }

  /* ---------- פעולות ---------- */
  function scrAct(raw, el) {
    var i = raw.indexOf(':'), a = i < 0 ? raw : raw.slice(0, i), v = i < 0 ? '' : raw.slice(i + 1), X, st;
    if (a === 'demo') { toast(esc(v), 'check'); return; }
    if (a === 'form') { openForm(v); return; }
    if (a === 'credit-back') { FORM.step = 1; openForm('credit'); return; }
    if (a === 'gview') { SC.grants.view = v; SC.grants.editPkg = false; if (S.soon !== 'grants') go('grants'); else scrDraw(); if (v === 'pay') scrollToEl($('.scr-bar', id('scr'))); return; }
    if (a === 'half') { SC.grants.half = v; scrDraw(); return; }
    if (a === 'pkg-edit') { st = SC.grants; if (st.editPkg) { D.grantsX.package.forEach(function (p) { p.total = p.items.reduce(function (s, it) { return s + it.value; }, 0); }); toast('תכולת החבילה נשמרה', 'check'); } st.editPkg = !st.editPkg; scrDraw(); return; }
    if (a === 'groom-del') { X = D.grantsX; X.recipients = X.recipients.filter(function (r) { return String(r.n) !== v; }); X.recipients.forEach(function (r, n) { r.n = n + 1; }); scrDraw(); toast('החתן הוסר מהרשימה', 'check'); return; }
    if (a === 'bill') { openForm('bill', D.grantsX.halves[SC.grants.half].bills[+v]); return; }
    if (a === 'route') { st = SC.purim; if (!st.city) st.city = D.purimX.cities[0]; X = purimGroupsOf(st.city); openForm('route', X[Math.min(st.group, X.length - 1)]); return; }
    if (a === 'city') { SC.purim.city = v; SC.purim.group = 0; SC.purim.edit = false; scrDraw(); return; }
    if (a === 'group') { SC.purim.group = +v; SC.purim.edit = false; scrDraw(); return; }
    if (a === 'purim-edit') { SC.purim.edit = true; scrDraw(); var f = $('.tl-purim input', id('scr')); scrollToEl($('.sums', id('scr'))); if (f) later(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 350); return; }
    if (a === 'purim-save' || a === 'purim-cancel') { SC.purim.edit = false; scrDraw(); if (a === 'purim-save') toast('הסכומים נשמרו', 'check'); return; }
    if (a === 'period') { SC.transactions.period = v; scrDraw(); return; }
    if (a === 'cat') { SC.expenses.open[v] = !SC.expenses.open[v]; scrDraw(); return; }
    if (a === 'cat-del') { D.settingsX.categories.splice(+v, 1); scrDraw(); return; }
    if (a === 'rcheck') { scrollToEl(id('rcheck')); var q = id('rq'); if (q) later(function () { try { q.focus({ preventScroll: true }); } catch (e) {} }, 400); return; }
    if (a === 'rpick') { SC.rules.mid = v; id('rres').innerHTML = rulesResults([], byId(v), 'x'); return; }
    if (a === 'stab') { SC.settings.tab = v; scrDraw(); if (el && el.closest('.hero')) scrollToEl($('.scr-bar', id('scr'))); return; }
  }
  function bindScreens() {
    root.addEventListener('change', function (e) {
      var t = e.target, a = t.getAttribute && (t.getAttribute('data-scrsel') || t.getAttribute('data-scrtog')), p, m;
      // תשלום לחנות: אמצעי ותאריך מוצגים רק כשמסמנים "שולם"
      if (t.name === P + 'b-paid') { $$('.paid-only', id('fsheet')).forEach(function (f) { f.classList.toggle('is-off', t.value !== 'שולם'); }); return; }
      if (!a) return;
      if (a === 'method') { SC.transactions.method = t.value; scrDraw(); }
      else if (a === 'expyear') { SC.expenses.year = t.value; scrDraw(); }
      else if (a === 'gyear') { if (t.value !== D.grantsX.year) { toast('בהדגמה מוצגת שנת ' + esc(D.grantsX.year) + ' בלבד', 'info'); t.value = D.grantsX.year; } }
      else if (a === 'allyears') { SC.purim.all = t.checked; scrDraw(); }
      else if (a === 'mtype') { var sh = id('m-shiur'), box = id('m-shiur-f'); box.hidden = t.value === 'חיידר'; sh.innerHTML = D.frames[t.value].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
      else if (a === 'gpick') { m = byId(t.value); if (m) { id('g-name').value = m.full; id('g-phone').value = m.phone; } }
      else if (a.indexOf('perm:') === 0) { p = a.split(':'); D.settingsX.users[+p[1]].perms[+p[2]] = t.checked ? 1 : 0; }
    });
    root.addEventListener('input', function (e) {
      var t = e.target, a = t.getAttribute && t.getAttribute('data-scrin'), p, d;
      if (!a) return;
      if (a === 'rq') { SC.rules.q = t.value; SC.rules.mid = ''; var q = t.value.trim().replace(/[-\s]/g, ''); id('rres').innerHTML = rulesResults(q ? M.filter(function (m) { return (m.full + m.last + m.first + m.yeshiva + m.phone).replace(/[-\s]/g, '').indexOf(q) > -1; }).slice(0, 6) : [], null, q); return; }
      d = t.value.replace(/[^\d]/g, '').slice(0, 6);
      if (a === 'amt') { t.value = d ? num(+d) : ''; var er = id('ferr'); if (er) er.textContent = ''; return; }
      t.value = d; p = a.split(':');
      if (p[0] === 'pkg') D.grantsX.package[+p[1]].items[+p[2]].value = +d || 0;
      else if (p[0] === 'purim') { var st = SC.purim, gr = purimGroupsOf(st.city)[st.group]; gr.rows[+p[1]].amounts[D.purimX.years[D.purimX.years.length - 1]] = +d || 0; }
      else if (p[0] === 'psum') D.purimX.groups[+p[1]].sums[p[2]] = +d || 0;
    });
  }
