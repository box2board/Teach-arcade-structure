export const SEGMENT_LENGTH=18000;
export const JUICE_DRAIN=2.5;
export const roadCurve=s=>Math.sin(s/850)*.7+Math.sin(s/1700)*.4;
const roadCurvature=s=>-Math.sin(s/850)*.7/(850*850)-Math.sin(s/1700)*.4/(1700*1700);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Race {
 constructor({questionCount=8,laps=1}={}){
  if(![8,12,16].includes(questionCount)||!Number.isInteger(laps)||laps<1||laps>5)throw new Error('Invalid race settings');
  this.questionCount=questionCount;this.laps=laps;this.segmentsPerLap=questionCount/4;this.totalSegments=this.segmentsPerLap*laps;this.lapLength=this.segmentsPerLap*SEGMENT_LENGTH;this.totalDistance=this.lapLength*laps;this.countdown=3;this.countdownKind='start';this.greenTime=0;this.recoveryTime=0;this.falls=0;this.fallSide=1;this.returnSpeed=0;
  this.distance=0;this.previousDistance=0;this.x=0;this.speed=0;this.juice=75;this.time=0;this.boost=0;this.shield=0;this.cooldown=0;this.state='race';this.rivals=[{distance:45,x:-.5,speed:345,color:'#ff667b'},{distance:95,x:.5,speed:365,color:'#ffcf62'},{distance:145,x:0,speed:385,color:'#a99cff'}];this.pickups=new Set();this.hits=new Set();}
 advanceRivals(dt){this.rivals.forEach((r,i)=>{r.distance+=r.speed*dt*(1+.08*Math.sin(this.time+i));r.x=Math.sin(this.time*.22+i*2)*.6})}
 update(dt,input={}){
 dt=clamp(dt,0,.05);
 if(this.state==='countdown'){this.countdown=Math.max(0,this.countdown-dt);if(this.countdown<1e-8){this.countdown=0;this.greenTime=1;this.state='race'}return}
 if(this.state==='recovering'){
  this.time+=dt;this.advanceRivals(dt);this.recoveryTime=Math.max(0,this.recoveryTime-dt);
  if(this.recoveryTime<1e-8){this.x=0;this.speed=this.returnSpeed;this.cooldown=2;this.state='race'}return;
 }
 if(this.state!=='race')return;
 this.time+=dt;this.greenTime=Math.max(0,this.greenTime-dt);this.boost=Math.max(0,this.boost-dt);this.shield=Math.max(0,this.shield-dt);this.cooldown=Math.max(0,this.cooldown-dt);
 const powered=this.juice>0,top=this.boost>0?620:460;
 // Fast arcade acceleration, deliberate braking, and momentum when gas is released.
 const target=input.brake?0:input.gas?(powered?top:280):100;
 const accelerating=target>this.speed;
 const rate=input.brake?1000:input.gas&&powered?(accelerating?580:60):accelerating?65:powered?28:22;
 this.speed+=clamp(target-this.speed,-rate*dt,rate*dt);
 if(input.gas&&!input.brake&&powered)this.juice=Math.max(0,this.juice-dt*JUICE_DRAIN);
 const steer=(input.right?1:0)-(input.left?1:0);
 const drift=-roadCurvature(this.distance)*this.speed*this.speed*1.6;
 this.x=clamp(this.x+(steer*(.6+1.8*Math.min(1,this.speed/260))+drift)*dt,-1.4,1.4);
 this.advanceRivals(dt);
 if(Math.abs(this.x)>1.16){this.falls++;this.fallSide=Math.sign(this.x);this.returnSpeed=Math.max(140,this.speed*.75);this.recoveryTime=1.4;this.state='recovering';return}
 this.previousDistance=this.distance;this.distance+=this.speed*dt;
 const gate=(this.stopsCompleted+1)*SEGMENT_LENGTH;
 if(this.stopsCompleted<this.totalSegments-1&&this.distance>=gate){this.distance=gate;this.state='pit';return}
 if(this.distance>=this.totalDistance){this.distance=this.totalDistance;this.state='finished';return}
 }
 get lap(){return Math.min(this.laps,Math.floor(this.distance/this.lapLength)+1)}
 get nextGate(){return Math.min(this.totalDistance,(this.stopsCompleted+1)*SEGMENT_LENGTH)}
 get place(){return 1+this.rivals.filter(r=>r.distance>this.distance).length}
 hit(id){if(this.cooldown||this.hits.has(id))return;this.hits.add(id);this.cooldown=1;if(this.shield<=0)this.speed*=.4}
 collect(id,kind){if(this.pickups.has(id))return;this.pickups.add(id);if(kind==='boost')this.boost=3;else this.shield=8}
 stopsCompleted=0;
}

// The review plan is independent of car physics and the curriculum topic.
export function shuffleQuestions(items,random=Math.random){
 const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy;
}
export class ReviewSession {
 constructor(bank,{questionCount=8,laps=1}={},random=Math.random){
  if(![8,12,16].includes(questionCount)||bank.questions.length<questionCount||!Number.isInteger(laps)||laps<1||laps>5)throw new Error('Not enough questions or invalid settings');
  this.selected=shuffleQuestions(bank.questions,random).slice(0,questionCount);
  this.questionCount=questionCount;this.laps=laps;this.deck=[];
  let previous=[];
  for(let lap=0;lap<laps;lap++){
   let order=shuffleQuestions(this.selected,random);
   if(order.every((q,i)=>q.id===previous[i]?.id))order.push(order.shift());
   this.deck.push(...order);previous=order;
  }
  this.index=0;this.records=[];this.retries=[];
 }
 get question(){return this.deck[this.index]}
 get lap(){return Math.min(this.laps,Math.floor(this.index/this.questionCount)+1)}
 answer(selected){const q=this.question;if(!q)return false;const correct=selected===q.answer;this.records.push({...q,lap:this.lap,selected,correct});this.index++;return correct}
 get correct(){return this.records.filter(r=>r.correct).length}
 get firstCorrect(){return this.records.filter(r=>r.lap===1&&r.correct).length}
 get missed(){return [...new Map(this.records.filter(r=>!r.correct).map(r=>[r.id,r])).values()]}
 get complete(){return this.index===this.deck.length}
}
