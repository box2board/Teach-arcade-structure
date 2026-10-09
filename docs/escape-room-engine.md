# Teach Arcade Escape Room Engine

The shared runtime is `/escape/js/app.js`. Room-specific curriculum belongs in `/escape/rooms/<room-id>/data.js`; the page loads that file using the `room` query parameter. Keep puzzle content and difficulty paths in room data rather than adding topic-specific branches to the engine.

## Difficulty paths

Each room may define `difficultyLevels` for the student-facing picker and `difficultyProfiles` keyed by level ID. A profile can set:

- `label`: briefing/progress label.
- `sceneOrder`: ordered scene IDs for that run. Use this to make levels longer or choose different analysis tasks.
- `sceneOverrides`: partial scene data keyed by scene ID for a changed prompt, puzzle, or evidence set.
- `requireReasoning`: require a saved note after each solved non-intro scene.
- `minReasoningLength`: minimum trimmed character count for a required note.

Scenes remain in the room's `scenes` array. A profile's `sceneOrder` selects and orders them. Shared scenes can be reused across paths; add distinct scene IDs when a level needs a different task. The engine resets state when the student selects a level, and the selected path is saved with progress.

## Puzzle data

Current reusable scene kinds are `intro`, `choice`, `match`, `order`, `text`, and `multi`. Choice options, matching rows/categories, and ordering items are shuffled per run and the shuffled IDs are saved, so refreshes preserve the current arrangement. Text answers are normalized for case, spaces, punctuation, and accents; define `answers` or per-part `answers` arrays for accepted variations.

Use `reflect` for a specific, evidence-based reasoning question after a puzzle is solved. For medium/hard profiles, saved notes are required before continuing and are included with their prompt in the final report. The intro briefing intentionally has no reflection form. `requiresClues` can gate a scene on earlier clue rewards; check each difficulty path to ensure every required clue is earned before it is needed.

## Progression checklist

For every difficulty path, make sure all scene IDs exist, clue requirements are reachable, each puzzle answer points to valid data, the last puzzle can advance to completion, and restart clears the selected path, notes, clues, and shuffle order. Keep scene IDs stable because they label saved notes and evidence.
