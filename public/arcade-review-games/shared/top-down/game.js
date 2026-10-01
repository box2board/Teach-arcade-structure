const configuration=document.querySelector('script[data-map]');
const [{adventure:map},{content}]=await Promise.all([import(configuration.dataset.map),import(configuration.dataset.questionSet)]);
import { createState, move, undo, interact, doorOpen, completeChallenge, resetPuzzle, shuffle, exitReady, inventoryEntries } from './model.js';
const $=id=>document.getElementById(id);
let state=createState(map), started=false, held=null, nextStep=0, elapsed=0, last=0;
let questionDeck=shuffle(content.questions), activeQuestion=null;
const board=$('board'), dialog=$('dialog');
const symbols={block:'▤',plate:'◎',door:'⌑',challenge:'▣',sign:'i',lever:'ϟ',exit:'◇',tool:'⚒',item:'◆',key:'⚿',obstacle:''};
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function message(text,tone='neutral'){$('message').textContent=text;$('message').dataset.tone=tone;}
function sealed(){return Number(doorOpen(map,state,map.doors[0]))+Number(state.opened.includes('east'))+Number(exitReady(map,state,map.objects.find(o=>o.type==='exit')));}
const circuitPanel=element('div',undefined,'circuit-panel');
circuitPanel.hidden=true;board.before(circuitPanel);
function render(){
  $('entities').replaceChildren();
  const items=[...map.plates.map(o=>({...o,type:'plate'})),...map.doors.map(o=>({...o,type:'door'})),...map.objects,...state.blocks.map(o=>({...o,type:'block'}))];
  for(const item of items){
    if(state.collected.includes(item.id))continue;
    let active=item.type==='door'?doorOpen(map,state,item):item.type==='plate'?state.blocks.some(b=>b.x===item.x&&b.y===item.y):item.type==='exit'?exitReady(map,state,item):state.activated.includes(item.id);
    const e=element('div',undefined,`entity ${item.type}${item.appearance?' '+item.appearance:''}${active?' active':''}${item.type==='door'&&active?' open':''}${state.solved.includes(item.id)?' done':''}`);
    e.style.left=`${item.x/21*100}%`;e.style.top=`${item.y/13*100}%`;e.append(element('span',active&&item.type==='door'?'·':item.type==='exit'?(active?'↗':'🔒'):item.appearance==='treasure'?'★':symbols[item.type]));
    if(item.type==='lever'&&item.label)e.append(element('small',item.label,'switch-label'));
    if(item.type==='exit'&&item.sequencePuzzle){
      const puzzle=(map.puzzles||[]).find(p=>p.id===item.sequencePuzzle);
      const lights=element('div',undefined,'door-lights');
      for(let i=0;i<(puzzle?.sequence.length||0);i++)lights.append(element('b',String(i+1),i<(state.sequences[puzzle.id]||0)?'lit':''));
      e.append(lights);e.append(element('small',active?'OPEN':'EXIT','exit-label'));
    }
    $('entities').append(e);
  }
  $('player').style.left=`${state.player.x/21*100}%`;$('player').style.top=`${state.player.y/13*100}%`;$('player').dataset.facing=state.facing;
  const room=map.rooms.find(r=>state.player.x>=r.min&&state.player.x<=r.max)||map.rooms[0];
  board.dataset.theme=room.theme||'hall';
  const viewMin=room.viewMin??0, viewMax=room.viewMax??(map.tiles[0].length-1);
  const viewWidth=viewMax-viewMin+1;
  board.style.aspectRatio=`${viewWidth}/${map.tiles.length}`;
  $('world').style.width=`${map.tiles[0].length/viewWidth*100}%`;
  $('world').style.left=`${-viewMin/viewWidth*100}%`;
  $('map-labels').textContent=room.name;
    let objective=room.objective;
  if(room===map.rooms[0] && state.tools.includes('hammer'))objective=state.items.includes('seal-crystal')?'Take the seal crystal to the final chamber.':'Walk into the cracked wall to the north with your hammer, then collect the seal crystal.';
  if(room===map.rooms[1])objective=state.tools.includes('hammer')?(state.items.includes('seal-crystal')?'Unlock the east gate and continue to the final chamber.':'Return to Switch Hall. Walk into its cracked wall with your hammer.'):'Find the hammer in the lower Archive and earn the key from the chest.';
  const exit=map.objects.find(o=>o.type==='exit'&&o.sequencePuzzle);
  const puzzle=(map.puzzles||[]).find(p=>p.id===exit?.sequencePuzzle);
  const inChamber=Boolean(exit&&exit.x>=room.min&&exit.x<=room.max&&puzzle);
  circuitPanel.hidden=!inChamber;
  if(inChamber){
    const progress=state.sequences[puzzle.id]||0;
    const ready=exitReady(map,state,exit), crystal=(exit.requiredItems||[]).every(id=>state.items.includes(id));
    circuitPanel.replaceChildren(element('strong',ready?'EXIT UNLOCKED':'POWER THE EXIT'),element('p','TOP → BOTTOM → TOP'),element('p',`Door lights: ${progress} / ${puzzle.sequence.length} · Crystal: ${crystal?'ready':'missing — find it in Switch Hall'}`,'circuit-detail'));
    objective=ready?'Walk to the glowing exit and interact.':progress===puzzle.sequence.length?'Recover the seal crystal in Switch Hall, then return to the exit.':'Face a labeled switch and interact. Each correct step powers one door light.';
  }
  $('room').textContent=room.name;$('objective').textContent=state.won?'Adventure complete!':objective;
  const previousItems=new Set(Array.from($('inventory').children,item=>item.dataset.item));
  const badges=inventoryEntries(map,state);
  $('inventory').replaceChildren(...badges.map(item=>{
    const badge=element('div',undefined,`inventory-badge${item.status==='Used'?' used':''}`);
    badge.dataset.item=item.id;
    if(!previousItems.has(item.id)){badge.classList.add('pickup-flash');setTimeout(()=>badge.classList.remove('pickup-flash'),700);}
    const icon=element('span',item.icon,'inventory-icon');icon.setAttribute('aria-hidden','true');
    badge.append(icon,element('span',item.label),element('small',item.optional?'Bonus':item.status));
    return badge;
  }));
  if(!badges.length)$('inventory').append(element('span','No items yet — walk over loose items to collect them.','inventory-empty'));$('seals').textContent=inChamber?`Door lights: ${state.sequences[puzzle.id]||0} / ${puzzle.sequence.length}`:`Seals: ${sealed()} / 3`;
  board.setAttribute('aria-label',`${room.name}. Position column ${state.player.x}, row ${state.player.y}. ${objective} Move with arrows or WASD; interact with E or Space.`);
  $('undo').disabled=!started||state.won||!state.history.length;
  $('reset-puzzle').disabled=!started||state.won;
  $('interact').disabled=!started||state.won;
  for(const b of document.querySelectorAll('[data-dir]'))b.disabled=!started||state.won;
}
for(const row of map.tiles)for(const [x,tile] of Array.from(row).entries()){
  const room=map.rooms.find(r=>x>=r.min&&x<=r.max);
  $('tiles').append(element('div',undefined,`tile ${room?.theme||'hall'}${tile==='#'?' wall':''}`));
}
function release(){held=null;nextStep=0;}
function popup(label,title,paragraphs,actions){
  release();$('dialog-label').textContent=label;$('dialog-title').textContent=title;$('dialog-body').replaceChildren(...paragraphs.map(t=>element('p',t)));$('answers').replaceChildren();$('feedback').textContent='';$('dialog-actions').replaceChildren();
  for(const {text,run,primary} of actions){const b=element('button',text,primary?'primary':'');b.addEventListener('click',run);$('dialog-actions').append(b);}
  if(!dialog.open)dialog.showModal();
}
function resume(){dialog.close();release();last=0;board.focus();}
let pickupFlashTimer;
function pickupFeedback(items){
  for(const item of items){
    const effect=element('div',item.appearance==='treasure'?'★':symbols[item.type]||'✦','pickup-effect');
    effect.style.left=`${item.x/21*100}%`;effect.style.top=`${item.y/13*100}%`;
    effect.setAttribute('aria-hidden','true');$('world').append(effect);
    setTimeout(()=>effect.remove(),700);
  }
  const inventory=$('inventory');inventory.classList.remove('pickup-flash');
  void inventory.offsetWidth;inventory.classList.add('pickup-flash');
  clearTimeout(pickupFlashTimer);pickupFlashTimer=setTimeout(()=>inventory.classList.remove('pickup-flash'),700);
  message(items.map(item=>item.text||`${item.label||'Item'} collected!`).join(' '),'correct');
}
function doorFeedback(door){
  if(!door)return;
  const effect=element('div',door.tool?'✦':'⚿','pickup-effect');
  effect.style.left=`${door.x/21*100}%`;effect.style.top=`${door.y/13*100}%`;
  effect.setAttribute('aria-hidden','true');$('world').append(effect);setTimeout(()=>effect.remove(),700);
}
function performMove(dir){
  if(!started||dialog.open||state.won)return;
  const was=doorOpen(map,state,map.doors[0]), previous=new Set(state.collected), openedBefore=new Set(state.opened);
  move(map,state,dir);render();
  if(!was&&doorOpen(map,state,map.doors[0]))message('First seal opened! The block is holding the switch. Head through the west gate.');
  const pickups=map.objects.filter(o=>state.collected.includes(o.id)&&!previous.has(o.id));
  if(pickups.length)pickupFeedback(pickups);
  if(state.moveFeedback)message(state.moveFeedback.text,state.moveFeedback.tone);
  for(const id of state.opened.filter(id=>!openedBefore.has(id)))doorFeedback(map.doors.find(d=>d.id===id));
}
function performInteraction(){
  if(!started||dialog.open||state.won)return;
  release();const result=interact(map,state);render();
  if(result.type==='message')message(result.text,result.tone);
  if(result.type==='challenge')openQuestion(result.id);
  if(result.type==='win'){
    $('pause').disabled=true;
    popup('ALL THREE SEALS OPEN','Adventure complete',[`You solved the block switch, unlocked the archive gate, recovered the seal crystal with your hammer, and solved the signal sequence.`,`Exploration time: ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s · Moves: ${state.moves} · Review points: ${state.score}.`,`Chest question attempts: ${state.attempts.archive||0}. Optional treasure: ${state.items.includes('explorer-token')?'Explorer token found!':'not found — explore the Archive on your next adventure.'}`],[{text:'Play again',run:restart,primary:true},{text:'Back to Arcade',run:()=>{window.location.href='/arcade-review-games/';}}]);
  }
}
function openQuestion(id){
  const question=questionDeck[0];activeQuestion={id,question,answered:false};
  popup('ARCHIVE CHEST','Earn the archive key',[question.text],[{text:'Return to map',run:()=>{activeQuestion=null;resume();}}]);
  for(const choice of shuffle(question.choices)){
    const b=element('button',choice);
    b.addEventListener('click',()=>{
      if(!activeQuestion||activeQuestion.answered||b.disabled)return;
      state.attempts[id]=(state.attempts[id]||0)+1;
      if(choice!==question.answer){b.classList.add('wrong');b.disabled=true;$('feedback').textContent='That answer does not fit. Try another choice, or return to the map and come back.';return;}
      activeQuestion.answered=true;completeChallenge(map,state,id);b.classList.add('correct');for(const answer of $('answers').children)answer.disabled=true;
      $('feedback').textContent=`Key earned! ${question.explanation}`;
      $('dialog-actions').replaceChildren();const next=element('button','Collect key & continue','primary');next.addEventListener('click',()=>{activeQuestion=null;resume();message('Archive key collected. Walk into the east gate to unlock it automatically.');render();});$('dialog-actions').append(next);next.focus();render();
    });$('answers').append(b);
  }
}
function restart(){state=createState(map);questionDeck=shuffle(content.questions);activeQuestion=null;elapsed=0;started=true;$('pause').disabled=false;render();resume();message('Read the sign or push the block onto the amber floor switch.');}
function pause(){if(!started||dialog.open||state.won)return;popup('ADVENTURE PAUSED','Take your time',['Your position and progress are safe.'],[{text:'Resume adventure',run:resume,primary:true},{text:'Restart adventure',run:()=>popup('RESTART','Start a new adventure?',['This clears your keys, switches, and progress.'],[{text:'Start over',run:restart,primary:true},{text:'Keep playing',run:resume}])}]);}
const keyDirs={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
board.addEventListener('keydown',e=>{
  const dir=keyDirs[e.key]||keyDirs[e.key.toLowerCase()];
  if(dir){e.preventDefault();if(!e.repeat){held=dir;nextStep=performance.now()+165;performMove(dir);}return;}
  if(e.key.toLowerCase()==='e'||e.key===' '){e.preventDefault();if(!e.repeat)performInteraction();}
  if(e.key==='Escape'){e.preventDefault();pause();}
});
window.addEventListener('keyup',e=>{const dir=keyDirs[e.key]||keyDirs[e.key.toLowerCase()];if(dir===held)release();});
window.addEventListener('blur',release);board.addEventListener('blur',release);
document.addEventListener('visibilitychange',()=>{release();last=0;if(document.hidden)pause();});
for(const b of document.querySelectorAll('[data-dir]')){
  b.addEventListener('pointerdown',e=>{if(b.disabled)return;e.preventDefault();b.setPointerCapture(e.pointerId);held=b.dataset.dir;nextStep=performance.now()+165;performMove(held);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{release();board.focus();});
  b.addEventListener('click',e=>{if(e.detail===0){performMove(b.dataset.dir);board.focus();}});
}
$('interact').addEventListener('click',()=>{performInteraction();if(!dialog.open)board.focus();});
$('undo').addEventListener('click',()=>{release();undo(state);render();message('Last move undone.');board.focus();});
$('reset-puzzle').addEventListener('click',()=>popup('RESET PUZZLE','Return the block to its start?',['You will return to the entrance. Earned keys, tools, collectibles, opened paths, and completed questions stay saved for this play.'],[{text:'Reset puzzle',run:()=>{resetPuzzle(map,state);render();resume();message('Block restored. Your earned progress is kept.');},primary:true},{text:'Keep exploring',run:resume}]));
$('pause').addEventListener('click',pause);
dialog.addEventListener('cancel',e=>{e.preventDefault();if(started&&!state.won){activeQuestion=null;resume();}});
function frame(now){if(started&&!dialog.open&&!state.won&&!document.hidden){if(last)elapsed+=Math.min((now-last)/1000,.1);if(held&&now>=nextStep){performMove(held);nextStep=now+165;}}last=now;requestAnimationFrame(frame);}
render();popup('QUEST ARCADE · THE THREE SEALS','Explore the courthouse',['Solve three connected rooms: hold a floor switch with a block, earn a key from the archive chest, collect a hammer and walk into the cracked wall to reopen a path in Switch Hall, and bring the hidden seal crystal to the final signal puzzle.','Move with arrows or WASD. Face an object and press E / Space to interact. Walk over loose items to collect them automatically. On a tablet, use the buttons below the map.','There is no time limit. Undo and Reset puzzle help you recover from a tricky push.'],[{text:'Start adventure',run:restart,primary:true}]);
requestAnimationFrame(frame);
