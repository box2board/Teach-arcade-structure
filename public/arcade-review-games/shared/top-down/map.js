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
  inventory: [
    { id:'archive-key', type:'key', value:'archive', label:'Archive key', icon:'⚿' },
    { id:'hammer', type:'tool', value:'hammer', label:'Hammer', icon:'⚒' },
    { id:'seal-crystal', type:'item', value:'seal-crystal', label:'Seal crystal', icon:'◆' }
  ],
  start: { x: 2, y: 9 },
  blocks: [{ id: 'stone', x: 3, y: 6 }],
  plates: [{ id: 'pressure', x: 5, y: 6 }],
  doors: [
    { id: 'west', x: 7, y: 6, plate: 'pressure' },
    { id: 'east', x: 14, y: 6, key: 'archive' },
    { id: 'vault-wall', x: 4, y: 4, tool: 'hammer', label: 'cracked wall', appearance: 'cracked' }
  ],
  objects: [
    { id: 'lobby-sign', type: 'sign', x: 1, y: 9, text: 'A heavy block holds a floor switch down. Push the block onto the amber switch to open the west gate. The cracked wall to the north needs a hammer. Look for one in the Archive, then return here.' },
    { id: 'archive', type: 'challenge', x: 10, y: 3, key: 'archive' },
    { id: 'hammer-pickup', type: 'tool', x: 12, y: 9, tool: 'hammer', label: 'Hammer', text: 'Hammer collected! Return to Switch Hall and walk into the cracked wall with it to the north.' },
    { id: 'seal-crystal', type: 'item', x: 4, y: 2, item: 'seal-crystal', label: 'Seal crystal', text: 'Seal crystal collected! Take it to the final chamber.' },
    { id: 'chamber-sign', type: 'sign', x: 16, y: 8, text: 'Power the exit: TOP → BOTTOM → TOP. Each correct switch lights one door indicator. A wrong switch turns all three off. The exit also needs the seal crystal from Switch Hall.' },
    { id: 'north-switch', label: 'TOP', type: 'lever', x: 16, y: 3 },
    { id: 'south-switch', label: 'BOTTOM', type: 'lever', x: 18, y: 6 },
    { id: 'exit', type: 'exit', x: 18, y: 10, requiredItems: ['seal-crystal'], requires: ['north-switch', 'south-switch'], sequencePuzzle: 'signals' }
  ],
  puzzles: [{ id: 'signals', sequence: ['north-switch', 'south-switch', 'north-switch'] }],
  rooms: [
    { name: '01 · Switch Hall', min: 1, max: 7, viewMin: 0, viewMax: 7, objective: 'Push the block onto the amber floor switch.' },
    { name: '02 · Archive', min: 8, max: 14, viewMin: 7, viewMax: 14, objective: 'Open the archive chest to earn a key. Walk into the east gate with it.' },
    { name: '03 · Signal Chamber', min: 15, max: 19, viewMin: 14, viewMax: 20, objective: 'Bring the seal crystal from Switch Hall, then solve the inscription.' }
  ]
};
