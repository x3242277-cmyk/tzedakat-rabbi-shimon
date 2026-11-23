/* העיצוב החדש על המערכת האמיתית: כתובות פורים, סכומי פורים, ייצוא והדפסה.
   נטען אחרי nd/boot.js ומוסיף פעולות ל-window.TZ_HOST.

   שמירה: כמו בשאר החיבורים, לא משכפלים חוקי שמירה. ממלאים את המסך הקיים (המוסתר) ומפעילים את השמירה שלו:
   - savePurimRows   נכנס ל"עריכה" של הקבוצה במסך כתובות פורים הקיים, כותב לתאים ומפעיל את "שמור" (togglePurimGroupEdit).
   - savePurimSums   ממלא את טבלת "סכומי פורים" שבהגדרות ומפעיל את "שמור סכומים".
   ייצוא והדפסה של קבוצת פורים: הפונקציות הקיימות (exportPurimGroupToExcel, printPurimGroup).
   ייצוא בחורים: השורות של הטבלה הקיימת (renderMembersTable) דרך exportToCSV הקיימת, רק לבחורים שהתבקשו ובסדר שהתבקש.
   הדפסת בחורים ודוחות: מסמך הדפסה נפרד (iframe מוסתר), כי הדף עצמו מציג עכשיו את העיצוב החדש.
   אין סקריפט בתוך מסמך ההדפסה (Content-Security-Policy): ההדפסה מופעלת מכאן. */
(function () {
  'use strict';

  var H = window.TZ_HOST, _ = H && H._;
  if (!H || !_) return;

  var ORG = 'צדקת רבי שמעון';
  var NO_EDIT = 'אין לך הרשאת עריכה';
  var GENERIC = 'הפעולה לא בוצעה. אפשר לנסות שוב';
  var NOT_SAVED = 'השינויים לא נשמרו. אפשר לנסות שוב';
  var POPUP_BLOCKED = 'הדפדפן חסם את חלון ההדפסה. יש לאפשר חלונות קופצים לאתר';
  var NO_CHANGES = 'לא בוצעו שינויים';
  var PURIM_FIELDS = ['משפחה', 'שם', 'רחוב', 'מספר', 'דירה', 'הערות'];
  var FRAME_ID = 'nd-print-frame';

  /* ---------- כלי עזר ---------- */
  function fail(msg) { return { ok: false, error: msg || GENERIC }; }
  function log(e) { try { console.error('nd host-purim', e); } catch (e2) {} }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function each(list, f) { Array.prototype.forEach.call(list || [], f); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function text(node) { return String(node ? node.textContent : '').replace(/\s+/g, ' ').trim(); }
  function money(v) {
    try { if (_.fn('formatCurrency')) return window.formatCurrency(v); } catch (e) {}
    return '₪' + Math.round(num(v)).toLocaleString('he-IL');
  }
  function hebYears() { try { return typeof HEBREW_YEARS_ORDER !== 'undefined' && HEBREW_YEARS_ORDER ? HEBREW_YEARS_ORDER : []; } catch (e) { return []; } }
  function screenTitle(screenId, fallback) {
    try { if (typeof screenMeta !== 'undefined' && screenMeta[screenId] && screenMeta[screenId].title) return screenMeta[screenId].title; } catch (e) {}
    return fallback;
  }
  function toast(msg) { try { if (_.fn('showToast')) window.showToast(msg, 'success'); } catch (e) { log(e); } }
  // פעולה שלא נכשלת החוצה: כל חריגה הופכת להודעת שגיאה
  function guard(f) {
    return function () {
      try { return f.apply(this, arguments) || { ok: true }; }
      catch (e) { log(e); return fail(GENERIC); }
    };
  }
  // מפעיל פונקציה קיימת של המערכת בלי להציג את ההודעות שלה: הודעת שגיאה חוזרת כתוצאה, והעיצוב החדש מציג אותה פעם אחת
  function quiet(call) {
    var prev = window.showToast, box = [], bad;
    window.showToast = function (msg, type) { box.push({ msg: String(msg), type: type || 'success' }); };
    try { call(); } catch (e) { log(e); box.push({ msg: GENERIC, type: 'danger' }); } finally { window.showToast = prev; }
    bad = box.filter(function (t) { return t.type === 'danger' || t.type === 'warning'; })[0];
    return bad ? fail(bad.msg) : { ok: true };
  }

  /* ---------- כתובות פורים: שמירת שורות ---------- */
  function purimCity(row) { return String(row['עיר'] || 'ללא עיר').trim(); }
  function purimGroup(row) { return String(row['קבוצה'] || 'ללא שיוך').trim(); }
  function purimCur(row, field) { return String(row[field] || '').trim(); }       // אותה השוואה של השמירה הקיימת
  function purimCell(scope, idx, field) {
    var tds = scope.querySelectorAll('td[data-row="' + idx + '"]'), i;
    for (i = 0; i < tds.length; i++) if (tds[i].getAttribute('data-field') === field) return tds[i];
    return null;
  }
  function purimKey(city, group) {
    var i, g;
    if (!_.fn('getPurimGroup')) return '';
    for (i = 1; i < 100000; i++) {
      g = window.getPurimGroup('pg' + i);
      if (!g) return '';
      if (g.city === city && g.group === group) return 'pg' + i;
    }
    return '';
  }

  function savePurimRows(changes) {
    if (!_.canEdit()) return fail(NO_EDIT);
    if (!Array.isArray(changes)) return fail(GENERIC);
    var st = _.state(), all = arr(st.purimAddresses), box = _.el('purim-tabs-container');
    if (!box || !_.fn('renderPurimGroups') || !_.fn('togglePurimGroupEdit') || !_.fn('getPurimYearsToShow')) return fail(GENERIC);

    // 1. מה באמת השתנה (אותה נורמליזציה של השמירה הקיימת: טקסט, בלי רווחים בקצוות)
    var years = hebYears(), want = {}, order = [], err = '';
    changes.forEach(function (c) {
      var idx = -1, i, fields;
      if (err) return;
      if (!c || !c.sbId) { err = 'יש כתובת שעוד לא נשמרה בשרת. כדאי לרענן את הנתונים ולנסות שוב'; return; }
      for (i = 0; i < all.length; i++) if (all[i] && String(all[i].__sbId) === String(c.sbId)) { idx = i; break; }
      if (idx === -1) { err = 'הכתובת לא נמצאה. כדאי לרענן את הנתונים ולנסות שוב'; return; }
      fields = c.fields && typeof c.fields === 'object' ? c.fields : {};
      Object.keys(fields).forEach(function (f) {
        if (PURIM_FIELDS.indexOf(f) === -1 && years.indexOf(f) === -1) { err = 'אי אפשר לערוך כאן את השדה "' + f + '"'; return; }
        if (!want[idx]) { want[idx] = {}; order.push(idx); }
        want[idx][f] = String(fields[f] == null ? '' : fields[f]).trim();
      });
    });
    if (err) return fail(err);
    var plan = order.map(function (idx) {
      var row = all[idx];
      return { idx: idx, row: row, cells: Object.keys(want[idx]).map(function (f) { return { field: f, value: want[idx][f] }; }).filter(function (c) { return purimCur(row, c.field) !== c.value; }) };
    }).filter(function (p) { return p.cells.length; });
    if (!plan.length) { toast(NO_CHANGES); return { ok: true, saved: 0 }; }

    // 2. עמודת שנה שלא מוצגת בטבלה הקיימת (מוצגות 4 שנים, או 8 ב"כל השנים")
    var prevAll = st.purimShowAllYears, flipped = false;
    function hiddenYear() {
      var shown = arr(window.getPurimYearsToShow()), bad = '';
      plan.forEach(function (p) { p.cells.forEach(function (c) { if (!bad && years.indexOf(c.field) > -1 && shown.indexOf(c.field) === -1) bad = c.field; }); });
      return bad;
    }
    if (hiddenYear()) { st.purimShowAllYears = true; flipped = true; }
    err = hiddenYear();
    if (err) { st.purimShowAllYears = prevAll; return fail('אי אפשר לערוך כאן את שנת ' + err); }

    // 3. המסך הקיים: עריכה, כתיבה לתאים, שמור. קבוצה אחרי קבוצה, כמו שעושים ביד
    var res;
    try {
      res = _.run(function () {
        var groups = [], byGroup = {};
        plan.forEach(function (p) {
          var k = purimCity(p.row) + '\n' + purimGroup(p.row);
          if (!byGroup[k]) { byGroup[k] = []; groups.push(byGroup[k]); }
          byGroup[k].push(p);
        });
        window.renderPurimGroups();   // טבלה נקייה, גם אם נשארה עריכה פתוחה במסך הקודם
        plan.forEach(function (p) { p.cells.forEach(function (c) { if (!purimCell(box, p.idx, c.field)) throw new Error('purim cell not found: ' + p.idx + ' ' + c.field); }); });
        groups.forEach(function (items) {
          var first = purimCell(box, items[0].idx, items[0].cells[0].field);
          var pane = first && first.closest('.purim-tab-pane'), key = pane && pane.getAttribute('data-group-key'), table = pane && pane.querySelector('table'), p1, p2;
          if (!key || !table) throw new Error('purim pane not found');
          p1 = window.togglePurimGroupEdit(key);                      // "עריכה"
          if (p1 && p1.catch) p1.catch(log);
          if (!table.classList.contains('editing-mode')) throw new Error('purim edit mode did not start');
          items.forEach(function (p) { p.cells.forEach(function (c) { purimCell(pane, p.idx, c.field).textContent = c.value; }); });
          p2 = window.togglePurimGroupEdit(key);                      // "שמור": מעדכן, שומר מקומית, שולח לשרת (או לתור) ורושם ביומן
          if (p2 && p2.catch) p2.catch(log);
        });
      });
    } finally {
      if (flipped) st.purimShowAllYears = prevAll;
      if (flipped || !res || !res.ok) { try { window.renderPurimGroups(); } catch (e) { log(e); } }
    }
    if (!res.ok) return res;
    if (!plan.every(function (p) { return p.cells.every(function (c) { return purimCur(p.row, c.field) === c.value; }); })) {
      try { window.renderPurimGroups(); } catch (e) { log(e); }
      _.sync();
      return fail(NOT_SAVED);
    }
    _.sync();
    return { ok: true, saved: plan.length };
  }

  /* ---------- סכומי פורים (הגדרות) ---------- */
  // הערך שנכתב לתא: כמו שדה המספר הקיים. אותו מספר שכבר שמור = התא לא נוגעים בו; 0 או ריק = תא ריק
  function sumTarget(v, old) {
    var n = typeof v === 'number' ? v : Number(String(v == null ? '' : v).replace(/[,₪\s]/g, ''));
    if (!isFinite(n)) n = 0;
    if (n === num(old)) return old;
    return n === 0 ? '' : String(n);
  }
  function savePurimSums(sums) {
    if (!_.canEdit()) return fail(NO_EDIT);
    // ההגדרות נשמרות בשרת רק למנהל; במערכת הקיימת המסך הזה מוצג רק לו
    if (_.fn('isAdminUser') && !window.isAdminUser()) return fail('רק מנהל יכול לשנות את סכומי הפורים');
    if (!sums || typeof sums !== 'object') return fail(GENERIC);
    var list = _.el('purim-sums-settings-list');
    if (!list || !_.fn('renderPurimSumsSettings')) return fail(GENERIC);
    function stored(g, y) { var m = (_.state().settings || {}).purimManualSums; return String((m && m[g] && m[g][y]) || ''); }

    window.renderPurimSumsSettings();
    var btn = _.el('btn-save-purim-sums'), inputs = list.querySelectorAll('.purim-sum-setting-input');
    if (!btn || typeof btn.onclick !== 'function' || !inputs.length) return fail('אין עדיין קבוצות פורים');

    var cells = {}, todo = [], err = '';
    each(inputs, function (inp) { cells[inp.getAttribute('data-group') + '\n' + inp.getAttribute('data-year')] = inp; });
    Object.keys(sums).forEach(function (g) {
      var row = sums[g];
      if (!row || typeof row !== 'object') return;
      Object.keys(row).forEach(function (y) {
        var old = stored(g, y), value = sumTarget(row[y], old);
        if (value === old) return;
        if (!cells[g + '\n' + y]) { err = err || 'אי אפשר לשמור כאן סכום לקבוצה "' + g + '" בשנת ' + y; return; }
        todo.push({ group: g, year: y, value: value });
      });
    });
    if (err) return fail(err);

    // תא שלא ביקשו לשנות נשאר בדיוק כפי שהוא שמור (שדה מספר מרוקן ערך שאינו מספר, והשמירה הקיימת הייתה רואה בזה שינוי)
    each(inputs, function (inp) {
      var g = inp.getAttribute('data-group'), y = inp.getAttribute('data-year'), value = stored(g, y);
      todo.forEach(function (t) { if (t.group === g && t.year === y) value = t.value; });
      inp.value = value;
      if (inp.value !== value) { try { inp.type = 'text'; } catch (e) {} inp.value = value; }
    });

    var res = _.run(function () { btn.onclick.call(btn); });   // "שמור סכומים": שומר רק תאים ששונו, או מודיע שאין שינויים
    if (!res.ok) { try { window.renderPurimSumsSettings(); } catch (e) { log(e); } return res; }
    if (!todo.every(function (t) { return stored(t.group, t.year) === t.value; })) return fail(NOT_SAVED);
    _.sync();
    return { ok: true, changed: todo.length > 0 };
  }

  /* ---------- קבוצת פורים: ייצוא והדפסה (הפונקציות הקיימות) ---------- */
  function withPurimGroup(city, group, opts, call) {
    var st = _.state(), prevAll = st.purimShowAllYears, wantAll = !!(opts && opts.allYears), key, res;
    if (!_.el('purim-tabs-container') || !_.fn('renderPurimGroups')) return fail(GENERIC);
    st.purimShowAllYears = wantAll;     // אותן 4 שנים שמוצגות בעיצוב החדש (או 8 עם allYears)
    try {
      window.renderPurimGroups();
      key = purimKey(String(city == null ? '' : city), String(group == null ? '' : group));
      res = key ? quiet(function () { call(key); }) : fail('הקבוצה לא נמצאה. כדאי לרענן את הנתונים ולנסות שוב');
    } finally {
      st.purimShowAllYears = prevAll;
      if (!!prevAll !== wantAll) { try { window.renderPurimGroups(); } catch (e) { log(e); } }
    }
    return res;
  }
  function exportPurimGroup(city, group, opts) {
    if (!_.fn('exportPurimGroupToExcel')) return fail(GENERIC);
    return withPurimGroup(city, group, opts, function (key) { window.exportPurimGroupToExcel(key); });
  }
  function printPurimGroup(city, group, opts) {
    if (!_.fn('printPurimGroup')) return fail(GENERIC);
    return withPurimGroup(city, group, opts, function (key) { window.printPurimGroup(key); });   // חלון חסום = הודעת המערכת הקיימת
  }

  /* ---------- בחורים: השורות של הטבלה הקיימת ---------- */
  // הטבלה הקיימת מציגה רק את מה שעובר את הסינון שלה. מציירים אותה לרגע בלי סינון, מעתיקים את השורות שהתבקשו, ומחזירים את הסינון.
  function memberRows(ids) {
    var st = _.state(), body = _.el('members-table-body'), head = _.el('members-table-head');
    var q = _.el('search-members-list'), mar = _.el('filter-show-married'), ys = _.el('filter-members-yeshiva'), cs = _.el('filter-members-city');
    if (!body || !head || !head.querySelector('tr') || !_.fn('renderMembersTable')) return null;
    var keep = { q: q ? q.value : '', mar: mar ? mar.checked : false, ys: ys ? ys.value : '', cs: cs ? cs.value : '',
      y: st.filterYeshiva, c: st.filterCity, types: st.filterYeshivaTypes, edit: st.membersEditMode };
    var out = { head: null, rows: [] }, byId = Object.create(null);
    try {
      if (q) q.value = ''; if (mar) mar.checked = true; if (ys) ys.value = ''; if (cs) cs.value = '';
      st.filterYeshiva = ''; st.filterCity = ''; st.filterYeshivaTypes = []; st.membersEditMode = false;
      window.renderMembersTable();
      each(body.querySelectorAll('tr[data-member-id]'), function (tr) { byId[tr.getAttribute('data-member-id')] = tr; });
      ids.forEach(function (id) { var tr = byId[String(id)]; if (tr) out.rows.push(tr.cloneNode(true)); });
      out.head = head.querySelector('tr').cloneNode(true);
    } finally {
      if (q) q.value = keep.q; if (mar) mar.checked = keep.mar; if (ys) ys.value = keep.ys; if (cs) cs.value = keep.cs;
      st.filterYeshiva = keep.y; st.filterCity = keep.c; st.filterYeshivaTypes = keep.types; st.membersEditMode = keep.edit;
      try { window.renderMembersTable(); } catch (e) { log(e); }
    }
    return out;
  }
  function idList(ids) { return arr(ids).filter(function (id) { return id != null && id !== ''; }); }

  function exportMembers(ids) {
    ids = idList(ids);
    if (!_.fn('exportToCSV')) return fail(GENERIC);
    var got = ids.length ? memberRows(ids) : { rows: [] };
    if (!got) return fail(GENERIC);
    if (!got.rows.length) return fail('אין בחורים לייצוא');
    // טבלה זמנית מחוץ למסך (מצוירת, כדי שהטקסט ייקרא כמו בטבלה גלויה), ועליה הייצוא הקיים: אותן עמודות, BOM ושם קובץ
    var holder = document.createElement('div'), table = document.createElement('table'), thead = document.createElement('thead'), tbody = document.createElement('tbody');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:1400px;opacity:0;pointer-events:none';
    table.className = 'data-table compact-view';
    tbody.id = 'nd-export-members-body';
    thead.appendChild(got.head);
    got.rows.forEach(function (tr) { tbody.appendChild(tr); });
    table.appendChild(thead); table.appendChild(tbody); holder.appendChild(table);
    document.body.appendChild(holder);
    var res;
    try { res = quiet(function () { window.exportToCSV('nd-export-members-body', 'רשימת_בחורים'); }); }
    finally { if (holder.parentNode) holder.parentNode.removeChild(holder); }
    if (res.ok) res.count = got.rows.length;
    return res;
  }

  /* ---------- מסמך הדפסה נפרד ---------- */
  var PRINT_CSS = [
    '@page { size: A4; margin: 12mm 10mm; }',
    'html, body { background: #fff; color: #000; }',
    'body { font-family: Arial, Helvetica, sans-serif; direction: rtl; font-size: 12px; line-height: 1.35; margin: 16px; }',
    '.print-header { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px; }',
    '.print-header-title { font-size: 16px; font-weight: bold; }',
    '.print-header-meta { font-size: 11px; margin-top: 2px; }',
    'h2 { font-size: 13px; margin: 16px 0 6px; break-after: avoid; page-break-after: avoid; }',
    'table { border-collapse: collapse; width: 100%; }',
    'thead { display: table-header-group; }',
    'tfoot { display: table-row-group; }',
    'tr { break-inside: avoid; page-break-inside: avoid; }',
    'th, td { border: 1px solid #000; padding: 4px 7px; text-align: right; vertical-align: top; }',
    'th { font-weight: bold; }',
    '.num { text-align: left; direction: ltr; white-space: nowrap; }',
    'tfoot td, tr.total td { font-weight: bold; border-top: 2px solid #000; }',
    'tr.cat td, .cur { font-weight: bold; }',
    'td.sub { padding-right: 20px; }',
    'p { margin: 6px 0; }',
    '.note { font-size: 11px; }',
    'th.wide, td.wide { min-width: 170px; }',
    'td.nw { white-space: nowrap; }',
    '@media print { body { margin: 0; } }'
  ].join('\n');

  // "הודפס DD/MM/YYYY HH:MM ע"י משתמש", כמו בכותרת ההדפסה הקיימת (buildPrintHeader)
  function printStamp() {
    var now = new Date(), user = _.state().currentUser, p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'הודפס ' + p(now.getDate()) + '/' + p(now.getMonth() + 1) + '/' + now.getFullYear() + ' ' + p(now.getHours()) + ':' + p(now.getMinutes()) + (user ? ' ע"י ' + user : '');
  }
  function printHtml(title, metaParts, bodyHtml) {
    var head = ORG + ' · ' + title, meta = arr(metaParts).concat([printStamp()]).filter(Boolean).join(' · ');
    return '<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>' + esc(head) + '</title><style>' + PRINT_CSS + '</style></head><body>' +
      '<div class="print-header"><div class="print-header-title">' + esc(head) + '</div><div class="print-header-meta">' + esc(meta) + '</div></div>' +
      bodyHtml + '</body></html>';
  }
  function dropFrame() { var f = _.el(FRAME_ID); if (f && f.parentNode) f.parentNode.removeChild(f); }
  // מדפיס מסמך מתוך iframe מוסתר. אם זה לא אפשרי: חלון חדש, כמו הדפסת קבוצת פורים הקיימת
  function printDocument(html) {
    var frame = null, win = null, doc;
    try {
      dropFrame();
      frame = document.createElement('iframe');
      frame.id = FRAME_ID; frame.title = 'הדפסה'; frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
      frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(frame);
      win = frame.contentWindow; doc = win.document;
      doc.open(); doc.write(html); doc.close();
    } catch (e) { log(e); win = null; if (frame && frame.parentNode) frame.parentNode.removeChild(frame); frame = null; }
    if (win) {
      try { win.addEventListener('afterprint', function () { setTimeout(function () { if (frame && frame.parentNode) frame.parentNode.removeChild(frame); }, 1000); }); } catch (e) {}
      setTimeout(function () {
        var back = document.activeElement;
        while (back && back.shadowRoot && back.shadowRoot.activeElement) back = back.shadowRoot.activeElement;
        try { win.focus(); win.print(); } catch (e) { log(e); }
        try { if (back && back.focus) back.focus({ preventScroll: true }); } catch (e) {}   // המיקוד חוזר למקום שבו היה
      }, 250);
      return { ok: true };
    }
    try { win = window.open('', '_blank'); } catch (e) { win = null; }
    if (!win) return fail(POPUP_BLOCKED);
    try { win.document.write(html); win.document.close(); } catch (e) { log(e); try { win.close(); } catch (e2) {} return fail(GENERIC); }
    setTimeout(function () {
      try { win.focus(); win.print(); } catch (e) {}
      try { win.close(); } catch (e) {}
    }, 250);
    return { ok: true };
  }

  function th(label, cls) { return '<th' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(label) + '</th>'; }
  function td(value, cls, span) { return '<td' + (cls ? ' class="' + cls + '"' : '') + (span > 1 ? ' colspan="' + span + '"' : '') + '>' + esc(value) + '</td>'; }
  function tableHtml(headHtml, rowsHtml, footHtml) {
    return '<table><thead><tr>' + headHtml + '</tr></thead><tbody>' + rowsHtml + '</tbody>' + (footHtml ? '<tfoot>' + footHtml + '</tfoot>' : '') + '</table>';
  }
  function sum(list, key) { return Math.round(arr(list).reduce(function (a, x) { return a + num(x && x[key]); }, 0) * 100) / 100; }

  /* ---------- הדפסת רשימת הבחורים ---------- */
  function printMembers(ids, subtitle) {
    ids = idList(ids);
    var got = ids.length ? memberRows(ids) : { rows: [] };
    if (!got) return fail(GENERIC);
    if (!got.rows.length) return fail('אין בחורים להדפסה');
    // אותן עמודות של ההדפסה הקיימת: בלי "התקדמות" ובלי עמודת הפעולות (no-export), ובלי הכוכבית של פרטים חסרים
    var keepCol = [], headHtml = '', rowsHtml = '';
    each(got.head.children, function (cell, i) {
      keepCol[i] = !cell.classList.contains('no-export');
      if (keepCol[i]) headHtml += th(text(cell));
    });
    got.rows.forEach(function (tr) {
      each(tr.querySelectorAll('.missing-star'), function (s) { s.parentNode.removeChild(s); });
      rowsHtml += '<tr>';
      each(tr.children, function (cell, i) {
        if (keepCol[i] === false || cell.classList.contains('no-export')) return;
        rowsHtml += td(text(cell), cell.classList.contains('amount-cell') ? 'num' : '');
      });
      rowsHtml += '</tr>';
    });
    var res = printDocument(printHtml(screenTitle('members-screen', 'בחורים'), [String(subtitle == null ? '' : subtitle).trim(), got.rows.length + ' בחורים'], tableHtml(headHtml, rowsHtml)));
    if (res.ok) res.count = got.rows.length;
    return res;
  }

  /* ---------- הדפסת דוחות ---------- */
  function reportTransactions(p) {
    var income = p.income, expenses = p.expenses, html = '', parts = [];
    if (Array.isArray(income)) {
      html += '<h2>הכנסות (איסוף)</h2>';
      html += income.length ? tableHtml(th('תאריך') + th('בחור מזוכה') + th('אמצעי') + th('סכום', 'num'),
        income.map(function (r) { r = r || {}; return '<tr>' + td(r.date) + td(r.name) + td(r.method) + td(money(r.amount), 'num') + '</tr>'; }).join(''),
        '<tr>' + td('סה"כ הכנסות · ' + income.length + ' תנועות', '', 3) + td(money(sum(income, 'amount')), 'num') + '</tr>')
        : '<p>אין הכנסות בתקופה הזו</p>';
      parts.push('הכנסות ' + money(sum(income, 'amount')));
    }
    if (Array.isArray(expenses)) {
      html += '<h2>הוצאות קמפיין</h2>';
      html += expenses.length ? tableHtml(th('תאריך') + th('תיאור') + th('קטגוריה') + th('סכום', 'num'),
        expenses.map(function (r) { r = r || {}; return '<tr>' + td(r.date) + td(r.title) + td(r.category) + td(money(r.amount), 'num') + '</tr>'; }).join(''),
        '<tr>' + td('סה"כ הוצאות · ' + expenses.length + ' תנועות', '', 3) + td(money(sum(expenses, 'amount')), 'num') + '</tr>')
        : '<p>אין הוצאות בתקופה הזו</p>';
      parts.push('הוצאות ' + money(sum(expenses, 'amount')));
    }
    if (!html) return null;
    if (parts.length === 2) html += '<p class="note"><b>סיכום התקופה:</b> ' + esc(parts.join(' · ')) + '</p>';
    return printHtml(screenTitle('daily-report-screen', 'דו"ח תנועות'), [String(p.title == null ? '' : p.title).trim()], html);
  }
  function reportExpenses(p) {
    var years = arr(p.years).map(String), cur = String(p.year == null ? '' : p.year), totals = {}, rows = '';
    var cats = arr(p.categories).filter(function (c) {
      return c && (arr(c.items).length || years.some(function (y) { return num((c.byYear || {})[y]) !== 0; }));
    });
    if (!years.length || !cats.length) return null;
    function ycls(y) { return 'num' + (y === cur ? ' cur' : ''); }
    cats.forEach(function (c) {
      var by = c.byYear || {};
      rows += '<tr class="cat">' + td(c.name) + years.map(function (y) { totals[y] = (totals[y] || 0) + num(by[y]); return td(num(by[y]) ? money(by[y]) : '—', ycls(y)); }).join('') + '</tr>';
      arr(c.items).forEach(function (it) {
        it = it || {};
        rows += '<tr>' + td(it.name, 'sub') + years.map(function (y) { return td(num(it[y]) ? money(it[y]) : '—', ycls(y)); }).join('') + '</tr>';
      });
    });
    return printHtml(screenTitle('expenses-summary-screen', 'סיכום הוצאות'), [cur ? 'שנת ניתוח: ' + cur : ''],
      '<h2>פירוט לפי קטגוריה ושנה</h2>' + tableHtml(th('פירוט') + years.map(function (y) { return th(y, ycls(y)); }).join(''), rows,
        '<tr>' + td('סה"כ הוצאות') + years.map(function (y) { return td(money(Math.round(totals[y] * 100) / 100), 'num'); }).join('') + '</tr>'));
  }
  function reportGrants(p) {
    var year = String(p.year == null ? '' : p.year), half = String(p.halfLabel == null ? '' : p.halfLabel).trim(), view = p.view == null ? '' : String(p.view);
    var showRec = Array.isArray(p.recipients) && (!view || view === 'give' || view === 'recipients' || view === 'grant');
    var showBills = Array.isArray(p.bills) && (!view || !showRec);
    var html = '', meta = [year ? 'שנת ' + year : ''], recipients = arr(p.recipients), bills = arr(p.bills), paid;
    if (showRec) {
      meta.push('נתינת המענק');
      html += '<h2>' + esc('מקבלי המענק' + (year ? ' · ' + year : '')) + '</h2>';
      html += recipients.length ? tableHtml(th('#') + th('שם ומשפחה') + th('תעודת זהות') + th('טלפון') + th('תאריך'),
        recipients.map(function (r, i) { r = r || {}; return '<tr>' + td(r.n == null ? i + 1 : r.n) + td(r.name) + td(r.idn) + td(r.phone) + td(r.date) + '</tr>'; }).join(''),
        '<tr>' + td('סה"כ ' + recipients.length + ' מקבלי מענק', '', 5) + '</tr>')
        : '<p>אין עדיין מקבלי מענק בשנה הזו</p>';
    }
    if (showBills) {
      meta.push('תשלומים לחנויות' + (half ? ' · ' + half : ''));
      paid = sum(bills.filter(function (b) { return b && b.status === 'שולם'; }), 'billed');
      html += '<h2>' + esc('תשלומים לחנויות' + (half ? ' · ' + half : '')) + '</h2>';
      html += bills.length ? tableHtml(th('חנות') + th('צפי לפי חתנים', 'num') + th('לתשלום לפי קבלות', 'num') + th("מס' קבלה / חשבונית") + th('סטטוס'),
        bills.map(function (b) {
          b = b || {};
          var status = String(b.status == null ? '' : b.status) + (b.paidOn ? ' ב-' + b.paidOn : '') + (b.method ? ' · ' + b.method : '');
          return '<tr>' + td(b.store) + td(b.first === false ? '' : money(b.expected), 'num') + td(num(b.billed) ? money(b.billed) : '—', 'num') + td(b.ref) + td(status) + '</tr>';
        }).join(''),
        '<tr>' + td('סה"כ') + td(money(sum(bills, 'expected')), 'num') + td(money(sum(bills, 'billed')), 'num') + td('') +
          td('שולם ' + money(paid) + ' · נשאר ' + money(Math.round((sum(bills, 'billed') - paid) * 100) / 100)) + '</tr>')
        : '<p>אין עדיין חנויות לשנה הזו</p>';
    }
    if (!html) return null;
    return printHtml(screenTitle('grants-screen', 'מענקים'), meta, html);
  }
  /* ---------- חשבון שנתי של בחור: כל שנה בשורה, ומה נזקף לזכותו ---------- */
  // דף מעוצב לחתן, בצבעי המערכת (זהב ושחור). הטבלה והטקסטים מגיעים מוכנים מהעיצוב (statementOf),
  // כך שהכרטיס, ההדפסה והמייל מראים אותו דבר. הצבעים נשמרים גם בהדפסה (print-color-adjust).
  var STMT_CSS = [
    '@page { size: A4; margin: 10mm; }',
    '* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
    'html, body { margin: 0; background: #fff; color: #0B0B0B; }',
    'body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; direction: rtl; font-size: 12.5px; line-height: 1.45; }',
    '.pg { max-width: 190mm; margin: 0 auto; }',
    '.hd { position: relative; overflow: hidden; border-radius: 18px; padding: 20px 26px 22px; background: linear-gradient(120deg, #D9B85F 0%, #CEA130 55%, #B98A26 100%); color: #0B0B0B; }',
    '.hd::after { content: ""; position: absolute; left: -60px; bottom: -90px; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,.18); }',
    '.hd .org { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 13px; letter-spacing: .02em; }',
    '.hd .org img { width: 38px; height: 38px; border-radius: 50%; background: #fff; padding: 3px; }',
    '.hd .org span { opacity: .8; font-weight: 600; }',
    '.hd h1 { margin: 14px 0 2px; font-size: 26px; font-weight: 900; letter-spacing: -.01em; }',
    '.hd .who { font-size: 15px; font-weight: 700; }',
    '.hd .who i { font-style: normal; font-weight: 500; opacity: .8; }',
    '.hd .stamp { position: absolute; top: 18px; left: 24px; font-size: 10.5px; opacity: .75; }',
    'h2 { display: flex; align-items: center; gap: 8px; margin: 18px 0 8px; font-size: 14.5px; font-weight: 900; }',
    'h2::before { content: ""; width: 11px; height: 11px; border-radius: 50%; background: #CEA130; }',
    '.how { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }',
    '.how div { border-radius: 14px; padding: 10px 12px; background: #F9F4E5; border: 1.5px solid #E8D49B; }',
    '.how b { display: block; font-size: 13px; }',
    '.how span { display: block; margin-top: 3px; font-size: 12px; color: #3a3a3a; }',
    '.how em { font-style: normal; font-weight: 800; color: #8A6514; }',
    '.lead { margin: 0 0 8px; color: #3a3a3a; }',
    'table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 14px; overflow: hidden; border: 1.5px solid #E2E2E2; }',
    'thead { display: table-header-group; }',
    'tr { break-inside: avoid; page-break-inside: avoid; }',
    'th { background: #0B0B0B; color: #E3C46E; font-weight: 800; font-size: 12px; padding: 8px 9px; text-align: right; }',
    'td { padding: 7px 9px; border-top: 1px solid #EFEFEF; white-space: nowrap; }',
    'tbody tr:nth-child(even) td { background: #FBF8F0; }',
    'td.n, th.n { text-align: left; direction: ltr; }',
    'td.yr { font-weight: 800; }',
    'td.tot { font-weight: 800; color: #116A2B; }',
    'td.miss { font-weight: 800; color: #B0200F; }',
    'td.fix { font-weight: 800; color: #116A2B; }',
    'td.dash { color: #9a9a9a; }',
    'tfoot td { background: #F2E5C2; font-weight: 900; border-top: 2px solid #CEA130; }',
    '.notes { margin: 8px 2px 0; padding: 0; list-style: none; color: #595959; font-size: 11.5px; }',
    '.notes li { margin-top: 2px; }',
    '.notes li::before { content: "•"; color: #CEA130; margin-left: 6px; }',
    '.sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }',
    '.box { border-radius: 16px; padding: 12px 16px; text-align: center; }',
    '.box i { display: block; font-style: normal; font-size: 12px; font-weight: 700; }',
    '.box b { display: block; margin-top: 2px; font-size: 24px; font-weight: 900; direction: ltr; }',
    '.box.full { background: #fff; border: 2px solid #0B0B0B; }',
    '.box.got { background: linear-gradient(120deg, #D9B85F, #CEA130); }',
    '.box.miss { background: #0B0B0B; color: #fff; }',
    '.box.miss b { color: #E3C46E; }',
    '.box.ok { background: #E2F5E7; color: #116A2B; }',
    '.cta { margin-top: 12px; padding: 12px 18px; border-radius: 14px 14px 14px 40px; background: #F9F4E5; border: 1.5px solid #CEA130; font-size: 14px; font-weight: 700; text-align: center; }',
    '.ft { margin-top: 18px; padding-top: 8px; border-top: 1px solid #E2E2E2; display: flex; justify-content: space-between; color: #8a8a8a; font-size: 10.5px; }'
  ].join('\n');
  function reportStatement(p) {
    var rows = arr(p.rows).filter(Boolean), t = p.totals || {}, gr = p.grant || {}, sm = arr(p.summary), notes = arr(p.notes);
    if (!rows.length) return null;
    var m = function (v) { return v ? money(v) : '—'; };
    var cell = function (v, cls) { return '<td class="' + (v ? cls : cls + ' dash') + '">' + esc(m(v)) + '</td>'; };
    var logo = '';
    try { logo = new URL('assets/img/nd/logo.png', document.baseURI).href; } catch (e) {}
    var html = '<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>' + esc('דף חשבון · מענק חתן · ' + (p.name || '')) + '</title><style>' + STMT_CSS + '</style></head><body><div class="pg">';
    html += '<div class="hd"><div class="org">' + (logo ? '<img src="' + esc(logo) + '" alt="">' : '') + esc(ORG) + ' <span>· עזרת חתנים</span></div>' +
      '<div class="stamp">' + esc(printStamp()) + '</div>' +
      '<h1>דף חשבון · מענק חתן</h1><div class="who">' + esc(p.name || '') + (p.sub ? ' <i>· ' + esc(p.sub) + '</i>' : '') + '</div></div>';
    if (gr.full) {
      html += '<h2>מבנה המענק</h2><p class="lead">' + esc('מענק החתן המלא עומד על ' + money(gr.full) + '. בכל שנת לימוד מפקיד הבחור את היעד השנתי, והארגון מוסיף סכום זהה.') + '</p>' +
        '<div class="how"><div><b>ישיבה קטנה · שיעורים א׳–ג׳</b><span>הפקדה שנתית ' + esc(money(gr.k)) + '<br>תוספת הארגון <em>' + esc(money(gr.k)) + '</em></span></div>' +
        '<div><b>ישיבה גדולה · שיעורים א׳–ב׳</b><span>הפקדה שנתית ' + esc(money(gr.gd)) + '<br>תוספת הארגון <em>' + esc(money(gr.gd)) + '</em></span></div>' +
        '<div><b>ישיבה גדולה · שיעור ג׳</b><span>הפקדה שנתית ' + esc(money(gr.gd)) + '<br>ללא תוספת</span></div></div>';
    }
    html += '<h2>פירוט לפי שנים</h2><table><thead><tr><th>שנה</th><th>מסגרת</th><th class="n">יעד שנתי</th><th class="n">הופקד</th><th class="n">נחשב למענק</th><th class="n">תוספת הארגון</th><th class="n">סה"כ למענק</th><th class="n">חוסר</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var miss = r.lost > 0 ? '<td class="n miss">' + esc(money(r.lost)) + '</td>' : r.repay > 0 ? '<td class="fix">' + esc('השלמת חוסר ' + money(r.repay)) + '</td>' : '<td class="n dash">—</td>';
        return '<tr><td class="yr">' + esc(r.year) + '</td><td>' + esc(r.frame) + '</td>' + cell(r.target, 'n') + '<td class="n">' + esc(money(r.collected)) + '</td>' +
          cell(r.own, 'n') + cell(r.add, 'n') + cell(r.total, 'n tot') + miss + '</tr>';
      }).join('') + '</tbody><tfoot><tr><td colspan="3">סה"כ</td><td class="n">' + esc(money(t.collected)) + '</td><td class="n">' + esc(money(t.own)) + '</td><td class="n">' +
      esc(money(t.add)) + '</td><td class="n">' + esc(money(t.total)) + '</td><td class="n">' + esc(m(t.missing)) + '</td></tr></tfoot></table>';
    if (notes.length) html += '<ul class="notes">' + notes.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
    html += '<div class="sum"><div class="box full"><i>' + (gr.complete ? 'מענק מלא' : 'סכום אפשרי עד כה') + '</i><b>' + esc(money(t.full != null ? t.full : gr.full)) + '</b></div>' +
      '<div class="box got"><i>נצבר עד כה</i><b>' + esc(money(t.total)) + '</b></div>' +
      (t.missing > 0 ? '<div class="box miss"><i>יתרה להשלמה</i><b>' + esc(money(t.missing)) + '</b></div>' : '<div class="box ok"><i>יתרה להשלמה</i><b>₪0</b></div>') + '</div>';
    if (sm.length > 1) html += '<div class="cta">' + esc(sm[1]) + '</div>';
    html += '<div class="ft"><span>' + esc(ORG) + ' · עזרת חתנים</span><span>' + esc(p.name || '') + '</span></div>';
    return html + '</div></body></html>';
  }

  /* ---------- מתנות: רשימת הזכאים כפי שהיא מוצגת במסך (שנה, מתנה וישיבה שנבחרו) ---------- */
  function giftMeta(p) { return [p.year ? 'שנת ' + p.year : '', String(p.title == null ? '' : p.title).trim()]; }
  function reportGifts(p) {
    var rows = arr(p.rows).filter(Boolean), gifts = arr(p.gifts).map(String);
    if (!rows.length) return null;
    var totals = gifts.map(function (g, gi) { return rows.filter(function (r) { return arr(r.got)[gi]; }).length; });
    // "נמסר": עמודה ריקה לסימון ביד בזמן החלוקה
    return printHtml('מתנות', giftMeta(p), '<h2>' + esc('זכאים למתנות' + (p.year ? ' · ' + p.year : '')) + '</h2>' + tableHtml(
      th('#') + th('שם ומשפחה') + th('ישיבה') + th('מסגרת') + th('טלפון') + th('נאסף בשנה', 'num') + gifts.map(function (g) { return th(g); }).join('') + th('נמסר'),
      rows.map(function (r, i) {
        return '<tr>' + td(i + 1) + td(r.full) + td(r.yeshiva) + td(r.frame) + td(r.phone) + td(money(r.collected), 'num') +
          gifts.map(function (g, gi) { return td(arr(r.got)[gi] ? '✓' : ''); }).join('') + td('') + '</tr>';
      }).join(''),
      '<tr>' + td('סה"כ ' + rows.length + ' בחורים', '', 6) + totals.map(function (n) { return td(n); }).join('') + td('') + '</tr>'));
  }
  function exportGifts(p) {
    p = p && typeof p === 'object' ? p : {};
    var rows = arr(p.rows).filter(Boolean), gifts = arr(p.gifts).map(String);
    if (!_.fn('exportToCSV')) return fail(GENERIC);
    if (!rows.length) return fail('אין זכאים לייצוא');
    // טקסט שמתחיל בסימן של נוסחה לא ייפתח באקסל כנוסחה
    function plain(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
    function row(cells, tag) { var tr = document.createElement('tr'); cells.forEach(function (c) { var el = document.createElement(tag); el.textContent = c; tr.appendChild(el); }); return tr; }
    // טבלה זמנית מחוץ למסך, ועליה הייצוא הקיים: אותו מבנה קובץ כמו בשאר הייצואים
    var holder = document.createElement('div'), table = document.createElement('table'), thead = document.createElement('thead'), tbody = document.createElement('tbody'), res;
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:1400px;opacity:0;pointer-events:none';
    tbody.id = 'nd-export-gifts-body';
    thead.appendChild(row(['#', 'שם פרטי', 'שם משפחה', 'ישיבה', 'מסגרת', 'טלפון', 'שנה', 'נאסף בשנה'].concat(gifts), 'th'));
    rows.forEach(function (r, i) {
      tbody.appendChild(row([i + 1, plain(r.first), plain(r.last), plain(r.yeshiva), plain(r.frame), plain(r.phone), p.year || '', num(r.collected)]
        .concat(gifts.map(function (g, gi) { return arr(r.got)[gi] ? 'זכאי' : ''; })), 'td'));
    });
    table.appendChild(thead); table.appendChild(tbody); holder.appendChild(table);
    document.body.appendChild(holder);
    try { res = quiet(function () { window.exportToCSV('nd-export-gifts-body', 'זכאים_למתנות' + (p.year ? '_' + String(p.year).replace(/["״']/g, '') : '')); }); }
    finally { if (holder.parentNode) holder.parentNode.removeChild(holder); }
    if (res.ok) res.count = rows.length;
    return res;
  }

  function printReport(kind, payload) {
    var p = payload && typeof payload === 'object' ? payload : {}, html;
    if (kind === 'transactions') html = reportTransactions(p);
    else if (kind === 'expenses') html = reportExpenses(p);
    else if (kind === 'grants') html = reportGrants(p);
    else if (kind === 'gifts') html = reportGifts(p);
    else if (kind === 'statement') html = reportStatement(p);
    else return fail(GENERIC);
    if (!html) return fail('אין נתונים להדפסה');
    return printDocument(html);
  }

  Object.assign(window.TZ_HOST, {
    savePurimRows: guard(savePurimRows),
    savePurimSums: guard(savePurimSums),
    exportPurimGroup: guard(exportPurimGroup),
    printPurimGroup: guard(printPurimGroup),
    exportMembers: guard(exportMembers),
    printMembers: guard(printMembers),
    exportGifts: guard(exportGifts),
    printReport: guard(printReport)
  });
})();
