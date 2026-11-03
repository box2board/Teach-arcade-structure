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
