export function layout(name){const rows=name==='garden'?[[8,6],[6,4]]:name==='terrace'?[[10,6],[8,4],[4,4]]:[[12,8],[8,4],[4,4]];let id=0;const w=rows[0][0],h=rows[0][1];return rows.flatMap(([a,b],z)=>Array.from({length:a*b},(_,i)=>({id:id++,x:(w-a)/2+i%a,y:(h-b)/2+Math.floor(i/a),z,face:0,removed:false})));}
export function free(t,tiles){return !t.removed&&!tiles.some(o=>!o.removed&&o.z>t.z&&Math.abs(o.x-t.x)<.99&&Math.abs(o.y-t.y)<.99)&&(!tiles.some(o=>!o.removed&&o.z===t.z&&Math.abs(o.x-(t.x-1))<.01&&Math.abs(o.y-t.y)<.99)||!tiles.some(o=>!o.removed&&o.z===t.z&&Math.abs(o.x-(t.x+1))<.01&&Math.abs(o.y-t.y)<.99));}
export function pairs(tiles){const a=tiles.filter(t=>free(t,tiles)),p=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i].face===a[j].face)p.push([a[i],a[j]]);return p;}
export function mix(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// First produce a legal geometric removal order, then assign matching faces to
// its pairs. Shuffles reuse exactly the remaining multiset of faces.
export function deal(tiles){
 let order=null;
 for(let attempt=0;attempt<200&&!order;attempt++){
  const copy=tiles.map(t=>({...t})),path=[];
  while(copy.some(t=>!t.removed)){
   const open=mix(copy.filter(t=>free(t,copy)));
   if(open.length<2)break;
   // Favor tiles on the highest remaining layer, avoiding buried singletons.
   open.sort((a,b)=>b.z-a.z);
   open[0].removed=open[1].removed=true;path.push([open[0].id,open[1].id]);
  }
  if(copy.every(t=>t.removed))order=path;
 }
 // A player can leave a geometrically impossible stack. Reflow remaining tiles
 // into open rows so shuffle always provides recovery, without adding tiles.
 if(!order){const alive=tiles.filter(t=>!t.removed);alive.forEach((t,i)=>{t.x=i%12;t.y=Math.floor(i/12);t.z=0;});order=[];for(let row=0;row<alive.length;row+=12){const batch=alive.slice(row,row+12);while(batch.length)order.push([batch.shift().id,batch.pop().id]);}}
 const counts=new Map();tiles.filter(t=>!t.removed).forEach(t=>counts.set(t.face,(counts.get(t.face)||0)+1));const faces=[];
 for(const [face,n]of counts){if(n%2)throw Error('Unpaired face');for(let i=0;i<n/2;i++)faces.push(face);}mix(faces);
 const byId=new Map(tiles.map(t=>[t.id,t]));order.forEach(([a,b],i)=>byId.get(a).face=byId.get(b).face=faces[i]);return order;
}
export function fresh(name){const tiles=layout(name);tiles.forEach((t,i)=>t.face=Math.floor(i/4)%36);deal(tiles);return tiles;}
