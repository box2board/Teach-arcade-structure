import { CELL, WIDTH, ROUTES, DIFFICULTIES } from './config.js';

export function validateBank(bank, minimum = ROUTES.length * 4) {
  if (!bank || !Array.isArray(bank.questions) || bank.questions.length < minimum) throw new Error(`Question packs need at least ${minimum} questions.`);
  const ids = new Set();
  for (const q of bank.questions) {
    if (!q.id || ids.has(q.id) || typeof q.question !== 'string' || !q.question.trim() || !Array.isArray(q.choices) || q.choices.length !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim()) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 || typeof q.explanation !== 'string' || !q.explanation.trim()) throw new Error('Each question needs a unique ID, a prompt, four answers, a correct answer index, and an explanation.');
    ids.add(q.id);
  }
}
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
    this.returning=false;this.acorns=0;this.stashed=0;this.collected=new Set();
    this.state='ready';this.stage=0;this.lives=this.difficulty.lives;this.shield=1;this.charges=0;
    this.time=0;this.slowTime=0;this.invulnerable=1.5;this.hop=0;this.checkpoint=8;
    this.player={x:WIDTH/2-CELL/2,row:8};this.from={...this.player};this.records=[];this.questionIndex=0;
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
    if(x<CELL*.35||x>WIDTH-CELL*.35||row<0||row>8)return false;
    this.from={...this.player};this.player={x,row};this.hop=.11;
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
    if(this.hop>0)return;
    const lane=this.route.lanes.find(l=>l.row===this.player.row);
    if(lane?.type==='road'&&this.invulnerable<=0){
      if(this.objects(lane).some(o=>lane.row===6?[o.x+25,o.x+o.width-25].some(x=>Math.abs(this.player.x-x)<34):this.player.x+17>o.x+6&&this.player.x-17<o.x+o.width-6)){this.hit('Park path bump');return;}
    }
    if(lane?.type==='sprinkler'&&this.invulnerable<=0){
      if(this.sprinklers(lane).some(o=>o.active&&Math.abs(this.player.x-o.x)<o.radius+14)){this.hit('Sprinkler splash');return;}
    }
    for(const nut of this.nuts())if(!nut.collected&&nut.row===this.player.row&&Math.abs(nut.x-this.player.x)<27){
      this.collected.add(nut.id);this.acorns++;this.notice='Acorn collected · '+this.acorns+' in your pouch';
    }
    if(!this.returning&&this.player.row===4&&this.checkpoint===8)this.openCheckpoint('island');
    else if(!this.returning&&this.player.row===0){
      if(this.acorns<3){if(!this.needNuts){this.notice='Collect at least 3 acorns before visiting the oak';this.needNuts=true;}}
      else{this.needNuts=false;this.openCheckpoint('finish');}
    }else this.needNuts=false;
    if(this.returning&&this.player.row===8){this.stashed+=this.acorns;this.acorns=0;this.state=this.stage===ROUTES.length-1?'won':'transition';}
  }
  nuts(){return [{row:7,x:160},{row:6,x:608},{row:5,x:288},{row:4,x:224},{row:4,x:672},{row:3,x:416},{row:2,x:736},{row:1,x:160},{row:0,x:416}].map((n,i)=>({...n,id:i,collected:this.collected.has(i)}));}
  sprinklers(lane){
    return [160,416,736].map((x,i)=>{const cycle=(this.time*this.route.speed*this.difficulty.speed+lane.row*.9+i*1.6)%7;return {x,radius:56,active:cycle>=2.5&&cycle<4.8,warning:cycle>=1.2&&cycle<2.5};});
  }
  hit(cause){
    if(this.shield){this.shield=0;this.notice=`${cause} · your shield saved a heart`;}else{this.lives--;this.notice=`${cause} · back to the checkpoint`;}
    this.player={x:WIDTH/2-CELL/2,row:this.checkpoint};this.from={...this.player};this.hop=0;this.invulnerable=1.5;
    if(this.lives<=0)this.state='lost';
  }
  openCheckpoint(stop){this.stop=stop;this.checkpointAnswers=0;this.state='question';if(stop==='island')this.checkpoint=4;}
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
    if(this.stop==='finish'){this.returning=true;this.checkpoint=0;this.state='playing';this.invulnerable=1.5;this.notice='Pouch ready · return DOWN to your home tree to stash the acorns';}
    else{this.state='playing';this.invulnerable=1.5;this.notice='Stump saved · gather acorns and reach the old oak';}
  }
  nextStage(){
    if(this.state!=='transition')return;
    this.stage++;this.returning=false;this.collected=new Set();this.checkpoint=8;this.time=0;this.slowTime=0;this.invulnerable=1.5;this.hop=0;
    this.player={x:WIDTH/2-CELL/2,row:8};this.from={...this.player};this.state='playing';this.notice=`Crossing ${this.stage+1} · ${this.route.name}`;
  }
}
