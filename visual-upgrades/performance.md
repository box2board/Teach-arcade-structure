# Snow Day Defender — validation record

Reviewed 2026-10-28 (America/New_York).

## Passed

- `node scripts/test-snow-visual-benchmark.mjs`: 1,000 deterministic exact-five feature configurations and dependency pairing; automatic fire; recruitment deadline/6+correct formula; wrong/late-answer handling; projectile loss and last-defender recovery; wrong answers add zero rebuild; ten correct answers rebuild; same wave, upgrades and boss retained; Lab override.
- All three effect budgets exercised with real Three.js scene/geometry objects and mocked renderer. Cosmetic ticks leave simulation state unchanged. Static scenery remains instanced (52 batches in the exercised fixture, 140 total scene-root objects including active test entities; not a GPU draw-call measurement).
- Perspective projection checks at 1366×768, 1024×768, 390×844 and 844×390: squad bounds and lateral steering margins fit the canvas. The closer portrait view intentionally crops fort ends; nearby offscreen enemy counters aid awareness. This is geometry evidence, not a rendered/device layout approval.
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

No real-time shadows, bloom or postprocessing in any mode. Snowball trails limited to the first 32 live projectiles and disabled in Performance/reduced motion. Pooled particles replace original per-hit mesh allocations. Fixed character parts are baked into cached vertex-colored geometry per outfit/type: each creature uses one body draw plus its shadow; each defender uses one body, two animated arms and a shadow. Feature markers/shields remain separate. The unbounded gameplay squad is still a scaling risk. Do not claim target-device performance based on caps alone.

## Device review still required

1. Open Before and After with matching Snow Lab preset, seed and difficulty (turn Random five off). Recruitment uses a real deadline, so aim for comparable squad sizes; compare wave two and boss as well.
2. Test keyboard steering, touch drag and Space; complete a question round and ten-answer rebuild. Confirm fort, squad and wave HUD never cover actionable enemies.
3. On a typical school Chromebook at its native resolution, play each quality mode for at least one full wave. Capture frame rate, input response and diagnostics at maximum earned squad/crowd density.
4. In browser console, read `snowDiagnostics()` for active particles, geometry/texture count, draw calls, triangles and frameWorkMs. frameWorkMs is CPU frame work, NOT FPS or a GPU benchmark.
5. Repeat Chrome/Safari, tablet landscape and phone portrait; test reduced motion, pause, restart, quality switching and denied storage.
6. Appearance and motion have user approval. Complete device validation and final benchmark review before marking complete or starting another game.

## Preview

Branch preview: https://teach-arcade-structure-git-visual-b6cce6-ash-christies-projects.vercel.app/dev/snow-day-visuals/ (Before link opens the retained baseline). Initial preview build reported success through GitHub/Vercel; game HTML returned HTTP 200, no auth wall. The cloud browser reached the exact route and reproduced its WebGL-disabled limitation. Draft PR: https://github.com/box2board/Teach-arcade-structure/pull/260.

## Connected gameplay checkpoint — 2026-10-28

The visual benchmark suite now checks a connected recruitment → review/upgrade → wave two → review/upgrade → scheduled Frost King → victory → restart flow using the actual game functions with a simulated renderer. Correct/wrong review scoring produces the expected two-star reinforcement and one-star damage choices. Pause clears held movement keys; burst cooldown activates; restart resets upgrades/wave and returns to recruitment. Wave timing is advanced and enemies cleared in the harness to reach transitions deterministically: this is not a real-time survival, balance or GPU stress test. Existing independent recovery tests cover fort destruction and squad loss. No gameplay implementation changes were needed.

User approval covers appearance and motion. Physical browser/device checks above remain pending; no FPS claim is made. Shared Visual System stays 0.1.0-preview.
