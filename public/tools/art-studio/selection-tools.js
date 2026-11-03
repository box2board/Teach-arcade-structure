// Selection operations share the document history used by the canvas.
export class SelectionTools {
 constructor(ui){this.ui=ui;this.style=null;}
 run(action){
  if(!action.startsWith('tool:'))return false;
  const command=action.slice(5),ui=this.ui,s=ui.state,objects=s.objects;
  if(command==='open'){
   if(!objects.length)return true;
   const button=(cmd,label)=>`<button data-action="tool:${cmd}">${label}</button>`;
   ui.modal('Design tools',`<p>Applies to your selected items. Alignment uses the page for one item, or the selection for several. Every change supports Undo.</p><h3>Arrange & space</h3><div class="as-button-row">${[['left','Left'],['center','Center horizontally'],['right','Right'],['top','Top'],['middle','Center vertically'],['bottom','Bottom']].map(([a,l])=>button('align-'+a,l)).join('')}</div><div class="as-button-row">${button('align-distribute-x','Even horizontal spacing')}${button('align-distribute-y','Even vertical spacing')}</div><h3>Transform</h3><div class="as-button-row">${button('rotate-left','Rotate −90°')}${button('rotate-right','Rotate +90°')}${button('reset-angle','Straighten')}${button('flip-x','Flip horizontally')}${button('flip-y','Flip vertically')}</div><h3>Nudge 1 px</h3><div class="as-button-row">${button('nudge-left','← Left')}${button('nudge-up','↑ Up')}${button('nudge-down','↓ Down')}${button('nudge-right','→ Right')}</div><h3>Quick colors</h3><div class="as-quick-colors">${[['#7957e7','Purple'],['#28bda4','Mint'],['#efb344','Gold'],['#ed729c','Pink'],['#408be7','Blue'],['#25334b','Ink'],['#ffffff','White']].map(([color,label])=>`<button data-action="tool:color-${color}" style="--swatch:${color}"><span aria-hidden="true"></span>${label}</button>`).join('')}</div><h3>Style</h3><div class="as-button-row">${button('copy-style','Copy style')}${button('paste-style','Paste style')}${button('shadow','Toggle shadow')}${button('opacity-50','50% opacity')}${button('opacity-100','Full opacity')}</div><p>Use Shift-click to select several objects. Even spacing needs at least three items. Locked items stay protected.</p>`);return true;
  }
  if(!objects.length){ui.toast('Select an item first.');return true;}
  if(command==='copy-style'){
   const o=objects[0];this.style={sourceType:o.type,values:{}};
   for(const key of ['gradient','fill2','gradientAngle','fill','stroke','strokeWidth','shadow','opacity','font','fontSize','bold','italic','underline','align','lineHeight','letterSpacing'])if(o[key]!==undefined)this.style.values[key]=o[key];
   ui.toast('Style copied. Select another item, then choose Paste style.');return true;
  }
  if(objects.some(o=>o.locked)){ui.toast('Unlock the selected items to use design tools.');return true;}
  if(command.startsWith('align-')){const mode=command.slice(6);if(mode.startsWith('distribute')&&objects.length<3)ui.toast('Select at least three items for even spacing.');else ui.align(mode);return true;}
  if(command==='paste-style'&&!this.style){ui.toast('Copy a style from an item first.');return true;}
  s.change(()=>{for(const o of objects){
   if(command==='rotate-left'||command==='rotate-right')o.angle=((o.angle+(command==='rotate-left'?-90:90))%360+360)%360;
   else if(command==='reset-angle')o.angle=0;
   else if(command==='flip-x')o.flipX=!o.flipX;
   else if(command==='flip-y')o.flipY=!o.flipY;
   else if(command==='shadow')o.shadow=!o.shadow;
   else if(command.startsWith('color-')&&o.type!=='image')o.fill=command.slice(6);
   else if(command.startsWith('opacity-'))o.opacity=Number(command.slice(8))/100;
   else if(command.startsWith('nudge-')){o.x+=command==='nudge-left'?-1:command==='nudge-right'?1:0;o.y+=command==='nudge-up'?-1:command==='nudge-down'?1:0;}
   else if(command==='paste-style'){for(const [key,value] of Object.entries(this.style.values)){const textKey=['font','fontSize','bold','italic','underline','align','lineHeight','letterSpacing'].includes(key);if(textKey&&o.type!=='text')continue;if(key==='fill'&&o.type==='image')continue;o[key]=value;}}
  }});return true;
 }
}
