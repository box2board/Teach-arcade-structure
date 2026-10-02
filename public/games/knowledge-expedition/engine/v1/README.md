# Knowledge Expedition discovery engine, v1 preview

A topic pack supplies the title, scope, learning goals, area palettes, discovery summaries with source links, event ordering, retrieval questions, connection questions, and final explanation prompt. Both WWII entry routes load the same shared model, canvas renderer, and interface. This version replaces random question chests with event-linked discoveries, ordered timeline stations, connection challenges, a collection journal, and a teacher-reviewed final response.

## New editions

Create a JSON pack with `schemaVersion: 1` and a unique `id`; use `content/wwii.json` as the schema example. Point the entry page's `data-pack` attribute at its absolute URL. No WWII facts are embedded in the engine. Each area has an ID, title, subtitle, three palette colors, a terrain (`garden` or `water`), discoveries, and a connection question. Each discovery supplies a unique ID, title, date label, numeric `order`, theater/category label, summary, HTTPS source URL, x/y position, and question. The default schematic canvas world is 1200×800; three discovery positions are provided in the WWII pack. Keep new marker positions away from the renderer's buildings and central station. The map represents an archive exhibit, not historical geography.

Questions use `prompt`, `choices`, `correctIndex`, and `explanation`. A correct discovery response collects the item. Retries are allowed and recorded. All area discoveries are required before its timeline; timeline completion is required before its connection challenge. A correct connection restores the station and unlocks the next area. Revisited areas retain their collected state. Replay creates fresh state without duplicating the rendering loop.

## Results and limits

There is no speed grade or time bonus. Results separately report first-try discovery, chronology, and connection responses. The final explanation requires two distinct discoveries and at least 40 characters; this is completeness checking, not automated quality grading. The explanation is labeled for teacher review. Results can be downloaded as plain text. No account, remote reporting, teacher dashboard, or cross-session persistence exists in this preview. Summaries are authored instructional material with source links, not fictional primary sources.

Run `node scripts/test-knowledge-expedition.mjs` from the repository root to verify gates, retries, chronology, connection prerequisites, reporting, revisit, reset, and schema validation. Browser testing should cover keyboard movement, modal focus, touch movement, all three areas, written response, replay, and the alternate entry route.

## Optimization pass

The renderer lazily caches up to two static backgrounds and draws only the changing scene each frame. Animation stops for dialogs, hidden tabs, and lost window focus; resuming resets frame timing, and repeated activation never creates parallel loops. ResizeObserver handles canvas resizing while paused. Backing resolution is capped at 2× device pixel ratio. The nearest-discovery compass and interaction button update when their state changes, replacing the separate polling timer. WASD works with uppercase keys; reduced-motion preference disables marker pulsing and camera easing.

Timeline arrangements and the written response draft survive closing/reopening their dialogs within the current session; replay clears both. Completing the last discovery opens its station, and completing a station offers a direct next-area action. Area-navigation elements are rebuilt only when area/progression changes. Native dialogs live within the fullscreen element, and compact landscape layouts remove the fixed minimum height that forced page overflow.

Topic validation rejects duplicate area IDs, duplicate ordering values, reserved discovery IDs, malformed choice arrays, and invalid source URLs. Discovery and chronological lookups are indexed when the pack loads. Invalid timeline permutations do not affect attempt counts.

Run `node scripts/test-expedition-rendering.mjs` for a simulated canvas/input test of caching, animation lifecycle, paused resizing, uppercase movement, and replay cycles. These tests complement, rather than replace, browser playtesting.
