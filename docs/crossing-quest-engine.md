# Acorn Dash — preview engine

Developed on `feature/crossing-quest-engine` from verified production commit `95f407d962f0f3104a07e5dd165539eacd0c4f9c`. The existing preview URL path remains `/arcade-review-games/crossing-quest/`. Existing games, shared styles, navigation, and registry are untouched.

## Gameplay

A squirrel gathers acorns in three parks. Collect at least three acorns per trip, answer two questions at the safe stump and two at the old oak, then travel back DOWN to home to stash the haul. Extra acorns are optional. Collected acorns remain in the pouch after a collision and cannot be collected twice on the same trip. The return trip saves the old oak as the respawn point. Stashing completes a trip and resets pickups for the next park.

The mission strip above the board shows the current step: fill the pouch, visit the old oak, or bring acorns home. Reaching the oak with insufficient acorns opens paused guidance with the exact number still needed; continuing does not reopen it until the player leaves and revisits. Completing the oak review opens a paused return-home briefing. The destination safe row gains an outline and direction label. Stashing displays the haul and an explicit Start level button. `goal-help` and `return-ready` are paused states; `continueHunt()` and `beginReturn()` resume play.

Moving cyclists and rolling balls occupy park paths. Lawn sprinklers cycle through off, amber warning, and spray phases. Questions and feedback pause all hazards. Correct answers grant a shield, slowdown charge, or extra heart. Incorrect answers explain the answer without costing a heart. Collisions consume a shield or heart and return the squirrel to the saved safe row. Gentle, Classic, and Challenge control obstacle speed and starting hearts. Movement is free.

`roadShapes()` supplies both renderer and collision geometry: wheel/ball circles and bicycle frame segments. `roadHit()` tests a forgiving 11-pixel squirrel body footprint against those shapes rather than a full bicycle rectangle. Decorative tails, rider heads, and shadows do not increase collision bounds. Regression checks cover the previously invisible front/rear hits, visible wheel contact, and paused progression guidance.

Keyboard: arrows/WASD; Space slowdown; P/Escape pause. Questions: 1–4 or arrows and Enter. Held touch buttons support movement. Blur and page hiding pause play. Announcements occupy a reserved strip below the canvas. Board labels sit to the left of the character’s starting position.

## Topic-independent architecture

`engine.js` contains state, collisions, pickups, stashing, and academic rewards. `config.js` contains park geometry and difficulty settings. `game.js` renders original canvas art and handles dialogs/input. `questions.js` is the initial Scientific Method test pack, not the permanent subject of the game. Its schema is `{id,title,questions:[{id,question,choices:[four strings],answer:0..3,explanation}]}`; twelve unique questions are required. `question-sets.js` provides a metadata catalog and validated lazy loaders. The two-step setup chooses park difficulty, then a question set. Back navigation preserves difficulty, loading prevents duplicate starts, and failed packs show a retry/back message without starting a run. Only the original Scientific Method test pack is listed; draft Social Studies banks are not integrated. Future approved packs can be registered without editing gameplay code. The selected pack is identified in the footer.

The summary shows review accuracy, explanations, and acorns stashed. Results remain on-screen; there is no student identity, storage, or teacher reporting.

## Validation and release

`node scripts/test-acorn-dash.mjs` checks catalog validation, pickups, the minimum-acorn condition, rewards, return checkpoints, stashing/reset, full three-trip state flow at all difficulties, sprinkler collision, and warning phases. `node scripts/test-acorn-paths.mjs` searches actual movement/update calls through all nine park/difficulty combinations: acquire three acorns, complete reviews, and return home without teleports, injected pickups, collision losses, shields, slowdown, or correct-answer rewards. Safe pickups at the stump and oak make hazard-lane acorns optional. Sprinkler timing scales with difficulty; amber warnings last at least 0.89 seconds even in the fastest park/difficulty combination. Local browser checks cover setup/back/loading failure, keyboard/touch input, pause, all twelve question dialogs, all return/stash transitions, summary, desktop fit, phone width, and notification placement. Automated paths establish feasibility, not human difficulty or enjoyment.

The preview remains noindex and absent from live hubs. Production release requires the final canonical, navigation/registry entry, and removal of preview noindex.
