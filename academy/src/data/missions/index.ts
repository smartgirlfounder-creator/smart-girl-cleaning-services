import type { LevelId, Mission } from "../../engine/types";
import { bathroomMission } from "./bathroom";
import { inspectionMission } from "./inspection";
import { safetyMission } from "./safety";

/** Playable missions, in recommended order. Add a new mission here to make it playable. */
export const MISSIONS: Mission[] = [bathroomMission, safetyMission, inspectionMission];

export function missionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export interface FutureRoom {
  id: string;
  name: string;
  level: LevelId;
  summary: string;
}

/** Rooms planned for later releases. Shown as previews; not playable yet. */
export const FUTURE_ROOMS: FutureRoom[] = [
  { id: "bedroom", name: "Bedroom cleaning", level: "professional", summary: "Bed-making to hotel standard, dusting high and low, and vacuuming in the right order." },
  { id: "sitting-room", name: "Sitting-room cleaning", level: "professional", summary: "Upholstery, electronics, delicate surfaces and clutter." },
  { id: "kitchen", name: "Kitchen cleaning", level: "professional", summary: "Food-safe products, degreasing, appliances and green-coded cloths." },
  { id: "office", name: "Office cleaning", level: "professional", summary: "Desks, shared kitchens, washrooms and working around staff." },
  { id: "hotel-room", name: "Hotel-room turnover", level: "expert", summary: "A full room against the clock, with a hotel's own checklist." },
  { id: "move-in", name: "Move-in cleaning", level: "expert", summary: "Empty-property deep clean: inside cupboards, appliances and fixtures." },
  { id: "move-out", name: "Move-out cleaning", level: "expert", summary: "End-of-tenancy standard, with an inventory-style inspection." },
  { id: "post-construction", name: "Post-construction cleaning", level: "expert", summary: "Fine dust, paint and adhesive residue, with the right respiratory PPE." },
];
