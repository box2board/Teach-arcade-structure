import assert from 'node:assert/strict';
import {openRoomDatabase} from '../lib/multiplayer/database/sqlite.js';
import {serveSession} from '../lib/multiplayer/http.js';
import {qrImage} from '../lib/multiplayer/qr.js';
import {getMiniGame, multiplayerIds} from '../lib/multiplayer/minigames.js';
import {miniGames} from '../public/multiplayer/lib/game-labels.js';
import {questionIndex} from '../public/multiplayer/mayhem/rules.js';
import {isInLight,visibleRayLength} from '../public/multiplayer/mini-games/multiplayer/spotlight-sneak/engine.js';
import {characters} from '../public/multiplayer/lib/characters.js';

const studentCount = 30;
const db = openRoomDatabase(':memory:');
const realNow = Date.now;
let now = realNow();
Date.now = () => now;
const realRandom=Math.random;
let seed=542;
Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const origin='https://teach.test';
const selected='teacher:aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const privateSet={id:selected,title:'Civil Rights · Classroom Review',questionCount:4,questions:[
  {question:'Which year was the Montgomery Bus Boycott launched?',choices:['1955','1956','1961','1963'],answer:0},
  {question:'Which act prohibited discrimination in public accommodations?',choices:['Dawes Act','Civil Rights Act of 1964','Homestead Act','Pendleton Act'],answer:1},
  {question:'Which ruling addressed segregation in public schools?',choices:['Marbury','Plessy','Brown','Gibbons'],answer:2},
  {question:'Which two events occurred in Alabama?',choices:['Montgomery Bus Boycott','March on Washington','Selma to Montgomery marches','Greensboro sit-in'],answer:[0,2]}
]};
const auth='test-teacher-account';
const accounts={configured:true,bank:(id,request)=>id===selected&&request.headers.get('cookie')===auth?privateSet:null};
const call=async(input,{game=false,teacher=false}={})=>{
 const response=await serveSession(new Request(origin+(game?'/api/mayhem':'/api/multiplayer'),{
   method:'POST',headers:{origin,...(teacher?{cookie:auth}:{})},body:JSON.stringify(input)
 }),db,{accounts});
 return {status:response.status,...await response.json()};
};
const checked=async(input,options)=>{
 const answer=await call(input,options);
 assert.ok(answer.status<400,JSON.stringify({action:input.action,error:answer.error}));
 return answer;
};

try{
 const settings={action:'create',game:'midway-mayhem',bank:selected,teams:4,rounds:3};
 assert.equal((await call(settings)).status,404);
 const created=await checked(settings,{teacher:true});
 assert.equal(created.state.questionSetTitle,privateSet.title);
 assert.equal(created.state.questionCount,privateSet.questionCount);
 const {code}=created.state;
 const host=created.token;
 const read=()=>JSON.parse(db.prepare('SELECT state FROM mayhem_rooms WHERE code=?').bind(code).first().state);
 const students=await Promise.all(Array.from({length:studentCount},async(_,i)=>{
   const join={code,action:'join',name:'Student '+(i+1),characterId:characters[i % characters.length].id,joinId:crypto.randomUUID()};
   const joined=await checked(join);
   assert.equal(joined.state.player.characterId,join.characterId);
   return {...join,token:joined.token,publicId:joined.state.player.miniPlayerId};
 }));
 const waitingProjection=await checked({code,action:'projection'});
 assert.equal(waitingProjection.count,studentCount);
 assert.equal(waitingProjection.qr,qrImage(origin+'/join?code='+code));
 await checked({code,token:host,action:'start'});
 assert.deepEqual(read().teams.map((_,i)=>read().players.filter(p=>p.team===i).length),[8,8,7,7]);
 const studentGet=token=>checked({code,token,action:'state'},{game:true});
 const teacherGet=()=>studentGet(host);
 const first=await studentGet(students[0].token);
 assert.ok(privateSet.questions.some(q=>q.question===first.state.question[0]));
 assert.equal(first.state.questionSetTitle,undefined);
 assert.equal(first.state.questionCount,undefined);
 assert.equal(first.state.question.length<=3,true);
 assert.ok(first.state.question.length===2||first.state.question[2]===true);
 assert.equal((await call({action:'cabinet-set',set:selected})).status,404);

 const games=[];
 const miniGameAttendance={};
 for(let steps=0;steps<115;steps++){
   const room=read();
   if(room.phase==='finished')break;
   if(room.phase==='lightning'||room.phase==='qualifier'){
     for(let answer=0;answer<(room.phase==='qualifier'?3:privateSet.questionCount);answer++){
       for(const student of students){
         const current=read();
         const player=current.players.find(p=>p.id===student.token);
         const correct=current.questions[questionIndex(current,player)][2];
         await checked({code,token:student.token,action:'answer',phase:current.phase,since:current.since,sequence:player.answers,choice:correct,choices:correct},{game:true});
       }
     }
     if(room.phase==='lightning')assert.equal(read().phase,'roll','Completing the questions opens the first board turn directly');
     continue;
   }
   if(room.phase==='mini'){
     const game=room.game;
     games.push(game);
     const engine=getMiniGame(game);
     const original=await teacherGet();
     const all=original.state.minigame.players??original.state.minigame.boats;
     assert.equal(all.length,studentCount);
     miniGameAttendance[game]=all.length;
     for(const student of students){
       assert.equal(all.find(p=>p.id===student.publicId).characterId,student.characterId);
       assert.ok(!JSON.stringify(original.state).includes(student.token));
     }
     assert.ok(!JSON.stringify(original.state).includes(host));
     const rejoin=await checked(students[0]);
     assert.equal(rejoin.token,students[0].token);
     assert.equal(rejoin.state.player.miniPlayerId,students[0].publicId);
     const priorTick=read().miniState.tickAt;
     now=room.since+80;
     await teacherGet();
     assert.equal(read().miniState.tickAt,priorTick,'Watching within a round does not write simulation state');
     const race=game==='red-light-green-light';
     if(race){
       assert.equal(original.state.minigame.phase,'countdown');
       assert.equal(original.state.minigame.phaseEndsAt,room.since+3000);
       assert.equal(room.deadline,room.since+58000);
       now=room.since+2980;
       const countdownViews=await Promise.all(students.map(student=>studentGet(student.token)));
       for(const {state} of countdownViews){
         assert.equal(state.minigame.phase,'countdown');
         assert.equal(state.minigame.phaseEndsAt,room.since+3000);
       }
     }
     for(let frame=1;frame<=5;frame++){
       now=room.since+(race?3000:0)+frame*100;
       for(const student of students){
         const current=(await studentGet(student.token)).state;
         assert.deepEqual(current.minigame, (await teacherGet()).state.minigame);
         const packet={seq:frame,x:.5,y:-.5,boost:frame===1,
           z:1,phaseId:current.minigame.phaseId,roundId:current.minigame.roundId,sample:now,press:true};
         if(race)assert.equal(current.minigame.phase,'green');
         await checked({code,token:student.token,action:'mini-input',phase:'mini',since:room.since,packet},{game:true});

       }
     }
     if(race){
       const running=(await teacherGet()).state.minigame.players;
       for(const player of running)assert.ok(player.z>all.find(p=>p.id===player.id).z);
     }
     const end=engine.advance(read().miniState, room.deadline+1);
     const rewards=new Map(engine.results(end,room.deadline+1).map(p=>[p.playerId,Math.min(10,Math.floor(p.score/miniGames[game].divisor))]));
     const expected=room.teams.map((t,team)=>room.players.filter(p=>p.team===team).reduce((score,p)=>score+rewards.get(p.lobbyId),t.score));
     now=room.deadline+1;
     const repeats=await Promise.all(Array.from({length:5},teacherGet));
     for(const {state} of repeats)assert.deepEqual(state.teams.map(t=>t.score),expected);
   }else{
     if(room.phase==='landing'){
       const movement=room.teams[room.turn].movement;
       assert.equal(movement.path.at(-1),room.teams[room.turn].position);
       assert.ok(movement.path.every(Number.isInteger));
     }
     now=room.deadline+1;
     await teacherGet();
   }
 }
 const final=read();
 assert.equal(final.phase,'finished');
 assert.deepEqual(games.toSorted(),multiplayerIds().toSorted());
 const projected=await checked({code,action:'projection'});
 assert.deepEqual(projected.teams.map(t=>t.score),final.teams.map(t=>t.score));
 const spotlight={on:true,x:160,y:120,base:Math.PI/2,rate:0,phase:0};
 assert.equal(visibleRayLength(spotlight,Math.PI/2),60);
 assert.equal(isInLight(spotlight,0,160,160),true);
 assert.equal(isInLight(spotlight,0,160,270),false);
 console.log(JSON.stringify({students:studentCount,teams:final.teams.map((team,index)=>({
   team:index+1,students:final.players.filter(player=>player.team===index).length,score:team.score
 })),rounds:games,miniGameAttendance},null,2));
 console.log('Passed private-set authorization, shared state, seat and character reconnect, QR, RLGL countdown and movement, spotlight cover, and once-only team rewards.');
}finally{Date.now=realNow;Math.random=realRandom;db.close();}
