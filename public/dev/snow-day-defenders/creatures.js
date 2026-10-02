// Creature rules stay independent of rendering and question content.
export const CREATURE_TYPES=Object.freeze([
 {name:'Snow Pal',hint:'Steady groups',accent:'#8f7fc0',size:1,speed:1.7,radius:.65},
 {name:'Snow Hopper',hint:'Quick hopping runners',accent:'#52a995',size:.68,speed:2.8,radius:.65},
 {name:'Bucket Giant',hint:'Sturdy and slow',accent:'#ec9e55',size:1.4,speed:1.15,radius:.75},
 {name:'Snow Wiggler',hint:'Weaves between lanes',accent:'#458fca',size:.9,speed:1.9,radius:.65},
 {name:'Snow Roller',hint:'Builds speed as it approaches',accent:'#cf709a',size:1,speed:1.4,radius:.8}
]);
export function advanceCreature(e,dt,multiplier){
 const slow=e.slowTime>0?.55:1;e.age+=dt*slow;
 if(e.type===3)e.x=Math.max(-5.1,Math.min(5.1,e.baseX+Math.sin(e.age*2.4+e.phase)*1.15));
 const speed=e.type===4?e.speed+Math.max(0,Math.min(1,(e.z-e.spawnZ)/26))*1.4:e.speed;
 const travel=speed*multiplier*dt*slow;e.z+=travel;
 if(e.type===4)e.roll+=travel/(.8*e.size);
}
