import {setsForGame,loadQuestionSet} from '../catalog.js';
import {enhanceTopicPicker} from '../topic-picker.js';
import {prepareQuestionDeck} from '../question-decks.js';

const $=id=>document.getElementById(id);
const canvas=$('stage'),ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height;
const sets=setsForGame('slime-slinger');
const overlay=$('overlay'),panel=$('panel');
const laneConfig=[
  {name:'FAR',y:235,scale:.58,points:350,speed:[115,175],color:'#ffcf58'},
  {name:'MID',y:350,scale:.78,points:225,speed:[85,135],color:'#53dcff'},
  {name:'NEAR',y:465,scale:1,points:125,speed:[58,95],color:'#82ff58'}
];
const targetTypes=[
  {id:'easy',label:'EASY',scale:1.22,speed:.72,multiplier:.7,color:'#94ff73',motion:'calm',weight:34},
  {id:'standard',label:'STANDARD',scale:1,speed:1,multiplier:1,color:'#53dcff',motion:'normal',weight:36},
  {id:'speed',label:'FAST',scale:.82,speed:1.55,multiplier:1.6,color:'#ff9f43',motion:'wave',weight:22},
  {id:'bonus',label:'BONUS',scale:.62,speed:1.9,multiplier:2.4,color:'#ff63e6',motion:'zigzag',weight:8}
];
const specialTypes={
  golden:{id:'golden',label:'GOLDEN',color:'#ffd84f',scale:.72,speed:1.38,value:1250,icon:'★'},
  refill:{id:'refill',label:'+2 SLIME',color:'#77ff5b',scale:.9,speed:1.08,value:150,icon:'+'},
  clock:{id:'clock',label:'+5 SEC',color:'#68d8ff',scale:.86,speed:1.18,value:200,icon:'◷'},
  decoy:{id:'decoy',label:'DECOY',color:'#ff6673',scale:.98,speed:.92,value:-250,icon:'×'}
};

let state='setup',bank=null,deck=[],deckIndex=0,current=null,answered=false,topicPicker=null;
let ammo=0,score=0,hits=0,attempts=0,correct=0,preloadAsked=0,preloadGoal=5;
let duration=180,remaining=180,endAt=0,timerId=null,selectedSet='';
let aimX=W/2,aimLane=2,targets=[],projectiles=[],splats=[],particles=[],waterSplashes=[],floatingTexts=[],lastFrame=performance.now();
let keys=new Set(),questionOrigin='preload',sound=false,audio=null,calloutTimer=null;
let recoil=0,cameraKick=0,shotGlow=0,streak=0,bestStreak=0,academicStreak=0;
let bonusRushUntil=0,nextRushAt=0,rushFlash=0,goldenHits=0,perfectLoadBonus=false;

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function rand(a,b){return a+Math.random()*(b-a);}
function showPanel(html){overlay.hidden=false;panel.innerHTML=html;panel.querySelector('button,select')?.focus();}
function hidePanel(){overlay.hidden=true;canvas.focus();}
function formatTime(seconds){seconds=Math.max(0,Math.ceil(seconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function setStatus(text){$('status').textContent=text;}
function roundPoints(n){return Math.max(50,Math.round(n/25)*25);}
function chooseTargetType(){let roll=Math.random()*targetTypes.reduce((sum,t)=>sum+t.weight,0);for(const type of targetTypes){roll-=type.weight;if(roll<=0)return type;}return targetTypes[1];}
function comboMultiplier(){if(streak>=12)return 3;if(streak>=8)return 2.5;if(streak>=5)return 2;if(streak>=3)return 1.5;return 1;}
function chooseSpecial(){
  const rush=performance.now()<bonusRushUntil;
  const roll=Math.random();
  if(roll<(rush?.16:.055))return specialTypes.golden;
  if(roll<(rush?.28:.105))return specialTypes.refill;
  if(roll<(rush?.37:.145))return specialTypes.clock;
  if(roll<(rush?.46:.185))return specialTypes.decoy;
  return null;
}
function beep(freq=520,d=.06){if(!sound)return;audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function hud(){
  $('time').textContent=formatTime(remaining);$('score').textContent=score.toLocaleString();$('ammo').textContent=ammo;$('hits').textContent=streak?`${streak} ×${comboMultiplier()}`:'0';
  const playable=state==='playing';$('throw').disabled=!playable||ammo<=0;$('questions').disabled=!playable;
  $('empty-ammo').hidden=!playable||ammo>0;
  document.querySelectorAll('[data-lane]').forEach(b=>b.classList.toggle('active',Number(b.dataset.lane)===aimLane));
}
function announce(text,durationMs=900){$('callout').textContent=text;$('callout').classList.add('show');clearTimeout(calloutTimer);calloutTimer=setTimeout(()=>$('callout').classList.remove('show'),durationMs);}
function addFloat(text,x,y,color='#fff',big=false){floatingTexts.push({text,x,y,color,age:0,life:big?1.2:.85,big});}
function rankForScore(value){if(value>=18000)return'ARCADE LEGEND';if(value>=12000)return'SLIME MASTER';if(value>=7000)return'SHARPSHOOTER';if(value>=3000)return'SPLATTER';return'ROOKIE';}

function setup(){
  stopTimer();state='setup';ammo=score=hits=attempts=correct=preloadAsked=0;remaining=duration;targets=[];projectiles=[];splats=[];particles=[];waterSplashes=[];floatingTexts=[];recoil=cameraKick=shotGlow=0;streak=bestStreak=academicStreak=goldenHits=0;bonusRushUntil=nextRushAt=rushFlash=0;perfectLoadBonus=false;hud();
  showPanel(`<p class="eyebrow">REVIEW LAB · ARCADE ENGINE</p><h2 id="panel-title">Slime Slinger</h2><p>Answer five load-up questions to earn slime, then chase points, combos, special targets, and short Bonus Rush events. Farther and faster targets are worth more — but misses break your streak.</p><div class="rules"><div><strong>Build streaks</strong><span>3+ consecutive hits unlock score multipliers</span></div><div><strong>Hunt specials</strong><span>Golden, refill, clock, and decoy targets change your strategy</span></div><div><strong>Bonus Rush</strong><span>Short high-speed bursts create big scoring chances</span></div></div><p>Academic play powers the arcade: three correct answers in a row earn a bonus slime, and a perfect five-question load-up earns an extra +2 slime.</p><label for="question-set">Review topic</label><select id="question-set">${sets.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select><label for="duration">Round length</label><select id="duration"><option value="120">2 minutes</option><option value="180" selected>3 minutes</option><option value="300">5 minutes</option></select><button class="primary" id="start-load">Load up with questions</button>`);
  const preset=new URLSearchParams(location.search).get('set');if(sets.some(s=>s.id===preset))$('question-set').value=preset;
  topicPicker=enhanceTopicPicker($('question-set'),sets);$('start-load').onclick=beginLoad;
  setStatus('Choose a topic to start.');
}
async function beginLoad(){
  const button=$('start-load');button.disabled=true;button.textContent='Loading questions…';topicPicker.setDisabled(true);
  try{
    const selected=sets.find(s=>s.id===$('question-set').value);selectedSet=selected.title;duration=Number($('duration').value);remaining=duration;bank=await loadQuestionSet(selected.id);deck=[];deckIndex=0;ammo=0;preloadAsked=0;academicStreak=0;perfectLoadBonus=false;state='preload';hud();nextQuestion('preload');
  }catch(err){button.disabled=false;button.textContent='Try again';topicPicker.setDisabled(false);const p=document.createElement('p');p.textContent=err.message;panel.append(p);}
}
function freshQuestion(){if(deckIndex>=deck.length){deck=prepareQuestionDeck(bank);deckIndex=0;}return deck[deckIndex++];}
function nextQuestion(origin='playing'){
  questionOrigin=origin;current=freshQuestion();answered=false;if(origin==='preload')preloadAsked++;
  const heading=origin==='preload'?`LOAD UP · ${preloadAsked} / ${preloadGoal}`:'EARN MORE SLIME';
  const clockNote=origin==='playing'?`<p><strong>The round clock is still running.</strong> Correct answers earn slime; every third correct answer in a row earns one bonus slime.</p>`:'<p>Correct answers earn slime. Build a three-answer academic streak for bonus ammo.</p>';
  showPanel(`<p class="eyebrow">${heading}</p><h2 id="panel-title"></h2>${clockNote}<div class="load-meter"><span>Slime ready</span><strong>● ${ammo}</strong></div><div class="answers" id="answers"></div><p class="feedback" id="feedback" role="status"></p><button class="primary" id="continue" hidden></button>${origin==='playing'?'<button class="secondary" id="back-arena">Back to arena</button>':''}`);
  $('panel-title').textContent=current.question;
  current.choices.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1}. ${text}`;b.onclick=()=>answer(i);$('answers').append(b);});
  if(origin==='playing')$('back-arena').onclick=()=>{hidePanel();state='playing';hud();setStatus(ammo?`${ammo} slime ready. Protect your streak and hunt special targets.`:'No slime left. Answer a question to reload.');};
  $('answers').firstElementChild?.focus();
}
function answer(index){
  if(answered||!current)return;answered=true;attempts++;const right=index===current.answer;let earned=0,bonus=0;
  if(right){correct++;academicStreak++;earned=1;ammo++;if(academicStreak%3===0){bonus=1;ammo++;}beep(880,.12);}else{academicStreak=0;beep(185,.12);}
  if(questionOrigin==='preload'&&preloadAsked>=preloadGoal&&right&&correct===preloadGoal&&!perfectLoadBonus){perfectLoadBonus=true;ammo+=2;bonus+=2;}
  [...$('answers').children].forEach((b,i)=>{b.disabled=true;if(i===current.answer)b.classList.add('correct');else if(i===index)b.classList.add('wrong');});
  const reward=right?`Correct — +${earned} slime${bonus?` +${bonus} bonus slime!`:'!'}`:`Not this time. Correct answer: ${current.choices[current.answer]}.`;
  $('feedback').textContent=reward+(current.explanation?` ${current.explanation}`:'');
  const cont=$('continue');cont.hidden=false;
  if(questionOrigin==='preload'&&preloadAsked>=preloadGoal){cont.textContent=`Start ${formatTime(duration)} round with ${ammo} slime`;cont.onclick=startRound;}
  else if(questionOrigin==='preload'){cont.textContent='Next load-up question';cont.onclick=()=>nextQuestion('preload');}
  else{cont.textContent='Answer another question';cont.onclick=()=>{if(remaining<=0)endRound();else nextQuestion('playing');};}
  const meter=panel.querySelector('.load-meter strong');if(meter)meter.textContent=`● ${ammo}`;hud();cont.focus();
}
function startRound(){
  hidePanel();state='playing';remaining=duration;endAt=performance.now()+duration*1000;nextRushAt=performance.now()+rand(26000,39000);bonusRushUntil=0;spawnTargets();startTimer();hud();announce('READY • AIM • SPLAT!',1200);setStatus(ammo?`${ammo} slime loaded. Build a streak and watch for special targets.`:'No slime earned yet — answer a question to load up.');
}
function startTimer(){stopTimer();timerId=setInterval(()=>{if(state==='ended'||!endAt)return;remaining=Math.max(0,(endAt-performance.now())/1000);hud();if(remaining<=0)endRound();},100);}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
function endRound(){
  if(state==='ended'||state==='setup')return;remaining=0;stopTimer();state='ended';hud();keys.clear();
  const accuracy=attempts?Math.round(correct/attempts*100):0,rank=rankForScore(score),key='teachArcadeSlimeSlingerBest';const previousBest=Number(localStorage.getItem(key)||0),newBest=score>previousBest;if(newBest)localStorage.setItem(key,String(score));const best=Math.max(score,previousBest);
  showPanel(`<p class="eyebrow">ROUND COMPLETE</p><h2 id="panel-title">${score.toLocaleString()} points</h2><p><strong>${rank}</strong>${newBest?' · NEW HIGH SCORE!':''}</p><div class="rules"><div><strong>${hits}</strong><span>Targets hit</span></div><div><strong>${bestStreak}</strong><span>Best streak</span></div><div><strong>${accuracy}%</strong><span>Academic accuracy</span></div></div><div class="rules"><div><strong>${goldenHits}</strong><span>Golden targets</span></div><div><strong>${best.toLocaleString()}</strong><span>Best score</span></div><div><strong>${ammo}</strong><span>Slime left</span></div></div><p>${selectedSet} · ${correct}/${attempts} review answers correct.</p><button class="primary" id="again">Play again</button><a class="secondary" style="display:block;text-align:center;text-decoration:none" href="/review-lab/">Back to Review Lab</a>`);$('again').onclick=setup;setStatus(`Round complete — ${score.toLocaleString()} points · ${rank}.`);
}

function spawnTargets(){targets=[];laneConfig.forEach((lane,laneIndex)=>{const count=laneIndex===0?3:laneIndex===1?3:2;for(let i=0;i<count;i++)targets.push(makeTarget(laneIndex,i));});}
function makeTarget(lane,index){
  const c=laneConfig[lane],special=chooseSpecial(),type=chooseTargetType(),dir=Math.random()<.5?-1:1,scale=(special?.scale||1),speedMult=(special?.speed||1),base=56*c.scale*type.scale*scale,speed=rand(...c.speed)*type.speed*speedMult;
  const value=special?special.value:roundPoints(c.points*type.multiplier);
  return {lane,type,special,x:rand(base,W-base),y:c.y+rand(-12,12),vx:dir*speed,r:base*(lane===2?1.05:1),phase:rand(0,Math.PI*2),variant:(lane+index)%3,blink:rand(0,5),value,spawnAge:0,hitTime:0,hitKick:0,pendingRespawn:false};
}
function updateRoundEvents(now){
  if(!nextRushAt||state!=='playing')return;
  if(now>=nextRushAt&&now>=bonusRushUntil){
    bonusRushUntil=now+8000;nextRushAt=now+rand(34000,47000);rushFlash=1;announce('BONUS RUSH! • 8 SECONDS',1300);beep(980,.16);
    targets.forEach((target,i)=>{if(i%2===0){const replacement=makeTarget(target.lane,i);Object.assign(target,replacement);target.x=target.vx>0?-target.r:W+target.r;}});
  }
  if(bonusRushUntil&&now>bonusRushUntil&&bonusRushUntil>now-150){announce('RUSH COMPLETE',900);}
}
function updateTargets(dt,t){
  const rush=performance.now()<bonusRushUntil;
  for(const target of targets){
    target.spawnAge+=dt;
    if(target.hitTime>0){target.hitTime=Math.max(0,target.hitTime-dt);if(target.hitTime<=0&&target.pendingRespawn){const replacement=makeTarget(target.lane,Math.floor(Math.random()*3));Object.assign(target,replacement);target.x=target.vx>0?-target.r:W+target.r;}continue;}
    const c=laneConfig[target.lane],pad=target.r*.8;target.x+=target.vx*dt*(rush?1.24:1);let amp=target.lane===0?8:12,freq=1.7;if(target.type.motion==='wave'){amp+=10;freq=3.1;}if(target.type.motion==='zigzag'){amp+=20;freq=5.1;}if(target.type.motion==='calm'){amp*=.45;freq=1.25;}if(target.special?.id==='golden'){amp+=12;freq+=1;}target.y=c.y+Math.sin(t*freq+target.phase)*amp;if(target.x<pad){target.x=pad;target.vx=Math.abs(target.vx);}if(target.x>W-pad){target.x=W-pad;target.vx=-Math.abs(target.vx);}target.blink-=dt;if(target.blink<0)target.blink=rand(2.5,5);
  }
}
function throwSlime(){
  if(state!=='playing')return;if(ammo<=0){setStatus('Out of slime — answer a question to reload.');$('empty-ammo').hidden=false;beep(160,.08);return;}
  ammo--;const c=laneConfig[aimLane],start={x:W/2,y:H-45},end={x:aimX,y:c.y};projectiles.push({lane:aimLane,start,end,t:0,duration:.34+.11*(2-aimLane)});recoil=1;shotGlow=1;cameraKick=Math.max(cameraKick,1.6);beep(330,.05);hud();setStatus(`${ammo} slime remaining · streak ${streak}.`);
}
function resolveThrow(p){
  const candidates=targets.filter(t=>t.lane===p.lane&&!t.pendingRespawn).sort((a,b)=>Math.abs(a.x-p.end.x)-Math.abs(b.x-p.end.x));const hit=candidates[0];const forgiveness=hit?hit.r*1.05+15:0;
  if(hit&&Math.abs(hit.x-p.end.x)<=forgiveness){
    hits++;hit.hitTime=.3;hit.pendingRespawn=true;hit.hitKick=p.end.x>=hit.x?1:-1;const special=hit.special;
    if(special?.id==='decoy'){
      score=Math.max(0,score-250);streak=0;addFloat('DECOY −250',hit.x,hit.y-22,'#ff6b75',true);announce('DECOY! −250 • STREAK LOST',1050);beep(145,.14);
    }else{
      streak++;bestStreak=Math.max(bestStreak,streak);const mult=comboMultiplier(),base=hit.value,earned=Math.round(base*mult);score+=earned;
      if(special?.id==='golden'){goldenHits++;addFloat(`JACKPOT +${earned}`,hit.x,hit.y-25,'#ffe46a',true);announce(`JACKPOT! +${earned}${mult>1?` • ×${mult}`:''}`,1150);beep(1180,.16);}
      else if(special?.id==='refill'){ammo+=2;addFloat(`+${earned} • +2 SLIME`,hit.x,hit.y-22,'#8cff6b',true);announce(`SLIME REFILL! +2 • ×${mult}`,1050);beep(940,.12);}
      else if(special?.id==='clock'){endAt+=5000;remaining+=5;addFloat(`+${earned} • +5 SEC`,hit.x,hit.y-22,'#72dcff',true);announce(`TIME BONUS! +5 SEC • ×${mult}`,1050);beep(1040,.12);}
      else{const praise=earned>=900?'GREAT SHOT!':streak>=5?'HOT STREAK!':`${hit.type.label} SPLAT!`;addFloat(`+${earned}${mult>1?` ×${mult}`:''}`,hit.x,hit.y-22,hit.type.color,earned>=900);announce(`${praise} +${earned}${mult>1?` • ×${mult}`:''}`,900);beep(760+hit.lane*80+Math.min(streak,8)*20,.09);}
    }
    const splatColor=special?.color||hit.type.color;splats.push({x:hit.x,y:hit.y,r:hit.r*1.2,t:0,color:splatColor});for(let i=0;i<(special?24:18);i++)particles.push({x:hit.x,y:hit.y,vx:rand(-185,185),vy:rand(-210,60),life:rand(.45,.9),age:0,r:rand(3,10),color:splatColor});cameraKick=Math.max(cameraKick,special?.id==='golden'?7:5.5);
  }else{
    streak=0;const splashY=[315,425,520][p.lane]||425;waterSplashes.push({x:p.end.x,y:splashY,age:0,life:.65,size:18+12*(2-p.lane)});for(let i=0;i<9;i++)particles.push({x:p.end.x,y:splashY,vx:rand(-75,75),vy:rand(-145,-45),life:rand(.32,.58),age:0,r:rand(2,5),color:'#bff8ff'});cameraKick=Math.max(cameraKick,2.4);addFloat('MISS • STREAK RESET',p.end.x,splashY-18,'#d7fbff');announce('SPLASH! • STREAK RESET');beep(210,.05);
  }hud();
}
function updateEffects(dt){
  projectiles.forEach(p=>p.t+=dt);for(const p of projectiles.filter(p=>p.t>=p.duration&&!p.done)){p.done=true;resolveThrow(p);}projectiles=projectiles.filter(p=>p.t<p.duration+.03);
  splats.forEach(s=>s.t+=dt);splats=splats.filter(s=>s.t<.75);
  particles.forEach(p=>{p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt;});particles=particles.filter(p=>p.age<p.life);
  waterSplashes.forEach(s=>s.age+=dt);waterSplashes=waterSplashes.filter(s=>s.age<s.life);
  floatingTexts.forEach(f=>{f.age+=dt;f.y-=34*dt;});floatingTexts=floatingTexts.filter(f=>f.age<f.life);
  recoil=Math.max(0,recoil-dt*5.8);shotGlow=Math.max(0,shotGlow-dt*6.5);cameraKick=Math.max(0,cameraKick-dt*16);rushFlash=Math.max(0,rushFlash-dt*2.4);
}
function keyboardAim(dt){if(state!=='playing')return;const speed=430;if(keys.has('arrowleft')||keys.has('a'))aimX-=speed*dt;if(keys.has('arrowright')||keys.has('d'))aimX+=speed*dt;aimX=clamp(aimX,35,W-35);}
function changeLane(delta){if(state!=='playing')return;aimLane=clamp(aimLane+delta,0,2);hud();setStatus(`${laneConfig[aimLane].name.toLowerCase()} lane · protect the streak and chase high-value shots.`);}
function aimAndThrowFromPointer(e){if(state!=='playing')return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*W,y=(e.clientY-rect.top)/rect.height*H;aimX=clamp(x,30,W-30);aimLane=laneConfig.reduce((best,lane,i)=>Math.abs(lane.y-y)<Math.abs(laneConfig[best].y-y)?i:best,0);hud();throwSlime();}

function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function poly(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function drawCloud(x,y,s){ctx.save();ctx.globalAlpha=.72;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,24*s,0,Math.PI*2);ctx.arc(x+29*s,y-7*s,33*s,0,Math.PI*2);ctx.arc(x+63*s,y+2*s,24*s,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawCanyon(t){
  const sky=ctx.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#4d9bd0');sky.addColorStop(.58,'#a7e1ed');sky.addColorStop(1,'#d9f1d7');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  const sun=ctx.createRadialGradient(790,70,2,790,70,75);sun.addColorStop(0,'#fffbe2');sun.addColorStop(.28,'#ffe995cc');sun.addColorStop(1,'#ffe99500');ctx.fillStyle=sun;ctx.beginPath();ctx.arc(790,70,75,0,Math.PI*2);ctx.fill();
  drawCloud((65+(t*4)%1070)-80,82,.8);drawCloud((625+(t*2.3)%1120)-80,115,.58);
  ctx.fillStyle='#608ca3';for(let i=0;i<7;i++){const x=i*175-110+Math.sin(t*.08)*3,h=90+(i%3)*35;poly([[x,235],[x+100,235-h],[x+220,235]]);ctx.fill();}
  const cliff=ctx.createLinearGradient(0,140,0,345);cliff.addColorStop(0,'#b66d45');cliff.addColorStop(.48,'#854f3c');cliff.addColorStop(1,'#563a34');ctx.fillStyle=cliff;poly([[0,214],[78,160],[145,182],[205,145],[270,201],[325,178],[380,210],[420,186],[470,212],[520,170],[585,198],[648,150],[720,194],[775,160],[840,205],[910,168],[960,190],[960,352],[0,352]]);ctx.fill();
  ctx.fillStyle='#375a34';for(let x=18;x<W;x+=48){const y=180+Math.sin(x*.031+t*.25)*24;ctx.fillRect(x,y,5,40);ctx.beginPath();ctx.moveTo(x-13,y+14);ctx.lineTo(x+2,y-18);ctx.lineTo(x+17,y+14);ctx.fill();}
  const falls=ctx.createLinearGradient(0,185,0,360);falls.addColorStop(0,'#d8f9ff');falls.addColorStop(.3,'#68d4ef');falls.addColorStop(1,'#2587b4');ctx.fillStyle=falls;rr(380,185,200,180,26);ctx.fill();
  ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle='#e9ffff';ctx.lineWidth=6;for(let x=395;x<570;x+=22){const drift=Math.sin(t*2.2+x*.05)*5;ctx.beginPath();ctx.moveTo(x+drift,194);ctx.bezierCurveTo(x+8-drift,235,x-7+drift,280,x+5-drift,348);ctx.stroke();}ctx.restore();
}
function drawWater(t){
  const water=ctx.createLinearGradient(0,330,0,H);water.addColorStop(0,'#1d87a7');water.addColorStop(.42,'#116a88');water.addColorStop(1,'#07374f');ctx.fillStyle=water;ctx.fillRect(0,330,W,H-330);
  ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle='#c7fbff';for(let row=0;row<8;row++){const y=355+row*31;ctx.lineWidth=1.5+row*.25;for(let x=-25;x<W;x+=76){ctx.beginPath();ctx.ellipse(x+Math.sin(t*1.3+row)*20,y,23+row*2,3+row*.35,0,0,Math.PI*2);ctx.stroke();}}ctx.restore();
  const reflection=ctx.createLinearGradient(0,330,0,505);reflection.addColorStop(0,'#c9fbff55');reflection.addColorStop(1,'#c9fbff00');ctx.fillStyle=reflection;ctx.fillRect(402+Math.sin(t*.7)*8,330,155,175);
  ctx.save();ctx.globalAlpha=.45;for(let i=0;i<12;i++){const bx=(i*83+(t*24))%W,by=545-(i%4)*38-Math.sin(t*1.8+i)*8;ctx.strokeStyle=i%3===0?'#b9ff82':'#bff8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx,by,2+(i%3),0,Math.PI*2);ctx.stroke();}ctx.restore();
}
function drawBridge(y,scale,front=false){
  const width=W*(front?.92:.78)*scale+(front?0:180),cx=W/2,half=width/2,depth=front?45:28*scale;
  ctx.save();ctx.shadowColor='#00121c88';ctx.shadowBlur=12*scale;ctx.shadowOffsetY=9*scale;
  const top=ctx.createLinearGradient(0,y-depth,0,y);top.addColorStop(0,'#a66c37');top.addColorStop(1,'#6d3e22');ctx.fillStyle=top;poly([[cx-half,y-depth],[cx+half,y-depth],[cx+half*.94,y],[cx-half*.94,y]]);ctx.fill();ctx.shadowColor='transparent';
  ctx.fillStyle='#462817';poly([[cx-half*.94,y],[cx+half*.94,y],[cx+half*.91,y+depth*.45],[cx-half*.91,y+depth*.45]]);ctx.fill();
  ctx.strokeStyle='#d5a262';ctx.lineWidth=Math.max(2,4*scale);for(let x=cx-half*.8;x<cx+half*.8;x+=Math.max(36,70*scale)){ctx.beginPath();ctx.moveTo(x,y-depth);ctx.lineTo(x*0.98+cx*.02,y);ctx.stroke();}
  ctx.fillStyle='#3f281a';for(const x of [cx-half*.9,cx+half*.9]){ctx.fillRect(x-5*scale,y-depth-30*scale,10*scale,42*scale);ctx.beginPath();ctx.arc(x,y-depth-30*scale,8*scale,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function drawArenaArchitecture(t){
  drawBridge(278,.72);drawBridge(392,.92);drawBridge(520,1.08,true);
  ctx.save();ctx.strokeStyle='#51351f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(95,114);ctx.lineTo(95,318);ctx.moveTo(865,114);ctx.lineTo(865,318);ctx.stroke();ctx.fillStyle='#684527';for(const x of [58,95,132,828,865,902])ctx.fillRect(x,148,10,174);ctx.restore();
  const rush=performance.now()<bonusRushUntil;ctx.fillStyle=rush?'#8e3bb7':'#6b3d20';rr(328,115,304,45,8);ctx.fill();ctx.strokeStyle=rush?'#ffe35e':'#d19855';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle= rush?'#fff7b3':'#ffe6a1';ctx.textAlign='center';ctx.font='900 20px system-ui';ctx.fillText(rush?'BONUS RUSH • SPLAT EVERYTHING':'AIM  •  SPLAT  •  SCORE  •  LEARN',480,144);ctx.textAlign='left';
  ctx.save();ctx.globalAlpha=.9;for(const [x,label] of [[122,'REVIEW\nPLAY\nLEARN'],[838,'SMART\nPLAYERS\nSCORE']]){const sway=Math.sin(t*1.5+x*.01)*4;ctx.fillStyle=rush?'#c13fc7':'#633cb8';poly([[x-35,170],[x+35,170],[x+30+sway,286],[x+sway,300],[x-30+sway,286]]);ctx.fill();ctx.fillStyle='#e8ddff';ctx.font='800 12px system-ui';ctx.textAlign='center';label.split('\n').forEach((s,i)=>ctx.fillText(s,x+sway*.25,203+i*24));}ctx.restore();
  ctx.save();ctx.globalAlpha=rush?.72:.28;ctx.strokeStyle=rush?'#ffe96e':'#fff2a9';ctx.lineWidth=2;for(let i=0;i<14;i++){const x=100+i*58,y=135+Math.sin(i*.9)*12;ctx.beginPath();ctx.arc(x,y,4+Math.sin(t*2+i),0,Math.PI*2);ctx.stroke();}ctx.restore();
}
function drawPlatformForTarget(target){
  const r=target.r,s=laneConfig[target.lane].scale,x=target.x,y=target.y+r*.58,depth=10+16*s,w=r*1.75;
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#00131f';ctx.beginPath();ctx.ellipse(x+5,y+depth+8,w*.8,depth*.55,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  const top=ctx.createLinearGradient(0,y-depth,0,y);top.addColorStop(0,'#a9713f');top.addColorStop(1,'#714323');ctx.fillStyle=top;poly([[x-w,y-depth],[x+w,y-depth],[x+w*.86,y],[x-w*.86,y]]);ctx.fill();ctx.strokeStyle='#d8a66a';ctx.lineWidth=Math.max(1.5,2.4*s);ctx.stroke();
  ctx.fillStyle='#3e281c';poly([[x-w*.86,y],[x+w*.86,y],[x+w*.74,y+depth],[x-w*.74,y+depth]]);ctx.fill();ctx.restore();
}
function drawTargetBody(target,t){
  const r=target.r,type=target.type,special=target.special,baseColor=special?.color||type.color,pop=clamp(target.spawnAge/.2,0,1),hitPhase=target.hitTime>0?1-target.hitTime/.3:0,hitPulse=target.hitTime>0?Math.sin(hitPhase*Math.PI):0;
  ctx.save();ctx.translate(target.x,target.y+(1-pop)*r*.42);ctx.rotate((target.hitKick||0)*hitPulse*.22);ctx.scale((.82+.18*pop)*(1+hitPulse*.16),(.82+.18*pop)*(1-hitPulse*.21));
  ctx.shadowColor=special?.id==='golden'?'#ffe46aaa':'#00121c88';ctx.shadowBlur=(special?.id==='golden'?22:12)*laneConfig[target.lane].scale;ctx.shadowOffsetY=8*laneConfig[target.lane].scale;
  const body=ctx.createRadialGradient(-r*.28,-r*.32,r*.06,0,0,r);body.addColorStop(0,'#ffffff');body.addColorStop(.12,baseColor);body.addColorStop(.72,baseColor);body.addColorStop(1,special?.id==='decoy'?'#631b26':'#17333c');ctx.fillStyle=body;
  if(target.variant===0){rr(-r*.68,-r*.75,r*1.36,r*1.36,r*.3);ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle='#172e37';rr(-r*.47,-r*.2,r*.94,r*.43,r*.16);ctx.fill();ctx.fillStyle='#eaffff';ctx.beginPath();ctx.arc(-r*.22,-r*.02,r*.115,0,Math.PI*2);ctx.arc(r*.22,-r*.02,r*.115,0,Math.PI*2);ctx.fill();ctx.fillStyle='#153640';ctx.beginPath();ctx.arc(-r*.2,-r*.01,r*.045,0,Math.PI*2);ctx.arc(r*.24,-r*.01,r*.045,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bbd7de';ctx.fillRect(-r*.09,-r*.92,r*.18,r*.18);ctx.fillStyle=special?.id==='decoy'?'#ffdf52':'#ff635c';ctx.beginPath();ctx.arc(0,-r*.93,r*.12,0,Math.PI*2);ctx.fill();}
  else if(target.variant===1){ctx.beginPath();ctx.arc(0,-r*.05,r*.73,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle='#14323a';ctx.beginPath();ctx.arc(-r*.22,-r*.15,r*.1,0,Math.PI*2);ctx.arc(r*.22,-r*.15,r*.1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#14323a';ctx.lineWidth=Math.max(3,r*.075);ctx.beginPath();ctx.arc(0,r*.08,r*.28,.2,Math.PI-.2);ctx.stroke();ctx.fillStyle='#ffffff88';ctx.beginPath();ctx.ellipse(-r*.27,-r*.33,r*.16,r*.09,-.6,0,Math.PI*2);ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(0,-r*.84);ctx.lineTo(r*.72,r*.62);ctx.lineTo(-r*.72,r*.62);ctx.closePath();ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle='#14323a';ctx.beginPath();ctx.arc(0,r*.07,r*.19,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff7';ctx.lineWidth=Math.max(2,r*.045);ctx.stroke();}
  ctx.shadowColor='transparent';ctx.strokeStyle=special?.id==='golden'?'#fff6ae':type.id==='bonus'?'#fff2a3':'#ffffffbb';ctx.lineWidth=Math.max(2,r*.055);ctx.stroke();
  if(type.id==='speed'){ctx.strokeStyle='#ffe4b8aa';ctx.lineWidth=Math.max(1,r*.035);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r*.95-i*r*.18,-r*.25+i*r*.2);ctx.lineTo(-r*.72,-r*.25+i*r*.2);ctx.stroke();}}
  if(type.id==='bonus'||special?.id==='golden'){ctx.fillStyle=special?.id==='golden'?'#fff7b0':'#fff0a3';for(let i=0;i<(special?.id==='golden'?6:3);i++){const a=t*(special?.id==='golden'?3.1:2.3)+i*(Math.PI*2/(special?.id==='golden'?6:3));ctx.beginPath();ctx.arc(Math.cos(a)*(r+10),Math.sin(a)*(r+10),Math.max(2,r*.07),0,Math.PI*2);ctx.fill();}}
  if(special){ctx.fillStyle='#07131dcc';ctx.beginPath();ctx.arc(0,r*.23,r*.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(14,r*.36)}px system-ui`;ctx.fillText(special.icon,0,r*.23);}
  if(target.hitTime>0){ctx.globalAlpha=.35+hitPulse*.45;ctx.fillStyle='#eaffff';ctx.beginPath();ctx.arc(0,0,r*.88,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  const badgeText=special?(special.id==='golden'?String(special.value):special.label):String(target.value),badgeW=Math.max(48,r*1.5,badgeText.length*7.4),badgeH=Math.max(18,r*.4);ctx.fillStyle='#07131deb';rr(-badgeW/2,-r-25,badgeW,badgeH,8);ctx.fill();ctx.strokeStyle=baseColor;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(10,r*.23)}px system-ui`;ctx.fillText(badgeText,0,-r-25+badgeH/2+1);ctx.restore();ctx.textAlign='left';ctx.textBaseline='alphabetic';
}
function drawTargets(t){const ordered=[...targets].sort((a,b)=>a.lane-b.lane);for(const target of ordered){drawPlatformForTarget(target);drawTargetBody(target,t);}}
function drawLaneMarkers(){for(const lane of laneConfig){ctx.save();ctx.globalAlpha=.72;ctx.font='900 12px system-ui';ctx.fillStyle='#fff';ctx.shadowColor='#00141f';ctx.shadowBlur=5;ctx.fillText(`${lane.name} · ${lane.points} BASE`,18,lane.y+43);ctx.restore();}}
function drawLauncher(){
  const x=W/2,y=H-4+recoil*15,tankFill=clamp(ammo/8,0,1);ctx.save();ctx.shadowColor='#00131fcc';ctx.shadowBlur=24;ctx.shadowOffsetY=8;
  ctx.fillStyle='#4b2d1d';poly([[x-118,y],[x-78,y-100],[x+78,y-100],[x+118,y]]);ctx.fill();ctx.shadowColor='transparent';
  const wood=ctx.createLinearGradient(x-75,0,x+75,0);wood.addColorStop(0,'#6f4022');wood.addColorStop(.45,'#bf8242');wood.addColorStop(.65,'#8d562e');wood.addColorStop(1,'#4c2d1e');ctx.fillStyle=wood;poly([[x-74,y],[x-48,y-132],[x+48,y-132],[x+74,y]]);ctx.fill();ctx.strokeStyle='#d9a468';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='#202d39';rr(x-57,y-142,114,38,16);ctx.fill();ctx.fillStyle='#768896';rr(x-47,y-137,94,11,6);ctx.fill();
  ctx.save();ctx.globalAlpha=.88;ctx.strokeStyle=ammo?'#b8ff83':'#ff6b75';ctx.lineWidth=3;rr(x-66,y-103,20,72,9);ctx.stroke();ctx.clip();ctx.fillStyle=ammo?'#68ed46':'#5a2027';ctx.fillRect(x-66,y-31-72*tankFill,20,72*tankFill);ctx.restore();
  ctx.fillStyle=ammo?'#75ff57':'#ff5c67';ctx.shadowColor=ammo?'#7cff4d':'#ff5c67';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(x+55,y-87,7,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';
  if(shotGlow>0){ctx.save();ctx.globalAlpha=shotGlow*.55;ctx.fillStyle='#b8ff83';ctx.beginPath();ctx.arc(x,y-76,58+shotGlow*15,0,Math.PI*2);ctx.fill();ctx.restore();}
  const slime=ctx.createRadialGradient(x-17,y-86,8,x,y-72,48);slime.addColorStop(0,'#efffd8');slime.addColorStop(.2,ammo?'#9cff5b':'#a9b3a1');slime.addColorStop(.75,ammo?'#45cf39':'#5d6d5c');slime.addColorStop(1,ammo?'#1d812d':'#313d33');ctx.fillStyle=slime;ctx.save();ctx.translate(x,y-70);ctx.scale(1+recoil*.08,1-recoil*.18);ctx.beginPath();ctx.arc(0,0,42,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ammo?'#c7ff9d':'#99a69a';ctx.lineWidth=3;ctx.stroke();ctx.restore();
  ctx.fillStyle=ammo?'#68ed46':'#4d5f50';ctx.beginPath();ctx.moveTo(x-35,y-38);ctx.quadraticCurveTo(x-18,y-15,x-3,y-34);ctx.quadraticCurveTo(x+14,y-5,x+30,y-37);ctx.lineTo(x+42,y-45);ctx.lineTo(x-42,y-45);ctx.closePath();ctx.fill();ctx.restore();
}
function targetUnderAim(){const candidates=targets.filter(t=>t.lane===aimLane&&!t.pendingRespawn).sort((a,b)=>Math.abs(a.x-aimX)-Math.abs(b.x-aimX));const hit=candidates[0];return hit&&Math.abs(hit.x-aimX)<=hit.r*1.15+15?hit:null;}
function drawCrosshair(){const c=laneConfig[aimLane],hover=targetUnderAim(),color=hover?.special?.color||hover?.type?.color||'#d9fff0',pulse=1+Math.sin(performance.now()/140)*.025;ctx.save();ctx.translate(aimX,c.y);ctx.scale(pulse,pulse);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.shadowColor=color;ctx.shadowBlur=hover?18:12;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.moveTo(-39,0);ctx.lineTo(-14,0);ctx.moveTo(14,0);ctx.lineTo(39,0);ctx.moveTo(0,-39);ctx.lineTo(0,-14);ctx.moveTo(0,14);ctx.lineTo(0,39);ctx.stroke();ctx.fillStyle='#e7fff2';ctx.beginPath();ctx.arc(0,0,3.5,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawEffects(){
  for(const p of projectiles){const n=clamp(p.t/p.duration,0,1),ease=1-Math.pow(1-n,2),x=p.start.x+(p.end.x-p.start.x)*ease,base=p.start.y+(p.end.y-p.start.y)*ease,y=base-Math.sin(Math.PI*n)*(135+60*(2-p.lane)),r=19-(2-p.lane)*3*n;ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#8fff58';ctx.lineWidth=Math.max(5,r*.7);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-(p.end.x-p.start.x)*.035,y+25);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;ctx.shadowColor='#8bff58';ctx.shadowBlur=20;const g=ctx.createRadialGradient(x-r*.3,y-r*.3,2,x,y,r);g.addColorStop(0,'#efffd7');g.addColorStop(.25,'#92ff56');g.addColorStop(1,'#2cae39');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
  for(const s of splats){ctx.save();ctx.globalAlpha=1-s.t/.75;ctx.fillStyle=s.color||'#6aff4c';ctx.translate(s.x,s.y);ctx.scale(1+s.t*.8,1+s.t*.5);ctx.beginPath();for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=i%2?s.r*.62:s.r*1.12;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();}
  for(const s of waterSplashes){const n=s.age/s.life;ctx.save();ctx.globalAlpha=1-n;ctx.strokeStyle='#d7fbff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(s.x,s.y,s.size*(.45+n*1.5),5+n*10,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(s.x,s.y,s.size*(.2+n*.9),3+n*6,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  for(const p of particles){ctx.save();ctx.globalAlpha=1-p.age/p.life;ctx.fillStyle=p.color||'#83ff54';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();}
  for(const f of floatingTexts){ctx.save();const n=f.age/f.life;ctx.globalAlpha=1-n;ctx.fillStyle=f.color;ctx.strokeStyle='#04101c';ctx.lineWidth=f.big?5:4;ctx.textAlign='center';ctx.font=`950 ${f.big?28:20}px system-ui`;ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y);ctx.restore();}
}
function drawRushOverlay(){if(performance.now()>=bonusRushUntil&&rushFlash<=0)return;const active=performance.now()<bonusRushUntil;ctx.save();ctx.globalAlpha=active?.14:rushFlash*.12;ctx.fillStyle='#ff4fd8';ctx.fillRect(0,0,W,H);ctx.globalAlpha=active?.92:rushFlash;ctx.fillStyle='#fff3a8';ctx.strokeStyle='#5a174f';ctx.lineWidth=6;ctx.textAlign='center';ctx.font='950 30px system-ui';const text=active?`BONUS RUSH • ${Math.max(1,Math.ceil((bonusRushUntil-performance.now())/1000))}`:'BONUS RUSH';ctx.strokeText(text,W/2,198);ctx.fillText(text,W/2,198);ctx.restore();}
function drawScene(t){
  ctx.clearRect(0,0,W,H);ctx.save();if(cameraKick>0){ctx.translate(Math.sin(t*79)*cameraKick,Math.cos(t*67)*cameraKick*.55);}drawCanyon(t);drawWater(t);drawArenaArchitecture(t);drawLaneMarkers();drawTargets(t);drawCrosshair();drawEffects();drawLauncher();drawRushOverlay();ctx.restore();
}
function loop(now){const dt=Math.min(.04,(now-lastFrame)/1000||0);lastFrame=now;if(state==='playing'){keyboardAim(dt);updateRoundEvents(now);updateTargets(dt,now/1000);updateEffects(dt);}else updateEffects(dt);drawScene(now/1000);requestAnimationFrame(loop);}

$('questions').onclick=()=>{if(state!=='playing')return;nextQuestion('playing');};$('earn-more').onclick=()=>{if(state==='playing')nextQuestion('playing');};$('throw').onclick=throwSlime;
document.querySelectorAll('[data-control]').forEach(b=>{let raf=null,last=0;const step=ts=>{if(!last)last=ts;const dt=(ts-last)/1000;last=ts;aimX=clamp(aimX+(b.dataset.control==='left'?-420:420)*dt,30,W-30);raf=requestAnimationFrame(step);};b.onpointerdown=e=>{e.preventDefault();if(state!=='playing')return;b.setPointerCapture(e.pointerId);last=0;raf=requestAnimationFrame(step);};const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=null;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=stop;});
document.querySelectorAll('[data-lane]').forEach(b=>b.onclick=()=>{if(state==='playing'){aimLane=Number(b.dataset.lane);hud();setStatus(`${laneConfig[aimLane].name.toLowerCase()} lane · protect the streak and chase high-value shots.`);}});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();aimAndThrowFromPointer(e);});
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!overlay.hidden&&panel.querySelector('.answers')&&!answered&&/^[1-4]$/.test(key)){e.preventDefault();answer(Number(key)-1);return;}if(!overlay.hidden)return;if(state!=='playing')return;if(['arrowleft','arrowright','arrowup','arrowdown','a','d',' '].includes(key))e.preventDefault();if((key==='arrowup'||key==='w')&&!e.repeat)changeLane(-1);else if((key==='arrowdown'||key==='s')&&!e.repeat)changeLane(1);else if(key===' '&&!e.repeat)throwSlime();else keys.add(key);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));beep(560,.05);};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setStatus('Full screen is unavailable in this browser.');}};

setup();hud();requestAnimationFrame(loop);
