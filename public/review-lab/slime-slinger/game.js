import {setsForGame,loadQuestionSet} from '../catalog.js';
import {enhanceTopicPicker} from '../topic-picker.js';
import {prepareQuestionDeck} from '../question-decks.js';

const $=id=>document.getElementById(id);
const canvas=$('stage'),ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height;
const sets=setsForGame('slime-slinger');
const overlay=$('overlay'),panel=$('panel');
const laneConfig=[
  {name:'FAR',y:225,scale:.58,points:350,speed:[115,175],color:'#ffcf58'},
  {name:'MID',y:330,scale:.78,points:225,speed:[85,135],color:'#53dcff'},
  {name:'NEAR',y:455,scale:1,points:125,speed:[58,95],color:'#82ff58'}
];

let state='setup',bank=null,deck=[],deckIndex=0,current=null,answered=false,topicPicker=null;
let ammo=0,score=0,hits=0,attempts=0,correct=0,preloadAsked=0,preloadGoal=5;
let duration=180,remaining=180,endAt=0,timerId=null,selectedSet='';
let aimX=W/2,aimLane=2,targets=[],projectiles=[],splats=[],particles=[],lastFrame=performance.now();
let keys=new Set(),questionOrigin='preload',sound=false,audio=null,calloutTimer=null;

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function rand(a,b){return a+Math.random()*(b-a);}
function showPanel(html){overlay.hidden=false;panel.innerHTML=html;panel.querySelector('button,select')?.focus();}
function hidePanel(){overlay.hidden=true;canvas.focus();}
function formatTime(seconds){seconds=Math.max(0,Math.ceil(seconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function setStatus(text){$('status').textContent=text;}
function beep(freq=520,d=.06){if(!sound)return;audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function hud(){
  $('time').textContent=formatTime(remaining);$('score').textContent=score.toLocaleString();$('ammo').textContent=ammo;$('hits').textContent=hits;
  const playable=state==='playing';$('throw').disabled=!playable||ammo<=0;$('questions').disabled=!playable;
  $('empty-ammo').hidden=!playable||ammo>0;
  document.querySelectorAll('[data-lane]').forEach(b=>b.classList.toggle('active',Number(b.dataset.lane)===aimLane));
}
function announce(text){$('callout').textContent=text;$('callout').classList.add('show');clearTimeout(calloutTimer);calloutTimer=setTimeout(()=>$('callout').classList.remove('show'),700);}

function setup(){
  stopTimer();state='setup';ammo=score=hits=attempts=correct=preloadAsked=0;remaining=duration;targets=[];projectiles=[];splats=[];particles=[];hud();
  showPanel(`<p class="eyebrow">REVIEW LAB · NEW ENGINE</p><h2 id="panel-title">Slime Slinger</h2><p>Answer five load-up questions. Every correct answer earns one slime ball. Then hit moving targets before time runs out. You can answer more questions at any time during the round.</p><div class="rules"><div><strong>Near · 125</strong><span>Large & slower</span></div><div><strong>Mid · 225</strong><span>Smaller & quicker</span></div><div><strong>Far · 350</strong><span>Small & fast</span></div></div><label for="question-set">Review topic</label><select id="question-set">${sets.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select><label for="duration">Round length</label><select id="duration"><option value="120">2 minutes</option><option value="180" selected>3 minutes</option><option value="300">5 minutes</option></select><button class="primary" id="start-load">Load up with questions</button>`);
  const preset=new URLSearchParams(location.search).get('set');if(sets.some(s=>s.id===preset))$('question-set').value=preset;
  topicPicker=enhanceTopicPicker($('question-set'),sets);$('start-load').onclick=beginLoad;
  setStatus('Choose a topic to start.');
}
async function beginLoad(){
  const button=$('start-load');button.disabled=true;button.textContent='Loading questions…';topicPicker.setDisabled(true);
  try{
    const selected=sets.find(s=>s.id===$('question-set').value);selectedSet=selected.title;duration=Number($('duration').value);remaining=duration;bank=await loadQuestionSet(selected.id);deck=[];deckIndex=0;ammo=0;preloadAsked=0;state='preload';hud();nextQuestion('preload');
  }catch(err){button.disabled=false;button.textContent='Try again';topicPicker.setDisabled(false);const p=document.createElement('p');p.textContent=err.message;panel.append(p);}
}
function freshQuestion(){if(deckIndex>=deck.length){deck=prepareQuestionDeck(bank);deckIndex=0;}return deck[deckIndex++];}
function nextQuestion(origin='playing'){
  questionOrigin=origin;current=freshQuestion();answered=false;if(origin==='preload')preloadAsked++;
  const heading=origin==='preload'?`LOAD UP · ${preloadAsked} / ${preloadGoal}`:'EARN MORE SLIME';
  const clockNote=origin==='playing'?`<p><strong>The round clock is still running.</strong> One correct answer = one slime ball.</p>`:'<p>Every correct answer earns one slime ball. Your round clock has not started yet.</p>';
  showPanel(`<p class="eyebrow">${heading}</p><h2 id="panel-title"></h2>${clockNote}<div class="load-meter"><span>Slime ready</span><strong>● ${ammo}</strong></div><div class="answers" id="answers"></div><p class="feedback" id="feedback" role="status"></p><button class="primary" id="continue" hidden></button>${origin==='playing'?'<button class="secondary" id="back-arena">Back to arena</button>':''}`);
  $('panel-title').textContent=current.question;
  current.choices.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1}. ${text}`;b.onclick=()=>answer(i);$('answers').append(b);});
  if(origin==='playing')$('back-arena').onclick=()=>{hidePanel();state='playing';hud();setStatus(ammo?`${ammo} slime ready. Pick a depth and line up a target.`:'No slime left. Answer a question to reload.');};
  $('answers').firstElementChild?.focus();
}
function answer(index){
  if(answered||!current)return;answered=true;attempts++;const right=index===current.answer;if(right){correct++;ammo++;beep(880,.12);}else beep(185,.12);
  [...$('answers').children].forEach((b,i)=>{b.disabled=true;if(i===current.answer)b.classList.add('correct');else if(i===index)b.classList.add('wrong');});
  $('feedback').textContent=(right?'Correct — +1 slime!':`Not this time. Correct answer: ${current.choices[current.answer]}.`)+(current.explanation?` ${current.explanation}`:'');
  const cont=$('continue');cont.hidden=false;
  if(questionOrigin==='preload'&&preloadAsked>=preloadGoal){cont.textContent=`Start ${formatTime(duration)} round with ${ammo} slime`;cont.onclick=startRound;}
  else if(questionOrigin==='preload'){cont.textContent='Next load-up question';cont.onclick=()=>nextQuestion('preload');}
  else{cont.textContent='Answer another question';cont.onclick=()=>{if(remaining<=0)endRound();else nextQuestion('playing');};}
  const meter=panel.querySelector('.load-meter strong');if(meter)meter.textContent=`● ${ammo}`;hud();cont.focus();
}
function startRound(){
  hidePanel();state='playing';remaining=duration;endAt=performance.now()+duration*1000;spawnTargets();startTimer();hud();setStatus(ammo?`${ammo} slime loaded. Choose a depth, aim, and throw!`:'No slime earned yet — answer a question to load up.');
}
function startTimer(){stopTimer();timerId=setInterval(()=>{if(state==='ended'||!endAt)return;remaining=Math.max(0,(endAt-performance.now())/1000);hud();if(remaining<=0)endRound();},100);}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
function endRound(){
  if(state==='ended'||state==='setup')return;remaining=0;stopTimer();state='ended';hud();keys.clear();
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  showPanel(`<p class="eyebrow">ROUND COMPLETE</p><h2 id="panel-title">${score.toLocaleString()} points</h2><p>${hits} target${hits===1?'':'s'} hit · ${correct}/${attempts} review answers correct${attempts?` · ${accuracy}%`:''}</p><div class="rules"><div><strong>${selectedSet}</strong><span>Review topic</span></div><div><strong>${hits}</strong><span>Targets hit</span></div><div><strong>${ammo}</strong><span>Slime left</span></div></div><button class="primary" id="again">Play again</button><a class="secondary" style="display:block;text-align:center;text-decoration:none" href="/review-lab/">Back to Review Lab</a>`);$('again').onclick=setup;setStatus(`Round complete — ${score.toLocaleString()} points.`);
}

function spawnTargets(){
  targets=[];laneConfig.forEach((lane,laneIndex)=>{
    const count=laneIndex===0?3:laneIndex===1?3:2;
    for(let i=0;i<count;i++)targets.push(makeTarget(laneIndex,i));
  });
}
function makeTarget(lane,index){
  const c=laneConfig[lane],dir=Math.random()<.5?-1:1,base=56*c.scale;
  return {lane,x:rand(base,W-base),y:c.y+rand(-12,12),vx:dir*rand(...c.speed),r:base*(lane===2?1.05:1),phase:rand(0,Math.PI*2),variant:(lane+index)%3,blink:rand(0,5)};
}
function updateTargets(dt,t){
  for(const target of targets){const c=laneConfig[target.lane],pad=target.r*.8;target.x+=target.vx*dt;target.y=c.y+Math.sin(t*1.7+target.phase)*(target.lane===0?8:12);if(target.x<pad){target.x=pad;target.vx=Math.abs(target.vx);}if(target.x>W-pad){target.x=W-pad;target.vx=-Math.abs(target.vx);}target.blink-=dt;if(target.blink<0)target.blink=rand(2.5,5);}
}
function throwSlime(){
  if(state!=='playing')return;if(ammo<=0){setStatus('Out of slime — answer a question to reload.');$('empty-ammo').hidden=false;beep(160,.08);return;}
  ammo--;const c=laneConfig[aimLane],start={x:W/2,y:H-48},end={x:aimX,y:c.y};projectiles.push({lane:aimLane,start,end,t:0,duration:.34+.11*(2-aimLane)});beep(330,.05);hud();setStatus(`${ammo} slime remaining.`);
}
function resolveThrow(p){
  const candidates=targets.filter(t=>t.lane===p.lane).sort((a,b)=>Math.abs(a.x-p.end.x)-Math.abs(b.x-p.end.x));const hit=candidates[0];
  const forgiveness=hit?hit.r*1.05+18:0;
  if(hit&&Math.abs(hit.x-p.end.x)<=forgiveness){
    const lane=laneConfig[hit.lane];score+=lane.points;hits++;splats.push({x:hit.x,y:hit.y,r:hit.r*1.1,t:0,lane:hit.lane});for(let i=0;i<12;i++)particles.push({x:hit.x,y:hit.y,vx:rand(-120,120),vy:rand(-150,40),life:rand(.35,.7),age:0,r:rand(3,8)});announce(`SPLAT! +${lane.points}`);beep(760+hit.lane*80,.09);Object.assign(hit,makeTarget(hit.lane,Math.floor(Math.random()*3)));hit.x=hit.vx>0?-hit.r:W+hit.r;
  }else{announce('MISS');beep(210,.05);}
  hud();
}
function updateEffects(dt){
  projectiles.forEach(p=>p.t+=dt);for(const p of projectiles.filter(p=>p.t>=p.duration&&!p.done)){p.done=true;resolveThrow(p);}projectiles=projectiles.filter(p=>p.t<p.duration+.03);
  splats.forEach(s=>s.t+=dt);splats=splats.filter(s=>s.t<.55);
  particles.forEach(p=>{p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;});particles=particles.filter(p=>p.age<p.life);
}
function keyboardAim(dt){if(state!=='playing')return;const speed=430;if(keys.has('arrowleft')||keys.has('a'))aimX-=speed*dt;if(keys.has('arrowright')||keys.has('d'))aimX+=speed*dt;aimX=clamp(aimX,35,W-35);}
function changeLane(delta){if(state!=='playing')return;aimLane=clamp(aimLane+delta,0,2);hud();setStatus(`${laneConfig[aimLane].name.toLowerCase()} targets · ${laneConfig[aimLane].points} points each.`);}
function aimAndThrowFromPointer(e){if(state!=='playing')return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*W,y=(e.clientY-rect.top)/rect.height*H;aimX=clamp(x,30,W-30);aimLane=laneConfig.reduce((best,lane,i)=>Math.abs(lane.y-y)<Math.abs(laneConfig[best].y-y)?i:best,0);hud();throwSlime();}

function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function drawScene(t){
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#285c82');sky.addColorStop(.5,'#7ccbd8');sky.addColorStop(.501,'#365938');sky.addColorStop(1,'#162a1b');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#eaf5db';ctx.beginPath();ctx.arc(790,82,45,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6d9ab0';for(let i=0;i<8;i++){const x=i*155-70;ctx.beginPath();ctx.moveTo(x,245);ctx.lineTo(x+90,105+(i%3)*24);ctx.lineTo(x+185,245);ctx.fill();}
  ctx.fillStyle='#315f3b';ctx.fillRect(0,247,W,353);
  laneConfig.forEach((lane,i)=>{ctx.save();ctx.globalAlpha=.22;ctx.fillStyle=i===0?'#fff0ac':i===1?'#b3efff':'#c5ffad';ctx.fillRect(0,lane.y+45,W,3);ctx.restore();ctx.font='800 16px system-ui';ctx.fillStyle='#ffffffaa';ctx.fillText(`${lane.name} · ${lane.points}`,18,lane.y+37);});
  ctx.fillStyle='#1a3824';for(let x=35;x<W;x+=125){ctx.fillRect(x,170+(x%3)*12,10,80);ctx.fillStyle='#24532e';ctx.beginPath();ctx.arc(x+5,168+(x%3)*12,35,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1a3824';}
  ctx.fillStyle='#173049';ctx.fillRect(0,520,W,80);ctx.fillStyle='#214966';ctx.fillRect(0,520,W,7);
  drawTargets(t);drawCrosshair();drawEffects();
}
function drawTargets(t){
  const ordered=[...targets].sort((a,b)=>a.lane-b.lane);for(const target of ordered){const c=laneConfig[target.lane],r=target.r;ctx.save();ctx.translate(target.x,target.y);ctx.globalAlpha=.25;ctx.fillStyle='#001015';ctx.beginPath();ctx.ellipse(4,r*.68,r*.75,r*.2,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    if(target.variant===0){ctx.fillStyle=c.color;roundRect(-r*.72,-r*.76,r*1.44,r*1.42,r*.35);ctx.fill();ctx.fillStyle='#0a2832';ctx.fillRect(-r*.47,-r*.18,r*.94,r*.4);ctx.fillStyle='#dffcff';ctx.beginPath();ctx.arc(-r*.22,-r*.02,r*.11,0,Math.PI*2);ctx.arc(r*.22,-r*.02,r*.11,0,Math.PI*2);ctx.fill();}
    else if(target.variant===1){ctx.fillStyle=c.color;ctx.beginPath();ctx.arc(0,-r*.06,r*.72,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0d2a32';ctx.beginPath();ctx.arc(-r*.22,-r*.14,r*.1,0,Math.PI*2);ctx.arc(r*.22,-r*.14,r*.1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0d2a32';ctx.lineWidth=Math.max(3,r*.07);ctx.beginPath();ctx.arc(0,r*.05,r*.28,.2,Math.PI-.2);ctx.stroke();}
    else{ctx.fillStyle=c.color;ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.75,r*.62);ctx.lineTo(-r*.75,r*.62);ctx.closePath();ctx.fill();ctx.fillStyle='#0d2a32';ctx.beginPath();ctx.arc(0,r*.05,r*.18,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#ffffffbb';ctx.lineWidth=Math.max(2,r*.045);ctx.stroke();ctx.restore();}
}
function drawCrosshair(){const c=laneConfig[aimLane];ctx.save();ctx.translate(aimX,c.y);ctx.strokeStyle='#f7ffff';ctx.lineWidth=3;ctx.shadowColor='#0b1a25';ctx.shadowBlur=6;ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.moveTo(-40,0);ctx.lineTo(-15,0);ctx.moveTo(15,0);ctx.lineTo(40,0);ctx.moveTo(0,-40);ctx.lineTo(0,-15);ctx.moveTo(0,15);ctx.lineTo(0,40);ctx.stroke();ctx.fillStyle='#f7ffff';ctx.beginPath();ctx.arc(0,0,3.5,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawEffects(){
  for(const p of projectiles){const n=clamp(p.t/p.duration,0,1),ease=1-Math.pow(1-n,2),x=p.start.x+(p.end.x-p.start.x)*ease,base=p.start.y+(p.end.y-p.start.y)*ease,y=base-Math.sin(Math.PI*n)*(135+60*(2-p.lane)),r=18-(2-p.lane)*3*n;ctx.fillStyle='#74ff4e';ctx.shadowColor='#8bff58';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  for(const s of splats){ctx.save();ctx.globalAlpha=1-s.t/.55;ctx.fillStyle='#6aff4c';ctx.translate(s.x,s.y);ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?s.r*.65:s.r*1.05;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();}
  for(const p of particles){ctx.save();ctx.globalAlpha=1-p.age/p.life;ctx.fillStyle='#83ff54';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function loop(now){const dt=Math.min(.04,(now-lastFrame)/1000||0);lastFrame=now;if(state==='playing'){keyboardAim(dt);updateTargets(dt,now/1000);updateEffects(dt);}else updateEffects(dt);drawScene(now/1000);requestAnimationFrame(loop);}

$('questions').onclick=()=>{if(state!=='playing')return;nextQuestion('playing');};$('earn-more').onclick=()=>{if(state==='playing')nextQuestion('playing');};$('throw').onclick=throwSlime;
document.querySelectorAll('[data-control]').forEach(b=>{let raf=null,last=0;const step=ts=>{if(!last)last=ts;const dt=(ts-last)/1000;last=ts;aimX=clamp(aimX+(b.dataset.control==='left'?-420:420)*dt,30,W-30);raf=requestAnimationFrame(step);};b.onpointerdown=e=>{e.preventDefault();if(state!=='playing')return;b.setPointerCapture(e.pointerId);last=0;raf=requestAnimationFrame(step);};const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=null;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=stop;});
document.querySelectorAll('[data-lane]').forEach(b=>b.onclick=()=>{if(state==='playing'){aimLane=Number(b.dataset.lane);hud();setStatus(`${laneConfig[aimLane].name.toLowerCase()} targets · ${laneConfig[aimLane].points} points each.`);}});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();aimAndThrowFromPointer(e);});
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!overlay.hidden&&panel.querySelector('.answers')&&!answered&&/^[1-4]$/.test(key)){e.preventDefault();answer(Number(key)-1);return;}if(state!=='playing')return;if(['arrowleft','arrowright','arrowup','arrowdown','a','d',' '].includes(key))e.preventDefault();if((key==='arrowup'||key==='w')&&!e.repeat)changeLane(-1);else if((key==='arrowdown'||key==='s')&&!e.repeat)changeLane(1);else if(key===' '&&!e.repeat)throwSlime();else keys.add(key);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));beep(560,.05);};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setStatus('Full screen is unavailable in this browser.');}};

setup();hud();requestAnimationFrame(loop);
