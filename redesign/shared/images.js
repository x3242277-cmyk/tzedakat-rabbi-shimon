// Builds the <script> that fills window.TZ_DATA.images from <proto>/shared/images/<key>.(png|jpg|jpeg|webp).
// testMode = true fills every slot with a generated stand-in picture so layouts can be checked before real images arrive.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.join(__dirname, 'images');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
function slots() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'), ctx);
  return ctx.window.TZ_DATA.imageSlots;
}
function standIn(sl) {
  const scene = sl.kind === 'scene';
  const w = scene ? 960 : 600, h = scene ? 540 : 600;
  const svg = scene
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7D98A"/><stop offset="1" stop-color="#B7791F"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="250" cy="300" r="170" fill="#FFF3D0" opacity=".55"/><rect x="150" y="240" width="200" height="210" rx="18" fill="#3A2A12" opacity=".55"/><text x="${w / 2}" y="60" font-family="Arial" font-size="34" fill="#3A2A12" text-anchor="middle">TEST ${sl.key}</text></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#FFFFFF"/><ellipse cx="300" cy="500" rx="170" ry="26" fill="#000" opacity=".12"/><rect x="170" y="170" width="260" height="300" rx="46" fill="#E0A82E"/><rect x="200" y="200" width="200" height="90" rx="24" fill="#F7D98A"/><text x="300" y="120" font-family="Arial" font-size="34" fill="#3A2A12" text-anchor="middle">TEST ${sl.key}</text></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}
function collect(testMode) {
  const out = {};
  for (const sl of slots()) {
    let found = null;
    for (const ext of Object.keys(MIME)) {
      const f = path.join(DIR, sl.key + ext);
      if (fs.existsSync(f)) { found = 'data:' + MIME[ext] + ';base64,' + fs.readFileSync(f).toString('base64'); break; }
    }
    if (found) out[sl.key] = found; else if (testMode) out[sl.key] = standIn(sl);
  }
  return out;
}
function imagesScript(testMode) {
  const map = collect(testMode);
  if (!Object.keys(map).length) return '';
  return '<script>(function(){var I=' + JSON.stringify(map) + ';for(var k in I){window.TZ_DATA.images[k]=I[k];}})();</script>\n';
}
module.exports = { imagesScript, collect, slots };
