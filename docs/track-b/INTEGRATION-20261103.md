# Cabinet integration with current main

Integration branch: integration/cabinet-current-main-20261103. Base main: 70a60be0 (released Snow Day Defenders / Visual System). Cabinet source: d6c5c2b7. No production promotion is authorized.

Resolved all 28 conflicts. Kept current main's public game presentation, science pages, Group Maker, Territory Takedown renderer, black-and-gold game covers, mint tool artwork, Brain Arcade additions and Snow Day squad release. Added permanent resource IDs to current public catalog cards, retaining every previously saved ID. City Canvas and Block Builder public tool entries remain available to preserve saved shortcuts. Generated catalog now contains 18 Arcade Review games, 23 Brain Arcade games, 8 Review Lab games and 20 tools.

Merged multiple-answer scoring into current Acorn Dash and Slime Falls without replacing their newer gameplay/performance changes. Treasure Trail changes only integrate multiple-answer behavior. The new public Snow Day engine now supports select-all questions in recruitment, fort rebuild, and between-wave review. Its real shared answer picker is bound after mounting controls so Submit is reachable. Existing single-answer behavior and squad gameplay are preserved. The public launcher retains the selected teacher set through the shared catalog.

Validation: full npm build passed; 94 focused tests passed, including Cabinet/Auth/API/editor/workflow, catalog IDs/assets, all-bank validation, multiple-answer scoring, current Acorn Dash/Treasure Trail engines, public Snow launcher, and Snow squad simulated-renderer gameplay plus a multiple-answer renderer check. Updated one obsolete exact catalog-count assertion to permit new topics. Generated SEO/search artifacts from full build were not committed where they merely rewrote unrelated canonical hosts. No database schema changes in this integration.

Remaining release QA: real phone/iPad and two signed-in browser-account walkthrough. The real renderer/performance check still requires an actual WebGL-capable device. Future integration should use smaller branches and regularly merge main. Never blindly replace public catalog pages from an older feature branch.

Final upstream refresh: included main 196fff79 (Art Studio release), resolved its tools card overlap, and assigned tool:art-studio. Existing saved IDs remain unchanged.
