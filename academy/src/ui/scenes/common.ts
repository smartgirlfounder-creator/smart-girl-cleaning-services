// Shared SVG helpers for room scenes.

export type Marker = "todo" | "done" | "found" | "false" | "hint" | null;

export interface SceneOptions {
  markers?: Record<string, Marker>;
  /** Objects the player can tap. Others are drawn but inert. */
  interactive?: string[];
  labels?: Record<string, string>;
}

export type Anchors = Record<string, { x: number; y: number }>;

export const VIEW = { w: 800, h: 560 };

export function hit(id: string, shape: string, o: SceneOptions): string {
  if (!o.interactive?.includes(id)) return "";
  const label = o.labels?.[id] ?? id;
  return `<g class="hit" data-obj="${id}" role="button" tabindex="0" aria-label="${label}">${shape}</g>`;
}

export function dots(points: [number, number, number][], fill: string, opacity = 1): string {
  return points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`).join("");
}

const MARKER_ART: Record<Exclude<Marker, null>, string> = {
  todo: `<circle r="11" class="mk-todo"/><text y="5" text-anchor="middle" class="mk-q">?</text>`,
  done: `<circle r="11" class="mk-done"/><path d="M-5 0 l3.5 4 l7 -8" class="mk-tick"/>`,
  found: `<circle r="15" class="mk-found"/><text y="6" text-anchor="middle" class="mk-bang">!</text>`,
  false: `<circle r="11" class="mk-false"/><path d="M-4 -4 l8 8 M4 -4 l-8 8" class="mk-x"/>`,
  hint: `<circle r="18" class="mk-hint"/>`,
};

export function markerLayer(markers: Record<string, Marker> | undefined, anchors: Anchors): string {
  const items = Object.entries(markers ?? {})
    .map(([id, kind]) => {
      const a = anchors[id];
      return kind && a ? `<g class="mk" transform="translate(${a.x} ${a.y})" pointer-events="none">${MARKER_ART[kind]}</g>` : "";
    })
    .join("");
  return `<g class="markers">${items}</g>`;
}
