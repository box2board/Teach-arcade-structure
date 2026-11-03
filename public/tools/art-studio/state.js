export const uid = () => 'a' + Math.random().toString(36).slice(2, 11);
export const clone = v => typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
export function newPage(width=816,height=1056) {return {id:uid(),name:'Untitled page',width,height,background:'#ffffff',objects:[]};}
export function newProject(){return {schemaVersion:1,id:uid(),name:'My classroom creation',updatedAt:Date.now(),pages:[newPage()]};}
// Recover the full image's displayed size from its current crop window.
export function imageSourceSize(o){const c=o.crop||0;return {w:o.w*100/(100-(o.cropLeft??c)-(o.cropRight??c)),h:o.h*100/(100-(o.cropTop??c)-(o.cropBottom??c))};}
// Shared inspector and history semantics; manual names are preserved.
export function applyObjectValues(o,values){
 const next={...values};
 if(o.type==='image'&&['crop','cropLeft','cropTop','cropRight','cropBottom'].some(k=>k in next)){
  const full=imageSourceSize(o),c=o.crop||0;
  // A crop must retain at least 0.5% on each axis. Clamp the edited edge first.
  for(const [start,end] of [['cropLeft','cropRight'],['cropTop','cropBottom']]){
   const nc=next.crop??c;let a=next[start]??o[start]??nc,b=next[end]??o[end]??nc;
   if(start in next)a=Math.max(0,Math.min(99.5-b,a));
   if(end in next)b=Math.max(0,Math.min(99.5-a,b));
   if(start in next)next[start]=a;if(end in next)next[end]=b;
  }
  const after={...o,...next},nc=after.crop||0,explicit={...next};
  const nw=full.w*(100-(after.cropLeft??nc)-(after.cropRight??nc))/100,nh=full.h*(100-(after.cropTop??nc)-(after.cropBottom??nc))/100;
  const dx=full.w*((after.cropLeft??nc)-(o.cropLeft??c))/100+(nw-o.w)/2,dy=full.h*((after.cropTop??nc)-(o.cropTop??c))/100+(nh-o.h)/2,a=o.angle*Math.PI/180;
  // Keep retained pixels stationary, including when the object is rotated.
  Object.assign(next,{w:nw,h:nh,x:o.x+(o.w-nw)/2+dx*Math.cos(a)-dy*Math.sin(a),y:o.y+(o.h-nh)/2+dx*Math.sin(a)+dy*Math.cos(a)},explicit);
 }
 if(o.type==='image'&&o.keepRatio!==false){if('w' in next&&!('h' in next))next.h=o.h*next.w/o.w;if('h' in next&&!('w' in next))next.w=o.w*next.h/o.h;}
 if(o.type==='text'&&'text' in next&&!o.customName)next.name=String(next.text).replace(/\s+/g,' ').trim().slice(0,32)||'Empty text';
 Object.assign(o,next);
}
export class StudioState {
 constructor(project=newProject()){this.project=clone(project);this.pageId=project.pages[0].id;this.selected=[];this.past=[];this.future=[];this.listeners=[];this.baseline=null;}
 get page(){return this.project.pages.find(p=>p.id===this.pageId)||this.project.pages[0];}
 get objects(){return this.page.objects.filter(o=>this.selected.includes(o.id));}
 on(fn){this.listeners.push(fn);return fn;}
 emit(){this.listeners.forEach(fn=>fn());}
 begin(){if(!this.baseline)this.baseline=clone(this.project);}
 commit(){if(!this.baseline)return; if(JSON.stringify(this.baseline)!==JSON.stringify(this.project)){this.past.push(this.baseline);const limit=Math.max(3,Math.min(60,Math.floor(24000000/Math.max(1,JSON.stringify(this.project).length))));if(this.past.length>limit)this.past.splice(0,this.past.length-limit);this.future=[];this.project.updatedAt=Date.now();}this.baseline=null;this.emit();}
 change(fn){this.begin();fn();this.commit();}
 undo(){if(!this.past.length)return;this.future.push(clone(this.project));this.project=this.past.pop();this.reconcile();}
 redo(){if(!this.future.length)return;this.past.push(clone(this.project));this.project=this.future.pop();this.reconcile();}
 reconcile(){this.baseline=null;if(!this.project.pages.some(p=>p.id===this.pageId))this.pageId=this.project.pages[0].id;this.selected=this.selected.filter(id=>this.page.objects.some(o=>o.id===id));this.emit();}
 select(ids,individual=false){this.selected=[...new Set(ids.flatMap(id=>{const o=this.page.objects.find(x=>x.id===id);return o?.groupId&&!individual?this.page.objects.filter(x=>x.groupId===o.groupId).map(x=>x.id):[id];}))];this.emit();}
 add(objects){this.change(()=>this.page.objects.push(...objects));this.select(objects.map(o=>o.id));}
 patch(values){this.change(()=>this.objects.filter(o=>!o.locked).forEach(o=>applyObjectValues(o,values)));}
 remove(){this.change(()=>{this.page.objects=this.page.objects.filter(o=>!this.selected.includes(o.id)||o.locked);});this.selected=[];this.emit();}
 duplicate(){const groupMap={};const copies=clone(this.objects).filter(o=>!o.locked).map(o=>{o.id=uid();o.x+=24;o.y+=24;o.name+=' copy';if(o.groupId)o.groupId=groupMap[o.groupId] ||= uid();return o;});this.add(copies);}
 group(){if(this.objects.some(o=>o.locked))return;this.patch({groupId:uid()});}
 ungroup(){if(this.objects.some(o=>o.locked))return;this.patch({groupId:null});}
 load(project){this.project=clone(project);this.pageId=project.pages[0].id;this.selected=[];this.past=[];this.future=[];this.baseline=null;this.emit();}
}
export const presets={'Letter':[816,1056],'A4':[794,1123],'Presentation 16:9':[1280,720],'Square':[1000,1000],'Poster':[1200,1600],'Worksheet':[816,1056],'Certificate':[1120,792],'Classroom Sign':[1200,600],'Social Graphic':[1080,1080]};
export function bounds(objects){if(!objects.length)return null;return {x:Math.min(...objects.map(o=>o.x)),y:Math.min(...objects.map(o=>o.y)),w:Math.max(...objects.map(o=>o.x+o.w))-Math.min(...objects.map(o=>o.x)),h:Math.max(...objects.map(o=>o.y+o.h))-Math.min(...objects.map(o=>o.y))};}
export function reorder(state,ids,mode){state.change(()=>{const a=state.page.objects;if(mode==='front'||mode==='back'){const selected=a.filter(o=>ids.includes(o.id)&&!o.locked),rest=a.filter(o=>!selected.includes(o));state.page.objects=mode==='front'?[...rest,...selected]:[...selected,...rest];}else {const indices=a.map((o,i)=>ids.includes(o.id)&&!o.locked?i:-1).filter(i=>i>=0);if(mode==='forward')indices.reverse();for(const i of indices){const j=i+(mode==='forward'?1:-1);if(j>=0&&j<a.length&&!ids.includes(a[j].id))[a[i],a[j]]=[a[j],a[i]];}}});}
