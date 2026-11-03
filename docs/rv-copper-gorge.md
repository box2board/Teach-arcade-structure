# Level 04 — Copper Gorge

Branch: prototype/rv-road-trip-mayhem-reboot. Preview only; no main merge or production deployment.

## Route and canyon
3.8 km displayed route through Autumn Highway, River Overlook, Copper Cliffs, Ranger Station and Gorge Campground. Eighteen outlined hazards and five ramps, with one special canyon after the first ramp. All ordinary road driving/jumps remain shared with previous levels.

Canyon spans world x=4700–5950 after ramp x=4460, width=240, rise=90. No driving surface or collision floor crosses the opening. Full-speed ordinary launches and sampled single jumps fall short. Two successful strategies:
- Ride the ramp, then use the first and second jump in the air. The second jump applies a local forward correction so timing is forgiving without excessive vertical height.
- Hold gas and use nitro near/on the ramp. The canyon launch has a local speed/lift assist.

Warning signs precede the ramp, with a minimum nitro reserve restored on approach. No decision menu. A failed crossing places the RV at x=6110 on solid road, preserving health, maintaining forward movement, resetting airborne state and giving brief invulnerability. Clear recovery road follows. Ordinary road sections and levels 1–3 receive none of the canyon assists.

## Browser notes
- Initial actual-browser miss test, 2fdd48c: no jump/nitro; after falling short, continued at x=7544 with canyonRecoveries=1, canyonClears=0, health unchanged at 82. No restart, stuck state or health penalty.
- Nitro-only actual-browser crossing, 3f57ac5: x=6270, canyonClears=1, canyonRecoveries=0, jumps=0, health=82, clean landing. Actual gas and nitro inputs used.
- Initial double-jump browser test registered both inputs but fell short. Increased only the canyon's second-jump forward correction; added multiple timing cases to the unit checks.
- Final build f3fc170 actual-browser double-jump crossing: x=6608, canyonClears=1, canyonRecoveries=0, jumps=2, doubleJumps=1, landings=1, best air=1.4s, health=82. No nitro input. BIG AIR / CLEAN LANDING feedback visible.
- Inspected autumn scenery, rooted cottonwoods, road shoulder, canyon warning signs, ramp, open cliff edges, far-bank landing and recovery. Replaced opaque chasm fill with translucent depth shading so painted gorge remains visible.
- These are targeted browser runs from the beginning through the canyon, not a full level-four browser completion. Physical Chromebook/iPad performance and multitouch remain unverified.

## Automated checks
- JavaScript syntax passes.
- Four complete route simulations pass, including transitions and final replay. Existing three routes retain prior simulation results. Mock rendering does not verify browser visuals or feel.
- test-rv-canyon.mjs runs actual physics with unit-only state seeding: ordinary ramp launch recovers, 28 single-jump timings fail, several double-jump timings succeed, nitro without jumping succeeds, and recovery preserves health and resumes beyond gap.
- Unit-only hooks exist solely in transformed test source. The delivered browser game retains its read-only QA interface.

## Art provenance
Generated with built-in image-generation tool, cropped/optimized into two WebP assets totaling about 257 KiB:
- public/brain-arcade/rv-road-trip-mayhem/assets/gorge-vista.webp (1660×554)
- public/brain-arcade/rv-road-trip-mayhem/assets/autumn-tree.webp (350 px maximum width)

Vista prompt:
Use case: stylized-concept. Production background panorama for polished side-scrolling RV arcade game, landscape 3:1. Copper Gorge in crisp autumn morning: deep rugged layered slate and copper rock canyon, winding blue teal river visible deep below, golden cottonwoods and russet aspens among dark evergreen pines on canyon shelves, distant blue mountains, pale turquoise sky with long soft clouds, warm low sunlight grazing richly detailed cliff faces. Painterly stylized arcade realism, cinematic depth, natural rock formations, sophisticated amber gold / cool blue palette, consistent with polished indie RV driving game art. Composition upper half sky and distant mountains, middle dramatic distant gorge, lower third deep river gorge. No foreground road or bridge, no vehicles, no UI, no people, no text, no border, no pyramids or geometric triangle mountains. This is a reusable distant parallax background; do not place large near trees across the center.

Tree prompt (transparent):
Use case: stylized-concept. Single full autumn cottonwood tree sprite for polished 2D side-scrolling arcade RV game. Detailed golden amber foliage with russet highlights, naturally branching sturdy gray brown trunk and exposed root flare, whole tree from crown to roots fully in frame, almost side-on elevation, painterly stylized arcade realism with warm morning light and cool shadowed foliage. Grounded realistic proportions, irregular organic canopy, detailed leaves grouped into readable masses, sophisticated indie game art, not childish clipart. True transparent background; no landscape, no sky, no broad ground plane, no other objects, no people, no text. Tree fills frame with a little transparent margin.
