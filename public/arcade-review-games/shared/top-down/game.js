const configuration=document.querySelector('script[data-map]');
const [{adventure:map},{content}]=await Promise.all([import(configuration.dataset.map),import(configuration.dataset.questionSet)]);
import { createState, move, undo, interact, doorOpen, completeChallenge, resetPuzzle, shuffle, exitReady } from './model.js';
const $=id=>document.getElementById(id);
let state=createState(map), started=false, held=null, nextStep=0, elapsed=0, last=0;
let questionDeck=shuffle(content.questions), activeQuestion=null;
const board=$('board'), dialog=$('dialog');
const symbols={block:'▤',plate:'◎',door:'⌑',challenge:'▣',sign:'i',lever:'ϟ',exit:'◇'};
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function message(text){$('message').textContent=text;}
function sealed(){return Number(doorOpen(map,state,map.doors[0]))+Number(state.opened.includes('east'))+Number(exitReady(map,state,map.objects.find(o=>o.type==='exit')));}
function render(){
  $('entities').replaceChildren();
  const items=[...map.plates.map(o=>({...o,type:'plate'})),...map.doors.map(o=>({...o,type:'door'})),...map.objects,...state.blocks.map(o=>({...o,type:'block'}))];
  for(const item of items){
    let active=item.type==='door'?doorOpen(map,state,item):item.type==='plate'?state.blocks.some(b=>b.x===item.x&&b.y===item.y):item.type==='exit'?exitReady(map,state,item):state.activated.includes(item.id);
    const e=element('div',undefined,`entity ${item.type}${active?' active':''}${item.type==='door'&&active?' open':''}${state.solved.includes(item.id)?' done':''}`);
    e.style.left=`${item.x/21*100}%`;e.style.top=`${item.y/13*100}%`;e.append(element('span',active&&item.type==='door'?'·':symbols[item.type]));$('entities').append(e);
  }
  $('player').style.left=`${state.player.x/21*100}%`;$('player').style.top=`${state.player.y/13*100}%`;$('player').dataset.facing=state.facing;
  const room=map.rooms.find(r=>state.player.x>=r.min&&state.player.x<=r.max)||map.rooms[0];
  const viewMin=room.viewMin??0, viewMax=room.viewMax??(map.tiles[0].length-1);
  const viewWidth=viewMax-viewMin+1;
  board.style.aspectRatio=`${viewWidth}/${map.tiles.length}`;
  $('world').style.width=`${map.tiles[0].length/viewWidth*100}%`;
  $('world').style.left=`${-viewMin/viewWidth*100}%`;
  $('map-labels').textContent=room.name;
  $('room').textContent=room.name;$('objective').textContent=state.won?'Adventure complete!':room.objective;
  $('inventory').textContent=state.keys.length?'Key: archive':state.opened.includes('east')?'Key: used':'Key: —';$('seals').textContent=`Seals: ${sealed()} / 3`;
  board.setAttribute('aria-label',`${room.name}. Position column ${state.player.x}, row ${state.player.y}. ${room.objective} Move with arrows or WASD; interact with E or Space.`);
  $('undo').disabled=!started||state.won||!state.history.length;
  $('reset-puzzle').disabled=!started||state.won;
  $('interact').disabled=!started||state.won;
  for(const b of document.querySelectorAll('[data-dir]'))b.disabled=!started||state.won;
}
for(const row of map.tiles)for(const tile of row)$('tiles').append(element('div',undefined,`tile${tile==='#'?' wall':''}`));
function release(){held=null;nextStep=0;}
function popup(label,title,paragraphs,actions){
  release();$('dialog-label').textContent=label;$('dialog-title').textContent=title;$('dialog-body').replaceChildren(...paragraphs.map(t=>element('p',t)));$('answers').replaceChildren();$('feedback').textContent='';$('dialog-actions').replaceChildren();
  for(const {text,run,primary} of actions){const b=element('button',text,primary?'primary':'');b.addEventListener('click',run);$('dialog-actions').append(b);}
  if(!dialog.open)dialog.showModal();
}
function resume(){dialog.close();release();last=0;board.focus();}
function performMove(dir){if(!started||dialog.open||state.won)return;const was=doorOpen(map,state,map.doors[0]);move(map,state,dir);render();if(!was&&doorOpen(map,state,map.doors[0]))message('First seal opened! The block is holding the switch. Head through the west gate.');}
function performInteraction(){
  if(!started||dialog.open||state.won)return;
  release();const result=interact(map,state);render();
  if(result.type==='message')message(result.text);
  if(result.type==='challenge')openQuestion(result.id);
  if(result.type==='win'){
    $('pause').disabled=true;
    popup('ALL THREE SEALS OPEN','Adventure complete',[`You solved the block switch, unlocked the archive gate, and solved the signal sequence.`,`Exploration time: ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s · Moves: ${state.moves} · Review points: ${state.score}.`,`Chest question attempts: ${state.attempts.archive||0}. Try a new route on your next adventure.`],[{text:'Play again',run:restart,primary:true},{text:'Back to Arcade',run:()=>{window.location.href='/arcade-review-games/';}}]);
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
      $('dialog-actions').replaceChildren();const next=element('button','Collect key & continue','primary');next.addEventListener('click',()=>{activeQuestion=null;resume();message('Archive key collected. Face the east gate and interact to unlock it.');render();});$('dialog-actions').append(next);next.focus();render();
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
$('reset-puzzle').addEventListener('click',()=>popup('RESET PUZZLE','Return the block to its start?',['You will return to the entrance. Earned keys, opened key gates, and completed questions stay saved for this play.'],[{text:'Reset puzzle',run:()=>{resetPuzzle(map,state);render();resume();message('Block restored. Your earned progress is kept.');},primary:true},{text:'Keep exploring',run:resume}]));
$('pause').addEventListener('click',pause);
dialog.addEventListener('cancel',e=>{e.preventDefault();if(started&&!state.won){activeQuestion=null;resume();}});
function frame(now){if(started&&!dialog.open&&!state.won&&!document.hidden){if(last)elapsed+=Math.min((now-last)/1000,.1);if(held&&now>=nextStep){performMove(held);nextStep=now+165;}}last=now;requestAnimationFrame(frame);}
render();popup('QUEST ARCADE · THE THREE SEALS','Explore the courthouse',['Solve three connected rooms: hold a floor switch with a block, earn a key from the archive chest, and follow an inscription to solve the final signal sequence.','Move with arrows or WASD. Face an object and press E / Space to interact. On a tablet, use the buttons below the map.','There is no time limit. Undo and Reset puzzle help you recover from a tricky push.'],[{text:'Start adventure',run:restart,primary:true}]);
requestAnimationFrame(frame);
