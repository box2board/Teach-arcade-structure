import 'server-only';
import {validateConfig} from './preview-release-policy.js';
const KEY='teach_arcade_pilot';
const SLUG='teach-arcade-blocker-preview';
function settings(){
 if(process.env.DEVHQ_PREVIEW_PUBLISH_ENABLED!=='1')throw Error('Preview publishing disabled');
 const id=process.env.DEVHQ_PREVIEW_EDGE_CONFIG_ID,team=process.env.DEVHQ_PREVIEW_VERCEL_TEAM_ID,token=process.env.DEVHQ_PREVIEW_VERCEL_TOKEN;
 if(!/^ecfg_[a-zA-Z0-9]+$/.test(id??'')||!/^team_[a-zA-Z0-9]+$/.test(team??'')||!token)throw Error('Preview store not configured');
 return {id,team,token};
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
 const cfg=await verifiedTarget(),item=await request(cfg,'/item/'+KEY);
 if(item.key!==KEY||JSON.stringify(validateConfig(item.value))!==JSON.stringify(validateConfig(before)))throw Error('Preview configuration changed');
 await request(cfg,'/items',{method:'PATCH',body:JSON.stringify({items:[{operation:'update',key:KEY,value:validateConfig(after)}]})});
 const observed=await request(cfg,'/item/'+KEY);
 if(observed.key!==KEY||JSON.stringify(validateConfig(observed.value))!==JSON.stringify(validateConfig(after)))throw Error('Preview configuration not verified');
}
