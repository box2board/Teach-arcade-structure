// Library miniatures are projected from the same profiles used by the 3D track.
import {localPoint} from './geometry.js';
export function icon(a){
 const count=64,project=(t,side=0)=>{const p=localPoint(a,t,1),x=p.x-Math.sin(p.heading)*side,z=p.z+Math.cos(p.heading)*side,y=p.y-Math.sin(p.bank)*side;return [x*.84-z*.66,x*.22+z*.39-y*.88];};
 const outer=[...Array(count+1)].map((_,i)=>project(i/count,-1.7)).concat([...Array(count+1)].map((_,i)=>project(1-i/count,1.7)));
 const xs=outer.map(p=>p[0]),ys=outer.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(...xs)-minX,h=Math.max(...ys)-minY,scale=Math.min(100/(w||1),52/(h||1));
 const xy=([x,y],drop=0)=>[10+(100-w*scale)/2+(x-minX)*scale,12+(52-h*scale)/2+(y-minY)*scale+drop].map(v=>v.toFixed(2)).join(',');
 const polygon=(width)=>[...Array(count+1)].map((_,i)=>project(i/count,-width)).concat([...Array(count+1)].map((_,i)=>project(1-i/count,width))).map(p=>xy(p)).join(' ');
 const line=side=>Array.from({length:count+1},(_,i)=>xy(project(i/count,side))).join(' ');
 const tag=a.kind==='loop'?'LOOP':a.interaction==='boost'?'BOOST':a.interaction==='brake'?'BRAKE':a.tunnel?'TUNNEL':a.angle?`${Math.round(Math.abs(a.angle)*180/Math.PI)}°`:a.kind==='wave'?'HILLS':a.kind==='chicane'?'S-BEND':`${a.length}m`;
 let extra='';if(a.tunnel){for(const t of [.2,.5,.8]){const p=project(t);const base=xy(p).split(',').map(Number);extra+=`<path d="M${base[0]-7},${base[1]+2} v-14 q7,-8 14,0 v14" fill="none" stroke="#ffd126" stroke-width="3"/>`;}}
 if(a.interaction==='boost'||a.interaction==='brake'){for(const t of [.32,.5,.68]){const [x,y]=xy(project(t)).split(',').map(Number);extra+=`<path d="M${x-4},${y-4} l4,4 -4,4" fill="none" stroke="${a.interaction==='boost'?'#35fff0':'#ffdf20'}" stroke-width="2.5"/>`;}}
 return `<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="68" rx="42" ry="6" fill="#39267e" opacity=".12"/><polygon points="${outer.map(p=>xy(p,4)).join(' ')}" fill="#4c2c91"/><polygon points="${polygon(1.7)}" fill="${a.color}"/><polygon points="${polygon(1.12)}" fill="#302254"/><polyline points="${line(-1.58)}" fill="none" stroke="#fff2d7" stroke-width="1.8"/><polyline points="${line(1.58)}" fill="none" stroke="#fff2d7" stroke-width="1.8"/><polyline points="${line(0)}" fill="none" stroke="#fff2d7" stroke-width="1" stroke-dasharray="3 3"/>${extra}<rect x="78" y="2" width="40" height="13" rx="5" fill="#fff8df"/><text x="98" y="11" text-anchor="middle" font-family="sans-serif" font-size="7" font-weight="900" fill="#5d298e">${tag}</text></svg>`;
}
