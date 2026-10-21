import { PPE, PRODUCTS, TOOLS } from "../data/equipment";
import { firstHazard } from "./chemistry";
import { MistakeLog, afterPenalties, finalise } from "./scoring";
import type { CleaningMission, CleaningTask, Feedback, MissionResult, PpeId, RoomObject } from "./types";

export type CleaningPhase = "inspect" | "ppe" | "clean" | "check" | "done";

/**
 * Runs one hands-on cleaning mission. All rules are deterministic and driven by
 * the mission data, so the same runner works for any room.
 */
export class CleaningRun {
  phase: CleaningPhase = "inspect";
  readonly inspected = new Set<string>();
  readonly checked = new Set<string>();
  readonly done = new Set<string>();
  readonly flags = new Set<string>();
  readonly residues: Record<string, string[]> = {};
  ppeOn = new Set<PpeId>();
  heldTool: string | null = null;
  heldProduct: string | null = null;
  readonly mistakes = new MistakeLog();
  private ppeAttempts = 0;

  constructor(readonly mission: CleaningMission) {}

  // ---------- Queries ----------

  object(id: string): RoomObject {
    const o = this.mission.objects.find((x) => x.id === id);
    if (!o) throw new Error(`Unknown object ${id}`);
    return o;
  }

  get requiredTasks(): CleaningTask[] {
    return this.mission.tasks.filter((t) => !t.optional);
  }

  get requiredDoneCount(): number {
    return this.requiredTasks.filter((t) => this.done.has(t.id)).length;
  }

  allRequiredDone(): boolean {
    return this.requiredTasks.every((t) => this.done.has(t.id));
  }

  canLeaveInspection(): boolean {
    return this.mission.objects.every((o) => this.inspected.has(o.id));
  }

  /** The first task the player could sensibly do next, for hints. */
  suggestedTask(): CleaningTask | undefined {
    return this.mission.tasks.find((t) => !t.optional && !this.done.has(t.id) && this.unmet(t).length === 0);
  }

  private unmet(t: CleaningTask) {
    return [...(t.safetyRequires ?? []), ...(t.requires ?? [])].filter((r) => !this.done.has(r.task));
  }

  // ---------- Actions ----------

  /** Taps on a room object; what happens depends on the phase. */
  tap(objectId: string): Feedback {
    switch (this.phase) {
      case "inspect":
        return this.inspect(objectId);
      case "ppe":
        return { tone: "info", title: "PPE first", body: "Choose your protective equipment before you start cleaning." };
      case "clean":
        return this.apply(objectId);
      case "check":
        return this.heldTool || this.heldProduct ? this.apply(objectId) : this.confirmCheck(objectId);
      case "done":
        return { tone: "info", title: "Mission finished", body: "This mission is complete." };
    }
  }

  inspect(objectId: string): Feedback {
    const o = this.object(objectId);
    this.inspected.add(o.id);
    const left = this.mission.objects.length - this.inspected.size;
    return {
      tone: "info",
      title: o.name,
      body: o.inspectNote + (left === 0 ? " Every area is inspected. Next, put on your PPE." : ` ${left} area${left === 1 ? "" : "s"} left to inspect.`),
    };
  }

  startPpe(): boolean {
    if (this.phase !== "inspect" || !this.canLeaveInspection()) return false;
    this.phase = "ppe";
    return true;
  }

  equipPpe(selected: PpeId[]): { ok: boolean; feedback: Feedback } {
    this.ppeAttempts++;
    const chosen = new Set(selected);
    const { required, recommended, why } = this.mission.ppe;
    const missing = required.filter((p) => !chosen.has(p));
    if (missing.length) {
      for (const p of missing) {
        this.mistakes.add({
          key: `ppe:${p}`,
          severity: "major",
          category: "safety",
          title: `Missing PPE: ${PPE[p].name}`,
          why: why[p] ?? PPE[p].purpose,
        });
      }
      return {
        ok: false,
        feedback: {
          tone: "bad",
          title: `You still need: ${missing.map((p) => PPE[p].name.toLowerCase()).join(" and ")}`,
          body: missing.map((p) => why[p] ?? PPE[p].purpose).join(" "),
        },
      };
    }
    this.ppeOn = chosen;
    this.phase = "clean";
    const notes: string[] = [];
    const skippedRecommended = recommended.filter((p) => !chosen.has(p));
    if (skippedRecommended.length) notes.push(`Tip: an ${PPE[skippedRecommended[0]].name.toLowerCase()} is a good idea too. ${why[skippedRecommended[0]] ?? ""}`);
    const unneeded = selected.filter((p) => !required.includes(p) && !recommended.includes(p));
    if (unneeded.length) notes.push(`Not needed for this job: ${unneeded.map((p) => PPE[p].name.toLowerCase()).join(", ")}. ${unneeded.map((p) => PPE[p].purpose).join(" ")}`);
    return {
      ok: true,
      feedback: {
        tone: "good",
        title: "PPE on. Ready to clean.",
        body: [why.gloves ? "Gloves protect you from chemicals and germs." : "", ...notes].filter(Boolean).join(" "),
      },
    };
  }

  hold(tool: string | null): void {
    this.heldTool = tool;
    // A sign, bin liner or refill is carried on its own: the bottle goes back on the trolley.
    if (tool && TOOLS[tool].placeOnly) this.heldProduct = null;
  }

  load(product: string | null): void {
    this.heldProduct = product;
    // Picking up a bottle means the sign or liner has been put down.
    if (product && this.heldTool && TOOLS[this.heldTool].placeOnly) this.heldTool = null;
  }

  apply(objectId: string): Feedback {
    const obj = this.object(objectId);
    const tool = this.heldTool;
    const product = tool && TOOLS[tool].placeOnly ? null : this.heldProduct;
    const pending = this.mission.tasks.filter((t) => t.objectId === objectId && !this.done.has(t.id));

    // 1. Chemistry: never let incompatible products meet, even on a finished surface.
    if (product) {
      const hazard = firstHazard(product, this.residues[objectId] ?? []);
      if (hazard) {
        const a = PRODUCTS[hazard.productA].name;
        const b = PRODUCTS[hazard.productB].name;
        const why = `${a} reacts with the ${b.toLowerCase()} already on the ${obj.name.toLowerCase()} and releases ${hazard.gas}, which can seriously harm your lungs. Never mix these products, and never put one straight on top of the other.`;
        this.mistakes.add({ key: `mix:${objectId}:${product}`, severity: "critical", category: "safety", title: `Dangerous mix: ${PRODUCTS[product].short} + ${PRODUCTS[hazard.productB].short}`, why });
        return { tone: "critical", title: "Stop! Dangerous chemical mix", body: why + " The simulation stopped this action." };
      }
    }

    // 2. Hygiene: colour-coded tools never leave their zone.
    if (tool) {
      const t = TOOLS[tool];
      const toiletTool = t.crossContamination && !t.zones.includes(obj.zone);
      if (toiletTool || t.forbiddenZones?.includes(obj.zone)) {
        const why = toiletTool
          ? `The ${t.name.toLowerCase()} is only for toilets. Using it on the ${obj.name.toLowerCase()} spreads germs from the toilet to a cleaner surface (cross-contamination). Keep colour-coded tools in their own zone.`
          : `The ${t.name.toLowerCase()} belongs to a different zone. Using it on the ${obj.name.toLowerCase()} carries germs between areas, for example from a bathroom into a kitchen (cross-contamination). Keep colour-coded tools in their own zone.`;
        this.mistakes.add({ key: `cross:${tool}:${objectId}`, severity: "critical", category: "hygiene", title: `Cross-contamination: ${t.short} on ${obj.name}`, why });
        return { tone: "critical", title: "Stop! Cross-contamination", body: why };
      }
    }

    if (pending.length === 0) {
      return { tone: "info", title: `${obj.name}: done`, body: "This area already meets the standard. Move on to the next task." };
    }

    // 3. A task that matches what the player is holding.
    const match = pending.find((t) => this.toolMatches(t, tool) && t.product === product);
    if (match) return this.attempt(match, obj);

    // 4. Explain what is wrong with the closest task.
    const target = pending.find((t) => this.toolMatches(t, tool)) ?? pending[0];
    if (!this.toolMatches(target, tool)) {
      const holding = tool ? TOOLS[tool].name : "gloved hands only";
      this.mistakes.add({ key: `tool:${target.id}:${tool ?? "hands"}`, severity: "major", category: "tools", title: `Wrong tool for: ${target.label}`, why: target.toolWhy });
      return { tone: "bad", title: "Wrong tool for this job", body: `You're using ${holding.toLowerCase()}. ${target.toolWhy}` };
    }
    if (product === null) {
      this.mistakes.add({ key: `noproduct:${target.id}`, severity: "minor", category: "tools", title: `No product for: ${target.label}`, why: target.productWhy ?? "" });
      return { tone: "warn", title: "This job needs a product", body: target.productWhy ?? "Choose a suitable product from the trolley." };
    }
    const p = PRODUCTS[product];
    const targetProduct = target.product ? PRODUCTS[target.product] : null;
    const why =
      targetProduct?.foodSafe && !p.foodSafe
        ? `${p.name} is not approved for surfaces that touch food. Residue could end up in someone's meal. ${target.productWhy ?? ""}`
        : product === "bleach"
        ? "Bleach isn't on the job sheet for this task. It can damage surfaces, and it is dangerous if it meets acidic toilet cleaner or ammonia glass cleaner. Only use it when a task specifically calls for it."
        : target.product === null
          ? `This step doesn't need a product. ${target.toolWhy}`
          : `${p.name} isn't the right product here. ${target.productWhy ?? ""}`;
    this.mistakes.add({ key: `product:${target.id}:${product}`, severity: "major", category: "tools", title: `Wrong product for: ${target.label}`, why });
    return { tone: "bad", title: "Wrong product", body: why };
  }

  private toolMatches(t: CleaningTask, tool: string | null): boolean {
    return t.tools.length === 0 ? tool === null : tool !== null && t.tools.includes(tool);
  }

  private attempt(task: CleaningTask, obj: RoomObject): Feedback {
    const product = task.product ? PRODUCTS[task.product] : null;
    const vent = this.mission.tasks.find((t) => t.flag === "vent");
    if (product?.needsVentilation && vent && !this.done.has(vent.id)) {
      const why = `${product.name} gives off strong fumes. Switch on the extractor fan or open a window before using it.`;
      this.mistakes.add({ key: `vent:${product.id}`, severity: "major", category: "safety", title: "Used a strong product without ventilation", why });
      return { tone: "bad", title: "Ventilate first", body: why };
    }
    const safety = (task.safetyRequires ?? []).find((r) => !this.done.has(r.task));
    if (safety) {
      this.mistakes.add({ key: `safety-req:${task.id}:${safety.task}`, severity: "major", category: "safety", title: `Unsafe: ${task.label}`, why: safety.why });
      const first = this.mission.tasks.find((t) => t.id === safety.task);
      const how = first?.tools.length
        ? ` How: choose the ${TOOLS[first.tools[0]].name.toLowerCase()} in Tools and tap the ${this.object(first.objectId).name.toLowerCase()} to place it. Then pick ${task.tools[0] ? `the ${TOOLS[task.tools[0]].name.toLowerCase()}` : "it up"} again.`
        : "";
      return { tone: "bad", title: "Safety step missing", body: safety.why + how };
    }
    const order = (task.requires ?? []).find((r) => !this.done.has(r.task));
    if (order) {
      this.mistakes.add({ key: `seq:${task.id}`, severity: "major", category: "sequence", title: `Out of order: ${task.label}`, why: order.why });
      return { tone: "warn", title: "Not yet: wrong order", body: order.why };
    }

    this.done.add(task.id);
    this.flags.add(task.flag);
    if (task.product) (this.residues[obj.id] ??= []).push(task.product);

    if (this.phase === "clean" && this.allRequiredDone()) {
      this.phase = "check";
      this.heldTool = null;
      this.heldProduct = null;
      return {
        tone: "good",
        title: task.label,
        body: `${task.success} Every required task is done. Tools are back on the trolley. Now do your final walk-through: tap each area to check it.`,
      };
    }
    return { tone: "good", title: task.label, body: task.success };
  }

  confirmCheck(objectId: string): Feedback {
    const obj = this.object(objectId);
    this.checked.add(objectId);
    const tasks = this.mission.tasks.filter((t) => t.objectId === objectId);
    const optionalLeft = tasks.filter((t) => t.optional && !this.done.has(t.id));
    const left = this.mission.objects.length - this.checked.size;
    const tail = left === 0 ? " Walk-through complete. You can finish the mission." : ` ${left} area${left === 1 ? "" : "s"} left to check.`;
    if (optionalLeft.length) {
      return { tone: "warn", title: `${obj.name}: one more thing`, body: `Not done yet: ${optionalLeft.map((t) => t.label.toLowerCase()).join(", ")}. Pick it from the trolley if you'd like to go the extra mile.${tail}` };
    }
    return { tone: "good", title: `${obj.name}: meets the standard`, body: `Checked: ${tasks.map((t) => t.label.toLowerCase()).join(", ") || "nothing needed"}.${tail}` };
  }

  finish(): MissionResult {
    this.phase = "done";
    const req = this.requiredTasks;
    const objects = this.mission.objects.length;
    const missed = req.filter((t) => !this.done.has(t.id)).map((t) => t.label);
    const lines = [
      { category: "completion", label: "Tasks completed", earned: (this.requiredDoneCount / req.length) * 35, max: 35 },
      { category: "check", label: "Final walk-through", earned: (this.checked.size / objects) * 5, max: 5 },
      { category: "tools", label: "Right tools and products", earned: afterPenalties(20, this.mistakes.of("tools"), { minor: 2, major: 4 }), max: 20 },
      { category: "sequence", label: "Correct order", earned: afterPenalties(15, this.mistakes.of("sequence"), { minor: 2, major: 5 }), max: 15 },
      { category: "safety", label: "Safety and hygiene", earned: afterPenalties(25, this.mistakes.of("safety", "hygiene"), { minor: 3, major: 8, critical: 25 }), max: 25 },
    ];
    const optional = this.mission.tasks.filter((t) => t.optional);
    return finalise({
      missionId: this.mission.id,
      lines,
      mistakes: this.mistakes.all(),
      missed,
      requiredComplete: missed.length === 0,
      stats: {
        sequenceMistakes: this.mistakes.of("sequence").length,
        optionalDone: optional.every((t) => this.done.has(t.id)),
        ppeFirstTry: this.ppeAttempts === 1,
        mistakeCount: this.mistakes.all().length,
      },
    });
  }
}
