# 02 — Business rules and calculations in the old system

Scope: read-only study of `/home/user/x3242277-cmyk/tzedakat-rabbi-shimon` (charity "צדקת רבי שמעון · עזרת חתנים").
Files read in full for this lens: `script.js` (5,864 lines), `supabase-integration.js` (268 lines), `supabase/schema.sql`, `supabase/security-update.sql`, `supabase/SETUP.md`, and the relevant parts of `index.html` (selects, labels, modals, settings panes).
All line numbers below refer to `script.js` unless another file is named.

How to read this file

- "Formula" = what the code does, in plain words. "Code" = the exact snippet when the wording is load-bearing.
- "Verified" = I extracted the pure functions from `script.js` and ran them with test data (see section 23). Nothing in the old repository was modified.
- "Not found" = I looked for it and the old code has no such thing.
- Section 21 collects quirks, inconsistencies and probable bugs that a rebuild has to decide about (copy as-is, or fix). They are also flagged inline with **Quirk**.

Contents

1. Data the rules run on
2. Settings and yearly targets by framework
3. Framework / shiur progression and rollback for other years
4. Per-member yearly summary: collected, year map, gap filling
5. Cumulative debt and the doubled penalty
6. "Required" amount, gap, open debt now
7. Eligibility rules per framework, and the status badge
8. The two configurable gifts
9. Who counts as married, and what that changes
10. Hebrew-year handling
11. Date parsing, amounts, currency formatting
12. Dashboard: KPIs, progress, alerts and thresholds, activity, segments, drill-downs
13. Income by year (members versus Purim), outgoing, grants cost
14. Expenses: anomaly detection, summary KPIs, monthly average, tables
15. Movements report (daily report) and the monthly income chart
16. Purim: addresses, groups, per-group manual sums
17. Grants: archive structure, package value, recipients
18. Grants: per-store expectation by half-year, store bills, legacy payments
19. Data-integrity checks and input validations
20. Other computed things (lists, profile, history modal, rules screen, IDs, permissions that change numbers)
21. Quirks, inconsistencies and probable bugs
22. Not found
23. Verification runs

---

## 1. Data the rules run on

Client-side shapes (after mapping in `supabase-integration.js` lines 147–184):

| Entity | Fields used by calculations | Notes |
|---|---|---|
| member | `id`, `firstName`, `lastName`, `fatherName`, `phone`, `yeshiva`, `shiur`, `yeshivaType`, `maritalStatus`, `address`, `notes`, `createdAt` | `yeshivaType` is one of `חיידר` / `ישיבה קטנה` / `ישיבה גדולה` / `קיבוץ` (`index.html` line 861). `shiur` is `א`…`ט` (`index.html` 863–873). `maritalStatus` is `רווק` / `נשוי` (`index.html` 875). `createdAt` is never used in a calculation. |
| donation | `id`, `memberId`, `memberNameSnapshot`, `year` (Hebrew label text), `amount`, `date` (free text), `notes`, `createdAt` | DB comment, `schema.sql` line 32: `date text, -- נשמר כטקסט: המקור מכיל תאריכים לא-אחידים`. Payment method is not a field; credit is encoded as a `(אשראי) ` prefix in `notes` (lines 1567, 1620). |
| expense | `id`, `year`, `category`, `description`, `amount`, `date` (free text), `approvedBy`, `createdAt` | |
| purim address | free JSON with Hebrew keys: `עיר`, `קבוצה`, `מס'`, `משפחה`, `שם`, `רחוב`, `מספר`, `דירה`, one key per Hebrew year label, `הערות`; plus `__sbId` | Stored as `jsonb` (`schema.sql` 52–56). |
| settings (singleton JSON) | `campaignYear`, `targetChaider`, `targetKtana`, `targetGedola`, `targetKibbutz`, `targetTiyul`, `targetShayTotal`, `gift1Name`, `gift1Enabled`, `gift1Image`, `gift2Name`, `gift2Enabled`, `gift2Image`, `expenseCategories[]`, `purimManualSums{group:{year:value}}`, `additionalRules` | Defaults: `DEFAULT_SETTINGS`, lines 13–30. |
| grants archive (singleton JSON) | `perGroomValue`, `package[]`, `payments[]`, `years{year:{recipients[], package[]?, payments[]?, storeBills[]?, legacyHalves{}?, perGroomValue?}}` | Default skeleton `GRANTS_ARCHIVE`, lines 4001–4044. |

Nothing derived is stored. Targets per year, debts, penalties, eligibility, gift eligibility and every dashboard number are recomputed in the browser on each render from members + donations + settings (`buildMemberSummaries`, lines 5608–5731). There is no debt ledger, no waiver, no per-member override (see section 22).

Year matching is by exact string equality of the Hebrew label (for example `d.year === currentYear`, line 2531). The canonical form uses the ASCII double quote: `תשפ"ו`.

---

## 2. Settings and yearly targets by framework

Defaults (`DEFAULT_SETTINGS`, lines 13–30; the same numbers are repeated as fallbacks in `cacheSettingsInputs`, lines 831–848):

| Setting key | UI label (`index.html` 648–676) | Default |
|---|---|---|
| `campaignYear` | `שנת קמפיין נוכחית` (free-text input, placeholder `לדוגמה: תשפ"ו`) | `תשפ"ו` |
| `targetChaider` | `חיידר` | 0 |
| `targetKtana` | `ישי"ק` | 450 |
| `targetGedola` | `ישי"ג` | 1100 |
| `targetKibbutz` | `קיבוץ` | 0 |
| `targetTiyul` | amount of gift 1 (aria-label `סכום למתנה הראשונה`) | 700 |
| `targetShayTotal` | amount of gift 2 (aria-label `סכום למתנה השנייה`) | 2000 |
| `gift1Name` / `gift2Name` | `שם המתנה` | `טיול` / `מתנה` |
| `gift1Enabled` / `gift2Enabled` | switch | true / true |
| `gift1Image` / `gift2Image` | `קישור לתמונה (URL)` | empty |
| `additionalRules` | `כללים נוספים לתקנון (יופיעו בתחתית מסך התקנון)` | empty |
| `expenseCategories` | chips in the `קטגוריות הוצאות` tab | `הדפסות, כנסים, סעודות, מתנות, תפעול, שונות` (line 11) |
| `purimManualSums` | `סכומי פורים` tab | `{}` |

Section heading in the UI: `יעדים ושנת פעילות` — `הסכומים שכל בחור צריך להגיע אליהם לפי שלב הלימוד`; sub-heading `יעד לפי שלב לימוד`; save button `שמור יעדים`.

Saving (`saveSettings`, lines 1760–1786): each target is `Number(input) || 0`; campaign year is the trimmed text or the default; gift names fall back to `טיול` / `מתנה` when empty.

Rules

- The yearly target of a member is decided only by the framework he is in for that year: חיידר → `targetChaider`, ישיבה קטנה → `targetKtana`, ישיבה גדולה → `targetGedola`, קיבוץ → `targetKibbutz` (`getHistoricalStatus`, lines 5549–5596). Shiur does not change the amount; it only positions the member on the progression (section 3).
- There is one set of targets, not one per year. The current numbers are applied to every past and future year. Changing a target in settings silently recomputes all historical debts (**Quirk Q1**).
- A target of 0 means "no yearly obligation" for that framework. With the defaults, חיידר and קיבוץ have no obligation.
- The server lets only an admin change settings (`security-update.sql` 104–110), everyone reads them.

One-time hack on startup (`loadState`, lines 2450–2453): if the locally cached `campaignYear` is exactly `תשפ"ה` it is replaced by `תשפ"ו` in the session cache. It is not written to the server and is overwritten by the server settings on load.

---

## 3. Framework / shiur progression and rollback for other years

Function: `getHistoricalStatus(currentType, currentShiur, currentYearStr, targetYearStr, settings)`, lines 5524–5597.

Purpose: the member card stores only his framework and shiur as of the campaign year. For any other year the code moves him backwards (or forwards) on a fixed ladder, one step per year, and takes the target of the framework he lands on.

The ladder (`progression`, lines 5527–5544), 16 steps, index 0–15:

| Index | Framework | Shiur | Target key |
|---|---|---|---|
| 0 | חיידר | (none) | chaider |
| 1–3 | ישיבה קטנה | א, ב, ג | ktana |
| 4–6 | ישיבה גדולה | א, ב, ג | gedola |
| 7–15 | קיבוץ | א, ב, ג, ד, ה, ו, ז, ח, ט | kibbutz |

Formula

1. Find the member's step today (lines 5565–5582):
   - חיידר → 0.
   - ישיבה קטנה: shiur `א` → 1, `ב` → 2, anything else (ג, empty, ד…, free text) → 3.
   - ישיבה גדולה: `א` → 4, `ב` → 5, anything else → 6.
   - קיבוץ: 7 + position of shiur in `א…ט`; unknown shiur → 7.
   - Any other framework value, including empty → 0, that is, treated as חיידר.
2. `diff = index(campaign year) − index(target year)` in the year list (line 5563). Past year → positive diff.
3. `historical step = today's step − diff`, clamped to 0…15 (lines 5584–5586).
4. Return `{type, shiur, target}` of that step, with the target taken from the current settings.

Fallback (lines 5554–5561): if either year label is not in the 16-label list, no rollback is done; it returns the member's stored type and shiur with that type's target (0 for an unknown type).

Code (the core):

```js
let diff = currIdx - targetIdx;
...
let histStageIdx = stageIdx - diff;
if (histStageIdx < 0) histStageIdx = 0;
if (histStageIdx > 15) histStageIdx = 15;
let histStage = progression[histStageIdx];
```

Verified examples (campaign year `תשפ"ו`, default targets):

| Stored today | תשפ"ב | תשפ"ג | תשפ"ד | תשפ"ה | תשפ"ו | תשפ"ז |
|---|---|---|---|---|---|---|
| ישיבה גדולה א | חיידר 0 | ישי"ק א 450 | ישי"ק ב 450 | ישי"ק ג 450 | ישי"ג א 1100 | ישי"ג ב 1100 |
| ישיבה גדולה ג | ישי"ק ב 450 | ישי"ק ג 450 | ישי"ג א 1100 | ישי"ג ב 1100 | ישי"ג ג 1100 | קיבוץ א 0 |
| ישיבה קטנה א | חיידר 0 | חיידר 0 | חיידר 0 | חיידר 0 | ישי"ק א 450 | ישי"ק ב 450 |
| קיבוץ א | ישי"ק ג 450 | ישי"ג א 1100 | ישי"ג ב 1100 | ישי"ג ג 1100 | קיבוץ א 0 | קיבוץ ב 0 |
| קיבוץ ט | קיבוץ ה 0 | קיבוץ ו 0 | קיבוץ ז 0 | קיבוץ ח 0 | קיבוץ ט 0 | קיבוץ ט 0 (clamped) |
| (no framework) | חיידר 0 | חיידר 0 | חיידר 0 | חיידר 0 | חיידר 0 | ישי"ק א 450 |

Edge cases handled

- Clamp at both ends: nobody goes below חיידר or above קיבוץ ט.
- Viewing a future year on the dashboard moves everybody forward one step per year (negative diff).
- The reference point is always the campaign year from settings (`buildMemberSummaries` passes `campaignYear`, line 5619), not the real calendar. So the stored framework and shiur are understood as "true for the campaign year".

Edge cases not handled

- No automatic promotion: when the campaign year is advanced in settings, the stored framework and shiur of each member are not advanced. Until somebody edits every member, the whole population is computed one step too low. No bulk "promote all" action exists (not found). **Quirk Q2.**
- The ladder is rigid: 3 years ישיבה קטנה, 3 years ישיבה גדולה, then קיבוץ. A member who skipped or repeated a year is rolled back wrongly, and there is no per-member correction.
- Empty shiur in ישיבה קטנה / גדולה is computed as the last shiur (ג), but the edit form pre-selects `א` for an empty shiur (`openMemberModal`, line 1506) — see **Quirk Q3**.
- The inline table edit lets the user type free text into shiur (`saveMembersEdit`, lines 3635–3667); anything that is not exactly `א` or `ב` is computed as ג.
- An unknown framework is silently computed as חיידר (never eligible, target 0).

Where the rolled-back values are shown: `currentYearType` and `currentYearShiur` on each summary (line 5726); the history modal column `מסגרת` (lines 1376–1377); the dashboard `מסגרות` panel and drill-downs (lines 3015–3019, 3068–3073).

---

## 4. Per-member yearly summary

Function: `buildMemberSummaries(selectedYear = getCampaignYear())`, lines 5608–5731. Cached wrapper for the campaign year: `getMemberSummaries()`, lines 109–116 (cache invalidated by `invalidateCache()` on every data change). Dashboard variant without married members: `buildActiveMemberSummaries(selectedYear)`, lines 5604–5606.

For each member:

1. `memberDonations` = donations whose `memberId` equals the member id (both trimmed strings) — line 5615.
2. `collectedThisYear` = sum of amounts of those donations with `year === selected year` — line 5616.
3. `collectedAmount` = sum of all his donations, all years — line 5617. It is computed and returned but used nowhere in the UI.
4. `currentYearTarget` = target of his rolled framework for the selected year (section 3) — lines 5619–5620.
5. Year map (`yearlyDataMap`, lines 5628–5656):
   - one entry for the selected year;
   - one entry for every year label that appears in his donations (label taken as `String(d.year)`), with its own rolled framework and target; `collected` accumulates the donations of that year;
   - gap filling (lines 5645–5656): for the known labels, every year between the earliest and the latest year in the map gets an entry with `collected = 0`. Only runs when at least two known years exist.
6. Past years = entries other than the selected year whose index in the year list is lower than the selected year's index, sorted old → new (lines 5659–5662).
7. Debt chain over the past years (section 5), then the selected-year numbers (section 6), eligibility (section 7), gifts (section 8).
8. `yearlyData` = all entries sorted newest first; unknown labels by Hebrew string compare (lines 5717–5722).

Returned fields: everything on the member plus `fullName` (`firstName + " " + lastName`), `currentYear`, `collectedThisYear`, `collectedAmount`, `currentYearTarget`, `currentYearType`, `currentYearShiur`, `totalDebtFromPast`, `openDebtNow`, `totalRequiredThisYear`, `missingAmount`, `isEligible`, `isEligibleTiyul`, `isEligibleShay`, `yearlyData[]` (each: `year`, `target`, `collected`, `historicalType`, `historicalShiur`, `debtIn`, `debtOut`, `requiredTotal`).

Consequences of the year-map construction

- The obligation history of a member starts at the earliest year in which he has any donation. Years before his first donation do not exist, so they create no debt.
- A member with no donations at all has no past years, therefore no debt, whatever his framework (verified, scenario 1).
- A year with no donation between his first donation and the selected year is filled in with `collected = 0` and therefore produces debt.
- A donation whose year label is empty or not in the list creates a pseudo-year that is treated as the oldest year (index −1), with the member's current framework target and no doubling (verified, scenario 8: one ₪100 donation with an empty year gave a ₪1,000 debt for a ישיבה גדולה member). **Quirk Q4.**
- If the selected year itself is not in the list (possible because the campaign year is free text), there are no past years at all and no rollback: debts vanish. **Quirk Q5.**

---

## 5. Cumulative debt and the doubled penalty

Lines 5658–5694.

Penalty start year (hard-coded): `const penaltyStartYear = 'תשפ"ד';` (line 5664). A shortfall of a past year is doubled when that year is `תשפ"ד` or later. Shortfalls of earlier years carry over at face value.

Formula, walking the past years from oldest to newest with a running debt that starts at 0:

- `debtIn` of the year = running debt.
- If the year's target is greater than 0:
  - `required = target + running debt` (stored as `requiredTotal`).
  - If `collected >= required`: the year is closed, running debt becomes 0. Any surplus is dropped, it is not carried forward as credit.
  - Otherwise:
    - the money first pays old debt: `debtPaidOff = min(running debt, collected)`;
    - what is left goes to this year's target: `remainingForTarget = max(0, collected − running debt)`;
    - `unpaidOldDebt = running debt − debtPaidOff`;
    - `targetShortfall = max(0, target − remainingForTarget)`;
    - `multiplier = 2` if the year is `תשפ"ד` or later, else 1;
    - `debtOut = unpaidOldDebt + targetShortfall × multiplier`; this becomes the running debt.
- If the year's target is 0 (exempt framework): `requiredTotal = 0`; anything collected that year reduces old debt: `debtOut = max(0, running debt − collected)`.

`totalDebtFromPast` = the running debt after the last past year (line 5694). It is the debt as of the start of the selected year.

Code:

```js
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
```

Properties (all verified by running the code)

- Only the shortfall of the year's own target is doubled. Old debt that stays unpaid is carried as-is; it is not doubled again each year.
- The selected year's own shortfall is not penalised while it is the selected year. It turns into doubled debt the moment a later year is selected or the campaign year is advanced.
- Exempt years (target 0, for example the rolled-back חיידר years or קיבוץ with target 0) create no debt.
- Worked example (scenario 3): ישיבה גדולה ב today, one ₪100 donation in `תשפ"ב`, nothing since.
  `תשפ"ב` (ישי"ק א, 450): shortfall 350, before the penalty era → debt 350.
  `תשפ"ג` (ישי"ק ב, 450): required 800, paid 0 → 350 + 450×1 = 800.
  `תשפ"ד` (ישי"ק ג, 450): required 1,250 → 800 + 450×2 = 1,700.
  `תשפ"ה` (ישי"ג א, 1,100): required 2,800 → 1,700 + 1,100×2 = 3,900.
  `תשפ"ו` (selected): target 1,100 + debt 3,900 = required 5,000.
- Worked example (scenario 5): ₪5,000 paid in `תשפ"ד`, nothing in `תשפ"ה` → the surplus does not help; `תשפ"ה` shortfall 1,100 × 2 = 2,200 debt.
- A late payment attributed to the missed year (the donation form has `שייך לשנת`, 4 years back) reduces that year's shortfall before doubling, so ₪1 attributed to the past year removes ₪2 of debt, while ₪1 attributed to the current year removes ₪1. **Quirk Q6.**

UI words for this: `חובות עבר (קנס)` (profile), `קנס` and `קנס: ₪X עובר הלאה` (history modal), `קנס מהעבר` (rules screen lookup), `חוב קודם` (drill-down column), `חובות עד שנה קודמת` (dashboard).

---

## 6. "Required" amount, gap, open debt now

Lines 5696–5704.

| Value | Formula | Line |
|---|---|---|
| `totalRequiredThisYear` ("נדרש", "סה״כ נדרש", table column `יעד`) | `currentYearTarget + totalDebtFromPast` | 5703 |
| `missingAmount` ("פער", "חסר", "פער להשלמה") | `max(0, totalRequiredThisYear − collectedThisYear)` | 5704 |
| `openDebtNow` | `max(0, totalDebtFromPast − collectedThisYear)` — this year's money pays old debt first | 5700 |
| selected-year entry | `debtIn = totalDebtFromPast`, `requiredTotal = target + debt`, `debtOut = openDebtNow` | 5697–5701 |

Where each is shown

- Members table (`renderMembersTable`, lines 3512–3525): `נאסף השנה` = collected; `יעד` = required (target + debt), `—` when 0; `פער` = gap, `—` when 0; `התקדמות` = `floor(collected / required × 100)` when required > 0, otherwise 100 if anything was collected, else 0; the bar is shown only when required > 0 and is clamped to 0–100.
- Profile (`loadMemberProfile`, lines 1211–1241): `סך הכל נאסף השנה` = collected; `יעד בסיס (השנה)` = base target; `חובות עבר (קנס)` = `openDebtNow`; `סה״כ נדרש` = required; `פער להשלמה` = `חסר ₪X` when gap > 0, else `עודף ₪X` when collected > required, else `הושלם בדיוק`; progress = `floor(collected / required × 100)` capped at 100, and 100 when required is 0.
- **Quirk Q7:** in the profile the debt box shows what is still open now, but `סה״כ נדרש` adds the full start-of-year debt. After a partial payment, base target + shown debt no longer equals the shown required.

---

## 7. Eligibility rules per framework, and the status badge

Lines 5705–5713. The framework used is the rolled one for the selected year (`currentStatusInfo.type`).

```js
// חיידר אינם בגיל מענק ולכן לעולם לא "עמדו ביעד"; קיבוץ נחשבים זכאים רק אם אין להם חוב פתוח מהעבר
let isEligible;
if (currentStatusInfo.type === "חיידר") {
  isEligible = false;
} else if (currentStatusInfo.type === "קיבוץ") {
  isEligible = totalDebtFromPast === 0;
} else {
  isEligible = currentYearTarget > 0 ? (collectedThisYear >= totalRequiredThisYear) : (totalDebtFromPast === 0 || collectedThisYear >= totalDebtFromPast);
}
```

| Framework that year | "עמד ביעד" (eligible) when |
|---|---|
| חיידר (and members with no / unknown framework) | never |
| קיבוץ | he has no debt from past years. This year's target and this year's collection are ignored. |
| ישיבה קטנה, ישיבה גדולה, target > 0 | collected this year ≥ base target + past debt |
| ישיבה קטנה, ישיבה גדולה, target = 0 | no past debt, or collected this year ≥ past debt |

Edge cases

- קיבוץ uses the start-of-year debt, not the open debt. A קיבוץ member who pays his whole old debt this year stays not eligible and keeps the badge `חוב פתוח` for the rest of the year (verified, scenario 7). **Quirk Q8.**
- A קיבוץ member with no past debt is eligible with ₪0 collected, even if `targetKibbutz` is set above 0. **Quirk Q9.**
- "Eligible" is a computed label only. The grant recipients list (section 17) is not connected to it: nothing checks eligibility when a groom is added, and a recipient is not linked to a member id.

Status badge (`getMemberStatus`, lines 1263–1270), first match wins:

| Order | Condition | Label | Tone |
|---|---|---|---|
| 1 | `isEligible` | `עמד ביעד` | success |
| 2 | rolled framework is חיידר | `חיידר` | neutral |
| 3 | `totalDebtFromPast > 0` | `חוב פתוח` | danger |
| 4 | collected this year > 0 | `בתהליך` | warning |
| 5 | otherwise | `טרם החל` | neutral |

Used in the members table (column `סטטוס`) and the profile badges.

---

## 8. The two configurable gifts

Settings: name, on/off switch, threshold amount, image URL for each of two gifts (section 2). UI group title: `מתנות ותוספות (הפעל / כבה לפי הצורך)`.

Rule (lines 5622–5625, 5714–5715):

```js
const isEligibleTiyul = gift1On && targetTiyul > 0 && collectedThisYear >= targetTiyul;
const isEligibleShay  = gift2On && targetShay  > 0 && collectedThisYear >= targetShay;
```

- A gift is "on" unless its flag is exactly `false` (`settings.gift1Enabled !== false`).
- Eligible for a gift = the gift is on, its threshold is above 0, and the member collected at least the threshold in the selected year.
- Only this year's collection counts, although the second key is named `targetShayTotal`.
- Gift eligibility ignores framework, debt, the yearly target and marital status. A חיידר boy or a member with open debt can be gift-eligible (verified, scenarios 7 and 11).

Where shown

- Profile badges: `זכאי ל{gift1Name}` (icon `directions_bus`) and `זכאי ל{gift2Name}` (icon `card_giftcard`) — lines 1206–1207.
- Rules screen (`renderRulesScreen`, lines 1837–1839): a card per gift that is on and has a threshold above 0, text `לאיסוף ₪X ומעלה`, with the image or the default icon. Section title `מתנות וזכאויות`.
- Rules-screen personal lookup (`takanonShowMember`, lines 1924–1930): `זכאי ל{name}`, or `{name}: חסר עוד ₪X` when the gift is on, the threshold is above 0 and collected is below it.
- Not shown in the members table or the dashboard. There is no list or export of gift-eligible members (not found).

---

## 9. Who counts as married, and what that changes

Rule (`isMemberMarried`, lines 5599–5601):

```js
return member.maritalStatus === "נשוי" || (member.notes || "").includes("התחתן");
```

A member is married when the status field is `נשוי`, or when the free-text notes contain the substring `התחתן` anywhere. The same test is written inline three more times (lines 2588, 3270, 3414).

Effects

| Place | Married members are | Lines |
|---|---|---|
| Dashboard KPIs `יעד כולל`, `חסר להשלמה`, `התקדמות כללית`, `עמדו ביעד השנתי`, `חובות עד שנה קודמת` | excluded (`buildActiveMemberSummaries`) | 2536–2542 |
| Dashboard alerts `קרובים לזכאות`, `חובות עד שנה קודמת`, `טרם התחילו גבייה` | excluded | 2578–2586 |
| Dashboard alert `פרטים חסרים בכרטיסי בחורים` and its drill-down | excluded | 2587–2591, 3268–3272 |
| Dashboard `מסגרות` panel and all member drill-downs | excluded | 3010, 3176 |
| Forecast of grants cost for the campaign year | excluded | 2945 |
| Dashboard KPI `נגבה השנה`, finance charts, income by year | included — donations are summed by year only, whoever the member is | 2531–2534, 2740–2746 |
| Members list | hidden unless the `נשואים` checkbox is ticked; ticking it adds them to the list (it does not show only married) | 3410–3416 |
| Profile, donation form member picker, rules-screen lookup, movements report | included (`getMemberSummaries`) | 1181, 1557, 1882, 3698 |
| Settings → `תקינות נתונים` counts | included (all members) | 2156–2162 |
| Print header of the members list | adds `כולל נשואים` when the checkbox is ticked | 5360 |

Edge cases

- Because the `פעילות אחרונה` list resolves names from the unmarried summaries only, a donation of a married member is titled `הפקדה כללית` there (lines 2967, 2973). The `נגבה השנה` drill-down falls back to the stored name snapshot instead (line 3201). **Quirk Q10.**
- The dashboard therefore mixes populations: collected includes married members' money, required and missing do not. The progress percentage is not affected (it is computed per unmarried member).
- No "marriage date" or "married in year" exists; a married member is excluded from the dashboard for every year, including past years when viewed.

---

## 10. Hebrew-year handling

### 10.1 The list of years

`HEBREW_YEARS_ORDER` (line 3746) — 16 labels in order, index 0 = 5775:

`תשע"ה, תשע"ו, תשע"ז, תשע"ח, תשע"ט, תש"פ, תשפ"א, תשפ"ב, תשפ"ג, תשפ"ד, תשפ"ה, תשפ"ו, תשפ"ז, תשפ"ח, תשפ"ט, תש"צ`

The same array is duplicated in `getPurimSumsYearsWindow` (line 2022) and `getHistoricalStatus` (line 5525). The list ends at `תש"צ` (5790); later years are unknown to every ordering, rollback and debt computation.

Ordering rule used everywhere: by index in this list. Labels not in the list are compared as Hebrew strings (`localeCompare(…, "he")`); in the grants year list known years come before unknown ones (`getSortedGrantYears`, lines 4050–4060).

### 10.2 Campaign year

`getCampaignYear()` (lines 5733–5735) = `settings.campaignYear` or `תשפ"ו`. It is free text in settings and is not validated against the list.

It drives: the default year of new donations and expenses; the members list, profile, rules lookup and history modal (always campaign year); the reference point of the rollback; which year counts as "forecast" in the grants cost; the movements report year filter; the default dashboard year; the Purim year windows.

### 10.3 Year pickers

| Picker | Content | Lines |
|---|---|---|
| Dashboard `שנת פעילות` | 8 hard-coded options `תשפ"ז` … `תש"פ` in `index.html` 118–125; initial value = campaign year if it is one of the options, otherwise the HTML default `תשפ"ו` | 2520–2529 |
| Donation / expense `שייך לשנת` | from 4 years before the campaign year to 1 year after it (6 labels), plus the record's own year when editing if it is outside; campaign year is labelled ` (שנת הקמפיין)` and is the default | 1519–1529 |
| Expenses summary `שנת ניתוח` | all years that have expenses (missing year shown as `כללי`), newest first, plus the campaign year | 3748–3761 |
| Grants `שנה` | years that exist in the archive, each with its recipient count; default = campaign year if present, else the latest | 4173–4194 |
| Settings `סכומי פורים` | campaign year and the 3 before it (4 columns) | 2021–2027 |
| Purim screen | the last 4 years ending at the campaign year; `כל השנים` shows 8 | 4959–4965 |

### 10.4 Real Hebrew date (Intl)

- `HEBREW_DATE_FMT` = `Intl.DateTimeFormat("en-u-ca-hebrew", {year, month: "long", day})` (line 5449). `getHebrewDateParts(date)` returns `{year, month, day}` with English month names (lines 5450–5457). Month names seen in this runtime: `Tishri, Heshvan, Kislev, Tevet, Shevat, Adar, Adar I, Adar II, Nisan, Iyar, Sivan, Tamuz, Av, Elul`.
- `hebrewYearNumberToLetters(num)` (lines 5464–5473): takes the year modulo 1000, writes hundreds, then 15 → `טו`, 16 → `טז`, otherwise tens and units, and inserts `"` before the last letter (a single letter gets `'`). 5786 → `תשפ"ו`, 5780 → `תש"פ`, 5790 → `תש"צ`.
- `getCurrentHebrewYearLabel()` (lines 5474–5477): label of today's Hebrew year.
- `hebrewYearLabelToNumber(label)` (lines 5479–5482): `5775 + index in the list`, or `null` for an unknown label.

### 10.5 New-year reminder

In `renderDashboardAttention` (lines 2595–2607). Shown as the first item of `דורש טיפול` when all are true: the user is an admin; today's Hebrew year label is in the list; its index is greater than the campaign year's index; the campaign year is in the list.

- Title: `השנה העברית התחלפה ל{hebrewNow}`
- Sub-text: `שנת הקמפיין בהגדרות היא {campaignYear}, ולכן הפקדות חדשות נרשמות אליה. לחיצה פותחת את ההגדרות`
- Click opens Settings → tab `יעדים ושנה` (`openDashboardDrill("new-year")`, line 3174).

Nothing changes automatically at the new year. The admin edits the campaign year by hand. (Today, 2026-11-10, is in `תשפ"ז`, while the code default is `תשפ"ו`.)

### 10.6 Hebrew half-years

`getHalfForDate(date)` (lines 5459–5463): months `Nisan, Iyar, Sivan, Tamuz, Av, Elul` → half `ב`; every other month (Tishri … Adar, including Adar I and Adar II) → half `א`. UI labels: `מחצית א' · תשרי–אדר`, `מחצית ב' · ניסן–אלול`. Verified: 2026-03-18 (29 Adar 5786) → א; 2026-03-19 (1 Nisan) → ב; 2026-09-12 (1 Tishri 5787) → א.

### 10.7 Months elapsed in the running year

`getMonthsForAverage(year)` (lines 3883–3895): if `year` is not today's real Hebrew year → 12. Otherwise count the days since 1 Tishri (walking back day by day, at most 400), and return `ceil((days + 1) / 29.53)` clamped to 1…12. Verified today (60th day of 5787) → 3.

### 10.8 Gregorian months

The monthly income chart groups by the Gregorian month of the donation date, labels `ינואר` … `דצמבר` (`renderChart`, lines 3335–3349), for donations whose year label is the campaign year. A Hebrew year spans two Gregorian years, so September–December of both ends fall into the same bars.

---

## 11. Date parsing, amounts, currency

### 11.1 `parseAppDate(val)` — lines 5430–5440

```js
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
```

Formats handled (verified):

| Input | Result |
|---|---|
| empty, `null`, `undefined` | `null` |
| a `Date` object | itself, or `null` if invalid |
| `2026-09-29`, `2026-9-5` (year-month-day with dashes, 1–2 digit month and day) | local date, no time-zone shift |
| `29/09/2026`, `29.09.2026`, `29.9.26`, mixed separators such as `1/2.2024` (day first; 2-digit year means 20xx) | local date |
| `2026-09-29T10:20:30.000Z` and other ISO date-times starting `YYYY-MM-DDT` | `new Date(str)` (time-zone aware) |
| surrounding spaces | trimmed first |

Not handled → `null`: `26-07-2023` (day first with dashes), `2023/07/26`, `2026-09-29 10:20` (space instead of `T`), 3-digit years, any Hebrew date text (`ח' ניסן`, `תשרי תשפ"ד`), month names.

No range validation: `31/02/2026` becomes 3 March 2026 and `00/00/2026` becomes 30 November 2025.

Comment in the code: `תאריך בלי שעה מפוענח לפי השעון המקומי (ולא UTC) כדי ש"היום" יהיה נכון גם אחרי חצות.`

### 11.2 Helpers built on it

| Function | Behaviour | Line |
|---|---|---|
| `dateKey(d)` | `YYYY-MM-DD` in local time, `""` for null | 5441 |
| `toDateInputValue(val)` | `dateKey(parseAppDate(val))`; an unparseable date gives an empty date input | 5442 |
| `compareDatesDesc(a, b)` | newest first; unparseable dates sort last | 5443–5446 |
| `formatDateDisplay(val)` | `DD/MM/YYYY`; if unparseable, the original text is shown as-is | 5489 |
| `formatArchiveDate(str)` | grants: `he-IL` `DD.MM.YYYY`-style date, the original text if unparseable, `—` if empty | 4155–4160 |
| `getTodayIsoDate()` | today, local, `YYYY-MM-DD` | 5488 |

What an unparseable date means in each computation

- Excluded from: the monthly income chart; the movements report for every filter except `כל התקופות`; the campaign-year grants-cost forecast (the donation is ignored when counting eligible members, line 2951); the half-year count of grooms (counted under "no date").
- Sorted last in every newest-first list.
- Still counted in every total that is by year label only (member collected, dashboard KPIs, income by year).
- Editing such a record: the date field opens empty, and saving writes today's date (`getValue("donation-date").trim() || getTodayIsoDate()`, lines 1565 and 1685). **Quirk Q11.**

### 11.3 Amounts

`parseAmount(v)` (lines 5422–5425): strips commas, `₪` and spaces; must be a finite number greater than 0; rounded to 2 decimals; otherwise `null` (the form then shows an error such as `יש להזין סכום גדול מ-0`). `1e3` is accepted as 1000. Zero and negative amounts cannot be entered through the forms.

`sumArray(arr, prop)` (line 5419): sum of `Number(x) || 0`.

`formatCurrency(value)` (lines 5484–5486): `₪` + `he-IL` number with 0 decimals. All money is displayed rounded to whole shekels although sums keep agorot (for example the default package cost 5,674.1 displays as `₪5,674`).

`formatCompactCurrency` (lines 2785–2790): below 1,000 as normal; otherwise `₪12.3K`, and from 100K up whole thousands (`₪123K`). Used on chart axes and narrow charts.

`sumNumbersFromString(str)` (lines 127–132) extracts every number in a text and adds them. It is defined and never called (dead code).

---

## 12. Dashboard

`renderDashboard` (lines 2520–2559). Selected year = the `שנת פעילות` picker, default campaign year.

### 12.1 KPIs

| KPI label (`index.html` 139–183) | Formula | Lines |
|---|---|---|
| `נגבה השנה` | sum of all donations with that year label (every member, including married and deleted members) + Purim manual sums of that year (section 16) | 2531–2534, 2545 |
| `יעד כולל` | sum of `totalRequiredThisYear` over unmarried members — base targets plus past debts and penalties | 2537, 2546 |
| `חסר להשלמה` | sum of each unmarried member's own gap (`missingAmount`). Comment: `מי ששילם יותר לא "מכסה" על מי שחסר לו` | 2539, 2547 |
| `עמדו ביעד השנתי` | number of unmarried members with `isEligible` | 2541, 2549 |
| `חובות עד שנה קודמת` | number of unmarried members with `totalDebtFromPast > 0` — a head count, not an amount | 2542, 2550 |
| `התקדמות כללית` | `getDashboardProgress` (2562–2566): `round( Σ min(collected, required) / Σ required × 100 )`, capped at 100; 0 when nothing is required. Surplus of one member does not count for another | 2540, 2548 |

`totalExpenses` for the year is computed on line 2535 and never displayed.

Note the mismatch: `נגבה השנה` includes Purim money and married members; `יעד כולל` and `חסר להשלמה` cover unmarried members only. So collected + missing ≠ target by design.

### 12.2 `דורש טיפול` — alerts and thresholds

`renderDashboardAttention` (lines 2578–2676). Items are built in this order and only the first 5 are shown (`items.slice(0, 5)`, line 2666). With all six present the expense item is dropped.

| # | Condition | Title | Sub-text | Value | Tone |
|---|---|---|---|---|---|
| 1 | admin, and the real Hebrew year is later than the campaign year (section 10.5) | `השנה העברית התחלפה ל{year}` | `שנת הקמפיין בהגדרות היא …` | the new year | warn |
| 2 | unmarried members who are not eligible and whose gap is above 0 and at most **₪500** (hard-coded, line 2584), sorted smallest gap first | `קרובים לזכאות` | first 3 names, then ` ועוד` | count | success |
| 3 | unmarried members with `totalDebtFromPast > 0` | `חובות עד שנה קודמת` | `לא כולל החובה של השנה שנבחרה` | sum of their past debt | danger |
| 4 | unmarried members with base target > 0 and collected exactly 0 | `טרם התחילו גבייה` | `בחורים עם חובה שנתית וללא הפקדה בשנה שנבחרה` | count | warn |
| 5 | unmarried members missing phone, yeshiva or framework | `פרטים חסרים בכרטיסי בחורים` | `טלפון, ישיבה או סוג מסגרת חסרים` | count | warn |
| 6 | expense alert of section 14.1 | `הוצאה חריגה: {category}` or `קטגוריית הוצאה מובילה: {category}` | see 14.1 | amount | danger / warn |

Empty state: `אין כרגע מה לטפל בו`.

### 12.3 `הכנסות לפי שנה`

`renderDashboardMonthBars` (lines 2751–2755): the last 3 entries of `getFinanceYears()` (section 13), income only, stacked `בחורים` + `פורים`, with a table `שנה | בחורים | פורים | סה"כ הכנסות`. Sub-title in the HTML: `שלוש השנים האחרונות: בחורים ופורים`. These are the last three years that have data, not necessarily consecutive, and the list is independent of the selected dashboard year.

### 12.4 `פעילות אחרונה`

`renderDashboardActivity` (lines 2963–3008): donations and expenses of the selected year, merged, newest first by parsed date, top 8. Donation title = member name from the unmarried summaries, else `הפקדה כללית`; expense title = description, else category, else `הוצאה`; expense amounts shown with a leading `-`.

### 12.5 `מסגרות`

`renderDashboardSegments` (lines 3010–3052): unmarried members grouped by the rolled framework of the selected year (`ללא מסגרת` when empty). Per group: `obligated` = members whose base target > 0; `reached` = of those, collected ≥ **base target** (past debt is ignored here, unlike eligibility). Only groups with at least one obligated member are shown, sorted by obligated then reached, descending. Text `{reached} מתוך {obligated} הגיעו לחובה`, percentage = `round(reached / obligated × 100)` capped at 100. With default targets only ישיבה קטנה and ישיבה גדולה appear.

### 12.6 Drill-downs

`openDashboardDrill(type, category)` (lines 3173–3333). Header kicker `נתונים אמיתיים מלוח הבקרה`, sub-title `שנת {year}`, a summary figure and the row count.

Member columns: `בחור | מסגרת | חובה | חוב קודם | נאסף | חסר` (base target, past debt, collected, gap). Progress columns: `בחור | מסגרת | חובה | חוב קודם | נאסף | התקדמות | מצב`, where progress = `round(collected / base target × 100)` limited to 0–999 and state = `הגיע לחובה` when base target > 0 and collected ≥ base target, else `עדיין חסר` (`buildDashboardMemberCells`, lines 3080–3099). Every member row has a `פתח כרטיס` button.

| Type | Title | Rows | Order | Summary figure |
|---|---|---|---|---|
| `collected` | `נגבה השנה` | four columns: `תאריך`, `בחור / מקור`, `פירוט`, `סכום`. Each donation of the year, then one row per Purim group with a sum > 0 (`פורים - {group}`, `סיכום ידני`) | donations newest first | donations + Purim |
| `target` | `יעד כולל` | members with required > 0 | required, high first | Σ required |
| `missing` | `חסר להשלמה` | members with gap > 0 | gap, high first | Σ gap |
| `eligible` | `עמדו ביעד השנתי` | eligible members | collected, high first | count |
| `debt` | `חובות עד שנה קודמת` (sub-title adds `לא כולל את חובת השנה שנבחרה`) | members with past debt > 0 | debt, high first | Σ past debt |
| `progress` | `התקדמות כללית` (sub-title `כמה מהחובה (כולל חובות עבר) כבר כוסה`) | members with base target > 0 | collected, high first | progress % |
| `near-goal` | `קרובים לזכאות` (sub-title `חסר עד ₪500`) | as alert 2 | gap, low first | row count |
| `not-started` | `טרם התחילו גבייה` | as alert 4 | name | row count |
| `missing-info` | `פרטים חסרים בכרטיסי בחורים` | four columns: `בחור`, `חסר`, `טלפון`, `ישיבה`. Unmarried members with something missing | most missing first | row count |
| `expense-category` | `הוצאות לפי קטגוריה: {category}` | four columns: `תאריך`, `קטגוריה`, `פירוט`, `סכום`. Expenses of the year in that category | newest first | Σ amount |
| `segment` | `מסגרת: {name}` | members of that rolled framework | reached first, then collected | `{reached} מתוך {obligated}` |
| `new-year` | (opens settings) | | | |

---

## 13. Income by year, outgoing, grants cost

### 13.1 Which years

`getFinanceYears()` (lines 2726–2736): every label of the year list, in order, that has at least one donation, or one expense, or Purim sums above 0, or is the campaign year.

### 13.2 A row per year

`buildFinanceRows(years)` (lines 2738–2748):

| Field | Formula |
|---|---|
| `members` (`בחורים`) | Σ donations with that year label |
| `purim` (`פורים`) | `getDashboardPurimTotal(year)` — section 16 |
| `expenses` (`הוצאות`) | Σ expenses with that year label |
| `grants` (`עלות מענקים`) | `getDashboardYearGrantCost(year, campaignYear).cost` |
| `income` | members + purim |
| `outgoing` | expenses + grants |

Series labels: `FINANCE_SERIES` (lines 2778–2783).

### 13.3 Grants cost of a year

`getDashboardYearGrantCost(year, campaignYear)` (lines 2765–2776). Package cost = the organisation's cost of one package for that year (`getGrantPackageTotal`, section 17.2), not the retail value.

- Campaign year → a forecast: `number of members who currently qualify × package cost`. Tooltip note `צפי לפי {N} זכאים השנה`.
- Any other year → actual: `number of recipients recorded for that year in the grants screen × package cost`, note `לפי {N} מקבלי מענק`; if there are no recipients or no package cost → 0, note `אין נתוני מענקים לשנה זו`.

The forecast count (`getDashboardGrantCostForMonth(year, 11)`, lines 2941–2961) uses its own test, not `isEligible`:

```js
return target > 0 ? collectedUntilMonth >= required : (oldDebt === 0 || collectedUntilMonth >= oldDebt);
```

where `collectedUntilMonth` sums only the member's donations of that year that have a parseable date (month index ≤ 11, which is always true).

Differences from `isEligible` (verified, section 23):

- חיידר members and members without a framework are counted when they have no debt (target 0 → `oldDebt === 0`), although `isEligible` is never true for them.
- קיבוץ members are counted by the same generic test.
- Donations with an unparseable date are ignored, so a member who paid in full with an undated donation is not counted.
- **Quirk Q12:** with the default targets (חיידר 0, קיבוץ 0) every unmarried חיידר and קיבוץ member without debt inflates the forecast by one full package.

### 13.4 Where shown

- Dashboard `הכנסות לפי שנה` (income mode, last 3 years).
- Movements report `גבייה מול הוצאות` — `לכל שנה: הכנסות (בחורים ופורים) מול הוצאות (כולל עלות המענקים)` — all years, compare mode (`renderReportFinanceChart`, lines 2758–2762), with a table `שנה | הכנסות | הוצאות | פער`, where `פער = income − outgoing`, shown as `עודף ₪X` when ≥ 0, else `גירעון ₪X` (lines 2862–2870). Tooltip lists each series and `סה"כ`.
- Y-axis: "nice" maximum from steps of 1, 2, 2.5, 5, 10 × a power of ten over 4 ticks (line 2808).

Which year is "forecast" depends on the campaign year, not on the year picked on the dashboard.

---

## 14. Expenses

### 14.1 Anomaly detection (dashboard alert)

`getDashboardExpenseCategoryAlert(currentYear)` (lines 2678–2723).

1. Take the expenses of the selected year; none → no alert.
2. Sum by category (missing category → `שונות`).
3. Previous year = the label just before it in the year list; sum its expenses by category the same way.
4. For each category of this year: `diff = this year − previous year`. Sort by diff, then by amount, descending.
5. "Unusual" = the first category with `diff > 0` **and** a previous-year amount above 0. Result: tone danger, title `הוצאה חריגה: {category}`, sub-text `עלתה מ-₪{prev} ל-₪{now}`, value = the increase.
6. If none: the largest category of the year (amount > 0). Tone warn, title `קטגוריית הוצאה מובילה: {category}`, sub-text `אין עליה מול {prevYear}, אבל זו הקטגוריה הגדולה השנה`, or `הקטגוריה הגדולה ביותר בשנה שנבחרה` when there is no previous year; value = its amount.

Edge cases

- There is no threshold or percentage: an increase of ₪1 is reported as "unusual" (verified: 999 → 1,000). **Quirk Q13.**
- A category that did not exist last year is never "unusual", however large (verified: a new ₪50,000 category was skipped in favour of a ₪1 increase).
- The comparison is full previous year against the year to date, so early in a year nothing is flagged and late in a year almost anything is.
- Only one category is reported (the biggest increase).
- Clicking opens the `expense-category` drill-down for that category.

### 14.2 Expenses summary screen

`renderExpensesKpisAndCharts` (lines 3769–3880), for the `שנת ניתוח` year.

| KPI (label) | Formula |
|---|---|
| `סה"כ הוצאות השנה` | Σ expenses of the year (a missing year counts as the pseudo-year `כללי`) |
| change line | `round((this − previous) / previous × 100)` + `% מאשתקד`, arrow up when ≥ 0; `אין נתוני השוואה` when there is no previous year or its total is 0 |
| `הקטגוריה הגדולה` | largest category, with `₪amount · share%` (share = `round(amount / total × 100)`) |
| `ממוצע חודשי` | total ÷ months, months from section 10.7 (12 unless the year is the real current Hebrew year); hint `{N} תנועות · לפי {M} חודשים` (`חודש` when 1) |
| `יחס מההכנסות` | `round(expenses / income × 100)`%, income = donations of the year + Purim sums; hint `מכל ₪100 שנאספו (כולל פורים), ₪{ratio} הלכו להוצאות`, or `אין הכנסות רשומות` |

Grants cost is not part of the expense total or the ratio on this screen.

Charts: doughnut `התפלגות לפי קטגוריה` (tooltip amount and share), bars `מגמה רב-שנתית` (total per year, selected year highlighted).

### 14.3 Category / detail / year table

`renderExpensesSummaryTable` (lines 3897–3984): a card per category (alphabetical), rows = distinct descriptions (missing → `כללי`), columns = years; a `סה"כ` row per category and a final card `סיכום כולל` / `סה"כ הוצאות`. Shows the last 5 years unless `הצג כל השנים` is toggled (`הצג פחות שנים` to go back). Zero cells show `—`. Rows are grouped by exact description text, so two spellings of the same supplier are two rows.

### 14.4 Categories

`getExpenseCategories()` (lines 2086–2089): the saved list, or the 6 defaults when empty. Add: no duplicates (`הקטגוריה כבר קיימת`). Remove: at least one must remain (`חייבת להישאר לפחות קטגוריה אחת`); existing expenses keep their category text and still appear in reports; when such an expense is edited its category is added to the dropdown for that edit (`populateExpenseCategorySelect(extraCategory)`, lines 2142–2150).

The static dropdown in `index.html` line 836 shows longer labels (`כנסים ואירועים`, `סעודות ואוכל`, `מתנות ופרסים`, `תפעול ופרסום`) but it is replaced at runtime by the plain category names.

New expense defaults: date today, year = campaign year, category = first in the list, `approvedBy` = the logged-in user's display name (lines 1683–1690).

---

## 15. Movements report and monthly chart

`renderDailyReport` (lines 3669–3744). Period options (`index.html` 381–388): `היום`, `אתמול`, `השבוע`, `השנה`, `כל התקופות (כל השנים)`, `תאריך ספציפי...`.

A record is listed when both tests pass:

- Date test (`isDateMatch`): `all` → always. Otherwise the date must parse, and: `today` → same day; `yesterday` → the day before; `week` → from Sunday of this week up to today; `custom` → equals the chosen date; `year` → any parseable date.
- Year test (`yearMatch`): `all` → always; every other period → the record's year label must equal the campaign year.

Totals: `הכנסות (איסוף)` = Σ listed donations; `הוצאות קמפיין` = Σ listed expenses. Both lists newest first. Member name = current name, or the stored snapshot if the member no longer exists.

Edge cases

- A donation entered today but attributed to another year is not shown under `היום`. **Quirk Q14.**
- `השנה` means "year label = campaign year and the date is parseable", not a date range.
- Purim sums and grants cost are not in these lists (only in the chart above them).

Monthly chart `הכנסות לפי חודש בשנת הקמפיין` (`renderChart`, lines 3335–3404): donations with the campaign-year label, grouped by Gregorian month of the parsed date; undated ones are left out.

---

## 16. Purim

### 16.1 Addresses and groups

`renderPurimGroups` (lines 4967–5163). Rows are grouped by `עיר` (missing → `ללא עיר`) and inside it by `קבוצה` (missing → `ללא שיוך`). Tabs show the group name and its number of addresses. Table columns: `מס'`, `משפחה`, `שם`, `רחוב`, `מספר`, `דירה`, one column per displayed year, `הערות`. The year cells are free text typed per address (what that address gave); the campaign-year column is highlighted. All cells except `מס'` are editable in edit mode; changed rows are saved one by one.

The per-address year cells are not summed anywhere. There is no computed group total (not found).

### 16.2 Per-group manual sums

Stored at `settings.purimManualSums[groupName][yearLabel]` as the typed value (a string).

- Edited only in Settings → `סכומי פורים` — heading `סכומים סופיים לקבוצות פורים`, help text `הסכום הסופי שנאסף לכל קבוצה, לפי שנה. מוצג לצפייה בלבד במסך כתובות פורים` (`renderPurimSumsSettings`, lines 2029–2083). Rows = group names from the addresses, sorted in Hebrew; columns = campaign year and the 3 before it. Only changed cells are written, merged into the freshest server copy (so two users do not overwrite each other). Button `שמור סכומים`.
- Shown read-only on the Purim screen as chips `סכומים סופיים` (4 or 8 years), `—` when empty (lines 5034–5038), and on the group print-out.
- Only an admin can save them, since they live in settings.

Purim total of a year: `getDashboardPurimTotal(year)` (lines 2568–2576) = sum over every group key of `Number(value) || 0`.

Used in: dashboard `נגבה השנה`; income by year (`פורים` series); the expenses `יחס מההכנסות`; the `collected` drill-down rows.

Edge cases

- The key is the group name only, not city + group. Two groups with the same name in different cities share one row of sums. **Quirk Q15.**
- The total iterates over all stored keys, so sums of a group that was renamed or no longer has addresses are still counted but can no longer be seen or edited in settings.
- Non-numeric text counts as 0.
- Purim money is never credited to a member; it does not affect any member's target, debt or eligibility.

---

## 17. Grants: archive, package value, recipients

### 17.1 Structure and defaults

`GRANTS_ARCHIVE` (lines 4001–4044) is a built-in skeleton: `perGroomValue: 8110.7`, `years: {}`, six legacy `payments`, and a default `package`. The comment says real personal data lives only in the database.

`mergeGrantsArchiveDefaults(saved)` (lines 4101–4124), used for every read:

- no saved archive → the skeleton;
- `package`: the saved top-level package is used only if at least one of its items has `storePrice` or `orgPrice`; otherwise the built-in package (verified);
- `payments`: saved array if present, else the six built-in ones;
- `years`: each saved year merged over the skeleton's.

`getGrantPackageForYear(archive, year)` (lines 4062–4065): the year's own `package` if it is an array, otherwise the top-level package. A year gets its own package the first time someone saves an edit for that year (`saveGrantsPackageEdit`, lines 4364–4377).

### 17.2 Package value

A package is a list of groups `{store, discount, items[]}`; each item `{name, qty, storePrice, orgPrice, value}`.

| Number | Formula | Function, lines |
|---|---|---|
| Quantity | missing / empty → 1; otherwise the number, and 0 stays 0 (comment: `כמות 0 היא באמת 0 (פריט שלא ניתן)`) | `pkgQty`, 4075–4078 |
| Item cost to the organisation (`value`) | `orgPrice × qty`, recomputed on save of the editor | 4367, 4385–4394 |
| Package cost to the organisation | Σ `value` over all items | `getGrantPackageTotal`, 4068–4072 |
| Package retail value (`שווי`) | Σ `storePrice × qty` | `getGrantPackageRetailTotal`, 4081–4085 |
| Explicit per-groom value | `year.perGroomValue` or `archive.perGroomValue`, else the package cost | `getGrantPerGroomValue`, 4087–4092 — defined, never called |

`discount` is a free-text label (`30%`, `15%`, `12%`); it is displayed (`הנחה 30%`) and never used in arithmetic. Prices are typed.

Built-in package (verified by running the code):

| Store | Discount label | Cost to organisation | Retail value |
|---|---|---|---|
| רויאל | 30% | 2,280.00 | 3,410.00 |
| רויאל | 15% | 1,863.10 | 2,240.70 |
| סטייל שיך | 12% | 440.00 | 500.00 |
| אווניו 13 | 15% | 391.00 | 460.00 |
| סאפרים | (none) | 700.00 | 1,500.00 |
| **Total** | | **5,674.10** | **8,110.70** |

The constant `perGroomValue: 8110.7` equals the retail total. The item `זיכוי לקניית מצעים` has quantity 0 and contributes nothing.

Screen figures (`renderGrantsArchive`, lines 4173–4211):

| Label | Formula |
|---|---|
| `שווי המענקים שניתנו השנה` | retail value of one package × number of recipients of the year |
| `שווי מענק לחתן` (also `שווי חבילה לחתן`) | retail value of one package |
| `מקבלי מענק` | number of recipients |
| per store group | `שווי ₪retail` and `עלות לארגון ₪cost` |
| per item | `שווי ₪(storePrice × qty)` and `עלות לארגון ₪value`; `×qty` shown when qty > 1 |

The retail value is the headline; the organisation cost is secondary on this screen but is the number used for the finance charts (section 13.3).

Editor (`ערוך תכולה` / `שמור תכולה`, lines 4322–4426): fields `שם החנות`, `הנחה`, and per item `מוצר`, `כמות לחתן`, `מחיר בחנות`, `עלות לארגון (ליחידה)`; add / remove item and store.

### 17.3 Recipients

Per year `recipients[]`, each `{name?, id?, phone?, date?, rid}` (lines 4470–4501). At least a name or an identity number is required (`יש להזין לפחות שם או תעודת זהות`). The name field can pick from the members list, which only copies the name and phone (lines 1126–1136); no member id is kept. `rid` is a generated id (`R-…`); older records without it are matched by all four fields (`sameRecipient`, 4449–4452). The table numbers rows by position; date shown via `formatArchiveDate`. When no recipient of the year has a name, a note is shown: `בשנה זו נרשמו המקבלים לפי תעודת זהות ותאריך בלבד (ללא שם) בקובץ המקור.`

Adding a year (`addGrantsArchiveYear`, lines 4561–4583): suggests the real current Hebrew year if it is not there yet, else the next year after the latest; free text is accepted.

Counting rule: the number of recipients of a year is simply the length of that list. The recipient's date is used only for the half-year split (section 18.2).

---

## 18. Grants: store expectation by half-year, store bills, legacy payments

View `תשלומים לחנויות` — `בכל מחצית משלמים לכל חנות לפי הקבלות על מה שמומש באותה מחצית`. Function `renderStoreBills(archive, year)` (lines 4707–4780), for the selected year and half (`state.billsHalf`, default `א`).

### 18.1 Cost per groom per store

`getStoreCostPerGroom(archive, year)` (lines 4683–4692): for each package group, by trimmed store name, Σ of item `value` (or `orgPrice × qty` when `value` is missing). Groups with the same store name are added together. Built-in package: רויאל 4,143.10, סטייל שיך 440, אווניו 13 391, סאפרים 700 (verified).

### 18.2 Grooms per half

`countGroomsByHalf(archive, year)` (lines 4695–4705): for each recipient, parse his date and convert to a Hebrew date.

- No date, unparseable date, or a Hebrew year different from the selected year → counted as `none`.
- Otherwise by month (section 10.6) → `א` or `ב`.
- If the year label is not in the year list, the year check is skipped.

Verified: of six test recipients, 1 → א, 2 → ב, 3 → none (no date, wrong year, Hebrew text date).

### 18.3 Expectation

- Per store: `expected = cost per groom in that store × grooms in the half`, shown in column `צפי לפי חתנים` on the first row of the store, only when both factors are non-zero; otherwise `—` (line 4731).
- Footer: `total expected = (Σ cost per groom over all stores) × grooms in the half` (line 4760).
- Footnote text (line 4779): `"צפי לפי חתנים" = {N} חתנים שקיבלו מענק במחצית הזו × עלות החבילה בכל חנות. בפועל משלמים לפי הקבלות, ולכן הסכום בדרך כלל נמוך יותר (תלושים שלא מומשו).` and, when relevant, ` {K} חתנים בלי תאריך בשנה הזו לא נכללו בצפי.`

### 18.4 Store bills

Stored at `years[year].storeBills[]`: `{bid, store, half, amount, reference, notes, paid, paidDate, method, receipt{path, name, size, uploadedAt}, createdAt, createdBy, updatedAt, updatedBy}` (`saveStoreBill`, lines 4858–4912).

Rules

- Store name required (`יש להזין שם חנות`); amount > 0 (`יש להזין סכום לתשלום גדול מ-0`).
- `half` is chosen by the user (`א` / `ב`); it is not derived from a date.
- When `שולם` is ticked: `paidDate` = chosen date or today, `method` one of `העברה` (label `העברה בנקאית`), `צ'ק`, `מזומן`, `אשראי`, `אחר`. When not ticked both are cleared.
- Receipt: optional PDF or image up to 10 MB, stored in the private bucket `receipts` under `bills/{bid}-{timestamp}.{ext}`; viewed through a signed link valid 600 seconds (`supabase-integration.js` 248–253); the old file is deleted after a successful replace or bill deletion.
- A store may have several bills in a half; rows are listed per bill.

Table (lines 4717–4755): one row per store of the package even with no bill (`טרם הוזן חיוב`, action `הזן חיוב`), plus stores that only appear in bills. Columns `חנות | צפי לפי חתנים | לתשלום לפי קבלות | מס' קבלה / חשבונית | סטטוס | קבלה`. Status: `ממתין לתשלום`, or `שולם ב-{date} · {method}`, or for a legacy payment `שולם · {original date text} · {method}` with the note `נרשם בשיטה הקודמת` (and the original store name in brackets when it was mapped).

Totals for the half (lines 4758–4776):

| Label | Formula |
|---|---|
| `לתשלום במחצית {half}' (לפי קבלות)` | Σ amounts of all bills of the half, including legacy payments assigned to it |
| `שולם` | Σ amounts of bills marked paid (legacy payments are always paid) |
| `נשאר לשלם` | `max(0, due − paid)` |
| footer `סה"כ מחצית {half}'` | expected, due, and `שולם ₪X · נשאר ₪Y` |

Store bills are not included in the expenses table or in the finance charts. The charts use the theoretical package cost × head count (section 13.3), never the real bills. **Quirk Q16.**

### 18.5 Legacy payments (the previous method)

Source: `getGrantPaymentsForYear(archive, year)` (lines 4094–4099) = top-level `payments` whose `year` matches + `years[year].payments`. Each: `{year, store, date (free text), description, method, amount}`.

Built-in ones (lines 4004–4011): רויאל `תשרי תשפ"ד` 39,835.95 (מזומן); סאפרים `26.07.2023` 9,360, `י"ג אדר ב'` 10,000, `ח' ניסן` 32,500 (העברה); אווניו 13 ביתר `ניסן תשפ"ד` 7,399.25 (תשלום); and for `תשפ"ו` אווניו 13 ביתר `אדר תשפ"ו` 6,236.

Identity: `legacyPaymentKey(p)` = `store|date|amount|description`, trimmed (lines 4610–4612).

Half of a legacy payment (`getLegacyPaymentHalf`, lines 4629–4635):

1. A saved manual choice in `years[year].legacyHalves[key]`: `א`, `ב`, or `none` (= explicitly unassigned).
2. Otherwise a guess (`guessLegacyPaymentHalf`, lines 4614–4627):
   - empty date → none;
   - if the text contains a Hebrew year (`/תש[א-ת]*["״][א-ת]/`, `״` normalised to `"`) different from the selected year → none;
   - text contains `אדר` → `א`; contains `אלול` → `ב`;
   - otherwise parse as a date; if its Hebrew year equals the selected year and the month is Adar / Adar I / Adar II → `א`, Elul → `ב`;
   - anything else → none.

Only Adar and Elul are auto-assigned, because those are the two settlement months. This matches the UI text `תשלום מאדר משויך אוטומטית למחצית א' ותשלום מאלול למחצית ב'`. Verified on the built-in payments: only `י"ג אדר ב'` and `אדר תשפ"ו` get `א`; the other four stay unassigned.

Store-name mapping (`matchLegacyStoreName`, lines 4638–4643): exact match with a package store; otherwise the longest package store name that is a prefix of the legacy name or the other way round (`אווניו 13 ביתר` → `אווניו 13`); otherwise unchanged.

Display

- Assigned legacy payments appear inside the half's table as paid bills with action `שיוך`.
- Unassigned ones appear in the panel `תשלומים שנרשמו בשיטה הקודמת` (`רשומות ישנות שעוד לא שויכו למחצית…`), columns `חנות / ספק | תאריך | הוצאה / חשבונית | אמצעי | סכום ששולם`, button `שייך למחצית`, footer `סה"כ לא משויך` = Σ unassigned amounts (lines 4295–4316). The panel is hidden when nothing is unassigned.
- Dialog `שיוך תשלום ישן למחצית`: `מחצית א'` (`תשרי–אדר`), `מחצית ב'` (`ניסן–אלול`), `לא משויך` (`להשאיר ברשימת התשלומים הישנים`) — `saveLegacyAssign`, lines 4667–4680.

Legacy payments cannot be added, edited or deleted in the UI (not found); only their half can be changed.

---

## 19. Data-integrity checks and input validations

### 19.1 Settings → `תקינות נתונים`

`renderDataHealth` (lines 2153–2182). Help text: `בחורים עם נתונים חסרים שעלולים לפגוע בדוחות ובזכאות`. Over all members, married included:

| Check (title) | Rule | Severity |
|---|---|---|
| `בחורים ללא סוג מסגרת (פוגע בזכאות וביעדים)` | `yeshivaType` empty after trim | bad |
| `בחורים ללא ישיבה` | `yeshiva` empty | warn |
| `בחורים ללא מספר טלפון` | `phone` empty | warn |
| `שמות כפולים אפשריים` | number of distinct `firstName + " " + lastName` (trimmed, exact) that occur more than once | warn |

A row with count 0 shows a green check. Clicking opens a fix dialog: framework → dropdown; yeshiva / phone → text + `שמור` (`applyHealthFix`, lines 2265–2288, value required, saved immediately, audit note `תקינות נתונים`); duplicates → groups with yeshiva and phone and `פתח פרופיל` (no merge function — not found).

Duplicates are by exact full name only. Father's name, phone and identity number are not compared.

### 19.2 Other missing-data signals

- Members table red `*` next to the first name with tooltip `חסר: …` for any of: `סוג מסגרת`, `ישיבה`, `טלפון`, `כתובת` (lines 3505–3511). Address is checked here only.
- Dashboard alert and drill-down `פרטים חסרים בכרטיסי בחורים`: phone, yeshiva, framework; unmarried members only (lines 2587–2591, 3266–3291).

### 19.3 Normalisation

`normalizeYeshivaType` (lines 2426–2430): `קטנה` → `ישיבה קטנה`, `גדולה` → `ישיבה גדולה`, trimmed; applied on load from the server, from cache, on backup import and on the health fix.

`isTrue` (lines 627–632) for permission flags: `true`, `1`, and the strings `TRUE`, `V`, `1`, `כן`, `Y`, `YES` (case-insensitive).

### 19.4 Form validations

| Form | Rule | Message | Lines |
|---|---|---|---|
| Member | first and last name required | `יש להזין שם פרטי ושם משפחה` | 1461 |
| Member | choosing חיידר hides and clears shiur | | 1407–1422 |
| Member phone | digits only, a dash after the third digit | | 1149–1158 |
| Donation | a member chosen from the list (id read from the trailing `[id]`) and amount > 0 | `יש לחפש ולבחור בחור מתוך הרשימה, ולהזין סכום גדול מ-0` | 1552 |
| Credit (נדרים פלוס) | member + amount > 0; confirmation number optional with a confirm dialog | `חובה לחפש בחור מתוך הרשימה ולהזין סכום ששולם (גדול מ-0)` | 1010–1021 |
| Expense | amount > 0 | `יש להזין סכום גדול מ-0` | 1681 |
| Store bill | store, amount > 0, file ≤ 10 MB | section 18.4 | 4864–4869 |
| Grant recipient | name or identity number | `יש להזין לפחות שם או תעודת זהות` | 4472 |
| Expense category | not empty, not duplicate, at least one remains | section 14.4 | 2101–2140 |
| Backup import | admin only; file must be JSON with a `members` array | `רק מנהל יכול לייבא גיבוי`, `הקובץ אינו קובץ גיבוי תקין` | 2338–2347 |

Not validated anywhere: the campaign-year text; year labels; date plausibility; duplicate donations; identity-number format; a recipient appearing twice or in two years.

### 19.5 Deletions

Member, donation and expense deletion: admin only, in the UI (lines 1589, 1708, 3581) and on the server (`security-update.sql`). Deleting a member leaves his donations (comment line 3577); they keep counting in yearly income and show under the stored name snapshot or `הפקדה כללית`. Each deletion has a 6-second `בטל פעולה` window (`UNDO_DELAY_MS`, line 329).

---

## 20. Other computed things

### 20.1 Members list

`renderMembersTable` (lines 3406–3534), always for the campaign year.

- City = the text after the last comma of the address (`address.split(',').pop().trim()`); with no comma the whole address is the "city". Used for the `עיר` column, filter and sort. Form hint: `כתובת (למשל: רחוב, עיר)`.
- Search: case-insensitive substring over first name, last name, father's name, full name, phone, phone digits only, yeshiva, framework, shiur, address, notes (line 3420).
- Filters: yeshiva, city (each dropdown is narrowed by the other filters), `ישי"ק` / `ישי"ג` checkboxes on the stored framework (not the rolled one), `נשואים`.
- Sort by column; numeric for collected / required / gap; address sorts by city; Hebrew string compare otherwise.
- Shiur column shows `---` for חיידר.
- Export to CSV takes the visible table, drops `no-export` columns and the `₪` sign, adds a BOM, file name `רשימת_בחורים_{date}.csv`.

### 20.2 Profile

`loadMemberProfile` (lines 1180–1259): header `{yeshiva or "ישיבה לא הוזנה"} | שיעור {shiur} ({framework})` (no shiur for חיידר); the four figures of section 6; donation list newest first with `{N} הפקדות · סה"כ ₪X` over all his years.

### 20.3 History modal `היסטוריית זכאות`

`openGrantStatusModal` (lines 1299–1391). Columns `שנה | מסגרת | יעד | נדרש בפועל | נאסף | סטטוס`, one row per entry of `yearlyData`, newest first; the campaign year carries the badge `השנה`.

- Banner when `openDebtNow > 0`: `חוב פתוח: ₪X` — `הסכום הנ"ל מתווסף ליעד השנה הנוכחית · השלמתו נדרשת לזכאות`.
- `מסגרת`: rolled framework + shiur + `'`.
- `יעד`: base target, `—` when 0.
- `נדרש בפועל`: `—` when the target is 0; with incoming debt: required and the sub-line `יעד ₪T + קנס ₪D`; otherwise required.
- `סטטוס`:
  - target 0 → `פטור מיעד`, plus `חוב ₪X ממתין` when debt remains after that year;
  - collected ≥ required and required > 0 → `עמד ביעד`, plus `כולל סגירת חוב` when there was incoming debt;
  - else, campaign year → `{round(collected / required × 100)}% הושלם`;
  - else → `חסר ₪{required − collected}`, plus `קנס: ₪{debtOut} עובר הלאה` when the outgoing debt is larger than the incoming one.
- Users without the `היסטוריית זכאות` permission (`canViewHistory`) see only the campaign-year row (lines 1310–1316).

Note: the `עמד ביעד` here is per year by amounts; it does not apply the חיידר / קיבוץ rules of section 7.

### 20.4 Rules screen `תקנון`

`renderRulesScreen` (lines 1790–1872): header `תקנון צדקת רבי שמעון` / `כללי גבייה, יעדים ומתנות` / `שנת {campaign year}`; four cards `יעדי גבייה לפי שלב` (חיידר, ישי"ק, ישי"ג, קיבוץ) with `יעד שנתי`, or `—` / `לא הוגדר` when 0; gift cards (section 8); the free text `כללים נוספים`; and `בדיקת מצב אישי` — a name search (substring on full, first or last name, up to 8 results) that shows for the member: `נאסף`, `יעד` (or `נדרש כולל` when there is debt) = required, `חסר` = `max(0, required − collected)` or `הושלם`, progress, gift badges, and when there is past debt the banner `קנס מהעבר: ₪D` — `יעד בסיס ₪T + קנס ₪D = נדרש ₪R` (`takanonShowMember`, lines 1901–1959).

The doubled penalty, the penalty start year, the קיבוץ rule and the חיידר rule are not written on the rules screen; they exist only in code. Only the free-text field can describe them.

### 20.5 Donations

- New donation: date today, year = campaign year (or the chosen `שייך לשנת`), `memberNameSnapshot` = full name at save time, credit adds the `(אשראי) ` notes prefix (lines 1563–1569).
- Credit flow: opens the נדרים פלוס page in a frame (`mosad=7011408`, line 1064), the user confirms the payment went through, then a donation is recorded with today's date, the campaign year, and notes `אשראי - נדרים פלוס | אישור עסקה: {number}`. Nothing is read back from the payment provider; the amount is typed by the user.
- Editing keeps id and `createdAt`; the member, year, amount and date can all be changed.

### 20.6 Identifiers

`generateId(prefix)` (line 5522): `{prefix}-{Date.now()}-{0…999}`; prefixes `M` member, `D` donation, `E` expense, `R` grant recipient, `B` store bill, `W` queued write.

### 20.7 Permissions that change what is computed

Five flags per user (`PERM_FIELDS`, line 2389): `הוספה ועריכה`, `הכנסות ופורים`, `הוצאות`, `מענקים`, `היסטוריית זכאות`; admin = `is_admin` or username `מנהל`.

Because the server filters rows (`security-update.sql`), the same formulas give different numbers to different users:

- without `הוצאות` no expenses are loaded → expense totals, the expense alert and the outgoing bars are 0 or absent;
- without `מענקים` the grants archive is not loaded → the built-in skeleton is used (default package, six legacy payments, no recipients), so the campaign-year forecast is computed with the default package cost 5,674.10;
- without `הכנסות ופורים` the Purim addresses are not loaded, but the manual sums live in settings (readable by all) and still count in `נגבה השנה`;
- donations and members are readable by every user (comment: needed for "collected this year").

### 20.8 Timers and limits

Idle lock: warning at 580 seconds, logout at 600 (lines 5774–5784). Undo window 6 seconds. Queued-write retry every 30 seconds. Audit log view: last 300 actions. Receipts ≤ 10 MB. Server paging 1,000 rows per request.

---

## 21. Quirks, inconsistencies and probable bugs

Each needs a decision for the new system: reproduce, or correct.

| # | What | Where |
|---|---|---|
| Q1 | One set of targets for all years. Changing a target rewrites every historical debt. No per-year target history. | 5549–5596 |
| Q2 | Advancing the campaign year does not promote members' framework / shiur. Until each card is edited, everyone is computed one step too low. No bulk promotion. | 5619; no promotion code |
| Q3 | Empty shiur is computed as the last shiur (ג) but the edit form preselects `א`; an empty framework preselects `ישיבה קטנה`. Closing the edit dialog with the X or by clicking outside it (auto-save, lines 1397–1405, 1466–1473) then silently writes these values, changing the member's ladder position and debts. A stored framework or shiur that is not one of the dropdown options (free text from the inline table edit) is blanked the same way. (Read from the code and standard browser behaviour of a select; not run in a browser.) | 1505–1506, 5567–5576 |
| Q4 | A donation with an empty or unknown year label becomes a pseudo "oldest year" with the member's current target and creates debt. | 5635–5662 |
| Q5 | The campaign year is free text. A label outside the 16-year list (typo, other quote character, any year after `תש"צ`) disables rollback and all debts, and breaks year ordering. The dashboard year picker is hard-coded to `תש"פ`–`תשפ"ז`. | 5554–5561, 5659–5662; `index.html` 118–125 |
| Q6 | Paying late but attributing the donation to the missed year halves the cost of the debt (the shortfall is reduced before doubling). | 5678–5684 |
| Q7 | Profile shows open debt after this year's payments, but "required" includes the full start-of-year debt; the three boxes do not add up after a partial payment. | 1213–1214 |
| Q8 | קיבוץ eligibility and the `חוב פתוח` badge use start-of-year debt; paying the debt this year does not make him eligible until next year. | 5710, 1267 |
| Q9 | קיבוץ with no past debt is eligible with ₪0 collected, even if a קיבוץ target is configured. | 5709–5710 |
| Q10 | Recent-activity list shows a married member's donation as `הפקדה כללית`. | 2967–2973 |
| Q11 | Editing a donation or expense whose stored date is not parseable replaces the date with today. | 1565, 1617, 1659, 1685 |
| Q12 | The campaign-year grants-cost forecast counts חיידר, no-framework and קיבוץ members without debt as recipients, and ignores undated donations — a different rule from `isEligible`. | 2941–2961 |
| Q13 | "Unusual expense" has no threshold: any increase above last year's total for a category, even ₪1; new categories are never flagged. | 2703 |
| Q14 | Movements report: a donation made today for another year is hidden under `היום` / `אתמול` / `השבוע` / custom date. | 3694–3700 |
| Q15 | Purim sums are keyed by group name only; same-named groups in different cities share sums; sums of removed groups keep counting invisibly. | 2050, 2568–2576 |
| Q16 | Finance charts use theoretical grants cost (package cost × head count); real store bills are never part of expenses or of the charts. | 2765–2776 |
| Q17 | Dashboard populations differ: collected includes married / deleted members and Purim; required and missing include only unmarried members. | 2531–2542 |
| Q18 | `מסגרות` panel and drill-down "reached" compare collected with the base target only, ignoring past debt, while `עמדו ביעד` requires the debt too. Two different "reached" definitions on one screen. | 3027, 3084 |
| Q19 | "Married" is also triggered by the substring `התחתן` anywhere in the notes (for example "לא התחתן"). | 5600 |
| Q20 | Debt history starts at the first year with a donation; a member who never donated has no debt at all, however old. | 5645–5662 |
| Q21 | Expenses with no year are grouped as `כללי` for the selected year but previous-year comparison uses the raw label. | 3775–3777 |
| Q22 | Unused code: `collectedAmount`, `totalExpenses` (dashboard), `getGrantPerGroomValue`, `perGroomValue`, `sumNumbersFromString`, `dashboardJsString`, `paymentProducts`. | 5617, 2535, 4087, 127, 3060, 4112 |
| Q23 | Three copies of the year list and four copies of the married test; the lists end at `תש"צ`. | 2022, 3746, 5525; 2588, 3270, 3414, 5600 |
| Q24 | All money is displayed rounded to whole shekels while sums keep agorot; totals can look off by ₪1. | 5484–5486 |
| Q25 | Inline table editing accepts free text in shiur; only exact `א` / `ב` are recognised. | 3635–3667 |
| Q26 | Grant recipients are not linked to members or to eligibility; the same person can be added twice. | 4470–4501 |

---

## 22. Not found

Looked for and absent in the old code:

- Per-year target history, or a target per shiur.
- A stored debt, a debt payment record, debt forgiveness / waiver, or a per-member exemption or override of target, debt or eligibility.
- Automatic yearly promotion of framework / shiur, or a "close the year" process.
- A member join year or start year (`createdAt` is not used in calculations).
- A marriage date, or a rule that links marriage to the grant.
- A link between a grant recipient and a member record; an eligibility check when adding a recipient; a grant status per member.
- A list or export of gift-eligible members; a record that a gift was handed out.
- Any sum of the per-address Purim year cells; a link between Purim money and members.
- A budget, a planned-expense figure, or a percentage threshold for expense anomalies.
- A cash balance, opening balance, or carry-over between years.
- Receipts for donations, donor records (the donor name is free text in notes), or a payment-method field.
- Reading results back from נדרים פלוס.
- Editing / adding / deleting legacy grant payments in the UI.
- Merging duplicate members.
- Any server-side calculation: the SQL holds tables, permissions and the audit log only.

---

## 23. Verification runs

The pure functions were extracted from `script.js` as text and executed with Node against synthetic data (scripts kept outside the repository, in `/tmp/claude-0/-home-user/23f26262-7397-509f-9a5e-29915b59e94f/scratchpad/proto/old-study-tools/`). Campaign year `תשפ"ו`, default targets (ישי"ק 450, ישי"ג 1100, חיידר 0, קיבוץ 0, gifts 700 / 2000).

| # | Scenario | Result |
|---|---|---|
| 1 | ישיבה גדולה ב, no donations | target 1,100; debt 0; required 1,100; status `טרם החל` |
| 2 | same, ₪500 in `תשפ"ג` only | `תשפ"ג` closed (surplus dropped); `תשפ"ד` 450×2 = 900; `תשפ"ה` 900 + 1,100×2 = 3,100; required now 4,200; `חוב פתוח` |
| 3 | same, ₪100 in `תשפ"ב` only | debts 350 → 800 → 1,700 → 3,900; required now 5,000 |
| 4 | ₪200 in `תשפ"ה`, ₪3,000 in `תשפ"ו` | debt 1,800 (900×2); required 2,900; collected 3,000 → eligible, both gifts, open debt 0 |
| 5 | ₪5,000 in `תשפ"ד`, ₪1 in `תשפ"ו` | surplus not carried; `תשפ"ה` → 2,200 debt; open debt now 2,199 |
| 6 | קיבוץ א, ₪100 in `תשפ"ד` | `תשפ"ד` (ישי"ג ב) 1,000×2 = 2,000; `תשפ"ה` 2,000 + 2,200 = 4,200; target 0, required 4,200, not eligible |
| 7 | same + ₪5,000 this year | gap 0, open debt 0, still not eligible, badge `חוב פתוח`, both gifts earned |
| 8 | ישיבה גדולה ב, ₪100 with an empty year | pseudo-year, shortfall 1,000 at ×1 → debt 1,000 |
| 9 | no framework, ₪5,000 this year | computed as חיידר: target 0, not eligible, badge `חיידר`, both gifts earned |
| 10 | view `תשפ"ז`, ₪100 in `תשפ"ו` | rolled forward to ישי"ג ג; `תשפ"ו` shortfall 1,000×2 = 2,000 debt |
| 11 | חיידר, ₪2,500 this year | not eligible, both gifts earned |
| 12 | ישיבה קטנה א, ₪50 in `תשפ"ד` | `תשפ"ד` and `תשפ"ה` are חיידר years (target 0) → no debt |
| 13 | ישיבה גדולה ג, ₪1 in `תשפ"ב` | 449 → 899 (×1 years) → 3,099 → 5,299 (×2 years); required 6,399 |

Other checks: Hebrew year letters for 5775–5790 match the list and 5791+ fall outside it; half-year boundaries; all date formats of section 11.1; `parseAmount`; built-in package totals (5,674.10 cost, 8,110.70 retail); legacy half guesses; store-name mapping; the expense alert with a ₪1 increase versus a new ₪50,000 category; the grants forecast counting 4 "eligible" where the KPI counts 3; grooms per half; `pkgQty`; `isTrue`; `normalizeYeshivaType`.
