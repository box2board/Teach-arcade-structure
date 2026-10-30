// Opt-in browser timing, separate from simulation. No storage or network requests.
export function createFrameCheck(){
 const samples=new Float64Array(16384);let count=0,total=0,last=null,quality=null;
 return {
  reset(){count=0;total=0;last=null;quality=null;},
  tick(now,active,mode){
   if(!active){last=null;return;}
   if(quality!==null&&quality!==mode)this.reset();quality=mode;
   if(last!==null){const ms=now-last;if(ms>0){samples[count%samples.length]=ms;count++;total+=ms;}}
   last=now;
  },
  result(){const n=Math.min(count,samples.length),sorted=Array.from(samples.subarray(0,n)).sort((a,b)=>a-b);
   return {quality,activeSeconds:total/1000,frames:count,averageFps:total?count*1000/total:null,p95FrameMs:n?sorted[Math.ceil(n*.95)-1]:null,retainedSamples:n};}
 };
}
export function setupDeviceCheck(){
 if(new URLSearchParams(location.search).get('measure')!=='1')return;
 const button=document.createElement('button');button.textContent='Measure FPS';button.title='Measure 60 active gameplay seconds; pauses and questions excluded. Click again to save a partial report.';document.querySelector('.actions').append(button);
 const check=createFrameCheck();let running=false,ready=false,start=null,maxSquad=0,maxEnemies=0,nextLabel=0,generation=0;
 function save(){const report={schemaVersion:1,measuredAt:new Date().toISOString(),browser:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},timing:check.result(),maxSquad,maxEnemies,start,end:window.snowDiagnostics?.(),limits:'RequestAnimationFrame cadence; not GPU timing. Questions, hidden tabs and paused frames excluded. Quality changes reset timing. No automatic performance pass/fail.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='snow-day-device-check.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function tick(now,id){if(!running||id!==generation)return;const d=window.snowDiagnostics?.();const active=!document.hidden&&d?.state.mode==='play';check.tick(now,active,d?.visuals.quality);if(active){maxSquad=Math.max(maxSquad,d.state.squad);maxEnemies=Math.max(maxEnemies,d.enemies);}
  if(now>=nextLabel){const r=check.result();button.textContent=r.frames?`${Math.round(r.averageFps)} FPS · ${Math.floor(r.activeSeconds)}s`:'Waiting for play';nextLabel=now+1000;if(r.activeSeconds>=60){running=false;ready=true;button.textContent='Save FPS report';return;}}
  requestAnimationFrame(t=>tick(t,id));
 }
 button.onclick=()=>{if(running||ready){running=false;generation++;ready=false;save();button.textContent='Measure again';return;}check.reset();start=window.snowDiagnostics?.();maxSquad=0;maxEnemies=0;nextLabel=0;running=true;const id=++generation;requestAnimationFrame(t=>tick(t,id));};
}
