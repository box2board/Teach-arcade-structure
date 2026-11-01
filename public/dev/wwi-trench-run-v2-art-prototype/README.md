# WWI Trench Run v2 — prototype art asset library

This directory is intentionally isolated from the live WWI Trench Run v2 implementation.

## What is here
- `assets/asset-library.svg` — reusable SVG symbols. Every game element has a stable `id`.
- `assets/manifest.json` — grouped asset registry for loaders/tooling.
- `index.html` — prototype catalogue + composed-scene validation page.

## Usage
HTML/SVG:
```html
<svg viewBox="0 0 256 256">
  <use href="assets/asset-library.svg#barbed-wire"></use>
</svg>
```

JavaScript-created SVG:
```js
const use = document.createElementNS('http://www.w3.org/2000/svg','use');
use.setAttribute('href','assets/asset-library.svg#soldier-run-1');
```

## Implementation rules
1. Do not point the live game at this library until the prototype is approved.
2. Preserve stable IDs once prototype game code begins using them.
3. Character run frames are `soldier-run-1` through `soldier-run-6`.
4. Background symbols use `viewBox="0 0 1024 256"`; HUD plaques use wide view boxes; most other assets use `0 0 256 256`.
5. Assets are vector, browser-native, transparent where appropriate, and can be recolored/refined without changing game logic.

## Current status
This is a functional prototype asset pack derived from the approved art direction. It is deliberately separate from the original game and can be iterated safely before any replacement work.
