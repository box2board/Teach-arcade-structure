export const DURATION=40,AIM_WINDOW=.11;
export const BALLS=[
  {name:'CLASSIC',color:'#f69a38',charge:.9,rim:.82,window:.055,target:.62,multiplier:1},
  {name:'HEAVY',color:'#9b99ff',charge:1.2,rim:1.05,window:.045,target:.75,multiplier:2},
  {name:'LIGHTNING',color:'#50edff',charge:.62,rim:.60,window:.045,target:.68,multiplier:2},
  {name:'GOLD',color:'#ffe16a',charge:.8,rim:.82,window:.035,target:.55,multiplier:3}
];
export function hoopAt(time){const bob=Math.min(1,Math.max(0,(time-20)/1.2));return {x:.56*Math.sin(time*1.25),y:bob*.075*Math.sin(time*2)};}
export function shotPower(hold,charge=.9){const t=(Math.max(0,hold)/charge)%2;return t<=1?t:2-t;}
export function judgeShot(power,target,aim,hoopX,window=.055){const error=power-target,aimError=aim-hoopX,make=Math.abs(error)<=window&&Math.abs(aimError)<=AIM_WINDOW,swish=make&&Math.abs(error)<=.014&&Math.abs(aimError)<=.035;return {error,aimError,make,swish,label:swish?'SWISH':make?'BUCKET':Math.abs(aimError)>AIM_WINDOW?(aimError<0?'WIDE LEFT':'WIDE RIGHT'):error<0?'SHORT':'TOO STRONG'};}
export function createHoops(onEvent=()=>{}){
  let s,prior='playing';
  function reset(){s={phase:'intro',countdown:3,time:0,motionTime:0,aim:0,holding:false,hold:0,score:0,attempts:0,makes:0,swishes:0,specialMakes:0,streak:0,bestStreak:0,shot:null,last:null,result:null};}
  function config(){const ball=BALLS[s.attempts%4],arrival=hoopAt(s.motionTime+ball.rim);return {...ball,target:ball.target+arrival.y*.75,arrival};}
  function start(){reset();s.phase='countdown';}
  function setAim(value){if(Number.isFinite(value)&&s.phase==='playing'&&!s.shot)s.aim=Math.max(-1,Math.min(1,value));}
  function begin(){if(s.phase!=='playing'||s.shot||s.holding)return false;s.holding=true;s.hold=0;return true;}
  function cancel(){s.holding=false;s.hold=0;}
  function release(){if(!s.holding||s.phase!=='playing')return false;const ball=config(),power=shotPower(s.hold,ball.charge),aim=s.aim;cancel();s.attempts++;s.shot={...ball,power,aim,...judgeShot(power,ball.target,aim,ball.arrival.x,ball.window),age:0,resolved:false,points:0,bonus:0,flight:ball.rim+.48};onEvent({type:'release',shot:s.shot});return true;}
  function resolve(){const shot=s.shot;if(!shot||shot.resolved)return;shot.resolved=true;if(shot.make){s.makes++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);if(shot.swish)s.swishes++;if(shot.multiplier>1)s.specialMakes++;shot.bonus=Math.min(3,Math.floor(s.streak/3));shot.points=((shot.swish?3:2)+shot.bonus)*shot.multiplier;s.score+=shot.points;}else s.streak=0;s.last={...shot};onEvent({type:'basket',shot:s.last});}
  function finish(){if(s.phase==='finished')return;cancel();s.phase='finished';s.result={gameId:'free-throws',rulesVersion:2,score:s.score,attempts:s.attempts,makes:s.makes,swishes:s.swishes,specialMakes:s.specialMakes,bestStreak:s.bestStreak,accuracy:s.attempts?Math.round(s.makes/s.attempts*100):0,time:DURATION};onEvent({type:'finish',result:s.result});}
  function advanceBall(dt){if(!s.shot)return;s.shot.age+=dt;if(s.shot.age>=s.shot.rim)resolve();if(s.shot.age>=s.shot.flight)s.shot=null;}
  function tick(dt){if(!Number.isFinite(dt)||dt<=0||['intro','paused','finished'].includes(s.phase))return;if(s.phase==='countdown'){const used=Math.min(dt,s.countdown);s.countdown-=used;dt-=used;if(s.countdown>0)return;s.phase='playing';onEvent({type:'go'});}if(s.phase==='buzzer'){s.motionTime+=dt;advanceBall(dt);if(!s.shot)finish();return;}const used=Math.min(dt,DURATION-s.time);s.time+=used;s.motionTime+=used;if(s.holding)s.hold+=used;advanceBall(used);if(s.time>=DURATION-1e-8){s.time=DURATION;cancel();s.phase='buzzer';if(s.shot){s.motionTime+=dt-used;advanceBall(dt-used);if(!s.shot)finish();}else finish();}}
  function pause(){if(['playing','countdown','buzzer'].includes(s.phase)){prior=s.phase;cancel();s.phase='paused';}}
  function resume(){if(s.phase==='paused')s.phase=prior;}
  reset();return {get state(){return s;},config,start,setAim,begin,release,cancel,pause,resume,tick};
}
