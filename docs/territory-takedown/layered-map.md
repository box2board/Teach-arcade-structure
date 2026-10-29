# Layered Territory Takedown board

The Crownlands is a static 1536 × 1024 WebP (519,344 bytes). It contains scenery only. `TT_BOARD` supplies its image, intrinsic dimensions, percentage coordinates, and the existing territory IDs, adjacency and specials. Ownership remains exclusively in game state.

`map-renderer.js` mounts an image and keyed native buttons once per arena/board definition. `game.js` calls its render method, which updates colors, classes, labels, team symbols and badges in place. No map observer, SVG ownership shapes, crop, stretch, or per-turn image replacement remains. Changing the board definition intentionally remounts the board.

Both Scientific Method and French Revolution use the same engine, board, renderer and styles. Their question banks and shared results integration are unchanged. The preexisting board has **21 territories and nine specials**; the previous test and French Revolution markup still described an older 24-territory/six-special board. Those stale assertions and labels are corrected without changing the game rules.

Coordinates use the exact uncropped image box. Tap controls have a 44px minimum target, while visible discs scale from 29px to 67px. Small-screen touch halos can slightly overlap at the closest sites, but visible centers stay separated and all remain inside the map. Team symbols, attacker arrows, target crosshairs, labels and focus outlines supplement color. Animated states respect reduced motion.

## Validation

Run `npm run test:territory`.

- Both question banks: unique prompts and IDs, answer validity, metadata, shared DOM bindings.
- Unchanged 21-territory connected symmetric graph; balanced 2–6-team distribution.
- Actual engine executed in a deterministic VM harness: correct/incorrect attacks, adjacent targets, Push rollback, Bank, shield acquire/block, Double Attack, Challenge difficulty, Stronghold points, Undo, pause/timer, three victory modes, all six team colors.
- Renderer harness verifies persistent image/button identities across captures, Undo, new games and team counts; only the ownership button changes on capture.
- Percentage geometry and minimum targets checked from 272px to 1394px available board widths.
- Browser: two-team setup, keyboard attacker selection, legal-target labels, question dialog, correct answer, shield capture and Bank. Responsive frame measurements confirm 44px phone targets and aligned controls/no horizontal document overflow at 320, 390, 768, 1366 and 1920px.
- Preview browser does not grant native fullscreen; unchanged fullscreen handler requires a supported HTTPS browser for final verification. Preview server asset delivery was intermittent during responsive QA; the embedded review inlines the exact WebP and engine to avoid that infrastructure dependency. Actual device/classroom review remains required before merge.

No main merge or production deployment is authorized by this change.
