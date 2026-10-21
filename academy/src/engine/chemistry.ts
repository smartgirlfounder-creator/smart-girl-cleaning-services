import { NEVER_MIX, PRODUCTS } from "../data/equipment";
import type { ChemicalClass } from "./types";

export interface MixHazard {
  productA: string;
  productB: string;
  gas: string;
}

function classOf(productId: string): ChemicalClass | undefined {
  return PRODUCTS[productId]?.chemical;
}

/** Returns the hazard if the two products must never meet, otherwise null. */
export function mixHazard(productA: string, productB: string): MixHazard | null {
  const a = classOf(productA);
  const b = classOf(productB);
  if (!a || !b) return null;
  const rule = NEVER_MIX.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  return rule ? { productA, productB, gas: rule.gas } : null;
}

/** Checks a product against everything already on a surface. */
export function firstHazard(product: string, residues: readonly string[]): MixHazard | null {
  for (const r of residues) {
    const h = mixHazard(product, r);
    if (h) return h;
  }
  return null;
}
