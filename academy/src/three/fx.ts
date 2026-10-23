import * as THREE from "three";

// Particles (spray mist, foam, water, sparkles) and floating signs (✗, STOP, ?, ✓).

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  max: number;
  grow: number;
  gravity: number;
  base: number;
}

interface Floater {
  sprite: THREE.Sprite;
  life: number;
  max: number;
  rise: number;
  base: THREE.Vector3;
  scale: number;
}

const sphere = new THREE.SphereGeometry(1, 8, 6);

export class Effects {
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private textures = new Map<string, THREE.CanvasTexture>();

  constructor(private scene: THREE.Scene) {}

  private emit(pos: THREE.Vector3, vel: THREE.Vector3, color: THREE.ColorRepresentation, size: number, life: number, opts: { grow?: number; gravity?: number; opacity?: number } = {}): void {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opts.opacity ?? 0.85, depthWrite: false });
    const mesh = new THREE.Mesh(sphere, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(size);
    this.scene.add(mesh);
    this.particles.push({ mesh, vel, life, max: life, grow: opts.grow ?? 0, gravity: opts.gravity ?? 0, base: opts.opacity ?? 0.85 });
  }

  /** A puff of mist from a spray nozzle towards a point. */
  spray(from: THREE.Vector3, to: THREE.Vector3, color: THREE.ColorRepresentation): void {
    const dir = to.clone().sub(from).normalize();
    for (let i = 0; i < 16; i++) {
      const v = dir.clone().multiplyScalar(1.6 + Math.random() * 1.2).add(new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.7));
      this.emit(from, v, color, 0.012 + Math.random() * 0.012, 0.45 + Math.random() * 0.2, { grow: 0.03, opacity: 0.7 });
    }
  }

  /** A gel stream poured from a bottle. */
  pour(from: THREE.Vector3, color: THREE.ColorRepresentation): void {
    for (let i = 0; i < 6; i++) this.emit(from.clone().add(new THREE.Vector3(0, -i * 0.02, 0)), new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.6, (Math.random() - 0.5) * 0.1), color, 0.018, 0.45, { gravity: -3, opacity: 0.95 });
  }

  /** Soapy bubbles around a point being scrubbed. */
  foam(at: THREE.Vector3, spread = 0.18): void {
    for (let i = 0; i < 5; i++) {
      const p = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread * 0.6, (Math.random() - 0.5) * spread));
      this.emit(p, new THREE.Vector3(0, 0.05 + Math.random() * 0.1, 0), 0xffffff, 0.015 + Math.random() * 0.02, 0.9 + Math.random() * 0.6, { grow: 0.02, opacity: 0.9 });
    }
  }

  /** Falling water, e.g. from a shower head or tap. */
  water(at: THREE.Vector3, spread = 0.15): void {
    for (let i = 0; i < 6; i++) {
      const p = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread));
      this.emit(p, new THREE.Vector3(0, -1.2 - Math.random(), 0), 0x7fc7ff, 0.012, 0.7, { gravity: -6, opacity: 0.8 });
    }
  }

  /** Gleaming stars on a freshly cleaned surface. */
  sparkle(at: THREE.Vector3, spread = 0.35, count = 10): void {
    for (let i = 0; i < count; i++) {
      const p = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex("✦", "#FFF6C8", null), transparent: true, depthWrite: false }));
      s.position.copy(p);
      this.scene.add(s);
      this.floaters.push({ sprite: s, life: 0.9 + Math.random() * 0.6, max: 1.5, rise: 0.15, base: p.clone(), scale: 0.06 + Math.random() * 0.06 });
    }
  }

  /** A floating sign that pops in, bobs and fades. */
  pop(text: string, at: THREE.Vector3, style: "bad" | "good" | "stop" | "info" | "think" = "info", life = 2.2, scale = 0.32): void {
    const colors = { bad: ["#FFFFFF", "#D93A3A"], good: ["#FFFFFF", "#2E9E5B"], stop: ["#FFFFFF", "#C62828"], info: ["#2C2560", "#FFFFFF"], think: ["#2C2560", "#FFF6C8"] } as const;
    const [fg, bg] = colors[style];
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex(text, fg, bg, style === "stop"), transparent: true, depthTest: false }));
    s.renderOrder = 10;
    s.position.copy(at);
    this.scene.add(s);
    this.floaters.push({ sprite: s, life, max: life, rise: style === "good" ? 0.25 : 0.06, base: at.clone(), scale });
  }

  /** A sprite that stays until removed (markers and hint arrows). */
  marker(text: string, style: "info" | "good" | "think" = "info"): THREE.Sprite {
    const colors = { info: ["#2C2560", "#FFFFFF"], good: ["#FFFFFF", "#2E9E5B"], think: ["#2C2560", "#E6A93B"] } as const;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex(text, colors[style][0], colors[style][1]), transparent: true, depthTest: false }));
    s.renderOrder = 9;
    return s;
  }

  private tex(text: string, fg: string, bg: string | null, octagon = false): THREE.CanvasTexture {
    const key = `${text}|${fg}|${bg}|${octagon}`;
    const hit = this.textures.get(key);
    if (hit) return hit;
    const c = document.createElement("canvas");
    const wide = text.length > 2;
    c.width = wide ? 512 : 128;
    c.height = 128;
    const x = c.getContext("2d")!;
    if (bg) {
      x.fillStyle = bg;
      x.strokeStyle = "rgba(0,0,0,0.25)";
      x.lineWidth = 6;
      x.beginPath();
      if (octagon) {
        const r = 58;
        for (let i = 0; i < 8; i++) {
          const a = Math.PI / 8 + (i * Math.PI) / 4;
          x.lineTo(c.width / 2 + r * Math.cos(a) * (wide ? 3.6 : 1), 64 + r * Math.sin(a));
        }
      } else if (wide) {
        x.roundRect(6, 10, c.width - 12, 108, 54);
      } else {
        x.arc(64, 64, 56, 0, Math.PI * 2);
      }
      x.closePath();
      x.fill();
      x.stroke();
    }
    x.fillStyle = fg;
    x.font = `900 ${wide ? 58 : 76}px Poppins, system-ui, sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    if (!bg) {
      x.shadowColor = "rgba(255,200,80,0.9)";
      x.shadowBlur = 18;
    }
    x.fillText(text, c.width / 2, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    this.textures.set(key, t);
    return t;
  }

  update(dt: number): void {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        return false;
      }
      p.vel.y += p.gravity * dt;
      p.vel.multiplyScalar(1 - dt * 2.5);
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.addScalar(p.grow * dt);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.base * Math.min(1, (p.life / p.max) * 2);
      return true;
    });
    this.floaters = this.floaters.filter((f) => {
      f.life -= dt;
      if (f.life <= 0) {
        this.scene.remove(f.sprite);
        f.sprite.material.dispose();
        return false;
      }
      const age = f.max - f.life;
      const popIn = Math.min(1, age / 0.18);
      const overshoot = popIn < 1 ? popIn * 1.25 : 1 + Math.max(0, 0.25 - (age - 0.18) * 2);
      const w = f.sprite.material.map!.image.width / f.sprite.material.map!.image.height;
      f.sprite.scale.set(f.scale * w * overshoot, f.scale * overshoot, 1);
      f.sprite.position.copy(f.base).add(new THREE.Vector3(0, age * f.rise + Math.sin(age * 6) * 0.01, 0));
      f.sprite.material.opacity = Math.min(1, f.life / 0.35);
      return true;
    });
  }

  clear(): void {
    for (const p of this.particles) this.scene.remove(p.mesh);
    for (const f of this.floaters) this.scene.remove(f.sprite);
    this.particles = [];
    this.floaters = [];
  }
}
