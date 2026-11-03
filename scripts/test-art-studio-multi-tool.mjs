// Multi-tool production-controller exercise; DOM fields are doubles, not a browser.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {StudioState,newPage,clone,reorder} from '../public/tools/art-studio/state.js';
import {makeObject,pageSvg} from '../public/tools/art-studio/objects.js';
import {StudioUI} from '../public/tools/art-studio/ui.js';
import {CreationTools} from '../public/tools/art-studio/creation-tools.js';
import {SelectionTools} from '../public/tools/art-studio/selection-tools.js';
import {ResourceBuilders} from '../public/tools/art-studio/resource-builders.js';
import {copySelectionLayer,rectanglePoints} from '../public/tools/art-studio/image-selection.js';
import {saveProject,listProjects,validateProject} from '../public/tools/art-studio/storage.js';
let checks=0;const check=(label,fn)=>{fn();checks++;console.log('PASS '+label);};
const state=new StudioState(),fields=new Map(),messages=[];
const field=k=>{if(!fields.has(k))fields.set(k,{value:'',checked:false});return fields.get(k);};
const ui={state,root:{querySelector:field},canvas:{fit(){}},close(){},modal(){},toast:t=>messages.push(t),align:StudioUI.prototype.align};
const creation=new CreationTools(ui),tools=new SelectionTools(ui),resources=new ResourceBuilders(ui);
state.project.name='Evidence workshop — multi-tool study';state.page.name='Photo evidence';
const src='data:image/jpeg;base64,'+readFileSync(new URL('../public/tools/art-studio/examples/assets/grace-hopper.jpg',import.meta.url)).toString('base64');
state.add([makeObject('image',{src,x:70,y:130,w:320,h:375,name:'Source photograph'})]);const original=clone(state.objects[0]);
const cut=copySelectionLayer(original,rectanglePoints([15,5],[95,100]),.2,-.2,true);state.add([cut]);state.patch({w:260,x:65,y:165,flipX:true});tools.run('tool:rotate-right');tools.run('tool:reset-angle');
check('Photo cutout transform chain retains source and mask independently',()=>{assert.deepEqual(state.page.objects[0],original);assert.equal(state.objects[0].angle,0);assert.equal(state.objects[0].flipX,true);assert.equal(state.objects[0].maskStrokes.length,1);});
state.change(()=>state.page.objects[0].visible=false);
creation.run('create:note');const noteGroup=state.objects.map(o=>o.id),noteText=state.objects.find(o=>o.type==='text');
state.select([noteText.id],true);state.patch({text:'NOTICE\nWhat can you observe?',fontSize:23});tools.run('tool:color-#25334b');tools.run('tool:copy-style');
const label=makeObject('text',{text:'QUESTION\nWhat would you investigate?',x:430,y:170,w:280,h:100});state.add([label]);tools.run('tool:paste-style');
check('Style transfer preserves different text while copying selected formatting',()=>{assert.equal(state.objects[0].text,label.text);assert.equal(state.objects[0].fontSize,23);assert.equal(state.objects[0].fill,'#25334b');});
state.select(noteGroup,true);state.patch({x:430});state.select([noteGroup[0]],true);state.patch({x:405,y:340});state.select([noteText.id],true);state.patch({x:429,y:368,w:252,h:184});
state.select(noteGroup,true);tools.run('tool:shadow');state.duplicate();const copyIds=state.selected.slice();state.remove();state.undo();state.select(copyIds,true);
check('Duplicate, delete and Undo restore a grouped note with fresh identity',()=>{assert.ok(copyIds.every(id=>state.page.objects.some(o=>o.id===id)));assert.notEqual(state.objects[0].groupId,state.page.objects.find(o=>o.id===noteGroup[0]).groupId);});state.remove();
state.select([label.id],true);const prior=clone(state.objects[0]);state.patch({locked:true});tools.run('tool:nudge-right');
check('Locked objects reject design-tool changes',()=>assert.equal(state.objects[0].x,prior.x));// Unlock uses the same explicit state change as the Layers action.
state.change(()=>state.objects[0].locked=false);tools.run('tool:nudge-right');state.undo();check('Nudge and Undo recover exact placement',()=>assert.equal(state.objects[0].x,prior.x));
state.select([cut.id],true);reorder(state,[cut.id],'back');state.undo();check('Layer reordering and Undo preserve photo edits',()=>assert.equal(state.page.objects.find(o=>o.id===cut.id).maskStrokes.length,1));
state.add([makeObject('text',{text:'EVIDENCE WORKSHOP',x:64,y:55,w:690,h:70,fontSize:40,bold:true}),makeObject('text',{text:'Use observations to build a question.',x:64,y:660,w:690,h:80,fontSize:24})]);
const sheet=newPage();sheet.name='Evidence table';state.change(()=>{state.project.pages.push(sheet);state.pageId=sheet.id;});
field('[data-create-rows]').value='4';field('[data-create-columns]').value='3';creation.run('create:table-apply');
const tableText=state.objects.filter(o=>o.type==='text');for(const [i,title] of ['Observation','Inference','Question'].entries()){state.select([tableText[i].id],true);state.patch({text:title});}
check('Table builder allows individual grouped heading edits',()=>assert.deepEqual(state.page.objects.filter(o=>o.type==='text').slice(0,3).map(o=>o.text),['Observation','Inference','Question']));
state.add([makeObject('text',{text:'Record evidence, then explain your thinking.',x:64,y:55,w:690,h:60,fontSize:28,bold:true})]);
// Repeat small labels, then align/distribute them with the selection tools.
state.add([makeObject('shape',{x:70,y:600,w:130,h:60,fill:'#e1f6ee'})]);field('[data-create-rows]').value='1';field('[data-create-columns]').value='3';field('[data-create-gap]').value='40';const first=state.selected[0];creation.run('create:repeat-apply');const labels=[first,...state.selected];state.select(labels,true);tools.run('tool:align-distribute-x');tools.run('tool:align-top');
check('Repeat grid plus spacing produces three aligned editable labels',()=>{assert.equal(state.objects.length,3);assert.ok(state.objects.every(o=>o.y===600));assert.deepEqual(state.objects.map(o=>o.x).sort((a,b)=>a-b),[70,240,410]);});
field('[data-create-columns]').value='10';const beforeOverflow=clone(state.project);creation.run('create:repeat-apply');check('An oversized repeat is rejected without changing the document',()=>assert.deepEqual(state.project,beforeOverflow));
field('[data-resource-new-page]').checked=true;field('[data-resource-content]').value='Evidence | Information supporting a claim\nInference | A conclusion drawn from evidence\nContext | Circumstances surrounding an event\nPerspective | A point of view';resources.run('resource:cards:apply');
check('Resource builder creates a third editable page',()=>{assert.equal(state.project.pages.length,3);assert.ok(state.page.objects.some(o=>o.text==='Evidence'));});
for(const page of state.project.pages)for(const o of page.objects){assert.ok(o.w>0&&o.h>0);if(o.visible){assert.ok(o.x>=0&&o.y>=0&&o.x+o.w<=page.width&&o.y+o.h<=page.height);}}
check('All visible objects remain within the three page boundaries',()=>{});
const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};saveProject(state.project);const reopened=validateProject(listProjects()[0]);
check('Save and validated reopen retain all three pages and cutout settings',()=>{assert.equal(reopened.pages.length,3);assert.equal(reopened.pages[0].objects.find(o=>o.id===cut.id).flipX,true);assert.equal(reopened.pages[2].objects.filter(o=>o.text==='Perspective').length,1);});
check('Every page produces clean SVG without editing handles',()=>{for(const page of reopened.pages){const svg=pageSvg(page);assert.ok(svg.includes('<svg'));assert.ok(!svg.includes('data-handle'));}});
const small=new StudioState();small.project.pages=[newPage(100,100)];small.pageId=small.project.pages[0].id;
const smallUi={...ui,state:small};field('[data-create-rows]').value='4';field('[data-create-columns]').value='6';new CreationTools(smallUi).run('create:table-apply');
check('Table builder rejects a layout too small for editable cells',()=>{assert.equal(small.page.objects.length,0);assert.match(messages.at(-1),/too small/);});
if(process.argv.includes('--write-example'))writeFileSync(new URL('../public/tools/art-studio/examples/evidence-workshop.artstudio.json',import.meta.url),JSON.stringify(reopened,null,2)+'\n');
console.log(`${checks} multi-tool scenario checks passed. Controller/DOM-double exercise; browser gestures untested.`);
