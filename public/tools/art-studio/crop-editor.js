import {imageSourceSize} from './state.js';
import {nearestSourcePoint} from './image-selection.js';
import {esc} from './objects.js';
export function cropEdges(o){return {left:o.cropLeft??o.crop??0,top:o.cropTop??o.crop??0,right:o.cropRight??o.crop??0,bottom:o.cropBottom??o.crop??0};}
export function dragCrop(edges,handle,dx,dy){
 const c={...edges},clamp=(v,opposite)=>Math.max(0,Math.min(99.5-opposite,v));
 if(handle==='move'){
  dx=Math.max(-c.left,Math.min(c.right,dx));
  dy=Math.max(-c.top,Math.min(c.bottom,dy));
  c.left+=dx;c.right-=dx;c.top+=dy;c.bottom-=dy;
 }else{if(handle.includes('w'))c.left=clamp(c.left+dx,c.right);if(handle.includes('e'))c.right=clamp(c.right-dx,c.left);if(handle.includes('n'))c.top=clamp(c.top+dy,c.bottom);if(handle.includes('s'))c.bottom=clamp(c.bottom-dy,c.top);}
 return c;
}
export class CropEditor {
 constructor(ui){this.ui=ui;}
 open(o){const ui=this.ui,s=ui.state;let edges=cropEdges(o),gesture=null;
  ui.modal('Crop image',`<p>Drag a corner to trim an edge, or drag inside the rectangle to reposition it. The image box follows the crop without stretching the picture. Your original pixels and mask stay intact.</p><div class="as-crop-stage"><svg data-crop-preview viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Visual image crop workspace"></svg></div><div class="as-property-grid">${['left','top','right','bottom'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)} %<input type="number" data-crop-edge="${k}" min="0" max="99.5" step="0.1" value="${edges[k]}"></label>`).join('')}</div><p class="as-note" data-crop-status role="status"></p><div class="as-button-row"><button data-crop-reset>Show full image</button><button data-crop-cancel>Cancel</button><button data-crop-apply class="as-primary">Apply crop</button></div>`);
  const initialEdges=JSON.stringify(edges);ui.guardDraft?.(()=>JSON.stringify(edges)!==initialEdges);
  const svg=ui.root.querySelector('[data-crop-preview]');const fitAspect=ratio=>{svg.style.aspectRatio=String(ratio);svg.style.width='min(100%, '+(320*ratio)+'px)';};const full=imageSourceSize(o);fitAspect(full.w/full.h);
  const image=new Image();image.onload=()=>{if(svg.isConnected)fitAspect(image.naturalWidth/image.naturalHeight);};image.src=o.src;
  const render=()=>{if(!svg.isConnected)return;const {left:l,top:t,right:r,bottom:b}=edges,w=100-l-r,h=100-t-b;
   svg.innerHTML=`<image href="${esc(o.src)}" width="100" height="100" preserveAspectRatio="none" transform="translate(${o.flipX?100:0} ${o.flipY?100:0}) scale(${o.flipX?-1:1} ${o.flipY?-1:1})"/><path d="M0 0H100V100H0Z M${l} ${t}V${100-b}H${100-r}V${t}Z" fill="black" opacity=".5" fill-rule="evenodd" pointer-events="none"/><rect data-crop-handle="move" x="${l}" y="${t}" width="${w}" height="${h}" fill="transparent" stroke="white" stroke-width=".6" vector-effect="non-scaling-stroke"/>${[1,2].map(i=>`<path d="M${l+w*i/3} ${t}V${100-b} M${l} ${t+h*i/3}H${100-r}" stroke="white" opacity=".5" stroke-width=".3" pointer-events="none"/>`).join('')}${[['nw',l,t],['ne',100-r,t],['sw',l,100-b],['se',100-r,100-b]].map(([name,x,y])=>`<rect data-crop-handle="${name}" x="${x-2}" y="${y-2}" width="4" height="4" fill="white" stroke="#7957e7" stroke-width=".5"/>`).join('')}`;
   ui.root.querySelectorAll('[data-crop-edge]').forEach(input=>{if(document.activeElement!==input)input.value=Math.round(edges[input.dataset.cropEdge]*10)/10;});ui.root.querySelector('[data-crop-status]').textContent=`Keep ${Math.round(w)}% of width × ${Math.round(h)}% of height. Apply commits one undoable edit.`;
  };
  const point=e=>{const r=svg.getBoundingClientRect();return {x:(e.clientX-r.left)*100/r.width,y:(e.clientY-r.top)*100/r.height};};
  svg.onpointerdown=e=>{if(e.button!==0||gesture)return;let handle=e.target.dataset.cropHandle;
   if(e.pointerType==='touch'){const r=svg.getBoundingClientRect(),p=point(e),i=nearestSourcePoint([[edges.left,edges.top],[100-edges.right,edges.top],[edges.left,100-edges.bottom],[100-edges.right,100-edges.bottom]],[p.x,p.y],r.width,r.height);if(i>=0)handle=['nw','ne','sw','se'][i];}
   if(!handle)return;e.preventDefault();gesture={handle,start:point(e),edges:{...edges},pointer:e.pointerId};svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!gesture||e.pointerId!==gesture.pointer)return;const p=point(e);edges=dragCrop(gesture.edges,gesture.handle,p.x-gesture.start.x,p.y-gesture.start.y);render();};
  svg.onpointerup=e=>{if(gesture&&e.pointerId===gesture.pointer)gesture=null;};const cancel=e=>{if(!gesture||e.pointerId!==gesture.pointer)return;edges=gesture.edges;gesture=null;render();};svg.onpointercancel=cancel;svg.onlostpointercapture=cancel;
  ui.root.querySelectorAll('[data-crop-edge]').forEach(input=>input.oninput=()=>{const value=Number(input.value);if(Number.isFinite(value)){const key=input.dataset.cropEdge,opposite={left:'right',right:'left',top:'bottom',bottom:'top'}[key];edges[key]=Math.max(0,Math.min(99.5-edges[opposite],value));input.value=edges[key];render();}});
  ui.root.querySelector('[data-crop-reset]').onclick=()=>{edges={left:0,top:0,right:0,bottom:0};render();};ui.root.querySelector('[data-crop-cancel]').onclick=()=>ui.close();
  ui.root.querySelector('[data-crop-apply]').onclick=()=>{s.patch({crop:0,cropLeft:edges.left,cropTop:edges.top,cropRight:edges.right,cropBottom:edges.bottom});ui.close(true);ui.toast('Crop applied. Undo restores the previous framing.');};render();return true;
 }
}
