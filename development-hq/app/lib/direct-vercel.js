import 'server-only';
import {validateConfig} from './preview-release-policy.js';
export const TEAM='team_NirDV3d21APaLS7d8ZtZNun9';
export const STORE='ecfg_2179bzbbgxjq6ry1pruzbbdhbsii';
export const PUBLIC_PROJECT='prj_KO3pFwWNbdH8k8qANX6IhrJfmL2l';
export const PUBLIC_BRANCH='prototype/public-feature-blockers';
export const HQ_BRANCH='prototype/devhq-launch-feature-management';
export const STORE_PATH='/v1/edge-config/'+STORE;
const ITEM='teach_arcade_pilot';
const ENV_KEYS=['TA_FEATURE_GATE_ENABLED','TA_FEATURE_CONFIG_URL'];
export function directEnabled(){return process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_GIT_COMMIT_REF===HQ_BRANCH&&Boolean(process.env.DEVHQ_PREVIEW_VERCEL_TOKEN);}
async function directRequest(path,{method='GET',body,query={}}={}){
 if(!directEnabled())throw Error('Direct preview connection not enabled');
 const url=new URL('https://api.vercel.com'+path);
 url.searchParams.set('teamId',TEAM);
 for(const [k,v] of Object.entries(query))url.searchParams.set(k,v);
 const res=await fetch(url,{method,body:body===undefined?undefined:JSON.stringify(body),headers:{Authorization:'Bearer '+process.env.DEVHQ_PREVIEW_VERCEL_TOKEN,'Content-Type':'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!res.ok)throw Error('Vercel HTTP '+res.status);
 return res.status===204?null:res.json();
}
async function verifyStoreIdentity(){
 const store=await directRequest(STORE_PATH);
 if(store.id!==STORE||store.slug!=='teach-arcade-blocker-preview')throw Error('Unexpected preview store');
}
async function readItem(){
 const item=await directRequest(STORE_PATH+'/item/'+ITEM);
 if(item?.key!==ITEM||item.edgeConfigId!==STORE)throw Error('Unexpected config item');
 return validateConfig(item.value);
}
export async function verifyStore(){
 await verifyStoreIdentity();
 return readItem();
}
export async function writeStore(before,after){
 const expected=validateConfig(before), proposed=validateConfig(after);
 await verifyStoreIdentity();
 if(JSON.stringify(await readItem())!==JSON.stringify(expected))throw Error('Preview configuration changed');
 await directRequest(STORE_PATH+'/items',{method:'PATCH',body:{items:[{operation:'update',key:ITEM,value:proposed}]}});
 if(JSON.stringify(await readItem())!==JSON.stringify(proposed))throw Error('Preview configuration not verified');
}
async function verifyPublic(){
 const p=await directRequest('/v9/projects/'+PUBLIC_PROJECT);
 if(p.id!==PUBLIC_PROJECT||p.name!=='teach-arcade-structure'||p.link?.type!=='github'||p.link?.org!=='box2board'||p.link?.repo?.toLowerCase()!=='teach-arcade-structure'||!p.link?.productionBranch||p.link.productionBranch===PUBLIC_BRANCH)throw Error('Public project or branch identity mismatch');
 return p;
}
async function verifyHQ(){
 const p=await directRequest('/v9/projects/teach-arcade-development-hq');
 if(p.name!=='teach-arcade-development-hq'||p.rootDirectory!=='development-hq/app'||p.link?.type!=='github'||p.link?.org!=='box2board'||p.link?.repo?.toLowerCase()!=='teach-arcade-structure'||!p.link?.productionBranch||p.link.productionBranch===HQ_BRANCH||(process.env.VERCEL_PROJECT_ID&&p.id!==process.env.VERCEL_PROJECT_ID))throw Error('HQ project or branch identity mismatch');
 return p;
}
async function envState(){
 const data=await directRequest('/v10/projects/'+PUBLIC_PROJECT+'/env',{query:{gitBranch:PUBLIC_BRANCH,decrypt:'false'}});
 if(!Array.isArray(data.envs))throw Error('Unexpected environment response');
 const found=data.envs.filter(e=>ENV_KEYS.includes(e.key)&&e.gitBranch===PUBLIC_BRANCH&&Array.isArray(e.target)&&e.target.length===1&&e.target[0]==='preview');
 return found.map(e=>e.key);
}
export async function inspectDirect(){
 if(!directEnabled())return {enabled:false,checks:[],configured:false};
 const work=[['Existing HQ project',verifyHQ],['Existing public project',verifyPublic],['Dedicated preview config',verifyStore],['Public preview variables',envState]];
 const checks=await Promise.all(work.map(async ([name,fn])=>{try{const data=await fn();return {name,ok:true,detail:name==='Public preview variables'?data.length+' of 2 branch-specific keys present':'Verified',configured:name==='Public preview variables'&&ENV_KEYS.every(k=>data.includes(k))};}catch(e){return {name,ok:false,detail:/^Vercel HTTP \d{3}$/.test(e.message)?e.message:'Verification failed'};}}));
 return {enabled:true,checks,configured:checks.every(x=>x.ok)&&checks[3].configured,ready:checks.every(x=>x.ok),partial:checks[3].ok&&!checks[3].configured&&checks[3].detail!=='0 of 2 branch-specific keys present'};
}
export async function connectPublicPreview(){
 // No production target, no arbitrary project, no overwrite, no deployment.
 await Promise.all([verifyHQ(),verifyPublic(),verifyStore()]);
 const existing=await envState();
 if(ENV_KEYS.every(k=>existing.includes(k)))return 'already-present';
 if(existing.length)throw Error('Partial setup; inspect existing variables before retrying');
 const result=await directRequest(STORE_PATH+'/token',{method:'POST',body:{label:'Teach Arcade public blocker preview'}});
 if(typeof result.token!=='string'||result.token.length<12)throw Error('Read token not returned');
 const readUrl=new URL('https://edge-config.vercel.com/'+STORE+'/item/'+ITEM);
 readUrl.searchParams.set('token',result.token);
 // Verify the runtime read credential before writing it into the deployment configuration.
 const response=await fetch(readUrl,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Runtime read verification failed');
 validateConfig(await response.json());
 await directRequest('/v10/projects/'+PUBLIC_PROJECT+'/env',{method:'POST',body:[{key:'TA_FEATURE_GATE_ENABLED',value:'1',type:'encrypted',target:['preview'],gitBranch:PUBLIC_BRANCH},{key:'TA_FEATURE_CONFIG_URL',value:readUrl.toString(),type:'encrypted',target:['preview'],gitBranch:PUBLIC_BRANCH}]});
 const observed=await envState();
 if(!ENV_KEYS.every(k=>observed.includes(k)))throw Error('Preview environment not verified');
 return 'configured';
}
