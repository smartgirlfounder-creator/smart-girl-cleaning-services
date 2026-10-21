// The business edition's data, as stored in Supabase.

export type Role = "owner" | "staff";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  last_seen_at: string | null;
}

export interface Org {
  id: string;
  name: string;
  owner_id: string;
  join_code: string;
  created_at: string;
}

export interface Membership {
  user_id: string;
  org_id: string;
  role: Role;
  joined_at: string;
}

export interface Assignment {
  id: string;
  org_id: string;
  mission_id: string;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
}

export interface AttemptRow {
  id: string;
  user_id: string;
  org_id: string | null;
  mission_id: string;
  score: number;
  stars: number;
  passed: boolean;
  critical_errors: number;
  mistakes: string[];
  created_at: string;
}

export type NewAttempt = Pick<AttemptRow, "mission_id" | "score" | "stars" | "passed" | "critical_errors" | "mistakes" | "org_id">;

export interface Account {
  userId: string;
  email: string;
  profile: Profile | null;
  membership: Membership | null;
  org: Org | null;
  isAdmin: boolean;
}

export interface TeamMember extends Membership {
  profile: Profile | null;
}

export interface TeamData {
  members: TeamMember[];
  attempts: AttemptRow[];
  assignments: Assignment[];
}

export interface AdminUserRow {
  user_id: string;
  full_name: string;
  email: string;
  org_name: string | null;
  role: Role | null;
  signed_up: string;
  last_sign_in: string | null;
  last_seen: string | null;
  attempts: number;
  missions_passed: number;
}

export interface AdminData {
  users: AdminUserRow[];
  recent: (AttemptRow & { name: string })[];
}

export interface PassStatus {
  active: boolean;
  expiresAt: string | null;
}

/** Everything the app needs from the backend. Swappable for an in-memory fake in tests. */
export interface CloudApi {
  readonly kind: "supabase" | "mock";
  available(): Promise<boolean>;
  onAuthChange(cb: () => void): void;
  signUp(fullName: string, email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  loadAccount(): Promise<Account | null>;
  touch(userId: string): Promise<void>;
  saveAttempt(a: NewAttempt): Promise<void>;
  myAttempts(): Promise<AttemptRow[]>;
  createOrg(name: string): Promise<Org>;
  joinOrg(code: string): Promise<Org>;
  regenerateCode(orgId: string): Promise<string>;
  leaveOrg(userId: string): Promise<void>;
  team(orgId: string): Promise<TeamData>;
  assign(orgId: string, missionId: string, assignedTo: string | null, dueDate: string | null): Promise<void>;
  unassign(id: string): Promise<void>;
  removeMember(userId: string): Promise<void>;
  myAssignments(): Promise<Assignment[]>;
  adminOverview(): Promise<AdminData>;
  expertPass(): Promise<PassStatus>;
  /** Returns the Paystack payment page address. */
  startCheckout(currency: "NGN" | "USD", returnUrl: string): Promise<string>;
  confirmPayment(reference: string): Promise<PassStatus>;
}
