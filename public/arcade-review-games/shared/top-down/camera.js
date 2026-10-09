// Animate only room changes, never ordinary movement or puzzle redraws.
const flights=new WeakMap();
export function cancelCamera(world){
  flights.get(world)?.cancel();
  flights.delete(world);
}
export function updateCamera(world,update,{glide=false,reducedMotion=false}={}){
  const canGlide=glide&&!reducedMotion&&typeof world.animate==='function'&&typeof world.getBoundingClientRect==='function';
  // Capture the visible position before canceling an interrupted flight.
  const before=canGlide?world.getBoundingClientRect():null;
  cancelCamera(world);
  update();
  if(!before)return;
  const after=world.getBoundingClientRect();
  if(!before.width||!before.height||!after.width||!after.height)return;
  const dx=before.left-after.left,dy=before.top-after.top;
  const sx=before.width/after.width,sy=before.height/after.height;
  if(Math.abs(dx)+Math.abs(dy)<.5&&Math.abs(sx-1)+Math.abs(sy-1)<.001)return;
  const flight=world.animate([
    {transformOrigin:'0 0',transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},
    {transformOrigin:'0 0',transform:'none'}
  ],{duration:260,easing:'cubic-bezier(.22,.61,.36,1)'});
  flights.set(world,flight);
  flight.onfinish=()=>{if(flights.get(world)===flight)flights.delete(world);};
}
