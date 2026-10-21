import type { Mission, MissionResult } from "./types";

// Progress is kept on this device only. The Store interface is the seam where a
// future cloud-saved account (business edition) can plug in without UI changes.

export interface Store {
  read(): string | null;
  write(value: string): void;
  readonly persistent: boolean;
}

export const STORAGE_KEY = "smart-cleaners-academy:v1";

export function browserStore(key = STORAGE_KEY): Store {
  let memory: string | null = null;
  let persistent = true;
  try {
    const probe = `${key}:probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch {
    persistent = false;
  }
  return {
    persistent,
    read() {
      if (!persistent) return memory;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memory;
      }
    },
    write(value) {
      memory = value;
      if (!persistent) return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage full or blocked: keep the in-memory copy */
      }
    },
  };
}

export function memoryStore(initial: string | null = null): Store {
  let v = initial;
  return { persistent: false, read: () => v, write: (x) => void (v = x) };
}

export interface MissionRecord {
  attempts: number;
  bestScore: number;
  bestStars: number;
  passed: boolean;
  lastPlayed: string;
}

export interface ProgressData {
  version: 1;
  missions: Record<string, MissionRecord>;
  achievements: Record<string, string>;
  playerName: string;
}

export function emptyProgress(): ProgressData {
  return { version: 1, missions: {}, achievements: {}, playerName: "" };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  test: (result: MissionResult, progress: ProgressData) => boolean;
}

export class Progress {
  data: ProgressData;

  constructor(private store: Store, private achievements: Achievement[]) {
    this.data = Progress.parse(store.read());
  }

  static parse(raw: string | null): ProgressData {
    if (!raw) return emptyProgress();
    try {
      const d = JSON.parse(raw) as Partial<ProgressData>;
      if (d.version !== 1) return emptyProgress();
      return { ...emptyProgress(), ...d, missions: { ...d.missions }, achievements: { ...d.achievements } };
    } catch {
      return emptyProgress();
    }
  }

  get persistent(): boolean {
    return this.store.persistent;
  }

  private save(): void {
    this.store.write(JSON.stringify(this.data));
  }

  record(mission: string): MissionRecord | undefined {
    return this.data.missions[mission];
  }

  isPassed(missionId: string): boolean {
    return !!this.data.missions[missionId]?.passed;
  }

  isUnlocked(m: Mission): boolean {
    return m.requires.every((id) => this.isPassed(id));
  }

  /** Saves a finished attempt and returns any achievements newly earned. */
  addResult(result: MissionResult, now = new Date()): Achievement[] {
    const prev = this.data.missions[result.missionId];
    this.data.missions[result.missionId] = {
      attempts: (prev?.attempts ?? 0) + 1,
      bestScore: Math.max(prev?.bestScore ?? 0, result.score),
      bestStars: Math.max(prev?.bestStars ?? 0, result.stars),
      passed: !!prev?.passed || result.passed,
      lastPlayed: now.toISOString(),
    };
    const earned = this.achievements.filter((a) => !this.data.achievements[a.id] && a.test(result, this.data));
    for (const a of earned) this.data.achievements[a.id] = now.toISOString();
    this.save();
    return earned;
  }

  setPlayerName(name: string): void {
    this.data.playerName = name.trim().slice(0, 60);
    this.save();
  }

  reset(): void {
    this.data = emptyProgress();
    this.save();
  }
}
