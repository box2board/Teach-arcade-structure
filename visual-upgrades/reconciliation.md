# Combined Snow Day Defenders baseline

Reconciled 2026-10-27 on `visual-system/snow-day-benchmark`, draft PR #260.

## Authority and source map

Sites get_site confirms project `appgprj_6adcd3f2f49c8191a22687e3fc61a565` is still published at version 7, last updated 2026-10-27T02:22:17Z. Its existing checkout is clean and at `f1745d13fafcbad44d3cab900a3d825a0f76ef38`, matching the handoff. No later Site version was found. The Site is not edited or republished.

| Source | Contains | Role going forward |
| --- | --- | --- |
| Site v7, commit f1745d13 | 60-second recruitment, unlimited earned squad, automatic throwing, 20 optional features, exact-five selection, casualties, harder wave two, reviews/upgrades, same-wave rebuilding, boss retention, Snow Lab | Confirmed gameplay source snapshot; do not separately develop it and assume automatic synchronization |
| Repository public/review-lab/snow-day-defenders/ | Older lane/gear implementation and full shared question-bank adapter | Existing public game; unchanged by this reconciliation |
| Repository public/dev/snow-day-visuals/ | Site v7 gameplay plus village art, staged fort, expressive/batched characters, responsive camera, HUD, pooled particles/weather, quality modes and sound hooks | **Single authoritative combined development implementation** |
| public/dev/snow-day-visuals/before/ | Original v7 snapshot, adapted vendor path | Immutable comparison fixture; never upgrade independently |
| public/teach-arcade-visuals/ | Cosmetic helpers actually exercised by this game | Provisional shared visual candidates, version 0.1.0-preview; approval still pending |

`provenance.json` records source hashes. features.js, lab.js and questions.js remain byte-identical to Site v7. The combined game.js is a surgical visual integration, not a replacement engine. The original Three.js vendor is revision 162 in both workstreams. Regression checks protect the combined gameplay.

## Reconciliation repairs

- Automatic throwing explicitly retained; no manual throw mode added.
- Removed the visual pass's central wave banner. Wave announcements and gameplay notices use the existing bottom-control text.
- Header controls now remain reachable from the opening menu. Snow Lab is locked during recruitment/review/rebuilding to prevent reset/configuration changes interrupting academic flows; it remains available from menu/play/pause.
- Existing source rules preserved: 6+correct recruitment without a 20-player cap; exactly one casualty per successful enemy shot, no associated fort damage; ten correct rebuild answers, same wave/upgrades/survivors and boss retained; zero-squad rebuild restores six.

## Feature status and next steps

All 20 features and six named presets are retained as optional prototype implementations. Their behavior and balance are not declared final. Random-five uses a fixed per-run selection and preserves the freezing/projectile dependency. Local saved combinations and session comparisons retain their original storage behavior.

Scientific Method sample questions remain. The public game's full bank adapter is a reference for a future adapter; it is not falsely represented as integrated here. Next work: rendered review of scale/lighting/attack warnings, touch testing, full-wave Chromebook profiling, then decide on shared-bank integration. Do not start a second benchmark before visual approval.

## Verification

Run `node scripts/test-snow-visual-benchmark.mjs` for combined gameplay, effect budgets, geometry bounds, character batching, source snapshot integrity and notification placement. Real browser rendering, touch control, FPS and feature balance remain pending: the previously available cloud Chrome reports WebGL disabled. Existing public launch test has an unrelated catalog-count mismatch (390 actual vs 278 expected). No production merge or deployment is authorized.

Review URL: https://teach-arcade-structure-git-visual-b6cce6-ash-christies-projects.vercel.app/dev/snow-day-visuals/
