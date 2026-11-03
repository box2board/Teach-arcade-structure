// Screen-space controls stay legible at every canvas zoom level.
export class CanvasObjectMenu {
 constructor(root,state,canvas,action){
  this.root=root;this.state=state;this.canvas=canvas;this.action=action;this.open=false;
  this.host=root.querySelector('.as-workspace');this.el=document.createElement('div');
  this.el.className='as-object-menu';this.el.hidden=true;this.host.append(this.el);
  this.el.addEventListener('pointerdown',e=>e.stopPropagation());
  this.el.addEventListener('click',e=>{e.stopPropagation();const button=e.target.closest('button');if(!button||button.disabled)return;
   if(button.dataset.objectToggle!==undefined){this.open=!this.open;this.render();if(this.open)this.el.querySelector('[role=menuitem]:not(:disabled)')?.focus();return;}
   const action=button.dataset.objectAction;if(action){this.open=false;this.action(action);this.render();if(!this.canvas.editing&&this.root.querySelector('[data-modal]').hidden)this.el.querySelector('[data-object-toggle]')?.focus();}
  });
  this.el.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key))e.stopPropagation();if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.open=false;this.render();this.el.querySelector('[data-object-toggle]')?.focus();}
   if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const items=[...this.el.querySelectorAll('[role=menuitem]:not(:disabled)')];if(!items.length)return;const index=items.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus();}
  });
  root.addEventListener('pointerdown',e=>{if(!this.el.contains(e.target)&&this.open){this.open=false;this.render();}});
  this.el.addEventListener('focusout',e=>{if(!this.el.contains(e.relatedTarget)){this.open=false;this.render();}});
  state.on(()=>this.render());canvas.view.addEventListener('scroll',()=>this.render());
  this.observer=new ResizeObserver(()=>this.render());this.observer.observe(this.host);this.render();
 }
 render(){
  const objects=this.state.objects.filter(o=>o.visible),key=this.state.page.id+':'+objects.map(o=>o.id).join(',');
  if(key!==this.key){this.open=false;this.key=key;}
  const visible=objects.length&&this.canvas.tool==='select'&&!this.canvas.editing;
  this.el.hidden=!visible;if(!visible)return;
  const locked=objects.some(o=>o.locked),grouped=objects.some(o=>o.groupId);
  const entry=(name,label,disabled=false)=>`<button type="button" role="menuitem" data-object-action="${name}" ${disabled?'disabled':''}>${label}</button>`;
  const signature=[key,this.open,locked,grouped,objects[0].type].join('|');
  if(signature!==this.signature){this.signature=signature;this.el.innerHTML=`<button type="button" data-object-toggle aria-label="Selected object options" aria-haspopup="menu" aria-expanded="${this.open}" aria-controls="as-object-options">•••</button><div id="as-object-options" role="menu" aria-label="Selected object actions" ${this.open?'':'hidden'}>${objects.length===1&&objects[0].type==='text'?entry('edit-text','Edit text',locked):''}${objects.length===1&&objects[0].type==='image'?entry('image:crop','Crop image',locked)+entry('image:brush','Erase / restore',locked):''}${objects.length===1&&grouped?entry('select-group','Select whole group'):''}${entry('tool:open','Design tools ✦')}${entry('properties','Properties & effects')}${entry('duplicate','Duplicate',locked)}${entry('rename-layer','Rename',locked||objects.length!==1)}${objects.length>1&&grouped?entry('group-items','Edit inside group'):''}${objects.length>1?entry(grouped?'ungroup':'group',grouped?'Ungroup':'Group',locked):''}${entry('front','Bring to front',locked)}${entry('back','Send to back',locked)}${entry('selection-lock',locked?'Unlock':'Lock')}${entry('selection-hide','Hide')}${entry('delete','Delete',locked)}</div>`;}
  const area=this.host.getBoundingClientRect(),view=this.canvas.view.getBoundingClientRect();
  const rects=objects.map(o=>this.canvas.svg.querySelector(`[data-object="${o.id}"]`)?.getBoundingClientRect()).filter(Boolean);if(!rects.length){this.el.hidden=true;return;}
  const top=Math.min(...rects.map(r=>r.top)),bottom=Math.max(...rects.map(r=>r.bottom)),right=Math.max(...rects.map(r=>r.right));
  if(bottom<view.top||top>view.bottom||right<view.left||Math.min(...rects.map(r=>r.left))>view.right){this.el.hidden=true;return;}
  const menuHeight=this.open?this.el.offsetHeight:32,width=this.open?202:36;
  this.el.style.left=Math.max(8,Math.min(right-area.left+10,area.width-width-8))+'px';
  this.el.style.top=Math.max(view.top-area.top+8,Math.min(top-area.top-38,view.bottom-area.top-menuHeight-8))+'px';
 }
}
