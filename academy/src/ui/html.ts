import type { Feedback, LevelId } from "../engine/types";
import { LEVELS } from "../data/levels";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(s: string | number): string {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

export function levelName(id: LevelId): string {
  return LEVELS.find((l) => l.id === id)?.name ?? id;
}

export function feedbackBox(f: Feedback | null, placeholder: string): string {
  if (!f) return `<div class="feedback tone-idle" aria-live="polite"><p>${esc(placeholder)}</p></div>`;
  const label: Record<Feedback["tone"], string> = { good: "Well done", info: "Note", warn: "Careful", bad: "Mistake", critical: "Safety-critical" };
  return `<div class="feedback tone-${f.tone}" aria-live="polite">
    <span class="fb-tag">${label[f.tone]}</span>
    <strong>${esc(f.title)}</strong>
    <p>${esc(f.body)}</p>
  </div>`;
}

export function backButton(action = "home", text = "Menu"): string {
  return `<button class="btn-back" data-action="${action}" data-key="back-${action}"><span aria-hidden="true">‹</span> ${esc(text)}</button>`;
}

export function pageHeader(title: string, sub?: string, back = backButton()): string {
  return `<header class="page-head">${back}<div><h1>${title}</h1>${sub ? `<p class="lede">${esc(sub)}</p>` : ""}</div></header>`;
}
