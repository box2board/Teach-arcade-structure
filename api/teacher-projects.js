import {settings, authenticate, backend} from '../lib/teacher/backend.js';
import {tools, partSize, partLimit, validId, validTitle} from '../public/teacher/project-contract.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const send = (status, data) => res.status(status).json(data);
  const {action, id, part} = req.query || {};
  const config = settings();
  const enabled = Boolean(config && process.env.TEACHER_PROJECTS_ENABLED === 'true');
  if (req.method === 'GET' && action === 'availability') return send(200,{enabled});
  if (!enabled) return send(503,{error:'Project saving is unavailable here.'});
  const read = ['list','open','part'].includes(action);
  if (req.method !== (read ? 'GET' : 'POST')) return send(405,{error:'Method not allowed.'});
  if (!read && req.headers.origin !== config.origin) return send(403,{error:'Request origin rejected.'});
  const conflict = () => send(409,{error:'This project changed in another tab. Save a copy to keep these edits.'});
  try {
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}; }
    catch { return send(400,{error:'Invalid request.'}); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return send(400,{error:'Invalid request.'});
    const {token,user} = await authenticate(req,res);
    if (!user?.id) return send(401,{error:'Sign in to use My Projects.'});
    const rpc = (name, body) => backend('/rest/v1/rpc/'+name,{token,method:'POST',body});
    const path = '/rest/v1/cabinet_projects';
    const fields = 'id,tool,title,revision,size,updated_at';
    const target = path+'?id=eq.'+(read?id:body.id);
    if (action === 'list') {
      const offset = Number(req.query.offset || 0);
      if (!Number.isSafeInteger(offset) || offset < 0) return send(400,{error:'Invalid page.'});
      const rows = await backend(path+'?select='+fields+'&order=updated_at.desc,id.asc&limit=26&offset='+offset,{token});
      return send(200,{projects:rows.slice(0,25),more:rows.length>25});
    }
    if (action === 'stage') {
      if (!validId(body.upload) || !Number.isInteger(body.part) || body.part<0 || body.part>=partLimit ||
          typeof body.data !== 'string' || !body.data.length || body.data.length>partSize*4/3 ||
          body.data.length%4 || /[^A-Za-z0-9+/=]/.test(body.data)) return send(400,{error:'Invalid project upload.'});
      await rpc('cabinet_stage',{upload:body.upload,part:body.part,encoded:body.data});
      return send(200,{ok:true});
    }
    if (!validId(read?id:body.id)) return send(400,{error:'Invalid project.'});
    if (action === 'open') {
      const [project] = await backend(target+'&select='+fields,{token});
      return project ? send(200,{project}) : send(404,{error:'Project unavailable.'});
    }
    const rev = read ? Number(req.query.revision) : body.revision;
    if (!Number.isInteger(rev) || rev < (action==='save'?0:1) || rev>=2147483647) return send(400,{error:'Invalid revision.'});
    if (action === 'part') {
      const index = Number(part);
      if (!Number.isInteger(index) || index<0 || index>=partLimit) return send(400,{error:'Invalid project part.'});
      const data = await rpc('cabinet_read',{project_id:id,expected:rev,part:index});
      return data ? send(200,{data}) : conflict();
    }
    if (action === 'save') {
      if (!Object.hasOwn(tools,body.tool) || !validId(body.upload) || !validTitle(body.title) ||
          !Number.isInteger(body.parts) || body.parts<1 || body.parts>partLimit) return send(400,{error:'Invalid project details.'});
      const project = await rpc('cabinet_save',{project_id:body.id,upload:body.upload,project_tool:body.tool,project_title:body.title.trim(),expected:rev,parts:body.parts});
      return project ? send(200,{project}) : conflict();
    }
    if (action === 'duplicate') {
      if (!validId(body.copy)) return send(400,{error:'Invalid project copy.'});
      const project = await rpc('cabinet_duplicate',{project_id:body.id,copy_id:body.copy,expected:rev});
      return project ? send(200,{project}) : conflict();
    }
    const filtered = target+'&revision=eq.'+rev+'&select='+fields;
    if (action === 'rename') {
      if (!validTitle(body.title)) return send(400,{error:'Enter a project name of 1–120 characters.'});
      const [project] = await backend(filtered,{token,method:'PATCH',body:{title:body.title.trim(),revision:rev+1,updated_at:new Date().toISOString()}});
      return project ? send(200,{project}) : conflict();
    }
    if (action === 'delete') {
      const [project] = await backend(filtered,{token,method:'DELETE'});
      return project ? send(200,{ok:true}) : conflict();
    }
    return send(404,{error:'Unknown action.'});
  } catch (error) {
    if (error.status===409) return conflict();
    return send(error.status===429?429:502,{error:'Project service could not complete the request. Please try again.'});
  }
}
