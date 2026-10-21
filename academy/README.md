# Smart Cleaners Academy

A mobile-first browser game that teaches professional cleaning through interactive training missions. Lesson content is local data and every rule is deterministic, with no AI or paid services. The game is fully playable without an account. Optional free accounts and the business edition run on Supabase's free plan.

## What's playable (MVP)

| Mission | Level | Type | What the player does |
|---|---|---|---|
| Professional Bathroom Cleaning | Beginner | Hands-on room | Inspect the room, choose PPE, pick tools and products from a trolley, clean in a professional order, final walk-through |
| Chemical and Equipment Safety | Beginner (after Bathroom) | Safety decisions | 10 real-job situations: labels, dilution, never-mix rules, surfaces, PPE, storage, equipment, first aid |
| Final Inspection and Quality Control | Professional (after Chemical Safety) | Quality control | Find 8 problems a colleague missed (including a safety hazard) without flagging good work |
| Professional Kitchen Cleaning | Professional (after Final Inspection) | Hands-on room | Green-coded tools, food-safe products, degreaser dwell time, clear before clean, sink last |
| Hotel Turnover Rush | Expert (after Kitchen) | Shift planning | Build an ordered plan for a 55-minute turnover: hazard first, every essential, right order, best extras |
| Professional Judgement | Expert (after Hotel Turnover) | Decisions | Body-fluid spills, unsafe client requests, colleagues without PPE, prioritising, damage, DND, mould |

Also included: main menu, room chooser with locked previews and planned rooms, equipment and chemical safety reference, progress page, 10 achievement badges, and a training-completion certificate for each completed level (clearly labelled as not accredited).

## Run it

```bash
npm install
npm run dev        # local development server
npm run build      # typecheck + build to one self-contained file: dist/index.html
npm test           # engine unit tests (Vitest)
npm run e2e        # full player journey in a real browser, phone and desktop sizes (needs a build first)
npm run e2e:business  # accounts, teams, assignments, reports and admin, against an in-memory backend
npm run artifact   # turns dist/index.html into dist/artifact.html for hosting as a claude.ai Artifact
```

`dist/index.html` is a single file with everything inlined except the Google Fonts stylesheet, so it can be hosted on any static host (Netlify, GitHub Pages, a website folder) or opened directly. The e2e script uses `playwright-core` and a locally installed Chromium; set `CHROMIUM_PATH` if it isn't in `/opt/pw-browsers`.

## Accounts and the business edition

- **Accounts:** free sign-up with name, email and password. Finished missions are saved to the player's training record and merged into their progress on any device. Results made offline are queued and uploaded later. Playing without an account still works; progress then stays on the device.
- **Businesses:** an owner creates a business and gets a 6-character team code and an invite link (`?join=CODE`). Staff join with the code. The owner sees each person's passes, best scores, last activity and safety-critical errors, assigns missions (whole team or one person, optional due date), tracks completion and overdue work, removes staff, and downloads a CSV training report.
- **Admin:** smartgirlfounder@gmail.com is the Academy admin and gets an Admin Dashboard: every account, business, sign-up date, last sign-in, missions passed and recent activity.
- **Security:** enforced in the database with row-level security (see `supabase/`). The publishable key in `src/cloud/config.ts` is meant to be public.
- **Not yet:** email invitations, email confirmation and password resets. These need an email provider (e.g. Resend) and a verified sending domain.
- The offline Artifact preview can't reach Supabase, so accounts only work on the hosted (Netlify) site.

## How the code is organised

```
src/
  engine/            Game rules, no UI code
    types.ts         Mission, task, tool, product and result types
    cleaning.ts      Hands-on room runner: inspect → PPE → clean → final check
    planning.ts      Shift-planning runner: time budget, essentials, ordering, best use of spare time
    scenario.ts      Decision runner for safety situations (choice / multi-select / match)
    inspection.ts    Quality-control runner: find defects, avoid false flags
    chemistry.ts     Never-mix rules (bleach + acid, bleach + ammonia)
    scoring.ts       Shared scoring, stars, pass mark, critical-error cap
    progress.ts      Progress, unlocks and achievements behind a Store interface
  data/              Lesson content only
    equipment.ts     Tools (with colour-code zones), products (chemical family, label text, PPE), PPE
    missions/        One file per mission, plus index.ts (registry + planned rooms)
    levels.ts, achievements.ts
  cloud/             Backend access (Supabase), an in-memory fake for tests, offline record queue
  ui/                Presentation only
    scenes/              SVG rooms (bathroom, kitchen) whose look is driven by "flags" (dirty/clean/defect)
    screens/             Menu, mission and results screens
    app.ts               Navigation and event handling
```

### Safety rules in the engine

- **Never-mix:** every product applied to a surface is remembered. Applying bleach where acid or ammonia products have been used (or the reverse) is blocked and recorded as a critical error.
- **Cross-contamination:** tools marked `crossContamination` (red cloth, toilet brush) used outside their zone, or any tool used in one of its `forbiddenZones` (e.g. a yellow washroom cloth in a kitchen), are a critical error.
- **Food safety:** using a product that isn't `foodSafe` where a food-safe one is needed is explained as a food-safety mistake.
- **Ventilation:** products marked `needsVentilation` can't be used until the ventilation task is done.
- **Safety prerequisites:** e.g. mopping before the wet floor sign is out is a safety mistake.
- **Sequence:** e.g. floor before other surfaces, toilet before sink and shower, are sequence mistakes with explanations.
- **Scoring:** completion, tools, sequence and safety each have their own share. Any critical error caps the score at 49 (pass mark is 60), so speed or a clean-looking room can never make up for an unsafe action. Speed is not scored.
- Each distinct mistake is explained every time but penalised once.

### Adding a room

1. Add a mission file in `src/data/missions/` describing objects, PPE, tools, products and tasks (with `requires`, `safetyRequires` and explanations).
2. Register it in `MISSIONS` in `src/data/missions/index.ts`, and remove it from `FUTURE_ROOMS`.
3. If it needs new artwork, add a scene in `src/ui/scenes/` that draws dirty and clean states from flags, and register it in `src/ui/scenes/index.ts` under the mission's `sceneId`. Existing scenes can also be reused with different flags, as the inspection mission does.

No engine changes are needed for a new room of an existing mission type.

## Assumptions and limits

- **Without an account, progress is per device** (browser localStorage). With an account, finished missions are also saved to Supabase and merged back into progress on sign-in. Achievements stay per device.
- **Colour-coding** follows the common UK convention (red toilets, yellow washroom, blue general, green kitchen). The app says that employers may use their own.
- **Chemistry is simplified** to product families for the never-mix rules. The app tells players to follow labels, safety data sheets and employer procedures.
- **Visuals are 2D SVG illustrations**, not 3D. They change state as the player cleans.
- **Certificates** are game-based training-completion certificates, not accredited qualifications.

## Next milestone

Email for the business edition (Resend + a verified domain): staff invitations by email, email confirmation and password resets. Then more rooms (bedroom, office, hands-on hotel turnover).
