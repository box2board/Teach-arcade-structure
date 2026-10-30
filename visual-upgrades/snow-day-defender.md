# Snow Day Defender benchmark — initial assessment

## Source and scope
- Repository baseline: main `649b3a1d6ba048ee11bd63ccb3a50914b0825a54`.
- Public `/review-lab/snow-day-defenders/` is the older Three.js lane/gear game. Its HTML, CSS, game.js, camera.js, collision.js, creatures.js, gear.js, upgrades.js and waves.js are independent modules. launch.js/question-adapter.js connect the shared Review Lab topic catalog and lazy-loaded question banks. Existing Three.js vendor assets are reusable.
- The latest gameplay is a separate Site, Snow Day Defenders — Squad Prototype, version 7. Its clean existing checkout `/workspace/sites/snow-day-squad` is commit `f1745d1` (full hash in provenance.json). This source includes recruitment, squad loss, exact-five randomized features, harder wave two and fort rebuilding. Preserved under `/dev/snow-day-visuals/`; no public-game replacement.
- `before/` is a review-only snapshot of that same gameplay baseline. Only its Three.js import path is adapted to the repository vendor. The original Site is not edited/pushed/published.

## Before implementation
- Rendering: Three.js 0.162, low-poly mesh characters, instanced fixed scenery, blob shadows, one point-cloud snow layer; no postprocessing. Existing graphics-failure message.
- Weaknesses: repeated box buildings, pale flat road, disconnected scenery, single-row fort that loses entire sections, tiny faces, HUD spread over the playfield, subdued answer feedback.
- Risks: many meshes per live character; unlimited earned squad can increase draw calls; regenerating sprite labels; transient mesh particles allocate on impacts. Preserve existing fixed-scenery instancing and avoid real-time shadows/postprocessing.
- Reusable opportunities: bounded particle pools/weather layers, independent cosmetic RNG, quality presets, small camera impulses, event-based sound hooks, UI cues.
- Leave untouched: features.js rules and all 20 modules, Lab controls, timers, enemy HP/speed/spawn/damage/collision, recruitment formula/deadline, question shuffling/scoring, crate/upgrade rewards, same-wave rebuild resume, win/pause/input flow. Sample Scientific Method questions remain; full public bank integration is future work, not silently claimed.

## Target
A readable, cheerful winter village with blue snow shadows, warm timber cabins, snowy mountain silhouettes, festive flags, substantial brickwork, expressive winter outfits, restrained action feedback and a compact top HUD. Standard targets classroom devices without bloom or real-time shadow maps.

## Approval checklist
- [x] Gameplay regression suite passed after final edits
- [x] Appearance and motion passes approved by user (full benchmark/device sign-off pending)
- [ ] Reusable candidates exercised; extraction finalized after approval
- [x] All performance mode budgets tested (device performance pending)
- [ ] Physical Chromebook / Safari / Chrome tested
- [ ] Mobile/tablet fit reviewed on device
- [ ] Final visual review

This is a candidate benchmark, not a completed catalog rollout. See performance.md for evidence and limitations.

## Enemy outfit pass — 2026-10-27

The Frost King now has his own blue-and-gold ice crown, navy cape, pale fur collar, faceted shoulder armor and chest gem instead of the tank bucket with three spikes. Tanks retain purple buckets and gain shoulder plates, front armor and rivets; runners gain mint skates and a trailing scarf; ordinary snowmen gain earmuffs and a ribbed hat band. Coal smiles and eye glints finish the faces. These are game-specific opaque geometry details batched into the same cached single body mesh per type; the transparent contact shadow stays separate. No additional body draw calls, asset fetches, animation loops or gameplay changes. Triangle counts increase, so actual device cost remains pending.

A separate **Frost King visual test** entry on the opening card shows the boss immediately with nine defenders. Like the existing art fixture, it deliberately bypasses recruitment only for developer review; it is not a normal balanced run. Normal start retains recruitment and the three-wave boss progression. Full regression checks pass; browser WebGL and physical-device visual approval remain outstanding.

## First motion pass — 2026-10-27

User approved the enemy appearance pass (overall animated benchmark/device approval still pending). Game-specific motion.js now owns cosmetic poses: asymmetric mitten throws and body recoil, quick runner strides, heavier restrained boss movement, hit squash/recoil, and fort sections lifting/settling during the existing health easing. No added assets, meshes, particles or render passes; reduced motion neutralizes the added poses, and frozen defenders do not throw visually. Collision x/z, throw cadence, damage, rewards, health and educational flow remain unchanged. Existing body batching and feature source hashes are preserved.

Regression checks exercise unchanged enemy coordinates/HP, neutral reduced-motion poses and settled fort position in addition to the full gameplay suite. The cloud browser's disabled WebGL context still prevents rendered motion review and GPU/FPS measurement. Use the two opening visual-test entries for immediate squad/enemy and boss review. Motion stays game-specific until reviewed; shared candidates remain version 0.1.0-preview.

## Gameplay verification and approval checkpoint — 2026-10-28

User confirmed the appearance and motion work looks good and works. This approves those passes, not unmeasured hardware performance. Status is now device-validation-pending; overall benchmark completion remains open.

Added a connected regression scenario using the actual game functions and simulated interface/renderer: one correct recruitment answer earns seven defenders; pause clears held keys; Snow Burst activates; wave-one completion opens two review questions and a two-star reinforcement choice; wave two opens review with one correct/one wrong and a one-star damage upgrade; scheduled wave-three boss spawns with its existing stats; defeating him wins; restart returns to wave-one recruitment and resets upgrades. Existing tests separately retain exact-ten-answer rebuild, same-wave/upgrades/boss recovery and all five-feature dependency checks. No game source changed in this checkpoint.

Remaining device review: run normal recruitment through all three waves on a Chromebook; test Performance/Standard/Showcase, keyboard and touch, pause/restart, ten-correct rebuilding, portrait/landscape and reduced motion. Record browser/device/resolution and observed frame rate/input behavior. The existing snowDiagnostics().visuals.frameWorkMs measures CPU work only, not FPS. Cloud WebGL remains unavailable; no GPU/browser result is inferred from simulation checks. Shared module extraction stays provisional at 0.1.0-preview until validation is complete. No next game begins.

## Opt-in device measurement — 2026-10-28

Open `/dev/snow-day-visuals/?measure=1`. The header gains **Measure FPS**. Click it, start a normal run or visual fixture, and play. It counts 60 seconds of active gameplay, excluding questions, pauses and hidden tabs. Click **Save FPS report** afterward; clicking during measurement saves a partial report. Repeat separately in Performance, Standard and Showcase. Changing quality resets timing to prevent mixed averages. No gameplay or normal-route controls changed.

The local JSON contains browser/viewport, average requestAnimationFrame FPS, p95 frame interval, sample count/duration, peak squad/enemy counts and start/end diagnostics. No upload, telemetry or browser storage. The 16,384-entry timing buffer is bounded; frame stalls remain included. CPU frameWorkMs stays distinct from cadence. These readings are browser scheduling evidence, not GPU timings or an automatic pass/fail. Record device model plus subjective input/touch response alongside the report. Device validation remains pending; version remains 0.1.0-preview.

## HUD damage contrast fix — 2026-10-29

User screenshot showed pale pink full-panel damage feedback with white HUD labels. The cue used fixed light-theme background colors after the HUD became navy; rapid fort hits could repeatedly show the low-contrast flash. Shared uiCue damage feedback now uses a brief inset coral outline and never overrides background/text colors. Repeated cues cancel the previous pulse; reduced motion cancels it without starting another. Applies to both public and development entries. No gameplay changes. Regression asserts preserved theme colors and cancellation behavior; actual browser/device visual review remains pending.
