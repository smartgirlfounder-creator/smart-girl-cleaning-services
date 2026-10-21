import type { ToolIcon } from "../engine/types";

export function toolIcon(icon: ToolIcon, color: string): string {
  const s = (body: string) => `<svg viewBox="0 0 40 40" class="ico" aria-hidden="true">${body}</svg>`;
  switch (icon) {
    case "cloth":
      return s(`<path d="M6 12 Q20 4 34 12 L32 32 Q20 26 8 32 Z" fill="${color}"/><path d="M10 16 Q20 11 30 16 M10 22 Q20 17 30 22" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="2" fill="none"/>`);
    case "brush":
      return s(`<rect x="18" y="3" width="4" height="22" rx="2" fill="#C9C2B3"/><ellipse cx="20" cy="30" rx="10" ry="7" fill="${color}"/><path d="M12 32 l-2 4 M16 34 l-1 4 M20 35 v4 M24 34 l1 4 M28 32 l2 4" stroke="${color}" stroke-width="2"/>`);
    case "sponge":
      return s(`<rect x="6" y="12" width="28" height="18" rx="5" fill="${color}"/><rect x="6" y="12" width="28" height="6" rx="3" fill="#3E7D4F"/>`);
    case "mop":
      return s(`<rect x="19" y="2" width="3" height="26" fill="#C9C2B3" transform="rotate(12 20 15)"/><rect x="6" y="28" width="26" height="8" rx="3" fill="${color}"/>`);
    case "liner":
      return s(`<path d="M10 10 H30 L27 36 H13 Z" fill="${color}"/><path d="M15 10 q5 -7 10 0" stroke="${color}" stroke-width="3" fill="none"/>`);
    case "sign":
      return s(`<path d="M8 36 L17 4 H23 L32 36 Z" fill="${color}" stroke="#B88E10" stroke-width="2"/><path d="M20 12 l-5 12 h10 z" fill="none" stroke="#1E1E24" stroke-width="2"/>`);
    case "refill":
      return s(`<circle cx="15" cy="24" r="9" fill="#FFFFFF" stroke="#D5DADF" stroke-width="2"/><circle cx="15" cy="24" r="3" fill="#D5DADF"/><rect x="26" y="10" width="10" height="24" rx="3" fill="${color}"/><rect x="28" y="5" width="6" height="6" fill="${color}"/>`);
    case "hand":
      return s(`<path d="M12 36 V18 q0-3 3-3 t3 3 V10 q0-3 3-3 t3 3 v8 q0-3 3-3 t3 3 v10 q0 8-8 8 Z" fill="#8FD3B6" stroke="#4F9C7D" stroke-width="2"/>`);
  }
}

export function bottleIcon(color: string, opts: { unlabelled?: boolean; open?: boolean; label?: string } = {}): string {
  return `<svg viewBox="0 0 40 52" class="ico bottle" aria-hidden="true">
    <rect x="15" y="2" width="10" height="8" rx="2" fill="${opts.open ? "none" : "#4A4A55"}" stroke="#4A4A55" stroke-width="${opts.open ? 1.5 : 0}" stroke-dasharray="${opts.open ? "2 2" : ""}"/>
    <path d="M13 10 H27 V16 Q34 20 34 28 V46 Q34 50 30 50 H10 Q6 50 6 46 V28 Q6 20 13 16 Z" fill="${color}" stroke="rgba(0,0,0,.18)"/>
    ${opts.unlabelled ? `<text x="20" y="38" text-anchor="middle" font-size="16" font-weight="700" fill="#4A4A55">?</text>` : `<rect x="10" y="28" width="20" height="14" rx="2" fill="#FFFFFF" opacity=".85"/>`}
  </svg>`;
}

export function crest(size = 64): string {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="crest" aria-hidden="true">
    <path d="M32 3 L57 12 V30 C57 46 46 56 32 61 C18 56 7 46 7 30 V12 Z" fill="#2C2560" stroke="#E6A93B" stroke-width="3"/>
    <path d="M32 15 l3.2 8.6 9 .4 -7 5.6 2.4 8.8 -7.6 -5 -7.6 5 2.4 -8.8 -7 -5.6 9 -.4 z" fill="#E6A93B"/>
    <path d="M18 44 q14 8 28 0" stroke="#C8B8F2" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export function stars(n: number, max = 3): string {
  return `<span class="stars" aria-label="${n} of ${max} stars">${Array.from({ length: max }, (_, i) =>
    `<svg viewBox="0 0 24 24" class="star ${i < n ? "on" : ""}" aria-hidden="true"><path d="M12 2 l3 6.6 7.2.8 -5.4 4.9 1.5 7.1 -6.3 -3.6 -6.3 3.6 1.5 -7.1 -5.4 -4.9 7.2 -.8 z"/></svg>`).join("")}</span>`;
}

export function badgeIcon(earned: boolean): string {
  return `<svg viewBox="0 0 48 48" class="badge-ico ${earned ? "earned" : ""}" aria-hidden="true">
    <circle cx="24" cy="20" r="16"/><path d="M14 32 l-4 14 8 -4 6 6 2 -12 M34 32 l4 14 -8 -4 -6 6 -2 -12" class="ribbon"/>
    <path d="M24 10 l2.6 6 6.4.5 -4.9 4.2 1.5 6.3 -5.6 -3.4 -5.6 3.4 1.5 -6.3 -4.9 -4.2 6.4 -.5 z" class="badge-star"/>
  </svg>`;
}

export function lockIcon(): string {
  return `<svg viewBox="0 0 24 24" class="lock" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V8 a4 4 0 0 1 8 0 v3" fill="none" stroke-width="2"/></svg>`;
}
