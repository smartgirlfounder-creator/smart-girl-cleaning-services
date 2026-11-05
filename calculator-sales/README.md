# Cleaning Calculator Pro: public sales page

A standalone marketing page that sells Cleaning Calculator Pro. **It contains no part of the paid app.**
Every purchase button goes to the Selar checkout; the buyer gets access through the existing paid delivery process.

## Change the checkout link or price
Edit `config.json` (`selarUrl`, `price`). Every button updates on the next build.

## Build
```bash
npm run build      # copies src/ to dist/, fills in config.json, then runs the safety checks
```
The build fails if any purchase button doesn't go to `selarUrl`, if the page or the free PDF contains a link,
web address or access code for the paid app, if a YouTube ID is malformed, or if a referenced file is missing.

## Hosting (Cloudflare Worker, connected to GitHub)
Live at https://cleaningcalssales.smartgirlfounder.workers.dev/ . `wrangler.jsonc` serves `dist/` as static files.
In Cloudflare: Worker **cleaningcalssales** → Settings → Build → Connect to this repository with
root directory `calculator-sales`, build command `npm run build`, deploy command `npx wrangler deploy`.
Every push to the production branch then rebuilds, re-runs the safety checks and updates the live page.
Do not change the repository-root `netlify.toml` (that hosts Smart Cleaners Academy).

## Where things come from
- Screenshots: frames from `marketing/cleaning-calculator/cleaning-calculator-pro-walkthrough.mp4` (real app, sample data).
- Founder photo: copied from `kaffy-website/public/images/photos/`.
- Free PDF: `Cleaning-Calculator-Pro-Complete-Guide.pdf`, supplied by Kaffy (no access link or code inside).
  Do **not** use the buyer "Access Guide" PDF here; it contains the private access-page address.
- Videos: Kaffy Olaitan YouTube channel (9 videos; the install Short sits in the FAQ, confirmed safe by Kaffy).

## Testimonials
Screenshots live in `src/assets/testimonials/` (cropped from Kaffy's Selar reviews and a TikTok comment).
To add one, copy a `<figure class="review-card">` block inside the `#reviews` section.
