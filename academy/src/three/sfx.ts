// Sound effects, synthesised in the browser so nothing has to download.
// Every sound also has an on-screen caption, so the game works with sound off.

const KEY = "smart-sweep:sound";

export type Sound =
  | "pickup" | "putdown" | "spray" | "scrub" | "wipe" | "water" | "flush" | "pour" | "step"
  | "click" | "fan" | "bag" | "success" | "fanfare" | "wrong" | "alarm" | "nope" | "hmm" | "tick";

export class Sfx {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  muted: boolean;
  /** For tests: the sounds played so far. */
  readonly log: Sound[] = [];

  constructor() {
    let m = false;
    try {
      m = localStorage.getItem(KEY) === "off";
    } catch {
      /* storage blocked */
    }
    this.muted = m;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    try {
      localStorage.setItem(KEY, m ? "off" : "on");
    } catch {
      /* storage blocked */
    }
    if (m) window.speechSynthesis?.cancel();
  }

  /** Call from a tap so browsers allow audio. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.2, slideTo?: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(c.destination);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  private hiss(start: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = "bandpass", attack = 0.01): GainNode {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.05);
    return g;
  }

  private drum(start: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(160, start);
    o.frequency.exponentialRampToValueAtTime(48, start + 0.16);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.7, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    o.connect(g).connect(c.destination);
    o.start(start);
    o.stop(start + 0.25);
    this.hiss(start, 0.12, 900, 0.7, 0.35);
  }

  play(s: Sound, duration = 1): void {
    this.log.push(s);
    if (this.muted || !this.ctx || !this.noise) return;
    const t = this.ctx.currentTime + 0.01;
    switch (s) {
      case "pickup": this.tone(520, t, 0.12, "sine", 0.15, 900); break;
      case "putdown": this.tone(700, t, 0.12, "sine", 0.12, 380); break;
      case "click": this.tone(1500, t, 0.04, "square", 0.05); break;
      case "step": this.hiss(t, 0.05, 300, 1, 0.04); break;
      case "spray":
        for (let i = 0; i < 2; i++) this.hiss(t + i * 0.22, 0.16, 6000, 0.6, 0.18, "highpass", 0.005);
        break;
      case "scrub":
        for (let i = 0; i < Math.round(duration * 5); i++) this.hiss(t + i * 0.2, 0.14, 2200 + (i % 2) * 600, 1.5, 0.12);
        break;
      case "wipe":
        for (let i = 0; i < Math.round(duration * 2.5); i++) {
          this.hiss(t + i * 0.4, 0.3, 3200, 2, 0.06);
          if (i % 2 === 0) this.tone(1800, t + i * 0.4 + 0.2, 0.08, "sine", 0.04, 2600);
        }
        break;
      case "water": this.hiss(t, duration, 1100, 0.8, 0.12, "lowpass", 0.15); break;
      case "flush":
        this.hiss(t, 1.6, 700, 0.6, 0.3, "lowpass", 0.05);
        this.tone(300, t, 1.2, "sine", 0.05, 90);
        break;
      case "pour": this.tone(260, t, 0.5, "sine", 0.08, 520); this.hiss(t, 0.5, 900, 3, 0.05); break;
      case "fan": this.hiss(t, 1.2, 180, 0.5, 0.12, "lowpass", 0.3); break;
      case "bag": this.hiss(t, 0.35, 2500, 0.5, 0.15); this.hiss(t + 0.4, 0.3, 2000, 0.5, 0.12); break;
      case "success":
        this.tone(784, t, 0.18, "triangle", 0.16);
        this.tone(1175, t + 0.1, 0.35, "triangle", 0.16);
        break;
      case "fanfare":
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.12, 0.35, "triangle", 0.15));
        break;
      case "tick": this.tone(880, t, 0.1, "triangle", 0.12); this.tone(1320, t + 0.08, 0.15, "triangle", 0.1); break;
      case "hmm": this.tone(330, t, 0.25, "sine", 0.08, 300); this.tone(392, t + 0.22, 0.3, "sine", 0.08, 440); break;
      case "nope": this.tone(440, t, 0.14, "square", 0.06); this.tone(330, t + 0.16, 0.22, "square", 0.06); break;
      case "wrong":
        // BAM-BAM-BAM! then a cartoon buzzer and a spoken "Wrong!"
        for (let i = 0; i < 3; i++) this.drum(t + i * 0.2);
        this.tone(220, t + 0.65, 0.22, "sawtooth", 0.12, 200);
        this.tone(165, t + 0.9, 0.5, "sawtooth", 0.12, 110);
        this.say("Wrong!", 650);
        break;
      case "alarm":
        for (let i = 0; i < 3; i++) {
          this.tone(988, t + i * 0.36, 0.16, "square", 0.08);
          this.tone(740, t + i * 0.36 + 0.18, 0.16, "square", 0.08);
        }
        break;
    }
  }

  private say(text: string, delayMs: number): void {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    setTimeout(() => {
      if (this.muted) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.pitch = 1.4;
        u.rate = 1.15;
        u.volume = 0.9;
        synth.speak(u);
      } catch {
        /* speech not available */
      }
    }, delayMs);
  }
}
