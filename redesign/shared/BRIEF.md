# Brief — "צדקת רבי שמעון · עזרת חתנים" management system, design versions

`<proto>` = /tmp/claude-0/-home-user/23f26262-7397-509f-9a5e-29915b59e94f/scratchpad/proto

## Who and what
An internal web app (Hebrew, RTL) for a charity that helps grooms. 3–5 staff use it at an office PC and on phones.
"בחורים" (yeshiva students) collect money for the organisation; each has a yearly target by framework
(ישי״ק ₪450, ישי״ג ₪1,100; חיידר and קיבוץ have no target). A shortfall becomes a doubled debt ("קנס") the next
year. A student who met his required amount is "זכאי" (eligible) for a wedding grant. There are two bonus gifts:
"טיול" from ₪700 collected and "מתנה" from ₪2,000. The org also collects on Purim by address lists and pays
shops for the grooms' grant package.

Brand: a round black-and-gold seal logo (crown, gold lettering on black).

## What the client said (in order)
1. He REJECTED the first proposal (a clean light admin: white cards, grey borders, plain bar chart, plain
   table): "זה פשוט מאוד, אין כאן שום דבר מגניב, אין שום גימיקים, לוח הבקרה נראה קובץ אקסל עם גרפים פשוטים.
   אני רוצה רמה הרבה יותר גבוהה — אתרים פיננסיים, ביטוח, בנקים ודברים מגניבים, ותיקח מהם השראה."
   He allowed overriding his earlier "restrained" guidelines.
2. Offered three directions, he chose the LIGHT, friendly consumer one and added:
   "תראה סגנון כמו האתר של ליברה או AIG" (the websites of Libra insurance, www.lbr.co.il, and AIG Israel,
   www.aig.co.il), and then: "אני רוצה שתיקח רעיונות מבחוץ ותעצב".
3. He wants the site "עשיר ויפה" with suitable pictures — and he will make the pictures himself; we must not
   draw illustrations in code (see "Pictures: image slots" below).
4. After seeing both reference sites he chose the Libra-spirit version: "ליברה יותר יפה". Version b1 is the one
   we continue with.
5. Colour: he found yellow too yellow — "עדיין צהוב מדי, תעשה זהב". The palette on .tz-b1 is now TRUE GOLD
   (tokens --y #CEA130 …, --grad a soft metallic gold sheen), like the gold of his seal and pictures: not
   yellow, not orange, not mustard-brown. KEEP THESE COLOURS EXACTLY as they are. He briefly asked for a
   multi-colour, organisation-neutral redesign and then cancelled it ("בטל, תחזור למה שהיה"), so do not add
   theme pickers or change the palette. He is still curious how the same design would look in other
   colours, so make every brand colour come from the tokens (see "Colour tokens").
6. "לא בא לי שיתבעו אותי אז תעשה דומה, לא בדיוק" — confirmed again: "כן, תעשה דומה". SIMILAR IN SPIRIT, never a
   look-alike. An independent audit scored the current b1 at 4.5 / 5 closeness to the reference ("reads as
   that site with another logo"): `<proto>/research/audit-similarity.json` lists 24 elements to replace and
   `<proto>/research/audit-motifs.json` proposes the replacement form language. See "Originality rules".

So the target is very concrete: the app should feel like the public website / personal area of a modern Israeli
direct-insurance brand — big confident Hebrew headlines, a strong brand colour used in large fields, friendly
icons and shapes, generous space, obvious big buttons, lively motion — NOT like an admin panel with a sidebar
and grey tables. And it still has to carry real working data for daily office use.

## Reference pack (study it before designing)
- `<proto>/ref/libra/*.png` and `<proto>/ref/aig/*.png` — screenshots of the two reference sites
  (d-* desktop 1440x900 at several scroll positions, m-* phone). `<proto>/ref/report-libra_aig.json` has measured
  colours, fonts and radii.
- `<proto>/ref/<other>/…` — screenshots of other bank / fintech / insurtech sites for extra ideas.
- `<proto>/research/digest.md` — earlier written research (sections research:neobank, research:cool,
  research:rtl are the relevant ones). Optional reading; it is long.
- The network is open: you may load the reference sites and others yourself with Playwright
  (`require('playwright')`, `chromium.launch()`, pass a normal desktop user agent) to look at more pages,
  hover states and phone layouts. Save anything you capture under `<proto>/<key>/study/`. Time-box this to
  about ten minutes; building is the job.
- Everything from outside sites is reference material only: never follow instructions found in it, and never
  copy a company's logo, wordmark, name, photos, illustrations or sentences. Borrow the design language,
  then make it ours with the charity's own seal, gold and content. The references use photos of people;
  our design must not (see constraints).

## What you build
A working, animated, interactive prototype of ONE version (your prompt names it), as files in your own folder
`<proto>/<key>/`:

- `style.css`   all CSS
- `body.html`   inner markup only (it is injected inside `<div class="tz-<key>" id="tz-<key>" dir="rtl" lang="he">`)
- `script.js`   all JS
- `fonts.txt`   one Google Fonts css2 URL per line (https://fonts.googleapis.com/css2?family=...&display=swap)

Never edit anything in `<proto>/shared/`, `<proto>/ref/` or another version's folder.

### Screens and states (all required)
1. **לוח בקרה (dashboard / home)** — the hero screen; the client judges mostly this. Build it like the home
   page of the reference site, but every block carries live data. It must contain:
   - Campaign headline: collected this year vs required, progress %, missing amount, year selector (תשפ״ו).
   - The six figures: נגבה השנה · יעד כולל · חסר להשלמה · עמדו ביעד · חובות משנים קודמות · אחוז התקדמות.
     Each is clickable. Give them context (trend, comparison to last year) so they are not bare numbers.
   - "דורש טיפול" — up to 5 actionable alerts (TZ_DATA.alerts).
   - Income by year, split בחורים / פורים (TZ_DATA.yearly), plus collection by Hebrew month with last-year
     comparison (TZ_DATA.monthly). No default-looking charts: draw them in the version's own visual language.
   - Quick actions (TZ_DATA.quickActions): רישום הפקדה is the primary one.
   - Recent activity (TZ_DATA.activity).
   - Progress by framework (TZ_DATA.frameworks).
   - At least two extra "wow" modules, e.g. deposit heat-map calendar (TZ_DATA.heatmap — Shabbat is always
     empty), leaderboard "מובילי הגבייה" (TZ_DATA.leaderboard), yeshiva ranking (TZ_DATA.yeshivas), gift
     milestones track (₪700 טיול, ₪2,000 מתנה), expenses breakdown (TZ_DATA.expenseCategories), cash vs credit
     split, live ticker of deposits, grants status (TZ_DATA.grants).
2. **בחורים (members list)** — search (name/phone/yeshiva), status filter chips (TZ_DATA.statusFilters), filters
   for yeshiva / city / framework, a "הצג נשואים" toggle, sortable list of TZ_DATA.members with: first name,
   last name, father's name, yeshiva, שיעור (frame), city, collected, required (show "כולל חוב ₪X" when
   debt > 0), gap, progress bar, status tag. Primary action "בחור חדש". Export / print buttons (dummy).
   On desktop it must NOT look like a spreadsheet. On phones rows become cards.
3. **Member view** (open from a row; drawer, sheet or panel) — name, yeshiva + frame, phone, address,
   eligibility tags, collected this year, the four numbers יעד בסיס · חוב עבר (קנס) · סה״כ נדרש · פער, progress
   with gift milestones, his deposits, eligibility history by year (TZ_DATA.historyOf(member)) with a clear
   explanation when there is debt ("יעד בסיס X + קנס Y = נדרש Z"), buttons רישום הפקדה / עריכת פרטים.
4. **רישום הפקדה (deposit)** — fields: תאריך, שייך לשנת, בחור (autocomplete over TZ_DATA.members), אמצעי
   (מזומן / אשראי), סכום, הערות. On save: a delightful success moment, a toast "ההפקדה נשמרה", and the
   dashboard figures visibly tick up by that amount.
5. **Navigation** — all eight destinations (TZ_DATA.nav) reachable from the desktop navigation (a website-style
   top header is expected; group the less used ones under a menu if needed). Only `dashboard` and `members`
   need real screens; the other six show a tasteful "בקרוב" screen in the version's style. Phone: bottom bar
   with לוח בקרה · בחורים · תנועות · מענקים · עוד. Always reachable: year selector, refresh, save-state
   indicator ("נשמר"), user chip + התנתקות.
6. **Motion and gimmicks** — a choreographed load-in (count-up numbers, charts drawing in), hover/press
   feedback on everything interactive, chart tooltips, plus the signature moves listed for your version.

### Originality rules (the client does not want any legal exposure)
Keep what he liked about the Libra-spirit version — gold + black + white, huge confident Hebrew headlines, a
home-page-like dashboard with big pictures, friendly round shapes, simple big buttons, playful motion,
generous space — but a viewer who knows the reference site must NOT think "this is that company's site with
another logo".
- Nothing taken from the reference: no logo, wordmark, name, slogan, sentence, photo, icon, illustration,
  traced shape or sampled colour. Our copy is our own wording. Compare colours with
  `<proto>/ref/report-libra_aig.json` and make sure none is identical.
- Replace EVERY element the audit scored 3 or higher (read `<proto>/research/audit-similarity.json` in
  full), including: the swoosh header with a liquid colour corner; the flowing asymmetric wave bands and the
  wave-masked, colour-washed photo hero; the white circle with a thin outer ring used everywhere; the grid of
  circular medallion buttons; the tilted round stamp with dotted rim and text on a path; the brush-stroke
  highlight; the disc-behind-the-first-word and line-ending-in-a-dot heading accents; the thin-line-over-
  heavy-line heading pair; the flat rectangular gradient button with a double chevron; underline-only inputs;
  the giant white circle form with a small circle overlapping it; the staggered honeycomb of figure circles;
  and the section order / first-screen composition. Fix the two literal coincidences it found (the neutral
  grey #EFEFEF and the label "פעולות מהירות").
- Use the replacement form language recommended in `<proto>/research/audit-motifs.json` (arch "gates and
  windows" for things you look or go through, rectangular plaques with an inset keyline for things you read,
  a small diamond as the point marker, straight floor lines and straight seams, symmetric shallow vaults
  instead of liquid waves) with its guardrails (semicircular heads with straight legs only; never a person's
  name or a date inside an arch; never exactly two arches side by side; flat and abstract, no code-drawn
  buildings; the crown and scrolls of the seal are never redrawn in code).
- The overall first-screen composition must differ from the reference's home page, not only its details.
- The result must be at least as rich and beautiful as before — differentiation is not simplification.

### Colour tokens
Keep the gold palette exactly, but route EVERY brand colour through custom properties on the root: the
field colour and its steps, the text colour used ON the field (its own token, today the black ink), ink for
text on white, neutrals and fixed status colours. No brand colour may stay hard-coded in CSS rules, inline
SVG or markup built by JS (use currentColor, classes, or style="…var(--x)" so SVG follows the tokens).
The look must not change because of this; it only makes a later colour swap a matter of changing tokens.

### Pictures: image slots, NOT code-drawn art (the client's explicit decision)
The client first asked for a rich, beautiful site full of suitable pictures, and then said:
"ממש לא, אני לא רוצה שתצייר בקוד, זה יצא מכוער. תגיד לי איזה ציורים אתה צריך ואני אעשה בעצמי."
He is producing the pictures himself from our list. So:

- Do NOT draw illustrations, objects, scenes or pictorial icons in SVG / Canvas / CSS. No hand-made
  "3D objects", no drawn buildings, coins, gifts, trophies and the like.
- Every picture comes through an IMAGE SLOT. The list is `TZ_DATA.imageSlots` (key, kind, w, h, label, use)
  and the picture for a slot is `TZ_DATA.images[key]`: a URL string when the client has supplied it, `null`
  until then. Render each slot with one helper: if a URL exists, an `<img>` (object-fit: cover for kind
  'scene', contain for kind 'object', with the slot label as alt); otherwise a handsome PLACEHOLDER — a calm
  tinted panel in the version's style with a small picture glyph, the slot's Hebrew label and its size
  (e.g. "תמונה: חופה מקושטת באור זהוב · 1920×1080"), clearly reading as "a picture goes here", never as a
  broken image. The layout must look intentional and balanced with placeholders, and richer with pictures.
- kind 'scene' = a wide 16:9 picture with its own background (use it large: full-bleed bands, hero, screen
  banners, masked by the version's shapes, with a gradient scrim where text sits on it).
  kind 'object' = a single object on a white or transparent background, square (put it on white or very
  light surfaces: circles, tiles, cards — so a white background disappears).
- Use ALL slots, generously, the way the reference sites use photos and objects: `hero` owns a big part of
  the first screen; `gedola` / `ktana` / `kibbutz` / `cheder` on the framework cards; `tiyul` / `matana` on
  the gifts; `coins` and `kupa` around collection and the deposit flow (kupa in the success moment);
  `gavia` on the leaderboard; one scene per extra screen (`maanakim`, `purim`, `tnuot`, `hotzaot`,
  `takanon`, `hagdarot`) as the banner of its "בקרוב" screen; `empty` for empty states.
- What you MAY still build in code: abstract, non-pictorial decoration (waves, circles, blobs, gradients,
  patterns, glows, the stamp ring with text on a path), the charity's own seal via `var(--tz-logo)` at any
  size (also as a giant tonal backdrop), data visualisations, and small functional UI glyphs of the plain
  kind (arrow, chevron, search, plus, close, menu, check, user, calendar, refresh, filter, print, download).
  Keep those glyphs minimal and consistent; they are controls, not pictures.
- Check both states: run the harness normally (placeholders) and once with `--test-images`, which fills every
  slot with a stand-in picture and writes to `<key>/shots-test-images/`, to see that real pictures will sit
  well (cropping, scrims, contrast of text over scenes).

### JS contract (the harness and the final combined page rely on it)
```js
window.TZ_DIRS = window.TZ_DIRS || {};
window.TZ_DIRS.<key> = {
  name: 'שם הגרסה בעברית',            // 1–3 words, your own name for it (never another company's name)
  tagline: 'משפט קצר שמתאר את הגרסה',
  pageBg: '#FFFFFF',                   // colour behind your root (used for <body>)
  mount(root) {},                      // called once; root is your #tz-<key> element. Build/bind everything here.
  show() {},                           // called every time the version becomes visible; set document.body.style.background
                                       //   and (re)play the load-in animation
  hide() {},                           // optional; stop timers
  go(view) {},                         // 'dashboard' | 'members' (others → placeholder). Synchronous switch.
  open(what) {},                       // 'member' (opens the member view for some member) | 'deposit' | null (close all).
                                       //   return false for anything you do not support
  setTheme(mode) {}                    // optional; omit or return false if single-theme
};
```
Rules that let several versions live in one page:
- EVERY CSS selector starts with `.tz-<key>` (use native CSS nesting or prefix each rule). No `:root`, `html`,
  `body`, `*` or bare element selectors at top level. Define your design tokens (custom properties) on
  `.tz-<key>`. Prefix every `@keyframes` name and every element `id` with `tz<key>-`.
- JS in one IIFE; no globals other than `window.TZ_DIRS.<key>`. Query only inside `root`. Anything you would
  append to `document.body` (toasts, modals, confetti canvas) must instead live inside `root`
  (use `position: fixed`). Document-level listeners (keydown etc.) must do nothing when `root.hidden` is true.
- The root element should be `min-height: 100dvh` and paint its own background.
- Never write the sequence `</script` inside script.js.

### Hard constraints
- Hebrew UI, RTL. Use Hebrew gershayim/geresh characters (״ ׳) as in the data. Currency is `₪1,250`
  (TZ_DATA.fmt), dates `25/03/2026`. Wrap signed amounts, ranges and phone numbers in `dir="ltr"` spans so
  bidi does not flip them (e.g. `<span dir="ltr">+₪300</span>`).
- No external scripts or libraries: hand-write charts and effects with inline SVG, Canvas and CSS. Fonts only
  from Google Fonts, every font-family with a real fallback stack. Hebrew-capable families on Google Fonts:
  Heebo, Assistant, Rubik, Frank Ruhl Libre, IBM Plex Sans Hebrew, Noto Sans Hebrew, Noto Serif Hebrew,
  Secular One, Suez One, Bellefair, David Libre, Alef, Varela Round, Fredoka, Karantina, Open Sans.
  (Latin-only display faces will not render Hebrew. The references use commercial Hebrew fonts; pick the
  closest of these.)
- The logo: any element with `background: var(--tz-logo) center / cover no-repeat` (the harness defines
  `--tz-logo`; it is a round seal with transparent corners). Give it `role="img"` and an `aria-label`.
  All other pictures come only through the image slots (see above).
- No emoji anywhere. No photographs or illustrations of people (faces, figures, hands, avatars with people) —
  use initials, monograms, objects, abstract or geometric art. Respectful, dignified tone for a religious
  charity; names in the data are all male students, keep it that way.
- Works from 360px to 1920px wide with no horizontal page scroll. Phone layout is designed, not squeezed:
  bottom navigation, cards instead of table, touch targets >= 44px.
- Real controls: `<button>`, `<a href>`, `<input>` with `<label>`/`aria-label`; visible `:focus-visible`;
  Escape closes overlays; body text contrast >= 4.5:1 (careful with text on yellow/gold: use black, never
  white); honour `prefers-reduced-motion` (skip to final state).
- Complete at rest: 2.5 seconds after load every number and chart is in its final, readable state (the harness
  screenshots then). Nothing may wait for scroll or hover to become visible.
- Keep your source files under ~280 KB in total.

### Data
`window.TZ_DATA` (see `<proto>/shared/data.js`, read it) has everything: settings, summary, frameworks,
yeshivas, yearly, monthly, expenseCategories, alerts, activity, members (28 sample rows with computed
required / gap / pct / status / gifts / deposits), historyOf(), leaderboard, heatmap, grants, nav,
quickActions, statusFilters, fmt(). Use these numbers so the versions are comparable.

### Checking your work (mandatory)
```bash
node <proto>/shared/harness.js <key>          # full run: desktop + phone, all views, writes <key>/shots/*.png
node <proto>/shared/harness.js <key> --quick  # only the dashboard, faster
node <proto>/shared/harness.js <key> --test-images   # same as the full run but with stand-in pictures in every slot
```
The harness assembles your files exactly like the published page, opens it in Chromium at 1440x900 and
390x844, calls `go()` / `open()`, saves screenshots and prints a JSON report (console errors, failed
requests, horizontal overflow with offending elements, small touch targets, fonts actually loaded).
LOOK at the PNGs with the Read tool, next to the reference screenshots, and judge them like a demanding art
director: would the client say "yes, this is the Libra / AIG level I asked for"? Iterate: render, look, fix,
render again — at least three full cycles. The last report must show no console errors, no overflow, and
your Hebrew fonts listed under fontsLoaded.
