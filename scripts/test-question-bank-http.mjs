// node --experimental-vm-modules scripts/test-question-bank-http.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import http from 'node:http';
const root=new URL('../public/',import.meta.url);
let requests=0,failure;
const server=http.createServer(async(req,res)=>{
 requests++;
 try{const url=new URL(req.url,'http://localhost');const bytes=await fs.readFile(new URL('.'+url.pathname,root));res.setHeader('content-type','application/json');res.end(bytes);}
 catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const context=vm.createContext({URL,fetch:async url=>{
 if(failure==='network')throw Error('Simulated network failure');
 if(failure==='missing')return {ok:false,status:404};
 const response=await fetch(url);
 if(failure==='malformed')return {ok:true,json:async()=>{throw SyntaxError('Malformed JSON');}};
 if(failure==='answer')return {ok:true,json:async()=>{const bank=await response.json();bank.questions[0].correctAnswer=4;return bank;}};
 return response;
}});
const modules=new Map();
async function moduleFor(url){
 if(modules.has(url.href))return modules.get(url.href);
 const source=await fs.readFile(new URL('.'+url.pathname,root),'utf8');
 const module=new vm.SourceTextModule(source,{context,identifier:url.href,initializeImportMeta(meta){meta.url=url.href;}});
 modules.set(url.href,module);await module.link(specifier=>moduleFor(new URL(specifier,url)));return module;
}
try{
 const catalog=await moduleFor(new URL('/review-lab/catalog.js',origin));await catalog.evaluate();
 assert.equal(requests,0,'Importing metadata must not fetch question files');
 const {QUESTION_SETS,loadQuestionSet}=catalog.namespace;
 const permanent=QUESTION_SETS.filter(s=>s.file);
 for(const set of permanent){const bank=await loadQuestionSet(set.id);assert.equal(bank.questions.length,20);assert.equal(bank.id,set.id);}
 assert.equal(requests,250);
 for(const mode of ['network','missing','malformed','answer']){failure=mode;await assert.rejects(loadQuestionSet(permanent[0].id));failure=undefined;assert.equal((await loadQuestionSet(permanent[0].id)).questions.length,20);}
 console.log('PASS HTTP: all 250 lazy-loaded static banks, no metadata-time question requests, network/404/malformed/answer-index rejection and successful retry.');
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
