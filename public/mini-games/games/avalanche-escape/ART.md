# Avalanche Escape — cartoon arcade art direction

AI-generated original scenery and transparent character/obstacle artwork, created for this game in November 2026. Local WebP assets need no external image service at runtime. Combined cartoon artwork is about 91 KB.

Direction: bright cartoon video game art, chunky rounded forms, bold navy outlines, clean cel shading, turquoise sky, purple-blue mountains, teal spruce edges and a spacious pale cyan piste. The orange-jacketed skier has an oversized teal helmet and blue skis; the outlined snowball, purple rock and spruce share the same simple arcade style.

AI prompt briefs: a portrait cartoon alpine game background with the central snow lane unobstructed and no baked-in UI; a transparent 2x2 sprite atlas containing a rear-view cartoon skier, snowball, snow-capped purple boulder and snowy teal spruce. Generated with the built-in image tool, then cropped and optimized as local WebP assets. Prior painterly artwork remains recoverable in the branch history.

The background was generated as a portrait scene with the mountains in the upper portion and the center clear of hazards. Four isolated sprites were generated in a transparent two-by-two atlas, then cropped, resized and compressed to individual WebP files. No generated text or UI is baked into the art.

The dedicated renderer retains the approved cartoon art and ground-plane perspective. This game now uses its own challenge engine; arcade-five/engine.js remains unchanged for the other games. All rounds last 45 seconds: Warm-up (0–15s), Slalom (15–30s), Final Rush (30–45s). Patterns use wider opening gates, obstacle islands and paired pinch points, with faster approaches and shorter intervals by stage. Gap transitions are bounded and every row has a clear corridor.

Snowflake tokens (25 base points) and one close call per obstacle row (10 base) build a clean-run streak. Every three bonuses raises the multiplier, capped at ×4. Hits subtract 15 and reset the streak; one-second recovery protects against stacked impacts. Passive survival points are not multiplied. Challenge personal bests use a separate storage key so old visual-only scores are not compared against the new scoring rules.

Validation: `node scripts/test-avalanche-escape.mjs` runs 60 deterministic full rounds, verifies corridor clearance and increasing density, and compares guided steering with standing still. All sampled routes are clearable without dash; separate assertions verify multiplier growth/reset, pause and replay. The rendering/control smoke test also covers full-round completion and the event contract.

Review in the game route before merging. This branch is a visual review preview, not a production release.


Boost accelerates approaching obstacles, collectibles, row timing and scrolling scenery together, easing toward 1.65× speed. The round timer stays real-time. Exhausting the reserve requires releasing Dash after recharging to re-arm it, preventing repeated empty-reserve speed pulses. Collectibles are gold tokens with a dark amber six-armed snowflake, drawn locally to stay crisp at small sizes.


Optional blue ramps appear every fourth wave, beginning with the second wave. Riding over a ramp automatically hops; boosting on approach (with the speed factor above 1.35) doubles jump height and extends the airborne distance from 180 to 300 world units. The high gold-snowflake trail follows the long launch arc. Ground tokens award 25 base points and height-gated air tokens award 50. Jump height also clears low hazards, while the normal route remains playable without boost. No extra jump key is required on touch devices.
