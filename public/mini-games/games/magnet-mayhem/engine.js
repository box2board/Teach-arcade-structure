import {advanceBall,barriersAt,clamp,createGate,gateContains,resolveBarriers,updateGate} from './core.js';
export {clamp};

export function createMagnet(random=Math.random){
  let s;
  function effect(x,y,text){s.effects.push({x,y,text,t:0});}
  function start(){
    s={phase:'playing',time:0,score:0,gates:0,combo:0,bumps:0,attract:false,
      magnet:{x:300,y:490,tx:300,ty:490},
      ball:{x:300,y:320,vx:0,vy:0,r:14,spin:0},goal:null,barriers:[],effects:[],hit:0,
      bonuses:[{x:58,y:95,cool:0},{x:542,y:555,cool:0}],
      message:'MOVE THE MAGNET · HOLD TO PULL · RELEASE TO PUSH'};
    s.goal=createGate(random,s.ball,s.gates);
    return s;
  }
  function aim(x,y){if(s?.phase==='playing'){s.magnet.tx=clamp(x,38,562);s.magnet.ty=clamp(y,66,594);}}
  function hold(value){if(s?.phase==='playing')s.attract=!!value;}
  function step(dt){
    s.time=Math.min(40,s.time+dt);s.hit=Math.max(0,s.hit-dt);
    const b=s.ball,m=s.magnet;
    m.x+=(m.tx-m.x)*(1-Math.exp(-dt*24));m.y+=(m.ty-m.y)*(1-Math.exp(-dt*24));
    advanceBall(b,[{x:m.x,y:m.y,attract:s.attract}],dt,s.time);
    const g=updateGate(s.goal,s.time,s.gates);
    if(gateContains(b,g)){
      s.gates++;s.combo++;
      const points=20+Math.min(5,s.combo)*5;s.score+=points;
      effect(g.x,g.y,'GATE +'+points);
      s.message=s.gates===2?'MOVING BUMPERS ONLINE · KEEP THE BALL CLEAR':'GATE '+s.gates+' · FOLLOW THE NEXT RING';
      s.goal=createGate(random,b,s.gates);
    }
    s.barriers=barriersAt(s.time);
    if(resolveBarriers(b,s.barriers)&&!s.hit){
      s.hit=.7;s.bumps++;s.combo=0;s.score=Math.max(0,s.score-5);
      effect(b.x,b.y,'BUMP −5');s.message='BUMPER HIT · USE PULL TO BRAKE';
    }
    for(const bonus of s.bonuses){
      bonus.cool=Math.max(0,bonus.cool-dt);
      if(!bonus.cool&&Math.hypot(b.x-bonus.x,b.y-bonus.y)<26){
        bonus.cool=8;s.score+=15;effect(bonus.x,bonus.y,'BONUS +15');
      }
    }
    for(const e of s.effects)e.t+=dt;
    s.effects=s.effects.filter(e=>e.t<1);
  }
  function tick(dt){
    if(s?.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    let left=Math.min(dt,40-s.time);
    while(left>1e-8){const stepSize=Math.min(left,1/120);step(stepSize);left-=stepSize;}
    if(s.time>=40-1e-6){s.time=40;s.phase='finished';s.attract=false;}
  }
  return {get s(){return s;},start,aim,hold,tick,
    pause(){if(s?.phase==='playing'){s.phase='paused';s.attract=false;}},
    resume(){if(s?.phase==='paused')s.phase='playing';}};
}
