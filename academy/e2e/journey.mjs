// End-to-end check of the core player journey in a real browser.
// Usage: npm run build && npm run e2e
// Uses playwright-core with a locally installed Chromium (CHROMIUM_PATH or /opt/pw-browsers).
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = 4179;
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

const browser = await chromium.launch({ executablePath: chromiumPath() });

async function run(label, viewport) {
  console.log(`\n${label} (${viewport.width}×${viewport.height})`);
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 600 });
  const page = await context.newPage();
  const errors = [];
  // The account service isn't reachable from the test machine; the app falls back to offline mode.
  page.on("console", (m) => m.type() === "error" && !/supabase|Failed to load resource: net::/i.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  const fb = () => page.locator(".feedback").first();
  const noOverflow = async (where) => {
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(o <= 0, `no sideways scrolling on ${where}`);
  };
  const shot = (name) => page.screenshot({ path: `${SHOTS}${label}-${name}.png`, fullPage: true });
  const tapObj = (id) => page.click(`.scene [data-obj="${id}"]`);
  const holdTool = async (id) => {
    await page.click('[data-action="tab"][data-id="tools"]');
    await page.click(`[data-action="hold"][data-id="${id ?? ""}"]`);
  };
  const loadProduct = async (id) => {
    await page.click('[data-action="tab"][data-id="products"]');
    await page.click(`[data-action="load"][data-id="${id ?? ""}"]`);
  };
  const use = async (tool, product, obj) => {
    await holdTool(tool);
    await loadProduct(product);
    await tapObj(obj);
  };
  const objects = ["vent", "bin", "mirror", "sink", "shower", "touch", "toilet", "supplies", "floor"];

  // 1. Open the app
  await page.goto(APP_URL);
  await page.waitForSelector(".home");
  check(await page.isVisible("text=Learn cleaning by"), "home screen opens");
  await noOverflow("home");
  await shot("01-home");

  // 2. Start mission 1
  await page.click('[data-action="play-training"] >> nth=0');
  await page.waitForSelector(".briefing");
  await noOverflow("briefing");
  await page.click('[data-action="start"]');
  await page.waitForSelector(".scene");
  for (const o of objects) await tapObj(o);
  check((await page.textContent(".count")).includes("9 of 9"), "every area inspected by tapping the room");
  await page.click('[data-action="to-ppe"]');
  // Choosing a cartoon cleaner before the PPE store
  check(await page.isVisible("text=Step 2: Choose your cleaner"), "first time: the player is asked to choose a cleaner");
  check(await page.isDisabled('[data-action="avatar-done"]'), "can't continue until female or male is chosen");
  await page.click('[data-action="avatar-gender"][data-id="male"]');
  await page.click('[data-action="avatar-hair"][data-id="afro"]');
  await page.click('[data-action="avatar-gender"][data-id="female"]');
  check((await page.locator('[data-action="avatar-hair"]').allTextContents()).join(",") === "Braids,Afro puff,Headwrap,Bun", "female hairstyles are offered after switching");
  await page.click('[data-action="avatar-hair"][data-id="wrap"]');
  await page.click('[data-action="avatar-skin"][data-id="1"]');
  await page.click('[data-action="avatar-uniform"][data-id="maroon"]');
  await shot("avatar-picker");
  await page.click('[data-action="avatar-done"]');
  check(await page.isVisible("text=Step 2: Pick your PPE from the store"), "the PPE store opens with the chosen cleaner");
  await noOverflow("ppe-store");
  check((await page.locator(".ppe-store .cleaner").count()) === 1, "the cleaner stands in the PPE store");
  for (const name of ["Protective", "gloves", "Safety", "glasses", "Apron", "Dust mask"]) check((await page.textContent(".ppe-store")).includes(name), `store shelf label shows "${name}"`);
  await page.click('.ppe-store [data-action="ppe"][data-id="gloves"]');
  check((await page.locator(".ppe-store .cleaner.walk").count()) === 1, "tapping the gloves makes the cleaner walk to the shelf");
  await page.waitForTimeout(900);
  await shot("ppe-store-reach");
  await page.waitForTimeout(900);
  check((await fb().textContent()).includes("Put on: Protective gloves"), "the cleaner puts the gloves on");
  check((await page.getAttribute('.ppe-grid [data-id="gloves"]', "aria-pressed")) === "true", "the list matches the store");
  await page.click('[data-action="equip"]');
  check((await fb().textContent()).includes("safety glasses"), "missing eye protection is refused with an explanation");
  await page.focus('.ppe-store [data-id="eye-protection"]');
  await page.keyboard.press("Enter");
  check((await page.getAttribute('.ppe-grid [data-id="eye-protection"]', "aria-pressed")) === "true", "keyboard: Enter on a shelf item picks it");
  await page.waitForTimeout(1700);
  await shot("ppe-store-dressed");
  await page.click('[data-action="equip"]');
  check(await page.isVisible("text=Step 3: Clean"), "PPE accepted, cleaning starts");

  // 3-6. Tool selection, a correct action, an unsafe action and feedback
  await use(null, null, "vent");
  check((await fb().getAttribute("class")).includes("tone-good"), "correct action: ventilating the room succeeds");
  check((await page.locator(".fan-on").count()) === 1, "room changes visibly: the fan is running");
  await use("cloth-blue", "glass-cleaner", "mirror");
  check((await page.textContent(".checklist h3")).includes("2 of"), "job sheet ticks off completed tasks");
  await use("cloth-red", "bathroom-cleaner", "sink");
  check((await fb().getAttribute("class")).includes("tone-critical"), "unsafe action: red toilet cloth on the sink is a critical error");
  check((await fb().textContent()).toLowerCase().includes("cross-contamination"), "feedback explains cross-contamination");
  await use("mop", "floor-cleaner", "floor");
  check((await fb().textContent()).includes("wet floor sign"), "mopping without the sign is flagged as a safety step");
  await use(null, "toilet-cleaner", "toilet");
  await use(null, "bleach", "toilet");
  check((await fb().textContent()).includes("Dangerous chemical mix"), "bleach on acid toilet cleaner is stopped");
  await shot("02-critical-feedback");

  // 7. Complete the mission
  await use("bin-liner", null, "bin");
  await use("cloth-yellow", "bathroom-cleaner", "sink");
  await use("scrub-pad", "bathroom-cleaner", "shower");
  await use("cloth-blue", "disinfectant", "touch");
  await use("toilet-brush", null, "toilet");
  await use("cloth-red", "disinfectant", "toilet");
  await use("wet-sign", null, "floor");
  await use("mop", "floor-cleaner", "floor");
  check(await page.isVisible("text=Step 4: Final walk-through"), "all tasks done, final walk-through starts");
  for (const o of objects) await tapObj(o);
  await noOverflow("mission");
  await shot("03-walkthrough");
  await page.click('[data-action="finish"]');
  await page.waitForSelector(".results");

  // 8. View the score
  check(await page.isVisible(".crit-box"), "results show the safety-critical errors");
  check(Number(await page.textContent(".score-ring span")) <= 49, "critical errors cap the score below the pass mark");
  await noOverflow("results");
  await shot("04-results-fail");

  // 9. Retry and pass
  await page.click('[data-action="start"][data-key="retry"]');
  for (const o of objects) await tapObj(o);
  await page.click('[data-action="to-ppe"]');
  for (const p of ["gloves", "eye-protection", "apron"]) await page.click(`[data-action="ppe"][data-id="${p}"]`);
  await page.click('[data-action="equip"]');
  const perfect = [
    [null, null, "vent"], ["bin-liner", null, "bin"], [null, "toilet-cleaner", "toilet"], ["cloth-blue", "glass-cleaner", "mirror"],
    ["cloth-yellow", "bathroom-cleaner", "sink"], ["scrub-pad", "bathroom-cleaner", "shower"], ["cloth-blue", "disinfectant", "touch"],
    ["toilet-brush", null, "toilet"], ["cloth-red", "disinfectant", "toilet"], ["refill", null, "supplies"], ["wet-sign", null, "floor"],
  ];
  for (const [t, p, o] of perfect) await use(t, p, o);
  await page.click('[data-action="hint"]');
  check((await fb().textContent()).includes("Mop the floor"), "hint suggests the next job");
  await use("mop", "floor-cleaner", "floor");
  for (const o of objects) await tapObj(o);
  await page.click('[data-action="finish"]');
  await page.waitForSelector(".results");
  check((await page.textContent(".score-ring span")) === "100", "a perfect retry scores 100");
  check(await page.isVisible(".new-badges"), "new badges are awarded");
  await shot("05-results-pass");

  // Mission 2
  await page.click('[data-action="briefing"][data-key="next"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector(".scenario-card");
  await noOverflow("safety mission");
  const answers = {
    unlabelled: ["choose", "set-aside"], dilution: ["choose", "20"], boost: ["choose", "one"],
    "never-mix": ["multi", ["bleach-ammonia", "bleach-acid", "bleach-vinegar"]],
    surfaces: ["match", { mirror: "glass-cleaner", marble: "neutral", screen: "limescale", handle: "disinfectant" }],
    "ppe-label": ["multi", ["gloves", "eyes"]], storage: ["choose", "locked"], child: ["choose", "move"], cable: ["choose", "report"], splash: ["choose", "rinse"],
  };
  for (const [id, [type, a]] of Object.entries(answers)) {
    if (type === "choose") await page.click(`[data-action="choose"][data-id="${a}"]`);
    if (type === "multi") {
      for (const o of a) await page.click(`[data-action="toggle"][data-id="${o}"]`);
      await page.click('[data-action="submit-answer"]');
    }
    if (type === "match") {
      for (const [row, c] of Object.entries(a)) await page.click(`[data-action="match"][data-id="${row}"][data-choice="${c}"]`);
      await page.click('[data-action="submit-answer"]');
    }
    if (id === "dilution") {
      check((await page.textContent(".scenario-card .feedback")).includes("too weak"), "a wrong safety answer explains why");
      await shot("06-scenario-feedback");
    }
    await page.click('[data-action="next-scenario"]');
  }
  await page.waitForSelector(".results");
  check(await page.isVisible(".results-head.pass"), "safety mission passed with one non-critical mistake");

  // Mission 3
  await page.click('[data-action="briefing"][data-key="next"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector(".clipboard");
  await tapObj("shower");
  check((await fb().textContent()).includes("looks fine"), "flagging a clean area is a false flag with an explanation");
  for (const o of ["shelf", "mirror", "sink", "sink", "touch", "bottle", "supplies", "floor"]) await tapObj(o);
  check((await page.textContent(".count")).includes("8 of 8"), "all inspection problems found by tapping");
  await noOverflow("inspection");
  await shot("07-inspection");
  await page.click('[data-action="submit"]');
  await page.waitForSelector(".results");
  check(await page.isVisible(".results-head.pass"), "inspection passed despite one false flag");

  // Mission 4: kitchen
  await page.click('[data-action="briefing"][data-key="next"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector('.scene[aria-label="Kitchen"]');
  const kitchenObjects = ["vent", "dishes", "bin", "microwave", "hob", "counters", "handles", "sink", "supplies", "floor"];
  for (const o of kitchenObjects) await tapObj(o);
  await page.click('[data-action="to-ppe"]');
  for (const p of ["gloves", "eye-protection"]) await page.click(`[data-action="ppe"][data-id="${p}"]`);
  await page.click('[data-action="equip"]');
  await use(null, null, "vent");
  await use(null, null, "dishes");
  check((await page.locator(".scene").innerHTML()).includes("#E07A5F") , "kitchen scene renders");
  await use("cloth-green", "disinfectant", "counters");
  check((await fb().textContent()).includes("not approved for surfaces that touch food"), "kitchen: non-food-safe product explained");
  const kitchen = [
    ["bin-liner", null, "bin"], [null, "degreaser", "hob"], ["cloth-green", "kitchen-cleaner", "microwave"], ["scrub-pad-green", null, "hob"],
    ["cloth-green", "food-safe-sanitiser", "counters"], ["cloth-blue", "food-safe-sanitiser", "handles"], ["scrub-pad-green", "limescale-remover", "sink"],
    ["wet-sign", null, "floor"], ["mop", "floor-cleaner", "floor"],
  ];
  for (const [t, p, o] of kitchen) await use(t, p, o);
  check(await page.isVisible("text=Step 4: Final walk-through"), "kitchen: all tasks done");
  for (const o of kitchenObjects) await tapObj(o);
  await shot("10-kitchen");
  await noOverflow("kitchen");
  await page.click('[data-action="finish"]');
  await page.waitForSelector(".results");
  check(await page.isVisible(".results-head.pass"), "kitchen passed with one non-critical mistake");

  // Mission 5: hotel turnover planner
  await page.click('[data-action="briefing"][data-key="next"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector(".planner");
  const plan = ["strip", "spill", "bins", "bathroom", "bed", "dust", "touch", "restock", "vacuum", "report", "balcony", "kettle", "inspect"];
  for (const id of plan) await page.click(`[data-action="plan-add"][data-id="${id}"]`);
  await page.click('[data-action="plan-up"][data-id="spill"]');
  check((await page.textContent(".plan-item >> nth=0")).includes("coffee spill"), "planner: reordering moves the hazard first");
  check((await page.textContent(".timebar b")).includes("55 / 55"), "planner: time bar adds up the plan");
  await noOverflow("planner");
  await shot("11-planner");
  await page.click('[data-action="plan-submit"]');
  await page.click('[data-action="plan-yes"]');
  await page.waitForSelector(".results");
  check((await page.textContent(".score-ring span")) === "100", "planner: a model plan scores 100");

  // Mission 6: professional judgement
  await page.click('[data-action="briefing"][data-key="next"]');
  await page.click('[data-action="start"]');
  await page.waitForSelector(".scenario-card");
  const judgement = { "body-fluid": "kit", "client-mix": "decline", "colleague-ppe": "stop", priorities: { glass: "now", stairs: "now", soap: "today", skirting: "later" }, "running-late": "prioritise", breakage: "report", dnd: "skip", mould: "report" };
  for (const a of Object.values(judgement)) {
    if (typeof a === "string") await page.click(`[data-action="choose"][data-id="${a}"]`);
    else {
      for (const [row, c] of Object.entries(a)) await page.click(`[data-action="match"][data-id="${row}"][data-choice="${c}"]`);
      await page.click('[data-action="submit-answer"]');
    }
    await page.click('[data-action="next-scenario"]');
  }
  await page.waitForSelector(".results");
  check(await page.isVisible(".results-head.pass"), "judgement mission passed");

  // 10. Refresh: progress survives on this device
  await page.reload();
  await page.waitForSelector(".home");
  check((await page.textContent(".home")).includes("6 of 6 training missions passed"), "progress survives a page refresh");
  await page.click('[data-action="progress"]');
  check((await page.locator(".certificate").count()) === 3, "a certificate for each completed level");
  check((await page.textContent(".certificate")).includes("not an accredited qualification"), "certificate is labelled as not accredited");
  await page.fill("#player-name", "Test Player");
  check((await page.textContent(".cert-name >> nth=2")) === "Test Player", "name appears on the certificates");
  await noOverflow("progress");
  await shot("08-progress");
  for (const v of ["library", "achievements", "about", "rooms"]) {
    await page.click('[data-action="home"]');
    await page.click(`[data-action="${v}"]`);
    await noOverflow(v);
  }
  await shot("09-rooms");
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
