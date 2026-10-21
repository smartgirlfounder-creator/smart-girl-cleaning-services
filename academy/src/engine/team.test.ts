import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "../data/achievements";
import { Progress, memoryStore } from "./progress";
import { assignmentStatus, summarise, trainingReportCsv, type MemberLike, type RecordLike } from "./team";

const members: MemberLike[] = [
  { user_id: "o", role: "owner", joined_at: "2026-10-01T09:00:00Z", name: "Ola", email: "ola@x.com" },
  { user_id: "a", role: "staff", joined_at: "2026-10-02T09:00:00Z", name: "Ada", email: "ada@x.com" },
  { user_id: "b", role: "staff", joined_at: "2026-10-02T09:00:00Z", name: "", email: "bee@x.com" },
];
const rec = (user_id: string, mission_id: string, score: number, passed: boolean, created_at: string, critical_errors = 0): RecordLike => ({ user_id, mission_id, score, passed, created_at, critical_errors });

describe("team reports", () => {
  const records = [
    rec("a", "bathroom-basics", 45, false, "2026-10-03T10:00:00Z", 1),
    rec("a", "bathroom-basics", 92, true, "2026-10-04T10:00:00Z"),
    rec("b", "chemical-safety", 70, true, "2026-10-05T10:00:00Z"),
  ];

  it("summarises each member's best scores, passes and safety errors", () => {
    const [, ada, bee] = summarise(members, records);
    expect(ada).toMatchObject({ attempts: 2, passed: ["bathroom-basics"], best: { "bathroom-basics": 92 }, criticalErrors: 1, lastActive: "2026-10-04T10:00:00Z" });
    expect(bee.name).toBe("bee@x.com");
  });

  it("counts whole-team assignments across staff, only for passes after it was assigned", () => {
    const a = { id: "1", mission_id: "bathroom-basics", assigned_to: null, due_date: "2026-10-10", created_at: "2026-10-03T12:00:00Z" };
    const st = assignmentStatus(a, members, records, new Date("2026-10-12T00:00:00Z"));
    expect(st).toMatchObject({ total: 2, done: 1, complete: false, overdue: true });
  });

  it("marks a personal assignment complete once passed", () => {
    const a = { id: "2", mission_id: "chemical-safety", assigned_to: "b", due_date: null, created_at: "2026-10-04T00:00:00Z" };
    expect(assignmentStatus(a, members, records)).toMatchObject({ total: 1, done: 1, complete: true, overdue: false });
  });

  it("builds a CSV report with escaped cells", () => {
    const csv = trainingReportCsv(summarise([{ ...members[1], name: 'Ada "Pro", Lagos' }], records), [{ id: "bathroom-basics", title: "Bathroom" }]);
    const [head, row] = csv.split("\n");
    expect(head).toContain("Bathroom (best score)");
    expect(row).toContain('"Ada ""Pro"", Lagos"');
    expect(row).toContain("92 (passed)");
  });
});

describe("merging account records into this device", () => {
  it("keeps the best of local and remote", () => {
    const p = new Progress(memoryStore(), ACHIEVEMENTS);
    p.addResult({ missionId: "bathroom-basics", score: 70, stars: 1, passed: true, lines: [], mistakes: [], criticalErrors: [], missed: [], stats: {} });
    p.mergeRemote([
      { mission_id: "bathroom-basics", score: 95, stars: 3, passed: true, created_at: "2026-10-05T00:00:00Z" },
      { mission_id: "chemical-safety", score: 40, stars: 0, passed: false, created_at: "2026-10-06T00:00:00Z" },
    ]);
    expect(p.record("bathroom-basics")).toMatchObject({ bestScore: 95, bestStars: 3, passed: true });
    expect(p.record("chemical-safety")).toMatchObject({ attempts: 1, passed: false });
  });
});
