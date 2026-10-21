// Draws the "before" and "after" sample images for the delivery report demo,
// using the Smart Sweep bathroom illustration (clearly an illustration, not a real job photo).
import { chromium } from "playwright-core";
const [sceneModule] = process.argv.slice(2);
const { renderBathroom } = await import(sceneModule);
const clean = new Set(["vent", "bin", "mirror", "sink", "shower", "touch", "bowl", "toiletclean", "stock", "floor"]);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 800, height: 560 } });
for (const [name, flags] of [["before", new Set()], ["after", clean]]) {
  await page.setContent(`<body style="margin:0">${renderBathroom(flags).replace("<svg ", '<svg width="800" height="560" ')}</body>`);
  await page.screenshot({ path: `assets/sample-${name}.jpg`, type: "jpeg", quality: 90 });
}
// A simple logo for the fictional sample business "Sparkle Pros Cleaning".
const logo = await browser.newPage({ viewport: { width: 520, height: 200 } });
await logo.setContent(`<body style="margin:0;background:transparent">
  <div style="display:flex;align-items:center;gap:18px;width:520px;height:200px;font-family:Arial,Helvetica,sans-serif">
    <svg width="150" height="150" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#0f766e"/><path d="M50 18 C53 40 60 47 82 50 C60 53 53 60 50 82 C47 60 40 53 18 50 C40 47 47 40 50 18Z" fill="#fff"/><circle cx="74" cy="26" r="6" fill="#facc15"/></svg>
    <div style="line-height:1"><div style="font-size:52px;font-weight:800;color:#0f766e">Sparkle</div><div style="font-size:38px;font-weight:700;color:#334155;letter-spacing:.06em">PROS</div></div>
  </div></body>`);
await logo.screenshot({ path: "assets/sample-logo.png", omitBackground: true });
await browser.close();
console.log("assets/sample-before.jpg, assets/sample-after.jpg, assets/sample-logo.png");
