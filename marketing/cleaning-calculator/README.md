# Cleaning Calculator Pro: product walkthrough video

**Output:** `cleaning-calculator-pro-walkthrough.mp4` (9:16, 1080×1920, 30 fps, about 94 s, original soundtrack).

Everything shown on the phone is the **real Cleaning Calculator Pro** (v12, from `Cleaning-Calculator-Pro-13.zip`), running in a browser at phone size and operated step by step. Every number in the video was calculated by the app itself.

## Sample data (fictional, for demonstration)
| Field | Value |
|---|---|
| Business | Sparkle Pros Cleaning (sample logo), owner Ada Okafor, 0801 234 5678, hello@sparklepros.example |
| Bank | Demo Bank · Sparkle Pros Cleaning · 0123456789 |
| Client | Mrs. Bola Adeyemi · 0802 345 6789 · 14 Palm Grove Close, Lekki |
| Job | Residential · Deep Cleaning · 3 bedrooms · 3 staff · 1 day · difficulty 1.2, then Upholstery (5 seaters) added as a second service with transport 0 |
| Payment | ₦148,200 received by bank transfer (the 40% down payment) |
| Delivery photos | Before/after illustrations of a bathroom, drawn for the demo, not photos of a real job |

The app's default pricing settings were used unchanged. A small "Sample data for demonstration" note shows throughout.

## Storyboard
| Time | Heading (top) | Phone shows (real screen) | Motion design | Caption |
|---|---|---|---|---|
| 0–3.3 | STOP GUESSING YOUR CLEANING PRICES. | Phone dark, turned away | Three "problem" cards float in and get struck through | — |
| 3.3–7 | MEET CLEANING CALCULATOR PRO | Calculator home (Client Details) | Phone turns to face the camera; screen lights up; orbit rings | — |
| 7–15.5 | STAGE 01 · SET UP YOUR BUSINESS | Setup: empty, then filled (name, logo, phone, currency), scrolling to bank details and signature | Highlights and taps on Business Name, Currency and Signature; "26 currencies" callout | Your name, logo, phone & currency / Bank details, terms & signature |
| 15.5–23 | STAGE 02 · SET YOUR PRICES | Pricing: staff pay & feeding, then scrolling through the service rate cards | Eight service-type chips fly in (Regular, Deep, Post-Construction, Move-In/Out, Upholstery, Carpet, Fumigation, Custom) | Your own rates. For your eyes only. |
| 23–32.5 | STAGE 03 · DEFINE THE CLEANING JOB | Calculator: client details, then 5 real recalculations as Cleaning Type, bedrooms, staff and difficulty change | Taps on each control; side cards build the job spec; live total card updates with each real value: ₦122,000 → ₦142,000 → ₦164,500 → ₦175,500 → ₦181,500 | Choose the job. Watch the price update. |
| 32.5–40.5 | STAGE 04 · SEE EVERY COST | Additional Costs (Transportation, Profit Margin), then YOUR VIEW | Phone slides aside; the YOUR VIEW breakdown pops out as a 3D card with a connector line | Your private breakdown |
| 40.5–54 | STAGE 05 · SEND A PROFESSIONAL QUOTE | Itemised services (Deep Cleaning ₦181,500 + Upholstery ₦189,000), the branded customer quotation, total ₦370,500 and 40% down payment ₦148,200, then the Print/Save PDF, WhatsApp and Save to History buttons | **Split screen:** phone recedes; "YOU SEE" (private breakdown) beside "CUSTOMER SEES" (total and down payment) | Several services in one quote / A branded quotation, ready to send / Save as PDF, share on WhatsApp, or save to History |
| 54–60 | STAGE 06 · FOLLOW UP EVERY QUOTE | History: QT-0001 marked Sent, follow-up date, WhatsApp "Follow up" button | Highlights; "Follow-up reminders" callout | Track every quote |
| 60–68 | STAGE 07 · INVOICE & GET PAID | Invoice loaded from the quote, ₦148,200 received by bank transfer, then the generated invoice INV-0001 | Balance card ₦222,300 with a connector line | Load the quote. Record the payment. / The balance is worked out for you |
| 68–75.5 | STAGE 08 · DELIVER & GET REVIEWS | Before & after photos, then delivery report DR-0001 and "Request a Review via WhatsApp" | Gallery pops out enlarged | Add before & after photos / A completion report for your client |
| 75.5–82.5 | STAGE 09 · TRACK YOUR BUSINESS | Dashboard: Money quoted ₦370,500, Jobs won ₦370,500 (100% win rate), Revenue ₦148,200, Outstanding ₦222,300, 6-month chart | Four tiles fly out and stack beside the phone | Money quoted, jobs won, revenue & balances |
| 82.5–88 | STAGE 10 · WIN BIGGER CONTRACTS | Proposal Generator, New proposal, facility-type questionnaire | Taps | Commercial cleaning proposals |
| 88–94 | PRICE WITH CONFIDENCE. | The finished customer quotation | Phone rises, slow orbit, light sweep; product name | CLEANING CALCULATOR PRO · Quotes · Invoices · Delivery reports · Dashboard · Proposals |

## Voiceover script (optional, about 75 seconds)
Voice generation wasn't available here, so the video works without sound; every point is on screen. To add a voiceover, record this over the video:

> **0s** Still guessing your cleaning prices?
> **3s** Meet Cleaning Calculator Pro.
> **7s** First, set up your business once: your logo, currency, bank details and signature.
> **15s** Next, set your own rates for every service. Only you can see them.
> **23s** Now define the job. Choose the cleaning type, bedrooms, staff and difficulty, and watch the price update.
> **32s** Add transport and your profit, then see every cost in your private breakdown.
> **40s** Put several services in one quote. Your customer gets a branded quotation with the total and the down payment. Save it as a PDF or share it on WhatsApp.
> **54s** Track every quote and follow up on time.
> **60s** When the client pays, load the quote into an invoice. The balance is worked out for you.
> **68s** Finish the job with a delivery report and before-and-after photos, then ask for a review in one tap.
> **75s** Your dashboard shows money quoted, jobs won, revenue and balances.
> **82s** And for bigger contracts, build a professional cleaning proposal.
> **88s** Cleaning Calculator Pro. Price with confidence.

## Features demonstrated
Access-code unlock (not shown in the video) · Business setup (name, logo, owner, phone, email, 26 currencies, bank details, down payment %, terms, signature) · Pricing settings (staff pay, feeding, materials and equipment per service, 8 service types) · Calculator (client details, property and cleaning type, bedrooms, staff, days, difficulty multiplier, transportation, overhead, miscellaneous, profit) · Live recalculation · Private "YOUR VIEW" cost breakdown · Itemised multi-service quote · Customer quotation (QT-0001) with total, down payment, bank details, terms and signature · Print/Save PDF, Share via WhatsApp and Save to History buttons · History status and follow-up date · Invoice INV-0001 with payment recording and balance · Delivery report DR-0001 with before/after photos and a WhatsApp review request · Business dashboard · Proposal Generator questionnaire.

**Not demonstrated:** Backup & Restore, the carpet size converter, the support chat, PDF output and WhatsApp itself (only the buttons are shown), and the optional AI proposal writer (it needs a server key).

## How it was made / rebuild
```bash
npm install
node make-sample-photos.mjs <bundled bathroom scene>        # sample before/after images and the sample logo
node capture.mjs <unzipped Cleaning-Calculator-Pro folder>    # plays the real workflow, saves screens + positions
node render.mjs cues && python3 soundtrack.py                 # soundtrack timed to the video
node render.mjs stills                                        # preview frames
node render.mjs video                                         # full MP4
```
`stage.html` is the motion design (phone, highlights, cards, split screen, headings), and `timeline.mjs` is the script. The access code typed in is the one listed in the product's own README.
