// Renders brand/icon.svg into the PNG sizes phones, tablets and laptops need.
// Usage (from academy/): node brand/render-icons.mjs
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const svg = readFileSync(join(process.cwd(), "brand", "icon.svg"), "utf8");
const out = join(process.cwd(), "public", "icons");
mkdirSync(out, { recursive: true });
const base = "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (dir ? join(base, dir, "chrome-linux", "chrome") : undefined) });

// "any" icons get rounded corners baked in; maskable and Apple icons stay full-bleed (the OS rounds them).
const targets = [
  { file: "icon-192.png", size: 192, round: true },
  { file: "icon-512.png", size: 512, round: true },
  { file: "maskable-512.png", size: 512, round: false, safe: true },
  { file: "apple-touch-icon.png", size: 180, round: false },
  { file: "favicon-32.png", size: 32, round: true },
];
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  // Maskable icons keep the full background but shrink the artwork into Android's circular safe zone.
  const inner = t.safe ? svg.replace('<g id="art">', '<g id="art" transform="translate(512 512) scale(0.76) translate(-512 -512)">') : svg;
  await page.setContent(`<html><body style="margin:0;background:transparent"><div style="position:relative;width:${t.size}px;height:${t.size}px;overflow:hidden;border-radius:${t.round ? t.size * 0.22 : 0}px">${inner.replace("<svg ", '<svg width="100%" height="100%" ')}</div></body></html>`);
  await page.screenshot({ path: join(out, t.file), omitBackground: true });
  await page.close();
}
writeFileSync(join(out, "icon.svg"), svg);
await browser.close();
console.log("Icons written to public/icons");
