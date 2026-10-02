import assert from 'node:assert/strict';
class Node {
 constructor(){this.children=[];this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classList={add(){},remove(){}};this.listeners={};this.open=false;this.clientWidth=800;this.clientHeight=600;this.scrollHeight=0;}
 append(...nodes){this.children.push(...nodes)} prepend(...nodes){this.children.unshift(...nodes)} replaceChildren(...nodes){this.children=[...nodes]} before(){} after(){} setAttribute(k,v){this[k]=v} addEventListener(k,v){this.listeners[k]=v} querySelector(){return this.innerHTML?.includes('svg')?{}:null} focus(){} showModal(){this.open=true} close(){this.open=false} remove(){} }
const nodes=new Map();globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)},body:new Node(),querySelector(selector){if(selector!=='script[data-map]'){if(selector==='#message')return this.getElementById('message');if(!nodes.has(selector))nodes.set(selector,new Node());return nodes.get(selector);}return {dataset:{map:'./outpost.js',questionSet:'./scientific-method.js'}}},querySelectorAll(){return []},createElement(){return new Node()},addEventListener(){},hidden:false};globalThis.window={addEventListener(){}};globalThis.requestAnimationFrame=()=>{};
await import('../public/arcade-review-games/shared/top-down/game.js');
const get=id=>nodes.get(id);
assert.equal(get('tiles').children.length,425);assert.equal(get('dialog-actions').children.length,1);
get('dialog-actions').children[0].listeners.click();
assert.equal(get('tiles').children.length,425);assert.equal(get('difficulty').textContent,'Explore · 6 questions');
assert.equal(get('world').style.height,`${17/9*100}%`);assert.equal(get('world').style['--row'],`${100/17}%`);
assert.equal(get('world').style.width,`${25/13*100}%`);
assert.equal(get('board').style.aspectRatio,'13/9');
assert.ok(parseFloat(get('board').style.width)>parseFloat(get('board').style.height));
assert.equal(get('tiles').style['--rows'],17);assert.equal(get('dialog').open,false);
assert.ok(get('entities').children.length>15);
console.log('DOM smoke: Outpost selection rebuilds the tiles, entity scale and room camera without runtime errors.');
const {createAdventure}=await import('../public/arcade-review-games/shared/top-down/outpost.js');
const {content}=await import('../public/arcade-review-games/shared/top-down/scientific-method.js');
const {createState,move,obstacle,interact,completeChallenge}=await import('../public/arcade-review-games/shared/top-down/model.js');
const {createReview,answerReview}=await import('../public/arcade-review-games/shared/top-down/review.js');
const map=createAdventure(),s=createState(map);s.review=createReview(map,content.questions);
const keys={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
function key(value){get('board').listeners.keydown({key:value,repeat:false,preventDefault(){}})}
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
 const count=s.review.encounters[id].questions.length;
 for(let i=0;i<count;i++){
  const text=get('dialog-body').children[1].textContent,q=content.questions.find(q=>q.text===text);assert.ok(q);
  const correct=get('answers').children.find(b=>b.textContent===q.answer);assert.ok(correct);correct.listeners.click();
  assert.match(get('feedback').textContent,/Correct!/);get('dialog-actions').children[0].listeners.click();
  const encounter=s.review.encounters[id];answerReview(s.review,id,encounter.questions[encounter.index].question.answer);
 }
 assert.equal(completeChallenge(map,s,id),true);assert.equal(get('dialog').open,false);
}
go(9,12);face('up');earn('survey-chest');go(4,9);step('up');
assert.equal(get('room').textContent,'02 · Optics');assert.equal(get('world').style.top,'0%');
go(3,3);step('right');assert.match(action().text,/CROSS/);
go(10,4);face('down');assert.match(action().text,/Bridge raised/);
go(9,6);face('right');earn('lens-chest');go(20,2);face('right');earn('cell-chest');
assert.equal(get('room').textContent,'03 · Relay');assert.equal(get('world').style.left,`${-12/13*100}%`);
go(14,6);for(let i=0;i<4;i++)step('right');go(16,7);step('down');step('down');
assert.equal(get('room').textContent,'04 · Beacon');assert.equal(get('world').style.top,`${-8/9*100}%`);
assert.equal(get('board').style.aspectRatio,'13/9');
assert.equal(get('seals').textContent,'Stations: 4 / 4');
go(20,12);assert.equal(action().type,'win');assert.equal(get('dialog-label').textContent,'BEACON RESTORED');
assert.equal(get('dialog-title').textContent,'Adventure complete');
assert.ok(get('dialog-body').children.some(p=>p.textContent.includes('Review completed: 6 / 6')));
assert.ok(get('dialog-body').children.every(p=>!p.textContent.includes('Archive')&&!p.textContent.includes('seal crystal')));
console.log('DOM flow: Outpost completes all review chests, both camera directions, mirror crossing, block gate and beacon completion using the same game module.');
