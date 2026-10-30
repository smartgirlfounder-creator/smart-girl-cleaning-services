---
name: "minimal-video-edit-style"
description: "Olaitan's video editing style: clean, minimal, mature and authentic. Sharp, crisp footage with no unnecessary cuts, no pop-up cards and no flashy captions. Small Poppins captions low in the frame, coloured to match her outfit or the content. Orbits and split screens are used only when the content needs them. Use whenever editing or creating any of her videos (talking head, tutorials, storytelling, promos, cleaning-business content)."
---

# Minimal video edit style

This is Olaitan's only editing style. It replaces her old pop-up style (word-by-word captions, serif keyword pops, white cards, coral, terracotta, mustard and maroon accents, constant jump cuts). **Do not use any of those**, even if another skill or an older note mentions them.

The feeling: **clean, mature, authentic, minimal and sharp.** Her hook and her delivery carry the video. The edit stays out of the way.

## Golden rules
1. **Her hook does the work.** Don't add title cards, headline graphics, stickers or "hook text" over the opening. Let her first words land.
2. **No unnecessary cuts.** Keep her natural flow and rhythm. Only remove:
   - false starts, mistakes and retakes
   - long dead air (pauses longer than about 0.7 s)
   - clear "umm"s that break the sentence

   Keep short natural pauses and breaths. No jump-cut rhythm, no punch-in zooms, no snap zooms, no shaky "energy" moves.
3. **No pop-ups.** No cards popping in, no notification banners, no checklist pops, no emoji, no keyword pops, no whooshes or pop sounds.
4. **Effects only when necessary.** An orbit or a split screen appears only when the content calls for it (see below). Most videos need one or none. If in doubt, leave it out.
5. **Sharp and crisp.** The footage must look clean and high-quality (see "Picture").
6. **Her natural appearance.** No face or body reshaping, skin smoothing or beauty filters.
7. **Real content only.** Screenshots, apps and results must be real. Never invent screens, numbers or messages.

## Captions: small, quiet, readable
- **Font:** Poppins. Medium (500) for the text; SemiBold (600) only if the background is busy.
- **Size:** small, about 44–52 px on a 1080×1920 frame. Never big or bold "TikTok" captions.
- **Position:** low in the frame, centred, about 68–74% of the way down. That keeps them below her face and above the platform buttons and caption area (the bottom 20% and right edge).
- **Style:** short phrases of 1–2 lines, up to about 6 words per line, shown phrase by phrase in sync with her speech. Not word by word. Sentence case.
- **Motion:** none, or a soft 0.1–0.15 s fade. No bounce, scale, colour flash or highlight.
- **Colour, matched to each video:**
  - Default: white (#FFFFFF) or soft off-white, with a very subtle dark shadow (about 30% opacity, small blur) so it reads on any background. No boxes, outlines or strokes.
  - Look at what she's wearing and the setting. Pick **one** quiet accent from her outfit or the scene (for example the colour of her top, a muted version of it), and use it sparingly: for example on a single important word, or a thin underline. Never more than one accent colour per video.
  - If her outfit is busy or the accent would hurt readability, use white only.
  - State the chosen colour (hex) in the edit plan so she can approve it.
- If she asks for no captions, export without them.

## Split screen: only when she refers to something
Use a split screen when the transcript points to something the viewer needs to see: a screenshot, a message, a website, a result, a before-and-after, or a comparison.
- **Layout:** a clean top/bottom split. Her talking head stays visible (top or bottom half, face fully visible), with the screenshot or clip in the other half. Or use a neat side-by-side for before/after. Thin, straight divider (1–2 px, white at about 60%) or none at all.
- **Timing:** it starts on the exact word where she mentions the item and ends when she moves on. Use a soft 6–8 frame dissolve in and out, or a straight cut.
- Screenshots are cropped cleanly, sharp, with rounded corners (about 16 px). No tilt, spin, shadow-heavy cards or bouncing.
- Captions stay in the same place and must not overlap the screenshot.

## Orbit: only for a real "reveal" moment
Use a slow, smooth camera orbit (a 15–25° turn with gentle parallax) only for one hero moment: revealing a product, an app on a phone, or a finished result. At most once per video, 1.5–3 seconds long, eased in and out. Never for decoration.

## Picture: sharp, crisp, clean
- Keep the original resolution. Export 1080×1920 (9:16), at the source frame rate (30 fps, or 25 if shot that way).
- Light natural grade only: correct white balance and exposure, a touch of contrast, and true-to-life skin tones. No heavy filters, LUT looks or colour casts.
- Light sharpening for crispness. Using ffmpeg: `unsharp=5:5:0.6:5:5:0.0`. Increase it slightly only if the footage is soft. Never so much that it creates halos.
- Light noise reduction only if the footage was shot in low light (`hqdn3d=1.5:1.5:6:6`), applied before sharpening.
- Encode at high quality: H.264, `-crf 18`, `-pix_fmt yuv420p`, `-movflags +faststart`. Her laptop is low-powered, so use `-preset veryfast` or `fast` and render one video at a time.

## Sound
- Clean, clear voice, normalised to about -14 LUFS, with light noise reduction if needed.
- Music is optional: soft and minimal, at -28 to -32 dB under her voice, and only if it suits the mood. No sound effects.

## Workflow
1. **Find the files.** List the video and any screenshots in the folder she names. Confirm which is which before editing.
2. **Transcribe** with word-level timestamps (for example Whisper) and show her the transcript.
3. **Edit plan.** Show her a short plan before rendering:
   - what will be trimmed
   - where any split screen goes (the transcript line plus the screenshot)
   - whether an orbit is needed and why
   - the caption colour (hex)
4. **Preview.** Render a few still frames or a 5–10 s sample so she can check the look.
5. **Render** the full video and confirm the export finished. Tell her the file name and where it is saved.

## Checklist before delivering
- [ ] Opens straight on her hook. No title card added.
- [ ] Only mistakes, retakes and long silences cut. Natural flow kept.
- [ ] No pop-up cards, stickers, emoji, keyword pops, zooms or sound effects.
- [ ] Captions in small Poppins, low in the frame, clear of the platform buttons, in white or one accent from her outfit.
- [ ] Split screen and orbit used only where the content needs them.
- [ ] Picture sharp and crisp, with her natural look.
- [ ] Voice clean at about -14 LUFS.
- [ ] 9:16, 1080×1920 MP4 saved where she asked.
