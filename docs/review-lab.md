# Review Lab

Review Lab lives at `/review-lab/`, linked from a homepage activity tile. Users can browse games or topics. Acorn Dash is the first solo game; Scientific Method is the first approved topic, with 24 questions in its bank and 12 randomly selected per run. Draft Social Studies banks remain outside the catalog.

`public/review-lab/catalog.js` owns game metadata, approved topic metadata/loaders, and explicit compatibility. `question-banks.js` validates the common multiple-choice schema independently of gameplay. Topic files live in `question-sets/`; registering a future topic updates the hub and compatible game selectors together. A future game supplies its own page, image, mode, question count, and supported set IDs in the catalog.

Topic-first links carry `?set=<approved-id>` into the game. Acorn Dash validates that preset against its compatible catalog, shows the selected topic on its difficulty screen, and starts without repeating topic selection. Game-first launches retain the difficulty → topic → start flow. Unsupported URL topic IDs fall back to normal selection. Loading failures keep the setup usable with retry controls.

Acorn Dash's public page is `/review-lab/acorn-dash/`. Its approved engine remains at the existing module paths; it reads the shared question catalog through compatibility modules. The old `/arcade-review-games/crossing-quest/` page redirects while preserving URL parameters. Its header returns to Review Lab, and site search indexes only the canonical game entry. Sitemap generation automatically includes Review Lab's indexable pages.

No account, teacher assignment, multiplayer, or saved classroom reporting is implemented. Run summaries remain on the player's screen. Homepage changes add only the requested tile; other collections stay in place.

Validation: `node scripts/test-review-lab.mjs`, `node scripts/test-acorn-dash.mjs`, `node scripts/test-acorn-paths.mjs`, `npm run build`, and browser checks covering homepage discovery, game-first/topic-first launch, invalid presets, redirects, setup failure/retry, back navigation, and mobile fit.

## Category Clash migration

Category Clash now lives at `/review-lab/category-clash/`, including its existing custom-board studio, shared engine/styles/sample pack, and French Revolution edition at `french-revolution/`. Its engine and question files are unchanged, including local draft storage keys. Vercel permanently redirects the old Category Clash path and all descendants (pages and assets), preserving bookmarks and asset references. The Arcade Review Games hub no longer lists these two entries.

The Review Lab game card launches the existing studio; its French Revolution link launches the prepared edition. This migration does not connect Category Clash to the shared multiple-choice bank catalog yet. Its `questionSetIds` stays empty so topic-first browsing does not promise unsupported bank selection. Acorn Dash remains connected to Scientific Method. Future topic integration should adapt shared banks to Category Clash’s category-board format as separate work.
