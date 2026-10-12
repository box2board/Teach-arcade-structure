(() => {
  const KEY = 'ta-escape:long-road-west:v1';
  const chapters = ['The farm', 'The storm shed', 'Miles that cost something', 'Work is not a promise', 'A place to begin'];
  const historyNotes = [
    'The Dust Bowl was shaped by drought, wind erosion, and farming practices that left soil exposed. The Great Depression deepened the family’s financial strain.',
    'The shed, the East Fork bridge, and the bulletin are fictional. The family must compare current road information instead of assuming the shorter route is usable.',
    'Travelers could face breakdowns, scarce supplies, and difficult choices about helping others. A careful plan could help, but it could not control every hardship.',
    'Harvest work could be seasonal and uncertain. Advertisements and rumors were not guarantees of steady wages or safe living conditions.',
    'Migration could bring new opportunities, but reaching California did not guarantee work, housing, acceptance, or an easy recovery.'
  ];
  const fresh = () => ({ chapter: 0, packed: '', wire: false, water: false, map: false, bulletin: false, shutter: false, route: '', aid: '', handbill: false, worker: false, jobChoice: '', journal: ['The Millers leave their farm with what fits in the truck.'], complete: false, message: '', messageKind: 'info' });
  const read = () => { try { const saved = JSON.parse(localStorage.getItem(KEY)); return saved && Number.isInteger(saved.chapter) ? { ...fresh(), ...saved } : fresh(); } catch { return fresh(); } };
  let state = read();
  const $ = s => document.querySelector(s);
  const art = $('#sceneArt'), kicker = $('#sceneKicker'), title = $('#sceneTitle'), copy = $('#sceneCopy'), actions = $('#sceneActions'), feedback = $('#feedback'), history = $('#historyNote');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const note = value => { if (value && !state.journal.includes(value)) state.journal.push(value); save(); renderSide(); };
  function renderSide() {
    const rows = [
      ['packing', state.packed ? `Packed: ${state.packed}` : 'One family item to choose'],
      ['wire', 'Baling wire for the shutter'], ['water', 'Water canteen'], ['map', 'Road map'],
      ['bulletin', 'Current road bulletin'], ['shutter', 'Storm shutter secured'],
      ['route', state.route ? `Route selected: ${state.route}` : 'Passable route west']
    ];
    $('#supplyList').replaceChildren(...rows.map(([key, label]) => {
      const li = document.createElement('li');
      const done = key === 'packing' ? Boolean(state.packed) : key === 'route' ? Boolean(state.route) : Boolean(state[key]);
      if (done) li.classList.add('found'); li.textContent = label; return li;
    }));
    const journal = $('#journal');
    journal.replaceChildren(...state.journal.slice(-8).map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    const bar = $('#progressBar'), progress = Math.min(4, state.complete ? 4 : Math.max(0, state.chapter - 1));
    bar.style.width = `${progress * 25}%`;
    const track = $('.lrw-progress-track'); track.setAttribute('aria-valuenow', String(progress));
    $('#progressText').textContent = state.complete ? 'Journey complete · A place to begin' : `Chapter ${state.chapter + 1} of 5 · ${chapters[state.chapter]}`;
    $('#progressCount').textContent = `${progress} / 4 chapters`;
    history.textContent = historyNotes[state.complete ? 4 : state.chapter];
  }
  function setScene(id, label, heading, paragraphs) {
    art.className = `lrw-art art-${id}`;
    const artLabels = { farm:'A dry western Oklahoma farm under a dust-filled sky', shed:'Inside a roadside shed as a dust storm approaches', road:'A long, empty road across a dry landscape', camp:'A temporary migrant camp near a California work area', dawn:'A dusty sunrise over a new place to begin' };
    art.setAttribute('aria-label', artLabels[id] || 'A scene from the Miller family’s journey');
    art.innerHTML = '<div class="art-sun"></div><div class="art-haze"></div><div class="art-ridge"></div><div class="art-house"><i></i></div><div class="art-field"></div><div class="art-caption">' + escapeHtml(label) + '</div>';
    kicker.textContent = `CHAPTER ${state.chapter + 1} · ${label}`;
    title.textContent = heading;
    copy.replaceChildren(...paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
    actions.replaceChildren();
    feedback.textContent = state.message || '';
    feedback.dataset.kind = state.messageKind || 'info';
    feedback.hidden = !state.message;
  }
  function btn(label, action, options = {}) {
    const button = document.createElement('button'); button.type = 'button'; button.className = options.primary ? 'lrw-primary' : 'lrw-choice';
    button.textContent = label;
    if (options.pressed !== undefined) button.setAttribute('aria-pressed', String(options.pressed));
    button.addEventListener('click', action); actions.append(button); return button;
  }
  function grid() { const element = document.createElement('div'); element.className = 'lrw-action-grid'; actions.append(element); return element; }
  function feedbackText(text, kind = 'info') { state.message = text; state.messageKind = kind; feedback.textContent = text; feedback.dataset.kind = kind; feedback.hidden = false; save(); }
  function advance(text) { if (text) note(text); state.chapter++; state.message = ''; state.messageKind = 'info'; save(); render(); }
  function renderFarm() {
    setScene('farm','WESTERN OKLAHOMA · 1936','What can the family carry?',[
      'Ruth has packed food and water. The dry fields have brought little income, and another dust storm is building. The Millers are leaving for California to look for work.',
      'Thomas asks what they should load in the last open space. Choose one item the family will remember or rely on during the trip. There is no perfect answer.'
    ]);
    const options = grid();
    [['tools','Thomas’s tool roll'],['blanket','Sam’s extra blanket'],['keepsake','A framed family photograph']].forEach(([id,label]) => {
      const b=document.createElement('button'); b.type='button'; b.className='lrw-choice'; b.setAttribute('aria-pressed',String(state.packed===id));
      const t=document.createElement('span'); t.textContent=label; const mark=document.createElement('span'); mark.className='choice-mark'; mark.textContent=state.packed===id?'SELECTED':'CHOOSE'; b.append(t,mark);
      b.addEventListener('click',()=>{state.packed=id;save();render();}); options.append(b);
    });
    if(state.packed) btn('Leave the farm',()=>advance(`The family packs ${state.packed==='tools'?'Thomas’s tool roll':state.packed==='blanket'?'Sam’s extra blanket':'a family photograph'} and turns west.`),{primary:true});
  }
  function renderShed() {
    setScene('shed','ROADSIDE SHED · DUST STORM','Prepare before the storm arrives',[
      'The Millers take shelter at a roadside shed. A loose shutter is rattling in the wind. They need water, a route map, and a current road notice before they can leave safely.',
      'Inspect each object below. The map and bulletin must be compared before choosing a road.'
    ]);
    const options=grid();
    const items=[
      ['tool bench',state.wire?'Wire collected':'Find baling wire',()=>{state.wire=true;note('Evie found usable baling wire beneath the tool bench.');feedbackText('The wire can brace the loose shutter.','success');save();renderSide();renderShed();}],
      ['supply shelf',state.water?'Canteen packed':'Take the water canteen',()=>{state.water=true;note('Ruth packs a canteen of water for the next stretch.');feedbackText('The canteen gives the family water for the road.','success');save();renderSide();renderShed();}],
      ['road map',state.map?'Map checked':'Inspect and take the map',()=>{state.map=true;note('The map marks a shorter county-road cut near the East Fork.');feedbackText('The map shows a shortcut, but it cannot confirm that the bridge is open. Check the bulletin.','success');save();renderSide();renderShed();}],
      ['road bulletin',state.bulletin?'Bulletin checked':'Read the road bulletin',()=>{state.bulletin=true;note('The bulletin reports the East Fork bridge closed; Route 66 remains open.');feedbackText('The East Fork bridge is closed. Route 66 westbound remains open, though it adds distance.','success');save();renderSide();renderShed();}],
      ['loose shutter',state.shutter?'Shutter secured':state.wire?'Brace the shutter':'Inspect the loose shutter',()=>{if(!state.wire){feedbackText('The shutter needs something strong to hold it. Search the tool bench.');return;}state.shutter=true;note('Thomas secures the shutter with baling wire so the family can wait out the worst of the storm.');feedbackText('The wire holds. The family can shelter here until the worst gusts pass.','success');save();renderSide();renderShed();}]
    ];
    items.forEach(([name,label,action])=>{const b=document.createElement('button');b.type='button';b.className='lrw-choice';b.innerHTML=`<span>${escapeHtml(name)}</span><span class="choice-mark">${escapeHtml(label)}</span>`;b.addEventListener('click',action);options.append(b);});
    if(state.map&&state.bulletin){
      const routeTitle=document.createElement('p');routeTitle.className='lrw-inline-label';routeTitle.textContent='Choose a westbound route';actions.append(routeTitle);
      btn('Take the county-road shortcut',()=>{state.route='';save();feedbackText('The bulletin says the East Fork bridge is closed. The shortcut cannot cross. No time is lost—review the evidence and choose a passable road.','error');renderSide();renderShed();});
      btn('Follow Route 66 · open, but longer',()=>{state.route='Route 66';note('The family chooses the longer open highway after checking the current road bulletin.');save();feedbackText('Route 66 is open. The family can continue when the shutter is secure and the supplies are packed.','success');renderSide();renderShed();});
    }
    if(state.wire&&state.water&&state.map&&state.bulletin&&state.shutter&&state.route){btn('Wait for the storm to pass',()=>advance('The Millers wait out the worst of the storm, then return to their truck and follow Route 66 west.'),{primary:true});}
  }
  function renderRoad() {
    const opening=state.packed==='tools'?'Thomas uses the tool roll to tighten a loose clamp.':state.packed==='blanket'?'Sam wraps up in the extra blanket while they wait for the road to clear.':state.packed==='keepsake'?'Evie keeps the family photograph safe in Ruth’s ledger.':'The family keeps moving carefully along the highway.';
    setScene('road','ROUTE 66 · WESTBOUND','Miles that cost something',[
      `${opening} Fuel, daylight, and water are limited. On the road, the Millers meet another traveler whose tire has failed.`,
      'Ruth wants to help, but the family cannot know when it will find its next water stop. Decide whether to share a cup or keep the canteen full for the children.'
    ]);
    btn('Share a cup and offer a hand',()=>{state.aid='shared';note('The family shares a cup of water and helps a stranded traveler. In return, they hear where a reliable service stop may be found.');feedbackText('They lose a little water but gain useful directions—and a reminder that travelers sometimes rely on one another.','success');renderSide();renderRoad();});
    btn('Keep the water for the family',()=>{state.aid='kept';note('The family keeps its water. Ruth records the next service stop from the road map and plans to refill there.');feedbackText('The canteen stays with the children. The family continues with less information, but the choice protects a scarce supply.','success');renderSide();renderRoad();});
    if(state.aid) btn('Continue toward the work camps',()=>advance('The family follows the road west. The choice to share—or conserve—water becomes part of Ruth’s record.'),{primary:true});
  }
  function renderWork() {
    setScene('camp','CALIFORNIA · SEASONAL WORK AREA','A handbill is not a promise',[
      'The Millers reach a work area in California. A handbill advertises harvest jobs, but it does not say how long the work will last or what the living conditions will be.',
      'Before deciding what to do, read the handbill and speak with a worker who has been here longer.'
    ]);
    const options=grid();
    const h=document.createElement('button');h.type='button';h.className='lrw-choice';h.innerHTML=`<span>Read the handbill</span><span class="choice-mark">${state.handbill?'READ':'INSPECT'}</span>`;h.addEventListener('click',()=>{state.handbill=true;note('A handbill advertises harvest work but leaves wages, duration, and living conditions unclear.');feedbackText('The notice promises a chance at work. It does not guarantee steady hours or a place to stay.','success');save();renderSide();renderWork();});options.append(h);
    const w=document.createElement('button');w.type='button';w.className='lrw-choice';w.innerHTML=`<span>Ask a worker about the offer</span><span class="choice-mark">${state.worker?'ASKED':'TALK'}</span>`;w.addEventListener('click',()=>{state.worker=true;note('A worker explains that harvest work can be seasonal and that families should ask about pay, timing, and camp conditions.');feedbackText('The worker says crops and hiring needs change. New arrivals should ask what is actually being offered.','success');save();renderSide();renderWork();});options.append(w);
    if(state.handbill&&state.worker){
      const prompt=document.createElement('p');prompt.className='lrw-inline-label';prompt.textContent='What should the family do next?';actions.append(prompt);
      btn('Treat the handbill as a guarantee and leave other options behind',()=>{state.jobChoice='trust';note('The family follows the handbill, then discovers the work is temporary and uncertain.');feedbackText('The Millers find a short-term job, but not the security the handbill seemed to promise. They will need another plan when the harvest ends.','error');save();renderSide();renderWork();});
      btn('Ask about wages, timing, and camp conditions before relying on the offer',()=>{state.jobChoice='ask';note('The family asks about the actual offer and keeps looking for reliable information before making a longer-term plan.');feedbackText('The questions do not guarantee steady work, but they help the family understand the limits of this offer.','success');save();renderSide();renderWork();});
    }
    if(state.jobChoice) btn('Make a plan for the next morning',()=>advance('The Millers find a temporary place to rest and plan to ask about water, work, and repairs in the morning.'),{primary:true});
  }
  function renderFinish() {
    setScene('dawn','CALIFORNIA · FIRST MORNING','A place to begin',[
      'The Millers reach California together. Their truck is worn, their supplies are low, and the family still needs to find dependable work and a place to stay.',
      'Ruth writes one last question in the family ledger: what does this journey show about migration during the Great Depression?'
    ]);
    const final=document.createElement('div');final.className='lrw-final';
    const h=document.createElement('p');h.className='lrw-inline-label';h.textContent='Choose the strongest historical conclusion';final.append(h);actions.append(final);
    const options=[
      ['arrival','Reaching California immediately ended the family’s economic hardship.'],
      ['nuance','Drought and economic hardship pushed families to move, but arrival did not guarantee steady work or security.'],
      ['choice','Every family migrated for the same reason, and careful choices could control the outcome.']
    ];
    options.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='lrw-choice';b.textContent=label;b.addEventListener('click',()=>{if(id!=='nuance'){feedbackText('Think about the worker’s warning and the uncertainty the family still faces after arriving. Try again.','error');return;}state.complete=true;note('Conclusion: migration offered a possibility, not a guarantee. Families faced hardship before, during, and after the journey.');save();render();});actions.append(b);});
  }
  function renderComplete() {
    art.className='lrw-art art-dawn';art.setAttribute('aria-label','Sunrise over the family’s new camp in California');art.innerHTML='<div class="art-sun"></div><div class="art-haze"></div><div class="art-ridge"></div><div class="art-house"><i></i></div><div class="art-field"></div><div class="art-caption">THE JOURNEY CONTINUES</div>';
    kicker.textContent='MISSION COMPLETE · FIELD JOURNAL CLOSED';title.textContent='The road brought them here. The story continues.';
    copy.innerHTML=`<div class="lrw-final"><h3>What the evidence shows</h3><p>The Dust Bowl and Great Depression shaped the Millers’ decision to leave. The family made choices about supplies, safety, and helping others, but those choices could not remove the larger economic and environmental pressures they faced.</p><p>Reaching California created new possibilities—and new uncertainty. Work could be seasonal, housing was not guaranteed, and migrants’ experiences differed. The Millers have survived the trip; their next task is to build a life one day at a time.</p><div class="lrw-final-note"><span class="lrw-inline-label">YOUR JOURNEY RECORD</span><ul><li>Last item packed: ${escapeHtml(state.packed||'not recorded')}</li><li>Roadside choice: ${state.aid==='shared'?'shared water and helped a traveler':'kept water for the family'}</li><li>Work decision: ${state.jobChoice==='ask'?'asked questions before relying on a job offer':'trusted a handbill and learned the work was temporary'}</li></ul></div><p><strong>Historical thinking:</strong> Individual choices matter, but history is also shaped by forces families cannot control.</p></div>`;
    actions.replaceChildren();const a=document.createElement('a');a.className='lrw-primary';a.href='/escape/';a.textContent='Explore other escape room missions';actions.append(a);
  }
  function render() {
    renderSide();
    if(state.complete){renderComplete();return;}
    if(state.chapter===0)renderFarm();else if(state.chapter===1)renderShed();else if(state.chapter===2)renderRoad();else if(state.chapter===3)renderWork();else renderFinish();
  }
    $('#restartBtn').addEventListener('click',()=>{if(!window.confirm('Restart the Miller family’s journey from the beginning?'))return;state=fresh();save();render();});
  render();
})();
