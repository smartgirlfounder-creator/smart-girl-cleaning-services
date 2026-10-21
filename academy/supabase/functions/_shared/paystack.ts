// Shared Paystack logic for the Edge Functions. Plain TypeScript with Web Crypto only,
// so it also runs under Node for unit tests.

export const PLAN_ID = "expert-pass";
export const PRICES: Record<string, number> = { NGN: 1_500_000, USD: 1_200 }; // kobo, cents

export interface PaystackTransaction {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer?: { email?: string };
  metadata?: { user_id?: string; plan_id?: string } | string | null;
}

function meta(tx: PaystackTransaction): { user_id?: string; plan_id?: string } {
  if (!tx.metadata) return {};
  if (typeof tx.metadata === "string") {
    try {
      return JSON.parse(tx.metadata);
    } catch {
      return {};
    }
  }
  return tx.metadata;
}

/** Checks a verified transaction is a full, successful Expert Pass payment. */
export function checkPayment(tx: PaystackTransaction, expectedUser?: string): { ok: true; userId: string } | { ok: false; reason: string } {
  const m = meta(tx);
  if (tx.status !== "success") return { ok: false, reason: `Payment not successful (${tx.status}).` };
  if (m.plan_id !== PLAN_ID) return { ok: false, reason: "This payment isn't for the Expert Pass." };
  if (!m.user_id) return { ok: false, reason: "This payment isn't linked to an account." };
  if (expectedUser && m.user_id !== expectedUser) return { ok: false, reason: "This payment belongs to a different account." };
  const price = PRICES[tx.currency];
  if (!price) return { ok: false, reason: `Unsupported currency ${tx.currency}.` };
  if (tx.amount < price) return { ok: false, reason: "The amount paid is less than the Expert Pass price." };
  return { ok: true, userId: m.user_id };
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body, using your secret key. */
export async function validSignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

/** Only send people back to our own site (https, or localhost while testing). */
export function safeReturnUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.hostname === "localhost" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function paystack<T>(path: string, secret: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json();
  if (!res.ok || body.status === false) throw new Error(body.message ?? `Paystack error ${res.status}`);
  return body.data as T;
}
