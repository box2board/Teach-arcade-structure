import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TEACH_ARCADE_JSDOM||'jsdom');
const base=new URL('../public/tools/graphic-organizers/',import.meta.url);
const model=await fs.readFile(new URL('shared/model.js',base),'utf8');
const engine=await fs.readFile(new URL('shared/studio.js',base),'utf8');
function page(slug,seed={},blocked=false){
 const dom=new JSDOM('<section data-organizer-studio="'+slug+'"></section>',{url:'https://teacharcade.com/tools/graphic-organizers/'+slug+'/',runScripts:'outside-only'}),w=dom.window;
 for(const [k,v] of Object.entries(seed))w.localStorage.setItem(k,JSON.stringify(v));
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('Blocked');}});
 w.confirm=()=>true;w.print=()=>w.printed=true;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){w.downloadName=this.download;};
 w.eval(model);w.eval(engine);return w;
}
const clicks=(w,text)=>{const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent===text);assert(b,'Missing button '+text);b.click();};
const input=(w,label,text)=>{const node=w.document.querySelector('[aria-label="'+label+'"]');assert(node,label);node.value=text;node.dispatchEvent(new w.Event('input'));return node;};
const project=w=>JSON.parse(w.localStorage.getItem('teacharcade_organizer_studio_v1_'+w.document.querySelector('.go-options select').value));
const w0=page('kwl-chart');const slugs=Object.keys(w0.GOModel.templates);assert.equal(slugs.length,12);w0.close();
for(const slug of slugs){
 const html=await fs.readFile(new URL(slug+'/index.html',base),'utf8');
 assert(html.includes('data-organizer-studio="'+slug+'"'));assert(!html.includes('const STORAGE_KEY'));assert(html.includes('shared/studio.js'));
 const parsed=new JSDOM(html);assert(parsed.window.document.querySelector('[data-organizer-studio]').parentElement.matches('main'));parsed.window.close();
 const w=page(slug);assert(w.document.querySelectorAll('.go-section').length>0);
 input(w,'Project title / topic','My <project>');input(w,'Name','Student');
 const notes=w.document.querySelector('textarea');notes.value='Line 1\nLine 2 <script>unsafe</script>';notes.dispatchEvent(new w.Event('input'));
 clicks(w,'Download project');assert(w.downloadName.endsWith('.teacharcade.json'));const saved=project(w);assert.equal(saved.title,'My <project>');assert.equal(saved.name,'Student');assert(saved.cards.some(c=>c.text.includes('Line 2')||c.cells.some(t=>t.includes('Line 2'))));
 assert.equal(w.document.querySelectorAll('script').length,0);assert(w.document.querySelector('.go-print-value').textContent.length>0);
 const round=w.GOModel.validate(JSON.parse(JSON.stringify(saved)));assert.deepEqual(JSON.parse(JSON.stringify(round)),saved);
 const before=w.document.querySelectorAll('.go-section').length;clicks(w,slug==='t-chart'||slug==='pros-cons'?'+ Add row':'+ Add section');assert.equal(w.document.querySelectorAll('.go-section').length,before+1);clicks(w,'Undo');assert.equal(w.document.querySelectorAll('.go-section').length,before);clicks(w,'Redo');assert.equal(w.document.querySelectorAll('.go-section').length,before+1);
 clicks(w,'Print / PDF');assert(w.printed);
 const restored=page(slug,{['teacharcade_organizer_studio_v1_'+slug]:project(w)});assert.equal(restored.document.querySelector('[aria-label="Project title / topic"]').value,'My <project>');restored.close();w.close();
}
console.log('PASS: all 12 routes mount, edit, export, restore, undo/redo, add sections, and invoke printing.');
let w=page('t-chart',{teacharcade_t_chart_v1:{studentName:'Legacy student',headerA:'Claim',headerB:'Evidence',rows:[{a:'Original claim',b:'Original evidence'}]}});assert.equal(w.document.querySelector('textarea').value,'Original claim');assert.equal(w.document.querySelector('[aria-label="Name"]').value,'Legacy student');clicks(w,'Download project');assert.equal(project(w).headers[1],'Evidence');assert(w.localStorage.getItem('teacharcade_t_chart_v1'));w.close();
w=page('kwl-chart',{teacharcade_kwl_chart_v1:{title:'Ancient Egypt',labelKnow:'Know',notesKnow:'Nile'}});assert.equal(w.document.querySelector('textarea').value,'Nile');assert.equal(w.document.querySelector('[aria-label="Project title / topic"]').value,'Ancient Egypt');w.close();
w=page('vocabulary-organizer',{teacharcade_vocabulary_organizer_v1:{current:{term:'Democracy',definition:'Rule by the people'},saved:[{term:'Republic',definition:'Representatives'}]}});assert.equal(w.document.querySelector('[aria-label="Vocabulary term"]').value,'Democracy');assert.equal(w.document.querySelector('[aria-label="Saved vocabulary words"]').options.length,2);clicks(w,'Save word & start next');assert.equal(project(w).archive.length,2);w.close();
console.log('PASS: legacy KWL, T-chart, vocabulary current entry and saved word archive survive migration.');
w=page('sequence-chart');input(w,'Notes · section 1','First event');clicks(w,'Download project');const first=project(w).cards[0];clicks(w,'↓ Move down');assert.equal(project(w).cards[1].text,first.text);clicks(w,'Remove');assert.equal(project(w).cards.length,3);clicks(w,'Undo');assert.equal(project(w).cards.length,4);
// Switching immediately after typing must persist the previous template draft.
input(w,'Project title / topic','Keep before switch');const choice=w.document.querySelector('.go-options select');choice.value='frayer-model';choice.dispatchEvent(new w.Event('change'));assert.equal(JSON.parse(w.localStorage.getItem('teacharcade_organizer_studio_v1_sequence-chart')).title,'Keep before switch');assert.equal(choice.value,'frayer-model');
const malicious=w.GOModel.fresh('frayer-model');malicious.cards[0].text='<img src=x onerror=alert(1)>';malicious.title='"<script>bad</script>';
const file=w.document.querySelector('input[type=file]');Object.defineProperty(file,'files',{configurable:true,value:[{size:100,text:async()=>JSON.stringify(malicious)}]});file.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,0));assert.equal(w.document.querySelectorAll('img,script').length,0);assert.equal(w.document.querySelector('textarea').value,malicious.cards[0].text);
const previous=project(w);Object.defineProperty(file,'files',{configurable:true,value:[{size:100,text:async()=>'{invalid'}]});file.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,0));assert.deepEqual(project(w),previous);assert(w.document.querySelector('.go-status').textContent.includes('not valid JSON'));
for(const corrupt of [{}, {...malicious,version:99},{...malicious,cards:[]},{...malicious,headers:'bad'},{...malicious,cards:[{label:'x',text:1,cells:[]}]}])assert.throws(()=>w.GOModel.validate(corrupt));w.close();
w=page('frayer-model',{},true);input(w,'Name','Private browsing');clicks(w,'Download project');assert(w.downloadName);assert(w.document.querySelector('.go-status').textContent.includes('downloaded'));w.close();
console.log('PASS: reorder, removal, immediate template switch, safe import, invalid-file rejection, and download with browser storage blocked.');
for(const slug of ['kwl-chart','venn-diagram','frayer-model','character-map','story-plot-diagram','vocabulary-organizer','main-idea-details','cause-effect']){
 const w=page(slug), cores=w.document.querySelectorAll('.go-core-section');assert(cores.length>0);assert([...cores].every(c=>!c.querySelector('.go-section-actions')),'Semantic sections should not be rearrangeable');
 clicks(w,'+ Add section');const added=w.document.querySelector('.go-section:last-child');assert(added.querySelector('.go-section-actions'));
 input(w,'Notes · section 1','Keep these answers');const undoButton=[...w.document.querySelectorAll('button')].find(b=>b.textContent==='Undo');assert.equal(undoButton.disabled,false);clicks(w,'Undo');assert.equal(w.document.querySelector('[aria-label="Notes · section 1"]').value,'');clicks(w,'Redo');assert.equal(w.document.querySelector('[aria-label="Notes · section 1"]').value,'Keep these answers');
 clicks(w,'Focus mode');assert(w.document.body.classList.contains('go-focus-mode'));w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert(!w.document.body.classList.contains('go-focus-mode'));
 clicks(w,'Print blank');assert(w.document.body.classList.contains('go-print-blank'));assert.equal(project(w).cards[0].text,'Keep these answers');w.dispatchEvent(new w.Event('afterprint'));assert(!w.document.body.classList.contains('go-print-blank'));
 w.close();
}
console.log('PASS: semantic section positions, immediate typing undo, focus/Escape, and blank printing without changing answers.');
