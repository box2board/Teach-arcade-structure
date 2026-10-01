export const directions = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
const at = (a, b) => a.x === b.x && a.y === b.y;
const isPickup = object => ['tool','item','key'].includes(object.type);
function collectAtPlayer(map,state) {
  for (const object of map.objects) {
    if (!isPickup(object) || !at(object,state.player) || state.collected.includes(object.id)) continue;
    state.collected.push(object.id);
    const inventory=object.type==='tool'?state.tools:object.type==='key'?state.keys:state.items;
    const value=object.type==='tool'?object.tool:object.type==='key'?object.key:object.item;
    if (!inventory.includes(value)) inventory.push(value);
  }
}
export function createState(map) {
  return { player: { ...map.start }, facing: 'up', blocks: structuredClone(map.blocks), opened: [], activated: [], sequences: {}, discovered: [], tools: [], items: [], collected: [], keys: [], usedKeys: [], moveFeedback: null, solved: [], attempts: {}, score: 0, won: false, moves: 0, history: [] };
}
export function doorOpen(map, state, door) {
  if (state.opened.includes(door.id)) return true;
  const ids=door.plates||(door.plate?[door.plate]:[]);
  return ids.length>0&&ids.every(id=>{
    const plate=map.plates.find(p=>p.id===id);
    return Boolean(plate&&state.blocks.some(b=>at(b,plate)));
  });
}
export function cluesReady(puzzle,state){
  return !puzzle||(puzzle.requiredClues||(puzzle.requiredClue?[puzzle.requiredClue]:[])).every(id=>state.discovered.includes(id));
}
export function obstacle(map, state, pos, ignoreDoor = null) {
  if (!map.tiles[pos.y] || map.tiles[pos.y][pos.x] !== '.') return true;
  if (map.doors.some(d => at(d, pos) && d.id !== ignoreDoor && !doorOpen(map,state,d))) return true;
  return map.objects.some(o => at(o,pos) && o.type !== 'exit' && !isPickup(o) && !state.collected.includes(o.id));
}
function openWithInventory(state,door) {
  state.opened.push(door.id);
  if (door.key) {
    state.keys=state.keys.filter(k=>k!==door.key);
    if(!state.usedKeys.includes(door.key))state.usedKeys.push(door.key);
    return {text:`${door.keyLabel||'Archive key'} used — the door is open.`,tone:'correct'};
  }
  return {text:'Your hammer breaks the cracked wall! The vault is open.',tone:'correct'};
}
export function adventureResults(map,state) {
  const treasures=map.objects.filter(o=>isPickup(o)&&o.optional);
  const found=treasures.filter(o=>state.collected.includes(o.id));
  const bonusPoints=found.reduce((total,o)=>total+(Number.isFinite(o.bonusPoints)&&o.bonusPoints>0?o.bonusPoints:0),0);
  return { treasureFound:found.length, treasureTotal:treasures.length, reviewPoints:state.score, bonusPoints, totalPoints:state.score+bonusPoints };
}
export function inventoryEntries(map,state) {
  return (map.inventory||[]).flatMap(item=>{
    const available=(item.type==='key'?state.keys:item.type==='tool'?state.tools:state.items).includes(item.value);
    const used=item.type==='key'&&state.usedKeys.includes(item.value);
    return available||used?[{...item,status:available?'Ready':'Used'}]:[];
  });
}
export function move(map, state, direction) {
  state.moveFeedback=null;
  if (state.won || !directions[direction]) return false;
  state.facing = direction;
  const [dx,dy] = directions[direction];
  const next = { x:state.player.x+dx, y:state.player.y+dy };
  const lockedDoor=map.doors.find(d=>at(d,next)&&!doorOpen(map,state,d));
  const canUnlock=lockedDoor&&((lockedDoor.key&&state.keys.includes(lockedDoor.key))||(lockedDoor.tool&&state.tools.includes(lockedDoor.tool)));
  if (obstacle(map,state,next,canUnlock?lockedDoor.id:null)) {
    if(lockedDoor)state.moveFeedback={text:lockedDoor.lockedText||(lockedDoor.key?'Archive key required. Open the chest in the Archive.':lockedDoor.tool?(map.mode!=='easy'?'Hammer required. Earn it in the Workshop south of the Archive.':'Hammer required. Find it in the Archive.'):'Hold the amber floor switch down with the block.'),tone:'neutral'};
    return false;
  }
  const block = state.blocks.find(b => at(b,next));
  const beyond = { x:next.x+dx, y:next.y+dy };
  if (block && (obstacle(map,state,beyond) || state.blocks.some(b => at(b,beyond)) || map.objects.some(o => isPickup(o) && at(o,beyond) && !state.collected.includes(o.id)))) return false;
  // Only physical moves are undone; awarded keys and learning progress remain intact.
  state.history.push({ player:{...state.player}, blocks:structuredClone(state.blocks) });
  if (state.history.length > 200) state.history.shift();
  if (canUnlock)state.moveFeedback=openWithInventory(state,lockedDoor);
  if (block) Object.assign(block,beyond);
  state.player = next;
  collectAtPlayer(map,state);
  state.moves++;
  return true;
}
export function undo(state) {
  if (state.won) return;
  const previous=state.history.pop();
  if (previous) { state.player=previous.player; state.blocks=previous.blocks; }
}
export function exitReady(map,state,exit) {
  const puzzle=(map.puzzles||[]).find(p=>p.id===exit.sequencePuzzle);
  return (exit.requiredItems||[]).every(id=>state.items.includes(id)) && (exit.requires||[]).every(id=>state.activated.includes(id)) &&
    (!puzzle || (cluesReady(puzzle,state) && state.sequences[puzzle.id]===puzzle.sequence.length));
}
export function interact(map,state) {
  if (state.won) return { type:'none' };
  const [dx,dy]=directions[state.facing];
  const front={x:state.player.x+dx,y:state.player.y+dy};
  const object=map.objects.find(o=>at(o,state.player)&&o.type==='exit') || map.objects.find(o=>at(o,front)&&!state.collected.includes(o.id));
  const door=map.doors.find(d=>at(d,front));
  if (door) {
    if (doorOpen(map,state,door)) return {type:'message',text:'The gate is open.'};
    if (door.tool) {
      if (!state.tools.includes(door.tool)) return {type:'message',text:map.mode!=='easy'?'This cracked wall needs a hammer. Earn it in the Workshop south of the Archive.':'This cracked wall needs a hammer. Search the Archive, then return here.'};
      return {type:'message',...openWithInventory(state,door)};
    }
    if (door.key && state.keys.includes(door.key)) {
      return {type:'message',...openWithInventory(state,door)};
    }
    return {type:'message',text:door.lockedText||(door.plate?'Hold the amber floor switch down with the block.':'Find the archive key first.')};
  }
  if (!object) return {type:'message',text:'Face a sign, chest, switch, or gate and interact.'};
  if (isPickup(object)) return {type:'message',text:`Walk over ${object.label||'the item'} to collect it.`};
  if (object.type==='sign') {
    if(object.requiresTool&&!state.tools.includes(object.requiresTool))return {type:'message',text:object.lockedText||'A tool is needed to read this inscription.'};
    if(object.clue&&!state.discovered.includes(object.clue))state.discovered.push(object.clue);
    return {type:'message',text:object.text};
  }
  if (object.type==='challenge') return state.solved.includes(object.id)?{type:'message',text:'This chest is complete. Its reward has already been earned.'}:{type:'challenge',id:object.id};
  if (object.type==='lever') {
    const puzzle=(map.puzzles||[]).find(p=>p.sequence.includes(object.id));
    if (puzzle) {
      if(!cluesReady(puzzle,state))return {type:'message',text:puzzle.clueHint||'The switches need their code. Use your lantern to read the faded inscription in the Hidden Library.'};
      const progress=state.sequences[puzzle.id]||0;
      if(progress===puzzle.sequence.length) return {type:'message',text:'The signal puzzle is already solved. Head to the exit.'};
      if(object.id!==puzzle.sequence[progress]) {
        state.sequences[puzzle.id]=0;
        state.activated=state.activated.filter(id=>!puzzle.sequence.includes(id));
        return {type:'message',tone:'wrong',text:puzzle.requiredClue||puzzle.requiredClues?'Wrong switch — all door lights reset. Follow the code in your journal or read the inscriptions again.':'Wrong switch — all three door lights reset. Start again with TOP → BOTTOM → TOP.'};
      }
      state.sequences[puzzle.id]=progress+1;
      if(!state.activated.includes(object.id))state.activated.push(object.id);
      return {type:'message',tone:'correct',text:progress+1===puzzle.sequence.length?(exitReady(map,state,map.objects.find(o=>o.type==='exit'&&o.sequencePuzzle===puzzle.id))?'All door lights are on! The exit is unlocked. Walk to it and interact.':'All door lights are on! Earn the missing supplies before using the exit.'):`Door light ${progress+1} of ${puzzle.sequence.length} powered.${puzzle.showNext===false?' Follow the two code parts in your journal.':` Next: ${map.objects.find(o=>o.id===puzzle.sequence[progress+1])?.label||'read the inscription'}.`}`};
    }
    if (!state.activated.includes(object.id)) state.activated.push(object.id);
    return {type:'message',text:'Signal activated. Both blue signals open the final seal.'};
  }
  if (object.type==='exit') {
    if (exitReady(map,state,object)) { state.won=true; return {type:'win'}; }
    return {type:'message',text:(object.requiredItems||[]).some(id=>!state.items.includes(id))?'Exit locked: earn the missing supplies. Check your inventory and the reward chests.':'Exit locked: find the signal code and power every door light. Read the inscription or check your journal.'};
  }
  return {type:'none'};
}
export function completeChallenge(map,state,id) {
  const object=map.objects.find(o=>o.id===id&&o.type==='challenge');
  if (!object || state.solved.includes(id)) return false;
  const encounter=state.review?.encounters[id];
  if((state.review&&!encounter)||(encounter&&encounter.index!==encounter.questions.length))return false;
  if((object.questionCount||1)>1&&!encounter)return false;
  const reward=object.reward||{type:'key',value:object.key};
  const inventory=reward.type==='tool'?state.tools:reward.type==='item'?state.items:state.keys;
  if(!inventory.includes(reward.value))inventory.push(reward.value);
  state.solved.push(id);
  state.score+=encounter?encounter.questions.reduce((n,e)=>n+(e.attempts===1?100:50),0):(state.attempts[id]===1?100:50);
  return true;
}
export function resetPuzzle(map,state) {
  if (state.won) return;
  state.blocks=structuredClone(map.blocks); state.player={...map.start}; state.facing='up'; state.history=[];
}
export function shuffle(items, random=Math.random) {
  const result=items.slice();
  for(let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
