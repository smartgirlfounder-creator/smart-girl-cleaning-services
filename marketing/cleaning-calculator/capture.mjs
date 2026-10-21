// Plays the real Cleaning Calculator Pro workflow with clearly marked sample data and saves
// every screen (phone width, 2x) plus the positions of key elements, for the walkthrough video.
// Usage: node capture.mjs <path-to-unzipped-calculator>
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Pass the unzipped calculator folder");
const OUT = "capture";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4200", "--bind", "127.0.0.1"], { cwd: root, stdio: "pipe" });
process.on("exit", () => server.kill());
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
page.setDefaultTimeout(8000);
const notes = [];
page.on("dialog", (d) => { notes.push(`alert: ${d.message()}`); d.accept(); });
page.on("popup", (p) => p.close());
page.on("pageerror", (e) => notes.push(`pageerror: ${e}`));

const manifest = { shots: {}, facts: {}, notes };

/** Finds an element by CSS selector or by visible text, returning its box in page coordinates. */
async function box(target) {
  return page.evaluate((t) => {
    let el = null;
    if (t.startsWith("text:")) {
      const want = t.slice(5).toLowerCase();
      const all = [...document.querySelectorAll("h1,h2,h3,button,label,span,div,p,a,strong")].filter((e) => e.offsetParent !== null && e.textContent.trim().toLowerCase().startsWith(want));
      el = all.sort((a, b) => a.textContent.length - b.textContent.length)[0] ?? null;
    } else el = [...document.querySelectorAll(t)].find((e) => e.offsetParent !== null) ?? null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  }, target);
}

/** Saves the whole page (fixed menu hidden), the bottom menu on its own, and the named anchors. */
async function shot(id, anchors = {}) {
  await page.waitForTimeout(350);
  await page.addStyleTag({ content: "#ccpBottomNav, #sg-open { visibility: hidden !important; }" }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  const a = {};
  for (const [name, target] of Object.entries(anchors)) {
    const b = await box(target);
    if (b) a[name] = b;
    else notes.push(`missing anchor ${id}.${name} (${target})`);
  }
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/${id}.png`, fullPage: true });
  await page.evaluate(() => document.querySelectorAll("style").forEach((s) => s.textContent.includes("#ccpBottomNav, #sg-open") && s.remove()));
  await page.locator("#ccpBottomNav").screenshot({ path: `${OUT}/${id}-nav.png` });
  manifest.shots[id] = { file: `${id}.png`, nav: `${id}-nav.png`, height, anchors: a };
  console.log("captured", id);
}

const tab = (t) => page.evaluate((x) => document.querySelector(`.tab-btn[onclick*="'${x}'"]`).click(), t);
const change = (sel) => page.dispatchEvent(sel, "change");

// ---- Unlock (the access code from the product's own README) ----
await page.goto("http://127.0.0.1:4200/index.html");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/lock.png` });
await page.fill("#gateName", "Ada Okafor");
await page.fill("#gateCode", "SG-48291");
await page.click("text=Unlock Calculator");
await page.waitForTimeout(600);

// ---- Stage 1: Setup ----
const setupAnchors = { business: "text:👤 Business Details", bizName: "#bizName", currency: "#curr", bank: "text:🏦 Bank Details", downPay: "#downPayPct", terms: "text:📜 Terms", signature: "text:✍️ Authorized Signature", sigName: "#signatureName" };
await shot("setup-empty", setupAnchors);
await page.fill("#bizName", "Sparkle Pros Cleaning");
await page.fill("#ownerName", "Ada Okafor");
await page.fill("#bizPhone", "0801 234 5678");
await page.fill("#bizEmail", "hello@sparklepros.example");
await page.fill("#bankName", "Demo Bank");
await page.fill("#accName", "Sparkle Pros Cleaning");
await page.fill("#accNum", "0123456789");
await page.fill("#signatureName", "Ada Okafor");
await page.setInputFiles("#bizLogoFile", resolve("assets/sample-logo.png"));
for (const s of ["#bizName", "#ownerName", "#bankName", "#accName", "#accNum", "#signatureName"]) await change(s);
await shot("setup", setupAnchors);

// ---- Stage 2: Pricing ----
await tab("pricing");
await shot("pricing", {
  title: "text:💰 Your Pricing Settings",
  staff: "text:Default Staff & Feeding Costs",
  staffPay: "#defaultStaffPay",
  feeding: "#defaultFeeding",
  regular: "text:Regular Cleaning",
  deep: "text:Deep Cleaning",
  uphol: "text:Upholstery",
  carpet: "text:Carpet Cleaning",
});

// ---- Stages 3–5: the calculator ----
await tab("calculator");
await page.fill("#cName", "Mrs. Bola Adeyemi");
await page.fill("#cPhone", "0802 345 6789");
await page.fill("#cAddr", "14 Palm Grove Close, Lekki");
for (const s of ["#cName", "#cPhone", "#cAddr"]) await change(s);
const calcAnchors = {
  client: "text:👤 Client Details",
  job: "text:🏠 Job Details",
  type: "#type",
  bed: "#bedNum",
  staffNum: "#staffNum",
  difficulty: "#difficultyMult",
  costs: "text:💰 Additional Costs",
  trans: "#trans",
  profit: "#profit",
  services: "text:🧾 Services on this quote",
  addService: "text:➕ Add this service",
  yourView: "text:👀 YOUR VIEW",
  subtotal: "#subTotal",
  quote: "#qBizName",
  total: "#totalCost",
  down: "#downCost",
  pdf: "text:📄 Print / Save PDF",
  whatsapp: "text:💬 Share via WhatsApp",
  save: "text:💾 Save This Quote to History",
};
const totals = async () => ({
  total: await page.$eval("#totalCost", (e) => e.textContent),
  staff: await page.$eval("#staffCost", (e) => e.textContent),
  subtotal: await page.$eval("#subTotal", (e) => e.textContent),
});
await shot("calc-0", calcAnchors);
manifest.facts["calc-0"] = await totals();
await page.selectOption("#type", "deep");
await shot("calc-1", calcAnchors);
manifest.facts["calc-1"] = await totals();
await page.click("button[onclick='adjustBed(1)']");
await shot("calc-2", calcAnchors);
manifest.facts["calc-2"] = await totals();
await page.click("button[onclick='adjustStaff(1)']");
await shot("calc-3", calcAnchors);
manifest.facts["calc-3"] = await totals();
await page.fill("#difficultyMult", "1.2");
await change("#difficultyMult");
await shot("calc-4", calcAnchors);
manifest.facts["calc-4"] = await totals();
await page.click("text=➕ Add this service to the quote");
await page.selectOption("#type", "uphol");
await page.fill("#trans", "0");
await change("#trans");
await page.click("text=➕ Add this service to the quote");
await shot("calc-5", { ...calcAnchors, item1: "text:1. Deep Cleaning", item2: "text:2. Upholstery Cleaning", quoteTotal: "text:Quote total", servicesQuoted: "text:Services Quoted", payment: "text:🏦 Payment Details" });
manifest.facts["calc-5"] = await totals();
await page.click("text=💾 Save This Quote to History");

// ---- History: mark the quote as sent, with a follow-up date ----
await tab("history");
const status = page.locator("#history select").first();
await status.selectOption("sent");
await page.waitForTimeout(300);
await shot("history-sent", { title: "text:🕓 History", filters: "text:Follow-up due", card: "text:Mrs. Bola Adeyemi", status: "#history select", followUp: "#history input[type=date]" });

// ---- Invoice ----
await tab("invoice");
await page.click("text=↻ Load from Calculator");
await page.fill("#invAmountReceived", "148200");
await page.dispatchEvent("#invAmountReceived", "input");
await change("#invAmountReceived");
await page.selectOption("#invPaymentMethod", "bank-transfer");
await shot("invoice-form", { details: "text:📋 Invoice Details", number: "#invNum", client: "text:👤 Client Information", payment: "text:💰 Payment Information", total: "#invTotal", received: "#invAmountReceived", method: "#invPaymentMethod", balance: "#invBalance", generate: "text:✓ Generate Invoice" });
await page.click("text=✓ Generate Invoice");
await shot("invoice", { amountDue: "text:Total Amount Due", received: "text:Amount Received:", balance: "text:Balance Due", pdf: "text:📄 Print / Save PDF" });

// ---- Delivery report ----
await tab("delivery");
await page.click("text=⬆ Load from Calculator");
const files = page.locator("#delivery input[type=file]");
await page.locator("#delivery input[placeholder='e.g. Living Room']").first().fill("Bathroom");
await files.nth(0).setInputFiles(resolve("assets/sample-before.jpg"));
await files.nth(1).setInputFiles(resolve("assets/sample-after.jpg"));
await page.waitForTimeout(500);
await shot("delivery-form", { details: "text:📦 Job Completion Details", photos: "text:📸 Before & After Photos", generate: "text:✓ Generate Delivery Report" });
await page.click("text=✓ Generate Delivery Report");
await page.waitForTimeout(600);
await shot("delivery", { report: "#delDispBizName", gallery: "#delGallery", whatsapp: "text:💬 Share", review: "text:⭐ Request" });

// ---- History after invoicing (invoicing marks the quote Accepted) ----
await tab("history");
await shot("history-accepted", { card: "text:Mrs. Bola Adeyemi", status: "#history select" });

// ---- Dashboard ----
await tab("dashboard");
await shot("dashboard", { title: "text:📈 Business Dashboard", quoted: "text:MONEY QUOTED", won: "text:JOBS WON", revenue: "text:REVENUE RECEIVED", outstanding: "text:OUTSTANDING BALANCES", followups: "text:FOLLOW-UPS DUE", chart: "text:Revenue — last 6 months" });

// ---- Proposal generator ----
await tab("proposal");
await shot("proposal-home", { title: "text:📑 Proposal Generator", start: "text:+ New proposal" });
await page.click("text=+ New proposal");
await shot("proposal-1", { steps: "text:🏢 Facility type", heading: "text:🏢 1. Facility type", corporate: "text:Corporate office", hotel: "text:Hotel" });

writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(JSON.stringify(manifest.facts, null, 1));
console.log(notes.join("\n"));
await browser.close();
process.exit(0);
