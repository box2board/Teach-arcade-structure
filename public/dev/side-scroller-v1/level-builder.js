(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
const grid=(rows,cols)=>Array.from({length:rows},()=>Array(cols).fill(0));
function terrain(rows,cols,segments=[]){const g=grid(rows,cols);for(const s of segments){for(let c=s.from;c<s.to;c++)for(let r=s.top;r<rows;r++)g[r][c]=s.code||1}return g}
function marks(rows,cols,items=[]){const g=grid(rows,cols);for(const p of items){if(p.row>=0&&p.row<rows&&p.col>=0&&p.col<cols)g[p.row][p.col]=p.code||1}return g}
function build(b){const rows=b.rows||15,cols=Math.ceil(b.world.width/(b.tileSize||32));return{...b,layers:{terrain:terrain(rows,cols,b.terrainSegments),hazards:marks(rows,cols,b.hazardTiles),checkpoints:marks(rows,cols,b.checkpointTiles)}}}
TA.LevelBuilder={build,grid,terrain,marks}})();