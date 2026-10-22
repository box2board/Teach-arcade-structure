# Shared game tiles

Arcade Review Games uses its public library page as the source for Cabinet titles,
descriptions, launch URLs, symbols, and artwork. The site build runs
`scripts/build-cabinet-catalog.mjs` and regenerates `public/teacher/arcade-catalog.js`.
Do not edit that generated file by hand.

To add artwork, put a normal image inside the game's existing `.art` link in
`public/arcade-review-games/index.html`:

```html
<img src="/assets/images/my-game.webp" alt="Description of the game artwork" loading="lazy">
```

Use a real local image file. The public page and Cabinet both use that path.
Changing its path, alt text, or replacing the file updates both after deployment.
Tiles without artwork keep their symbol. Missing artwork files stop the build.

New games added as public library cards are included during the next build.
Review Lab entries continue to come from `public/review-lab/catalog.js`.
Adding game files without a library listing does not publish a Cabinet entry.
Saved bookmark IDs derive from launch URLs, so artwork and title changes preserve
favorites. Keep launch URLs stable; a moved game needs an explicit ID migration.
