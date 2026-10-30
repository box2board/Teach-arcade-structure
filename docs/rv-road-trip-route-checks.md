# RV route checks

Run: `node scripts/test-rv-routes.mjs`

The test executes the actual game script with mocked DOM, Canvas drawing and images at deterministic 60Hz. It does not inject vehicle state or use a different physics implementation. Inputs use the registered game input handlers. This is NOT a browser playthrough or device performance benchmark.

Passed: both 38,000-unit routes reach finish through all five zones; correct transition from Alpine to Red Rock; Red Rock replay; double jump consumes both charges; landing; pause freezes position; resume; restart resets health and position; finite positions; positive health after built-in recovery; particles remain capped at 150.

Observed simulated run results: Alpine 51.46s / 21 cleared / 9 hits / 53 landings; Red Rock 54.5s / 11 cleared / 13 hits / 58 landings. Repetitive test inputs are deliberately not a human skill benchmark.

Browser checks remain partial because input/frame delivery is throttled in the remote browser. Normal-speed full runs and physical iPad/Chromebook checks are still outstanding. No claim of complete browser gameplay validation.

Visual follow-up: replaced repeated large bank ovals with sparse low vegetation. No physics, collision, route or jump tuning changes.
