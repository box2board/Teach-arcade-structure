/* Cosmetic activity only: no effect on growth, coverage, or city budgets. */
(function(root){
const road=t=>!!t&&['road','bridge'].includes(t.type),key=t=>t.y*48+t.x;
class Activity{
 constructor(random=Math.random){this.random=random;this.agents=[];this.elapsed=6000;}
 reset(){this.agents=[];this.elapsed=6000;}
 choose(items){return items.length?items[Math.floor(this.random()*items.length)]:null;}
 route(city,start,ends){
  const targets=new Set(ends.map(key)),parents=new Map([[key(start),null]]),queue=[start];
  for(let i=0;i<queue.length;i++){
   const t=queue[i];if(targets.has(key(t))&&i>0){const path=[];let index=key(t);while(index!==null){path.push({x:index%48,y:Math.floor(index/48)});index=parents.get(index);}return path.reverse();}
   for(const n of city.neighbors(t))if(road(n)&&!parents.has(key(n))){parents.set(key(n),key(t));queue.push(n);}
  }return null;
 }
 spawn(city){
  const roads=city.tiles.filter(t=>road(t)&&city.neighbors(t).some(road));
  const carLimit=Math.min(32,Math.ceil(city.population/12)),walkLimit=Math.min(24,Math.ceil(city.population/16));
  for(const [kind,limit]of [['car',carLimit],['pedestrian',walkLimit]]){
   const count=this.agents.filter(a=>a.kind===kind).length;
   for(let i=count;i<Math.min(limit,count+4);i++){const start=this.choose(roads);if(!start)break;this.agents.push({kind,x:start.x,y:start.y,next:null,p:0,previous:null,color:this.choose(['#ffe08b','#ef8a91','#d7f1fa','#83d5b3']),side:this.random()<.5?-1:1});}
  }
  const homes=city.anchors().filter(t=>t.type==='home'&&t.level>0),services=city.anchors().filter(t=>['school','fire','hospital'].includes(t.type)&&t.powered);
  if(!homes.length)return;
  for(const source of services){
   if(this.agents.filter(a=>a.source!==undefined).length>=9)break;
   if(this.agents.some(a=>a.source===source.anchor))continue;
   const start=this.choose(city.perimeter(source).filter(road)),home=this.choose(homes);if(!start||!home)continue;
   const path=this.route(city,start,city.perimeter(home).filter(road));if(!path||path.length<2)continue;
   const roundTrip=path.concat(path.slice(0,-1).reverse());
   this.agents.push({kind:{school:'bus',fire:'engine',hospital:'ambulance'}[source.type],source:source.anchor,sourceType:source.type,x:start.x,y:start.y,path:roundTrip,pathIndex:0,next:roundTrip[1],p:0,side:1});
  }
 }
 tick(city,dt){
  if(!(dt>0))return;this.elapsed+=dt;
  this.agents=this.agents.filter(a=>road(city.at(a.x,a.y))&&(!a.next||road(city.at(a.next.x,a.next.y)))&&(a.source===undefined||(city.tiles[a.source]?.type===a.sourceType&&city.tiles[a.source]?.powered)));
  const limits={car:Math.min(32,Math.ceil(city.population/12)),pedestrian:Math.min(24,Math.ceil(city.population/16))},counts={car:0,pedestrian:0};
  this.agents=this.agents.filter(a=>a.kind in limits?++counts[a.kind]<=limits[a.kind]:city.population>0);
  if(this.elapsed>=6000){this.elapsed=0;this.spawn(city);}
  for(const a of this.agents){
   if(!a.next){const options=city.neighbors(city.at(a.x,a.y)).filter(road),forward=options.filter(t=>key(t)!==a.previous);a.next=this.choose(forward.length?forward:options);if(!a.next)continue;}
   a.p+=dt/(a.kind==='pedestrian'?2400:a.kind==='bus'?1450:1100);
   if(a.p>=1){a.previous=a.y*48+a.x;a.x=a.next.x;a.y=a.next.y;a.p=0;
    if(a.path){a.pathIndex++;a.next=a.path[a.pathIndex+1]||null;if(!a.next)a.done=true;}else a.next=null;
   }
  }this.agents=this.agents.filter(a=>!a.done);
 }
}
root.CityCanvasActivity=Activity;
})(typeof window!=='undefined'?window:globalThis);
