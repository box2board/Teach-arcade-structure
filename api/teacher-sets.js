import {settings,backend,authenticate} from '../lib/teacher/backend.js';
import {SET_SUBJECTS,setInput,teacherSetId} from '../public/teacher/set-contract.js';
const metadata='id,owner_id,title,description,subject,topic,primary_grade,grade_band,difficulty,visibility,question_count,revision,updated_at,moderation_hidden';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie, Origin');
 const send=(status,data)=>res.status(status).json(data),config=settings(),action=req.query?.action||'public';
 const reads=['public','mine','saved','detail'],writes=['create','update','copy','save','unsave','report'];
 if(!reads.includes(action)&&!writes.includes(action))return send(404,{error:'Unknown question-set action.'});
 if(req.method!==(reads.includes(action)?'GET':'POST'))return send(405,{error:'Method not allowed.'});
 if(!config)return send(503,{error:'Teacher-created sets are not connected in this environment.'});
 if(req.method==='POST'&&req.headers.origin!==config.origin)return send(403,{error:'Request origin rejected.'});
 let body={};try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return send(400,{error:'Invalid request.'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return send(400,{error:'Invalid request.'});
 if(Buffer.byteLength(JSON.stringify(body),'utf8')>256000)return send(413,{error:'This set is too large. Shorten the question text.'});
 const id=req.method==='GET'?req.query?.id:body.id;
 if(['detail','update','copy','save','unsave','report'].includes(action)&&!teacherSetId(id))return send(400,{error:'Invalid question-set link.'});
 try{
  const {token,user}=await authenticate(req,res);
  if(!['public','detail'].includes(action)&&!user?.id)return send(401,{error:'Sign in to create or save question sets.'});
  const options={...(token?{token}:{})},base='/rest/v1/teacher_question_sets';
  const getById=async setId=>(await backend(`${base}?id=eq.${setId}&select=${metadata}`,options))[0];
  const withQuestions=async set=>{if(!set)return set;const items=await backend(`/rest/v1/teacher_question_set_items?set_id=eq.${set.id}&select=position,question_version_id,source_attribution,question_content_versions!inner(question,source_key)&order=position.asc`,options);return {...set,questions:items.map(item=>{const v=Array.isArray(item.question_content_versions)?item.question_content_versions[0]:item.question_content_versions;return {...v.question,_versionId:item.question_version_id,_sourceKey:v.source_key,_attribution:item.source_attribution};})};};
  const rpc=(name,payload)=>backend(`/rest/v1/rpc/${name}`,{...options,method:'POST',body:payload});
  if(['public','mine','saved'].includes(action)){
   const offset=Number(req.query?.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return send(400,{error:'Invalid page.'});
   const term=String(req.query?.q||'').slice(0,100).replace(/[^\p{L}\p{N}\s-]/gu,' ').trim().split(/\s+/).filter(Boolean).join('*'),pattern=encodeURIComponent('*'+term+'*');
   const discover=action==='public'&&req.query?.search==='catalog';
   const search=discover&&term?`&or=(title.ilike.${pattern},description.ilike.${pattern},subject.ilike.${pattern},topic.ilike.${pattern})`:term?`&title=ilike.${pattern}`:'';
   const subject=discover&&SET_SUBJECTS.includes(req.query?.subject)?`&subject=eq.${encodeURIComponent(req.query.subject)}`:'';
   const topic=discover&&req.query?.topic?`&topic=ilike.${encodeURIComponent('*'+String(req.query.topic).slice(0,100)+'*')}`:'';
   const grade=discover&&req.query?.primaryGrade?`&primary_grade=eq.${encodeURIComponent(String(req.query.primaryGrade).slice(0,16))}`:'';
   const grades=discover&&req.query?.gradeBand==='elementary'?'&primary_grade=in.(K,1,2,3,4,5)':'';
   const band=discover&&req.query?.gradeBand&&req.query.gradeBand!=='elementary'?`&grade_band=eq.${encodeURIComponent(String(req.query.gradeBand).slice(0,24))}`:'';
   const difficulty=discover&&req.query?.difficulty?`&difficulty=eq.${encodeURIComponent(String(req.query.difficulty).slice(0,32))}`:'';
   const query=`&select=${metadata}&order=updated_at.desc,id.asc&limit=25&offset=${offset}${search}${subject}${topic}${grade}${grades}${band}${difficulty}`;
   if(action==='saved'){const rows=await backend(`/rest/v1/teacher_set_saves?teacher_id=eq.${user.id}&select=teacher_question_sets!inner(${metadata})&order=created_at.desc,set_id.asc&limit=25&offset=${offset}${term?'&teacher_question_sets.title=ilike.'+pattern:''}`,options);return send(200,{sets:rows.map(r=>r.teacher_question_sets)});}
   const rows=await backend(`${base}?${action==='mine'?'owner_id=eq.'+user.id:'visibility=eq.public&moderation_hidden=eq.false'}${query}`,options);return send(200,{sets:rows});
  }
  if(action==='create'){
   const input=setInput(body),r=await rpc('create_teacher_question_set_v2',{p_metadata:input,p_questions:input.questions,p_versions:input.question_version_ids,p_sources:input.question_source_keys,p_attrs:input.attributions});
   return send(201,{set:await withQuestions(await getById(r.id))});
  }
  if(action==='unsave'){await backend(`/rest/v1/teacher_set_saves?teacher_id=eq.${user.id}&set_id=eq.${id}`,{...options,method:'DELETE'});return send(200,{ok:true});}
  const current=await getById(id);if(!current)return send(404,{error:'This set is private or is no longer available.'});
  if(action==='detail')return send(200,{set:await withQuestions(current)});
  if(action==='report'){
   if(current.visibility!=='public'||current.moderation_hidden||current.owner_id===user.id)return send(400,{error:'Only another teacher’s public set can be reported.'});
   if(!['incorrect','inappropriate','copyright','personal-data','other'].includes(body.reason))return send(400,{error:'Choose a report reason.'});
   try{await backend('/rest/v1/teacher_set_reports',{...options,method:'POST',body:{set_id:id,reason:body.reason}});}catch(e){if(e.status!==409)throw e;}return send(200,{ok:true});
  }
  if(action==='copy'){const r=await rpc('copy_teacher_question_set_v2',{p_source:id,p_title:(current.title+' (copy)').slice(0,120)});return send(201,{set:await withQuestions(await getById(r.id))});}
  if(action==='save'){try{await backend('/rest/v1/teacher_set_saves',{...options,method:'POST',body:{set_id:id}});}catch(e){if(e.status!==409)throw e;}return send(200,{ok:true});}
  if(current.owner_id!==user.id)return send(403,{error:'Only the creator can edit this set. Make a private copy to change it.'});
  if(!Number.isInteger(body.revision)||body.revision!==current.revision)return send(409,{error:'This set changed in another tab. Your edits are still here. Reload the saved version before replacing it.'});
  const input=setInput({...current,...body}),r=await rpc('update_teacher_question_set_v2',{p_id:id,p_revision:body.revision,p_metadata:input,p_questions:input.questions,p_versions:input.question_version_ids,p_sources:input.question_source_keys,p_attrs:input.attributions});
  if(r.conflict)return send(409,{error:'This set changed in another tab. Your edits are still here. Reload the saved version before replacing it.'});return send(200,{set:await withQuestions(await getById(id))});
 }catch(error){return send(error.status===400?400:error.status===429?429:502,{error:error.status===400?error.message:error.status===429?'Please wait before trying again.':'Question sets could not load or save. Your edits are still on this page; please try again.'});}
}
