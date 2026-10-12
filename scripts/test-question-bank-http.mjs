// Exercise the browser-fetch branch of the shared loader with static files and a mocked HTTP response.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const publicRoot=new URL('../public/',import.meta.url);
let requests=0,failure;
const origin='http://teach-arcade.test';
const context=vm.createContext({URL,fetch:async input=>{
 requests++;
 if(failure==='network')throw Error('Simulated network failure');
 if(failure==='missing')return {ok:false,status:404};
 const url=new URL(input),bytes=await fs.readFile(new URL('.'+url.pathname,publicRoot),'utf8');
 if(failure==='malformed')return {ok:true,json:async()=>{throw SyntaxError('Malformed JSON');}};
 return {ok:true,status:200,json:async()=>{
  const bank=JSON.parse(bytes);
  if(failure==='answer')bank.questions[0].correctAnswer=4;
  return bank;
 }};
}});
const modules=new Map();
async function moduleFor(url){
 if(modules.has(url.href))return modules.get(url.href);
 const source=await fs.readFile(new URL('.'+url.pathname,publicRoot),'utf8');
 const module=new vm.SourceTextModule(source,{context,identifier:url.href,initializeImportMeta(meta){meta.url=url.href;}});
 modules.set(url.href,module);await module.link(specifier=>moduleFor(new URL(specifier,url)));return module;
}
const catalog=await moduleFor(new URL('/review-lab/catalog.js',origin));await catalog.evaluate();
assert.equal(requests,0,'Importing metadata must not fetch question files');
const {QUESTION_SETS,loadQuestionSet}=catalog.namespace;
const permanent=QUESTION_SETS.filter(s=>s.file);
for(const set of permanent){const bank=await loadQuestionSet(set.id);assert.equal(bank.questions.length,20);assert.equal(bank.id,set.id);}
assert.equal(requests,275);
for(const mode of ['network','missing','malformed','answer']){failure=mode;await assert.rejects(loadQuestionSet(permanent[0].id));failure=undefined;assert.equal((await loadQuestionSet(permanent[0].id)).questions.length,20);}
console.log('PASS loader fetch path: all 275 static banks lazy-load; network/404/malformed/answer-index rejection and retry work.');
