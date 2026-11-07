// One-off: turns the client's original photos into fast-loading WebP files in several widths.
// Usage: node scripts/images.mjs <folder-of-originals>
// Names on memorial inscriptions are blurred for the family's privacy.
import sharp from "sharp";
import { readdirSync, mkdirSync } from "node:fs";
import { join, parse } from "node:path";

const src = process.argv[2];
const out = "src/assets/img";
mkdirSync(out, { recursive: true });
const BLUR = { "white-stone-tombstone": [{ left: 600, top: 670, width: 260, height: 170 }] };
const WIDTHS = [480, 960, 1440];

for (const file of readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const name = parse(file).name;
  let img = sharp(join(src, file)).rotate();
  if (BLUR[name]) {
    const base = await img.toBuffer();
    const patches = await Promise.all(BLUR[name].map(async (r) => ({
      input: await sharp(base).extract(r).blur(18).toBuffer(), left: r.left, top: r.top,
    })));
    img = sharp(await sharp(base).composite(patches).toBuffer());
  }
  const buf = await img.toBuffer();
  const { width, height } = await sharp(buf).metadata();
  for (const w of WIDTHS.filter((w) => w <= width).concat(width < 480 ? [width] : [])) {
    await sharp(buf).resize({ width: w }).webp({ quality: 78 }).toFile(join(out, `${name}-${w}.webp`));
  }
  await sharp(buf).resize({ width: Math.min(1200, width) }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(out, `${name}.jpg`));
  console.log(name, width, height);
}
