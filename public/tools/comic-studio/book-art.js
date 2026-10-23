(()=>{
const A=window.ComicArt,M=window.ComicModel;
function lines(value,max){const output=[];for(const paragraph of value.split('\n')){let row='';for(const word of paragraph.split(/\s+/)){for(let j=0;j<word.length||j===0;j+=max){const part=word.slice(j,j+max);if((row+' '+part).trim().length>max){output.push(row);row='';}row+=(row?' ':'')+part;}}output.push(row);}return output;}
function cover(p){const w=1200,h=1560,c=p.cover,t=p.typography||{},color=c.color,ink=t.color||'#243148',font=M.fonts[t.font||'sans'].family,align=t.align||'left',anchor=align==='center'?'middle':align==='right'?'end':'start',x=align==='center'?600:align==='right'?1105:95;
const text=(value,y,size,maxRows=5)=>{if(!value)return '';let rows=lines(value,Math.max(4,Math.floor(1010/(size*.68))));while(rows.length>maxRows&&size>18){size--;rows=lines(value,Math.floor(1010/(size*.68)));}return '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-family="'+font+'" font-size="'+size+'" fill="'+ink+'">'+rows.map((line,i)=>'<tspan x="'+x+'" dy="'+(i?size*1.2:0)+'">'+A.escape(line)+'</tspan>').join('')+'</text>';};
const title=t.showTitle===false?'':t.heading||p.title||'My comic',size=Math.min(t.size? t.size*1.5:54,90),titleRows=lines(title,Math.floor(1010/(size*.68))).length,titleBottom=150+Math.min(titleRows,5)*size*1.2,author=t.showAuthor===false?'':p.author;
const art=(x,y,width,height,fill=false)=>'<svg x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid '+(fill?'slice':'meet')+'" overflow="hidden">'+A.scene(p.panels[0],'',p.assets)+'</svg>'+(fill?'':'<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" fill="none" stroke="#243148" stroke-width="5"/>');
let body='<rect width="1200" height="1560" fill="'+p.panels[0].paperColor+'"/>';
if(c.style==='fullpage'){
 body+=art(0,0,1200,1560,true);if(title)body+='<rect x="55" y="55" width="1090" height="'+Math.max(160,titleBottom-15)+'" rx="18" fill="#ffffff" fill-opacity="1"/>'+text(title,150,size);if(c.subtitle||author)body+='<rect x="55" y="1235" width="1090" height="270" rx="18" fill="#ffffff" fill-opacity="1"/>'+text(c.subtitle,1300,27,3)+text(author,1460,26,2);
}else{
 body='<rect width="1200" height="1560" fill="#fffaf1"/>';
 if(c.style==='banner')body+='<rect x="55" y="55" width="1090" height="1450" fill="'+color+'"/><rect x="75" y="75" width="1050" height="'+Math.max(240,titleBottom)+'" fill="#fffaf1"/>';
 else body+='<rect x="65" y="55" width="'+(c.style==='minimal'?115:1070)+'" height="10" fill="'+color+'"/>';
 body+=text(title,155,size);const top=Math.max(c.style==='minimal'?400:350,titleBottom+35),artHeight=Math.min(642,1190-top);body+=art(65,top,1070,artHeight);if(c.style==='banner')body+='<rect x="75" y="1230" width="1050" height="255" fill="#fffaf1"/>';body+=text(c.subtitle,1280,27,4)+text(author,1450,26,2);
}
return {width:w,height:h,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+body+'</svg>'};}
function page(p){return p.kind==='cover'?cover(p):A.page(p);}
const layoutCache=new Map();function layoutPreview(layout){if(!layoutCache.has(layout)){const p={...M.freshPage(),title:'',author:'',layout};layoutCache.set(layout,A.page(p).svg);}return layoutCache.get(layout);}
function coverPreview(style,color='#6546d7'){const page=M.freshPage('cover',style);page.cover.color=color;return cover({...page,title:'Your title',author:'Created by you',pageNumber:1,totalPages:1,assets:{}}).svg;}
window.ComicArt={...A,page,cover,layoutPreview,coverPreview};
})();
