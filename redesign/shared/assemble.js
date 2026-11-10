#!/usr/bin/env node
/* Combines the finished directions into one publishable page.
   Usage: node shared/assemble.js [keys...]        (default: a b c, skipping missing ones)
   Writes <proto>/final/index.html  (fragment to publish)  and  <proto>/final/preview.html (local check). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { imagesScript } = require('./images.js');

const SHARED = __dirname;
const ROOT = path.resolve(SHARED, '..');
const OUT = path.join(ROOT, 'final');
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const argKeys = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const want = argKeys.length ? argKeys : ['b1', 'b2'];
const keys = want.filter((k) => fs.existsSync(path.join(ROOT, k, 'script.js')) && fs.existsSync(path.join(ROOT, k, 'body.html')));

const ORD = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳'];
const CFG = Object.assign({ heading: null, lead: null, card: 'גרסה', tab: 'גרסאות', note: 'כל השמות, הישיבות והסכומים הם נתוני הדגמה.', title: 'עיצוב חדש לצדקת רבי שמעון' }, fs.existsSync(path.join(OUT, 'chooser.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'chooser.json'), 'utf8')) : {});
const LETTER = {};
keys.forEach((k, i) => { LETTER[k] = ORD[i] || String(i + 1); });

const SKELETON_HEAD = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n';

async function thumbs(browser) {
  const out = {};
  const page = await browser.newPage();
  for (const k of keys) {
    const file = path.join(ROOT, k, 'shots', 'd-dashboard.png');
    if (!fs.existsSync(file)) continue;
    const b64 = fs.readFileSync(file).toString('base64');
    out[k] = await page.evaluate(async (src) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
      const W = 880, H = Math.round(W * 0.6);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      const sh = Math.min(img.height, Math.round(img.width * 0.6));
      x.drawImage(img, 0, 0, img.width, sh, 0, 0, W, H);
      return c.toDataURL('image/jpeg', 0.78);
    }, b64);
  }
  await page.close();
  return out;
}

async function meta(browser) {
  // Read each direction's name / tagline / pageBg by loading its script against the shared data.
  const page = await browser.newPage();
  await page.setContent('<div></div>');
  await page.addScriptTag({ content: read(path.join(SHARED, 'data.js')) });
  for (const k of keys) await page.addScriptTag({ content: read(path.join(ROOT, k, 'script.js')) }).catch(() => {});
  const m = await page.evaluate((ks) => { const o = {}; ks.forEach((k) => { const d = (window.TZ_DIRS || {})[k] || {}; o[k] = { name: d.name || k, tagline: d.tagline || '', pageBg: d.pageBg || '#ffffff' }; }); return o; }, keys);
  await page.close();
  return m;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const T = await thumbs(browser);
  const M = await meta(browser);

  const fonts = new Set(['https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap']);
  keys.forEach((k) => read(path.join(ROOT, k, 'fonts.txt')).split('\n').map((s) => s.trim())
    .filter((s) => s.startsWith('https://fonts.googleapis.com/')).forEach((u) => fonts.add(u)));
  const logo = fs.readFileSync(path.join(SHARED, 'logo.png')).toString('base64');

  let out = `<title>${CFG.title}</title>\n`;
  fonts.forEach((u) => { out += `<link rel="stylesheet" href="${u}">\n`; });
  out += `<style>
:root{--tz-logo:url("data:image/png;base64,${logo}")}
body{background:#0C0E13;color:#F2ECDD}
/* ---- chooser (cover) ---- */
.tzx{--x-bg:#0C0E13;--x-panel:#151821;--x-line:#2A2E3A;--x-ink:#F2ECDD;--x-dim:#A9ADBA;--x-gold:#D9B45A;--x-gold-ink:#1A1508;
  min-height:100dvh;box-sizing:border-box;background:radial-gradient(1200px 520px at 80% -10%,rgba(217,180,90,.14),transparent 60%),var(--x-bg);
  color:var(--x-ink);font-family:Heebo,Arial,sans-serif;line-height:1.5;
  padding-block:clamp(28px,5vw,64px);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.tzx *{box-sizing:border-box}
.tzx .x-wrap{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(24px,4vw,44px)}
.tzx .x-head{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.tzx .x-logo{width:72px;height:72px;flex:none;border-radius:50%;background:var(--tz-logo) center/cover no-repeat}
.tzx .x-eyebrow{margin:0;font-size:14px;font-weight:600;color:var(--x-gold);letter-spacing:.02em}
.tzx h1{margin:2px 0 0;font-size:clamp(28px,4.4vw,46px);font-weight:800;line-height:1.15;text-wrap:balance}
.tzx .x-lead{margin:0;max-width:62ch;font-size:clamp(15px,1.6vw,18px);color:var(--x-dim)}
.tzx .x-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:20px}
.tzx .x-card{display:flex;flex-direction:column;min-width:0;padding:0;border:1px solid var(--x-line);border-radius:20px;background:var(--x-panel);color:inherit;font:inherit;text-align:start;cursor:pointer;overflow:hidden;
  transition:transform .25s cubic-bezier(.2,.8,.2,1),border-color .25s,box-shadow .25s}
.tzx .x-card:hover{transform:translateY(-6px);border-color:var(--x-gold);box-shadow:0 24px 60px rgba(0,0,0,.45)}
.tzx .x-card:focus-visible{outline:3px solid var(--x-gold);outline-offset:3px}
.tzx .x-shot{display:block;width:100%;aspect-ratio:5/3;object-fit:cover;object-position:top right;background:#0a0b10;border-bottom:1px solid var(--x-line)}
.tzx .x-body{display:flex;flex-direction:column;gap:8px;padding:18px 20px 20px}
.tzx .x-num{font-size:13px;font-weight:600;color:var(--x-gold)}
.tzx .x-name{font-size:24px;font-weight:800;line-height:1.2}
.tzx .x-tag{font-size:15px;color:var(--x-dim);min-height:3em}
.tzx .x-go{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;min-height:44px;margin-top:6px;padding:0 18px;border-radius:12px;background:var(--x-gold);color:var(--x-gold-ink);font-size:15px;font-weight:700}
.tzx .x-note{margin:0;font-size:14px;color:var(--x-dim)}
@media (prefers-reduced-motion:reduce){.tzx .x-card{transition:none}.tzx .x-card:hover{transform:none}}
/* ---- floating "back to directions" tab ---- */
.tzx-tab{position:fixed;z-index:2147483000;left:0;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;
  width:34px;min-height:104px;padding:10px 0;border:1px solid rgba(217,180,90,.55);border-left:0;border-radius:0 12px 12px 0;
  background:rgba(12,14,19,.88);color:#E8C97A;font:700 13px/1 Heebo,Arial,sans-serif;writing-mode:vertical-rl;cursor:pointer;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.35)}
.tzx-tab:hover{background:#0C0E13;color:#F6E3A1}
.tzx-tab:focus-visible{outline:3px solid #E8C97A;outline-offset:2px}
</style>\n`;

  keys.forEach((k) => { out += `<style>\n/* ===== direction ${k} ===== */\n${read(path.join(ROOT, k, 'style.css'))}\n</style>\n`; });

  out += `<div class="tzx" id="tzx-chooser" dir="rtl" lang="he">
<div class="x-wrap">
  <header class="x-head">
    <div class="x-logo" role="img" aria-label="סמל צדקת רבי שמעון"></div>
    <div>
      <p class="x-eyebrow">צדקת רבי שמעון · עזרת חתנים</p>
      <h1>${CFG.heading || (keys.length === 2 ? 'שתי גרסאות חדשות למערכת' : 'גרסאות עיצוב חדשות למערכת')}</h1>
    </div>
  </header>
  <p class="x-lead">${CFG.lead || 'כל גרסה היא אב-טיפוס חי: לוח בקרה, רשימת בחורים, כרטיס בחור ורישום הפקדה, עם אנימציות ואינטראקציות אמיתיות. לוחצים על גרסה כדי להיכנס אליה, ובלשונית ״גרסאות״ שבצד חוזרים לכאן.'}</p>
  <div class="x-grid">
${keys.map((k) => `    <button type="button" class="x-card" data-dir="${k}">
      ${T[k] ? `<img class="x-shot" alt="תצוגה מקדימה: ${esc(M[k].name)}" src="${T[k]}">` : '<span class="x-shot"></span>'}
      <span class="x-body">
        <span class="x-num">${CFG.card} ${LETTER[k] || k}</span>
        <span class="x-name">${esc(M[k].name)}</span>
        <span class="x-tag">${esc(M[k].tagline)}</span>
        <span class="x-go">כניסה לאב-טיפוס</span>
      </span>
    </button>`).join('\n')}
  </div>
  <p class="x-note">${CFG.note}</p>
</div>
</div>\n`;

  keys.forEach((k) => { out += `<div class="tz-${k}" id="tz-${k}" dir="rtl" lang="he" hidden>\n${read(path.join(ROOT, k, 'body.html'))}\n</div>\n`; });
  out += '<button type="button" class="tzx-tab" id="tzx-tab" hidden>${CFG.tab}</button>\n';
  out += `<script>\n${read(path.join(SHARED, 'data.js'))}\n</script>\n`;
  out += imagesScript(process.argv.includes('--test-images'));
  keys.forEach((k) => { out += `<script>\n/* ===== direction ${k} ===== */\n${read(path.join(ROOT, k, 'script.js'))}\n</script>\n`; });
  out += `<script>
(function () {
  var KEYS = ${JSON.stringify(keys)};
  var COVER_BG = '#0C0E13';
  var chooser = document.getElementById('tzx-chooser');
  var tab = document.getElementById('tzx-tab');
  var current = null, mounted = {};
  function isDark(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(hex || ''));
    if (!m) return false;
    return (parseInt(m[1], 16) * 299 + parseInt(m[2], 16) * 587 + parseInt(m[3], 16) * 114) / 1000 < 128;
  }
  function setHash(h) { try { if (location.hash.replace('#', '') !== h) location.hash = h; } catch (e) {} }
  function leave() {
    if (!current) return;
    var d = (window.TZ_DIRS || {})[current];
    try { if (d && d.open) d.open(null); if (d && d.hide) d.hide(); } catch (e) { console.error(e); }
    document.getElementById('tz-' + current).hidden = true;
    current = null;
  }
  function enter(k) {
    var d = (window.TZ_DIRS || {})[k], root = document.getElementById('tz-' + k);
    if (!d || !root) return home();
    leave();
    chooser.hidden = true; root.hidden = false; current = k;
    document.documentElement.style.colorScheme = isDark(d.pageBg) ? 'dark' : 'light';
    document.body.style.background = d.pageBg || '#ffffff';
    try { if (!mounted[k]) { d.mount(root); mounted[k] = true; } if (d.show) d.show(); } catch (e) { console.error(e); }
    tab.hidden = false;
    window.scrollTo(0, 0);
    setHash('dir-' + k);
  }
  function home() {
    leave();
    chooser.hidden = false; tab.hidden = true;
    document.documentElement.style.colorScheme = 'dark';
    document.body.style.background = COVER_BG;
    window.scrollTo(0, 0);
    setHash('');
  }
  function route() {
    var h = location.hash.replace('#', '');
    var k = h.indexOf('dir-') === 0 ? h.slice(4) : '';
    if (KEYS.indexOf(k) !== -1) { if (current !== k) enter(k); } else if (current) home();
  }
  chooser.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-dir]') : null;
    if (b) enter(b.getAttribute('data-dir'));
  });
  tab.addEventListener('click', home);
  window.addEventListener('hashchange', route);
  window.TZX = { enter: enter, home: home };
  document.documentElement.style.colorScheme = 'dark';
  route();
})();
</script>\n`;

  fs.writeFileSync(path.join(OUT, 'index.html'), out);
  fs.writeFileSync(path.join(OUT, 'preview.html'), SKELETON_HEAD + out + '</body></html>');
  await browser.close();
  console.log(JSON.stringify({ keys, sizeKB: Math.round(Buffer.byteLength(out) / 1024), meta: M, thumbs: Object.keys(T) }, null, 2));
})().catch((e) => { console.error('ASSEMBLE ERROR', e); process.exit(1); });
