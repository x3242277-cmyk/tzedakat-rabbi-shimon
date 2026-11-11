/* נבנה אוטומטית מ-redesign/b1 על ידי redesign/shared/build.js --site. לא לערוך כאן: עורכים במקור ובונים מחדש. */
window.TZ_BODY="<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\" focusable=\"false\">\n  <defs>\n    <linearGradient id=\"tzb1-g1\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#D2AA40\"/><stop offset=\".5\" stop-color=\"#CEA130\"/><stop offset=\"1\" stop-color=\"#D1A03A\"/></linearGradient>\n    <linearGradient id=\"tzb1-g2\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#CEA130\"/><stop offset=\"1\" stop-color=\"#D4AE49\"/></linearGradient>\n  </defs>\n</svg>\n\n<header class=\"hd\" id=\"tzb1-hd\">\n  <svg class=\"hd-swoosh\" viewBox=\"0 0 1440 46\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path d=\"M0,0H1440V20C1396,48 1340,26 1268,9C1232,1 1200,0 1164,0Z\"/></svg>\n  <div class=\"hd-bar\">\n    <div class=\"hd-corner\" aria-hidden=\"true\"><svg viewBox=\"0 0 560 108\" preserveAspectRatio=\"none\"><path fill=\"url(#tzb1-g2)\" d=\"M0,0H560C506,6 486,44 428,62C356,84 270,66 184,74C108,81 52,90 0,108Z\"/></svg></div>\n    <button type=\"button\" class=\"brand\" data-go=\"dashboard\" aria-label=\"צדקת רבי שמעון, מעבר ללוח הבקרה\">\n      <span class=\"seal\" role=\"img\" aria-label=\"סמל צדקת רבי שמעון\"></span>\n      <span class=\"brand-t\"><b>צדקת רבי שמעון</b><i>עזרת חתנים</i></span>\n    </button>\n    <nav class=\"nav\" id=\"tzb1-nav\" aria-label=\"ניווט ראשי\"></nav>\n    <div class=\"hd-tools\">\n      <span class=\"saved\" id=\"tzb1-saved\" role=\"status\"><i></i><span>נשמר</span></span>\n      <button type=\"button\" class=\"ibtn\" id=\"tzb1-refresh\" aria-label=\"רענון נתונים\" data-tip=\"רענון נתונים\"><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5\"/></svg></button>\n      <div class=\"pop-wrap\">\n        <button type=\"button\" class=\"yr\" id=\"tzb1-yearbtn\" aria-haspopup=\"true\" aria-expanded=\"false\" aria-label=\"בחירת שנת קמפיין\"><span data-year>תשפ״ו</span><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 9l6 6 6-6\"/></svg></button>\n        <div class=\"pop\" id=\"tzb1-yearpop\" hidden></div>\n      </div>\n      <div class=\"pop-wrap\">\n        <button type=\"button\" class=\"chip\" id=\"tzb1-userbtn\" aria-haspopup=\"true\" aria-expanded=\"false\" aria-label=\"תפריט משתמש\"><i class=\"av\" id=\"tzb1-av\">מ</i><span id=\"tzb1-uname\">מנהל המערכת</span><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 9l6 6 6-6\"/></svg></button>\n        <div class=\"pop\" id=\"tzb1-userpop\" hidden></div>\n      </div>\n    </div>\n  </div>\n</header>\n\n<main id=\"tzb1-main\" tabindex=\"-1\">\n\n  <!-- ================= לוח בקרה ================= -->\n  <section class=\"view\" data-view=\"dashboard\" aria-label=\"לוח בקרה\">\n\n    <div class=\"band hero\">\n      <div class=\"hero-pic\" id=\"tzb1-heropic\"></div>\n      <div class=\"hero-tint\"></div>\n      <div class=\"hero-wave-in\" aria-hidden=\"true\">\n        <svg class=\"hero-wave hero-wave--b\" viewBox=\"0 0 800 640\" preserveAspectRatio=\"none\"><path fill=\"#D1A83C\" d=\"M800,0L190,0C70,80-20,220,40,350C90,460,230,480,180,570C160,605,132,628,120,640L800,640Z\"/></svg>\n        <svg class=\"hero-wave hero-wave--f\" viewBox=\"0 0 800 640\" preserveAspectRatio=\"none\"><path fill=\"url(#tzb1-g1)\" d=\"M800,0L262,0C150,70,62,200,112,330C152,440,300,470,252,560C232,600,204,626,192,640L800,640Z\"/></svg>\n      </div>\n      <svg class=\"hero-mw\" viewBox=\"0 0 390 100\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path fill=\"#D7B253\" opacity=\".6\" d=\"M0,100V30C70,70,150,0,240,26C310,46,350,20,390,40V100Z\"/><path fill=\"#D1A83C\" d=\"M0,100V58C80,20,150,84,240,54C310,32,350,60,390,44V100Z\"/></svg>\n      <div class=\"wrap hero-in\">\n        <div class=\"hero-txt\">\n          <p class=\"eyebrow ld a\" style=\"--d:.15s\">קמפיין <b data-year>תשפ״ו</b> · <span id=\"tzb1-today\"></span></p>\n          <h1 id=\"tzb1-h1\">\n            <span class=\"h-num a\" style=\"--d:.25s\" dir=\"ltr\"><small>₪</small><span data-b=\"collected\">148,650</span></span>\n            <span class=\"h-txt a\" style=\"--d:.38s\">נאספו השנה</span>\n          </h1>\n          <p class=\"h-sub a\" style=\"--d:.5s\"><b><span data-b=\"pct\">57</span>%</b> מהיעד · חסר <span dir=\"ltr\">₪<span data-b=\"missing\">121,300</span></span></p>\n          <div class=\"h-bar a\" style=\"--d:.58s;--p:57\" id=\"tzb1-hbar\" role=\"img\" aria-label=\"התקדמות לקראת היעד\"><i></i></div>\n          <div class=\"h-cta a\" style=\"--d:.7s\">\n            <button type=\"button\" class=\"btn btn-k\" data-open=\"deposit\">רישום הפקדה<svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 6l-6 6 6 6M19 6l-6 6 6 6\"/></svg></button>\n            <button type=\"button\" class=\"lnk\" data-go=\"members\"><span>לרשימת הבחורים</span><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M15 5l-7 7 7 7\"/></svg></button>\n          </div>\n          <div class=\"ticker a\" style=\"--d:.85s\" id=\"tzb1-ticker\" aria-live=\"off\"></div>\n        </div>\n        <div class=\"meds\" id=\"tzb1-meds\" aria-label=\"פעולות מהירות\"></div>\n      </div>\n      <div class=\"stamp\" id=\"tzb1-stamp\" aria-hidden=\"true\"></div>\n      <svg class=\"edge edge-b hero-bot\" viewBox=\"0 0 1440 120\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path class=\"w2\" d=\"M0,120V44C240,104,420,24,700,62C980,100,1180,58,1440,92V120Z\"/><path d=\"M0,120V70C180,22,360,98,620,86C900,72,1100,8,1440,56V120Z\"/></svg>\n    </div>\n\n    <!-- ששת המספרים -->\n    <div class=\"band figs\">\n      <div class=\"wrap figs-grid\">\n        <div class=\"figs-side\">\n          <div class=\"sh a\" style=\"--d:.5s\"><span class=\"dot\"></span><h2><span class=\"lt\">ששת המספרים</span>של קמפיין <span data-year>תשפ״ו</span></h2><p>לחיצה על מטבע פותחת את הרשימה או הגרף שמאחוריו.</p></div>\n          <div class=\"a\" style=\"--d:.65s\">\n            <div class=\"split\" id=\"tzb1-split\"></div>\n            <div class=\"mini\" id=\"tzb1-mini\"></div>\n          </div>\n        </div>\n        <div class=\"hive\" id=\"tzb1-hive\"></div>\n      </div>\n    </div>\n\n    <!-- דורש טיפול + פעילות -->\n    <div class=\"band today\" id=\"tzb1-today-band\">\n      <svg class=\"rib rib-b\" viewBox=\"0 0 1000 700\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path fill=\"#D7B253\" d=\"M0,30C220,-10,440,70,660,22C820,-12,950,20,978,130C1010,300,950,430,990,570C1010,660,900,712,760,690C520,650,260,712,0,668Z\"/></svg>\n      <svg class=\"rib\" viewBox=\"0 0 1000 700\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path fill=\"url(#tzb1-g1)\" d=\"M0,56C200,0,420,86,640,40C800,6,930,30,962,140C1000,300,938,420,978,560C1000,650,900,700,760,672C520,624,260,700,0,642Z\"/></svg>\n      <div class=\"wrap today-grid\">\n        <div class=\"today-side\">\n          <div class=\"sh\"><span class=\"dot\"></span><h2><span class=\"lt\">אנחנו על זה.</span>מה דורש טיפול?</h2></div>\n          <div class=\"tabs\" id=\"tzb1-tabs\" role=\"tablist\" aria-label=\"נושאים\"></div>\n        </div>\n        <div class=\"rows\" id=\"tzb1-rows\" role=\"tabpanel\"></div>\n        <aside class=\"feed\" aria-label=\"פעילות אחרונה\">\n          <div class=\"feed-h\"><h3><span class=\"lt\">מה קרה לאחרונה</span>פעילות אחרונה</h3><span class=\"tag t-good\">מתעדכן</span></div>\n          <div id=\"tzb1-feed\"></div>\n          <div class=\"feed-f\"><button type=\"button\" class=\"lnk\" data-go=\"transactions\"><span>לדו״ח התנועות המלא</span><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M15 5l-7 7 7 7\"/></svg></button></div>\n        </aside>\n      </div>\n    </div>\n\n    <!-- מסגרות -->\n    <div class=\"band fws\" id=\"tzb1-fws\">\n      <div class=\"wrap\">\n        <div class=\"sh sh-c\"><span class=\"dot\"></span><h2><span class=\"lt\">איפה כל אחד עומד</span>ההתקדמות לפי מסגרת</h2></div>\n        <div class=\"fw-grid\" id=\"tzb1-fwgrid\"></div>\n      </div>\n    </div>\n\n    <!-- גרפים -->\n    <div class=\"band band-y charts\" id=\"tzb1-charts\">\n      <svg class=\"edge edge-t\" viewBox=\"0 0 1440 110\" preserveAspectRatio=\"none\" height=\"110\" aria-hidden=\"true\"><path d=\"M0,0H1440V38C1200,112,960,8,700,50C440,92,220,104,0,30Z\"/></svg>\n      <span class=\"blob\" style=\"width:520px;height:520px;left:-160px;top:120px\"></span>\n      <span class=\"blob\" style=\"width:300px;height:300px;right:8%;bottom:-60px\"></span>\n      <div class=\"wrap\">\n        <div class=\"ch-top\">\n          <div class=\"sh ld\"><span class=\"dot\"></span><h2><span class=\"lt\">כמה נכנס, ומתי</span>ההכנסות לאורך הזמן</h2></div>\n          <div class=\"ch-sum\" id=\"tzb1-chsum\"></div>\n        </div>\n        <div class=\"ch-grid\">\n          <div class=\"panel\">\n            <div class=\"panel-h\">\n              <h3><span class=\"lt\">גבייה מבחורים</span>לפי חודש עברי · <span data-year>תשפ״ו</span></h3>\n              <div class=\"leg\"><span><i class=\"k1\"></i>השנה (אלפי ₪)</span><span><i class=\"k3\"></i>אשתקד</span></div>\n            </div>\n            <div class=\"mch\" id=\"tzb1-mch\"></div>\n            <div class=\"mch-x\" id=\"tzb1-mchx\" aria-hidden=\"true\"></div>\n            <div class=\"panel-f\" id=\"tzb1-mchf\"></div>\n          </div>\n          <div class=\"orb\">\n            <h3><span class=\"lt\">הכנסות לפי שנה</span>בחורים ופורים</h3>\n            <div class=\"ych\" id=\"tzb1-ych\"></div>\n            <div class=\"ych-x\" id=\"tzb1-ychx\" aria-hidden=\"true\"></div>\n            <div class=\"leg\"><span><i class=\"k1\"></i>בחורים</span><span><i class=\"k2\"></i>פורים</span><span><i class=\"k3\"></i>הוצאות</span></div>\n          </div>\n        </div>\n      </div>\n      <svg class=\"edge edge-b\" viewBox=\"0 0 1440 110\" preserveAspectRatio=\"none\" height=\"110\" aria-hidden=\"true\"><path d=\"M0,110H1440V52C1180,2,980,94,720,62C460,30,240,2,0,62Z\"/></svg>\n    </div>\n\n    <!-- מסלול המתנות -->\n    <div class=\"band road\" id=\"tzb1-road\">\n      <div class=\"wrap\">\n        <div class=\"sh ld\"><span class=\"dot\"></span><h2><span class=\"lt\">בדרך אל</span>המתנות של השנה</h2></div>\n        <div class=\"gp\" id=\"tzb1-gp\"></div>\n      </div>\n    </div>\n\n    <!-- מובילים + לוח הפקדות -->\n    <div class=\"band road2\">\n      <div class=\"wrap r2-grid\">\n        <div>\n          <div class=\"sh\"><span class=\"dot\"></span><h2><span class=\"lt\">כל הכבוד להם</span>מובילי הגבייה</h2></div>\n          <div class=\"lead\" id=\"tzb1-lead\"></div>\n        </div>\n        <div>\n          <div class=\"sh\"><span class=\"dot\"></span><h2><span class=\"lt\">26 השבועות האחרונים</span>לוח ההפקדות</h2></div>\n          <div class=\"heat\" id=\"tzb1-heat\"></div>\n        </div>\n      </div>\n    </div>\n\n    <!-- הפקדה מהירה -->\n    <div class=\"band band-y qd\">\n      <svg class=\"edge edge-t\" viewBox=\"0 0 1440 110\" preserveAspectRatio=\"none\" height=\"110\" aria-hidden=\"true\"><path d=\"M0,0H1440V30C1210,96,930,14,690,54C450,94,210,100,0,40Z\"/></svg>\n      <span class=\"blob\" style=\"width:420px;height:420px;right:-120px;top:60px\"></span>\n      <div class=\"wrap qd-grid\">\n        <div class=\"qd-l\">\n          <div class=\"sh ld\"><span class=\"dot\"></span><h2><span class=\"lt\">הגיע בחור עם מעטפה?</span>רושמים הפקדה בחצי דקה</h2></div>\n          <p>מקלידים סכום, בוחרים בחור, והמספרים בלוח הבקרה מתעדכנים מיד.</p>\n        </div>\n        <form class=\"qd-orb\" id=\"tzb1-qd\" novalidate>\n          <span class=\"qd-kupa\"><span class=\"disc\" id=\"tzb1-qdkupa\"></span></span>\n          <h3><span class=\"lt\">כמה הופקד?</span>סכום ההפקדה</h3>\n          <label class=\"uin\"><span class=\"pre\">₪</span><input type=\"text\" inputmode=\"numeric\" id=\"tzb1-qdamt\" placeholder=\"300\" aria-label=\"סכום ההפקדה בשקלים\" autocomplete=\"off\" dir=\"ltr\"></label>\n          <button type=\"submit\" class=\"btn\">המשך לרישום<svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 6l-6 6 6 6M19 6l-6 6 6 6\"/></svg></button>\n        </form>\n      </div>\n    </div>\n  </section>\n\n  <!-- ================= בחורים ================= -->\n  <section class=\"view\" data-view=\"members\" aria-label=\"בחורים\" hidden>\n    <div class=\"band band-y mv-head\">\n      <span class=\"blob\" style=\"width:460px;height:460px;left:-120px;top:-180px\"></span>\n      <span class=\"blob\" style=\"width:260px;height:260px;left:32%;bottom:-90px\"></span>\n      <div class=\"wrap mv-top\">\n        <div>\n          <h1 class=\"ld a\">בחורים</h1>\n          <p class=\"a\" style=\"--d:.08s\"><b id=\"tzb1-mact\">438</b> בחורים פעילים<span id=\"tzb1-msample\"> · מוצגים <b id=\"tzb1-mcount\">28</b> לדוגמה</span></p>\n        </div>\n        <div class=\"mv-acts a\" style=\"--d:.12s\">\n          <button type=\"button\" class=\"rbtn\" data-act=\"export\" aria-label=\"ייצוא לקובץ\" data-tip=\"ייצוא לקובץ\"><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 4v11M7 11l5 5 5-5M5 20h14\"/></svg></button>\n          <button type=\"button\" class=\"rbtn\" data-act=\"print\" aria-label=\"הדפסה\" data-tip=\"הדפסה\"><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z\"/></svg></button>\n          <button type=\"button\" class=\"btn btn-k\" data-act=\"newmember\">בחור חדש<svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 6l-6 6 6 6M19 6l-6 6 6 6\"/></svg></button>\n        </div>\n      </div>\n      <svg class=\"edge edge-b\" viewBox=\"0 0 1440 110\" preserveAspectRatio=\"none\" height=\"110\" aria-hidden=\"true\"><path d=\"M0,110H1440V46C1180,0,980,92,720,60C460,28,240,6,0,66Z\"/></svg>\n    </div>\n    <div class=\"wrap mv-body\">\n      <div class=\"search a\" style=\"--d:.16s\">\n        <svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M20 20l-3.6-3.6\"/></svg>\n        <input type=\"search\" id=\"tzb1-q\" placeholder=\"חיפוש לפי שם, טלפון או ישיבה\" aria-label=\"חיפוש בחור לפי שם, טלפון או ישיבה\" autocomplete=\"off\">\n        <kbd id=\"tzb1-qn\"></kbd>\n      </div>\n      <div class=\"filt a\" style=\"--d:.2s\" id=\"tzb1-filt\" role=\"tablist\" aria-label=\"סינון לפי סטטוס\"></div>\n      <div class=\"filt2 a\" style=\"--d:.24s\" id=\"tzb1-filt2\"></div>\n      <div class=\"ml\">\n        <div class=\"ml-h a\" style=\"--d:.26s\" id=\"tzb1-mlh\"></div>\n        <div class=\"ml-l\" id=\"tzb1-mll\"></div>\n        <p class=\"ml-foot\" id=\"tzb1-mlfoot\"></p>\n      </div>\n    </div>\n  </section>\n\n  <!-- ================= בקרוב ================= -->\n  <section class=\"view\" data-view=\"soon\" aria-label=\"בקרוב\" hidden>\n    <div id=\"tzb1-soon\"></div>\n  </section>\n</main>\n\n<footer class=\"ft\">\n  <div class=\"wrap\">\n    <span class=\"seal\" role=\"img\" aria-label=\"סמל צדקת רבי שמעון\"></span>\n    <div><b>צדקת רבי שמעון · עזרת חתנים</b><i id=\"tzb1-ftnote\">מערכת הניהול · כל השמות והסכומים הם נתוני הדגמה</i></div>\n    <span class=\"sp\">קמפיין <span data-year>תשפ״ו</span> · עודכן <span id=\"tzb1-ftdate\"></span></span>\n  </div>\n</footer>\n\n<nav class=\"tabbar\" id=\"tzb1-tabbar\" aria-label=\"ניווט תחתון\"></nav>\n<button type=\"button\" class=\"fab\" data-open=\"deposit\" aria-label=\"רישום הפקדה\"><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 5v14M5 12h14\"/></svg></button>\n\n<!-- כרטיס בחור -->\n<div class=\"ov\" id=\"tzb1-ov-member\" role=\"dialog\" aria-modal=\"true\" aria-label=\"כרטיס בחור\" hidden>\n  <div class=\"ov-bg\" data-close><svg viewBox=\"0 0 1440 400\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path d=\"M0,400V120C260,20,480,200,760,130C1040,60,1240,10,1440,90V400Z\"/></svg></div>\n  <div class=\"sheet\" id=\"tzb1-sheet\"></div>\n</div>\n\n<!-- רישום הפקדה -->\n<div class=\"ov\" id=\"tzb1-ov-deposit\" role=\"dialog\" aria-modal=\"true\" aria-label=\"רישום הפקדה\" hidden>\n  <div class=\"ov-bg\" data-close><svg viewBox=\"0 0 1440 400\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path d=\"M0,400V120C260,20,480,200,760,130C1040,60,1240,10,1440,90V400Z\"/></svg></div>\n  <div class=\"dep\" id=\"tzb1-dep\">\n    <button type=\"button\" class=\"x\" data-close aria-label=\"סגירה\"><svg class=\"g\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg></button>\n    <span class=\"dep-kupa\"><span class=\"disc\" id=\"tzb1-depkupa\"></span></span>\n    <div class=\"dep-in\" id=\"tzb1-depin\"></div>\n  </div>\n</div>\n\n<!-- טפסים: בחור, הוצאה, סליקת אשראי, חתן, תשלום לחנות -->\n<div class=\"ov\" id=\"tzb1-ov-form\" role=\"dialog\" aria-modal=\"true\" aria-label=\"טופס\" hidden>\n  <div class=\"ov-bg\" data-close><svg viewBox=\"0 0 1440 400\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><path d=\"M0,400V120C260,20,480,200,760,130C1040,60,1240,10,1440,90V400Z\"/></svg></div>\n  <div class=\"sheet fsheet\" id=\"tzb1-fsheet\"></div>\n</div>\n\n<!-- עוד (נייד) -->\n<div class=\"ov\" id=\"tzb1-ov-more\" role=\"dialog\" aria-modal=\"true\" aria-label=\"עוד\" hidden>\n  <div class=\"ov-bg\" data-close></div>\n  <div class=\"more\" id=\"tzb1-more\"></div>\n</div>\n\n<div class=\"toasts\" id=\"tzb1-toasts\" aria-live=\"polite\"></div>\n<div class=\"tip\" id=\"tzb1-tip\" role=\"tooltip\"></div>\n<canvas class=\"confetti\" id=\"tzb1-confetti\" aria-hidden=\"true\" hidden></canvas>\n";
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
    r = r || { ok: true };
    if (r.ok !== false && S.view === 'soon') scrDraw();   // הפעולה הצליחה: המסך מצויר מחדש מהנתונים המעודכנים, גם אם הסמן נשאר בשדה
    return r;
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
    S.dirty = false;
    id('soon').innerHTML = scrHero(k, sc.hero()) + '<div class="wrap scr-body" id="' + P + 'scr">' + safeBody(k) + '</div>';
    return true;
  }
  function scrDraw() {
    var b = id('scr');
    if (!b || !S.soon || !SCREENS[S.soon]) return;
    S.dirty = false;
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
        tc('מחצית', r.half ? '<span class="tag t-neutral">מחצית ' + esc(r.half) + '׳</span>' : '<span class="tag t-idle">' + (r.date ? 'תאריך משנה אחרת' : 'ללא תאריך') + '</span>') +
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
    return '<div class="scr-2"><div>' + shH('מי קיבל השנה', 'מקבלי המענק', live && canE && has('importGrooms') ? '<button type="button" class="btn btn-s btn-o sh-btn" data-scr="form:gimport">' + g('list') + 'הדבקה מאקסל</button>' : '') +
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
    } else if (kind === 'gimport') {
      h = '<form data-form="gimport" novalidate><div class="sheet-s">' + X + '<h2 class="fh"><span class="lt">מקבלי המענק · ' + esc(D.grantsX.year) + '</span>הדבקת רשימה מאקסל</h2>' +
        '<p class="fnote">מסמנים באקסל את השורות עם העמודות <b>שם ומשפחה, תעודת זהות, תאריך, טלפון</b>, מעתיקים ומדביקים כאן. חתן שכבר רשום (לפי תעודת זהות או שם) מתעדכן ולא מוכפל.</p>' +
        '<div class="dform"><div class="fld w2"><label for="' + P + 'gi-text">הרשימה</label><div class="uin"><textarea id="' + P + 'gi-text" rows="8" data-scrin="gimport" placeholder="מדביקים כאן (Ctrl+V)" spellcheck="false"></textarea></div></div>' +
        '<div class="fld w2 gi-prev" id="' + P + 'gi-prev" aria-live="polite"></div><p class="err fld w2" id="' + P + 'ferr" role="alert"></p></div></div>' + foot('ייבוא הרשימה') + '</form>';
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
  // רשימה שהודבקה מאקסל: שורה לכל חתן, עמודות מופרדות בטאב. מזהה שורת כותרת, ומדלג על שורות שאינן חתן
  function parseGroomPaste(text) {
    var rows = [], skipped = 0, map = null;
    function dateOf(c) { var m = String(c).trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/); return m ? ('0' + m[1]).slice(-2) + '/' + ('0' + m[2]).slice(-2) + '/' + (m[3].length === 2 ? '20' + m[3] : m[3]) : ''; }
    // תא של מספר: ספרות עם רווחים, מקפים, סוגריים, נקודות או + (כך אקסל מעתיק טלפונים), בלי אותיות
    function digs(c) { return String(c).replace(/\D/g, ''); }
    function isNum(c) { c = String(c).replace(/\.0+$/, ''); return !/[\u0590-\u05FFA-Za-z]/.test(c) && /^\d{7,13}$/.test(digs(c)) && !dateOf(c); }
    function idOf(c) { return digs(String(c).replace(/\.0+$/, '')); }
    function phoneOf(c) {
      var d = digs(String(c).replace(/\.0+$/, ''));
      if (d.indexOf('972') === 0 && d.length >= 11) d = '0' + d.slice(3);
      return (d.length === 9 && d.charAt(0) === '5') || (d.length === 8 && /^[23489]/.test(d)) ? '0' + d : d;
    }
    // בעמודה שכותרתה "טלפון" כל ערך הוא טלפון, גם אם אינו מספר נקי (שני מספרים, שלוחה וכדומה)
    function phoneCell(c) { c = String(c || '').trim(); return !c ? '' : isNum(c) ? phoneOf(c) : c; }
    String(text || '').split(/\r?\n/).forEach(function (line, li) {
      if (!line.trim()) return;
      // אקסל מוסיף לפעמים תווי כיוון נסתרים ומירכאות סביב תאים: מנקים אותם לפני הזיהוי
      var cells = (line.indexOf('\t') > -1 ? line.split('\t') : line.trim().split(/\s{2,}/)).map(function (c) { c = c.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff\u00a0]/g, ' ').trim(); if (/^".*"$/.test(c)) c = c.slice(1, -1).replace(/""/g, '"').trim(); return c.replace(/^'/, ''); });
      // הדבקה שאיבדה את הטאבים (רווח אחד בין העמודות): מפרקים לפי תאריך ומספרים, והשאר הוא השם
      if (cells.length === 1 && /\d{7,}|\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}/.test(cells[0])) {
        var tk = cells[0].split(/\s+/), nm = [], rest = [];
        tk.forEach(function (t) { if (!rest.length && !dateOf(t) && !/^[\d\-+().]{7,}$/.test(t)) nm.push(t); else rest.push(t); });
        cells = [nm.join(' ')].concat(rest);
      }
      var r = { name: '', idn: '', date: '', phone: '', line: li + 1 }, di = -1, nums = [], i, c;
      if (cells.some(function (x) { return /^שם/.test(x); }) && cells.some(function (x) { return /זהות|ת\.?ז|טלפון|תאריך/.test(x); })) {
        map = {}; cells.forEach(function (x, ci) { if (/זהות|ת\.?ז/.test(x)) map.idn = ci; else if (/תאריך/.test(x)) map.date = ci; else if (/טלפון|טל['׳.]?$|נייד|פלאפון|סלולרי/.test(x)) map.phone = ci; else if (/^שם/.test(x) && map.name == null) map.name = ci; });
        return;
      }
      if (map && map.name != null && cells.length > 1) {
        r.name = cells[map.name] || ''; r.idn = map.idn != null && isNum(cells[map.idn] || '') ? idOf(cells[map.idn]) : ''; r.date = map.date != null ? dateOf(cells[map.date] || '') || (cells[map.date] || '') : '';
        r.phone = map.phone != null ? phoneCell(cells[map.phone]) : '';
      } else {
        for (i = 0; i < cells.length; i++) { c = cells[i]; if (!c) continue; if (dateOf(c)) { r.date = dateOf(c); di = i; } else if (isNum(c)) nums.push({ i: i, v: idOf(c) }); else if (!r.name && /[\u0590-\u05FFA-Za-z]/.test(c)) r.name = c; }
        if (nums.length >= 2) { r.idn = nums[0].v; r.phone = phoneOf(nums[1].v); }
        else if (nums.length === 1) { if (di > -1 ? nums[0].i > di : /^(972|0)?5\d{8}$/.test(nums[0].v)) r.phone = phoneOf(nums[0].v); else r.idn = nums[0].v; }
      }
      if ((!r.name && !r.idn) || (!r.idn && !r.date && !r.phone)) { skipped++; return; }   // כותרת הגיליון, שורת סיכום וכדומה
      rows.push(r);
    });
    return { rows: rows, skipped: skipped };
  }
  function groomPastePreview(text) {
    var gp = parseGroomPaste(text), box = id('gi-prev'), pl, h;
    if (!box) return;
    if (!String(text || '').trim()) { box.innerHTML = ''; return; }
    if (!gp.rows.length) { box.innerHTML = '<p class="scr-note">עדיין לא זוהו שורות של חתנים.</p>'; return; }
    pl = has('planGroomImport') ? HOST().planGroomImport(gp.rows) : null;
    h = '<p class="gi-sum"><b>זוהו ' + gp.rows.length + ' חתנים.</b> ' + (pl && pl.ok ? pl.added + ' חדשים · ' + pl.updated + ' יעודכנו · ' + pl.same + ' כבר רשומים' : '') +
      (gp.skipped ? ' · ' + gp.skipped + ' שורות אחרות דולגו' : '') + '</p>' + (pl && pl.ok && pl.bad.length ? '<p class="gi-sum is-bad">תאריך לא תקין בשורה ' + pl.bad.join(', ') + '</p>' : '');
    h += '<div class="gi-tb">' + gp.rows.slice(0, 5).map(function (r) { return '<div><b>' + esc(r.name || '—') + '</b><span dir="ltr">' + esc(r.idn || '—') + '</span><span dir="ltr">' + esc(r.date || '—') + '</span><span dir="ltr">' + esc(r.phone || '—') + '</span></div>'; }).join('') +
      (gp.rows.length > 5 ? '<div class="gi-more">ועוד ' + (gp.rows.length - 5) + '</div>' : '') + '</div>';
    box.innerHTML = h;
  }
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
    } else if (kind === 'gimport') {
      var gp = parseGroomPaste(id('gi-text').value);
      if (!gp.rows.length) return formErr('לא זוהו שורות. מדביקים שורות עם שם, תעודת זהות, תאריך וטלפון');
      hr = hcall('importGrooms', gp.rows);
      if (hr.classic) return true;
      if (!hr.ok) return formErr(hr.error || 'הרשימה לא יובאה. אפשר לנסות שוב');
      closeAll(); SC.grants.view = 'give';
      if (!hr.added && !hr.updated) toast('כל החתנים שברשימה כבר רשומים', 'info');
      return true;
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
      else if (a === 'gyear') { if (t.value !== D.grantsX.year) { if (HOST() && HOST().setGrantsYear) { SC.grants.editPkg = false; if (!hdo('setGrantsYear', t.value)) t.value = D.grantsX.year; } else { toast('בהדגמה מוצגת שנת ' + esc(D.grantsX.year) + ' בלבד', 'info'); t.value = D.grantsX.year; } } }
      else if (a === 'allyears') { SC.purim.all = t.checked; scrDraw(); }
      else if (a === 'mtype') { var sh = id('m-shiur'), box = id('m-shiur-f'); box.hidden = t.value === 'חיידר'; sh.innerHTML = D.frames[t.value].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
      else if (a === 'gpick') { m = byId(t.value); if (m) { id('g-name').value = m.full; id('g-phone').value = m.phone; } }
      else if (a.indexOf('perm:') === 0 && !HOST()) { p = a.split(':'); D.settingsX.users[+p[1]].perms[+p[2]] = t.checked ? 1 : 0; }
    });
    root.addEventListener('input', function (e) {
      var t = e.target, a = t.getAttribute && t.getAttribute('data-scrin'), p, d, sb = id('scr');
      if (sb && sb.contains(t) && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !/^(checkbox|radio)$/.test(t.type)))) S.dirty = true;
      if (!a) return;
      if (a.indexOf('pk:') === 0 || a.indexOf('pki:') === 0) {
        p = a.split(':'); d = SC.grants.draft; if (!d) return;
        if (p[0] === 'pk') { if (d[+p[1]]) d[+p[1]][p[2]] = t.value; }
        else if (d[+p[1]] && d[+p[1]].items[+p[2]]) { if (p[3] !== 'name') t.value = t.value.replace(/[^\d.]/g, ''); d[+p[1]].items[+p[2]][p[3]] = t.value; }
        return;
      }
      if (a === 'gimport') { groomPastePreview(t.value); var ge = id('ferr'); if (ge) ge.textContent = ''; return; }
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

/* ============ מסלולי הגבייה של פורים: מפה, מסלול קצר יותר, ובניית מסלולים אוטומטית ============
     נכנס לתוך script.js אחרי screens.js (shared/build.js).
     המפה היא מפת גוגל מוטמעת (iframe) שמקבלת את העצירות לפי הסדר ומציירת מסלול הליכה. אין צורך במפתח.
     החישוב שלנו (סדר, זמנים, חלוקה) נשען על המיקום של כל כתובת (lat/lon שנשמר איתה), ומעריך הליכה לפי
     קו אווירי כפול 1.3. הזמנים של גוגל על המפה מדויקים יותר; שלנו משמשים להשוואה בין מסלולים.
     כתובת בלי מיקום: המפה עדיין מוצגת לפי סדר הרשימה, אבל אין חישוב זמנים ואין בניית מסלולים.

     הכללים:
     - זמן לכל כתובת בנפרד: הליכה מהכתובת הקודמת + שהייה. גם כמה כתובות באותו רחוב מחושבות אחת אחת.
     - כתובת עם שעות (רק אחרי / עד שעה) מוזזת במסלול למקום שבו מגיעים אליה בזמן, במחיר הקטן ביותר.
     - "אזורים": כל קבוצה מקבלת אזור מרוכז, כך שאפשר לחזור לכתובת שלא ענו בה.
     - "מסלול ארוך": קו אחד רציף שנחתך לקטעים. אין דרך חזרה לכתובת שדילגו עליה. */
  GL.pin = '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>';
  GL.bulb = '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2.2h5c.1-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>';
  GL.clock = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';
  var RT = { speed: 75, per: 4, start: '10:00', end: '16:00' };   // speed = מטרים בדקה (4.5 קמ״ש)
  var LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
  // זמן השהייה בכתובת: לכל כתובת אפשר לקבוע זמן משלה (stay), אחרת ברירת המחדל. קומה גבוהה בלי מעלית מוסיפה 5 דקות.
  var STAIRS_MIN = 5;
  function stayOf(r, cfg) { return (r.stay || cfg.per) + (r.stairs ? STAIRS_MIN : 0); }

  /* ---------- חישוב ---------- */
  function hm(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function fmtT(min) { min = Math.round(min); return ('0' + (Math.floor(min / 60) % 24)).slice(-2) + ':' + ('0' + (min % 60)).slice(-2); }
  function rdist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return 1.3 * Math.sqrt(dx * dx + dy * dy); }   // הליכה ≈ קו אווירי × 1.3
  function hasGeo(rows) { return rows.length > 0 && rows.every(function (r) { return r.x != null && r.y != null; }); }
  function walkLen(o) { var d = 0, i; for (i = 1; i < o.length; i++) d += rdist(o[i - 1], o[i]); return d; }
  // לוח הזמנים של מסלול: מתי מגיעים לכל כתובת, כמה מחכים, ומי לא נכנס בזמן
  function simulate(order, cfg) {
    var t = hm(cfg.start), end = hm(cfg.end), steps = [], walk = 0, wait = 0, late = 0, over = 0, stayAll = 0, i, r, d, w, isLate, stay;
    for (i = 0; i < order.length; i++) {
      r = order[i]; d = i ? rdist(order[i - 1], r) : 0; walk += d; t += d / cfg.speed; w = 0;
      if (r.win && r.win.from && t < hm(r.win.from)) { w = hm(r.win.from) - t; t += w; wait += w; }
      isLate = !!(r.win && r.win.to && t > hm(r.win.to));
      if (isLate) late++;
      stay = stayOf(r, cfg); stayAll += stay;
      if (t + stay > end) over++;
      steps.push({ row: r, arrive: t, wait: w, stay: stay, late: isLate, over: t + stay > end });
      t += stay;
    }
    return { steps: steps, walkM: walk, walkMin: walk / cfg.speed, waitMin: wait, stayMin: stayAll, endMin: t, totalMin: t - hm(cfg.start), late: late, over: over };
  }
  // המחיר של מסלול: כמה זמן הוא לוקח, עם קנס כבד על כתובת שמפספסים את השעות שלה
  function routeCost(order, cfg) { var s = simulate(order, cfg); return s.totalMin + s.late * 600; }
  function nearestFirst(rows) {
    var best = null, bestLen = Infinity, s, left, cur, o, k, bi, bd, d;
    for (s = 0; s < rows.length; s++) {
      left = rows.slice(); cur = left.splice(s, 1)[0]; o = [cur];
      while (left.length) { bi = 0; bd = Infinity; for (k = 0; k < left.length; k++) { d = rdist(cur, left[k]); if (d < bd) { bd = d; bi = k; } } cur = left.splice(bi, 1)[0]; o.push(cur); }
      d = walkLen(o); if (d < bestLen) { bestLen = d; best = o; }
    }
    return best || [];
  }
  function twoOpt(o) {
    var improved = true, n = o.length, i, j, before, after, guard = 0;
    o = o.slice();
    while (improved && guard++ < 60) {
      improved = false;
      for (i = 0; i < n - 1; i++) for (j = i + 1; j < n; j++) {
        before = (i ? rdist(o[i - 1], o[i]) : 0) + (j < n - 1 ? rdist(o[j], o[j + 1]) : 0);
        after = (i ? rdist(o[i - 1], o[j]) : 0) + (j < n - 1 ? rdist(o[i], o[j + 1]) : 0);
        if (after < before - .5) { o = o.slice(0, i).concat(o.slice(i, j + 1).reverse(), o.slice(j + 1)); improved = true; }
      }
    }
    return o;
  }
  function fixWindows(order, cfg) {
    var pass, wins, wi, r, rest, best, bc, p, t, c;
    for (pass = 0; pass < 2; pass++) {
      wins = order.filter(function (x) { return x.win; });
      for (wi = 0; wi < wins.length; wi++) {
        r = wins[wi]; rest = order.filter(function (x) { return x !== r; }); best = order; bc = routeCost(order, cfg);
        for (p = 0; p <= rest.length; p++) { t = rest.slice(0, p).concat([r], rest.slice(p)); c = routeCost(t, cfg); if (c < bc - .01) { bc = c; best = t; } }
        order = best;
      }
    }
    return order;
  }
  function bestRoute(rows, cfg) {
    if (rows.length < 3) return rows.slice();
    var o = twoOpt(nearestFirst(rows)), back = o.slice().reverse();
    o = fixWindows(o, cfg); back = fixWindows(back, cfg);
    return routeCost(back, cfg) < routeCost(o, cfg) ? back : o;
  }
  function spread(rows) { var m = 0, i, j; for (i = 0; i < rows.length; i++) for (j = i + 1; j < rows.length; j++) m = Math.max(m, rdist(rows[i], rows[j])); return m; }
  // חלוקה לאזורים: מרכזים רחוקים זה מזה, כל כתובת למרכז הקרוב, ואיזון כך שאף קבוצה לא גדולה בהרבה מהאחרות
  function planAreas(rows, k) {
    var cents = [rows[0]], i, it, groups, far, fd, d, moved, big, small, bi, cand, cd, target = rows.length / k;
    while (cents.length < k) {
      far = null; fd = -1;
      rows.forEach(function (r) { d = Math.min.apply(null, cents.map(function (c) { return rdist(r, c); })); if (d > fd) { fd = d; far = r; } });
      cents.push(far);
    }
    cents = cents.map(function (c) { return { x: c.x, y: c.y }; });
    for (it = 0; it < 14; it++) {
      groups = cents.map(function () { return []; });
      rows.forEach(function (r) { bi = 0; fd = Infinity; cents.forEach(function (c, ci) { d = rdist(r, c); if (d < fd) { fd = d; bi = ci; } }); groups[bi].push(r); });
      cents = groups.map(function (gp, gi) { return gp.length ? { x: gp.reduce(function (a, r) { return a + r.x; }, 0) / gp.length, y: gp.reduce(function (a, r) { return a + r.y; }, 0) / gp.length } : cents[gi]; });
    }
    for (moved = 0; moved < rows.length; moved++) {
      big = 0; small = 0;
      groups.forEach(function (gp, gi) { if (gp.length > groups[big].length) big = gi; if (gp.length < groups[small].length) small = gi; });
      if (groups[big].length - groups[small].length <= Math.max(2, Math.round(target * .25))) break;
      cand = 0; cd = Infinity;
      groups[big].forEach(function (r, ri) { d = rdist(r, cents[small]) - rdist(r, cents[big]); if (d < cd) { cd = d; cand = ri; } });
      groups[small].push(groups[big].splice(cand, 1)[0]);
    }
    return groups.filter(function (gp) { return gp.length; });
  }
  // מסלול ארוך: קו אחד על כל הכתובות, שנחתך לקטעים שלוקחים בערך אותו זמן
  function planLine(rows, k, cfg) {
    var o = twoOpt(nearestFirst(rows)), per = [], total = 0, i, groups = [], cur = [], acc = 0, share;
    for (i = 0; i < o.length; i++) { per.push((i ? rdist(o[i - 1], o[i]) / cfg.speed : 0) + stayOf(o[i], cfg)); total += per[i]; }
    share = total / k;
    for (i = 0; i < o.length; i++) {
      cur.push(o[i]); acc += per[i];
      if (acc >= share * (groups.length + 1) - cfg.per / 2 && groups.length < k - 1 && o.length - i - 1 >= k - groups.length - 1) { groups.push(cur); cur = []; }
    }
    if (cur.length) groups.push(cur);
    return groups;
  }
  function buildPlan(rows, pl) {
    var cfg = { speed: RT.speed, per: pl.per, start: pl.start, end: pl.end };
    var raw = pl.mode === 'line' ? planLine(rows, pl.k, cfg) : planAreas(rows, pl.k);
    return raw.map(function (gp) { var o = pl.mode === 'line' ? fixWindows(gp, cfg) : bestRoute(gp, cfg); return { rows: o, sim: simulate(o, cfg), back: spread(o) / cfg.speed }; });
  }

  /* ---------- ציור המפה ---------- */
  var MAP_STYLE = [['#CEA130', '#0B0B0B', '#0B0B0B'], ['#0B0B0B', '#0B0B0B', '#D9B85F'], ['#FFFFFF', '#0B0B0B', '#0B0B0B'], ['#8C8577', '#8C8577', '#FFFFFF'], ['#F2E5C2', '#0B0B0B', '#0B0B0B'], ['#7D5F0E', '#7D5F0E', '#FFFFFF']];
  // מפת גוגל מוטמעת: מסלול הליכה דרך העצירות, לפי הסדר שקיבלנו
  function gmapURL(rows, city) {
    var a = rows.map(function (r) { return encodeURIComponent(r.street + ' ' + r.house + ', ' + city); });
    if (a.length < 2) return 'https://www.google.com/maps?q=' + (a[0] || encodeURIComponent(city)) + '&hl=he&output=embed';
    return 'https://www.google.com/maps?saddr=' + a[0] + '&daddr=' + a.slice(1).join('+to:') + '&dirflg=w&hl=he&output=embed';
  }
  function gmapH(rows, city, label) { return '<iframe class="gmap" src="' + esc(gmapURL(rows, city)) + '" title="' + esc(label) + '" loading="lazy" referrerpolicy="no-referrer" allowfullscreen></iframe>'; }
  // תרשים הקבוצות (בבניית מסלולים): כל הקבוצות יחד, כל אחת בצבע שלה. מפת גוגל המוטמעת יודעת להציג מסלול אחד בלבד.
  function mapSVG(sets, label) {
    var W = 620, H = 500, pad = 34, all = [], minX, maxX, minY, maxY, sc, ox, oy;
    sets.forEach(function (set) { all = all.concat(set.rows); });
    minX = Math.min.apply(null, all.map(function (r) { return r.x; })); maxX = Math.max.apply(null, all.map(function (r) { return r.x; }));
    minY = Math.min.apply(null, all.map(function (r) { return r.y; })); maxY = Math.max.apply(null, all.map(function (r) { return r.y; }));
    sc = Math.min((W - pad * 2) / Math.max(1, maxX - minX), (H - pad * 2) / Math.max(1, maxY - minY));
    ox = (W - (maxX - minX) * sc) / 2; oy = (H - (maxY - minY) * sc) / 2;
    function px(p) { return (ox + (p.x - minX) * sc).toFixed(1); }   // מזרח בימין, צפון למעלה
    function py(p) { return (oy + (p.y - minY) * sc).toFixed(1); }
    var h = '<svg class="pmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">';
    sets.forEach(function (set, si) {
      var stl = MAP_STYLE[set.style % MAP_STYLE.length], d = '';
      set.rows.forEach(function (r, i) { d += (i ? 'L' : 'M') + px(r) + ',' + py(r); });
      h += '<path class="pm-route" d="' + d + '" style="stroke:' + stl[1] + ';--i:' + si + '"/>';
    });
    sets.forEach(function (set) {
      var stl = MAP_STYLE[set.style % MAP_STYLE.length];
      set.rows.forEach(function (r, i) {
        var step = set.sim && set.sim.steps[i], bad = step && (step.late || step.over);
        h += '<g class="pm-pin' + (bad ? ' is-bad' : '') + '" transform="translate(' + px(r) + ' ' + py(r) + ')" data-tip="' + esc(r.family + ' · ' + r.street + ' ' + r.house) + (step ? '|הגעה ' + fmtT(step.arrive) + (r.win ? '|' + winText(r.win) : '') : '') + '" tabindex="0">' +
          (r.win ? '<circle class="pm-win" r="15"/>' : '') + '<circle r="11" style="fill:' + stl[0] + ';stroke:' + stl[1] + '"/><text y="4" text-anchor="middle" style="fill:' + stl[2] + '">' + (set.letter || i + 1) + '</text></g>';
      });
    });
    return h + '</svg>';
  }
  function addrN(n) { return n === 1 ? 'כתובת אחת' : n + ' כתובות'; }
  function stayH(r, mins) { return '<span class="stay' + (r.stairs || r.stay ? ' is-set' : '') + '">' + mins + ' דק׳' + (r.stairs ? ' · בלי מעלית' : '') + '</span>'; }
  function winText(w) { return w.from ? 'רק אחרי ' + w.from : 'עד ' + w.to; }
  function minT(m) { m = Math.round(m); return m >= 60 ? Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2) + ' שעות' : m + ' דק׳'; }
  function kmT(m) { return m >= 1000 ? (m / 1000).toFixed(1) + ' ק״מ' : Math.round(m / 10) * 10 + ' מ׳'; }
  function statsH(sim) {
    return '<div class="pm-stats"><span><i>הליכה</i><b>' + kmT(sim.walkM) + '</b><u>' + minT(sim.walkMin) + '</u></span><span><i>בכתובות</i><b>' + minT(sim.stayMin) + '</b><u>' + sim.steps.length + ' כתובות</u></span>' +
      (sim.waitMin >= 1 ? '<span><i>המתנה</i><b>' + minT(sim.waitMin) + '</b><u>לכתובת עם שעות</u></span>' : '') +
      '<span class="is-end"><i>סיום משוער</i><b dir="ltr">' + fmtT(sim.endMin) + '</b><u>התחלה ' + esc(RT.start) + '</u></span></div>';
  }

  /* ---------- תצוגת מפה לקבוצה ---------- */
  function routeCfg() { return { speed: RT.speed, per: RT.per, start: RT.start, end: RT.end }; }
  function mapView(gr) {
    var st = SC.purim, cfg = routeCfg(), geo = hasGeo(gr.rows), title = '<span class="lt">' + esc(gr.city) + ' · ' + esc(gr.group) + '</span>';
    // כתובות בלי מיקום: המפה של גוגל מוצגת לפי סדר הרשימה, בלי שעות ובלי חיפוש מסלול קצר
    if (!geo) {
      return '<div class="pm"><div class="pm-list"><div class="pm-rows">' + gr.rows.map(function (r, i) {
        return '<button type="button" class="pm-row" data-scr="visit:' + i + '"><span class="pm-n">' + (i + 1) + '</span><span class="pm-t"><b>' + esc(r.family) + ' <small>' + esc(r.first) + '</small></b><i>' + addrH(r) + '</i></span>' +
          '<span class="pm-e">' + (r.win ? '<span class="tag t-warn">' + esc(winText(r.win)) + '</span>' : '') + stayH(r, stayOf(r, cfg)) + '</span><b class="pm-h">—</b></button>';
      }).join('') + '</div></div><aside class="panel pm-map"><div class="panel-h"><h3>' + title + 'המסלול לפי הרשימה</h3></div>' +
        '<p class="pm-warn is-info">לכתובות של הקבוצה הזו עדיין אין מיקום, ולכן אין חישוב זמנים ואין חיפוש של מסלול קצר יותר. המפה מציגה את הסדר שברשימה.</p>' + gmapH(gr.rows, gr.city, 'מפת המסלול של ' + gr.group) + '</aside></div>';
    }
    var cur = simulate(gr.rows, cfg), best = bestRoute(gr.rows, cfg), bs = simulate(best, cfg);
    var gain = cur.totalMin - bs.totalMin, fixes = cur.late - bs.late, hasBetter = gain >= 3 || fixes > 0;
    var showBest = st.better && hasBetter, order = showBest ? best : gr.rows, sim = showBest ? bs : cur;
    var bulb = !hasBetter ? '<div class="pm-ok">' + g('checkc') + '<span><b>זה המסלול הקצר ביותר שמצאנו</b>לא נמצא סדר שחוסך זמן.</span></div>'
      : showBest ? '<div class="bulb is-on"><span class="bulb-i">' + g('bulb') + '</span><span><b>מוצג המסלול הקצר</b>' + (gain >= 1 ? 'חוסך ' + minT(gain) : 'אותו זמן') + (fixes > 0 ? ' · מגיעים בזמן לכל הכתובות' : '') + '</span>' +
        '<button type="button" class="btn btn-s btn-o" data-scr="pbetter:0">חזרה למסלול המקורי</button><button type="button" class="btn btn-s btn-k" data-scr="pkeep">שמירת הסדר הזה</button></div>'
        : '<button type="button" class="bulb" data-scr="pbetter:1"><span class="bulb-i">' + g('bulb') + '</span><span><b>נמצא מסלול ' + (gain >= 1 ? 'קצר' : 'טוב') + ' יותר</b>' + (gain >= 1 ? 'חוסך ' + minT(gain) : '') + (fixes > 0 ? (gain >= 1 ? ', ו' : '') + 'מגיעים בזמן גם ל' + (fixes === 1 ? 'כתובת עם השעות' : fixes + ' כתובות עם שעות') : '') + '. לחיצה מציגה אותו.</span>' + g('chev') + '</button>';
    var rows = sim.steps.map(function (s, i) {
      var r = s.row;
      return '<button type="button" class="pm-row' + (s.late || s.over ? ' is-bad' : '') + '" data-scr="visit:' + gr.rows.indexOf(r) + '" aria-label="' + esc(r.family + ' ' + r.first + ', ' + r.street + ' ' + r.house) + '. פרטי הביקור"><span class="pm-n">' + (i + 1) + '</span><span class="pm-t"><b>' + esc(r.family) + ' <small>' + esc(r.first) + '</small></b><i>' + addrH(r) + '</i></span>' +
        '<span class="pm-e">' + (r.win ? '<span class="tag ' + (s.late ? 't-bad' : 't-warn') + '">' + esc(winText(r.win)) + '</span>' : '') + (s.wait >= 1 ? '<i>המתנה ' + minT(s.wait) + '</i>' : '') + stayH(r, s.stay) + '</span><b class="pm-h" dir="ltr">' + fmtT(s.arrive) + '</b></button>';
    }).join('');
    var warn = sim.late || sim.over ? '<p class="pm-warn">' + (sim.late ? (sim.late === 1 ? 'לכתובת אחת עם שעות מגיעים מאוחר מדי. ' : 'ל-' + sim.late + ' כתובות עם שעות מגיעים מאוחר מדי. ') : '') + (sim.over ? addrN(sim.over) + (sim.over === 1 ? ' נשארת' : ' נשארות') + ' אחרי ' + esc(RT.end) + '.' : '') + '</p>' : '';
    return '<div class="pm"><div class="pm-list"><div class="pm-rows">' + rows + '</div><p class="ml-foot">' + RT.per + ' דקות בכתובת, אלא אם נקבע לה זמן אחר · קומה גבוהה בלי מעלית: עוד ' + STAIRS_MIN + ' דקות · לחיצה על כתובת פותחת את פרטי הביקור</p></div>' +
      '<aside class="panel pm-map"><div class="panel-h"><h3>' + title + (showBest ? 'המסלול הקצר' : 'המסלול לפי הרשימה') + '</h3></div>' + statsH(sim) + bulb + warn +
      gmapH(order, gr.city, 'מפת המסלול של ' + gr.group) +
      '<p class="pm-note">המפה של גוגל מציגה את העצירות לפי הסדר שברשימה. הזמנים שלמעלה הם הערכה שלנו, כולל השהייה בכל כתובת.</p></aside></div>';
  }

  /* ---------- בניית מסלולים אוטומטית ---------- */
  function cityRows(city) { var all = []; purimGroupsOf(city).forEach(function (gr) { all = all.concat(gr.rows); }); return all; }
  function planView(city) {
    var pl = SC.purim.plan, rows = cityRows(city);
    if (!hasGeo(rows)) {
      return '<div class="pm pm-plan"><div class="pm-list"><div class="sh pl-h"><span class="dot"></span><h2><span class="lt">' + rows.length + ' כתובות ב' + esc(city) + '</span>בניית מסלולים</h2></div>' +
        '<p class="pm-warn is-info">לכתובות ב' + esc(city) + ' עדיין אין מיקום על המפה, ובלי מיקום אי אפשר לחשב מרחקים ולחלק לקבוצות.</p>' +
        '<div class="pl-acts"><button type="button" class="btn btn-o" data-scr="pplan-off">חזרה</button></div></div><aside class="panel pm-map"><div class="panel-h"><h3><span class="lt">' + esc(city) + '</span>אין מיקומים</h3></div>' + gmapH([], city, 'מפת ' + city) + '</aside></div>';
    }
    if (!pl.res) pl.res = buildPlan(rows, pl);
    var res = pl.res, late = 0, over = 0, maxEnd = 0, walk = 0, shown = pl.show != null && res[pl.show] ? pl.show : null;
    res.forEach(function (gp) { late += gp.sim.late; over += gp.sim.over; maxEnd = Math.max(maxEnd, gp.sim.endMin); walk += gp.sim.walkM; });
    var cards = res.map(function (gp, i) {
      var stl = MAP_STYLE[i % MAP_STYLE.length];
      return '<button type="button" class="pl-card' + (shown === i ? ' is-on' : '') + '" data-scr="pshow:' + i + '" aria-label="קבוצה ' + LETTERS[i] + ', הצגה במפת גוגל"><span class="pl-dot" style="background:' + stl[0] + ';border-color:' + stl[1] + ';color:' + stl[2] + '">' + LETTERS[i].charAt(0) + '</span><span class="pl-tx"><b>קבוצה ' + LETTERS[i] + '</b><i>' + addrN(gp.rows.length) + ' · הליכה ' + kmT(gp.sim.walkM) + '</i>' +
        (pl.mode === 'area' ? '<i>חזרה לכל כתובת: עד ' + minT(gp.back) + ' הליכה</i>' : '<i>מקצה לקצה: ' + minT(gp.back) + ' הליכה</i>') + '</span>' +
        '<span class="pl-end"><b dir="ltr">' + fmtT(gp.sim.endMin) + '</b><i>סיום</i>' + (gp.sim.late || gp.sim.over ? '<span class="tag t-bad">' + (gp.sim.late + gp.sim.over) + ' לא בזמן</span>' : '<span class="tag t-good">הכול בזמן</span>') + '</span></button>';
    }).join('');
    function fnum(fid, label, v, extra) { return '<div class="fld"><label for="' + P + fid + '">' + label + '</label><div class="uin"><input id="' + P + fid + '" type="text" value="' + esc(v) + '" autocomplete="off" dir="ltr" style="text-align:right" data-plan="' + fid + '"' + (extra || '') + '></div></div>'; }
    return '<div class="pm pm-plan"><div class="pm-list"><form class="pl-form" data-form="plan" novalidate><div class="sh pl-h"><span class="dot"></span><h2><span class="lt">' + rows.length + ' כתובות ב' + esc(city) + '</span>בניית מסלולים</h2></div>' +
      '<div class="dform pl-grid">' + fnum('pl-k', 'כמה קבוצות', pl.k, ' inputmode="numeric"') + fnum('pl-per', 'דקות בכל כתובת', pl.per, ' inputmode="numeric"') + fnum('pl-start', 'שעת התחלה', pl.start) + fnum('pl-end', 'לסיים עד', pl.end) + '</div>' +
      '<div class="fld pl-mode"><span class="lb">מה חשוב יותר</span><div class="seg" role="radiogroup"><label><input type="radio" name="' + P + 'pl-mode" value="area"' + (pl.mode === 'area' ? ' checked' : '') + ' data-plan="mode">' + BRUSH + '<span>אזורים (מומלץ)</span></label>' +
      '<label><input type="radio" name="' + P + 'pl-mode" value="line"' + (pl.mode === 'line' ? ' checked' : '') + ' data-plan="mode">' + BRUSH + '<span>מסלול ארוך</span></label></div></div>' +
      '<p class="scr-note pl-exp">' + (pl.mode === 'area' ? '<b>אזורים:</b> כל קבוצה מקבלת אזור מרוכז. אם לא ענו בכתובת, אפשר לחזור אליה אחר כך בלי לאבד הרבה זמן.' : '<b>מסלול ארוך:</b> קו אחד רציף שמתחלק בין הקבוצות, וכל קבוצה ממשיכה מהמקום שבו הקודמת סיימה. מי שלא ענה נשאר מאחור, ואין דרך לחזור אליו.') + '</p>' +
      '<div class="pl-acts"><button type="submit" class="btn btn-k">חישוב מחדש' + g('chev2') + '</button><button type="button" class="btn btn-o" data-scr="pplan-off">ביטול</button></div></form>' +
      '<div class="pl-cards">' + cards + '</div><p class="pm-note">לחיצה על קבוצה מציגה את המסלול שלה במפת גוגל.</p>' +
      '<div class="pl-acts pl-apply"><button type="button" class="btn" data-scr="pplan-apply">אישור החלוקה' + g('chev2') + '</button><span class="scr-note">הקבוצות הקיימות ב' + esc(city) + ' יוחלפו ב-' + res.length + ' הקבוצות האלה.</span></div></div>' +
      '<aside class="panel pm-map"><div class="panel-h"><h3><span class="lt">' + esc(city) + ' · ' + res.length + ' קבוצות</span>' + (shown != null ? 'קבוצה ' + LETTERS[shown] + ' במפת גוגל' : pl.mode === 'area' ? 'חלוקה לאזורים' : 'מסלול ארוך אחד') + '</h3>' +
      (shown != null ? '<button type="button" class="btn btn-s btn-o" data-scr="pshow:">כל הקבוצות</button>' : '') + '</div>' +
      '<div class="pm-stats"><span><i>סך ההליכה</i><b>' + kmT(walk) + '</b><u>לכל הקבוצות</u></span><span><i>כתובות</i><b>' + rows.length + '</b><u>' + (late + over ? (late + over) + ' לא בזמן' : 'כולן בזמן') + '</u></span><span class="is-end"><i>האחרונה מסיימת</i><b dir="ltr">' + fmtT(maxEnd) + '</b><u>התחלה ' + esc(pl.start) + '</u></span></div>' +
      (shown != null ? gmapH(res[shown].rows, city, 'מפת קבוצה ' + LETTERS[shown])
        : mapSVG(res.map(function (gp, i) { return { rows: gp.rows, style: i, sim: gp.sim, letter: LETTERS[i].charAt(0) }; }), 'תרשים החלוקה לקבוצות') +
        '<div class="leg pm-leg">' + res.map(function (gp, i) { var stl = MAP_STYLE[i % MAP_STYLE.length]; return '<span><i class="pl-pin" style="background:' + stl[0] + ';border-color:' + stl[1] + '"></i>קבוצה ' + LETTERS[i] + '</span>'; }).join('') + '<span><i class="pl-win"></i>כתובת עם שעות</span></div>' +
        '<p class="pm-note">זה תרשים של מיקומי הכתובות, לא מפה: מפת גוגל המוטמעת מציגה קבוצה אחת בכל פעם.</p>') + '</aside></div>';
  }
  function planRead() {
    var pl = SC.purim.plan, k = parseInt(val('pl-k'), 10), per = parseInt(val('pl-per'), 10), ok = /^\d{1,2}:\d{2}$/;
    var mode = ($('input[name="' + P + 'pl-mode"]:checked', id('scr')) || {}).value;
    pl.k = Math.max(1, Math.min(6, k || pl.k)); pl.per = Math.max(1, Math.min(30, per || pl.per));
    if (ok.test(val('pl-start'))) pl.start = val('pl-start');
    if (ok.test(val('pl-end'))) pl.end = val('pl-end');
    if (mode) pl.mode = mode;
    pl.k = Math.min(pl.k, cityRows(SC.purim.city).length);
    pl.res = null; pl.show = null;
  }
  function routeAct(a, v) {
    var st = SC.purim, X = D.purimX, groups, gr, old;
    if (!st.city) st.city = X.cities[0];
    if (a === 'pmap') { st.map = !st.map; st.better = false; st.edit = false; st.plan = null; scrDraw(); if (st.map) scrollToEl($('.scr-bar', id('scr'))); return true; }
    if (a === 'visit') { groups = purimGroupsOf(st.city); gr = groups[Math.min(st.group, groups.length - 1)]; openForm('visit', gr.rows[+v]); return true; }
    if (a === 'pbetter') { st.better = v === '1'; scrDraw(); return true; }
    if (a === 'pkeep') {
      groups = purimGroupsOf(st.city); gr = groups[Math.min(st.group, groups.length - 1)];
      gr.rows = bestRoute(gr.rows, routeCfg()); gr.rows.forEach(function (r, i) { r.n = i + 1; }); st.better = false; scrDraw(); toast('סדר הכתובות עודכן למסלול הקצר', 'check'); return true;
    }
    if (a === 'pplan') { st.plan = { k: purimGroupsOf(st.city).length, per: RT.per, start: RT.start, end: RT.end, mode: 'area', res: null }; st.map = true; st.edit = false; if (S.soon !== 'purim') go('purim'); else scrDraw(); scrollToEl($('.scr-bar', id('scr'))); return true; }
    if (a === 'pshow') { if (st.plan) { st.plan.show = v === '' ? null : +v; scrDraw(); } return true; }
    if (a === 'pplan-off') { st.plan = null; scrDraw(); return true; }
    if (a === 'pplan-apply') {
      old = purimGroupsOf(st.city);
      var oldTotal = old.reduce(function (s, x) { return s + x.addresses; }, 0), nRows = cityRows(st.city).length;
      X.groups = X.groups.filter(function (x) { return x.city !== st.city; }).concat(st.plan.res.map(function (gp, i) {
        var sums = {}; X.years.forEach(function (y) { sums[y] = old[i] ? old[i].sums[y] : 0; });
        gp.rows.forEach(function (r, n) { r.n = n + 1; });
        return { city: st.city, group: 'קבוצה ' + LETTERS[i], addresses: Math.round(oldTotal * gp.rows.length / nRows), sums: sums, rows: gp.rows };
      }));
      RT.per = st.plan.per; RT.start = st.plan.start; RT.end = st.plan.end;
      toast('נבנו ' + st.plan.res.length + ' קבוצות ב' + esc(st.city), 'check'); st.plan = null; st.group = 0; st.better = false; scrDraw(); return true;
    }
    return false;
  }


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
      else if (!S.dirty) scrDraw();   // נתונים חדשים מציירים מחדש את המסך, חוץ ממצב שבו המשתמש באמצע הקלדה שעוד לא נשמרה
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
