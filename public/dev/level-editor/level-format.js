/* Versioned, lossless envelope for the V1.3 runtime's expanded level data. */
(()=>{
 const arrays=['decorations','platforms','questionPoints','collectibles','breakables','bounceSurfaces','climbables','abilityItems','abilityHazards','mounts','secrets','movers','movingPlatforms','gates','surfaceZones','slopes','zones'];
 const clone=o=>JSON.parse(JSON.stringify(o));
 function validate(doc){
  const errors=[],warn=[];
  if(!doc||doc.format!=='teach-arcade-level'||doc.version!==1||!['side-scroller-v1.3','side-scroller-v1.4'].includes(doc.engine))return {errors:['Unsupported level format, version, or engine.'],warnings:[]};
  const l=doc.level;
  if(!l||typeof l!=='object'||Array.isArray(l))return {errors:['Missing level data.'],warnings:[]};
  const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  const width=l.world?.width,height=l.world?.height,t=l.tileSize;
  if(!finite(width,960,32000)||height!==480||!finite(t,8,64))errors.push('World must be 960–32000 pixels wide, 480 pixels high, with an 8–64 pixel tile size.');
  for(const key of ['spawn','finish']){const o=l[key];if(!o||!finite(o.x,0,width)||!finite(o.y,0,height))errors.push(key+' must be inside the world.');}
  if(l.spawn&&((l.spawn.x+26)>width||(l.spawn.y+38)>height))errors.push('Start must fit inside the world.');
  if(l.finish&&((l.finish.x+l.finish.w)>width||(l.finish.y+l.finish.h)>height))errors.push('Finish must fit inside the world.');
  if(!finite(l.finish?.w,1,1000)||!finite(l.finish?.h,1,height))errors.push('Finish needs positive width and height.');
  if(!l.layers||!Array.isArray(l.layers.terrain))errors.push('Terrain grid is required.');
  for(const [key,g] of Object.entries(l.layers||{})){
   if(!['terrain','hazards','checkpoints','questions'].includes(key)){errors.push('Unknown tile layer: '+key);continue;}
   if(!Array.isArray(g)||g.length!==Math.ceil(height/t)||g.some(row=>!Array.isArray(row)||row.length!==Math.ceil(width/t)||row.some(v=>!Number.isInteger(v)||v<0||v>1000)))errors.push('Invalid '+key+' grid.');
  }
  for(const key of arrays){const items=l[key];if(items===undefined)continue;if(!Array.isArray(items)||items.length>2000){errors.push('Invalid '+key+' list.');continue;}
   for(const [i,o] of items.entries()){
    if(!o||typeof o!=='object'||Array.isArray(o)){errors.push(key+' '+i+' is invalid.');continue;}
    if(key==='zones'){if(!finite(o.from,0,width)||!finite(o.to,o.from,width))errors.push('Invalid zone bounds.');continue;}
    if(key==='slopes'){if(!finite(o.x1,0,width)||!finite(o.x2,0,width)||o.x2<=o.x1||!finite(o.y1,0,height)||!finite(o.y2,0,height))errors.push('Invalid slope.');continue;}
    if(!finite(o.x,0,width)||(key!=='surfaceZones'&&!finite(o.y,0,height)))errors.push(key+' '+(o.id||i)+' is outside the world.');
    for(const k of ['w','h'])if(o[k]!==undefined&&!finite(o[k],1,32000))errors.push('Invalid '+key+' '+k+'.');
    if((o.w||26)+o.x>width)errors.push(key+' extends beyond world width.');
    if(key!=='surfaceZones'&&(o.h||38)+o.y>height)errors.push(key+' extends below the world.');
    if(key==='gates'&&!(l.questionPoints||[]).some(q=>q.id===o.questionId))errors.push('Question gate must link to an existing question point.');
    if(key==='abilityItems'&&!['power','gear'].includes(o.type))errors.push('Pickup type must be power or gear.');
    if(o.abilities!==undefined&&(!Array.isArray(o.abilities)||o.abilities.some(a=>typeof a!=='string')))errors.push('Abilities must be a list of names.');
    if(o.path!==undefined){
     if(!['movingPlatforms','movers'].includes(key)||!Array.isArray(o.path)||o.path.length<2||o.path.length>64)errors.push('Movement path needs 2–64 points.');
     else{for(const [j,p] of o.path.entries()){if(!p||!finite(p.x,0,width-(o.w||32))||!finite(p.y,0,height-(o.h||22)))errors.push('Path point is outside the world.');if(j&&p?.x===o.path[j-1]?.x&&p?.y===o.path[j-1]?.y)errors.push('Consecutive path points must differ.');if(p?.pause!==undefined&&!finite(p.pause,0,30))errors.push('Path pause must be 0–30 seconds.');}if(o.path[0]?.x!==o.x||o.path[0]?.y!==o.y)errors.push('Path must start at the object position.');}
     if(!['loop','pingpong'].includes(o.pathMode))errors.push('Choose loop or pingpong path mode.');
     if(!finite(o.speed,1,1000))errors.push('Path speed must be 1–1000 pixels per second.');
    }
    if(o.pathPause!==undefined&&!finite(o.pathPause,0,30))errors.push('Path pause must be 0–30 seconds.');
    if(o.style!==undefined&&typeof o.style!=='string')errors.push('Style must be a name.');
    if(key==='decorations'&&!['background','foreground'].includes(o.layer))errors.push('Choose a scenery layer.');
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
 function pack(level){return {format:'teach-arcade-level',version:1,engine:'side-scroller-v1.4',theme:'pyramid-v13',level:clone(level)};}
 function parse(text){if(text.length>2000000)throw Error('Level file exceeds 2 MB.');const d=JSON.parse(text);const r=validate(d);if(r.errors.length)throw Error(r.errors.join('\n'));return d;}
 window.TALevelFile={pack,parse,validate,clone,arrays};
})();
