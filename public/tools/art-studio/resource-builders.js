import {uid,newPage} from './state.js';
import {makeObject} from './objects.js';
export function buildResource(kind,entries,width,height){
 const out=[],sx=width/816,sy=height/1056;
 const put=(type,v)=>out.push(makeObject(type,{...v,x:v.x*sx,y:v.y*sy,w:v.w*sx,h:v.h*sy,...(type==='text'?{fontSize:Math.max(6,v.fontSize*Math.min(sx,sy))}:{})}));
 const text=(name,value,x,y,w,h,size=24,extra={})=>put('text',{name,text:value,x,y,w,h,fontSize:size,fill:'#32274f',...extra});
 const shape=(name,x,y,w,h,fill,groupId)=>put('shape',{name,shape:'rounded',x,y,w,h,fill,stroke:'#cfc5df',strokeWidth:1,radius:12,groupId});
 if(kind==='cards'){
  const rows=Math.ceil(entries.length/2),ch=Math.min(270,880/rows),cw=332;
  text('Cards title','Vocabulary lab',64,40,688,60,36,{bold:true});
  entries.forEach(([word,definition],i)=>{const x=64+(i%2)*356,y=130+Math.floor(i/2)*(ch+12),groupId=uid();shape('Vocabulary card',x,y,cw,ch-8,'#f0ebff',groupId);text('Term',word,x+20,y+18,cw-40,52,28,{bold:true,groupId});text('Definition',definition||'Definition: __________________',x+20,y+80,cw-40,ch-155,20,{groupId});text('Example prompt','Example / sketch:',x+20,y+ch-65,cw-40,42,18,{groupId});});
 }else if(kind==='timeline'){
  text('Timeline title','Moments that matter',64,40,688,65,36,{bold:true});
  const step=840/entries.length;
  put('shape',{name:'Timeline spine',shape:'rectangle',x:108,y:152,w:6,h:840-step/2,fill:'#7957e7'});
  entries.forEach(([date,event],i)=>{const y=140+i*step,groupId=uid();shape('Event card',158,y,590,step-16,'#f4f0fc',groupId);put('shape',{name:'Event marker',shape:'circle',x:93,y:y+19,w:36,h:36,fill:i%2?'#28bda4':'#7957e7',groupId});text('Date',date,180,y+14,540,35,24,{bold:true,groupId});text('Event',event||'Describe what happened and why it matters.',180,y+56,540,step-84,21,{groupId});});
 }else if(kind==='compare'){
  text('Organizer title','Compare & connect',64,40,688,65,36,{bold:true});
  entries.forEach(([heading,prompt],i)=>{const x=64+i*232,groupId=uid();shape('Comparison column',x,140,220,810,['#eee7ff','#e1f6ee','#fff1d8'][i],groupId);text('Column heading',heading,x+16,166,188,100,26,{bold:true,groupId});text('Column prompt',prompt||'Add details and evidence.',x+16,280,188,170,21,{groupId});for(let n=0;n<7;n++)put('shape',{name:'Writing line',shape:'line',x:x+16,y:490+n*56,w:188,h:2,fill:'#afa4bf',groupId});});
 }return out;
}
export class ResourceBuilders {
 constructor(ui){this.ui=ui;}
 run(action){
  if(!action.startsWith('resource:'))return false;
  const ui=this.ui,s=ui.state,[kind,apply]=action.slice(9).split(':');
  const config={cards:['Vocabulary cards','One term | definition per line (2–6 cards).','Evidence | Information used to support a claim\nPerspective | A point of view\nContext | Circumstances surrounding an event\nInference | A conclusion based on evidence'],timeline:['Timeline builder','One date | event per line (2–6 events).','1765 | Stamp Act\n1770 | Boston Massacre\n1773 | Boston Tea Party\n1776 | Declaration of Independence'],compare:['Comparison organizer','Three headings | prompts, one per line.','Topic A | Distinctive features and evidence\nBoth | Shared features and connections\nTopic B | Distinctive features and evidence']}[kind];
  if(!config)return true;
  if(!apply){ui.modal(config[0],`<p>${config[1]} All text, cards, markers and lines remain editable.</p><label class="as-field">Content<textarea data-resource-content rows="8" maxlength="6000">${config[2]}</textarea></label><label class="as-note"><input type="checkbox" data-resource-new-page checked> Create on a new page</label><p>Pieces start grouped. Ungroup a card or event to edit individual parts.</p><button class="as-primary" data-action="resource:${kind}:apply">Build resource</button>`);return true;}
  const lines=ui.root.querySelector('[data-resource-content]').value.split('\n').map(x=>x.trim()).filter(Boolean);
  if((kind==='compare'&&lines.length!==3)||(kind!=='compare'&&(lines.length<2||lines.length>6))){ui.toast(kind==='compare'?'Enter exactly three columns.':'Enter between two and six entries.');return true;}
  const entries=lines.map(line=>{const i=line.indexOf('|');return i<0?[line,'']:[line.slice(0,i).trim(),line.slice(i+1).trim()];});
  if(entries.some(([title,body])=>!title||title.length>100||body.length>350)){ui.toast('Use a heading up to 100 characters and description up to 350.');return true;}
  const fresh=ui.root.querySelector('[data-resource-new-page]').checked;
  if(fresh&&s.project.pages.length>=40){ui.toast('This project has reached its 40-page limit.');return true;}
  const page=fresh?newPage(s.page.width,s.page.height):s.page,objects=buildResource(kind,entries,page.width,page.height);
  if(page.objects.length+objects.length>500){ui.toast('Too many items on this page. Choose a new page.');return true;}
  s.change(()=>{if(fresh){page.name=config[0];s.project.pages.push(page);s.pageId=page.id;}page.objects.push(...objects);s.selected=[];});ui.close();ui.canvas.fit();ui.toast('Resource created. Double-click text to edit; ungroup to adjust individual pieces.');return true;
 }
}
