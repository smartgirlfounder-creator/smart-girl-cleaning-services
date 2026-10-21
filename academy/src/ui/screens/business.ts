import { MISSIONS, missionById } from "../../data/missions";
import type { AdminUserRow, AttemptRow } from "../../cloud";
import { assignmentStatus, summarise, type MemberLike } from "../../engine/team";
import { esc, pageHeader } from "../html";
import { crest, stars } from "../icons";
import type { CloudState } from "../session";

const missionTitle = (id: string) => missionById(id)?.title ?? id;

export function when(iso: string | null, now = Date.now()): string {
  if (!iso) return "Never";
  const mins = Math.round((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function notice(c: CloudState): string {
  if (!c.notice) return "";
  return `<p class="notice-box tone-${c.notice.tone}" role="${c.notice.tone === "bad" ? "alert" : "status"}">${esc(c.notice.text)}</p>`;
}

function offlineCard(): string {
  return `<div class="callout"><strong>Accounts need the online Academy</strong>
    <p>This copy of the Academy can't reach the account service. That happens in the offline preview, or when you have no internet. Training still works, and your progress is saved on this device.</p></div>`;
}

function needSignIn(what: string): string {
  return `<div class="callout"><strong>Sign in to ${esc(what)}</strong><p>Create a free account or sign in to keep a training record that follows you between devices.</p>
    <div class="btn-row"><button class="btn btn-primary" data-action="account" data-key="go-account">Sign in or create an account</button></div></div>`;
}

// ---------- Account ----------

export function accountScreen(c: CloudState): string {
  const head = pageHeader("Your Account", "Keep your training record safe and join your team.");
  if (c.status === "checking") return `${head}<p class="small">Connecting…</p>`;
  if (c.status === "offline") return `${head}${offlineCard()}`;
  const a = c.account;
  if (!a) {
    const signup = c.authTab === "signup";
    return `${head}
    <div class="auth">
      <div class="tabs" role="tablist">
        <button role="tab" class="tab" aria-selected="${!signup}" data-action="auth-tab" data-id="signin" data-key="tab-signin">Sign in</button>
        <button role="tab" class="tab" aria-selected="${signup}" data-action="auth-tab" data-id="signup" data-key="tab-signup">Create account</button>
      </div>
      <form class="form" data-form="${signup ? "signup" : "signin"}" novalidate>
        ${signup ? `<label for="auth-name">Your name</label><input id="auth-name" name="name" class="input" autocomplete="name" required maxlength="80">` : ""}
        <label for="auth-email">Email</label><input id="auth-email" name="email" class="input" type="email" autocomplete="email" required>
        <label for="auth-password">Password${signup ? " (at least 8 characters)" : ""}</label>
        <input id="auth-password" name="password" class="input" type="password" autocomplete="${signup ? "new-password" : "current-password"}" required minlength="${signup ? 8 : 1}">
        ${notice(c)}
        <button class="btn btn-primary" type="submit" data-key="auth-submit" ${c.busy ? "disabled" : ""}>${c.busy ? "Please wait…" : signup ? "Create my account" : "Sign in"}</button>
      </form>
      <p class="small">Forgot your password? Ask your manager or the Academy admin for help. Email password resets are coming in a later update.</p>
    </div>`;
  }
  const name = a.profile?.full_name || a.email;
  return `${head}
  <div class="account-card">
    <div class="avatar" aria-hidden="true">${esc(name.slice(0, 1).toUpperCase())}</div>
    <div><strong>${esc(name)}</strong><span class="small">${esc(a.email)}</span>
      <span class="chips">${a.org ? `<span class="chip">${esc(a.org.name)} · ${a.membership?.role === "owner" ? "Owner" : "Staff"}</span>` : `<span class="chip">No team yet</span>`}${a.isAdmin ? `<span class="chip chip-gold">Academy admin</span>` : ""}</span>
    </div>
  </div>
  ${notice(c)}
  <div class="btn-row">
    <button class="btn btn-primary" data-action="team" data-key="acc-team">${a.org ? "My Team" : "Set up or join a team"}</button>
    ${a.isAdmin ? `<button class="btn" data-action="admin" data-key="acc-admin">Admin dashboard</button>` : ""}
    <button class="btn btn-ghost" data-action="sign-out" data-key="sign-out">Sign out</button>
  </div>
  <p class="small">Every mission you finish while signed in is saved to your training record.</p>`;
}

// ---------- Team ----------

function membersOf(c: CloudState): MemberLike[] {
  return (c.team?.members ?? []).map((m) => ({ user_id: m.user_id, role: m.role, joined_at: m.joined_at, name: m.profile?.full_name ?? "", email: m.profile?.email ?? "" }));
}

export function teamScreen(c: CloudState, siteUrl: string): string {
  const head = pageHeader("My Team", "Business edition: invite staff, assign training and track records.");
  if (c.status === "checking") return `${head}<p class="small">Connecting…</p>`;
  if (c.status === "offline") return `${head}${offlineCard()}`;
  const a = c.account;
  if (!a) return `${head}${needSignIn("use the business edition")}`;

  if (!a.org || !a.membership) {
    return `${head}${notice(c)}
    <div class="cards">
      <form class="mission-card form" data-form="create-org">
        <span class="kind">For owners and managers</span>
        <strong>I run a cleaning business</strong>
        <span class="desc">Create your business, then share your team code with staff.</span>
        <label for="org-name">Business name</label>
        <input id="org-name" name="name" class="input" required minlength="2" maxlength="80" autocomplete="organization">
        <button class="btn btn-primary" type="submit" data-key="create-org" ${c.busy ? "disabled" : ""}>Create my business</button>
      </form>
      <form class="mission-card form" data-form="join-org">
        <span class="kind">For staff</span>
        <strong>I'm joining my team</strong>
        <span class="desc">Enter the 6-character code your manager gave you.</span>
        <label for="join-code">Team code</label>
        <input id="join-code" name="code" class="input code-input" required maxlength="6" autocomplete="off" value="${esc(c.joinCode)}">
        <button class="btn btn-primary" type="submit" data-key="join-org" ${c.busy ? "disabled" : ""}>Join team</button>
      </form>
    </div>`;
  }

  return a.membership.role === "owner" ? ownerView(c, siteUrl) : staffView(c);
}

function ownerView(c: CloudState, siteUrl: string): string {
  const a = c.account!;
  const org = a.org!;
  const team = c.team;
  const members = membersOf(c);
  const records = team?.attempts ?? [];
  const summaries = summarise(members, records);
  const staff = members.filter((m) => m.role === "staff");
  const invite = `${siteUrl}?join=${org.join_code}`;
  const confirmRemove = c.confirm?.startsWith("remove:") ? c.confirm.slice(7) : null;

  return `${pageHeader(esc(org.name), "Business edition · You're the owner")}
  ${notice(c)}
  <section class="level">
    <h2>Invite your staff</h2>
    <div class="invite">
      <div><span class="small">Team code</span><strong class="code" id="team-code">${esc(org.join_code)}</strong></div>
      <p class="small">Staff create a free account, open My Team and enter this code. Or send them this link: <span class="link-text">${esc(invite)}</span></p>
      <div class="btn-row">
        <button class="btn btn-primary" data-action="copy-invite" data-key="copy-invite">${c.copied ? "Copied" : "Copy invite message"}</button>
        <button class="btn btn-ghost" data-action="new-code" data-key="new-code">New code</button>
      </div>
      <p class="small">Making a new code stops the old one from working. People already on your team stay on it.</p>
    </div>
  </section>

  <section class="level">
    <div class="section-head"><h2>Team (${members.length})</h2><button class="btn btn-ghost" data-action="refresh-team" data-key="refresh-team">${c.busy ? "Loading…" : "Refresh"}</button></div>
    ${!team ? `<p class="small">Loading your team…</p>` : `<div class="member-list">${summaries.map((s) => `
      <div class="member">
        <div class="member-top">
          <div class="avatar" aria-hidden="true">${esc(s.name.slice(0, 1).toUpperCase())}</div>
          <div class="member-id"><strong>${esc(s.name)}</strong><span class="small">${esc(s.email)} · ${s.role === "owner" ? "Owner" : "Staff"}</span></div>
          <div class="member-stat"><strong>${s.passed.length}/${MISSIONS.length}</strong><span class="small">passed</span></div>
        </div>
        <div class="chips">${MISSIONS.map((m) => {
          const best = s.best[m.id];
          const cls = s.passed.includes(m.id) ? "chip-pass" : best !== undefined ? "chip-try" : "";
          return `<span class="chip ${cls}" title="${esc(m.title)}">${esc(m.shortTitle)}${best !== undefined ? ` · ${best}` : ""}</span>`;
        }).join("")}</div>
        <p class="small">Last active: ${esc(when(s.lastActive))} · ${s.attempts} attempt${s.attempts === 1 ? "" : "s"}${s.criticalErrors ? ` · <span class="warn-text">${s.criticalErrors} safety-critical error${s.criticalErrors === 1 ? "" : "s"}</span>` : ""}</p>
        ${s.role === "staff" ? (confirmRemove === s.userId
          ? `<div class="confirm"><p>Remove ${esc(s.name)} from your team? Their training record stays with their account.</p><div class="btn-row"><button class="btn btn-danger" data-action="remove-yes" data-id="${s.userId}" data-key="remove-yes">Remove</button><button class="btn" data-action="confirm-no" data-key="remove-no">Cancel</button></div></div>`
          : `<button class="btn btn-ghost btn-sm" data-action="remove" data-id="${s.userId}" data-key="remove-${s.userId}">Remove from team</button>`) : ""}
      </div>`).join("")}</div>`}
    ${team && !staff.length ? `<p class="small">No staff yet. Share your team code to invite them.</p>` : ""}
  </section>

  <section class="level">
    <h2>Assign training</h2>
    <form class="form assign-form" data-form="assign">
      <label for="assign-mission">Mission</label>
      <select id="assign-mission" name="mission" class="input">${MISSIONS.map((m) => `<option value="${m.id}">${esc(m.title)}</option>`).join("")}</select>
      <label for="assign-to">Who</label>
      <select id="assign-to" name="to" class="input"><option value="">Whole team (all staff)</option>${staff.map((m) => `<option value="${m.user_id}">${esc(m.name || m.email)}</option>`).join("")}</select>
      <label for="assign-due">Due date (optional)</label>
      <input id="assign-due" name="due" class="input" type="date">
      <button class="btn btn-primary" type="submit" data-key="assign" ${c.busy ? "disabled" : ""}>Assign mission</button>
    </form>
    ${team?.assignments.length ? `<div class="assign-list">${team.assignments.map((as) => {
      const st = assignmentStatus(as, members, records);
      const who = as.assigned_to ? members.find((m) => m.user_id === as.assigned_to)?.name || "Team member" : "Whole team";
      return `<div class="assign ${st.complete ? "is-done" : st.overdue ? "is-overdue" : ""}">
        <div><strong>${esc(missionTitle(as.mission_id))}</strong><span class="small">${esc(who)}${as.due_date ? ` · due ${esc(new Date(as.due_date + "T12:00:00").toLocaleDateString())}` : ""}</span></div>
        <span class="status ${st.complete ? "passed" : st.overdue ? "overdue" : "ready"}">${st.complete ? "Done" : st.overdue ? "Overdue" : "In progress"} · ${st.done}/${st.total}</span>
        <button class="icon-btn" data-action="unassign" data-id="${as.id}" data-key="unassign-${as.id}" aria-label="Remove this assignment">✕</button>
      </div>`;
    }).join("")}</div>` : `<p class="small">No missions assigned yet.</p>`}
  </section>

  <section class="level">
    <h2>Training report</h2>
    <p class="small">A spreadsheet of every team member's progress and best scores, for your records or a client audit.</p>
    <div class="btn-row"><button class="btn" data-action="download-report" data-key="download-report" ${team ? "" : "disabled"}>Download report (CSV)</button></div>
  </section>`;
}

function staffView(c: CloudState): string {
  const a = c.account!;
  const records = c.myRecords ?? [];
  const confirmLeave = c.confirm === "leave";
  const me: MemberLike = { user_id: a.userId, role: "staff", joined_at: a.membership!.joined_at, name: "", email: a.email };
  return `${pageHeader(esc(a.org!.name), "Business edition · Team member")}
  ${notice(c)}
  <section class="level">
    <div class="section-head"><h2>Assigned to you</h2><button class="btn btn-ghost" data-action="refresh-team" data-key="refresh-team">${c.busy ? "Loading…" : "Refresh"}</button></div>
    ${c.myAssignments === null ? `<p class="small">Loading…</p>` : c.myAssignments.length ? `<div class="assign-list">${c.myAssignments.map((as) => {
      const st = assignmentStatus(as, [me], records);
      return `<div class="assign ${st.complete ? "is-done" : st.overdue ? "is-overdue" : ""}">
        <div><strong>${esc(missionTitle(as.mission_id))}</strong><span class="small">${as.due_date ? `Due ${esc(new Date(as.due_date + "T12:00:00").toLocaleDateString())}` : "No due date"}</span></div>
        <span class="status ${st.complete ? "passed" : st.overdue ? "overdue" : "ready"}">${st.complete ? "Done" : st.overdue ? "Overdue" : "To do"}</span>
        ${st.complete ? "" : `<button class="btn btn-sm btn-primary" data-action="briefing" data-id="${as.mission_id}" data-key="go-${as.id}">Start</button>`}
      </div>`;
    }).join("")}</div>` : `<p class="small">Nothing assigned right now. You can still play any unlocked mission.</p>`}
  </section>
  ${recordList("Your training record", records)}
  <section class="level">
    ${confirmLeave
      ? `<div class="confirm"><p>Leave ${esc(a.org!.name)}? Your manager will no longer see your training record.</p><div class="btn-row"><button class="btn btn-danger" data-action="leave-yes" data-key="leave-yes">Leave team</button><button class="btn" data-action="confirm-no" data-key="leave-no">Stay</button></div></div>`
      : `<button class="btn btn-ghost" data-action="leave" data-key="leave">Leave this team</button>`}
  </section>`;
}

function recordList(title: string, records: AttemptRow[]): string {
  return `<section class="level"><h2>${esc(title)}</h2>
    ${records.length ? `<div class="record-list">${records.slice(0, 20).map((r) => `<div class="record">
      <div><strong>${esc(missionTitle(r.mission_id))}</strong><span class="small">${esc(when(r.created_at))}${r.critical_errors ? ` · <span class="warn-text">safety-critical error</span>` : ""}</span></div>
      <div class="pr-right">${stars(r.stars)}<span class="status ${r.passed ? "passed" : "tried"}">${r.score}</span></div>
    </div>`).join("")}</div>` : `<p class="small">No missions finished while signed in yet.</p>`}
  </section>`;
}

// ---------- Admin ----------

export function adminScreen(c: CloudState): string {
  const head = pageHeader("Admin Dashboard", "Everyone using Smart Cleaners Academy.");
  if (c.status === "offline") return `${head}${offlineCard()}`;
  if (!c.account) return `${head}${needSignIn("see the admin dashboard")}`;
  if (!c.account.isAdmin) return `${head}<p class="notice">This page is only for the Academy admin.</p>`;
  const d = c.admin;
  if (!d) return `${head}${notice(c)}<p class="small">Loading…</p>`;
  const week = Date.now() - 7 * 86400000;
  const active = d.users.filter((u) => u.last_sign_in && new Date(u.last_sign_in).getTime() > week).length;
  const businesses = new Set(d.users.map((u) => u.org_name).filter(Boolean)).size;
  const totalAttempts = d.users.reduce((s, u) => s + Number(u.attempts), 0);
  const tiles: [string, number][] = [["Accounts", d.users.length], ["Signed in this week", active], ["Businesses", businesses], ["Missions played", totalAttempts]];
  return `${head}${notice(c)}
  <div class="stat-tiles">${tiles.map(([l, v]) => `<div class="stat-tile"><strong>${v}</strong><span>${esc(l)}</span></div>`).join("")}</div>
  <section class="level">
    <div class="section-head"><h2>Accounts</h2><button class="btn btn-ghost" data-action="refresh-admin" data-key="refresh-admin">${c.busy ? "Loading…" : "Refresh"}</button></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Name</th><th>Email</th><th>Business</th><th>Signed up</th><th>Last sign-in</th><th>Passed</th><th>Played</th></tr></thead>
      <tbody>${d.users.map((u: AdminUserRow) => `<tr>
        <td>${esc(u.full_name || "No name")}</td><td>${esc(u.email)}</td>
        <td>${u.org_name ? `${esc(u.org_name)} <span class="small">(${u.role === "owner" ? "owner" : "staff"})</span>` : `<span class="small">None</span>`}</td>
        <td>${esc(new Date(u.signed_up).toLocaleDateString())}</td><td>${esc(when(u.last_sign_in))}</td>
        <td class="num">${u.missions_passed}/${MISSIONS.length}</td><td class="num">${u.attempts}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </section>
  <section class="level">
    <h2>Recent activity</h2>
    ${d.recent.length ? `<div class="record-list">${d.recent.map((r) => `<div class="record">
      <div><strong>${esc(r.name)}</strong><span class="small">${esc(missionTitle(r.mission_id))} · ${esc(when(r.created_at))}</span></div>
      <div class="pr-right"><span class="status ${r.passed ? "passed" : "tried"}">${r.passed ? "Passed" : "Not passed"} · ${r.score}</span></div>
    </div>`).join("")}</div>` : `<p class="small">No missions played yet.</p>`}
  </section>`;
}

export function signedInChip(c: CloudState): string {
  if (c.status !== "ready") return "";
  const a = c.account;
  const label = a ? (a.profile?.full_name || a.email).split(" ")[0] : "Sign in";
  return `<button class="account-chip" data-action="account" data-key="account-chip">${a ? `<span class="avatar avatar-sm" aria-hidden="true">${esc(label.slice(0, 1).toUpperCase())}</span>` : crest(18)}<span>${esc(label)}</span></button>`;
}
