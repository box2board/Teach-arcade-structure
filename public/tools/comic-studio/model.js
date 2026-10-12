window.ComicModel=(()=>{
const layouts={single:{name:'Single panel',count:1,cols:1},strip:{name:'Three-panel strip',count:3,cols:3},four:{name:'Four-panel page',count:4,cols:2},six:{name:'Six-panel page',count:6,cols:2}};
const backgrounds=['classroom','park','city','space','blank'],characters=['alex','maya','sam','jules'],props=['book','tree','desk','star'];
const copy=p=>JSON.parse(JSON.stringify(p));
const fresh=()=>({format:'teach-arcade-comic',version:1,title:'My comic',author:'',layout:'four',panels:Array.from({length:6},(_,i)=>({background:i===0?'classroom':'blank',objects:[]}))});
function validate(p){
 if(!p||p.format!=='teach-arcade-comic'||p.version!==1||!Object.hasOwn(layouts,p.layout)||!Array.isArray(p.panels)||p.panels.length!==6)throw new Error('Choose a valid Teach Arcade comic project.');
 if(typeof p.title!=='string'||p.title.length>120||typeof p.author!=='string'||p.author.length>80)throw new Error('Invalid comic title or author.');
 const ids=new Set();const panels=p.panels.map(panel=>{
  if(!panel||!backgrounds.includes(panel.background)||!Array.isArray(panel.objects)||panel.objects.length>40)throw new Error('A panel supports up to 40 objects.');
  return {background:panel.background,objects:panel.objects.map(o=>{
   if(!o||!['character','speech','thought','caption','prop'].includes(o.type)||typeof o.id!=='string'||!/^[a-zA-Z0-9-]{1,60}$/.test(o.id)||ids.has(o.id))throw new Error('Invalid comic object.');ids.add(o.id);
   if(!Number.isFinite(o.x)||!Number.isFinite(o.y)||o.x<0||o.x>580||o.y<0||o.y>340||!Number.isFinite(o.scale)||o.scale<.5||o.scale>2||typeof o.flip!=='boolean'||typeof o.text!=='string'||o.text.length>240||!['happy','neutral','surprised'].includes(o.expression)||!['stand','wave'].includes(o.pose))throw new Error('Invalid object settings.');
   if(o.type==='character'&&!characters.includes(o.asset)||o.type==='prop'&&!props.includes(o.asset))throw new Error('Unknown comic artwork.');
   return {id:o.id,type:o.type,asset:typeof o.asset==='string'?o.asset:'',x:o.x,y:o.y,scale:o.scale,flip:o.flip,text:o.text,expression:o.expression,pose:o.pose};
  })};
 });return {format:p.format,version:1,title:p.title,author:p.author,layout:p.layout,panels};
}
function create(type,asset=''){return {id:'o-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),type,asset,x:type==='character'?190:60,y:type==='character'?120:30,scale:1,flip:false,text:type==='caption'?'Describe what happens…':type==='speech'||type==='thought'?'What should I say?':'',expression:'happy',pose:'stand'};}
return {layouts,backgrounds,characters,props,copy,fresh,validate,create};
})();
