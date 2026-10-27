# Snow Day Defender — validation record

Reviewed 2026-10-26 (America/New_York).

## Passed

- `node scripts/test-snow-visual-benchmark.mjs`: 1,000 deterministic exact-five feature configurations and dependency pairing; automatic fire; recruitment deadline/6+correct formula; wrong/late-answer handling; projectile loss and last-defender recovery; wrong answers add zero rebuild; ten correct answers rebuild; same wave, upgrades and boss retained; Lab override.
- All three effect budgets exercised with real Three.js scene/geometry objects and mocked renderer. Cosmetic ticks leave simulation state unchanged. Static scenery remains instanced (39 batches in the exercised fixture, 119 total scene-root objects including active test entities; not a GPU draw-call measurement).
- Perspective projection checks at 1366×768, 1024×768, 390×844 and 844×390: fort bounds and lateral steering margins fit the canvas. This is geometry evidence, not a rendered/device layout approval.
- `node scripts/test-snow-day-defenders.mjs`: unchanged public game regression suite passes.
- `npm run build`: passes. Its broad generated SEO/site-index changes were discarded from this isolated visual branch; they are unrelated to the benchmark.
- Syntax checks and `git diff --check` pass.
- New gameplay modules/features.js, lab.js and questions.js match the retrieved squad source; before/ retains original gameplay for review. No public game files changed.

## Existing failure outside this change

`node scripts/test-snow-day-launch.mjs` exercises the public topic catalog and passes bank launch checks, then fails at line 23: expected 278 catalog options, actual 390. That hardcoded assertion is already inconsistent with current main's catalog; neither its test nor catalog is changed here.

## Explicit limits

Cloud Chrome cannot create a WebGL context even for the unmodified baseline. It reports `GL_RENDERER = Disabled` and `Error creating WebGL context`. Consequently: no successful rendered gameplay screenshot, GPU FPS, shader compile validation or Chromebook approval is claimed. The original published Site was not modified. Compare the external branch preview in a WebGL-enabled browser.

| Setting | Pixel ratio cap | Snow points total | Impact pool cap | Weather layers | Camera impulse |
| --- | --- | --- | --- | --- | --- |
| Performance | 1 | 48 | 48 | 1 | off |
| Standard | 1.35 | 180 | 160 | 2 | subtle |
| Showcase | 1.75 | 360 | 280 | 3 | subtle, bounded |

No real-time shadows, bloom or postprocessing in any mode. Snowball trails limited to the first 32 live projectiles and disabled in Performance/reduced motion. Pooled particles replace original per-hit mesh allocations. Additional character accessories still increase per-character draw calls; the unbounded gameplay squad is the biggest remaining scaling risk. Do not claim target-device performance based on caps alone.

## Device review still required

1. Open Before and After with matching Snow Lab preset, seed and difficulty (turn Random five off). Recruitment uses a real deadline, so aim for comparable squad sizes; compare wave two and boss as well.
2. Test keyboard steering, touch drag and Space; complete a question round and ten-answer rebuild. Confirm fort, squad and wave HUD never cover actionable enemies.
3. On a typical school Chromebook at its native resolution, play each quality mode for at least one full wave. Capture frame rate, input response and diagnostics at maximum earned squad/crowd density.
4. In browser console, read `snowDiagnostics()` for active particles, geometry/texture count, draw calls, triangles and frameWorkMs. frameWorkMs is CPU frame work, NOT FPS or a GPU benchmark.
5. Repeat Chrome/Safari, tablet landscape and phone portrait; test reduced motion, pause, restart, quality switching and denied storage.
6. Approve the art direction before marking benchmark complete or starting another game.
