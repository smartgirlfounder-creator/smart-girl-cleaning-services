import { cloud, flushQueue, saveRecord, toAttempt } from "../cloud";
import { ACHIEVEMENTS } from "../data/achievements";
import { MISSIONS, missionById } from "../data/missions";
import { CleaningRun } from "../engine/cleaning";
import { InspectionRun } from "../engine/inspection";
import { PlanningRun } from "../engine/planning";
import { Progress, browserStore } from "../engine/progress";
import { ScenarioRun } from "../engine/scenario";
import { summarise, trainingReportCsv } from "../engine/team";
import { APP_NAME } from "../brand";
import { PAYMENTS_ENABLED, isPaidLevel } from "../billing/plans";
import type { Mission, MissionResult, PpeId } from "../engine/types";
import { aboutScreen, achievementsScreen, briefingScreen, homeScreen, libraryScreen, nextMission, progressScreen, roomsScreen } from "./screens/menu";
import { cleaningView, inspectionView, planningView, scenarioView } from "./screens/play";
import { createInstall, installCard, installHelp } from "./install";
import { paywall } from "./screens/billing";
import { accountScreen, adminScreen, signedInChip, teamScreen } from "./screens/business";
import { resultsScreen } from "./screens/results";
import type { CloudState, Session, View } from "./session";

export class App {
  view: View = { name: "home" };
  session: Session | null = null;
  readonly progress = new Progress(browserStore(), ACHIEVEMENTS);
  private confirmExit = false;
  private paymentRef: string | null = null;
  private readonly installer = createInstall(() => this.render());
  private confirmReset = false;
  readonly cloud: CloudState = {
    status: "checking", account: null, busy: false, notice: null, authTab: "signin",
    team: null, myRecords: null, myAssignments: null, admin: null, joinCode: "", confirm: null, copied: false, lastSave: null, pass: null, currency: "NGN",
  };

  constructor(private root: HTMLElement) {
    root.addEventListener("click", (e) => this.onClick(e));
    root.addEventListener("keydown", (e) => this.onKey(e));
    root.addEventListener("input", (e) => this.onInput(e));
    root.addEventListener("submit", (e) => this.onSubmit(e));
    const params = new URLSearchParams(location.search);
    this.paymentRef = params.get("reference") ?? params.get("trxref");
    const join = params.get("join");
    if (join) this.cloud.joinCode = join.toUpperCase().slice(0, 6);
  }

  // ---------- Accounts ----------

  async initCloud(): Promise<void> {
    const ok = await cloud.available();
    this.cloud.status = ok ? "ready" : "offline";
    if (ok) {
      cloud.onAuthChange(() => void this.refreshAccount());
      await this.refreshAccount();
      if (this.cloud.joinCode && !this.cloud.account) {
        this.cloud.authTab = "signup";
        this.cloud.notice = { tone: "info", text: "Create a free account (or sign in) to join your team." };
        this.view = { name: "account" };
      } else if (this.cloud.joinCode && !this.cloud.account?.org) {
        this.view = { name: "team" };
      }
      if (this.paymentRef && this.cloud.account) await this.finishPayment(this.paymentRef);
    }
    this.render();
  }

  private async refreshAccount(): Promise<void> {
    const before = this.cloud.account?.userId;
    try {
      this.cloud.account = await cloud.loadAccount();
    } catch {
      this.cloud.account = null;
    }
    const a = this.cloud.account;
    if (a && a.userId !== before) {
      void cloud.touch(a.userId).catch(() => undefined);
      await flushQueue().catch(() => 0);
      try {
        this.cloud.myRecords = await cloud.myAttempts();
        this.progress.mergeRemote(this.cloud.myRecords);
      } catch {
        /* keep local progress */
      }
    }
    if (a && PAYMENTS_ENABLED) this.cloud.pass = await cloud.expertPass().catch(() => null);
    if (!a) {
      this.cloud.pass = null;
      this.cloud.team = this.cloud.admin = null;
      this.cloud.myRecords = this.cloud.myAssignments = null;
    }
    this.render();
  }

  /** Runs a backend action with a busy state and a friendly error message. */
  private async busy(work: () => Promise<void>): Promise<void> {
    this.cloud.busy = true;
    this.cloud.notice = null;
    this.render();
    try {
      await work();
    } catch (e) {
      this.cloud.notice = { tone: "bad", text: e instanceof Error ? e.message : "Something went wrong. Try again." };
    } finally {
      this.cloud.busy = false;
      this.render();
    }
  }

  private async loadTeam(): Promise<void> {
    const a = this.cloud.account;
    if (!a?.org) return;
    await this.busy(async () => {
      if (a.membership?.role === "owner") this.cloud.team = await cloud.team(a.org!.id);
      else {
        [this.cloud.myAssignments, this.cloud.myRecords] = await Promise.all([cloud.myAssignments(), cloud.myAttempts()]);
      }
    });
  }

  private async loadAdmin(): Promise<void> {
    if (!this.cloud.account?.isAdmin) return;
    await this.busy(async () => {
      this.cloud.admin = await cloud.adminOverview();
    });
  }

  /** Called when Paystack sends the player back with a payment reference. */
  private async finishPayment(reference: string): Promise<void> {
    this.paymentRef = null;
    history.replaceState(null, "", this.siteUrl());
    await this.busy(async () => {
      this.cloud.pass = await cloud.confirmPayment(reference);
      this.cloud.notice = { tone: "good", text: "Payment received. Your Expert Pass is active. Enjoy the Expert missions!" };
    });
    this.view = { name: "account" };
    this.render();
  }

  private needsPass(m: Mission): boolean {
    return isPaidLevel(m.level) && !this.cloud.pass?.active;
  }

  private siteUrl(): string {
    return `${location.origin}${location.pathname}`;
  }

  private onSubmit(e: Event): void {
    const form = e.target as HTMLFormElement;
    const kind = form.dataset.form;
    if (!kind) return;
    e.preventDefault();
    const f = new FormData(form);
    const val = (k: string) => String(f.get(k) ?? "").trim();
    const c = this.cloud;
    if (kind === "signin" || kind === "signup") {
      if (!val("email") || !f.get("password")) {
        c.notice = { tone: "bad", text: "Enter your email and password." };
        return this.render();
      }
      if (kind === "signup" && !val("name")) {
        c.notice = { tone: "bad", text: "Enter your name, so your manager knows who you are." };
        return this.render();
      }
      void this.busy(async () => {
        if (kind === "signup") {
          const r = await cloud.signUp(val("name"), val("email"), String(f.get("password")));
          if (r.needsConfirmation) {
            c.notice = { tone: "info", text: "Account created. Check your email to confirm it, then sign in." };
            return;
          }
        } else await cloud.signIn(val("email"), String(f.get("password")));
        await this.refreshAccount();
        if (c.joinCode && !c.account?.org) this.view = { name: "team" };
        c.notice = { tone: "good", text: kind === "signup" ? "Welcome to the Academy! Your account is ready." : "You're signed in." };
      });
    }
    if (kind === "create-org") {
      void this.busy(async () => {
        await cloud.createOrg(val("name"));
        await this.refreshAccount();
        await this.loadTeam();
        c.notice = { tone: "good", text: "Your business is set up. Share your team code with your staff." };
      });
    }
    if (kind === "join-org") {
      void this.busy(async () => {
        const org = await cloud.joinOrg(val("code"));
        c.joinCode = "";
        await this.refreshAccount();
        await this.loadTeam();
        c.notice = { tone: "good", text: `You've joined ${org.name}.` };
      });
    }
    if (kind === "assign") {
      const org = c.account?.org;
      if (!org) return;
      void this.busy(async () => {
        await cloud.assign(org.id, val("mission"), val("to") || null, val("due") || null);
        c.team = await cloud.team(org.id);
        c.notice = { tone: "good", text: `Assigned: ${missionById(val("mission"))?.title ?? "mission"}.` };
      });
    }
  }

  private downloadReport(): void {
    const t = this.cloud.team;
    const org = this.cloud.account?.org;
    if (!t || !org) return;
    const members = t.members.map((m) => ({ user_id: m.user_id, role: m.role, joined_at: m.joined_at, name: m.profile?.full_name ?? "", email: m.profile?.email ?? "" }));
    const csv = trainingReportCsv(summarise(members, t.attempts), MISSIONS.map((m) => ({ id: m.id, title: m.title })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${org.name.replace(/[^\w-]+/g, "-")}-training-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private copyInvite(): void {
    const org = this.cloud.account?.org;
    if (!org) return;
    const text = `Join ${org.name} on ${APP_NAME}. Open ${this.siteUrl()}?join=${org.join_code} and create a free account, or enter team code ${org.join_code} under My Team.`;
    const done = () => {
      this.cloud.copied = true;
      this.render();
      setTimeout(() => { this.cloud.copied = false; this.render(); }, 2500);
    };
    try {
      navigator.clipboard.writeText(text).then(done, () => {
        this.cloud.notice = { tone: "info", text };
        this.render();
      });
    } catch {
      this.cloud.notice = { tone: "info", text };
      this.render();
    }
  }

  // ---------- Navigation ----------

  go(view: View): void {
    this.view = view;
    this.confirmExit = false;
    this.confirmReset = false;
    this.cloud.confirm = null;
    if (view.name !== "results") this.cloud.notice = null;
    this.render();
    window.scrollTo({ top: 0 });
  }

  private mission(id: string): Mission {
    const m = missionById(id);
    if (!m) throw new Error(`Unknown mission ${id}`);
    return m;
  }

  start(id: string): void {
    const m = this.mission(id);
    if (!this.progress.isUnlocked(m) || this.needsPass(m)) return this.go({ name: "briefing", missionId: id });
    if (m.kind === "cleaning") {
      this.session = { kind: "cleaning", run: new CleaningRun(m), feedback: null, ppe: new Set(), tab: "tools", confirmFinish: false, hintObject: null, flash: null };
    } else if (m.kind === "scenario") {
      this.session = { kind: "scenario", run: new ScenarioRun(m), multi: new Set(), match: {}, outcome: null };
    } else if (m.kind === "planning") {
      this.session = { kind: "planning", run: new PlanningRun(m), confirmSubmit: false };
    } else {
      this.session = { kind: "inspection", run: new InspectionRun(m), feedback: null, confirmSubmit: false, flash: null };
    }
    this.go({ name: "play", missionId: id });
  }

  private complete(result: MissionResult): void {
    const earned = this.progress.addResult(result);
    const missionId = result.missionId;
    this.session = null;
    const a = this.cloud.account;
    this.cloud.lastSave = a ? null : "none";
    this.go({ name: "results", missionId, result, earned });
    if (a) {
      void saveRecord(toAttempt(result, a.org?.id ?? null)).then((r) => {
        this.cloud.lastSave = r;
        if (r === "saved") this.cloud.myRecords = null;
        if (this.view.name === "results") this.render();
      });
    }
  }

  // ---------- Rendering ----------

  render(): void {
    const focusKey = (document.activeElement as HTMLElement | null)?.dataset?.key;
    this.root.innerHTML = this.screen() + this.modal();
    if (focusKey) this.root.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
    // Flash effects play once per action.
    if (this.session && "flash" in this.session) this.session.flash = null;
  }

  private screen(): string {
    const v = this.view;
    const p = this.progress;
    switch (v.name) {
      case "home": return homeScreen(p, this.cloud, signedInChip(this.cloud), installCard(this.installer.state));
      case "account": return accountScreen(this.cloud);
      case "team": return teamScreen(this.cloud, this.siteUrl());
      case "admin": return adminScreen(this.cloud);
      case "rooms": return roomsScreen(p);
      case "library": return libraryScreen();
      case "progress": return progressScreen(p, this.confirmReset);
      case "achievements": return achievementsScreen(p);
      case "about": return aboutScreen();
      case "briefing": {
        const m = this.mission(v.missionId);
        return briefingScreen(p, m, this.needsPass(m) ? paywall(this.cloud) : "");
      }
      case "results": return resultsScreen(p, this.mission(v.missionId), v.result, v.earned, this.cloud.lastSave);
      case "play": {
        const s = this.session;
        if (!s) return homeScreen(p, this.cloud, signedInChip(this.cloud), installCard(this.installer.state));
        if (s.kind === "cleaning") return cleaningView(s);
        if (s.kind === "scenario") return scenarioView(s);
        if (s.kind === "planning") return planningView(s);
        return inspectionView(s);
      }
    }
  }

  private modal(): string {
    if (!this.confirmExit) return installHelp(this.installer.state);
    return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="exit-title">
      <h2 id="exit-title">Leave this mission?</h2>
      <p>This attempt won't be scored or saved.</p>
      <div class="btn-row"><button class="btn btn-danger" data-action="exit-yes" data-key="exit-yes">Leave mission</button><button class="btn btn-primary" data-action="exit-no" data-key="exit-no">Keep playing</button></div>
    </div></div>`;
  }

  // ---------- Events ----------

  private onKey(e: KeyboardEvent): void {
    const t = (e.target as Element).closest<SVGElement>("[data-obj]");
    if (t && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      this.tap(t.dataset.obj!);
      this.root.querySelector<SVGElement>(`[data-obj="${t.dataset.obj}"]`)?.focus();
    }
    if (e.key === "Escape" && this.confirmExit) {
      this.confirmExit = false;
      this.render();
    }
  }

  private onInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    if (el.dataset.input === "player-name") {
      this.progress.setPlayerName(el.value);
      for (const name of this.root.querySelectorAll(".cert-name")) name.textContent = el.value.trim() || "Your name";
    }
  }

  private onClick(e: MouseEvent): void {
    const target = e.target as Element;
    const obj = target.closest<SVGElement>("[data-obj]");
    if (obj) return this.tap(obj.dataset.obj!);
    const el = target.closest<HTMLElement>("[data-action]");
    if (!el || (el as HTMLButtonElement).disabled) return;
    this.act(el.dataset.action!, el.dataset.id ?? "", el);
  }

  private tap(objectId: string): void {
    const s = this.session;
    if (!s) return;
    if (s.kind === "cleaning") {
      const fb = s.run.tap(objectId);
      s.feedback = fb;
      s.hintObject = null;
      s.flash = { obj: objectId, tone: fb.tone };
    } else if (s.kind === "inspection") {
      const fb = s.run.flag(objectId);
      s.feedback = fb;
      s.confirmSubmit = false;
      s.flash = { obj: objectId, tone: fb.tone === "critical" ? "critical" : fb.tone };
    }
    this.render();
  }

  private act(action: string, id: string, el: HTMLElement): void {
    const s = this.session;
    switch (action) {
      case "home": return this.go({ name: "home" });
      case "rooms": return this.go({ name: "rooms" });
      case "library": return this.go({ name: "library" });
      case "progress": return this.go({ name: "progress" });
      case "achievements": return this.go({ name: "achievements" });
      case "about": return this.go({ name: "about" });
      case "play-training": {
        const next = nextMission(this.progress);
        return next ? this.go({ name: "briefing", missionId: next.id }) : this.go({ name: "rooms" });
      }
      case "briefing": return this.go({ name: "briefing", missionId: id });
      case "start": return this.start(id);
      case "exit": this.confirmExit = true; return this.render();
      case "exit-no": this.confirmExit = false; return this.render();
      case "exit-yes": {
        const missionId = this.view.name === "play" ? this.view.missionId : "";
        this.session = null;
        return missionId ? this.go({ name: "briefing", missionId }) : this.go({ name: "home" });
      }
      case "reset": this.confirmReset = true; return this.render();
      case "reset-no": this.confirmReset = false; return this.render();
      case "reset-yes": this.progress.reset(); this.confirmReset = false; return this.render();
      case "tap": return this.tap(id);
      case "account": return this.go({ name: "account" });
      case "install": return void this.installer.install();
      case "currency":
        this.cloud.currency = id === "USD" ? "USD" : "NGN";
        return this.render();
      case "buy-pass":
        return void this.busy(async () => {
          location.href = await cloud.startCheckout(this.cloud.currency, this.siteUrl());
        });
      case "install-close": return this.installer.closeHelp();
      case "team":
        this.go({ name: "team" });
        return void this.loadTeam();
      case "admin":
        this.go({ name: "admin" });
        return void this.loadAdmin();
      case "auth-tab":
        this.cloud.authTab = id === "signup" ? "signup" : "signin";
        this.cloud.notice = null;
        return this.render();
      case "sign-out":
        return void this.busy(async () => {
          await cloud.signOut();
          this.cloud.account = null;
          this.cloud.team = this.cloud.admin = null;
          this.cloud.myRecords = this.cloud.myAssignments = null;
          this.cloud.notice = { tone: "info", text: "You're signed out. Your progress on this device is still here." };
        });
      case "refresh-team": return void this.loadTeam();
      case "refresh-admin": return void this.loadAdmin();
      case "copy-invite": return this.copyInvite();
      case "download-report": return this.downloadReport();
      case "new-code": {
        const org = this.cloud.account?.org;
        if (!org) return;
        return void this.busy(async () => {
          org.join_code = await cloud.regenerateCode(org.id);
          this.cloud.notice = { tone: "good", text: "New team code created. The old one no longer works." };
        });
      }
      case "unassign": {
        const org = this.cloud.account?.org;
        if (!org) return;
        return void this.busy(async () => {
          await cloud.unassign(id);
          this.cloud.team = await cloud.team(org.id);
        });
      }
      case "remove": this.cloud.confirm = `remove:${id}`; return this.render();
      case "leave": this.cloud.confirm = "leave"; return this.render();
      case "confirm-no": this.cloud.confirm = null; return this.render();
      case "remove-yes": {
        const org = this.cloud.account?.org;
        if (!org) return;
        this.cloud.confirm = null;
        return void this.busy(async () => {
          await cloud.removeMember(id);
          this.cloud.team = await cloud.team(org.id);
        });
      }
      case "leave-yes": {
        const a = this.cloud.account;
        if (!a) return;
        this.cloud.confirm = null;
        return void this.busy(async () => {
          await cloud.leaveOrg(a.userId);
          await this.refreshAccount();
          this.cloud.notice = { tone: "info", text: "You've left the team." };
        });
      }
    }

    if (s?.kind === "cleaning") {
      const run = s.run;
      switch (action) {
        case "to-ppe":
          if (run.startPpe()) s.feedback = { tone: "info", title: "Inspection complete", body: "You know what the room needs. Now choose your protective equipment." };
          break;
        case "ppe":
          s.ppe.has(id) ? s.ppe.delete(id) : s.ppe.add(id);
          break;
        case "equip":
          s.feedback = run.equipPpe([...s.ppe] as PpeId[]).feedback;
          break;
        case "tab":
          s.tab = id === "products" ? "products" : "tools";
          break;
        case "hold":
          run.hold(id || null);
          break;
        case "load":
          run.load(id || null);
          break;
        case "hint": {
          const t = run.suggestedTask();
          s.hintObject = t?.objectId ?? null;
          s.feedback = t
            ? { tone: "info", title: `Suggested next job: ${t.label}`, body: t.toolWhy }
            : { tone: "info", title: "No hint needed", body: "All required tasks are done." };
          break;
        }
        case "finish":
          if (run.allRequiredDone()) return this.complete(run.finish());
          s.confirmFinish = true;
          break;
        case "finish-no":
          s.confirmFinish = false;
          break;
        case "finish-yes":
          return this.complete(run.finish());
      }
      return this.render();
    }

    if (s?.kind === "scenario") {
      const run = s.run;
      const sc = run.current();
      switch (action) {
        case "choose":
          s.outcome = run.answer({ type: "choice", optionId: id });
          break;
        case "toggle":
          s.multi.has(id) ? s.multi.delete(id) : s.multi.add(id);
          break;
        case "match":
          s.match[id] = el.dataset.choice ?? "";
          break;
        case "submit-answer":
          if (sc?.type === "multi") s.outcome = run.answer({ type: "multi", optionIds: [...s.multi] });
          if (sc?.type === "match") s.outcome = run.answer({ type: "match", picks: { ...s.match } });
          break;
        case "next-scenario":
          if (!run.next()) return this.complete(run.finish());
          s.outcome = null;
          s.multi = new Set();
          s.match = {};
          this.render();
          window.scrollTo({ top: 0 });
          this.root.querySelector<HTMLElement>(".scenario-card h2")?.focus();
          return;
      }
      return this.render();
    }

    if (s?.kind === "planning") {
      const run = s.run;
      switch (action) {
        case "plan-add": run.add(id); break;
        case "plan-remove": run.remove(id); break;
        case "plan-up": run.move(id, -1); break;
        case "plan-down": run.move(id, 1); break;
        case "plan-submit": s.confirmSubmit = true; break;
        case "plan-no": s.confirmSubmit = false; break;
        case "plan-yes": return this.complete(run.finish());
      }
      if (action !== "plan-submit" && action !== "plan-no") s.confirmSubmit = false;
      return this.render();
    }

    if (s?.kind === "inspection") {
      switch (action) {
        case "submit":
          if (s.run.foundCount === s.run.mission.defects.length) return this.complete(s.run.submit());
          s.confirmSubmit = true;
          break;
        case "submit-no":
          s.confirmSubmit = false;
          break;
        case "submit-yes":
          return this.complete(s.run.submit());
      }
      return this.render();
    }
  }
}

export function mount(root: HTMLElement): App {
  const app = new App(root);
  app.render();
  void app.initCloud();
  return app;
}

