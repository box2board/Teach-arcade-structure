export const uid = () => 'a' + Math.random().toString(36).slice(2, 11);
export const clone = v => typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
export function newPage(width=816,height=1056) {return {id:uid(),name:'Untitled page',width,height,background:'#ffffff',objects:[]};}
export function newProject(){return {schemaVersion:1,id:uid(),name:'My classroom creation',updatedAt:Date.now(),pages:[newPage()]};}
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
 select(ids){this.selected=[...new Set(ids.flatMap(id=>{const o=this.page.objects.find(x=>x.id===id);return o?.groupId?this.page.objects.filter(x=>x.groupId===o.groupId).map(x=>x.id):[id];}))];this.emit();}
 add(objects){this.change(()=>this.page.objects.push(...objects));this.select(objects.map(o=>o.id));}
 patch(values){this.change(()=>this.objects.filter(o=>!o.locked).forEach(o=>Object.assign(o,values)));}
 remove(){this.change(()=>{this.page.objects=this.page.objects.filter(o=>!this.selected.includes(o.id)||o.locked);});this.selected=[];this.emit();}
 duplicate(){const groupMap={};const copies=clone(this.objects).filter(o=>!o.locked).map(o=>{o.id=uid();o.x+=24;o.y+=24;o.name+=' copy';if(o.groupId)o.groupId=groupMap[o.groupId] ||= uid();return o;});this.add(copies);}
 group(){if(this.objects.some(o=>o.locked))return;this.patch({groupId:uid()});}
 ungroup(){if(this.objects.some(o=>o.locked))return;this.patch({groupId:null});}
 load(project){this.project=clone(project);this.pageId=project.pages[0].id;this.selected=[];this.past=[];this.future=[];this.baseline=null;this.emit();}
}
export const presets={'Letter':[816,1056],'A4':[794,1123],'Presentation 16:9':[1280,720],'Square':[1000,1000],'Poster':[1200,1600],'Worksheet':[816,1056],'Certificate':[1120,792],'Classroom Sign':[1200,600],'Social Graphic':[1080,1080]};
export function bounds(objects){if(!objects.length)return null;return {x:Math.min(...objects.map(o=>o.x)),y:Math.min(...objects.map(o=>o.y)),w:Math.max(...objects.map(o=>o.x+o.w))-Math.min(...objects.map(o=>o.x)),h:Math.max(...objects.map(o=>o.y+o.h))-Math.min(...objects.map(o=>o.y))};}
export function reorder(state,ids,mode){state.change(()=>{const a=state.page.objects;if(mode==='front'||mode==='back'){const selected=a.filter(o=>ids.includes(o.id)&&!o.locked),rest=a.filter(o=>!selected.includes(o));state.page.objects=mode==='front'?[...rest,...selected]:[...selected,...rest];}else {const indices=a.map((o,i)=>ids.includes(o.id)&&!o.locked?i:-1).filter(i=>i>=0);if(mode==='forward')indices.reverse();for(const i of indices){const j=i+(mode==='forward'?1:-1);if(j>=0&&j<a.length&&!ids.includes(a[j].id))[a[i],a[j]]=[a[j],a[i]];}}});}
