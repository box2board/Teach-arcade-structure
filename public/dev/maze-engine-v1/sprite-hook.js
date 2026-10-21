(()=>{
const canvas=document.getElementById('game');
if(!canvas)return;
const ctx=canvas.getContext('2d');
const capture=window.__mazeArtCapture={points:[],frame:0};
const originalClear=ctx.clearRect.bind(ctx);
const originalTranslate=ctx.translate.bind(ctx);
ctx.clearRect=function(x,y,w,h){
  if(x===0&&y===0&&w===canvas.width&&h===canvas.height){capture.points=[];capture.frame++;}
  return originalClear(x,y,w,h);
};
ctx.translate=function(x,y){
  if(Number.isFinite(x)&&Number.isFinite(y))capture.points.push({x,y});
  return originalTranslate(x,y);
};
})();