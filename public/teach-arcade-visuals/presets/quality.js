// Explicit selection beats hardware guessing. No simulation values belong here.
export const VERSION='0.1.0-preview';
export const QUALITY=Object.freeze({
 performance:Object.freeze({pixelRatio:1,weather:48,particles:48,layers:1,impulse:0}),
 standard:Object.freeze({pixelRatio:1.35,weather:180,particles:160,layers:2,impulse:.055}),
 showcase:Object.freeze({pixelRatio:1.75,weather:360,particles:280,layers:3,impulse:.085})
});
export const qualityFor=name=>QUALITY[name]||QUALITY.standard;
