# Teach Arcade Visual System 0.1.0-rc.1

This candidate system grows from the Snow Day Defender benchmark. Appearance and motion passes have user approval; the API remains provisional while device validation is pending. No next game has been upgraded.

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
| `core/ui.js` | Short HUD/reward cues | `uiCue(element,'pop'|'damage',reducedMotion)`; cancels prior animation; static fallback without Web Animations |

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

The canonical tracker is `/visual-upgrades/manifest.json`; assessment, checklist, provenance and performance evidence live beside it. Status is `release-preview-awaiting-review`, not complete. Appearance and motion were approved on 2026-10-28; finalize extraction/API after remaining benchmark validation. For another game: inspect → capture baseline → visual pass → preserve rules/tests → compare → approve → refine shared modules → update tracker.

Next recommended test: Quest Arcade, after this benchmark is approved. Its slower top-down play would test screen readability, interaction/reward cues and a different environment without another projectile-heavy stress case. Gaps: 2D renderer adapter, reusable scene transitions, asset-loading conventions, real audio playback and physical Chromebook/browser measurements. Do not add these speculatively.

## Release candidate, 2026-10-29

The public Snow Day entry now launches the same approved squad runtime with the existing shared Review Lab catalog and prepareSnowQuestions adapter. Development-only controls remain at /dev/snow-day-visuals/. No new generic systems were needed for release integration. The four actual shared modules above are the v0.1 API candidate; Snow motion, camera framing, outfits, fort, weather theme, static surface shading and feature decorations stay game-specific. Version 0.1.0-rc.1 identifies this release candidate, not production publication or completed Chromebook validation.

Measured user report: iPhone Safari, Standard, 60.386 active seconds, 57.414 average requestAnimationFrame FPS, p95 frame interval 23ms. Independent peaks: 26 defenders and 138 enemies. Two-feature visual fixture, reaching wave two; no claim of normal random-five/boss/Chromebook coverage. Next benchmark remains Quest Arcade, only after separate authorization. The current gaps remain 2D adaptation, actual audio, general transitions and target-device evidence; no speculative implementations were added.
