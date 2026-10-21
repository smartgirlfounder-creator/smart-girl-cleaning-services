// Bathroom scene, drawn as SVG. The look is driven entirely by scene flags:
// a missing "clean" flag shows dirt, extra flags add defects for inspections.

export type Marker = "todo" | "done" | "found" | "false" | "hint" | null;

export interface SceneOptions {
  markers?: Record<string, Marker>;
  /** Objects the player can tap. Others are drawn but inert. */
  interactive?: string[];
  labels?: Record<string, string>;
}

export const VIEW = { w: 800, h: 560 };

/** Where badges, sparkles and markers sit for each object (viewBox units). */
export const ANCHORS: Record<string, { x: number; y: number }> = {
  vent: { x: 318, y: 40 },
  shelf: { x: 625, y: 140 },
  mirror: { x: 400, y: 128 },
  sink: { x: 400, y: 300 },
  shower: { x: 728, y: 200 },
  touch: { x: 182, y: 222 },
  toilet: { x: 590, y: 336 },
  bottle: { x: 621, y: 180 },
  supplies: { x: 498, y: 232 },
  bin: { x: 262, y: 344 },
  floor: { x: 600, y: 468 },
};

const has = (f: Set<string>, k: string) => f.has(k);

function hit(id: string, shape: string, o: SceneOptions): string {
  const live = o.interactive?.includes(id);
  const label = o.labels?.[id] ?? id;
  return live
    ? `<g class="hit" data-obj="${id}" role="button" tabindex="0" aria-label="${label}">${shape}</g>`
    : "";
}

function marker(id: string, kind: Marker): string {
  if (!kind) return "";
  const a = ANCHORS[id];
  if (!a) return "";
  const inner: Record<Exclude<Marker, null>, string> = {
    todo: `<circle r="11" class="mk-todo"/><text y="5" text-anchor="middle" class="mk-q">?</text>`,
    done: `<circle r="11" class="mk-done"/><path d="M-5 0 l3.5 4 l7 -8" class="mk-tick"/>`,
    found: `<circle r="15" class="mk-found"/><text y="6" text-anchor="middle" class="mk-bang">!</text>`,
    false: `<circle r="11" class="mk-false"/><path d="M-4 -4 l8 8 M4 -4 l-8 8" class="mk-x"/>`,
    hint: `<circle r="18" class="mk-hint"/>`,
  };
  return `<g class="mk" transform="translate(${a.x} ${a.y})" pointer-events="none">${inner[kind]}</g>`;
}

function dots(points: [number, number, number][], fill: string, opacity = 1): string {
  return points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`).join("");
}

export function renderBathroom(flags: Set<string>, o: SceneOptions = {}): string {
  const hotel = has(flags, "hotel");
  const wall = hotel ? "#E9E4DC" : "#D7EAE3";
  const wallLine = hotel ? "#D3CCC0" : "#BCD8CD";
  const floorA = hotel ? "#9C958B" : "#B9BDC4";
  const floorB = hotel ? "#8E877D" : "#A9AEB6";
  const m = o.markers ?? {};

  const vent = has(flags, "vent");
  const fan = `
    <g transform="translate(372 64)">
      <circle r="27" fill="#F4F6F7" stroke="#9AA4AD" stroke-width="3"/>
      <g class="${vent ? "fan-on" : ""}">
        ${[0, 90, 180, 270].map((d) => `<path d="M0 0 C 6 -6, 6 -18, 0 -21 C -6 -18, -6 -6, 0 0" fill="#AEB8C1" transform="rotate(${d})"/>`).join("")}
      </g>
      <circle r="4" fill="#7D8790"/>
      ${vent ? `<circle cx="20" cy="-20" r="5" fill="#6BCB8B"/>` : `<circle cx="20" cy="-20" r="5" fill="#B0B6BC"/>`}
    </g>`;
  const windowPane = vent
    ? `<rect x="236" y="34" width="88" height="80" rx="4" fill="#BFE3F5"/><path d="M236 34 L300 22 L300 104 L236 114 Z" fill="#E6F4FB" stroke="#A9B4BC" stroke-width="3" opacity="0.95"/>
       ${[0, 1, 2].map((i) => `<path d="M${330 + i * 6} ${50 + i * 18} q 14 -6 26 0" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.8" class="breeze"/>`).join("")}`
    : `<rect x="236" y="34" width="88" height="80" rx="4" fill="#DDE7EC" stroke="#A9B4BC" stroke-width="3"/><path d="M280 34 V114" stroke="#A9B4BC" stroke-width="3"/>`;

  const mirrorDirty = !has(flags, "mirror");
  const mirror = `
    <rect x="326" y="116" width="148" height="140" rx="16" fill="${hotel ? "#B08A57" : "#E6A93B"}"/>
    <rect x="334" y="124" width="132" height="124" rx="10" fill="#CFE4EF"/>
    <path d="M346 236 L420 136 L446 136 L372 236 Z" fill="#FFFFFF" opacity="0.45"/>
    ${mirrorDirty ? `${dots([[360, 150, 3], [372, 158, 2], [430, 170, 3], [445, 160, 2], [395, 205, 3], [410, 215, 2], [440, 222, 3], [352, 190, 2]], "#F6FFFD")}
      <ellipse cx="380" cy="196" rx="14" ry="10" fill="#9EB0BA" opacity="0.45"/><ellipse cx="438" cy="196" rx="11" ry="8" fill="#9EB0BA" opacity="0.4"/>` : ""}
    ${has(flags, "mirror-streaks") ? `<path d="M340 150 q 50 20 120 -6 M342 182 q 60 22 118 -4 M346 214 q 50 18 112 -2" stroke="#8FA4B0" stroke-width="5" fill="none" opacity="0.45" stroke-linecap="round"/>` : ""}`;

  const sinkDirty = !has(flags, "sink");
  const sink = `
    <rect x="384" y="330" width="32" height="92" rx="8" fill="#F4F6F7" stroke="#C9D0D6" stroke-width="2"/>
    <path d="M322 286 H478 V300 Q478 336 400 338 Q322 336 322 300 Z" fill="#FBFCFC" stroke="#C9D0D6" stroke-width="2"/>
    <ellipse cx="400" cy="300" rx="62" ry="14" fill="#E8EEF1"/>
    <circle cx="400" cy="304" r="4" fill="#8B959E"/>
    <rect x="394" y="266" width="12" height="22" rx="3" fill="#C0C8CE"/><path d="M400 268 h22 v8" stroke="#C0C8CE" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="368" y="276" width="10" height="10" rx="3" fill="#C0C8CE"/><rect x="422" y="276" width="10" height="10" rx="3" fill="#C0C8CE"/>
    ${sinkDirty ? `${dots([[372, 298, 4], [380, 303, 3], [430, 296, 4]], "#9ED9C9")}<path d="M386 306 q 8 -4 14 2 M410 300 q 6 6 12 2" stroke="#3B3030" stroke-width="1.5" fill="none"/>
      ${dots([[371, 279, 2], [426, 279, 2], [418, 272, 2]], "#FFFFFF")}<ellipse cx="350" cy="292" rx="12" ry="4" fill="#D6D2C4" opacity="0.8"/>` : ""}
    ${has(flags, "tap-residue") ? dots([[371, 280, 2.5], [425, 281, 2.5], [404, 270, 2], [416, 272, 2], [398, 284, 2]], "#FFFFFF") : ""}
    ${has(flags, "sink-hair") ? `<path d="M393 303 q 4 -6 8 0 q 4 6 8 -1" stroke="#2A2222" stroke-width="1.6" fill="none"/>` : ""}`;

  const showerDirty = !has(flags, "shower");
  const shower = `
    <rect x="664" y="16" width="128" height="400" fill="${hotel ? "#DCD5CA" : "#C6E0D6"}"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M664 ${56 + i * 36} H792" stroke="${wallLine}" stroke-width="2"/>`).join("")}
    <path d="M728 16 V416" stroke="${wallLine}" stroke-width="2"/>
    <path d="M760 40 v26 h-18" stroke="#AEB8C1" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="736" cy="70" rx="14" ry="6" fill="#AEB8C1"/>
    <rect x="664" y="402" width="128" height="18" rx="3" fill="#F2F4F5" stroke="#C9D0D6" stroke-width="2"/>
    <rect x="668" y="20" width="10" height="384" fill="#E6F2F8" opacity="0.7"/>
    ${showerDirty ? `<path d="M690 300 q 30 -14 60 6 q 18 12 34 0 M690 350 q 40 -12 92 4 M700 240 q 20 -10 46 2" stroke="#F3EEDC" stroke-width="10" fill="none" opacity="0.85" stroke-linecap="round"/>
      <ellipse cx="728" cy="410" rx="44" ry="5" fill="#D9CFAE" opacity="0.9"/>` : ""}`;

  const touchDirty = !has(flags, "touch");
  const door = `
    <rect x="24" y="104" width="128" height="318" rx="4" fill="#B7854F" stroke="#8C6234" stroke-width="3"/>
    <rect x="42" y="124" width="92" height="120" rx="4" fill="none" stroke="#9E7040" stroke-width="3"/>
    <rect x="42" y="266" width="92" height="136" rx="4" fill="none" stroke="#9E7040" stroke-width="3"/>
    <rect x="124" y="252" width="22" height="8" rx="4" fill="#D9DDE0"/><circle cx="128" cy="256" r="7" fill="#C7CDD2"/>
    <rect x="170" y="206" width="26" height="34" rx="4" fill="#F7F8F8" stroke="#C9D0D6" stroke-width="2"/><rect x="179" y="214" width="8" height="16" rx="2" fill="#DDE2E6"/>
    ${touchDirty ? `<ellipse cx="135" cy="257" rx="7" ry="5" fill="#6B6255" opacity="0.4"/><ellipse cx="184" cy="226" rx="8" ry="6" fill="#6B6255" opacity="0.35"/>` : ""}
    ${has(flags, "switch-smudge") ? `<ellipse cx="185" cy="225" rx="7" ry="5" fill="#6B6255" opacity="0.32"/><ellipse cx="176" cy="234" rx="4" ry="3" fill="#6B6255" opacity="0.3"/>` : ""}`;

  const bowlClean = has(flags, "bowl");
  const toiletDirty = !has(flags, "toiletclean");
  const toilet = `
    <rect x="540" y="232" width="100" height="70" rx="8" fill="#FBFCFC" stroke="#C9D0D6" stroke-width="2"/>
    <rect x="534" y="226" width="112" height="12" rx="5" fill="#F1F4F5" stroke="#C9D0D6" stroke-width="2"/>
    <rect x="550" y="246" width="16" height="6" rx="3" fill="#C0C8CE"/>
    <path d="M556 380 Q560 422 570 422 H610 Q620 422 624 380 Z" fill="#F4F6F7" stroke="#C9D0D6" stroke-width="2"/>
    <path d="M528 304 H652 Q652 380 590 384 Q528 380 528 304 Z" fill="#FBFCFC" stroke="#C9D0D6" stroke-width="2"/>
    <ellipse cx="590" cy="306" rx="62" ry="12" fill="#F1F4F5" stroke="#C9D0D6" stroke-width="2"/>
    <ellipse cx="590" cy="308" rx="44" ry="7" fill="#DCE6EA"/>
    ${!bowlClean ? `<ellipse cx="590" cy="310" rx="38" ry="5" fill="none" stroke="#B08F58" stroke-width="3" opacity="0.85"/>` : ""}
    ${has(flags, "gel") && !bowlClean ? `<path d="M556 306 q 4 6 2 10 M572 304 q 3 7 1 11 M606 304 q 3 7 1 11 M622 306 q 3 6 1 10" stroke="#3F7FBF" stroke-width="4" fill="none" stroke-linecap="round"/>` : ""}
    ${toiletDirty ? `${dots([[548, 316, 3], [636, 318, 3], [560, 352, 3], [622, 360, 2.5]], "#B79D6A", 0.8)}<ellipse cx="558" cy="249" rx="7" ry="4" fill="#6B6255" opacity="0.4"/>` : ""}`;

  const bottle = has(flags, "bottle-left")
    ? `<g transform="translate(610 182)"><rect x="0" y="12" width="22" height="34" rx="5" fill="#E07A5F"/><rect x="5" y="2" width="12" height="12" rx="2" fill="#F6F1E7"/><path d="M17 4 h10" stroke="#F6F1E7" stroke-width="3"/>
       <rect x="22" y="36" width="14" height="10" rx="3" fill="#F6F1E7" transform="rotate(25 29 41)"/><rect x="3" y="20" width="16" height="12" rx="2" fill="#F6F1E7" opacity="0.85"/></g>`
    : "";

  const shelf = has(flags, "shelf")
    ? `<rect x="560" y="150" width="130" height="10" rx="3" fill="#B7854F"/>
       <rect x="572" y="124" width="40" height="26" rx="4" fill="#F6F1E7" stroke="#D8D0C2" stroke-width="2"/><rect x="574" y="132" width="36" height="3" fill="#D8D0C2"/>
       <rect x="640" y="130" width="18" height="20" rx="4" fill="#5E8C61"/><path d="M649 130 q -10 -16 -2 -24 q 4 10 2 24 q 6 -14 14 -16 q -4 12 -14 16" fill="#7BB07E"/>
       ${has(flags, "shelf-dust") ? `<rect x="560" y="146" width="130" height="5" rx="2" fill="#9A9488" opacity="0.6"/>${dots([[600, 147, 2], [620, 146, 1.6], [666, 147, 2], [676, 146, 1.5], [628, 148, 1.5], [586, 122, 1.5], [598, 123, 1.5]], "#8F897D", 0.9)}` : ""}`
    : "";

  const stocked = has(flags, "stock");
  const supplies = `
    <rect x="484" y="196" width="28" height="44" rx="6" fill="#F7F8F8" stroke="#C9D0D6" stroke-width="2"/>
    <rect x="490" y="${stocked ? 204 : 226}" width="16" height="${stocked ? 26 : 4}" rx="2" fill="#A78BFA" opacity="0.7"/>
    <rect x="494" y="240" width="8" height="6" rx="2" fill="#C0C8CE"/>
    <path d="M482 262 h32" stroke="#C0C8CE" stroke-width="4" stroke-linecap="round"/>
    <circle cx="498" cy="${stocked ? 276 : 268}" r="${stocked ? 14 : 7}" fill="#FFFFFF" stroke="#D5DADF" stroke-width="2"/>
    <circle cx="498" cy="${stocked ? 276 : 268}" r="4" fill="#D5DADF"/>
    ${stocked ? `<path d="M485 276 v14" stroke="#FFFFFF" stroke-width="10"/>` : `<path d="M494 272 l-2 10 h6 z" fill="#FFFFFF" stroke="#D5DADF"/>`}`;

  const binFull = !has(flags, "bin");
  const bin = `
    <path d="M236 356 H290 L284 422 H242 Z" fill="#7D8790"/>
    <rect x="232" y="350" width="62" height="10" rx="3" fill="#636C74"/>
    ${binFull ? `<circle cx="248" cy="346" r="10" fill="#FFFFFF"/><circle cx="268" cy="340" r="12" fill="#F2F0EA"/><circle cx="284" cy="348" r="8" fill="#FFFFFF"/><rect x="254" y="332" width="20" height="10" rx="2" fill="#E07A5F" transform="rotate(-15 264 337)"/><circle cx="300" cy="418" r="6" fill="#FFFFFF"/>` : `<path d="M234 352 q 30 -10 58 0" stroke="#3E3E46" stroke-width="3" fill="none"/>`}`;

  const floorClean = has(flags, "floor");
  const floorMarks = floorClean
    ? `<path d="M80 470 l90 -14 M380 520 l110 -16 M560 470 l80 -10" stroke="#FFFFFF" stroke-width="5" opacity="0.35" stroke-linecap="round"/>`
    : `${[[300, 470], [336, 492], [372, 470], [408, 494], [444, 472]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="17" fill="#7A6146" opacity="0.4" transform="rotate(${i % 2 ? 20 : -10} ${x} ${y})"/>`).join("")}
       <path d="M160 520 q 10 -8 22 0 q 8 6 16 -2 M520 500 q 8 6 18 0 M620 460 q 6 -6 14 0" stroke="#2A2222" stroke-width="1.6" fill="none"/>
       ${dots([[470, 440, 6], [486, 452, 4], [210, 470, 5], [720, 450, 6], [700, 470, 4]], "#9FC3D6", 0.75)}`;
  const debris = has(flags, "floor-debris")
    ? `<path d="M632 432 q 6 -6 12 0 q 6 6 12 -1 M640 440 q 5 4 12 0" stroke="#2A2222" stroke-width="1.6" fill="none"/>${dots([[650, 446, 2.5], [662, 438, 2], [644, 448, 1.8]], "#6B5B45")}`
    : "";
  const sign = has(flags, "sign")
    ? `<g transform="translate(150 446)"><path d="M0 70 L22 0 H40 L62 70 Z" fill="#F2C230" stroke="#B88E10" stroke-width="3"/><path d="M31 18 l-12 30 h24 z" fill="none" stroke="#1E1E24" stroke-width="3"/><text x="31" y="62" font-size="9" text-anchor="middle" font-weight="700" fill="#1E1E24">WET</text></g>`
    : "";

  const hits = [
    hit("floor", `<path d="M0 420 H800 V560 H0 Z" fill="transparent"/>`, o),
    hit("vent", `<rect x="226" y="20" width="182" height="108" rx="10" fill="transparent"/>`, o),
    hit("touch", `<rect x="112" y="200" width="92" height="70" rx="10" fill="transparent"/>`, o),
    hit("mirror", `<rect x="322" y="112" width="156" height="148" rx="16" fill="transparent"/>`, o),
    hit("sink", `<rect x="318" y="262" width="164" height="160" rx="12" fill="transparent"/>`, o),
    hit("shower", `<rect x="660" y="12" width="136" height="412" rx="8" fill="transparent"/>`, o),
    hit("toilet", `<rect x="524" y="222" width="132" height="204" rx="12" fill="transparent"/>`, o),
    hit("supplies", `<rect x="478" y="190" width="42" height="104" rx="8" fill="transparent"/>`, o),
    hit("bin", `<rect x="226" y="326" width="80" height="100" rx="8" fill="transparent"/>`, o),
    hit("shelf", `<rect x="556" y="100" width="138" height="64" rx="8" fill="transparent"/>`, o),
    hit("bottle", `<rect x="600" y="172" width="52" height="60" rx="8" fill="transparent"/>`, o),
  ].join("");

  return `<svg class="scene" viewBox="0 0 ${VIEW.w} ${VIEW.h}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${hotel ? "Hotel bathroom" : "Bathroom"}">
    <defs>
      <pattern id="tiles" width="40" height="36" patternUnits="userSpaceOnUse"><rect width="40" height="36" fill="${wall}"/><path d="M0 0 H40 M0 0 V36" stroke="${wallLine}" stroke-width="2"/></pattern>
      <pattern id="floortiles" width="80" height="70" patternUnits="userSpaceOnUse"><rect width="80" height="70" fill="${floorA}"/><rect width="40" height="35" fill="${floorB}"/><rect x="40" y="35" width="40" height="35" fill="${floorB}"/></pattern>
    </defs>
    <rect width="800" height="420" fill="url(#tiles)"/>
    <rect y="420" width="800" height="140" fill="url(#floortiles)"/>
    <rect y="414" width="800" height="8" fill="${hotel ? "#B7AE9F" : "#9FBDB2"}"/>
    ${floorMarks}${debris}
    ${windowPane}${fan}${door}${shower}${shelf}${mirror}${supplies}${sink}${toilet}${bottle}${bin}${sign}
    <g class="hits">${hits}</g>
    <g class="markers">${Object.entries(m).map(([id, k]) => marker(id, k)).join("")}</g>
  </svg>`;
}
