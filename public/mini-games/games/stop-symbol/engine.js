export const DURATION=30, SYMBOL_COUNT=8;
export function judge(phase,target){const delta=((phase-target+4)%8+8)%8-4,distance=Math.abs(delta);return {delta,distance,grade:distance<=.10?'PERFECT':distance<=.24?'GREAT':distance<=.42?'HIT':'MISS',base:distance<=.10?250:distance<=.24?150:distance<=.42?100:0};}
export function createSymbol(onEvent=()=>{},random=Math.random){
  let s,prior='playing';
  const speed=()=>2.6+Math.min(3.6,s.hits*.45);
  function reset(){s={phase:'intro',countdown:3,time:0,position:0,target:0,speed:2.6,age:0,feedback:0,score:0,attempts:0,hits:0,perfects:0,streak:0,bestStreak:0,last:null,result:null};}
  function next(){const previous=s.target;s.target=(previous+1+Math.floor(random()*7))%8;s.position=(s.target+2+random()*4)%8;s.age=0;s.speed=speed();s.phase='playing';onEvent({type:'target',target:s.target});}
  function start(){reset();next();s.phase='countdown';}
  function finish(){if(s.phase==='finished')return;s.phase='finished';s.time=DURATION;s.result={gameId:'stop-symbol',rulesVersion:2,score:s.score,attempts:s.attempts,hits:s.hits,perfects:s.perfects,bestStreak:s.bestStreak,accuracy:s.attempts?Math.round(s.hits/s.attempts*100):0,time:DURATION};onEvent({type:'finish',result:s.result});}
  function stop(){if(s.phase!=='playing'||s.age<.25)return false;const hit=judge(s.position,s.target);s.attempts++;if(hit.base){s.hits++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);if(hit.grade==='PERFECT')s.perfects++;}else s.streak=0;const bonus=hit.base?Math.min(100,(s.streak-1)*20):0;s.score+=hit.base+bonus;s.last={...hit,points:hit.base+bonus,bonus};s.feedback=.85;s.phase='feedback';onEvent({type:'stop',...s.last});return true;}
  function tick(dt){if(!Number.isFinite(dt)||dt<=0||['paused','intro','finished'].includes(s.phase))return;if(s.phase==='countdown'){const used=Math.min(dt,s.countdown);s.countdown-=used;dt-=used;if(s.countdown>0)return;s.phase='playing';onEvent({type:'go'});}let left=Math.min(dt,DURATION-s.time);while(left>1e-9){if(s.phase==='feedback'){const used=Math.min(left,s.feedback);s.time+=used;s.feedback-=used;left-=used;if(s.feedback<=1e-9)next();}else{ s.position=(s.position+s.speed*left)%8;s.age+=left;s.time+=left;left=0;}}if(s.time>=DURATION-1e-8)finish();}
  function pause(){if(['playing','feedback','countdown'].includes(s.phase)){prior=s.phase;s.phase='paused';}}
  function resume(){if(s.phase==='paused')s.phase=prior;}
  reset();return {get state(){return s;},start,stop,tick,pause,resume};
}
