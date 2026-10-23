import * as THREE from "three";
import { type Avatar, SKIN_TONES, UNIFORMS } from "../ui/avatar";

// A stylised cartoon cleaner built as a jointed rig: hips, spine, neck, shoulders,
// elbows, hips and knees. Clips set target angles for the joints and the rig blends
// towards them every frame, so every move flows into the next.

export const JOINTS = [
  "spineX", "spineY", "spineZ", "headX", "headY", "headZ",
  "shLX", "shLZ", "elL", "shRX", "shRZ", "shRY", "elR",
  "hipLX", "kneeL", "hipRX", "kneeR", "drop", "bob",
] as const;
export type Joint = (typeof JOINTS)[number];
export type Pose = Record<Joint, number>;
export type Expression = "neutral" | "happy" | "surprised" | "confused" | "worried" | "focused";

export const REST: Pose = Object.fromEntries(JOINTS.map((j) => [j, 0])) as Pose;
REST.shLZ = 0.14;
REST.shRZ = -0.14;
REST.elL = -0.15;
REST.elR = -0.15;

const PELVIS = 0.72;
const LEG = 0.34;
const GLOVE = 0x5b8def;
const HAIR = 0x1e1a1a;

let gradient: THREE.DataTexture | null = null;
/** Three-step shading for a cartoon look. */
export function toon(color: THREE.ColorRepresentation, extra: Partial<THREE.MeshToonMaterialParameters> = {}): THREE.MeshToonMaterial {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
  }
  return new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number] = [0, 0, 0], scale?: [number, number, number]): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  return m;
}

export interface CharacterOptions {
  avatar: Avatar;
  ppe: Set<string>;
}

export class Character {
  readonly root = new THREE.Group();
  readonly pose: Pose = { ...REST };
  target: Partial<Pose> = {};
  yaw = 0;
  targetYaw = 0;
  readonly gripR = new THREE.Group();
  readonly gripL = new THREE.Group();
  heldR: THREE.Object3D | null = null;
  heldL: THREE.Object3D | null = null;
  expression: Expression = "neutral";

  private readonly body = new THREE.Group();
  private readonly spine = new THREE.Group();
  private readonly head = new THREE.Group();
  private readonly shL = new THREE.Group();
  private readonly shR = new THREE.Group();
  private readonly elbowL = new THREE.Group();
  private readonly elbowR = new THREE.Group();
  private readonly hipL = new THREE.Group();
  private readonly hipR = new THREE.Group();
  private readonly kneeLg = new THREE.Group();
  private readonly kneeRg = new THREE.Group();
  private readonly eyes: THREE.Mesh[] = [];
  private readonly brows: THREE.Mesh[] = [];
  private readonly mouths: Record<"smile" | "open" | "frown" | "flat" | "grin", THREE.Object3D>;
  private readonly cheeks: THREE.Mesh[] = [];
  private blinkIn = 2.5;
  private blink = 0;
  private skinMat: THREE.MeshToonMaterial;
  private handMats: THREE.MeshToonMaterial[] = [];
  private ppeParts = new Map<string, THREE.Object3D[]>();

  constructor(opts: CharacterOptions) {
    const { avatar } = opts;
    const female = avatar.gender === "female";
    const skin = new THREE.Color(SKIN_TONES[avatar.skin] ?? SKIN_TONES[3]);
    const uniform = new THREE.Color(UNIFORMS.find((u) => u.id === avatar.uniform)?.color ?? UNIFORMS[0].color);
    this.skinMat = toon(skin);
    const uniMat = toon(uniform);
    const trouserMat = toon(0x2e2b3a);
    const shoeMat = toon(0x1e1e24);
    const hairMat = toon(HAIR);
    const ink = new THREE.MeshBasicMaterial({ color: 0x1e1e24 });

    this.root.add(this.body);
    const pelvis = new THREE.Group();
    pelvis.position.y = PELVIS;
    this.body.add(pelvis);
    pelvis.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 20), trouserMat, [0, 0.02, 0]));

    // Legs
    for (const [side, hip, knee] of [[1, this.hipL, this.kneeLg], [-1, this.hipR, this.kneeRg]] as const) {
      hip.position.set(0.085 * side, 0, 0);
      pelvis.add(hip);
      hip.add(mesh(new THREE.CapsuleGeometry(0.068, LEG - 0.12, 4, 12), trouserMat, [0, -LEG / 2, 0]));
      knee.position.y = -LEG;
      hip.add(knee);
      knee.add(mesh(new THREE.CapsuleGeometry(0.058, LEG - 0.12, 4, 12), trouserMat, [0, -LEG / 2, 0]));
      knee.add(mesh(new THREE.SphereGeometry(0.075, 14, 10), shoeMat, [0, -LEG - 0.005, 0.045], [0.9, 0.55, 1.45]));
    }

    // Torso
    this.spine.position.y = 0.04;
    pelvis.add(this.spine);
    const torso = female
      ? mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.46, 24), uniMat, [0, 0.21, 0], [1, 1, 0.78])
      : mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.46, 24), uniMat, [0, 0.21, 0], [1, 1, 0.75]);
    this.spine.add(torso);
    this.spine.add(mesh(new THREE.SphereGeometry(female ? 0.15 : 0.18, 20, 12), uniMat, [0, 0.43, 0], [1.2, 0.35, 0.78]));
    // Collar
    this.spine.add(mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), toon(0xffffff), [0, 0.47, 0.035], [1, 1, 1]).rotateX(Math.PI / 2.3));
    if (!female) this.spine.add(mesh(new THREE.BoxGeometry(0.012, 0.3, 0.01), toon(uniform.clone().multiplyScalar(0.75)), [0, 0.25, 0.135]));

    // Head
    this.head.position.y = 0.5;
    this.spine.add(this.head);
    this.head.add(mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 12), this.skinMat, [0, 0.03, 0]));
    const face = new THREE.Group();
    face.position.y = 0.22;
    this.head.add(face);
    face.add(mesh(new THREE.SphereGeometry(0.19, 28, 20), this.skinMat, [0, 0, 0], [1, 1.04, 0.98]));
    for (const s of [1, -1]) face.add(mesh(new THREE.SphereGeometry(0.04, 12, 8), this.skinMat, [0.185 * s, -0.01, 0], [0.6, 1, 0.8]));
    face.add(mesh(new THREE.SphereGeometry(0.028, 12, 8), toon(skin.clone().multiplyScalar(0.88)), [0, -0.035, 0.185]));
    for (const s of [1, -1]) {
      const eye = mesh(new THREE.SphereGeometry(0.031, 14, 10), ink, [0.07 * s, 0.02, 0.165], [0.85, 1.15, 0.5]);
      eye.add(mesh(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), [0.009, 0.012, 0.022]));
      face.add(eye);
      this.eyes.push(eye);
      const brow = mesh(new THREE.BoxGeometry(0.062, 0.016, 0.014), hairMat, [0.07 * s, 0.085, 0.168]);
      face.add(brow);
      this.brows.push(brow);
      const cheek = mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff7f8f, transparent: true, opacity: 0 }), [0.11 * s, -0.045, 0.15], [1, 0.6, 0.4]);
      face.add(cheek);
      this.cheeks.push(cheek);
      if (female) {
        face.add(mesh(new THREE.SphereGeometry(0.014, 8, 6), toon(0xe6a93b), [0.19 * s, -0.06, 0.01]));
        for (const k of [0, 1]) face.add(mesh(new THREE.BoxGeometry(0.02, 0.006, 0.006), ink, [(0.095 + k * 0.012) * s, 0.048 + k * 0.006, 0.16]).rotateZ(0.6 * s));
      }
    }
    const lip = female ? 0x9e3b4e : 0x2a1a1a;
    const mouthMat = new THREE.MeshBasicMaterial({ color: lip });
    const smile = mesh(new THREE.TorusGeometry(0.05, 0.011, 8, 20, Math.PI), mouthMat, [0, -0.075, 0.172]);
    smile.rotation.z = Math.PI;
    const grin = new THREE.Group();
    grin.add(mesh(new THREE.SphereGeometry(0.055, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6b1f2c }), [0, -0.06, 0.16], [1, 0.75, 0.5]));
    const frown = mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 20, Math.PI), mouthMat, [0, -0.1, 0.17]);
    const open = mesh(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshBasicMaterial({ color: 0x6b1f2c }), [0, -0.085, 0.17], [1, 1.25, 0.5]);
    const flat = mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), mouthMat, [0, -0.085, 0.175]);
    this.mouths = { smile, grin, frown, open, flat };
    for (const m of Object.values(this.mouths)) face.add(m);
    this.addHair(face, avatar, hairMat);

    // Arms
    for (const [side, sh, el, grip] of [[1, this.shL, this.elbowL, this.gripL], [-1, this.shR, this.elbowR, this.gripR]] as const) {
      sh.position.set(0.21 * side, 0.4, 0);
      this.spine.add(sh);
      sh.add(mesh(new THREE.SphereGeometry(0.068, 14, 10), uniMat, [0, 0, 0]));
      sh.add(mesh(new THREE.CapsuleGeometry(0.06, 0.13, 4, 12), uniMat, [0, -0.11, 0]));
      el.position.y = -0.24;
      sh.add(el);
      el.add(mesh(new THREE.CapsuleGeometry(0.046, 0.14, 4, 12), this.skinMat, [0, -0.1, 0]));
      const handMat = toon(skin);
      this.handMats.push(handMat);
      const hand = mesh(new THREE.SphereGeometry(0.058, 14, 10), handMat, [0, -0.225, 0.01], [0.9, 1.1, 0.75]);
      el.add(hand);
      grip.position.set(0, -0.23, 0.04);
      el.add(grip);
      const cuff = mesh(new THREE.CylinderGeometry(0.056, 0.05, 0.07, 12), toon(GLOVE), [0, -0.165, 0]);
      el.add(cuff);
      this.part("gloves", cuff);
    }

    this.addPpe(female, uniform);
    this.setPpe(opts.ppe);
    this.setExpression("neutral");
  }

  private part(id: string, o: THREE.Object3D): void {
    this.ppeParts.set(id, [...(this.ppeParts.get(id) ?? []), o]);
  }

  private addHair(face: THREE.Group, a: Avatar, mat: THREE.Material): void {
    // A hair cap tilted back: high on the forehead (eyes and brows stay visible), lower at the back.
    const cap = (scale: [number, number, number], y = 0.02) => {
      const c = mesh(new THREE.SphereGeometry(0.2, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), mat, [0, y, -0.02], scale);
      c.rotation.x = -0.32;
      return c;
    };
    switch (a.hair) {
      case "braids":
        face.add(cap([1.04, 1.02, 1.04]));
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI * (0.25 + (i / 8) * 1.5);
          const b = mesh(new THREE.CapsuleGeometry(0.018, 0.32, 3, 6), mat, [Math.cos(ang) * 0.19, -0.2, Math.sin(ang) * -0.15 - 0.08]);
          face.add(b);
        }
        break;
      case "puff":
        face.add(cap([1.04, 1.02, 1.04]));
        face.add(mesh(new THREE.SphereGeometry(0.14, 18, 14), mat, [0, 0.24, -0.06]));
        break;
      case "bun":
        face.add(cap([1.04, 1.02, 1.04]));
        face.add(mesh(new THREE.SphereGeometry(0.09, 16, 12), mat, [0, 0.21, -0.1]));
        break;
      case "wrap": {
        const wrap = toon(a.uniform === "maroon" ? 0xd4a12a : 0x8e2a43);
        const w = mesh(new THREE.SphereGeometry(0.205, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.45), wrap, [0, 0.04, -0.03], [1.08, 1.15, 1.08]);
        w.rotation.x = -0.3;
        face.add(w);
        for (const s of [1, -1]) face.add(mesh(new THREE.SphereGeometry(0.08, 14, 10), wrap, [0.06 * s, 0.25, 0.02], [1.2, 0.7, 0.9]));
        break;
      }
      case "lowcut":
        face.add(cap([1.02, 0.98, 1.02], 0.025));
        break;
      case "afro":
        face.add(cap([1.03, 1, 1.03]));
        face.add(mesh(new THREE.SphereGeometry(0.25, 24, 18), mat, [0, 0.11, -0.1], [1.05, 0.85, 0.95]));
        break;
      case "twists":
        face.add(cap([1.03, 1, 1.03]));
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2;
          const r = i % 2 ? 0.1 : 0.15;
          face.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), mat, [Math.cos(ang) * r, 0.19 - (r - 0.1) * 0.4, Math.sin(ang) * r - 0.03]));
        }
        break;
      default:
        break;
    }
  }

  private addPpe(female: boolean, uniform: THREE.Color): void {
    // Safety glasses
    const glasses = new THREE.Group();
    const frame = toon(0x2c2c35);
    const lens = new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.45 });
    for (const s of [1, -1]) {
      glasses.add(mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 20), frame, [0.068 * s, 0.025, 0.19]));
      glasses.add(mesh(new THREE.CircleGeometry(0.043, 18), lens, [0.068 * s, 0.025, 0.192]));
      glasses.add(mesh(new THREE.BoxGeometry(0.008, 0.008, 0.16), frame, [0.15 * s, 0.03, 0.11]));
    }
    glasses.add(mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), frame, [0, 0.03, 0.19]));
    glasses.position.y = 0.22;
    this.head.add(glasses);
    this.part("eye-protection", glasses);

    const mask = mesh(new THREE.SphereGeometry(0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffffff), [0, 0.15, 0.1], [1, 0.75, 0.8]);
    mask.rotation.x = Math.PI / 2.2;
    this.head.add(mask);
    this.part("dust-mask", mask);

    const apron = new THREE.Group();
    const cloth = toon(0xf4f1ea);
    apron.add(mesh(new THREE.BoxGeometry(0.27, 0.5, 0.02), cloth, [0, 0.16, female ? 0.16 : 0.15]));
    apron.add(mesh(new THREE.BoxGeometry(0.1, 0.07, 0.01), toon(0xd9d2c3), [0, 0.06, female ? 0.172 : 0.162]));
    this.spine.add(apron);
    this.part("apron", apron);

    const vest = new THREE.Group();
    const vis = toon(0xd4f23a);
    const strip = toon(0xdadde3);
    for (const s of [1, -1]) {
      vest.add(mesh(new THREE.BoxGeometry(0.12, 0.44, 0.02), vis, [0.09 * s, 0.22, 0.155]));
      vest.add(mesh(new THREE.BoxGeometry(0.12, 0.035, 0.022), strip, [0.09 * s, 0.14, 0.158]));
      vest.add(mesh(new THREE.BoxGeometry(0.12, 0.035, 0.022), strip, [0.09 * s, 0.26, 0.158]));
    }
    vest.add(mesh(new THREE.BoxGeometry(0.34, 0.44, 0.02), vis, [0, 0.22, -0.15]));
    this.spine.add(vest);
    this.part("hi-vis", vest);
    void uniform;
  }

  setPpe(worn: Set<string>): void {
    for (const [id, parts] of this.ppeParts) for (const p of parts) p.visible = worn.has(id);
    for (const m of this.handMats) m.color.set(worn.has("gloves") ? GLOVE : this.skinMat.color);
  }

  setExpression(e: Expression): void {
    this.expression = e;
    const mouth = { neutral: "smile", happy: "grin", surprised: "open", confused: "flat", worried: "frown", focused: "flat" }[e] as keyof typeof this.mouths;
    for (const [k, m] of Object.entries(this.mouths)) m.visible = k === mouth;
    const browTilt = { neutral: 0, happy: 0.12, surprised: -0.05, confused: 0.3, worried: -0.35, focused: 0.25 }[e];
    const browLift = { neutral: 0, happy: 0.01, surprised: 0.03, confused: 0.01, worried: 0.012, focused: -0.012 }[e];
    this.brows.forEach((b, i) => {
      const s = i === 0 ? 1 : -1;
      // Confused: one brow up, one down.
      b.rotation.z = e === "confused" ? (i === 0 ? 0.35 : -0.05) : browTilt * s * -1;
      b.position.y = 0.085 + browLift + (e === "confused" && i === 0 ? 0.02 : 0);
    });
    for (const c of this.cheeks) (c.material as THREE.MeshBasicMaterial).opacity = e === "happy" ? 0.55 : 0;
  }

  holdRight(o: THREE.Object3D | null): void {
    if (this.heldR) this.gripR.remove(this.heldR);
    this.heldR = o;
    if (o) this.gripR.add(o);
  }

  holdLeft(o: THREE.Object3D | null): void {
    if (this.heldL) this.gripL.remove(this.heldL);
    this.heldL = o;
    if (o) this.gripL.add(o);
  }

  /** World position of the right hand, for effects. */
  handPosition(side: "R" | "L" = "R"): THREE.Vector3 {
    return (side === "R" ? this.gripR : this.gripL).getWorldPosition(new THREE.Vector3());
  }

  update(dt: number): void {
    // Blend every joint towards its target (critically damped feel).
    const k = 1 - Math.exp(-dt * 11);
    for (const j of JOINTS) {
      const t = this.target[j] ?? REST[j];
      this.pose[j] += (t - this.pose[j]) * k;
    }
    let dy = this.targetYaw - this.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.yaw += dy * (1 - Math.exp(-dt * 9));
    this.apply();
    // Blinking
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blink = 0.14;
      this.blinkIn = 2 + Math.random() * 3;
    }
    if (this.blink > 0) this.blink -= dt;
    const lid = this.blink > 0 ? 0.12 : this.expression === "surprised" ? 1.3 : this.expression === "happy" ? 0.55 : 1.15;
    for (const e of this.eyes) e.scale.y = lid;
  }

  private apply(): void {
    const p = this.pose;
    this.root.rotation.y = this.yaw;
    this.body.position.y = -p.drop + p.bob;
    this.spine.rotation.set(p.spineX, p.spineY, p.spineZ);
    this.head.rotation.set(p.headX, p.headY, p.headZ);
    this.shL.rotation.set(p.shLX, 0, p.shLZ);
    this.shR.rotation.set(p.shRX, p.shRY, p.shRZ);
    this.elbowL.rotation.x = p.elL;
    this.elbowR.rotation.x = p.elR;
    this.hipL.rotation.x = p.hipLX;
    this.hipR.rotation.x = p.hipRX;
    this.kneeLg.rotation.x = p.kneeL;
    this.kneeRg.rotation.x = p.kneeR;
  }

  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
  }
}

/** How far to bend and lift the arm to work at a height (metres from the floor). */
export function reachFor(h: number): Partial<Pose> {
  if (h >= 0.78) {
    const sh = h >= 1.7 ? -2.75 : h >= 1.45 ? -2.0 - (h - 1.45) * 3 : h >= 1.15 ? -1.5 - (h - 1.15) * 1.67 : -0.95 - (h - 0.78) * 1.5;
    return { shRX: sh, elR: -0.35, spineX: 0.05 };
  }
  // Low work: squat and lean in, feet stay planted.
  const f = Math.min(1, (0.78 - h) / 0.6);
  const phi = 0.25 + f * 0.6;
  return { spineX: 0.2 + f * 0.35, hipLX: -phi, hipRX: -phi, kneeL: phi * 2, kneeR: phi * 2, drop: LEG * 2 * (1 - Math.cos(phi)), shRX: -0.9 + f * 0.1, elR: -0.3, headX: -0.1 };
}
