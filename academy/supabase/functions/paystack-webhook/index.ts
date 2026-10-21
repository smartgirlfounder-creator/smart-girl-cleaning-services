// Paystack calls this after every successful charge, so passes are granted even if the
// player closes the page before returning. Deploy with JWT verification OFF: Paystack
// can't send a Supabase token, so the request is checked with Paystack's signature instead.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkPayment, paystack, validSignature, type PaystackTransaction } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secret) return new Response("Payments not configured", { status: 503 });

  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get("x-paystack-signature"), secret))) return new Response("Bad signature", { status: 401 });

  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return new Response("ignored", { status: 200 });

  // Never trust the webhook body alone: re-check the transaction with Paystack.
  const tx = await paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(event.data.reference)}`, secret);
  const check = checkPayment(tx);
  if (!check.ok) return new Response(check.reason, { status: 200 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.rpc("grant_expert_pass", { p_user: check.userId, p_reference: tx.reference, p_currency: tx.currency, p_amount: tx.amount });
  if (error) return new Response("Could not record payment", { status: 500 });
  return new Response("ok", { status: 200 });
});
