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

## Deploy (when you're ready)
Create a **new** Netlify site from this repository with **Base directory = `calculator-sales`**.
`calculator-sales/netlify.toml` sets the build command and `dist` publish folder.
Do not change the repository-root `netlify.toml` (that hosts Smart Cleaners Academy).

## Where things come from
- Screenshots: frames from `marketing/cleaning-calculator/cleaning-calculator-pro-walkthrough.mp4` (real app, sample data).
- Founder photo: copied from `kaffy-website/public/images/photos/`.
- Free PDF: `Cleaning-Calculator-Pro-Complete-Guide.pdf`, supplied by Kaffy (no access link or code inside).
  Do **not** use the buyer "Access Guide" PDF here; it contains the private access-page address.
- Videos: Kaffy Olaitan YouTube channel. The "install on your phone" Short (TGUItYzt17M) is left out on purpose until
  it's confirmed it doesn't show the access page address.

## Adding testimonial screenshots
Put images in `src/assets/testimonials/` and add `<figure><img ...></figure>` cards inside the
`#reviews` section where the `MORE TESTIMONIALS` comment is.
