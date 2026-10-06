import assert from 'node:assert/strict';
class Node {
 constructor(){this.children=[];this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classList={add(){},remove(){}};this.listeners={};this.open=false;this.clientWidth=800;this.clientHeight=600;this.scrollHeight=0;}
 append(...nodes){this.children.push(...nodes)} prepend(...nodes){this.children.unshift(...nodes)} replaceChildren(...nodes){this.children=[...nodes]} before(){} after(){} setAttribute(k,v){this[k]=v} addEventListener(k,v){this.listeners[k]=v} querySelector(){return this.innerHTML?.includes('svg')?{}:null} focus(){} showModal(){this.open=true} close(){this.open=false} remove(){} click(){if(this.download)downloads.push(this);else this.listeners.click?.();} }
const downloads=[],downloadBlobs=new Map();
URL.createObjectURL=blob=>{const id='blob:test-'+downloadBlobs.size;downloadBlobs.set(id,blob);return id;};
URL.revokeObjectURL=id=>downloadBlobs.delete(id);
const nodes=new Map();globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)},body:new Node(),querySelector(selector){if(selector!=='script[data-map]'){if(selector==='#message')return this.getElementById('message');if(!nodes.has(selector))nodes.set(selector,new Node());return nodes.get(selector);}return {dataset:{map:'./outpost.js',questionSet:'./scientific-method.js'}}},querySelectorAll(){return []},createElement(){return new Node()},addEventListener(){},hidden:false};const windowListeners={};globalThis.window={addEventListener(name,fn){windowListeners[name]=fn}};let animationFrame,clock=100;globalThis.requestAnimationFrame=fn=>{if(fn.name==='frame')animationFrame=fn};
const stored=new Map();
globalThis.localStorage={getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
await import('../public/arcade-review-games/shared/top-down/game.js');
const get=id=>nodes.get(id);
// Enable the browser camera path in this simulated DOM.
const cameraFlights=[];
get('world').getBoundingClientRect=()=>{
 const width=parseFloat(get('board').style.width),height=parseFloat(get('board').style.height),style=get('world').style;
 return {left:parseFloat(style.left)*width/100,top:parseFloat(style.top)*height/100,width:parseFloat(style.width)*width/100,height:parseFloat(style.height)*height/100};
};
get('world').animate=(frames,options)=>{const flight={frames,options,cancel(){this.canceled=true;}};cameraFlights.push(flight);return flight;};
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
// Exercise real held-key composition before following the puzzle route.
const press=key=>get('board').listeners.keydown({key,repeat:false,preventDefault(){}});
const tick=()=>{clock+=25;animationFrame(clock);};
const point=()=>{const parts=get('player').style.transform.match(/translate3d\(([^%]+)%,([^%]+)%/);return {x:Number(parts[1])/100,y:Number(parts[2])/100}};
tick();const origin=point();press('ArrowRight');press('ArrowDown');tick();
let p=point();assert.ok(p.x>origin.x&&p.y>origin.y);assert.ok(Math.abs(p.x-origin.x-(p.y-origin.y))<1e-8);
windowListeners.keyup({key:'ArrowDown'});tick();const afterRelease=point();assert.ok(afterRelease.x>p.x);assert.equal(afterRelease.y,p.y);
windowListeners.keyup({key:'ArrowRight'});tick();assert.deepEqual(point(),afterRelease);
press('ArrowLeft');tick();press('ArrowUp');tick();windowListeners.keyup({key:'ArrowLeft'});windowListeners.keyup({key:'ArrowUp'});
assert.ok(Math.abs(point().x-origin.x)<1e-8&&Math.abs(point().y-origin.y)<1e-8);
press('ArrowRight');windowListeners.blur();tick();assert.ok(Math.abs(point().x-origin.x)<1e-8);
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
 assert.equal(get('interact').textContent,'Open chest');
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
const walkingEntities=get('entities').children,walkingInventory=get('inventory').children;
const flightsBeforeWalking=cameraFlights.length;
step('up');assert.equal(get('entities').children,walkingEntities);assert.equal(get('inventory').children,walkingInventory);
assert.equal(cameraFlights.length,flightsBeforeWalking,'Ordinary walking does not animate the camera');
assert.match(get('player').style.transform,/translate3d/);step('down');
go(9,12);face('up');earn('survey-chest');go(4,9);step('up');
assert.equal(get('room').textContent,'02 · Optics');assert.equal(get('world').style.top,'0%');
windowListeners.pagehide();
const saveKey=[...stored.keys()][0],resumeSnapshot=stored.get(saveKey),resumePoint=point();
assert.ok(resumeSnapshot,'Leaving the tab writes progress');
assert.ok(cameraFlights.some(f=>/^translate\(0px,-/.test(f.frames[0].transform)),'North boundary glides vertically');
go(3,3);step('right');assert.match(action().text,/CROSS/);
go(10,4);face('down');assert.match(action().text,/Bridge raised/);
go(9,6);face('right');earn('lens-chest');go(20,2);face('right');earn('cell-chest');
assert.equal(get('room').textContent,'03 · Relay');assert.equal(get('world').style.left,`${-12/13*100}%`);
assert.ok(cameraFlights.some(f=>/^translate\([^0][^,]*px,0px\)/.test(f.frames[0].transform)),'East boundary glides horizontally');
go(14,6);for(let i=0;i<4;i++)step('right');go(16,7);step('down');step('down');
assert.equal(get('room').textContent,'04 · Beacon');assert.equal(get('world').style.top,`${-8/9*100}%`);
assert.equal(get('board').style.aspectRatio,'13/9');
assert.equal(get('seals').textContent,'Stations: 4 / 4');
go(20,12);assert.equal(action().type,'win');assert.equal(get('dialog-label').textContent,'BEACON RESTORED');
assert.equal(get('dialog-title').textContent,'Adventure complete');
assert.ok(get('dialog-body').children.some(p=>p.textContent.includes('Review completed: 6 / 6')));
assert.ok(get('dialog-body').children.every(p=>!p.textContent.includes('Archive')&&!p.textContent.includes('seal crystal')));
console.log('DOM flow: Outpost completes all review chests, both camera directions, mirror crossing, block gate and beacon completion using the same game module.');
get('dialog-actions').children.find(b=>b.textContent==='View results report').click();
assert.equal(get('dialog-title').textContent,'Adventure results');
const nameInput=get('dialog-body').children[0].children[0];nameInput.value='Alex';nameInput.listeners.input();
let prevented=false;get('dialog').listeners.keydown({key:'ArrowLeft',target:{tagName:'INPUT'},preventDefault(){prevented=true;}});assert.equal(prevented,false,'Name editing retains native arrow keys');
get('dialog').listeners.keydown({key:'Enter',target:{tagName:'BUTTON'},repeat:false,preventDefault(){}});
assert.equal(downloads.length,1);assert.equal(downloads[0].download,'quest-arcade-mosslight-outpost-results.txt');
const downloaded=await downloadBlobs.get(downloads[0].href).text();
assert.match(downloaded,/Student: Alex/);assert.match(downloaded,/Questions completed: 6 \/ 6/);assert.match(downloaded,/Adventure: Complete/);
get('dialog-actions').children[1].click();assert.equal(get('dialog-title').textContent,'Adventure complete');
assert.equal(stored.size,0,'Winning clears the unfinished save');
stored.set(saveKey,resumeSnapshot);nodes.clear();
await import('../public/arcade-review-games/shared/top-down/game.js?resume-test');
assert.equal(get('dialog-actions').children[0].textContent,'Continue adventure');
get('dialog-actions').children[0].listeners.click();
assert.equal(get('dialog').open,false);assert.equal(get('room').textContent,'02 · Optics');
assert.deepEqual(point(),resumePoint);
assert.ok(get('inventory').children.some(b=>b.children.some(c=>c.textContent==='Used')));
assert.equal(get('seals').textContent,'Stations: 1 / 4');
get('pause').listeners.click();assert.ok(get('dialog-body').children.some(p=>p.textContent.includes('saved automatically')));
get('dialog-actions').children.find(b=>b.textContent==='View progress report').click();
assert.equal(get('dialog-title').textContent,'Adventure progress');
get('dialog-actions').children[0].click();
assert.match(await downloadBlobs.get(downloads.at(-1).href).text(),/Adventure: In progress/);
get('dialog-actions').children[1].click();get('pause').listeners.click();
get('dialog-actions').children[1].listeners.click();get('dialog-actions').children[0].listeners.click();
assert.equal(get('room').textContent,'01 · Dock');assert.equal(get('seals').textContent,'Stations: 0 / 4');
console.log('DOM save flow: refresh offers Continue, restores position, used key and chest progress; restart replaces the save.');
