/* CityCanvas: independently authored simulation. No external game assets or code. */
(function(root){
const W=48,H=32;
const types={
 road:{name:'Road',cost:15,color:'#8493a4',w:1,h:1,help:'Paint roads. Connected roads carry power from solar stations.'},
 home:{name:'Homes',cost:40,color:'#5bd09d',w:1,h:1,help:'Zone one-tile homes beside roads. Residents need power, water, and jobs.'},
 shop:{name:'Commerce',cost:55,color:'#63bdec',w:1,h:1,help:'Zone one-tile shops. Their storefronts expand as more residents arrive.'},
 industry:{name:'Industry',cost:65,color:'#efb75a',w:1,h:1,help:'Zone one-tile workshops. Keep their smoke stacks away from homes.'},
 power:{name:'Solar plant',cost:900,color:'#9e90ed',w:3,h:2,help:'Click to place a 3 × 2 solar plant beside roads. Supplies 160 buildings through connected roads.'},
 water:{name:'Water tower',cost:650,color:'#65d5dd',w:2,h:2,help:'Click to place a 2 × 2 tower. Needs road-connected power; supplies water within 12 tiles of its grounds.'},
 park:{name:'Park',cost:120,color:'#83dd66',w:1,h:1,help:'Parks improve well-being in homes within six tiles.'},
 school:{name:'School',cost:750,color:'#ec97bc',w:3,h:2,help:'Click to place a 3 × 2 school campus. A powered school improves well-being within eight tiles of its grounds.'},
 fire:{name:'Fire station',cost:650,color:'#ed8e70',w:2,h:2,help:'Click to place a 2 × 2 fire station. Road-connected power enables safety coverage within eight tiles.'},
 erase:{name:'Bulldoze',cost:10,color:'#cc9d9d',w:1,h:1,help:'Click any part of a facility to remove the entire building. Water cannot be removed.'},
 inspect:{name:'Inspect',cost:0,color:'#c4d5e6',w:1,h:1,help:'Click any part of a building to inspect its footprint, services, and growth.'}
};
const upkeep={road:1,power:35,water:25,park:3,school:28,fire:22};
const zones=['home','shop','industry'];
// Coverage is measured from the nearest edge of the facility's occupied grounds.
const near=(a,b,r)=>Math.max(b.x-a.x,0,a.x-(b.x+(b.w||1)-1))+Math.max(b.y-a.y,0,a.y-(b.y+(b.h||1)-1))<=r;
class City{
 constructor(mode='free'){
  this.mode=mode;this.funds=15000;this.month=1;this.tax=9;this.tiles=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const river=36+Math.round(Math.sin(y/5)*2);
   this.tiles.push({x,y,type:Math.abs(x-river)<2?'river':'land',level:0,progress:0,anchor:y*W+x,w:1,h:1,powered:false,watered:false,access:false});
  }this.update();
 }
 at(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<W&&y<H?this.tiles[y*W+x]:null;}
 anchor(t){return t?this.tiles[t.anchor]:null;}
 anchors(){return this.tiles.filter((t,i)=>t.anchor===i);}
 neighbors(t){return [[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>this.at(t.x+x,t.y+y)).filter(Boolean);}
 footprint(t){const a=this.anchor(t),cells=[];if(!a)return cells;for(let y=a.y;y<a.y+a.h;y++)for(let x=a.x;x<a.x+a.w;x++)cells.push(this.at(x,y));return cells.filter(Boolean);}
 perimeter(t){const a=this.anchor(t),edges=new Set();for(const cell of this.footprint(a))for(const n of this.neighbors(cell))if(n.anchor!==a.anchor)edges.add(n);return [...edges];}
 state(t){return {type:t.type,level:t.level,progress:t.progress||0,anchor:t.anchor,w:t.w,h:t.h};}
 plan(x,y,type){
  const t=this.at(x,y),def=types[type];
  if(!t||!def)return {cells:[],error:'Choose a tile on the map.'};
  if(type==='inspect')return {cells:[],error:''};
  if(t.type==='river')return {cells:[],error:'Keep the river clear. Build on land.'};
  if(type==='erase')return {cells:t.type==='land'?[]:this.footprint(t),error:'',w:this.anchor(t).w,h:this.anchor(t).h};
  if(t.type===type)return {cells:[],error:''};
  const cells=[];
  for(let dy=0;dy<def.h;dy++)for(let dx=0;dx<def.w;dx++){
   const cell=this.at(x+dx,y+dy);
   if(!cell)return {cells:[],error:`This ${def.w} × ${def.h} footprint goes beyond the map edge.`};
   if(cell.type!=='land')return {cells:[],error:cell.type==='river'?'The entire footprint must stay on land.':`Clear all ${def.w} × ${def.h} tiles before placing this building.`};
   cells.push(cell);
  }
  return {cells,error:'',w:def.w,h:def.h};
 }
 build(x,y,type){
  const plan=this.plan(x,y,type),def=types[type];
  if(plan.error)return plan.error;if(!plan.cells.length)return '';
  if(this.mode==='manager'&&this.funds<def.cost)return 'Insufficient funds. Lower expenses or let tax revenue accumulate.';
  if(this.mode==='manager')this.funds-=def.cost;
  for(const cell of plan.cells){
   const own=cell.y*W+cell.x,isAnchor=cell.x===x&&cell.y===y;
   Object.assign(cell,{type:type==='erase'?'land':type,level:0,progress:0,anchor:type==='erase'?own:y*W+x,w:type==='erase'?1:isAnchor?def.w:0,h:type==='erase'?1:isAnchor?def.h:0});
  }
  this.update();return '';
 }
 update(){
  const buildings=this.anchors(),lots=buildings.filter(t=>zones.includes(t.type)),stations=buildings.filter(t=>t.type==='power'),roads=new Set(),queue=[];
  for(const t of this.tiles){t.powered=false;t.watered=false;t.access=false;}
  for(const t of buildings)t.access=this.perimeter(t).some(n=>n.type==='road');
  for(const p of stations){p.powered=p.access;for(const n of this.perimeter(p))if(n.type==='road'&&!roads.has(n)){roads.add(n);queue.push(n);}}
  for(let i=0;i<queue.length;i++)for(const n of this.neighbors(queue[i]))if(n.type==='road'&&!roads.has(n)){roads.add(n);queue.push(n);}
  let capacity=stations.filter(t=>t.access).length*160;
  for(const t of buildings)if(!['land','river','power'].includes(t.type)){
   const connected=t.type==='road'?roads.has(t):this.perimeter(t).some(n=>roads.has(n));
   t.powered=connected&&(t.type==='road'||capacity-->0);
  }
  const towers=buildings.filter(t=>t.type==='water'&&t.powered),parks=buildings.filter(t=>t.type==='park'),schools=buildings.filter(t=>t.type==='school'&&t.powered),fires=buildings.filter(t=>t.type==='fire'&&t.powered),factories=lots.filter(t=>t.type==='industry'&&t.level>0);
  for(const t of this.tiles){
   t.watered=towers.some(n=>near(t,n,12));t.park=parks.some(n=>near(t,n,6));t.school=schools.some(n=>near(t,n,8));t.fire=fires.some(n=>near(t,n,8));t.polluted=factories.some(n=>near(t,n,4));
   if(t.anchor!==t.y*W+t.x){const a=this.anchor(t);t.access=a.access;t.powered=a.powered;}
  }
  for(const t of lots)t.wellbeing=Math.max(10,Math.min(100,58+(t.park?14:0)+(t.school?12:0)+(t.fire?8:0)-(t.polluted?22:0)-(t.powered?0:28)-(t.watered?0:22)-Math.max(0,this.tax-10)*3));
  this.population=lots.filter(t=>t.type==='home').reduce((s,t)=>s+t.level*8,0);
  this.jobs=lots.filter(t=>t.type!=='home').reduce((s,t)=>s+t.level*(t.type==='industry'?10:6),0);
  const homes=lots.filter(t=>t.type==='home'&&t.level);
  this.happiness=homes.length?Math.round(homes.reduce((s,t)=>s+t.wellbeing,0)/homes.length):0;
  this.income=Math.round((this.population*1.5+this.jobs)*this.tax/9);
  this.budget=Object.entries(upkeep).map(([type,cost])=>({type,count:buildings.filter(t=>t.type===type).length,cost}));
  this.expenses=this.budget.reduce((sum,row)=>sum+row.count*row.cost,0);this.balance=this.income-this.expenses;
  this.powerCapacity=stations.filter(t=>t.access).length*160;
  this.powerUsed=buildings.filter(t=>t.powered&&!['road','power'].includes(t.type)).length;
  this.readiness=zones.map(type=>{const candidates=lots.filter(t=>t.type===type&&t.level<3);return {type,ready:candidates.filter(t=>!this.growth(t).length).length,waiting:candidates.filter(t=>this.growth(t).length).length};});
  return this;
 }
 growth(t){
  const reasons=[];
  if(!t.access)reasons.push('Add a road alongside this lot.');
  if(!t.powered)reasons.push('Connect its road to a solar plant; add a plant if capacity is full.');
  if(!t.watered)reasons.push('Add a powered water tower within 12 tiles.');
  if(t.type==='home'){
   if(this.jobs<this.population*.4)reasons.push('Zone more workplaces to attract residents.');
   if(t.wellbeing<40)reasons.push('Improve well-being with parks and services, or lower taxes.');
  }else if(t.type==='shop'&&this.population<t.level*12)reasons.push('More residents are needed to support larger shops.');
  else if(t.type==='industry'&&this.jobs>=Math.max(25,this.population*.9))reasons.push('Existing workplaces meet demand. Build more homes.');
  return reasons;
 }
 step(){
  this.update();const decisions=this.anchors().filter(t=>zones.includes(t.type)).map(t=>({t,reasons:this.growth(t)}));
  for(const {t,reasons} of decisions){
   if(!t.access||!t.powered||!t.watered||t.wellbeing<30){t.progress=0;if(t.level>0)t.level--;}
   else if(!reasons.length&&t.level<3){t.progress++;if(t.progress>=2){t.level++;t.progress=0;}}
   else t.progress=0;
  }
  this.update();if(this.mode==='manager')this.funds+=this.balance;this.month++;return this;
 }
 save(){return {version:2,mode:this.mode,funds:this.funds,month:this.month,tax:this.tax,tiles:this.tiles.map(t=>this.state(t))};}
 static load(data){
  if(!data||![1,2].includes(data.version)||!['free','manager'].includes(data.mode)||!Number.isFinite(data.funds)||Math.abs(data.funds)>1e12||!Number.isInteger(data.month)||data.month<1||data.month>1e9||!Number.isInteger(data.tax)||data.tax<0||data.tax>20||!Array.isArray(data.tiles)||data.tiles.length!==W*H)throw Error('This is not a valid CityCanvas save.');
  const city=new City(data.mode),allowed=['land','river',...Object.keys(types).filter(t=>!['erase','inspect'].includes(t))];
  data.tiles.forEach((saved,i)=>{
   const original=city.tiles[i];
   if(!saved||!allowed.includes(saved.type)||!Number.isInteger(saved.level)||saved.level<0||saved.level>3||!Number.isInteger(saved.progress)||saved.progress<0||saved.progress>1||(original.type==='river')!==(saved.type==='river')||(!zones.includes(saved.type)&&(saved.level!==0||saved.progress!==0)))throw Error('This save contains invalid map tiles.');
   const anchor=data.version===1?i:saved.anchor,w=data.version===1?1:saved.w,h=data.version===1?1:saved.h;
   if(!Number.isInteger(anchor)||anchor<0||anchor>=W*H||!Number.isInteger(w)||!Number.isInteger(h))throw Error('Invalid building footprint.');
   Object.assign(original,{type:saved.type,level:saved.level,progress:saved.progress,anchor,w,h});
  });
  for(const t of city.tiles){
   const a=city.anchor(t),def=types[a.type],single=a.w===1&&a.h===1;
   if(a.anchor!==a.y*W+a.x||(!single&&(!def||a.w!==def.w||a.h!==def.h))||a.w<1||a.h<1||a.x+a.w>W||a.y+a.h>H||t.type!==a.type||t.x<a.x||t.y<a.y||t.x>=a.x+a.w||t.y>=a.y+a.h)throw Error('Invalid building footprint.');
   if(t!==a&&(t.w!==0||t.h!==0||t.level!==0||t.progress!==0))throw Error('Invalid footprint section.');
   if(['land','river','road','home','shop','industry','park'].includes(t.type)&&(!single||t!==a))throw Error('Invalid occupied terrain.');
   if(t===a)for(const c of city.footprint(a))if(c.anchor!==a.anchor)throw Error('Incomplete building footprint.');
  }
  city.funds=data.funds;city.month=data.month;city.tax=data.tax;return city.update();
 }
}
root.CityCanvasSim={City,types,W,H};if(typeof module!=='undefined')module.exports=root.CityCanvasSim;
})(typeof window!=='undefined'?window:globalThis);
