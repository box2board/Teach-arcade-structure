(()=>{
const A=window.ComicArt,M=window.ComicModel;
const text=(value,x,y,size,color='#243148',max=38)=>A.escape(value).length?'<text x="'+x+'" y="'+y+'" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+color+'">'+lines(value,max).map((line,i)=>'<tspan x="'+x+'" dy="'+(i?size*1.2:0)+'">'+A.escape(line)+'</tspan>').join('')+'</text>':'';
function lines(value,max){const output=[];for(const paragraph of value.split('\n')){let row='';for(const word of paragraph.split(/\s+/)){for(let j=0;j<word.length||j===0;j+=max){const part=word.slice(j,j+max);if((row+' '+part).trim().length>max){output.push(row);row='';}row+=(row?' ':'')+part;}}output.push(row);}return output;}
function cover(p){const w=1200,h=1560,c=p.cover,color=c.color,ink='#243148',brightness=(parseInt(color.slice(1,3),16)*299+parseInt(color.slice(3,5),16)*587+parseInt(color.slice(5,7),16)*114)/1000,bannerInk=brightness>155?ink:'#ffffff',accentInk=brightness>170?ink:color;let body='<rect width="1200" height="1560" fill="#fffaf1"/>';
const art=(x,y,width,height)=>'<svg x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet" overflow="hidden">'+A.scene(p.panels[0],'',p.assets)+'</svg><rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" fill="none" stroke="'+ink+'" stroke-width="5"/>';
const titleRows=lines(p.title||'My comic',c.style==='minimal'?28:24).length,titleSize=c.style==='minimal'?52:62;
if(c.style==='classic'){
 body+='<rect x="0" y="0" width="1200" height="24" fill="'+color+'"/>'+text('TEACH ARCADE · COMIC STUDIO',65,88,19,color,80)+text(p.title||'My comic',65,190,titleSize,ink,24);
 const top=Math.max(370,210+titleRows*75);body+=art(65,top,1070,Math.min(642,Math.max(460,1220-top)))+text(c.subtitle,65,1300,27,accentInk,65)+text(p.author,65,1450,26,ink,65);
}else if(c.style==='banner'){
 body+='<rect x="55" y="55" width="1090" height="1450" fill="'+color+'"/>'+text(p.title||'My comic',95,170,titleSize,bannerInk,24)+art(55,Math.max(365,140+titleRows*75),1090,654)+'<rect x="55" y="1280" width="1090" height="225" fill="#fffaf1"/>'+text(c.subtitle,95,1350,27,accentInk,62)+text(p.author,95,1455,26,ink,65);
}else{
 body+='<rect x="65" y="70" width="115" height="10" fill="'+color+'"/>'+text(p.title||'My comic',65,170,titleSize,ink,28);
 const top=Math.max(400,190+titleRows*65);body+=art(65,top,1070,Math.min(642,Math.max(350,1150-top)))+text(c.subtitle,65,1260,27,accentInk,65)+text(p.author,65,1440,26,ink,65);
}body+=text('Created with Teach Arcade · '+p.pageNumber+' / '+p.totalPages,65,1530,15,'#637086',90);return {width:w,height:h,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+body+'</svg>'};}
function page(p){return p.kind==='cover'?cover(p):A.page(p);}
const layoutCache=new Map();function layoutPreview(layout){if(!layoutCache.has(layout)){const p={...M.freshPage(),title:'',author:'',layout};layoutCache.set(layout,A.page(p).svg);}return layoutCache.get(layout);}
function coverPreview(style,color='#6546d7'){const page=M.freshPage('cover',style);page.cover.color=color;return cover({...page,title:'Your title',author:'Created by you',pageNumber:1,totalPages:1,assets:{}}).svg;}
window.ComicArt={...A,page,cover,layoutPreview,coverPreview};
})();
