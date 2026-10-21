import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkPayment, safeReturnUrl, validSignature } from "./paystack";

const tx = (over = {}) => ({ status: "success", reference: "r1", amount: 1_500_000, currency: "NGN", metadata: { user_id: "u1", plan_id: "expert-pass" }, ...over });

describe("Paystack helpers", () => {
  it("accepts a full Expert Pass payment in naira or dollars", () => {
    expect(checkPayment(tx())).toEqual({ ok: true, userId: "u1" });
    expect(checkPayment(tx({ currency: "USD", amount: 1200 }), "u1")).toEqual({ ok: true, userId: "u1" });
  });

  it("rejects failed, short, foreign or mismatched payments", () => {
    expect(checkPayment(tx({ status: "abandoned" })).ok).toBe(false);
    expect(checkPayment(tx({ amount: 100 })).ok).toBe(false);
    expect(checkPayment(tx({ currency: "GHS" })).ok).toBe(false);
    expect(checkPayment(tx(), "someone-else").ok).toBe(false);
    expect(checkPayment(tx({ metadata: { user_id: "u1", plan_id: "other" } })).ok).toBe(false);
  });

  it("reads metadata sent as a JSON string", () => {
    expect(checkPayment(tx({ metadata: JSON.stringify({ user_id: "u2", plan_id: "expert-pass" }) }))).toEqual({ ok: true, userId: "u2" });
  });

  it("verifies Paystack's webhook signature", async () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
    const sig = createHmac("sha512", "sk_test_123").update(body).digest("hex");
    expect(await validSignature(body, sig, "sk_test_123")).toBe(true);
    expect(await validSignature(body, sig, "wrong-secret")).toBe(false);
    expect(await validSignature(body + " ", sig, "sk_test_123")).toBe(false);
    expect(await validSignature(body, null, "sk_test_123")).toBe(false);
  });

  it("only returns people to safe addresses", () => {
    expect(safeReturnUrl("https://smartsweep.netlify.app/")).toBe("https://smartsweep.netlify.app/");
    expect(safeReturnUrl("http://evil.example")).toBeNull();
    expect(safeReturnUrl("javascript:alert(1)")).toBeNull();
  });
});
