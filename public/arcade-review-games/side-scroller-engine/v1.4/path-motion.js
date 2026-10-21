/* Absolute top-left waypoint paths. Shared by the creator preview and runtime. */
(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
 function advance(o,dt,speed=o.speed||55){const points=o.path;if(!Array.isArray(points)||points.length<2||speed<=0)return;let state=o._route;if(!state)state=o._route={index:0,direction:1,wait:o.pathPause||0};let remaining=dt,steps=0;
  while(remaining>1e-9&&steps++<512){if(state.wait>0){const used=Math.min(remaining,state.wait);state.wait-=used;remaining-=used;if(!remaining)break;}
   let next=state.index+state.direction;if(next>=points.length||next<0){if(o.pathMode==='loop')next=(next+points.length)%points.length;else{state.direction*=-1;next=state.index+state.direction;}}
   const target=points[next],dx=target.x-o.x,dy=target.y-o.y,distance=Math.hypot(dx,dy),travel=speed*remaining;
   if(distance<=travel+1e-9){o.x=target.x;o.y=target.y;remaining-=distance/speed;state.index=next;state.wait=target.pause??o.pathPause??0;}
   else{o.x+=dx/distance*travel;o.y+=dy/distance*travel;remaining=0;}
  }
 }
 TA.PathMotion={advance};
})();
