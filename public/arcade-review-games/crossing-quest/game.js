import {enhanceTopicPicker} from '../../review-lab/topic-picker.js';
import bank from './questions.js';
import { QUESTION_SETS, loadQuestionSet } from './question-sets.js';
import { CrossingWorld, roadShapes } from './engine.js';
import { CELL, WIDTH, HEIGHT, ROUTES, DIFFICULTIES } from './config.js';

const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const panel=$('panel'),content=$('panel-content');
let world,activeBank=bank,mode='relaxed',selectedSet=bank.id,lastState='',lastFrame=0,held=null,repeatAt=0,noticeUntil=0,noticeText='';
const requestedSet=new URLSearchParams(location.search).get('set');
const presetSet=QUESTION_SETS.find(set=>set.id===requestedSet);
if(presetSet)selectedSet=presetSet.id;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function show(html){held=null;content.innerHTML=html;if(!panel.open)panel.showModal();}
function close(){if(panel.open)panel.close();canvas.focus({preventScroll:true});held=null;}
function button(id,label,primary=true){return `<button id="${id}" class="${primary?'primary':'secondary'}">${label}</button>`;}
function newRun(){noticeText='';$('announcement').classList.remove('visible');world=new CrossingWorld(activeBank,mode);lastState='';sync();draw();}
function ready(){
  show(`<div class="intro-mark" aria-hidden="true">🐿️</div><span class="pill">Acorn Dash${presetSet?'':' · step 1 of 2'}</span><h2 id="panel-title">Small paws.<br>Big acorn adventure.</h2><ul class="intro-rules"><li><b>1</b>Dodge cyclists, rolling balls, and timed sprinklers.</li><li><b>2</b>Gather at least 3 acorns. Review at the stump and old oak.</li><li><b>3</b>Return DOWN to your home tree to stash your acorns.</li></ul><label for="difficulty">Park difficulty</label><select id="difficulty">${Object.entries(DIFFICULTIES).map(([value,d])=>`<option value="${value}" ${value===mode?'selected':''}>${d.label}${value==='relaxed'?' · slower hazards':value==='challenge'?' · faster hazards, fewer hearts':''}</option>`).join('')}</select><p>You start with a shield. Questions pause everything.</p>${presetSet?`<p><strong>Review topic:</strong> ${escapeHTML(presetSet.title)} · <a href="/review-lab/#topics">Change topic</a></p>`:''}<p id="pack-error" class="fatal" role="alert"></p>${button('choose-set',presetSet?'Start acorn run':'Choose question set')}<p class="access-note">Arrow keys or WASD · touch controls on phones and tablets</p>`);
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
    activeBank=loaded;selectedSet=loaded.id;world=nextWorld;world.start();lastState='';close();sync();announce('Collect 3+ acorns · your first shield is ready');
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
  show(`<span class="pill">${escapeHTML(bank.title)} · run summary</span><h2 id="panel-title">${won?'All three acorn trips complete!':'Your next crossing awaits.'}</h2><p>${won?'Acorns safely stashed. Here’s what you reviewed.':'You ran out of hearts. Try Gentle difficulty or use slow time before a tricky stretch.'}</p><div class="summary-stats"><div><strong>${world.correct} / ${answered}</strong><span>Correct answers</span></div><div><strong>${accuracy}%</strong><span>Review accuracy</span></div></div><p>Acorns stashed: ${world.stashed} · Questions answered: ${answered} / ${world.deck.length} · Crossings finished: ${won?3:world.stage} / 3</p>${answered?`<details><summary>Review your answers (${answered})</summary>${world.records.map(r=>`<div class="review-item"><span class="${r.correct?'feedback-correct':'feedback-missed'}">${r.correct?'Correct':'Review again'}</span><h3>${escapeHTML(r.question)}</h3><p>Your answer: ${escapeHTML(r.choices[r.selected])}</p>${r.correct?'':`<p>Correct answer: ${escapeHTML(r.choices[r.answer])}</p>`}<p>${escapeHTML(r.explanation)}</p></div>`).join('')}</details>`:''}${button('again','Play a new run')}<p class="access-note">This summary stays on this screen. Results are not sent to a teacher.</p>`);
  $('again').onclick=()=>{lastState='';newRun();};$('again').focus();
}
function pauseDialog(){show(`<span class="pill">Take a breather</span><h2 id="panel-title">Crossing paused</h2><p>Park obstacles and sprinklers are stopped.</p>${button('resume','Resume crossing')}${button('new','Start a new run',false)}`);$('resume').onclick=()=>{world.resume();sync();};$('new').onclick=()=>newRun();}
function sync(){
  const setText=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
  setText('stage',`${world.stage+1} / ${ROUTES.length} · ${world.route.name}`);
  setText('acorns',`${world.acorns}${world.returning?' carried':' / 3 needed'} · ${world.stashed} stashed`);
  setText('review-set',`Review set: ${activeBank.title}`);
  setText('route',world.returning?'Return DOWN to your home tree. Extra acorns are optional.':'Gather 3+ acorns. Review at the stump and old oak.');
  setText('mission-step',world.returning?'3 / 3 · BRING THEM HOME':world.acorns>=3?'2 / 3 · VISIT THE OLD OAK':'1 / 3 · FILL YOUR POUCH');
  setText('mission-goal',world.returning?'↓ Reach the bottom home area to finish this level.':world.acorns>=3?'↑ Reach the top safe area and finish its review.':`Collect ${Math.max(0,3-world.acorns)} more acorn${world.acorns===2?'':'s'}. The stump has two safe pickups.`);
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
    show(`<span class="pill">Old oak reached · ${world.acorns} / 3 acorns</span><h2 id="panel-title">Your pouch needs ${3-world.acorns} more.</h2><p>Go back down to collect the remaining acorns, then return to this top safe area. The middle stump has two safe pickups.</p><p>The park is paused while you read.</p>${button('hunt','Keep collecting ↓')}`);
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
function parkObstacle(o,y,lane){
  const shapes=roadShapes(lane,o);
  if(lane.kind==='ball'){
    for(const c of shapes.circles){circle(c.x,c.y,c.r,world.route.skin.ball);ctx.strokeStyle='#ffe1a6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,15,-.8,1.8);ctx.stroke();}
    return;
  }
  const x=o.x+o.width/2;
  shapes.circles.forEach(c=>circle(c.x,c.y,c.r,'#23343a'));
  ctx.strokeStyle='#e7d47a';ctx.lineWidth=5;ctx.beginPath();shapes.segments.forEach(({a,b})=>{ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);});ctx.stroke();
  round(x-9,y+8,19,25,7,world.route.skin.shirt);circle(x+3,y+4,9,'#ffd4a0');round(x-8,y-3,22,8,4,'#f08269');
}
function squirrel(x,y){
  const lift=reduced?0:Math.sin(world.hop/.11*Math.PI)*7;y-=lift;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#12241b55';ctx.beginPath();ctx.ellipse(0,21+lift,23,7,0,0,Math.PI*2);ctx.fill();
  if(world.shield){ctx.strokeStyle='#c4fb8a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#ad6c3c';ctx.beginPath();ctx.ellipse(16,-5,12,25,.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d99552';ctx.beginPath();ctx.ellipse(19,-10,7,18,.5,0,Math.PI*2);ctx.fill();
  circle(-8,18,7,'#945c35');circle(8,18,7,'#945c35');
  ctx.fillStyle='#ba7b46';ctx.beginPath();ctx.ellipse(-2,5,14,18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffe2b0';ctx.beginPath();ctx.ellipse(-3,8,8,12,0,0,Math.PI*2);ctx.fill();
  circle(-12,-22,7,'#a5683c');circle(5,-22,7,'#a5683c');circle(-12,-22,3,'#edba89');circle(5,-22,3,'#edba89');circle(-4,-11,15,'#c7884e');
  circle(-10,-14,3,'#211e19');circle(2,-14,3,'#211e19');circle(-4,-5,3,'#4c3324');
  round(-15,2,6,10,3,'#a76838');round(6,2,6,10,3,'#a76838');ctx.restore();
}
function acorn(x,y){circle(x,y+3,9,'#e5b16a');round(x-11,y-8,22,9,4,'#755032');round(x-1,y-13,3,7,1,'#bf9157');}
function sprinkler(o,y){
  circle(o.x,y+32,7,'#80b5aa');
  if(o.active||o.warning){ctx.fillStyle=o.active?'#82d9ee65':'#ffc76130';ctx.beginPath();ctx.ellipse(o.x,y+32,o.radius,29,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=o.active?'#abe9f5':'#ffcb77';ctx.lineWidth=2;ctx.setLineDash(o.warning?[5,5]:[]);ctx.stroke();ctx.setLineDash([]);}
  if(o.active){for(let i=-2;i<=2;i++){ctx.strokeStyle='#c0f1fa';ctx.beginPath();ctx.moveTo(o.x,y+32);ctx.quadraticCurveTo(o.x+i*17,y+3,o.x+i*24,y+38);ctx.stroke();}}
}
function parkScenery(row,lawn=false){
  const y=row*CELL,skin=world.route.skin,scene=world.route.scene;
  if(scene==='grove'){
    for(let i=0;i<11;i++){
      const x=60+i*73;
      ctx.fillStyle=skin.leaf;ctx.beginPath();ctx.ellipse(x,y+12+(i%2)*39,5,2.5,i*.7,0,Math.PI*2);ctx.fill();
    }
    if(row!==4){
      round(797,y+18,17,44,4,'#80552e');
      circle(805,y+14,27,skin.foliage);circle(783,y+23,20,skin.leaf);circle(828,y+22,22,skin.foliage);
    }else{
      round(774,y+31,54,23,8,'#916438');round(771,y+25,60,13,5,'#ba8b54');
      ctx.strokeStyle='#79542d';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(801,y+31,19,4,0,0,Math.PI*2);ctx.stroke();
    }
  }else if(scene==='picnic'){
    const bx=lawn?570:750,by=y+15;
    round(bx,by,100,37,4,'#f4e4c0');
    ctx.save();ctx.beginPath();ctx.rect(bx,by,100,37);ctx.clip();
    ctx.fillStyle='#d4776677';
    for(let c=0;c<8;c++)for(let r=0;r<3;r++)if((c+r)%2===0)ctx.fillRect(bx+c*13,by+r*13,13,13);
    ctx.restore();round(bx+36,by+7,25,18,3,'#997143');round(bx+42,by+3,13,8,4,'#c89b5e');
    if(lawn){
      round(800,y+27,5,31,2,'#745737');
      ctx.fillStyle='#f2c16e';ctx.beginPath();ctx.moveTo(774,y+29);ctx.quadraticCurveTo(803,y-10,833,y+29);ctx.closePath();ctx.fill();
      label('OPEN LAWN',118,y+39,'#f5f1d4',14);
    }
  }else{
    // Garden paving, low flower borders, and a warm lantern are decoration.
    ctx.strokeStyle='#8990b033';ctx.lineWidth=1;
    for(let x=0;x<WIDTH;x+=56){ctx.strokeRect(x,y+7,54,23);ctx.strokeRect(x+28,y+33,54,23);}
    for(let i=0;i<18;i++){
      const x=30+i*47;
      circle(x,y+9,2.5,i%2?'#d5b0e9':'#adcee2');circle(x+4,y+12,2,'#e6d89e');
    }
    round(800,y+14,4,43,2,'#263149');
    ctx.save();const light=ctx.createRadialGradient(802,y+21,2,802,y+21,36);
    light.addColorStop(0,'#ffe7a955');light.addColorStop(1,'#ffe7a900');circle(802,y+21,36,light);ctx.restore();
    round(794,y+12,16,18,3,'#ffe3a1');round(790,y+9,24,5,2,'#263149');
  }
}
function bankRow(row,title,active){
  const y=row*CELL,skin=world.route.skin;ctx.fillStyle=skin.safe;ctx.fillRect(0,y,WIDTH,CELL);
  ctx.fillStyle='#ffffff08';ctx.fillRect(0,y,WIDTH,4);ctx.fillStyle='#061d2440';ctx.fillRect(0,y+60,WIDTH,4);
  parkScenery(row);
  const w=title.length*8.5+28;round(20,y+18,w,29,14,active?'#173c32':'#233e37');label(title,20+w/2,y+38,active?'#d3efa5':'#bfd2c8',13);
  if(row===0||row===8){
    round(WIDTH-39,y+34,28,25,5,'#845735');round(WIDTH-43,y+29,36,9,4,'#ae814e');
    circle(WIDTH-25,y+45,5,'#392b22');
  }
  if((world.returning&&row===8)||(!world.returning&&world.acorns>=3&&row===0)){
    ctx.strokeStyle=world.returning?'#9de7ec':'#d4ef89';ctx.lineWidth=3;ctx.strokeRect(2,y+2,WIDTH-4,CELL-4);
    label(world.returning?'↓ HOME':'↑ REVIEW',WIDTH-215,y+38,ctx.strokeStyle,16);
  }
}
function laneGround(lane,y){
  const skin=world.route.skin,scene=world.route.scene;
  ctx.fillStyle=lane.type==='road'?skin.path:skin.grass;ctx.fillRect(0,y,WIDTH,CELL);
  if(lane.type==='road'){
    ctx.fillStyle=skin.edge;ctx.fillRect(0,y,WIDTH,3);ctx.fillRect(0,y+61,WIDTH,3);
    if(scene==='garden'){
      ctx.strokeStyle='#e3d5ee25';ctx.lineWidth=1;
      for(let x=0;x<WIDTH;x+=48){ctx.strokeRect(x,y+5,46,25);ctx.strokeRect(x+24,y+33,46,25);}
    }else if(scene==='picnic'){
      ctx.fillStyle='#f9e7bd66';for(let x=0;x<WIDTH;x+=70)ctx.fillRect(x,y+31,26,2);
    }else{
      ctx.fillStyle='#74583b44';for(let x=12;x<WIDTH;x+=43){circle(x,y+15+(x%31),1.5,ctx.fillStyle);}
    }
  }else{
    for(let x=18;x<WIDTH;x+=47)round(x,y+15,2,9,1,'#d5e4ad33');
    if(scene==='garden')for(let x=40;x<WIDTH;x+=73){circle(x,y+7,2,'#ccb4e4');circle(x+5,y+9,2,'#eac4d2');}
  }
}
function draw(){
  if(!world)return;ctx.clearRect(0,0,WIDTH,HEIGHT);
  for(let row=0;row<9;row++){
    const y=row*CELL,lane=world.route.lanes.find(l=>l.row===row);
    if(!lane){bankRow(row,row===8?'HOME · STASH ACORNS':row===4?(world.checkpoint===4?'STUMP SAVED':'STUMP · REVIEW'):'OLD OAK · REVIEW',row===4&&world.checkpoint===4);continue;}
    laneGround(lane,y);
    if(lane.type==='road'){
      label(lane.speed>0?'›':'‹',20,y+37,'#f1e7ca77',24);
      world.objects(lane).forEach(o=>parkObstacle(o,y,lane));
    }else if(lane.type==='sprinkler'){
      world.sprinklers(lane).forEach(o=>sprinkler(o,y));
    }else parkScenery(row,true);
  }
  for(const nut of world.nuts())if(!nut.collected)acorn(nut.x,nut.row*CELL+CELL/2);

  if(world.slowTime>0){ctx.fillStyle='#b6f4ff0b';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.strokeStyle='#a0e8f3';ctx.lineWidth=4;ctx.strokeRect(2,2,WIDTH-4,HEIGHT-4);}
  let x=world.player.x,y=world.player.row*CELL+CELL/2;
  if(world.hop>0&&!reduced){const t=1-world.hop/.11;const ease=1-(1-t)**2;x=world.from.x+(x-world.from.x)*ease;y=world.from.row*CELL+CELL/2+(y-world.from.row*CELL-CELL/2)*ease;}
  if(world.invulnerable>0&&world.state==='playing'&&!reduced){ctx.globalAlpha=.6+Math.sin(world.invulnerable*20)*.25;}
  squirrel(x,y);ctx.globalAlpha=1;
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
  const direction=directions[event.key]||directions[event.key.toLowerCase()];
  if(direction){event.preventDefault();if(!event.repeat){held=direction;repeatAt=performance.now()+175;world.move(direction);}}
  else if(event.code==='Space'){event.preventDefault();if(!event.repeat){world.activateSlow();sync();}}
  else if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();world.pause();sync();}
});
document.addEventListener('keyup',event=>{if(directions[event.key]||directions[event.key.toLowerCase()])held=null;});
document.querySelectorAll('[data-direction]').forEach(b=>{
  b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);held=b.dataset.direction;repeatAt=performance.now()+175;world.move(held);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>held=null));
  b.addEventListener('click',event=>{if(event.detail===0)world.move(b.dataset.direction);});
});
function autoPause(){held=null;if(world?.pause())sync();}
window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});
function frame(now){
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;
  if(world){if(held&&world.state==='playing'&&now>=repeatAt){world.move(held);repeatAt=now+175;}world.update(dt);sync();draw();}
  if(noticeText&&now>noticeUntil){$('announcement').classList.remove('visible');noticeText='';}
  requestAnimationFrame(frame);
}
try{newRun();requestAnimationFrame(frame);}catch(error){
  console.error(error);show('<h2 id="panel-title">This question pack needs a fix.</h2><p class="fatal">The game could not start. Please return to the review games page.</p><a href="/arcade-review-games/">All review games</a>');
}
