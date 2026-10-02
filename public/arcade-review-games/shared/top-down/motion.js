import {move,obstacle,directions} from './model.js';

// World coordinates describe the player's feet. Puzzle objects remain on the grid.
export function createMotion(state){return {x:state.player.x,y:state.player.y,time:0,pushAt:-Infinity};}
export function syncMotion(motion,state){motion.x=state.player.x;motion.y=state.player.y;motion.pushAt=-Infinity;}
const radius=.28,speed=4;
export function interactionTarget(map,state,motion){
  const [fx,fy]=directions[state.facing],candidates=[...map.doors,...state.blocks.filter(b=>b.kind==='mirror'),...map.objects.filter(o=>['sign','challenge','lever','bridgeSwitch','bridge','receiver','emitter','exit'].includes(o.type)&&!state.collected.includes(o.id))];
  return candidates.map(target=>{
    const dx=target.x-motion.x,dy=target.y-motion.y,distance=Math.hypot(dx,dy),forward=dx*fx+dy*fy,lateral=Math.abs(dx*fy-dy*fx);
    const near=target.type==='exit'?distance<=.65&&state.player.x===target.x&&state.player.y===target.y:distance<=1.4&&forward>.1&&lateral<=.75;
    if(!near)return null;
    // Check the whole approach, including narrow diagonal corners.
    const steps=Math.ceil(distance/.06);
    for(let i=1;i<steps;i++)for(const ox of [-.025,.025])for(const oy of [-.025,.025]){
      const tile={x:Math.round(motion.x+dx*i/steps+ox),y:Math.round(motion.y+dy*i/steps+oy)};
      if(tile.x===target.x&&tile.y===target.y)continue;
      if(obstacle(map,state,tile)||state.blocks.some(b=>b.x===tile.x&&b.y===tile.y))return null;
    }
    return {target,score:target.type==='exit'?-1:distance+lateral*.25};
  }).filter(Boolean).sort((a,b)=>a.score-b.score)[0]?.target||null;
}
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
  let changed=false,worldChanged=false;const before={x:motion.x,y:motion.y};
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
      const offset=axis==='x'?motion.y-hit.y:motion.x-hit.x;
      const straight=axis==='x'?input.y===0:input.x===0;
      const aligned=Math.abs(offset)<.42&&straight;
      if(hit.block&&aligned&&Math.abs(offset)>.08){
        const correction=-Math.sign(offset)*Math.min(Math.abs(offset),dt/steps*2);
        const ax=motion.x+(axis==='y'?correction:0),ay=motion.y+(axis==='x'?correction:0);
        if(!hits(map,state,ax,ay).length){motion.x=ax;motion.y=ay;}
        return;
      }
      if((door||hit.block&&aligned)&&motion.time-motion.pushAt>=.25){
        const original={...state.player};
        if(move(map,state,direction)){state.player=original;changed=true;worldChanged=true;}
        motion.pushAt=motion.time;
        state.facing=facing;
        collisions=hits(map,state,x,y);
      }
    }
    if(collisions.length)return;
    const tile={x:Math.round(x),y:Math.round(y)};
    if(tile.x!==state.player.x||tile.y!==state.player.y){
      const collected=state.collected.length;
      if(!move(map,state,direction)){state.facing=facing;return;}
      if(state.collected.length!==collected)worldChanged=true;
      changed=true;state.facing=facing;
    }
    motion.x=x;motion.y=y;
  }
  for(let i=0;i<steps;i++){axis('x',dx/steps);axis('y',dy/steps);}
  return {moved:Math.hypot(motion.x-before.x,motion.y-before.y)>1e-6,changed,worldChanged};
}
