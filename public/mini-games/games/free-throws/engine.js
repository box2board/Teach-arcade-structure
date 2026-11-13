// One rising charge per shot. The current stage is locked at the start of each charge.
export const DURATION=40,CHARGE_TIME=1.15,TARGET=.65,SWISH_WINDOW=.055;
const warmup = { name: 'WARM-UP', chargeTime: CHARGE_TIME, window: .17, swishWindow: SWISH_WINDOW, targets: [TARGET] };
const gameTime = { name: 'GAME TIME', chargeTime: 1.02, window: .10, swishWindow: .04, targets: [.73, .53, .63] };
const clutchTime = { name: 'CLUTCH TIME', chargeTime: .92, window: .065, swishWindow: .025, targets: [.80, .46, .64] };

function difficultyAt(time) {
  if (time < 9) return warmup;
  if (time < 25) return gameTime;
  return clutchTime;
}
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function shotPower(hold, chargeTime = CHARGE_TIME) {
  return clamp(hold / chargeTime, 0, 1);
}
export function hoopAt(motionTime,time=0){return {x:time<9?0:Math.sin(motionTime*.8)*.34,y:0};}
export function makeWindow(time) { return difficultyAt(time).window; }

export function judgeShot(power, window = warmup.window, target = TARGET, swishWindow = SWISH_WINDOW, random = Math.random) {
  const error = power - target;
  const distance = Math.abs(error);
  const swish = distance <= swishWindow;
  const edge = !swish && distance <= window + 1e-9;
  const lucky = !swish && !edge && random() < .05;
  const make = swish || (edge && random() < .70) || lucky;
  const label = lucky ? 'RIM ROLLER!' : swish ? 'SWISH!' : make ? 'BUCKET!' : error < 0 ? 'A LITTLE SHORT' : 'TOO MUCH POWER';
  return { error, make, swish, edge, lucky, label };
}
export function createHoops(onEvent=()=>{}){
 let s,prior='playing';
 function reset(){s={phase:'intro',countdown:2,time:0,motionTime:0,holding:false,hold:0,score:0,attempts:0,makes:0,swishes:0,specialMakes:0,streak:0,bestStreak:0,shot:null,last:null,result:null,chargeConfig:null};}
 function config() {
   if (s.chargeConfig) return s.chargeConfig;
   const gold = s.attempts % 5 === 4;
   const difficulty = difficultyAt(s.time);
   return {
     name: gold ? 'GOLD BALL' : 'CLASSIC',
     color: gold ? '#ffdb51' : '#ff883c',
     multiplier: gold ? 2 : 1,
     stage: difficulty.name,
     chargeTime: difficulty.chargeTime,
     window: difficulty.window,
     swishWindow: difficulty.swishWindow,
     target: difficulty.targets[s.attempts % difficulty.targets.length],
     hoop: hoopAt(s.motionTime, s.time),
     rim: .72,
     flight: 1.05,
   };
 }
 function cancel(){s.holding=false;s.hold=0;s.chargeConfig=null;}
 function start(){reset();s.phase='countdown';}
 function begin(){if(s.phase!=='playing'||s.shot||s.holding)return false;s.chargeConfig={...config()};s.holding=true;s.hold=0;return true;}
 function release(){if(!s.holding||s.phase!=='playing')return false;const cfg=config(),power=shotPower(s.hold,cfg.chargeTime),outcome=judgeShot(power,cfg.window,cfg.target,cfg.swishWindow);cancel();s.attempts++;s.shot={...cfg,...outcome,rim:outcome.lucky?1.08:cfg.rim,flight:outcome.lucky?1.36:cfg.flight,power,age:0,resolved:false,points:0};onEvent({type:'release',shot:s.shot});return true;}
 function resolve(){const shot=s.shot;if(!shot||shot.resolved)return;shot.resolved=true;if(shot.make){s.makes++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);if(shot.swish)s.swishes++;if(shot.multiplier>1)s.specialMakes++;shot.points=((shot.swish?3:2)+Math.min(3,Math.floor(s.streak/3)))*shot.multiplier;s.score+=shot.points;}else s.streak=0;s.last={...shot};onEvent({type:'basket',shot:s.last});}
 function finish(){if(s.phase==='finished')return;cancel();s.phase='finished';s.result={gameId:'free-throws',rulesVersion:6,score:s.score,attempts:s.attempts,makes:s.makes,accuracy:s.attempts?Math.round(s.makes/s.attempts*100):0,swishes:s.swishes,specialMakes:s.specialMakes,bestStreak:s.bestStreak,time:DURATION};onEvent({type:'finish',result:s.result});}
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
