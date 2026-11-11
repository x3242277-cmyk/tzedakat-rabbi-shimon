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

/* --site: קובצי העיצוב החדש למערכת האמיתית (תיקיית nd בשורש המאגר).
   nd/ui.css נטען בתוך shadow root, ולכן הסגנונות של המערכת הקיימת ושל העיצוב החדש לא נוגעים זה בזה.
   nd/ui.js = גוף הדף כמחרוזת + הקוד של העיצוב. הנתונים מגיעים מ-nd/data.js ו-nd/data-screens.js, לא מנתוני ההדגמה. */
function site(k) {
  const s = sources(k);
  const REPO = path.resolve(ROOT, '..');
  const ND = path.join(REPO, 'nd');
  const IMG = path.join(REPO, 'assets', 'img', 'nd');
  fs.mkdirSync(ND, { recursive: true }); fs.mkdirSync(IMG, { recursive: true });
  const banner = '/* נבנה אוטומטית מ-redesign/' + k + ' על ידי redesign/shared/build.js --site. לא לערוך כאן: עורכים במקור ובונים מחדש. */\n';
  const prelude = ':host{all:initial;display:block;--tz-logo:url("../assets/img/nd/logo.png")}\n[hidden]{display:none!important}\nimg{max-width:100%}\n';
  fs.writeFileSync(path.join(ND, 'ui.css'), banner + prelude + s.css);
  fs.writeFileSync(path.join(ND, 'ui.js'), banner + 'window.TZ_BODY=' + JSON.stringify(s.body) + ';\n' + s.js);
  const src = path.join(SHARED, 'images');
  let n = 0;
  fs.readdirSync(src).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)).forEach((f) => { fs.copyFileSync(path.join(src, f), path.join(IMG, f)); n++; });
  fs.copyFileSync(path.join(SHARED, 'logo.png'), path.join(IMG, 'logo.png'));
  // דף התמונות: כל תמונות העיצוב בדף רגיל ופשוט. מסנני תוכן (נטפרי) לא רואים תמונות שבתוך shadow root,
  // ובדף הזה הם רואים אותן, כך שאפשר לבקש עליהן אישור. אישור של תמונה חל גם בתוך המערכת (אותו קובץ, אותה כתובת).
  const { slots } = require('./images.js');
  const escH = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const pics = slots().filter((sl) => fs.existsSync(path.join(IMG, sl.key + '.webp')));
  const page = '<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex">\n' +
    '<title>תמונות המערכת · צדקת רבי שמעון</title>\n<link rel="stylesheet" href="nd/pictures.css">\n</head>\n<body>\n<main>\n' +
    '<h1>תמונות המערכת</h1>\n<p>אלה כל התמונות שמופיעות במערכת הניהול של צדקת רבי שמעון: ' + pics.length + ' תמונות של חפצים ומקומות, בלי אנשים. ' +
    'הדף נועד לבדיקה ולאישור של סינון התמונות (נטפרי). תמונה שאושרה כאן מוצגת גם בתוך המערכת.</p>\n' +
    pics.map((sl) => '<figure><img src="assets/img/nd/' + sl.key + '.webp" alt="' + escH(sl.label) + '" width="' + sl.w + '" height="' + sl.h + '"><figcaption>' + escH(sl.label) + '</figcaption></figure>').join('\n') +
    '\n<figure><img src="assets/img/nd/logo.png" alt="סמל צדקת רבי שמעון" width="512" height="523"><figcaption>סמל צדקת רבי שמעון</figcaption></figure>\n</main>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(REPO, 'pictures.html'), page);
  fs.writeFileSync(path.join(ND, 'pictures.css'), banner + 'body{margin:0;background:#fff;color:#0B0B0B;font:16px/1.5 Heebo,Arial,sans-serif}main{max-width:1100px;margin:0 auto;padding:28px 16px 60px}h1{margin:0 0 6px;font-size:30px}p{margin:0 0 26px;max-width:720px}figure{margin:0 0 30px}img{display:block;max-width:100%;height:auto;border:1px solid #E2E2E2;border-radius:8px}figcaption{margin-top:8px;font-weight:700}\n');
  console.log('site: nd/ui.css', Math.round(fs.statSync(path.join(ND, 'ui.css')).size / 1024) + ' KB · nd/ui.js', Math.round(fs.statSync(path.join(ND, 'ui.js')).size / 1024) + ' KB ·', n, 'images');
}

if (require.main === module && process.argv.includes('--site')) {
  site('b1');
} else if (require.main === module) {
  const k = process.argv[2] || 'b1';
  const html = HEAD + fragment(k, false) + '\n</body>\n</html>\n';
  const out = path.join(ROOT, 'prototype.html');
  fs.writeFileSync(out, html);
  console.log('built', path.relative(process.cwd(), out), Math.round(Buffer.byteLength(html) / 1024) + ' KB');
}
