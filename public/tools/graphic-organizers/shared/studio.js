(() => {
'use strict';
const root=document.querySelector('[data-organizer-studio]');if(!root)return;
const M=window.GOModel, slug=root.dataset.organizerStudio;
let project=M.fresh(slug), undo=[],redo=[], timer, pendingSnapshot=null, focusMode=false;
const storageKey=id=>'teacharcade_organizer_studio_v1_'+id;
let initialMessage='Ready. Changes save in this browser.';
try {const saved=localStorage.getItem(storageKey(slug));const old=localStorage.getItem(M.templates[slug].legacyKey);if(saved)project=M.validate(JSON.parse(saved));else if(old){project=M.migrate(slug,JSON.parse(old));initialMessage='Recovered your earlier saved organizer.';}}
catch {initialMessage='Browser saving is unavailable or saved data could not be read. Download a project to keep your work.';}
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
const toolbar=el('div','go-toolbar'), actions=el('div','go-actions'), options=el('div','go-options');
const status=el('p','go-status',initialMessage);status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const paper=el('section','go-paper');paper.setAttribute('aria-label','Editable organizer');
const note=el('p','go-help','Saved drafts stay on this device and browser. Download a project to reopen it elsewhere. Download PDF saves a ready-to-use worksheet directly.');
root.append(toolbar,note,status,paper);toolbar.append(actions,options);
const announce=message=>status.textContent=message;
function save(){try{localStorage.setItem(storageKey(project.template),JSON.stringify(project));announce('Saved in this browser.');}catch{announce('Could not save in this browser. Download a project to keep your work.');}}
function flush(){clearTimeout(timer);if(pendingSnapshot){undo.push(pendingSnapshot);if(undo.length>50)undo.shift();pendingSnapshot=null;redo=[];}updateHistory();}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>{flush();save();},500);}
function remember(){flush();undo.push(M.copy(project));if(undo.length>50)undo.shift();redo=[];}
function mutate(fn){
 const active=document.activeElement, aria=active?.getAttribute('aria-label'), action=active?.textContent;
 remember();save();fn();render();save();
 const match=aria ? [...root.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===aria) : [...root.querySelectorAll('button')].find(n=>n.textContent===action&&!n.disabled);
 if(match)match.focus();
}
const undoBtn=button('Undo',()=>{flush();if(!undo.length)return;redo.push(M.copy(project));project=undo.pop();render();save();});
const redoBtn=button('Redo',()=>{flush();if(!redo.length)return;undo.push(M.copy(project));project=redo.pop();render();save();});
function updateHistory(){undoBtn.disabled=undo.length===0&&!pendingSnapshot;redoBtn.disabled=redo.length===0;}
function download(){flush();save();const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=(project.title||M.templates[project.template].name).replace(/[^a-z0-9_-]/gi,'-').slice(0,70)+'.teacharcade.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Project downloaded. Use Open project to continue on another device.');}
const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;root.append(file);
file.addEventListener('change',async()=>{const selected=file.files[0];if(!selected)return;try{if(selected.size>3*1024*1024)throw new Error('Choose a project smaller than 3 MB.');const next=M.validate(JSON.parse(await selected.text()));if(!confirm('Replace this editor with the selected project? Download your current work first if you need a separate copy.'))return;remember();save();project=next;render();save();announce('Project opened. '+M.templates[project.template].name);}catch(error){announce(error instanceof SyntaxError?'This file is not valid JSON. Your work has not changed.':error.message);}finally{file.value='';}});
actions.append(button('Download project',download,'go-primary'),button('Open project',()=>file.click()),button('Download PDF',()=>downloadPdf(false)),undoBtn,redoBtn,button('New blank',()=>{if(confirm('Start a new blank organizer? Download the current project first to keep a copy.'))mutate(()=>project=M.fresh(project.template));}));
function setFocus(value){focusMode=value;document.body.classList.toggle('go-focus-mode',value);focusBtn.textContent=value?'Exit focus':'Focus mode';focusBtn.setAttribute('aria-pressed',String(value));}
const focusBtn=button('Focus mode',()=>setFocus(!focusMode));focusBtn.setAttribute('aria-pressed','false');actions.append(focusBtn);
async function downloadPdf(blank=false){
 flush();save();const buttons=[...actions.querySelectorAll('button')].filter(b=>b.textContent.includes('PDF'));buttons.forEach(b=>b.disabled=true);announce('Preparing PDF…');
 try{await window.GOPdf.download(M.copy(project),blank);announce('PDF downloaded. Your saved answers are unchanged.');}catch(error){announce('Could not download PDF: '+error.message);}finally{buttons.forEach(b=>b.disabled=false);}
}
// Blank export changes only the PDF, never the saved organizer.
actions.append(button('Download Blank PDF',()=>downloadPdf(true)));
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&focusMode){setFocus(false);focusBtn.focus();}
 if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
 if(event.key.toLowerCase()==='s'){event.preventDefault();download();return;}
 const editing=event.target?.matches?.('input,textarea,select,[contenteditable="true"]');
 if(!editing&&event.key.toLowerCase()==='z'){event.preventDefault();(event.shiftKey?redoBtn:undoBtn).click();}
});
function select(label,values,get,set){const wrap=el('label','go-select',label+' '),sel=el('select');for(const [value,title] of values){const option=el('option','',title);option.value=value;sel.append(option);}sel.value=get();sel.addEventListener('change',()=>mutate(()=>set(sel.value)));wrap.append(sel);return {wrap,sel};}
const template=select('Template',Object.entries(M.templates).map(([k,v])=>[k,v.name]),()=>project.template,value=>{project=loadTemplate(value);});
const accent=select('Color',[['blue','Ocean'],['green','Forest'],['purple','Violet'],['slate','Ink']],()=>project.accent,value=>project.accent=value);
const font=select('Text size',[['14','Small'],['16','Standard'],['18','Large'],['20','Extra large']],()=>String(project.fontSize),value=>project.fontSize=Number(value));
options.append(template.wrap,accent.wrap,font.wrap);
function loadTemplate(id){try{const raw=localStorage.getItem(storageKey(id));if(raw)return M.validate(JSON.parse(raw));const old=localStorage.getItem(M.templates[id].legacyKey);if(old)return M.migrate(id,JSON.parse(old));}catch{}return M.fresh(id);}
// Track one undo snapshot per burst of typing; never rebuild the focused field while typing.
function field(label,value,set,multi=false,cls=''){
 const wrap=el('label','go-field '+cls),name=el('span','go-label',label),input=el(multi?'textarea':'input');input.value=value;input.setAttribute('aria-label',label);if(!multi)input.type='text';input.maxLength=20000;if(multi)input.placeholder='Write your ideas here…';
 const printed=el('div','go-print-value',value||'\u00a0');
 input.addEventListener('input',()=>{if(!pendingSnapshot)pendingSnapshot=M.copy(project);set(input.value);updateHistory();printed.textContent=input.value||'\u00a0';if(multi)grow(input);schedule();});
 wrap.append(name,input,printed);return wrap;
}
function grow(input){input.style.height='auto';input.style.height=Math.max(120,input.scrollHeight+2)+'px';}
function render(){
 paper.replaceChildren();paper.dataset.accent=project.accent;paper.style.setProperty('--go-font',project.fontSize+'px');
 template.sel.value=project.template;accent.sel.value=project.accent;font.sel.value=String(project.fontSize);updateHistory();
 const spec=M.templates[project.template],heading=el('div','go-paper-heading');heading.append(el('span','go-eyebrow','TEACH ARCADE / GRAPHIC ORGANIZER STUDIO'),el('h2','',spec.name),field('Project title / topic',project.title,v=>project.title=v,false,'go-title'));
 const meta=el('div','go-meta');meta.append(field('Name',project.name,v=>project.name=v),field('Class / period',project.className,v=>project.className=v),field('Date',project.date,v=>project.date=v));paper.append(heading,meta);
 if(['frayer-model','character-map','vocabulary-organizer'].includes(project.template))paper.append(field(project.template==='character-map'?'Character':'Vocabulary term',project.subject,v=>project.subject=v,false,'go-subject'));
 if(spec.layout==='venn'){const diagram=el('div','go-venn-guide');diagram.setAttribute('aria-label','Two overlapping circles: differences on the outside, similarities in the middle.');diagram.innerHTML='<svg viewBox="0 0 600 180" aria-hidden="true"><circle cx="235" cy="90" r="85"/><circle cx="365" cy="90" r="85"/><text x="190" y="95">A</text><text x="300" y="95">Both</text><text x="410" y="95">B</text></svg>';paper.append(diagram);}
 if(spec.layout==='plot'){const curve=el('div','go-plot-guide');curve.innerHTML='<svg viewBox="0 0 600 110" role="img" aria-label="Plot arc rising to a climax then falling to resolution"><path d="M15 95 L130 95 L310 15 L470 95 L585 95"/><circle cx="310" cy="15" r="6"/></svg>';paper.append(curve);}
 const board=el('div','go-board go-layout-'+spec.layout);board.dataset.template=project.template;paper.append(board);
 const fixed=['kwl-chart','venn-diagram','frayer-model','character-map','story-plot-diagram','vocabulary-organizer'].includes(project.template);
 const coreCount=fixed?spec.labels.length:spec.layout==='branch'?1:0;
 const core=index=>index<coreCount;
 const help=el('p','go-layout-help', fixed?'The original sections keep their positions. Add extra sections below as needed.':spec.layout==='branch'?'The main box stays first. Add or rearrange the supporting boxes.':'Add, remove, or rearrange entries to fit your topic.');
 paper.insertBefore(help,board);
 if(spec.layout==='table'){const header=el('div','go-table-head');project.headers.forEach((h,i)=>header.append(field('Column '+(i+1)+' heading',h,v=>project.headers[i]=v)));board.append(header);}
 project.cards.forEach((card,index)=>{
  const section=el('div','go-section');section.dataset.index=index;if(core(index))section.classList.add('go-core-section');
  if(spec.layout==='table'){const cells=el('div','go-row');card.cells.forEach((value,c)=>cells.append(field(project.headers[c]+' · row '+(index+1),value,v=>card.cells[c]=v,true)));section.append(cells);}
  else {section.append(field('Section '+(index+1)+' heading',card.label,v=>card.label=v,false,'go-section-title'),field('Notes · section '+(index+1),card.text,v=>card.text=v,true));}
  const controls=el('div','go-section-actions');
  const up=button('↑ Move up',()=>mutate(()=>[project.cards[index-1],project.cards[index]]=[project.cards[index],project.cards[index-1]]));up.disabled=core(index)||index===coreCount;
  const down=button('↓ Move down',()=>mutate(()=>[project.cards[index+1],project.cards[index]]=[project.cards[index],project.cards[index+1]]));down.disabled=core(index)||index===project.cards.length-1;
  const remove=button('Remove',()=>{const filled=card.text||card.cells.some(Boolean);if(!filled||confirm('Remove this section and its notes? Undo can restore it.'))mutate(()=>project.cards.splice(index,1));});remove.disabled=core(index)||project.cards.length===1;
  if(!core(index)){controls.append(up,down,remove);section.append(controls);}board.append(section);
 });
 const add=button(spec.layout==='table'?'+ Add row':'+ Add section',()=>mutate(()=>project.cards.push({label:spec.layout==='branch'?(project.template==='cause-effect'?'Effect ':'Detail ')+project.cards.length:spec.layout==='sequence'?(project.template==='timeline-template'?'Event ':'Step ')+(project.cards.length+1):'Additional notes',text:'',cells:spec.layout==='table'?['','']:[]})),'go-add');add.disabled=project.cards.length>=100;paper.append(add);
 if(project.template==='vocabulary-organizer'){
  const archive=el('div','go-word-controls');const words=el('select');words.setAttribute('aria-label','Saved vocabulary words');words.append(el('option','','Choose a saved word'));
  project.archive.forEach((word,i)=>{const o=el('option','',word.term||'Word '+(i+1));o.value=String(i);words.append(o);});words.options[0].value='';
  const stash=button('Save word & start next',()=>{if(project.archive.length>=100){announce('This project has 100 saved words. Download it, then start a new project.');return;}mutate(()=>{const word={term:project.subject};M.templates['vocabulary-organizer'].fields.forEach((k,i)=>word[k]=project.cards[i]?.text||'');project.archive.unshift(word);project.subject='';project.cards=M.fresh('vocabulary-organizer').cards;});});
  words.addEventListener('change',()=>{if(words.value==='')return;const word=project.archive[Number(words.value)];mutate(()=>{project.subject=word.term;project.cards=M.fresh('vocabulary-organizer').cards;M.templates['vocabulary-organizer'].fields.forEach((k,i)=>project.cards[i].text=word[k]||'');});});archive.append(stash,words);paper.append(archive);
 }
 paper.append(el('p','go-paper-credit','Created with Teach Arcade · teacharcade.com'));
 paper.querySelectorAll('textarea').forEach(grow);
}
window.addEventListener('resize',()=>paper.querySelectorAll('textarea').forEach(grow));
window.addEventListener('pagehide',()=>{flush();save();});
render();
})();
