# Current revision — missed-jump penalty and pickups removed

Nitro pickups, their sprites/counter and collection rewards have been removed from Copper Gorge. Normal nitro controls, regeneration, speed sections and medals remain.

A canyon miss relocates the RV to x6110 with zero speed and a two-second recovery countdown. The wait counts toward finish/medal time. Jump and nitro are ignored during recovery; pausing freezes the countdown. Recovery gives no canyon-clear or clean-landing credit. Driving resumes after the countdown. Replay resets recovery state. Only level four changes.

Reviewed the uploaded 9.6-second iPad recording: the previous rapid relocation and immediate driving made a missed jump look successful. Replaced that response with an explicit CANYON MISSED panel and 2 → 1 countdown.

Browser verified on code commit 20e0efe: drove from the beginning without jump/nitro; observed x6110, speed0, recoverySeconds1.32, canyonRecoveries1, canyonClears0; observed the display change from 2 to 1, then GO and driving resumed (x6201, speed291, recoverySeconds0). No pickups/counter visible. Health remained82 through recovery. Cloud screenshots can lag telemetry by a frame.

Passed syntax, canyon trajectories/recovery tests, reward/speed/medal tests and all four route simulations. New tests check the full stopped wait, elapsed-time penalty, blocked jump/nitro, pause behavior and resumption. First three route simulation results remain unchanged. Device-specific performance/multitouch is not certified.

Verified playable preview: https://teach-arcade-structure-8zmnurj34-ash-christies-projects.vercel.app/brain-arcade/rv-road-trip-mayhem/rolling-hills.html?level=gorge

## Historical implementation notes (superseded where above differs)

# Copper Gorge rewards — level four only

## Changes
- Eleven cyan nitro cans on road and jump arcs; each awards 20 nitro, capped at 100, once per run.
- Three open speed sections: x6400–9800, x15000–18200 and x23400–27800. Gas acceleration and normal speed cap increase only inside these lanes. Braking remains available. Green chevrons and entry/exit signs communicate the sections; hazards were moved out of the clear lanes.
- Finish medals: Gold at 60 seconds or faster, at least 60% RV condition and a successful canyon clear; Silver at 75 seconds or faster and at least 30% condition; Bronze for every other finish. Results show pickup totals and the next medal target.
- Replay resets pickups, speed section state and medal.
- All added state, drawings and rules are gated to level index 3. Earlier route layouts, physics and HUD are preserved.
- Nitro canyon assist now provides a reliable launch at slower ramp approaches; canyon recovery remains forgiving.

## Browser playtest
Completed a full Copper Gorge run on feature commit 0d2a07b: collected 9/11 pickups; used ground and aerial pickups; drove all three speed sections; observed 160 km/h without additional nitro; tested braking; finished in 64.92 seconds at 27% condition and received Bronze. Verified medal artwork, next-target text and replay reset.
Found two issues during that run: nitro could miss the canyon from a reduced-speed approach, and the third speed entry sign overlapped the ranger sign. Fixed the nitro launch floor and moved the entry sign.
On final code commit 0a497b4, drove again from the beginning, collected two pickups and activated nitro around x4203 at speed743. Browser telemetry after crossing showed canyonClears=1, canyonRecoveries=0, with no jump input. Also switched to Alpine Run and drove to confirm the Copper Gorge pickup HUD disappears.
Full final route was not repeated after the targeted launch/sign/text corrections.

## Automated validation
Passed JavaScript syntax check and scripts/test-rv-canyon.mjs, scripts/test-rv-gorge-rewards.mjs and scripts/test-rv-routes.mjs.
Coverage includes pickup overlap/cap/once-only/paused behavior, replay resets, speed lane acceleration and braking, medal thresholds, real finish flow, canyon recovery and slower nitro approaches (500/650/720).
The first three route simulation results match their previous results exactly.
Cloud browser rendering/input is throttled; physical Chromebook/iPad performance and multitouch have not been certified.

## Preview
https://teach-arcade-structure-8nrzi38yc-ash-christies-projects.vercel.app/brain-arcade/rv-road-trip-mayhem/rolling-hills.html?level=gorge

Work stays on prototype/rv-road-trip-mayhem-reboot. No main merge or production deployment.

