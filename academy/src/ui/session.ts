import type { CleaningRun } from "../engine/cleaning";
import type { InspectionRun } from "../engine/inspection";
import type { Achievement } from "../engine/progress";
import type { ScenarioRun, ScenarioOutcome } from "../engine/scenario";
import type { Feedback, MissionResult } from "../engine/types";

/** Screen-only state for a mission in progress. Rules live in the runs. */
export type Session =
  | {
      kind: "cleaning";
      run: CleaningRun;
      feedback: Feedback | null;
      ppe: Set<string>;
      tab: "tools" | "products";
      confirmFinish: boolean;
      hintObject: string | null;
      flash: { obj: string; tone: Feedback["tone"] } | null;
    }
  | {
      kind: "scenario";
      run: ScenarioRun;
      multi: Set<string>;
      match: Record<string, string>;
      outcome: ScenarioOutcome | null;
    }
  | {
      kind: "inspection";
      run: InspectionRun;
      feedback: Feedback | null;
      confirmSubmit: boolean;
      flash: { obj: string; tone: Feedback["tone"] } | null;
    };

export type View =
  | { name: "home" }
  | { name: "rooms" }
  | { name: "library" }
  | { name: "progress" }
  | { name: "achievements" }
  | { name: "about" }
  | { name: "briefing"; missionId: string }
  | { name: "play"; missionId: string }
  | { name: "results"; missionId: string; result: MissionResult; earned: Achievement[] };
