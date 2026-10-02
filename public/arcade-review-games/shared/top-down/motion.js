import {move,obstacle,directions} from './model.js';

// World coordinates describe the player's feet. Puzzle objects remain on the grid.
export function createMotion(state){return {x:state.player.x,y:state.player.y,time:0,pushAt:-Infinity};}
export function syncMotion(motion,state){motion.x=state.player.x;motion.y=state.player.y;motion.pushAt=-Infinity;}
const radius=.28,speed=4;
function hits(map,state,x,y){
  const cx=x+.5,cy=y+.5,result=[];
  for(let ty=Math.floor(cy-radius);ty<=Math.floor(cy+radius);ty++){
    for(let tx=Math.floor(cx-radius);tx<=Math.floor(cx+radius);tx++){
      const block=state.blocks.find(b=>b.x===tx&&b.y===ty);
      if(!block&&!obstacle(map,state,{x:tx,y:ty}))continue;
      const dx=cx-Math.max(tx,Math.min(cx,tx+1)),dy=cy-Math.max(ty,Math.min(cy,ty+1));
      if(dx*dx+dy*dy<radius*radius-1e-9)result.push({x:tx,y:ty,block});
    }
  }
  return result;
}
export function advanceMotion(map,state,motion,input,seconds){
  if(state.won||!Number.isFinite(seconds)||seconds<=0)return {moved:false,changed:false};
  const length=Math.hypot(input.x,input.y);
  if(!length)return {moved:false,changed:false};
  const dt=Math.min(seconds,.05),dx=input.x/length*speed*dt,dy=input.y/length*speed*dt;
  const facing=Math.abs(input.x)>Math.abs(input.y)?(input.x>0?'right':'left'):(input.y>0?'down':'up');
  state.facing=facing;motion.time+=dt;
  let changed=false;const before={x:motion.x,y:motion.y};
  const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.06);
  function axis(axis,amount){
    if(!amount)return;
    const x=motion.x+(axis==='x'?amount:0),y=motion.y+(axis==='y'?amount:0);
    const direction=axis==='x'?(amount>0?'right':'left'):(amount>0?'down':'up');
    const [vx,vy]=directions[direction],front={x:state.player.x+vx,y:state.player.y+vy};
    let collisions=hits(map,state,x,y);
    // Approach doors and push centered blocks without snapping the explorer.
    if(collisions.length===1&&collisions[0].x===front.x&&collisions[0].y===front.y){
      const hit=collisions[0],door=map.doors.find(d=>d.x===hit.x&&d.y===hit.y);
      const aligned=Math.abs(axis==='x'?motion.y-hit.y:motion.x-hit.x)<.2;
      if((door||hit.block&&aligned)&&motion.time-motion.pushAt>=.25){
        const original={...state.player};
        if(move(map,state,direction)){state.player=original;changed=true;}
        motion.pushAt=motion.time;
        state.facing=facing;
        collisions=hits(map,state,x,y);
      }
    }
    if(collisions.length)return;
    const tile={x:Math.round(x),y:Math.round(y)};
    if(tile.x!==state.player.x||tile.y!==state.player.y){
      if(!move(map,state,direction)){state.facing=facing;return;}
      changed=true;state.facing=facing;
    }
    motion.x=x;motion.y=y;
  }
  for(let i=0;i<steps;i++){axis('x',dx/steps);axis('y',dy/steps);}
  return {moved:Math.hypot(motion.x-before.x,motion.y-before.y)>1e-6,changed};
}
