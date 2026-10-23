(()=>{
const M=window.ComicModel,id=(prefix='page')=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const coverStyles=['classic','banner','minimal','fullpage'];
function pageText(input={}){const t={heading:'',font:'sans',size:36,align:'left',color:'#243148',showTitle:true,showAuthor:true,...input};if(typeof t.heading!=='string'||t.heading.length>120||!Object.hasOwn(M.fonts,t.font)||!Number.isFinite(t.size)||t.size<24||t.size>72||!['left','center','right'].includes(t.align)||!M.hex(t.color)||typeof t.showTitle!=='boolean'||typeof t.showAuthor!=='boolean')throw new Error('Invalid page text settings.');return t;}
function freshPage(kind='comic',style='classic'){return {id:id(),kind,label:kind==='cover'?'Cover':'Story page',layout:kind==='cover'?'single':'four',typography:pageText(),cover:{style,subtitle:'',color:'#6546d7'},panels:Array.from({length:12},M.blankPanel)};}
function freshBook(){return {format:'teach-arcade-comic',version:3,id:id('comic'),title:'My comic',author:'',updatedAt:new Date().toISOString(),pages:[freshPage()],assets:{}};}
function validateBook(input){
 if(!input||input.format!=='teach-arcade-comic')throw new Error('Choose a Teach Arcade comic project.');
 if(input.version!==3){const legacy=M.validate(input),p=freshBook();p.title=legacy.title;p.author=legacy.author;p.pages[0].layout=legacy.layout;p.pages[0].panels=legacy.panels;return p;}
 if(typeof input.id!=='string'||!/^comic-[a-zA-Z0-9-]{1,70}$/.test(input.id)||typeof input.title!=='string'||input.title.length>120||typeof input.author!=='string'||input.author.length>80||!Array.isArray(input.pages)||input.pages.length<1||input.pages.length>32)throw new Error('A comic supports 1–32 pages, including covers.');
 const assets={};if(!input.assets||typeof input.assets!=='object'||Array.isArray(input.assets)||Object.keys(input.assets).length>64)throw new Error('Invalid imported image library.');let bytes=0;
 for(const [key,a] of Object.entries(input.assets)){
  if(!/^img-[a-zA-Z0-9-]{1,70}$/.test(key)||!a||typeof a.src!=='string'||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(a.src)||a.src.length>2*1024*1024||!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<1||a.height<1||a.width>2000||a.height>2000||typeof a.name!=='string'||a.name.length>120)throw new Error('Imported images must be embedded PNG, JPEG or WebP artwork.');
  if(!(a.src.startsWith('data:image/png;base64,iVBORw0KGgo')||a.src.startsWith('data:image/jpeg;base64,/9j/')||a.src.startsWith('data:image/webp;base64,UklGR')))throw new Error('Imported image bytes do not match a supported raster format.');
  bytes+=a.src.length;if(bytes>16*1024*1024)throw new Error('This project has too much imported image data.');assets[key]={src:a.src,width:a.width,height:a.height,name:a.name};
 }
 const pageIds=new Set(),objectIds=new Set();const pages=input.pages.map(p=>{
  if(!p||!/^page-[a-zA-Z0-9-]{1,70}$/.test(p.id)||pageIds.has(p.id)||!['comic','cover'].includes(p.kind)||typeof p.label!=='string'||p.label.length>80)throw new Error('Invalid comic page.');pageIds.add(p.id);
  const validated=M.validate({format:input.format,version:2,title:'',author:'',layout:p.layout,panels:p.panels},assets);
  const cover=p.cover??{style:'classic',subtitle:'',color:'#6546d7'};if(!coverStyles.includes(cover.style)||typeof cover.subtitle!=='string'||cover.subtitle.length>160||!M.hex(cover.color))throw new Error('Invalid cover settings.');
  for(const panel of validated.panels)for(const o of panel.objects){if(objectIds.has(o.id))throw new Error('Object IDs must be unique across pages.');objectIds.add(o.id);}
  return {id:p.id,kind:p.kind,label:p.label,layout:p.kind==='cover'?'single':validated.layout,typography:pageText(p.typography),cover:{style:cover.style,subtitle:cover.subtitle,color:cover.color},panels:validated.panels};
 });
 return {format:input.format,version:3,id:input.id,title:input.title,author:input.author,updatedAt:typeof input.updatedAt==='string'&&Number.isFinite(Date.parse(input.updatedAt))?input.updatedAt:new Date().toISOString(),pages,assets};
}
function snapshot(book){const {assets,...rest}=book;return {...M.copy(rest),assets};}
function pageView(book,i){return {...book.pages[i],title:book.title,author:book.author,assets:book.assets,pageNumber:i+1,totalPages:book.pages.length};}
window.ComicModel={...M,id,coverStyles,freshPage,freshBook,validateBook,snapshot,pageView};
})();
