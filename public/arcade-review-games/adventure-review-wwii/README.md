# Adventure Review Engine (WWII Prototype)

This folder contains a reusable adventure review engine with content packs.

## Add a new topic (questions pack only)
1. Duplicate the `content/wwii` folder and rename it (for example `civil-war`).
2. Update the new `questions.json` with **25+** questions in the same format:
   - `prompt` (string)
   - `choices` (array)
   - `correctIndex` (number)
   - `explanation` (one sentence)
3. Update `meta.json` with the new title/description.
4. Add a new entry to `content/packs.json` with the new `questionPack` name.
5. In `game.js`, switch the pack selection to the new pack ID (or extend the selector later).

## Map packs
To swap maps, add a new folder under `content/` with a `map.json` and `theme.json`,
then update the `mapPack` reference in `packs.json`.

No engine code changes are required when only swapping question packs.
