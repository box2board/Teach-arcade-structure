# Glacier Pass mixed route

Level six combines two big ramp jumps (6240–7490 and22440–23690), two jump-required small road gaps (3000–3300 and19000–19320), three smaller ramps (12600,29200,36500), existing obstacles, three clear speed sections and medals. Barrier moved19900→20500 to give the second small gap a clear landing area. Each miss uses the two-second stopped far-side recovery and no clear credit. Gap-specific panel distinguishes road breaks from canyons. Gold requires all four gaps cleared. Other routes retain their layouts.

Validation: syntax, small-gap jump/miss/nitro tests and large-gap nitro/double-jump/miss tests passed. Unassisted physics run completes57.5s with four recoveries. Full six-route rendering/physics simulation passed; levels1–5 remain50.71/52.69/57.67/48.52/57.05; mixed Glacier60.17s. These are simulations, not browser finish runs.

Browser run from beginning: missed first small gap, stopped at3460/speed0 with ROAD GAP MISSED/countdown2, clear0/recovery1; recovered and reached big ramp. Next big jump missed (nitro attempt did not spend resource in throttled browser), stopped7650 with CANYON MISSED/countdown1, clear0/recovery2. Thus both recovery types and progression between them verified. Positive crossing trajectories verified by tests; a full mixed-route browser finish remains pending. No obvious visual seam observed in inspected section. Physical-device performance and multitouch remain unverified.

Preview tested: https://teach-arcade-structure-3t541efxc-ash-christies-projects.vercel.app/brain-arcade/rv-road-trip-mayhem/rolling-hills.html?level=glacier
Code5c97ee3b2d6fae6a3075b73aac3fd27fa5587611. No merge to main or production deployment.
