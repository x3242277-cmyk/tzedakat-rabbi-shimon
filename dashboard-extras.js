/* ============================================================
   העיצוב החדש ("שער הזהב"): מודולים של לוח הבקרה ושל המעטפת.
   נטען אחרי script.js ונשען על המצב ועל הפונקציות שלו (state, getMemberSummaries, formatCurrency...).
   אין כאן חישובי חובה או זכאות: כל הנתונים מגיעים מ-buildMemberSummaries הקיים.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf = (n) => Number(n || 0).toLocaleString("he-IL");
  const el = (id) => document.getElementById(id);

  /* ---------- אמצעי תשלום של הפקדה ----------
     הכלל עצמו נמצא בשכבת הנתונים (supabase-integration.js): העמודה payment_method אם קיימת, אחרת לפי ההערות. */
  function donationMethod(d) { return window.SB && SB.donationMethod ? SB.donationMethod(d) : "cash"; }
  function donationMethodLabel(d) { return donationMethod(d) === "credit" ? "אשראי" : "מזומן"; }
  window.donationMethod = donationMethod;
  window.donationMethodLabel = donationMethodLabel;

  function canViewIncomeNow() {
    if (typeof isAdminUser === "function" && isAdminUser()) return true;
    const u = state.currentUserObj;
    return !!u && isTrue(u.canViewIncome);
  }

  /* ---------- ספירה מונפשת של המספר הראשי ---------- */
  let heroShown = null;
  function animateHeroNumber(target) {
    const node = el("nd-hero-collected");
    if (!node) return;
    const from = heroShown == null ? 0 : heroShown;
    heroShown = target;
    if (reduceMotion() || from === target || document.hidden) { node.textContent = formatCurrency(target); return; }
    const start = performance.now(), dur = 900;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = formatCurrency(Math.round(from + (target - from) * eased));
      if (t < 1 && heroShown === target) requestAnimationFrame(step);
      else if (heroShown === target) node.textContent = formatCurrency(target);
    };
    requestAnimationFrame(step);
  }

  /* ---------- השער: מסגרת התמונה היא מד ההתקדמות של הקמפיין ---------- */
  let gatePercent = 0;
  function drawGate() {
    const frame = el("nd-gate-frame"), svg = el("nd-gate-gauge");
    if (!frame || !svg) return;
    const W = frame.clientWidth, H = frame.clientHeight;
    if (!W || !H) return;
    const s = parseFloat(getComputedStyle(frame).getPropertyValue("--gate-frame")) || 10;
    const r = (W - s) / 2;
    // מתחיל למטה מימין (תחילת הקריאה), עולה ברגל הימנית, עובר על הקשת ויורד ברגל השמאלית
    const d = `M ${W - s / 2},${H} V ${W / 2} A ${r} ${r} 0 0 0 ${s / 2},${W / 2} V ${H}`;
    const pct = Math.max(0, Math.min(100, gatePercent));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <path class="nd-gauge-track" d="${d}" stroke-width="${s}"/>
      <path class="nd-gauge-fill" d="${d}" stroke-width="${s}" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="${100 - pct}"/>
      <path class="nd-gauge-inlay" d="${d}" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="${100 - pct}"/>
      <rect class="nd-gauge-mark" width="14" height="14" x="-7" y="-7"/>`;
    const fill = svg.querySelector(".nd-gauge-fill"), mark = svg.querySelector(".nd-gauge-mark");
    try {
      const pt = fill.getPointAtLength(fill.getTotalLength() * pct / 100);
      mark.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(45)`);
    } catch (e) { mark.remove(); }
    if (pct <= 0) mark.remove();
    frame.classList.toggle("is-full", pct >= 100);
  }
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => drawGate());
    document.addEventListener("DOMContentLoaded", () => { const f = el("nd-gate-frame"); if (f) ro.observe(f); });
  }

  /* ---------- הפקדות אחרונות: שורה אחת שמתחלפת ---------- */
  let tickerRows = [], tickerAt = 0, tickerTimer = null;
  function showTicker() {
    const box = el("nd-ticker"), text = el("nd-ticker-text");
    if (!box || !text) return;
    if (!tickerRows.length) { box.hidden = true; return; }
    const row = tickerRows[tickerAt % tickerRows.length];
    box.hidden = false;
    text.classList.remove("is-in");
    text.innerHTML = `<strong>${escapeHtml(row.name)}</strong> · <span dir="ltr">+${escapeHtml(formatCurrency(row.amount))}</span> · ${row.method} · ${escapeHtml(row.date)}`;
    void text.offsetWidth;
    text.classList.add("is-in");
  }
  function startTicker(rows) {
    tickerRows = rows; tickerAt = 0;
    clearInterval(tickerTimer); tickerTimer = null;
    showTicker();
    if (rows.length > 1 && !reduceMotion()) {
      tickerTimer = setInterval(() => {
        if (document.hidden || state.activeScreen !== "dashboard-screen") return;
        tickerAt++; showTicker();
      }, 4200);
    }
  }

  /* ---------- מזומן מול אשראי ---------- */
  function renderSplit(donations) {
    const box = el("nd-split");
    if (!box) return;
    let cash = 0, credit = 0;
    donations.forEach(d => { const a = Number(d.amount) || 0; if (donationMethod(d) === "credit") credit += a; else cash += a; });
    const total = cash + credit;
    if (!total) { box.hidden = true; return; }
    const cp = Math.round((cash / total) * 100), kp = 100 - cp;
    box.hidden = false;
    box.innerHTML = `
      <div class="nd-split-head"><span>איך הגיע הכסף</span><span>לפי סכום, הפקדות בחורים</span></div>
      <div class="nd-split-bar" role="img" aria-label="מזומן ${cp}%, אשראי ${kp}%"><span class="nd-split-cash" style="width:${cp}%"></span><span class="nd-split-credit" style="width:${kp}%"></span></div>
      <div class="nd-split-legend">
        <span><i class="nd-split-cash"></i>מזומן <strong>${cp}%</strong> · ${escapeHtml(formatCurrency(cash))}</span>
        <span><i class="nd-split-credit"></i>אשראי <strong>${kp}%</strong> · ${escapeHtml(formatCurrency(credit))}</span>
      </div>`;
  }

  /* ---------- מסלול המתנות ---------- */
  function renderGifts(summaries) {
    const section = el("nd-gifts-section"), box = el("nd-gifts");
    if (!section || !box) return;
    const st = state.settings || {};
    const gifts = [
      { on: st.gift1Enabled !== false, name: st.gift1Name || "טיול", at: Number(st.targetTiyul) || 0, art: "tiyul" },
      { on: st.gift2Enabled !== false, name: st.gift2Name || "מתנה", at: Number(st.targetShayTotal) || 0, art: "matana" },
    ].filter(g => g.on && g.at > 0).sort((a, b) => a.at - b.at);
    if (!gifts.length) { section.hidden = true; return; }
    section.hidden = false;
    const max = gifts[gifts.length - 1].at;
    const collected = summaries.map(r => Number(r.collectedThisYear) || 0);
    const onTheWay = collected.filter(v => v > 0 && v < gifts[0].at).length;
    box.innerHTML = `
      <div class="nd-gift-road">
        <div class="nd-gift-start"><span class="nd-diamond"></span><strong>${nf(onTheWay)}</strong><small>בדרך למתנה הראשונה</small></div>
        ${gifts.map((g, i) => {
          const reached = collected.filter(v => v >= g.at).length;
          const near = collected.filter(v => v < g.at && g.at - v <= 200 && v > 0).length;
          return `
          <div class="nd-gift-stop" style="--at:${Math.round((g.at / max) * 100)}">
            <span class="nd-diamond nd-diamond--l"></span>
            <div class="nd-gift-card">
              <span class="nd-gift-art"><img src="assets/img/nd/${g.art}.webp" width="1000" height="1000" alt="" loading="lazy"></span>
              <span class="nd-gift-text">
                <span class="nd-gift-name">${escapeHtml(g.name)}</span>
                <span class="nd-gift-at">מ-<span dir="ltr">${escapeHtml(formatCurrency(g.at))}</span></span>
                <span class="nd-gift-count"><strong>${nf(reached)}</strong> בחורים כבר שם${near ? ` · עוד ${nf(near)} קרובים` : ""}</span>
              </span>
            </div>
          </div>`;
        }).join("")}
      </div>`;
  }

  /* ---------- מובילי הגבייה (רק למי שמורשה לראות הכנסות) ---------- */
  function renderLeaders(summaries) {
    const section = el("nd-leaders-section"), list = el("nd-leaders");
    if (!section || !list) return;
    const rows = canViewIncomeNow()
      ? summaries.filter(r => (Number(r.collectedThisYear) || 0) > 0).sort((a, b) => b.collectedThisYear - a.collectedThisYear).slice(0, 5)
      : [];
    section.hidden = !rows.length;
    const duo = section.parentElement;
    if (duo) duo.classList.toggle("is-single", !rows.length);
    list.innerHTML = rows.map((r, i) => `
      <li>
        <button type="button" class="nd-leader${i === 0 ? " is-first" : ""}" ${uiAct("openMemberFromMenu", r.id)}>
          <span class="nd-leader-rank">${i + 1}</span>
          <span class="nd-leader-text">
            <span class="nd-leader-name">${escapeHtml(r.fullName || "ללא שם")}</span>
            <span class="nd-leader-sub">${escapeHtml([r.yeshiva, r.currentYearType || r.yeshivaType].filter(Boolean).join(" · "))}</span>
          </span>
          <span class="nd-leader-sum">${escapeHtml(formatCurrency(r.collectedThisYear))}</span>
        </button>
      </li>`).join("");
  }

  /* ---------- לוח ההפקדות: 26 שבועות ---------- */
  function renderHeat(currentYear) {
    const box = el("nd-heat");
    if (!box) return;
    const WEEKS = 26, DAY = 86400000;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(today.getTime() + (6 - today.getDay()) * DAY);          // שבת של השבוע הנוכחי
    const start = new Date(end.getTime() - (WEEKS * 7 - 1) * DAY);               // יום ראשון, לפני 26 שבועות
    const byDay = new Map();
    let unparsed = 0;
    (state.donations || []).forEach(d => {
      const dt = parseAppDate(d.date);
      if (!dt) { if (d.year === currentYear) unparsed++; return; }
      const t = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
      if (t < start.getTime() || t > end.getTime()) return;
      const cur = byDay.get(t) || { sum: 0, count: 0 };
      cur.sum += Number(d.amount) || 0; cur.count++;
      byDay.set(t, cur);
    });
    const sums = Array.from(byDay.values()).map(v => v.sum).sort((a, b) => a - b);
    const q = (p) => sums.length ? sums[Math.min(sums.length - 1, Math.floor(p * sums.length))] : 0;
    const cuts = [q(0.25), q(0.5), q(0.8)];
    const level = (v) => !v ? 0 : v <= cuts[0] ? 1 : v <= cuts[1] ? 2 : v <= cuts[2] ? 3 : 4;
    const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
    let peak = null, activeDays = 0, total = 0, count = 0;
    let cols = "";
    for (let w = 0; w < WEEKS; w++) {
      let cells = "";
      for (let dow = 0; dow < 7; dow++) {
        const t = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + dow).getTime();
        const v = byDay.get(t);
        const future = t > today.getTime();
        if (v) { activeDays++; total += v.sum; count += v.count; if (!peak || v.sum > peak.sum) peak = { t, sum: v.sum }; }
        const dt = new Date(t);
        const label = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
        cells += dow === 6
          ? `<i class="nd-heat-cell is-shabbat"></i>`
          : `<i class="nd-heat-cell l${future ? "x" : level(v && v.sum)}" title="${label}${v ? ` · ${formatCurrency(v.sum)} · ${v.count} הפקדות` : future ? "" : " · אין הפקדות"}"></i>`;
      }
      cols += `<div class="nd-heat-col">${cells}</div>`;
    }
    const peakDate = peak ? new Date(peak.t) : null;
    box.innerHTML = `
      <div class="nd-heat-grid">
        <div class="nd-heat-days" aria-hidden="true">${dayNames.map(n => `<span>${n}</span>`).join("")}</div>
        <div class="nd-heat-cols">${cols}</div>
      </div>
      <div class="nd-heat-foot">
        <span><strong>${nf(activeDays)}</strong> ימים עם הפקדות</span>
        <span><strong>${escapeHtml(formatCurrency(total))}</strong> ב-${nf(count)} הפקדות</span>
        ${peakDate ? `<span>יום השיא <strong dir="ltr">${String(peakDate.getDate()).padStart(2, "0")}/${String(peakDate.getMonth() + 1).padStart(2, "0")}</strong> · ${escapeHtml(formatCurrency(peak.sum))}</span>` : ""}
        <span class="nd-heat-scale" aria-hidden="true">פחות <i class="nd-heat-cell l0"></i><i class="nd-heat-cell l1"></i><i class="nd-heat-cell l2"></i><i class="nd-heat-cell l3"></i><i class="nd-heat-cell l4"></i> יותר</span>
      </div>
      ${unparsed ? `<p class="nd-heat-note">${nf(unparsed)} הפקדות של ${escapeHtml(currentYear)} רשומות בלי תאריך תקין, ולכן לא מופיעות בלוח.</p>` : ""}`;
  }

  /* ---------- דירוג ישיבות ----------
     אותה ישיבה נכתבת לפעמים בכמה צורות. לצורך הדירוג מאחדים כתיבים שנבדלים רק בגרש, במירכאות, ברווחים או בתחילית "ישיבת". */
  function yeshivaKey(name) {
    return String(name || "").replace(/["'׳״`´’]/g, "").replace(/^ישיבת\s+/, "").replace(/\s+/g, " ").trim();
  }
  window.yeshivaKey = yeshivaKey;
  function renderYeshivas(summaries) {
    const section = el("nd-yeshivas-section"), box = el("nd-yeshivas");
    if (!section || !box) return;
    const groups = new Map();
    summaries.forEach(r => {
      const key = yeshivaKey(r.yeshiva);
      if (!key) return;
      const g = groups.get(key) || { names: new Map(), members: 0, collected: 0, required: 0, covered: 0 };
      const raw = String(r.yeshiva).trim();
      g.names.set(raw, (g.names.get(raw) || 0) + 1);
      g.members++;
      const c = Number(r.collectedThisYear) || 0, req = Number(r.totalRequiredThisYear) || 0;
      g.collected += c; g.required += req; g.covered += Math.min(c, req);
      groups.set(key, g);
    });
    const rows = Array.from(groups.values())
      .filter(g => g.members > 0 && (canViewIncomeNow() ? true : g.required > 0))
      .map(g => ({ ...g, name: Array.from(g.names.entries()).sort((a, b) => b[1] - a[1])[0][0], pct: g.required > 0 ? Math.min(100, Math.round((g.covered / g.required) * 100)) : null }))
      .sort((a, b) => (b.pct == null ? -1 : b.pct) - (a.pct == null ? -1 : a.pct) || b.collected - a.collected)
      .slice(0, 8);
    if (rows.length < 2) { section.hidden = true; return; }
    section.hidden = false;
    const showMoney = canViewIncomeNow();
    box.innerHTML = rows.map((g, i) => `
      <button type="button" class="nd-yesh" ${uiAct("ndFilterMembersByYeshiva", g.name)}>
        <span class="nd-yesh-rank">${i + 1}</span>
        <span class="nd-yesh-body">
          <span class="nd-yesh-name">${escapeHtml(g.name)}${g.names.size > 1 ? ` <small title="${escapeHtml(Array.from(g.names.keys()).join(" / "))}">${g.names.size} כתיבים</small>` : ""}</span>
          <span class="nd-yesh-sub">${nf(g.members)} בחורים${showMoney ? ` · נאסף ${escapeHtml(formatCurrency(g.collected))}` : ""}</span>
          <span class="nd-seg-meter"><span style="width:${g.pct == null ? 0 : g.pct}%"></span></span>
        </span>
        <span class="nd-plaque nd-plaque--s">${g.pct == null ? "ללא יעד" : g.pct + "%"}</span>
      </button>`).join("");
  }
  // לחיצה על ישיבה בדירוג: פותחת את רשימת הבחורים מסוננת לישיבה הזו
  window.ndFilterMembersByYeshiva = function (name) {
    switchScreen("members-screen", true);
    const sel = el("filter-members-yeshiva");
    if (sel && Array.from(sel.options).some(o => o.value === name)) { sel.value = name; state.filterYeshiva = name; }
    else { const s = el("search-members-list"); if (s) s.value = name; }
    renderMembersTable();
  };

  /* ---------- איחוד כתיבים של ישיבות (לשונית "תקינות נתונים") ---------- */
  function getYeshivaSpellingGroups() {
    const groups = new Map();
    (state.members || []).forEach(m => {
      const raw = String(m.yeshiva || "").trim(), key = yeshivaKey(raw);
      if (!key) return;
      const g = groups.get(key) || new Map();
      g.set(raw, (g.get(raw) || 0) + 1);
      groups.set(key, g);
    });
    return Array.from(groups.entries())
      .filter(([, variants]) => variants.size > 1)
      .map(([key, variants]) => ({ key, variants: Array.from(variants.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) }));
  }
  window.getYeshivaSpellingGroups = getYeshivaSpellingGroups;
  window.renderYeshivaSpellingsList = function () {
    const groups = getYeshivaSpellingGroups();
    if (!groups.length) return `<div class="fix-done-note"><span class="material-icons-regular note-icon">task_alt</span>כל ישיבה כתובה בצורה אחת.</div>`;
    return `<p class="nd-spell-intro">אותה ישיבה מופיעה בכמה כתיבים. בחרו את הכתיב הנכון, והוא יוחל על כל הבחורים של הישיבה.</p>` + groups.map(g => `
      <div class="fix-row nd-spell-row">
        <div class="nd-spell-variants">${g.variants.map(v => `<span class="nd-spell-variant">${escapeHtml(v.name)} <b>${nf(v.count)}</b></span>`).join("")}</div>
        <div class="nd-spell-actions"><span>לאחד ל:</span>${g.variants.map(v => `<button type="button" class="btn btn-secondary btn-sm" ${uiAct("unifyYeshivaSpelling", g.key, v.name)}>${escapeHtml(v.name)}</button>`).join("")}</div>
      </div>`).join("");
  };
  window.unifyYeshivaSpelling = async function (key, name) {
    if (!canEditUser()) { showToast("אין לך הרשאת עריכה", "warning"); return; }
    const targets = (state.members || []).filter(m => yeshivaKey(m.yeshiva) === key && String(m.yeshiva || "").trim() !== name);
    if (!targets.length) return;
    const ok = await uiConfirm({ title: "איחוד כתיב", message: `שם הישיבה ישתנה ל"${name}" אצל ${nf(targets.length)} בחורים.`, confirmLabel: "אחד" });
    if (!ok) return;
    targets.forEach(m => { m.yeshiva = name; });
    invalidateCache(); saveState();
    const results = await Promise.all(targets.map(m => persist("saveMember", m)));
    if (typeof logAudit === "function") targets.forEach(m => logAudit("update", "member", m.id, { field: "yeshiva", value: name, via: "איחוד כתיבים" }));
    populateFilters(); renderAll(); renderDataHealth();
    const body = el("data-health-modal-body");
    if (body) body.innerHTML = window.renderYeshivaSpellingsList();
    reportSave(results.every(Boolean), `הכתיב אוחד אצל ${nf(targets.length)} בחורים`);
  };

  /* ---------- נקודת הכניסה: נקראת מסוף renderDashboard ---------- */
  window.renderDashboardExtras = function (ctx) {
    const { currentYear, summaries, progress, totalCollected, donations } = ctx;
    const today = el("nd-hero-today");
    if (today) today.textContent = formatDateDisplay(getTodayIsoDate());

    animateHeroNumber(totalCollected);
    gatePercent = progress;
    drawGate();

    const names = new Map(summaries.map(r => [String(r.id).trim(), r.fullName || "ללא שם"]));
    (state.members || []).forEach(m => { const k = String(m.id).trim(); if (!names.has(k)) names.set(k, `${m.firstName || ""} ${m.lastName || ""}`.trim() || "ללא שם"); });
    const recent = donations.slice()
      .sort((a, b) => compareDatesDesc(a.date, b.date) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 6)
      .map(d => ({ name: names.get(String(d.memberId || "").trim()) || "הפקדה כללית", amount: Number(d.amount) || 0, method: donationMethodLabel(d), date: formatDateDisplay(d.date) || "ללא תאריך" }));
    startTicker(canViewIncomeNow() ? recent : []);

    renderSplit(canViewIncomeNow() ? donations : []);
    renderGifts(summaries);
    renderLeaders(summaries);
    renderHeat(currentYear);
    renderYeshivas(summaries);

    let ts = null;
    try { ts = sessionStorage.getItem("ezer_last_sync"); } catch (e) {}
    const sync = el("nd-foot-sync");
    if (sync) sync.textContent = ts ? formatSyncTime(ts) : "טרם סונכרן";
  };

  /* ---------- מחוון השמירה הקבוע בכותרת ---------- */
  function updateSaveState() {
    const box = el("save-state"), text = el("save-state-text");
    if (!box || !text) return;
    let count = 0;
    try { count = readPendingWrites().length; } catch (e) {}
    box.classList.toggle("is-pending", count > 0);
    text.textContent = count > 0 ? `${count} ממתינים לשליחה` : "נשמר";
    box.title = count > 0 ? "יש שינויים ששמורים במחשב הזה ועוד לא נשלחו לשרת" : "כל השינויים נשמרו בשרת";
  }
  window.ndUpdateSaveState = updateSaveState;
  if (typeof updatePendingBanner === "function") {
    const original = updatePendingBanner;
    window.updatePendingBanner = function () { original.apply(this, arguments); updateSaveState(); };
  }

  /* ---------- הפקדה מהירה: מקלידים סכום, והטופס נפתח איתו ---------- */
  document.addEventListener("submit", (ev) => {
    const form = ev.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "nd-quick-form") return;
    ev.preventDefault();
    const input = el("nd-quick-amount");
    const amount = input ? String(input.value || "").trim() : "";
    openDonationModal();
    const modal = el("add-donation-modal");
    if (modal && modal.classList.contains("open")) {
      if (amount) setValue("donation-amount", amount);
      if (input) input.value = "";
      const who = el("donation-member-input");
      if (who) setTimeout(() => who.focus(), 60);
    }
  });

/* ---------- רגע ההצלחה אחרי רישום הפקדה חדשה ----------
     saved = ההפקדה כבר נשמרה בשרת. אם לא (אין חיבור), אין חגיגה: כותבים שהיא שמורה במחשב וממתינה לשליחה. */
  let successTimer = null;
  function closeDepositSuccess() {
    clearTimeout(successTimer);
    document.querySelectorAll(".nd-success, .nd-confetti").forEach(n => n.remove());
  }
  function burstConfetti() {
    if (reduceMotion()) return;
    const box = document.createElement("div");
    box.className = "nd-confetti"; box.setAttribute("aria-hidden", "true");
    let html = "";
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2, dist = 140 + (i % 5) * 46;
      html += `<i style="--dx:${Math.round(Math.cos(angle) * dist)}px;--dy:${Math.round(Math.sin(angle) * dist * 0.7 + 190)}px;--rot:${(i % 2 ? 1 : -1) * (180 + i * 20)}deg;animation-delay:${(i % 6) * 30}ms"></i>`;
    }
    box.innerHTML = html;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1900);
  }
  window.showDepositSuccess = function ({ donation, saved }) {
    closeDepositSuccess();
    const row = getMemberSummaries().find(m => String(m.id).trim() === String(donation.memberId).trim());
    const name = (row && row.fullName) || donation.memberNameSnapshot || "";
    let note = "";
    if (row && donation.year === getCampaignYear() && (Number(row.totalRequiredThisYear) || 0) > 0) {
      note = row.missingAmount > 0
        ? `נשאר לו <strong>${escapeHtml(formatCurrency(row.missingAmount))}</strong> ליעד השנתי`
        : `<strong>עמד ביעד השנתי</strong>`;
    }
    const wrap = document.createElement("div");
    wrap.className = "nd-success";
    wrap.innerHTML = `
      <div class="nd-success-card" role="status" aria-live="polite">
        <div class="nd-window nd-window--obj nd-success-art"><img src="assets/img/nd/kupa.webp" width="1000" height="1000" alt=""></div>
        <h3>${saved ? "ההפקדה נרשמה" : "ההפקדה נשמרה במחשב"}</h3>
        <div class="nd-success-sum" dir="ltr">+${escapeHtml(formatCurrency(donation.amount))}</div>
        <div class="nd-success-who">${escapeHtml(name)} · ${donationMethodLabel(donation)}</div>
        ${saved
          ? (note ? `<div class="nd-success-note">${note}</div>` : "")
          : `<div class="nd-success-note is-pending">אין חיבור לשרת כרגע. ההפקדה שמורה במחשב הזה ותישלח אוטומטית כשהחיבור יחזור.</div>`}
        <div class="nd-success-actions">
          <button type="button" class="btn btn-primary" data-success="again"><span class="material-icons-regular" aria-hidden="true">add</span>הפקדה נוספת</button>
          <button type="button" class="btn btn-secondary" data-success="close">סגירה</button>
        </div>
      </div>`;
    wrap.addEventListener("click", (ev) => {
      const btn = ev.target instanceof Element ? ev.target.closest("[data-success]") : null;
      if (ev.target === wrap || btn) closeDepositSuccess();
      if (btn && btn.dataset.success === "again") openDonationModal();
    });
    document.body.appendChild(wrap);
    if (saved) burstConfetti();
    const closeBtn = wrap.querySelector('[data-success="again"]');
    if (closeBtn) closeBtn.focus();
    successTimer = setTimeout(closeDepositSuccess, saved ? 7000 : 12000);
  };

  /* ---------- Esc סוגר את החלון העליון: רגע ההצלחה, ואחריו כרטיס הבחור ---------- */
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (document.querySelector(".nd-success")) { closeDepositSuccess(); return; }
    if (document.querySelector(".ui-dialog, #row-menu")) return;
    const openModals = Array.from(document.querySelectorAll(".modal-overlay.open")).filter(m => m.id !== "member-overlay");
    if (openModals.length) return;
    if (typeof isMemberProfileOpen === "function" && isMemberProfileOpen()) closeMemberProfile();
  });

  document.addEventListener("DOMContentLoaded", updateSaveState);
})();
