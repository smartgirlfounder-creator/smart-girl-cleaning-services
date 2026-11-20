# Newsletter playbook (run every Monday and Wednesday, 11:23 WAT)

Kaffy reviews each draft and taps **Send** herself on Tuesday/Thursday at about 7am WAT.
Never send or schedule a campaign. Keep Mailchimp calls to about 5 per run (Zapier free plan: ~100 tasks/month).

## Accounts
- **Google Sheet:** "Get the Complete Cleaning Business Launch Guide" (id `17HcNhK-SYZPz6xxLbiOfApNcbG5vdHS_fVIBwwhFVpU`, tab "Form responses").
  Columns: First Name, Last Name, Email Address, Phone, consent ("Yes, please send me tips" or blank), Submission ID.
- **Mailchimp via the Zapier connector:** app `MailchimpCLIAPI`, connection `028c6975-5021-8b26-a812-c84bde9d5d8a`.
  Action `_zap_raw_request`: `mailchimp_make_api_get_request` for GET, `mailchimp_make_api_mutating_request` for POST/PUT, `fail_on_errors: "false"`.
  API base `https://us15.api.mailchimp.com/3.0`. Audience `c51439d252` ("Smart Cleaning Business Bosses"). Tag `launch-guide` = static segment `287`. Tag `smart-cleaners-app` = `288`. Tag `bought-cleaning-calculator` = `289` (Cleaning Calculator Pro buyers: NEVER send them the calculator newsletter).
  If the connection has expired, Kaffy reconnects it here: https://mcp.zapier.com/api/v1/connect-auth/MailchimpCLIAPI?accountId=23864706
- **Gmail connector:** sends the welcome emails.

## Job 1: new sign-ups
1. Read the sheet. Candidates are rows with Submission ID > `6703913875216071709`, consent containing "Yes", and a valid email.
   Skip typos (`@gmai.com`, `.comt`) and Kaffy's own addresses (smartgirlfounder@gmail.com, keffyola.ko@gmail.com). Lower-case and de-duplicate; Title Case the names.
2. Drop anyone already welcomed: search Gmail `in:sent to:<email> subject:"Here's your first pricing lesson"`.
3. If any are left, make one call `POST /lists/c51439d252` with `{"members":[...status "subscribed", FNAME, LNAME], "update_existing": false}`.
   Then make one call `POST /lists/c51439d252/segments/287` with `{"members_to_add":[...]}`.
4. Send each one the welcome email in `welcome-email.md` from Gmail.
5. **"YES" replies:** on 20 Nov 2026, 13 Launch Guide people who hadn't ticked "send me tips" were emailed asking them to reply YES.
   Search Gmail for `in:inbox subject:("Quick question" OR "did something go wrong") newer_than:14d`, then read each thread.
   On 20 Nov 2026, Selar abandoned-checkout people got a "did something go wrong?" email that also asks them to reply YES for tips; handle those replies the same way, tagging them `abandoned-checkout` as well.
   If someone asks about payment or the calculator, don't answer it yourself: list it in the report so Kaffy can reply personally.
   Add anyone who clearly said yes in the same batch call as step 3 (with the `launch-guide` tag), and send them the welcome email. Never add anyone who said no or didn't reply.

## Job 2: next newsletter draft
1. Monday's run builds Tuesday's **TEACH** email (one practical lesson). Wednesday's run builds Thursday's **STORY/PROOF** email (a story, Kaffy's journey, or a real industry news story). Never invent testimonials.
2. One call: `GET /campaigns?count=30&sort_field=create_time&sort_dir=DESC`.
   Titles follow `Newsletter #N - Tue 24 Nov 2026 - topic`. If tomorrow's email already exists, skip this job. Otherwise pick a topic not used before.
3. Every email follows the same order: value (200–300 words, naira examples labelled as example numbers, maths checked) → a 1–2 line bridge → the calculator button → the sign-off, with a teaser for the next email → the resource footer.
   The body starts with `<p>*|IF:FNAME|*Hi *|FNAME|*,*|ELSE:|*Hi there,*|END:IF|*</p>`.
4. Make one call `POST /campaigns` (type regular, recipients `{"list_id":"c51439d252","segment_opts":{"match":"all","conditions":[{"condition_type":"StaticSegment","field":"static_segment","op":"static_not","value":289}]}}`, title, subject, preview_text, from_name "Kaffy Olaitan", reply_to smartgirlfounder@gmail.com).
   Then make one call `PUT /campaigns/<id>/content` with the HTML from `template.html`, replacing {{PREVIEW}}, {{BODY}}, {{BUTTON}} and {{SIGNOFF}}.
5. **Thursday 26 Nov 2026** must deliver the teaser from email #1. Sara Allan of Housekeeping Heroes (Sydney) turned down a pre-handover clean of new townhouses worth about $1.5M each because the pay was far too low. Builders blame cleaners when buyers find problems; this is her side, and the builder's response wasn't reported. Lesson: say no to underpriced work and know your floor price.

**Topic pool:**
- deep clean vs regular pricing
- post-construction pricing
- office/commercial contracts
- small jobs still need full costing
- forgotten transport and feeding costs
- down payments and balances
- following up quiet quotes
- a quote vs a price
- proposals for offices and schools
- knowing your numbers
- raising prices
- "your price is too high"
- staff pay and profit
- equipment wear
- Kaffy's start in one small room (1 Nov 2023)

**Calculator facts:**
- ₦20,000 one-time, no subscription
- iPhone, Android and laptop; 26 African currencies
- private cost and profit breakdown
- branded quote PDF sent on WhatsApp
- quote follow-up tracking
- invoices and balances
- completion report with before/after photos
- dashboard
- Proposal Generator

## Job 3: report
Report the number of new sign-ups (first names only), the welcome emails sent, and the draft's subject and topic. End with the reminder to tap Send tomorrow at about 7am WAT.

## Cleaning Calculator Pro buyers (from Selar, 20 Nov 2026)
If any of these emails appears as a new sign-up or YES reply, still add them, but ALSO add them to tag 289 (`POST /lists/c51439d252/segments/289` with members_to_add) in the same run.
abalosarafina20@gmail.com, appiahelsie40@gmail.com, chidinmaonyewuche@gmail.com, misstobyglory@gmail.com, abike008@gmail.com,
boakyeglay6@gmail.com, experiencesparkle360@gmail.com, princemuyea@gmail.com, sparklingoutlookcleaning@gmail.com,
ademolalateef332@gmail.com, godakorf@gmail.com, mbsally47@gmail.com, whitneyvivian0@gmail.com, ethelakuagh@gmail.com,
millymatt4422@gmail.com, hakeemmariam5@gmail.com, meemeelustre@gmail.com, qverafacilities@gmail.com (also moghaluhope@gmail.com, same buyer),
deborahumoren2019@gmail.com
When Kaffy shares new buyers, add them to this list and to tag 289.
