import bank from './questions.js';
import { QUESTION_SETS, loadQuestionSet } from './question-sets.js';
import { CrossingWorld } from './engine.js';
import { CELL, WIDTH, HEIGHT, ROUTES, DIFFICULTIES } from './config.js';

const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const panel=$('panel'),content=$('panel-content');
let world,activeBank=bank,mode='relaxed',selectedSet=bank.id,lastState='',lastFrame=0,held=null,repeatAt=0,noticeUntil=0,noticeText='';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function show(html){held=null;content.innerHTML=html;if(!panel.open)panel.showModal();}
function close(){if(panel.open)panel.close();canvas.focus({preventScroll:true});held=null;}
function button(id,label,primary=true){return `<button id="${id}" class="${primary?'primary':'secondary'}">${label}</button>`;}
function newRun(){noticeText='';$('announcement').classList.remove('visible');world=new CrossingWorld(activeBank,mode);lastState='';sync();draw();}
function ready(){
  show(`<div class="intro-mark" aria-hidden="true">🐿️</div><span class="pill">Acorn Dash · step 1 of 2</span><h2 id="panel-title">Small paws.<br>Big acorn adventure.</h2><ul class="intro-rules"><li><b>1</b>Dodge cyclists, rolling balls, and timed sprinklers.</li><li><b>2</b>Gather at least 3 acorns. Review at the stump and old oak.</li><li><b>3</b>Return DOWN to your home tree to stash your acorns.</li></ul><label for="difficulty">Park difficulty</label><select id="difficulty">${Object.entries(DIFFICULTIES).map(([value,d])=>`<option value="${value}" ${value===mode?'selected':''}>${d.label}${value==='relaxed'?' · slower hazards':value==='challenge'?' · faster hazards, fewer hearts':''}</option>`).join('')}</select><p>You start with a shield. Questions pause everything.</p>${button('choose-set','Choose question set')}<p class="access-note">Arrow keys or WASD · touch controls on phones and tablets</p>`);
  $('choose-set').onclick=()=>{mode=$('difficulty').value;chooseSet();};
}
function chooseSet(){
  show(`<span class="pill">Acorn Dash · step 2 of 2</span><h2 id="panel-title">Choose your review</h2><p>${escapeHTML(DIFFICULTIES[mode].label)} park difficulty · 12 questions per run</p><label for="question-set">Question set</label><select id="question-set">${QUESTION_SETS.map(set=>`<option value="${escapeHTML(set.id)}" ${set.id===selectedSet?'selected':''}>${escapeHTML(set.title)} · ${escapeHTML(set.subject)}</option>`).join('')}</select><p id="set-description"></p><p class="access-note">Only the Scientific Method test pack is available in this preview. Future topics use this same game.</p><p id="pack-error" class="fatal" role="alert"></p>${button('start','Start acorn run')}${button('back','Back to difficulty',false)}`);
  const describe=()=>{const set=QUESTION_SETS.find(set=>set.id===$('question-set').value);$('set-description').textContent=set?.description||'';};
  $('question-set').onchange=describe;describe();
  $('back').onclick=()=>{selectedSet=$('question-set').value;ready();};
  $('start').onclick=async()=>{
    const start=$('start'),back=$('back'),select=$('question-set');
    start.disabled=back.disabled=select.disabled=true;start.textContent='Loading questions…';$('pack-error').textContent='';
    try{
      const loaded=await loadQuestionSet(select.value);
      const nextWorld=new CrossingWorld(loaded,mode);
      activeBank=loaded;selectedSet=loaded.id;world=nextWorld;world.start();lastState='';close();sync();announce('Collect 3+ acorns · your first shield is ready');
    }catch(error){
      console.error(error);$('pack-error').textContent='This set could not load. Try again or go back.';
      start.disabled=back.disabled=select.disabled=false;start.textContent='Try loading again';start.focus();
    }
  };
}
function question(){
  const q=world.question;
  show(`<span class="pill">${world.stop==='island'?'Tree stump':'Old oak'} · question ${world.questionIndex+1} / ${world.deck.length}</span><h2 id="panel-title">${escapeHTML(q.question)}</h2><p>The crossing is paused. Take your time.</p><div class="answers">${q.choices.map((choice,i)=>`<button class="answer" data-answer="${i}"><b>${i+1}</b><span>${escapeHTML(choice)}</span></button>`).join('')}</div><p class="access-note">1–4 to answer · arrow keys to choose · Enter to confirm</p>`);
  content.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{world.answer(Number(b.dataset.answer));sync();});
  content.querySelector('[data-answer]').focus();
}
function feedback(){
  const q=world.question,{correct,reward}=world.feedback;
  show(`<span class="pill">Question ${world.questionIndex+1} / ${world.deck.length}</span><h2 id="panel-title" class="${correct?'feedback-correct':'feedback-missed'}">${correct?'That’s right!':'Let’s review this one.'}</h2><p><strong>Correct answer:</strong> ${escapeHTML(q.choices[q.answer])}</p><p>${escapeHTML(q.explanation)}</p>${reward?`<p class="reward">${escapeHTML(reward)}</p>`:'<p>You keep your hearts. Use the explanation on your next review.</p>'}${button('continue',world.checkpointAnswers===0?'Next question':world.stop==='finish'?'Return home ↓':'Continue acorn hunt')}`);
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
  else if(world.state==='won'||world.state==='lost')summary();
  else if(world.state==='transition'){
    show(`<span class="pill">Crossing ${world.stage+1} complete</span><h2 id="panel-title">Next stop: ${escapeHTML(ROUTES[world.stage+1].name)}</h2><p>Your hearts, shield, and slow-time charges carry forward.</p>${button('next','Next crossing')}`);
    $('next').onclick=()=>{world.nextStage();sync();};
  }
}
function announce(text){noticeText=text;noticeUntil=performance.now()+3200;$('announcement').textContent=text;$('announcement').classList.add('visible');}

// Canvas artwork is original and functional: lane bounds match collision geometry.
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function label(text,x,y,color='#e1eed7',size=13){ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(text,x,y);}
function parkObstacle(o,y,lane){
  if(lane.row===6){
    for(const dx of [25,o.width-25]){circle(o.x+dx,y+33,21,'#d49b57');ctx.strokeStyle='#ffe1a6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.x+dx,y+33,15,-.8,1.8);ctx.stroke();}
    return;
  }
  const x=o.x+o.width/2;
  circle(o.x+17,y+42,14,'#23343a');circle(o.x+o.width-17,y+42,14,'#23343a');
  ctx.strokeStyle='#e7d47a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(o.x+17,y+42);ctx.lineTo(x,y+25);ctx.lineTo(o.x+o.width-17,y+42);ctx.lineTo(x+12,y+18);ctx.stroke();
  round(x-9,y+8,19,25,7,'#6fc9c2');circle(x+3,y+4,9,'#ffd4a0');round(x-8,y-3,22,8,4,'#f08269');
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
function bankRow(row,title,active){
  const y=row*CELL;ctx.fillStyle=world.stage===2?'#345361':'#3d634d';ctx.fillRect(0,y,WIDTH,CELL);
  ctx.fillStyle='#ffffff08';ctx.fillRect(0,y,WIDTH,4);ctx.fillStyle='#061d2440';ctx.fillRect(0,y+60,WIDTH,4);
  for(let i=0;i<14;i++){const x=i*CELL+15;ctx.fillStyle='#b0d48b45';ctx.fillRect(x,y+14,3,8);ctx.fillRect(x+6,y+11,3,10);if(i%3===0){circle(x+18,y+42,3,world.route.accent);circle(x+23,y+39,2,'#edf1b9');}}
  const w=title.length*8.5+28;round(20,y+18,w,29,14,active?'#173c32':'#233e37');label(title,20+w/2,y+38,active?'#d3efa5':'#bfd2c8',13);
  if(row===0||row===8){const x=WIDTH-85;round(x-12,y+20,24,42,5,'#845735');circle(x,y+15,28,'#244b34');circle(x-21,y+22,21,'#376342');circle(x+21,y+23,21,'#42764b');round(x-8,y+42,16,20,8,'#392b22');}
}
function draw(){
  if(!world)return;ctx.clearRect(0,0,WIDTH,HEIGHT);
  for(let row=0;row<9;row++){
    const y=row*CELL,lane=world.route.lanes.find(l=>l.row===row);
    if(!lane){bankRow(row,row===8?'HOME · STASH ACORNS':row===4?(world.checkpoint===4?'STUMP SAVED':'STUMP · REVIEW'):'OLD OAK · REVIEW',row===4&&world.checkpoint===4);continue;}
    ctx.fillStyle=lane.type==='road'?'#9a8b70':'#4a754c';ctx.fillRect(0,y,WIDTH,CELL);
    if(lane.type==='road'){
      ctx.fillStyle='#d9c9a52b';for(let x=15;x<WIDTH;x+=82)ctx.fillRect(x,y+2,38,2);
      label(lane.speed>0?'›':'‹',20,y+37,'#f1e7ca77',24);
      world.objects(lane).forEach(o=>parkObstacle(o,y,lane));
    }else{
      for(let x=18;x<WIDTH;x+=47){round(x,y+15,2,9,1,'#94b56e44');}
      world.sprinklers(lane).forEach(o=>sprinkler(o,y));
    }
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
