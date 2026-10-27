# Teach Arcade Visual System 0.1.0-preview

This candidate system grows from the Snow Day Defender benchmark. The API is provisional until its first visual review is approved. No next game has been upgraded.

Game engine (rules, input, questions, timing)
→ Teach Arcade Visual System (cosmetic cues, bounded effects, quality)
→ Game-specific theme/assets (Snow village, fort, outfits, framing)
→ Individual experience (selected topic, difficulty, active modules)

The engine owns simulation state. Visual systems receive events/state to present; they do not change HP, clocks, rewards, collisions or question scoring. Camera framing remains Snow-specific until a second game proves a common framing need.

## Actual modules

| Module | Purpose | Integration / constraints |
| --- | --- | --- |
| `presets/quality.js` | Version plus explicit quality budgets | `qualityFor('standard')`; no device guessing, shadow maps or postprocessing |
| `core/cues.js` | Independent cosmetic random stream, damped camera impulses, optional audio event callback | `createCues({reducedMotion,onAudio})`; call `impulse(.05)`, `tick(dt)`; reset on new run; does not move camera itself |
| `core/particles-three.js` | Preallocated impact pool and three weather layers | Three.js 0.162 adapter; `createParticlePool(scene,random)` → `setLimit`, `burst`, `update`, `clear`, `dispose`; `createWeather` → `configure(count,layers)`, `update`, `dispose` |
| `core/ui.js` | Short HUD/reward/wave cues | `uiCue(element,'pop'|'damage'|'intro',reducedMotion)`; cancels prior animation; static fallback without Web Animations |

Example (adapt import paths to your static page):

```js
import {createCues} from '/teach-arcade-visuals/core/cues.js';
import {qualityFor} from '/teach-arcade-visuals/presets/quality.js';
import {createParticlePool} from '/teach-arcade-visuals/core/particles-three.js';
const cues = createCues({reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches});
const pool = createParticlePool(scene, cues.random);
pool.setLimit(qualityFor('standard').particles);
// When the engine reports an impact:
pool.burst(x, y, z, 0xffffff, 12);
// During active rendering only:
pool.update(dt);
// When unloading:
pool.dispose();
```

`cues.emit(name, detail)` is an interface for sound, not audio playback. Snow emits `teach-arcade:audio` CustomEvents for answer-correct, answer-incorrect, enemy-hit, enemy-cleared, fort-hit, fort-repair, squad-loss, snow-burst, wave-intro and notice. No audio files or AudioContext required. A future consumer can listen after user interaction; it must handle mute/volume/autoplay itself.

## Assets and fallbacks

Uses the repository's existing `/assets/vendor/three-0.162.0/three.module.js` (MIT). No external graphics downloads, fonts, image requests, texture atlases or audio assets. Particle alpha texture is a shared 16×16 procedural DataTexture. Missing storage uses Standard for the session. Invalid saved quality falls back to Standard. Reduced-motion preference removes weather, camera shake, flag motion and UI cues; it also uses minimal impact counts. Performance never changes gameplay. WebGL failure keeps the existing clear unsupported-device message; there is no claimed 2D game fallback.

Weather owns fixed typed arrays, draws only the selected subset, and costs one draw call per enabled layer. Impacts use one draw call, bounded memory and no per-burst mesh/material allocations. Snow-specific fixed character parts are baked into cached vertex-colored geometry: two base draws per creature and four per defender including shadow/animated arms. Profile large squads/crowds before adding shadows/bloom. All modes use blob shadows, with fixed scenery instanced. Dispose pools on unload; the shared tiny alpha texture lives for the module lifetime.

## Rollout

The canonical tracker is `/visual-upgrades/manifest.json`; assessment, checklist, provenance and performance evidence live beside it. Status remains `awaiting-visual-review`, not complete. Finalize extraction/API only after benchmark approval. For another game: inspect → capture baseline → visual pass → preserve rules/tests → compare → approve → refine shared modules → update tracker.

Next recommended test: Quest Arcade, after this benchmark is approved. Its slower top-down play would test screen readability, interaction/reward cues and a different environment without another projectile-heavy stress case. Gaps: 2D renderer adapter, reusable scene transitions, asset-loading conventions, real audio playback and physical Chromebook/browser measurements. Do not add these speculatively.
