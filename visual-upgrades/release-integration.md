# Snow Day Defenders release candidate — 2026-10-29

## Route/source mapping

- Public entry: `/review-lab/snow-day-defenders/`, canonical retained. The existing catalog URL remains unchanged; `?set=` selects a shared topic.
- Launcher: `release-launch.js` uses the existing catalog, searchable picker and question adapter. Loading failure disables recruitment and provides retry; no silent Scientific Method substitution.
- Authoritative squad implementation: `/dev/snow-day-visuals/game.js`, imported by both entry points. Its physical directory is retained to avoid needless asset-path churn; it is intentionally also a runtime dependency of the public entry. Do not remove it as unused development code.
- Public mode supplies `SNOW_QUESTION_SET` before engine import, skips Lab initialization and hides art-test/compare controls. Optional gameplay features still draw exactly five per normal run. The public page omits measurement tooling. Topic changes reload the launcher with the selected URL; restart retains the topic.
- Development route retains Snow Lab, fixtures, before comparison and opt-in measurement.
- Older public engine and assets remain unchanged; its original page is preserved as `legacy-index.html` with noindex. It can be used for rollback; it is not another active implementation of the squad game.

## Preserved behavior

Approved visual/motion work; automatic throwing; 60-second 6+correct recruitment; exact-one projectile casualties; ten-answer rebuilding; same-wave/upgrades/boss retention; whole-squad recovery; random-five dependency rules and all optional modules. Shared banks now feed all three question flows. Scientific Method, Constitution and Linear Equations were exercised with the actual squad engine and simulated renderer.

## Reusable system / release status

Visual System **0.1.0-rc.1** uses the existing shared cues, particle/weather pools, UI animation and explicit quality budgets. No extra framework introduced. Camera, art, motion and snow-specific details stay with the game. See `public/teach-arcade-visuals/docs/README.md` for APIs, assets, fallbacks and next-game guidance.

User approved appearance, motion and gameplay and requested proceeding with release preparation assuming outstanding checks are good. That is not authorization to merge or deploy production. iPhone evidence: Standard 57.414 FPS over 60.386 active seconds, p95 23ms, separate peaks 26 squad / 138 enemies; fixture through wave two. Physical Chromebook, additional quality modes and full normal-run mobile coverage remain unverified. No new visual/GPU approval is claimed from simulated tests. Cloud WebGL previously reported a disabled context.

## Validation

- `node scripts/test-snow-release.mjs`: catalog loading/preset URLs across three topics, change-topic navigation, load failure, hidden development controls, canonical indexing.
- `node scripts/test-snow-visual-benchmark.mjs`: full preserved gameplay suite plus selected-bank recruitment/review/rebuilding with actual game functions; Lab omitted in public mode.
- Syntax and diff checks. Preview deployment build must pass before handoff.

Before production: review the release-route preview, approve its topic selector/layout and normal run. Resolve any merge conflicts against current main while retaining unrelated work, then obtain explicit merge/release authorization. No next benchmark has begun.
