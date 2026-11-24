import {api} from './room.js';

export const midway = {
  id: 'midway-mayhem',
  title: 'Midway Mayhem',
  version: 1,
  gamePath: '/multiplayer/mayhem/',
  credentialNamespace: 'midway-mayhem',
  banksPath: '/api/multiplayer?action=originals',
  settings: [
    {id:'teams',label:'Teams',min:2,max:8,default:4},
    {id:'rounds',label:'Rounds',min:1,max:12,default:5}
  ],
  lobbyRule:'Midway Mayhem assigns balanced teams when you start.',
  canStart: state => state.roster.filter(player=>player.connected).length>=state.teamCount,
  describeRoom: state => state.teamCount+' teams · '+state.rounds+(state.rounds===1?' round':' rounds'),
  async handle({url,input,db,createCode,request,accounts,reviewEnabled}) {
    let teacherSet;
    if(input.action==='create'&&typeof input.bank==='string'&&input.bank.startsWith('teacher:')){
      if(!accounts?.configured)return {status:503,payload:{error:'Saved teacher sets are unavailable in this environment.'}};
      const bank=await accounts.bank(input.bank,request);
      if(!bank)return {status:404,payload:{error:'Sign in to the Cabinet and select an available set.'}};
      teacherSet={title:bank.title,questions:bank.questions.map(q=>[q.question,q.choices,q.answer])};
    }
    const response=await api(new Request(url,{method:'POST',body:JSON.stringify(input)}),db,{lobby:true,createCode,teacherSet,reviewEnabled});
    const payload=await response.json();
    if(input.action==='create'&&response.status===409) return {collision:true};
    return {payload,status:response.status};
  }
};
