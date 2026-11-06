// Copies src/ to dist/ and fills in the Selar checkout URL and price from config.json.
import { readFileSync, writeFileSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'));
const src = join(root, 'src');
const dist = join(root, 'dist');

if (!/^\d{10,20}$/.test(config.metaPixelId || '')) {
  throw new Error(`config.json metaPixelId must be the numeric Meta Pixel ID: ${config.metaPixelId}`);
}
if (!/^https:\/\/selar\.com\/[A-Za-z0-9]+$/.test(config.selarUrl)) {
  throw new Error(`config.json selarUrl is not a Selar product link: ${config.selarUrl}`);
}

rmSync(dist, { recursive: true, force: true });
cpSync(src, dist, { recursive: true });

const tokens = {
  SELAR_URL: config.selarUrl,
  PRICE: config.price,
  PRICE_NOTE: config.priceNote,
  CONTACT_EMAIL: config.contactEmail,
  WHATSAPP: config.whatsApp,
  META_PIXEL_ID: config.metaPixelId,
  PRICE_VALUE: String(config.price).replace(/[^0-9]/g, ''),
  YEAR: String(new Date().getFullYear()),
};

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

for (const file of walk(dist).filter((f) => /\.(html|css|js|txt|xml)$/.test(f))) {
  let text = readFileSync(file, 'utf8');
  text = text.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => {
    if (!(key in tokens)) throw new Error(`Unknown token ${m} in ${file}`);
    return tokens[key];
  });
  writeFileSync(file, text);
}
console.log(`Built dist/ with checkout ${config.selarUrl}`);
