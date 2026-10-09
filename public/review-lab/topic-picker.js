// Enhance an existing topic select without changing the game contract.
export function enhanceTopicPicker(select,sets){
 const box=document.createElement('fieldset');box.className='bank-filters';
 const legend=document.createElement('legend');legend.textContent='Find a review topic';box.append(legend);
 const controls={};
 const status=document.createElement('p');status.setAttribute('role','status');box.append(status);
 for(const [key,title,type] of [['subject','Subject','select'],['category','Category','select'],['search','Search topics','input']]){
  const label=document.createElement('label');label.textContent=title;
  const control=document.createElement(type);control.id=select.id+'-'+key;label.htmlFor=control.id;
  if(type==='input'){control.type='search';control.placeholder='Topic name or keyword';}
  label.append(control);box.append(label);controls[key]=control;
 }
 select.before(box);
 const option=(value,text)=>{const node=document.createElement('option');node.value=value;node.textContent=text;return node;};
 const {subject,category,search}=controls;
 subject.append(option('','All subjects'),...[...new Set(sets.map(s=>s.subject))].sort().map(s=>option(s,s)));
 function categories(){const previous=category.value;category.replaceChildren(option('','All categories'),...[...new Set(sets.filter(s=>!subject.value||s.subject===subject.value).map(s=>s.category||'Foundations'))].sort().map(s=>option(s,s)));if([...category.options].some(o=>o.value===previous))category.value=previous;}
 function filter(){
  const selected=select.value,query=search.value.trim().toLowerCase();
  const matches=sets.filter(s=>(!subject.value||s.subject===subject.value)&&(!category.value||(s.category||'Foundations')===category.value)&&(`${s.title} ${s.subject} ${s.category||''}`.toLowerCase().includes(query)));
  // Keep the active topic selected while narrowing the alternatives. Filtering never loads a different bank silently.
  status.textContent=`${matches.length} matching topics. Your current topic stays selected until you choose another.`;
  const active=sets.find(s=>s.id===selected);if(active&&!matches.includes(active))matches.unshift(active);
  select.replaceChildren(...matches.map(s=>option(s.id,`${s.subject} · ${s.title}`)));
  if(active)select.value=active.id;
 }
 subject.addEventListener('change',()=>{categories();filter();});category.addEventListener('change',filter);search.addEventListener('input',filter);
 categories();filter();
 return {setDisabled(disabled){Object.values(controls).forEach(c=>c.disabled=disabled);select.disabled=disabled;}};
}
