# Avalanche Escape — alpine art direction

AI-generated original scenery and transparent character/obstacle artwork, created for this game in November 2026. Local WebP assets need no external image service at runtime. Combined artwork is about 226 KB.

Direction: painterly dimensional alpine snow, peach rim light, blue shadows, snowy spruce edges, spacious pale central piste; an orange-parka skier with teal helmet and blue skis, rough snowball, slate granite boulder, and snow-covered spruce.

The background was generated as a portrait scene with the mountains in the upper portion and the center clear of hazards. Four isolated sprites were generated in a transparent two-by-two atlas, then cropped, resized and compressed to individual WebP files. No generated text or UI is baked into the art.

The dedicated renderer retains the shared arcade-five engine unchanged, including 45-second runs, dash reserve, collision positions, collectibles, near misses and scoring. Distant obstacles emerge on the snow plane at the piste horizon, then grow and spread with depth. From world y=340 onward, rendering uses the exact engine coordinates with a +60 vertical offset and full collision radii. Decorative trees never collide. The skier body remains centered on the collision position; the skis extend behind it.

Review in the game route before merging. This branch is a visual review preview, not a production release.
