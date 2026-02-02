# Slide & Snap

Slide & Snap is a classic sliding-tile puzzle for Teach Arcade's Brain Arcade. It supports multiple board sizes, tracks moves and best times, and includes a calm mode for timer-free play.

## How it works
- **Board generation:** The game starts from the solved board and performs valid random moves to scramble, which guarantees solvability.
- **Interaction:** Players click or tap tiles adjacent to the empty space. Arrow keys also move the empty space for keyboard users.
- **Stats:** Moves, elapsed time, and best time per board size are tracked locally with `localStorage`.
- **Win state:** When the board matches the solved order, the game shows a summary modal and celebrates with lightweight confetti.

## File overview
- `index.html` — Landing page with SEO content and difficulty links.
- `game.html` — Playable puzzle and UI.
- `styles.css` — Shared styles for the landing and game pages.
- `game.js` — Sliding puzzle logic and UI wiring.

## Adding future themes
1. Duplicate `styles.css` and create a theme file (e.g., `theme-sunset.css`).
2. Override CSS variables in the new theme file.
3. Add a theme selector to `game.html` and load the theme file by swapping the stylesheet `href`.
4. Keep the core layout classes the same to preserve accessibility and layout.
