// Cancel a prior cue instead of queuing animations during rapid rewards.
const running=new WeakMap();
export function uiCue(element,kind='pop',reducedMotion=false){
 if(!element?.animate||reducedMotion)return;
 running.get(element)?.cancel();
 const frames=kind==='damage'?[{backgroundColor:'#ffd9cc'},{backgroundColor:'#f3faffed'}]:[{transform:'scale(1.10)'},{transform:'scale(1)'}];
 running.set(element,element.animate(frames,{duration:280,easing:'ease-out'}));
}
