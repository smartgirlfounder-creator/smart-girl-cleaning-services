// Plays the 3D bathroom mission in a real browser and checks the cleaner really does the work:
// walks, picks up and carries equipment, cleans (dirt goes), gets things wrong (with the
// BAM-BAM-BAM! WRONG! feedback), stops for safety, and finishes the mission.
// Usage: npm run build && npm run e2e:3d
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = 4183;
const APP_URL = `http://localhost:${PORT}/`;
const SHOTS = new URL("./screenshots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = "/opt/pw-browsers";
  const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
  return dir ? join(base, dir, "chrome-linux", "chrome") : undefined;
}

let failures = 0;
function check(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    failures++;
    console.log(`  ✗ ${msg}`);
  }
}

const server = spawn(join(process.cwd(), "node_modules", ".bin", "vite"), ["preview", "--port", String(PORT), "--strictPort"], { stdio: "pipe" });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("preview server did not start")), 20000);
  server.stdout.on("data", (d) => {
    if (String(d).includes(String(PORT))) {
      clearTimeout(t);
      resolve();
    }
  });
});

const browser = await chromium.launch({ executablePath: chromiumPath(), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function run(label, viewport, full, mistakes) {
  console.log(`\n${label} (${viewport.width}×${viewport.height})`);
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 600 });
  // Animations play 4× faster in the test.
  await context.addInitScript(() => localStorage.setItem("smart-sweep:speed", "4"));
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !/supabase|Failed to load resource: net::/i.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  const shot = (name) => page.screenshot({ path: `${SHOTS}3d-${label}-${name}.png` });
  const w = (fn, arg) => page.evaluate(fn, arg);
  const idle = () => page.waitForFunction(() => !window.__smartSweep3d.busy, null, { timeout: 60000 });
  const busy = () => page.waitForFunction(() => window.__smartSweep3d.busy, null, { timeout: 5000 });
  const pos = () => w(() => { const p = window.__smartSweep3d.char.root.position; return { x: p.x, z: p.z }; });
  const level = (k) => w((k) => window.__smartSweep3d.room.level[k], k);
  const held = () => w(() => ({ r: window.__smartSweep3d.char.heldR?.name ?? null, l: window.__smartSweep3d.char.heldL?.name ?? null }));
  const sounds = () => w(() => [...window.__smartSweep3d.sfx.log]);
  const fb = () => page.locator(".feedback").first().textContent();
  const openList = () => page.evaluate(() => document.querySelectorAll("details.areas").forEach((d) => (d.open = true)));
  const tap = async (id) => {
    await openList();
    await page.click(`[data-action="tap"][data-id="${id}"]`);
    await idle();
  };
  const tapScene = async (id) => {
    const p = await w((id) => window.__smartSweep3d.screenPoint(id), id);
    await page.mouse.click(p.x, p.y);
  };
  const hold = async (id) => {
    await page.click('[data-action="tab"][data-id="tools"]');
    await page.click(`[data-action="hold"][data-id="${id ?? ""}"]`);
    await idle();
  };
  const load = async (id) => {
    await page.click('[data-action="tab"][data-id="products"]');
    await page.click(`[data-action="load"][data-id="${id ?? ""}"]`);
    await idle();
  };
  const use = async (tool, product, obj) => {
    await hold(tool);
    await load(product);
    await tap(obj);
  };

  await page.goto(APP_URL);
  await page.click('[data-action="play-training"] >> nth=0');
  await page.click('[data-action="start"]');
  await page.waitForSelector(".world3d canvas");
  check(await page.isVisible("text=Before you start: choose your cleaner"), "the cleaner is chosen before the 3D room opens");
  await page.click('[data-action="avatar-gender"][data-id="female"]');
  await page.click('[data-action="avatar-hair"][data-id="braids"]');
  await page.click('[data-action="avatar-uniform"][data-id="maroon"]');
  await page.waitForTimeout(300);
  await shot("01-choose");
  await page.click('[data-action="avatar-done"]');
  check(await page.isVisible("text=Step 1: Inspect the room"), "inspection starts");

  // Inspection: the cleaner walks over to each area. One by tapping the 3D scene itself.
  const start = await pos();
  await tapScene("mirror");
  await busy();
  await page.waitForTimeout(500);
  const mid = await pos();
  check(Math.hypot(mid.x - start.x, mid.z - start.z) > 0.2, "tapping the 3D mirror makes the cleaner walk");
  await idle();
  const there = await pos();
  check(Math.hypot(there.x + 0.4, there.z + 1.6) < 0.1, "the cleaner arrives in front of the mirror");
  check((await fb()).includes("Mirror"), "the inspection note appears when they've looked");
  await shot("02-inspect");
  for (const o of ["vent", "bin", "sink", "shower", "touch", "toilet", "supplies", "floor"]) await tap(o);
  await page.click('[data-action="to-ppe"]');
  for (const p of ["gloves", "eye-protection", "apron"]) await page.click(`.ppe-grid [data-id="${p}"]`);
  await page.click('[data-action="equip"]');
  check(await page.isVisible("text=Step 3: Clean"), "PPE on, cleaning starts in 3D");
  await page.waitForSelector(".world3d canvas");
  check(await w(() => window.__smartSweep3d.char.root.getObjectByName ? true : false), "the 3D cleaner is in the room");

  // Picking up: walks to the trolley, the cloth ends up in the hand.
  await page.click('[data-action="tab"][data-id="tools"]');
  await page.click('[data-action="hold"][data-id="toilet-brush"]');
  await busy();
  await page.waitForFunction(() => window.__smartSweep3d.char.heldR?.name === "tool:toilet-brush", null, { timeout: 20000 });
  const atTrolley = await pos();
  check(Math.hypot(atTrolley.x - 1.55, atTrolley.z - 1.55) < 0.2, "the cleaner walks to the trolley to pick up the toilet brush");
  await idle();
  check((await held()).r === "tool:toilet-brush", "the toilet brush is in the cleaner's hand");

  if (mistakes) {
  // Funny wrong move: toilet brush on the mirror.
  const before = (await sounds()).length;
  await openList();
  await page.click('[data-action="tap"][data-id="mirror"]');
  await page.waitForFunction(() => document.querySelector(".w3d-bang.on"), null, { timeout: 20000 });
  check((await page.textContent(".w3d-bang")).includes("BAM-BAM-BAM! WRONG!"), "BAM-BAM-BAM! WRONG! shows on screen");
  await shot("03-wrong-brush-on-mirror");
  check((await w(() => window.__smartSweep3d.char.expression)) === "confused", "the cleaner looks confused");
  await idle();
  check((await sounds()).slice(before).includes("wrong"), "the WRONG sound plays");
  check((await fb()).includes("Cross-contamination"), "the explanation says why (cross-contamination)");
  check((await level("mirror")) === 1, "the mirror is still dirty after the wrong try");
  }

  await use(null, null, "vent");
  check((await level("vent")) === 1, "the cleaner opens the window and switches on the fan");
  await use("bin-liner", null, "bin");
  check((await level("bin")) < 0.05 && (await held()).r === null, "bin emptied and re-lined, hands free again");
  await use(null, "toilet-cleaner", "toilet");
  check((await level("gel")) > 0.9, "toilet cleaner applied under the rim (gel visible)");

  if (mistakes) {
    // Wrong product on the mirror, then the right one.
    await use("cloth-blue", "bathroom-cleaner", "mirror");
    check((await fb()).includes("Wrong product"), "wrong product explained");
    check((await level("mirror")) === 1, "wrong product leaves the mirror dirty");
  } else await hold("cloth-blue");
  await load("glass-cleaner");
  check((await held()).l === "product:glass-cleaner" && (await held()).r === "tool:cloth-blue", "blue cloth and glass cleaner in hand");
  const s0 = (await sounds()).length;
  await openList();
  await page.click('[data-action="tap"][data-id="mirror"]');
  await page.waitForFunction(() => window.__smartSweep3d.room.level.mirror < 0.95 && window.__smartSweep3d.room.level.mirror > 0.05, null, { timeout: 20000 });
  await shot("04-wiping-mirror");
  await idle();
  check((await level("mirror")) === 0, "the mirror is visibly clean after wiping");
  const s1 = (await sounds()).slice(s0);
  check(s1.includes("spray") && s1.includes("wipe") && s1.includes("success"), "spray, wipe and success sounds play");

  await use("cloth-yellow", "bathroom-cleaner", "sink");
  await use("scrub-pad", "bathroom-cleaner", "shower");
  check((await level("shower")) === 0 && (await level("sink")) === 0, "sink and shower cleaned");
  await shot("05-after-shower");
  await use("cloth-blue", "disinfectant", "touch");

  if (mistakes) {
    // Dangerous: bleach on the toilet where acid toilet cleaner already is.
    const s2 = (await sounds()).length;
    await use("toilet-brush", "bleach", "toilet");
    const s3 = (await sounds()).slice(s2);
    check((await fb()).includes("Dangerous chemical mix"), "bleach on toilet cleaner is stopped as a dangerous mix");
    check(s3.includes("alarm") && !s3.includes("spray") && !s3.includes("wrong"), "a safety alarm (not a joke), and nothing is sprayed");
    await shot("05b-safety-stop");
  }

  await use("toilet-brush", null, "toilet");
  check((await level("bowl")) === 0, "the bowl is scrubbed clean and flushed");
  await use("cloth-red", "disinfectant", "toilet");
  await use("refill", null, "supplies");
  check((await level("stock")) === 1, "toilet roll and soap restocked");

  if (mistakes) {
    // Mopping before the sign: safety stop, then the right order.
    await use("mop", "floor-cleaner", "floor");
    check((await fb()).includes("Safety step missing"), "mopping without the sign is stopped");
  }
  await use("wet-sign", null, "floor");
  check((await level("sign")) === 1, "the wet floor sign is placed by the cleaner");
  await hold("mop");
  await load("floor-cleaner");
  await openList();
  await page.click('[data-action="tap"][data-id="floor"]');
  await page.waitForFunction(() => window.__smartSweep3d.room.level.floor < 0.7, null, { timeout: 30000 });
  await shot("06-mopping");
  await idle();
  check((await level("floor")) === 0, "the floor is mopped from the far corner to the door");
  check(await page.isVisible("text=Step 4: Final walk-through"), "all jobs done: walk-through starts");
  await shot("07-all-clean");

  for (const o of ["vent", "bin", "mirror", "sink", "shower", "touch", "toilet", "supplies", "floor"]) await tap(o);
  await page.click('[data-action="finish"]');
  await page.waitForSelector(".results");
  const results = await page.textContent(".results");
  if (mistakes) check(/Dangerous mix/i.test(results) && /Cross-contamination/i.test(results), "the critical mistakes are on the results, so a perfect score isn't given for unsafe work");
  else check(!/didn.t pass|not passed|Try again/i.test(results) && /pass|Outstanding|Great|Well done/i.test(results), "a clean, safe run passes the mission");
  await page.screenshot({ path: `${SHOTS}3d-${label}-08-results.png`, fullPage: true });
  check(!(await page.isVisible(".world3d")), "the 3D view is put away on the results screen");

  if (full) {
    // Classic view still available.
    await page.goto(APP_URL);
    await page.click('[data-action="play-training"] >> nth=0');
    await page.click('[data-action="start"]');
    await page.click('[data-action="toggle-view"]');
    check(await page.isVisible(".scene [data-obj]"), "players can switch to the simple 2D view");
    await page.click('[data-action="toggle-view"]');
    check(await page.isVisible(".world3d canvas"), "…and back to 3D");
  }
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(o <= 0, "no sideways scrolling");
  check(errors.length === 0, `no console errors${errors.length ? ": " + errors.join(" | ") : ""}`);
  await context.close();
}

try {
  await run("mobile", { width: 390, height: 844 }, false, false);
  await run("desktop", { width: 1280, height: 860 }, true, true);
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
