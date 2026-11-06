# Avalanche Escape — polish and release review

Status: review preview only. Not merged or deployed to production.

## Completed polish

- Gold sparkles on confirmed pickups; cyan launch pulse and powder; landing puff.
- Three-action intro: Steer · Collect gold · Boost onto blue ramps.
- Inactive gameplay HUD hidden behind intro, pause and result screens.
- Mini Games tile describes gold snowflakes and boost ramps.
- Fixed elapsed-time loss below 20 FPS. A simulated 10 FPS run finishes at 45 seconds; pause/resume resets frame timing.

## Automated verification

Run `node scripts/test-avalanche-escape.mjs` and `node scripts/test-avalanche-renderer.mjs`.

Passed: 60 deterministic full rounds, clear corridors, stage progression, forgiving pickups, score multipliers/reset, boost acceleration/release/exhaustion, small versus boosted jumps, air-token height checks, pause, replay, one completion event and its score payload, ground projection, visual feedback triggers, drag steering/cancellation, and exact 45-second timing at 10 FPS. Particle count is bounded to 100; launch rings to four; artwork remains about 92 KiB.

## Browser verification

Chrome checked the actual game in frames with phone (320px), tablet (768px) and laptop (1366px) viewport widths. All had no horizontal content overflow and the intro fitted inside the playfield. Touch buttons exceeded 44px in both dimensions. These are responsive browser checks, not physical-device tests.

Vercel preview build for bd2cebdf passed. Opened Mini Games and followed its Avalanche Escape tile to the game. Verified optimized artwork loaded, simplified instructions displayed, the round started and advanced, and pause/resume restored play. No account was required.

Preview route: https://teach-arcade-structure-git-protot-467ed8-ash-christies-projects.vercel.app/mini-games/games/avalanche-escape/

## Remaining release limits

- Physical iPad/Safari and Chromebook playthroughs are not verified in this environment.
- Review the new feedback and controls in the playable preview before approving merge/production.
- There is no new account, database or cross-user leaderboard integration in this mini game; completion retains the established event contract and local personal-best storage.
