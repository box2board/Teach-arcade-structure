import * as THREE from '/assets/vendor/three-0.162.0/three.module.js';

const $ = id => document.getElementById(id);
const canvas = $('scene'), stage = $('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
} catch {
  $('title').textContent = '3D graphics unavailable';
  $('message').textContent = 'This device could not start WebGL. Try a browser with 3D graphics enabled.';
  $('start').disabled = true;
  throw new Error('WebGL initialization failed');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfdcec');
scene.fog = new THREE.Fog('#bfdcec', 28, 66);
const camera = new THREE.PerspectiveCamera(43,1,.1,100);
camera.position.set(0,19,25);camera.lookAt(0,0,-10);
scene.add(new THREE.HemisphereLight(0xe8f7ff,0x7894b1,2.5));
const sun = new THREE.DirectionalLight(0xfff5e6,3.1);sun.position.set(-12,24,8);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-17,right:17,top:25,bottom:-25,far:70});sun.shadow.bias=-.001;scene.add(sun);
const materials = {};
function mat(color){return materials[color] ||= new THREE.MeshStandardMaterial({color,roughness:.85});}
const sphere = new THREE.SphereGeometry(1,12,8), box = new THREE.BoxGeometry(1,1,1);
const cone = new THREE.ConeGeometry(1,1,8);
function mesh(geo,color,x,y,z,sx=1,sy=sx,sz=sx,parent=scene){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
mesh(box,'#e9f3fa',0,-.35,-18,120,.6,110);
mesh(box,'#d6e9f7',0,-.01,-16,13,.06,58);
for(let z=-40;z<10;z+=2.5){mesh(sphere,'#f8fcff',-7,.25,z,1,.45,1.5);mesh(sphere,'#f8fcff',7,.25,z,1,.45,1.5);}
function tree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);mesh(box,'#98765d',0,.8,0,.35,1.6,.35,g);for(let i=0;i<3;i++){mesh(cone,'#527f83',0,1.5+i*.8,0,1.8-i*.35,1.8,1.8-i*.35,g);mesh(cone,'#f3faff',0,1.84+i*.8,0,1.37-i*.26,1.15,1.37-i*.26,g);}g.scale.setScalar(s);}
for(let i=0;i<14;i++){tree(-10-(i%3)*2,-37+i*3.5,.85+(i%4)*.15);tree(10+(i%3)*2,-39+i*3.5,1+(i%3)*.2);}
// Warm cabins beyond the banks; all scenery rests on the ground.
for(const [x,z] of [[-15,-10],[15,-22]]){mesh(box,'#b28f78',x,1.5,z,4,3,3);const roof=mesh(cone,'#f9fcff',x,3.5,z,3.6,1.9,2.8);roof.rotation.y=Math.PI/4;mesh(box,'#ffd78d',x,1.6,z+1.51,1,1,.04);}
const fortGroup=new THREE.Group();scene.add(fortGroup);fortGroup.position.z=9;
for(let row=0;row<2;row++)for(let i=0;i<10;i++)mesh(box,'#eff9ff',-5.6+i*1.25+(row%2)*.1,.45+row*.85,0,1.19,.8,.9,fortGroup);
for(let i=0;i<5;i++)mesh(box,'#fffaff',-5+i*2.5,2.05,0,1.15,.7,.95,fortGroup);
mesh(box,'#856951',-5.8,2.9,0,.1,2,.1,fortGroup);mesh(box,'#f0944d',-5.15,3.6,0,1.2,.65,.08,fortGroup);
const player=new THREE.Group();scene.add(player);player.position.set(0,0,5.6);
mesh(sphere,'#254d76',0,.9,0,.46,.64,.35,player);mesh(sphere,'#ffcfab',0,1.7,0,.32,.32,.32,player);
mesh(sphere,'#f29343',0,1.94,0,.37,.22,.37,player);mesh(sphere,'#fffaff',0,2.19,0,.13,.13,.13,player);
const feet=[mesh(box,'#263d54',-.22,.22,0,.25,.42,.42,player),mesh(box,'#263d54',.22,.22,0,.25,.42,.42,player)];
const arms=[mesh(sphere,'#f29343',-.5,1.05,-.1,.2,.33,.2,player),mesh(sphere,'#f29343',.5,1.05,-.1,.2,.33,.2,player)];
mesh(box,'#f29343',0,1.43,-.08,.75,.13,.6,player);
// Three readable silhouettes: regular, small fast, and large sturdy.
function creature(type,x,z){const root=new THREE.Group();scene.add(root);const size=[1,.68,1.4][type];const hat=['#8f7fc0','#52a995','#ec9e55'][type];
mesh(sphere,'#f4fbff',0,.65,0,.66,.72,.62,root);mesh(sphere,'#fffaff',0,1.5,0,.45,.45,.45,root);
mesh(box,hat,0,1.92,0,.85,.12,.8,root);mesh(box,hat,0,2.09,0,.58,.3,.56,root);
mesh(box,hat,0,1.22,0,.96,.15,.78,root);
for(const ex of [-.15,.15])mesh(sphere,'#27415c',ex,1.6,.39,.065,.065,.065,root);
const nose=mesh(cone,'#ee994c',0,1.47,.5,.095,.32,.095,root);nose.rotation.x=Math.PI/2;
const hands=[mesh(sphere,hat,-.73,.93,0,.16,.16,.16,root),mesh(sphere,hat,.73,.93,0,.16,.16,.16,root)];
root.scale.setScalar(size);root.position.set(x,0,z);
return {root,type,x,z,size,hands,hp:[2,1,5][type],speed:[1.7,2.8,1.15][type],radius:.65*size,phase:Math.random()*6};}
let mode='ready', wave=1, fort=100, cleared=0, spawned=0, waveTime=0, spawnClock=0, tossClock=0, elapsed=0;
let enemies=[], balls=[], flakes=[], moveLeft=false,moveRight=false,drag=false,targetX=null;
const waves=[{count:16,interval:.95},{count:23,interval:.7},{count:30,interval:.57}];
const ballGeo=new THREE.SphereGeometry(.16,8,6), flakeGeo=new THREE.SphereGeometry(.06,4,3);
function disposeEntity(e){scene.remove(e.root||e.mesh);}
function burst(x,z){for(let i=0;i<9;i++){const m=mesh(flakeGeo,'#ffffff',x,.8,z);flakes.push({mesh:m,life:.55,vx:(Math.random()-.5)*5,vy:2+Math.random()*3,vz:(Math.random()-.5)*5});}}
function hud(){ $('fort-text').textContent=`${fort}%`;$('fort').value=fort;$('wave').textContent=`${wave} / 3`;$('cleared').textContent=cleared; }
function overlay(title,message,label,eyebrow){$('overlay').hidden=false;$('title').textContent=title;$('message').textContent=message;$('start').textContent=label;$('eyebrow').textContent=eyebrow;}
function clearInputs(){moveLeft=moveRight=drag=false;targetX=null;}
function reset(){[...enemies,...balls,...flakes].forEach(disposeEntity);enemies=[];balls=[];flakes=[];fort=100;cleared=0;wave=1;spawned=0;waveTime=spawnClock=tossClock=0;player.position.x=0;clearInputs();fortGroup.scale.y=1;hud();}
function begin(){mode='playing';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';$('status').textContent=`Wave ${wave}: protect your fort!`;canvas.focus({preventScroll:true});}
function finish(won){mode=won?'won':'lost';clearInputs();$('pause').disabled=true;overlay(won?'Snow day saved!':'Time to rebuild!',`You turned ${cleared} creatures into snow piles. ${won?`Your fort finished at ${fort}% strength.`:'Try lining up with the leading creatures before they reach the fort.'}`,'Play again',won?'FORT PROTECTED':'A FRESH START');$('status').textContent=won?'All three waves complete.':'The snow fort tumbled. Try again!';}
$('start').addEventListener('click',()=>{if(mode==='paused')begin();else if(mode==='between'){wave++;spawned=0;spawnClock=waveTime=0;hud();begin();}else{reset();begin();}});
$('restart').addEventListener('click',()=>{reset();begin();});
function pause(){if(mode!=='playing')return;mode='paused';clearInputs();$('pause').textContent='Resume';overlay('Snow day paused','Your fort and snowballs are safe while you take a break.','Resume snow day','TAKE A BREATHER');$('status').textContent='Paused';}
$('pause').addEventListener('click',()=>mode==='paused'?begin():pause());
window.addEventListener('blur',()=>{clearInputs();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','a','A','d','D','Escape'].includes(e.key))return;if(mode==='playing'){e.preventDefault();if(['ArrowLeft','a','A'].includes(e.key))moveLeft=true;if(['ArrowRight','d','D'].includes(e.key))moveRight=true;if(e.key==='Escape')pause();}});
window.addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))moveLeft=false;if(['ArrowRight','d','D'].includes(e.key))moveRight=false;});
for(const [id,set] of [['left',v=>moveLeft=v],['right',v=>moveRight=v]]){const b=$(id);b.addEventListener('pointerdown',e=>{if(mode!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);targetX=null;set(true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>set(false));}
const raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
function pointer(e){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);if(raycaster.ray.intersectPlane(ground,hit))targetX=THREE.MathUtils.clamp(hit.x,-5.7,5.7);}
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;drag=true;canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(drag)pointer(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=false;targetX=null;});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,w/h<.85?24:19,w/h<.85?31:25);camera.lookAt(0,0,-10);camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
function tick(dt){elapsed+=dt;
if(mode==='playing'){
 waveTime+=dt;spawnClock+=dt;tossClock+=dt;
 const oldX=player.position.x;
 if(moveLeft||moveRight){targetX=null;player.position.x+=((moveRight?1:0)-(moveLeft?1:0))*8*dt;}else if(targetX!==null)player.position.x+=THREE.MathUtils.clamp(targetX-player.position.x,-8*dt,8*dt);
 player.position.x=THREE.MathUtils.clamp(player.position.x,-5.7,5.7);
 const walking=Math.abs(oldX-player.position.x)>.001;feet.forEach((f,i)=>{f.position.z=walking?Math.sin(elapsed*16+i*Math.PI)*.15:0;});player.rotation.z=walking?(oldX-player.position.x)*.5:0;
 const cfg=waves[wave-1];if(spawned<cfg.count&&spawnClock>=cfg.interval){spawnClock=0;const type=wave===1?(spawned%6===5?1:0):(spawned%7===6?2:spawned%3===2?1:0);enemies.push(creature(type,(Math.random()-.5)*10.5,-30-Math.random()*5));spawned++;}
 if(tossClock>=.22){tossClock=0;const m=mesh(ballGeo,'#ffffff',player.position.x,1.2,4.7);balls.push({mesh:m,x:player.position.x,z:4.7,distance:0});}
 arms[1].rotation.x=Math.sin(tossClock/.22*Math.PI)*-.8;
 for(let i=balls.length-1;i>=0;i--){const b=balls[i];const prev=b.z;b.z-=27*dt;b.distance+=27*dt;b.mesh.position.set(b.x,1.2+Math.sin(Math.min(1,b.distance/38)*Math.PI)*.6,b.z);
 const e=enemies.filter(e=>Math.abs(e.x-b.x)<e.radius+.16&&e.z>=b.z-e.radius&&e.z<=prev+e.radius).sort((a,b)=>b.z-a.z)[0];
 if(e){e.hp--;e.z-=.22;burst(b.x,e.z);disposeEntity(b);balls.splice(i,1);if(e.hp<=0){burst(e.x,e.z);disposeEntity(e);enemies.splice(enemies.indexOf(e),1);cleared++;hud();}}else if(b.z<-40){disposeEntity(b);balls.splice(i,1);}}
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.z+=e.speed*dt*(1+(wave-1)*.12);e.root.position.set(e.x,Math.abs(Math.sin(elapsed*4+e.phase))*.12,e.z);e.root.rotation.z=Math.sin(elapsed*3+e.phase)*.055;e.hands.forEach((h,j)=>h.position.y=.93+Math.sin(elapsed*5+e.phase+j*Math.PI)*.13);if(e.z>7.9){burst(e.x,8);disposeEntity(e);enemies.splice(i,1);fort=Math.max(0,fort-[8,5,16][e.type]);fortGroup.scale.y=.4+.6*fort/100;hud();if(fort===0){finish(false);break;}}}
 if(mode==='playing'&&spawned===cfg.count&&enemies.length===0){balls.forEach(disposeEntity);balls=[];if(wave===3)finish(true);else{mode='between';clearInputs();$('pause').disabled=true;overlay(`Wave ${wave} cleared!`,`Fort strength: ${fort}%. Next up: ${wave===1?'quicker snow creatures':'a bigger crowd and chunky snow giants'}.`,'Start next wave','NICE TOSSING');$('status').textContent='Take a breather. Start the next wave when ready.';}}
 $('tip').hidden=waveTime>8;
}
if(mode!=='paused')for(let i=flakes.length-1;i>=0;i--){const p=flakes[i];p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.vy-=12*dt;p.mesh.scale.setScalar(Math.max(.01,p.life/.55));if(p.life<=0){disposeEntity(p);flakes.splice(i,1);}}
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;tick(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only diagnostics for playtest verification; no gameplay bypasses.
window.snowDayState=()=>({mode,wave,fort,cleared,spawned,enemies:enemies.length,balls:balls.length,playerX:player.position.x});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('title').textContent='3D graphics paused';$('message').textContent='The browser interrupted 3D graphics. Reload this page to start a fresh snow day.';$('start').disabled=true;$('restart').disabled=true;});
