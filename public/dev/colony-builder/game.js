(() => {
  const { colonies, scenarios } = window.COLONY_DATA;
  const $ = id => document.getElementById(id);
  const clamp = (n, lo=0, hi=100) => Math.max(lo, Math.min(hi, n));
  const keys = ["food", "wealth", "people", "stability", "relations"];
  const names = {food:"Food",wealth:"Wealth",people:"People",stability:"Stability",relations:"Relations"};
  const icons = {food:"◉",wealth:"◈",people:"♟",stability:"⌂",relations:"✦"};
  const descriptions = {food:"Stores for the year",wealth:"Trade & supplies",people:"Settlers",stability:"Community",relations:"Regional diplomacy"};
  const stages = [{name:"Camp",at:0},{name:"Outpost",at:18},{name:"Settlement",at:39},{name:"Growing Town",at:63},{name:"Prosperous Colony",at:90}];
  let state = null, chosenScenario = null, isRevealed = false, anim = 0;
  let sceneWidth = 900, sceneHeight = 310;
  const canvas = $("settlementCanvas"), ctx = canvas.getContext("2d");

  function initPicker() {
    $("colonyChoices").querySelectorAll('[data-colony]').forEach(button => {
      const id = button.dataset.colony;
      if (!colonies[id]) return;
      button.addEventListener("click", () => start(id));
      button.disabled = false;
    });
    document.documentElement.dataset.colonyReady = 'true';
    $("startupStatus").hidden = true;
  }

  function showPicker() {
    cancelAnimationFrame(anim); anim = 0; state = null;
    $("gameScreen").hidden = true; $("startScreen").hidden = false;
    $("colonyChoices").querySelector('button').focus({preventScroll:true});
    window.scrollTo(0, 0);
  }

  function start(id) {
    if(anim) cancelAnimationFrame(anim);
    const c = colonies[id];
    state = {id, turn:0, year:c.year, resources:{...c.start}, history:[], pending:[], flags:[], buildings:[], seen:[], lowFood:0, lowStability:0, ended:false, weather:"Clear skies"};
    $("startScreen").hidden = true; $("gameScreen").hidden = false;
    $("regionLabel").textContent = `${c.name.toUpperCase()} · ${c.year}`;
    $("colonyTitle").textContent = c.settlement;
    $("colonySubtitle").textContent = c.subtitle;
    $("sceneName").textContent = c.scene;
    $("regionalNote").textContent = c.regionalNote;
    $("chronicle").hidden = true;
    $("chronicleCount").textContent = "0";
    $("chronicleToggle").setAttribute('aria-expanded', 'false');
    $("chronicleToggle").querySelector('.chevron').textContent = '⌄';
    $("endCard").hidden = true; $("situationCard").hidden = false;
    resizeCanvas(); render(); nextScenario(true); anim=requestAnimationFrame(draw);
    window.scrollTo(0, 0);
  }

  function stageInfo() {
    const r=state.resources, development = Math.max(0,r.people-25)*.58 + r.wealth*.12 + Math.max(0,r.stability-38)*.18 + new Set(state.buildings).size*12;
    let stage=stages[0]; for(const s of stages) if(development>=s.at) stage=s;
    const next=stages[stages.indexOf(stage)+1];
    return {development,stage,next,progress: next ? clamp((development-stage.at)/(next.at-stage.at)*100) : 100};
  }

  function statusText(key,v) {
    if(key==="food") return v>68?"Plentiful":v>38?"Steady":v>18?"Tight":"Critical";
    if(key==="wealth") return v>70?"Strong":v>40?"Steady":v>20?"Limited":"Scarce";
    if(key==="people") return v>72?"Growing":v>43?"Steady":v>22?"Small":"At risk";
    if(key==="stability") return v>70?"Cohesive":v>45?"Steady":v>22?"Strained":"Unrest";
    return v>70?"Cooperative":v>45?"Open":v>24?"Uneasy":"Contested";
  }

  function renderResources() {
    const root=$("resourceList"); root.innerHTML="";
    keys.forEach(k=>{const v=state.resources[k], node=document.createElement("div");node.className="resource";node.dataset.key=k;
      node.innerHTML=`<div class="resource-head"><span class="resource-name">${icons[k]} &nbsp;${names[k]}</span><strong class="resource-value">${Math.round(v)}</strong></div><div class="meter"><span style="width:${clamp(v)}%"></span></div><div class="resource-sub"><span>${descriptions[k]}</span><span>${statusText(k,v)}</span></div>`;root.append(node);});
    const st=stageInfo(); $("stageLabel").textContent=st.stage.name.toUpperCase(); $("growthFill").style.width=`${st.progress}%`;
    $("growthHint").textContent=st.next?`${Math.max(1,Math.ceil(st.next.at-st.development))} development points to ${st.next.name}.`:`The colony has become a prosperous town.`;
  }

  function renderPressures() {
    const c=colonies[state.id], r=state.resources, list=[];
    if(r.food<30)list.push(["◉","Food stores low","A poor harvest or rough winter would hit hard."]);
    else if(state.id==="virginia")list.push(["☀","Food production","Tobacco can compete with fields for land and labor."]);
    else if(state.id==="massachusetts")list.push(["❄","Short growing season","Plan stores before cold weather limits work."]);
    else list.push(["♧","Fast settlement growth","New arrivals can outpace housing and agreements."]);
    if(r.relations<35)list.push(["⚑","Land tension","Unresolved claims make cooperation harder."]);
    else list.push(["✦","Regional relationships","Diplomacy and trade need continued attention."]);
    if(r.stability<38)list.push(["⌂","Community strained","Disagreement may interrupt shared work."]);
    else if(r.people<35)list.push(["♟","Small workforce","Growth and repairs compete for limited hands."]);
    else list.push(["⚒","Workforce needs","More people bring skills and higher food needs."]);
    if(state.pending.length)list.push(["⌛","A choice is still unfolding",state.pending[0].title]);
    $("pressureList").innerHTML=list.map(x=>`<div class="pressure"><span class="pressure-icon">${x[0]}</span><span><strong>${x[1]}</strong><p>${x[2]}</p></span></div>`).join("");
    $("pressureCount").textContent=`${list.length} ACTIVE`;
  }

  function render() {
    const c=colonies[state.id]; renderResources(); renderPressures();
    $("yearLabel").textContent=state.year; $("regionLabel").textContent=`${c.name.toUpperCase()} · ${state.year}`; $("turnLabel").textContent=`YEAR ${Math.min(state.turn+1,8)} OF 8`;
    $("sceneCaption").textContent=sceneCaption();
    $("weatherLabel").textContent=state.weather.toUpperCase();
    $("weatherIcon").textContent=state.weather.includes("Rain")?"☂":state.weather.includes("Wind")?"≋":state.weather.includes("Cloud")?"☁":"☀";
  }
  function sceneCaption(){const s=stageInfo().stage.name;return s==="Camp"?"A few homes and cleared ground beside the water.":s==="Outpost"?"New homes and fields begin to shape the settlement.":s==="Settlement"?"The settlement is taking on a distinct shape.":s==="Growing Town"?"Busy lanes connect homes, workshops, and the waterfront.":"A prosperous settlement hums with activity."}

  function eligibleScenarios(){return scenarios.filter(s=>(!s.colony||s.colony===state.id)&&!state.seen.includes(s.id));}
  function nextScenario(first=false){
    if(state.ended)return;
    isRevealed=false; $("outcome").hidden=true; $("choices").hidden=false; $("keyHelp").innerHTML='Choose a path <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd>';
    let pool=eligibleScenarios();
    if(!pool.length){state.seen=[];pool=eligibleScenarios();}
    // Use a distinct regional situation early so each colony immediately feels different.
    const preferred={virginia:"va_powhatan",massachusetts:"ma_massachusett",pennsylvania:"pa_lenape"}[state.id];
    let s=first?scenarios.find(x=>x.id===preferred):null;
    if(!s&&state.turn===1){const second={virginia:"va_tobacco",massachusetts:"ma_coast",pennsylvania:"pa_grain"}[state.id];s=pool.find(x=>x.id===second);}
    if(!s||state.seen.includes(s.id))s=pool[Math.floor(Math.random()*pool.length)];
    chosenScenario=s;state.seen.push(s.id);
    $("situationTag").textContent=s.tag;$("situationTitle").textContent=s.title;$("situationText").textContent=s.text;
    $("situationCounter").textContent=`SITUATION ${state.turn+1} · ${colonies[state.id].name.toUpperCase()}`;
    $("choices").innerHTML="";
    s.choices.forEach((choice,i)=>{const b=document.createElement("button");b.className="choice";b.type="button";b.innerHTML=`<span class="choice-key">${String.fromCharCode(65+i)}</span><strong>${choice.title}</strong><small>${choice.description}</small>`;b.addEventListener("click",()=>choose(i));$("choices").append(b);});
    render();
  }

  function applyEffects(effects={}) {const changes={};keys.forEach(k=>{const d=Number(effects[k]||0);if(d){const before=state.resources[k];state.resources[k]=clamp(before+d);changes[k]=Math.round(state.resources[k]-before);}});if(effects.buildings)state.buildings.push(...effects.buildings);if(effects.flag&&!state.flags.includes(effects.flag))state.flags.push(effects.flag);return changes;}
  function applyYearEnd(){let changes={};const upkeep=Math.max(2,Math.round(state.resources.people/16));const oldFood=state.resources.food;state.resources.food=clamp(oldFood-upkeep);changes.food=state.resources.food-oldFood;
    if(state.resources.food<12){state.lowFood++;state.resources.people=clamp(state.resources.people-3);state.resources.stability=clamp(state.resources.stability-4);changes.people=(changes.people||0)-3;changes.stability=(changes.stability||0)-4;}
    else state.lowFood=0;
    if(state.resources.stability<12){state.lowStability++;state.resources.people=clamp(state.resources.people-2);changes.people=(changes.people||0)-2;}else state.lowStability=0;
    return changes;
  }
  function resolveRisk(choice){if(!choice.risk)return null;if(Math.random()<choice.risk.chance){const changes=applyEffects(choice.risk.effects);return {text:choice.risk.outcome,changes};}return null;}

  function choose(index){if(isRevealed||state.ended)return;isRevealed=true;const choice=chosenScenario.choices[index];const changes=applyEffects(choice.effects);const risk=resolveRisk(choice);
    if(choice.delayed){state.pending.push({due:state.turn+choice.delayed.after, title:choice.delayed.title,text:choice.delayed.text,effects:choice.delayed.effects});}
    const maintenance=applyYearEnd();for(const [k,v] of Object.entries(maintenance))changes[k]=(changes[k]||0)+v;
    state.weather=["Clear skies","Passing clouds","River breeze","Light rain","Overcast"][(Math.random()*5)|0];
    state.history.push({year:state.year,title:chosenScenario.title,choice:choice.title,text:choice.outcome,why:choice.why,changes,risk:risk?.text||null});
    if(!$("chronicle").hidden) updateChronicle();
    $("choices").hidden=true;$("outcome").hidden=false;
    const deltaHtml=keys.filter(k=>changes[k]).map(k=>`<span class="delta ${changes[k]<0?"down":""}">${names[k]} ${changes[k]>0?"+":""}${changes[k]}</span>`).join("");
    $("outcome").innerHTML=`<div class="outcome-title">THE YEAR'S CONSEQUENCES</div><p>${choice.outcome}${risk?` ${risk.text}`:""}</p>${deltaHtml?`<div class="delta-list">${deltaHtml}</div>`:""}<p class="learning"><strong>Look closer:</strong> ${choice.why}</p><div class="outcome-actions"><button id="continueButton" class="primary-button">Continue to ${state.year+1} →</button></div>`;
    $("keyHelp").textContent="Press Enter to continue";render();drawScene();
    $("continueButton").addEventListener("click",continueYear);
    checkCollapse();
  }

  function continueYear(){if(!isRevealed||state.ended)return;state.year++;state.turn++;
    const pendingNow=state.pending.filter(p=>p.due<=state.turn);state.pending=state.pending.filter(p=>p.due>state.turn);
    pendingNow.forEach(p=>{const changes=applyEffects(p.effects);state.history.push({year:state.year,title:p.title,choice:"A delayed consequence",text:p.text,why:"A previous decision continued to shape the colony.",changes,delayed:true});});
    if(!$("chronicle").hidden) updateChronicle();
    render();if(state.turn>=8){finish();return;}nextScenario();checkCollapse();
  }
  function checkCollapse(){if(state.ended)return;if(state.resources.people<=7||state.lowFood>=2||state.resources.stability<=4){finish(true);}}

  function finish(collapsed=false){state.ended=true;$("situationCard").hidden=true;$("endCard").hidden=false;const r=state.resources;
    const score=Math.round(r.food*.21+r.wealth*.19+r.people*.18+r.stability*.23+r.relations*.19+new Set(state.buildings).size*3);
    const label=collapsed?"The settlement could not continue":score>76?"A thriving colony":score>59?"A resilient settlement":score>42?"A hard-won foothold":"A fragile beginning";
    const detail=collapsed?"Years of food shortages, population loss, or internal strain pushed the settlement to collapse. Review the turning points and try a different strategy.":`After eight years, your colony has ${statusText("food",r.food).toLowerCase()} food stores, ${statusText("stability",r.stability).toLowerCase()} community stability, and ${statusText("relations",r.relations).toLowerCase()} regional relationships. No single measure tells the whole story.`;
    const recent=state.history.slice(-4).map(h=>`<p><strong>${h.year} · ${h.title}</strong><br><em>${h.choice}</em> — ${h.text}</p>`).join("");
    $("endCard").innerHTML=`<div class="end-emoji">${collapsed?"⌁":"✦"}</div><p class="eyebrow">YOUR COLONY'S FIRST YEARS</p><h2>${label}</h2><p>${detail}</p><div class="ending-metrics">${[["food","FOOD STORES"],["stability","COMMUNITY"],["relations","RELATIONSHIPS"]].map(([k,n])=>`<div class="ending-metric"><strong>${Math.round(r[k])}</strong><span>${n}</span></div>`).join("")}</div><div class="ending-history"><h3>Decisions that shaped this colony</h3>${recent}</div><p>Historical note: this model simplifies a complex period. Land, labor, power, and disease affected Indigenous peoples and colonists unequally; the five resource bars cannot represent those lived experiences.</p><div class="ending-actions"><button id="playAgain">Try another colony</button><button id="replaySame">Build again in ${colonies[state.id].name}</button></div>`;
    $("playAgain").onclick=showPicker;$("replaySame").onclick=()=>start(state.id);
    render();
  }

  function updateChronicle(){const root=$("chronicle");root.innerHTML=state.history.slice().reverse().map(h=>`<div class="chronicle-entry"><strong>${h.year} · ${h.title}</strong><p><em>${h.choice}</em> — ${h.text}</p></div>`).join("")||"<p class='chronicle-entry'>Your decisions will appear here.</p>";$("chronicleCount").textContent=state.history.length;}
  $("chronicleToggle").setAttribute('aria-expanded', 'false');
  $("chronicleToggle").setAttribute('aria-controls', 'chronicle');
  $("chronicleToggle").addEventListener("click",()=>{const el=$("chronicle");el.hidden=!el.hidden;$("chronicleToggle").setAttribute('aria-expanded', String(!el.hidden));$("chronicleToggle").querySelector(".chevron").textContent=el.hidden?"⌄":"⌃";if(!el.hidden)updateChronicle();});
  $("restartButton").addEventListener("click",showPicker); $("resetButton").addEventListener("click",()=>{if(state)start(state.id);});
  document.addEventListener("keydown",e=>{if(e.repeat)return;if($("startScreen").hidden===false&&["1","2","3"].includes(e.key)){e.preventDefault();const ids=Object.keys(colonies);start(ids[Number(e.key)-1]);return;}
    if(!state||state.ended)return;if(!isRevealed&&["a","b","c","1","2","3"].includes(e.key.toLowerCase())){const i={a:0,b:1,c:2,"1":0,"2":1,"3":2}[e.key.toLowerCase()];choose(i);}else if(isRevealed&&e.key==="Enter")continueYear();});

  function resizeCanvas(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const dpr=Math.min(2,window.devicePixelRatio||1);sceneWidth=rect.width;sceneHeight=rect.height;canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);drawScene();}
  if (typeof ResizeObserver === 'function') new ResizeObserver(resizeCanvas).observe(canvas);
  else window.addEventListener('resize', resizeCanvas);
  function roundedRect(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function tree(x,y,s,wind){ctx.save();ctx.translate(x,y);ctx.fillStyle="#765a3d";ctx.fillRect(-2*s,-1*s,4*s,18*s);ctx.fillStyle="#55765c";for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(wind*s,-(28+i*8)*s);ctx.lineTo(-18*s,(i*9-2)*s);ctx.lineTo(18*s,(i*9-2)*s);ctx.closePath();ctx.fill();}ctx.restore();}
  function house(x,y,s,style=0){const wall=["#dec89e","#d5b488","#b9956e","#e0d1b3"][style%4],roof=["#76584a","#6d5946","#9c684e"][style%3];ctx.fillStyle=wall;ctx.fillRect(x,y,43*s,30*s);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-5*s,y+2*s);ctx.lineTo(x+21*s,y-17*s);ctx.lineTo(x+49*s,y+2*s);ctx.closePath();ctx.fill();ctx.fillStyle="#675545";ctx.fillRect(x+18*s,y+14*s,8*s,16*s);ctx.fillStyle="#83a2a0";ctx.fillRect(x+5*s,y+10*s,7*s,7*s);ctx.fillRect(x+31*s,y+10*s,7*s,7*s);ctx.fillStyle="#413f37";ctx.fillRect(x+5*s,y+9*s,7*s,2*s);ctx.fillRect(x+31*s,y+9*s,7*s,2*s);}
  function person(x,y,s,t,idx){const walk=Math.sin(t*.002+idx*2)*2*s;ctx.fillStyle="#57483d";ctx.beginPath();ctx.arc(x,y-8*s,3*s,0,Math.PI*2);ctx.fill();ctx.fillStyle=["#9b5944","#536d65","#926d42"][idx%3];ctx.fillRect(x-2.5*s,y-5*s,5*s,9*s);ctx.strokeStyle="#554a3f";ctx.lineWidth=1.4*s;ctx.beginPath();ctx.moveTo(x-1*s,y+4*s);ctx.lineTo(x-2*s+walk,y+9*s);ctx.moveTo(x+1*s,y+4*s);ctx.lineTo(x+2*s-walk,y+9*s);ctx.stroke();}
  function drawScene(time=performance.now()){
    if(!state||!sceneWidth)return;const w=sceneWidth,h=sceneHeight,c=colonies[state.id],st=stageInfo(),r=state.resources, t=time;
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,state.weather==="Overcast"?"#aebdc0":"#a8c9cb");sky.addColorStop(.57,"#dae2d2");sky.addColorStop(1,"#a8b58c");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    // distant tree line and low hills
    ctx.fillStyle="#849b83";ctx.beginPath();ctx.moveTo(0,h*.56);for(let x=0;x<=w;x+=20)ctx.lineTo(x,h*.48+Math.sin(x*.015)*9);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    // water ribbon changes slightly by region
    const waterY=h*.59;ctx.fillStyle=state.id==="massachusetts"?"#799fa0":"#75999a";ctx.beginPath();ctx.moveTo(0,waterY);ctx.bezierCurveTo(w*.24,waterY-8,w*.2,waterY+22,w*.48,waterY+14);ctx.bezierCurveTo(w*.73,waterY+3,w*.76,waterY-4,w,waterY+10);ctx.lineTo(w,h*.76);ctx.lineTo(0,h*.76);ctx.fill();
    ctx.strokeStyle="#bfd0bd66";for(let i=0;i<5;i++){const x=((i*179+t*.018)%w);ctx.beginPath();ctx.moveTo(x,waterY+14+(i%3)*7);ctx.quadraticCurveTo(x+16,waterY+10+(i%3)*7,x+31,waterY+14+(i%3)*7);ctx.stroke();}
    // banks / grass
    ctx.fillStyle="#879d72";ctx.beginPath();ctx.moveTo(0,h*.68);ctx.quadraticCurveTo(w*.45,h*.7,w,h*.64);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    // soft paths
    ctx.strokeStyle="#c6b489";ctx.lineWidth=11;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(w*.5,h*.99);ctx.quadraticCurveTo(w*.52,h*.78,w*.43,h*.68);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle="#e0d1aa";ctx.stroke();
    // forest frame
    const forest=Math.max(3,9-Math.floor(new Set(state.buildings).size/2));for(let i=0;i<forest;i++){tree(14+i*33,h*.68-(i%2)*7,.58+(i%3)*.08,Math.sin(t*.001+i)*.4);tree(w-18-i*34,h*.66-(i%2)*8,.62+(i%3)*.08,Math.sin(t*.001+i+4)*.4);}
    // field rows
    const fields=state.buildings.includes("fields")||r.food>63; if(fields){ctx.fillStyle=state.id==="virginia"&&state.buildings.includes("tobacco")?"#69834e":"#c6a85f";ctx.save();ctx.translate(w*.70,h*.72);for(let row=0;row<4;row++){ctx.beginPath();ctx.ellipse(0,row*7,w*.105,4,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
    if(state.buildings.includes("tobacco")){ctx.fillStyle="#5c7650";for(let j=0;j<10;j++){let x=w*.64+(j%5)*12,y=h*.64+Math.floor(j/5)*9;ctx.fillRect(x,y,2,10);ctx.beginPath();ctx.ellipse(x-3,y+4,4,2,-.5,0,Math.PI*2);ctx.ellipse(x+4,y+6,4,2,.5,0,Math.PI*2);ctx.fill();}}
    // main settlement clustered by development
    const housesCount=1+Math.min(5,Math.floor((r.people-25)/15))+Math.min(2,Math.floor(new Set(state.buildings).size/2));
    const placements=[[.35,.67],[.47,.71],[.56,.65],[.31,.77],[.61,.75],[.43,.61],[.52,.79],[.27,.66]];
    for(let i=0;i<Math.max(1,housesCount);i++){const p=placements[i%placements.length];house(w*p[0],h*p[1],.72+(i%3)*.08,i);}
    // specific civic / market structures
    if(state.buildings.includes("meeting")){house(w*.38,h*.57,.92,3);ctx.fillStyle="#493f36";ctx.fillRect(w*.38+18,h*.57-22,5,13);}
    if(state.buildings.includes("storehouse")){ctx.fillStyle="#b58d59";ctx.fillRect(w*.6,h*.61,37,25);ctx.fillStyle="#6d5544";ctx.beginPath();ctx.moveTo(w*.59,h*.61);ctx.lineTo(w*.62,h*.59);ctx.lineTo(w*.65,h*.61);ctx.fill();ctx.fillRect(w*.62,h*.69,6,10);}
    if(state.buildings.includes("dock")||state.id==="massachusetts"&&state.turn>1){ctx.fillStyle="#755940";ctx.fillRect(w*.08,h*.65,w*.20,5);ctx.fillRect(w*.16,h*.65,5,h*.11);ctx.fillRect(w*.265,h*.65,5,h*.11);ctx.fillStyle="#815f45";ctx.beginPath();ctx.moveTo(w*.14,h*.64);ctx.lineTo(w*.20,h*.64);ctx.lineTo(w*.23,h*.67);ctx.lineTo(w*.11,h*.67);ctx.fill();ctx.strokeStyle="#ece0bd";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.17,h*.64);ctx.lineTo(w*.17,h*.54);ctx.lineTo(w*.22,h*.63);ctx.stroke();}
    if(state.buildings.includes("tobacco")&&state.id==="virginia"){ctx.fillStyle="#c49c61";ctx.fillRect(w*.79,h*.69,22,10);ctx.fillRect(w*.82,h*.65,18,12);}
    // chimney smoke
    for(let i=0;i<Math.min(4,housesCount);i++){const p=placements[i%placements.length],x=w*p[0]+15,y=h*p[1]-16;ctx.fillStyle="#665348";ctx.fillRect(x,y,4,9);ctx.strokeStyle="#f6f3e7a8";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+2,y);ctx.bezierCurveTo(x+6,y-8+Math.sin(t*.001+i)*2,x-3,y-13,x+3,y-19);ctx.stroke();}
    // tiny moving inhabitants
    const count=Math.min(8,Math.max(2,Math.floor(r.people/13)));for(let i=0;i<count;i++){const x=((i*77+t*.018*(i%2?1:-.6))%(w*.44))+w*.31;const y=h*(.79+(i%3)*.04);person(x,y,.8,t,i);}
    // weather cues, restrained
    if(state.weather==="Light rain"){ctx.strokeStyle="#d8e3e285";ctx.lineWidth=1;for(let i=0;i<45;i++){let x=(i*47+t*.11)%w,y=(i*61+t*.22)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+7);ctx.stroke();}}
    if(state.weather==="River breeze"){ctx.fillStyle="#f5f1d3";ctx.beginPath();ctx.arc(w*.82,h*.18,15,0,Math.PI*2);ctx.fill();}
  }
  function draw(t){if(!state)return;drawScene(t);anim=requestAnimationFrame(draw);}

  initPicker();
})();
