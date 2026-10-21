// The Expert Pass. Keep prices in step with supabase/functions/_shared/paystack.ts
// and app_settings.expert_pass_prices in the database.

export type Currency = "NGN" | "USD";

export const EXPERT_PASS = {
  id: "expert-pass",
  name: "Expert Pass",
  days: 365,
  /** Amounts in the smallest unit (kobo, cents), as Paystack expects. */
  prices: { NGN: 1_500_000, USD: 1_200 } satisfies Record<Currency, number>,
  labels: { NGN: "₦15,000", USD: "$12" } satisfies Record<Currency, string>,
  levels: ["expert"] as const,
};

/**
 * Payments are built but switched off. To launch: set VITE_PAYMENTS=on for the build,
 * and set app_settings.payments_enabled = true in the database (see supabase/PAYMENTS.md).
 */
export const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS === "on";

export function isPaidLevel(level: string): boolean {
  return PAYMENTS_ENABLED && (EXPERT_PASS.levels as readonly string[]).includes(level);
}
