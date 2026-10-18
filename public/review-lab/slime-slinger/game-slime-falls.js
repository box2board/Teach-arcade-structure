import {setsForGame,loadQuestionSet} from '../catalog.js';
import {enhanceTopicPicker} from '../topic-picker.js';
import {prepareQuestionDeck} from '../question-decks.js';

const $=id=>document.getElementById(id);
const canvas=$('stage'),ctx=canvas.getContext('2d');
const arenaBackground=new Image();arenaBackground.src='./assets/slime-falls-arena-bg.webp';
const rangeDeckSprite=new Image();rangeDeckSprite.src='./assets/slime-falls-range-deck.webp';
const targetSprites=['blob','bot','dummy','dart'].map(name=>{const image=new Image();image.src=`./assets/slime-falls-target-${name}.webp`;return image;});
const cannonSprite=new Image();cannonSprite.src='./assets/slime-falls-cannon.webp';
const W=canvas.width,H=canvas.height,VP={x:W/2,y:176};
const sets=setsForGame('slime-slinger');
const overlay=$('overlay'),panel=$('panel');

const laneConfig=[
  {name:'FAR',z:.83,points:400,speed:[170,245],color:'#7cf25a',flight:1.52,baseSize:56,arc:470},
  {name:'MID',z:.57,points:250,speed:[125,190],color:'#48a8ff',flight:1.14,baseSize:58,arc:340},
  {name:'NEAR',z:.30,points:125,speed:[82,132],color:'#a564ff',flight:.80,baseSize:60,arc:235}
];
const targetTypes=[
  {id:'easy',label:'EASY',scale:1.22,speed:.72,multiplier:.7,color:'#84f25f',motion:'calm',weight:27},
  {id:'standard',label:'STANDARD',scale:1,speed:1,multiplier:1,color:'#48b8ff',motion:'normal',weight:38},
  {id:'speed',label:'FAST',scale:.82,speed:1.58,multiplier:1.7,color:'#ff922e',motion:'wave',weight:25},
  {id:'bonus',label:'BONUS',scale:.68,speed:1.9,multiplier:2.5,color:'#ec59ff',motion:'zigzag',weight:10}
];
const specialTypes={
  golden:{id:'golden',label:'GOLDEN',color:'#ffd84f',scale:.75,speed:1.42,value:1400,icon:'★'},
  refill:{id:'refill',label:'+2 SLIME',color:'#77ff5b',scale:.92,speed:1.08,value:175,icon:'+'},
  clock:{id:'clock',label:'+5 SEC',color:'#68d8ff',scale:.88,speed:1.18,value:225,icon:'◷'},
  decoy:{id:'decoy',label:'DECOY',color:'#ff6673',scale:1,speed:.95,value:-300,icon:'×'}
};

let state='setup',bank=null,deck=[],deckIndex=0,current=null,answered=false,topicPicker=null;
let ammo=0,score=0,hits=0,attempts=0,correct=0,preloadAsked=0,preloadGoal=5;
let duration=180,remaining=180,endAt=0,timerId=null,selectedSet='';
let aimX=0,aimLane=2,targets=[],projectiles=[],splats=[],particles=[],floatingTexts=[],lastFrame=performance.now();
let keys=new Set(),questionOrigin='preload',sound=false,audio=null,calloutTimer=null;
let recoil=0,shotGlow=0,streak=0,bestStreak=0,academicStreak=0;
let bonusRushUntil=0,nextRushAt=0,rushFlash=0,goldenHits=0,perfectLoadBonus=false;
let cameraDepth=0,cameraSide=0,cameraYOffset=0,shotCamera=false,shotStage='aim',shotImpactUntil=0,impactFocus=null;

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function showPanel(html){overlay.hidden=false;panel.innerHTML=html;panel.querySelector('button,select')?.focus();}
function hidePanel(){overlay.hidden=true;canvas.focus();}
function formatTime(seconds){seconds=Math.max(0,Math.ceil(seconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function setStatus(text){$('status').textContent=text;}
function roundPoints(n){return Math.max(50,Math.round(n/25)*25);}
function comboMultiplier(){if(streak>=12)return 3;if(streak>=8)return 2.5;if(streak>=5)return 2;if(streak>=3)return 1.5;return 1;}
function chooseTargetType(){let roll=Math.random()*targetTypes.reduce((sum,t)=>sum+t.weight,0);for(const type of targetTypes){roll-=type.weight;if(roll<=0)return type;}return targetTypes[1];}
function chooseSpecial(){const rush=performance.now()<bonusRushUntil,roll=Math.random();if(roll<(rush?.17:.05))return specialTypes.golden;if(roll<(rush?.29:.095))return specialTypes.refill;if(roll<(rush?.39:.135))return specialTypes.clock;if(roll<(rush?.49:.18))return specialTypes.decoy;return null;}
function beep(freq=520,d=.06){if(!sound)return;audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function hud(){$('time').textContent=formatTime(remaining);$('score').textContent=score.toLocaleString();$('ammo').textContent=ammo;$('hits').textContent=streak?`${streak} ×${comboMultiplier()}`:'0';const playable=state==='playing';$('throw').disabled=!playable||ammo<=0||shotCamera;$('questions').disabled=!playable||shotCamera;$('empty-ammo').hidden=!playable||ammo>0;document.querySelectorAll('[data-lane]').forEach(b=>b.classList.toggle('active',Number(b.dataset.lane)===aimLane));}
function announce(text,durationMs=900){$('callout').textContent=text;$('callout').classList.add('show');clearTimeout(calloutTimer);calloutTimer=setTimeout(()=>$('callout').classList.remove('show'),durationMs);}
function addFloat(text,x,z,color='#fff',big=false){floatingTexts.push({text,x,z,color,age:0,life:big?1.2:.85,big});}
function rankForScore(value){if(value>=19000)return'ARCADE LEGEND';if(value>=12500)return'SLIME MASTER';if(value>=7500)return'SHARPSHOOTER';if(value>=3200)return'SPLATTER';return'ROOKIE';}
function resetCamera(){cameraDepth=0;cameraSide=0;cameraYOffset=0;shotCamera=false;shotStage='aim';impactFocus=null;}

function setup(){
 stopTimer();state='setup';ammo=score=hits=attempts=correct=preloadAsked=0;remaining=duration;targets=[];projectiles=[];splats=[];particles=[];floatingTexts=[];recoil=shotGlow=0;streak=bestStreak=academicStreak=goldenHits=0;bonusRushUntil=nextRushAt=rushFlash=0;perfectLoadBonus=false;resetCamera();aimX=0;aimLane=2;hud();
 showPanel(`<p class="eyebrow">SLIME FALLS · REVIEW LAB</p><h2 id="panel-title">Slime Slinger</h2><p>Welcome to the Slime Falls Carnival Range. Answer review questions to load slime, then pick a lane, lead the moving targets, and splat them before time runs out.</p><div class="rules"><div><strong>Near</strong><span>Largest targets and quickest throws</span></div><div><strong>Middle</strong><span>Faster movement and better points</span></div><div><strong>Far</strong><span>Tiny targets, high lobs, biggest rewards</span></div></div><p>Answer five load-up questions first. Correct answers earn slime; academic streaks earn bonus ammo.</p><label for="question-set">Review topic</label><select id="question-set">${sets.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select><label for="duration">Round length</label><select id="duration"><option value="120">2 minutes</option><option value="180" selected>3 minutes</option><option value="300">5 minutes</option></select><button class="primary" id="start-load">Enter the carnival range</button>`);
 const preset=new URLSearchParams(location.search).get('set');if(sets.some(s=>s.id===preset))$('question-set').value=preset;topicPicker=enhanceTopicPicker($('question-set'),sets);$('start-load').onclick=beginLoad;setStatus('Choose a topic to enter Slime Falls.');
}
async function beginLoad(){const button=$('start-load');button.disabled=true;button.textContent='Loading questions…';topicPicker.setDisabled(true);try{const selected=sets.find(s=>s.id===$('question-set').value);selectedSet=selected.title;duration=Number($('duration').value);remaining=duration;bank=await loadQuestionSet(selected.id);deck=[];deckIndex=0;ammo=0;preloadAsked=0;academicStreak=0;perfectLoadBonus=false;state='preload';hud();nextQuestion('preload');}catch(err){button.disabled=false;button.textContent='Try again';topicPicker.setDisabled(false);const p=document.createElement('p');p.textContent=err.message;panel.append(p);}}
function freshQuestion(){if(deckIndex>=deck.length){deck=prepareQuestionDeck(bank);deckIndex=0;}return deck[deckIndex++];}
function nextQuestion(origin='playing'){questionOrigin=origin;current=freshQuestion();answered=false;if(origin==='preload')preloadAsked++;const heading=origin==='preload'?`LOAD THE CANNON · ${preloadAsked} / ${preloadGoal}`:'EARN MORE SLIME';const clockNote=origin==='playing'?`<p><strong>The round clock is still running.</strong> Correct answers earn slime; every third correct answer in a row earns one bonus slime.</p>`:'<p>Correct answers earn slime. Build a three-answer academic streak for bonus ammo.</p>';showPanel(`<p class="eyebrow">${heading}</p><h2 id="panel-title"></h2>${clockNote}<div class="load-meter"><span>Slime ready</span><strong>● ${ammo}</strong></div><div class="answers" id="answers"></div><p class="feedback" id="feedback" role="status"></p><button class="primary" id="continue" hidden></button>${origin==='playing'?'<button class="secondary" id="back-arena">Back to Slime Falls</button>':''}`);$('panel-title').textContent=current.question;current.choices.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1}. ${text}`;b.onclick=()=>answer(i);$('answers').append(b);});if(origin==='playing')$('back-arena').onclick=()=>{hidePanel();state='playing';hud();setStatus(ammo?`${ammo} slime ready. Choose a lane and lead the target.`:'No slime left. Answer a question to reload.');};$('answers').firstElementChild?.focus();}
function answer(index){if(answered||!current)return;answered=true;attempts++;const right=index===current.answer;let earned=0,bonus=0;if(right){correct++;academicStreak++;earned=1;ammo++;if(academicStreak%3===0){bonus=1;ammo++;}beep(880,.12);}else{academicStreak=0;beep(185,.12);}if(questionOrigin==='preload'&&preloadAsked>=preloadGoal&&right&&correct===preloadGoal&&!perfectLoadBonus){perfectLoadBonus=true;ammo+=2;bonus+=2;}[...$('answers').children].forEach((b,i)=>{b.disabled=true;if(i===current.answer)b.classList.add('correct');else if(i===index)b.classList.add('wrong');});const reward=right?`Correct — +${earned} slime${bonus?` +${bonus} bonus slime!`:'!'}`:`Not this time. Correct answer: ${current.choices[current.answer]}.`;$('feedback').textContent=reward+(current.explanation?` ${current.explanation}`:'');const cont=$('continue');cont.hidden=false;if(questionOrigin==='preload'&&preloadAsked>=preloadGoal){cont.textContent=`Open the range with ${ammo} slime`;cont.onclick=startRound;}else if(questionOrigin==='preload'){cont.textContent='Next load-up question';cont.onclick=()=>nextQuestion('preload');}else{cont.textContent='Answer another question';cont.onclick=()=>remaining<=0?endRound():nextQuestion('playing');}const meter=panel.querySelector('.load-meter strong');if(meter)meter.textContent=`● ${ammo}`;hud();cont.focus();}
function startRound(){hidePanel();state='playing';remaining=duration;endAt=performance.now()+duration*1000;nextRushAt=performance.now()+rand(26000,39000);bonusRushUntil=0;resetCamera();aimX=0;aimLane=2;spawnTargets();startTimer();hud();announce('SLIME FALLS RANGE OPEN!',1200);setStatus(ammo?`${ammo} slime loaded. Near, middle, or far — pick your shot.`:'No slime earned yet — answer a question to load up.');}
function startTimer(){stopTimer();timerId=setInterval(()=>{if(state==='ended'||!endAt)return;remaining=Math.max(0,(endAt-performance.now())/1000);hud();if(remaining<=0)endRound();},100);}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
function endRound(){if(state==='ended'||state==='setup')return;remaining=0;stopTimer();state='ended';shotCamera=false;hud();keys.clear();const accuracy=attempts?Math.round(correct/attempts*100):0,rank=rankForScore(score),key='teachArcadeSlimeSlingerBest';let previousBest=0;try{previousBest=Number(localStorage.getItem(key)||0);}catch{}const newBest=score>previousBest;if(newBest){try{localStorage.setItem(key,String(score));}catch{}}const best=Math.max(score,previousBest);showPanel(`<p class="eyebrow">CARNIVAL ROUND COMPLETE</p><h2 id="panel-title">${score.toLocaleString()} points</h2><p><strong>${rank}</strong>${newBest?' · NEW HIGH SCORE!':''}</p><div class="rules"><div><strong>${hits}</strong><span>Targets hit</span></div><div><strong>${bestStreak}</strong><span>Best streak</span></div><div><strong>${accuracy}%</strong><span>Academic accuracy</span></div></div><div class="rules"><div><strong>${goldenHits}</strong><span>Golden targets</span></div><div><strong>${best.toLocaleString()}</strong><span>Best score</span></div><div><strong>${ammo}</strong><span>Slime left</span></div></div><p>${selectedSet} · ${correct}/${attempts} review answers correct.</p><button class="primary" id="again">Play Slime Falls again</button><a class="secondary" style="display:block;text-align:center;text-decoration:none" href="/review-lab/">Back to Review Lab</a>`);$('again').onclick=setup;setStatus(`Round complete — ${score.toLocaleString()} points · ${rank}.`);}

function spawnTargets(){targets=[];laneConfig.forEach((lane,laneIndex)=>{const count=laneIndex===0?5:laneIndex===1?4:3;for(let i=0;i<count;i++)targets.push(makeTarget(laneIndex,i));});}
function makeTarget(lane,index){const c=laneConfig[lane],special=chooseSpecial(),type=chooseTargetType(),dir=Math.random()<.5?-1:1,scale=special?.scale||1,speed=rand(...c.speed)*type.speed*(special?.speed||1),value=special?special.value:roundPoints(c.points*type.multiplier);return {lane,z:c.z,type,special,x:rand(-520,520),vx:dir*speed,r:c.baseSize*type.scale*scale,phase:rand(0,Math.PI*2),variant:(lane+index)%4,spawnAge:0,hitTime:0,hitKick:0,pendingRespawn:false,value};}
function updateRoundEvents(now){if(!nextRushAt||state!=='playing')return;if(now>=nextRushAt&&now>=bonusRushUntil){bonusRushUntil=now+8000;nextRushAt=now+rand(34000,47000);rushFlash=1;announce('BONUS RUSH! · 8 SECONDS',1300);beep(980,.16);targets.forEach((target,i)=>{if(i%2===0)Object.assign(target,makeTarget(target.lane,i));});}if(bonusRushUntil&&now>bonusRushUntil&&bonusRushUntil>now-150)announce('RUSH COMPLETE',900);}
function updateTargets(dt,t){const rush=performance.now()<bonusRushUntil;for(const target of targets){target.spawnAge+=dt;if(target.hitTime>0){target.hitTime=Math.max(0,target.hitTime-dt);if(target.hitTime<=0&&target.pendingRespawn)Object.assign(target,makeTarget(target.lane,Math.floor(Math.random()*5)));continue;}target.x+=target.vx*dt*(rush?1.25:1);if(target.type.motion==='wave')target.x+=Math.sin(t*4+target.phase)*20*dt;if(target.type.motion==='zigzag')target.x+=Math.sin(t*8+target.phase)*36*dt;if(target.x<-570){target.x=-570;target.vx=Math.abs(target.vx);}if(target.x>570){target.x=570;target.vx=-Math.abs(target.vx);}}}

function rawProject(x,z,height=0,camDepth=cameraDepth,camSide=cameraSide){const denom=Math.max(.08,1-camDepth),rz=clamp((z-camDepth)/denom,0,1),scale=1.18-.91*rz,groundY=548-rz*365;return{x:VP.x+(x-camSide)*scale,y:groundY-height*scale,scale,rz};}
function project(x,z,height=0){const p=rawProject(x,z,height);p.y+=cameraYOffset;return p;}
function projectileWorldAt(p,n){n=clamp(n,0,1);const peak=.56,e=smooth(n),z=lerp(.04,p.z,e),x=lerp(0,p.x,e);let loft;if(n<=peak)loft=Math.sin((n/peak)*Math.PI/2);else loft=Math.cos(((n-peak)/(1-peak))*Math.PI/2);const height=Math.max(0,loft)*laneConfig[p.lane].arc+175*(1-e);return{x,z,height,n};}
function projectileWorld(p){return projectileWorldAt(p,clamp(p.t/p.duration,0,1));}
function throwSlime(){if(state!=='playing'||shotCamera)return;if(ammo<=0){setStatus('Out of slime — answer a question to reload.');$('empty-ammo').hidden=false;beep(160,.08);return;}ammo--;const c=laneConfig[aimLane];projectiles.push({lane:aimLane,x:aimX,z:c.z,t:0,duration:c.flight,done:false});shotCamera=true;shotStage='flight';impactFocus=null;recoil=1;shotGlow=1;beep(330,.05);hud();setStatus(`${ammo} slime remaining · following the throw through Slime Falls.`);}
function resolveThrow(p){const candidates=targets.filter(t=>t.lane===p.lane&&!t.pendingRespawn).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));const hit=candidates[0],laneFactor=p.lane===2?.85:p.lane===1?.68:.52,forgiveness=hit?hit.r*laneFactor+8:0;let focus={x:p.x,z:p.z,hit:false,color:'#d7fbff'};if(hit&&Math.abs(hit.x-p.x)<=forgiveness){hit.hitTime=.3;hit.pendingRespawn=true;hit.hitKick=p.x>=hit.x?1:-1;const special=hit.special;focus={x:hit.x,z:hit.z,hit:true,color:special?.color||hit.type.color};if(special?.id==='decoy'){score=Math.max(0,score-300);streak=0;addFloat('DECOY −300',hit.x,hit.z,'#ff6b75',true);announce('DECOY! −300 · STREAK LOST',1050);beep(145,.14);}else{hits++;streak++;bestStreak=Math.max(bestStreak,streak);const mult=comboMultiplier(),earned=Math.round(hit.value*mult);score+=earned;if(special?.id==='golden'){goldenHits++;addFloat(`JACKPOT +${earned}`,hit.x,hit.z,'#ffe46a',true);announce(`GOLDEN JACKPOT! +${earned}${mult>1?` · ×${mult}`:''}`,1150);beep(1180,.16);}else if(special?.id==='refill'){ammo+=2;addFloat(`+${earned} · +2 SLIME`,hit.x,hit.z,'#8cff6b',true);announce(`SLIME REFILL! +2 · ×${mult}`,1050);beep(940,.12);}else if(special?.id==='clock'){endAt+=5000;remaining+=5;addFloat(`+${earned} · +5 SEC`,hit.x,hit.z,'#72dcff',true);announce(`TIME BONUS! +5 SEC · ×${mult}`,1050);beep(1040,.12);}else{const praise=p.lane===0?'LONG SHOT!':earned>=900?'GREAT SHOT!':streak>=5?'HOT STREAK!':`${hit.type.label} SPLAT!`;addFloat(`+${earned}${mult>1?` ×${mult}`:''}`,hit.x,hit.z,hit.type.color,earned>=900);announce(`${praise} +${earned}${mult>1?` · ×${mult}`:''}`,900);beep(760+hit.lane*80+Math.min(streak,8)*20,.09);}}splats.push({x:hit.x,z:hit.z,r:hit.r*1.3,t:0,color:special?.color||hit.type.color});for(let i=0;i<(special?24:18);i++)particles.push({x:hit.x,z:hit.z,dx:rand(-95,95),dy:rand(-145,35),age:0,life:rand(.42,.82),r:rand(3,9),color:special?.color||hit.type.color});}else{streak=0;addFloat('SPLASH! · STREAK RESET',p.x,p.z,'#d7fbff');announce('MISS · STREAK RESET');beep(210,.05);}impactFocus=focus;shotStage='impact';shotImpactUntil=performance.now()+380;hud();}
function updateEffects(dt){projectiles.forEach(p=>p.t+=dt);for(const p of projectiles.filter(p=>p.t>=p.duration&&!p.done)){p.done=true;resolveThrow(p);}projectiles=projectiles.filter(p=>!p.done||p.t<p.duration+.08);splats.forEach(s=>s.t+=dt);splats=splats.filter(s=>s.t<.78);particles.forEach(p=>{p.age+=dt;p.x+=p.dx*dt;p.dy+=260*dt;});particles=particles.filter(p=>p.age<p.life);floatingTexts.forEach(f=>f.age+=dt);floatingTexts=floatingTexts.filter(f=>f.age<f.life);recoil=Math.max(0,recoil-dt*6);shotGlow=Math.max(0,shotGlow-dt*6.5);rushFlash=Math.max(0,rushFlash-dt*2.4);}
function updateCamera(dt,now){if(shotCamera&&shotStage==='flight'&&projectiles.length){const p=projectiles[projectiles.length-1],q=projectileWorld(p),lead=smooth(clamp(q.n/.14,0,1));const targetDepth=Math.max(0,q.z-.10);cameraDepth=lerp(cameraDepth,targetDepth,Math.min(1,dt*8.5));cameraSide=lerp(cameraSide,q.x*.82,Math.min(1,dt*9));const raw=rawProject(q.x,q.z,q.height,cameraDepth,cameraSide),anchorY=lerp(H*.35,H*.50,smooth(q.n));cameraYOffset=lerp(cameraYOffset,(anchorY-raw.y)*lead,Math.min(1,dt*8.5));}else if(shotCamera&&shotStage==='impact'&&impactFocus){cameraDepth=lerp(cameraDepth,Math.max(0,impactFocus.z-.12),Math.min(1,dt*7));cameraSide=lerp(cameraSide,impactFocus.x*.86,Math.min(1,dt*8));const raw=rawProject(impactFocus.x,impactFocus.z,0,cameraDepth,cameraSide);cameraYOffset=lerp(cameraYOffset,H*.50-raw.y,Math.min(1,dt*8));if(now>=shotImpactUntil)shotStage='return';}else if(shotCamera&&shotStage==='return'){cameraDepth=lerp(cameraDepth,0,Math.min(1,dt*3.8));cameraSide=lerp(cameraSide,0,Math.min(1,dt*4.5));cameraYOffset=lerp(cameraYOffset,0,Math.min(1,dt*4.5));if(cameraDepth<.006&&Math.abs(cameraSide)<1&&Math.abs(cameraYOffset)<1){resetCamera();hud();setStatus(`${ammo} slime remaining · pick another carnival target.`);}}else{cameraDepth=lerp(cameraDepth,0,Math.min(1,dt*6));cameraSide=lerp(cameraSide,0,Math.min(1,dt*6));cameraYOffset=lerp(cameraYOffset,0,Math.min(1,dt*6));}}
function keyboardAim(dt){if(state!=='playing'||shotCamera)return;const speed=420;if(keys.has('arrowleft')||keys.has('a'))aimX-=speed*dt;if(keys.has('arrowright')||keys.has('d'))aimX+=speed*dt;aimX=clamp(aimX,-560,560);}
function changeLane(delta){if(state!=='playing'||shotCamera)return;aimLane=clamp(aimLane+delta,0,2);hud();setStatus(`${laneConfig[aimLane].name.toLowerCase()} lane · ${aimLane===0?'tiny targets, biggest rewards':'lead the movement and throw'}.`);}
function aimAndThrowFromPointer(e){if(state!=='playing'||shotCamera)return;const rect=canvas.getBoundingClientRect(),sx=(e.clientX-rect.left)/rect.width*W,sy=(e.clientY-rect.top)/rect.height*H;aimLane=laneConfig.reduce((best,lane,i)=>Math.abs(project(0,lane.z).y-sy)<Math.abs(project(0,laneConfig[best].z).y-sy)?i:best,0);const pp=project(0,laneConfig[aimLane].z),scale=pp.scale;aimX=clamp((sx-VP.x)/scale+cameraSide,-560,560);hud();throwSlime();}

function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function poly(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function drawMountain(x,y,w,h,color){
 const g=ctx.createLinearGradient(x-w*.25,y-h,x+w*.35,y);g.addColorStop(0,'#f4fdff');g.addColorStop(.2,'#b9dce8');g.addColorStop(.48,color);g.addColorStop(1,'#526f83');
 ctx.fillStyle=g;poly([[x-w*.58,y],[x-w*.28,y-h*.67],[x-w*.08,y-h*.47],[x+w*.04,y-h],[x+w*.26,y-h*.55],[x+w*.39,y-h*.73],[x+w*.61,y]]);ctx.fill();
 ctx.fillStyle='#f5ffffcc';poly([[x-w*.1,y-h*.55],[x+w*.04,y-h],[x+w*.23,y-h*.57],[x+w*.11,y-h*.63],[x+w*.04,y-h*.69],[x-w*.02,y-h*.62]]);ctx.fill();
 ctx.fillStyle='#758b96';poly([[x+w*.04,y-h],[x+w*.26,y-h*.55],[x+w*.39,y-h*.73],[x+w*.61,y],[x+w*.18,y]]);ctx.globalAlpha=.22;ctx.fillStyle='#122c3b';ctx.fill();ctx.globalAlpha=1;
}
function drawCloud(x,y,s,a=.72){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#f6fdff';ctx.beginPath();ctx.ellipse(x,y,s*1.35,s*.22,0,0,Math.PI*2);ctx.ellipse(x-s*.42,y-s*.08,s*.48,s*.28,0,0,Math.PI*2);ctx.ellipse(x+s*.08,y-s*.18,s*.58,s*.38,0,0,Math.PI*2);ctx.ellipse(x+s*.56,y-s*.06,s*.42,s*.25,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawWaterfall(x,y,w,h,t){
 const g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#90e5f2aa');g.addColorStop(.12,'#efffff');g.addColorStop(.28,'#56c9f2');g.addColorStop(.52,'#dffcff');g.addColorStop(.76,'#42aeda');g.addColorStop(1,'#d9fbffcc');
 ctx.save();ctx.shadowColor='#d4fbff';ctx.shadowBlur=12;ctx.fillStyle=g;poly([[x+w*.08,y],[x+w*.91,y],[x+w,y+h],[x,y+h]]);ctx.fill();ctx.restore();
 ctx.save();ctx.beginPath();poly([[x+w*.08,y],[x+w*.91,y],[x+w,y+h],[x,y+h]]);ctx.clip();
 for(let i=0;i<9;i++){const xx=x+w*(.08+i*.105)+Math.sin(t*1.8+i*1.7)*w*.025,shift=(t*38+i*39)%h;ctx.globalAlpha=.12+(i%3)*.05;ctx.strokeStyle=i%2?'#efffff':'#1d94c5';ctx.lineWidth=1+i%3;ctx.beginPath();ctx.moveTo(xx,y+shift-h);ctx.bezierCurveTo(xx+8,y+shift-h*.7,xx-7,y+shift-h*.3,xx+Math.sin(t+i)*4,y+shift);ctx.stroke();}
 ctx.globalAlpha=.46;ctx.fillStyle='#e7ffff';for(let i=0;i<8;i++){const px=x+w*(i/7),py=y+h-5+Math.sin(t*3+i)*3;ctx.beginPath();ctx.ellipse(px,py,5+(i%3)*3,2+(i%2)*2,0,0,Math.PI*2);ctx.fill();}ctx.restore();
 ctx.save();ctx.globalAlpha=.23;ctx.fillStyle='#e7fbff';for(let i=0;i<5;i++){const px=x+w*(.12+i*.19)+Math.sin(t+i)*10,py=y+h-14+Math.sin(t*2+i)*9;ctx.beginPath();ctx.arc(px,py,4+(i%2)*3,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function drawBanner(x,y,w,h,color,label){ctx.save();ctx.strokeStyle='#402719';ctx.lineWidth=Math.max(2,w*.045);ctx.beginPath();ctx.moveTo(x-5,y-3);ctx.lineTo(x+w+5,y-3);ctx.stroke();ctx.fillStyle=color;poly([[x,y],[x+w,y],[x+w-4,y+h-10],[x+w*.58,y+h],[x+w*.5,y+h-13],[x+w*.42,y+h],[x+4,y+h-10]]);ctx.fill();ctx.globalAlpha=.22;ctx.fillStyle='#fff';poly([[x+4,y+3],[x+w*.34,y+3],[x+w*.28,y+h*.78],[x+8,y+h*.7]]);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#ffe58c';ctx.font=`950 ${Math.max(10,w*.18)}px system-ui`;ctx.textAlign='center';ctx.fillText('★',x+w/2,y+h*.42);ctx.fillStyle='#fff';ctx.font=`900 ${Math.max(7,w*.105)}px system-ui`;ctx.fillText(label,x+w/2,y+h*.68);ctx.restore();}
function drawConifer(x,y,s,color='#285842'){ctx.save();ctx.fillStyle='#563d28';ctx.fillRect(x-s*.07,y-s*.2,s*.14,s*.26);for(let i=0;i<3;i++){const yy=y-s*(.25+i*.24),ww=s*(.48-i*.08);ctx.fillStyle=i===0?color:i===1?'#34704f':'#43845b';poly([[x,yy-s*.48],[x-ww,yy+s*.18],[x+ww,yy+s*.18]]);ctx.fill();ctx.globalAlpha=.2;ctx.fillStyle='#c4e8a1';poly([[x,yy-s*.42],[x-ww*.16,yy+s*.05],[x-ww*.04,yy+s*.04]]);ctx.fill();ctx.globalAlpha=1;}ctx.restore();}
function drawCanyonWall(side,t){
 const left=side<0,edge=left?0:W,inner=left?1:0;ctx.save();
 const grad=ctx.createLinearGradient(left?0:W,0,left?250:710,H);grad.addColorStop(0,'#5c3d34');grad.addColorStop(.35,'#a66c4d');grad.addColorStop(.68,'#80513c');grad.addColorStop(1,'#4a493d');
 ctx.fillStyle=grad;
 if(left)poly([[0,190],[92,205],[154,255],[178,326],[158,392],[198,465],[165,H],[0,H]]);
 else poly([[W,184],[868,208],[808,254],[781,323],[806,394],[761,462],[800,H],[W,H]]);
 ctx.fill();
 ctx.save();ctx.globalAlpha=.23;ctx.strokeStyle='#f1bb7e';ctx.lineWidth=3;
 for(let i=0;i<7;i++){const yy=232+i*48,drift=Math.sin(i*2.1)*15;ctx.beginPath();if(left){ctx.moveTo(0,yy);ctx.quadraticCurveTo(74,yy+drift,153+i%2*14,yy+20);}else{ctx.moveTo(W,yy-5);ctx.quadraticCurveTo(880,yy+drift,807-i%2*12,yy+22);}ctx.stroke();}
 ctx.restore();
 ctx.globalAlpha=.22;ctx.fillStyle='#d6b27b';for(let i=0;i<12;i++){const px=left?18+(i*31)%145:W-18-(i*31)%145,py=230+(i*47)%340;ctx.beginPath();ctx.ellipse(px,py,6+(i%4)*3,3+(i%3)*2,(i%2-.5)*.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 for(let i=0;i<5;i++){const x=left?24+i*30:W-24-i*30,y=315+(i%3)*65+Math.sin(t+i)*2;drawConifer(x,y,48+(i%2)*14,i%2?'#285842':'#34714a');}
 ctx.fillStyle='#4f7350';poly(left?[[0,416],[125,397],[174,427],[154,450],[0,457]]:[[W,408],[846,394],[783,426],[804,450],[W,457]]);ctx.fill();
 ctx.restore();
}
function drawBackgroundFallback(t){
 const rush=performance.now()<bonusRushUntil,sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,rush?'#7398db':'#66bde9');sky.addColorStop(.31,rush?'#edbddc':'#d3f4ff');sky.addColorStop(.54,'#eaf7f4');sky.addColorStop(.55,'#5cb7cf');sky.addColorStop(1,'#087b98');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const sun=ctx.createRadialGradient(493,94,4,493,94,218);sun.addColorStop(0,'#fff9d7a8');sun.addColorStop(.3,'#fff9d766');sun.addColorStop(1,'#fff9d700');ctx.fillStyle=sun;ctx.fillRect(260,0,460,290);
 drawCloud(128+Math.sin(t*.06)*14,90,54,.46);drawCloud(360,60,43,.55);drawCloud(735+Math.sin(t*.05)*10,102,62,.5);drawCloud(868,55,38,.44);
 drawMountain(110,267,270,176,'#8dabb8');drawMountain(342,251,335,205,'#819dab');drawMountain(627,269,292,181,'#7895a5');drawMountain(849,259,250,166,'#89a9b7');
 ctx.fillStyle='#587c72';poly([[0,260],[94,233],[170,260],[244,232],[320,267],[390,237],[483,264],[564,229],[655,261],[743,237],[820,265],[906,230],[W,252],[W,327],[0,327]]);ctx.fill();
 ctx.globalAlpha=.38;ctx.fillStyle='#effcff';ctx.fillRect(0,280,W,82);ctx.globalAlpha=1;
 drawCanyonWall(-1,t);drawCanyonWall(1,t);
 // Waterfall ribbons cascade down the canyon through the range.
 drawWaterfall(189,242,76,208,t+.3);drawWaterfall(376,213,91,279,t+1.1);drawWaterfall(612,230,77,234,t+2.2);drawWaterfall(735,245,64,190,t+1.6);
 const mist=ctx.createRadialGradient(482,392,12,482,392,245);mist.addColorStop(0,'#efffff8a');mist.addColorStop(.36,'#d4faff55');mist.addColorStop(1,'#d4faff00');ctx.fillStyle=mist;ctx.fillRect(220,250,520,290);
 // Turquoise plunge pool; converging highlights reinforce the deep central gorge.
 const water=ctx.createLinearGradient(0,365,0,H);water.addColorStop(0,'#7be2e8');water.addColorStop(.17,'#26bfd1');water.addColorStop(.5,'#0e96b6');water.addColorStop(1,'#07526e');ctx.fillStyle=water;poly([[166,382],[794,382],[W,H],[0,H]]);ctx.fill();
 ctx.save();ctx.globalAlpha=.38;for(let i=0;i<18;i++){const y=392+i*13,x1=195-i*10,x2=765+i*10,mid=480+Math.sin(t*1.1+i*.6)*25;ctx.strokeStyle=i%3?'#d5ffff':'#53e7ec';ctx.lineWidth=i%4===0?2.2:1;ctx.beginPath();ctx.moveTo(x1,y);ctx.quadraticCurveTo(mid,y-5-Math.sin(t+i)*3,x2,y);ctx.stroke();}ctx.restore();
 ctx.save();ctx.globalAlpha=.19;ctx.fillStyle='#efffff';for(let i=0;i<26;i++){const x=(i*83+Math.sin(t*.7+i)*14)%W,y=372+(i*37)%175;ctx.beginPath();ctx.arc(x,y,1.6+(i%3),0,Math.PI*2);ctx.fill();}ctx.restore();
}
function drawBackground(t){
 if(!arenaBackground.complete||!arenaBackground.naturalWidth){drawBackgroundFallback(t);return;}
 ctx.drawImage(arenaBackground,0,0,W,H);
 // Quiet moving highlights keep the illustrated pool alive while the scenery stays crisp.
 ctx.save();ctx.beginPath();poly([[166,382],[794,382],[W,H],[0,H]]);ctx.clip();ctx.globalAlpha=.16;
 for(let i=0;i<8;i++){const y=401+i*22,x=170+i*83+(Math.sin(t*.75+i)*18);ctx.strokeStyle=i%3?'#e5ffff':'#57e9eb';ctx.lineWidth=i%3===0?2:1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+38,y-4-Math.sin(t+i)*3,x+102,y);ctx.stroke();}
 ctx.restore();
}
function drawBridge(y,scale,t){
 const span=780*scale,x0=(W-span)/2,x1=x0+span,arch=32*scale;ctx.save();
 ctx.strokeStyle='#3b2518';ctx.lineWidth=12*scale;ctx.beginPath();ctx.moveTo(x0,y+arch);ctx.quadraticCurveTo(W/2,y-arch,x1,y+arch);ctx.stroke();
 ctx.strokeStyle='#d6a365';ctx.lineWidth=4*scale;ctx.beginPath();ctx.moveTo(x0,y+arch-4*scale);ctx.quadraticCurveTo(W/2,y-arch-4*scale,x1,y+arch-4*scale);ctx.stroke();
 ctx.fillStyle='#674128';poly([[x0,y+arch],[x1,y+arch],[x1,y+arch+10*scale],[x0,y+arch+10*scale]]);ctx.fill();
 for(let i=0;i<=18;i++){const u=i/18,x=lerp(x0,x1,u),yy=y+arch-Math.sin(u*Math.PI)*arch*2;ctx.fillStyle=i%2?'#9b6335':'#ad7540';ctx.fillRect(x-11*scale,yy,20*scale,9*scale);if(i%3===0){ctx.strokeStyle='#472b1a';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(x,yy-3*scale);ctx.lineTo(x,yy+10*scale);ctx.stroke();}}
 ctx.strokeStyle='#d2a06a';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(x0,y+arch-10*scale);ctx.quadraticCurveTo(W/2,y-arch-12*scale,x1,y+arch-10*scale);ctx.stroke();
 for(let i=0;i<=10;i++){const u=i/10,x=lerp(x0,x1,u),yy=y+arch-Math.sin(u*Math.PI)*arch*2;ctx.strokeStyle='#4d3321';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x,yy-23*scale);ctx.stroke();ctx.fillStyle=i%2?'#ffd05c':'#d94e56';poly([[x,yy-22*scale],[x+17*scale,yy-18*scale],[x+5*scale,yy-4*scale]]);ctx.fill();}
 ctx.restore();
}
function drawCarnivalStructures(t){
 ctx.save();
 // Distant timber towers and rope crossings make the range feel built into the canyon.
 drawBridge(198,.84,t);drawBridge(292,.68,t+1);
 for(const x of [75,178,782,885]){
  const h=x===75||x===885?124:92,y=255-h;ctx.fillStyle='#59371f';ctx.fillRect(x-13,y,26,h+70);ctx.fillStyle='#b57b40';ctx.fillRect(x-7,y+4,7,h+66);ctx.fillStyle='#40291b';ctx.fillRect(x-31,y-5,62,12);ctx.fillStyle='#e0b06b';ctx.fillRect(x-24,y+12,48,5);ctx.fillStyle='#ffbd4b';ctx.shadowColor='#ffb12a';ctx.shadowBlur=11;ctx.beginPath();ctx.arc(x,y+32,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 }
 // Striped carnival booths sit on the canyon ledges, outside the target lanes.
 for(const x of [38,922]){const sign=x<100?1:-1,bx=x<100?18:846,by=274;ctx.fillStyle='#55351f';ctx.fillRect(bx,by,bx<100?96:96,72);ctx.fillStyle='#8f5930';ctx.fillRect(bx+5,by+18,86,54);ctx.fillStyle='#31231b';ctx.fillRect(bx+15,by+30,66,42);
  ctx.fillStyle='#714321';poly([[bx-8,by+8],[bx+104,by+8],[bx+91,by-22],[bx+5,by-22]]);ctx.fill();
  for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#f4d982':'#d74b58';poly([[bx+4+i*17,by-19],[bx+20+i*14,by-19],[bx+19+i*14,by+9],[bx+9+i*14,by+14]]);ctx.fill();}
  ctx.fillStyle='#ffe3a0';ctx.fillRect(bx+13,by+10,70,5);ctx.fillStyle='#f7c65c';ctx.fillRect(bx+45,by+36,8,36);ctx.fillStyle='#9aff54';ctx.fillRect(bx+48,by+38,3,30);
 }
 ctx.strokeStyle='#56341d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(128,150);for(let x=128;x<=832;x+=44)ctx.lineTo(x,150+Math.sin(x*.015+t*.35)*8);ctx.stroke();const colors=['#ffce48','#874df1','#f64e65','#59d9ff','#87e94e'];for(let i=0;i<17;i++){const x=130+i*43,y=151+Math.sin(x*.015+t*.35)*8;ctx.fillStyle=colors[i%colors.length];poly([[x,y],[x+19,y+3],[x+9,y+23]]);ctx.fill();}
 drawBanner(104,162,48,78,'#7544d7','PLAY');drawBanner(808,162,48,78,'#7544d7','SPLAT');
 const sx=W/2-119,sy=102;ctx.fillStyle='#4d301e';rr(sx,sy,238,59,12);ctx.fill();ctx.fillStyle='#a76c37';rr(sx+4,sy+4,230,51,9);ctx.fill();ctx.strokeStyle='#e3b36d';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#58ed48';ctx.font='950 27px system-ui';ctx.textAlign='center';ctx.shadowColor='#145b20';ctx.shadowBlur=5;ctx.fillText('SLIME FALLS',W/2,sy+26);ctx.shadowBlur=0;ctx.fillStyle='#ffe18d';ctx.font='900 10px system-ui';ctx.fillText('CARNIVAL RANGE',W/2,sy+45);
 ctx.restore();
}
function drawRangeProps(t){
 for(const [z,label,color] of [[.30,'NEAR','#a56aff'],[.57,'MID','#51c9ff'],[.83,'FAR','#9cf357']]){
  const pL=project(-530,z),pR=project(530,z),s=pL.scale;ctx.save();
  ctx.strokeStyle='#402919';ctx.lineWidth=Math.max(3,10*s);ctx.beginPath();ctx.moveTo(pL.x,pL.y-4*s);ctx.lineTo(pR.x,pR.y-4*s);ctx.stroke();
  ctx.strokeStyle='#d39a55';ctx.lineWidth=Math.max(1.5,3*s);ctx.beginPath();ctx.moveTo(pL.x,pL.y-8*s);ctx.lineTo(pR.x,pR.y-8*s);ctx.stroke();
  for(const p of [pL,pR]){ctx.fillStyle='#50321d';ctx.fillRect(p.x-8*s,p.y-62*s,16*s,64*s);ctx.fillStyle='#be8247';ctx.fillRect(p.x-4*s,p.y-61*s,4*s,60*s);ctx.fillStyle='#e7bd7a';for(let b=0;b<3;b++){ctx.beginPath();ctx.arc(p.x,p.y-(53-b*19)*s,2.4*s,0,Math.PI*2);ctx.fill();}}
  const signX=pL.x+34*s,signY=pL.y-79*s;ctx.fillStyle='#4c301d';rr(signX-35*s,signY-12*s,70*s,24*s,4*s);ctx.fill();ctx.fillStyle=color;ctx.globalAlpha=.92;ctx.fillRect(signX-31*s,signY-8*s,62*s,16*s);ctx.globalAlpha=1;ctx.fillStyle='#263023';ctx.font=`950 ${Math.max(6,10*s)}px system-ui`;ctx.textAlign='center';ctx.fillText(label,signX,signY+4*s);ctx.restore();
 }
 // Tiny evergreens and rock shelves recede with the perspective.
 for(let i=0;i<12;i++){const z=.18+i*.061,x=(i%2?-1:1)*(420+35*Math.sin(t*.2+i)),p=project(x,z);drawConifer(p.x,p.y,30*p.scale,i%3?'#2f6948':'#477d52');}
}
function drawLanePlatformsFallback(){
 for(const [laneIndex,lane] of laneConfig.entries()){
  const left=project(-560,lane.z),right=project(560,lane.z),center=project(0,lane.z),s=center.scale,depth=laneIndex===2?25:laneIndex===1?18:13;
  ctx.save();
  // Dark joists and stone piers place each target deck at a distinct depth.
  ctx.fillStyle='#34443d';poly([[left.x,left.y+9*s],[right.x,right.y+9*s],[right.x,right.y+(depth+21)*s],[left.x,left.y+(depth+21)*s]]);ctx.fill();
  for(const side of [left,right]){ctx.fillStyle='#51402b';poly([[side.x-10*s,side.y+20*s],[side.x+10*s,side.y+20*s],[side.x+7*s,side.y+112*s],[side.x-7*s,side.y+112*s]]);ctx.fill();ctx.fillStyle='#a27a48';ctx.fillRect(side.x-7*s,side.y+25*s,4*s,78*s);}
  ctx.fillStyle='#6b4529';poly([[left.x,left.y+8*s],[right.x,right.y+8*s],[right.x,right.y+24*s],[left.x,left.y+24*s]]);ctx.fill();
  for(let i=0;i<18;i++){const f=i/17,x=lerp(left.x,right.x,f),yy=lerp(left.y,right.y,f)+8*s;ctx.fillStyle=i%2?'#b17a42':'#a76d38';ctx.fillRect(x-9*s,yy,17*s,13*s);ctx.strokeStyle='#754722';ctx.lineWidth=Math.max(.7,1.2*s);ctx.beginPath();ctx.moveTo(x-6*s,yy+3*s);ctx.lineTo(x+5*s,yy+3*s);ctx.stroke();ctx.fillStyle='#3b2a20';for(const dx of [-6,5]){ctx.beginPath();ctx.arc(x+dx*s,yy+7*s,1.1*s,0,Math.PI*2);ctx.fill();}}
  ctx.strokeStyle='#e4b771';ctx.lineWidth=Math.max(1,2.6*s);ctx.beginPath();ctx.moveTo(left.x,left.y+7*s);ctx.lineTo(right.x,right.y+7*s);ctx.stroke();
  // Rope rails and evenly spaced timber posts create a readable carnival range.
  for(const edge of [-1,1]){const yOffset=edge<0?0:depth*s;ctx.strokeStyle='#50341f';ctx.lineWidth=Math.max(1.2,3.4*s);ctx.beginPath();ctx.moveTo(left.x,left.y+yOffset-14*s);ctx.quadraticCurveTo(center.x,center.y+yOffset-4*s,right.x,right.y+yOffset-14*s);ctx.stroke();ctx.strokeStyle='#d6aa73';ctx.lineWidth=Math.max(.8,1.2*s);ctx.beginPath();ctx.moveTo(left.x,left.y+yOffset-17*s);ctx.quadraticCurveTo(center.x,center.y+yOffset-7*s,right.x,right.y+yOffset-17*s);ctx.stroke();for(let i=0;i<=10;i++){const f=i/10,x=lerp(left.x,right.x,f),y=lerp(left.y,right.y,f)+yOffset;ctx.fillStyle='#654125';ctx.fillRect(x-2*s,y-18*s,4*s,24*s);ctx.fillStyle='#d2a069';ctx.fillRect(x-1.4*s,y-17*s,1.4*s,21*s);}}
  // Slime drips mark the attraction's three target decks without obscuring targets.
  if(laneIndex>0){ctx.fillStyle='#73ed45';for(let i=0;i<5;i++){const x=lerp(left.x,right.x,(i+.5)/5);ctx.beginPath();ctx.ellipse(x,left.y+10*s,3.3*s,2.2*s,0,0,Math.PI*2);ctx.fill();ctx.fillRect(x-1.4*s,left.y+9*s,2.8*s,(4+(i%3)*3)*s);}}
  ctx.restore();
 }
}
function drawLanePlatforms(){
 if(!rangeDeckSprite.complete||!rangeDeckSprite.naturalWidth){drawLanePlatformsFallback();return;}
 const sourceRatio=rangeDeckSprite.naturalWidth/rangeDeckSprite.naturalHeight;
 for(const lane of laneConfig){
  const left=project(-560,lane.z),right=project(560,lane.z),center=project(0,lane.z),s=center.scale;
  const width=(right.x-left.x)+18*s,height=width/sourceRatio;
  // The illustrated boardwalk is perspective-scaled for each fixed target depth.
  ctx.drawImage(rangeDeckSprite,left.x-9*s,center.y-height*.30,width,height);
 }
}
function drawForeground(){
 ctx.save();
 // Close timber dock frames the cannon and ties the playfield to the carnival.
 const g=ctx.createLinearGradient(0,500,0,H);g.addColorStop(0,'#ad7137');g.addColorStop(.12,'#754a29');g.addColorStop(1,'#392315');ctx.fillStyle=g;poly([[0,508],[150,496],[242,531],[238,H],[0,H]]);ctx.fill();poly([[960,508],[810,496],[718,531],[722,H],[960,H]]);ctx.fill();
 ctx.strokeStyle='#dba25c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,512);ctx.lineTo(151,501);ctx.lineTo(239,534);ctx.moveTo(960,512);ctx.lineTo(809,501);ctx.lineTo(721,534);ctx.stroke();
 for(let i=0;i<5;i++){for(const side of [0,1]){const x=side?960-i*35:i*35,y=520+i*15;ctx.strokeStyle='#4a2b18';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(side?-29:29),y+8);ctx.stroke();ctx.fillStyle='#edc176';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();}}
 for(const x of [25,935]){ctx.fillStyle='#674223';rr(x-18,464,36,42,5);ctx.fill();ctx.strokeStyle='#c18a4f';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#9bdc53';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-13,469);ctx.quadraticCurveTo(x,463,x+15,469);ctx.stroke();ctx.fillStyle='#e5bd79';for(const dx of [-10,0,10]){ctx.beginPath();ctx.arc(x+dx,478,1.7,0,Math.PI*2);ctx.fill();}}
 ctx.restore();
}

// Color variants are prepared once per sprite, avoiding per-frame image filters.
const specialSpriteCache=new Map();
function specialTargetSprite(sprite,id){
 if(!id)return sprite;
 const key=sprite.src+'|'+id;if(specialSpriteCache.has(key))return specialSpriteCache.get(key);
 const art=document.createElement('canvas');art.width=sprite.naturalWidth;art.height=sprite.naturalHeight;
 const paint=art.getContext('2d');paint.drawImage(sprite,0,0);paint.globalCompositeOperation='source-atop';
 paint.fillStyle={golden:'rgba(255,192,18,.52)',refill:'rgba(89,255,30,.36)',clock:'rgba(32,197,255,.45)',decoy:'rgba(255,35,55,.52)'}[id]||'transparent';
 paint.fillRect(0,0,art.width,art.height);specialSpriteCache.set(key,art);return art;
}
function drawSpecialEmblem(id,r,color){
 ctx.save();ctx.translate(r*.66,-r*.62);const size=Math.max(7,r*.28);
 ctx.fillStyle='#162b30';ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.5,r*.055);
 ctx.beginPath();ctx.arc(0,0,size*1.2,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#fff6da';ctx.fillStyle=color;ctx.lineWidth=Math.max(1.2,size*.18);ctx.lineCap='round';
 if(id==='clock'){
  ctx.beginPath();ctx.arc(0,0,size*.74,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-size*.48);ctx.lineTo(0,0);ctx.lineTo(size*.4,size*.2);ctx.stroke();
 }else if(id==='decoy'){
  poly([[0,-size*.82],[size*.82,size*.64],[-size*.82,size*.64]]);ctx.fill();ctx.strokeStyle='#45151a';ctx.beginPath();ctx.moveTo(0,-size*.32);ctx.lineTo(0,size*.12);ctx.stroke();ctx.fillStyle='#45151a';ctx.beginPath();ctx.arc(0,size*.39,size*.09,0,Math.PI*2);ctx.fill();
 }else if(id==='refill'){
  ctx.beginPath();ctx.moveTo(0,-size*.88);ctx.bezierCurveTo(size*1.02,size*.2,size*.73,size*.8,0,size*.8);ctx.bezierCurveTo(-size*.73,size*.8,-size*1.02,size*.2,0,-size*.88);ctx.fill();ctx.strokeStyle='#174a22';ctx.beginPath();ctx.moveTo(-size*.3,size*.18);ctx.lineTo(size*.3,size*.18);ctx.moveTo(0,-size*.12);ctx.lineTo(0,size*.48);ctx.stroke();
 }
 ctx.restore();
}
function drawTarget(target,t){
 const sprite=targetSprites[target.variant%targetSprites.length];
 if(!sprite?.complete||!sprite.naturalWidth){drawTargetFallback(target,t);return;}
 const p=project(target.x,target.z),s=p.scale,r=target.r*s,special=target.special,base=special?.color||target.type.color;
 const pop=clamp(target.spawnAge/.2,0,1),hit=target.hitTime>0?Math.sin((1-target.hitTime/.3)*Math.PI):0;
 ctx.save();ctx.translate(p.x,p.y-r*.52);ctx.scale((.82+.18*pop)*(1+hit*.16),(.82+.18*pop)*(1-hit*.20));ctx.rotate((target.hitKick||0)*hit*.18);
 ctx.globalAlpha=.38;ctx.fillStyle='#00131b';ctx.beginPath();ctx.ellipse(0,r*.72,r*.72,r*.17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 if(special){ctx.globalAlpha=.20+.10*Math.sin(t*5+target.phase);ctx.fillStyle=special.color;ctx.shadowColor=special.color;ctx.shadowBlur=24*s;ctx.beginPath();ctx.arc(0,0,r*1.18,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;}
 ctx.shadowColor='#071d28aa';ctx.shadowBlur=12*s;ctx.shadowOffsetY=5*s;ctx.save();ctx.rotate(Math.sin(t*(target.type.id==='speed'?4.4:2.2)+target.phase)*.026*(1-hit));ctx.drawImage(specialTargetSprite(sprite,special?.id),-r*.94,-r*.96+Math.sin(t*2.4+target.phase)*r*.018,r*1.88,r*1.78);ctx.restore();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 if(special?.id==='golden'){ctx.fillStyle='#ffd845';ctx.strokeStyle='#fff1a0';ctx.lineWidth=Math.max(1,2*s);poly([[-r*.40,-r*.82],[-r*.27,-r*1.16],[0,-r*.96],[r*.27,-r*1.16],[r*.40,-r*.82]]);ctx.fill();ctx.stroke();}
 if(special&&special.id!=='golden')drawSpecialEmblem(special.id,r,special.color);
 if(special?.id==='golden'){ctx.strokeStyle='#fff3aa';ctx.lineWidth=Math.max(1,1.4*s);for(let i=0;i<3;i++){const a=t*.65+i*Math.PI*2/3,xx=Math.cos(a)*r*1.15,yy=Math.sin(a)*r*.8-r*.3,len=(.09+.04*Math.sin(t*5+i))*r;ctx.beginPath();ctx.moveTo(xx-len,yy);ctx.lineTo(xx+len,yy);ctx.moveTo(xx,yy-len);ctx.lineTo(xx,yy+len);ctx.stroke();}}
 const badge=special?(special.id==='golden'?special.value:special.label):target.value,txt=String(badge),badgeY=r*.84,bw=Math.max(42*s,txt.length*7*s);
 ctx.fillStyle='#24150def';rr(-bw/2,badgeY,bw,18*s,6*s);ctx.fill();ctx.strokeStyle=base;ctx.lineWidth=Math.max(1,1.7*s);ctx.stroke();ctx.fillStyle=special?.id==='golden'?'#ffe46a':'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`950 ${Math.max(8,11*s)}px system-ui`;ctx.fillText(txt,0,badgeY+9*s);ctx.restore();
}
function drawTargetFallback(target,t){const p=project(target.x,target.z),s=p.scale,r=target.r*s,type=target.type,special=target.special,base=special?.color||type.color,pop=clamp(target.spawnAge/.2,0,1),hit=target.hitTime>0?Math.sin((1-target.hitTime/.3)*Math.PI):0;ctx.save();ctx.translate(p.x,p.y-r*.52);ctx.scale((.82+.18*pop)*(1+hit*.16),(.82+.18*pop)*(1-hit*.20));ctx.rotate((target.hitKick||0)*hit*.18);
 ctx.globalAlpha=.38;ctx.fillStyle='#00131b';ctx.beginPath();ctx.ellipse(0,r*.72,r*.72,r*.17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 if(special){ctx.globalAlpha=.20+.10*Math.sin(t*5+target.phase);ctx.fillStyle=special.color;ctx.shadowColor=special.color;ctx.shadowBlur=24*s;ctx.beginPath();ctx.arc(0,0,r*1.18,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;}
 const body=ctx.createRadialGradient(-r*.28,-r*.35,1,0,0,r);body.addColorStop(0,'#fff');body.addColorStop(.12,'#f2ffe8');body.addColorStop(.22,base);body.addColorStop(.72,base);body.addColorStop(1,special?.id==='decoy'?'#641626':'#153543');ctx.fillStyle=body;ctx.shadowColor='#00121c99';ctx.shadowBlur=14*s;ctx.shadowOffsetY=6*s;
 if(target.variant===0){rr(-r*.68,-r*.62,r*1.36,r*1.2,r*.30);ctx.fill();}else if(target.variant===1){ctx.beginPath();ctx.arc(0,-r*.02,r*.72,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.moveTo(0,-r*.82);ctx.quadraticCurveTo(r*.92,-r*.18,r*.68,r*.60);ctx.quadraticCurveTo(0,r*.88,-r*.68,r*.60);ctx.quadraticCurveTo(-r*.92,-r*.18,0,-r*.82);ctx.fill();}
 ctx.shadowBlur=0;ctx.fillStyle='#20323b';rr(-r*.48,-r*.08,r*.96,r*.42,r*.15);ctx.fill();ctx.fillStyle='#f8ffff';ctx.beginPath();ctx.arc(-r*.22,-r*.02,r*.15,0,Math.PI*2);ctx.arc(r*.22,-r*.02,r*.15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#15242c';ctx.beginPath();ctx.arc(-r*.20,0,r*.07,0,Math.PI*2);ctx.arc(r*.20,0,r*.07,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffecda';ctx.beginPath();ctx.arc(0,r*.26,r*.18,0,Math.PI);ctx.fill();
 ctx.strokeStyle='#efffffcc';ctx.lineWidth=Math.max(1.3,r*.05);ctx.stroke();ctx.strokeStyle='#394d55';ctx.lineWidth=Math.max(2,r*.07);ctx.beginPath();ctx.moveTo(0,-r*.70);ctx.lineTo(0,-r*.96);ctx.stroke();ctx.fillStyle=special?.color||'#ff4b43';ctx.beginPath();ctx.arc(0,-r*.99,r*.10,0,Math.PI*2);ctx.fill();
 if(special?.id==='golden'){ctx.fillStyle='#ffd845';ctx.strokeStyle='#fff1a0';ctx.lineWidth=Math.max(1,2*s);poly([[-r*.45,-r*.86],[-r*.28,-r*1.23],[0,-r*.96],[r*.28,-r*1.23],[r*.45,-r*.86]]);ctx.fill();ctx.stroke();}
 if(special&&special.id!=='golden'){ctx.fillStyle='#07131ddd';ctx.beginPath();ctx.arc(0,r*.52,r*.22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`950 ${Math.max(10,r*.32)}px system-ui`;ctx.fillText(special.icon,0,r*.52);}
 const badge=special?(special.id==='golden'?special.value:special.label):target.value,txt=String(badge),bw=Math.max(42*s,txt.length*7*s);ctx.fillStyle='#24150def';rr(-bw/2,r*.72,bw,18*s,6*s);ctx.fill();ctx.strokeStyle=base;ctx.lineWidth=Math.max(1,1.7*s);ctx.stroke();ctx.fillStyle=special?.id==='golden'?'#ffe46a':'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`950 ${Math.max(8,11*s)}px system-ui`;ctx.fillText(txt,0,r*.72+9*s);ctx.restore();}
function drawTargets(t){[...targets].sort((a,b)=>b.z-a.z).forEach(target=>drawTarget(target,t));}
function targetUnderAim(){const candidates=targets.filter(t=>t.lane===aimLane&&!t.pendingRespawn).sort((a,b)=>Math.abs(a.x-aimX)-Math.abs(b.x-aimX));const hit=candidates[0];return hit&&Math.abs(hit.x-aimX)<=hit.r*.9+10?hit:null;}
function drawAimGuide(){if(shotCamera)return;const lane=laneConfig[aimLane],end=project(aimX,lane.z),start={x:W/2,y:H-225},arc=lane.arc*(lane.name==='FAR'?.24:lane.name==='MID'?.19:.15);ctx.save();ctx.strokeStyle='#b9ff5f9a';ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(VP.x,(start.y+end.y)/2-arc,end.x,end.y);ctx.stroke();ctx.setLineDash([]);const hover=targetUnderAim(),color=hover?.special?.color||hover?.type?.color||'#c9ff71';ctx.strokeStyle=color;ctx.lineWidth=3.5;ctx.shadowColor=color;ctx.shadowBlur=hover?22:14;ctx.beginPath();ctx.arc(end.x,end.y,22*end.scale+9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(end.x-31,end.y);ctx.lineTo(end.x-12,end.y);ctx.moveTo(end.x+12,end.y);ctx.lineTo(end.x+31,end.y);ctx.moveTo(end.x,end.y-31);ctx.lineTo(end.x,end.y-12);ctx.moveTo(end.x,end.y+12);ctx.lineTo(end.x,end.y+31);ctx.stroke();ctx.restore();}
function drawProjectileAndEffects(){for(const p of projectiles){const q=projectileWorld(p);ctx.save();ctx.lineCap='round';ctx.beginPath();let started=false;for(let i=10;i>=0;i--){const n=clamp(q.n-i*.03,0,1),w=projectileWorldAt(p,n),sp=project(w.x,w.z,w.height);if(!started){ctx.moveTo(sp.x,sp.y);started=true;}else ctx.lineTo(sp.x,sp.y);}ctx.globalAlpha=.32;ctx.strokeStyle='#9cff5d';ctx.lineWidth=12;ctx.shadowColor='#62ff3c';ctx.shadowBlur=18;ctx.stroke();ctx.restore();const sp=project(q.x,q.z,q.height),r=13+13*(1-sp.rz);ctx.save();ctx.shadowColor='#8bff58';ctx.shadowBlur=30;const g=ctx.createRadialGradient(sp.x-r*.3,sp.y-r*.3,2,sp.x,sp.y,r);g.addColorStop(0,'#fff');g.addColorStop(.2,'#eaffc6');g.addColorStop(.45,'#8cff50');g.addColorStop(1,'#239233');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sp.x,sp.y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
 for(const s of splats){const p=project(s.x,s.z),n=s.t/.78;ctx.save();ctx.globalAlpha=1-n;ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=14;ctx.translate(p.x,p.y-18*p.scale);ctx.scale(p.scale*(1+n*.78),p.scale*(1+n*.56));ctx.beginPath();for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=i%2?s.r*.58:s.r,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();}
 for(const p of particles){const sp=project(p.x,p.z),n=p.age/p.life;ctx.save();ctx.globalAlpha=1-n;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(sp.x,sp.y+p.dy*p.age*sp.scale,p.r*sp.scale,0,Math.PI*2);ctx.fill();ctx.restore();}
 for(const f of floatingTexts){const p=project(f.x,f.z),n=f.age/f.life;ctx.save();ctx.globalAlpha=1-n;ctx.fillStyle=f.color;ctx.strokeStyle='#251208';ctx.lineWidth=f.big?6:4;ctx.textAlign='center';ctx.font=`950 ${f.big?28:20}px system-ui`;ctx.strokeText(f.text,p.x,p.y-48*p.scale-f.age*25);ctx.fillText(f.text,p.x,p.y-48*p.scale-f.age*25);ctx.restore();}}
function drawLauncher(){
 const reveal=shotCamera?clamp(1-cameraDepth/.09,0,1):1;if(reveal<=0)return;
 if(!cannonSprite.complete||!cannonSprite.naturalWidth){drawLauncherFallback();return;}
 const width=200,height=width*cannonSprite.naturalHeight/cannonSprite.naturalWidth;
 ctx.save();ctx.globalAlpha=reveal;ctx.translate(W/2,H+8+recoil*14);ctx.rotate(clamp(aimX/560,-1,1)*.055);
 const tank=clamp(ammo/8,0,1);
 if(shotGlow>0){const gx=0,gy=-height*.48,glow=ctx.createRadialGradient(gx,gy,2,gx,gy,width*.34);glow.addColorStop(0,`rgba(177,255,106,${.22*shotGlow})`);glow.addColorStop(1,'rgba(110,255,60,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(gx,gy,width*.42,height*.38,0,0,Math.PI*2);ctx.fill();}
 ctx.shadowColor='#050c0dcc';ctx.shadowBlur=18;ctx.drawImage(cannonSprite,-width/2,-height,width,height);ctx.shadowBlur=0;
 for(let i=0;i<Math.min(5,Math.ceil(tank*5));i++){const bx=Math.sin(performance.now()*.002+i*2.2)*width*.035,by=-height*.48-((performance.now()*.025+i*height*.13)%Math.max(10,height*.16));ctx.globalAlpha=.62*reveal;ctx.fillStyle='#eaffb8';ctx.beginPath();ctx.arc(bx,by,Math.max(1.5,width*.012),0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=reveal;
 // Brass-framed supply gauge sits on the carriage and tracks earned ammunition.
 ctx.fillStyle='#38291c';rr(-width*.34,-height*.18,64,17,4);ctx.fill();ctx.strokeStyle='#e4b65c';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#10391e';ctx.fillRect(-width*.34+5,-height*.18+5,54,7);ctx.fillStyle=ammo?'#93ff38':'#793732';ctx.fillRect(-width*.34+5,-height*.18+5,54*tank,7);
 if(shotGlow>0){ctx.globalAlpha=reveal*shotGlow;const mx=0,my=-height*.96;ctx.fillStyle='#baff4e';for(let i=0;i<9;i++){const a=i/9*Math.PI*2,travel=(1-shotGlow)*28;ctx.beginPath();ctx.ellipse(mx+Math.cos(a)*travel,my+Math.sin(a)*travel*.6,3+shotGlow*3,2+shotGlow*2,a,0,Math.PI*2);ctx.fill();}}
 ctx.restore();
}
function drawLauncherFallback(){if(shotCamera)return;const x=W/2,y=H+8+recoil*14,tank=clamp(ammo/8,0,1);ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=28;ctx.fillStyle='#432616';poly([[x-142,y],[x-106,y-112],[x+106,y-112],[x+142,y]]);ctx.fill();ctx.fillStyle='#9c6333';for(let i=-4;i<=4;i++){ctx.fillRect(x+i*27-10,y-106,19,104);}ctx.strokeStyle='#d39a56';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-104,y-104);ctx.lineTo(x+104,y-104);ctx.stroke();ctx.shadowBlur=0;
 const metal=ctx.createLinearGradient(x-70,y-160,x+70,y-104);metal.addColorStop(0,'#1f2930');metal.addColorStop(.35,'#91a7ae');metal.addColorStop(.55,'#27343a');metal.addColorStop(1,'#0d1418');ctx.fillStyle=metal;rr(x-72,y-161,144,54,22);ctx.fill();ctx.strokeStyle='#dbecef';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#151d21';ctx.beginPath();ctx.arc(x,y-134,38,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#697e85';ctx.lineWidth=7;ctx.stroke();
 ctx.save();rr(x-45,y-107,90,92,23);ctx.clip();const slime=ctx.createLinearGradient(0,y-108,0,y);slime.addColorStop(0,'#cfff8e');slime.addColorStop(.35,'#79f149');slime.addColorStop(1,'#20a63a');ctx.fillStyle=slime;ctx.fillRect(x-45,y-15-92*tank,90,92*tank);ctx.restore();ctx.strokeStyle='#d7ffb4';ctx.lineWidth=4;rr(x-45,y-107,90,92,23);ctx.stroke();ctx.fillStyle='#f0ffe7aa';ctx.beginPath();ctx.ellipse(x-17,y-82,12,6,-.5,0,Math.PI*2);ctx.fill();
 if(shotGlow>0){ctx.globalAlpha=shotGlow*.45;ctx.fillStyle='#b8ff83';ctx.beginPath();ctx.arc(x,y-102,72,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.fillStyle='#5bf047';for(const dx of [-108,98]){ctx.beginPath();ctx.arc(x+dx,y-104,9,0,Math.PI*2);ctx.fill();ctx.fillRect(x+dx-5,y-105,10,22);}ctx.restore();}
function drawDepthHUD(){if(shotCamera)return;ctx.save();const x=16,y=18,w=198,h=38;ctx.fillStyle='#3a2114d8';rr(x,y,w,h,14);ctx.fill();ctx.strokeStyle='#c88745';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ffe8bc';ctx.font='900 9px system-ui';ctx.fillText('LANE',x+12,y+14);const labels=['FAR','MID','NEAR'];labels.forEach((lab,i)=>{const xx=x+66+i*43;ctx.fillStyle=i===aimLane?laneConfig[i].color:'#8d765f';ctx.beginPath();ctx.arc(xx,y+24,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.fillText(lab,xx,y+13);});ctx.restore();}
function drawShotHUD(){if(!shotCamera)return;ctx.save();ctx.fillStyle='#3b2115df';rr(W/2-112,18,224,34,17);ctx.fill();ctx.strokeStyle=shotStage==='impact'?(impactFocus?.color||'#fff'):'#9dff75';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff4d9';ctx.textAlign='center';ctx.font='950 12px system-ui';ctx.fillText(shotStage==='flight'?'● FOLLOWING SLIME':shotStage==='impact'?'● SPLAT!':'● BACK TO THE CANNON',W/2,40);ctx.restore();}
function drawRushOverlay(){if(performance.now()>=bonusRushUntil&&rushFlash<=0)return;ctx.save();ctx.globalAlpha=performance.now()<bonusRushUntil?.09:rushFlash*.09;ctx.fillStyle='#ff4fd8';ctx.fillRect(0,0,W,H);ctx.restore();}
function drawVignette(){const v=ctx.createRadialGradient(W/2,H*.43,150,W/2,H*.52,620);v.addColorStop(0,'#0000');v.addColorStop(.72,'#00000005');v.addColorStop(1,'#2b130a66');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}
function drawScene(t){ctx.clearRect(0,0,W,H);drawBackground(t);drawLanePlatforms();drawTargets(t);drawForeground();drawAimGuide();drawProjectileAndEffects();drawLauncher();drawDepthHUD();drawShotHUD();drawRushOverlay();drawVignette();}
function loop(now){const dt=Math.min(.04,(now-lastFrame)/1000||0);lastFrame=now;if(state==='playing'){keyboardAim(dt);updateRoundEvents(now);updateTargets(dt,now/1000);updateEffects(dt);updateCamera(dt,now);}else updateEffects(dt);drawScene(now/1000);requestAnimationFrame(loop);}

$('questions').onclick=()=>{if(state!=='playing'||shotCamera)return;nextQuestion('playing');};
$('earn-more').onclick=()=>{if(state==='playing'&&!shotCamera)nextQuestion('playing');};
$('throw').onclick=throwSlime;
document.querySelectorAll('[data-control]').forEach(b=>{let raf=null,last=0;const step=ts=>{if(!last)last=ts;const dt=(ts-last)/1000;last=ts;if(!shotCamera)aimX=clamp(aimX+(b.dataset.control==='left'?-400:400)*dt,-560,560);raf=requestAnimationFrame(step);};b.onpointerdown=e=>{e.preventDefault();if(state!=='playing'||shotCamera)return;b.setPointerCapture(e.pointerId);last=0;raf=requestAnimationFrame(step);};const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=null;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=stop;});
document.querySelectorAll('[data-lane]').forEach(b=>b.onclick=()=>{if(state==='playing'&&!shotCamera){aimLane=Number(b.dataset.lane);hud();setStatus(`${laneConfig[aimLane].name.toLowerCase()} lane selected.`);}});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();aimAndThrowFromPointer(e);});
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!overlay.hidden&&panel.querySelector('.answers')&&!answered&&/^[1-4]$/.test(key)){e.preventDefault();answer(Number(key)-1);return;}if(!overlay.hidden||state!=='playing')return;if(['arrowleft','arrowright','arrowup','arrowdown','a','d',' '].includes(key))e.preventDefault();if(shotCamera)return;if((key==='arrowup'||key==='w')&&!e.repeat)changeLane(-1);else if((key==='arrowdown'||key==='s')&&!e.repeat)changeLane(1);else if(key===' '&&!e.repeat)throwSlime();else keys.add(key);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));beep(560,.05);};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setStatus('Full screen is unavailable in this browser.');}};

setup();hud();requestAnimationFrame(loop);
