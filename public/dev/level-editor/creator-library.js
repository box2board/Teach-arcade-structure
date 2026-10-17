/* Reusable sections and named browser projects. No publishing or account backend. */
(()=>{
 const F=window.TALevelFile,M=window.TALevelEditorModel,clone=F.clone;let serial=0;
 const uid=()=> 'creator-'+Date.now()+'-'+(++serial)+'-'+Math.random().toString(36).slice(2,8);
 const allowed=M?F.arrays.filter(k=>!['zones','surfaceZones'].includes(k)):[];
 function checkSection(s){
  if(!s||s.format!=='teach-arcade-section'||s.version!==1)throw Error('Unsupported section format.');
  for(const [key,min,max] of [['width',1,32000],['height',1,7680],['tileSize',8,64]])if(!Number.isInteger(s[key])||s[key]<min||s[key]>max)throw Error('Invalid section '+key+'.');
  if(!Array.isArray(s.objects)||!s.objects.length||s.objects.length>2000)throw Error('A section needs 1–2000 objects.');
  const w=Math.max(960,s.width),h=Math.max(480,s.height),t=s.tileSize,rows=Math.ceil(h/t),cols=Math.ceil(w/t);if(rows*cols>750000)throw Error('Section is too large.');
  const d=M.blank(w);d.level.world.height=h;d.level.tileSize=t;d.level.layers={terrain:Array.from({length:rows},()=>Array(cols).fill(0))};
  const ids=new Set();for(const e of s.objects){if(!e||!allowed.includes(e.key)||!e.data||typeof e.data!=='object'||Array.isArray(e.data))throw Error('Unsupported section object.');if(!e.data.id||typeof e.data.id!=='string'||ids.has(e.data.id))throw Error('Section object IDs must be unique.');ids.add(e.data.id);const b=M.extent(e.key,e.data);if(b.x<0||b.y<0||b.x+b.w>s.width+.001||b.y+b.h>s.height+.001)throw Error('Object or path extends outside the section.');(d.level[e.key]||=[]).push(clone(e.data));}
  for(const e of s.objects){if(e.data.questionId&&!ids.has(e.data.questionId))throw Error('Include the linked question when saving this section.');if(e.data.secretId&&!ids.has(e.data.secretId))throw Error('Include the linked secret when saving this section.');}
  M.assert(d);if((d.level.questionPoints||[]).length>20)throw Error('Sections support at most 20 question points.');
  let cells=0;for(const [key,list] of Object.entries(s.tiles||{})){if(!['terrain','hazards','checkpoints'].includes(key)||!Array.isArray(list))throw Error('Invalid section tile layer.');cells+=list.length;if(cells>100000)throw Error('Section contains too many tiles.');for(const tile of list)if(!tile||!Number.isInteger(tile.col)||!Number.isInteger(tile.row)||tile.col<0||tile.row<0||tile.col>=Math.ceil(s.width/t)||tile.row>=Math.ceil(s.height/t)||!Number.isInteger(tile.code)||tile.code<0||tile.code>1000)throw Error('Invalid section tile.');}
  return s;
 }
 function capture(doc,refs,includeTiles=false){
  if(!refs.length)throw Error('Select objects to save as a reusable section.');if(refs.some(r=>!allowed.includes(r.key)))throw Error('Start, finish and surface zones cannot be saved as a section.');
  const entries=refs.map(r=>({key:r.key,data:{...clone(M.get(doc.level,r)),id:M.get(doc.level,r).id||uid()}})),bs=entries.map(e=>M.extent(e.key,e.data)),t=doc.level.tileSize;
  let x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y)),right=Math.max(...bs.map(b=>b.x+b.w)),bottom=Math.max(...bs.map(b=>b.y+b.h));
  if(includeTiles){x=Math.floor(x/t)*t;y=Math.floor(y/t)*t;right=Math.min(doc.level.world.width,Math.ceil(right/t)*t);bottom=Math.min(doc.level.world.height,Math.ceil(bottom/t)*t);}
  const s={format:'teach-arcade-section',version:1,tileSize:t,width:Math.ceil(right-x),height:Math.ceil(bottom-y),objects:entries.map(e=>({key:e.key,data:M.translateObject(e.key,e.data,-x,-y)})),tiles:{}};
  if(includeTiles){let count=0;for(const [key,g] of Object.entries(doc.level.layers)){for(let row=Math.floor(y/t);row<Math.ceil(bottom/t);row++)for(let col=Math.floor(x/t);col<Math.ceil(right/t);col++){const code=g[row]?.[col]||0;if(key==='questions'){if(code)throw Error('Legacy question tiles cannot be copied; use question objects instead.');continue;}if(!['terrain','hazards','checkpoints'].includes(key))continue;if(++count>100000)throw Error('Select a smaller area to include painted terrain.');(s.tiles[key]||=[]).push({row:row-y/t,col:col-x/t,code});}}}
  return checkSection(s);
 }
 function insert(doc,section,x,y){const s=checkSection(section),next=clone(doc),l=next.level,hasTiles=Object.values(s.tiles||{}).some(a=>a.length);if(hasTiles&&s.tileSize!==l.tileSize)throw Error('Painted sections need a matching tile size.');if(hasTiles){x=Math.round(x/l.tileSize)*l.tileSize;y=Math.round(y/l.tileSize)*l.tileSize;}if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x+s.width>l.world.width||y+s.height>l.world.height)throw Error('The whole section must fit inside the level.');
  const ids=new Map(s.objects.map(e=>[e.data.id,uid()])),used=new Set((l.questionPoints||[]).map(q=>q.questionIndex));for(const row of l.layers.questions||[])for(const code of row)if(code)used.add(code-1);
  const count=s.objects.filter(e=>e.key==='questionPoints').length;if((l.questionPoints||[]).length+(l.layers.questions||[]).flat().filter(Boolean).length+count>20)throw Error('The selected question set supports at most 20 question points.');
  const selection=[];for(const e of s.objects){const o=M.translateObject(e.key,e.data,x,y);o.id=ids.get(e.data.id);if(o.questionId)o.questionId=ids.get(o.questionId);if(o.secretId)o.secretId=ids.get(o.secretId);if(e.key==='questionPoints'){let n=0;while(used.has(n))n++;if(n>=20)throw Error('Not enough unused questions.');o.questionIndex=n;used.add(n);}(l[e.key]||=[]).push(o);selection.push({key:e.key,i:l[e.key].length-1});}
  for(const [key,tiles] of Object.entries(s.tiles||{})){l.layers[key]||=l.layers.terrain.map(row=>row.map(()=>0));for(const tile of tiles)l.layers[key][y/l.tileSize+tile.row][x/l.tileSize+tile.col]=tile.code;}
  next.engine='side-scroller-v1.4';M.assert(next);return{doc:next,selection};
 }
 function validName(name){if(typeof name!=='string'||!name.trim()||name.trim().length>80)throw Error('Use a name from 1 to 80 characters.');return name.trim();}
 function checkLibrary(data){if(!data||data.format!=='teach-arcade-creator-library'||data.version!==1||!Array.isArray(data.projects)||!Array.isArray(data.sections)||data.projects.length>100||data.sections.length>200)throw Error('Unsupported creator backup.');const ids=new Set();for(const [key,records] of [['projects',data.projects],['sections',data.sections]])for(const r of records){if(!r||typeof r.id!=='string'||ids.has(r.id))throw Error('Invalid or duplicate saved item ID.');ids.add(r.id);validName(r.name);if(key==='projects')F.parseDraft(JSON.stringify(r.document));else checkSection(r.content);}return data;}
 class Store{
  constructor(storage){this.storage=storage;this.previous=null;const raw=storage.getItem('ta-creator-library-v1');this.data=raw?checkLibrary(JSON.parse(raw)):{format:'teach-arcade-creator-library',version:1,projects:[],sections:[]};}
  all(){return clone(this.data);}
  commit(next){checkLibrary(next);this.storage.setItem('ta-creator-library-v1',JSON.stringify(next));this.previous=this.data;this.data=next;}
  saveProject(name,doc,id=null){name=validName(name);F.parseDraft(JSON.stringify(doc));const next=this.all(),old=id?next.projects.find(r=>r.id===id):null;if(id&&!old)throw Error('Saved project was not found.');const record={id:id||uid(),name,updatedAt:new Date().toISOString(),document:clone(doc)};if(old)next.projects[next.projects.indexOf(old)]=record;else next.projects.push(record);this.commit(next);return record.id;}
  saveSection(name,section){name=validName(name);checkSection(section);const next=this.all(),id=uid();next.sections.push({id,name,updatedAt:new Date().toISOString(),content:clone(section)});this.commit(next);return id;}
  renameProject(id,name){const next=this.all(),r=next.projects.find(r=>r.id===id);if(!r)throw Error('Choose a saved project.');r.name=validName(name);this.commit(next);}
  remove(kind,id){if(!['projects','sections'].includes(kind))throw Error('Unknown saved item type.');const next=this.all();if(!next[kind].some(r=>r.id===id))throw Error('Choose a saved item.');next[kind]=next[kind].filter(r=>r.id!==id);this.commit(next);}
  undo(){if(!this.previous)throw Error('No saved-library change to undo.');const restore=clone(this.previous);this.storage.setItem('ta-creator-library-v1',JSON.stringify(restore));this.data=restore;this.previous=null;}
  importBackup(text){if(text.length>10000000)throw Error('Backup exceeds 10 MB.');const source=checkLibrary(JSON.parse(text)),next=this.all();let added=0;const ids=new Set([...next.projects,...next.sections].map(r=>r.id));for(const key of ['projects','sections'])for(const r of source[key])if(!ids.has(r.id)){next[key].push(clone(r));ids.add(r.id);added++;}this.commit(next);return added;}
 }
 window.TACreatorLibrary={capture,insert,checkSection,checkLibrary,Store};
})();
