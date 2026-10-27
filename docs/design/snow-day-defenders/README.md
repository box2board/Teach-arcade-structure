# Approved art direction — first playable translation

The user approved `approved-target.webp` on 2026-10-27. This is concept art, not a screenshot or a performance guarantee. The playable implementation still requires review.

Open `/dev/snow-day-visuals/` and choose **Try the visual test scene**. This explicit developer fixture starts nine defenders against fifteen arranged enemies with projectile/shield modules; it uses real movement, automatic fire, hits, crates and rebuilding. Starting a normal run still opens 60-second recruitment. The fixture's smaller feature selection is deliberate and does not change normal exact-five selection.

New Snow-specific `art.js` models coats, boots, backpacks, ribbed hats, scarf tails, mittens, bucket armor, eyebrows and runner ears. Fixed body geometry is cached and batched; moving arms retain existing throw animation. Fort blocks now have beveled edges and are batched per section. ACES tone mapping and warm/cool lights replace the earlier washed lighting. Navy HUD and orange Snow Burst match the target hierarchy. No new framework modules were extracted.

Differences still to assess: the reference has richer sculpted terrain, softer lighting and more organic poses than this geometry-based translation. Real-time shadows and cinematic effects are not enabled to force a superficial match at the expense of classroom performance. Physics/collision radii and all gameplay modules remain unchanged.

Gameplay/fixture tests pass using a simulated renderer. Cloud WebGL was previously disabled; actual rendering, shader correctness, touch and FPS remain unverified until browser/device review. Scene text is not proof of visual quality. Do not mark the playable benchmark approved based on concept approval.

## Appearance pass 2 — 2026-10-27

Continues art work before a dedicated animation pass. `landscape.js` adds one vertex-colored terrain mesh (6,000 triangles), keeping the central play plane flat. Snow-capped rock clusters, layered spruce branches, cabin door approaches, roof scallops, corner timbers, log stacks and warm timber fencing add detail outside steering lanes. Cabin windows have emissive material accents without extra lights. Supply crates have slats, diagonal bracing, corner fasteners and snow caps; numbered target labels now use dark backgrounds and white text. Fort caps gain rounded snow clumps. Contact shadows use a cached 32×32 alpha falloff instead of hard-edged flat circles.

The existing static instancing pass consumes the new fixed scenery. The combined test fixture now reports 52 static batches (previously 39); this is an increase to profile on classroom hardware, not a claim of unchanged frame rate. No real-time shadows, new animation systems or gameplay rules were added. The character models and camera framing from the improved playable baseline are retained.

Verification: complete benchmark regression suite, scene entry/normal recruitment checks, source hashes, terrain finite/flat-play-plane checks, contact-alpha checks and syntax/diff checks pass. WebGL rendering, appearance approval and target-device FPS remain pending. Next review: full scene composition against the reference, especially scenery contrast, fort visibility, crate labels and crowded-field clarity. Finish appearance review before dedicated animation work.

## Close-view composition pass — 2026-10-27

Responds to the user's phone screenshot: too much masthead, distant overhead view and a compressed squad. Camera elevation drops from 36 to 22 in portrait, field-of-view 53°, without the previous aspect-based zoom-out. Portrait pans smoothly with the squad; the full fort ends and opposite edges may now be cropped. Left/right counts indicate nearby offscreen enemies (z > -30). These cues do not freeze or alter enemies. Wider viewports retain the fixed camera; short landscape screens retain a small fit adjustment.

Nine defenders now form five plus four, with 1.4 lateral and 1.7 row spacing. This intentionally widens the actual volley footprint because shots still originate at each defender, rather than drawing a misleading visual-only formation. Enemy rules, movement limits, projectile speed, damage, HP and rewards stay unchanged; balance needs playtesting. All earned members remain present; no recruitment limit was introduced.

Phone header is approximately 40 CSS pixels tall, HUD begins near 51px and uses one compact row, feature names use a thin strip, and footer controls are shorter. Important controls remain available. Academic cards scroll within the remaining height. Projection tests at 390×844 give a 3.8-world-unit defender silhouette over 70px (previous framing roughly 40px); this is mathematical evidence, not a rendered approval. Tests cover squad visibility at both movement limits, two-row formation, frame integration and all prior gameplay flows. Real browser appearance and phone/Chromebook performance still need review.

## Detail pass — trees and shields, 2026-10-27

User approved the closer composition and requested small art improvements. `details.js` replaces concentric cone trees with a shared low-poly bough geometry with alternating drooping tips, staggered tiers, smaller raised snow caps, uneven clumps and visible twigs. The same tree design is used across foreground/background. Fixed meshes still enter the existing instancer (52 fixed batches in the exercised fixture).

The shield art adapter decorates the exact Mesh created by features.js: a beveled shield-shaped ice slab, translucent cyan surface, rim outline, glint lines and two shared crack geometries. Crack layers become visible at 3 and 1 shield strength; break feedback uses the existing bounded particle pool. No transmission/refraction passes, individual textures or per-frame geometry allocation. Transparent sorting and readability still need device review.

Gameplay feature source stays byte-identical to the v7 snapshot. Shield capacity remains five, shield hits still absorb all incoming damage for that hit, and the same original object is removed when its strength reaches zero. Subsequent hits reach HP normally. New regression checks cover cracks, unchanged HP during shield hits, removal identity and post-break damage. Existing full regression/budget/framing checks pass. The camera, squad spacing, difficulty and educational flows are unchanged by this detail pass. Actual rendered appearance and Chromebook frame rate remain pending review.
