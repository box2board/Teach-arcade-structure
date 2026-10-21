window.ComicModel=(()=>{
const layouts={single:{name:'Single panel',count:1,cols:1},strip:{name:'Three-panel strip',count:3,cols:3},two:{name:'Two wide panels',count:2,cols:1},three:{name:'Three stacked panels',count:3,cols:1},four:{name:'Four-panel page',count:4,cols:2},six:{name:'Six-panel page',count:6,cols:2},eight:{name:'Eight-panel page',count:8,cols:2},nine:{name:'Nine-panel grid',count:9,cols:3},twelve:{name:'Twelve-panel grid',count:12,cols:3},feature:{name:'Feature + two panels',count:3,cols:2,spans:[2,1,1]},story:{name:'Feature + four panels',count:5,cols:2,spans:[2,1,1,1,1]}};
const C=window.ComicCatalog,backgrounds=C.backgrounds.map(a=>a.id),characters=C.characters.map(a=>a.id),props=C.props.map(a=>a.id),expressions=C.expressions,poses=C.poses;
const copy=p=>JSON.parse(JSON.stringify(p));
const colors=()=>({primary:'',skin:'',hair:''});const view=()=>({zoom:1,x:0,y:0});
const blankPanel=()=>({background:'blank',paperColor:'#fffaf1',backgroundView:view(),objects:[]});
const fresh=()=>({format:'teach-arcade-comic',version:2,title:'My comic',author:'',layout:'four',panels:Array.from({length:12},blankPanel)});
const hex=v=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
function validate(p){
 if(!p||p.format!=='teach-arcade-comic'||![1,2].includes(p.version)||!Object.hasOwn(layouts,p.layout)||!Array.isArray(p.panels)||!((p.version===1&&p.panels.length===6)||(p.version===2&&p.panels.length===12)))throw new Error('Choose a valid Teach Arcade comic project.');
 if(typeof p.title!=='string'||p.title.length>120||typeof p.author!=='string'||p.author.length>80)throw new Error('Invalid comic title or author.');
 const ids=new Set();const panels=p.panels.map(panel=>{
  if(!panel||!backgrounds.includes(panel.background)||!Array.isArray(panel.objects)||panel.objects.length>80)throw new Error('A panel supports up to 80 objects.');
  const paperColor=panel.paperColor??'#fffaf1',backgroundView=panel.backgroundView??view();if(!hex(paperColor)||!number(backgroundView.zoom,1,3)||!number(backgroundView.x,-600,600)||!number(backgroundView.y,-360,360))throw new Error('Invalid scene settings.');
  return {background:panel.background,paperColor,backgroundView:{zoom:backgroundView.zoom,x:backgroundView.x,y:backgroundView.y},objects:panel.objects.map(o=>{
   if(!o||!['character','speech','thought','caption','prop','drawing'].includes(o.type)||typeof o.id!=='string'||!/^[a-zA-Z0-9-]{1,60}$/.test(o.id)||ids.has(o.id))throw new Error('Invalid comic object.');ids.add(o.id);
   if(!number(o.x,0,580)||!number(o.y,0,340)||!number(o.scale,.15,4)||typeof o.flip!=='boolean'||typeof o.text!=='string'||o.text.length>240||!expressions.includes(o.expression)||!poses.includes(o.pose))throw new Error('Invalid object settings.');
   if(o.type==='character'&&!characters.includes(o.asset)||o.type==='prop'&&!props.includes(o.asset))throw new Error('Unknown comic artwork.');
   const custom=o.colors??colors();for(const key of ['primary','skin','hair'])if(custom[key]!==''&&!hex(custom[key]))throw new Error('Invalid artwork color.');
   const result={id:o.id,type:o.type,asset:typeof o.asset==='string'?o.asset:'',x:o.x,y:o.y,scale:o.scale,flip:o.flip,text:o.text,expression:o.expression,pose:o.pose,colors:{primary:custom.primary,skin:custom.skin,hair:custom.hair}};
   if(o.type==='drawing'){
    if(!['pencil','line','rectangle','ellipse'].includes(o.drawKind)||!hex(o.stroke)||!(o.fill==='none'||hex(o.fill))||!number(o.strokeWidth,1,20)||!Array.isArray(o.points)||o.points.length<2||o.points.length>1500||o.points.some(pt=>!Array.isArray(pt)||pt.length!==2||!number(pt[0],0,600)||!number(pt[1],0,360)))throw new Error('Invalid drawing.');
    Object.assign(result,{drawKind:o.drawKind,stroke:o.stroke,fill:o.fill,strokeWidth:o.strokeWidth,points:copy(o.points)});
   }return result;
  })};
 });while(panels.length<12)panels.push(blankPanel());return {format:p.format,version:2,title:p.title,author:p.author,layout:p.layout,panels};
}
function create(type,asset=''){return {id:'o-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),type,asset,x:type==='character'?190:60,y:type==='character'?120:30,scale:1,flip:false,text:type==='caption'?'Describe what happens…':type==='speech'||type==='thought'?'What should I say?':'',expression:'happy',pose:'stand',colors:colors()};}
return {layouts,backgrounds,characters,props,expressions,poses,copy,fresh,blankPanel,validate,create,hex};
})();
