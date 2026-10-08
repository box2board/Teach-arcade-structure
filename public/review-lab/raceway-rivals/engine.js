export const LENGTH=12000;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Race {
 constructor(){this.distance=0;this.previousDistance=0;this.x=0;this.speed=0;this.juice=75;this.time=0;this.boost=0;this.shield=0;this.cooldown=0;this.state='race';this.rivals=[{distance:45,x:-.5,speed:345,color:'#ff667b'},{distance:95,x:.5,speed:365,color:'#ffcf62'},{distance:145,x:0,speed:385,color:'#a99cff'}];this.pickups=new Set();this.hits=new Set();}
 update(dt,input={}){if(this.state!=='race')return;dt=clamp(dt,0,.05);this.time+=dt;this.boost=Math.max(0,this.boost-dt);this.shield=Math.max(0,this.shield-dt);this.cooldown=Math.max(0,this.cooldown-dt);
 const powered=this.juice>0,top=this.boost>0?620:460;
 // Fast arcade acceleration, deliberate braking, and momentum when gas is released.
 const target=input.brake?0:input.gas&&powered?top:85;
 const rate=input.brake?1000:input.gas&&powered?580:190;
 this.speed+=clamp(target-this.speed,-rate*dt,rate*dt);
 if(input.gas&&powered)this.juice=Math.max(0,this.juice-dt*(this.boost>0?4:3));
 const steer=(input.right?1:0)-(input.left?1:0);
 this.x=clamp(this.x+steer*dt*(.6+1.8*Math.min(1,this.speed/260)),-1.25,1.25);
 if(Math.abs(this.x)>1)this.speed=Math.max(0,this.speed-750*dt);
 this.previousDistance=this.distance;this.distance+=this.speed*dt;this.rivals.forEach((r,i)=>{r.distance+=r.speed*dt*(1+.08*Math.sin(this.time+i));r.x=Math.sin(this.time*.22+i*2)*.6});
 const gate=(this.stopsCompleted+1)*(LENGTH*2/5);
 if(this.stopsCompleted<4&&this.distance>=gate){this.distance=gate;this.state='pit';return}
 if(this.distance>=LENGTH*2){this.distance=LENGTH*2;this.state='finished';return}
 }
 get place(){return 1+this.rivals.filter(r=>r.distance>this.distance).length}
 hit(id){if(this.cooldown||this.hits.has(id))return;this.hits.add(id);this.cooldown=1;if(this.shield<=0)this.speed*=.4}
 collect(id,kind){if(this.pickups.has(id))return;this.pickups.add(id);if(kind==='boost')this.boost=3;else this.shield=8}
 stopsCompleted=0;
}

// The review plan is independent of car physics and the curriculum topic.
export class ReviewSession {
 constructor(bank,random=Math.random){
  const shuffled=[...bank.questions];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
  this.deck=shuffled.slice(0,Math.min(20,shuffled.length));
  this.index=0;this.records=[];this.retries=[];
 }
 get question(){return this.deck[this.index]}
 get batchSize(){return Math.ceil(this.deck.length/5)}
 answer(selected){const q=this.question;if(!q)return false;const correct=selected===q.answer;this.records.push({...q,selected,correct});this.index++;return correct}
 get correct(){return this.records.filter(r=>r.correct).length}
 get missed(){return this.records.filter(r=>!r.correct)}
 get complete(){return this.index===this.deck.length}
}
