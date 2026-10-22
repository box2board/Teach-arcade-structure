# MovieMind

Movie-only deduction game at `/brain-arcade/moviemind/`. The reviewed release includes 500 distinct films and 2,500 original clues, five films per run, and five clues per film. Early hints are indirect; later hints become more recognizable. A wrong guess automatically reveals the next clue; requesting a clue adds no guess. Points fall from five to one as clues are used.

`puzzles.js` owns reviewed content and explicit answer aliases. `engine.js` owns matching, validation, session rotation and scoring. `game.js` owns the interface, local history, optional synthesized sound and downloadable text results. `moviemind.css` contains the purple theme, bright clue text and cinema-reel illustration. The static home is prerendered in `index.html` and refreshed at startup.

Run `node scripts/test-moviemind.mjs`. It checks all 500 titles and aliases, all 2,500 clues and score levels, exhausted puzzles, three full rotations, button and Enter submissions, results download, replay and Brain Arcade integration. Site build discovers the game for search and the shared content catalog. Local storage is optional; clearing it resets history. No external puzzle service is required.
