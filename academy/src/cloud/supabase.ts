import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { Account, AdminData, AdminUserRow, Assignment, AttemptRow, CloudApi, Membership, NewAttempt, Org, PassStatus, Profile, TeamData } from "./types";

/** Turns backend errors into messages a learner can act on. */
export function friendlyError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match an account. Check them and try again.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password should be") || m.includes("weak password")) return "Choose a stronger password: at least 8 characters.";
  if (m.includes("email not confirmed")) return "This account hasn't been confirmed yet. Ask the Academy admin for help.";
  if (m.includes("sending confirmation") || m.includes("error sending")) return "The Academy couldn't send a confirmation email. Ask the Academy admin to check the sign-up settings.";
  if (m.includes("signups not allowed") || m.includes("signups are disabled")) return "New accounts are switched off at the moment.";
  if (m.includes("rate limit")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("failed to fetch") || m.includes("network")) return "You seem to be offline. Check your connection and try again.";
  return raw.replace(/^error:\s*/i, "");
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(friendlyError(res.error.message));
  return res.data;
}

export function createSupabaseCloud(): CloudApi {
  let client: SupabaseClient | null = null;
  const db = () => (client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }));

  const userId = async () => {
    const { data } = await db().auth.getSession();
    return data.session?.user.id ?? null;
  };

  return {
    kind: "supabase",

    async available() {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, signal: AbortSignal.timeout(6000) });
        return res.ok;
      } catch {
        return false;
      }
    },

    onAuthChange(cb) {
      // Supabase recommends not calling back into the client inside this listener.
      db().auth.onAuthStateChange(() => {
        setTimeout(cb, 0);
      });
    },

    async signUp(fullName, email, password) {
      const data = check(await db().auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() } } }));
      return { needsConfirmation: !data.session };
    },

    async signIn(email, password) {
      const { error } = await db().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(friendlyError(error.message));
    },

    async signOut() {
      await db().auth.signOut();
    },

    async loadAccount(): Promise<Account | null> {
      const { data } = await db().auth.getSession();
      const user = data.session?.user;
      if (!user) return null;
      const [profile, membership, admin] = await Promise.all([
        db().from("profiles").select("*").eq("id", user.id).maybeSingle(),
        db().from("memberships").select("*").eq("user_id", user.id).maybeSingle(),
        db().rpc("am_i_admin"),
      ]);
      const m = check(membership) as Membership | null;
      const org = m ? (check(await db().from("organizations").select("*").eq("id", m.org_id).maybeSingle()) as Org | null) : null;
      return { userId: user.id, email: user.email ?? "", profile: check(profile) as Profile | null, membership: m, org, isAdmin: check(admin) === true };
    },

    async touch(id) {
      await db().from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", id);
    },

    async saveAttempt(a: NewAttempt) {
      check(await db().from("attempts").insert(a));
    },

    async myAttempts() {
      const id = await userId();
      if (!id) return [];
      return check(await db().from("attempts").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(500)) as AttemptRow[];
    },

    async createOrg(name) {
      return check(await db().rpc("create_organization", { org_name: name })) as Org;
    },

    async joinOrg(code) {
      return check(await db().rpc("join_organization", { code })) as Org;
    },

    async regenerateCode(orgId) {
      return check(await db().rpc("regenerate_join_code", { org: orgId })) as string;
    },

    async leaveOrg(id) {
      check(await db().from("memberships").delete().eq("user_id", id));
    },

    async team(orgId): Promise<TeamData> {
      const members = check(await db().from("memberships").select("*").eq("org_id", orgId)) as Membership[];
      const ids = members.map((m) => m.user_id);
      const [profiles, attempts, assignments] = await Promise.all([
        db().from("profiles").select("*").in("id", ids),
        db().from("attempts").select("*").in("user_id", ids).order("created_at", { ascending: false }).limit(2000),
        db().from("assignments").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      ]);
      const byId = new Map((check(profiles) as Profile[]).map((p) => [p.id, p]));
      return {
        members: members.map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null })),
        attempts: check(attempts) as AttemptRow[],
        assignments: check(assignments) as Assignment[],
      };
    },

    async assign(orgId, missionId, assignedTo, dueDate) {
      check(await db().from("assignments").insert({ org_id: orgId, mission_id: missionId, assigned_to: assignedTo, due_date: dueDate }));
    },

    async unassign(id) {
      check(await db().from("assignments").delete().eq("id", id));
    },

    async removeMember(id) {
      check(await db().from("memberships").delete().eq("user_id", id));
    },

    async myAssignments() {
      return check(await db().from("assignments").select("*").order("created_at", { ascending: false })) as Assignment[];
    },

    async expertPass(): Promise<PassStatus> {
      const id = await userId();
      if (!id) return { active: false, expiresAt: null };
      const row = check(await db().from("entitlements").select("expires_at").eq("user_id", id).eq("plan_id", "expert-pass").maybeSingle()) as { expires_at: string } | null;
      return { active: !!row && new Date(row.expires_at) > new Date(), expiresAt: row?.expires_at ?? null };
    },

    async startCheckout(currency, returnUrl) {
      const { data, error } = await db().functions.invoke("paystack-checkout", { body: { action: "start", currency, returnUrl } });
      if (error || !data?.url) throw new Error(friendlyError(data?.error ?? error?.message ?? "Payments aren't available right now."));
      return data.url as string;
    },

    async confirmPayment(reference) {
      const { data, error } = await db().functions.invoke("paystack-checkout", { body: { action: "confirm", reference } });
      if (error || !data?.active) throw new Error(friendlyError(data?.error ?? error?.message ?? "We couldn't confirm your payment yet."));
      return { active: true, expiresAt: data.expiresAt as string };
    },

    async adminOverview(): Promise<AdminData> {
      const [users, recent, profiles] = await Promise.all([
        db().rpc("admin_overview"),
        db().from("attempts").select("*").order("created_at", { ascending: false }).limit(30),
        db().from("profiles").select("id, full_name, email"),
      ]);
      const names = new Map((check(profiles) as Pick<Profile, "id" | "full_name" | "email">[]).map((p) => [p.id, p.full_name || p.email]));
      return {
        users: check(users) as AdminUserRow[],
        recent: (check(recent) as AttemptRow[]).map((a) => ({ ...a, name: names.get(a.user_id) ?? "Unknown" })),
      };
    },
  };
}
