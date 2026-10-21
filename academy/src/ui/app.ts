import { ACHIEVEMENTS } from "../data/achievements";
import { missionById } from "../data/missions";
import { CleaningRun } from "../engine/cleaning";
import { InspectionRun } from "../engine/inspection";
import { Progress, browserStore } from "../engine/progress";
import { ScenarioRun } from "../engine/scenario";
import type { Mission, MissionResult, PpeId } from "../engine/types";
import { aboutScreen, achievementsScreen, briefingScreen, homeScreen, libraryScreen, nextMission, progressScreen, roomsScreen } from "./screens/menu";
import { cleaningView, inspectionView, scenarioView } from "./screens/play";
import { resultsScreen } from "./screens/results";
import type { Session, View } from "./session";

export class App {
  view: View = { name: "home" };
  session: Session | null = null;
  readonly progress = new Progress(browserStore(), ACHIEVEMENTS);
  private confirmExit = false;
  private confirmReset = false;

  constructor(private root: HTMLElement) {
    root.addEventListener("click", (e) => this.onClick(e));
    root.addEventListener("keydown", (e) => this.onKey(e));
    root.addEventListener("input", (e) => this.onInput(e));
  }

  // ---------- Navigation ----------

  go(view: View): void {
    this.view = view;
    this.confirmExit = false;
    this.confirmReset = false;
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
    if (!this.progress.isUnlocked(m)) return this.go({ name: "briefing", missionId: id });
    if (m.kind === "cleaning") {
      this.session = { kind: "cleaning", run: new CleaningRun(m), feedback: null, ppe: new Set(), tab: "tools", confirmFinish: false, hintObject: null, flash: null };
    } else if (m.kind === "scenario") {
      this.session = { kind: "scenario", run: new ScenarioRun(m), multi: new Set(), match: {}, outcome: null };
    } else {
      this.session = { kind: "inspection", run: new InspectionRun(m), feedback: null, confirmSubmit: false, flash: null };
    }
    this.go({ name: "play", missionId: id });
  }

  private complete(result: MissionResult): void {
    const earned = this.progress.addResult(result);
    const missionId = result.missionId;
    this.session = null;
    this.go({ name: "results", missionId, result, earned });
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
      case "home": return homeScreen(p);
      case "rooms": return roomsScreen(p);
      case "library": return libraryScreen();
      case "progress": return progressScreen(p, this.confirmReset);
      case "achievements": return achievementsScreen(p);
      case "about": return aboutScreen();
      case "briefing": return briefingScreen(p, this.mission(v.missionId));
      case "results": return resultsScreen(p, this.mission(v.missionId), v.result, v.earned);
      case "play": {
        const s = this.session;
        if (!s) return homeScreen(p);
        if (s.kind === "cleaning") return cleaningView(s);
        if (s.kind === "scenario") return scenarioView(s);
        return inspectionView(s);
      }
    }
  }

  private modal(): string {
    if (!this.confirmExit) return "";
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
      const name = this.root.querySelector("#cert-name");
      if (name) name.textContent = el.value.trim() || "Your name";
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
  return app;
}

