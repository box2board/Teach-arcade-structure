# Level 03 — Sunset Coast

Branch: prototype/rv-road-trip-mayhem-reboot. Preview only; no main merge or production release.

## Route
3.8 km displayed road, five zones: Windswept Bluffs, Harbor Village, Sea Cliffs, Coastal Causeway, Lighthouse Camp. Seventeen hazards in clusters with long recovery/speed intervals, five timber ramps. Same acceleration, braking, nitro, buffered/coyote jumps, double jump, damage and landing physics as the previous levels. Dedicated rolling terrain profile. Level two advances into level three; the final level replays itself. Direct entry: rolling-hills.html?level=coast.

## Art
Independent ocean panorama, wavelets, planted bank, rooted trees, grounded harbor buildings, lighthouse landmarks and gull silhouettes. Road uses a cool dusk palette and guardrails. Foundations use stable full-footprint terrain lots. The coastal vista uses one bounded slow pan so the sun never duplicates.

Built-in image-generation tool produced the project assets below. Cropped to alpha bounds and optimized as WebP; about 304 KiB total:
- public/brain-arcade/rv-road-trip-mayhem/assets/coastal-vista.webp
- public/brain-arcade/rv-road-trip-mayhem/assets/painted-lighthouse.webp
- public/brain-arcade/rv-road-trip-mayhem/assets/painted-harbor.webp

## Browser playtest notes
Full start-to-finish manual browser run on 48b50309: x=38001, game time=58.96 s, 27% condition, 2 hazards cleared, best air 0.9 s. Recorded 10 jumps, 5 double jumps, 10 landings and 15 hits. Input exercised keyboard gas/brake and on-screen jump/nitro. All five road zones and ramps traversed. Inspected harbor foundations, lighthouse base, approaching ramp signage/decks, road silhouette, recovery and finish banner. Replay reset health/progress and resumed driving (x=568, time=2.47).

Found and fixed during review: the mirrored background created two suns near the causeway. Replaced coastal mirroring with a single bounded pan. No route or physics changes after the complete run. Final preview opening checked separately after that rendering fix.

Cloud scheduling advances simulation much more slowly than wall time. This was a completion/readability/functionality pass; it does not certify Chromebook/iPad frame rate or physical multitouch. Those device checks remain outstanding.

## Logic regression
scripts/test-rv-routes.mjs passes all three complete routes, pause/resume, jump/double jump, landings, particle cap, restart, level transitions and final replay. Existing routes retain identical simulation results to the prior build. Level three deterministic run finishes in 52.72 s with 9 cleared obstacles, 56 double jumps and 56 landings. Mock drawing is not a visual test.

## Generation prompts
Vista (opaque):
Use case: stylized-concept. Production background asset for polished 2D side-scrolling RV arcade driving game, wide landscape 3:1 panorama. Pacific coastal highway at warm dusk, dramatic layered rocky sea cliffs, turquoise and deep teal ocean, distant headlands fading into lavender mist, soft coral golden sky with clouds, small offshore sea stacks and white surf, forest atop distant headlands. Painterly stylized arcade realism, crisp rich materials matching a polished indie mobile driving game, cinematic warm rim lighting, sophisticated teal/coral palette. Composition: sky upper half, distant ocean horizon at middle, distant coastline and ocean lower half. Everything distant, no foreground road, no vehicle, no UI, no people, no text, no border. This is a reusable far parallax panorama, keep the lower third free of large foreground objects. No pyramids, no cartoon triangles.

Scenery atlas (transparent):
Use case: stylized-concept. Production transparent game sprite atlas, exactly TWO separate scenery objects horizontally side by side with wide clear separation and transparent margin, not touching. Left: elegant weathered white coastal lighthouse with burgundy red cap and small keeper cottage attached, warm glowing lamp, rocky foundation with low coastal grass directly supporting entire base. Right: charming weathered teal wooden harbor bait shack with shingled roof, lit amber windows, porch, coiled rope, lobster pots, low planted foundation. Both whole objects fully in frame. Side elevation seen at almost horizontal camera, slight 2.5D depth, flat level base, detailed hand-painted arcade realism, rich material texture and warm dusk rim lighting, natural proportions, consistent with polished RV driving arcade game. Objects separated by at least 15 percent canvas width. Truly transparent background. No ground plane outside each small foundation, no ocean, no sky, no text, no labels, no shadows detached from objects, no people, no UI.
