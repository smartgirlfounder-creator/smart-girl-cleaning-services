import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "../data/achievements";
import { judgementMission, shiftPlannerMission } from "../data/missions/expert";
import { MISSIONS } from "../data/missions";
import { kitchenMission } from "../data/missions/kitchen";
import { CleaningRun } from "./cleaning";
import { PlanningRun } from "./planning";
import { Progress, memoryStore } from "./progress";
import { ScenarioRun } from "./scenario";
import { CRITICAL_CAP } from "./scoring";

function readyKitchen() {
  const run = new CleaningRun(kitchenMission);
  for (const o of kitchenMission.objects) run.tap(o.id);
  run.startPpe();
  expect(run.equipPpe(["gloves", "eye-protection"]).ok).toBe(true);
  return run;
}

function use(run: CleaningRun, tool: string | null, product: string | null, objectId: string) {
  run.hold(tool);
  run.load(product);
  return run.tap(objectId);
}

const PERFECT_KITCHEN: [string | null, string | null, string][] = [
  [null, null, "vent"],
  [null, null, "dishes"],
  ["bin-liner", null, "bin"],
  [null, "degreaser", "hob"],
  ["cloth-green", "kitchen-cleaner", "microwave"],
  ["scrub-pad-green", null, "hob"],
  ["cloth-green", "food-safe-sanitiser", "counters"],
  ["cloth-blue", "food-safe-sanitiser", "handles"],
  ["scrub-pad-green", "limescale-remover", "sink"],
  ["refill", null, "supplies"],
  ["wet-sign", null, "floor"],
  ["mop", "floor-cleaner", "floor"],
];

describe("kitchen mission", () => {
  it("scores 100 for a professional run", () => {
    const run = readyKitchen();
    for (const [t, p, o] of PERFECT_KITCHEN) expect(use(run, t, p, o).tone).toBe("good");
    for (const o of kitchenMission.objects) run.tap(o.id);
    const res = run.finish();
    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
  });

  it("treats a yellow bathroom cloth on the counters as cross-contamination", () => {
    const run = readyKitchen();
    use(run, null, null, "dishes");
    expect(use(run, "cloth-yellow", "food-safe-sanitiser", "counters").tone).toBe("critical");
  });

  it("explains that bathroom disinfectant is not food-safe", () => {
    const run = readyKitchen();
    use(run, null, null, "dishes");
    const fb = use(run, "cloth-green", "disinfectant", "counters");
    expect(fb.tone).toBe("bad");
    expect(fb.body).toMatch(/not approved for surfaces that touch food/);
  });

  it("stops bleach on a sink that has limescale remover on it", () => {
    const run = readyKitchen();
    for (const [t, p, o] of PERFECT_KITCHEN.slice(0, 9)) use(run, t, p, o);
    expect(use(run, "scrub-pad-green", "bleach", "sink").tone).toBe("critical");
  });

  it("won't sanitise counters before they are cleared", () => {
    const run = readyKitchen();
    const fb = use(run, "cloth-green", "food-safe-sanitiser", "counters");
    expect(fb.body).toMatch(/Clear the counters first/);
  });
});

describe("hotel turnover planner", () => {
  const essentials = shiftPlannerMission.tasks.filter((t) => t.essential || t.safetyFirst).map((t) => t.id);
  const withoutInspect = essentials.filter((id) => id !== "inspect");

  it("scores 100 for every essential in order plus the best extras", () => {
    const run = new PlanningRun(shiftPlannerMission);
    for (const id of [...withoutInspect, "balcony", "kettle", "inspect"]) run.add(id);
    expect(run.minutesUsed).toBeLessThanOrEqual(shiftPlannerMission.budgetMinutes);
    const res = run.finish();
    expect(res.score).toBe(100);
    expect(res.stats.perfectPlan).toBe(true);
  });

  it("leaving out the corridor spill is safety-critical", () => {
    const run = new PlanningRun(shiftPlannerMission);
    for (const id of essentials.filter((x) => x !== "spill")) run.add(id);
    const res = run.finish();
    expect(res.passed).toBe(false);
    expect(res.score).toBeLessThanOrEqual(CRITICAL_CAP);
  });

  it("flags making the bed before stripping it, and running over time", () => {
    const run = new PlanningRun(shiftPlannerMission);
    for (const id of ["spill", "bed", "strip", ...withoutInspect.filter((x) => !["spill", "bed", "strip"].includes(x)), "windows", "curtains", "inspect"]) run.add(id);
    const res = run.finish();
    expect(res.mistakes.some((m) => m.key === "order:bed:strip")).toBe(true);
    expect(res.mistakes.some((m) => m.key === "over-time")).toBe(true);
    expect(res.passed).toBe(false);
  });

  it("supports reordering and removing", () => {
    const run = new PlanningRun(shiftPlannerMission);
    run.add("strip");
    run.add("spill");
    run.move("spill", -1);
    expect(run.plan).toEqual(["spill", "strip"]);
    run.remove("strip");
    expect(run.plan).toEqual(["spill"]);
  });
});

describe("professional judgement", () => {
  it("passes with all safe answers and fails on wiping up body fluids with a normal cloth", () => {
    const good = new ScenarioRun(judgementMission);
    const bad = new ScenarioRun(judgementMission);
    for (const s of judgementMission.scenarios) {
      for (const run of [good, bad]) {
        if (s.type === "choice") {
          const pick = run === bad && s.id === "body-fluid" ? "wipe" : s.options.find((o) => o.correct)!.id;
          run.answer({ type: "choice", optionId: pick });
        } else if (s.type === "match") run.answer({ type: "match", picks: Object.fromEntries(s.rows.map((r) => [r.id, r.answer])) });
        run.next();
      }
    }
    expect(good.finish()).toMatchObject({ score: 100, passed: true });
    const res = bad.finish();
    expect(res.passed).toBe(false);
    expect(res.criticalErrors).toHaveLength(1);
  });
});

describe("progression", () => {
  it("unlocks each mission only after the one before it is passed", () => {
    const p = new Progress(memoryStore(), ACHIEVEMENTS);
    const pass = (missionId: string) => p.addResult({ missionId, score: 90, stars: 3, passed: true, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    const fail = (missionId: string) => p.addResult({ missionId, score: 30, stars: 0, passed: false, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    const unlocked = () => MISSIONS.filter((m) => p.isUnlocked(m)).map((m) => m.id);
    expect(unlocked()).toEqual(["bathroom-basics"]);
    fail("bathroom-basics");
    expect(unlocked()).toEqual(["bathroom-basics"]);
    pass("bathroom-basics");
    expect(unlocked()).toEqual(["bathroom-basics", "chemical-safety"]);
    pass("chemical-safety");
    expect(p.isUnlocked(kitchenMission)).toBe(false);
    pass("final-inspection");
    expect(p.isUnlocked(kitchenMission)).toBe(true);
    expect(p.isUnlocked(shiftPlannerMission)).toBe(false);
    pass("kitchen-pro");
    expect(p.isUnlocked(shiftPlannerMission)).toBe(true);
    expect(p.isUnlocked(judgementMission)).toBe(false);
    pass("hotel-turnover");
    expect(p.isUnlocked(judgementMission)).toBe(true);
    expect(p.data.achievements["graduate"]).toBeUndefined();
    pass("professional-judgement");
    expect(p.data.achievements["graduate"]).toBeTruthy();
  });
});
