import type { MissionResult, RecordedMistake, ScoreLine } from "./types";

/** A critical safety error caps the score here, whatever else went well. */
export const CRITICAL_CAP = 49;
export const PASS_MARK = 60;

export function starsFor(score: number, hasCritical: boolean): 0 | 1 | 2 | 3 {
  if (hasCritical) return score >= 40 ? 1 : 0;
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= PASS_MARK) return 1;
  return 0;
}

/** Points left in a category after penalties, never below zero. */
export function afterPenalties(max: number, mistakes: RecordedMistake[], perSeverity: Record<string, number>): number {
  const lost = mistakes.reduce((sum, m) => sum + (perSeverity[m.severity] ?? 0), 0);
  return Math.max(0, max - lost);
}

export function finalise(input: {
  missionId: string;
  lines: ScoreLine[];
  mistakes: RecordedMistake[];
  missed?: string[];
  requiredComplete?: boolean;
  stats?: Record<string, number | boolean>;
}): MissionResult {
  const raw = input.lines.reduce((s, l) => s + l.earned, 0);
  const criticalErrors = input.mistakes.filter((m) => m.severity === "critical");
  const hasCritical = criticalErrors.length > 0;
  const score = Math.round(hasCritical ? Math.min(raw, CRITICAL_CAP) : raw);
  const passed = !hasCritical && score >= PASS_MARK && input.requiredComplete !== false;
  return {
    missionId: input.missionId,
    score,
    stars: starsFor(score, hasCritical),
    passed,
    lines: input.lines.map((l) => ({ ...l, earned: Math.round(l.earned) })),
    mistakes: input.mistakes,
    criticalErrors,
    missed: input.missed ?? [],
    stats: input.stats ?? {},
  };
}

/** Collects mistakes, penalising each distinct mistake once. */
export class MistakeLog {
  private byKey = new Map<string, RecordedMistake>();

  /** Returns true when this is the first time the mistake was made. */
  add(m: RecordedMistake): boolean {
    if (this.byKey.has(m.key)) return false;
    this.byKey.set(m.key, m);
    return true;
  }

  all(): RecordedMistake[] {
    return [...this.byKey.values()];
  }

  of(...categories: RecordedMistake["category"][]): RecordedMistake[] {
    return this.all().filter((m) => categories.includes(m.category));
  }

  hasCritical(): boolean {
    return this.all().some((m) => m.severity === "critical");
  }
}
