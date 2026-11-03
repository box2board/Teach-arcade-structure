const PATHS={
  character:id=>`assets/individual/character/${id}.svg`,
  terrain:id=>`assets/individual/terrain/${id}.svg`,
  obstacle:id=>`assets/individual/obstacles-props/${id}.svg`,
  background:id=>`assets/individual/backgrounds/${id}.svg`
};
const ATLAS_SPECS=[
  {url:'assets/runtime/character-atlas.webp',columns:3,rows:4,cells:[
    ['soldier-idle',0,0],['soldier-run-1',1,0],['soldier-run-2',2,0],
    ['soldier-run-3',0,1],['soldier-run-4',1,1],['soldier-run-5',2,1],
    ['soldier-run-6',0,2],['soldier-jump-airborne',1,2],['soldier-stumble',2,2],
    ['soldier-fall',0,3],['soldier-landing',1,3],['soldier-recovery',2,3]
  ]},
  {url:'assets/runtime/obstacle-atlas.webp',columns:2,rows:2,cells:[
    ['low-barrier',0,0],['barbed-wire',1,0],['crater-small',0,1],['broken-timber',1,1]
  ]},
  {url:'assets/runtime/terrain-atlas.webp',columns:2,rows:2,cells:[
    ['trench-wall',0,0],['surface-duckboards',1,0],['checkpoint-base',0,1],['sandbag-stack',1,1]
  ]},
  {url:'assets/runtime/props-atlas.webp',columns:3,rows:2,cells:[
    ['dead-tree',0,0],['ammo-crate',1,0],['ladder',2,0],
    ['lantern',0,1],['trench-sign',1,1],['damaged-sandbags',2,1]
  ]},
  {url:'assets/runtime/background-atlas.webp',columns:1,rows:4,cells:[
    ['bg-sky-clouds',0,0],['bg-distant-battlefield',0,1],['bg-ruined-trees-craters',0,2],['bg-trench-silhouettes',0,3]
  ]}
];
const ASSETS={};
const game=document.querySelector('#game'),world=document.querySelector('#world'),decorBack=document.querySelector('#decorBack'),decorFront=document.querySelector('#decorFront'),floorDetailLayer=document.querySelector('#floorDetailLayer'),player=document.querySelector('#player'),playerShadow=document.querySelector('#playerShadow'),fog=document.querySelector('#fog'),toast=document.querySelector('#toast'),particles=document.querySelector('#particles'),distanceEl=document.querySelector('#distance'),scoreEl=document.querySelector('#score'),staminaEl=document.querySelector('#stamina'),accuracyEl=document.querySelector('#accuracy'),streakEl=document.querySelector('#streak'),qModal=document.querySelector('#questionModal'),qText=document.querySelector('#questionText'),choices=document.querySelector('#choices'),explanation=document.querySelector('#explanation'),forkModal=document.querySelector('#forkModal');
const laneCenter=[16.667,50,83.333];
const PHASES=[
  {id:1,min:0,label:'Early trench',decorEvery:[1500,2200],floorEvery:[1000,1500]},
  {id:2,min:550,label:'Active sector',decorEvery:[1150,1800],floorEvery:[850,1300]},
  {id:3,min:1100,label:'Damaged trench',decorEvery:[900,1450],floorEvery:[700,1100]},
  {id:4,min:1650,label:'Ruined forward trench',decorEvery:[760,1250],floorEvery:[620,980]}
];
const state={running:false,paused:false,lane:1,distance:0,score:0,stamina:3,correct:0,total:0,streak:0,speed:.19,jumping:false,last:0,nextSpawn:0,nextQuestion:420,nextFork:900,obstacleRate:1,fogUntil:0,runFrame:0,runTimer:0,nextDust:0,nextDecor:0,nextFloor:0,phase:1};
let obstacles=[],scenery=[],floorDetails=[],questions=[],questionIndex=0,raf=0;
const obstacleDefs=[
  {id:'low-barrier',cls:'',jumpable:true,damage:1,hitStart:61,hitEnd:82},
  {id:'barbed-wire',cls:'wire',jumpable:true,damage:1,hitStart:60,hitEnd:82},
  {id:'crater-small',cls:'crater',jumpable:false,damage:1,hitStart:64,hitEnd:84},
  {id:'broken-timber',cls:'',jumpable:false,damage:1,hitStart:60,hitEnd:82}
];
const decorByPhase={
  1:[['support-post','terrain'],['lantern','terrain'],['ammo-crate','obstacle'],['trench-sign','obstacle']],
  2:[['support-post','terrain'],['lantern','terrain'],['ladder','terrain'],['crate-stack','obstacle'],['damaged-sandbags','obstacle'],['trench-sign','obstacle']],
  3:[['support-post','terrain'],['ladder','terrain'],['damaged-sandbags','obstacle'],['dead-tree','obstacle'],['broken-boards','obstacle'],['ammo-crate','obstacle']],
  4:[['support-post','terrain'],['lantern','terrain'],['damaged-sandbags','obstacle'],['dead-tree','obstacle'],['broken-boards','obstacle'],['fork-sign','obstacle'],['crate-stack','obstacle']]
};
const floorIds=['surface-puddle','surface-ruts','surface-duckboards','surface-mud'];
function asset(id,category){return ASSETS[id]||PATHS[category](id)}
function sprite(id,cls='',category='obstacle'){const img=new Image();img.src=asset(id,category);img.alt='';img.draggable=false;img.classList.add('asset-'+id,...cls.split(' ').filter(Boolean));return img}
function setPlayer(id){player.src=asset(id,'character')}
function laneX(lane){return laneCenter[lane]}
function randomBetween([a,b]){return a+Math.random()*(b-a)}
function currentPhase(){let p=PHASES[0];for(const phase of PHASES)if(state.distance>=phase.min)p=phase;return p}
function setLaneVisual(lane){const x=laneX(lane)+'%';player.style.left=x;playerShadow.style.left=x}
function updateHud(){distanceEl.textContent=Math.floor(state.distance);scoreEl.textContent=Math.floor(state.score);staminaEl.textContent=state.stamina;accuracyEl.textContent=(state.total?Math.round(state.correct/state.total*100):100)+'%';streakEl.textContent=state.streak}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1100)}
function burst(x=50,y=78,count=8){for(let i=0;i<count;i++){const p=document.createElement('i');p.className='particle';p.style.left=x+'%';p.style.top=y+'%';p.style.setProperty('--dx',(Math.random()*50-25)+'px');p.style.setProperty('--dy',(-15-Math.random()*40)+'px');particles.append(p);setTimeout(()=>p.remove(),760)}}
function clearScene(){
  obstacles.forEach(o=>{o.el.remove();o.glow?.remove()});
  scenery.forEach(o=>o.el.remove());
  floorDetails.forEach(o=>o.el.remove());
  obstacles=[];scenery=[];floorDetails=[];particles.innerHTML='';decorBack.innerHTML='';decorFront.innerHTML='';floorDetailLayer.innerHTML='';
}
function updatePhase(force=false){
  const phase=currentPhase();
  if(!force&&phase.id===state.phase)return;
  state.phase=phase.id;game.classList.remove('phase-1','phase-2','phase-3','phase-4');game.classList.add(`phase-${phase.id}`);
  if(!force&&state.running)showToast(phase.label);
}
function reset(){
  clearScene();
  Object.assign(state,{running:true,paused:false,lane:1,distance:0,score:0,stamina:3,correct:0,total:0,streak:0,speed:.19,jumping:false,last:performance.now(),nextSpawn:performance.now()+1050,nextQuestion:420,nextFork:900,obstacleRate:1,fogUntil:0,runFrame:0,runTimer:0,nextDust:performance.now()+180,nextDecor:performance.now()+900,nextFloor:performance.now()+600,phase:1});
  updatePhase(true);setLaneVisual(1);playerShadow.classList.remove('jump');setPlayer('soldier-run-1');fog.classList.add('hidden');qModal.classList.add('hidden');forkModal.classList.add('hidden');updateHud();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)
}
function move(dir){if(!state.running||state.paused)return;const next=Math.max(0,Math.min(2,state.lane+dir));if(next===state.lane)return;state.lane=next;setLaneVisual(state.lane);burst(laneX(state.lane),84,4)}
function jump(){if(!state.running||state.paused||state.jumping)return;state.jumping=true;player.classList.add('jump');playerShadow.classList.add('jump');setPlayer('soldier-jump-airborne');burst(laneX(state.lane),84,7);setTimeout(()=>{state.jumping=false;player.classList.remove('jump');playerShadow.classList.remove('jump');if(state.running)setPlayer('soldier-run-1');burst(laneX(state.lane),84,6)},620)}
function spawnObstacle(){const def=obstacleDefs[Math.floor(Math.random()*obstacleDefs.length)],lane=Math.floor(Math.random()*3),el=sprite(def.id,'obstacle '+def.cls);el.style.left=laneX(lane)+'%';world.append(el);obstacles.push({el,lane,y:-28,def,hit:false})}
function spawnCheckpoint(){
  const lane=state.lane,el=sprite('checkpoint-base','checkpoint','terrain'),glow=document.createElement('i');
  el.style.left=laneX(lane)+'%';glow.className='checkpoint-glow';glow.style.left=laneX(lane)+'%';world.append(glow,el);obstacles.push({el,glow,lane,y:-28,checkpoint:true,hit:false});
  spawnSpecificDecor('sandbag-stack','terrain','left',-22);spawnSpecificDecor('sandbag-stack','terrain','right',-22);spawnSpecificDecor('lantern','terrain',Math.random()<.5?'left':'right',-28);
}
function spawnSpecificDecor(id,category,side,y=-26){
  const el=sprite(id,`trench-decor side-${side}`,category);const layer=id==='dead-tree'?decorBack:decorFront;layer.append(el);scenery.push({el,y,side,id});
}
function spawnDecor(){
  const options=decorByPhase[state.phase]||decorByPhase[1];const [id,category]=options[Math.floor(Math.random()*options.length)],side=Math.random()<.5?'left':'right';
  spawnSpecificDecor(id,category,side,-26-Math.random()*8);
  if(state.phase>=3&&Math.random()<.22){const pairSide=side==='left'?'right':'left';const [id2,cat2]=options[Math.floor(Math.random()*options.length)];spawnSpecificDecor(id2,cat2,pairSide,-34-Math.random()*6)}
}
function spawnFloorDetail(){
  const id=floorIds[Math.floor(Math.random()*floorIds.length)],lane=Math.floor(Math.random()*3),el=sprite(id,'floor-detail','terrain');
  el.style.left=laneX(lane)+'%';floorDetailLayer.append(el);floorDetails.push({el,y:-20,lane,id});
}
function hit(o){
  if(o.hit)return;o.hit=true;
  if(o.checkpoint){o.el.remove();o.glow?.remove();showQuestion();return}
  if(state.jumping&&o.def.jumpable)return;
  state.stamina=Math.max(0,state.stamina-o.def.damage);state.streak=0;player.classList.add('hit');setPlayer('soldier-stumble');burst(laneX(state.lane),77,12);setTimeout(()=>{player.classList.remove('hit');if(state.running)setPlayer('soldier-run-1')},340);showToast('Obstacle hit — stamina lost');
  if(state.stamina<=0){state.running=false;setPlayer('soldier-fall');showToast('Run ended')}
}
function showQuestion(){state.paused=true;const q=questions[questionIndex++%questions.length];if(!q){state.paused=false;return}qText.textContent=q.question;choices.innerHTML='';explanation.textContent='';q.choices.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c;b.onclick=()=>answer(q,i,b);choices.append(b)});qModal.classList.remove('hidden')}
function answer(q,i,b){[...choices.children].forEach(x=>x.disabled=true);state.total++;const ok=i===q.answerIndex;if(ok){state.correct++;state.streak++;state.score+=150;b.classList.add('correct');explanation.textContent='Correct — '+q.explanation;showToast('Correct! +150')}else{state.streak=0;state.stamina=Math.max(0,state.stamina-1);b.classList.add('wrong');choices.children[q.answerIndex]?.classList.add('correct');explanation.textContent='Incorrect — '+q.explanation;state.fogUntil=performance.now()+7000;fog.classList.remove('hidden')}updateHud();setTimeout(()=>{qModal.classList.add('hidden');state.paused=false;if(state.stamina<=0){state.running=false;setPlayer('soldier-fall')}},1100)}
function showFork(){state.paused=true;forkModal.classList.remove('hidden')}
function chooseFork(risky){state.obstacleRate=risky?1.35:.78;state.score+=risky?200:50;forkModal.classList.add('hidden');state.paused=false;showToast(risky?'Risk route: 1.35× obstacles':'Safer route selected');setTimeout(()=>state.obstacleRate=1,9000)}
function animatePlayer(dt){if(state.jumping)return;state.runTimer+=dt;if(state.runTimer>96){state.runTimer=0;state.runFrame=(state.runFrame+1)%6;setPlayer('soldier-run-'+(state.runFrame+1))}}
function moveParallax(dt){document.querySelectorAll('.parallax').forEach((el,i)=>{const n=parseFloat(el.dataset.x||0)+dt*state.speed;el.dataset.x=n;const x=Math.sin(n*.0025+i*.9)*(i+1)*1.1;const y=Math.sin(n*.0017+i*.7)*.45;el.style.transform=`translate(${x}px,${y}px)`})}
function updateObstacles(dt){
  for(const o of obstacles){
    o.y+=dt*state.speed*.12;o.el.style.top=o.y+'%';
    const progress=Math.max(0,Math.min(1,(o.y+28)/122)),scale=.7+progress*.42;o.el.style.transform=`translateX(-50%) scale(${scale})`;o.el.style.opacity=String(.5+progress*.5);
    if(o.glow){o.glow.style.top=(o.y+7)+'%';o.glow.style.transform=`translateX(-50%) scale(${scale})`;o.glow.style.opacity=String(.25+progress*.45)}
    const start=o.checkpoint?61:o.def.hitStart,end=o.checkpoint?83:o.def.hitEnd;if(o.y>start&&o.y<end&&o.lane===state.lane)hit(o)
  }
  obstacles=obstacles.filter(o=>{if(o.y>108){o.el.remove();o.glow?.remove();return false}return true})
}
function updateScenery(dt){
  for(const o of scenery){o.y+=dt*state.speed*.095;o.el.style.top=o.y+'%';const progress=Math.max(0,Math.min(1,(o.y+26)/126)),scale=.66+progress*.55;o.el.style.transform=`translateX(-50%) scale(${scale})`;o.el.style.opacity=String(.38+progress*.48)}
  scenery=scenery.filter(o=>{if(o.y>108){o.el.remove();return false}return true});
  for(const o of floorDetails){o.y+=dt*state.speed*.105;o.el.style.top=o.y+'%';const progress=Math.max(0,Math.min(1,(o.y+20)/122));o.el.style.scale=String(.72+progress*.55);o.el.style.opacity=String(.22+progress*.42)}
  floorDetails=floorDetails.filter(o=>{if(o.y>106){o.el.remove();return false}return true})
}
function ambientDust(now){if(now<state.nextDust||state.paused)return;state.nextDust=now+190+Math.random()*260;burst(laneX(state.lane),85,2)}
function updateEnvironment(now,dt){
  updatePhase();updateScenery(dt);const phase=currentPhase();
  if(now>=state.nextDecor){spawnDecor();state.nextDecor=now+randomBetween(phase.decorEvery)}
  if(now>=state.nextFloor){spawnFloorDetail();state.nextFloor=now+randomBetween(phase.floorEvery)}
}
function loop(now){
  if(!state.running)return;const dt=Math.min(40,now-state.last||16);state.last=now;
  if(!state.paused){
    state.distance+=dt*state.speed*.015;state.score+=dt*state.speed*.01;state.speed=Math.min(.215,.19+state.distance*.000012);
    animatePlayer(dt);moveParallax(dt);updateObstacles(dt);updateEnvironment(now,dt);ambientDust(now);
    if(now>=state.nextSpawn){spawnObstacle();state.nextSpawn=now+(900+Math.random()*1000)/state.obstacleRate}
    if(state.distance>=state.nextQuestion){state.nextQuestion+=520;spawnCheckpoint()}
    if(state.distance>=state.nextFork){state.nextFork+=1100;showFork()}
    if(state.fogUntil&&now>state.fogUntil){state.fogUntil=0;fog.classList.add('hidden')}
    updateHud()
  }
  raf=requestAnimationFrame(loop)
}
async function cropAsset(image,column,row,columns,rows){const x0=Math.round(column*image.naturalWidth/columns),x1=Math.round((column+1)*image.naturalWidth/columns),y0=Math.round(row*image.naturalHeight/rows),y1=Math.round((row+1)*image.naturalHeight/rows),canvas=document.createElement('canvas');canvas.width=x1-x0;canvas.height=y1-y0;canvas.getContext('2d').drawImage(image,x0,y0,x1-x0,y1-y0,0,0,canvas.width,canvas.height);return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(URL.createObjectURL(blob)):reject(new Error('Artwork crop failed')),'image/png'))}
async function decodeAtlas(url){const response=await fetch(url);if(!response.ok)throw new Error(`Artwork atlas unavailable (${response.status}): ${url}`);const objectUrl=URL.createObjectURL(await response.blob()),image=new Image();image.src=objectUrl;await image.decode();return{image,objectUrl}}
async function loadRuntimeArt(){try{await Promise.all(ATLAS_SPECS.map(async spec=>{const{image,objectUrl}=await decodeAtlas(spec.url);try{await Promise.all(spec.cells.map(async([id,column,row])=>{ASSETS[id]=await cropAsset(image,column,row,spec.columns,spec.rows)}))}finally{URL.revokeObjectURL(objectUrl)}}));Object.assign(ASSETS,{'crate-stack':ASSETS['ammo-crate'],'fork-sign':ASSETS['trench-sign'],'broken-boards':ASSETS['broken-timber'],'crater-large':ASSETS['crater-small'],'soldier-jump-takeoff':ASSETS['soldier-jump-airborne']});player.src=ASSETS['soldier-idle'];const ids=['bg-sky-clouds','bg-distant-battlefield','bg-ruined-trees-craters','bg-trench-silhouettes'];document.querySelectorAll('.parallax img').forEach((img,i)=>{img.src=ASSETS[ids[i]]});document.querySelectorAll('.duckboard').forEach(board=>{board.style.backgroundImage=`url("${ASSETS['surface-duckboards']}")`});document.body.classList.add('runtime-art-ready')}catch(error){console.error('Runtime art could not be loaded; using stable individual fallbacks.',error);document.body.dataset.artStatus='fallback'}}
async function loadQuestions(){try{questions=(await fetch('/arcade-review-games/social-studies/wwi-trench-run-v2/questions.json').then(r=>r.json())).questions}catch{questions=[{question:'Which factor is part of M.A.I.N.?',choices:['Militarism','Mercantilism','Migration','Monarchy'],answerIndex:0,explanation:'Militarism is one of the four M.A.I.N. causes.'}]}}
async function init(){setLaneVisual(1);updatePhase(true);await Promise.allSettled([loadRuntimeArt(),loadQuestions()]);updateHud()}
document.querySelector('#startBtn').addEventListener('click',reset);document.querySelector('#pauseBtn').addEventListener('click',()=>{if(!state.running)return;state.paused=!state.paused;showToast(state.paused?'Paused':'Resumed')});document.querySelector('#leftBtn').addEventListener('click',()=>move(-1));document.querySelector('#rightBtn').addEventListener('click',()=>move(1));document.querySelector('#jumpBtn').addEventListener('click',jump);document.querySelector('#safeFork').addEventListener('click',()=>chooseFork(false));document.querySelector('#riskFork').addEventListener('click',()=>chooseFork(true));window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1);if(e.key==='ArrowUp'||e.key.toLowerCase()==='w'||e.key===' ')jump();if(e.key.toLowerCase()==='p'&&state.running)state.paused=!state.paused});let touchX=0;game.addEventListener('pointerdown',e=>touchX=e.clientX);game.addEventListener('pointerup',e=>{const d=e.clientX-touchX;if(Math.abs(d)>35)move(d>0?1:-1);else jump()});init();
