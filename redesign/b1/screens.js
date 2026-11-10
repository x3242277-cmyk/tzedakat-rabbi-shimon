/* ============ המסכים המלאים: מענקים · כתובות פורים · דו״ח תנועות · סיכום הוצאות · תקנון · הגדרות ============
     הקובץ נכנס לתוך script.js בזמן הבנייה (shared/build.js), ולכן הוא משתמש באותן פונקציות עזר: id, esc, nis, g, slot, disc, toast, stampSVG.
     כל הנתונים הם נתוני הדגמה מ-shared/data-screens.js. שינויים נשמרים בזיכרון בלבד. */
  var SC = {
    grants: { view: 'give', half: 'א', editPkg: false },
    purim: { city: '', group: 0, all: false, edit: false, map: false, better: false, plan: null },
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
  function dnum(s) { var p = String(s).split('/'); return Math.round(Date.UTC(+p[2], +p[1] - 1, +p[0]) / 864e5); }
  function addrH(r) { return esc(r.street) + (r.house !== '' && r.house != null ? ' ' + esc(r.house) : '') + (r.apt !== '' && r.apt != null ? ' <small>דירה ' + esc(r.apt) + '</small>' : ''); }
  function classicBar(text) { return '<div class="ro-bar"><span>' + text + '</span><button type="button" class="btn btn-s btn-k" data-act="classic">פתיחה במסך הקודם' + g('chev2') + '</button></div>'; }
  function roWrap(html, text) { return HOST() ? classicBar(text) + '<fieldset class="ro" disabled>' + html + '</fieldset>' : html; }
  function emptyH(title, sub) { return '<div class="empty">' + disc('empty') + '<b>' + title + '</b><i>' + sub + '</i></div>'; }
  function has(name) { var h = HOST(); return !!h && typeof h[name] === 'function'; }
  // קריאה למערכת: אם הפעולה עוד לא מחוברת, נפתח המסך הקודם של אותו נושא
  function hcall(name) {
    var h = HOST(), args = Array.prototype.slice.call(arguments, 1), r;
    if (!has(name)) { if (h) h.classic(S.view === 'soon' ? S.soon : S.view, S.soon === 'settings' ? SC.settings.tab : null); return { ok: false, classic: true }; }
    try { r = h[name].apply(h, args); } catch (e) { try { console.error('nd host ' + name, e); } catch (x) {} r = { ok: false, error: 'הפעולה לא בוצעה. אפשר לנסות שוב' }; }
    return r || { ok: true };
  }
  function hdo() { var r = hcall.apply(null, arguments); if (r.ok === false && !r.classic) toast(esc(r.error || 'הפעולה לא בוצעה'), 'info'); return r.ok !== false; }
  function numIn(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; }
  function safeBody(k) {
    if (!HOST()) return SCREENS[k].body();
    try { return SCREENS[k].body(); }
    catch (e) { try { console.error('nd screen ' + k, e); } catch (x) {} return emptyH('המסך הזה עדיין לא זמין בעיצוב החדש', 'אפשר לפתוח אותו במסך הקודם') + classicBar('הנתונים של המסך הזה לא הוצגו.'); }
  }
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
    id('soon').innerHTML = scrHero(k, sc.hero()) + '<div class="wrap scr-body" id="' + P + 'scr">' + safeBody(k) + '</div>';
    return true;
  }
  function scrDraw() {
    var b = id('scr');
    if (!b || !S.soon || !SCREENS[S.soon]) return;
    b.innerHTML = safeBody(S.soon);
    $$('.a', b).forEach(function (el) { el.classList.remove('a'); });
  }

  /* ---------- מענקים ---------- */
  function billTone(st) { return st === 'שולם' ? 'good' : st === 'ממתין לתשלום' ? 'warn' : 'idle'; }
  function pkgDraft() {
    return D.grantsX.package.map(function (p) {
      return { store: p.store, discount: p.discount || '', items: p.items.map(function (it) { return { name: it.name, qty: it.qty || 1, storePrice: it.storePrice != null ? it.storePrice : (it.qty ? it.value / it.qty : it.value), orgPrice: it.orgPrice != null ? it.orgPrice : 0 }; }) };
    });
  }
  function pkgEditor() {
    var dr = SC.grants.draft || [];
    function tin(key, v, label, ph) { return '<label class="uin uin-t"><input type="text" value="' + esc(v) + '" data-scrin="' + key + '" placeholder="' + esc(ph || label) + '" aria-label="' + esc(label) + '" autocomplete="off"></label>'; }
    function nin(key, v, label, cur) { return '<label class="uin uin-s"' + (cur ? ' dir="ltr"' : '') + '>' + (cur ? '<span class="pre">₪</span>' : '') + '<input type="text" inputmode="decimal" value="' + esc(v) + '" data-scrin="' + key + '" aria-label="' + esc(label) + '" autocomplete="off"></label>'; }
    return dr.map(function (p, pi) {
      return '<div class="pkg pkg-ed"><div class="pkg-eh">' + tin('pk:' + pi + ':store', p.store, 'שם החנות') + tin('pk:' + pi + ':discount', p.discount, 'הנחה', 'הנחה, למשל 20%') +
        '<button type="button" class="ic" data-scr="pk-rmstore:' + pi + '" aria-label="הסרת החנות ' + esc(p.store) + '">' + g('close') + '</button></div>' +
        (p.items.length ? '<div class="pkg-ei pkg-eih"><span>מוצר</span><span>כמות לחתן</span><span>מחיר בחנות</span><span>עלות לארגון ליחידה</span><span></span></div>' : '') +
        p.items.map(function (it, ii) {
          var k = 'pki:' + pi + ':' + ii + ':';
          return '<div class="pkg-ei">' + tin(k + 'name', it.name, 'מוצר') + nin(k + 'qty', it.qty, 'כמות לחתן') + nin(k + 'storePrice', it.storePrice, 'מחיר בחנות', true) + nin(k + 'orgPrice', it.orgPrice, 'עלות לארגון ליחידה', true) +
            '<button type="button" class="ic" data-scr="pk-rm:' + pi + ':' + ii + '" aria-label="הסרת ' + esc(it.name) + '">' + g('close') + '</button></div>';
        }).join('') + '<button type="button" class="lnk pkg-add" data-scr="pk-add:' + pi + '"><span>הוספת מוצר</span>' + g('plus') + '</button></div>';
    }).join('') + '<div class="sform-f"><button type="button" class="btn btn-s btn-o" data-scr="pk-store">' + g('plus') + 'הוספת חנות</button><span class="scr-sp"></span>' +
      '<button type="button" class="btn btn-o" data-scr="pkg-cancel">ביטול</button><button type="button" class="btn btn-k" data-scr="pkg-edit">שמירת התכולה' + g('chev2') + '</button></div>';
  }
  function grantsGive() {
    var X = D.grantsX, st = SC.grants, live = !!HOST(), canE = !live || X.canEdit !== false;
    if (live && st.editPkg) return '<div class="panel pkg-full"><div class="panel-h"><h3><span class="lt">מה מקבל כל חתן · ' + esc(X.year) + '</span>עריכת תכולת המענק</h3></div>' + pkgEditor() + '</div>';
    var rows = X.recipients.map(function (r, ri) {
      return '<div class="trow">' + tc('מס׳', '<b class="num">' + r.n + '</b>') + tc('שם ומשפחה', '<b>' + esc(r.name || '—') + '</b>') + tc('תעודת זהות', ltr(esc(r.idn || '—'))) + tc('טלפון', ltr(esc(r.phone || '—'))) + tc('תאריך', ltr(esc(r.date || '—'))) +
        tc('מחצית', r.half ? '<span class="tag t-neutral">מחצית ' + esc(r.half) + '׳</span>' : '<span class="tag t-idle">ללא תאריך</span>') +
        (live ? (canE ? '<span class="tc-ics"><button type="button" class="ic" data-scr="groom-edit:' + ri + '" aria-label="עריכת ' + esc(r.name) + '">' + g('edit') + '</button><button type="button" class="ic" data-scr="groom-del:' + ri + '" aria-label="הסרת ' + esc(r.name) + '">' + g('close') + '</button></span>' : '<span></span>')
          : '<button type="button" class="ic" data-scr="groom-del:' + r.n + '" aria-label="הסרת ' + esc(r.name) + '">' + g('close') + '</button>') + '</div>';
    }).join('');
    var total = X.package.reduce(function (a, p) { return a + p.total; }, 0);
    var pk = X.package.map(function (p, pi) {
      return '<div class="pkg"><div class="pkg-h"><span><b>' + esc(p.store) + '</b><i>' + (live ? (p.discount ? 'הנחה ' + esc(p.discount) : '') + (p.cost != null ? (p.discount ? ' · ' : '') + 'עלות לארגון ' + nis(p.cost) : '') : esc(p.shop)) + '</i></span><b>' + nis(p.total) + '</b></div>' + p.items.map(function (it, ii) {
        return '<div class="pkg-i"><span>' + esc(it.name) + (it.qty > 1 ? ' <small dir="ltr">×' + it.qty + '</small>' : '') + '</span>' +
          (st.editPkg ? '<label class="uin uin-s" dir="ltr"><span class="pre">₪</span><input type="text" inputmode="numeric" value="' + it.value + '" data-scrin="pkg:' + pi + ':' + ii + '" aria-label="שווי ' + esc(it.name) + '"></label>' : '<span>' + nis(it.value) + '</span>') + '</div>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="scr-2"><div>' + shH('מי קיבל השנה', 'מקבלי המענק') +
      tlH('44px minmax(0,1.5fr) minmax(0,.9fr) minmax(0,1.1fr) minmax(0,.9fr) 96px ' + (live ? '80px' : '40px'), ['מס׳', 'שם ומשפחה', 'תעודת זהות', 'טלפון', 'תאריך', 'מחצית', ''], rows, 'tl-grooms') +
      '<p class="ml-foot">' + (X.recipients.length ? X.recipients.length + ' חתנים בשנת ' + esc(X.year) : 'עדיין לא נרשמו חתנים בשנת ' + esc(X.year)) + '</p></div>' +
      '<aside class="feed pkg-box"><div class="feed-h"><h3><span class="lt">שווי חבילה לחתן ' + nis(total) + '</span>מה מקבלים</h3>' +
      (canE ? '<button type="button" class="btn btn-s ' + (st.editPkg ? 'btn-k' : 'btn-o') + '" data-scr="pkg-edit">' + (st.editPkg ? 'שמירה' : g('edit') + 'עריכה') + '</button>' : '') + '</div>' +
      (pk || '<p class="scr-note">עדיין לא הוגדרה תכולת מענק לשנה הזאת.</p>') + '</aside></div>';
  }
  function grantsPay() {
    var X = D.grantsX, st = SC.grants, H = X.halves[st.half] || { label: '', grooms: 0, bills: [] }, live = !!HOST(), canE = !live || X.canEdit !== false;
    var billed = H.bills.reduce(function (a, b) { return a + b.billed; }, 0);
    var paid = H.bills.reduce(function (a, b) { return a + (b.status === 'שולם' ? b.billed : 0); }, 0);
    var rows = H.bills.map(function (b, i) {
      var actLabel = b.legacy ? 'שיוך למחצית' : b.status === 'טרם הוזן חיוב' ? 'הזנת חיוב' : b.status === 'ממתין לתשלום' ? 'סימון כשולם' : 'פרטי התשלום';
      var cells = tc('חנות', '<b>' + esc(b.store) + '</b><i>' + (live ? (b.notes ? esc(b.notes) : b.legacy ? 'נרשם בשיטה הקודמת' : '') : esc(b.shop)) + '</i>') + tc('צפי לפי חתנים', b.first === false ? '<i>—</i>' : nis(b.expected)) +
        tc('לתשלום לפי קבלות', b.billed ? '<b>' + nis(b.billed) + '</b>' : '<i>—</i>') + tc('קבלה / חשבונית', (b.ref ? esc(b.ref) : '<i>—</i>') + (live && b.receipt ? '<i>קבלה מצורפת</i>' : '')) +
        tc('סטטוס', '<span class="tag t-' + billTone(b.status) + '">' + esc(b.status) + '</span>' + (b.paidOn ? '<i>' + ltr(esc(b.paidOn)) + (b.method ? ' · ' + esc(b.method) : '') + '</i>' : ''));
      return canE ? '<button type="button" class="trow" data-scr="bill:' + i + '" aria-label="' + esc(b.store) + ', ' + esc(b.status) + '">' + cells + '<span class="tc tc-act">' + esc(actLabel) + g('chev') + '</span></button>' : '<div class="trow">' + cells + '<span></span></div>';
    }).join('');
    var legacy = live && X.legacy && X.legacy.length ? '<div class="scr-sec">' + shH('רשומות ישנות שעוד לא שויכו למחצית', 'תשלומים בשיטה הקודמת') +
      tlH('minmax(0,1.2fr) minmax(0,.8fr) minmax(0,1.4fr) minmax(0,.8fr) minmax(0,.8fr) 150px', ['חנות / ספק', 'תאריך', 'הוצאה / חשבונית', 'אמצעי', 'סכום ששולם', ''], X.legacy.map(function (l, i) {
        var c = tc('חנות / ספק', '<b>' + esc(l.store) + '</b>') + tc('תאריך', esc(l.date || '—')) + tc('הוצאה / חשבונית', esc(l.description || '—')) + tc('אמצעי', esc(l.method || '—')) + tc('סכום ששולם', '<b>' + nis(l.amount || 0) + '</b>');
        return canE ? '<button type="button" class="trow" data-scr="legacy:' + i + '">' + c + '<span class="tc tc-act">שיוך למחצית' + g('chev') + '</span></button>' : '<div class="trow">' + c + '<span></span></div>';
      }).join(''), 'tl-bills') + '</div>' : '';
    return '<div class="scr-bar">' + tabsH([['א', X.halves['א'].label, X.halves['א'].grooms + ' חתנים'], ['ב', X.halves['ב'].label, X.halves['ב'].grooms + ' חתנים']], st.half, 'half', 'מחצית') +
      (live && canE ? '<span class="scr-sp"></span><button type="button" class="btn btn-s btn-o" data-scr="bill-new">' + g('plus') + 'תשלום לחנות אחרת</button>' : '') + '</div>' +
      factsH([['₪' + num(billed), 'לתשלום לפי קבלות', 'במחצית ' + st.half + '׳'], ['₪' + num(paid), 'שולם', pctOf(paid, billed) + '% מהחיובים'], ['₪' + num(billed - paid), 'נשאר לשלם', billed - paid ? 'ממתין לתשלום' : 'אין חיובים פתוחים']]) +
      (H.bills.length ? tlH('minmax(0,1.2fr) minmax(0,.9fr) minmax(0,1fr) minmax(0,.9fr) minmax(0,1.3fr) 150px', ['חנות', 'צפי לפי חתנים', 'לתשלום לפי קבלות', 'קבלה / חשבונית', 'סטטוס', ''], rows, 'tl-bills')
        : emptyH('אין עדיין חנויות לשנה הזאת', 'החנויות מגיעות מתכולת המענק. אפשר גם להזין תשלום לחנות שאינה בתכולה')) +
      '<p class="scr-note">בכל מחצית משלמים לכל חנות לפי הקבלות על מה שמומש בפועל. הצפי מחושב לפי מספר החתנים במחצית, ולכן הוא בדרך כלל גבוה מהחיוב.' + (live && X.noHalf ? ' ' + X.noHalf + ' חתנים בלי תאריך לא נכללו בצפי.' : '') + '</p>' + legacy;
  }

  /* ---------- כתובות פורים ---------- */
  function purimGroupsOf(city) { return D.purimX.groups.filter(function (gr) { return gr.city === city; }); }
  function purimBody() {
    var X = D.purimX, st = SC.purim;
    if (!st.city) st.city = X.cities[0];
    if (!X.groups.length || !st.city) return emptyH('עדיין אין כתובות פורים', 'כשיוזנו כתובות, הן יופיעו כאן לפי עיר וקבוצה');
    if (X.cities.indexOf(st.city) < 0) { st.city = X.cities[0]; st.group = 0; }
    var groups = purimGroupsOf(st.city), gr = groups[Math.min(st.group, groups.length - 1)];
    var years = st.all ? X.years : X.years.slice(-2), cur = X.years[X.years.length - 1];
    var total = X.groups.reduce(function (a, x) { return a + (x.sums[cur] || 0); }, 0), addrs = X.groups.reduce(function (a, x) { return a + x.addresses; }, 0);
    var live = !!HOST(), HE = live && st.edit, showMin = !live;
    function pin(ri, f, v, label, cls) { v = v == null || v === 0 ? '' : v; return '<label class="uin uin-s' + (cls ? ' ' + cls : '') + '"><input type="text" value="' + esc(v) + '" data-pe="' + ri + ':' + esc(f) + '" data-o="' + esc(v) + '" aria-label="' + esc(label) + '" autocomplete="off"></label>'; }
    var rows = gr.rows.map(function (r, ri) {
      if (HE) return '<div class="trow trow-e">' + tc('מס׳', '<b class="num">' + esc(r.n) + '</b>') +
        tc('משפחה', '<span class="pe-2">' + pin(ri, 'משפחה', r.family, 'משפחה', 'uin-t') + pin(ri, 'שם', r.first, 'שם פרטי', 'uin-t') + '</span>') +
        tc('כתובת', '<span class="pe-2">' + pin(ri, 'רחוב', r.street, 'רחוב', 'uin-t') + pin(ri, 'מספר', r.house, 'מספר בית', 'uin-n') + pin(ri, 'דירה', r.apt, 'דירה', 'uin-n') + '</span>') +
        years.map(function (y) { return tc(y, pin(ri, y, r.amounts[y], 'סכום ' + y + ' ל' + r.family, 'uin-a'), 'yc'); }).join('') + tc('הערות', pin(ri, 'הערות', r.note, 'הערות', 'uin-t'), 'note') + '</div>';
      return (st.edit || live ? '<div class="trow">' : '<button type="button" class="trow" data-scr="visit:' + ri + '">') + tc('מס׳', '<b class="num">' + esc(r.n) + '</b>') + tc('משפחה', '<b>' + esc(r.family) + ' <small>' + esc(r.first) + '</small></b>') +
        tc('כתובת', '<span>' + addrH(r) + '</span>') +
        years.map(function (y) {
          var v = r.amounts[y];
          if (st.edit && y === cur) return tc(y, '<label class="uin uin-s" dir="ltr"><span class="pre">₪</span><input type="text" inputmode="numeric" value="' + (v || '') + '" data-scrin="purim:' + ri + '" aria-label="סכום ' + esc(y) + ' ל' + esc(r.family) + '"></label>', 'yc');
          return tc(y, v ? (y === cur ? '<b>' + nis(v) + '</b>' : nis(v)) : '<i>—</i>', 'yc');
        }).join('') + (showMin ? tc('דקות', st.edit ? '<label class="uin uin-s"><input type="text" inputmode="numeric" value="' + (r.stay || '') + '" placeholder="' + RT.per + '" data-scrin="pstay:' + ri + '" aria-label="דקות בכתובת של ' + esc(r.family) + '"></label>' : stayH(r, stayOf(r, routeCfg())), 'yc') : '') +
        tc('הערות', r.note ? esc(r.note) : '<i>—</i>', 'note') + (st.edit || live ? '</div>' : '</button>');
    }).join('');
    var cols = '36px minmax(0,' + (HE ? '1.5' : '1.1') + 'fr) minmax(0,' + (HE ? '2' : '1.3') + 'fr) ' + years.map(function () { return 'minmax(0,.7fr)'; }).join(' ') + (showMin ? ' minmax(0,.9fr)' : '') + ' minmax(0,1.2fr)';
    var colSum = years.map(function (y) { return gr.rows.reduce(function (a, r) { return a + (r.amounts[y] || 0); }, 0); });
    var head = factsH([[num(addrs), 'כתובות', 'ב-' + X.groups.length + ' קבוצות'], ['₪' + num(total), 'נאסף בפורים', 'בשנת ' + cur], [X.cities.length, 'ערים', X.cities.join(', ')]]) +
      '<div class="scr-bar">' + tabsH(X.cities.map(function (c) { return [c, c, purimGroupsOf(c).reduce(function (a, x) { return a + x.addresses; }, 0)]; }), st.city, 'city', 'עיר') + '</div>';
    if (st.plan) return head + planView(st.city);
    if (st.map) return head + '<div class="scr-bar scr-bar2"><div class="chips">' + groups.map(function (x, i) { return '<button type="button" class="chipb' + (x === gr ? ' is-on' : '') + '" data-scr="group:' + i + '">' + esc(x.group) + '<small>' + x.addresses + '</small></button>'; }).join('') + '</div>' +
      '<span class="scr-sp"></span><button type="button" class="btn btn-s btn-o" data-scr="pplan">בניית מסלולים אוטומטית</button><button type="button" class="btn btn-s btn-k" data-scr="pmap">' + g('list') + 'חזרה לרשימה</button></div>' + mapView(gr);
    return factsH([[num(addrs), 'כתובות', 'ב-' + X.groups.length + ' קבוצות'], ['₪' + num(total), 'נאסף בפורים', 'בשנת ' + cur], [X.cities.length, 'ערים', X.cities.join(', ')]]) +
      '<div class="scr-bar">' + tabsH(X.cities.map(function (c) { return [c, c, purimGroupsOf(c).reduce(function (a, x) { return a + x.addresses; }, 0)]; }), st.city, 'city', 'עיר') + '</div>' +
      '<div class="scr-bar scr-bar2"><div class="chips">' + groups.map(function (x, i) { return '<button type="button" class="chipb' + (x === gr ? ' is-on' : '') + '" data-scr="group:' + i + '">' + esc(x.group) + '<small>' + x.addresses + '</small></button>'; }).join('') + '</div>' +
      '<span class="scr-sp"></span>' + togH('כל השנים', st.all, 'allyears') +
      (st.edit ? '<button type="button" class="btn btn-s btn-k" data-scr="purim-save">שמירה</button><button type="button" class="btn btn-s btn-o" data-scr="purim-cancel">ביטול</button>'
        : '<button type="button" class="btn btn-s btn-o" data-scr="pmap">' + g('pin') + 'תצוגת מפה</button><button type="button" class="btn btn-s btn-o" data-scr="purim-edit">' + g('edit') + 'עריכה</button>' + rbtnH('demo:הקובץ מוכן להורדה (הדגמה)', 'ייצוא לקובץ', G_DOWNLOAD) + rbtnH('demo:הרשימה נשלחה להדפסה (הדגמה)', 'הדפסת הקבוצה', G_PRINT)) + '</div>' +
      '<div class="sums"><span class="sums-l"><b>' + esc(gr.city) + ' · ' + esc(gr.group) + '</b>סכום סופי לקבוצה</span>' + X.years.map(function (y) {
        return '<span class="sum' + (y === cur ? ' is-now' : '') + '"><i>' + esc(y) + '</i><b>' + nis(gr.sums[y] || 0) + '</b></span>';
      }).join('') + '</div>' +
      tlH(cols, ['מס׳', 'משפחה', 'כתובת'].concat(years.map(esc)).concat(showMin ? ['דקות בכתובת', 'הערות'] : ['הערות']), rows, 'tl-purim' + (HE ? ' is-edit' : '')) +
      '<div class="tl-sum" style="--cols:' + cols + '"><span></span><span><b>סך הכול ברשימה</b></span><span></span>' +
      colSum.map(function (v) { return '<span><b>' + nis(v) + '</b></span>'; }).join('') + (showMin ? '<span></span>' : '') + '<span></span></div>' +
      '<p class="ml-foot">' + (HOST() ? gr.rows.length + ' כתובות בקבוצה' : 'מוצגות ' + gr.rows.length + ' כתובות לדוגמה מתוך ' + gr.addresses + ' בקבוצה') + '</p>';
  }
  function purimChanges() {
    var st = SC.purim, gr = purimGroupsOf(st.city)[st.group], by = {}, out = [];
    $$('[data-pe]', id('scr')).forEach(function (inp) {
      var v = String(inp.value).trim(), k, ri, f;
      if (v === inp.getAttribute('data-o')) return;
      k = inp.getAttribute('data-pe'); ri = +k.slice(0, k.indexOf(':')); f = k.slice(k.indexOf(':') + 1);
      (by[ri] = by[ri] || {})[f] = v;
    });
    Object.keys(by).forEach(function (ri) { var r = gr.rows[+ri]; if (r) out.push({ sbId: r.sbId, fields: by[ri] }); });
    return out;
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
    var rows = D.yearly.map(function (y) { var gc = Math.min(gy[y.year] || 0, y.expenses), out = y.expenses - gc; return { year: y.year, boys: y.boys, purim: y.purim, exp: out, grants: gc, inc: y.boys + y.purim, total: y.expenses }; });
    var mx = Math.max.apply(null, [1].concat(rows.map(function (r) { return Math.max(r.inc, r.total); })));
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
    var all = st.period === 'all', LIM = 150;
    var inc = (all && X.incomeAll ? X.incomeAll : X.income).filter(function (r) { return inPeriod(r.date, st.period) && (!st.method || r.method === st.method); });
    var exp = (all && X.expensesAll ? X.expensesAll : X.expenses).filter(function (r) { return inPeriod(r.date, st.period); });
    var ti = inc.reduce(function (a, r) { return a + r.amount; }, 0), te = exp.reduce(function (a, r) { return a + r.amount; }, 0);
    var label = X.periods.filter(function (p) { return p[0] === st.period; })[0][1];
    st.shown = { title: label + (st.method ? ' · ' + st.method : ''), income: inc, expenses: exp };
    function list(items, out) {
      if (!items.length) return '<div class="nodep">' + disc('empty') + '<span><b>אין ' + (out ? 'הוצאות' : 'הפקדות') + ' בתקופה הזו</b><i>אפשר לבחור תקופה אחרת</i></span></div>';
      return items.slice(0, LIM).map(function (r) {
        return '<button type="button" class="act' + (out ? ' is-out' : '') + '" data-scr="' + (HOST() ? 'tx:' + (out ? 'out' : 'in') + ':' + esc(r.id) : 'demo:כאן תיפתח עריכת התנועה (הדגמה)') + '"><span class="io" aria-hidden="true">' + (out ? '−' : '+') + '</span><span class="tx"><b>' + esc(out ? r.title : r.name) + '</b><i>' + ltr(r.date) + ' · ' + esc(out ? r.category : r.method) + '</i></span>' +
          '<span class="am" dir="ltr">' + (out ? '−' : '+') + '₪' + num(r.amount) + '</span></button>';
      }).join('') + (items.length > LIM ? '<p class="ml-foot">מוצגות ' + LIM + ' התנועות האחרונות מתוך ' + num(items.length) + '. הסכום למעלה כולל את כולן.</p>' : '');
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
    if (X.years.indexOf(st.year) < 0) st.year = X.year;
    var cats = X.categories.slice().sort(function (a, b) { return b.byYear[st.year] - a.byYear[st.year]; });
    if (!cats.length) return emptyH('עדיין אין הוצאות', 'הוצאה ראשונה שתירשם תופיע כאן לפי קטגוריה');
    var tot = cats.reduce(function (a, c) { return a + c.byYear[st.year]; }, 0), ptot = prev ? cats.reduce(function (a, c) { return a + c.byYear[prev]; }, 0) : 0;
    var yr = D.yearly.filter(function (y) { return y.year === st.year; })[0], income = yr ? yr.boys + yr.purim : 0;
    var chg = ptot ? Math.round((tot - ptot) / ptot * 1000) / 10 : null, ratio = pctOf(tot, income);
    var mxY = Math.max.apply(null, [1].concat(X.years.map(function (y) { return X.categories.reduce(function (a, c) { return a + c.byYear[y]; }, 0); })));
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
    var found = q ? M.filter(function (m) { return !m.married && (m.full + m.last + m.first + m.yeshiva + m.phone).replace(/[-\s]/g, '').indexOf(q) > -1; }).slice(0, 6) : [];
    var sel = st.mid ? byId(st.mid) : null;
    return factsH([['₪' + num(t['ישי״ג']), 'יעד ישיבה גדולה', 'לכל בחור, לשנה'], ['₪' + num(t['ישי״ק']), 'יעד ישיבה קטנה', 'לכל בחור, לשנה'], ['×2', 'קנס כפול', 'חוסר ביעד עובר לשנה הבאה']]) +
      '<div class="scr-sec">' + shH('כמה כל אחד צריך להביא', 'היעד לפי מסגרת') + '<div class="rcards">' + fw + '</div></div>' +
      '<div class="scr-2 scr-2e scr-sec"><div>' + shH('ארבעה כללים, בשפה פשוטה', 'הכללים') + '<ol class="rlist">' + D.rulesX.rules.map(function (r, i) { return '<li><span class="dsc">' + (i + 1) + '</span><span><b>' + esc(r[0]) + '</b>' + esc(r[1]) + '</span></li>'; }).join('') + '</ol>' +
      (D.rulesX.extra ? '<div class="rextra"><b>כללים נוספים</b>' + esc(D.rulesX.extra) + '</div>' : '') + '</div>' +
      '<div>' + shH('מה מחכה בסוף הדרך', 'המתנות') + '<div class="gcards">' + (gifts || '<p class="scr-note">לא הוגדרו מתנות לשנה הזאת.</p>') + '</div></div></div>' +
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
    var t = D.settings.targets, live = !!HOST() && has('saveSettings') && !!D.settingsX.giftsAll, gifts = live ? D.settingsX.giftsAll : D.settings.gifts;
    return '<form class="panel sform" data-form="settings" novalidate><div class="panel-h"><h3><span class="lt">הסכום שכל בחור צריך להגיע אליו</span>יעדים ושנת פעילות</h3></div>' +
      '<div class="dform sgrid">' + fldH('שנת הקמפיין הנוכחית', inH('s-year', D.settings.campaignYear), '', 's-year') +
      '<p class="fld shint">' + (D.settings.todayHebrewYear !== D.settings.campaignYear ? '<b>השנה העברית כבר ' + esc(D.settings.todayHebrewYear) + '.</b> ' : '') + 'הפקדות חדשות נרשמות לשנת הקמפיין שכאן.</p>' +
      ['חיידר', 'ישי״ק', 'ישי״ג', 'קיבוץ'].map(function (k, i) { return '<div class="fld amt"><label for="' + P + 's-t' + i + '">יעד ' + esc(FW_FULL[k]) + '</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 's-t' + i + '" type="text" inputmode="numeric" value="' + t[k] + '" style="text-align:left"></div></div>'; }).join('') +
      '</div><h4 class="sh4">מתנות ותוספות</h4><div class="dform sgrid">' + gifts.map(function (gf, i) {
        return '<div class="gset">' + disc(GIFT_SLOT[i] || 'matana') + '<div class="gset-f">' + fldH('שם המתנה', inH('s-g' + i, gf.name), '', 's-g' + i) +
          '<div class="fld amt"><label for="' + P + 's-gt' + i + '">מסכום של</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 's-gt' + i + '" type="text" inputmode="numeric" value="' + gf.threshold + '" style="text-align:left"></div></div>' +
          (live ? '<label class="tog"><input type="checkbox" id="' + P + 's-ge' + i + '"' + (gf.enabled ? ' checked' : '') + '><span class="sw"></span>פעילה</label>' : togH('פעילה', true, 'noop')) + '</div></div>';
      }).join('') + '</div><h4 class="sh4">כללים נוספים לתקנון</h4><div class="fld w2"><div class="uin"><textarea id="' + P + 's-extra" rows="3" aria-label="כללים נוספים לתקנון">' + esc(D.rulesX.extra) + '</textarea></div></div>' +
      '<p class="err" id="' + P + 'serr" role="alert"></p><div class="sform-f"><button type="submit" class="btn btn-k">שמירת היעדים' + g('chev2') + '</button></div></form>';
  }
  function setCats() {
    return '<div class="panel sform"><div class="panel-h"><h3><span class="lt">יופיעו בטופס רישום הוצאה</span>קטגוריות הוצאות</h3></div><div class="chips cats">' + D.settingsX.categories.map(function (c, i) {
      return '<span class="chipb is-static">' + esc(c) + '<button type="button" class="ic" data-scr="cat-del:' + i + '" aria-label="הסרת ' + esc(c) + '">' + g('close') + '</button></span>';
    }).join('') + '</div><form class="cat-add" data-form="cat" novalidate><label class="uin"><input id="' + P + 's-cat" type="text" placeholder="שם קטגוריה חדשה" aria-label="שם קטגוריה חדשה" autocomplete="off"></label><button type="submit" class="btn btn-s btn-k">' + g('plus') + 'הוספה</button></form></div>';
  }
  function setHealth() {
    return '<div class="rows hrows">' + D.settingsX.health.map(function (h, i) {
      return '<button type="button" class="srow" data-scr="' + (HOST() ? (h.count ? 'health:' + esc(h.key) : 'say:הכול תקין כאן') : 'demo:' + (h.count ? 'כאן ייפתח חלון התיקון (הדגמה)' : 'הכול תקין כאן')) + '"><span class="dsc">' + h.count + '<u class="t-' + h.tone + '"></u></span><span class="tx"><b>' + esc(h.title) + '</b><i>' + esc(h.sub) + '</i></span>' + g('chev') + '</button>';
    }).join('') + '</div>';
  }
  function setBackup() {
    var X = D.settingsX, live = !!HOST();
    return factsH(X.counts.slice(0, 3).map(function (c) { return [num(c[1]), c[0], 'רשומות במערכת']; })) +
      '<div class="panel sform bk"><div class="panel-h"><h3><span class="lt">סנכרון אחרון: ' + ltr(esc(X.lastSync)) + '</span>גיבוי וסנכרון</h3>' +
      (live ? (X.pendingWrites ? '<span class="tag t-warn">' + X.pendingWrites + ' שינויים ממתינים לשליחה</span>' : '') : '<span class="tag t-good">מסונכרן</span>') + '</div>' +
      '<p class="scr-note">' + X.counts.slice(3).map(function (c) { return esc(c[0]) + ': <b>' + num(c[1]) + '</b>'; }).join(' · ') + '</p>' +
      '<div class="sform-f"><button type="button" class="btn btn-k" data-scr="' + (live ? 'sync' : 'demo:הנתונים סונכרנו (הדגמה)') + '">' + 'סנכרון עכשיו' + g('chev2') + '</button>' +
      '<button type="button" class="btn btn-o" data-scr="' + (live ? 'bk-export' : 'demo:קובץ הגיבוי מוכן להורדה (הדגמה)') + '">ייצוא גיבוי</button>' +
      '<button type="button" class="btn btn-o" data-scr="' + (live ? 'bk-import' : 'demo:ייבוא גיבוי זמין למנהל בלבד (הדגמה)') + '">ייבוא גיבוי</button></div></div>';
  }
  function setUsers() {
    var X = D.settingsX;
    return tlH('minmax(0,1.3fr) repeat(5,minmax(0,1fr)) 96px', ['משתמש'].concat(X.perms.map(esc)).concat(['']), X.users.map(function (u, ui) {
      return '<div class="trow">' + tc('משתמש', '<b>' + esc(u.name) + '</b><i dir="ltr">' + esc(u.login) + '</i>') + X.perms.map(function (p, pi) {
        return tc(p, '<label class="tog tog-s"><input type="checkbox" data-scrtog="perm:' + ui + ':' + pi + '"' + (u.admin || u.perms[pi] ? ' checked' : '') + (u.admin ? ' disabled' : '') + ' aria-label="' + esc(p) + ' · ' + esc(u.name) + '"><span class="sw"></span></label>');
      }).join('') + '<span class="tc tc-act">' + (u.admin ? '<span class="tag t-gift">מנהל</span>' : '<button type="button" class="btn btn-s btn-o" data-scr="' + (HOST() ? 'perm-save:' + ui : 'demo:ההרשאות של ' + esc(u.name) + ' נשמרו (הדגמה)') + '">שמירה</button>') + '</span></div>';
    }).join(''), 'tl-users') + '<p class="scr-note">מנהל רואה ועושה הכול. הוספת משתמש חדש ואיפוס סיסמה נעשים בלוח הניהול של המסד.</p>';
  }
  function setPurim() {
    var X = D.purimX;
    return tlH('minmax(0,1.4fr) repeat(' + X.years.length + ',minmax(0,1fr))', ['קבוצה'].concat(X.years.map(esc)), X.groups.map(function (gr, gi) {
      return '<div class="trow">' + tc('קבוצה', '<b>' + esc(gr.city) + '</b><i>' + esc(gr.group) + '</i>') + X.years.map(function (y) {
        return tc(y, '<label class="uin uin-s" dir="ltr"><span class="pre">₪</span><input type="text" inputmode="numeric" value="' + gr.sums[y] + '" data-scrin="psum:' + gi + ':' + esc(y) + '" aria-label="סכום ' + esc(y) + ' · ' + esc(gr.city) + ' ' + esc(gr.group) + '"></label>', 'yc');
      }).join('') + '</div>';
    }).join(''), 'tl-psum') + '<div class="sform-f"><button type="button" class="btn btn-k" data-scr="' + (HOST() ? 'psum-save' : 'demo:סכומי הפורים נשמרו (הדגמה)') + '">שמירת הסכומים' + g('chev2') + '</button></div>';
  }
  function setAudit() {
    var tone = { 'הוספה': 'good', 'עדכון': 'warn', 'מחיקה': 'bad' };
    return tlH('minmax(0,1fr) minmax(0,.9fr) 96px minmax(0,.7fr) minmax(0,1.6fr)', ['מתי', 'מי', 'פעולה', 'על מה', 'פרטים'], D.settingsX.audit.map(function (a) {
      return '<div class="trow">' + tc('מתי', ltr(esc(a[0]))) + tc('מי', '<b>' + esc(a[1]) + '</b>') + tc('פעולה', '<span class="tag t-' + (tone[a[2]] || 'neutral') + '">' + esc(a[2]) + '</span>') + tc('על מה', esc(a[3])) + tc('פרטים', nisT(a[4])) + '</div>';
    }).join(''), 'tl-audit') + '<p class="ml-foot">' + (HOST() ? (SC.settings.auditState === 'load' ? 'טוען את יומן הפעולות…' : D.settingsX.audit.length ? D.settingsX.audit.length + ' הפעולות האחרונות' : 'אין פעולות ביומן') : 'מוצגות ' + D.settingsX.audit.length + ' הפעולות האחרונות לדוגמה') + '</p>';
  }
  function settingsBody() {
    var st = SC.settings, V = { targets: setTargets, cats: setCats, health: setHealth, backup: setBackup, users: setUsers, purim: setPurim, audit: setAudit };
    var RO = { targets: 'היעדים והמתנות מוצגים כאן לקריאה. העריכה עדיין במסך הקודם.', cats: 'הקטגוריות מוצגות כאן לקריאה. הוספה והסרה עדיין במסך הקודם.', users: 'ההרשאות מוצגות כאן לקריאה. העריכה עדיין במסך הקודם.', purim: 'סכומי הפורים מוצגים כאן לקריאה. העריכה עדיין במסך הקודם.' };
    if (HOST() && st.tab === 'audit' && !st.auditState && D.settingsX.loadAudit) {
      st.auditState = 'load';
      D.settingsX.loadAudit().then(function (rows) { st.auditRows = rows || []; st.auditState = 'done'; D.settingsX.audit = st.auditRows; if (S.soon === 'settings' && st.tab === 'audit') scrDraw(); });
    }
    if (HOST() && st.auditRows) D.settingsX.audit = st.auditRows;
    var pane = V[st.tab]();
    return '<div class="scr-bar">' + tabsH(SET_TABS, st.tab, 'stab', 'לשוניות הגדרות') + '</div><div class="spane">' + (RO[st.tab] && !has(({ targets: 'saveSettings', cats: 'addCategory', users: 'saveUserPerms', purim: 'savePurimSums' })[st.tab]) ? roWrap(pane, RO[st.tab]) : pane) + '</div>';
  }

  var SCREENS = {
    grants: {
      hero: function () { var gr = D.grants; return { slot: 'maanakim', sub: 'חבילת החתן, מי קיבל אותה, והתשלומים לחנויות.', stamp: [['מענקי חתנים', 'קמפיין ' + S.year, 'עזרת חתנים'], String(gr.grooms), 'חתנים'],
        cta: '<button type="button" class="btn btn-k" data-scr="form:groom">הוספת חתן' + g('chev2') + '</button><button type="button" class="lnk" data-scr="gview:pay"><span>לתשלומים לחנויות</span>' + g('chev') + '</button>' }; },
      body: function () {
        var st = SC.grants, gr = D.grants;
        return factsH([[D.grantsX.recipients.length, 'חתנים השנה', 'קיבלו חבילת חתן'], ['₪' + num(gr.packageValue), 'שווי חבילה', 'ביגוד, נעליים, מצעים וכלי בית'], ['₪' + num(gr.cost), 'עלות המענקים', gr.stores.length + ' חנויות בהסדר']]) +
          '<div class="scr-bar">' + tabsH([['give', 'נתינת המענק'], ['pay', 'תשלומים לחנויות']], st.view, 'gview', 'תצוגה') + '<span class="scr-sp"></span>' +
          selH('שנה', (D.grantsX.years.indexOf(D.grantsX.year) < 0 ? [D.grantsX.year] : []).concat(D.grantsX.years).map(function (y) { return [y, 'שנה: ' + y]; }), D.grantsX.year, 'gyear', true) +
          (HOST() && has('addGrantsYear') && D.grantsX.canEdit !== false ? rbtnH('form:gyear', 'הוספת שנת מענקים', g('plus')) : '') + rbtnH('demo:הקובץ מוכן להורדה (הדגמה)', 'ייצוא לקובץ', G_DOWNLOAD) + rbtnH('demo:הדף נשלח להדפסה (הדגמה)', 'הדפסה', G_PRINT) + '</div>' +
          (st.view === 'give' ? grantsGive() : grantsPay());
      }
    },
    purim: {
      hero: function () { return { slot: 'purim', sub: 'רשימות הכתובות לפי עיר וקבוצה, והסכומים של כל שנה.', stamp: [['יום הפורים', 'קמפיין ' + S.year, 'כתובות'], String(D.summary.purimAddresses), 'כתובות'],
        cta: '<button type="button" class="btn btn-k" data-scr="purim-edit">הזנת סכומים' + g('chev2') + '</button><button type="button" class="lnk" data-scr="pplan"><span>בניית מסלולים אוטומטית</span>' + g('chev') + '</button>' }; },
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
    var years = yearOpts(), h = '', m, b, cats = D.settingsX.categories.length ? D.settingsX.categories : ['שונות'];
    var X = '<button type="button" class="x" data-close aria-label="סגירה">' + g('close') + '</button>';
    function foot(label) { return '<div class="sheet-f"><button type="submit" class="btn">' + label + g('chev2') + '</button><button type="button" class="btn btn-o" data-close>ביטול</button></div>'; }
    if (kind === 'member') {
      m = arg || {};
      var type = D.frames[m.type] ? m.type : (HOST() ? 'ישי״ק' : 'ישי״ג');
      h = '<form data-form="member" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">' + (arg ? 'עדכון פרטים' : 'כרטיס חדש') + '</span>' + (arg ? esc(m.full) : 'בחור חדש') + '</h2><div class="dform">' +
        fldH('שם פרטי', inH('m-first', m.first), '', 'm-first') + fldH('שם משפחה', inH('m-last', m.last), '', 'm-last') + fldH('שם האב', inH('m-father', m.father), '', 'm-father') +
        fldH('טלפון', inH('m-phone', m.phone, 'inputmode="tel" dir="ltr" style="text-align:right"'), '', 'm-phone') + fldH('ישיבה', inH('m-yeshiva', m.yeshiva, 'placeholder="שם הישיבה"'), '', 'm-yeshiva') +
        fldH('מסגרת', '<select id="' + P + 'm-type" data-scrsel="mtype">' + Object.keys(D.frames).map(function (k) { return '<option value="' + esc(k) + '"' + (k === type ? ' selected' : '') + '>' + esc(FW_FULL[k]) + '</option>'; }).join('') + '</select>' + g('down'), '', 'm-type') +
        '<div class="fld" id="' + P + 'm-shiur-f"' + (type === 'חיידר' ? ' hidden' : '') + '><label for="' + P + 'm-shiur">שיעור</label><div class="uin">' + optH('m-shiur', shiurList(D.frames[type], m.shiur), shiurOpt(shiurList(D.frames[type], m.shiur), m.shiur)) + '</div></div>' +
        '<div class="fld"><span class="lb">מצב משפחתי</span>' + segH('m-status', ['רווק', 'נשוי'], m.married ? 'נשוי' : 'רווק') + '</div>' +
        fldH('כתובת', inH('m-addr', m.address || (!HOST() && m.city ? 'רחוב הדוגמה 6, ' + m.city : ''), 'placeholder="רחוב ומספר, עיר"'), 'w2', 'm-addr') + fldH('הערות', inH('m-note', m.notes || '', 'placeholder="לא חובה"'), 'w2', 'm-note') +
        '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot(arg ? 'שמירת השינויים' : 'הוספת הבחור') + '</form>';
    } else if (kind === 'expense') {
      h = '<form data-form="expense" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">הוצאות הקמפיין</span>רישום הוצאה</h2><div class="dform">' +
        fldH('תאריך', inH('e-date', D.settings.todayLabel, 'inputmode="numeric" dir="ltr" style="text-align:right"') + g('calendar'), '', 'e-date') + fldH('שייך לשנת', optH('e-year', years, years[0]), '', 'e-year') +
        fldH('קטגוריה', optH('e-cat', cats, cats[0]), '', 'e-cat') +
        '<div class="fld amt"><label for="' + P + 'e-amt">סכום</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 'e-amt" type="text" inputmode="numeric" placeholder="0" autocomplete="off" style="text-align:left" data-scrin="amt"></div></div>' +
        fldH('פירוט', inH('e-note', '', 'placeholder="על מה ההוצאה"'), 'w2', 'e-note') + '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot('שמירת ההוצאה') + '</form>';
    } else if (kind === 'groom') {
      var gr0 = arg ? arg.r : {};
      h = '<form data-form="groom" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">מקבלי המענק · ' + esc(D.grantsX.year) + '</span>' + (arg ? 'עדכון פרטי חתן' : 'הוספת חתן') + '</h2><div class="dform">' +
        fldH('בחירה מרשימת הבחורים', '<select id="' + P + 'g-pick" data-scrsel="gpick"><option value="">לא מהרשימה</option>' + M.map(function (x) { return '<option value="' + x.id + '">' + esc(x.full) + ' · ' + esc(x.yeshiva) + '</option>'; }).join('') + '</select>' + g('down'), 'w2', 'g-pick') +
        fldH('שם ומשפחה', inH('g-name', gr0.name || ''), '', 'g-name') + fldH('תעודת זהות', inH('g-idn', gr0.idn || '', 'inputmode="numeric" dir="ltr" style="text-align:right"'), '', 'g-idn') +
        fldH('טלפון', inH('g-phone', gr0.phone || '', 'inputmode="tel" dir="ltr" style="text-align:right"'), '', 'g-phone') + fldH('תאריך', inH('g-date', arg ? (gr0.date || '') : D.settings.todayLabel, 'inputmode="numeric" dir="ltr" style="text-align:right"') + g('calendar'), '', 'g-date') +
        '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot(arg ? 'שמירת השינויים' : 'הוספת החתן') + '</form>';
    } else if (kind === 'gyear') {
      h = '<form data-form="gyear" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">מענקים</span>הוספת שנת מענקים</h2><div class="dform">' +
        fldH('שם השנה', inH('gy-name', '', 'placeholder="למשל ' + esc(D.settings.todayHebrewYear) + '"'), 'w2', 'gy-name') + '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div>' +
        '<p class="fnote">אחרי ההוספה אפשר לרשום חתנים ולהגדיר את תכולת המענק של השנה החדשה.</p></div>' + foot('הוספת השנה') + '</form>';
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
    } else if (kind === 'visit') {
      var vr = arg, wt = vr.win ? (vr.win.from ? 'from' : 'to') : '';
      h = '<form data-form="visit" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">' + esc(vr.street) + ' ' + vr.house + ' · דירה ' + vr.apt + '</span>' + esc(vr.family) + ' ' + esc(vr.first) + '</h2><div class="dform">' +
        '<div class="fld amt"><label for="' + P + 'v-stay">דקות בכתובת</label><div class="uin"><input id="' + P + 'v-stay" type="text" inputmode="numeric" value="' + (vr.stay || '') + '" placeholder="' + RT.per + '" autocomplete="off" data-scrin="mins"></div></div>' +
        '<div class="fld"><span class="lb">קומה גבוהה בלי מעלית</span><label class="tog"><input type="checkbox" id="' + P + 'v-stairs"' + (vr.stairs ? ' checked' : '') + '><span class="sw"></span>עוד ' + STAIRS_MIN + ' דקות</label></div>' +
        fldH('מתי אפשר לבוא', '<select id="' + P + 'v-win">' + [['', 'בכל שעה'], ['from', 'רק אחרי שעה מסוימת'], ['to', 'רק עד שעה מסוימת']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === wt ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' + g('down'), '', 'v-win') +
        fldH('השעה', inH('v-time', vr.win ? (vr.win.from || vr.win.to) : '', 'dir="ltr" style="text-align:right" placeholder="12:30"'), '', 'v-time') +
        fldH('הערות', inH('v-note', vr.note, 'placeholder="לא חובה"'), 'w2', 'v-note') + '<p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div>' +
        '<p class="fnote">בלי זמן משלה, הכתובת מקבלת את ברירת המחדל: <b>' + RT.per + ' דקות</b>.</p></div>' + foot('שמירה') + '</form>';
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
  // שיעור שמור שאינו ברשימה הרגילה נשאר אפשרות בטופס, כדי ששמירה לא תשנה אותו בלי כוונה
  function shiurList(opts, sh) { var l = (opts || []).slice(), raw = String(sh || '').replace(/['׳"״\s]/g, ''); if (raw && !shiurOpt(l, sh)) l.push(raw); return l; }
  function shiurOpt(opts, sh) { var i; sh = String(sh || '').replace(/['׳"״\s]/g, ''); for (i = 0; i < (opts || []).length; i++) if (String(opts[i]).replace(/['׳"״\s]/g, '') === sh) return opts[i]; return ''; }
  function formErr(msg) { var e = id('ferr'); if (e) e.textContent = msg; return false; }
  function digits(fid) { var el = id(fid); return el ? parseInt(String(el.value).replace(/[^\d]/g, ''), 10) || 0 : 0; }
  function val(fid) { var el = id(fid); return el ? String(el.value).trim() : ''; }
  function scrSubmit(kind) {
    var X = D.grantsX, amt, name, b;
    var hr;
    if (kind === 'member') {
      if (!val('m-first') || !val('m-last')) return formErr('צריך למלא שם פרטי ושם משפחה');
      if (HOST()) {
        hr = HOST().saveMember({ id: FORM.arg ? FORM.arg.id : null, first: val('m-first'), last: val('m-last'), father: val('m-father'), phone: val('m-phone'), yeshiva: val('m-yeshiva'), type: val('m-type'),
          shiur: id('m-shiur-f').hidden ? '' : val('m-shiur'), married: ($('input[name="' + P + 'm-status"]:checked', id('fsheet')) || {}).value === 'נשוי', address: val('m-addr'), notes: val('m-note') });
        if (!hr || !hr.ok) return formErr((hr && hr.error) || 'הפרטים לא נשמרו. אפשר לנסות שוב');
        closeAll(); return true;
      }
      closeAll(); toast(FORM.arg ? 'הפרטים נשמרו (הדגמה)' : 'הבחור נוסף (הדגמה)', 'userplus');
    } else if (kind === 'expense') {
      amt = digits('e-amt'); if (!amt) return formErr('צריך להזין סכום גדול מאפס');
      if (HOST()) {
        if (val('e-date') && !isDate(val('e-date'))) return formErr('התאריך צריך להיות בצורה יום/חודש/שנה');
        hr = HOST().saveExpense({ amount: amt, date: val('e-date') || D.settings.todayLabel, year: val('e-year'), category: val('e-cat'), description: val('e-note') });
        if (!hr || !hr.ok) return formErr((hr && hr.error) || 'ההוצאה לא נשמרה. אפשר לנסות שוב');
        closeAll(); return true;
      }
      D.transactionsX.expenses.unshift({ date: val('e-date') || D.settings.todayLabel, title: val('e-note') || val('e-cat'), category: val('e-cat'), amount: amt });
      closeAll(); toast('ההוצאה נרשמה: ' + ltr('₪' + num(amt)), 'check'); scrDraw();
    } else if (kind === 'groom' && HOST()) {
      if (val('g-date') && !isDate(val('g-date')) && !(FORM.arg && val('g-date') === String(FORM.arg.r.date || ''))) return formErr('התאריך צריך להיות בצורה יום/חודש/שנה');
      var gd = { name: val('g-name'), idn: val('g-idn'), phone: val('g-phone'), date: val('g-date') };
      hr = FORM.arg ? hcall('updateGroom', FORM.arg.r.rid ? FORM.arg.r.rid : { index: FORM.arg.idx }, gd) : hcall('addGroom', gd);
      if (hr.classic) return true;
      if (!hr.ok) return formErr(hr.error || 'הפרטים לא נשמרו. אפשר לנסות שוב');
      closeAll(); SC.grants.view = 'give'; return true;
    } else if (kind === 'gyear') {
      if (!val('gy-name')) return formErr('צריך להקליד את שם השנה');
      hr = hcall('addGrantsYear', val('gy-name'));
      if (hr.classic) return true;
      if (!hr.ok) return formErr(hr.error || 'השנה לא נוספה');
      closeAll(); return true;
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
    } else if (kind === 'settings' && HOST()) {
      var ga = D.settingsX.giftsAll || [];
      if (!val('s-year')) { id('serr').textContent = 'צריך למלא את שנת הקמפיין'; return false; }
      hr = hcall('saveSettings', { campaignYear: val('s-year'), targets: { 'חיידר': digits('s-t0'), 'ישי״ק': digits('s-t1'), 'ישי״ג': digits('s-t2'), 'קיבוץ': digits('s-t3') },
        gifts: ga.map(function (gf, i) { return { name: val('s-g' + i), threshold: digits('s-gt' + i), enabled: !!(id('s-ge' + i) || {}).checked, image: gf.image || '' }; }), extra: String(id('s-extra').value || '') });
      if (!hr.ok && !hr.classic) id('serr').textContent = hr.error || 'ההגדרות לא נשמרו';
    } else if (kind === 'settings') { toast('היעדים נשמרו (הדגמה)', 'check'); }
    else if (kind === 'plan') { planRead(); scrDraw(); }
    else if (kind === 'visit') {
      var vr = FORM.arg, wt = val('v-win'), tm = val('v-time');
      if (wt && !/^\d{1,2}:\d{2}$/.test(tm)) return formErr('צריך להזין שעה, למשל 12:30');
      vr.stay = digits('v-stay') || 0; vr.stairs = !!id('v-stairs').checked; vr.win = wt ? (wt === 'from' ? { from: tm } : { to: tm }) : null; vr.note = val('v-note');
      closeAll(); SC.purim.better = false; if (SC.purim.plan) SC.purim.plan.res = null; scrDraw(); toast('פרטי הביקור נשמרו', 'check');
    }
    else if (kind === 'cat') {
      name = val('s-cat'); if (!name) return false;
      if (HOST()) { hdo('addCategory', name); return true; }
      D.settingsX.categories.push(name); scrDraw(); toast('הקטגוריה נוספה', 'check');
    }
    return true;
  }

  /* ---------- פעולות ---------- */
  function scrAct(raw, el) {
    var i = raw.indexOf(':'), a = i < 0 ? raw : raw.slice(0, i), v = i < 0 ? '' : raw.slice(i + 1), X, st;
    if (a === 'say') { toast(esc(v), 'check'); return; }
    if (HOST()) {
      st = SC.grants; X = D.grantsX;
      var pv = v.split(':'), hb, hg, hu;
      if (a === 'tx') { if (pv[0] === 'in') HOST().editDeposit(pv.slice(1).join(':')); else HOST().editExpense(pv.slice(1).join(':')); return; }
      if (a === 'sync') { refresh(); return; }
      if (a === 'visit' || a === 'pplan-apply') { toast('זמני הביקור והמסלולים יתחברו יחד עם מיקומי הכתובות', 'info'); return; }
      if (a === 'form' && v === 'credit') { HOST().credit(); return; }
      if (a === 'health') { if (v === 'spell') toast('כתיב של ישיבה מתקנים בעריכת פרטי הבחור', 'info'); else hdo('openHealth', v); return; }
      if (a === 'demo') { hostTool(S.soon, /הדפס/.test((el && (el.getAttribute('aria-label') || el.textContent)) || '')); return; }
      // מענקים
      if (a === 'form' && v === 'groom' && !has('addGroom')) { HOST().classic('grants'); return; }
      if (a === 'groom-edit') { if (has('updateGroom')) openForm('groom', { idx: +v, r: X.recipients[+v] }); else HOST().classic('grants'); return; }
      if (a === 'groom-del') { hg = X.recipients[+v]; if (hg) hdo('removeGroom', hg.rid ? hg.rid : { index: +v }); return; }
      if (a === 'bill') { hb = (X.halves[st.half] || { bills: [] }).bills[+v]; if (hb) hdo('openBill', hb.legacy ? { legacyId: hb.id } : hb.id ? { id: hb.id } : { store: hb.store, half: st.half }); return; }
      if (a === 'bill-new') { hdo('openBill', { half: st.half }); return; }
      if (a === 'legacy') { hb = (X.legacy || [])[+v]; if (hb) hdo('openBill', { legacyId: hb.id }); return; }
      if (a === 'pkg-edit') {
        if (!has('savePackage')) { HOST().classic('grants'); return; }
        if (!st.editPkg) { st.draft = pkgDraft(); st.editPkg = true; scrDraw(); scrollToEl($('.pkg-full', id('scr'))); return; }
        if (st.draft.some(function (p) { return !String(p.store).trim(); })) { toast('צריך לתת שם לכל חנות', 'info'); return; }
        if (hdo('savePackage', st.draft.map(function (p) { return { store: String(p.store).trim(), discount: String(p.discount || '').trim(), items: p.items.filter(function (it) { return String(it.name).trim(); }).map(function (it) { return { name: String(it.name).trim(), qty: numIn(it.qty) || 1, storePrice: numIn(it.storePrice), orgPrice: numIn(it.orgPrice) }; }) }; }))) { st.editPkg = false; st.draft = null; scrDraw(); }
        return;
      }
      if (a === 'pkg-cancel') { st.editPkg = false; st.draft = null; scrDraw(); return; }
      if (a === 'pk-add') { st.draft[+pv[0]].items.push({ name: '', qty: 1, storePrice: '', orgPrice: '' }); scrDraw(); return; }
      if (a === 'pk-rm') { st.draft[+pv[0]].items.splice(+pv[1], 1); scrDraw(); return; }
      if (a === 'pk-store') { st.draft.push({ store: '', discount: '', items: [{ name: '', qty: 1, storePrice: '', orgPrice: '' }] }); scrDraw(); return; }
      if (a === 'pk-rmstore') { st.draft.splice(+pv[0], 1); scrDraw(); return; }
      // כתובות פורים
      if (a === 'purim-edit' && !has('savePurimRows')) { HOST().classic('purim'); return; }
      if (a === 'purim-save') {
        var ch = purimChanges();
        if (!ch.length) { SC.purim.edit = false; scrDraw(); toast('לא בוצעו שינויים', 'info'); return; }
        if (ch.some(function (c) { return !c.sbId; })) { toast('יש כתובת שעוד לא נשמרה בשרת. מרעננים את הנתונים ומנסים שוב', 'info'); return; }
        if (hdo('savePurimRows', ch)) { SC.purim.edit = false; scrDraw(); }
        return;
      }
      // הגדרות
      if (a === 'cat-del') { hdo('removeCategory', D.settingsX.categories[+v]); return; }
      if (a === 'bk-export') { hdo('exportBackup'); return; }
      if (a === 'bk-import') { hdo('importBackup'); return; }
      if (a === 'perm-save') { hu = D.settingsX.users[+v]; if (hu) hdo('saveUserPerms', hu.id, [0, 1, 2, 3, 4].map(function (pi) { var c = $('input[data-scrtog="perm:' + v + ':' + pi + '"]', id('scr')); return !!(c && c.checked); })); return; }
      if (a === 'psum-save') {
        var sums = {};
        $$('input[data-scrin^="psum:"]', id('scr')).forEach(function (inp) { var k = inp.getAttribute('data-scrin').split(':'), gr = D.purimX.groups[+k[1]]; if (gr) (sums[gr.group] = sums[gr.group] || {})[k.slice(2).join(':')] = numIn(inp.value); });
        hdo('savePurimSums', sums); return;
      }
    }
    if (a === 'demo') { toast(esc(v), 'check'); return; }
    if (a === 'form') { openForm(v); return; }
    if (a === 'credit-back') { FORM.step = 1; openForm('credit'); return; }
    if (a === 'gview') { SC.grants.view = v; SC.grants.editPkg = false; if (S.soon !== 'grants') go('grants'); else scrDraw(); if (v === 'pay') scrollToEl($('.scr-bar', id('scr'))); return; }
    if (a === 'half') { SC.grants.half = v; scrDraw(); return; }
    if (a === 'pkg-edit') { st = SC.grants; if (st.editPkg) { D.grantsX.package.forEach(function (p) { p.total = p.items.reduce(function (s, it) { return s + it.value; }, 0); }); toast('תכולת החבילה נשמרה', 'check'); } st.editPkg = !st.editPkg; scrDraw(); return; }
    if (a === 'groom-del') { X = D.grantsX; X.recipients = X.recipients.filter(function (r) { return String(r.n) !== v; }); X.recipients.forEach(function (r, n) { r.n = n + 1; }); scrDraw(); toast('החתן הוסר מהרשימה', 'check'); return; }
    if (a === 'bill') { openForm('bill', D.grantsX.halves[SC.grants.half].bills[+v]); return; }
    if (a === 'city') { SC.purim.city = v; SC.purim.group = 0; SC.purim.edit = false; SC.purim.better = false; if (SC.purim.plan) SC.purim.plan.res = null; scrDraw(); return; }
    if (a === 'group') { SC.purim.group = +v; SC.purim.edit = false; SC.purim.better = false; scrDraw(); return; }
    if (routeAct(a, v)) return;
    if (a === 'purim-edit') { SC.purim.edit = true; scrDraw(); var f = $('.tl-purim input', id('scr')); scrollToEl($('.sums', id('scr'))); if (f) later(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 350); return; }
    if (a === 'purim-save' || a === 'purim-cancel') { SC.purim.edit = false; scrDraw(); if (a === 'purim-save') toast('הסכומים נשמרו', 'check'); return; }
    if (a === 'period') { SC.transactions.period = v; scrDraw(); return; }
    if (a === 'cat') { SC.expenses.open[v] = !SC.expenses.open[v]; scrDraw(); return; }
    if (a === 'cat-del') { D.settingsX.categories.splice(+v, 1); scrDraw(); return; }
    if (a === 'rcheck') { scrollToEl(id('rcheck')); var q = id('rq'); if (q) later(function () { try { q.focus({ preventScroll: true }); } catch (e) {} }, 400); return; }
    if (a === 'rpick') { SC.rules.mid = v; id('rres').innerHTML = rulesResults([], byId(v), 'x'); return; }
    if (a === 'stab') { SC.settings.tab = v; scrDraw(); if (el && el.closest('.hero')) scrollToEl($('.scr-bar', id('scr'))); return; }
  }
  // ייצוא והדפסה של המסך המוצג
  function hostTool(scr, print) {
    var st, X, gr;
    if (scr === 'grants') {
      st = SC.grants; X = D.grantsX;
      if (print) hdo('printReport', 'grants', { year: X.year, view: st.view, recipients: X.recipients, bills: (X.halves[st.half] || { bills: [] }).bills, halfLabel: (X.halves[st.half] || {}).label || '' });
      else hdo('exportGrants', st.view === 'give' ? 'recipients' : 'bills', st.half);
    } else if (scr === 'purim') {
      gr = purimGroupsOf(SC.purim.city)[SC.purim.group]; if (!gr) return;
      hdo(print ? 'printPurimGroup' : 'exportPurimGroup', gr.city, gr.group);
    } else if (scr === 'transactions') { st = SC.transactions.shown; if (st) hdo('printReport', 'transactions', st); }
    else if (scr === 'expenses') { X = D.expensesX; hdo('printReport', 'expenses', { year: SC.expenses.year || X.year, years: X.years, categories: X.categories }); }
    else HOST().classic(scr);
  }
  function bindScreens() {
    root.addEventListener('change', function (e) {
      var t = e.target, a = t.getAttribute && (t.getAttribute('data-scrsel') || t.getAttribute('data-scrtog')), p, m;
      // תשלום לחנות: אמצעי ותאריך מוצגים רק כשמסמנים "שולם"
      if (t.getAttribute && t.getAttribute('data-plan') === 'mode') { planRead(); scrDraw(); return; }
      if (t.name === P + 'b-paid') { $$('.paid-only', id('fsheet')).forEach(function (f) { f.classList.toggle('is-off', t.value !== 'שולם'); }); return; }
      if (!a) return;
      if (a === 'method') { SC.transactions.method = t.value; scrDraw(); }
      else if (a === 'expyear') { SC.expenses.year = t.value; scrDraw(); }
      else if (a === 'gyear') { if (t.value !== D.grantsX.year) { if (HOST() && HOST().setGrantsYear) { SC.grants.editPkg = false; HOST().setGrantsYear(t.value); } else { toast('בהדגמה מוצגת שנת ' + esc(D.grantsX.year) + ' בלבד', 'info'); t.value = D.grantsX.year; } } }
      else if (a === 'allyears') { SC.purim.all = t.checked; scrDraw(); }
      else if (a === 'mtype') { var sh = id('m-shiur'), box = id('m-shiur-f'); box.hidden = t.value === 'חיידר'; sh.innerHTML = D.frames[t.value].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
      else if (a === 'gpick') { m = byId(t.value); if (m) { id('g-name').value = m.full; id('g-phone').value = m.phone; } }
      else if (a.indexOf('perm:') === 0 && !HOST()) { p = a.split(':'); D.settingsX.users[+p[1]].perms[+p[2]] = t.checked ? 1 : 0; }
    });
    root.addEventListener('input', function (e) {
      var t = e.target, a = t.getAttribute && t.getAttribute('data-scrin'), p, d;
      if (!a) return;
      if (a.indexOf('pk:') === 0 || a.indexOf('pki:') === 0) {
        p = a.split(':'); d = SC.grants.draft; if (!d) return;
        if (p[0] === 'pk') { if (d[+p[1]]) d[+p[1]][p[2]] = t.value; }
        else if (d[+p[1]] && d[+p[1]].items[+p[2]]) { if (p[3] !== 'name') t.value = t.value.replace(/[^\d.]/g, ''); d[+p[1]].items[+p[2]][p[3]] = t.value; }
        return;
      }
      if (a === 'rq') { SC.rules.q = t.value; SC.rules.mid = ''; var q = t.value.trim().replace(/[-\s]/g, ''); id('rres').innerHTML = rulesResults(q ? M.filter(function (m) { return (m.full + m.last + m.first + m.yeshiva + m.phone).replace(/[-\s]/g, '').indexOf(q) > -1; }).slice(0, 6) : [], null, q); return; }
      d = t.value.replace(/[^\d]/g, '').slice(0, 6);
      if (a === 'amt') { t.value = d ? num(+d) : ''; var er = id('ferr'); if (er) er.textContent = ''; return; }
      t.value = d; p = a.split(':');
      if (p[0] === 'pkg') D.grantsX.package[+p[1]].items[+p[2]].value = +d || 0;
      else if (p[0] === 'purim') { var st = SC.purim, gr = purimGroupsOf(st.city)[st.group]; gr.rows[+p[1]].amounts[D.purimX.years[D.purimX.years.length - 1]] = +d || 0; }
      else if (p[0] === 'psum') D.purimX.groups[+p[1]].sums[p[2]] = +d || 0;
      else if (p[0] === 'pstay') { var ps = SC.purim, pg = purimGroupsOf(ps.city)[ps.group]; pg.rows[+p[1]].stay = +d || 0; }
    });
  }
