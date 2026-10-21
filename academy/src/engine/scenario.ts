import { MistakeLog, afterPenalties, finalise } from "./scoring";
import type { Feedback, MissionResult, Scenario, ScenarioMission } from "./types";

export type ScenarioAnswer =
  | { type: "choice"; optionId: string }
  | { type: "multi"; optionIds: string[] }
  | { type: "match"; picks: Record<string, string> };

export interface AnswerDetail {
  id: string;
  ok: boolean;
  /** Whether the player picked it (choice/multi) or what they picked (match). */
  picked: boolean | string;
  explain: string;
}

export interface ScenarioOutcome {
  scenarioId: string;
  earned: number;
  max: number;
  correct: boolean;
  critical: boolean;
  feedback: Feedback;
  details: AnswerDetail[];
}

/** Runs a decision-based safety mission: one situation at a time, with consequences. */
export class ScenarioRun {
  index = 0;
  readonly outcomes: ScenarioOutcome[] = [];
  readonly mistakes = new MistakeLog();

  constructor(readonly mission: ScenarioMission) {}

  current(): Scenario | undefined {
    return this.mission.scenarios[this.index];
  }

  get answeredCurrent(): boolean {
    const s = this.current();
    return !!s && this.outcomes.some((o) => o.scenarioId === s.id);
  }

  answer(ans: ScenarioAnswer): ScenarioOutcome {
    const s = this.current();
    if (!s) throw new Error("No scenario to answer");
    if (s.type !== ans.type) throw new Error(`Answer type ${ans.type} does not fit scenario ${s.type}`);
    const existing = this.outcomes.find((o) => o.scenarioId === s.id);
    if (existing) return existing;
    const outcome = this.evaluate(s, ans);
    this.outcomes.push(outcome);
    return outcome;
  }

  private evaluate(s: Scenario, ans: ScenarioAnswer): ScenarioOutcome {
    if (s.type === "choice" && ans.type === "choice") {
      const opt = s.options.find((o) => o.id === ans.optionId);
      if (!opt) throw new Error(`Unknown option ${ans.optionId}`);
      if (!opt.correct) {
        this.mistakes.add({ key: `${s.id}:${opt.id}`, severity: opt.critical ? "critical" : "major", category: opt.critical ? "safety" : "decisions", title: `${s.title}: ${opt.text}`, why: opt.explain });
      }
      return {
        scenarioId: s.id,
        earned: opt.correct ? s.points : 0,
        max: s.points,
        correct: opt.correct,
        critical: !!opt.critical,
        feedback: {
          tone: opt.correct ? "good" : opt.critical ? "critical" : "bad",
          title: opt.correct ? "Safe choice" : opt.critical ? "Dangerous choice" : "Not the best choice",
          body: `${opt.explain} ${s.lesson}`,
        },
        details: s.options.map((o) => ({ id: o.id, ok: o.correct, picked: o.id === opt.id, explain: o.explain })),
      };
    }

    if (s.type === "multi" && ans.type === "multi") {
      const picked = new Set(ans.optionIds);
      const correctIds = s.options.filter((o) => o.correct).map((o) => o.id);
      let hits = 0;
      let wrong = 0;
      let critical = false;
      for (const o of s.options) {
        const p = picked.has(o.id);
        if (p && o.correct) hits++;
        if (p !== o.correct) {
          wrong++;
          const isCritical = p && !!o.critical;
          critical ||= isCritical;
          this.mistakes.add({
            key: `${s.id}:${o.id}`,
            severity: isCritical ? "critical" : "major",
            category: isCritical ? "safety" : "decisions",
            title: `${s.title}: ${p ? "picked" : "missed"} "${o.text}"`,
            why: o.explain,
          });
        }
      }
      const falsePicks = [...picked].filter((id) => !correctIds.includes(id)).length;
      const ratio = Math.max(0, (hits - falsePicks) / correctIds.length);
      const correct = wrong === 0;
      return {
        scenarioId: s.id,
        earned: s.points * ratio,
        max: s.points,
        correct,
        critical,
        feedback: {
          tone: correct ? "good" : critical ? "critical" : "bad",
          title: correct ? "All correct" : `${hits} of ${correctIds.length} right${falsePicks ? `, ${falsePicks} wrong pick${falsePicks === 1 ? "" : "s"}` : ""}`,
          body: s.lesson,
        },
        details: s.options.map((o) => ({ id: o.id, ok: o.correct, picked: picked.has(o.id), explain: o.explain })),
      };
    }

    if (s.type === "match" && ans.type === "match") {
      let right = 0;
      const details: AnswerDetail[] = s.rows.map((r) => {
        const pick = ans.picks[r.id] ?? "";
        const ok = pick === r.answer;
        if (ok) right++;
        else this.mistakes.add({ key: `${s.id}:${r.id}`, severity: "major", category: "decisions", title: `${s.title}: ${r.label}`, why: r.explain });
        return { id: r.id, ok, picked: pick, explain: r.explain };
      });
      const correct = right === s.rows.length;
      return {
        scenarioId: s.id,
        earned: (s.points * right) / s.rows.length,
        max: s.points,
        correct,
        critical: false,
        feedback: { tone: correct ? "good" : "bad", title: correct ? "All matched correctly" : `${right} of ${s.rows.length} matched`, body: s.lesson },
        details,
      };
    }
    throw new Error("Unsupported scenario");
  }

  /** Moves to the next situation. Returns false when there are none left. */
  next(): boolean {
    if (!this.answeredCurrent) return true;
    this.index++;
    return this.index < this.mission.scenarios.length;
  }

  get finished(): boolean {
    return this.index >= this.mission.scenarios.length;
  }

  finish(): MissionResult {
    const max = this.mission.scenarios.reduce((s, x) => s + x.points, 0);
    const earned = this.outcomes.reduce((s, o) => s + o.earned, 0);
    const unanswered = this.mission.scenarios.filter((s) => !this.outcomes.some((o) => o.scenarioId === s.id));
    const lines = [
      { category: "decisions", label: "Correct decisions", earned: (earned / max) * 70, max: 70 },
      { category: "safety", label: "Safety record", earned: afterPenalties(30, this.mistakes.all(), { minor: 3, major: 6, critical: 30 }), max: 30 },
    ];
    return finalise({
      missionId: this.mission.id,
      lines,
      mistakes: this.mistakes.all(),
      missed: unanswered.map((s) => s.title),
      requiredComplete: unanswered.length === 0,
      stats: {
        allCorrect: this.outcomes.length === this.mission.scenarios.length && this.outcomes.every((o) => o.correct),
        criticalCount: this.outcomes.filter((o) => o.critical).length,
      },
    });
  }
}
