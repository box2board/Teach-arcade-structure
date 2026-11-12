# Free Throw Fever arcade revamp

Hold the court, Shoot button or Space. The meter rises once per shot and caps at full power. Release while the needle is in green. Warm-Up uses a fixed target and a 391 ms make window. Game Time starts at 9 seconds with a faster charge, shifting targets and a 204 ms window. Clutch Time starts at 25 seconds with a 120 ms window and a narrower swish zone. The target and charge speed lock when a shot begins. Every fifth shot is worth double points.

The round remains 40 seconds. A shot released before the buzzer resolves afterward. Completion dispatches `sparks:minigame-complete`; the `SparksMinigames.freeThrows` start/pause/resume/getState API remains available. Results include rulesVersion 5. A separate arcade-v5 best-score key avoids mixing scores from the former mechanics.

The background is an original AI-generated cartoon basketball arena, optimized to a 103 KB WebP. Prompt direction: portrait free-throw perspective, chunky cel-shaded architecture, navy/cyan arena lights, polished orange hardwood, colorful abstract spectators; no text, logos, players, ball or hoop. The ball, backboard, net and scoring animation are rendered in code. Canvas DPR is capped at 1.5 and celebration particles at 80.

Validation:

```
node scripts/test-free-throws-arcade.mjs
node scripts/test-free-throws-input.mjs
```

Tests cover release tolerance at all stages, one-pass charging, gold/swishes/streaks, cancellation, pause/resume, one completion event, buzzer shots, replay, 10–120 FPS engine timing and a renderer/input smoke run. Browser visual review covers the real page plus 320px and 768px frames; physical phone/tablet hardware has not been tested.
