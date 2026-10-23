import {answerIndices} from './answers.js';
const controls=new WeakMap();
export function clearAnswerChoices(container){controls.get(container)?.remove();controls.delete(container);}
// Keep Submit outside the choice container so existing choice loops stay correct.
export function bindAnswerChoices(container,q,onSubmit,buttons=[...container.querySelectorAll('button')]){
 clearAnswerChoices(container);
 const doc=container.ownerDocument||document;
 const multiple=answerIndices(q).length>1,selected=new Set();let locked=false;
 let submit=null,group=null;
 if(multiple){
  group=doc.createElement('div');group.className='multi-answer-controls';
  const hint=doc.createElement('p');hint.textContent='Select all correct answers, then submit. Choose every correct option and no incorrect options.';
  hint.setAttribute('role','status');hint.className='multi-answer-hint';container.before(hint);
  submit=doc.createElement('button');submit.type='button';submit.className='primary btn snow-primary';submit.style.minHeight='44px';submit.style.margin='12px 0';submit.textContent='Submit answers';submit.disabled=true;
  group.append(submit);container.after(group);controls.set(container,{remove(){hint.remove();group.remove();}});
  submit.onclick=()=>{if(locked||!selected.size)return;locked=true;submit.disabled=true;buttons.forEach(b=>b.disabled=true);onSubmit([...selected].sort((a,b)=>a-b));};
 }
 buttons.forEach((b,i)=>{
  b.type='button';b.disabled=false;b.removeAttribute('aria-pressed');b.style.outline='';b.style.outlineOffset='';
  const label=b.textContent;
  if(multiple)b.setAttribute('aria-pressed','false');
  b.onclick=()=>{
   if(locked)return;
   if(!multiple){locked=true;onSubmit(i);return;}
   if(selected.has(i))selected.delete(i);else selected.add(i);
   const checked=selected.has(i);b.setAttribute('aria-pressed',String(checked));b.textContent=(checked?'✓ ':'')+label;
   b.style.outline=checked?'3px solid #45e7dd':'';b.style.outlineOffset=checked?'2px':'';submit.disabled=!selected.size;
  };
 });
 return {submit,disable(){locked=true;if(submit)submit.disabled=true;buttons.forEach(b=>b.disabled=true);}};
}
