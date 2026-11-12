# Type Turbo: Cosmic Launch

Type Turbo is a keyboard-first space launch game in the Teach Arcade Brain Arcade. Complete each target word to send your rocket higher. Clean words charge the thrusters, build a combo, and earn a score bonus. Typos remain editable: backspace to correct them and keep the launch moving.

## Modes
- **Sprint (60 seconds):** score as many words and points as possible.
- **Survival (5 lives):** complete words before the adaptive target timer expires. Difficulty changes the time window.
- **Accuracy (50 words):** complete a fixed run without a round timer. Accuracy and the final grade reward careful typing.
- **Zen:** type at your own pace with no timer or lives.

## Difficulty
Easy, Normal, Hard, and Pro change the target word pool. Survival also adjusts the target timer by difficulty.

## Scoring and stats
- Score grows with target length and clean-word combo. Corrected words still earn points.
- WPM uses standard five-character words: `(correct characters / 5) / elapsed minutes`.
- Accuracy tracks correct keystrokes against typed keystrokes, including typos that were later corrected.
- Personal best scores are saved in localStorage by mode and difficulty. The game remains playable if local storage is unavailable.

## Controls
- **Start launch:** starts the selected mode.
- **Pause / Resume:** freezes timers and the launch.
- **Restart:** resets the current setup.
- **Typing:** type the shown word; no Enter key is required. Use Backspace to fix mistakes.
