import * as THREE from "three";
import { toon } from "./character";
import { type Trolley, trolley, wetSign } from "./props";

// The 3D bathroom for "Professional Bathroom Cleaning". Metres; the back wall is at z = -2.5
// and the left wall (window and door) at x = -3. The front and right are open to the camera.

export interface Spot {
  x: number;
  z: number;
  /** Direction the cleaner faces (radians; 0 = +z). */
  face: number;
}

export interface Area {
  id: string;
  spot: Spot;
  /** Points on the object that get worked on, top to bottom. */
  work: THREE.Vector3[];
  /** Where markers float above it. */
  top: THREE.Vector3;
}

const FACE_BACK = Math.PI;
const FACE_LEFT = -Math.PI / 2;
const FACE_RIGHT = Math.PI / 2;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function box(w: number, h: number, d: number, mat: THREE.Material, pos: [number, number, number]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(...pos);
  return m;
}

function tileTexture(base: string, line: string, size: number, rows = 8, cols = 8): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  x.fillStyle = base;
  x.fillRect(0, 0, size, size);
  x.strokeStyle = line;
  x.lineWidth = 3;
  for (let i = 0; i <= rows; i++) {
    x.beginPath();
    x.moveTo(0, (i * size) / rows);
    x.lineTo(size, (i * size) / rows);
    x.stroke();
  }
  for (let i = 0; i <= cols; i++) {
    x.beginPath();
    x.moveTo((i * size) / cols, 0);
    x.lineTo((i * size) / cols, size);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A flat stain that fades as it's cleaned. */
function stain(color: THREE.ColorRepresentation, r: number, pos: THREE.Vector3, normal: "y" | "z" | "x", opacity = 0.6): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  m.position.copy(pos);
  if (normal === "y") m.rotation.x = -Math.PI / 2;
  if (normal === "x") m.rotation.y = Math.PI / 2;
  m.userData.base = opacity;
  return m;
}

export class BathroomRoom {
  readonly group = new THREE.Group();
  readonly areas = new Map<string, Area>();
  readonly trolley: Trolley;
  readonly trolleySpot: Spot = { x: 1.55, z: 1.55, face: FACE_RIGHT };
  readonly signSpot: Spot = { x: -2.05, z: 0.95, face: FACE_LEFT };
  readonly signPlace = v(-2.55, 0, 0.95);
  /** The mop goes from the far corner back to the door. */
  readonly mopPath: [number, number][] = [[1.9, -0.9], [0.4, -0.9], [0.4, 0.2], [-1.2, 0.2], [-1.2, 1.1], [-1.8, 1.5]];
  /** Meshes that can be tapped, each tagged with userData.area. */
  readonly pickables: THREE.Object3D[] = [];
  /** 0 = clean, 1 = dirty (or for "stock" and "gel", how much is there). */
  readonly level: Record<string, number> = {};
  private readonly dirt = new Map<string, THREE.Object3D[]>();
  private fan = new THREE.Group();
  private fanSpeed = 0;
  private windowPane = new THREE.Group();
  private lid = new THREE.Group();
  private placedSign: THREE.Object3D | null = null;
  private wet!: THREE.Mesh;
  private roll!: THREE.Mesh;
  private soapLevel!: THREE.Mesh;
  private germs: THREE.Mesh[] = [];
  private time = 0;

  constructor(tools: string[], products: string[]) {
    const g = this.group;
    // ----- Shell -----
    const floorTex = tileTexture("#DCD6CB", "#C2BAAD", 256, 6, 6);
    floorTex.repeat.set(4, 3.4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), toon(0xffffff, { map: floorTex }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.tag(floor, "floor");
    g.add(floor);
    const wallTileTex = tileTexture("#EAF2F4", "#C9D8DC", 256, 8, 8);
    wallTileTex.repeat.set(5, 1.4);
    const tiles = toon(0xffffff, { map: wallTileTex });
    const paint = toon(0xd9cfe9);
    g.add(box(6, 1.3, 0.1, tiles, [0, 0.65, -2.55]));
    g.add(box(6, 1.3, 0.1, paint, [0, 1.95, -2.55]));
    const sideTiles = toon(0xffffff, { map: wallTileTex.clone() });
    (sideTiles.map as THREE.Texture).repeat.set(4.2, 1.4);
    g.add(box(0.1, 1.3, 5.1, sideTiles, [-3.05, 0.65, 0]));
    g.add(box(0.1, 1.3, 5.1, paint, [-3.05, 1.95, 0]));
    g.add(box(6, 0.06, 0.12, toon(0x9c958b), [0, 0.03, -2.48]));

    // ----- Window and extractor fan (vent) -----
    const frame = toon(0xffffff);
    g.add(box(0.06, 0.7, 0.8, frame, [-2.98, 1.75, -0.45]));
    g.add(box(0.07, 0.6, 0.7, new THREE.MeshBasicMaterial({ color: 0x9fd3f0 }), [-2.985, 1.75, -0.45]));
    this.windowPane.position.set(-2.95, 1.75, -0.8);
    this.windowPane.add(box(0.03, 0.6, 0.7, new THREE.MeshBasicMaterial({ color: 0xc8e8f8, transparent: true, opacity: 0.75 }), [0, 0, 0.35]));
    this.windowPane.add(box(0.05, 0.08, 0.03, toon(0x4a4a55), [0.04, 0, 0.62]));
    g.add(this.windowPane);
    const fanBox = box(0.08, 0.34, 0.34, toon(0xf4f1ea), [-2.97, 2.15, 0.35]);
    g.add(fanBox);
    this.fan.position.set(-2.92, 2.15, 0.35);
    for (let i = 0; i < 4; i++) {
      const blade = box(0.01, 0.13, 0.05, toon(0x9c958b), [0, 0.06, 0]);
      const arm = new THREE.Group();
      arm.rotation.x = (i * Math.PI) / 2;
      arm.add(blade);
      this.fan.add(arm);
    }
    g.add(this.fan);
    const pull = box(0.02, 0.5, 0.02, toon(0xffffff), [-2.93, 1.75, 0.15]);
    g.add(pull);
    this.tag([fanBox, pull, this.windowPane], "vent");
    this.area("vent", { x: -2.4, z: -0.3, face: FACE_LEFT }, [v(-2.95, 1.75, -0.2)], v(-2.9, 2.5, -0.1));

    // ----- Door, handle and light switch (high-touch points) -----
    const door = box(0.06, 2.0, 0.85, toon(0xb7854f), [-2.98, 1.0, 1.75]);
    g.add(door);
    const handle = box(0.08, 0.04, 0.14, toon(0xc9c4d6), [-2.92, 1.0, 1.42]);
    const plate = box(0.03, 0.14, 0.09, toon(0xffffff), [-2.97, 1.3, 1.05]);
    g.add(handle, plate);
    const smudges = [stain(0x6b6255, 0.035, v(-2.875, 1.0, 1.4), "x", 0.55), stain(0x6b6255, 0.03, v(-2.95, 1.3, 1.07), "x", 0.5), stain(0x6b6255, 0.02, v(-2.95, 1.33, 1.02), "x", 0.4)];
    smudges.forEach((s) => (s.rotation.y = Math.PI / 2));
    g.add(...smudges);
    const germMat = new THREE.MeshBasicMaterial({ color: 0x5fbf3f, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 6; i++) {
      const germ = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), germMat.clone());
      germ.position.set(-2.82, 1.0 + (i % 3) * 0.13, 1.1 + Math.floor(i / 3) * 0.3);
      germ.userData.phase = i;
      this.germs.push(germ);
      g.add(germ);
    }
    this.dirt.set("touch", [...smudges, ...this.germs]);
    this.tag([door, handle, plate], "touch");
    this.area("touch", { x: -2.45, z: 1.2, face: FACE_LEFT }, [v(-2.95, 1.3, 1.05), v(-2.9, 1.0, 1.4)], v(-2.85, 2.25, 1.2));

    // ----- Shower -----
    const tray = box(1.2, 0.08, 1.1, toon(0xffffff), [-2.4, 0.04, -1.95]);
    const screen = box(0.02, 1.8, 0.7, new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.25 }), [-1.8, 0.98, -2.15]);
    const head = box(0.18, 0.04, 0.18, toon(0xc9c4d6), [-2.4, 2.05, -2.35]);
    const pipe = box(0.03, 0.6, 0.03, toon(0xc9c4d6), [-2.4, 1.75, -2.46]);
    g.add(tray, screen, head, pipe);
    const scum: THREE.Object3D[] = [];
    for (const [x, y] of [[-2.75, 0.5], [-2.35, 0.75], [-2.05, 0.4], [-2.6, 1.15], [-2.15, 1.3], [-2.8, 0.25]]) {
      const s = stain(0xd8d2b8, 0.09 + Math.random() * 0.05, v(x, y, -2.495), "z", 0.85);
      scum.push(s);
    }
    for (const [x, z] of [[-2.6, -1.8], [-2.2, -2.1], [-2.0, -1.65]]) scum.push(stain(0xc9bf9a, 0.12, v(x, 0.085, z), "y", 0.7));
    g.add(...scum);
    this.dirt.set("shower", scum);
    this.tag([tray, screen, head], "shower");
    this.area("shower", { x: -2.2, z: -1.05, face: FACE_BACK }, [v(-2.4, 1.3, -2.45), v(-2.4, 0.6, -2.45), v(-2.3, 0.1, -1.9)], v(-2.4, 2.4, -1.9));

    // ----- Mirror and sink -----
    const mirror = box(0.8, 0.7, 0.03, toon(0xd7eef7, { emissive: 0x223344, emissiveIntensity: 0.15 }), [-0.4, 1.58, -2.48]);
    g.add(box(0.86, 0.76, 0.02, toon(0xffffff), [-0.4, 1.58, -2.495]));
    g.add(mirror);
    const mirrorSpots: THREE.Object3D[] = [];
    for (const [x, y, r] of [[-0.6, 1.75, 0.04], [-0.3, 1.5, 0.05], [-0.15, 1.7, 0.03], [-0.5, 1.4, 0.035], [-0.25, 1.82, 0.025], [-0.7, 1.55, 0.03]]) mirrorSpots.push(stain(0xf4f4f4, r, v(x, y, -2.46), "z", 0.85));
    for (const [x, y] of [[-0.45, 1.62], [-0.35, 1.65]]) mirrorSpots.push(stain(0x8fa4b0, 0.05, v(x, y, -2.461), "z", 0.35));
    g.add(...mirrorSpots);
    this.dirt.set("mirror", mirrorSpots);
    this.tag(mirror, "mirror");
    this.area("mirror", { x: -0.4, z: -1.6, face: FACE_BACK }, [v(-0.4, 1.75, -2.45), v(-0.4, 1.45, -2.45)], v(-0.4, 2.15, -2.3));

    const vanity = box(0.9, 0.78, 0.5, toon(0x7a5a8c), [-0.4, 0.39, -2.25]);
    const top = box(0.94, 0.05, 0.54, toon(0xffffff), [-0.4, 0.8, -2.25]);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.06, 24), toon(0xe9eef2));
    basin.position.set(-0.4, 0.81, -2.22);
    basin.scale.z = 0.7;
    const tap = box(0.04, 0.14, 0.04, toon(0xc9c4d6), [-0.4, 0.89, -2.42]);
    const spout = box(0.04, 0.03, 0.12, toon(0xc9c4d6), [-0.4, 0.96, -2.36]);
    g.add(vanity, top, basin, tap, spout);
    const sinkDirt = [stain(0xd9e8f2, 0.05, v(-0.35, 0.845, -2.2), "y", 0.95), stain(0xb7c9d6, 0.08, v(-0.45, 0.843, -2.24), "y", 0.6), stain(0xffffff, 0.03, v(-0.2, 0.83, -2.08), "y", 0.95), stain(0xe0e6d0, 0.04, v(-0.62, 0.83, -2.1), "y", 0.8)];
    g.add(...sinkDirt);
    this.dirt.set("sink", sinkDirt);
    this.tag([vanity, top, basin, tap, spout], "sink");
    this.area("sink", { x: -0.4, z: -1.6, face: FACE_BACK }, [v(-0.4, 0.86, -2.2)], v(-0.4, 1.15, -2.0));

    // ----- Bin -----
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.42, 20), toon(0xc9c4d6));
    bin.position.set(0.45, 0.21, -2.2);
    g.add(bin);
    const rubbish = new THREE.Group();
    const bits = [0xffffff, 0xf1e9d2, 0xd7c3a3, 0xe8e8f0, 0xa8c8e8];
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(i % 3 ? new THREE.SphereGeometry(0.06, 8, 6) : new THREE.BoxGeometry(0.1, 0.06, 0.08), toon(bits[i % bits.length]));
      b.position.set(0.45 + Math.cos(i * 2.3) * 0.09, 0.44 + (i % 3) * 0.05, -2.2 + Math.sin(i * 2.3) * 0.09);
      b.rotation.set(i, i * 2, 0);
      rubbish.add(b);
    }
    rubbish.add(stain(0xffffff, 0.05, v(0.72, 0.005, -2.0), "y", 1));
    g.add(rubbish);
    const liner = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.012, 8, 24), toon(0x2c2c35));
    liner.position.set(0.45, 0.42, -2.2);
    liner.rotation.x = Math.PI / 2;
    liner.visible = false;
    g.add(liner);
    this.dirt.set("bin", [rubbish]);
    this.dirt.set("liner", [liner]);
    this.tag(bin, "bin");
    this.area("bin", { x: 0.45, z: -1.65, face: FACE_BACK }, [v(0.45, 0.45, -2.2)], v(0.45, 0.9, -2.1));

    // ----- Toilet -----
    const white = toon(0xffffff);
    const cistern = box(0.46, 0.42, 0.2, white, [1.35, 0.72, -2.4]);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.15, 0.4, 24), white);
    bowl.position.set(1.35, 0.2, -2.1);
    bowl.scale.z = 1.25;
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 10, 28), toon(0xf4f1ea));
    seat.position.set(1.35, 0.42, -2.08);
    seat.rotation.x = Math.PI / 2;
    seat.scale.y = 1.25;
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: 0xbfe3ff }));
    water.position.set(1.35, 0.36, -2.08);
    water.rotation.x = -Math.PI / 2;
    water.scale.y = 1.25;
    this.lid.position.set(1.35, 0.44, -2.33);
    const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), toon(0xf4f1ea));
    lidMesh.position.set(0, 0, 0.25);
    lidMesh.scale.z = 1.25;
    this.lid.add(lidMesh);
    this.lid.rotation.x = -1.5;
    const flush = box(0.08, 0.025, 0.03, toon(0xc9c4d6), [1.52, 0.86, -2.29]);
    g.add(cistern, bowl, seat, water, this.lid, flush);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.02, 8, 28), new THREE.MeshBasicMaterial({ color: 0x8a6a3a, transparent: true, opacity: 0.85 }));
    ring.position.set(1.35, 0.37, -2.08);
    ring.rotation.x = Math.PI / 2;
    ring.scale.y = 1.25;
    ring.userData.base = 0.85;
    g.add(ring);
    this.dirt.set("bowl", [ring]);
    const gel = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.06, 3, 6), new THREE.MeshBasicMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.9 }));
      d.position.set(1.35 + Math.cos(a) * 0.15, 0.39, -2.08 + Math.sin(a) * 0.19);
      d.userData.base = 0.9;
      gel.add(d);
    }
    g.add(gel);
    this.dirt.set("gel", gel.children);
    const marks = [stain(0x8a7a5a, 0.03, v(1.25, 0.462, -1.95), "y", 0.7), stain(0x8a7a5a, 0.025, v(1.47, 0.462, -2.0), "y", 0.7), stain(0x8a7a5a, 0.02, v(1.53, 0.87, -2.27), "z", 0.6), stain(0x8a7a5a, 0.04, v(1.35, 0.15, -1.86), "z", 0.5)];
    g.add(...marks);
    this.dirt.set("toilet", marks);
    this.tag([cistern, bowl, seat, water, lidMesh, flush], "toilet");
    this.area("toilet", { x: 1.35, z: -1.45, face: FACE_BACK }, [v(1.52, 0.88, -2.3), v(1.35, 0.45, -2.05), v(1.35, 0.32, -2.08), v(1.35, 0.15, -1.9)], v(1.35, 1.3, -2.1));

    // ----- Supplies: toilet roll holder and soap dispenser -----
    const holder = box(0.18, 0.03, 0.12, toon(0xc9c4d6), [2.05, 0.75, -2.42]);
    this.roll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.11, 16), toon(0xffffff));
    this.roll.rotation.z = Math.PI / 2;
    this.roll.position.set(2.05, 0.68, -2.4);
    const shelf = box(0.4, 0.03, 0.16, toon(0xb7854f), [2.1, 1.12, -2.42]);
    const soap = box(0.1, 0.2, 0.08, new THREE.MeshBasicMaterial({ color: 0xe6e3ee, transparent: true, opacity: 0.6 }), [2.2, 1.24, -2.42]);
    this.soapLevel = box(0.09, 0.18, 0.07, toon(0x7bc8a4), [2.2, 1.24, -2.42]);
    g.add(holder, this.roll, shelf, soap, this.soapLevel);
    this.tag([holder, this.roll, shelf, soap], "supplies");
    this.area("supplies", { x: 2.05, z: -1.8, face: FACE_BACK }, [v(2.1, 1.2, -2.4), v(2.05, 0.7, -2.38)], v(2.1, 1.6, -2.3));

    // ----- Floor dirt and the wet sheen after mopping -----
    const floorDirt: THREE.Object3D[] = [];
    for (const [x, z, r] of [[0.9, 0.2, 0.09], [0.6, 0.6, 0.09], [-0.2, -0.4, 0.09], [-0.5, 0.0, 0.09], [-1.0, 0.7, 0.09], [1.4, -0.6, 0.12], [-1.4, -0.7, 0.13], [0.0, -1.2, 0.08]]) {
      const s = stain(0x7c6f60, r, v(x, 0.004, z), "y", 0.4);
      s.scale.set(0.7, 1.4, 1);
      floorDirt.push(s);
    }
    g.add(...floorDirt);
    this.dirt.set("floor", floorDirt);
    this.wet = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.6), new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0, depthWrite: false }));
    this.wet.rotation.x = -Math.PI / 2;
    this.wet.position.y = 0.006;
    g.add(this.wet);
    this.area("floor", { x: 1.9, z: -0.9, face: FACE_BACK }, [v(1.9, 0, -1.3)], v(0.2, 0.6, 0.2));

    // ----- Equipment trolley -----
    this.trolley = trolley(tools, products);
    this.trolley.group.position.set(2.35, 0, 1.55);
    this.trolley.group.rotation.y = -Math.PI / 2;
    g.add(this.trolley.group);

    for (const k of ["vent", "bin", "liner", "mirror", "sink", "shower", "touch", "bowl", "gel", "toilet", "stock", "floor", "wet", "sign"]) this.level[k] = 0;
  }

  private tag(objs: THREE.Object3D | THREE.Object3D[], area: string): void {
    for (const o of Array.isArray(objs) ? objs : [objs]) {
      o.traverse((c) => (c.userData.area = area));
      this.pickables.push(o);
    }
  }

  private area(id: string, spot: Spot, work: THREE.Vector3[], top: THREE.Vector3): void {
    this.areas.set(id, { id, spot, work, top });
  }

  /** Sets how dirty (or full) something looks, 0 to 1. */
  set(key: string, value: number): void {
    this.level[key] = value;
    const objs = this.dirt.get(key);
    if (objs) {
      for (const o of objs) {
        o.visible = value > 0.01;
        o.traverse((c) => {
          if (c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).transparent) {
            (c.material as THREE.MeshBasicMaterial).opacity = (c.userData.base ?? 0.85) * value;
          }
        });
        if (key === "bin") o.scale.setScalar(0.4 + value * 0.6);
      }
    }
    if (key === "vent") {
      this.fanSpeed = value * 18;
      this.windowPane.rotation.y = -value * 0.9;
    }
    if (key === "stock") {
      this.roll.scale.set(0.45 + value * 0.55, 1, 0.45 + value * 0.55);
      this.soapLevel.scale.y = 0.12 + value * 0.88;
      this.soapLevel.position.y = 1.15 + (0.12 + value * 0.88) * 0.09;
    }
    if (key === "wet") (this.wet.material as THREE.MeshBasicMaterial).opacity = value * 0.35;
    if (key === "lid") this.lid.rotation.x = -1.5 * value;
  }

  /** Matches the room to the game state (used when no animation is playing). */
  sync(flags: Set<string>): void {
    this.set("vent", flags.has("vent") ? 1 : 0);
    this.set("bin", flags.has("bin") ? 0 : 1);
    this.set("liner", flags.has("bin") ? 1 : 0);
    this.set("mirror", flags.has("mirror") ? 0 : 1);
    this.set("sink", flags.has("sink") ? 0 : 1);
    this.set("shower", flags.has("shower") ? 0 : 1);
    this.set("touch", flags.has("touch") ? 0 : 1);
    this.set("bowl", flags.has("bowl") ? 0 : 1);
    this.set("gel", flags.has("gel") && !flags.has("bowl") ? 1 : 0);
    this.set("toilet", flags.has("toiletclean") ? 0 : 1);
    this.set("stock", flags.has("stock") ? 1 : 0);
    this.set("floor", flags.has("floor") ? 0 : 1);
    this.set("wet", flags.has("floor") ? 1 : 0);
    this.placeSign(flags.has("sign"));
  }

  placeSign(on: boolean): void {
    if (on && !this.placedSign) {
      this.placedSign = wetSign(0.8);
      this.placedSign.position.copy(this.signPlace);
      this.placedSign.rotation.y = Math.PI / 2;
      this.group.add(this.placedSign);
    } else if (!on && this.placedSign) {
      this.group.remove(this.placedSign);
      this.placedSign = null;
    }
    this.level.sign = on ? 1 : 0;
  }

  update(dt: number): void {
    this.time += dt;
    this.fan.rotation.x += this.fanSpeed * dt;
    this.germs.forEach((g, i) => {
      g.position.x = -2.82 + Math.sin(this.time * 2 + i) * 0.03;
      g.position.y += Math.sin(this.time * 3 + i * 1.7) * 0.0008;
      g.scale.setScalar(1 + Math.sin(this.time * 5 + i) * 0.15);
    });
  }
}
