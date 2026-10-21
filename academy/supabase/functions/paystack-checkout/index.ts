// Starts an Expert Pass payment and confirms it when the player comes back from Paystack.
// Needs the PAYSTACK_SECRET_KEY secret (Supabase → Edge Functions → Secrets).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { cors, json } from "../_shared/cors.ts";
import { PLAN_ID, PRICES, checkPayment, paystack, safeReturnUrl, type PaystackTransaction } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secret) return json({ error: "Payments aren't set up yet." }, 503);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: auth } = await asUser.auth.getUser();
  const user = auth.user;
  if (!user?.email) return json({ error: "Please sign in first." }, 401);

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "start") {
      const currency = body.currency === "USD" ? "USD" : "NGN";
      const callback = safeReturnUrl(body.returnUrl);
      if (!callback) return json({ error: "Invalid return address." }, 400);
      const data = await paystack<{ authorization_url: string; reference: string }>("/transaction/initialize", secret, {
        method: "POST",
        body: JSON.stringify({ email: user.email, amount: PRICES[currency], currency, callback_url: callback, metadata: { user_id: user.id, plan_id: PLAN_ID } }),
      });
      return json({ url: data.authorization_url, reference: data.reference });
    }

    if (body.action === "confirm") {
      if (typeof body.reference !== "string" || !body.reference) return json({ error: "Missing payment reference." }, 400);
      const tx = await paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(body.reference)}`, secret);
      const check = checkPayment(tx, user.id);
      if (!check.ok) return json({ error: check.reason }, 402);
      const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: until, error } = await admin.rpc("grant_expert_pass", { p_user: user.id, p_reference: tx.reference, p_currency: tx.currency, p_amount: tx.amount });
      if (error) throw error;
      return json({ active: true, expiresAt: until });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Payment service error." }, 502);
  }
});
