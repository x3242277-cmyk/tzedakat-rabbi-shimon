export const meta = {
  name: 'tzedaka-old-system-study',
  description: 'Map the existing (old) system from the GitHub project in full, compare it with the new design prototype, verify the differences, and prepare the questions to ask the client about things that do not overlap',
  phases: [
    { title: 'Map', detail: 'four readers over the old code: screens, business rules, data layer, behaviours' },
    { title: 'Compare', detail: 'old system versus new prototype: what is missing, what is extra, what conflicts' },
    { title: 'Check', detail: 'adversarial check of every claimed difference against the code' },
  ],
}

const REPO = '/home/user/x3242277-cmyk/tzedakat-rabbi-shimon'
const PROTO = '/tmp/claude-0/-home-user/23f26262-7397-509f-9a5e-29915b59e94f/scratchpad/proto'
const OUT = PROTO + '/old-study'

const CTX = `Context: ${REPO} is the client's EXISTING ("old") management system for the charity "צדקת רבי שמעון · עזרת חתנים": a vanilla-JS single-page app (index.html, script.js ~300 KB, style.css, supabase-integration.js, boot.js, supabase/*.sql, _headers, manifest.json) backed by Supabase. We are building a NEW system with a new design that must carry everything the old one does. Your job is read-only analysis of the old code: do not modify anything in ${REPO}. Write your full findings as a Markdown file under ${OUT}/ (create the folder if needed) and return only the short structured summary. Be exhaustive and precise: quote Hebrew labels exactly as they appear, name the functions and line numbers you rely on, and say "not found" rather than guessing. script.js is large: read it in chunks with offsets and use Grep to navigate; do not skip parts.`

const MAP_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string', description: 'Path of the Markdown file you wrote' },
    headline: { type: 'string', description: 'Two or three sentences: what you found' },
    counts: { type: 'string', description: 'e.g. "9 screens, 14 dialogs, 37 actions"' },
    surprises: { type: 'array', items: { type: 'string' }, description: 'Up to 8 things a rebuild could easily miss' },
  },
  required: ['file', 'headline', 'surprises'],
}

const LENSES = [
  {
    key: 'screens',
    prompt: `Lens: SCREENS AND NAVIGATION. Inventory every screen, tab, sub-view, dialog / modal, menu, toolbar and action in the old app: where it is defined (index.html section ids, script.js render functions), what it shows (every table column, card, chart, filter, sort, search field, toggle, export / print button, empty state), which user permission shows or hides it, and how the user reaches it on desktop and on the phone. Include the login screen, the dashboard cards and alerts, members list and member card, eligibility history, transactions report, expenses summary, Purim addresses, grants (both views), regulations page, every settings tab, and anything not in that list. Write ${OUT}/01-screens.md as a structured outline per screen.`,
  },
  {
    key: 'rules',
    prompt: `Lens: BUSINESS RULES AND CALCULATIONS. Extract the exact logic, with the code that implements it: yearly targets by framework; how a member's framework / shiur is rolled back for past years; cumulative debt and the doubled penalty (from which Hebrew year); the "required" amount and gap; eligibility rules per framework; the two configurable gifts; who counts as married and how that changes the dashboard and lists; Hebrew-year handling (current campaign year, new-year reminder, ordering of years, Hebrew month halves); date parsing of the free-text date field (all formats handled); dashboard totals and alerts and their thresholds; income by year (members versus Purim) and expenses including grants cost; Purim per-group manual sums; grants: package value, per-store expectation by half-year, store bills, legacy payments mapping; expense anomaly detection; data-integrity checks; anything else computed. For each rule give the formula in plain words plus the function name and line numbers, and list edge cases the code handles. Write ${OUT}/02-rules.md.`,
  },
  {
    key: 'data',
    prompt: `Lens: DATA LAYER, AUTH AND CONFIGURATION. From supabase-integration.js, script.js, boot.js, supabase/schema.sql, supabase/security-update.sql, supabase/SETUP.md, _headers, _redirects, serve.json, manifest.json: every table and column actually read or written and by which feature; the JSON shapes stored in settings, grants_archive and purim_addresses (every key the code reads or writes, with examples); id generation; how login works (username to e-mail mapping, profile lookup, permissions flags and how each gates the UI); session storage and auto-lock; the sync model (what is loaded at start, caching, optimistic updates, offline queue, retry, pending counter, undo-delete window, drafts); audit-log writes (which actions, what details); receipt upload to Storage (paths, limits, signed URLs); where the Supabase URL and anon key are configured (report the file and variable names, and whether real values are committed — do NOT copy any key value into your output); security headers / CSP; PWA setup; the Nedarim Plus credit-clearing integration; export / import of a full backup. Write ${OUT}/03-data.md.`,
  },
  {
    key: 'behaviours',
    prompt: `Lens: BEHAVIOURS, EDITING FLOWS AND DETAILS. Walk through every create / edit / delete flow and interaction: deposit dialog (fields, defaults, validation, autocomplete behaviour, edit and delete), expense dialog, member form (fields, shiur options per framework, validation), quick inline edit mode in tables, credit-clearing flow, Purim table edit mode and per-year columns, grants recipients and package editing, store-payment dialog with receipt upload, settings forms; toasts, confirmation dialogs, loading and error states, the offline banner, keyboard shortcuts, density toggle, print layouts (what each printed page contains), CSV export (which tables, columns, encoding), responsive / phone behaviour (bottom navigation, tables to cards), accessibility helpers, and any hidden or legacy feature (old payment method, migrations, feature flags, debug tools). Note every Hebrew message string shown to the user for validation, errors and confirmations. Write ${OUT}/04-behaviours.md.`,
  },
]

phase('Map')
const maps = await parallel(LENSES.map((l) => () =>
  agent(`${CTX}\n\n${l.prompt}`, { label: 'map:' + l.key, phase: 'Map', schema: MAP_SCHEMA })
    .then((r) => (r ? { lens: l.key, ...r } : null))
))
const okMaps = maps.filter(Boolean)
if (okMaps.length < 3) {
  log('Too few map agents finished (' + okMaps.length + '/4) — stopping so the run can be resumed later')
  return { stopped: 'map-incomplete', maps: okMaps }
}

// ------------------------------------------------------------------ Compare
phase('Compare')
const GAP_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    oldOnly: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, item: { type: 'string' }, where: { type: 'string' }, importance: { type: 'string', enum: ['core', 'useful', 'minor'] } }, required: ['id', 'item', 'importance'] }, description: 'In the old system, absent from the new prototype' },
    newOnly: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, item: { type: 'string' }, dataNeeded: { type: 'string', description: 'What data or logic it would need that the old system does not have' } }, required: ['id', 'item'] }, description: 'In the new prototype, with no equivalent in the old system' },
    conflicts: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, topic: { type: 'string' }, oldBehaviour: { type: 'string' }, newBehaviour: { type: 'string' } }, required: ['id', 'topic', 'oldBehaviour', 'newBehaviour'] }, description: 'Same concept, different definition or behaviour' },
  },
  required: ['file', 'oldOnly', 'newOnly', 'conflicts'],
}
const gap = await agent(
  `We are rebuilding an existing management system with a new design. Compare the OLD system with the NEW design prototype and list exactly where they do not overlap. Read-only: do not modify the repo or the prototype.

OLD system: ${REPO} (source of truth for functionality). Four analysts already mapped it: read their files in full — ${okMaps.map((m) => m.file).join(' , ')} — and open the old source yourself whenever a detail is unclear.

NEW prototype (design only, sample data, not wired to a database): read ${PROTO}/shared/BRIEF.md (what the client asked for), ${PROTO}/shared/data.js (the sample data model: summary figures, frameworks, yeshivas ranking, yearly, monthly, expense categories, alerts, activity, members, leaderboard, heat-map, grants, navigation, image slots) and the prototype sources in ${PROTO}/pal-src/ (body.html, script.js, style.css: a dashboard built like a home page, members list, member view, deposit form, and six "בקרוב" placeholder screens for grants, Purim addresses, transactions report, expenses summary, regulations, settings).

Produce three lists, each item with a short id (O1.., N1.., C1..):
1. oldOnly — every feature, screen, field, rule, behaviour or piece of data that exists in the old system and is absent from the new prototype (group related details into one item; mark importance). The six placeholder screens count as absent: say what each must contain.
2. newOnly — every module, figure, field or behaviour the new prototype shows that has NO equivalent in the old system (for example a leaderboard, a deposit heat-map, yeshiva ranking, cash / credit split, last-year comparisons, a live ticker, gift milestones track, yearly comparison figures, any label or status the old system does not use). For each, say what data or logic it would need and whether the old data could supply it.
3. conflicts — places where both have the same concept but define or name it differently (status names and thresholds, which numbers the six dashboard figures mean, eligibility wording, navigation grouping, field names, formats).
Write the full comparison to ${OUT}/05-gaps.md and return the structured lists (keep each item to one or two sentences).`,
  { label: 'compare', phase: 'Compare', schema: GAP_SCHEMA }
)
if (!gap) return { stopped: 'compare-failed', maps: okMaps }

// ------------------------------------------------------------------ Check
phase('Check')
const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    wrong: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, why: { type: 'string' } }, required: ['id', 'why'] }, description: 'Claims that are false or misleading' },
    missed: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['oldOnly', 'newOnly', 'conflict'] }, item: { type: 'string' }, evidence: { type: 'string' } }, required: ['kind', 'item'] }, description: 'Differences the comparison missed' },
  },
  required: ['wrong', 'missed'],
}
const checks = await parallel([
  () => agent(
    `A comparison between an old system (${REPO}) and a new prototype (${PROTO}/pal-src/, ${PROTO}/shared/data.js) claims the following things exist ONLY in the old system or CONFLICT between the two. Try to refute each claim by reading the actual sources of both (default to "wrong" only when you find clear evidence), and look for old-system features the comparison missed entirely (grep the old script.js for screens, dialogs, settings keys and Hebrew labels that are not mentioned). Read-only.\n\noldOnly: ${JSON.stringify(gap.oldOnly)}\n\nconflicts: ${JSON.stringify(gap.conflicts)}`,
    { label: 'check:old-side', phase: 'Check', schema: CHECK_SCHEMA }
  ),
  () => agent(
    `A comparison between an old system (${REPO}) and a new prototype (${PROTO}/pal-src/, ${PROTO}/shared/data.js) claims the following modules exist ONLY in the new prototype, with no equivalent in the old system. Try to refute each claim by searching the old sources for an equivalent (charts, rankings, summaries, fields in notes, settings keys), and go through the new prototype's dashboard, members list, member view and deposit form block by block to find new-only things the comparison missed. Read-only.\n\nnewOnly: ${JSON.stringify(gap.newOnly)}`,
    { label: 'check:new-side', phase: 'Check', schema: CHECK_SCHEMA }
  ),
])
const wrong = checks.filter(Boolean).flatMap((c) => c.wrong || [])
const missed = checks.filter(Boolean).flatMap((c) => c.missed || [])
const bad = new Set(wrong.map((w) => w.id))
log('Gaps: ' + gap.oldOnly.length + ' old-only, ' + gap.newOnly.length + ' new-only, ' + gap.conflicts.length + ' conflicts; refuted ' + wrong.length + ', missed ' + missed.length)

return {
  maps: okMaps.map((m) => ({ lens: m.lens, file: m.file, headline: m.headline, counts: m.counts, surprises: m.surprises })),
  gapFile: gap.file,
  oldOnly: gap.oldOnly.filter((x) => !bad.has(x.id)),
  newOnly: gap.newOnly.filter((x) => !bad.has(x.id)),
  conflicts: gap.conflicts.filter((x) => !bad.has(x.id)),
  refuted: wrong,
  missed,
}
