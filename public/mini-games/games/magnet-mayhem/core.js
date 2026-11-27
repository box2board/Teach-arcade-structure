// Physics shared by the solo game and multiplayer room engines.
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createGate(random,ball,gates=0){
  let best=null,bestDistance=-1;
  for(let i=0;i<20;i++){
    const candidate={baseX:95+random()*410,baseY:120+random()*400,
      r:Math.max(34,55-gates*2),phase:random()*Math.PI*2};
    const distance=Math.hypot(candidate.baseX-ball.x,candidate.baseY-ball.y);
    if(distance>bestDistance){best=candidate;bestDistance=distance;}
    if(distance>220)break;
  }
  if(bestDistance<180){
    for(const [x,y] of [[95,120],[505,120],[95,520],[505,520]]){
      const distance=Math.hypot(x-ball.x,y-ball.y);
      if(distance>bestDistance){bestDistance=distance;best.baseX=x;best.baseY=y;}
    }
  }
  return updateGate(best,0,gates);
}

export function updateGate(gate,elapsed,gates=0){
  gate.x=gate.baseX+(elapsed>10?Math.sin(elapsed*(.7+gates*.04)+gate.phase)*Math.min(25,gates*4):0);
  gate.y=gate.baseY+(elapsed>20?Math.cos(elapsed*.7+gate.phase)*15:0);
  return gate;
}

export function gateContains(ball,gate){
  return Math.hypot(ball.x-gate.x,ball.y-gate.y)<gate.r-(ball.r??14)*.45;
}

export function barriersAt(elapsed){
  if(elapsed<8)return [];
  const barriers=[
    {x:300+Math.sin(elapsed*.9)*110,y:250,r:23},
    {x:300+Math.cos(elapsed*.7)*105,y:440,r:23}
  ];
  if(elapsed>25)barriers.push({x:300+Math.sin(elapsed*1.3)*100,y:345,r:19});
  return barriers;
}

export function advanceBall(ball,magnets,dt,elapsed){
  for(const magnet of magnets){
    const dx=magnet.x-ball.x,dy=magnet.y-ball.y,distance=Math.max(.001,Math.hypot(dx,dy));
    const attracting=magnet.attract??magnet.input?.attract??false;
    const force=Math.min(650,90000/(distance+55))*(attracting?1:-.78)*(1+elapsed/160);
    const weight=1/Math.sqrt(magnets.length||1);
    ball.vx+=dx/distance*force*dt*weight;
    ball.vy+=dy/distance*force*dt*weight;
  }
  ball.vx*=Math.exp(-dt*2.5);ball.vy*=Math.exp(-dt*2.5);
  const speed=Math.hypot(ball.vx,ball.vy);
  if(speed>390){ball.vx*=390/speed;ball.vy*=390/speed;}
  ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
  for(const [axis,min,max] of [['x',34,566],['y',75,586]]){
    const velocity=axis==='x'?'vx':'vy';
    if(ball[axis]<min){ball[axis]=min;ball[velocity]=Math.abs(ball[velocity])*.7;}
    if(ball[axis]>max){ball[axis]=max;ball[velocity]=-Math.abs(ball[velocity])*.7;}
  }
  for(const magnet of magnets){
    const dx=ball.x-magnet.x,dy=ball.y-magnet.y,distance=Math.hypot(dx,dy);
    if(distance<37){
      const nx=distance>.001?dx/distance:0,ny=distance>.001?dy/distance:-1;
      ball.x=magnet.x+nx*37;ball.y=magnet.y+ny*37;
      const toward=ball.vx*nx+ball.vy*ny;
      if(toward<0){ball.vx-=toward*1.2*nx;ball.vy-=toward*1.2*ny;}
    }
  }
  if('spin' in ball)ball.spin+=Math.hypot(ball.vx,ball.vy)*dt/14;
  return ball;
}

export function resolveBarriers(ball,barriers){
  const radius=ball.r??14;let collisions=0;
  for(const bumper of barriers){
    const dx=ball.x-bumper.x,dy=ball.y-bumper.y,distance=Math.hypot(dx,dy);
    if(distance<bumper.r+radius){
      const nx=distance>.001?dx/distance:1,ny=distance>.001?dy/distance:0;
      ball.x=bumper.x+nx*(bumper.r+radius);ball.y=bumper.y+ny*(bumper.r+radius);
      const toward=ball.vx*nx+ball.vy*ny;
      if(toward<0){ball.vx-=toward*1.7*nx;ball.vy-=toward*1.7*ny;}
      collisions++;
    }
  }
  return collisions;
}
