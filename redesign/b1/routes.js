/* ============ מסלולי הגבייה של פורים: מפה, מסלול קצר יותר, ובניית מסלולים אוטומטית ============
     נכנס לתוך script.js אחרי screens.js (shared/build.js). אין כאן פנייה לשום שירות חיצוני:
     המפה מצוירת מהמיקומים שבנתוני ההדגמה, והמרחק הוא מרחק הליכה ברשת רחובות (לאורך ולרוחב).
     במערכת האמיתית המיקומים יגיעו מאיתור כתובות, וזמני ההליכה משירות מפות. האלגוריתם עצמו נשאר.

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

  /* ---------- חישוב ---------- */
  function hm(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function fmtT(min) { min = Math.round(min); return ('0' + (Math.floor(min / 60) % 24)).slice(-2) + ':' + ('0' + (min % 60)).slice(-2); }
  function rdist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function walkLen(o) { var d = 0, i; for (i = 1; i < o.length; i++) d += rdist(o[i - 1], o[i]); return d; }
  // לוח הזמנים של מסלול: מתי מגיעים לכל כתובת, כמה מחכים, ומי לא נכנס בזמן
  function simulate(order, cfg) {
    var t = hm(cfg.start), end = hm(cfg.end), steps = [], walk = 0, wait = 0, late = 0, over = 0, i, r, d, w, isLate;
    for (i = 0; i < order.length; i++) {
      r = order[i]; d = i ? rdist(order[i - 1], r) : 0; walk += d; t += d / cfg.speed; w = 0;
      if (r.win && r.win.from && t < hm(r.win.from)) { w = hm(r.win.from) - t; t += w; wait += w; }
      isLate = !!(r.win && r.win.to && t > hm(r.win.to));
      if (isLate) late++;
      if (t + cfg.per > end) over++;
      steps.push({ row: r, arrive: t, wait: w, late: isLate, over: t + cfg.per > end });
      t += cfg.per;
    }
    return { steps: steps, walkM: walk, walkMin: walk / cfg.speed, waitMin: wait, stayMin: order.length * cfg.per, endMin: t, totalMin: t - hm(cfg.start), late: late, over: over };
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
    for (i = 0; i < o.length; i++) { per.push((i ? rdist(o[i - 1], o[i]) / cfg.speed : 0) + cfg.per); total += per[i]; }
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
  function mapSVG(sets, label) {
    var X = D.purimX, W = 620, H = 540, pad = 46, sx = (W - pad * 2) / X.span.w, sy = (H - pad * 2) / X.span.h;
    function px(p) { return (W - pad - p.x * sx).toFixed(1); }   // מזרח בימין, כמו במפה רגילה
    function py(p) { return (pad + p.y * sy).toFixed(1); }
    var h = '<svg class="pmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">';
    X.streets.forEach(function (st) {
      if (st[2] === 'h') h += '<line class="pm-st" x1="' + (pad - 26) + '" x2="' + (W - pad + 26) + '" y1="' + py({ y: st[1] }) + '" y2="' + py({ y: st[1] }) + '"/><text class="pm-sn" x="' + (W - 18) + '" y="' + (+py({ y: st[1] }) - 15) + '" text-anchor="end" direction="rtl">' + esc(st[0]) + '</text>';
      else h += '<line class="pm-st" y1="' + (pad - 26) + '" y2="' + (H - pad + 26) + '" x1="' + px({ x: st[1] }) + '" x2="' + px({ x: st[1] }) + '"/><text class="pm-sn" x="' + (+px({ x: st[1] }) - 13) + '" y="' + (H - 9) + '" text-anchor="end" direction="rtl">' + esc(st[0]) + '</text>';
    });
    sets.forEach(function (set, si) {
      var stl = MAP_STYLE[set.style % MAP_STYLE.length], d = '';
      set.rows.forEach(function (r, i) { d += i ? 'H' + px(r) + 'V' + py(r) : 'M' + px(r) + ',' + py(r); });
      h += '<path class="pm-route' + (set.ghost ? ' is-ghost' : '') + '" d="' + d + '" style="stroke:' + stl[1] + ';--i:' + si + '"/>';
    });
    sets.forEach(function (set) {
      if (set.ghost) return;
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
    var st = SC.purim, cfg = routeCfg(), cur = simulate(gr.rows, cfg), best = bestRoute(gr.rows, cfg), bs = simulate(best, cfg);
    var gain = cur.totalMin - bs.totalMin, fixes = cur.late - bs.late, hasBetter = gain >= 3 || fixes > 0;
    var showBest = st.better && hasBetter, order = showBest ? best : gr.rows, sim = showBest ? bs : cur;
    var bulb = !hasBetter ? '<div class="pm-ok">' + g('checkc') + '<span><b>זה המסלול הקצר ביותר שמצאנו</b>לא נמצא סדר שחוסך זמן.</span></div>'
      : showBest ? '<div class="bulb is-on"><span class="bulb-i">' + g('bulb') + '</span><span><b>מוצג המסלול הקצר</b>' + (gain >= 1 ? 'חוסך ' + minT(gain) : 'אותו זמן') + (fixes > 0 ? ' · מגיעים בזמן לכל הכתובות' : '') + '</span>' +
        '<button type="button" class="btn btn-s btn-o" data-scr="pbetter:0">חזרה למסלול המקורי</button><button type="button" class="btn btn-s btn-k" data-scr="pkeep">שמירת הסדר הזה</button></div>'
        : '<button type="button" class="bulb" data-scr="pbetter:1"><span class="bulb-i">' + g('bulb') + '</span><span><b>נמצא מסלול ' + (gain >= 1 ? 'קצר' : 'טוב') + ' יותר</b>' + (gain >= 1 ? 'חוסך ' + minT(gain) : '') + (fixes > 0 ? (gain >= 1 ? ', ו' : '') + 'מגיעים בזמן גם ל' + (fixes === 1 ? 'כתובת עם השעות' : fixes + ' כתובות עם שעות') : '') + '. לחיצה מציגה אותו.</span>' + g('chev') + '</button>';
    var rows = sim.steps.map(function (s, i) {
      var r = s.row;
      return '<div class="pm-row' + (s.late || s.over ? ' is-bad' : '') + '"><span class="pm-n">' + (i + 1) + '</span><span class="pm-t"><b>' + esc(r.family) + ' <small>' + esc(r.first) + '</small></b><i>' + esc(r.street) + ' ' + r.house + ' · דירה ' + r.apt + '</i></span>' +
        '<span class="pm-e">' + (r.win ? '<span class="tag ' + (s.late ? 't-bad' : 't-warn') + '">' + esc(winText(r.win)) + '</span>' : '') + (s.wait >= 1 ? '<i>המתנה ' + minT(s.wait) + '</i>' : '') + '</span><b class="pm-h" dir="ltr">' + fmtT(s.arrive) + '</b></div>';
    }).join('');
    var warn = sim.late || sim.over ? '<p class="pm-warn">' + (sim.late ? (sim.late === 1 ? 'לכתובת אחת עם שעות מגיעים מאוחר מדי. ' : 'ל-' + sim.late + ' כתובות עם שעות מגיעים מאוחר מדי. ') : '') + (sim.over ? addrN(sim.over) + (sim.over === 1 ? ' נשארת' : ' נשארות') + ' אחרי ' + esc(RT.end) + '.' : '') + '</p>' : '';
    return '<div class="pm"><div class="pm-list">' + bulb + warn + '<div class="pm-rows">' + rows + '</div><p class="ml-foot">' + RT.per + ' דקות בכל כתובת · הליכה במהירות 4.5 קמ״ש · כל כתובת מחושבת בנפרד</p></div>' +
      '<aside class="panel pm-map"><div class="panel-h"><h3><span class="lt">' + esc(gr.city) + ' · ' + esc(gr.group) + '</span>' + (showBest ? 'המסלול הקצר' : 'המסלול לפי הרשימה') + '</h3></div>' + statsH(sim) +
      mapSVG((showBest ? [{ rows: gr.rows, style: 3, ghost: true }] : []).concat([{ rows: order, style: 0, sim: sim }]), 'מפת המסלול של ' + gr.group) +
      '<div class="leg pm-leg"><span><i class="pl-pin"></i>כתובת לפי סדר הביקור</span><span><i class="pl-win"></i>כתובת עם שעות</span>' + (showBest ? '<span><i class="pl-ghost"></i>המסלול המקורי</span>' : '') + '</div></aside></div>';
  }

  /* ---------- בניית מסלולים אוטומטית ---------- */
  function cityRows(city) { var all = []; purimGroupsOf(city).forEach(function (gr) { all = all.concat(gr.rows); }); return all; }
  function planView(city) {
    var pl = SC.purim.plan, rows = cityRows(city);
    if (!pl.res) pl.res = buildPlan(rows, pl);
    var res = pl.res, late = 0, over = 0, maxEnd = 0, walk = 0;
    res.forEach(function (gp) { late += gp.sim.late; over += gp.sim.over; maxEnd = Math.max(maxEnd, gp.sim.endMin); walk += gp.sim.walkM; });
    var cards = res.map(function (gp, i) {
      var stl = MAP_STYLE[i % MAP_STYLE.length];
      return '<div class="pl-card"><span class="pl-dot" style="background:' + stl[0] + ';border-color:' + stl[1] + ';color:' + stl[2] + '">' + LETTERS[i].charAt(0) + '</span><span class="pl-tx"><b>קבוצה ' + LETTERS[i] + '</b><i>' + addrN(gp.rows.length) + ' · הליכה ' + kmT(gp.sim.walkM) + '</i>' +
        (pl.mode === 'area' ? '<i>חזרה לכל כתובת: עד ' + minT(gp.back) + ' הליכה</i>' : '<i>מקצה לקצה: ' + minT(gp.back) + ' הליכה</i>') + '</span>' +
        '<span class="pl-end"><b dir="ltr">' + fmtT(gp.sim.endMin) + '</b><i>סיום</i>' + (gp.sim.late || gp.sim.over ? '<span class="tag t-bad">' + (gp.sim.late + gp.sim.over) + ' לא בזמן</span>' : '<span class="tag t-good">הכול בזמן</span>') + '</span></div>';
    }).join('');
    function fnum(fid, label, v, extra) { return '<div class="fld"><label for="' + P + fid + '">' + label + '</label><div class="uin"><input id="' + P + fid + '" type="text" value="' + esc(v) + '" autocomplete="off" dir="ltr" style="text-align:right" data-plan="' + fid + '"' + (extra || '') + '></div></div>'; }
    return '<div class="pm pm-plan"><div class="pm-list"><form class="pl-form" data-form="plan" novalidate><div class="sh pl-h"><span class="dot"></span><h2><span class="lt">' + rows.length + ' כתובות ב' + esc(city) + '</span>בניית מסלולים</h2></div>' +
      '<div class="dform pl-grid">' + fnum('pl-k', 'כמה קבוצות', pl.k, ' inputmode="numeric"') + fnum('pl-per', 'דקות בכל כתובת', pl.per, ' inputmode="numeric"') + fnum('pl-start', 'שעת התחלה', pl.start) + fnum('pl-end', 'לסיים עד', pl.end) + '</div>' +
      '<div class="fld pl-mode"><span class="lb">מה חשוב יותר</span><div class="seg" role="radiogroup"><label><input type="radio" name="' + P + 'pl-mode" value="area"' + (pl.mode === 'area' ? ' checked' : '') + ' data-plan="mode">' + BRUSH + '<span>אזורים (מומלץ)</span></label>' +
      '<label><input type="radio" name="' + P + 'pl-mode" value="line"' + (pl.mode === 'line' ? ' checked' : '') + ' data-plan="mode">' + BRUSH + '<span>מסלול ארוך</span></label></div></div>' +
      '<p class="scr-note pl-exp">' + (pl.mode === 'area' ? '<b>אזורים:</b> כל קבוצה מקבלת אזור מרוכז. אם לא ענו בכתובת, אפשר לחזור אליה אחר כך בלי לאבד הרבה זמן.' : '<b>מסלול ארוך:</b> קו אחד רציף שמתחלק בין הקבוצות, וכל קבוצה ממשיכה מהמקום שבו הקודמת סיימה. מי שלא ענה נשאר מאחור, ואין דרך לחזור אליו.') + '</p>' +
      '<div class="pl-acts"><button type="submit" class="btn btn-k">חישוב מחדש' + g('chev2') + '</button><button type="button" class="btn btn-o" data-scr="pplan-off">ביטול</button></div></form>' +
      '<div class="pl-cards">' + cards + '</div>' +
      '<div class="pl-acts pl-apply"><button type="button" class="btn" data-scr="pplan-apply">אישור החלוקה' + g('chev2') + '</button><span class="scr-note">הקבוצות הקיימות ב' + esc(city) + ' יוחלפו ב-' + res.length + ' הקבוצות האלה.</span></div></div>' +
      '<aside class="panel pm-map"><div class="panel-h"><h3><span class="lt">' + esc(city) + ' · ' + res.length + ' קבוצות</span>' + (pl.mode === 'area' ? 'חלוקה לאזורים' : 'מסלול ארוך אחד') + '</h3></div>' +
      '<div class="pm-stats"><span><i>סך ההליכה</i><b>' + kmT(walk) + '</b><u>לכל הקבוצות</u></span><span><i>כתובות</i><b>' + rows.length + '</b><u>' + (late + over ? (late + over) + ' לא בזמן' : 'כולן בזמן') + '</u></span><span class="is-end"><i>האחרונה מסיימת</i><b dir="ltr">' + fmtT(maxEnd) + '</b><u>התחלה ' + esc(pl.start) + '</u></span></div>' +
      mapSVG(res.map(function (gp, i) { return { rows: gp.rows, style: i, sim: gp.sim, letter: LETTERS[i].charAt(0) }; }), 'מפת החלוקה לקבוצות') +
      '<div class="leg pm-leg">' + res.map(function (gp, i) { var stl = MAP_STYLE[i % MAP_STYLE.length]; return '<span><i class="pl-pin" style="background:' + stl[0] + ';border-color:' + stl[1] + '"></i>קבוצה ' + LETTERS[i] + '</span>'; }).join('') + '<span><i class="pl-win"></i>כתובת עם שעות</span></div></aside></div>';
  }
  function planRead() {
    var pl = SC.purim.plan, k = parseInt(val('pl-k'), 10), per = parseInt(val('pl-per'), 10), ok = /^\d{1,2}:\d{2}$/;
    var mode = ($('input[name="' + P + 'pl-mode"]:checked', id('scr')) || {}).value;
    pl.k = Math.max(1, Math.min(6, k || pl.k)); pl.per = Math.max(1, Math.min(30, per || pl.per));
    if (ok.test(val('pl-start'))) pl.start = val('pl-start');
    if (ok.test(val('pl-end'))) pl.end = val('pl-end');
    if (mode) pl.mode = mode;
    pl.k = Math.min(pl.k, cityRows(SC.purim.city).length);
    pl.res = null;
  }
  function routeAct(a, v) {
    var st = SC.purim, X = D.purimX, groups, gr, old;
    if (!st.city) st.city = X.cities[0];
    if (a === 'pmap') { st.map = !st.map; st.better = false; st.edit = false; st.plan = null; scrDraw(); if (st.map) scrollToEl($('.scr-bar', id('scr'))); return true; }
    if (a === 'pbetter') { st.better = v === '1'; scrDraw(); return true; }
    if (a === 'pkeep') {
      groups = purimGroupsOf(st.city); gr = groups[Math.min(st.group, groups.length - 1)];
      gr.rows = bestRoute(gr.rows, routeCfg()); gr.rows.forEach(function (r, i) { r.n = i + 1; }); st.better = false; scrDraw(); toast('סדר הכתובות עודכן למסלול הקצר', 'check'); return true;
    }
    if (a === 'pplan') { st.plan = { k: purimGroupsOf(st.city).length, per: RT.per, start: RT.start, end: RT.end, mode: 'area', res: null }; st.map = true; st.edit = false; if (S.soon !== 'purim') go('purim'); else scrDraw(); scrollToEl($('.scr-bar', id('scr'))); return true; }
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
