# Switching on Expert Pass payments (Paystack)

Everything is built and tested, but **switched off**. Beginner and Professional are free. Expert needs an **Expert Pass: ₦15,000 or $12 per year**, paid through Paystack.

## Olaitan's part (no coding)

1. **Finish your Paystack setup** at dashboard.paystack.com: business details and bank account. To accept **dollars**, ask Paystack (Settings, or support) to enable USD payments on your account. Naira works as soon as the account is approved.
2. **Copy your secret key.** In Paystack go to **Settings → API Keys & Webhooks**. Use the **Test Secret Key** (`sk_test_…`) first, to try it with Paystack's test cards.
3. **Paste it into Supabase, never into a chat.** Log in to supabase.com as **keffyola.ko@gmail.com** and open **Smart Cleaners Academy**. Go to **Edge Functions → Secrets → Add new secret**. Name it `PAYSTACK_SECRET_KEY`, paste the key as the value, and press **Save**.
4. **Tell Claude:** "Switch on Expert Pass payments."
5. **Set the webhook** (Claude will remind you). In Paystack, under **Settings → API Keys & Webhooks**, set **Test Webhook URL** to
   `https://zvwydtgdwqfggompansj.supabase.co/functions/v1/paystack-webhook` and save.
6. **Try a test purchase** with a Paystack test card. When it works, repeat steps 2, 3 and 5 with your **Live** key and **Live Webhook URL**.

## Claude's part, when asked to switch on

1. Apply `migrations/20261021160000_expert_pass_payments.sql` (Supabase `apply_migration`, name `expert_pass_payments`). It was prepared but not applied on 2026-10-21. Check that it isn't already listed in `supabase_migrations.schema_migrations`.
2. Deploy the Edge Functions with all their files, including `_shared/paystack.ts` and `_shared/cors.ts`:
   - `paystack-checkout`, with `verify_jwt: true`
   - `paystack-webhook`, with `verify_jwt: false` (Paystack's signature is checked instead)
3. Run the security and performance advisors.
4. Switch on: `update public.app_settings set value = 'true', updated_at = now() where key = 'payments_enabled';`
5. Build with `VITE_PAYMENTS=on npm run build`, and for Netlify GitHub deploys set `VITE_PAYMENTS = "on"` in `netlify.toml`. Send Olaitan the new site zip.
6. Remind her of the webhook URL (step 5 above).

## How it works
- **Checkout:** the app asks `paystack-checkout` to start a payment. Paystack's page takes card, transfer or USSD and sends the player back with a reference. The app then asks the function to **verify the payment with Paystack's servers**, checking the status, the full amount, the currency and that it's the same account. Only then does `grant_expert_pass` record it.
- **Backup:** the webhook grants the pass even if the player closes the page early. Each payment is recorded once, by its Paystack reference.
- **Server-side lock:** once `payments_enabled` is on, the database refuses Expert training records from accounts without an active pass, so records and certificates can be trusted.
- **Yearly:** each payment adds 365 days, starting from today or from the current end date if the pass is still active. There are no automatic card charges. Players renew from any Expert mission.
- **Prices** live in three places that must match: `src/billing/plans.ts`, `supabase/functions/_shared/paystack.ts` and `app_settings.expert_pass_prices`.
