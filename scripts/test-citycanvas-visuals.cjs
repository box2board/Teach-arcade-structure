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
