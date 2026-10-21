// Captures real screens from the built Academy (dist/) for the launch teaser.
// Usage (from academy/): npm run build && node marketing/teaser/capture-screens.mjs
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "marketing", "teaser", "screens");
mkdirSync(OUT, { recursive: true });
const PORT = 4181;
const base = "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const executablePath = process.env.CHROMIUM_PATH ?? (dir ? join(base, dir, "chrome-linux", "chrome") : undefined);

const server = spawn(join(process.cwd(), "node_modules", ".bin", "vite"), ["preview", "--port", String(PORT), "--strictPort"], { stdio: "pipe" });
await new Promise((r) => server.stdout.on("data", (d) => String(d).includes(String(PORT)) && r()));
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });

const shot = async (name) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
};
const tap = (id) => page.click(`.scene [data-obj="${id}"]`);
const use = async (tool, product, obj) => {
  await page.click('[data-action="tab"][data-id="tools"]');
  await page.click(`[data-action="hold"][data-id="${tool ?? ""}"]`);
  await page.click('[data-action="tab"][data-id="products"]');
  await page.click(`[data-action="load"][data-id="${product ?? ""}"]`);
  await tap(obj);
};
const blur = () => page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());

try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector(".home");
  await page.waitForTimeout(800);
  await shot("home");
  await page.screenshot({ path: join(OUT, "home-full.png"), fullPage: true });

  const objects = ["vent", "bin", "mirror", "sink", "shower", "touch", "toilet", "supplies", "floor"];
  const startBathroom = async () => {
    await page.goto(`http://localhost:${PORT}/`);
    await page.click('[data-action="rooms"] >> nth=0');
    await page.click('[data-action="briefing"][data-id="bathroom-basics"]');
    await page.click('[data-action="start"]');
    for (const o of objects) await tap(o);
    await page.click('[data-action="to-ppe"]');
    for (const p of ["gloves", "eye-protection", "apron"]) await page.click(`[data-action="ppe"][data-id="${p}"]`);
    await page.click('[data-action="equip"]');
  };

  // A real cleaning run, captured step by step.
  await startBathroom();
  await use(null, null, "vent");
  await page.click('[data-action="tab"][data-id="tools"]');
  await page.click('[data-action="hold"][data-id="cloth-blue"]');
  await page.click('[data-action="tab"][data-id="products"]');
  await page.click('[data-action="load"][data-id="glass-cleaner"]');
  await blur();
  await shot("clean-1");
  await tap("mirror");
  await blur();
  await page.waitForTimeout(700);
  await shot("clean-2");
  await use("bin-liner", null, "bin");
  await use(null, "toilet-cleaner", "toilet");
  await use("cloth-yellow", "bathroom-cleaner", "sink");
  await use("scrub-pad", "bathroom-cleaner", "shower");
  await blur();
  await page.waitForTimeout(700);
  await shot("clean-3");
  await use("cloth-blue", "disinfectant", "touch");
  await use("toilet-brush", null, "toilet");
  await use("cloth-red", "disinfectant", "toilet");
  await use("refill", null, "supplies");
  await use("wet-sign", null, "floor");
  await use("mop", "floor-cleaner", "floor");
  for (const o of objects) await tap(o);
  await blur();
  await page.waitForTimeout(700);
  await shot("clean-4");
  await page.click('[data-action="finish"]');
  await page.waitForSelector(".results");
  await page.waitForTimeout(500);
  await shot("results");

  // A real safety stop: the red toilet cloth on the sink.
  await startBathroom();
  await use(null, null, "vent");
  await use("cloth-red", "bathroom-cleaner", "sink");
  await blur();
  await page.waitForTimeout(700);
  await shot("safety-stop");
  console.log("Screens saved to", OUT);
} finally {
  await browser.close();
  server.kill();
}
