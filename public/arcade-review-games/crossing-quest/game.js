import bank from './questions.js';
import { CrossingWorld } from './engine.js';
import { CELL, WIDTH, HEIGHT, ROUTES, DIFFICULTIES } from './config.js';

const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const panel=$('panel'),content=$('panel-content');
let world,mode='relaxed',lastState='',lastFrame=0,held=null,repeatAt=0,noticeUntil=0,noticeText='';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function show(html){held=null;content.innerHTML=html;if(!panel.open)panel.showModal();}
function close(){if(panel.open)panel.close();canvas.focus({preventScroll:true});held=null;}
function button(id,label,primary=true){return `<button id="${id}" class="${primary?'primary':'secondary'}">${label}</button>`;}
function newRun(){world=new CrossingWorld(bank,mode);lastState='';sync();draw();}
function ready(){
  show(`<div class="intro-mark" aria-hidden="true">🐸</div><span class="pill">${escapeHTML(bank.title)} · 12 questions</span><h2 id="panel-title">A little hop.<br>A big crossing.</h2><ul class="intro-rules"><li><b>1</b>Hop past traffic and ride the river platforms.</li><li><b>2</b>Answer two questions at each safe checkpoint.</li><li><b>3</b>Earn shields and slow time. Finish all three crossings.</li></ul><label for="difficulty">Crossing difficulty</label><select id="difficulty">${Object.entries(DIFFICULTIES).map(([value,d])=>`<option value="${value}" ${value===mode?'selected':''}>${d.label}${value==='relaxed'?' · slower hazards':value==='challenge'?' · faster hazards, fewer hearts':''}</option>`).join('')}</select><p>You start with a shield. Questions pause everything.</p>${button('start','Start crossing')}<p class="access-note">Arrow keys or WASD · touch controls on phones and tablets</p>`);
  $('start').onclick=()=>{mode=$('difficulty').value;world=new CrossingWorld(bank,mode);world.start();lastState='';close();sync();announce('Reach the island · your first shield is ready');};
}
function question(){
  const q=world.question;
  show(`<span class="pill">${world.stop==='island'?'Island checkpoint':'Finish checkpoint'} · question ${world.questionIndex+1} / ${world.deck.length}</span><h2 id="panel-title">${escapeHTML(q.question)}</h2><p>The crossing is paused. Take your time.</p><div class="answers">${q.choices.map((choice,i)=>`<button class="answer" data-answer="${i}"><b>${i+1}</b><span>${escapeHTML(choice)}</span></button>`).join('')}</div><p class="access-note">1–4 to answer · arrow keys to choose · Enter to confirm</p>`);
  content.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{world.answer(Number(b.dataset.answer));sync();});
  content.querySelector('[data-answer]').focus();
}
function feedback(){
  const q=world.question,{correct,reward}=world.feedback;
  show(`<span class="pill">Question ${world.questionIndex+1} / ${world.deck.length}</span><h2 id="panel-title" class="${correct?'feedback-correct':'feedback-missed'}">${correct?'That’s right!':'Let’s review this one.'}</h2><p><strong>Correct answer:</strong> ${escapeHTML(q.choices[q.answer])}</p><p>${escapeHTML(q.explanation)}</p>${reward?`<p class="reward">${escapeHTML(reward)}</p>`:'<p>You keep your hearts. Use the explanation on your next review.</p>'}${button('continue',world.checkpointAnswers===0?'Next question':world.stop==='finish'?'Finish checkpoint':'Continue crossing')}`);
  $('continue').onclick=()=>{world.continueAnswer();sync();};$('continue').focus();
}
function summary(){
  const won=world.state==='won',answered=world.records.length,accuracy=answered?Math.round(world.correct/answered*100):0;
  show(`<span class="pill">${escapeHTML(bank.title)} · run summary</span><h2 id="panel-title">${won?'All three crossings cleared!':'Your next crossing awaits.'}</h2><p>${won?'Nice crossing. Here’s what you reviewed.':'You ran out of hearts. Try Gentle difficulty or use slow time before a tricky stretch.'}</p><div class="summary-stats"><div><strong>${world.correct} / ${answered}</strong><span>Correct answers</span></div><div><strong>${accuracy}%</strong><span>Review accuracy</span></div></div><p>Questions answered: ${answered} / ${world.deck.length} · Crossings finished: ${won?3:world.stage} / 3</p>${answered?`<details><summary>Review your answers (${answered})</summary>${world.records.map(r=>`<div class="review-item"><span class="${r.correct?'feedback-correct':'feedback-missed'}">${r.correct?'Correct':'Review again'}</span><h3>${escapeHTML(r.question)}</h3><p>Your answer: ${escapeHTML(r.choices[r.selected])}</p>${r.correct?'':`<p>Correct answer: ${escapeHTML(r.choices[r.answer])}</p>`}<p>${escapeHTML(r.explanation)}</p></div>`).join('')}</details>`:''}${button('again','Play a new run')}<p class="access-note">This summary stays on this screen. Results are not sent to a teacher.</p>`);
  $('again').onclick=()=>{lastState='';newRun();};$('again').focus();
}
function pauseDialog(){show(`<span class="pill">Take a breather</span><h2 id="panel-title">Crossing paused</h2><p>Traffic and river platforms are stopped.</p>${button('resume','Resume crossing')}${button('new','Start a new run',false)}`);$('resume').onclick=()=>{world.resume();sync();};$('new').onclick=()=>newRun();}
function sync(){
  $('stage').textContent=`${world.stage+1} / ${ROUTES.length} · ${world.route.name}`;
  $('lives').textContent='♥ '.repeat(world.lives).trim();$('lives').setAttribute('aria-label',`${world.lives} hearts remaining`);
  $('shield').textContent=world.shield?'Ready':'Empty';
  $('accuracy').textContent=`${world.records.length} / ${world.deck.length}`;
  $('charges').textContent=world.slowTime>0?`${Math.ceil(world.slowTime)}s active`:`${world.charges} charge${world.charges===1?'':'s'} · Space`;
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
function car(o,y,lane){
  const colors=['#e8a66f','#78bfd1','#f0d185','#a6b7dd'];
  const color=colors[(o.index+lane.row+world.stage)%colors.length];
  round(o.x+3,y+12,o.width-2,44,9,'#101e2980');
  round(o.x+15,y+8,18,8,3,'#0b171d');round(o.x+15,y+49,18,8,3,'#0b171d');round(o.x+o.width-33,y+8,18,8,3,'#0b171d');round(o.x+o.width-33,y+49,18,8,3,'#0b171d');
  round(o.x,y+11,o.width,42,9,color);
  const front=lane.speed>0?o.x+o.width-25:o.x+10;
  round(front,y+16,15,32,3,'#173345');round(lane.speed>0?o.x+13:o.x+o.width-27,y+17,14,30,3,'#355464');
  round(o.x+34,y+17,Math.max(15,o.width-68),30,4,color);
  round(lane.speed>0?o.x+o.width-5:o.x+1,y+17,4,9,1,'#fff0b3');round(lane.speed>0?o.x+o.width-5:o.x+1,y+38,4,9,1,'#fff0b3');
}
function platform(o,y){
  round(o.x+1,y+12,o.width,44,12,'#0e2b3980');round(o.x,y+8,o.width,45,11,'#8b603e');round(o.x+4,y+9,o.width-8,8,4,'#c49561');
  for(let i=16;i<o.width-10;i+=26){round(o.x+i,y+18,2,25,1,'#553e2d');}
  ctx.strokeStyle='#d0a575';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x+12,y+29);ctx.lineTo(o.x+o.width-14,y+29);ctx.stroke();
  circle(o.x+13,y+31,7,'#ab7c50');circle(o.x+13,y+31,3,'#725033');
}
function frog(x,y){
  let hop=world.hop/.11;if(reduced)hop=0;
  const lift=Math.sin(hop*Math.PI)*8;
  y-=lift;
  ctx.save();ctx.translate(x,y);
  ctx.globalAlpha=.3;ctx.fillStyle='#071714';ctx.beginPath();ctx.ellipse(0,17+lift,21,7,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(world.shield){ctx.strokeStyle='#c4fb8a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();}
  circle(-17,13,8,'#6da452');circle(17,13,8,'#6da452');circle(-17,-6,6,'#91c761');circle(17,-6,6,'#91c761');
  ctx.fillStyle='#b5e578';ctx.beginPath();ctx.ellipse(0,4,17,20,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d6ee93';ctx.beginPath();ctx.ellipse(0,9,10,12,0,0,Math.PI*2);ctx.fill();
  circle(-10,-14,9,'#b5e578');circle(10,-14,9,'#b5e578');circle(-10,-16,6,'#eff4de');circle(10,-16,6,'#eff4de');circle(-9,-18,3,'#172d25');circle(11,-18,3,'#172d25');
  ctx.strokeStyle='#416137';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-7,8,.2,Math.PI-.2);ctx.stroke();ctx.restore();
}
function bankRow(row,title,active){
  const y=row*CELL;ctx.fillStyle=world.stage===2?'#345361':'#3d634d';ctx.fillRect(0,y,WIDTH,CELL);
  ctx.fillStyle='#ffffff08';ctx.fillRect(0,y,WIDTH,4);ctx.fillStyle='#061d2440';ctx.fillRect(0,y+60,WIDTH,4);
  for(let i=0;i<14;i++){const x=i*CELL+15;ctx.fillStyle='#b0d48b45';ctx.fillRect(x,y+14,3,8);ctx.fillRect(x+6,y+11,3,10);if(i%3===0){circle(x+18,y+42,3,world.route.accent);circle(x+23,y+39,2,'#edf1b9');}}
  const w=title.length*8.5+28;round(WIDTH/2-w/2,y+18,w,29,14,active?'#173c32':'#233e37');label(title,WIDTH/2,y+38,active?'#d3efa5':'#bfd2c8',13);
  if(row===0){for(const x of [WIDTH/2-165,WIDTH/2+165]){round(x,y+14,4,34,1,'#cee0df');ctx.fillStyle=world.route.accent;ctx.beginPath();ctx.moveTo(x+4,y+14);ctx.lineTo(x+27,y+22);ctx.lineTo(x+4,y+29);ctx.fill();}}
}
function draw(){
  if(!world)return;ctx.clearRect(0,0,WIDTH,HEIGHT);
  for(let row=0;row<9;row++){
    const y=row*CELL,lane=world.route.lanes.find(l=>l.row===row);
    if(!lane){bankRow(row,row===8?'START':row===4?(world.checkpoint===4?'CHECKPOINT SAVED':'ISLAND · 2 QUESTIONS'):'FINISH · 2 QUESTIONS',row===4&&world.checkpoint===4);continue;}
    ctx.fillStyle=lane.type==='road'?world.route.road:world.route.water;ctx.fillRect(0,y,WIDTH,CELL);
    if(lane.type==='road'){
      ctx.fillStyle='#b6c0c430';for(let x=15;x<WIDTH;x+=82)ctx.fillRect(x,y+1,38,2);
      label(lane.speed>0?'›':'‹',20,y+37,'#aebec457',24);
      world.objects(lane).forEach(o=>car(o,y,lane));
    }else{
      ctx.strokeStyle='#a8e5e51c';ctx.lineWidth=2;const drift=reduced?0:(world.time*lane.speed*.35)%100;
      for(let j=0;j<2;j++)for(let x=-100;x<WIDTH+100;x+=100){ctx.beginPath();ctx.moveTo(x+drift,y+14+j*32);ctx.quadraticCurveTo(x+17+drift,y+8+j*32,x+38+drift,y+14+j*32);ctx.stroke();}
      world.objects(lane).forEach(o=>platform(o,y));
    }
  }
  if(world.slowTime>0){ctx.fillStyle='#b6f4ff0b';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.strokeStyle='#a0e8f3';ctx.lineWidth=4;ctx.strokeRect(2,2,WIDTH-4,HEIGHT-4);}
  let x=world.player.x,y=world.player.row*CELL+CELL/2;
  if(world.hop>0&&!reduced){const t=1-world.hop/.11;const ease=1-(1-t)**2;x=world.from.x+(x-world.from.x)*ease;y=world.from.row*CELL+CELL/2+(y-world.from.row*CELL-CELL/2)*ease;}
  if(world.invulnerable>0&&world.state==='playing'&&!reduced){ctx.globalAlpha=.6+Math.sin(world.invulnerable*20)*.25;}
  frog(x,y);ctx.globalAlpha=1;
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
