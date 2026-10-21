// Shared types for the training engine. Lesson content lives in src/data and is
// plain data shaped by these types, so new rooms reuse the same engine.

export type Severity = "minor" | "major" | "critical";

/** Which part of the score a mistake counts against. */
export type MistakeCategory = "tools" | "sequence" | "safety" | "hygiene" | "decisions" | "detection" | "accuracy";

export type FeedbackTone = "good" | "info" | "warn" | "bad" | "critical";

export interface Feedback {
  tone: FeedbackTone;
  title: string;
  body: string;
}

export interface RecordedMistake {
  /** Stable key so repeating the same mistake is explained again but penalised once. */
  key: string;
  severity: Severity;
  category: MistakeCategory;
  title: string;
  why: string;
}

// ---------- Equipment ----------

/** Hygiene zone used for colour-coding: a tool from one zone must not touch another. */
export type Zone = "general" | "washroom" | "toilet" | "floor" | "kitchen";

/** Simplified chemical families, used only to apply never-mix rules. */
export type ChemicalClass = "chlorine" | "acid" | "ammonia" | "neutral" | "quat" | "alkaline";

export type PpeId = "gloves" | "eye-protection" | "apron" | "dust-mask" | "hi-vis";

export interface Tool {
  id: string;
  name: string;
  short: string;
  color: string;
  icon: ToolIcon;
  /** Zones this tool may be used in. */
  zones: Zone[];
  /** True when using it outside its zones spreads germs (red cloth, toilet brush). */
  crossContamination?: boolean;
  /** Zones this tool must never enter, even if it is not a toilet tool (e.g. a washroom cloth in a kitchen). */
  forbiddenZones?: Zone[];
  /** Placed or fitted, never used with a product (sign, bin liner, refills). Picking it puts any product down. */
  placeOnly?: boolean;
  description: string;
}

export type ToolIcon = "cloth" | "brush" | "sponge" | "mop" | "liner" | "sign" | "refill" | "hand";

export interface Product {
  id: string;
  name: string;
  short: string;
  color: string;
  chemical: ChemicalClass;
  use: string;
  /** Safe on surfaces that touch food. */
  foodSafe?: boolean;
  /** Room objects or surfaces this product is suitable for, described for the safety library. */
  suitableFor: string[];
  avoidOn: string[];
  ppe: PpeId[];
  needsVentilation: boolean;
  dilution?: string;
  label: string[];
}

export interface Ppe {
  id: PpeId;
  name: string;
  purpose: string;
}

// ---------- Missions ----------

export type LevelId = "beginner" | "professional" | "expert";

export interface MissionMeta {
  id: string;
  title: string;
  shortTitle: string;
  level: LevelId;
  summary: string;
  objectives: string[];
  /** Mission ids that must be passed first. */
  requires: string[];
  estimatedMinutes: number;
  whyItMatters: string;
}

export interface RoomObject {
  id: string;
  name: string;
  zone: Zone;
  inspectNote: string;
}

export interface Requirement {
  task: string;
  why: string;
}

export interface CleaningTask {
  id: string;
  objectId: string;
  label: string;
  /** Accepted tools. Empty array means gloved hands only. */
  tools: string[];
  product: string | null;
  /** Ordering prerequisites. Skipping them is a sequence mistake. */
  requires?: Requirement[];
  /** Safety prerequisites. Skipping them is a safety mistake. */
  safetyRequires?: Requirement[];
  optional?: boolean;
  highTouch?: boolean;
  toolWhy: string;
  productWhy?: string;
  success: string;
  /** Scene flag set when the task is completed (changes how the room looks). */
  flag: string;
}

export interface CleaningMission extends MissionMeta {
  kind: "cleaning";
  sceneId: string;
  /** Shown on the PPE step: what in this job the PPE protects against. */
  ppeBrief: string;
  objects: RoomObject[];
  ppe: { required: PpeId[]; recommended: PpeId[]; offered: PpeId[]; why: Partial<Record<PpeId, string>> };
  tools: string[];
  products: string[];
  tasks: CleaningTask[];
}

export interface ScenarioOption {
  id: string;
  text: string;
  correct: boolean;
  /** An unsafe pick that would cause real harm. Caps the mission result. */
  critical?: boolean;
  explain: string;
}

export interface MatchRow {
  id: string;
  label: string;
  answer: string;
  explain: string;
}

export type ScenarioVisual =
  | { type: "label"; productId: string }
  | { type: "bottles"; items: { name: string; color: string; unlabelled?: boolean; open?: boolean }[] }
  | { type: "scene"; name: "frayed-cable" | "child-trolley" | "eye-splash" | "storage" | "body-fluid" | "clock" | "breakage" | "dnd" | "mould" };

interface ScenarioBase {
  id: string;
  title: string;
  situation: string;
  visual: ScenarioVisual;
  lesson: string;
  points: number;
}

export interface ChoiceScenario extends ScenarioBase {
  type: "choice";
  options: ScenarioOption[];
}

export interface MultiScenario extends ScenarioBase {
  type: "multi";
  options: ScenarioOption[];
}

export interface MatchScenario extends ScenarioBase {
  type: "match";
  choices: { id: string; label: string }[];
  rows: MatchRow[];
}

export type Scenario = ChoiceScenario | MultiScenario | MatchScenario;

export interface ScenarioMission extends MissionMeta {
  kind: "scenario";
  scenarios: Scenario[];
}

export interface Defect {
  id: string;
  objectId: string;
  title: string;
  why: string;
  /** Missing it is a safety-critical failure (e.g. chemicals left out). */
  safetyCritical?: boolean;
}

export interface InspectionMission extends MissionMeta {
  kind: "inspection";
  sceneId: string;
  sceneFlags: string[];
  objects: RoomObject[];
  defects: Defect[];
  /** Explanations for areas that were cleaned properly, shown on a false flag. */
  okNotes: Record<string, string>;
  /** The checklist the previous cleaner filled in. Ticks are not proof. */
  colleagueChecklist: { label: string; ticked: boolean }[];
}

export interface PlanTask {
  id: string;
  label: string;
  area: string;
  minutes: number;
  /** Must be in every acceptable plan. */
  essential?: boolean;
  /** A hazard: must be in the plan and done first. Leaving it out is safety-critical. */
  safetyFirst?: boolean;
  /** Must be the final task. */
  last?: boolean;
  /** Worth this much when included as an extra (non-essential) task. */
  value?: number;
  /** Tasks that must come earlier in the plan, if both are included. */
  after?: Requirement[];
  why: string;
}

export interface PlanningMission extends MissionMeta {
  kind: "planning";
  brief: string;
  budgetMinutes: number;
  tasks: PlanTask[];
}

export type Mission = CleaningMission | ScenarioMission | InspectionMission | PlanningMission;

// ---------- Results ----------

export interface ScoreLine {
  category: string;
  label: string;
  earned: number;
  max: number;
}

export interface MissionResult {
  missionId: string;
  score: number;
  stars: 0 | 1 | 2 | 3;
  passed: boolean;
  lines: ScoreLine[];
  mistakes: RecordedMistake[];
  criticalErrors: RecordedMistake[];
  missed: string[];
  /** Mission-specific facts used by achievements. */
  stats: Record<string, number | boolean>;
}
