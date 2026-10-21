// Team reporting for the business edition. Pure functions over training records.

export interface RecordLike {
  user_id: string;
  mission_id: string;
  score: number;
  passed: boolean;
  critical_errors: number;
  created_at: string;
}

export interface MemberLike {
  user_id: string;
  role: "owner" | "staff";
  joined_at: string;
  name: string;
  email: string;
}

export interface AssignmentLike {
  id: string;
  mission_id: string;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
}

export interface MemberSummary {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "staff";
  joinedAt: string;
  attempts: number;
  passed: string[];
  best: Record<string, number>;
  criticalErrors: number;
  lastActive: string | null;
}

export function summarise(members: MemberLike[], records: RecordLike[]): MemberSummary[] {
  return members.map((m) => {
    const mine = records.filter((r) => r.user_id === m.user_id);
    const best: Record<string, number> = {};
    for (const r of mine) best[r.mission_id] = Math.max(best[r.mission_id] ?? 0, r.score);
    return {
      userId: m.user_id,
      name: m.name || m.email,
      email: m.email,
      role: m.role,
      joinedAt: m.joined_at,
      attempts: mine.length,
      passed: [...new Set(mine.filter((r) => r.passed).map((r) => r.mission_id))],
      best,
      criticalErrors: mine.reduce((s, r) => s + r.critical_errors, 0),
      lastActive: mine.map((r) => r.created_at).sort().pop() ?? null,
    };
  });
}

export interface AssignmentStatus {
  /** People this assignment applies to. */
  total: number;
  /** Of those, how many passed the mission after it was assigned. */
  done: number;
  doneBy: string[];
  overdue: boolean;
  complete: boolean;
}

/** Whole-team assignments apply to staff; a named assignment applies to that person. */
export function assignmentStatus(a: AssignmentLike, members: MemberLike[], records: RecordLike[], today = new Date()): AssignmentStatus {
  const people = a.assigned_to ? [a.assigned_to] : members.filter((m) => m.role === "staff").map((m) => m.user_id);
  const doneBy = people.filter((uid) => records.some((r) => r.user_id === uid && r.mission_id === a.mission_id && r.passed && r.created_at >= a.created_at));
  const complete = people.length > 0 && doneBy.length === people.length;
  const todayStr = today.toISOString().slice(0, 10);
  return { total: people.length, done: doneBy.length, doneBy, complete, overdue: !complete && !!a.due_date && a.due_date < todayStr };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function trainingReportCsv(summaries: MemberSummary[], missions: { id: string; title: string }[]): string {
  const head = ["Name", "Email", "Role", "Joined", "Last active", "Missions passed", "Attempts", "Safety-critical errors", ...missions.map((m) => `${m.title} (best score)`)];
  const rows = summaries.map((s) => [
    s.name,
    s.email,
    s.role,
    s.joinedAt.slice(0, 10),
    s.lastActive ? s.lastActive.slice(0, 10) : "",
    `${s.passed.length} of ${missions.length}`,
    s.attempts,
    s.criticalErrors,
    ...missions.map((m) => (m.id in s.best ? `${s.best[m.id]}${s.passed.includes(m.id) ? " (passed)" : ""}` : "")),
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}
