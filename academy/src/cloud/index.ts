import type { MissionResult } from "../engine/types";
import { createMockCloud } from "./mock";
import { createSupabaseCloud } from "./supabase";
import type { CloudApi, NewAttempt } from "./types";

export * from "./types";

/** The backend. Automated browser tests build with VITE_CLOUD=mock to use an in-memory fake. */
export const cloud: CloudApi = import.meta.env.VITE_CLOUD === "mock" ? createMockCloud() : createSupabaseCloud();

export function toAttempt(r: MissionResult, orgId: string | null): NewAttempt {
  return {
    mission_id: r.missionId,
    score: r.score,
    stars: r.stars,
    passed: r.passed,
    critical_errors: r.criticalErrors.length,
    mistakes: r.mistakes.map((m) => m.title).slice(0, 25),
    org_id: orgId,
  };
}

// Results that couldn't be uploaded (offline) wait here and are retried later.
const QUEUE_KEY = "smart-cleaners-academy:pending-records";

function readQueue(): NewAttempt[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as NewAttempt[];
  } catch {
    return [];
  }
}

function writeQueue(q: NewAttempt[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* storage unavailable */
  }
}

/** Saves a training record, or queues it when the network is down. */
export async function saveRecord(a: NewAttempt): Promise<"saved" | "queued"> {
  try {
    await cloud.saveAttempt(a);
    return "saved";
  } catch {
    writeQueue([...readQueue(), a]);
    return "queued";
  }
}

let flushing: Promise<number> | null = null;

/** Uploads any queued records. Returns how many were sent. Only one upload runs at a time. */
export function flushQueue(): Promise<number> {
  flushing ??= upload().finally(() => (flushing = null));
  return flushing;
}

async function upload(): Promise<number> {
  const q = readQueue();
  let sent = 0;
  const left: NewAttempt[] = [];
  for (const a of q) {
    try {
      await cloud.saveAttempt(a);
      sent++;
    } catch {
      left.push(a);
    }
  }
  writeQueue(left);
  return sent;
}
