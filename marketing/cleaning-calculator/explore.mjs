// Unlocks the Cleaning Calculator with sample data and screenshots every tab (phone size).
// Usage: node explore.mjs <path-to-unzipped-calculator>
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const root = process.argv[2];
mkdirSync("explore", { recursive: true });
const server = spawn("python3", ["-m", "http.server", "4200", "--bind", "127.0.0.1"], { cwd: root, stdio: "pipe" });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
process.on("exit", () => server.kill());
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const logs = [];
page.on("pageerror", (e) => logs.push(`pageerror: ${e}`));
page.on("dialog", (d) => { logs.push(`dialog: ${d.message()}`); d.dismiss(); });
await page.goto("http://127.0.0.1:4200/index.html");
await page.fill("#gateName", "Demo User");
await page.fill("#gateCode", "SG-48291");
await page.click("text=Unlock Calculator");
await page.waitForTimeout(800);
const report = {};
const tabs = ["setup", "pricing", "calculator", "invoice", "delivery", "history", "proposal", "dashboard"];
for (const t of tabs) {
  await page.evaluate((x) => document.querySelector(`.tab-btn[onclick*="'${x}'"]`).click(), t);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `explore/${t}.png`, fullPage: true });
  report[t] = await page.evaluate(() => {
    const vis = (e) => e.offsetParent !== null;
    return {
      buttons: [...document.querySelectorAll("button")].filter(vis).map((b) => b.textContent.trim().replace(/\s+/g, " ")).filter(Boolean).slice(0, 60),
      height: document.documentElement.scrollHeight,
    };
  });
}
writeFileSync("explore/report.json", JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 0).slice(0, 6000));
console.log(logs.join("\n"));
await browser.close();
server.kill();
