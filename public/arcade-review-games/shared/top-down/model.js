export const directions = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
const at = (a, b) => a.x === b.x && a.y === b.y;
export function createState(map) {
  return { player: { ...map.start }, facing: 'up', blocks: structuredClone(map.blocks), opened: [], activated: [], keys: [], solved: [], attempts: {}, score: 0, won: false, moves: 0, history: [] };
}
export function doorOpen(map, state, door) {
  if (state.opened.includes(door.id)) return true;
  const plate = map.plates.find(p => p.id === door.plate);
  return Boolean(plate && state.blocks.some(b => at(b, plate)));
}
export function obstacle(map, state, pos) {
  if (!map.tiles[pos.y] || map.tiles[pos.y][pos.x] !== '.') return true;
  if (map.doors.some(d => at(d, pos) && !doorOpen(map,state,d))) return true;
  return map.objects.some(o => at(o,pos) && o.type !== 'exit');
}
export function move(map, state, direction) {
  if (state.won || !directions[direction]) return false;
  state.facing = direction;
  const [dx,dy] = directions[direction];
  const next = { x:state.player.x+dx, y:state.player.y+dy };
  if (obstacle(map,state,next)) return false;
  const block = state.blocks.find(b => at(b,next));
  const beyond = { x:next.x+dx, y:next.y+dy };
  if (block && (obstacle(map,state,beyond) || state.blocks.some(b => at(b,beyond)))) return false;
  // Only physical moves are undone; awarded keys and learning progress remain intact.
  state.history.push({ player:{...state.player}, blocks:structuredClone(state.blocks) });
  if (state.history.length > 200) state.history.shift();
  if (block) Object.assign(block,beyond);
  state.player = next;
  state.moves++;
  return true;
}
export function undo(state) {
  if (state.won) return;
  const previous=state.history.pop();
  if (previous) { state.player=previous.player; state.blocks=previous.blocks; }
}
export function interact(map,state) {
  if (state.won) return { type:'none' };
  const [dx,dy]=directions[state.facing];
  const front={x:state.player.x+dx,y:state.player.y+dy};
  const object=map.objects.find(o=>at(o,state.player)&&o.type==='exit') || map.objects.find(o=>at(o,front));
  const door=map.doors.find(d=>at(d,front));
  if (door) {
    if (doorOpen(map,state,door)) return {type:'message',text:'The gate is open.'};
    if (door.key && state.keys.includes(door.key)) {
      state.opened.push(door.id); state.keys=state.keys.filter(k=>k!==door.key);
      return {type:'message',text:'Key used. The east gate is now open.'};
    }
    return {type:'message',text:door.plate?'Hold the amber floor switch down with the block.':'Find the archive key first.'};
  }
  if (!object) return {type:'message',text:'Face a sign, chest, switch, or gate and interact.'};
  if (object.type==='sign') return {type:'message',text:object.text};
  if (object.type==='challenge') return state.solved.includes(object.id)?{type:'message',text:'This chest is empty. You already earned its key.'}:{type:'challenge',id:object.id};
  if (object.type==='lever') {
    if (!state.activated.includes(object.id)) state.activated.push(object.id);
    return {type:'message',text:'Signal activated. Both blue signals open the final seal.'};
  }
  if (object.type==='exit') {
    if (object.requires.every(id=>state.activated.includes(id))) { state.won=true; return {type:'win'}; }
    return {type:'message',text:'The final seal is locked. Activate both blue switches.'};
  }
  return {type:'none'};
}
export function completeChallenge(map,state,id) {
  const object=map.objects.find(o=>o.id===id&&o.type==='challenge');
  if (!object || state.solved.includes(id)) return false;
  state.solved.push(id); state.keys.push(object.key);
  state.score+=(state.attempts[id]===1?100:50);
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
