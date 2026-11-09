# Panel Quest — student and teacher gameplay pass

Panel Quest is the interactive graphic-novel game, separate from Comic Studio. The isolated prototype is under `public/prototypes/panel-quest/`; no live catalog, navigation or games change.

## What the role-based playthroughs exposed

These are simulated student/teacher walkthroughs and browser checks, not a classroom study.

| Perspective | Observed hole | Revision |
| --- | --- | --- |
| Student rushing through | Could finish without ever using the evidence file. | Three publication tasks require linking gathered evidence to specific claims. Unrelated evidence cannot publish. |
| Student investigating | Source inspection awarded a note but led to no work product. | The commissioned pages use the ledger/market and rights/constitution routes. Completed pages can be read in the ending. |
| Student making choices | Consequences were hidden until the end; witness anonymity did not affect any printed material. | Immediate consequence text, named witness with permission, and actual named/anonymous attribution in the final page. |
| Student retrying | A wrong answer immediately displayed the whole correct explanation. | Conceptual retry hints, an optional context note, full explanations after resolving the question, and a record of context use. |
| Teacher assessing | First-try score and completed questions could be mistaken for learning evidence. | A learning record contains claims, selected sources, student explanations, practice corrections, evidence-check attempts and context use. Written reasoning is explicitly for teacher review. |
| Teacher following history | The monarchy disappeared between 1791 and 1793; the Directory appeared only when overthrown. | Briefing and chapter transitions explain elapsed time, republic, execution, fall of Robespierre, and establishment of the Directory. |
| Teacher examining endings | Hidden care/first-try thresholds could produce an archive ending after choosing public publication. | Endings respect the final audience choice and earlier editorial/source route. Practice corrections never bar an ending. |
| Laptop user | Adding the completed page to the whole form pushed Continue below the fold. | Compact page proofs after publication, source details on demand, and screen-fit checks. |

## Play and reproduce

Open `public/prototypes/panel-quest/index.html` directly in a browser, or serve `public/` and visit `/prototypes/panel-quest/`. No runtime dependencies, network calls, login or backend are required.

```
node scripts/build-panel-quest-preview.mjs /absolute/path/panel-quest-paris-preview.html
node scripts/test-panel-quest.mjs
node scripts/test-panel-quest-browser.cjs
```

The browser suite requires Playwright. Optional environment variables: `CHROMIUM_EXECUTABLE`, `PANEL_QUEST_URL`, and `QA_DIR` for local screenshots.

## Current gameplay

Players receive a commission to produce three evidence-backed pages:

1. **Why anger grew:** identify the financial crisis and use either the ledger/inequality route or the market/hardship route.
2. **Promises and limits:** support national sovereignty and the selected rights/exclusion or constitutional-limits emphasis.
3. **Power, crisis and a new order:** connect the republic and Napoleon's coup to notes from the later chapters.

Each page has two claims, source selectors, source-reading details and a short written connection. Evidence links are validated against relevant collected notes. A brief explanation is required, but its reasoning is not auto-graded; teacher review remains necessary. Draft links and writing survive reload. Valid publication grants one page exactly once. Printed pages and a downloadable text learning record remain available at the ending.

The ten historical question scenes remain guided review. Optional context notes support unfamiliar content. They are not advertised as an independent mastery assessment. A teacher guide on the cover includes objectives, estimated duration, prerequisites, discussion questions and assessment limits.

The story spans 1789–1799. Fictional characters, testimony, documents and personal outcomes are labeled separately from historical context. Madeleine's attribution choice affects the printed first page. The original six illustrations remain; additional scene-specific art and stronger character dramatization are still needed.

Three cumulative epilogues remain:

- **The neighborhood's voice:** public audience, market investigation and rights lead, after publishing three supported pages.
- **The keeper of the record:** archive audience after publishing three supported pages, regardless of practice errors.
- **The neighborhood's chronicle:** the other public editorial combinations.

## Reusable architecture

- `panel-quest-engine.js`: validated scene graph, shared renderer, question practice, stable answer shuffling, evidence inventory, inspections, decisions, flags, values, conditional endings, publication drafts/checks, learning record, keyboard controls, replay and versioned device storage.
- `paris-print-shop.js`: all story/subject text, dates, questions, context, characters, scenes, evidence, claims, acceptable source mappings, route consequences, ending rules, art, teacher guide and reference links.
- `panel-quest.css`: responsive comic reader, narration/speech, source details, publication form and proof, finished pages, readable answers, focus and reduced motion.
- `index.html`: reader shell and edition integration text.

Scene types: `question`, `decision`, `dialogue`, `investigation`, `publication`, `ending`. Publication claims may have conditions based on flags; each defines acceptable evidence IDs. The shared engine checks only collected evidence and does not hardcode Paris-specific matches. Scene effects apply once when a page is published.

State includes scene, answer permutations/attempts, evidence, flags/values, inspected objects, context support, decisions, visited scenes, publication drafts, written explanations and evidence-check attempts. This gameplay pass uses save version 3, separate from prior version 2 prototype saves. Saves are local to a browser/device. There is no teacher dashboard sync or automated grading of writing.

## Validation

The model suite traverses all 48 route/retry combinations, including wrong-first answers, and confirms ten question resolutions, three supported pages, all three endings, no dead ends, stable save round trips, no duplicate rewards, rejection of unrelated/invented evidence, and consistent public/archive outcomes independent of practice score. A second non-history edition verifies model reuse.

The browser suite performs the 48 complete paths using actual controls. It checks reload/resume of answer order and publication writing, blank-page rejection, source selection, publication, evidence dialog/Escape, finished pages, learning-record download, replay resets, and layout at 1366×768, 1280×720, 1024×768, 768×1024 and 390×844. Phone layouts stack and scroll; device sizes are emulated rather than tested on physical hardware.

Reference links are included in the edition and ending, including the French National Assembly's account of the Convention/Directory and CHNM's Constitution of Year III. The original prototype's illustrations and historical question backbone were preserved.

## Preserved concurrent comic-panel work

A newer commit on this same prototype branch added data-driven sequential art/document panels, conditional route callbacks, an evidence-dialog decision trail and ending explanations. Those changes were preserved in this pass. Ending explanations were updated to match the new score-independent publication rules. Document panels can grow with their text instead of clipping longer fictional source notes.

## Character and narrative revision

`paris-print-shop-story.js` supplies an edition-specific narrative layer after the original content file. Laurent's motive is keeping the shop and its standards alive; Camille wants readers rather than untouched records; Madeleine controls how her testimony is attributed. The opening paper bill and limited print run establish the cost of publishing. The apprentice earns responsibility across the decade instead of remaining an anonymous quiz-taker.

After the 1793 question, a new controlled branch asks whether to seal and catalogue originals or prepare anonymous reading copies. Both protect unpublished identities and preserve verified claims; one favors source context and the other access. They have separate follow-up scenes, exclusive clue IDs, callbacks and final character epilogues. A previously published name is explicitly not treated as something that can be erased. The fictional visitor and workshop incidents are not claims about a documented historical shop or legal rule.

The shared renderer now supports named dialogue lines, conditional presentation variants and edition-defined epilogue beats. These features contain no Paris-specific rules. The chosen ending and learning record include the character consequences. No additional graded questions or writing tasks were added; the existing ten questions and three publications remain.

Validation covers 48 route/retry combinations, exclusive source-handling clues, one matching Camille epilogue per outcome, original three endings, writing/resume/replay, and laptop/tablet/phone layouts. Existing version-3 saves remain readable. A saved issue already beyond 1793 does not retroactively insert the new decision; start a new issue to experience the whole narrative revision.
