#!/usr/bin/env node
/* בונה את redesign/prototype.html (קובץ אחד שנפתח בכרום) מקובצי המקור של הגרסה.
   שימוש:  node redesign/shared/build.js
   מקורות: b1/style.css + b1/screens.css · b1/body.html · shared/data.js + shared/data-screens.js ·
           b1/script.js, כש-b1/screens.js ו-b1/routes.js נכנסים במקום הסימון שבתוכו (אותו סגור, אותן פונקציות עזר) · התמונות מ-shared/images. */
const fs = require('fs');
const path = require('path');
const { imagesScript } = require('./images.js');

const SHARED = __dirname;
const ROOT = path.resolve(SHARED, '..');
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const MARK = '/*@@SCREENS@@*/';

function sources(k) {
  const dir = path.join(ROOT, k);
  const script = read(path.join(dir, 'script.js'));
  const screens = read(path.join(dir, 'screens.js')) + '\n' + read(path.join(dir, 'routes.js'));
  return {
    css: read(path.join(dir, 'style.css')) + '\n' + read(path.join(dir, 'screens.css')),
    body: read(path.join(dir, 'body.html')),
    data: read(path.join(SHARED, 'data.js')) + '\n' + read(path.join(SHARED, 'data-screens.js')),
    js: script.indexOf(MARK) > -1 ? script.split(MARK).join(screens) : script,
    fonts: read(path.join(dir, 'fonts.txt')).split('\n').map((s) => s.trim()).filter((s) => s.startsWith('https://fonts.googleapis.com/')),
  };
}

function fragment(k, testImages) {
  const s = sources(k);
  const logo = fs.readFileSync(path.join(SHARED, 'logo.png')).toString('base64');
  let out = '<title>צדקת רבי שמעון</title>\n<style>body{background:#FFFFFF;color:#0B0B0B}</style>\n';
  s.fonts.forEach((u) => { out += `<link rel="stylesheet" href="${u}">\n`; });
  out += `<style>:root{--tz-logo:url("data:image/png;base64,${logo}")}</style>\n`;
  out += `<style>\n${s.css}\n</style>\n`;
  out += `<div class="tz-${k}" id="tz-${k}" dir="rtl" lang="he">\n${s.body}\n</div>\n`;
  out += `<script>\n${s.data}\n</script>\n`;
  out += imagesScript(!!testImages);
  out += `<script>\n${s.js}\n</script>\n`;
  out += `<script>(function(){var d=window.TZ_DIRS&&window.TZ_DIRS[${JSON.stringify(k)}];var r=document.getElementById('tz-${k}');if(d&&d.mount){d.mount(r);if(d.show)d.show();}else{console.error('TZ_DIRS.${k}.mount is missing');}})();</script>\n`;
  return out;
}

const HEAD = '<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n';

module.exports = { sources, fragment };

if (require.main === module) {
  const k = process.argv[2] || 'b1';
  const html = HEAD + fragment(k, false) + '\n</body>\n</html>\n';
  const out = path.join(ROOT, 'prototype.html');
  fs.writeFileSync(out, html);
  console.log('built', path.relative(process.cwd(), out), Math.round(Buffer.byteLength(html) / 1024) + ' KB');
}
