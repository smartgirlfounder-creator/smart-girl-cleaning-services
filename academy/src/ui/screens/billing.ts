import { EXPERT_PASS, type Currency } from "../../billing/plans";
import { esc } from "../html";
import type { CloudState } from "../session";

/** Shown on an Expert mission's briefing when the player has no active Expert Pass. */
export function paywall(c: CloudState): string {
  const cur = c.currency;
  const price = EXPERT_PASS.labels[cur];
  const toggle = (["NGN", "USD"] as Currency[])
    .map((x) => `<button class="seg-btn ${cur === x ? "on" : ""}" aria-pressed="${cur === x}" data-action="currency" data-id="${x}" data-key="cur-${x}">${x === "NGN" ? "Naira (₦)" : "Dollars ($)"}</button>`)
    .join("");
  let action: string;
  if (c.status === "offline") action = `<p class="small">Connect to the internet to buy the Expert Pass.</p>`;
  else if (!c.account) action = `<button class="btn btn-primary" data-action="account" data-key="pay-signin">Sign in to get the Expert Pass</button>`;
  else action = `<button class="btn btn-primary" data-action="buy-pass" data-key="buy-pass" ${c.busy ? "disabled" : ""}>${c.busy ? "Opening Paystack…" : `Pay ${price} with Paystack`}</button>`;
  return `<div class="paywall">
    <span class="eyebrow">Expert level</span>
    <h2>Unlock with the <em>${esc(EXPERT_PASS.name)}</em></h2>
    <p class="price"><strong>${price}</strong><span>/ year</span></p>
    <ul class="ticks"><li>Every Expert mission, including new ones as they're added</li><li>Saved to your training record and certificates</li><li>Beginner and Professional levels stay free</li></ul>
    <div class="seg" role="group" aria-label="Currency">${toggle}</div>
    ${c.notice ? `<p class="notice-box tone-${c.notice.tone}">${esc(c.notice.text)}</p>` : ""}
    ${action}
    <p class="small">Secure payment by Paystack (card, bank transfer and USSD). Your pass lasts 12 months from payment.</p>
  </div>`;
}

export function passStatus(c: CloudState): string {
  const p = c.pass;
  if (!p) return "";
  if (p.active) return `<p class="notice-box tone-good">${esc(EXPERT_PASS.name)} active until ${esc(new Date(p.expiresAt!).toLocaleDateString())}.</p>`;
  if (p.expiresAt) return `<p class="notice-box tone-bad">Your ${esc(EXPERT_PASS.name)} ended on ${esc(new Date(p.expiresAt).toLocaleDateString())}. Renew it from any Expert mission.</p>`;
  return "";
}
