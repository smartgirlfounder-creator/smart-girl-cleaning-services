import * as THREE from "three";
import { PRODUCTS, TOOLS } from "../data/equipment";
import type { Feedback } from "../engine/types";
import type { Area, Spot } from "./bathroom";
import { type Pose, reachFor } from "./character";
import { bottleMesh, toolMesh } from "./props";
import type { World3D } from "./world";

// Turns game events into a performance: the cleaner walks, picks things up, cleans,
// gets it wrong, reacts and celebrates. The game rules stay in the engine; this file
// only decides how each result looks and sounds.

type Clip = (t: number) => Partial<Pose>;

const idle: Clip = (t) => ({ spineX: 0.02 * Math.sin(t * 2), headY: 0.08 * Math.sin(t * 0.6) });

const lookAt = (h: number): Clip => (t) => ({
  spineX: h < 0.8 ? 0.35 : 0.12,
  headX: h < 0.8 ? 0.3 : h > 1.4 ? -0.3 : 0.05,
  headZ: 0.14 + 0.05 * Math.sin(t * 2),
  shLX: -1.15,
  elL: -2.0,
  shLZ: 0.32,
  ...(h < 0.8 ? { hipLX: -0.35, hipRX: -0.35, kneeL: 0.7, kneeR: 0.7, drop: 0.68 * (1 - Math.cos(0.35)) } : {}),
});

/** Arm angle (from hanging) that points the left hand forward at a height. */
const sprayArm = (h: number) => Math.PI / 2 + Math.max(-0.7, Math.min(0.5, (h - 1.1) * 0.9));

const spray = (h: number): Clip => (t) => ({
  ...(h < 0.75 ? reachFor(h) : {}),
  shRX: -0.3,
  elR: -0.5,
  shLX: -(sprayArm(h) - 0.2),
  elL: -0.2 - 0.06 * Math.max(0, Math.sin(t * 14)),
  shLZ: -0.05,
});

const scrub = (h: number): Clip => (t) => {
  const r = reachFor(h);
  return { ...r, shRX: (r.shRX ?? -1) + 0.13 * Math.sin(t * 10), shRZ: -0.14 + 0.16 * Math.cos(t * 10), spineY: 0.05 * Math.sin(t * 10), shLX: -0.3, elL: -0.9 };
};

const wipe = (h: number): Clip => (t) => {
  const r = reachFor(h);
  return { ...r, shRX: r.shRX, shRZ: -0.2 + 0.42 * Math.sin(t * 5), spineY: 0.12 * Math.sin(t * 5), shLX: -0.3, elL: -0.9 };
};

const mopping: Clip = (t) => ({ shRX: -0.68, elR: -0.08, shRY: 0.55 * Math.sin(t * 3.2), spineY: 0.28 * Math.sin(t * 3.2), spineX: 0.12, shLX: -0.95, elL: -0.7, shLZ: -0.3 });

const confused: Clip = (t) => ({
  shLX: -0.45, shRX: -0.45, shLZ: 0.55, shRZ: -0.55, elL: -1.5, elR: -1.5,
  headZ: 0.28, headY: 0.3 * Math.sin(t * 9) * Math.max(0, 1 - t), spineZ: 0.05,
  bob: Math.max(0, Math.sin(t * 8)) * 0.015,
});

const stopHands: Clip = () => ({ shLX: -1.75, shRX: -1.75, elL: -1.2, elR: -1.2, shLZ: 0.2, shRZ: -0.2, spineX: -0.12, headX: -0.08 });

const celebrate = (big: boolean): Clip => (t) =>
  big
    ? { shLX: -2.9, shRX: -2.9, shLZ: 0.45, shRZ: -0.45, elL: -0.2, elR: -0.2, bob: Math.max(0, Math.sin(t * 9)) * 0.14, headX: -0.15 }
    : { shRX: -1.35, elR: -1.5, shRZ: -0.25, headX: 0.18 * Math.sin(t * 12) * Math.max(0, 1 - t * 1.2) };

const point = (yawOffset: number): Clip => () => ({ shRX: -1.55, elR: -0.05, shRY: yawOffset, headY: yawOffset * 0.5, shLX: -0.2 });

const walkClip = (getPhase: () => number, backward: boolean): Clip => () => {
  const p = getPhase();
  const s = Math.sin(p);
  const dir = backward ? -1 : 1;
  return {
    hipLX: 0.5 * s * dir, hipRX: -0.5 * s * dir,
    kneeL: Math.max(0, -Math.cos(p)) * 0.7 + 0.05, kneeR: Math.max(0, Math.cos(p)) * 0.7 + 0.05,
    shLX: -0.4 * s * dir, shRX: 0.4 * s * dir,
    bob: Math.abs(Math.cos(p)) * 0.035, spineY: 0.08 * s, spineX: 0.05,
  };
};

export class Director {
  private walkPhase = 0;
  private toolId: string | null = null;
  private productId: string | null = null;

  constructor(private w: World3D) {}

  private get c() {
    return this.w.char;
  }

  private get room() {
    return this.w.room;
  }

  /** Arm poses for carrying things, used whenever a clip leaves an arm free. */
  holdPose(): Partial<Pose> {
    const p: Partial<Pose> = {};
    if (this.toolId === "mop") Object.assign(p, { shRX: -0.35, elR: -1.25 });
    else if (this.toolId === "wet-sign") Object.assign(p, { shRX: -0.05, elR: -0.05, shRZ: -0.22 });
    else if (this.toolId) Object.assign(p, { shRX: -0.3, elR: -0.55 });
    if (this.productId) Object.assign(p, { shLX: -0.35, elL: -1.25 });
    return p;
  }

  /** Re-attaches held items after the character is rebuilt. */
  restoreHands(): void {
    const tool = this.toolId;
    const product = this.productId;
    this.toolId = this.productId = null;
    this.giveTool(tool);
    this.giveProduct(product);
  }

  private giveTool(id: string | null): void {
    this.toolId = id;
    this.c.holdRight(id ? toolMesh(id) : null);
    const mop = this.c.heldR?.getObjectByName("handle");
    if (mop) mop.rotation.x = Math.PI / 2;
  }

  private giveProduct(id: string | null): void {
    this.productId = id;
    this.c.holdLeft(id ? bottleMesh(id) : null);
  }

  /** Uses up a liner, refill or sign: the hand is empty again (the trolley has spares). */
  private consume(): void {
    const id = this.toolId;
    this.giveTool(null);
    const spare = id && id !== "wet-sign" ? this.trolleyItem(id) : undefined;
    if (spare) spare.visible = true;
  }

  private trolleyItem(id: string): THREE.Object3D | undefined {
    return this.room.trolley.items.get(id);
  }

  // ---------- Movement ----------

  private async walkTo(x: number, z: number, opts: { backward?: boolean; speed?: number; caption?: string } = {}): Promise<void> {
    const pos = this.c.root.position;
    const target = new THREE.Vector3(x, 0, z);
    const points: THREE.Vector3[] = [];
    // Long trips go round through the middle of the room so the cleaner doesn't walk through fittings.
    if (!opts.backward && pos.distanceTo(target) > 1.6) {
      const mid = pos.clone().add(target).multiplyScalar(0.5);
      mid.lerp(new THREE.Vector3(0.1, 0, 0.3), 0.6);
      points.push(mid);
    }
    points.push(target);
    if (opts.caption) this.w.caption(opts.caption);
    this.w.setClip(walkClip(() => this.walkPhase, !!opts.backward));
    const speed = opts.speed ?? 1.5;
    for (const p of points) {
      await this.w.until((dt) => {
        const d = p.clone().sub(pos);
        d.y = 0;
        const dist = d.length();
        if (dist < 0.03) return true;
        const heading = Math.atan2(d.x, d.z);
        this.c.targetYaw = opts.backward ? heading + Math.PI : heading;
        const step = Math.min(dist, speed * dt);
        pos.addScaledVector(d.normalize(), step);
        const before = this.walkPhase;
        this.walkPhase += step * 7.5;
        if (Math.floor(before / Math.PI) !== Math.floor(this.walkPhase / Math.PI)) this.w.sfx.play("step");
        return false;
      });
    }
    this.w.setClip(idle);
  }

  private async goTo(spot: Spot, caption?: string): Promise<void> {
    await this.walkTo(spot.x, spot.z, { caption });
    this.c.targetYaw = spot.face;
    await this.w.wait(0.2);
  }

  private async play(clip: Clip, sec: number): Promise<void> {
    this.w.setClip(clip);
    await this.w.wait(sec);
  }

  private headPos(): THREE.Vector3 {
    return this.c.root.position.clone().add(new THREE.Vector3(0, 1.95, 0));
  }

  // ---------- Picking up and putting back ----------

  async equip(tool: string | null, product: string | null): Promise<void> {
    if (tool === this.toolId && product === this.productId) return;
    const t = this.room.trolleySpot;
    const name = (id: string | null, kind: "tool" | "product") => (id ? (kind === "tool" ? TOOLS[id].name : PRODUCTS[id].name).toLowerCase() : "");
    const what = [tool !== this.toolId ? name(tool, "tool") || "free hands" : "", product !== this.productId ? name(product, "product") || "no product" : ""].filter(Boolean).join(" and ");
    await this.goTo(t, `Going to the trolley for: ${what}`);
    if (tool !== this.toolId) {
      if (this.toolId) {
        this.w.caption(`Putting back the ${name(this.toolId, "tool")}`);
        await this.play(() => reachFor(this.toolId === "mop" ? 1.0 : 0.5), 0.45);
        const back = this.trolleyItem(this.toolId);
        if (back && !(this.toolId === "wet-sign" && this.room.level.sign)) back.visible = true;
        this.giveTool(null);
        this.w.sfx.play("putdown");
      }
      if (tool) {
        this.w.caption(`Picking up the ${name(tool, "tool")}`);
        await this.play(() => reachFor(tool === "mop" ? 1.0 : tool === "wet-sign" ? 0.35 : 0.5), 0.5);
        const item = this.trolleyItem(tool);
        if (item) item.visible = false;
        this.giveTool(tool);
        this.w.sfx.play("pickup");
        this.w.fx.pop(TOOLS[tool].short, this.headPos(), "info", 1.4, 0.2);
      }
    }
    if (product !== this.productId) {
      if (this.productId) {
        this.w.caption(`Putting back the ${name(this.productId, "product")}`);
        await this.play(() => ({ shLX: -1.1, elL: -0.3, spineX: 0.08 }), 0.4);
        const back = this.trolleyItem(`p:${this.productId}`);
        if (back) back.visible = true;
        this.giveProduct(null);
        this.w.sfx.play("putdown");
      }
      if (product) {
        this.w.caption(`Picking up the ${name(product, "product")}`);
        await this.play(() => ({ shLX: -1.15, elL: -0.3, spineX: 0.08 }), 0.45);
        const item = this.trolleyItem(`p:${product}`);
        if (item) item.visible = false;
        this.giveProduct(product);
        this.w.sfx.play("pickup");
        this.w.fx.pop(PRODUCTS[product].short, this.headPos().add(new THREE.Vector3(0, 0.25, 0)), "info", 1.4, 0.2);
      }
    }
    this.w.setClip(idle);
    await this.w.wait(0.25);
  }

  // ---------- Acting out results ----------

  async perform(areaId: string, fb: Feedback, ctx: { phase: string; tool: string | null; product: string | null }): Promise<void> {
    const area = this.room.areas.get(areaId);
    if (!area) return;
    const objName = this.w.run.object(areaId).name.toLowerCase();
    const h = area.work[0].y;
    this.c.setExpression("neutral");
    // Make sure the hands match what the player chose before walking over.
    await this.equip(ctx.tool, ctx.product);

    if (fb.kind === "inspect") {
      await this.goTo(area.spot, `Inspecting the ${objName}`);
      this.c.setExpression("focused");
      this.w.sfx.play("hmm");
      this.w.fx.pop("?", area.top.clone().add(new THREE.Vector3(0, 0.2, 0)), "think", 1.3, 0.25);
      await this.play(lookAt(h), 1.3);
      this.c.setExpression("surprised");
      this.w.fx.pop("!", area.top.clone().add(new THREE.Vector3(0, 0.2, 0)), "think", 1.2, 0.25);
      await this.play(idle, 0.4);
      this.c.setExpression("neutral");
      return;
    }

    if (fb.kind === "check") {
      await this.goTo(area.spot, `Checking the ${objName}`);
      this.c.setExpression("focused");
      await this.play(lookAt(h), 0.9);
      if (fb.tone === "good") {
        this.c.setExpression("happy");
        this.w.sfx.play("tick");
        this.w.fx.pop("✓", area.top, "good", 1.3, 0.25);
        await this.play(celebrate(false), 0.8);
      } else {
        this.c.setExpression("confused");
        this.w.sfx.play("nope");
        await this.play(confused, 1);
      }
      this.c.setExpression("neutral");
      return;
    }

    switch (fb.kind) {
      case "task-done":
        await this.doTask(fb.taskId!, area);
        await this.reward(ctx.phase !== "check" && this.w.run.phase === "check");
        break;
      case "already-done":
        await this.goTo(area.spot, `The ${objName} is already clean`);
        await this.play(lookAt(h), 0.7);
        this.c.setExpression("happy");
        this.w.sfx.play("tick");
        this.w.fx.pop("✓", area.top, "good", 1.2, 0.22);
        await this.play(celebrate(false), 0.7);
        break;
      case "chemical-mix":
      case "ventilate":
        await this.safetyStop(area, fb);
        break;
      case "safety-step":
        await this.goTo(area.spot, `Heading to the ${objName}`);
        this.c.setExpression("worried");
        this.w.sfx.play("alarm");
        this.w.bang("⚠ SAFETY FIRST!", "stop");
        this.w.fx.pop("⚠", this.headPos(), "stop", 2.2, 0.3);
        // Point towards where the wet floor sign should go.
        await this.pointAt(this.room.signSpot.x, this.room.signSpot.z, 1.4);
        break;
      case "wrong-order":
        await this.goTo(area.spot, `Heading to the ${objName}`);
        await this.play(lookAt(h), 0.6);
        this.c.setExpression("confused");
        this.w.sfx.play("nope");
        this.faceCamera();
        this.w.fx.pop("Not yet!", this.headPos(), "think", 1.8, 0.24);
        await this.play(confused, 1.2);
        break;
      case "cross-contamination":
        await this.goTo(area.spot, `Taking the ${ctx.tool ? TOOLS[ctx.tool].name.toLowerCase() : "tool"} to the ${objName}`);
        // Reaches out... and stops before touching.
        await this.play(() => ({ ...reachFor(h), shRX: (reachFor(h).shRX ?? -1) * 0.7 }), 0.6);
        await this.wrong(area);
        break;
      case "wrong-tool":
      case "no-product":
      case "wrong-product":
        await this.goTo(area.spot, `Trying the ${objName}`);
        if (fb.kind === "wrong-tool") await this.attempt(h);
        else await this.readLabel();
        await this.wrong(area);
        break;
      default:
        await this.goTo(area.spot);
    }
    this.c.setExpression("neutral");
    this.w.setClip(idle);
  }

  /** A short, harmless try with the tool in hand: never sprays a product. */
  private async attempt(h: number): Promise<void> {
    const t = this.toolId;
    const clip = !t ? lookAt(h) : t === "mop" ? mopping : t.startsWith("cloth") ? wipe(h) : t === "wet-sign" || t === "bin-liner" || t === "refill" ? () => reachFor(Math.max(0.3, h)) : scrub(h);
    if (t === "mop") this.mopUse(true);
    this.w.sfx.play(t?.startsWith("cloth") ? "wipe" : "scrub", 0.6);
    await this.play(clip, 0.8);
    if (t === "mop") this.mopUse(false);
  }

  /** Lifts the bottle and reads the label before deciding. */
  private async readLabel(): Promise<void> {
    if (!this.productId) {
      await this.play(() => ({ shLX: -1.0, elL: -1.6, headX: 0.2 }), 0.7);
      return;
    }
    await this.play(() => ({ shLX: -1.0, elL: -1.65, headX: 0.25, headZ: 0.1 }), 0.9);
  }

  private async wrong(area: Area): Promise<void> {
    this.faceCamera();
    this.c.setExpression("confused");
    this.w.sfx.play("wrong");
    this.w.bang("BAM-BAM-BAM! WRONG!", "bad");
    this.w.fx.pop("✗", this.headPos(), "bad", 2.0, 0.34);
    await this.play(confused, 1.3);
    // Step back from the area.
    const back = new THREE.Vector3(area.spot.x, 0, area.spot.z).add(new THREE.Vector3(Math.sin(area.spot.face), 0, Math.cos(area.spot.face)).multiplyScalar(-0.3));
    await this.walkTo(back.x, back.z, { backward: true, speed: 0.8 });
  }

  /** Dangerous choices stop before anything is applied. */
  private async safetyStop(area: Area, fb: Feedback): Promise<void> {
    const objName = this.w.run.object(area.id).name.toLowerCase();
    await this.goTo(area.spot, `Heading to the ${objName}`);
    // Bottle comes up... and the action is stopped before a drop is sprayed.
    await this.play(spray(area.work[0].y), 0.45);
    this.c.setExpression("worried");
    this.faceCamera();
    this.w.sfx.play("alarm");
    this.w.bang(fb.kind === "ventilate" ? "⚠ STOP! VENTILATE FIRST" : "⚠ STOP! DANGEROUS MIX", "stop");
    this.w.fx.pop("STOP", area.top.clone().add(new THREE.Vector3(0, 0.1, 0)), "stop", 2.6, 0.36);
    await this.play(stopHands, 1.2);
    if (fb.kind === "ventilate") {
      const vent = this.room.areas.get("vent")!;
      await this.pointAt(vent.spot.x - 1, vent.spot.z, 1.2);
    } else {
      await this.walkTo(area.spot.x - Math.sin(area.spot.face) * 0.4, area.spot.z - Math.cos(area.spot.face) * 0.4, { backward: true, speed: 0.8 });
    }
  }

  /** Turns towards the player, so reactions are seen face-on. */
  private faceCamera(): void {
    this.c.targetYaw = this.w.yawToCamera(this.c.root.position);
  }

  private async pointAt(x: number, z: number, sec: number): Promise<void> {
    const p = this.c.root.position;
    this.c.targetYaw = Math.atan2(x - p.x, z - p.z);
    await this.play(point(0), sec);
  }

  private async reward(final: boolean): Promise<void> {
    this.c.setExpression("happy");
    this.faceCamera();
    if (final) {
      this.w.sfx.play("fanfare");
      this.w.bang("ALL CLEAN! ✨", "good");
      this.w.fx.sparkle(this.c.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 1.2, 24);
      await this.play(celebrate(true), 1.8);
      // Tools go back on the trolley for the walk-through.
      await this.equip(null, null);
    } else {
      this.w.sfx.play("success");
      this.w.fx.pop("✓", this.headPos(), "good", 1.4, 0.26);
      await this.play(celebrate(false), 0.8);
    }
  }

  private mopUse(on: boolean): void {
    const handle = this.c.heldR?.getObjectByName("handle");
    if (handle) handle.rotation.x = on ? 0 : Math.PI / 2;
  }

  private nozzle(): THREE.Vector3 {
    return this.c.heldL?.getObjectByName("nozzle")?.getWorldPosition(new THREE.Vector3()) ?? this.c.handPosition("L");
  }

  private async sprayAt(p: THREE.Vector3, sec = 0.6): Promise<void> {
    this.w.setClip(spray(p.y));
    await this.w.wait(0.3);
    const color = this.productId ? PRODUCTS[this.productId].color : "#ffffff";
    this.w.sfx.play("spray");
    let puff = 0;
    await this.w.during(sec, (_, dt) => {
      if ((puff -= dt) <= 0) {
        this.w.fx.spray(this.nozzle(), p, color);
        puff = 0.22;
      }
    });
  }

  /** Cleans a surface over time while the dirt fades. */
  private async workOn(clip: Clip, sec: number, key: string | null, at: THREE.Vector3, opts: { foam?: boolean; from?: number; to?: number; sound?: "scrub" | "wipe" } = {}): Promise<void> {
    this.w.setClip(clip);
    this.w.sfx.play(opts.sound ?? "wipe", sec);
    const from = opts.from ?? this.room.level[key ?? ""] ?? 1;
    const to = opts.to ?? 0;
    let bubble = 0;
    await this.w.during(sec, (p, dt) => {
      if (key) this.room.set(key, from + (to - from) * p);
      if (opts.foam && (bubble -= dt) <= 0) {
        this.w.fx.foam(at);
        bubble = 0.15;
      }
    });
  }

  private async doTask(taskId: string, area: Area): Promise<void> {
    const name = this.w.run.mission.tasks.find((t) => t.id === taskId)?.label ?? "Cleaning";
    const [w0, w1, w2, w3] = area.work;
    if (taskId !== "floor-mop" && taskId !== "floor-sign") await this.goTo(area.spot, name);
    this.w.caption(name);
    this.c.setExpression("focused");
    switch (taskId) {
      case "vent-on":
        await this.play(() => reachFor(1.75), 0.5);
        this.w.sfx.play("click");
        this.w.sfx.play("fan");
        await this.w.during(0.9, (p) => this.room.set("vent", p));
        break;
      case "bin-empty":
        await this.play(() => reachFor(0.4), 0.5);
        this.w.sfx.play("bag");
        await this.w.during(0.9, (p) => this.room.set("bin", 1 - p));
        this.consume();
        await this.play(() => reachFor(0.4), 0.4);
        this.room.set("liner", 1);
        break;
      case "toilet-apply":
        await this.play(() => reachFor(0.9), 0.4);
        await this.w.during(0.5, (p) => this.room.set("lid", p));
        this.w.setClip(spray(0.35));
        await this.w.wait(0.3);
        this.w.sfx.play("pour");
        await this.w.during(1.4, (p) => {
          this.room.set("gel", p);
          this.w.fx.pour(this.nozzle(), PRODUCTS["toilet-cleaner"].color);
        });
        this.w.fx.pop("Let it soak ⏱", area.top, "think", 2.2, 0.22);
        break;
      case "mirror":
        await this.sprayAt(w0);
        await this.workOn((t) => wipe(1.75 - Math.min(1, t / 2.2) * 0.3)(t), 2.2, "mirror", w0);
        this.w.fx.sparkle(w0.clone().setY(1.6), 0.6, 14);
        break;
      case "sink":
        await this.sprayAt(w0);
        await this.workOn(wipe(0.9), 1.8, "sink", w0, { foam: true });
        this.w.sfx.play("water", 0.8);
        await this.w.during(0.8, () => this.w.fx.water(new THREE.Vector3(-0.4, 0.93, -2.3), 0.04));
        this.w.fx.sparkle(w0, 0.4, 10);
        break;
      case "shower":
        await this.sprayAt(w0, 0.5);
        await this.sprayAt(w1, 0.4);
        await this.workOn((t) => (this.toolId?.startsWith("cloth") ? wipe : scrub)(1.45 - Math.min(1, t / 2.4) * 0.85)(t), 2.4, "shower", w1, { foam: true, sound: this.toolId?.startsWith("cloth") ? "wipe" : "scrub" });
        this.w.caption("Rinsing from top to bottom");
        this.w.sfx.play("water", 1.2);
        await this.w.during(1.2, () => this.w.fx.water(new THREE.Vector3(-2.4, 2.0, -2.3), 0.25));
        this.w.fx.sparkle(w1, 0.6, 12);
        break;
      case "touch":
        await this.sprayAt(w0, 0.4);
        await this.workOn(wipe(w0.y), 0.9, "touch", w0, { from: 1, to: 0.5 });
        await this.workOn(wipe(w1.y), 0.9, "touch", w1, { from: 0.5, to: 0 });
        this.w.fx.pop("Germs gone!", area.top, "good", 1.6, 0.22);
        break;
      case "toilet-scrub":
        await this.workOn(scrub(0.35), 2.2, "bowl", w2, { foam: true, sound: "scrub" });
        this.room.set("gel", 0);
        await this.play(() => reachFor(w0.y), 0.4);
        this.w.sfx.play("flush");
        await this.w.during(1.0, () => this.w.fx.water(w2, 0.12));
        this.w.fx.sparkle(w2, 0.3, 10);
        break;
      case "toilet-wipe":
        await this.sprayAt(w1, 0.4);
        await this.workOn(wipe(w0.y), 0.6, "toilet", w0, { from: 1, to: 0.7 });
        await this.workOn(wipe(w1.y), 0.8, "toilet", w1, { from: 0.7, to: 0.3 });
        await this.workOn(wipe(w3.y), 0.8, "toilet", w3, { from: 0.3, to: 0 });
        await this.w.during(0.4, (p) => this.room.set("lid", 1 - p));
        this.w.fx.sparkle(w1, 0.5, 12);
        break;
      case "restock":
        await this.play(() => reachFor(w0.y), 0.5);
        this.w.sfx.play("pickup");
        await this.w.during(0.4, (p) => this.room.set("stock", p * 0.5));
        await this.play(() => reachFor(w1.y), 0.5);
        this.consume();
        this.w.sfx.play("pickup");
        await this.w.during(0.4, (p) => this.room.set("stock", 0.5 + p * 0.5));
        break;
      case "floor-sign": {
        await this.goTo(this.room.signSpot, name);
        await this.play(() => reachFor(0.25), 0.6);
        this.consume();
        this.room.placeSign(true);
        this.w.sfx.play("putdown");
        this.w.fx.pop("⚠", this.room.signPlace.clone().setY(0.9), "think", 1.4, 0.2);
        break;
      }
      case "floor-mop": {
        // Dilute the floor cleaner in the bucket, then mop from the far corner back to the door.
        await this.goTo(this.room.trolleySpot, "Diluting floor cleaner in the bucket");
        this.w.setClip(spray(0.5));
        await this.w.wait(0.3);
        this.w.sfx.play("pour");
        await this.w.during(0.8, () => this.w.fx.pour(this.nozzle(), PRODUCTS["floor-cleaner"].color));
        const [[x0, z0], ...rest] = this.room.mopPath;
        await this.walkTo(x0, z0, { caption: "Starting in the far corner" });
        this.mopUse(true);
        this.w.caption("Mopping back towards the door");
        this.w.sfx.play("wipe", 6);
        const total = rest.length;
        let done = 0;
        for (const [x, z] of rest) {
          const start = done / total;
          const pos = this.c.root.position;
          const from = pos.clone();
          const to = new THREE.Vector3(x, 0, z);
          const len = from.distanceTo(to);
          this.c.targetYaw = Math.atan2(from.x - to.x, from.z - to.z);
          this.w.setClip(mopping);
          await this.w.during(len / 0.65, (p) => {
            pos.lerpVectors(from, to, p);
            const k = start + p / total;
            this.room.set("floor", 1 - k);
            this.room.set("wet", k);
          });
          done++;
        }
        this.mopUse(false);
        this.w.fx.sparkle(new THREE.Vector3(0, 0.1, 0), 3, 20);
        break;
      }
      default:
        await this.play(scrub(area.work[0].y), 1.2);
    }
    this.w.setClip(idle);
  }
}
