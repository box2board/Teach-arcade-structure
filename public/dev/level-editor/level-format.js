/* Versioned, lossless envelope for the V1.3 runtime's expanded level data. */
(()=>{
 const arrays=['platforms','questionPoints','collectibles','breakables','bounceSurfaces','climbables','abilityItems','abilityHazards','mounts','secrets','movers','movingPlatforms','gates','surfaceZones','slopes','zones'];
 const clone=o=>JSON.parse(JSON.stringify(o));
 function validate(doc){
  const errors=[],warn=[];
  if(!doc||doc.format!=='teach-arcade-level'||doc.version!==1||doc.engine!=='side-scroller-v1.3')return {errors:['Unsupported level format, version, or engine.'],warnings:[]};
  const l=doc.level;
  if(!l||typeof l!=='object')return {errors:['Missing level data.'],warnings:[]};
  const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  const width=l.world?.width,height=l.world?.height,t=l.tileSize;
  if(!finite(width,960,32000)||height!==480||!finite(t,8,64))errors.push('World must be 960–32000 pixels wide, 480 pixels high, with an 8–64 pixel tile size.');
  for(const key of ['spawn','finish']){const o=l[key];if(!o||!finite(o.x,0,width)||!finite(o.y,0,height))errors.push(key+' must be inside the world.');}
  if(!finite(l.finish?.w,1,1000)||!finite(l.finish?.h,1,height))errors.push('Finish needs positive width and height.');
  if(!l.layers||!Array.isArray(l.layers.terrain))errors.push('Terrain grid is required.');
  for(const [key,g] of Object.entries(l.layers||{})){
   if(!['terrain','hazards','checkpoints','questions'].includes(key)){errors.push('Unknown tile layer: '+key);continue;}
   if(!Array.isArray(g)||g.length!==Math.ceil(height/t)||g.some(row=>!Array.isArray(row)||row.length!==Math.ceil(width/t)||row.some(v=>!Number.isInteger(v)||v<0||v>1000)))errors.push('Invalid '+key+' grid.');
  }
  for(const key of arrays){const items=l[key];if(items===undefined)continue;if(!Array.isArray(items)||items.length>2000){errors.push('Invalid '+key+' list.');continue;}
   for(const [i,o] of items.entries()){
    if(!o||typeof o!=='object'){errors.push(key+' '+i+' is invalid.');continue;}
    if(key==='zones'){if(!finite(o.from,0,width)||!finite(o.to,o.from,width))errors.push('Invalid zone bounds.');continue;}
    if(key==='slopes'){if(!finite(o.x1,0,width)||!finite(o.x2,0,width)||o.x2<=o.x1||!finite(o.y1,0,height)||!finite(o.y2,0,height))errors.push('Invalid slope.');continue;}
    if(!finite(o.x,0,width)||(key!=='surfaceZones'&&!finite(o.y,0,height)))errors.push(key+' '+(o.id||i)+' is outside the world.');
    for(const k of ['w','h'])if(o[k]!==undefined&&!finite(o[k],1,32000))errors.push('Invalid '+key+' '+k+'.');
    if(o.w&&o.x+o.w>width)errors.push(key+' extends beyond world width.');
    if(key==='questionPoints'&&!Number.isInteger(o.questionIndex))errors.push('Question tile needs an integer questionIndex.');
    if(key==='questionPoints'&&o.questionIndex<0)errors.push('Question index cannot be negative.');
    if(['movers','movingPlatforms'].includes(key)&&o.axis!==undefined&&!['x','y'].includes(o.axis))errors.push('Movement axis must be x or y.');
    for(const k of ['speed','range','bounce','score','breakSpeed','hits'])if(o[k]!==undefined&&!finite(o[k],0,100000))errors.push('Invalid '+key+' '+k+'.');
   }
  }
  if(l.physicsPreset!=='earth')errors.push('This editor currently supports the earth physics preset.');
  if(!(l.questionPoints||[]).length)warn.push('No question points: this level can finish without a review question.');
  warn.push('Playtest every required jump and route. Validation does not prove the level is winnable.');
  return {errors:[...new Set(errors)],warnings:warn};
 }
 function pack(level){return {format:'teach-arcade-level',version:1,engine:'side-scroller-v1.3',theme:'pyramid-v13',level:clone(level)};}
 function parse(text){if(text.length>2000000)throw Error('Level file exceeds 2 MB.');const d=JSON.parse(text);const r=validate(d);if(r.errors.length)throw Error(r.errors.join('\n'));return d;}
 window.TALevelFile={pack,parse,validate,clone,arrays};
})();
