import type { LevelId } from "../engine/types";

export interface Level {
  id: LevelId;
  name: string;
  description: string;
}

export const LEVELS: Level[] = [
  { id: "beginner", name: "Beginner", description: "Tools, PPE, basic cleaning sequences and safe working practices." },
  { id: "professional", name: "Professional", description: "Complex rooms, multiple surfaces, service checklists and quality control." },
  { id: "expert", name: "Expert", description: "Prioritising, inspecting and managing time on complex jobs, using professional judgement." },
];
