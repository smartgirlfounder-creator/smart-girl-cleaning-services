// Business edition journey against the in-memory backend (build with VITE_CLOUD=mock).
// Usage: npm run e2e:business
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PORT = 4180;
const APP_URL = `http://localhost:${PORT}/`;
const SHOTS = join(process.cwd(), "e2e", "screenshots");
mkdirSync(SHOTS, { recursive: true });

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = "/opt/pw-browsers";
  const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
  return dir ? join(base, dir, "chrome-linux", "chrome") : undefined;
}

let failures = 0;
const check = (cond, msg) => {
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
};

const server = spawn(join(process.cwd(), "node_modules", ".bin", "vite"), ["preview", "--outDir", "dist-mock", "--port", String(PORT), "--strictPort"], { stdio: "pipe" });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("preview server did not start")), 20000);
  server.stdout.on("data", (d) => String(d).includes(String(PORT)) && (clearTimeout(t), resolve()));
});
const browser = await chromium.launch({ executablePath: chromiumPath() });

async function run(label, viewport) {
  console.log(`\n${label} (${viewport.width}×${viewport.height})`);
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  const shot = (n) => page.screenshot({ path: join(SHOTS, `${label}-biz-${n}.png`), fullPage: true });
  const noOverflow = async (where) => {
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(o <= 0, `no sideways scrolling on ${where}`);
  };
  const notice = () => page.textContent(".notice-box");
  const signUp = async (name, email) => {
    await page.click('[data-action="auth-tab"][data-id="signup"]');
    await page.fill("#auth-name", name);
    await page.fill("#auth-email", email);
    await page.fill("#auth-password", "cleaning123");
    await page.click('[data-key="auth-submit"]');
    await page.waitForSelector(".account-card");
  };
  const signIn = async (email) => {
    await page.goto(APP_URL);
    await page.click('[data-action="account"]');
    await page.fill("#auth-email", email);
    await page.fill("#auth-password", "cleaning123");
    await page.click('[data-key="auth-submit"]');
    await page.waitForSelector(".account-card");
  };
  const signOut = async () => {
    await page.click('[data-action="home"]').catch(() => undefined);
    await page.click('[data-action="account"]');
    await page.click('[data-action="sign-out"]');
    await page.waitForSelector("#auth-email");
  };

  // Owner creates a business
  await page.goto(APP_URL);
  await page.waitForSelector(".account-chip");
  check((await page.textContent(".account-chip")).includes("Sign in"), "home shows a Sign in button");
  await page.click('[data-action="account"]');
  await page.click('[data-action="auth-tab"][data-id="signup"]');
  await page.click('[data-key="auth-submit"]');
  check((await notice()).includes("Enter your email"), "empty sign-up is refused with a clear message");
  await signUp("Grace Owner", "owner@test.com");
  check((await notice()).includes("Welcome"), "owner account created");
  await noOverflow("account");
  await page.click('[data-action="team"]');
  await page.fill("#org-name", "Sparkle Pros Ltd");
  await page.click('[data-key="create-org"]');
  await page.waitForSelector("#team-code");
  const code = (await page.textContent("#team-code")).trim();
  check(/^[A-Z2-9]{6}$/.test(code), `business created with team code ${code}`);
  await page.click('[data-action="copy-invite"]');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  check(copied.includes(`?join=${code}`), "invite message copied with the join link");
  await signOut();

  // Staff joins with the invite link
  await page.goto(`${APP_URL}?join=${code}`);
  await page.waitForSelector("#auth-name");
  check((await notice()).includes("join your team"), "invite link asks the new staff member to create an account");
  await page.fill("#auth-name", "Ada Staff");
  await page.fill("#auth-email", "ada@test.com");
  await page.fill("#auth-password", "cleaning123");
  await page.click('[data-key="auth-submit"]');
  await page.waitForSelector("#join-code");
  check((await page.inputValue("#join-code")) === code, "team code is filled in from the link");
  await page.click('[data-key="join-org"]');
  await page.waitForSelector("text=Assigned to you");
  check((await notice()).includes("Sparkle Pros Ltd"), "staff joined the team");
  await signOut();

  // Owner assigns training
  await signIn("owner@test.com");
  await page.click('[data-action="team"]');
  await page.waitForSelector(".member-list");
  check((await page.locator(".member").count()) === 2, "owner sees both team members");
  await page.selectOption("#assign-mission", "chemical-safety");
  await page.fill("#assign-due", "2099-12-31");
  await page.click('[data-key="assign"]');
  await page.waitForSelector(".assign");
  check((await page.textContent(".assign")).includes("0/1"), "assignment shows 0 of 1 done");
  await noOverflow("team (owner)");
  await signOut();

  // Staff completes the assignment
  await signIn("ada@test.com");
  await page.click('[data-action="team"]');
  await page.waitForSelector(".assign");
  check((await page.textContent(".assign")).includes("To do"), "staff sees the assigned mission");
  await page.click('.assign [data-action="briefing"]');
  check(await page.isVisible("text=Pass Professional Bathroom Cleaning to unlock"), "an assigned mission stays locked until the mission before it is passed");
  await page.evaluate(() => {
    const key = "smart-cleaners-academy:v1";
    const d = JSON.parse(localStorage.getItem(key) ?? '{"version":1,"missions":{},"achievements":{},"playerName":""}');
    d.missions["bathroom-basics"] = { attempts: 1, bestScore: 90, bestStars: 3, passed: true, lastPlayed: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(d));
  });
  await page.reload();
  await page.click('[data-action="team"]');
  await page.waitForSelector(".assign");
  await page.click('.assign [data-action="briefing"]');
  await page.click('[data-action="start"]');
  const answers = [["choose", "set-aside"], ["choose", "100"], ["choose", "one"], ["multi", ["bleach-ammonia", "bleach-acid", "bleach-vinegar"]],
    ["match", { mirror: "glass-cleaner", marble: "neutral", screen: "limescale", handle: "disinfectant" }], ["multi", ["gloves", "eyes"]],
    ["choose", "locked"], ["choose", "move"], ["choose", "report"], ["choose", "rinse"]];
  for (const [type, a] of answers) {
    if (type === "choose") await page.click(`[data-action="choose"][data-id="${a}"]`);
    if (type === "multi") { for (const o of a) await page.click(`[data-action="toggle"][data-id="${o}"]`); await page.click('[data-action="submit-answer"]'); }
    if (type === "match") { for (const [r, c] of Object.entries(a)) await page.click(`[data-action="match"][data-id="${r}"][data-choice="${c}"]`); await page.click('[data-action="submit-answer"]'); }
    await page.click('[data-action="next-scenario"]');
  }
  await page.waitForSelector("text=Saved to your training record.");
  check(true, "result saved to the staff member's training record");
  await page.click('[data-action="home"]');
  await page.click('[data-action="team"]');
  await page.waitForSelector(".record");
  check((await page.textContent(".assign")).includes("Done"), "assignment now shows Done");
  check((await page.textContent(".record-list")).includes("Chemical and Equipment Safety"), "mission appears in the training record");
  await shot("staff");
  await noOverflow("team (staff)");
  await signOut();

  // Platform admin
  await page.click('[data-action="auth-tab"][data-id="signup"]');
  await page.fill("#auth-name", "Olaitan");
  await page.fill("#auth-email", "smartgirlfounder@gmail.com");
  await page.fill("#auth-password", "cleaning123");
  await page.click('[data-key="auth-submit"]');
  await page.waitForSelector(".account-card");
  check((await page.textContent(".account-card")).includes("Academy admin"), "your email is recognised as the Academy admin");
  await page.click('[data-action="admin"]');
  await page.waitForSelector(".table");
  check((await page.textContent(".stat-tile >> nth=0")).includes("3"), "admin sees all 3 accounts");
  check((await page.textContent(".table")).includes("ada@test.com") && (await page.textContent(".table")).includes("Sparkle Pros Ltd"), "admin sees who signed up and their business");
  check((await page.textContent(".record-list")).includes("Ada Staff"), "admin sees recent activity");
  await noOverflow("admin");
  await shot("admin");
  await signOut();

  // Owner sees progress and downloads the report
  await signIn("owner@test.com");
  check(!(await page.isVisible('[data-action="admin"]')), "business owners don't get the admin dashboard");
  await page.click('[data-action="team"]');
  await page.waitForSelector(".member-list");
  check((await page.textContent(".assign")).includes("1/1"), "owner sees the assignment completed");
  check((await page.textContent(".member-list")).includes("Chemical safety · 100"), "owner sees the staff member's best score");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click('[data-action="download-report"]')]);
  const csv = readFileSync(await download.path(), "utf8");
  check(csv.includes("Ada Staff") && csv.includes("100 (passed)"), "training report downloads with the right data");
  await shot("owner");

  // Wrong password
  await signOut();
  await page.fill("#auth-email", "owner@test.com");
  await page.fill("#auth-password", "wrong-password");
  await page.click('[data-key="auth-submit"]');
  await page.waitForSelector(".notice-box");
  check((await notice()).includes("don't match"), "wrong password gives a clear message");

  // Progress follows the account: play signed out, sign up, then "switch device".
  await page.evaluate(() => {
    const passed = { attempts: 1, bestScore: 90, bestStars: 3, passed: true, lastPlayed: new Date().toISOString() };
    localStorage.setItem("smart-cleaners-academy:v1", JSON.stringify({ version: 1, missions: { "bathroom-basics": passed, "chemical-safety": passed }, achievements: {}, playerName: "" }));
  });
  await page.goto(APP_URL);
  await page.waitForSelector(".save-banner");
  check(true, "signed-out players with progress are reminded to sign in to save it");
  await page.click('[data-key="save-banner"]');
  await signUp("Sam Learner", "sam@test.com");
  check((await notice()).includes("saved 2 missions from this device"), "signing up saves this device's progress to the account");
  await page.evaluate(() => localStorage.removeItem("smart-cleaners-academy:v1")); // a new phone: no local progress
  await page.goto(APP_URL);
  await signOut();
  await signIn("sam@test.com");
  await page.click('[data-action="home"]');
  check((await page.textContent(".home")).includes("2 of 6 training missions passed"), "signing in on another device restores the progress");
  await page.click('[data-action="play-training"] >> nth=0');
  check(await page.isVisible("text=Final Inspection and Quality Control"), "and continues from the next mission");

  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();
}

try {
  await run("mobile", { width: 390, height: 844 });
  await run("desktop", { width: 1280, height: 860 });
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
