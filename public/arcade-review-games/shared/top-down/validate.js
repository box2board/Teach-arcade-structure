// Checks map references before a student starts playing. Reachability is verified separately.
export function validateAdventure(map){
  const fail=message=>{throw Error('Invalid adventure: '+message);};
  const width=map.tiles?.[0]?.length,height=map.tiles?.length;
  if(!width||!height||!map.tiles.every(row=>row.length===width&&/^[#.~]+$/.test(row)))fail('tiles must form a rectangle using #, . and ~.');
  for(const field of ['objects','blocks','plates','doors','rooms'])if(!Array.isArray(map[field]))fail(field+' must be an array.');
  const entities=[...map.objects,...map.blocks,...map.plates,...map.doors],ids=new Set();
  for(const entity of entities){
    if(!entity.id||ids.has(entity.id))fail('entity IDs must be unique: '+entity.id);ids.add(entity.id);
    if(!Number.isInteger(entity.x)||!Number.isInteger(entity.y)||map.tiles[entity.y]?.[entity.x]!=='.')fail(entity.id+' must occupy a floor tile.');
  }
  if(map.tiles[map.start?.y]?.[map.start?.x]!=='.'||entities.some(e=>e.x===map.start.x&&e.y===map.start.y))fail('start must be an empty floor tile.');
  const inventory=map.inventory||[],hasReward=(type,value)=>inventory.some(i=>i.type===type&&i.value===value);
  const objects=new Map(map.objects.map(o=>[o.id,o])),plates=new Set(map.plates.map(p=>p.id)),puzzles=new Map((map.puzzles||[]).map(p=>[p.id,p]));
  const clues=new Set((map.clues||[]).map(c=>c.id));
  for(const door of map.doors){
    for(const id of door.plates||(door.plate?[door.plate]:[]))if(!plates.has(id))fail(door.id+' references unknown plate '+id);
    if(door.key&&!hasReward('key',door.key))fail(door.id+' references an unknown key.');
    if(door.tool&&!hasReward('tool',door.tool))fail(door.id+' references an unknown tool.');
  }
  for(const o of map.objects){
    if(o.type==='challenge'){
      if(!Number.isInteger(o.questionCount??1)||(o.questionCount??1)<1)fail(o.id+' needs a positive question count.');
      const r=o.reward||{type:'key',value:o.key};if(!hasReward(r.type,r.value))fail(o.id+' references an unknown reward.');
    }
    if(o.clue&&!clues.has(o.clue))fail(o.id+' references an unknown clue.');
    if(o.requiresTool&&!hasReward('tool',o.requiresTool))fail(o.id+' references an unknown tool.');
    if(o.type==='bridgeSwitch'&&(objects.get(o.bridge)?.type!=='bridge'||o.receiver&&objects.get(o.receiver)?.type!=='receiver'||!o.receiver&&!o.requiresTool))fail(o.id+' needs a receiver and bridge, or a tool and bridge.');
    for(const id of o.requiredItems||[])if(!hasReward('item',id))fail(o.id+' references an unknown required item.');
    if(o.sequencePuzzle&&!puzzles.has(o.sequencePuzzle))fail(o.id+' references an unknown sequence puzzle.');
    for(const id of o.requires||[])if(!objects.has(id))fail(o.id+' references an unknown switch.');
  }
  for(const p of puzzles.values()){
    if(!p.sequence?.length||!p.sequence.every(id=>objects.get(id)?.type==='lever'))fail(p.id+' needs a valid lever sequence.');
    for(const id of p.requiredClues||(p.requiredClue?[p.requiredClue]:[]))if(!clues.has(id))fail(p.id+' references an unknown clue.');
  }
  if(map.objects.filter(o=>o.type==='exit').length!==1)fail('exactly one exit is required.');
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(map.tiles[y][x]==='.'){
    if(map.rooms.filter(r=>x>=r.min&&x<=r.max&&y>=(r.minY??0)&&y<=(r.maxY??height-1)).length!==1)fail('every floor tile needs exactly one room: '+x+','+y);
  }
  for(const r of map.rooms){
    const x0=r.viewMin??0,x1=r.viewMax??width-1,y0=r.viewMinY??0,y1=r.viewMaxY??height-1;
    if(x0<0||y0<0||x1>=width||y1>=height||x1<x0||y1<y0)fail(r.name+' has invalid camera bounds.');
  }
  const conditionFields=['tools','items','keys','usedKeys','opened','activated','discovered','solved','collected'];
  const references={tools:inventory.filter(i=>i.type==='tool').map(i=>i.value),items:inventory.filter(i=>i.type==='item').map(i=>i.value),keys:inventory.filter(i=>i.type==='key').map(i=>i.value),usedKeys:inventory.filter(i=>i.type==='key').map(i=>i.value),opened:[...map.doors.map(d=>d.id),...map.objects.filter(o=>o.type==='bridge').map(o=>o.id)],activated:map.objects.filter(o=>['lever','bridgeSwitch'].includes(o.type)).map(o=>o.id),discovered:[...clues],solved:map.objects.filter(o=>o.type==='challenge').map(o=>o.id),collected:map.objects.filter(o=>['key','tool','item'].includes(o.type)).map(o=>o.id)};
  function validateCondition(when={}){
    for(const [field,value] of Object.entries(when)){
      if(conditionFields.includes(field)){if(!Array.isArray(value)||!value.every(id=>references[field].includes(id)))fail('unknown condition reference in '+field);}
      else if(field==='doorOpen'){if(!map.doors.some(d=>d.id===value))fail('unknown door condition.');}
      else if(field==='exitReady'){if(objects.get(value)?.type!=='exit')fail('unknown exit condition.');}
      else if(field==='all'||field==='any'){if(!Array.isArray(value))fail('condition groups must be arrays.');value.forEach(validateCondition);}
      else if(field==='not')validateCondition(value);
      else fail('unknown condition field '+field);
    }
  }
  for(const milestone of map.milestones||[])validateCondition(milestone.when);
  for(const room of map.rooms)for(const rule of room.objectiveRules||[])validateCondition(rule.when);
  return map;
}
