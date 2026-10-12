# Crossword production system

The authoritative inventory is the Social Studies selection from `QUESTION_SETS` in `public/review-lab/catalog.js`, including portable manifest banks and the independent Constitution Basics starter bank. The current inventory contains 76 unique bank IDs. Different U.S. and global war banks are not aliases: their question content and learning scope differ.

## Editorial content

`crossword-data/social-studies/*.txt` contains twenty ordered `Answer|Clue` records per topic. The first ten are Easy; the first fifteen are Medium; all twenty are Hard. This order is curricular, not a placement optimization. Normalization strips spacing, punctuation, and diacritics for the grid while retaining readable answer-key spelling. Each inventory record identifies the actual source and its SHA-256 fingerprint.

## Rebuild

Install Python dependencies with `python3 -m pip install -r scripts/crossword-requirements.txt`. From the repository root:

```
npm run build:crosswords
npm run test:crosswords
python3 scripts/test-crossword-validation.py
npm run build
npm run test:question-bank
npm run audit
```

The ordinary static build checks inventory coverage and asset freshness without regenerating PDFs or requiring Python. Regeneration is an explicit editorial operation. The generator uses deterministic seeds, bounded retries, legal crossing placement, independently verified maximal runs, and fail-closed layout bounds. It reports exceptions while continuing other topics, then exits nonzero if any failed. Never publish a partial catalog.

Each topic produces three two-page Letter PDFs, one six-page combined PDF, three WebP thumbnails rendered from student pages, and placement metadata. The four preexisting WWII URLs remain unchanged. PDFs are print-friendly black and white. The measured minimum cell size and largest thumbnail appear in `validation.json`.

## Website and previews

`crossword-catalog.json` is the central manifest. `render-crossword-library.py` produces static resource cards between marker comments on the existing Print & Play hub. Search, course filters, and twelve-card pagination progressively enhance those cards. Downloads remain usable without JavaScript. One shared popup loads only thumbnail images on hover or keyboard focus; Escape dismisses it. Mobile never loads thumbnails. No hidden PDF iframes are used.

## Browser checks

Install Playwright and its Chromium browser in a development environment. Run `node scripts/test-crossword-browser.mjs`; it starts and stops a local Python HTTP server automatically. Set `CROSSWORD_TEST_ORIGIN` to test an already-running local origin instead. Set `CROSSWORD_CHROMIUM_PATH` to use a nondefault installed Chromium executable. The test checks every download and focus preview, real pointer hover for every topic, all course counts, pagination, search, Escape, mobile width, no preload requests, and no-JavaScript downloads.

## Future subjects

Create editorial lists and an inventory from the future subject's authoritative runtime catalog. Reuse the placement/PDF/validation routines and static card renderer. Extend the output subject path and labels before generating another subject; do not pretend other subjects have been implemented already.

## Existing repository limitations

The site-wide audit has seven preexisting issues on unrelated pages, recorded in the completion report. Build scripts also refresh stale global content indexes, sitemap timestamps, and hostnames. Those unrelated generated changes are deliberately excluded from this PR; they are not needed for this static download library. No deployment or merge is part of this task.
