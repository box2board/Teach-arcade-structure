const LIB='assets/asset-library.svg#';
const game=document.querySelector('#game');
const world=document.querySelector('#world');
const player=document.querySelector('#player');
const playerUse=document.querySelector('#playerUse');
const fog=document.querySelector('#fog');
const toast=document.querySelector('#toast');
const distanceEl=document.querySelector('#distance');
const scoreEl=document.querySelector('#score');
const staminaEl=document.querySelector('#stamina');
const accuracyEl=document.querySelector('#accuracy');
const streakEl=document.querySelector('#streak');
const qModal=document.querySelector('#questionModal');
const qText=document.querySelector('#questionText');
const choices=document.querySelector('#choices');
const explanation=document.querySelector('#explanation');
const forkModal=document.querySelector('#forkModal');

const laneLeft=[9,42.5,76];
const state={running:false,paused:false,lane:1,distance:0,score:0,stamina:3,correct:0,total:0,streak:0,speed:0.19,jumping:false,last:0,nextSpawn:0,nextQuestion:420,nextFork:900,obstacleRate:1,fogUntil:0,runFrame:0,runTimer:0};
let obstacles=[];let questions=[];let questionIndex=0;let raf=0;

const obstacleDefs=[
  {id:'low-barrier',cls:'',jumpable:true,damage:1},
  {id:'barbed-wire',cls:'wire',jumpable:true,damage:1},
  {id:'crater-small',cls:'crater',jumpable:false,damage:1},
  {id:'broken-timber',cls:'',jumpable:false,damage:1}
];

function sprite(id,cls=''){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 256 256'); svg.classList.add(...cls.split(' ').filter(Boolean));
  const use=document.createElementNS('http://www.w3.org/2000/svg','use');
  use.setAttribute('href',LIB+id); svg.append(use); return svg;
}
function setPlayer(id){playerUse.setAttribute('href',LIB+id)}
function laneX(lane){return laneLeft[lane]}
function updateHud(){
  distanceEl.textContent=Math.floor(state.distance);scoreEl.textContent=Math.floor(state.score);staminaEl.textContent=state.stamina;
  accuracyEl.textContent=(state.total?Math.round(state.correct/state.total*100):100)+'%';streakEl.textContent=state.streak;
}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1100)}
function reset(){
  obstacles.forEach(o=>o.el.remove());obstacles=[];Object.assign(state,{running:true,paused:false,lane:1,distance:0,score:0,stamina:3,correct:0,total:0,streak:0,speed:0.19,jumping:false,last:performance.now(),nextSpawn:performance.now()+900,nextQuestion:420,nextFork:900,obstacleRate:1,fogUntil:0,runFrame:0,runTimer:0});
  player.style.left=laneX(1)+'%';setPlayer('soldier-run-1');fog.classList.add('hidden');qModal.classList.add('hidden');forkModal.classList.add('hidden');updateHud();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)
}
function move(dir){if(!state.running||state.paused)return;state.lane=Math.max(0,Math.min(2,state.lane+dir));player.style.left=laneX(state.lane)+'%'}
function jump(){if(!state.running||state.paused||state.jumping)return;state.jumping=true;player.classList.add('jump');setPlayer('soldier-jump-airborne');setTimeout(()=>{state.jumping=false;player.classList.remove('jump');setPlayer('soldier-run-1')},620)}
function spawnObstacle(){
  const def=obstacleDefs[Math.floor(Math.random()*obstacleDefs.length)];const lane=Math.floor(Math.random()*3);const el=sprite(def.id,'obstacle '+def.cls);el.style.left=(laneX(lane)-6)+'%';world.append(el);
  obstacles.push({el,lane,y:-28,def,hit:false});
}
function spawnCheckpoint(){const lane=state.lane;const el=sprite('checkpoint-base','checkpoint');el.style.left=(laneX(lane)-5)+'%';world.append(el);obstacles.push({el,lane,y:-28,checkpoint:true,hit:false})}
function hit(o){
  if(o.hit)return;o.hit=true;if(o.checkpoint){o.el.remove();showQuestion();return}
  if(state.jumping&&o.def.jumpable)return;
  state.stamina=Math.max(0,state.stamina-o.def.damage);state.streak=0;player.classList.add('hit');setPlayer('soldier-stumble');setTimeout(()=>{player.classList.remove('hit');setPlayer('soldier-run-1')},340);showToast('Obstacle hit — stamina lost');
  if(state.stamina<=0){state.running=false;setPlayer('soldier-fall');showToast('Run ended')}
}
function showQuestion(){
  state.paused=true;const q=questions[questionIndex++%questions.length];if(!q){state.paused=false;return}qText.textContent=q.question;choices.innerHTML='';explanation.textContent='';
  q.choices.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c;b.onclick=()=>answer(q,i,b);choices.append(b)});qModal.classList.remove('hidden')
}
function answer(q,i,b){
  [...choices.children].forEach(x=>x.disabled=true);state.total++;const ok=i===q.answerIndex;if(ok){state.correct++;state.streak++;state.score+=150;b.classList.add('correct');explanation.textContent='Correct — '+q.explanation;showToast('Correct! +150')}else{state.streak=0;state.stamina=Math.max(0,state.stamina-1);b.classList.add('wrong');choices.children[q.answerIndex]?.classList.add('correct');explanation.textContent='Incorrect — '+q.explanation;state.fogUntil=performance.now()+7000;fog.classList.remove('hidden')}
  updateHud();setTimeout(()=>{qModal.classList.add('hidden');state.paused=false;if(state.stamina<=0){state.running=false;setPlayer('soldier-fall')}},1100)
}
function showFork(){state.paused=true;forkModal.classList.remove('hidden')}
function chooseFork(risky){state.obstacleRate=risky?1.35:.78;state.score+=risky?200:50;forkModal.classList.add('hidden');state.paused=false;showToast(risky?'Risk route: 1.35× obstacles':'Safer route selected');setTimeout(()=>state.obstacleRate=1,9000)}
function animatePlayer(dt){if(state.jumping)return;state.runTimer+=dt;if(state.runTimer>82){state.runTimer=0;state.runFrame=(state.runFrame+1)%6;setPlayer('soldier-run-'+(state.runFrame+1))}}
function moveParallax(dt){document.querySelectorAll('.parallax').forEach((el,i)=>{const n=parseFloat(el.dataset.x||0)+dt*state.speed*(i+1)*.015;el.dataset.x=n;el.style.transform=`translateY(${(n%12)-6}px)`})}
function updateObstacles(dt){
  const h=game.clientHeight;for(const o of obstacles){o.y+=dt*state.speed*.12;o.el.style.top=o.y+'%';if(o.y>57&&o.y<79&&o.lane===state.lane)hit(o)}
  obstacles=obstacles.filter(o=>{if(o.y>108){o.el.remove();return false}return true})
}
function loop(now){
  if(!state.running)return;const dt=Math.min(40,now-state.last||16);state.last=now;
  if(!state.paused){state.distance+=dt*state.speed*.015;state.score+=dt*state.speed*.01;animatePlayer(dt);moveParallax(dt);updateObstacles(dt);
    if(now>=state.nextSpawn){spawnObstacle();state.nextSpawn=now+(800+Math.random()*900)/state.obstacleRate}
    if(state.distance>=state.nextQuestion){state.nextQuestion+=520;spawnCheckpoint()}
    if(state.distance>=state.nextFork){state.nextFork+=1100;showFork()}
    if(state.fogUntil&&now>state.fogUntil){state.fogUntil=0;fog.classList.add('hidden')}
    updateHud();
  }
  raf=requestAnimationFrame(loop)
}
async function init(){
  try{questions=(await fetch('/arcade-review-games/social-studies/wwi-trench-run-v2/questions.json').then(r=>r.json())).questions}catch{questions=[{question:'Which factor is part of M.A.I.N.?',choices:['Militarism','Mercantilism','Migration','Monarchy'],answerIndex:0,explanation:'Militarism is one of the four M.A.I.N. causes.'}]}
}

document.querySelector('#startBtn').onclick=reset;
document.querySelector('#pauseBtn').onclick=()=>{if(!state.running)return;state.paused=!state.paused;showToast(state.paused?'Paused':'Resumed')};
document.querySelector('#leftBtn').onclick=()=>move(-1);document.querySelector('#rightBtn').onclick=()=>move(1);document.querySelector('#jumpBtn').onclick=jump;
document.querySelector('#safeFork').onclick=()=>chooseFork(false);document.querySelector('#riskFork').onclick=()=>chooseFork(true);
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1);if(e.key==='ArrowUp'||e.key.toLowerCase()==='w'||e.key===' ')jump();if(e.key.toLowerCase()==='p'&&state.running)state.paused=!state.paused});
let touchX=0;game.addEventListener('pointerdown',e=>touchX=e.clientX);game.addEventListener('pointerup',e=>{const d=e.clientX-touchX;if(Math.abs(d)>35)move(d>0?1:-1);else jump()});
init();updateHud();