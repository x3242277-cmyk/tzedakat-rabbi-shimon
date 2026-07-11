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

const DEFAULT_USERS = [{ username: "מנהל", password: "123", canEdit: true, canViewIncome: true, canViewExpenses: true, canViewGrants: true, canViewHistory: true }];

// מיפוי שם משתמש (עברית) לכתובת מייל להתחברות ב-Supabase Auth.
// שומר על חוויית "בחירת שם מרשימה" תוך שימוש בהתחברות מאובטחת.
const USER_EMAIL_MAP = {
  "מנהל": "admin@tzedaka.local",
  "מנדי בידרמן": "mendi@tzedaka.local",
  "מוישי גולדברג": "moishi@tzedaka.local",
  "אלימלך גלבשטיין": "elimelech@tzedaka.local",
};

let state = {
  members: [],
  donations: [],
  expenses: [],
  users: [],
  purimAddresses: [],
  grantsArchive: null,
  settings: { ...DEFAULT_SETTINGS },
  activeScreen: "dashboard-screen",
  globalSearchTerm: "",
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


document.addEventListener("DOMContentLoaded", async () => {
  loadState();

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
      const sbUser = SB.currentUser();
      state.currentUser = (sbUser && sbUser.user_metadata && sbUser.user_metadata.username) || state.currentUser || "";
      if (loaderArea) loaderArea.style.display = "none";
      if (logo) logo.classList.remove("pulse-logo");
      document.getElementById("login-screen").classList.add("hidden-login");
      document.getElementById("main-screen").classList.remove("hidden-layout");
      document.getElementById("main-screen").classList.add("visible-layout");
      await fetchDataFromServer(true);   // טוען נתונים + קובע currentUserObj + הרשאות
      applyPermissions();
      initApp();
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

function initLoginScreen() {
  const select = document.getElementById("login-username");

  // רשימת המשתמשים להתחברות — מתוך מפת המייל (זמין עוד לפני התחברות)
  const usernames = Object.keys(USER_EMAIL_MAP);
  // צירוף שמות נוספים שהגיעו מהפרופילים (אם יש), רק אם קיים להם מייל
  state.users.forEach(u => { const n = String(u.username || "").trim(); if (n && USER_EMAIL_MAP[n] && !usernames.includes(n)) usernames.push(n); });

  select.innerHTML = "";
  usernames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  const btnLogin = document.getElementById("btn-login");
  const newBtnLogin = btnLogin.cloneNode(true);
  btnLogin.parentNode.replaceChild(newBtnLogin, btnLogin);

  newBtnLogin.addEventListener("click", async () => {
    const userVal = String(document.getElementById("login-username").value).trim();
    const passVal = String(document.getElementById("login-password").value);
    const errEl = document.getElementById("login-error");
    const email = USER_EMAIL_MAP[userVal];

    if (!email) { if (errEl) { errEl.textContent = "משתמש לא מוכר"; errEl.style.display = "block"; } return; }
    if (!passVal) { if (errEl) { errEl.textContent = "יש להזין סיסמה"; errEl.style.display = "block"; } return; }

    const origText = newBtnLogin.textContent;
    newBtnLogin.disabled = true; newBtnLogin.textContent = "מתחבר...";
    try {
      await SB.signIn(email, passVal);
      state.currentUser = userVal;
      if (errEl) errEl.style.display = "none";

      await fetchDataFromServer(true); // טוען את כל הנתונים מ-Supabase
      state.currentUserObj = state.users.find(u => String(u.username).trim() === userVal) || { username: userVal, canEdit: true, canViewIncome: true, canViewExpenses: true, canViewGrants: true, canViewHistory: true };

      document.getElementById("login-screen").classList.add("hidden-login");
      applyPermissions();
      document.getElementById("main-screen").classList.remove("hidden-layout");
      document.getElementById("main-screen").classList.add("visible-layout");
      showToast(`ברוך הבא למערכת, ${state.currentUser}!`, "success");
      initApp();
    } catch (e) {
      if (errEl) { errEl.textContent = "שם משתמש או סיסמה שגויים"; errEl.style.display = "block"; }
    } finally {
      newBtnLogin.disabled = false; newBtnLogin.textContent = origText;
    }
  });
}

function applyPermissions() {
  const isVIP = state.currentUserObj && state.currentUserObj.username && String(state.currentUserObj.username).trim() === "מנהל";
  
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
    "btn-profile-edit", "btn-save-settings", "btn-add-user", "btn-report-add-donation", "btn-report-add-expense"
  ];
  editButtons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = canEdit ? "" : "none";
  });

  const navPurim = document.querySelector('.nav-item[data-screen="purim-registration-screen"]');
  if (navPurim) navPurim.style.display = canViewIncome ? "" : "none";
  
  const incomeGroup1 = document.getElementById("box-purim-groups");
  if (incomeGroup1) incomeGroup1.style.display = canViewIncome ? "" : "none";
  const incomeGroup2 = document.getElementById("box-members-collection");
  if (incomeGroup2) incomeGroup2.style.display = canViewIncome ? "" : "none";
  const chartBox = document.getElementById("box-chart");
  if (chartBox) chartBox.style.display = canViewIncome ? "" : "none";

  const navExpSum = document.querySelector('.nav-item[data-screen="expenses-summary-screen"]');
  if (navExpSum) navExpSum.style.display = canViewExpenses ? "" : "none";
  const expBox = document.getElementById("box-expenses");
  if (expBox) expBox.style.display = canViewExpenses ? "" : "none";

  const navDailyReport = document.querySelector('.nav-item[data-screen="daily-report-screen"]');
  if (navDailyReport) navDailyReport.style.display = (canViewIncome || canViewExpenses) ? "" : "none";

  const navGrants = document.querySelector('.nav-item[data-screen="grants-screen"]');
  if (navGrants) navGrants.style.display = canViewGrants ? "" : "none";
  const navElig = document.querySelector('.nav-item[data-screen="eligibility-screen"]');
  if (navElig) navElig.style.display = canViewGrants ? "" : "none";
  const btnGrantHistory = document.getElementById("btn-profile-grant");
  if (btnGrantHistory) btnGrantHistory.style.display = canViewGrants ? "" : "none";
  const btnQuickElig = document.getElementById("quick-open-eligibility");
  if (btnQuickElig) btnQuickElig.style.display = canViewGrants ? "" : "none";
  
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
  if (!window.SB || !SB.isLoggedIn()) return;
  try {
    const d = await SB.loadAll();
    state.members = (d.members || []).map(m => ({ ...m, yeshivaType: normalizeYeshivaType(m.yeshivaType) }));
    if (Array.isArray(d.donations)) state.donations = d.donations;
    if (Array.isArray(d.expenses)) state.expenses = d.expenses;
    if (Array.isArray(d.purimAddresses)) state.purimAddresses = d.purimAddresses;
    if (Array.isArray(d.profiles) && d.profiles.length) state.users = d.profiles;
    if (d.settings) state.settings = { ...DEFAULT_SETTINGS, ...d.settings };
    if (d.grantsArchive) state.grantsArchive = d.grantsArchive;

    if (state.currentUser) {
      state.currentUserObj = state.users.find(u => String(u.username).trim() === String(state.currentUser).trim()) || state.currentUserObj;
    }

    invalidateCache();
    saveState();
    try { localStorage.setItem("ezer_last_sync", new Date().toISOString()); } catch (e) {}

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
  } catch (error) {
    if (!isSilent) console.warn("שגיאה בטעינת נתונים מ-Supabase. נטענו נתונים מקומיים.", error);
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
          const amount = Number(document.getElementById("nedarim-amount").value);
          const notes = document.getElementById("nedarim-notes").value.trim();

          if (!memberId || !amount) {
              showToast("⚠️ חובה לחפש בחור מתוך הרשימה ולהזין סכום ששולם", "danger");
              return;
          }

          const member = getMemberSummaries().find((m) => String(m.id).trim() === String(memberId).trim()); 
          if (!member) {
              showToast("⚠️ הבחור לא אותר. אנא בחר מהרשימה התואמת", "danger");
              return;
          }

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
              showToast("✅ התרומה נרשמה בהצלחה לזכות הבחור!");
              await SB.saveDonation(newDonation);
          } catch (error) { 
              showToast(`❌ שגיאה בסנכרון לשרת, אך הנתונים נשמרו מקומית.`, "danger");
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
  const searchElig = document.getElementById("search-eligibility-list");
  if (searchElig) searchElig.addEventListener("input", debounce((e) => {
    state.globalSearchTerm = String(e.target.value || "").trim().toLowerCase();
    renderEligibilityTable();
    renderGrantsLists();
  }, 300));

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
  if (document.getElementById("btn-export-eligibility")) document.getElementById("btn-export-eligibility").addEventListener("click", () => exportToCSV("eligibility-table-body", "דוח_זכאות"));
}

function bindQuickActions() {
  const quickAddDonation = document.getElementById("quick-add-donation"); 
  const quickAddExpense = document.getElementById("quick-add-expense");
  const quickAddMember = document.getElementById("quick-add-member"); 
  const quickOpenEligibility = document.getElementById("quick-open-eligibility");
  
  if (quickAddDonation) quickAddDonation.addEventListener("click", () => openDonationModal());
  if (quickAddExpense) quickAddExpense.addEventListener("click", () => openExpenseModal());
  if (quickAddMember) quickAddMember.addEventListener("click", () => openMemberModal());
  if (quickOpenEligibility) quickOpenEligibility.addEventListener("click", () => switchScreen("eligibility-screen", true));
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

  const isVIP = state.currentUserObj && state.currentUserObj.username && String(state.currentUserObj.username).trim() === "מנהל";
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
  if (document.getElementById("save-member-btn")) document.getElementById("save-member-btn").addEventListener("click", handleSaveMember);
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
    : '<span class="material-icons-regular si-icon">error</span><span>שגיאה בעדכון</span>';
  el.style.background = success ? "var(--success)" : "var(--danger)";
  el._hideTimer = setTimeout(() => el.classList.remove("visible"), 2200);
}

async function handleSaveMember(isAutoSave = false) {
  const saveBtn = document.getElementById("save-member-btn");
  const existingId = getValue("edit-member-id").trim();
  const id = existingId || generateId("M");

  const newMemberData = {
    id, firstName: getValue("member-first-name").trim(), lastName: getValue("member-last-name").trim(), fatherName: getValue("member-father-name").trim(),
    phone: getValue("member-phone").trim(), yeshiva: getValue("member-yeshiva").trim(), shiur: getValue("member-shiur").trim(),
    yeshivaType: getValue("member-yeshiva-type"), maritalStatus: getValue("member-marital-status"), address: getValue("member-address").trim(), notes: getValue("member-notes").trim(),
  };

  if (!newMemberData.firstName || !newMemberData.lastName) { showToast("⚠️ יש להזין שם פרטי ושם משפחה", "danger"); return; }
  newMemberData.createdAt = existingId ? (state.members.find((m) => m.id === existingId)?.createdAt || new Date().toISOString()) : new Date().toISOString();

  if (isAutoSave) {
    // סגור את החלון מיד ‑ האינדיקטור יישאר עד שהשרת עונה
    document.getElementById("add-member-modal")?.classList.remove("open");
    if (existingId) {
      const index = state.members.findIndex((m) => String(m.id).trim() === String(existingId).trim());
      if (index !== -1) state.members[index] = newMemberData;
    } else {
      state.members.push(newMemberData);
    }
    invalidateCache();
    saveState(); populateMemberSelect(); populateFilters(); renderAll();
    if (state.activeScreen === "members-screen") loadMemberProfile(id);
    showSavingIndicator();
    try {
      await SB.saveMember(newMemberData);
      hideSavingIndicator(true);
    } catch (error) {
      hideSavingIndicator(false);
    }
    return;
  }

  try {
    saveBtn.disabled = true; saveBtn.textContent = "שומר...";
    if (existingId) {
        const index = state.members.findIndex((m) => String(m.id).trim() === String(existingId).trim());
        if (index !== -1) state.members[index] = newMemberData;
    } else {
        state.members.push(newMemberData);
    }

    invalidateCache();
    saveState(); populateMemberSelect(); populateFilters(); renderAll(); document.getElementById("add-member-modal").classList.remove("open");
    showToast("✅ פרטי הבחור נשמרו בהצלחה!");

    await SB.saveMember(newMemberData);
  } catch (error) {
    showToast(`❌ הפעולה נכשלה: ${error.message || 'לא ניתן לשמור מול השרת'}`, "danger");
  } finally {
    saveBtn.disabled = false; saveBtn.textContent = "שמור בחור";
    if (state.activeScreen === "members-screen" && state.currentProfileId === id) loadMemberProfile(id);
  }
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

function bindDonationModal() {
  const modal = document.getElementById("add-donation-modal"); 
  const closeModal = () => { if(modal) modal.classList.remove("open"); populateMemberSelect(); };
  if (document.getElementById("close-add-donation-modal")) document.getElementById("close-add-donation-modal").addEventListener("click", closeModal);
  if (document.getElementById("cancel-add-donation")) document.getElementById("cancel-add-donation").addEventListener("click", closeModal);
  if (document.getElementById("save-donation-btn")) document.getElementById("save-donation-btn").addEventListener("click", handleSaveDonation);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
}

async function handleSaveDonation() {
  const saveBtn = document.getElementById("save-donation-btn");
  const memberInput = getValue("donation-member-input").trim(); 
  const memberId = extractMemberId(memberInput); 
  
  const amount = Number(getValue("donation-amount"));
  let notes = getValue("donation-notes").trim(); 
  const paymentMethod = document.querySelector('input[name="donation_payment_method"]:checked')?.value || "cash";
  
  if (!memberId || !amount) { 
    showToast("⚠️ יש לחפש ולבחור בחור מתוך הרשימה, ולהזין סכום", "danger"); 
    return; 
  }

  const member = getMemberSummaries().find((m) => String(m.id).trim() === String(memberId).trim()); 
  if (!member) {
    showToast("❌ שגיאה: נתוני הבחור לא אותרו במערכת", "danger");
    return;
  }

  const newDonation = {
    id: generateId("D"), date: getValue("donation-date").trim() || getTodayIsoDate(), memberId, memberNameSnapshot: member.fullName, year: member.currentYear,
    amount, notes: (paymentMethod === "credit" ? `(אשראי) ${notes}` : notes).trim(), createdAt: new Date().toISOString(),
  };

  try {
    saveBtn.disabled = true; saveBtn.textContent = "שומר...";
    state.donations.push(newDonation); 
    invalidateCache(); 
    saveState(); renderAll(); document.getElementById("add-donation-modal").classList.remove("open"); 
    showToast("✅ ההפקדה נרשמה בהצלחה!");
    await SB.saveDonation(newDonation);
  } catch (error) { 
    showToast(`❌ שגיאה בשמירה לשרת: ${error.message || 'תקלת תקשורת'}`, "danger");
  } finally { 
    saveBtn.disabled = false; saveBtn.textContent = "שמור הפקדה"; 
    if (state.activeScreen === "members-screen" && state.currentProfileId === memberId) loadMemberProfile(memberId); 
  }
}

function openDonationModal(memberId = null) {
  const modal = document.getElementById("add-donation-modal"); if (!modal) return;
  setValue("donation-date", getTodayIsoDate()); 
  setValue("donation-amount", ""); 
  setValue("donation-notes", ""); 
  
  const cashRadio = document.querySelector('input[name="donation_payment_method"][value="cash"]'); 
  if (cashRadio) cashRadio.checked = true;
  
  const inputEl = document.getElementById("donation-member-input");
  if (inputEl) inputEl.value = "";
  
  if (memberId) { 
      const m = state.members.find(x => x.id === memberId);
      if (m && inputEl) {
          inputEl.value = `${m.lastName || ""} ${m.firstName || ""} | ${m.yeshiva || ""} [${m.id}]`;
      }
  } 
  modal.classList.add("open");
}

function bindExpenseModal() {
  const modal = document.getElementById("add-expense-modal"); const closeModal = () => { if(modal) modal.classList.remove("open"); };
  if (document.getElementById("close-add-expense-modal")) document.getElementById("close-add-expense-modal").addEventListener("click", closeModal);
  if (document.getElementById("cancel-add-expense")) document.getElementById("cancel-add-expense").addEventListener("click", closeModal);
  if (document.getElementById("save-expense-btn")) document.getElementById("save-expense-btn").addEventListener("click", handleSaveExpense);
}

function openExpenseModal() { const modal = document.getElementById("add-expense-modal"); if (!modal) return; populateExpenseCategorySelect(); setValue("expense-date", getTodayIsoDate()); const cats = getExpenseCategories(); setValue("expense-category", cats[0] || "שונות"); setValue("expense-description", ""); setValue("expense-amount", ""); modal.classList.add("open"); }

async function handleSaveExpense() {
  const saveBtn = document.getElementById("save-expense-btn"); const amount = Number(getValue("expense-amount"));
  if (!amount) { showToast("⚠️ יש להזין סכום", "danger"); return; }

  const newExpense = { id: generateId("E"), date: getValue("expense-date").trim() || getTodayIsoDate(), year: getCampaignYear(), category: getValue("expense-category"), description: getValue("expense-description").trim(), amount, createdAt: new Date().toISOString() };
  try {
    saveBtn.disabled = true; saveBtn.textContent = "שומר..."; 
    state.expenses.push(newExpense);
    invalidateCache();
    saveState(); renderAll(); document.getElementById("add-expense-modal").classList.remove("open"); 
    showToast("✅ ההוצאה נרשמה בהצלחה!");

    await SB.saveExpense(newExpense);
  } catch (error) { 
    showToast(`❌ תקלת סנכרון: ${error.message || 'ההוצאה לא נשמרה בשרת'}`, "danger");
  } finally { 
    saveBtn.disabled = false; saveBtn.textContent = "הוסף הוצאה"; 
  }
}

function bindSettings() {
  if (document.getElementById("btn-save-settings")) document.getElementById("btn-save-settings").addEventListener("click", saveSettings);
  if (document.getElementById("btn-add-user")) document.getElementById("btn-add-user").addEventListener("click", addUser);

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
  const s = state.settings;
  s.campaignYear = getValue("current-campaign-year").trim() || DEFAULT_SETTINGS.campaignYear;
  s.targetChaider = Number(getValue("target-chaider")) || 0;
  s.targetKtana = Number(getValue("target-ktana")) || 0;
  s.targetGedola = Number(getValue("target-gedola")) || 0;
  s.targetKibbutz = Number(getValue("target-kibbutz")) || 0;
  s.targetTiyul = Number(getValue("target-tiyul")) || 0;
  s.targetShayTotal = Number(getValue("target-shay")) || 0;
  s.gift1Name = getValue("gift1-name").trim() || "טיול";
  s.gift2Name = getValue("gift2-name").trim() || "מתנה";
  s.gift1Enabled = !!document.getElementById("gift1-enabled")?.checked;
  s.gift2Enabled = !!document.getElementById("gift2-enabled")?.checked;
  s.gift1Image = (document.getElementById("gift1-image")?.value || "").trim();
  s.gift2Image = (document.getElementById("gift2-image")?.value || "").trim();
  s.additionalRules = (document.getElementById("additional-rules")?.value || "").trim();
  invalidateCache();
  saveState(); renderAll(); showToast("✅ הגדרות המערכת נשמרו בהצלחה");
  if (window.SB && SB.isLoggedIn()) SB.saveSettings(s).catch(() => showToast("⚠️ ההגדרות נשמרו מקומית אך לא הסתנכרנו לשרת", "warning"));
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
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" class="takanon-prize-thumb" onerror="this.outerHTML='<div class=\\'takanon-prize-emoji\\'>${emoji}</div>'">`
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
          <input type="text" id="takanon-member-input" class="ui-input" placeholder="חפש לפי שם..." oninput="takanonSearch(this.value)" autocomplete="off">
          <div id="takanon-search-results" class="takanon-search-dropdown" style="display:none;"></div>
        </div>
        <div id="takanon-member-card" class="takanon-member-card" style="display:none;"></div>
      </div>
    </div>

    ${additionalHtml}
  `;
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
    `<div class="takanon-search-item" onclick="takanonShowMember('${escapeHtml(String(m.id))}')">
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
    if (!state.settings.purimManualSums) state.settings.purimManualSums = {};
    el.querySelectorAll(".purim-sum-setting-input").forEach(input => {
      const group = input.getAttribute("data-group");
      const year = input.getAttribute("data-year");
      if (!state.settings.purimManualSums[group]) state.settings.purimManualSums[group] = {};
      state.settings.purimManualSums[group][year] = input.value;
    });
    saveState();
    renderDashboard();
    renderPurimGroups();
    showToast("הסכומים נשמרו בהצלחה!", "success");
    if (window.SB && SB.isLoggedIn()) SB.saveSettings(state.settings).catch(() => showToast("⚠️ נשמר מקומית אך לא הסתנכרן לשרת", "warning"));
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
      <button onclick="removeExpenseCategory(${i})" title="מחק קטגוריה"><span class="material-icons-regular">close</span></button>
    </span>`).join("");
}

window.addExpenseCategory = function() {
  const input = document.getElementById("new-expense-category");
  const val = (input?.value || "").trim();
  if (!val) return;
  const cats = getExpenseCategories();
  if (cats.includes(val)) { showToast("הקטגוריה כבר קיימת", "danger"); return; }
  cats.push(val);
  state.settings.expenseCategories = cats;
  saveState();
  if (input) input.value = "";
  renderExpenseCategories();
  populateExpenseCategorySelect();
  showToast("✅ הקטגוריה נוספה");
};

window.removeExpenseCategory = function(index) {
  const cats = getExpenseCategories();
  if (cats.length <= 1) { showToast("חייבת להישאר לפחות קטגוריה אחת", "danger"); return; }
  cats.splice(index, 1);
  state.settings.expenseCategories = cats;
  saveState();
  renderExpenseCategories();
  populateExpenseCategorySelect();
};

function populateExpenseCategorySelect() {
  const sel = document.getElementById("expense-category");
  if (!sel) return;
  const cur = sel.value;
  const cats = getExpenseCategories();
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
    return `<div class="health-row ${cls} ${clickable ? "clickable" : ""}" ${clickable ? `onclick="openDataHealthDetail('${r.type}')"` : ""}>
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
    control = `<select class="ui-select" onchange="applyHealthFix('${m.id}','yeshivaType',this.value)">
        <option value="">בחר...</option>
        <option value="חיידר">חיידר</option>
        <option value="ישיבה קטנה">ישיבה קטנה</option>
        <option value="ישיבה גדולה">ישיבה גדולה</option>
        <option value="קיבוץ">קיבוץ</option>
      </select>`;
  } else if (type === "yeshiva") {
    control = `<input type="text" class="ui-input" placeholder="שם הישיבה" id="fix-${m.id}">
      <button class="btn btn-solid-blue fix-save" onclick="applyHealthFix('${m.id}','yeshiva',document.getElementById('fix-${m.id}').value)">שמור</button>`;
  } else if (type === "phone") {
    control = `<input type="text" class="ui-input" placeholder="050-0000000" id="fix-${m.id}" style="direction:ltr;text-align:right;">
      <button class="btn btn-solid-blue fix-save" onclick="applyHealthFix('${m.id}','phone',document.getElementById('fix-${m.id}').value)">שמור</button>`;
  }
  return `<div class="fix-row" id="fixrow-${m.id}">
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
        <button class="btn btn-outline fix-save" onclick="openMemberFromHealth('${m.id}')">פתח פרופיל</button>
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
  // הסרת השורה שתוקנה מהרשימה
  const row = document.getElementById(`fixrow-${memberId}`);
  if (row) row.remove();
  renderDataHealth();
  populateFilters();
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
    const ts = localStorage.getItem("ezer_last_sync");
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
    purimAddresses: state.purimAddresses, settings: state.settings, users: state.users
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
  if (!confirm("ייבוא גיבוי יחליף את כל הנתונים המקומיים הנוכחיים. להמשיך?")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object") throw new Error("invalid");
      if (Array.isArray(data.members)) state.members = data.members.map(m => ({ ...m, yeshivaType: normalizeYeshivaType(m.yeshivaType) }));
      if (Array.isArray(data.donations)) state.donations = data.donations;
      if (Array.isArray(data.expenses)) state.expenses = data.expenses;
      if (Array.isArray(data.purimAddresses)) state.purimAddresses = data.purimAddresses;
      if (data.settings && typeof data.settings === "object") state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      if (Array.isArray(data.users) && data.users.length) state.users = data.users;
      invalidateCache(); saveState(); renderAll(); renderSettings(); populateExpenseCategorySelect();
      showToast("✅ הגיבוי יובא בהצלחה");
    } catch (err) {
      showToast("הקובץ אינו תקין", "danger");
    }
  };
  reader.readAsText(file);
};

window.syncNow = async function() {
  const btn = document.getElementById("btn-sync-now");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="material-icons-regular" style="font-size:16px;vertical-align:middle;">sync</span> מסנכרן...`; }
  await fetchDataFromServer(false);
  if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-icons-regular" style="font-size:16px;vertical-align:middle;">sync</span> סנכרן עכשיו`; }
  renderBackupPanel();
  showToast("✅ הנתונים סונכרנו");
};

async function addUser() {
  // יצירת/עדכון משתמשי התחברות מתבצעת בצד השרת המאובטח (Supabase Auth),
  // ולא ניתן לעשות זאת מהדפדפן עם המפתח הציבורי. מנהל יוצר משתמשים דרך לוח הבקרה.
  showToast("ליצירת משתמש חדש: לוח הבקרה של Supabase → Authentication → Add user. (מטעמי אבטחה אי אפשר מכאן)", "warning");
}

async function deleteUser(username) {
  showToast("למחיקת משתמש: לוח הבקרה של Supabase → Authentication → Users. (מטעמי אבטחה אי אפשר מכאן)", "warning");
}

function renderUsersTable() {
  const tbody = document.getElementById("users-table-body"); if(!tbody) return; tbody.innerHTML = "";
  let usersToRender = (state.users && state.users.length > 0) ? state.users : state.settings.users || DEFAULT_USERS;
  
  usersToRender = usersToRender.filter(u => u && u.username && String(u.username).trim() !== "");

  if (usersToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-cell">אין משתמשים להצגה</td></tr>`;
    return;
  }

  usersToRender.forEach((u) => {
    let perms = []; if(isTrue(u.canEdit)) perms.push("עריכה"); if(isTrue(u.canViewIncome)) perms.push("הכנסות"); if(isTrue(u.canViewExpenses)) perms.push("הוצאות"); if(isTrue(u.canViewGrants)) perms.push("מענקים"); if(isTrue(u.canViewHistory)) perms.push("היסטוריה");
    const username = String(u.username).trim();
    const tr = document.createElement("tr"); 
    tr.style.cursor = "pointer";
    tr.onclick = () => {
      setValue("new-username", username);
      setValue("new-password", String(u.password).trim());
      document.getElementById("perm-edit").checked = isTrue(u.canEdit);
      document.getElementById("perm-income").checked = isTrue(u.canViewIncome);
      document.getElementById("perm-expenses").checked = isTrue(u.canViewExpenses);
      document.getElementById("perm-grants").checked = isTrue(u.canViewGrants);
      document.getElementById("perm-history").checked = isTrue(u.canViewHistory);
      document.getElementById("new-username").focus();
    };

    const nameTd = document.createElement("td");
    nameTd.style.fontWeight = "bold";
    nameTd.textContent = username;

    const permsTd = document.createElement("td");
    permsTd.style.fontSize = "12px";
    permsTd.style.color = "var(--text-secondary)";
    permsTd.textContent = perms.join(" | ") || "ללא הרשאות מיוחדות";

    const actionTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.style.cssText = "padding: 4px 8px; font-size:12px; background:var(--danger); color:#fff;";
    delBtn.textContent = "מחק";
    delBtn.addEventListener("click", (e) => { e.stopPropagation(); deleteUser(username); });
    actionTd.appendChild(delBtn);

    tr.append(nameTd, permsTd, actionTd);
    tbody.appendChild(tr);
  });
}

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
  try { const raw = localStorage.getItem(STORAGE_KEYS.GRANTS_ARCHIVE); state.grantsArchive = (raw && raw !== "undefined" && raw !== "null") ? JSON.parse(raw) : null; } catch (e) { state.grantsArchive = null; }
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

function readStorageArray(key) { try { const raw = localStorage.getItem(key); if (!raw || raw === "undefined" || raw === "null") return []; return JSON.parse(raw) || []; } catch (e) { return []; } }
function readStorageObject(key, fallback) { try { const raw = localStorage.getItem(key); if (!raw || raw === "undefined" || raw === "null") return { ...fallback }; return { ...fallback, ...JSON.parse(raw) }; } catch (e) { return { ...fallback }; } }

function saveState() { 
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(state.members)); 
  localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(state.donations)); 
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses)); 
  localStorage.setItem(STORAGE_KEYS.PURIM, JSON.stringify(state.purimAddresses)); 
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
  if (state.grantsArchive) localStorage.setItem(STORAGE_KEYS.GRANTS_ARCHIVE, JSON.stringify(state.grantsArchive));
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
  const missingTotal = Math.max(0, totalRequired - totalDonations);
  const progress = totalRequired > 0 ? Math.min(100, Math.round((totalDonations / totalRequired) * 100)) : 0;
  const eligibleCount = summaries.filter(row => row.isEligible).length;
  const debtRows = summaries.filter(row => (Number(row.totalDebtFromPast) || 0) > 0);
  
  setText("display-purim-groups", formatCurrency(totalPurim));
  setText("display-members-collection", formatCurrency(totalDonations));
  setText("display-expenses", formatCurrency(totalExpenses));

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
    <button class="dashboard-attention-item" type="button" onclick="openDashboardDrill('${escapeHtml(dashboardJsString(item.drill))}', '${escapeHtml(dashboardJsString(item.category || ""))}')">
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

function renderDashboardMonthBars() {
  const el = document.getElementById("dashboard-month-bars");
  if (!el) return;

  const campaignYear = getCampaignYear();
  const years = HEBREW_YEARS_ORDER.filter(year => {
    const hasDonations = (state.donations || []).some(d => d.year === year);
    const hasExpenses = (state.expenses || []).some(e => e.year === year);
    const hasPurim = getDashboardPurimTotal(year) > 0;
    return hasDonations || hasExpenses || hasPurim || year === campaignYear;
  });
  if (!years.length) years.push(campaignYear);

  const membersIncome = years.map(year => (state.donations || []).filter(d => d.year === year).reduce((sum, d) => sum + (Number(d.amount) || 0), 0));
  const purimIncome = years.map(year => getDashboardPurimTotal(year));
  const expenses = years.map(year => (state.expenses || []).filter(e => e.year === year).reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
  // עלות מענקים מחושבת רק לשנת הפעילות הנוכחית - שחזור אחורה לשנים עברו אינו אמין
  // (getHistoricalStatus מקבע בחורים לחיידר בשנים רחוקות, מה שהופך את כולם ל"זכאים" באופן שגוי)
  const grantsCost = years.map(year => year === campaignYear ? getDashboardGrantCostForMonth(year, 11) : 0);

  const series = [
    { key: "members", label: "בחורים", tone: "members", values: membersIncome },
    { key: "purim", label: "פורים", tone: "purim", values: purimIncome },
    { key: "expenses", label: "הוצאות", tone: "expenses", values: expenses },
    { key: "grants", label: "עלות מענקים", tone: "grants", values: grantsCost }
  ];
  const maxValue = Math.max(1, ...series.flatMap(item => item.values));
  const width = 640;
  const height = 230;
  const padX = 34;
  const padY = 18;
  const chartWidth = width - padX * 2;
  const chartHeight = height - padY * 2;
  const xFor = i => years.length === 1 ? width / 2 : padX + (chartWidth * i / (years.length - 1));
  const yFor = value => padY + chartHeight - (Math.max(0, value) / maxValue) * chartHeight;
  const baseY = padY + chartHeight;
  const areaPath = values => {
    const points = values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" L ");
    return `M ${xFor(0)},${baseY} L ${points} L ${xFor(values.length - 1)},${baseY} Z`;
  };
  const linePath = values => `M ${values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" L ")}`;

  const svgAreas = series.map(item => `
    <path class="dashboard-mountain-area ${item.tone}" d="${areaPath(item.values)}"></path>
    <path class="dashboard-mountain-line ${item.tone}" d="${linePath(item.values)}"></path>
  `).join("");

  const points = series.map(item => item.values.map((value, index) => `
    <circle class="dashboard-mountain-dot ${item.tone}" cx="${xFor(index)}" cy="${yFor(value)}" r="3.5">
      <title>${item.label} ${years[index]}: ${formatCurrency(value)}</title>
    </circle>
  `).join("")).join("");

  const yearLabels = years.map((year, index) => `
    <span style="right:${100 - ((xFor(index) / width) * 100)}%">${year}</span>
  `).join("");

  el.innerHTML = `
    <div class="dashboard-mountain-chart">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="גרף הר גבייה מול הוצאות">
        <line class="dashboard-mountain-axis" x1="${padX}" y1="${baseY}" x2="${width - padX}" y2="${baseY}"></line>
        ${svgAreas}
        ${points}
      </svg>
      <div class="dashboard-mountain-months">${yearLabels}</div>
    </div>
    <div class="dashboard-mountain-legend">
      ${series.map(item => `
        <div class="dashboard-mountain-chip ${item.tone}">
          <span></span>
          <strong>${item.label}</strong>
          <em>${formatCurrency(item.values.reduce((sum, value) => sum + value, 0))}</em>
        </div>
      `).join("")}
    </div>
  `;
}

function getDashboardGrantPackageCost() {
  if (!Array.isArray(GRANTS_PRODUCTS_CONFIG)) return 0;
  return GRANTS_PRODUCTS_CONFIG.reduce((sum, product) => {
    return sum + ((Number(product.orgPrice || product.price) || 0) * (Number(product.qtyPerStudent) || 0));
  }, 0);
}

function getDashboardGrantCostForMonth(currentYear, monthIndex) {
  const packageCost = getDashboardGrantPackageCost();
  if (!packageCost) return 0;

  const summaries = buildActiveMemberSummaries(currentYear);
  const eligibleCount = summaries.filter(member => {
    const collectedUntilMonth = (state.donations || [])
      .filter(d => d.year === currentYear && String(d.memberId).trim() === String(member.id).trim())
      .reduce((sum, d) => {
        const date = d.date ? new Date(d.date) : null;
        if (!date || Number.isNaN(date.getTime()) || date.getMonth() > monthIndex) return sum;
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
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
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
      <button class="dashboard-segment-item" type="button" onclick="openDashboardDrill('segment', '${escapeHtml(dashboardJsString(name))}')">
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

function dashboardJsString(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " ");
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
  return `<button class="dashboard-drill-open-member" type="button" onclick="openDashboardMember('${escapeHtml(dashboardJsString(memberId))}')">פתח כרטיס</button>`;
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
      <button class="modal-close" type="button" onclick="closeDashboardDrill()" aria-label="סגור">
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
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
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
    const totalTarget = items.reduce((sum, row) => sum + (Number(row.currentYearTarget) || 0), 0);
    const totalCollected = items.reduce((sum, row) => sum + (Number(row.collectedThisYear) || 0), 0);
    summaryValue = totalTarget > 0 ? `${Math.round((totalCollected / totalTarget) * 100)}%` : "0%";
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
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
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
          const dateObj = new Date(d.date);
          if (!isNaN(dateObj.getTime())) {
              const month = dateObj.getMonth();
              monthlyData[month] += Number(d.amount) || 0;
          }
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

  // Update yeshiva dropdown based on current text+city filter (excluding yeshiva filter itself)
  const elYeshiva = document.getElementById("filter-members-yeshiva");
  if (elYeshiva) {
    const filteredForYeshiva = allRows.filter(m => {
      const matchGlobal = !term || Object.values(m).join(" ").toLowerCase().includes(term);
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
      const matchGlobal = !term || Object.values(m).join(" ").toLowerCase().includes(term);
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
    const matchGlobal = !term || Object.values(m).join(" ").toLowerCase().includes(term);
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

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span class="material-icons-regular">groups</span><p>אין בחורים התואמים לסינון</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  rows.forEach((row) => {
    const cityDisplay = row.address ? String(row.address).split(',').pop().trim() : "---";
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.dataset.memberId = row.id;
    tr.onclick = () => { if (!state.membersEditMode) loadMemberProfile(row.id); };

    let shiurDisplay = row.shiur || "---";
    if(row.yeshivaType === "חיידר") shiurDisplay = "---";

    // בדיקת פרטים חסרים -> כוכבית אדומה
    const missing = [];
    if (!String(row.yeshivaType || "").trim()) missing.push("סוג מסגרת");
    if (!String(row.yeshiva || "").trim()) missing.push("ישיבה");
    if (!String(row.phone || "").trim()) missing.push("טלפון");
    if (!String(row.address || "").trim()) missing.push("כתובת");
    const star = missing.length ? `<span class="missing-star" title="חסר: ${escapeHtml(missing.join(", "))}">*</span>` : "";

    tr.innerHTML = `<td data-field="firstName">${escapeHtml(row.firstName)}${star}</td><td data-field="lastName">${escapeHtml(row.lastName)}</td><td data-field="fatherName">${escapeHtml(row.fatherName || "---")}</td><td data-field="yeshiva">${escapeHtml(row.yeshiva)}</td><td data-field="shiur">${escapeHtml(shiurDisplay)}</td><td>${escapeHtml(cityDisplay)}</td><td class="amount-cell" style="font-weight: bold; color: var(--gold-dark);">${escapeHtml(formatCurrency(row.collectedThisYear))}</td>`;
    tbody.appendChild(tr);
  });

  // אם היינו במצב עריכה - לשמר אותו אחרי רינדור מחדש
  if (state.membersEditMode) {
    tbody.querySelectorAll(".missing-star").forEach(s => s.remove());
    tbody.querySelectorAll("td[data-field]").forEach(td => td.setAttribute("contenteditable", "true"));
  }
}

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
  trs.forEach(tr => {
    const member = state.members.find(m => String(m.id).trim() === String(tr.dataset.memberId).trim());
    if (!member) return;
    tr.querySelectorAll("td[data-field]").forEach(td => {
      const field = td.dataset.field;
      const starEl = td.querySelector(".missing-star");
      if (starEl) starEl.remove();
      let val = (td.textContent || "").trim();
      if (val === "---") val = "";
      const oldVal = String(member[field] || "").trim();
      if (val !== oldVal) { member[field] = val; changed++; }
    });
  });
  exitMembersEditMode();
  if (changed > 0) {
    invalidateCache();
    saveState();
    populateFilters();
    renderMembersTable();
    showToast(`✅ נשמרו ${changed} שינויים`);
  } else {
    renderMembersTable();
  }
};

function renderDailyReport() {
    const incTbody = document.getElementById("report-income-tbody");
    const expTbody = document.getElementById("report-expense-tbody");
    if (!incTbody || !expTbody) return;

    const filterVal = document.getElementById("report-time-filter")?.value || "today";
    const customDate = document.getElementById("report-custom-date")?.value;
    
    const isDateMatch = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d)) return false;
        
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        
        const dStr = d.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (filterVal === "today") return dStr === todayStr;
        if (filterVal === "yesterday") return dStr === yesterdayStr;
        if (filterVal === "week") {
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return d >= weekStart;
        }
        if (filterVal === "custom") return dStr === customDate;
        
        return true; 
    };

    let totalInc = 0;
    let incHtml = "";
    const summaries = getMemberSummaries();
    const summaryById = new Map(summaries.map(m => [String(m.id).trim(), m]));
    const filteredDonations = state.donations.filter(d => isDateMatch(d.date) && d.year === getCampaignYear());
    
    if (filteredDonations.length === 0) {
        incHtml = `<tr><td colspan="3" class="empty-cell" style="padding:20px!important;">אין הכנסות לתקופה זו</td></tr>`;
    } else {
        filteredDonations.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).forEach(d => {
            const member = summaryById.get(String(d.memberId).trim());
            const name = member ? member.fullName : d.memberNameSnapshot;
            const amt = Number(d.amount) || 0;
            totalInc += amt;
            
            incHtml += `<tr>
                <td>${escapeHtml(formatDateDisplay(d.date))}</td>
                <td><strong>${escapeHtml(name)}</strong><br><span style="font-size:11px;color:var(--text-secondary);">${escapeHtml(d.notes)}</span></td>
                <td class="amount-cell" style="font-weight: bold; color: var(--success);">${escapeHtml(formatCurrency(amt))}</td>
            </tr>`;
        });
    }

    let totalExp = 0;
    let expHtml = "";
    const filteredExpenses = state.expenses.filter(e => isDateMatch(e.date) && e.year === getCampaignYear());

    if (filteredExpenses.length === 0) {
        expHtml = `<tr><td colspan="3" class="empty-cell" style="padding:20px!important;">אין הוצאות לתקופה זו</td></tr>`;
    } else {
        filteredExpenses.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).forEach(e => {
            const amt = Number(e.amount) || 0;
            totalExp += amt;
            
            expHtml += `<tr>
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
  const incomeThisYear = state.donations.filter(d => d.year === currentYear).reduce((s, d) => s + (Number(d.amount) || 0), 0);

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
  setText("exp-kpi-avg", formatCurrency(totalThisYear / 12));
  setText("exp-kpi-count", `${curExpenses.length} תנועות`);

  // KPI: יחס מההכנסות
  const ratio = incomeThisYear > 0 ? Math.round(totalThisYear / incomeThisYear * 100) : 0;
  setText("exp-kpi-ratio", `${ratio}%`);
  setText("exp-kpi-ratio-hint", incomeThisYear > 0 ? `מכל ₪100 שנאספו → ₪${ratio} הוצאות` : "אין הכנסות רשומות");

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

function renderEligibilityTable() {
  const tbody = document.getElementById("eligibility-table-body"); if (!tbody) return;
  const rows = applyGlobalSearch(getMemberSummaries());
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span class="material-icons-regular">rule</span><p>אין נתונים לבדיקת זכאות</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = "";
  rows.forEach((row) => { 
    const req = row.totalRequiredThisYear; const col = row.collectedThisYear;
    let percent = req > 0 ? Math.floor((col / req) * 100) : 100; if (percent > 100) percent = 100;
    const progressHtml = `<div style="display:flex; align-items:center; gap:8px;"><div style="width:60px; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;"><div style="width:${percent}%; height:100%; background:${percent === 100 ? 'var(--success)' : 'var(--gold-main)'};"></div></div><span style="font-size:11px; color:var(--text-secondary);">${percent}%</span></div>`;
    const tr = document.createElement("tr"); 
    tr.innerHTML = `<td>${escapeHtml(row.fullName)}</td><td class="amount-cell">${escapeHtml(formatCurrency(row.currentYearTarget))}</td><td class="amount-cell" style="font-weight:bold;">${escapeHtml(formatCurrency(row.totalRequiredThisYear))}</td><td class="amount-cell" style="color: var(--success); font-weight:bold;">${escapeHtml(formatCurrency(row.collectedThisYear))}</td><td>${progressHtml}</td><td>${renderStatusBadge(row.statusLabel, row.statusType)}</td>`; tbody.appendChild(tr); 
  });
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

// מחירון מוצרים לפי האקסל: מחיר בחנות מול מחיר לארגון.
const GRANTS_PRODUCTS_CONFIG = [
  { store: "רויאל קולב", name: "חליפה 3 חלקים ביטנה מלאה", storePrice: 1375, orgPrice: 1031.25, price: 1031.25, qtyPerStudent: 1 },
  { store: "רויאל קולב", name: "חליפה 3 חלקים חצי ביטנה", storePrice: 935, orgPrice: 654, price: 654, qtyPerStudent: 1 },
  { store: "רויאל קולב", name: "בעקיטשע חלק ביטנה מלאה", storePrice: 1095, orgPrice: 821.25, price: 821.25, qtyPerStudent: 1 },
  { store: "רויאל קולב", name: "בעקיטשע פירחוני ביטנה מלאה", storePrice: 850, orgPrice: 637.5, price: 637.5, qtyPerStudent: 2 },
  { store: "רויאל קולב", name: "מכנס שחור פולייסטר", storePrice: 170, orgPrice: 127.5, price: 127.5, qtyPerStudent: 3 },
  { store: "רויאל כללי", name: "חגורה יוקרתית מעור", storePrice: 59, orgPrice: 50.15, price: 50.15, qtyPerStudent: 1 },
  { store: "רויאל כללי", name: "גרביים", storePrice: 13.9, orgPrice: 11.815, price: 11.815, qtyPerStudent: 9 },
  { store: "רויאל כללי", name: "חולצות", storePrice: 135, orgPrice: 110, price: 110, qtyPerStudent: 8 },
  { store: "רויאל כללי", name: "סוודר", storePrice: 110, orgPrice: 90, price: 90, qtyPerStudent: 1 },
  { store: "רויאל כללי", name: "הלבשה אישית", storePrice: 64.9, orgPrice: 55.165, price: 55.165, qtyPerStudent: 4 },
  { store: "רויאל כללי", name: "גופיות", storePrice: 30, orgPrice: 25.5, price: 25.5, qtyPerStudent: 8 },
  { store: "רויאל כללי", name: "כיפות", storePrice: 24, orgPrice: 20.4, price: 20.4, qtyPerStudent: 2 },
  { store: "רויאל כללי", name: "טלית קטן צמר", storePrice: 117, orgPrice: 99.45, price: 99.45, qtyPerStudent: 2 },
  { store: "רויאל כללי", name: "פיגמה", storePrice: 85, orgPrice: 72.25, price: 72.25, qtyPerStudent: 1 },
  { store: "סטייל שיך", name: "זיכוי נעלי יום חול", storePrice: 250, orgPrice: 212.5, price: 212.5, qtyPerStudent: 1 },
  { store: "סטייל שיך", name: "זיכוי נעלי שבת", storePrice: 250, orgPrice: 212.5, price: 212.5, qtyPerStudent: 1 },
  { store: "אווניו 13", name: "מגבת ידיים 50/90", storePrice: 33, orgPrice: 28.05, price: 28.05, qtyPerStudent: 4 },
  { store: "אווניו 13", name: "מגבת רחצה 90/130", storePrice: 66, orgPrice: 56.1, price: 56.1, qtyPerStudent: 4 },
  { store: "אווניו 13", name: "מגבת מטבח", storePrice: 16, orgPrice: 13.6, price: 13.6, qtyPerStudent: 4 },
  { store: "אווניו 13", name: "זיכוי לקניית מצעים", storePrice: 400, orgPrice: 340, price: 340, qtyPerStudent: 0 },
  { store: "סאפרים", name: "כובע חסידי", storePrice: 1500, orgPrice: 1450, price: 1450, qtyPerStudent: 1 }
];

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

function getGrantPackageTotal(packageGroups) {
  return (packageGroups || []).reduce((sum, group) => {
    return sum + (group.items || []).reduce((inner, item) => inner + (Number(item.value) || 0), 0);
  }, 0);
}

function getGrantPerGroomValue(archive, year) {
  const yearData = archive.years && archive.years[year] ? archive.years[year] : {};
  const explicit = Number(yearData.perGroomValue || archive.perGroomValue || 0);
  if (explicit > 0) return explicit;
  return getGrantPackageTotal(getGrantPackageForYear(archive, year));
}

function getGrantPaymentProductsForYear(archive, year) {
  const yearData = archive.years && archive.years[year] ? archive.years[year] : {};
  const source = Array.isArray(yearData.paymentProducts)
    ? yearData.paymentProducts
    : (Array.isArray(archive.paymentProducts) ? archive.paymentProducts : GRANTS_PRODUCTS_CONFIG);

  return source.map((item) => ({
    store: item.store || "ללא חנות",
    name: item.name || "",
    qtyPerStudent: Number(item.qtyPerStudent || item.qty || 0),
    storePrice: Number(item.storePrice || item.retailPrice || 0),
    orgPrice: Number(item.orgPrice || item.price || item.value || 0)
  }));
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
    exportToCSV("grants-payments-tbody", `תשלומים_חנויות_${year}`);
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
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return escapeHtml(dateStr);
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
  const perGroom = getGrantPerGroomValue(archive, activeYear);
  const products = getGrantPaymentProductsForYear(archive, activeYear);
  const payments = getGrantPaymentsForYear(archive, activeYear);
  const paymentsTotal = payments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  // --- כפתורי שנים ---
  const yearsEl = document.getElementById("grants-archive-years");
  if (yearsEl) {
    yearsEl.innerHTML = years.map(y => `
      <button type="button" class="grants-year-pill${y === activeYear ? " active" : ""}" onclick="selectGrantsArchiveYear('${escapeHtml(dashboardJsString(y))}')">
        <span class="grants-year-pill-name">${escapeHtml(y)}</span>
        <span class="grants-year-pill-count">${(archive.years[y].recipients || []).length} מקבלים</span>
      </button>`).join("")
      + `<button type="button" class="grants-year-pill grants-year-pill--add" onclick="addGrantsArchiveYear()" title="הוספת שנה"><span class="material-icons-regular">add</span><span class="grants-year-pill-count">הוסף שנה</span></button>`;
  }

  // --- כרטיסי נתונים ---
  const statsEl = document.getElementById("grants-archive-stats");
  if (statsEl) {
    statsEl.innerHTML = [
      { icon: "groups", label: "מקבלי מענק", value: recipientsCount.toLocaleString("he-IL"), tone: "info" },
      { icon: "redeem", label: "שווי מענק לחתן", value: formatCurrency(perGroom), tone: "gold" },
      { icon: "payments", label: "שולם בפועל", value: formatCurrency(paymentsTotal), tone: "success" }
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
          <td class="no-export" style="text-align:center;"><button class="grants-archive-del" title="הסר" onclick="removeGrantsArchiveRecipient(${i})"><span class="material-icons-regular">close</span></button></td>
        </tr>`).join("");
    }
  }

  // --- תכולת החבילה ---
  const pkgTotalEl = document.getElementById("grants-archive-pkg-total");
  if (pkgTotalEl) pkgTotalEl.textContent = formatCurrency(perGroom);
  const pkgEl = document.getElementById("grants-archive-package");
  if (pkgEl) {
    pkgEl.innerHTML = packageGroups.length ? packageGroups.map(group => {
      const items = group.items || [];
      const groupTotal = items.reduce((s, it) => s + (Number(it.value) || 0), 0);
      return `
        <div class="grants-pkg-group">
          <div class="grants-pkg-group-head">
            <span>${escapeHtml(group.store)}${group.discount ? ` · הנחה ${escapeHtml(group.discount)}` : ""}</span>
            <strong>${formatCurrency(groupTotal)}</strong>
          </div>
          ${items.map(it => `
            <div class="grants-pkg-item">
              <span>${escapeHtml(it.name)}${it.qty > 1 ? ` <em>×${it.qty}</em>` : ""}</span>
              <span class="grants-pkg-prices">
                <small>בחנות ${formatCurrency(it.storePrice || 0)}</small>
                <strong>לארגון ${formatCurrency(it.orgPrice || it.value)}</strong>
              </span>
            </div>`).join("")}
        </div>`;
    }).join("") : `<div class="empty-state" style="padding:28px 12px;">אין עדיין פירוט תכולת מענק לשנה זו</div>`;
  }

  // --- תשלומים בפועל לפי חנות ---
  const paymentsTbody = document.getElementById("grants-payments-tbody");
  if (paymentsTbody) {
    paymentsTbody.innerHTML = payments.length ? payments.map(payment => `
      <tr>
        <td style="font-weight:700;">${escapeHtml(payment.store || "—")}</td>
        <td>${escapeHtml(payment.date || "—")}</td>
        <td>${escapeHtml(payment.description || "—")}</td>
        <td>${escapeHtml(payment.method || "—")}</td>
        <td class="amount-cell" style="font-weight:800;">${formatCurrency(payment.amount)}</td>
      </tr>`).join("") : `<tr><td colspan="5"><div class="empty-state">אין עדיין תשלומים בפועל בשנה זו</div></td></tr>`;
  }
  const paymentsTotalEl = document.getElementById("grants-payments-total");
  if (paymentsTotalEl) {
    paymentsTotalEl.textContent = formatCurrency(paymentsTotal);
  }

  const productsTbody = document.getElementById("grants-payment-products-tbody");
  if (productsTbody) {
    productsTbody.innerHTML = products.length ? products.map((prod) => {
      return `
        <tr>
          <td style="font-weight:700;">${escapeHtml(prod.store)}</td>
          <td>${escapeHtml(prod.name)}</td>
          <td style="text-align:center; font-weight:800;">${(Number(prod.qtyPerStudent) || 0).toLocaleString("he-IL")}</td>
          <td class="amount-cell">${formatCurrency(prod.storePrice)}</td>
          <td class="amount-cell" style="font-weight:800;">${formatCurrency(prod.orgPrice)}</td>
        </tr>`;
    }).join("") : `<tr><td colspan="5"><div class="empty-state">אין עדיין פירוט מוצרים לשנה זו</div></td></tr>`;
  }
}

window.selectGrantsArchiveYear = function(year) {
  state.grantsArchiveYear = year;
  toggleGrantsAddForm(false);
  renderGrantsArchive();
};

window.toggleGrantsAddForm = function(show) {
  const form = document.getElementById("grants-archive-add-form");
  if (!form) return;
  const willShow = (show === undefined) ? form.classList.contains("hidden") : show;
  form.classList.toggle("hidden", !willShow);
  if (willShow) {
    const nameEl = document.getElementById("grants-add-name");
    if (nameEl) nameEl.focus();
  }
};

window.submitGrantPayment = function() {
  const store = (document.getElementById("grants-payment-store")?.value || "").trim();
  const date = (document.getElementById("grants-payment-date")?.value || "").trim();
  const description = (document.getElementById("grants-payment-description")?.value || "").trim();
  const method = (document.getElementById("grants-payment-method")?.value || "").trim();
  const amountRaw = (document.getElementById("grants-payment-amount")?.value || "").trim();
  const amount = Number(amountRaw);

  if (!store || !amountRaw || !Number.isFinite(amount) || amount <= 0) {
    showToast("יש להזין חנות וסכום תשלום תקין", "danger");
    return;
  }

  const archive = ensureEditableArchive();
  const year = state.grantsArchiveYear || getCampaignYear();
  if (!archive.years[year]) archive.years[year] = { recipients: [] };
  if (!Array.isArray(archive.years[year].payments)) archive.years[year].payments = [];

  archive.years[year].payments.push({
    store,
    date,
    description: description || "תשלום בפועל",
    method,
    amount
  });

  saveState();
  ["grants-payment-store", "grants-payment-date", "grants-payment-description", "grants-payment-method", "grants-payment-amount"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderGrantsArchive();
  renderDashboard();
  showToast("התשלום נוסף");
};

function syncGrantsArchiveToServer() {
  if (window.SB && SB.isLoggedIn()) SB.saveGrantsArchive(state.grantsArchive).catch(() => showToast("⚠️ נשמר מקומית אך לא הסתנכרן לשרת", "warning"));
}

window.submitGrantsAddRecipient = function() {
  const name = (document.getElementById("grants-add-name")?.value || "").trim();
  const id = (document.getElementById("grants-add-id")?.value || "").trim();
  const phone = (document.getElementById("grants-add-phone")?.value || "").trim();
  const date = (document.getElementById("grants-add-date")?.value || "").trim();

  if (!name && !id) {
    showToast("יש להזין לפחות שם או תעודת זהות", "danger");
    return;
  }

  const archive = ensureEditableArchive();
  const year = state.grantsArchiveYear;
  if (!archive.years[year]) archive.years[year] = { recipients: [] };
  if (!Array.isArray(archive.years[year].recipients)) archive.years[year].recipients = [];

  const rec = {};
  if (name) rec.name = name;
  if (id) rec.id = id;
  if (phone) rec.phone = phone;
  if (date) rec.date = date;
  archive.years[year].recipients.push(rec);

  saveState();
  syncGrantsArchiveToServer();
  ["grants-add-name", "grants-add-id", "grants-add-phone", "grants-add-date"].forEach(elId => { const el = document.getElementById(elId); if (el) el.value = ""; });
  renderGrantsArchive();
  renderDashboard();
  showToast("✅ החתן נוסף לרשימת מקבלי המענק");
};

window.removeGrantsArchiveRecipient = function(index) {
  const archive = getGrantsArchive();
  const year = state.grantsArchiveYear;
  const list = archive.years[year] && archive.years[year].recipients;
  if (!list || !list[index]) return;
  const label = list[index].name || list[index].id || "רשומה זו";
  if (!confirm(`להסיר את ${label} מרשימת מקבלי המענק לשנת ${year}?`)) return;
  ensureEditableArchive().years[year].recipients.splice(index, 1);
  saveState();
  syncGrantsArchiveToServer();
  renderGrantsArchive();
  renderDashboard();
  showToast("הרשומה הוסרה");
};

window.addGrantsArchiveYear = function() {
  const archive = getGrantsArchive();
  const existing = Object.keys(archive.years);
  const options = (typeof HEBREW_YEARS_ORDER !== "undefined" ? HEBREW_YEARS_ORDER : []).filter(y => !existing.includes(y));
  const promptText = `הזן את שם השנה החדשה (לדוגמה: תשפ"ז)${options.length ? "\nשנים פנויות: " + options.join(", ") : ""}`;
  const input = prompt(promptText, options[options.length - 1] || "");
  if (input === null) return;
  const year = input.trim();
  if (!year) return;
  const edit = ensureEditableArchive();
  if (edit.years[year]) { state.grantsArchiveYear = year; renderGrantsArchive(); showToast("השנה כבר קיימת - עברת אליה", "danger"); return; }
  edit.years[year] = { recipients: [] };
  state.grantsArchiveYear = year;
  saveState();
  syncGrantsArchiveToServer();
  renderGrantsArchive();
  toggleGrantsAddForm(true);
  showToast(`נוספה שנת ${year} - הוסף כעת מקבלי מענק`);
};

window.exportGrantsArchiveRecipients = function() {
  exportToCSV("grants-archive-recipients-tbody", `מקבלי_מענק_${(state.grantsArchiveYear || "").replace(/"/g, "")}`);
};


// עיצוב משופר לתגיות הסטטוס מבוסס משתני השקיפות
function renderStatusBadge(label, type) {
    return `<span style="background: rgba(var(--${type}-rgb), 0.1); color: var(--${type}); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1px solid rgba(var(--${type}-rgb), 0.2);">${escapeHtml(label)}</span>`;
}


function renderPurimGroups() {
    const container = document.getElementById("purim-tabs-container"); 
    if (!container) return;
    container.innerHTML = ""; 

    const currentYear = getCampaignYear();
    
    const allPossibleYears = ['תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט', 'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט', 'תש"צ'];
    let currentIdx = allPossibleYears.indexOf(currentYear);
    if (currentIdx === -1) currentIdx = allPossibleYears.indexOf('תשפ"ו');
    const allYears = allPossibleYears.slice(Math.max(0, currentIdx - 7), currentIdx + 1);
    const yearsToShow = state.purimShowAllYears ? allYears : allYears.slice(-4);

    const citiesMap = state.purimAddresses.reduce((acc, row) => {
        const city = String(row["עיר"] || "ללא עיר").trim();
        const group = String(row["קבוצה"] || "ללא שיוך").trim();
        if (!acc[city]) acc[city] = {};
        if (!acc[city][group]) acc[city][group] = [];
        acc[city][group].push(row);
        return acc;
    }, {});

    const citiesNav = document.createElement("div");
    citiesNav.className = "purim-cities-nav";
    citiesNav.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; overflow-x: auto;";


    const groupsNavContainer = document.createElement("div");
    groupsNavContainer.className = "purim-groups-nav-container";

    const contentContainer = document.createElement("div");
    contentContainer.className = "purim-content-container";

    let isFirstCity = true;

    for (const [cityName, groups] of Object.entries(citiesMap)) {
        const cityBtn = document.createElement("button");
        cityBtn.className = `btn ${isFirstCity ? "btn-solid-blue" : "btn-outline"}`;
        cityBtn.innerText = cityName;

        const groupNav = document.createElement("div");
        groupNav.className = "purim-groups-nav";
        groupNav.style.cssText = `display: ${isFirstCity ? "flex" : "none"};`; // העיצוב ירש מה-CSS המשופר ל-flex

        const cityContent = document.createElement("div");
        cityContent.className = "purim-city-content";
        cityContent.style.cssText = `display: ${isFirstCity ? "block" : "none"};`;

        let isFirstGroup = true;

        for (const [groupName, addresses] of Object.entries(groups)) {
            const groupBtn = document.createElement("button");
            groupBtn.className = `purim-tab-btn ${isFirstGroup ? "active" : ""}`;
            groupBtn.innerText = `${groupName} (${addresses.length})`; 
            
            const groupPane = document.createElement("div");
            groupPane.className = `purim-tab-pane ${isFirstGroup ? "active" : ""}`;
            
            const citySafe = escapeHtml(cityName);
            const groupSafe = escapeHtml(groupName);

            // --- בניית אזור הסכומים (תצוגה בלבד - העריכה עברה להגדרות המערכת) ---
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
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:var(--surface-light); padding:7px 12px; border-radius:8px; margin-bottom:10px; border:1px solid var(--border-color);">
                    <span style="font-size:11px; font-weight:700; color:var(--text-muted); white-space:nowrap; text-transform:uppercase; letter-spacing:0.4px;">סכומים סופיים</span>
                    <div id="sums-display-${citySafe}-${groupSafe}" style="display:flex; gap:6px; flex-wrap:wrap; flex:1; overflow-x:auto;">${sumsInner}</div>
                    <div style="display:flex; gap:5px; flex-shrink:0; align-items:center; flex-wrap:wrap;">
                        <button class="purim-action-btn" id="edit-group-btn-${citySafe}-${groupSafe}" onclick="togglePurimGroupEdit('${citySafe}', '${groupSafe}')">
                            <span class="material-icons-regular" style="font-size:14px;">edit</span> מצב עריכה
                        </button>
                        <button class="purim-action-btn" onclick="printPurimGroup('${citySafe}', '${groupSafe}')" title="הדפסה">
                            <span class="material-icons-regular" style="font-size:14px;">print</span>
                        </button>
                        <button class="purim-action-btn" onclick="exportPurimGroupToExcel('${citySafe}', '${groupSafe}')" title="הורדה לאקסל">
                            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#217346"/><path d="M13 6h6v2h-6V6zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z" fill="#fff" opacity=".6"/><path d="M5 6l3 5-3 5h2.5l1.8-3.2L11 16h2.5l-3-5 3-5H11L9.3 9.2 7.5 6H5z" fill="#fff"/></svg>
                        </button>
                        <button class="purim-action-btn" id="purim-spacing-btn-${citySafe}-${groupSafe}" onclick="togglePurimSpacing(this, '${citySafe}', '${groupSafe}')">
                            <span class="material-icons-regular" style="font-size:14px;">density_large</span> רווח
                        </button>
                        <button class="purim-action-btn" onclick="togglePurimYears()">
                            <span class="material-icons-regular" style="font-size:14px;">${state.purimShowAllYears ? 'unfold_less' : 'unfold_more'}</span>
                            ${state.purimShowAllYears ? 'פחות שנים' : 'כל השנים'}
                        </button>
                    </div>
                </div>
            `;

            let tableHtml = `
                <div class="table-container">
                    <table class="data-table compact-view" data-export-id="${citySafe}-${groupSafe}">
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

            const td = (row, field, isBold=false, extraStyle="") => {
                const val = escapeHtml(row[field] || "");
                const idSafe = escapeHtml(row["מס'"] || "");
                const bold1 = isBold ? "<strong>" : "";
                const bold2 = isBold ? "</strong>" : "";
                return `<td data-id="${idSafe}" data-field="${field}" style="transition: all 0.3s; ${extraStyle}">${bold1}${val}${bold2}</td>`;
            };

            addresses.forEach(row => {
                const idSafe = escapeHtml(row["מס'"] || "");
                tableHtml += `
                    <tr>
                        <td>${idSafe}</td>
                        ${td(row, "משפחה", true)}
                        ${td(row, "שם")}
                        ${td(row, "רחוב")}
                        ${td(row, "מספר")}
                        ${td(row, "דירה")}
                `;
                
                yearsToShow.forEach(y => {
                    if (y === currentYear) {
                        tableHtml += td(row, y, false, "color: var(--gold-dark); font-weight: bold; background: rgba(212, 175, 55, 0.05);");
                    } else {
                        tableHtml += td(row, y, false, "color: var(--text-secondary);");
                    }
                });

                tableHtml += `
                        ${td(row, "הערות")}
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
            });

            groupNav.appendChild(groupBtn);
            cityContent.appendChild(groupPane);
            isFirstGroup = false;
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
        });

        citiesNav.appendChild(cityBtn);
        groupsNavContainer.appendChild(groupNav);
        contentContainer.appendChild(cityContent);
        
        isFirstCity = false;
    }

    container.appendChild(citiesNav);
    container.appendChild(groupsNavContainer);
    container.appendChild(contentContainer);
}



let purimEditSnapshot = null;


window.togglePurimGroupEdit = async function(city, group) {
    const citySafe = escapeHtml(city);
    const groupSafe = escapeHtml(group);
    
    const table = document.querySelector(`table[data-export-id="${citySafe}-${groupSafe}"]`);
    const btn = document.getElementById(`edit-group-btn-${citySafe}-${groupSafe}`);
    
    if (!table || !btn) return;

    const isEditing = table.classList.contains("editing-mode");

    if (!isEditing) {
        purimEditSnapshot = JSON.parse(JSON.stringify(state.purimAddresses));
        table.classList.add("editing-mode");
        
        btn.outerHTML = `
            <button class="purim-action-btn" id="cancel-group-btn-${citySafe}-${groupSafe}" onclick="cancelPurimGroupEdit('${citySafe}', '${groupSafe}')" style="border-color:#dc2626; color:#dc2626;">
                <span class="material-icons-regular" style="font-size:14px;">close</span> ביטול
            </button>
            <button class="purim-action-btn" id="edit-group-btn-${citySafe}-${groupSafe}" onclick="togglePurimGroupEdit('${citySafe}', '${groupSafe}')" style="border-color:#16a34a; color:#15803d; background:#f0fdf4;">
                <span class="material-icons-regular" style="font-size:14px;">save</span> שמור
            </button>
        `;
        
        table.querySelectorAll("td[data-field]").forEach(td => {
            td.setAttribute("contenteditable", "true");
            td.style.background = "#ffffff";
            td.style.border = "1px solid var(--gold-main)";
            td.style.transition = "transform 0.1s";
            td.addEventListener('focus', function() { this.style.transform = "scale(0.99)"; });
            td.addEventListener('blur', function() { this.style.transform = "scale(1)"; });
        });
    } else {
        const newBtn = document.getElementById(`edit-group-btn-${citySafe}-${groupSafe}`);
        const cancelBtn = document.getElementById(`cancel-group-btn-${citySafe}-${groupSafe}`);
        newBtn.innerHTML = "⏳ שומר...";
        newBtn.disabled = true;
        if(cancelBtn) cancelBtn.style.display = "none";
        
        let changedRows = [];

        const purimMap = new Map();
        state.purimAddresses.forEach((row, idx) => {
            if (String(row["עיר"]).trim() === city && String(row["קבוצה"]).trim() === group) {
                purimMap.set(String(row["מס'"]).trim(), idx);
            }
        });

        table.querySelectorAll("tbody tr").forEach(tr => {
            const tds = tr.querySelectorAll("td[data-field]");
            if(tds.length === 0) return;
            
            const id = tds[0].getAttribute("data-id");
            const rowIndex = purimMap.get(id);

            if (rowIndex !== undefined) {
                const currentRow = state.purimAddresses[rowIndex];
                let rowChanged = false;

                tds.forEach(td => {
                    const field = td.getAttribute("data-field");
                    let newVal = td.innerText.replace(/<\/?[^>]+(>|$)/g, "").trim(); 
                    
                    if (String(currentRow[field] || "").trim() !== newVal) {
                        currentRow[field] = newVal;
                        rowChanged = true;
                    }
                    
                    td.setAttribute("contenteditable", "false");
                    td.style.background = "";
                    td.style.border = "";
                    if (field === "משפחה") td.innerHTML = `<strong>${escapeHtml(newVal)}</strong>`;
                    else td.innerText = newVal;
                });

                if (rowChanged) {
                    changedRows.push(currentRow);
                }
            }
        });

        table.classList.remove("editing-mode");
        
        newBtn.parentElement.innerHTML = `
            <button class="purim-action-btn" id="edit-group-btn-${citySafe}-${groupSafe}" onclick="togglePurimGroupEdit('${citySafe}', '${groupSafe}')">
                <span class="material-icons-regular" style="font-size:14px;">edit</span> מצב עריכה
            </button>
        `;

        if (changedRows.length > 0) {
            saveState();
            
            try {
                table.style.opacity = "0.5";
                await Promise.all(changedRows.map(row => SB.savePurim(row)));
                table.style.opacity = "1";
                showToast(`נשמרו בהצלחה ${changedRows.length} שורות!`, "success");
            } catch (err) {
                table.style.opacity = "1";
                showToast("שגיאה בשמירת הנתונים לשרת", "danger");
            }
        } else {
            showToast("לא בוצעו שינויים", "success");
        }
    }
};




window.cancelPurimGroupEdit = function(citySafe, groupSafe) {
    if (purimEditSnapshot) {
        state.purimAddresses = JSON.parse(JSON.stringify(purimEditSnapshot));
        purimEditSnapshot = null;
        renderPurimGroups(); 
        showToast("השינויים בוטלו בהצלחה.", "success");
    }
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

window.togglePurimSpacing = function(btn, citySafe, groupSafe) {
    const table = document.querySelector(`table[data-export-id="${citySafe}-${groupSafe}"]`);
    if (!table) return;
    const isCompact = table.classList.contains('compact-view');
    table.classList.toggle('compact-view');
    const icon = btn.querySelector('.material-icons-regular');
    if (icon) icon.textContent = isCompact ? 'density_small' : 'density_large';
    btn.childNodes[btn.childNodes.length - 1].textContent = isCompact ? ' צפוף' : ' רווח';
};

window.printPurimGroup = function(citySafe, groupSafe) {
    const table = document.querySelector(`table[data-export-id="${citySafe}-${groupSafe}"]`);
    if (!table) return;
    const win = window.open('', '_blank');
    win.document.write(`
        <html dir="rtl"><head><meta charset="UTF-8"><title>תרומות פורים — ${citySafe} / ${groupSafe}</title>
        <style>
            body { font-family: Arial, sans-serif; direction: rtl; font-size: 12px; color: #111; }
            h2 { font-size: 15px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: right; }
            th { background: #f0f0f0; font-weight: bold; }
            tr:nth-child(even) td { background: #fafafa; }
            @media print { body { margin: 0; } }
        </style></head><body>
        <h2>תרומות פורים — ${escapeHtml(citySafe)} / ${escapeHtml(groupSafe)}</h2>
        ${table.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body></html>`);
    win.document.close();
};

window.exportPurimGroupToExcel = function(citySafe, groupSafe) {
    const table = document.querySelector(`table[data-export-id="${citySafe}-${groupSafe}"]`);
    if (!table) return;

    const cloneTable = table.cloneNode(true);
    cloneTable.style.borderCollapse = "collapse";
    cloneTable.style.fontFamily = "Arial, Helvetica, sans-serif";
    cloneTable.style.direction = "rtl";

    const cells = cloneTable.querySelectorAll('td, th');
    cells.forEach(cell => {
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

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `תרומות_פורים_${citySafe}_${groupSafe}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

function exportToCSV(tableBodyId, filename) {
  const tbody = document.getElementById(tableBodyId); if (!tbody) return; const table = tbody.closest("table"); let csv = []; const rows = table.querySelectorAll("tr");
  for (let i = 0; i < rows.length; i++) { let row = [], cols = rows[i].querySelectorAll("td, th"); for (let j = 0; j < cols.length; j++) { if (cols[j].classList.contains("no-export")) continue; let data = cols[j].innerText.replace(/"/g, '""'); data = data.replace(/₪/g, ''); row.push('"' + data.trim() + '"'); } if (!rows[i].querySelector('.empty-state')) { csv.push(row.join(",")); } }
  const BOM = "\uFEFF"; const csvFile = new Blob([BOM + csv.join("\n")], {type: "text/csv;charset=utf-8;"}); const downloadLink = document.createElement("a"); downloadLink.download = `${filename}_${getTodayIsoDate()}.csv`; downloadLink.href = window.URL.createObjectURL(csvFile); downloadLink.style.display = "none"; document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
}

function applyGlobalSearch(rows) { const term = state.globalSearchTerm; if (!term) return rows; return rows.filter((row) => { return Object.values(row).join(" ").toLowerCase().includes(term); }); }

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

function formatCurrency(value) { 
  return `₪${(Number(value) || 0).toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; 
}

function getTodayIsoDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatDateDisplay(val) { if (!val) return ""; const d = new Date(val); return Number.isNaN(d.getTime()) ? val : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; }
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

    let statusLabel, statusType;
    if (isEligible && totalDebtFromPast === 0) { statusLabel = "זכאי למענק"; statusType = "success"; }
    else if (totalDebtFromPast > 0 && !isEligible) { statusLabel = "חוב פתוח"; statusType = "danger"; }
    else if (isEligible) { statusLabel = "זכאי למענק"; statusType = "success"; }
    else if (collectedThisYear > 0) { statusLabel = "בתהליך"; statusType = "warning"; }
    else { statusLabel = "טרם החל"; statusType = "danger"; }

    const yearlyDataArray = Object.values(yearlyDataMap).sort((a, b) => {
      const idxA = hebrewYearsForSort.indexOf(a.year);
      const idxB = hebrewYearsForSort.indexOf(b.year);
      if (idxA !== -1 && idxB !== -1) return idxB - idxA;
      return b.year.localeCompare(a.year, 'he');
    });

    return {
      ...member, fullName: `${member.firstName || ""} ${member.lastName || ""}`.trim(), currentYear,
      collectedThisYear, collectedAmount, currentYearTarget, currentYearType: currentStatusInfo.type, currentYearShiur: currentStatusInfo.shiur, totalDebtFromPast, openDebtNow, totalRequiredThisYear, missingAmount,
      isEligible, isEligibleTiyul, isEligibleShay, statusLabel, statusType,
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
    renderEligibilityTable();
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
    sessionStorage.removeItem("ezer_active_session");
    if (window.SB) { try { SB.signOut(); } catch (e) {} }
    state.currentUser = null;
    state.currentUserObj = null;
    resetIdleTimer();

    const pwdInput = document.getElementById("login-password");
    if (pwdInput) pwdInput.value = "";

    const mainScreen = document.getElementById("main-screen");
    if (mainScreen) {
        mainScreen.classList.remove("visible-layout");
        mainScreen.classList.add("hidden-layout");
    }

    setTimeout(() => {
        const loginScreen = document.getElementById("login-screen");
        if (loginScreen) { loginScreen.classList.remove("hidden-login"); initLoginScreen(); }
    }, 500);

    if(isAuto) {
        showToast("המערכת ננעלה אוטומטית עקב חוסר פעילות", "warning");
    }
}
