import {matchesSetFields,matchesSetSearch,mountSetFilters} from './set-filters.js';

// Enhance an existing topic select without changing the game contract.
export function enhanceTopicPicker(select,sets){
 const box=document.createElement('fieldset');box.className='bank-filters';
 const legend=document.createElement('legend');legend.textContent='Find a review topic';box.append(legend);
 const status=document.createElement('p');status.setAttribute('role','status');box.append(status);
 const label=document.createElement('label');label.textContent='Search topics';
 const search=document.createElement('input');search.type='search';search.placeholder='Title, grade, topic, or keyword';
 label.append(search);box.append(label);select.before(box);
 const filters=mountSetFilters(box,sets,['primaryGrade','gradeBand','subject','category','difficulty'],filter);
 function filter(){
  const selected=select.value,active=sets.find(s=>s.id===selected);
  const values=filters.values(),matches=sets.filter(s=>matchesSetFields(s,values)&&matchesSetSearch(s,search.value));
  status.textContent=`${matches.length} matching topics.`;
  // Keep the active choice while narrowing the alternatives.
  if(active&&!matches.includes(active)){matches.unshift(active);status.textContent+=' Your current topic is still selected.';}
  select.replaceChildren(...matches.map(s=>new Option(`${s.subject} · ${s.title}`,s.id)));
  if(active)select.value=active.id;
 }
 search.addEventListener('input',filter);filter();
 const query=new URLSearchParams(location.search);
 if(query.get('from')==='teacher-hq'&&query.get('set')===select.value&&sets.some(s=>s.id===select.value)){
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='hq-topic-confirmation';
  const updateSummary=()=>{summary.textContent=`Topic ready: ${sets.find(s=>s.id===select.value)?.title||'Choose a topic'} · Change topic (optional)`;};
  updateSummary();box.before(details);details.append(summary,box,select);
  select.addEventListener('change',updateSummary);
 }
 return {setDisabled(disabled){filters.setDisabled(disabled);search.disabled=disabled;select.disabled=disabled;}};
}
