import {WORLD,objects,initialState,connected,simulate,canStand} from './flow-model.js';
const root=document.querySelector('#worldsmith');
if(root)start();
function start(){
  const $=q=>document.querySelector(q),canvas=$('#world'),ctx=canvas.getContext('2d'),key='teacharcade-worldsmith-crossing-v1';
  let s=initialState(),keys=new Set(),actionHeld=false,paused=false,route=null,near=null,last=0,camera={x:0,y:0},vw=960,vh=600,resetArmed=false,saveClock=0,valveDrag=false,walkTime=0;
  const notes=['Connected channels redirect moving water.','A break in the channel stops energy reaching the wheel.','Moving water turns the wheel, which drives the winch and lowers the bridge.'];
  try{const old=JSON.parse(localStorage.getItem(key));if(old?.version===1){s.elbow=Number.isInteger(old.elbow)&&old.elbow>=0&&old.elbow<=3?old.elbow:0;s.troughY=Number.isFinite(old.troughY)?Math.max(330,Math.min(475,old.troughY)):430;s.valve=Number.isFinite(old.valve)?Math.max(0,Math.min(1,old.valve)):0.12;s.bridge=Number.isFinite(old.bridge)?Math.max(0,Math.min(1,old.bridge)):0;s.won=old.won===true&&s.bridge===1;s.discoveries=Array.isArray(old.discoveries)?old.discoveries.filter(n=>Number.isInteger(n)&&n>=0&&n<3):[];if(Number.isFinite(old.player?.x)&&Number.isFinite(old.player?.y)&&canStand(old.player.x,old.player.y,s))s.player={...old.player};}}catch{}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify({...s,version:1}));}catch{}};
  function message(text){$('#message').textContent=text;}
  function discover(n){if(!s.discoveries.includes(n)){s.discoveries.push(n);refreshNotes();save();}}
  function refreshNotes(){$('#discovery-count').textContent=`${s.discoveries.length} / 3`;$('#discoveries').innerHTML=s.discoveries.length?s.discoveries.map(n=>`<li>${notes[n]}</li>`).join(''):'<li>Your discoveries appear here as you play.</li>';}
  function resize(){const mobile=(canvas.clientWidth||960)<620;vw=mobile?600:960;vh=600;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=vw*dpr;canvas.height=vh*dpr;canvas.style.aspectRatio=`${vw} / ${vh}`;ctx.setTransform(dpr,0,0,dpr,0,0);}
  window.addEventListener('resize',resize);resize();refreshNotes();
  function nearest(){const candidates=[{id:'elbow',...objects.elbow},{id:'valve',...objects.valve},{id:'trough',x:objects.trough.x,y:s.troughY}];return candidates.map(o=>({...o,d:Math.hypot(o.x-s.player.x,o.y-s.player.y)})).filter(o=>o.d<80).sort((a,b)=>a.d-b.d)[0]||null;}
  function actOnce(){if(paused||!$('#win').hidden)return;near=nearest();if(near?.id==='elbow'){s.elbow=(s.elbow+1)%4;message(s.elbow===3?'The stream turns toward the wheel.':'Water spills from the open end.');if(s.elbow===3)discover(0);save();}else if(near?.id==='valve'){s.valve=Math.max(0,Math.min(1,s.valve+(keys.has('shift')?-0.12:0.12)));save();}else if(!near)message('Walk beside the channel elbow, loose channel, or valve.');}
  function work(dt){near=nearest();if(!near)return;if(near.id==='valve'){s.valve=Math.max(0,Math.min(1,s.valve+(keys.has('shift')?-1:1)*dt*0.42));}if(near.id==='trough'&&s.troughY>330){if(s.player.y>s.troughY+20){const step=Math.min(dt*65,s.troughY-330);s.troughY-=step;s.player.y-=step;if(s.troughY<=330.01){s.troughY=330;message('Channel connected. The stream can reach the wheel.');discover(1);save();}}else message('Get behind the loose channel and push it toward the gap.');}}
  function move(dx,dy,dt){const speed=155*dt,norm=Math.hypot(dx,dy)||1;dx=dx/norm*speed;dy=dy/norm*speed;
    const tryAxis=(amount,axis)=>{if(Math.abs(amount)<0.001)return false;const p={...s.player};p[axis]+=amount;if(!canStand(p.x,p.y,s))return false;
      if(Math.abs(p.x-475)<57&&Math.abs(p.y-s.troughY)<31){if(axis==='y'&&s.troughY>330){const next=Math.max(330,Math.min(475,s.troughY+amount));if(Math.abs(next-s.troughY-amount)>0.01)return false;s.troughY=next;if(s.troughY===330){message('Channel connected.');discover(1);}}else return false;}
      s.player=p;return true;};const x=tryAxis(dx,'x'),y=tryAxis(dy,'y');if(Math.abs(dx)+Math.abs(dy)>0.01&&(x||y))walkTime+=dt;return x||y;
  }
  const dirs={arrowup:[0,-1],w:[0,-1],up:[0,-1],arrowdown:[0,1],s:[0,1],down:[0,1],arrowleft:[-1,0],a:[-1,0],left:[-1,0],arrowright:[1,0],d:[1,0],right:[1,0]};
  function clearInput(){keys.clear();actionHeld=false;route=null;valveDrag=false;}
  root.addEventListener('keydown',e=>{if(e.target.matches('button,a,summary'))return;const k=e.key.toLowerCase();if(dirs[k]||[' ','e','shift'].includes(k)){e.preventDefault();keys.add(k);if(dirs[k])route=null;if((k==='e'||k===' ')&&!e.repeat){actionHeld=true;actOnce();}}});
  window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k==='e'||k===' ')actionHeld=false;});
  window.addEventListener('blur',()=>{clearInput();save();});document.addEventListener('visibilitychange',()=>{clearInput();save();});
  document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);route=null;canvas.focus();});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.move));b.addEventListener('click',e=>{if(e.detail===0&&!paused){move(...dirs[b.dataset.move],0.22);save();}});});
  $('#action').addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;$('#action').setPointerCapture(e.pointerId);canvas.focus();actionHeld=true;actOnce();});for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('#action').addEventListener(ev,()=>{actionHeld=false;save();});$('#action').addEventListener('click',e=>{if(e.detail===0){actOnce();work(0.3);save();}});
  function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*vw+camera.x,y:(e.clientY-r.top)/r.height*vh+camera.y};}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(paused||!$('#win').hidden)return;canvas.focus();const p=point(e);canvas.setPointerCapture(e.pointerId);if(Math.hypot(p.x-objects.valve.x,p.y-objects.valve.y)<36&&Math.hypot(s.player.x-objects.valve.x,s.player.y-objects.valve.y)<80){valveDrag=true;route=null;return;}
    const hit=Math.hypot(p.x-330,p.y-180)<40?'elbow':Math.hypot(p.x-475,p.y-s.troughY)<50?'trough':Math.hypot(p.x-180,p.y-180)<40?'valve':null;
    if(hit==='elbow'&&nearest()?.id==='elbow'){actOnce();return;}
    const target=hit==='elbow'?{x:330,y:238}:hit==='trough'?{x:475,y:s.troughY+60}:hit==='valve'?{x:180,y:238}:p;
    if(canStand(target.x,target.y,s)){
      let points=[target];
      if(hit==='trough'&&s.player.y<s.troughY+31)points=[{x:395,y:s.player.y},{x:395,y:s.troughY+65},target];
      else if(target.x>840&&s.player.x<718)points=[{x:700,y:425},{x:860,y:425},target];
      else if(target.x<718&&s.player.x>840)points=[{x:860,y:425},{x:700,y:425},target];
      route={...points.shift(),next:points,act:hit==='elbow'};
    }else message(s.bridge<1?'The crossing needs power first.':'Use the bridge to cross the river.');
  });
  canvas.addEventListener('pointermove',e=>{if(valveDrag){const p=point(e);s.valve=Math.max(0,Math.min(1,(240-p.y)/120));}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>{if(valveDrag)save();valveDrag=false;});
  $('#pause').addEventListener('click',()=>{paused=!paused;clearInput();$('#pause').textContent=paused?'Resume':'Pause';$('#pause').setAttribute('aria-pressed',String(paused));save();});
  function reset(){s=initialState();clearInput();paused=false;resetArmed=false;$('#pause').textContent='Pause';$('#pause').setAttribute('aria-pressed','false');$('#restart').textContent='Restart';$('#win').hidden=true;message('Find a way to get water to the wheel.');refreshNotes();save();canvas.focus();}
  $('#restart').addEventListener('click',()=>{if(resetArmed)reset();else{resetArmed=true;$('#restart').textContent='Confirm restart';message('Press Confirm restart to start over.');}});
  $('#play-again').addEventListener('click',reset);$('#keep-exploring').addEventListener('click',()=>{$('#win').hidden=true;canvas.focus();});
  function update(dt){if(paused||document.hidden||!$('#win').hidden)return;
    let dx=0,dy=0;for(const k of keys){if(dirs[k]){dx+=dirs[k][0];dy+=dirs[k][1];}}
    if(dx||dy)move(dx,dy,dt);else if(route){const x=route.x-s.player.x,y=route.y-s.player.y;if(Math.hypot(x,y)<7){if(route.next?.length){const next=route.next.shift();route={...route,...next};}else{const act=route.act;route=null;if(act)actOnce();}}else if(!move(x,y,dt)){route=null;message('Walk around the loose channel, or push it from below.');}}
    if(actionHeld)work(dt);
    const result=simulate(s,dt);if(connected(s)&&s.valve>0.1)discover(1);
    if(result.bridgeOpen){discover(2);if(s.player.x>878&&!s.won){s.won=true;clearInput();$('#win').hidden=false;message('Crossing restored.');save();}}
    const next=nearest();near=next;
    const labels={elbow:['Turn channel','Tap E to rotate. Watch the stream.'],trough:[s.troughY<=330?'Connected':'Push channel',s.troughY<=330?'Water can pass through this connection.':'Get below it and hold E to push.'],valve:['Turn valve','Hold E to open; Shift + E to close. Or drag the valve up/down.']};
    $('#action').textContent=next?labels[next.id][0]:'Explore';$('#context').textContent=next?labels[next.id][1]:result.bridgeOpen?'The bridge is ready. Cross to the far bank.':'Walk beside a glowing object.';
    $('#goal').textContent=s.won?'Crossing restored. Explore or restart.':result.bridgeOpen?'Cross the bridge.':result.turning?'The wheel is powering the bridge…':s.elbow!==3?'Redirect the stream.':!connected(s)?'Reconnect the loose channel.':'Give the wheel enough moving water.';
    saveClock+=dt;if(saveClock>2){saveClock=0;save();}
  }
  function path(points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
  function water(points,time){path(points,'#2594b2',15);path(points,'#75dce8',7);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=(time*0.07)%32;d<len;d+=32){const f=d/len;ctx.fillStyle='#c9f8ec';ctx.beginPath();ctx.arc(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,2,0,Math.PI*2);ctx.fill();}}}
  function tree(x,y,size){ctx.fillStyle='#153e3a55';ctx.beginPath();ctx.ellipse(x+8,y+9,size*0.8,size*0.28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#986d43';ctx.fillRect(x-4,y-20,8,25);ctx.fillStyle='#164c3e';ctx.beginPath();ctx.arc(x,y-32,size,0,Math.PI*2);ctx.fill();ctx.fillStyle='#287456';ctx.beginPath();ctx.arc(x-6,y-38,size*0.75,0,Math.PI*2);ctx.fill();ctx.fillStyle='#479269';ctx.beginPath();ctx.arc(x-10,y-43,size*0.4,0,Math.PI*2);ctx.fill();}
  function glow(x,y,active,time){ctx.strokeStyle=active?'#ffe2a1':'#95c3a066';ctx.lineWidth=active?3:2;ctx.beginPath();ctx.arc(x,y,35+(active?Math.sin(time/250)*2:0),0,Math.PI*2);ctx.stroke();}
  function draw(time){
    camera.x=Math.max(0,Math.min(WORLD.width-vw,s.player.x-vw/2));camera.y=0;
    ctx.clearRect(0,0,vw,vh);ctx.save();ctx.translate(-camera.x,-camera.y);
    const bg=ctx.createLinearGradient(0,0,0,600);bg.addColorStop(0,'#184c43');bg.addColorStop(1,'#377b5b');ctx.fillStyle=bg;ctx.fillRect(0,0,960,600);
    // Fixed world texture avoids shimmering as the camera moves.
    for(let n=0;n<140;n++){const x=(n*137+33)%960,y=(n*71+60)%600;if(x>720&&x<840)continue;ctx.fillStyle=n%3?'#71a77635':'#d4c78344';ctx.fillRect(x,y,3,2);}
    path([[70,470],[290,470],[340,420],[910,425]],'#193f3555',72);path([[70,466],[290,466],[340,416],[910,421]],'#bcaf7d',54);path([[70,466],[290,466],[340,416],[910,421]],'#d3c197',38);
    const river=ctx.createLinearGradient(720,0,840,0);river.addColorStop(0,'#256e86');river.addColorStop(0.5,'#338fa7');river.addColorStop(1,'#225f76');ctx.fillStyle=river;ctx.fillRect(720,0,120,600);ctx.fillStyle='#99d5cc66';ctx.fillRect(718,0,4,600);ctx.fillRect(839,0,4,600);for(let n=0;n<35;n++){const y=(n*31+time*0.045)%610;path([[734+n%3*32,y],[748+n%3*32,y]],'#90dce56b',2);}
    for(const [x,y,z] of [[55,100,25],[105,87,31],[420,90,26],[545,83,31],[652,95,30],[50,280,29],[90,345,24],[600,530,29],[670,552,24],[875,92,29],[916,175,24],[890,540,29],[140,561,23],[310,562,27]])tree(x,y,z);
    // Channel bed has a visible missing section between the elbow and wheel.
    path([[70,180],[330,180],[330,330],[421,330]],'#4a5042',34);path([[70,180],[330,180],[330,330],[421,330]],'#b5aa82',25);path([[529,330],[650,330]],'#4a5042',34);path([[529,330],[650,330]],'#b5aa82',25);
    ctx.strokeStyle='#d9d69a88';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.strokeRect(429,309,92,42);ctx.setLineDash([]);
    path([[475,330],[475,477]],'#9fae8460',4);
    ctx.fillStyle='#163d3450';ctx.fillRect(430,s.troughY-13,92,38);ctx.fillStyle=s.troughY===330?'#c2b586':'#d7c392';ctx.fillRect(429,s.troughY-20,92,35);ctx.fillStyle='#655e45';ctx.fillRect(430,s.troughY-10,90,15);ctx.fillStyle='#f2dba9';ctx.fillRect(429,s.troughY-20,92,5);ctx.fillRect(429,s.troughY+10,92,5);for(const x of [435,513]){ctx.fillStyle='#706646';ctx.fillRect(x,s.troughY-19,4,34);}
    if(s.valve>0.02){water([[70,180],[330,180]],time*s.valve);if(s.elbow===3){water([[330,180],[330,330],[421,330]],time*s.valve);if(connected(s))water([[421,330],[650,330]],time*s.valve);else{for(let n=0;n<8;n++){ctx.fillStyle='#76d2dc';ctx.fillRect(424+n%3*7,330+(time/8+n*9)%38,3,5);}}}else{const endpoints=[[330,150],[361,180],[330,211],[299,180]];const tip=endpoints[s.elbow];water([[330,180],tip],time*s.valve);ctx.fillStyle='#71cdd980';ctx.beginPath();ctx.ellipse(tip[0],tip[1]+8,16,8,0,0,Math.PI*2);ctx.fill();}}
    // Rotating elbow: its open ports are visible in the world.
    const ports=[[-1,0],[0,-1],[1,0],[0,1]];const pairs=[[0,1],[1,2],[2,3],[3,0]];const pair=pairs[s.elbow];ctx.fillStyle='#c5b17b';ctx.beginPath();ctx.arc(330,180,25,0,Math.PI*2);ctx.fill();path([[330+ports[pair[0]][0]*25,180+ports[pair[0]][1]*25],[330,180],[330+ports[pair[1]][0]*25,180+ports[pair[1]][1]*25]],'#536757',12);
    // Valve handle and opening arc.
    ctx.fillStyle='#163d43';ctx.beginPath();ctx.arc(180,180,23,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f3bb70';ctx.lineWidth=4;ctx.beginPath();ctx.arc(180,180,18,-Math.PI/2,-Math.PI/2+Math.PI*2*s.valve);ctx.stroke();ctx.save();ctx.translate(180,180);ctx.rotate(s.valve*Math.PI*1.5);path([[-17,0],[17,0]],'#efad57',5);path([[0,-17],[0,17]],'#efad57',5);ctx.restore();
    // Wheel shaft visibly connects to the winch at the bridge.
    path([[650,330],[686,330],[686,403]],'#182e32',12);path([[650,326],[682,326],[682,403]],'#a4ac84',4);ctx.fillStyle='#254247';ctx.fillRect(620,300,60,68);ctx.save();ctx.translate(650,330);ctx.rotate(s.wheelAngle);ctx.strokeStyle='#d3ac65';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,41,0,Math.PI*2);ctx.stroke();for(let n=0;n<10;n++){ctx.rotate(Math.PI/5);path([[0,0],[40,0]],'#c99d58',5);ctx.fillStyle='#e6bd74';ctx.fillRect(33,-11,10,22);}ctx.restore();ctx.fillStyle='#4b5144';ctx.beginPath();ctx.arc(650,330,10,0,Math.PI*2);ctx.fill();
    // Bridge lowers continuously; collision opens only when fully deployed.
    ctx.fillStyle='#51482f';ctx.fillRect(710,393,11,63);ctx.fillRect(840,393,11,63);const span=120*s.bridge;ctx.fillStyle='#b48c51';ctx.fillRect(720,401,span,48);for(let x=724;x<720+span;x+=13){path([[x,402],[x,448]],'#785b35',2);}path([[720,400],[720+span,400]],'#eed095',4);path([[720,450],[720+span,450]],'#eed095',4);
    if(s.bridge<1){path([[718,395],[722,390-span*0.8]],'#bea06c',7);}
    ctx.save();ctx.translate(686,403);ctx.rotate(s.wheelAngle*0.5);ctx.fillStyle='#e2ba77';ctx.fillRect(-13,-13,26,26);path([[-13,0],[13,0]],'#6f5837',3);ctx.restore();path([[694,403],[719,396]],'#bfc7a4',2);
    // Destination banner on the far bank.
    ctx.fillStyle='#6e593a';ctx.fillRect(901,368,5,54);ctx.fillStyle=s.won?'#fed57f':'#a4d3a1';ctx.beginPath();ctx.moveTo(906,370);ctx.lineTo(936,378);ctx.lineTo(906,389);ctx.closePath();ctx.fill();
    for(const [id,x,y] of [['elbow',330,180],['valve',180,180],['trough',475,s.troughY]])glow(x,y,near?.id===id,time);
    ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillStyle='#e4eed0';ctx.fillText('VALVE',180,133);ctx.fillText('CHANNEL',330,133);if(s.troughY>330)ctx.fillText('PUSH',475,s.troughY-47);
    if(near){ctx.fillStyle='#ffdda2';ctx.font='bold 15px system-ui';ctx.fillText(near.id==='elbow'?'E · TURN':near.id==='valve'?'HOLD E · OPEN':s.troughY>330?'HOLD E · PUSH':'CONNECTED',near.x,near.y+57);}
    if(route){ctx.strokeStyle='#fce4a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(route.x,route.y,6,0,Math.PI*2);ctx.stroke();}
    const {x,y}=s.player,bob=keys.size||route?Math.sin(walkTime*17)*1.5:0;ctx.fillStyle='#15352977';ctx.beginPath();ctx.ellipse(x,y+13,13,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#233841';ctx.fillRect(x-8,y+6,6,10);ctx.fillRect(x+2,y+6,6,10);ctx.fillStyle='#ef9850';ctx.fillRect(x-10,y-10+bob,20,19);ctx.fillStyle='#f5d5aa';ctx.fillRect(x-8,y-23+bob,16,14);ctx.fillStyle='#193e46';ctx.fillRect(x-10,y-28+bob,20,8);ctx.fillStyle='#e7b35b';ctx.fillRect(x-12,y-21+bob,24,3);ctx.fillStyle='#765335';ctx.fillRect(x+7,y-9+bob,7,13);
    ctx.restore();if(paused){ctx.fillStyle='#102e3acb';ctx.fillRect(0,0,vw,vh);ctx.fillStyle='#fff';ctx.font='bold 32px system-ui';ctx.textAlign='center';ctx.fillText('Paused',vw/2,vh/2);}
  }
  function frame(time){const dt=Math.min(0.04,Math.max(0,(time-last)/1000));last=time;update(dt);draw(time);requestAnimationFrame(frame);}
  if(s.won)message('Welcome back. The crossing is restored.');requestAnimationFrame(frame);
}
