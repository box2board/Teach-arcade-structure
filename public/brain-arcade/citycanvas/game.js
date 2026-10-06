(()=>{'use strict';const {City,types,W,H}=CityCanvasSim,$=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');let city=new City(),tool='road',paused=false,speed=1,zoom=1,pan={x:0,y:0},size=20,hover={x:6,y:10},drag=null,lastTile='',clock=0,last=0,selected=null,history=[],stroke=null,panMode=false,pendingLoad=null,layer='none',needsFocus=true;const SAVE_KEY='teacharcade-citycanvas-v1',MANUAL_KEY=SAVE_KEY+'-manual';
for(const [key,t]of Object.entries(types)){let b=document.createElement('button');b.className='tool';b.style.setProperty('--color',t.color);b.dataset.tool=key;b.innerHTML=`<canvas class="tool-icon" width="36" height="28" aria-hidden="true"></canvas><span class="tool-label">${t.name}<small>${key==='inspect'?'View needs':key==='erase'?'Whole building':t.w+' × '+t.h+' tile'+(t.w*t.h>1?'s':'')}</small></span><small>${t.cost?'$'+t.cost:'View'}</small>`;drawBuilding(b.querySelector('canvas').getContext('2d'),{type:key,w:t.w,h:t.h,level:1,x:0,y:0},1,1,Math.min(34/t.w,26/t.h),0);b.onclick=()=>{tool=key;selected=null;panMode=false;$('pan').setAttribute('aria-pressed','false');selectTool();};$('tools').append(b);}function selectTool(){document.querySelectorAll('.tool').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));$('toolHelp').textContent=types[tool].help;}selectTool();
function stats(){for(const [id,value]of Object.entries({funds:city.mode==='free'?'Unlimited':'$'+city.funds.toLocaleString(),population:city.population,jobs:city.jobs,happiness:city.population?city.happiness+'%':'—',balance:(city.balance<0?'−$':'+$')+Math.abs(city.balance),date:'Month '+city.month}))$(id).textContent=value;const lots=city.tiles.filter(t=>['home','shop','industry'].includes(t.type));$('pulse').textContent=!lots.length?'Lay out roads and zones, then connect a solar plant and add water.':lots.some(t=>!t.access)?'Some zones need an adjacent road.':lots.some(t=>!t.powered)?'Some zones need road-connected power.':lots.some(t=>!t.watered)?'Some zones are beyond water coverage. Add a powered water tower.':city.jobs<city.population*.4?'More workplaces will help attract residents.':city.happiness<60&&city.population?'Improve neighborhoods with parks and services; separate homes from industry.':'Your city has room to grow. Expand carefully and watch your monthly balance.';management();inspect();}
function inspect(){
const t=city.anchor(city.at((selected||hover).x,(selected||hover).y));if(!t)return;
const zone=['home','shop','industry'].includes(t.type),name=types[t.type]?.name||(t.type==='river'?'River':'Open land');
const rows=[`${name} · (${t.x+1}, ${t.y+1})`];if(!['land','river','road'].includes(t.type))rows.push(`${t.w} × ${t.h} footprint · ${t.w*t.h} tile${t.w*t.h>1?'s':''}`);
if(zone){
 rows.push(t.progress?'Construction in progress · 1 month remaining':t.level===3?'Fully developed':`Development stage ${t.level}/3`);
 rows.push(`${t.access?'✓':'✕'} Road · ${t.powered?'✓':'✕'} Power · ${t.watered?'✓':'✕'} Water`);
 const reasons=city.growth(t);rows.push(...(reasons.length?reasons:t.level<3?['Ready to grow. Construction takes two months per stage.']:['This lot has reached its maximum size.']));
 if(t.type==='home'){rows.push(`Well-being ${t.wellbeing}% · ${t.level*8} residents`);rows.push(`Park ${t.park?'✓':'✕'} · School ${t.school?'✓':'✕'} · Fire coverage ${t.fire?'✓':'✕'}`);if(t.polluted)rows.push('Nearby industry reduces well-being by 22 points.');}
 else rows.push(`${t.level*(t.type==='industry'?10:6)} jobs`);
}else if(['power','water','school','fire'].includes(t.type))rows.push(t.access?(t.powered?'Road connected and powered.':'No power: connect this road network to a solar plant.'):'Needs an adjacent road.');
else if(t.type==='road')rows.push(t.powered?'Connected to a solar plant.':'Connect this road network to a solar plant.');
$('inspect').replaceChildren(...rows.map((value,i)=>{const el=document.createElement(i===0?'strong':'p');el.textContent=value;return el;}));
}
function management(){
$('readiness').replaceChildren(...city.readiness.map(row=>{const p=document.createElement('p');p.textContent=`${types[row.type].name}: ${row.ready} ready to grow · ${row.waiting} waiting`;return p;}));
if($('budgetDialog').open)showBudget();updateLegend();
}
function showBudget(){
$('budgetMode').textContent=city.mode==='free'?'Free Build: these costs are estimates; your funds are unlimited.':'City Manager: this balance is added to your funds each month.';
$('budgetRows').replaceChildren(...city.budget.filter(row=>row.count).map(row=>{const tr=document.createElement('tr');for(const value of [types[row.type].name,row.count,'$'+(row.count*row.cost).toLocaleString()]){const td=document.createElement('td');td.textContent=value;tr.append(td);}return tr;}));
$('budgetTotals').replaceChildren(...[['Tax revenue',city.income],['Operating costs',city.expenses],['Net monthly balance',city.balance]].map(([name,value])=>{const p=document.createElement('p');p.textContent=`${name}: ${value<0?'−':''}$${Math.abs(value).toLocaleString()}`;return p;}));
$('budgetAdvice').textContent=city.balance<0?'Grow connected homes and workplaces to increase revenue. Services cost money every month; add them where they help. High taxes reduce neighborhood well-being.':'Keep an eye on operating costs as you expand. Tax revenue depends on residents, jobs, and your tax rate.';
}
$('budgetOpen').onclick=()=>{showBudget();$('budgetDialog').showModal();};$('budgetClose').onclick=()=>$('budgetDialog').close();
const legends={none:'Drag to build · Shift/right-drag to pan.',power:'Power: teal = powered roads and buildings; red = buildings without power.',water:'Water: blue = within 12 tiles of a powered tower’s grounds.',park:'Parks: green = recreation coverage within six tiles.',school:'Schools: violet = education coverage within eight tiles of a powered school’s grounds.',fire:'Fire: orange = protection within eight tiles of a powered station’s grounds.',pollution:'Pollution: red = within four tiles of developed industry.',wellbeing:'Homes: green 70–100% · amber 40–69% · red below 40%.'};
function updateLegend(){$('layerLegend').textContent=legends[layer]+(layer==='power'?` Supply used: ${city.powerUsed}/${city.powerCapacity} lots.`:'');}
$('layer').onchange=e=>{layer=e.target.value;updateLegend();};
function saveCity(manual=false){try{const json=JSON.stringify(city.save());localStorage.setItem(SAVE_KEY,json);if(manual)localStorage.setItem(MANUAL_KEY,json);$('saveInfo').textContent=(manual?'Saved':'Autosaved')+' · month '+city.month;return true;}catch{$('saveInfo').textContent='Browser save unavailable. Export a file to keep your city.';return false;}}
function beginStroke(){if(!stroke)stroke={tiles:new Map(),cost:0};}
function finishStroke(){if(stroke?.tiles.size){history.push(stroke);if(history.length>40)history.shift();saveCity();}stroke=null;$('undo').disabled=!history.length;}
function undo(){finishStroke();const edit=history.pop();if(!edit)return;for(const [index,before]of edit.tiles)Object.assign(city.tiles[index],before);city.funds+=edit.cost;city.update();stats();saveCity();$('undo').disabled=!history.length;$('status').textContent='Last building action undone.';}
function restore(next){city=next;traffic=[];history=[];stroke=null;selected=null;clock=0;needsFocus=true;resize();syncControls();stats();saveCity();$('undo').disabled=true;$('status').textContent='City loaded. Continue building.';}
function syncControls(){$('mode').value=city.mode;$('tax').value=city.tax;$('taxValue').textContent=city.tax+'%';}
function offerLoad(next){pendingLoad=next;$('loadDialog').showModal();}
$('save').onclick=()=>saveCity(true);
$('load').onclick=()=>{try{const data=localStorage.getItem(MANUAL_KEY)||localStorage.getItem(SAVE_KEY);if(!data){$('saveInfo').textContent='No saved city in this browser yet.';return;}offerLoad(City.load(JSON.parse(data)));}catch{$('saveInfo').textContent='Saved city could not be loaded. Try importing an exported file.';}};
$('loadCancel').onclick=()=>{pendingLoad=null;$('loadDialog').close();};
$('loadConfirm').onclick=()=>{if(pendingLoad)restore(pendingLoad);pendingLoad=null;$('loadDialog').close();};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(city.save())],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CityCanvas-month-${city.month}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('saveInfo').textContent='City file exported.';};
$('import').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Save file is too large.');offerLoad(City.load(JSON.parse(await file.text())));}catch{$('saveInfo').textContent='Could not import this file. Choose a valid CityCanvas JSON save.';}e.target.value='';};
$('undo').onclick=undo;
$('pan').onclick=()=>{panMode=!panMode;$('pan').setAttribute('aria-pressed',String(panMode));$('status').textContent=panMode?'Drag the map to pan. Turn Pan off to build.':types[tool].help;};
try{const stored=localStorage.getItem(SAVE_KEY);if(stored){city=City.load(JSON.parse(stored));$('saveInfo').textContent='Restored saved city · month '+city.month;}}catch{$('saveInfo').textContent='Saved city unavailable. Export a file to keep your city.';}syncControls();
window.addEventListener('pagehide',()=>saveCity());
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();undo();}});
function resize(){let r=canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);size=Math.min(r.width/W,r.height/H)*zoom;if(needsFocus&&r.width&&r.height){needsFocus=false;focusCity();}else clampPan();}new ResizeObserver(resize).observe(canvas);
function origin(){let r=canvas.getBoundingClientRect();return{x:(r.width-W*size)/2+pan.x,y:(r.height-H*size)/2+pan.y};}
function focusCity(){
const r=canvas.getBoundingClientRect(),base=Math.min(r.width/W,r.height/H);if(!base)return;
zoom=Math.min(4,Math.max(1,28/base));size=base*zoom;
const built=city.tiles.filter(t=>!['land','river'].includes(t.type));let x=16,y=16;
if(built.length){x=(Math.min(...built.map(t=>t.x))+Math.max(...built.map(t=>t.x))+1)/2;y=(Math.min(...built.map(t=>t.y))+Math.max(...built.map(t=>t.y))+1)/2;}
pan={x:(W/2-x)*size,y:(H/2-y)*size};clampPan();
}
$('focus').onclick=focusCity;
function clampPan(){const r=canvas.getBoundingClientRect(),width=W*size,height=H*size;pan.x=width<=r.width?0:Math.max((r.width-width)/2,Math.min((width-r.width)/2,pan.x));pan.y=height<=r.height?0:Math.max((r.height-height)/2,Math.min((height-r.height)/2,pan.y));}
function point(e){let r=canvas.getBoundingClientRect(),o=origin();return{x:Math.floor((e.clientX-r.left-o.x)/size),y:Math.floor((e.clientY-r.top-o.y)/size)};}
function keepCursorVisible(){const r=canvas.getBoundingClientRect(),o=origin(),x=o.x+(hover.x+.5)*size,y=o.y+(hover.y+.5)*size;if(x<size)pan.x+=size-x;if(x>r.width-size)pan.x-=x-(r.width-size);if(y<size)pan.y+=size-y;if(y>r.height-size)pan.y-=y-(r.height-size);clampPan();}
function apply(){
const key=hover.x+','+hover.y;if(key===lastTile)return;lastTile=key;
if(tool==='inspect'){selected={...hover};inspect();return;}
selected=null;const tile=city.at(hover.x,hover.y);if(!tile)return;
const plan=city.plan(hover.x,hover.y,tool),before=plan.cells.map(t=>({index:t.y*W+t.x,state:city.state(t)})),funds=city.funds;
let error=city.build(hover.x,hover.y,tool);
if(!error&&before.length){beginStroke();for(const item of before)if(!stroke.tiles.has(item.index))stroke.tiles.set(item.index,item.state);stroke.cost+=funds-city.funds;}
$('status').textContent=error||`${types[tool].name} · ${city.mode==='manager'?'$'+types[tool].cost+(types[tool].w*types[tool].h>1?' per facility':' per tile'):'Free Build'} · ${types[tool].w*types[tool].h>1?'Click to place one facility.':'Drag to paint.'} Undo reverses this action.`;stats();
}
function paintLine(from,to){let x=from.x,y=from.y,dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),sx=x<to.x?1:-1,sy=y<to.y?1:-1,err=dx-dy;for(let n=0;n<W+H+100;n++){hover={x,y};apply();if(x===to.x&&y===to.y)break;const e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}}hover=to;}
canvas.addEventListener('wheel',e=>{e.preventDefault();if(drag)return;const r=canvas.getBoundingClientRect(),o=origin(),px=e.clientX-r.left,py=e.clientY-r.top,worldX=(px-o.x)/size,worldY=(py-o.y)/size;zoom=Math.max(.75,Math.min(4,zoom*(e.deltaY<0?1.12:1/1.12)));resize();pan={x:px-worldX*size-(r.width-W*size)/2,y:py-worldY*size-(r.height-H*size)/2};clampPan();},{passive:false});
canvas.oncontextmenu=e=>e.preventDefault();
canvas.onpointerdown=e=>{if(e.button!==0&&e.button!==2)return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={pan:panMode||e.button===2||e.shiftKey,x:e.clientX,y:e.clientY};hover=point(e);lastTile='';if(!drag.pan)apply();};
canvas.onpointermove=e=>{if(drag?.pan){pan.x+=e.clientX-drag.x;pan.y+=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;clampPan();}else{const next=point(e);if(drag&&types[tool].w*types[tool].h===1)paintLine(hover,next);else hover=next;inspect();}};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;lastTile='';finishStroke();};
canvas.onkeydown=e=>{const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(dir){e.preventDefault();hover.x=Math.max(0,Math.min(W-1,hover.x+dir[0]));hover.y=Math.max(0,Math.min(H-1,hover.y+dir[1]));if(tool==='inspect')selected={...hover};keepCursorVisible();inspect();}if(e.key==='Enter'||e.key===' '){e.preventDefault();lastTile='';apply();finishStroke();}};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';};$('speed').onchange=e=>speed=+e.target.value;$('mode').onchange=e=>{finishStroke();city.mode=e.target.value;stats();saveCity();};$('tax').oninput=e=>{city.tax=+e.target.value;$('taxValue').textContent=city.tax+'%';city.update();stats();saveCity();};$('new').onclick=()=>$('reset').showModal();$('cancel').onclick=()=>$('reset').close();$('confirm').onclick=()=>{city=new City($('mode').value);traffic=[];history=[];selected=null;$('undo').disabled=true;city.tax=+$('tax').value;clock=0;pan={x:0,y:0};zoom=1;needsFocus=true;resize();stats();saveCity();$('reset').close();$('status').textContent='New city ready. Start with a road network.';};$('zoomIn').onclick=()=>{zoom=Math.min(4,zoom*1.25);resize();};$('zoomOut').onclick=()=>{zoom=Math.max(.75,zoom/1.25);resize();};$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};resize();};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function drawBuilding(g,t,x,y,s,time=0){
 const w=(t.w||1)*s,h=(t.h||1)*s,type=t.type,level=t.level||0;
 const box=(a,b,c,d,color)=>{g.fillStyle=color;g.fillRect(x+a*w,y+b*h,c*w,d*h);};
 const poly=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([a,b],i)=>i?g.lineTo(x+a*w,y+b*h):g.moveTo(x+a*w,y+b*h));g.closePath();g.fill();};
 const oval=(a,b,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x+a*w,y+b*h,rx*w,ry*h,0,0,Math.PI*2);g.fill();};
 if(['road','erase','inspect'].includes(type)){
  if(type==='road'){box(.08,.34,.84,.36,'#405365');for(let i=0;i<3;i++)box(.17+i*.24,.49,.13,.04,'#eee3ba');}
  else{g.fillStyle=type==='erase'?'#eea597':'#c4d5e6';g.font=`bold ${Math.floor(h*.9)}px system-ui`;g.textAlign='center';g.fillText(type==='erase'?'×':'?',x+w*.5,y+h*.85);}return;
 }
 const zone=['home','shop','industry'].includes(type);
 if(zone&&!level){
  box(.12,.14,.76,.74,'#a0927180');g.strokeStyle=types[type].color;g.lineWidth=Math.max(1,s*.06);g.strokeRect(x+w*.18,y+h*.2,w*.64,h*.6);
  if(t.progress){box(.2,.3,.6,.07,'#ffe083');box(.2,.6,.6,.07,'#ffe083');box(.26,.15,.07,.68,'#ffe083');box(.68,.15,.07,.68,'#ffe083');}
  return;
 }
 if(type==='park'){
  box(.06,.06,.88,.88,'#387b49');box(.44,.06,.12,.88,'#d6c996');box(.06,.45,.88,.12,'#d6c996');
  oval(.24,.25,.15,.17,'#75ca65');oval(.75,.76,.17,.18,'#59ac5d');box(.62,.2,.2,.05,'#9b6d47');box(.18,.69,.2,.05,'#9b6d47');return;
 }
 box(.09,.12,.84,.8,'#304a5360');
 if(type==='home'){
  if(level===1){box(.22,.38,.57,.47,['#f2e3c7','#e2ddd1','#d4e4df'][(t.x+t.y)%3]);poly([[.13,.4],[.51,.12],[.88,.4]],'#8c5448');box(.46,.6,.16,.25,'#5b4940');box(.29,.5,.12,.14,'#80bccb');box(.65,.5,.1,.14,'#80bccb');box(.48,.86,.12,.12,'#e4d1ac');}
  else if(level===2){box(.12,.32,.77,.54,'#e8dac2');poly([[.07,.33],[.29,.13],[.52,.33]],'#855047');poly([[.47,.33],[.7,.13],[.94,.33]],'#855047');for(const a of [.22,.66]){box(a,.43,.12,.13,'#80bccb');box(a,.67,.12,.19,'#5c5148');}box(.48,.36,.025,.5,'#bba88f');}
  else{box(.17,.13,.68,.73,'#d4dedc');box(.13,.11,.76,.09,'#497777');for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(.25+col*.19,.26+row*.18,.12,.11,'#4a7c92');box(.44,.76,.15,.12,'#504f49');}
 }else if(type==='shop'){
  box(.13,.27,.76,.58,'#f3ead8');box(.11,.2,.8,.13,'#4c7194');
  if(level===3){box(.18,.07,.67,.2,'#c4d7e1');for(let col=0;col<3;col++)box(.24+col*.2,.11,.13,.09,'#4a7c92');}
  box(.2,.48,.49,.28,'#77b5ce');box(.73,.5,.1,.33,'#354e65');
  for(let col=0;col<6;col++)box(.11+col*.134,.36,.134,.13,col%2?'#e9efde':'#e66f5c');box(.14,.81,.74,.05,'#d1b78c');
 }else if(type==='industry'){
  box(.1,.38,.8,.47,'#d5c29a');poly([[.1,.38],[.1,.24],[.34,.38],[.34,.24],[.58,.38],[.58,.24],[.8,.38]],'#8b7867');
  box(.79,.12,.11,.59,'#786353');box(.77,.1,.15,.07,'#535b5e');box(.21,.58,.24,.25,'#4b535c');box(.53,.57,.25,.12,'#879db1');
  if(level>1)box(.62,.19,.08,.26,'#8e7767');
  for(let i=0;i<2;i++){const drift=(time/2300+i*.45)%1;oval(.85+drift*.07,.12-drift*.15,.045+drift*.03,.055,'#dce4df80');}
 }else if(type==='power'){
  box(.04,.07,.92,.86,'#c5c5a5');box(.77,.17,.17,.43,'#deded3');box(.75,.14,.21,.1,'#677487');
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
   const a=.09+col*.16,b=.15+row*.22;box(a+.01,b+.03,.135,.16,'#4d526480');box(a,b,.135,.16,'#284978');box(a+.015,b+.025,.105,.025,'#7db5de');box(a+.063,b,.008,.16,'#6993b9');
  }poly([[.85,.25],[.8,.38],[.86,.38],[.81,.5],[.9,.35],[.85,.35]],'#e5c555');box(.06,.85,.86,.05,'#657565');
 }else if(type==='water'){
  box(.07,.1,.86,.8,'#bbc7b2');box(.68,.66,.21,.22,'#dce0d1');box(.66,.62,.25,.07,'#5a7890');
  for(const a of [.24,.65])box(a,.39,.055,.44,'#697f88');poly([[.25,.5],[.71,.77],[.71,.71],[.25,.44]],'#8b9c9f');poly([[.25,.77],[.71,.5],[.71,.44],[.25,.71]],'#8b9c9f');
  box(.17,.22,.62,.23,'#cfeced');oval(.48,.45,.31,.09,'#84b6c6');oval(.48,.22,.31,.12,'#d6f0ed');oval(.48,.21,.21,.06,'#91cbd8');
 }else if(type==='school'){
  box(.03,.08,.94,.84,'#a8be97');box(.09,.16,.8,.45,'#dcc7a7');box(.07,.12,.84,.1,'#7b5660');box(.42,.15,.18,.49,'#e9ddc4');
  for(const a of [.15,.26,.66,.77])box(a,.32,.075,.14,'#79aabf');box(.46,.47,.1,.18,'#5e6671');box(.46,.64,.1,.31,'#ddd4b7');
  box(.64,.66,.25,.22,'#739abc');g.strokeStyle='#f3e7c6';g.lineWidth=Math.max(1,s*.035);g.strokeRect(x+w*.67,y+h*.69,w*.19,h*.16);
  box(.13,.72,.2,.05,'#deba50');box(.16,.68,.025,.2,'#84959c');box(.27,.68,.025,.2,'#84959c');box(.94,.19,.015,.39,'#e3e9e1');poly([[.955,.2],[1,.24],[.955,.29]],'#e26f65');
 }else if(type==='fire'){
  box(.05,.07,.9,.87,'#c8c5ad');box(.12,.18,.76,.51,'#dbcec0');box(.09,.11,.82,.13,'#a24e46');
  for(const a of [.18,.56]){box(a,.31,.27,.36,'#354854');box(a+.04,.5,.19,.22,'#d85349');box(a+.06,.52,.15,.07,'#c1e5e4');box(a+.03,.49,.21,.035,'#f7d67c');}
  box(.11,.74,.79,.16,'#7d8a8c');box(.46,.23,.075,.06,'#f5db9d');
 }
 if(zone&&t.progress){g.strokeStyle='#ffe083';g.lineWidth=Math.max(1,s*.045);g.strokeRect(x+w*.08,y+h*.08,w*.84,h*.84);for(const a of [.16,.81])box(a,.04,.035,.92,'#ffe083');}
}
function render(time){
 const r=canvas.getBoundingClientRect(),o=origin();ctx.clearRect(0,0,r.width,r.height);rect(0,0,r.width,r.height,'#294b3d');
 // Terrain first: follower tiles must not paint over a large building's artwork.
 for(const t of city.tiles){
  const x=o.x+t.x*size,y=o.y+t.y*size,s=size;if(x+s<0||y+s<0||x>r.width||y>r.height)continue;
  rect(x,y,s,s,t.type==='river'?'#438daf':(t.x*7+t.y*11)%5===0?'#76ae70':'#7db477');ctx.strokeStyle='#ffffff12';ctx.strokeRect(x,y,s,s);
  if(t.type==='land'&&(t.x*13+t.y*7)%19===0){rect(x+s*.47,y+s*.57,s*.08,s*.19,'#665b44');ctx.fillStyle='#467b48';ctx.beginPath();ctx.arc(x+s*.5,y+s*.4,s*.2,0,7);ctx.fill();}
  if(t.type==='river')rect(x+s*.2,y+s*.5,s*.45,s*.06,'#80c6d5');
 }
 for(const t of city.anchors()){
  if(['land','river'].includes(t.type))continue;
  const x=o.x+t.x*size,y=o.y+t.y*size,s=size;
  if(x+t.w*s<0||y+t.h*s<0||x>r.width||y>r.height)continue;
  if(t.type==='road'){
   rect(x+s*.28,y+s*.28,s*.44,s*.44,'#405365');for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(city.at(t.x+dx,t.y+dy)?.type==='road'){
    rect(x+s*(dx<0?0:.28),y+s*(dy<0?0:.28),s*(dx?.72:.44),s*(dy?.72:.44),'#405365');rect(x+s*(dx<0?.08:dx>0?.76:.48),y+s*(dy<0?.08:dy>0?.76:.48),s*(dx?.16:.04),s*(dy?.16:.04),'#e3d7a0');
   }
  }else drawBuilding(ctx,t,x,y,s,time);
  if(['home','shop','industry'].includes(t.type)&&(!t.access||!t.powered||!t.watered)){ctx.fillStyle=!t.powered?'#ffe37d':'#ecf7ff';ctx.beginPath();ctx.arc(x+s*.86,y+s*.12,s*.095,0,7);ctx.fill();}
 }
 renderOverlay(o,r);renderCoveragePreview(o);renderTraffic(o,time);
 const tile=city.at((selected||hover).x,(selected||hover).y);if(!tile)return;
 const def=types[tool],existing=tool==='inspect'||tool==='erase',a=existing?city.anchor(tile):tile,w=existing?a.w:def.w,h=existing?a.h:def.h,plan=city.plan(tile.x,tile.y,tool),valid=!plan.error&&(city.mode==='free'||tool==='inspect'||city.funds>=def.cost);
 const x=o.x+a.x*size,y=o.y+a.y*size;
 if(!existing&&!panMode){rect(x,y,w*size,h*size,valid?'#4ee4b43d':'#ff606060');if(valid&&tile.type==='land'){ctx.save();ctx.globalAlpha=.5;drawBuilding(ctx,{...tile,w,h,type:tool,level:1},x,y,size,time);ctx.restore();}}
 if(!panMode){ctx.strokeStyle=valid?'#fff':'#ff7777';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w*size-2,h*size-2);ctx.lineWidth=1;}
}
function renderOverlay(o,r){
if(layer==='none')return;
for(const t of city.tiles){if(t.type==='river')continue;const x=o.x+t.x*size,y=o.y+t.y*size;if(x+size<0||y+size<0||x>r.width||y>r.height)continue;
let color=null;
if(layer==='power'){if(t.powered)color='#39e0b070';else if(!['land','river','park'].includes(t.type))color='#ff66668c';}
else if(layer==='water'&&t.watered)color='#28bef778';
else if(layer==='park'&&t.park)color='#73e95670';
else if(layer==='school'&&t.school)color='#b689ff78';
else if(layer==='fire'&&t.fire)color='#ffad5978';
else if(layer==='pollution'&&t.polluted)color='#ff66668c';
else if(layer==='wellbeing'&&t.type==='home')color=t.wellbeing>=70?'#39e0b08c':t.wellbeing>=40?'#ffce538c':'#ff66669c';
if(color)rect(x,y,size,size,color);
}
}
function renderCoveragePreview(o){
 const radius={water:12,park:6,school:8,fire:8}[tool],t=city.at(hover.x,hover.y),def=types[tool];if(!radius||panMode||!t||t.type!=='land')return;
 const x=o.x+(t.x+.5)*size,y=o.y+(t.y+.5)*size,right=x+(def.w-1)*size,bottom=y+(def.h-1)*size,r=radius*size;
 ctx.save();ctx.strokeStyle=def.color;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(right,y-r);ctx.lineTo(right+r,y);ctx.lineTo(right+r,bottom);ctx.lineTo(right,bottom+r);ctx.lineTo(x,bottom+r);ctx.lineTo(x-r,bottom);ctx.lineTo(x-r,y);ctx.closePath();ctx.stroke();ctx.restore();
}
let traffic=[],trafficStamp=0;
function renderTraffic(o,time){
if(time-trafficStamp>1400){trafficStamp=time;const roads=city.tiles.filter(t=>t.type==='road'&&city.neighbors(t).some(n=>n.type==='road'));traffic=traffic.filter(car=>city.at(car.x,car.y)?.type==='road');if(roads.length&&traffic.length<Math.min(32,Math.ceil(city.population/8))){const start=roads[Math.floor(Math.random()*roads.length)];traffic.push({x:start.x,y:start.y,next:null,p:0,color:['#ffe08b','#ef8a91','#d7f1fa'][traffic.length%3]});}}
for(const car of traffic){if(!car.next){const options=city.neighbors(city.at(car.x,car.y)).filter(n=>n.type==='road');if(!options.length)continue;car.next=options[Math.floor(Math.random()*options.length)];car.p=0;}
if(city.at(car.next.x,car.next.y)?.type!=='road'){car.next=null;continue;}
if(!paused&&!drag&&!$('reset').open&&!$('loadDialog').open&&!$('budgetDialog').open)car.p+=frameDelta/1100;
if(car.p>=1){car.x=car.next.x;car.y=car.next.y;car.next=null;continue;}
const dx=car.next.x-car.x,dy=car.next.y-car.y,x=o.x+(car.x+.5+dx*car.p)*size,y=o.y+(car.y+.5+dy*car.p)*size;rect(x-size*(dx?.12:.07),y-size*(dy?.12:.07),size*(dx?.24:.14),size*(dy?.24:.14),car.color);}
}
let frameDelta=0;
function loop(t){let dt=last?Math.min(250,t-last):0;last=t;frameDelta=dt;if(!paused&&!drag&&!$('reset').open&&!$('loadDialog').open&&!$('budgetDialog').open){clock+=dt*speed;if(clock>=3500){clock=0;city.step();stats();saveCity();}}render(t);requestAnimationFrame(loop);}stats();requestAnimationFrame(loop);
})();
