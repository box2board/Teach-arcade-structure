import {request} from './project-client.js';
import {tools} from './project-contract.js';

export function mountProjects(root) {
  const list=root.querySelector('[data-project-list]');
  const status=root.querySelector('[role=status]');
  const refresh=root.querySelector('[data-project-refresh]');
  const more=root.querySelector('[data-project-more]');
  let owner, generation=0;
  const errorText=error=>error.status===401?'Sign in again to open your projects.':error.message;

  function card(project) {
    const item=document.createElement('article'), heading=document.createElement('h2');
    const type=document.createElement('p'), resume=document.createElement('a'), actions=document.createElement('div');
    item.className='topic-card';
    heading.textContent=project.title;
    type.textContent=tools[project.tool][0]+' · '+new Date(project.updated_at).toLocaleDateString();
    resume.href=tools[project.tool][1]+'?cabinetProject='+encodeURIComponent(project.id);
    resume.textContent='Resume';
    actions.className='tabs';
    actions.append(resume);
    for(const [action,label] of [['rename','Rename'],['duplicate','Duplicate'],['delete','Delete']]){
      const button=document.createElement('button');
      button.type='button';
      button.textContent=label;
      button.onclick=async()=>{
        const body={id:project.id,revision:project.revision};
        if(action==='rename'){
          body.title=prompt('Project name',project.title);
          if(body.title===null)return;
        }
        if(action==='delete'&&!confirm('Delete “'+project.title+'” from My Projects?'))return;
        if(action==='duplicate')body.copy=crypto.randomUUID();
        const active=owner;
        button.disabled=true;
        try{
          await request(action,body,true);
          if(active===owner) await load();
        }catch(error){
          if(active===owner)status.textContent=errorText(error);
        }finally{button.disabled=false;}
      };
      actions.append(button);
    }
    item.append(heading,type,actions);
    return item;
  }

  async function load(offset=0){
    const sequence=++generation;
    refresh.disabled=true;
    more.disabled=true;
    status.textContent='Loading your projects…';
    try{
      const page=await request('list',{offset});
      if(sequence!==generation)return;
      if(!offset)list.replaceChildren();
      list.append(...page.projects.map(card));
      more.hidden=!page.more;
      more.onclick=()=>load(offset+page.projects.length);
      status.textContent=list.childElementCount?'':'Use Save to Cabinet in an editor to add your first project.';
    }catch(error){
      if(sequence!==generation)return;
      status.textContent=errorText(error);
      if(error.status===401){list.replaceChildren();more.hidden=true;}
    }finally{
      if(sequence===generation)refresh.disabled=more.disabled=false;
    }
  }

  refresh.onclick=()=>load();
  window.addEventListener('pageshow',event=>{if(event.persisted&&owner&&!root.hidden)void load();});
  return (user,enabled)=>{
    if(root.hidden||!enabled||!user){
      ++generation;
      owner=null;
      list.replaceChildren();
      refresh.hidden=more.hidden=true;
      status.textContent=enabled?'Sign in to open your projects.':'Project saving is unavailable here.';
      return;
    }
    refresh.hidden=false;
    if(owner!==user.id){owner=user.id;void load();}
  };
}
