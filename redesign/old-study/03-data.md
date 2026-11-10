# 03 · Data layer, auth and configuration of the OLD system

Read-only study of `/home/user/tzedakat-rabbi-shimon` (branch `claude/new-design`; the app files at the repository root are the old system). Nothing outside `redesign/old-study/` was modified.

Sources read in full: `supabase-integration.js` (268 lines), `boot.js`, `supabase/schema.sql`, `supabase/security-update.sql`, `supabase/SETUP.md`, `_headers`, `_redirects`, `serve.json`, `manifest.json`, `404.html`, `.gitignore`, the data-, auth- and sync-related parts of `script.js` (lines 1–2520, 3335–3670, 4001–5864 read line by line; 2520–3335 and 3669–4000 scanned for every `state.`, `SB.`, `persist`, `logAudit`, storage and network call), the `<head>`, login, Nedarim, settings, store-bill and timeout markup of `index.html`, the `@font-face` block of `style.css`, the static server part of `start-site.bat`. `redesign/prototype.html` was grepped only for constructs the CSP blocks (section 13.4).

Conventions (same as 01 and 02):
- `script.js:NNN` / `sbi:NNN` (= `supabase-integration.js`) / `index.html:NNN` are line numbers.
- Hebrew strings are quoted exactly as in the source.
- "not found" = I looked and the old code has no such thing.
- Supabase URL and key values are deliberately not reproduced here; only the file and variable names.
- Cross-references: **01 §n** = `01-screens.md`, **02 §n** = `02-rules.md`. Where those files already cover a topic it is only referenced.
- Data-layer quirks are numbered **D1…** and collected in section 15.

Contents

1. Where things are configured
2. The Supabase tables, column by column, and who reads / writes them
3. Server-side permissions (RLS) versus client-side gating
4. Client data model and field mapping
5. JSON shapes: `settings`, `grants_archive`, `purim_addresses`
6. Identifier generation
7. Login, session, profile lookup, permission flags
8. Browser storage inventory, auto-lock, logout
9. Sync model: load, cache, optimistic writes, offline queue, retry, undo, merge, drafts
10. Audit log
11. Receipts in Supabase Storage
12. Full backup: export and import
13. Security headers, CSP, redirects — and what the new design must obey
14. PWA
15. Data-layer quirks and risks (D1…)
16. Not found
17. Checklist for applying the new design

---

## 1. Where things are configured

| What | File | Name |
|---|---|---|
| Supabase project URL | `supabase-integration.js` | `const SUPABASE_URL` (sbi:9); re-exported as `window.SB.URL` (sbi:257) |
| Public (publishable / "anon") key | `supabase-integration.js` | `const SUPABASE_KEY` (sbi:10). `SETUP.md` calls it "anon key (הציבורי, מוטמע בקוד) — בטוח, מוגן ע"י RLS" |
| Same project host, again | `_headers` and `serve.json` | inside the `Content-Security-Policy` value (`img-src`, `connect-src`). Changing project means editing three files |
| Derived endpoints | `supabase-integration.js` | `REST = URL + "/rest/v1/"`, `AUTH = URL + "/auth/v1/"`, `STORAGE = URL + "/storage/v1/"` (sbi:12–14) |
| Receipts bucket name | `supabase-integration.js` | `RECEIPTS_BUCKET = "receipts"` (sbi:15); created in `security-update.sql:139–144` |
| Session storage key | `supabase-integration.js`, `boot.js` | `SESSION_KEY = "ezer_sb_session"` (sbi:11; literal in boot.js:5) |
| Login e-mail domain | `script.js` | `LOGIN_EMAIL_DOMAIN = "tzedaka.local"` (script.js:36) |
| Generic login error | `script.js` | `LOGIN_ERROR_GENERIC = "שם משתמש או סיסמה שגויים"` (script.js:37; also the static text of `#login-error`, index.html:45) |
| Nedarim Plus page | `script.js` | literal URL with query `mosad=7011408`, script.js:1064 (not a secret; it is the charity's institution number in the public donation page URL) |
| Local cache keys | `script.js` | `STORAGE_KEYS` (script.js:1–9), `PENDING_WRITES_KEY` (375), `FORM_DRAFT_KEY` (5833), literals `ezer_last_sync`, `ezer_logout_reason`, `ezer_active_session` |
| Defaults | `script.js` | `DEFAULT_SETTINGS` (13–30), `DEFAULT_EXPENSE_CATEGORIES` (11), `GRANTS_ARCHIVE` skeleton (4001–4044), `DEFAULT_USERS = []` (32) |
| Timers / limits | `script.js`, `supabase-integration.js` | `UNDO_DELAY_MS = 6000` (329); queue retry `30000` ms (506); idle 580 s warning / 600 s logout (5779–5782); page size `PAGE = 1000` (sbi:111); import chunk `size = 500` (sbi:135); signed URL `expiresIn: 600` (sbi:249); receipt max `10 * 1024 * 1024` (script.js:4869) and bucket `10485760` (security-update.sql:140); audit view `limit = 300` (sbi:229, script.js:1987) |

There is no build step, no environment file and no runtime configuration: everything above is a literal in the shipped files. No `.env` (not found).

Load order (index.html:16–18, 1037–1038): `style.css` → `assets/vendor/chart.umd.min.js` → `boot.js` (all in `<head>`) → body → `supabase-integration.js` → `script.js`. `supabase-integration.js` must run before `script.js` because `script.js` uses `window.SB` at top level (`WRITE_OPS`, `purgeLegacyLocalCache()` at 2478) and on `DOMContentLoaded`.

`supabase-integration.js` talks to PostgREST, GoTrue and Storage with plain `fetch` — there is no supabase-js library (sbi:3 "גישה ישירה ל-REST + Auth (ללא תלויות)"). Consequence: no realtime channel, no automatic token refresh timer.

---

## 2. The Supabase tables, column by column

Schema: `supabase/schema.sql` (tables, trigger, first RLS) + `supabase/security-update.sql` (per-permission RLS, `audit_log`, bucket). `SETUP.md` says the data was migrated from Google Sheets (442 members, 1,260 donations, 348 expenses, 566 Purim addresses, grants history תשפ"ד–תשפ"ו, settings) and that 4 users exist.

All REST calls go through `request()` (sbi:90–107) with headers `apikey`, `Authorization: Bearer <user access token>` and `Content-Type: application/json`.

| Operation | Function | HTTP |
|---|---|---|
| read all rows | `selectAll(table)` sbi:110–126 | `GET table?select=*` with `Range: 0-999`, `1000-1999`, … until a short page |
| upsert one / many | `upsert(table, rows)` sbi:127–130 | `POST table`, body = array, `Prefer: resolution=merge-duplicates,return=minimal` (INSERT … ON CONFLICT (pk) DO UPDATE) |
| delete | `remove(table, filter)` sbi:131–133 | `DELETE table?id=eq.<id>`, `Prefer: return=minimal` |
| bulk upsert | `upsertChunked(table, rows, 500)` sbi:135–137 | sequential `upsert` per 500 rows (backup import only) |
| singleton re-read | `fetchSingleton(table)` sbi:139–142 | `GET table?select=data&id=eq.true` |
| profile permissions | `updateProfile(id, patch)` sbi:216–225 | `PATCH profiles?id=eq.<uuid>`, `Prefer: return=representation` |
| audit | `insertAudit` / `selectAudit` sbi:228–229 | `POST audit_log` / `GET audit_log?select=*&order=created_at.desc&limit=300` |

### 2.1 `members`

| Column | Type | Client field | Written by | Read by |
|---|---|---|---|---|
| `id` | text PK | `id` (`M-…`, section 6) | `handleSaveMember` 1449–1494; `saveMembersEdit` 3635–3667; `applyHealthFix` 2265–2288; import 2358 | everywhere members are listed / joined to donations |
| `first_name`, `last_name` | text | `firstName`, `lastName` | modal; inline table edit; import | everything (names, search, `fullName`) |
| `father_name` | text | `fatherName` | modal; inline edit | list, search |
| `phone` | text | `phone` | modal (auto-dash after 3 digits, 1149–1158); `applyHealthFix`; import | list, search, data health, grants "הוסף חתן" copies it (1126–1136) |
| `yeshiva` | text | `yeshiva` | modal; inline edit; `applyHealthFix` | filters, list, data health |
| `shiur` | text | `shiur` | modal (`א`…`ט`); inline edit (free text) | targets (02 §3) |
| `yeshiva_type` | text | `yeshivaType` | modal; `applyHealthFix` (normalised by `normalizeYeshivaType` 2426–2430: `קטנה`→`ישיבה קטנה`, `גדולה`→`ישיבה גדולה`); import (normalised) | targets, eligibility; also normalised on every load (795, 2433) |
| `marital_status` | text | `maritalStatus` | modal (`רווק` / `נשוי`) | married filter (02 §9) |
| `address` | text | `address` | modal; import | city = text after the last comma (3418) |
| `notes` | text | `notes` | modal; import | search; `התחתן` substring = married |
| `created_at` | timestamptz default now() | `createdAt` | client sends its own ISO string on create and keeps it on edit (1463); `memberToDb` sends `null` when missing (sbi:150) | never used in a calculation |

Inline table editing (`saveMembersEdit`) only touches the cells marked `data-field` at 3520: `firstName`, `lastName`, `fatherName`, `yeshiva`, `shiur`.
Deleting a member (`deleteMemberRow` 3579–3601, admin only) deletes only the `members` row; the donations stay, with their `member_id` and `member_name_snapshot` (comment at 3577).

### 2.2 `donations`

| Column | Type | Client field | Notes |
|---|---|---|---|
| `id` | text PK | `id` (`D-…`) | |
| `member_id` | text, indexed, no FK | `memberId` | `null` allowed by the mapper (sbi:159); the UI always requires a member (1552, 1010) |
| `member_name_snapshot` | text | `memberNameSnapshot` | written as `member.fullName` ("first last") at every save (1565, 1027); read by the dashboard drill-down fallback (02 §12.6) and the delete audit detail (1606) |
| `year` | text, indexed | `year` | Hebrew label from the year select (1519–1529); Nedarim uses `member.currentYear` (= campaign year) |
| `amount` | numeric | `amount` | `parseAmount` (5422–5425): >0, rounded to agorot |
| `date` | text | `date` | `YYYY-MM-DD` from `<input type=date>` or today; legacy rows hold other formats (schema comment: "נשמר כטקסט: המקור מכיל תאריכים לא-אחידים") |
| `notes` | text | `notes` | credit marker: prefix `(אשראי) ` when the radio `אשראי` is chosen (1567) and stripped back into the radio on edit (1619–1624). Nedarim rows instead get the default text `אשראי - נדרים פלוס` and optionally ` | אישור עסקה: {n}` (988, 1021) — see D16 |
| `created_at` | timestamptz | `createdAt` | client ISO; shown as `נרשם ב-…` in the modal (1641) |

Writers: `handleSaveDonation` 1541–1584, Nedarim save 1003–1052, import 2359. Delete: `handleDeleteDonation` 1586–1610 (admin, undo window).

### 2.3 `expenses`

| Column | Client field | Notes |
|---|---|---|
| `id` text PK | `id` (`E-…`) | |
| `year` text, indexed | `year` | year select, default campaign year |
| `category` text | `category` | from `settings.expenseCategories` (section 5.1) |
| `description` text | `description` | |
| `amount` numeric | `amount` | `parseAmount` |
| `date` text | `date` | as donations |
| `approved_by` text | `approvedBy` | display name of the user who created it (`state.currentUser`), kept on edit (1688); shown `נרשם ע"י …` (1670) |
| `created_at` | `createdAt` | client ISO |

Writers: `handleSaveExpense` 1676–1703, import 2360. Delete: `handleDeleteExpense` 1705–1725 (admin, undo window).

### 2.4 `purim_addresses`

| Column | Notes |
|---|---|
| `id` uuid PK default `gen_random_uuid()` | kept on the client as `__sbId` (sbi:176–178); never shown |
| `data` jsonb | the whole address row with Hebrew keys (section 5.3) |
| `created_at` | server default; never read |

Writer: `togglePurimGroupEdit` 5169–5215 (edit existing cells only), import 2361. **No UI creates or deletes a Purim address** (not found); rows came from the migration. Read by `renderPurimGroups` 4967–5163, `getPurimGroupNames` 2012–2019 (settings sums table), counts in the backup panel.

### 2.5 `settings` and `grants_archive` (singletons)

Both: `id boolean PK default true` with `check (id = true)`, `data jsonb`, `updated_at timestamptz default now()`.
Written as `{ id: true, data: <whole object> }` (sbi:209–210). `updated_at` is never set by the client and the upsert does not touch it, so it keeps the first-insert time (D18).
Read in `loadAll` (`settingsRows[0].data`, `grantsRows[0].data`, sbi:199–200) and re-read before every save (`fetchSingleton`, section 9.6).

### 2.6 `profiles`

| Column | Default | Client | Read | Written |
|---|---|---|---|---|
| `id` uuid PK → `auth.users(id)` on delete cascade | | `id` | yes | never |
| `username` text unique | | `username` | yes (login fallback match, users table, admin test `=== "מנהל"`) | never (trigger) |
| `display_name` text | | `displayName` | yes (`profileDisplayName` 46–53) | never (Supabase dashboard) |
| `is_admin` | false | `isAdmin` | yes | never from the app |
| `can_edit` | **true** | `canEdit` | yes | `updateProfile` (admin) |
| `can_view_income` | **true** | `canViewIncome` | yes | `updateProfile` |
| `can_view_expenses` | **true** | `canViewExpenses` | yes | `updateProfile` |
| `can_view_grants` | **true** | `canViewGrants` | yes | `updateProfile` |
| `can_view_history` | **true** | `canViewHistory` | yes | `updateProfile` |
| `created_at` | now() | — | no | — |

Rows are created by the trigger `on_auth_user_created` → `handle_new_user()` (schema.sql:89–108): `username = raw_user_meta_data.username` or the e-mail local part; `display_name = meta.display_name` or `meta.username` or the local part. A new Supabase user therefore starts with **all five permission flags on** (column defaults) and not admin.

### 2.7 `audit_log` (security-update.sql:119–136) — section 10.

### 2.8 Storage `receipts` bucket — section 11.

### 2.9 What is NOT in the database

Per-member grant status, gift hand-outs, donors, payment-method column, store bills as rows, Purim money per member — all not found (store bills live inside the `grants_archive` JSON; see 02 §22 for the business-side "not found" list). No views, no RPC functions called by the client, no server-side computation.

---

## 3. Server-side permissions (RLS) versus client-side gating

UI-side gating is fully described in **01 §2** (`applyPermissions()` 719–771, `canEditUser()` 709–712, `isAdminUser()` 714–717). Here: what the server enforces after `security-update.sql`, and where the two disagree.

Helper functions (security-update.sql:20–46), all `security definer`, executable by `authenticated` only:
- `is_admin()` = `is_admin OR username = 'מנהל'`
- `can_edit()`, `can_view_income()`, `can_view_expenses()`, `can_view_grants()` = the flag OR admin.
- There is **no** `can_view_history()` function.
- A user with no `profiles` row gets `false` from every function (`coalesce(…, false)`).

| Table | select | insert | update | delete |
|---|---|---|---|---|
| members | all authenticated | can_edit | can_edit | admin |
| donations | all authenticated (comment: "צריך לחישוב 'נאסף השנה'") | can_edit | can_edit | admin |
| expenses | can_view_expenses | can_edit | can_edit AND can_view_expenses | admin |
| purim_addresses | can_view_income | can_edit AND can_view_income | same | admin |
| grants_archive | can_view_grants | can_edit AND can_view_grants | same | no policy (denied) |
| settings | all authenticated | admin | admin | no policy (denied) |
| profiles | all authenticated (schema.sql:136) | no policy (trigger only) | admin (`profiles_admin_update`) | no policy |
| audit_log | admin | `user_id = auth.uid()` | none | none |
| storage `receipts` | can_view_grants | can_view_grants AND can_edit | same | same |

If `security-update.sql` was never run, the original `auth_all_*` policies (schema.sql:124–132) let every logged-in user do everything, and `profiles_update_own` lets a user rewrite his own flags. The client detects the missing update in three places and shows a hint to run the file: audit log 1995–1996, permissions save 2420–2421, receipts 4853.

How RLS answers: a forbidden `select` returns **an empty array**, not an error — so a user without `מענקים` simply gets no `grants_archive` row and the client falls back to the built-in skeleton (02 §20.7). A forbidden write returns HTTP 401/403 with Postgres code 42501; the queue treats 403 as permanent (section 9.4) and shows `השרת לא אישר את השמירה ({label}): אין לך הרשאה לפעולה הזו`. A `PATCH` on `profiles` by a non-admin matches zero rows; `updateProfile` turns the empty representation into `אין הרשאה לעדכן משתמשים` with status 403 (sbi:223).

Mismatches between client and server:
- `canViewHistory` (`היסטוריית זכאות`) is enforced only in the history modal (1310–1316). The donations it hides are readable by everyone (D6).
- `canViewIncome` hides the Purim nav and the monthly chart, but donations are readable by everyone; only Purim rows are filtered by the server. Purim manual sums live in `settings`, readable by everyone.
- Settings writes need admin on the server; the client also routes Purim sums (2061–2082) and expense categories (2101–2140) through `settings`, so a non-admin who reaches `#settings-screen` by URL hash (01 §2.3) gets a rejection toast for every change.
- `canEditUser()` returns `true` when no profile was resolved (709–712), while `applyPermissions()` treats a missing profile as "no flags" (722–725), and the login path invents a profile with all flags on when none matches (662). The server then still refuses writes (no profile row → `can_edit()` false). D7.

---

## 4. Client data model and field mapping

In-memory `state` (script.js:55–77): `members`, `donations`, `expenses`, `users` (= profiles), `purimAddresses`, `grantsArchive`, `settings`, plus UI state (`activeScreen`, filters, `currentProfileId`, `currentUser` (display name string), `currentUserObj` (profile object), `grantsArchiveYear`, `billsHalf`, `purimActive`, edit modes, drafts). Some keys are added later at runtime: `state.billsHalf` (4594), `state.grantsArchiveYear`, `state.grantsEditingRecipient`, `state.legacyAssignKey`, `state.purimActive`.

Mapping functions (sbi:145–184; `clean()` drops `undefined` keys):

| Entity | to DB | from DB |
|---|---|---|
| member | `memberToDb` — all text fields default to `""`, `id` forced to string, `created_at: createdAt || null` | `memberFromDb` |
| donation | `donationToDb` — `member_id` string or `null`, `amount: Number()||0` | `donationFromDb` — `amount: Number()||0` |
| expense | `expenseToDb` | `expenseFromDb` |
| purim | `purimToDb` — `{ id: __sbId or omitted, data: row without __sbId }` | `purimFromDb` — `{ ...data, __sbId: id }` |
| profile | (only `updateProfile` patch of the 5 `can_*` flags) | `profileFromDb` — booleans via `!!` |

Derived per-member data (`buildMemberSummaries`, 5608–5731) is never stored; it is rebuilt from `members` + `donations` + `settings` and cached in memory by a version counter (`invalidateCache` / `getMemberSummaries`, 99–116). Every write path calls `invalidateCache()` before re-rendering.

---

## 5. JSON shapes

Examples below are illustrative (invented values), not copied from the production data.

### 5.1 `settings.data`

Every key the code reads or writes:

| Key | Type | Default (`DEFAULT_SETTINGS`, 13–30) | Written by | Read by |
|---|---|---|---|---|
| `campaignYear` | string (Hebrew label) | `'תשפ"ו'` | `saveSettings` (1762, free text, fallback to default) | `getCampaignYear()` 5733–5735, everywhere. `loadState` silently rewrites a cached `'תשפ"ה'` to `'תשפ"ו'` (2450–2453) |
| `targetChaider` | number | 0 | `saveSettings` | targets (02 §2) |
| `targetKtana` | number | 450 | ″ | ″ |
| `targetGedola` | number | 1100 | ″ | ″ |
| `targetKibbutz` | number | 0 | ″ | ″ |
| `targetTiyul` | number | 700 | ″ | gift 1 threshold |
| `targetShayTotal` | number | 2000 | ″ | gift 2 threshold |
| `gift1Name` / `gift2Name` | string | `"טיול"` / `"מתנה"` | ″ (empty → default) | badges, rules screen |
| `gift1Enabled` / `gift2Enabled` | boolean | true | ″ | `!== false` tests |
| `gift1Image` / `gift2Image` | string URL | `""` | ″ (input "קישור לתמונה (URL)", placeholder `https://...`, index.html:666, 674) | rules screen `<img>` (1824–1827); see D22 (CSP) |
| `additionalRules` | string | `""` | ″ | rules screen `כללים נוספים` (newlines → `<br>`) |
| `expenseCategories` | string[] | `["הדפסות","כנסים","סעודות","מתנות","תפעול","שונות"]` | `addExpenseCategory` 2101–2116, `removeExpenseCategory` 2118–2140 (min 1 kept) | `getExpenseCategories()` 2086–2089 (empty/missing → defaults) |
| `purimManualSums` | `{ [groupName]: { [yearLabel]: string } }` | `{}` | Settings → `סכומי פורים`, only changed cells (2061–2082) | dashboard income, Purim screen chips, print (02 §16.2) |

Example:
```json
{
  "campaignYear": "תשפ\"ו",
  "targetChaider": 0, "targetKtana": 450, "targetGedola": 1100, "targetKibbutz": 0,
  "targetTiyul": 700, "targetShayTotal": 2000,
  "gift1Name": "טיול", "gift1Enabled": true, "gift1Image": "",
  "gift2Name": "מתנה", "gift2Enabled": true, "gift2Image": "",
  "expenseCategories": ["הדפסות", "כנסים", "סעודות", "מתנות", "תפעול", "שונות"],
  "purimManualSums": { "קבוצה א": { "תשפ\"ה": "12500", "תשפ\"ו": "" } },
  "additionalRules": "שורה ראשונה\nשורה שנייה"
}
```
Notes: Purim sums are stored as the raw input string (`input.value`), and a cleared cell is stored as `""`, not deleted. The keys are group names only (02 Q15). Because every read is `{ ...DEFAULT_SETTINGS, ...data }` (800, 520, 2362, 2458) and the whole object is written back, defaults for missing keys get written into the database on the first save.

### 5.2 `grants_archive.data`

Business meaning of every field is in **02 §17–18**; this is the storage view. Every read goes through `mergeGrantsArchiveDefaults()` (4101–4124) on top of the skeleton `GRANTS_ARCHIVE` (4001–4044).

```
{
  perGroomValue: number,              // skeleton 8110.7; read only by getGrantPerGroomValue (never called)
  payments: [ LegacyPayment ],        // top-level legacy store payments; skeleton has 6 rows
  package: [ PackageGroup ],          // default package; used for a year without its own
  paymentProducts: any,               // passed through by the merge, never read or written elsewhere
  years: {
    "<Hebrew year label>": {
      recipients: [ Recipient ],
      package?: [ PackageGroup ],      // set the first time the year's package is edited
      storeBills?: [ StoreBill ],
      legacyHalves?: { "<legacyPaymentKey>": "א" | "ב" | "none" },
      payments?: [ LegacyPayment ],    // read (getGrantPaymentsForYear 4094–4099), never written by the UI
      perGroomValue?: number           // read only by the unused getGrantPerGroomValue
    }
  }
}
```

| Object | Keys | Written by |
|---|---|---|
| `Recipient` | `rid` (`R-…`; missing in migrated rows), `name?`, `id?` (= תעודת זהות, not a member id), `phone?`, `date?` (`YYYY-MM-DD` from the form; legacy text possible) | `submitGrantsAddRecipient` 4470–4501, `removeGrantsArchiveRecipient` 4518–4551 |
| `PackageGroup` | `store`, `discount` (free text like `"15%"`), `items[]` | `saveGrantsPackageEdit` 4364–4377 |
| package item | `name`, `qty` (0 allowed), `storePrice`, `orgPrice`, `value` (= `orgPrice × qty`, recomputed on save 4367) | editor 4379–4426 |
| `StoreBill` | `bid` (`B-…`), `store`, `half` (`"א"`/`"ב"`), `amount`, `reference`, `notes`, `paid` (bool), `paidDate` (`YYYY-MM-DD` or `""`), `method` (`העברה` / `צ'ק` / `מזומן` / `אשראי` / `אחר`, or `""` if unpaid), `receipt` (`null` or `{ path, name, size, uploadedAt }`), `createdAt`, `createdBy`, `updatedAt`, `updatedBy` (display names) | `saveStoreBill` 4858–4912, `deleteStoreBill` 4914–4948 |
| `LegacyPayment` | `year`, `store`, `date` (free text, Hebrew or `dd.mm.yyyy`), `description`, `method`, `amount` | never written by the UI (skeleton / migration only) |
| `legacyHalves` key | `legacyPaymentKey(p)` = `[store, date, amount, description]` trimmed and joined by `|` (4610–4612) | `saveLegacyAssign` 4667–4680 |
| year entry | `{ recipients: [] }` created on demand | `addGrantsArchiveYear` 4561–4583 and any mutator that needs the year |

Example (one year, abbreviated):
```json
{
  "perGroomValue": 8110.7,
  "payments": [ { "year": "תשפ\"ד", "store": "רויאל", "date": "תשרי תשפ\"ד", "description": "…", "method": "מזומן", "amount": 39835.95 } ],
  "package": [ { "store": "רויאל", "discount": "30%", "items": [ { "name": "…", "qty": 1, "storePrice": 1375, "orgPrice": 960, "value": 960 } ] } ],
  "years": {
    "תשפ\"ו": {
      "recipients": [ { "rid": "R-1762780000000-123", "name": "ישראל ישראלי", "id": "000000000", "phone": "050-0000000", "date": "2026-02-10" } ],
      "storeBills": [ { "bid": "B-1762780000000-45", "store": "סאפרים", "half": "א", "amount": 5600, "reference": "1234",
                        "notes": "", "paid": true, "paidDate": "2026-03-01", "method": "העברה",
                        "receipt": { "path": "bills/B-1762780000000-45-1762780100000.pdf", "name": "קבלה.pdf", "size": 182344, "uploadedAt": "2026-03-01T10:00:00.000Z" },
                        "createdAt": "…", "createdBy": "…", "updatedAt": "…", "updatedBy": "…" } ],
      "legacyHalves": { "אווניו 13 ביתר|אדר תשפ\"ו|6236|תשלום בפועל לפי כרטיסיית אווניו 13": "א" }
    }
  }
}
```
Storage-relevant merge behaviour (4101–4124): the saved top-level `package` is kept only if one of its items has `storePrice` or `orgPrice`; a missing `payments` array is replaced by the six built-in rows; each saved year is shallow-merged over the skeleton's (empty) years. Every save writes the **merged** object, so these defaults end up in the database (D10).

### 5.3 `purim_addresses.data`

One JSON object per address; keys are Hebrew column names coming from the old Google Sheet. Keys the code reads or writes:

| Key | Use |
|---|---|
| `עיר` | city tab; missing → `ללא עיר` (4981) |
| `קבוצה` | group tab and key of `purimManualSums`; missing → `ללא שיוך` |
| `מס'` | row number; displayed, not editable; part of the offline-queue key when `__sbId` is absent (402) |
| `משפחה`, `שם`, `רחוב`, `מספר`, `דירה`, `הערות` | editable cells (5106–5119) |
| `<Hebrew year label>` (e.g. `תשפ"ו`) | one editable cell per shown year — the amount (as text) this address gave that year; shown for the last 4 or 8 years up to the campaign year (4959–4965) |
| `__sbId` | client-only copy of the row uuid; stripped before saving (sbi:177) |

Example:
```json
{ "עיר": "ירושלים", "קבוצה": "קבוצה א", "מס'": "12", "משפחה": "כהן", "שם": "משה",
  "רחוב": "הרב קוק", "מספר": "5", "דירה": "3", "הערות": "", "תשפ\"ה": "180", "תשפ\"ו": "200" }
```
Any other key present in the migrated JSON is preserved untouched (the whole object is round-tripped), but not displayed (not found in code). Edited values are written back as `innerText.trim()` strings (5202).

---

## 6. Identifier generation

`generateId(prefix)` (5522): `` `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}` `` — client-side, millisecond time plus 0–999 (collision is possible only for two IDs in the same millisecond with the same random number).

| Prefix | Entity | Where |
|---|---|---|
| `M` | member | 1453 |
| `D` | donation | 1564, 1024 |
| `E` | expense | 1684 |
| `R` | grant recipient `rid` | 4483 |
| `B` | store bill `bid` | 4860 |
| `W` | offline-queue item | 409 |
| — | Purim row: server `gen_random_uuid()` | schema.sql:53 |
| — | audit row: `bigint generated always as identity` | security-update.sql:120 |
| — | profile: = `auth.users.id` (uuid) | schema.sql:76 |
| — | receipt object path: `bills/{bid with non [A-Za-z0-9-] removed}-{Date.now()}.{ext}` | 4877–4878 |

IDs of migrated rows: their format is not determinable from the code (they are `text`; the app only stringifies and compares them, often after `.trim()`). Not found.

---

## 7. Login, session, profile lookup, permission flags

### 7.1 Login (`initLoginScreen`, 635–692; form at index.html:22–48)

1. User types `שם משתמש` and `סיסמה` and presses `היכנס למערכת`.
2. Empty field → `יש להזין שם משתמש וסיסמה` (651).
3. `loginNameToEmail()` (39–43): trim, **lower-case**; if it contains `@` it is used as is, otherwise `{name}@tzedaka.local`. There is no user list in the code (comment 34–35; `DEFAULT_USERS = []`).
4. Button shows `מתחבר...`; `SB.signIn(email, password)` → `POST /auth/v1/token?grant_type=password` with only the `apikey` header (sbi:39–59).
5. Errors (671–687): network (`Failed to fetch` / `NetworkError` / `Load failed`) → `לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט, או שהשרת אינו זמין כרגע.`; 429 → `יותר מדי ניסיונות כניסה. נסה שוב בעוד כמה דקות.`; ≥500 → `השרת אינו זמין כרגע. נסה שוב בעוד כמה דקות.`; anything else → `שם משתמש או סיסמה שגויים` (never reveals whether the user exists).
6. On success: `state.currentUser = typed name`, `fetchDataFromServer(true)` (loads everything including `profiles`), `resolveCurrentUser()`, `applyPermissions()`, show the app, toast `ברוך הבא למערכת, {display name}!`, `initApp()`, `restoreFormDraft()`.

There is no "forgot password", no sign-up, no password change, no MFA in the app (not found). User management is done in the Supabase dashboard (`SETUP.md` §ניהול משתמשים; help text in Settings → `משתמשים`, index.html:735–741).

### 7.2 Session object

Stored by `setSession()` (sbi:24–27) in **sessionStorage** key `ezer_sb_session`:
```
{ access_token, refresh_token, expires_at (unix s; from response or now + expires_in, default 3600), user (GoTrue user: id, email, user_metadata, …) }
```
- One-time clean-up of an older `localStorage` copy on every load (sbi:20).
- `isLoggedIn()` = an access token exists; `expires_at` is never checked (D8).
- Refresh (`refresh()`, sbi:61–78): only reactive — when a REST or Storage call gets **401**, it posts `grant_type=refresh_token` once and retries; if refresh fails the session is cleared and the call throws `ההתחברות פגה - יש להתחבר מחדש`. No timer, no proactive refresh.
- `signOut()` (sbi:81–87) clears the session first, then `POST /auth/v1/logout` with `keepalive: true` (works offline: local logout always succeeds).
- Each tab has its own session (sessionStorage); closing the browser logs out (`SETUP.md` §סשן).

### 7.3 Page refresh with a live session

- `boot.js` (in `<head>`, before paint) sets CSS variable `--login-init-display: none` when `ezer_sb_session` has an access token, so the login overlay does not flash. It must be an external file because the CSP forbids inline scripts.
- `DOMContentLoaded` (573–611): `loadState()` (cached data), then if `SB.isLoggedIn()`: `state.currentUser = user.user_metadata.username || ""`, hide login, show app, `await fetchDataFromServer(true)`, `resolveCurrentUser()`, `applyPermissions()`, `initApp()`, `restoreFormDraft()`. If the fetch fails, the cached `profiles` (sessionStorage) are used.

### 7.4 Profile lookup (`resolveCurrentUser`, 695–707)

1. Find `state.users[]` (all profiles) whose `id` equals the GoTrue user id.
2. Fallback: match `username` against `state.currentUser` or the e-mail local part.
3. If found: `state.currentUserObj = profile`; `state.currentUser = profileDisplayName(profile)` — `display_name` if it is Hebrew or the username is not Hebrew, otherwise `username` (46–53).
4. Not found: `currentUserObj` stays `null` (login path then fabricates one with all flags on, 662).

`state.currentUser` (the display name) is what gets written to `expenses.approved_by`, store bill `createdBy`/`updatedBy`, `audit_log.username` and the print header (5378).

### 7.5 Flags and what they gate

Flags: `isAdmin`, `canEdit`, `canViewIncome`, `canViewExpenses`, `canViewGrants`, `canViewHistory` (mapped sbi:180–184; `isTrue()` 627–632 accepts `true`, `1`, `"TRUE"`, `"V"`, `"1"`, `"כן"`, `"Y"`, `"YES"` — legacy Sheets values). UI effects: **01 §2.2**; server effects: section 3. Changes made in Settings → `משתמשים` (`saveUserPermissions` 2406–2424) take effect `בכניסה הבאה שלו` (toast text) — there is no push to the other user's open session. Admin rows (`is_admin` or username `מנהל`) are shown checked and disabled; `is_admin` itself cannot be changed from the app.

---

## 8. Browser storage inventory, auto-lock, logout

| Key | Store | Content | Set | Cleared |
|---|---|---|---|---|
| `ezer_sb_session` | sessionStorage | session object (7.2) | sign-in / refresh | sign-out, failed refresh |
| `ezer_hatanim_members` | sessionStorage | `state.members` JSON | `saveState()` 2460–2468 after every change and load | logout (`clearLocalDataCache` 5824–5830) |
| `ezer_hatanim_donations` | sessionStorage | `state.donations` | ″ | ″ |
| `ezer_hatanim_expenses` | sessionStorage | `state.expenses` | ″ | ″ |
| `ezer_hatanim_purim` | sessionStorage | `state.purimAddresses` (with `__sbId`) | ″ | ″ |
| `ezer_hatanim_settings` | sessionStorage | `state.settings` | ″ | ″ |
| `ezer_hatanim_users` | sessionStorage | `state.users` (all profiles with flags) | ″ | ″ |
| `ezer_hatanim_grants_archive` | sessionStorage | `state.grantsArchive` (only written when not null) | ″ | ″ |
| `ezer_last_sync` | sessionStorage | ISO time of last successful load (807); shown as `סנכרון אחרון` dd/mm/yyyy hh:mm, or `טרם סונכרן` (2308–2313) | load | logout |
| `ezer_form_draft` | sessionStorage | `{ modalId, values: { inputId: value, __method? } }` | auto-lock only (5839–5847) | after restore/save/close (`clearFormDraft`) |
| `ezer_logout_reason` | sessionStorage | `"idle"` | auto-lock (5819) | next load, after showing toast `המערכת ננעלה אוטומטית עקב חוסר פעילות` (576–579) |
| `ezer_active_session` | sessionStorage | — | never set (not found) | removed at logout (5815) — dead |
| `ezer_pending_writes` | **localStorage** | offline queue (9.4) | every write | only by successful/rejected sends — **survives logout and browser close** on purpose (comment 2470–2471) |
| legacy copies of all `STORAGE_KEYS` and `ezer_last_sync` | localStorage | older versions | — | deleted on every load (`purgeLegacyLocalCache` 2472–2478) |

No cookies, no IndexedDB, no Cache Storage, no service worker (not found).

**Auto-lock** (5751–5801): `startIdleTimer()` assigns `window.onload/onmousemove/onmousedown/ontouchstart/onclick/onkeydown = resetIdleTimer` (property handlers, not listeners) and ticks every second while `#main-screen` is visible. 580 s → modal `המערכת עומדת להינעל` with a 20-second countdown and `השאר אותי מחובר` (`data-action="resetIdleTimer"`); 600 s → `performLogout(true)`. Scrolling or wheel alone does not reset it (D19). Per tab.

**Logout** (`performLogout`, 5803–5822): flush pending undo-deletes into the queue/server; manual logout with queued writes asks `יש שינויים שעוד לא נשמרו בשרת` (`צא בכל זאת` / `הישאר`); auto-logout saves the open form as a draft; `SB.signOut()`; delete all cached data keys; set `ezer_logout_reason` if idle; `location.reload()` after 150 ms. The offline queue is kept.

---

## 9. Sync model

### 9.1 What is loaded at start

`fetchDataFromServer(isSilent)` (789–828):
1. If the queue is not empty, `flushPendingWrites()` first "so the load includes them".
2. `SB.loadAll()` (sbi:187–202): **seven parallel** `selectAll` calls — `members`, `donations`, `expenses`, `purim_addresses`, `profiles`, `settings`, `grants_archive` — each paged by 1,000 rows. `audit_log` is not loaded at start.
3. Replace state: `members` always (even with an empty array); `donations`, `expenses`, `purimAddresses` if arrays; `users` only if non-empty; `settings = { ...DEFAULT_SETTINGS, ...data }` if a row exists; `grantsArchive` if a row exists.
4. `applyPendingWritesToState()` (469–485): re-apply every queued write over the fresh data (upsert by id; delete by id; settings/archive replaced by the queued snapshot; Purim by `__sbId` or by the city|group|number key).
5. `resolveCurrentUser()`, `invalidateCache()`, `saveState()`, stamp `ezer_last_sync`.
6. Re-render everything (`renderAll()` 5737–5745 + selects, users table, permissions, settings if open), update the pending banner. Returns `true`.
7. Any error (one failed table fails all, `Promise.all`): console warning, toast `לא ניתן לטעון נתונים מהשרת כרגע. מוצגים הנתונים האחרונים שנטענו` unless silent; returns `false`; the cached state stays on screen.

Entry points: login, page refresh with session, header refresh `#btn-refresh-data`, dashboard `#dashboard-refresh-data`, phone `#mobile-refresh` (toast `לא ניתן לטעון נתונים מהשרת כרגע` on failure), Settings `סנכרן עכשיו` (`syncNow` 2377–2387: `הנתונים סונכרנו` / `הנתונים נטענו, אבל {n} שינויים עדיין ממתינים לשליחה` / `הסנכרון נכשל: אין חיבור לשרת. מוצגים הנתונים האחרונים שנטענו`), after a backup import, and the Purim empty state `רענן נתונים`.

There is **no** realtime subscription, no periodic data polling and no "data changed by someone else" notice (not found). Other users' changes appear only after one of the refreshes above.

### 9.2 Caching

- Persistent cache: sessionStorage copy of the whole state (section 8), rewritten in full by every `saveState()` call. Used to paint instantly on page refresh and as the offline fallback.
- Memory cache: member summaries (version counter, 99–116); chart theme colours (85–96).

### 9.3 Optimistic updates

Every write path follows the same order: build the record → mutate `state` → `invalidateCache()` → `saveState()` → re-render → close the modal → `await persist(op, payload)` → toast via `reportSave(saved, okMsg)` → `logAudit(...)`.
- `reportSave` (463–466): saved → `okMsg` (or `נשמר בהצלחה`); not saved and queue non-empty → `אין חיבור לשרת כרגע. השינוי שמור במחשב הזה ויישלח אוטומטית כשהחיבור יחזור`; rejected → nothing extra (the queue already showed the rejection toast).
- Member save shows the floating indicator `מעדכן...` → `עודכן בהצלחה` or `נשמר במחשב, ממתין לשליחה` (1425–1447).
- Nedarim save: `התרומה נרשמה בהצלחה לזכות הבחור!`.
- Rejected writes are **not** rolled back in `state` (D2).

### 9.4 Offline queue, retry, pending counter (375–506)

- Item: `{ id: "W-…", op, key, payload (deep copy), ts }` in localStorage `ezer_pending_writes`.
- `op` ∈ `WRITE_OPS` (376–386): `saveMember`, `saveDonation`, `saveExpense`, `savePurim`, `saveSettings`, `saveGrantsArchive`, `deleteMember`, `deleteDonation`, `deleteExpense`. Labels `WRITE_LABELS` (387–390): `פרטי בחור`, `מחיקת בחור`, `הפקדה`, `מחיקת הפקדה`, `הוצאה`, `מחיקת הוצאה`, `כתובת פורים`, `הגדרות`, `נתוני מענקים`.
- Coalescing (`pendingEntityKey` 399–405): one entry per entity — `settings`, `grants`, `purim:{__sbId or city|group|מס'}`, `member:{id}`, `donation:{id}`, `expense:{id}`. A new write for the same key replaces the older unsent one (so a save then delete of the same donation keeps only the delete).
- `persist(op, payload)` (454–460): enqueue, flush, flush once more if still pending without error; returns `true` only when the item left the queue successfully.
- `flushPendingWrites()` (423–451): single-flight per tab; returns immediately if logged out; sends items **in order**; success → remove; permanent error (`isPermanentWriteError` 418–421: status 400–499 except 401, 408, 429) or unknown op → remove, remember id as rejected, toast `השרת לא אישר את השמירה ({label}): {אין לך הרשאה לפעולה הזו | message}`, continue; transient error (no status, 5xx, 401, 408, 429) → stop and keep the rest.
- Retry triggers: every `persist`; browser `online` event (505); every 30 s while the queue is non-empty (506); banner button `נסה עכשיו` (toast `כל השינויים נשמרו בשרת` / `עדיין אין חיבור לשרת. ננסה שוב אוטומטית`); start of every `fetchDataFromServer`; start of every settings/grants merge-save.
- Pending counter: fixed banner `#pending-writes-banner` (487–503), icon `cloud_off`, text `{n} שינוי עדיין לא נשמר בשרת. הם שמורים במחשב הזה ויישלחו אוטומטית.` (singular) / `{n} שינויים עדיין לא נשמרו בשרת. …` (plural). Removed when the queue is empty.
- Not queued (need a live connection): receipt upload / view / delete, audit inserts, permission saves, backup import, the singleton re-read.

### 9.5 Undo-delete window (319–368)

`scheduleUndoableDelete(job)`: applies the removal locally at once, shows toast `{message}` + button `בטל פעולה` for **6 s**, then commits. A new delete first commits any pending one. Undo → `הפעולה בוטלה, הרשומה הוחזרה`. If the record came back meanwhile (e.g. a refresh), it is removed again before committing (`exists`). On `pagehide` an unfinished delete is put in the offline queue (`queueOnExit`) so it is sent next login; logout commits them immediately.

| Delete | Message | Commit |
|---|---|---|
| member (admin) | `{name} נמחק` | `persist("deleteMember")` |
| donation (admin) | `ההפקדה על סך ₪{n} נמחקה` | `persist("deleteDonation")` |
| expense (admin) | `ההוצאה "{description or category}" נמחקה` | `persist("deleteExpense")` |
| expense category | `הקטגוריה "{name}" הוסרה` | `saveSettingsPatch` |
| grant recipient | `{name or id} הוסר מרשימת מקבלי המענק` | `mutateGrantsArchive`; undo also saves (4541) |
| store bill | `התשלום ל{store} על סך ₪{n} נמחק` | `mutateGrantsArchive`, then delete receipt file |

### 9.6 Merge-before-save for the singletons (508–552)

`saveSettingsPatch(mutator)` and `mutateGrantsArchive(mutator)`:
1. Apply the mutator to local state at once (optimistic), `saveState()`.
2. Chain the job after the previous save of the same singleton (`settingsSaveChain` / `grantsSaveChain`), so saves are serialized.
3. Flush the queue. If no save of this singleton is still queued: re-read the server copy (`fetchSingleton`), re-apply the same mutator to it (`{...DEFAULT_SETTINGS, ...fresh}` / `mergeGrantsArchiveDefaults(fresh)`), and adopt the result as local state.
4. `persist` the whole object. If the merged result differs from what was on screen, re-render.

This is a "replay the change on the latest version" pattern; it narrows but does not close the race (read-then-write, no version check), and is skipped entirely while offline (D9). Purim sums save only the cells that changed (2063–2070) for the same reason.
Row tables (`members`, `donations`, `expenses`, `purim_addresses`) have no merge and no version column: last writer wins for the whole row (D11).

### 9.7 Drafts

Only on auto-lock (section 8): the open member / donation / expense modal fields (`DRAFT_MODALS` 5834–5838) are stored in `ezer_form_draft` and re-opened after the next login in the same tab, with toast `שחזרנו טופס שהיה פתוח לפני שהמערכת ננעלה. אפשר להמשיך ולשמור`. No autosave of drafts otherwise; no draft for store bills, grants, Purim edits or settings (not found). The member modal also auto-saves when closed with X or by clicking outside if first and last name are filled (`closeWithAutoSave` 1397–1401; skipped when nothing changed, 1466–1473).

---

## 10. Audit log

Table `audit_log` (security-update.sql:119–136): `id` identity, `created_at` default now(), `user_id` default `auth.uid()`, `username` text, `action` text, `entity` text, `entity_id` text, `details` jsonb. Insert only as yourself; read admin only; no update/delete.

Client: `logAudit(action, entity, entityId, details)` (555–559) → `SB.insertAudit({ action, entity, entity_id: String(id) | null, username: state.currentUser, details | null })`, fire-and-forget (`.catch(() => {})`), skipped when logged out. Not queued.

Every call:

| Line | action | entity | entity_id | details keys |
|---|---|---|---|---|
| 1047 | create | donation | donation id | `amount`, `member` (name), `via: "נדרים פלוס"`, `confirmation` |
| 1492 | create / update | member | member id | `name` |
| 1580 | create | donation | id | `amount`, `member` (name), `year` |
| 1580 | update | donation | id | `before{amount,date,member(id),year}`, `after{…}` |
| 1606 | delete | donation | id | `amount`, `date`, `member` (snapshot or id), `year` |
| 1699 | create | expense | id | `amount`, `category`, `description` |
| 1699 | update | expense | id | `before{amount,category,description}`, `after{…}` |
| 1721 | delete | expense | id | `amount`, `category`, `description`, `year` |
| 1784 | update | settings | `targets` | all 14 target/gift/rules values |
| 2081 | update | settings | `purim-sums` | **array** of `{group, year, value}` (D4) |
| 2115 | create | expense-category | category name | — |
| 2135 | delete | expense-category | category name | — |
| 2275 | update | member | id | `field`, `value`, `via: "תקינות נתונים"` |
| 2364 | import | backup | file name | `counts` (text) |
| 2418 | update | profile | user uuid | `user`, the 5 flags |
| 3597 | delete | member | id | `name` |
| 3663 | update | member | id | `via: "עריכה בטבלה"`, `name` |
| 4376 | update | grant-package | year | `stores` (count) |
| 4499 | create / update | grant-recipient | `rid` | `year`, `name`, `id` |
| 4545 | delete | grant-recipient | `rid` or `id` | `year`, `name`, `id` |
| 4582 | create | grant-year | year | — |
| 4679 | update | store-bill | legacy payment key | `שנה`, `שיוך` (`ללא` / `מחצית א`/`ב`) |
| 4881 | upload | store-bill | `bid` | `store`, `file` |
| 4909 | create / update | store-bill | `bid` | `year`, `half`, `store`, `amount`, `paid`, `reference` |
| 4910 | paid | store-bill | `bid` | `store`, `amount`, `method`, `date` — only when an existing bill flips to paid (D5) |
| 4940 | delete | store-bill | `bid` | `year`, `store`, `amount` |
| 5214 | update | purim | `{city} / {group}` | `rows` (count) |

Not audited (not found): login / logout / failed login, backup export, receipt view, receipt file deletion, opening the Nedarim iframe, saving a member draft. (Legacy-assign to `none` is audited, as `update` / `store-bill`.)

Display (Settings → `יומן פעולות`, `renderAuditLog` 1982–1999): last 300 rows, columns `מתי` (dd/mm/yyyy hh:mm), `משתמש`, `פעולה` (`AUDIT_ACTIONS` 1969: `הוספה`, `עדכון`, `מחיקה`, `ייבוא`, `סימון תשלום`, `העלאת קבלה`), `על מה` (`AUDIT_ENTITIES` 1970–1973: `בחור`, `הפקדה`, `הוצאה`, `כתובות פורים`, `הגדרות`, `קטגוריית הוצאה`, `מקבל מענק`, `תכולת מענק`, `שנת מענקים`, `תשלום לחנות`, `גיבוי`, `הרשאות משתמש`), `פרטים` (`describeAuditDetails` 1974–1981: for before/after only the changed keys as `key: old ← new`; otherwise `key: value` of scalar values joined by ` · `). `entity_id` is not displayed. No filter, search, paging or export. Loading text `טוען...`; empty `עדיין אין פעולות ביומן`.

---

## 11. Receipts in Supabase Storage

Only for store bills (grants → `תשלומים לחנויות` → store-bill modal, index.html:979–1021). Field `קבלה (PDF או תמונה, עד 10MB)`, `<input type="file" accept="application/pdf,image/*">`.

| Step | Code | Detail |
|---|---|---|
| Size check | 4869 | > 10 MB → `הקובץ גדול מדי (עד 10MB)` |
| Path | 4877–4878 | `bills/{bid sanitised}-{Date.now()}.{ext}`; ext = last 1–5 alphanumerics of the file name, lower-cased, default `bin` |
| Upload | `SB.uploadReceipt` sbi:247 | `POST /storage/v1/object/receipts/{path}`, body = the File, `Content-Type` = file type, `x-upsert: true`, user token; 401 → refresh + retry |
| Record | 4880 | `receipt = { path, name, size, uploadedAt }` inside the bill in `grants_archive` |
| View | `viewStoreBillReceipt` 4837–4848, `SB.receiptUrl` sbi:248–253 | opens an empty tab first (avoids popup blocking), `POST /storage/v1/object/sign/receipts/{path}` with `{ expiresIn: 600 }` → **10-minute signed URL** on the Supabase host, assigned to the new tab |
| Replace / remove | 4831–4835, 4911 | `הסר` marks the current file cleared; after a successful save the old object is deleted (`DELETE /storage/v1/object/receipts` with `{ prefixes: [path] }`) |
| Delete bill | 4942 | the file is deleted only after the archive save succeeded |
| Server limits | security-update.sql:139–144 | private bucket, 10,485,760 bytes, MIME `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` |
| Errors | `receiptErrorMessage` 4850–4856 | offline → `אין חיבור לשרת. העלאה וצפייה בקבלות דורשות חיבור לאינטרנט`; bucket/policy missing → `תיקיית הקבלות עוד לא הוגדרה בשרת. צריך להריץ פעם אחת את הקובץ supabase/security-update.sql ב-Supabase`; 413 → `הקובץ גדול מדי (עד 10MB)`; else `פעולת הקבלה נכשלה: {message}` |

The upload happens before the bill is saved; if the upload fails nothing is saved. No thumbnails or inline preview (the CSP would allow `img-src` from the Supabase host, but the old app never renders receipts inline). Donation receipts: not found.

---

## 12. Full backup: export and import

Settings → `גיבוי וסנכרון` (index.html:707–722): record counts (`בחורים`, `הפקדות`, `הוצאות`, `כתובות פורים`), `סנכרון אחרון`, buttons `סנכרן עכשיו`, `ייצוא גיבוי`, `ייבוא גיבוי` (hidden `<input type=file accept="application/json">`).

**Export** (`exportFullBackup` 2322–2336) — of the in-memory state, not a fresh server read:
```
{ _app: "צדקת רבי שמעון", _version: 1, _exportedAt: ISO,
  members[], donations[], expenses[], purimAddresses[] (with __sbId), settings{}, grantsArchive{} | null, users[] (profiles incl. flags) }
```
File `גיבוי_צדקת_רבי_שמעון_{YYYY-MM-DD}.json` (UTC date from `toISOString`), pretty-printed, toast `קובץ הגיבוי ירד`. No permission check in the function (D14); a user only exports what the server let him load.

**Import** (`importFullBackup` 2338–2375), admin only (`רק מנהל יכול לייבא גיבוי`):
1. Parse; must be an object with a `members` array, else `הקובץ אינו קובץ גיבוי תקין`.
2. Confirm dialog `ייבוא גיבוי לשרת`: `יועלו לשרת: {n} בחורים, {n} הפקדות, {n} הוצאות, {n} כתובות פורים, והגדרות[ ומענקים].` + `רשומות קיימות עם אותו מזהה יוחלפו בגרסה שבגיבוי. רשומות שלא נמצאות בגיבוי יישארו.`, button `ייבא את הגיבוי` (danger).
3. Button `מעלה לשרת...`; sequential, directly to the server (bypassing the queue and the merge): members (normalised framework) → donations → expenses → Purim (by `__sbId`; rows without one are inserted as new) in chunks of 500 → settings (`{...DEFAULT_SETTINGS, ...data.settings}`, whole replace) → grants archive (whole replace). `users` is ignored.
4. Audit `import`/`backup`, full reload, re-render settings, toast `הגיבוי יובא ונשמר בשרת`.
5. On any error: `הייבוא נעצר באמצע: {message}. אפשר להריץ שוב את אותו קובץ` — not atomic; re-running is safe for keyed rows (upsert).

Other exports (CSV/XLS per table, print) are listed in **01 §20**.

---

## 13. Security headers, CSP, redirects — what the new design must obey

### 13.1 Headers (`_headers` for Netlify; `serve.json` is the identical copy for the local server)

Applied to `/*`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=(), bluetooth=(), browsing-topics=()`
- `Content-Security-Policy:` (directive by directive)

| Directive | Value | Forbids / means for the new design |
|---|---|---|
| `default-src` | `'self'` | any fetch type not listed below (media, etc.) only from the site |
| `script-src` | `'self'` | **no inline `<script>`, no `on…=` attributes, no `javascript:` URLs, no `eval`/`new Function`/string `setTimeout`, no CDN scripts.** Chart.js is vendored (`assets/vendor/chart.umd.min.js`). All clicks go through the `data-action` whitelist (`UI_ACTION_NAMES` 149–165, dispatcher 174–188); `<img onerror>` is replaced by a capture-phase `error` listener (191–198); the Purim print window gets no script, printing is triggered from the opener (5287–5291) |
| `style-src` | `'self' 'unsafe-inline'` | stylesheets only from the site — **Google Fonts CSS is blocked**. `<style>` blocks and `style=""` attributes are allowed (the header comment says `unsafe-inline` is temporary, "יוסרו בשלב 2"). Old JS emits 3 `style=` attributes (1278, 3048, 4238) and many CSSOM `.style.x =` writes (CSSOM is not subject to CSP) |
| `img-src` | `'self' data: blob:` + the Supabase host | external image URLs are blocked (D22); `data:` SVG backgrounds in `style.css` are fine |
| `font-src` | `'self'` | **no Google Fonts / CDN fonts.** Self-hosted: Heebo variable, weights **300–800**, 5 unicode-range subsets (`assets/fonts/heebo-*.woff2`), and `material-icons.woff2` (`style.css:15–64`) |
| `connect-src` | `'self'` + the Supabase host (https) | `fetch`/XHR only to the site and Supabase; no analytics, no other APIs. Supabase Realtime (wss) is not used today; whether `wss://` to that host is covered by the `https://` source depends on the browser's CSP3 scheme matching — test before relying on it |
| `frame-src` | `https://www.matara.pro` | only the Nedarim Plus iframe; no YouTube/maps/other embeds |
| `frame-ancestors` | `'none'` (+ `X-Frame-Options: DENY`) | the site cannot be shown inside another site's iframe (including design-preview tools) |
| `base-uri` | `'self'` | |
| `form-action` | `'self'` | no form may post to another origin (the login form never submits natively; `preventDefault` 643) |
| `object-src` | `'none'` | no `<object>`/`<embed>` (PDF receipts open in a new tab, not embedded) |
| `worker-src` | `'self'` | a future service worker must be a same-origin file |
| `manifest-src` | `'self'` | |

### 13.2 `_redirects`

Return the 404 page with status 404 (forced `!`) for files that are in the repository but not part of the site: `/migrations/*`, `/supabase/*`, `/tools/*`, `/serve.json`, `/__demo.js`, `/start-site.bat`, `/.gitattributes`. (`migrations/` and `__demo.js` do not exist in the tree.) **`/redesign/*` is not blocked** (D21). There is no SPA fallback rule: the app is one page and routes by `#hash` (01 §1.5). `404.html` uses absolute `/style.css` and `/assets/img/favicon-32.png`.

### 13.3 Local server (`start-site.bat`)

A PowerShell static server on `http://localhost:{port}/` that applies the headers from `serve.json` to every path **except** `redesign/…` (start-site.bat:108–112: "The design prototypes under redesign/ use inline scripts and Google Fonts and are not part of the live site"). A prototype that works locally can therefore break once moved into the site paths.

### 13.4 What in the current prototype would be blocked (grep of `redesign/prototype.html`)

- 1 `<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800;900…">` → blocked twice (style-src and font-src). Use the self-hosted Heebo; weight 900 is not self-hosted (range 300–800).
- 4 inline `<script>` blocks → blocked; must become files.
- 4 `<style>` blocks and 51 `style=""` attributes → allowed today (`'unsafe-inline'`), but slated for removal by the header comment.
- No inline `on…=` handlers found.

---

## 14. PWA

- `manifest.json`: `name` `צדקת רבי שמעון - מערכת ניהול`, `short_name` `צדקת רבי שמעון`, `description` `ניהול גבייה, זכאות ומענקים`, `lang` `he`, `dir` `rtl`, `start_url` and `scope` `./`, `display` `standalone`, `orientation` `any`, `background_color` and `theme_color` `#101014`, icons `assets/img/icon-192.png` (192, any), `icon-512.png` (512, any), `icon-maskable-512.png` (512, maskable).
- `index.html:5–15`: `viewport-fit=cover`, `theme-color #101014`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style black`, `apple-mobile-web-app-title`, manifest link, favicon 32, apple-touch-icon 180.
- Icons are generated from `assets/img/logo.png` by `tools/make-icons.ps1` (not served).
- **No service worker** → no offline start, no install prompt handling, no caching of assets (not found). "Offline" support is only the write queue + sessionStorage copy while the page stays open.

---

## 15. Data-layer quirks and risks

| # | What | Where |
|---|---|---|
| D1 | The offline queue lives in localStorage and survives logout. On a shared computer the next user to log in (any account) flushes the previous user's unsent writes under his own token, and they are not audited for either user. | 375–396, 2470–2471, 5803–5822 |
| D2 | A write rejected by the server is dropped from the queue but the local state keeps the rejected value until the next reload/sync. | 436–441 |
| D3 | Audit rows are written after `persist` regardless of the result (also for queued or rejected writes) and are themselves not queued, so offline actions are never audited and rejected ones are. `username` is a free-text display name sent by the client. | 555–559 and every call site |
| D4 | Purim-sums audit `details` is an array, so the `פרטים` column shows nothing for it. | 2081, 1980 |
| D5 | `paid` is audited only when an existing bill flips to paid, not when a bill is created already paid. | 4910 |
| D6 | `canViewHistory` is client-only; every logged-in user can read every donation from the API. Likewise `profiles` (all users' flags) is readable by everyone. | security-update.sql:71, schema.sql:136 |
| D7 | Missing profile: `canEditUser()` says yes, `applyPermissions()` says no, the login path fabricates all flags on, the server says no. Inconsistent buttons and rejection toasts. | 662, 709–712, 722–725 |
| D8 | Token expiry is handled only on a 401. If refresh fails, the session is wiped but the app stays on screen (no redirect to login) until reload; later writes queue up as transient errors. `expires_at` is stored but never read. | sbi:95–97, 239–241 |
| D9 | Singletons are written whole. Offline (or with a queued save) the merge is skipped and the local snapshot overwrites the server; `applyPendingWritesToState` also replaces fresh server settings/archive with the queued snapshot. | 517, 539, 478–479 |
| D10 | `mergeGrantsArchiveDefaults` injects the built-in legacy payments and default package into the saved archive, so the first grants save persists them; users without `מענקים` permission see and compute with the skeleton. | 4101–4124 |
| D11 | No optimistic-concurrency field on any row table; two editors of the same member, donation, expense or Purim row → last writer wins for the whole row (whole JSON for Purim). | sbi:127–130 |
| D12 | `saveState()` writes the whole dataset to sessionStorage on every change without try/catch; a quota error would throw inside save handlers. | 2460–2468 |
| D13 | Backup import: a 500-row Purim chunk mixing rows with and without `__sbId` sends objects with different keys, which PostgREST bulk insert may reject (not verified); a backup without `__sbId` duplicates Purim rows on re-import; settings and grants are replaced without merge; `users` is ignored; not atomic. | 2357–2363, sbi:177 |
| D14 | Export has no admin check, and Settings is reachable by `#settings-screen` for any user (01 §2.3). The file includes all profiles with their flags and internal `__sbId`s. | 2322–2336 |
| D15 | Receipt upload is not tied to a successful archive save: if the save is queued or rejected, the uploaded object is orphaned. Client `accept="image/*"` is wider than the bucket MIME list (GIF, BMP, SVG fail server-side with a generic message). | 4875–4912, index.html:1009 |
| D16 | Two credit markers in `donations.notes`: manual `(אשראי) ` prefix vs Nedarim's `אשראי - נדרים פלוס`. A Nedarim donation opened for edit shows the radio on `מזומן`. No real payment-method column. | 1567, 1619–1624, 988 |
| D17 | `memberToDb` sends `created_at: null` when a member has no `createdAt`, overriding the column default. | sbi:150 |
| D18 | `settings.updated_at` / `grants_archive.updated_at` never change after the first insert. | schema.sql:62, 69 |
| D19 | Idle lock uses `window.on…` property assignment (overwrites any other such handler) and ignores scroll/wheel; it is per tab. | 5755–5765 |
| D20 | A Purim row without `__sbId` is keyed in the queue by city + group + row number; two such rows with the same number would coalesce. | 402 |
| D21 | `_redirects` does not block `/redesign/*`; merging the redesign branch would publish the prototypes and research files. | `_redirects` |
| D22 | Settings accept an external `https://` gift image URL, but `img-src` blocks any host other than the site and Supabase, so the image always falls back to the icon. | 1824–1827, index.html:666, 674 |
| D23 | Multiple tabs share the localStorage queue but not the single-flight lock, so two tabs can send the same item (harmless for upserts/deletes, but toasts duplicate). | 423–425 |
| D24 | `loadAll` is all-or-nothing (`Promise.all`); a failure of any one of the seven tables shows only cached data. | sbi:188–192 |
| D25 | `fetchDataFromServer` replaces `members` even with an empty array but keeps the old `profiles` when the server returns none. | 795, 799 |
| D26 | Login lower-cases the name and accepts a full e-mail; a Hebrew username such as `מנהל` would become `מנהל@tzedaka.local` (whether GoTrue accepts that address is not verifiable from the code). | 39–43 |

---

## 16. Not found

- supabase-js or any SDK; Supabase Realtime; Edge Functions; RPC calls; database views.
- Proactive token refresh; "remember me"; password reset / change; sign-up; MFA; login audit.
- Service worker, offline asset cache, IndexedDB, Background Sync.
- Version/`updated_at` checks on rows; conflict UI ("someone else changed this").
- Creating or deleting a Purim address in the UI; editing legacy grant payments; per-year `payments` writes.
- Server-side validation beyond RLS (no CHECK constraints on amounts, years or dates; no FK from donations to members).
- Any import other than the full JSON backup (no CSV/Excel import).
- Any use of `can_view_history` on the server.
- Any third-party script, font, image, analytics or API call other than Supabase and the Nedarim Plus iframe.
- Any reading of results back from Nedarim Plus: no `postMessage` listener, no webhook, no API; the user answers `האם התשלום עבר בהצלחה?` by hand.

### Nedarim Plus integration (for completeness; screen flow in 01 §11)

`openNedarimModal` (1056–1067) loads the public page of the charity on matara.pro in `#nedarim-iframe` (allowed by `frame-src`). Closing the iframe step (`btn-close-nedarim`) blanks the iframe and asks `האם התשלום עבר בהצלחה?`; `כן, התשלום עבר` opens `רישום ההפקדה ששולמה` (member from `members-datalist`, `סכום (₪) ששולם *`, `מספר אישור עסקה (מנדרים פלוס)`, `הערות / שם התורם` prefilled `אשראי - נדרים פלוס`). Save (1003–1052) requires a member and an amount > 0 (`חובה לחפש בחור מתוך הרשימה ולהזין סכום ששולם (גדול מ-0)`), asks to confirm when the confirmation number is empty (`לא הוזן מספר אישור עסקה` / `שמור בלי מספר אישור`), and creates an ordinary donation: today's date, campaign year, notes `{notes} | אישור עסקה: {n}`. Audited with `via: "נדרים פלוס"` and `confirmation`. Nothing is stored about the card or the transaction beyond the typed number.

---

## 17. Checklist for applying the new design

1. Keep `supabase-integration.js`, `boot.js` and the load order; keep every element id that `script.js` binds by id and every `data-action` name in `UI_ACTION_NAMES` (or extend the whitelist).
2. No inline scripts or handlers; put all prototype JS in same-origin files; use `data-action` / `data-change` / `data-input` + `data-args`.
3. Fonts: use the self-hosted Heebo (300–800) and Material Icons; drop the Google Fonts link; do not rely on weight 900.
4. Images: all design images must be same-origin files or `data:` URIs (the 17 images in `redesign/shared/images/` would need to be copied into `assets/`); no hot-linked images.
5. Prefer classes over `style=""` (allowed now, planned to be removed).
6. Keep the pending-writes banner, saving indicator, undo toast, timeout modal and login overlay behaviours (they carry the sync model), restyled only.
7. Before merging to `master`, block or remove `/redesign/*` in `_redirects`.
8. Decide on D1, D2, D7, D8, D9 before adding features that write more data.
