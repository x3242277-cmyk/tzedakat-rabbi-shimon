# 01 · Screens and navigation of the OLD system ("צדקת רבי שמעון · מערכת ניהול")

Read-only study of `/home/user/x3242277-cmyk/tzedakat-rabbi-shimon`. Nothing in that folder was modified.

Sources read in full: `index.html` (1040 lines), `script.js` (5864 lines), `supabase-integration.js` (268 lines), `boot.js`, `manifest.json`, `_headers`, `_redirects`, `serve.json`, `404.html`, `supabase/SETUP.md`; `style.css` was read for the responsive block (lines 2708-2910), the print block (2912-2988) and grepped for layout selectors; `supabase/schema.sql` / `supabase/security-update.sql` were grepped for the permission policies.

Conventions used below:
- `index.html:NNN` and `script.js:NNN` are line numbers in those files. `fn()` is a function in `script.js` unless stated.
- Hebrew labels are quoted exactly as they appear in the source.
- "not found" means I looked for it and the old app does not have it.
- Wiring style: the old app has NO inline handlers (CSP `script-src 'self'`). Clicks are wired either by element id inside `bindEvents()` and friends (script.js:857-1178, 1291-1297, 1393-1423, 1531-1539, 1645-1651, 1727-1758), or declaratively with `data-action` / `data-change` / `data-input` + `data-args`, dispatched by one document listener (`runUiAction`, script.js:174-188) against a whitelist of 72 function names (`UI_ACTION_NAMES`, script.js:149-165).

---

## 0. Inventory at a glance

| Kind | Count | What |
|---|---|---|
| Top-level screens (`<section class="content-screen">`) | 8 | dashboard, members, daily report, expenses summary, Purim addresses, grants, rules, settings |
| Other full pages | 2 | login overlay (`#login-screen`), `404.html` |
| Sub-views inside screens | 2 + 2 + 2 + 7 + dynamic | members list / member card; grants "נתינת המענק" / "תשלומים לחנויות"; payments half א / half ב; 7 settings tabs; Purim city tabs and group tabs (built from data) |
| Static modals in `index.html` | 10 | more-sheet, data-health, add-donation, add-expense, add-member, grant-status (eligibility history), nedarim (3 steps), legacy-assign, store-bill, timeout-warning |
| Dynamic overlays built in JS | 3 | dashboard drill-down modal (11 content variants), generic confirm/prompt dialog (5 call sites), member row popup menu |
| Transient UI | 5 | toast, undo toast, pending-writes banner, saving indicator, Purim print window |
| Declarative actions (whitelist) | 72 | `UI_ACTION_NAMES` (one of them, `openSettingsTab`, is whitelisted but never emitted) |
| Id-bound controls | about 50 | listed per screen below |

---

## 1. App shell, navigation and routing

### 1.1 Shell structure (`index.html:50-791`, `#main-screen.app-layout`)

- `#main-screen` starts with class `hidden-layout` (display none) and becomes `visible-layout` after login (script.js:599-601, 666-667).
- Children, in DOM order: `header.mobile-topbar` (52-58), `aside.sidebar` (60-83), `main.main-content` (85-755) holding the print header (86-89), the desktop page header (91-104) and the 8 screens; `nav.bottom-nav` (757-763); `#more-sheet` (765-780); `#data-health-modal` (782-790). All other modals are siblings of `#main-screen` (793-1033).
- Two `<datalist>` elements: `#members-datalist` (1035, filled by `populateMemberSelect()` script.js:5400, option text = `"{lastName} {firstName} | {yeshiva} [{id}]"`, sorted by last name) and `#store-names-datalist` (1022, filled in `renderStoreBills()`).

### 1.2 Desktop sidebar (`aside.sidebar`, index.html:60-83)

- Header: logo `#sidebar-logo` (click = go to dashboard, script.js:871-876), title "צדקת רבי שמעון", subtitle "ניהול גבייה, זכאות ומענקים", user chip `#user-role-indicator` (icon `admin_panel_settings` for admin else `person`, plus display name or "אורח"; `applyPermissions()` script.js:727-732).
- Main nav `nav.sidebar-nav` (aria-label "תפריט ראשי"), buttons `.nav-item[data-screen]` in this order:
  1. "לוח בקרה" → `dashboard-screen`
  2. "בחורים" → `members-screen`
  3. "דו"ח תנועות" → `daily-report-screen`
  4. "סיכום הוצאות" → `expenses-summary-screen`
  5. "כתובות פורים" → `purim-registration-screen`
  6. "מענקים" → `grants-screen`
  7. "תקנון" → `rules-screen`
- Footer: "הגדרות" (`#nav-settings`) → `settings-screen`.
- The sidebar nav items have NO icons (text only). Wiring: `bindNavigation()` script.js:1069-1078.
- Width: full on desktop; 208px at ≤1023px (style.css:2728-2729); hidden at ≤767px (style.css:2756).

### 1.3 Desktop page header (`#main-content-header`, index.html:91-104)

- `h1#page-title` + `#page-subtitle`, set per screen from `screenMeta` (script.js:561-570):

| Screen id | title | subtitle |
|---|---|---|
| `dashboard-screen` | "לוח בקרה" | "תמונת מצב שנתית, טיפול מיידי ופעולות ניהול" |
| `members-screen` | "בחורים" | "רשימת הבחורים, יעד, פער וסטטוס לכל אחד" |
| `daily-report-screen` | "דו"ח תנועות" | "הכנסות והוצאות לפי תקופה" |
| `expenses-summary-screen` | "סיכום הוצאות" | "הוצאות לפי קטגוריה והשוואה בין שנים" |
| `purim-registration-screen` | "כתובות פורים" | "כתובות התורמים לפי עיר וקבוצה, וסכומים לפי שנה" |
| `grants-screen` | "מענקים" | "מקבלי המענק, תכולת החבילה ותשלומים לחנויות" |
| `rules-screen` | "תקנון" | "יעדים, מתנות וכללי הזכאות" |
| `settings-screen` | "הגדרות" | "יעדים, קטגוריות, משתמשים, גיבוי ויומן פעולות" |

- Right side `#header-top-actions`: refresh icon button `#btn-refresh-data` (title "רענן נתונים מהשרת"; spins while `fetchDataFromServer()` runs; script.js:878-899) and logout icon button `#btn-logout-top` (title "התנתקות ונעילה"; `performLogout(false)`, script.js:586-589).
- The whole header is HIDDEN on the dashboard (`switchScreen`, script.js:2488-2491) because the dashboard hero has its own title, refresh and logout. It is also hidden on phones (style.css:2756) and in print.

### 1.4 Phone navigation (≤767px, style.css:2745-2910)

- Sidebar and desktop header disappear. A dark sticky top bar `header.mobile-topbar` (index.html:52-58, 56px) shows: small logo, `#mobile-title` (current screen title from `screenMeta`), and a refresh button `#mobile-refresh` (`data-action="mobileRefresh"`, aria "רענן נתונים מהשרת"; on failure toast "לא ניתן לטעון נתונים מהשרת כרגע"; script.js:220-227).
- Fixed bottom bar `nav.bottom-nav` (index.html:757-763, aria "ניווט ראשי"), 5 items with icon + label:
  1. `space_dashboard` "לוח בקרה" → dashboard
  2. `groups` "בחורים" → members
  3. `insert_chart_outlined` "תנועות" → daily report
  4. `redeem` "מענקים" → grants
  5. `menu` "עוד" (`#bnav-more`, `openMoreSheet`)
- "עוד" sheet `#more-sheet` (index.html:765-780, title "עוד", closes on X, on backdrop click (script.js:228) and on every `switchScreen`):
  - `analytics` "סיכום הוצאות"
  - `location_on` "כתובות פורים"
  - `menu_book` "תקנון"
  - `settings` "הגדרות"
  - divider
  - `logout` "התנתקות" (red; `logoutFromMoreSheet` → `performLogout(false)`)
- Logout on a phone exists ONLY in the "עוד" sheet (dashboard hero logout is hidden at ≤767px, style.css:2805).
- The "עוד" button gets the active state when the current screen is one of the sheet's items (script.js:2510-2511).
- Bottom-nav and sheet items copy their visibility from the matching sidebar item, so permissions apply identically (script.js:766-770). The "עוד" button itself is always visible.
- On phones `switchScreen` scrolls to top (script.js:2515).

### 1.5 Routing, history and deep links

- `switchScreen(screenId, pushToHistory)` (script.js:2480-2517): toggles `.active-content-screen`, sets nav active states, updates titles, runs per-screen renders (expenses summary, report chart, settings, rules, grants), resets the members screen to the LIST sub-view and focuses the search box, exits members inline-edit mode when leaving, closes the more-sheet and row menu, and pushes `history.pushState({screen}, "", "#<screenId>")`.
- Initial screen: URL hash if it matches a `screenMeta` key, else dashboard (`initApp`, script.js:781-783). Browser back/forward handled by `popstate` (script.js:916-923).
- Only the 8 screen ids are addressable. Member card, grants sub-view, settings tab, Purim city/group, modals: no URL (not found).
- IMPORTANT: `switchScreen` performs NO permission check. Hidden screens can still be opened by URL hash or by the dashboard quick-action buttons (see 2.3).

### 1.6 Data refresh entry points

- Desktop header refresh, dashboard hero refresh `#dashboard-refresh-data` (script.js:901-911), phone top-bar refresh, Settings → "סנכרן עכשיו", Purim empty-state button "רענן נתונים". All call `fetchDataFromServer()` (script.js:789-828), which reloads everything and re-renders all screens. No realtime subscription, no polling of data (not found); only the pending-writes queue retries every 30s (script.js:506).

### 1.7 Global feedback elements (all screens)

- Toast `showToast(msg, type)` (script.js:5495-5521): types success / danger / warning with icons `check_circle` / `error` / `warning`; auto-hides after 3s; on phone sits above the bottom nav.
- Undo toast (`scheduleUndoableDelete`, script.js:332-354): icon `delete_outline`, message, button "בטל פעולה"; 6 seconds (`UNDO_DELAY_MS`); on undo toast "הפעולה בוטלה, הרשומה הוחזרה". Used for deleting: member, donation, expense, expense category, grant recipient, store bill.
- Pending-writes banner `#pending-writes-banner` (script.js:487-503): icon `cloud_off`, text "{N} שינוי עדיין לא נשמר / שינויים עדיין לא נשמרו בשרת. הם שמורים במחשב הזה ויישלחו אוטומטית.", button "נסה עכשיו" (toasts "כל השינויים נשמרו בשרת" or "עדיין אין חיבור לשרת. ננסה שוב אוטומטית").
- Saving indicator `#saving-indicator` (script.js:1425-1447): "מעדכן..." then "עודכן בהצלחה" or "נשמר במחשב, ממתין לשליחה" (member save only).
- Save result toasts (`reportSave`, script.js:463-466): success message per action, or "אין חיבור לשרת כרגע. השינוי שמור במחשב הזה ויישלח אוטומטית כשהחיבור יחזור". Server rejection: "השרת לא אישר את השמירה ({label}): {reason}" where reason for 403 is "אין לך הרשאה לפעולה הזו" (script.js:439-440).
- Generic dialog `uiDialog` / `uiConfirm` / `uiPrompt` (script.js:263-317): title, message, optional text input, OK and "ביטול" buttons, Esc cancels, Enter confirms in prompt, focus trap, backdrop click cancels. Call sites: Nedarim save without confirmation number (1020), import backup (2349), remove store from package (4421), add grants year prompt (4569), logout with pending writes (5807).
- Idle lock: see section 14.

### 1.8 Print (all screens)

- `printPage()` = `window.print()` (script.js:200). Buttons exist on: members toolbar, daily report toolbar, grants toolbar. Purim has its own per-group print (new window). Dashboard, expenses summary, rules, settings, member card have no print button, but the print stylesheet and print header still work with the browser's print command.
- `buildPrintHeader()` on `beforeprint` (script.js:5343-5382) fills `#print-header-title` = "צדקת רבי שמעון · {screen title}" (member card: "כרטיס בחור: {name}") and `#print-header-meta` with the active filters joined by " · ":
  - members list: "חיפוש: …", "ישיבה: …", "עיר: …", selected types joined by " + ", "כולל נשואים", "{N} בחורים"
  - member card: "שנת {campaign year}"
  - daily report: "תקופה: …" and, unless period is "all", "שנת {campaign year}"
  - grants: "שנת {year}" and "נתינת המענק" or "תשלומים לחנויות · מחצית {א/ב}'"
  - expenses summary: "שנת ניתוח: {year}"
  - dashboard: "שנת {selected year}"
  - Purim: "{city} / {group}"
  - always last: "הודפס DD/MM/YYYY HH:MM ע"י {user}"
- Print CSS (style.css:2917-2988): A4, hides sidebar, bars, modals, toasts, all buttons, toolbars, `.no-export` columns, sort arrows, missing-info star, grants forms, dashboard hero controls and the quick-actions panel, Purim tab navs, settings sub-nav, expenses year bar, rules lookup box, member card actions; un-clips scroll containers; dashboard KPIs in 3 columns.

### 1.9 PWA and static pages

- `manifest.json`: name "צדקת רבי שמעון - מערכת ניהול", short name "צדקת רבי שמעון", `display: standalone`, theme/background `#101014`, icons 192/512/maskable. No service worker (not found), so no offline shell; only the write queue in `localStorage` survives.
- `404.html`: "הדף לא נמצא", "הכתובת שביקשת אינה קיימת במערכת.", link "חזרה למערכת". `_redirects` forces 404 for `/migrations/*`, `/supabase/*`, `/tools/*`, `/serve.json`, `/__demo.js`.
- `_headers` CSP: iframes allowed only from `https://www.matara.pro` (Nedarim Plus), connect/img only to the Supabase project.

---

## 2. Permissions that show or hide UI

### 2.1 The flags (table `profiles`; mapped in `supabase-integration.js:180-184`)

`isAdmin`, `canEdit`, `canViewIncome`, `canViewExpenses`, `canViewGrants`, `canViewHistory`.
- Admin test in the client: `isAdminUser()` = `isAdmin === true` OR username is exactly "מנהל" (script.js:714-717). Admin implies every other flag.
- `canEditUser()` (script.js:709-712) = no profile loaded, or admin, or `canEdit`.
- Labels of the flags in the users table (script.js:2389): "הוספה ועריכה", "הכנסות ופורים", "הוצאות", "מענקים", "היסטוריית זכאות".

### 2.2 What `applyPermissions()` does (script.js:719-771)

| Flag | UI effect |
|---|---|
| canEdit | Shows/hides by id: `quick-add-donation`, `quick-add-expense`, `quick-add-member`, `btn-inner-add-member`, `btn-inner-add-expense` (this id does not exist in `index.html`), `btn-profile-deposit`, `btn-profile-edit`, `btn-save-settings`, `btn-report-add-donation`, `btn-report-add-expense` |
| canViewIncome | Nav "כתובות פורים"; the monthly income chart box `#box-chart` in the report |
| canViewIncome AND canViewExpenses | "גבייה מול הוצאות" chart `#box-finance-chart` in the report |
| canViewExpenses | Nav "סיכום הוצאות" |
| canViewIncome OR canViewExpenses | Nav "דו"ח תנועות" |
| canViewGrants | Nav "מענקים"; the "היסטוריית זכאות" button on the member card |
| canViewHistory | Inside the eligibility-history modal only: without it the table shows only the current year row (script.js:1310-1316) |
| admin | Nav "הגדרות"; "מחק הפקדה" / "מחק הוצאה" buttons in the edit modals (script.js:1639, 1668); "מחיקה" in the member row menu (3550); the Hebrew-new-year reminder on the dashboard (2598); import backup (2340); saving user permissions (2407) |

Other in-code edit gates (toast "אין לך הרשאת עריכה"): opening the donation modal (1615), expense modal (1656), store-bill modal (4785), legacy-assign modal (4653). Member row menu shows "רישום הפקדה" and "עדכון פרטים" only with canEdit (3546-3549). Empty-state call-to-action buttons appear only with canEdit. Store-bill row buttons and legacy "שייך למחצית" buttons render only with canEdit (4729, 4742, 4302).

### 2.3 Things NOT gated in the UI (server RLS is the only guard)

- `switchScreen` has no permission check: `#grants-screen`, `#settings-screen` etc. open by URL hash for anyone logged in.
- Dashboard quick actions "דו"ח תנועות" and "מענקים" (`.drill-down-card`) and "סליקת אשראי" are always visible.
- Members toolbar "מצב עריכה" (inline table edit) is visible to everyone.
- Grants: "הוסף חתן", row edit/remove, "ערוך תכולה", add-year "+" are visible to everyone who reaches the screen.
- Purim: "עריכה" per group is visible to everyone who reaches the screen.
- Dashboard recent activity and expense alerts are not filtered by canViewExpenses in the client (the server simply returns no expense rows for such users after `security-update.sql`).
- Server policies (security-update.sql:61-158): members and donations readable by all logged-in users; expenses need can_view_expenses; purim needs can_view_income; grants_archive and receipts need can_view_grants; inserts/updates need can_edit; deletes and settings writes need admin; audit log readable by admin only.

---

## 3. Login screen (`#login-screen.login-overlay`, index.html:22-48)

- How reached: first load without a session; after logout or idle lock (page reload). `boot.js` hides the overlay before first paint when `sessionStorage["ezer_sb_session"]` holds a token, to avoid a flash.
- Layout: full-screen overlay with background image `assets/img/login-bg.png`, centered card with logo `#login-logo`, title "צדקת רבי שמעון".
- Loader state `#login-loader-area`: spinner + "מסנכרן נתונים מאובטחים..." (shown until `showLoginForm()` script.js:613-625 fades the form in).
- Form `#login-form-area`:
  - sub-title "הזן פרטי זיהוי לכניסה למערכת"
  - "שם משתמש" (`#login-username`, placeholder "שם המשתמש שקיבלת", LTR, autocomplete username)
  - "סיסמה" (`#login-password`, placeholder "הקלידו סיסמה...")
  - button "היכנס למערכת" (`#btn-login`; while working: "מתחבר...")
  - error line `#login-error` (role alert)
- Logic `initLoginScreen()` (script.js:635-692): username is turned into `{name}@tzedaka.local` unless it already contains `@` (`loginNameToEmail`, 39-43); `SB.signIn`; full data load; profile resolved by auth user id (`resolveCurrentUser`, 695-707); toast "ברוך הבא למערכת, {name}!".
- Error texts: "יש להזין שם משתמש וסיסמה"; "שם משתמש או סיסמה שגויים" (generic, also the default text in HTML); "לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט, או שהשרת אינו זמין כרגע."; "יותר מדי ניסיונות כניסה. נסה שוב בעוד כמה דקות." (429); "השרת אינו זמין כרגע. נסה שוב בעוד כמה דקות." (5xx).
- After an idle auto-lock the login page shows toast "המערכת ננעלה אוטומטית עקב חוסר פעילות" (script.js:576-579).
- Not found: forgot password, remember me, sign-up, language switch, show-password toggle.
- Session: `sessionStorage` (tab-scoped; page refresh keeps the user in, closing the browser logs out).

---

## 4. Dashboard (`#dashboard-screen`, index.html:106-245; `renderDashboard()` script.js:2520-2559)

Reached: default screen; sidebar "לוח בקרה"; sidebar logo; bottom nav. Visible to every logged-in user.

### 4.1 Hero panel (index.html:109-137)
- h1 "לוח בקרה", p "תמונת מצב שנתית, טיפול מיידי ופעולות ניהול במקום אחד." (both hidden on phone).
- Year card: label "שנת פעילות", `select#dashboard-year-filter` with 8 HARD-CODED options, newest first: תשפ"ז, תשפ"ו, תשפ"ה, תשפ"ד, תשפ"ג, תשפ"ב, תשפ"א, תש"פ. On first render it is set to the campaign year if that option exists (script.js:2523-2527). `data-change="renderDashboard"`.
- Session tools (desktop/tablet only): refresh `#dashboard-refresh-data` (title "רענן נתונים"), logout `#dashboard-logout` (title "יציאה ונעילה", red).
- The selected year drives: KPIs, attention list, recent activity, segments and all drill-downs. It does NOT affect any other screen.

### 4.2 KPI cards (6 buttons, each opens a drill-down; index.html:139-183)

| Order | Icon | Label | Value | Drill type |
|---|---|---|---|---|
| 1 | account_balance_wallet | "נגבה השנה" | donations of the year + Purim manual sums of the year (key figure) | `collected` |
| 2 | flag | "יעד כולל" | sum of required (target + past debt) of unmarried members | `target` |
| 3 | priority_high | "חסר להשלמה" (urgent style) | sum of each member's own shortfall | `missing` |
| 4 | workspace_premium | "עמדו ביעד השנתי" | count of eligible members | `eligible` |
| 5 | report | "חובות עד שנה קודמת" (warning style) | COUNT of members with past debt | `debt` |
| 6 | trending_up | "התקדמות כללית" | percent + progress bar `#dashboard-yearly-progress-bar` | `progress` |

Grid: 6 columns desktop, 3 at ≤1023px, 2 on phone.

### 4.3 Panel "דורש טיפול" ("הנקודות החשובות ביותר לפתיחה עכשיו") — alerts
`renderDashboardAttention()` script.js:2578-2676. Up to 5 buttons (first 5 of the list below, in this order), each with icon, title, sub-text, value; click opens the drill-down.

| # | Condition | Icon / tone | Title | Sub-text | Value | Drill |
|---|---|---|---|---|---|---|
| 1 | admin only, real Hebrew year is later than the campaign year in settings | event_repeat / warn | "השנה העברית התחלפה ל{year}" | "שנת הקמפיין בהגדרות היא {campaign}, ולכן הפקדות חדשות נרשמות אליה. לחיצה פותחת את ההגדרות" | the new year | `new-year` (jumps to Settings → "יעדים ושנה") |
| 2 | members not eligible with shortfall ≤ ₪500 | near_me / success | "קרובים לזכאות" | first 3 names + " ועוד" | count | `near-goal` |
| 3 | members with past debt | report / danger | "חובות עד שנה קודמת" | "לא כולל החובה של השנה שנבחרה" | total debt ₪ | `debt` |
| 4 | target > 0 and nothing collected | hourglass_empty / warn | "טרם התחילו גבייה" | "בחורים עם חובה שנתית וללא הפקדה בשנה שנבחרה" | count | `not-started` |
| 5 | unmarried members missing phone, yeshiva or type | edit_note / warn | "פרטים חסרים בכרטיסי בחורים" | "טלפון, ישיבה או סוג מסגרת חסרים" | count | `missing-info` |
| 6 | expense category alert (`getDashboardExpenseCategoryAlert`, 2678-2723) | receipt_long / danger or warn | "הוצאה חריגה: {category}" (grew vs previous year) or "קטגוריית הוצאה מובילה: {category}" | "עלתה מ-₪X ל-₪Y" / "אין עליה מול {prev}, אבל זו הקטגוריה הגדולה השנה" / "הקטגוריה הגדולה ביותר בשנה שנבחרה" | ₪ | `expense-category` |

Empty state: icon task_alt, "אין כרגע מה לטפל בו", "כשיהיו בחורים קרובים ליעד, חובות פתוחים או פרטים חסרים, הם יופיעו כאן."

### 4.4 Panel "הכנסות לפי שנה" ("שלוש השנים האחרונות: בחורים ופורים")
- `renderDashboardMonthBars()` → `renderFinanceChart(el, rows, "income")` (script.js:2751-2755, 2795-2923). Custom inline SVG stacked bar chart (not Chart.js): last 3 years that have data; one column per year stacked "בחורים" + "פורים"; value caption above each bar; legend; hover/focus tooltip with per-series breakdown and "סה"כ"; redraws on width change (ResizeObserver).
- Below the chart a table: "שנה" / "בחורים" / "פורים" / "סה"כ הכנסות" (newest first).
- Not affected by the year selector.

### 4.5 Panel "פעולות מהירות" ("התחלות עבודה נפוצות") — 6 buttons (index.html:213-220)
1. payments "רישום הפקדה" (`#quick-add-donation` → `openDonationModal()`) — canEdit
2. person_add "הוספת בחור" (`#quick-add-member` → `openMemberModal()`) — canEdit
3. receipt_long "רישום הוצאה" (`#quick-add-expense` → `openExpenseModal()`) — canEdit
4. credit_card "סליקת אשראי" (`openNedarimModal`) — always visible
5. insert_chart_outlined "דו"ח תנועות" (→ daily report) — always visible
6. redeem "מענקים" (→ grants) — always visible
Hidden in print. 2 columns on phone.

### 4.6 Panel "פעילות אחרונה" ("הפקדות והוצאות אחרונות")
`renderDashboardActivity()` script.js:2963-3008. The 8 most recent donations + expenses of the selected year, by date desc. Each row: icon (payments green / receipt_long red), title (member name, or "הפקדה כללית"; expense description or category or "הוצאה"), sub (date, plus " · category" for expenses; "ללא תאריך"), amount (expenses prefixed "-"). Rows are not clickable. Empty: icon history, "אין עדיין פעילות בשנה הזו", "הפקדות והוצאות חדשות יופיעו כאן לפי סדר התאריכים.", button "רישום הפקדה" (canEdit).

### 4.7 Panel "מסגרות" ("התקדמות לפי סוג מסגרת")
`renderDashboardSegments()` script.js:3010-3052. One button per framework type (as of the selected year) that has at least one member with a target: name, "{reached} מתוך {obligated} הגיעו לחובה", percent, meter. Click → drill `segment`. Empty: icon groups, "אין עדיין בחורים עם יעד", "ההתקדמות לפי מסגרת תוצג אחרי שיהיו בחורים עם יעד שנתי.", button "הוספת בחור" (canEdit).

### 4.8 Panel layout
Desktop grid areas (style.css:672-682): row 1 attention | actions; row 2 chart | activity; row 3 segments | activity. At ≤1180px one column in the order attention, actions, chart, segments, activity.

### 4.9 Dashboard drill-down modal (`#dashboard-drill-modal`, created on demand, script.js:3122-3141; content `openDashboardDrill()` 3173-3333)
- Header: kicker "נתונים אמיתיים מלוח הבקרה", h2 title, p subtitle (default "שנת {year}"), count box (summary value, and "{N} שורות").
- Table; when rows carry a member id an extra column "פעולה" with button "פתח כרטיס" (`openDashboardMember` → closes modal, goes to members screen, opens the member card).
- Close: X, backdrop click. No Esc. No export/print button inside (not found).
- Empty: icon task_alt, "אין נתונים מתאימים לבחירה הזו", "נסו לבחור שנת פעילות אחרת בלוח הבקרה."

| Drill type | Title | Columns | Rows / sort | Summary value |
|---|---|---|---|---|
| `collected` | "נגבה השנה" | "תאריך", "בחור / מקור", "פירוט", "סכום" | donations of the year (date desc) then Purim rows ("-", "פורים - {group}", "סיכום ידני", amount) | total ₪ |
| `target` | "יעד כולל" | "בחור", "מסגרת", "חובה", "חוב קודם", "נאסף", "חסר" | required > 0, by required desc | total ₪ |
| `missing` | "חסר להשלמה" | same 6 | shortfall > 0, desc | total ₪ |
| `eligible` | "עמדו ביעד השנתי" | same 6 | eligible, by collected desc | count |
| `debt` | "חובות עד שנה קודמת" (subtitle "שנת {y} · לא כולל את חובת השנה שנבחרה") | same 6 | past debt > 0, desc | total ₪ |
| `progress` | "התקדמות כללית" (subtitle "שנת {y} · כמה מהחובה (כולל חובות עבר) כבר כוסה") | "בחור", "מסגרת", "חובה", "חוב קודם", "נאסף", "התקדמות", "מצב" ("הגיע לחובה" / "עדיין חסר") | target > 0, by collected desc | percent |
| `near-goal` | "קרובים לזכאות" (subtitle "שנת {y} · חסר עד ₪500") | 6 member columns | shortfall asc | row count |
| `not-started` | "טרם התחילו גבייה" | 6 member columns | by name | row count |
| `missing-info` | "פרטים חסרים בכרטיסי בחורים" | "בחור", "חסר", "טלפון", "ישיבה" | unmarried with missing fields, most missing first | row count |
| `expense-category` | "הוצאות לפי קטגוריה: {category}" | "תאריך", "קטגוריה", "פירוט", "סכום" | expenses of year + category, date desc (no member button) | total ₪ |
| `segment` | "מסגרת: {name}" | 7 progress columns | members of that type, reached first then by collected | "{reached} מתוך {obligated}" |
| `new-year` | (no modal) | | switches to Settings → targets tab | |

"מסגרת" cell text = type · yeshiva · shiur joined by " · " or "ללא מסגרת" (`getDashboardMemberMeta`, 3068-3073).

---

## 5. Members screen — list (`#members-list-section`, index.html:248-310; `renderMembersTable()` script.js:3406-3534)

Reached: sidebar "בחורים", bottom nav, and whenever `switchScreen("members-screen")` runs (always lands on the list). Visible to all users. Search box is auto-focused on entry.

### 5.1 Toolbar filters
- "חיפוש (שם, טלפון, ישיבה)" text `#search-members-list` (placeholder "הקלד לחיפוש..."), debounced 250ms. Searches first name, last name, father name, full name, phone (also digits only), yeshiva, type, shiur, address, notes (script.js:3420).
- "ישיבה" select `#filter-members-yeshiva` (first option "כל הישיבות"; HTML placeholder "הכל").
- "עיר" select `#filter-members-city` (first option "כל הערים"). City = text after the last comma of the address.
- The two selects are faceted: each lists only values available under the other active filters (script.js:3422-3452).
- Checkboxes: "ישי"ק" (`#filter-type-small` → type "ישיבה קטנה"), "ישי"ג" (`#filter-type-big` → "ישיבה גדולה") (`updateTypeFilter`, 5226-5233), "נשואים" (`#filter-show-married`). Married members are HIDDEN by default; married = marital status "נשוי" OR notes contain "התחתן".
- No year filter on this screen: all figures are for the campaign year (not found: year picker).

### 5.2 Toolbar actions (DOM order)
1. close "בטל עריכה" (`#btn-members-edit-cancel`, hidden until edit mode; `cancelMembersEdit`)
2. edit "מצב עריכה" (`#btn-members-edit-mode`; in edit mode becomes save icon with title "שמור שינויים"; `handleMembersEditButton`)
3. filter_alt_off "נקה סינונים" (`#btn-clear-members-filters`; resets search, selects, all three checkboxes)
4. density_small "צפוף / מרווח" (`toggleMembersDensity` toggles `.compact-view`)
5. print "הדפסה" (`printPage`)
6. download "הורדה לאקסל" (`#btn-export-members` → `exportToCSV("members-table-body", "רשימת_בחורים")` → file `רשימת_בחורים_{YYYY-MM-DD}.csv`, UTF-8 BOM, skips `.no-export` columns, strips "₪")
7. primary button person_add "בחור חדש" (`#btn-inner-add-member` → `openMemberModal()`) — canEdit
On phone: buttons 2, 4 and 5 are hidden (style.css:2847).

### 5.3 Table columns (sticky header, default compact)

| # | Header | Sortable (`data-sort`) | Content |
|---|---|---|---|
| 1 | "שם פרטי" | firstName | first name + red "*" with tooltip "חסר: …" when type, yeshiva, phone or address is missing |
| 2 | "שם משפחה" | lastName | |
| 3 | "שם האב" | fatherName | or "---" |
| 4 | "ישיבה" | yeshiva | |
| 5 | "שיעור" | shiur | "---" for חיידר or empty |
| 6 | "עיר" | address (sorted by city) | city or "---" |
| 7 | "נאסף השנה" | collectedThisYear | ₪ |
| 8 | "יעד" | totalRequiredThisYear | ₪ (target + past debt) or "—" |
| 9 | "פער" | missingAmount | ₪ in red or "—" |
| 10 | "התקדמות" | no (no-export) | progress bar + percent |
| 11 | "סטטוס" | no | badge: "עמד ביעד" (success), "חיידר" (neutral), "חוב פתוח" (danger), "בתהליך" (warning), "טרם החל" (neutral) (`getMemberStatus`, 1263-1270) |
| 12 | more_vert icon (no-export) | no | row menu button |

- Sorting: click a header toggles asc/desc, arrow indicator; numeric for columns 7-9, Hebrew locale compare otherwise (script.js:925-939, 3463-3484). No default sort (server order). No pagination (all rows rendered).
- Row click opens the member card (unless in edit mode).
- Empty states: no members at all → icon groups, "עדיין אין בחורים במערכת", "הוסיפו את הבחור הראשון כדי להתחיל לרשום הפקדות ולעקוב אחרי היעד שלו.", button "הוספת בחור" (canEdit). No match → icon search_off, "אין בחורים שמתאימים לסינון", "נסו לשנות את החיפוש או לנקות את הסינונים.", button "נקה סינונים". Initial HTML placeholder: "אין נתונים להצגה".

### 5.4 Row popup menu (`#row-menu`, `openMemberRowMenu()` script.js:3541-3564)
Items: person "פתח כרטיס" (all); payments "רישום הפקדה" (canEdit); edit "עדכון פרטים" (canEdit); delete_outline "מחיקה" (admin, red). Closes on outside click, scroll, Esc, or second click on the same button. Delete = `deleteMemberRow` (3579-3601): no confirm dialog; undo toast "{name} נמחק"; deletes the member card only, donations stay.

### 5.5 Inline edit mode (desktop/tablet only)
`enterMembersEditMode()` / `saveMembersEdit()` (script.js:3604-3667). Cells of columns 1-5 (`td[data-field]`: firstName, lastName, fatherName, yeshiva, shiur) become `contenteditable`; save writes each changed member; toast "נשמרו {N} שינויים". Leaving the screen exits edit mode without saving.

### 5.6 Phone rendering
The table becomes a card list (style.css:2844-2865). Each card shows only: first name, last name, collected amount (top row), yeshiva + kebab menu (second row), progress bar (third row). Father name, shiur, city, target, gap and status badge are NOT shown on phone cards.

---

## 6. Member card (`#member-profile-section`, index.html:312-373; `loadMemberProfile()` script.js:1180-1259)

Reached: row click; row menu "פתח כרטיס"; dashboard drill "פתח כרטיס"; data-health duplicates "פתח פרופיל". Replaces the list inside the same screen (page title stays "בחורים"). No URL.

- Head, summary side:
  - `#profile-full-name`
  - `#profile-yeshiva-details`: "{yeshiva or "ישיבה לא הוזנה"} | שיעור {shiur} ({type})" (shiur omitted for חיידר)
  - `#profile-contact-details`: "טלפון: {phone or ---} | כתובת: {address or ---}"
  - badges `#profile-eligibility-icons`: status badge (same 5 statuses), plus "זכאי ל{gift1 name}" (icon directions_bus) and "זכאי ל{gift2 name}" (icon card_giftcard) when earned
  - `#profile-total-amount` (key figure) with label "סך הכל נאסף השנה"
- Head, actions: "רישום הפקדה" (`#btn-profile-deposit`, canEdit), "עדכון פרטים" (`#btn-profile-edit`, canEdit), "היסטוריית זכאות" (`#btn-profile-grant`, canViewGrants).
- Stats row (4): "יעד בסיס (השנה)", "חובות עבר (קנס)" (red when > 0; shows the debt still open now), "סה״כ נדרש", "פער להשלמה" (text "חסר ₪X" in red, or "עודף ₪X" / "הושלם בדיוק" in green; script.js:1216-1226).
- Progress: "התקדמות יעד" + percent + bar.
- "הפקדות של הבחור" with counter "{N} הפקדות · סה"כ ₪X"; table "תאריך" / "שנה" / "סכום" / "הערות"; all years, date desc; row click opens the donation edit modal (canEdit; title "לחיצה לעריכה"). Empty: icon payments, "אין עדיין הפקדות לבחור הזה", "הפקדה ראשונה תופיע כאן ותיספר ליעד השנתי שלו.", button "רישום הפקדה".
- Footer: arrow_forward "חזרה לרשימה" (`#btn-back-to-search`).
- Not on the card: member notes, father name, marital status, delete button, print button, export (not found). Notes are visible only in the edit modal.

---

## 7. Eligibility history modal (`#grant-status-modal`, index.html:887-906; `openGrantStatusModal()` script.js:1299-1391)

Reached only from the member card button "היסטוריית זכאות" (needs canViewGrants).
- Title = member full name (static placeholder "סטטוס זכאות").
- Debt banner (when open debt > 0): "חוב פתוח: ₪X" / "הסכום הנ"ל מתווסף ליעד השנה הנוכחית · השלמתו נדרשת לזכאות".
- Table columns: "שנה" / "מסגרת" / "יעד" / "נדרש בפועל" / "נאסף" / "סטטוס"; one row per Hebrew year from the member's first donation year to the campaign year (gaps filled), newest first.
  - Year cell: year + badge "השנה" on the current one.
  - "מסגרת": the type and shiur the member had that year (computed backwards).
  - "נדרש בפועל": amount, with sub-line "יעד ₪X + קנס ₪Y" when past debt was carried in.
  - "סטטוס" badges: "פטור מיעד" (+ "חוב ₪X ממתין"), "עמד ביעד" (+ "כולל סגירת חוב"), "{N}% הושלם" (current year), "חסר ₪X" (+ "קנס: ₪X עובר הלאה").
- Without canViewHistory only the current-year row is shown. Empty text: "אין נתונים זמינים להצגה."
- Buttons: X, "סגור", backdrop click.

---

## 8. Member add / edit modal (`#add-member-modal`, index.html:849-885; script.js:1393-1516)

Reached: dashboard quick action "הוספת בחור", members toolbar "בחור חדש", empty-state buttons, row menu "עדכון פרטים", member card "עדכון פרטים".
- Title: "הוספת בחור חדש" / "עדכון פרטי בחור".
- Fields: "שם פרטי", "שם משפחה", "שם האב", "טלפון" (auto-format: digits only, dash after 3 digits), "ישיבה" (free text), "סוג מסגרת" (ישיבה קטנה / ישיבה גדולה / חיידר / קיבוץ), "שיעור" (א'-ט'; the field is hidden when type is חיידר), "סטטוס משפחתי" (רווק / נשוי), "כתובת (למשל: רחוב, עיר)", "הערות".
- Buttons: "שמור בחור" (while saving "שומר..."), "ביטול".
- Validation toast: "יש להזין שם פרטי ושם משפחה".
- Close behaviour: the X and a backdrop click AUTO-SAVE when first and last names are filled (and something changed); only "ביטול" discards.
- No delete button here (delete is only in the row menu).

## 9. Donation add / edit modal (`#add-donation-modal`, index.html:793-824; script.js:1531-1643)

Reached: dashboard "רישום הפקדה", report toolbar "רישום הפקדה", member card "רישום הפקדה", row menu, empty states (new); row click in the report income table or the member card donations table (edit).
- Title: "רישום הפקדה חדשה" / "עריכת הפקדה". Meta line when editing: "נרשם ב-{date}".
- Fields: "תאריך" (default today), "שייך לשנת" (select: campaign year −4 … +1, campaign marked " (שנת הקמפיין)"; `populateYearSelect` 1519-1529), "בחור מזוכה (הקלד לחיפוש)" (text + `members-datalist`, placeholder "הקלד שם או ישיבה..."; prefilled when opened from a member), "אמצעי תשלום" radios "מזומן" / "אשראי" (credit is stored as a "(אשראי) " prefix in the notes), "סכום הפקדה", "הערות" (placeholder "לדוגמה: שם תורם").
- Buttons: "שמור הפקדה", "ביטול", "מחק הפקדה" (admin + existing only; undo toast "ההפקדה על סך ₪X נמחקה").
- Toasts: "יש לחפש ולבחור בחור מתוך הרשימה, ולהזין סכום גדול מ-0"; "שגיאה: נתוני הבחור לא אותרו במערכת"; "ההפקדה נרשמה בהצלחה!" / "ההפקדה עודכנה".
- Closes on X, "ביטול", backdrop.

## 10. Expense add / edit modal (`#add-expense-modal`, index.html:826-847; script.js:1645-1725)

Reached: dashboard "רישום הוצאה", report toolbar "רישום הוצאה", empty states (new); row click in the report expenses table (edit).
- Title: "הוספת הוצאה" / "עריכת הוצאה" (static HTML text "רישום הוצאה"). Meta when editing: "נרשם ע"י {user} ב-{date}".
- Fields: "תאריך", "שייך לשנת" (same year select), "קטגוריה" (select from Settings categories; the static HTML options are replaced at runtime), "פירוט" (placeholder "לדוגמה: דפוס איכות"), "סכום ההוצאה".
- Buttons: "הוסף הוצאה" / "שמור שינויים" (static "שמור הוצאה"), "ביטול", "מחק הוצאה" (admin + existing; undo toast "ההוצאה "{desc}" נמחקה").
- Toasts: "יש להזין סכום גדול מ-0"; "ההוצאה נרשמה בהצלחה!" / "ההוצאה עודכנה".
- Closes on X and "ביטול" only (no backdrop close).

## 11. Credit-card clearing modal — Nedarim Plus (`#nedarim-modal`, index.html:908-962; script.js:956-1067)

Reached only from the dashboard quick action "סליקת אשראי". Title "סליקת אשראי". Three steps in one modal:
1. Iframe step: `https://www.matara.pro/nedarimplus/online/?mosad=7011408` fills the modal. The X button (title "סגור / סיימתי תשלום") moves to step 2.
2. Question step: icon help_outline, "האם התשלום עבר בהצלחה?", "בחר האם העסקה בנדרים פלוס אושרה, כדי להמשיך לרישום ההפקדה במערכת.", buttons "כן, התשלום עבר" / "לא / ביטלתי" (closes).
3. Details step: heading "רישום ההפקדה ששולמה"; fields "שיוך לזכות הבחור (הקלד לחיפוש) *" (datalist), "סכום (₪) ששולם *", "מספר אישור עסקה (מנדרים פלוס)", "הערות / שם התורם" (default "אשראי - נדרים פלוס"); buttons "שמור במערכת", "ביטול רישום".
- Saving creates a normal donation dated today in the campaign year; notes get " | אישור עסקה: {number}". Without a number: confirm "לא הוזן מספר אישור עסקה" / "מספר האישור מנדרים פלוס עוזר לאתר את התשלום אחר כך. לשמור בלי מספר אישור?" / "שמור בלי מספר אישור".
- Toasts: "חובה לחפש בחור מתוך הרשימה ולהזין סכום ששולם (גדול מ-0)"; "הבחור לא אותר. אנא בחר מהרשימה התואמת"; "התרומה נרשמה בהצלחה לזכות הבחור!".
- There is no automatic verification with Nedarim Plus; the user answers manually.

---

## 12. Transactions report "דו"ח תנועות" (`#daily-report-screen`, index.html:376-442; `renderDailyReport()` script.js:3669-3744)

Reached: sidebar, bottom nav "תנועות", dashboard quick action. Nav visible with canViewIncome OR canViewExpenses.

- Toolbar filters: "תקופה" select `#report-time-filter`: "היום" (default), "אתמול", "השבוע" (from Sunday), "השנה", "כל התקופות (כל השנים)", "תאריך ספציפי..." → shows "בחר תאריך" date input `#report-custom-date`.
  - Every period except "כל התקופות" ALSO requires the record's year to equal the campaign year (script.js:3694). "השנה" = everything assigned to the campaign year.
- Toolbar actions: print icon "הדפסה"; "רישום הוצאה" (`#btn-report-add-expense`, canEdit); "רישום הפקדה" (`#btn-report-add-donation`, canEdit). No export button (not found).
- Chart card `#box-chart` (canViewIncome): caption "הכנסות לפי חודש בשנת הקמפיין"; Chart.js bar chart `#incomeChart`, 12 Gregorian months "ינואר"…"דצמבר", dataset "הכנסות בחודש", campaign year donations only (`renderChart`, 3335-3404). Ignores the period filter.
- Finance card `#box-finance-chart` (canViewIncome AND canViewExpenses): "גבייה מול הוצאות" / "לכל שנה: הכנסות (בחורים ופורים) מול הוצאות (כולל עלות המענקים)"; SVG chart in "compare" mode: per year two stacked columns, "הכנסות" (בחורים + פורים) and "הוצאות" (הוצאות + עלות מענקים), for every year with data; tooltip includes a grant note ("צפי לפי N זכאים השנה" / "לפי N מקבלי מענק" / "אין נתוני מענקים לשנה זו"); table below: "שנה" / "הכנסות" / "הוצאות" / "פער" ("עודף ₪X" or "גירעון ₪X" with arrow).
- Two side-by-side boxes (stack when narrow):
  - "הכנסות (איסוף)" + total `#report-total-income`; table "תאריך" / "בחור מזוכה" (name bold + notes sub-line) / "סכום" (green). Row click = edit donation.
  - "הוצאות קמפיין" + total `#report-total-expense`; table "תאריך" / "תיאור" (description bold + category tag) / "סכום" (red). Row click = edit expense.
  - Both sorted by date desc; sticky header; max height 60vh.
- Empty states: icon payments "אין הכנסות בתקופה הזו" / "אפשר לבחור תקופה אחרת, או לרשום הפקדה חדשה." / "רישום הפקדה"; icon receipt_long "אין הוצאות בתקופה הזו" / "אפשר לבחור תקופה אחרת, או לרשום הוצאה חדשה." / "רישום הוצאה".
- Not found: search, category filter, member filter, date range (from-to), pagination, sorting by column.

---

## 13. Expenses summary "סיכום הוצאות" (`#expenses-summary-screen`, index.html:444-492; script.js:3748-3989)

Reached: sidebar; phone "עוד" sheet. Nav needs canViewExpenses. Read-only screen (no add/edit here).

- Year bar: "שנת ניתוח" select `#expenses-year-filter` (years that have expenses, newest first, plus the campaign year; default campaign year; `onExpensesYearChange`).
- 4 KPI cards (not clickable):
  1. "סה"כ הוצאות השנה" (key figure) + hint "▲/▼ N% מאשתקד" or "אין נתוני השוואה"
  2. "הקטגוריה הגדולה" (name) + "₪X · N%" or "—"
  3. "ממוצע חודשי" + "{N} תנועות · לפי {M} חודש/חודשים" (months elapsed since Tishrei for the running Hebrew year, else 12)
  4. "יחס מההכנסות" (percent) + "מכל ₪100 שנאספו (כולל פורים), ₪N הלכו להוצאות" or "אין הכנסות רשומות"
- Charts: "התפלגות לפי קטגוריה" (Chart.js doughnut, legend, tooltip with ₪ and %) and "מגמה רב-שנתית" (bar per year, selected year highlighted).
- Section "פירוט לפי קטגוריה ושנה" with toggle button "הצג כל השנים" / "הצג פחות שנים" (default: last 5 years when more exist).
- Grid of category cards (2 columns; 1 on phone): header = category; mini table with "פירוט" + one column per year; one row per distinct expense description (amounts summed); footer row "סה"כ". Last card "סיכום כולל" with row "סה"כ הוצאות".
- Loading text "טוען נתונים..."; empty: icon analytics, "עדיין לא נרשמו הוצאות", "אחרי רישום ההוצאה הראשונה יופיע כאן פירוט לפי קטגוריה ושנה.", button "רישום הוצאה" (canEdit).
- Not found: print/export buttons, drill-down from a cell to the underlying expenses.

---

## 14. Purim addresses "כתובות פורים" (`#purim-registration-screen`, index.html:494-498; `renderPurimGroups()` script.js:4967-5163)

Reached: sidebar; phone "עוד" sheet. Nav needs canViewIncome. Everything is built in JS inside `#purim-tabs-container`.

- Level 1: city tabs (`.purim-cities-nav`), one button per distinct "עיר" value ("ללא עיר" when empty).
- Level 2: group tabs for the active city, label "{group} ({count})" ("ללא שיוך" when empty). Selected city/group are remembered across re-renders (`state.purimActive`), not across reloads.
- Group pane toolbar:
  - label "סכומים סופיים" + one chip per year (year + amount or "—"); read-only here, edited in Settings → "סכומי פורים". Sums are keyed by GROUP NAME only (a group name used in two cities shares the same sums).
  - buttons: edit "עריכה"; close "ביטול" and save "שמור" (appear in edit mode); print icon "הדפסה"; download icon "הורדה לאקסל"; density "רווח" ↔ "צפוף"; "כל השנים" ↔ "פחות שנים" (4 years by default, up to 8: campaign year −7 … campaign year).
- Table columns: "מס'", "משפחה" (bold), "שם", "רחוב", "מספר", "דירה", one column per shown year (current year highlighted), "הערות".
- Edit mode (`togglePurimGroupEdit`, 5169-5215): every cell except "מס'" becomes `contenteditable`; "שמור" saves only changed rows; toasts "נשמרו בהצלחה {N} שורות!", "לא בוצעו שינויים"; cancel toast "השינויים בוטלו בהצלחה.".
- Print (`printPurimGroup`, 5251-5292): opens a new window with title "תרומות פורים — {city} / {group}", meta "צדקת רבי שמעון · {N} כתובות · הודפס {date}", "סכומים סופיים: …", and the table; toast if popup blocked: "הדפדפן חסם את חלון ההדפסה. יש לאפשר חלונות קופצים לאתר".
- Export (`exportPurimGroupToExcel`, 5294-5340): HTML table saved as `תרומות_פורים_{city}_{group}.xls`.
- Empty state: icon location_on, "אין עדיין כתובות פורים", "הכתובות נטענות מהשרת לפי עיר וקבוצה. אם אמורות להיות כתובות, נסו לרענן את הנתונים.", button "רענן נתונים".
- Not found: adding a new address row, deleting a row, creating/renaming a city or group, search, sorting. Rows can only be edited in place.

---

## 15. Grants "מענקים" (`#grants-screen`, index.html:500-626; `renderGrantsArchive()` script.js:4173-4317)

Reached: sidebar, bottom nav, dashboard quick action. Nav needs canViewGrants.

### 15.1 Shared toolbar and stats
- "שנה" select `#grants-year-select`: option text "{year} ({recipient count})"; default = campaign year if it exists in the archive, else the latest year. "+" button (title "הוספת שנה") → prompt "הוספת שנת מענקים" / "הקלידו את שם השנה החדשה (לדוגמה: …).\nהשנים הבאות: …" / "הוסף שנה"; toasts "נוספה שנת {year} - הוסף כעת מקבלי מענק", "השנה כבר קיימת - עברת אליה".
- View toggle `#grants-view-toggle`: redeem "נתינת המענק" (default) | payments "תשלומים לחנויות" (`switchGrantsView`).
- Actions: download "ייצוא" (`exportGrantsToExcel`: CSV of the active view — `מקבלי_מענק_{year}` or `תשלומים_חנויות_{year}_מחצית_{א/ב}`), print "הדפסה".
- Stats row `#grants-archive-stats` (3 cards, shown in both views): "שווי המענקים שניתנו השנה" (key figure = retail value per groom × recipients), "שווי מענק לחתן", "מקבלי מענק".

### 15.2 View 1 — "נתינת המענק" (`#grants-grant-view`), two panels side by side
Panel A "מקבלי המענק · {year}":
- Buttons: download "אקסל" (`exportGrantsArchiveRecipients`), person_add "הוסף חתן" (toggles the inline form).
- Inline form `#grants-archive-add-form`: "שם ומשפחה (אפשר לבחור מרשימת הבחורים)" (datalist of members; picking one fills name and phone), "תעודת זהות", "טלפון", "תאריך"; buttons "הוסף" (in edit mode "שמור שינויים"), "ביטול". Validation toast "יש להזין לפחות שם או תעודת זהות". Success: "החתן נוסף לרשימת מקבלי המענק" / "פרטי החתן עודכנו".
- Info note (years whose rows have no names): "בשנה זו נרשמו המקבלים לפי תעודת זהות ותאריך בלבד (ללא שם) בקובץ המקור."
- Table: "#" / "שם ומשפחה" / "תעודת זהות" / "טלפון" / "תאריך" / edit icon (title "עריכה") / close icon (title "הסר"; undo toast "{label} הוסר מרשימת מקבלי המענק").
- Empty: icon redeem, "אין עדיין מקבלי מענק בשנה הזו", "הוסיפו את החתן הראשון כדי לעקוב אחרי המענקים שניתנו השנה.", button "הוסף חתן".
- Recipients are a free list, not linked to member records (the datalist only copies text).

Panel B "מה מקבלים · {year}" with "שווי חבילה לחתן {₪}":
- Buttons: "ערוך תכולה" ↔ "שמור תכולה", "ביטול" (edit mode only).
- Display: one block per store: "{store} · הנחה {discount}", "שווי ₪X" (bold) and "עלות לארגון ₪Y" (small); item lines "{name} ×{qty}" with the same two prices.
- Editor (`renderGrantsPackageEditorHtml`, 4322-4344): per store "שם החנות", "הנחה", remove (confirm "הסרת חנות מהתכולה"); per item "מוצר", "כמות לחתן", "מחיר בחנות", "עלות לארגון (ליחידה)", remove; "הוסף מוצר"; "הוסף חנות". In edit mode the panel takes full width and moves above the recipients. Toast "תכולת המענק נשמרה".
- Empty: icon inventory_2, "אין עדיין תכולת מענק לשנה הזו", "הגדירו אילו מוצרים החתן מקבל ומאיזו חנות, כדי לחשב את שווי החבילה.", button "ערוך תכולה".

### 15.3 View 2 — "תשלומים לחנויות" (`#grants-payments-view`; `renderStoreBills()` script.js:4707-4780)
- Head: "תשלומים לחנויות · {year}", "בכל מחצית משלמים לכל חנות לפי הקבלות על מה שמומש באותה מחצית"; half toggle `#bills-half-toggle`: "מחצית א' · תשרי–אדר" | "מחצית ב' · ניסן–אלול".
- Stats (3): "לתשלום במחצית {א/ב}' (לפי קבלות)", "שולם", "נשאר לשלם".
- Table: "חנות" / "צפי לפי חתנים" / "לתשלום לפי קבלות" / "מס' קבלה / חשבונית" / "סטטוס" / "קבלה" / action.
  - A row for every store of the year's package even without a bill; several bills per store allowed.
  - Status: "טרם הוזן חיוב"; "ממתין לתשלום"; "שולם ב-{date} · {method}"; legacy: "שולם · {date} · {method}" + "נרשם בשיטה הקודמת ({original store})"; notes under the status.
  - Receipt: attach_file "צפייה" (opens a signed URL in a new tab, 10 minutes) or "—".
  - Action (canEdit): "הזן חיוב" (no bill), "עריכה" (bill), "שיוך" (legacy payment).
  - Footer: "סה"כ מחצית {half}'", expected total, due total, "שולם ₪X · נשאר ₪Y".
- Footnote: ""צפי לפי חתנים" = {N} חתנים שקיבלו מענק במחצית הזו × עלות החבילה בכל חנות. בפועל משלמים לפי הקבלות, ולכן הסכום בדרך כלל נמוך יותר (תלושים שלא מומשו)." + " {N} חתנים בלי תאריך בשנה הזו לא נכללו בצפי."
- Button add_business "הוסף תשלום לחנות אחרת".
- Empty: icon storefront, "אין עדיין חנויות לשנה הזו", "החנויות מגיעות מתכולת המענק. אפשר גם להזין תשלום לחנות שאינה בתכולה.", button "הוסף תשלום לחנות".
- Legacy panel `#legacy-payments-panel` (only when unassigned old payments exist): "תשלומים שנרשמו בשיטה הקודמת · {year}", "רשומות ישנות שעוד לא שויכו למחצית. תשלום מאדר משויך אוטומטית למחצית א' ותשלום מאלול למחצית ב'"; table "חנות / ספק" / "תאריך" / "הוצאה / חשבונית" / "אמצעי" / "סכום ששולם" / button "שייך למחצית"; footer "סה"כ לא משויך".

### 15.4 Store-bill modal (`#store-bill-modal`, index.html:979-1021; script.js:4784-4948)
- Title "תשלום לחנות · {year}" / "תשלום ל{store} · {year}"; meta "עודכן ע"י {user} ב-{date}".
- Fields: "חנות" (datalist of store names), "מחצית" (two options), "סכום לתשלום לפי הקבלות (₪)", "מס' קבלה / חשבונית"; checkbox "שולם" revealing "תאריך תשלום" and "אמצעי תשלום" ("העברה בנקאית", "צ'ק", "מזומן", "אשראי", "אחר"); "קבלה (PDF או תמונה, עד 10MB)" file input with current-file line ("לא צורפה קבלה" or file name + "צפייה" + "הסר"); "הערות".
- Buttons: "שמור" ("מעלה קבלה..." / "שומר..."), "ביטול", "מחק" (existing only, any editor; undo toast "התשלום ל{store} על סך ₪X נמחק").
- Toasts: "יש להזין שם חנות", "יש להזין סכום לתשלום גדול מ-0", "הקובץ גדול מדי (עד 10MB)", "התשלום לחנות נשמר" / "התשלום עודכן", receipt errors (`receiptErrorMessage`, 4850-4856).
- Closes on X, "ביטול", backdrop.

### 15.5 Legacy-assign modal (`#legacy-assign-modal`, index.html:964-977; script.js:4652-4680)
Title "שיוך תשלום ישן למחצית"; description line "{store} · {date} · ₪X · {description}"; three option buttons: "מחצית א'" (תשרי–אדר), "מחצית ב'" (ניסן–אלול), "לא משויך" ("להשאיר ברשימת התשלומים הישנים"); current choice highlighted. Toasts "התשלום שויך למחצית {א/ב}'" / "הרשומה חזרה לרשימת התשלומים הישנים". Closes on X only.

---

## 16. Rules page "תקנון" (`#rules-screen`, index.html:628-630; `renderRulesScreen()` script.js:1790-1872)

Reached: sidebar; phone "עוד" sheet. Visible to all users. Content is generated from Settings.
- Hero: "תקנון צדקת רבי שמעון", "כללי גבייה, יעדים ומתנות", "שנת {campaign year}".
- Left column "יעדי גבייה לפי שלב": 2×2 cards "חיידר", "ישי"ק", "ישי"ג", "קיבוץ", each with the target and "יעד שנתי", or "—" and "לא הוגדר" (dimmed) when the target is 0.
- Right column:
  - "מתנות וזכאויות" (only for enabled gifts with amount > 0): card per gift with image (from the URL in settings; falls back to an icon on load error) or icon (directions_bus / card_giftcard), name, "לאיסוף ₪X ומעלה".
  - "בדיקת מצב אישי": input "חפש לפי שם..." (`takanonSearch` on every keystroke), dropdown of up to 8 matches (name + yeshiva), "לא נמצא בחור בשם זה"; picking a result shows a member mini-card (`takanonShowMember`, 1901-1959): name, "{yeshiva} · {type}", "שנת {year}", optional debt banner "קנס מהעבר: ₪X" / "יעד בסיס ₪A + קנס ₪B = נדרש ₪C", progress bar, three amounts "נאסף" / "יעד" (or "נדרש כולל") / "חסר" (or "הושלם"), gift badges ("זכאי ל{gift}" or "{gift}: חסר עוד ₪X").
- Bottom section "כללים נוספים" with the free text from Settings (only when not empty).
- Print hides the lookup box and member mini-card.

---

## 17. Settings "הגדרות" (`#settings-screen`, index.html:632-753; `renderSettings()` script.js:2002-2009)

Reached: sidebar footer; phone "עוד" sheet; dashboard new-year alert. Nav is admin-only.
Sub-nav `#settings-subnav` (aria "לשוניות הגדרות"), 7 tabs (`switchSettingsTab`, 1962-1966); the active tab is not kept in the URL:

### 17.1 flag "יעדים ושנה" (`data-pane="targets"`, default)
- Card "יעדים ושנת פעילות" / "הסכומים שכל בחור צריך להגיע אליהם לפי שלב הלימוד".
- "שנת קמפיין נוכחית" — FREE TEXT input (placeholder 'לדוגמה: תשפ"ו').
- "יעד לפי שלב לימוד": number inputs "חיידר", "ישי"ק", "ישי"ג", "קיבוץ" (₪).
- "מתנות ותוספות (הפעל / כבה לפי הצורך)": two gift cards, each with name input (placeholder "שם המתנה"), on/off switch, amount (₪), "קישור לתמונה (URL)".
- "כללים נוספים לתקנון (יופיעו בתחתית מסך התקנון)" textarea.
- Button save "שמור יעדים" (`#btn-save-settings`); toast "הגדרות המערכת נשמרו בהצלחה".

### 17.2 sell "קטגוריות הוצאות"
"הקטגוריות שיופיעו בעת רישום הוצאה חדשה". Chips with × (title "מחק קטגוריה"; undo toast "הקטגוריה "{name}" הוסרה"; "חייבת להישאר לפחות קטגוריה אחת"). Input "שם קטגוריה חדשה..." + "הוסף" (Enter also adds); toasts "הקטגוריה נוספה", "הקטגוריה כבר קיימת". No rename, no reorder (not found).

### 17.3 monitor_heart "תקינות נתונים"
"בחורים עם נתונים חסרים שעלולים לפגוע בדוחות ובזכאות". Four rows with icon, title, count, chevron (clickable when count > 0; green check when 0):
- "בחורים ללא סוג מסגרת (פוגע בזכאות וביעדים)"
- "בחורים ללא ישיבה"
- "בחורים ללא מספר טלפון"
- "שמות כפולים אפשריים"
Click opens `#data-health-modal` (index.html:782-790; `openDataHealthDetail`, 2193-2218): title "תיקון: בחורים ללא סוג מסגרת" / "תיקון: בחורים ללא ישיבה" / "תיקון: בחורים ללא מספר טלפון" / "שמות כפולים אפשריים". One row per member (name + yeshiva/address) with an inline fix: type select ("בחר...", חיידר, ישיבה קטנה, ישיבה גדולה, קיבוץ; saves on change), or text input "שם הישיבה" + "שמור", or "050-0000000" + "שמור". Fixed rows disappear; "הכל תוקן!" / "הכל תקין! אין בחורים לתיקון כאן."; toast "תוקן ונשמר". Duplicates view: groups "{name} ({count})" with yeshiva, phone and button "פתח פרופיל" (jumps to the member card); "אין כפילויות.". No merge function (not found). Closes on X only.

### 17.4 cloud_sync "גיבוי וסנכרון"
"סנכרון מול הענן, ייצוא וייבוא של גיבוי מלא". Four count cards: "בחורים", "הפקדות", "הוצאות", "כתובות פורים". "סנכרון אחרון" + time or "טרם סונכרן". Buttons: sync "סנכרן עכשיו" ("מסנכרן..."; toasts "הנתונים סונכרנו" / "הנתונים נטענו, אבל N שינויים עדיין ממתינים לשליחה" / "הסנכרון נכשל: …"), download "ייצוא גיבוי" (JSON file `גיבוי_צדקת_רבי_שמעון_{date}.json`; toast "קובץ הגיבוי ירד"), upload "ייבוא גיבוי" (file picker, JSON; admin; confirm "ייבוא גיבוי לשרת"; toasts "הגיבוי יובא ונשמר בשרת", "הקובץ אינו קובץ גיבוי תקין", "רק מנהל יכול לייבא גיבוי").

### 17.5 manage_accounts "משתמשים"
"משתמשים והרשאות" / "סמנו מה כל משתמש רשאי לראות ולעשות, ולחצו "שמור". ההרשאות נאכפות גם בשרת." Table: "שם משתמש" (+ chip "מנהל") / "הוספה ועריכה" / "הכנסות ופורים" / "הוצאות" / "מענקים" / "היסטוריית זכאות" / button "שמור" per row. Admin rows: all boxes checked and disabled, no save button. Toast "ההרשאות של {user} נשמרו. הן ייכנסו לתוקף בכניסה הבאה שלו". Help box: "הוספת משתמש חדש או איפוס סיסמה נעשים בלוח הבקרה של Supabase: Authentication → Users → Add user (מייל בסגנון name@tzedaka.local וסיסמה). שם המשתמש לכניסה הוא החלק שלפני ה-@ בכתובת, ושם התצוגה בעברית נקבע בעמודה display_name בטבלת profiles." Empty: "אין משתמשים להצגה". Not found in the app: create user, delete user, reset password, rename, toggle admin.

### 17.6 location_on "סכומי פורים"
"סכומים סופיים לקבוצות פורים" / "הסכום הסופי שנאסף לכל קבוצה, לפי שנה. מוצג לצפייה בלבד במסך כתובות פורים". Table: "קבוצה" + 4 year columns (campaign year −3 … campaign year), number input per cell; button "שמור סכומים" (`#btn-save-purim-sums`); toasts "הסכומים נשמרו בהצלחה!", "לא בוצעו שינויים". Empty: "אין עדיין קבוצות פורים" + button "למסך כתובות פורים". These sums feed the dashboard "נגבה השנה", the income charts and the expenses ratio.

### 17.7 history "יומן פעולות"
"מי רשם, שינה או מחק, ומתי. 300 הפעולות האחרונות." Loaded when the tab is clicked (`renderAuditLog`, 1982-1999). Table: "מתי" (date + HH:MM) / "משתמש" / "פעולה" ("הוספה", "עדכון", "מחיקה", "ייבוא", "סימון תשלום", "העלאת קבלה") / "על מה" ("בחור", "הפקדה", "הוצאה", "כתובות פורים", "הגדרות", "קטגוריית הוצאה", "מקבל מענק", "תכולת מענק", "שנת מענקים", "תשלום לחנות", "גיבוי", "הרשאות משתמש") / "פרטים" (before ← after or key: value list). States: "טוען...", empty "עדיין אין פעולות ביומן". No filter, search, paging or export (not found).

---

## 18. Idle lock and logout

- `startIdleTimer()` (script.js:5755-5784): any mouse/touch/key activity resets. At 580 s of inactivity the modal `#timeout-warning-modal` (index.html:1024-1033) opens: icon timer, "המערכת עומדת להינעל", "זיהינו חוסר פעילות. למען אבטחת הנתונים, המערכת תתנתק בעוד {20} שניות.", button "השאר אותי מחובר". At 600 s `performLogout(true)`.
- On auto-lock an open member/donation/expense form is saved as a draft and restored after the next login with toast "שחזרנו טופס שהיה פתוח לפני שהמערכת ננעלה. אפשר להמשיך ולשמור" (script.js:5833-5863).
- Manual logout (`performLogout(false)`, 5803-5822): flushes pending deletes; if unsent writes exist, confirm "יש שינויים שעוד לא נשמרו בשרת" / "{N} שינויים ממתינים לשליחה (אין חיבור כרגע). הם יישארו שמורים במחשב הזה ויישלחו בכניסה הבאה." / "צא בכל זאת" / "הישאר"; clears the cached data; reloads the page to the login screen.

---

## 19. Responsive rules that change what is shown

| Width | Effect |
|---|---|
| ≤1180px | dashboard panels in one column |
| ≤1150px | grants view 1 panels stack |
| ≤1023px | sidebar 208px; KPI grid 3 columns; metric rows 2 columns; member card head stacks; toolbars wrap |
| ≤767px | phone mode: top bar + bottom nav + "עוד" sheet; desktop header and sidebar hidden; dashboard hero text and refresh/logout hidden; KPI grid 2 columns; members table → cards (5.6); members toolbar loses edit-mode, density, print; every other table with more than 3 columns becomes stacked "label : value" rows (`labelTablesForMobile`, script.js:234-256; tables with ≤3 columns such as the report tables stay as tables); all modals and dialogs become bottom sheets (max 92vh); inputs 44px high |
| print | see 1.8 |

---

## 20. Export / print inventory

| Where | Control | Output |
|---|---|---|
| Members list | download icon | CSV `רשימת_בחורים_{date}.csv` of the filtered table |
| Members list | print icon | browser print with header (desktop only) |
| Daily report | print icon | browser print |
| Grants toolbar | "ייצוא" | CSV of recipients or of the store bills of the active half |
| Grants recipients panel | "אקסל" | CSV `מקבלי_מענק_{year}_{date}.csv` |
| Grants toolbar | "הדפסה" | browser print |
| Purim group | print icon | new window print of one group |
| Purim group | download icon | `.xls` (HTML table) of one group |
| Settings → backup | "ייצוא גיבוי" / "ייבוא גיבוי" | full JSON backup |
| Store bill | "צפייה" | opens the scanned receipt in a new tab |
Not found: export of the transactions report, expenses summary, dashboard drill-downs, audit log, member card; PDF generation; real `.xlsx`.

---

## 21. Gaps, oddities and "not found" list (useful when rebuilding)

1. No route guard in the client (see 2.3); permissions only hide nav items and some buttons.
2. Member delete lives only in the list row menu; donation/expense delete only inside their edit modal; member, donation, expense and category deletes are admin-only; store-bill delete is open to any editor; grant-recipient remove has no client gate at all (the server requires edit + grants permission). All of them use a 6-second undo toast instead of a confirm dialog.
3. Member modal auto-saves on X / backdrop; donation and store-bill modals discard on backdrop; expense, data-health, legacy-assign and Nedarim modals do not close on backdrop. Esc closes only the generic dialog and the row menu.
4. The dashboard year selector is hard-coded (8 years) and local to the dashboard; members list, member card, rules lookup and report always use the campaign year from Settings.
5. Report period filters are intersected with the campaign year (except "כל התקופות").
6. Purim screen cannot add or delete addresses or groups; sums are edited in Settings by admins only and keyed by group name.
7. Grant recipients are not linked to member records; years 5785/5786 rows may have no names.
8. Users cannot be created, removed or given a password inside the app.
9. `btn-inner-add-expense` is referenced in `applyPermissions` but does not exist; `openSettingsTab` is whitelisted but unused; `sessionStorage["ezer_active_session"]` is removed on logout but never set.
10. Member card does not show notes, father name or marital status; phone cards hide target, gap and status.
11. No global search, no notifications center, no dark-mode toggle, no language switch, no help page, no user profile/password screen (not found).
12. The member datalist exposes the internal id in the text the user sees ("… [M-…]"), and the id is parsed back from that text (`extractMemberId`, script.js:135-139).

---

## 22. Index of the 72 declarative actions (where each is triggered)

- Navigation / shell: `switchScreenAction` (bottom nav; Purim-sums empty state), `openMoreSheet`, `closeMoreSheet`, `goFromMoreSheet`, `logoutFromMoreSheet`, `mobileRefresh`, `printPage`, `resetIdleTimer` (timeout modal), `syncNow` (Purim empty state), `openSettingsTab` (unused).
- Dashboard: `renderDashboard` (year select), `openDashboardDrill` (KPI cards, alerts, segments), `closeDashboardDrill`, `openDashboardMember`, `openNedarimModal`.
- Members: `updateTypeFilter`, `handleMembersEditButton`, `cancelMembersEdit`, `toggleMembersDensity`, `clearMembersFilters`, `openMemberRowMenu`, `openMemberFromMenu`, `openDonationFromMenu`, `openMemberEditFromMenu`, `deleteMemberRow`, `openMemberModal` (empty states), `openDonationModal` (rows, empty states), `openExpenseModal` (rows, empty states).
- Expenses summary: `onExpensesYearChange`, `toggleExpenseYears`.
- Purim: `togglePurimGroupEdit`, `cancelPurimGroupEdit`, `printPurimGroup`, `exportPurimGroupToExcel`, `togglePurimSpacing`, `togglePurimYears`.
- Grants: `selectGrantsArchiveYear`, `addGrantsArchiveYear`, `switchGrantsView`, `exportGrantsToExcel`, `exportGrantsArchiveRecipients`, `toggleGrantsAddForm`, `submitGrantsAddRecipient`, `editGrantsArchiveRecipient`, `removeGrantsArchiveRecipient`, `toggleGrantsPackageEditMode`, `cancelGrantsPackageEdit`, `addGrantsPkgGroup`, `removeGrantsPkgGroup`, `addGrantsPkgItem`, `removeGrantsPkgItem`, `updateGrantsPkgGroupField`, `updateGrantsPkgItemField`, `switchBillsHalf`, `openStoreBillModal`, `closeStoreBillModal`, `saveStoreBill`, `deleteStoreBill`, `viewStoreBillReceipt`, `clearStoreBillReceipt`, `openLegacyAssign`, `closeLegacyAssign`, `saveLegacyAssign`.
- Rules: `takanonSearch`, `takanonShowMember`.
- Settings: `removeExpenseCategory`, `openDataHealthDetail`, `closeDataHealthModal`, `applyHealthFix`, `applyHealthFixFromInput`, `openMemberFromHealth`, `saveUserPermissions`.
