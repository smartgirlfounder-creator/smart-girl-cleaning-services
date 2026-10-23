import * as THREE from "three";
import { PRODUCTS, TOOLS } from "../data/equipment";
import { toon } from "./character";

// Cleaning tools and product bottles. Each is built so that, held in a hand's grip,
// it points the way a real one would.

function m(geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0]): THREE.Mesh {
  const x = new THREE.Mesh(geo, mat);
  x.position.set(...pos);
  x.rotation.set(...rot);
  x.castShadow = true;
  return x;
}

export function toolMesh(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `tool:${id}`;
  const color = new THREE.Color(TOOLS[id]?.color ?? "#888888");
  if (id.startsWith("cloth")) {
    g.add(m(new THREE.BoxGeometry(0.15, 0.03, 0.12), toon(color), [0, -0.02, 0.03]));
    g.add(m(new THREE.BoxGeometry(0.15, 0.012, 0.12), toon(color.clone().multiplyScalar(0.8)), [0.01, -0.04, 0.035], [0, 0, 0.08]));
  } else if (id === "toilet-brush") {
    // Points along the forearm (-y), like an extension of the arm.
    g.add(m(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 10), toon(color), [0, -0.17, 0.02]));
    const head = m(new THREE.SphereGeometry(0.06, 12, 10), toon(0xf1efe6), [0, -0.4, 0.02]);
    head.scale.set(1, 1.4, 1);
    g.add(head);
  } else if (id.startsWith("scrub-pad")) {
    g.add(m(new THREE.BoxGeometry(0.13, 0.05, 0.09), toon(0xf2d16b), [0, -0.02, 0.03]));
    g.add(m(new THREE.BoxGeometry(0.13, 0.02, 0.09), toon(color), [0, -0.055, 0.03]));
  } else if (id === "mop") {
    // The handle group's -y runs down the mop. Rotation 0 = in use (follows the arm);
    // rotation.x = PI/2 = carried upright with the forearm held forward.
    const handle = new THREE.Group();
    handle.name = "handle";
    handle.rotation.x = Math.PI / 2;
    handle.add(m(new THREE.CylinderGeometry(0.016, 0.016, 1.35, 10), toon(0xc9c4d6), [0, -0.375, 0]));
    handle.add(m(new THREE.BoxGeometry(0.42, 0.04, 0.12), toon(color), [0, -1.06, 0.02]));
    for (let i = 0; i < 7; i++) handle.add(m(new THREE.BoxGeometry(0.05, 0.06, 0.13), toon(0xe9e4dc), [-0.18 + i * 0.06, -1.1, 0.02]));
    g.add(handle);
  } else if (id === "bin-liner") {
    g.add(m(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 14), toon(0x2c2c35), [0, -0.03, 0.04], [0, 0, Math.PI / 2]));
  } else if (id === "wet-sign") {
    const sign = wetSign(0.8);
    sign.position.y = -0.52;
    g.add(sign);
  } else if (id === "refill") {
    g.add(m(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 16), toon(0xffffff), [0, -0.02, 0.05], [0, 0, Math.PI / 2]));
    g.add(m(new THREE.CylinderGeometry(0.02, 0.02, 0.102, 10), toon(0xc9b8a0), [0, -0.02, 0.05], [0, 0, Math.PI / 2]));
  } else {
    g.add(m(new THREE.BoxGeometry(0.1, 0.1, 0.1), toon(color)));
  }
  return g;
}

/** An A-frame wet floor sign, standing on its base at y = 0. */
export function wetSign(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const yellow = toon(0xf2c230);
  for (const s of [1, -1]) {
    const panel = m(new THREE.BoxGeometry(0.34, 0.6, 0.015), yellow, [0, 0.28, 0.1 * s], [0.18 * s, 0, 0]);
    g.add(panel);
    const tex = signTexture();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    face.position.set(0, 0.3, 0.11 * s + 0.01 * s);
    face.rotation.set(0.18 * s, s < 0 ? Math.PI : 0, 0);
    g.add(face);
  }
  g.scale.setScalar(scale);
  return g;
}

let signTex: THREE.CanvasTexture | null = null;
function signTexture(): THREE.CanvasTexture {
  if (signTex) return signTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 180;
  const x = c.getContext("2d")!;
  x.fillStyle = "#1e1e24";
  x.beginPath();
  x.moveTo(64, 14);
  x.lineTo(116, 104);
  x.lineTo(12, 104);
  x.closePath();
  x.fill();
  x.fillStyle = "#f2c230";
  x.font = "bold 58px sans-serif";
  x.textAlign = "center";
  x.fillText("!", 64, 96);
  x.fillStyle = "#1e1e24";
  x.font = "bold 26px sans-serif";
  x.fillText("WET", 64, 140);
  x.fillText("FLOOR", 64, 168);
  signTex = new THREE.CanvasTexture(c);
  signTex.colorSpace = THREE.SRGBColorSpace;
  return signTex;
}

/** A labelled bottle. Spray bottles have a trigger head; the toilet cleaner has an angled neck. */
export function bottleMesh(productId: string): THREE.Group {
  const p = PRODUCTS[productId];
  const g = new THREE.Group();
  g.name = `product:${productId}`;
  const color = new THREE.Color(p?.color ?? "#999999");
  // Built upright along +y, then turned so that in a hand's grip "up" is the palm side (+z)
  // and the nozzle points the way the fingers do (-y).
  const body = new THREE.Group();
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.01, 0.0);
  g.add(body);
  body.add(m(new THREE.CylinderGeometry(0.045, 0.05, 0.2, 16), toon(color, { transparent: true, opacity: 0.92 }), [0, 0.05, 0]));
  body.add(m(new THREE.BoxGeometry(0.07, 0.08, 0.01), toon(0xffffff), [0, 0.05, 0.047]));
  const nozzle = new THREE.Object3D();
  nozzle.name = "nozzle";
  if (productId === "toilet-cleaner") {
    body.add(m(new THREE.CylinderGeometry(0.018, 0.03, 0.08, 10), toon(color), [0, 0.18, 0.02], [0.6, 0, 0]));
    nozzle.position.set(0, 0.22, 0.05);
  } else if (productId === "floor-cleaner" || productId === "bleach") {
    body.add(m(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 10), toon(0xf1efe6), [0, 0.17, 0]));
    nozzle.position.set(0, 0.2, 0);
  } else {
    body.add(m(new THREE.CylinderGeometry(0.02, 0.025, 0.05, 10), toon(0xf1efe6), [0, 0.17, 0]));
    body.add(m(new THREE.BoxGeometry(0.035, 0.04, 0.09), toon(0x2c2c35), [0, 0.215, 0.03]));
    body.add(m(new THREE.BoxGeometry(0.015, 0.06, 0.02), toon(0x2c2c35), [0, 0.17, 0.06], [-0.3, 0, 0]));
    nozzle.position.set(0, 0.215, 0.08);
  }
  body.add(nozzle);
  return g;
}

export interface Trolley {
  group: THREE.Group;
  /** Offsets of each tool and product slot, in the trolley's space. */
  slots: Map<string, THREE.Vector3>;
  items: Map<string, THREE.Object3D>;
}

/** The equipment station: a two-shelf trolley with a mop bucket. */
export function trolley(tools: string[], products: string[]): Trolley {
  const g = new THREE.Group();
  const frame = toon(0x4a4a55);
  const shelf = toon(0x6b6b78);
  for (const y of [0.32, 0.8]) g.add(m(new THREE.BoxGeometry(0.9, 0.04, 0.5), shelf, [0, y, 0]));
  for (const [x, z] of [[-0.43, -0.23], [0.43, -0.23], [-0.43, 0.23], [0.43, 0.23]]) {
    g.add(m(new THREE.CylinderGeometry(0.018, 0.018, 0.86, 8), frame, [x, 0.45, z]));
    g.add(m(new THREE.SphereGeometry(0.04, 10, 8), toon(0x1e1e24), [x, 0.04, z]));
  }
  // Bucket for the mop
  g.add(m(new THREE.CylinderGeometry(0.17, 0.14, 0.26, 18), toon(0x58b4e8), [0.62, 0.13, 0]));
  const slots = new Map<string, THREE.Vector3>();
  const items = new Map<string, THREE.Object3D>();
  const place = (id: string, obj: THREE.Object3D, pos: THREE.Vector3) => {
    obj.position.copy(pos);
    g.add(obj);
    slots.set(id, pos.clone());
    items.set(id, obj);
  };
  const small = tools.filter((t) => t !== "mop" && t !== "wet-sign");
  small.forEach((t, i) => {
    const obj = toolMesh(t);
    if (t === "toilet-brush") obj.rotation.x = Math.PI / 2;
    place(t, obj, new THREE.Vector3(-0.36 + (i % 6) * 0.145, 0.42 + Math.floor(i / 6) * 0.05, i >= 6 ? -0.12 : 0.1));
  });
  products.forEach((p, i) => {
    const b = bottleMesh(p);
    b.rotation.x = -Math.PI / 2;
    place(`p:${p}`, b, new THREE.Vector3(-0.36 + i * 0.145, 0.83, 0));
  });
  if (tools.includes("mop")) {
    const mop = toolMesh("mop");
    mop.getObjectByName("handle")!.rotation.x = 0;
    place("mop", mop, new THREE.Vector3(0.62, 1.2, 0));
  }
  if (tools.includes("wet-sign")) {
    const sign = wetSign(0.8);
    sign.rotation.y = Math.PI / 2;
    place("wet-sign", sign, new THREE.Vector3(-0.7, 0, 0));
  }
  return { group: g, slots, items };
}
