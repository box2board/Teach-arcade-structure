# Review Lab question-bank integration

Review Lab's four registered games use one shared catalog: Acorn Dash, Category Clash, Review Pinball, and Snow Day Defenders. This branch adds the recovered permanent library: **250 topic sets, 5,000 questions** (Social Studies 75, Science 100, Math 75). Three existing legacy packs remain available for old links, making 253 runtime choices. The legacy Scientific Method pack has 24 questions; the other two have 20. The 250 portable library sets each have exactly 20.

## Sources and build

Canonical, game-independent JSON remains in `question-bank/{social-studies,science,math}/`, with each subject's recovered manifest. `question-bank/source-hashes.json` records every original topic file's SHA-256. These files were recovered from Teach-Arcade-Social-Studies-Draft.zip, Teach-Arcade-Science-Round-4.zip, and Teach-Arcade-Math-Round-3.zip. The historical manifest's “isolated-unintegrated” status describes the original bank project, not this integration branch.

`node scripts/build-question-bank.mjs` checks manifest identities, unique topic/question IDs, question counts, four distinct nonempty choices, answer indexes, duplicate prompts within a set, and original source hashes. It produces metadata-only `public/review-lab/bank-catalog.js` and identical JSON copies in `public/review-lab/question-sets/library/`. `npm run build` runs this first. Generated assets are checked in for static previews. Only the selected topic's question file is fetched at runtime.

`catalog.js` exports `QUESTION_SETS`, `GAMES`, `setsForGame`, `gamesForSet`, `gameUrl`, and `loadQuestionSet`. The loader maps portable `correctAnswer` to runtime `answer` and prefixes question IDs with the topic ID. Missing authored explanations stay empty; the games display the correct answer. No explanations or question content are invented.

## Selection and engine adapters

The hub supports subject and keyword filters. All four game selectors support subject, category, and topic-name search. Filtering keeps the current topic selected and shows the number of matching alternatives; selecting an alternative changes it. Topic-first links use `?set=<catalog-id>`. Unknown IDs fall back to the normal setup. Load errors preserve retry and selection controls.

- **Acorn Dash:** existing engine samples 12 questions for a run and shuffles choices while remapping answers. Physics and difficulty are unchanged.
- **Snow Day Defenders:** existing adapter shuffles and maps questions to prompts; topic changes reset the academic deck through the existing engine API. All 253 packs pass engine tests.
- **Review Pinball:** shared loader replaces the game-specific global-script loader. A deck is shuffled on each cycle, with four-choice indexes preserved. Tables, controls, physics, and scoring are unchanged.
- **Category Clash:** 20 questions become four selectable columns of five questions. Columns are neutral review groups, not fabricated subtopics; point values are board positions, not calibrated academic difficulty. Legacy 24-question packs use five columns. Final round is disabled for a bank board so all supplied questions appear exactly once. Multiple-choice scoring uses indexes, preserving mathematical signs and symbols. Loading a bank uses its own draft key; “Use my custom draft” restores the original studio draft. Custom boards and the standalone French Revolution edition remain available.

## Adding future topics and games

For a new topic, add portable JSON and a manifest entry under the appropriate subject, update that source's SHA-256 in `source-hashes.json`, then run the build and tests. Manifest counts must match. No game-by-game topic list is needed.

For a new Review Lab engine:

1. Add one entry to `GAMES` with `supportsQuestionBank:true`, its route, title, preview, and mode. Use `setsForGame(gameId)` for the full catalog.
2. Validate a `?set=` preset against that list; offer a native select enhanced with `enhanceTopicPicker(select,sets)` from `topic-picker.js` and include `topic-picker.css`.
3. Await `loadQuestionSet(id)` before enabling launch. On rejection, keep gameplay disabled and offer retry/change-topic. Do not use unvalidated URL paths to fetch files.
4. Consume the normalized `{id,question,choices,answer,explanation}` contract directly, or adapt it at the engine boundary. `prepareQuestionDeck(bank)` supplies cloned, shuffled questions/choices with remapped answers. Never shuffle or mutate canonical files.
5. Use `gameUrl(gameId,setId)` for hub links and test the adapter, topic presets, failure recovery, and choice scoring.

A future game still requires its own adapter and catalog registration; the shared catalog automatically supplies every topic after that. Unmerged prototype branches were not changed or merged.

## Verification and release state

Run `node scripts/build-question-bank.mjs`, `npm run test:question-bank`, `node scripts/test-review-lab.mjs`, `node scripts/test-acorn-dash.mjs`, `node scripts/test-acorn-paths.mjs`, `node scripts/test-snow-day-launch.mjs`, `node scripts/test-snow-day-defenders.mjs`, and the existing Pinball tests. The bank tests check immutable source bytes, generated copies, five shuffle sequences per topic, remapped answers, unique complete boards, and compatibility with all four games.

Work is isolated on `feature/review-lab-question-bank-20261008`, based on main commit `9233169d1cd3dc0a6ae9f700eb5067c2bbdab0b2`. Nothing is merged or deployed. No navigation, themed Arcade Review game banks, active prototype branches, or unrelated files are changed. This work validates integration and source preservation; it is not a new independent factual review of the recovered content.

Additional verification:

- `node --experimental-vm-modules scripts/test-question-bank-http.mjs` exercises the browser's HTTP loading path for all 250 static banks, confirms metadata import does not preload questions, and verifies recovery after network, 404, malformed JSON, and invalid answer-index failures.
- `scripts/test-review-lab-dom.mjs` uses optional JSDOM, installed outside the repository. Set `TEACH_ARCADE_JSDOM` to that installation's `jsdom/lib/api.js` path. It checks hub filtering and deep links, Category Clash's 20-question math board, positive/negative answer scoring, preservation of the original custom draft, and Pinball/Acorn topic launches. Canvas and animation are stubbed; this is not rendered-browser QA.
- The existing engine and physics tests pass. The static build passes. Its unrelated generated search-index/sitemap changes were excluded from this branch.
- Rendered-browser/mobile-fit verification remains pending: the local Playwright browser download returned a truncated archive, and the separate cloud browser cannot reach the local preview. No deployment was created to work around that limitation.
