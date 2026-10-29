import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/teacher-sets.js';
import {setInput,teacherBank,completeQuestion} from '../public/teacher/set-contract.js';
import {validateQuestionBank} from '../public/review-lab/question-banks.js';
import {prepareQuestionDeck,categoryClashBoard} from '../public/review-lab/question-decks.js';
import {prepareSnowQuestions} from '../public/review-lab/snow-day-defenders/question-adapter.js';
const originalFetch=global.fetch,env={...process.env};
afterEach(()=>{global.fetch=originalFetch;for(const key of ['SUPABASE_URL','SUPABASE_ANON_KEY','TEACHER_APP_ORIGIN','TEACHER_AUTH_ENABLED']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];}});
const id='00000000-0000-4000-8000-000000000001';
const question=n=>({question:'Question '+n,choices:['A','B','C','D'],answer:1,explanation:'Because B.'});
const set=()=>({id,owner_id:'teacher-a',title:'A teacher set',description:'Study this',subject:'Science',visibility:'private',revision:2,questions:Array.from({length:12},(_,i)=>question(i))});
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
function configure(){Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'public-key',TEACHER_APP_ORIGIN:'https://preview.test',TEACHER_AUTH_ENABLED:'true'});}
async function call(action,{method='GET',body={},query={},authenticated=false,origin='https://preview.test'}={}){
 const result={headers:{}};await handler({method,body,query:{action,...query},headers:{origin,...(authenticated?{cookie:'__Host-ta_session=teacher-jwt'}:{})}},{setHeader(k,v){result.headers[k]=v;},status(code){result.status=code;return this;},json(data){result.data=data;return this;}});return result;
}
test('drafts support incomplete questions; publishing and gameplay require complete questions',()=>{
 assert.equal(setInput({...set(),questions:[{...question(1),question:'',answer:-1}]}).visibility,'private');
 for(const input of [{...set(),visibility:'public',questions:[]},{...set(),visibility:'public',questions:Array(12).fill({...question(1),choices:['A','a','C','D']})}])assert.throws(()=>setInput(input),/publish/);
 const bank=teacherBank({...setInput({...set(),visibility:'public'}),id});validateQuestionBank(bank);assert.equal(bank.id,'teacher:'+id);assert.equal(prepareQuestionDeck(bank).length,12);assert.equal(prepareSnowQuestions(bank).questions.length,12);assert.equal(categoryClashBoard(bank).categories.flatMap(c=>c.questions).length,12);
 assert.throws(()=>teacherBank({...set(),questions:[]}),/12 complete/);
 assert.equal(completeQuestion({...question(1),choices:['Ａ','a','C','D']}),false);
});
test('oversized or malformed question structures and subject are rejected',()=>{
 for(const input of [{...set(),questions:Array(101).fill(question(1))},{...set(),subject:'invented'},{...set(),title:''},{...set(),questions:[{...question(1),answer:'1'}]},{...set(),questions:[{...question(1),choices:['A']}]},{...set(),questions:[{...question(1),question:'x'.repeat(1001)}]}])assert.throws(()=>setInput(input));
});
test('configuration, origin, methods, malformed bodies and missing auth prevent writes',async()=>{
 global.fetch=()=>{throw Error('network must not run');};assert.equal((await call('public')).status,503);configure();
 assert.equal((await call('create',{method:'POST'})).status,401);
 assert.equal((await call('create',{method:'POST',origin:'https://attacker.test'})).status,403);
 assert.equal((await call('create')).status,405);
 for(const body of ['null','[]','{'])assert.equal((await call('create',{method:'POST',body})).status,400);
 assert.equal((await call('create',{method:'POST',body:{title:'x'.repeat(256001)}})).status,413);
 assert.equal((await call('detail',{query:{id:'not-valid'}})).status,400);
});
test('public list does not download questions; title search is escaped and pagination bounded',async()=>{
 configure();const calls=[];global.fetch=async url=>{calls.push(url);return response([]);};
 assert.equal((await call('public',{query:{q:'x*,visibility.eq.private',offset:'25'}})).status,200);
 const url=new URL(calls[0]);assert.equal(url.searchParams.get('visibility'),'eq.public');assert.ok(!url.searchParams.get('select').includes('questions'));assert.equal(url.searchParams.get('offset'),'25');assert.equal(url.searchParams.get('title'),'ilike.*x  visibility eq private*');
 assert.equal((await call('public',{query:{offset:'-1'}})).status,400);
});
test('new set ignores client ownership and starts private under verified JWT',async()=>{
 configure();const calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return response(url.endsWith('/user')?{id:'teacher-a'}:[set()]);};
 const r=await call('create',{method:'POST',authenticated:true,body:{...set(),owner_id:'teacher-b',visibility:'public'}});
 assert.equal(r.status,201);const options=calls.at(-1).options;assert.equal(options.headers.Authorization,'Bearer teacher-jwt');assert.equal(JSON.parse(options.body).owner_id,undefined);assert.equal(JSON.parse(options.body).visibility,undefined);assert.equal(JSON.parse(options.body).id,undefined);
});
test('only owner updates; revision mismatch and concurrent change preserve existing data',async()=>{
 configure();let patches=0,changed=false;
 global.fetch=async(url,options)=>{
  if(url.endsWith('/user'))return response({id:'teacher-a'});
  if(options.method==='PATCH'){patches++;assert.ok(url.includes('revision=eq.2'));return response(changed?[]:[{...set(),revision:3}]);}
  return response([{...set(),owner_id:changed?'teacher-a':'teacher-b'}]);
 };
 assert.equal((await call('update',{method:'POST',authenticated:true,body:{id,revision:2}})).status,403);assert.equal(patches,0);
 changed=true;assert.equal((await call('update',{method:'POST',authenticated:true,body:{id,revision:1}})).status,409);assert.equal(patches,0);
 assert.equal((await call('update',{method:'POST',authenticated:true,body:{id,revision:2,title:'Updated'}})).status,409);assert.equal(patches,1);
});
test('public copy creates independent private content; missing private source cannot be copied',async()=>{
 configure();const calls=[];let missing=false;global.fetch=async(url,options)=>{calls.push({url,options});return response(url.endsWith('/user')?{id:'teacher-b'}:options.method==='POST'?[set()]:missing?[]:[{...set(),visibility:'public'}]);};
 const r=await call('copy',{method:'POST',authenticated:true,body:{id,owner_id:'teacher-a'}});assert.equal(r.status,201);const body=JSON.parse(calls.at(-1).options.body);assert.equal(body.title,'A teacher set (copy)');assert.equal(body.visibility,undefined);assert.equal(body.owner_id,undefined);assert.deepEqual(body.questions,set().questions);
 missing=true;assert.equal((await call('copy',{method:'POST',authenticated:true,body:{id}})).status,404);
});
test('saved collection joins visible sets and bookmarks cannot spoof teachers',async()=>{
 configure();const calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return response(url.endsWith('/user')?{id:'teacher-a'}:url.includes('!inner')?[{teacher_question_sets:set()}]:url.includes('teacher_question_sets')?[set()]:[]);};
 assert.deepEqual((await call('saved',{authenticated:true})).data.sets,[set()]);assert.ok(calls.at(-1).url.includes('teacher_id=eq.teacher-a'));
 assert.equal((await call('save',{method:'POST',authenticated:true,body:{id,teacher_id:'teacher-b'}})).status,200);assert.deepEqual(JSON.parse(calls.at(-1).options.body),{set_id:id});
 assert.equal((await call('unsave',{method:'POST',authenticated:true,body:{id,teacher_id:'teacher-b'}})).status,200);assert.ok(calls.at(-1).url.includes('teacher_id=eq.teacher-a'));
});
test('all Review Lab games receive explicitly selected teacher sets; unavailable sets cannot silently become another topic',async()=>{
 configure();const originalWindow=global.window,originalLocation=global.location;
 try{
  global.window={};global.location={search:'?set='+encodeURIComponent('teacher:'+id)};
  global.fetch=async()=>response({set:set()});
  const catalog=await import('../public/review-lab/catalog.js?teacher-test=valid');
  const loaded=await catalog.loadQuestionSet('teacher:'+id);assert.equal(loaded.title,set().title);
  assert.equal(catalog.gamesForSet('teacher:'+id).length,catalog.GAMES.filter(g=>g.supportsQuestionBank).length);
  for(const game of catalog.GAMES.filter(g=>g.supportsQuestionBank))assert.ok(catalog.setsForGame(game.id).some(s=>s.id==='teacher:'+id));
  global.fetch=async()=>response({error:'This set is private or is no longer available.'},404);
  const missing=await import('../public/review-lab/catalog.js?teacher-test=missing');
  assert.ok(missing.QUESTION_SETS.some(s=>s.id==='teacher:'+id));
  await assert.rejects(missing.loadQuestionSet('teacher:'+id),/private/);
 }finally{if(originalWindow===undefined)delete global.window;else global.window=originalWindow;if(originalLocation===undefined)delete global.location;else global.location=originalLocation;}
});

test('multiple correct answers survive validation and publication; legacy single answers still play',()=>{
 const input=set();input.questions[0].answer=[2,0];
 const published=setInput({...input,visibility:'public'});
 assert.deepEqual(published.questions[0].answer,[0,2]);assert.equal(completeQuestion(published.questions[0]),true);
 assert.deepEqual(teacherBank({...published,id}).questions[0].answer,[0,2]);validateQuestionBank(teacherBank({...published,id}));
 for(const answer of [[0,0],[4],[-1],['1'],null,[0,1,2,3,4]])assert.throws(()=>setInput({...set(),questions:[{...question(1),answer}]}));
 assert.equal(completeQuestion({...question(1),answer:[]}),false);
 assert.deepEqual(setInput({...set(),questions:[{...question(1),answer:[]}]}).questions[0].answer,[]);
 assert.throws(()=>setInput({...set(),visibility:'public',questions:Array(12).fill({...question(1),answer:[]})}),/publish/);
 const singles={...set(),questions:Array(12).fill({...question(1),answer:[2]})};
 assert.equal(teacherBank(singles).questions[0].answer,2);validateQuestionBank(teacherBank(singles));
});
test('create and copy preserve multiple correct answer indices through the API',async()=>{
 configure();const multiple=set();multiple.questions[0].answer=[0,2];let inserted;
 global.fetch=async(url,options)=>{if(url.endsWith('/user'))return response({id:'teacher-a'});if(options.method==='POST'){inserted=JSON.parse(options.body);return response([multiple]);}return response([multiple]);};
 assert.equal((await call('create',{method:'POST',authenticated:true,body:multiple})).status,201);assert.deepEqual(inserted.questions[0].answer,[0,2]);
 assert.equal((await call('copy',{method:'POST',authenticated:true,body:{id}})).status,201);assert.deepEqual(inserted.questions[0].answer,[0,2]);
});
test('reports require sign-in and another visible public set; identity is server controlled and duplicates are safe',async()=>{
 configure();let writes=[];let current={...set(),visibility:'public',owner_id:'teacher-b'};
 global.fetch=async(url,opts)=>{if(url.endsWith('/user'))return response({id:'teacher-a'});if(url.includes('teacher_set_reports')){writes.push(JSON.parse(opts.body));return response([],writes.length>1?409:201);}return response([current]);};
 assert.equal((await call('report',{method:'POST',body:{id,reason:'incorrect'}})).status,401);
 for(let i=0;i<2;i++)assert.equal((await call('report',{method:'POST',authenticated:true,body:{id,reason:'incorrect',reporter_id:'forged',status:'resolved'}})).status,200);
 assert.deepEqual(writes[0],{set_id:id,reason:'incorrect'});
 for(const patch of [{visibility:'private'},{moderation_hidden:true},{owner_id:'teacher-a'}]){current={...set(),visibility:'public',owner_id:'teacher-b',...patch};assert.equal((await call('report',{method:'POST',authenticated:true,body:{id,reason:'other'}})).status,400);}
 current={...set(),visibility:'public',owner_id:'teacher-b'};assert.equal((await call('report',{method:'POST',authenticated:true,body:{id,reason:'invalid'}})).status,400);
 assert.equal(writes.length,2);
});
