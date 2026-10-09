export const pieces = [];
const box = (size, position = [0,0,0], shape = 'box') => ({size, position, shape});
for (const [category,h,sizes] of [
  ['Bricks',1,[[1,1],[1,2],[1,4],[2,2],[2,3],[2,4]]],
  ['Plates',1/3,[[1,2],[2,2],[2,4],[4,4],[4,8],[8,8]]],
  ['Walls',3,[[1,2],[1,4],[1,6],[2,2]]]
]) for (const [w,d] of sizes) pieces.push({type:`${category}-${w}x${d}`,category,size:[w,h,d],label:`${w} × ${d}`,parts:[box([w,h,d])],pads:true});
function add(type, category, label, size, parts, pads=true) {
  pieces.push({type,category,label,size,parts:parts || [box(size)],pads});
}
for (const [w,h,d] of [[2,1,2],[2,2,3],[2,1,4],[3,2,4]]) add(`Slope-${w}x${h}x${d}`,'Slopes',`Ramp ${w} × ${d}`,[w,h,d],[box([w,h,d],[0,0,0],'slope')],false);
for (const [w,h,d] of [[2,1,2],[4,2,3]]) add(`Roof-${w}x${d}`,'Slopes',`Roof ${w} × ${d}`,[w,h,d],[box([w,h,d],[0,0,0],'roof')],false);
for (const [w,d] of [[1,2],[2,2],[2,4],[4,4]]) add(`Tile-${w}x${d}`,'Tiles',`Tile ${w} × ${d}`,[w,1/3,d],null,false);
for (const w of [4,6,8]) add(`Beam-${w}`,'Structures',`Beam ${w}`,[w,1,1]);
for (const w of [4,6]) {
  const h=4, d=1;
  add(`Arch-${w}`,'Structures',`Stepped arch ${w}`,[w,h,d],[box([1,h,d],[-(w-1)/2,0,0]),box([1,h,d],[(w-1)/2,0,0]),box([w-2,1,d],[0,1.5,0]),box([.5,.5,d],[-(w-2)/2+.25,.75,0]),box([.5,.5,d],[(w-2)/2-.25,.75,0])]);
}
for (const [w,h] of [[3,4],[4,5]]) add(`Doorway-${w}`,'Structures',`Doorway ${w}`,[w,h,1],[box([.5,h,1],[-w/2+.25,0,0]),box([.5,h,1],[w/2-.25,0,0]),box([w-1,.5,1],[0,h/2-.25,0])]);
for (const [w,h] of [[3,3],[4,3]]) add(`Window-${w}`,'Structures',`Window ${w}`,[w,h,1],[box([.5,h,1],[-w/2+.25,0,0]),box([.5,h,1],[w/2-.25,0,0]),box([w-1,.5,1],[0,h/2-.25,0]),box([w-1,.5,1],[0,-h/2+.25,0])]);
for (const [w,h] of [[1,1],[2,1],[1,3],[2,3],[2,5]]) add(`Column-${w}x${h}`,'Round',`${h===1?'Round':'Column'} ${w} × ${h}`,[w,h,w],[box([w,h,w],[0,0,0],'cylinder')]);
export const categories = ['Bricks','Plates','Walls','Slopes','Structures','Round','Tiles'];

// Compound bounds leave doorways, windows and arch openings clear for other blocks.
export function occupiedBounds(block, definition) {
  const quarter = Math.round(block.rotationY / (Math.PI/2));
  const angle = quarter * Math.PI/2, c=Math.cos(angle), s=Math.sin(angle);
  return (definition.parts || [box(definition.size)]).map(part => {
    const [x,y,z]=part.position;
    const center=[block.position[0]+x*c+z*s,block.position[1]+y,block.position[2]-x*s+z*c];
    const size=quarter%2 ? [part.size[2],part.size[1],part.size[0]] : part.size;
    return size.map((v,i)=>[center[i]-v/2,center[i]+v/2]);
  });
}
