/* Editing commands shared by the UI and regression checks. No gameplay physics. */
(()=>{
 const F=window.TALevelFile;
 const defaults={gates:{w:36,h:96,style:'door'},decorations:{w:96,h:120,style:'tree',layer:'background'},platforms:{w:128,h:18},collectibles:{w:22,h:22,score:100,reward:'score',hits:1},questionPoints:{w:38,h:60,questionIndex:0,reward:'boost'},breakables:{w:32,h:32,breakMode:'impact',requireAbility:'ram',breakSpeed:999,score:150},bounceSurfaces:{w:48,h:14,bounce:850},climbables:{w:32,h:128,requiresAbility:'climb'},abilityHazards:{w:32,h:32},abilityItems:{w:28,h:34,type:'power',powerId:'field-journal',hits:1},movingPlatforms:{w:96,h:18,axis:'x',range:100,speed:55},movers:{w:28,h:22,movement:'groundPatrol',interaction:'stompable',axis:'x',range:100,speed:65},secrets:{w:160,h:80,score:250}};
 let sequence=0;
 function bounds(key,o){if(key==='slopes')return{x:o.x1,y:Math.min(o.y1,o.y2),w:o.x2-o.x1,h:Math.max(12,Math.abs(o.y2-o.y1))};return{x:o.x,y:o.y??320,w:o.w||defaults[key]?.w||26,h:o.h||defaults[key]?.h||38};}
 function blank(width=3840){const t=32,rows=15,cols=Math.ceil(width/t),grid=()=>Array.from({length:rows},()=>Array(cols).fill(0)),terrain=grid();for(let r=11;r<rows;r++)terrain[r].fill(1);return F.pack({id:'my-level',physicsPreset:'earth',tileSize:t,world:{width,height:480},spawn:{x:64,y:300},finish:{x:width-128,y:246,w:58,h:106},layers:{terrain,hazards:grid(),checkpoints:grid()},abilities:{dash:{doubleTapMs:280,durationMs:190,speedMultiplier:1.85},stomp:{enabled:true},power:{maxHits:1}},zones:[{id:'entry',from:0,to:width,label:'My Level'}],questionPoints:[]});}
 function assert(doc){const r=F.validate(doc);if(r.errors.length)throw Error(r.errors.join('\n'));return doc;}
 function create(doc,key,x,y){const l=doc.level;if(key==='spawn'||key==='finish'){const b=bounds(key,l[key]);Object.assign(l[key],{x:Math.max(0,Math.min(x,l.world.width-b.w)),y:Math.max(0,Math.min(y,480-b.h))});return l[key];}
  const o={id:'editor-'+Date.now()+'-'+(++sequence),...defaults[key],x,y};
  if(key==='slopes'){delete o.x;delete o.y;Object.assign(o,{x1:Math.max(0,Math.min(x,l.world.width-128)),y1:Math.max(64,Math.min(y,480)),x2:Math.max(0,Math.min(x,l.world.width-128))+128,y2:Math.max(64,Math.min(y,480))-64});}
  else{const b=bounds(key,o);o.x=Math.max(0,Math.min(x,l.world.width-b.w));o.y=Math.max(0,Math.min(y,480-b.h));}
  o.style=window.TAObjectLibrary?.defaultStyle(key)||o.style;
  if(key==='gates')o.questionId=l.questionPoints?.[0]?.id||'';
  if(key==='questionPoints'){o.visualY=o.y;o.questionIndex=(l.questionPoints||[]).length;}
  l[key]||=[];l[key].push(o);return o;
 }
 function resize(doc,width){if(!Number.isInteger(width)||width<960||width>32000)throw Error('Length must be a whole number from 960 to 32000 pixels.');const next=F.clone(doc),l=next.level,old=l.world.width,cols=Math.ceil(width/l.tileSize);
  if(width<old){for(const key of F.arrays){if(key==='zones')continue;for(const o of l[key]||[]){const b=bounds(key,o);if(o.path?.some(p=>p.x+b.w>width))throw Error('A movement path extends beyond the new end. Edit it first.');if(b.x+b.w>width)throw Error('Move or delete objects beyond '+width+'px before shortening the level.');}}
   if(l.spawn.x+26>width)throw Error('Move the start before shortening the level.');
   for(const [key,g] of Object.entries(l.layers))if(key!=='terrain'&&g.some(row=>row.slice(cols).some(Boolean)))throw Error('Remove '+key+' tiles beyond the new end first.');
  }
  for(const [key,g] of Object.entries(l.layers))for(const row of g){const fill=key==='terrain'?(row.at(-1)||0):0;row.length=Math.min(row.length,cols);while(row.length<cols)row.push(fill);}
  l.world.width=width;l.finish.x=Math.min(l.finish.x,width-l.finish.w-32);if(width>old&&l.finish.x>=old-160)l.finish.x=width-l.finish.w-32;
  l.zones=(l.zones||[]).filter(z=>z.from<width).map(z=>({...z,to:z.to===old?width:Math.min(z.to,width)}));
  return assert(next);
 }
 window.TALevelEditorModel={defaults,bounds,blank,create,resize,assert};
})();
