# Hazard readability pass — 2026-11-02

Isolated branch: prototype/rv-road-trip-mayhem-reboot. Preview only.

## Change
All eight painted hazard types receive the same restrained amber silhouette outline, a thin dark outer keyline for pale backgrounds, and a soft glow. Existing contact shadows remain. Scenery and ramps are not outlined. No flashing, warning overlays or extra controls.

Effect is composited once per hazard type into a small canvas at its existing display size, including nine pixels of padding. Normal frames draw one cached image per obstacle, without repeated blur/filter work. No raster downloads added. Sprite positions, collision sizes, layout, jump/landing physics and obstacle removal rules unchanged.

## Verification
- JavaScript syntax passes.
- Complete three-route deterministic logic simulation passes with identical route results to the prior build. This is not a browser playthrough.
- Actual browser targeted drives on 838c47d: Alpine through x=6223 (cart and tire outline inspected, double jump and ramp/collision exercised); Red Rock through approximately x=5990 (tire and damaged car inspected against pale terrain); Sunset Coast through approximately x=1440 (low branch clearly separated from the dark road).
- Outline hugs the visible artwork and preserves interior detail. No outline on decorative buildings or trees. Cached rendering observed with no visible corruption or rectangular sprite backgrounds.
- These were targeted readability checks, not three new full-level browser completions. Physical Chromebook/iPad performance and multitouch remain unverified.
