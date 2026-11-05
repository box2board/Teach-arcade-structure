# Avalanche Escape — cartoon arcade art direction

AI-generated original scenery and transparent character/obstacle artwork, created for this game in November 2026. Local WebP assets need no external image service at runtime. Combined cartoon artwork is about 91 KB.

Direction: bright cartoon video game art, chunky rounded forms, bold navy outlines, clean cel shading, turquoise sky, purple-blue mountains, teal spruce edges and a spacious pale cyan piste. The orange-jacketed skier has an oversized teal helmet and blue skis; the outlined snowball, purple rock and spruce share the same simple arcade style.

AI prompt briefs: a portrait cartoon alpine game background with the central snow lane unobstructed and no baked-in UI; a transparent 2x2 sprite atlas containing a rear-view cartoon skier, snowball, snow-capped purple boulder and snowy teal spruce. Generated with the built-in image tool, then cropped and optimized as local WebP assets. Prior painterly artwork remains recoverable in the branch history.

The background was generated as a portrait scene with the mountains in the upper portion and the center clear of hazards. Four isolated sprites were generated in a transparent two-by-two atlas, then cropped, resized and compressed to individual WebP files. No generated text or UI is baked into the art.

The dedicated renderer retains the shared arcade-five engine unchanged, including 45-second runs, dash reserve, collision positions, collectibles, near misses and scoring. Distant obstacles emerge on the snow plane at the piste horizon, then grow and spread with depth. From world y=340 onward, rendering uses the exact engine coordinates with a +60 vertical offset and full collision radii. Decorative trees never collide. The skier body remains centered on the collision position; the skis extend behind it.

Review in the game route before merging. This branch is a visual review preview, not a production release.
