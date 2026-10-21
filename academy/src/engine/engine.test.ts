import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "../data/achievements";
import { bathroomMission } from "../data/missions/bathroom";
import { inspectionMission } from "../data/missions/inspection";
import { safetyMission } from "../data/missions/safety";
import { mixHazard } from "./chemistry";
import { CleaningRun } from "./cleaning";
import { InspectionRun } from "./inspection";
import { Progress, memoryStore } from "./progress";
import { ScenarioRun } from "./scenario";
import { CRITICAL_CAP } from "./scoring";

function readyRun() {
  const run = new CleaningRun(bathroomMission);
  for (const o of bathroomMission.objects) run.tap(o.id);
  expect(run.startPpe()).toBe(true);
  expect(run.equipPpe(["gloves", "eye-protection", "apron"]).ok).toBe(true);
  return run;
}

function use(run: CleaningRun, tool: string | null, product: string | null, objectId: string) {
  run.hold(tool);
  run.load(product);
  return run.tap(objectId);
}

/** Completes every task in a valid professional order. */
function cleanPerfectly(run: CleaningRun, alreadyDone: string[] = []) {
  const steps: [string | null, string | null, string][] = [
    [null, null, "vent"],
    ["bin-liner", null, "bin"],
    [null, "toilet-cleaner", "toilet"],
    ["cloth-blue", "glass-cleaner", "mirror"],
    ["cloth-yellow", "bathroom-cleaner", "sink"],
    ["scrub-pad", "bathroom-cleaner", "shower"],
    ["cloth-blue", "disinfectant", "touch"],
    ["toilet-brush", null, "toilet"],
    ["cloth-red", "disinfectant", "toilet"],
    ["refill", null, "supplies"],
    ["wet-sign", null, "floor"],
    ["mop", "floor-cleaner", "floor"],
  ];
  for (const [t, p, o] of steps) {
    const before = run.done.size;
    const fb = use(run, t, p, o);
    if (alreadyDone.includes(o) && run.done.size === before) continue;
    expect(fb.tone).toBe("good");
  }
}

describe("chemistry", () => {
  it("flags bleach with acid and ammonia, but not neutral products", () => {
    expect(mixHazard("bleach", "toilet-cleaner")?.gas).toMatch(/chlorine/);
    expect(mixHazard("glass-cleaner", "bleach")?.gas).toMatch(/chloramine/);
    expect(mixHazard("bleach", "floor-cleaner")).toBeNull();
  });
});

describe("bathroom cleaning mission", () => {
  it("requires every area to be inspected before PPE", () => {
    const run = new CleaningRun(bathroomMission);
    run.tap("mirror");
    expect(run.startPpe()).toBe(false);
  });

  it("will not start cleaning without gloves and eye protection", () => {
    const run = new CleaningRun(bathroomMission);
    for (const o of bathroomMission.objects) run.tap(o.id);
    run.startPpe();
    const r = run.equipPpe(["apron"]);
    expect(r.ok).toBe(false);
    expect(run.phase).toBe("ppe");
  });

  it("scores a perfect run at 100 and 3 stars", () => {
    const run = readyRun();
    cleanPerfectly(run);
    expect(run.phase).toBe("check");
    for (const o of bathroomMission.objects) run.tap(o.id);
    const res = run.finish();
    expect(res.score).toBe(100);
    expect(res.stars).toBe(3);
    expect(res.passed).toBe(true);
    expect(res.stats.optionalDone).toBe(true);
  });

  it("blocks bleach on a toilet that has acid cleaner in it and caps the score", () => {
    const run = readyRun();
    use(run, null, null, "vent");
    use(run, null, "toilet-cleaner", "toilet");
    const fb = use(run, null, "bleach", "toilet");
    expect(fb.tone).toBe("critical");
    cleanPerfectly(run, ["vent", "toilet"]);
    for (const o of bathroomMission.objects) run.tap(o.id);
    const res = run.finish();
    expect(res.criticalErrors).toHaveLength(1);
    expect(res.score).toBeLessThanOrEqual(CRITICAL_CAP);
    expect(res.passed).toBe(false);
    expect(res.stars).toBeLessThanOrEqual(1);
  });

  it("treats the red toilet cloth on the sink as cross-contamination", () => {
    const run = readyRun();
    expect(use(run, "cloth-red", "bathroom-cleaner", "sink").tone).toBe("critical");
    expect(run.done.has("sink")).toBe(false);
  });

  it("explains, and blocks, mopping before the other surfaces are done", () => {
    const run = readyRun();
    use(run, "wet-sign", null, "floor");
    const fb = use(run, "mop", "floor-cleaner", "floor");
    expect(fb.tone).toBe("warn");
    expect(fb.body).toMatch(/floor is always cleaned last/i);
    expect(run.done.has("floor-mop")).toBe(false);
  });

  it("treats mopping without the wet floor sign as a safety mistake", () => {
    const run = readyRun();
    use(run, "mop", "floor-cleaner", "floor");
    expect(run.mistakes.of("safety").some((m) => m.key.startsWith("safety-req:floor-mop"))).toBe(true);
  });

  it("needs ventilation before strong products", () => {
    const run = readyRun();
    expect(use(run, null, "toilet-cleaner", "toilet").title).toBe("Ventilate first");
  });

  it("penalises a repeated identical mistake only once", () => {
    const run = readyRun();
    use(run, "mop", null, "mirror");
    use(run, "mop", null, "mirror");
    expect(run.mistakes.of("tools")).toHaveLength(1);
  });

  it("reports missed tasks when finished early", () => {
    const run = readyRun();
    use(run, null, null, "vent");
    const res = run.finish();
    expect(res.passed).toBe(false);
    expect(res.missed).toContain("Mop the floor");
  });
});

describe("chemical safety mission", () => {
  it("passes when every answer is correct", () => {
    const run = new ScenarioRun(safetyMission);
    for (const s of safetyMission.scenarios) {
      if (s.type === "choice") run.answer({ type: "choice", optionId: s.options.find((o) => o.correct)!.id });
      if (s.type === "multi") run.answer({ type: "multi", optionIds: s.options.filter((o) => o.correct).map((o) => o.id) });
      if (s.type === "match") run.answer({ type: "match", picks: Object.fromEntries(s.rows.map((r) => [r.id, r.answer])) });
      run.next();
    }
    const res = run.finish();
    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
  });

  it("a single dangerous choice fails the mission even if everything else is right", () => {
    const run = new ScenarioRun(safetyMission);
    for (const s of safetyMission.scenarios) {
      if (s.id === "boost") run.answer({ type: "choice", optionId: "mix" });
      else if (s.type === "choice") run.answer({ type: "choice", optionId: s.options.find((o) => o.correct)!.id });
      else if (s.type === "multi") run.answer({ type: "multi", optionIds: s.options.filter((o) => o.correct).map((o) => o.id) });
      else run.answer({ type: "match", picks: Object.fromEntries(s.rows.map((r) => [r.id, r.answer])) });
      run.next();
    }
    const res = run.finish();
    expect(res.passed).toBe(false);
    expect(res.score).toBeLessThanOrEqual(CRITICAL_CAP);
  });

  it("gives partial credit on multi-select and match", () => {
    const run = new ScenarioRun(safetyMission);
    run.index = safetyMission.scenarios.findIndex((s) => s.id === "never-mix");
    const o = run.answer({ type: "multi", optionIds: ["bleach-ammonia", "bleach-acid"] });
    expect(o.earned).toBeCloseTo(10);
    expect(o.correct).toBe(false);
  });
});

describe("final inspection mission", () => {
  it("finds defects, penalises false flags, and fails if the chemical hazard is missed", () => {
    const run = new InspectionRun(inspectionMission);
    for (const d of inspectionMission.defects) if (!d.safetyCritical) run.flag(d.objectId);
    run.flag("shower");
    const res = run.submit();
    expect(res.passed).toBe(false);
    expect(res.criticalErrors[0].title).toMatch(/chemical/i);
  });

  it("scores 100 when every defect is found with no false flags", () => {
    const run = new InspectionRun(inspectionMission);
    for (const d of inspectionMission.defects) run.flag(d.objectId);
    const res = run.submit();
    expect(res.score).toBe(100);
    expect(res.stats.foundAll).toBe(true);
  });
});

describe("progress", () => {
  it("unlocks the inspection only after both beginner missions pass, and survives a reload", () => {
    const store = memoryStore();
    const p = new Progress(store, ACHIEVEMENTS);
    expect(p.isUnlocked(inspectionMission)).toBe(false);
    p.addResult({ missionId: "bathroom-basics", score: 80, stars: 2, passed: true, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    expect(p.isUnlocked(inspectionMission)).toBe(false);
    const earned = p.addResult({ missionId: "chemical-safety", score: 95, stars: 3, passed: true, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    expect(earned.map((a) => a.id)).toEqual(expect.arrayContaining(["safety-first", "three-stars"]));
    const reloaded = new Progress(store, ACHIEVEMENTS);
    expect(reloaded.isUnlocked(inspectionMission)).toBe(true);
    expect(reloaded.data.achievements["first-shine"]).toBeTruthy();
  });

  it("keeps the best score and the passed flag when a later attempt is worse", () => {
    const p = new Progress(memoryStore(), ACHIEVEMENTS);
    p.addResult({ missionId: "bathroom-basics", score: 90, stars: 3, passed: true, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    p.addResult({ missionId: "bathroom-basics", score: 30, stars: 0, passed: false, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    expect(p.record("bathroom-basics")).toMatchObject({ attempts: 2, bestScore: 90, passed: true });
  });

  it("recovers from corrupted saved data", () => {
    const p = new Progress(memoryStore("{not json"), ACHIEVEMENTS);
    expect(p.data.missions).toEqual({});
  });
});
