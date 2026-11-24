import 'server-only';
import {directEnabled,TEAM,STORE,inspectDirect} from './direct-vercel.js';
import {validateConfig} from './preview-release-policy.js';
const KEY='teach_arcade_pilot';
const SLUG='teach-arcade-blocker-preview';
function settings(){
 if(!directEnabled())throw Error('Preview publishing disabled');
 return {id:STORE,team:TEAM,token:process.env.DEVHQ_PREVIEW_VERCEL_TOKEN};
}
async function request(cfg,suffix='',options={}){
 const url=new URL('https://api.vercel.com/v1/edge-config/'+cfg.id+suffix);
 url.searchParams.set('teamId',cfg.team);
 const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+cfg.token,'Content-Type':'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Preview configuration request failed');
 return response.json();
}
async function verifiedTarget(){
 const cfg=settings(),meta=await request(cfg);
 if(meta.id!==cfg.id||meta.slug!==SLUG)throw Error('Target is not the dedicated preview store');
 return cfg;
}
export async function readPreview(){
 const cfg=await verifiedTarget(),item=await request(cfg,'/item/'+KEY);
 if(item.key!==KEY)throw Error('Wrong config item');
 return validateConfig(item.value);
}
export async function writePreview(before,after){
 const diagnostics=await inspectDirect();
 if(!diagnostics.configured)throw Error('Public preview configuration is not verified');
 const cfg=await verifiedTarget(),item=await request(cfg,'/item/'+KEY);
 if(item.key!==KEY||JSON.stringify(validateConfig(item.value))!==JSON.stringify(validateConfig(before)))throw Error('Preview configuration changed');
 await request(cfg,'/items',{method:'PATCH',body:JSON.stringify({items:[{operation:'update',key:KEY,value:validateConfig(after)}]})});
 const observed=await request(cfg,'/item/'+KEY);
 if(observed.key!==KEY||JSON.stringify(validateConfig(observed.value))!==JSON.stringify(validateConfig(after)))throw Error('Preview configuration not verified');
}
