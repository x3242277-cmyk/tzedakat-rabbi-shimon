#!/usr/bin/env node
/* Build + render harness for one design direction.
   Usage (from anywhere):  node <proto>/shared/harness.js <key> [--quick]
   Reads   <proto>/<key>/{style.css, body.html, script.js, fonts.txt}
   Writes  <proto>/<key>/preview.html  and  <proto>/<key>/shots/*.png + report.json
   --quick        = desktop + mobile dashboard only (fast iteration)
   --test-images  = fill every image slot with a stand-in picture, to check how real images will sit        */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SHARED = __dirname;
const ROOT = path.resolve(SHARED, '..');
const key = process.argv[2];
const QUICK = process.argv.includes('--quick');
const TEST_IMAGES = process.argv.includes('--test-images');
const { imagesScript } = require('./images.js');
if (!key) { console.error('usage: node harness.js <key> [--quick]'); process.exit(2); }
const DIR = path.join(ROOT, key);
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

function fragment(k) {
  const logo = fs.readFileSync(path.join(SHARED, 'logo.png')).toString('base64');
  const fonts = read(path.join(ROOT, k, 'fonts.txt')).split('\n').map((s) => s.trim())
    .filter((s) => s.startsWith('https://fonts.googleapis.com/'));
  let out = '<title>צדקת רבי שמעון</title>\n';
  fonts.forEach((u) => { out += `<link rel="stylesheet" href="${u}">\n`; });
  out += `<style>:root{--tz-logo:url("data:image/png;base64,${logo}")}</style>\n`;
  out += `<style>\n${read(path.join(ROOT, k, 'style.css'))}\n</style>\n`;
  out += `<div class="tz-${k}" id="tz-${k}" dir="rtl" lang="he">\n${read(path.join(ROOT, k, 'body.html'))}\n</div>\n`;
  out += `<script>\n${read(path.join(SHARED, 'data.js'))}\n</script>\n`;
  out += imagesScript(TEST_IMAGES);
  out += `<script>\n${read(path.join(ROOT, k, 'script.js'))}\n</script>\n`;
  out += `<script>(function(){var d=window.TZ_DIRS&&window.TZ_DIRS[${JSON.stringify(k)}];var r=document.getElementById('tz-${k}');if(d&&d.mount){d.mount(r);if(d.show)d.show();}else{console.error('TZ_DIRS.${k}.mount is missing');}})();</script>\n`;
  return out;
}

// Same wrapper the publishing step puts around the fragment.
const SKELETON_HEAD = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n';

async function inspect(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const over = document.documentElement.scrollWidth - vw;
    const offenders = [];
    const name = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    if (over > 1) {
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) offenders.push(name(el) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      });
    }
    const small = [];
    document.querySelectorAll('button,a[href],input,select,[role="button"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0 && (r.height < 40 || r.width < 40)) {
        if (el.type === 'checkbox' || el.type === 'radio') return;
        small.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    });
    const fonts = Array.from(new Set(Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''))));
    return { overflowX: over, offenders: offenders.slice(0, 8), smallTargets: small.slice(0, 12), smallTargetCount: small.length, fontsLoaded: fonts };
  });
}

(async () => {
  const SHOTS = TEST_IMAGES ? 'shots-test-images' : 'shots';
  fs.mkdirSync(path.join(DIR, SHOTS), { recursive: true });
  const frag = fragment(key);
  fs.writeFileSync(path.join(DIR, 'fragment.html'), frag);
  fs.writeFileSync(path.join(DIR, 'preview.html'), SKELETON_HEAD + frag + '</body></html>');
  const url = 'file://' + path.join(DIR, 'preview.html');
  const report = { key, sizeKB: Math.round(Buffer.byteLength(frag) / 1024), views: {}, console: [], failedRequests: [], api: {} };
  const browser = await chromium.launch();

  async function run(label, ctxOpts, steps) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') report.console.push(`[${label}] ${m.type()}: ${m.text()}`.slice(0, 400)); });
    page.on('pageerror', (e) => report.console.push(`[${label}] pageerror: ${e.message}`.slice(0, 400)));
    page.on('requestfailed', (r) => report.failedRequests.push(`[${label}] ${r.url().slice(0, 140)}`));
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(2800);
    const base = ctxOpts.viewport;
    const shot = async (name, tall) => {
      const file = path.join(DIR, SHOTS, `${label}-${name}.png`);
      await page.screenshot({ path: file });
      report.views[`${label}-${name}`] = await inspect(page);
      if (tall) {
        await page.setViewportSize({ width: base.width, height: tall });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(DIR, SHOTS, `${label}-${name}-tall.png`), fullPage: true });
        await page.setViewportSize(base);
        await page.waitForTimeout(300);
      }
    };
    const call = async (fn, arg) => {
      const res = await page.evaluate(([k, f, a]) => {
        const d = window.TZ_DIRS && window.TZ_DIRS[k];
        if (!d || typeof d[f] !== 'function') return '__missing__';
        try { const r = d[f](a); return r === false ? '__unsupported__' : 'ok'; } catch (e) { return 'error: ' + e.message; }
      }, [key, fn, arg]);
      report.api[`${fn}(${arg})`] = res;
      await page.waitForTimeout(1100);
      return res === 'ok';
    };
    await steps({ page, shot, call });
    await ctx.close();
  }

  // If the version declares API.themes = [{key,name},...], capture the dashboard (and members on desktop) in each theme.
  async function themeShots({ page, shot, call }) {
    const themes = await page.evaluate((k) => { const d = window.TZ_DIRS && window.TZ_DIRS[k]; return d && Array.isArray(d.themes) ? d.themes.map((t) => (t && t.key) || String(t)) : []; }, key);
    report.themes = themes;
    if (!themes.length) return;
    for (const t of themes) {
      if (!(await call('setTheme', t))) continue;
      await call('go', 'dashboard');
      await shot('theme-' + t + '-dashboard');
      if (page.viewportSize().width > 800) { if (await call('go', 'members')) await shot('theme-' + t + '-members'); }
    }
    await call('setTheme', themes[0]);
    await call('go', 'dashboard');
  }

  await run('d', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, async ({ page, shot, call }) => {
    await shot('dashboard', 2600);
    if (QUICK) return;
    if (await call('go', 'members')) await shot('members', 2200);
    if (await call('open', 'member')) await shot('member');
    await call('open', null);
    if (await call('open', 'deposit')) await shot('deposit');
    await call('open', null);
    if (await call('open', 'palette')) await shot('palette');
    await call('open', null);
    await themeShots({ page, shot, call });
  });

  await run('m', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, async ({ page, shot, call }) => {
    await shot('dashboard', 3200);
    if (QUICK) return;
    if (await call('go', 'members')) await shot('members', 2400);
    if (await call('open', 'member')) await shot('member');
    await call('open', null);
    if (await call('open', 'deposit')) await shot('deposit');
    await call('open', null);
    await themeShots({ page, shot, call });
  });

  await browser.close();
  fs.writeFileSync(path.join(DIR, SHOTS, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('\nScreenshots: ' + path.join(DIR, SHOTS));
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
