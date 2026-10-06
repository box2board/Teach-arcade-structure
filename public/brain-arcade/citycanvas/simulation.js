/* CityCanvas: independently authored simulation. No external game assets or code. */
(function(root){
const W=48,H=32;
const types={road:{name:'Road',cost:15,color:'#8493a4',help:'Paint roads. Connected roads carry power from solar stations.'},home:{name:'Homes',cost:40,color:'#5bd09d',help:'Zone homes next to a road. Residents need power, water, and jobs.'},shop:{name:'Commerce',cost:55,color:'#63bdec',help:'Shops create jobs and grow as your population increases.'},industry:{name:'Industry',cost:65,color:'#efb75a',help:'Workshops provide jobs, but nearby homes experience pollution.'},power:{name:'Solar station',cost:900,color:'#9e90ed',help:'Place next to roads. Supplies up to 160 developed lots through connected roads.'},water:{name:'Water tower',cost:650,color:'#65d5dd',help:'A powered tower supplies water within 12 tiles.'},park:{name:'Park',cost:120,color:'#83dd66',help:'Parks improve well-being in homes within six tiles.'},school:{name:'School',cost:750,color:'#ec97bc',help:'Powered schools improve well-being within eight tiles.'},fire:{name:'Fire station',cost:650,color:'#ed8e70',help:'Powered stations provide safety coverage within eight tiles.'},erase:{name:'Bulldoze',cost:10,color:'#cc9d9d',help:'Remove a building or road. Water cannot be removed.'},inspect:{name:'Inspect',cost:0,color:'#c4d5e6',help:'Select a tile to see its access, utilities, and development.'}};
const near=(a,b,r)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=r;
class City{
constructor(mode='free'){this.mode=mode;this.funds=15000;this.month=1;this.tax=9;this.tiles=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let river=36+Math.round(Math.sin(y/5)*2);this.tiles.push({x,y,type:Math.abs(x-river)<2?'river':'land',level:0,progress:0,powered:false,watered:false,access:false});}this.update();}
at(x,y){return x>=0&&y>=0&&x<W&&y<H?this.tiles[y*W+x]:null;}
neighbors(t){return [[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>this.at(t.x+x,t.y+y)).filter(Boolean);}
build(x,y,type){let t=this.at(x,y),def=types[type];if(!t||!def)return 'Choose a tile on the map.';if(type==='inspect')return '';if(t.type==='river')return 'Keep the river clear. Build on land.';if(type==='erase'&&t.type==='land')return '';if(t.type===type)return '';if(type!=='erase'&&t.type!=='land')return 'Bulldoze this tile before replacing it.';if(this.mode==='manager'&&this.funds<def.cost)return 'Insufficient funds. Lower expenses or let tax revenue accumulate.';if(this.mode==='manager')this.funds-=def.cost;t.type=type==='erase'?'land':type;t.level=0;t.progress=0;this.update();return '';}
update(){const lots=this.tiles.filter(t=>['home','shop','industry'].includes(t.type)),stations=this.tiles.filter(t=>t.type==='power'),roads=new Set(),queue=[];
for(const t of this.tiles){t.powered=false;t.watered=false;t.access=this.neighbors(t).some(n=>n.type==='road');}
for(const p of stations){p.powered=p.access;for(const n of this.neighbors(p))if(n.type==='road'&&!roads.has(n)){roads.add(n);queue.push(n);}}
for(let i=0;i<queue.length;i++)for(const n of this.neighbors(queue[i]))if(n.type==='road'&&!roads.has(n)){roads.add(n);queue.push(n);}
let capacity=stations.filter(t=>t.access).length*160;
for(const t of this.tiles)if(t.type!=='land'&&t.type!=='river'&&t.type!=='power'){const connected=t.type==='road'?roads.has(t):this.neighbors(t).some(n=>roads.has(n));t.powered=connected&&(t.type==='road'||capacity-->0);}
const towers=this.tiles.filter(t=>t.type==='water'&&t.powered),parks=this.tiles.filter(t=>t.type==='park'),schools=this.tiles.filter(t=>t.type==='school'&&t.powered),fires=this.tiles.filter(t=>t.type==='fire'&&t.powered),factories=lots.filter(t=>t.type==='industry'&&t.level>0);
for(const t of lots){t.watered=towers.some(n=>near(t,n,12));t.park=parks.some(n=>near(t,n,6));t.school=schools.some(n=>near(t,n,8));t.fire=fires.some(n=>near(t,n,8));t.polluted=factories.some(n=>near(t,n,4));t.wellbeing=Math.max(10,Math.min(100,58+(parks.some(n=>near(t,n,6))?14:0)+(schools.some(n=>near(t,n,8))?12:0)+(fires.some(n=>near(t,n,8))?8:0)-(factories.some(n=>near(t,n,4))?22:0)-(t.powered?0:28)-(t.watered?0:22)-Math.max(0,this.tax-10)*3));}
this.population=lots.filter(t=>t.type==='home').reduce((s,t)=>s+t.level*8,0);this.jobs=lots.filter(t=>t.type!=='home').reduce((s,t)=>s+t.level*(t.type==='industry'?10:6),0);let homes=lots.filter(t=>t.type==='home'&&t.level);this.happiness=homes.length?Math.round(homes.reduce((s,t)=>s+t.wellbeing,0)/homes.length):0;this.income=Math.round((this.population*1.5+this.jobs)*this.tax/9);this.expenses=this.tiles.reduce((s,t)=>s+({road:1,power:35,water:25,park:3,school:28,fire:22}[t.type]||0),0);this.balance=this.income-this.expenses;return this;}
growth(t){
const reasons=[];
if(!t.access)reasons.push('Add a road alongside this lot.');
if(!t.powered)reasons.push('Connect its road to solar power; add a station if capacity is full.');
if(!t.watered)reasons.push('Add a powered water tower within 12 tiles.');
if(t.type==='home'){
 if(this.jobs<this.population*.4)reasons.push('Zone more workplaces to attract residents.');
 if(t.wellbeing<40)reasons.push('Improve well-being with parks and services, or lower taxes.');
}else if(t.type==='shop'&&this.population<t.level*12)reasons.push('More residents are needed to support larger shops.');
else if(t.type==='industry'&&this.jobs>=Math.max(25,this.population*.9))reasons.push('Existing workplaces meet demand. Build more homes.');
return reasons;
}
step(){this.update();const decisions=this.tiles.filter(t=>['home','shop','industry'].includes(t.type)).map(t=>({t,reasons:this.growth(t)}));
for(const {t,reasons} of decisions){
 if(!t.access||!t.powered||!t.watered||t.wellbeing<30){t.progress=0;if(t.level>0)t.level--;}
 else if(!reasons.length&&t.level<3){t.progress=(t.progress||0)+1;if(t.progress>=2){t.level++;t.progress=0;}}
 else t.progress=0;
}
this.update();if(this.mode==='manager')this.funds+=this.balance;this.month++;return this;}
save(){return {version:1,mode:this.mode,funds:this.funds,month:this.month,tax:this.tax,tiles:this.tiles.map(t=>({type:t.type,level:t.level,progress:t.progress||0}))};}
static load(data){
if(!data||data.version!==1||!['free','manager'].includes(data.mode)||!Number.isFinite(data.funds)||Math.abs(data.funds)>1e12||!Number.isInteger(data.month)||data.month<1||data.month>1e9||!Number.isInteger(data.tax)||data.tax<0||data.tax>20||!Array.isArray(data.tiles)||data.tiles.length!==W*H)throw Error('This is not a valid CityCanvas save.');
const city=new City(data.mode),allowed=['land','river','road','home','shop','industry','power','water','park','school','fire'];
data.tiles.forEach((saved,i)=>{
 const original=city.tiles[i];
 if(!saved||!allowed.includes(saved.type)||!Number.isInteger(saved.level)||saved.level<0||saved.level>3||!Number.isInteger(saved.progress)||saved.progress<0||saved.progress>1||(original.type==='river')!==(saved.type==='river')||(!['home','shop','industry'].includes(saved.type)&&(saved.level!==0||saved.progress!==0)))throw Error('This save contains invalid map tiles.');
 Object.assign(original,{type:saved.type,level:saved.level,progress:saved.progress});
});
city.funds=data.funds;city.month=data.month;city.tax=data.tax;return city.update();
}
}
root.CityCanvasSim={City,types,W,H};if(typeof module!=='undefined')module.exports=root.CityCanvasSim;
})(typeof window!=='undefined'?window:globalThis);
