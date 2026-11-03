const canvas=document.querySelector('#scene');
const ctx=canvas.getContext('2d');
const game=document.querySelector('#game');
const toast=document.querySelector('#toast');
const playerFrames=[];
const art={};
const ui={
  distance:document.querySelector('#distance'),score:document.querySelector('#score'),stamina:document.querySelector('#stamina'),
  accuracy:document.querySelector('#accuracy'),streak:document.querySelector('#streak'),
  questionModal:document.querySelector('#questionModal'),questionText:document.querySelector('#questionText'),
  choices:document.querySelector('#choices'),explanation:document.querySelector('#explanation'),forkModal:document.querySelector('#forkModal')
};
const W=960,H=420,GROUND=355,FINISH=3850;
const keys={left:false,right:false};
const questionFallback=[{question:'Which factor is part of M.A.I.N.?',choices:['Militarism','Mercantilism','Migration','Monarchy'],answerIndex:0,explanation:'Militarism is one of the four M.A.I.N. causes.'}];
let questions=questionFallback,questionIndex=0,raf=0,last=0,toastTimer=0;
let state={running:false,paused:false,x:110,y:0,vy:0,jumpHeight:0,stamina:3,score:0,distance:0,correct:0,total:0,streak:0,runTime:0,frame:0,camera:0,phase:1,forkShown:false,nextFork:2100,nextQuestion:1200,nextHazard:0,rate:1,hitUntil:0};
let hazards=[],scenery=[],dust=[];
const obstacleDefs=[
  {id:'low-barrier',w:126,h:80,kind:'barrier',damage:1},
  {id:'barbed-wire',w:148,h:95,kind:'wire',damage:1},
  {id:'crater-small',w:130,h:68,kind:'crater',damage:1},
  {id:'broken-timber',w:132,h:86,kind:'timber',damage:1}
];
const initialHazards=[
  [570,'low-barrier'],[890,'barbed-wire'],[1210,'crater-small'],[1540,'broken-timber'],
  [1950,'low-barrier'],[2260,'barbed-wire'],[2570,'crater-small'],[2900,'broken-timber'],[3240,'low-barrier'],[3540,'barbed-wire']
];
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1250)}
function updateHud(){ui.distance.textContent=Math.floor(state.distance);ui.score.textContent=Math.floor(state.score);ui.stamina.textContent=state.stamina;ui.accuracy.textContent=state.total?Math.round(state.correct/state.total*100)+'%':'100%';ui.streak.textContent=state.streak}
function makeCrop(image,cx,cy,cw,ch,trim=false){
  const tile=document.createElement('canvas');tile.width=cw;tile.height=ch;tile.getContext('2d').drawImage(image,cx,cy,cw,ch,0,0,cw,ch);
  if(!trim)return tile;
  const c=tile.getContext('2d'),data=c.getImageData(0,0,cw,ch).data;let minX=cw,minY=ch,maxX=-1,maxY=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){if(data[(y*cw+x)*4+3]>105){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
  if(maxX<0)return tile;const pad=5;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(cw-1,maxX+pad);maxY=Math.min(ch-1,maxY+pad);
  const out=document.createElement('canvas');out.width=maxX-minX+1;out.height=maxY-minY+1;out.getContext('2d').drawImage(tile,minX,minY,out.width,out.height,0,0,out.width,out.height);return out;
}
async function decode(url){const image=new Image();image.src=url;await image.decode();return image}
function trimTop(img,pixels){const out=document.createElement('canvas');out.width=img.width;out.height=img.height-pixels;out.getContext('2d').drawImage(img,0,pixels,img.width,out.height,0,0,out.width,out.height);return out}
async function loadAtlas(url,cols,rows,trim=false){const image=await decode(url),out=[];const cw=image.naturalWidth/cols,ch=image.naturalHeight/rows;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)out.push(makeCrop(image,Math.round(x*cw),Math.round(y*ch),Math.round(cw),Math.round(ch),trim));return out}
async function loadArt(){
  const [characters,obstacles,terrain,props,backgrounds,floor]=await Promise.all([
    loadAtlas('assets/runtime/character-atlas.webp',3,4,true),loadAtlas('assets/runtime/obstacle-atlas.webp',2,2,true),
    loadAtlas('assets/runtime/terrain-atlas.webp',2,2,true),loadAtlas('assets/runtime/props-atlas.webp',3,2,true),
    loadAtlas('assets/runtime/background-atlas.webp',1,4,false),decode('assets/runtime/side-floor.webp')
  ]);
  playerFrames.push(characters[0],...characters.slice(1,7));
  art.jump=characters[7];art.stumble=characters[8];art.fall=characters[9];art.land=characters[10];art.recover=characters[11];
  art.barrier=obstacles[0];art.wire=obstacles[1];art.crater=obstacles[2];art.timber=obstacles[3];
  art.trenchWall=terrain[0];art.duckboards=terrain[1];art.checkpoint=terrain[2];art.sandbags=terrain[3];
  art.tree=props[0];art.crate=props[1];art.ladder=props[2];art.lantern=props[3];art.sign=props[4];art.damage=props[5];
  art.sky=backgrounds[0];art.far=trimTop(backgrounds[1],88);art.mid=trimTop(backgrounds[2],12);art.near=trimTop(backgrounds[3],42);art.floor=floor;
}
function reset(){
  cancelAnimationFrame(raf);hazards=initialHazards.map(([x,id])=>({x,id,hit:false,def:obstacleDefs.find(d=>d.id===id)}));
  scenery=[{x:280,id:'crate'},{x:1040,id:'ladder'},{x:1740,id:'lantern'},{x:2380,id:'tree'},{x:3020,id:'crate'},{x:3440,id:'damage'}];dust=[];
  Object.assign(state,{running:true,paused:false,x:110,y:0,vy:0,jumpHeight:0,stamina:3,score:0,distance:0,correct:0,total:0,streak:0,runTime:0,frame:0,camera:0,phase:1,forkShown:false,nextFork:2100,nextQuestion:1200,nextHazard:0,rate:1,hitUntil:0});
  keys.left=keys.right=false;ui.questionModal.classList.add('hidden');ui.forkModal.classList.add('hidden');toast.classList.remove('show');updateHud();last=performance.now();raf=requestAnimationFrame(loop);
}
function movePlayer(dt){
  if(performance.now()<state.hitUntil)return;
  const dir=(keys.right?1:0)-(keys.left?1:0),speed=290;
  if(dir){state.x+=dir*speed*dt;state.runTime+=dt*10;state.frame=Math.floor(state.runTime)%6+1}else state.frame=0;
  state.x=Math.max(50,Math.min(FINISH,state.x));
  if(state.vy||state.jumpHeight>0){state.jumpHeight+=state.vy*dt;state.vy-=1500*dt;if(state.jumpHeight<=0){state.jumpHeight=0;state.vy=0;showDust(state.x,GROUND)}}
  state.camera=Math.max(0,Math.min(FINISH-W+250,state.x-245));state.distance=Math.floor(state.x-110);state.score=Math.max(state.score,state.distance*.08+state.correct*150);
}
function jump(){if(!state.running||state.paused||state.jumpHeight>0)return;state.vy=590;showDust(state.x,GROUND)}
function showDust(x,y){for(let i=0;i<5;i++)dust.push({x:x+(Math.random()-.5)*22,y:y-5,vx:(Math.random()-.5)*45,vy:-20-Math.random()*35,life:.45,size:3+Math.random()*4})}
function collide(){
  const px=state.x+25,py=GROUND-state.jumpHeight;
  for(const hazard of hazards){if(hazard.hit)continue;const d=hazard.def;if(px+47<hazard.x+18||px+8>hazard.x+d.w-14)continue;if(py<GROUND-55)continue;
    hazard.hit=true;state.stamina=Math.max(0,state.stamina-d.damage);state.streak=0;state.hitUntil=performance.now()+280;showToast('Obstacle hit — stamina lost');showDust(state.x,GROUND);updateHud();
    if(state.stamina<=0){state.running=false;state.paused=true;showToast('Run ended')};break;
  }
}
function triggerCheckpoint(){state.paused=true;const q=questions[questionIndex++%questions.length];ui.questionText.textContent=q.question;ui.choices.replaceChildren();ui.explanation.textContent='';q.choices.forEach((text,index)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=text;btn.addEventListener('click',()=>answer(q,index,btn),{once:true});ui.choices.append(btn)});ui.questionModal.classList.remove('hidden')}
function answer(q,index,btn){[...ui.choices.children].forEach(x=>x.disabled=true);state.total++;const ok=index===q.answerIndex;if(ok){state.correct++;state.streak++;state.score+=150;btn.classList.add('correct');ui.explanation.textContent='Correct — '+q.explanation}else{state.streak=0;state.stamina=Math.max(0,state.stamina-1);btn.classList.add('wrong');ui.choices.children[q.answerIndex]?.classList.add('correct');ui.explanation.textContent='Incorrect — '+q.explanation}updateHud();setTimeout(()=>{ui.questionModal.classList.add('hidden');state.paused=false;if(state.stamina<=0){state.running=false;state.paused=true;showToast('Run ended')}drawWorld()},1000)}
function triggerFork(){state.paused=true;ui.forkModal.classList.remove('hidden')}
function chooseFork(risky){state.rate=risky?1.28:.82;state.score+=risky?200:50;if(risky){for(const [i,id] of ['barbed-wire','broken-timber','low-barrier'].entries()){const def=obstacleDefs.find(d=>d.id===id);hazards.push({x:2390+i*390,id,hit:false,def})}}ui.forkModal.classList.add('hidden');state.paused=false;showToast(risky?'Risk route: extra hazards and bonus score':'Safer route selected');}
function drawImage(img,x,y,w,h,flip=false){if(!img)return;ctx.save();if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,h)}else ctx.drawImage(img,x,y,w,h);ctx.restore()}
const layerBuffers=new Map();
function tileLayer(img,y,h,factor,cam,alpha=1,fadeTop=.2){
  if(!img)return;let buffer=layerBuffers.get(img);if(!buffer){buffer=document.createElement('canvas');buffer.width=W;buffer.height=h;layerBuffers.set(img,buffer)}
  const layer=buffer.getContext('2d');layer.clearRect(0,0,W,h);const dw=h*img.width/img.height,off=(cam*factor)%(dw*2);
  for(let x=-off-dw;x<W+dw;x+=dw*2){layer.drawImage(img,x,0,dw,h);layer.save();layer.translate(x+2*dw,0);layer.scale(-1,1);layer.drawImage(img,0,0,dw,h);layer.restore()}
  layer.globalCompositeOperation='destination-in';const mask=layer.createLinearGradient(0,0,0,h);mask.addColorStop(0,'rgba(255,255,255,0)');mask.addColorStop(fadeTop,'rgba(255,255,255,1)');mask.addColorStop(1,'rgba(255,255,255,1)');layer.fillStyle=mask;layer.fillRect(0,0,W,h);layer.globalCompositeOperation='source-over';
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(buffer,0,y);ctx.restore();
}
function drawBackground(){
  ctx.fillStyle='#7d8b94';ctx.fillRect(0,0,W,H);
  if(art.sky)drawImage(art.sky,0,0,W,210);
  tileLayer(art.far,58,152,.09,state.camera,.94,.24);
  tileLayer(art.mid,120,190,.22,state.camera,.93,.22);
  tileLayer(art.near,165,220,.48,state.camera,.98,.18);
  if(art.floor){const h=205,w=h*art.floor.width/art.floor.height,offsetX=(state.camera*.94)%(w*2),top=GROUND-132;ctx.save();ctx.beginPath();ctx.rect(0,top-2,W,H-(top-2));ctx.clip();for(let x=-offsetX-w;x<W+w;x+=w*2){drawImage(art.floor,x,top,w,h);drawImage(art.floor,x+w,top,w,h,true)}ctx.restore()}
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(28,36,42,.05)');g.addColorStop(1,'rgba(23,20,17,.26)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawProps(){
  for(const prop of scenery){const x=prop.x-state.camera;if(x<-180||x>W+180)continue;let img=art[prop.id],w=prop.id==='tree'?128:prop.id==='ladder'?74:prop.id==='lantern'?50:prop.id==='damage'?94:78,h=prop.id==='tree'?150:prop.id==='ladder'?128:prop.id==='lantern'?80:prop.id==='damage'?82:68;drawImage(img,x,GROUND-h,w,h)}
  for(const d of dust){const x=d.x-state.camera;ctx.globalAlpha=Math.max(0,d.life/.45)*.62;ctx.fillStyle='#b6a18a';ctx.beginPath();ctx.ellipse(x,d.y,d.size*1.3,d.size*.75,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
}
function drawHazards(){for(const h of hazards){const x=h.x-state.camera;if(x<-220||x>W+220||h.hit)continue;const img=art[h.def.kind],y=GROUND-h.def.h;drawImage(img,x,y,h.def.w,h.def.h);ctx.fillStyle='rgba(15,12,9,.25)';ctx.beginPath();ctx.ellipse(x+h.def.w*.5,GROUND-2,h.def.w*.46,6,0,0,Math.PI*2);ctx.fill()}}
function drawPlayer(){
  let img=playerFrames[state.frame]||playerFrames[0];if(performance.now()<state.hitUntil)img=art.stumble||img;if(!state.running&&state.stamina<=0)img=art.fall||img;
  const height=142,ratio=img?img.width/img.height:1.2,width=Math.min(178,height*ratio),x=state.x-state.camera-28,y=GROUND-height-state.jumpHeight;
  ctx.fillStyle=`rgba(17,13,10,${Math.max(.16,.36-state.jumpHeight/900)})`;ctx.beginPath();ctx.ellipse(state.x-state.camera+31,GROUND-3,34*(1-Math.min(.4,state.jumpHeight/350)),8,0,0,Math.PI*2);ctx.fill();drawImage(img,x,y,width,height);
}
function drawWorld(){drawBackground();drawProps();drawHazards();drawPlayer();
  if(state.x>=FINISH-20){ctx.fillStyle='rgba(20,18,15,.55)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff3d4';ctx.font='bold 38px system-ui';ctx.textAlign='center';ctx.fillText('TRENCH RUN COMPLETE',W/2,H/2)}else if(!state.running&&state.stamina<=0){ctx.fillStyle='rgba(20,18,15,.54)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff3d4';ctx.font='bold 34px system-ui';ctx.textAlign='center';ctx.fillText('RUN ENDED — START TO RETRY',W/2,H/2)}
  if(state.paused&&state.running&&!ui.questionModal.classList.contains('hidden')===false&&!ui.forkModal.classList.contains('hidden')===false){/* modal is rendered in HTML */}
}
function loop(now){if(!state.running)return;const dt=Math.min(.04,(now-last)/1000||.016);last=now;if(!state.paused){movePlayer(dt);collide();
  if(state.x>=state.nextQuestion){state.nextQuestion+=1350;triggerCheckpoint()}
  if(state.x>=state.nextFork&&!state.forkShown){state.forkShown=true;state.nextFork=Infinity;triggerFork()}
  if(state.x>=FINISH){state.running=false;state.paused=true;showToast('Trench Run complete!')}
  dust=dust.filter(p=>p.life>0);for(const p of dust){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt}
  updateHud();}
  drawWorld();raf=requestAnimationFrame(loop)
}
function bindHold(id,key){const b=document.querySelector('#'+id);const down=e=>{e.preventDefault();if(!state.running)reset();keys[key]=true};const up=e=>{e.preventDefault();keys[key]=false};b.addEventListener('pointerdown',down);for(const event of ['pointerup','pointercancel','pointerleave'])b.addEventListener(event,up);b.addEventListener('click',e=>e.preventDefault())}
function bindJump(){const b=document.querySelector('#jumpBtn');b.addEventListener('pointerdown',e=>{e.preventDefault();if(!state.running)reset();jump()});b.addEventListener('click',e=>e.preventDefault())}
bindHold('leftBtn','left');bindHold('rightBtn','right');bindJump();
document.querySelector('#startBtn').addEventListener('click',reset);document.querySelector('#pauseBtn').addEventListener('click',()=>{if(!state.running)return;state.paused=!state.paused;showToast(state.paused?'Paused':'Resumed');last=performance.now()});
document.querySelector('#safeFork').addEventListener('click',()=>chooseFork(false));document.querySelector('#riskFork').addEventListener('click',()=>chooseFork(true));
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup',' ','a','d','w'].includes(key))e.preventDefault();if(key==='arrowleft'||key==='a')keys.left=true;if(key==='arrowright'||key==='d')keys.right=true;if(key==='arrowup'||key==='w'||key===' ')jump();if(key==='p'&&state.running){state.paused=!state.paused;last=performance.now()}});
window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(key==='arrowleft'||key==='a')keys.left=false;if(key==='arrowright'||key==='d')keys.right=false});
canvas.addEventListener('pointerdown',e=>{if(!state.running)reset();else if(!state.paused){const bounds=canvas.getBoundingClientRect();if(e.clientY<bounds.top+bounds.height*.55)jump();else{const rel=(e.clientX-bounds.left)/bounds.width;if(rel<.34)keys.left=true;else if(rel>.66)keys.right=true;else jump()}}});
canvas.addEventListener('pointerup',()=>{keys.left=keys.right=false});canvas.addEventListener('pointercancel',()=>{keys.left=keys.right=false});
fetch('/arcade-review-games/social-studies/wwi-trench-run-v2/questions.json').then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(Array.isArray(d.questions)&&d.questions.length)questions=d.questions}).catch(()=>{});
loadArt().then(()=>{drawWorld()}).catch(error=>{console.error('Artwork atlas failed to load',error);document.body.dataset.artStatus='fallback';drawWorld()});drawWorld();
