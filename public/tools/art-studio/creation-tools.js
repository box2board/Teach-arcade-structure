import {uid,clone,bounds} from './state.js';
import {makeObject} from './objects.js';
export function tableObjects(rows,columns,width,height){
 const groupId=uid(),cw=width/columns,ch=height/rows,out=[];
 for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
  out.push(makeObject('shape',{groupId,name:`Cell ${r+1}, ${c+1}`,shape:'rectangle',x:c*cw,y:r*ch,w:cw,h:ch,fill:r===0?'#e9e1ff':'#ffffff',stroke:'#9184ac',strokeWidth:1}));
  out.push(makeObject('text',{groupId,name:`Cell text ${r+1}, ${c+1}`,text:r===0?`Heading ${c+1}`:'Write here',x:c*cw+10,y:r*ch+10,w:cw-20,h:ch-20,fontSize:Math.min(22,ch*.3),bold:r===0,fill:'#32274f'}));
 }return out;
}
export function repeatObjects(objects,rows,columns,gap){
 const b=bounds(objects),out=[];if(!b)return out;
 for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
  if(!r&&!c)continue;const groups={};
  for(const old of objects){const o=clone(old);o.id=uid();o.x+=c*(b.w+gap);o.y+=r*(b.h+gap);o.name+=' copy';if(o.groupId)o.groupId=groups[o.groupId] ||= uid();out.push(o);}
 }return out;
}
export class CreationTools {
 constructor(ui){this.ui=ui;}
 run(action){
  if(!action.startsWith('create:'))return false;
  const ui=this.ui,s=ui.state,cmd=action.slice(7),p=s.page;
  const field=(key,label,value,min,max)=>`<label class="as-field">${label}<input data-create-${key} type="number" value="${value}" min="${min}" max="${max}"></label>`;
  if(cmd==='open'){ui.modal('Creation tools',`<p>Build classroom resources from editable pieces.</p><div class="as-export-options"><button data-action="resource:cards">▦ Vocabulary cards<small>Build cards from your terms and definitions</small></button><button data-action="resource:timeline">↧ Timeline builder<small>Turn dates and events into an editable timeline</small></button><button data-action="resource:compare">▥ Comparison organizer<small>Three columns with prompts and writing lines</small></button><button data-action="create:table">▦ Table builder<small>Custom rows and columns with editable headings and cells</small></button><button data-action="create:note">▣ Sticky note<small>A colorful note with editable text</small></button><button data-action="create:steps">① Numbered steps<small>A three-step instruction strip</small></button><button data-action="create:repeat">⊞ Repeat to grid<small>Repeat selected items for flashcards, labels or answer boxes</small></button></div>`);return true;}
  if(cmd==='table'){ui.modal('Build a table',`<p>Each cell and label remains editable. Ungroup to select individual pieces.</p><div class="as-property-grid">${field('rows','Rows',4,1,10)}${field('columns','Columns',3,1,6)}</div><button data-action="create:table-apply" class="as-primary">Insert table</button>`);return true;}
  if(cmd==='repeat'){
   if(!s.objects.length){ui.toast('Select the items to repeat first.');return true;}
   if(s.objects.some(o=>o.locked)){ui.toast('Unlock selected items first.');return true;}
   ui.modal('Repeat to grid',`<p>The original selection is the first cell. Copies keep their styles and can be edited separately.</p><div class="as-property-grid">${field('rows','Rows',2,1,10)}${field('columns','Columns',2,1,10)}${field('gap','Gap (px)',20,0,200)}</div><button data-action="create:repeat-apply" class="as-primary">Create grid</button>`);return true;
  }
  const read=(key,min,max)=>{const value=Number(ui.root.querySelector(`[data-create-${key}]`)?.value);return Number.isFinite(value)&&value>=min&&value<=max&&Number.isInteger(value)?value:null;};
  let added=[];
  if(cmd==='table-apply'){
   const rows=read('rows',1,10),columns=read('columns',1,6);if(!rows||!columns){ui.toast('Use 1–10 rows and 1–6 columns.');return true;}
   if(p.width*.8/columns<=24||Math.min(p.height*.65,rows*90)/rows<=24){ui.toast('This page is too small for that table. Use fewer rows or columns, or a larger page.');return true;}
   added=tableObjects(rows,columns,p.width*.8,Math.min(p.height*.65,rows*90));for(const o of added){o.x+=p.width*.1;o.y+=p.height*.12;}
  }else if(cmd==='repeat-apply'){
   if(!s.objects.length||s.objects.some(o=>o.locked)){ui.toast('Select unlocked items to repeat.');return true;}
   const rows=read('rows',1,10),columns=read('columns',1,10),gap=read('gap',0,200);if(!rows||!columns||gap===null){ui.toast('Use whole-number rows, columns and gap within the limits.');return true;}
   const b=bounds(s.objects);if(b.x<0||b.y<0||b.x+columns*b.w+(columns-1)*gap>p.width||b.y+rows*b.h+(rows-1)*gap>p.height){ui.toast('Grid would exceed the page. Resize or move the selection, or reduce the grid.');return true;}
   if(p.objects.length+s.objects.length*(rows*columns-1)>500){ui.toast('Grid exceeds the 500-item page limit.');return true;}
   added=repeatObjects(s.objects,rows,columns,gap);
  }else if(cmd==='note'){
   const groupId=uid(),w=Math.min(300,p.width*.6),h=240,x=p.width*.15,y=p.height*.18;
   added=[makeObject('shape',{name:'Sticky note',shape:'rounded',groupId,x,y,w,h,fill:'#fff1a6',shadow:true,radius:10}),makeObject('text',{name:'Note text',groupId,x:x+24,y:y+28,w:w-48,h:h-56,text:'A bright idea…\n\nAdd your note here.',fontSize:24,fill:'#51452b'})];
  }else if(cmd==='steps'){
   const groupId=uid(),w=p.width*.76,x=p.width*.12,y=p.height*.18;for(let i=0;i<3;i++)added.push(makeObject('shape',{groupId,name:`Step ${i+1} circle`,shape:'circle',x,y:y+i*100,w:64,h:64,fill:['#7957e7','#28bda4','#408be7'][i]}),makeObject('text',{groupId,name:`Step ${i+1} number`,text:String(i+1),x:x+12,y:y+i*100+7,w:40,h:48,fontSize:34,bold:true,align:'center',fill:'#ffffff'}),makeObject('text',{groupId,name:`Step ${i+1} instruction`,text:`Step ${i+1}: Add your instructions`,x:x+84,y:y+i*100+12,w:w-84,h:64,fontSize:24,fill:'#32274f'}));
  }else return true;
  if(p.objects.length+added.length>500){ui.toast('This page has reached its 500-item limit.');return true;}
  if(added.length)s.add(added);ui.close();ui.toast(cmd==='repeat-apply'?'Grid created. Undo removes all copies.':'Added editable pieces. Ungroup to edit individual parts.');return true;
 }
}
