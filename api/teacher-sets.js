import {settings,backend,authenticate} from '../lib/teacher/backend.js';
import {setInput,teacherSetId} from '../public/teacher/set-contract.js';
const metadata='id,owner_id,title,description,subject,visibility,question_count,revision,updated_at';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie, Origin');
 const send=(status,data)=>res.status(status).json(data),config=settings(),action=req.query?.action||'public';
 const reads=['public','mine','saved','detail'];
 const writes=['create','update','copy','save','unsave'];
 if(!reads.includes(action)&&!writes.includes(action))return send(404,{error:'Unknown question-set action.'});
 if(req.method!==(reads.includes(action)?'GET':'POST'))return send(405,{error:'Method not allowed.'});
 if(!config)return send(503,{error:'Teacher-created sets are not connected in this environment.'});
 if(req.method==='POST'&&req.headers.origin!==config.origin)return send(403,{error:'Request origin rejected.'});
 let body={};
 try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return send(400,{error:'Invalid request.'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return send(400,{error:'Invalid request.'});
 if(Buffer.byteLength(JSON.stringify(body),'utf8')>256000)return send(413,{error:'This set is too large. Shorten the question text.'});
 const id=req.method==='GET'?req.query?.id:body.id;
 if(['detail','update','copy','save','unsave'].includes(action)&&!teacherSetId(id))return send(400,{error:'Invalid question-set link.'});
 try{
  const {token,user}=await authenticate(req,res);
  if(!['public','detail'].includes(action)&&!user?.id)return send(401,{error:'Sign in to create or save question sets.'});
  const options={...(token?{token}:{})},base='/rest/v1/teacher_question_sets';
  const get=async()=>{const rows=await backend(`${base}?id=eq.${id}&select=*`,options);return rows[0];};
  if(['public','mine','saved'].includes(action)){
   const offset=Number(req.query?.offset||0);
   if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return send(400,{error:'Invalid page.'});
   const term=String(req.query?.q||'').slice(0,100).replace(/[^\p{L}\p{N}\s-]/gu,' ').trim();
   const search=term?`&title=ilike.${encodeURIComponent('*'+term+'*')}`:'';
   const query=`&select=${metadata}&order=updated_at.desc,id.asc&limit=25&offset=${offset}${search}`;
   if(action==='saved'){
    const rows=await backend(`/rest/v1/teacher_set_saves?teacher_id=eq.${user.id}&select=teacher_question_sets!inner(${metadata})&order=created_at.desc,set_id.asc&limit=25&offset=${offset}${term?'&teacher_question_sets.title=ilike.'+encodeURIComponent('*'+term+'*'):''}`,options);
    return send(200,{sets:rows.map(r=>r.teacher_question_sets)});
   }
   const rows=await backend(`${base}?${action==='mine'?'owner_id=eq.'+user.id:'visibility=eq.public'}${query}`,options);
   return send(200,{sets:rows});
  }
  if(action==='create'){
   const input=setInput({...body,visibility:'private'});delete input.visibility;
   const rows=await backend(base,{...options,method:'POST',body:input});return send(201,{set:rows[0]});
  }
  if(action==='unsave'){
   await backend(`/rest/v1/teacher_set_saves?teacher_id=eq.${user.id}&set_id=eq.${id}`,{...options,method:'DELETE'});return send(200,{ok:true});
  }
  const current=await get();
  if(!current)return send(404,{error:'This set is private or is no longer available.'});
  if(action==='detail')return send(200,{set:current});
  if(action==='copy'){
   const input=setInput({...current,title:(current.title+' (copy)').slice(0,120),visibility:'private'});delete input.visibility;
   const rows=await backend(base,{...options,method:'POST',body:input});return send(201,{set:rows[0]});
  }
  if(action==='save'){
   try{await backend('/rest/v1/teacher_set_saves',{...options,method:'POST',body:{set_id:id}});}catch(error){if(error.status!==409)throw error;}
   return send(200,{ok:true});
  }
  if(current.owner_id!==user.id)return send(403,{error:'Only the creator can edit this set. Make a private copy to change it.'});
  if(!Number.isInteger(body.revision)||body.revision!==current.revision)return send(409,{error:'This set changed in another tab. Your edits are still here. Reload the saved version before replacing it.'});
  const input=setInput({...current,...body});
  const rows=await backend(`${base}?id=eq.${id}&owner_id=eq.${user.id}&revision=eq.${body.revision}`,{...options,method:'PATCH',body:input});
  if(!rows.length)return send(409,{error:'This set changed in another tab. Your edits are still here. Reload the saved version before replacing it.'});
  return send(200,{set:rows[0]});
 }catch(error){
  return send(error.status===400?400:error.status===429?429:502,{error:error.status===400?error.message:error.status===429?'Please wait before trying again.':'Question sets could not load or save. Your edits are still on this page; please try again.'});
 }
}
