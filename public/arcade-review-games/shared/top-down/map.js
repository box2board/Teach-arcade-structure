// Geometry and puzzle objects are independent of curriculum content.
export const adventure = {
  title: 'The Three Seals',
  tiles: [
    '#####################',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#...................#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#......#......#.....#',
    '#####################'
  ],
  start: { x: 2, y: 9 },
  blocks: [{ id: 'stone', x: 3, y: 6 }],
  plates: [{ id: 'pressure', x: 5, y: 6 }],
  doors: [
    { id: 'west', x: 7, y: 6, plate: 'pressure' },
    { id: 'east', x: 14, y: 6, key: 'archive' }
  ],
  objects: [
    { id: 'lobby-sign', type: 'sign', x: 2, y: 3, text: 'A heavy block holds a floor switch down. Push the block onto the amber switch to open the west gate. If you get stuck, use Undo or Reset puzzle.' },
    { id: 'archive', type: 'challenge', x: 10, y: 3, key: 'archive' },
    { id: 'chamber-sign', type: 'sign', x: 16, y: 8, text: 'The final seal needs two signals. Activate both blue switches, then enter the glowing exit.' },
    { id: 'north-switch', type: 'lever', x: 16, y: 3 },
    { id: 'south-switch', type: 'lever', x: 18, y: 6 },
    { id: 'exit', type: 'exit', x: 18, y: 10, requires: ['north-switch', 'south-switch'] }
  ],
  rooms: [
    { name: '01 · Switch Hall', min: 1, max: 7, objective: 'Push the block onto the amber floor switch.' },
    { name: '02 · Archive', min: 8, max: 14, objective: 'Open the archive chest to earn a key. Use it at the east gate.' },
    { name: '03 · Signal Chamber', min: 15, max: 19, objective: 'Activate both blue switches, then enter the glowing exit.' }
  ]
};
