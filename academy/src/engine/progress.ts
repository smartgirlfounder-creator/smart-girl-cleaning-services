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
  /** The player's cartoon cleaner (checked by the UI when read). */
  avatar?: unknown;
}

export function emptyProgress(): ProgressData {
  return { version: 1, missions: {}, achievements: {}, playerName: "" };
}

export interface RemoteRecord {
  mission_id: string;
  score: number;
  stars: number;
  passed: boolean;
}

/**
 * Missions this device has progress for that the player's account doesn't have yet
 * (not played there, not passed there, or a lower best score), so they can be saved to the account.
 */
export function missionsToUpload(local: ProgressData, remote: RemoteRecord[], known: (id: string) => boolean): RemoteRecord[] {
  const out: RemoteRecord[] = [];
  for (const [id, rec] of Object.entries(local.missions)) {
    if (!known(id) || rec.attempts < 1) continue;
    const mine = remote.filter((r) => r.mission_id === id);
    const best = Math.max(0, ...mine.map((r) => r.score));
    const passed = mine.some((r) => r.passed);
    if (!mine.length || (rec.passed && !passed) || rec.bestScore > best) {
      out.push({ mission_id: id, score: rec.bestScore, stars: rec.bestStars, passed: rec.passed });
    }
  }
  return out;
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

  /** Folds in training records saved to the player's account, e.g. from another device. */
  mergeRemote(records: { mission_id: string; score: number; stars: number; passed: boolean; created_at: string }[]): void {
    const byMission = new Map<string, typeof records>();
    for (const r of records) byMission.set(r.mission_id, [...(byMission.get(r.mission_id) ?? []), r]);
    for (const [id, rs] of byMission) {
      const local = this.data.missions[id];
      this.data.missions[id] = {
        attempts: Math.max(local?.attempts ?? 0, rs.length),
        bestScore: Math.max(local?.bestScore ?? 0, ...rs.map((r) => r.score)),
        bestStars: Math.max(local?.bestStars ?? 0, ...rs.map((r) => r.stars)),
        passed: !!local?.passed || rs.some((r) => r.passed),
        lastPlayed: [local?.lastPlayed ?? "", ...rs.map((r) => r.created_at)].sort().pop() ?? "",
      };
    }
    this.save();
  }

  setPlayerName(name: string): void {
    this.data.playerName = name.trim().slice(0, 60);
    this.save();
  }

  setAvatar(avatar: unknown): void {
    this.data.avatar = avatar;
    this.save();
  }

  /** Clears training progress. The player's name and cleaner are kept. */
  reset(): void {
    this.data = { ...emptyProgress(), playerName: this.data.playerName, avatar: this.data.avatar };
    this.save();
  }
}
