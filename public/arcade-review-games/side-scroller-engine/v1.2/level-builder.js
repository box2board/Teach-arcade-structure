/* Teach Arcade Side-Scroller Engine v1.2.0-alpha.2 — mechanic-aware level builder. */
(()=>{const TA=window.TASideScroller=window.TASideScroller||{};
const grid=(rows,cols)=>Array.from({length:rows},()=>Array(cols).fill(0));
function terrain(rows,cols,segments=[]){const g=grid(rows,cols);for(const s of segments){for(let c=s.from;c<s.to;c++)for(let r=s.top;r<rows;r++)g[r][c]=s.code||1}return g}
function marks(rows,cols,items=[]){const g=grid(rows,cols);for(const p of items){if(p.row>=0&&p.row<rows&&p.col>=0&&p.col<cols)g[p.row][p.col]=p.code||1}return g}
function normalizeSlope(s,i){if(!Number.isFinite(s.x1)||!Number.isFinite(s.y1)||!Number.isFinite(s.x2)||!Number.isFinite(s.y2))throw new Error('Slope '+(s.id||i+1)+' requires numeric x1,y1,x2,y2.');if(s.x1===s.x2)throw new Error('Slope '+(s.id||i+1)+' cannot be vertical.');return{...s,id:s.id||'slope-'+(i+1),grade:(s.y2-s.y1)/(s.x2-s.x1)}}
function normalizeRect(o,i,prefix,defaults){if(!Number.isFinite(o.x)||!Number.isFinite(o.y))throw new Error(prefix+' '+(o.id||i+1)+' requires numeric x and y.');return{...defaults,...o,id:o.id||prefix+'-'+(i+1)}}
function build(b){const rows=b.rows||15,cols=Math.ceil(b.world.width/(b.tileSize||32));return{...b,
slopes:(b.slopes||[]).map(normalizeSlope),
breakables:(b.breakables||[]).map((o,i)=>normalizeRect(o,i,'breakable',{w:32,h:32,breakMode:'headbutt',purpose:'barrier'})),
surfaceZones:(b.surfaceZones||[]).map((o,i)=>normalizeRect(o,i,'surface-zone',{w:160,h:1,material:'normal'})),
bounceSurfaces:(b.bounceSurfaces||[]).map((o,i)=>normalizeRect(o,i,'bounce',{w:48,h:14,bounce:820})),
climbables:(b.climbables||[]).map((o,i)=>normalizeRect(o,i,'climbable',{w:32,h:128})),
layers:{terrain:terrain(rows,cols,b.terrainSegments),hazards:marks(rows,cols,b.hazardTiles),checkpoints:marks(rows,cols,b.checkpointTiles)}}}
TA.LevelBuilder={build,grid,terrain,marks,normalizeSlope,normalizeRect};})();