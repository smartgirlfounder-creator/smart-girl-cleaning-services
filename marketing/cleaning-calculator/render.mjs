// Renders the walkthrough from stage.html + timeline.mjs + the real captures.
// Usage: node render.mjs stills [t1 t2 ...]   -> stills/*.png
//        node render.mjs cues                 -> cues.json (timing for soundtrack.py)
//        node render.mjs video                -> cleaning-calculator-pro-walkthrough.mp4 (needs soundtrack.wav)
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import timeline from "./timeline.mjs";

const here = process.cwd();
const [mode = "stills", ...rest] = process.argv.slice(2);
const FPS = 30;
const manifest = JSON.parse(readFileSync(join(here, "capture", "manifest.json"), "utf8"));
const TL = timeline(manifest);

if (mode === "cues") {
  const T = TL.stages;
  const cues = {
    duration: TL.duration,
    stages: [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6, T.s7, T.s8, T.s9, T.s10, T.end],
    reveal: 3.3,
    taps: TL.highlights.filter((h) => h.tap).map((h) => h.t0 + 0.1),
    highlights: TL.highlights.map((h) => h.t0),
    cards: [...TL.cards.map((c) => c.t0), ...TL.callouts.filter((c) => !c.values).map((c) => c.t0)],
    counts: TL.callouts.filter((c) => c.values).flatMap((c) => c.values.map((v) => v.t)),
    chips: TL.chips.map((c) => c.t0),
    problems: TL.problems.map((p) => p.strike),
    split: T.s5 + 7.2,
    hero: T.end,
  };
  writeFileSync(join(here, "cues.json"), JSON.stringify(cues, null, 1));
  console.log("cues.json written");
  process.exit(0);
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.addInitScript(([tl, m]) => { window.TIMELINE = tl; window.MANIFEST = m; }, [TL, manifest]);
await page.goto(pathToFileURL(join(here, "stage.html")).href);
await page.evaluate(() => window.ready);
await page.waitForTimeout(400);

if (mode === "stills") {
  mkdirSync(join(here, "stills"), { recursive: true });
  const times = rest.length ? rest.map(Number) : [1.8, 5.5, 9.5, 12.5, 19.5, 27, 30.5, 38, 42, 48.5, 52.5, 57, 63.5, 71, 78.5, 85, 91];
  for (const t of times) {
    await page.evaluate((x) => window.renderAt(x), t);
    await page.screenshot({ path: join(here, "stills", `t${t.toFixed(1).padStart(5, "0")}.png`) });
  }
  console.log("stills written");
} else if (mode === "video") {
  const frames = process.env.FRAMES_DIR ?? join(here, "frames");
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const total = Math.round(TL.duration * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((x) => window.renderAt(x), i / FPS);
    await page.screenshot({ path: join(frames, `f${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 93 });
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  const out = join(here, "cleaning-calculator-pro-walkthrough.mp4");
  execFileSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(FPS), "-i", join(frames, "f%05d.jpg"),
    "-i", join(here, "soundtrack.wav"),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "256k", "-shortest", out,
  ]);
  console.log("Wrote", out);
}
await browser.close();
