// Render-independent cosmetic cues. Never consume the game's random stream.
export function cosmeticRandom(seed=7301){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
export function createCues({reducedMotion=false,onAudio=()=>{}}={}){
 let strength=0,age=0;const random=cosmeticRandom();
 return {
  emit(name,detail={}){onAudio({name,...detail});},
  impulse(amount){if(!reducedMotion)strength=Math.max(strength,Math.min(.12,amount));},
  tick(dt){age+=dt;strength*=Math.exp(-dt*14);return reducedMotion?{x:0,y:0}:{x:Math.sin(age*83)*strength,y:Math.cos(age*69)*strength*.5};},
  reset(){strength=0;},random,
  setReducedMotion(value){reducedMotion=!!value;strength=0;}
 };
}
