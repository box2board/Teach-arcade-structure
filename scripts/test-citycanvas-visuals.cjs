// Renderer contract tests without browser or third-party dependencies.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'../public/brain-arcade/citycanvas');
vm.runInThisContext(fs.readFileSync(path.join(base,'simulation.js'),'utf8'));
const source=fs.readFileSync(path.join(base,'game.js'),'utf8');
const sandbox={types:CityCanvasSim.types};vm.createContext(sandbox);
vm.runInContext(source.slice(source.indexOf('function drawBuilding('),source.indexOf('function drawConstruction('))+source.slice(source.indexOf('function buildingNeeds('),source.indexOf('function render(time)')),sandbox);
const g=new Proxy({},{get:(_,name)=>(...args)=>calls.push([name,...args]),set:(_,name,value)=>{calls.push([name,value]);return true;}});let calls=[];
for(const type of ['home','shop','industry']){
 const images=[];for(let level=0;level<4;level++){calls=[];sandbox.drawBuilding(g,{type,level,w:1,h:1,x:2,y:2},0,0,60);images.push(JSON.stringify(calls));}
 assert.equal(new Set(images).size,4,`${type} needs four distinct development stages`);
}
const needs=t=>Array.from(sandbox.buildingNeeds(t));
assert.deepEqual(needs({type:'home',access:false,powered:false,watered:false}),['road','power','water']);
assert.deepEqual(needs({type:'home',access:true,powered:true,watered:false}),['water']);
assert.deepEqual(needs({type:'home',access:true,powered:true,watered:true}),[]);
assert.deepEqual(needs({type:'school',access:true,powered:false}),['power']);
assert.deepEqual(needs({type:'water',access:false,powered:false}),['road','power']);
for(const type of ['road','bridge','park','river','land'])assert.deepEqual(needs({type}),[]);
sandbox.ctx=g;for(const type of ['home','water','school']){calls=[];sandbox.drawNeeds({type,w:2,access:false,powered:false},0,0,28);assert(calls.some(c=>c[0]==='save'));assert(calls.some(c=>c[0]==='restore'));}
console.log('PASS: distinct zone development stages, accurate utility/access needs, service signs, decorative tile exclusion, canvas state isolation');
// Cache invalidation and viewport edges: large facilities can extend in from offscreen.
const city=new CityCanvasSim.City();city.build(2,2,'school');city.build(7,2,'home');city.at(7,2).progress=1;city.build(8,2,'industry');city.at(8,2).level=1;
let terrainCalls=0,roadCalls=0,buildingCalls=0;
Object.assign(sandbox,{city,W:48,H:32,size:20,canvas:{width:200,height:120},document:{createElement:()=>({getContext:()=>g})},isRoad:CityCanvasSim.isRoad});
sandbox.drawTerrain=()=>terrainCalls++;sandbox.drawRoad=()=>roadCalls++;sandbox.drawBuilding=()=>buildingCalls++;
const o={x:-60,y:0},r={width:200,height:120},first=sandbox.prepareScene(o,r);
assert(first.visible.some(t=>t.type==='school'),'Offscreen anchor must retain its visible facility footprint');
assert.equal(first.dynamic.length,2,'Construction and factory smoke remain animated');
assert(terrainCalls<=77,'Only viewport terrain should be drawn');
const counts=[terrainCalls,roadCalls,buildingCalls];assert.equal(sandbox.prepareScene(o,r),first);assert.deepEqual([terrainCalls,roadCalls,buildingCalls],counts,'Unchanged frames reuse the scene');
vm.runInContext('sceneRevision++',sandbox);assert.notEqual(sandbox.prepareScene(o,r),first,'City edits invalidate cache');
const afterEdit=sandbox.prepareScene(o,r);assert.notEqual(sandbox.prepareScene({x:-61,y:0},r),afterEdit,'Pan invalidates cache');
const afterPan=sandbox.prepareScene(o,r);sandbox.size=25;assert.notEqual(sandbox.prepareScene(o,r),afterPan,'Zoom invalidates cache');
const afterZoom=sandbox.prepareScene(o,r);sandbox.canvas.width=400;assert.notEqual(sandbox.prepareScene(o,r),afterZoom,'Pixel-density and resize changes invalidate cache');
console.log('PASS: scene reuse, city/pan/zoom/resize invalidation, viewport culling, partial facility visibility, animated scene separation');
