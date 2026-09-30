# Teach Arcade Side-Scroller Engine V1

Version: **1.0.2**  
Status: **Frozen production core**

## Frozen engine files
- `core.js` — movement, collision, camera, questions, scoring, collectibles, checkpoints, movers, gates, finish/results state.
- `physics-presets.js` — shared physics presets.
- `level-builder.js` — tile/level construction.
- `gameplay-validator.js` — reachability and jump-difficulty QA.
- `visual-validator.js` — placement/anchoring/patrol QA.
- `shell.js` — standardized single-game production launcher and shared viewport overlays for questions/results.

## Game package contract
Every game supplies its own:
1. `level.js` — unique geometry, question positions, hazards, movers, gates, collectibles and finish.
2. `questions.js` — curriculum.
3. `theme.js` — theme metadata, colors, labels and assets.
4. `renderer.js` — topic-specific art/scenery and UI rendering.
5. `game.js` — assembles those pieces into `window.TA_GAME`.
6. `index.html` — standardized shell markup.

## Freeze rule
Production games may consume V1, but should not edit V1 in place. Engine changes that alter the contract or behavior should be developed in `/public/dev/` and released as a new version (for example V1.1 or V2) after regression testing.

## Required QA before publishing a level
- Gameplay QA: zero unreachable required sections.
- Visual QA: zero errors; warnings must be intentionally reviewed.
- Manual playtest on desktop and touch controls.
- Complete all review questions and reach the finish.
- Verify Mission Report values.

## Patch history
- **1.0.1 (2026-09-30):** Question and results overlays are now positioned by the shared engine shell so every V1 game displays them centered in the viewport on desktop and mobile. No game-package contract change.

- **1.0.2 (2026-09-30):** Replaced the always-follow camera with a horizontal dead zone, velocity-based damped look-ahead, eased follow speed, and camera speed cap. Quick direction reversals no longer force immediate camera reversals. Camera recenters cleanly on spawn/respawn. No game-package contract change.
