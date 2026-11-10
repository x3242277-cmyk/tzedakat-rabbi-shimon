# 04 · Behaviours, editing flows and details of the OLD system

Read-only study of `/home/user/tzedakat-rabbi-shimon` (repository root = the live "old" app). Nothing outside `redesign/old-study/` was changed.

Sources read in full: `script.js` (5864 lines, read in chunks 1-5864), `index.html` (1040 lines), `supabase-integration.js` (268), `boot.js`, `_headers`, `_redirects`, `serve.json`, `manifest.json`, `.gitattributes`, `.gitignore`, `supabase/SETUP.md`, `supabase/security-update.sql` (policies part). `style.css` was read for the toast / banner / saving-indicator / accessibility blocks (1720-1880), the responsive and print blocks (2700-2988), and grepped for every editing, focus and density selector. `supabase/schema.sql` and `start-site.bat` / `tools/make-icons.ps1` were skimmed.

Conventions (same as `01-screens.md` and `02-rules.md`):
- `script.js:NNN`, `index.html:NNN`, `style.css:NNN` are line numbers. `fn()` is a function in `script.js` unless stated.
- Hebrew strings are quoted exactly as in the source, including punctuation (`!`, `.`, `...`).
- "not found" = looked for and absent.
- To avoid repeating earlier files: screen layout lives in `01-screens.md`, calculations in `02-rules.md`. This file covers how things behave: defaults, validation, what is saved when, what the user sees, and edge cases. Cross-references are written "see 01 §9" / "see 02 §19".

---

## 0. The shared save pipeline (every flow below uses it)

Understanding this first explains almost every toast in the app.

1. **Optimistic local change.** Every create / edit / delete first changes `state` in memory, calls `saveState()` (copy to `sessionStorage`, `script.js:2460-2468`), closes the dialog and re-renders everything with `renderAll()` (`script.js:5737-5745`: dashboard, members table, report, expenses summary, grants, Purim, and the rules screen if open). The screen is updated before the server answers.
2. **Queue.** `persist(op, payload)` (`script.js:454-460`) puts the write in a queue in **`localStorage["ezer_pending_writes"]`** (`enqueueWrite`, 407-415). A newer write of the same record replaces an older unsent one (`pendingEntityKey`, 399-405: `member:{id}`, `donation:{id}`, `expense:{id}`, `settings`, `grants`, `purim:{__sbId}` or `purim:{עיר}|{קבוצה}|{מס'}`).
3. **Flush.** `flushPendingWrites()` (423-451) sends the queue in order. A 4xx other than 401/408/429 is "permanent" (`isPermanentWriteError`, 418-421): the item is dropped and the toast `השרת לא אישר את השמירה ({label}): {reason}` appears, with `{reason}` = `אין לך הרשאה לפעולה הזו` for 403, else the error text. Labels (`WRITE_LABELS`, 387-390): `פרטי בחור`, `מחיקת בחור`, `הפקדה`, `מחיקת הפקדה`, `הוצאה`, `מחיקת הוצאה`, `כתובת פורים`, `הגדרות`, `נתוני מענקים`. Any other failure keeps the item queued.
4. **Retry.** Automatically on the browser `online` event and every 30 s (505-506); manually from the banner (section 12.3) or any data refresh (`fetchDataFromServer` flushes first, 793).
5. **Report.** `reportSave(saved, okMsg)` (463-466): success toast with the flow's own message, or, if writes are still queued, `אין חיבור לשרת כרגע. השינוי שמור במחשב הזה ויישלח אוטומטית כשהחיבור יחזור` (warning). A rejected write shows only the rejection toast.
6. **After a reload from the server**, unsent writes are re-applied on top of the server data (`applyPendingWritesToState`, 469-485) so they do not vanish from the screen.
7. **Audit.** Most flows also call `logAudit(action, entity, id, details)` (555-559), fire-and-forget; failures are silent.

Consequences a redesign must keep or consciously change:
- A write the server **rejects is not rolled back locally**; the screen keeps showing the rejected value until the next data reload (no code reverts `state` after a permanent error, 436-441).
- The queue is **not tied to a user**: it lives in `localStorage`, survives closing the browser, and is flushed with whoever logs in next on that computer (`flushPendingWrites` only checks `SB.isLoggedIn()`, 426).
- If the session has expired and the refresh token fails, `SB.request` clears the session and throws `ההתחברות פגה - יש להתחבר מחדש` (`supabase-integration.js` `request`). That error is not "permanent", so the write stays queued and the user sees the **"no connection" warning**, not a "log in again" prompt. There is no redirect to the login screen on expiry (not found).
- Settings and the grants archive are single JSON documents. Their saves go through `saveSettingsPatch` (511-530) and `mutateGrantsArchive` (533-552): saves are chained one after another; before each, the latest copy is fetched from the server and only the current change is re-applied, so two users editing different parts do not overwrite each other. When the merged result differs from what was on screen, everything is re-rendered.

---

## 1. Deposit dialog `#add-donation-modal` (index.html:793-824; script.js:1531-1643)

Layout and entry points: see 01 §9. Behaviour:

### 1.1 Opening (`openDonationModal(memberId, donationId)`, 1612-1643)
- Permission: if the user cannot edit, toast `אין לך הרשאת עריכה` (warning) and nothing opens (1615). This also fires when a non-editor clicks a row in the transactions report (those rows are clickable for everyone, 3711). On the member card the rows are clickable only for editors (1252).
- Defaults for a new deposit: `תאריך` = today (`getTodayIsoDate`, local time); `שייך לשנת` = campaign year; payment method `מזומן`; amount and notes empty; member field empty, or prefilled as `"{lastName} {firstName} | {yeshiva} [{id}]"` when opened from a member (card, row menu, profile empty state).
- Year select (`populateYearSelect`, 1519-1529): campaign year −4 … +1 from the 16-year list; the campaign year option reads `{year} (שנת הקמפיין)`. When editing a deposit whose year is outside that window, its year is appended at the end. If the campaign year is not in the list, the window is built around the last list year (`תש"צ`).
- Editing: date converted for the date input (`toDateInputValue`); an unparseable stored date becomes an empty field and is saved as today (see 02 Q11). The notes prefix `(אשראי) ` is stripped and turns the radio to `אשראי` (1619-1624).
- Title `עריכת הפקדה` / `רישום הפקדה חדשה`; meta `נרשם ב-{DD/MM/YYYY of createdAt}`; `מחק הפקדה` visible only for admin on an existing deposit (1639).

### 1.2 Member autocomplete
- `<input list="members-datalist">` (index.html:805), placeholder `הקלד שם או ישיבה...`. The datalist is native browser autocomplete over option strings `"{lastName} {firstName} | {yeshiva} [{id}]"`, sorted by last + first name in Hebrew order (`populateMemberSelect`, 5400-5417). Married and old members are included. The list is rebuilt after member saves/deletes and whenever the deposit dialog closes (1533).
- The member is identified only by the trailing `[id]` (`extractMemberId`, regex `/\[(.*?)\]$/`, 135-139). Typing a name without picking from the list, or editing the text after picking, fails validation.

### 1.3 Validation and save (`handleSaveDonation`, 1541-1584)
- Amount: `parseAmount` (5422-5425) removes `,`, `₪` and spaces, needs a finite number > 0, rounds to 2 decimals. The field is `type="number" min="0" step="any"`.
- Messages: `יש לחפש ולבחור בחור מתוך הרשימה, ולהזין סכום גדול מ-0` (no `[id]` or bad amount); `שגיאה: נתוני הבחור לא אותרו במערכת` (id not found).
- No other checks: date may be empty (becomes today), in the future, or far in the past; duplicates are not detected (not found).
- Saved object: `{ id ("D-{ms}-{0..999}") or existing id, date, memberId, memberNameSnapshot = full name now, year, amount, notes, createdAt (kept on edit) }`. Credit is not a field: `אשראי` saves `notes = "(אשראי) " + notes` (1567). Editing allows changing member, year, amount, date.
- While saving the button shows `שומר...` (disabled), then `שמור הפקדה`. The dialog closes immediately; if the member card is open it is refreshed. Toasts `ההפקדה נרשמה בהצלחה!` / `ההפקדה עודכנה` (via `reportSave`).
- Audit: create `{amount, member name, year}`; update `{before: {amount,date,member,year}, after: {...}}`.

### 1.4 Delete (`handleDeleteDonation`, 1586-1610)
- Admin only (the button is hidden for others, and the function returns early). No confirm dialog: the dialog closes, the deposit disappears, and the undo toast `ההפקדה על סך ₪X נמחקה` with `בטל פעולה` shows for 6 s (section 12.2). After 6 s the delete is queued and sent.

### 1.5 Closing
- X, `ביטול` and a backdrop click all **discard** (1533-1538). No unsaved-changes warning (not found). Esc does nothing (not found).
- Enter in a field does not submit (the dialog is not a `<form>`; no key handler, not found).

---

## 2. Expense dialog `#add-expense-modal` (index.html:826-847; script.js:1645-1725)

### 2.1 Opening (`openExpenseModal(expenseId)`, 1653-1674)
- Needs edit permission even just to view an existing expense (1656): toast `אין לך הרשאת עריכה`.
- Category select is rebuilt from Settings categories (`populateExpenseCategorySelect`, 2142-2150). The static HTML labels (`כנסים ואירועים`, `סעודות ואוכל`, `מתנות ופרסים`, `תפעול ופרסום`, index.html:836) are replaced by the bare category names (`כנסים`, `סעודות`, ...). When editing an expense whose category was deleted from Settings, that category is added to the list for this dialog only.
- Defaults (new): date today; year = campaign year (same −4…+1 select); category = first category in Settings (fallback `שונות`); description and amount empty.
- Title `עריכת הוצאה` / `הוספת הוצאה` (static HTML `רישום הוצאה` is overwritten); save button `שמור שינויים` / `הוסף הוצאה` (static `שמור הוצאה`); meta `נרשם ע"י {approvedBy} ב-{date}` (either part omitted when empty).

### 2.2 Validation and save (`handleSaveExpense`, 1676-1703)
- Only the amount is checked: `יש להזין סכום גדול מ-0`. Description may be empty; category is always one of the options.
- `approvedBy` = the user who created it; editing keeps the original creator (1688). `createdAt` kept.
- Toasts `ההוצאה נרשמה בהצלחה!` / `ההוצאה עודכנה`. Audit before/after on amount, category, description.

### 2.3 Delete (`handleDeleteExpense`, 1705-1725)
Admin only; undo toast `ההוצאה "{description or category}" נמחקה`; 6 s.

### 2.4 Closing
X and `ביטול` discard. **Backdrop click does nothing** (no listener, 1645-1651), unlike the deposit dialog.

---

## 3. Member form `#add-member-modal` (index.html:849-885; script.js:1393-1516)

### 3.1 Fields and defaults
| Field (label) | Control | Default new | Default edit |
|---|---|---|---|
| `שם פרטי` | text | empty | stored |
| `שם משפחה` | text | empty | stored |
| `שם האב` | text | empty | stored |
| `טלפון` | text, `inputmode="tel"`, LTR | empty | stored |
| `ישיבה` | free text (no list) | empty | stored |
| `סוג מסגרת` | select `ישיבה קטנה` / `ישיבה גדולה` / `חיידר` / `קיבוץ` | `ישיבה קטנה` | stored, **or `ישיבה קטנה` when empty** (1505) |
| `שיעור` | select `א'` … `ט'` (values `א` … `ט`) | `resetMemberForm` sets value `""`, which matches no option; by the HTML rules for setting `select.value` no option is then selected, so the field looks blank and saves `""` unless the user picks one (read from the spec, not run in a browser) | stored, **or `א` when empty** (1506) |
| `סטטוס משפחתי` | select `רווק` / `נשוי` | `רווק` | stored or `רווק` |
| `כתובת (למשל: רחוב, עיר)` | text | empty | stored |
| `הערות` | text (single line) | empty | stored |

### 3.2 Shiur options per framework
- **There is no per-framework list.** The same nine options `א'`–`ט'` are offered for ישיבה קטנה, ישיבה גדולה and קיבוץ (index.html:861-871). The only rule in the form: choosing `חיידר` hides the whole `שיעור` group and clears it (1407-1422); any other choice shows it again. The `change` event is dispatched on open (1513) so the field is shown/hidden correctly.
- The calculations only understand some of them: ישיבה קטנה / גדולה use `א`, `ב`, anything else = `ג`; קיבוץ uses `א`–`ט` (see 02 §3). So picking `ד` for ישיבה קטנה is accepted and computed as `ג`.

### 3.3 Phone formatting (`bindPhoneFormatting`, 1149-1158)
On every keystroke: remove all non-digits, insert `-` after the 3rd digit (`0501234567` → `050-1234567`). No length limit, no validation. Applies only in this dialog; the inline table edit, the data-health fix and the grants form do not format.

### 3.4 Validation and save (`handleSaveMember`, 1449-1494)
- Only first and last name are required: toast `יש להזין שם פרטי ושם משפחה` (danger).
- The saved record is rebuilt from the form fields only (plus `id`, `createdAt`), so any extra field a record had is dropped (1455-1463).
- Feedback is the floating **saving indicator**, not a toast: `מעדכן...` with a spinner, then `עודכן בהצלחה` (green) or `נשמר במחשב, ממתין לשליחה` (warning) for 2.2 s (`showSavingIndicator` / `hideSavingIndicator`, 1425-1447). The button shows `שומר...` then `שמור בחור`.
- After save: datalist and filters rebuilt, all screens re-rendered, member card refreshed if it is open for this member.
- Audit create/update `{name}`.

### 3.5 Closing (auto-save)
- `ביטול` discards.
- **X and backdrop click auto-save** when both names are filled (`closeWithAutoSave`, 1397-1405). For an existing member the auto-save is skipped if nothing changed (1466-1473). For a new member with names filled, X creates the member.
- Combined with 3.1, auto-save can silently write `ישיבה קטנה` / `א` / `רווק` into a member whose fields were empty (see 02 Q3).
- No delete button in this dialog (delete is in the members row menu, admin only).
- Open does not check permissions (`openMemberModal`, 1496); only the buttons that open it are hidden for non-editors.

---

## 4. Members table: inline edit mode, density, sort, row menu (script.js:3406-3667)

### 4.1 Inline ("quick") edit mode
- Toggle: pencil icon `#btn-members-edit-mode` (title `מצב עריכה`) → `handleMembersEditButton` (3604-3607). Not hidden for non-editors (it is not in the `applyPermissions` list, 734-742); hidden on phones by CSS (style.css:2853).
- Enter (`enterMembersEditMode`, 3609-3619): the table gets class `members-editing`; the red missing-info `*` is removed; the first five cells of every visible row become `contenteditable`: `שם פרטי`, `שם משפחה`, `שם האב`, `ישיבה`, `שיעור` (`td[data-field]`). City, amounts, status are not editable. The pencil becomes a save icon (title `שמור שינויים`) and a red X `בטל עריכה` appears.
- While editing: row click no longer opens the card (3500); the row menu still works; editable cells get an inset outline and gold focus ring (style.css:485-487, 2435-2436).
- Save (`saveMembersEdit`, 3635-3667): reads `textContent` of each cell; `---` (the placeholder for empty father name / חיידר shiur) is saved as empty. Every changed member is saved separately; toast `נשמרו {N} שינויים` where N counts **changed cells**, not members. No change → just re-renders. Audit per member `{via: "עריכה בטבלה"}`.
- No validation: a first name can be blanked; shiur accepts any text (see 02 Q25). No Enter / Tab handling (not found): Enter inserts a line break inside the cell as the browser does by default.
- Cancel (`cancelMembersEdit`) re-renders from `state`, discarding typed text, without a toast.
- Edits are lost without warning when: the user leaves the members screen (`switchScreen` calls `exitMembersEditMode`, 2482); the table re-renders for any reason (typing in search, changing a filter, sorting, a data refresh, any save elsewhere calls `renderAll`), because rows are rebuilt from `state` while edit mode stays on (3530-3533).

### 4.2 Density toggle
- Button `צפוף / מרווח` (icon `density_small`, index.html:278) toggles class `compact-view` on the members table only (`toggleMembersDensity`, 201-204). The table starts compact (index.html:284). Compact = `padding: space-2 space-3; font-size: fs-sm`; normal = `space-3 space-4` (style.css:2408-2409). The icon does not change, the choice is not remembered (resets on reload), and it is hidden on phones.
- Purim tables have their own per-group spacing button (section 8.4).

### 4.3 Sort
- Click a header `.sortable-header` (`שם פרטי`, `שם משפחה`, `שם האב`, `ישיבה`, `שיעור`, `עיר`, `נאסף השנה`, `יעד`, `פער`): first click ascending, second descending, a different column restarts ascending (926-939). Arrow icon in CSS `::after` (`arrow_upward` / `arrow_downward`, style.css:2431-2432). Numeric for the three money columns, Hebrew `localeCompare` otherwise, `עיר` sorts by the text after the last comma of the address. Sort is not remembered. Headers are not keyboard-reachable (plain `<th>` with a click listener; no `aria-sort`, not found).

### 4.4 Search and filters
- Search input is debounced 250 ms (`runMemberFilter`, 1088). Yeshiva and city dropdowns are rebuilt on every render, each narrowed by the other filters and the search; a selected value that disappears resets to `כל הישיבות` / `כל הערים` (3422-3452). Static HTML says `הכל`; after the first render the runtime text is `כל הישיבות` / `כל הערים`.
- Clear filters (`#btn-clear-members-filters`, title `נקה סינונים`) resets search, both dropdowns, `ישי"ק`, `ישי"ג`, `נשואים` (1095-1106).
- Entering the members screen always shows the list (not the card) and focuses the search box after 80 ms (2500-2506).

### 4.5 Row menu
See 01 §5.4 for items. Behaviour: opens below the kebab button, or above it when there is no room (3558-3561); focus moves to the first item (3562-3563); closes on outside click (capture listener), any scroll, Esc, or a second click on the same kebab (3569-3575, 3542-3544). No arrow-key navigation (not found). Items are `role="menuitem"` inside `role="menu"`.

### 4.6 Member delete (`deleteMemberRow`, 3579-3601)
Admin only; no confirm; undo toast `{first last} נמחק` (or `הבחור נמחק`); undo puts the member back at the same position; deposits are kept.

---

## 5. Member card and eligibility-history modal

Content: see 01 §6-7. Behaviour only:
- The card replaces the list in place; there is no URL or history entry, so the browser Back button leaves the members screen instead of returning to the list (`popstate` handler 916-923 switches screens only).
- `חזרה לרשימה` shows the list again; the list keeps its filters and scroll.
- Deposit rows in the card open the deposit dialog for editing (editors only, tooltip `לחיצה לעריכה`).
- History modal closes on X, `סגור`, backdrop (1291-1297). Non-holders of `היסטוריית זכאות` see only the current-year row (1310-1316).

---

## 6. Credit-card clearing flow (Nedarim Plus) (`#nedarim-modal`, index.html:908-962; script.js:956-1067)

Screens and texts: see 01 §11. Behaviour:
1. `openNedarimModal` (1056-1067) shows the iframe step and loads `https://www.matara.pro/nedarimplus/online/?mosad=7011408`. The entry button `סליקת אשראי` on the dashboard is **not** permission-gated (not in the `editButtons` list), and the final save does not check edit permission either; the server rejects a non-editor's insert.
2. The only way out of step 1 is the X (title `סגור / סיימתי תשלום`): it hides the iframe, **clears its `src`**, and shows the question step (959-973). From steps 2-3 the X closes the whole modal.
3. `לא / ביטלתי` closes; nothing is recorded.
4. `כן, התשלום עבר` resets and shows the form: member empty, amount empty, confirmation empty, notes `אשראי - נדרים פלוס` (982-992).
5. Save (`btn-save-nedarim-final`, 1001-1053): member from the datalist `[id]` + amount > 0, else `חובה לחפש בחור מתוך הרשימה ולהזין סכום ששולם (גדול מ-0)`; unknown id `הבחור לא אותר. אנא בחר מהרשימה התואמת`; empty confirmation → confirm dialog (section 12.4, #1). Notes get ` | אישור עסקה: {number}`. The deposit is dated **today** and assigned to the **campaign year**; there is no year or date field. Button `שומר...` while saving. Toast `התרומה נרשמה בהצלחה לזכות הבחור!`. Audit `{amount, member, via: "נדרים פלוס", confirmation}`.
6. `ביטול רישום` closes without saving (after the user said the payment went through).
- No backdrop or Esc close (not found).
- **Quirk:** these deposits do not carry the `(אשראי) ` prefix, so opening one in the deposit dialog shows the payment method `מזומן`, and any statistics based on the prefix would count them as cash. A redesign that shows "cash vs credit" must decide how to classify `אשראי - נדרים פלוס` notes.
- Nothing is read back from Nedarim Plus; amount and confirmation are typed by the user.

---

## 7. Transactions report and expenses summary (interactions only)

- Period select (`report-time-filter`, index.html:404-411): `היום` (default on every load), `אתמול`, `השבוע` (from Sunday of this week), `השנה`, `כל התקופות (כל השנים)`, `תאריך ספציפי...` (reveals the date input `בחר תאריך`). Every option except "all" is intersected with the campaign year (3694; 02 Q14). `השנה` has no date test at all: it means "everything attributed to the campaign year", undated deposits included (3683-3693).
- Rows in both tables are clickable (`לחיצה לעריכה`) and open the edit dialogs (permission toast for non-editors).
- Charts: Chart.js bar chart of income per Gregorian month (labels `ינואר`…`דצמבר`), drawn 30 ms after entering the screen because a hidden canvas measures 0 (2493-2495). The SVG finance chart (`renderFinanceChart`, 2795-2902) redraws when its width changes by more than 8 px (`ResizeObserver`, 2905-2913); each bar has a focusable hit area (`tabindex="0"`, `role="img"`, `aria-label "{year} {הכנסות/הוצאות} ₪X"`) and a tooltip that opens on hover **or keyboard focus** (2894-2899), with the per-series breakdown, the grants-cost note and `סה"כ ₪X`.
- Expenses summary: year select `שנת ניתוח` (re-renders KPIs and charts), `הצג כל השנים` / `הצג פחות שנים` toggles between the last 5 and all expense years in the category cards (3977-3989). Neither choice is remembered.
- No export from either screen (not found); print only (section 10).

---

## 8. Purim addresses: tabs, edit mode, per-year columns (script.js:4952-5249)

### 8.1 Tabs
City tabs, then group tabs labelled `{group} ({N})`. The chosen city/group is kept in `state.purimActive` across re-renders (4989-4991, 5132, 5152), but not across reloads. Rows with no city or group are grouped under `ללא עיר` / `ללא שיוך`.

### 8.2 Per-year columns
- Table columns: `מס'`, `משפחה` (bold), `שם`, `רחוב`, `מספר`, `דירה`, then one column per Hebrew year, then `הערות`.
- Years shown (`getPurimYearsToShow`, 4959-4965): by default the **last 4** years ending at the campaign year; `כל השנים` shows the **last 8** (campaign −7 … campaign); the button flips to `פחות שנים` (icons `unfold_more` / `unfold_less`). One global toggle for all groups; not remembered. If the campaign year is not in the list, the window ends at `תשפ"ו`.
- The campaign-year column cells get class `purim-year-current` (highlighted); older years `cell-muted`.
- The per-address year cells are free text stored on the address row under the year label as key (e.g. `row['תשפ"ו']`). Nothing sums them (see 02 §16).
- The group's "final sums" chips at the top (`סכומים סופיים`, one chip per shown year, `—` when empty) come from Settings → `סכומי פורים`, are read-only here, and are keyed by group name only (02 Q15). Settings shows a different window: 4 years, campaign −3 … campaign (`getPurimSumsYearsWindow`, 2021-2027).

### 8.3 Edit mode (`togglePurimGroupEdit`, 5169-5215)
- `עריכה` makes every `td[data-field]` of that group's table `contenteditable`: `משפחה`, `שם`, `רחוב`, `מספר`, `דירה`, each shown year column, `הערות`. `מס'` is not editable. Buttons switch to `ביטול` and `שמור`.
- No client permission check (anyone who can open the screen sees `עריכה`); the server requires edit + income permission.
- Save reads `innerText`, compares with the stored value, saves only changed rows (one write per row), then re-renders all Purim groups. Toasts: `נשמרו בהצלחה {N} שורות!`; no change → `לא בוצעו שינויים`.
- `ביטול` restores a snapshot of all addresses and re-renders; toast `השינויים בוטלו בהצלחה.` (even if nothing was typed).
- No add row, delete row, add group or rename group (not found). No validation of year cells (any text).
- The snapshot is global (`purimEditSnapshot`), and any re-render (data refresh, a save in another group, toggling years) silently drops the unsaved typing in every group.

### 8.4 Spacing, print, Excel
- `רווח` / `צפוף` (icons `density_large` / `density_small`) toggles `compact-view` on that group's table only (5240-5249); tables start compact; reset on any re-render.
- Print and Excel: section 10.3 and 11.3.

---

## 9. Grants screen editing flows (script.js:4126-4948)

### 9.1 Year
- Select shows `{year} ({number of recipients})`, sorted by the year list. Changing year cancels package editing and closes the add form without asking (`selectGrantsArchiveYear`, 4428-4434).
- `+` button (`הוספת שנה`) opens a prompt (section 12.4, #4). The suggestion is the current Hebrew year if not present, else the next free year after the latest one; the message lists up to 3 next years. Any text is accepted (no validation). Existing year → switches to it and toast `השנה כבר קיימת - עברת אליה` (danger style). New year → toast `נוספה שנת {year} - הוסף כעת מקבלי מענק` and the add-recipient form opens.

### 9.2 Recipients (inline form, not a modal)
- `הוסף חתן` toggles the form `#grants-archive-add-form` open/closed and focuses the name (4436-4446). Fields: `שם ומשפחה (אפשר לבחור מרשימת הבחורים)` (uses the same members datalist, placeholder `הקלד שם...`), `תעודת זהות` (`inputmode="numeric"`, LTR), `טלפון` (`inputmode="tel"`, LTR, no formatting), `תאריך` (date).
- Picking a member from the datalist replaces the text with `"{first} {last}"` and copies the member's phone if the phone field is empty (1127-1136). No link to the member is stored (02 Q26).
- Validation: `יש להזין לפחות שם או תעודת זהות`. Empty fields are omitted from the record; each record gets `rid = "R-..."`.
- After **add** the form stays open and is cleared for the next groom; toast `החתן נוסף לרשימת מקבלי המענק`. **Edit** (pencil, title `עריכה`) fills the form, the submit becomes `שמור שינויים`; after save the form closes; toast `פרטי החתן עודכנו`. Old records without `rid` are matched by all four fields (`sameRecipient`, 4449-4452).
- Remove (X, title `הסר`): no confirm; undo toast `{name or id or "הרשומה"} הוסר מרשימת מקבלי המענק`; on undo the record is put back and saved again (4537-4550).
- The `הוסף חתן`, edit and remove buttons are not hidden for non-editors (only the empty-state button checks `canEditUser`, 4233); the server rejects.
- No duplicate check, no ID-number format check, no check against eligibility (not found).

### 9.3 Package editing ("מה מקבלים")
- `ערוך תכולה` copies the year's package into a draft and switches to the editor (4346-4356); the button becomes `שמור תכולה` and `ביטול` appears.
- Editor (`renderGrantsPackageEditorHtml`, 4322-4344), per store: `שם החנות` (placeholder `שם חנות`), `הנחה` (free text, placeholder `הנחה (למשל 15%)`), X `הסר חנות` (confirm, section 12.4 #3). Per item: `מוצר` (placeholder `שם מוצר`), `כמות לחתן` (number, min 0), `מחיר בחנות` (number, step 0.01), `עלות לארגון (ליחידה)` (number, step 0.01), X `הסר מוצר` (no confirm). Buttons `הוסף מוצר` (empty item, qty 1) and `הוסף חנות` (new store with one empty item).
- Typing updates the draft only; totals on screen are not recalculated while editing. Numbers: `Number(x) || 0`, so empty or invalid = 0; negative values are not blocked by code.
- `שמור תכולה` recomputes each item's `value = orgPrice × qty` and saves the draft as `years[year].package`; toast `תכולת המענק נשמרה`. A year with no own package shows the built-in default package (02 §17).
- The discount text is display only; it is not used in any calculation.
- `ביטול` discards the draft without a question.
- The edit button is not permission-gated in the UI.

### 9.4 Store payments and the bill dialog (`#store-bill-modal`, index.html:979-1021; script.js:4782-4948)
Screen texts: see 01 §15.3-15.4. Behaviour:
- Opening (`openStoreBillModal(billId, storeName)`, 4784-4809): edit permission required (`אין לך הרשאת עריכה`). Entry points: row `הזן חיוב` (store prefilled), row `עריכה`, `הוסף תשלום לחנות אחרת` and the empty-state button (store empty).
- Defaults: `מחצית` = the half currently shown; `שולם` unchecked; `תאריך תשלום` = today; `אמצעי תשלום` = `העברה` (option text `העברה בנקאית`). The paid date and method fields are shown only while `שולם` is checked (`updateStoreBillPaidFields`, 4813-4817).
- Store field is free text with a datalist of the year's package stores plus stores that already have bills; a new name creates a new row in the table. Several bills per store and half are allowed.
- Validation order: `יש להזין שם חנות`; `יש להזין סכום לתשלום גדול מ-0` (so a ₪0 bill cannot be saved); file larger than 10 MB `הקובץ גדול מדי (עד 10MB)`. The file input accepts `application/pdf,image/*`; the server bucket allows PDF, JPEG, PNG, WebP, HEIC, HEIF up to 10 MB (`security-update.sql`); other image types pass the browser picker and fail on upload.
- Receipt upload happens **before** the bill is saved: button `מעלה קבלה...`; path `bills/{bid}-{timestamp}.{ext}`. If upload fails, the bill is not saved and the error toast appears (`receiptErrorMessage`, 4850-4856): `אין חיבור לשרת. העלאה וצפייה בקבלות דורשות חיבור לאינטרנט`; `תיקיית הקבלות עוד לא הוגדרה בשרת. צריך להריץ פעם אחת את הקובץ supabase/security-update.sql ב-Supabase`; `הקובץ גדול מדי (עד 10MB)` (413); otherwise `פעולת הקבלה נכשלה: {message}`.
- Current receipt line: `לא צורפה קבלה`, or attach icon + file name + `צפייה` + `הסר`. `הסר` only marks it; the file is removed from storage after a successful save. Replacing a receipt also deletes the old file after save (4911).
- Save: unchecking `שולם` clears paid date and method. Stores `createdBy/At`, `updatedBy/At`. The view switches to the bill's half. Toasts `התשלום לחנות נשמר` / `התשלום עודכן`. Audit also logs a separate `paid` action when an existing bill becomes paid.
- View receipt (`viewStoreBillReceipt`, 4837-4848): opens an empty tab first (to avoid the popup blocker), then a signed URL valid 600 s; on error the tab closes and the error toast shows.
- Delete (`מחק`, existing only): **any editor** (not admin-only); no confirm; undo toast `התשלום ל{store} על סך ₪X נמחק`; the receipt file is deleted only after the delete is saved.
- Closes on X, `ביטול`, backdrop (1123-1124). No Esc.

### 9.5 Legacy payments assignment
See 01 §15.5. Assign buttons (`שייך למחצית` in the legacy panel, `שיוך` on legacy rows inside a half) need edit permission (`אין לך הרשאת עריכה`). The choice is stored in `years[year].legacyHalves` keyed by `"store|date|amount|description"`; picking a half switches the view to it. Toasts `התשלום שויך למחצית {א/ב}'` / `הרשומה חזרה לרשימת התשלומים הישנים`. Legacy payments themselves cannot be added, edited or deleted (not found).

---

## 10. Print layouts

Mechanics (see 01 §1.8): `printPage()` = `window.print()`; `buildPrintHeader()` on `beforeprint` fills the print-only header with `צדקת רבי שמעון · {title}` and the filter line ending with `הודפס DD/MM/YYYY HH:MM ע"י {user}`. Because it runs on `beforeprint`, the header also appears when printing with Ctrl+P from any screen.

### 10.1 Global print rules (style.css:2915-2988)
A4, margins 12 mm × 10 mm, colours forced (`print-color-adjust: exact`). Hidden: sidebar, phone bars, login, **all modals and dialogs**, toasts, saving indicator, pending banner, every `.btn` and toolbar, `.no-export` columns, sort arrows, the missing-info `*`, row menu. Scroll boxes are unclipped so long tables print fully; table headers repeat on each page (`thead` as header group, `tfoot` as footer group); rows do not split across pages; even rows shaded; cells at `fs-xs`; canvases shrink to page width; headings avoid being left at the bottom of a page.

### 10.2 What each printed page contains
| Screen | Printed content |
|---|---|
| Dashboard (no button; Ctrl+P) | header `לוח בקרה`, meta `שנת {selected year}`; hero as a plain bordered box with the title only (year select and refresh/logout hidden); 6 KPI cards in 3 columns; panels one under the other: `דורש טיפול`, `הכנסות לפי שנה` (SVG chart + table), `פעילות אחרונה`, `מסגרות`. `פעולות מהירות` is not printed. |
| Members list | header `בחורים`, meta: search, yeshiva, city, `ישי"ק + ישי"ג`, `כולל נשואים`, `{N} בחורים`; the table as currently filtered and sorted: `שם פרטי`…`פער`, `סטטוס` (no progress bar, no menu column, no `*`). Toolbar hidden. Desktop only: the print button is hidden on phones. |
| Member card | header `כרטיס בחור: {name}`, meta `שנת {campaign year}`; name, details, badges, big total, the 4 stats, progress, the deposits table. Action buttons and `חזרה לרשימה` hidden. |
| Transactions report | header `דו"ח תנועות`, meta `תקופה: {option text or date}` (+ `שנת {campaign}` unless "all"); the monthly income chart, the finance chart and its table, the two tables `הכנסות (איסוף)` and `הוצאות קמפיין` with their totals. The period select is hidden (it lives in the toolbar). |
| Expenses summary (Ctrl+P) | meta `שנת ניתוח: {year}`; 4 KPI cards, both charts, the category cards (the 5-year or all-years view currently on screen). The year bar and toggle button are hidden. |
| Purim (Ctrl+P) | meta `{city} / {group}`; city/group tab bars and the group action buttons hidden; **all groups of the active city are in the DOM but only the active pane is displayed**, so only that group prints. The dedicated print button is better (10.3). |
| Grants | header `מענקים`, meta `שנת {year}` + `נתינת המענק` or `תשלומים לחנויות · מחצית {א/ב}'`. Stats in 3 columns, then the active view only: recipients table (without edit/remove columns) and package (2 text columns, `column-count: 2`); or the store-bills table without the receipt and action columns, its total row, the footnote, and the legacy panel when visible. Add form, year `+`, view toggle and all buttons hidden. |
| Rules (Ctrl+P) | hero (light), target cards, gift cards, `כללים נוספים`; the personal lookup box and member mini-card are hidden. |
| Settings (Ctrl+P) | the active tab's panel without the tab bar; buttons hidden (inputs still print as fields). |

If a dialog is open when printing, it is hidden and the screen behind it prints.

### 10.3 Purim group print (`printPurimGroup`, 5251-5292)
Opens a new window (blocked → toast `הדפדפן חסם את חלון ההדפסה. יש לאפשר חלונות קופצים לאתר`) with its own minimal Arial RTL stylesheet: title `תרומות פורים — {city} / {group}`, line `צדקת רבי שמעון · {N} כתובות · הודפס {DD/MM/YYYY}`, line `סכומים סופיים:` with `{year}: ₪X` per shown year (`---` when empty), then a copy of the group table with the year columns currently shown. Prints after 250 ms and closes the window.

---

## 11. Export

### 11.1 CSV (`exportToCSV(tbodyId, filename)`, 5384-5388)
- Takes **every `<tr>` of the table** (header, body and footer rows) as currently rendered: filtered, sorted, current half / year. Cells with class `no-export` are skipped; text is `innerText`, `"` doubled, `₪` removed, trimmed, every value quoted; rows containing an empty-state are skipped.
- Separator `,`; line break `\n` (LF); UTF-8 with BOM (`﻿`) so Excel shows Hebrew; MIME `text/csv;charset=utf-8;`; file name `{name}_{YYYY-MM-DD}.csv`.
- Numbers keep their display format: thousands separators (`1,100`, inside quotes), whole shekels only, `—` for empty values. Dates as `DD/MM/YYYY`.
- Tables exported:

| Button | File | Columns |
|---|---|---|
| Members toolbar download (`הורדה לאקסל`) | `רשימת_בחורים_{date}.csv` | `שם פרטי`, `שם משפחה`, `שם האב`, `ישיבה`, `שיעור`, `עיר`, `נאסף השנה`, `יעד`, `פער`, `סטטוס` (progress and menu excluded). The first-name cell **includes the red `*`** for members with missing details (the star is a visible span inside the cell). |
| Grants panel `אקסל`, or toolbar `ייצוא` in view 1 | `מקבלי_מענק_{year without quotes}_{date}.csv` | `#`, `שם ומשפחה`, `תעודת זהות`, `טלפון`, `תאריך` |
| Grants toolbar `ייצוא` in view 2 | `תשלומים_חנויות_{year}_מחצית_{half}_{date}.csv` | `חנות`, `צפי לפי חתנים`, `לתשלום לפי קבלות`, `מס' קבלה / חשבונית`, `סטטוס` (status text + notes in one cell), plus the `סה"כ מחצית` total row. The legacy-payments table is not exported. |

### 11.2 Full backup JSON (Settings → `גיבוי וסנכרון`)
`exportFullBackup` (2322-2336): pretty-printed JSON `{ _app: "צדקת רבי שמעון", _version: 1, _exportedAt, members, donations, expenses, purimAddresses, settings, grantsArchive, users }`, file `גיבוי_צדקת_רבי_שמעון_{YYYY-MM-DD}.json`, toast `קובץ הגיבוי ירד`. It contains only what this user could load (server filters by permission) and includes the users' permission flags. Import: section 13.4.

### 11.3 Purim group "Excel" (`exportPurimGroupToExcel`, 5294-5340)
Not a real spreadsheet: an HTML document containing a styled copy of the group table (borders, grey bold headers, RTL, Arial 13 px), saved as `.xls` with MIME `application/vnd.ms-excel`, `<meta charset="UTF-8">`, file `תרומות_פורים_{city}_{group}.xls` (quotes, slashes and `:*?<>|` removed, spaces → `_`; no date). Columns as on screen, including only the year columns currently shown. Excel opens it with a format warning (standard behaviour for HTML-as-xls, not run here).

### 11.4 Not exportable (not found)
Transactions report, expenses summary, dashboard drill-downs, member card, eligibility history, audit log, legacy payments, data-health lists. No PDF generation, no real `.xlsx`.

---

## 12. Feedback: toasts, undo, banner, dialogs, loading and error states

### 12.1 Toast (`showToast(msg, type)`, 5495-5521)
- Types `success` (default; icon `check_circle`), `danger` (`error`), `warning` (`warning`). `role="alert"` for danger, `role="status"` otherwise.
- Leading non-letter/non-digit characters are stripped from the message (5510), a leftover from callers that used to prefix emoji.
- Fixed at the bottom centre (above the bottom nav on phones), fades in, stays **3 s**, fades out over 0.4 s. Several toasts are appended independently at the same position and overlap; there is no stack or queue (not found).

### 12.2 Undo toast (`scheduleUndoableDelete`, 332-354)
- Used for: member, deposit, expense, expense category, grant recipient, store bill. Message with icon `delete_outline` and button `בטל פעולה`; stays on screen (no fade) for 6 s (`UNDO_DELAY_MS`).
- Starting a new delete immediately commits the previous pending one (only one undo at a time). Undo → toast `הפעולה בוטלה, הרשומה הוחזרה`.
- If the record reappears meanwhile (e.g. a data refresh), it is removed again before the delete is sent (`exists`). Closing the tab during the 6 s puts the delete into the write queue (`pagehide`, 362-368). Logout commits pending deletes first (`flushPendingDeletes`, 5804).

### 12.3 Pending-writes banner (`updatePendingBanner`, 487-503; style.css:1725-1733, 2503, 2793)
- Appears whenever the write queue is not empty; removed when it empties. Fixed at the top centre (z-index 10002); on phones just below the top bar, wrapping.
- Text: `{N} שינוי עדיין לא נשמר בשרת. הם שמורים במחשב הזה ויישלחו אוטומטית.` (N = 1) or `{N} שינויים עדיין לא נשמרו בשרת. הם שמורים במחשב הזה ויישלחו אוטומטית.`; icon `cloud_off`; button `נסה עכשיו` → toast `כל השינויים נשמרו בשרת` or `עדיין אין חיבור לשרת. ננסה שוב אוטומטית`.
- Also shown on the next visit (the queue is in `localStorage`) as soon as a screen calls it (after data load, 821).

### 12.4 Confirm / prompt dialog (`uiDialog`, 263-317)
- Built on demand; title + message (`white-space: pre-line`, so `\n` breaks lines), optional text input, OK and `ביטול`. `role="alertdialog"` (or `dialog` with input), `aria-modal`, labelled/described.
- Keyboard: Esc cancels; Enter confirms only when the input has focus; Tab / Shift+Tab cycle between input, OK and cancel (focus trap); focus starts on the input, or on **cancel for danger dialogs**, else on OK; focus returns to the previously focused element. Backdrop click cancels.
- All call sites:

| # | Where | Title | Message | OK / Cancel |
|---|---|---|---|---|
| 1 | Nedarim save without confirmation number (1020) | `לא הוזן מספר אישור עסקה` | `מספר האישור מנדרים פלוס עוזר לאתר את התשלום אחר כך. לשמור בלי מספר אישור?` | `שמור בלי מספר אישור` / `ביטול` |
| 2 | Backup import (2349-2353), danger | `ייבוא גיבוי לשרת` | `יועלו לשרת: {N} בחורים, {N} הפקדות, {N} הוצאות, {N} כתובות פורים, והגדרות[ ומענקים].` + newline + `רשומות קיימות עם אותו מזהה יוחלפו בגרסה שבגיבוי. רשומות שלא נמצאות בגיבוי יישארו.` | `ייבא את הגיבוי` / `ביטול` |
| 3 | Remove store from package (4421), danger | `הסרת חנות מהתכולה` | `להסיר את "{store}" ואת כל המוצרים שבה? השינוי יישמר רק כשתלחצו "שמור תכולה".` (`החנות` when unnamed) | `הסר חנות` / `ביטול` |
| 4 | Add grants year (4569-4573), prompt | `הוספת שנת מענקים` | `הקלידו את שם השנה החדשה (לדוגמה: {suggestion or תשפ"ז}).` + newline + `השנים הבאות: {y1}, {y2}, {y3}` | `הוסף שנה` / `ביטול` |
| 5 | Manual logout with queued writes (5806-5811) | `יש שינויים שעוד לא נשמרו בשרת` | `{N} שינויים ממתינים לשליחה (אין חיבור כרגע). הם יישארו שמורים במחשב הזה ויישלחו בכניסה הבאה.` | `צא בכל זאת` / `הישאר` |

- No confirm exists for: deleting a member, deposit, expense, category, recipient, store bill (undo toast instead); removing a package item; Purim cancel; discarding package edits; leaving inline edit modes (not found).

### 12.5 Static modals: how each closes
| Modal | X | Cancel button | Backdrop | Esc |
|---|---|---|---|---|
| Member | auto-save | discard | auto-save | no |
| Deposit | discard | discard | discard | no |
| Expense | discard | discard | **no** | no |
| Eligibility history | yes | `סגור` | yes | no |
| Nedarim | step 1: go to question; later: close | `לא / ביטלתי`, `ביטול רישום` | no | no |
| Data-health fix | yes | — | no | no |
| Legacy assign | yes | — | no | no |
| Store bill | yes | `ביטול` | yes | no |
| Dashboard drill-down | yes | — | yes | no |
| Phone "עוד" sheet | yes | — | yes | no |
| Idle warning | — | `השאר אותי מחובר` | — | any key resets it |
Static modals do not move focus into themselves on open, do not trap focus and do not restore focus on close (not found). Only the generic dialog (12.4) and the row menu manage focus.

### 12.6 Loading states
- First load without a session: login card shows `מסנכרן נתונים מאובטחים...` with a spinner until the page script runs, then the form fades in and the username gets focus (613-625, 638).
- Page refresh with a session: `boot.js` hides the login overlay before paint (CSS variable `--login-init-display`), the app shell is shown immediately with static placeholders (`₪0`, `אין נתונים להצגה`, `טוען נתונים...`) while all tables load; screens are rendered only after `loadAll` returns (594-607). There is no spinner during that wait (not found). If loading fails, the cached session copy is shown, silently.
- Login: the button shows `מתחבר...` (disabled) for the whole sign-in **and** data load (653-660).
- Buttons with busy text: `שומר...` (member, deposit, expense, Nedarim, store bill, user permissions), `מעלה קבלה...`, `מסנכרן...`, `מעלה לשרת...` (backup import); refresh icons spin (`spin-linear`) and the button is disabled; audit log `טוען...`.
- Settings save button is just disabled until the save ends (no text change).

### 12.7 Error states and messages
- Data load failure (manual refresh, not silent): `לא ניתן לטעון נתונים מהשרת כרגע. מוצגים הנתונים האחרונים שנטענו`; phone refresh: `לא ניתן לטעון נתונים מהשרת כרגע`. Successful refresh shows no toast (except Settings sync).
- Settings sync: `הנתונים סונכרנו`; `הנתונים נטענו, אבל {N} שינויים עדיין ממתינים לשליחה`; `הסנכרון נכשל: אין חיבור לשרת. מוצגים הנתונים האחרונים שנטענו`.
- Login errors (`login-error`, `role="alert"`): `יש להזין שם משתמש וסיסמה`; `שם משתמש או סיסמה שגויים` (any credential rejection); `לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט, או שהשרת אינו זמין כרגע.`; `יותר מדי ניסיונות כניסה. נסה שוב בעוד כמה דקות.` (429); `השרת אינו זמין כרגע. נסה שוב בעוד כמה דקות.` (5xx). Success toast `ברוך הבא למערכת, {name}!`.
- Audit log tab: `יומן הפעולות יתחיל לעבוד אחרי הרצת קובץ העדכון supabase/security-update.sql ב-Supabase.` (table missing) or `לא ניתן לטעון את היומן כרגע: {message}`.
- User permissions save: `השרת לא אישר את השינוי. צריך להריץ פעם אחת את קובץ העדכון supabase/security-update.sql ב-Supabase` (403) or `השמירה נכשלה: {message}`.
- Server errors are shown in raw form inside messages: `שגיאת שרת ({status}): {first 160 chars}` / `שגיאת אחסון (...)` (`supabase-integration.js`).
- After an idle lock, on the next page load: toast `המערכת ננעלה אוטומטית עקב חוסר פעילות` (warning, 578).

---

## 13. Settings forms (script.js:1727-2424)

### 13.1 `יעדים ושנה`
- Inputs are filled from settings each time the Settings screen is entered (`renderSettings` → `cacheSettingsInputs`, 831-848), so **unsaved typing is lost when leaving and coming back**; switching tabs inside Settings keeps it.
- Gift on/off switches dim their card immediately (`is-off`, opacity 0.5) but are saved only with the button.
- `שמור יעדים` (`saveSettings`, 1760-1786): campaign year = trimmed text or `תשפ"ו` if empty (no validation, see 02 Q5); each target `Number(x) || 0` (negative numbers pass; `type="number"` without `min`); gift names default `טיול` / `מתנה`; image URLs and extra rules trimmed. Toast `הגדרות המערכת נשמרו בהצלחה`. The button is hidden for non-editors and the server accepts settings only from admins.
- The image URL is not checked; a broken image falls back to the icon on the rules screen (`error` listener, 191-198).

### 13.2 `קטגוריות הוצאות`
Add by button or **Enter** in the input; trimmed; empty ignored silently; exact duplicate `הקטגוריה כבר קיימת`; toast `הקטגוריה נוספה`. Remove by chip X (title `מחק קטגוריה`): `חייבת להישאר לפחות קטגוריה אחת`, else undo toast `הקטגוריה "{name}" הוסרה`. Existing expenses keep the removed category name. No rename or reorder (not found).

### 13.3 `תקינות נתונים`
Fix dialog (01 §17.3): framework select saves **on change**; yeshiva / phone text + `שמור`; empty → `יש להזין ערך`; success toast `תוקן ונשמר` and the row disappears; when no rows remain `הכל תוקן!`. The phone is not formatted here. `פתח פרופיל` closes the dialog, switches to members and opens the card after 60 ms.

### 13.4 `גיבוי וסנכרון`
- Counts are `toLocaleString("he-IL")`. `סנכרון אחרון` = last successful load in this tab (`sessionStorage`), `DD/MM/YYYY HH:MM`, or `טרם סונכרן`.
- Import (`importFullBackup`, 2338-2375): file picker `accept="application/json"`; admin only (`רק מנהל יכול לייבא גיבוי`); must parse and contain a `members` array (`הקובץ אינו קובץ גיבוי תקין`); confirm (12.4 #2); upload in chunks of 500 with upsert (no deletes); button `מעלה לשרת...`; success `הגיבוי יובא ונשמר בשרת` and a full reload; failure `הייבוא נעצר באמצע: {message or "תקלת תקשורת"}. אפשר להריץ שוב את אותו קובץ`. Users/permissions in the file are not imported.

### 13.5 `משתמשים`
Per row checkboxes (`aria-label` = column name) and a `שמור` button per row (`saveUserPermissions`, 2406-2424): non-admin `רק מנהל יכול לשנות הרשאות`; busy `שומר...`; toast `ההרשאות של {username} נשמרו. הן ייכנסו לתוקף בכניסה הבאה שלו`. Admin rows are checked and disabled, no button; rows without an id have no button. Unsaved checkbox changes are lost on re-render without warning.

### 13.6 `סכומי פורים`
Number inputs per group × 4 years; `שמור סכומים` saves only cells that changed compared with the loaded value (values stored as **strings**, empty string clears); `לא בוצעו שינויים` when nothing changed; `הסכומים נשמרו בהצלחה!`. Dashboard and Purim screens re-render.

### 13.7 `יומן פעולות`
Loaded only when the tab is clicked, every time (no cache, no refresh button).

---

## 14. Keyboard behaviour

Complete list found in the code:
- Login: Enter submits (real `<form>`, 642).
- Expense category input: Enter adds (1739).
- Generic dialog: Esc, Enter (in prompt input), Tab trap (296-306).
- Row menu: Esc closes (3574); focus goes to the first item.
- Finance chart bars: Tab reaches each bar; focus shows the tooltip.
- Any keydown resets the idle timer (5761).

Not found: global shortcuts (new deposit, search focus, save with Ctrl+S, navigation keys), Enter-to-save in the member/deposit/expense/store-bill dialogs, Esc for static modals, arrow keys in menus or tabs, keyboard sort, keyboard activation of the rules-lookup results (they are `role="button" tabindex="0"` but only react to click, 1893), keyboard opening of a member from the table (rows are not focusable).

---

## 15. Responsive and phone behaviour (≤767 px; style.css:2728-2910)

Breakpoints and the members card layout: see 01 §1.4, §5.6, §19. Additional behaviour:
- **Bottom navigation**, fixed, 60 px + safe-area: `לוח בקרה`, `בחורים`, `תנועות`, `מענקים`, `עוד` (icons `space_dashboard`, `groups`, `insert_chart_outlined`, `redeem`, `menu`). Each item copies the visibility of the matching sidebar item (771). `עוד` opens a bottom sheet with `סיכום הוצאות`, `כתובות פורים`, `תקנון`, `הגדרות` (admin only), divider, `התנתקות` (red); `עוד` is highlighted when the active screen is in the sheet (2510-2511).
- **Top bar** 56 px, sticky: logo, current screen title, refresh button (spins, disabled while loading).
- Logout and refresh in the dashboard hero are hidden on phones; logout is only in the `עוד` sheet.
- Switching screens scrolls to the top on phones (2515).
- **Tables → cards**: the members table becomes cards by CSS; every other table with more than 3 header cells becomes stacked "label: value" rows (`labelTablesForMobile`, 230-256), re-applied by a `MutationObserver` 30 ms after any DOM change and when the viewport crosses 767 px. Cells spanning columns get no label; empty cells are hidden. Tables of 3 columns or fewer (the two transactions-report tables) stay tables; the member-card deposits table (4 columns) is stacked.
- **Bottom sheets**: every modal, the drill-down and the generic dialog slide up from the bottom (0.28 s), full width, max 92 vh, rounded top corners, padding includes the safe area; close buttons 44×44; form grids become one column; action buttons wrap and stretch.
- Touch sizes: inputs and selects 44 px high and 16 px font (avoids iOS zoom); checkbox labels 44 px; icon buttons 44×44; row-menu items 44 px.
- Toasts and the saving indicator sit above the bottom nav and may wrap.
- Hidden on phones: members edit mode, density, print buttons; dashboard hero text. The members CSV download stays available.
- Inline edit modes (members, Purim) are not blocked on phones, but the members one has no button; Purim `עריכה` still works on the stacked cards.

---

## 16. Accessibility helpers

Present:
- `<html lang="he" dir="rtl">`; icon fonts marked `aria-hidden="true"`; icon-only buttons have `aria-label` and `title`.
- Landmarks: `nav` with `aria-label="תפריט ראשי"` (sidebar), `"ניווט ראשי"` (bottom nav), `"לשוניות הגדרות"` (settings).
- Static modals: `role="dialog" aria-modal="true" aria-labelledby`; idle warning `role="alertdialog"`.
- Toasts: `role="status"` / `role="alert"`; login error `role="alert"`.
- Payment method radios in `role="radiogroup"` with `aria-labelledby`.
- Row menu `role="menu"` / `menuitem`; kebab `aria-haspopup="menu"` and `aria-label="פעולות על {name}"`; `עוד` button `aria-haspopup="dialog"`.
- Users table checkboxes have `aria-label`.
- Finance chart: SVG `role="group"` with `aria-label` (`גרף הכנסות מול הוצאות לפי שנה` / `גרף הכנסות לפי שנה`), focusable bars with labels, a data table under every chart.
- Focus ring: `:focus-visible { outline: 2px solid gold; offset 2px }`, no ring for mouse focus on buttons (style.css:1862-1864).
- `prefers-reduced-motion: reduce` disables animations and transitions (style.css:1866-1873).
- Login fields have `autocomplete="username"` / `"current-password"`, username `autocapitalize="none"`, `spellcheck="false"`.

Missing (not found): skip link; `aria-sort`; `aria-live` region for result counts; tab roles for settings / Purim / grants view toggles; focus management for static modals; keyboard access to sortable headers, member rows and rules-lookup results; dark mode (`prefers-color-scheme`); text-size controls.

---

## 17. Session, idle lock, drafts (behaviour details)

Covered in 01 §18; extra details:
- Idle detection uses `window.onmousemove/onmousedown/ontouchstart/onclick/onkeydown/onload` (5755-5765). **Scrolling with the wheel or touch-scroll without a tap does not count** as activity (no `scroll`/`wheel` handler). The countdown modal closes on any mouse move.
- The counter runs only while the main screen is visible (5776-5777).
- On auto-lock an open member / deposit / expense dialog is saved as a draft in `sessionStorage["ezer_form_draft"]` (5832-5847). It is restored after the next login **in the same tab**, by whoever logs in (no user check), with toast `שחזרנו טופס שהיה פתוח לפני שהמערכת ננעלה. אפשר להמשיך ולשמור`. The draft is cleared when the dialog is saved or closed. Store-bill, Nedarim, Purim and inline-table edits are not drafted.
- Logout clears the cached data in `sessionStorage` but not the write queue in `localStorage` and not the form draft (5824-5830).
- Data and session are per tab (`sessionStorage`): a second tab must log in again (SETUP.md).

---

## 18. Hidden, legacy and migration features

| What | Where | Behaviour |
|---|---|---|
| Former Google Sheets backend | `supabase-integration.js:3`, `supabase/SETUP.md` | Replaced by Supabase; the Apps Script still exists at Google but is unused. The 4 original users were migrated with the same passwords. |
| Old local cache purge | `purgeLegacyLocalCache` 2472-2478; `supabase-integration.js` removes `localStorage["ezer_sb_session"]` | One-time clean-up of data and session that older versions kept in `localStorage`. Runs on every load. |
| Campaign-year auto-migration | `loadState` 2450-2453 | A cached campaign year `תשפ"ה` is silently changed to `תשפ"ו` on page load (cache only; the server value then overrides after loading). |
| Framework name migration | `normalizeYeshivaType` 2426-2430 | `קטנה` → `ישיבה קטנה`, `גדולה` → `ישיבה גדולה` on load, import and health fix. |
| Legacy permission values | `isTrue` 627-632 | Accepts `TRUE`, `V`, `1`, `כן`, `Y`, `YES` (spreadsheet-era values). |
| Admin by name | `isAdminUser` 714-717 | Username exactly `מנהל` is admin even without `is_admin`. |
| Missing profile fallback | 662, `canEditUser` 709-712 | A user with no `profiles` row gets a full-permission object in the UI; `canEditUser()` is true when there is no user object. The server still enforces RLS. |
| Old grants view names | `switchGrantsView` 4140 | `archive` / `current` are accepted and mapped to `grant`. |
| Legacy store payments ("השיטה הקודמת") | `GRANTS_ARCHIVE.payments` 4004-4011; 4607-4680 | Six hard-coded payments (תשפ"ד / תשפ"ו) merged with saved ones, auto-assigned to a half by month (`אדר` → א', `אלול` → ב'), manually re-assignable, shown with `נרשם בשיטה הקודמת`. |
| Package schema migration | `mergeGrantsArchiveDefaults` 4101-4124 | A saved package without `storePrice`/`orgPrice` is replaced by the built-in package. Field `paymentProducts` is carried but unused. `perGroomValue: 8110.7` legacy constant, unused in display. |
| Old payment method for deposits | 1567, 1620 | "Credit" is a notes prefix `(אשראי) `, not a field; there is no payment-method column in the database (`schema.sql` donations table). |
| Dead code / stale ids | 127, 257, 736, 3060, 5815 | `sumNumbersFromString`, `openSettingsTab` (whitelisted, unused), `btn-inner-add-expense` (no such element), `dashboardJsString`, `sessionStorage["ezer_active_session"]` (removed, never set). |
| Feature flags | — | Not found. The only switches are the two gift on/off settings and view toggles (all expense years, all Purim years, density). |
| Deployment helpers | `_redirects`, `start-site.bat`, `tools/make-icons.ps1` | Netlify blocks `/migrations/*` (folder does not exist), `/supabase/*`, `/tools/*`, `/serve.json`, `/__demo.js` (does not exist), `/start-site.bat`, `/.gitattributes`. `start-site.bat` clones/updates the repo (default branch `claude/new-design`) and serves it on port 8080. `_headers` notes that inline `style=""` attributes are still allowed and "יוסרו בשלב 2". |
| Server-only rules worth knowing | `security-update.sql` | Settings writes: admin only. Member/deposit/expense deletes: admin. Expenses read: `הוצאות` flag; Purim read: `הכנסות ופורים`; grants archive and receipts: `מענקים` (+ edit for writes). Audit log readable only by admins; users can insert only rows in their own name. |

---

## 19. User-visible message inventory not listed above

Already quoted in the sections above: every validation, confirm and save toast. Remaining strings:
- Empty states (title / text / button): members `עדיין אין בחורים במערכת` / `הוסיפו את הבחור הראשון כדי להתחיל לרשום הפקדות ולעקוב אחרי היעד שלו.` / `הוספת בחור`; filtered `אין בחורים שמתאימים לסינון` / `נסו לשנות את החיפוש או לנקות את הסינונים.` / `נקה סינונים`; report `אין הכנסות בתקופה הזו` / `אפשר לבחור תקופה אחרת, או לרשום הפקדה חדשה.` / `רישום הפקדה` and `אין הוצאות בתקופה הזו` / `אפשר לבחור תקופה אחרת, או לרשום הוצאה חדשה.` / `רישום הוצאה`; expenses summary `עדיין לא נרשמו הוצאות` / `אחרי רישום ההוצאה הראשונה יופיע כאן פירוט לפי קטגוריה ושנה.`; dashboard attention `אין כרגע מה לטפל בו` / `כשיהיו בחורים קרובים ליעד, חובות פתוחים או פרטים חסרים, הם יופיעו כאן.`; activity `אין עדיין פעילות בשנה הזו` / `הפקדות והוצאות חדשות יופיעו כאן לפי סדר התאריכים.`; segments `אין עדיין בחורים עם יעד` / `ההתקדמות לפי מסגרת תוצג אחרי שיהיו בחורים עם יעד שנתי.` / `הוספת בחור`; drill-down `אין נתונים מתאימים לבחירה הזו` / `נסו לבחור שנת פעילות אחרת בלוח הבקרה.`; grants recipients `אין עדיין מקבלי מענק בשנה הזו` / `הוסיפו את החתן הראשון כדי לעקוב אחרי המענקים שניתנו השנה.` / `הוסף חתן`; Purim `אין עדיין כתובות פורים` / `הכתובות נטענות מהשרת לפי עיר וקבוצה. אם אמורות להיות כתובות, נסו לרענן את הנתונים.` / `רענן נתונים`; Purim sums `אין עדיין קבוצות פורים` / `הקבוצות נוצרות מתוך כתובות פורים. אחרי שיהיו כתובות, אפשר יהיה להזין כאן את הסכום הסופי של כל קבוצה.` / `למסך כתובות פורים`; users `אין משתמשים להצגה` / `משתמשים מוסיפים בלוח הבקרה של Supabase, והם מופיעים כאן אחרי רענון הנתונים.`; audit `עדיין אין פעולות ביומן` / `כל הוספה, עדכון או מחיקה יירשמו כאן עם שם המשתמש והשעה.`; history `אין נתונים זמינים להצגה.`; data health `הכל תקין! אין בחורים לתיקון כאן.`, `אין כפילויות.`, row fallbacks `ללא שם`, `ללא ישיבה`, `ללא טלפון`.
- Tooltips: `לחיצה לעריכה`, `חסר: {list}` (missing-info star), `פעולות`, `מחק קטגוריה`, `הסר חנות`, `הסר מוצר`, `עריכה`, `הסר`, `הוספת שנה`, `רענן נתונים מהשרת`, `התנתקות ונעילה`, `יציאה ונעילה`, `רענן נתונים`.
- Grants note: `בשנה זו נרשמו המקבלים לפי תעודת זהות ותאריך בלבד (ללא שם) בקובץ המקור.`
- Console only (not shown): `נתונים סונכרנו מ-Supabase בהצלחה.`, `שגיאה בטעינת נתונים מ-Supabase. מוצגים הנתונים האחרונים שנשמרו במחשב.`

---

## 20. Points a redesign could easily break (summary)

1. Every save is optimistic and queued; rejected writes are not rolled back; the queue is per computer, not per user (§0).
2. Member dialog X / backdrop auto-saves and can write default framework / shiur / status (§3.5).
3. Credit is a notes prefix; Nedarim deposits lack it (§6).
4. Inline edit modes (members, Purim) silently lose typing on any re-render or screen change (§4.1, §8.3).
5. Several edit controls are visible to non-editors and rely on the server to refuse (members edit mode, Nedarim, Purim edit, grants recipients and package) (§4.1, §6, §8.3, §9.2-9.3).
6. CSV exports take the rendered table, include the missing-info `*`, keep thousands separators and `—`, and use LF + BOM (§11.1).
7. Per-screen print header is built on `beforeprint`, so Ctrl+P on any screen must still produce it (§10).
8. Phone mode relies on a MutationObserver to label table cells and on CSS for member cards (§15).
