import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{},console};vm.createContext(context);
const run=p=>vm.runInContext(fs.readFileSync('public/'+p,'utf8'),context,{filename:p});
run('arcade-review-games/side-scroller-engine/v1.2/level-builder.js');context.TASideScroller=context.window.TASideScroller;
run('dev/pyramid-escape-v13/level.js');run('dev/level-editor/level-format.js');run('arcade-review-games/social-studies/pyramid-escape-run-v2/questions.js');
const F=context.window.TALevelFile,original=context.window.TA_PYRAMID_V13_LEVEL;
let doc=F.pack(original);assert.equal(F.validate(doc).errors.length,0);assert.equal(JSON.stringify(F.parse(JSON.stringify(doc)).level),JSON.stringify(original));
doc.level.platforms[0].x+=48;doc.level.collectibles.push({x:600,y:250});const imported=F.parse(JSON.stringify(doc));assert.equal(imported.level.platforms[0].x,698);assert.equal(original.platforms[0].x,650);
assert.equal(JSON.stringify(imported.level.abilities),JSON.stringify(original.abilities));assert.equal(JSON.stringify(imported.level.secrets),JSON.stringify(original.secrets));
for(const mutate of [d=>d.version=2,d=>d.level.spawn.x=-100,d=>d.level.layers.terrain[0][0]='bad',d=>d.level.platforms[0].w=-1,d=>d.level.slopes=[{x1:20,x2:20,y1:200,y2:100}],d=>d.level.world.width=1000000]){const bad=F.clone(doc);mutate(bad);assert.throws(()=>F.parse(JSON.stringify(bad)));}
// Instantiate the actual V1.2 + V1.3 runtime with imported JSON, not a replacement physics simulation.
context.addEventListener=()=>{};context.document={addEventListener(){},querySelectorAll(){return[];},getElementById(){return null;}};
run('arcade-review-games/side-scroller-engine/v1.2/physics-presets.js');run('arcade-review-games/side-scroller-engine/v1.2/core.js');run('arcade-review-games/side-scroller-engine/v1.3/ability-system.js');run('arcade-review-games/side-scroller-engine/v1.3/core.js');
const TA=context.window.TASideScroller,physics=context.window.TA_PHYSICS_PRESETS.earth;
const engine=new TA.Engine({canvas:{width:960,height:480,getContext(){return{};}},config:{player:physics},level:imported.level,theme:{},questions:context.window.TA_EGYPT_QUESTIONS});
assert.equal(engine.solids.find(o=>o.platformId==='entry-step').x,698);assert.equal(engine.collectibles.length,original.collectibles.length+1);assert.equal(engine.questionTriggers.length,10);assert.equal(engine.abilityItems.length,2);assert.equal(engine.breakables.length,4);assert.equal(engine.secrets.length,2);
engine.state='playing';engine.player.x=600;engine.player.y=250;engine.interact();assert.equal(engine.stats.collected,1);
engine.player.x=engine.level.finish.x;engine.player.y=engine.level.finish.y;engine.updateMovers=()=>{};engine.interact=()=>{};engine.updateCamera=()=>{};
engine.finishFrame(0);assert.equal(engine.state,'playing');engine.stats.answered=engine.stats.total;engine.finishFrame(0);assert.equal(engine.state,'won');
for(const file of ['index.html','play.html']){const html=fs.readFileSync('public/dev/level-editor/'+file,'utf8');for(const match of html.matchAll(/(?:src|href)="([^"?]+)(?:\?[^\"]*)?"/g)){const target=match[1];if(target.startsWith('http'))continue;assert.ok(fs.existsSync(target.startsWith('/')?'public'+target:'public/dev/level-editor/'+target),target);}}
fs.writeFileSync('public/dev/level-editor/pyramid-sample.json',JSON.stringify(F.pack(original))+'\n');
console.log('PASS: lossless round trip, edits, invalid imports, runtime loading, collectible interaction, question-gated completion, asset paths.');
