import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {authenticate} from '../lib/teacher/backend.js';
import handler from '../api/teacher.js';
import sets from '../api/teacher-sets.js';
const originalFetch=global.fetch, originalEnv={...process.env};
afterEach(()=>{global.fetch=originalFetch;process.env=originalEnv;});
function setup(){process.env={...originalEnv,SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'public',TEACHER_APP_ORIGIN:'https://preview.test',TEACHER_AUTH_ENABLED:'true'};const result={};const res={setHeader(k,v){result[k]=v;},status(s){result.status=s;return this;},json(d){result.data=d;return this;}};return {res,result};}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
const session={access_token:'new-access',refresh_token:'new-refresh',expires_in:3600,user:{id:'teacher-a'}};
const req={method:'GET',headers:{cookie:'__Host-ta_session=expired; __Host-ta_refresh=old-refresh'}};
test('expired access and missing access both renew, rotate secure cookies and verify identity',async()=>{
 for(const cookie of [req.headers.cookie,'__Host-ta_refresh=old-refresh']){
 const {res,result}=setup();let refreshed=0;
 global.fetch=async(url,opts)=>{if(url.includes('/token?')){refreshed++;assert.deepEqual(JSON.parse(opts.body),{refresh_token:'old-refresh'});return response(session);}if(opts.headers.Authorization==='Bearer expired')return response({},401);return response({id:'teacher-a'});};
 const auth=await authenticate({headers:{cookie}},res);assert.equal(auth.token,'new-access');assert.equal(auth.user.id,'teacher-a');assert.equal(refreshed,1);
 assert.equal(result['Set-Cookie'].length,2);for(const c of result['Set-Cookie'])for(const flag of ['HttpOnly','Secure','SameSite=Lax','Path=/'])assert.ok(c.includes(flag));assert.ok(result['Set-Cookie'][1].includes('new-refresh'));assert.ok(result['Set-Cookie'][1].includes('Max-Age=2592000'));
 }
});
test('valid legacy sessions remain usable without refresh; malformed cookies do not crash',async()=>{
 const {res,result}=setup();global.fetch=async()=>response({id:'teacher-a'});assert.equal((await authenticate({headers:{cookie:'__Host-ta_session=valid'}},res)).user.id,'teacher-a');assert.equal(result['Set-Cookie'],undefined);assert.equal((await authenticate({headers:{cookie:'__Host-ta_refresh=%invalid'}},res)).user,null);
});
test('revoked renewal clears both cookies; temporary outages retain credentials',async()=>{
 for(const status of [400,401,403,429,500]){
 const {res,result}=setup();global.fetch=async(url)=>response({},url.endsWith('/user')?401:status);
 if([400,401,403].includes(status)){assert.equal((await authenticate(req,res)).user,null);assert.ok(result['Set-Cookie'].every(c=>c.includes('Max-Age=0')));}else{await assert.rejects(authenticate(req,res));assert.equal(result['Set-Cookie'],undefined);}
 }
});
test('renewal works for private set reads and writes with rotated teacher JWT, never leaks tokens',async()=>{
 for(const action of ['mine','create']){
 const {res,result}=setup();global.fetch=async(url,opts)=>{if(url.endsWith('/user'))return opts.headers.Authorization==='Bearer expired'?response({},401):response({id:'teacher-a'});if(url.includes('/token?'))return response(session);assert.equal(opts.headers.Authorization,'Bearer new-access');return response([]);};
 await sets({...req,method:action==='create'?'POST':'GET',query:{action},body:{title:'Private draft',subject:'Science',questions:[]},headers:{...req.headers,origin:'https://preview.test'}},res);assert.ok([200,201].includes(result.status));assert.ok(result['Set-Cookie']);assert.ok(!JSON.stringify(result.data).includes('new-refresh'));
 }
});
test('logout renews an expired access token to revoke session and deletes both cookies',async()=>{
 const {res,result}=setup();let revoked=false;global.fetch=async(url,opts)=>{if(url.includes('/token?'))return response(session);if(url.includes('/logout')){revoked=true;assert.equal(opts.headers.Authorization,'Bearer new-access');return response({});}return opts.headers.Authorization==='Bearer expired'?response({},401):response({id:'teacher-a'});};
 await handler({...req,method:'POST',query:{action:'logout'},headers:{...req.headers,origin:'https://preview.test'}},res);assert.equal(result.status,200);assert.ok(revoked);assert.ok(result['Set-Cookie'].every(c=>c.includes('Max-Age=0')));
});
test('cross-origin writes cannot trigger renewal',async()=>{
 const {res,result}=setup();global.fetch=async()=>{throw new Error('must not fetch');};await handler({...req,method:'POST',query:{action:'save'},headers:{...req.headers,origin:'https://evil.test'}},res);assert.equal(result.status,403);assert.equal(result['Set-Cookie'],undefined);
});
test('email verification retains renewal credentials without returning either token',async()=>{
 const {res,result}=setup();global.fetch=async()=>response(session);
 await handler({method:'POST',query:{action:'verify'},body:{email:'teacher@example.test',code:'123456'},headers:{origin:'https://preview.test'}},res);
 assert.equal(result.status,200);assert.deepEqual(result.data,{ok:true});assert.ok(result['Set-Cookie'][1].startsWith('__Host-ta_refresh=new-refresh;'));assert.equal(result['Cache-Control'],'private, no-store');
});
test('parallel expired requests renew independently without sharing identities',async()=>{
 setup();global.fetch=async(url,opts)=>{if(url.endsWith('/user'))return opts.headers.Authorization==='Bearer expired'?response({},401):response({id:opts.headers.Authorization.slice(7)});const refresh=JSON.parse(opts.body).refresh_token;return response({...session,access_token:refresh,refresh_token:refresh+'-rotated',user:{id:refresh}});};
 const outcomes=await Promise.all(['teacher-a','teacher-b'].map(async id=>{const {res,result}=setup();return {auth:await authenticate({headers:{cookie:'__Host-ta_session=expired; __Host-ta_refresh='+id}},res),result};}));
 for(let i=0;i<2;i++){const id=['teacher-a','teacher-b'][i];assert.equal(outcomes[i].auth.user.id,id);assert.ok(outcomes[i].result['Set-Cookie'][1].includes(id+'-rotated'));}
});
