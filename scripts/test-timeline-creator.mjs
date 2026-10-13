import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TEACH_ARCADE_JSDOM||'jsdom');
const base=new URL('../public/tools/timeline-creator/',import.meta.url);
const html=await fs.readFile(new URL('index.html',base),'utf8');
const model=await fs.readFile(new URL('model.js',base),'utf8');
const engine=await fs.readFile(new URL('studio.js',base),'utf8');
function page(seed,blocked=false){const d=new JSDOM(html,{url:'https://teacharcade.com/tools/timeline-creator/',runScripts:'outside-only'}),w=d.window;
 if(seed)w.localStorage.setItem('teacharcade_timeline_v1',JSON.stringify(seed));
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('Blocked');}});
 w.confirm=()=>true;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.HTMLAnchorElement.prototype.click=function(){w.download=this.download;};
 w.eval(model);w.eval(engine);return w;}
const submit=(w,id)=>w.document.getElementById(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const click=(w,id)=>w.document.getElementById(id).click();
const field=(w,id,value)=>{w.document.getElementById(id).value=value;};
let w=page(),M=w.TimelineModel,S=w.TimelineStudio;
assert.equal(S.project().events.length,6);assert.equal(w.document.querySelectorAll('.event-card').length,6);
assert.equal(M.time(M.date(1,'CE'))-M.time(M.date(1,'BCE')),366,'No phantom year zero');
assert(M.time(M.date(2,'BCE'))<M.time(M.date(1,'BCE')));
assert.throws(()=>M.validDate(M.date(2023,'CE',2,29)));assert.doesNotThrow(()=>M.validDate(M.date(2024,'CE',2,29)));assert.throws(()=>M.validDate(M.date(0)));assert.throws(()=>M.validDate(M.date(2024,'CE',null,1)));
click(w,'add');field(w,'event-title','A <script>safe</script> title');field(w,'year','500');field(w,'era','BCE');field(w,'caption','Students compare <img src=x onerror=bad()>');field(w,'significance','Explain the importance');field(w,'source','A credited source');submit(w,'event-form');
assert.equal(S.project().events.length,7);assert.equal(M.sorted(S.project())[0].date.era,'BCE');assert.equal(w.document.querySelectorAll('svg script,svg img').length,0);assert(w.document.getElementById('canvas').textContent.includes('A <script>safe</script> title'));
field(w,'end-year','600');field(w,'end-era','BCE');submit(w,'event-form');assert(w.document.getElementById('form-error').textContent.includes('end date'));assert.equal(S.project().events.at(-1).end,null);
field(w,'end-year','400');submit(w,'event-form');assert.equal(S.project().events.at(-1).end.year,400);
click(w,'duplicate');assert.equal(S.project().events.length,8);click(w,'delete');assert.equal(S.project().events.length,7);click(w,'undo');assert.equal(S.project().events.length,8);click(w,'redo');assert.equal(S.project().events.length,7);
click(w,'vertical');assert.equal(S.project().layout,'vertical');assert.equal(w.document.getElementById('spacing').disabled,true);click(w,'horizontal');field(w,'spacing','scaled');w.document.getElementById('spacing').dispatchEvent(new w.Event('change'));assert.equal(S.project().spacing,'scaled');
// Closely dated cards must stack without overlapping within a row.
const crowded=M.fresh();crowded.spacing='scaled';for(let i=0;i<40;i++){let e=M.event();e.date=M.date(i===39?2020:2000);e.title='Crowded '+i;crowded.events.push(e);}let art=S.svg(crowded,false);for(let i=0;i<art.positions.length;i++)for(let j=i+1;j<art.positions.length;j++){const a=art.positions[i],b=art.positions[j];assert(!(Math.abs(a.x-b.x)<216&&Math.abs(a.y-b.y)<246),'Cards overlap');}
const before=S.project();const restored=page(before);assert.deepEqual(JSON.parse(JSON.stringify(restored.TimelineStudio.project())),JSON.parse(JSON.stringify(before)));restored.close();
click(w,'save');assert(w.download.endsWith('.teacharcade-timeline.json'));
click(w,'add-era');field(w,'era-start-era','CE');field(w,'era-end-era','CE');field(w,'era-start','2000');field(w,'era-end','1900');submit(w,'era-form');assert(w.document.getElementById('era-error').textContent.includes('end'));field(w,'era-end','2020');submit(w,'era-form');assert.equal(S.project().eras.length,2);click(w,'delete-era');assert.equal(S.project().eras.length,1);
click(w,'present');assert(w.document.getElementById('presentation').open);assert(w.document.getElementById('slide').textContent.includes('A <script>safe</script> title'));assert.equal(w.document.getElementById('slide').querySelectorAll('script').length,0);w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight'}));assert.equal(w.document.getElementById('slide-count').textContent,'2 / 7');click(w,'exit-present');
click(w,'focus');assert(w.document.body.classList.contains('focus-mode'));w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert(!w.document.body.classList.contains('focus-mode'));
const bad=before;bad.events[0].image='https://bad.example/image.svg';assert.throws(()=>M.validate(bad));const badId=M.example();badId.events[1].id=badId.events[0].id;assert.throws(()=>M.validate(badId));
const importer=w.document.getElementById('project-file');Object.defineProperty(importer,'files',{configurable:true,value:[{size:20,text:async()=>'{invalid'}]});const p=S.project();importer.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,0));assert.deepEqual(S.project(),p);
console.log('PASS: creation, safe editing, BCE/CE ordering, real dates, ranges, duplicate/delete, undo/redo, layouts, stacking, save/restore, eras, presentation, keyboard and malformed project rejection.');
// Generate a real PDF through the bundled jsPDF with the same notes renderer.
w.eval(await fs.readFile(new URL('../public/assets/vendor/jspdf-2.5.2.umd.min.js',import.meta.url),'utf8'));
const font=await fs.readFile(new URL('../public/tools/graphic-organizers/shared/fonts/DejaVuSans.ttf',import.meta.url));const doc=new w.jspdf.jsPDF({unit:'pt',format:'letter',orientation:'landscape'});doc.addFileToVFS('DejaVuSans.ttf',font.toString('base64'));doc.addFont('DejaVuSans.ttf','Timeline','normal');doc.setFont('Timeline');const long=M.example();long.events[0].significance=('Evidence café Δ and sources. ').repeat(120);S.pdfNotes(doc,long);assert(doc.getNumberOfPages()>2);
const qaDir=process.env.TIMELINE_QA_DIR;if(qaDir){await fs.mkdir(qaDir,{recursive:true});await fs.writeFile(qaDir+'/timeline-notes.pdf',Buffer.from(doc.output('arraybuffer')));await fs.writeFile(qaDir+'/timeline.svg',S.svg(M.example(),false).markup);const vertical=M.example();vertical.layout='vertical';await fs.writeFile(qaDir+'/timeline-story.svg',S.svg(vertical,false).markup);const scaled=M.example();scaled.spacing='scaled';await fs.writeFile(qaDir+'/timeline-scaled.svg',S.svg(scaled,false).markup);}
console.log('PASS: actual PDF renderer paginates long notes with the bundled Unicode font.');w.close();
w=page(null,true);click(w,'add');click(w,'save');assert(w.download);assert(w.document.getElementById('save-state').textContent.includes('Download'));w.close();console.log('PASS: blocked browser storage still permits editing and project downloads.');
