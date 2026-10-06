(()=>{'use strict';const {City,types,W,H}=CityCanvasSim,$=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');let city=new City(),tool='road',paused=false,speed=1,zoom=1,pan={x:0,y:0},size=20,hover={x:6,y:10},drag=null,lastTile='',clock=0,last=0,selected=null,history=[],stroke=null,panMode=false,pendingLoad=null,layer='none',needsFocus=true;const SAVE_KEY='teacharcade-citycanvas-v1',MANUAL_KEY=SAVE_KEY+'-manual';
for(const [key,t]of Object.entries(types)){let b=document.createElement('button');b.className='tool';b.style.setProperty('--color',t.color);b.dataset.tool=key;b.innerHTML=`<span>${t.name}</span><small>${t.cost?'$'+t.cost:'View'}</small>`;b.onclick=()=>{tool=key;panMode=false;$('pan').setAttribute('aria-pressed','false');selectTool();};$('tools').append(b);}function selectTool(){document.querySelectorAll('.tool').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));$('toolHelp').textContent=types[tool].help;}selectTool();
function stats(){for(const [id,value]of Object.entries({funds:city.mode==='free'?'Unlimited':'$'+city.funds.toLocaleString(),population:city.population,jobs:city.jobs,happiness:city.population?city.happiness+'%':'—',balance:(city.balance<0?'−$':'+$')+Math.abs(city.balance),date:'Month '+city.month}))$(id).textContent=value;const lots=city.tiles.filter(t=>['home','shop','industry'].includes(t.type));$('pulse').textContent=!lots.length?'Lay out roads and zones, then connect solar power and add water.':lots.some(t=>!t.access)?'Some zones need an adjacent road.':lots.some(t=>!t.powered)?'Some zones need road-connected power.':lots.some(t=>!t.watered)?'Some zones are beyond water coverage. Add a powered water tower.':city.jobs<city.population*.4?'More workplaces will help attract residents.':city.happiness<60&&city.population?'Improve neighborhoods with parks and services; separate homes from industry.':'Your city has room to grow. Expand carefully and watch your monthly balance.';management();inspect();}
function inspect(){
const t=city.at((selected||hover).x,(selected||hover).y);if(!t)return;
const zone=['home','shop','industry'].includes(t.type),name=types[t.type]?.name||(t.type==='river'?'River':'Open land');
const rows=[`${name} · (${t.x+1}, ${t.y+1})`];
if(zone){
 rows.push(t.progress?'Construction in progress · 1 month remaining':t.level===3?'Fully developed':`Development stage ${t.level}/3`);
 rows.push(`${t.access?'✓':'✕'} Road · ${t.powered?'✓':'✕'} Power · ${t.watered?'✓':'✕'} Water`);
 const reasons=city.growth(t);rows.push(...(reasons.length?reasons:t.level<3?['Ready to grow. Construction takes two months per stage.']:['This lot has reached its maximum size.']));
 if(t.type==='home'){rows.push(`Well-being ${t.wellbeing}% · ${t.level*8} residents`);rows.push(`Park ${t.park?'✓':'✕'} · School ${t.school?'✓':'✕'} · Fire coverage ${t.fire?'✓':'✕'}`);if(t.polluted)rows.push('Nearby industry reduces well-being by 22 points.');}
 else rows.push(`${t.level*(t.type==='industry'?10:6)} jobs`);
}else if(['power','water','school','fire'].includes(t.type))rows.push(t.access?(t.powered?'Road connected and powered.':'No power: connect this road network to a solar station.'):'Needs an adjacent road.');
else if(t.type==='road')rows.push(t.powered?'Connected to solar power.':'Connect this road network to a solar station.');
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
const legends={none:'Drag to build · Shift/right-drag to pan.',power:'Power: teal = powered roads and buildings; red = buildings without power.',water:'Water: blue = within 12 tiles of a powered water tower.',park:'Parks: green = recreation coverage within six tiles.',school:'Schools: violet = education coverage within eight tiles of a powered school.',fire:'Fire: orange = protection within eight tiles of a powered fire station.',pollution:'Pollution: red = within four tiles of developed industry.',wellbeing:'Homes: green 70–100% · amber 40–69% · red below 40%.'};
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
const before={type:tile.type,level:tile.level,progress:tile.progress||0},funds=city.funds;
let error=city.build(hover.x,hover.y,tool);
if(!error&&tile.type!==before.type){beginStroke();const index=hover.y*W+hover.x;if(!stroke.tiles.has(index))stroke.tiles.set(index,before);stroke.cost+=funds-city.funds;}
$('status').textContent=error||`${types[tool].name} · ${city.mode==='manager'?'$'+types[tool].cost+' per tile':'Free Build'} · Drag to paint. Undo reverses this action.`;stats();
}
function paintLine(from,to){let x=from.x,y=from.y,dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),sx=x<to.x?1:-1,sy=y<to.y?1:-1,err=dx-dy;for(let n=0;n<W+H+100;n++){hover={x,y};apply();if(x===to.x&&y===to.y)break;const e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}}hover=to;}
canvas.addEventListener('wheel',e=>{e.preventDefault();if(drag)return;const r=canvas.getBoundingClientRect(),o=origin(),px=e.clientX-r.left,py=e.clientY-r.top,worldX=(px-o.x)/size,worldY=(py-o.y)/size;zoom=Math.max(.75,Math.min(4,zoom*(e.deltaY<0?1.12:1/1.12)));resize();pan={x:px-worldX*size-(r.width-W*size)/2,y:py-worldY*size-(r.height-H*size)/2};clampPan();},{passive:false});
canvas.oncontextmenu=e=>e.preventDefault();
canvas.onpointerdown=e=>{if(e.button!==0&&e.button!==2)return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={pan:panMode||e.button===2||e.shiftKey,x:e.clientX,y:e.clientY};hover=point(e);lastTile='';if(!drag.pan)apply();};
canvas.onpointermove=e=>{if(drag?.pan){pan.x+=e.clientX-drag.x;pan.y+=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;clampPan();}else{const next=point(e);if(drag)paintLine(hover,next);else hover=next;inspect();}};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;lastTile='';finishStroke();};
canvas.onkeydown=e=>{const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(dir){e.preventDefault();hover.x=Math.max(0,Math.min(W-1,hover.x+dir[0]));hover.y=Math.max(0,Math.min(H-1,hover.y+dir[1]));if(tool==='inspect')selected={...hover};keepCursorVisible();inspect();}if(e.key==='Enter'||e.key===' '){e.preventDefault();lastTile='';apply();finishStroke();}};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';};$('speed').onchange=e=>speed=+e.target.value;$('mode').onchange=e=>{finishStroke();city.mode=e.target.value;stats();saveCity();};$('tax').oninput=e=>{city.tax=+e.target.value;$('taxValue').textContent=city.tax+'%';city.update();stats();saveCity();};$('new').onclick=()=>$('reset').showModal();$('cancel').onclick=()=>$('reset').close();$('confirm').onclick=()=>{city=new City($('mode').value);traffic=[];history=[];selected=null;$('undo').disabled=true;city.tax=+$('tax').value;clock=0;pan={x:0,y:0};zoom=1;needsFocus=true;resize();stats();saveCity();$('reset').close();$('status').textContent='New city ready. Start with a road network.';};$('zoomIn').onclick=()=>{zoom=Math.min(4,zoom*1.25);resize();};$('zoomOut').onclick=()=>{zoom=Math.max(.75,zoom/1.25);resize();};$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};resize();};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}function render(time){const r=canvas.getBoundingClientRect(),o=origin();ctx.clearRect(0,0,r.width,r.height);rect(0,0,r.width,r.height,'#294b3d');for(const t of city.tiles){const x=o.x+t.x*size,y=o.y+t.y*size,s=size;if(x+s<0||y+s<0||x>r.width||y>r.height)continue;rect(x,y,s,s,t.type==='river'?'#438daf':(t.x*7+t.y*11)%5===0?'#76ae70':'#7db477');ctx.strokeStyle='#ffffff12';ctx.strokeRect(x,y,s,s);if(t.type==='land'){if((t.x*13+t.y*7)%19===0){rect(x+s*.35,y+s*.25,s*.32,s*.4,'#467b48');rect(x+s*.47,y+s*.62,s*.08,s*.13,'#665b44');}continue;}if(t.type==='river'){rect(x+s*.2,y+s*.5,s*.45,s*.06,'#80c6d5');continue;}if(t.type==='road'){rect(x+s*.28,y+s*.28,s*.44,s*.44,'#405365');for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(city.at(t.x+dx,t.y+dy)?.type==='road'){rect(x+s*(dx<0?0:.28),y+s*(dy<0?0:.28),s*(dx?.72:.44),s*(dy?.72:.44),'#405365');rect(x+s*(dx<0?.08:dx>0?.76:.48),y+s*(dy<0?.08:dy>0?.76:.48),s*(dx?.16:.04),s*(dy?.16:.04),'#e3d7a0');}continue;}let color=types[t.type].color;rect(x+s*.1,y+s*.1,s*.8,s*.8,color+'88');if(['home','shop','industry'].includes(t.type)&&!t.level){ctx.strokeStyle=color;ctx.strokeRect(x+s*.2,y+s*.2,s*.6,s*.6);if(t.progress){rect(x+s*.2,y+s*.4,s*.6,s*.08,'#f7d777');rect(x+s*.2,y+s*.65,s*.6,s*.08,'#f7d777');rect(x+s*.28,y+s*.15,s*.06,s*.7,'#f7d777');rect(x+s*.67,y+s*.15,s*.06,s*.7,'#f7d777');}continue;}if(t.type==='park'){rect(x+s*.2,y+s*.2,s*.6,s*.6,'#358452');rect(x+s*.47,y+s*.15,s*.1,s*.7,'#d9cfa0');rect(x+s*.15,y+s*.48,s*.7,s*.1,'#d9cfa0');}else if(t.type==='power'){rect(x+s*.16,y+s*.2,s*.68,s*.58,'#3e4a8c');ctx.strokeStyle='#7fcdea';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+s*(.16+i*.17),y+s*.2);ctx.lineTo(x+s*(.16+i*.17),y+s*.78);ctx.stroke();}}else if(t.type==='water'){ctx.fillStyle='#c2ecf0';ctx.beginPath();ctx.arc(x+s*.5,y+s*.45,s*.28,0,Math.PI*2);ctx.fill();rect(x+s*.34,y+s*.66,s*.08,s*.2,'#476d81');rect(x+s*.6,y+s*.66,s*.08,s*.2,'#476d81');}else{let inset=.22-(t.level||1)*.02;rect(x+s*inset+s*.04,y+s*inset+s*.06,s*(1-2*inset),s*(1-2*inset),'#304a5388');rect(x+s*inset,y+s*inset,s*(1-2*inset),s*(1-2*inset),t.type==='home'?['#f1ead2','#e6d9c1','#d6e7e2'][(t.x+t.y)%3]:t.type==='industry'?'#cbbf9d':'#e1e9ed');rect(x+s*inset,y+s*inset,s*(1-2*inset),s*.15,color);for(let a=0;a<(t.level||1)+1;a++)rect(x+s*(inset+.09+a*.13),y+s*.5,s*.08,s*.15,'#416275');if(!['home','shop','industry'].includes(t.type)){ctx.fillStyle='#223a50';ctx.font=`bold ${Math.max(8,s*.4)}px system-ui`;ctx.textAlign='center';ctx.fillText(t.type==='school'?'S':'F',x+s*.5,y+s*.72);}}
if(['home','shop','industry'].includes(t.type)&&t.progress){ctx.strokeStyle='#f7d777';ctx.lineWidth=Math.max(1,s*.045);ctx.strokeRect(x+s*.12,y+s*.12,s*.76,s*.76);for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+s*.12,y+s*(.12+i*.19));ctx.lineTo(x+s*.88,y+s*(.12+i*.19));ctx.stroke();}rect(x+s*.12,y+s*.9,s*.38,s*.04,'#f7d777');ctx.lineWidth=1;}
if(['home','shop','industry'].includes(t.type)&&(!t.access||!t.powered||!t.watered)){ctx.fillStyle=!t.powered?'#ffe37d':'#ecf7ff';ctx.beginPath();ctx.arc(x+s*.8,y+s*.18,s*.12,0,7);ctx.fill();}}
renderOverlay(o,r);renderCoveragePreview(o);renderTraffic(o,time);
const focus=selected||hover,tile=city.at(focus.x,focus.y);if(tile){const def=types[tool],valid=tool==='inspect'||tool==='erase'&&tile.type!=='river'||tile.type==='land'&&(city.mode==='free'||city.funds>=def.cost);const x=o.x+focus.x*size,y=o.y+focus.y*size;if(tool!=='inspect'&&!panMode){rect(x,y,size,size,valid?def.color+'80':'#ff606080');}ctx.strokeStyle=valid?'#ffffff':'#ff7777';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,size-2,size-2);ctx.lineWidth=1;}
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
const radius={water:12,park:6,school:8,fire:8}[tool],t=city.at(hover.x,hover.y);if(!radius||panMode||!t||t.type!=='land')return;
ctx.save();ctx.strokeStyle=types[tool].color;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();const cx=o.x+(t.x+.5)*size,cy=o.y+(t.y+.5)*size;ctx.moveTo(cx,cy-radius*size);ctx.lineTo(cx+radius*size,cy);ctx.lineTo(cx,cy+radius*size);ctx.lineTo(cx-radius*size,cy);ctx.closePath();ctx.stroke();ctx.restore();
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
