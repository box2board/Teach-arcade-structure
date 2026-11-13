import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/teacher.js';
import {CABINET_GAMES,TOOLS} from '../public/teacher/cabinet-catalog.js';
import {arcadeEntries} from './build-cabinet-catalog.mjs';
test('all public arcade titles are in the shared Cabinet allowlist with real launch targets',async()=>{
 const html=await readFile(new URL('../public/arcade-review-games/index.html',import.meta.url),'utf8');
 const entries=arcadeEntries(html);
 assert.ok(entries.length>=18);
 assert.equal(new Set(CABINET_GAMES.map(g=>g.id)).size,CABINET_GAMES.length);
 for(const entry of entries){
  const game=CABINET_GAMES.find(g=>g.url===entry.href.replace(/index\.html$/,''));
  assert.ok(game,entry.title);assert.equal(game.title,entry.title);assert.ok(!game.chooseTopic);assert.ok(game.id.length<=200);
  assert.ok((await readFile(new URL('../public'+game.url+(game.url.endsWith('/')?'index.html':''),import.meta.url),'utf8')).length);
 }
});
import {QUESTION_SETS,loadQuestionSet,gamesForSet,gameUrl} from '../public/review-lab/catalog.js';
const originalFetch=global.fetch;
const keys=['SUPABASE_URL','SUPABASE_ANON_KEY','TEACHER_APP_ORIGIN','TEACHER_AUTH_ENABLED','TEACHER_CABINET_ENABLED'];
const original=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
afterEach(()=>{global.fetch=originalFetch;for(const k of keys)if(original[k]===undefined)delete process.env[k];else process.env[k]=original[k];});
function configure(){Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'publishable-test',TEACHER_APP_ORIGIN:'https://preview.test',TEACHER_AUTH_ENABLED:'true',TEACHER_CABINET_ENABLED:'false'});}
async function call(action,method='GET',body={},headers={}){const result={headers:{}};const res={setHeader(k,v){result.headers[k]=v;},status(s){result.status=s;return this;},json(data){result.data=data;return this;}};await handler({method,query:{action},body,headers},res);return result;}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
test('email cooldown forwards only sanitized retry duration, never provider details',async()=>{
 configure();
 for(const fixture of [
  {data:{msg:'For security purposes, you can only request this after 19 seconds. sensitive-provider-detail'},headers:{},wait:19},
  {data:{message:'internal-provider-message'},headers:{'Retry-After':'7'},wait:7},
  {data:{message:'internal-provider-message'},headers:{'Retry-After':new Date(Date.now()+45000).toUTCString()},date:true},
  {data:{msg:'after 999999999 seconds sensitive-provider-detail'},headers:{}},
  {data:{message:'sensitive-provider-detail'},headers:{'Retry-After':'invalid'}}
 ]){
  global.fetch=async()=>new Response(JSON.stringify(fixture.data),{status:429,headers:fixture.headers});
  const r=await call('login','POST',{email:'teacher@example.test'},{origin:'https://preview.test'});
  assert.equal(r.status,429);assert.ok(!JSON.stringify(r.data).includes('provider'));
  if(fixture.date){assert.ok(r.data.retryAfter>=43&&r.data.retryAfter<=45);}
  else assert.equal(r.data.retryAfter,fixture.wait);
  assert.equal(r.headers['Retry-After'],r.data.retryAfter?String(r.data.retryAfter):undefined);
 }
});
test('successful email request provides a resend interval without exposing authentication data',async()=>{
 configure();global.fetch=async()=>response({});
 const r=await call('login','POST',{email:'teacher@example.test'},{origin:'https://preview.test'});
 assert.deepEqual(r.data,{ok:true,retryAfter:60});
});
for(const [type,items] of [['game',CABINET_GAMES],['tool',TOOLS]])test(`every Cabinet ${type} can save, reload and remove through the account API`,async()=>{
 configure();process.env.TEACHER_CABINET_ENABLED='true';const rows=new Map();
 global.fetch=async(url,options)=>{
  if(url.endsWith('/user'))return response({id:'teacher-a'});
  const parsed=new URL(url);
  if(options.method==='POST'){const row=JSON.parse(options.body);assert.equal(row.teacher_id,'teacher-a');rows.set(row.resource_id,row);return response([]);}
  if(options.method==='DELETE'){rows.delete(parsed.searchParams.get('resource_id').slice(3));return response([]);}
  return response([...rows.values()]);
 };
 const headers={origin:'https://preview.test',cookie:'__Host-ta_session=verified'};
 for(const game of items)assert.equal((await call('save-item','POST',{type,id:game.id},headers)).status,200,game.title);
 assert.deepEqual((await call('cabinet','GET',{},headers)).data.items.map(g=>g.id),items.map(g=>g.id));
 for(const game of items)assert.equal((await call('remove-item','POST',{type,id:game.id},headers)).status,200);
 assert.deepEqual((await call('cabinet','GET',{},headers)).data.items,[]);
});
test('email codes retain all digits and reject malformed input before verification',async()=>{
 configure();let sent=[];global.fetch=async(url,opts)=>{sent.push(JSON.parse(opts.body).token);return response({access_token:'test.jwt.token',expires_in:3600,user:{id:'teacher-a'}});};
 for(const code of ['012345','01234567','0123456789'])assert.equal((await call('verify','POST',{email:'teacher@example.com',code},{origin:'https://preview.test'})).status,200);
 assert.deepEqual(sent,['012345','01234567','0123456789']);
 for(const code of ['12345','12345678901','1234abcd','1234 5678',12345678])assert.equal((await call('verify','POST',{email:'teacher@example.com',code},{origin:'https://preview.test'})).status,400);
 assert.equal(sent.length,3);
 const html=await readFile(new URL('../public/teacher/index.html',import.meta.url),'utf8');assert.ok(html.includes('pattern="[0-9]{6,10}"'));assert.ok(html.includes('maxlength="10"'));assert.ok(!html.includes('six-digit'));
});
test('unconfigured workspace exposes no account and cannot save',async()=>{delete process.env.TEACHER_AUTH_ENABLED;global.fetch=()=>{throw Error('must not contact backend');};assert.equal((await call('session')).data.configured,false);assert.equal((await call('save','POST',{setId:QUESTION_SETS[0].id})).status,503);});
test('rejects cross-origin and missing-origin mutations before network',async()=>{configure();global.fetch=()=>{throw Error('must not contact backend');};for(const origin of [undefined,'https://attacker.test'])assert.equal((await call('login','POST',{email:'teacher@example.com'},{origin})).status,403);assert.equal((await call('save')).status,405);});
test('unauthenticated favorites never reach database',async()=>{configure();global.fetch=()=>{throw Error('must not contact backend');};assert.equal((await call('favorites')).status,401);});
test('verified login uses a secure HttpOnly cookie without returning tokens',async()=>{configure();global.fetch=async(url,opts)=>{assert.ok(url.endsWith('/auth/v1/verify'));assert.equal(JSON.parse(opts.body).type,'email');return response({access_token:'test.jwt.token',expires_in:3600,user:{id:'teacher-a'}});};const r=await call('verify','POST',{email:'teacher@example.com',code:'123456'},{origin:'https://preview.test'});assert.equal(r.status,200);for(const part of ['__Host-ta_session=','HttpOnly','Secure','SameSite=Lax','Max-Age=3600'])assert.ok(r.headers['Set-Cookie'][0].includes(part));assert.deepEqual(r.data,{ok:true});});
test('save ignores client owner and forwards verified identity and JWT',async()=>{configure();const calls=[];global.fetch=async(url,opts)=>{calls.push({url,opts});return response(url.endsWith('/user')?{id:'teacher-a'}:[]);};const setId=QUESTION_SETS[0].id;const r=await call('save','POST',{setId,teacher_id:'teacher-b'},{origin:'https://preview.test',cookie:'__Host-ta_session=teacher-token'});assert.equal(r.status,200);assert.equal(calls.length,2);assert.deepEqual(JSON.parse(calls[1].opts.body),{teacher_id:'teacher-a',public_set_id:setId});assert.equal(calls[1].opts.headers.Authorization,'Bearer teacher-token');});
test('invalid session and catalog IDs cannot write',async()=>{configure();let calls=0;global.fetch=async()=>{calls++;return response({id:'teacher-a'});};assert.equal((await call('save','POST',{setId:'invented'},{origin:'https://preview.test',cookie:'__Host-ta_session=x'})).status,400);assert.equal(calls,1);global.fetch=async()=>response({},401);const r=await call('favorites','GET',{}, {cookie:'__Host-ta_session=expired'});assert.equal(r.status,401);assert.ok(r.headers['Set-Cookie'].every(cookie=>cookie.includes('Max-Age=0')));});
test('database/network failures are not reported as saved',async()=>{configure();global.fetch=async url=>url.endsWith('/user')?response({id:'teacher-a'}):response({message:'sensitive provider detail'},500);const r=await call('save','POST',{setId:QUESTION_SETS[0].id},{origin:'https://preview.test',cookie:'__Host-ta_session=x'});assert.equal(r.status,502);assert.ok(!JSON.stringify(r.data).includes('sensitive'));});
test('workspace uses existing normalized catalog and compatible links',async()=>{for(const s of [QUESTION_SETS[0],QUESTION_SETS.at(-1)]){const bank=await loadQuestionSet(s.id);assert.equal(bank.questions.length,s.questionCount);for(const game of gamesForSet(s.id))assert.ok(gameUrl(game.id,s.id).includes(encodeURIComponent(s.id)));}const html=await readFile(new URL('../public/teacher/index.html',import.meta.url),'utf8');assert.ok(html.includes('noindex,nofollow'));assert.ok(!html.includes('googletagmanager'));});
test('migration enforces ownership and keeps plan read-only',async()=>{const sql=await readFile(new URL('../db/track-b/001-teachers-favorites.sql',import.meta.url),'utf8');assert.ok(sql.includes('grant select on public.teachers to authenticated'));assert.ok(!/grant .*update/i.test(sql));for(const p of ['favorites_read','favorites_add','favorites_remove'])assert.ok(sql.includes(`create policy ${p}`));assert.ok(sql.includes('with check ((select auth.uid())=teacher_id)'));});
test('cabinet read/write endpoints require an authenticated teacher',async()=>{
 configure();process.env.TEACHER_CABINET_ENABLED='true';global.fetch=()=>{throw Error('must not contact backend');};
 assert.equal((await call('cabinet')).status,401);
 for(const action of ['save-item','remove-item'])assert.equal((await call(action,'POST',{type:'tool',id:'timer'},{origin:'https://preview.test'})).status,401);
});
test('cabinet feature remains off until the additive development migration is enabled',async()=>{
 configure();let calls=0;global.fetch=async()=>{calls++;return response({id:'teacher-a'});};
 assert.equal((await call('save-item','POST',{type:'tool',id:'timer'},{origin:'https://preview.test',cookie:'__Host-ta_session=x'})).status,503);
 assert.equal(calls,1);
});
test('cabinet save uses verified owner, known resource and teacher JWT',async()=>{
 configure();process.env.TEACHER_CABINET_ENABLED='true';const calls=[];
 global.fetch=async(url,opts)=>{calls.push({url,opts});return response(url.endsWith('/user')?{id:'teacher-a'}:[]);};
 const r=await call('save-item','POST',{type:'tool',id:'timer',teacher_id:'teacher-b',url:'https://attacker.test'},{origin:'https://preview.test',cookie:'__Host-ta_session=verified'});
 assert.equal(r.status,200);assert.deepEqual(JSON.parse(calls[1].opts.body),{teacher_id:'teacher-a',resource_type:'tool',resource_id:'timer'});assert.equal(calls[1].opts.headers.Authorization,'Bearer verified');
});
test('cabinet rejects unknown resources, cross-origin mutations and wrong methods',async()=>{
 configure();process.env.TEACHER_CABINET_ENABLED='true';let calls=0;global.fetch=async()=>{calls++;return response({id:'teacher-a'});};
 const headers={origin:'https://preview.test',cookie:'__Host-ta_session=x'};
 for(const body of [{type:'tool',id:'invented'},{type:'private-game',id:'raceway-rivals'},{type:'game',id:'timer'}])assert.equal((await call('save-item','POST',body,headers)).status,400);
 assert.equal(calls,3);
 assert.equal((await call('save-item','POST',{type:'tool',id:'timer'},{...headers,origin:'https://attacker.test'})).status,403);
 assert.equal((await call('save-item')).status,405);assert.equal((await call('cabinet','POST',{},headers)).status,405);assert.equal(calls,3);
});
test('cabinet read and removal always scope to verified teacher and resource',async()=>{
 configure();process.env.TEACHER_CABINET_ENABLED='true';const calls=[];
 global.fetch=async(url,opts)=>{calls.push({url,opts});return response(url.endsWith('/user')?{id:'teacher-a'}:[{resource_type:'game',resource_id:'raceway-rivals'}]);};
 assert.deepEqual((await call('cabinet','GET',{}, {cookie:'__Host-ta_session=x'})).data.items,[{type:'game',id:'raceway-rivals'}]);
 const r=await call('remove-item','POST',{type:'game',id:'raceway-rivals',teacher_id:'teacher-b'},{origin:'https://preview.test',cookie:'__Host-ta_session=x'});
 assert.equal(r.status,200);const last=calls.at(-1);assert.equal(last.opts.method,'DELETE');assert.ok(last.url.includes('teacher_id=eq.teacher-a'));assert.ok(last.url.includes('resource_type=eq.game'));assert.ok(last.url.includes('resource_id=eq.raceway-rivals'));
});
test('cabinet migration enforces ownership without enabling plans or student data',async()=>{
 const sql=await readFile(new URL('../db/track-b/002-cabinet-bookmarks.sql',import.meta.url),'utf8');
 for(const policy of ['cabinet_read','cabinet_add','cabinet_remove'])assert.ok(sql.includes(`create policy ${policy}`));assert.ok(sql.includes('enable row level security'));assert.ok(sql.includes('with check ((select auth.uid())=teacher_id)'));assert.ok(!/grant .*update/i.test(sql));
});
test('teacher-profile trigger stays outside exposed public API with execute revoked',async()=>{
 const sql=await readFile(new URL('../db/track-b/001-teachers-favorites.sql',import.meta.url),'utf8');
 assert.ok(sql.includes('create function private.create_teacher_profile()'));
 assert.ok(sql.includes('revoke all on function private.create_teacher_profile() from public,anon,authenticated'));
 assert.ok(sql.includes("set search_path=''"));
 assert.ok(!sql.includes('create function public.create_teacher_profile()'));
});
test('account deletion requires POST, exact origin, verified identity and typed confirmation',async()=>{
 configure();let deleted=0;global.fetch=async(url,opts)=>{if(url.endsWith('/user'))return response({id:'teacher-a'});assert.ok(url.endsWith('/rpc/delete_teacher_account'));assert.equal(opts.headers.Authorization,'Bearer verified');assert.deepEqual(JSON.parse(opts.body),{});deleted++;return response(null);};
 assert.equal((await call('delete-account')).status,405);
 assert.equal((await call('delete-account','POST',{confirmation:'DELETE'},{origin:'https://evil.test'})).status,403);
 assert.equal((await call('delete-account','POST',{confirmation:'DELETE'},{origin:'https://preview.test'})).status,401);
 const headers={origin:'https://preview.test',cookie:'__Host-ta_session=verified'};
 assert.equal((await call('delete-account','POST',{confirmation:'delete'},headers)).status,400);
 const result=await call('delete-account','POST',{confirmation:'DELETE',owner_id:'victim'},headers);
 assert.equal(result.status,200);assert.equal(deleted,1);assert.ok(result.headers['Set-Cookie'].every(c=>c.includes('Max-Age=0')));
});
test('stale deletion sign-in asks for fresh verification and outages never claim deletion',async()=>{
 configure();const headers={origin:'https://preview.test',cookie:'__Host-ta_session=verified'};
 for(const code of [403,500]){global.fetch=async url=>url.endsWith('/user')?response({id:'teacher-a'}):response({},code);const r=await call('delete-account','POST',{confirmation:'DELETE'},headers);assert.equal(r.status,code===403?403:502);assert.ok(!r.data.ok);assert.equal(r.headers['Set-Cookie'],undefined);}
});
