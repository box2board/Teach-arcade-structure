import { region, evaluateExperiment } from './region.js';

const root = document.querySelector('#restorer');
if (root) startAdventure();
function startAdventure() {
  const $ = selector => document.querySelector(selector);
  const canvas = $('#world'), ctx = canvas.getContext('2d');
  const dialog = $('#puzzle'), cell = 36, storageKey = 'teacharcade-restorer-waterworks-v1';
  const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fresh = () => ({version:1,position:{...region.spawn},repairs:[],notes:{},attempts:{},hints:{},tools:[],completed:false});
  let state = fresh(), saveAvailable = true;
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (data?.version === 1 && Array.isArray(data.repairs)) {
      // Restore only a contiguous sequence: a malformed save cannot skip prerequisites.
      const repairs=[];
      for(const station of region.stations){if(!data.repairs.includes(station.id))break;repairs.push(station.id);}
      const strings = source => Object.fromEntries(region.stations.map(s=>[s.id,typeof source?.[s.id]==='string'?source[s.id].slice(0,600):'']));
      const counts = source => Object.fromEntries(region.stations.map(s=>[s.id,Number.isSafeInteger(source?.[s.id])&&source[s.id]>=0?source[s.id]:0]));
      state = {...fresh(),repairs,notes:strings(data.notes),attempts:counts(data.attempts),hints:counts(data.hints),tools:region.stations.filter(s=>data.tools?.includes(s.id)).map(s=>s.id),completed:data.completed===true&&repairs.length===4};
      if (Number.isInteger(data.position?.x)&&Number.isInteger(data.position?.y)) state.position={...data.position};
    }
  } catch { saveAvailable=false; }
  let active=null, solved=false, paused=false, keys=new Set(), route=[], stepTime=0, lastTime=0, lastSave=0, destination=null;
  const complete = id => state.repairs.includes(id);
  const current = () => region.stations.find(s=>!complete(s.id));
  const accessible = station => region.stations.slice(0,region.stations.indexOf(station)).every(s=>complete(s.id));
  const blocked = (x,y) => x<1||y<1||x>24||y>14||(x===13&&(y!==8||!complete('wheel')))||(x>=21&&x<=23&&y===13&&!complete('gate'));
  if(blocked(state.position.x,state.position.y))state.position={...region.spawn};
  function save() {
    try {localStorage.setItem(storageKey,JSON.stringify(state));$('#save-status').textContent='Progress saved on this device.';}
    catch {saveAvailable=false;$('#save-status').textContent='Saving is unavailable. Keep this page open and print your notebook before leaving.';}
  }
  function status(text){$('#status').textContent=text;}
  function refresh() {
    $('#progress').textContent=`${state.repairs.length} of 4 repairs`;
    $('#objective').textContent=state.completed?'Valley restored! Print your notebook or revisit your discoveries.':current()?.objective||'Visit the archive gate and explain the energy journey.';
    $('#stations').innerHTML=region.stations.map(s=>`<button type="button" data-station="${s.id}" data-current="${current()?.id===s.id}"><span>${escape(s.name)}</span><small>${complete(s.id)?'✓ Repaired':accessible(s)?'Explore':'Locked'}</small></button>`).join('');
    $('#inventory').innerHTML='<li>Field notebook</li>'+state.tools.map(id=>`<li>${escape(region.stations.find(s=>s.id===id).tool)}</li>`).join('');
    $('#notebook').innerHTML=state.repairs.length?state.repairs.map(id=>{const s=region.stations.find(s=>s.id===id);return `<article><h3>${escape(s.name)}</h3><p>${escape(s.discovery)}</p>${state.notes[id]?`<p><strong>My observation:</strong> ${escape(state.notes[id])}</p>`:''}<p>${state.attempts[id]||0} tests · ${state.hints[id]||0} hints</p></article>`;}).join('')+(state.completed?'<p><strong>Archive complete. You restored the valley.</strong></p>':''):'<p>Your observations will appear here after each repair.</p>';
    $('#stations').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>walkTo(region.stations.find(s=>s.id===b.dataset.station))));
    $('#interact').disabled=paused;
    if(!saveAvailable)$('#save-status').textContent='Saving is unavailable. Keep this page open and print your notebook before leaving.';
  }
  function findPath(target) {
    const start=state.position,queue=[start],seen=new Set([`${start.x},${start.y}`]),parents=new Map();
    while(queue.length){const p=queue.shift();if(p.x===target.x&&p.y===target.y){const path=[];let key=`${p.x},${p.y}`;while(key!==`${start.x},${start.y}`){const [x,y]=key.split(',').map(Number);path.unshift({x,y});key=parents.get(key);}return path;}
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next={x:p.x+dx,y:p.y+dy},key=`${next.x},${next.y}`;if(!blocked(next.x,next.y)&&!seen.has(key)){seen.add(key);parents.set(key,`${p.x},${p.y}`);queue.push(next);}}
    }return null;
  }
  function walkTo(station) {
    if(paused){status('Resume the adventure before walking.');return;}
    if(!accessible(station)){status(`Repair ${current().name.toLowerCase()} first. The next station will unlock afterward.`);return;}
    const path=findPath(station);if(!path){status('The bridge is closed. Restore the waterwheel to cross.');return;}
    route=path;destination=station;keys.clear();status(`Walking to ${station.name.toLowerCase()}…`);
    if(!route.length){destination=null;openStation(station);}
  }
  const near = () => region.stations.find(s=>Math.hypot(s.x-state.position.x,s.y-state.position.y)<=1.5);
  function interact() {
    if(paused||dialog.open)return;
    const station=near();
    if(!station){status('Move beside a station, or choose one from Restoration stations.');return;}
    if(!accessible(station)){status(`This station needs the earlier repairs. Next: ${current().name}.`);return;}
    route=[];destination=null;openStation(station);
  }
  const select = (label,id,options) => `<label for="${id}">${label}</label><select id="${id}">${options.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select>`;
  const diagram = id => id==='canal'?'<svg class="ar-diagram" viewBox="0 0 500 140" role="img" aria-label="Water enters from west into an upper elbow, travels south to a lower elbow, then east to the wheel"><path d="M30 35H170V105H445" fill="none" stroke="#9cb3c4" stroke-width="20"/><text x="15" y="18" fill="#142c42" font-size="14">Incoming stream</text><circle cx="170" cy="35" r="24" fill="#e87920"/><circle cx="170" cy="105" r="24" fill="#e87920"/><text x="205" y="40" fill="#142c42" font-size="14">Upper elbow</text><text x="205" y="86" fill="#142c42" font-size="14">Lower elbow</text><text x="370" y="135" fill="#142c42" font-size="14">To waterwheel</text></svg>':id==='gears'?'<svg class="ar-diagram" viewBox="0 0 500 140" role="img" aria-label="A 20-tooth driver gear meshes with a driven gear connected to the generator"><circle cx="155" cy="65" r="35" fill="#e87920"/><circle cx="245" cy="65" r="55" fill="#6d8ba3"/><circle cx="155" cy="65" r="8" fill="#142c42"/><circle cx="245" cy="65" r="8" fill="#142c42"/><text x="75" y="128" fill="#142c42" font-size="14">Driver: 20 teeth · 120 rpm</text><text x="315" y="65" fill="#142c42" font-size="14">Generator</text><path d="M300 65H410" stroke="#142c42" stroke-width="4"/></svg>':id==='gate'?'<svg class="ar-diagram" viewBox="0 0 500 140" role="img" aria-label="Generator output connects through a test material to the motor, which requires a return connection to the generator"><path d="M90 75V30H390V75M390 90V120H90V90" stroke="#6d8ba3" stroke-width="5" fill="none"/><rect x="45" y="55" width="90" height="40" rx="8" fill="#142c42"/><rect x="345" y="55" width="90" height="40" rx="8" fill="#142c42"/><text x="52" y="80" fill="white" font-size="14">Generator</text><text x="368" y="80" fill="white" font-size="14">Motor</text><rect x="204" y="18" width="74" height="24" rx="4" fill="#e87920"/><text x="188" y="65" fill="#142c42" font-size="14">Test material</text><text x="178" y="107" fill="#142c42" font-size="14">Return connection</text></svg>':'';
  function openStation(station) {
    active=station;solved=false;keys.clear();route=[];destination=null;
    if(!state.tools.includes(station.id)){state.tools.push(station.id);save();refresh();}
    $('#puzzle-title').textContent=station.name;
    $('#puzzle-intro').textContent=station.intro;
    $('#puzzle-step').textContent=`Station ${region.stations.indexOf(station)+1} of 4 · ${station.tool}`;
    $('#feedback').textContent='Change a setting, then test and observe the result.';$('#feedback').dataset.success='false';
    $('#reflection').hidden=true;$('#reflection-text').value=state.notes[station.id]||'';$('#test').hidden=false;$('#hint').hidden=false;$('#test').disabled=false;
    let controls='';
    if(station.id==='canal')controls=select('Upper elbow openings','upper',[['we','West ↔ East'],['ne','North ↔ East'],['ws','West ↔ South'],['ns','North ↔ South']])+select('Lower elbow openings','lower',[['ws','West ↔ South'],['we','West ↔ East'],['ns','North ↔ South'],['ne','North ↔ East']]);
    if(station.id==='wheel')controls='<label for="flow">Valve opening: <output id="flow-value">20</output>%</label><input id="flow" type="range" min="0" max="100" step="10" value="20"><p>Test several openings. The shaft needs enough energy without slipping.</p>';
    if(station.id==='gears')controls=select('Driven gear tooth count','teeth',[['10','10 teeth'],['20','20 teeth'],['40','40 teeth'],['60','60 teeth']]);
    if(station.id==='gate')controls=select('Connecting material','material',[['rubber','Rubber'],['wood','Wood'],['copper','Copper']])+select('Return connection','returnPath',[['open','Disconnected'],['closed','Connected to generator']]);
    $('#experiment').innerHTML=diagram(station.id)+controls+'<p class="ar-measurement" id="measurement">System awaiting test</p>';
    if(station.id==='wheel')$('#flow').addEventListener('input',()=>{$('#flow-value').textContent=$('#flow').value;});
    if(complete(station.id)){
      $('#puzzle-intro').textContent=station.discovery;
      if(station.id==='gate'&&!state.completed)showSynthesis();
      else{$('#experiment').innerHTML='<p>This system is restored. Your observation is saved in the field notebook.</p>';$('#test').hidden=true;$('#hint').hidden=true;$('#feedback').textContent='You can add or revise your observation below.';$('#reflection').hidden=false;solved=true;}
    }
    dialog.showModal();
  }
  function showSynthesis() {
    $('#experiment').innerHTML=select('Trace the energy journey that opens the gate','energy',[['','Choose a sequence'],['reverse','Motor → water → generator → wheel'],['correct','Moving water → wheel and gears → generator → motor'],['skip','Water → electrical wires → gears → motor']]);
    $('#puzzle-intro').textContent='The gate is powered. Before entering the archive, connect your discoveries: how did energy reach the gate motor?';
    $('#test').textContent='Check energy journey';$('#test').disabled=false;$('#test').hidden=false;$('#hint').hidden=false;$('#reflection').hidden=true;solved=false;
  }
  function testSystem(){
    if(!active)return;
    if($('#energy')){
      const correct=$('#energy').value==='correct';$('#feedback').textContent=correct?'Exactly. Water provides the moving energy; the generator converts motion into electrical energy; the motor turns it back into motion. The archive is ready.':'Follow the actual order of your repairs. What turned the generator, and what did the electricity power?';$('#feedback').dataset.success=String(correct);
      if(correct){state.completed=true;solved=true;$('#reflection').hidden=false;$('#test').disabled=true;save();refresh();}return;
    }
    const config={};$('#experiment').querySelectorAll('select,input').forEach(el=>config[el.id]=el.value);
    const result=evaluateExperiment(active.id,config);state.attempts[active.id]=(state.attempts[active.id]||0)+1;
    $('#measurement').textContent=result.measurement;$('#feedback').textContent=result.message;$('#feedback').dataset.success=String(result.success);
    if(result.success){
      if(!complete(active.id))state.repairs.push(active.id);
      solved=true;$('#test').disabled=true;$('#hint').hidden=true;
      if(active.id==='gate'){save();refresh();showSynthesis();$('#feedback').textContent=result.message+' One final connection: trace the energy journey.';}
      else $('#reflection').hidden=false;
      status(result.message);
    }
    save();refresh();
  }
  $('#test').addEventListener('click',testSystem);
  $('#hint').addEventListener('click',()=>{if(!active)return;state.hints[active.id]=(state.hints[active.id]||0)+1;$('#feedback').textContent=$('#energy')?'Start with moving water. The generator converts motion to electricity; the motor converts electricity to motion.':active.hint;save();refresh();});
  $('#continue').addEventListener('click',()=>{if(!solved)return;state.notes[active.id]=$('#reflection-text').value.trim().slice(0,600);save();refresh();dialog.close();canvas.focus();status(state.completed?'Waterworks Valley restored! Your notebook is ready to print.':current()?`Repair saved. Next: ${current().name}.`:'Return to the archive gate to finish the energy journey.');});
  $('#close-puzzle').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{keys.clear();$('#test').textContent='Test system';canvas.focus();});
  $('#interact').addEventListener('click',interact);
  $('#pause').addEventListener('click',()=>{paused=!paused;keys.clear();route=[];destination=null;$('#pause').textContent=paused?'Resume':'Pause';$('#pause').setAttribute('aria-pressed',String(paused));status(paused?'Adventure paused. Your progress is saved.':'Adventure resumed. Explore a restoration station.');save();refresh();});
  $('#restart').addEventListener('click',()=>{keys.clear();route=[];destination=null;$('#reset-dialog').showModal();});
  $('#cancel-reset').addEventListener('click',()=>$('#reset-dialog').close());
  $('#confirm-reset').addEventListener('click',()=>{state=fresh();keys.clear();route=[];destination=null;paused=false;$('#pause').textContent='Pause';$('#pause').setAttribute('aria-pressed','false');save();refresh();$('#reset-dialog').close();status('A fresh adventure. Visit the canal junction to restore water flow.');canvas.focus();});
  function inputIsEditable(event){return event.target.matches('input,textarea,select,button,a,summary')||dialog.open||$('#reset-dialog').open;}
  const directions={arrowup:[0,-1],w:[0,-1],up:[0,-1],arrowdown:[0,1],s:[0,1],down:[0,1],arrowleft:[-1,0],a:[-1,0],left:[-1,0],arrowright:[1,0],d:[1,0],right:[1,0]};
  root.addEventListener('keydown',event=>{if(inputIsEditable(event))return;const key=event.key.toLowerCase();if(directions[key]){event.preventDefault();keys.add(key);route=[];destination=null;}if((key===' '||key==='e')&&!event.repeat){event.preventDefault();interact();}});
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur',()=>{keys.clear();route=[];destination=null;save();});
  document.addEventListener('visibilitychange',()=>{keys.clear();route=[];destination=null;if(document.hidden)save();});
  document.querySelectorAll('[data-move]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{if(paused||dialog.open)return;event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.move);route=[];destination=null;canvas.focus();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move));
    // Keyboard activation of touch controls moves one tile.
    button.addEventListener('click',event=>{if(event.detail===0&&!paused){move(...directions[button.dataset.move]);save();}});
  });
  canvas.addEventListener('click',event=>{
    canvas.focus();if(paused||dialog.open)return;const bounds=canvas.getBoundingClientRect();const p={x:Math.floor((event.clientX-bounds.left)/bounds.width*26),y:Math.floor((event.clientY-bounds.top)/bounds.height*16)};
    const station=region.stations.find(s=>s.x===p.x&&s.y===p.y);if(station){walkTo(station);return;}
    if(blocked(p.x,p.y)){status('That route is blocked. Restore the waterwheel to lower the bridge.');return;}const path=findPath(p);if(path){route=path;destination=null;keys.clear();}else status('There is no open route yet.');
  });
  function move(dx,dy){const next={x:state.position.x+dx,y:state.position.y+dy};if(!blocked(next.x,next.y)){state.position=next;const s=near();if(s)status(`${s.name}: press Interact${complete(s.id)?' to revisit your discovery':'.'}`);return true;}return false;}
  function draw(time){
    ctx.fillStyle='#24574d';ctx.fillRect(0,0,936,576);
    for(let y=0;y<16;y++)for(let x=0;x<26;x++){
      const edge=x===0||y===0||x===25||y===15;ctx.fillStyle=edge?'#173c38':(x+y)%2?'#2b6254':'#2d6658';ctx.fillRect(x*cell,y*cell,cell,cell);
      if(!edge&&((x*7+y*11)%19===0)){ctx.fillStyle='#43836a';ctx.fillRect(x*cell+6,y*cell+8,3,7);ctx.fillRect(x*cell+11,y*cell+11,3,5);}
    }
    // Walkways connect every station; the river crossing is gated by the wheel repair.
    ctx.fillStyle='#bdba95';ctx.fillRect(2*cell,8*cell,22*cell,cell);ctx.fillRect(6*cell,5*cell,cell,4*cell);ctx.fillRect(10*cell,8*cell,cell,3*cell);ctx.fillRect(18*cell,5*cell,cell,4*cell);ctx.fillRect(22*cell,8*cell,cell,5*cell);
    ctx.fillStyle='#286780';ctx.fillRect(13*cell,cell,cell,14*cell);
    for(let y=1;y<15;y++){ctx.fillStyle='#58a5bc';ctx.fillRect(13*cell+8, y*cell+((time/90+y*3)%24),20,2);}
    if(complete('wheel')){ctx.fillStyle='#b8804c';ctx.fillRect(13*cell,8*cell,cell,cell);ctx.strokeStyle='#674529';for(let n=0;n<4;n++){ctx.beginPath();ctx.moveTo(13*cell,8*cell+n*9);ctx.lineTo(14*cell,8*cell+n*9);ctx.stroke();}}
    else{ctx.fillStyle='#613f34';ctx.fillRect(13*cell,8*cell,cell,cell);}
    ctx.lineCap='round';ctx.strokeStyle=complete('canal')?'#68c7e6':'#647767';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(2*cell,3*cell);ctx.lineTo(6.5*cell,3*cell);ctx.lineTo(6.5*cell,10.5*cell);ctx.lineTo(10.5*cell,10.5*cell);ctx.stroke();
    if(complete('canal')){ctx.fillStyle='#bcefff';for(let n=0;n<4;n++)ctx.fillRect((3+n)*cell+(time/50%18),3*cell-3,10,3);}
    ctx.lineWidth=5;ctx.strokeStyle=complete('gears')?'#f3c25c':'#476c61';ctx.beginPath();ctx.moveTo(18.5*cell,5.5*cell);ctx.lineTo(22.5*cell,5.5*cell);ctx.lineTo(22.5*cell,11.5*cell);ctx.stroke();
    for(const s of region.stations){const x=s.x*cell+18,y=s.y*cell+18;ctx.fillStyle='#193b3d';ctx.fillRect(x-27,y-25,54,50);ctx.strokeStyle=complete(s.id)?'#81d3a5':current()?.id===s.id?'#f2a753':'#789793';ctx.lineWidth=3;ctx.strokeRect(x-27,y-25,54,50);
      if(s.id==='wheel'||s.id==='gears'){ctx.save();ctx.translate(x,y);ctx.rotate(complete('wheel')?time/1200:0);ctx.strokeStyle='#d6b87f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();for(let a=0;a<8;a++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(18,0);ctx.stroke();}ctx.restore();}
      else if(s.id==='canal'){ctx.strokeStyle=complete(s.id)?'#79d8f1':'#d6b87f';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x-15,y-15);ctx.lineTo(x,y-15);ctx.lineTo(x,y+15);ctx.lineTo(x+15,y+15);ctx.stroke();}
      else{ctx.fillStyle=complete(s.id)?'#7ecea0':'#c19b72';ctx.fillRect(x-15,y-18,30,36);ctx.fillStyle='#193b3d';ctx.fillRect(x-3,y-18,6,36);}
      ctx.font='bold 14px system-ui';ctx.textAlign='center';const width=ctx.measureText(s.name).width+14;ctx.fillStyle='#142c42';ctx.fillRect(x-width/2,y-50,width,23);ctx.fillStyle='#fff';ctx.fillText(s.name,x,y-34);
      if(complete(s.id)){ctx.fillStyle='#bcf4ce';ctx.font='bold 18px system-ui';ctx.fillText('✓',x+23,y+23);}
    }
    ctx.fillStyle=complete('gate')?'#70b894':'#283c43';ctx.fillRect(21*cell,13*cell,3*cell,cell);
    ctx.fillStyle='#fff';ctx.font='14px system-ui';ctx.fillText(complete('gate')?'Archive open':'Archive sealed',22.5*cell,14*cell+22);
    const p=state.position,px=p.x*cell+18,py=p.y*cell+18;ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(px,py+12,12,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ed8a38';ctx.fillRect(px-8,py-3,16,18);ctx.fillStyle='#f6d5ae';ctx.fillRect(px-7,py-14,14,13);ctx.fillStyle='#142c42';ctx.fillRect(px-8,py-17,16,6);ctx.fillRect(px-7,py+15,5,5);ctx.fillRect(px+2,py+15,5,5);
    if(paused){ctx.fillStyle='#142c42cc';ctx.fillRect(0,0,936,576);ctx.fillStyle='#fff';ctx.font='bold 36px system-ui';ctx.fillText('Paused',468,280);}
    if(state.completed){ctx.fillStyle='#142c42';ctx.fillRect(260,15,416,39);ctx.fillStyle='#bdf0d0';ctx.font='bold 20px system-ui';ctx.fillText('Waterworks Valley restored',468,42);}
  }
  function frame(time){const dt=Math.min(time-lastTime,100);lastTime=time;
    if(!paused&&!dialog.open&&!$('#reset-dialog').open&&!document.hidden){stepTime+=dt;if(stepTime>=125){stepTime=0;if(keys.size){const d=directions[[...keys].at(-1)];if(d)move(...d);}else if(route.length){const next=route.shift();if(!blocked(next.x,next.y))state.position=next;else{route=[];destination=null;}if(!route.length&&destination){const s=destination;destination=null;openStation(s);}}}
      if(time-lastSave>2500){lastSave=time;save();}}
    draw(time);requestAnimationFrame(frame);
  }
  $('#report').addEventListener('click',()=>{
    document.querySelector('.ar-print-only')?.remove();const report=document.createElement('section');report.className='ar-print-only';report.innerHTML=`<h1>Apprentice Restorer</h1><h2>Waterworks Valley · Field notebook</h2><p>Name: ____________________ &nbsp; Class: ____________________</p><p>${state.repairs.length}/4 repairs · ${state.completed?'Archive complete':'Adventure in progress'}</p>`+region.stations.map(s=>`<article><h3>${escape(s.name)} · ${complete(s.id)?'Restored':'Not yet restored'}</h3>${complete(s.id)?`<p>${escape(s.discovery)}</p>`:''}<p>Experiments: ${state.attempts[s.id]||0} · Hints: ${state.hints[s.id]||0}</p><p>My observation: ${escape(state.notes[s.id]||'________________________________________')}</p></article>`).join('')+'<p>Explain the energy journey: moving water → wheel and gears → generator → motor.</p>';document.body.append(report);window.print();
  });
  refresh();if(state.repairs.length)status(state.completed?'Welcome back! The valley is restored. Your notebook is saved.':`Welcome back! Continue at ${current()?.name||'the archive gate'}.`);requestAnimationFrame(frame);
}
