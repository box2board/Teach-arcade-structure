# Panel Quest — reader engine milestone

Panel Quest is the interactive graphic-novel game. Comic Studio is a separate creation tool. This prototype does not alter the live site, catalog or navigation.

## Play and reproduce

Open `public/prototypes/panel-quest/index.html` in a browser, or serve `public/` and visit `/prototypes/panel-quest/`. The game has no runtime dependencies, network calls, account requirement or backend. Build an offline preview with:

```
node scripts/build-panel-quest-preview.mjs /absolute/path/panel-quest-paris-preview.html
node scripts/test-panel-quest.mjs
```

Browser regression suite (Playwright required):

```
node scripts/test-panel-quest-browser.cjs
```

Optional variables: `CHROMIUM_EXECUTABLE`, `PANEL_QUEST_URL` (offline or hosted URL), and `QA_DIR` (screenshots, not checked in).

## Recovered foundation

The original `panel-quest-paris-preview.html` was found in the user's saved files, not in repository branches. It included a six-cell original comic illustration, ten question tuples, answer shuffling, retry scoring, clue text, two interludes and a summary. Its route variables only changed summary text. Its ending title was a score band; story outcomes were identical. Edition data and engine were separate inline blocks, rather than separate files.

The illustration was preserved, cropped into six individual WebP assets, and reused. The ten-question backbone remains, with chronological order repaired (June 1791 flight precedes September 1791 constitution), clearer prompts, and plausible distractors. New story dialogue and documents are explicitly fictional. The second branch takes place in August 1789 and therefore investigates future constitutional questions rather than publishing the completed 1791 constitution too early.

## Reusable architecture

- `panel-quest-engine.js`: edition validation; scene graph model; stable randomized answer ordering; retries and first-try scoring; idempotent clue grants; decision log; additive relationship/reputation values; flags; conditional ending rules; versioned device storage; shared rendering, evidence dialog, keyboard controls and replay.
- `paris-print-shop.js`: the recovered academic rows plus all edition-specific scenes, dates, dialogue, sources, art descriptions, branching, effects, ending conditions and epilogues.
- `panel-quest.css`: original ink/paper direction, with responsive side-by-side reading, narration overlays, speech panels, varied framing, reduced motion and accessible focus/answer contrast.
- `index.html`: shared reader shell. Its document title, footer and brand are edition-specific integration text.

A scene has a stable ID and a `type`: `question`, `decision`, `dialogue`, `investigation` or `ending`. Destinations use `next`; choices use an `options` array. Investigation items must be inspected before advancing unless marked `optional`. Question scenes reference a question and a clue ID. A condition may require flags, clues, minimum values and/or a minimum first-try count. Ending definitions are ordered by priority, ending with an unconditional fallback.

State stores the current scene, answer permutations and attempts, evidence IDs, flags, values, visited scenes, inspected objects, and decision history. Saves are scoped to edition ID and version. Re-entering a resolved scene cannot award another point or duplicate a clue. Storage failure leaves play available. Saving is device/browser-specific; this is not teacher reporting or cross-device sync.

## Current Paris story

Ten historical questions follow 1789–1799. After three questions, investigate either a tax ledger or a market account. The market route adds a source-attribution dialogue. After six questions, investigate rights and exclusions or an unfinished constitutional planning sheet. Both branches converge, preserving decisions and evidence. A final editorial decision follows the tenth question.

Three cumulative epilogues:

- **The neighborhood's voice:** market source, rights editorial and public final issue, with the relevant evidence and voice value.
- **The keeper of the record:** at least two care points and five first-try correct answers, when the first ending is not selected.
- **A press that keeps asking:** a complete, constructive fallback ending with a replay hint.

## Verification and limits

The model suite explores all 24 route/retry combinations, reaches all three endings, and checks ten resolved questions, no dead ends, stable save round trips, no duplicate rewards, randomized answer order, and reuse with a small non-history edition.

The browser suite performs the same 24 complete runs through actual controls, including retry feedback, reload/resume, evidence dialog/Escape, replay resets, and 250 layout checks. Screens tested: 1366×768, 1280×720, 1024×768, 768×1024 and 390×844. Phone screens intentionally stack and scroll. Chromebook and iPad sizes are browser emulations, not physical hardware tests.

Remaining art limitation: the issue still reuses the original six illustrations. Varying crops, framing and panel treatments improve pacing, but scene-specific artwork and richer multi-panel pages remain a future art pass. Sound is not included. New interaction modules and additional editions should follow the same data boundary.

Historical reference links are included in the edition and visible in the ending's sources disclosure. Relevant chronology: https://revolution.chnm.org/items/show/537 and https://revolution.chnm.org/d/535/.

## Sequential panels and route callbacks — October 22 follow-up

Scene data can now supply `panels` (art or clearly labeled fictional document notes) and conditional `callbacks`, using the existing condition rules. Supporting beats appear below the establishing illustration and dialogue. Question-note text is revealed only after the question is resolved; `beforeText` supplies the unfinished-note state. The same renderer supports other editions without Paris-specific logic.

The evidence dialog now includes the student's decision trail. Three convergence points recall the source/editorial route, and endings explain the cumulative conditions behind the result. Save schema and branch outcomes are unchanged; current saves remain compatible.

Validation: the model suite still passes all 24 route/retry combinations and all three endings. A browser playthrough completed the market → protect source → rights → public route, including reload/resume, question-note reveal, investigations, conditional callbacks, the evidence decision trail and the explained ending. Existing viewport/browser regression results above describe the prior milestone; the full multi-viewport browser suite has not been rerun for this pass. Art remains the original six illustrations, with additional crops and document panels.
