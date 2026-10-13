# ELA Crossword Library completion audit

All 25 unique English Language Arts topic sets registered in the current Review Lab runtime catalog have complete crossword packages. The inventory was created before production; it records each source file, source fingerprint, category, completion status, and every output path. No source banks or Review Lab gameplay were changed.

## Coverage

| Measure | Total |
| --- | ---: |
| Runtime ELA topics discovered | 25 |
| Expected packages | 25 |
| Completed packages | 25 |
| Easy PDFs (2 pages each) | 25 |
| Medium PDFs (2 pages each) | 25 |
| Hard PDFs (2 pages each) | 25 |
| Combined PDFs (6 pages each) | 25 |
| Total PDFs | 100 |
| Matching student-page WebP previews | 75 |
| Connected crossword grids | 75 |
| Exceptions or skipped valid topics | 0 |

| Category | Packages |
| --- | ---: |
| Literature & Literary Analysis | 12 |
| Reading & Informational Text | 3 |
| Research, Argument & Media Literacy | 4 |
| Language, Grammar & Vocabulary | 5 |
| Writing & Composition | 1 |

## Authority and exclusions

Authority: `public/review-lab/catalog.js` runtime `QUESTION_SETS`, cross-checked against `question-bank/manifest.json` and actual source files. All 25 manifest ELA entries are active runtime selections, including entries with stale draft metadata; those labels are not a reason to omit playable reusable sets. No category headers, course landing pages, aliases, generated static bank copies, test/demo data, or game-specific banks were counted as separate topics. The existing 76 Social Studies resources remain in the combined manifest; their PDFs, previews and placements are byte-for-byte unchanged.

## Academic audit

All 500 source questions were read as the content guide. Twenty ordered terms per topic define cumulative 10/15/20-entry difficulties. A second pass reviewed scope, definitions, answer uniqueness, answer-revealing wording and competing synonyms. Revisions separated tone from time, imagery from understatement, plot organization from chronology, and complex from compound-complex sentences. Root and affix learning uses readable concepts and familiar applications instead of tiny isolated fragments. No factual corrections to underlying banks were needed. The crossword vocabulary is curricular reinforcement rather than mechanical multiple-choice conversion.

## Validation

- `npm run test:crosswords`: passed for all 101 packages, 404 PDFs and 303 previews, including all 25 ELA packages.
- `python3 scripts/validate-crosswords.py --subject ela`: passed; 100 PDFs open, page counts 2/2/2/6, correct combined page order, 75 matching thumbnails, no student letters, complete keys, correct grid glyphs and numbering, no clipped PDF text. Smallest ELA cell: 13.71 points; clue text: 10 points. Largest ELA preview: 34,142 bytes.
- `python3 scripts/test-crossword-validation.py`: nine corruption tests passed, covering Social Studies and ELA missing entries, wrong letters, duplicate numbering, wrong directions, extra cells and orphan placement.
- Browser test on both libraries: 404 verified PDF downloads, 404 focus previews, 101 pointer-hover checks; category filtering, independent search, pagination and Escape passed. Zero PDF/preview requests at initial load or mobile load; no mobile horizontal overflow; all 404 downloads available without JavaScript; no browser errors.
- `npm run build`: passed.
- `npm run test:question-bank`: passed (275 banks / 5,500 questions).
- `npm run test:question-bank:ela`: passed (25 banks / 500 questions).
- `npm run audit`: seven preexisting unrelated findings, identical to the baseline; zero new findings. Exact findings are in `site-audit.json`. No crossword broken links or missing assets remain.

Visual inspection included Easy, Medium and Hard pages across all five ELA categories, long characterization and argument titles, long clause answers, dense Hard layouts, completed keys, and desktop/mobile library views. Evidence is in `qa/`. The final worksheets have consistent black-and-white branding, readable cells and clues, uncluttered margins, and no clipping or overlap.

## Shared system and site changes

New: `crossword-data/subjects.json`, five ELA editorial files, ELA inventory and audit records, 25 output directories. Shared generation, validation, browser tests and static renderer now support registered subjects. The Print & Play hub and central catalog contain separate searchable Social Studies and ELA sections. The existing JavaScript enhancement scopes search/filter/pagination to each library and lazily displays compact WebP previews on hover/focus. No PDF iframes or startup preview preload. All WWII public URLs remain unchanged.

Tooling: `scripts/build-crosswords.py`, `scripts/render-crossword-library.py`, `scripts/check-crossword-assets.mjs`, `scripts/validate-crosswords.py`, `scripts/test-crossword-validation.py`, `scripts/test-crossword-browser.mjs`. Site files: `public/print-play-games/index.html`, `crossword-catalog.json`, `crossword-library.js`. Shared rebuild instructions: `docs/crosswords/README.md`.

## Topic-to-output mapping

Each linked directory contains Easy, Medium, Hard and complete-set PDFs plus all three previews and `puzzles.json`. Exact individual output paths and source SHA-256 fingerprints are in `inventory.json`.

| Topic | Category | Source | Completed output directory |
| --- | --- | --- | --- |
| Plot and Narrative Structure | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/plot-and-narrative-structure.json` | [`ela--literature-literary-analysis--plot-and-narrative-structure`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--plot-and-narrative-structure/) |
| Characterization and Character Development | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/characterization-and-character-development.json` | [`ela--literature-literary-analysis--characterization-and-character-development`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--characterization-and-character-development/) |
| Theme and Central Meaning | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/theme-and-central-meaning.json` | [`ela--literature-literary-analysis--theme-and-central-meaning`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--theme-and-central-meaning/) |
| Point of View and Narration | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/point-of-view-and-narration.json` | [`ela--literature-literary-analysis--point-of-view-and-narration`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--point-of-view-and-narration/) |
| Literary Conflict | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/literary-conflict.json` | [`ela--literature-literary-analysis--literary-conflict`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--literary-conflict/) |
| Setting, Tone, and Mood | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/setting-tone-and-mood.json` | [`ela--literature-literary-analysis--setting-tone-and-mood`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--setting-tone-and-mood/) |
| Figurative Language | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/figurative-language.json` | [`ela--literature-literary-analysis--figurative-language`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--figurative-language/) |
| Irony | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/irony.json` | [`ela--literature-literary-analysis--irony`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--irony/) |
| Symbolism and Motifs | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/symbolism-and-motifs.json` | [`ela--literature-literary-analysis--symbolism-and-motifs`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--symbolism-and-motifs/) |
| Poetry Analysis | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/poetry-analysis.json` | [`ela--literature-literary-analysis--poetry-analysis`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--poetry-analysis/) |
| Drama and Dramatic Structure | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/drama-and-dramatic-structure.json` | [`ela--literature-literary-analysis--drama-and-dramatic-structure`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--drama-and-dramatic-structure/) |
| Literary Genres | Literature & Literary Analysis | `question-bank/ela/literature-literary-analysis/literary-genres.json` | [`ela--literature-literary-analysis--literary-genres`](../../../public/print-play-games/crosswords/ela/ela--literature-literary-analysis--literary-genres/) |
| Main Idea and Supporting Details | Reading & Informational Text | `question-bank/ela/reading-informational-text/main-idea-and-supporting-details.json` | [`ela--reading-informational-text--main-idea-and-supporting-details`](../../../public/print-play-games/crosswords/ela/ela--reading-informational-text--main-idea-and-supporting-details/) |
| Inferences and Textual Evidence | Reading & Informational Text | `question-bank/ela/reading-informational-text/inferences-and-textual-evidence.json` | [`ela--reading-informational-text--inferences-and-textual-evidence`](../../../public/print-play-games/crosswords/ela/ela--reading-informational-text--inferences-and-textual-evidence/) |
| Informational Text Structures | Reading & Informational Text | `question-bank/ela/reading-informational-text/informational-text-structures.json` | [`ela--reading-informational-text--informational-text-structures`](../../../public/print-play-games/crosswords/ela/ela--reading-informational-text--informational-text-structures/) |
| Analyzing Arguments and Evidence | Research, Argument & Media Literacy | `question-bank/ela/research-argument-media-literacy/analyzing-arguments-and-evidence.json` | [`ela--research-argument-media-literacy--analyzing-arguments-and-evidence`](../../../public/print-play-games/crosswords/ela/ela--research-argument-media-literacy--analyzing-arguments-and-evidence/) |
| Rhetorical Appeals and Persuasive Techniques | Research, Argument & Media Literacy | `question-bank/ela/research-argument-media-literacy/rhetorical-appeals-and-persuasive-techniques.json` | [`ela--research-argument-media-literacy--rhetorical-appeals-and-persuasive-techniques`](../../../public/print-play-games/crosswords/ela/ela--research-argument-media-literacy--rhetorical-appeals-and-persuasive-techniques/) |
| Sentence Structure | Language, Grammar & Vocabulary | `question-bank/ela/language-grammar-vocabulary/sentence-structure.json` | [`ela--language-grammar-vocabulary--sentence-structure`](../../../public/print-play-games/crosswords/ela/ela--language-grammar-vocabulary--sentence-structure/) |
| Grammar and Usage | Language, Grammar & Vocabulary | `question-bank/ela/language-grammar-vocabulary/grammar-and-usage.json` | [`ela--language-grammar-vocabulary--grammar-and-usage`](../../../public/print-play-games/crosswords/ela/ela--language-grammar-vocabulary--grammar-and-usage/) |
| Punctuation and Capitalization | Language, Grammar & Vocabulary | `question-bank/ela/language-grammar-vocabulary/punctuation-and-capitalization.json` | [`ela--language-grammar-vocabulary--punctuation-and-capitalization`](../../../public/print-play-games/crosswords/ela/ela--language-grammar-vocabulary--punctuation-and-capitalization/) |
| Vocabulary in Context | Language, Grammar & Vocabulary | `question-bank/ela/language-grammar-vocabulary/vocabulary-in-context.json` | [`ela--language-grammar-vocabulary--vocabulary-in-context`](../../../public/print-play-games/crosswords/ela/ela--language-grammar-vocabulary--vocabulary-in-context/) |
| Roots, Prefixes, and Suffixes | Language, Grammar & Vocabulary | `question-bank/ela/language-grammar-vocabulary/roots-prefixes-and-suffixes.json` | [`ela--language-grammar-vocabulary--roots-prefixes-and-suffixes`](../../../public/print-play-games/crosswords/ela/ela--language-grammar-vocabulary--roots-prefixes-and-suffixes/) |
| Writing Process and Revision | Writing & Composition | `question-bank/ela/writing-composition/writing-process-and-revision.json` | [`ela--writing-composition--writing-process-and-revision`](../../../public/print-play-games/crosswords/ela/ela--writing-composition--writing-process-and-revision/) |
| Research and Source Evaluation | Research, Argument & Media Literacy | `question-bank/ela/research-argument-media-literacy/research-and-source-evaluation.json` | [`ela--research-argument-media-literacy--research-and-source-evaluation`](../../../public/print-play-games/crosswords/ela/ela--research-argument-media-literacy--research-and-source-evaluation/) |
| Quoting, Paraphrasing, and Attribution | Research, Argument & Media Literacy | `question-bank/ela/research-argument-media-literacy/quoting-paraphrasing-and-attribution.json` | [`ela--research-argument-media-literacy--quoting-paraphrasing-and-attribution`](../../../public/print-play-games/crosswords/ela/ela--research-argument-media-literacy--quoting-paraphrasing-and-attribution/) |

## Change management and release

Branch: `print-play/ela-crossword-library`. Base at review: `b508050c4a130e446f499567c1f66e93328366e8`. Inventory precedes generation in commit history; resources are committed by their five real categories. No unrelated generated index/sitemap/robots changes, Social Studies asset changes, gameplay changes or question-bank changes are included. The full diff and final assets were checked.

Pull request #180 ([Add complete ELA crossword library](https://github.com/box2board/Teach-arcade-structure/pull/180)) was merged. Merge commit: `871e5fcd87e47f1bb6078eb6b658bee94f81bc9f`. GitHub's Vercel status for that main commit reports `success` and “Deployment has completed.” The Vercel deployment dashboard/API was inaccessible to this session due to a team-scope permission error, so the deployment was verified through the successful GitHub status supplied by Vercel.
