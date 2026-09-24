#!/usr/bin/env node
/*
 * Packs the whole page into one self-contained HTML file: dist/phool-birthday.html
 * CSS, scripts, icons and your photos are embedded; the song too if assets/audio/song.mp3 exists.
 *
 *   node tools/build.mjs            # everything that exists locally
 *   node tools/build.mjs --no-song  # leave the song out (much smaller file)
 *
 * Fonts still come from Google Fonts, so the file needs internet for the handwriting faces.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
};

const read = (p) => readFileSync(join(root, p), 'utf8');
const exists = (p) => existsSync(join(root, p));
const dataUri = (p) => `data:${MIME[extname(p).toLowerCase()] || 'application/octet-stream'};base64,${readFileSync(join(root, p)).toString('base64')}`;
const missing = [];

function embedConfigFiles(js) {
  js = js.replace(/(['"])(assets\/photos\/[^'"]+)\1/g, (match, quote, file) => {
    if (exists(file)) return quote + dataUri(file) + quote;
    missing.push(file);
    return match;
  });
  return js.replace(/songFile:\s*(['"])([^'"]*)\1/, (match, quote, file) => {
    const include = file && exists(file) && !args.has('--no-song');
    return 'songFile: ' + quote + (include ? dataUri(file) : '') + quote;
  });
}

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="assets\/css\/app\.css">/, () => `<style>\n${read('assets/css/app.css')}\n</style>`);
html = html.replace(/[ \t]*<link rel="manifest"[^>]*>\n/, '');
html = html.replace(/href="(assets\/img\/[^"]+)"/g, (match, file) => (exists(file) ? `href="${dataUri(file)}"` : match));
html = html.replace(/<script src="(assets\/js\/[\w-]+\.js)"><\/script>/g, (match, file) => {
  let js = read(file);
  if (file.endsWith('/config.js')) js = embedConfigFiles(js);
  return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
});

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', 'phool-birthday.html');
writeFileSync(out, html);
const mb = (statSync(out).size / 1024 / 1024).toFixed(1);
console.log(`Built dist/phool-birthday.html (${mb} MB)`);
if (missing.length) console.log(`Photos not found (their polaroids will say "photo coming soon"):\n  ${missing.join('\n  ')}`);
