const query=new URLSearchParams(location.search);
export const embedded=query.get('mode')==='classroom-arcade';
const attempt=query.get('attempt')||'';
const parentOrigin=query.get('parentOrigin')||'';
const storageKey='arcade.trace.'+attempt;
let trace=[];

if(embedded){
  try{trace=JSON.parse(sessionStorage.getItem(storageKey))||[];}catch{trace=[];}
  document.documentElement.classList.add('classroom-cabinet');
}

export function recordShot(at,aim,power){
  if(!embedded)return;
  trace.push(['shot',Number(at.toFixed(4)),Number(aim.toFixed(2)),Number(power.toFixed(4))]);
  try{sessionStorage.setItem(storageKey,JSON.stringify(trace));}catch{}
}

export function connect(start,restore){
  if(!embedded||!attempt||!parentOrigin)return;
  addEventListener('message',event=>{
    if(event.origin!==parentOrigin||event.source!==parent||event.data?.type!=='arcade:go'||event.data.attempt!==attempt)return;
    const elapsed=Math.max(0,Number(event.data.elapsed)||0);
    start();
    if(trace.length||elapsed>.25)restore(trace,elapsed);
  });
  addEventListener('sparks:minigame:complete',event=>{
    parent.postMessage({type:'arcade:finish',attempt,inputs:trace,score:event.detail?.results?.[0]?.score??0},parentOrigin);
  });
  parent.postMessage({type:'arcade:ready',attempt},parentOrigin);
}

