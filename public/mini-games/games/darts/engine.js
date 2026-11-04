export const DURATION=60,NUMBERS=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
export const RELEASE_MIN=.45,RELEASE_MAX=.72;
export function challengeAt(time){return ['PRECISION','CROSSWIND','MOVING BOARD'][Math.floor(time/10)%3];}
export function boardAngle(time){return challengeAt(time)==='MOVING BOARD'?.55*Math.sin((time%10)*Math.PI/10):0;}
export function boardPose(time){if(challengeAt(time)!=='MOVING BOARD')return {x:0,y:0,scale:1};const t=time%10,envelope=Math.sin(t*Math.PI/10)**2;return {x:.25*envelope*Math.sin(t*1.2),y:(time<30?.055:.16)*envelope*Math.sin(t*2.4),scale:1-.16*envelope};}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function scoreDart(x,y){const r=Math.hypot(x,y);if(!Number.isFinite(r)||r>1)return {base:0,number:0,multiplier:0,label:'MISS'};if(r<=6.35/170)return {base:50,number:0,multiplier:1,label:'BULLSEYE'};if(r<=15.9/170)return {base:25,number:0,multiplier:1,label:'OUTER BULL'};const a=((Math.atan2(x,-y)+Math.PI/20)%(Math.PI*2)+Math.PI*2)%(Math.PI*2),number=NUMBERS[Math.floor(a/(Math.PI/10))%20],multiplier=r>=162/170?2:r>=99/170&&r<=107/170?3:1;return {base:number*multiplier,number,multiplier,label:(multiplier===3?'TRIPLE ':multiplier===2?'DOUBLE ':'SINGLE ')+number};}
export function createDarts(onEvent=()=>{},random=Math.random){
  let s;
  function reset(){s={phase:'intro',countdown:3,time:0,aim:{x:.22,y:.28},holding:false,hold:0,cooldown:0,score:0,throws:0,hits:0,bulls:0,triples:0,bonusHits:0,perfectReleases:0,target:20,requiredRing:1,last:null,shots:[],result:null};}
  function start(){reset();s.phase='countdown';s.target=NUMBERS[Math.min(19,Math.floor(random()*20))];}
  function setAim(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;const r=Math.hypot(x,y),scale=r>1.18?1.18/r:1;s.aim={x:x*scale,y:y*scale};}
  function crosshair(){const t=s.time;
    const fatigue=s.holding?Math.max(0,s.hold-RELEASE_MAX):0;
    const amplitude=s.holding?.025+.105*Math.max(0,1-s.hold/RELEASE_MIN)+Math.min(.285,fatigue*.45):.13,pace=1+Math.floor(t/30)*.25;
    const wind=challengeAt(t)==='CROSSWIND'?.16*Math.sin(t*2.1)*Math.min(1,(t%10)/.8,(10-t%10)/.8):0;
    return {x:s.aim.x+Math.sin(t*6.7*pace+.8)*amplitude+wind,y:s.aim.y+Math.sin(t*5.4*pace+2)*amplitude*.85};}
  function begin(){if(s.phase!=='playing'||s.cooldown>0||s.holding)return false;s.holding=true;s.hold=0;return true;}
  function cancel(){s.holding=false;s.hold=0;}
  function release(){if(!s.holding)return false;if(s.phase!=='playing'||s.cooldown>0){cancel();return false;}
    const point=crosshair(),angle=boardAngle(s.time),cos=Math.cos(angle),sin=Math.sin(angle),pose=boardPose(s.time);
    const px=(point.x-pose.x)/pose.scale,py=(point.y-pose.y)/pose.scale;
    const bx=px*cos+py*sin,by=-px*sin+py*cos,hit=scoreDart(bx,by);
    const timed=s.hold>=RELEASE_MIN&&s.hold<=RELEASE_MAX,releaseBonus=timed&&hit.base>0?20:0;
    const bonus=hit.number===s.target&&(s.requiredRing===1||hit.multiplier===s.requiredRing)?[0,40,65,90][s.requiredRing]:0;
    cancel();s.throws++;if(hit.base>0)s.hits++;if(hit.base===50)s.bulls++;if(hit.multiplier===3)s.triples++;if(releaseBonus)s.perfectReleases++;
    if(bonus){s.bonusHits++;const old=NUMBERS.indexOf(s.target);s.target=NUMBERS[(old+1+Math.min(18,Math.floor(random()*19)))%20];s.requiredRing=1+s.bonusHits%3;}
    s.score+=hit.base+bonus+releaseBonus;s.last={...point,bx,by,...hit,bonus,releaseBonus,timed,points:hit.base+bonus+releaseBonus,at:s.time};s.shots.push(s.last);if(s.shots.length>6)s.shots.shift();s.cooldown=.68;onEvent({type:'throw',shot:s.last});return true;}
  function finish(){if(s.phase==='finished')return;cancel();s.phase='finished';s.time=DURATION;s.result={gameId:'darts',rulesVersion:2,score:s.score,throws:s.throws,hits:s.hits,accuracy:s.throws?Math.round(s.hits/s.throws*100):0,bullseyes:s.bulls,triples:s.triples,bonusHits:s.bonusHits,perfectReleases:s.perfectReleases,time:DURATION};onEvent({type:'finish',result:s.result});}
  function tick(dt){if(!Number.isFinite(dt)||dt<=0||['paused','intro','finished'].includes(s.phase))return;if(s.phase==='countdown'){const used=Math.min(dt,s.countdown);s.countdown-=used;dt-=used;if(s.countdown>0)return;s.phase='playing';onEvent({type:'go'});}const used=Math.min(dt,DURATION-s.time);s.time+=used;s.cooldown=Math.max(0,s.cooldown-used);if(s.holding)s.hold=clamp(s.hold+used,0,2);if(s.time>=DURATION-1e-8)finish();}
  function pause(){if(['playing','countdown'].includes(s.phase)){s.previousPhase=s.phase;cancel();s.phase='paused';}}
  function resume(){if(s.phase==='paused')s.phase=s.previousPhase;}
  reset();return {get state(){return s;},start,setAim,crosshair,begin,release,cancel,tick,pause,resume};
}
