# Type Turbo

Type Turbo is a Brain Arcade typing game with multiple difficulties and play modes.

## Controls
- **Start**: begin a run with the selected mode + difficulty.
- **Pause / Resume**: freeze and continue the current run.
- **Restart**: reset to idle.
- **Input box**: type the target exactly (including punctuation and spaces).

## Modes
- **Sprint (60s)**: score as many correct entries as possible before the timer ends.
- **Endless (5 lives)**: no global timer; lose a life on mistakes/timeouts.
- **Accuracy (50 items)**: complete a fixed set to prioritize consistency.
- **Zen**: endless free typing with live stats.

## Scoring
- **WPM** uses the standard formula: `(correctChars / 5) / minutes`.
- **Accuracy** uses `correctChars / totalChars`.
- **Combo** grows with consecutive correct entries.
- **Best streak** records your longest run of consecutive correct entries.

## Persistence
Personal best stats are saved in localStorage by key:
`typeTurboPB:{mode}:{difficulty}`

Stored fields:
- `wpm`
- `accuracy`
- `streak`

If localStorage is blocked/unavailable, the game still plays and skips PB persistence.
