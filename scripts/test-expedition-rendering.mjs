import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWorld} from '../public/games/knowledge-expedition/engine/v1/world.js';
const pack=JSON.parse(fs.readFileSync(new URL('../public/games/knowledge-expedition/content/wwii.json',import.meta.url)));
const events=new Map(),frames=new Map();let frameId=0,backdrops=0,resizeCallback,area=pack.areas[0],lastHint;
let width=800,height=400;
const draws=[];
function context(main=false){return new Proxy({}, {get(target,key){if(key==='drawImage')return (...args)=>{if(main)draws.push(args);};return (...args)=>{};},set(){return true;}});}
const canvas={width:0,height:0,getBoundingClientRect:()=>({width,height}),getContext:()=>context(true)};
globalThis.devicePixelRatio=3;
globalThis.matchMedia=()=>({matches:false});
globalThis.ResizeObserver=class{constructor(cb){resizeCallback=cb;}observe(){}};
globalThis.document={createElement:()=>{backdrops++;return {width:0,height:0,getContext:()=>context()};}};
globalThis.window={addEventListener:(name,callback)=>events.set(name,callback)};
globalThis.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const world=createWorld(canvas,{getArea:()=>area,isCollected:()=>false,isRestored:()=>false,onInteract(){},onHint:hint=>lastHint=hint});
assert.equal(canvas.width,1600,'device pixel ratio is capped at 2');assert.equal(backdrops,1);assert.equal(frames.size,0,'no animation behind launch dialog');
function step(time){assert.equal(frames.size,1);const [id,cb]=frames.entries().next().value;frames.delete(id);cb(time);}
world.setActive(true);world.setActive(true);assert.equal(frames.size,1,'repeated activation must not duplicate loops');
for(let i=0;i<10;i++)step(100+i*16);assert.equal(backdrops,1,'static terrain must be reused between frames');
let before=draws.length;world.setActive(false);assert.equal(frames.size,0,'opening a dialog stops animation');assert.equal(draws.length,before+1,'pause redraws a single frame');
width=500;resizeCallback();assert.equal(canvas.width,1000);assert.equal(frames.size,0,'resize while paused does not start animation');assert.equal(backdrops,1);
area=pack.areas[1];world.reset();assert.equal(backdrops,2);assert.equal(lastHint.nearby.id,'station','travel refreshes the interaction target immediately');
area=pack.areas[0];world.reset();assert.equal(backdrops,2,'revisiting a cached area reuses terrain');
world.setActive(true);step(1000);const event={key:'W',target:{closest:()=>null},preventDefault(){}};events.get('keydown')(event);for(let i=1;i<70;i++)step(1000+i*16);assert.notEqual(lastHint.nearby?.id,'station','uppercase W moves the player');events.get('keyup')(event);world.setActive(false);
for(let i=0;i<10;i++){world.reset();world.setActive(true);world.setActive(false);}assert.equal(frames.size,0,'replay/pause cycles do not leave background loops');
console.log('PASS: background caching, capped canvas resolution, pause/resume, no duplicate loops, paused resize, travel hints, uppercase movement, and replay cycles.');
