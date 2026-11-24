import {drawCharacterToken} from '../../../lib/character-tokens.js';
import {characters} from '../../../lib/characters.js';
import {FIELD} from './rules.js';

const palette = new Map(characters.map(character => [character.id,character.color]));

export function createCanvasArena(canvas) {
  const context = canvas.getContext('2d');
  if (!context) throw Error('2D canvas unavailable.');
  const backdrop = canvas.ownerDocument.createElement('canvas');
  let width=0,height=0,ratio=1;
  const trails = backdrop.getContext('2d');

  function drawBackground() {
    const left=width*.12,right=width*.88,top=height*.12,bottom=height*.89;
    trails.setTransform(ratio,0,0,ratio,0,0);
    const grass=trails.createLinearGradient(0,0,0,height);
    grass.addColorStop(0,'#164654');
    grass.addColorStop(1,'#24715a');
    trails.fillStyle=grass;
    trails.fillRect(0,0,width,height);
    trails.fillStyle='#d1a870';
    trails.fillRect(left,top,right-left,bottom-top);
    for(let row=0;row<8;row++){
      const y=top+row*(bottom-top)/8;
      trails.fillStyle=row%2?'#c59863':'#d9b37d';
      trails.fillRect(left,y,right-left,(bottom-top)/8);
    }
    trails.strokeStyle='#fff3c6';
    trails.lineWidth=2;
    trails.setLineDash([6,8]);
    for(let col=1;col<6;col++){
      const x=left+col*(right-left)/6;
      trails.beginPath();trails.moveTo(x,top);trails.lineTo(x,bottom);trails.stroke();
    }
    trails.setLineDash([]);
    trails.fillStyle='#fff3c6';
    trails.fillRect(left,top,right-left,5);
    trails.fillRect(left,bottom-3,right-left,3);
    trails.fillStyle='#ffe4a1';
    trails.font='bold 12px system-ui';
    trails.textAlign='center';
    trails.fillText('FINISH',width/2,top-9);
    trails.fillText('START',width/2,bottom+17);
  }

  function render(state, observed, now, local) {
    const nextWidth=canvas.clientWidth,nextHeight=canvas.clientHeight;
    if(!nextWidth||!nextHeight)return;
    if(width!==nextWidth||height!==nextHeight){
      width=nextWidth;height=nextHeight;
      ratio=Math.min(canvas.ownerDocument.defaultView.devicePixelRatio||1,1.5);
      canvas.width=backdrop.width=Math.round(width*ratio);
      canvas.height=backdrop.height=Math.round(height*ratio);
      drawBackground();
    }
    context.setTransform(ratio,0,0,ratio,0,0);
    context.drawImage(backdrop,0,0,width,height);
    if(!state)return;
    const players=[...state.players.values()].sort((a,b)=>b.z-a.z||Number(a.id===observed)-Number(b.id===observed));
    for(const player of players){
      const position=player.id===observed&&local?local:player;
      const x=width*(.12+.76*(.5+position.x/FIELD.width));
      const y=height*(.89-.77*Math.min(1,Math.max(0,position.z/FIELD.finish)));
      const isLocal=player.id===observed;
      context.save();
      if(player.status==='out')context.globalAlpha=.42;
      context.translate(x,y);
      const scale=width<500?.52:.68;
      context.scale(scale,scale);
      drawCharacterToken(context,{...player,x:0,y:0,walk:player.motion==='idle'?0:now/100},palette.get(player.characterId));
      context.restore();
      context.font=isLocal?'bold 12px system-ui':'11px system-ui';
      context.textAlign='center';
      context.strokeStyle='#17313e';
      context.lineWidth=3;
      context.strokeText(isLocal?'YOU':player.name,x,y-27);
      context.fillStyle=isLocal?'#ffed9f':'#fff9e8';
      context.fillText(isLocal?'YOU':player.name,x,y-27);
    }
  }

  return {render,dispose(){backdrop.width=0;backdrop.height=0;}};
}
