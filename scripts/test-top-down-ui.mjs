import assert from 'node:assert/strict';
class Node {
 constructor(){this.children=[];this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classList={add(){},remove(){}};this.listeners={};this.open=false;this.clientWidth=800;this.clientHeight=600;this.scrollHeight=0;}
 append(...nodes){this.children.push(...nodes)} prepend(...nodes){this.children.unshift(...nodes)} replaceChildren(...nodes){this.children=[...nodes]} before(){} after(){} setAttribute(k,v){this[k]=v} addEventListener(k,v){this.listeners[k]=v} querySelector(){return this.innerHTML?.includes('svg')?{}:null} focus(){document.activeElement=this} click(){if(!this.disabled)this.listeners.click?.()} showModal(){this.open=true} close(){this.open=false} remove(){} }
const nodes=new Map();globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)},body:new Node(),querySelector(selector){if(selector!=='script[data-map]'){if(selector==='#message')return this.getElementById('message');if(!nodes.has(selector))nodes.set(selector,new Node());return nodes.get(selector);}return {dataset:{map:'./map.js',questionSet:'./constitution.js'}}},querySelectorAll(){return []},createElement(){return new Node()},addEventListener(){},hidden:false};const windowListeners={};globalThis.window={addEventListener(name,fn){windowListeners[name]=fn}};let animationFrame,clock=100;globalThis.requestAnimationFrame=fn=>{if(fn.name==='frame')animationFrame=fn};
await import('../public/arcade-review-games/shared/top-down/game.js');
const get=id=>nodes.get(id);
assert.equal(get('tiles').children.length,273);assert.equal(get('dialog-actions').children.length,3);
get('dialog-actions').children[2].listeners.click();
assert.equal(get('tiles').children.length,525);assert.equal(get('difficulty').textContent,'Hard · 12 questions');
assert.equal(get('world').style.height,`${25/13*100}%`);assert.equal(get('world').style['--row'],'4%');
assert.equal(get('tiles').style['--rows'],25);assert.equal(get('dialog').open,false);
assert.ok(get('entities').children.length>30);
console.log('DOM smoke: Hard selection rebuilds the tiles, entity scale and room camera without runtime errors.');
const {createAdventure}=await import('../public/arcade-review-games/shared/top-down/map.js');
const {content}=await import('../public/arcade-review-games/shared/top-down/constitution.js');
const {createState,move,obstacle,interact,completeChallenge}=await import('../public/arcade-review-games/shared/top-down/model.js');
const {createReview,answerReview}=await import('../public/arcade-review-games/shared/top-down/review.js');
const map=createAdventure('hard'),s=createState(map);s.review=createReview(map,content.questions);
const keys={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
function key(value){
 get('board').listeners.keydown({key:value,repeat:false,preventDefault(){}});
 if(!value.startsWith('Arrow'))return;
 const axis=value==='ArrowLeft'||value==='ArrowRight'?'x':'y',size=axis==='x'?map.tiles[0].length:map.tiles.length;
 const position=()=>Number(get('player').style.transform.match(/translate3d\(([^%]+)%,([^%]+)%/)[axis==='x'?1:2])/100;
 const sign=value==='ArrowRight'||value==='ArrowDown'?1:-1;
 let distance=(s.player[axis]-position())*sign;
 if(distance<.01){clock+=1;animationFrame(clock);clock+=1;animationFrame(clock);}
 else for(let i=0;i<100&&distance>.001;i++){
  clock+=Math.min(25,distance/4*1000);animationFrame(clock);
  distance=(s.player[axis]-position())*sign;
 }
 windowListeners.keyup({key:value});
 assert.ok(Math.abs(position()-s.player[axis])<.03,'Continuous movement reaches '+axis+' '+s.player[axis]+' (was '+position()+')');
}
function step(dir){assert.equal(move(map,s,dir),true);key(keys[dir]);}
function go(x,y){
 const queue=[{...s.player,path:[]}],seen=new Set();
 while(queue.length){const here=queue.shift();if(here.x===x&&here.y===y){here.path.forEach(step);return;}
  for(const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){
   const p={x:here.x+dx,y:here.y+dy},id=p.x+','+p.y;
   if(seen.has(id)||obstacle(map,s,p)||s.blocks.some(b=>b.x===p.x&&b.y===p.y))continue;
   seen.add(id);queue.push({...p,path:[...here.path,dir]});
  }
 }throw Error('Unreachable UI target '+x+','+y);
}
function face(dir){s.facing=dir;key(keys[dir]);assert.equal(move(map,s,dir),false);}
function action(){const result=interact(map,s);key('e');return result;}
function earn(id){
 assert.equal(action().id,id);
 const dialogKey=(key,repeat=false)=>{let prevented=false;get('dialog').listeners.keydown({key,repeat,preventDefault(){prevented=true;}});assert.equal(prevented,true);};
 const count=s.review.encounters[id].questions.length;
 for(let i=0;i<count;i++){
  const text=get('dialog-body').children[1].textContent,q=content.questions.find(q=>q.text===text);assert.ok(q);
  const answers=get('answers').children,correct=answers.find(b=>b.textContent===q.answer);assert.ok(correct);
  assert.equal(document.activeElement,answers[0]);
  dialogKey('ArrowUp');assert.equal(document.activeElement,get('dialog-actions').children[0]);
  dialogKey('ArrowDown');assert.equal(document.activeElement,answers[0]);
  const wrong=answers.find(b=>b!==correct);
  while(document.activeElement!==wrong)dialogKey('ArrowRight');
  dialogKey('Enter',true);assert.ok(!wrong.disabled);
  dialogKey(' ',true);assert.ok(!wrong.disabled);
  dialogKey('Enter');assert.ok(wrong.disabled);assert.notEqual(document.activeElement,wrong);
  for(let j=0;j<answers.length+1;j++){dialogKey('ArrowDown');assert.notEqual(document.activeElement,wrong);}
  while(document.activeElement!==correct)dialogKey('ArrowLeft');
  dialogKey('Enter');assert.match(get('feedback').textContent,/Correct!/);
  assert.equal(document.activeElement,get('dialog-actions').children[0]);dialogKey('Enter');
  const encounter=s.review.encounters[id];answerReview(s.review,id,encounter.questions[encounter.index].question.answer);
 }
 assert.equal(completeChallenge(map,s,id),true);assert.equal(get('dialog').open,false);
}
['up','up','up','right','right'].forEach(step);go(2,8);step('right');step('right');go(5,7);step('down');
go(9,3);face('right');earn('archive');
go(11,9);face('right');earn('workshop-key-chest');go(10,11);step('down');
go(10,15);step('right');assert.match(action().text,/Mirror rotated/);
go(9,16);face('left');assert.match(action().text,/Bridge raised/);
go(11,20);face('right');earn('hammer-pickup');
assert.equal(get('room').textContent,'04 · Workshop');assert.equal(get('world').style.top,`${-12/13*100}%`);
go(4,5);step('up');go(4,3);face('up');earn('seal-crystal');
go(4,11);step('down');go(2,16);face('right');earn('lantern-chest');
go(4,20);face('down');action();go(12,22);face('right');action();
go(13,6);step('right');go(17,2);face('right');earn('power-chest');
for(const id of map.puzzles[0].sequence){const o=map.objects.find(o=>o.id===id);go(o.x-1,o.y);face('right');action();}
assert.equal(get('seals').textContent,'Door lights: 6 / 6');
go(18,10);assert.equal(action().type,'win');assert.equal(get('dialog-title').textContent,'Adventure complete');
assert.ok(get('dialog-body').children.some(p=>p.textContent.includes('Review completed: 12 / 12')));
console.log('DOM flow: all six reward dialogs complete with arrows and Enter, including wrong-answer recovery, disabled-choice skipping and repeat guards; both room cameras, clues and the Hard win screen pass.');
