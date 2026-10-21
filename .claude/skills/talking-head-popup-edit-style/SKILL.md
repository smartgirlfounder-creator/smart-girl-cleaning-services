---
name: "talking-head-popup-edit-style"
description: "Olaitan's video editing playbook: her favourite talking-head pop-up style (word-by-word captions, serif keyword pops, white cards, overlays) plus a cinematic director's toolkit (orbits, split screens, floating cards, layered footage, PiP, parallax, reveals, lighting, synced sound) chosen per video. Use whenever editing or creating any of her videos: tutorials, storytelling, motivational, product demos, Smart Cleaners Academy promos."
---

# Talking-head pop-up edit style (Smart Girl reference look)

Olaitan loves this look. It comes from a creator video she saved as a reference. Use it whenever she asks to edit a talking-head, tutorial, tips or "how I do X" video for TikTok, Instagram Reels or YouTube Shorts, unless she asks for a different style. Copy the techniques only. Never copy the reference creator's name, branding or footage. Every video must carry Olaitan's own Smart Girl content.

## Format
- Vertical 9:16 (1080x1920), 30 or 60 fps, natural warm lighting kept as shot.
- Length usually 45 to 110 seconds.
- Talking head fills the frame. Speaker centred, seated or standing.

## Pacing
- Fast and tight. Cut out every pause, breath, "umm", retake and dead air (jump cuts).
- A visual change every 2 to 4 seconds: a new caption style, a pop-up card, an overlay or a slight punch-in zoom (105 to 115%) on alternate cuts.
- Hook in the first 1 to 2 seconds, with a big pop-up stat or problem statement (e.g. a "60 min" timer card for "it used to take 60 minutes").
- End with a quick wrap-up and call to action (follow, comment a keyword, link in bio).

## Captions (the most important part)
1. **Word-by-word captions.** Show one word at a time (two at most), synced exactly to speech.
   - Font: clean bold sans-serif (Montserrat Bold, Poppins SemiBold or similar), white, with a soft dark drop shadow. No box behind.
   - Size: medium, roughly 6 to 8% of frame width per letter height.
   - Position: moves around for energy. Mostly centre-mid (on the chest), sometimes lower third, sometimes top above the head. Never under the platform UI zones (bottom 20% and right edge).
2. **Keyword emphasis.** Important or emotional words switch to a large *italic serif* font (Playfair Display Italic, DM Serif Display Italic or similar).
   - Colour: warm cream/off-white, or brand accent coral/red for the key word (product names, the main keyword, numbers).
   - Bigger than normal captions (1.5 to 2x) and can overlap the speaker slightly.
3. **Mixed-font title cards.** For the topic title, mix bold white sans with italic serif accent words, e.g. "How I **get** *clients*" with the accent word in coral.
4. **Big numbers.** Stats appear huge in coral serif (e.g. "295K" with "followers" in italic serif underneath).

## Colour palette
- Base: natural warm footage (beige, cream, soft brown). Light warm grade: slightly lifted warmth, gentle contrast, no heavy filters.
- Text: white, cream (#F5EBDD), accent coral/red (#E8584A) for key words.
- Cards: pure white with soft shadow.
If Olaitan gives Smart Girl brand colours, swap the accent colour for hers and keep the rest of the system.

## Pop-ups and overlays
- **White rounded cards** (12 to 20px radius, soft drop shadow) that pop in with a quick scale-up (90% to 100%, 0.15 to 0.25s ease-out) and stay 1.5 to 3 seconds:
  - Timer/stat card: icon + big bold number + small grey caption (e.g. "60 min / to edit one video").
  - Checklist card: small italic serif heading + 4 to 6 items with coral check-circle icons (e.g. "works for: B-roll, voiceovers, UGC videos...").
  - Screenshot card: a phone/app screenshot (chat, notification, results, WhatsApp message, invoice, booking) shown as a floating card on one side of the frame.
- **Picture-in-picture overlays**: screen recordings, B-roll, photos or other clips in a rounded rectangle covering 40 to 60% of the frame, placed beside or over the lower half of the speaker while she keeps talking.
- **Notification-style pop-ups** at the top (like an app notification banner) for "someone messaged me" or "a client booked" moments.
- **Cutaways**: brief 1 to 2 second full-screen cuts to B-roll or another clip, then straight back to the talking head.
- Use pop-ups where they *prove* or *illustrate* what is being said. Do not decorate every second; captions carry the rest.

## Audio
- Keep the voice clean and loud (normalise to around -14 LUFS). Light noise reduction if needed.
- Optional soft background music at -25 to -30 dB under the voice. Subtle pop/whoosh sounds on card entrances.

## Workflow when editing
1. Transcribe the footage with word-level timestamps (e.g. Whisper).
2. Cut silences, fillers and retakes. Show Olaitan the cut list before the final render if it is long.
3. Plan the overlays: list which lines get a pop-up card, an overlay or a keyword pop, and get her OK on the plan for big edits.
4. Build captions, cards and overlays, then export 1080x1920 H.264 MP4.
5. Render one video at a time and confirm each export finished before starting the next. Her laptop is low-powered, so keep exports light (avoid unnecessary 4K or 60fps re-encodes, use `-preset veryfast` with ffmpeg) and tell her which files are done.
6. Make a quick preview (a few frames or a short clip) for her to check before the full batch.

## Creative direction: think like a director, not a template

Edit like a cinematic director, motion designer and social-media editor. Before building any video, decide what this video needs to say, who it is for and how it should feel. Then pick only the techniques that serve that message. The pop-up style above is the default base for talking-head content. The toolkit below adds cinematic moments on top, and each video gets its own creative direction.

### Non-negotiables
- **The message is the hero.** Olaitan, her products and her teaching stay the focus. An effect that competes with what she is saying gets cut.
- **Say what it is in the first second.** Viewers scrolling must know what the video is about or advertising right away. Open with a bold, plain-English headline (for example "LEARN CLEANING BY PLAYING GAMES"), never a vague mystery line on its own. A teaser can still be cinematic, but the promise is on screen from second 0.
- **Preserve her natural appearance.** No face or body reshaping, skin smoothing or beauty filters. Only a light warm grade, as shot.
- **Real products only.** When showing her apps (Smart Cleaners Academy, Sparkle Sweep and others), use real screen recordings or captures of features that actually exist. Never invent screens, scores, features, certificates or URLs.
- **Effect budget.** One signature effect per video, plus two or three supporting techniques. Restraint looks premium; overload looks cheap.
- **Platform safe zones.** Keep text and key visuals out of the top tabs area and the bottom 20% and right edge, where TikTok/Reels put their own buttons and captions.
- **Brand.** Use the smart-girl-brand-colors skill for colours and fonts, but let each video have its own look within it.

### The toolkit, and when to use each technique
| Technique | Use it for | Avoid it when |
|---|---|---|
| **Cinematic camera orbit** (3D turn around a phone, product or object) | Product reveals, app launches, the "hero" moment of a promo | Teaching steps that need the viewer to read details |
| **Floating video cards / postcards** (several clips or photos drifting in depth) | Showing several examples, results, testimonials or ideas at once ("5 rooms we cleaned this week") | There's only one idea to show |
| **Dynamic split screen** (2 or 3 panels, animated dividers) | Comparisons: before/after, wrong way vs right way, amateur vs pro, two products | The two sides aren't directly comparable |
| **Layered footage around the speaker** (clips placed behind or beside her using a background cut-out, with parallax) | Adding context while she talks: her business, a job site, her team | The background would distract from an emotional moment |
| **Picture-in-picture** (rounded card over part of the frame) | Screen recordings, app demos, proof (bookings, messages, invoices) while she keeps talking | The PiP would cover her face or captions |
| **Animated / kinetic text** (pop, scale, word-by-word, mixed fonts) | Hooks, key numbers, lists, calls to action, every video | Paragraphs of text: keep it to a few words at a time |
| **Smooth transitions** (match cut, whip pan, zoom-through, mask/shape wipe, light flash on the beat) | Changing scenes or topics with energy | Every cut: most cuts should be clean jump cuts |
| **Parallax and depth** (foreground, subject and background layers moving at different speeds; soft shadows; depth of field) | Making stills, screenshots and graphics feel cinematic | Fast tutorials where clarity matters most |
| **Dramatic reveal** (light sweep, blur-to-sharp, dark-to-lit, slow push-in) | Results, transformations, launches, the big "after" | Low-stakes moments: save it for the payoff |
| **Lighting effects** (beam, glow, light sweep across glass, haze, coloured rim light) | Premium product and app promos, motivational peaks | Real-life cleaning footage, where it can look fake |
| **Synchronised sound design** (riser into a reveal, hit on each cut, whoosh on card entrances, soft UI clicks on app taps, music peak at the brand moment) | Every video, kept subtle under her voice | Sounds louder than her voice or "childish" arcade effects |

### Choosing by video type
- **Cleaning-business tutorials:** clarity first. Talking head and word-by-word captions, PiP or full cutaways of the real cleaning steps, split screen for wrong vs right method, checklist cards for products and steps. One reveal for the final result.
- **Personal storytelling:** emotion first. Fewer effects, slower pacing, gentle push-ins, layered photos or footage from the story around her with soft parallax, and warm lighting. Serif keyword pops for emotional words.
- **Motivational content:** energy that builds. Kinetic text on the key lines, music swells timed to the message, one dramatic reveal or light moment at the peak, and floating cards for proof or examples.
- **Product demonstrations:** the product is the star. An orbit or 3D reveal of the device, then clean, readable PiP or full-screen real app footage, with UI sounds on taps and a short text label for each feature.
- **Smart Cleaners Academy promos:** a bold promise from second 0 ("Learn cleaning by playing games"), real gameplay inside a phone mock-up, pop-up sticker captions matched to each on-screen moment, a business message ("Train your cleaning team"), and a branded hero reveal and CTA. Use the Midnight Magic palette (violet, lavender, mustard gold).

### Creative workflow
1. **Brief:** write one line for the message, the audience and the feeling.
2. **Creative plan:** list the signature effect and the supporting techniques, with one line on why each fits. Note where each one happens on the timeline. Show Olaitan the plan for big projects before building.
3. **Build:** start from the base style (cuts, captions), then add the chosen techniques.
4. **Preview:** render a few stills or a short clip and check that the message is clear in the first second, the text is readable, the safe zones are respected and her face isn't covered.
5. **Deliver:** export 9:16 1080×1920 H.264 MP4 at about -14 LUFS.

### Named effects catalogue
Olaitan can ask for these by name ("add Snap Zoom and Checklist Pop"). They come from the effect list spoken in reference 1 (see the reference library). The descriptions below are the standard professional meaning of each name, not yet confirmed against the reference's visuals. Refine them when screenshots or the video arrive. Pick effects that fit the message (see "Choosing by video type"), never all of them.

| Effect | What it is | How to build it | Best for in her content |
|---|---|---|---|
| **Orbit** | The camera swings around the subject or product in 3D | Cut her out (background removal) or use a device mock-up on a 3D plane, rotate 20–40° with parallax background | Product and app reveals, the hero moment of a promo |
| **Chat Takeover** | Chat bubbles (WhatsApp/DM style) pop in one by one until they fill the screen around her | Animated rounded bubbles with a pop and a soft "message" sound, real or clearly recreated messages | Client enquiries, "my DMs after I posted this", testimonials |
| **Frame Escape** | She appears inside a framed card or photo, then part of her (head, hand, product) pushes out over the border | Put the cut-out of her on a layer above the frame border, with a slight 3D tilt and shadow | Hooks, "breaking out" moments, introducing a topic |
| **Snap Zoom** | An instant punch-in (about 100→130% in 2–3 frames) on a key word, with a whoosh or hit | Fast scale keyframes, slight motion blur, synced to speech | Emphasis on punchlines, numbers, "this is the mistake" |
| **Checklist Pop** | Checklist items pop in and tick off one by one as she says them | White card, coral or brand check icons, pop sound per tick | Steps, products needed, "what's included" |
| **Headline Storm** | Lots of headline, quote or text cards fly in rapidly around her, overlapping | Staggered cards with random angles and depth, quick in, quick out | Social proof, "everyone is talking about…", trends |
| **Zoom Portal** | The camera zooms into an object (a phone screen, door or window) and comes out into the next scene | Scale into the object until it fills the frame, cross to the new clip, motion blur | Moving from her talking into an app demo or a job site |
| **Growth Curve** | An animated chart line or bars draw upward with a counting number | Animated SVG path plus number counter, brand colours | Business growth, earnings, bookings, before/after numbers (real figures only) |
| **Studio Reveal** | The camera pulls back or lights switch on to reveal her in a set or studio | Start tight or dark, pull back with a light sweep and a riser, then an impact | Episode intros, launches, the big reveal |
| **B-roll Overlay** | Supporting footage plays over or beside her while her voice continues | Full-screen cutaway or rounded picture-in-picture card | Showing the actual cleaning steps, results, products |
| **Paper Cutout** | She (or an object) becomes a sticker with a white paper border, on a textured or collage background | Background removal plus a thick white outline, a drop shadow and a slight stop-motion jitter | Playful, storytelling and kids' or Academy content |
| **Dolly Zoom** | The "vertigo" effect: she stays the same size while the background stretches or shrinks behind her | Cut-out of her on top; scale the background up while keeping her scale fixed | A realisation or shock moment ("then I found out…") |
| **Magazine Cover** | A freeze frame styled as a magazine cover, with masthead, cover lines and her overlapping the title | Freeze frame, big serif masthead behind her cut-out, small headlines | Wins, milestones, "featured" moments, personal brand |
| **Liquid Glass** | Frosted, refractive glass panels holding text or cards (glassmorphism) | Blurred, slightly distorted panel with a light edge highlight over the footage | Premium titles and info cards, app and tech promos |
| **Zoom Throughcut** | A transition that zooms fast through the current shot into the next one | Fast scale-in with motion blur on clip A, scale-out on clip B, whoosh | Energetic topic changes |
| **Green Screen** | She is placed in front of new content: a website, screenshot, app or photo | Background removal, then composite her over the content (her look unchanged) | Reacting to or explaining something on screen |
| **Frame Break** | The video frame cracks, shatters or splits apart to reveal what's next | Split the frame into shards or panels that fly apart, with an impact sound | A big "breakthrough" moment or a chapter change (use rarely) |
| **Digital Zoom** | A slow, smooth crop push-in (about 100→115%) over a sentence | Gradual scale on a still shot | Building tension, emotional or important lines |
| **Phone Mockup** | Footage or an app screen shown inside a realistic phone | A device frame with real screen captures, an optional orbit | App demos, Smart Cleaners Academy, Sparkle Sweep |
| **Checklist** | A complete recap checklist on one card | A static white card with all items, shown for 2–3 seconds | Summaries and the end of a tutorial |

The reference also ended with a comment-keyword call to action ("comment the word EDIT and I'll send you everything"). It's a strong pattern for her own CTAs, for example "Comment CLEAN for my checklist".

### Reference library
Treat references as inspiration to learn techniques from, never as templates to copy. Never copy a creator's name, branding, footage or music.
- TikTok reference 1: https://vt.tiktok.com/ZSgUuBpAk/
- TikTok reference 2: https://vt.tiktok.com/ZSgUVWkt2/

**Status:** the links can't be opened from Claude's environment. Olaitan supplied the transcript of one reference (titled "Click the link in my bio to get all 20 video editing effects…"). It lists the 20 named effects in the catalogue above, about one per second, followed by a comment-keyword CTA. The visuals haven't been seen yet. When the video files or screenshots arrive, update the catalogue with what each effect actually looks like. Don't claim to know the visuals until then.

## Checklist before delivering
- [ ] Viewers know what the video is about within the first second (bold headline or hook)
- [ ] Creative plan followed: one signature effect plus a few supporting techniques, nothing added just for show
- [ ] Her natural appearance preserved; real app screens only
- [ ] Hook visual in the first 2 seconds
- [ ] No dead air or filler words left
- [ ] Word-by-word captions synced and readable, clear of the platform UI zones
- [ ] Keywords in italic serif, the main ones in coral
- [ ] At least one pop-up card or overlay every 5 to 8 seconds where it fits the content
- [ ] CTA at the end
- [ ] 9:16 MP4 exported and saved in the folder she named