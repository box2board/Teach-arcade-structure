// Cancel a prior cue instead of queuing animations during rapid rewards.
const running=new WeakMap();
export function uiCue(element,kind='pop',reducedMotion=false){
 if(!element?.animate||reducedMotion)return;
 running.get(element)?.cancel();
 const frames=kind==='damage'?[{backgroundColor:'#ffd9cc'},{backgroundColor:'#f3faffed'}]:kind==='intro'?[{opacity:0,transform:'translate(-50%, 10px)'},{opacity:1,transform:'translate(-50%, 0)',offset:.12},{opacity:1,offset:.72},{opacity:0,transform:'translate(-50%, -6px)'}]:[{transform:'scale(1.10)'},{transform:'scale(1)'}];
 running.set(element,element.animate(frames,{duration:kind==='intro'?2800:280,easing:'ease-out'}));
}
