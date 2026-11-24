import {festivalJunctionOffsets,festivalStarts,festivalSpacePatterns} from './festival-layout.js';
export {characters} from './characters.js';
export {dice} from './dice-library.js';
export const spaces={ticket:{color:'#ffd269',label:'Ticket space · +3 Tickets',award:3},surprise:{color:'#b696e0',label:'Surprise · reveal a board event',award:0},item:{color:'#74c4e4',label:'Dice gift · save a special die',award:0},scenic:{color:'#90cba0',label:'Enjoy the fairgrounds',award:0}};
export const boards=[{id:'festival',name:'Festival Fairgrounds',startSpaces:festivalStarts,width:2400,height:1800,
districts:[{name:'Carnival Row',x:650,y:470,color:'#e6c993'},{name:'Skyline Heights',x:1750,y:470,color:'#c7d4b4'},{name:'Splash Harbor',x:1750,y:1330,color:'#b9dce1'},{name:'Lantern Gardens',x:650,y:1330,color:'#bfdaa7'}],
create(){const nodes=[];this.districts.forEach((d,k)=>{for(let i=0;i<16;i++){const a=i/16*Math.PI*2;nodes.push({id:k*16+i,x:d.x+390*Math.cos(a),y:d.y+300*Math.sin(a),next:[k*16+(i+1)%16],district:k,type:festivalSpacePatterns[k][(i-festivalJunctionOffsets[k]+16)%16]})}});
const links=[[0,24],[20,44],[40,48],[60,4]];links.forEach(([a,b],k)=>{const ids=[64+k*2,65+k*2];ids.forEach((id,i)=>{let t=(i+1)/3;nodes.push({id,x:nodes[a].x+(nodes[b].x-nodes[a].x)*t,y:nodes[a].y+(nodes[b].y-nodes[a].y)*t,next:i?[b]:[ids[1]],district:nodes[b].district,type:i?'ticket':'scenic',bridge:true})});nodes[a].next.push(ids[0]);nodes[a].junction=true;});return nodes}}];
