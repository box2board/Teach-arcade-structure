import { artwork } from './artwork.js';
const configuration=document.querySelector('script[data-map]');
const [{createAdventure},{content}]=await Promise.all([import(configuration.dataset.map),import(configuration.dataset.questionSet)]);
import {createReview,answerReview,reviewSummary} from './review.js';
import {validateAdventure} from './validate.js';
import {roomAt as findRoom,objectiveFor,progressFor,rewardFor} from './presentation.js';
import {roomSize,mountLayout} from './viewport.js';
let map=validateAdventure(createAdventure());
import { createState, move, undo, interact, doorOpen, completeChallenge, resetPuzzle, exitReady, cluesReady, lightPaths, inventoryEntries, adventureResults } from './model.js';
const $=id=>document.getElementById(id);
let state=createState(map), started=false, held=null, nextStep=0, elapsed=0, last=0;
state.review=createReview(map,content.questions);
let activeQuestion=null;
const board=$('board'), dialog=$('dialog');
const {stage,sidebar}=mountLayout();
let roomColumns=1,roomRows=1;
function fitRoom(){
  if(!stage)return;
  const size=roomSize(stage.clientWidth,stage.clientHeight,roomColumns,roomRows);
  if(size){board.style.width=size.width+'px';board.style.height=size.height+'px';board.style.setProperty('--tile-size',size.cell+'px');}
}
if(stage&&typeof ResizeObserver==='function')new ResizeObserver(fitRoom).observe(stage);
window.addEventListener('resize',fitRoom);
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function sprite(kind,facing){const host=element('span',undefined,'art');host.innerHTML=artwork(kind,facing);return host;}
let fullMessage='';
const messageDetails=element('button','Read full message','message-details');messageDetails.hidden=true;
$('message').after(messageDetails);
function updateMessageDetails(){
  messageDetails.hidden=!fullMessage||!$('message').clientHeight||$('message').scrollHeight<=$('message').clientHeight+1;
}
messageDetails.addEventListener('click',()=>{if(!dialog.open)popup('MESSAGE','Adventure message',[fullMessage],[{text:'Back to adventure',run:resume,primary:true}]);});
if(sidebar&&typeof ResizeObserver==='function')new ResizeObserver(updateMessageDetails).observe($('message'));
function message(text,tone='neutral'){fullMessage=text;$('message').textContent=text;$('message').dataset.tone=tone;requestAnimationFrame(updateMessageDetails);}
for(const icon of document.querySelectorAll('.legend i')){
  const kind={'■':'block','◎':'plate','▣':'challenge','ϟ':'lever','⚒':'tool','◆':'item','◇':'exit'}[icon.textContent];
  if(kind){icon.innerHTML=artwork(kind);icon.classList.add('legend-art');icon.setAttribute('aria-hidden','true');}
}
const journal=element('div',undefined,'journal');journal.hidden=true;$('inventory').after(journal);
function roomAt(x,y){return findRoom(map,x,y);}
const circuitPanel=element('div',undefined,'circuit-panel');
circuitPanel.hidden=true;if(sidebar)sidebar.prepend(circuitPanel);else board.before(circuitPanel);
function render(){
  const light=lightPaths(map,state);
  lightLayer.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${map.tiles[0].length} ${map.tiles.length}" preserveAspectRatio="none" aria-hidden="true">${light.segments.map(s=>`<path d="M${s.from.x+.5} ${s.from.y+.5}L${s.to.x+.5} ${s.to.y+.5}"/>`).join('')}</svg>`;
  $('entities').replaceChildren();
  const items=[...map.plates.map(o=>({...o,type:'plate'})),...map.doors.map(o=>({...o,type:'door'})),...map.objects,...state.blocks.map(o=>({...o,type:o.kind==='mirror'?'mirror':'block'}))];
  for(const item of items){
    if(state.collected.includes(item.id))continue;
    let active=item.type==='door'?doorOpen(map,state,item):item.type==='plate'?state.blocks.some(b=>b.x===item.x&&b.y===item.y):item.type==='exit'?exitReady(map,state,item):item.type==='receiver'?light.powered.includes(item.id):item.type==='bridge'?state.opened.includes(item.id):state.activated.includes(item.id);
    const e=element('div',undefined,`entity sprite ${item.type}${item.appearance?' '+item.appearance:''}${active?' active':''}${item.type==='door'&&active?' open':''}${state.solved.includes(item.id)?' done':''}`);
    e.style.left=`${item.x/map.tiles[0].length*100}%`;e.style.top=`${item.y/map.tiles.length*100}%`;const kind=item.type==='door'?(active?'open':item.appearance==='cracked'?'cracked':'door'):item.type==='mirror'?(item.orientation==='/'?'mirror':'mirror-back'):item.type==='bridge'?(active?'bridge':'bridge-down'):item.type==='bridgeSwitch'?'lever':item.appearance||item.type;
    e.append(sprite(kind));
    if(['lever','bridgeSwitch'].includes(item.type)&&item.label)e.append(element('small',item.label,'switch-label'));
    if(item.type==='exit'&&item.sequencePuzzle){
      const puzzle=(map.puzzles||[]).find(p=>p.id===item.sequencePuzzle);
      const lights=element('div',undefined,'door-lights');
      for(let i=0;i<(puzzle?.sequence.length||0);i++)lights.append(element('b',String(i+1),i<(state.sequences[puzzle.id]||0)?'lit':''));
      e.append(lights);e.append(element('small',active?'OPEN':'EXIT','exit-label'));
    }
    $('entities').append(e);
  }
  $('player').style.left=`${state.player.x/map.tiles[0].length*100}%`;$('player').style.top=`${state.player.y/map.tiles.length*100}%`;if($('player').dataset.facing!==state.facing||!$('player').querySelector('svg'))$('player').replaceChildren(sprite('hero',state.facing));$('player').dataset.facing=state.facing;
  const room=roomAt(state.player.x,state.player.y)||map.rooms[0];
  board.dataset.theme=room.theme||'hall';
  const viewMin=room.viewMin??0, viewMax=room.viewMax??(map.tiles[0].length-1);
  const viewWidth=viewMax-viewMin+1;
  const viewMinY=room.viewMinY??0,viewHeight=(room.viewMaxY??map.tiles.length-1)-viewMinY+1;
  roomColumns=viewWidth;roomRows=viewHeight;fitRoom();
  board.style.aspectRatio=`${viewWidth}/${viewHeight}`;
  $('world').style.height=`${map.tiles.length/viewHeight*100}%`;
  $('world').style.top=`${-viewMinY/viewHeight*100}%`;
  $('world').style.width=`${map.tiles[0].length/viewWidth*100}%`;
  $('world').style.left=`${-viewMin/viewWidth*100}%`;
  $('map-labels').textContent=room.name;
  let objective=objectiveFor(map,state,room);
  const exit=map.objects.find(o=>o.type==='exit'&&o.sequencePuzzle);
  const puzzle=(map.puzzles||[]).find(p=>p.id===exit?.sequencePuzzle);
  const inChamber=Boolean(exit&&roomAt(exit.x,exit.y)===room&&puzzle);
  circuitPanel.hidden=!inChamber;
  if(inChamber){
    const progress=state.sequences[puzzle.id]||0;
    const ready=exitReady(map,state,exit), missing=(exit.requiredItems||[]).filter(id=>!state.items.includes(id));
    const known=cluesReady(puzzle,state);
    circuitPanel.replaceChildren(element('strong',ready?'EXIT UNLOCKED':'POWER THE EXIT'),element('p',!known?(puzzle.clueHint||'Find the clues for this sequence.'):puzzle.showNext===false?(puzzle.knownText||'Follow the clues in your journal.'):puzzle.sequence.map(id=>map.objects.find(o=>o.id===id)?.label||id).join(' → ')),element('p',`Door lights: ${progress} / ${puzzle.sequence.length} · Supplies: ${missing.length?missing.map(id=>map.inventory.find(i=>i.value===id)?.label||id).join(', ')+' needed':'ready'}`,'circuit-detail'));
    objective=!known?(puzzle.clueHint||'Find the clues for this sequence.'):ready?'Walk to the glowing exit and interact.':progress===puzzle.sequence.length?'Earn the missing supplies from their chests, then return to the exit.':'Face a labeled switch and interact. Each correct step powers one door light.';
  }
  const count=reviewSummary(state.review).total,modeLabel=map.modes?.find(m=>m.id===map.mode)?.label||map.mode||'Explore';
  $('difficulty').textContent=`${modeLabel} · ${count} ${count===1?'question':'questions'}`;
  $('room').textContent=room.name;$('objective').textContent=state.won?'Adventure complete!':objective;
  const previousItems=new Set(Array.from($('inventory').children,item=>item.dataset.item));
  const badges=inventoryEntries(map,state);
  $('inventory').replaceChildren(...badges.map(item=>{
    const badge=element('div',undefined,`inventory-badge${item.status==='Used'?' used':''}`);
    badge.dataset.item=item.id;
    if(!previousItems.has(item.id)){badge.classList.add('pickup-flash');setTimeout(()=>badge.classList.remove('pickup-flash'),700);}
    const icon=sprite(item.appearance||(item.optional?'treasure':item.type));icon.classList.add('inventory-icon');icon.setAttribute('aria-hidden','true');
    const reward=map.objects.find(o=>o.optional&&o.item===item.value)?.bonusPoints||0;
    badge.append(icon,element('span',item.label),element('small',item.optional?`Bonus +${reward}`:item.status));
    return badge;
  }));
  if(!badges.length)$('inventory').append(element('span','No items yet — walk over loose items to collect them.','inventory-empty'));$('seals').textContent=inChamber?`Door lights: ${state.sequences[puzzle.id]||0} / ${puzzle.sequence.length}`:`${progressFor(map,state).label}: ${progressFor(map,state).completed} / ${progressFor(map,state).total}`;
  const clues=(map.clues||[]).filter(c=>state.discovered.includes(c.id));journal.hidden=!clues.length;journal.textContent=clues.map(c=>`${c.label}: ${c.text}`).join(' · ');
  board.setAttribute('aria-label',`${room.name}. Position column ${state.player.x}, row ${state.player.y}. ${objective} Move with arrows or WASD; interact with E or Space.`);
  $('undo').disabled=!started||state.won||!state.history.length;
  $('reset-puzzle').disabled=!started||state.won;
  $('interact').disabled=!started||state.won;
  for(const b of document.querySelectorAll('[data-dir]'))b.disabled=!started||state.won;
}
const decor=element('div',undefined,'room-decor');
decor.setAttribute('aria-hidden','true');$('world').prepend(decor);
const lightLayer=element('div',undefined,'light-paths');$('world').append(lightLayer);
function buildWorld(){
  const width=map.tiles[0].length,height=map.tiles.length;
  $('world').style.setProperty('--cell',`${100/width}%`);$('world').style.setProperty('--row',`${100/height}%`);
  $('tiles').style.setProperty('--columns',width);$('tiles').style.setProperty('--rows',height);
  $('tiles').replaceChildren();decor.replaceChildren();
  for(const [y,row] of map.tiles.entries())for(const [x,tile] of Array.from(row).entries()){
    const room=roomAt(x,y);$('tiles').append(element('div',undefined,`tile ${room?.theme||'hall'}${tile==='#'?' wall':''}${tile==='~'?' water':''}`));
  }
  for(const decoration of map.decorations||[]){
    const lamp=element('div',undefined,'decoration lamp');
    lamp.style.left=`${decoration.x/width*100}%`;lamp.style.top=`${decoration.y/height*100}%`;
    lamp.append(sprite(decoration.appearance||'lamp'));decor.append(lamp);
  }
}
buildWorld();
let walkingTimer;
function release(){held=null;nextStep=0;clearTimeout(walkingTimer);$('player').classList.remove('walking');}
function popup(label,title,paragraphs,actions){
  release();$('dialog-label').textContent=label;$('dialog-title').textContent=title;$('dialog-body').replaceChildren(...paragraphs.map(t=>element('p',t)));$('answers').replaceChildren();$('feedback').textContent='';$('dialog-actions').replaceChildren();
  for(const {text,run,primary} of actions){const b=element('button',text,primary?'primary':'');b.addEventListener('click',run);$('dialog-actions').append(b);}
  if(!dialog.open)dialog.showModal();
}
function resume(){dialog.close();release();last=0;board.focus();}
let pickupFlashTimer;
function pickupFeedback(items){
  for(const item of items){
    const effect=element('div',undefined,'pickup-effect');effect.append(sprite(item.appearance==='treasure'?'treasure':item.type));
    effect.style.left=`${item.x/map.tiles[0].length*100}%`;effect.style.top=`${item.y/map.tiles.length*100}%`;
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
  const effect=element('div',undefined,'pickup-effect');effect.append(sprite(door.tool?'tool':'key'));
  effect.style.left=`${door.x/map.tiles[0].length*100}%`;effect.style.top=`${door.y/map.tiles.length*100}%`;
  effect.setAttribute('aria-hidden','true');$('world').append(effect);setTimeout(()=>effect.remove(),700);
}
function performMove(dir){
  if(!started||dialog.open||state.won)return;
  const previouslyOpen=new Set(map.doors.filter(d=>doorOpen(map,state,d)).map(d=>d.id)), previous=new Set(state.collected), openedBefore=new Set(state.opened);
  const moved=move(map,state,dir);render();
  if(moved){$('player').classList.add('walking');clearTimeout(walkingTimer);walkingTimer=setTimeout(()=>$('player').classList.remove('walking'),190);}
  for(const door of map.doors)if(!previouslyOpen.has(door.id)&&doorOpen(map,state,door)&&!door.key&&!door.tool)message(door.openText||'Gate opened. The floor switches are occupied.');
  const pickups=map.objects.filter(o=>state.collected.includes(o.id)&&!previous.has(o.id));
  if(pickups.length)pickupFeedback(pickups);
  if(state.moveFeedback)message(state.moveFeedback.text,state.moveFeedback.tone);
  for(const id of state.opened.filter(id=>!openedBefore.has(id)))doorFeedback(map.doors.find(d=>d.id===id));
}
let interactionTimer;
function performInteraction(){
  if(!started||dialog.open||state.won)return;
  release();$('player').classList.add('interacting');clearTimeout(interactionTimer);interactionTimer=setTimeout(()=>$('player').classList.remove('interacting'),240);
  const result=interact(map,state);render();
  if(result.type==='message')message(result.text,result.tone);
  if(result.type==='challenge')openQuestion(result.id);
  if(result.type==='win'){
    $('pause').disabled=true;
    const results=adventureResults(map,state), learning=reviewSummary(state.review);
    popup(map.completion?.label||'QUEST COMPLETE',map.completion?.title||'Adventure complete',[map.completion?.summary||'You completed the adventure.',`Treasure found: ${results.treasureFound} / ${results.treasureTotal} · Treasure bonus: +${results.bonusPoints} points.`,`Review points: ${results.reviewPoints} · Total points: ${results.totalPoints}.`,`Review completed: ${learning.completed} / ${learning.total} · Correct on first try: ${learning.firstTry} · Answer attempts: ${learning.attempts}.`,`Exploration time: ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s · Moves: ${state.moves}.`],[{text:'Play again',run:restart,primary:true},{text:'Back to Arcade',run:()=>{window.location.href='/arcade-review-games/';}}]);
  }
}
function openQuestion(id){
  const chest=map.objects.find(o=>o.id===id), encounter=state.review.encounters[id];
  activeQuestion={id};
  const reward=rewardFor(map,chest);
  if(encounter.index===encounter.questions.length){
    completeChallenge(map,state,id);render();activeQuestion=null;resume();message(reward.message||reward.label+' earned!','correct');return;
  }
  const entry=encounter.questions[encounter.index], question=entry.question;
  popup('REVIEW REWARD',chest.label||'Reward chest',[
    `Question ${encounter.index+1} of ${encounter.questions.length} · Reward: ${reward.label}`,
    question.text
  ],[{text:'Return to map',run:()=>{activeQuestion=null;resume();}}]);
  for(const choice of question.choices){
    const b=element('button',choice);
    if(entry.tried.includes(choice)){b.disabled=true;b.classList.add('wrong');}
    b.addEventListener('click',()=>{
      if(!activeQuestion||activeQuestion.id!==id||b.disabled)return;
      const result=answerReview(state.review,id,choice);
      if(result.type==='ignored')return;
      state.attempts[id]=(state.attempts[id]||0)+1;
      if(result.type==='wrong'){
        b.classList.add('wrong');b.disabled=true;
        $('feedback').textContent='Try again. '+result.explanation;
        return;
      }
      b.classList.add('correct');for(const answer of $('answers').children)answer.disabled=true;
      $('feedback').textContent='Correct! '+result.explanation;
      $('dialog-actions').replaceChildren();
      const next=element('button',result.complete?'Collect '+reward.label:'Next question','primary');
      next.addEventListener('click',()=>{
        if(result.complete){
          completeChallenge(map,state,id);activeQuestion=null;resume();message(reward.message||reward.label+' earned!','correct');render();
        }else openQuestion(id);
      });
      $('dialog-actions').append(next);next.focus();render();
    });$('answers').append(b);
  }
}
function restart(){state=createState(map);state.review=createReview(map,content.questions);activeQuestion=null;elapsed=0;started=true;$('pause').disabled=false;render();resume();message(map.startMessage||'Explore the map and read the nearby signs.');}
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
$('reset-puzzle').addEventListener('click',()=>popup('RESET PUZZLE','Restore the movable objects?',['You will return to the entrance. Earned keys, tools, collectibles, opened paths, and completed questions stay saved for this play.'],[{text:'Reset puzzle',run:()=>{resetPuzzle(map,state);render();resume();message('Movable objects restored. Your earned progress and raised bridges are kept.');},primary:true},{text:'Keep exploring',run:resume}]));
$('pause').addEventListener('click',pause);
dialog.addEventListener('cancel',e=>{e.preventDefault();if(started&&!state.won){activeQuestion=null;resume();}});
function frame(now){if(started&&!dialog.open&&!state.won&&!document.hidden){if(last)elapsed+=Math.min((now-last)/1000,.1);if(held&&now>=nextStep){performMove(held);nextStep=now+165;}}last=now;requestAnimationFrame(frame);}
function chooseMode(){
  const modes=map.modes||[{id:map.mode,label:'Explore',description:'Explore this adventure.'}];
  popup('QUEST ARCADE · '+map.title,'Choose your adventure',[
    ...modes.map(mode=>mode.label+': '+mode.description),
    'Question order and choices change each play. Missed answers allow retries. Chest progress stays saved when you return to the map.'
  ],modes.map((mode,index)=>({text:mode.label,run:()=>startMode(mode.id),primary:index===0})));
}
function startMode(mode){map=validateAdventure(createAdventure(mode));buildWorld();restart();}
const titleRow=document.querySelector('.title-row');
if(titleRow){
  const actions=element('div',undefined,'title-actions');actions.append($('pause'));
  const supplies=element('button','Bag & clues','supplies-button');
  supplies.addEventListener('click',()=>{
    if(dialog.open)return;
    const items=inventoryEntries(map,state).map(i=>`${i.label} · ${i.status}`),clues=(map.clues||[]).filter(c=>state.discovered.includes(c.id)).map(c=>`${c.label}: ${c.text}`);
    popup('INVENTORY','Bag & clues',[...(items.length?items:['No items collected yet.']),...clues],[{text:'Back to adventure',run:resume,primary:true}]);
  });actions.append(supplies);
  const help=element('button','Help');help.addEventListener('click',()=>{
    if(dialog.open)return;
    popup('HOW TO PLAY','Adventure controls',['Move with arrow keys, WASD, or the on-screen arrows. Walk over loose items to collect them. Matching keys and tools open doors when you walk into them.','Face a chest, sign, or switch and press Interact, E, or Space. Walk into blocks and mirrors to push them; interact with a mirror to rotate it.','Undo reverses your last physical move. Reset puzzle restores movable objects and returns you to the entrance while keeping earned rewards, clues, and raised bridges.'],[{text:'Back to adventure',run:resume,primary:true}]);
  });actions.append(help);
  if(document.fullscreenEnabled){
    const fullscreen=element('button','Fullscreen','fullscreen-button');
    fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message('Fullscreen is unavailable in this browser.');}});
    document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';fitRoom();});actions.append(fullscreen);
  }
  titleRow.append(actions);
}
render();chooseMode();
requestAnimationFrame(frame);
