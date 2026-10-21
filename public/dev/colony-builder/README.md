# Colony Builder prototype

An isolated, static vertical slice in `public/dev/colony-builder/`. It does not change the Colonial America subject page, existing games, site catalog, or production configuration.

## Prototype architecture

- `index.html` provides the shell and semantic UI.
- `styles.css` handles responsive classroom layouts and the illustrated visual language.
- `mobile.css` provides mobile tap sizing, safe-area spacing, and narrow-screen fixes.
- `startup.js` reports startup failures; the three colony cards are present in the HTML before JavaScript runs.
- `scenarios.js` contains colony profiles and data-driven situations, choices, consequences, delayed effects, and learning notes.
- `game.js` owns the solo simulation state, turn resolution, selection, rendering, and Canvas settlement scene.
- The Canvas settlement is drawn locally with simple vector shapes; its buildings, paths, fields, people, boats, and atmosphere respond to the game state.

The game runs without a build step or external dependencies. Serve the repository root with any static server and open `/dev/colony-builder/` (for example, `python3 -m http.server 8000 -d public`, then `http://localhost:8000/dev/colony-builder/`).

## Prototype loop

Choose one of three colonies, make eight annual decisions, and try to finish with a settlement that is prosperous, fed, stable, populated, and able to navigate relationships with nearby Indigenous communities. One resource is never enough: food is consumed each year, trade and growth can create new pressures, and some choices create delayed effects.

This is a gameplay prototype, not a complete historical treatment. Scenarios identify specific regional communities where possible. Slavery, indentured servitude, land seizure, and epidemic disease are addressed in context and are not represented as cute bonuses or purchasable upgrades.

## iPhone preview repair

The uploaded standalone preview's inline `scenarios.js` and `game.js` match the recovered prototype. No relative scripts are missing from that file. At a 390px touch viewport, Chromium renders three working colony choices with scripts enabled and the original empty picker with scripts disabled. This reproduces the symptom but cannot establish which restriction the original iPhone viewer applied. Use the hosted browser preview on iPhone; downloaded-file viewers may suppress JavaScript entirely.

Run `node public/dev/colony-builder/build-preview.mjs` from the repository root to regenerate the standalone preview. It inlines all scripts and styles. The regenerated file does not request external fonts or assets.

The repaired version keeps three disabled cards plus clear startup instructions when scripts cannot execute. It enables the cards only after initialization. It also separates the picker keyboard event from the first decision, provides a ResizeObserver fallback, and returns “Start a new colony” to the picker.
