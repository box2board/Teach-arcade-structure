/* Panel Quest: subject-neutral scene graph, persistent model and comic renderer.
   Edition data is trusted authored content; student input is never HTML. */
(() => {
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function matches(state,rule={}){
  return Object.entries(rule.flags||{}).every(([k,v])=>state.flags[k]===v)
   &&(rule.clues||[]).every(id=>state.clues.includes(id))
   &&Object.entries(rule.min||{}).every(([k,v])=>(state.values[k]||0)>=v)
   &&Object.values(state.answers).filter(a=>a.solved&&a.wrong.length===0).length>=(rule.firstTry||0);
 }
 function validate(e){
  if(!e.id||!e.scenes?.[e.start]||!e.endings?.length)throw new Error('Edition needs an ID, start scene and endings.');
  const types=['question','decision','dialogue','investigation','ending'];
  for(const [id,s] of Object.entries(e.scenes)){
   if(!types.includes(s.type))throw new Error('Unknown scene type: '+id);
   for(const dest of [s.next,...(s.options||[]).map(o=>o.next)].filter(Boolean))if(!e.scenes[dest])throw new Error('Missing destination '+dest);
   if(['decision','dialogue'].includes(s.type)&&!s.options?.length)throw new Error('Missing choices '+id);
   if(s.type==='investigation'&&!s.items?.length)throw new Error('Missing investigation '+id);
   if(s.type==='question'&&(!s.question||s.question.answers.length!==4||!Number.isInteger(s.question.correctIndex)||s.question.correctIndex<0||s.question.correctIndex>3))throw new Error('Invalid question '+id);
   for(const clue of [s.clue,...(s.options||[]).map(o=>o.clue),...(s.items||[]).map(o=>o.clue)].filter(Boolean))if(!e.clues[clue])throw new Error('Unknown clue '+clue);
   if(s.type!=='ending'&&!s.next&&!s.options?.length)throw new Error('Dead end '+id);
  }
 }
 class Model{
  constructor(edition,saved){validate(edition);this.edition=edition;this.state={version:edition.version,scene:edition.start,clues:[],answers:{},flags:{},values:{},inspected:{},decisions:[],visited:[edition.start]};
   if(saved){this.checkSave(saved);this.state=clone(saved);}
  }
  checkSave(s){
   const e=this.edition;
   if(s.version!==e.version||!e.scenes[s.scene]||!Array.isArray(s.clues)||s.clues.some(id=>!e.clues[id])||!s.answers||!s.flags||!s.values||!s.inspected||!Array.isArray(s.decisions)||!Array.isArray(s.visited))throw new Error('Incompatible save');
   for(const [id,a] of Object.entries(s.answers)){
    if(e.scenes[id]?.type!=='question'||!Array.isArray(a.order)||a.order.length!==4||new Set(a.order).size!==4||a.order.some(i=>![0,1,2,3].includes(i))||!Array.isArray(a.wrong)||a.wrong.some(i=>![0,1,2,3].includes(i))||typeof a.solved!=='boolean')throw new Error('Invalid answer save');
   }
  }
  get scene(){return this.edition.scenes[this.state.scene];}
  get total(){return Object.values(this.edition.scenes).filter(s=>s.type==='question').length;}
  get stats(){const a=Object.values(this.state.answers);return {solved:a.filter(x=>x.solved).length,first:a.filter(x=>x.solved&&!x.wrong.length).length,retries:a.reduce((n,x)=>n+x.wrong.length,0)};}
  answerState(){if(this.scene.type!=='question')throw new Error('Not a question');return this.state.answers[this.state.scene]??= {order:shuffle([0,1,2,3]),wrong:[],solved:false};}
  addClue(id){if(id&&!this.state.clues.includes(id))this.state.clues.push(id);}
  answer(index){
   const a=this.answerState(),q=this.scene.question;
   if(a.solved||a.wrong.includes(index)||!a.order.includes(index))return {ignored:true};
   if(index!==q.correctIndex){a.wrong.push(index);return {correct:false};}
   a.solved=true;this.addClue(this.scene.clue);return {correct:true};
  }
  effects(e={}){Object.assign(this.state.flags,e.flags||{});for(const [k,v] of Object.entries(e.add||{}))this.state.values[k]=(this.state.values[k]||0)+v;}
  go(id){if(!this.edition.scenes[id])throw new Error('Unknown scene '+id);this.state.scene=id;this.state.visited.push(id);}
  choose(id){const option=this.scene.options?.find(o=>o.id===id&&matches(this.state,o.when));if(!option) return false;
   this.state.decisions.push({scene:this.state.scene,id,title:option.title});this.effects(option.effects);this.addClue(option.clue);this.go(option.next);return true;
  }
  inspect(id){const item=this.scene.items?.find(x=>x.id===id);if(!item)return false;const key=this.state.scene+':'+id;this.state.inspected[key]=true;this.addClue(item.clue);return true;}
  canAdvance(){if(this.scene.type==='question')return Boolean(this.state.answers[this.state.scene]?.solved);if(this.scene.type==='investigation')return this.scene.items.every(x=>x.optional||this.state.inspected[this.state.scene+':'+x.id]);return false;}
  advance(){if(!this.canAdvance())return false;this.go(this.scene.next);return true;}
  ending(){return this.edition.endings.find(e=>matches(this.state,e.when));}
 }
 const modelCount=e=>Object.values(e.scenes).filter(s=>s.type==='question').length;
 function mount(edition){
  const $=id=>document.getElementById(id);let model=null,saved=null,storage=true;
  const key='panel-quest:'+edition.id+':v'+edition.version;
  $('issueTitle').textContent=edition.title;
  $('notebookBtn').onclick=()=>{renderClues();$('notebook').showModal();};
  $('closeNotebook').onclick=()=>$('notebook').close();
  function save(){try{localStorage.setItem(key,JSON.stringify(model.state));}catch{storage=false;$('saveStatus').textContent='Progress cannot be saved in this browser. Keep this page open to finish your issue.';}}
  try{const raw=localStorage.getItem(key);if(raw){saved=JSON.parse(raw);new Model(edition,saved);}}catch{saved=null;storage=false;}
  function image(cell,cls=''){return '<img class="panel-art '+cls+'" src="'+esc(edition.art[cell]||edition.cover)+'" alt="'+esc(edition.artDescriptions?.[cell]||'Original comic illustration for this scene')+'">';}
  function focus(){const h=$('view').querySelector('h1,h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});}
  function status(){const st=model.stats;$('progressText').textContent=st.solved+' / '+model.total;$('bar').style.width=(model.total?100*st.solved/model.total:0)+'%';const pb=document.querySelector('[role="progressbar"]');pb.setAttribute('aria-valuemax',model.total);pb.setAttribute('aria-valuenow',st.solved);$('clueCount').textContent=model.state.clues.length;}
  function renderClues(){const ids=model.state.clues;$('clues').innerHTML=(model.state.decisions.length?'<section class="decision-trail"><h3>Your route so far</h3><ol>'+model.state.decisions.map(d=>'<li>'+esc(d.title)+'</li>').join('')+'</ol></section>':'')+(ids.length?ids.map(id=>{const c=edition.clues[id];return '<article class="evidence"><small>'+esc(c.kind)+' · '+esc(c.date)+'</small><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p></article>';}).join(''):'<p>Your evidence file is empty. Each review question and each inspected source adds a note here.</p>');}
  function comicStrip(scene){
   return (scene.panels||[]).length?'<div class="comic-strip">'+scene.panels.map(p=>'<figure class="detail-panel '+(p.kind==='document'?'document-panel':'')+'">'+(p.kind==='document'?'<div class="document-lines" aria-hidden="true"></div>':image(p.art))+'<figcaption><small>'+esc(p.label)+'</small><span>'+esc(p.afterAnswer&&!model.state.answers[model.state.scene]?.solved?p.beforeText:p.text)+'</span></figcaption></figure>').join('')+'</div>':'';
  }
  function memory(scene){
   const entry=(scene.callbacks||[]).find(c=>matches(model.state,c.when));
   return entry?'<aside class="route-memory"><strong>Your earlier choice matters</strong><span>'+esc(entry.text)+'</span></aside>':'';
  }
  function cover(){document.body.classList.remove('reader-active');model=null;$('notebookBtn').hidden=true;$('progressText').textContent='Ready';$('bar').style.width='0';document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow','0');
   $('view').innerHTML='<section class="pq-cover"><div class="cover-visual">'+image(0)+'<span class="cover-tag">'+esc(edition.issue)+' · '+esc(edition.dateRange)+'</span><div class="cover-lettering"><small>PANEL QUEST</small><strong>'+esc(edition.coverTitle)+'</strong><span>'+esc(edition.coverTagline)+'</span></div></div><div class="cover-copy"><div class="eyebrow">'+esc(edition.subtitle)+'</div><h1>'+esc(edition.title)+'</h1><p class="dek">'+esc(edition.description)+'</p><div class="pills"><span class="pill">'+modelCount(edition)+' review questions</span><span class="pill">Branching routes</span><span class="pill">'+edition.endings.length+' epilogues</span></div><p class="note-box">'+esc(edition.historicalNote)+'</p><div class="cover-actions">'+(saved?'<button class="primary" id="resume">Continue your issue →</button>':'')+'<button class="'+(saved?'secondary':'primary')+'" id="startBtn">'+(saved?'Start a new issue':'Open the issue →')+'</button></div><p class="keyboard-note">Click or tap to play. Use 1–4 for answers and choices, Enter to continue, and E for your evidence file.</p><div id="restartCheck"></div></div></section>';
   if(saved)$('resume').onclick=()=>{model=new Model(edition,saved);render();};
   $('startBtn').onclick=()=>{if(saved){$('restartCheck').innerHTML='<p>Start over and replace saved progress?</p><button class="primary" id="confirmRestart">Start over</button> <button class="secondary" id="cancelRestart">Keep my progress</button>';$('confirmRestart').onclick=start;$('cancelRestart').onclick=()=>{$('restartCheck').innerHTML='';$('startBtn').focus();};$('confirmRestart').focus();}else start();};
  }
  function start(){model=new Model(edition);saved=null;render();}
  function render(){
   document.body.classList.add('reader-active');
   const s=model.scene;status();$('notebookBtn').hidden=false;
   if(s.type==='ending'){renderEnd();save();focus();return;}
   $('view').innerHTML='<section class="pq-page layout-'+esc(s.layout||'split')+'"><div class="scene-head"><span>'+esc(s.date)+'</span><span class="issue">'+esc(edition.issue)+' · Page '+model.state.visited.length+'</span></div><h1 class="scene-title">'+esc(s.title)+'</h1><div class="page-body"><div class="visual-story"><figure class="hero-panel">'+image(s.art)+'<figcaption class="narration">'+esc(s.caption)+'</figcaption></figure><div class="speech"><span class="speaker">'+esc(s.speaker||edition.speaker)+'</span>'+esc(s.dialogue)+'</div>'+comicStrip(s)+memory(s)+'</div><div class="interaction" id="interaction"></div></div><div class="page-bottom"><span>'+esc(edition.pageFooter)+'</span><button class="text-btn" id="saveCover">Save &amp; return to cover</button></div></section>';
   const box=$('interaction');
   if(s.type==='question'){
    const a=model.answerState(),q=s.question;
    box.innerHTML='<div class="qmeta">Set the record straight · '+(model.stats.solved+(a.solved?0:1))+' / '+model.total+'</div><h2>'+esc(q.prompt)+'</h2><div class="answers">'+a.order.map((i,n)=>'<button class="answer '+(a.solved&&i===q.correctIndex?'right':a.wrong.includes(i)?'wrong':'')+'" data-answer="'+i+'" '+(a.solved||a.wrong.includes(i)?'disabled':'')+'><span class="letter">'+(n+1)+'</span>'+esc(q.answers[i])+'</button>').join('')+'</div><div id="feedback" class="feedback '+(a.solved?'':a.wrong.length?'error':'hidden')+'" role="status">'+(a.solved?'Evidence filed. '+esc(q.explanation):a.wrong.length?'Read the source again. '+esc(q.explanation):'')+'</div><div class="actions"><span class="hint">'+(a.solved?'You can review this clue in your evidence file.':'Choose 1–4. You can retry and keep reading.')+'</span><button class="primary" id="next" '+(!a.solved?'hidden':'')+'>Continue →</button></div>';
    box.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const result=model.answer(Number(b.dataset.answer));if(result.ignored)return;render();if(result.correct)$('next').focus();else{$('interaction').querySelector('[data-answer]:not(:disabled)')?.focus();}});
   }else if(s.type==='investigation'){
    box.innerHTML='<div class="qmeta">Inspect the source</div><h2>What does the evidence tell you?</h2><div class="inspect-list">'+s.items.map(x=>{const inspected=model.state.inspected[model.state.scene+':'+x.id];return '<button class="choice inspect" data-inspect="'+esc(x.id)+'" '+(inspected?'disabled':'')+'><strong>'+(inspected?'✓ Filed: ':'Inspect: ')+esc(x.title)+'</strong><span>'+(inspected?esc(x.text):'Open this source and add it to your evidence file.')+'</span></button>';}).join('')+'</div><p class="hint">Inspect each source to continue. These are fictional story documents, labeled in your evidence file.</p><button class="primary" id="next" '+(!model.canAdvance()?'hidden':'')+'>Return to the story →</button>';
    box.querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>{model.inspect(b.dataset.inspect);render();$('next')?.focus();});
   }else{
    box.innerHTML='<div class="qmeta">Your next move</div><h2>Choose your next action.</h2><div class="story-choices">'+s.options.filter(o=>matches(model.state,o.when)).map((o,n)=>'<button class="choice" data-choice="'+esc(o.id)+'"><strong>'+(n+1)+'. '+esc(o.title)+'</strong><span>'+esc(o.description)+'</span></button>').join('')+'</div><p class="hint">Your decision is kept when the routes rejoin.</p>';
    box.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(model.choose(b.dataset.choice))render();});
   }
   if($('next'))$('next').onclick=()=>{if(model.advance())render();};
   $('saveCover').onclick=()=>{save();saved=clone(model.state);cover();focus();};
   save();focus();
  }
  function renderEnd(){
   const e=model.ending(),st=model.stats;$('progressText').textContent='Complete';
   $('view').innerHTML='<section class="pq-ending"><div class="ending-art">'+image(e.art)+'<span class="cover-tag">'+esc(edition.issue)+' complete</span></div><div class="ending-copy"><div class="eyebrow">'+esc(edition.endingLabel)+'</div><h1>'+esc(e.title)+'</h1><p class="epilogue">'+esc(e.text)+'</p><div class="results"><div class="result"><b>'+st.first+' / '+model.total+'</b><small>First-try correct</small></div><div class="result"><b>'+model.state.clues.length+'</b><small>Evidence notes</small></div><div class="result"><b>'+st.retries+'</b><small>Corrections made</small></div></div><details class="summary"><summary>Your decisions and evidence</summary><ul>'+model.state.decisions.map(d=>'<li>'+esc(d.title)+'</li>').join('')+'</ul><p>'+esc(edition.ending?.finalFact)+'</p><p>All '+st.solved+' review questions were resolved. Revising an answer helped you keep reading.</p></details><p class="ending-reason"><strong>How this ending took shape</strong> '+esc(e.reason||'Your collected evidence and decisions shaped this ending.')+'</p><p class="replay-hint">'+esc(e.hint)+'</p><div class="actions"><button class="primary" id="replay">Read a different route ↻</button><button class="secondary" id="back">Back to cover</button></div><details class="sources"><summary>Context and sources</summary><p>'+esc(edition.sourceNote)+'</p>'+(edition.sources||[]).map(s=>'<p><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a></p>').join('')+'</details></div></section>';
   $('replay').onclick=start;$('back').onclick=()=>{saved=clone(model.state);cover();focus();};
  }
  document.addEventListener('keydown',event=>{
   if(event.ctrlKey||event.metaKey||event.altKey||event.repeat||event.target.matches('input,textarea,select'))return;
   if($('notebook').open)return;
   if(event.key.toLowerCase()==='e'&&model){event.preventDefault();$('notebookBtn').click();return;}
   if(!model)return;
   if(/^[1-4]$/.test(event.key)){
    const choices=[...$('interaction')?.querySelectorAll('[data-answer],[data-choice],[data-inspect]')||[]];const b=choices[Number(event.key)-1];if(b&&!b.disabled){event.preventDefault();b.click();}
   }else if(event.key==='Enter'&&!event.target.closest('button,a,summary')){const b=$('next');if(b&&!b.hidden){event.preventDefault();b.click();}}
  });
  cover();if(!storage)$('saveStatus').textContent='No compatible saved progress was loaded. You can still play this issue.';
  return {get model(){return model;}};
 }
 globalThis.PanelQuest={Model,matches,validate,mount};
})();
