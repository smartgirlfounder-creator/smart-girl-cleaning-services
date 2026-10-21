// Expert Pass flow with payments switched on, against the in-memory backend.
// Usage: npm run e2e:payments
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = 4182;
const APP = `http://localhost:${PORT}/`;
const base = "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
let failures = 0;
const check = (c, m) => {
  console.log(`  ${c ? "✓" : "✗"} ${m}`);
  if (!c) failures++;
};

const server = spawn(join(process.cwd(), "node_modules", ".bin", "vite"), ["preview", "--outDir", "dist-pay", "--port", String(PORT), "--strictPort"], { stdio: "pipe" });
await new Promise((r) => server.stdout.on("data", (d) => String(d).includes(String(PORT)) && r()));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (dir ? join(base, dir, "chrome-linux", "chrome") : undefined) });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  // Pretend the player has passed every Beginner and Professional mission on this device.
  await page.goto(APP);
  await page.evaluate(() => {
    const passed = { attempts: 1, bestScore: 90, bestStars: 3, passed: true, lastPlayed: new Date().toISOString() };
    const missions = Object.fromEntries(["bathroom-basics", "chemical-safety", "final-inspection", "kitchen-pro"].map((id) => [id, passed]));
    localStorage.setItem("smart-cleaners-academy:v1", JSON.stringify({ version: 1, missions, achievements: {}, playerName: "" }));
  });
  await page.goto(APP);
  await page.click('[data-action="rooms"] >> nth=0');
  await page.click('[data-action="briefing"][data-id="hotel-turnover"]');
  check(await page.isVisible(".paywall"), "Expert mission shows the Expert Pass offer instead of Start");
  check((await page.textContent(".paywall .price")).includes("₦20,000"), "price shown in naira by default");
  await page.click('[data-action="currency"][data-id="USD"]');
  check((await page.textContent(".paywall .price")).includes("$20"), "switching to dollars shows $20");
  check(await page.isVisible('[data-key="pay-signin"]'), "signed-out players are asked to sign in first");
  await page.screenshot({ path: "e2e/screenshots/paywall.png", fullPage: true });

  await page.click('[data-key="pay-signin"]');
  await page.click('[data-action="auth-tab"][data-id="signup"]');
  await page.fill("#auth-name", "Bola Buyer");
  await page.fill("#auth-email", "bola@test.com");
  await page.fill("#auth-password", "cleaning123");
  await page.click('[data-key="auth-submit"]');
  await page.waitForSelector(".account-card");
  await page.click('[data-action="home"]');
  await page.click('[data-action="rooms"] >> nth=0');
  await page.click('[data-action="briefing"][data-id="professional-judgement"]');
  await page.click('[data-action="buy-pass"]');
  await page.waitForSelector("text=Your Expert Pass is active");
  check(true, "returning from checkout confirms the payment");
  check(!page.url().includes("reference="), "payment reference is cleared from the address bar");
  check((await page.textContent(".account-card ~ .notice-box, .notice-box >> nth=1")).includes("active until"), "account page shows the pass and its end date");
  await page.click('[data-action="home"]');
  await page.click('[data-action="rooms"] >> nth=0');
  await page.click('[data-action="briefing"][data-id="hotel-turnover"]');
  check(await page.isVisible('[data-action="start"]'), "with the pass, Expert missions can be started");
  check(!(await page.isVisible(".paywall")), "no offer shown once the pass is active");
  await page.click('[data-action="briefing"][data-id="bathroom-basics"]').catch(() => undefined);
  await page.goto(APP);
  await page.click('[data-action="rooms"] >> nth=0');
  await page.click('[data-action="briefing"][data-id="bathroom-basics"]');
  check(await page.isVisible('[data-action="start"]'), "Beginner missions stay free");
  check(errors.length === 0, `no errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
