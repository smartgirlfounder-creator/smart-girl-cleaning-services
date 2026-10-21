# Smart Cleaners Academy

A mobile-first browser game that teaches professional cleaning through interactive training missions. It has no backend, no accounts and no paid or AI services: lesson content is local data, and every rule is deterministic.

## What's playable (MVP)

| Mission | Level | Type | What the player does |
|---|---|---|---|
| Professional Bathroom Cleaning | Beginner | Hands-on room | Inspect the room, choose PPE, pick tools and products from a trolley, clean in a professional order, final walk-through |
| Chemical and Equipment Safety | Beginner | Safety decisions | 10 real-job situations: labels, dilution, never-mix rules, surfaces, PPE, storage, equipment, first aid |
| Final Inspection and Quality Control | Professional (unlocks after both Beginner missions) | Quality control | Find 8 problems a colleague missed (including a safety hazard) without flagging good work |

Also included: main menu, room chooser with locked previews and planned rooms, equipment and chemical safety reference, progress page, 7 achievement badges, and a training-completion certificate (clearly labelled as not an accredited qualification).

## Run it

```bash
npm install
npm run dev        # local development server
npm run build      # typecheck + build to one self-contained file: dist/index.html
npm test           # engine unit tests (Vitest)
npm run e2e        # full player journey in a real browser, phone and desktop sizes (needs a build first)
npm run artifact   # turns dist/index.html into dist/artifact.html for hosting as a claude.ai Artifact
```

`dist/index.html` is a single file with everything inlined except the Google Fonts stylesheet, so it can be hosted on any static host (Netlify, GitHub Pages, a website folder) or opened directly. The e2e script uses `playwright-core` and a locally installed Chromium; set `CHROMIUM_PATH` if it isn't in `/opt/pw-browsers`.

## How the code is organised

```
src/
  engine/            Game rules, no UI code
    types.ts         Mission, task, tool, product and result types
    cleaning.ts      Hands-on room runner: inspect → PPE → clean → final check
    scenario.ts      Decision runner for safety situations (choice / multi-select / match)
    inspection.ts    Quality-control runner: find defects, avoid false flags
    chemistry.ts     Never-mix rules (bleach + acid, bleach + ammonia)
    scoring.ts       Shared scoring, stars, pass mark, critical-error cap
    progress.ts      Progress, unlocks and achievements behind a Store interface
  data/              Lesson content only
    equipment.ts     Tools (with colour-code zones), products (chemical family, label text, PPE), PPE
    missions/        One file per mission, plus index.ts (registry + planned rooms)
    levels.ts, achievements.ts
  ui/                Presentation only
    scenes/bathroom.ts   SVG room whose look is driven by "flags" (dirty/clean/defect)
    screens/             Menu, mission and results screens
    app.ts               Navigation and event handling
```

### Safety rules in the engine

- **Never-mix:** every product applied to a surface is remembered. Applying bleach where acid or ammonia products have been used (or the reverse) is blocked and recorded as a critical error.
- **Cross-contamination:** tools marked `crossContamination` (red cloth, toilet brush) used outside their zone are a critical error.
- **Ventilation:** products marked `needsVentilation` can't be used until the ventilation task is done.
- **Safety prerequisites:** e.g. mopping before the wet floor sign is out is a safety mistake.
- **Sequence:** e.g. floor before other surfaces, toilet before sink and shower, are sequence mistakes with explanations.
- **Scoring:** completion, tools, sequence and safety each have their own share. Any critical error caps the score at 49 (pass mark is 60), so speed or a clean-looking room can never make up for an unsafe action. Speed is not scored.
- Each distinct mistake is explained every time but penalised once.

### Adding a room

1. Add a mission file in `src/data/missions/` describing objects, PPE, tools, products and tasks (with `requires`, `safetyRequires` and explanations).
2. Register it in `MISSIONS` in `src/data/missions/index.ts`, and remove it from `FUTURE_ROOMS`.
3. If it needs new artwork, add a scene in `src/ui/scenes/` that draws dirty and clean states from flags, and pick the scene by `sceneId` in `screens/play.ts`. The bathroom scene can also be reused with different flags, as the inspection mission does.

No engine changes are needed for a new room of an existing mission type.

## Assumptions and limits

- **Progress is per device.** It's stored in the browser's localStorage. Clearing browser data erases it, and it doesn't sync between devices or people. `engine/progress.ts` takes a `Store`, which is where cloud-saved accounts would plug in later.
- **Colour-coding** follows the common UK convention (red toilets, yellow washroom, blue general, green kitchen). The app says that employers may use their own.
- **Chemistry is simplified** to product families for the never-mix rules. The app tells players to follow labels, safety data sheets and employer procedures.
- **Visuals are 2D SVG illustrations**, not 3D. They change state as the player cleans.
- **Certificates** are game-based training-completion certificates, not accredited qualifications.

## Next milestone

Kitchen mission (green-coded tools, food-safe products, degreasing) using the same cleaning engine, then Expert-level timed scenarios. After that, a business edition: accounts, staff invitations, assigned missions and training records. That needs a backend, and is deliberately not started yet.
