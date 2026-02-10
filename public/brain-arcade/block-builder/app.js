import * as THREE from 'https://unpkg.com/three@0.162.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.162.0/examples/jsm/controls/OrbitControls.js';
import { CATEGORY_ICONS } from './icons.js';

const STORAGE_KEY = 'teacharcade_blockbuilder_v1';
const categories = ['Structural', 'Connector', 'Logic', 'Resource', 'System', 'Timeline', 'Constraint', 'Event'];
const categoryColors = { Structural:'#38bdf8', Connector:'#f59e0b', Logic:'#a78bfa', Resource:'#34d399', System:'#fb7185', Timeline:'#facc15', Constraint:'#94a3b8', Event:'#f97316' };
const blockTypes = [
  { type:'Cube', category:'Structural', size:[1,1,1], shape:'box' },
  { type:'Slab', category:'Structural', size:[2,0.5,2], shape:'box' },
  { type:'Wall', category:'Structural', size:[2,2,1], shape:'box' },
  { type:'Ramp', category:'Structural', size:[2,1,1], shape:'wedge' },
  { type:'Node', category:'Connector', size:[1,1,1], shape:'sphere' },
  { type:'Bridge', category:'Connector', size:[2,0.5,1], shape:'box' },
  { type:'Decision Diamond', category:'Logic', size:[1,1,1], shape:'diamond' },
  { type:'Splitter', category:'Logic', size:[1,1,1], shape:'splitter' },
  { type:'Battery', category:'Resource', size:[1,1,1], shape:'capsule' },
  { type:'Canister', category:'Resource', size:[1,2,1], shape:'cylinder' },
  { type:'Control Core', category:'System', size:[2,1,2], shape:'box' },
  { type:'Arrow Prism', category:'Timeline', size:[2,1,1], shape:'arrow' },
  { type:'Barrier', category:'Constraint', size:[2,2,1], shape:'box' },
  { type:'Burst', category:'Event', size:[1,1,1], shape:'burst' }
];

const $ = (id) => document.getElementById(id);
const state = { selectedType:blockTypes[0], activeCategory:'Structural', blocks:[], selectedId:null, previewRotation:0, undo:[], redo:[], pointer:{x:0,y:0}, canPlace:false };
let renderer, scene, camera, controls, raycaster, plane, previewMesh;
const meshMap = new Map(), textureCache = new Map(), geometryCache = new Map(), materialCache = new Map();
let moveScheduled = false;

function track(name, params={}){ if(window.gtag){ window.gtag('event', name, params); } }
function supportsWebGL(){ const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }

function initUi(){
  const tabs = $('categoryTabs');
  categories.forEach((cat)=>{ const b = document.createElement('button'); b.className='category-tab'; b.type='button'; b.textContent=cat; b.setAttribute('role','tab'); b.setAttribute('aria-selected',cat===state.activeCategory); b.onclick=()=>{state.activeCategory=cat; renderTabs(); renderBlockList();}; tabs.appendChild(b); });
  renderBlockList();
  $('blockSearch').addEventListener('input', renderBlockList);
  $('saveBuild').onclick = saveLocal;
  $('loadBuild').onclick = loadLocal;
  $('undoAction').onclick = undo;
  $('redoAction').onclick = redo;
  $('resetBuild').onclick = resetBuild;
  $('exportJson').onclick = exportJson;
  $('importJson').onclick = () => $('importDialog').showModal();
  $('confirmImport').addEventListener('click', importJson);
  $('importFile').addEventListener('change', importFile);
  $('downloadImage').onclick = downloadImage;
  $('rotateLeft').onclick = ()=>rotate(-90);
  $('rotateRight').onclick = ()=>rotate(90);
  $('deleteSelected').onclick = deleteSelected;
  $('applyProps').onclick = applyInspector;
  window.addEventListener('keydown', handleKeys);
}
function renderTabs(){ [...$('categoryTabs').children].forEach((el)=>el.setAttribute('aria-selected',el.textContent===state.activeCategory)); }
function renderBlockList(){
  const q = $('blockSearch').value.trim().toLowerCase();
  const list = $('blockList'); list.innerHTML='';
  blockTypes.filter((b)=>b.category===state.activeCategory && b.type.toLowerCase().includes(q)).forEach((b)=>{
    const item=document.createElement('button'); item.type='button'; item.className='block-item'; item.innerHTML=`<img src="${CATEGORY_ICONS[b.category]}" alt=""/><span><strong>${b.type}</strong><small>${b.category}</small></span>`;
    item.onclick=()=>{state.selectedType=b; updatePreview(); track('block_select',{block_type:b.type});}; list.appendChild(item);
  });
}

function initThree(){
  if(!supportsWebGL()){ $('canvasFallback').textContent='WebGL is unavailable on this browser/device. Use the classroom prompts below or try a modern browser.'; return; }
  const mount = $('canvasMount');
  scene = new THREE.Scene(); scene.background = new THREE.Color('#0b1220');
  camera = new THREE.PerspectiveCamera(55, mount.clientWidth/500, 0.1, 200); camera.position.set(8,9,8);
  renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true }); renderer.setSize(mount.clientWidth,500); renderer.shadowMap.enabled=true; mount.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches; controls.minDistance=5; controls.maxDistance=30; controls.maxPolarAngle=Math.PI*0.48; controls.target.set(0,0,0);
  raycaster = new THREE.Raycaster();
  scene.add(new THREE.HemisphereLight(0xffffff,0x0b1020,1.1));
  const dl = new THREE.DirectionalLight(0xffffff,1); dl.position.set(12,14,8); dl.castShadow=true; scene.add(dl);
  const grid = new THREE.GridHelper(120,120,0x334155,0x1f2937); scene.add(grid);
  plane = new THREE.Mesh(new THREE.PlaneGeometry(120,120), new THREE.MeshStandardMaterial({ color:'#0b1220', transparent:true, opacity:0.01 })); plane.rotateX(-Math.PI/2); plane.receiveShadow=true; scene.add(plane);
  previewMesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({ color:'#93c5fd', transparent:true, opacity:0.45 })); previewMesh.visible=false; scene.add(previewMesh);
  renderer.domElement.addEventListener('pointermove', onPointerMove, { passive:true });
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('resize', onResize);
  $('canvasFallback').style.display = 'none';
  animate();
}

function makeGeometry(def){
  if (geometryCache.has(def.type)) return geometryCache.get(def.type);
  const [sx,sy,sz]=def.size; let g;
  if(def.shape==='box') g = new THREE.BoxGeometry(sx, sy, sz);
  else if(def.shape==='sphere') g = new THREE.SphereGeometry(0.55, 20, 20);
  else if(def.shape==='diamond') g = new THREE.OctahedronGeometry(0.7);
  else if(def.shape==='cylinder') g = new THREE.CylinderGeometry(0.45,0.45,2,20);
  else if(def.shape==='capsule') g = new THREE.CapsuleGeometry(0.32,0.5,6,12);
  else if(def.shape==='burst') g = new THREE.IcosahedronGeometry(0.75,0);
  else if(def.shape==='wedge'){ g = new THREE.BufferGeometry(); const verts=new Float32Array([ -1,-0.5,-0.5, 1,-0.5,-0.5, 1,-0.5,0.5, -1,-0.5,0.5, -1,0.5,-0.5, 1,0.5,-0.5 ]); const idx=[0,1,2,0,2,3,0,4,5,0,5,1,1,5,2,0,3,4,3,2,5,3,5,4]; g.setAttribute('position', new THREE.BufferAttribute(verts,3)); g.setIndex(idx); g.computeVertexNormals(); g.scale(sx/2,sy,sz); }
  else if(def.shape==='arrow'){ g = new THREE.ConeGeometry(0.6,1.2,4); g.rotateZ(-Math.PI/2); g.scale(1.2,0.8,0.8); }
  else if(def.shape==='splitter'){ g = new THREE.BoxGeometry(1,1,1); }
  geometryCache.set(def.type, g); return g;
}
function makeMaterial(category){ if(materialCache.has(category)) return materialCache.get(category); const m = new THREE.MeshStandardMaterial({ color: categoryColors[category], roughness:0.55, metalness:0.12 }); materialCache.set(category,m); return m; }
async function iconTexture(category){
  if(textureCache.has(category)) return textureCache.get(category);
  const img = new Image(); img.src = CATEGORY_ICONS[category]; await img.decode();
  const c=document.createElement('canvas'); c.width=64;c.height=64; const ctx=c.getContext('2d'); ctx.fillStyle='rgba(15,23,42,.65)'; ctx.fillRect(0,0,64,64); ctx.fillStyle='#f8fafc'; ctx.drawImage(img,12,12,40,40);
  const t=new THREE.CanvasTexture(c); textureCache.set(category,t); return t;
}

async function createBlockMesh(block){
  const def = blockTypes.find((b)=>b.type===block.type);
  const mesh = new THREE.Mesh(makeGeometry(def), makeMaterial(def.category));
  mesh.castShadow=true; mesh.receiveShadow=true; mesh.position.set(...block.position); mesh.rotation.y = block.rotationY; mesh.userData.id = block.id;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: await iconTexture(def.category), transparent:true, depthTest:false })); sprite.scale.set(0.7,0.7,0.7); sprite.position.set(0,Math.max(def.size[1],1)*0.7,0); mesh.add(sprite);
  scene.add(mesh); meshMap.set(block.id, mesh);
}

function updatePreview(){
  if(!previewMesh) return;
  const def = state.selectedType;
  previewMesh.geometry = makeGeometry(def);
  previewMesh.material = new THREE.MeshStandardMaterial({ color: categoryColors[def.category], transparent:true, opacity:0.42 });
  previewMesh.rotation.y = THREE.MathUtils.degToRad(state.previewRotation);
  previewMesh.visible = true;
}
function snap(v){ return Math.round(v); }
function previewPos(intersection){ const def = state.selectedType; const y = Math.max(def.size[1]/2, 0.5); return [snap(intersection.x), y, snap(intersection.z)]; }
function onPointerMove(e){ state.pointer={x:e.offsetX,y:e.offsetY}; if(moveScheduled) return; moveScheduled=true; requestAnimationFrame(()=>{ moveScheduled=false; if(!previewMesh) return; const p = normPointer(); raycaster.setFromCamera(p,camera); const hit = raycaster.intersectObject(plane)[0]; if(hit){ const [x,y,z]=previewPos(hit.point); previewMesh.position.set(x,y,z); state.canPlace=true; } else state.canPlace=false; }); }
function normPointer(){ const r = renderer.domElement.getBoundingClientRect(); return { x: ((state.pointer.x)/r.width)*2-1, y: -((state.pointer.y)/r.height)*2+1 }; }
function onPointerDown(e){
  state.pointer={x:e.offsetX,y:e.offsetY};
  const p = normPointer(); raycaster.setFromCamera(p,camera);
  const hitMeshes = raycaster.intersectObjects([...meshMap.values()], true).find((h)=>h.object.userData.id || h.object.parent?.userData.id);
  if(hitMeshes){ const id = hitMeshes.object.userData.id || hitMeshes.object.parent.userData.id; selectBlock(id); return; }
  if(!state.canPlace) return;
  pushUndo();
  const block = { id: crypto.randomUUID(), type: state.selectedType.type, category: state.selectedType.category, position:[previewMesh.position.x,previewMesh.position.y,previewMesh.position.z], rotationY:THREE.MathUtils.degToRad(state.previewRotation) };
  state.blocks.push(block); createBlockMesh(block); track('block_place', { block_type: block.type });
}

function selectBlock(id){ state.selectedId=id; [...meshMap.values()].forEach((m)=>m.material.emissive?.setHex?.(0x000000)); const mesh=meshMap.get(id); if(mesh){ mesh.material = mesh.material.clone(); mesh.material.emissive = new THREE.Color('#1e40af'); } refreshInspector(); }
function refreshInspector(){ const selected = state.blocks.find((b)=>b.id===state.selectedId); $('selectionLabel').textContent = selected ? `${selected.type} (${selected.category})` : 'No block selected.'; ['X','Y','Z','Rot'].forEach((k)=>$('prop'+k).disabled=!selected); if(selected){ $('propX').value=selected.position[0];$('propY').value=selected.position[1];$('propZ').value=selected.position[2];$('propRot').value=Math.round(THREE.MathUtils.radToDeg(selected.rotationY)); } }
function applyInspector(){ const s=state.blocks.find((b)=>b.id===state.selectedId); if(!s) return; pushUndo(); s.position=[Number($('propX').value),Number($('propY').value),Number($('propZ').value)]; s.rotationY=THREE.MathUtils.degToRad(Number($('propRot').value)||0); redrawBlocks(); }
function rotate(deg){ if(state.selectedId){ const s=state.blocks.find((b)=>b.id===state.selectedId); if(!s) return; pushUndo(); s.rotationY += THREE.MathUtils.degToRad(deg); redrawBlocks(); } else { state.previewRotation=(state.previewRotation+deg+360)%360; updatePreview(); } }
function deleteSelected(){ if(!state.selectedId) return; pushUndo(); state.blocks = state.blocks.filter((b)=>b.id!==state.selectedId); const m=meshMap.get(state.selectedId); if(m){ scene.remove(m); meshMap.delete(state.selectedId); } state.selectedId=null; refreshInspector(); }
function redrawBlocks(){ meshMap.forEach((m)=>scene.remove(m)); meshMap.clear(); state.blocks.forEach(createBlockMesh); refreshInspector(); }
function pushUndo(){ state.undo.push(JSON.stringify(state.blocks)); if(state.undo.length>100) state.undo.shift(); state.redo=[]; }
function undo(){ if(!state.undo.length) return; state.redo.push(JSON.stringify(state.blocks)); state.blocks = JSON.parse(state.undo.pop()); state.selectedId=null; redrawBlocks(); }
function redo(){ if(!state.redo.length) return; state.undo.push(JSON.stringify(state.blocks)); state.blocks = JSON.parse(state.redo.pop()); state.selectedId=null; redrawBlocks(); }
function resetBuild(){ if(!confirm('Reset all placed blocks?')) return; pushUndo(); state.blocks=[]; state.selectedId=null; redrawBlocks(); }
function saveLocal(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.blocks)); track('save_build',{count:state.blocks.length}); alert('Build saved locally on this device.'); } catch { alert('Saving failed. Your browser may block local storage in this mode.'); } }
function loadLocal(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return alert('No local build found yet.'); const parsed=validateImport(raw); pushUndo(); state.blocks=parsed; redrawBlocks(); } catch { alert('Load failed.'); } }
function exportJson(){ const blob = new Blob([JSON.stringify(state.blocks,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='teacharcade-block-builder.json'; a.click(); URL.revokeObjectURL(a.href); track('export_json',{count:state.blocks.length}); }
function importFile(e){ const f=e.target.files?.[0]; if(!f) return; f.text().then((t)=>$('importTextarea').value=t); }
function importJson(e){ e.preventDefault(); try{ const parsed=validateImport($('importTextarea').value); pushUndo(); state.blocks=parsed; redrawBlocks(); $('importDialog').close(); } catch(err){ alert(err.message); } }
function validateImport(input){ const parsed = JSON.parse(input); if(!Array.isArray(parsed)) throw new Error('Import must be an array of blocks.'); return parsed.map((b)=>{ if(!b.id||!b.type||!Array.isArray(b.position)) throw new Error('Invalid block schema.'); return { id:String(b.id), type:String(b.type), category:String(b.category||'Structural'), position:[Number(b.position[0]),Number(b.position[1]),Number(b.position[2])], rotationY:Number(b.rotationY||0)}; }); }
function downloadImage(){ const a=document.createElement('a'); a.href = renderer.domElement.toDataURL('image/png'); a.download='teacharcade-block-builder.png'; a.click(); track('screenshot_export'); }
function handleKeys(e){ const cmd = e.ctrlKey || e.metaKey; if(e.key.toLowerCase()==='r'){ e.preventDefault(); rotate(e.shiftKey?-90:90); } if((e.key==='Delete'||e.key==='Backspace') && state.selectedId){ e.preventDefault(); deleteSelected(); } if(cmd && e.key.toLowerCase()==='z' && !e.shiftKey){ e.preventDefault(); undo(); } if(cmd && ((e.key.toLowerCase()==='z'&&e.shiftKey)||e.key.toLowerCase()==='y')){ e.preventDefault(); redo(); } }
function onResize(){ const m=$('canvasMount'); if(!renderer||!m.clientWidth) return; renderer.setSize(m.clientWidth, m.clientHeight||500); camera.aspect = m.clientWidth/(m.clientHeight||500); camera.updateProjectionMatrix(); }
function animate(){ requestAnimationFrame(animate); controls?.update(); renderer?.render(scene,camera); }

initUi(); initThree(); updatePreview(); refreshInspector();
