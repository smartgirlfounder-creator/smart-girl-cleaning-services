// Safety checks run on every build. The build fails if any of these fail.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const { selarUrl } = JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'));
const fail = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);

// Addresses of the PAID product that must never appear on the public page.
const FORBIDDEN = [/calclandingpage/i, /netlify\.app/i, /access[- ]?code\s*[:=]/i, /\bSG-\d{3,}\b/];

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(dist);
const html = readFileSync(join(dist, 'index.html'), 'utf8');

// 1. No unreplaced tokens.
if (/\{\{[A-Z_]+\}\}/.test(html)) fail.push('Unreplaced {{TOKEN}} left in index.html');

// 2. Every purchase button goes to the Selar URL, and there are several of them.
const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attrs, inner]) => ({
  attrs, text: inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  href: (attrs.match(/href="([^"]*)"/) || [])[1],
}));
const buy = anchors.filter((a) => /data-buy/.test(a.attrs));
if (buy.length < 5) fail.push(`Expected at least 5 purchase buttons, found ${buy.length}`);
for (const a of buy) if (a.href !== selarUrl) fail.push(`Purchase button "${a.text}" goes to ${a.href}`);
// Any link whose wording sounds like buying must be a marked purchase button.
for (const a of anchors) {
  if (/\b(buy|get cleaning calculator|i want|get started|get your|get it)\b/i.test(a.text) && !/data-buy/.test(a.attrs)) {
    fail.push(`Link "${a.text}" reads like a purchase button but is not marked data-buy`);
  }
  if (a.href && /selar\.com/.test(a.href) && a.href !== selarUrl) fail.push(`Other Selar link found: ${a.href}`);
}
ok(`${buy.length} purchase buttons, all → ${selarUrl}`);

// 3. Nothing in the build points at the paid product.
for (const f of files.filter((f) => /\.(html|css|js|txt|json|xml)$/.test(f))) {
  const t = readFileSync(f, 'utf8');
  for (const re of FORBIDDEN) if (re.test(t)) fail.push(`${f.replace(dist, 'dist')} matches forbidden pattern ${re}`);
}
ok('no link, address or access code of the paid app in page files');

// 4. The free guide exists, is linked, and contains no address or code.
const guide = 'Cleaning-Calculator-Pro-Complete-Guide.pdf';
if (!existsSync(join(dist, guide))) fail.push(`${guide} missing from dist`);
else {
  if (!html.includes(`href="/${guide}"`)) fail.push('Free guide is not linked from the page');
  try {
    const text = execFileSync('pdftotext', [join(dist, guide), '-'], { encoding: 'utf8' });
    const raw = readFileSync(join(dist, guide), 'latin1');
    if (/https?:\/\/|www\.|netlify|calclandingpage/i.test(text) || /\/URI\s*\(/.test(raw)) fail.push('Free guide contains a web address or link');
    for (const re of FORBIDDEN) if (re.test(text)) fail.push(`Free guide matches ${re}`);
    ok('free guide present, linked, and contains no web addresses or codes');
  } catch { console.log('  ! pdftotext not available, skipped scanning the PDF text'); }
}

// 5. YouTube embeds are well formed.
const ids = [...html.matchAll(/data-yt="([^"]+)"/g)].map((m) => m[1]);
for (const id of ids) if (!/^[A-Za-z0-9_-]{11}$/.test(id)) fail.push(`Bad YouTube id ${id}`);
ok(`${ids.length} YouTube videos with valid ids`);

// 6. Every local file referenced by the page exists.
for (const [, ref] of html.matchAll(/(?:src|href|srcset)="(\/[^"#?]+)"/g)) {
  if (!existsSync(join(dist, ref))) fail.push(`Missing file ${ref}`);
}
ok('all local images and files referenced by the page exist');

if (fail.length) { console.error('\nCHECKS FAILED:\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('All checks passed.');
