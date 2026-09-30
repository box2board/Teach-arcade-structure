# Side-Scroller V1 Game Template

Copy this folder to a new game directory, then replace the placeholder content.

## Files you normally edit
- **level.js:** build a unique course. Do not copy another game's geometry.
- **questions.js:** 10 questions by default; each includes four choices, correctIndex and explanation.
- **theme.js:** title, labels, colors and asset manifest.
- **renderer.js:** environment-specific art and visual language.
- **game.js:** package ID and assembly only.

## Shared files you do not edit per game
The game imports the frozen V1 engine from the parent directory.

## Publish gate
Before promotion, open the game with `?debug`. Gameplay QA must have no unreachable required sections and Visual QA must have zero errors. Then complete a manual touch and keyboard playthrough, answer all 10 questions, reach the finish, and verify the Mission Report.
