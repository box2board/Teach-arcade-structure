# Free Throw Fever arcade revamp

Assisted aim replaces the separate aim slider. Hold the court, Shoot button or Space; release in the green zone. All balls share a 1.15-second full charge and a 65% target. The make window narrows gently from ±22% to ±19% to ±16%; the ±5.5% center is a swish. Each fifth shot is gold for double points without changing timing. The hoop and make window lock during a charge and flight.

The round remains 40 seconds. A shot released before the buzzer resolves afterward. Completion dispatches `sparks:minigame-complete`; the `SparksMinigames.freeThrows` start/pause/resume/getState API remains available. Results include rulesVersion 3. A separate arcade-v3 best-score key avoids mixing scores from the former mechanics.

The background is an original AI-generated cartoon basketball arena, optimized to a 103 KB WebP. Prompt direction: portrait free-throw perspective, chunky cel-shaded architecture, navy/cyan arena lights, polished orange hardwood, colorful abstract spectators; no text, logos, players, ball or hoop. The ball, backboard, net and scoring animation are rendered in code. Canvas DPR is capped at 1.5 and celebration particles at 80.

Validation:

```
node scripts/test-free-throws-arcade.mjs
node scripts/test-free-throws-input.mjs
```

Tests cover release tolerance at all stages, consistent timing, gold/swishes/streaks, cancellation, pause/resume, one completion event, buzzer shots, replay, 10–120 FPS engine timing and a renderer/input smoke run. Browser visual review covers the real page plus 320px and 768px frames; physical phone/tablet hardware has not been tested.
