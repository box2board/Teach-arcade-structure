// Labels are a visual aid. Routing Middleware enforces access even without JS.
(async()=>{
 const routes={"/brain-arcade/rv-road-trip-mayhem":"brain-rv-road-trip-mayhem","/brain-arcade/chess":"brain-chess","/brain-arcade/sudoku":"brain-sudoku"};
 const labels={coming_soon:'Coming Soon',under_improvement:'Under Improvement',unavailable:'Temporarily Unavailable'};
 let data;
 try {const response=await fetch('/api/feature-availability',{cache:'no-store'});data=(await response.json()).features;} catch {return;}
 for(const link of document.querySelectorAll('a[href]')){
  const path=new URL(link.href,location.href).pathname.replace(/\/$/,'');
  const id=routes[path],label=id&&labels[data?.[id]];
  if(!label)continue;
  const badge=document.createElement('span');badge.className='ta-availability-badge';badge.textContent=label;
  link.classList.add('ta-feature-blocked');link.setAttribute('aria-label',(link.querySelector('h3,strong')?.textContent||'Game')+' — '+label);
  link.querySelector('.badge')?.remove();link.append(badge);
  // Keep the link: it opens the server-rendered preview, never the game.
 }
})();
