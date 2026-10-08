/* CityCanvas: independently authored simulation. No external game assets or code. */
(function(root){
const W=48,H=32;
const types={
 road:{name:'Road',cost:15,color:'#8493a4',w:1,h:1,help:'Paint roads. Connected roads carry power from solar plants.'},
 bridge:{name:'Bridge',cost:85,color:'#c5b58d',w:1,h:1,help:'Paint bridge tiles across the river to connect roads, traffic, and power.'},
 home:{name:'Homes',cost:40,color:'#5bd09d',w:1,h:1,help:'Zone one-tile homes beside roads. Residents need power, water, and jobs.'},
 shop:{name:'Commerce',cost:55,color:'#63bdec',w:1,h:1,help:'Zone one-tile shops. Their storefronts expand as more residents arrive.'},
 industry:{name:'Industry',cost:65,color:'#efb75a',w:1,h:1,help:'Zone one-tile workshops. Keep their smoke stacks away from homes.'},
 power:{name:'Solar plant',cost:900,color:'#9e90ed',w:3,h:2,help:'Click to place a 3 × 2 solar plant beside roads. Supplies 160 buildings through connected roads.'},
 water:{name:'Water tower',cost:650,color:'#65d5dd',w:2,h:2,help:'Click to place a 2 × 2 tower. Needs road-connected power; supplies water within 12 tiles of its grounds.'},
 park:{name:'Park',cost:120,color:'#83dd66',w:1,h:1,help:'Parks improve well-being in homes within six tiles.'},
 square:{name:'Town square',cost:450,color:'#d8c59a',w:3,h:3,goal:'green-homes',recreation:8,help:'A 3 × 3 fountain plaza. Road access provides recreation coverage within eight tiles.'},
 sports:{name:'Sports field',cost:700,color:'#7eb8a0',w:4,h:3,goal:'shopping-street',recreation:10,help:'A 4 × 3 sports ground with a running track. Road access provides recreation coverage within ten tiles. Rotate to fit.'},
 promenade:{name:'Waterfront promenade',cost:600,color:'#90c6cd',w:1,h:3,goal:'clean-industry',recreation:6,help:'A 1 × 3 riverside walk. Place on land beside the river; road access provides recreation coverage within six tiles. Rotate to fit.'},
 school:{name:'School',cost:750,color:'#ec97bc',w:3,h:2,help:'Click to place a 3 × 2 school campus. A powered school improves well-being within eight tiles of its grounds.'},
 fire:{name:'Fire station',cost:650,color:'#ed8e70',w:2,h:2,help:'Click to place a 2 × 2 fire station. Road-connected power enables safety coverage within eight tiles.'},
 hospital:{name:'Hospital',cost:1100,color:'#f4f0de',w:3,h:2,help:'A powered hospital adds 10 well-being points within nine tiles of its grounds.'},
 library:{name:'Library',cost:500,color:'#d9af75',w:2,h:2,help:'A powered library adds eight well-being points within seven tiles of its grounds.'},
 erase:{name:'Bulldoze',cost:10,color:'#cc9d9d',w:1,h:1,help:'Click any part of a facility to remove the entire building. Water cannot be removed.'},
 inspect:{name:'Inspect',cost:0,color:'#c4d5e6',w:1,h:1,help:'Click any part of a building to inspect its footprint, services, and growth.'}
};
const upkeep={road:1,bridge:3,hospital:40,library:18,power:35,water:25,park:3,square:6,sports:8,promenade:6,school:28,fire:22};
const isRoad=t=>!!t&&['road','bridge'].includes(t.type);
const terrainAt=(x,y)=>Math.abs(x-(36+Math.round(Math.sin(y/5)*2)))<2?'river':'land';
const zones=['home','shop','industry'];
const neighborhoodGoals=[
 {id:'green-homes',title:'A greener neighborhood',detail:'Grow 4 occupied homes with road, power, water, park coverage, at least 70% well-being, and no industrial pollution.',target:4,reward:600},
 {id:'shopping-street',title:'A busy shopping street',detail:'Grow 3 shops to stage 2 or higher, with road, power, and water.',target:3,reward:900},
 {id:'clean-industry',title:'Industry with room to breathe',detail:'Grow 3 factories to stage 2 or higher, with road, power, and water. Keep all occupied homes outside industrial pollution coverage.',target:3,reward:1200}
];
const milestones=[
 {name:'Settlement',population:0,unlocks:[]},
 {name:'Village',population:64,unlocks:['school','fire']},
 {name:'Town',population:160,unlocks:['library']},
 {name:'City',population:320,unlocks:['hospital']},
 {name:'Thriving city',population:640,unlocks:[]}
];
const unlockAt=type=>milestones.find(m=>m.unlocks.includes(type))?.population||0;
// Coverage is measured from the nearest edge of the facility's occupied grounds.
const near=(a,b,r)=>Math.max(b.x-a.x,0,a.x-(b.x+(b.w||1)-1))+Math.max(b.y-a.y,0,a.y-(b.y+(b.h||1)-1))<=r;
class City{
 constructor(mode='free'){
  this.earnedGoals=[];this.peakPopulation=0;this.mode=mode;this.funds=15000;this.month=1;this.tax=9;this.tiles=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const river=36+Math.round(Math.sin(y/5)*2);
   this.tiles.push({x,y,type:terrainAt(x,y),level:0,progress:0,anchor:y*W+x,w:1,h:1,powered:false,watered:false,access:false});
  }this.update();
 }
 at(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<W&&y<H?this.tiles[y*W+x]:null;}
 anchor(t){return t?this.tiles[t.anchor]:null;}
 anchors(){return this.tiles.filter((t,i)=>t.anchor===i);}
 neighbors(t){return [[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>this.at(t.x+x,t.y+y)).filter(Boolean);}
 footprint(t){const a=this.anchor(t),cells=[];if(!a)return cells;for(let y=a.y;y<a.y+a.h;y++)for(let x=a.x;x<a.x+a.w;x++)cells.push(this.at(x,y));return cells.filter(Boolean);}
 perimeter(t){const a=this.anchor(t),edges=new Set();for(const cell of this.footprint(a))for(const n of this.neighbors(cell))if(n.anchor!==a.anchor)edges.add(n);return [...edges];}
 state(t){return {type:t.type,level:t.level,progress:t.progress||0,anchor:t.anchor,w:t.w,h:t.h};}
 unlocked(type){return this.mode==='free'||(types[type]?.goal?this.earnedGoals.includes(types[type].goal):this.peakPopulation>=unlockAt(type));}
 unlockMessage(type){return types[type]?.goal?`Complete “${neighborhoodGoals.find(g=>g.id===types[type].goal).title}” in City Manager.`:`Unlocks at ${unlockAt(type)} residents.`;}
 plan(x,y,type,rotated=false){
  const t=this.at(x,y),def=types[type];
  if(!t||!def)return {cells:[],error:'Choose a tile on the map.'};
  if(!this.unlocked(type))return {cells:[],error:this.unlockMessage(type)};
  if(type==='inspect')return {cells:[],error:''};
  if(type==='bridge'){if(t.type==='bridge')return {cells:[],error:''};return t.type==='river'?{cells:[t],error:'',w:1,h:1}:{cells:[],error:'Bridges must be placed on river tiles.'};}
  if(t.type==='river')return {cells:[],error:'Keep the river clear. Build on land.'};
  if(type==='erase')return {cells:t.type==='land'?[]:this.footprint(t),error:'',w:this.anchor(t).w,h:this.anchor(t).h};
  if(t.type===type)return {cells:[],error:''};
  const w=rotated?def.h:def.w,h=rotated?def.w:def.h,cells=[];
  for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
   const cell=this.at(x+dx,y+dy);
   if(!cell)return {cells:[],error:`This ${w} × ${h} footprint goes beyond the map edge.`};
   if(cell.type!=='land')return {cells:[],error:cell.type==='river'?'The entire footprint must stay on land.':`Clear all ${w} × ${h} tiles before placing this building.`};
   cells.push(cell);
  }
  if(type==='promenade'&&!cells.some(c=>this.neighbors(c).some(n=>terrainAt(n.x,n.y)==='river')))return {cells:[],error:'Place the promenade on land beside the river.'};
  return {cells,error:'',w,h};
 }
 build(x,y,type,rotated=false){
  const plan=this.plan(x,y,type,rotated),def=types[type];
  if(plan.error)return plan.error;if(!plan.cells.length)return '';
  if(this.mode==='manager'&&this.funds<def.cost)return 'Insufficient funds. Lower expenses or let tax revenue accumulate.';
  if(this.mode==='manager')this.funds-=def.cost;
  for(const cell of plan.cells){
   const own=cell.y*W+cell.x,isAnchor=cell.x===x&&cell.y===y;
   Object.assign(cell,{type:type==='erase'?terrainAt(cell.x,cell.y):type,level:0,progress:0,anchor:type==='erase'?own:y*W+x,w:type==='erase'?1:isAnchor?plan.w:0,h:type==='erase'?1:isAnchor?plan.h:0});
  }
  this.update();return '';
 }
 update(){
  const buildings=this.anchors(),lots=buildings.filter(t=>zones.includes(t.type)),stations=buildings.filter(t=>t.type==='power'),roads=new Set(),queue=[];
  for(const t of this.tiles){t.powered=false;t.watered=false;t.access=false;}
  for(const t of buildings)t.access=this.perimeter(t).some(n=>isRoad(n));
  for(const p of stations){p.powered=p.access;for(const n of this.perimeter(p))if(isRoad(n)&&!roads.has(n)){roads.add(n);queue.push(n);}}
  for(let i=0;i<queue.length;i++)for(const n of this.neighbors(queue[i]))if(isRoad(n)&&!roads.has(n)){roads.add(n);queue.push(n);}
  let capacity=stations.filter(t=>t.access).length*160;
  for(const t of buildings)if(!['land','river','power'].includes(t.type)){
   const connected=isRoad(t)?roads.has(t):this.perimeter(t).some(n=>roads.has(n));
   t.powered=connected&&(isRoad(t)||capacity-->0);
  }
  const towers=buildings.filter(t=>t.type==='water'&&t.powered),parks=buildings.filter(t=>t.type==='park'||(types[t.type]?.recreation&&t.access)),schools=buildings.filter(t=>t.type==='school'&&t.powered),fires=buildings.filter(t=>t.type==='fire'&&t.powered),hospitals=buildings.filter(t=>t.type==='hospital'&&t.powered),libraries=buildings.filter(t=>t.type==='library'&&t.powered),factories=lots.filter(t=>t.type==='industry'&&t.level>0);
  for(const t of this.tiles){
   t.watered=towers.some(n=>near(t,n,12));t.park=parks.some(n=>near(t,n,types[n.type].recreation||6));t.school=schools.some(n=>near(t,n,8));t.fire=fires.some(n=>near(t,n,8));t.health=hospitals.some(n=>near(t,n,9));t.library=libraries.some(n=>near(t,n,7));t.polluted=factories.some(n=>near(t,n,4));
   if(t.anchor!==t.y*W+t.x){const a=this.anchor(t);t.access=a.access;t.powered=a.powered;}
  }
  for(const t of lots)t.wellbeing=Math.max(10,Math.min(100,58+(t.park?14:0)+(t.school?12:0)+(t.fire?8:0)+(t.health?10:0)+(t.library?8:0)-(t.polluted?22:0)-(t.powered?0:28)-(t.watered?0:22)-Math.max(0,this.tax-10)*3));
  this.population=lots.filter(t=>t.type==='home').reduce((s,t)=>s+t.level*8,0);
  this.peakPopulation=Math.max(this.peakPopulation,this.population);
  this.milestone=milestones.filter(m=>this.peakPopulation>=m.population).at(-1);
  this.nextMilestone=milestones.find(m=>this.peakPopulation<m.population)||null;
  this.jobs=lots.filter(t=>t.type!=='home').reduce((s,t)=>s+t.level*(t.type==='industry'?10:6),0);
  const homes=lots.filter(t=>t.type==='home'&&t.level);
  this.happiness=homes.length?Math.round(homes.reduce((s,t)=>s+t.wellbeing,0)/homes.length):0;
  this.income=Math.round((this.population*1.5+this.jobs)*this.tax/9);
  this.budget=Object.entries(upkeep).map(([type,cost])=>({type,count:buildings.filter(t=>t.type===type).length,cost}));
  this.expenses=this.budget.reduce((sum,row)=>sum+row.count*row.cost,0);this.balance=this.income-this.expenses;
  this.powerCapacity=stations.filter(t=>t.access).length*160;
  this.powerUsed=buildings.filter(t=>t.powered&&!['road','bridge','power'].includes(t.type)).length;
  this.readiness=zones.map(type=>{const candidates=lots.filter(t=>t.type===type&&t.level<3);return {type,ready:candidates.filter(t=>!this.growth(t).length).length,waiting:candidates.filter(t=>this.growth(t).length).length};});
  this.requests=this.citizenRequests(lots);
  this.neighborhoodProgress=this.goalProgress(lots);
  return this;
 }
 goalProgress(lots){
  const connected=t=>t.access&&t.powered&&t.watered;
  const pollutedHome=lots.some(t=>t.type==='home'&&t.level>0&&t.polluted);
  const counts=[lots.filter(t=>t.type==='home'&&t.level>0&&connected(t)&&t.park&&t.wellbeing>=70&&!t.polluted).length,lots.filter(t=>t.type==='shop'&&t.level>=2&&connected(t)).length,pollutedHome?0:lots.filter(t=>t.type==='industry'&&t.level>=2&&connected(t)).length];
  return neighborhoodGoals.map((goal,i)=>({...goal,count:Math.min(goal.target,counts[i]),earned:this.earnedGoals.includes(goal.id)}));
 }
 awardGoals(){
  if(this.mode!=='manager')return [];
  const completed=this.neighborhoodProgress.filter(g=>!g.earned&&g.count>=g.target);
  for(const goal of completed){this.earnedGoals.push(goal.id);this.funds+=goal.reward;}
  this.neighborhoodProgress=this.goalProgress(this.anchors().filter(t=>zones.includes(t.type)));return completed;
 }
 citizenRequests(lots){
  const requests=[],homes=lots.filter(t=>t.type==='home');
  const add=(id,title,detail,target,layer='none')=>requests.push({id,title,detail,target:target?{x:target.x,y:target.y}:null,layer});
  if(!lots.length)add('start','A place to call home','Paint homes and workplaces beside a road. Add a solar plant and water tower to welcome your first residents.');
  for(const [id,title,detail,layer]of [['access','Connect our neighborhood','This lot needs a road along its edge.','none'],['powered','Turn the lights on','Connect this road network to a solar plant. Check remaining power capacity.','power'],['watered','We need running water','Place a powered water tower within 12 tiles of this lot.','water']]){const t=lots.find(t=>!t[id]);if(t)add(id,title,detail,t,layer);}
  if(homes.length&&this.jobs<this.population*.4)add('jobs','More places to work','Zone commerce or industry beside connected roads to attract more residents.',homes[0]);
  if(!homes.length&&lots.length)add('homes','Room for new neighbors','Zone homes near connected roads and water coverage.');
  const polluted=homes.find(t=>t.level&&t.polluted);if(polluted)add('pollution','Cleaner air, please','Move homes beyond four tiles of developed industry, or relocate the workshops.',polluted,'pollution');
  for(const [id,type,title,detail,layer]of [['park','park','A little green space','Add a park within six tiles of these homes.','park'],['school','school','A school for our neighborhood','Place a powered school within eight tiles of these homes.','school'],['fire','fire','Help us feel safe','Add a powered fire station within eight tiles of these homes.','fire'],['library','library','A place to read and learn','Add a powered library within seven tiles of these homes.','library'],['health','hospital','Healthcare close to home','Add a powered hospital within nine tiles of these homes.','health']]){const t=homes.find(t=>t.level&&!t[id]);if(t&&this.unlocked(type))add(id,title,detail,t,layer);}
  if(this.mode==='manager'&&this.population&&this.balance<0)add('budget','Keep our city affordable','Grow tax-paying homes and workplaces, and review operating costs in the monthly budget.');
  if(!requests.length)add('grow',this.nextMilestone?'Welcome more neighbors':'Our city is thriving',this.nextMilestone?`Grow toward ${this.nextMilestone.population} residents to become a ${this.nextMilestone.name.toLowerCase()}.`:'Keep expanding healthy neighborhoods and connected workplaces.');
  return requests.slice(0,2);
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
  this.update();if(this.mode==='manager')this.funds+=this.balance;this.awardGoals();this.month++;return this;
 }
 save(){return {version:5,earnedGoals:[...this.earnedGoals],peakPopulation:this.peakPopulation,mode:this.mode,funds:this.funds,month:this.month,tax:this.tax,tiles:this.tiles.map(t=>this.state(t))};}
 static load(data){
  if(!data||![1,2,3,4,5].includes(data.version)||!['free','manager'].includes(data.mode)||!Number.isFinite(data.funds)||Math.abs(data.funds)>1e12||!Number.isInteger(data.month)||data.month<1||data.month>1e9||!Number.isInteger(data.tax)||data.tax<0||data.tax>20||!Array.isArray(data.tiles)||data.tiles.length!==W*H)throw Error('This is not a valid CityCanvas save.');
  if(data.version>=4&&(!Number.isInteger(data.peakPopulation)||data.peakPopulation<0||data.peakPopulation>W*H*24))throw Error('Invalid city milestone history.');
  if(data.version===5&&(!Array.isArray(data.earnedGoals)||data.earnedGoals.length>neighborhoodGoals.length||new Set(data.earnedGoals).size!==data.earnedGoals.length||data.earnedGoals.some(id=>!neighborhoodGoals.some(g=>g.id===id))))throw Error('Invalid neighborhood goal history.');
  const city=new City(data.mode),allowed=['land','river',...Object.keys(types).filter(t=>!['erase','inspect'].includes(t))];
  data.tiles.forEach((saved,i)=>{
   const original=city.tiles[i];
   if(!saved||!allowed.includes(saved.type)||!Number.isInteger(saved.level)||saved.level<0||saved.level>3||!Number.isInteger(saved.progress)||saved.progress<0||saved.progress>1||(original.type==='river')!==(['river','bridge'].includes(saved.type))||(!zones.includes(saved.type)&&(saved.level!==0||saved.progress!==0)))throw Error('This save contains invalid map tiles.');
   const anchor=data.version===1?i:saved.anchor,w=data.version===1?1:saved.w,h=data.version===1?1:saved.h;
   if(!Number.isInteger(anchor)||anchor<0||anchor>=W*H||!Number.isInteger(w)||!Number.isInteger(h))throw Error('Invalid building footprint.');
   Object.assign(original,{type:saved.type,level:saved.level,progress:saved.progress,anchor,w,h});
  });
  for(const t of city.tiles){
   const a=city.anchor(t),def=types[a.type],single=a.w===1&&a.h===1;
   if(a.anchor!==a.y*W+a.x||(!single&&(!def||!((a.w===def.w&&a.h===def.h)||(a.w===def.h&&a.h===def.w))))||a.w<1||a.h<1||a.x+a.w>W||a.y+a.h>H||t.type!==a.type||t.x<a.x||t.y<a.y||t.x>=a.x+a.w||t.y>=a.y+a.h)throw Error('Invalid building footprint.');
   if(t!==a&&(t.w!==0||t.h!==0||t.level!==0||t.progress!==0))throw Error('Invalid footprint section.');
   if(['land','river','road','bridge','home','shop','industry','park'].includes(t.type)&&(!single||t!==a))throw Error('Invalid occupied terrain.');
   if(t===a)for(const c of city.footprint(a))if(c.anchor!==a.anchor)throw Error('Incomplete building footprint.');
  }
  city.earnedGoals=data.version===5?[...data.earnedGoals]:[];city.peakPopulation=data.version>=4?data.peakPopulation:Math.max(0,...city.anchors().map(t=>unlockAt(t.type)));city.funds=data.funds;city.month=data.month;city.tax=data.tax;return city.update();
 }
}
root.CityCanvasSim={City,types,W,H,isRoad,terrainAt,milestones,unlockAt,neighborhoodGoals};if(typeof module!=='undefined')module.exports=root.CityCanvasSim;
})(typeof window!=='undefined'?window:globalThis);
