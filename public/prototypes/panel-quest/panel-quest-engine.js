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
  const types=['question','decision','dialogue','investigation','publication','ending'];
  for(const [id,s] of Object.entries(e.scenes)){
   if(!types.includes(s.type))throw new Error('Unknown scene type: '+id);
   for(const dest of [s.next,...(s.options||[]).map(o=>o.next)].filter(Boolean))if(!e.scenes[dest])throw new Error('Missing destination '+dest);
   if(['decision','dialogue'].includes(s.type)&&!s.options?.length)throw new Error('Missing choices '+id);
   if(s.type==='publication'&&(!s.claims?.length||s.claims.some(c=>!c.id||!c.accept?.length||c.accept.some(id=>!e.clues[id]))))throw new Error('Invalid publication '+id);
   if(s.type==='investigation'&&!s.items?.length)throw new Error('Missing investigation '+id);
   if(s.type==='question'&&(!s.question||s.question.answers.length!==4||!Number.isInteger(s.question.correctIndex)||s.question.correctIndex<0||s.question.correctIndex>3))throw new Error('Invalid question '+id);
   for(const clue of [s.clue,...(s.options||[]).map(o=>o.clue),...(s.items||[]).map(o=>o.clue)].filter(Boolean))if(!e.clues[clue])throw new Error('Unknown clue '+clue);
   if(s.type!=='ending'&&!s.next&&!s.options?.length)throw new Error('Dead end '+id);
  }
 }
 class Model{
  constructor(edition,saved){validate(edition);this.edition=edition;this.state={version:edition.version,scene:edition.start,clues:[],answers:{},publications:{},flags:{},values:{},inspected:{},support:[],decisions:[],visited:[edition.start]};
   if(saved){this.checkSave(saved);this.state=clone(saved);}
  }
  checkSave(s){
   const e=this.edition;
   if(s.version!==e.version||!e.scenes[s.scene]||!Array.isArray(s.clues)||s.clues.some(id=>!e.clues[id])||!s.answers||!s.publications||!s.flags||!s.values||!s.inspected||!Array.isArray(s.support)||!Array.isArray(s.decisions)||!Array.isArray(s.visited))throw new Error('Incompatible save');
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
   this.state.decisions.push({scene:this.state.scene,id,title:option.title});this.effects(option.effects);this.addClue(option.clue);this.go(option.next);this.state.notice={at:option.next,text:option.consequence||''};return true;
  }
  inspect(id){const item=this.scene.items?.find(x=>x.id===id);if(!item)return false;const key=this.state.scene+':'+id;this.state.inspected[key]=true;this.addClue(item.clue);return true;}
  publicationState(){if(this.scene.type!=='publication')throw new Error('Not a publication');return this.state.publications[this.state.scene]??={links:{},note:'',attempts:[],submitted:false};}
  activeClaims(){return (this.scene.claims||[]).filter(c=>matches(this.state,c.when));}
  draftEvidence(claim,id){const p=this.publicationState();if(p.submitted||!this.activeClaims().some(c=>c.id===claim)||id&&!this.state.clues.includes(id))return false;p.links[claim]=id;p.checked=false;return true;}
  draftNote(text){const p=this.publicationState();if(!p.submitted){p.note=String(text).slice(0,1000);p.checked=false;}}
  submitPublication(){
   const p=this.publicationState();if(p.submitted)return {ignored:true};
   const errors={};for(const c of this.activeClaims())if(!this.state.clues.includes(p.links[c.id])||!c.accept.includes(p.links[c.id]))errors[c.id]='Find a note that supports this specific claim, rather than a different event or idea.';
   if(p.note.trim().length<12)errors.note='Add a short sentence explaining a connection (at least 12 characters). Your teacher reviews its reasoning.';
   p.errors=errors;p.checked=true;const valid=Object.keys(errors).length===0;p.attempts.push({links:clone(p.links),note:p.note,valid});
   if(valid){p.submitted=true;this.effects(this.scene.effects);}return {valid,errors};
  }
  canAdvance(){if(this.scene.type==='publication')return Boolean(this.state.publications[this.state.scene]?.submitted);if(this.scene.type==='question')return Boolean(this.state.answers[this.state.scene]?.solved);if(this.scene.type==='investigation')return this.scene.items.every(x=>x.optional||this.state.inspected[this.state.scene+':'+x.id]);return false;}
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
  function status(){const st=model.stats;const pageTotal=Object.values(edition.scenes).filter(s=>s.type==='publication').length;if(pageTotal){const done=Object.values(model.state.publications).filter(p=>p.submitted).length;$('progressText').textContent='Pages '+done+' / '+pageTotal;$('bar').style.width=100*done/pageTotal+'%';const pb=document.querySelector('[role="progressbar"]');pb.setAttribute('aria-label','Published pages');pb.setAttribute('aria-valuemax',pageTotal);pb.setAttribute('aria-valuenow',done);$('clueCount').textContent=model.state.clues.length;return;}$('progressText').textContent=st.solved+' / '+model.total;$('bar').style.width=(model.total?100*st.solved/model.total:0)+'%';const pb=document.querySelector('[role="progressbar"]');pb.setAttribute('aria-valuemax',model.total);pb.setAttribute('aria-valuenow',st.solved);$('clueCount').textContent=model.state.clues.length;}
  function renderClues(){const ids=model.state.clues;$('clues').innerHTML=(model.state.decisions.length?'<section class="decision-trail"><h3>Your route so far</h3><ol>'+model.state.decisions.map(d=>'<li>'+esc(d.title)+'</li>').join('')+'</ol></section>':'')+(ids.length?ids.map(id=>{const c=edition.clues[id];return '<article class="evidence"><small>'+esc(c.kind)+' · '+esc(c.date)+'</small><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p></article>';}).join(''):'<p>Your evidence file is empty. Each review question and each inspected source adds a note here.</p>');}
  function comicStrip(scene){
   return (scene.panels||[]).length?'<div class="comic-strip">'+scene.panels.map(p=>'<figure class="detail-panel '+(p.kind==='document'?'document-panel':'')+'">'+(p.kind==='document'?'<div class="document-lines" aria-hidden="true"></div>':image(p.art))+'<figcaption><small>'+esc(p.label)+'</small><span>'+esc(p.afterAnswer&&!model.state.answers[model.state.scene]?.solved?p.beforeText:p.text)+'</span></figcaption></figure>').join('')+'</div>':'';
  }
  function memory(scene){
   const entry=(scene.callbacks||[]).find(c=>matches(model.state,c.when));
   return entry?'<aside class="route-memory"><strong>Your earlier choice matters</strong><span>'+esc(entry.text)+'</span></aside>':'';
  }
  function cover(){document.body.classList.remove('reader-active');model=null;$('notebookBtn').hidden=true;$('progressText').textContent='Ready';$('bar').style.width='0';document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow','0');
   $('view').innerHTML='<section class="pq-cover"><div class="cover-visual">'+image(0)+'<span class="cover-tag">'+esc(edition.issue)+' · '+esc(edition.dateRange)+'</span><div class="cover-lettering"><small>PANEL QUEST</small><strong>'+esc(edition.coverTitle)+'</strong><span>'+esc(edition.coverTagline)+'</span></div></div><div class="cover-copy"><div class="eyebrow">'+esc(edition.subtitle)+'</div><h1>'+esc(edition.title)+'</h1><p class="dek">'+esc(edition.description)+'</p><div class="pills"><span class="pill">'+modelCount(edition)+' review questions</span><span class="pill">Branching routes</span><span class="pill">'+edition.endings.length+' epilogues</span></div><p class="note-box">'+esc(edition.historicalNote)+'</p><p class="mission-copy">'+esc(edition.mission||'')+'</p><div class="cover-actions">'+(saved?'<button class="primary" id="resume">Continue your issue →</button>':'')+'<button class="'+(saved?'secondary':'primary')+'" id="startBtn">'+(saved?'Start a new issue':'Open the issue →')+'</button></div><p class="keyboard-note">Click or tap to play. Use 1–4 for answers and choices, Enter to continue, and E for your evidence file.</p><div id="restartCheck"></div></div></section>';
   if(saved)$('resume').onclick=()=>{model=new Model(edition,saved);render();};
   if(edition.teacherGuide){const guide=document.createElement('details');guide.className='teacher-guide';guide.innerHTML='<summary>Teacher guide: goals, use and assessment</summary><p>'+esc(edition.teacherGuide.duration)+'</p><p>'+esc(edition.teacherGuide.use)+'</p><ul>'+edition.teacherGuide.goals.map(g=>'<li>'+esc(g)+'</li>').join('')+'</ul><p>'+esc(edition.teacherGuide.assessment)+'</p>';$('view').querySelector('.cover-copy').appendChild(guide);}
   $('startBtn').onclick=()=>{if(saved){$('restartCheck').innerHTML='<p>Start over and replace saved progress?</p><button class="primary" id="confirmRestart">Start over</button> <button class="secondary" id="cancelRestart">Keep my progress</button>';$('confirmRestart').onclick=start;$('cancelRestart').onclick=()=>{$('restartCheck').innerHTML='';$('startBtn').focus();};$('confirmRestart').focus();}else start();};
  }
  function start(){model=new Model(edition);saved=null;render();}
  function render(){
   document.body.classList.add('reader-active');
   const s=model.scene;status();$('notebookBtn').hidden=false;
   if(s.type==='ending'){renderEnd();save();focus();return;}
   $('view').innerHTML='<section class="pq-page layout-'+esc(s.type==='publication'?'publication':s.layout||'split')+'"><div class="scene-head"><span>'+esc(s.date)+'</span><span class="issue">'+esc(edition.issue)+' · Scene '+model.state.visited.length+'</span></div><h1 class="scene-title">'+esc(s.title)+'</h1>'+'<div class="page-body"><div class="visual-story"><figure class="hero-panel">'+image(s.art)+'<figcaption class="narration">'+esc(s.caption)+'</figcaption></figure><div class="speech"><span class="speaker">'+esc(s.speaker||edition.speaker)+'</span>'+(model.state.notice?.at===model.state.scene&&model.state.notice.text?'<p class="decision-consequence" role="status">'+esc(model.state.notice.text)+'</p>':'')+esc(s.dialogue)+(s.context?'<details class="context-note"><summary>Read the context note</summary><p>'+esc(s.context)+'</p></details>':'')+'</div>'+comicStrip(s)+memory(s)+'</div><div class="interaction" id="interaction"></div></div><div class="page-bottom"><span>'+esc(edition.pageFooter)+'</span><button class="text-btn" id="saveCover">Save &amp; return to cover</button></div></section>';
   const box=$('interaction');
   if(s.type==='question'){
    const a=model.answerState(),q=s.question;
    box.innerHTML='<div class="qmeta">Set the record straight · '+(model.stats.solved+(a.solved?0:1))+' / '+model.total+'</div><h2>'+esc(q.prompt)+'</h2><div class="answers">'+a.order.map((i,n)=>'<button class="answer '+(a.solved&&i===q.correctIndex?'right':a.wrong.includes(i)?'wrong':'')+'" data-answer="'+i+'" '+(a.solved||a.wrong.includes(i)?'disabled':'')+'><span class="letter">'+(n+1)+'</span>'+esc(q.answers[i])+'</button>').join('')+'</div><div id="feedback" class="feedback '+(a.solved?'':a.wrong.length?'error':'hidden')+'" role="status">'+(a.solved?'Evidence filed. '+esc(q.explanation):a.wrong.length?'Check the idea: '+esc(q.retryHint||'Compare the options with the scene’s evidence.'):'')+'</div><div class="actions"><span class="hint">'+(a.solved?'You can review this clue in your evidence file.':'Choose 1–4. You can retry and keep reading.')+'</span><button class="primary" id="next" '+(!a.solved?'hidden':'')+'>Continue →</button></div>';
    box.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const result=model.answer(Number(b.dataset.answer));if(result.ignored)return;render();if(result.correct)$('next').focus();else{$('interaction').querySelector('[data-answer]:not(:disabled)')?.focus();}});
   }else if(s.type==='publication'){renderPublication(box,s);
   }else if(s.type==='investigation'){
    box.innerHTML='<div class="qmeta">'+esc(s.sourceLabel||'Inspect the source')+'</div><h2>'+esc(s.sourceLabel==='Story briefing'?'Your commission':'Read before continuing')+'</h2><div class="inspect-list">'+s.items.map(x=>{const inspected=model.state.inspected[model.state.scene+':'+x.id];return '<button class="choice inspect" data-inspect="'+esc(x.id)+'" '+(inspected?'disabled':'')+'><strong>'+(inspected?(x.clue?'✓ Filed: ':'✓ Read: '):'Read: ')+esc(x.title)+'</strong><span>'+(inspected?esc(x.text):'Open this source and add it to your evidence file.')+'</span></button>';}).join('')+'</div><p class="hint">Read each note to continue. Historical context and fictional story documents are labeled separately.</p><button class="primary" id="next" '+(!model.canAdvance()?'hidden':'')+'>Return to the story →</button>';
    box.querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>{model.inspect(b.dataset.inspect);render();$('next')?.focus();});
   }else{
    box.innerHTML='<div class="qmeta">Your next move</div><h2>Choose your next action.</h2><div class="story-choices">'+s.options.filter(o=>matches(model.state,o.when)).map((o,n)=>'<button class="choice" data-choice="'+esc(o.id)+'"><strong>'+(n+1)+'. '+esc(o.title)+'</strong><span>'+esc(o.description)+'</span></button>').join('')+'</div><p class="hint">Your decision is kept when the routes rejoin.</p>';
    box.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(model.choose(b.dataset.choice))render();});
   }
   if($('next'))$('next').onclick=()=>{if(model.advance())render();};
   $('saveCover').onclick=()=>{save();saved=clone(model.state);cover();focus();};
   const contextNote=$('view').querySelector('.context-note'),contextScene=model.state.scene;if(contextNote)contextNote.ontoggle=()=>{if(contextNote.open&&!model.state.support.includes(contextScene)){model.state.support.push(contextScene);save();}};
   save();focus();
  }
  function sourceText(id){const c=edition.clues[id];return c?c.kind+' · '+c.date+': '+c.text:'Choose a note first, or open the evidence file.';}
  function renderPublication(box,s){
   const p=model.publicationState(),claims=model.activeClaims(),ids=(s.candidates||model.state.clues).filter(id=>model.state.clues.includes(id));
   if(p.submitted){box.innerHTML='<div class="qmeta">Page printed</div><h2>'+esc(s.pageTitle)+'</h2><ul class="page-proof">'+claims.map(c=>'<li><strong>'+esc(c.text)+'</strong><p>Evidence: '+esc(edition.clues[p.links[c.id]].title)+'</p></li>').join('')+'</ul><details class="written-reason"><summary>Your explanation</summary><p>'+esc(p.note)+'</p></details><p class="feedback" role="status">Your evidence links are supported. Your explanation is saved for teacher review.</p><button class="primary" id="next">Continue the chronicle →</button>';return;}
   box.innerHTML='<div class="qmeta">Build a supported page</div><h2>'+esc(s.pageTitle)+'</h2><form id="publicationForm">'+claims.map((c,i)=>'<div class="claim-row"><label for="evidence-'+i+'"><b>Claim '+(i+1)+'</b> '+esc(c.text)+'</label><select id="evidence-'+i+'" data-evidence="'+esc(c.id)+'" '+(p.submitted?'disabled':'')+'><option value="">Choose supporting evidence…</option>'+ids.map(id=>'<option value="'+esc(id)+'" '+(p.links[c.id]===id?'selected':'')+'>'+esc(edition.clues[id].title)+'</option>').join('')+'</select><details class="source-preview"><summary>Read the selected note</summary><p id="source-'+i+'">'+esc(sourceText(p.links[c.id]))+'</p></details>'+(p.checked&&p.errors?.[c.id]?'<p class="claim-error">'+esc(p.errors[c.id])+'</p>':'')+'</div>').join('')+'<label class="reason-label" for="pageReason">Explain one connection in your own words</label><textarea id="pageReason" maxlength="1000" rows="2" '+(p.submitted?'readonly':'')+' placeholder="This evidence supports the claim because…">'+esc(p.note)+'</textarea><p class="hint">Evidence links are checked by the game. Your explanation is saved for teacher review.</p>'+(p.checked&&p.errors?.note?'<p class="claim-error">'+esc(p.errors.note)+'</p>':'')+'<button class="primary" id="publish" type="submit" '+(p.submitted?'hidden':'')+'>Check &amp; send to press</button></form><div class="feedback '+(!p.checked?'hidden':p.submitted?'':'error')+'" id="publicationFeedback" role="status">'+(p.submitted?'Page printed. Its claims and sources are saved in your finished chronicle. Your written reasoning still needs teacher review.':'This page needs a revision. Review the marked links and try again.')+'</div><button class="primary" id="next" '+(!p.submitted?'hidden':'')+'>Continue the chronicle →</button>';
   box.querySelectorAll('[data-evidence]').forEach((el,i)=>el.onchange=()=>{model.draftEvidence(el.dataset.evidence,el.value);$('source-'+i).textContent=sourceText(el.value);save();});
   $('pageReason').oninput=()=>{model.draftNote($('pageReason').value);save();};
   $('publicationForm').onsubmit=event=>{event.preventDefault();const result=model.submitPublication();if(result.ignored)return;render();if(result.valid)$('next').focus();else{$('publicationFeedback').tabIndex=-1;$('publicationFeedback').focus();}};
  }
  function reportText(){
   const lines=[edition.title,'Ending: '+model.ending().title,'Practice record (corrected answers are not independent mastery):'];
   for(const [id,a] of Object.entries(model.state.answers))lines.push(edition.scenes[id].title+': '+(a.wrong.length?'corrected after '+a.wrong.length+' attempt(s)':'correct on first attempt')+(model.state.support.includes(id)?' (context note consulted)':''));
   lines.push('','Editorial decisions:',...model.state.decisions.map(d=>d.title),'','Completed pages and evidence (written reasoning needs teacher review):');
   for(const [id,p] of Object.entries(model.state.publications)){if(!p.submitted)continue;const sc=edition.scenes[id];lines.push('',sc.pageTitle);for(const c of sc.claims.filter(c=>matches(model.state,c.when))){const source=edition.clues[p.links[c.id]];lines.push('Claim: '+c.text,'Evidence: '+source.title+' — '+source.text);}lines.push('Student explanation: '+p.note,'Evidence-check submissions: '+p.attempts.length);}
   lines.push('','Discussion:',...(edition.teacherGuide?.debrief||[]));return lines.join('\n');
  }
  function renderEnd(){
   const e=model.ending(),st=model.stats;$('progressText').textContent='Complete';
   $('view').innerHTML='<section class="pq-ending"><div class="ending-art">'+image(e.art)+'<span class="cover-tag">'+esc(edition.issue)+' complete</span></div><div class="ending-copy"><div class="eyebrow">'+esc(edition.endingLabel)+'</div><h1>'+esc(e.title)+'</h1><p class="epilogue">'+esc(e.text)+'</p><div class="results"><div class="result"><b>'+Object.values(model.state.publications).filter(p=>p.submitted).length+'</b><small>Pages completed</small></div><div class="result"><b>'+model.state.clues.length+'</b><small>Evidence notes</small></div><div class="result"><b>'+st.retries+'</b><small>Corrections made</small></div></div><details class="finished-pages"><summary>Read your finished chronicle</summary><div id="printedChronicle"></div></details><details class="learning-record"><summary>Teacher learning record</summary><pre id="learningRecord"></pre><button class="secondary" id="downloadRecord">Download learning record</button></details><details class="summary"><summary>Your decisions and evidence</summary><ul>'+model.state.decisions.map(d=>'<li>'+esc(d.title)+'</li>').join('')+'</ul><p>'+esc(edition.ending?.finalFact)+'</p><p>All '+st.solved+' review questions were resolved. Revising an answer helped you keep reading.</p></details><p class="ending-reason"><strong>How this ending took shape</strong> '+esc(e.reason||'Your collected evidence and decisions shaped this ending.')+'</p><p class="replay-hint">'+esc(e.hint)+'</p><div class="actions"><button class="primary" id="replay">Read a different route ↻</button><button class="secondary" id="back">Back to cover</button></div><details class="sources"><summary>Context and sources</summary><p>'+esc(edition.sourceNote)+'</p>'+(edition.sources||[]).map(s=>'<p><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a></p>').join('')+'</details></div></section>';
   $('printedChronicle').innerHTML=Object.entries(model.state.publications).filter(([,p])=>p.submitted).map(([id,p])=>{const sc=edition.scenes[id];return '<article class="printed-page"><h3>'+esc(sc.pageTitle)+'</h3>'+sc.claims.filter(c=>matches(model.state,c.when)).map(c=>'<p>'+esc(c.text)+'</p><small>Evidence: '+esc(edition.clues[p.links[c.id]].title)+' · '+esc(edition.clues[p.links[c.id]].kind)+'</small>').join('')+(id==='publish-causes'&&model.state.flags.routeA==='market'?'<p class="source-credit">Source: '+(model.state.flags.sourceName==='named'?'Madeleine, a fictional market customer, quoted with permission.':'A fictional market customer, kept anonymous at her request.')+'</p>':'')+'<blockquote>'+esc(p.note)+'</blockquote></article>';}).join('');
   $('learningRecord').textContent=reportText();$('downloadRecord').onclick=()=>{const url=URL.createObjectURL(new Blob([reportText()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=edition.id+'-learning-record.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
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
