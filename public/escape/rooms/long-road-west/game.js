(() => {
  const KEY = 'ta-escape:long-road-west:v2';
  const chapterNames = ['The farm', 'The storm shed', 'Miles that cost something', 'Work is not a promise', 'A place to begin'];
  const historyNotes = [
    'The Dust Bowl grew from drought, wind erosion, and farming practices that left soil exposed. The Great Depression deepened the Millers’ financial strain.',
    'The shed, East Fork bridge, and bulletin are fictional. The family compares a road map with a current notice before choosing a passable route.',
    'Breakdowns, scarce water, and uncertain travel made migration difficult. Neighbors and strangers sometimes depended on one another.',
    'Harvest jobs could be seasonal. A handbill could advertise work without guaranteeing steady wages, hours, or safe housing.',
    'Migrants’ experiences varied. Reaching California could open possibilities, but it did not guarantee work, housing, or an easy recovery.'
  ];
  const fresh = () => ({chapter:0,packed:'',wire:false,water:false,map:false,bulletin:false,compared:false,shutter:false,route:'',aid:'',handbill:false,worker:false,jobChoice:'',complete:false,journal:['The Millers leave their farm with what fits in the truck.'],message:'',messageKind:'info'});
  const read = () => { try { const v=JSON.parse(localStorage.getItem(KEY)); return v&&Number.isInteger(v.chapter)?{...fresh(),...v}:fresh(); } catch { return fresh(); } };
  let state=read(), selected='';
  const $=s=>document.querySelector(s), scene=$('#scene'), layer=$('#hotspots'), feedback=$('#feedback'), ghost=$('#dragGhost');
  const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
  const note=text=>{if(text&&!state.journal.includes(text))state.journal.push(text);save();renderSide();};
  const message=(text,kind='info')=>{state.message=text;state.messageKind=kind;save();renderFeedback();};
  function renderFeedback(){feedback.textContent=state.message||'';feedback.dataset.kind=state.messageKind||'info';feedback.hidden=!state.message;}
  function renderSide(){
    $('#journal').replaceChildren(...state.journal.slice(-7).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    const progress=state.complete?5:state.chapter;
    $('#progressBar').style.width=`${progress*20}%`;
    const track=$('.lrw-progress-track');track.setAttribute('aria-valuenow',String(progress));
    $('#progressText').textContent=state.complete?'Journey complete · A place to begin':`Chapter ${state.chapter+1} of 5 · ${chapterNames[state.chapter]}`;
    $('#progressCount').textContent=`${progress} / 5 chapters`;
    $('#historyNote').textContent=historyNotes[state.complete?4:state.chapter];
    $('#sceneChapterMark').textContent=`${String(Math.min(state.chapter+1,5)).padStart(2,'0')} / 05`;
    const items=[];
    if(state.packed){const labels={tools:['🧰','Thomas’s tools'],blanket:['▰','Sam’s blanket'],keepsake:['▣','Family photograph']};items.push([state.packed,...labels[state.packed]]);}
    if(state.wire)items.push(['wire','⌁','Baling wire']);if(state.water)items.push(['water','◉','Water canteen']);if(state.map)items.push(['map','▤','Road map']);if(state.bulletin)items.push(['bulletin','▧','Road bulletin']);
    $('#pocketCount').textContent=`${items.length} ${items.length===1?'item':'items'}`;
    const inventory=$('#inventory');inventory.replaceChildren();
    if(!items.length){const empty=document.createElement('span');empty.className='lrw-empty-pocket';empty.textContent='Nothing picked up yet';inventory.append(empty);}
    for(const [id,icon,label] of items){const b=document.createElement('button');b.type='button';b.className='lrw-item';b.dataset.item=id;b.setAttribute('aria-pressed',String(selected===id));b.innerHTML=`<span aria-hidden="true">${icon}</span><span>${escapeHtml(label)}</span>`;b.addEventListener('click',()=>{selected=selected===id?'':id;message(selected?`Selected ${itemById(id)}. Place it on a highlighted part of the scene.`:'');render();});b.addEventListener('pointerdown',beginDrag);inventory.append(b);}
  }
  function setupScene(id,location,objective,kicker,title,paragraphs,hint){
    scene.className=`lrw-scene-view art-${id}`;
    scene.style.setProperty('--scene-image',`url("/escape/rooms/long-road-west/assets/${id}.webp")`);
    $('#sceneLocation').textContent=location;$('#sceneObjective').textContent=objective;
    $('#sceneKicker').textContent=`CHAPTER ${state.chapter+1} · ${location.split(' · ')[0]}`;
    $('#sceneTitle').textContent=title;$('#sceneHint').textContent=hint;
    $('#sceneCopy').replaceChildren(...paragraphs.map(t=>{const p=document.createElement('p');p.textContent=t;return p;}));
    layer.replaceChildren();$('#continueBtn').hidden=true;renderFeedback();
  }
  function hotspot({id,x,y,icon,label,target=false,alsoItem=false,done=false,hidden=false,action,useSelected=false,draggable=false}){
    const b=document.createElement('button');b.type='button';b.className=`lrw-hotspot${target?' is-target':''}${done?' is-done':''}${hidden?' is-hidden':''}${selected===id?' is-selected':''}`;
    b.style.setProperty('--x',`${x}%`);b.style.setProperty('--y',`${y}%`);b.setAttribute('aria-label',label);b.setAttribute('title',label);
    if(target)b.dataset.target=id;if(!target||alsoItem)b.dataset.item=id;
    b.innerHTML=`<span class="hotspot-core" aria-hidden="true">${icon}</span><span class="hotspot-label" aria-hidden="true">${escapeHtml(label)}</span>`;
    if(action)b.addEventListener('click',()=>{if(target&&selected&&useSelected)apply(selected,id);else action();});else b.addEventListener('click',()=>{
      if(target){if(selected)apply(selected,id);else message(`Choose an object to use with “${label}.”`);return;}
      if(state.chapter===0){selected=selected===id?'':id;message(selected?`Move ${label.toLowerCase()} to the open truck bed.`:'Choose a family item.');render();return;}
      collect(id);
    });
    if((draggable||!target||alsoItem)&&!(target&&selected))b.addEventListener('pointerdown',beginDrag);
    layer.append(b);return b;
  }
  function continueWhen(ok){if(!ok)return;const b=$('#continueBtn');b.hidden=false;b.onclick=()=>{state.chapter++;state.message='';state.messageKind='info';selected='';save();render();};}
  function collect(id){
    if(id==='wire'&&!state.wire){state.wire=true;selected='wire';note('Evie finds baling wire beneath the shed’s workbench.');message('The wire is light enough to carry. Drag it to the loose shutter.', 'success');}
    else if(id==='water'&&!state.water){state.water=true;selected='water';note('Ruth fills the canteen for the next stretch of road.');message('The family has water to carry west.','success');}
    else if(id==='map'&&!state.map){state.map=true;selected='map';note('The map shows a short county-road cut near the East Fork.');message('The map shows a shortcut. It cannot tell whether the bridge is open.','success');}
    else if(id==='bulletin'&&!state.bulletin){state.bulletin=true;selected='bulletin';note('The bulletin reports the East Fork bridge closed; Route 66 remains open.');message('Read the bulletin, then drag the map onto it to compare the two clues.','success');}
    else {selected=id;message('That object is already in the family’s record. Select it below to use it.');}
    render();
  }
  function renderFarm(){
    setupScene('farm','WESTERN OKLAHOMA · 1936','Choose one item to pack','THE FARM','A place for one more thing',[
      'The dry fields have brought little income. Another dust storm is building, and the Millers are leaving for California to look for work.',
      'Only one item fits in the truck’s open bed. Drag a family object to the truck. Each choice says something different about what the family needs or wants to remember.'
    ],selected?'Now place your choice in the truck bed.':'Drag an object to the open truck bed.');
    hotspot({id:'tools',x:16,y:69,icon:'⚒',label:'Thomas’s tool roll',done:state.packed==='tools'});
    hotspot({id:'blanket',x:35,y:72,icon:'▰',label:'Sam’s extra blanket',done:state.packed==='blanket'});
    hotspot({id:'keepsake',x:25,y:49,icon:'▣',label:'Framed family photograph',done:state.packed==='keepsake'});
    hotspot({id:'truck',x:80,y:65,icon:state.packed?'✓':'＋',label:state.packed?'Item packed':'Open truck bed',target:true,done:!!state.packed});
    continueWhen(!!state.packed);
  }
  function renderShed(){
    setupScene('shed','ROADSIDE SHED · DUST STORM',state.compared?'Secure the shelter and choose the open road':'Gather supplies and compare the road clues','THE STORM SHED','Read the room before the storm hits',[
      'A roadside shed gives the family shelter, but a loose shutter rattles in the wind. Find the canteen, map, road notice, and baling wire in the room.',
      'Use the wire on the shutter. Then drag the map onto the bulletin to compare the shortcut with current road conditions.'
    ],'Pick up the objects in the scene. Drag the wire to the shutter and map to the bulletin.');
    hotspot({id:'water',x:12,y:25,icon:'◉',label:'Metal water canteen',done:state.water});
    hotspot({id:'map',x:35,y:30,icon:'▤',label:'Folded road map',done:state.map});
    hotspot({id:'bulletin',x:37,y:20,icon:'▧',label:'Road bulletin',done:state.bulletin});
    hotspot({id:'wire',x:87,y:70,icon:'⌁',label:'Coil of baling wire',done:state.wire});
    hotspot({id:'shutter',x:63,y:55,icon:state.shutter?'✓':'⌑',label:state.shutter?'Shutter secured':'Loose shutter',target:true,done:state.shutter});
    if(state.map&&state.bulletin&&!state.compared)hotspot({id:'bulletin',x:37,y:20,icon:'▧',label:'Drop map here to compare',target:true});
    if(state.compared){hotspot({id:'shortcut',x:54,y:57,icon:'↘',label:'County-road shortcut · bridge closed',target:true,action:()=>{message('The bulletin says the East Fork bridge is closed. The shortcut cannot cross. Choose the open Route 66 marker.','error');}});hotspot({id:'route66',x:76,y:55,icon:'66',label:'Route 66 · open, longer',target:true,action:()=>{state.route='Route 66';note('The Millers choose the longer open highway after comparing the road evidence.');message('Route 66 is open. Secure the shutter and pack the supplies before leaving.','success');render();}});}
    if(state.wire&&state.water&&state.map&&state.bulletin&&state.compared&&state.shutter&&state.route){continueWhen(true);}
  }
  function renderRoad(){
    setupScene('road','ROUTE 66 · WESTBOUND','Decide where the canteen goes','MILES THAT COST SOMETHING','A choice at the roadside',[
      'Fuel, daylight, and water are limited. The Millers meet a traveler whose bicycle tire has failed on the road shoulder.',
      'Drag the canteen to the traveler to share water and offer help, or return it to the family’s supplies. Neither choice removes the uncertainty of the road.'
    ],selected==='water'?'Place the canteen with the traveler or keep it with the family.':'Select the canteen below, then place it in the scene.');
    hotspot({id:'traveler',x:77,y:61,icon:'＋',label:'Traveler with a punctured tire',target:true,done:state.aid==='shared'});
    hotspot({id:'family',x:24,y:65,icon:'⌂',label:'Keep water with the family',target:true,done:state.aid==='kept'});
    continueWhen(!!state.aid);
  }
  function renderWork(){
    setupScene('camp','CALIFORNIA · SEASONAL WORK AREA','Inspect the offer before making a plan','WORK IS NOT A PROMISE','A handbill is not a guarantee',[
      'The Millers reach a California work camp. A handbill advertises harvest jobs, but leaves the hours, pay, and living conditions unclear.',
      'Read the handbill and speak with a worker. Then drag Ruth’s ledger to the worker to ask about the offer—or to the handbill to trust it as written.'
    ],'Inspect both clues, then move the ledger to the person or the notice.');
    hotspot({id:'handbill',x:82,y:30,icon:'▧',label:'Harvest work handbill',target:true,useSelected:true,done:state.handbill,action:()=>{if(!state.handbill){state.handbill=true;note('The handbill advertises harvest work but does not spell out wages, duration, or camp conditions.');message('The notice advertises a chance at work. It does not guarantee steady hours or housing.','success');render();}else message('The handbill is evidence. Use Ruth’s ledger to decide what to do with the offer.');}});
    hotspot({id:'worker',x:67,y:61,icon:'◉',label:'Speak with an experienced worker',target:true,useSelected:true,done:state.worker,action:()=>{if(!state.worker){state.worker=true;note('A worker explains that harvest jobs depend on the crop and hiring needs.');message('The worker says new arrivals should ask what is actually offered. The work may be temporary.','success');render();}else message('The worker has shared what they know. Bring Ruth’s ledger here to ask about the offer.');}});
    hotspot({id:'ledger',x:23,y:69,icon:'▤',label:'Ruth’s family ledger',hidden:!(state.handbill&&state.worker),done:!!state.jobChoice});
    continueWhen(!!state.jobChoice);
  }
  function renderFinish(){
    setupScene('dawn','CALIFORNIA · FIRST MORNING','Drag the ledger to the strongest conclusion','A PLACE TO BEGIN','What does the journey show?',[
      'The Millers reach California together. Their truck is worn, supplies are low, and they still need dependable work and a place to stay.',
      'Ruth records one final conclusion. Move the ledger to the statement best supported by the journey.'
    ],'Place the family ledger on the conclusion that fits the evidence.');
    hotspot({id:'claim-arrival',x:19,y:68,icon:'1',label:'Arrival ended the hardship',target:true,useSelected:true,action:()=>{if(selected!=='ledger'){message('Select Ruth’s ledger first.');return;}selected='';message('The worker’s warning and the family’s low supplies show that arrival did not end their hardship. Try another statement.','error');render();}});
    hotspot({id:'claim-nuance',x:50,y:66,icon:'2',label:'Migration offered a chance, not a guarantee',target:true,useSelected:true,action:()=>{if(selected!=='ledger'){message('Select Ruth’s ledger first.');return;}selected='';state.complete=true;note('Conclusion: migration offered a possibility, not a guarantee. Environmental and economic forces shaped the journey, while each family made its own choices.');save();render();}});
    hotspot({id:'claim-same',x:81,y:68,icon:'3',label:'All families migrated for the same reason',target:true,useSelected:true,action:()=>{if(selected!=='ledger'){message('Select Ruth’s ledger first.');return;}selected='';message('Migrant experiences varied. The family’s choices mattered, but could not control drought, job markets, or conditions at the camps. Try another statement.','error');render();}});
  }
  function renderComplete(){
    scene.className='lrw-scene-view art-dawn';scene.style.setProperty('--scene-image','url("/escape/rooms/long-road-west/assets/dawn.webp")');$('#sceneLocation').textContent='CALIFORNIA · FIRST MORNING';$('#sceneObjective').textContent='THE JOURNEY CONTINUES';$('#sceneKicker').textContent='MISSION COMPLETE · FIELD JOURNAL CLOSED';$('#sceneTitle').textContent='The road brought them here. The story continues.';
    $('#sceneCopy').innerHTML='<p>The Dust Bowl and Great Depression shaped the Millers’ decision to leave. The family made choices about supplies, safety, and helping others, but those choices could not remove the larger economic and environmental pressures they faced.</p><p>Reaching California created new possibilities—and new uncertainty. Work could be seasonal, housing was not guaranteed, and migrants’ experiences differed. The Millers survived the trip; their next task is to build a life one day at a time.</p>';
    $('#sceneHint').textContent='Your evidence-based conclusion is recorded.';layer.replaceChildren();$('#continueBtn').hidden=true;
    const copy=document.createElement('div');copy.className='lrw-complete-card';copy.innerHTML=`<span class="lrw-kicker">YOUR JOURNEY RECORD</span><p>Last item packed: <strong>${escapeHtml(state.packed||'not recorded')}</strong></p><p>Roadside choice: <strong>${state.aid==='shared'?'shared water and helped a traveler':'kept water for the family'}</strong></p><p>Work decision: <strong>${state.jobChoice==='ask'?'asked questions before relying on the offer':'trusted the handbill and found temporary work'}</strong></p><p><strong>Historical thinking:</strong> individual choices matter, and history is also shaped by forces families cannot control.</p>`;$('#sceneCopy').append(copy);
    renderFeedback();
  }
  function render(){
    renderSide();
    if(state.complete){renderComplete();return;}
    if(state.chapter===0)renderFarm();else if(state.chapter===1)renderShed();else if(state.chapter===2)renderRoad();else if(state.chapter===3)renderWork();else renderFinish();
    renderInventorySelection();
  }
  function renderInventorySelection(){document.querySelectorAll('.lrw-item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.item===selected)));}
  function itemById(id){const items={tools:'Thomas’s tools',blanket:'Sam’s blanket',keepsake:'Family photograph',wire:'Baling wire',water:'Water canteen',map:'Road map',bulletin:'Road bulletin',ledger:'Ruth’s ledger'};return items[id]||id;}
  function beginDrag(e){
    if(e.button!==undefined&&e.button!==0)return;
    e.preventDefault();
    const el=e.currentTarget,id=el.dataset.item;if(!id)return;
    const startX=e.clientX,startY=e.clientY;let moved=false;
    const onMove=ev=>{if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>7)moved=true;if(!moved)return;selected=id;ghost.innerHTML=`<span>${el.querySelector('.hotspot-core')?.textContent||'✦'}</span>${escapeHtml(itemById(id))}`;ghost.classList.add('visible');ghost.style.left=`${ev.clientX}px`;ghost.style.top=`${ev.clientY}px`;};
    const onUp=ev=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);ghost.classList.remove('visible');if(!moved){el.click();return;}const dest=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.lrw-hotspot[data-target]');if(dest){apply(id,dest.dataset.target);}else{selected=id;message(`Selected ${itemById(id)}. Drop it on a highlighted object, or click a destination.`);render();}};
    window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp,{once:true});
  }
  function apply(item,target){
    if(state.chapter===0&&target==='truck'){
      if(!['tools','blanket','keepsake'].includes(item)){message('Choose a family item from the farm scene first.');return;}
      state.packed=item;selected='';note(`The family packs ${item==='tools'?'Thomas’s tool roll':item==='blanket'?'Sam’s extra blanket':'a framed family photograph'} into the truck.`);message('Packed. The truck has room for one more family item.','success');render();continueWhen(true);return;
    }
    if(state.chapter===1&&item==='wire'&&target==='shutter'){
      state.shutter=true;selected='';note('Thomas braces the rattling shutter with baling wire.');message('The shutter holds against the wind.','success');render();return;
    }
    if(state.chapter===1&&item==='map'&&target==='bulletin'){
      if(!state.map||!state.bulletin){message('Collect both the map and the bulletin first.');return;}state.compared=true;selected='';note('The map and bulletin reveal that the East Fork bridge is closed while Route 66 is open.');message('The clues match: the shortcut crosses a closed bridge; Route 66 is passable, but longer.','success');render();return;
    }
    if(state.chapter===2&&item==='water'&&(target==='traveler'||target==='family')){
      state.aid=target==='traveler'?'shared':'kept';selected='';
      if(state.aid==='shared'){note('The Millers share water and help a stranded traveler, who points them toward a reliable service stop.');message('A little water is gone; useful directions and a small act of help take its place.','success');}
      else{note('The Millers keep their water for the children and mark the next service stop on their map.');message('The canteen stays with the family. Ruth marks the next service stop.','success');}
      render();continueWhen(true);return;
    }
    if(state.chapter===3&&item==='ledger'&&(target==='worker'||target==='handbill')){
      state.jobChoice=target==='worker'?'ask':'trust';selected='';
      if(state.jobChoice==='ask'){note('The family asks about wages, timing, and camp conditions before relying on the harvest offer.');message('The worker explains that the harvest is temporary. Questions help the family judge the offer, but cannot promise steady work.','success');}
      else{note('The family trusts the handbill and finds short-term harvest work, but no lasting security.');message('The handbill leads to a temporary job. When the harvest ends, the family will need another plan.','error');}
      render();continueWhen(true);return;
    }
    if(state.chapter===4&&item==='ledger'){
      selected='';
      if(target==='claim-nuance'){state.complete=true;note('Conclusion: migration offered a possibility, not a guarantee. Environmental and economic forces shaped the journey, while each family made its own choices.');save();render();return;}
      message(target==='claim-arrival'?'The worker’s warning and the family’s low supplies show that arrival did not end their hardship. Try another statement.':'Migrant experiences varied. Family choices mattered, but could not control drought, job markets, or camp conditions. Try another statement.','error');render();return;
    }
    message('That object does not fit there. Try another target.','error');
  }
  $('#restartBtn').addEventListener('click',()=>{if(!window.confirm('Restart the Miller family’s journey from the beginning?'))return;state=fresh();selected='';save();render();});
  render();
})();
