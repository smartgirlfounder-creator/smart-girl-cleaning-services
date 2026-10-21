import { MistakeLog, afterPenalties, finalise } from "./scoring";
import type { Defect, Feedback, InspectionMission, MissionResult } from "./types";

/** Runs a quality-control walk-through: find what a colleague missed. */
export class InspectionRun {
  readonly found = new Set<string>();
  readonly falseFlags = new Set<string>();
  readonly mistakes = new MistakeLog();
  submitted = false;

  constructor(readonly mission: InspectionMission) {}

  defectsOn(objectId: string): Defect[] {
    return this.mission.defects.filter((d) => d.objectId === objectId);
  }

  /** Flags an area as a problem. Each tap on an area reveals its next unfound defect. */
  flag(objectId: string): Feedback {
    const obj = this.mission.objects.find((o) => o.id === objectId);
    if (!obj) throw new Error(`Unknown object ${objectId}`);
    const defects = this.defectsOn(objectId);
    const next = defects.find((d) => !this.found.has(d.id));
    if (next) {
      this.found.add(next.id);
      const more = defects.some((d) => !this.found.has(d.id));
      return {
        tone: next.safetyCritical ? "critical" : "good",
        title: `Found: ${next.title}`,
        body: next.why + (more ? " Look closer: there's something else here too." : ""),
      };
    }
    if (defects.length) {
      return { tone: "info", title: `${obj.name}: already logged`, body: "You've found every problem in this area." };
    }
    if (!this.falseFlags.has(objectId)) {
      this.falseFlags.add(objectId);
      this.mistakes.add({ key: `false:${objectId}`, severity: "minor", category: "accuracy", title: `False flag: ${obj.name}`, why: this.mission.okNotes[objectId] ?? "This area was cleaned properly." });
    }
    return { tone: "warn", title: `${obj.name} looks fine`, body: this.mission.okNotes[objectId] ?? "This area was cleaned properly. Flagging good work wastes time on a re-clean." };
  }

  get foundCount(): number {
    return this.found.size;
  }

  submit(): MissionResult {
    this.submitted = true;
    const all = this.mission.defects;
    const missed = all.filter((d) => !this.found.has(d.id));
    for (const d of missed) {
      this.mistakes.add({
        key: `missed:${d.id}`,
        severity: d.safetyCritical ? "critical" : "major",
        category: d.safetyCritical ? "safety" : "detection",
        title: `Missed: ${d.title}`,
        why: d.why,
      });
    }
    const safety = all.filter((d) => d.safetyCritical);
    const safetyFound = safety.filter((d) => this.found.has(d.id)).length;
    const normal = all.filter((d) => !d.safetyCritical);
    const lines = [
      { category: "detection", label: "Problems found", earned: (normal.filter((d) => this.found.has(d.id)).length / normal.length) * 60, max: 60 },
      { category: "safety", label: "Safety hazards found", earned: safety.length ? (safetyFound / safety.length) * 20 : 20, max: 20 },
      { category: "accuracy", label: "Accuracy (no false flags)", earned: afterPenalties(20, this.mistakes.of("accuracy"), { minor: 5 }), max: 20 },
    ];
    return finalise({
      missionId: this.mission.id,
      lines,
      mistakes: this.mistakes.all(),
      missed: missed.map((d) => d.title),
      stats: { foundAll: missed.length === 0, falseFlags: this.falseFlags.size },
    });
  }
}
