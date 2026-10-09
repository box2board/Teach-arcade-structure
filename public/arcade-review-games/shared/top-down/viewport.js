// Fit a room to its stage without stretching square world tiles.
export function roomSize(width,height,columns,rows,border=8){
  if(![width,height,columns,rows].every(n=>Number.isFinite(n)&&n>0))return null;
  const cell=Math.max(0,Math.min((width-border)/columns,(height-border)/rows));
  if(cell<=0)return null;
  return {width:Math.floor(cell*columns)+border,height:Math.floor(cell*rows)+border,cell};
}
export function mountLayout(){
  const frame=document.querySelector('.map-frame'),adventure=document.querySelector('.adventure');
  if(!frame||!adventure)return {stage:null,sidebar:null};
  document.body.classList.add('play-shell');
  const layout=document.createElement('div'),stage=document.createElement('div'),sidebar=document.createElement('aside');
  layout.className='play-layout';stage.className='board-stage';sidebar.className='play-sidebar';sidebar.setAttribute('aria-label','Adventure information and controls');
  stage.append(document.getElementById('board'));frame.prepend(stage);
  layout.append(frame,sidebar);adventure.append(layout);
  for(const selector of ['.inventory-strip','.objective','#message','.controls','.keyboard-help']){
    const node=document.querySelector(selector);if(!node)continue;
    if(selector==='#message'){const feedback=document.createElement('div');feedback.className='feedback-box';feedback.append(node);sidebar.append(feedback);}
    else sidebar.append(node);
  }
  return {stage,sidebar};
}
