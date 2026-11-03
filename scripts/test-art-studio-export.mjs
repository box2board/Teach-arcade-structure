// Independent-renderer test adapter, NOT a browser/download test.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {StudioState,newProject,newPage,clone,applyObjectValues} from '../public/tools/art-studio/state.js';
import {makeObject,pageSvg,textLines} from '../public/tools/art-studio/objects.js';
import {copySelectionLayer,moveSelectionPoint,rectanglePoints} from '../public/tools/art-studio/image-selection.js';
import {validateProject} from '../public/tools/art-studio/storage.js';
import {exportDimensions,exportImage,exportPdf} from '../public/tools/art-studio/export.js';
import {buildTemplate} from '../public/tools/art-studio/templates.js';
import {StudioUI} from '../public/tools/art-studio/ui.js';
let checks=0;const check=(label,fn)=>{fn();checks++;console.log('PASS '+label);};
const photo=readFileSync(new URL('../public/tools/art-studio/examples/assets/grace-hopper.jpg',import.meta.url)),src='data:image/jpeg;base64,'+photo.toString('base64');
const outline=[[27,23],[28,17],[33,11],[34,8],[43,4],[46,3],[56,5],[65,9],[70,14],[73,18],[73,27],[74,34],[72,42],[70,49],[71,53],[80,56],[91,60],[97,67],[100,78],[100,100],[3,100],[4,82],[6,72],[10,65],[18,61],[28,57],[32,53],[32,47],[30,41],[29,34]];
let refined=outline;for(const [index,x,y] of [[10,71,27],[11,73,34],[12,70,42],[13,65,49],[14,66,54],[15,80,58],[16,90,62],[17,97,69]])refined=moveSelectionPoint(refined,index,x,y);
check('Real-photo outline points refine independently of the initial outline',()=>{assert.equal(outline[10][0],73);assert.equal(refined[10][0],71);assert.notDeepEqual(refined,outline);});
// Retrace the actual hat, ear, hair and shoulder boundary in source-photo pixels.
const precisePixels=[[151,154],[147,132],[147,116],[150,97],[157,84],[168,75],[175,55],[187,44],[210,35],[218,29],[236,27],[254,27],[270,31],[283,32],[292,40],[310,45],[324,53],[334,65],[342,79],[353,83],[365,85],[371,93],[371,112],[368,134],[365,151],[366,168],[374,190],[377,205],[373,220],[368,233],[365,247],[359,266],[353,284],[344,301],[336,315],[355,335],[381,347],[413,358],[445,368],[471,379],[486,390],[495,412],[501,445],[506,485],[512,535],[512,600],[15,600],[18,558],[20,516],[24,469],[27,434],[32,407],[40,386],[49,378],[71,367],[99,359],[127,352],[152,347],[183,341],[188,334],[186,312],[178,293],[163,282],[161,270],[159,253],[155,238],[153,222],[152,211],[155,202],[151,192],[151,178],[153,164]];
refined=precisePixels.map(([x,y])=>[x/512*100,y/600*100]);
const state=new StudioState();state.project.name='Grace Hopper — real photo editing study';state.project.pages=[newPage(1080,1080)];state.pageId=state.project.pages[0].id;state.page.name='Classroom poster';state.page.background='#e4edf4';
const image=makeObject('image',{src,name:'Grace Hopper source photo',x:250,y:220,w:580,h:580*600/512});state.add([image]);state.patch({brightness:104,contrast:106,saturation:90});const unchanged=clone(state.objects[0]);
const cutout=copySelectionLayer(state.objects[0],refined,.2,-.2,true);state.change(()=>{state.page.objects[0].visible=false;state.page.objects.push(cutout);});
state.add([makeObject('text',{x:70,y:45,w:940,h:90,text:'GRACE HOPPER',fontSize:64,bold:true,fill:'#18344f'}),makeObject('text',{x:75,y:140,w:930,h:70,text:'How can one idea change what computers can do?',fontSize:30,fill:'#18344f'}),makeObject('text',{x:80,y:960,w:930,h:70,text:'NOTICE • QUESTION • DISCOVER',fontSize:34,bold:true,fill:'#18344f'})]);
// These comparison pages intentionally retain full-source framing for pixel checks.
const fullCutout=clone(cutout);applyObjectValues(fullCutout,{crop:0,cropLeft:0,cropTop:0,cropRight:0,cropBottom:0});
const comparison=newPage(1200,800);comparison.name='Original and manual cutout';comparison.background='#edf2f7';comparison.objects=[{...clone(image),id:'hopperoriginal',x:60,y:130,w:420,h:420*600/512},{...clone(fullCutout),id:'hoppercutout',x:650,y:130,w:420,h:420*600/512},makeObject('text',{x:60,y:40,w:500,h:70,text:'ORIGINAL',fontSize:42,bold:true}),makeObject('text',{x:650,y:40,w:500,h:70,text:'MANUAL CUTOUT',fontSize:42,bold:true})];
const alphaPage=newPage(600,704);alphaPage.name='Transparent cutout';alphaPage.objects=[{...clone(fullCutout),id:'hopperalpha',x:0,y:0,w:600,h:600*600/512}];state.project.pages.push(comparison,alphaPage);
const project=validateProject(state.project);
check('Real photograph survives selection copying and validated JSON reopen',()=>{assert.equal(project.pages.length,3);assert.equal(project.pages[0].objects[0].src,unchanged.src);assert.equal(project.pages[0].objects[0].maskStrokes,undefined);assert.equal(project.pages[0].objects[1].maskStrokes.at(-1).points.length,precisePixels.length);assert.equal(project.pages[2].objects[0].maskStrokes.at(-1).outside,true);});
if(process.argv.includes('--write-example'))writeFileSync(new URL('../public/tools/art-studio/examples/grace-hopper-photo-study.artstudio.json',import.meta.url),JSON.stringify(project,null,2)+'\n');
check('Print resolution generates Letter 2550 by 3300 pixels',()=>assert.deepEqual(exportDimensions({width:816,height:1056},3.125),{width:2550,height:3300,scale:3.125}));
check('Unsafe export sizes reject before canvas allocation',()=>{for(const scale of [0,-1,NaN,Infinity,100])assert.throws(()=>exportDimensions(alphaPage,scale));assert.throws(()=>exportDimensions({width:4000,height:4000},2));});
// Exercise the actual dialog callbacks without a browser DOM.
class Field{constructor(value=''){this.value=value;this.dataset={};this.checked=false;this.disabled=false;}}
const fields=new Map(),q=k=>{if(!fields.has(k))fields.set(k,new Field());return fields.get(k);};
const ui=Object.create(StudioUI.prototype);ui.state=new StudioState(project);ui.root={querySelector:q};ui.modal=()=>{q('[data-export-type]').value='png';q('[data-export-resolution]').value='1';q('[data-export-width]').value=String(ui.state.page.width);q('[data-export-height]').value=String(ui.state.page.height);};ui.exportDialog();
check('Export dialog previews solid output by default',()=>{assert.match(q('[data-export-preview]').innerHTML,/fill="#e4edf4"/);assert.equal(q('[data-export-format]').dataset.exportFormat,'png');});
q('[data-export-transparent]').checked=true;q('[data-export-transparent]').onchange();check('Transparency preview removes page paint and retains design layers',()=>{assert.ok(!q('[data-export-preview]').innerHTML.includes('fill="#e4edf4"'));assert.match(q('[data-export-preview]').innerHTML,/GRACE HOPPER/);assert.equal(q('[data-export-format]').dataset.exportFormat,'png-transparent');});
q('[data-export-type]').value='jpg';q('[data-export-type]').onchange();check('JPG disables transparency and restores solid preview',()=>{assert.equal(q('[data-export-transparent]').disabled,true);assert.match(q('[data-export-preview]').innerHTML,/fill="#e4edf4"/);});
q('[data-export-resolution]').value='3.125';q('[data-export-resolution]').onchange();check('Print preset updates output size and effective PPI',()=>{assert.equal(Number(q('[data-export-width]').value),3375);assert.match(q('[data-export-summary]').textContent,/300 ppi/);});
q('[data-export-width]').value='540';q('[data-export-width]').oninput();check('Custom width preserves proportions',()=>{assert.equal(Number(q('[data-export-height]').value),540);assert.equal(ui.exportSettings.scale,.5);});
q('[data-export-width]').value='99999';q('[data-export-width]').oninput();check('Invalid size disables export with a visible error',()=>{assert.equal(q('[data-export-format]').disabled,true);assert.match(q('[data-export-error]').textContent,/8192/);});
q('[data-export-width]').value='540';q('[data-export-width]').oninput();q('[data-export-type]').value='pdf';q('[data-export-type]').onchange();check('PDF dialog applies one resolution to all pages',()=>{assert.equal(q('[data-export-format]').dataset.exportFormat,'pdf');assert.match(q('[data-export-summary]').textContent,/all 3 pages/);assert.equal(q('[data-export-transparent]').disabled,true);});
// An offline canvas adapter renders serialized SVG with Inkscape, not browser APIs.
const output=mkdtempSync(join(tmpdir(),'art-studio-export-'));const urls=new Map();let serial=0;
URL.createObjectURL=blob=>{const url='offline:'+serial++;urls.set(url,blob);return url;};URL.revokeObjectURL=url=>urls.delete(url);
globalThis.Image=class{set src(url){urls.get(url).text().then(svg=>{this.svg=svg;this.onload();});}};
class OfflineCanvas{
 getContext(){const canvas=this;return {font:'16px Arial',measureText(text){return {width:text.length*(Number(this.font.match(/([\d.]+)px/)?.[1])||16)*.5};},drawImage(image){canvas.svg=image.svg;}};}
 bytes(mime){const base=join(output,'render-'+serial++);writeFileSync(base+'.svg',this.svg);execFileSync('inkscape',[base+'.svg','--export-type=png','--export-width='+this.width,'--export-height='+this.height,'--export-filename='+base+'.png'],{stdio:'pipe'});if(mime==='image/jpeg'){execFileSync('python3',['-c',"from PIL import Image;import sys;im=Image.open(sys.argv[1]).convert('RGBA');bg=Image.new('RGB',im.size,'white');bg.paste(im,mask=im.getchannel('A'));bg.save(sys.argv[2],quality=95)",base+'.png',base+'.jpg']);return readFileSync(base+'.jpg');}return readFileSync(base+'.png');}
 toBlob(callback,mime){callback(new Blob([this.bytes(mime)],{type:mime}));}
 toDataURL(mime){return 'data:'+mime+';base64,'+this.bytes(mime).toString('base64');}
}
globalThis.document={createElement:()=>new OfflineCanvas()};
const png=await exportImage(project.pages[2],'hopper','png-transparent',{scale:.5});writeFileSync(join(output,'cutout.png'),Buffer.from(await png.blob.arrayBuffer()));
check('PNG export applies scale and returns image bytes',()=>{assert.equal(png.width,300);assert.equal(png.height,352);assert.equal(png.blob.type,'image/png');assert.equal(png.filename,'hopper-transparent.png');});
const jpg=await exportImage(project.pages[2],'hopper','jpg',{scale:.5});writeFileSync(join(output,'cutout.jpg'),Buffer.from(await jpg.blob.arrayBuffer()));
check('JPG export returns requested format and dimensions',()=>{assert.equal(jpg.width,300);assert.equal(jpg.height,352);assert.equal(jpg.blob.type,'image/jpeg');});
const pdf=await exportPdf(project,{scale:.5});writeFileSync(join(output,'study.pdf'),Buffer.from(await pdf.blob.arrayBuffer()));
check('PDF export serializes all pages and releases image URLs',()=>{assert.equal(pdf.blob.type,'application/pdf');assert.equal(urls.size,0);});
for(const [label,expand] of [['contract',-2],['expand',2]]){const edge=copySelectionLayer(makeObject('image',{src,x:0,y:0,w:512,h:600}),rectanglePoints([25,25],[75,75]),0,expand);const out=await exportImage({width:512,height:600,background:'#ffffff',objects:[edge]},label,'png-transparent');writeFileSync(join(output,label+'.png'),Buffer.from(await out.blob.arrayBuffer()));}
// Render the same source-position cutout with tight and full boxes independently.
for(const [label,options] of [['tight',{}],['flipped',{flipX:true,flipY:true,angle:17}]]){
 const source=makeObject('image',{src,x:100,y:70,w:360,h:420,...options});
 const tight=copySelectionLayer(source,rectanglePoints([65,30],[92,72]),.5,1,true),full=clone(tight);
 applyObjectValues(full,{crop:0,cropLeft:0,cropTop:0,cropRight:0,cropBottom:0});
 for(const [suffix,obj] of [['trimmed',tight],['full',full]]){
  const rendered=await exportImage({width:600,height:600,background:'#ffffff',objects:[obj]},label,'png-transparent');
  writeFileSync(join(output,label+'-'+suffix+'.png'),Buffer.from(await rendered.blob.arrayBuffer()));
 }
}
execFileSync('python3',['-c',`from PIL import Image,ImageChops
from pypdf import PdfReader
from pathlib import Path
import sys
p=Path(sys.argv[1]);png=Image.open(p/'cutout.png').convert('RGBA');jpg=Image.open(p/'cutout.jpg')
for label in ['tight','flipped']:
 trimmed=Image.open(p/(label+'-trimmed.png')).convert('RGBA');full=Image.open(p/(label+'-full.png')).convert('RGBA')
 # Source placement and feather survive trimming; tolerate independent renderer rounding.
 diff=ImageChops.difference(trimmed,full)
 assert max(diff.getchannel('A').getextrema())<=2
 assert sum(diff.getchannel('A').getdata())<1000
assert png.size==(300,352) and jpg.size==(300,352)
contract=Image.open(p/'contract.png').convert('RGBA').getchannel('A');expand=Image.open(p/'expand.png').convert('RGBA').getchannel('A')
assert contract.getpixel((133,300))==0 and contract.getpixel((150,300))==255
assert expand.getpixel((120,300))==255 and expand.getpixel((100,300))==0
a=png.getchannel('A');assert a.getpixel((104,188))==0 and a.getpixel((105,184))==0
assert a.getpixel((260,212))==0 and a.getpixel((270,219))==0
assert a.getpixel((150,140))>240 and a.getpixel((5,5))==0
assert any(0<v<255 for v in a.getdata())
assert jpg.mode=='RGB' and all(v>245 for v in jpg.getpixel((5,5)))
r=PdfReader(p/'study.pdf',strict=True);assert len(r.pages)==3
for page,(w,h) in zip(r.pages,[(810,810),(900,600),(450,528)]):
 assert float(page.mediabox.width)==w and float(page.mediabox.height)==h
 assert len(page.images)==1
assert r.pages[0].images[0].image.size==(540,540)
assert r.pages[1].images[0].image.size==(600,400)
assert r.pages[2].images[0].image.size==(300,352)
`,output],{stdio:'pipe'});
check('Independent file inspection confirms alpha, feathering, JPG background and PDF page sizes',()=>{});
check('Raster alpha confirms contraction trims the edge and expansion retains more subject area',()=>{});
check('Hopper neck flag and shoulder halo sample pixels are transparent while face stays opaque',()=>{});
check('Tight and full cutout renders retain matching alpha placement, including flips, rotation and feather',()=>{});
const printProject=newProject();printProject.name='Classroom print check';printProject.pages=[buildTemplate('Classroom Poster'),buildTemplate('Exit Ticket')];
for(const [i,page] of printProject.pages.entries()){
 check('Print page '+(i+1)+' retains Letter size and printable content bounds',()=>{assert.equal(page.width,816);assert.equal(page.height,1056);for(const o of page.objects){assert.ok(o.x>=40&&o.y>=40);assert.ok(o.x+o.w<=776&&o.y+o.h<=1016);if(o.type==='text')assert.ok(o.fontSize>=15);}});
 const result=await exportImage(page,'print-check-'+i,'png',{scale:1.5});writeFileSync(join(output,'print-check-'+i+'.png'),Buffer.from(await result.blob.arrayBuffer()));
}
const headline=printProject.pages[0].objects.find(o=>o.type==='text'&&o.text.startsWith('A little curiosity'));check('Poster headline remains two lines clear of the supporting text',()=>{assert.equal(textLines(headline).length,2);assert.ok(headline.y+textLines(headline).length*headline.fontSize*headline.lineHeight<390);});
const printPdf=await exportPdf(printProject,{scale:1.5});writeFileSync(join(output,'classroom-print-check.pdf'),Buffer.from(await printPdf.blob.arrayBuffer()));
execFileSync('python3',['-c',"from pypdf import PdfReader;import sys;r=PdfReader(sys.argv[1],strict=True);assert len(r.pages)==2;assert all(float(p.mediabox.width)==612 and float(p.mediabox.height)==792 for p in r.pages);assert all(p.images[0].image.size==(1224,1584) for p in r.pages)",join(output,'classroom-print-check.pdf')],{stdio:'pipe'});
check('Poster and worksheet PDF have correct physical Letter pages and full raster content',()=>{});
const workshop=validateProject(JSON.parse(readFileSync(new URL('../public/tools/art-studio/examples/evidence-workshop.artstudio.json',import.meta.url),'utf8')));
for(const [i,page] of workshop.pages.entries()){const result=await exportImage(page,'workshop-'+i,'png',{scale:1});writeFileSync(join(output,'workshop-'+i+'.png'),Buffer.from(await result.blob.arrayBuffer()));}
const workshopPdf=await exportPdf(workshop,{scale:.75});writeFileSync(join(output,'workshop.pdf'),Buffer.from(await workshopPdf.blob.arrayBuffer()));
execFileSync('python3',['-c',"from pypdf import PdfReader;import sys;r=PdfReader(sys.argv[1],strict=True);assert len(r.pages)==3;assert all(float(p.mediabox.width)==612 and float(p.mediabox.height)==792 for p in r.pages);assert all(p.images[0].image.size==(612,792) for p in r.pages)",join(output,'workshop.pdf')],{stdio:'pipe'});
check('Multi-tool workshop exports all three pages with correct PDF page size and image content',()=>{});
console.log(`${checks} export/photo checks passed. Independent SVG rendering; browser/download behavior untested.`);console.log('Inspection files: '+output);
