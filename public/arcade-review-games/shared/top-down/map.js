// Geometry and puzzle objects are independent of curriculum content.
export const adventure = {
  title: 'The Three Seals',
  tiles: [
    '#####################',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '####.###......#.....#',
    '#......#......#.....#',
    '#...................#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#####################'
  ],
  decorations: [
    { x:1,y:1 },{ x:6,y:1 },{ x:1,y:7 },{ x:6,y:11 },
    { x:8,y:1 },{ x:13,y:4 },{ x:8,y:8 },{ x:13,y:11 },
    { x:15,y:1 },{ x:19,y:1 },{ x:19,y:8 },{ x:15,y:11 }
  ],
  inventory: [
    { id:'archive-key', type:'key', value:'archive', label:'Archive key', icon:'⚿' },
    { id:'hammer', type:'tool', value:'hammer', label:'Hammer', icon:'⚒' },
    { id:'seal-crystal', type:'item', value:'seal-crystal', label:'Seal crystal', icon:'◆' },
    { id:'explorer-token', type:'item', value:'explorer-token', label:'Explorer token', icon:'★', optional:true }
  ],
  start: { x: 2, y: 9 },
  blocks: [{ id: 'stone', x: 3, y: 6 }],
  plates: [{ id: 'pressure', x: 5, y: 6 }],
  doors: [
    { id: 'west', x: 7, y: 6, plate: 'pressure' },
    { id: 'east', x: 14, y: 6, key: 'archive' },
    { id: 'vault-wall', x: 4, y: 4, tool: 'hammer', label: 'cracked wall', appearance: 'cracked' },
    { id: 'archive-nook', x: 12, y: 2, tool: 'hammer', label: 'cracked wall', appearance: 'cracked' }
  ],
  objects: [
    { id:'hall-column-left', type:'obstacle', appearance:'column', x:2, y:10 },
    { id:'hall-column-right', type:'obstacle', appearance:'column', x:5, y:10 },
    { id:'archive-shelf-a', type:'obstacle', appearance:'bookshelf', x:10, y:5 },
    { id:'archive-shelf-b', type:'obstacle', appearance:'bookshelf', x:11, y:5 },
    { id:'archive-shelf-c', type:'obstacle', appearance:'bookshelf', x:10, y:7 },
    { id:'archive-shelf-d', type:'obstacle', appearance:'bookshelf', x:11, y:7 },
    { id:'nook-left', type:'obstacle', appearance:'bookshelf', x:11, y:1 },
    { id:'nook-right', type:'obstacle', appearance:'bookshelf', x:13, y:1 },
    { id:'nook-left-base', type:'obstacle', appearance:'bookshelf', x:11, y:2 },
    { id:'nook-right-base', type:'obstacle', appearance:'bookshelf', x:13, y:2 },
    { id:'signal-column-a', type:'obstacle', appearance:'conduit', x:17, y:4 },
    { id:'signal-column-b', type:'obstacle', appearance:'conduit', x:17, y:5 },
    { id:'signal-column-c', type:'obstacle', appearance:'conduit', x:17, y:9 },
    { id:'explorer-token', type:'item', appearance:'treasure', x:12, y:1, item:'explorer-token', label:'Explorer token', optional:true, bonusPoints:50, text:'Explorer token found! +50 treasure bonus points. This bonus treasure is not needed for the exit.' },
    { id:'archive-hint', type:'sign', x:9, y:10, text:'A forgotten nook lies above the archive chest. Look for cracked stone between the shelves. The hammer may reveal an optional treasure.' },
    { id: 'lobby-sign', type: 'sign', x: 1, y: 9, text: 'A heavy block holds a floor switch down. Push the block onto the amber switch to open the west gate. The cracked wall to the north needs a hammer. Look for one in the Archive, then return here.' },
    { id: 'archive', type: 'challenge', x: 10, y: 3, key: 'archive' },
    { id: 'hammer-pickup', type: 'tool', x: 12, y: 9, tool: 'hammer', label: 'Hammer', text: 'Hammer collected! Return to Switch Hall and walk into the cracked wall to the north with your hammer.' },
    { id: 'seal-crystal', type: 'item', x: 4, y: 2, item: 'seal-crystal', label: 'Seal crystal', text: 'Seal crystal collected! Take it to the final chamber.' },
    { id: 'chamber-sign', type: 'sign', x: 16, y: 8, text: 'Power the exit: TOP → BOTTOM → TOP. Each correct switch lights one door indicator. A wrong switch turns all three off. The exit also needs the seal crystal from Switch Hall.' },
    { id: 'north-switch', label: 'TOP', type: 'lever', x: 16, y: 3 },
    { id: 'south-switch', label: 'BOTTOM', type: 'lever', x: 18, y: 6 },
    { id: 'exit', type: 'exit', x: 18, y: 10, requiredItems: ['seal-crystal'], requires: ['north-switch', 'south-switch'], sequencePuzzle: 'signals' }
  ],
  puzzles: [{ id: 'signals', sequence: ['north-switch', 'south-switch', 'north-switch'] }],
  rooms: [
    { name: '01 · Switch Hall', theme:'hall', min: 1, max: 7, viewMin: 0, viewMax: 7, objective: 'Push the block onto the amber floor switch.' },
    { name: '02 · Archive', theme:'archive', min: 8, max: 14, viewMin: 7, viewMax: 14, objective: 'Open the archive chest to earn a key. Walk into the east gate with it.' },
    { name: '03 · Signal Chamber', theme:'signals', min: 15, max: 19, viewMin: 14, viewMax: 20, objective: 'Bring the seal crystal from Switch Hall, then solve the inscription.' }
  ]
};

export function createAdventure(mode='easy'){
  const map=structuredClone(adventure);map.mode=mode==='medium'?'medium':'easy';
  if(map.mode==='easy')return map;
  const hammer=map.objects.find(o=>o.id==='hammer-pickup');
  Object.assign(hammer,{type:'challenge',label:'Workshop chest',questionCount:2,reward:{type:'tool',value:'hammer',label:'Hammer',message:'Hammer earned! Return to Switch Hall and break the cracked wall.'}});
  const archive=map.objects.find(o=>o.id==='archive');
  Object.assign(archive,{label:'Archive chest',questionCount:3,reward:{type:'key',value:'archive',label:'Archive key',message:'Archive key earned! Walk into the east gate to unlock it.'}});
  const crystal=map.objects.find(o=>o.id==='seal-crystal');
  Object.assign(crystal,{type:'challenge',label:'Vault chest',questionCount:2,reward:{type:'item',value:'seal-crystal',label:'Seal crystal',message:'Seal crystal earned! Carry it to the Signal Chamber.'}});
  map.objects.push({id:'power-chest',type:'challenge',x:18,y:2,label:'Power chest',questionCount:3,reward:{type:'item',value:'power-cell',label:'Power cell',message:'Power cell earned! Complete the signal sequence to open the exit.'}});
  map.objects.find(o=>o.id==='chamber-sign').text+=' The Power chest in this chamber earns the power cell for the exit.';
  map.inventory.push({id:'power-cell',type:'item',value:'power-cell',label:'Power cell',icon:'◆'});
  map.objects.find(o=>o.type==='exit').requiredItems.push('power-cell');
  return map;
}
