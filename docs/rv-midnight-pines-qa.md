# Midnight Pines — level five QA

Preview tested: https://teach-arcade-structure-e94uejjaj-ash-christies-projects.vercel.app/brain-arcade/rv-road-trip-mayhem/rolling-hills.html?level=midnight
Code commit: 9aa193b7293648da900b45aa1155bb68478f9199.

Full browser run from beginning to campground completed. Deliberately drove without jump/nitro to verify collisions, repair behavior, ramps, clear speed lanes, missed ravine recovery and finish. Finish: x38003, time53.27, condition27%, hits17, landings4, canyonClears0, canyonRecoveries1, medalBRONZE. Correct Silver target displayed (75 seconds / 30% condition). Three speed sections registered 7.7 seconds above normal speed. Miss stopped atx21850, speed0, recovery1.45 seconds remaining; visible countdown2, then driving resumed. No canyon-clear credit. Replay reset x120/time0/health100/medalnull/counters0. Earlier browser session verified jump, double jump, landing, and nitro input through first half of the route.

Visual observations: luminous night palette preserves road/RV contrast; cream-edged hazards remain visible; ravine warning/ramp and bank edges read clearly; campground finish and medal artwork display correctly. No obvious floating prop or new seam observed. Cloud browser input/frame throttling means these observations do not certify physical Chromebook/iPad performance or multitouch.

Automated validation from implementation: syntax, gap miss/nitro/double-jump strategies, full five-route simulations and existing two-second recovery tests passed. Night route simulation finished49.59s; unassisted physics test50.61s with one recovery. Tests are distinct from the browser run above.

Art: built-in image-generation tool; prompt direction was a luminous moonlit Pacific Northwest pine forest, silver lake reflections, distant peaks, layered teal mist and warm cabin lights, painted arcade realism, wide panoramic layer with no road/vehicles/UI/text. Asset: public/brain-arcade/rv-road-trip-mayhem/assets/midnight-vista.webp, 1660x554, 243470 bytes. Separate roadside trees, terrain, signs, mist and props provide independent depth.

Work remains on prototype/rv-road-trip-mayhem-reboot. No main merge or production deployment.
