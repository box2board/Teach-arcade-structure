window.ComicArt=(()=>{
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const ink='#243148';
function background(kind){
 const expanded=window.ComicLibraryArt.background(kind);if(expanded)return expanded;
 const base='<rect width="600" height="360" fill="#fbf4e5"/>';
 if(kind==='blank')return base;
 if(kind==='classroom')return base+'<rect y="252" width="600" height="108" fill="#d7b48c"/><path d="M0 286H600M0 330H600M90 252L30 360M230 252L210 360M410 252L470 360" stroke="#c39c73" stroke-width="2"/><rect x="45" y="48" width="290" height="150" rx="5" fill="#314e4a" stroke="#a07751" stroke-width="12"/><path d="M77 95h180M77 120h120M77 145h150" stroke="#e9f0d6" stroke-width="5" stroke-linecap="round"/><rect x="402" y="35" width="150" height="145" rx="4" fill="#a7ddeb" stroke="'+ink+'" stroke-width="5"/><path d="M477 35v145M402 106h150" stroke="#fff8e9" stroke-width="10"/><rect x="385" y="211" width="184" height="18" rx="4" fill="#87563b"/><path d="M399 229v58M550 229v58" stroke="'+ink+'" stroke-width="10"/>';
 if(kind==='park')return '<rect width="600" height="360" fill="#bfe8f5"/><circle cx="485" cy="57" r="32" fill="#ffdc77"/><path d="M0 230Q100 190 210 235T600 209V360H0" fill="#87bf85"/><path d="M252 255Q220 305 140 360H405Q360 290 342 255" fill="#ecce95"/><path d="M72 185v115M530 165v140" stroke="#80604a" stroke-width="19"/><g fill="#518773" stroke="'+ink+'" stroke-width="3"><circle cx="70" cy="151" r="53"/><circle cx="532" cy="134" r="61"/></g><g fill="#fff" opacity=".8"><ellipse cx="233" cy="63" rx="59" ry="17"/><ellipse cx="314" cy="104" rx="44" ry="13"/></g>';
 if(kind==='city')return '<rect width="600" height="360" fill="#c3dae7"/><g stroke="'+ink+'" stroke-width="3"><path d="M0 230V77H119V230M124 230V35H285V230M290 230V109H412V230M419 230V55H600V230" fill="#e8b49b"/><path d="M143 56h45v41h-45zm70 0h45v41h-45zm-70 66h45v41h-45zm70 0h45v41h-45zM20 105h35v45H20zm55 0h28v45H75zM444 90h48v55h-48zm70 0h47v55h-47z" fill="#789caf"/></g><rect y="231" width="600" height="40" fill="#d9d4c8"/><rect y="271" width="600" height="89" fill="#627080"/><path d="M0 313h600" stroke="#f9eec5" stroke-width="6" stroke-dasharray="45 30"/>';
 if(kind==='space')return '<rect width="600" height="360" fill="#24324e"/><g fill="#fff2bc"><circle cx="60" cy="55" r="3"/><circle cx="264" cy="35" r="3"/><circle cx="344" cy="155" r="4"/><circle cx="535" cy="205" r="3"/><path d="M170 122v16m-8-8h16M520 45v16m-8-8h16" stroke="#fff2bc" stroke-width="2"/></g><ellipse cx="453" cy="86" rx="80" ry="17" fill="none" stroke="#efaa91" stroke-width="8" transform="rotate(-20 453 86)"/><circle cx="453" cy="86" r="39" fill="#bca3ce"/><path d="M0 300Q300 215 600 300V360H0" fill="#9a9ab1"/><ellipse cx="82" cy="321" rx="44" ry="12" fill="#7d7e97"/><ellipse cx="508" cy="311" rx="29" ry="8" fill="#7d7e97"/>';
 return base;
}
function character(asset,expression,pose){return window.ComicLibraryArt.character(asset,expression,pose);}
function prop(asset){
 const expanded=window.ComicLibraryArt.prop(asset);if(expanded)return expanded;
 const forms={book:'<path d="M5 12q27-13 53 2 26-15 53-2v72q-27-13-53 0-26-13-53 0z" fill="#f4dcad"/><path d="M58 14v70"/><path d="M15 29h30M15 43h30M70 29h30M70 43h30" stroke="#ac855b"/>',tree:'<path d="M49 70v68h20V70" fill="#96704c"/><path d="M10 95L60 3l50 92z" fill="#679881"/>',desk:'<rect x="4" y="30" width="112" height="15" rx="4" fill="#d09967"/><path d="M15 45v70M105 45v70" stroke-width="9"/>',star:'<path d="M60 3L77 43l43 3-33 28 10 42-37-23-37 23 10-42L0 46l43-3z" fill="#f4cb67"/>'};return '<g stroke="'+ink+'" stroke-width="3" stroke-linejoin="round">'+(forms[asset]||forms.book)+'</g>';
}
function wrap(text,max=24){const result=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if((line+' '+word).trim().length>max&&line){result.push(line);line='';}if(word.length>max){if(line){result.push(line);line='';}for(let i=0;i<word.length;i+=max)result.push(word.slice(i,i+max));}else line+=(line?' ':'')+word;}result.push(line);}return result;}
function object(o,selected=false){
 let drawing,width=120,height=225;
 if(o.type==='character')drawing=character(o.asset,o.expression,o.pose);
 else if(o.type==='prop'){drawing=prop(o.asset);height=140;}
 else {
  width=240;const lines=wrap(o.text,24);height=Math.max(o.type==='caption'?50:80,lines.length*19+30);
  drawing=o.type==='caption'?'<rect width="240" height="'+height+'" rx="3" fill="#ffe3a1" stroke="'+ink+'" stroke-width="3"/>':o.type==='thought'?'<rect width="240" height="'+height+'" rx="35" fill="#fffdf8" stroke="'+ink+'" stroke-width="3"/><circle cx="38" cy="'+(height+13)+'" r="8" fill="#fffdf8" stroke="'+ink+'" stroke-width="3"/><circle cx="24" cy="'+(height+28)+'" r="4" fill="#fffdf8" stroke="'+ink+'" stroke-width="2"/>':'<path d="M22 0H218Q240 0 240 22V'+(height-22)+'Q240 '+height+' 218 '+height+'H80L43 '+(height+24)+'l7-24H22Q0 '+height+' 0 '+(height-22)+'V22Q0 0 22 0Z" fill="#fffdf8" stroke="'+ink+'" stroke-width="3"/>';
  drawing+='<text x="16" y="26" font-family="Arial,sans-serif" font-size="16" fill="'+ink+'">'+lines.map((line,i)=>'<tspan x="16" dy="'+(i?19:0)+'">'+escape(line)+'</tspan>').join('')+'</text>';
 }
 const selection=selected?'<rect x="-6" y="-6" width="'+(width+12)+'" height="'+(height+12)+'" rx="5" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/>':'';
 return '<g data-object="'+escape(o.id)+'" transform="translate('+o.x+' '+o.y+') scale('+o.scale+')">'+(o.flip?'<g transform="translate('+width+' 0) scale(-1 1)">'+drawing+'</g>':drawing)+selection+'</g>';
}
function scene(panel,selected=''){return background(panel.background)+panel.objects.map(o=>object(o,o.id===selected)).join('');}
function page(p){
 const layout=window.ComicModel.layouts[p.layout],gap=20,w=1200,cell=(w-80-gap*(layout.cols-1))/layout.cols,h=cell*.6,rows=Math.ceil(layout.count/layout.cols),titleLines=wrap(p.title,62),authorY=48+titleLines.length*36,top=authorY+30,height=top+rows*(h+gap)+35;
 let content='<rect width="'+w+'" height="'+height+'" fill="#fffaf1"/><text x="40" y="48" font-family="Arial,sans-serif" font-weight="bold" font-size="30">'+titleLines.map((line,i)=>'<tspan x="40" dy="'+(i?36:0)+'">'+escape(line)+'</tspan>').join('')+'</text><text x="40" y="'+authorY+'" font-family="Arial,sans-serif" font-size="17" fill="#516079">'+escape(p.author)+'</text>';
 for(let i=0;i<layout.count;i++){const x=40+(i%layout.cols)*(cell+gap),y=top+Math.floor(i/layout.cols)*(h+gap);content+='<svg x="'+x+'" y="'+y+'" width="'+cell+'" height="'+h+'" viewBox="0 0 600 360" overflow="hidden">'+scene(p.panels[i])+'</svg><rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+h+'" fill="none" stroke="'+ink+'" stroke-width="4"/>';}
 content+='<text x="40" y="'+(height-16)+'" font-family="Arial,sans-serif" font-size="12" fill="#637086">Created with Teach Arcade</text>';return {width:w,height,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+height+'" viewBox="0 0 '+w+' '+height+'">'+content+'</svg>'};
}
return {escape,scene,page,character,prop};
})();
