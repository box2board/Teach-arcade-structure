import {studentJoinUrl} from '../../public/multiplayer/lib/join-link.js';
import {qrImage} from './qr.js';
import {midway} from './midway-adapter.js';

const json = (data, status = 200) => Response.json(data, {
  status, headers: {'Cache-Control':'no-store'}
});
const codePattern=/^\d{6}$/;
const commands=new Set(['join','lookup','projection','state','start','lock','rename','remove','prune-disconnected','ready','leave','close']);
const publicGame = ({id,title,version,banksPath,settings}) => ({id,title,version,banksPath,settings});
const changes = result => Number(result.meta.changes);

function nextCode() {
  const random=new Uint32Array(1);
  const max=0x100000000-(0x100000000%900000);
  do{crypto.getRandomValues(random);}while(random[0]>=max);
  return String(100000+(random[0]%900000));
}

function roomView(adapter,payload) {
  if(!payload.state)return payload;
  const state=payload.state;
  return {...payload,state:{
    code:state.code,phase:state.phase,revision:state.revision,locked:state.locked,
    roster:state.roster,player:state.player,
    questionSetTitle:state.questionSetTitle,questionCount:state.questionCount,
    canStart:state.phase==='lobby'&&adapter.canStart(state),
    lobbyRule:adapter.lobbyRule,settingsSummary:adapter.describeRoom(state)
  }};
}

export function createLobby(adapters, makeCode=nextCode) {
  const games=new Map(adapters.map(adapter=>[adapter.id,adapter]));
  if(games.size!==adapters.length)throw Error('Game identifiers must be unique.');

  return async function lobby(request, db, accounts, options={}) {
    if(request.method!=='POST')return json({error:'Use POST.'},405);
    const url=new URL(request.url);
    const origin=request.headers.get('origin');
    if(origin&&origin!==url.origin)return json({error:'Invalid request origin.'},403);
    const raw=await request.text();
    if(raw.length>500000)return json({error:'Request too large.'},413);
    let input;
    try{input=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
    if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'Invalid request.'},400);
    const {action,code}=input;
    if(action==='catalog')return json({games:[...games.values()].map(publicGame),teacherSetsConfigured:Boolean(accounts?.configured),reviewEnabled:Boolean(options.reviewEnabled)});
    if(action==='cabinet-set'){
      const bank=accounts?.configured&&typeof input.set==='string'&&input.set.startsWith('teacher:')
        ? await accounts.bank(input.set,request) : null;
      return bank?json({id:bank.id,title:bank.title,questionCount:bank.questionCount})
        :json({error:'This question set is unavailable. Open Teacher Cabinet to sign in or choose another set.'},404);
    }

    const decorate=(adapter,payload)=>({
      ...roomView(adapter,payload),game:adapter.title,gamePath:adapter.gamePath,credentialNamespace:adapter.credentialNamespace
    });

    if(action==='create'){
      const adapter=games.get(input.game);
      if(!adapter)return json({error:'Choose an available game.'},404);
      for(let attempt=0;attempt<8;attempt++){
        const reservedCode=makeCode();
        const reserved=await db.prepare('INSERT OR IGNORE INTO lobby_codes (code,game) VALUES (?,?)')
          .bind(reservedCode,adapter.id).run();
        if(!changes(reserved))continue;
        let result;
        try{
          result=await adapter.handle({url,input,db,createCode:reservedCode,request,accounts,reviewEnabled:options.reviewEnabled});
        }catch(error){
          await db.prepare('DELETE FROM lobby_codes WHERE code=? AND game=?').bind(reservedCode,adapter.id).run();
          throw error;
        }
        if(result.status===201)return json(decorate(adapter,result.payload),201);
        await db.prepare('DELETE FROM lobby_codes WHERE code=? AND game=?').bind(reservedCode,adapter.id).run();
        if(!result.collision)return json(result.payload,result.status);
      }
      return json({error:'Could not reserve a code. Try again.'},503);
    }
    if(!commands.has(action))return json({error:'Unknown lobby command.'},400);
    if(typeof code!=='string'||!codePattern.test(code))return json({error:'Enter a six-digit game code.'},400);
    const route=await db.prepare('SELECT game FROM lobby_codes WHERE code=?').bind(code).first();
    const adapter=games.get(route?.game);
    if(!adapter)return json({error:'Room not found. Check the six-digit code.'},404);
    const {payload,status}=await adapter.handle({url,input,db});
    if(payload.error&&!payload.state)return json(payload,status);
    return json({
      ...decorate(adapter,payload),
      ...(action==='projection'?{qr:qrImage(studentJoinUrl(url.origin,code).href)}:{})
    },status);
  };
}

export const lobby=createLobby([midway]);
