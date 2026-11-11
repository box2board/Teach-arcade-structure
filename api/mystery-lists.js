import {settings,backend,authenticate} from '../lib/teacher/backend.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Vary','Cookie, Origin');
 const config=settings();const send=(status,data)=>res.status(status).json(data);
 if(!['GET','POST','DELETE'].includes(req.method))return send(405,{error:'Method not allowed'});
 if(!config)return send(503,{error:'Teacher accounts unavailable'});
 if(req.method!=='GET'&&req.headers.origin!==config.origin)return send(403,{error:'Origin rejected'});
 try{
  const {token,user}=await authenticate(req,res);
  if(!user?.id)return send(401,{error:'Sign in to Teacher HQ to save lists'});
  const base='/rest/v1/teacher_mystery_lists';
  if(req.method==='GET'){
   const rows=await backend(base+'?teacher_id=eq.'+encodeURIComponent(user.id)+'&select=id,title,entries,updated_at&order=updated_at.desc&limit=100',{token});
   return send(200,{lists:rows});
  }
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  if(JSON.stringify(body).length>100000)return send(413,{error:'List too large'});
  if(req.method==='POST'){
   const title=String(body.title||'').trim(),entries=body.entries;
   if(title.length<1||title.length>100||!Array.isArray(entries)||entries.length<1||entries.length>200||entries.some(e=>typeof e!=='string'||!e.trim()||e.length>400))
    return send(400,{error:'Use a title and 1–200 nonempty entries (400 characters each maximum)'});
   const payload={teacher_id:user.id,title,entries:entries.map(e=>e.trim()),updated_at:new Date().toISOString()};
   if(body.id){
    if(!/^[0-9a-f-]{36}$/i.test(body.id))return send(400,{error:'Invalid list ID'});
    await backend(base+'?id=eq.'+encodeURIComponent(body.id)+'&teacher_id=eq.'+encodeURIComponent(user.id),{token,method:'PATCH',body:payload});
   }else await backend(base,{token,method:'POST',body:payload});
   return send(200,{ok:true});
  }
  if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id))return send(400,{error:'Invalid list ID'});
  await backend(base+'?id=eq.'+encodeURIComponent(body.id)+'&teacher_id=eq.'+encodeURIComponent(user.id),{token,method:'DELETE'});
  return send(200,{ok:true});
 }catch(e){return send(e.status===404?503:502,{error:'Unable to access saved lists right now'});}
}