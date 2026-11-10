/* גל זהב · גרסה b1 */
(function () {
  'use strict';
  var P = 'tzb1-';
  var D, root, S, M = [], ACT = [], T = [], tickerT = null, lastFocus = null, mounted = false, RM = false;
  var pendingTick = null, stampN = 0, depMember = null, acIdx = -1, closeT = null;
  var OVS = ['member', 'deposit', 'more', 'form'];

  /* ---------- helpers ---------- */
  function $(s, c) { return (c || root).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); }
  function id(n) { return root.querySelector('#' + P + n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(n) { return Math.round(n).toLocaleString('en-US'); }
  function nis(n) { return '<span dir="ltr">₪' + num(n) + '</span>'; }
  function ltr(s) { return '<span dir="ltr">' + s + '</span>'; }
  function later(fn, ms) { var t = setTimeout(fn, ms); T.push(t); return t; }
  function mono(m) { return m ? esc(String(m.first || '').charAt(0) + '״' + String(m.last || '').charAt(0)) : ''; }
  function HOST() { return window.TZ_HOST || null; }
  function upH(v) { v = +v || 0; return '<span class="up' + (v < 0 ? ' dn' : '') + '" dir="ltr">' + (v < 0 ? '−' : '') + Math.abs(v) + '%</span>'; }
  function pc(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function AE() { var r = root && root.getRootNode ? root.getRootNode() : document; return (r && r.activeElement) || document.activeElement; }
  function giftSlot(gf, i) { return ({ 'טיול': 'tiyul', 'מתנה': 'matana' })[gf.name] || ['tiyul', 'matana'][i % 2]; }
  function yearOpts() { return D.yearOptions && D.yearOptions.length ? D.yearOptions : [D.settings.campaignYear, D.settings.todayHebrewYear, (D.yearly[D.yearly.length - 2] || {}).year].filter(function (y, i, a) { return y && a.indexOf(y) === i; }); }
  function isDate(v) { return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v); }

  var GL = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    out: '<path d="M7 17L17 7M9 7h8v8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    chev: '<path d="M15 5l-7 7 7 7"/>',
    chev2: '<path d="M12 6l-6 6 6 6M19 6l-6 6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checkc: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.8 2.8L16 9.6"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.2-4 4-5.6 7.5-5.6s6.3 1.6 7.5 5.6"/>',
    userplus: '<circle cx="10" cy="8" r="3.6"/><path d="M3 20c1.1-4 3.8-5.6 7-5.6 1.6 0 3 .4 4.2 1.1M18 14v6M15 17h6"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/>',
    list: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    dots: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
    picture: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M3.5 17l5-4.5 3.5 3 3-2.5 5.5 4.5"/>',
    logout: '<path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M14 8l4 4-4 4M18 12H9"/>',
    edit: '<path d="M5 19l1-4L16.5 4.5l3 3L9 18zM14.5 6.5l3 3"/>',
    info: '<path d="M12 7v6M12 16.5h.01"/>'
  };
  function g(n, c) { return '<svg class="g' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + GL[n] + '</svg>'; }
  var BRUSH = '<svg class="brush" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M9,20C30,9,70,13,104,9C138,5,171,7,190,13L184,19L197,24C195,35,198,45,189,51C155,60,118,54,82,57C54,59,28,60,10,53L17,47L4,41C5,34,3,27,9,20ZM0,23h8v2.4h-8zM1,46h9v2h-9zM191,31h9v2.2h-9zM189,7.5h8v1.8h-8zM192,54h6v1.6h-6z"/></svg>';

  /* ---------- image slots ---------- */
  var SLOTS = {};
  function slot(key, mod) {
    var sl = SLOTS[key]; if (!sl) return '';
    var url = D.images && D.images[key];
    var cls = 'ph ph-' + sl.kind + (mod ? ' ' + mod : '');
    if (url) return '<span class="' + cls + ' has-img"><img src="' + esc(url) + '" alt="' + esc(sl.label) + '" decoding="async"></span>';
    var size = sl.w + '×' + sl.h;
    if (sl.kind === 'scene') {
      return '<span class="' + cls + ' is-empty" role="img" aria-label="מקום שמור לתמונה: ' + esc(sl.label) + '"><span class="ph-in"><span class="ph-card">' + g('picture') +
        '<span><b>תמונה: ' + esc(sl.label) + '</b><i>' + ltr(size) + ' · ' + esc(sl.use) + '</i></span></span></span></span>';
    }
    return '<span class="' + cls + ' is-empty" role="img" aria-label="מקום שמור לתמונה: ' + esc(sl.label) + '"><span class="ph-in">' + g('picture') +
      '<u>תמונה</u><b>' + esc(sl.label) + '</b><i dir="ltr">' + size + '</i></span></span>';
  }
  function disc(key, cls) { return '<span class="disc' + (cls ? ' ' + cls : '') + '">' + slot(key) + '</span>'; }

  /* ---------- numbers that count ---------- */
  function animNum(el, to, dur, from) {
    to = +to; if (from == null) from = el._v != null ? el._v : 0;
    el._v = to;
    var run = el._a = (el._a || 0) + 1;
    if (RM || !dur) { el.textContent = num(to); return; }
    var t0 = null;
    function step(ts) {
      if (el._a !== run) return;
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = num(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = num(from);
    requestAnimationFrame(step);
    later(function () { if (el._a === run) el.textContent = num(to); }, dur + 150);
  }
  function syncSum(dur, fromZero) {
    $$('[data-b]').forEach(function (el) { animNum(el, S.sum[el.getAttribute('data-b')], dur, fromZero ? 0 : null); });
    var hb = id('hbar'); if (hb) hb.style.setProperty('--p', S.sum.pct);
    $$('.liq-f').forEach(function (el) { el.parentNode.parentNode.style.setProperty('--lvl', S.sum.pct); });
    $$('[data-bs="pct"]').forEach(function (el) { el.textContent = S.sum.pct + '%'; });
  }
  function play(view, dur) {
    view.classList.remove('play'); void view.offsetWidth; view.classList.add('play');
    $$('[data-b]', view).forEach(function (el) { animNum(el, S.sum[el.getAttribute('data-b')], dur, 0); });
    $$('[data-n]', view).forEach(function (el) { animNum(el, +el.getAttribute('data-n'), Math.min(dur, 1200), 0); });
  }

  /* ---------- toast / tooltip / confetti ---------- */
  function toast(text, glyph) {
    var box = id('toasts'), el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<i>' + g(glyph || 'check') + '</i><span>' + text + '</span>';
    box.appendChild(el);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    later(function () { el.classList.add('out'); later(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320); }, 3200);
  }
  function tipShow(target) {
    var tip = id('tip'), raw = target.getAttribute('data-tip'); if (!raw) return;
    var parts = raw.split('|');
    tip.innerHTML = parts.length > 1 ? '<b>' + esc(parts[0]) + '</b>' + parts.slice(1).map(esc).join('<br>') : esc(raw);
    tip.classList.add('on');
    var r = target.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = Math.max(8, Math.min(window.innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
    var y = r.top - th - 10; if (y < 8) y = r.bottom + 10;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function tipHide() { var tip = id('tip'); if (tip) tip.classList.remove('on'); }
  function confetti(cx, cy) {
    if (RM) return;
    var cv = id('confetti'), W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.hidden = false; cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = ['#CEA130', '#0B0B0B', '#FFFFFF', '#D9B85F', '#D1A03A'], ps = [], i;
    for (i = 0; i < 150; i++) {
      var a = Math.random() * Math.PI * 2, sp = 5 + Math.random() * 13;
      ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 7, w: 6 + Math.random() * 8, h: 10 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - .5) * .5, c: cols[i % cols.length], s: i % 3 === 2 });
    }
    var t0 = null, run = cv._run = (cv._run || 0) + 1;
    function frame(ts) {
      if (cv._run !== run) return;
      if (t0 === null) t0 = ts;
      var el = ts - t0; ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += .34; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - el / 2600);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (.5 + .5 * Math.abs(Math.cos(p.r * 2))));
        if (p.c === '#FFFFFF') { ctx.strokeStyle = 'rgba(11,11,11,.5)'; ctx.lineWidth = 1; ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h * (.5 + .5 * Math.abs(Math.cos(p.r * 2)))); }
        ctx.restore();
      });
      if (el < 2600) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, W, H); cv.hidden = true; }
    }
    requestAnimationFrame(frame);
    later(function () { if (cv._run === run) { cv.hidden = true; } }, 3200);
  }

  /* ---------- header ---------- */
  function renderNav() {
    var inl = '', pop = '';
    D.nav.forEach(function (n, i) {
      var c = i >= 5 ? '' : (i === 4 ? ' n-a5' : i === 3 ? ' n-a4' : i === 2 ? ' n-a3' : '');
      if (i < 5) inl += '<button type="button" class="nav-i' + c + '" data-go="' + n.key + '" data-nav="' + n.key + '">' + BRUSH + esc(n.label) + '</button>';
      var mc = i >= 5 ? '' : (i === 4 ? ' n-m5' : i === 3 ? ' n-m4' : i === 2 ? ' n-m3' : ' n-b');
      if (i >= 2) pop += '<button type="button" class="pop-i' + mc + '" data-go="' + n.key + '" data-nav="' + n.key + '">' + esc(n.label) + '<small>' + esc(n.group) + '</small></button>';
    });
    inl += '<div class="pop-wrap"><button type="button" class="nav-i" id="' + P + 'morebtn" aria-haspopup="true" aria-expanded="false">' + BRUSH + 'עוד' + g('down') + '</button><div class="pop" id="' + P + 'morepop" hidden>' + pop + '</div></div>';
    id('nav').innerHTML = inl;
    var u = D.settings.user;
    id('av').textContent = u.initial; id('uname').textContent = u.name;
    id('userpop').innerHTML = '<div class="pop-h"><b>' + esc(u.name) + '</b>' + esc(u.role) + '</div>' +
      '<button type="button" class="pop-i" data-act="refresh">' + g('refresh') + 'רענון נתונים</button>' +
      (D.nav.some(function (n) { return n.key === 'settings'; }) ? '<button type="button" class="pop-i" data-go="settings">' + g('edit') + 'הגדרות</button>' : '') +
      (HOST() ? '<button type="button" class="pop-i" data-act="classic">' + g('list') + 'המסך הקודם</button>' : '') +
      '<button type="button" class="pop-i" data-act="logout">' + g('logout') + 'התנתקות</button>';
    var years = D.years && D.years.length ? D.years.slice() : D.yearly.map(function (y) { return y.year; }).reverse();
    id('yearpop').innerHTML = '<div class="pop-h"><b>שנת הקמפיין</b>' + (HOST() ? 'מספרי לוח הבקרה מוצגים לפי השנה שנבחרה' : 'כל המספרים מוצגים לפי השנה שנבחרה') + '</div>' +
      (HOST() ? '' : '<button type="button" class="pop-i" data-yr="' + esc(D.settings.todayHebrewYear) + '">' + esc(D.settings.todayHebrewYear) + '<small>שנה חדשה</small></button>') +
      years.map(function (y) { return '<button type="button" class="pop-i' + (y === S.year ? ' is-on' : '') + '" data-yr="' + esc(y) + '">' + esc(y) + (y === D.settings.campaignYear ? '<small>קמפיין נוכחי</small>' : '') + '</button>'; }).join('');
    var tb = [['dashboard', 'grid', 'לוח בקרה'], ['members', 'user', 'בחורים'], ['transactions', 'list', 'תנועות'], ['grants', 'checkc', 'מענקים'], ['more', 'dots', 'עוד']];
    tb = tb.filter(function (t) { return t[0] === 'more' || D.nav.some(function (n) { return n.key === t[0]; }); });
    id('tabbar').innerHTML = tb.map(function (t) {
      return '<button type="button" class="tb" ' + (t[0] === 'more' ? 'data-open="more"' : 'data-go="' + t[0] + '"') + ' data-nav="' + t[0] + '">' + BRUSH + g(t[1]) + '<span>' + t[2] + '</span></button>';
    }).join('');
  }
  function markNav() {
    var cur = S.view === 'soon' ? S.soon : S.view;
    $$('[data-nav]').forEach(function (b) {
      var k = b.getAttribute('data-nav'), on = k === cur;
      if (k === 'more') on = ['dashboard', 'members', 'transactions', 'grants'].indexOf(cur) === -1;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    var mb = id('morebtn');
    if (mb) {
      var idx = D.nav.map(function (n) { return n.key; }).indexOf(cur);
      var w = window.innerWidth, shown = w > 1320 ? 5 : w > 1180 ? 4 : w > 980 ? 3 : 2;
      mb.classList.toggle('is-on', idx >= shown);
    }
  }
  function closePops(except) {
    $$('.pop').forEach(function (p) { if (p !== except) { p.hidden = true; var b = p.parentNode.querySelector('[aria-haspopup]'); if (b) b.setAttribute('aria-expanded', 'false'); } });
  }
  function togglePop(btn, pop) {
    var open = pop.hidden; closePops(pop); pop.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function setYear(y) {
    if (HOST()) { S.year = y; HOST().setYear(y); var hv = $('.view:not([hidden])'); if (hv) play(hv, 1200); toast('מוצגת שנת ' + esc(y), 'calendar'); return; }
    S.year = y;
    $$('[data-year]').forEach(function (el) { el.textContent = y; });
    $$('#' + P + 'yearpop .pop-i').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-yr') === y); });
    renderStamp();
    var v = $('.view:not([hidden])'); if (v) play(v, 1200);
    toast(y === D.settings.campaignYear ? 'מוצג קמפיין ' + y : 'בהדגמה מוצגים נתוני ' + D.settings.campaignYear + ' גם עבור ' + y, 'calendar');
  }

  /* ---------- hero ---------- */
  function stampSVG(lines, big, small, label) {
    var pid = P + 'sp' + (++stampN), n = lines.length, h = '<svg viewBox="0 0 200 200" role="img" aria-label="' + esc(label) + '">' +
      '<circle class="st-dots" cx="100" cy="100" r="95"/><circle class="st-disc" cx="100" cy="100" r="88"/><g class="st-ring">' +
      '<path id="' + pid + '" fill="none" d="M38,100a62,62 0 1,1 124,0a62,62 0 1,1 -124,0"/>';
    lines.forEach(function (t, i) {
      h += '<text class="st-t" dy="5"><textPath href="#' + pid + '" startOffset="' + ((i * 2 + 1) / (n * 2) * 100).toFixed(2) + '%" text-anchor="middle"' + (i % 2 ? ' class="yy"' : '') + '>' + esc(t) + '</textPath></text>';
      var th = Math.PI + (i / n) * Math.PI * 2;
      h += '<circle cx="' + (100 + 66 * Math.cos(th)).toFixed(1) + '" cy="' + (100 + 66 * Math.sin(th)).toFixed(1) + '" r="3.2" fill="#CEA130"/>';
    });
    h += '</g><circle class="st-core" cx="100" cy="100" r="46"/>' +
      '<text class="st-pct" x="100" y="' + (small ? 108 : 112) + '" text-anchor="middle"' + (big.indexOf('%') > -1 ? ' data-bs="pct" direction="ltr"' : '') + '>' + esc(big) + '</text>' +
      (small ? '<text class="st-lab" x="100" y="125" text-anchor="middle">' + esc(small) + '</text>' : '') + '</svg>';
    return h;
  }
  function renderStamp() {
    id('stamp').innerHTML = stampSVG(['קמפיין ' + S.year, 'עזרת חתנים', 'צדקת רבי שמעון'], S.sum.pct + '%', 'מהיעד', 'חותמת הקמפיין: ' + S.sum.pct + '% מהיעד');
  }
  function renderHero() {
    id('heropic').innerHTML = slot('hero');
    id('today').innerHTML = ltr(D.settings.todayLabel);
    id('ftdate').innerHTML = ltr(D.settings.todayLabel);
    var QA = { deposit: g('plus'), member: g('userplus'), expense: g('out'), credit: '<span class="gt" aria-hidden="true">₪</span>', report: g('list'), grants: g('checkc') };
    id('meds').innerHTML = D.quickActions.map(function (q, i) {
      return '<button type="button" class="med a-pop' + (q.key === 'deposit' ? ' med-p' : '') + '" style="--d:' + (.55 + i * .09).toFixed(2) + 's" data-qa="' + q.key + '">' + QA[q.key] + '<b>' + esc(q.label) + '</b><i></i></button>';
    }).join('');
    renderStamp();
  }
  function tickerNext() {
    var ins = ACT.filter(function (a) { return a.type === 'in'; }), el = id('ticker'); if (!el) return;
    if (!ins.length) { el.innerHTML = ''; return; }
    S.tk = ((S.tk == null ? -1 : S.tk) + 1) % ins.length;
    var a = ins[S.tk];
    el.innerHTML = '<span class="live">הפקדה אחרונה</span><span class="tk"><b>' + esc(a.title) + '</b> · ' + ltr('+₪' + num(a.amount)) + ' · ' + esc(a.method || '') + ' · ' + ltr(a.date.slice(0, 5) + (a.time ? ' ' + a.time : '')) + '</span>';
  }

  /* ---------- figures ---------- */
  function renderFigs() {
    var s = S.sum;
    function bub(key, cls, label, n, ctx, d, tip, extra) {
      return '<button type="button" class="bub ' + cls + ' a-pop" style="--d:' + d + 's" data-fig="' + key + '" data-tip="' + esc(tip) + '">' + (extra || '') +
        '<span class="l">' + label + '</span><span class="n" dir="ltr">' + n + '</span><span class="c">' + ctx + '</span></button>';
    }
    var wave = '<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0,10C25,0,25,0,50,10S75,20,100,10S125,0,150,10S175,20,200,10V20H0Z"/></svg>';
    var r1 = bub('collected', 'bub-y', 'נגבה השנה', '₪<span data-b="collected">' + num(s.collected) + '</span>', (s.collectedLastYear ? upH(s.growthPct) + ' מאשתקד' : 'אין נתוני אשתקד'), .6, 'נגבה השנה|אשתקד ₪' + num(s.collectedLastYear) + '|' + s.deposits + ' הפקדות מ-' + s.depositors + ' בחורים') +
      bub('required', 'bub-w', 'יעד כולל', '₪<span data-b="required">' + num(s.required) + '</span>', 'כולל חובות עבר', .68, 'יעד כולל|יעד בסיס ₪' + num(s.baseTarget) + '|+ חובות עבר ₪' + num(s.pastDebt)) +
      bub('missing', 'bub-k', 'חסר להשלמה', '₪<span data-b="missing">' + num(s.missing) + '</span>', '<b><span data-b="left">' + (100 - s.pct) + '</span>%</b> מהיעד', .76, 'חסר להשלמה|' + s.nearEligible + ' בחורים במרחק של עד ₪500') +
      '<span class="bub bub-pic a-pop" style="--d:.84s">' + slot('coins') + '</span>';
    var r2 = bub('met', 'bub-w', 'עמדו ביעד', '<span data-b="met">' + s.metTarget + '</span>', 'מתוך ' + s.withTarget + ' עם יעד', .72, 'עמדו ביעד|' + pc(s.metTarget, s.withTarget) + '% מבעלי היעד|לחיצה מציגה את הרשימה') +
      bub('debt', 'bub-g', 'חובות משנים קודמות', '₪<span data-b="debt">' + num(s.pastDebt) + '</span>', '<b>' + s.debtors + '</b> בחורים', .8, 'חובות משנים קודמות|חוסר ביעד הופך לקנס כפול בשנה הבאה') +
      bub('pct', 'bub-liq', 'אחוז התקדמות', '<span data-b="pct">' + s.pct + '</span>%', s.depositors + ' מפקידים', .88, 'אחוז התקדמות|₪' + num(s.collected) + ' מתוך ₪' + num(s.required), '<span class="liq"><span class="liq-f">' + wave + wave.replace('<svg', '<svg class="w2"') + '</span></span>');
    id('hive').innerHTML = '<div class="hive-r">' + r1 + '</div><div class="hive-r">' + r2 + '</div>';
    $('.bub-liq').style.setProperty('--lvl', s.pct);
    id('split').innerHTML = '<div class="split-bar" style="--c:' + s.cashShare + '" role="img" aria-label="מזומן ' + s.cashShare + '%, אשראי ' + s.creditShare + '%"><i></i><i></i></div>' +
      '<div class="split-leg"><span><b>' + s.cashShare + '%</b> מזומן</span><span>אשראי <b>' + s.creditShare + '%</b></span></div>';
    id('mini').innerHTML = '<span><b data-n="' + s.deposits + '">' + s.deposits + '</b>הפקדות</span><span><b dir="ltr">₪<span data-n="' + s.avgDeposit + '">' + s.avgDeposit + '</span></b>הפקדה ממוצעת</span><span><b data-n="' + s.activeMembers + '">' + s.activeMembers + '</b>בחורים פעילים</span>';
  }

  /* ---------- today: tabs + rows + feed ---------- */
  var TABS = [{ k: 'alerts', l: 'דורש טיפול' }, { k: 'grants', l: 'מענקים' }, { k: 'yeshivas', l: 'ישיבות' }, { k: 'expenses', l: 'הוצאות' }];
  function srow(attrs, dsc, tone, title, detail, i) {
    return '<button type="button" class="srow a" style="--d:' + (i * .05).toFixed(2) + 's" ' + attrs + '><span class="dsc">' + dsc + (tone ? '<u class="t-' + tone + '"></u>' : '') + '</span>' +
      '<span class="tx"><b>' + title + '</b><i>' + detail + '</i></span>' + g('chev') + '</button>';
  }
  function renderTabs() {
    id('tabs').innerHTML = TABS.map(function (t) {
      var on = t.k === S.tab;
      return '<button type="button" class="tab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on + '" data-tab="' + t.k + '">' + BRUSH + esc(t.l) + (t.k === 'alerts' ? '<small>' + D.alerts.length + '</small>' : '') + g('chev2') + '</button>';
    }).join('');
  }
  function renderRows(animate) {
    var h = '', k = S.tab;
    if (k === 'alerts') {
      h = D.alerts.slice(0, 5).map(function (a, i) {
        return srow('data-alert="' + a.key + '"', a.count == null ? g('info') : a.count, a.tone, esc(a.title), esc(a.detail).replace(/₪[\d,]+/g, function (m) { return ltr(m); }), i);
      }).join('') || '<p class="rows-h"><b>הכול מטופל.</b> אין כרגע דבר שדורש טיפול.</p>';
    } else if (k === 'grants') {
      var gr = D.grants;
      h = '<p class="rows-h"><b>' + gr.grooms + ' חתנים</b> קיבלו השנה חבילה בשווי ' + nis(gr.packageValue) + ' · עלות כוללת <b>' + nis(gr.cost) + '</b></p>' +
        gr.stores.map(function (s, i) {
          var p = Math.min(100, pc(s.paid, s.expected));
          return srow('data-go="grants"', p + '<small>%</small>', p === 100 ? 'good' : p === 0 ? 'bad' : 'warn', esc(s.store), esc(s.status) + ' · ' + nis(s.paid) + ' מתוך ' + nis(s.expected), i);
        }).join('');
      if (!gr.grooms && !gr.stores.length) h = '<p class="rows-h"><b>עדיין אין חתנים השנה.</b> כשיירשם חתן ראשון, התשלומים לחנויות יופיעו כאן.</p>';
    } else if (k === 'yeshivas') {
      h = D.yeshivas.map(function (y, i) {
        return srow('data-yeshiva="' + esc(y.name) + '"', y.pct == null ? '–' : y.pct + '<small>%</small>', '', esc(y.name), y.members + ' בחורים · ' + (y.pct == null ? esc(y.note) + ', ללא יעד' : 'נאסף ' + nis(y.collected)), i);
      }).join('') || '<p class="rows-h">עדיין אין נתוני ישיבות להצגה.</p>';
    } else {
      var tot = D.expenseCategories.reduce(function (a, c) { return a + c.amount; }, 0);
      h = '<p class="rows-h">סך ההוצאות השנה <b>' + nis(tot) + '</b> · ללא מענקים</p>' + D.expenseCategories.slice(0, 5).map(function (c, i) {
        return srow('data-go="expenses"', pc(c.amount, tot) + '<small>%</small>', '', esc(c.name), nis(c.amount), i);
      }).join('');
    }
    var box = id('rows'); box.innerHTML = h;
    if (!animate) $$('.a', box).forEach(function (el) { el.classList.remove('a'); });
  }
  function actHTML(a, isNew) {
    var out = a.type === 'out';
    return '<div class="act' + (out ? ' is-out' : '') + (isNew ? ' is-new' : '') + '"><span class="io" aria-hidden="true">' + (out ? '−' : '+') + '</span>' +
      '<span class="tx"><b>' + esc(a.title) + '</b><i>' + (a.method ? esc(a.method) + ' · ' : 'הוצאה · ') + ltr(a.date.slice(0, 5)) + (a.time ? ' · ' + ltr(a.time) : '') + '</i></span>' +
      '<span class="am" dir="ltr">' + (out ? '−' : '+') + '₪' + num(a.amount) + '</span></div>';
  }
  function renderFeed(markNew) {
    id('feed').innerHTML = ACT.slice(0, 6).map(function (a, i) { return actHTML(a, markNew && i === 0); }).join('') || '<p class="rows-h">עדיין אין תנועות השנה.</p>';
  }

  /* ---------- frameworks ---------- */
  var FWSLOT = { 'ישי״ג': 'gedola', 'ישי״ק': 'ktana', 'קיבוץ': 'kibbutz', 'חיידר': 'cheder' };
  function renderFws() {
    var C = 2 * Math.PI * 48;
    id('fwgrid').innerHTML = D.frameworks.map(function (f, i) {
      var pct = f.pct != null ? f.pct : (f.eligible != null ? pc(f.eligible, f.members) : null);
      var ring = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="tr' + (pct == null ? ' dash' : '') + '" cx="50" cy="50" r="48"/>';
      if (pct != null) {
        var a = Math.min(100, pct) / 100 * Math.PI * 2;
        ring += '<circle class="pr" cx="50" cy="50" r="48" style="--len:' + C.toFixed(1) + ';--off:' + (C * (1 - Math.min(100, pct) / 100)).toFixed(1) + ';--i:' + i + '"/>' +
          '<circle class="end" cx="' + (50 + 48 * Math.cos(a)).toFixed(2) + '" cy="' + (50 + 48 * Math.sin(a)).toFixed(2) + '" r="2.6"/>';
      }
      ring += '</svg>';
      var badge = pct != null ? '<span class="fw-pct" dir="ltr">' + pct + '%</span>' : '<span class="fw-pct k">ללא<br>יעד</span>';
      var big, p;
      if (f.pct != null) { big = nis(f.collected) + ' <small>מתוך ' + nis(f.required) + '</small>'; p = f.members + ' בחורים · יעד ' + nis(f.target) + ' לבחור · <b>' + f.met + '</b> עמדו ביעד'; }
      else if (f.eligible != null) { big = f.eligible + ' זכאים <small>מתוך ' + f.members + '</small>'; p = esc(f.note) + ' · ' + f.withDebt + ' עם חוב עבר'; }
      else { big = f.members + ' ילדים <small>רשומים</small>'; p = esc(f.note) + ' · נרשמים כבר עכשיו'; }
      return '<article class="fw a" style="--d:' + (.3 + i * .08).toFixed(2) + 's"><h3>' + esc(f.name) + '<small>' + esc(f.key) + '</small></h3>' +
        '<div class="fw-ring">' + ring + '<span class="disc">' + slot(FWSLOT[f.key]) + '</span>' + badge + '</div>' +
        '<div class="fw-big">' + big + '</div><p>' + p + '</p>' +
        '<button type="button" class="btn btn-s" data-fw="' + esc(f.key) + '">לבחורי ' + esc(f.key) + g('chev2') + '</button></article>';
    }).join('');
  }

  /* ---------- charts ---------- */
  function renderCharts() {
    var mx = Math.max.apply(null, [1].concat(D.monthly.map(function (m) { return Math.max(m.amount, m.lastYear); })));
    var top = D.monthly.reduce(function (a, m) { return m.amount > a.amount ? m : a; }, D.monthly[0]);
    if (!top || !top.amount) top = null;
    id('mch').innerHTML = D.monthly.map(function (m, i) {
      var diff = m.lastYear ? (m.amount - m.lastYear) / m.lastYear * 100 : null;
      return '<div class="mcol' + (m === top ? ' is-top' : '') + '" tabindex="0" data-m="' + esc(m.month) + '" style="--h:' + (m.amount / mx * 100).toFixed(1) + ';--l:' + (m.lastYear / mx * 100).toFixed(1) + ';--i:' + i + '" ' +
        'data-tip="' + esc(m.month + ' ' + S.year) + '|השנה ₪' + num(m.amount) + '|אשתקד ₪' + num(m.lastYear) + (diff == null ? '' : ' (' + (diff >= 0 ? '+' : '−') + Math.abs(diff).toFixed(1) + '%)') + '" aria-label="' + esc(m.month) + ': ' + num(m.amount) + ' שקלים, אשתקד ' + num(m.lastYear) + '">' +
        '<span class="bar"><b dir="ltr">' + (m.amount ? (m.amount / 1000).toFixed(1) : '') + '</b></span><span class="ly"></span></div>';
    }).join('');
    id('mchx').innerHTML = D.monthly.map(function (m) { return '<span' + (m === top ? ' class="on"' : '') + '>' + esc(m.month) + '</span>'; }).join('');
    var avg = D.monthly.reduce(function (a, m) { return a + m.amount; }, 0) / 12;
    id('mchf').innerHTML = (top ? '<span>חודש השיא: <b>' + esc(top.month) + ' · ' + nis(top.amount) + '</b></span>' : '<span>עדיין אין הפקדות בשנה הזאת</span>') + '<span>ממוצע חודשי <b>' + nis(avg) + '</b></span><span>אשתקד בסך הכול <b>' + nis(S.sum.collectedLastYear) + '</b></span>';
    var ymx = Math.max.apply(null, [1].concat(D.yearly.map(function (y) { return Math.max(y.boys + y.purim, y.expenses || 0); })));
    id('ych').innerHTML = D.yearly.map(function (y, i) {
      var tot = y.boys + y.purim;
      return '<div class="ycol" tabindex="0" style="--b:' + (y.boys / ymx * 78).toFixed(1) + ';--p:' + (y.purim / ymx * 78).toFixed(1) + ';--e:' + (y.expenses / ymx * 78 + 1).toFixed(1) + ';--i:' + i + '" ' +
        'data-tip="' + esc(y.year) + '|בחורים ₪' + num(y.boys) + '|פורים ₪' + num(y.purim) + '|סה״כ ₪' + num(tot) + '|הוצאות ₪' + num(y.expenses) + '" aria-label="' + esc(y.year) + ': הכנסות ' + num(tot) + ' שקלים">' +
        '<span class="tot">' + ltr('₪' + Math.round(tot / 1000)) + ' אלף</span><span class="p"></span><span class="b"></span><span class="e"></span></div>';
    }).join('');
    id('ychx').innerHTML = D.yearly.map(function (y) { return '<span' + (y.year === S.year ? ' class="on"' : '') + '>' + esc(y.year) + '</span>'; }).join('');
    var yi = D.yearly.map(function (y) { return y.year; }).indexOf(S.year); if (yi < 0) yi = D.yearly.length - 1;
    var cur = D.yearly[yi] || { year: S.year, boys: 0, purim: 0 }, prev = D.yearly[yi - 1] || null;
    var ct = cur.boys + cur.purim, pt = prev ? prev.boys + prev.purim : 0;
    id('chsum').innerHTML = '<span><b dir="ltr">₪<span data-n="' + ct + '">' + num(ct) + '</span></b>סך ההכנסות ' + esc(cur.year) + '</span>' +
      (pt ? '<span><b>' + upH(((ct - pt) / pt * 100).toFixed(1)) + '</b>מול ' + esc(prev.year) + '</span>' : '') +
      '<span><b dir="ltr">₪<span data-n="' + S.sum.purimThisYear + '">' + num(S.sum.purimThisYear) + '</span></b>פורים · ' + S.sum.purimAddresses + ' כתובות</span>';
  }

  /* ---------- gifts path ---------- */
  function pathY(t) { return 50 + 26 * Math.sin(t * Math.PI * 2.6 + .6); }
  function renderPath() {
    var MAX = Math.max.apply(null, [2500].concat(D.settings.gifts.map(function (gf) { return gf.threshold * 1.15; }))), d = '', i, N = 80;
    for (i = 0; i <= N; i++) { var t = i / N; d += (i ? 'L' : 'M') + ((1 - t) * 1000).toFixed(1) + ',' + (pathY(t) * 3.3).toFixed(1); }
    function pos(t) { return '--x:' + ((1 - t) * 100).toFixed(2) + '%;--yy:' + pathY(t).toFixed(2) + '%'; }
    var h = '<svg class="gp-svg" viewBox="0 0 1000 330" preserveAspectRatio="none" aria-hidden="true"><path class="rd" d="' + d + '"/><path class="ct" d="' + d + '"/></svg>';
    h += '<span class="gp-start a-pop" style="' + pos(.012) + ';--d:.4s"><span><b>₪0</b>יוצאים<br>לדרך</span></span>';
    D.settings.gifts.forEach(function (gf, gi) {
      var t = gf.threshold / MAX, cnt = M.filter(function (m) { return !m.married && m.collected >= gf.threshold; }).length;
      h += '<div class="gp-stop' + (pathY(t) > 50 ? ' up-side' : '') + ' a-pop" style="' + pos(t) + ';--d:' + (.55 + gi * .15) + 's">' + disc(giftSlot(gf, gi)) +
        '<span class="gp-cap"><b>' + esc(gf.name) + '</b><i>מ-' + nis(gf.threshold) + ' · <b>' + cnt + '</b> בחורים כבר שם</i></span></div>';
    });
    D.leaderboard.forEach(function (l, li) {
      var m = byId(l.id), t = Math.min(.985, l.amount / MAX) - (li === 4 ? .012 : 0);
      h += '<button type="button" class="gp-ld a-pop' + (li === 0 ? ' r1' : '') + '" style="' + pos(t) + ';--d:' + (.8 + li * .07).toFixed(2) + 's" data-mid="' + l.id + '" data-tip="' + esc(l.name) + '|מקום ' + l.rank + ' · ₪' + num(l.amount) + '|' + esc(l.yeshiva) + '" aria-label="' + esc(l.name) + ', ' + num(l.amount) + ' שקלים">' + mono(m) + '</button>';
    });
    id('gp').innerHTML = h;
    var road = id('road'); if (road) road.hidden = !D.settings.gifts.length;
  }

  /* ---------- leaders + heat ---------- */
  function renderLead() {
    if (!D.leaderboard.length) { id('lead').innerHTML = disc('gavia', 'a-pop') + '<div class="lead-l"><p class="rows-h">' + (D.can && !D.can.income ? 'הרשימה מוצגת למי שיש לו הרשאת צפייה בהכנסות.' : 'עדיין אין הפקדות השנה. המובילים יופיעו כאן.') + '</p></div>'; return; }
    var mx = D.leaderboard[0].amount;
    id('lead').innerHTML = disc('gavia', 'a-pop') + '<div class="lead-l">' + D.leaderboard.map(function (l, i) {
      var m = byId(l.id);
      return '<button type="button" class="lrow a' + (i === 0 ? ' r1' : '') + '" style="--d:' + (.4 + i * .07).toFixed(2) + 's" data-mid="' + l.id + '" data-tip="' + esc(l.name) + '|' + pc(l.amount, mx) + '% מהמקום הראשון">' +
        '<span class="rk">' + l.rank + '</span><span class="mg">' + mono(m) + '</span><span class="tx"><b>' + esc(l.name) + '</b><i>' + esc(l.yeshiva) + ' · ' + esc(l.frame) + '</i></span><span class="am" dir="ltr">₪' + num(l.amount) + '</span></button>';
    }).join('') + '</div>';
  }
  function renderHeat() {
    var W = D.heatmap.weeks, vals = [], h = '', mh = '<span></span>', MN = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
    W.forEach(function (w) { w.forEach(function (d) { if (d.amount) vals.push(d.amount); }); });
    vals.sort(function (a, b) { return a - b; });
    function q(p) { return vals[Math.floor(vals.length * p)]; }
    var q1 = q(.38), q2 = q(.68), q3 = q(.9), best = null, active = 0, lastM = -1;
    h += D.heatmap.dayNames.map(function (n) { return '<span class="heat-d">' + n + '</span>'; }).join('');
    W.forEach(function (w, wi) {
      var mo = +w[0].date.slice(3, 5) - 1;
      mh += '<span>' + (mo !== lastM ? MN[mo] : '') + '</span>'; lastM = mo;
      w.forEach(function (d) {
        var lv = !d.amount ? 0 : d.amount <= q1 ? 1 : d.amount <= q2 ? 2 : d.amount <= q3 ? 3 : 4;
        if (d.amount) { active++; if (!best || d.amount > best.amount) best = d; }
        h += '<span class="hc' + (d.dow === 6 ? ' sh7' : lv ? ' l' + lv : '') + '" style="--i:' + (wi + d.dow) + '" data-tip="' + (d.dow === 6 ? 'שבת · ' + d.date + '|אין הפקדות בשבת' : d.date + '|' + (d.amount ? '₪' + num(d.amount) + ' · ' + d.count + ' הפקדות' : 'ללא הפקדות')) + '"></span>';
      });
    });
    id('heat').innerHTML = '<div class="heat-m" aria-hidden="true">' + mh + '</div><div class="heat-g" role="img" aria-label="מפת הפקדות יומית ל-26 השבועות האחרונים">' + h + '</div>' +
      '<div class="heat-f"><span>' + (best ? 'יום השיא: <b>' + ltr(best.date) + ' · ' + nis(best.amount) + '</b> · <b>' + active + '</b> ימים עם הפקדות' : 'אין הפקדות ב-26 השבועות האחרונים') + '</span>' +
      '<span class="heat-k">פחות <i class="hc"></i><i class="hc l1"></i><i class="hc l2"></i><i class="hc l3"></i><i class="hc l4"></i> יותר</span></div>';
  }

  /* ---------- members ---------- */
  function byId(mid) { for (var i = 0; i < M.length; i++) if (M[i].id === mid) return M[i]; return null; }
  function recompute(m) {
    m.required = m.base + m.debt; m.gap = Math.max(0, m.required - m.collected); m.hasTarget = m.required > 0;
    m.pct = m.hasTarget ? Math.min(100, Math.round(m.collected / m.required * 100)) : null;
    m.status = D.statusOf(m);
    m.gifts = D.settings.gifts.map(function (gf) { return { name: gf.name, threshold: gf.threshold, earned: m.collected >= gf.threshold, missing: Math.max(0, gf.threshold - m.collected) }; });
  }
  function uniq(k) { var o = {}, r = []; M.forEach(function (m) { if (m[k] && !o[m[k]] && (S.married || !m.married)) { o[m[k]] = 1; r.push(m[k]); } }); return r.sort(function (a, b) { return String(a).localeCompare(String(b), 'he'); }); }
  function renderFilters() {
    id('filt').innerHTML = D.statusFilters.map(function (f) {
      var on = f.key === S.filter;
      return '<button type="button" class="ftab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on + '" data-filter="' + f.key + '">' + BRUSH + esc(f.label) + '<small>' + f.count + '</small></button>';
    }).join('');
    function sel(key, label, opts) {
      return '<span class="sel' + (S[key] ? ' is-set' : '') + '"><select aria-label="' + label + '" data-sel="' + key + '"><option value="">' + label + ': הכול</option>' +
        opts.map(function (o) { return '<option' + (S[key] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' + g('down') + '</span>';
    }
    id('filt2').innerHTML = sel('yeshiva', 'ישיבה', uniq('yeshiva')) + sel('city', 'עיר', uniq('city')) + sel('type', 'מסגרת', uniq('type')) +
      '<label class="tog"><input type="checkbox" id="' + P + 'married"' + (S.married ? ' checked' : '') + '><span class="sw"></span>הצג נשואים</label>' +
      '<span class="sp" id="' + P + 'shown"></span>';
    var H = [['', ''], ['name', 'בחור'], ['yeshiva', 'ישיבה ושיעור'], ['collected', 'נאסף מתוך נדרש'], ['gap', 'פער'], ['pct', 'התקדמות'], ['status', 'סטטוס'], ['', '']];
    id('mlh').innerHTML = H.map(function (c, i) {
      if (!c[0]) return '<span class="h' + i + '"></span>';
      var on = S.sort.k === c[0];
      return '<button type="button" class="h' + i + (on ? ' is-on' : '') + (on && S.sort.d < 0 ? ' is-desc' : '') + '" data-sort="' + c[0] + '" aria-label="מיון לפי ' + c[1] + '">' + c[1] + g('up') + '</button>';
    }).join('');
  }
  function filtered() {
    var q = S.q.trim().replace(/[-\s]/g, '');
    var list = M.filter(function (m) {
      if (m.married && !S.married) return false;
      if (S.filter === 'near') { if (!m.near) return false; }
      else if (S.filter !== 'all' && m.status.key !== S.filter) return false;
      if (S.yeshiva && m.yeshiva !== S.yeshiva) return false;
      if (S.city && m.city !== S.city) return false;
      if (S.type && m.type !== S.type) return false;
      if (q) { var hay = (m.full + m.last + m.first + m.yeshiva + m.phone + m.city + (m.father || '')).replace(/[-\s]/g, ''); if (hay.indexOf(q) === -1) return false; }
      return true;
    });
    var k = S.sort.k, d = S.sort.d;
    if (k) list.sort(function (a, b) {
      var x, y;
      if (k === 'name') { x = a.last + a.first; y = b.last + b.first; return x.localeCompare(y, 'he') * d; }
      if (k === 'yeshiva') return (a.yeshiva + a.frame).localeCompare(b.yeshiva + b.frame, 'he') * d;
      if (k === 'status') return a.status.label.localeCompare(b.status.label, 'he') * d;
      x = a[k] == null ? -1 : a[k]; y = b[k] == null ? -1 : b[k]; return (x - y) * d;
    });
    return list;
  }
  function membersSubtitle() {
    var f = D.statusFilters.filter(function (x) { return x.key === S.filter; })[0], parts = [];
    if (f && S.filter !== 'all') parts.push(f.label);
    if (S.yeshiva) parts.push(S.yeshiva); if (S.city) parts.push(S.city); if (S.type) parts.push(S.type);
    if (S.q.trim()) parts.push('חיפוש: ' + S.q.trim());
    return parts.join(' · ');
  }
  function rowHTML(m, i) {
    var st = m.status, mc = st.tone === 'good' ? ' s-good' : st.tone === 'idle' ? ' s-idle' : st.tone === 'bad' ? ' s-bad' : '';
    var gap = !m.hasTarget ? '<b>—</b>' : m.gap === 0 ? '<b class="z">הושלם</b>' : '<b>חסר ' + nis(m.gap) + '</b>';
    var pb = m.hasTarget ? '<span class="pbar' + (m.pct >= 100 ? ' full' : '') + '" style="--p:' + m.pct + '"><i></i></span><span dir="ltr">' + m.pct + '%</span>' : '<span class="pbar none"></span><span>—</span>';
    return '<button type="button" class="mrow a" style="--d:' + (Math.min(i, 12) * .028 + .22).toFixed(3) + 's" data-mid="' + m.id + '" aria-label="' + esc(m.full) + ', ' + esc(st.label) + '. פתיחת כרטיס">' +
      '<span class="mg' + mc + '">' + mono(m) + '</span>' +
      '<span class="c c1"><b>' + esc(m.first) + ' ' + esc(m.last) + '</b><i>' + (m.father ? 'בן ' + esc(m.father) : (m.married ? 'נשוי' : '')) + '</i></span>' +
      '<span class="c c2"><b>' + esc(m.yeshiva || 'ללא ישיבה') + '</b><i>' + esc(m.frame) + (m.city ? ' · ' + esc(m.city) : '') + '</i></span>' +
      '<span class="c c3"><b>' + nis(m.collected) + (m.hasTarget ? ' <small>מתוך ' + nis(m.required) + '</small>' : '') + '</b>' +
      (m.debt > 0 ? '<i class="dbt">כולל חוב ' + nis(m.debt) + '</i>' : '<i>' + (m.base ? 'יעד בסיס ' + nis(m.base) : 'ללא יעד שנתי') + '</i>') + '</span>' +
      '<span class="c c4">' + gap + '</span><span class="prog">' + pb + '</span>' +
      '<span class="tag t-' + st.tone + '">' + esc(st.label) + '</span>' + g('chev') + '</button>';
  }
  function renderList(animate) {
    var list = filtered(), box = id('mll');
    if (!list.length) {
      box.innerHTML = '<div class="empty">' + disc('empty') + '<b>לא נמצאו בחורים</b><i>אפשר לנסות חיפוש אחר או לנקות את הסינון</i><button type="button" class="btn" data-act="clearfilters">ניקוי הסינון' + g('chev2') + '</button></div>';
    } else box.innerHTML = list.map(rowHTML).join('');
    if (!animate) $$('.a', box).forEach(function (el) { el.classList.remove('a'); });
    var all = M.filter(function (m) { return S.married || !m.married; }).length;
    var sh = id('shown'); if (sh) sh.innerHTML = 'מוצגים <b>' + list.length + '</b> מתוך ' + all + (HOST() ? '' : ' בדוגמה');
    id('qn').textContent = list.length + ' תוצאות';
    id('mlfoot').textContent = !list.length ? '' : HOST() ? 'סוף הרשימה · ' + list.length + ' בחורים' : 'סוף הרשימה לדוגמה · במערכת המלאה ' + S.sum.activeMembers + ' בחורים';
  }

  /* ---------- member sheet ---------- */
  function openMember(m) {
    if (!m) return;
    S.member = m.id;
    var st = m.status, hist = D.historyOf(m), i;
    var scale = Math.max.apply(null, [2300, m.required * 1.12, m.collected * 1.06].concat(m.gifts.map(function (gf) { return gf.threshold * 1.1; })));
    var canEdit = !HOST() || (D.can && D.can.edit);
    var tags = '<span class="tag t-' + st.tone + '">' + esc(st.label) + '</span>';
    m.gifts.forEach(function (gf) { tags += gf.earned ? '<span class="tag t-gift">זכאי ל' + esc(gf.name) + '</span>' : '<span class="tag t-idle">חסר ' + nis(gf.missing) + ' ל' + esc(gf.name) + '</span>'; });
    var ms = m.gifts.map(function (gf, gi) {
      return '<span class="ms' + (gf.earned ? ' got' : '') + '" style="--x:' + (gf.threshold / scale * 100).toFixed(1) + '">' + disc(giftSlot(gf, gi)) + '<span><b>' + esc(gf.name) + '</b>' + ltr('₪' + num(gf.threshold)) + '</span></span>';
    }).join('');
    var eq = '<span class="coin w" style="--i:0"><i>יעד בסיס</i><b>' + nis(m.base) + '</b></span><span class="op">+</span>' +
      '<span class="coin' + (m.debt ? ' r' : '') + '" style="--i:1"><i>חוב עבר (קנס)</i><b>' + nis(m.debt) + '</b></span><span class="op">=</span>' +
      '<span class="coin y" style="--i:2"><i>סה״כ נדרש</i><b>' + nis(m.required) + '</b></span><span class="op">›</span>' +
      '<span class="coin k" style="--i:3"><i>פער</i><b>' + nis(m.gap) + '</b></span>';
    var why = '';
    if (m.debt > 0) {
      why = '<p class="why"><b>למה נדרש ' + nis(m.required) + '?</b> יעד בסיס ' + nis(m.base) + ' + קנס ' + nis(m.debt) + ' = נדרש ' + nis(m.required) + '. בשנה הקודמת חסרו ' + nis(m.debt / 2) + ' ליעד, והחוסר עובר לשנה הבאה כקנס כפול.</p>';
    } else if (!m.hasTarget) {
      why = '<p class="why"><b>ללא יעד שנתי.</b> ' + (m.type === 'חיידר' ? 'בחיידר עדיין לא בגיל הזכאות.' : m.type === 'קיבוץ' ? 'בקיבוץ הזכאות נשמרת למי שאין לו חוב עבר.' : m.married ? 'נשוי, אינו משתתף בקמפיין.' : 'לא הוגדר לו יעד לשנה הזאת.') + '</p>';
    } else if (m.gap === 0) {
      why = '<p class="why"><b>עמד ביעד.</b> נאסף ' + nis(m.collected) + ' מתוך ' + nis(m.required) + ', והוא זכאי למענק חתן.</p>';
    } else {
      why = '<p class="why"><b>עוד ' + nis(m.gap) + ' ליעד.</b> מה שלא יושלם עד סוף השנה יעבור לשנה הבאה כקנס כפול (' + nis(m.gap * 2) + ').</p>';
    }
    var deps = m.deposits.length ? '<div class="dl">' + m.deposits.map(function (d) {
      var inner = '<span class="io" aria-hidden="true">+</span><span>' + ltr(d.date) + '<i>' + esc(d.method) + ' · ' + esc(d.year) + (d.note ? ' · ' + esc(d.note) : '') + '</i></span><b dir="ltr">₪' + num(d.amount) + '</b>';
      return HOST() && canEdit && d.id != null ? '<button type="button" class="drow drow-b" data-act="dep-edit" data-did="' + esc(d.id) + '" aria-label="עריכת ההפקדה">' + inner + '</button>' : '<div class="drow">' + inner + '</div>';
    }).join('') + '</div>' : '<div class="nodep">' + disc('empty') + '<span><b>' + (HOST() ? 'עדיין אין הפקדות' : 'עדיין אין הפקדות השנה') + '</b><i>ההפקדה הראשונה תופיע כאן</i></span></div>';
    var hh = hist.length ? '<div class="hist">' + hist.map(function (h, hi) {
      return '<div class="hrow' + (hi === hist.length - 1 ? ' now' : '') + '"><span class="yr2">' + esc(h.year) + '</span><span class="tx"><b>' + esc(h.frame) + '</b>' +
        '<i>יעד ' + nis(h.target) + (h.required !== h.target ? ' · נדרש ' + nis(h.required) : '') + ' · נאסף ' + nis(h.collected) + '</i>' +
        '<span class="tag t-' + h.tone + '">' + esc(h.status).replace(/₪[\d,]+/g, function (x) { return ltr(x); }) + '</span></span></div>';
    }).join('') + '</div>' : '<p class="why">' + (m.type === 'חיידר' ? 'אין היסטוריית זכאות: בחיידר עדיין לא בגיל הזכאות.' : 'אין עדיין היסטוריית זכאות.') + '</p>';
    id('sheet').innerHTML = '<button type="button" class="x" data-close aria-label="סגירת הכרטיס">' + g('close') + '</button><div class="sheet-s">' +
      '<div class="mh"><span class="mg' + (st.tone === 'good' ? ' s-good' : '') + '">' + mono(m) + '</span><div><h2>' + esc(m.full) + '</h2>' +
      '<p>' + (m.father ? 'בן ' + esc(m.father) + ' · ' : '') + '<b>' + esc(m.yeshiva || 'ללא ישיבה') + '</b> · ' + esc(m.frame) + (m.married ? ' · נשוי' : '') + '</p><div class="mh-tags">' + tags + '</div></div></div>' +
      '<div class="m-grid"><div class="m-col">' +
        '<div class="m-box"><div class="m-big"><span class="n" dir="ltr"><small>₪</small><span data-n="' + m.collected + '">' + num(m.collected) + '</span></span>' +
          '<span class="l">נאסף השנה' + (m.hasTarget ? '<br><b>' + m.pct + '%</b> מתוך ' + nis(m.required) : '<br><b>ללא יעד</b>') + '</span></div>' +
          '<div class="trk" style="--p:' + Math.min(100, m.collected / scale * 100).toFixed(1) + '" role="img" aria-label="התקדמות ואבני דרך למתנות"><i></i>' +
          (m.hasTarget ? '<span class="rq" style="--x:' + (m.required / scale * 100).toFixed(1) + '" data-tip="סה״כ נדרש|₪' + num(m.required) + '"></span>' : '') + ms + '</div></div>' +
        '<div class="m-box"><h4>איך מחושב הנדרש</h4><div class="eq">' + eq + '</div>' + why + '</div>' +
      '</div><div class="m-col">' +
        '<div class="m-box"><h4>פרטי קשר</h4><dl class="info"><div><dt>טלפון</dt><dd dir="ltr">' + esc(m.phone || '—') + '</dd></div><div><dt>כתובת</dt><dd>' + esc(m.address || '—') + '</dd></div>' + (m.notes ? '<div><dt>הערות</dt><dd>' + esc(m.notes) + '</dd></div>' : '') + '</dl></div>' +
        '<div class="m-box"><h4>' + (HOST() ? 'הפקדות' : 'הפקדות השנה') + ' (' + m.deposits.length + ')</h4>' + deps + '</div>' +
        '<div class="m-box"><h4>היסטוריית זכאות</h4>' + hh + '</div>' +
      '</div></div></div>' +
      (canEdit ? '<div class="sheet-f"><button type="button" class="btn" data-act="dep-for" data-mid="' + m.id + '">רישום הפקדה' + g('chev2') + '</button>' +
      '<button type="button" class="btn btn-o" data-act="edit">' + g('edit') + 'עריכת פרטים</button></div>' : '');
    showOv('member');
    $$('[data-n]', id('sheet')).forEach(function (el) { animNum(el, +el.getAttribute('data-n'), 700, 0); });
  }

  /* ---------- deposit ---------- */
  function depFormHTML() {
    var years = yearOpts();
    return '<h2><span class="lt">קופת הקמפיין</span>רישום הפקדה</h2><form class="dform" id="' + P + 'dform" novalidate>' +
      '<div class="fld"><label for="' + P + 'f-date">תאריך</label><div class="uin"><input id="' + P + 'f-date" type="text" inputmode="numeric" value="' + D.settings.todayLabel + '" dir="ltr" style="text-align:right">' + g('calendar') + '</div></div>' +
      '<div class="fld"><label for="' + P + 'f-year">שייך לשנת</label><div class="uin"><select id="' + P + 'f-year">' + years.map(function (y) { return '<option>' + esc(y) + '</option>'; }).join('') + '</select>' + g('down') + '</div></div>' +
      '<div class="fld w2" id="' + P + 'fld-m"><label for="' + P + 'f-member">בחור</label><div class="uin"><input id="' + P + 'f-member" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + P + 'ac" placeholder="מקלידים שם או ישיבה" autocomplete="off">' + g('search') + '</div><div class="ac" id="' + P + 'ac" role="listbox" hidden></div></div>' +
      '<div class="fld"><span class="lb" id="' + P + 'lb-method">אמצעי</span><div class="seg" role="radiogroup" aria-labelledby="' + P + 'lb-method">' +
        '<label><input type="radio" name="' + P + 'method" value="מזומן" checked>' + BRUSH + '<span>מזומן</span></label><label><input type="radio" name="' + P + 'method" value="אשראי">' + BRUSH + '<span>אשראי</span></label></div></div>' +
      '<div class="fld amt" id="' + P + 'fld-a"><label for="' + P + 'f-amt">סכום</label><div class="uin" dir="ltr"><span class="pre">₪</span><input id="' + P + 'f-amt" type="text" inputmode="numeric" placeholder="0" autocomplete="off" style="text-align:left"></div></div>' +
      '<div class="fld w2"><label for="' + P + 'f-note">הערות</label><div class="uin"><input id="' + P + 'f-note" type="text" placeholder="לא חובה" autocomplete="off"></div></div>' +
      '<p class="err fld w2" id="' + P + 'err" role="alert"></p>' +
      '<button type="submit" class="btn fld w2">שמירת ההפקדה' + g('chev2') + '</button></form>';
  }
  function openDeposit(opts) {
    opts = opts || {};
    id('depkupa').innerHTML = slot('kupa');
    id('depin').innerHTML = depFormHTML();
    id('dep').classList.remove('is-ok');
    depMember = opts.member || null;
    if (depMember) id('f-member').value = depMember.full + ' · ' + depMember.yeshiva;
    if (opts.amount) id('f-amt').value = opts.amount;
    showOv('deposit');
    var f = depMember ? id('f-amt') : id('f-member');
    later(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function acRender() {
    var inp = id('f-member'), box = id('ac'), q = inp.value.trim();
    if (!q || (depMember && inp.value === depMember.full + ' · ' + depMember.yeshiva)) { box.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
    var res = M.filter(function (m) { return (m.full + ' ' + m.last + ' ' + m.first + ' ' + m.yeshiva + ' ' + m.last + ' ' + m.first).indexOf(q) > -1; }).slice(0, 6);
    acIdx = res.length ? 0 : -1;
    box.innerHTML = res.length ? res.map(function (m, i) {
      return '<button type="button" role="option" class="' + (i === 0 ? 'is-cur' : '') + '" data-pick="' + m.id + '"><span class="mg">' + mono(m) + '</span><b>' + esc(m.full) + '</b><i>' + esc(m.yeshiva) + ' · ' + esc(m.frame) + '</i></button>';
    }).join('') : '<button type="button" disabled><i style="margin:0">לא נמצא בחור בשם הזה</i></button>';
    box.hidden = false; inp.setAttribute('aria-expanded', 'true');
  }
  function acPick(m) {
    depMember = m; id('f-member').value = m.full + ' · ' + m.yeshiva; id('ac').hidden = true;
    id('fld-m').classList.remove('is-err'); id('err').textContent = '';
    try { id('f-amt').focus({ preventScroll: true }); } catch (e) {}
  }
  function saveDeposit() {
    var amt = parseInt(String(id('f-amt').value).replace(/[^\d]/g, ''), 10) || 0, err = id('err');
    id('fld-m').classList.toggle('is-err', !depMember); id('fld-a').classList.toggle('is-err', !(amt > 0));
    if (!depMember) { err.textContent = 'צריך לבחור בחור מהרשימה'; id('f-member').focus(); return; }
    if (!(amt > 0)) { err.textContent = 'צריך להקליד סכום גדול מאפס'; id('f-amt').focus(); return; }
    var m = depMember, method = ($('input[name="' + P + 'method"]:checked') || {}).value || 'מזומן';
    var date = String(id('f-date').value || '').trim() || D.settings.todayLabel, year = id('f-year').value;
    if (!isDate(date)) { err.textContent = 'התאריך צריך להיות בצורה יום/חודש/שנה, למשל ' + D.settings.todayLabel; id('f-date').focus(); return; }
    var before = { collected: S.sum.collected, missing: S.sum.missing, pct: S.sum.pct };
    if (HOST()) {
      var res = HOST().saveDeposit({ memberId: m.id, amount: amt, method: method, date: date, year: year, note: String(id('f-note').value || '').trim() });
      if (!res || !res.ok) { err.textContent = (res && res.error) || 'ההפקדה לא נשמרה. אפשר לנסות שוב'; return; }
      m = byId(m.id) || m;
    } else {
      var closes = Math.min(amt, m.gap);
      m.collected += amt; m.deposits.unshift({ date: date, amount: amt, method: method, year: year }); recompute(m);
      S.sum.collected += amt; S.sum.missing = Math.max(0, S.sum.missing - closes);
      S.sum.pct = Math.round(S.sum.collected / S.sum.required * 100); S.sum.left = 100 - S.sum.pct; S.sum.deposits += 1;
      if (m.status.key === 'ok' && closes > 0 && m.gap === 0) S.sum.met += 1;
      ACT.unshift({ type: 'in', title: m.full, method: method, date: date, time: 'עכשיו', amount: amt });
      var sv = id('saved'); sv.classList.add('is-busy'); sv.lastElementChild.textContent = 'שומר…';
      later(function () { sv.classList.remove('is-busy'); sv.lastElementChild.textContent = 'נשמר'; }, 900);
    }
    pendingTick = before; S.lastDep = m.id;
    id('dep').classList.add('is-ok');
    id('depkupa').innerHTML = '';
    id('depin').innerHTML = '<div class="ok">' + disc('kupa') + '<h2>ההפקדה נשמרה</h2><span class="n" dir="ltr">+₪' + num(amt) + '</span>' +
      '<p><b>' + esc(m.full) + '</b> · ' + esc(method) + ' · ' + ltr(date) + '</p><p>' + (m.hasTarget ? (m.gap === 0 ? 'היעד הושלם. כל הכבוד!' : 'נשארו לו ' + nis(m.gap) + ' ליעד') : 'נוסף לקופת הקמפיין') + '</p>' +
      '<div class="ok-b"><button type="button" class="btn btn-o" data-act="dep-again">הפקדה נוספת</button><button type="button" class="btn" data-close>ללוח הבקרה' + g('chev2') + '</button></div></div>';
    var r = id('dep').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height * .36);
    if (!HOST()) toast('ההפקדה נשמרה · ' + ltr('+₪' + num(amt)));
    renderFeed(true); S.tk = -1; tickerNext();
    if (S.view === 'members') renderList(false);
    var b = $('.ok-b .btn[data-close]'); if (b) later(function () { try { b.focus({ preventScroll: true }); } catch (e) {} }, 80);
    clearTimeout(closeT); closeT = later(function () { if (!id('ov-deposit').hidden && id('dep').classList.contains('is-ok')) closeAll(); }, 3400);
  }
  function applyTick() {
    if (!pendingTick) return; pendingTick = null;
    if (S.view === 'dashboard') {
      try { window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
      later(function () {
        syncSum(1400, false); renderStamp();
        $$('.bub[data-fig="collected"],.bub[data-fig="missing"],.bub[data-fig="pct"]').forEach(function (b) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); });
        var hn = $('.h-num'); if (hn && !RM) { hn.style.animation = 'tzb1-bump .8s var(--spring)'; later(function () { hn.style.animation = ''; }, 900); }
      }, 250);
    } else {
      syncSum(0, false); renderStamp();
      var row = $('.mrow[data-mid="' + S.lastDep + '"]'); if (row) { row.classList.add('is-new'); try { row.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); } catch (e) {} }
    }
  }

  /*@@SCREENS@@*/

  /* ---------- overlays ---------- */
  function showOv(name) {
    OVS.forEach(function (n) { if (n !== name) id('ov-' + n).hidden = true; });
    if (!lastFocus && AE() && root.contains(AE())) lastFocus = AE();
    var ov = id('ov-' + name);
    ov.hidden = false; closePops(); tipHide();
    var f = $('[data-close]:not(.ov-bg), button, input', ov);
    if (name !== 'deposit' && f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function anyOv() { return OVS.some(function (n) { return !id('ov-' + n).hidden; }); }
  function closeAll() {
    var was = anyOv();
    OVS.forEach(function (n) { id('ov-' + n).hidden = true; });
    closePops(); tipHide(); clearTimeout(closeT);
    if (was && lastFocus && root.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    lastFocus = null;
    if (was) applyTick();
  }
  function openMore() {
    var cur = S.view === 'soon' ? S.soon : S.view, u = D.settings.user;
    id('more').innerHTML = '<button type="button" class="x" data-close aria-label="סגירה">' + g('close') + '</button><h2>עוד</h2><div class="more-g">' +
      D.nav.map(function (n) { return '<button type="button" class="' + (n.key === cur ? 'is-on' : '') + '" data-go="' + n.key + '">' + esc(n.label) + '</button>'; }).join('') +
      '<button type="button" data-act="refresh">' + g('refresh') + 'רענון נתונים</button><button type="button" data-act="yearmenu">' + g('calendar') + 'שנת ' + esc(S.year) + '</button>' +
      (HOST() ? '<button type="button" data-act="classic">' + g('list') + 'המסך הקודם</button>' : '') + '</div>' +
      '<div class="more-u"><span class="av">' + esc(u.initial) + '</span><span><b>' + esc(u.name) + '</b><i>' + esc(u.role) + ' · נשמר</i></span><button type="button" class="btn btn-s btn-k" data-act="logout">התנתקות</button></div>';
    showOv('more');
  }

  /* ---------- navigation ---------- */
  function go(view) {
    if (!mounted) return false;
    var real = view === 'dashboard' || view === 'members';
    if (!real && !renderScreen(view)) return false;
    closeAll();
    S.view = real ? view : 'soon'; S.soon = real ? null : view;
    if (HOST() && HOST().onGo) HOST().onGo(view);
    $$('.view').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== S.view; });
    if (view === 'members') { renderFilters(); renderList(true); }
    markNav();
    try { window.scrollTo(0, 0); } catch (e) {}
    var v = $('.view:not([hidden])'); play(v, view === 'dashboard' ? 1500 : 700);
    return true;
  }
  function open(what) {
    if (!mounted) return false;
    if (what == null) { closeAll(); return true; }
    if (what === 'member') { openMember(byId(S.member || 'm4') || M[0]); return true; }
    if (what === 'deposit' && HOST() && D.can && !D.can.edit) { toast('אין לך הרשאת עריכה', 'info'); return true; }
    if (what === 'deposit') { openDeposit(); return true; }
    if (what === 'more') { openMore(); return true; }
    return false;
  }
  function goMembers(patch) {
    S.filter = 'all'; S.q = ''; S.yeshiva = ''; S.city = ''; S.type = '';
    for (var k in patch) S[k] = patch[k];
    var q = id('q'); if (q) q.value = S.q;
    go('members');
  }
  function refresh() {
    var b = id('refresh'); b.classList.remove('is-spin'); void b.offsetWidth; b.classList.add('is-spin');
    if (HOST()) { HOST().refresh(function (ok) { var hv = $('.view:not([hidden])'); if (ok && hv) play(hv, 1200); if (ok) toast('הנתונים עודכנו', 'refresh'); }); return; }
    var v = $('.view:not([hidden])'); if (v) play(v, 1200);
    toast('הנתונים עודכנו', 'refresh');
  }

  /* ---------- events ---------- */
  function onClick(e) {
    var t = e.target, el;
    if (!(el = t.closest('.pop-wrap'))) closePops();
    if ((el = t.closest('#' + P + 'yearbtn'))) { togglePop(el, id('yearpop')); return; }
    if ((el = t.closest('#' + P + 'userbtn'))) { togglePop(el, id('userpop')); return; }
    if ((el = t.closest('#' + P + 'morebtn'))) { togglePop(el, id('morepop')); return; }
    if ((el = t.closest('#' + P + 'refresh'))) { refresh(); return; }
    if ((el = t.closest('[data-yr]'))) { closePops(); setYear(el.getAttribute('data-yr')); return; }
    if ((el = t.closest('[data-pick]'))) { acPick(byId(el.getAttribute('data-pick'))); return; }
    if ((el = t.closest('[data-scr]'))) { scrAct(el.getAttribute('data-scr'), el); return; }
    if ((el = t.closest('[data-close]'))) { closeAll(); return; }
    if ((el = t.closest('[data-act]'))) { act(el.getAttribute('data-act'), el); return; }
    if ((el = t.closest('[data-go]'))) { closePops(); go(el.getAttribute('data-go')); return; }
    if ((el = t.closest('[data-open]'))) { open(el.getAttribute('data-open')); return; }
    if ((el = t.closest('[data-qa]'))) { qa(el.getAttribute('data-qa')); return; }
    if ((el = t.closest('[data-fig]'))) { fig(el.getAttribute('data-fig')); return; }
    if ((el = t.closest('[data-alert]'))) { alertGo(el.getAttribute('data-alert')); return; }
    if ((el = t.closest('[data-yeshiva]'))) { goMembers({ yeshiva: el.getAttribute('data-yeshiva') }); return; }
    if ((el = t.closest('[data-fw]'))) { goMembers({ type: el.getAttribute('data-fw') }); return; }
    if ((el = t.closest('[data-tab]'))) { S.tab = el.getAttribute('data-tab'); renderTabs(); renderRows(true); return; }
    if ((el = t.closest('[data-filter]'))) { S.filter = el.getAttribute('data-filter'); renderFilters(); renderList(true); return; }
    if ((el = t.closest('[data-sort]'))) { var k = el.getAttribute('data-sort'); S.sort = { k: k, d: S.sort.k === k ? -S.sort.d : (k === 'name' || k === 'yeshiva' || k === 'status' ? 1 : -1) }; renderFilters(); renderList(false); return; }
    if ((el = t.closest('[data-mid]'))) { openMember(byId(el.getAttribute('data-mid'))); return; }
  }
  function act(a, el) {
    if (a === 'refresh') { closeAll(); refresh(); }
    else if (a === 'logout') { closeAll(); if (HOST()) HOST().logout(); else toast('בהדגמה אין התנתקות אמיתית', 'logout'); }
    else if (a === 'export') { if (HOST()) hdo('exportMembers', filtered().map(function (m) { return m.id; })); else toast('הקובץ מוכן להורדה (הדגמה)', 'check'); }
    else if (a === 'print') { if (HOST()) hdo('printMembers', filtered().map(function (m) { return m.id; }), membersSubtitle()); else toast('הרשימה נשלחה להדפסה (הדגמה)', 'check'); }
    else if (a === 'dep-edit') { HOST().editDeposit(el.getAttribute('data-did')); }
    else if (a === 'classic') { closeAll(); HOST().classic(S.view === 'soon' ? S.soon : S.view, S.soon === 'settings' ? SC.settings.tab : null); }
    else if (a === 'newmember') openForm('member');
    else if (a === 'edit') openForm('member', byId(el.getAttribute('data-mid')) || byId(S.member));
    else if (a === 'clearfilters') { S.filter = 'all'; S.q = ''; S.yeshiva = ''; S.city = ''; S.type = ''; id('q').value = ''; renderFilters(); renderList(true); }
    else if (a === 'dep-for') { var m = byId(el.getAttribute('data-mid')); id('ov-member').hidden = true; openDeposit({ member: m }); }
    else if (a === 'dep-again') { clearTimeout(closeT); openDeposit(); }
    else if (a === 'yearmenu') { closeAll(); later(function () { togglePop(id('yearbtn'), id('yearpop')); }, 30); }
  }
  function qa(k) {
    if (k === 'deposit') openDeposit();
    else if (k === 'member') openForm('member');
    else if (k === 'expense') openForm('expense');
    else if (k === 'credit') { if (HOST()) HOST().credit(); else openForm('credit'); }
    else if (k === 'report') go('transactions');
    else if (k === 'grants') go('grants');
  }
  function scrollToEl(el) { if (el) { var y = el.getBoundingClientRect().top + window.pageYOffset - 60; try { window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, y); } } }
  function fig(k) {
    if (k === 'collected') scrollToEl(id('charts'));
    else if (k === 'required' || k === 'pct') scrollToEl(id('fws'));
    else if (k === 'missing') goMembers({ filter: 'near' });
    else if (k === 'met') goMembers({ filter: 'ok' });
    else if (k === 'debt') goMembers({ filter: 'debt' });
  }
  function alertGo(k) {
    if (k === 'near') goMembers({ filter: 'near' });
    else if (k === 'debt') goMembers({ filter: 'debt' });
    else if (k === 'idle') goMembers({ filter: 'none' });
    else if (k === 'details') { SC.settings.tab = 'health'; go('settings'); }
    else if (k === 'newyear') go('settings');
  }
  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === 'Escape') {
      var ac = id('ac');
      if (ac && !ac.hidden) { ac.hidden = true; return; }
      if (anyOv() || $$('.pop').some(function (p) { return !p.hidden; })) { closeAll(); e.preventDefault(); }
      return;
    }
    if (e.key === 'Tab') {
      var ov = OVS.map(function (n) { return id('ov-' + n); }).filter(function (o) { return !o.hidden; })[0];
      if (!ov) return;
      var f = $$('button:not([disabled]),input,select,[tabindex="0"]', ov).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && AE() === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && AE() === last) { first.focus(); e.preventDefault(); }
      else if (!ov.contains(AE())) { first.focus(); e.preventDefault(); }
    }
  }
  function bind() {
    root.addEventListener('click', onClick);
    root.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target.id === P + 'dform') saveDeposit();
      else if (e.target.getAttribute('data-form')) scrSubmit(e.target.getAttribute('data-form'), e.target);
      else if (e.target.id === P + 'qd') { var v = parseInt(String(id('qdamt').value).replace(/[^\d]/g, ''), 10) || ''; openDeposit({ amount: v }); }
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === P + 'q') { S.q = t.value; renderList(false); }
      else if (t.id === P + 'f-member') { depMember = null; acRender(); }
      else if (t.id === P + 'f-amt' || t.id === P + 'qdamt') { var d = t.value.replace(/[^\d]/g, '').slice(0, 6); t.value = d ? num(+d) : ''; if (t.id === P + 'f-amt') { id('fld-a').classList.remove('is-err'); id('err').textContent = ''; } }
    });
    root.addEventListener('change', function (e) {
      var t = e.target, k = t.getAttribute && t.getAttribute('data-sel');
      if (k) { S[k] = t.value; renderFilters(); renderList(true); }
      else if (t.id === P + 'married') { S.married = t.checked; if (HOST()) { renderFilters(); renderList(true); } else if (t.checked) toast('בנתוני ההדגמה אין בחורים נשואים', 'info'); }
    });
    root.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t.id === P + 'f-member') {
        var box = id('ac'), items = $$('[data-pick]', box);
        if (box.hidden || !items.length) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { acIdx = (acIdx + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length; items.forEach(function (b, i) { b.classList.toggle('is-cur', i === acIdx); }); e.preventDefault(); }
        else if (e.key === 'Enter' && acIdx > -1) { acPick(byId(items[acIdx].getAttribute('data-pick'))); e.preventDefault(); }
      } else if ((e.key === 'Enter' || e.key === ' ') && t.classList && (t.classList.contains('mcol') || t.classList.contains('ycol'))) { tipShow(t); e.preventDefault(); }
    });
    root.addEventListener('mouseover', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el) tipShow(el); });
    root.addEventListener('mouseout', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el && !el.contains(e.relatedTarget)) tipHide(); });
    root.addEventListener('focusin', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el && el.matches(':focus-visible')) tipShow(el); });
    root.addEventListener('focusout', tipHide);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', function () { if (root && !root.hidden) tipHide(); }, { passive: true });
    window.addEventListener('resize', function () { if (root && !root.hidden && mounted) markNav(); });
  }

  /* ---------- lifecycle ---------- */
  function sumOf(s) { return { collected: s.collected, missing: s.missing, pct: s.progressPct, left: 100 - s.progressPct, required: s.required, met: s.metTarget, debt: s.pastDebt, deposits: s.deposits, depositors: s.depositors, metTarget: s.metTarget, withTarget: s.withTarget, pastDebt: s.pastDebt, debtors: s.debtors, nearEligible: s.nearEligible, growthPct: s.growthPct, collectedLastYear: s.collectedLastYear, baseTarget: s.baseTarget, cashShare: s.cashShare, creditShare: s.creditShare, avgDeposit: s.avgDeposit, activeMembers: s.activeMembers, purimThisYear: s.purimThisYear, purimAddresses: s.purimAddresses }; }
  function loadData(first) {
    D = window.TZ_DATA; SLOTS = {};
    D.imageSlots.forEach(function (s) { SLOTS[s.key] = s; });
    var s = D.summary;
    M = D.members.map(function (m) { var c = {}, k; for (k in m) c[k] = m[k]; c.deposits = m.deposits.map(function (d) { return { id: d.id, date: d.date, amount: d.amount, method: d.method, year: d.year, note: d.note }; }); return c; });
    ACT = D.activity.slice();
    if (first) S = { view: 'dashboard', soon: null, year: D.settings.campaignYear, tab: 'alerts', filter: 'all', q: '', yeshiva: '', city: '', type: '', married: false, sort: { k: '', d: 1 }, member: null, sum: null };
    S.sum = sumOf(s);
    if (HOST()) {
      if (HOST().year) S.year = HOST().year() || S.year;
      var e1 = id('msample'); if (e1) e1.hidden = true;
      var e2 = id('ftnote'); if (e2) e2.textContent = 'מערכת הניהול';
      root.classList.toggle('no-edit', !(D.can && D.can.edit)); root.classList.add('is-live');
    }
    var e3 = id('mact'); if (e3) e3.textContent = num(s.activeMembers);
    $$('[data-year]').forEach(function (el) { el.textContent = S.year; });
  }
  /* נתונים חדשים מהמערכת: טוענים מחדש ומציירים את מה שמוצג, בלי לאבד את המקום */
  function update() {
    if (!mounted) return false;
    loadData(false);
    renderNav(); renderHero(); renderFigs(); renderTabs(); renderRows(false); renderFeed(false); renderFws(); renderCharts(); renderPath(); renderLead(); renderHeat();
    syncSum(0, false);
    S.tk = -1; tickerNext();
    if (S.view === 'members') { renderFilters(); renderList(false); }
    else if (S.view === 'soon') {
      if (!navOf(S.soon)) { go('dashboard'); }
      else { var ae = AE(), scr = id('scr'); if (!(ae && scr && scr.contains(ae) && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName))) { scrDraw(); } }
    }
    markNav();
    return true;
  }
  function mount(r) {
    if (mounted) return;
    root = r; D = window.TZ_DATA;
    RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    loadData(true);
    mounted = true;
    renderNav(); renderHero(); renderFigs(); renderTabs(); renderRows(true); renderFeed(false); renderFws(); renderCharts(); renderPath(); renderLead(); renderHeat();
    id('qdkupa').innerHTML = slot('kupa');
    renderFilters(); renderList(true);
    tickerNext(); markNav(); bind(); bindScreens();
  }
  function show() {
    if (!mounted) return;
    if (!HOST()) document.body.style.background = API.pageBg;
    RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var v = $('.view:not([hidden])'); if (v) play(v, S.view === 'dashboard' ? 1500 : 700);
    clearInterval(tickerT); tickerT = setInterval(tickerNext, 4200);
  }
  function hide() {
    clearInterval(tickerT); tickerT = null;
    T.forEach(clearTimeout); T = [];
    if (mounted) { OVS.forEach(function (n) { id('ov-' + n).hidden = true; }); closePops(); tipHide(); var cv = id('confetti'); cv._run = (cv._run || 0) + 1; cv.hidden = true; }
  }

  var API = {
    name: 'גל זהב',
    tagline: 'אתר בית שמח וגדול: גלים צהובים, מדליונים עגולים, חותמת מסתובבת ותמונות ענק',
    pageBg: '#FFFFFF',
    mount: mount, show: show, hide: hide, go: go, open: open, update: update,
    toast: function (t, gl) { if (mounted) toast(esc(t), gl); }, openMember: function (mid) { var m = byId(mid); if (m) openMember(m); return !!m; },
    view: function () { return mounted ? (S.view === 'soon' ? S.soon : S.view) : null; }, closeAll: function () { if (mounted) closeAll(); },
    setTheme: function () { return false; }
  };
  window.TZ_DIRS = window.TZ_DIRS || {};
  window.TZ_DIRS.b1 = API;
})();
