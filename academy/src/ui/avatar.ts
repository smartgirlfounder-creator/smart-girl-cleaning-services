import { PPE } from "../data/equipment";
import type { PpeId } from "../engine/types";
import { esc } from "./html";

// The player's cartoon cleaner and the PPE store they pick equipment from.

export type Gender = "female" | "male";

export interface Avatar {
  gender: Gender;
  skin: number;
  hair: string;
  uniform: string;
}

export const SKIN_TONES = ["#F3D3B5", "#E2AE82", "#C08457", "#8A5638", "#5B3622"];

export const UNIFORMS = [
  { id: "mustard", name: "Mustard", color: "#D4A12A" },
  { id: "maroon", name: "Maroon", color: "#7D2238" },
  { id: "violet", name: "Violet", color: "#4A3FA6" },
  { id: "teal", name: "Teal", color: "#1F7A74" },
  { id: "navy", name: "Navy", color: "#24365E" },
];

export const HAIRSTYLES: Record<Gender, { id: string; name: string }[]> = {
  female: [
    { id: "braids", name: "Braids" },
    { id: "puff", name: "Afro puff" },
    { id: "wrap", name: "Headwrap" },
    { id: "bun", name: "Bun" },
  ],
  male: [
    { id: "lowcut", name: "Low cut" },
    { id: "afro", name: "Afro" },
    { id: "twists", name: "Twists" },
    { id: "bald", name: "Bald" },
  ],
};

export function defaultAvatar(gender: Gender): Avatar {
  return { gender, skin: 3, hair: HAIRSTYLES[gender][0].id, uniform: "mustard" };
}

/** Returns a valid avatar from saved data, or null if none was chosen. */
export function cleanAvatar(raw: unknown): Avatar | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Partial<Avatar>;
  if (a.gender !== "female" && a.gender !== "male") return null;
  const d = defaultAvatar(a.gender);
  return {
    gender: a.gender,
    skin: Number.isInteger(a.skin) && a.skin! >= 0 && a.skin! < SKIN_TONES.length ? a.skin! : d.skin,
    hair: HAIRSTYLES[a.gender].some((h) => h.id === a.hair) ? a.hair! : d.hair,
    uniform: UNIFORMS.some((u) => u.id === a.uniform) ? a.uniform! : d.uniform,
  };
}

const HAIR = "#1E1A1A";
const INK = "#1E1E24";
const GLOVE = "#5B8DEF";

function uniformColor(a: Avatar): string {
  return UNIFORMS.find((u) => u.id === a.uniform)?.color ?? UNIFORMS[0].color;
}

/** Hair drawn behind the head (long braids, afro). */
function backHair(a: Avatar): string {
  if (a.hair === "braids")
    return [36, 42, 78, 84].map((x, i) => `<path d="M${x} 44 Q${x + (i < 2 ? -6 : 6)} 90 ${x + (i < 2 ? -4 : 4)} 128" stroke="${HAIR}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join("");
  if (a.hair === "afro") return `<ellipse cx="60" cy="34" rx="37" ry="29" fill="${HAIR}"/>`;
  if (a.hair === "puff") return `<circle cx="60" cy="14" r="15" fill="${HAIR}"/>`;
  if (a.hair === "bun") return `<circle cx="60" cy="19" r="11" fill="${HAIR}"/>`;
  return "";
}

/** Hair drawn over the top of the head. */
function frontHair(a: Avatar): string {
  const cap = `<path d="M33 50 Q33 21 60 21 Q87 21 87 50 Q80 34 60 32 Q40 34 33 50 Z" fill="${HAIR}"/>`;
  switch (a.hair) {
    case "braids":
      return cap + `<path d="M60 22 V31" stroke="#3A3333" stroke-width="1.5"/>`;
    case "puff":
    case "bun":
      return cap;
    case "wrap": {
      const wrap = a.uniform === "maroon" ? "#D4A12A" : "#8E2A43";
      const dots = a.uniform === "maroon" ? "#7D2238" : "#E6A93B";
      return `<path d="M31 50 Q29 13 60 12 Q91 13 89 50 Q84 35 60 33 Q36 35 31 50 Z" fill="${wrap}"/>
        <ellipse cx="51" cy="12" rx="12" ry="7" fill="${wrap}" transform="rotate(-18 51 12)"/><ellipse cx="69" cy="12" rx="12" ry="7" fill="${wrap}" transform="rotate(18 69 12)"/>
        ${[[44, 27], [56, 22], [68, 22], [78, 30], [38, 38], [82, 41]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${dots}"/>`).join("")}`;
    }
    case "lowcut":
      return `<path d="M34 46 Q35 22 60 22 Q85 22 86 46 Q80 31 60 30 Q40 31 34 46 Z" fill="${HAIR}"/>`;
    case "afro":
      return `<path d="M33 48 Q34 27 60 27 Q86 27 87 48 Q80 37 60 36 Q40 37 33 48 Z" fill="${HAIR}"/>`;
    case "twists":
      return `<path d="M34 46 Q35 23 60 23 Q85 23 86 46 Q80 32 60 31 Q40 32 34 46 Z" fill="${HAIR}"/>
        ${[[38, 34], [46, 25], [56, 21], [66, 21], [75, 25], [83, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${HAIR}"/>`).join("")}`;
    default:
      return `<path d="M46 30 Q52 26 58 27" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
}

/** One arm, drawn from the shoulder at (0, 0) so it can swing from there. `glove` is the glove layer's class, or null. */
function arm(side: 1 | -1, sleeve: string, skin: string, glove: string | null, cls = ""): string {
  const s = side;
  return `<g class="${cls}">
    <path d="M0 0 L${10 * s} 30" stroke="${sleeve}" stroke-width="14" stroke-linecap="round"/>
    <path d="M${10 * s} 30 L${12 * s} 60" stroke="${skin}" stroke-width="11" stroke-linecap="round"/>
    <circle cx="${12 * s}" cy="64" r="7.5" fill="${skin}"/>
    ${glove !== null ? `<g class="wear ${glove}"><path d="M${11 * s} 48 L${12 * s} 60" stroke="${GLOVE}" stroke-width="12.5" stroke-linecap="round"/><circle cx="${12 * s}" cy="64" r="8" fill="${GLOVE}"/></g>` : ""}
  </g>`;
}

export interface WearOptions {
  /** PPE worn now. */
  worn: Iterable<string>;
  /** A piece being put on (fades in) or taken off (fades out) in this render. */
  putting?: string | null;
  removing?: string | null;
}

/** The cleaner, 120 × 250, feet at the bottom. */
export function cleanerFigure(a: Avatar, opts: WearOptions = { worn: [] }): string {
  const skin = SKIN_TONES[a.skin] ?? SKIN_TONES[3];
  const uni = uniformColor(a);
  const worn = new Set(opts.worn);
  if (opts.removing) worn.add(opts.removing);
  const female = a.gender === "female";
  const piece = (id: string, svg: string) =>
    worn.has(id) ? `<g class="wear ${opts.putting === id ? "wear-in" : ""} ${opts.removing === id ? "wear-out" : ""}">${svg}</g>` : "";
  const glove = worn.has("gloves") ? (opts.putting === "gloves" ? "wear-in" : opts.removing === "gloves" ? "wear-out" : "") : null;
  const body = female
    ? `<path d="M37 92 Q60 84 83 92 L90 178 Q60 185 30 178 Z" fill="${uni}"/><path d="M52 90 Q60 100 68 90" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2.5" fill="none"/>`
    : `<path d="M35 92 Q60 84 85 92 L84 176 L36 176 Z" fill="${uni}"/><path d="M50 89 L60 104 L70 89" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="2.5" fill="none"/><path d="M60 104 V170" stroke="#000000" stroke-opacity="0.12" stroke-width="2"/>`;
  return `<g class="figure">
    <ellipse cx="60" cy="248" rx="44" ry="6" fill="#000000" opacity="0.18"/>
    ${backHair(a)}
    <rect x="41" y="172" width="17" height="70" rx="6" fill="#2E2B3A"/><rect x="62" y="172" width="17" height="70" rx="6" fill="#2E2B3A"/>
    <ellipse cx="48" cy="244" rx="12" ry="6" fill="${INK}"/><ellipse cx="72" cy="244" rx="12" ry="6" fill="${INK}"/>
    <rect x="53" y="74" width="14" height="20" rx="5" fill="${skin}"/>
    ${body}
    ${piece("apron", `<path d="M54 80 L46 98 M66 80 L74 98" stroke="#F4F1EA" stroke-width="3"/><path d="M45 98 H75 L80 182 H40 Z" fill="#F4F1EA"/><rect x="51" y="138" width="18" height="14" rx="3" fill="none" stroke="#CFC8BA" stroke-width="2"/>`)}
    ${piece("hi-vis", `<path d="M36 93 L53 92 L51 177 L35 177 Z M84 93 L67 92 L69 177 L85 177 Z" fill="#D4F23A"/><rect x="35" y="132" width="17" height="6" fill="#DADDE3"/><rect x="68" y="132" width="17" height="6" fill="#DADDE3"/><rect x="35" y="152" width="17" height="6" fill="#DADDE3"/><rect x="68" y="152" width="17" height="6" fill="#DADDE3"/>`)}
    <g transform="translate(37 97)">${arm(-1, uni, skin, glove)}</g>
    <g transform="translate(83 97)">${arm(1, uni, skin, glove, "arm-reach")}</g>
    <circle cx="34" cy="52" r="6" fill="${skin}"/><circle cx="86" cy="52" r="6" fill="${skin}"/>
    <circle cx="60" cy="50" r="26" fill="${skin}"/>
    ${female ? `<circle cx="34" cy="61" r="3" fill="#E6A93B"/><circle cx="86" cy="61" r="3" fill="#E6A93B"/>` : ""}
    <path d="M45 43 Q50 40 55 43 M65 43 Q70 40 75 43" stroke="${HAIR}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="51" r="3.2" fill="${INK}"/><circle cx="70" cy="51" r="3.2" fill="${INK}"/>
    ${female ? `<path d="M46 48 l-3 -2 M74 48 l3 -2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` : ""}
    <path d="M50 63 Q60 71 70 63" stroke="${female ? "#9E3B4E" : INK}" stroke-width="${female ? 3 : 2.5}" fill="none" stroke-linecap="round"/>
    ${frontHair(a)}
    ${piece("dust-mask", `<path d="M35 53 L45 58 M85 53 L75 58" stroke="#E4E0EA" stroke-width="2"/><path d="M44 57 Q60 52 76 57 L74 70 Q60 79 46 70 Z" fill="#FFFFFF" stroke="#C9C4D6" stroke-width="1.5"/><path d="M50 63 H70" stroke="#DCD8E4" stroke-width="1.5"/>`)}
    ${piece("eye-protection", `<path d="M34 49 H42 M78 49 H86" stroke="#2C2C35" stroke-width="2.5"/><rect x="41" y="43" width="17" height="13" rx="4.5" fill="#BFE3FF" fill-opacity="0.5" stroke="#2C2C35" stroke-width="2.2"/><rect x="62" y="43" width="17" height="13" rx="4.5" fill="#BFE3FF" fill-opacity="0.5" stroke="#2C2C35" stroke-width="2.2"/><path d="M58 48 H62" stroke="#2C2C35" stroke-width="2.2"/>`)}
  </g>`;
}

/** A small stand-alone portrait for buttons. */
export function cleanerPortrait(a: Avatar, label: string): string {
  return `<svg class="cleaner-portrait" viewBox="-6 0 132 256" role="img" aria-label="${esc(label)}">${cleanerFigure(a)}</svg>`;
}

// ---------- The PPE store ----------

const SHELF_TOP = 120;
const SHELF_MID = 210;
const SLOTS: [number, number][] = [[242, SHELF_TOP], [325, SHELF_TOP], [408, SHELF_TOP], [242, SHELF_MID], [325, SHELF_MID], [408, SHELF_MID]];
const FIGURE_X = 30;
const FIGURE_Y = 40;
const SHOULDER: [number, number] = [FIGURE_X + 83, FIGURE_Y + 97];
const ARM = 64;

function shelfItem(id: string): string {
  switch (id) {
    case "gloves":
      return `<path d="M-26 -2 v-18 q0 -6 5 -6 v-6 q0 -4 3.5 -4 t3.5 4 v4 q4 -2 6 2 v24 Z" fill="${GLOVE}"/><path d="M2 -2 v-18 q0 -6 5 -6 v-6 q0 -4 3.5 -4 t3.5 4 v4 q4 -2 6 2 v24 Z" fill="#4C7CDB"/>`;
    case "eye-protection":
      return `<rect x="-24" y="-24" width="21" height="16" rx="5" fill="#BFE3FF" fill-opacity="0.6" stroke="#2C2C35" stroke-width="2.4"/><rect x="3" y="-24" width="21" height="16" rx="5" fill="#BFE3FF" fill-opacity="0.6" stroke="#2C2C35" stroke-width="2.4"/><path d="M-3 -17 H3 M-24 -17 L-30 -6 M24 -17 L30 -6" stroke="#2C2C35" stroke-width="2.4"/>`;
    case "apron":
      return `<path d="M-14 -40 H14 L22 -2 H-22 Z" fill="#F4F1EA" stroke="#CFC8BA" stroke-width="1.5"/><path d="M-14 -40 Q0 -54 14 -40" stroke="#F4F1EA" stroke-width="3" fill="none"/><rect x="-8" y="-22" width="16" height="11" rx="2" fill="none" stroke="#CFC8BA" stroke-width="1.5"/>`;
    case "dust-mask":
      return `<path d="M-20 -26 Q0 -34 20 -26 L17 -10 Q0 0 -17 -10 Z" fill="#FFFFFF" stroke="#C9C4D6" stroke-width="1.5"/><path d="M-20 -24 L-30 -30 M20 -24 L30 -30" stroke="#E4E0EA" stroke-width="2"/>`;
    case "hi-vis":
      return `<path d="M-24 -38 L-8 -38 L0 -28 L8 -38 L24 -38 L24 -2 L-24 -2 Z" fill="#D4F23A"/><rect x="-24" y="-22" width="48" height="5" fill="#DADDE3"/><rect x="-24" y="-12" width="48" height="5" fill="#DADDE3"/>`;
    default:
      return `<rect x="-20" y="-34" width="40" height="32" rx="4" fill="#D9D3C4"/>`;
  }
}

function shelfLabel(name: string): string {
  const words = name.split(" ");
  const lines = name.length > 11 && words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [name];
  const h = lines.length === 2 ? 26 : 16;
  return `<rect x="-39" y="3" width="78" height="${h}" rx="3" fill="#FFFDF7" stroke="#8C6234" stroke-width="1"/>
    ${lines.map((l, i) => `<text x="0" y="${lines.length === 2 ? 14 + i * 10.5 : 15}" text-anchor="middle" font-size="10" font-weight="700" fill="#2C2560">${esc(l)}</text>`).join("")}`;
}

/** Where the cleaner walks to and how far they lift their arm to reach a slot. */
function reach(slot: [number, number]): { dx: number; angle: number } {
  const [x, y] = slot;
  const dy = y - 22 - SHOULDER[1];
  const angle = -Math.acos(Math.max(-1, Math.min(1, dy / ARM))) * (180 / Math.PI);
  const handX = ARM * Math.sin((-angle * Math.PI) / 180);
  return { dx: Math.round(x - 30 - SHOULDER[0] - handX), angle: Math.round(angle) };
}

export interface StoreOptions {
  offered: PpeId[];
  /** PPE the cleaner is wearing. */
  worn: Set<string>;
  /** The item picked or put back in this render, which plays the walk animation. */
  anim: { id: string; kind: "take" | "return" } | null;
  interactive: boolean;
}

export function ppeStore(a: Avatar | null, o: StoreOptions): string {
  const slotOf = new Map<string, [number, number]>(o.offered.map((id, i) => [id, SLOTS[i]]));
  const move = o.anim && slotOf.has(o.anim.id) ? reach(slotOf.get(o.anim.id)!) : null;
  const items = o.offered.map((id) => {
    const [x, y] = slotOf.get(id)!;
    const name = PPE[id].name;
    const taken = o.worn.has(id);
    const animating = o.anim?.id === id;
    const cls = animating ? (o.anim!.kind === "take" ? "shelf-out" : "shelf-in") : "";
    const showItem = !taken || (animating && o.anim!.kind === "take");
    const attrs = o.interactive
      ? `class="store-item ${taken ? "taken" : ""}" data-action="ppe" data-id="${id}" data-key="store-${id}" role="button" tabindex="0" aria-pressed="${taken}" aria-label="${esc(`${name}${taken ? " (wearing, tap to put back)" : ""}`)}"`
      : `class="store-item"`;
    return `<g transform="translate(${x} ${y})" ${attrs}>
      <rect x="-38" y="-58" width="76" height="86" fill="transparent"/>
      ${taken && !animating ? `<rect x="-26" y="-40" width="52" height="38" rx="6" fill="none" stroke="#8C6234" stroke-width="1.5" stroke-dasharray="4 3"/>` : ""}
      ${showItem ? `<g class="${cls}">${shelfItem(id)}</g>` : ""}
      ${shelfLabel(name)}
    </g>`;
  }).join("");

  const figure = a
    ? `<g transform="translate(${FIGURE_X} ${FIGURE_Y})"><g class="cleaner ${move ? "walk" : ""}" style="${move ? `--dx:${move.dx}px;--ang:${move.angle}deg` : ""}">
        ${cleanerFigure(a, { worn: o.worn, putting: o.anim?.kind === "take" ? o.anim.id : null, removing: o.anim?.kind === "return" ? o.anim.id : null })}
      </g></g>`
    : "";

  return `<svg class="scene ppe-store" viewBox="0 0 460 300" role="img" aria-label="PPE store: a cupboard with labelled protective equipment${a ? ", and your cleaner" : ""}">
    <rect width="460" height="300" fill="#E9E4DC"/>
    <rect y="262" width="460" height="38" fill="#B9B2A6"/>
    <path d="M0 262 H460" stroke="#9C958B" stroke-width="2"/>
    <rect x="190" y="18" width="262" height="262" rx="6" fill="#B7854F"/>
    <rect x="200" y="44" width="242" height="226" fill="#E9DCC4"/>
    <rect x="262" y="24" width="118" height="16" rx="3" fill="#2C2560"/>
    <text x="321" y="35.5" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.5" fill="#FFFFFF">PPE STORE</text>
    <rect x="200" y="${SHELF_TOP}" width="242" height="30" fill="#A87843"/>
    <rect x="200" y="${SHELF_MID}" width="242" height="30" fill="#A87843"/>
    <rect x="216" y="250" width="16" height="20" rx="3" fill="#58B4E8"/><rect x="238" y="246" width="16" height="24" rx="3" fill="#E07A5F"/><rect x="400" y="248" width="26" height="22" rx="3" fill="#C8B8F2"/>
    ${items}
    ${figure}
  </svg>`;
}

// ---------- Choosing a cleaner ----------

export function avatarPicker(draft: Avatar | null): string {
  const card = (g: Gender, label: string) => {
    const look = draft?.gender === g ? draft : defaultAvatar(g);
    const on = draft?.gender === g;
    return `<button class="who ${on ? "on" : ""}" aria-pressed="${on}" data-action="avatar-gender" data-id="${g}" data-key="who-${g}">${cleanerPortrait(look, `${label} cleaner`)}<strong>${label}</strong></button>`;
  };
  const extras = draft
    ? `<h3 class="pick-h">Make it yours <span class="small">(optional)</span></h3>
      <p class="small pick-label">Skin tone</p>
      <div class="swatches">${SKIN_TONES.map((c, i) => `<button class="swatch ${draft.skin === i ? "on" : ""}" aria-pressed="${draft.skin === i}" aria-label="Skin tone ${i + 1}" style="background:${c}" data-action="avatar-skin" data-id="${i}" data-key="skin-${i}"></button>`).join("")}</div>
      <p class="small pick-label">Hairstyle</p>
      <div class="chips">${HAIRSTYLES[draft.gender].map((h) => `<button class="chip ${draft.hair === h.id ? "on" : ""}" aria-pressed="${draft.hair === h.id}" data-action="avatar-hair" data-id="${h.id}" data-key="hair-${h.id}">${esc(h.name)}</button>`).join("")}</div>
      <p class="small pick-label">Uniform colour</p>
      <div class="swatches">${UNIFORMS.map((u) => `<button class="swatch ${draft.uniform === u.id ? "on" : ""}" aria-pressed="${draft.uniform === u.id}" aria-label="${esc(u.name)} uniform" title="${esc(u.name)}" style="background:${u.color}" data-action="avatar-uniform" data-id="${u.id}" data-key="uni-${u.id}"></button>`).join("")}</div>`
    : "";
  return `<h2>Step 2: Choose your cleaner</h2>
    <p>Who's cleaning today? Your cleaner will pick their PPE from the store and wear it.</p>
    <div class="who-grid">${card("female", "Female")}${card("male", "Male")}</div>
    ${extras}
    <button class="btn btn-primary" data-action="avatar-done" data-key="avatar-done" ${draft ? "" : "disabled"}>Go to the PPE store</button>`;
}
