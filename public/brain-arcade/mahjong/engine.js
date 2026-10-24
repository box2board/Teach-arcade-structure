// Layouts use explicit tile coordinates; gaps and silhouettes are part of play.
export const layoutNames=['turtle','butterfly','dragon','fortress','hourglass'];
export function layout(name){
 const tiles=[];
 const row=(x,y,n,z=0)=>{for(let i=0;i<n;i++)tiles.push({id:tiles.length,x:x+i,y,z,face:0,removed:false});};
 const rect=(x,y,w,h,z)=>{for(let j=0;j<h;j++)row(x,y+j,w,z);};
 if(name==='turtle'){
  [8,10,12,14,14,12,10,8].forEach((n,y)=>row((14-n)/2,y,n));
  rect(4,1,6,6,1);rect(5,2,4,4,2);rect(6,3,2,2,3);
 }else if(name==='butterfly'){
  [2,4,5,4,4,5,4,2].forEach((n,y)=>{row(0,y,n);row(14-n,y,n);row(6,y,2);});
  rect(2,2,2,4,1);rect(10,2,2,4,1);rect(6,1,2,6,1);rect(6,2,2,4,2);
 }else if(name==='dragon'){
  [[0,0,8],[0,1,2],[0,2,12],[10,3,2],[2,4,10],[2,5,2],[2,6,12],[10,7,4]].forEach(([x,y,n])=>row(x,y,n));
  row(2,0,4,1);row(2,2,8,1);row(4,4,6,1);row(4,6,8,1);row(5,2,4,2);row(6,6,4,2);
 }else if(name==='fortress'){
  for(let y=0;y<8;y++)if(y<2||y>5)row(0,y,12);else{row(0,y,2);row(10,y,2);}
  for(const x of[0,8])for(const y of[0,6])rect(x,y,4,2,1);
  for(const x of[0,10])for(const y of[0,6])rect(x,y,2,2,2);
 }else if(name==='hourglass'){
  [12,10,8,6,4,4,6,8,10,12].forEach((n,y)=>row((12-n)/2,y,n));
  [8,6,4,2,2,4,6,8].forEach((n,y)=>row((12-n)/2,y+1,n,1));
  rect(5,4,2,2,2);
 }else throw Error('Unknown Mahjong layout: '+name);
 return tiles;
}
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
export function fresh(name){const tiles=layout(name);tiles.forEach((t,i)=>t.face=Math.floor(i/2)%36);deal(tiles);return tiles;}
