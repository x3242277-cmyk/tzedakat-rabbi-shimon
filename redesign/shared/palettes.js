#!/usr/bin/env node
/* Generates colour variants of the base version.
   Usage: node shared/palettes.js [srcDir]      (default <proto>/pal-src, the gold base with key b1)
   Writes <proto>/<key>/{style.css, body.html, script.js, fonts.txt} for every palette below.
   Each variant is a full copy: key renamed (tz-b1 -> tz-<key>) and every colour of the gold family remapped. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'pal-src');
const BASE_KEY = 'b1';
const BASE = { h: 43, s: 0.62, l: 0.5 }; // the gold main colour #CEA130

// h = hue of the main field colour, s / l = its saturation / lightness. All fields keep black text on them.
const PFILE = process.argv[3] ? path.resolve(process.argv[3]) : path.join(__dirname, 'palettes.json');
const PALETTES = JSON.parse(fs.readFileSync(PFILE, 'utf8'));

function toHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function toRgb(h, s, l) { h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; let r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; } return [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round((v + m) * 255)))); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = (n) => n.toString(16).padStart(2, '0').toUpperCase();

function mapper(p) {
  return (r, g, b) => {
    const [h, s, l] = toHsl(r, g, b);
    if (p.ink && s < 0.12 && !(r === 0 && g === 0 && b === 0)) {   // neutral greys / near-black -> tinted ink family
      if (l < 0.25) return toRgb(p.ink.h, p.ink.s, clamp(0.14 + l * 0.9, 0, 0.4));
      if (l < 0.72) return toRgb(p.ink.h, p.ink.s * 0.28, l);
      return null;
    }
    if (h < 28 || h > 60 || s < 0.45) return null;          // not part of the gold family
    const nh = p.h + (h - BASE.h) * (p.spread == null ? 0.6 : p.spread);
    const ns = clamp(s * (p.s / BASE.s), 0, 1);
    let nl;
    if (l > 0.8) nl = clamp(l + (p.tintLift || 0), 0, 0.985);  // pale tints stay pale
    else nl = clamp(l * (p.l / BASE.l), 0.18, 0.86);
    return toRgb(nh, l > 0.8 ? ns * (p.tintSat == null ? 1 : p.tintSat) : ns, nl);
  };
}

for (const p of PALETTES) {
  const map = p.identity ? () => null : mapper(p);
  const out = path.join(ROOT, p.key);
  fs.mkdirSync(out, { recursive: true });
  for (const f of ['style.css', 'body.html', 'script.js']) {
    let s = fs.readFileSync(path.join(SRC, f), 'utf8');
    s = s.replace(/#([0-9a-fA-F]{6})\b/g, (m, x) => { const o = map(parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)); return o ? '#' + o.map(hex).join('') : m; });
    s = s.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),/g, (m, r, g, b) => { const o = map(+r, +g, +b); return o ? 'rgba(' + o.join(',') + ',' : m; });
    s = s.split('tz-' + BASE_KEY).join('tz-' + p.key).split('tz' + BASE_KEY + '-').join('tz' + p.key + '-').split('TZ_DIRS.' + BASE_KEY).join('TZ_DIRS.' + p.key);
    if (f === 'script.js') {
      s = s.replace(/name: '[^']*',/, "name: '" + p.name + "',").replace(/tagline: '[^']*',/, "tagline: '" + p.tagline + "',");
    }
    if (f === 'style.css' && p.css) s += '\n' + p.css.split('.tz-KEY').join('.tz-' + p.key) + '\n';
    fs.writeFileSync(path.join(out, f), s);
  }
  fs.copyFileSync(path.join(SRC, 'fonts.txt'), path.join(out, 'fonts.txt'));
  const main = p.identity ? [206, 161, 48] : mapper(p)(206, 161, 48);
  console.log(p.key, p.name, '#' + main.map(hex).join(''));
}
