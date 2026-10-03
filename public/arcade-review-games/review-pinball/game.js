import {PinballPhysics} from './physics.js';
import {renderTable} from './renderer.js';
import {CircuitRush} from './scoring.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
const renderScale=Math.min(2,window.devicePixelRatio||1);canvas.width=520*renderScale;canvas.height=820*renderScale;
const sets=[{id:'science',name:'Scientific Method',url:'../territory-takedown/questions.js'},{id:'french',name:'French Revolution',url:'../territory-takedown/french-revolution/questions.js'}];
let engine,state='setup',score=0,ballCount=1,lit=new Set(),multiplier=1,savedUntil=0,mode='classic',questions=[],queue=[],qIndex=0,correct=0,attempts=0,earned=0,current=null,answered=false,sound=false,audio=null,flash=[],last=0,acc=0,pausedFrom='playing',selectedSet='';
const overlay=$('overlay'),panel=$('panel');
let rampShots=0,lastShot=null,rush=new CircuitRush(),rushSecond=-1;
const heldKeys=new Set(),touchHeld=new Set();
function syncKeys(){engine.keys.left=state==='playing'&&(touchHeld.has('left')||heldKeys.has('a')||heldKeys.has('arrowleft'));engine.keys.right=state==='playing'&&(touchHeld.has('right')||heldKeys.has('d')||heldKeys.has('arrowright'));}
function clearKeys(){heldKeys.clear();touchHeld.clear();engine.keys.left=engine.keys.right=false;}
const shotInfo=document.createElement('p');shotInfo.className='shot-info';$('mission').after(shotInfo);
const rushInfo=document.createElement('p');rushInfo.className='shot-info';shotInfo.after(rushInfo);
function shotHud(){shotInfo.textContent=`Skyline ramps: ${rampShots%3}/3. Third ramp: 2,000 bonus. Ramp + loop within 8 seconds: 1,000 combo.`;const seconds=Math.ceil(rush.remaining(engine.time));rushSecond=seconds; rushInfo.textContent=seconds>0?`CIRCUIT RUSH · Double shot points · ${seconds}s left`:`Circuit Rush: ramp, loop + spinner (${rush.shots.size}/3) unlock 15 seconds of double shot points.`;}
function tableHit(id,value){
 const shotFactor=rush.factor(engine.time);
 hit(id,value);
 const activated=rush.record(id,engine.time);
 if(id==='ramp'||id==='orbit'){
  let bonus=0,message=id==='ramp'?'Skyline ramp! +750':'Loop complete! +500';
  if(id==='ramp'){rampShots++;if(rampShots%3===0){bonus+=2000;message='SKYLINE BONUS! +2,000';}}
  if(lastShot && lastShot.id!==id && engine.time-lastShot.time<=8){bonus+=1000;message+=' · COMBO +1,000';lastShot=null;}else lastShot={id,time:engine.time};
  score+=bonus*multiplier;$('status').textContent=message;shotHud();hud();beep(900,.15);
 }
 if(id==='spinner'){$('status').textContent='Turbine hit! +'+value*multiplier*shotFactor;flash[flash.length-1].points=value*multiplier*shotFactor;}
 if(activated){$('status').textContent='CIRCUIT RUSH! Double shot points for 15 seconds.';beep(1100,.2);}
 shotHud();
}
function show(html){overlay.hidden=false;panel.innerHTML=html;panel.querySelector('button,select')?.focus();}
function hide(){overlay.hidden=true;document.activeElement?.blur();}
function beep(freq=500,duration=.06){if(!sound)return;audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.09,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function hud(){ $('score').textContent=score.toLocaleString();$('ball-count').textContent=ballCount;$('multiplier').textContent='×'+multiplier;[...$('target-lights').children].forEach((el,i)=>el.classList.toggle('lit',lit.has(i)));$('mission').textContent=lit.size===4?'Jackpot lit! Hit a bumper to collect.':'Hit all four bank targets.';}
function setup(){state='setup';engine=new PinballPhysics();show(`<div class="eyebrow">NEON CIRCUIT</div><h2>Review Pinball</h2><p>Your first ball is free. After it drains, answer two questions correctly to earn another.</p><label for="mode">1. Choose a mode</label><select id="mode"><option value="classic">Classic — standard flippers</option><option value="assist">Assisted — wider flippers, longer ball saver</option></select><label for="question-set">2. Choose a question set</label><select id="question-set">${sets.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select><button class="primary" id="start">Play pinball</button>`);$('start').onclick=start;}
async function start(){const btn=$('start');btn.disabled=true;btn.textContent='Loading questions…';mode=$('mode').value;const set=sets.find(s=>s.id===$('question-set').value);selectedSet=set.name;
 try{const bank=await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=set.url;script.onload=()=>{resolve(window.TT_QUESTION_SET);script.remove();};script.onerror=()=>{script.remove();reject(new Error('Question set could not be loaded.'));};document.head.append(script);});questions=bank.questions.map(q=>({id:q.id,prompt:q.prompt ?? q.question,choices:q.choices,answer:q.answerIndex ?? q.answer,explanation:q.explanation}));
 // Existing sets use normalized objects; tuple support keeps the adapter reusable.
 if(!questions[0]?.prompt)questions=bank.questions.map(q=>({id:q[0],prompt:q[1],choices:q[2],answer:q[3],explanation:''}));
 if(!questions.length||questions.some(q=>!q.prompt||!Array.isArray(q.choices)||!Number.isInteger(q.answer)))throw new Error('Invalid question set.');
 score=0;ballCount=1;lit.clear();multiplier=1;rampShots=0;lastShot=null;rush=new CircuitRush();correct=0;attempts=0;queue=[];qIndex=0;flash=[];engine=new PinballPhysics({assist:mode==='assist',onHit:tableHit,onDrain:drain});shotHud();hud();hide();ready();
 }catch(err){btn.disabled=false;btn.textContent='Try again';const p=document.createElement('p');p.textContent=err.message;panel.append(p);}}
function ready(){state='ready';engine.ball={x:460,y:748,vx:0,vy:0,r:10};$('status').textContent='Ready! Press Space or Launch.';$('launch').disabled=false;}
function launch(){if(state!=='ready')return;hide();state='playing';engine.launch();savedUntil=engine.time+(mode==='assist'?12:7);$('status').textContent='Ball saver active';beep(360,.15);}
function hit(id,value){score+=value*multiplier*rush.factor(engine.time);if(id.startsWith('target'))lit.add(Number(id.slice(6)));if(lit.size===4&&id.startsWith('bumper')){const jackpot=2500*multiplier;score+=jackpot;lit.clear();multiplier=Math.min(5,multiplier+1);$('status').textContent='JACKPOT! +'+jackpot.toLocaleString();beep(1000,.2);}else if(id==='orbit'){$('status').textContent='Loop shot! +'+500*multiplier;}else if(id.startsWith('target')){$('status').textContent='Target lit — '+lit.size+' / 4';}beep(id.startsWith('bumper')?650:420);flash.push({id,t:engine.time});hud();}
function drain(){lastShot=null;clearKeys();if(engine.time<savedUntil){engine.launch();$('status').textContent='Ball saved! Keep playing.';return;}rush.drain();shotHud();state='review';earned=0;$('status').textContent='Earn another ball: two correct answers.';nextQuestion();}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function nextQuestion(){if(qIndex>=queue.length){queue=shuffle([...questions]);qIndex=0;}current=queue[qIndex++];answered=false;show(`<div class="eyebrow">EARN YOUR NEXT BALL · ${earned}/2 CORRECT</div><h2 id="question"></h2><div class="answers" id="answers"></div><div id="feedback" role="status"></div><button id="continue" class="primary" hidden>Next question</button>`);$('question').textContent=current.prompt;current.choices.forEach((text,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${text}`;b.onclick=()=>answer(i);$('answers').append(b);});$('continue').onclick=()=>{if(earned>=2){ballCount++;hud();hide();ready();launch();}else nextQuestion();};$('answers').firstChild.focus();}
function answer(i){if(state!=='review'||answered)return;answered=true;attempts++;const right=i===current.answer;if(right){correct++;earned++;beep(850,.15);}else beep(190,.15);[...$('answers').children].forEach((b,n)=>{b.disabled=true;if(n===current.answer)b.classList.add('correct');else if(n===i)b.classList.add('wrong');});$('feedback').textContent=(right?'Correct!':`Correct answer: ${current.choices[current.answer]}.`)+(current.explanation?' '+current.explanation:'');$('continue').hidden=false;$('continue').textContent=earned>=2?'Ball earned — launch!':'Next question';$('continue').focus();}
function pause(){if(!['playing','ready','paused'].includes(state))return;if(state==='paused'){state=pausedFrom;hide();$('pause').textContent='Pause';last=performance.now();acc=0;return;}pausedFrom=state;state='paused';clearKeys();$('pause').textContent='Resume';show('<h2>Paused</h2><p>Your ball is waiting.</p><button id="resume" class="primary">Resume game</button>');$('resume').onclick=pause;}
function end(){if(state==='setup'||state==='ended')return;state='ended';clearKeys();$('pause').textContent='Pause';show(`<div class="eyebrow">SESSION COMPLETE</div><h2>${score.toLocaleString()} points</h2><p>${ballCount} ball${ballCount===1?'':'s'} played<br>${correct} of ${attempts} review answers correct${attempts?' · '+Math.round(correct/attempts*100)+'%':''}</p><p id="session-set"></p><button class="primary" id="again">Choose a new game</button>`);$('session-set').textContent=selectedSet;$('again').onclick=setup;}
$('launch').onclick=launch;$('pause').onclick=pause;$('end').onclick=end;
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));beep();};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('status').textContent='Full screen is unavailable in this browser.';}};
for(const [id,key] of [['left','left'],['right','right']]){const b=$(id);b.onpointerdown=e=>{e.preventDefault();if(state==='playing'){b.setPointerCapture(e.pointerId);touchHeld.add(key);syncKeys();beep(220,.025);}};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{touchHeld.delete(key);syncKeys();};}
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(state==='review'){if(answered)return;if(['arrowdown','arrowright','arrowup','arrowleft'].includes(key)){e.preventDefault();const buttons=[...$('answers').children],i=buttons.indexOf(document.activeElement);buttons[(Math.max(0,i)+(['arrowdown','arrowright'].includes(key)?1:buttons.length-1))%buttons.length].focus();}else if(/^[1-4]$/.test(key)){e.preventDefault();answer(Number(key)-1);}return;}if(!['playing','ready','paused'].includes(state))return;if(['arrowleft','arrowright','a','d',' ','p'].includes(key))e.preventDefault();if(key==='p'&&!e.repeat){pause();return;}if(key===' '&&!e.repeat)launch();if(state==='playing'){if(['arrowleft','arrowright','a','d'].includes(key)){heldKeys.add(key);syncKeys();}}});
window.addEventListener('keyup',e=>{heldKeys.delete(e.key.toLowerCase());syncKeys();});window.addEventListener('blur',()=>{clearKeys();if(state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
function draw(){renderTable(ctx,engine,{state,lit,multiplier,savedUntil,flash,rush});flash=flash.filter(f=>engine.time-f.t<1.2);}
let stillFrame='';
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(state==='playing'){acc+=dt;while(acc>=1/240){engine.step(1/240);acc-=1/240;if(state!=='playing')break;}if(Math.ceil(rush.remaining(engine.time))!==rushSecond)shotHud();}else acc=0;
 const signature=`${state}:${score}:${ballCount}:${multiplier}`;if(state==='playing'||signature!==stillFrame){draw();stillFrame=signature;}requestAnimationFrame(frame);}
setup();requestAnimationFrame(frame);
