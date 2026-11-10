const STORAGE_KEYS = {
  MEMBERS: "ezer_hatanim_members",
  DONATIONS: "ezer_hatanim_donations",
  EXPENSES: "ezer_hatanim_expenses",
  SETTINGS: "ezer_hatanim_settings",
  USERS: "ezer_hatanim_users",
  PURIM: "ezer_hatanim_purim",
  GRANTS_ARCHIVE: "ezer_hatanim_grants_archive"
};

const DEFAULT_EXPENSE_CATEGORIES = ["הדפסות", "כנסים", "סעודות", "מתנות", "תפעול", "שונות"];

const DEFAULT_SETTINGS = {
  campaignYear: 'תשפ"ו',
  targetChaider: 0,
  targetKtana: 450,
  targetGedola: 1100,
  targetKibbutz: 0,
  targetTiyul: 700,
  targetShayTotal: 2000,
  gift1Name: "טיול",
  gift1Enabled: true,
  gift1Image: "",
  gift2Name: "מתנה",
  gift2Enabled: true,
  gift2Image: "",
  expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
  purimManualSums: {},
  additionalRules: ""
};

const DEFAULT_USERS = [];

// התחברות: המשתמש מקליד רק את החלק שלפני ה-@, והדומיין משלים לכתובת המייל ב-Supabase Auth
const LOGIN_EMAIL_DOMAIN = "tzedaka.local";

// עותק הנתונים במחשב (STORAGE_KEYS) נשמר ב-sessionStorage: נשאר ברענון דף, ונמחק כשסוגרים את הדפדפן.
// תור השמירות שעוד לא נשלחו (PENDING_WRITES_KEY) נשאר ב-localStorage, כדי ששינויים לא יאבדו.
const LAST_SYNC_KEY = "ezer_last_sync";
const cacheStore = {
  get(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} },
  remove(key) { try { sessionStorage.removeItem(key); } catch (e) {} },
};
// ניקוי חד-פעמי של העותק הישן שנשמר בעבר ב-localStorage ונשאר גם אחרי סגירת הדפדפן
try { Object.values(STORAGE_KEYS).concat(LAST_SYNC_KEY).forEach(k => localStorage.removeItem(k)); } catch (e) {}

let state = {
  members: [],
  donations: [],
  expenses: [],
  users: [],
  purimAddresses: [],
  grantsArchive: null,
  grantsPackageEditMode: false,
  grantsPackageDraft: null,
  settings: { ...DEFAULT_SETTINGS },
  activeScreen: "dashboard-screen",
  filterYeshiva: "",
  filterCity: "",
  filterYeshivaTypes: [],
  currentProfileId: null,
  currentUser: null,
  currentUserObj: null,
  showAllExpenseYears: false,
  purimShowAllYears: false,
  expensesViewYear: null,
  membersEditMode: false,
  grantsActiveView: "grant"
};

let incomeChartInstance = null;
let expenseCategoryChartInstance = null;
let expenseTrendChartInstance = null;

// --- מנגנוני ביצועים ומיון ---
let membersSortCol = null;
let membersSortAsc = true;
let memberSummariesCache = null;
let membersCacheVersion = 0;
let lastBuiltCacheVersion = -1;

function invalidateCache() {
  membersCacheVersion++;
}

function getMemberSummaries() {
  if (memberSummariesCache && lastBuiltCacheVersion === membersCacheVersion) {
    return memberSummariesCache;
  }
  memberSummariesCache = buildMemberSummaries(); 
  lastBuiltCacheVersion = membersCacheVersion;
  return memberSummariesCache;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// פונקציה חכמה לחילוץ מספרים מטקסט וסכימתם
function sumNumbersFromString(str) {
    if (!str) return 0;
    const nums = String(str).match(/-?\d+(\.\d+)?/g);
    if (!nums) return 0;
    return nums.reduce((sum, num) => sum + parseFloat(num), 0);
}

// פונקציית עזר לחילוץ ה-ID מתוך שורת החיפוש החכם (Datalist)
function extractMemberId(inputValue) {
    if (!inputValue) return null;
    const match = String(inputValue).match(/\[(.*?)\]$/);
    return match ? match[1] : null;
}
// ------------------------------------------

// ==========================================
// שמירה לשרת עם תור ממתינים
// כל שינוי נכנס לתור שנשמר בדפדפן ונשלח לשרת. אם השליחה נכשלת (אין אינטרנט / תקלה זמנית),
// השינוי נשאר בתור, נשלח שוב אוטומטית, ולא נמחק כשהנתונים נטענים מחדש מהשרת.
// ==========================================
const PENDING_WRITES_KEY = "ezer_pending_writes";
const WRITE_OPS = {
  saveMember: p => SB.saveMember(p),
  saveDonation: p => SB.saveDonation(p),
  saveExpense: p => SB.saveExpense(p),
  savePurim: p => SB.savePurim(p),
  saveSettings: p => SB.saveSettings(p),
  saveGrantsArchive: p => SB.saveGrantsArchive(p),
  deleteMember: p => SB.deleteMember(p.id),
  deleteDonation: p => SB.deleteDonation(p.id),
  deleteExpense: p => SB.deleteExpense(p.id),
};
const WRITE_LABELS = {
  saveMember: "פרטי בחור", deleteMember: "מחיקת בחור", saveDonation: "הפקדה", deleteDonation: "מחיקת הפקדה",
  saveExpense: "הוצאה", deleteExpense: "מחיקת הוצאה", savePurim: "כתובת פורים", saveSettings: "הגדרות", saveGrantsArchive: "נתוני מענקים",
};
let pendingLastError = null;
let flushPromise = null;
const rejectedWriteIds = new Set();

function readPendingWrites() { try { const raw = localStorage.getItem(PENDING_WRITES_KEY); return raw ? (JSON.parse(raw) || []) : []; } catch (e) { return []; } }
function writePendingWrites(list) { try { localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(list)); } catch (e) {} }

// מפתח לפי ישות: שמירה חדשה של אותה רשומה מחליפה שמירה ישנה שעוד לא נשלחה
function pendingEntityKey(op, payload) {
  if (op === "saveSettings") return "settings";
  if (op === "saveGrantsArchive") return "grants";
  if (op === "savePurim") return "purim:" + (payload.__sbId || `${payload["עיר"]}|${payload["קבוצה"]}|${payload["מס'"]}`);
  const kind = op.replace(/^(save|delete)/, "").toLowerCase();
  return kind + ":" + String(payload && payload.id);
}

function enqueueWrite(op, payload) {
  const key = pendingEntityKey(op, payload);
  const item = { id: generateId("W"), op, key, payload: JSON.parse(JSON.stringify(payload)), ts: Date.now() };
  const list = readPendingWrites().filter(x => x.key !== key);
  list.push(item);
  writePendingWrites(list);
  updatePendingBanner();
  return item.id;
}

// שגיאה קבועה = השרת דחה את הבקשה (הרשאות / נתון לא תקין). שגיאה זמנית = אין חיבור / תקלת שרת.
function isPermanentWriteError(err) {
  const st = err && err.status;
  return !!st && st >= 400 && st < 500 && ![401, 408, 429].includes(st);
}

function flushPendingWrites() {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    if (!window.SB || !SB.isLoggedIn()) return readPendingWrites().length === 0;
    for (;;) {
      const list = readPendingWrites();
      if (!list.length) break;
      const item = list[0];
      try {
        await WRITE_OPS[item.op](item.payload);
        writePendingWrites(readPendingWrites().filter(x => x.id !== item.id));
        pendingLastError = null;
      } catch (err) {
        if (isPermanentWriteError(err) || !WRITE_OPS[item.op]) {
          writePendingWrites(readPendingWrites().filter(x => x.id !== item.id));
          rejectedWriteIds.add(item.id);
          const reason = err && err.status === 403 ? "אין לך הרשאה לפעולה הזו" : (err && err.message) || "שגיאה";
          showToast(`השרת לא אישר את השמירה (${WRITE_LABELS[item.op] || item.op}): ${reason}`, "danger");
          continue;
        }
        pendingLastError = err;
        break;
      }
    }
    updatePendingBanner();
    return readPendingWrites().length === 0;
  })().finally(() => { flushPromise = null; });
  return flushPromise;
}

// שומר שינוי בשרת. מחזיר true אם נשמר בשרת, false אם נשאר בתור (יישלח שוב) או נדחה.
async function persist(op, payload) {
  if (!window.SB) return false;
  const id = enqueueWrite(op, payload);
  await flushPendingWrites();
  if (readPendingWrites().some(x => x.id === id) && !pendingLastError) await flushPendingWrites();
  return !readPendingWrites().some(x => x.id === id) && !rejectedWriteIds.has(id);
}

// הודעה אחידה אחרי שמירה
function reportSave(saved, okMsg) {
  if (saved) showToast(okMsg || "נשמר בהצלחה", "success");
  else if (readPendingWrites().length) showToast("אין חיבור לשרת כרגע. השינוי שמור במחשב הזה ויישלח אוטומטית כשהחיבור יחזור", "warning");
}

// אחרי טעינה מהשרת: מחילים שוב שינויים שעוד לא נשלחו, כדי שלא ייעלמו מהמסך
function applyPendingWritesToState() {
  const upsertById = (arr, obj) => { const i = arr.findIndex(x => String(x.id) === String(obj.id)); if (i === -1) arr.push(obj); else arr[i] = obj; };
  readPendingWrites().forEach(({ op, payload }) => {
    if (op === "saveMember") upsertById(state.members, payload);
    else if (op === "saveDonation") upsertById(state.donations, payload);
    else if (op === "saveExpense") upsertById(state.expenses, payload);
    else if (op === "deleteMember") state.members = state.members.filter(x => String(x.id) !== String(payload.id));
    else if (op === "deleteDonation") state.donations = state.donations.filter(x => String(x.id) !== String(payload.id));
    else if (op === "deleteExpense") state.expenses = state.expenses.filter(x => String(x.id) !== String(payload.id));
    else if (op === "saveSettings") state.settings = { ...DEFAULT_SETTINGS, ...payload };
    else if (op === "saveGrantsArchive") state.grantsArchive = payload;
    else if (op === "savePurim") {
      const i = state.purimAddresses.findIndex(r => (payload.__sbId && r.__sbId === payload.__sbId) || (!payload.__sbId && pendingEntityKey("savePurim", r) === pendingEntityKey("savePurim", payload)));
      if (i === -1) state.purimAddresses.push(payload); else state.purimAddresses[i] = payload;
    }
  });
}

function updatePendingBanner() {
  const count = readPendingWrites().length;
  let el = document.getElementById("pending-writes-banner");
  if (!count) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "pending-writes-banner";
    el.className = "pending-writes-banner";
    el.innerHTML = `<span class="material-icons-regular">cloud_off</span><span class="pending-writes-text"></span><button type="button" class="btn btn-outline pending-writes-retry">נסה עכשיו</button>`;
    el.querySelector(".pending-writes-retry").addEventListener("click", async () => {
      const ok = await flushPendingWrites();
      showToast(ok ? "כל השינויים נשמרו בשרת" : "עדיין אין חיבור לשרת. ננסה שוב אוטומטית", ok ? "success" : "warning");
    });
    document.body.appendChild(el);
  }
  el.querySelector(".pending-writes-text").textContent = `${count} ${count === 1 ? "שינוי עדיין לא נשמר" : "שינויים עדיין לא נשמרו"} בשרת. הם שמורים במחשב הזה ויישלחו אוטומטית.`;
}

window.addEventListener("online", () => { if (readPendingWrites().length) flushPendingWrites(); });
setInterval(() => { if (readPendingWrites().length && !flushPromise) flushPendingWrites(); }, 30000);

// ===== שמירת הגדרות ומענקים בלי לדרוס שינויים של משתמש אחר =====
// לפני שמירה טוענים את הגרסה העדכנית מהשרת ומחילים עליה רק את השינוי הנוכחי.
let settingsSaveChain = Promise.resolve();
function saveSettingsPatch(mutator) {
  mutator(state.settings);
  invalidateCache(); saveState();
  const run = async () => {
    const before = JSON.stringify(state.settings);
    await flushPendingWrites();
    if (!readPendingWrites().some(x => x.op === "saveSettings")) {
      try {
        const fresh = await SB.fetchSingleton("settings");
        if (fresh) { const merged = { ...DEFAULT_SETTINGS, ...fresh }; mutator(merged); state.settings = merged; saveState(); }
      } catch (e) {}
    }
    const saved = await persist("saveSettings", state.settings);
    if (JSON.stringify(state.settings) !== before) { invalidateCache(); renderAll(); if (state.activeScreen === "settings-screen") renderSettings(); }
    return saved;
  };
  const p = settingsSaveChain.then(run, run);
  settingsSaveChain = p.catch(() => {});
  return p;
}

let grantsSaveChain = Promise.resolve();
function mutateGrantsArchive(mutator) {
  mutator(ensureEditableArchive());
  saveState();
  const run = async () => {
    const before = JSON.stringify(state.grantsArchive);
    await flushPendingWrites();
    if (!readPendingWrites().some(x => x.op === "saveGrantsArchive")) {
      try {
        const fresh = await SB.fetchSingleton("grants_archive");
        if (fresh) { const merged = mergeGrantsArchiveDefaults(fresh); mutator(merged); state.grantsArchive = merged; saveState(); }
      } catch (e) {}
    }
    const saved = await persist("saveGrantsArchive", state.grantsArchive);
    if (JSON.stringify(state.grantsArchive) !== before) { renderGrantsArchive(); renderDashboard(); }
    return saved;
  };
  const p = grantsSaveChain.then(run, run);
  grantsSaveChain = p.catch(() => {});
  return p;
}

// ===== יומן פעולות: מי עשה מה ומתי (לא חוסם את הפעולה אם נכשל) =====
function logAudit(action, entity, entityId, details) {
  if (!window.SB || !SB.isLoggedIn()) return;
  const entry = { action, entity, entity_id: entityId != null ? String(entityId) : null, username: state.currentUser || "", details: details || null };
  SB.insertAudit(entry).catch(() => {});
}

const screenMeta = {
  "dashboard-screen": { title: "לוח בקרה", subtitle: "שליטה על גבייה, עמידה ביעדים וזכאות למענק" },
  "members-screen": { title: "ניהול בחורים", subtitle: "רשימת בחורים, סטטוס גבייה ופרופיל אישי" },
  "daily-report-screen": { title: "דו\"ח תנועות מרוכז", subtitle: "מעקב הכנסות והוצאות לפי חיתוך זמן" },
  "expenses-summary-screen": { title: "סיכום הוצאות", subtitle: "ניתוח תקציבי רב-שנתי והשוואה בין קמפיינים" },
  "grants-screen": { title: "מענקים", subtitle: "נתינת המענק, תכולת החבילה ותשלומים לחנויות לפי שנה" },
  "purim-registration-screen": { title: "תרומות פורים", subtitle: "מאגר נתונים וסיכום היסטורי של בתי התורמים" },
  "rules-screen": { title: "תקנון", subtitle: "תקנון המערכת וכללי חלוקת המענקים" },
  "settings-screen": { title: "הגדרות מערכת", subtitle: "ניהול יעדים שנתיים, הגדרות שנת פעילות והרשאות משתמשים" },
};

// ==========================================
// אירועי ממשק בלי onclick / oninput / onchange מוטמעים (נדרש בשביל מדיניות האבטחה CSP).
// כל רכיב מסמן את הפעולה ב-data-click / data-input / data-change, ואת הפרמטרים ב-data-* נוספים.
// מאזין אחד על המסמך מפעיל את הפעולה, כך שזה עובד גם לרכיבים שנבנים מחדש ב-innerHTML.
// ==========================================
const UI_ACTIONS = {
  click: {
    "print": () => window.print(),
    "idle-stay": () => resetIdleTimer(),
    "open-nedarim": () => openNedarimModal(),
    "dashboard-drill": el => openDashboardDrill(el.dataset.type, el.dataset.category || ""),
    "dashboard-drill-close": () => closeDashboardDrill(),
    "dashboard-open-member": el => openDashboardMember(el.dataset.id),
    "members-edit-toggle": () => handleMembersEditButton(),
    "members-edit-cancel": () => cancelMembersEdit(),
    "members-density": () => { const t = document.querySelector("#members-screen .data-table"); if (t) t.classList.toggle("compact-view"); },
    "delete-member": el => deleteMemberRow(el.dataset.id),
    "edit-donation": el => openDonationModal(null, el.dataset.id),
    "edit-expense": el => openExpenseModal(el.dataset.id),
    "toggle-expense-years": () => toggleExpenseYears(),
    "takanon-pick": el => takanonShowMember(el.dataset.id),
    "remove-expense-category": el => removeExpenseCategory(Number(el.dataset.index)),
    "health-detail": el => openDataHealthDetail(el.dataset.type),
    "health-fix-save": el => {
      const input = el.closest(".fix-row") && el.closest(".fix-row").querySelector("input");
      applyHealthFix(el.dataset.id, el.dataset.field, input ? input.value : "");
    },
    "health-open-member": el => openMemberFromHealth(el.dataset.id),
    "health-modal-close": () => document.getElementById("data-health-modal").classList.remove("open"),
    "save-user-perms": el => saveUserPermissions(el.dataset.userId, el),
    "grants-view": el => switchGrantsView(el.dataset.view),
    "grants-add-year": () => addGrantsArchiveYear(),
    "grants-export": () => exportGrantsToExcel(),
    "grants-export-recipients": () => exportGrantsArchiveRecipients(),
    "grants-add-form-toggle": () => toggleGrantsAddForm(),
    "grants-add-form-close": () => toggleGrantsAddForm(false),
    "grants-add-submit": () => submitGrantsAddRecipient(),
    "grants-recipient-edit": el => editGrantsArchiveRecipient(Number(el.dataset.index)),
    "grants-recipient-remove": el => removeGrantsArchiveRecipient(Number(el.dataset.index)),
    "grants-pkg-edit": () => toggleGrantsPackageEditMode(),
    "grants-pkg-cancel": () => cancelGrantsPackageEdit(),
    "pkg-add-group": () => addGrantsPkgGroup(),
    "pkg-remove-group": el => removeGrantsPkgGroup(Number(el.dataset.g)),
    "pkg-add-item": el => addGrantsPkgItem(Number(el.dataset.g)),
    "pkg-remove-item": el => removeGrantsPkgItem(Number(el.dataset.g), Number(el.dataset.i)),
    "bills-half": el => switchBillsHalf(el.dataset.half),
    "store-bill-open": el => openStoreBillModal(el.dataset.bid || null, el.dataset.store || ""),
    "store-bill-close": () => closeStoreBillModal(),
    "store-bill-save": () => saveStoreBill(),
    "store-bill-delete": () => deleteStoreBill(),
    "receipt-view": el => viewStoreBillReceipt(el.dataset.bid),
    "receipt-clear": () => clearStoreBillReceipt(),
    "legacy-assign-open": el => openLegacyAssign(el.dataset.key),
    "legacy-assign-save": el => saveLegacyAssign(el.dataset.half),
    "legacy-assign-close": () => closeLegacyAssign(),
    "purim-edit": el => togglePurimGroupEdit(el.dataset.key),
    "purim-cancel": el => cancelPurimGroupEdit(el.dataset.key),
    "purim-print": el => printPurimGroup(el.dataset.key),
    "purim-export": el => exportPurimGroupToExcel(el.dataset.key),
    "purim-spacing": el => togglePurimSpacing(el, el.dataset.key),
    "purim-years": () => togglePurimYears(),
  },
  input: {
    "takanon-search": el => takanonSearch(el.value),
    "pkg-group-field": el => updateGrantsPkgGroupField(Number(el.dataset.g), el.dataset.field, el.value),
    "pkg-item-field": el => updateGrantsPkgItemField(Number(el.dataset.g), Number(el.dataset.i), el.dataset.field, el.value),
  },
  change: {
    "dashboard-year": () => renderDashboard(),
    "type-filter": () => updateTypeFilter(),
    "expenses-year": () => onExpensesYearChange(),
    "grants-year": el => selectGrantsArchiveYear(el.value),
    "health-fix-select": el => applyHealthFix(el.dataset.id, el.dataset.field, el.value),
  },
};

Object.keys(UI_ACTIONS).forEach(type => {
  const attr = `data-${type}`;
  document.addEventListener(type, (e) => {
    const el = e.target && e.target.closest ? e.target.closest(`[${attr}]`) : null;
    if (!el) return;
    const action = UI_ACTIONS[type][el.getAttribute(attr)];
    if (action) action(el, e);
  });
});


document.addEventListener("DOMContentLoaded", async () => {
  loadState();
  try {
    if (sessionStorage.getItem("ezer_logout_reason") === "idle") {
      sessionStorage.removeItem("ezer_logout_reason");
      setTimeout(() => showToast("המערכת ננעלה אוטומטית עקב חוסר פעילות", "warning"), 300);
    }
  } catch (e) {}

  const loaderArea = document.getElementById("login-loader-area");
  const formArea = document.getElementById("login-form-area");
  const logo = document.getElementById("login-logo");

  const btnLogoutTop = document.getElementById("btn-logout-top");
  if (btnLogoutTop) {
      btnLogoutTop.addEventListener("click", () => performLogout(false));
  }

  startIdleTimer();

  // סשן פעיל של Supabase (רענון דף) — נכנסים ישר למערכת
  if (window.SB && SB.isLoggedIn()) {
      state.currentUser = sessionDisplayName(SB.currentUser());
      if (loaderArea) loaderArea.style.display = "none";
      if (logo) logo.classList.remove("pulse-logo");
      document.getElementById("login-screen").classList.add("hidden-login");
      document.getElementById("main-screen").classList.remove("hidden-layout");
      document.getElementById("main-screen").classList.add("visible-layout");
      await fetchDataFromServer(true);   // טוען נתונים + קובע currentUserObj + הרשאות
      resolveCurrentUser();
      applyPermissions();
      initApp();
      restoreFormDraft();
      return;
  }

  showLoginForm(loaderArea, logo, formArea);
});

function showLoginForm(loaderArea, logo, formArea) {
    if(loaderArea) loaderArea.style.display = "none";
    if(logo) logo.classList.remove("pulse-logo");
    
    if(formArea) {
        formArea.style.display = "block";
        setTimeout(() => {
            formArea.style.opacity = "1";
        }, 50);
    }
    
    initLoginScreen();
}

function isTrue(val) {
  if (val === true || val === 1) return true;
  if (!val) return false;
  const clean = String(val).trim().toUpperCase();
  return clean === "TRUE" || clean === "V" || clean === "1" || clean === "כן" || clean === "Y" || clean === "YES";
}

// "mendi" -> "mendi@tzedaka.local". אם הוקלדה כתובת מלאה - משתמשים בה כמו שהיא.
function loginEmailFromUsername(raw) {
  const u = String(raw || "").trim().toLowerCase();
  if (!u) return "";
  return u.includes("@") ? u : `${u}@${LOGIN_EMAIL_DOMAIN}`;
}

// הודעה אחידה לכל כשל התחברות, שלא מגלה אם שם המשתמש קיים
const LOGIN_GENERIC_ERROR = "שם המשתמש או הסיסמה שגויים";

function loginErrorMessage(err) {
  const raw = String((err && err.message) || "");
  const status = err && err.status;
  if (!status && /Failed to fetch|NetworkError|Load failed/i.test(raw)) return "לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט, או שהשרת אינו זמין כרגע.";
  if (status === 429) return "יותר מדי ניסיונות כניסה. המתן כמה דקות ונסה שוב.";
  if (status >= 500) return "השרת אינו זמין כרגע. נסה שוב בעוד כמה דקות.";
  return LOGIN_GENERIC_ERROR;
}

let loginFormBound = false;
function initLoginScreen() {
  const form = document.getElementById("login-form-area");
  if (!form || loginFormBound) return;
  loginFormBound = true;
  const userInput = document.getElementById("login-username");
  const passInput = document.getElementById("login-password");
  const errEl = document.getElementById("login-error");
  const btnLogin = document.getElementById("btn-login");
  const showError = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = "block"; } };
  setTimeout(() => { if (userInput && !userInput.value) userInput.focus(); }, 80);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btnLogin.disabled) return;
    const email = loginEmailFromUsername(userInput.value);
    const passVal = String(passInput.value);
    if (!email || !passVal) { showError("יש להזין שם משתמש וסיסמה"); return; }

    const origText = btnLogin.textContent;
    btnLogin.disabled = true; btnLogin.textContent = "מתחבר...";
    try {
      await SB.signIn(email, passVal);
    } catch (err) {
      showError(loginErrorMessage(err));
      passInput.value = "";
      passInput.focus();
      btnLogin.disabled = false; btnLogin.textContent = origText;
      return;
    }
    if (errEl) errEl.style.display = "none";
    passInput.value = "";
    try {
      state.currentUser = sessionDisplayName(SB.currentUser());
      await fetchDataFromServer(true); // טוען את כל הנתונים מ-Supabase (כולל profiles)
      resolveCurrentUser();
      if (!state.currentUserObj) state.currentUserObj = { username: state.currentUser, canEdit: true, canViewIncome: true, canViewExpenses: true, canViewGrants: true, canViewHistory: true };

      document.getElementById("login-screen").classList.add("hidden-login");
      applyPermissions();
      document.getElementById("main-screen").classList.remove("hidden-layout");
      document.getElementById("main-screen").classList.add("visible-layout");
      showToast(state.currentUser ? `ברוך הבא למערכת, ${state.currentUser}!` : "ברוך הבא למערכת!", "success");
      initApp();
      restoreFormDraft();
    } finally {
      btnLogin.disabled = false; btnLogin.textContent = origText;
    }
  });
}

// שם התצוגה בעברית: display_name מטבלת profiles, ואם חסר - שם המשתמש
function profileDisplayName(prof) {
  return String((prof && (prof.displayName || prof.username)) || "").trim();
}

// שם זמני מתוך פרטי החשבון, עד שהפרופיל נטען מהשרת
function sessionDisplayName(sbUser) {
  const meta = (sbUser && sbUser.user_metadata) || {};
  return String(meta.display_name || meta.username || "").trim();
}

// זיהוי המשתמש המחובר לפי מזהה החשבון ב-Supabase, כדי שרענון הדף לא יאבד הרשאות
function resolveCurrentUser() {
  const sbUser = window.SB ? SB.currentUser() : null;
  const uid = sbUser && sbUser.id;
  const prof = uid ? (state.users || []).find(u => u.id && String(u.id) === String(uid)) : null;
  if (prof) { state.currentUserObj = prof; state.currentUser = profileDisplayName(prof); return; }
  if (!state.currentUser) state.currentUser = sessionDisplayName(sbUser);
}

function canEditUser() {
  const u = state.currentUserObj;
  return !u || isAdminUser() || isTrue(u.canEdit);
}

function isAdminUser() {
  const u = state.currentUserObj;
  return !!u && (u.isAdmin === true || String(u.username || "").trim() === "מנהל");
}

function applyPermissions() {
  const isVIP = isAdminUser();
  
  const canEdit = isVIP ? true : (state.currentUserObj ? isTrue(state.currentUserObj.canEdit) : false);
  const canViewIncome = isVIP ? true : (state.currentUserObj ? isTrue(state.currentUserObj.canViewIncome) : false);
  const canViewExpenses = isVIP ? true : (state.currentUserObj ? isTrue(state.currentUserObj.canViewExpenses) : false);
  const canViewGrants = isVIP ? true : (state.currentUserObj ? isTrue(state.currentUserObj.canViewGrants) : false);

  const roleIndicator = document.getElementById("user-role-indicator");
  if (roleIndicator) {
      let roleName = state.currentUser || "אורח";
      let iconName = isVIP ? "admin_panel_settings" : "person";
      roleIndicator.innerHTML = `<span class="material-icons-regular" style="font-size: 14px; vertical-align: middle; margin-left: 3px;">${iconName}</span> פרופיל: ${escapeHtml(roleName)}`;
  }

  const editButtons = [
    "quick-add-donation", "quick-add-expense", "quick-add-member", 
    "btn-inner-add-member", "btn-inner-add-expense", "btn-profile-deposit", 
    "btn-profile-edit", "btn-save-settings", "btn-report-add-donation", "btn-report-add-expense"
  ];
  editButtons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = canEdit ? "" : "none";
  });

  const navPurim = document.querySelector('.nav-item[data-screen="purim-registration-screen"]');
  if (navPurim) navPurim.style.display = canViewIncome ? "" : "none";
  
  const chartBox = document.getElementById("box-chart");
  if (chartBox) chartBox.style.display = canViewIncome ? "" : "none";
  const financeBox = document.getElementById("box-finance-chart");
  if (financeBox) financeBox.style.display = canViewIncome && canViewExpenses ? "" : "none";

  const navExpSum = document.querySelector('.nav-item[data-screen="expenses-summary-screen"]');
  if (navExpSum) navExpSum.style.display = canViewExpenses ? "" : "none";

  const navDailyReport = document.querySelector('.nav-item[data-screen="daily-report-screen"]');
  if (navDailyReport) navDailyReport.style.display = (canViewIncome || canViewExpenses) ? "" : "none";

  const navGrants = document.querySelector('.nav-item[data-screen="grants-screen"]');
  if (navGrants) navGrants.style.display = canViewGrants ? "" : "none";
  const btnGrantHistory = document.getElementById("btn-profile-grant");
  if (btnGrantHistory) btnGrantHistory.style.display = canViewGrants ? "" : "none";
  
  const navSettings = document.getElementById("nav-settings");
  if (navSettings) navSettings.style.display = isVIP ? "" : "none";
}

async function initApp() {
  cacheSettingsInputs();
  bindEvents();
  populateMemberSelect();
  populateFilters();
  populateExpenseCategorySelect();
  renderUsersTable();
  
  const initialHash = window.location.hash.replace("#", "");
  if (initialHash && screenMeta[initialHash]) switchScreen(initialHash, false);
  else switchScreen("dashboard-screen", true);

  renderAll();
  // אין צורך כאן בקריאה מחודשת לשרת, היא מנוהלת במסך הכניסה
}

async function fetchDataFromServer(isSilent = false) {
  if (!window.SB || !SB.isLoggedIn()) return false;
  try {
    // קודם שולחים שינויים שממתינים, כדי שהטעינה תכלול אותם
    if (readPendingWrites().length) await flushPendingWrites();
    const d = await SB.loadAll();
    state.members = (d.members || []).map(m => ({ ...m, yeshivaType: normalizeYeshivaType(m.yeshivaType) }));
    if (Array.isArray(d.donations)) state.donations = d.donations;
    if (Array.isArray(d.expenses)) state.expenses = d.expenses;
    if (Array.isArray(d.purimAddresses)) state.purimAddresses = d.purimAddresses;
    if (Array.isArray(d.profiles) && d.profiles.length) state.users = d.profiles;
    if (d.settings) state.settings = { ...DEFAULT_SETTINGS, ...d.settings };
    if (d.grantsArchive) state.grantsArchive = d.grantsArchive;
    applyPendingWritesToState();
    resolveCurrentUser();

    invalidateCache();
    saveState();
    cacheStore.set(LAST_SYNC_KEY, new Date().toISOString());

    if (!document.getElementById("login-screen").classList.contains("hidden-login")) {
      initLoginScreen();
    } else {
      populateMemberSelect();
      populateFilters();
      populateExpenseCategorySelect();
      renderUsersTable();
      renderAll();
      applyPermissions();
      if (state.activeScreen === "settings-screen") renderSettings();
      if (isSilent) console.log("נתונים סונכרנו מ-Supabase בהצלחה.");
    }
    updatePendingBanner();
    return true;
  } catch (error) {
    console.warn("שגיאה בטעינת נתונים מ-Supabase. מוצגים הנתונים האחרונים שנשמרו במחשב.", error);
    if (!isSilent) showToast("לא ניתן לטעון נתונים מהשרת כרגע. מוצגים הנתונים האחרונים שנטענו", "warning");
    return false;
  }
}


function cacheSettingsInputs() {
  const s = state.settings;
  setValue("current-campaign-year", s.campaignYear || DEFAULT_SETTINGS.campaignYear);
  setValue("target-chaider", s.targetChaider != null ? s.targetChaider : 0);
  setValue("target-ktana", s.targetKtana != null ? s.targetKtana : 450);
  setValue("target-gedola", s.targetGedola != null ? s.targetGedola : 1100);
  setValue("target-kibbutz", s.targetKibbutz != null ? s.targetKibbutz : 0);
  setValue("target-tiyul", s.targetTiyul != null ? s.targetTiyul : 700);
  setValue("target-shay", s.targetShayTotal != null ? s.targetShayTotal : 2000);
  setValue("gift1-name", s.gift1Name || "טיול");
  setValue("gift2-name", s.gift2Name || "מתנה");
  const g1 = document.getElementById("gift1-enabled"); if (g1) g1.checked = s.gift1Enabled !== false;
  const g2 = document.getElementById("gift2-enabled"); if (g2) g2.checked = s.gift2Enabled !== false;
  const gi1 = document.getElementById("gift1-image"); if (gi1) gi1.value = s.gift1Image || "";
  const gi2 = document.getElementById("gift2-image"); if (gi2) gi2.value = s.gift2Image || "";
  const ar = document.getElementById("additional-rules"); if (ar) ar.value = s.additionalRules || "";
  updateGiftCardStates();
}

function updateGiftCardStates() {
  const c1 = document.getElementById("gift1-card"); const e1 = document.getElementById("gift1-enabled");
  if (c1 && e1) c1.classList.toggle("is-off", !e1.checked);
  const c2 = document.getElementById("gift2-card"); const e2 = document.getElementById("gift2-enabled");
  if (c2 && e2) c2.classList.toggle("is-off", !e2.checked);
}

function bindEvents() {
  bindNavigation();
  bindHeaderActions();
  bindQuickActions(); 
  bindMemberModal();
  bindDonationModal();
  bindExpenseModal(); 
  bindGrantStatusModal();
  bindSettings();
  bindPhoneFormatting();
  bindMemberSearch();
  bindUXEnhancements();

  // ניווט ללוח בקרה בלחיצה על הלוגו בצד
  const sidebarLogo = document.getElementById("sidebar-logo");
  if (sidebarLogo) {
      sidebarLogo.addEventListener("click", () => {
          switchScreen("dashboard-screen", true);
      });
  }

  const btnRefresh = document.getElementById("btn-refresh-data");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      const icon = document.getElementById("refresh-icon");
      const btn = document.getElementById("btn-refresh-data");
      
      if(icon) {
          // הפעלת סיבוב רציף לאייקון
          icon.style.animation = "spin-linear 1s linear infinite";
      }
      if(btn) btn.disabled = true; // חסימת הלחיצה כדי למנוע כפילויות בזמן הטעינה
      
      // משיכת הנתונים מהשרת (ללא הודעות קופצות)
      await fetchDataFromServer();
      
      // סיום הסנכרון: עצירת הסיבוב ושחרור הכפתור
      if(icon) {
          icon.style.animation = "none";
      }
      if(btn) btn.disabled = false;
    });
  }

  const dashboardRefresh = document.getElementById("dashboard-refresh-data");
  if (dashboardRefresh) {
    dashboardRefresh.addEventListener("click", async () => {
      const icon = document.getElementById("dashboard-refresh-icon");
      if (icon) icon.style.animation = "spin-linear 1s linear infinite";
      dashboardRefresh.disabled = true;
      await fetchDataFromServer();
      if (icon) icon.style.animation = "none";
      dashboardRefresh.disabled = false;
    });
  }

  const dashboardLogout = document.getElementById("dashboard-logout");
  if (dashboardLogout) dashboardLogout.addEventListener("click", () => performLogout(false));

  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.screen) switchScreen(e.state.screen, false);
    else {
      const hash = window.location.hash.replace("#", "");
      if (hash && screenMeta[hash]) switchScreen(hash, false);
      else switchScreen("dashboard-screen", false);
    }
  });

  // --- מיון טבלת בחורים ---
  document.querySelectorAll(".sortable-header").forEach(th => {
      th.addEventListener("click", () => {
          const col = th.dataset.sort;
          if (membersSortCol === col) membersSortAsc = !membersSortAsc;
          else { membersSortCol = col; membersSortAsc = true; }

          document.querySelectorAll(".sortable-header").forEach(h => {
              h.classList.remove("sort-asc", "sort-desc");
          });
          th.classList.add(membersSortAsc ? "sort-asc" : "sort-desc");

          renderMembersTable();
      });
  });

  // --- אירועי מסך דו"ח יומי ---
  const timeFilter = document.getElementById("report-time-filter");
  const customDateInput = document.getElementById("report-custom-date");
  
  if (timeFilter) {
      timeFilter.addEventListener("change", (e) => {
          const group = document.getElementById("report-custom-date-group");
          if(group) group.style.display = e.target.value === "custom" ? "block" : "none";
          renderDailyReport();
      });
  }
  if (customDateInput) customDateInput.addEventListener("change", renderDailyReport);
  if (document.getElementById("btn-report-add-donation")) document.getElementById("btn-report-add-donation").addEventListener("click", () => openDonationModal());
  if (document.getElementById("btn-report-add-expense")) document.getElementById("btn-report-add-expense").addEventListener("click", () => openExpenseModal());

  // ==========================================
  // אירועי סליקת אשראי חכמה - נדרים פלוס
  // ==========================================
  const btnCloseNedarim = document.getElementById("btn-close-nedarim");
  if (btnCloseNedarim) {
      btnCloseNedarim.addEventListener("click", () => {
          const iframeStep = document.getElementById("nedarim-step-iframe");
          // אם אנחנו עדיין במסך הסליקה - מציגים את שאלת אישור התשלום (כמו הכפתור הישן)
          if (iframeStep && iframeStep.style.display !== "none") {
              iframeStep.style.display = "none";
              document.getElementById("nedarim-step-question").style.display = "flex";
              document.getElementById("nedarim-iframe").src = "";
          } else {
              // כבר עברנו את שלב הסליקה - סגירה רגילה
              document.getElementById("nedarim-modal").classList.remove("open");
          }
      });
  }

  const btnNedarimFailed = document.getElementById("btn-nedarim-failed");
  if (btnNedarimFailed) {
      btnNedarimFailed.addEventListener("click", () => {
          document.getElementById("nedarim-modal").classList.remove("open");
      });
  }

  const btnNedarimSuccess = document.getElementById("btn-nedarim-success");
  if (btnNedarimSuccess) {
      btnNedarimSuccess.addEventListener("click", () => {
          document.getElementById("nedarim-step-question").style.display = "none";
          document.getElementById("nedarim-member-input").value = "";
          document.getElementById("nedarim-amount").value = "";
          document.getElementById("nedarim-notes").value = "אשראי - נדרים פלוס";
          const conf = document.getElementById("nedarim-confirmation"); if (conf) conf.value = "";
          document.getElementById("nedarim-step-details").style.display = "block";
      });
  }

  const btnCancelNedarimDetails = document.getElementById("btn-cancel-nedarim-details");
  if (btnCancelNedarimDetails) {
      btnCancelNedarimDetails.addEventListener("click", () => {
           document.getElementById("nedarim-modal").classList.remove("open");
      });
  }

  const btnSaveNedarimFinal = document.getElementById("btn-save-nedarim-final");
  if (btnSaveNedarimFinal) {
      btnSaveNedarimFinal.addEventListener("click", async () => {
          const memberInput = document.getElementById("nedarim-member-input").value;
          const memberId = extractMemberId(memberInput);
          const amount = parseAmount(document.getElementById("nedarim-amount").value);
          const confirmation = (document.getElementById("nedarim-confirmation")?.value || "").trim();
          let notes = document.getElementById("nedarim-notes").value.trim();

          if (!memberId || amount === null) {
              showToast("⚠️ חובה לחפש בחור מתוך הרשימה ולהזין סכום ששולם (גדול מ-0)", "danger");
              return;
          }

          const member = getMemberSummaries().find((m) => String(m.id).trim() === String(memberId).trim()); 
          if (!member) {
              showToast("⚠️ הבחור לא אותר. אנא בחר מהרשימה התואמת", "danger");
              return;
          }
          if (!confirmation && !confirm("לא הוזן מספר אישור עסקה מנדרים פלוס. לשמור בכל זאת?")) return;
          if (confirmation) notes = `${notes} | אישור עסקה: ${confirmation}`.replace(/^ \| /, "");

          const newDonation = {
              id: generateId("D"), 
              date: getTodayIsoDate(), 
              memberId: memberId, 
              memberNameSnapshot: member.fullName, 
              year: member.currentYear,
              amount: amount, 
              notes: notes, 
              createdAt: new Date().toISOString()
          };

          const saveBtn = document.getElementById("btn-save-nedarim-final");
          saveBtn.disabled = true; 
          saveBtn.innerHTML = "⏳ שומר...";

          try {
              state.donations.push(newDonation); 
              invalidateCache(); 
              saveState(); 
              renderAll(); 
              
              document.getElementById("nedarim-modal").classList.remove("open"); 
              const saved = await persist("saveDonation", newDonation);
              reportSave(saved, "✅ התרומה נרשמה בהצלחה לזכות הבחור!");
              logAudit("create", "donation", newDonation.id, { amount, member: member.fullName, via: "נדרים פלוס", confirmation });
          } finally { 
              saveBtn.disabled = false; 
              saveBtn.innerHTML = `שמור במערכת <span class="material-icons-regular" style="font-size: 18px; margin-right: 8px;">check_circle</span>`;
          }
      });
  }
}

window.openNedarimModal = function() {
    const modal = document.getElementById("nedarim-modal");
    if (!modal) return;
    
    document.getElementById("nedarim-step-iframe").style.display = "flex";
    document.getElementById("nedarim-step-question").style.display = "none";
    document.getElementById("nedarim-step-details").style.display = "none";
    
    document.getElementById("nedarim-iframe").src = "https://www.matara.pro/nedarimplus/online/?mosad=7011408";
    
    modal.classList.add("open");
};

function bindNavigation() {
  const navItems = document.querySelectorAll(".nav-item:not(#btn-logout-top)");
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const screenId = btn.dataset.screen;
      if (!screenId) return;
      switchScreen(screenId, true);
    });
  });
}

function bindHeaderActions() {

  const memberSearchInput = document.getElementById("search-members-list");
  const memberYeshivaFilter = document.getElementById("filter-members-yeshiva");
  const memberCityFilter = document.getElementById("filter-members-city");
  const showMarriedCheckbox = document.getElementById("filter-show-married");
  const clearFiltersBtn = document.getElementById("btn-clear-members-filters");

  const runMemberFilter = debounce(() => { renderMembersTable(); }, 250);

  if (memberSearchInput) memberSearchInput.addEventListener("input", runMemberFilter);
  if (memberYeshivaFilter) memberYeshivaFilter.addEventListener("change", (e) => { state.filterYeshiva = e.target.value; runMemberFilter(); });
  if (memberCityFilter) memberCityFilter.addEventListener("change", (e) => { state.filterCity = e.target.value; runMemberFilter(); });
  if (showMarriedCheckbox) showMarriedCheckbox.addEventListener("change", runMemberFilter);
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (memberSearchInput) memberSearchInput.value = "";
      if (memberYeshivaFilter) memberYeshivaFilter.value = "";
      if (memberCityFilter) memberCityFilter.value = "";
      if (showMarriedCheckbox) showMarriedCheckbox.checked = false;
      state.filterYeshiva = ""; state.filterCity = ""; state.filterYeshivaTypes = [];
      const s = document.getElementById("filter-type-small"); if (s) s.checked = false;
      const b = document.getElementById("filter-type-big"); if (b) b.checked = false;
      renderMembersTable();
    });
  }
}

function bindUXEnhancements() {
  document.querySelectorAll(".drill-down-card").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const target = card.getAttribute("data-drill");
      if (target) switchScreen(target, true);
    });
  });

  if (document.getElementById("btn-export-members")) document.getElementById("btn-export-members").addEventListener("click", () => exportToCSV("members-table-body", "רשימת_בחורים"));

  // תשלום לחנות: שדות תאריך ואמצעי מוצגים רק כשמסמנים "שולם"
  const billPaid = document.getElementById("store-bill-paid");
  if (billPaid) billPaid.addEventListener("change", updateStoreBillPaidFields);
  const billModal = document.getElementById("store-bill-modal");
  if (billModal) billModal.addEventListener("click", (e) => { if (e.target === billModal) closeStoreBillModal(); });

  // הוספת חתן: בחירה מרשימת הבחורים ממלאת שם וטלפון
  const grantName = document.getElementById("grants-add-name");
  if (grantName) grantName.addEventListener("change", () => {
    const memberId = extractMemberId(grantName.value);
    if (!memberId) return;
    const m = state.members.find(x => String(x.id) === String(memberId));
    if (!m) return;
    grantName.value = `${m.firstName || ""} ${m.lastName || ""}`.trim();
    const phone = document.getElementById("grants-add-phone");
    if (phone && !phone.value && m.phone) phone.value = m.phone;
  });
}

function bindQuickActions() {
  const quickAddDonation = document.getElementById("quick-add-donation"); 
  const quickAddExpense = document.getElementById("quick-add-expense");
  const quickAddMember = document.getElementById("quick-add-member"); 
  
  if (quickAddDonation) quickAddDonation.addEventListener("click", () => openDonationModal());
  if (quickAddExpense) quickAddExpense.addEventListener("click", () => openExpenseModal());
  if (quickAddMember) quickAddMember.addEventListener("click", () => openMemberModal());
}

function bindPhoneFormatting() {
  const phoneInput = document.getElementById("member-phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function(e) {
      let val = e.target.value.replace(/\D/g, ''); 
      if (val.length > 3) val = val.substring(0, 3) + '-' + val.substring(3);
      e.target.value = val;
    });
  }
}

function bindMemberSearch() {
  const btnBackSearch = document.getElementById("btn-back-to-search");
  const btnInnerAddMember = document.getElementById("btn-inner-add-member");
  if (btnInnerAddMember) btnInnerAddMember.addEventListener("click", () => openMemberModal());
  
  if (btnBackSearch) {
    btnBackSearch.addEventListener("click", () => {
      document.getElementById("member-profile-section").classList.add("hidden");
      document.getElementById("members-list-section").classList.remove("hidden");
    });
  }

  const btnProfileDeposit = document.getElementById("btn-profile-deposit"); 
  const btnProfileEdit = document.getElementById("btn-profile-edit"); 
  const btnProfileGrant = document.getElementById("btn-profile-grant");
  if (btnProfileDeposit) btnProfileDeposit.addEventListener("click", () => openDonationModal(state.currentProfileId));
  if (btnProfileEdit) btnProfileEdit.addEventListener("click", () => { if (state.currentProfileId) openMemberModal(state.currentProfileId); });
  if (btnProfileGrant) btnProfileGrant.addEventListener("click", () => { if (state.currentProfileId) openGrantStatusModal(state.currentProfileId); });
}

function loadMemberProfile(memberId) {
  const summaries = getMemberSummaries();
  const member = summaries.find(m => String(m.id).trim() === String(memberId).trim());
  if (!member) return;

  state.currentProfileId = memberId;
  const listSec = document.getElementById("members-list-section");
  const profileSec = document.getElementById("member-profile-section");
  if(listSec) listSec.classList.add("hidden");
  if(profileSec) profileSec.classList.remove("hidden");

  setText("profile-full-name", member.fullName);
  
  let shiurText = member.shiur ? ` | שיעור ${member.shiur}` : "";
  if (member.yeshivaType === "חיידר") {
      shiurText = ""; 
  }
  
  setText("profile-yeshiva-details", `${member.yeshiva || "ישיבה לא הוזנה"}${shiurText} (${member.yeshivaType || ""})`);
  setText("profile-contact-details", `טלפון: ${member.phone || "---"} | כתובת: ${member.address || "---"}`);
  
  const iconsContainer = document.getElementById("profile-eligibility-icons");
  if (iconsContainer) {
    let iconsHtml = "";
    if (member.isEligible) iconsHtml += `<div title="זכאי למענק חתונה!" style="background: #16a34a; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px;">✅ זכאי למענק</div>`;
    const gift1Name = escapeHtml(state.settings.gift1Name || "טיול");
    const gift2Name = escapeHtml(state.settings.gift2Name || "מתנה");
    if (member.isEligibleTiyul) iconsHtml += `<div style="background: #15803d; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px;">🚌 זכאי ל${gift1Name}</div>`;
    if (member.isEligibleShay) iconsHtml += `<div style="background: #991b1b; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px;">🎁 זכאי ל${gift2Name}</div>`;
    iconsContainer.innerHTML = iconsHtml;
  }

  setText("profile-total-amount", formatCurrency(member.collectedThisYear));
  setText("profile-bar-target", formatCurrency(member.currentYearTarget));
  setText("profile-bar-debt", formatCurrency(member.openDebtNow != null ? member.openDebtNow : member.totalDebtFromPast));
  setText("profile-bar-required", formatCurrency(member.totalRequiredThisYear));
  
  const missingEl = document.getElementById("profile-bar-missing");
  if(missingEl) {
    if (member.missingAmount > 0) {
      missingEl.textContent = `חסר ${formatCurrency(member.missingAmount)}`; missingEl.style.color = "var(--danger)";
    } else {
      const surplus = member.collectedThisYear - member.totalRequiredThisYear;
      missingEl.textContent = surplus > 0 ? `עודף ${formatCurrency(surplus)}` : "הושלם בדיוק";
      missingEl.style.color = "var(--success)";
    }
  }

  const req = member.totalRequiredThisYear;
  const col = member.collectedThisYear;
  let percent = req > 0 ? Math.floor((col / req) * 100) : 100;
  if (percent > 100) percent = 100;
  
  const progBar = document.getElementById("profile-progress-bar");
  const progText = document.getElementById("profile-progress-text");
  if (progBar && progText) {
    progBar.style.width = percent + "%";
    progText.textContent = percent + "%";
    progBar.style.background = percent === 100 ? "var(--success)" : "var(--gold-main)";
  }

  // רשימת ההפקדות של הבחור (לחיצה על שורה פותחת עריכה)
  const donTbody = document.getElementById("profile-donations-tbody");
  if (donTbody) {
    const list = (state.donations || [])
      .filter(d => String(d.memberId).trim() === String(member.id).trim())
      .sort((a, b) => compareDatesDesc(a.date, b.date));
    setText("profile-donations-count", list.length ? `${list.length} הפקדות · סה"כ ${formatCurrency(sumArray(list, "amount"))}` : "");
    const canEdit = !state.currentUserObj || isAdminUser() || isTrue(state.currentUserObj.canEdit);
    donTbody.innerHTML = list.length ? list.map(d => `
      <tr${canEdit ? ` class="clickable-row" data-click="edit-donation" data-id="${escapeHtml(d.id)}" title="לחיצה לעריכה"` : ""}>
        <td>${escapeHtml(formatDateDisplay(d.date) || "—")}</td>
        <td>${escapeHtml(d.year || "")}</td>
        <td class="amount-cell" style="font-weight:bold; color: var(--success);">${escapeHtml(formatCurrency(d.amount))}</td>
        <td style="white-space:normal; color: var(--text-secondary);">${escapeHtml(d.notes || "")}</td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty-cell" style="padding:18px!important;">אין עדיין הפקדות לבחור הזה</td></tr>`;
  }
}

function bindGrantStatusModal() {
  const modal = document.getElementById("grant-status-modal");
  const closeModal = () => { if(modal) modal.classList.remove("open"); };
  if (document.getElementById("close-grant-status-modal")) document.getElementById("close-grant-status-modal").addEventListener("click", closeModal);
  if (document.getElementById("btn-close-grant-status")) document.getElementById("btn-close-grant-status").addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
}

function openGrantStatusModal(memberId) {
  const summaries = getMemberSummaries();
  const member = summaries.find(m => String(m.id).trim() === String(memberId).trim());
  if (!member) return;

  const modal = document.getElementById("grant-status-modal");
  document.getElementById("grant-status-name").textContent = member.fullName;
  
  const tbody = document.getElementById("grant-status-tbody");
  tbody.innerHTML = "";

  const isVIP = isAdminUser();
  const canViewHistory = isVIP ? true : (state.currentUserObj ? isTrue(state.currentUserObj.canViewHistory) : false);

  let dataToDisplay = member.yearlyData;
  if (!canViewHistory) {
    dataToDisplay = dataToDisplay.filter(d => String(d.year) === String(member.currentYear));
  }

  // באנר חוב פתוח
  const debtBannerEl = document.getElementById("grant-debt-banner");
  const openDebtNow = member.openDebtNow != null ? member.openDebtNow : member.totalDebtFromPast;
  if (debtBannerEl && openDebtNow > 0) {
    debtBannerEl.innerHTML = `<div style="background:#fef2f2;border:1.5px solid var(--danger);border-radius:10px;padding:12px 18px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
      <span class="material-icons-regular" style="color:var(--danger);font-size:22px;">warning</span>
      <div>
        <div style="font-weight:800;color:var(--danger);font-size:15px;">חוב פתוח: ${formatCurrency(openDebtNow)}</div>
        <div style="font-size:12px;color:#7f1d1d;margin-top:2px;">הסכום הנ"ל מתווסף ליעד השנה הנוכחית · השלמתו נדרשת לזכאות</div>
      </div>
    </div>`;
    if (debtBannerEl) debtBannerEl.style.display = "block";
  } else if (debtBannerEl) {
    debtBannerEl.style.display = "none";
  }

  if (dataToDisplay.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">אין נתונים זמינים להצגה.</td></tr>`;
  } else {
    dataToDisplay.forEach(data => {
      const isCurrentYear = data.year === member.currentYear;
      const required = data.requiredTotal != null ? data.requiredTotal : data.target;
      const debtIn = data.debtIn || 0;
      const debtOut = data.debtOut || 0;

      // עמודת "נדרש בפועל"
      let requiredHtml;
      if (data.target === 0) {
        requiredHtml = `<span style="color:var(--text-muted);">—</span>`;
      } else if (debtIn > 0) {
        requiredHtml = `<span style="font-weight:700;">${formatCurrency(required)}</span>
          <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">יעד ₪${data.target.toLocaleString()} + קנס ₪${debtIn.toLocaleString()}</div>`;
      } else {
        requiredHtml = `<span>${formatCurrency(required)}</span>`;
      }

      // עמודת סטטוס
      let statusHtml = "";
      if (data.target === 0) {
        if (debtOut > 0) {
          statusHtml = `<span style="color:var(--text-secondary);font-weight:600;">פטור מיעד</span><div style="font-size:10px;color:var(--text-muted);margin-top:1px;">חוב ₪${debtOut.toLocaleString()} ממתין</div>`;
        } else {
          statusHtml = `<span style="color:var(--text-secondary);font-weight:600;">פטור מיעד</span>`;
        }
      } else if (data.collected >= required && required > 0) {
        statusHtml = `<span style="color:var(--success);font-weight:800;">✓ עמד ביעד</span>`;
        if (debtIn > 0) statusHtml += `<div style="font-size:10px;color:var(--success);margin-top:1px;">כולל סגירת חוב</div>`;
      } else if (isCurrentYear) {
        const pct = required > 0 ? Math.round((data.collected / required) * 100) : 0;
        statusHtml = `<span style="color:var(--gold-dark);font-weight:700;">${pct}% הושלם</span>`;
      } else {
        const missing = required - data.collected;
        const newDebt = debtOut - Math.max(0, debtIn - Math.min(debtIn, data.collected));
        statusHtml = `<span style="color:var(--danger);font-weight:700;">חסר ${formatCurrency(missing)}</span>`;
        if (debtOut > debtIn) {
          const addedPenalty = debtOut - debtIn - Math.max(0, missing - Math.max(0, data.target - Math.max(0, data.collected)));
          statusHtml += `<div style="font-size:10px;color:var(--danger);margin-top:1px;">קנס: ₪${debtOut.toLocaleString()} עובר הלאה</div>`;
        }
      }

      let msgeret = data.historicalType || "";
      if (data.historicalShiur) msgeret += ` ${data.historicalShiur}'`;
      const rowBg = isCurrentYear ? "background:rgba(212,175,55,0.06);" : "";

      tbody.innerHTML += `<tr style="${rowBg}">
        <td style="font-weight:700;">${escapeHtml(data.year)}${isCurrentYear ? ' <span style="font-size:10px;color:var(--gold-dark);">השנה</span>' : ''}</td>
        <td style="color:var(--text-secondary);font-size:12px;">${escapeHtml(msgeret)}</td>
        <td>${data.target > 0 ? formatCurrency(data.target) : '<span style="color:var(--text-muted);">—</span>'}</td>
        <td>${requiredHtml}</td>
        <td style="font-weight:600;">${data.collected > 0 ? formatCurrency(data.collected) : '<span style="color:var(--text-muted);">—</span>'}</td>
        <td>${statusHtml}</td>
      </tr>`;
    });
  }

  if (modal) modal.classList.add("open");
}

function bindMemberModal() {
  const modal = document.getElementById("add-member-modal");
  const closeModal = () => { if(modal) modal.classList.remove("open"); resetMemberForm(); };
  // סגירה עם שמירה אוטומטית - אם יש שם פרטי+משפחה תקפים, נשמר; אחרת רק נסגור
  const closeWithAutoSave = () => {
    const hasNames = getValue("member-first-name").trim() && getValue("member-last-name").trim();
    if (hasNames) handleSaveMember(true);
    else closeModal();
  };
  if (document.getElementById("close-add-member-modal")) document.getElementById("close-add-member-modal").addEventListener("click", closeWithAutoSave);
  if (document.getElementById("cancel-add-member")) document.getElementById("cancel-add-member").addEventListener("click", closeModal);
  if (document.getElementById("save-member-btn")) document.getElementById("save-member-btn").addEventListener("click", () => handleSaveMember(false));
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeWithAutoSave(); });

  const yeshivaTypeSelect = document.getElementById("member-yeshiva-type");
  if (yeshivaTypeSelect) {
      yeshivaTypeSelect.addEventListener("change", (e) => {
          const val = e.target.value;
          const shiurInput = document.getElementById("member-shiur");
          if(shiurInput) {
              const shiurGroup = shiurInput.closest(".form-group");
              if (val === "חיידר") {
                  shiurGroup.style.display = "none";
                  shiurInput.value = "";
              } else {
                  shiurGroup.style.display = "block";
              }
          }
      });
  }
}

function showSavingIndicator() {
  let el = document.getElementById("saving-indicator");
  if (!el) {
    el = document.createElement("div");
    el.id = "saving-indicator";
    el.className = "saving-indicator";
    document.body.appendChild(el);
  }
  el.innerHTML = '<div class="si-spinner"></div><span>מעדכן...</span>';
  el.style.background = "#1c1c2e";
  clearTimeout(el._hideTimer);
  requestAnimationFrame(() => el.classList.add("visible"));
}

function hideSavingIndicator(success = true) {
  const el = document.getElementById("saving-indicator");
  if (!el) return;
  el.innerHTML = success
    ? '<span class="material-icons-regular si-icon">check_circle</span><span>עודכן בהצלחה</span>'
    : '<span class="material-icons-regular si-icon">cloud_off</span><span>נשמר במחשב, ממתין לשליחה</span>';
  el.style.background = success ? "var(--success)" : "var(--warning)";
  el._hideTimer = setTimeout(() => el.classList.remove("visible"), 2200);
}

async function handleSaveMember(isAutoSave = false) {
  isAutoSave = isAutoSave === true;
  const saveBtn = document.getElementById("save-member-btn");
  const existingId = getValue("edit-member-id").trim();
  const id = existingId || generateId("M");

  const newMemberData = {
    id, firstName: getValue("member-first-name").trim(), lastName: getValue("member-last-name").trim(), fatherName: getValue("member-father-name").trim(),
    phone: getValue("member-phone").trim(), yeshiva: getValue("member-yeshiva").trim(), shiur: getValue("member-shiur").trim(),
    yeshivaType: getValue("member-yeshiva-type"), maritalStatus: getValue("member-marital-status"), address: getValue("member-address").trim(), notes: getValue("member-notes").trim(),
  };

  if (!newMemberData.firstName || !newMemberData.lastName) { showToast("⚠️ יש להזין שם פרטי ושם משפחה", "danger"); return; }
  const existing = existingId ? state.members.find((m) => String(m.id).trim() === String(existingId).trim()) : null;
  newMemberData.createdAt = existing ? (existing.createdAt || new Date().toISOString()) : new Date().toISOString();

  // בסגירה אוטומטית של חלון עריכה בלי שינוי - לא שומרים כלום
  if (isAutoSave && existing) {
    const fields = ["firstName", "lastName", "fatherName", "phone", "yeshiva", "shiur", "yeshivaType", "maritalStatus", "address", "notes"];
    if (fields.every(f => String(existing[f] || "").trim() === String(newMemberData[f] || "").trim())) {
      document.getElementById("add-member-modal")?.classList.remove("open");
      clearFormDraft();
      return;
    }
  }

  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "שומר..."; }
  if (existing) {
    const index = state.members.indexOf(existing);
    state.members[index] = newMemberData;
  } else {
    state.members.push(newMemberData);
  }
  invalidateCache();
  saveState(); populateMemberSelect(); populateFilters(); renderAll();
  document.getElementById("add-member-modal")?.classList.remove("open");
  clearFormDraft();
  const profileOpen = !document.getElementById("member-profile-section")?.classList.contains("hidden");
  if (state.activeScreen === "members-screen" && existing && profileOpen && state.currentProfileId === id) loadMemberProfile(id);

  showSavingIndicator();
  const saved = await persist("saveMember", newMemberData);
  hideSavingIndicator(saved);
  logAudit(existing ? "update" : "create", "member", id, { name: `${newMemberData.firstName} ${newMemberData.lastName}` });
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "שמור בחור"; }
}

function openMemberModal(memberId = null) {
  const modal = document.getElementById("add-member-modal"); if (!modal) return;
  resetMemberForm(); const titleEl = document.getElementById("member-modal-title");
  if (memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (member) {
      if (titleEl) titleEl.textContent = "עדכון פרטי בחור";
      setValue("edit-member-id", member.id); setValue("member-first-name", member.firstName || ""); setValue("member-last-name", member.lastName || "");
      setValue("member-father-name", member.fatherName || ""); setValue("member-phone", member.phone || ""); setValue("member-yeshiva", member.yeshiva || "");
      setValue("member-yeshiva-type", member.yeshivaType || "ישיבה קטנה"); 
      setValue("member-shiur", member.shiur || "א");
      setValue("member-marital-status", member.maritalStatus || "רווק"); setValue("member-address", member.address || ""); setValue("member-notes", member.notes || "");
    }
  } else { if (titleEl) titleEl.textContent = "הוספת בחור חדש"; }
  modal.classList.add("open");
  
  const yeshivaSelect = document.getElementById("member-yeshiva-type");
  if(yeshivaSelect) yeshivaSelect.dispatchEvent(new Event("change"));
}

function resetMemberForm() { ["edit-member-id", "member-first-name", "member-last-name", "member-father-name", "member-phone", "member-yeshiva", "member-address", "member-notes", "member-shiur"].forEach(id => setValue(id, "")); setValue("member-yeshiva-type", "ישיבה קטנה"); setValue("member-marital-status", "רווק"); }

// ===== שנים לבחירה בחלונות הפקדה/הוצאה =====
function populateYearSelect(selectId, selectedYear) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const campaign = getCampaignYear();
  let idx = HEBREW_YEARS_ORDER.indexOf(campaign);
  if (idx === -1) idx = HEBREW_YEARS_ORDER.length - 1;
  const years = HEBREW_YEARS_ORDER.slice(Math.max(0, idx - 4), idx + 2);
  if (selectedYear && !years.includes(selectedYear)) years.push(selectedYear);
  sel.innerHTML = years.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}${y === campaign ? " (שנת הקמפיין)" : ""}</option>`).join("");
  sel.value = selectedYear || campaign;
}

function bindDonationModal() {
  const modal = document.getElementById("add-donation-modal"); 
  const closeModal = () => { if(modal) modal.classList.remove("open"); clearFormDraft(); populateMemberSelect(); };
  if (document.getElementById("close-add-donation-modal")) document.getElementById("close-add-donation-modal").addEventListener("click", closeModal);
  if (document.getElementById("cancel-add-donation")) document.getElementById("cancel-add-donation").addEventListener("click", closeModal);
  if (document.getElementById("save-donation-btn")) document.getElementById("save-donation-btn").addEventListener("click", handleSaveDonation);
  if (document.getElementById("delete-donation-btn")) document.getElementById("delete-donation-btn").addEventListener("click", handleDeleteDonation);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
}

async function handleSaveDonation() {
  const saveBtn = document.getElementById("save-donation-btn");
  const editId = getValue("edit-donation-id").trim();
  const existing = editId ? state.donations.find(d => String(d.id) === editId) : null;
  const memberInput = getValue("donation-member-input").trim(); 
  const memberId = extractMemberId(memberInput); 
  
  const amount = parseAmount(getValue("donation-amount"));
  let notes = getValue("donation-notes").trim(); 
  const paymentMethod = document.querySelector('input[name="donation_payment_method"]:checked')?.value || "cash";
  
  if (!memberId || amount === null) { 
    showToast("⚠️ יש לחפש ולבחור בחור מתוך הרשימה, ולהזין סכום גדול מ-0", "danger"); 
    return; 
  }

  const member = getMemberSummaries().find((m) => String(m.id).trim() === String(memberId).trim()); 
  if (!member) {
    showToast("❌ שגיאה: נתוני הבחור לא אותרו במערכת", "danger");
    return;
  }

  const donation = {
    id: existing ? existing.id : generateId("D"),
    date: getValue("donation-date").trim() || getTodayIsoDate(), memberId, memberNameSnapshot: member.fullName,
    year: getValue("donation-year") || (existing ? existing.year : member.currentYear),
    amount, notes: (paymentMethod === "credit" ? `(אשראי) ${notes}` : notes).trim(),
    createdAt: existing ? (existing.createdAt || new Date().toISOString()) : new Date().toISOString(),
  };

  saveBtn.disabled = true; saveBtn.textContent = "שומר...";
  if (existing) state.donations[state.donations.indexOf(existing)] = donation;
  else state.donations.push(donation);
  invalidateCache(); 
  saveState(); renderAll(); document.getElementById("add-donation-modal").classList.remove("open"); 
  clearFormDraft();
  if (state.activeScreen === "members-screen" && state.currentProfileId) loadMemberProfile(state.currentProfileId);
  const saved = await persist("saveDonation", donation);
  reportSave(saved, existing ? "✅ ההפקדה עודכנה" : "✅ ההפקדה נרשמה בהצלחה!");
  logAudit(existing ? "update" : "create", "donation", donation.id, existing
    ? { before: { amount: existing.amount, date: existing.date, member: existing.memberId, year: existing.year }, after: { amount, date: donation.date, member: memberId, year: donation.year } }
    : { amount, member: member.fullName, year: donation.year });
  saveBtn.disabled = false; saveBtn.textContent = "שמור הפקדה"; 
}

async function handleDeleteDonation() {
  const editId = getValue("edit-donation-id").trim();
  const existing = state.donations.find(d => String(d.id) === editId);
  if (!existing || !isAdminUser()) return;
  if (!confirm(`למחוק את ההפקדה על סך ${formatCurrency(existing.amount)}? הפעולה לא ניתנת לביטול.`)) return;
  state.donations = state.donations.filter(d => d !== existing);
  invalidateCache(); saveState(); renderAll();
  document.getElementById("add-donation-modal").classList.remove("open");
  clearFormDraft();
  if (state.activeScreen === "members-screen" && state.currentProfileId) loadMemberProfile(state.currentProfileId);
  const saved = await persist("deleteDonation", { id: existing.id });
  reportSave(saved, "ההפקדה נמחקה");
  logAudit("delete", "donation", existing.id, { amount: existing.amount, date: existing.date, member: existing.memberNameSnapshot || existing.memberId, year: existing.year });
}

function openDonationModal(memberId = null, donationId = null) {
  const modal = document.getElementById("add-donation-modal"); if (!modal) return;
  const existing = donationId ? state.donations.find(d => String(d.id) === String(donationId)) : null;
  if ((existing || !donationId) && !canEditUser()) { showToast("אין לך הרשאת עריכה", "warning"); return; }
  setValue("edit-donation-id", existing ? existing.id : "");
  setValue("donation-date", existing ? (toDateInputValue(existing.date) || "") : getTodayIsoDate()); 
  setValue("donation-amount", existing ? existing.amount : ""); 
  let notes = existing ? String(existing.notes || "") : "";
  const isCredit = /^\(אשראי\)\s*/.test(notes);
  notes = notes.replace(/^\(אשראי\)\s*/, "");
  setValue("donation-notes", notes); 
  const radio = document.querySelector(`input[name="donation_payment_method"][value="${isCredit ? "credit" : "cash"}"]`); 
  if (radio) radio.checked = true;
  populateYearSelect("donation-year", existing ? existing.year : null);

  const inputEl = document.getElementById("donation-member-input");
  if (inputEl) inputEl.value = "";
  const targetMemberId = existing ? existing.memberId : memberId;
  if (targetMemberId) { 
      const m = state.members.find(x => String(x.id) === String(targetMemberId));
      if (m && inputEl) {
          inputEl.value = `${m.lastName || ""} ${m.firstName || ""} | ${m.yeshiva || ""} [${m.id}]`;
      }
  } 
  const title = document.getElementById("donation-modal-title");
  if (title) title.textContent = existing ? "עריכת הפקדה" : "רישום הפקדה חדשה";
  const delBtn = document.getElementById("delete-donation-btn");
  if (delBtn) delBtn.style.display = existing && isAdminUser() ? "" : "none";
  const meta = document.getElementById("donation-meta");
  if (meta) meta.textContent = existing && existing.createdAt ? `נרשם ב-${formatDateDisplay(existing.createdAt)}` : "";
  modal.classList.add("open");
}

function bindExpenseModal() {
  const modal = document.getElementById("add-expense-modal"); const closeModal = () => { if(modal) modal.classList.remove("open"); clearFormDraft(); };
  if (document.getElementById("close-add-expense-modal")) document.getElementById("close-add-expense-modal").addEventListener("click", closeModal);
  if (document.getElementById("cancel-add-expense")) document.getElementById("cancel-add-expense").addEventListener("click", closeModal);
  if (document.getElementById("save-expense-btn")) document.getElementById("save-expense-btn").addEventListener("click", handleSaveExpense);
  if (document.getElementById("delete-expense-btn")) document.getElementById("delete-expense-btn").addEventListener("click", handleDeleteExpense);
}

function openExpenseModal(expenseId = null) {
  const modal = document.getElementById("add-expense-modal"); if (!modal) return;
  const existing = expenseId ? state.expenses.find(e => String(e.id) === String(expenseId)) : null;
  if (!canEditUser()) { showToast("אין לך הרשאת עריכה", "warning"); return; }
  populateExpenseCategorySelect(existing ? existing.category : null);
  setValue("edit-expense-id", existing ? existing.id : "");
  setValue("expense-date", existing ? (toDateInputValue(existing.date) || "") : getTodayIsoDate());
  const cats = getExpenseCategories();
  setValue("expense-category", existing ? (existing.category || "שונות") : (cats[0] || "שונות"));
  setValue("expense-description", existing ? (existing.description || "") : "");
  setValue("expense-amount", existing ? existing.amount : "");
  populateYearSelect("expense-year", existing ? existing.year : null);
  const title = document.getElementById("expense-modal-title");
  if (title) title.textContent = existing ? "עריכת הוצאה" : "הוספת הוצאה";
  const delBtn = document.getElementById("delete-expense-btn");
  if (delBtn) delBtn.style.display = existing && isAdminUser() ? "" : "none";
  const meta = document.getElementById("expense-meta");
  if (meta) meta.textContent = existing ? [existing.approvedBy ? `נרשם ע"י ${existing.approvedBy}` : "", existing.createdAt ? `ב-${formatDateDisplay(existing.createdAt)}` : ""].filter(Boolean).join(" ") : "";
  const saveBtn = document.getElementById("save-expense-btn");
  if (saveBtn) saveBtn.textContent = existing ? "שמור שינויים" : "הוסף הוצאה";
  modal.classList.add("open");
}

async function handleSaveExpense() {
  const saveBtn = document.getElementById("save-expense-btn");
  const editId = getValue("edit-expense-id").trim();
  const existing = editId ? state.expenses.find(e => String(e.id) === editId) : null;
  const amount = parseAmount(getValue("expense-amount"));
  if (amount === null) { showToast("⚠️ יש להזין סכום גדול מ-0", "danger"); return; }

  const expense = {
    id: existing ? existing.id : generateId("E"),
    date: getValue("expense-date").trim() || getTodayIsoDate(),
    year: getValue("expense-year") || (existing ? existing.year : getCampaignYear()),
    category: getValue("expense-category"), description: getValue("expense-description").trim(), amount,
    approvedBy: existing ? (existing.approvedBy || state.currentUser || "") : (state.currentUser || ""),
    createdAt: existing ? (existing.createdAt || new Date().toISOString()) : new Date().toISOString(),
  };
  saveBtn.disabled = true; saveBtn.textContent = "שומר..."; 
  if (existing) state.expenses[state.expenses.indexOf(existing)] = expense;
  else state.expenses.push(expense);
  invalidateCache();
  saveState(); renderAll(); document.getElementById("add-expense-modal").classList.remove("open"); 
  clearFormDraft();
  const saved = await persist("saveExpense", expense);
  reportSave(saved, existing ? "✅ ההוצאה עודכנה" : "✅ ההוצאה נרשמה בהצלחה!");
  logAudit(existing ? "update" : "create", "expense", expense.id, existing
    ? { before: { amount: existing.amount, category: existing.category, description: existing.description }, after: { amount, category: expense.category, description: expense.description } }
    : { amount, category: expense.category, description: expense.description });
  saveBtn.disabled = false; saveBtn.textContent = existing ? "שמור שינויים" : "הוסף הוצאה"; 
}

async function handleDeleteExpense() {
  const editId = getValue("edit-expense-id").trim();
  const existing = state.expenses.find(e => String(e.id) === editId);
  if (!existing || !isAdminUser()) return;
  if (!confirm(`למחוק את ההוצאה "${existing.description || existing.category}" על סך ${formatCurrency(existing.amount)}? הפעולה לא ניתנת לביטול.`)) return;
  state.expenses = state.expenses.filter(e => e !== existing);
  invalidateCache(); saveState(); renderAll();
  document.getElementById("add-expense-modal").classList.remove("open");
  clearFormDraft();
  const saved = await persist("deleteExpense", { id: existing.id });
  reportSave(saved, "ההוצאה נמחקה");
  logAudit("delete", "expense", existing.id, { amount: existing.amount, category: existing.category, description: existing.description, year: existing.year });
}

function bindSettings() {
  if (document.getElementById("btn-save-settings")) document.getElementById("btn-save-settings").addEventListener("click", saveSettings);

  // ניווט פנימי בהגדרות
  document.querySelectorAll(".settings-tab").forEach(tab => {
    tab.addEventListener("click", () => switchSettingsTab(tab.dataset.tab));
  });

  // קטגוריות הוצאות
  const addCatBtn = document.getElementById("btn-add-category");
  if (addCatBtn) addCatBtn.addEventListener("click", () => addExpenseCategory());
  const newCatInput = document.getElementById("new-expense-category");
  if (newCatInput) newCatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addExpenseCategory(); } });

  // גיבוי וסנכרון
  const syncBtn = document.getElementById("btn-sync-now");
  if (syncBtn) syncBtn.addEventListener("click", () => syncNow());
  const exportBtn = document.getElementById("btn-export-backup");
  if (exportBtn) exportBtn.addEventListener("click", () => exportFullBackup());
  const importBtn = document.getElementById("btn-import-backup");
  const importFile = document.getElementById("import-backup-file");
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", (e) => { importFullBackup(e.target.files[0]); e.target.value = ""; });
  }

  // מתגי מתנות - עדכון מצב ויזואלי בזמן אמת
  ["gift1-enabled", "gift2-enabled"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateGiftCardStates);
  });
}

function saveSettings() {
  const read = () => ({
    campaignYear: getValue("current-campaign-year").trim() || DEFAULT_SETTINGS.campaignYear,
    targetChaider: Number(getValue("target-chaider")) || 0,
    targetKtana: Number(getValue("target-ktana")) || 0,
    targetGedola: Number(getValue("target-gedola")) || 0,
    targetKibbutz: Number(getValue("target-kibbutz")) || 0,
    targetTiyul: Number(getValue("target-tiyul")) || 0,
    targetShayTotal: Number(getValue("target-shay")) || 0,
    gift1Name: getValue("gift1-name").trim() || "טיול",
    gift2Name: getValue("gift2-name").trim() || "מתנה",
    gift1Enabled: !!document.getElementById("gift1-enabled")?.checked,
    gift2Enabled: !!document.getElementById("gift2-enabled")?.checked,
    gift1Image: (document.getElementById("gift1-image")?.value || "").trim(),
    gift2Image: (document.getElementById("gift2-image")?.value || "").trim(),
    additionalRules: (document.getElementById("additional-rules")?.value || "").trim(),
  });
  const values = read();
  const btn = document.getElementById("btn-save-settings");
  if (btn) btn.disabled = true;
  const p = saveSettingsPatch(settings => Object.assign(settings, values));
  renderAll();
  p.then(saved => {
    reportSave(saved, "✅ הגדרות המערכת נשמרו בהצלחה");
    logAudit("update", "settings", "targets", values);
  }).finally(() => { if (btn) btn.disabled = false; });
}

// ===== מסך תקנון =====

// SVG דמויות לכל שלב — בלי עניבה
const TAKANON_SVG = {

  // חיידר — כיפה שחורה, ילד צעיר
  kippah: `<svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 90 Q8 70 40 64 Q72 70 72 90Z" fill="#1e2035"/>
    <path d="M34 67 Q40 72 46 67 Q44 64 40 66 Q36 64 34 67Z" fill="#e8e8e8"/>
    <ellipse cx="20" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <ellipse cx="60" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <circle cx="40" cy="42" r="21" fill="#FBCFA4"/>
    <path d="M21 38 Q21 18 40 18 Q59 18 59 38Z" fill="#1a1a1a"/>
    <path d="M21 38 Q40 41 59 38" stroke="#111" stroke-width="1" fill="none"/>
    <path d="M30 33 Q34 31 37 33" stroke="#5a3010" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M43 33 Q46 31 50 33" stroke="#5a3010" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="33" cy="38" rx="3.5" ry="4" fill="white"/>
    <ellipse cx="47" cy="38" rx="3.5" ry="4" fill="white"/>
    <circle cx="33" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="47" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="34" cy="37.5" r="0.8" fill="white"/>
    <circle cx="48" cy="37.5" r="0.8" fill="white"/>
    <path d="M37 44 Q40 48 43 44" stroke="#d4956b" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M33 52 Q40 57 47 52" stroke="#c07850" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`,

  // ישי"ק — כובע שחור, בלי זקן
  hat: `<svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 90 Q8 70 40 64 Q72 70 72 90Z" fill="#1e2035"/>
    <path d="M34 67 Q40 72 46 67 Q44 64 40 66 Q36 64 34 67Z" fill="#e8e8e8"/>
    <ellipse cx="20" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <ellipse cx="60" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <circle cx="40" cy="42" r="21" fill="#FBCFA4"/>
    <rect x="26" y="10" width="28" height="22" rx="3" fill="#111111"/>
    <rect x="13" y="30" width="54" height="8" rx="2.5" fill="#111111"/>
    <rect x="26" y="29" width="28" height="4" fill="#0a0a0a"/>
    <path d="M30 33 Q34 31 37 33" stroke="#5a3010" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M43 33 Q46 31 50 33" stroke="#5a3010" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="33" cy="38" rx="3.5" ry="4" fill="white"/>
    <ellipse cx="47" cy="38" rx="3.5" ry="4" fill="white"/>
    <circle cx="33" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="47" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="34" cy="37.5" r="0.8" fill="white"/>
    <circle cx="48" cy="37.5" r="0.8" fill="white"/>
    <path d="M37 44 Q40 48 43 44" stroke="#d4956b" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M33 52 Q40 57 47 52" stroke="#c07850" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`,

  // ישי"ג — כובע + זקן קצר חום בהיר + פאות קצרות
  hatBeard: `<svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 90 Q8 70 40 64 Q72 70 72 90Z" fill="#1e2035"/>
    <path d="M34 67 Q40 72 46 67 Q44 64 40 66 Q36 64 34 67Z" fill="#e8e8e8"/>
    <ellipse cx="20" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <ellipse cx="60" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <circle cx="40" cy="42" r="21" fill="#FBCFA4"/>
    <rect x="26" y="10" width="28" height="22" rx="3" fill="#111111"/>
    <rect x="13" y="30" width="54" height="8" rx="2.5" fill="#111111"/>
    <rect x="26" y="29" width="28" height="4" fill="#0a0a0a"/>
    <path d="M30 33 Q34 31 37 33" stroke="#5a3010" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M43 33 Q46 31 50 33" stroke="#5a3010" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="33" cy="38" rx="3.5" ry="4" fill="white"/>
    <ellipse cx="47" cy="38" rx="3.5" ry="4" fill="white"/>
    <circle cx="33" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="47" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="34" cy="37.5" r="0.8" fill="white"/>
    <circle cx="48" cy="37.5" r="0.8" fill="white"/>
    <path d="M37 44 Q40 48 43 44" stroke="#d4956b" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M34 52 Q40 55 46 52" stroke="#c07850" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M21 47 Q19 54 23 58" stroke="#8B5A2B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M59 47 Q61 54 57 58" stroke="#8B5A2B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M27 56 Q40 65 53 56 Q50 62 40 63 Q30 62 27 56Z" fill="#8B5A2B" opacity="0.9"/>
  </svg>`,

  // קיבוץ — כובע + זקן מלא כהה ורחב, פאות ארוכות
  hatFullBeard: `<svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 90 Q8 70 40 64 Q72 70 72 90Z" fill="#1e2035"/>
    <path d="M34 67 Q40 72 46 67 Q44 64 40 66 Q36 64 34 67Z" fill="#e8e8e8"/>
    <ellipse cx="20" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <ellipse cx="60" cy="44" rx="4" ry="5" fill="#FBCFA4"/>
    <circle cx="40" cy="42" r="21" fill="#FBCFA4"/>
    <rect x="26" y="10" width="28" height="22" rx="3" fill="#111111"/>
    <rect x="13" y="30" width="54" height="8" rx="2.5" fill="#111111"/>
    <rect x="26" y="29" width="28" height="4" fill="#0a0a0a"/>
    <path d="M30 33 Q34 31 37 33" stroke="#3a200a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M43 33 Q46 31 50 33" stroke="#3a200a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="33" cy="38" rx="3.5" ry="4" fill="white"/>
    <ellipse cx="47" cy="38" rx="3.5" ry="4" fill="white"/>
    <circle cx="33" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="47" cy="38.5" r="2.2" fill="#2c1505"/>
    <circle cx="34" cy="37.5" r="0.8" fill="white"/>
    <circle cx="48" cy="37.5" r="0.8" fill="white"/>
    <path d="M37 44 Q40 48 43 44" stroke="#d4956b" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M19 41 Q17 53 21 61" stroke="#2d1606" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M61 41 Q63 53 59 61" stroke="#2d1606" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M21 51 Q40 70 59 51 Q56 66 40 68 Q24 66 21 51Z" fill="#2d1606"/>
    <path d="M26 58 Q40 65 54 58" stroke="#3d2008" stroke-width="1.2" fill="none" opacity="0.45"/>
  </svg>`
};

function renderRulesScreen() {
  const container = document.getElementById("takanon-content");
  if (!container) return;
  const s = state.settings;
  const year = getCampaignYear();
  const gift1Name = s.gift1Name || "טיול";
  const gift2Name = s.gift2Name || "מתנה";
  const gift1On = s.gift1Enabled !== false;
  const gift2On = s.gift2Enabled !== false;
  const targetTiyul = Number(s.targetTiyul) || 0;
  const targetShay = Number(s.targetShayTotal) || 0;

  const types = [
    { name: "חיידר",  svg: TAKANON_SVG.hat,          target: Number(s.targetChaider) || 0 },
    { name: 'ישי"ק',  svg: TAKANON_SVG.hatBeard,     target: Number(s.targetKtana)   || 0 },
    { name: 'ישי"ג',  svg: TAKANON_SVG.hatFullBeard, target: Number(s.targetGedola)  || 0 },
    { name: "קיבוץ",  svg: TAKANON_SVG.hatFullBeard, target: Number(s.targetKibbutz) || 0 },
  ];

  const typeCardsHtml = types.map(t => `
    <div class="takanon-type-card${t.target === 0 ? ' takanon-type-inactive' : ''}">
      <div class="takanon-type-avatar">${t.svg}</div>
      <div class="takanon-type-name">${t.name}</div>
      <div class="takanon-type-target">${t.target > 0 ? formatCurrency(t.target) : '—'}</div>
      <div class="takanon-type-sublabel">${t.target > 0 ? 'יעד שנתי' : 'לא הוגדר'}</div>
    </div>`).join('');

  const additionalRules = (s.additionalRules || "").trim();
  const additionalHtml = additionalRules ? `
    <div class="takanon-section">
      <div class="takanon-section-title"><span class="material-icons-regular">info</span> כללים נוספים</div>
      <div class="takanon-rules-text">${escapeHtml(additionalRules).replace(/\n/g, '<br>')}</div>
    </div>` : '';

  // כרטיסי פרס קומפקטיים אופקיים
  const buildGiftCard = (name, target, image, emoji) => {
    const mediaHtml = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" class="takanon-prize-thumb" data-fallback="${escapeHtml(emoji)}">`
      : `<div class="takanon-prize-emoji">${emoji}</div>`;
    return `<div class="takanon-prize-card">
      ${mediaHtml}
      <div class="takanon-prize-body">
        <div class="takanon-prize-name">${escapeHtml(name)}</div>
        <div class="takanon-prize-threshold">לאיסוף ${formatCurrency(target)} ומעלה</div>
      </div>
    </div>`;
  };

  let prizesHtml = '';
  if (gift1On && targetTiyul > 0) prizesHtml += buildGiftCard(gift1Name, targetTiyul, s.gift1Image || "", "🚌");
  if (gift2On && targetShay > 0)  prizesHtml += buildGiftCard(gift2Name, targetShay,  s.gift2Image || "", "🎁");

  container.innerHTML = `
    <div class="takanon-hero">
      <div class="takanon-hero-left">
        <div class="takanon-hero-title">תקנון עייזר חתנים</div>
        <div class="takanon-hero-sub">כללי גבייה, יעדים ומתנות</div>
      </div>
      <div class="takanon-hero-year">שנת ${escapeHtml(year)}</div>
    </div>

    <div class="takanon-main-grid">
      <div class="takanon-col-left">
        <div class="takanon-section-label"><span class="material-icons-regular">flag</span> יעדי גבייה לפי שלב</div>
        <div class="takanon-types-grid-2x2">${typeCardsHtml}</div>
      </div>

      <div class="takanon-col-right">
        ${prizesHtml ? `
          <div class="takanon-section-label"><span class="material-icons-regular">card_giftcard</span> מתנות וזכאויות</div>
          <div class="takanon-prizes-list">${prizesHtml}</div>
          <div class="takanon-col-divider"></div>` : ''}
        <div class="takanon-section-label"><span class="material-icons-regular">manage_search</span> בדיקת מצב אישי</div>
        <div class="takanon-lookup-box">
          <input type="text" id="takanon-member-input" class="ui-input" placeholder="חפש לפי שם..." data-input="takanon-search" autocomplete="off">
          <div id="takanon-search-results" class="takanon-search-dropdown" style="display:none;"></div>
        </div>
        <div id="takanon-member-card" class="takanon-member-card" style="display:none;"></div>
      </div>
    </div>

    ${additionalHtml}
  `;

  // תמונת מתנה שלא נטענה מוחלפת באייקון ברירת המחדל (במקום onerror מוטמע)
  container.querySelectorAll("img.takanon-prize-thumb").forEach(img => {
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "takanon-prize-emoji";
      fallback.textContent = img.dataset.fallback || "";
      img.replaceWith(fallback);
    }, { once: true });
  });
}

window.takanonSearch = function(term) {
  const resultsEl = document.getElementById("takanon-search-results");
  const cardEl = document.getElementById("takanon-member-card");
  if (cardEl) cardEl.style.display = "none";
  if (!resultsEl) return;
  if (!term.trim()) { resultsEl.innerHTML = ""; resultsEl.style.display = "none"; return; }

  const t = term.trim();
  const summaries = getMemberSummaries();
  const matches = summaries.filter(m =>
    (m.fullName || "").includes(t) || (m.firstName || "").includes(t) || (m.lastName || "").includes(t)
  ).slice(0, 8);

  if (!matches.length) {
    resultsEl.innerHTML = '<div class="takanon-no-results">לא נמצא בחור בשם זה</div>';
    resultsEl.style.display = "block";
    return;
  }
  resultsEl.innerHTML = matches.map(m =>
    `<div class="takanon-search-item" data-click="takanon-pick" data-id="${escapeHtml(String(m.id))}">
      <span class="takanon-search-name">${escapeHtml(m.fullName)}</span>
      <span class="takanon-search-meta">${escapeHtml(m.yeshiva || m.yeshivaType || "")}</span>
    </div>`
  ).join('');
  resultsEl.style.display = "block";
};

window.takanonShowMember = function(memberId) {
  const resultsEl = document.getElementById("takanon-search-results");
  if (resultsEl) resultsEl.style.display = "none";
  const cardEl = document.getElementById("takanon-member-card");
  if (!cardEl) return;

  const member = getMemberSummaries().find(m => String(m.id) === String(memberId));
  if (!member) return;

  const inp = document.getElementById("takanon-member-input");
  if (inp) inp.value = member.fullName;

  const s = state.settings;
  const year = getCampaignYear();
  const collected = member.collectedThisYear || 0;
  const target = member.totalRequiredThisYear || member.currentYearTarget || 0;
  const gap = Math.max(0, target - collected);
  const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const barColor = gap === 0 ? 'var(--success)' : pct >= 60 ? '#d97706' : 'var(--danger)';
  const gift1Name = s.gift1Name || "טיול";
  const gift2Name = s.gift2Name || "מתנה";
  const tiyulTarget = Number(s.targetTiyul) || 0;
  const shayTarget = Number(s.targetShayTotal) || 0;

  let badgesHtml = "";
  if (member.isEligibleTiyul) badgesHtml += `<div class="takanon-badge takanon-badge-green">✅ זכאי ל${escapeHtml(gift1Name)}</div>`;
  else if (s.gift1Enabled !== false && tiyulTarget > 0 && collected < tiyulTarget)
    badgesHtml += `<div class="takanon-badge takanon-badge-gray">🚌 ${escapeHtml(gift1Name)} — חסר עוד ${formatCurrency(tiyulTarget - collected)}</div>`;
  if (member.isEligibleShay) badgesHtml += `<div class="takanon-badge takanon-badge-green">✅ זכאי ל${escapeHtml(gift2Name)}</div>`;
  else if (s.gift2Enabled !== false && shayTarget > 0 && collected < shayTarget)
    badgesHtml += `<div class="takanon-badge takanon-badge-gray">🎁 ${escapeHtml(gift2Name)} — חסר עוד ${formatCurrency(shayTarget - collected)}</div>`;

  const debt = member.totalDebtFromPast || 0;
  const baseTarget = member.currentYearTarget || 0;
  const debtRowHtml = debt > 0 ? `
    <div style="background:#fef2f2;border:1px solid var(--danger);border-radius:8px;padding:9px 12px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
      <span class="material-icons-regular" style="color:var(--danger);font-size:17px;flex-shrink:0;">warning</span>
      <div style="font-size:12px;">
        <span style="font-weight:800;color:var(--danger);">קנס מהעבר: ${formatCurrency(debt)}</span>
        <span style="color:#7f1d1d;"> · יעד בסיס ${formatCurrency(baseTarget)} + קנס ${formatCurrency(debt)} = נדרש ${formatCurrency(target)}</span>
      </div>
    </div>` : '';

  cardEl.innerHTML = `
    <div class="takanon-mc-header">
      <div class="takanon-mc-name">${escapeHtml(member.fullName)}</div>
      <div class="takanon-mc-meta">${escapeHtml(member.yeshiva || "")}${member.yeshivaType ? ' · ' + escapeHtml(member.yeshivaType) : ''}</div>
    </div>
    <div class="takanon-mc-year">שנת ${escapeHtml(year)}</div>
    ${debtRowHtml}
    <div class="takanon-mc-progress">
      <div class="takanon-pb-wrap"><div class="takanon-pb-fill" style="width:${pct}%;background:${barColor};"></div></div>
      <div class="takanon-pb-pct">${pct}%</div>
    </div>
    <div class="takanon-mc-amounts">
      <div class="takanon-mc-amount"><div class="takanon-mc-val" style="color:var(--success)">${formatCurrency(collected)}</div><div class="takanon-mc-lbl">נאסף</div></div>
      <div class="takanon-mc-amount"><div class="takanon-mc-val">${formatCurrency(target)}</div><div class="takanon-mc-lbl">${debt > 0 ? 'נדרש כולל' : 'יעד'}</div></div>
      <div class="takanon-mc-amount"><div class="takanon-mc-val" style="color:${gap > 0 ? 'var(--danger)' : 'var(--success)'}">${gap > 0 ? formatCurrency(gap) : '✓ הושלם'}</div><div class="takanon-mc-lbl">חסר</div></div>
    </div>
    ${badgesHtml ? `<div class="takanon-badges-row">${badgesHtml}</div>` : ''}
  `;
  cardEl.style.display = "block";
};

// ===== מסך הגדרות: ניווט פנימי =====
function switchSettingsTab(tabName) {
  document.querySelectorAll(".settings-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".settings-pane").forEach(p => p.classList.toggle("active", p.dataset.pane === tabName));
  if (tabName === "audit") renderAuditLog();
}

// ===== יומן פעולות =====
const AUDIT_ACTIONS = { create: "הוספה", update: "עדכון", delete: "מחיקה", import: "ייבוא", paid: "סימון תשלום", upload: "העלאת קבלה" };
const AUDIT_ENTITIES = {
  member: "בחור", donation: "הפקדה", expense: "הוצאה", purim: "כתובות פורים", settings: "הגדרות", "expense-category": "קטגוריית הוצאה",
  "grant-recipient": "מקבל מענק", "grant-package": "תכולת מענק", "grant-year": "שנת מענקים", "store-bill": "תשלום לחנות", backup: "גיבוי", profile: "הרשאות משתמש",
};
function describeAuditDetails(d) {
  if (!d || typeof d !== "object") return "";
  if (d.before && d.after) {
    return Object.keys(d.after).filter(k => JSON.stringify(d.before[k]) !== JSON.stringify(d.after[k]))
      .map(k => `${k}: ${d.before[k] ?? "—"} ← ${d.after[k] ?? "—"}`).join(" · ");
  }
  return Object.entries(d).filter(([, v]) => v !== "" && v != null && typeof v !== "object").map(([k, v]) => `${k}: ${v}`).join(" · ");
}
async function renderAuditLog() {
  const el = document.getElementById("audit-log-list");
  if (!el) return;
  el.innerHTML = `<div class="empty-state" style="padding:24px;">טוען...</div>`;
  try {
    const rows = await SB.selectAudit(300);
    if (!rows.length) { el.innerHTML = `<div class="empty-state" style="padding:24px;"><span class="material-icons-regular">history</span><p>עדיין אין פעולות ביומן</p></div>`; return; }
    el.innerHTML = `<div class="table-container table-sticky"><table class="data-table compact-view"><thead><tr><th>מתי</th><th>משתמש</th><th>פעולה</th><th>על מה</th><th>פרטים</th></tr></thead><tbody>${rows.map(r => {
      const t = new Date(r.created_at);
      const when = Number.isNaN(t.getTime()) ? "" : `${formatDateDisplay(t)} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
      return `<tr><td>${escapeHtml(when)}</td><td>${escapeHtml(r.username || "")}</td><td>${escapeHtml(AUDIT_ACTIONS[r.action] || r.action)}</td><td>${escapeHtml(AUDIT_ENTITIES[r.entity] || r.entity)}</td><td style="white-space:normal;">${escapeHtml(describeAuditDetails(r.details))}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  } catch (e) {
    el.innerHTML = e.status === 404 || /audit_log/.test(e.message || "")
      ? `<div class="grants-archive-note"><span class="material-icons-regular">info</span> יומן הפעולות יתחיל לעבוד אחרי הרצת קובץ העדכון supabase/security-update.sql ב-Supabase.</div>`
      : `<div class="grants-archive-note"><span class="material-icons-regular">error</span> לא ניתן לטעון את היומן כרגע: ${escapeHtml(e.message || "")}</div>`;
  }
}

// ===== רינדור כל מסך ההגדרות =====
function renderSettings() {
  cacheSettingsInputs();
  renderExpenseCategories();
  renderDataHealth();
  renderBackupPanel();
  renderUsersTable();
  renderPurimSumsSettings();
}

// ===== סכומים סופיים לקבוצות פורים (הגדרות מערכת) =====
function getPurimGroupNames() {
  const names = new Set();
  (state.purimAddresses || []).forEach(row => {
    const group = String(row["קבוצה"] || "").trim();
    if (group) names.add(group);
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, "he"));
}

function getPurimSumsYearsWindow() {
  const allPossibleYears = ['תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט', 'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט', 'תש"צ'];
  const campaignYear = getCampaignYear();
  let idx = allPossibleYears.indexOf(campaignYear);
  if (idx === -1) idx = allPossibleYears.indexOf('תשפ"ו');
  return allPossibleYears.slice(Math.max(0, idx - 3), idx + 1);
}

function renderPurimSumsSettings() {
  const el = document.getElementById("purim-sums-settings-list");
  if (!el) return;

  const groups = getPurimGroupNames();
  const years = getPurimSumsYearsWindow();

  if (!groups.length) {
    el.innerHTML = `<div class="empty-state">אין עדיין קבוצות פורים מוגדרות בכתובות</div>`;
    return;
  }

  el.innerHTML = `
    <div class="table-container">
      <table class="data-table compact-view">
        <thead><tr><th>קבוצה</th>${years.map(y => `<th>${escapeHtml(y)}</th>`).join("")}</tr></thead>
        <tbody>
          ${groups.map(group => `
            <tr>
              <td style="font-weight:800;">${escapeHtml(group)}</td>
              ${years.map(y => {
                const val = (state.settings.purimManualSums && state.settings.purimManualSums[group] && state.settings.purimManualSums[group][y]) || "";
                return `<td><input type="number" class="ui-input purim-sum-setting-input" data-group="${escapeHtml(group)}" data-year="${escapeHtml(y)}" value="${escapeHtml(val)}" style="width:90px; text-align:center; direction:ltr;"></td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="form-actions-row" style="margin-top:16px;"><button class="btn btn-solid-blue" id="btn-save-purim-sums"><span class="material-icons-regular" style="font-size:16px;vertical-align:middle;">save</span> שמור סכומים</button></div>
  `;

  const saveBtn = document.getElementById("btn-save-purim-sums");
  if (saveBtn) saveBtn.onclick = () => {
    // שומרים רק את התאים ששונו, כדי לא לדרוס סכומים שמשתמש אחר עדכן בינתיים
    const changes = [];
    el.querySelectorAll(".purim-sum-setting-input").forEach(input => {
      const group = input.getAttribute("data-group");
      const year = input.getAttribute("data-year");
      const oldVal = String((state.settings.purimManualSums && state.settings.purimManualSums[group] && state.settings.purimManualSums[group][year]) || "");
      if (String(input.value) !== oldVal) changes.push({ group, year, value: input.value });
    });
    if (!changes.length) { showToast("לא בוצעו שינויים", "success"); return; }
    const p = saveSettingsPatch(settings => {
      if (!settings.purimManualSums) settings.purimManualSums = {};
      changes.forEach(({ group, year, value }) => {
        if (!settings.purimManualSums[group]) settings.purimManualSums[group] = {};
        settings.purimManualSums[group][year] = value;
      });
    });
    renderDashboard();
    renderPurimGroups();
    p.then(saved => { reportSave(saved, "הסכומים נשמרו בהצלחה!"); logAudit("update", "settings", "purim-sums", changes); });
  };
}

// ===== קטגוריות הוצאות =====
function getExpenseCategories() {
  const cats = state.settings.expenseCategories;
  return (Array.isArray(cats) && cats.length) ? cats : [...DEFAULT_EXPENSE_CATEGORIES];
}

function renderExpenseCategories() {
  const el = document.getElementById("expense-categories-list");
  if (!el) return;
  const cats = getExpenseCategories();
  el.innerHTML = cats.map((c, i) => `
    <span class="cat-chip">${escapeHtml(c)}
      <button type="button" data-click="remove-expense-category" data-index="${i}" title="מחק קטגוריה"><span class="material-icons-regular">close</span></button>
    </span>`).join("");
}

window.addExpenseCategory = function() {
  const input = document.getElementById("new-expense-category");
  const val = (input?.value || "").trim();
  if (!val) return;
  const cats = getExpenseCategories();
  if (cats.includes(val)) { showToast("הקטגוריה כבר קיימת", "danger"); return; }
  const p = saveSettingsPatch(settings => {
    const list = (Array.isArray(settings.expenseCategories) && settings.expenseCategories.length) ? [...settings.expenseCategories] : [...DEFAULT_EXPENSE_CATEGORIES];
    if (!list.includes(val)) list.push(val);
    settings.expenseCategories = list;
  });
  if (input) input.value = "";
  renderExpenseCategories();
  populateExpenseCategorySelect();
  p.then(saved => { reportSave(saved, "✅ הקטגוריה נוספה"); logAudit("create", "expense-category", val); });
};

window.removeExpenseCategory = function(index) {
  const cats = getExpenseCategories();
  if (cats.length <= 1) { showToast("חייבת להישאר לפחות קטגוריה אחת", "danger"); return; }
  const name = cats[index];
  if (name === undefined) return;
  const p = saveSettingsPatch(settings => {
    const list = (Array.isArray(settings.expenseCategories) && settings.expenseCategories.length) ? [...settings.expenseCategories] : [...DEFAULT_EXPENSE_CATEGORIES];
    const next = list.filter(c => c !== name);
    settings.expenseCategories = next.length ? next : list;
  });
  renderExpenseCategories();
  populateExpenseCategorySelect();
  p.then(saved => { reportSave(saved, `הקטגוריה "${name}" הוסרה`); logAudit("delete", "expense-category", name); });
};

function populateExpenseCategorySelect(extraCategory = null) {
  const sel = document.getElementById("expense-category");
  if (!sel) return;
  const cur = sel.value;
  const cats = [...getExpenseCategories()];
  if (extraCategory && !cats.includes(extraCategory)) cats.push(extraCategory);
  sel.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (cats.includes(cur)) sel.value = cur;
}

// ===== תקינות נתונים =====
function renderDataHealth() {
  const el = document.getElementById("data-health-list");
  if (!el) return;
  const members = state.members || [];
  const noType = members.filter(m => !String(m.yeshivaType || "").trim());
  const noPhone = members.filter(m => !String(m.phone || "").trim());
  const noYeshiva = members.filter(m => !String(m.yeshiva || "").trim());
  const nameCounts = {};
  members.forEach(m => { const n = `${(m.firstName||"").trim()} ${(m.lastName||"").trim()}`.trim(); if (n) nameCounts[n] = (nameCounts[n] || 0) + 1; });
  const dupes = Object.values(nameCounts).filter(c => c > 1).length;

  const rows = [
    { type: "type", title: "בחורים ללא סוג מסגרת (פוגע בזכאות וביעדים)", count: noType.length, icon: "category", sev: "bad" },
    { type: "yeshiva", title: "בחורים ללא ישיבה", count: noYeshiva.length, icon: "school", sev: "warn" },
    { type: "phone", title: "בחורים ללא מספר טלפון", count: noPhone.length, icon: "phone", sev: "warn" },
    { type: "dupes", title: "שמות כפולים אפשריים", count: dupes, icon: "content_copy", sev: "warn" }
  ];

  el.innerHTML = rows.map(r => {
    const cls = r.count === 0 ? "ok" : r.sev;
    const icon = r.count === 0 ? "check_circle" : r.icon;
    const clickable = r.count > 0;
    return `<div class="health-row ${cls} ${clickable ? "clickable" : ""}" ${clickable ? `data-click="health-detail" data-type="${r.type}"` : ""}>
        <span class="material-icons-regular health-icon">${icon}</span>
        <div class="health-text"><div class="health-title">${escapeHtml(r.title)}</div></div>
        <div class="health-count">${r.count}</div>
        ${clickable ? `<span class="material-icons-regular health-arrow">chevron_left</span>` : ""}
      </div>`;
  }).join("");
}

// ===== תקינות נתונים: פירוט ותיקון =====
function getHealthAffected(type) {
  const members = state.members || [];
  if (type === "type") return members.filter(m => !String(m.yeshivaType || "").trim());
  if (type === "yeshiva") return members.filter(m => !String(m.yeshiva || "").trim());
  if (type === "phone") return members.filter(m => !String(m.phone || "").trim());
  return [];
}

window.openDataHealthDetail = function(type) {
  const modal = document.getElementById("data-health-modal");
  const titleEl = document.getElementById("data-health-modal-title");
  const body = document.getElementById("data-health-modal-body");
  if (!modal || !body) return;

  const titles = {
    type: "תיקון: בחורים ללא סוג מסגרת",
    yeshiva: "תיקון: בחורים ללא ישיבה",
    phone: "תיקון: בחורים ללא מספר טלפון",
    dupes: "שמות כפולים אפשריים"
  };
  if (titleEl) titleEl.textContent = titles[type] || "תיקון נתונים";

  if (type === "dupes") {
    body.innerHTML = renderDupesList();
  } else {
    const affected = getHealthAffected(type);
    if (affected.length === 0) {
      body.innerHTML = `<div class="fix-done-note"><span class="material-icons-regular" style="font-size:40px; display:block; margin-bottom:8px;">task_alt</span>הכל תקין! אין בחורים לתיקון כאן.</div>`;
    } else {
      body.innerHTML = affected.map(m => renderFixRow(type, m)).join("");
    }
  }
  modal.classList.add("open");
};

function renderFixRow(type, m) {
  const name = escapeHtml(`${m.firstName || ""} ${m.lastName || ""}`.trim() || "ללא שם");
  const sub = escapeHtml(m.yeshiva || m.address || "");
  let control = "";
  if (type === "type") {
    control = `<select class="ui-select" data-change="health-fix-select" data-id="${escapeHtml(m.id)}" data-field="yeshivaType">
        <option value="">בחר...</option>
        <option value="חיידר">חיידר</option>
        <option value="ישיבה קטנה">ישיבה קטנה</option>
        <option value="ישיבה גדולה">ישיבה גדולה</option>
        <option value="קיבוץ">קיבוץ</option>
      </select>`;
  } else if (type === "yeshiva") {
    control = `<input type="text" class="ui-input" placeholder="שם הישיבה" id="fix-${escapeHtml(m.id)}">
      <button type="button" class="btn btn-solid-blue fix-save" data-click="health-fix-save" data-id="${escapeHtml(m.id)}" data-field="yeshiva">שמור</button>`;
  } else if (type === "phone") {
    control = `<input type="text" class="ui-input" placeholder="050-0000000" id="fix-${escapeHtml(m.id)}" style="direction:ltr;text-align:right;">
      <button type="button" class="btn btn-solid-blue fix-save" data-click="health-fix-save" data-id="${escapeHtml(m.id)}" data-field="phone">שמור</button>`;
  }
  return `<div class="fix-row" id="fixrow-${escapeHtml(m.id)}">
      <div class="fix-name">${name}${sub ? `<div class="fix-sub">${sub}</div>` : ""}</div>
      ${control}
    </div>`;
}

function renderDupesList() {
  const members = state.members || [];
  const groups = {};
  members.forEach(m => {
    const n = `${(m.firstName||"").trim()} ${(m.lastName||"").trim()}`.trim();
    if (!n) return;
    (groups[n] = groups[n] || []).push(m);
  });
  const dupeGroups = Object.entries(groups).filter(([, arr]) => arr.length > 1);
  if (dupeGroups.length === 0) return `<div class="fix-done-note">אין כפילויות.</div>`;
  return dupeGroups.map(([name, arr]) => `
    <div class="dupe-group">
      <div class="dupe-group-title">${escapeHtml(name)} (${arr.length})</div>
      ${arr.map(m => `<div class="fix-row">
        <div class="fix-name" style="font-weight:500;">${escapeHtml(m.yeshiva || "ללא ישיבה")} <span class="fix-sub">${escapeHtml(m.phone || "ללא טלפון")}</span></div>
        <button type="button" class="btn btn-outline fix-save" data-click="health-open-member" data-id="${escapeHtml(m.id)}">פתח פרופיל</button>
      </div>`).join("")}
    </div>`).join("");
}

window.applyHealthFix = function(memberId, field, value) {
  const val = String(value || "").trim();
  if (!val) { showToast("יש להזין ערך", "danger"); return; }
  const member = state.members.find(m => String(m.id).trim() === String(memberId).trim());
  if (!member) return;
  if (field === "yeshivaType") member.yeshivaType = normalizeYeshivaType(val);
  else member[field] = val;
  invalidateCache();
  saveState();
  persist("saveMember", member).then(saved => { if (!saved) reportSave(false); });
  logAudit("update", "member", member.id, { field, value: val, via: "תקינות נתונים" });
  // הסרת השורה שתוקנה מהרשימה
  const row = document.getElementById(`fixrow-${memberId}`);
  if (row) row.remove();
  renderDataHealth();
  populateFilters();
  renderMembersTable();
  showToast("✅ תוקן ונשמר");
  // אם לא נותרו שורות - הצגת הודעת סיום
  const body = document.getElementById("data-health-modal-body");
  if (body && !body.querySelector(".fix-row")) {
    body.innerHTML = `<div class="fix-done-note"><span class="material-icons-regular" style="font-size:40px; display:block; margin-bottom:8px;">task_alt</span>הכל תוקן!</div>`;
  }
};

window.openMemberFromHealth = function(memberId) {
  document.getElementById("data-health-modal").classList.remove("open");
  switchScreen("members-screen", true);
  setTimeout(() => loadMemberProfile(memberId), 60);
};

// ===== גיבוי וסנכרון =====
function renderBackupPanel() {
  const counts = document.getElementById("record-counts");
  if (counts) {
    const data = [
      { num: (state.members || []).length, label: "בחורים" },
      { num: (state.donations || []).length, label: "הפקדות" },
      { num: (state.expenses || []).length, label: "הוצאות" },
      { num: (state.purimAddresses || []).length, label: "כתובות פורים" }
    ];
    counts.innerHTML = data.map(d => `<div class="record-count-card"><div class="record-count-num">${d.num.toLocaleString("he-IL")}</div><div class="record-count-label">${d.label}</div></div>`).join("");
  }
  const lastSyncEl = document.getElementById("last-sync-time");
  if (lastSyncEl) {
    const ts = cacheStore.get(LAST_SYNC_KEY);
    lastSyncEl.textContent = ts ? formatSyncTime(ts) : "טרם סונכרן";
  }
}

function formatSyncTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

window.exportFullBackup = function() {
  const backup = {
    _app: "צדקת רבי שמעון", _version: 1, _exportedAt: new Date().toISOString(),
    members: state.members, donations: state.donations, expenses: state.expenses,
    purimAddresses: state.purimAddresses, settings: state.settings, grantsArchive: state.grantsArchive, users: state.users
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().split("T")[0];
  a.href = url; a.download = `גיבוי_צדקת_רבי_שמעון_${stamp}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("✅ קובץ הגיבוי ירד");
};

window.importFullBackup = function(file) {
  if (!file) return;
  if (!isAdminUser()) { showToast("רק מנהל יכול לייבא גיבוי", "danger"); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object" || !Array.isArray(data.members)) throw new Error("invalid");
    } catch (err) { showToast("הקובץ אינו קובץ גיבוי תקין", "danger"); return; }
    const counts = `${(data.members || []).length} בחורים, ${(data.donations || []).length} הפקדות, ${(data.expenses || []).length} הוצאות, ${(data.purimAddresses || []).length} כתובות פורים`;
    if (!confirm(`ייבוא הגיבוי יעלה לשרת: ${counts}, והגדרות${data.grantsArchive ? " ומענקים" : ""}.\nרשומות קיימות עם אותו מזהה יוחלפו בגרסה שבגיבוי. רשומות שלא נמצאות בגיבוי יישארו.\nלהמשיך?`)) return;
    const btn = document.getElementById("btn-import-backup");
    if (btn) { btn.disabled = true; btn.textContent = "מעלה לשרת..."; }
    try {
      const members = (data.members || []).map(m => ({ ...m, yeshivaType: normalizeYeshivaType(m.yeshivaType) }));
      await SB.upsertChunked("members", members.map(SB.map.memberToDb));
      if (Array.isArray(data.donations)) await SB.upsertChunked("donations", data.donations.map(SB.map.donationToDb));
      if (Array.isArray(data.expenses)) await SB.upsertChunked("expenses", data.expenses.map(SB.map.expenseToDb));
      if (Array.isArray(data.purimAddresses)) await SB.upsertChunked("purim_addresses", data.purimAddresses.map(SB.map.purimToDb));
      if (data.settings && typeof data.settings === "object") await SB.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.grantsArchive && typeof data.grantsArchive === "object") await SB.saveGrantsArchive(data.grantsArchive);
      logAudit("import", "backup", file.name, { counts });
      await fetchDataFromServer(true);
      renderSettings();
      showToast("✅ הגיבוי יובא ונשמר בשרת");
    } catch (err) {
      showToast(`הייבוא נעצר באמצע: ${err.message || "תקלת תקשורת"}. אפשר להריץ שוב את אותו קובץ`, "danger");
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-icons-regular" style="font-size:16px;vertical-align:middle;">upload</span> ייבוא גיבוי`; }
    }
  };
  reader.readAsText(file);
};

window.syncNow = async function() {
  const btn = document.getElementById("btn-sync-now");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="material-icons-regular" style="font-size:16px;vertical-align:middle;">sync</span> מסנכרן...`; }
  const ok = await fetchDataFromServer(true);
  if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-icons-regular" style="font-size:16px;vertical-align:middle;">sync</span> סנכרן עכשיו`; }
  renderBackupPanel();
  const pending = readPendingWrites().length;
  if (!ok) showToast("הסנכרון נכשל: אין חיבור לשרת. מוצגים הנתונים האחרונים שנטענו", "danger");
  else if (pending) showToast(`הנתונים נטענו, אבל ${pending} שינויים עדיין ממתינים לשליחה`, "warning");
  else showToast("✅ הנתונים סונכרנו");
};

const PERM_FIELDS = [["canEdit", "הוספה ועריכה"], ["canViewIncome", "הכנסות ופורים"], ["canViewExpenses", "הוצאות"], ["canViewGrants", "מענקים"], ["canViewHistory", "היסטוריית זכאות"]];

function renderUsersTable() {
  const tbody = document.getElementById("users-table-body"); if (!tbody) return;
  const users = (state.users || []).filter(u => u && u.username && String(u.username).trim() !== "");
  if (!users.length) { tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">אין משתמשים להצגה</td></tr>`; return; }
  tbody.innerHTML = users.map(u => {
    const isAdminRow = u.isAdmin === true || String(u.username).trim() === "מנהל";
    const boxes = PERM_FIELDS.map(([f, label]) => `<td style="text-align:center;"><input type="checkbox" data-perm="${f}" aria-label="${escapeHtml(label)}" ${isAdminRow || isTrue(u[f]) ? "checked" : ""} ${isAdminRow ? "disabled" : ""}></td>`).join("");
    return `<tr data-user-id="${escapeHtml(u.id || "")}">
      <td style="font-weight:bold;">${escapeHtml(u.username)}${isAdminRow ? ` <span class="role-chip">מנהל</span>` : ""}</td>
      ${boxes}
      <td class="no-export">${isAdminRow || !u.id ? "" : `<button type="button" class="btn btn-outline users-save-btn" style="padding:5px 12px; font-size:12px;" data-click="save-user-perms" data-user-id="${escapeHtml(u.id)}">שמור</button>`}</td>
    </tr>`;
  }).join("");
}

window.saveUserPermissions = async function(userId, btn) {
  if (!isAdminUser()) { showToast("רק מנהל יכול לשנות הרשאות", "danger"); return; }
  const tr = btn.closest("tr");
  const patch = {};
  tr.querySelectorAll("input[data-perm]").forEach(cb => { patch[cb.dataset.perm] = cb.checked; });
  btn.disabled = true; btn.textContent = "שומר...";
  try {
    await SB.updateProfile(userId, patch);
    const u = state.users.find(x => String(x.id) === String(userId));
    if (u) Object.assign(u, patch);
    saveState();
    showToast(`ההרשאות של ${u ? u.username : "המשתמש"} נשמרו. הן ייכנסו לתוקף בכניסה הבאה שלו`, "success");
    logAudit("update", "profile", userId, { user: u ? u.username : userId, ...patch });
  } catch (e) {
    showToast(e.status === 403
      ? "השרת לא אישר את השינוי. צריך להריץ פעם אחת את קובץ העדכון supabase/security-update.sql ב-Supabase"
      : `השמירה נכשלה: ${e.message || "תקלת תקשורת"}`, "danger");
  } finally { btn.disabled = false; btn.textContent = "שמור"; }
};

function normalizeYeshivaType(t) {
  const m = { "קטנה": "ישיבה קטנה", "גדולה": "ישיבה גדולה" };
  const v = String(t || "").trim();
  return m[v] || v;
}

function loadState() {
  state.members = readStorageArray(STORAGE_KEYS.MEMBERS).map(m => ({ ...m, yeshivaType: normalizeYeshivaType(m.yeshivaType) })); 
  state.donations = readStorageArray(STORAGE_KEYS.DONATIONS); 
  state.expenses = readStorageArray(STORAGE_KEYS.EXPENSES); 
  state.purimAddresses = readStorageArray(STORAGE_KEYS.PURIM);
  try { const raw = cacheStore.get(STORAGE_KEYS.GRANTS_ARCHIVE); state.grantsArchive = (raw && raw !== "undefined" && raw !== "null") ? JSON.parse(raw) : null; } catch (e) { state.grantsArchive = null; }
  state.settings = readStorageObject(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  
  let savedUsers = readStorageArray(STORAGE_KEYS.USERS);
  
  const validUsers = savedUsers.filter(u => u && u.username && String(u.username).trim() !== "");
  
  if (validUsers.length === 0) {
    state.users = DEFAULT_USERS;
  } else {
    state.users = validUsers;
  }

  if (state.settings.campaignYear === 'תשפ"ה') {
    state.settings.campaignYear = 'תשפ"ו';
    saveState();
  }
}

function readStorageArray(key) { try { const raw = cacheStore.get(key); if (!raw || raw === "undefined" || raw === "null") return []; return JSON.parse(raw) || []; } catch (e) { return []; } }
function readStorageObject(key, fallback) { try { const raw = cacheStore.get(key); if (!raw || raw === "undefined" || raw === "null") return { ...fallback }; return { ...fallback, ...JSON.parse(raw) }; } catch (e) { return { ...fallback }; } }

// עותק מקומי ב-sessionStorage (נמחק בסגירת הדפדפן). כשל בכתיבה (למשל מקום מלא) לא עוצר את השמירה לשרת.
function saveState() { 
  cacheStore.set(STORAGE_KEYS.MEMBERS, JSON.stringify(state.members)); 
  cacheStore.set(STORAGE_KEYS.DONATIONS, JSON.stringify(state.donations)); 
  cacheStore.set(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses)); 
  cacheStore.set(STORAGE_KEYS.PURIM, JSON.stringify(state.purimAddresses)); 
  cacheStore.set(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  cacheStore.set(STORAGE_KEYS.USERS, JSON.stringify(state.users));
  if (state.grantsArchive) cacheStore.set(STORAGE_KEYS.GRANTS_ARCHIVE, JSON.stringify(state.grantsArchive));
}

function switchScreen(screenId, pushToHistory = true) {
  if (!screenId) return;
  if (state.membersEditMode && screenId !== "members-screen") { try { exitMembersEditMode(); } catch(e) {} }
  state.activeScreen = screenId;
  document.querySelectorAll(".content-screen").forEach((section) => { section.classList.remove("active-content-screen"); });
  const targetScreen = document.getElementById(screenId); if (targetScreen) targetScreen.classList.add("active-content-screen");
  
  // -- מעלים את הכותרת בלוח הבקרה כדי לחסוך שטח --
  const headerEl = document.getElementById("main-content-header");
  if (headerEl) {
      headerEl.style.display = screenId === "dashboard-screen" ? "none" : "flex";
  }

  // ריענון גרפים בכניסה למסכים עם canvas (Chart.js לא מודד נכון כשמוסתר)
  if (screenId === "expenses-summary-screen") setTimeout(renderExpensesSummaryTable, 30);
  if (screenId === "daily-report-screen") setTimeout(() => renderChart(getCampaignYear()), 30);
  if (screenId === "settings-screen") renderSettings();
  if (screenId === "rules-screen") renderRulesScreen();
  if (screenId === "grants-screen") renderGrantsLists();

  if (screenId === "members-screen") {
    const listSec = document.getElementById("members-list-section");
    const profileSec = document.getElementById("member-profile-section");
    if(listSec) listSec.classList.remove("hidden");
    if(profileSec) profileSec.classList.add("hidden");
    setTimeout(() => { const s = document.getElementById("search-members-list"); if (s) s.focus(); }, 80);
  }

  document.querySelectorAll(".nav-item").forEach((btn) => { if (btn.dataset.screen === screenId) btn.classList.add("active"); else btn.classList.remove("active"); });
  const meta = screenMeta[screenId]; if (meta) { setText("page-title", meta.title); setText("page-subtitle", meta.subtitle); }
  if (pushToHistory) { try { history.pushState({ screen: screenId }, "", `#${screenId}`); } catch (error) {} }
}


window.renderDashboard = function() {
  const yearSelect = document.getElementById("dashboard-year-filter");
  const campaignYear = getCampaignYear();
  if (yearSelect && !yearSelect.dataset.dashboardReady) {
    const hasCampaignOption = Array.from(yearSelect.options).some(option => option.value === campaignYear);
    if (hasCampaignOption) yearSelect.value = campaignYear;
    yearSelect.dataset.dashboardReady = "1";
  }
  if (yearSelect && !yearSelect.value) yearSelect.value = campaignYear;
  const currentYear = yearSelect ? (yearSelect.value || campaignYear) : campaignYear; 
  
  const currentYearDonations = state.donations.filter(d => d.year === currentYear);
  const totalDonations = sumArray(currentYearDonations, "amount");
  const totalPurim = getDashboardPurimTotal(currentYear);
  const totalCollected = totalDonations + totalPurim;
  const totalExpenses = state.expenses.filter(e => e.year === currentYear).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const summaries = buildActiveMemberSummaries(currentYear);
  const totalRequired = summaries.reduce((sum, row) => sum + (Number(row.totalRequiredThisYear) || 0), 0);
  // חסר = סכום החוסרים של כל בחור בנפרד (מי ששילם יותר לא "מכסה" על מי שחסר לו)
  const missingTotal = summaries.reduce((sum, row) => sum + (Number(row.missingAmount) || 0), 0);
  const progress = getDashboardProgress(summaries);
  const eligibleCount = summaries.filter(row => row.isEligible).length;
  const debtRows = summaries.filter(row => (Number(row.totalDebtFromPast) || 0) > 0);
  

  setText("dashboard-kpi-collected", formatCurrency(totalCollected));
  setText("dashboard-kpi-target", formatCurrency(totalRequired));
  setText("dashboard-kpi-missing", formatCurrency(missingTotal));
  setText("dashboard-kpi-progress", `${progress}%`);
  setText("dashboard-kpi-eligible", eligibleCount.toLocaleString("he-IL"));
  setText("dashboard-kpi-debt", debtRows.length.toLocaleString("he-IL"));

  const progressBar = document.getElementById("dashboard-yearly-progress-bar");
  if (progressBar) progressBar.style.width = `${progress}%`;

  renderDashboardAttention({ summaries, totalDonations, currentYear });
  renderDashboardMonthBars();
  renderDashboardActivity(currentYear, summaries);
  renderDashboardSegments(summaries);
}

// התקדמות = כמה מהחובה כוסה בפועל (עודף של בחור אחד לא נספר לטובת אחר)
function getDashboardProgress(summaries) {
  const required = summaries.reduce((sum, row) => sum + (Number(row.totalRequiredThisYear) || 0), 0);
  const covered = summaries.reduce((sum, row) => sum + Math.min(Number(row.collectedThisYear) || 0, Number(row.totalRequiredThisYear) || 0), 0);
  return required > 0 ? Math.min(100, Math.round((covered / required) * 100)) : 0;
}

function getDashboardPurimTotal(currentYear) {
  let totalPurim = 0;
  if (state.settings.purimManualSums) {
    Object.values(state.settings.purimManualSums).forEach(groupSums => {
      if (groupSums && groupSums[currentYear]) totalPurim += (Number(groupSums[currentYear]) || 0);
    });
  }
  return totalPurim;
}

function renderDashboardAttention({ summaries, totalDonations, currentYear }) {
  const el = document.getElementById("dashboard-attention-list");
  if (!el) return;

  const debtRows = summaries.filter(row => (Number(row.totalDebtFromPast) || 0) > 0);
  const nearGoal = summaries
    .filter(row => !row.isEligible && row.missingAmount > 0 && row.missingAmount <= 500)
    .sort((a, b) => a.missingAmount - b.missingAmount);
  const notStarted = summaries.filter(row => (Number(row.currentYearTarget) || 0) > 0 && (Number(row.collectedThisYear) || 0) === 0);
  const missingInfo = (state.members || []).filter(m => {
    const isMarried = m.maritalStatus === "נשוי" || (m.notes || "").includes("התחתן");
    if (isMarried) return false;
    return !String(m.phone || "").trim() || !String(m.yeshiva || "").trim() || !String(m.yeshivaType || "").trim();
  });
  const expenseCategoryAlert = getDashboardExpenseCategoryAlert(currentYear);

  const items = [];
  // תזכורת: השנה העברית התחלפה ושנת הקמפיין בהגדרות עדיין ישנה (הפקדות חדשות נרשמות אליה)
  const hebrewNow = getCurrentHebrewYearLabel();
  const campaignYear = getCampaignYear();
  if (isAdminUser() && hebrewNow && HEBREW_YEARS_ORDER.indexOf(hebrewNow) > HEBREW_YEARS_ORDER.indexOf(campaignYear) && HEBREW_YEARS_ORDER.indexOf(campaignYear) !== -1) {
    items.push({
      icon: "event_repeat",
      tone: "warn",
      title: `השנה העברית התחלפה ל${hebrewNow}`,
      sub: `שנת הקמפיין בהגדרות היא ${campaignYear}, ולכן הפקדות חדשות נרשמות אליה. לחיצה פותחת את ההגדרות`,
      value: hebrewNow,
      drill: "new-year"
    });
  }
  if (nearGoal.length) {
    items.push({
      icon: "near_me",
      tone: "success",
      title: "קרובים לזכאות",
      sub: `${nearGoal.slice(0, 3).map(row => row.fullName).join(", ")}${nearGoal.length > 3 ? " ועוד" : ""}`,
      value: nearGoal.length,
      drill: "near-goal"
    });
  }
  if (debtRows.length) {
    const debtAmount = debtRows.reduce((sum, row) => sum + (Number(row.totalDebtFromPast) || 0), 0);
    items.push({
      icon: "report",
      tone: "danger",
      title: "חובות עד שנה קודמת",
      sub: "לא כולל החובה של השנה שנבחרה",
      value: formatCurrency(debtAmount),
      drill: "debt"
    });
  }
  if (notStarted.length) {
    items.push({
      icon: "hourglass_empty",
      tone: "warn",
      title: "טרם התחילו גבייה",
      sub: "בחורים עם חובה שנתית וללא הפקדה בשנה שנבחרה",
      value: notStarted.length,
      drill: "not-started"
    });
  }
  if (missingInfo.length) {
    items.push({
      icon: "edit_note",
      tone: "warn",
      title: "פרטים חסרים בכרטיסי בחורים",
      sub: "טלפון, ישיבה או סוג מסגרת חסרים",
      value: missingInfo.length,
      drill: "missing-info"
    });
  }
  if (expenseCategoryAlert) {
    items.push({
      icon: "receipt_long",
      tone: expenseCategoryAlert.tone,
      title: expenseCategoryAlert.title,
      sub: expenseCategoryAlert.sub,
      value: formatCurrency(expenseCategoryAlert.value),
      drill: "expense-category",
      category: expenseCategoryAlert.category
    });
  }

  if (!items.length) {
    el.innerHTML = `<div class="dashboard-empty"><span class="material-icons-regular">task_alt</span><span>אין כרגע פריטים דחופים לטיפול.</span></div>`;
    return;
  }

  el.innerHTML = items.slice(0, 5).map(item => `
    <button class="dashboard-attention-item" type="button" data-click="dashboard-drill" data-type="${escapeHtml(item.drill)}" data-category="${escapeHtml(item.category || "")}">
      <span class="material-icons-regular dashboard-item-icon ${item.tone}">${item.icon}</span>
      <span>
        <span class="dashboard-item-title">${escapeHtml(item.title)}</span>
        <span class="dashboard-item-sub">${escapeHtml(item.sub)}</span>
      </span>
      <span class="dashboard-item-value">${escapeHtml(String(item.value))}</span>
    </button>
  `).join("");
}

function getDashboardExpenseCategoryAlert(currentYear) {
  const currentExpenses = (state.expenses || []).filter(e => e.year === currentYear);
  if (!currentExpenses.length) return null;

  const currentByCategory = currentExpenses.reduce((acc, expense) => {
    const category = expense.category || "שונות";
    acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
    return acc;
  }, {});

  const yearIndex = HEBREW_YEARS_ORDER.indexOf(currentYear);
  const previousYear = yearIndex > 0 ? HEBREW_YEARS_ORDER[yearIndex - 1] : null;
  const previousByCategory = previousYear
    ? (state.expenses || []).filter(e => e.year === previousYear).reduce((acc, expense) => {
        const category = expense.category || "שונות";
        acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
        return acc;
      }, {})
    : {};

  const rows = Object.entries(currentByCategory).map(([category, amount]) => {
    const previousAmount = previousByCategory[category] || 0;
    return { category, amount, previousAmount, diff: amount - previousAmount };
  }).sort((a, b) => b.diff - a.diff || b.amount - a.amount);

  const increased = rows.find(row => row.diff > 0 && row.previousAmount > 0);
  if (increased) {
    return {
      tone: "danger",
      title: `הוצאה חריגה: ${increased.category}`,
      sub: `עלתה מ-${formatCurrency(increased.previousAmount)} ל-${formatCurrency(increased.amount)}`,
      value: increased.diff,
      category: increased.category
    };
  }

  const top = rows.sort((a, b) => b.amount - a.amount)[0];
  if (!top || top.amount <= 0) return null;
  return {
    tone: "warn",
    title: `קטגוריית הוצאה מובילה: ${top.category}`,
    sub: previousYear ? `אין עליה מול ${previousYear}, אבל זו הקטגוריה הגדולה השנה` : "הקטגוריה הגדולה ביותר בשנה שנבחרה",
    value: top.amount,
    category: top.category
  };
}

// שנים שיש בהן נתונים (או שנת הפעילות), מהישנה לחדשה
function getFinanceYears() {
  const campaignYear = getCampaignYear();
  const years = HEBREW_YEARS_ORDER.filter(year => {
    const hasDonations = (state.donations || []).some(d => d.year === year);
    const hasExpenses = (state.expenses || []).some(e => e.year === year);
    const hasPurim = getDashboardPurimTotal(year) > 0;
    return hasDonations || hasExpenses || hasPurim || year === campaignYear;
  });
  if (!years.length) years.push(campaignYear);
  return years;
}

function buildFinanceRows(years) {
  const campaignYear = getCampaignYear();
  const sumBy = (list, year) => (list || []).filter(x => x.year === year).reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
  return years.map(year => {
    const grant = getDashboardYearGrantCost(year, campaignYear);
    const members = sumBy(state.donations, year);
    const purim = getDashboardPurimTotal(year);
    const expenses = sumBy(state.expenses, year);
    return { year, members, purim, expenses, grants: grant.cost, grantNote: grant.note, income: members + purim, outgoing: expenses + grant.cost };
  });
}

// לוח בקרה: הכנסות בלבד, שלוש השנים האחרונות
function renderDashboardMonthBars() {
  const el = document.getElementById("dashboard-month-bars");
  if (!el) return;
  renderFinanceChart(el, buildFinanceRows(getFinanceYears().slice(-3)), "income");
}

// דו"ח תנועות מרוכז: הכנסות מול הוצאות בכל השנים
function renderReportFinanceChart() {
  const el = document.getElementById("report-finance-chart");
  if (!el) return;
  renderFinanceChart(el, buildFinanceRows(getFinanceYears()), "compare");
}

// עלות המענקים לשנה: בשנת הפעילות - צפי לפי הזכאים; בשנים קודמות - לפי מקבלי המענק בפועל במסך המענקים
function getDashboardYearGrantCost(year, campaignYear) {
  const packageCost = getDashboardGrantPackageCost(year);
  if (year === campaignYear) {
    const cost = getDashboardGrantCostForMonth(year, 11);
    const count = packageCost ? Math.round(cost / packageCost) : 0;
    return { cost, note: count ? `צפי לפי ${count} זכאים השנה` : "" };
  }
  const archive = getGrantsArchive();
  const recipients = (archive.years && archive.years[year] && archive.years[year].recipients) || [];
  if (!recipients.length || !packageCost) return { cost: 0, note: "אין נתוני מענקים לשנה זו" };
  return { cost: packageCost * recipients.length, note: `לפי ${recipients.length} מקבלי מענק` };
}

const FINANCE_SERIES = [
  { key: "members", label: "בחורים", group: "income" },
  { key: "purim", label: "פורים", group: "income" },
  { key: "expenses", label: "הוצאות", group: "outgoing" },
  { key: "grants", label: "עלות מענקים", group: "outgoing" },
];

function formatCompactCurrency(value) {
  const v = Math.abs(Number(value) || 0);
  if (v < 1000) return formatCurrency(value);
  const k = v / 1000;
  return `${value < 0 ? "-" : ""}₪${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}K`;
}

// גרף עמודות לפי שנה.
// mode "compare": עמודת הכנסות (בחורים + פורים) ליד עמודת הוצאות (הוצאות + עלות מענקים)
// mode "income": עמודת הכנסות בלבד
function renderFinanceChart(el, rows, mode = "compare") {
  const compare = mode === "compare";
  const kinds = compare ? ["income", "outgoing"] : ["income"];
  const series = FINANCE_SERIES.filter(sr => kinds.includes(sr.group));
  const width = Math.max(300, Math.round(el.clientWidth || 640));
  const height = compare ? 236 : 220;
  const narrow = width < 520;
  const padL = narrow ? 40 : 50, padR = 12, padTop = 24, baseY = height - (compare ? 44 : 30);
  const plotW = width - padL - padR, plotH = baseY - padTop;
  const band = plotW / rows.length;
  const barW = Math.min(24, Math.max(12, band * 0.22));
  const pairGap = Math.min(40, Math.max(8, band * 0.3));
  const maxRaw = Math.max(1, ...rows.map(r => compare ? Math.max(r.income, r.outgoing) : r.income));
  const step = (() => { const raw = maxRaw / 4; const mag = Math.pow(10, Math.floor(Math.log10(raw))); return [1, 2, 2.5, 5, 10].map(m => m * mag).find(m => m >= raw); })();
  const niceMax = step * Math.ceil(maxRaw / step);
  const y = v => baseY - (v / niceMax) * plotH;
  const GAP = 2, R = 4;
  const capLabel = v => ((compare && band < 150) || narrow) ? formatCompactCurrency(v) : formatCurrency(v);
  const kindLabel = kind => kind === "income" ? "הכנסות" : "הוצאות";
  const totalOf = (r, kind) => kind === "income" ? r.income : r.outgoing;

  // מלבן עם פינות מעוגלות רק למעלה (הקצה של הנתון), ישר בבסיס
  const topRounded = (x, top, w, h) => {
    const r = Math.min(R, h, w / 2);
    return `M${x},${top + h} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + w - r},${top} Q${x + w},${top} ${x + w},${top + r} L${x + w},${top + h} Z`;
  };
  const column = (x, segments) => {
    let acc = 0; const parts = [];
    const visible = segments.filter(sg => sg.value > 0);
    visible.forEach((seg, i) => {
      const bottom = y(acc) - (i > 0 ? GAP : 0);
      acc += seg.value;
      const top = y(acc);
      const h = Math.max(0, bottom - top);
      if (h <= 0) return;
      parts.push(i === visible.length - 1
        ? `<path class="fin-seg fin-${seg.key}" d="${topRounded(x, top, barW, h)}"></path>`
        : `<rect class="fin-seg fin-${seg.key}" x="${x}" y="${top}" width="${barW}" height="${h}"></rect>`);
    });
    return parts.join("");
  };

  let ticks = "";
  for (let v = 0; v <= niceMax + 1e-6; v += step) {
    const ty = y(v);
    ticks += `<line class="fin-grid${v === 0 ? " fin-base" : ""}" x1="${padL}" x2="${width - padR}" y1="${ty}" y2="${ty}"></line>
      <text class="fin-tick" x="${padL - 6}" y="${ty + 3.5}" text-anchor="end">${escapeHtml(formatCompactCurrency(v))}</text>`;
  }

  const groups = rows.map((r, i) => {
    const cx = padL + band * i + band / 2;
    // בהשוואה: הכנסות מימין (נקראות ראשונות), הוצאות משמאל. בהכנסות בלבד: עמודה אחת במרכז
    const xs = compare ? { income: cx + pairGap / 2, outgoing: cx - pairGap / 2 - barW } : { income: cx - barW / 2 };
    const segs = {
      income: [{ key: "members", value: r.members }, { key: "purim", value: r.purim }],
      outgoing: [{ key: "expenses", value: r.expenses }, { key: "grants", value: r.grants }],
    };
    return kinds.map(kind => {
      const x = xs[kind], total = totalOf(r, kind);
      return `<g class="fin-col" data-i="${i}" data-kind="${kind}">${column(x, segs[kind])}</g>
        <text class="fin-cap" x="${x + barW / 2}" y="${y(total) - 6}" text-anchor="middle">${escapeHtml(total ? capLabel(total) : "—")}</text>
        ${compare ? `<text class="fin-sub" x="${x + barW / 2}" y="${baseY + 14}" text-anchor="middle">${kindLabel(kind)}</text>` : ""}
        <rect class="fin-hit" data-i="${i}" data-kind="${kind}" tabindex="0" role="img" aria-label="${escapeHtml(`${r.year} ${kindLabel(kind)} ${formatCurrency(total)}`)}" x="${x - 6}" y="${padTop - 18}" width="${barW + 12}" height="${baseY - padTop + 18}"></rect>`;
    }).join("") + `<text class="fin-year" x="${cx}" y="${baseY + (compare ? 32 : 18)}" text-anchor="middle">${escapeHtml(r.year)}</text>`;
  }).join("");

  const legend = series.map(sr => `<span class="fin-legend-item"><i class="fin-swatch fin-${sr.key}"></i>${escapeHtml(sr.label)}</span>`).join("");
  const table = compare
    ? `<table class="fin-table">
      <thead><tr><th>שנה</th><th>הכנסות</th><th>הוצאות</th><th>פער</th></tr></thead>
      <tbody>${rows.slice().reverse().map(r => {
        const net = r.income - r.outgoing;
        return `<tr><td>${escapeHtml(r.year)}</td><td>${formatCurrency(r.income)}</td><td>${formatCurrency(r.outgoing)}</td>
          <td class="${net >= 0 ? "fin-net-up" : "fin-net-down"}"><span aria-hidden="true">${net >= 0 ? "▲" : "▼"}</span> ${net >= 0 ? "עודף" : "גירעון"} ${formatCurrency(Math.abs(net))}</td></tr>`;
      }).join("")}</tbody>
    </table>`
    : `<table class="fin-table">
      <thead><tr><th>שנה</th><th>בחורים</th><th>פורים</th><th>סה"כ הכנסות</th></tr></thead>
      <tbody>${rows.slice().reverse().map(r => `<tr><td>${escapeHtml(r.year)}</td><td>${formatCurrency(r.members)}</td><td>${formatCurrency(r.purim)}</td><td style="font-weight:800;">${formatCurrency(r.income)}</td></tr>`).join("")}</tbody>
    </table>`;

  el.innerHTML = `
    <div class="fin-legend">${legend}</div>
    <div class="dashboard-mountain-chart fin-chart">
      <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${compare ? "גרף הכנסות מול הוצאות לפי שנה" : "גרף הכנסות לפי שנה"}">
        ${ticks}${groups}
      </svg>
      <div class="fin-tooltip" hidden></div>
    </div>
    ${table}`;
  el.dataset.renderWidth = String(width);
  watchFinanceChartWidth(el, () => renderFinanceChart(el, rows, mode));

  const tip = el.querySelector(".fin-tooltip");
  const chart = el.querySelector(".fin-chart");
  const show = target => {
    const r = rows[Number(target.dataset.i)], kind = target.dataset.kind;
    el.querySelectorAll(".fin-col").forEach(g => g.classList.toggle("is-dim", !(g.dataset.i === target.dataset.i && g.dataset.kind === kind)));
    tip.textContent = "";
    const head = document.createElement("div"); head.className = "fin-tip-head";
    head.textContent = `${r.year} · ${kindLabel(kind)}`;
    tip.appendChild(head);
    FINANCE_SERIES.filter(sr => sr.group === kind).forEach(sr => {
      const row = document.createElement("div"); row.className = "fin-tip-row";
      const key = document.createElement("i"); key.className = `fin-tip-key fin-${sr.key}`;
      const val = document.createElement("strong"); val.textContent = formatCurrency(r[sr.key]);
      const name = document.createElement("span"); name.textContent = sr.label;
      row.append(key, val, name); tip.appendChild(row);
      if (sr.key === "grants" && r.grantNote) { const note = document.createElement("div"); note.className = "fin-tip-note"; note.textContent = r.grantNote; tip.appendChild(note); }
    });
    const total = document.createElement("div"); total.className = "fin-tip-total";
    total.textContent = `סה"כ ${formatCurrency(totalOf(r, kind))}`;
    tip.appendChild(total);
    tip.hidden = false;
    const cb = chart.getBoundingClientRect(), tb = target.getBoundingClientRect();
    const tw = tip.offsetWidth;
    let left = tb.left - cb.left + tb.width / 2 - tw / 2;
    left = Math.max(4, Math.min(cb.width - tw - 4, left));
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(4, tb.top - cb.top + 8)}px`;
  };
  const hide = () => { tip.hidden = true; el.querySelectorAll(".fin-col").forEach(g => g.classList.remove("is-dim")); };
  el.querySelectorAll(".fin-hit").forEach(h => {
    h.addEventListener("pointerenter", () => show(h));
    h.addEventListener("focus", () => show(h));
    h.addEventListener("pointerleave", hide);
    h.addEventListener("blur", hide);
  });
}

// הגרף נבנה לפי הרוחב בפועל: מציירים מחדש כשהרוחב משתנה (גם כשמסך מוסתר נפתח)
function watchFinanceChartWidth(el, redraw) {
  el.__financeRedraw = redraw;
  if (el.__financeObserver || typeof ResizeObserver === "undefined") return;
  el.__financeObserver = new ResizeObserver(() => {
    const w = el.clientWidth;
    if (w && Math.abs(w - Number(el.dataset.renderWidth || 0)) > 8 && el.__financeRedraw) el.__financeRedraw();
  });
  el.__financeObserver.observe(el);
}

// עלות חבילה לחתן (לארגון) לפי תכולת החבילה שמוגדרת במסך מענקים לשנה הזו
function getDashboardGrantPackageCost(year = getCampaignYear()) {
  return getGrantPackageTotal(getGrantPackageForYear(getGrantsArchive(), year));
}

function getDashboardGrantCostForMonth(currentYear, monthIndex) {
  const packageCost = getDashboardGrantPackageCost(currentYear);
  if (!packageCost) return 0;

  const summaries = buildActiveMemberSummaries(currentYear);
  const eligibleCount = summaries.filter(member => {
    const collectedUntilMonth = (state.donations || [])
      .filter(d => d.year === currentYear && String(d.memberId).trim() === String(member.id).trim())
      .reduce((sum, d) => {
        const date = parseAppDate(d.date);
        if (!date || date.getMonth() > monthIndex) return sum;
        return sum + (Number(d.amount) || 0);
      }, 0);
    const target = Number(member.currentYearTarget) || 0;
    const required = Number(member.totalRequiredThisYear) || 0;
    const oldDebt = Number(member.totalDebtFromPast) || 0;
    return target > 0 ? collectedUntilMonth >= required : (oldDebt === 0 || collectedUntilMonth >= oldDebt);
  }).length;

  return eligibleCount * packageCost;
}

function renderDashboardActivity(currentYear, summaries) {
  const el = document.getElementById("dashboard-recent-activity");
  if (!el) return;

  const memberNames = new Map(summaries.map(row => [String(row.id).trim(), row.fullName || "ללא שם"]));
  const donations = (state.donations || [])
    .filter(d => d.year === currentYear)
    .map(d => ({
      type: "income",
      icon: "payments",
      title: memberNames.get(String(d.memberId || "").trim()) || "הפקדה כללית",
      sub: formatDateDisplay(d.date) || "ללא תאריך",
      amount: Number(d.amount) || 0,
      date: d.date || ""
    }));
  const expenses = (state.expenses || [])
    .filter(e => e.year === currentYear)
    .map(e => ({
      type: "expense",
      icon: "receipt_long",
      title: e.description || e.category || "הוצאה",
      sub: `${formatDateDisplay(e.date) || "ללא תאריך"}${e.category ? " · " + e.category : ""}`,
      amount: Number(e.amount) || 0,
      date: e.date || ""
    }));

  const rows = donations.concat(expenses)
    .sort((a, b) => compareDatesDesc(a.date, b.date))
    .slice(0, 8);

  if (!rows.length) {
    el.innerHTML = `<div class="dashboard-empty"><span class="material-icons-regular">history</span><span>אין עדיין פעילות לשנה הזו.</span></div>`;
    return;
  }

  el.innerHTML = rows.map(row => `
    <div class="dashboard-activity-item ${row.type}">
      <span class="material-icons-regular dashboard-item-icon ${row.type === "income" ? "success" : "danger"}">${row.icon}</span>
      <span>
        <span class="dashboard-item-title">${escapeHtml(row.title)}</span>
        <span class="dashboard-item-sub">${escapeHtml(row.sub)}</span>
      </span>
      <span class="dashboard-item-value">${row.type === "expense" ? "-" : ""}${escapeHtml(formatCurrency(row.amount))}</span>
    </div>
  `).join("");
}

function renderDashboardSegments(summaries) {
  const el = document.getElementById("dashboard-segments");
  if (!el) return;

  const groups = {};
  const segmentSummaries = summaries.map(row => ({
    ...row,
    yeshivaType: row.currentYearType || row.yeshivaType,
    shiur: row.currentYearShiur || row.shiur
  }));

  segmentSummaries.forEach(row => {
    const key = row.yeshivaType || "ללא מסגרת";
    if (!groups[key]) groups[key] = { count: 0, obligated: 0, reached: 0 };
    groups[key].count++;
    if ((Number(row.currentYearTarget) || 0) > 0) {
      groups[key].obligated++;
      if ((Number(row.collectedThisYear) || 0) >= (Number(row.currentYearTarget) || 0)) groups[key].reached++;
    }
  });

  const rows = Object.entries(groups)
    .filter(([, data]) => data.obligated > 0)
    .sort(([, a], [, b]) => b.obligated - a.obligated || b.reached - a.reached);
  if (!rows.length) {
    el.innerHTML = `<div class="dashboard-empty"><span class="material-icons-regular">groups</span><span>אין עדיין בחורים להצגה.</span></div>`;
    return;
  }

  el.innerHTML = rows.map(([name, data]) => {
    const pct = data.obligated > 0 ? Math.min(100, Math.round((data.reached / data.obligated) * 100)) : 0;
    return `
      <button class="dashboard-segment-item" type="button" data-click="dashboard-drill" data-type="segment" data-category="${escapeHtml(name)}">
        <span>
          <span class="dashboard-item-title">${escapeHtml(name)}</span>
          <span class="dashboard-item-sub">${data.reached.toLocaleString("he-IL")} מתוך ${data.obligated.toLocaleString("he-IL")} הגיעו לחובה</span>
        </span>
        <span class="dashboard-item-value">${pct}%</span>
        <div class="dashboard-segment-meter"><div style="width:${pct}%"></div></div>
      </button>
    `;
  }).join("");
}


function getDashboardSelectedYear() {
  const yearSelect = document.getElementById("dashboard-year-filter");
  return yearSelect ? (yearSelect.value || getCampaignYear()) : getCampaignYear();
}

function getDashboardMemberLabel(member) {
  return `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.fullName || "ללא שם";
}

function getDashboardMemberMeta(member) {
  if (member.currentYearType || member.currentYearShiur) {
    return [member.currentYearType || member.yeshivaType, member.yeshiva, member.currentYearShiur || member.shiur].filter(Boolean).join(" · ") || "ללא מסגרת";
  }
  return [member.yeshivaType, member.yeshiva, member.shiur].filter(Boolean).join(" · ") || "ללא מסגרת";
}

function dashboardMemberAction(memberId) {
  if (!memberId) return "";
  return `<button class="dashboard-drill-open-member" type="button" data-click="dashboard-open-member" data-id="${escapeHtml(memberId)}">פתח כרטיס</button>`;
}

function buildDashboardMemberCells(row, mode = "full") {
  const target = Number(row.currentYearTarget) || 0;
  const collected = Number(row.collectedThisYear) || 0;
  const progress = target > 0 ? Math.round((collected / target) * 100) : 0;
  const reached = target > 0 && collected >= target;
  const baseCells = [
    getDashboardMemberLabel(row),
    getDashboardMemberMeta(row),
    formatCurrency(row.currentYearTarget),
    formatCurrency(row.totalDebtFromPast),
    formatCurrency(row.collectedThisYear)
  ];
  if (mode === "progress" || mode === "segment") {
    return baseCells.concat([
      `${Math.min(999, Math.max(0, progress))}%`,
      reached ? "הגיע לחובה" : "עדיין חסר"
    ]);
  }
  return baseCells.concat([formatCurrency(row.missingAmount)]);
}

function renderDashboardDrillTable(columns, rows) {
  if (!rows.length) {
    return `<div class="dashboard-empty dashboard-drill-empty"><span class="material-icons-regular">task_alt</span><span>אין נתונים מתאימים לבחירה הזו.</span></div>`;
  }
  const hasAction = rows.some(row => row.memberId);
  const head = columns.concat(hasAction ? ["פעולה"] : []).map(label => `<th>${escapeHtml(label)}</th>`).join("");
  const body = rows.map(row => {
    const cells = row.cells.map(value => `<td>${escapeHtml(value)}</td>`).join("");
    const action = hasAction ? `<td>${dashboardMemberAction(row.memberId)}</td>` : "";
    return `<tr>${cells}${action}</tr>`;
  }).join("");
  return `
    <div class="dashboard-drill-table-wrap">
      <table class="dashboard-drill-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function ensureDashboardDrillModal() {
  let modal = document.getElementById("dashboard-drill-modal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "dashboard-drill-modal";
  modal.className = "modal-overlay dashboard-drill-modal";
  modal.innerHTML = `
    <div class="modal-content app-modal">
      <button class="modal-close" type="button" data-click="dashboard-drill-close" aria-label="סגור">
        <span class="material-icons-regular">close</span>
      </button>
      <div class="modal-inner" id="dashboard-drill-content"></div>
    </div>
  `;
  modal.addEventListener("click", event => {
    if (event.target === modal) closeDashboardDrill();
  });
  document.body.appendChild(modal);
  return modal;
}

function renderDashboardDrillContent(title, subtitle, columns, rows, summaryValue) {
  const content = document.getElementById("dashboard-drill-content");
  if (!content) return;
  content.innerHTML = `
    <div class="dashboard-drill-head">
      <div>
        <div class="dashboard-drill-kicker">נתונים אמיתיים מלוח הבקרה</div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="dashboard-drill-count">
        <span>${escapeHtml(summaryValue || rows.length.toLocaleString("he-IL"))}</span>
        <small>${rows.length.toLocaleString("he-IL")} שורות</small>
      </div>
    </div>
    ${renderDashboardDrillTable(columns, rows)}
  `;
}

window.closeDashboardDrill = function() {
  const modal = document.getElementById("dashboard-drill-modal");
  if (modal) modal.classList.remove("open");
};

window.openDashboardMember = function(memberId) {
  closeDashboardDrill();
  switchScreen("members-screen", true);
  setTimeout(() => loadMemberProfile(memberId), 80);
};

window.openDashboardDrill = function(type, category = "") {
  if (type === "new-year") { switchScreen("settings-screen", true); switchSettingsTab("targets"); return; }
  const year = getDashboardSelectedYear();
  const summaries = buildActiveMemberSummaries(year);
  const memberNameById = new Map(summaries.map(row => [String(row.id).trim(), getDashboardMemberLabel(row)]));
  const modal = ensureDashboardDrillModal();
  const memberColumns = ["בחור", "מסגרת", "חובה", "חוב קודם", "נאסף", "חסר"];
  const progressColumns = ["בחור", "מסגרת", "חובה", "חוב קודם", "נאסף", "התקדמות", "מצב"];
  let title = "";
  let subtitle = `שנת ${year}`;
  let columns = memberColumns;
  let rows = [];
  let summaryValue = "";

  const memberRows = (items, mode = "full") => items.map(row => ({
    memberId: row.id,
    cells: buildDashboardMemberCells(row, mode)
  }));

  if (type === "collected") {
    columns = ["תאריך", "בחור / מקור", "פירוט", "סכום"];
    const donationRows = (state.donations || [])
      .filter(d => d.year === year)
      .sort((a, b) => compareDatesDesc(a.date, b.date))
      .map(d => ({
        memberId: d.memberId,
        cells: [
          formatDateDisplay(d.date) || "ללא תאריך",
          memberNameById.get(String(d.memberId || "").trim()) || d.memberNameSnapshot || "הפקדה כללית",
          d.notes || "",
          formatCurrency(d.amount)
        ]
      }));
    const purimRows = Object.entries((state.settings && state.settings.purimManualSums) || {})
      .map(([groupName, groupSums]) => ({ groupName, amount: Number(groupSums && groupSums[year]) || 0 }))
      .filter(row => row.amount > 0)
      .map(row => ({
        cells: ["-", `פורים - ${row.groupName}`, "סיכום ידני", formatCurrency(row.amount)]
      }));
    rows = donationRows.concat(purimRows);
    title = "נגבה השנה";
    summaryValue = formatCurrency((state.donations || []).filter(d => d.year === year).reduce((sum, d) => sum + (Number(d.amount) || 0), 0) + getDashboardPurimTotal(year));
  } else if (type === "target") {
    const items = summaries
      .filter(row => (Number(row.totalRequiredThisYear) || 0) > 0)
      .sort((a, b) => (Number(b.totalRequiredThisYear) || 0) - (Number(a.totalRequiredThisYear) || 0));
    rows = memberRows(items);
    title = "יעד כולל";
    summaryValue = formatCurrency(items.reduce((sum, row) => sum + (Number(row.totalRequiredThisYear) || 0), 0));
  } else if (type === "missing") {
    const items = summaries
      .filter(row => (Number(row.missingAmount) || 0) > 0)
      .sort((a, b) => (Number(b.missingAmount) || 0) - (Number(a.missingAmount) || 0));
    rows = memberRows(items);
    title = "חסר להשלמה";
    summaryValue = formatCurrency(items.reduce((sum, row) => sum + (Number(row.missingAmount) || 0), 0));
  } else if (type === "eligible") {
    const items = summaries
      .filter(row => row.isEligible)
      .sort((a, b) => (Number(b.collectedThisYear) || 0) - (Number(a.collectedThisYear) || 0));
    rows = memberRows(items);
    title = "עמדו ביעד השנתי";
    summaryValue = items.length.toLocaleString("he-IL");
  } else if (type === "debt") {
    const items = summaries
      .filter(row => (Number(row.totalDebtFromPast) || 0) > 0)
      .sort((a, b) => (Number(b.totalDebtFromPast) || 0) - (Number(a.totalDebtFromPast) || 0));
    rows = memberRows(items);
    title = "חובות עד שנה קודמת";
    subtitle = `שנת ${year} · לא כולל את חובת השנה שנבחרה`;
    summaryValue = formatCurrency(items.reduce((sum, row) => sum + (Number(row.totalDebtFromPast) || 0), 0));
  } else if (type === "progress") {
    const items = summaries
      .filter(row => (Number(row.currentYearTarget) || 0) > 0)
      .sort((a, b) => (Number(b.collectedThisYear) || 0) - (Number(a.collectedThisYear) || 0));
    columns = progressColumns;
    rows = memberRows(items, "progress");
    title = "התקדמות כללית";
    subtitle = `שנת ${year} · כמה מהחובה (כולל חובות עבר) כבר כוסה`;
    summaryValue = `${getDashboardProgress(summaries)}%`;
  } else if (type === "near-goal") {
    const items = summaries
      .filter(row => !row.isEligible && (Number(row.missingAmount) || 0) > 0 && (Number(row.missingAmount) || 0) <= 500)
      .sort((a, b) => (Number(a.missingAmount) || 0) - (Number(b.missingAmount) || 0));
    rows = memberRows(items);
    title = "קרובים לזכאות";
    subtitle = `שנת ${year} · חסר עד ${formatCurrency(500)}`;
  } else if (type === "not-started") {
    const items = summaries
      .filter(row => (Number(row.currentYearTarget) || 0) > 0 && (Number(row.collectedThisYear) || 0) === 0)
      .sort((a, b) => getDashboardMemberLabel(a).localeCompare(getDashboardMemberLabel(b), "he"));
    rows = memberRows(items);
    title = "טרם התחילו גבייה";
  } else if (type === "missing-info") {
    columns = ["בחור", "חסר", "טלפון", "ישיבה"];
    rows = (state.members || [])
      .filter(member => {
        const isMarried = member.maritalStatus === "נשוי" || (member.notes || "").includes("התחתן");
        return !isMarried;
      })
      .map(member => {
        const missing = [];
        if (!String(member.phone || "").trim()) missing.push("טלפון");
        if (!String(member.yeshiva || "").trim()) missing.push("ישיבה");
        if (!String(member.yeshivaType || "").trim()) missing.push("סוג מסגרת");
        return { member, missing };
      })
      .filter(row => row.missing.length)
      .sort((a, b) => b.missing.length - a.missing.length)
      .map(row => ({
        memberId: row.member.id,
        cells: [
          getDashboardMemberLabel(row.member),
          row.missing.join(", "),
          row.member.phone || "-",
          row.member.yeshiva || "-"
        ]
      }));
    title = "פרטים חסרים בכרטיסי בחורים";
  } else if (type === "expense-category") {
    const selectedCategory = category || (getDashboardExpenseCategoryAlert(year) || {}).category || "";
    columns = ["תאריך", "קטגוריה", "פירוט", "סכום"];
    rows = (state.expenses || [])
      .filter(e => e.year === year && (e.category || "שונות") === selectedCategory)
      .sort((a, b) => compareDatesDesc(a.date, b.date))
      .map(e => ({
        cells: [
          formatDateDisplay(e.date) || "ללא תאריך",
          e.category || "שונות",
          e.description || "",
          formatCurrency(e.amount)
        ]
      }));
    title = selectedCategory ? `הוצאות לפי קטגוריה: ${selectedCategory}` : "הוצאות לפי קטגוריה";
    summaryValue = formatCurrency((state.expenses || [])
      .filter(e => e.year === year && (e.category || "שונות") === selectedCategory)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
  } else if (type === "segment") {
    summaries.forEach(row => {
      row.yeshivaType = row.currentYearType || row.yeshivaType;
      row.shiur = row.currentYearShiur || row.shiur;
    });
    const segmentName = category || "ללא מסגרת";
    const items = summaries
      .filter(row => (row.yeshivaType || "ללא מסגרת") === segmentName)
      .sort((a, b) => {
        const aReached = (Number(a.currentYearTarget) || 0) > 0 && (Number(a.collectedThisYear) || 0) >= (Number(a.currentYearTarget) || 0);
        const bReached = (Number(b.currentYearTarget) || 0) > 0 && (Number(b.collectedThisYear) || 0) >= (Number(b.currentYearTarget) || 0);
        return Number(bReached) - Number(aReached) || (Number(b.collectedThisYear) || 0) - (Number(a.collectedThisYear) || 0);
      });
    columns = progressColumns;
    rows = memberRows(items, "segment");
    title = `מסגרת: ${segmentName}`;
    const obligated = items.filter(row => (Number(row.currentYearTarget) || 0) > 0);
    const reached = obligated.filter(row => (Number(row.collectedThisYear) || 0) >= (Number(row.currentYearTarget) || 0));
    summaryValue = `${reached.length.toLocaleString("he-IL")} מתוך ${obligated.length.toLocaleString("he-IL")}`;
  }

  renderDashboardDrillContent(title || "פירוט", subtitle, columns, rows, summaryValue);
  modal.classList.add("open");
};

function renderChart(selectedYear) {
  const ctx = document.getElementById("incomeChart"); if (!ctx || typeof Chart === "undefined") return;
  if (incomeChartInstance) incomeChartInstance.destroy();

  const yearToChart = selectedYear || getCampaignYear();
  const monthlyData = new Array(12).fill(0);

  state.donations.forEach(d => {
      if (d.year === yearToChart && d.date) {
          const dateObj = parseAppDate(d.date);
          if (dateObj) monthlyData[dateObj.getMonth()] += Number(d.amount) || 0;
      }
  });

  const labels = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

  // מילוי זהב מדורג לעמודות
  const canvasCtx = ctx.getContext("2d");
  const goldFill = canvasCtx.createLinearGradient(0, 0, 0, ctx.height || 250);
  goldFill.addColorStop(0, "#E6C875");
  goldFill.addColorStop(1, "#C9A227");

  incomeChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
          labels: labels,
          datasets: [{
              label: "הכנסות בחודש",
              data: monthlyData,
              backgroundColor: goldFill,
              hoverBackgroundColor: "#B8901F",
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 46,
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: { display: false },
              tooltip: {
                  backgroundColor: "#101014",
                  titleColor: "#FCE883",
                  bodyColor: "#fff",
                  titleFont: { family: "Heebo", weight: "700", size: 13 },
                  bodyFont: { family: "Heebo", size: 13 },
                  padding: 12,
                  cornerRadius: 8,
                  displayColors: false,
                  callbacks: {
                      label: (item) => "  " + formatCurrency(item.raw)
                  }
              }
          },
          scales: {
              x: {
                  grid: { display: false },
                  ticks: { font: { family: "Heebo", size: 11 }, color: "#646470" }
              },
              y: {
                  beginAtZero: true,
                  border: { display: false },
                  grid: { color: "rgba(26,22,8,0.06)" },
                  ticks: {
                      font: { family: "Heebo", size: 11 },
                      color: "#9A9AA4",
                      callback: (val) => "₪" + Number(val).toLocaleString("he-IL")
                  }
              }
          }
      }
  });
}

function renderMembersTable() {
  const tbody = document.getElementById("members-table-body"); if (!tbody) return;
  const searchInput = document.getElementById("search-members-list");
  const term = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const showMarried = document.getElementById("filter-show-married")?.checked;
  
  let allRows = getMemberSummaries();
  allRows = allRows.filter(m => {
    const isMarried = m.maritalStatus === "נשוי" || (m.notes || "").includes("התחתן");
    return showMarried || !isMarried;
  });

  const getCity = m => m.address ? String(m.address).split(',').pop().trim() : "";
  // חיפוש רק בשדות שרואים (שם, טלפון, ישיבה, כתובת...) ולא במספרים פנימיים
  const searchText = m => [m.firstName, m.lastName, m.fatherName, m.fullName, m.phone, String(m.phone || "").replace(/\D/g, ""), m.yeshiva, m.yeshivaType, m.shiur, m.address, m.notes].filter(Boolean).join(" ").toLowerCase();

  // Update yeshiva dropdown based on current text+city filter (excluding yeshiva filter itself)
  const elYeshiva = document.getElementById("filter-members-yeshiva");
  if (elYeshiva) {
    const filteredForYeshiva = allRows.filter(m => {
      const matchGlobal = !term || searchText(m).includes(term);
      const cityMatch = !state.filterCity || getCity(m) === state.filterCity;
      return matchGlobal && cityMatch;
    });
    const availableYeshivas = [...new Set(filteredForYeshiva.map(m => m.yeshiva).filter(Boolean))].sort();
    const currentY = elYeshiva.value;
    elYeshiva.innerHTML = '<option value="">כל הישיבות</option>';
    availableYeshivas.forEach(y => { const o = document.createElement("option"); o.value = y; o.textContent = y; elYeshiva.appendChild(o); });
    elYeshiva.value = availableYeshivas.includes(currentY) ? currentY : "";
    if (elYeshiva.value !== currentY) state.filterYeshiva = "";
  }

  // Update city dropdown based on current text+yeshiva filter (excluding city filter itself)
  const elCity = document.getElementById("filter-members-city");
  if (elCity) {
    const filteredForCity = allRows.filter(m => {
      const matchGlobal = !term || searchText(m).includes(term);
      const matchYeshiva = !state.filterYeshiva || m.yeshiva === state.filterYeshiva;
      return matchGlobal && matchYeshiva;
    });
    const availableCities = [...new Set(filteredForCity.map(getCity).filter(Boolean))].sort();
    const currentC = elCity.value;
    elCity.innerHTML = '<option value="">כל הערים</option>';
    availableCities.forEach(c => { const o = document.createElement("option"); o.value = c; o.textContent = c; elCity.appendChild(o); });
    elCity.value = availableCities.includes(currentC) ? currentC : "";
    if (elCity.value !== currentC) state.filterCity = "";
  }

  let rows = allRows.filter(m => {
    const matchGlobal = !term || searchText(m).includes(term);
    const matchYeshiva = !state.filterYeshiva || m.yeshiva === state.filterYeshiva;
    const cityMatch = !state.filterCity || getCity(m) === state.filterCity;
    const types = state.filterYeshivaTypes || [];
    const typeMatch = types.length === 0 || types.includes(m.yeshivaType);
    return matchGlobal && matchYeshiva && cityMatch && typeMatch;
  });

  if (membersSortCol) {
      rows.sort((a, b) => {
          let valA = a[membersSortCol];
          let valB = b[membersSortCol];
          
          if (membersSortCol === "address") {
              valA = a.address ? String(a.address).split(',').pop().trim() : "";
              valB = b.address ? String(b.address).split(',').pop().trim() : "";
          }

          if (valA == null) valA = "";
          if (valB == null) valB = "";

          if (membersSortCol === "collectedThisYear") {
              return membersSortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
          }

          return membersSortAsc 
              ? String(valA).localeCompare(String(valB), 'he') 
              : String(valB).localeCompare(String(valA), 'he');
      });
  }

  const isAdmin = isAdminUser();
  const deleteColHead = document.getElementById("members-delete-col-head");
  if (deleteColHead) deleteColHead.style.display = isAdmin ? "" : "none";

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><span class="material-icons-regular">groups</span><p>אין בחורים התואמים לסינון</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  rows.forEach((row) => {
    const cityDisplay = row.address ? String(row.address).split(',').pop().trim() : "---";
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.dataset.memberId = row.id;
    tr.addEventListener("click", (e) => {
      const action = e.target.closest("[data-click]");
      if (action && tr.contains(action)) return; // כפתור בתוך השורה (מחיקה) מטופל בנפרד
      if (!state.membersEditMode) loadMemberProfile(row.id);
    });

    let shiurDisplay = row.shiur || "---";
    if(row.yeshivaType === "חיידר") shiurDisplay = "---";

    // בדיקת פרטים חסרים -> כוכבית אדומה
    const missing = [];
    if (!String(row.yeshivaType || "").trim()) missing.push("סוג מסגרת");
    if (!String(row.yeshiva || "").trim()) missing.push("ישיבה");
    if (!String(row.phone || "").trim()) missing.push("טלפון");
    if (!String(row.address || "").trim()) missing.push("כתובת");
    const star = missing.length ? `<span class="missing-star" title="חסר: ${escapeHtml(missing.join(", "))}">*</span>` : "";
    const deleteCell = isAdmin ? `<td class="no-export" style="text-align:center;"><button type="button" class="grants-archive-del" title="מחק בחור" data-click="delete-member" data-id="${escapeHtml(row.id)}"><span class="material-icons-regular">delete_outline</span></button></td>` : "";

    tr.innerHTML = `<td data-field="firstName">${escapeHtml(row.firstName)}${star}</td><td data-field="lastName">${escapeHtml(row.lastName)}</td><td data-field="fatherName">${escapeHtml(row.fatherName || "---")}</td><td data-field="yeshiva">${escapeHtml(row.yeshiva)}</td><td data-field="shiur">${escapeHtml(shiurDisplay)}</td><td>${escapeHtml(cityDisplay)}</td><td class="amount-cell" style="font-weight: bold; color: var(--gold-dark);">${escapeHtml(formatCurrency(row.collectedThisYear))}</td>${deleteCell}`;
    tbody.appendChild(tr);
  });

  // אם היינו במצב עריכה - לשמר אותו אחרי רינדור מחדש
  if (state.membersEditMode) {
    tbody.querySelectorAll(".missing-star").forEach(s => s.remove());
    tbody.querySelectorAll("td[data-field]").forEach(td => td.setAttribute("contenteditable", "true"));
  }
}

// מחיקת בחור - למנהל בלבד. מוחק את כרטיס הבחור בלבד; היסטוריית ההפקדות/הוצאות נשארת.
window.deleteMemberRow = async function(memberId) {
  if (!isAdminUser()) return;

  const member = state.members.find(m => String(m.id).trim() === String(memberId).trim());
  if (!member) return;
  const label = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "הבחור";
  if (!confirm(`למחוק את ${label} לצמיתות? הפעולה לא ניתנת לביטול.`)) return;

  state.members = state.members.filter(m => String(m.id).trim() !== String(memberId).trim());
  invalidateCache();
  saveState();
  renderMembersTable();
  populateMemberSelect();
  populateFilters();
  const saved = await persist("deleteMember", { id: member.id });
  reportSave(saved, `${label} נמחק`);
  logAudit("delete", "member", member.id, { name: label });
};

// ===== מצב עריכה ישיר בטבלת הבחורים =====
window.handleMembersEditButton = function() {
  if (state.membersEditMode) saveMembersEdit();
  else enterMembersEditMode();
};

function enterMembersEditMode() {
  const table = document.querySelector("#members-screen .data-table");
  if (!table) return;
  state.membersEditMode = true;
  table.classList.add("members-editing");
  table.querySelectorAll("#members-table-body .missing-star").forEach(s => s.remove());
  table.querySelectorAll("#members-table-body td[data-field]").forEach(td => td.setAttribute("contenteditable", "true"));
  const btn = document.getElementById("btn-members-edit-mode");
  if (btn) { btn.classList.add("is-save"); btn.innerHTML = `<span class="material-icons-regular">save</span>`; btn.title = "שמור שינויים"; }
  const cancel = document.getElementById("btn-members-edit-cancel"); if (cancel) cancel.style.display = "";
}

function exitMembersEditMode() {
  state.membersEditMode = false;
  const table = document.querySelector("#members-screen .data-table");
  if (table) { table.classList.remove("members-editing"); table.querySelectorAll("td[data-field]").forEach(td => td.removeAttribute("contenteditable")); }
  const btn = document.getElementById("btn-members-edit-mode");
  if (btn) { btn.classList.remove("is-save"); btn.innerHTML = `<span class="material-icons-regular">edit</span>`; btn.title = "מצב עריכה"; }
  const cancel = document.getElementById("btn-members-edit-cancel"); if (cancel) cancel.style.display = "none";
}

window.cancelMembersEdit = function() {
  exitMembersEditMode();
  renderMembersTable();
};

window.saveMembersEdit = function() {
  const trs = document.querySelectorAll("#members-table-body tr[data-member-id]");
  let changed = 0;
  const changedMembers = [];
  trs.forEach(tr => {
    const member = state.members.find(m => String(m.id).trim() === String(tr.dataset.memberId).trim());
    if (!member) return;
    let memberChanged = false;
    tr.querySelectorAll("td[data-field]").forEach(td => {
      const field = td.dataset.field;
      const starEl = td.querySelector(".missing-star");
      if (starEl) starEl.remove();
      let val = (td.textContent || "").trim();
      if (val === "---") val = "";
      const oldVal = String(member[field] || "").trim();
      if (val !== oldVal) { member[field] = val; changed++; memberChanged = true; }
    });
    if (memberChanged) changedMembers.push(member);
  });
  exitMembersEditMode();
  if (changed > 0) {
    invalidateCache();
    saveState();
    populateFilters();
    renderAll();
    Promise.all(changedMembers.map(m => persist("saveMember", m))).then(results => {
      reportSave(results.every(Boolean), `✅ נשמרו ${changed} שינויים`);
    });
    changedMembers.forEach(m => logAudit("update", "member", m.id, { via: "עריכה בטבלה", name: `${m.firstName || ""} ${m.lastName || ""}`.trim() }));
  } else {
    renderMembersTable();
  }
};

function renderDailyReport() {
    renderReportFinanceChart();
    const incTbody = document.getElementById("report-income-tbody");
    const expTbody = document.getElementById("report-expense-tbody");
    if (!incTbody || !expTbody) return;

    const filterVal = document.getElementById("report-time-filter")?.value || "today";
    const customDate = document.getElementById("report-custom-date")?.value;
    
    const today = new Date();
    const todayStr = dateKey(today);
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const yesterdayStr = dateKey(yesterday);
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const isDateMatch = (dateStr) => {
        if (filterVal === "all") return true;
        const d = parseAppDate(dateStr);
        if (!d) return false;
        const dStr = dateKey(d);
        if (filterVal === "today") return dStr === todayStr;
        if (filterVal === "yesterday") return dStr === yesterdayStr;
        if (filterVal === "week") return d >= weekStart && dStr <= todayStr;
        if (filterVal === "custom") return dStr === customDate;
        return true; 
    };
    const yearMatch = (y) => filterVal === "all" || y === getCampaignYear();

    let totalInc = 0;
    let incHtml = "";
    const summaries = getMemberSummaries();
    const summaryById = new Map(summaries.map(m => [String(m.id).trim(), m]));
    const filteredDonations = state.donations.filter(d => isDateMatch(d.date) && yearMatch(d.year));
    
    if (filteredDonations.length === 0) {
        incHtml = `<tr><td colspan="3" class="empty-cell" style="padding:20px!important;">אין הכנסות לתקופה זו</td></tr>`;
    } else {
        filteredDonations.sort((a, b) => compareDatesDesc(a.date, b.date)).forEach(d => {
            const member = summaryById.get(String(d.memberId).trim());
            const name = member ? member.fullName : d.memberNameSnapshot;
            const amt = Number(d.amount) || 0;
            totalInc += amt;
            
            incHtml += `<tr class="clickable-row" data-click="edit-donation" data-id="${escapeHtml(d.id)}" title="לחיצה לעריכה">
                <td>${escapeHtml(formatDateDisplay(d.date))}</td>
                <td><strong>${escapeHtml(name)}</strong><br><span style="font-size:11px;color:var(--text-secondary);">${escapeHtml(d.notes)}</span></td>
                <td class="amount-cell" style="font-weight: bold; color: var(--success);">${escapeHtml(formatCurrency(amt))}</td>
            </tr>`;
        });
    }

    let totalExp = 0;
    let expHtml = "";
    const filteredExpenses = state.expenses.filter(e => isDateMatch(e.date) && yearMatch(e.year));

    if (filteredExpenses.length === 0) {
        expHtml = `<tr><td colspan="3" class="empty-cell" style="padding:20px!important;">אין הוצאות לתקופה זו</td></tr>`;
    } else {
        filteredExpenses.sort((a, b) => compareDatesDesc(a.date, b.date)).forEach(e => {
            const amt = Number(e.amount) || 0;
            totalExp += amt;
            
            expHtml += `<tr class="clickable-row" data-click="edit-expense" data-id="${escapeHtml(e.id)}" title="לחיצה לעריכה">
                <td>${escapeHtml(formatDateDisplay(e.date))}</td>
                <td><strong>${escapeHtml(e.description)}</strong><br><span style="background:var(--surface-light); border-radius:8px; padding:2px 6px; font-size:11px;">${escapeHtml(e.category)}</span></td>
                <td class="amount-cell" style="font-weight: bold; color: var(--danger);">${escapeHtml(formatCurrency(amt))}</td>
            </tr>`;
        });
    }

    incTbody.innerHTML = incHtml;
    expTbody.innerHTML = expHtml;
    setText("report-total-income", formatCurrency(totalInc));
    setText("report-total-expense", formatCurrency(totalExp));

    if (typeof renderChart === "function") renderChart(getCampaignYear());
}

const HEBREW_YEARS_ORDER = ['תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט', 'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט', 'תש"צ'];
const EXPENSE_CHART_COLORS = ["#1D9E75", "#378ADD", "#EF9F27", "#7F77DD", "#D85A30", "#D4537E", "#639922", "#A38525"];

function populateExpensesYearFilter() {
  const sel = document.getElementById("expenses-year-filter");
  if (!sel) return;
  const years = [...new Set(state.expenses.map(e => e.year || "כללי"))].sort((a, b) => {
    const ia = HEBREW_YEARS_ORDER.indexOf(a), ib = HEBREW_YEARS_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ib - ia;
    return String(b).localeCompare(String(a), "he");
  });
  const campaign = getCampaignYear();
  if (!years.includes(campaign)) years.unshift(campaign);
  if (!state.expensesViewYear || !years.includes(state.expensesViewYear)) state.expensesViewYear = campaign;
  sel.innerHTML = years.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join("");
  sel.value = state.expensesViewYear;
}

window.onExpensesYearChange = function() {
  const sel = document.getElementById("expenses-year-filter");
  if (sel) state.expensesViewYear = sel.value;
  renderExpensesKpisAndCharts();
};

function renderExpensesKpisAndCharts() {
  populateExpensesYearFilter();
  const currentYear = state.expensesViewYear || getCampaignYear();
  const curIdx = HEBREW_YEARS_ORDER.indexOf(currentYear);
  const prevYear = curIdx > 0 ? HEBREW_YEARS_ORDER[curIdx - 1] : null;

  const curExpenses = state.expenses.filter(e => (e.year || "כללי") === currentYear);
  const totalThisYear = curExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalPrevYear = prevYear ? state.expenses.filter(e => e.year === prevYear).reduce((s, e) => s + (Number(e.amount) || 0), 0) : 0;
  // הכנסות = הפקדות הבחורים + סכומי פורים (כמו בלוח הבקרה)
  const incomeThisYear = state.donations.filter(d => d.year === currentYear).reduce((s, d) => s + (Number(d.amount) || 0), 0) + getDashboardPurimTotal(currentYear);

  // קטגוריות לשנה הנוכחית
  const catTotals = {};
  curExpenses.forEach(e => { const c = e.category || "שונות"; catTotals[c] = (catTotals[c] || 0) + (Number(e.amount) || 0); });
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCat = catEntries[0];

  // KPI: סה"כ + שינוי
  setText("exp-kpi-total", formatCurrency(totalThisYear));
  const changeEl = document.getElementById("exp-kpi-change");
  if (changeEl) {
    if (prevYear && totalPrevYear > 0) {
      const pct = Math.round(((totalThisYear - totalPrevYear) / totalPrevYear) * 100);
      const up = pct >= 0;
      changeEl.innerHTML = `<span style="color:${up ? 'var(--danger)' : 'var(--success)'};">${up ? '▲' : '▼'} ${Math.abs(pct)}% מאשתקד</span>`;
    } else {
      changeEl.textContent = "אין נתוני השוואה";
    }
  }

  // KPI: קטגוריה גדולה
  setText("exp-kpi-top-cat", topCat ? topCat[0] : "—");
  setText("exp-kpi-top-cat-amount", topCat ? `${formatCurrency(topCat[1])} · ${totalThisYear > 0 ? Math.round(topCat[1] / totalThisYear * 100) : 0}%` : "—");

  // KPI: ממוצע חודשי + תנועות
  const monthsForAvg = getMonthsForAverage(currentYear);
  setText("exp-kpi-avg", formatCurrency(totalThisYear / monthsForAvg));
  setText("exp-kpi-count", `${curExpenses.length} תנועות · לפי ${monthsForAvg} ${monthsForAvg === 1 ? "חודש" : "חודשים"}`);

  // KPI: יחס מההכנסות
  const ratio = incomeThisYear > 0 ? Math.round(totalThisYear / incomeThisYear * 100) : 0;
  setText("exp-kpi-ratio", `${ratio}%`);
  setText("exp-kpi-ratio-hint", incomeThisYear > 0 ? `מכל ₪100 שנאספו (כולל פורים) → ₪${ratio} הוצאות` : "אין הכנסות רשומות");

  if (typeof Chart === "undefined") return;

  // גרף דונאט קטגוריות
  const catCtx = document.getElementById("expenseCategoryChart");
  if (catCtx) {
    if (expenseCategoryChartInstance) expenseCategoryChartInstance.destroy();
    if (catEntries.length === 0) {
      catCtx.getContext("2d").clearRect(0, 0, catCtx.width, catCtx.height);
    } else {
      expenseCategoryChartInstance = new Chart(catCtx, {
        type: "doughnut",
        data: {
          labels: catEntries.map(c => c[0]),
          datasets: [{ data: catEntries.map(c => c[1]), backgroundColor: EXPENSE_CHART_COLORS, borderWidth: 2, borderColor: "#fff" }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: "62%",
          plugins: {
            legend: { position: "left", rtl: true, labels: { font: { family: "Heebo", size: 12 }, color: "#646470", boxWidth: 12, padding: 10 } },
            tooltip: {
              backgroundColor: "#101014", titleColor: "#FCE883", bodyColor: "#fff",
              titleFont: { family: "Heebo", weight: "700", size: 13 }, bodyFont: { family: "Heebo", size: 13 },
              padding: 12, cornerRadius: 8, rtl: true,
              callbacks: { label: (item) => "  " + formatCurrency(item.raw) + " (" + (totalThisYear > 0 ? Math.round(item.raw / totalThisYear * 100) : 0) + "%)" }
            }
          }
        }
      });
    }
  }

  // גרף עמודות מגמה רב-שנתית
  const trendCtx = document.getElementById("expenseTrendChart");
  if (trendCtx) {
    if (expenseTrendChartInstance) expenseTrendChartInstance.destroy();
    const yearTotals = {};
    state.expenses.forEach(e => { const y = e.year || "כללי"; yearTotals[y] = (yearTotals[y] || 0) + (Number(e.amount) || 0); });
    const sortedYears = Object.keys(yearTotals).sort((a, b) => {
      const ia = HEBREW_YEARS_ORDER.indexOf(a), ib = HEBREW_YEARS_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return a.localeCompare(b, "he");
    });
    const canvasCtx = trendCtx.getContext("2d");
    const goldFill = canvasCtx.createLinearGradient(0, 0, 0, 240);
    goldFill.addColorStop(0, "#E6C875"); goldFill.addColorStop(1, "#C9A227");
    expenseTrendChartInstance = new Chart(trendCtx, {
      type: "bar",
      data: {
        labels: sortedYears,
        datasets: [{ data: sortedYears.map(y => yearTotals[y]), backgroundColor: sortedYears.map(y => y === currentYear ? "#185FA5" : goldFill), borderRadius: 6, borderSkipped: false, maxBarThickness: 48 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#101014", titleColor: "#FCE883", bodyColor: "#fff",
            titleFont: { family: "Heebo", weight: "700", size: 13 }, bodyFont: { family: "Heebo", size: 13 },
            padding: 12, cornerRadius: 8, displayColors: false, callbacks: { label: (item) => "  " + formatCurrency(item.raw) }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "Heebo", size: 11 }, color: "#646470" } },
          y: { beginAtZero: true, border: { display: false }, grid: { color: "rgba(26,22,8,0.06)" }, ticks: { font: { family: "Heebo", size: 11 }, color: "#9A9AA4", callback: (val) => "₪" + Number(val).toLocaleString("he-IL") } }
        }
      }
    });
  }
}

// בשנה שעדיין רצה - מחלקים במספר החודשים שעברו מתחילתה (תשרי), ולא ב-12
function getMonthsForAverage(year) {
  const current = getCurrentHebrewYearLabel();
  if (!current || year !== current) return 12;
  const today = new Date();
  const p = getHebrewDateParts(today);
  let days = 0;
  for (let d = new Date(today); days < 400; days++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    const pp = getHebrewDateParts(d);
    if (!pp || pp.year !== p.year) break;
  }
  return Math.min(12, Math.max(1, Math.ceil((days + 1) / 29.53)));
}

function renderExpensesSummaryTable() {
  renderExpensesKpisAndCharts();
  const container = document.getElementById("expenses-cats-container");
  if (!container) return;

  const yearsSet = new Set();
  const tree = {};
  state.expenses.forEach(e => {
    const y = e.year || "כללי";
    const c = e.category || "שונות";
    const desc = e.description || "כללי";
    const amount = Number(e.amount) || 0;
    yearsSet.add(y);
    if (!tree[c]) tree[c] = { total: {}, subs: {} };
    if (!tree[c].total[y]) tree[c].total[y] = 0;
    if (!tree[c].subs[desc]) tree[c].subs[desc] = {};
    if (!tree[c].subs[desc][y]) tree[c].subs[desc][y] = 0;
    tree[c].total[y] += amount;
    tree[c].subs[desc][y] += amount;
  });

  const allYears = Array.from(yearsSet).sort((a, b) => {
    const ia = HEBREW_YEARS_ORDER.indexOf(a), ib = HEBREW_YEARS_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    return a.localeCompare(b, 'he');
  });
  const yearsToShow = (!state.showAllExpenseYears && allYears.length > 5) ? allYears.slice(-5) : allYears;

  // עדכן כפתור
  const btnEl = document.getElementById("exp-years-btn-text");
  if (btnEl) btnEl.textContent = state.showAllExpenseYears ? "הצג פחות שנים" : "הצג כל השנים";

  const categories = Object.keys(tree).sort();
  if (categories.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-secondary);">אין נתוני הוצאות לסכם</div>';
    return;
  }

  const grandTotals = {};
  let html = '';

  categories.forEach(cat => {
    const yearHeaders = yearsToShow.map(y => `<th class="exp-mini-th-year">${escapeHtml(y)}</th>`).join('');
    let rows = '';
    Object.keys(tree[cat].subs).sort().forEach(desc => {
      const cells = yearsToShow.map(y => {
        const v = tree[cat].subs[desc][y] || 0;
        return `<td class="exp-mini-val">${v > 0 ? formatCurrency(v) : '—'}</td>`;
      }).join('');
      rows += `<tr><td class="exp-mini-desc">${escapeHtml(desc)}</td>${cells}</tr>`;
    });
    const totalCells = yearsToShow.map(y => {
      const v = tree[cat].total[y] || 0;
      grandTotals[y] = (grandTotals[y] || 0) + v;
      return `<td class="exp-mini-val exp-mini-val-total">${v > 0 ? formatCurrency(v) : '—'}</td>`;
    }).join('');

    html += `<div class="exp-cat-card">
      <div class="exp-cat-card-header">${escapeHtml(cat)}</div>
      <div class="exp-cat-table-wrap">
        <table class="exp-cat-mini-table">
          <thead><tr><th class="exp-mini-th-item">פירוט</th>${yearHeaders}</tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="exp-mini-total-row">
            <td class="exp-mini-desc"><strong>סה"כ</strong></td>${totalCells}
          </tr></tfoot>
        </table>
      </div>
    </div>`;
  });

  // כרטיס סיכום כללי
  const grandHeaders = yearsToShow.map(y => `<th class="exp-mini-th-year">${escapeHtml(y)}</th>`).join('');
  const grandCells = yearsToShow.map(y => `<td class="exp-mini-val exp-mini-val-total">${grandTotals[y] > 0 ? formatCurrency(grandTotals[y]) : '—'}</td>`).join('');
  html += `<div class="exp-cat-card exp-grand-card">
    <div class="exp-cat-card-header exp-grand-header">סיכום כולל</div>
    <div class="exp-cat-table-wrap">
      <table class="exp-cat-mini-table">
        <thead><tr><th class="exp-mini-th-item"></th>${grandHeaders}</tr></thead>
        <tbody><tr class="exp-mini-total-row">
          <td class="exp-mini-desc"><strong>סה"כ הוצאות</strong></td>${grandCells}
        </tr></tbody>
      </table>
    </div>
  </div>`;

  container.innerHTML = html;
}

window.toggleExpenseYears = function() {
    state.showAllExpenseYears = !state.showAllExpenseYears;
    renderExpensesSummaryTable();
}



// ==========================================
// היסטוריית מענקים - נתונים מתוך אקסל "מענקים תשפ"ד-תשפ"ו"
// מקבלי מענק לפי שנה, תכולת החבילה לחתן, וחיוב לפי חנות.
// הערה: בשנים תשפ"ה/תשפ"ו נרשמו המקבלים לפי ת"ז ותאריך בלבד (ללא שם) במקור.
// ==========================================
// שים לב: אין כאן נתונים אישיים (שמות/ת"ז/טלפונים) של מקבלי מענקים בכוונה -
// הנתונים האמיתיים חיים ב-Supabase (טבלת grants_archive) ונטענים אחרי התחברות.
// זהו רק שלד ברירת מחדל למקרה שהמסך נפתח לפני שהנתונים מהשרת נטענו.
const GRANTS_ARCHIVE = {
  perGroomValue: 8110.7,
  years: {},
  payments: [
    { year: "תשפ\"ד", store: "רויאל", date: "תשרי תשפ\"ד", description: "תשלום בפועל לפי כרטיסיית תשלום לרויאל", method: "מזומן", amount: 39835.95 },
    { year: "תשפ\"ד", store: "סאפרים", date: "26.07.2023", description: "תשלום בפועל לפי כרטיסיית סאפרים", method: "העברה", amount: 9360 },
    { year: "תשפ\"ד", store: "סאפרים", date: "י\"ג אדר ב'", description: "תשלום בפועל לפי כרטיסיית סאפרים", method: "העברה", amount: 10000 },
    { year: "תשפ\"ד", store: "סאפרים", date: "ח' ניסן", description: "תשלום בפועל לפי כרטיסיית סאפרים", method: "העברה", amount: 32500 },
    { year: "תשפ\"ד", store: "אווניו 13 ביתר", date: "ניסן תשפ\"ד", description: "תשלום בפועל לפי כרטיסיית אווניו 13", method: "תשלום", amount: 7399.25 },
    { year: "תשפ\"ו", store: "אווניו 13 ביתר", date: "אדר תשפ\"ו", description: "תשלום בפועל לפי כרטיסיית אווניו 13", method: "תשלום", amount: 6236 }
  ],
  package: [
    { store: "רויאל", discount: "30%", items: [
      { name: "חליפה 3 חלקים ביטנה מלאה", qty: 1, storePrice: 1375, orgPrice: 960, value: 960 },
      { name: "בעקיטשע חלק חצי בטנה", qty: 1, storePrice: 845, orgPrice: 590, value: 590 },
      { name: "בעקיטשע פירחוני חצי בטנה", qty: 1, storePrice: 850, orgPrice: 510, value: 510 },
      { name: "מכנס שחור פוליאסטר", qty: 2, storePrice: 170, orgPrice: 110, value: 220 }
    ]},
    { store: "רויאל", discount: "15%", items: [
      { name: "חגורה יוקרתית מעור", qty: 1, storePrice: 59, orgPrice: 50.15, value: 50.15 },
      { name: "גרביים", qty: 9, storePrice: 13.9, orgPrice: 11.815, value: 106.34 },
      { name: "חולצות 24K", qty: 8, storePrice: 135, orgPrice: 110, value: 880 },
      { name: "סוודר", qty: 1, storePrice: 110, orgPrice: 90, value: 90 },
      { name: "הלבשה אישית", qty: 4, storePrice: 64.9, orgPrice: 55.165, value: 220.66 },
      { name: "גופיות", qty: 8, storePrice: 30, orgPrice: 25.5, value: 204 },
      { name: "כיפות", qty: 2, storePrice: 24, orgPrice: 20.4, value: 40.8 },
      { name: "טלית קטן צמר", qty: 2, storePrice: 117, orgPrice: 99.45, value: 198.9 },
      { name: "פיג'מה", qty: 1, storePrice: 85, orgPrice: 72.25, value: 72.25 }
    ]},
    { store: "סטייל שיך", discount: "12%", items: [
      { name: "זיכוי לנעלי יום חול", qty: 1, storePrice: 250, orgPrice: 220, value: 220 },
      { name: "זיכוי לנעלי שבת", qty: 1, storePrice: 250, orgPrice: 220, value: 220 }
    ]},
    { store: "אווניו 13", discount: "15%", items: [
      { name: "מגבת ידיים 50/90", qty: 4, storePrice: 33, orgPrice: 28.05, value: 112.2 },
      { name: "מגבת רחצה 90/130", qty: 4, storePrice: 66, orgPrice: 56.1, value: 224.4 },
      { name: "מגבת מטבח", qty: 4, storePrice: 16, orgPrice: 13.6, value: 54.4 },
      { name: "זיכוי לקניית מצעים", qty: 0, storePrice: 400, orgPrice: 340, value: 0 }
    ]},
    { store: "סאפרים", discount: "", items: [
      { name: "זיכוי לכובע חסידי", qty: 1, storePrice: 1500, orgPrice: 700, value: 700 }
    ]}
  ]
};

function renderGrantsLists() {
  renderGrantsArchive();
}

function getSortedGrantYears(archive) {
  const years = Object.keys((archive && archive.years) || {});
  return years.sort((a, b) => {
    const ia = HEBREW_YEARS_ORDER.indexOf(a);
    const ib = HEBREW_YEARS_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, "he");
  });
}

function getGrantPackageForYear(archive, year) {
  const yearData = archive.years && archive.years[year] ? archive.years[year] : {};
  return Array.isArray(yearData.package) ? yearData.package : (archive.package || []);
}

// עלות בפועל לארגון (אחרי הנחה) - סכום שדה value לכל שורה (כבר מוכפל בכמות)
function getGrantPackageTotal(packageGroups) {
  return (packageGroups || []).reduce((sum, group) => {
    return sum + (group.items || []).reduce((inner, item) => inner + (Number(item.value) || 0), 0);
  }, 0);
}

// כמות של פריט בחבילה: כמות 0 היא באמת 0 (פריט שלא ניתן); רק כמות חסרה נחשבת 1
function pkgQty(item) {
  const q = item ? item.qty : undefined;
  return (q === undefined || q === null || q === "") ? 1 : (Number(q) || 0);
}

// שווי אמיתי לחתן (מחיר מלא בחנות, לפני הנחה) - זה המספר שצריך להיות מודגש בעיני הצדקה
function getGrantPackageRetailTotal(packageGroups) {
  return (packageGroups || []).reduce((sum, group) => {
    return sum + (group.items || []).reduce((inner, item) => inner + (Number(item.storePrice) || 0) * pkgQty(item), 0);
  }, 0);
}

function getGrantPerGroomValue(archive, year) {
  const yearData = archive.years && archive.years[year] ? archive.years[year] : {};
  const explicit = Number(yearData.perGroomValue || archive.perGroomValue || 0);
  if (explicit > 0) return explicit;
  return getGrantPackageTotal(getGrantPackageForYear(archive, year));
}

function getGrantPaymentsForYear(archive, year) {
  const yearData = archive.years && archive.years[year] ? archive.years[year] : {};
  const basePayments = Array.isArray(archive.payments) ? archive.payments.filter(p => p.year === year) : [];
  const yearPayments = Array.isArray(yearData.payments) ? yearData.payments : [];
  return [...basePayments, ...yearPayments];
}

function mergeGrantsArchiveDefaults(savedArchive) {
  const base = JSON.parse(JSON.stringify(GRANTS_ARCHIVE));
  if (!savedArchive || typeof savedArchive !== "object") return base;
  const savedPackageHasPriceDetails = Array.isArray(savedArchive.package)
    && savedArchive.package.some(group => (group.items || []).some(item => item.storePrice !== undefined || item.orgPrice !== undefined));

  const merged = {
    ...base,
    ...savedArchive,
    package: savedPackageHasPriceDetails ? savedArchive.package : base.package,
    payments: Array.isArray(savedArchive.payments) ? savedArchive.payments : base.payments,
    paymentProducts: Array.isArray(savedArchive.paymentProducts) ? savedArchive.paymentProducts : base.paymentProducts,
    years: { ...base.years }
  };

  Object.keys(savedArchive.years || {}).forEach(year => {
    merged.years[year] = {
      ...(base.years[year] || {}),
      ...(savedArchive.years[year] || {})
    };
  });

  return merged;
}

// פונקציית ייצוא לפי הדף הפנימי הפעיל בעמוד מענקים.
window.exportGrantsToExcel = function() {
  const year = (state.grantsArchiveYear || "").replace(/"/g, "");
  if (state.grantsActiveView === "payments") {
    exportToCSV("store-bills-tbody", `תשלומים_חנויות_${year}_מחצית_${state.billsHalf || "א"}`);
    return;
  }
  exportToCSV("grants-archive-recipients-tbody", `מקבלי_מענק_${year}`);
};

// ==========================================
// היסטוריית מענקים - תצוגה
// ==========================================
window.switchGrantsView = function(view) {
  const normalizedView = (view === "archive" || view === "current") ? "grant" : view;
  state.grantsActiveView = normalizedView === "payments" ? "payments" : "grant";

  const grant = document.getElementById("grants-grant-view");
  const payments = document.getElementById("grants-payments-view");
  if (!grant || !payments) return;

  grant.classList.toggle("hidden", state.grantsActiveView !== "grant");
  payments.classList.toggle("hidden", state.grantsActiveView !== "payments");
  document.querySelectorAll("#grants-view-toggle .grants-view-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === state.grantsActiveView);
  });
  renderGrantsArchive();
};

function formatArchiveDate(dateStr) {
  if (!dateStr) return "—";
  const d = parseAppDate(dateStr);
  if (!d) return escapeHtml(dateStr);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// מחזיר את מאגר המענקים לתצוגה - עותק ערוך של המשתמש אם קיים, אחרת נתוני הבסיס מהאקסל
function getGrantsArchive() {
  return mergeGrantsArchiveDefaults(state.grantsArchive);
}

// מבטיח שקיים עותק ערוך ב-state (שכפול עמוק של נתוני הבסיס בפעם הראשונה)
function ensureEditableArchive() {
  state.grantsArchive = mergeGrantsArchiveDefaults(state.grantsArchive);
  return state.grantsArchive;
}

function renderGrantsArchive() {
  const archive = getGrantsArchive();
  const years = getSortedGrantYears(archive);
  if (!years.length) return;
  if (!state.grantsArchiveYear || !archive.years[state.grantsArchiveYear]) {
    const campaignYear = getCampaignYear();
    state.grantsArchiveYear = archive.years[campaignYear] ? campaignYear : years[years.length - 1];
  }
  const activeYear = state.grantsArchiveYear;
  const yearData = archive.years[activeYear] || {};
  const recipients = yearData.recipients || [];
  const recipientsCount = recipients.length;
  const packageGroups = getGrantPackageForYear(archive, activeYear);
  const perGroomRetail = getGrantPackageRetailTotal(packageGroups); // שווי אמיתי (מחיר מלא) - זה מה שמודגש
  const totalYearValue = perGroomRetail * recipientsCount; // שווי המענקים שניתנו השנה, בסך הכל
  const payments = getGrantPaymentsForYear(archive, activeYear);

  // --- בורר שנה (קומפקטי, בתוך הטולבר) ---
  const yearSelectEl = document.getElementById("grants-year-select");
  if (yearSelectEl) {
    yearSelectEl.innerHTML = years.map(y => `<option value="${escapeHtml(y)}"${y === activeYear ? " selected" : ""}>${escapeHtml(y)} (${(archive.years[y].recipients || []).length})</option>`).join("");
  }

  // --- כרטיסי נתונים: מודגש = שווי שניתן, לא עלות ---
  const statsEl = document.getElementById("grants-archive-stats");
  if (statsEl) {
    statsEl.innerHTML = [
      { icon: "volunteer_activism", label: "שווי המענקים שניתנו השנה", value: formatCurrency(totalYearValue), tone: "gold" },
      { icon: "redeem", label: "שווי מענק לחתן", value: formatCurrency(perGroomRetail), tone: "info" },
      { icon: "groups", label: "מקבלי מענק", value: recipientsCount.toLocaleString("he-IL"), tone: "success" }
    ].map(s => `
      <div class="grants-archive-stat ${s.tone}">
        <span class="material-icons-regular">${s.icon}</span>
        <div>
          <div class="grants-archive-stat-label">${s.label}</div>
          <div class="grants-archive-stat-value">${s.value}</div>
        </div>
      </div>`).join("");
  }

  // --- רשימת מקבלים ---
  const labelEl = document.getElementById("grants-archive-year-label");
  if (labelEl) labelEl.textContent = `· ${activeYear}`;
  const packageYearLabel = document.getElementById("grants-package-year-label");
  if (packageYearLabel) packageYearLabel.textContent = `· ${activeYear}`;
  const paymentYearLabel = document.getElementById("grants-payment-year-label");
  if (paymentYearLabel) paymentYearLabel.textContent = `· ${activeYear}`;

  const hasNames = recipients.some(r => r.name);
  const noteEl = document.getElementById("grants-archive-recipients-note");
  if (noteEl) {
    noteEl.innerHTML = (hasNames || !recipients.length)
      ? ""
      : `<span class="material-icons-regular">info</span> בשנה זו נרשמו המקבלים לפי תעודת זהות ותאריך בלבד (ללא שם) בקובץ המקור.`;
    noteEl.style.display = (hasNames || !recipients.length) ? "none" : "flex";
  }

  const tbody = document.getElementById("grants-archive-recipients-tbody");
  if (tbody) {
    if (!recipients.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:28px 12px;">אין עדיין מקבלי מענק בשנה זו</div></td></tr>`;
    } else {
      tbody.innerHTML = recipients.map((r, i) => `
        <tr>
          <td style="color: var(--text-muted); font-weight:700;">${i + 1}</td>
          <td style="font-weight:700;">${r.name ? escapeHtml(r.name) : "<span style='color:var(--text-muted)'>—</span>"}</td>
          <td style="direction:ltr; text-align:right;">${r.id ? escapeHtml(r.id) : "—"}</td>
          <td style="direction:ltr; text-align:right;">${r.phone ? escapeHtml(r.phone) : "—"}</td>
          <td>${formatArchiveDate(r.date)}</td>
          <td class="no-export" style="text-align:center;"><button type="button" class="grants-archive-del grants-archive-edit" title="עריכה" data-click="grants-recipient-edit" data-index="${i}"><span class="material-icons-regular">edit</span></button></td>
          <td class="no-export" style="text-align:center;"><button type="button" class="grants-archive-del" title="הסר" data-click="grants-recipient-remove" data-index="${i}"><span class="material-icons-regular">close</span></button></td>
        </tr>`).join("");
    }
  }

  // --- תכולת החבילה: מודגש = שווי (מחיר מלא), משני = עלות לארגון (אחרי הנחה) ---
  const pkgTotalEl = document.getElementById("grants-archive-pkg-total");
  if (pkgTotalEl) pkgTotalEl.textContent = formatCurrency(perGroomRetail);

  const editBtn = document.getElementById("grants-pkg-edit-btn");
  const cancelBtn = document.getElementById("grants-pkg-cancel-btn");
  if (editBtn) editBtn.innerHTML = state.grantsPackageEditMode
    ? `<span class="material-icons-regular">save</span> שמור תכולה`
    : `<span class="material-icons-regular">edit</span> ערוך תכולה`;
  if (cancelBtn) cancelBtn.classList.toggle("hidden", !state.grantsPackageEditMode);

  const pkgEl = document.getElementById("grants-archive-package");
  if (pkgEl) {
    const givingGrid = document.querySelector(".grants-giving-grid");
    if (givingGrid) givingGrid.classList.toggle("is-editing-package", !!state.grantsPackageEditMode);
    if (state.grantsPackageEditMode) {
      pkgEl.innerHTML = renderGrantsPackageEditorHtml(state.grantsPackageDraft || []);
    } else {
      pkgEl.innerHTML = packageGroups.length ? packageGroups.map(group => {
        const items = group.items || [];
        const groupOrgTotal = items.reduce((s, it) => s + (Number(it.value) || 0), 0);
        const groupRetailTotal = items.reduce((s, it) => s + (Number(it.storePrice) || 0) * pkgQty(it), 0);
        return `
          <div class="grants-pkg-group">
            <div class="grants-pkg-group-head">
              <span>${escapeHtml(group.store)}${group.discount ? ` · הנחה ${escapeHtml(group.discount)}` : ""}</span>
              <span class="grants-pkg-prices">
                <strong>שווי ${formatCurrency(groupRetailTotal)}</strong>
                <small>עלות לארגון ${formatCurrency(groupOrgTotal)}</small>
              </span>
            </div>
            ${items.map(it => `
              <div class="grants-pkg-item">
                <span>${escapeHtml(it.name)}${it.qty > 1 ? ` <em>×${it.qty}</em>` : ""}</span>
                <span class="grants-pkg-prices">
                  <strong>שווי ${formatCurrency((Number(it.storePrice) || 0) * pkgQty(it))}</strong>
                  <small>עלות לארגון ${formatCurrency(it.value != null ? it.value : it.orgPrice)}</small>
                </span>
              </div>`).join("")}
          </div>`;
      }).join("") : `<div class="empty-state" style="padding:28px 12px;">אין עדיין פירוט תכולת מענק לשנה זו</div>`;
    }
  }

  // --- תשלומים לחנויות לפי מחצית ---
  renderStoreBills(archive, activeYear);

  // --- תשלומים ישנים (לפני החלוקה למחציות) ---
  // רק תשלומים שעוד לא שויכו למחצית (המשויכים מופיעים בטבלת המחצית)
  const unassigned = payments.filter(p => !getLegacyPaymentHalf(archive, activeYear, p));
  const unassignedTotal = unassigned.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const legacyPanel = document.getElementById("legacy-payments-panel");
  if (legacyPanel) legacyPanel.classList.toggle("hidden", !unassigned.length);
  setText("legacy-payments-year-label", `· ${activeYear}`);
  const canEditLegacy = canEditUser();
  const paymentsTbody = document.getElementById("grants-payments-tbody");
  if (paymentsTbody) {
    paymentsTbody.innerHTML = unassigned.map(payment => `
      <tr>
        <td style="font-weight:700;">${escapeHtml(payment.store || "—")}</td>
        <td>${escapeHtml(payment.date || "—")}</td>
        <td>${escapeHtml(payment.description || "—")}</td>
        <td>${escapeHtml(payment.method || "—")}</td>
        <td class="amount-cell" style="font-weight:800;">${formatCurrency(payment.amount)}</td>
        <td class="no-export">${canEditLegacy ? `<button type="button" class="btn btn-outline bill-row-btn" data-click="legacy-assign-open" data-key="${escapeHtml(legacyPaymentKey(payment))}">שייך למחצית</button>` : ""}</td>
      </tr>`).join("");
  }
  const paymentsTotalEl = document.getElementById("grants-payments-total");
  if (paymentsTotalEl) paymentsTotalEl.textContent = formatCurrency(unassignedTotal);
}

// ==========================================
// עריכת תכולת חבילת המענק (הוספת/הסרת מוצרים וחנויות, שינוי שם/כמות/מחיר)
// ==========================================
function renderGrantsPackageEditorHtml(groups) {
  const groupsHtml = (groups || []).map((group, gIdx) => `
    <div class="grants-pkg-group grants-pkg-group--editing">
      <div class="grants-pkg-edit-labels grants-pkg-edit-labels--group"><span>שם החנות</span><span>הנחה</span><span></span></div>
      <div class="grants-pkg-group-head-edit">
        <input type="text" class="ui-input" value="${escapeHtml(group.store || "")}" placeholder="שם חנות" data-input="pkg-group-field" data-g="${gIdx}" data-field="store">
        <input type="text" class="ui-input" value="${escapeHtml(group.discount || "")}" placeholder="הנחה (למשל 15%)" data-input="pkg-group-field" data-g="${gIdx}" data-field="discount">
        <button type="button" class="grants-archive-del" title="הסר חנות" data-click="pkg-remove-group" data-g="${gIdx}"><span class="material-icons-regular">close</span></button>
      </div>
      ${(group.items || []).length ? `<div class="grants-pkg-edit-labels"><span>מוצר</span><span>כמות לחתן</span><span>מחיר בחנות</span><span>עלות לארגון (ליחידה)</span><span></span></div>` : ""}
      ${(group.items || []).map((it, iIdx) => `
        <div class="grants-pkg-item-edit">
          <input type="text" class="ui-input" value="${escapeHtml(it.name || "")}" placeholder="שם מוצר" data-input="pkg-item-field" data-g="${gIdx}" data-i="${iIdx}" data-field="name">
          <input type="number" class="ui-input" value="${pkgQty(it)}" placeholder="כמות" min="0" data-input="pkg-item-field" data-g="${gIdx}" data-i="${iIdx}" data-field="qty">
          <input type="number" class="ui-input" value="${Number(it.storePrice) || 0}" placeholder="מחיר בחנות" min="0" step="0.01" data-input="pkg-item-field" data-g="${gIdx}" data-i="${iIdx}" data-field="storePrice">
          <input type="number" class="ui-input" value="${Number(it.orgPrice != null ? it.orgPrice : (it.value || 0))}" placeholder="עלות לארגון" min="0" step="0.01" data-input="pkg-item-field" data-g="${gIdx}" data-i="${iIdx}" data-field="orgPrice">
          <button type="button" class="grants-archive-del" title="הסר מוצר" data-click="pkg-remove-item" data-g="${gIdx}" data-i="${iIdx}"><span class="material-icons-regular">close</span></button>
        </div>`).join("")}
      <button type="button" class="grants-pkg-add-row-btn" data-click="pkg-add-item" data-g="${gIdx}"><span class="material-icons-regular">add</span> הוסף מוצר</button>
    </div>`).join("");

  return groupsHtml + `<button type="button" class="grants-pkg-add-row-btn grants-pkg-add-group-btn" data-click="pkg-add-group"><span class="material-icons-regular">add_business</span> הוסף חנות</button>`;
}

window.toggleGrantsPackageEditMode = function() {
  if (state.grantsPackageEditMode) {
    saveGrantsPackageEdit();
  } else {
    const archive = getGrantsArchive();
    const current = getGrantPackageForYear(archive, state.grantsArchiveYear);
    state.grantsPackageDraft = JSON.parse(JSON.stringify(current || []));
    state.grantsPackageEditMode = true;
    renderGrantsArchive();
  }
};

window.cancelGrantsPackageEdit = function() {
  state.grantsPackageEditMode = false;
  state.grantsPackageDraft = null;
  renderGrantsArchive();
};

function saveGrantsPackageEdit() {
  const year = state.grantsArchiveYear;
  const draft = JSON.parse(JSON.stringify(state.grantsPackageDraft || []));
  draft.forEach(group => (group.items || []).forEach(item => { item.value = (Number(item.orgPrice) || 0) * pkgQty(item); }));
  state.grantsPackageEditMode = false;
  state.grantsPackageDraft = null;
  const p = mutateGrantsArchive(archive => {
    if (!archive.years[year]) archive.years[year] = { recipients: [] };
    archive.years[year].package = JSON.parse(JSON.stringify(draft));
  });
  renderGrantsArchive();
  renderDashboard();
  p.then(saved => { reportSave(saved, "✅ תכולת המענק נשמרה"); logAudit("update", "grant-package", year, { stores: draft.length }); });
}

window.updateGrantsPkgGroupField = function(gIdx, field, value) {
  const group = state.grantsPackageDraft && state.grantsPackageDraft[gIdx];
  if (!group) return;
  group[field] = value;
};

window.updateGrantsPkgItemField = function(gIdx, iIdx, field, rawValue) {
  const item = state.grantsPackageDraft && state.grantsPackageDraft[gIdx] && state.grantsPackageDraft[gIdx].items[iIdx];
  if (!item) return;
  if (field === "name") { item.name = rawValue; return; }
  item[field] = Number(rawValue) || 0;
  // שומרים על value (עלות שורה לארגון) מסונכרן עם עלות ליחידה × כמות
  const qty = Number(item.qty) || 0;
  const orgPrice = Number(item.orgPrice) || 0;
  item.value = orgPrice * qty;
};

window.addGrantsPkgItem = function(gIdx) {
  const group = state.grantsPackageDraft && state.grantsPackageDraft[gIdx];
  if (!group) return;
  if (!Array.isArray(group.items)) group.items = [];
  group.items.push({ name: "", qty: 1, storePrice: 0, orgPrice: 0, value: 0 });
  renderGrantsArchive();
};

window.removeGrantsPkgItem = function(gIdx, iIdx) {
  const group = state.grantsPackageDraft && state.grantsPackageDraft[gIdx];
  if (!group || !group.items) return;
  group.items.splice(iIdx, 1);
  renderGrantsArchive();
};

window.addGrantsPkgGroup = function() {
  if (!state.grantsPackageDraft) state.grantsPackageDraft = [];
  state.grantsPackageDraft.push({ store: "", discount: "", items: [{ name: "", qty: 1, storePrice: 0, orgPrice: 0, value: 0 }] });
  renderGrantsArchive();
};

window.removeGrantsPkgGroup = function(gIdx) {
  if (!state.grantsPackageDraft) return;
  if (!confirm("להסיר את החנות הזו וכל המוצרים שבה מהעריכה?")) return;
  state.grantsPackageDraft.splice(gIdx, 1);
  renderGrantsArchive();
};

window.selectGrantsArchiveYear = function(year) {
  state.grantsArchiveYear = year;
  state.grantsPackageEditMode = false;
  state.grantsPackageDraft = null;
  toggleGrantsAddForm(false);
  renderGrantsArchive();
};

window.toggleGrantsAddForm = function(show) {
  const form = document.getElementById("grants-archive-add-form");
  if (!form) return;
  const willShow = (show === undefined) ? form.classList.contains("hidden") : show;
  form.classList.toggle("hidden", !willShow);
  if (!willShow) resetGrantsAddForm();
  if (willShow) {
    const nameEl = document.getElementById("grants-add-name");
    if (nameEl) nameEl.focus();
  }
};

// זהות קבועה לחתן ברשימה: מזהה פנימי אם יש, ואחרת התוכן עצמו (לרשומות ישנות)
function sameRecipient(a, b) {
  if (a.rid && b.rid) return a.rid === b.rid;
  return (a.name || "") === (b.name || "") && (a.id || "") === (b.id || "") && (a.phone || "") === (b.phone || "") && (a.date || "") === (b.date || "");
}

function readGrantsAddForm() {
  return {
    name: (document.getElementById("grants-add-name")?.value || "").trim(),
    id: (document.getElementById("grants-add-id")?.value || "").trim(),
    phone: (document.getElementById("grants-add-phone")?.value || "").trim(),
    date: (document.getElementById("grants-add-date")?.value || "").trim(),
  };
}

function resetGrantsAddForm() {
  ["grants-add-name", "grants-add-id", "grants-add-phone", "grants-add-date", "grants-edit-rid"].forEach(elId => { const el = document.getElementById(elId); if (el) el.value = ""; });
  const btn = document.getElementById("grants-add-submit");
  if (btn) btn.innerHTML = `<span class="material-icons-regular" style="font-size:15px;vertical-align:middle;">check</span> הוסף`;
  state.grantsEditingRecipient = null;
}

window.submitGrantsAddRecipient = function() {
  const f = readGrantsAddForm();
  if (!f.name && !f.id) {
    showToast("יש להזין לפחות שם או תעודת זהות", "danger");
    return;
  }
  const year = state.grantsArchiveYear;
  const rec = {};
  if (f.name) rec.name = f.name;
  if (f.id) rec.id = f.id;
  if (f.phone) rec.phone = f.phone;
  if (f.date) rec.date = f.date;
  const editing = state.grantsEditingRecipient;
  rec.rid = (editing && editing.rid) || generateId("R");

  const p = mutateGrantsArchive(archive => {
    if (!archive.years[year]) archive.years[year] = { recipients: [] };
    if (!Array.isArray(archive.years[year].recipients)) archive.years[year].recipients = [];
    const list = archive.years[year].recipients;
    const idx = editing ? list.findIndex(r => sameRecipient(r, editing)) : -1;
    if (idx !== -1) list[idx] = { ...rec };
    else if (!list.some(r => r.rid === rec.rid)) list.push({ ...rec });
  });
  resetGrantsAddForm();
  if (editing) toggleGrantsAddForm(false);
  renderGrantsArchive();
  renderDashboard();
  p.then(saved => {
    reportSave(saved, editing ? "✅ פרטי החתן עודכנו" : "✅ החתן נוסף לרשימת מקבלי המענק");
    logAudit(editing ? "update" : "create", "grant-recipient", rec.rid, { year, name: rec.name || "", id: rec.id || "" });
  });
};

window.editGrantsArchiveRecipient = function(index) {
  const archive = getGrantsArchive();
  const year = state.grantsArchiveYear;
  const r = archive.years[year] && archive.years[year].recipients && archive.years[year].recipients[index];
  if (!r) return;
  state.grantsEditingRecipient = JSON.parse(JSON.stringify(r));
  toggleGrantsAddForm(true);
  setValue("grants-add-name", r.name || "");
  setValue("grants-add-id", r.id || "");
  setValue("grants-add-phone", r.phone || "");
  setValue("grants-add-date", toDateInputValue(r.date) || "");
  const btn = document.getElementById("grants-add-submit");
  if (btn) btn.innerHTML = `<span class="material-icons-regular" style="font-size:15px;vertical-align:middle;">save</span> שמור שינויים`;
};

window.removeGrantsArchiveRecipient = function(index) {
  const archive = getGrantsArchive();
  const year = state.grantsArchiveYear;
  const list = archive.years[year] && archive.years[year].recipients;
  if (!list || !list[index]) return;
  const target = JSON.parse(JSON.stringify(list[index]));
  const label = target.name || target.id || "רשומה זו";
  if (!confirm(`להסיר את ${label} מרשימת מקבלי המענק לשנת ${year}?`)) return;
  const p = mutateGrantsArchive(a => {
    const l = a.years[year] && a.years[year].recipients;
    if (!l) return;
    const i = l.findIndex(r => sameRecipient(r, target));
    if (i !== -1) l.splice(i, 1);
  });
  renderGrantsArchive();
  renderDashboard();
  p.then(saved => { reportSave(saved, "הרשומה הוסרה"); logAudit("delete", "grant-recipient", target.rid || target.id || "", { year, name: target.name || "", id: target.id || "" }); });
};

window.addGrantsArchiveYear = function() {
  const archive = getGrantsArchive();
  const existing = Object.keys(archive.years);
  // הצעה: השנה העברית הנוכחית, ואם כבר קיימת - השנה שאחרי האחרונה ברשימה
  const latestIdx = Math.max(-1, ...existing.map(y => HEBREW_YEARS_ORDER.indexOf(y)));
  const options = HEBREW_YEARS_ORDER.filter((y, i) => i > latestIdx && !existing.includes(y)).slice(0, 3);
  const current = getCurrentHebrewYearLabel();
  const suggested = current && !existing.includes(current) ? current : (options[0] || "");
  const promptText = `הזן את שם השנה החדשה (לדוגמה: ${suggested || 'תשפ"ז'})${options.length ? "\nהשנים הבאות: " + options.join(", ") : ""}`;
  const input = prompt(promptText, suggested);
  if (input === null) return;
  const year = input.trim();
  if (!year) return;
  if (getGrantsArchive().years[year]) { state.grantsArchiveYear = year; renderGrantsArchive(); showToast("השנה כבר קיימת - עברת אליה", "danger"); return; }
  state.grantsArchiveYear = year;
  const p = mutateGrantsArchive(a => { if (!a.years[year]) a.years[year] = { recipients: [] }; });
  renderGrantsArchive();
  toggleGrantsAddForm(true);
  p.then(saved => { reportSave(saved, `נוספה שנת ${year} - הוסף כעת מקבלי מענק`); logAudit("create", "grant-year", year); });
};

window.exportGrantsArchiveRecipients = function() {
  exportToCSV("grants-archive-recipients-tbody", `מקבלי_מענק_${(state.grantsArchiveYear || "").replace(/"/g, "")}`);
};


// ==========================================
// תשלומים לחנויות לפי מחצית (מחצית א' = תשרי–אדר, מחצית ב' = ניסן–אלול)
// לכל חנות: סכום לתשלום לפי הקבלות, אישור ששולם, וקבלה סרוקה.
// ==========================================
state.billsHalf = state.billsHalf || "א";

window.switchBillsHalf = function(half) {
  state.billsHalf = half === "ב" ? "ב" : "א";
  document.querySelectorAll("#bills-half-toggle .grants-view-btn").forEach(b => b.classList.toggle("active", b.dataset.half === state.billsHalf));
  renderStoreBills(getGrantsArchive(), state.grantsArchiveYear);
};

function getStoreBills(archive, year) {
  const y = archive.years && archive.years[year];
  return (y && Array.isArray(y.storeBills)) ? y.storeBills : [];
}

// ===== תשלומים מהשיטה הקודמת: שיוך למחצית =====
// תשלום שנרשם באדר שייך למחצית א' (תשרי-אדר), ותשלום באלול למחצית ב' (ניסן-אלול).
// אפשר לשנות ידנית בכפתור "שיוך"; הבחירה נשמרת ב-years[year].legacyHalves
function legacyPaymentKey(p) {
  return [p.store, p.date, p.amount, p.description].map(x => String(x == null ? "" : x).trim()).join("|");
}

function guessLegacyPaymentHalf(p, year) {
  const text = String(p.date || "").trim();
  if (!text) return null;
  const yearInText = (text.match(/תש[א-ת]*["״][א-ת]/) || [])[0];
  if (yearInText && yearInText.replace("״", '"') !== year) return null;
  if (/אדר/.test(text)) return "א";
  if (/אלול/.test(text)) return "ב";
  const d = parseAppDate(text);
  const parts = d ? getHebrewDateParts(d) : null;
  if (!parts || parts.year !== hebrewYearLabelToNumber(year)) return null;
  if (/^Adar/.test(parts.month)) return "א";
  if (parts.month === "Elul") return "ב";
  return null;
}

function getLegacyPaymentHalf(archive, year, p) {
  const saved = (archive.years && archive.years[year] && archive.years[year].legacyHalves) || {};
  const choice = saved[legacyPaymentKey(p)];
  if (choice === "א" || choice === "ב") return choice;
  if (choice === "none") return null;
  return guessLegacyPaymentHalf(p, year);
}

// שם החנות בתשלום הישן לפי שם החנות בחבילה ("אווניו 13 ביתר" -> "אווניו 13")
function matchLegacyStoreName(name, storeNames) {
  const n = String(name || "").trim();
  if (storeNames.includes(n)) return n;
  const hits = storeNames.filter(s => s && (n.startsWith(s) || s.startsWith(n)));
  return hits.sort((a, b) => b.length - a.length)[0] || n;
}

function getLegacyBillsForHalf(archive, year, half, storeNames) {
  return getGrantPaymentsForYear(archive, year)
    .filter(p => getLegacyPaymentHalf(archive, year, p) === half)
    .map(p => ({ legacy: true, key: legacyPaymentKey(p), store: matchLegacyStoreName(p.store, storeNames), originalStore: p.store,
      amount: Number(p.amount) || 0, reference: p.description || "", paid: true, legacyDate: p.date || "", method: p.method || "" }));
}

window.openLegacyAssign = function(key) {
  if (!canEditUser()) { showToast("אין לך הרשאת עריכה", "warning"); return; }
  const archive = getGrantsArchive();
  const year = state.grantsArchiveYear;
  const p = getGrantPaymentsForYear(archive, year).find(x => legacyPaymentKey(x) === key);
  if (!p) return;
  state.legacyAssignKey = key;
  setText("legacy-assign-desc", `${p.store || ""} · ${p.date || ""} · ${formatCurrency(p.amount)}${p.description ? ` · ${p.description}` : ""}`);
  const current = getLegacyPaymentHalf(archive, year, p);
  document.querySelectorAll("#legacy-assign-modal [data-half]").forEach(b => b.classList.toggle("active", (b.dataset.half === "none" ? null : b.dataset.half) === current));
  document.getElementById("legacy-assign-modal").classList.add("open");
};

window.closeLegacyAssign = function() { document.getElementById("legacy-assign-modal").classList.remove("open"); };

window.saveLegacyAssign = function(choice) {
  const key = state.legacyAssignKey;
  const year = state.grantsArchiveYear;
  if (!key || !year) return;
  closeLegacyAssign();
  const p = mutateGrantsArchive(a => {
    if (!a.years[year]) a.years[year] = { recipients: [] };
    a.years[year].legacyHalves = { ...(a.years[year].legacyHalves || {}), [key]: choice };
  });
  if (choice === "א" || choice === "ב") { state.billsHalf = choice; }
  renderGrantsArchive();
  const label = choice === "none" ? "הרשומה חזרה לרשימת התשלומים הישנים" : `התשלום שויך למחצית ${choice}'`;
  p.then(saved => { reportSave(saved, label); logAudit("update", "store-bill", key, { שנה: year, שיוך: choice === "none" ? "ללא" : `מחצית ${choice}` }); });
};

// עלות לארגון לחתן בכל חנות, לפי תכולת החבילה של השנה
function getStoreCostPerGroom(archive, year) {
  const map = {};
  getGrantPackageForYear(archive, year).forEach(group => {
    const store = String(group.store || "").trim();
    if (!store) return;
    const cost = (group.items || []).reduce((sum, it) => sum + (it.value != null ? Number(it.value) || 0 : (Number(it.orgPrice) || 0) * pkgQty(it)), 0);
    map[store] = (map[store] || 0) + cost;
  });
  return map;
}

// כמה חתנים קיבלו מענק בכל מחצית של השנה (לפי התאריך שלהם)
function countGroomsByHalf(archive, year) {
  const yearNum = hebrewYearLabelToNumber(year);
  const counts = { "א": 0, "ב": 0, none: 0 };
  ((archive.years[year] && archive.years[year].recipients) || []).forEach(r => {
    const d = parseAppDate(r.date);
    const parts = d ? getHebrewDateParts(d) : null;
    if (!d || !parts || (yearNum && parts.year !== yearNum)) { counts.none++; return; }
    counts[getHalfForDate(d)]++;
  });
  return counts;
}

function renderStoreBills(archive, year) {
  const tbody = document.getElementById("store-bills-tbody");
  if (!tbody || !year) return;
  const half = state.billsHalf || "א";
  document.querySelectorAll("#bills-half-toggle .grants-view-btn").forEach(b => b.classList.toggle("active", b.dataset.half === half));
  const costPerGroom = getStoreCostPerGroom(archive, year);
  const bills = [...getStoreBills(archive, year).filter(b => b.half === half), ...getLegacyBillsForHalf(archive, year, half, Object.keys(costPerGroom))];
  const grooms = countGroomsByHalf(archive, year);
  const groomsInHalf = grooms[half];

  // שורה לכל חנות מהחבילה, גם אם עוד לא הוזן לה חיוב במחצית הזו
  const storeNames = [...new Set([...Object.keys(costPerGroom), ...bills.map(b => b.store)])];
  const rows = [];
  storeNames.forEach(store => {
    const storeBills = bills.filter(b => b.store === store);
    if (storeBills.length) storeBills.forEach((b, i) => rows.push({ store, bill: b, first: i === 0 }));
    else rows.push({ store, bill: null, first: true });
  });

  const datalist = document.getElementById("store-names-datalist");
  if (datalist) datalist.innerHTML = [...new Set([...storeNames, ...getStoreBills(archive, year).map(b => b.store)])].map(n => `<option value="${escapeHtml(n)}"></option>`).join("");

  const canEdit = canEditUser();
  tbody.innerHTML = rows.length ? rows.map(({ store, bill, first }) => {
    const expected = first && costPerGroom[store] && groomsInHalf ? costPerGroom[store] * groomsInHalf : null;
    const status = !bill
      ? `<span class="bill-status bill-status--empty">טרם הוזן חיוב</span>`
      : bill.legacy
        ? `<span class="bill-status bill-status--paid">שולם · ${escapeHtml(bill.legacyDate || "")}${bill.method ? ` · ${escapeHtml(bill.method)}` : ""}</span><div class="bill-notes">נרשם בשיטה הקודמת${bill.originalStore && bill.originalStore !== bill.store ? ` (${escapeHtml(bill.originalStore)})` : ""}</div>`
      : bill.paid
        ? `<span class="bill-status bill-status--paid">שולם${bill.paidDate ? ` ב-${escapeHtml(formatDateDisplay(bill.paidDate))}` : ""}${bill.method ? ` · ${escapeHtml(bill.method)}` : ""}</span>`
        : `<span class="bill-status bill-status--due">ממתין לתשלום</span>`;
    const receipt = bill && bill.receipt && bill.receipt.path
      ? `<button type="button" class="bill-receipt-link" data-click="receipt-view" data-bid="${escapeHtml(bill.bid)}"><span class="material-icons-regular">attach_file</span> צפייה</button>`
      : `<span style="color:var(--text-muted);">—</span>`;
    const action = !canEdit ? "" : bill && bill.legacy
      ? `<button type="button" class="btn btn-outline bill-row-btn" data-click="legacy-assign-open" data-key="${escapeHtml(bill.key)}">שיוך</button>`
      : bill
      ? `<button type="button" class="btn btn-outline bill-row-btn" data-click="store-bill-open" data-bid="${escapeHtml(bill.bid)}">עריכה</button>`
      : `<button type="button" class="btn btn-outline bill-row-btn" data-click="store-bill-open" data-store="${escapeHtml(store)}">הזן חיוב</button>`;
    return `<tr class="${bill && bill.paid ? "bill-row--paid" : ""}">
      <td style="font-weight:700;">${escapeHtml(store)}</td>
      <td class="amount-cell" style="color:var(--text-secondary);">${expected !== null ? formatCurrency(expected) : "—"}</td>
      <td class="amount-cell" style="font-weight:800;">${bill ? formatCurrency(bill.amount) : "—"}</td>
      <td>${bill && bill.reference ? escapeHtml(bill.reference) : "—"}</td>
      <td>${status}${bill && bill.notes ? `<div class="bill-notes">${escapeHtml(bill.notes)}</div>` : ""}</td>
      <td class="no-export">${receipt}</td>
      <td class="no-export">${action}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="7"><div class="empty-state" style="padding:28px 12px;">אין עדיין חנויות בתכולת המענק לשנה זו. אפשר להוסיף תשלום לחנות בכפתור למטה</div></td></tr>`;

  const totalDue = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const totalExpected = Object.values(costPerGroom).reduce((s, c) => s + c, 0) * groomsInHalf;
  const tfoot = document.getElementById("store-bills-tfoot");
  if (tfoot) tfoot.innerHTML = `<tr class="table-total-row">
      <td>סה"כ מחצית ${half}'</td>
      <td class="amount-cell">${totalExpected ? formatCurrency(totalExpected) : "—"}</td>
      <td class="amount-cell">${formatCurrency(totalDue)}</td>
      <td></td>
      <td>שולם ${formatCurrency(totalPaid)} · נשאר ${formatCurrency(Math.max(0, totalDue - totalPaid))}</td>
      <td class="no-export"></td><td class="no-export"></td>
    </tr>`;

  const statsEl = document.getElementById("store-bills-stats");
  if (statsEl) statsEl.innerHTML = [
    { icon: "receipt_long", label: `לתשלום במחצית ${half}' (לפי קבלות)`, value: formatCurrency(totalDue), tone: "gold" },
    { icon: "task_alt", label: "שולם", value: formatCurrency(totalPaid), tone: "success" },
    { icon: "pending_actions", label: "נשאר לשלם", value: formatCurrency(Math.max(0, totalDue - totalPaid)), tone: "info" },
  ].map(x => `<div class="grants-archive-stat ${x.tone}"><span class="material-icons-regular">${x.icon}</span><div><div class="grants-archive-stat-label">${x.label}</div><div class="grants-archive-stat-value">${x.value}</div></div></div>`).join("");

  const foot = document.getElementById("store-bills-footnote");
  if (foot) foot.textContent = `"צפי לפי חתנים" = ${groomsInHalf} חתנים שקיבלו מענק במחצית הזו × עלות החבילה בכל חנות. בפועל משלמים לפי הקבלות, ולכן הסכום בדרך כלל נמוך יותר (תלושים שלא מומשו).${grooms.none ? ` ${grooms.none} חתנים בלי תאריך בשנה הזו לא נכללו בצפי.` : ""}`;
}

let storeBillFileCleared = false;

window.openStoreBillModal = function(billId, storeName = "") {
  if (!canEditUser()) { showToast("אין לך הרשאת עריכה", "warning"); return; }
  const archive = getGrantsArchive();
  const year = state.grantsArchiveYear;
  const bill = billId ? getStoreBills(archive, year).find(b => b.bid === billId) : null;
  storeBillFileCleared = false;
  setValue("store-bill-id", bill ? bill.bid : "");
  setValue("store-bill-store", bill ? bill.store : storeName);
  setValue("store-bill-half", bill ? bill.half : (state.billsHalf || "א"));
  setValue("store-bill-amount", bill ? bill.amount : "");
  setValue("store-bill-ref", bill ? (bill.reference || "") : "");
  setValue("store-bill-notes", bill ? (bill.notes || "") : "");
  const paid = document.getElementById("store-bill-paid");
  if (paid) paid.checked = !!(bill && bill.paid);
  setValue("store-bill-paid-date", bill && bill.paidDate ? toDateInputValue(bill.paidDate) : getTodayIsoDate());
  setValue("store-bill-method", bill && bill.method ? bill.method : "העברה");
  const file = document.getElementById("store-bill-file");
  if (file) file.value = "";
  renderStoreBillReceiptCurrent(bill);
  updateStoreBillPaidFields();
  setText("store-bill-title", bill ? `תשלום ל${bill.store} · ${year}` : `תשלום לחנות · ${year}`);
  setText("store-bill-meta", bill && bill.updatedBy ? `עודכן ע"י ${bill.updatedBy}${bill.updatedAt ? ` ב-${formatDateDisplay(bill.updatedAt)}` : ""}` : "");
  const del = document.getElementById("store-bill-delete");
  if (del) del.style.display = bill ? "" : "none";
  document.getElementById("store-bill-modal").classList.add("open");
};

window.closeStoreBillModal = function() { document.getElementById("store-bill-modal").classList.remove("open"); };

function updateStoreBillPaidFields() {
  const paid = document.getElementById("store-bill-paid");
  const box = document.getElementById("store-bill-paid-fields");
  if (box && paid) box.style.display = paid.checked ? "" : "none";
}

function renderStoreBillReceiptCurrent(bill) {
  const el = document.getElementById("store-bill-receipt-current");
  if (!el) return;
  if (bill && bill.receipt && bill.receipt.path && !storeBillFileCleared) {
    el.innerHTML = `<span class="material-icons-regular">attach_file</span> ${escapeHtml(bill.receipt.name || "קבלה")}
      <button type="button" class="bill-receipt-link" data-click="receipt-view" data-bid="${escapeHtml(bill.bid)}">צפייה</button>
      <button type="button" class="bill-receipt-link bill-receipt-remove" data-click="receipt-clear">הסר</button>`;
  } else {
    el.innerHTML = `<span style="color:var(--text-muted);">לא צורפה קבלה</span>`;
  }
}

window.clearStoreBillReceipt = function() {
  storeBillFileCleared = true;
  const bid = getValue("store-bill-id");
  renderStoreBillReceiptCurrent(getStoreBills(getGrantsArchive(), state.grantsArchiveYear).find(b => b.bid === bid));
};

window.viewStoreBillReceipt = async function(billId) {
  const bill = getStoreBills(getGrantsArchive(), state.grantsArchiveYear).find(b => b.bid === billId);
  if (!bill || !bill.receipt || !bill.receipt.path) return;
  const win = window.open("", "_blank");
  try {
    const url = await SB.receiptUrl(bill.receipt.path);
    if (win) win.location.href = url; else window.location.href = url;
  } catch (e) {
    if (win) win.close();
    showToast(receiptErrorMessage(e), "danger");
  }
};

function receiptErrorMessage(e) {
  const msg = String((e && e.message) || "");
  if (/Failed to fetch|NetworkError|Load failed/.test(msg)) return "אין חיבור לשרת. העלאה וצפייה בקבלות דורשות חיבור לאינטרנט";
  if (e && (e.status === 400 || e.status === 403 || e.status === 404) && /bucket|Bucket|not found|policy/i.test(msg)) return "תיקיית הקבלות עוד לא הוגדרה בשרת. צריך להריץ פעם אחת את הקובץ supabase/security-update.sql ב-Supabase";
  if (e && e.status === 413) return "הקובץ גדול מדי (עד 10MB)";
  return `פעולת הקבלה נכשלה: ${msg || "שגיאה"}`;
}

window.saveStoreBill = async function() {
  const year = state.grantsArchiveYear;
  const bid = getValue("store-bill-id") || generateId("B");
  const existing = getStoreBills(getGrantsArchive(), year).find(b => b.bid === bid) || null;
  const store = getValue("store-bill-store").trim();
  const amount = parseAmount(getValue("store-bill-amount"));
  if (!store) { showToast("יש להזין שם חנות", "danger"); return; }
  if (amount === null) { showToast("יש להזין סכום לתשלום גדול מ-0", "danger"); return; }
  const paid = !!document.getElementById("store-bill-paid")?.checked;
  const fileInput = document.getElementById("store-bill-file");
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (file && file.size > 10 * 1024 * 1024) { showToast("הקובץ גדול מדי (עד 10MB)", "danger"); return; }

  const saveBtn = document.getElementById("store-bill-save");
  saveBtn.disabled = true; saveBtn.textContent = file ? "מעלה קבלה..." : "שומר...";
  let receipt = existing && existing.receipt && !storeBillFileCleared ? existing.receipt : null;
  const oldPath = existing && existing.receipt && existing.receipt.path;
  try {
    if (file) {
      const ext = ((file.name.match(/\.([a-z0-9]{1,5})$/i) || [])[1] || "bin").toLowerCase();
      const path = `bills/${bid.replace(/[^A-Za-z0-9-]/g, "")}-${Date.now()}.${ext}`;
      await SB.uploadReceipt(path, file);
      receipt = { path, name: file.name, size: file.size, uploadedAt: new Date().toISOString() };
      logAudit("upload", "store-bill", bid, { store, file: file.name });
    }
  } catch (e) {
    showToast(receiptErrorMessage(e), "danger");
    saveBtn.disabled = false; saveBtn.textContent = "שמור";
    return;
  }

  const bill = {
    bid, store, half: getValue("store-bill-half") === "ב" ? "ב" : "א", amount,
    reference: getValue("store-bill-ref").trim(), notes: getValue("store-bill-notes").trim(),
    paid, paidDate: paid ? (getValue("store-bill-paid-date") || getTodayIsoDate()) : "", method: paid ? getValue("store-bill-method") : "",
    receipt, createdAt: existing ? existing.createdAt : new Date().toISOString(), createdBy: existing ? existing.createdBy : (state.currentUser || ""),
    updatedAt: new Date().toISOString(), updatedBy: state.currentUser || "",
  };
  const p = mutateGrantsArchive(archive => {
    if (!archive.years[year]) archive.years[year] = { recipients: [] };
    if (!Array.isArray(archive.years[year].storeBills)) archive.years[year].storeBills = [];
    const list = archive.years[year].storeBills;
    const i = list.findIndex(b => b.bid === bid);
    if (i === -1) list.push({ ...bill }); else list[i] = { ...bill };
  });
  state.billsHalf = bill.half;
  closeStoreBillModal();
  renderGrantsArchive();
  saveBtn.disabled = false; saveBtn.textContent = "שמור";
  const saved = await p;
  reportSave(saved, existing ? "✅ התשלום עודכן" : "✅ התשלום לחנות נשמר");
  logAudit(existing ? "update" : "create", "store-bill", bid, { year, half: bill.half, store, amount, paid, reference: bill.reference });
  if (existing && existing.paid !== paid && paid) logAudit("paid", "store-bill", bid, { store, amount, method: bill.method, date: bill.paidDate });
  if (oldPath && (!receipt || receipt.path !== oldPath) && saved) SB.deleteReceipt(oldPath).catch(() => {});
};

window.deleteStoreBill = async function() {
  const year = state.grantsArchiveYear;
  const bid = getValue("store-bill-id");
  const bill = getStoreBills(getGrantsArchive(), year).find(b => b.bid === bid);
  if (!bill) return;
  if (!confirm(`למחוק את התשלום ל${bill.store} על סך ${formatCurrency(bill.amount)}?`)) return;
  const p = mutateGrantsArchive(archive => {
    const list = archive.years[year] && archive.years[year].storeBills;
    if (!list) return;
    const i = list.findIndex(b => b.bid === bid);
    if (i !== -1) list.splice(i, 1);
  });
  closeStoreBillModal();
  renderGrantsArchive();
  const saved = await p;
  reportSave(saved, "התשלום נמחק");
  logAudit("delete", "store-bill", bid, { year, store: bill.store, amount: bill.amount });
  if (saved && bill.receipt && bill.receipt.path) SB.deleteReceipt(bill.receipt.path).catch(() => {});
};



// מפתח קבוע לכל קבוצת פורים, כדי שכפתורים יעבדו גם כשבשם העיר/הקבוצה יש גרש או גרשיים
const purimGroupRegistry = new Map();
function getPurimGroup(key) { return purimGroupRegistry.get(key) || null; }
function getPurimRowsFor(city, group) {
    return (state.purimAddresses || []).filter(row =>
        String(row["עיר"] || "ללא עיר").trim() === city && String(row["קבוצה"] || "ללא שיוך").trim() === group);
}
function getPurimYearsToShow() {
    const currentYear = getCampaignYear();
    let currentIdx = HEBREW_YEARS_ORDER.indexOf(currentYear);
    if (currentIdx === -1) currentIdx = HEBREW_YEARS_ORDER.indexOf('תשפ"ו');
    const allYears = HEBREW_YEARS_ORDER.slice(Math.max(0, currentIdx - 7), currentIdx + 1);
    return state.purimShowAllYears ? allYears : allYears.slice(-4);
}

function renderPurimGroups() {
    const container = document.getElementById("purim-tabs-container"); 
    if (!container) return;
    container.innerHTML = ""; 
    purimGroupRegistry.clear();

    const currentYear = getCampaignYear();
    const yearsToShow = getPurimYearsToShow();

    const citiesMap = state.purimAddresses.reduce((acc, row) => {
        const city = String(row["עיר"] || "ללא עיר").trim();
        const group = String(row["קבוצה"] || "ללא שיוך").trim();
        if (!acc[city]) acc[city] = {};
        if (!acc[city][group]) acc[city][group] = [];
        acc[city][group].push(row);
        return acc;
    }, {});

    // שומרים על העיר והקבוצה שנבחרו גם אחרי רענון התצוגה
    const active = state.purimActive || {};
    const activeCity = citiesMap[active.city] ? active.city : Object.keys(citiesMap)[0];

    const citiesNav = document.createElement("div");
    citiesNav.className = "purim-cities-nav";
    citiesNav.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; overflow-x: auto;";

    const groupsNavContainer = document.createElement("div");
    groupsNavContainer.className = "purim-groups-nav-container";

    const contentContainer = document.createElement("div");
    contentContainer.className = "purim-content-container";

    let groupCounter = 0;

    for (const [cityName, groups] of Object.entries(citiesMap)) {
        const isActiveCity = cityName === activeCity;
        const cityBtn = document.createElement("button");
        cityBtn.className = `btn ${isActiveCity ? "btn-solid-blue" : "btn-outline"}`;
        cityBtn.innerText = cityName;

        const groupNav = document.createElement("div");
        groupNav.className = "purim-groups-nav";
        groupNav.style.cssText = `display: ${isActiveCity ? "flex" : "none"};`;

        const cityContent = document.createElement("div");
        cityContent.className = "purim-city-content";
        cityContent.style.cssText = `display: ${isActiveCity ? "block" : "none"};`;

        const activeGroup = isActiveCity && groups[active.group] ? active.group : Object.keys(groups)[0];

        for (const [groupName, addresses] of Object.entries(groups)) {
            const key = `pg${++groupCounter}`;
            purimGroupRegistry.set(key, { city: cityName, group: groupName });
            const isActiveGroup = groupName === activeGroup;

            const groupBtn = document.createElement("button");
            groupBtn.className = `purim-tab-btn ${isActiveGroup ? "active" : ""}`;
            groupBtn.innerText = `${groupName} (${addresses.length})`; 
            
            const groupPane = document.createElement("div");
            groupPane.className = `purim-tab-pane ${isActiveGroup ? "active" : ""}`;
            groupPane.dataset.groupKey = key;

            // --- אזור הסכומים (תצוגה בלבד - העריכה בהגדרות המערכת) ---
            let sumsInner = "";
            yearsToShow.forEach(y => {
                const manualSum = (state.settings.purimManualSums && state.settings.purimManualSums[groupName] && state.settings.purimManualSums[groupName][y]) || "";
                sumsInner += `
                    <div style="display:flex; flex-direction:column; align-items:center; padding: 4px 10px; border-radius: 6px; background:transparent; border: 1px solid var(--border-color); min-width:80px;">
                        <span style="font-size:11px; color:var(--text-secondary); margin-bottom:2px;">${escapeHtml(y)}</span>
                        <span style="font-size:14px; font-weight:800; color:var(--text-main);" class="sum-text">${manualSum ? formatCurrency(manualSum) : "---"}</span>
                    </div>`;
            });

            const topBar = `
                <div class="purim-group-toolbar" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:var(--surface-light); padding:7px 12px; border-radius:8px; margin-bottom:10px; border:1px solid var(--border-color);">
                    <span style="font-size:11px; font-weight:700; color:var(--text-muted); white-space:nowrap; text-transform:uppercase; letter-spacing:0.4px;">סכומים סופיים</span>
                    <div class="purim-sums-display" style="display:flex; gap:6px; flex-wrap:wrap; flex:1; overflow-x:auto;">${sumsInner}</div>
                    <div class="purim-group-actions" style="display:flex; gap:5px; flex-shrink:0; align-items:center; flex-wrap:wrap;">
                        <button type="button" class="purim-action-btn purim-edit-btn" data-click="purim-edit" data-key="${key}">
                            <span class="material-icons-regular" style="font-size:14px;">edit</span> מצב עריכה
                        </button>
                        <button type="button" class="purim-action-btn purim-cancel-btn" data-click="purim-cancel" data-key="${key}" style="display:none; border-color:#dc2626; color:#dc2626;">
                            <span class="material-icons-regular" style="font-size:14px;">close</span> ביטול
                        </button>
                        <button type="button" class="purim-action-btn purim-save-btn" data-click="purim-edit" data-key="${key}" style="display:none; border-color:#16a34a; color:#15803d; background:#f0fdf4;">
                            <span class="material-icons-regular" style="font-size:14px;">save</span> שמור
                        </button>
                        <button type="button" class="purim-action-btn" data-click="purim-print" data-key="${key}" title="הדפסה">
                            <span class="material-icons-regular" style="font-size:14px;">print</span>
                        </button>
                        <button type="button" class="purim-action-btn" data-click="purim-export" data-key="${key}" title="הורדה לאקסל">
                            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#217346"/><path d="M13 6h6v2h-6V6zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z" fill="#fff" opacity=".6"/><path d="M5 6l3 5-3 5h2.5l1.8-3.2L11 16h2.5l-3-5 3-5H11L9.3 9.2 7.5 6H5z" fill="#fff"/></svg>
                        </button>
                        <button type="button" class="purim-action-btn" data-click="purim-spacing" data-key="${key}">
                            <span class="material-icons-regular" style="font-size:14px;">density_large</span> רווח
                        </button>
                        <button type="button" class="purim-action-btn" data-click="purim-years">
                            <span class="material-icons-regular" style="font-size:14px;">${state.purimShowAllYears ? 'unfold_less' : 'unfold_more'}</span>
                            ${state.purimShowAllYears ? 'פחות שנים' : 'כל השנים'}
                        </button>
                    </div>
                </div>
            `;

            let tableHtml = `
                <div class="table-container">
                    <table class="data-table compact-view" data-export-id="${key}">
                        <thead>
                            <tr>
                                <th>מס'</th>
                                <th>משפחה</th>
                                <th>שם</th>
                                <th>רחוב</th>
                                <th>מספר</th>
                                <th>דירה</th>
            `;
            
            yearsToShow.forEach(y => {
                if (y === currentYear) {
                    tableHtml += `<th>${escapeHtml(y)}</th>`;
                } else {
                    tableHtml += `<th style="color: var(--text-secondary);">${escapeHtml(y)}</th>`;
                }
            });

            tableHtml += `
                                <th>הערות</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            const td = (rowIdx, row, field, isBold=false, extraStyle="") => {
                const val = escapeHtml(row[field] || "");
                const bold1 = isBold ? "<strong>" : "";
                const bold2 = isBold ? "</strong>" : "";
                return `<td data-row="${rowIdx}" data-field="${escapeHtml(field)}" style="transition: all 0.3s; ${extraStyle}">${bold1}${val}${bold2}</td>`;
            };

            addresses.forEach(row => {
                const rowIdx = state.purimAddresses.indexOf(row);
                tableHtml += `
                    <tr>
                        <td>${escapeHtml(row["מס'"] || "")}</td>
                        ${td(rowIdx, row, "משפחה", true)}
                        ${td(rowIdx, row, "שם")}
                        ${td(rowIdx, row, "רחוב")}
                        ${td(rowIdx, row, "מספר")}
                        ${td(rowIdx, row, "דירה")}
                `;
                
                yearsToShow.forEach(y => {
                    if (y === currentYear) {
                        tableHtml += td(rowIdx, row, y, false, "color: var(--gold-dark); font-weight: bold; background: rgba(212, 175, 55, 0.05);");
                    } else {
                        tableHtml += td(rowIdx, row, y, false, "color: var(--text-secondary);");
                    }
                });

                tableHtml += `
                        ${td(rowIdx, row, "הערות")}
                    </tr>
                `;
            });

            tableHtml += `</tbody></table></div>`;
            groupPane.innerHTML = topBar + tableHtml;

            groupBtn.addEventListener("click", () => {
                groupNav.querySelectorAll(".purim-tab-btn").forEach(b => b.classList.remove("active"));
                cityContent.querySelectorAll(".purim-tab-pane").forEach(p => p.classList.remove("active"));
                groupBtn.classList.add("active");
                groupPane.classList.add("active");
                state.purimActive = { city: cityName, group: groupName };
            });

            groupNav.appendChild(groupBtn);
            cityContent.appendChild(groupPane);
        }

        cityBtn.addEventListener("click", () => {
            citiesNav.querySelectorAll(".btn").forEach(b => {
                b.classList.remove("btn-solid-blue");
                b.classList.add("btn-outline");
            });
            cityBtn.classList.remove("btn-outline");
            cityBtn.classList.add("btn-solid-blue");

            groupsNavContainer.querySelectorAll(".purim-groups-nav").forEach(n => n.style.display = "none");
            contentContainer.querySelectorAll(".purim-city-content").forEach(c => c.style.display = "none");

            groupNav.style.display = "flex";
            cityContent.style.display = "block";
            const activePane = cityContent.querySelector(".purim-tab-pane.active");
            const g = activePane && getPurimGroup(activePane.dataset.groupKey);
            state.purimActive = { city: cityName, group: g ? g.group : "" };
        });

        citiesNav.appendChild(cityBtn);
        groupsNavContainer.appendChild(groupNav);
        contentContainer.appendChild(cityContent);
    }

    container.appendChild(citiesNav);
    container.appendChild(groupsNavContainer);
    container.appendChild(contentContainer);
}

let purimEditSnapshot = null;

function getPurimPane(key) { return document.querySelector(`.purim-tab-pane[data-group-key="${key}"]`); }

window.togglePurimGroupEdit = async function(key) {
    const g = getPurimGroup(key);
    const pane = getPurimPane(key);
    const table = pane && pane.querySelector("table");
    if (!g || !table) return;
    state.purimActive = { city: g.city, group: g.group };
    const setButtons = (editing) => {
        pane.querySelector(".purim-edit-btn").style.display = editing ? "none" : "";
        pane.querySelector(".purim-save-btn").style.display = editing ? "" : "none";
        pane.querySelector(".purim-cancel-btn").style.display = editing ? "" : "none";
    };

    if (!table.classList.contains("editing-mode")) {
        purimEditSnapshot = JSON.parse(JSON.stringify(state.purimAddresses));
        table.classList.add("editing-mode");
        setButtons(true);
        table.querySelectorAll("td[data-field]").forEach(td => {
            td.setAttribute("contenteditable", "true");
            td.style.background = "#ffffff";
            td.style.border = "1px solid var(--gold-main)";
        });
        return;
    }

    const saveBtn = pane.querySelector(".purim-save-btn");
    saveBtn.disabled = true;
    const changedRows = [];
    table.querySelectorAll("tbody tr").forEach(tr => {
        const tds = tr.querySelectorAll("td[data-field]");
        if (!tds.length) return;
        const currentRow = state.purimAddresses[Number(tds[0].getAttribute("data-row"))];
        if (!currentRow) return;
        let rowChanged = false;
        tds.forEach(td => {
            const field = td.getAttribute("data-field");
            const newVal = (td.innerText || "").trim();
            if (String(currentRow[field] || "").trim() !== newVal) { currentRow[field] = newVal; rowChanged = true; }
        });
        if (rowChanged) changedRows.push(currentRow);
    });
    purimEditSnapshot = null;

    if (!changedRows.length) { renderPurimGroups(); showToast("לא בוצעו שינויים", "success"); return; }
    saveState();
    renderPurimGroups();
    const results = await Promise.all(changedRows.map(row => persist("savePurim", row)));
    reportSave(results.every(Boolean), `נשמרו בהצלחה ${changedRows.length} שורות!`);
    logAudit("update", "purim", `${g.city} / ${g.group}`, { rows: changedRows.length });
};

window.cancelPurimGroupEdit = function() {
    if (purimEditSnapshot) {
        state.purimAddresses = JSON.parse(JSON.stringify(purimEditSnapshot));
        purimEditSnapshot = null;
    }
    renderPurimGroups(); 
    showToast("השינויים בוטלו בהצלחה.", "success");
};

window.updateTypeFilter = function() {
  const small = document.getElementById("filter-type-small")?.checked;
  const big = document.getElementById("filter-type-big")?.checked;
  state.filterYeshivaTypes = [];
  if (small) state.filterYeshivaTypes.push("ישיבה קטנה");
  if (big) state.filterYeshivaTypes.push("ישיבה גדולה");
  renderMembersTable();
};

window.togglePurimYears = function() {
    state.purimShowAllYears = !state.purimShowAllYears;
    renderPurimGroups();
};

window.togglePurimSpacing = function(btn, key) {
    const pane = getPurimPane(key);
    const table = pane && pane.querySelector("table");
    if (!table) return;
    const isCompact = table.classList.contains('compact-view');
    table.classList.toggle('compact-view');
    const icon = btn.querySelector('.material-icons-regular');
    if (icon) icon.textContent = isCompact ? 'density_small' : 'density_large';
    btn.childNodes[btn.childNodes.length - 1].textContent = isCompact ? ' צפוף' : ' רווח';
};

window.printPurimGroup = function(key) {
    const g = getPurimGroup(key);
    const pane = getPurimPane(key);
    const table = pane && pane.querySelector("table");
    if (!g || !table) return;
    const clone = table.cloneNode(true);
    clone.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
    const years = getPurimYearsToShow();
    const sums = years.map(y => {
        const v = state.settings.purimManualSums && state.settings.purimManualSums[g.group] && state.settings.purimManualSums[g.group][y];
        return `<span class="sum"><b>${escapeHtml(y)}:</b> ${v ? formatCurrency(v) : "---"}</span>`;
    }).join("");
    const title = `תרומות פורים — ${escapeHtml(g.city)} / ${escapeHtml(g.group)}`;
    const win = window.open('', '_blank');
    if (!win) { showToast("הדפדפן חסם את חלון ההדפסה. יש לאפשר חלונות קופצים לאתר", "warning"); return; }
    win.document.write(`
        <html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; direction: rtl; font-size: 12px; color: #111; margin: 16px; }
            h2 { font-size: 16px; margin: 0 0 4px; }
            .meta { color: #555; font-size: 11px; margin-bottom: 8px; }
            .sums { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 10px; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: right; }
            th { background: #f0f0f0; font-weight: bold; }
            tr:nth-child(even) td { background: #fafafa; }
            @media print { body { margin: 0; } }
        </style></head><body>
        <h2>${title}</h2>
        <div class="meta">צדקת רבי שמעון · ${getPurimRowsFor(g.city, g.group).length} כתובות · הודפס ${formatDateDisplay(new Date())}</div>
        <div class="sums">סכומים סופיים: ${sums}</div>
        ${clone.outerHTML}
        </body></html>`);
    // ההדפסה מופעלת מכאן ולא מסקריפט בתוך החלון החדש (מדיניות האבטחה חוסמת סקריפט מוטמע)
    let printed = false;
    const printAndClose = () => {
        if (printed) return;
        printed = true;
        try { win.focus(); win.print(); } finally { win.close(); }
    };
    win.addEventListener("load", printAndClose);
    win.document.close();
    setTimeout(printAndClose, 500);
};

window.exportPurimGroupToExcel = function(key) {
    const g = getPurimGroup(key);
    const pane = getPurimPane(key);
    const table = pane && pane.querySelector("table");
    if (!g || !table) return;

    const cloneTable = table.cloneNode(true);
    cloneTable.style.borderCollapse = "collapse";
    cloneTable.style.fontFamily = "Arial, Helvetica, sans-serif";
    cloneTable.style.direction = "rtl";

    const cells = cloneTable.querySelectorAll('td, th');
    cells.forEach(cell => {
        cell.removeAttribute("contenteditable");
        cell.style.border = "1px solid #dddddd";
        cell.style.padding = "6px";
        cell.style.textAlign = "right";
        cell.style.fontSize = "13px";
    });

    const headers = cloneTable.querySelectorAll('th');
    headers.forEach(th => {
        th.style.background = "#f2f2f2";
        th.style.fontWeight = "bold";
    });

    const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            </head>
        <body dir="rtl">
            ${cloneTable.outerHTML}
        </body>
        </html>
    `;

    const safeName = s => String(s).replace(/["'\\/:*?<>|]/g, "").replace(/\s+/g, "_");
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `תרומות_פורים_${safeName(g.city)}_${safeName(g.group)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// ===== כותרת להדפסה: שם הדו"ח, הסינון שנבחר ותאריך ההדפסה =====
function buildPrintHeader() {
  const screen = state.activeScreen;
  const meta = screenMeta[screen] || {};
  let title = meta.title || "";
  const parts = [];
  const selText = id => { const el = document.getElementById(id); return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : ""; };
  if (screen === "members-screen") {
    const profileOpen = !document.getElementById("member-profile-section")?.classList.contains("hidden");
    if (profileOpen) {
      title = `כרטיס בחור: ${document.getElementById("profile-full-name")?.textContent || ""}`;
      parts.push(`שנת ${getCampaignYear()}`);
    } else {
      const term = getValue("search-members-list").trim();
      if (term) parts.push(`חיפוש: ${term}`);
      if (state.filterYeshiva) parts.push(`ישיבה: ${state.filterYeshiva}`);
      if (state.filterCity) parts.push(`עיר: ${state.filterCity}`);
      if ((state.filterYeshivaTypes || []).length) parts.push(state.filterYeshivaTypes.join(" + "));
      if (document.getElementById("filter-show-married")?.checked) parts.push("כולל נשואים");
      parts.push(`${document.querySelectorAll("#members-table-body tr[data-member-id]").length} בחורים`);
    }
  } else if (screen === "daily-report-screen") {
    const f = getValue("report-time-filter");
    parts.push(`תקופה: ${f === "custom" ? formatDateDisplay(getValue("report-custom-date")) : selText("report-time-filter")}`);
    if (f !== "all") parts.push(`שנת ${getCampaignYear()}`);
  } else if (screen === "grants-screen") {
    parts.push(`שנת ${state.grantsArchiveYear || ""}`);
    parts.push(state.grantsActiveView === "payments" ? `תשלומים לחנויות · מחצית ${state.billsHalf || "א"}'` : "נתינת המענק");
  } else if (screen === "expenses-summary-screen") {
    parts.push(`שנת ניתוח: ${state.expensesViewYear || getCampaignYear()}`);
  } else if (screen === "dashboard-screen") {
    parts.push(`שנת ${getDashboardSelectedYear()}`);
  } else if (screen === "purim-registration-screen" && state.purimActive) {
    parts.push(`${state.purimActive.city || ""} / ${state.purimActive.group || ""}`);
  }
  const now = new Date();
  parts.push(`הודפס ${formatDateDisplay(now)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}${state.currentUser ? ` ע"י ${state.currentUser}` : ""}`);
  setText("print-header-title", `צדקת רבי שמעון · ${title}`);
  setText("print-header-meta", parts.filter(Boolean).join(" · "));
}
window.addEventListener("beforeprint", buildPrintHeader);

function exportToCSV(tableBodyId, filename) {
  const tbody = document.getElementById(tableBodyId); if (!tbody) return; const table = tbody.closest("table"); let csv = []; const rows = table.querySelectorAll("tr");
  for (let i = 0; i < rows.length; i++) { let row = [], cols = rows[i].querySelectorAll("td, th"); for (let j = 0; j < cols.length; j++) { if (cols[j].classList.contains("no-export")) continue; let data = cols[j].innerText.replace(/"/g, '""'); data = data.replace(/₪/g, ''); row.push('"' + data.trim() + '"'); } if (!rows[i].querySelector('.empty-state')) { csv.push(row.join(",")); } }
  const BOM = "\uFEFF"; const csvFile = new Blob([BOM + csv.join("\n")], {type: "text/csv;charset=utf-8;"}); const downloadLink = document.createElement("a"); downloadLink.download = `${filename}_${getTodayIsoDate()}.csv`; downloadLink.href = window.URL.createObjectURL(csvFile); downloadLink.style.display = "none"; document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
}


function populateFilters() {
  const yeshivas = [...new Set(state.members.map(m => m.yeshiva).filter(Boolean))].sort();
  const cities = [...new Set(state.members.map(m => m.address ? String(m.address).split(',').pop().trim() : "").filter(Boolean))].sort();
  
  const elYeshiva = document.getElementById("filter-members-yeshiva"); const elCity = document.getElementById("filter-members-city");
  if (elYeshiva) { const currentY = elYeshiva.value; elYeshiva.innerHTML = '<option value="">כל הישיבות</option>'; yeshivas.forEach(y => { const opt = document.createElement("option"); opt.value = y; opt.textContent = y; elYeshiva.appendChild(opt); }); elYeshiva.value = currentY; }
  if (elCity) { const currentC = elCity.value; elCity.innerHTML = '<option value="">כל הערים</option>'; cities.forEach(c => { const opt = document.createElement("option"); opt.value = c; opt.textContent = c; elCity.appendChild(opt); }); elCity.value = currentC; }
}

function populateMemberSelect(selectedId = null) {
  const datalist = document.getElementById("members-datalist");
  if (!datalist) return;
  
  datalist.innerHTML = '';
  
  const sortedMembers = [...state.members].sort((a, b) => {
    const nameA = `${a.lastName || ""} ${a.firstName || ""}`.trim();
    const nameB = `${b.lastName || ""} ${b.firstName || ""}`.trim();
    return nameA.localeCompare(nameB, 'he');
  });

  sortedMembers.forEach(m => {
    const opt = document.createElement("option");
    opt.value = `${m.lastName || ""} ${m.firstName || ""} | ${m.yeshiva || ""} [${m.id}]`;
    datalist.appendChild(opt);
  });
}

function sumArray(arr, prop) { return arr.reduce((sum, item) => sum + (Number(item[prop]) || 0), 0); }

// סכום תקין = מספר חיובי. מחזיר null אם לא תקין.
function parseAmount(v) {
  const n = Number(String(v ?? "").replace(/[,₪\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

// ===== תאריכים =====
// פענוח תאריך בפורמטים שקיימים במערכת: 2026-09-29, 29/09/2026, 29.09.2026, ותאריך-שעה מלא.
// תאריך בלי שעה מפוענח לפי השעון המקומי (ולא UTC) כדי ש"היום" יהיה נכון גם אחרי חצות.
function parseAppDate(val) {
  if (!val) return null;
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/);
  if (m) { const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]); return new Date(y, Number(m[2]) - 1, Number(m[1])); }
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) { const d = new Date(str); return Number.isNaN(d.getTime()) ? null : d; }
  return null;
}
function dateKey(d) { return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : ""; }
function toDateInputValue(val) { return dateKey(parseAppDate(val)); }
function compareDatesDesc(a, b) {
  const da = parseAppDate(a), db = parseAppDate(b);
  return (db ? db.getTime() : -Infinity) - (da ? da.getTime() : -Infinity);
}

// ===== לוח שנה עברי (לחצאי שנה ולשנה הנוכחית) =====
const HEBREW_DATE_FMT = (() => { try { return new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return null; } })();
function getHebrewDateParts(date) {
  if (!HEBREW_DATE_FMT || !date) return null;
  try {
    const parts = HEBREW_DATE_FMT.formatToParts(date);
    const get = t => (parts.find(p => p.type === t) || {}).value;
    return { year: Number(get("year")), month: get("month"), day: Number(get("day")) };
  } catch (e) { return null; }
}
// מחצית א' = תשרי עד אדר, מחצית ב' = ניסן עד אלול
function getHalfForDate(date) {
  const p = getHebrewDateParts(date);
  if (!p) return null;
  return ["Nisan", "Iyar", "Sivan", "Tamuz", "Av", "Elul"].includes(p.month) ? "ב" : "א";
}
function hebrewYearNumberToLetters(num) {
  let n = Number(num) % 1000;
  const letters = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
  let out = "";
  while (n >= 100) { const [val, ch] = letters.find(([v]) => v >= 100 && v <= n); out += ch; n -= val; }
  if (n === 15) out += "טו";
  else if (n === 16) out += "טז";
  else while (n > 0) { const [val, ch] = letters.find(([v]) => v <= n); out += ch; n -= val; }
  return out.length > 1 ? `${out.slice(0, -1)}"${out.slice(-1)}` : `${out}'`;
}
function getCurrentHebrewYearLabel() {
  const p = getHebrewDateParts(new Date());
  return p ? hebrewYearNumberToLetters(p.year) : null;
}
// המספר העברי של שנה (תשפ"ו -> 5786) לפי הסדר ברשימת השנים
function hebrewYearLabelToNumber(label) {
  const idx = HEBREW_YEARS_ORDER.indexOf(label);
  return idx === -1 ? null : 5775 + idx;
}

function formatCurrency(value) { 
  return `₪${(Number(value) || 0).toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; 
}

function getTodayIsoDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatDateDisplay(val) { if (!val) return ""; const d = parseAppDate(val); return !d ? String(val) : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; }
function escapeHtml(val) { return String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function getValue(id) { const el = document.getElementById(id); return el ? String(el.value ?? "") : ""; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

function showToast(msg, type = "success") {
  const palette = {
    success: { bg: "var(--success)", icon: "check_circle" },
    danger:  { bg: "var(--danger)",  icon: "error" },
    warning: { bg: "var(--warning)", icon: "warning" },
  };
  const conf = palette[type] || palette.success;

  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.style.setProperty("--toast-bg", conf.bg);

  const icon = document.createElement("span");
  icon.className = "material-icons-regular";
  icon.style.fontSize = "20px";
  icon.textContent = conf.icon;

  const text = document.createElement("span");
  // strip any leading emoji a caller passed in; render the rest as plain text
  text.textContent = String(msg).replace(/^[^\p{L}\p{N}]+\s*/u, "");

  toast.append(icon, text);
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
function generateId(prefix = "ID") { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }

function getHistoricalStatus(currentType, currentShiur, currentYearStr, targetYearStr, settings) {
    const hebrewYears = ['תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט', 'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט', 'תש"צ'];
    
    const progression = [
        { type: 'חיידר', shiur: '', targetKey: 'chaider' },
        { type: 'ישיבה קטנה', shiur: 'א', targetKey: 'ktana' },
        { type: 'ישיבה קטנה', shiur: 'ב', targetKey: 'ktana' },
        { type: 'ישיבה קטנה', shiur: 'ג', targetKey: 'ktana' },
        { type: 'ישיבה גדולה', shiur: 'א', targetKey: 'gedola'},
        { type: 'ישיבה גדולה', shiur: 'ב', targetKey: 'gedola'},
        { type: 'ישיבה גדולה', shiur: 'ג', targetKey: 'gedola'},
        { type: 'קיבוץ', shiur: 'א', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ב', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ג', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ד', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ה', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ו', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ז', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ח', targetKey: 'kibbutz' },
        { type: 'קיבוץ', shiur: 'ט', targetKey: 'kibbutz' }
    ];

    let currIdx = hebrewYears.indexOf(currentYearStr);
    let targetIdx = hebrewYears.indexOf(targetYearStr);

    let targetKtana = Number(settings.targetKtana) || 0;
    let targetGedola = Number(settings.targetGedola) || 0;
    let targetChaider = Number(settings.targetChaider) || 0;
    let targetKibbutz = Number(settings.targetKibbutz) || 0;

    if (currIdx === -1 || targetIdx === -1) {
        let t = 0;
        if (currentType === 'חיידר') t = targetChaider;
        if (currentType === 'ישיבה קטנה') t = targetKtana;
        if (currentType === 'ישיבה גדולה') t = targetGedola;
        if (currentType === 'קיבוץ') t = targetKibbutz;
        return { type: currentType, shiur: currentShiur, target: t };
    }

    let diff = currIdx - targetIdx; 

    let stageIdx = 0;
    if (currentType === 'חיידר') stageIdx = 0;
    else if (currentType === 'ישיבה קטנה') {
        if (currentShiur === 'א') stageIdx = 1;
        else if (currentShiur === 'ב') stageIdx = 2;
        else stageIdx = 3; 
    }
    else if (currentType === 'ישיבה גדולה') {
        if (currentShiur === 'א') stageIdx = 4;
        else if (currentShiur === 'ב') stageIdx = 5;
        else stageIdx = 6; 
    }
    else if (currentType === 'קיבוץ') {
        const kibbutzShiurim = ['א','ב','ג','ד','ה','ו','ז','ח','ט'];
        let sIdx = kibbutzShiurim.indexOf(currentShiur);
        if (sIdx === -1) sIdx = 0; 
        stageIdx = 7 + sIdx; 
    }

    let histStageIdx = stageIdx - diff;
    if (histStageIdx < 0) histStageIdx = 0; 
    if (histStageIdx > 15) histStageIdx = 15; 

    let histStage = progression[histStageIdx];

    let target = 0;
    if (histStage.targetKey === 'ktana') target = targetKtana;
    if (histStage.targetKey === 'gedola') target = targetGedola;
    if (histStage.targetKey === 'chaider') target = targetChaider;
    if (histStage.targetKey === 'kibbutz') target = targetKibbutz;

    return { type: histStage.type, shiur: histStage.shiur, target: target };
}

function isMemberMarried(member) {
  return member.maritalStatus === "נשוי" || (member.notes || "").includes("התחתן");
}

// כמו buildMemberSummaries, אך ללא בחורים נשואים - לשימוש בצבירות של לוח הבקרה (יעד, חוב, מסגרות, עלות מענקים)
function buildActiveMemberSummaries(selectedYear = getCampaignYear()) {
  return buildMemberSummaries(selectedYear).filter(row => !isMemberMarried(row));
}

function buildMemberSummaries(selectedYear = getCampaignYear()) {
  const currentYear = selectedYear || getCampaignYear();
  const campaignYear = getCampaignYear();
  const settings = state.settings || {};
  const hebrewYearsForSort = HEBREW_YEARS_ORDER;

  return (state.members || []).map(member => {
    const memberDonations = (state.donations || []).filter(d => String(d.memberId).trim() === String(member.id).trim());
    const collectedThisYear = memberDonations.filter(d => d.year === currentYear).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const collectedAmount = memberDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const currentStatusInfo = getHistoricalStatus(member.yeshivaType, member.shiur, campaignYear, currentYear, settings);
    const currentYearTarget = currentStatusInfo.target;

    const targetTiyul = Number(settings.targetTiyul) || 0;
    const targetShay = Number(settings.targetShayTotal) || 0;
    const gift1On = settings.gift1Enabled !== false;
    const gift2On = settings.gift2Enabled !== false;

    // ===== בניית מפת שנים =====
    const yearlyDataMap = {};
    yearlyDataMap[currentYear] = {
      year: currentYear, target: currentYearTarget, collected: collectedThisYear,
      historicalType: currentStatusInfo.type, historicalShiur: currentStatusInfo.shiur,
      debtIn: 0, debtOut: 0, requiredTotal: currentYearTarget
    };

    memberDonations.forEach(d => {
      const y = String(d.year);
      if (!yearlyDataMap[y]) {
        const hi = getHistoricalStatus(member.yeshivaType, member.shiur, campaignYear, y, settings);
        yearlyDataMap[y] = { year: y, target: hi.target, collected: 0, historicalType: hi.type, historicalShiur: hi.shiur, debtIn: 0, debtOut: 0, requiredTotal: hi.target };
      }
      if (y !== currentYear) yearlyDataMap[y].collected += (Number(d.amount) || 0);
    });

    // מלא פערים בין שנים
    const existingIdxs = Object.keys(yearlyDataMap).map(y => hebrewYearsForSort.indexOf(y)).filter(i => i !== -1);
    if (existingIdxs.length > 1) {
      const minIdx = Math.min(...existingIdxs);
      const maxIdx = Math.max(...existingIdxs);
      for (let i = minIdx; i <= maxIdx; i++) {
        const y = hebrewYearsForSort[i];
        if (y && !yearlyDataMap[y]) {
          const hi = getHistoricalStatus(member.yeshivaType, member.shiur, campaignYear, y, settings);
          yearlyDataMap[y] = { year: y, target: hi.target, collected: 0, historicalType: hi.type, historicalShiur: hi.shiur, debtIn: 0, debtOut: 0, requiredTotal: hi.target };
        }
      }
    }

    // ===== חישוב חוב כרונולוגי על שנות העבר =====
    const currentYearIdx = hebrewYearsForSort.indexOf(currentYear);
    const pastYears = Object.keys(yearlyDataMap)
      .filter(y => y !== currentYear && hebrewYearsForSort.indexOf(y) < currentYearIdx)
      .sort((a, b) => hebrewYearsForSort.indexOf(a) - hebrewYearsForSort.indexOf(b));

    const penaltyStartYear = 'תשפ"ד';
    const penaltyStartIdx = hebrewYearsForSort.indexOf(penaltyStartYear);

    let runningDebt = 0;
    pastYears.forEach(y => {
      const entry = yearlyDataMap[y];
      entry.debtIn = runningDebt;
      if (entry.target > 0) {
        const required = entry.target + runningDebt;
        entry.requiredTotal = required;
        if (entry.collected >= required) {
          entry.debtOut = 0;
          runningDebt = 0;
        } else {
          const debtPaidOff = Math.min(runningDebt, entry.collected);
          const remainingForTarget = Math.max(0, entry.collected - runningDebt);
          const unpaidOldDebt = runningDebt - debtPaidOff;
          const targetShortfall = Math.max(0, entry.target - remainingForTarget);
          const yearIdx = hebrewYearsForSort.indexOf(y);
          const penaltyMultiplier = (penaltyStartIdx !== -1 && yearIdx >= penaltyStartIdx) ? 2 : 1;
          entry.debtOut = unpaidOldDebt + targetShortfall * penaltyMultiplier;
          runningDebt = entry.debtOut;
        }
      } else {
        entry.requiredTotal = 0;
        entry.debtOut = Math.max(0, runningDebt - entry.collected);
        runningDebt = entry.debtOut;
      }
    });

    const totalDebtFromPast = runningDebt;

    // עדכון השנה הנוכחית עם החוב
    yearlyDataMap[currentYear].debtIn = totalDebtFromPast;
    yearlyDataMap[currentYear].requiredTotal = currentYearTarget + totalDebtFromPast;
    // החוב הישן נפרע קודם מכל סכום שנאסף השנה (כמו בשנים קודמות) - זה מה שעדיין פתוח "כרגע"
    const openDebtNow = Math.max(0, totalDebtFromPast - collectedThisYear);
    yearlyDataMap[currentYear].debtOut = openDebtNow;

    const totalRequiredThisYear = currentYearTarget + totalDebtFromPast;
    const missingAmount = Math.max(0, totalRequiredThisYear - collectedThisYear);
    // חיידר אינם בגיל מענק ולכן לעולם לא "עמדו ביעד"; קיבוץ נחשבים זכאים רק אם אין להם חוב פתוח מהעבר
    let isEligible;
    if (currentStatusInfo.type === "חיידר") {
      isEligible = false;
    } else if (currentStatusInfo.type === "קיבוץ") {
      isEligible = totalDebtFromPast === 0;
    } else {
      isEligible = currentYearTarget > 0 ? (collectedThisYear >= totalRequiredThisYear) : (totalDebtFromPast === 0 || collectedThisYear >= totalDebtFromPast);
    }
    const isEligibleTiyul = gift1On && targetTiyul > 0 && collectedThisYear >= targetTiyul;
    const isEligibleShay = gift2On && targetShay > 0 && collectedThisYear >= targetShay;

    const yearlyDataArray = Object.values(yearlyDataMap).sort((a, b) => {
      const idxA = hebrewYearsForSort.indexOf(a.year);
      const idxB = hebrewYearsForSort.indexOf(b.year);
      if (idxA !== -1 && idxB !== -1) return idxB - idxA;
      return b.year.localeCompare(a.year, 'he');
    });

    return {
      ...member, fullName: `${member.firstName || ""} ${member.lastName || ""}`.trim(), currentYear,
      collectedThisYear, collectedAmount, currentYearTarget, currentYearType: currentStatusInfo.type, currentYearShiur: currentStatusInfo.shiur, totalDebtFromPast, openDebtNow, totalRequiredThisYear, missingAmount,
      isEligible, isEligibleTiyul, isEligibleShay,
      yearlyData: yearlyDataArray
    };
  });
}

function getCampaignYear() {
  return state.settings.campaignYear || DEFAULT_SETTINGS.campaignYear;
}

function renderAll() {
    renderDashboard();
    renderMembersTable();
    renderDailyReport();
    renderExpensesSummaryTable();
    renderGrantsLists();
    renderPurimGroups();
    if (state.activeScreen === "rules-screen") renderRulesScreen();
}

// ==========================================
// מנגנון ניתוק אוטומטי (Idle Timeout)
// ==========================================

let idleTime = 0;
let idleInterval;
let countdownInterval;

function startIdleTimer() {
    window.onload = resetIdleTimer;
    window.onmousemove = resetIdleTimer;
    window.onmousedown = resetIdleTimer;
    window.ontouchstart = resetIdleTimer;
    window.onclick = resetIdleTimer;
    window.onkeydown = resetIdleTimer;

    clearInterval(idleInterval);
    idleInterval = setInterval(timerIncrement, 1000); 
}

function resetIdleTimer() {
    idleTime = 0;
    const modal = document.getElementById("timeout-warning-modal");
    if (modal) modal.classList.remove("open");
    clearInterval(countdownInterval);
}

function timerIncrement() {
    const mainScreen = document.getElementById("main-screen");
    if (mainScreen && mainScreen.classList.contains("hidden-layout")) return;

    idleTime++;
    if (idleTime === 580) { 
        showTimeoutWarning();
    } else if (idleTime >= 600) { 
        performLogout(true);
    }
}

function showTimeoutWarning() {
    let timeLeft = 20;
    const modal = document.getElementById("timeout-warning-modal");
    const countdownEl = document.getElementById("timeout-countdown");
    if (!modal || !countdownEl) return;
    
    modal.classList.add("open");
    countdownEl.textContent = timeLeft;

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = timeLeft;
        if(timeLeft <= 0) clearInterval(countdownInterval);
    }, 1000);
}

function performLogout(isAuto = false) {
    const pending = readPendingWrites().length;
    if (!isAuto && pending && !confirm(`${pending} שינויים עדיין לא נשמרו בשרת (אין חיבור). הם יישארו שמורים במחשב הזה ויישלחו בכניסה הבאה. לצאת בכל זאת?`)) return;
    if (isAuto) saveFormDraft();
    if (window.SB) { try { SB.signOut(); } catch (e) {} }
    // מוחקים את העותק המקומי של הנתונים (שמות, טלפונים, כתובות, הפקדות) כדי שלא יישאר במחשב
    clearLocalDataCache();
    if (isAuto) { try { sessionStorage.setItem("ezer_logout_reason", "idle"); } catch (e) {} }
    // טעינה מחדש מנקה גם את הזיכרון ואת המסכים, ומציגה מסך כניסה תקין
    setTimeout(() => location.reload(), 150);
}

// תור השמירות הממתינות (PENDING_WRITES_KEY) לא נמחק כאן בכוונה - הוא יישלח בכניסה הבאה
function clearLocalDataCache() {
  Object.values(STORAGE_KEYS).concat(LAST_SYNC_KEY).forEach(k => {
    cacheStore.remove(k);
    try { localStorage.removeItem(k); } catch (e) {}
  });
}

// ===== שמירת טופס פתוח כשהמערכת ננעלת עקב חוסר פעילות =====
const FORM_DRAFT_KEY = "ezer_form_draft";
const DRAFT_MODALS = {
  "add-member-modal": ["edit-member-id", "member-first-name", "member-last-name", "member-father-name", "member-phone", "member-yeshiva", "member-yeshiva-type", "member-shiur", "member-marital-status", "member-address", "member-notes"],
  "add-donation-modal": ["edit-donation-id", "donation-date", "donation-year", "donation-member-input", "donation-amount", "donation-notes"],
  "add-expense-modal": ["edit-expense-id", "expense-date", "expense-year", "expense-category", "expense-description", "expense-amount"],
};
function saveFormDraft() {
  const modalId = Object.keys(DRAFT_MODALS).find(id => document.getElementById(id)?.classList.contains("open"));
  if (!modalId) return;
  const values = {};
  DRAFT_MODALS[modalId].forEach(id => { const el = document.getElementById(id); if (el) values[id] = el.value; });
  const method = document.querySelector('input[name="donation_payment_method"]:checked');
  if (modalId === "add-donation-modal" && method) values.__method = method.value;
  try { sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify({ modalId, values })); } catch (e) {}
}
function clearFormDraft() { try { sessionStorage.removeItem(FORM_DRAFT_KEY); } catch (e) {} }
function restoreFormDraft() {
  let draft = null;
  try { draft = JSON.parse(sessionStorage.getItem(FORM_DRAFT_KEY) || "null"); } catch (e) {}
  if (!draft || !DRAFT_MODALS[draft.modalId]) return;
  const v = draft.values || {};
  if (draft.modalId === "add-member-modal") openMemberModal(v["edit-member-id"] || null);
  else if (draft.modalId === "add-donation-modal") openDonationModal(null, v["edit-donation-id"] || null);
  else if (draft.modalId === "add-expense-modal") openExpenseModal(v["edit-expense-id"] || null);
  DRAFT_MODALS[draft.modalId].forEach(id => { const el = document.getElementById(id); if (el && v[id] !== undefined) el.value = v[id]; });
  if (v.__method) { const r = document.querySelector(`input[name="donation_payment_method"][value="${v.__method}"]`); if (r) r.checked = true; }
  const typeSel = document.getElementById("member-yeshiva-type");
  if (draft.modalId === "add-member-modal" && typeSel) typeSel.dispatchEvent(new Event("change"));
  if (draft.modalId === "add-member-modal" && v["member-shiur"] !== undefined) setValue("member-shiur", v["member-shiur"]);
  showToast("שחזרנו טופס שהיה פתוח לפני שהמערכת ננעלה. אפשר להמשיך ולשמור", "warning");
}

