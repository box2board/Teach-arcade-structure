// Consistent one-input arcade shooting. Difficulty changes between shots only.
export const DURATION=40,CHARGE_TIME=1.15,TARGET=.65;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function shotPower(hold){const p=Math.max(0,hold)/CHARGE_TIME%2;return p<=1?p:2-p;}
export function hoopAt(motionTime,time=0){return {x:time<12?0:Math.sin(motionTime*.8)*.34,y:0};}
export function makeWindow(time){return time<12?.22:time<27?.19:.16;}
export function judgeShot(power,window=.22){const error=power-TARGET,make=Math.abs(error)<=window+1e-9,swish=make&&Math.abs(error)<=.055;return {error,make,swish,label:swish?'SWISH!':make?'BUCKET!':error<0?'A LITTLE SHORT':'TOO MUCH POWER'};}
export function createHoops(onEvent=()=>{}){
 let s,prior='playing';
 function reset(){s={phase:'intro',countdown:2,time:0,motionTime:0,holding:false,hold:0,score:0,attempts:0,makes:0,swishes:0,specialMakes:0,streak:0,bestStreak:0,shot:null,last:null,result:null,chargeConfig:null};}
 function config(){if(s.chargeConfig)return s.chargeConfig;const gold=s.attempts%5===4;return {name:gold?'GOLD BALL':'CLASSIC',color:gold?'#ffdb51':'#ff883c',multiplier:gold?2:1,window:makeWindow(s.time),target:TARGET,hoop:hoopAt(s.motionTime,s.time),rim:.72,flight:1.05};}
 function cancel(){s.holding=false;s.hold=0;s.chargeConfig=null;}
 function start(){reset();s.phase='countdown';}
 function begin(){if(s.phase!=='playing'||s.shot||s.holding)return false;s.chargeConfig={...config()};s.holding=true;s.hold=0;return true;}
 function release(){if(!s.holding||s.phase!=='playing')return false;const cfg=config(),power=shotPower(s.hold);cancel();s.attempts++;s.shot={...cfg,power,...judgeShot(power,cfg.window),age:0,resolved:false,points:0};onEvent({type:'release',shot:s.shot});return true;}
 function resolve(){const shot=s.shot;if(!shot||shot.resolved)return;shot.resolved=true;if(shot.make){s.makes++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);if(shot.swish)s.swishes++;if(shot.multiplier>1)s.specialMakes++;shot.points=((shot.swish?3:2)+Math.min(3,Math.floor(s.streak/3)))*shot.multiplier;s.score+=shot.points;}else s.streak=0;s.last={...shot};onEvent({type:'basket',shot:s.last});}
 function finish(){if(s.phase==='finished')return;cancel();s.phase='finished';s.result={gameId:'free-throws',rulesVersion:3,score:s.score,attempts:s.attempts,makes:s.makes,accuracy:s.attempts?Math.round(s.makes/s.attempts*100):0,swishes:s.swishes,specialMakes:s.specialMakes,bestStreak:s.bestStreak,time:DURATION};onEvent({type:'finish',result:s.result});}
 function advance(dt){if(!s.shot)return;s.shot.age+=dt;if(s.shot.age>=s.shot.rim)resolve();if(s.shot.age>=s.shot.flight)s.shot=null;}
 function tick(dt){if(!Number.isFinite(dt)||dt<=0||['intro','paused','finished'].includes(s.phase))return;
  if(s.phase==='countdown'){const used=Math.min(dt,s.countdown);s.countdown-=used;dt-=used;if(s.countdown>1e-8)return;s.phase='playing';onEvent({type:'go'});}
  if(s.phase==='buzzer'){advance(dt);if(!s.shot)finish();return;}
  const used=Math.min(dt,DURATION-s.time);if(!s.shot&&!s.holding)s.motionTime+=used;s.time+=used;if(s.holding)s.hold+=used;advance(used);
  if(s.time>=DURATION-1e-8){s.time=DURATION;cancel();s.phase='buzzer';advance(dt-used);if(!s.shot)finish();}
 }
 function pause(){if(['countdown','playing','buzzer'].includes(s.phase)){prior=s.phase;cancel();s.phase='paused';}}
 function resume(){if(s.phase==='paused')s.phase=prior;}
 reset();return {get state(){return s;},config,start,begin,release,cancel,pause,resume,tick};
}
