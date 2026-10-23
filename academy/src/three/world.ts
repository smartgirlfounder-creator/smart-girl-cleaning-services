import * as THREE from "three";
import type { CleaningRun } from "../engine/cleaning";
import type { Feedback } from "../engine/types";
import type { Avatar } from "../ui/avatar";
import { BathroomRoom } from "./bathroom";
import { Character, type Pose } from "./character";
import { Director } from "./director";
import { Effects } from "./fx";
import { Sfx } from "./sfx";

// The 3D view: renderer, camera, game loop and tapping. One instance lives for the whole
// app; its element is moved into each re-rendered screen so the scene keeps running.

class Aborted extends Error {}

interface Waiter {
  fn: (dt: number) => boolean;
  resolve: () => void;
  reject: (e: Error) => void;
}

const SPEED_KEY = "smart-sweep:speed";

export class World3D {
  readonly el: HTMLDivElement;
  readonly sfx = new Sfx();
  scene = new THREE.Scene();
  room!: BathroomRoom;
  char!: Character;
  fx!: Effects;
  director!: Director;
  run!: CleaningRun;
  busy = false;
  /** Called when the player taps an area in the scene. */
  onPick: (area: string) => void = () => {};
  /** Called when an animation starts or ends, so the screen can re-render. */
  onBusy: (busy: boolean) => void = () => {};
  speed = 1;
  clip: (t: number) => Partial<Pose> = () => ({});
  clipStart = 0;
  time = 0;

  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  private camTarget = new THREE.Vector3(-0.2, 0.75, -0.35);
  private canvas: HTMLCanvasElement;
  private captionEl: HTMLDivElement;
  private bangEl: HTMLDivElement;
  private waiters: Waiter[] = [];
  private epoch = 0;
  private running = false;
  private last = 0;
  private markers = new Map<string, THREE.Sprite>();
  private hintArrow: THREE.Sprite | null = null;
  private hintArea: string | null = null;
  private shadow: THREE.Mesh;
  private ro: ResizeObserver;
  private down: { x: number; y: number } | null = null;

  static supported(): boolean {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  }

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "world3d";
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute("aria-label", "3D bathroom with your cleaner. Tap an area for your cleaner to work on it, or use the area list.");
    this.canvas.setAttribute("role", "img");
    this.captionEl = document.createElement("div");
    this.captionEl.className = "w3d-caption";
    this.captionEl.setAttribute("aria-live", "polite");
    this.bangEl = document.createElement("div");
    this.bangEl.className = "w3d-bang";
    this.bangEl.setAttribute("aria-hidden", "true");
    const bar = document.createElement("div");
    bar.className = "w3d-bar";
    const sound = document.createElement("button");
    sound.className = "w3d-btn";
    const setSoundLabel = () => {
      sound.textContent = this.sfx.muted ? "🔇 Sound off" : "🔊 Sound on";
      sound.setAttribute("aria-pressed", String(!this.sfx.muted));
    };
    setSoundLabel();
    sound.addEventListener("click", () => {
      this.sfx.unlock();
      this.sfx.setMuted(!this.sfx.muted);
      setSoundLabel();
    });
    const speed = document.createElement("button");
    speed.className = "w3d-btn";
    try {
      this.speed = Number(localStorage.getItem(SPEED_KEY)) || 1;
    } catch {
      this.speed = 1;
    }
    const setSpeedLabel = () => (speed.textContent = `⏩ Speed ${this.speed >= 2 ? "2×" : "1×"}`);
    setSpeedLabel();
    speed.addEventListener("click", () => {
      this.speed = this.speed >= 2 ? 1 : 2;
      try {
        localStorage.setItem(SPEED_KEY, String(this.speed));
      } catch {
        /* storage blocked */
      }
      setSpeedLabel();
    });
    bar.append(sound, speed);
    this.el.append(this.canvas, this.bangEl, this.captionEl, bar);

    this.scene.background = new THREE.Color(0x2c2560);
    this.scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b6280, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(3, 6, 4);
    this.scene.add(sun);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.008;

    this.canvas.addEventListener("pointerdown", (e) => (this.down = { x: e.clientX, y: e.clientY }));
    this.canvas.addEventListener("pointerup", (e) => {
      this.sfx.unlock();
      if (!this.down || Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 10) return;
      const area = this.pick(e.clientX, e.clientY);
      if (area) this.onPick(area);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      this.canvas.style.cursor = this.pick(e.clientX, e.clientY) ? "pointer" : "default";
    });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    (window as unknown as { __smartSweep3d?: World3D }).__smartSweep3d = this;
  }

  /** Builds the room and the cleaner for a mission run. */
  load(run: CleaningRun, avatar: Avatar): void {
    this.abort();
    this.run = run;
    this.scene.remove(...this.scene.children.filter((c) => c.userData.mission));
    this.room = new BathroomRoom(run.mission.tools, run.mission.products);
    this.room.group.userData.mission = true;
    this.scene.add(this.room.group);
    this.fx?.clear();
    this.fx = new Effects(this.scene);
    this.markers.clear();
    this.hintArrow = null;
    this.setAvatar(avatar);
    this.char.root.position.set(1.0, 0, 0.9);
    this.char.yaw = this.char.targetYaw = -2.4;
    this.director = new Director(this);
    this.room.sync(run.flags);
    this.syncMarkers();
  }

  setAvatar(avatar: Avatar): void {
    const pos = this.char?.root.position.clone();
    const yaw = this.char?.yaw;
    if (this.char) {
      this.scene.remove(this.char.root);
      this.char.dispose();
    }
    this.char = new Character({ avatar, ppe: this.run?.ppeOn ?? new Set() });
    this.char.root.userData.mission = true;
    this.char.root.add(this.shadow);
    this.shadow.position.set(0, 0.008, 0);
    if (pos) this.char.root.position.copy(pos);
    if (yaw !== undefined) this.char.yaw = this.char.targetYaw = yaw;
    this.scene.add(this.char.root);
    this.director?.restoreHands();
  }

  setPpe(worn: Set<string>): void {
    this.char.setPpe(worn);
  }

  mount(slot: HTMLElement): void {
    if (this.el.parentElement !== slot) slot.appendChild(this.el);
    this.resize();
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.loop);
    }
  }

  unmount(): void {
    this.running = false;
    this.el.remove();
  }

  // ---------- Game actions ----------

  /** Acts out what just happened in the game. Resolves when the animation is finished. */
  async perform(area: string, fb: Feedback, ctx: { phase: string; tool: string | null; product: string | null }): Promise<void> {
    await this.task(() => this.director.perform(area, fb, ctx));
  }

  /** Walks to the trolley and swaps what's in the cleaner's hands to match the game. */
  async equip(): Promise<void> {
    await this.task(() => this.director.equip(this.run.heldTool, this.run.heldProduct));
  }

  private async task(fn: () => Promise<void>): Promise<void> {
    this.busy = true;
    this.onBusy(true);
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof Aborted)) console.error(e);
    } finally {
      this.caption("");
      this.resultId++;
      this.busy = false;
      this.syncMarkers();
      this.onBusy(false);
    }
  }

  // ---------- Timing helpers for the director (all follow the speed setting) ----------

  until(fn: (dt: number) => boolean): Promise<void> {
    return new Promise((resolve, reject) => this.waiters.push({ fn, resolve, reject }));
  }

  wait(sec: number): Promise<void> {
    let t = 0;
    return this.until((dt) => (t += dt) >= sec);
  }

  /** Runs fn every frame for sec seconds with progress 0 → 1. */
  during(sec: number, fn: (p: number, dt: number) => void): Promise<void> {
    let t = 0;
    return this.until((dt) => {
      t += dt;
      fn(Math.min(1, t / sec), dt);
      return t >= sec;
    });
  }

  setClip(fn: (t: number) => Partial<Pose>): void {
    this.clip = fn;
    this.clipStart = this.time;
  }

  abort(): void {
    this.epoch++;
    const w = this.waiters;
    this.waiters = [];
    for (const x of w) x.reject(new Aborted());
    this.busy = false;
  }

  /** Shows the outcome inside the scene for a few seconds (handy on phones, where the message box may be scrolled away). */
  result(fb: Feedback): void {
    if (fb.kind === "inspect") return;
    const icon = fb.tone === "good" ? "✓" : fb.tone === "info" ? "ℹ" : fb.tone === "critical" ? "⚠" : "✗";
    this.caption(`${icon} ${fb.title}`);
    this.captionEl.dataset.tone = fb.tone;
    const id = ++this.resultId;
    setTimeout(() => {
      if (this.resultId === id && !this.busy) this.caption("");
    }, 4500);
  }
  private resultId = 0;

  caption(text: string): void {
    delete this.captionEl.dataset.tone;
    this.captionEl.textContent = text;
    this.captionEl.classList.toggle("on", !!text);
  }

  /** Big comic text over the scene (also the caption for the sound effect). */
  bang(text: string, tone: "bad" | "stop" | "good"): void {
    this.bangEl.textContent = text;
    this.bangEl.className = `w3d-bang on ${tone}`;
    const id = ++this.bangId;
    setTimeout(() => {
      if (this.bangId === id) this.bangEl.className = "w3d-bang";
    }, 1900);
  }
  private bangId = 0;

  // ---------- Markers ----------

  /** "?" over areas still to inspect, "✓" over checked ones, an arrow over the hint. */
  syncMarkers(): void {
    if (!this.run || !this.room) return;
    const phase = this.run.phase;
    for (const [id, area] of this.room.areas) {
      const want = phase === "inspect" && !this.run.inspected.has(id) ? "?" : phase === "check" && this.run.checked.has(id) ? "✓" : phase === "check" ? "👁" : null;
      const cur = this.markers.get(id);
      if (cur && cur.userData.text !== want) {
        this.scene.remove(cur);
        this.markers.delete(id);
      }
      if (want && !this.markers.has(id)) {
        const s = this.fx.marker(want, want === "✓" ? "good" : "info");
        s.userData.text = want;
        s.userData.mission = true;
        s.position.copy(area.top);
        s.scale.setScalar(0.22);
        this.scene.add(s);
        this.markers.set(id, s);
      }
    }
  }

  hint(area: string | null): void {
    this.hintArea = area;
    if (!area && this.hintArrow) {
      this.scene.remove(this.hintArrow);
      this.hintArrow = null;
    }
    if (area && !this.hintArrow) {
      this.hintArrow = this.fx.marker("⬇", "think");
      this.hintArrow.userData.mission = true;
      this.hintArrow.scale.setScalar(0.3);
      this.scene.add(this.hintArrow);
    }
  }

  // ---------- Loop ----------

  private loop = (now: number): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    if (document.hidden) {
      this.last = now;
      return;
    }
    const real = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const dt = real * this.speed;
    this.time += dt;
    // Advance waiting director steps.
    if (this.waiters.length) {
      const w = this.waiters;
      this.waiters = [];
      for (const x of w) {
        if (x.fn(dt)) x.resolve();
        else this.waiters.push(x);
      }
    }
    if (this.char) {
      this.char.target = { ...this.director.holdPose(), ...this.clip(this.time - this.clipStart) };
      this.char.update(dt);
    }
    this.room?.update(dt);
    this.fx?.update(dt);
    for (const [id, s] of this.markers) {
      const a = this.room.areas.get(id)!;
      s.position.y = a.top.y + Math.sin(this.time * 3 + a.top.x) * 0.04;
    }
    if (this.hintArrow && this.hintArea) {
      const a = this.room.areas.get(this.hintArea);
      if (a) this.hintArrow.position.set(a.top.x, a.top.y + 0.15 + Math.abs(Math.sin(this.time * 4)) * 0.12, a.top.z);
    }
    // Camera: frames the room, drifting slightly towards the cleaner.
    if (this.char) {
      const c = this.char.root.position;
      const look = new THREE.Vector3(-0.1 + c.x * 0.6, 0.8, -0.3 + c.z * 0.55);
      this.camTarget.lerp(look, 1 - Math.exp(-real * 2));
    }
    this.placeCamera();
    this.renderer.render(this.scene, this.camera);
  };

  private placeCamera(): void {
    const aspect = this.camera.aspect;
    const dist = aspect >= 1.3 ? 7.6 : aspect >= 1 ? 7.6 + (1.3 - aspect) * 6 : 9.4 + (1 - aspect) * 8;
    const dir = new THREE.Vector3(0.62, 0.62, 0.8).normalize();
    this.camera.position.copy(this.camTarget).addScaledVector(dir, dist);
    this.camera.lookAt(this.camTarget);
  }

  private resize(): void {
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** The direction from a point on the floor towards the camera. */
  yawToCamera(p: THREE.Vector3): number {
    return Math.atan2(this.camera.position.x - p.x, this.camera.position.z - p.z);
  }

  /** Where an area appears on screen (for tests and hints). */
  screenPoint(area: string): { x: number; y: number } | null {
    const a = this.room?.areas.get(area);
    if (!a) return null;
    const p = a.work[0].clone().project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
  }

  private pick(x: number, y: number): string | null {
    if (!this.room) return null;
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects(this.room.pickables, true)[0];
    return (hit?.object.userData.area as string) ?? null;
  }

}
