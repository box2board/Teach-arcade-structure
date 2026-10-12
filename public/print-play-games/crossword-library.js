// Static cards keep downloads available without JavaScript. No PDF or preview loads on startup.
const library=document.querySelector('.crossword-library');
if(library){
 const cards=[...library.querySelectorAll('.crossword-card')],input=library.querySelector('input[type=search]');
 const filters=[...library.querySelectorAll('[data-category]')],status=library.querySelector('.library-status');
 const pagination=library.querySelector('.library-pagination'),prev=pagination.querySelector('[data-prev]'),next=pagination.querySelector('[data-next]'),pageText=pagination.querySelector('span');
 let category='',page=0;const size=12;
 function update(){
  const query=input.value.trim().toLocaleLowerCase(),matches=cards.filter(card=>(!category||card.dataset.course===category)&&card.dataset.search.includes(query));
  const pages=Math.max(1,Math.ceil(matches.length/size));page=Math.min(page,pages-1);
  const shown=new Set(matches.slice(page*size,(page+1)*size));cards.forEach(card=>{card.hidden=!shown.has(card);});
  status.textContent=matches.length?`${matches.length} topics${category?' in '+category:''} · Showing ${page*size+1}–${Math.min((page+1)*size,matches.length)}`:'No topics match. Try a shorter search or another course.';
  pagination.hidden=matches.length<=size;prev.disabled=page===0;next.disabled=page===pages-1;pageText.textContent=`Page ${page+1} of ${pages}`;
 }
 input.addEventListener('input',()=>{page=0;update();});
 filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;page=0;filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
 function move(delta){page+=delta;update();library.querySelector('.library-grid').scrollIntoView({block:'start'});}
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));update();
 const popup=document.createElement('div');popup.className='library-preview';popup.hidden=true;popup.setAttribute('aria-hidden','true');document.body.append(popup);
 let timer,current,pending;
 function hide(){clearTimeout(timer);pending=null;popup.hidden=true;current=null;}
 function show(link){
  if(!matchMedia('(hover:hover) and (min-width:601px)').matches)return;
  current=link;const sources=link.dataset.preview.split('|');popup.replaceChildren();popup.classList.toggle('stack',sources.length>1);
  sources.forEach(src=>{const img=document.createElement('img');img.src=src;img.alt='';img.decoding='async';popup.append(img);});popup.hidden=false;
  position(link);
 }
 function position(link){
  const count=link.dataset.preview.split('|').length;
  const rect=link.getBoundingClientRect(),width=Math.min(count>1?540:300,innerWidth-24);popup.style.width=width+'px';
  const height=Math.min(width/(count>1?3:1)*792/612+20,innerHeight*.56+20);
  popup.style.left=Math.max(12,Math.min(rect.left+rect.width/2-width/2,innerWidth-width-12))+'px';
  popup.style.top=Math.max(12,Math.min(rect.top-height-10>12?rect.top-height-10:rect.bottom+10,innerHeight-height-12))+'px';
 }
 library.querySelectorAll('[data-preview]').forEach(link=>{
  link.addEventListener('mouseenter',()=>{clearTimeout(timer);pending=link;timer=setTimeout(()=>{pending=null;show(link);},160);});
  link.addEventListener('mouseleave',()=>{if(pending===link){clearTimeout(timer);pending=null;}if(current===link&&document.activeElement!==link)hide();});
  link.addEventListener('focus',()=>{clearTimeout(timer);pending=null;show(link);});link.addEventListener('blur',()=>{if(current===link)hide();});
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});window.addEventListener('scroll',()=>{if(current)position(current);},{passive:true});window.addEventListener('resize',hide);
}
