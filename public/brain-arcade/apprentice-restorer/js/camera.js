// A dead zone keeps the opening scene steady; movement scrolls both axes.
export function followCamera(camera,player,view,world,dt){
  const next={...camera},blend=1-Math.exp(-dt*10);
  for(const [axis,size,extent] of [['x',view.width,world.width],['y',view.height,world.height]]){
    const screen=player[axis]-camera[axis];
    const target=screen<size*.18?player[axis]-size*.18:screen>size*.82?player[axis]-size*.82:camera[axis];
    next[axis]+= (Math.max(0,Math.min(extent-size,target))-camera[axis])*blend;
  }
  return next;
}
