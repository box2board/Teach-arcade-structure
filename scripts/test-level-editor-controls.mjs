import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const draw=new Proxy({}, {get:()=>()=>{},set:()=>true});
class Element {
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.dataset={};this.value='';this.scrollLeft=0;this.scrollTop=0;this.clientWidth=800;this.scrollWidth=6000;this.classList={toggle(){},add(){}};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 click(){if(!this.disabled)this.onclick?.();}
 getContext(){return draw;}
 setPointerCapture(){}
 getBoundingClientRect(){return{left:0,top:0,width:parseFloat(this.style.width)||this.width,height:parseFloat(this.style.height)||this.height};}
 addEventListener(){}
 setAttribute(){}
}
const html=fs.readFileSync('public/dev/level-editor/index.html','utf8'),elements={};
for(const m of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"/g))elements[m[2]]=new Element(m[1]);
elements.snap.checked=true;
const storage=new Map(),context={window:{},console,Date,document:{getElementById:id=>elements[id],createElement:tag=>new Element(tag),addEventListener(){},querySelector:s=>elements.palette.children.find(b=>b.dataset.tool===s.match(/data-tool="(.*?)"/)[1]),querySelectorAll:()=>elements.palette.children},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},sessionStorage:{},setTimeout,URL,Blob,performance,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
vm.createContext(context);const run=p=>vm.runInContext(fs.readFileSync('public/'+p,'utf8'),context);
run('arcade-review-games/side-scroller-engine/v1.2/level-builder.js');context.TASideScroller=context.window.TASideScroller;
run('dev/pyramid-escape-v13/level.js');run('dev/level-editor/level-format.js');run('dev/level-editor/object-library.js');run('arcade-review-games/side-scroller-engine/v1.4/path-motion.js');run('dev/level-editor/editor-model.js');
const F=context.window.TALevelFile,M=context.window.TALevelEditorModel;
assert.equal(F.validate(M.blank()).errors.length,0);
let d=M.blank();M.create(d,'platforms',5000,600);assert.equal(d.level.platforms[0].x,3712);assert.equal(d.level.platforms[0].y,462);
assert.equal(F.validate(d).errors.length,0);assert.throws(()=>M.resize(d,2000),/Move or delete/);
d=M.blank();d=M.resize(d,7680);assert.equal(d.level.layers.terrain[11].length,240);assert.equal(d.level.layers.terrain[11][239],1);assert.equal(d.level.finish.x,7590);d=M.resize(d,1920);assert.equal(d.level.layers.terrain[0].length,60);assert.equal(F.validate(d).errors.length,0);
M.create(d,'slopes',1919,20);assert.equal(F.validate(d).errors.length,0);
run('dev/level-editor/editor.js');
const current=()=>{elements.save.click();return JSON.parse(storage.get('ta-level-builder-draft-v1'));};
const choose=key=>elements.palette.children.find(b=>b.dataset.tool===key).click();
const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,button:0,preventDefault(){}});
elements.blank.click();assert.equal(current().level.id,'my-level');
choose('platforms');elements.map.onpointerdown(event(600,240));elements.map.onpointerup();assert.equal(current().level.platforms.length,1);
choose('select');elements.map.onpointerdown(event(610,245));elements.map.onpointermove(event(674,245));elements.map.onpointerup();assert.equal(current().level.platforms[0].x,672);
const widthInput=elements.fields.children.find(l=>l.textContent==='Width').children[0];widthInput.value=-50;widthInput.onchange();assert.match(elements.message.textContent,/Invalid/);assert.equal(current().level.platforms[0].w,128);
elements.undo.click();assert.equal(current().level.platforms[0].x,608);elements.redo.click();assert.equal(current().level.platforms[0].x,672);
choose('pan');const before=JSON.stringify(current());elements.viewport.scrollLeft=100;elements.map.onpointerdown(event(300,100));elements.map.onpointermove(event(200,100));elements.map.onpointerup();assert.equal(elements.viewport.scrollLeft,200);assert.equal(JSON.stringify(current()),before);
elements.length.value=7680;elements.resize.click();assert.equal(current().level.world.width,7680);elements.undo.click();assert.equal(current().level.world.width,3840);
elements.length.value=32000;elements.resize.click();elements.zoom.value='1.5';elements.zoom.onchange();assert.ok(elements.map.width<=12000);assert.equal(elements.map.style.width,'48000px');
choose('collectibles');elements.map.onpointerdown(event(1500,300));elements.map.onpointerup();assert.equal(current().level.collectibles[0].x,1008);assert.equal(current().level.collectibles[0].y,208);
console.log('PASS: blank levels, safe resize, clamped placement, pointer movement, invalid property rejection, undo/redo, pan without edits, bounded canvas, zoom coordinates. DOM simulation only; no browser/touch QA claim.');
// Exercise the route editor and style selectors through actual UI handlers.
elements.blank.click();elements.zoom.value='1';elements.zoom.onchange();choose('movingPlatforms');elements.map.onpointerdown(event(600,160));elements.map.onpointerup();
let appearance=elements.fields.children.find(l=>l.textContent==='Appearance').children[0];appearance.value='metal';appearance.onchange();assert.equal(current().level.movingPlatforms[0].style,'metal');
elements['draw-path'].click();elements.map.onpointerdown(event(800,160));elements.map.onpointerup();elements.map.onpointerdown(event(800,240));elements.map.onpointerup();assert.equal(current().level.movingPlatforms[0].path.length,3);
elements['finish-path'].click();assert.equal(F.validate(current()).errors.length,0);
elements['clear-path'].click();assert.equal(current().level.movingPlatforms[0].path,undefined);elements.undo.click();assert.equal(current().level.movingPlatforms[0].path.length,3);
console.log('PASS: style selection, drawn multi-point route, route completion, simple-movement restore and undo.');
elements.blank.click();elements.height.value=1920;elements['resize-height'].click();assert.equal(current().level.world.height,1920);assert.equal(current().level.spawn.y,1740);elements.undo.click();assert.equal(current().level.world.height,480);elements.redo.click();assert.equal(current().level.world.height,1920);
choose('platforms');assert.match(elements['placement-title'].textContent,/Platform/);const material=elements.placement.children.find(l=>l.textContent==='Platform material / style').children[0];material.value='wood';material.onchange();elements.map.onpointerdown(event(400,1300));elements.map.onpointerup();assert.equal(current().level.platforms[0].style,'wood');assert.equal(current().level.platforms[0].y,1296);
choose('movingPlatforms');const direction=elements.placement.children.find(l=>l.textContent==='Movement direction').children[0];direction.value='y';direction.onchange();elements.map.onpointerdown(event(600,1000));elements.map.onpointerup();assert.equal(current().level.movingPlatforms[0].axis,'y');const speed=elements.placement.children.find(l=>l.textContent==='Speed').children[0];speed.value=75;speed.onchange();assert.equal(current().level.movingPlatforms[0].speed,75);
elements.height.value=7680;elements['resize-height'].click();elements.length.value=32000;elements.resize.click();elements.zoom.value='1.5';elements.zoom.onchange();assert.ok(elements.map.width*elements.map.height<=8000000);assert.ok(elements.map.height<=4096);assert.equal(elements.map.style.height,'11520px');
console.log('PASS: height controls and undo, visible platform-material placement, high object placement, prominent moving-platform direction/speed and tall-canvas memory bound.');
