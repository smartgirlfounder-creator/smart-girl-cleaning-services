// Kitchen scene, drawn as SVG and driven by scene flags like the bathroom.
import { dots, hit, markerLayer, type SceneOptions } from "./common";

export const KITCHEN_ANCHORS: Record<string, { x: number; y: number }> = {
  vent: { x: 105, y: 46 },
  dishes: { x: 552, y: 222 },
  bin: { x: 622, y: 330 },
  microwave: { x: 311, y: 206 },
  hob: { x: 455, y: 236 },
  counters: { x: 236, y: 300 },
  handles: { x: 702, y: 140 },
  sink: { x: 135, y: 250 },
  supplies: { x: 228, y: 176 },
  floor: { x: 400, y: 486 },
};

export function renderKitchen(flags: Set<string>, o: SceneOptions = {}): string {
  const f = (k: string) => flags.has(k);
  const vent = f("vent");
  const hobClean = f("hob");

  const windowPane = vent
    ? `<rect x="40" y="50" width="130" height="120" rx="6" fill="#BFE3F5"/><path d="M40 50 L130 36 L130 156 L40 170 Z" fill="#E6F4FB" stroke="#B7A58C" stroke-width="4" opacity="0.95"/>
       ${[0, 1, 2].map((i) => `<path d="M${176 + i * 4} ${70 + i * 26} q 14 -6 26 0" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.85" class="breeze"/>`).join("")}`
    : `<rect x="40" y="50" width="130" height="120" rx="6" fill="#DCE8EE" stroke="#B7A58C" stroke-width="4"/><path d="M105 50 V170" stroke="#B7A58C" stroke-width="4"/>`;

  const cabinets = `
    <rect x="196" y="28" width="168" height="114" rx="6" fill="#5E8C61"/><path d="M280 28 V142" stroke="#4B744E" stroke-width="3"/>
    <rect x="268" y="110" width="4" height="18" rx="2" fill="#E6D3A3"/><rect x="288" y="110" width="4" height="18" rx="2" fill="#E6D3A3"/>
    <rect x="534" y="28" width="104" height="114" rx="6" fill="#5E8C61"/><rect x="580" y="110" width="4" height="18" rx="2" fill="#E6D3A3"/>
    <rect x="0" y="296" width="592" height="124" fill="#5E8C61"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${8 + i * 118}" y="306" width="104" height="104" rx="4" fill="none" stroke="#4B744E" stroke-width="3"/><rect x="${52 + i * 118}" y="314" width="18" height="4" rx="2" fill="#E6D3A3"/>`).join("")}`;

  const hood = `
    <rect x="436" y="0" width="40" height="112" fill="#C7CDD2"/>
    <path d="M384 150 L410 108 H502 L528 150 Z" fill="#D9DDE0" stroke="#AEB8C1" stroke-width="2"/>
    <g transform="translate(456 132)"><circle r="9" fill="#AEB8C1"/><g class="${vent ? "fan-on" : ""}">${[0, 120, 240].map((d) => `<path d="M0 0 L0 -8 L4 -6 Z" fill="#7D8790" transform="rotate(${d})"/>`).join("")}</g></g>
    ${!hobClean ? `${dots([[404, 140, 4], [420, 132, 3], [494, 136, 4], [508, 142, 3], [470, 120, 3]], "#8A6A3A", 0.75)}` : ""}`;

  const backsplash = !hobClean
    ? `${dots([[404, 196, 5], [420, 214, 3], [440, 188, 4], [472, 206, 5], [494, 190, 3], [508, 222, 4], [452, 236, 3], [430, 244, 4]], "#9C7A40", 0.7)}
       ${f("degreaser") ? dots([[410, 200, 9], [436, 192, 8], [470, 210, 10], [500, 196, 8], [446, 240, 9], [488, 236, 8]], "#FFF8DC", 0.95) : ""}`
    : "";

  const hob = `
    <rect x="392" y="270" width="128" height="12" rx="3" fill="#2B2B33"/>
    ${[408, 440, 472, 504].map((x) => `<ellipse cx="${x}" cy="275" rx="12" ry="3" fill="none" stroke="#55555F" stroke-width="2"/>`).join("")}
    ${!hobClean ? `<ellipse cx="440" cy="275" rx="10" ry="2.5" fill="#7A5A2A"/><ellipse cx="504" cy="275" rx="9" ry="2" fill="#7A5A2A"/>` : ""}
    <rect x="394" y="300" width="124" height="108" rx="6" fill="#2F2F38" stroke="#55555F" stroke-width="2"/>
    <rect x="408" y="324" width="96" height="58" rx="4" fill="#4A4A55"/>
    <rect x="420" y="308" width="72" height="6" rx="3" fill="#AEB8C1"/>`;

  const counterTop = `<rect x="0" y="280" width="592" height="18" rx="2" fill="#E8DCC6" stroke="#CDBE9F" stroke-width="2"/>`;
  const counterMess = !f("counters")
    ? `${dots([[222, 286, 2], [230, 289, 1.6], [244, 285, 2], [366, 287, 2], [374, 284, 1.6], [384, 289, 2], [528, 286, 2], [560, 288, 1.6], [574, 285, 2]], "#A5793F")}
       <ellipse cx="246" cy="289" rx="18" ry="4" fill="#7A5230" opacity="0.6"/><ellipse cx="376" cy="289" rx="10" ry="3" fill="#C9A646" opacity="0.6"/>`
    : `<path d="M20 286 h120 M230 286 h120" stroke="#FFFFFF" stroke-width="3" opacity="0.5" stroke-linecap="round"/>`;

  const sinkClean = f("sink");
  const sink = `
    <rect x="70" y="281" width="132" height="12" rx="3" fill="#B9C1C7"/>
    <rect x="78" y="283" width="116" height="8" rx="2" fill="#8F99A1"/>
    <path d="M136 282 V244 q0 -16 18 -16 h6 q8 0 8 8 v8" stroke="#C0C8CE" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="124" y="272" width="24" height="10" rx="3" fill="#C0C8CE"/>
    ${!sinkClean ? `${dots([[137, 252, 2.5], [134, 262, 2], [140, 270, 2.5], [158, 230, 2], [128, 276, 2]], "#FFFFFF")}${dots([[100, 287, 3], [150, 288, 2.5], [176, 286, 3]], "#B08F58")}` : ""}`;

  const stocked = f("stock");
  const supplies = `
    <rect x="204" y="188" width="48" height="10" rx="5" fill="#C0C8CE"/>
    <rect x="${stocked ? 208 : 222}" y="198" width="${stocked ? 40 : 12}" height="${stocked ? 18 : 6}" rx="${stocked ? 8 : 3}" fill="#FFFFFF" stroke="#D5DADF"/>
    <rect x="212" y="248" width="20" height="32" rx="5" fill="#F6F1E7" stroke="#D5DADF"/>
    <rect x="215" y="${stocked ? 256 : 272}" width="14" height="${stocked ? 22 : 6}" rx="3" fill="#8FD3B6"/>
    <rect x="218" y="238" width="8" height="10" fill="#C0C8CE"/><path d="M226 240 h8" stroke="#C0C8CE" stroke-width="3"/>`;

  const microwave = `
    <rect x="262" y="214" width="98" height="66" rx="6" fill="#ECEFF1" stroke="#B5BDC3" stroke-width="2"/>
    <rect x="270" y="222" width="62" height="50" rx="4" fill="#3A3F45"/>
    <rect x="338" y="226" width="14" height="40" rx="3" fill="#C7CDD2"/>
    ${!f("microwave") ? `${dots([[282, 236, 4], [296, 248, 3], [314, 232, 4], [322, 258, 3], [288, 262, 3]], "#C46A3A", 0.9)}<ellipse cx="346" cy="246" rx="5" ry="4" fill="#6B6255" opacity="0.4"/>` : ""}`;

  const dishes = !f("cleared")
    ? `<ellipse cx="552" cy="276" rx="30" ry="5" fill="#FFFFFF" stroke="#C9D0D6"/><ellipse cx="552" cy="270" rx="28" ry="5" fill="#F4F6F7" stroke="#C9D0D6"/><ellipse cx="552" cy="264" rx="26" ry="5" fill="#FFFFFF" stroke="#C9D0D6"/>
       <rect x="534" y="240" width="16" height="20" rx="3" fill="#E07A5F"/><path d="M550 246 q 6 0 6 6 q 0 6 -6 6" stroke="#E07A5F" stroke-width="3" fill="none"/>
       <rect x="560" y="246" width="26" height="14" rx="3" fill="#4A4A55"/><rect x="586" y="250" width="10" height="4" fill="#4A4A55"/>${dots([[544, 262, 2], [560, 264, 2]], "#B08F58")}`
    : "";

  const handlesDirty = !f("handles");
  const fridge = `
    <rect x="660" y="66" width="128" height="354" rx="8" fill="#E8ECEF" stroke="#B5BDC3" stroke-width="2"/>
    <path d="M660 186 H788" stroke="#B5BDC3" stroke-width="2"/>
    <rect x="672" y="96" width="6" height="64" rx="3" fill="#AEB8C1"/><rect x="672" y="204" width="6" height="96" rx="3" fill="#AEB8C1"/>
    <rect x="606" y="186" width="26" height="34" rx="4" fill="#F7F8F8" stroke="#C9D0D6" stroke-width="2"/><rect x="615" y="194" width="8" height="16" rx="2" fill="#DDE2E6"/>
    ${handlesDirty ? `<ellipse cx="675" cy="226" rx="8" ry="10" fill="#6B6255" opacity="0.35"/><ellipse cx="675" cy="120" rx="7" ry="8" fill="#6B6255" opacity="0.3"/><ellipse cx="620" cy="204" rx="7" ry="5" fill="#6B6255" opacity="0.35"/>` : ""}`;

  const binFull = !f("bin");
  const bin = `
    <path d="M598 344 H648 L643 420 H603 Z" fill="#7D8790"/><rect x="594" y="338" width="58" height="10" rx="3" fill="#636C74"/>
    ${binFull ? `<circle cx="608" cy="334" r="9" fill="#C46A3A"/><circle cx="626" cy="328" r="11" fill="#E8DCC6"/><circle cx="642" cy="334" r="8" fill="#9C7A40"/><path d="M612 322 l10 -10" stroke="#7FB069" stroke-width="4"/>` : `<path d="M596 340 q 27 -10 54 0" stroke="#3E3E46" stroke-width="3" fill="none"/>`}`;

  const floor = f("floor")
    ? `<path d="M60 470 l100 -12 M360 520 l120 -14 M600 470 l90 -10" stroke="#FFFFFF" stroke-width="5" opacity="0.3" stroke-linecap="round"/>`
    : `<ellipse cx="300" cy="480" rx="34" ry="9" fill="#E07A5F" opacity="0.55"/>
       ${dots([[180, 450, 2.5], [196, 462, 2], [430, 500, 2.5], [450, 470, 2], [520, 520, 2.5], [640, 452, 2]], "#A5793F")}
       ${[[360, 460], [392, 482], [424, 462], [456, 486]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="16" fill="#7A6146" opacity="0.32" transform="rotate(${i % 2 ? 20 : -10} ${x} ${y})"/>`).join("")}`;
  const sign = f("sign")
    ? `<g transform="translate(700 450)"><path d="M0 70 L22 0 H40 L62 70 Z" fill="#F2C230" stroke="#B88E10" stroke-width="3"/><path d="M31 18 l-12 30 h24 z" fill="none" stroke="#1E1E24" stroke-width="3"/><text x="31" y="62" font-size="9" text-anchor="middle" font-weight="700" fill="#1E1E24">WET</text></g>`
    : "";

  const hits = [
    hit("floor", `<path d="M0 420 H800 V560 H0 Z" fill="transparent"/>`, o),
    hit("vent", `<rect x="32" y="40" width="150" height="140" rx="10" fill="transparent"/>`, o),
    hit("counters", `<rect x="0" y="276" width="592" height="26" rx="4" fill="transparent"/>`, o),
    hit("handles", `<rect x="656" y="62" width="136" height="362" rx="10" fill="transparent"/><rect x="600" y="180" width="40" height="46" rx="6" fill="transparent"/>`, o),
    hit("sink", `<rect x="66" y="222" width="140" height="74" rx="8" fill="transparent"/>`, o),
    hit("supplies", `<rect x="200" y="182" width="56" height="100" rx="8" fill="transparent"/>`, o),
    hit("microwave", `<rect x="258" y="208" width="106" height="76" rx="8" fill="transparent"/>`, o),
    hit("hob", `<rect x="382" y="104" width="148" height="306" rx="10" fill="transparent"/>`, o),
    hit("dishes", `<rect x="516" y="228" width="84" height="56" rx="8" fill="transparent"/>`, o),
    hit("bin", `<rect x="590" y="310" width="66" height="114" rx="8" fill="transparent"/>`, o),
  ].join("");

  return `<svg class="scene" viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Kitchen">
    <defs>
      <pattern id="ktiles" width="40" height="30" patternUnits="userSpaceOnUse"><rect width="40" height="30" fill="#F3E9D7"/><path d="M0 0 H40 M0 0 V30" stroke="#E2D5BE" stroke-width="2"/></pattern>
      <pattern id="planks" width="160" height="35" patternUnits="userSpaceOnUse"><rect width="160" height="35" fill="#C49A6C"/><rect y="17" width="160" height="18" fill="#B98E60"/><path d="M60 0 V17 M130 17 V35" stroke="#A47A4E" stroke-width="2"/></pattern>
    </defs>
    <rect width="800" height="420" fill="url(#ktiles)"/>
    <rect y="420" width="800" height="140" fill="url(#planks)"/>
    ${floor}
    ${windowPane}${cabinets}${hood}${backsplash}${counterTop}${counterMess}${sink}${supplies}${microwave}${hob}${dishes}${fridge}${bin}${sign}
    <g class="hits">${hits}</g>
    ${markerLayer(o.markers, KITCHEN_ANCHORS)}
  </svg>`;
}
