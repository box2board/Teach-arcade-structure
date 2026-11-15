import {partSize, validId, tools} from './project-contract.js';

export async function request(action, body = {}, write = false) {
  const query = new URLSearchParams({action,...(!write && body)});
  const response = await fetch('/api/teacher-projects?'+query,{
    signal:AbortSignal.timeout(20000),
    method:write?'POST':'GET',
    ...(write?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw Object.assign(new Error(data.error||'Project saving is unavailable.'),{status:response.status});
  return data;
}

export function bindProject(anchor, {tool,snapshot,restore,title,onOpenError}) {
  if (!anchor) return ()=>{};
  const initialId = new URL(location.href).searchParams.get('cabinetProject');
  let project, pending, busy=false;
  const button = document.createElement('button');
  button.type='button';
  button.hidden=true;
  button.textContent='Save to Cabinet';
  anchor.after(button);

  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','cabinet-save-title');
  dialog.innerHTML=`<form>
    <h2 id="cabinet-save-title">Save to Arcade Cabinet</h2>
    <label>Project name <input name="projectTitle" required maxlength="120"></label>
    <p role="status">Only your teacher account can open this project.</p>
    <button type="submit">Save project</button> <button type="button" data-copy hidden>Save a copy</button>
    <button type="button" data-close>Close</button>
    <p><a href="/teacher/#projects" target="_blank" rel="noopener">Open My Projects</a></p>
    <p><a href="/teacher/#account" target="_blank" rel="noopener" data-sign-in hidden>Sign in to Teach Arcade</a></p>
  </form>`;
  dialog.className='cabinet-save-dialog';
  const style=document.createElement('link');
  style.rel='stylesheet';style.href='/teacher/project-dialog.css';
  document.head.append(style);
  document.body.append(dialog);
  const form=dialog.querySelector('form'), input=form.elements.projectTitle;
  const status=dialog.querySelector('[role=status]'), signIn=dialog.querySelector('[data-sign-in]');
  const copy=dialog.querySelector('[data-copy]'), close=dialog.querySelector('[data-close]');
  const message=(text,auth=false)=>{status.textContent=text;signIn.hidden=!auth;};
  const open=()=>{
    input.value=(project?.title||title?.()||tools[tool][0]).slice(0,120);
    copy.hidden=!project;
    if (!dialog.open) dialog.showModal();
  };
  button.onclick=open;
  close.onclick=()=>{if (!busy) dialog.close();};
  dialog.oncancel=event=>{if(busy)event.preventDefault();};
  const save=async asCopy=>{
    if (busy||!form.reportValidity()) return;
    const name=input.value.trim();
    if (!name) return message('Enter a project name.');
    busy=true;
    message('Saving…');
    try {
      const content=JSON.stringify(snapshot());
      const bytes=new TextEncoder().encode(content);
      if (bytes.length>26*1024*1024) throw Error('This project is too large. Keep an editable local copy.');
      const revision=asCopy?0:project?.revision||0;
      const key=JSON.stringify([asCopy,project?.id,revision,name]);
      if (pending?.key!==key || pending.content!==content) {
        pending={key,content,id:asCopy||!project?crypto.randomUUID():project.id,upload:crypto.randomUUID()};
      }
      const parts=Math.ceil(bytes.length/partSize);
      for(let part=0;part<parts;part++){
        const chunk=bytes.subarray(part*partSize,(part+1)*partSize);
        let binary='';
        for(let i=0;i<chunk.length;i+=8192) binary+=String.fromCharCode(...chunk.subarray(i,i+8192));
        await request('stage',{upload:pending.upload,part,data:btoa(binary)},true);
      }
      const saved=await request('save',{id:pending.id,upload:pending.upload,tool,title:name,revision,parts},true);
      project=saved.project;
      pending=null;
      copy.hidden=false;
      message('Saved to Arcade Cabinet.');
    } catch(error) {
      message(error.message,error.status===401);
    } finally {busy=false;}
  };
  form.onsubmit=event=>{event.preventDefault();void save(false);};
  copy.onclick=()=>void save(true);

  async function initialize(){
    const {enabled}=await request('availability');
    button.hidden=!enabled;
    if (!enabled) throw Error('Project saving is unavailable here.');
    if (!validId(initialId)) return;
    const opened=(await request('open',{id:initialId})).project;
    if (opened.tool!==tool) throw Error('Open this project from My Projects.');
    const bytes=new Uint8Array(opened.size);
    for(let index=0;index*partSize<bytes.length;index++){
      const {data}=await request('part',{id:initialId,revision:opened.revision,part:index});
      const binary=atob(data);
      if(binary.length!==Math.min(partSize,bytes.length-index*partSize)) throw Error('The project download was incomplete.');
      bytes.set(Uint8Array.from(binary,char=>char.charCodeAt(0)),index*partSize);
    }
    restore(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
    project=opened;
  }
  if (validId(initialId)) {
    dialog.showModal();
    busy=true;
    message('Opening project…');
  }
  initialize().then(()=>{
    if (validId(initialId) && dialog.open) dialog.close();
  }).catch(error=>{
    if (!validId(initialId)) return;
    message(error.message,error.status===401);
    if(onOpenError)dialog.addEventListener('close',onOpenError,{once:true});
  }).finally(()=>{busy=false;});
  return ()=>{project=null;pending=null;};
}
