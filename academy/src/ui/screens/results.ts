import { MISSIONS } from "../../data/missions";
import type { Achievement, Progress } from "../../engine/progress";
import { PASS_MARK } from "../../engine/scoring";
import type { Mission, MissionResult } from "../../engine/types";
import { esc } from "../html";
import { badgeIcon, stars } from "../icons";

const MISSED_HEADING: Record<Mission["kind"], string> = {
  cleaning: "Tasks not completed",
  scenario: "Not answered",
  inspection: "Problems you missed",
  planning: "Essential jobs left out of your plan",
};

export function resultsScreen(p: Progress, m: Mission, r: MissionResult, earned: Achievement[], save: "saved" | "queued" | "none" | null = "none"): string {
  const idx = MISSIONS.findIndex((x) => x.id === m.id);
  const next = MISSIONS.slice(idx + 1).find((x) => p.isUnlocked(x));
  const other = r.mistakes.filter((x) => x.severity !== "critical");
  const verdict = r.criticalErrors.length
    ? "Not passed: a safety-critical error"
    : r.passed
      ? r.stars === 3 ? "Outstanding work" : "Mission passed"
      : r.missed.length ? "Not passed: essentials were missed" : r.mistakes.some((x) => x.key === "over-time") ? "Not passed: the plan runs over time" : `Not passed: ${PASS_MARK} points needed`;
  return `<div class="results">
    <header class="results-head ${r.passed ? "pass" : "fail"}">
      <span class="eyebrow">${esc(m.title)}</span>
      <h1>${esc(verdict)}</h1>
      <div class="score-row">
        <div class="score-ring" style="--p:${r.score}"><span>${r.score}</span><small>/100</small></div>
        ${stars(r.stars)}
      </div>
    </header>

    ${r.criticalErrors.length ? `<section class="crit-box" role="alert">
      <h2>Safety-critical error${r.criticalErrors.length > 1 ? "s" : ""}</h2>
      <p>Safety errors can't be made up for by a clean room, so this attempt is capped below the pass mark.</p>
      <ul>${r.criticalErrors.map((c) => `<li><strong>${esc(c.title)}</strong><p>${esc(c.why)}</p></li>`).join("")}</ul>
    </section>` : ""}

    <section class="breakdown">
      <h2>Score breakdown</h2>
      ${r.lines.map((l) => `<div class="line"><div class="line-top"><span>${esc(l.label)}</span><span>${l.earned} / ${l.max}</span></div><div class="meter"><span style="width:${(l.earned / l.max) * 100}%"></span></div></div>`).join("")}
    </section>

    ${r.missed.length ? `<section class="list-box"><h2>${MISSED_HEADING[m.kind]}</h2><ul>${r.missed.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}

    ${other.length ? `<section class="list-box"><h2>What to work on</h2><ul class="mistakes">${other.map((x) => `<li><strong>${esc(x.title)}</strong><p>${esc(x.why)}</p></li>`).join("")}</ul></section>` : r.criticalErrors.length ? "" : `<section class="list-box"><h2>No mistakes</h2><p>Every decision you made was a professional one.</p></section>`}

    ${earned.length ? `<section class="new-badges"><h2>New badge${earned.length > 1 ? "s" : ""}</h2><div class="badges">${earned.map((a) => `<div class="badge earned">${badgeIcon(true)}<strong>${esc(a.name)}</strong><p>${esc(a.description)}</p></div>`).join("")}</div></section>` : ""}

    <p class="save-note">${save === "saved" ? "Saved to your training record." : save === "queued" ? "You're offline. This result will be saved to your training record when you're back online." : save === null ? "Saving to your training record…" : `Playing without an account: this result is saved on this device only. <button class="link-btn" data-action="account" data-key="save-signin">Sign in to keep a training record</button>`}</p>

    <section class="callout"><strong>Why it matters</strong><p>${esc(m.whyItMatters)}</p></section>

    <div class="btn-row results-actions">
      <button class="btn ${r.passed ? "" : "btn-primary"}" data-action="start" data-id="${m.id}" data-key="retry">Retry mission</button>
      ${next ? `<button class="btn ${r.passed ? "btn-primary" : ""}" data-action="briefing" data-id="${next.id}" data-key="next">Next mission: ${esc(next.shortTitle)}</button>` : ""}
      <button class="btn btn-ghost" data-action="home" data-key="to-menu">Main menu</button>
    </div>
  </div>`;
}
