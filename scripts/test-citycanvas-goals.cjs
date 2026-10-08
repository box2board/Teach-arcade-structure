const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,'../public/brain-arcade/citycanvas/simulation.js'),'utf8'));
const {City,neighborhoodGoals}=CityCanvasSim;
const city=new City();
for(let x=2;x<=32;x++)assert.equal(city.build(x,16,'road'),'');
for(const [x,y,type]of [[2,14,'power'],[6,14,'water'],[23,14,'water'],[10,18,'park']])assert.equal(city.build(x,y,type),'');
for(const [start,end,type]of [[9,12,'home'],[15,17,'shop'],[26,28,'industry']])for(let x=start;x<=end;x++){assert.equal(city.build(x,15,type),'');city.at(x,15).level=2;}
city.update();assert.deepEqual(city.neighborhoodProgress.map(g=>g.count),[4,3,3]);
let funds=city.funds;city.step();assert.equal(city.funds,funds,'Free Build never awards cash');assert.deepEqual(city.earnedGoals,[]);
city.mode='manager';funds=city.funds;city.step();assert.equal(city.funds-funds-city.balance,2700);assert.equal(city.earnedGoals.length,3);
funds=city.funds;city.step();assert.equal(city.funds-funds,city.balance,'No duplicate reward next month');
const saved=city.save(),loaded=City.load(saved);assert.deepEqual(loaded.earnedGoals,city.earnedGoals);assert.equal(loaded.funds,city.funds,'Loading never awards cash');
funds=loaded.funds;loaded.step();assert.equal(loaded.funds-funds,loaded.balance,'No duplicate reward after loading');
const legacy={...saved,version:4};delete legacy.earnedGoals;assert.deepEqual(City.load(legacy).earnedGoals,[]);
for(const earnedGoals of [['unknown'],['green-homes','green-homes'],null])assert.throws(()=>City.load({...saved,earnedGoals}),/goal history/);
const clean={type:'home',level:1,access:true,powered:true,watered:true,park:true,wellbeing:72,polluted:false};
assert.equal(city.goalProgress(Array(4).fill(clean))[0].count,4);
for(const missing of ['access','powered','watered','park'])assert.equal(city.goalProgress(Array(4).fill({...clean,[missing]:false}))[0].count,0);
assert.equal(city.goalProgress(Array(4).fill({...clean,wellbeing:69}))[0].count,0);
const factory={type:'industry',level:2,access:true,powered:true,watered:true};assert.equal(city.goalProgress([...Array(3).fill(factory),{...clean,polluted:true}])[2].count,0);
assert.equal(city.goalProgress(Array(3).fill({...factory,level:1}))[2].count,0);
assert.equal(neighborhoodGoals.reduce((n,g)=>n+g.reward,0),2700);
console.log('PASS: goal requirements, month-end payout, free-mode isolation, one-time rewards, save/load persistence, legacy migration, invalid goal-history rejection');
const manager=new City('manager');for(const type of ['square','sports','promenade'])assert.equal(manager.unlocked(type),false);
manager.earnedGoals.push('green-homes');assert(manager.unlocked('square'));assert.equal(manager.unlocked('sports'),false);assert.match(manager.plan(10,10,'sports').error,/shopping street/);
assert(City.load(manager.save()).unlocked('square'),'Earned landmark survives loading');
const free=new City();for(const type of ['square','sports','promenade'])assert(free.unlocked(type));
assert.equal(free.build(10,10,'square'),'');assert.equal(free.at(20,11).park,false,'Disconnected landmark has no coverage');assert.equal(free.build(9,11,'road'),'');assert.equal(free.at(20,11).park,true,'Coverage measured from footprint edge');assert.equal(free.at(21,11).park,false);
assert.equal(free.build(17,20,'sports',true),'');assert.equal(free.at(17,20).w,3);assert.equal(free.at(17,20).h,4);
assert.match(free.plan(2,2,'promenade').error,/beside the river/);assert.equal(free.build(32,20,'promenade'),'');
const restored=City.load(free.save());assert.equal(restored.at(32,22).type,'promenade');assert.equal(restored.anchor(restored.at(32,22)).h,3);
assert.equal(restored.build(32,22,'erase'),'');assert.equal(restored.at(32,20).type,'land');assert.equal(restored.at(32,22).type,'land');
assert.equal(restored.budget.find(r=>r.type==='square').count,1);assert.equal(restored.budget.find(r=>r.type==='sports').count,1);
console.log('PASS: landmark goal locks, persistent/free-mode unlocks, rotated footprints, road-dependent recreation, edge-distance coverage, waterfront restriction, save/load and whole-landmark demolition');
const schoolRequest=city.requests.find(r=>r.id==='school');assert.equal(schoolRequest.title,'A school for our neighborhood');assert.match(schoolRequest.detail,/powered school/);assert.equal(schoolRequest.layer,'school');
{
const starter=City.start('manager','starter');assert.equal(starter.population,128);assert.equal(starter.funds,11525);assert(starter.balance>0);assert(starter.anchors().filter(t=>['home','shop','industry'].includes(t.type)).every(t=>t.access&&t.powered&&t.watered));
assert.equal(City.start('free','starter').funds,15000);assert.equal(City.start('manager','blank','village').population,0);
const repair=City.start('manager','blank','utilities');assert(!repair.scenarioProgress().done);assert.equal(repair.build(6,14,'water'),'');assert.equal(repair.build(23,14,'water'),'');repair.step();assert(repair.experience.complete);assert(City.load(repair.save()).experience.complete);
const clean=City.start('manager','blank','clean-air');assert(!clean.scenarioProgress().done);assert.equal(clean.build(18,15,'erase'),'');assert.equal(clean.build(16,18,'park'),'');clean.step();assert(clean.experience.complete,'Pollution challenge can be solved within its budget');
const legacy=starter.save();delete legacy.experience;assert.equal(City.load(legacy).experience.scenario,null);const invalid=starter.save();invalid.experience.scenario='unknown';assert.throws(()=>City.load(invalid));
console.log('PASS: priced starter town, connected services, scenario starting problems, achievable objectives, completion persistence, legacy experience migration');
const stalled=City.start('manager','blank','utilities'),before=JSON.stringify(stalled.save());
const report=stalled.growthReport();assert.equal(JSON.stringify(stalled.save()),before,'Growth report is read-only');
for(const row of report){assert.equal(row.ready+row.waiting+row.full,row.total);for(const issue of row.reasons)assert(stalled.growth(stalled.at(issue.target.x,issue.target.y)).includes(issue.reason));}
assert.equal(report.find(r=>r.type==='home').waiting,8);assert(report.find(r=>r.type==='home').reasons.some(r=>r.reason.includes('water tower')&&r.count===8));
stalled.build(6,14,'water');stalled.build(23,14,'water');assert.equal(stalled.growthReport().find(r=>r.type==='home').waiting,0);
const mature=City.start('free','starter');for(const t of mature.anchors().filter(t=>t.type==='home'))t.level=3;mature.update();assert.equal(mature.growthReport().find(r=>r.type==='home').state,'Fully developed');
console.log('PASS: exact growth blockers, target coordinates, ready/waiting/full counts, repair updates, maximum development, read-only reports');
for(const map of Object.keys(CityCanvasSim.maps)){
 const c=City.start('manager','starter',null,map),lots=c.anchors().filter(t=>['home','shop','industry'].includes(t.type));assert.equal(c.population,128);assert(lots.every(t=>t.access&&t.powered&&t.watered),map+' starter must be fully served');assert(c.funds>0);assert.deepEqual(City.load(c.save()).save(),c.save());
 const river=c.tiles.find(t=>t.type==='river');assert.equal(c.build(river.x,river.y,'bridge'),'');assert.equal(c.build(river.x,river.y,'erase'),'');assert.equal(c.at(river.x,river.y).type,'river',map+' demolished bridge restores native water');
 c.mode='free';const shore=c.tiles.find(t=>t.type==='land'&&c.plan(t.x,t.y,'promenade').cells.length);assert(shore,map+' has a valid promenade site');
}
const oldMap=City.start().save();delete oldMap.map;assert.equal(City.load(oldMap).map,'riverbend');const badMap=City.start().save();badMap.map='unknown';assert.throws(()=>City.load(badMap));
const crossing=City.start('manager','blank','crossing');assert.equal(crossing.map,'divide');assert(!crossing.scenarioProgress().done);for(const x of [23,24,25])assert.equal(crossing.build(x,16,'bridge'),'');crossing.step();assert(crossing.experience.complete);assert(City.load(crossing.save()).experience.complete);
const boom=City.start('manager','blank','boom');assert.equal(boom.map,'lake');assert(!boom.scenarioProgress().done);for(let x=13;x<=20;x++)assert.equal(boom.build(x,17,'home'),'');assert.equal(boom.build(16,18,'park'),'');for(let i=0;i<40&&!boom.experience.complete;i++)boom.step();assert(boom.experience.complete,'Lakeside objective achievable through normal growth');assert(boom.funds>0);
console.log('PASS: four map starters, map/save migration and rejection, native water restoration, shoreline siting, bridge and lakeside scenario solutions');

}
