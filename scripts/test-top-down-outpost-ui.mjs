import assert from 'node:assert/strict';
class Node {
 constructor(){this.children=[];this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classList={add(){},remove(){}};this.listeners={};this.open=false;this.clientWidth=800;this.clientHeight=600;this.scrollHeight=0;}
 append(...nodes){this.children.push(...nodes)} prepend(...nodes){this.children.unshift(...nodes)} replaceChildren(...nodes){this.children=[...nodes]} before(){} after(){} setAttribute(k,v){this[k]=v} addEventListener(k,v){this.listeners[k]=v} querySelector(){return this.innerHTML?.includes('svg')?{}:null} focus(){} showModal(){this.open=true} close(){this.open=false} remove(){} click(){if(this.download)downloads.push(this);else this.listeners.click?.();} }
const downloads=[],downloadBlobs=new Map();
const testingLayout=process.env.QUEST_OUTPOST_LAYOUT||'classic';
Math.random=()=>({classic:0,westward:.4,southbound:.8}[testingLayout]);
const topicIndex=process.env.QUEST_OUTPOST_TOPIC==='constitution'?1:0,useTopics=Boolean(process.env.QUEST_OUTPOST_TOPIC);
URL.createObjectURL=blob=>{const id='blob:test-'+downloadBlobs.size;downloadBlobs.set(id,blob);return id;};
URL.revokeObjectURL=id=>downloadBlobs.delete(id);
const nodes=new Map();globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)},body:new Node(),querySelector(selector){if(selector!=='script[data-map]'){if(selector==='#message')return this.getElementById('message');if(!nodes.has(selector))nodes.set(selector,new Node());return nodes.get(selector);}return {dataset:{map:'./outpost.js',questionSet:'./scientific-method.js',...(useTopics?{topics:'./topics.js'}:{})}}},querySelectorAll(){return []},createElement(){return new Node()},addEventListener(){},hidden:false};const windowListeners={};globalThis.window={addEventListener(name,fn){windowListeners[name]=fn}};let animationFrame,clock=100;globalThis.requestAnimationFrame=fn=>{if(fn.name==='frame')animationFrame=fn};
const stored=new Map();
const testingMode=process.env.QUEST_OUTPOST_MODE||'explore',modeIndex=['explore','medium','hard'].indexOf(testingMode);
const questionTotal=testingMode==='hard'?12:testingMode==='medium'?8:6;
globalThis.localStorage={getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
await import('../public/arcade-review-games/shared/top-down/game.js');
const get=id=>nodes.get(id);
const hintButton=()=>get('.title-row').children.at(-1).children.find(b=>b.textContent==='Hint');
assert.equal(hintButton().disabled,true,'Hints are disabled before a game starts');
const topicTitle=topicIndex?'U.S. Constitution':'Scientific Method';
function chooseTopic(){
 assert.equal(get('dialog-title').textContent,'Choose your review topic');
 if(topicIndex)get('dialog').listeners.keydown({key:'ArrowDown',target:{tagName:'BUTTON'},preventDefault(){}});
 get('dialog').listeners.keydown({key:'Enter',target:{tagName:'BUTTON'},repeat:false,preventDefault(){}});
}
if(useTopics)chooseTopic();
// Enable the browser camera path in this simulated DOM.
const cameraFlights=[];
get('world').getBoundingClientRect=()=>{
 const width=parseFloat(get('board').style.width),height=parseFloat(get('board').style.height),style=get('world').style;
 return {left:parseFloat(style.left)*width/100,top:parseFloat(style.top)*height/100,width:parseFloat(style.width)*width/100,height:parseFloat(style.height)*height/100};
};
get('world').animate=(frames,options)=>{const flight={frames,options,cancel(){this.canceled=true;}};cameraFlights.push(flight);return flight;};
assert.equal(get('tiles').children.length,425);assert.equal(get('dialog-actions').children.length,useTopics?4:3);
get('dialog-actions').children[modeIndex].listeners.click();
assert.equal(get('tiles').children.length,425);assert.equal(get('difficulty').textContent,`${['Easy','Medium','Hard'][modeIndex]} · ${questionTotal} questions${useTopics?' · '+topicTitle:''}`);
assert.equal(get('world').style.height,`${17/9*100}%`);assert.equal(get('world').style['--row'],`${100/17}%`);
assert.equal(get('world').style.width,`${25/13*100}%`);
assert.equal(get('board').style.aspectRatio,'13/9');
assert.ok(parseFloat(get('board').style.width)>parseFloat(get('board').style.height));
assert.equal(get('tiles').style['--rows'],17);assert.equal(get('dialog').open,false);
assert.ok(get('entities').children.length>15);
assert.equal(hintButton().disabled,false);
hintButton().click();assert.equal(get('dialog-label').textContent,'PUZZLE HINT · 1 / 3');
get('dialog').listeners.keydown({key:'ArrowRight',target:{tagName:'BUTTON'},preventDefault(){}});
get('dialog').listeners.keydown({key:'Enter',target:{tagName:'BUTTON'},repeat:false,preventDefault(){}});
assert.equal(get('dialog-label').textContent,'PUZZLE HINT · 2 / 3');
get('dialog-actions').children.find(b=>b.textContent==='More guidance').click();assert.equal(get('dialog-label').textContent,'PUZZLE HINT · 3 / 3');
assert.equal(get('dialog-actions').children.length,1);get('dialog-actions').children[0].click();
hintButton().click();assert.equal(get('dialog-label').textContent,'PUZZLE HINT · 3 / 3');get('dialog-actions').children[0].click();
console.log('DOM smoke: Outpost selection rebuilds the tiles, entity scale and room camera without runtime errors.');
const {createAdventure}=await import('../public/arcade-review-games/shared/top-down/outpost.js');
const {content}=await import(topicIndex?'../public/arcade-review-games/shared/top-down/constitution.js':'../public/arcade-review-games/shared/top-down/scientific-method.js');
const {createState,move,obstacle,interact,completeChallenge}=await import('../public/arcade-review-games/shared/top-down/model.js');
const {createReview,answerReview}=await import('../public/arcade-review-games/shared/top-down/review.js');
const map=createAdventure(testingMode,testingLayout),s=createState(map);s.review=createReview(map,content.questions);
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
const mirror=s.blocks.find(b=>b.kind==='mirror'),socket=map.decorations.find(d=>d.appearance==='mirror-target');
if(mirror.y!==socket.y){const dir=mirror.y>socket.y?'up':'down',dy=dir==='up'?1:-1;go(mirror.x,mirror.y+dy);while(mirror.y!==socket.y)step(dir);}
if(mirror.x!==socket.x){const dir=mirror.x>socket.x?'left':'right',dx=dir==='left'?1:-1;go(mirror.x+dx,mirror.y);while(mirror.x!==socket.x)step(dir);}
assert.match(action().text,/CROSS/);
go(10,4);face('down');assert.match(action().text,/Bridge raised/);
go(9,6);face('right');earn('lens-chest');go(20,2);face('right');earn('cell-chest');
assert.equal(get('room').textContent,'03 · Relay');assert.equal(get('world').style.left,`${-12/13*100}%`);
assert.ok(cameraFlights.some(f=>/^translate\([^0][^,]*px,0px\)/.test(f.frames[0].transform)),'East boundary glides horizontally');
if(testingMode!=='explore'){const chest=map.objects.find(o=>o.id==='crank-chest');go(chest.x-1,chest.y);face('right');earn('crank-chest');}
for(const [i,crate] of s.blocks.filter(b=>b.kind!=='mirror').entries()){
 const plate=map.plates[i],dir=crate.x===plate.x?'down':crate.x>plate.x?'left':'right';
 go(crate.x+(dir==='left'?1:dir==='right'?-1:0),crate.y+(dir==='down'?-1:0));
 while(crate.x!==plate.x||crate.y!==plate.y)step(dir);
}
go(16,7);step('down');step('down');
assert.equal(get('room').textContent,'04 · Beacon');assert.equal(get('world').style.top,`${-8/9*100}%`);
assert.equal(get('board').style.aspectRatio,'13/9');
if(testingMode!=='explore'){const lift=map.objects.find(o=>o.id==='beacon-lift');go(lift.x,lift.y-1);face('down');assert.match(action().text,/Drawbridge/);}
assert.equal(get('seals').textContent,testingMode==='explore'?'Stations: 4 / 4':'Stations: 5 / 5');
go(20,12);assert.equal(action().type,'win');assert.equal(get('dialog-label').textContent,'BEACON RESTORED');
assert.equal(get('dialog-title').textContent,'Adventure complete');
assert.ok(get('dialog-body').children.some(p=>p.textContent.includes(`Review completed: ${questionTotal} / ${questionTotal}`)));
assert.ok(get('dialog-body').children.every(p=>!p.textContent.includes('Archive')&&!p.textContent.includes('seal crystal')));
console.log('DOM flow: Outpost completes all review chests, both camera directions, mirror crossing, block gate and beacon completion using the same game module.');
get('dialog-actions').children.find(b=>b.textContent==='View results report').click();
assert.equal(get('dialog-title').textContent,'Adventure results');
const nameInput=get('dialog-body').children[0].children[0];nameInput.value='Alex';nameInput.listeners.input();
let prevented=false;get('dialog').listeners.keydown({key:'ArrowLeft',target:{tagName:'INPUT'},preventDefault(){prevented=true;}});assert.equal(prevented,false,'Name editing retains native arrow keys');
get('dialog').listeners.keydown({key:'Enter',target:{tagName:'BUTTON'},repeat:false,preventDefault(){}});
assert.equal(downloads.length,1);assert.equal(downloads[0].download,'quest-arcade-mosslight-outpost-results.txt');
const downloaded=await downloadBlobs.get(downloads[0].href).text();
assert.match(downloaded,/Puzzle hints revealed: 3 · Puzzle tasks assisted: 1/);assert.equal(hintButton().disabled,true);
assert.ok(downloaded.includes('Puzzle layout: '+map.layoutLabel));assert.match(downloaded,/Student: Alex/);assert.ok(downloaded.includes(`Questions completed: ${questionTotal} / ${questionTotal}`));assert.match(downloaded,/Adventure: Complete/);
if(useTopics)assert.ok(downloaded.includes(topicTitle),'Downloaded report identifies the selected topic');
get('dialog-actions').children[1].click();assert.equal(get('dialog-title').textContent,'Adventure complete');
assert.equal(stored.size,0,'Winning clears the unfinished save');
const nextLayout=testingLayout==='classic'?'westward':'classic';
Math.random=()=>nextLayout==='classic'?0:.4;
get('dialog-actions').children.find(b=>b.textContent==='Play again').click();
assert.equal(get('dialog').open,false);assert.equal(get('room').textContent,'01 · Dock');
assert.ok(get('map-labels').textContent.includes(createAdventure(testingMode,nextLayout).layoutLabel),'Play again selects a fresh layout');
assert.equal(JSON.parse(JSON.parse(stored.get(saveKey)).payload).layout,nextLayout);
stored.clear();Math.random=()=>({classic:0,westward:.4,southbound:.8}[testingLayout]);
stored.set(saveKey,resumeSnapshot);nodes.clear();
await import('../public/arcade-review-games/shared/top-down/game.js?resume-test');
if(useTopics)chooseTopic();
assert.equal(get('dialog-actions').children[0].textContent,'Continue adventure');
get('dialog-actions').children[0].listeners.click();
assert.equal(get('dialog').open,false);assert.equal(get('room').textContent,'02 · Optics');
assert.deepEqual(point(),resumePoint);assert.ok(get('map-labels').textContent.includes(map.layoutLabel),'Resume preserves the puzzle layout');
hintButton().click();assert.equal(get('dialog-label').textContent,'PUZZLE HINT · 1 / 3','New task starts with a nudge');get('dialog-actions').children[0].click();
assert.ok(get('inventory').children.some(b=>b.children.some(c=>c.textContent==='Used')));
assert.equal(get('seals').textContent,testingMode==='explore'?'Stations: 1 / 4':'Stations: 1 / 5');
get('pause').listeners.click();assert.ok(get('dialog-body').children.some(p=>p.textContent.includes('saved automatically')));
get('dialog-actions').children.find(b=>b.textContent==='View progress report').click();
assert.equal(get('dialog-title').textContent,'Adventure progress');
get('dialog-actions').children[0].click();
assert.match(await downloadBlobs.get(downloads.at(-1).href).text(),/Adventure: In progress/);
assert.match(await downloadBlobs.get(downloads.at(-1).href).text(),/Puzzle hints revealed: 4 · Puzzle tasks assisted: 2/,'Report combines restored hint use with the new task');
get('dialog-actions').children[1].click();get('pause').listeners.click();
get('dialog-actions').children[1].listeners.click();get('dialog-actions').children[0].listeners.click();
assert.equal(get('room').textContent,'01 · Dock');assert.equal(get('seals').textContent,testingMode==='explore'?'Stations: 0 / 4':'Stations: 0 / 5');
assert.equal(JSON.parse(JSON.parse(stored.get(saveKey)).payload).state.hints,undefined,'Restart clears hint history');
if(useTopics){
 windowListeners.pagehide();const originalSave=stored.get(saveKey);
 get('pause').click();get('dialog-actions').children.find(b=>b.textContent==='Change review topic').click();
 get('dialog-actions').children[1-topicIndex].click();
 assert.equal(get('dialog-title').textContent,'Choose your adventure','Other topic cannot resume this topic’s save');
 get('dialog-actions').children[0].click();windowListeners.pagehide();
 assert.equal(stored.size,2,'Topics keep separate unfinished saves');assert.equal(stored.get(saveKey),originalSave);
 get('pause').click();get('dialog-actions').children.find(b=>b.textContent==='Change review topic').click();
 chooseTopic();assert.equal(get('dialog-title').textContent,'Continue your adventure?');
 get('dialog-actions').children[0].click();assert.ok(get('difficulty').textContent.endsWith(topicTitle));
}
console.log('DOM save flow: refresh offers Continue, restores position, used key and chest progress; restart replaces the save.');
