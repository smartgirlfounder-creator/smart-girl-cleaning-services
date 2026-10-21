import { APP_NAME, FULL_NAME } from "../../brand";
import { ACHIEVEMENTS } from "../../data/achievements";
import { NEVER_MIX, PPE, PRODUCTS, TOOLS } from "../../data/equipment";
import { LEVELS } from "../../data/levels";
import { FUTURE_ROOMS, MISSIONS, missionById } from "../../data/missions";
import type { Progress } from "../../engine/progress";
import type { Mission } from "../../engine/types";
import { backButton, esc, levelName, pageHeader } from "../html";
import { badgeIcon, bottleIcon, crest, lockIcon, stars, toolIcon } from "../icons";
import { renderBathroom } from "../scenes/bathroom";
import type { CloudState } from "../session";

const KIND_LABEL: Record<Mission["kind"], string> = {
  cleaning: "Hands-on room",
  scenario: "Decisions",
  inspection: "Quality control",
  planning: "Shift planning",
};

export function nextMission(p: Progress): Mission | undefined {
  return MISSIONS.find((m) => p.isUnlocked(m) && !p.isPassed(m.id));
}

export function homeScreen(p: Progress, c: CloudState, accountChip: string, install = ""): string {
  const next = nextMission(p);
  const passed = MISSIONS.filter((m) => p.isPassed(m.id)).length;
  const cta = next
    ? `<button class="btn btn-primary btn-lg" data-action="play-training" data-key="cta">${p.record(next.id) ? "Continue" : "Start"}: ${esc(next.title)}</button>`
    : `<button class="btn btn-primary btn-lg" data-action="rooms" data-key="cta">All missions passed. Replay a mission</button>`;
  const tiles: [string, string, string][] = [
    ["play-training", "Play Training", next ? `Next up: ${next.shortTitle}` : "Replay any mission"],
    ["rooms", "Choose a Room", "Every mission and the rooms coming next"],
    ["library", "Equipment and Chemical Safety", "Colour codes, products, PPE and never-mix rules"],
    ["progress", "My Progress", `${passed} of ${MISSIONS.length} missions passed`],
    ["achievements", "Achievements", `${Object.keys(p.data.achievements).length} of ${ACHIEVEMENTS.length} badges earned`],
    ["about", "About the Academy", "How training and scoring work"],
    ["team", "My Team", c.account?.org ? `${c.account.org.name} · ${c.account.membership?.role === "owner" ? "owner" : "staff"}` : "Business edition: staff, assignments and training records"],
  ];
  if (c.account?.isAdmin) tiles.push(["admin", "Admin Dashboard", "Everyone using the Academy, and how they're doing"]);
  return `
  <div class="home">
    <header class="brand">${crest(44)}<div><span class="eyebrow">Cleaning Academy</span><strong class="brand-name">${APP_NAME}</strong></div>${accountChip}</header>
    <section class="hero">
      <div class="hero-copy">
        <h1>Learn cleaning by <em>playing games</em></h1>
        <p class="lede">Hands-on missions in virtual rooms. Choose your PPE, pick the right tools and products, work in the right order, and get feedback on every decision.</p>
        <div class="hero-cta">${cta}</div>
        <div class="meter" aria-label="${passed} of ${MISSIONS.length} missions passed"><span style="width:${(passed / MISSIONS.length) * 100}%"></span></div>
        <p class="small">${passed} of ${MISSIONS.length} training missions passed</p>
      </div>
      <figure class="hero-scene">
        ${renderBathroom(new Set())}
        <figcaption>Mission 1: this bathroom needs a professional.</figcaption>
      </figure>
    </section>
    ${c.status === "ready" && !c.account && passed > 0
      ? `<div class="save-banner"><div><strong>Save your progress</strong><span class="small">Your progress is only on this device. Sign in and it's saved to your account, so you can pick up where you stopped on any phone or computer.</span></div><button class="btn btn-primary btn-sm" data-action="account" data-key="save-banner">Sign in</button></div>`
      : ""}
    ${install}
    <nav class="menu-grid" aria-label="Main menu">
      ${tiles.map(([a, t, d], i) => `<button class="tile ${i === 0 ? "tile-feature" : ""}" data-action="${a}" data-key="tile-${a}"><strong>${esc(t)}</strong><span>${esc(d)}</span></button>`).join("")}
    </nav>
  </div>`;
}

function missionStatus(p: Progress, m: Mission): string {
  const rec = p.record(m.id);
  if (!p.isUnlocked(m)) {
    const need = m.requires.filter((id) => !p.isPassed(id)).map((id) => missionById(id)?.shortTitle ?? id);
    return `<span class="status locked">${lockIcon()} Pass ${esc(need.join(" and "))} to unlock</span>`;
  }
  if (rec?.passed) return `<span class="status passed">Passed · best ${rec.bestScore}</span>${stars(rec.bestStars)}`;
  if (rec) return `<span class="status tried">Not passed yet · best ${rec.bestScore}</span>`;
  return `<span class="status ready">Ready to play</span>`;
}

export function roomsScreen(p: Progress): string {
  return `${pageHeader("Choose a Room", "Missions unlock as you pass the training before them. You can preview any mission.")}
  ${LEVELS.map((lvl) => {
    const missions = MISSIONS.filter((m) => m.level === lvl.id);
    const future = FUTURE_ROOMS.filter((r) => r.level === lvl.id);
    return `<section class="level">
      <h2>${esc(lvl.name)}</h2><p class="small">${esc(lvl.description)}</p>
      <div class="cards">
        ${missions.map((m) => `
          <button class="mission-card ${p.isUnlocked(m) ? "" : "is-locked"}" data-action="briefing" data-id="${m.id}" data-key="m-${m.id}">
            <span class="kind">${KIND_LABEL[m.kind]}</span>
            <strong>${esc(m.title)}</strong>
            <span class="desc">${esc(m.summary)}</span>
            <span class="meta">${missionStatus(p, m)}</span>
          </button>`).join("")}
        ${future.map((r) => `
          <div class="mission-card is-future" aria-label="${esc(r.name)}, in development">
            <span class="kind">In development</span>
            <strong>${esc(r.name)}</strong>
            <span class="desc">${esc(r.summary)}</span>
            <span class="meta"><span class="status locked">${lockIcon()} Coming in a later release</span></span>
          </div>`).join("")}
      </div>
    </section>`;
  }).join("")}`;
}

export function briefingScreen(p: Progress, m: Mission, paywallHtml = ""): string {
  const unlocked = p.isUnlocked(m);
  const rec = p.record(m.id);
  const how =
    m.kind === "cleaning"
      ? ["Inspect: tap every area of the room to see what needs doing.", "PPE: choose the protective equipment the job needs.", "Clean: pick a tool and a product from your trolley, then tap the area to clean it.", "Final check: walk through the room, then finish."]
      : m.kind === "scenario"
        ? ["Read each situation from a real cleaning job.", "Choose what you would do.", "See the consequence and the rule behind it."]
        : m.kind === "planning"
          ? ["Read the brief and check how much time you have.", "Tap jobs to add them to your plan, in the order you'll do them.", "Use the arrows to reorder, and leave out what doesn't fit.", "Start the shift to see how your plan works out."]
          : ["Tap anything in the room that isn't up to standard.", "Compare the room with your colleague's checklist: ticks are not proof.", "Avoid flagging areas that were cleaned properly.", "Submit your inspection report."];
  const need = m.requires.filter((id) => !p.isPassed(id)).map((id) => missionById(id)?.title ?? id);
  return `${pageHeader(esc(m.title), undefined, backButton("rooms", "Rooms"))}
  <div class="briefing">
    <div class="brief-main">
      <p class="chips"><span class="chip">${levelName(m.level)}</span><span class="chip">About ${m.estimatedMinutes} min</span>${rec ? `<span class="chip">Best: ${rec.bestScore}</span>` : ""}</p>
      <p class="lede">${esc(m.summary)}</p>
      <h2>You will learn to</h2>
      <ul class="ticks">${m.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
      <h2>How to play</h2>
      <ol class="steps">${how.map((h) => `<li>${esc(h)}</li>`).join("")}</ol>
      <div class="callout"><strong>Why it matters</strong><p>${esc(m.whyItMatters)}</p></div>
      <div class="callout callout-safety"><strong>Scoring</strong><p>Scores reward safe practice, the right tools, the right order and thoroughness. Speed is not scored. A safety-critical error means the attempt can't pass, however clean the room looks.</p></div>
    </div>
    <div class="brief-cta">
      ${unlocked && paywallHtml
        ? paywallHtml
        : unlocked
        ? `<button class="btn btn-primary btn-lg" data-action="start" data-id="${m.id}" data-key="start">Start mission</button>`
        : `<div class="locked-note">${lockIcon()}<p>Preview only. Pass ${esc(need.join(" and "))} to unlock this mission.</p></div>`}
    </div>
  </div>`;
}

export function libraryScreen(): string {
  const cloths = ["cloth-red", "cloth-yellow", "cloth-blue", "cloth-green"].map((id) => TOOLS[id]);
  return `${pageHeader("Equipment and Chemical Safety", "Reference guide for the tools and products used in the missions.")}
  <section class="lib-section">
    <h2>Colour-coded cloths</h2>
    <p class="small">One colour, one zone. This stops germs travelling from toilets to sinks, or from bathrooms to kitchens. Many companies use this UK-style system; always follow your employer's own colour code.</p>
    <div class="cards cards-3">
      ${cloths.map((t) => `<div class="ref-card">${toolIcon(t.icon, t.color)}<strong>${esc(t.name)}</strong><p>${esc(t.description)}</p></div>`).join("")}
    </div>
  </section>
  <section class="lib-section">
    <h2>Never mix</h2>
    <div class="never">
      ${NEVER_MIX.map((r) => `<div class="never-row"><span>${r.a === "chlorine" ? "Bleach" : r.a}</span><span class="x" aria-hidden="true">+</span><span>${r.b === "acid" ? "Acids (toilet cleaner, limescale remover, vinegar)" : "Ammonia (some glass cleaners)"}</span><span class="arrow" aria-hidden="true">→</span><span class="gas">${esc(r.gas)}</span></div>`).join("")}
      <p class="small">The safest rule: never mix any cleaning products, and rinse a surface before switching products.</p>
    </div>
  </section>
  <section class="lib-section">
    <h2>Products</h2>
    <div class="cards">
      ${Object.values(PRODUCTS).map((pr) => `<article class="ref-card product">
        <div class="ref-top">${bottleIcon(pr.color)}<div><strong>${esc(pr.name)}</strong><p class="small">${esc(pr.use)}</p></div></div>
        <dl>
          <dt>Use on</dt><dd>${esc(pr.suitableFor.join(", "))}</dd>
          ${pr.avoidOn.length ? `<dt>Never on</dt><dd>${esc(pr.avoidOn.join(", "))}</dd>` : ""}
          <dt>PPE</dt><dd>${esc(pr.ppe.map((x) => PPE[x].name).join(", "))}</dd>
          ${pr.dilution ? `<dt>Dilution</dt><dd>${esc(pr.dilution)}</dd>` : ""}
          ${pr.needsVentilation ? `<dt>Air</dt><dd>Ventilate the room before use</dd>` : ""}
        </dl>
      </article>`).join("")}
    </div>
  </section>
  <section class="lib-section">
    <h2>PPE</h2>
    <div class="cards cards-3">${Object.values(PPE).map((x) => `<div class="ref-card"><strong>${esc(x.name)}</strong><p>${esc(x.purpose)}</p></div>`).join("")}</div>
  </section>
  <section class="lib-section">
    <h2>Equipment</h2>
    <div class="cards cards-3">${Object.values(TOOLS).filter((t) => !t.id.startsWith("cloth")).map((t) => `<div class="ref-card">${toolIcon(t.icon, t.color)}<strong>${esc(t.name)}</strong><p>${esc(t.description)}</p></div>`).join("")}</div>
    <div class="callout callout-safety"><strong>Before every shift</strong><p>Check cables, plugs and equipment for damage. Anything damaged is unplugged, labelled "Do not use" and reported.</p></div>
  </section>
  <p class="disclaimer">This guide is simplified for training. In real work, always follow the product label, the safety data sheet (SDS) and your employer's procedures.</p>`;
}

function certificates(p: Progress): string {
  const earned = LEVELS.map((lvl) => ({ lvl, missions: MISSIONS.filter((m) => m.level === lvl.id) }))
    .filter(({ missions }) => missions.length && missions.every((m) => p.isPassed(m.id)));
  if (!earned.length) return `<p class="small">Pass every mission in a level to unlock that level's training-completion certificate.</p>`;
  const name = esc(p.data.playerName || "Your name");
  return `<label class="field" for="player-name">Name on your certificates</label>
    <input id="player-name" class="input" maxlength="60" value="${esc(p.data.playerName)}" placeholder="Your name" data-input="player-name" autocomplete="name">
    ${earned.map(({ lvl, missions }) => {
      const issued = missions.map((m) => p.record(m.id)?.lastPlayed ?? "").sort().pop();
      return `<div class="certificate">
        ${crest(56)}
        <span class="eyebrow">${FULL_NAME}</span>
        <h3>Certificate of Training Completion</h3>
        <p class="cert-level">${esc(lvl.name)} level</p>
        <p class="cert-name">${name}</p>
        <p>has completed the ${esc(lvl.name)} training missions: ${esc(missions.map((m) => m.title).join(", "))}.</p>
        ${issued ? `<p class="small">Issued ${esc(new Date(issued).toLocaleDateString())}</p>` : ""}
        <p class="cert-note">This is a game-based training-completion certificate. It is not an accredited qualification.</p>
      </div>`;
    }).join("")}`;
}

export function progressScreen(p: Progress, confirmReset: boolean): string {
  const storageNote = p.persistent
    ? "Your progress is saved in this browser on this device only. It won't appear on other devices, and clearing your browser data erases it."
    : "This browser isn't letting the Academy save. Your progress will last until you close or reload the page.";
  return `${pageHeader("My Progress")}
  <p class="notice">${esc(storageNote)}</p>
  ${LEVELS.map((lvl) => {
    const ms = MISSIONS.filter((m) => m.level === lvl.id);
    return `<section class="level"><h2>${esc(lvl.name)}</h2>
      <div class="progress-list">${ms.map((m) => {
        const r = p.record(m.id);
        return `<div class="progress-row">
          <div><strong>${esc(m.title)}</strong><span class="small">${r ? `${r.attempts} attempt${r.attempts === 1 ? "" : "s"} · best score ${r.bestScore}` : p.isUnlocked(m) ? "Not started" : "Locked"}</span></div>
          <div class="pr-right">${r ? stars(r.bestStars) : ""}${r?.passed ? `<span class="status passed">Passed</span>` : ""}</div>
        </div>`;
      }).join("")}</div></section>`;
  }).join("")}
  <section class="level">
    <h2>Certificates</h2>
    ${certificates(p)}
  </section>
  <section class="level">
    ${confirmReset
      ? `<div class="confirm"><p>Erase all progress, scores and badges on this device? This can't be undone.</p><div class="btn-row"><button class="btn btn-danger" data-action="reset-yes" data-key="reset-yes">Erase progress</button><button class="btn" data-action="reset-no" data-key="reset-no">Keep my progress</button></div></div>`
      : `<button class="btn btn-ghost" data-action="reset" data-key="reset">Reset progress</button>`}
  </section>`;
}

export function achievementsScreen(p: Progress): string {
  return `${pageHeader("Achievements", `${Object.keys(p.data.achievements).length} of ${ACHIEVEMENTS.length} badges earned`)}
  <div class="badges">${ACHIEVEMENTS.map((a) => {
    const at = p.data.achievements[a.id];
    return `<div class="badge ${at ? "earned" : ""}">${badgeIcon(!!at)}<strong>${esc(a.name)}</strong><p>${esc(a.description)}</p><span class="small">${at ? `Earned ${esc(new Date(at).toLocaleDateString())}` : "Not earned yet"}</span></div>`;
  }).join("")}</div>`;
}

export function aboutScreen(): string {
  return `${pageHeader("About the Academy")}
  <div class="prose">
    <p class="lede">${FULL_NAME} teaches professional cleaning by doing it: inside virtual rooms, with real tools, real products and real consequences.</p>
    <h2>Who it's for</h2>
    <ul class="ticks"><li>Beginners learning professional cleaning</li><li>Working cleaners sharpening their skills</li><li>Cleaning business owners training staff</li><li>Hotels, offices and facility teams that need repeatable training</li></ul>
    <h2>How scoring works</h2>
    <p>Every mission scores you on what professionals care about: safe practice, the right tools and products, the right order of work, and thoroughness. Speed is never the main measure.</p>
    <p>Safety comes first. A safety-critical error, such as mixing bleach with an acid or using a toilet cloth on a sink, caps your score below the pass mark. A spotless room never makes up for an unsafe one.</p>
    <h2>Good to know</h2>
    <ul class="ticks">
      <li>This is a simplified simulation for training. Always follow product labels, safety data sheets and your employer's procedures.</li>
      <li>Colour-coding follows a common UK-style system. Your workplace may use a different one.</li>
      <li>Certificates from the Academy are game-based training-completion certificates, not accredited qualifications.</li>
      <li>Without an account, progress is saved on this device only. With a free account, every finished mission is saved to your training record.</li>
    </ul>
    <h2>Coming next</h2>
    <p>More rooms (bedroom, sitting room, office, hands-on hotel turnover, move-in, move-out and post-construction cleaning), and email invitations and password resets for the business edition.</p>
  </div>`;
}
