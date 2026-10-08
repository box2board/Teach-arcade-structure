(()=>{'use strict';const {City,types,W,H,isRoad,terrainAt,milestones,unlockAt}=CityCanvasSim,$=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');let city=new City(),tool='road',rotated=false,paused=false,speed=1,zoom=1,pan={x:0,y:0},size=20,hover={x:6,y:10},drag=null,lastTile='',clock=0,last=0,selected=null,history=[],stroke=null,panMode=false,cursorMode=false,cursorPreviousTool='road',pendingLoad=null,layer='none',needsFocus=true,shownRank=null;const activity=new CityCanvasActivity();let visualTime=0,animated=!matchMedia('(prefers-reduced-motion: reduce)').matches;const SAVE_KEY='teacharcade-citycanvas-v1',MANUAL_KEY=SAVE_KEY+'-manual';
for(const [key,t]of Object.entries(types)){let b=document.createElement('button');b.className='tool';b.style.setProperty('--color',t.color);b.dataset.tool=key;b.innerHTML=`<canvas class="tool-icon" width="36" height="28" aria-hidden="true"></canvas><span class="tool-label">${t.name}<small>${key==='inspect'?'View needs':key==='erase'?'Whole building':t.w+' × '+t.h+' tile'+(t.w*t.h>1?'s':'')}</small></span><small>${t.cost?'$'+t.cost:'View'}</small>`;drawBuilding(b.querySelector('canvas').getContext('2d'),{type:key,w:t.w,h:t.h,level:1,x:0,y:0},1,1,Math.min(34/t.w,26/t.h),0);b.onclick=()=>{cursorMode=false;$('cursor').setAttribute('aria-pressed','false');canvas.classList.remove('cursor-mode');if(key==='inspect')showCityDetails();tool=key;rotated=false;selected=null;panMode=false;$('pan').setAttribute('aria-pressed','false');selectTool();};$('tools').append(b);}function dims(){const d=types[tool];return {w:rotated?d.h:d.w,h:rotated?d.w:d.h};}function rotate(){if(types[tool].w!==types[tool].h){finishStroke();rotated=!rotated;lastTile='';selectTool();}}$('rotate').onclick=rotate;document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();rotate();}});function selectTool(){canvas.classList.toggle('cursor-mode',cursorMode);$('cursor').setAttribute('aria-pressed',String(cursorMode));document.querySelectorAll('.tool').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));const d=dims();$('toolHelp').textContent=cursorMode?'Cursor: click a building to inspect it; drag anywhere on the map to move the view.':(!city.unlocked(tool)?city.unlockMessage(tool)+' ':'')+types[tool].help+(d.w!==d.h?' Current footprint: '+d.w+' × '+d.h+'. Press R to rotate.':'');$('rotate').disabled=d.w===d.h;$('rotate').textContent='Rotate'+(d.w!==d.h?' · '+d.w+'×'+d.h:'');}selectTool();
function stats(){sceneRevision++;playProgress();for(const [id,value]of Object.entries({funds:city.mode==='free'?'Unlimited':'$'+city.funds.toLocaleString(),population:city.population,jobs:city.jobs,happiness:city.population?city.happiness+'%':'—',balance:(city.balance<0?'−$':'+$')+Math.abs(city.balance),date:'Month '+city.month}))$(id).textContent=value;const lots=city.tiles.filter(t=>['home','shop','industry'].includes(t.type));$('pulse').textContent=!lots.length?'Lay out roads and zones, then connect a solar plant and add water.':lots.some(t=>!t.access)?'Some zones need an adjacent road.':lots.some(t=>!t.powered)?'Some zones need road-connected power.':lots.some(t=>!t.watered)?'Some zones are beyond water coverage. Add a powered water tower.':city.jobs<city.population*.4?'More workplaces will help attract residents.':city.happiness<60&&city.population?'Improve neighborhoods with parks and services; separate homes from industry.':'Your city has room to grow. Expand carefully and watch your monthly balance.';management();inspect();}
function inspect(){
const t=city.anchor(city.at((selected||hover).x,(selected||hover).y));if(!t)return;
const zone=['home','shop','industry'].includes(t.type),name=types[t.type]?.name||(t.type==='river'?'River':'Open land');
const rows=[`${name} · (${t.x+1}, ${t.y+1})`];if(!['land','river','road'].includes(t.type))rows.push(`${t.w} × ${t.h} footprint · ${t.w*t.h} tile${t.w*t.h>1?'s':''}`);
if(zone){
 const stages={home:['Vacant home frame','House','Townhouses','Apartments'],shop:['Vacant storefront','Local shop','Shopping row','Business center'],industry:['Vacant workshop','Workshop','Factory','Industrial complex']};
 rows.push(`${stages[t.type][t.level]} · stage ${t.level}/3`);
 if(t.progress)rows.push(`Growing into ${stages[t.type][t.level+1].toLowerCase()} · 1 month remaining`);
 rows.push(`${t.access?'✓':'✕'} Road · ${t.powered?'✓':'✕'} Power · ${t.watered?'✓':'✕'} Water`);
 const reasons=city.growth(t);rows.push(...(reasons.length?reasons:t.level<3?['Ready to grow. Construction takes two months per stage.']:['This lot has reached its maximum size.']));
 if(t.type==='home'){rows.push(`Well-being ${t.wellbeing}% · ${t.level*8} residents`);rows.push(`Park ${t.park?'✓':'✕'} · School ${t.school?'✓':'✕'} · Fire coverage ${t.fire?'✓':'✕'}`);rows.push(`Healthcare ${t.health?'✓':'✕'} · Library ${t.library?'✓':'✕'}`);if(t.polluted)rows.push('Nearby industry reduces well-being by 22 points.');}
 else rows.push(`${t.level*(t.type==='industry'?10:6)} jobs`);
}else if(['power','water','school','fire','hospital','library'].includes(t.type))rows.push(t.access?(t.powered?'Road connected and powered.':'No power: connect this road network to a solar plant.'):'Needs an adjacent road.');
else if(types[t.type]?.recreation)rows.push(t.access?`Recreation active within ${types[t.type].recreation} tiles · ${t.type==='sports'?8:6}/month`:'Needs an adjacent road to provide recreation.');
else if(isRoad(t))rows.push(t.powered?'Connected to a solar plant.':'Connect this road network to a solar plant.');
$('inspect').replaceChildren(...rows.map((value,i)=>{const el=document.createElement(i===0?'strong':'p');el.textContent=value;return el;}));
}
function management(){
$('readiness').replaceChildren(...city.readiness.map(row=>{const p=document.createElement('p');p.textContent=`${types[row.type].name}: ${row.ready} ready to grow · ${row.waiting} waiting`;return p;}));
if($('budgetDialog').open)showBudget();updateLegend();updateGoals();
 const next=city.neighborhoodProgress.find(g=>!g.earned);
 $('neighborhoodCard').hidden=city.mode!=='manager';
 $('neighborhoodTitle').textContent=next?next.title:'Neighborhood goals complete!';
 $('neighborhoodDetail').textContent=next?`${next.count}/${next.target} qualifying buildings · $${next.reward.toLocaleString()} reward`:'All three rewards earned. Keep growing your city.';
 $('neighborhoodProgress').max=next?.target||3;$('neighborhoodProgress').value=next?.count||(!next?3:0);
}
function updateGoals(){
 const next=city.nextMilestone,rank=city.milestone;
 $('cityRank').textContent=rank.name;
 $('milestoneProgress').max=next?.population||640;$('milestoneProgress').value=city.peakPopulation;
 $('milestoneGoal').textContent=next?`${city.population} residents · Best ${city.peakPopulation} / ${next.population}`:`All milestones reached · ${city.population} residents`;
 $('milestoneUnlock').textContent=city.mode==='free'?(next?'Next: '+next.name+' · All buildings available':'All buildings available'):next?(next.unlocks.length?'Next: '+next.unlocks.map(t=>types[t].name).join(' + '):'Next: Thriving city badge'):'Keep building your city.';
 if(shownRank!==null&&rank.population>shownRank){$('milestoneNotice').hidden=false;$('milestoneNotice').textContent=`★ ${rank.name} reached! `+(rank.unlocks.length?'Unlocked: '+rank.unlocks.map(t=>types[t].name).join(' + '):'Your city is thriving.');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('milestoneNotice').hidden=true,6500);}
 shownRank=rank.population;
 for(const b of document.querySelectorAll('.tool')){const locked=!city.unlocked(b.dataset.tool);b.classList.toggle('locked',locked);b.title=locked?city.unlockMessage(b.dataset.tool):types[b.dataset.tool].name;const label=b.querySelector('.tool-label small');const t=types[b.dataset.tool];label.textContent=locked?(t.goal?'🔒 Neighborhood goal':`🔒 ${unlockAt(b.dataset.tool)} residents`):b.dataset.tool==='inspect'?'View needs':b.dataset.tool==='erase'?'Whole building':t.w+' × '+t.h+' tile'+(t.w*t.h>1?'s':'');}
 const signature=JSON.stringify(city.requests);
 if(signature!==requestSignature){requestSignature=signature;$('citizenRequests').replaceChildren(...city.requests.map(request=>{const card=document.createElement('div');card.className='citizen-card';const strong=document.createElement('strong');strong.textContent='“'+request.title+'”';const text=document.createElement('p');text.textContent=request.detail;card.append(strong,text);if(request.target){const b=document.createElement('button');b.textContent='Show me';b.onclick=()=>{cursorMode=true;showCityDetails();tool='inspect';rotated=false;panMode=false;$('pan').setAttribute('aria-pressed','false');selected={...request.target};hover={...request.target};selectTool();layer=request.layer;$('layer').value=layer;const r=canvas.getBoundingClientRect();pan={x:(W/2-request.target.x-.5)*size,y:(H/2-request.target.y-.5)*size};clampPan();inspect();updateLegend();canvas.focus();};card.append(b);}return card;}));}
 if($('goalsDialog').open)showGoals();
}
let noticeTimer,requestSignature='';
function showGoals(){$('goalList').replaceChildren(...milestones.map(m=>{const li=document.createElement('li');li.className=city.peakPopulation>=m.population?'earned':'';li.textContent=`${city.peakPopulation>=m.population?'✓':'○'} ${m.name} · ${m.population} residents`+(m.unlocks.length?' · '+m.unlocks.map(t=>types[t].name).join(' + '):m.population===640?' · Thriving city badge':'');return li;}));
 $('neighborhoodRules').textContent=city.mode==='manager'?'Rewards are paid automatically at month-end, once per goal. Earned goals stay completed, even if neighborhoods later change.':'Optional in Free Build: no rewards or restrictions. Switch to City Manager to earn cash rewards at month-end.';
 $('neighborhoodList').replaceChildren(...city.neighborhoodProgress.map(goal=>{const li=document.createElement('li');li.className=goal.earned?'earned':'';const title=document.createElement('strong');title.textContent=(goal.earned?'✓ ':'○ ')+goal.title;const detail=document.createElement('p');detail.textContent=goal.detail;const progress=document.createElement('p');progress.textContent=goal.earned?`Completed · $${goal.reward.toLocaleString()} reward earned`:`${goal.count}/${goal.target} qualifying buildings · $${goal.reward.toLocaleString()} reward`;const unlock=document.createElement('p');const landmark=Object.values(types).find(t=>t.goal===goal.id);unlock.textContent=(goal.earned?'Unlocked: ':'Unlocks: ')+landmark.name;li.append(title,detail,progress,unlock);return li;}));
}
$('neighborhoodOpen').onclick=()=>{showGoals();$('goalsDialog').showModal();};
$('goalsOpen').onclick=()=>{showGoals();$('goalsDialog').showModal();};$('goalsClose').onclick=()=>$('goalsDialog').close();
function showBudget(){
$('budgetMode').textContent=city.mode==='free'?'Free Build: these costs are estimates; your funds are unlimited.':'City Manager: this balance is added to your funds each month.';
$('budgetRows').replaceChildren(...city.budget.filter(row=>row.count).map(row=>{const tr=document.createElement('tr');for(const value of [types[row.type].name,row.count,'$'+(row.count*row.cost).toLocaleString()]){const td=document.createElement('td');td.textContent=value;tr.append(td);}return tr;}));
$('budgetTotals').replaceChildren(...[['Tax revenue',city.income],['Operating costs',city.expenses],['Net monthly balance',city.balance]].map(([name,value])=>{const p=document.createElement('p');p.textContent=`${name}: ${value<0?'−':''}$${Math.abs(value).toLocaleString()}`;return p;}));
$('budgetAdvice').textContent=city.balance<0?'Grow connected homes and workplaces to increase revenue. Services cost money every month; add them where they help. High taxes reduce neighborhood well-being.':'Keep an eye on operating costs as you expand. Tax revenue depends on residents, jobs, and your tax rate.';
}
$('budgetOpen').onclick=()=>{showBudget();$('budgetDialog').showModal();};$('budgetClose').onclick=()=>$('budgetDialog').close();
const legends={none:'Drag to build · Shift/right-drag to pan.',power:'Power: teal = powered roads and buildings; red = buildings without power.',water:'Water: blue = within 12 tiles of a powered tower’s grounds.',park:'Recreation: green = park coverage (6 tiles), connected town squares (8), sports fields (10), or promenades (6).',school:'Schools: violet = education coverage within eight tiles of a powered school’s grounds.',fire:'Fire: orange = protection within eight tiles of a powered station’s grounds.',health:'Healthcare: cream = within nine tiles of a powered hospital.',library:'Libraries: gold = learning coverage within seven tiles.',pollution:'Pollution: red = within four tiles of developed industry.',wellbeing:'Homes: green 70–100% · amber 40–69% · red below 40%.'};
function updateLegend(){$('layerLegend').textContent=legends[layer]+(layer==='power'?` Supply used: ${city.powerUsed}/${city.powerCapacity} lots.`:layer==='none'?' Map signs: road = no access · bolt = no power · drop = no water. + means more needs; inspect for details.':'');}
$('layer').onchange=e=>{layer=e.target.value;updateLegend();};
function saveCity(manual=false){if(!hasStarted)return false;try{const json=JSON.stringify(city.save());localStorage.setItem(SAVE_KEY,json);if(manual)localStorage.setItem(MANUAL_KEY,json);$('saveInfo').textContent=(manual?'Saved':'Autosaved')+' · month '+city.month;return true;}catch{$('saveInfo').textContent='Browser save unavailable. Export a file to keep your city.';return false;}}
function beginStroke(){if(!stroke)stroke={tiles:new Map(),cost:0};}
function finishStroke(){if(stroke?.tiles.size){history.push(stroke);if(history.length>40)history.shift();saveCity();}stroke=null;$('undo').disabled=!history.length;}
function undo(){finishStroke();const edit=history.pop();if(!edit)return;for(const [index,before]of edit.tiles)Object.assign(city.tiles[index],before);city.funds+=edit.cost;city.update();stats();saveCity();$('undo').disabled=!history.length;$('status').textContent='Last building action undone.';}
function restore(next){hasStarted=true;shownRank=null;$('milestoneNotice').hidden=true;city=next;activity.reset();history=[];stroke=null;selected=null;clock=0;needsFocus=true;resize();syncControls();stats();saveCity();$('undo').disabled=true;$('status').textContent='City loaded. Continue building.';}
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
$('pan').onclick=()=>{cursorMode=false;selectTool();panMode=!panMode;$('pan').setAttribute('aria-pressed',String(panMode));$('status').textContent=panMode?'Drag the map to pan. Turn Pan off to build.':types[tool].help;};
let hasStarted=false,pendingStart=null,playChoice='manager';
try{const stored=localStorage.getItem(SAVE_KEY);if(stored){city=City.load(JSON.parse(stored));hasStarted=true;$('saveInfo').textContent='Restored saved city · month '+city.month;}}catch{$('saveInfo').textContent='Saved city unavailable. Export a file to keep your city.';}syncControls();
window.addEventListener('pagehide',()=>saveCity());
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();undo();}});
function playProgress(){
 const goal=city.scenarioProgress();$('playCard').hidden=!goal&&!city.experience.guided;$('guideDismiss').hidden=!!goal;
 if(goal){$('playTitle').textContent=goal.complete?'Challenge complete!':goal.title;$('playDetail').textContent=goal.complete?'You met the objective. Keep building, or choose another experience from Play menu.':goal.detail+' Objectives are checked at month-end.';return;}
 const lots=city.anchors().filter(t=>['home','shop','industry'].includes(t.type));
 const steps=[
  [city.anchors().some(t=>isRoad(t)),'1 · Lay out roads','Paint a road. Buildings need a road along their edge.'],
  [city.anchors().some(t=>t.type==='power'&&t.access)&&city.anchors().some(t=>t.type==='water'&&t.powered),'2 · Connect utilities','Place a solar plant beside the road, then a water tower beside the connected road.'],
  [lots.some(t=>t.type==='home'&&t.access&&t.powered&&t.watered)&&lots.some(t=>t.type!=='home'&&t.access&&t.powered&&t.watered),'3 · Welcome a neighborhood','Zone homes and commerce or industry beside served roads. Keep industry away from homes.'],
  [city.population>=64&&city.balance>=0,'4 · Grow sustainably','Let months pass as buildings develop. Add homes and jobs; use Monthly balance to review costs. Aim for 64 residents and a nonnegative balance.']
 ];const next=steps.find(row=>!row[0]);$('playTitle').textContent=next?next[1]:'Your city is underway';$('playDetail').textContent=next?next[2]:'Keep expanding, improve services and explore neighborhood goals.';
}
$('guideDismiss').onclick=()=>{city.experience.guided=false;stats();saveCity();};
function openPlayMenu(){ $('continueCity').hidden=!hasStarted;$('startChoices').hidden=true;document.querySelectorAll('[data-play]').forEach(b=>b.setAttribute('aria-pressed','false'));$('playMenu').showModal(); }
$('playMenu').addEventListener('cancel',e=>{if(!hasStarted)e.preventDefault();});
$('continueCity').onclick=()=>$('playMenu').close();
function startSummary(){const scenario=$('startScenario').value;$('startSummary').textContent=playChoice==='scenarios'?({village:'An empty map, $15,000 and a goal: 64 residents with a nonnegative monthly balance.',utilities:'An established town with no water towers. Repair its services with a $4,000 recovery budget before residents leave.', 'clean-air':'A town with homes too close to industry. You have $4,500 to relocate buildings and improve well-being.'}[scenario]):$('startLayout').value==='starter'?'Start with 128 residents, connected utilities, homes and workplaces. In Build a City, construction costs come out of your $15,000 budget.':'Start with an empty river map. Build a City includes optional guidance.';}
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{playChoice=b.dataset.play;document.querySelectorAll('[data-play]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));$('startChoices').hidden=false;$('startTitle').textContent=b.querySelector('strong').textContent;const scenario=playChoice==='scenarios';$('startLayout').hidden=scenario;document.querySelector('label[for="startLayout"]').hidden=scenario;$('scenarioLabel').hidden=!scenario;$('startScenario').hidden=!scenario;startSummary();});
$('startLayout').onchange=startSummary;$('startScenario').onchange=startSummary;
$('startPlay').onclick=()=>{pendingStart={mode:playChoice==='sandbox'?'free':'manager',layout:playChoice==='scenarios'?'blank':$('startLayout').value,scenario:playChoice==='scenarios'?$('startScenario').value:null};if(hasStarted)$('reset').showModal();else startExperience();};
function startExperience(){const next=City.start(pendingStart.mode,pendingStart.layout,pendingStart.scenario);pendingStart=null;pan={x:0,y:0};zoom=1;paused=false;$('pause').textContent='Pause';tool='road';rotated=false;cursorMode=false;panMode=false;$('pan').setAttribute('aria-pressed','false');$('cityDetails').open=false;restore(next);selectTool();$('playMenu').close();$('status').textContent=next.experience.scenario?'Challenge ready. Check your objective in the sidebar.':'City ready. Build freely or follow the optional guide.';}
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
$('cursor').onclick=()=>{finishStroke();if(!cursorMode)cursorPreviousTool=tool;cursorMode=!cursorMode;tool=cursorMode?'inspect':cursorPreviousTool;rotated=false;panMode=false;$('pan').setAttribute('aria-pressed','false');selectTool();$('status').textContent=cursorMode?'Cursor: click to inspect · drag to move the map.':types[tool].help;};
function showCityDetails(){document.body.classList.remove('map-expanded');$('expandMap').setAttribute('aria-pressed','false');$('expandMap').textContent='Expand map';$('cityDetails').open=true;}
$('expandMap').onclick=()=>{const expanded=document.body.classList.toggle('map-expanded');$('expandMap').setAttribute('aria-pressed',String(expanded));$('expandMap').textContent=expanded?'Restore layout':'Expand map';};
function clampPan(){const r=canvas.getBoundingClientRect(),width=W*size,height=H*size;pan.x=width<=r.width?0:Math.max((r.width-width)/2,Math.min((width-r.width)/2,pan.x));pan.y=height<=r.height?0:Math.max((r.height-height)/2,Math.min((height-r.height)/2,pan.y));}
function point(e){let r=canvas.getBoundingClientRect(),o=origin();return{x:Math.floor((e.clientX-r.left-o.x)/size),y:Math.floor((e.clientY-r.top-o.y)/size)};}
function keepCursorVisible(){const r=canvas.getBoundingClientRect(),o=origin(),x=o.x+(hover.x+.5)*size,y=o.y+(hover.y+.5)*size;if(x<size)pan.x+=size-x;if(x>r.width-size)pan.x-=x-(r.width-size);if(y<size)pan.y+=size-y;if(y>r.height-size)pan.y-=y-(r.height-size);clampPan();}
function apply(){
const key=hover.x+','+hover.y;if(key===lastTile)return;lastTile=key;
if(tool==='inspect'){showCityDetails();selected={...hover};inspect();return;}
selected=null;const tile=city.at(hover.x,hover.y);if(!tile)return;
const plan=city.plan(hover.x,hover.y,tool,rotated),before=plan.cells.map(t=>({index:t.y*W+t.x,state:city.state(t)})),funds=city.funds;
let error=city.build(hover.x,hover.y,tool,rotated);
if(!error&&before.length){beginStroke();for(const item of before)if(!stroke.tiles.has(item.index))stroke.tiles.set(item.index,item.state);stroke.cost+=funds-city.funds;}
$('status').textContent=error||`${types[tool].name} · ${city.mode==='manager'?'$'+types[tool].cost+(types[tool].w*types[tool].h>1?' per facility':' per tile'):'Free Build'} · ${types[tool].w*types[tool].h>1?'Click to place one facility.':'Drag to paint.'} Undo reverses this action.`;stats();
}
function paintLine(from,to){let x=from.x,y=from.y,dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),sx=x<to.x?1:-1,sy=y<to.y?1:-1,err=dx-dy;for(let n=0;n<W+H+100;n++){hover={x,y};apply();if(x===to.x&&y===to.y)break;const e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}}hover=to;}
canvas.addEventListener('wheel',e=>{e.preventDefault();if(drag)return;const r=canvas.getBoundingClientRect(),o=origin(),px=e.clientX-r.left,py=e.clientY-r.top,worldX=(px-o.x)/size,worldY=(py-o.y)/size;zoom=Math.max(.75,Math.min(4,zoom*(e.deltaY<0?1.12:1/1.12)));resize();pan={x:px-worldX*size-(r.width-W*size)/2,y:py-worldY*size-(r.height-H*size)/2};clampPan();},{passive:false});
canvas.oncontextmenu=e=>e.preventDefault();
canvas.onpointerdown=e=>{if(e.button!==0&&e.button!==2)return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={pan:cursorMode||panMode||e.button===2||e.shiftKey,cursor:cursorMode&&e.button===0&&!e.shiftKey,moved:false,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY};hover=point(e);lastTile='';if(!drag.pan)apply();};
canvas.onpointermove=e=>{if(drag?.pan){if(drag.cursor&&!drag.moved){if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6)return;drag.moved=true;}canvas.classList.add('is-dragging');pan.x+=e.clientX-drag.x;pan.y+=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;clampPan();}else{const next=point(e);if(drag&&types[tool].w*types[tool].h===1&&!cursorMode)paintLine(hover,next);else hover=next;if(!cursorMode)inspect();}};
function endPointer(){drag=null;lastTile='';canvas.classList.remove('is-dragging');finishStroke();}
canvas.onpointerup=e=>{if(drag?.cursor&&!drag.moved){hover=point(e);lastTile='';apply();}endPointer();};
canvas.onpointercancel=canvas.onlostpointercapture=endPointer;
canvas.onkeydown=e=>{const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(dir){e.preventDefault();hover.x=Math.max(0,Math.min(W-1,hover.x+dir[0]));hover.y=Math.max(0,Math.min(H-1,hover.y+dir[1]));if(tool==='inspect')selected={...hover};keepCursorVisible();inspect();}if(e.key==='Enter'||e.key===' '){e.preventDefault();lastTile='';apply();finishStroke();}};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';};$('speed').onchange=e=>speed=+e.target.value;$('mode').onchange=e=>{finishStroke();city.mode=e.target.value;if(city.mode==='free'){city.experience.scenario=null;city.experience.complete=false;}stats();selectTool();saveCity();};$('tax').oninput=e=>{city.tax=+e.target.value;$('taxValue').textContent=city.tax+'%';city.update();stats();saveCity();};$('new').onclick=()=>{finishStroke();openPlayMenu();};$('cancel').onclick=()=>$('reset').close();$('confirm').onclick=()=>{if(pendingStart)startExperience();$('reset').close();};$('zoomIn').onclick=()=>{zoom=Math.min(4,zoom*1.25);resize();};$('zoomOut').onclick=()=>{zoom=Math.max(.75,zoom/1.25);resize();};$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};resize();};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function drawBuilding(g,t,x,y,s,time=0){
 const w=(t.w||1)*s,h=(t.h||1)*s,type=t.type,level=t.level||0,variant=((t.x||0)*7+(t.y||0)*11)%3;
 const box=(a,b,c,d,color)=>{g.fillStyle=color;g.fillRect(x+a*w,y+b*h,c*w,d*h);};
 const poly=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([a,b],i)=>i?g.lineTo(x+a*w,y+b*h):g.moveTo(x+a*w,y+b*h));g.closePath();g.fill();};
 const oval=(a,b,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x+a*w,y+b*h,rx*w,ry*h,0,0,Math.PI*2);g.fill();};
 if(['road','bridge','erase','inspect'].includes(type)){
  if(type==='road'||type==='bridge'){if(type==='bridge'){box(0,.19,1,.08,'#d6c598');box(0,.73,1,.08,'#d6c598');}box(.08,.34,.84,.36,'#405365');for(let i=0;i<3;i++)box(.17+i*.24,.49,.13,.04,'#eee3ba');}
  else{g.fillStyle=type==='erase'?'#eea597':'#c4d5e6';g.font=`bold ${Math.floor(h*.9)}px system-ui`;g.textAlign='center';g.fillText(type==='erase'?'×':'?',x+w*.5,y+h*.85);}return;
 }
 const zone=['home','shop','industry'].includes(type);
 if(zone&&!level){
  // Vacant zones have recognizable building frames; residents still arrive through growth.
  poly([[.12,.86],[.24,.93],[.94,.93],[.88,.35],[.8,.25]],'#25423640');
  box(.13,.72,.74,.17,'#b9b29c');box(.13,.86,.74,.035,'#827969');
  if(type==='home'){
   box(.23,.39,.54,.39,'#e7dfc5');box(.23,.39,.54,.065,'#aa8c67');
   poly([[.14,.4],[.5,.13],[.87,.4],[.78,.43],[.5,.23],[.23,.43]],'#9b7558');
   for(const a of [.32,.59]){box(a,.5,.12,.14,'#716d5e');box(a+.02,.51,.08,.1,'#bed4d2');}
   box(.46,.59,.13,.2,'#756953');box(.47,.6,.09,.18,'#b29e7c');box(.46,.89,.13,.11,'#d7c8a5');
   oval(.14,.72,.08,.09,'#689653');box(.8,.8,.1,.045,'#bc8c53');box(.79,.85,.13,.04,'#bc8c53');
  }else if(type==='shop'){
   box(.17,.29,.69,.48,'#d4d4c8');box(.14,.25,.75,.09,'#71858b');box(.24,.47,.37,.25,'#68818a');
   box(.65,.44,.14,.34,'#686c63');for(const a of [.16,.82])box(a,.35,.03,.43,'#b1a27f');
   for(let i=0;i<5;i++)box(.14+i*.15,.36,.15,.11,i%2?'#f1e4c3':'#a27661');
   box(.29,.28,.4,.045,'#eee1b3');box(.11,.81,.13,.1,'#b88e56');box(.76,.82,.14,.1,'#b88e56');
  }else{
   box(.13,.42,.7,.35,'#b8b4a0');poly([[.13,.42],[.13,.26],[.35,.42],[.35,.26],[.59,.42],[.59,.26],[.83,.42]],'#808581');
   box(.23,.54,.25,.23,'#657169');for(const a of [.16,.51,.8])box(a,.44,.035,.32,'#707d77');
   box(.76,.13,.09,.4,'#b7a28b');box(.75,.12,.12,.06,'#717b77');box(.6,.58,.11,.085,'#aec5ca');
   box(.62,.79,.13,.1,'#a98554');box(.77,.82,.12,.07,'#a98554');box(.1,.82,.27,.06,'#8b9690');
  }
  // A board and cones distinguish unoccupied lots from developed buildings.
  box(.1,.11,.035,.18,'#80694f');box(.065,.08,.14,.11,'#eee7cc');box(.085,.11,.1,.025,types[type].color);
  poly([[.88,.91],[.91,.79],[.96,.91]],'#df995a');box(.875,.9,.095,.025,'#f1e4bf');
  if(t.progress)drawConstruction(g,t,x,y,s,time);
  return;
 }
 if(type==='square'){
  box(.03,.03,.94,.94,'#a6b28a');box(.13,.13,.74,.74,'#d9caa5');box(.45,.02,.1,.96,'#e8dcba');box(.02,.45,.96,.1,'#e8dcba');
  for(const a of [.2,.8])for(const b of [.2,.8]){oval(a,b,.1,.1,'#447b54');oval(a-.025,b-.025,.055,.055,'#78ad69');}
  oval(.52,.54,.2,.18,'#7d8d8244');oval(.5,.5,.19,.19,'#adaba0');oval(.5,.5,.15,.15,'#5cacc1');oval(.5,.5,.105,.1,'#83c9d0');oval(.5,.5,.045,.045,'#d9e3d2');
  for(const a of [.22,.65]){box(a,.34,.13,.025,'#805d45');box(a,.64,.13,.025,'#805d45');}box(.85,.46,.025,.12,'#695d45');oval(.862,.45,.025,.025,'#f1dd98');return;
 }
 if(type==='sports'){
  box(.025,.03,.95,.94,'#b8bc99');oval(.5,.49,.44,.4,'#b37765');oval(.5,.49,.395,.35,'#d7b398');oval(.5,.49,.375,.33,'#b37765');box(.2,.22,.6,.54,'#4f985e');
  for(let i=0;i<5;i++)box(.2+i*.12,.22,.06,.54,'#68a56a');
  g.strokeStyle='#f2e8d1';g.lineWidth=Math.max(1,s*.025);g.strokeRect(x+w*.23,y+h*.26,w*.54,h*.46);g.beginPath();g.moveTo(x+w*.5,y+h*.26);g.lineTo(x+w*.5,y+h*.72);g.stroke();
  oval(.5,.49,.073,.12,'#e4e7c7');oval(.5,.49,.06,.1,'#579a61');box(.22,.41,.035,.16,'#edf0d3');box(.745,.41,.035,.16,'#edf0d3');
  for(const b of [.07,.86]){box(.32,b,.36,.045,'#8b9690');box(.34,b+.01,.32,.015,'#d7ddd1');}return;
 }
 if(type==='promenade'){
  box(.05,.03,.9,.94,'#b8caa2');box(.22,.03,.57,.94,'#c7b589');for(let b=.08;b<.94;b+=.08)box(.23,b,.55,.013,'#a79571');
  for(const a of [.22,.78]){box(a,.04,.025,.91,'#e6dac0');for(const b of [.07,.47,.88])box(a-.015,b,.055,.04,'#817762');}
  for(const b of [.2,.68]){box(.07,b,.13,.07,'#795e48');box(.08,b+.015,.11,.012,'#c69c6d');oval(.88,b,.07,.055,'#4d875c');oval(.86,b-.012,.04,.03,'#81ae69');}
  box(.48,.42,.08,.07,'#617b85');oval(.52,.41,.07,.025,'#dbcda3');return;
 }
 if(type==='park'){
  box(.06,.06,.88,.88,'#387b49');box(.44,.06,.12,.88,'#d6c996');box(.06,.45,.88,.12,'#d6c996');
  oval(.24,.25,.15,.17,'#75ca65');oval(.75,.76,.17,.18,'#59ac5d');box(.62,.2,.2,.05,'#9b6d47');box(.18,.69,.2,.05,'#9b6d47');return;
 }
 // Grounds and shadows give each lot a physical setting rather than a solid zone color.
 poly([[.18,.29],[.89,.3],[.97,.87],[.82,.97],[.2,.91]],'#263d3440');
 if(type==='home'){
  box(.02,.83,.98,.12,'#729b58');box(.45,.82,.16,.18,'#d3c4a0');
  for(const a of [.07,.84]){oval(a,.78,.07,.08,'#477a4d');oval(a-.02,.75,.04,.04,'#79aa61');}
  box(.05,.96,.34,.022,'#d9cfb4');box(.64,.96,.31,.022,'#d9cfb4');
 }else if(type==='shop'){
  box(.04,.8,.92,.17,'#c4bfa8');for(let a=.07;a<.95;a+=.16)box(a,.91,.11,.013,'#e7dec1');
 }else if(type==='industry'){
  box(.03,.73,.94,.24,'#a5a591');for(const a of [.08,.22,.74,.88])box(a,.91,.07,.013,'#e0d5b7');
 }
 if(type==='home'){
  if(level===1){if(variant===1){box(.19,.28,.65,.56,'#dae3cf');box(.16,.23,.71,.1,'#607c73');box(.24,.41,.17,.18,'#7baabd');box(.58,.41,.18,.18,'#7baabd');box(.45,.63,.12,.21,'#65554a');box(.23,.85,.54,.06,'#d3c69e');}else if(variant===2){box(.16,.4,.5,.43,'#f0d2a7');poly([[.1,.41],[.4,.17],[.71,.41]],'#687c8c');box(.63,.48,.24,.35,'#ddd8bf');box(.61,.44,.28,.07,'#687c8c');box(.27,.52,.15,.13,'#83b9c4');box(.48,.62,.12,.21,'#695442');box(.68,.57,.14,.23,'#8c9491');}else{box(.22,.38,.57,.47,['#f2e3c7','#e2ddd1','#d4e4df'][(t.x+t.y)%3]);poly([[.13,.4],[.51,.12],[.88,.4]],'#8c5448');box(.46,.6,.16,.25,'#5b4940');box(.29,.5,.12,.14,'#80bccb');box(.65,.5,.1,.14,'#80bccb');box(.48,.86,.12,.12,'#e4d1ac');}}
  else if(level===2){box(.12,.32,.77,.54,'#e8dac2');poly([[.07,.33],[.29,.13],[.52,.33]],'#855047');poly([[.47,.33],[.7,.13],[.94,.33]],'#855047');for(const a of [.22,.66]){box(a,.43,.12,.13,'#80bccb');box(a,.67,.12,.19,'#5c5148');}box(.48,.36,.025,.5,'#bba88f');if(variant===1){box(.11,.15,.78,.15,'#637c83');box(.19,.18,.17,.1,'#87b7c6');box(.63,.18,.17,.1,'#87b7c6');}else if(variant===2){box(.1,.82,.8,.07,'#798b78');box(.13,.55,.73,.04,'#bba88f');}}
  else{box(.17,.13,.68,.73,'#d4dedc');box(.13,.11,.76,.09,'#497777');for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(.25+col*.19,.26+row*.18,.12,.11,'#4a7c92');box(.44,.76,.15,.12,'#504f49');if(variant===1){box(.12,.11,.09,.76,'#9a8e7f');box(.82,.11,.06,.76,'#9a8e7f');box(.14,.46,.72,.04,'#647d81');}else if(variant===2){box(.1,.82,.8,.09,'#8c9b90');box(.25,.04,.48,.09,'#637987');}}
 }else if(type==='shop'){
  box(.13,.27,.76,.58,'#f3ead8');box(.11,.2,.8,.13,'#4c7194');
  if(level===3){box(.18,.07,.67,.2,'#c4d7e1');for(let col=0;col<3;col++)box(.24+col*.2,.11,.13,.09,'#4a7c92');}
  box(.2,.48,.49,.28,'#77b5ce');box(.73,.5,.1,.33,'#354e65');
  for(let col=0;col<6;col++)box(.11+col*.134,.36,.134,.13,col%2?'#e9efde':['#e66f5c','#647ca3','#678c65'][variant]);box(.14,.81,.74,.05,'#d1b78c');if(variant===1){box(.13,.16,.76,.09,'#f0dfbb');box(.31,.18,.39,.04,'#8f755a');box(.2,.85,.12,.08,'#557d51');box(.64,.85,.12,.08,'#557d51');}else if(variant===2){box(.08,.24,.09,.56,'#7894a0');box(.85,.24,.08,.56,'#7894a0');box(.24,.21,.46,.07,'#eed091');}
  if(level===2){box(.12,.14,.78,.21,'#d1dfdc');box(.1,.12,.82,.055,'#556f80');for(const a of [.2,.43,.66])box(a,.2,.16,.1,'#6198af');for(const a of [.37,.63])box(a,.48,.025,.32,'#ede3ce');box(.48,.61,.08,.2,'#354e65');}
  if(level===3){box(.2,.08,.64,.53,'#bdd3d8');box(.17,.06,.7,.065,'#486b7b');for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(.26+col*.18,.17+row*.13,.11,.075,'#477e96');box(.15,.62,.72,.035,'#567c88');box(.46,.69,.12,.16,'#354e65');box(.28,.015,.25,.045,'#819b9e');}
 }else if(type==='industry'){
  box(.1,.38,.8,.47,'#d5c29a');poly([[.1,.38],[.1,.24],[.34,.38],[.34,.24],[.58,.38],[.58,.24],[.8,.38]],'#8b7867');
  box(.79,.12,.11,.59,'#786353');box(.77,.1,.15,.07,'#535b5e');box(.21,.58,.24,.25,'#4b535c');box(.53,.57,.25,.12,'#879db1');
  if(variant===1){box(.1,.23,.58,.17,'#78898a');box(.09,.2,.61,.06,'#525f67');box(.14,.29,.44,.045,'#b5c4c3');}else if(variant===2){box(.18,.18,.17,.21,'#bdc7bc');oval(.265,.18,.085,.045,'#dce1d0');box(.59,.65,.12,.2,'#a69278');box(.72,.67,.12,.18,'#a69278');}
  if(level>1)box(.62,.19,.08,.26,'#8e7767');
  if(level===2){box(.09,.17,.59,.24,'#adb3a8');box(.07,.14,.63,.055,'#606f72');for(const a of [.16,.32,.48])box(a,.23,.11,.09,'#749aa6');box(.53,.73,.19,.13,'#7a776b');box(.55,.76,.15,.025,'#a7a28c');}
  if(level===3){box(.07,.13,.64,.33,'#b5bcae');poly([[.05,.14],[.21,.04],[.39,.14],[.54,.04],[.73,.14]],'#576d72');for(const a of [.14,.32,.5])box(a,.23,.12,.15,'#6894a1');box(.62,.05,.08,.39,'#806957');oval(.65,.045,.055,.025,'#515e61');box(.52,.67,.22,.21,'#8a9185');for(const a of [.56,.65])box(a,.69,.05,.17,'#c5cbb8');box(.06,.79,.12,.1,'#a87c4c');box(.07,.81,.1,.02,'#d0ac71');}
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
 }else if(type==='hospital'){
  box(.03,.06,.94,.9,'#b7c8b2');box(.08,.18,.84,.48,'#e5e9e1');box(.37,.12,.27,.61,'#f4f1df');box(.35,.1,.31,.08,'#679f9e');
  for(const a of [.14,.24,.71,.81]){box(a,.28,.06,.09,'#73a7be');box(a,.46,.06,.09,'#73a7be');}
  box(.47,.23,.07,.22,'#d65d65');box(.42,.3,.17,.07,'#d65d65');box(.46,.56,.1,.17,'#526d7e');box(.65,.75,.24,.13,'#f4f1df');box(.69,.76,.08,.07,'#73a7be');box(.8,.76,.03,.1,'#d65d65');box(.77,.79,.09,.03,'#d65d65');
 }else if(type==='library'){
  box(.04,.06,.92,.89,'#bbbfa0');box(.14,.25,.72,.49,'#e4d2af');poly([[.08,.26],[.5,.07],[.92,.26]],'#7e6462');
  for(const a of [.23,.67]){box(a,.38,.11,.22,'#769ab2');box(a+.05,.38,.02,.22,'#e8d7b7');}box(.43,.42,.15,.33,'#665445');
  box(.35,.75,.32,.06,'#dbd4bb');box(.3,.82,.42,.06,'#dbd4bb');box(.68,.78,.16,.04,'#806344');poly([[.43,.2],[.5,.23],[.57,.2],[.57,.32],[.5,.35],[.43,.32]],'#f5ebca');
 }else if(type==='fire'){
  box(.05,.07,.9,.87,'#c8c5ad');box(.12,.18,.76,.51,'#dbcec0');box(.09,.11,.82,.13,'#a24e46');
  for(const a of [.18,.56]){box(a,.31,.27,.36,'#354854');box(a+.04,.5,.19,.22,'#d85349');box(a+.06,.52,.15,.07,'#c1e5e4');box(a+.03,.49,.21,.035,'#f7d67c');}
  box(.11,.74,.79,.16,'#7d8a8c');box(.46,.23,.075,.06,'#f5db9d');
 }
 if(zone&&level){
  // Roof highlights, wall courses, and window glints remain readable when zoomed in.
  box(.2,.84,.6,.035,'#6a685744');
  if(type==='home'){box(.25,.41,.5,.017,'#fff8dd88');box(.32,.51,.035,.04,'#e6f2e888');}
  if(type==='shop'){box(.21,.53,.025,.2,'#eaf6f1aa');box(.32,.53,.025,.2,'#eaf6f188');box(.13,.28,.76,.02,'#fff7dc88');}
  if(type==='industry'){box(.12,.42,.67,.025,'#ece9d088');for(let a=.15;a<.8;a+=.12)box(a,.47,.045,.013,'#8d8c7977');}
 }
 if(zone&&t.progress){drawConstruction(g,t,x,y,s,time);for(const a of [.16,.81])box(a,.04,.035,.92,'#ffe083');}
}
function drawConstruction(g,t,x,y,s,time){
 const phase=(time/3500)%1,height=.25+phase*.48;
 g.save();g.fillStyle='#e6c77c';g.fillRect(x+s*.16,y+s*(.88-height),s*.68,s*height*.25);
 g.strokeStyle='#cfac65';g.lineWidth=Math.max(1,s*.055);g.beginPath();for(const a of [.19,.5,.81]){g.moveTo(x+s*a,y+s*.88);g.lineTo(x+s*a,y+s*(.88-height));}g.stroke();
 g.strokeStyle='#f6dc82';g.beginPath();g.moveTo(x+s*.83,y+s*.9);g.lineTo(x+s*.83,y+s*.1);g.lineTo(x+s*(.2+phase*.1),y+s*.1);g.stroke();
 const hook=.2+Math.sin(time/650)*.05;g.beginPath();g.moveTo(x+s*hook,y+s*.1);g.lineTo(x+s*hook,y+s*.34);g.stroke();g.fillStyle='#d8b06b';g.fillRect(x+s*(hook-.07),y+s*.34,s*.14,s*.09);
 for(const a of [.15,.72]){g.fillStyle='#ef9855';g.beginPath();g.moveTo(x+s*a,y+s*.93);g.lineTo(x+s*(a+.04),y+s*.82);g.lineTo(x+s*(a+.08),y+s*.93);g.fill();}g.restore();
}
function drawTerrain(t,x,y,s,ctx=canvas.getContext('2d')){
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 const water=terrainAt(t.x,t.y)==='river',seed=t.x*13+t.y*7;
 rect(x,y,s,s,water?'#397f9d':'#80a96b');
 if(water){
  const edge=city.neighbors(t).some(n=>terrainAt(n.x,n.y)!=='river');
  if(edge)rect(x,y,s,s,'#4c9baa');
  for(let i=0;i<2;i++){const a=((seed+i*17)%29)/36,b=((seed*3+i*11)%31)/38;rect(x+s*a,y+s*b,s*.2,s*.02,'#a3d4d346');}
 }else{
  // Irregular grass detail replaces the checkerboard of filled square tiles.
  if(t.type==='land'){
   ctx.strokeStyle='#567e4e55';ctx.lineWidth=Math.max(.5,s*.025);ctx.beginPath();
   for(let i=0;i<3;i++){const a=((seed+i*19)%37)/42+.04,b=((seed*3+i*13)%41)/46+.04;ctx.moveTo(x+a*s,y+b*s);ctx.lineTo(x+(a+.025)*s,y+(b-.04)*s);}ctx.stroke();
   if(seed%17===0){ctx.fillStyle='#66796c';ctx.beginPath();ctx.ellipse(x+s*.24,y+s*.69,s*.09,s*.055,-.3,0,7);ctx.fill();rect(x+s*.2,y+s*.65,s*.065,s*.015,'#a5afa0');}
   if(seed%19===0){rect(x+s*.47,y+s*.57,s*.07,s*.21,'#665b44');ctx.fillStyle='#284c3540';ctx.beginPath();ctx.ellipse(x+s*.6,y+s*.61,s*.22,s*.12,.3,0,7);ctx.fill();for(const [a,b,r,c]of [[.5,.42,.23,'#477848'],[.44,.34,.16,'#639251'],[.56,.4,.13,'#76a65c']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+s*a,y+s*b,s*r,0,7);ctx.fill();}}
  }
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=city.at(t.x+dx,t.y+dy);if(n&&terrainAt(n.x,n.y)==='river'){
   rect(x+s*(dx===1?.84:0),y+s*(dy===1?.84:0),s*(dx?.16:1),s*(dy?.16:1),'#c4bd87');
   rect(x+s*(dx===1?.95:0),y+s*(dy===1?.95:0),s*(dx?.05:1),s*(dy?.05:1),'#8ea999');
   if(t.type==='land'&&seed%3===0){rect(x+s*(dx===1?.78:.13),y+s*(dy===1?.78:.18),s*.035,s*.15,'#557b4e');}
  }}
 }
}
function drawRoad(t,x,y,s,ctx=canvas.getContext('2d')){
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 const directions=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>isRoad(city.at(t.x+dx,t.y+dy)));
 const arm=(dx,dy,width,color)=>{const inset=(1-width)/2;rect(x+s*(dx<0?0:inset),y+s*(dy<0?0:inset),s*(dx?(1+width)/2:width),s*(dy?(1+width)/2:width),color);};
 // Continuous sidewalks follow the street network, including bends and intersections.
 rect(x+s*.18,y+s*.18,s*.64,s*.64,'#c3bda7');for(const [dx,dy]of directions)arm(dx,dy,.64,'#c3bda7');
 rect(x+s*.27,y+s*.27,s*.46,s*.46,'#465253');for(const [dx,dy]of directions)arm(dx,dy,.46,'#465253');
 if(directions.length<=2)for(const [dx,dy]of directions)rect(x+s*(dx<0?.08:dx>0?.8:.48),y+s*(dy<0?.08:dy>0?.8:.48),s*(dx?.13:.035),s*(dy?.13:.035),'#e8db9e');
 if(directions.length>2)for(const [dx,dy]of directions)for(let i=0;i<3;i++)rect(x+s*(dx<0?.13:dx>0?.81:.34+i*.13),y+s*(dy<0?.13:dy>0?.81:.34+i*.13),s*(dx?.05:.075),s*(dy?.05:.075),'#e6e1c9');
 if(s>18){rect(x+s*.37,y+s*.32,s*.04,s*.02,'#65726a');rect(x+s*.64,y+s*.62,s*.035,s*.022,'#343f40');}
 if(t.type==='bridge'){
  const vertical=directions.some(([dx,dy])=>dy)&&!directions.some(([dx,dy])=>dx);
  for(const a of [.17,.79]){rect(x+s*(vertical?a:0),y+s*(vertical?0:a),s*(vertical?.04:1),s*(vertical?1:.04),'#ddd1a7');for(const b of [.08,.46,.88])rect(x+s*(vertical?a:b),y+s*(vertical?b:a),s*.055,s*.055,'#9f9274');}
 }
}
function buildingNeeds(t){
 const zone=['home','shop','industry'].includes(t.type),service=['power','water','school','fire','hospital','library'].includes(t.type);
 if(!zone&&!service&&!types[t.type]?.recreation)return [];
 if(types[t.type]?.recreation)return t.access?[]:['road'];
 const needs=[];if(!t.access)needs.push('road');if(!t.powered)needs.push('power');if(zone&&!t.watered)needs.push('water');return needs;
}
function drawNeeds(t,x,y,s){
 const needs=buildingNeeds(t);if(!needs.length)return;
 // One steady, shape-coded sign keeps dense neighborhoods readable at every zoom.
 const d=Math.max(9,Math.min(19,s*.48)),bx=x+(t.w||1)*s-d-1,by=y+1;
 ctx.save();ctx.fillStyle='#fff4d7';ctx.strokeStyle='#654b37';ctx.lineWidth=1;ctx.fillRect(bx,by,d,d);ctx.strokeRect(bx+.5,by+.5,d-1,d-1);
 ctx.translate(bx,by);ctx.scale(d,d);ctx.fillStyle='#654b37';ctx.strokeStyle='#654b37';ctx.lineWidth=.1;
 if(needs[0]==='power'){ctx.beginPath();for(const [a,b]of [[.55,.12],[.23,.56],[.47,.56],[.38,.86],[.77,.4],[.53,.4]])ctx.lineTo(a,b);ctx.closePath();ctx.fill();}
 else if(needs[0]==='water'){ctx.beginPath();ctx.moveTo(.5,.12);ctx.bezierCurveTo(.2,.46,.17,.58,.23,.73);ctx.bezierCurveTo(.35,.97,.78,.88,.77,.62);ctx.bezierCurveTo(.76,.47,.61,.29,.5,.12);ctx.fill();}
 else{ctx.beginPath();ctx.moveTo(.25,.15);ctx.lineTo(.25,.85);ctx.moveTo(.75,.15);ctx.lineTo(.75,.85);ctx.stroke();ctx.fillRect(.46,.16,.08,.2);ctx.fillRect(.46,.65,.08,.2);}
 if(needs.length>1){ctx.fillStyle='#fff4d7';ctx.fillRect(.66,.62,.34,.38);ctx.fillStyle='#654b37';ctx.fillRect(.73,.76,.22,.07);ctx.fillRect(.81,.68,.07,.23);}
 ctx.restore();
}
let sceneRevision=0,sceneCache=null;
function prepareScene(o,r){
 const d=canvas.width/r.width,key=[sceneRevision,canvas.width,canvas.height,size,o.x,o.y].join('|');
 if(sceneCache?.key===key)return sceneCache;
 const surface=sceneCache?.surface||document.createElement('canvas');surface.width=canvas.width;surface.height=canvas.height;
 const g=surface.getContext('2d');g.setTransform(d,0,0,d,0,0);g.fillStyle='#294b3d';g.fillRect(0,0,r.width,r.height);
 const minX=Math.max(0,Math.floor(-o.x/size)),maxX=Math.min(W-1,Math.floor((r.width-o.x)/size)),minY=Math.max(0,Math.floor(-o.y/size)),maxY=Math.min(H-1,Math.floor((r.height-o.y)/size));
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)drawTerrain(city.at(x,y),o.x+x*size,o.y+y*size,size,g);
 const visible=city.anchors().filter(t=>!['land','river'].includes(t.type)&&o.x+(t.x+t.w)*size>=0&&o.y+(t.y+t.h)*size>=0&&o.x+t.x*size<=r.width&&o.y+t.y*size<=r.height),dynamic=[];
 for(const t of visible){const x=o.x+t.x*size,y=o.y+t.y*size;if(t.progress||(t.type==='industry'&&t.level)){dynamic.push(t);continue;}if(isRoad(t))drawRoad(t,x,y,size,g);else drawBuilding(g,t,x,y,size);}
 sceneCache={key,surface,visible,dynamic};return sceneCache;
}
function render(time){
 const r=canvas.getBoundingClientRect(),o=origin();
 if(!r.width||!r.height||!size)return;
 const scene=prepareScene(o,r);ctx.drawImage(scene.surface,0,0,r.width,r.height);
 for(const t of scene.dynamic)drawBuilding(ctx,t,o.x+t.x*size,o.y+t.y*size,size,time);
 renderOverlay(o,r);renderCoveragePreview(o);renderTraffic(o,time);
 for(const t of scene.visible)drawNeeds(t,o.x+t.x*size,o.y+t.y*size,size);
 const tile=city.at((selected||hover).x,(selected||hover).y);if(!tile)return;
 const def=types[tool],existing=tool==='inspect'||tool==='erase',a=existing?city.anchor(tile):tile,w=existing?a.w:dims().w,h=existing?a.h:dims().h,plan=city.plan(tile.x,tile.y,tool,rotated),valid=!plan.error&&(city.mode==='free'||tool==='inspect'||city.funds>=def.cost);
 const x=o.x+a.x*size,y=o.y+a.y*size;
 if(!existing&&!panMode){rect(x,y,w*size,h*size,valid?'#4ee4b43d':'#ff606060');if(valid&&(tile.type==='land'||tool==='bridge')){ctx.save();ctx.globalAlpha=.5;drawBuilding(ctx,{...tile,w,h,type:tool,level:1},x,y,size,time);ctx.restore();}}
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
else if(layer==='health'&&t.health)color='#f4f0de80';
else if(layer==='library'&&t.library)color='#d9af7580';
else if(layer==='pollution'&&t.polluted)color='#ff66668c';
else if(layer==='wellbeing'&&t.type==='home')color=t.wellbeing>=70?'#39e0b08c':t.wellbeing>=40?'#ffce538c':'#ff66669c';
if(color)rect(x,y,size,size,color);
}
}
function renderCoveragePreview(o){
 const radius={water:12,park:6,square:8,sports:10,promenade:6,school:8,fire:8,hospital:9,library:7}[tool],t=city.at(hover.x,hover.y),def=types[tool];if(!radius||panMode||!t||t.type!=='land')return;
 const x=o.x+(t.x+.5)*size,y=o.y+(t.y+.5)*size,right=x+(dims().w-1)*size,bottom=y+(dims().h-1)*size,r=radius*size;
 ctx.save();ctx.strokeStyle=def.color;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(right,y-r);ctx.lineTo(right+r,y);ctx.lineTo(right+r,bottom);ctx.lineTo(right,bottom+r);ctx.lineTo(x,bottom+r);ctx.lineTo(x-r,bottom);ctx.lineTo(x-r,y);ctx.closePath();ctx.stroke();ctx.restore();
}
function renderTraffic(o,time){
 for(const agent of activity.agents){
  const next=agent.next||agent,dx=next.x-agent.x,dy=next.y-agent.y;
  const wx=agent.x+.5+dx*agent.p,wy=agent.y+.5+dy*agent.p;
  const pedestrian=agent.kind==='pedestrian',offset=(pedestrian?.34:.1)*agent.side;
  const x=o.x+(wx-dy*offset)*size,y=o.y+(wy+dx*offset)*size;
  if(pedestrian){const stride=Math.sin(time/180+agent.x)*size*.03;rect(x-size*.05,y-size*.04,size*.1,size*.11,agent.color);rect(x-size*.035,y-size*.1,size*.07,size*.07,'#f2d4b4');rect(x-size*.05,y+size*.07+stride,size*.035,size*.07,'#31465c');rect(x+size*.015,y+size*.07-stride,size*.035,size*.07,'#31465c');continue;}
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));const large=agent.kind!=='car',length=size*(agent.kind==='bus'?.48:large?.4:.29),width=size*(large?.2:.15);
  ctx.fillStyle=({bus:'#efd063',engine:'#d96559',ambulance:'#ecf0df'})[agent.kind]||agent.color;ctx.fillRect(-length/2,-width/2,length,width);
  ctx.fillStyle='#315466';ctx.fillRect(length*.15,-width*.4,length*.15,width*.8);
  ctx.fillStyle='#293b47';for(const ax of [-.31,.3])for(const ay of [-.58,.45])ctx.fillRect(length*ax,width*ay,length*.12,width*.18);
  if(agent.kind==='bus'){ctx.fillStyle='#627d82';for(let n=0;n<3;n++)ctx.fillRect(-length*.37+n*length*.14,-width*.36,length*.09,width*.72);}
  if(agent.kind==='engine'){ctx.fillStyle='#c9d1c7';ctx.fillRect(-length*.38,-width*.24,length*.4,width*.48);ctx.fillStyle='#7a8785';ctx.fillRect(-length*.32,-width*.06,length*.3,width*.12);}
  if(agent.kind==='ambulance'){ctx.fillStyle='#d66b63';ctx.fillRect(-length*.16,-width*.32,length*.06,width*.64);ctx.fillRect(-length*.25,-width*.09,length*.24,width*.18);}
  if(large){ctx.fillStyle=agent.kind==='bus'?'#f7ead0':'#9bd6e3';ctx.fillRect(length*.03,-width*.45,length*.07,width*.9);}
  ctx.restore();
 }
}
$('activity').setAttribute('aria-pressed',String(animated));$('activity').textContent='Activity: '+(animated?'on':'off');
$('activity').onclick=()=>{animated=!animated;$('activity').setAttribute('aria-pressed',String(animated));$('activity').textContent='Activity: '+(animated?'on':'off');$('status').textContent=animated?'Visual activity on. Vehicles and pedestrians do not change city statistics.':'Visual activity paused. City simulation continues.';};
let frameDelta=0;
function loop(t){let dt=last?Math.min(250,t-last):0;last=t;frameDelta=dt;const running=!paused&&!drag&&!$('reset').open&&!$('loadDialog').open&&!$('budgetDialog').open&&!$('goalsDialog').open&&!$('playMenu').open;if(running){if(animated){visualTime+=dt*speed;activity.tick(city,dt*speed);}clock+=dt*speed;if(clock>=3500){clock=0;city.step();stats();saveCity();}}render(visualTime);requestAnimationFrame(loop);}stats();openPlayMenu();requestAnimationFrame(loop);
})();
