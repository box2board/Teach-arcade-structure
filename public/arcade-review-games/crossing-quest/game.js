import {enhanceTopicPicker} from '../../review-lab/topic-picker.js';
import bank from './questions.js';
import {createParkArt} from './park-art.js';
import { QUESTION_SETS, loadQuestionSet } from './question-sets.js';
import { CrossingWorld, roadShapes } from './engine.js';
import { CELL, WIDTH, REQUIRED_ACORNS, HEIGHT, VIEW_WIDTH, VIEW_HEIGHT, HOME_ROW, STUMP_ROW, ROUTES, DIFFICULTIES } from './config.js';

const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const panel=$('panel'),content=$('panel-content');
const art=createParkArt(ctx);
canvas.width=VIEW_WIDTH;canvas.height=VIEW_HEIGHT;
canvas.style.aspectRatio=`${VIEW_WIDTH} / ${VIEW_HEIGHT}`;
let camera={x:512,y:HEIGHT-VIEW_HEIGHT};
let world,activeBank=bank,mode='relaxed',selectedSet=bank.id,lastState='',lastFrame=0,held=null,repeatAt=0,noticeUntil=0,noticeText='';
const requestedSet=new URLSearchParams(location.search).get('set');
const presetSet=QUESTION_SETS.find(set=>set.id===requestedSet);
if(presetSet)selectedSet=presetSet.id;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function show(html){held=null;if(world)world.sprinting=false;content.innerHTML=html;if(!panel.open)panel.showModal();}
function close(){if(panel.open)panel.close();canvas.focus({preventScroll:true});held=null;}
function button(id,label,primary=true){return `<button id="${id}" class="${primary?'primary':'secondary'}">${label}</button>`;}
function newRun(){camera={x:(WIDTH-VIEW_WIDTH)/2,y:HEIGHT-VIEW_HEIGHT};noticeText='';$('announcement').classList.remove('visible');world=new CrossingWorld(activeBank,mode);lastState='';sync();draw();}
function ready(){
  show(`<div class="intro-mark" aria-hidden="true">🐿️</div><span class="pill">Acorn Dash${presetSet?'':' · step 1 of 2'}</span><h2 id="panel-title">Small paws.<br>Big acorn adventure.</h2><ul class="intro-rules"><li><b>1</b>Explore a scrolling park. Follow acorn trails through moving hazards.</li><li><b>2</b>Chain pickups for points. Golden acorns give a magnet and slow time.</li><li><b>3</b>Review at the stump and oak, then return home. Shift / Sprint to move faster.</li></ul><label for="difficulty">Park difficulty</label><select id="difficulty">${Object.entries(DIFFICULTIES).map(([value,d])=>`<option value="${value}" ${value===mode?'selected':''}>${d.label}${value==='relaxed'?' · slower hazards':value==='challenge'?' · faster hazards, fewer hearts':''}</option>`).join('')}</select><p>You start with a shield. Questions pause everything.</p>${presetSet?`<p><strong>Review topic:</strong> ${escapeHTML(presetSet.title)} · <a href="/review-lab/#topics">Change topic</a></p>`:''}<p id="pack-error" class="fatal" role="alert"></p>${button('choose-set',presetSet?'Start acorn run':'Choose question set')}<p class="access-note">Arrow keys or WASD · touch controls on phones and tablets</p>`);
  $('choose-set').onclick=()=>{mode=$('difficulty').value;if(presetSet)startSelectedSet(presetSet.id,$('choose-set'));else chooseSet();};
}
function chooseSet(){
  show(`<span class="pill">Acorn Dash · step 2 of 2</span><h2 id="panel-title">Choose your review</h2><p>${escapeHTML(DIFFICULTIES[mode].label)} park difficulty · 12 questions per run</p><label for="question-set">Question set</label><select id="question-set">${QUESTION_SETS.map(set=>`<option value="${escapeHTML(set.id)}" ${set.id===selectedSet?'selected':''}>${escapeHTML(set.title)} · ${escapeHTML(set.subject)}</option>`).join('')}</select><p id="set-description"></p><p class="access-note">Choose a topic for this run. Filter by subject or category to find a topic.</p><p id="pack-error" class="fatal" role="alert"></p>${button('start','Start acorn run')}${button('back','Back to difficulty',false)}`);
  enhanceTopicPicker($('question-set'),QUESTION_SETS);
  const describe=()=>{const set=QUESTION_SETS.find(set=>set.id===$('question-set').value);$('set-description').textContent=set?.description||'';};
  $('question-set').onchange=describe;describe();
  $('back').onclick=()=>{selectedSet=$('question-set').value;ready();};
  $('start').onclick=()=>startSelectedSet($('question-set').value,$('start'),$('back'),$('question-set'));
}
async function startSelectedSet(id,start,back,select){
  const controls=[start,back,select].filter(Boolean);controls.forEach(c=>c.disabled=true);
  start.textContent='Loading questions…';$('pack-error').textContent='';
  try{
    const loaded=await loadQuestionSet(id);
    const nextWorld=new CrossingWorld(loaded,mode);
    activeBank=loaded;selectedSet=loaded.id;world=nextWorld;world.start();lastState='';close();sync();announce('Collect 8+ acorns · your first shield is ready');
  }catch(error){
    console.error(error);$('pack-error').textContent='This set could not load. Try again or choose another topic.';
    controls.forEach(c=>c.disabled=false);start.textContent='Try loading again';start.focus();
  }
}

function question(){
  const q=world.question;
  show(`<span class="pill">${world.stop==='island'?'Tree stump':'Old oak'} · question ${world.questionIndex+1} / ${world.deck.length}</span><h2 id="panel-title">${escapeHTML(q.question)}</h2><p>The crossing is paused. Take your time.</p><div class="answers">${q.choices.map((choice,i)=>`<button class="answer" data-answer="${i}"><b>${i+1}</b><span>${escapeHTML(choice)}</span></button>`).join('')}</div><p class="access-note">1–4 to answer · arrow keys to choose · Enter to confirm</p>`);
  content.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{world.answer(Number(b.dataset.answer));sync();});
  content.querySelector('[data-answer]').focus();
}
function feedback(){
  const q=world.question,{correct,reward}=world.feedback;
  show(`<span class="pill">Question ${world.questionIndex+1} / ${world.deck.length}</span><h2 id="panel-title" class="${correct?'feedback-correct':'feedback-missed'}">${correct?'That’s right!':'Let’s review this one.'}</h2><p><strong>Correct answer:</strong> ${escapeHTML(q.choices[q.answer])}</p><p>${escapeHTML(q.explanation)}</p>${reward?`<p class="reward">${escapeHTML(reward)}</p>`:'<p>You keep your hearts. Review the correct answer before continuing.</p>'}${button('continue',world.checkpointAnswers===0?'Next question':world.stop==='finish'?'Return home ↓':'Continue acorn hunt')}`);
  $('continue').onclick=()=>{world.continueAnswer();sync();};$('continue').focus();
}
function summary(){
  const bank=activeBank;
  const won=world.state==='won',answered=world.records.length,accuracy=answered?Math.round(world.correct/answered*100):0;
  show(`<span class="pill">${escapeHTML(bank.title)} · run summary</span><h2 id="panel-title">${won?'All three acorn trips complete!':'Your next crossing awaits.'}</h2><p>${won?'Acorns safely stashed. Here’s what you reviewed.':'You ran out of hearts. Try Gentle difficulty or use slow time before a tricky stretch.'}</p><div class="summary-stats"><div><strong>${world.correct} / ${answered}</strong><span>Correct answers</span></div><div><strong>${accuracy}%</strong><span>Review accuracy</span></div></div><p>Trail score: ${world.score} · Acorns stashed: ${world.stashed} · Questions answered: ${answered} / ${world.deck.length} · Crossings finished: ${won?3:world.stage} / 3</p>${answered?`<details><summary>Review your answers (${answered})</summary>${world.records.map(r=>`<div class="review-item"><span class="${r.correct?'feedback-correct':'feedback-missed'}">${r.correct?'Correct':'Review again'}</span><h3>${escapeHTML(r.question)}</h3><p>Your answer: ${escapeHTML(r.choices[r.selected])}</p>${r.correct?'':`<p>Correct answer: ${escapeHTML(r.choices[r.answer])}</p>`}<p>${escapeHTML(r.explanation)}</p></div>`).join('')}</details>`:''}${button('again','Play a new run')}<p class="access-note">This summary stays on this screen. Results are not sent to a teacher.</p>`);
  $('again').onclick=()=>{lastState='';newRun();};$('again').focus();
}
function pauseDialog(){show(`<span class="pill">Take a breather</span><h2 id="panel-title">Crossing paused</h2><p>Park obstacles and sprinklers are stopped.</p>${button('resume','Resume crossing')}${button('new','Start a new run',false)}`);$('resume').onclick=()=>{world.resume();sync();};$('new').onclick=()=>newRun();}
function sync(){
  const setText=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
  setText('stage',`${world.stage+1} / ${ROUTES.length} · ${world.route.name}`);
  setText('acorns',`${world.acorns}${world.returning?' carried':` / ${REQUIRED_ACORNS} needed`} · ${world.stashed} stashed`);
  setText('review-set',`Review set: ${activeBank.title}`);
  setText('route',world.returning?'Return DOWN to your home tree. Extra acorns are optional.':'Gather 8+ acorns. Review at the stump and old oak.');
  setText('mission-step',world.returning?'3 / 3 · BRING THEM HOME':world.acorns>=REQUIRED_ACORNS?'2 / 3 · VISIT THE OLD OAK':'1 / 3 · FILL YOUR POUCH');
  setText('mission-goal',world.returning?'↓ Reach the bottom home area to finish this level.':world.acorns>=REQUIRED_ACORNS?'↑ Reach the top safe area and finish its review.':`Collect ${Math.max(0,REQUIRED_ACORNS-world.acorns)} more acorn${world.acorns===REQUIRED_ACORNS-1?'':'s'}. Follow the acorn trails. Gold acorns are worth three.`);
  $('mission').classList.toggle('returning',world.returning);
  document.body.dataset.scene=world.route.scene;
  document.body.style.setProperty('--park-glow',world.route.skin.glow);
  setText('lives','♥ '.repeat(world.lives).trim());
  const lifeLabel=`${world.lives} hearts remaining`;if($('lives').getAttribute('aria-label')!==lifeLabel)$('lives').setAttribute('aria-label',lifeLabel);
  setText('shield',world.shield?'Ready':'Empty');
  setText('accuracy',`${world.records.length} / ${world.deck.length}`);
  setText('charges',world.slowTime>0?`${Math.ceil(world.slowTime)}s active`:`${world.charges} charge${world.charges===1?'':'s'} · Space`);
  $('slow').disabled=world.state!=='playing'||!world.charges||world.slowTime>0;
  $('pause').disabled=world.state!=='playing';$('restart').disabled=world.state==='ready';
  if(world.notice){announce(world.notice);world.notice='';}
  if(world.state===lastState)return;lastState=world.state;
  if(world.state==='ready')ready();
  else if(world.state==='playing')close();
  else if(world.state==='question')question();
  else if(world.state==='feedback')feedback();
  else if(world.state==='paused')pauseDialog();
  else if(world.state==='goal-help'){
    show(`<span class="pill">Old oak reached · ${world.acorns} / ${REQUIRED_ACORNS} acorns</span><h2 id="panel-title">Your pouch needs ${REQUIRED_ACORNS-world.acorns} more.</h2><p>Go back down to collect the remaining acorns, then return to this top safe area. Follow the trails or explore a golden-acorn detour.</p><p>The park is paused while you read.</p>${button('hunt','Keep collecting ↓')}`);
    $('hunt').onclick=()=>{world.continueHunt();sync();};$('hunt').focus();
  }
  else if(world.state==='return-ready'){
    show(`<span class="pill">Old oak review complete</span><h2 id="panel-title">Now bring the acorns home.</h2><p>You have <strong>${world.acorns} acorns</strong>. Move <strong>DOWN to the bottom home area</strong> to stash them and finish level ${world.stage+1}.</p><p>Extra acorns are optional. No more questions on the trip home.</p>${button('home','Head home ↓')}`);
    $('home').onclick=()=>{world.beginReturn();sync();announce('↓ Return to the bottom home area to finish the level');};$('home').focus();
  }
  else if(world.state==='won'||world.state==='lost')summary();
  else if(world.state==='transition'){
    show(`<span class="pill">Level ${world.stage+1} complete · ${world.tripStashed} acorns stashed</span><h2 id="panel-title">Next stop: ${escapeHTML(ROUTES[world.stage+1].name)}</h2><p>${escapeHTML(ROUTES[world.stage+1].description)}</p><p>${world.stashed} acorns safely stored so far. Your hearts, shield, and slow-time charges carry forward.</p>${button('next',`Start level ${world.stage+2}`)}`);
    $('next').onclick=()=>{world.nextStage();sync();};
  }
}
function announce(text){noticeText=text;noticeUntil=performance.now()+3200;$('announcement').textContent=text;$('announcement').classList.add('visible');}

// Canvas artwork is original and functional: lane bounds match collision geometry.
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function label(text,x,y,color='#e1eed7',size=13){ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(text,x,y);}
// Deterministic scenery keeps the park stable between frames and restarts.
function noise(a,b=0){const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);}
function oval(x,y,rx,ry,color,angle=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);ctx.fill();}
function strokeLine(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function flower(x,y,color,size=1){
  strokeLine(x,y+6*size,x,y-2*size,'#29744b',1.5);
  for(let n=0;n<5;n++){const a=n*Math.PI*2/5;oval(x+Math.cos(a)*3*size,y+Math.sin(a)*3*size,2.5*size,2*size,color,a);}
  circle(x,y,1.8*size,'#ffe8a1');
}
function tree(x,y,scale=1,variant=0){art.tree(x,y,scale,world.route.scene,variant%3===1);}
function parkObstacle(o,y,lane){
  const shapes=roadShapes(lane,o);
  if(lane.kind==='ball'){
    for(const c of shapes.circles){
      oval(c.x+5,c.y+19,c.r*.9,6,'#15304430');
      ctx.save();ctx.translate(c.x,c.y);ctx.rotate(reduced?0:world.time*lane.speed/45);
      const fill=ctx.createRadialGradient(-8,-9,2,0,0,c.r);fill.addColorStop(0,'#ffe5ad');fill.addColorStop(.35,world.route.skin.ball);fill.addColorStop(1,'#b34c41');circle(0,0,c.r,fill);
      ctx.save();ctx.beginPath();ctx.arc(0,0,c.r-1,0,Math.PI*2);ctx.clip();
      ctx.strokeStyle='#fff0c4';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,9,c.r+2,.4,0,Math.PI*2);ctx.stroke();ctx.restore();
      oval(-7,-9,6,3,'#ffffff77',-.5);ctx.restore();
    }return;
  }
  const x=o.x+o.width/2;
  oval(x+5,y+52,o.width*.44,6,'#15304435');
  for(const c of shapes.circles){
    circle(c.x,c.y,c.r,'#263e50');circle(c.x,c.y,c.r-3,'#a3c5c8');circle(c.x,c.y,c.r-5,world.route.skin.path);
    for(let n=0;n<4;n++){const a=n*Math.PI/2+(reduced?0:world.time*lane.speed/15);strokeLine(c.x,c.y,c.x+Math.cos(a)*10,c.y+Math.sin(a)*10,'#eff7de',1);}
    circle(c.x,c.y,3,'#354f59');
  }
  ctx.strokeStyle='#255065';ctx.lineWidth=7;ctx.beginPath();shapes.segments.forEach(({a,b})=>{ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);});ctx.stroke();
  ctx.strokeStyle='#fce38f';ctx.lineWidth=3;ctx.stroke();
  round(x-11,y+9,22,25,7,world.route.skin.shirt);strokeLine(x-2,y+28,x+12,y+42,'#284556',6);
  circle(x+3,y+4,9,'#f4bf88');oval(x+2,y-2,12,6,'#f36d61');strokeLine(x-8,y-1,x+12,y-1,'#ffb795');
  strokeLine(x+9,y+14,x+20,y+22,'#f4bf88',4);
}
function squirrel(x,y){art.actor(x,y,world,reduced);}
function acorn(x,y){
  oval(x+3,y+14,10,4,'#18372f30');
  const shine=ctx.createLinearGradient(x-9,y,x+9,y+8);shine.addColorStop(0,'#ffe2a5');shine.addColorStop(.5,'#dd9a4d');shine.addColorStop(1,'#a96630');
  oval(x,y+3,9,11,shine);round(x-11,y-8,22,9,4,'#70432c');round(x-9,y-7,18,3,2,'#a27142');
  for(let n=0;n<4;n++)strokeLine(x-7+n*4,y-5,x-4+n*4,y-2,'#d3a166',1);
  strokeLine(x,y-9,x+2,y-14,'#765035',3);oval(x-4,y+1,2,5,'#fff3cb88',.2);
}
function sprinkler(o,y){
  oval(o.x+3,y+36,10,5,'#18373c40');circle(o.x,y+32,8,'#3b6d78');circle(o.x,y+30,5,'#a5d8cb');
  if(o.active||o.warning){
    oval(o.x,y+32,o.radius,29,o.active?'#53c6eb36':'#ffd06c22');ctx.strokeStyle=o.active?'#b4f4ff':'#ffd06c';ctx.lineWidth=2;ctx.setLineDash(o.warning?[4,6]:[]);ctx.beginPath();ctx.ellipse(o.x,y+32,o.radius,29,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  if(o.active)for(let i=-2;i<=2;i++){
    ctx.strokeStyle='#d7fbffb0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(o.x,y+30);ctx.quadraticCurveTo(o.x+i*18,y-1,o.x+i*24,y+38);ctx.stroke();
    const t=reduced?.6:(world.time*1.8+i*.19)%1;circle(o.x+i*24*t,y+30-42*t*(1-t)+8*t,2,'#e2fcff');
  }
  if(o.warning)label('!',o.x,y+17,'#fff0aa',17);
}
function parkScenery(row,lawn=false){
  const y=row*CELL,scene=world.route.scene;
  // Ground-level details stay outside the acorn corridors and do not imply walls.
  for(let n=0;n<15;n++){
    const x=80+noise(row,n)*(WIDTH-160),fy=y+10+noise(n,row)*42;
    if(world.route.nuts.some(a=>a.row===row&&Math.abs(a.x-x)<42))continue;
    if(scene==='grove'){
      if(n%4===0){for(let k=0;k<3;k++)oval(x+k*3,fy-k*2,5,2,'#cce78d77',k*.8);}
      else if(n%3===0){circle(x,fy,3,'#d28156');circle(x-1,fy-1,1,'#ffdd9d');}
      else flower(x,fy,row<13?'#ffd56f':'#eaf2be',.7);
    }else flower(x,fy,scene==='garden'?['#d9a9f8','#85e2e1','#fff0a5'][n%3]:['#fff7d2','#ff9b91','#ffd268'][n%3],.65+noise(row,n)*.4);
  }
  if(!lawn)return;
  let x=row%2?1250:630;
  if(world.route.nuts.some(n=>n.row===row&&Math.abs(n.x-x)<100))x=x===630?1250:630;
  if(scene==='picnic'&&row%3===1){
    oval(x+7,y+47,66,8,'#244f3840');round(x-54,y+7,108,43,6,'#fff0c7');
    ctx.save();ctx.beginPath();ctx.roundRect(x-54,y+7,108,43,6);ctx.clip();ctx.fillStyle=row%2?'#ef8b7b88':'#62b9c888';
    for(let n=0;n<9;n++)for(let k=0;k<4;k++)if((n+k)%2===0)ctx.fillRect(x-54+n*13,y+7+k*13,13,13);ctx.restore();
    oval(x+15,y+28,12,8,'#fff8df');circle(x+15,y+28,5,'#ffbe6a');round(x-27,y+18,25,22,4,'#9c693a');strokeLine(x-23,y+20,x-5,y+20,'#e8b777',3);
  }
  if(scene==='garden'&&row%3===1){
    const glow=ctx.createRadialGradient(x,y+22,2,x,y+22,64);glow.addColorStop(0,'#ffeaba44');glow.addColorStop(1,'#ffeaba00');circle(x,y+22,64,glow);
    strokeLine(x,y+52,x,y+16,'#243553',5);round(x-9,y+9,18,23,4,'#394d74');round(x-6,y+12,12,16,2,'#ffe6a4');round(x-13,y+6,26,5,2,'#23334f');
  }
  if(scene==='grove'&&row%4===2){
    for(let k=0;k<4;k++){const mx=x+k*16;oval(mx+2,y+41,9,3,'#173e3530');round(mx-2,y+28,4,13,2,'#f2ddac');oval(mx,y+28,9,5,k%2?'#e4aa4b':'#d56e56');circle(mx-3,y+26,1.5,'#fff0bf');}
  }
}
function bankRow(row,title,active){
  const y=row*CELL,skin=world.route.skin;
  const ground=ctx.createLinearGradient(0,y,0,y+CELL);ground.addColorStop(0,skin.safe);ground.addColorStop(1,skin.grass);ctx.fillStyle=ground;ctx.fillRect(0,y,WIDTH,CELL);
  strokeLine(0,y+2,WIDTH,y+2,'#daf6a355',3);strokeLine(0,y+62,WIDTH,y+62,'#163c3d44',3);
  const tx=WIDTH/2+230;
  if(row===0||row===HOME_ROW){}
  else{oval(tx+3,y+51,39,7,'#183a3338');round(tx-31,y+20,62,34,8,'#84552f');oval(tx,y+21,34,12,'#e5bd83');ctx.strokeStyle='#a26d3e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tx,y+21,21,7,0,0,Math.PI*2);ctx.stroke();}
  const w=title.length*8.5+28;if(row!==HOME_ROW){round(WIDTH/2-w/2-220,y+19,w,28,8,active?'#164d43':'#244b46');label(title,WIDTH/2-220,y+38,'#eff6cc',13);}
  if((world.returning&&row===HOME_ROW)||(!world.returning&&world.acorns>=REQUIRED_ACORNS&&row===0)){
    ctx.strokeStyle=world.returning?'#93e9ed':'#e8f9a2';ctx.lineWidth=3;ctx.strokeRect(2,y+2,WIDTH-4,CELL-4);
    label(world.returning?'↓ HOME':'↑ REVIEW',WIDTH/2-240,y+38,ctx.strokeStyle,16);
  }
}
function laneGround(lane,y){
  const skin=world.route.skin,scene=world.route.scene,row=y/CELL,road=lane.type==='road';
  const zone=row>=17?0:row>=9?1:2;
  const palettes={grove:['#68b95a','#97ad4e','#4b9971'],picnic:['#8dc95d','#6cbf8e','#a5c96a'],garden:['#526e9c','#665b93','#3e6387']};
  const base=road?skin.path:palettes[scene][zone];
  ctx.fillStyle=base;ctx.fillRect(0,y,WIDTH,CELL);
  const shade=ctx.createLinearGradient(0,y,0,y+CELL);shade.addColorStop(0,road?'#633e3424':'#143c2910');shade.addColorStop(.35,'#ffffff0c');shade.addColorStop(1,'#0c383417');ctx.fillStyle=shade;ctx.fillRect(0,y,WIDTH,CELL);
  if(road){
    ctx.fillStyle=skin.edge;ctx.fillRect(0,y,WIDTH,3);ctx.fillRect(0,y+61,WIDTH,3);strokeLine(0,y+5,WIDTH,y+5,'#fff0b944',2);
    if(scene==='garden'){
      for(let x=0;x<WIDTH;x+=64){round(x+2,y+7,59,23,3,'#e6d8f31c');round(x+34,y+34,59,23,3,'#322c5820');}
    }else{
      for(let n=0;n<70;n++){const x=noise(n,row)*WIDTH,py=y+8+noise(row,n)*46;oval(x,py,1+noise(n,3)*2,1,'#775e3a33');}
      if(scene==='picnic'){ctx.setLineDash([22,25]);strokeLine(0,y+32,WIDTH,y+32,'#fff7db66',2);ctx.setLineDash([]);}
    }
  }else{
    // Broad irregular grass patches replace the repeated single-color strips.
    for(let n=0;n<7;n++){
      const x=noise(row,n)*WIDTH;oval(x,y+18+noise(n,row)*30,26+noise(n,1)*54,10+noise(n,2)*12,n%2?'#e3f7a512':'#1e6a4420');
    }
    for(let n=0;n<40;n++){
      const x=noise(row+8,n)*WIDTH,py=y+8+noise(n,row+2)*46;
      strokeLine(x-2,py,x-3,py-4,'#efffc72b',1);strokeLine(x,py,x+2,py-6,'#174f3626',1);
    }
    ctx.save();ctx.beginPath();ctx.rect(0,y,WIDTH,CELL);ctx.clip();
    // One continuous walking trail threads through the lawns, beneath hazards.
    for(const [width,color] of [[39,'#294b3e22'],[31,scene==='garden'?'#b3c1d54a':'#f6dfac77']]){
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();
      for(let py=y-10;py<=y+CELL+10;py+=4){const px=928+Math.sin(py/230)*155;if(py===y-10)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
    }ctx.restore();ctx.lineCap='butt';
    if(scene==='grove'&&zone===1)for(let n=0;n<24;n++){
      const x=noise(n,row)*WIDTH,py=y+noise(row,n)*CELL;oval(x,py,4,2,n%2?'#eed079aa':'#b96c3d88',n*.8);
    }
    if(scene==='grove'&&zone===2)for(let n=0;n<7;n++){
      const x=noise(row,n)*WIDTH,py=y+20+noise(n,row)*26;
      for(let k=-2;k<=2;k++)oval(x+k*3,py-4+Math.abs(k)*2,3,7,'#c0e39366',k*.45);
    }
  }
}
function minimap(){
  const mx=VIEW_WIDTH-162,my=16,mw=146,mh=126,sx=mw/WIDTH,sy=mh/HEIGHT;
  round(mx-8,my-8,mw+16,mh+34,12,'#102b36ed');
  for(const row of [0,STUMP_ROW,HOME_ROW]){ctx.fillStyle='#97cf5b';ctx.fillRect(mx,my+row*CELL*sy,mw,4);}
  for(const n of world.nuts())if(!n.collected)circle(mx+n.x*sx,my+(n.row+.5)*CELL*sy,n.golden?3:1.5,n.golden?'#ffe05a':'#c8dda5');
  ctx.strokeStyle='#ffffffaa';ctx.lineWidth=1;ctx.strokeRect(mx+camera.x*sx,my+camera.y*sy,VIEW_WIDTH*sx,VIEW_HEIGHT*sy);
  circle(mx+world.player.x*sx,my+(world.player.row+.5)*CELL*sy,4,'#fff');
  label(world.returning?'HOME ↓':'OLD OAK ↑',mx+mw/2,my+mh+18,'#d9efb6',11);
}
function forestBorder(row){
  const y=row*CELL;
  for(const [i,x] of [-8,WIDTH+8].entries())tree(x,y+38,.85+noise(row,i)*.3,row+i);
}
function atmosphere(){
  const scene=world.route.scene;
  for(let n=0;n<18;n++){
    const drift=reduced?0:world.time*(scene==='garden'?7:12);
    const x=(noise(n,9)*WIDTH+drift)%WIDTH,y=(noise(n,11)*HEIGHT+(reduced?0:Math.sin(world.time*.5+n)*9))%HEIGHT;
    if(x<camera.x-20||x>camera.x+VIEW_WIDTH+20||y<camera.y-20||y>camera.y+VIEW_HEIGHT+20)continue;
    if(scene==='garden'){
      const glow=ctx.createRadialGradient(x,y,1,x,y,12);glow.addColorStop(0,'#fff4a488');glow.addColorStop(1,'#fff4a400');circle(x,y,12,glow);circle(x,y,1.5,'#fff4b7');
    }else{
      ctx.save();ctx.translate(x,y);ctx.rotate(n+(reduced?0:world.time*.35));oval(0,0,4,2,scene==='grove'?'#ffe29b99':'#fff3bc88');ctx.restore();
    }
  }
}
function draw(){
  if(!world)return;ctx.clearRect(0,0,VIEW_WIDTH,VIEW_HEIGHT);
  const targetX=Math.max(0,Math.min(WIDTH-VIEW_WIDTH,world.player.x-VIEW_WIDTH/2+(world.facing==='left'?-72:world.facing==='right'?72:0)));
  const targetY=Math.max(0,Math.min(HEIGHT-VIEW_HEIGHT,(world.player.row+.5)*CELL-VIEW_HEIGHT*.5+(world.facing==='down'?65:-65)));
  camera.x+=(targetX-camera.x)*(reduced?1:.16);camera.y+=(targetY-camera.y)*(reduced?1:.16);
  ctx.save();ctx.translate(-camera.x,-camera.y);
  const first=Math.max(0,Math.floor(camera.y/CELL)-1),last=Math.min(HOME_ROW,Math.ceil((camera.y+VIEW_HEIGHT)/CELL)+1);
  // Draw every ground strip first so props and shadows are never clipped by the next row.
  for(let row=first;row<=last;row++){
    const lane=world.route.lanes.find(l=>l.row===row),y=row*CELL;
    if([0,STUMP_ROW,HOME_ROW].includes(row))bankRow(row,row===HOME_ROW?'HOME · STASH ACORNS':row===STUMP_ROW?(world.checkpoint===STUMP_ROW?'STUMP SAVED':'STUMP · REVIEW'):'OLD OAK · REVIEW',row===STUMP_ROW&&world.checkpoint===STUMP_ROW);
    else laneGround(lane||{type:'lawn'},y);
  }
  art.clearing(world,HOME_ROW,STUMP_ROW);
  for(let row=first;row<=last;row++){
    const lane=world.route.lanes.find(l=>l.row===row),y=row*CELL;
    if(!lane){parkScenery(row,true);forestBorder(row);continue;}
    if(lane.type==='road')world.objects(lane).forEach(o=>{if(o.x+o.width>camera.x-40&&o.x<camera.x+VIEW_WIDTH+40)parkObstacle(o,y,lane);});
    else if(lane.type==='sprinkler'){parkScenery(row);world.sprinklers(lane).forEach(o=>sprinkler(o,y));}
    else parkScenery(row,true);
  }
  ctx.strokeStyle='#ffed9e55';ctx.lineWidth=3;ctx.setLineDash([3,10]);
  for(let group=0;group<7;group++){
    const trail=world.nuts().slice(group*4,group*4+4);
    if(trail.every(n=>n.collected))continue;
    ctx.beginPath();trail.forEach((n,i)=>i?ctx.lineTo(n.x,n.row*CELL+32):ctx.moveTo(n.x,n.row*CELL+32));ctx.stroke();
  }ctx.setLineDash([]);
  for(const nut of world.nuts())if(!nut.collected){
    const y=nut.row*CELL+CELL/2;
    if(nut.golden){const glow=ctx.createRadialGradient(nut.x,y,3,nut.x,y,34);glow.addColorStop(0,'#ffed6a99');glow.addColorStop(1,'#ffed6a00');circle(nut.x,y,34,glow);}
    ctx.save();ctx.translate(nut.x,y);if(nut.golden)ctx.scale(1.35,1.35);acorn(0,0);if(nut.golden){
      label('★',0,5,'#fff59d',13);
      const shine=reduced?1:.7+Math.sin(world.time*3+nut.id)*.3;
      ctx.globalAlpha=shine;ctx.fillStyle='#fff5b7';ctx.fill(new Path2D('M19-20 21-14 27-12 21-10 19-4 17-10 11-12 17-14Z'));ctx.globalAlpha=1;
    }ctx.restore();
  }
  art.bursts(world.pickups,reduced);
  for(const p of world.pickups)label(`+${p.points}`,p.x,p.row*CELL-20+(1-p.life)*-28,'#fff3a1',18);

  if(world.slowTime>0){ctx.fillStyle='#b6f4ff0b';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.strokeStyle='#a0e8f3';ctx.lineWidth=4;ctx.strokeRect(2,2,WIDTH-4,HEIGHT-4);}
  let x=world.player.x,y=world.player.row*CELL+CELL/2;
  if(world.hop>0&&!reduced){const t=1-world.hop/.11;const ease=1-(1-t)**2;x=world.from.x+(x-world.from.x)*ease;y=world.from.row*CELL+CELL/2+(y-world.from.row*CELL-CELL/2)*ease;}
  if(world.invulnerable>0&&world.state==='playing'&&!reduced){ctx.globalAlpha=.82+Math.sin(world.invulnerable*20)*.12;}
  if(world.sprinting&&world.energy>.08){for(let n=1;n<4;n++)circle(x+(world.from.x-x)*n*.3,y+(world.from.row*CELL+CELL/2-y)*n*.3,12-n*2,'#ffe5a54a');}
  if(world.magnet>0){ctx.strokeStyle='#ffe56a';ctx.lineWidth=2;ctx.setLineDash([5,9]);ctx.beginPath();ctx.arc(x,y,105,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  squirrel(x,y);ctx.globalAlpha=1;art.foreground(world,HOME_ROW);atmosphere();ctx.restore();minimap();
  const zone=world.player.row>=17?0:world.player.row>=9?1:2;
  const zones={grove:['CLOVER MEADOW','AMBER GROVE','FERN HOLLOW'],picnic:['PICNIC GREENS','DAISY COMMON','ORCHARD WALK'],garden:['LANTERN LAWN','LAVENDER COURT','FIREFLY GARDEN']};
  if(VIEW_WIDTH>=800){round(VIEW_WIDTH/2-108,17,216,29,14,'#102b36da');label(zones[world.route.scene][zone],VIEW_WIDTH/2,36,'#fff0c5',12);}
  round(16,16,220,67,12,'#102b36ed');label(`${world.score} PTS · ${world.combo} STREAK`,126,40,'#ffeb97',15);
  round(30,54,190,12,6,'#061c26');round(30,54,Math.max(1,190*world.energy),12,6,world.energy>.2?'#a3ed68':'#ffae64');
  label(world.magnet>0?`MAGNET ${Math.ceil(world.magnet)}s`:'SHIFT / SPRINT',126,78,'#ecf6db',10);
}

const sprintButton=$('sprint');
if(sprintButton){
  sprintButton.addEventListener('pointerdown',e=>{e.preventDefault();sprintButton.setPointerCapture(e.pointerId);if(world)world.sprinting=true;});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])sprintButton.addEventListener(type,()=>{if(world)world.sprinting=false;});
  sprintButton.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();world.sprinting=true;}});
  sprintButton.addEventListener('keyup',()=>world.sprinting=false);
}
$('pause').onclick=()=>{world.pause();sync();};
$('restart').onclick=()=>{
  if(world.state!=='playing')return;world.pause();lastState='paused';
  show(`<h2 id="panel-title">Start a new run?</h2><p>Your current crossing and review summary will reset.</p>${button('confirm','Start a new run')}${button('cancel','Keep playing',false)}`);
  $('confirm').onclick=()=>newRun();$('cancel').onclick=()=>{world.resume();sync();};
};
$('slow').onclick=()=>{world.activateSlow();sync();canvas.focus({preventScroll:true});};
$('fullscreen').onclick=async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-shell').requestFullscreen();}catch{announce('Full screen is unavailable in this browser.');}
};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
panel.addEventListener('cancel',event=>{event.preventDefault();if(world.state==='paused'){world.resume();sync();}});
document.addEventListener('keydown',event=>{
  if(!world)return;
  if(world.state==='question'){
    const answers=[...content.querySelectorAll('[data-answer]')];
    if(/^[1-4]$/.test(event.key)){event.preventDefault();world.answer(Number(event.key)-1);sync();}
    else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
      event.preventDefault();const index=Math.max(0,answers.indexOf(document.activeElement));answers[(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:3))%4].focus();
    }return;
  }
  if(world.state!=='playing')return;
  if(event.key==='Shift'){event.preventDefault();world.sprinting=true;return;}
  const direction=directions[event.key]||directions[event.key.toLowerCase()];
  if(direction){event.preventDefault();world.facing=direction;if(!event.repeat){held=direction;repeatAt=performance.now()+175;world.move(direction);}}
  else if(event.code==='Space'){event.preventDefault();if(!event.repeat){world.activateSlow();sync();}}
  else if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();world.pause();sync();}
});
document.addEventListener('keyup',event=>{if(event.key==='Shift'&&world)world.sprinting=false;if(directions[event.key]||directions[event.key.toLowerCase()])held=null;});
document.querySelectorAll('[data-direction]').forEach(b=>{
  b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);held=b.dataset.direction;repeatAt=performance.now()+175;world.facing=held;world.move(held);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>held=null));
  b.addEventListener('click',event=>{if(event.detail===0){world.facing=b.dataset.direction;world.move(b.dataset.direction);}});
});
function autoPause(){held=null;if(world)world.sprinting=false;if(world?.pause())sync();}
window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});
function frame(now){
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;
  if(world){if(held&&world.state==='playing'&&now>=repeatAt){world.facing=held;world.move(held);repeatAt=now+(world.sprinting&&world.energy>.08?100:175);}world.update(dt);sync();draw();}
  if(noticeText&&now>noticeUntil){$('announcement').classList.remove('visible');noticeText='';}
  requestAnimationFrame(frame);
}
try{newRun();requestAnimationFrame(frame);}catch(error){
  console.error(error);show('<h2 id="panel-title">This question pack needs a fix.</h2><p class="fatal">The game could not start. Please return to the review games page.</p><a href="/arcade-review-games/">All review games</a>');
}
