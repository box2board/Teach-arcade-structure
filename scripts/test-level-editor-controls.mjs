import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const draw=new Proxy({}, {get:()=>()=>{},set:()=>true});
class Element {
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.dataset={};this.value='';this.scrollLeft=0;this.scrollTop=0;this.clientWidth=800;this.scrollWidth=6000;this.classList={toggle(){},add(){}};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 click(){if(!this.disabled)this.onclick?.();}
 getContext(){return draw;}
 setPointerCapture(){}
 getBoundingClientRect(){return{left:0,top:0,width:parseFloat(this.style.width)||this.width,height:parseFloat(this.style.height)||this.height};}
 addEventListener(){}
 setAttribute(){}
}
const html=fs.readFileSync('public/dev/level-editor/index.html','utf8'),elements={};
for(const m of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"/g))elements[m[2]]=new Element(m[1]);
elements.snap.checked=true;
const storage=new Map(),context={window:{},console,Date,document:{getElementById:id=>elements[id],createElement:tag=>new Element(tag),addEventListener(){},querySelector:s=>elements.palette.children.find(b=>b.dataset.tool===s.match(/data-tool="(.*?)"/)[1]),querySelectorAll:()=>elements.palette.children},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},sessionStorage:{},setTimeout,URL,Blob,performance,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
vm.createContext(context);const run=p=>vm.runInContext(fs.readFileSync('public/'+p,'utf8'),context);
run('arcade-review-games/side-scroller-engine/v1.2/level-builder.js');context.TASideScroller=context.window.TASideScroller;
run('dev/pyramid-escape-v13/level.js');run('dev/level-editor/level-format.js');run('dev/level-editor/object-library.js');run('arcade-review-games/side-scroller-engine/v1.4/path-motion.js');run('dev/level-editor/editor-model.js');run('dev/level-editor/creator-library.js');
const F=context.window.TALevelFile,M=context.window.TALevelEditorModel;
assert.equal(F.validate(M.blank()).errors.length,0);
let d=M.blank();M.create(d,'platforms',5000,600);assert.equal(d.level.platforms[0].x,3712);assert.equal(d.level.platforms[0].y,462);
assert.equal(F.validate(d).errors.length,0);assert.throws(()=>M.resize(d,2000),/Move or delete/);
d=M.blank();d=M.resize(d,7680);assert.equal(d.level.layers.terrain[11].length,240);assert.equal(d.level.layers.terrain[11][239],1);assert.equal(d.level.finish.x,7590);d=M.resize(d,1920);assert.equal(d.level.layers.terrain[0].length,60);assert.equal(F.validate(d).errors.length,0);
M.create(d,'slopes',1919,20);assert.equal(F.validate(d).errors.length,0);
run('dev/level-editor/editor.js');
const current=()=>{elements.save.click();return JSON.parse(storage.get('ta-level-builder-draft-v1'));};
const choose=key=>elements.palette.children.find(b=>b.dataset.tool===key).click();
const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,button:0,preventDefault(){}});
elements.blank.click();assert.equal(current().level.id,'my-level');
choose('platforms');elements.map.onpointerdown(event(600,240));elements.map.onpointerup();assert.equal(current().level.platforms.length,1);
choose('select');elements.map.onpointerdown(event(610,245));elements.map.onpointermove(event(674,245));elements.map.onpointerup();assert.equal(current().level.platforms[0].x,672);
const widthInput=elements.fields.children.find(l=>l.textContent==='Width').children[0];widthInput.value=-50;widthInput.onchange();assert.match(elements.message.textContent,/Invalid/);assert.equal(current().level.platforms[0].w,128);
elements.undo.click();assert.equal(current().level.platforms[0].x,608);elements.redo.click();assert.equal(current().level.platforms[0].x,672);
choose('pan');const before=JSON.stringify(current());elements.viewport.scrollLeft=100;elements.map.onpointerdown(event(300,100));elements.map.onpointermove(event(200,100));elements.map.onpointerup();assert.equal(elements.viewport.scrollLeft,200);assert.equal(JSON.stringify(current()),before);
elements.length.value=7680;elements.resize.click();assert.equal(current().level.world.width,7680);elements.undo.click();assert.equal(current().level.world.width,3840);
elements.length.value=32000;elements.resize.click();elements.zoom.value='1.5';elements.zoom.onchange();assert.ok(elements.map.width<=12000);assert.equal(elements.map.style.width,'48000px');
choose('collectibles');elements.map.onpointerdown(event(1500,300));elements.map.onpointerup();assert.equal(current().level.collectibles[0].x,1008);assert.equal(current().level.collectibles[0].y,208);
console.log('PASS: blank levels, safe resize, clamped placement, pointer movement, invalid property rejection, undo/redo, pan without edits, bounded canvas, zoom coordinates. DOM simulation only; no browser/touch QA claim.');
// Exercise the route editor and style selectors through actual UI handlers.
elements.blank.click();elements.zoom.value='1';elements.zoom.onchange();choose('movingPlatforms');elements.map.onpointerdown(event(600,160));elements.map.onpointerup();
let appearance=elements.fields.children.find(l=>l.textContent==='Appearance').children[0];appearance.value='metal';appearance.onchange();assert.equal(current().level.movingPlatforms[0].style,'metal');
elements['draw-path'].click();elements.map.onpointerdown(event(800,160));elements.map.onpointerup();elements.map.onpointerdown(event(800,240));elements.map.onpointerup();assert.equal(current().level.movingPlatforms[0].path.length,3);
elements['finish-path'].click();assert.equal(F.validate(current()).errors.length,0);
elements['clear-path'].click();assert.equal(current().level.movingPlatforms[0].path,undefined);elements.undo.click();assert.equal(current().level.movingPlatforms[0].path.length,3);
console.log('PASS: style selection, drawn multi-point route, route completion, simple-movement restore and undo.');
elements.blank.click();elements.height.value=1920;elements['resize-height'].click();assert.equal(current().level.world.height,1920);assert.equal(current().level.spawn.y,1740);elements.undo.click();assert.equal(current().level.world.height,480);elements.redo.click();assert.equal(current().level.world.height,1920);
choose('platforms');assert.match(elements['placement-title'].textContent,/Platform/);const material=elements.placement.children.find(l=>l.textContent==='Platform material / style').children[0];material.value='wood';material.onchange();elements.map.onpointerdown(event(400,1300));elements.map.onpointerup();assert.equal(current().level.platforms[0].style,'wood');assert.equal(current().level.platforms[0].y,1296);
choose('movingPlatforms');const direction=elements.placement.children.find(l=>l.textContent==='Movement direction').children[0];direction.value='y';direction.onchange();elements.map.onpointerdown(event(600,1000));elements.map.onpointerup();assert.equal(current().level.movingPlatforms[0].axis,'y');const speed=elements.placement.children.find(l=>l.textContent==='Speed').children[0];speed.value=75;speed.onchange();assert.equal(current().level.movingPlatforms[0].speed,75);
elements.height.value=7680;elements['resize-height'].click();elements.length.value=32000;elements.resize.click();elements.zoom.value='1.5';elements.zoom.onchange();assert.ok(elements.map.width*elements.map.height<=8000000);assert.ok(elements.map.height<=4096);assert.equal(elements.map.style.height,'11520px');
console.log('PASS: height controls and undo, visible platform-material placement, high object placement, prominent moving-platform direction/speed and tall-canvas memory bound.');
// New gestures: pointer resizing, touch-friendly groups, box selection and layer protections.
elements.blank.click();elements.zoom.value='1';elements.zoom.onchange();elements['multi-select'].checked=false;choose('platforms');elements.map.onpointerdown(event(400,240));elements.map.onpointerup();
choose('select');elements.map.onpointerdown(event(528,258));elements.map.onpointermove(event(592,290));elements.map.onpointerup();assert.equal(current().level.platforms[0].w,192);assert.equal(current().level.platforms[0].h,50);elements.undo.click();assert.equal(current().level.platforms[0].w,128);elements.redo.click();assert.equal(current().level.platforms[0].w,192);
// A selection click must not consume the redo stack.
elements.undo.click();elements.map.onpointerdown(event(410,245));elements.map.onpointerup();elements.redo.click();assert.equal(current().level.platforms[0].w,192);
// Cancelled drags restore the original object and remain undoable afterwards.
elements.map.onpointerdown(event(410,245));elements.map.onpointermove(event(474,245));elements.map.onpointercancel({pointerId:1});assert.equal(current().level.platforms[0].x,400);
choose('movingPlatforms');elements.map.onpointerdown(event(800,200));elements.map.onpointerup();elements['draw-path'].click();elements.map.onpointerdown(event(1000,200));elements.map.onpointerup();elements['finish-path'].click();
choose('select');elements['multi-select'].checked=true;elements.map.onpointerdown(event(410,245));elements.map.onpointerup();assert.equal(elements['selection-count'].textContent,'2 selected');elements['multi-select'].checked=false;elements.map.onpointerdown(event(410,245));elements.map.onpointermove(event(474,277));elements.map.onpointerup();assert.equal(current().level.platforms[0].x,464);assert.equal(current().level.movingPlatforms[0].x,864);assert.equal(current().level.movingPlatforms[0].path[1].x,1072);elements.undo.click();assert.equal(current().level.platforms[0].x,400);assert.equal(current().level.movingPlatforms[0].x,800);
choose('boxSelect');elements.map.onpointerdown(event(380,180));elements.map.onpointermove(event(920,300));elements.map.onpointerup();assert.equal(elements['selection-count'].textContent,'2 selected');elements.duplicate.click();assert.equal(current().level.platforms.length,2);assert.equal(current().level.movingPlatforms.length,2);elements.delete.click();assert.equal(current().level.platforms.length,1);elements.undo.click();assert.equal(current().level.platforms.length,2);
const control=(layer,setting)=>elements['layer-controls'].children.flatMap(row=>row.children).flatMap(w=>w.children||[]).find(el=>el.dataset?.layer===layer&&el.dataset.setting===setting);
const lock=control('terrain','locked');lock.checked=true;lock.onchange();assert.equal(elements['selection-count'].textContent,'No selection');choose('select');elements.map.onpointerdown(event(410,245));elements.map.onpointerup();assert.equal(elements['selection-count'].textContent,'No selection');
const beforeLocked=JSON.stringify(current().level);choose('terrain');elements.map.onpointerdown(event(10,10));elements.map.onpointerup();assert.equal(JSON.stringify(current().level),beforeLocked);lock.checked=false;lock.onchange();
const show=control('terrain','visible');show.checked=false;show.onchange();choose('boxSelect');elements.map.onpointerdown(event(380,180));elements.map.onpointermove(event(920,290));elements.map.onpointerup();assert.equal(elements['selection-count'].textContent,'No selection');assert.equal(current().level.platforms.length,2);show.checked=true;show.onchange();
console.log('PASS: resize handle and undo/redo, no-op selection preserves redo, pointer cancellation, additive group/path dragging, box selection, batch duplicate/delete, hidden/locked selection exclusion, terrain painting lock and export preservation.');
// Named saves and reusable sections operate through the same UI as normal editing.
elements.blank.click();elements.zoom.value='1';elements.zoom.onchange();choose('movingPlatforms');elements.map.onpointerdown(event(400,240));elements.map.onpointerup();elements['draw-path'].click();elements.map.onpointerdown(event(600,160));elements.map.onpointerup();elements['finish-path'].click();
elements['project-name'].value='Project A';elements['project-new'].click();let library=JSON.parse(storage.get('ta-creator-library-v1'));const projectA=library.projects[0].id;assert.equal(library.projects[0].document.level.movingPlatforms.length,1);
elements['section-name'].value='Elevator';elements['section-save'].click();library=JSON.parse(storage.get('ta-creator-library-v1'));assert.equal(library.sections.length,1);assert.equal(library.sections[0].content.objects[0].data.path.length,2);
elements.name.value='modified-level';elements.name.onchange();elements['project-update'].click();library=JSON.parse(storage.get('ta-creator-library-v1'));assert.equal(library.projects[0].document.level.id,'modified-level');elements['project-name'].value='Project B';elements['project-new'].click();assert.equal(JSON.parse(storage.get('ta-creator-library-v1')).projects.length,2);
elements['project-name'].value='Renamed B';elements['project-rename'].click();assert.equal(JSON.parse(storage.get('ta-creator-library-v1')).projects[1].name,'Renamed B');
elements.blank.click();assert.equal(elements['project-update'].disabled,true);elements['section-place'].click();elements.map.onpointerdown(event(320,160));elements.map.onpointerup();assert.equal(current().level.movingPlatforms.length,1);assert.equal(current().level.movingPlatforms[0].path[1].x-current().level.movingPlatforms[0].path[0].x,208);elements.undo.click();assert.equal((current().level.movingPlatforms||[]).length,0);elements.redo.click();assert.equal(current().level.movingPlatforms.length,1);
const beforeBlocked=JSON.stringify(current().level);lock.checked=true;lock.onchange();elements['section-place'].click();elements.map.onpointerdown(event(1000,160));elements.map.onpointerup();assert.equal(JSON.stringify(current().level),beforeBlocked);elements['section-cancel'].click();lock.checked=false;lock.onchange();
elements.projects.value=projectA;elements['project-open'].click();assert.equal(elements.name.value,'modified-level');assert.equal(elements.undo.disabled,true);
// Explicitly restore the draft created when opening Project A; avoid overwriting it via current().
elements['restore-draft'].click();assert.equal(current().level.id,'my-level');assert.equal(elements['project-update'].disabled,true);
console.log('PASS: named project save/update/copy/rename/open, blank-level detachment, section save/place/undo/redo, layer-protected placement and browser draft recovery.');

elements['section-remove'].click();assert.equal(JSON.parse(storage.get('ta-creator-library-v1')).sections.length,0);elements['library-undo'].click();assert.equal(JSON.parse(storage.get('ta-creator-library-v1')).sections.length,1);assert.equal(elements['library-undo'].disabled,true);
console.log('PASS: remove saved item and undo without changing the open level.');
const Art=context.window.TAObjectLibrary;
assert.equal(Object.keys(Art.palettes).length,20);
assert.ok(Art.styles.decorations.includes('waterfall')&&Art.styles.decorations.includes('rooftop-vent'));
assert.ok(Art.styles.platforms.includes('ice')&&Art.styles.platforms.includes('crystal'));
for(const scene of Object.keys(Art.palettes)){Art.drawEditorBackdrop(draw,scene,1600,960,Art.backdropDefaults);Art.drawPlayBackdrop(draw,scene,280,90,480,320,960,Art.backdropDefaults);}
for(const style of Art.styles.decorations)Art.draw(draw,'decorations',{style,x:0,y:0,w:96,h:128});
elements.blank.click();elements.theme.value='underwater';elements.theme.onchange();assert.equal(current().scene,'underwater');
const bgRows=elements['background-controls'].children;assert.equal(bgRows.length,4);const nearToggle=bgRows.find(row=>row.children[0].children[1].textContent==='Near silhouettes').children[0].children[0];nearToggle.checked=false;nearToggle.onchange();let bgDoc=current();assert.equal(bgDoc.backgroundLayers.near,false);assert.equal(bgDoc.scene,'underwater');elements.undo.click();bgDoc=current();assert.equal(bgDoc.backgroundLayers?.near??true,true);const restoredNear=elements['background-controls'].children.find(row=>row.children[0].children[1].textContent==='Near silhouettes').children[0].children[0];assert.equal(restoredNear.checked,true);restoredNear.checked=false;restoredNear.onchange();
elements['project-name'].value='Underwater scene';elements['project-new'].click();const savedBg=JSON.parse(storage.get('ta-creator-library-v1')).projects.at(-1).document;assert.equal(savedBg.scene,'underwater');assert.equal(savedBg.backgroundLayers.near,false);
console.log('PASS: twenty environment backdrops, expanded platform/scenery catalog rendering, saved background-layer toggles, scene undo and named-project persistence.');
elements.blank.click();elements.zoom.value='1';elements.zoom.onchange();choose('platforms');let browser=elements.placement.children.find(el=>el.id==='asset-browser');assert.equal(browser.children.length,Art.styles.platforms.length);browser.children.find(card=>card.children[1].textContent==='crystal').click();elements.map.onpointerdown(event(500,250));elements.map.onpointerup();assert.equal(current().level.platforms[0].style,'crystal');choose('decorations');browser=elements.placement.children.find(el=>el.id==='asset-browser');assert.equal(browser.children.length,Art.styles.decorations.length);browser.children.find(card=>card.children[1].textContent==='waterfall').click();elements.map.onpointerdown(event(800,200));elements.map.onpointerup();assert.equal(current().level.decorations[0].style,'waterfall');
console.log('PASS: visual asset cards select replacement artwork for platforms and scenery before placement.');
elements.blank.click();elements.zoom.value='1';elements.zoom.onchange();choose('decorations');browser=elements.placement.children.find(el=>el.id==='asset-browser');browser.children.find(card=>card.children[1].textContent==='cloud').click();elements.map.onpointerdown(event(900,110));elements.map.onpointerup();elements['theme-catalog'].children.find(card=>card.dataset.scene==='forest').click();let themed=current();assert.ok(themed.level.decorations.filter(o=>o.themeGenerated).length>=6);assert.ok(themed.level.decorations.some(o=>o.style==='cloud'&&!o.themeGenerated));choose('select');const generated=themed.level.decorations.find(o=>o.themeGenerated);elements.map.onpointerdown(event(generated.x+12,generated.y+12));elements.map.onpointerup();browser=elements.placement.children.find(el=>el.id==='asset-browser');browser.children.find(card=>card.children[1].textContent==='tree').click();elements['theme-catalog'].children.find(card=>card.dataset.scene==='volcano').click();themed=current();assert.ok(themed.level.decorations.some(o=>o.style==='tree'&&!o.themeGenerated));assert.ok(themed.level.decorations.some(o=>o.style==='cloud'&&!o.themeGenerated));assert.ok(themed.level.decorations.filter(o=>o.themeGenerated).every(o=>o.style!=='pine'));
console.log('PASS: theme cards populate editable scenery; customized theme props and hand-placed scenery survive switching themes.');

assert.equal(Art.styles.decorations.length,48);assert.equal(Art.styles.platforms.length,17);assert.equal(elements["theme-catalog"].children.length,20);
for(const style of Art.styles.platforms)Art.draw(draw,"platforms",{style,w:120,h:24});
for(const scene of Object.keys(Art.palettes)){elements["theme-catalog"].children.find(card=>card.dataset.scene===scene).click();assert.equal(current().scene,scene);assert.ok(current().level.decorations.filter(o=>o.themeGenerated).every(o=>Art.styles.decorations.includes(o.style)));}
console.log("PASS: all 20 theme presets populate valid editable props; all 48 scenery and 17 platform styles render.");
