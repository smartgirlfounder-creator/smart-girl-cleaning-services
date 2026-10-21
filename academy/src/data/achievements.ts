import type { Achievement } from "../engine/progress";
import { MISSIONS } from "./missions";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-shine", name: "First Shine", description: "Complete your first mission.", test: () => true },
  { id: "safety-first", name: "Safety First", description: "Pass Chemical Safety with no dangerous choices.", test: (r) => r.missionId === "chemical-safety" && r.passed && r.criticalErrors.length === 0 },
  { id: "perfect-order", name: "Perfect Order", description: "Pass the bathroom with no sequence mistakes.", test: (r) => r.missionId === "bathroom-basics" && r.passed && r.stats.sequenceMistakes === 0 },
  { id: "extra-mile", name: "Extra Mile", description: "Do the optional restock in the bathroom.", test: (r) => r.missionId === "bathroom-basics" && r.stats.optionalDone === true },
  { id: "sharp-eye", name: "Sharp Eye", description: "Find every problem in the final inspection.", test: (r) => r.missionId === "final-inspection" && r.stats.foundAll === true },
  { id: "three-stars", name: "Three-Star Pro", description: "Earn 3 stars on any mission.", test: (r) => r.stars === 3 },
  {
    id: "graduate",
    name: "Academy Graduate",
    description: "Pass all three training missions.",
    test: (_r, p) => MISSIONS.every((m) => p.missions[m.id]?.passed),
  },
];
