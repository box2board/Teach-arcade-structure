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
  const map=structuredClone(adventure);map.mode=['medium','hard'].includes(mode)?mode:'easy';
  if(map.mode==='easy'){
    Object.assign(map.objects.find(o=>o.id==='archive'),{label:'Archive chest',questionCount:2,reward:{type:'key',value:'archive',label:'Archive key',message:'Archive key earned! Walk into the east gate to unlock it.'}});
    Object.assign(map.objects.find(o=>o.id==='seal-crystal'),{type:'challenge',label:'Vault chest',questionCount:2,reward:{type:'item',value:'seal-crystal',label:'Seal crystal',message:'Seal crystal earned! Carry it to the Signal Chamber.'}});
    map.objects.push({id:'power-chest',type:'challenge',x:18,y:2,label:'Power chest',questionCount:2,reward:{type:'item',value:'power-cell',label:'Power cell',message:'Power cell earned! Complete the signal sequence to open the exit.'}});
    map.inventory.push({id:'power-cell',type:'item',value:'power-cell',label:'Power cell',icon:'◆'});
    map.objects.find(o=>o.type==='exit').requiredItems.push('power-cell');
    map.objects.find(o=>o.id==='chamber-sign').text+=' Earn the power cell from the Power chest in this chamber before using the exit.';
    return map;
  }
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
  // Two southward branches share the original room boundaries.
  map.tiles[12]='####.#####.##########';
  for(let y=13;y<24;y++)map.tiles.push('#......#......#######');
  map.tiles.push('#####################');
  for(const room of map.rooms){room.minY=0;room.maxY=11;room.viewMinY=0;room.viewMaxY=12;}
  map.rooms[0].maxY=12;map.rooms[1].maxY=12;
  map.rooms[0].objective='Push the block onto the switch. The south branch and north vault need a hammer from the Workshop.';
  map.rooms[1].objective='Earn the archive key here. Follow the south passage to the Workshop for a hammer.';
  map.rooms.push(
    {name:'04 · Workshop',theme:'archive',min:8,max:14,minY:13,maxY:23,viewMin:7,viewMax:14,viewMinY:12,viewMaxY:24,objective:'Earn the hammer from the Workshop chest. Return north, then explore both cracked passages in Switch Hall.'},
    {name:'05 · Hidden Library',theme:'library',min:1,max:7,minY:13,maxY:23,viewMin:0,viewMax:7,viewMinY:12,viewMaxY:24,objective:'Earn the lantern, then read the faded inscription at the south end. It reveals the Signal Chamber code.'}
  );
  Object.assign(hammer,{x:11,y:19});
  hammer.reward.message='Hammer earned! Return north to Switch Hall. Break the north vault wall and the south library wall.';
  map.doors.push({id:'library-wall',x:4,y:12,tool:'hammer',label:'library wall',appearance:'cracked'});
  map.objects.push(
    {id:'workshop-sign',type:'sign',x:9,y:15,text:'The Workshop chest earns a hammer. Return through the north passage to the Archive, then head west to Switch Hall. The hammer opens its north vault and south library.'},
    {id:'workbench-a',type:'obstacle',appearance:'bookshelf',x:10,y:17},
    {id:'workbench-b',type:'obstacle',appearance:'bookshelf',x:12,y:17},
    {id:'lantern-chest',type:'challenge',x:3,y:16,label:'Lantern chest',questionCount:2,reward:{type:'tool',value:'lantern',label:'Lantern',message:'Lantern earned! Read the faded inscription at the south end of this library.'}},
    {id:'hidden-inscription',type:'sign',appearance:'inscription',x:4,y:21,requiresTool:'lantern',clue:'signal-code',text:'The lantern reveals the signal code: BOTTOM → TOP → BOTTOM → TOP. Your journal keeps this clue.',lockedText:'This inscription has faded. Earn the lantern from the library chest to reveal its words.'},
    {id:'library-shelf-a',type:'obstacle',appearance:'bookshelf',x:2,y:19},
    {id:'library-shelf-b',type:'obstacle',appearance:'bookshelf',x:6,y:19}
  );
  map.inventory.push({id:'lantern',type:'tool',value:'lantern',label:'Lantern',appearance:'lantern'});
  map.clues=[{id:'signal-code',label:'Signal code',text:'BOTTOM → TOP → BOTTOM → TOP'}];
  map.puzzles[0].sequence=['south-switch','north-switch','south-switch','north-switch'];
  map.puzzles[0].requiredClue='signal-code';
  map.objects.find(o=>o.id==='chamber-sign').text='The signal code is hidden in the library south of Switch Hall. Earn its lantern and read the faded inscription. The Power chest here earns the exit power cell.';
  map.objects.find(o=>o.id==='lobby-sign').text='Push the block onto the amber floor switch to reach the Archive. Its south passage leads to the Workshop. Earn a hammer there, then return to open the north vault and south library.';
  map.decorations.push({x:8,y:14},{x:13,y:22},{x:1,y:14},{x:6,y:22});
  if(map.mode==='hard'){
    // Hard adds dependencies and multi-block planning, not extra questions.
    for(const chest of map.objects.filter(o=>o.type==='challenge'))chest.questionCount=2;
    map.blocks.push({id:'second-stone',x:3,y:8});
    map.plates.push({id:'second-pressure',x:5,y:9});
    Object.assign(map.doors[0],{plates:['pressure','second-pressure'],lockedText:'Both floor switches must stay occupied by blocks to open this gate.'});
    delete map.doors[0].plate;
    map.objects.push({id:'workshop-key-chest',type:'challenge',x:12,y:9,label:'Workshop key chest',questionCount:2,reward:{type:'key',value:'workshop',label:'Workshop key',message:'Workshop key earned! It opens the south passage of the Archive.'}});
    map.doors.push({id:'workshop-gate',x:10,y:12,key:'workshop',keyLabel:'Workshop key',lockedText:'Workshop key required. Earn it from the lower Archive chest.'});
    map.inventory.push({id:'workshop-key',type:'key',value:'workshop',label:'Workshop key'});
    const inscription=map.objects.find(o=>o.id==='hidden-inscription');
    Object.assign(inscription,{clue:'signal-start',text:'The lantern reveals CODE · PART 1: TOP → BOTTOM → BOTTOM. Find PART 2 on the faded Workshop tablet, then combine both parts in order.'});
    map.objects.push({id:'workshop-inscription',type:'sign',appearance:'inscription',x:13,y:22,requiresTool:'lantern',clue:'signal-end',lockedText:'A faded tablet marked CODE · PART 2. Its words need lantern light.',text:'The lantern reveals CODE · PART 2: TOP → BOTTOM → TOP. Combine this after PART 1 from the Hidden Library.'});
    map.clues=[{id:'signal-start',label:'Code · Part 1',text:'TOP → BOTTOM → BOTTOM'},{id:'signal-end',label:'Code · Part 2',text:'TOP → BOTTOM → TOP'}];
    Object.assign(map.puzzles[0],{sequence:['north-switch','south-switch','south-switch','north-switch','south-switch','north-switch'],requiredClues:['signal-start','signal-end'],showNext:false,clueHint:'Read both faded tablets with the lantern: one in the Hidden Library, one in the Workshop.'});
    delete map.puzzles[0].requiredClue;
    map.rooms[0].objective='Keep both floor switches occupied. Later, use the hammer to explore the north vault and south library.';
    map.rooms[1].objective='The Archive holds keys for two different gates. The south Workshop gate needs its own key.';
    map.rooms[4].objective='Earn a lantern and reveal Code · Part 1. A second faded tablet waits in the Workshop.';
    map.objects.find(o=>o.id==='lobby-sign').text='Two blocks, two amber floor switches. Both must stay occupied to open the Archive gate. Blocks can be pushed around corners; Undo or Reset puzzle can recover a trapped block.';
    map.objects.find(o=>o.id==='chamber-sign').text='The six-step code has two parts. Use lantern light on the library inscription and the Workshop tablet, then read Part 1 followed by Part 2. This chamber also needs the crystal and power cell.';
    map.objects.find(o=>o.id==='lantern-chest').reward.message='Lantern earned! Read the library inscription, then return to the Workshop to reveal its second tablet.';
  }
  return map;
}
