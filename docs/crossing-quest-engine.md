# Crossing Quest engine — preview edition

Independent branch from verified production commit `95f407d962f0f3104a07e5dd165539eacd0c4f9c`. Adds only `public/arcade-review-games/crossing-quest/` and this document. Existing game files, navigation, registry, hub, and site-wide styles remain untouched while other tasks are active.

## Learning and play

Scientific Method retrieval practice: variables, controlled experiments, observations, evidence, and reasoning. Three crossings, two safe checkpoints per crossing, two questions per checkpoint = 12 randomized questions per run from a 24-question bank. Answers are shuffled while retaining the correct index. Reading and feedback pause all hazards. Incorrect answers show the correct answer and explanation without taking hearts. The end screen separates review accuracy from crossing progress, lists answered questions, and includes explanations.

Default Gentle speed is 70% of Classic and starts with four hearts and a shield. Correct answers replenish a shield, then earn up to two slowdown charges, then extra hearts up to six. Space or the Slow time button activates six seconds at 38% hazard speed. Movement costs nothing. Road collisions, water gaps, and drifting beyond the river edge return the player to the last checkpoint. Shields protect one heart but still return the player to safety. Hearts, shields, and charges carry between crossings. Questions never reopen when revisiting a completed checkpoint.

Keyboard: arrows/WASD; Space slowdown; P/Escape pause. Questions: 1–4 or arrows and Enter. Touch: held directional buttons and Slow time button. Window blur and page hiding automatically pause. Reduced motion removes hop interpolation, ripple animation, and invulnerability blinking.

## Reuse

- `engine.js`: browser-independent gameplay/state/collisions/rewards; exports `CrossingWorld`, `validateBank`, `shuffle`.
- `config.js`: logical dimensions, difficulty parameters, and three route configurations.
- `game.js`: canvas renderer, accessible dialogs, input, and presentation.
- `questions.js`: topic pack only: `{id,title,questions:[{id,question,choices:[four strings],answer:0..3,explanation}]}`. At least 12 unique questions required. Change this import for another edition. Do not modify the shared engine per topic.
- `styles.css`: styles scoped to this standalone game page.

Preview is intentionally `noindex` and is not added to live hubs or the content registry yet. Before a future production release: remove preview noindex, add the final canonical URL, and register the edition through the site's normal content process.

Results are on-screen only; no student identity, teacher reporting, storage, or backend service is implied.
