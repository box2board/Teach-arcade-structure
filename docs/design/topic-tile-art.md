# Individual topic tile artwork

The Flat Arcade style extends from subject/course navigation into all 310 individual topic tiles across 33 collection pages: Social Studies (82), Science (85), ELA (58), Fine Arts (51), and Math (34).

## Art direction

Use bold navy outlines, simple centered objects, restrained cel shading, blue/teal with small gold accents, and a quiet pale blue background. Select a topic-specific object or pair. Avoid scenery, floating platforms, decorative clutter, embedded titles, labels, numbers, logos, and photorealistic rendering. Keep history artifacts appropriate to the period and avoid stereotypes. Scientific imagery is simplified navigation art, not an exact diagram.

The approved Flat Arcade science illustration supplies the style reference. Each topic receives a separate built-in image-generation call. Exact prompts and placements are recorded in `topic-tile-flat-prompts.json`.

## Integration

- Assets: `public/assets/images/topics/<subject>-<collection>--<topic>-flat-{384,768}.webp`.
- Each illustration has 384 × 256 and 768 × 512 WebP exports, selected by `srcset` and `sizes`.
- Images reserve their aspect ratio, load lazily, and have empty alt text because their adjacent topic title names the same destination.
- Topic titles and descriptions remain real HTML. The entire card is a single keyboard-accessible link with a visible focus indicator.
- `public/assets/topic-tile-art.css` shares the layout across the different existing card structures, with three columns on larger screens, two on medium screens, and one below 600px.
- Existing subject/course artwork is unchanged.

One existing navigation defect was corrected during integration: World History's World War I tile now points to `world-war-i.html` instead of its parent hub. World History click-tracking attributes and hooks are preserved.
