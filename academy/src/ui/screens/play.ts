import { PPE, PRODUCTS, TOOLS } from "../../data/equipment";
import type { CleaningRun } from "../../engine/cleaning";
import type { ScenarioVisual } from "../../engine/types";
import { esc, feedbackBox } from "../html";
import { bottleIcon, toolIcon } from "../icons";
import { ANCHORS, VIEW, renderBathroom, type Marker } from "../scenes/bathroom";
import type { Session } from "../session";

type CleaningSession = Extract<Session, { kind: "cleaning" }>;
type ScenarioSession = Extract<Session, { kind: "scenario" }>;
type InspectionSession = Extract<Session, { kind: "inspection" }>;

function playBar(title: string, right: string): string {
  return `<div class="play-bar">
    <button class="btn-back" data-action="exit" data-key="exit"><span aria-hidden="true">‹</span> Exit</button>
    <strong class="play-title">${esc(title)}</strong>
    <div class="play-right">${right}</div>
  </div>`;
}

function flashLayer(flash: { obj: string; tone: string } | null): string {
  if (!flash) return "";
  const a = ANCHORS[flash.obj];
  if (!a) return "";
  const pieces = flash.tone === "good" ? 8 : 1;
  return `<div class="flash flash-${flash.tone}" style="left:${(a.x / VIEW.w) * 100}%;top:${(a.y / VIEW.h) * 100}%" aria-hidden="true">
    ${Array.from({ length: pieces }, (_, i) => `<i style="--a:${(360 / pieces) * i}deg"></i>`).join("")}
  </div>`;
}

// ---------- Cleaning ----------

const PHASES: [CleaningRun["phase"], string][] = [
  ["inspect", "Inspect"],
  ["ppe", "PPE"],
  ["clean", "Clean"],
  ["check", "Check"],
];

function stepper(phase: CleaningRun["phase"]): string {
  const idx = PHASES.findIndex(([p]) => p === phase);
  return `<ol class="stepper" aria-label="Mission steps">${PHASES.map(([, label], i) =>
    `<li class="${i < idx || phase === "done" ? "past" : i === idx ? "now" : ""}" ${i === idx ? 'aria-current="step"' : ""}>${label}</li>`).join("")}</ol>`;
}

function cleaningMarkers(s: CleaningSession): Record<string, Marker> {
  const { run } = s;
  const out: Record<string, Marker> = {};
  for (const o of run.mission.objects) {
    if (run.phase === "inspect") out[o.id] = run.inspected.has(o.id) ? "done" : "todo";
    else if (run.phase === "check") out[o.id] = run.checked.has(o.id) ? "done" : "todo";
    else if (run.phase === "clean") {
      const req = run.mission.tasks.filter((t) => t.objectId === o.id && !t.optional);
      if (req.length && req.every((t) => run.done.has(t.id))) out[o.id] = "done";
    }
  }
  if (s.hintObject && run.phase === "clean") out[s.hintObject] = "hint";
  return out;
}

function tray(s: CleaningSession): string {
  const { run } = s;
  const held = run.heldTool ? TOOLS[run.heldTool] : null;
  const prod = run.heldProduct ? PRODUCTS[run.heldProduct] : null;
  const tools = [null, ...run.mission.tools];
  const products = [null, ...run.mission.products];
  return `<div class="tray">
    <div class="holding" aria-live="polite">
      <span class="small">In your hands</span>
      <span class="holding-items">
        <span class="hold">${held ? toolIcon(held.icon, held.color) : toolIcon("hand", "")}${esc(held ? held.short : "Gloved hands")}</span>
        <span class="plus" aria-hidden="true">+</span>
        <span class="hold">${prod ? bottleIcon(prod.color) : ""}${esc(prod ? prod.short : "No product")}</span>
      </span>
    </div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="${s.tab === "tools"}" class="tab" data-action="tab" data-id="tools" data-key="tab-tools">Tools</button>
      <button role="tab" aria-selected="${s.tab === "products"}" class="tab" data-action="tab" data-id="products" data-key="tab-products">Products</button>
    </div>
    <div class="tray-grid" role="tabpanel">
      ${s.tab === "tools"
        ? tools.map((id) => {
            const t = id ? TOOLS[id] : null;
            const on = run.heldTool === id;
            return `<button class="tray-item ${on ? "on" : ""}" aria-pressed="${on}" data-action="hold" data-id="${id ?? ""}" data-key="tool-${id ?? "hands"}">
              ${t ? toolIcon(t.icon, t.color) : toolIcon("hand", "")}<span>${esc(t ? t.short : "Gloved hands")}</span></button>`;
          }).join("")
        : products.map((id) => {
            const p = id ? PRODUCTS[id] : null;
            const on = run.heldProduct === id;
            return `<button class="tray-item ${on ? "on" : ""}" aria-pressed="${on}" data-action="load" data-id="${id ?? ""}" data-key="prod-${id ?? "none"}">
              ${p ? bottleIcon(p.color) : `<span class="ico none" aria-hidden="true">∅</span>`}<span>${esc(p ? p.short : "No product")}</span></button>`;
          }).join("")}
    </div>
  </div>`;
}

function checklist(run: CleaningRun): string {
  return `<div class="checklist"><h3>Job sheet <span class="small">${run.requiredDoneCount} of ${run.requiredTasks.length} done</span></h3>
    <ul>${run.mission.objects.map((o) => {
      const ts = run.mission.tasks.filter((t) => t.objectId === o.id);
      return ts.map((t) => `<li class="${run.done.has(t.id) ? "done" : ""}"><span class="box" aria-hidden="true"></span>${esc(t.label)}${t.optional ? ` <em class="opt">optional</em>` : ""}<span class="sr-only">${run.done.has(t.id) ? " (done)" : ""}</span></li>`).join("");
    }).join("")}</ul></div>`;
}

function areaButtons(run: CleaningRun, verb: string, isDone: (id: string) => boolean): string {
  return `<details class="areas"><summary>Area list (alternative to tapping the picture)</summary>
    <div class="area-grid">${run.mission.objects.map((o) => `<button class="area-btn ${isDone(o.id) ? "done" : ""}" data-action="tap" data-id="${o.id}" data-key="area-${o.id}">${esc(verb)} ${esc(o.name.toLowerCase())}</button>`).join("")}</div></details>`;
}

export function cleaningView(s: CleaningSession): string {
  const { run } = s;
  const m = run.mission;
  let panel = "";
  if (run.phase === "inspect") {
    panel = `<h2>Step 1: Inspect the room</h2>
      <p>Professionals look before they clean. Tap each area of the room to see what needs doing.</p>
      <div class="count">${run.inspected.size} of ${m.objects.length} areas inspected</div>
      <ul class="notes">${m.objects.filter((o) => run.inspected.has(o.id)).map((o) => `<li><strong>${esc(o.name)}:</strong> ${esc(o.inspectNote)}</li>`).join("")}</ul>
      ${areaButtons(run, "Inspect", (id) => run.inspected.has(id))}
      <button class="btn btn-primary" data-action="to-ppe" data-key="to-ppe" ${run.canLeaveInspection() ? "" : "disabled"}>Next: choose PPE</button>`;
  } else if (run.phase === "ppe") {
    panel = `<h2>Step 2: Choose your PPE</h2>
      <p>Today's job uses a corrosive toilet cleaner and spray products. Select everything you need, then put it on.</p>
      <div class="ppe-grid">${m.ppe.offered.map((id) => {
        const on = s.ppe.has(id);
        return `<button class="ppe-item ${on ? "on" : ""}" aria-pressed="${on}" data-action="ppe" data-id="${id}" data-key="ppe-${id}"><strong>${esc(PPE[id].name)}</strong><span>${esc(PPE[id].purpose)}</span></button>`;
      }).join("")}</div>
      <button class="btn btn-primary" data-action="equip" data-key="equip">Put on PPE</button>`;
  } else {
    const isCheck = run.phase === "check";
    const finish = s.confirmFinish
      ? `<div class="confirm"><p>${run.requiredTasks.length - run.requiredDoneCount} required task${run.requiredTasks.length - run.requiredDoneCount === 1 ? " is" : "s are"} not done. Missed tasks lose points and mean you won't pass.</p>
          <div class="btn-row"><button class="btn btn-danger" data-action="finish-yes" data-key="finish-yes">Finish anyway</button><button class="btn" data-action="finish-no" data-key="finish-no">Keep cleaning</button></div></div>`
      : `<button class="btn ${isCheck ? "btn-primary" : "btn-ghost"}" data-action="finish" data-key="finish">${isCheck ? "Finish mission" : "Finish early"}</button>`;
    panel = isCheck
      ? `<h2>Step 4: Final walk-through</h2>
         <p>Tap each area to check it meets the standard. Professionals never skip this.</p>
         <div class="count">${run.checked.size} of ${m.objects.length} areas checked</div>
         ${areaButtons(run, "Check", (id) => run.checked.has(id))}
         <details class="trolley"><summary>Trolley (for optional extras)</summary>${tray(s)}</details>
         ${finish}`
      : `<h2>Step 3: Clean</h2>
         <p>Pick a tool and a product, then tap the area to clean. Think: top to bottom, cleanest to dirtiest, floor last.</p>
         ${tray(s)}
         ${areaButtons(run, "Use on", () => false)}
         <div class="btn-row"><button class="btn btn-ghost" data-action="hint" data-key="hint">Hint</button>${finish}</div>
         ${checklist(run)}`;
  }

  const placeholder =
    run.phase === "inspect" ? "Tap an area of the bathroom to inspect it." : run.phase === "ppe" ? "Select your PPE on the right." : "Choose a tool and product, then tap an area.";
  return `<div class="play">
    ${playBar(m.title, stepper(run.phase))}
    <div class="play-grid">
      <section class="stage-col">
        <div class="scene-wrap ${run.phase === "ppe" ? "dim" : ""}">
          ${renderBathroom(run.flags, { markers: cleaningMarkers(s), interactive: run.phase === "ppe" ? [] : m.objects.map((o) => o.id), labels: Object.fromEntries(m.objects.map((o) => [o.id, o.name])) })}
          ${flashLayer(s.flash)}
        </div>
        ${feedbackBox(s.feedback, placeholder)}
      </section>
      <aside class="panel-col">${panel}</aside>
    </div>
  </div>`;
}

// ---------- Scenario ----------

function scenarioVisual(v: ScenarioVisual): string {
  if (v.type === "label") {
    const p = PRODUCTS[v.productId];
    const hazard = p.chemical === "acid" || p.chemical === "chlorine";
    return `<div class="label-card"><div class="label-head">${bottleIcon(p.color)}<div><strong>${esc(p.name)}</strong>${hazard ? `<span class="hazard"><span class="diamond" aria-hidden="true">!</span> Corrosive</span>` : ""}</div></div>
      <ul>${p.label.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`;
  }
  if (v.type === "bottles") {
    return `<div class="bottles">${v.items.map((b) => `<figure>${bottleIcon(b.color, { unlabelled: b.unlabelled, open: b.open })}<figcaption>${esc(b.unlabelled ? "No label" : b.name)}</figcaption></figure>`).join("")}</div>`;
  }
  const art: Record<typeof v.name, string> = {
    "frayed-cable": `<rect x="20" y="40" width="70" height="60" rx="14" fill="#9C8FD9"/><circle cx="40" cy="104" r="8" fill="#4A4A55"/><circle cx="76" cy="104" r="8" fill="#4A4A55"/>
      <path d="M90 70 C 130 60, 140 110, 180 96" stroke="#4A4A55" stroke-width="7" fill="none"/><path d="M180 96 l12 -6 M180 96 l14 2 M180 96 l10 9" stroke-width="3" stroke="#E6A93B"/><path d="M182 92 l10 -8" stroke="#D24B3E" stroke-width="3"/><path d="M192 96 C 210 90, 220 100, 236 92" stroke="#4A4A55" stroke-width="7" fill="none"/>`,
    "child-trolley": `<rect x="120" y="40" width="100" height="60" rx="6" fill="#4A4A55"/><rect x="128" y="20" width="18" height="24" rx="4" fill="#58B4E8"/><rect x="152" y="16" width="18" height="28" rx="4" fill="#E07A5F"/><circle cx="135" cy="108" r="8" fill="#2C2C35"/><circle cx="205" cy="108" r="8" fill="#2C2C35"/>
      <circle cx="70" cy="40" r="14" fill="#F2C9A0"/><rect x="58" y="54" width="24" height="40" rx="10" fill="#E6A93B"/><path d="M80 62 l26 -14" stroke="#F2C9A0" stroke-width="7" stroke-linecap="round"/>`,
    "eye-splash": `<path d="M40 70 Q 130 10, 220 70 Q 130 130, 40 70 Z" fill="#FFFFFF" stroke="#4A4A55" stroke-width="4"/><circle cx="130" cy="70" r="22" fill="#5E8C61"/><circle cx="130" cy="70" r="9" fill="#1E1E24"/><path d="M190 20 q 8 14 0 22 q -8 -8 0 -22" fill="#58B4E8"/>`,
    storage: `<rect x="70" y="10" width="120" height="110" rx="6" fill="#B7854F"/><path d="M130 10 V120" stroke="#8C6234" stroke-width="3"/><rect x="138" y="56" width="16" height="18" rx="3" fill="#E6A93B"/><path d="M141 56 v-6 a5 5 0 0 1 10 0 v6" stroke="#E6A93B" stroke-width="3" fill="none"/>`,
  };
  return `<svg viewBox="0 0 260 130" class="scenario-art" aria-hidden="true">${art[v.name]}</svg>`;
}

export function scenarioView(s: ScenarioSession): string {
  const { run } = s;
  const sc = run.current();
  const total = run.mission.scenarios.length;
  if (!sc) return "";
  const o = s.outcome;
  const dots = `<ol class="dots" aria-label="Situation ${run.index + 1} of ${total}">${run.mission.scenarios.map((x, i) => {
    const out = run.outcomes.find((r) => r.scenarioId === x.id);
    return `<li class="${out ? (out.correct ? "ok" : out.critical ? "crit" : "bad") : i === run.index ? "now" : ""}"></li>`;
  }).join("")}</ol>`;

  let answers = "";
  if (sc.type === "choice" || sc.type === "multi") {
    answers = `<div class="options ${sc.type}">${sc.options.map((opt) => {
      const d = o?.details.find((x) => x.id === opt.id);
      const picked = o ? d?.picked === true : sc.type === "multi" && s.multi.has(opt.id);
      const cls = o ? `${opt.correct ? "is-right" : picked ? (opt.critical ? "is-critical" : "is-wrong") : "is-muted"} ${picked ? "picked" : ""}` : picked ? "picked" : "";
      const action = sc.type === "choice" ? "choose" : "toggle";
      return `<button class="option ${cls}" data-action="${action}" data-id="${opt.id}" data-key="opt-${opt.id}" ${o ? "disabled" : ""} ${sc.type === "multi" ? `aria-pressed="${picked}"` : ""}>
        ${sc.type === "multi" ? `<span class="box" aria-hidden="true"></span>` : ""}<span class="opt-text">${esc(opt.text)}</span>
        ${o && (picked || opt.correct) ? `<span class="explain">${esc(opt.explain)}</span>` : ""}
      </button>`;
    }).join("")}</div>
    ${sc.type === "multi" && !o ? `<button class="btn btn-primary" data-action="submit-answer" data-key="submit-answer" ${s.multi.size ? "" : "disabled"}>Check my answer</button>` : ""}`;
  } else {
    answers = `<div class="match">${sc.rows.map((r) => {
      const d = o?.details.find((x) => x.id === r.id);
      const pick = o ? (d?.picked as string) : s.match[r.id];
      return `<div class="match-row ${o ? (d?.ok ? "is-right" : "is-wrong") : ""}">
        <strong>${esc(r.label)}</strong>
        <div class="seg" role="group" aria-label="Product for ${esc(r.label)}">${sc.choices.map((c) => `<button class="seg-btn ${pick === c.id ? "on" : ""} ${o && c.id === r.answer ? "answer" : ""}" aria-pressed="${pick === c.id}" data-action="match" data-id="${r.id}" data-choice="${c.id}" data-key="m-${r.id}-${c.id}" ${o ? "disabled" : ""}>${esc(c.label)}</button>`).join("")}</div>
        ${o ? `<span class="explain">${esc(r.explain)}</span>` : ""}
      </div>`;
    }).join("")}</div>
    ${!o ? `<button class="btn btn-primary" data-action="submit-answer" data-key="submit-answer" ${Object.keys(s.match).length === sc.rows.length ? "" : "disabled"}>Check my answers</button>` : ""}`;
  }

  return `<div class="play">
    ${playBar(run.mission.title, `<span class="small">Situation ${run.index + 1} of ${total}</span>`)}
    <div class="scenario">
      ${dots}
      <article class="scenario-card">
        <span class="eyebrow">${sc.type === "multi" ? "Select all that apply" : sc.type === "match" ? "Match each one" : "What do you do?"}</span>
        <h2 tabindex="-1">${esc(sc.title)}</h2>
        <p class="situation">${esc(sc.situation)}</p>
        <div class="visual">${scenarioVisual(sc.visual)}</div>
        ${answers}
        ${o ? `${feedbackBox(o.feedback, "")}<button class="btn btn-primary" data-action="next-scenario" data-key="next-scenario">${run.index + 1 < total ? "Next situation" : "See my results"}</button>` : ""}
      </article>
    </div>
  </div>`;
}

// ---------- Inspection ----------

export function inspectionView(s: InspectionSession): string {
  const { run } = s;
  const m = run.mission;
  const markers: Record<string, Marker> = {};
  for (const id of run.falseFlags) markers[id] = "false";
  for (const d of m.defects) if (run.found.has(d.id)) markers[d.objectId] = "found";
  const submit = s.confirmSubmit
    ? `<div class="confirm"><p>You've found ${run.foundCount} of ${m.defects.length} problems. Anything you miss counts against you, and a missed safety hazard means the inspection fails.</p>
        <div class="btn-row"><button class="btn btn-primary" data-action="submit-yes" data-key="submit-yes">Submit report</button><button class="btn" data-action="submit-no" data-key="submit-no">Keep inspecting</button></div></div>`
    : `<button class="btn btn-primary" data-action="submit" data-key="submit">Submit inspection report</button>`;
  return `<div class="play">
    ${playBar(m.title, `<span class="small">${run.foundCount} of ${m.defects.length} found</span>`)}
    <div class="play-grid">
      <section class="stage-col">
        <div class="scene-wrap">
          ${renderBathroom(new Set(m.sceneFlags), { markers, interactive: m.objects.map((o) => o.id), labels: Object.fromEntries(m.objects.map((o) => [o.id, o.name])) })}
          ${flashLayer(s.flash)}
        </div>
        ${feedbackBox(s.feedback, "Tap anything that isn't up to standard. Look closely: some problems are small.")}
      </section>
      <aside class="panel-col">
        <h2>Inspect like a supervisor</h2>
        <p>A colleague says this hotel bathroom is ready for the next guest. Work top to bottom and tap every problem you find. There are <strong>${m.defects.length}</strong> to find.</p>
        <div class="count">${run.foundCount} of ${m.defects.length} problems found</div>
        <div class="clipboard"><h3>Colleague's checklist</h3><ul>${m.colleagueChecklist.map((c) => `<li class="${c.ticked ? "done" : ""}"><span class="box" aria-hidden="true"></span>${esc(c.label)}<span class="sr-only">${c.ticked ? " (ticked)" : " (not ticked)"}</span></li>`).join("")}</ul>
          <p class="small">Ticks are not proof. Check the room itself.</p></div>
        ${run.foundCount ? `<div class="findings"><h3>Your report</h3><ul>${m.defects.filter((d) => run.found.has(d.id)).map((d) => `<li class="${d.safetyCritical ? "crit" : ""}">${esc(d.title)}</li>`).join("")}</ul></div>` : ""}
        <details class="areas"><summary>Area list (alternative to tapping the picture)</summary>
          <div class="area-grid">${m.objects.map((o) => `<button class="area-btn" data-action="tap" data-id="${o.id}" data-key="area-${o.id}">Flag ${esc(o.name.toLowerCase())}</button>`).join("")}</div></details>
        ${submit}
      </aside>
    </div>
  </div>`;
}
