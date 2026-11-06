export const ROUND_SECONDS=60, PREVIEW_SECONDS=3, PAIR_COUNT=12, CARD_COUNT=PAIR_COUNT*2;
export function createMemory(onEvent=()=>{},random=Math.random){
  let s;
  function reset(){s={phase:'intro',preview:PREVIEW_SECONDS,left:ROUND_SECONDS,cards:[],open:[],matched:[],moves:0,pairs:0,lock:0,pendingMatch:false,result:null};}
  reset();
  function start(){reset();s.cards=Array.from({length:CARD_COUNT},(_,i)=>i%PAIR_COUNT);for(let i=CARD_COUNT-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[s.cards[i],s.cards[j]]=[s.cards[j],s.cards[i]];}s.phase='preview';onEvent({type:'preview'});}
  function score(){return s.pairs*100+(s.moves?Math.round(s.pairs/s.moves*200):0)+(s.pairs===PAIR_COUNT?Math.floor(s.left)*10:0);}
  function finish(){if(s.phase==='finished')return;s.phase='finished';s.result={gameId:'memory-match',rulesVersion:2,completed:s.pairs===PAIR_COUNT,pairs:s.pairs,totalPairs:PAIR_COUNT,moves:s.moves,misses:s.moves-s.pairs,accuracy:s.moves?Math.round(s.pairs/s.moves*100):0,time:Number((ROUND_SECONDS-s.left).toFixed(2)),secondsLeft:Number(s.left.toFixed(2)),score:score()};onEvent({type:'finish',result:s.result});}
  function select(i){if(s.phase!=='playing'||s.lock>0||!Number.isInteger(i)||i<0||i>=CARD_COUNT||s.open.includes(i)||s.matched.includes(i))return false;s.open.push(i);onEvent({type:'flip'});if(s.open.length===2){s.moves++;s.pendingMatch=s.cards[s.open[0]]===s.cards[s.open[1]];s.lock=s.pendingMatch?.5:.85;if(s.pendingMatch){s.pairs++;s.matched.push(...s.open);onEvent({type:'match',pairs:s.pairs});}else onEvent({type:'miss'});}return true;}
  function tick(dt){if(!Number.isFinite(dt)||dt<=0)return;if(s.phase==='preview'){const used=Math.min(dt,s.preview);s.preview-=used;dt-=used;if(s.preview<=0){s.phase='playing';onEvent({type:'go'});}else return;}if(s.phase!=='playing')return;const used=Math.min(dt,s.left);s.left=Math.max(0,s.left-used);if(s.lock>0){s.lock=Math.max(0,s.lock-used);if(s.lock===0){s.open=[];s.pendingMatch=false;if(s.pairs===PAIR_COUNT){finish();return;}}}if(s.left===0)finish();}
  function pause(){if(['preview','playing'].includes(s.phase)){s.previousPhase=s.phase;s.phase='paused';onEvent({type:'pause'});}}
  function resume(){if(s.phase==='paused'){s.phase=s.previousPhase;onEvent({type:'resume'});}}
  return {get state(){return s;},get score(){return score();},start,select,tick,pause,resume};
}
