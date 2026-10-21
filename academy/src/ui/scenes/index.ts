import { ANCHORS as BATHROOM_ANCHORS, renderBathroom } from "./bathroom";
import type { Anchors, SceneOptions } from "./common";
import { KITCHEN_ANCHORS, renderKitchen } from "./kitchen";

export { VIEW, type Marker, type SceneOptions } from "./common";

const SCENES: Record<string, { render: (flags: Set<string>, o?: SceneOptions) => string; anchors: Anchors }> = {
  bathroom: { render: renderBathroom, anchors: BATHROOM_ANCHORS },
  kitchen: { render: renderKitchen, anchors: KITCHEN_ANCHORS },
};

export function renderScene(sceneId: string, flags: Set<string>, o?: SceneOptions): string {
  const scene = SCENES[sceneId];
  if (!scene) throw new Error(`No scene called ${sceneId}`);
  return scene.render(flags, o);
}

export function anchorsFor(sceneId: string): Anchors {
  return SCENES[sceneId]?.anchors ?? {};
}
