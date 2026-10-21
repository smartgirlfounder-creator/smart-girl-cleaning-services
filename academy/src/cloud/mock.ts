// In-memory backend used only by automated browser tests (built with VITE_CLOUD=mock).
// It mirrors the database rules closely enough to exercise every screen.
import { ADMIN_EMAIL } from "./config";
import type { Account, AdminData, Assignment, AttemptRow, CloudApi, Membership, NewAttempt, Org, Profile, TeamData } from "./types";

interface MockUser {
  id: string;
  email: string;
  password: string;
  created_at: string;
  last_sign_in: string | null;
}

interface MockDb {
  users: MockUser[];
  profiles: Profile[];
  orgs: Org[];
  memberships: Membership[];
  assignments: Assignment[];
  attempts: AttemptRow[];
  passes: Record<string, string>;
  session: string | null;
}

const KEY = "sca-mock-cloud";
let seq = 0;
const id = () => `id-${Date.now().toString(36)}-${(seq++).toString(36)}`;
const now = () => new Date().toISOString();

function load(): MockDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as MockDb;
      return { ...d, passes: d.passes ?? {} };
    }
  } catch {
    /* fall through */
  }
  return { users: [], profiles: [], orgs: [], memberships: [], assignments: [], attempts: [], passes: {}, session: null };
}

export function createMockCloud(): CloudApi {
  const db = load();
  const listeners: (() => void)[] = [];
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* ignore */
    }
  };
  const me = () => {
    if (!db.session) throw new Error("Please sign in first.");
    return db.session;
  };
  const myOrg = () => db.memberships.find((m) => m.user_id === db.session)?.org_id ?? null;
  const isOwner = (org: string) => db.memberships.some((m) => m.user_id === db.session && m.org_id === org && m.role === "owner");
  const changed = () => {
    save();
    listeners.forEach((l) => l());
  };
  const code = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

  return {
    kind: "mock",
    async available() {
      return true;
    },
    onAuthChange(cb) {
      listeners.push(cb);
    },
    async signUp(fullName, email, password) {
      const e = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === e)) throw new Error("An account with this email already exists. Sign in instead.");
      if (password.length < 8) throw new Error("Choose a stronger password: at least 8 characters.");
      const user: MockUser = { id: id(), email: e, password, created_at: now(), last_sign_in: now() };
      db.users.push(user);
      db.profiles.push({ id: user.id, full_name: fullName.trim(), email: e, created_at: now(), last_seen_at: null });
      db.session = user.id;
      changed();
      return { needsConfirmation: false };
    },
    async signIn(email, password) {
      const u = db.users.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
      if (!u) throw new Error("That email and password don't match an account. Check them and try again.");
      u.last_sign_in = now();
      db.session = u.id;
      changed();
    },
    async signOut() {
      db.session = null;
      changed();
    },
    async loadAccount(): Promise<Account | null> {
      const u = db.users.find((x) => x.id === db.session);
      if (!u) return null;
      const membership = db.memberships.find((m) => m.user_id === u.id) ?? null;
      return {
        userId: u.id,
        email: u.email,
        profile: db.profiles.find((p) => p.id === u.id) ?? null,
        membership,
        org: membership ? db.orgs.find((o) => o.id === membership.org_id) ?? null : null,
        isAdmin: u.email === ADMIN_EMAIL,
      };
    },
    async touch(userId) {
      const p = db.profiles.find((x) => x.id === userId);
      if (p) p.last_seen_at = now();
      save();
    },
    async saveAttempt(a: NewAttempt) {
      const user = me();
      if (a.org_id && a.org_id !== myOrg()) throw new Error("Not allowed.");
      db.attempts.unshift({ ...a, id: id(), user_id: user, created_at: now() });
      save();
    },
    async myAttempts() {
      return db.attempts.filter((a) => a.user_id === db.session);
    },
    async createOrg(name) {
      const user = me();
      if (myOrg()) throw new Error("You already belong to a business.");
      const org: Org = { id: id(), name: name.trim(), owner_id: user, join_code: code(), created_at: now() };
      db.orgs.push(org);
      db.memberships.push({ user_id: user, org_id: org.id, role: "owner", joined_at: now() });
      save();
      return org;
    },
    async joinOrg(c) {
      const user = me();
      if (myOrg()) throw new Error("You already belong to a business.");
      const org = db.orgs.find((o) => o.join_code === c.trim().toUpperCase());
      if (!org) throw new Error("That team code was not found. Check it with your manager.");
      db.memberships.push({ user_id: user, org_id: org.id, role: "staff", joined_at: now() });
      save();
      return org;
    },
    async regenerateCode(orgId) {
      if (!isOwner(orgId)) throw new Error("Only the business owner can do this.");
      const org = db.orgs.find((o) => o.id === orgId)!;
      org.join_code = code();
      save();
      return org.join_code;
    },
    async leaveOrg(userId) {
      db.memberships = db.memberships.filter((m) => !(m.user_id === userId && m.role === "staff"));
      save();
    },
    async team(orgId): Promise<TeamData> {
      if (!isOwner(orgId)) throw new Error("Only the business owner can see the team.");
      const members = db.memberships.filter((m) => m.org_id === orgId);
      const ids = new Set(members.map((m) => m.user_id));
      return {
        members: members.map((m) => ({ ...m, profile: db.profiles.find((p) => p.id === m.user_id) ?? null })),
        attempts: db.attempts.filter((a) => ids.has(a.user_id)),
        assignments: db.assignments.filter((a) => a.org_id === orgId),
      };
    },
    async assign(orgId, missionId, assignedTo, dueDate) {
      if (!isOwner(orgId)) throw new Error("Only the business owner can assign missions.");
      db.assignments.unshift({ id: id(), org_id: orgId, mission_id: missionId, assigned_to: assignedTo, due_date: dueDate, created_by: me(), created_at: now() });
      save();
    },
    async unassign(assignmentId) {
      db.assignments = db.assignments.filter((a) => !(a.id === assignmentId && isOwner(a.org_id)));
      save();
    },
    async removeMember(userId) {
      db.memberships = db.memberships.filter((m) => !(m.user_id === userId && m.role === "staff" && isOwner(m.org_id)));
      save();
    },
    async myAssignments() {
      const org = myOrg();
      return db.assignments.filter((a) => a.org_id === org && (a.assigned_to === null || a.assigned_to === db.session));
    },
    async expertPass() {
      const until = db.session ? db.passes[db.session] : undefined;
      return { active: !!until && new Date(until) > new Date(), expiresAt: until ?? null };
    },
    async startCheckout(currency, returnUrl) {
      me();
      // Stands in for Paystack: comes straight back with a reference.
      return `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}reference=mock_${currency}_${Date.now()}`;
    },
    async confirmPayment(reference) {
      const user = me();
      if (!reference.startsWith("mock_")) throw new Error("We couldn't confirm your payment yet.");
      const base = Math.max(Date.now(), new Date(db.passes[user] ?? 0).getTime());
      db.passes[user] = new Date(base + 365 * 86400000).toISOString();
      save();
      return { active: true, expiresAt: db.passes[user] };
    },
    async adminOverview(): Promise<AdminData> {
      const u = db.users.find((x) => x.id === db.session);
      if (u?.email !== ADMIN_EMAIL) throw new Error("Admins only.");
      const name = (uid: string) => db.profiles.find((p) => p.id === uid)?.full_name || "Unknown";
      return {
        users: db.users.map((x) => {
          const m = db.memberships.find((mm) => mm.user_id === x.id);
          const mine = db.attempts.filter((a) => a.user_id === x.id);
          return {
            user_id: x.id,
            full_name: name(x.id),
            email: x.email,
            org_name: m ? db.orgs.find((o) => o.id === m.org_id)?.name ?? null : null,
            role: m?.role ?? null,
            signed_up: x.created_at,
            last_sign_in: x.last_sign_in,
            last_seen: db.profiles.find((p) => p.id === x.id)?.last_seen_at ?? null,
            attempts: mine.length,
            missions_passed: new Set(mine.filter((a) => a.passed).map((a) => a.mission_id)).size,
          };
        }),
        recent: db.attempts.slice(0, 30).map((a) => ({ ...a, name: name(a.user_id) })),
      };
    },
  };
}
