(()=>{
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const ui={score:document.getElementById('score'),lives:document.getElementById('lives'),stations:document.getElementById('stations'),evidence:document.getElementById('evidence'),focus:document.getElementById('focus'),focusFill:document.getElementById('focusFill'),objective:document.getElementById('objective'),status:document.getElementById('status'),questionLayer:document.getElementById('questionLayer'),qMeta:document.getElementById('qMeta'),qText:document.getElementById('qText'),answers:document.getElementById('answers'),banner:document.getElementById('banner'),endLayer:document.getElementById('endLayer'),endTitle:document.getElementById('endTitle'),endText:document.getElementById('endText')};

const BASE_MAP=[
'######################',
'#     #        #    1#',
'# ### # ###### # ### #',
'# #   #   #    #     #',
'# # ##### # ######## #',
'#2#       #         3#',
'# ####### #########  #',
'#        #           #',
'### #### # #######   #',
'#   #    T     #     #',
'# # #  ###### # ###  #',
'# #    #    #        #',
'# ###### ## #######  #',
'#4      #  #       5 #',
'# ### # #  # ####### #',
'#     #    #         #',
'# ####### #########  #',
'#                    #',
'#   #     #     #    #',
'######################'];

const STATION_INFO={
'1':{name:'Question Station',short:'QUESTION',accent:'#72e8ff'},
'2':{name:'Hypothesis Station',short:'HYPOTHESIS',accent:'#b58cff'},
'3':{name:'Test Station',short:'TEST',accent:'#ffb45c'},
'4':{name:'Analyze Station',short:'ANALYZE',accent:'#65e2a5'},
'5':{name:'Conclusion Station',short:'CONCLUDE',accent:'#ffd96a'}};
const STATION_ORDER=['1','2','3','4','5'];
const DIR={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}},OPP={up:'down',down:'up',left:'right',right:'left'};
const SETTINGS={easy:{speed:4.9,hazard:2.65,lives:4,freeze:3200,need:1},medium:{speed:5.25,hazard:3.15,lives:3,freeze:2600,need:1},hard:{speed:5.55,hazard:3.75,lives:2,freeze:2100,need:2}};
const EVIDENCE_POINTS=[[4,1],[11,1],[18,3],[6,5],[15,5],[5,7],[17,7],[2,9],[18,11],[6,13],[15,13],[4,15],[12,15],[18,17],[9,18]];
const HAZARD_SPAWNS=[[3.5,17.5,'tracker'],[18.5,17.5,'intercept'],[18.5,7.5,'patrol'],[7.5,7.5,'wander']];
let map,rows,cols,tile,player,hazards,state,last=0,selected=0,questionDeck=[];

function reset(){
 const diff=document.getElementById('difficulty').value,s=SETTINGS[diff];
 map=BASE_MAP.map(r=>r.split(''));rows=map.length;cols=map[0].length;tile=canvas.width/cols;
 questionDeck=shuffle([...window.MAZE_QUESTION_SET.questions.keys()]).slice(0,10);
 state={score:0,lives:s.lives,stationsDone:0,evidence:new Set(EVIDENCE_POINTS.map(p=>p.join(','))),evidenceTotal:EVIDENCE_POINTS.length,focus:0,freezeUntil:0,paused:false,ended:false,diff,s,stationLock:false,currentStation:null,stationQuestion:0,stationCorrect:0,questionCursor:0,terminalReady:false};
 player={x:9.5,y:9.5,dir:'right',want:'right',spawn:{x:9.5,y:9.5}};
 hazards=HAZARD_SPAWNS.map((h,i)=>mkHazard(h[0],h[1],h[2],i));
 ui.endLayer.classList.remove('open');ui.questionLayer.classList.remove('open');
 status('Leave the central terminal and activate the five research stations.','');
 updateHud();
}
function mkHazard(x,y,brain,i){return{x,y,brain,dir:i%2?'left':'right',spawn:{x,y},phase:i*.9};}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function centered(e){return Math.abs(e.x-(Math.floor(e.x)+.5))<.075&&Math.abs(e.y-(Math.floor(e.y)+.5))<.075;}
function canFrom(e,dir){const d=DIR[dir],cx=Math.floor(e.x),cy=Math.floor(e.y);return map[cy+d.y]?.[cx+d.x]!==undefined&&map[cy+d.y][cx+d.x]!=='#';}
function snap(e){e.x=Math.floor(e.x)+.5;e.y=Math.floor(e.y)+.5;}
function moveEntity(e,dt,speed,isPlayer=false){if(centered(e)){snap(e);if(isPlayer&&canFrom(e,e.want))e.dir=e.want;if(!canFrom(e,e.dir)){if(isPlayer&&canFrom(e,e.want))e.dir=e.want;else return;}}const d=DIR[e.dir];e.x+=d.x*speed*dt;e.y+=d.y*speed*dt;}
function setWant(dir){if(state.paused||state.ended)return;player.want=dir;if(centered(player)&&canFrom(player,dir))player.dir=dir;}
function cellOf(e){return{x:Math.floor(e.x),y:Math.floor(e.y)};}
function stationAt(x,y){const c=map[y]?.[x];return STATION_INFO[c]?c:null;}

function chooseHazard(h){
 if(!centered(h))return;snap(h);
 let choices=Object.keys(DIR).filter(d=>canFrom(h,d));if(choices.length>1)choices=choices.filter(d=>d!==OPP[h.dir]);if(!choices.length)choices=[OPP[h.dir]];
 let target={x:player.x,y:player.y};
 if(h.brain==='intercept'){const pd=DIR[player.dir];target={x:player.x+pd.x*3.5,y:player.y+pd.y*3.5};}
 if(h.brain==='patrol'){const idx=state.stationsDone%STATION_ORDER.length,pos=findChar(STATION_ORDER[idx]);target=pos?{x:pos.x+.5,y:pos.y+.5}:target;}
 if(h.brain==='wander'&&Math.random()<.68){h.dir=choices[Math.floor(Math.random()*choices.length)];return;}
 choices.sort((a,b)=>distAfter(h,a,target)-distAfter(h,b,target));
 if(Math.random()<.14&&choices.length>1)h.dir=choices[1];else h.dir=choices[0]||h.dir;
}
function distAfter(e,dir,t){const d=DIR[dir];return Math.hypot(e.x+d.x-t.x,e.y+d.y-t.y);}
function findChar(ch){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(map[y][x]===ch)return{x,y};return null;}

function interactWithCell(){
 const c=cellOf(player),key=`${c.x},${c.y}`;
 if(state.evidence.has(key)){state.evidence.delete(key);state.score+=70;banner('EVIDENCE +70');status('Evidence sample secured. Keep moving toward the active station.','good');}
 const st=stationAt(c.x,c.y);
 if(!st)state.stationLock=false;
 if(st&&!state.stationLock){
   state.stationLock=true;
   const expected=STATION_ORDER[state.stationsDone];
   if(st===expected)startStation(st);else if(STATION_ORDER.indexOf(st)<state.stationsDone)status(`${STATION_INFO[st].name} is already complete.`, '');else status(`${STATION_INFO[st].name} is offline. Complete ${STATION_INFO[expected].name} first.`, 'bad');
 }
 if(map[c.y]?.[c.x]==='T'&&state.terminalReady)finish(true);
 updateHud();
}

function startStation(id){state.paused=true;state.currentStation=id;state.stationQuestion=0;state.stationCorrect=0;askStationQuestion();}
function askStationQuestion(){
 const qIndex=questionDeck[state.questionCursor%questionDeck.length],q=window.MAZE_QUESTION_SET.questions[qIndex];state.currentQ=q;selected=0;
 ui.qMeta.textContent=`${STATION_INFO[state.currentStation].name} · ${state.stationQuestion+1} of 2`;
 ui.qText.textContent=q.q;ui.answers.innerHTML='';
 q.a.forEach((txt,i)=>{const b=document.createElement('button');b.className='answer'+(i===0?' selected':'');b.textContent=`${i+1}. ${txt}`;b.onclick=()=>answer(i);ui.answers.appendChild(b);});
 ui.questionLayer.classList.add('open');
}
function refreshSelected(){[...ui.answers.children].forEach((b,i)=>b.classList.toggle('selected',i===selected));ui.answers.children[selected]?.focus();}
function answer(i){
 if(!state.currentQ)return;const correct=i===state.currentQ.correct;
 if(correct){state.score+=175;state.focus=Math.min(100,state.focus+50);state.stationCorrect++;status('Correct — Focus Charge added.','good');banner('+ FOCUS');}
 else{state.score=Math.max(0,state.score-30);status(`Not quite — ${state.currentQ.explain}`,'bad');}
 state.questionCursor++;state.stationQuestion++;
 if(state.stationQuestion<2){setTimeout(askStationQuestion,180);return;}
 ui.questionLayer.classList.remove('open');state.currentQ=null;
 const passed=state.stationCorrect>=state.s.need;
 if(passed){const doneId=state.currentStation;state.stationsDone++;state.score+=300;banner(`${STATION_INFO[doneId].short} ONLINE`);if(state.stationsDone>=STATION_ORDER.length){state.terminalReady=true;status('All stations online. Return to the central Conclusion Terminal!','good');}else{status(`${STATION_INFO[doneId].name} complete. Next: ${STATION_INFO[STATION_ORDER[state.stationsDone]].name}.`,'good');}}
 else{status(`Station needs ${state.s.need} correct answer${state.s.need===1?'':'s'} out of 2. Move away and retry.`,'bad');}
 state.currentStation=null;state.paused=false;updateHud();
}

function useFocus(){
 if(state.paused||state.ended)return;
 if(state.focus<50){status('Collect more Focus Charge by answering correctly.','bad');return;}
 state.focus-=50;state.freezeUntil=performance.now()+state.s.freeze;banner('FOCUS PULSE');status('Interference frozen — reposition now!','good');updateHud();
}

function collide(){
 if(performance.now()<state.freezeUntil)return;
 for(const h of hazards){if(Math.hypot(h.x-player.x,h.y-player.y)<.5){loseLife();break;}}
}
function loseLife(){
 state.lives--;updateHud();if(state.lives<=0){finish(false);return;}
 state.paused=true;banner('INTERFERENCE HIT');status('Interference disrupted the run. Returning to the terminal.','bad');
 setTimeout(()=>{player.x=player.spawn.x;player.y=player.spawn.y;player.dir='right';player.want='right';hazards.forEach((h,i)=>{h.x=h.spawn.x;h.y=h.spawn.y;h.dir=i%2?'left':'right';});state.paused=false;},700);
}
function finish(win){state.ended=true;state.paused=true;ui.endLayer.classList.add('open');ui.endTitle.textContent=win?'Research Run Complete!':'Experiment Interrupted';ui.endText.textContent=win?`All five stations are online. You secured ${state.evidenceTotal-state.evidence.size} evidence samples and finished with ${state.score.toLocaleString()} points.`:`Final score: ${state.score.toLocaleString()}. The station questions will reshuffle on the next run.`;}

function updateHud(){
 ui.score.textContent=state.score.toLocaleString();ui.lives.textContent='◆'.repeat(Math.max(0,state.lives));ui.stations.textContent=`${state.stationsDone} / 5`;ui.evidence.textContent=`${state.evidenceTotal-state.evidence.size} / ${state.evidenceTotal}`;ui.focus.textContent=`${state.focus}%`;ui.focusFill.style.width=`${state.focus}%`;
 if(state.terminalReady)ui.objective.textContent='Return to the central Conclusion Terminal';else ui.objective.textContent=`Next: ${STATION_INFO[STATION_ORDER[state.stationsDone]].name}`;
}
function status(msg,cls){ui.status.textContent=msg;ui.status.className='status-line'+(cls?' '+cls:'');}
function banner(msg){ui.banner.textContent=msg;ui.banner.classList.add('show');clearTimeout(banner.t);banner.t=setTimeout(()=>ui.banner.classList.remove('show'),850);}

function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#071015';ctx.fillRect(0,0,canvas.width,canvas.height);
 drawFloor();drawWalls();drawZoneLabels();drawEvidence();drawStations();drawTerminal();hazards.forEach(drawHazard);drawPlayer();drawFreezeOverlay();
}
function drawFloor(){
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(map[y][x]!=='#'){
   const px=x*tile,py=y*tile;ctx.fillStyle=((x+y)%2)?'#0b171b':'#0d1b1f';ctx.fillRect(px,py,tile,tile);
   ctx.strokeStyle='rgba(124,171,174,.055)';ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,tile-1,tile-1);
 }
}
function drawWalls(){
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(map[y][x]==='#'){
   const px=x*tile,py=y*tile;ctx.fillStyle='#23343a';ctx.fillRect(px,py,tile,tile);ctx.fillStyle='#2e454c';ctx.fillRect(px+2,py+2,tile-4,5);ctx.fillStyle='#18262b';ctx.fillRect(px+tile-5,py+6,3,tile-8);
 }
}
function drawZoneLabels(){
 const labels=[['OBSERVE WING',2.2,3.7],['VARIABLE BAY',12.4,3.7],['TEST FLOOR',11.3,8.2],['DATA ARCHIVE',2.0,16.9],['ANALYSIS DECK',13.1,16.9]];
 ctx.save();ctx.fillStyle='rgba(167,213,216,.18)';ctx.font=`700 ${Math.max(10,tile*.34)}px system-ui`;for(const [t,x,y] of labels)ctx.fillText(t,x*tile,y*tile);ctx.restore();
}
function drawEvidence(){
 const pulse=1+Math.sin(performance.now()/220)*.08;
 for(const key of state.evidence){const [x,y]=key.split(',').map(Number),cx=(x+.5)*tile,cy=(y+.5)*tile,r=tile*.18*pulse;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.PI/4);ctx.fillStyle='#8fe8d0';ctx.fillRect(-r,-r,r*2,r*2);ctx.strokeStyle='#d9fff5';ctx.lineWidth=2;ctx.strokeRect(-r,-r,r*2,r*2);ctx.restore();}
}
function drawStations(){
 for(const id of STATION_ORDER){const p=findChar(id);if(!p)continue;const info=STATION_INFO[id],cx=(p.x+.5)*tile,cy=(p.y+.5)*tile,idx=STATION_ORDER.indexOf(id),done=idx<state.stationsDone,active=idx===state.stationsDone&&!state.terminalReady;
   ctx.save();ctx.translate(cx,cy);ctx.fillStyle=done?'#164b3b':active?'#243a43':'#172126';ctx.strokeStyle=done?'#65e2a5':active?info.accent:'#47555b';ctx.lineWidth=done||active?3:1.5;ctx.beginPath();ctx.roundRect(-tile*.38,-tile*.3,tile*.76,tile*.6,8);ctx.fill();ctx.stroke();ctx.fillStyle=done?'#baf7dc':active?info.accent:'#78878c';ctx.font=`800 ${tile*.28}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(id,0,0);ctx.restore();
 }
}
function drawTerminal(){
 const p=findChar('T'),cx=(p.x+.5)*tile,cy=(p.y+.5)*tile,r=tile*.36;ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=state.terminalReady?'#ffe36a':'#68848b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);ctx.stroke();ctx.fillStyle=state.terminalReady?'rgba(255,227,106,.18)':'rgba(104,132,139,.1)';ctx.beginPath();ctx.arc(0,0,r*.9,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawPlayer(){
 const x=player.x*tile,y=player.y*tile,d=DIR[player.dir],ang=Math.atan2(d.y,d.x);ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle='#63dcff';ctx.beginPath();ctx.moveTo(tile*.3,0);ctx.lineTo(-tile*.22,-tile*.2);ctx.lineTo(-tile*.1,0);ctx.lineTo(-tile*.22,tile*.2);ctx.closePath();ctx.fill();ctx.strokeStyle='#d9f8ff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#0b1c22';ctx.beginPath();ctx.arc(tile*.04,0,tile*.07,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawHazard(h){
 const x=h.x*tile,y=h.y*tile,frozen=performance.now()<state.freezeUntil,t=performance.now()/400+h.phase;ctx.save();ctx.translate(x,y);ctx.rotate(t*.35);ctx.strokeStyle=frozen?'#8cefff':'#ff6f76';ctx.fillStyle=frozen?'rgba(140,239,255,.18)':'rgba(255,111,118,.18)';ctx.lineWidth=2.4;for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(0,-tile*.28);ctx.lineTo(tile*.23,tile*.16);ctx.lineTo(-tile*.23,tile*.16);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();
}
function drawFreezeOverlay(){if(performance.now()>=state.freezeUntil)return;ctx.save();ctx.strokeStyle='rgba(112,231,255,.28)';ctx.lineWidth=5;ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);ctx.restore();}

function loop(ts){
 const dt=Math.min(.025,(ts-last)/1000||0);last=ts;
 if(!state.paused&&!state.ended){moveEntity(player,dt,state.s.speed,true);interactWithCell();if(performance.now()>=state.freezeUntil){for(const h of hazards){chooseHazard(h);moveEntity(h,dt,state.s.hazard,false);}}collide();}
 updateHud();draw();requestAnimationFrame(loop);
}
function key(e){
 if(ui.questionLayer.classList.contains('open')){if(['ArrowDown','ArrowRight'].includes(e.key)){e.preventDefault();selected=(selected+1)%ui.answers.children.length;refreshSelected();}else if(['ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();selected=(selected-1+ui.answers.children.length)%ui.answers.children.length;refreshSelected();}else if(e.key==='Enter'){e.preventDefault();answer(selected);}else if(/^[1-4]$/.test(e.key)){answer(Number(e.key)-1);}return;}
 const mapKey={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
 if(mapKey[e.key]){e.preventDefault();setWant(mapKey[e.key]);}else if(e.code==='Space'){e.preventDefault();useFocus();}
}
document.addEventListener('keydown',key,{passive:false});
document.querySelectorAll('.dpad button[data-dir]').forEach(b=>{const d=b.dataset.dir;b.addEventListener('pointerdown',e=>{e.preventDefault();setWant(d);},{passive:false});});
document.getElementById('focusBtn').onclick=useFocus;document.getElementById('restartBtn').onclick=reset;document.getElementById('playAgain').onclick=reset;document.getElementById('difficulty').onchange=reset;document.getElementById('fullBtn').onclick=()=>document.getElementById('stageCard').requestFullscreen?.();
reset();requestAnimationFrame(loop);
})();