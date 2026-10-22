window.ComicArt=(()=>{
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const ink='#243148';
function background(kind){
 const image=window.ComicCatalog.backgrounds.find(a=>a.id===kind)?.image;if(image)return '<image href="'+image+'" width="600" height="360" preserveAspectRatio="xMidYMid slice"/>';
 const expanded=window.ComicLibraryArt.background(kind);if(expanded)return expanded;
 const base='<rect width="600" height="360" fill="#fbf4e5"/>';
 if(kind==='blank')return base;
 if(kind==='classroom')return base+'<rect y="252" width="600" height="108" fill="#d7b48c"/><path d="M0 286H600M0 330H600M90 252L30 360M230 252L210 360M410 252L470 360" stroke="#c39c73" stroke-width="2"/><rect x="45" y="48" width="290" height="150" rx="5" fill="#314e4a" stroke="#a07751" stroke-width="12"/><path d="M77 95h180M77 120h120M77 145h150" stroke="#e9f0d6" stroke-width="5" stroke-linecap="round"/><rect x="402" y="35" width="150" height="145" rx="4" fill="#a7ddeb" stroke="'+ink+'" stroke-width="5"/><path d="M477 35v145M402 106h150" stroke="#fff8e9" stroke-width="10"/><rect x="385" y="211" width="184" height="18" rx="4" fill="#87563b"/><path d="M399 229v58M550 229v58" stroke="'+ink+'" stroke-width="10"/>';
 if(kind==='park')return '<rect width="600" height="360" fill="#bfe8f5"/><circle cx="485" cy="57" r="32" fill="#ffdc77"/><path d="M0 230Q100 190 210 235T600 209V360H0" fill="#87bf85"/><path d="M252 255Q220 305 140 360H405Q360 290 342 255" fill="#ecce95"/><path d="M72 185v115M530 165v140" stroke="#80604a" stroke-width="19"/><g fill="#518773" stroke="'+ink+'" stroke-width="3"><circle cx="70" cy="151" r="53"/><circle cx="532" cy="134" r="61"/></g><g fill="#fff" opacity=".8"><ellipse cx="233" cy="63" rx="59" ry="17"/><ellipse cx="314" cy="104" rx="44" ry="13"/></g>';
 if(kind==='city')return '<rect width="600" height="360" fill="#c3dae7"/><g stroke="'+ink+'" stroke-width="3"><path d="M0 230V77H119V230M124 230V35H285V230M290 230V109H412V230M419 230V55H600V230" fill="#e8b49b"/><path d="M143 56h45v41h-45zm70 0h45v41h-45zm-70 66h45v41h-45zm70 0h45v41h-45zM20 105h35v45H20zm55 0h28v45H75zM444 90h48v55h-48zm70 0h47v55h-47z" fill="#789caf"/></g><rect y="231" width="600" height="40" fill="#d9d4c8"/><rect y="271" width="600" height="89" fill="#627080"/><path d="M0 313h600" stroke="#f9eec5" stroke-width="6" stroke-dasharray="45 30"/>';
 if(kind==='space')return '<rect width="600" height="360" fill="#24324e"/><g fill="#fff2bc"><circle cx="60" cy="55" r="3"/><circle cx="264" cy="35" r="3"/><circle cx="344" cy="155" r="4"/><circle cx="535" cy="205" r="3"/><path d="M170 122v16m-8-8h16M520 45v16m-8-8h16" stroke="#fff2bc" stroke-width="2"/></g><ellipse cx="453" cy="86" rx="80" ry="17" fill="none" stroke="#efaa91" stroke-width="8" transform="rotate(-20 453 86)"/><circle cx="453" cy="86" r="39" fill="#bca3ce"/><path d="M0 300Q300 215 600 300V360H0" fill="#9a9ab1"/><ellipse cx="82" cy="321" rx="44" ry="12" fill="#7d7e97"/><ellipse cx="508" cy="311" rx="29" ry="8" fill="#7d7e97"/>';
 return base;
}
function character(asset,expression,pose,colors={}){return window.ComicLibraryArt.character(asset,expression,pose,colors);}
function prop(asset){
 const expanded=window.ComicLibraryArt.prop(asset);if(expanded)return expanded;
 const forms={book:'<path d="M5 12q27-13 53 2 26-15 53-2v72q-27-13-53 0-26-13-53 0z" fill="#f4dcad"/><path d="M58 14v70"/><path d="M15 29h30M15 43h30M70 29h30M70 43h30" stroke="#ac855b"/>',tree:'<path d="M49 70v68h20V70" fill="#96704c"/><path d="M10 95L60 3l50 92z" fill="#679881"/>',desk:'<rect x="4" y="30" width="112" height="15" rx="4" fill="#d09967"/><path d="M15 45v70M105 45v70" stroke-width="9"/>',star:'<path d="M60 3L77 43l43 3-33 28 10 42-37-23-37 23 10-42L0 46l43-3z" fill="#f4cb67"/>'};return '<g stroke="'+ink+'" stroke-width="3" stroke-linejoin="round">'+(forms[asset]||forms.book)+'</g>';
}
function wrap(text,max=24){const result=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if((line+' '+word).trim().length>max&&line){result.push(line);line='';}if(word.length>max){if(line){result.push(line);line='';}for(let i=0;i<word.length;i+=max)result.push(word.slice(i,i+max));}else line+=(line?' ':'')+word;}result.push(line);}return result;}
function textGeometry(o){
 const box=o.box||{width:240,height:0,fontSize:16,tail:'left',tailX:43,tailY:24},font=box.fontSize;
 // Conservative wrapping leaves room for wide glyphs across browser fonts.
 const lines=wrap(o.text,Math.max(3,Math.floor((box.width-32)/(font*.64)))),lineHeight=font*1.25;
 const natural=Math.max(o.type==='caption'?50:80,lines.length*lineHeight+30);
 return {...box,height:box.height||natural,lines,lineHeight,overflow:box.height>0&&natural>box.height};
}
function object(o,selected=false,assets={}){
 let drawing,width=120,height=225;
 if(o.type==='character'){drawing=character(o.asset,o.expression,o.pose,o.colors);if(o.colors?.primary){for(const color of ({cat:['#d8a06c','#e2b487'],dog:['#c2a17d','#d4b48c'],robot:['#82a8b1']})[o.asset]||[])drawing=drawing.split(color).join(o.colors.primary);}}
 else if(o.type==='prop'){drawing=prop(o.asset);height=140;if(o.colors?.primary)drawing=drawing.replace(/fill="(?!none|#243148)[^"]+"/, 'fill="'+o.colors.primary+'"');}
 else if(o.type==='image'){width=o.imageWidth;height=o.imageHeight;drawing=assets[o.asset]?'<image href="'+escape(assets[o.asset].src)+'" width="'+width+'" height="'+height+'" preserveAspectRatio="xMidYMid meet"/>':'<rect width="'+width+'" height="'+height+'" fill="#e2ddeb"/>'; }
 else if(o.type==='drawing'){
  const xs=o.points.map(p=>p[0]),ys=o.points.map(p=>p[1]);width=Math.max(5,...xs);height=Math.max(5,...ys);
  const start=o.points[0],end=o.points[o.points.length-1],x=Math.min(start[0],end[0]),y=Math.min(start[1],end[1]),w=Math.max(1,Math.abs(end[0]-start[0])),h=Math.max(1,Math.abs(end[1]-start[1]));
  const dash=o.dash==='dashed'?' stroke-dasharray="12 8"':o.dash==='dotted'?' stroke-dasharray="2 8"':'';
  const style=' fill="'+o.fill+'" stroke="'+o.stroke+'" stroke-width="'+o.strokeWidth+'" opacity="'+(o.opacity??1)+'" stroke-linecap="round" stroke-linejoin="round"'+dash;
  if(o.drawKind==='rectangle')drawing='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"'+style+'/>';
  else if(o.drawKind==='ellipse')drawing='<ellipse cx="'+(x+w/2)+'" cy="'+(y+h/2)+'" rx="'+w/2+'" ry="'+h/2+'"'+style+'/>';
  else if(['triangle','diamond','star'].includes(o.drawKind)){
   const vertices=o.drawKind==='triangle'?[[x+w/2,y],[x+w,y+h],[x,y+h]]:o.drawKind==='diamond'?[[x+w/2,y],[x+w,y+h/2],[x+w/2,y+h],[x,y+h/2]]:Array.from({length:10},(_,i)=>{const angle=-Math.PI/2+i*Math.PI/5,r=i%2?.44:1;return [x+w/2+Math.cos(angle)*w/2*r,y+h/2+Math.sin(angle)*h/2*r];});drawing='<polygon points="'+vertices.map(p=>p.join(',')).join(' ')+'"'+style+'/>';
  }else {
   drawing='<polyline points="'+o.points.map(p=>p.join(',')).join(' ')+'"'+style+'/>';
   if(o.drawKind==='arrow'){const angle=Math.atan2(end[1]-start[1],end[0]-start[0]),length=Math.max(12,o.strokeWidth*3);drawing+='<polyline points="'+[[end[0]-length*Math.cos(angle-.5),end[1]-length*Math.sin(angle-.5)],end,[end[0]-length*Math.cos(angle+.5),end[1]-length*Math.sin(angle+.5)]].map(p=>p.join(',')).join(' ')+'"'+style+'/>';}
  }
 }
 else {
  const t=textGeometry(o);width=t.width;height=t.height;const fill=o.colors?.primary||(o.type==='caption'?'#ffe36e':'#fffdf8');
  const tailX=t.tail==='right'?width-43:t.tail==='custom'?t.tailX:43,tailY=height+(t.tail==='custom'?t.tailY:24);
  drawing='<rect width="'+width+'" height="'+height+'" rx="'+(o.type==='caption'?3:24)+'" fill="'+fill+'" stroke="'+ink+'" stroke-width="3"/>';
  if(o.type!=='caption'&&t.tail!=='none'){
   const attach=Math.max(22,Math.min(width-22,tailX));
   drawing+=o.type==='thought'?'<circle cx="'+((attach+tailX)/2)+'" cy="'+(height+(tailY-height)*.4)+'" r="8" fill="'+fill+'" stroke="'+ink+'" stroke-width="2"/><circle cx="'+tailX+'" cy="'+tailY+'" r="4" fill="'+fill+'" stroke="'+ink+'" stroke-width="2"/>':'<path d="M'+(attach-12)+' '+(height-2)+'L'+tailX+' '+tailY+'L'+(attach+12)+' '+(height-2)+'" fill="'+fill+'" stroke="'+ink+'" stroke-width="3"/>';
  }
  const visible=t.lines.slice(0,Math.max(1,Math.floor((height-24)/t.lineHeight)));
  drawing+='<text x="16" y="'+(16+t.fontSize)+'" font-family="Arial,sans-serif" font-size="'+t.fontSize+'" fill="'+ink+'">'+visible.map((line,i)=>'<tspan x="16" dy="'+(i?t.lineHeight:0)+'">'+escape(line)+'</tspan>').join('')+'</text>';
  if(selected&&o.type!=='caption'&&t.tail!=='none')drawing+='<circle data-tail="true" cx="'+tailX+'" cy="'+tailY+'" r="10" fill="#f97316" stroke="white" stroke-width="2"/>';

 }
 const handleX=Math.max(0,Math.min(width-7,(592-o.x)/o.scale-18)),handleY=Math.max(0,Math.min(height-7,(352-o.y)/o.scale-18));
 const selection=selected?'<rect x="-6" y="-6" width="'+(width+12)+'" height="'+(height+12)+'" rx="5" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/><rect data-resize="true" x="'+handleX+'" y="'+handleY+'" width="24" height="24" rx="5" fill="#2563eb" stroke="white" stroke-width="2"/>':'';
 return '<g data-object="'+escape(o.id)+'" transform="translate('+o.x+' '+o.y+') scale('+o.scale+')">'+(o.flip?'<g transform="translate('+width+' 0) scale(-1 1)">'+drawing+'</g>':drawing)+selection+'</g>';
}
function dimensions(o){if(o.type==='image')return {width:o.imageWidth,height:o.imageHeight};if(o.type==='character')return {width:120,height:225};if(o.type==='prop')return {width:120,height:140};if(o.type==='drawing')return {width:Math.max(5,...o.points.map(p=>p[0])),height:Math.max(5,...o.points.map(p=>p[1]))};const t=textGeometry(o);return {width:t.width,height:t.height};}
function scene(panel,selected='',assets={}){
 const v=panel.backgroundView||{zoom:1,x:0,y:0},color=panel.paperColor||'#fffaf1';
 const bg=panel.background==='blank'?'<rect width="600" height="360" fill="'+color+'"/>':background(panel.background);
 return '<rect width="600" height="360" fill="'+color+'"/><g transform="translate('+(300*(1-v.zoom)+v.x)+' '+(180*(1-v.zoom)+v.y)+') scale('+v.zoom+')">'+bg+'</g>'+panel.objects.map(o=>object(o,o.id===selected,assets)).join('');
}
function page(p){
 const layout=window.ComicModel.layouts[p.layout],gap=20,w=1200,cell=(w-80-gap*(layout.cols-1))/layout.cols,h=cell*.6,titleLines=wrap(p.title,62),authorY=48+titleLines.length*36,top=authorY+30;
 let cursor=0;const boxes=[];for(let i=0;i<layout.count;i++){const span=layout.spans?.[i]||1;if(cursor%layout.cols+span>layout.cols)cursor+=layout.cols-cursor%layout.cols;boxes.push({x:40+(cursor%layout.cols)*(cell+gap),y:top+Math.floor(cursor/layout.cols)*(h+gap),width:cell*span+gap*(span-1),height:h});cursor+=span;}
 const rowHeights=[];boxes.forEach(box=>{const row=Math.round((box.y-top)/(h+gap));box.row=row;box.height=box.width*.6;rowHeights[row]=Math.max(rowHeights[row]||0,box.height);});boxes.forEach(box=>box.y=top+rowHeights.slice(0,box.row).reduce((sum,height)=>sum+height+gap,0));const height=top+rowHeights.reduce((sum,height)=>sum+height+gap,0)+35;
 let content='<rect width="'+w+'" height="'+height+'" fill="#fffaf1"/><text x="40" y="48" font-family="Arial,sans-serif" font-weight="bold" font-size="30">'+titleLines.map((line,i)=>'<tspan x="40" dy="'+(i?36:0)+'">'+escape(line)+'</tspan>').join('')+'</text><text x="40" y="'+authorY+'" font-family="Arial,sans-serif" font-size="17" fill="#516079">'+escape(p.author)+'</text>';
 boxes.forEach((box,i)=>{content+='<svg x="'+box.x+'" y="'+box.y+'" width="'+box.width+'" height="'+box.height+'" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" overflow="hidden">'+scene(p.panels[i],'',p.assets)+'</svg><rect x="'+box.x+'" y="'+box.y+'" width="'+box.width+'" height="'+box.height+'" fill="none" stroke="'+ink+'" stroke-width="4"/>';});
 content+='<text x="40" y="'+(height-16)+'" font-family="Arial,sans-serif" font-size="12" fill="#637086">Created with Teach Arcade'+(p.pageNumber?' · '+p.pageNumber+' / '+p.totalPages:'')+'</text>';return {width:w,height,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+height+'" viewBox="0 0 '+w+' '+height+'">'+content+'</svg>'};
}
return {escape,scene,page,character,prop,dimensions,textGeometry};
})();
