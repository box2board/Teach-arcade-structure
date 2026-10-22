import {settings,backend,readToken,sessionCookie} from '../lib/teacher/backend.js';
import {QUESTION_SETS} from '../public/review-lab/catalog.js';
import {TOOLS,CABINET_GAMES} from '../public/teacher/cabinet-catalog.js';
const setIds=new Set(QUESTION_SETS.map(s=>s.id));
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie, Origin');
 const action=req.query?.action||'session';
 const config=settings();
 const send=(status,data)=>res.status(status).json(data);
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'Method not allowed.'});}
 if(req.method==='POST'&&(!config||req.headers.origin!==config.origin))return send(config?403:503,{error:config?'Request origin rejected.':'Teacher sign-in is not configured in this preview.'});
 if(!config)return send(action==='session'?200:503,{configured:false,user:null,error:action==='session'?undefined:'Teacher sign-in is not configured.'});
 if((['login','verify','logout','save','unsave','save-item','remove-item'].includes(action)&&req.method!=='POST')||(['session','favorites','cabinet'].includes(action)&&req.method!=='GET'))return send(405,{error:'Method not allowed.'});
 let body={};
 try {body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return send(400,{error:'Invalid request.'});}
 if(JSON.stringify(body).length>2048)return send(413,{error:'Request too large.'});
 try{
  if(action==='login'||action==='verify'){
   const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
   if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return send(400,{error:'Enter a valid teacher email address.'});
   if(action==='login'){await backend('/auth/v1/otp',{method:'POST',body:{email,create_user:true}});return send(200,{ok:true});}
   if(typeof body.code!=='string'||!/^\d{6,10}$/.test(body.code))return send(400,{error:'Enter the complete numeric code from your email.'});
   const session=await backend('/auth/v1/verify',{method:'POST',body:{email,token:body.code,type:'email'}});
   if(!session?.access_token||!session.user?.id)throw new Error('Invalid session');
   res.setHeader('Set-Cookie',sessionCookie(session.access_token,session.expires_in));
   return send(200,{ok:true});
  }
  if(action==='logout'){const token=readToken(req);if(token)await backend('/auth/v1/logout?scope=local',{token,method:'POST'}).catch(()=>{});res.setHeader('Set-Cookie',sessionCookie(''));return send(200,{ok:true});}
  const token=readToken(req);
  const cabinetEnabled=process.env.TEACHER_CABINET_ENABLED==='true';
  if(!token)return send(action==='session'?200:401,{configured:true,cabinetEnabled,user:null,error:action==='session'?undefined:'Sign in to save to your Cabinet.'});
  let user;
  try{user=await backend('/auth/v1/user',{token});}catch(error){if(![401,403].includes(error.status))throw error;res.setHeader('Set-Cookie',sessionCookie(''));return send(401,{error:'Your session has ended. Please sign in again.'});}
  if(!user?.id)return send(401,{error:'Please sign in again.'});
  if(action==='session'){
   const profiles=await backend(`/rest/v1/teachers?id=eq.${encodeURIComponent(user.id)}&select=id,plan`,{token});
   if(!profiles?.length)return send(503,{error:'Teacher profile is unavailable. Check the database migration.'});
   return send(200,{configured:true,cabinetEnabled,user:{id:user.id,email:user.email,plan:profiles[0].plan}});
  }
  if(action==='favorites'){const rows=await backend(`/rest/v1/teacher_favorites?teacher_id=eq.${encodeURIComponent(user.id)}&select=public_set_id`,{token});return send(200,{ids:rows.map(r=>r.public_set_id)});}
  if(['cabinet','save-item','remove-item'].includes(action)){
   if(!cabinetEnabled)return send(503,{error:'Game and tool saving is not connected yet.'});
   const base=`/rest/v1/teacher_cabinet_items?teacher_id=eq.${encodeURIComponent(user.id)}`;
   if(action==='cabinet'){const rows=await backend(base+'&select=resource_type,resource_id',{token});return send(200,{items:rows.map(row=>({type:row.resource_type,id:row.resource_id}))});}
   const catalog=body.type==='game'?CABINET_GAMES:body.type==='tool'?TOOLS:[];
   if(!catalog.some(item=>item.id===body.id))return send(400,{error:'Unknown Cabinet resource.'});
   if(action==='save-item'){
    try{await backend('/rest/v1/teacher_cabinet_items',{token,method:'POST',body:{teacher_id:user.id,resource_type:body.type,resource_id:body.id}});}catch(error){if(error.status!==409)throw error;}
   }else await backend(base+`&resource_type=eq.${encodeURIComponent(body.type)}&resource_id=eq.${encodeURIComponent(body.id)}`,{token,method:'DELETE'});
   return send(200,{ok:true});
  }
  if(action==='save'||action==='unsave'){
   if(!setIds.has(body.setId))return send(400,{error:'Unknown public question set.'});
   if(action==='save'){
    try{await backend('/rest/v1/teacher_favorites',{token,method:'POST',body:{teacher_id:user.id,public_set_id:body.setId}});}catch(error){if(error.status!==409)throw error;}
   }else await backend(`/rest/v1/teacher_favorites?teacher_id=eq.${encodeURIComponent(user.id)}&public_set_id=eq.${encodeURIComponent(body.setId)}`,{token,method:'DELETE'});
   return send(200,{ok:true});
  }
  return send(404,{error:'Unknown account action.'});
 }catch(error){return send(error.status===429?429:502,{error:error.status===429?'Too many requests. Please wait before trying again.':['login','verify'].includes(action)?'Unable to sign in. Check your code or wait before requesting another.':'The account service is unavailable. Please try again.'});}
}
