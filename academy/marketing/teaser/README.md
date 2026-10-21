# Launch teaser

Two 18.5-second vertical (1080×1920, 30 fps) teasers for TikTok, Shorts and Reels:

- `smart-cleaners-academy-teaser.mp4`: ends with "LAUNCHING TODAY".
- `smart-cleaners-academy-teaser-its-here.mp4`: ends with "IT'S HERE." Use this once the site is live.

Everything on the phone screen is a real capture of the app (`screens/`). The soundtrack is original and synthesised in `soundtrack.py`, so it's free for commercial use.

Rebuild (from `academy/`):

```bash
npm run build && node marketing/teaser/capture-screens.mjs   # real app screens
cd marketing/teaser
python3 soundtrack.py                                        # soundtrack.wav
node render.mjs stills                                       # preview stills
node render.mjs video today                                  # or: node render.mjs video here
```
