import {createGame,clamp} from '../arcade-five/engine.js';
const root=document.querySelector('#avalanche-escape'), $=id=>root.querySelector('#'+id), canvas=$('canvas'), ctx=canvas.getContext('2d');
const game=createGame('avalanche-escape'), art={}, keys=new Set(), held=new Set();
let ready=false, last=0, clock=0, lean=0, previousX=300, drag=null, tracks=[], particles=[], complete=false, best=0, messageTimer=0, lastMessage='';
try{best=Number(localStorage.getItem('avalanche-escape-best'))||0;}catch{}
const start=$('start');start.disabled=true;start.textContent='PREPARING THE MOUNTAIN…';
Promise.all(['alpine-run','skier','snowball','rock','spruce'].map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{art[name]=im;resolve();};im.onerror=reject;im.src=`assets/${name}.webp`;}))).then(()=>{ready=true;start.disabled=false;start.textContent='DROP IN ↘';}).catch(()=>{start.textContent='RELOAD TO RETRY';$('description').textContent='The mountain artwork could not load. Reload this page to try again.';});
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}
new ResizeObserver(resize).observe(canvas);canvas.tabIndex=0;
function clearInput(){keys.clear();held.clear();drag=null;game.setInput(0);game.hold(false);}
function begin(){if(!ready)return;clearInput();game.start();tracks=[];particles=[];complete=false;previousX=300;lean=0;lastMessage='';messageTimer=0;$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';canvas.focus({preventScroll:true});}
start.addEventListener('click',()=>game.s?.phase==='paused'?resume():begin());
function showOverlay(title,description,label){$('title').textContent=title;$('description').textContent=description;start.textContent=label;$('overlay').hidden=false;}
function pause(){if(game.s?.phase!=='playing')return;game.pause();clearInput();showOverlay('TAKE A BREATHER.','Your run is paused. The mountain can wait.','BACK TO THE RUN ↘');$('pause').textContent='Resume';}
function resume(){clearInput();game.resume();$('overlay').hidden=true;$('pause').textContent='Pause';canvas.focus({preventScroll:true});}
$('pause').onclick=()=>game.s?.phase==='playing'?pause():resume();
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
const controlKeys=['ArrowLeft','ArrowRight','a','d','A','D',' '];
window.addEventListener('keydown',e=>{if(!controlKeys.includes(e.key)||game.s?.phase!=='playing'||/INPUT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();keys.add(e.key.toLowerCase());});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
for(const id of ['left','right','dash']){const b=$(id);b.addEventListener('pointerdown',e=>{if(game.s?.phase!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);held.add(id);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held.delete(id));}
function dragX(e){const r=canvas.getBoundingClientRect();return clamp((e.clientX-r.left)/r.width*600,45,555);}
canvas.addEventListener('pointerdown',e=>{if(game.s?.phase!=='playing')return;canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:dragX(e)};});
canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)drag.x=dragX(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null;});
function puff(x,y,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*110,vy:20+Math.random()*90,life:.4+Math.random()*.4});particles=particles.slice(-100);}
function sprite(name,x,y,w,angle=0,alpha=1){const im=art[name];if(!im)return;const h=w*im.height/im.width;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}
function shadow(x,y,r){ctx.fillStyle='#224c6d30';ctx.beginPath();ctx.ellipse(x+5,y+8,r,r*.38,0,0,Math.PI*2);ctx.fill();}
function gold(x,y,r){shadow(x,y,r);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(clock*2+y)*.12);ctx.fillStyle='#bd7517';ctx.strokeStyle='#70450e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.72,0);ctx.lineTo(0,r);ctx.lineTo(-r*.72,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffe29a';ctx.beginPath();ctx.moveTo(0,-r*.78);ctx.lineTo(r*.47,0);ctx.lineTo(0,r*.55);ctx.lineTo(-r*.47,0);ctx.closePath();ctx.fill();ctx.fillStyle='#fff9d9';ctx.fillRect(-2,-r*.45,4,r*.7);ctx.restore();}
// Bring distant terrain objects forward along the snow plane. The final 310
// world units use the engine's exact coordinates and radii for fair collisions.
function projectSlope(x,y,r=1){
 const depth=clamp((y+45)/385,0,1),scale=.2+.8*depth;
 return {x:300+(x-300)*scale,y:y>=340?y+60:200+200*Math.pow(depth,1.925),r:r*scale,scale};
}
function drawSlopeObject(o,t){
 if(o.hit)return;
 const p=projectSlope(o.x,o.y,o.r);
 ctx.save();ctx.globalAlpha=clamp((o.y+45)/65,0,1);
 if(o.type==='star')gold(p.x,p.y,p.r);
 else{shadow(p.x,p.y+p.r*.55,p.r);sprite(o.type==='snow'?'snowball':'rock',p.x,p.y,p.r*2.1,o.type==='snow'?t*.35+o.x:0);}
 ctx.restore();
}
function render(dt){
 const s=game.s, playing=s?.phase==='playing', t=s?.time||0, x=s?.x||300, dash=playing&&s.hold&&s.energy>.02;
 ctx.setTransform(canvas.width/600,0,0,canvas.height/650,0,0);ctx.clearRect(0,0,600,650);
 if(art['alpine-run']){const im=art['alpine-run'];ctx.drawImage(im,0,0,im.width,im.height,0,0,600,650);}else{ctx.fillStyle='#bedce5';ctx.fillRect(0,0,600,650);}
 // The detailed mountain is fixed; bounded trails, edge scenery and powder convey motion.
 const scroll=playing?t*105:0;
 for(let i=0;i<6;i++){const worldY=(i*140+scroll)%840-45,p=projectSlope(i%2?620:-20,worldY);sprite('spruce',p.x,p.y, (68+(i%3)*16)*p.scale,i%2?-.05:.05,.86);}
 for(const tr of tracks){if(playing)tr.y+=dt*(dash?190:105);ctx.strokeStyle=`rgba(74,120,145,${Math.max(0,.2*(1-(tr.y-500)/170))})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tr.x-7,tr.y);ctx.lineTo(tr.x-7+tr.dx,tr.y+11);ctx.moveTo(tr.x+7,tr.y);ctx.lineTo(tr.x+7+tr.dx,tr.y+11);ctx.stroke();}
 tracks=tracks.filter(p=>p.y<680);
 if(playing){tracks.push({x,y:508,dx:-lean*7});if(Math.random()<dt*(dash?90:28))puff(x+(Math.random()-.5)*25,526,1);}
 for(const o of [...(s?.objects||[])].sort((a,b)=>a.y-b.y))drawSlopeObject(o,t);
 const movement=(x-previousX)/Math.max(dt,.001);previousX=x;lean+=(clamp(movement/350,-1,1)-lean)*(1-Math.exp(-dt*12));
 shadow(x,510,20);sprite('skier',x,505,46,lean*.18,s?.inv>0?.55+Math.sin(clock*35)*.22:1);
 for(const p of particles){if(playing){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}ctx.fillStyle=`rgba(255,255,255,${Math.max(0,p.life)})`;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fill();}particles=particles.filter(p=>p.life>0);
 // A distant powder front grows without obscuring collision space.
 const front=ctx.createLinearGradient(0,40,0,150);front.addColorStop(0,'rgba(237,247,255,'+(0.25+t/110)+')');front.addColorStop(1,'rgba(237,247,255,0)');ctx.fillStyle=front;ctx.fillRect(0,40,600,110);
 for(let i=0;i<35;i++){const sx=(i*137+Math.sin(clock*.6+i)*14)%600,sy=(i*73+clock*(18+i%8*3))%650;ctx.fillStyle='#ffffffa0';ctx.beginPath();ctx.arc(sx,sy,i%3===0?1.8:.8,0,Math.PI*2);ctx.fill();}
}
function finish(){complete=true;clearInput();const s=game.s;best=Math.max(best,s.score);try{localStorage.setItem('avalanche-escape-best',String(best));}catch{}showOverlay('YOU MADE IT DOWN.',`${s.score} points · ${s.hits} hits · Personal best ${best}. Find a cleaner line on your next run.`,'RIDE AGAIN ↘');$('pause').disabled=true;window.dispatchEvent(new CustomEvent('sparks:minigame-complete',{detail:{gameId:'avalanche-escape',score:s.score,time:45}}));}
function frame(now){const dt=Math.min((now-last)/1000||0,1/20);last=now;clock+=dt;const s=game.s;
 if(s?.phase==='playing'){
  let direction=Number(keys.has('arrowright')||keys.has('d')||held.has('right'))-Number(keys.has('arrowleft')||keys.has('a')||held.has('left'));
  if(drag)direction=clamp((drag.x-s.x)/12,-1,1);game.setInput(direction);game.hold(keys.has(' ')||held.has('dash'));
  const hits=s.hits;game.tick(dt);if(s.hits>hits)puff(s.x,500,28);
  if(s.message!==lastMessage){lastMessage=s.message;messageTimer=2;}$('time').textContent=(45-s.time).toFixed(1);$('score').textContent=Math.floor(s.score);$('hits').textContent=s.hits;$('energy').style.transform=`scaleX(${s.energy})`;$('energy-label').textContent=Math.round(s.energy*100)+'%';
  messageTimer-=dt;$('message').textContent=messageTimer>0&&s.message!=='READY'?s.message:'READ THE SLOPE. FIND YOUR LINE.';
  if(s.phase==='finished'&&!complete)finish();
 }
 render(dt);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
