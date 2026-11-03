import {clone,uid,applyObjectValues,imageSourceSize} from './state.js';
// Source-space selections; coordinates are percentages of the original image.
export function rectanglePoints(a,b){return [[Math.min(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.max(a[1],b[1])],[Math.min(a[0],b[0]),Math.max(a[1],b[1])]];}
export function selectionHasArea(points){return points.length>=3&&Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))>.08;}
export function selectionRegion(points,restore,outside,feather,expand=0,smooth=false){if(!selectionHasArea(points))throw Error('Select an area first.');if(typeof smooth!=='boolean')throw Error('Invalid boundary smoothing.');if(!Number.isFinite(expand)||expand< -3||expand>3)throw Error('Use an edge adjustment between -3% and 3%.');return {kind:'region',restore,outside,feather,...(expand?{expand}:{}),...(smooth?{smooth:true}:{}),points:points.map(p=>[...p])};}
export function selectionBounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
export function setSelectionBounds(points,values){
 const b=selectionBounds(points),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 if(!b.w||!b.h||Object.values(values).some(v=>!Number.isFinite(v)))return points.map(p=>[...p]);
 const w=clamp(values.w??b.w,.5,'x' in values?100:100-b.x),h=clamp(values.h??b.h,.5,'y' in values?100:100-b.y),x=clamp(values.x??b.x,0,100-w),y=clamp(values.y??b.y,0,100-h);
 const result=points.map(p=>[clamp(x+(p[0]-b.x)*w/b.w,0,100),clamp(y+(p[1]-b.y)*h/b.h,0,100)]);
 return selectionHasArea(result)?result:points.map(p=>[...p]);
}
export function dragSelection(points,handle,dx,dy){
 const b=selectionBounds(points),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 if(handle==='move')return setSelectionBounds(points,{x:clamp(b.x+dx,0,100-b.w),y:clamp(b.y+dy,0,100-b.h)});
 let left=b.x,top=b.y,right=b.x+b.w,bottom=b.y+b.h;
 if(handle.includes('w'))left=clamp(left+dx,0,right-.5);if(handle.includes('e'))right=clamp(right+dx,left+.5,100);
 if(handle.includes('n'))top=clamp(top+dy,0,bottom-.5);if(handle.includes('s'))bottom=clamp(bottom+dy,top+.5,100);
 return setSelectionBounds(points,{x:left,y:top,w:right-left,h:bottom-top});
}
export function moveSelectionPoint(points,index,x,y){
 const result=points.map(p=>[...p]);if(!Number.isInteger(index)||!result[index]||!Number.isFinite(x)||!Number.isFinite(y))return result;
 result[index]=[Math.max(0,Math.min(100,x)),Math.max(0,Math.min(100,y))];
 return selectionHasArea(result)?result:points.map(p=>[...p]);
}

// Keep the embedded pixels editable; copied masks never share mutable draft data.
export function copySelectionLayer(draft,points,feather,expand=0,smooth=false){
 if(draft.type!=='image')throw Error('Choose an image first.');
 if((draft.maskStrokes?.length||0)>=200)throw Error('Maximum 200 mask edits. Undo an edit before copying.');
 const layer=clone(draft);applyObjectValues(layer,{crop:0,cropLeft:0,cropTop:0,cropRight:0,cropBottom:0});
 Object.assign(layer,{id:uid(),name:(draft.name||'Image').slice(0,80)+' selection',groupId:null,locked:false,visible:true,frame:'none',strokeWidth:0});
 layer.maskStrokes=[...(layer.maskStrokes||[]),selectionRegion(points,false,true,feather,expand,smooth)];
 const full=imageSourceSize(layer),ratio=full.h/full.w;
 // Cubic control hull contains the whole smoothed outline. Four blur sigmas
 // preserve the feather fringe; contraction deliberately keeps conservative bounds.
 const hull=points.map(p=>[...p]),clamp=v=>Math.max(0,Math.min(100,v));
 if(smooth)for(let i=0;i<points.length;i++){
  const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length],d=points[(i+2)%points.length];
  hull.push([clamp(b[0]+(c[0]-a[0])*.12),clamp(b[1]+(c[1]-a[1])*.12)],[clamp(c[0]-(d[0]-b[0])*.12),clamp(c[1]-(d[1]-b[1])*.12)]);
 }
 const box=selectionBounds(hull),pad=Math.max(0,expand)+2*feather;
 let left=clamp(box.x-pad),right=clamp(100-box.x-box.w-pad),top=clamp(box.y-pad/ratio),bottom=clamp(100-box.y-box.h-pad/ratio);
 // Tiny selections still need a valid editable crop window.
 if(left+right>99.5){const excess=(left+right-99.5)/2;left=Math.max(0,left-excess);right=Math.min(99.5-left,right-excess);}
 if(top+bottom>99.5){const excess=(top+bottom-99.5)/2;top=Math.max(0,top-excess);bottom=Math.min(99.5-top,bottom-excess);}
 if(layer.flipX)[left,right]=[right,left];if(layer.flipY)[top,bottom]=[bottom,top];
 applyObjectValues(layer,{cropLeft:left,cropRight:right,cropTop:top,cropBottom:bottom});return layer;
}
export function insertSelectionPoint(points,index){const result=points.map(p=>[...p]);if(points.length>=128||!Number.isInteger(index)||!points[index])return result;const next=points[(index+1)%points.length];result.splice(index+1,0,[(points[index][0]+next[0])/2,(points[index][1]+next[1])/2]);return result;}
export function removeSelectionPoint(points,index){const result=points.map(p=>[...p]);if(points.length<=3||!Number.isInteger(index)||!points[index])return result;result.splice(index,1);return selectionHasArea(result)?result:points.map(p=>[...p]);}
export function selectionPath(points,ratio=1,smooth=false){
 if(!points.length)return '';const pair=p=>p[0]+' '+p[1]*ratio;
 if(!smooth)return points.map((p,i)=>(i?'L':'M')+pair(p)).join(' ')+'Z';
 const clamp=v=>Math.max(0,Math.min(100,v));let path='M'+pair(points[0]);
 for(let i=0;i<points.length;i++){const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length],d=points[(i+2)%points.length];const c1=[clamp(b[0]+(c[0]-a[0])*.12),clamp(b[1]+(c[1]-a[1])*.12)],c2=[clamp(c[0]-(d[0]-b[0])*.12),clamp(c[1]-(d[1]-b[1])*.12)];path+=' C'+pair(c1)+' '+pair(c2)+' '+pair(c);}
 return path+'Z';
}

// Nearest handle within a screen-space touch target; dense outlines resolve by distance.
export function nearestSourcePoint(points,p,width,height,radius=22){
 let index=-1,distance=radius;
 points.forEach((q,i)=>{const d=Math.hypot((p[0]-q[0])*width/100,(p[1]-q[1])*height/100);if(d<=distance){index=i;distance=d;}});
 return index;
}
