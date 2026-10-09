const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'../public/brain-arcade/citycanvas');
for(const name of ['simulation','activity'])vm.runInThisContext(fs.readFileSync(path.join(base,name+'.js'),'utf8'));
const {City}=CityCanvasSim,Activity=CityCanvasActivity;
const city=new City();
for(let x=2;x<=44;x++){const tile=city.at(x,16);assert.equal(city.build(x,16,tile.type==='river'?'bridge':'road'),'');}
for(const [x,y,type]of [[2,14,'power'],[6,14,'water'],[9,14,'school'],[13,14,'fire'],[17,14,'hospital']])assert.equal(city.build(x,y,type),'');
for(let x=22;x<=30;x++){assert.equal(city.build(x,15,'home'),'');city.at(x,15).level=x%3+1;}
city.update();const before=JSON.stringify(city.save()),activity=new Activity(()=>.2);
activity.tick(city,16);
for(const kind of ['car','pedestrian','bus','engine','ambulance'])assert(activity.agents.some(a=>a.kind===kind),kind+' spawned');
for(const a of activity.agents.filter(a=>a.path)){assert(a.path.length>2);assert.deepEqual(a.path[0],a.path.at(-1));for(let i=1;i<a.path.length;i++)assert.equal(Math.abs(a.path[i].x-a.path[i-1].x)+Math.abs(a.path[i].y-a.path[i-1].y),1);}
let frozen=JSON.stringify(activity.agents);activity.tick(city,0);assert.equal(JSON.stringify(activity.agents),frozen);
for(let i=0;i<160;i++)activity.tick(city,100);assert.equal(JSON.stringify(city.save()),before,'cosmetic tick never changes city');
const bridge=city.tiles.find(t=>t.type==='bridge'),route=activity.route(city,city.at(30,16),[city.at(44,16)]);assert(route);city.build(bridge.x,bridge.y,'erase');assert.equal(activity.route(city,city.at(30,16),[city.at(44,16)]),null);
const engine=activity.agents.find(a=>a.kind==='engine');assert(engine);city.build(13,14,'erase');activity.tick(city,10);assert(!activity.agents.some(a=>a.kind==='engine'));
for(let i=0;i<400;i++)activity.tick(city,100);assert(activity.agents.length<=65);
for(const t of city.anchors())if(t.type==='home')t.level=0;city.update();activity.tick(city,10);assert.equal(activity.agents.length,0);
activity.reset();assert.equal(activity.agents.length,0);
console.log('PASS: cosmetic isolation, population scaling, service routes, bridge connectivity, demolition cleanup, bounded agents, pause, reset.');
