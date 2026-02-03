<!--
Discovery notes:
- Social Studies pages live in /public/subjects/social-studies/ (e.g., /public/subjects/social-studies/index.html).
- Arcade Review Games hub is /public/arcade-review-games/index.html (updated for new Social Studies card).
- Card/tile markup pattern followed: <article class="game-card"> with .game-badge-row, .game-title, .game-desc, .meta-row, .card-footer, and .play-btn in /public/arcade-review-games/index.html.
- Global header + analytics script reused: /assets/scripts/nav.js?v=5 (injects header + GA4).
- AdSense placeholders pattern referenced from /public/arcade-review-games/adventure-review-wwii/index.html using .ad-slot blocks.
- New files added:
  - /public/arcade-review-games/social-studies/cold-war-shadow-run/index.html
  - /public/arcade-review-games/social-studies/cold-war-shadow-run/game.html
  - /public/arcade-review-games/social-studies/cold-war-shadow-run/styles.css
  - /public/arcade-review-games/social-studies/cold-war-shadow-run/game.js
-->

# Cold War: Shadow Run — Change Log

## Summary
- Added a Social Studies arcade review landing page and side-scroller game for **Cold War: Shadow Run**.
- Integrated the new game into the Arcade Review Games hub under Social Studies.
- Added PDF teacher guide generation on the landing page via jsPDF CDN.

## Test Checklist
- [ ] Open the landing page and confirm header loads and ads placeholders do not break layout.
- [ ] Click **Play Now** and verify the canvas fits the viewport on mobile and desktop.
- [ ] Trigger a surveillance zone and confirm the question modal pauses the game.
- [ ] Answer correctly to verify Stability +10, intel increases, and game resumes.
- [ ] Reach the finish marker with Stability ≥ 40 to confirm win state.
- [ ] Download the teacher guide PDF and confirm file name and content render.
