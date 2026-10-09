import {validHintUsage} from './hints.js';
const version=1;
function hash(text){let n=2166136261;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
// Help copy can evolve without invalidating an otherwise identical saved puzzle.
const signature=(map,questions)=>{const puzzle={...map};delete puzzle.hintRules;return hash(JSON.stringify({map:puzzle,questions}));};
export function encodeSave(map,questions,state,motion,elapsed){
  const payload=JSON.stringify({mode:map.mode,layout:map.layout,signature:signature(map,questions),state,position:{x:motion.x,y:motion.y},elapsed});
  return JSON.stringify({version,payload,checksum:hash(payload)});
}
export function decodeSave(raw,createAdventure,questions){
  try{
    const envelope=JSON.parse(raw);
    if(envelope.version!==version||typeof envelope.payload!=='string'||envelope.checksum!==hash(envelope.payload))return null;
    const data=JSON.parse(envelope.payload);
    if(data.layout!==undefined&&typeof data.layout!=='string')return null;
    const map=createAdventure(data.mode,data.layout);
    if(data.layout!==undefined&&data.layout!==map.layout)return null;
    let matches=data.signature===signature(map,questions);
    // Older Outpost saves predate named layouts; their geometry is the classic layout.
    if(!matches&&data.layout===undefined&&map.layout==='classic'){
      const legacy={...map};delete legacy.layout;delete legacy.layoutLabel;
      matches=data.signature===signature(legacy,questions);
    }
    if(data.mode!==map.mode||!matches||data.state.won)return null;
    const {state,position,elapsed}=data;
    if(!validHintUsage(state.hints))return null;
    if(!Number.isFinite(elapsed)||elapsed<0||!Number.isFinite(position.x)||!Number.isFinite(position.y))return null;
    if(!Number.isInteger(state.player.x)||!Number.isInteger(state.player.y)||Math.round(position.x)!==state.player.x||Math.round(position.y)!==state.player.y)return null;
    if(!map.tiles[state.player.y]?.[state.player.x]||map.tiles[state.player.y][state.player.x]==='#')return null;
    for(const field of ['opened','activated','discovered','tools','items','collected','keys','usedKeys','solved'])if(!Array.isArray(state[field])||state[field].some(value=>typeof value!=='string'))return null;
    if(!['up','down','left','right'].includes(state.facing)||!Number.isFinite(state.score)||!Number.isFinite(state.moves)||!state.sequences||!state.attempts)return null;
    if(!state.review?.encounters||!Array.isArray(state.blocks)||!Array.isArray(state.history))return null;
    if(state.blocks.length!==map.blocks.length||state.blocks.some(b=>!map.blocks.some(source=>source.id===b.id)||!Number.isInteger(b.x)||!Number.isInteger(b.y)||!map.tiles[b.y]?.[b.x]))return null;
    const used=new Set();
    for(const chest of map.objects.filter(o=>o.type==='challenge')){
      const encounter=state.review.encounters[chest.id];
      if(!encounter||!Array.isArray(encounter.questions)||encounter.questions.length!==(chest.questionCount||1)||!Number.isInteger(encounter.index)||encounter.index<0||encounter.index>encounter.questions.length)return null;
      for(const [i,entry] of encounter.questions.entries()){
        const q=questions.find(q=>q.id===entry.question?.id);
        if(!q||used.has(q.id)||q.text!==entry.question.text||q.answer!==entry.question.answer||!Array.isArray(entry.question.choices)||entry.question.choices.length!==q.choices.length||new Set(entry.question.choices).size!==q.choices.length||entry.question.choices.some(c=>!q.choices.includes(c)))return null;
        if(entry.correct!==(i<encounter.index)||!Number.isInteger(entry.attempts)||entry.attempts<0||!Array.isArray(entry.tried)||entry.tried.length!==entry.attempts||entry.tried.some(c=>!q.choices.includes(c)))return null;
        used.add(q.id);
      }
    }
    return {...data,map};
  }catch{return null;}
}
// Storage may be unavailable in school/private browsers. Gameplay must still work.
export function createSaveStore(key,getStorage=()=>globalThis.localStorage){
  return {
    read(){try{return getStorage()?.getItem(key)||null;}catch{return null;}},
    write(value){try{const storage=getStorage();if(!storage)return false;storage.setItem(key,value);return true;}catch{return false;}},
    clear(){try{getStorage()?.removeItem(key);}catch{}}
  };
}
