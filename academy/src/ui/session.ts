import type { Account, AdminData, Assignment, AttemptRow, PassStatus, TeamData } from "../cloud/types";
import type { CleaningRun } from "../engine/cleaning";
import type { InspectionRun } from "../engine/inspection";
import type { PlanningRun } from "../engine/planning";
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
    }
  | {
      kind: "planning";
      run: PlanningRun;
      confirmSubmit: boolean;
    };

export type View =
  | { name: "home" }
  | { name: "rooms" }
  | { name: "library" }
  | { name: "progress" }
  | { name: "achievements" }
  | { name: "about" }
  | { name: "account" }
  | { name: "team" }
  | { name: "admin" }
  | { name: "briefing"; missionId: string }
  | { name: "play"; missionId: string }
  | { name: "results"; missionId: string; result: MissionResult; earned: Achievement[] };

/** Accounts and the business edition. Everything here comes from the backend. */
export interface CloudState {
  status: "checking" | "offline" | "ready";
  account: Account | null;
  busy: boolean;
  notice: { tone: "good" | "bad" | "info"; text: string } | null;
  authTab: "signin" | "signup";
  team: TeamData | null;
  myRecords: AttemptRow[] | null;
  myAssignments: Assignment[] | null;
  admin: AdminData | null;
  joinCode: string;
  confirm: string | null;
  copied: boolean;
  /** What happened to the latest mission result. */
  lastSave: "saved" | "queued" | "none" | null;
  /** Expert Pass status, loaded only when payments are switched on. */
  pass: PassStatus | null;
  currency: "NGN" | "USD";
}
