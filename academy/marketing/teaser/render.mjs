// Renders the teaser frame by frame from stage.html, then encodes it with ffmpeg.
// Usage (from academy/marketing/teaser):
//   node render.mjs stills            -> a few preview PNGs
//   node render.mjs video [today|here] -> frames + soundtrack -> MP4
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const here = process.cwd();
const [mode = "stills", ending = "today"] = process.argv.slice(2);
const FPS = 30;
const DURATION = 18.5;
const FRAMES = process.env.FRAMES_DIR ?? join(here, "frames");
const base = "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const executablePath = process.env.CHROMIUM_PATH ?? (dir ? join(base, dir, "chrome-linux", "chrome") : undefined);

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(`${pathToFileURL(join(here, "stage.html")).href}${ending === "here" ? "?end=here" : ""}`);
await page.evaluate(() => window.ready);
await page.waitForTimeout(500);

if (mode === "stills") {
  mkdirSync(join(here, "stills"), { recursive: true });
  for (const t of [1.6, 3.6, 5.6, 7.9, 9.4, 11.0, 14.5, 17.2]) {
    await page.evaluate((x) => window.renderAt(x), t);
    await page.screenshot({ path: join(here, "stills", `t${t.toFixed(1)}.png`) });
  }
} else {
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  const total = Math.round(DURATION * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((x) => window.renderAt(x), i / FPS);
    await page.screenshot({ path: join(FRAMES, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 95 });
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  const outName = ending === "here" ? "smart-cleaners-academy-teaser-its-here.mp4" : "smart-cleaners-academy-teaser.mp4";
  execFileSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(FPS), "-i", join(FRAMES, "f%04d.jpg"),
    "-i", join(here, "soundtrack.wav"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "256k", "-shortest",
    join(here, outName),
  ]);
  console.log("Wrote", outName);
}
await browser.close();
