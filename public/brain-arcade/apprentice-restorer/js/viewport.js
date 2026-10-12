// Keep the complete world and its controls inside the available viewport.
export function fitViewport({width,height,top,chrome,ratio}){
  const available=Math.max(180,height-top-chrome-16);
  const fittedWidth=Math.max(1,Math.min(width,available*ratio));
  return {width:fittedWidth,sceneHeight:fittedWidth/ratio};
}
