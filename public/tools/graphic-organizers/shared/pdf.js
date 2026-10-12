(() => {
'use strict';
let fontPromise;
async function font(){
 if(!fontPromise)fontPromise=fetch('/tools/graphic-organizers/shared/fonts/DejaVuSans.ttf').then(r=>{if(!r.ok)throw new Error('PDF font could not load. Please try again.');return r.arrayBuffer();}).then(buffer=>{const bytes=new Uint8Array(buffer);let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}).catch(e=>{fontPromise=null;throw e;});
 return fontPromise;
}
function build(project,blank,fontData){
 const doc=new window.jspdf.jsPDF({unit:'pt',format:'letter',compress:true});
 doc.addFileToVFS('DejaVuSans.ttf',fontData);doc.addFont('DejaVuSans.ttf','Organizer','normal');doc.setFont('Organizer');
 const spec=window.GOModel.templates[project.template],W=532,x0=40,bottom=744;
 const colors={blue:[36,95,210],green:[25,114,86],purple:[117,68,181],slate:[69,84,106]},accent=colors[project.accent];
 const bodySize=project.fontSize*.75,lineHeight=bodySize*1.45;
 let y=40;
 const split=(value,width,size=bodySize)=>{doc.setFontSize(size);return doc.splitTextToSize(String(value||''),width);};
 function text(lines,x,y,size,color=[25,35,50]){doc.setTextColor(...color);doc.setFontSize(size);doc.text(lines,x,y,{lineHeightFactor:1.45});}
 function next(){doc.addPage();y=40;text(spec.name+' · continued',40,y+10,11,accent);y+=34;}
 text('TEACH ARCADE / GRAPHIC ORGANIZER STUDIO',40,y,8,accent);y+=25;text(spec.name,40,y,20);y+=25;
 const title=split(project.title||'Topic: __________________________',W,13);text(title,40,y,13);y+=title.length*18.85+12;
 const meta=[['Name',project.name],['Class / period',project.className],['Date',project.date]];
 for(let i=0;i<3;i++){const value=blank?'________________':meta[i][1]||'________________';const lines=split(meta[i][0]+': '+value,166,9);text(lines,40+i*181,y,9);if(i===0)var metaHeight=0;metaHeight=Math.max(metaHeight,lines.length*13.05);}y+=metaHeight+20;
 if(project.subject && ['frayer-model','character-map','vocabulary-organizer'].includes(project.template)){const lines=split((project.template==='character-map'?'Character: ':'Term: ')+project.subject,W,12);text(lines,40,y,12,accent);y+=lines.length*17.4+18;}
 function row(items,minimum=100){
  const gap=12,width=(W-gap*(items.length-1))/items.length;
  const lines=items.map(item=>({heading:split(item.label,width-20,10),notes:blank?[]:split(item.text,width-20)}));
  let remaining=true,continued=false;
  while(remaining){
   const headingHeight=Math.max(...lines.map(v=>v.heading.length))*14.5+(continued?12:0);
   if(y+headingHeight+55>bottom)next();
   const room=bottom-y-headingHeight-30,maxLines=Math.max(1,Math.floor(room/lineHeight));
   const chunks=lines.map(v=>v.notes.splice(0,maxLines));
   const count=Math.max(0,...chunks.map(v=>v.length));
   const height=Math.max(Math.min(minimum,bottom-y),headingHeight+30+count*lineHeight);
   for(let i=0;i<items.length;i++){
    const x=x0+i*(width+gap);doc.setDrawColor(130,145,165);doc.setLineWidth(.6);doc.rect(x,y,width,height);
    text(lines[i].heading,x+10,y+15,10,accent);
    if(continued)text('(continued)',x+10,y+headingHeight+5,7,[95,105,120]);
    text(chunks[i],x+10,y+headingHeight+20,bodySize);
   }
   y+=height+14;remaining=lines.some(v=>v.notes.length>0);if(remaining){next();continued=true;}
  }
 }
 if(spec.layout==='venn'){
  if(y+145>bottom)next();doc.setDrawColor(...accent);doc.setLineWidth(1.2);doc.ellipse(238,y+58,95,56);doc.ellipse(374,y+58,95,56);
  text('A',190,y+62,10,accent);text('Both',292,y+62,10,accent);text('B',417,y+62,10,accent);y+=134;
 }
 if(spec.layout==='plot'){
  if(y+75>bottom)next();doc.setDrawColor(...accent);doc.setLineWidth(1.5);doc.lines([[100,0],[166,-45],[148,45],[110,0]],40,y+45);y+=75;
 }
 const cards=project.cards;
 if(spec.layout==='table'){for(const card of cards)row(card.cells.map((value,i)=>({label:project.headers[i],text:value})),blank?105:85);}
 else if(spec.layout==='columns'||spec.layout==='venn'){for(let i=0;i<cards.length;i+=3)row(cards.slice(i,i+3),blank?350:180);}
 else if(spec.layout==='grid'){for(let i=0;i<cards.length;i+=2)row(cards.slice(i,i+2),blank?200:140);}
 else if(spec.layout==='branch'){row([cards[0]],100);for(let i=1;i<cards.length;i+=2)row(cards.slice(i,i+2),120);}
 else for(const card of cards)row([card],spec.layout==='plot'?85:blank?110:100);
 const count=doc.getNumberOfPages();for(let i=1;i<=count;i++){doc.setPage(i);text('Teach Arcade · teacharcade.com',40,773,8,[90,100,115]);text(i+' / '+count,538,773,8,[90,100,115]);}
 doc.setProperties({title:project.title||spec.name,subject:blank?'Blank classroom worksheet':'Completed graphic organizer',creator:'Teach Arcade'});
 return doc;
}
async function download(project,blank=false){
 const doc=build(project,blank,await font());
 const name=(project.title||window.GOModel.templates[project.template].name).replace(/[^a-z0-9_-]/gi,'-').slice(0,70)+(blank?'-blank':'')+'.pdf';doc.save(name);
}
window.GOPdf={build,download};
})();
