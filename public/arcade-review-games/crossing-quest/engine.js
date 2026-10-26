import {validateQuestionBank as validateBank} from '../../review-lab/question-banks.js';
import { CELL, WIDTH, REQUIRED_ACORNS, HOME_ROW, STUMP_ROW, ROUTES, DIFFICULTIES } from './config.js';

// Collision and drawing share these wheel/ball/frame positions. Rider heads,
// the squirrel's decorative tail, and shadows do not enlarge the hit area.
export function roadShapes(lane,o){
  const y=lane.row*CELL,x=o.x+o.width/2;
  if(lane.kind==='ball')return {circles:[{x:o.x+25,y:y+33,r:21},{x:o.x+o.width-25,y:y+33,r:21}],segments:[]};
  const points=[{x:o.x+17,y:y+42},{x,y:y+25},{x:o.x+o.width-17,y:y+42},{x:x+12,y:y+18}];
  return {circles:[{...points[0],r:14},{...points[2],r:14}],segments:points.slice(1).map((p,i)=>({a:points[i],b:p,r:2.5}))};
}
export function roadHit(player,lane,o){
  const body={x:player.x-2,y:player.row*CELL+36,r:11},shapes=roadShapes(lane,o);
  if(shapes.circles.some(c=>Math.hypot(body.x-c.x,body.y-c.y)<body.r+c.r))return true;
  return shapes.segments.some(({a,b,r})=>{
    const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((body.x-a.x)*dx+(body.y-a.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(body.x-a.x-t*dx,body.y-a.y-t*dy)<body.r+r;
  });
}

export {validateQuestionBank as validateBank} from '../../review-lab/question-banks.js';

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export class CrossingWorld {
  constructor(bank, difficulty='relaxed', random=Math.random) {
    validateBank(bank);
    this.difficulty = DIFFICULTIES[difficulty] || DIFFICULTIES.relaxed;
    this.deck = shuffle(bank.questions, random).slice(0, ROUTES.length*4).map(q => {
      const answers = shuffle(q.choices.map((text,index)=>({text,index})),random);
      return {...q,choices:answers.map(a=>a.text),answer:answers.findIndex(a=>a.index===q.answer)};
    });
    this.energy=1;this.sprinting=false;this.score=0;this.combo=0;this.comboTime=0;this.magnet=0;this.pickups=[];this.returning=false;this.acorns=0;this.stashed=0;this.collected=new Set();
    this.state='ready';this.stage=0;this.lives=this.difficulty.lives;this.shield=1;this.charges=0;
    this.time=0;this.slowTime=0;this.invulnerable=1.5;this.hop=0;this.checkpoint=HOME_ROW;
    this.player={x:WIDTH/2-CELL/2,row:HOME_ROW};this.from={...this.player};this.records=[];this.questionIndex=0;
    this.checkpointAnswers=0;this.stop=null;this.notice='';this.feedback=null;
  }
  get route(){return ROUTES[this.stage];}
  get question(){return this.deck[this.questionIndex];}
  get correct(){return this.records.filter(r=>r.correct).length;}
  start(){if(this.state==='ready')this.state='playing';}
  objects(lane){
    const count=Math.ceil(WIDTH/lane.gap)+1,period=count*lane.gap;
    return Array.from({length:count},(_,i)=>({x:((i*lane.gap+this.time*lane.speed*this.difficulty.speed*this.route.speed+lane.offset)%period+period)%period-lane.width,width:lane.width,index:i}));
  }
  move(direction){
    if(this.state!=='playing'||this.hop>0)return false;
    const delta={up:[0,-1],down:[0,1],left:[-CELL,0],right:[CELL,0]}[direction];if(!delta)return false;
    const x=this.player.x+delta[0],row=this.player.row+delta[1];
    // Both directions remain available for pickups and the trip home.
    if(x<CELL*.35||x>WIDTH-CELL*.35||row<0||row>HOME_ROW)return false;
    this.from={...this.player};this.player={x,row};this.hop=this.sprinting&&this.energy>.08?.075:.11;
    if(this.sprinting&&this.energy>.08)this.energy=Math.max(0,this.energy-.08);
    return true;
  }
  activateSlow(){
    if(this.state!=='playing'||this.charges===0||this.slowTime>0)return false;
    this.charges--;this.slowTime=6;this.notice='Slow time · 6 seconds';return true;
  }
  pause(){if(this.state==='playing'){this.state='paused';return true;}return false;}
  resume(){if(this.state==='paused')this.state='playing';}
  update(dt){
    if(this.state!=='playing')return;
    dt=Math.max(0,Math.min(dt,.05));
    const factor=this.slowTime>0?.38:1;
    this.time+=dt*factor;this.slowTime=Math.max(0,this.slowTime-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);
    this.hop=Math.max(0,this.hop-dt);
    this.hitFlash=Math.max(0,(this.hitFlash||0)-dt);
    this.energy=Math.min(1,this.energy+dt*.14);
    this.magnet=Math.max(0,this.magnet-dt);this.comboTime=Math.max(0,this.comboTime-dt);
    if(!this.comboTime)this.combo=0;
    this.pickups=this.pickups.filter(p=>(p.life-=dt)>0);
    if(this.hop>0)return;
    const lane=this.route.lanes.find(l=>l.row===this.player.row);
    if(lane?.type==='road'&&this.invulnerable<=0){
      if(this.objects(lane).some(o=>roadHit(this.player,lane,o))){this.hit('Park path bump');return;}
    }
    if(lane?.type==='sprinkler'&&this.invulnerable<=0){
      if(this.sprinklers(lane).some(o=>o.active&&Math.abs(this.player.x-o.x)<o.radius+14)){this.hit('Sprinkler splash');return;}
    }
    for(const nut of this.nuts())if(!nut.collected&&Math.hypot(nut.x-this.player.x,(nut.row-this.player.row)*CELL)<(this.magnet>0?105:27)){
      this.collected.add(nut.id);this.acorns+=nut.golden?3:1;this.combo++;this.comboTime=4;
      const points=(nut.golden?150:25)*Math.min(4,Math.ceil(this.combo/3));this.score+=points;
      this.energy=Math.min(1,this.energy+.18);this.pickups.push({...nut,points,life:1});
      if(nut.golden){this.magnet=7;this.charges=Math.min(2,this.charges+1);this.notice='Golden acorn! 7s magnet + slow-time charge';}
      else this.notice=`+${points} · ${this.combo} acorn streak · ${this.acorns} carried`;
    }
    if(!this.returning&&this.player.row===STUMP_ROW&&this.checkpoint===HOME_ROW)this.openCheckpoint('island');
    else if(!this.returning&&this.player.row===0){
      if(this.acorns<REQUIRED_ACORNS){if(!this.needNuts){this.needNuts=true;this.state='goal-help';}}
      else{this.needNuts=false;this.openCheckpoint('finish');}
    }else this.needNuts=false;
    if(this.returning&&this.player.row===HOME_ROW){this.tripStashed=this.acorns;this.stashed+=this.acorns;this.acorns=0;this.state=this.stage===ROUTES.length-1?'won':'transition';}
  }
  continueHunt(){if(this.state==='goal-help')this.state='playing';}
  beginReturn(){if(this.state==='return-ready')this.state='playing';}
  nuts(){return this.route.nuts.map((n,i)=>({...n,id:i,collected:this.collected.has(i)}));}
  sprinklers(lane){
    return lane.heads.map((x,i)=>{const cycle=(this.time*this.route.speed*this.difficulty.speed+lane.row*.9+i*1.6+(lane.phase||0))%7;return {x,radius:56,active:cycle>=2.5&&cycle<4.8,warning:cycle>=1.2&&cycle<2.5};});
  }
  hit(cause){
    this.hitFlash=.35;
    this.combo=0;this.comboTime=0;
    if(this.shield){this.shield=0;this.notice=`${cause} · your shield saved a heart`;}else{this.lives--;this.notice=`${cause} · back to the checkpoint`;}
    this.player={x:WIDTH/2-CELL/2,row:this.checkpoint};this.from={...this.player};this.hop=0;this.invulnerable=1.5;
    if(this.lives<=0)this.state='lost';
  }
  openCheckpoint(stop){this.stop=stop;this.checkpointAnswers=0;this.state='question';if(stop==='island')this.checkpoint=STUMP_ROW;}
  answer(index){
    if(this.state!=='question'||!Number.isInteger(index)||index<0||index>3)return false;
    const q=this.question,correct=index===q.answer;
    this.records.push({...q,selected:index,correct,stage:this.stage,stop:this.stop});
    let reward='';
    if(correct){if(!this.shield){this.shield=1;reward='Shield earned · protects one heart';}else if(this.charges<2){this.charges++;reward='Slow-time charge earned · press Space during play';}else if(this.lives<6){this.lives++;reward='Bonus heart earned';}else{reward='All boosts stocked · nice work';}}
    this.feedback={correct,reward};this.state='feedback';return true;
  }
  continueAnswer(){
    if(this.state!=='feedback')return;
    this.questionIndex++;this.checkpointAnswers++;
    if(this.checkpointAnswers<2){this.state='question';return;}
    if(this.stop==='finish'){this.returning=true;this.checkpoint=0;this.state='return-ready';this.invulnerable=1.5;}
    else{this.state='playing';this.invulnerable=1.5;this.notice='Stump saved · gather acorns and reach the old oak';}
  }
  nextStage(){
    if(this.state!=='transition')return;
    this.combo=0;this.comboTime=0;this.magnet=0;this.energy=1;this.sprinting=false;this.pickups=[];
    this.stage++;this.returning=false;this.collected=new Set();this.checkpoint=HOME_ROW;this.time=0;this.slowTime=0;this.invulnerable=1.5;this.hop=0;
    this.player={x:WIDTH/2-CELL/2,row:HOME_ROW};this.from={...this.player};this.state='playing';this.notice=`Crossing ${this.stage+1} · ${this.route.name}`;
  }
}
