// Cancel a prior cue instead of queuing animations during rapid rewards.
const running=new WeakMap();
export function uiCue(element,kind='pop',reducedMotion=false){
 if(!element)return;
 running.get(element)?.cancel();
 if(!element.animate||reducedMotion)return;
 const frames=kind==='damage'?[{boxShadow:'inset 0 0 0 3px #ff927c'},{boxShadow:'inset 0 0 0 0px transparent'}]:[{transform:'scale(1.10)'},{transform:'scale(1)'}];
 running.set(element,element.animate(frames,{duration:280,easing:'ease-out'}));
}
