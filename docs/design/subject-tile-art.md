# Subject selection artwork

The subject directory and five subject hubs use a cohesive set of 34 AI-generated
arcade-world illustrations. The homepage reuses the five subject-level assets.
Individual lesson/topic tiles and featured game cards retain their existing design.

## Art direction

Bright stylized 3D miniature adventure worlds, chunky geometry, vivid colors,
floating terrain, winding paths and glowing sparks. Subjects remain recognizable
through focal objects such as a globe, microscope, storybook or historical building.
These are imaginative navigation illustrations, not historical or scientific diagrams.
Titles remain real HTML below each image for legibility and accessibility.

Generated with the built-in image generation tool. Exact prompts are recorded in
`subject-tile-prompts.json`. Assets live in `public/assets/images/subjects/`.

Each image has 384 × 256 and 768 × 512 WebP versions, selected with `srcset`.
Explicit dimensions reserve layout space; lazy loading reduces initial transfer.
Images have empty alt text because the linked title already names their destination.

## Extending the set

Use the same art direction and 3:2 composition. Keep important objects away from
edges, avoid embedded words and preserve clear silhouettes at thumbnail size.
Add an optimized image pair and reference it from the appropriate hub card.
