import { MistakeLog, finalise } from "./scoring";
import type { MissionResult, PlanTask, PlanningMission } from "./types";

export interface PlanCheck {
  task: PlanTask;
  ok: boolean;
  note: string;
}

/**
 * Time-management mission: the player builds an ordered plan for a shift with
 * a fixed time budget. Essentials and safety come first; extras are a judgement call.
 */
export class PlanningRun {
  plan: string[] = [];
  readonly mistakes = new MistakeLog();

  constructor(readonly mission: PlanningMission) {}

  task(id: string): PlanTask {
    const t = this.mission.tasks.find((x) => x.id === id);
    if (!t) throw new Error(`Unknown task ${id}`);
    return t;
  }

  get minutesUsed(): number {
    return this.plan.reduce((s, id) => s + this.task(id).minutes, 0);
  }

  get overBudget(): boolean {
    return this.minutesUsed > this.mission.budgetMinutes;
  }

  add(id: string): void {
    if (!this.plan.includes(id)) this.plan.push(id);
  }

  remove(id: string): void {
    this.plan = this.plan.filter((x) => x !== id);
  }

  move(id: string, delta: -1 | 1): void {
    const i = this.plan.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= this.plan.length) return;
    [this.plan[i], this.plan[j]] = [this.plan[j], this.plan[i]];
  }

  /** Best value of extras that fits alongside every essential task. */
  bestExtrasValue(): number {
    const essentials = this.mission.tasks.filter((t) => t.essential || t.safetyFirst);
    const room = this.mission.budgetMinutes - essentials.reduce((s, t) => s + t.minutes, 0);
    const extras = this.mission.tasks.filter((t) => !t.essential && !t.safetyFirst);
    let best = 0;
    for (let mask = 0; mask < 1 << extras.length; mask++) {
      let mins = 0;
      let val = 0;
      extras.forEach((t, i) => {
        if (mask & (1 << i)) {
          mins += t.minutes;
          val += t.value ?? 0;
        }
      });
      if (mins <= room && val > best) best = val;
    }
    return best;
  }

  /** Checks each planned task, recording mistakes. Safe to call more than once. */
  review(): PlanCheck[] {
    const pos = (id: string) => this.plan.indexOf(id);
    return this.plan.map((id, i) => {
      const t = this.task(id);
      if (t.safetyFirst && i !== 0) {
        this.mistakes.add({ key: `first:${id}`, severity: "major", category: "safety", title: `Hazard not dealt with first: ${t.label}`, why: t.why });
        return { task: t, ok: false, note: "Should be first: a hazard left in place can hurt someone while you work." };
      }
      if (t.last && i !== this.plan.length - 1) {
        this.mistakes.add({ key: `last:${id}`, severity: "major", category: "sequence", title: `Out of order: ${t.label}`, why: t.why });
        return { task: t, ok: false, note: "Should be the very last task." };
      }
      const broken = (t.after ?? []).find((r) => pos(r.task) > i);
      if (broken) {
        this.mistakes.add({ key: `order:${id}:${broken.task}`, severity: "major", category: "sequence", title: `Out of order: ${t.label}`, why: broken.why });
        return { task: t, ok: false, note: broken.why };
      }
      return { task: t, ok: true, note: t.why };
    });
  }

  finish(): MissionResult {
    this.review();
    const { tasks, budgetMinutes } = this.mission;
    const missing = tasks.filter((t) => (t.essential || t.safetyFirst) && !this.plan.includes(t.id));
    for (const t of missing) {
      this.mistakes.add({
        key: `missing:${t.id}`,
        severity: t.safetyFirst ? "critical" : "major",
        category: t.safetyFirst ? "safety" : "decisions",
        title: `Left out: ${t.label}`,
        why: t.why,
      });
    }
    const over = this.minutesUsed > budgetMinutes;
    if (over) {
      this.mistakes.add({
        key: "over-time",
        severity: "major",
        category: "decisions",
        title: `Plan runs over: ${this.minutesUsed} of ${budgetMinutes} minutes`,
        why: "The guest arrives to an unfinished room. A professional plan fits the time available, so leave out extras rather than essentials.",
      });
    }
    const essentials = tasks.filter((t) => t.essential || t.safetyFirst);
    const covered = essentials.filter((t) => this.plan.includes(t.id)).length;
    const extrasValue = this.plan.map((id) => this.task(id)).filter((t) => !t.essential && !t.safetyFirst).reduce((s, t) => s + (t.value ?? 0), 0);
    const best = this.bestExtrasValue();
    const orderMistakes = this.mistakes.of("sequence").length + this.mistakes.all().filter((m) => m.key.startsWith("first:")).length;
    const lines = [
      { category: "essentials", label: "Essential tasks planned", earned: (covered / essentials.length) * 45, max: 45 },
      { category: "order", label: "Right order", earned: Math.max(0, 25 - orderMistakes * 6), max: 25 },
      { category: "time", label: "Fits the time", earned: over ? 0 : 15, max: 15 },
      { category: "priorities", label: "Smart use of spare time", earned: over ? 0 : best ? (Math.min(extrasValue, best) / best) * 15 : 15, max: 15 },
    ];
    return finalise({
      missionId: this.mission.id,
      lines,
      mistakes: this.mistakes.all(),
      missed: missing.map((t) => t.label),
      requiredComplete: missing.length === 0 && !over,
      stats: { perfectPlan: missing.length === 0 && !over && orderMistakes === 0, minutesUsed: this.minutesUsed },
    });
  }
}
