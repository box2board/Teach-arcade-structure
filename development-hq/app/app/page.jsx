import { requireAdmin } from '../lib/neon';
import { createTask, updateTaskStatus, signOut, updateProject, createProject } from './actions';
import CopyTask from './CopyTask';
import { getGitHubStatus, getVercelStatus } from '../lib/integrations';
import { PROJECTS, getProjectAreas } from '../lib/projects';

export const dynamic = 'force-dynamic';
const categories = ['Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA'];
const statusLabels = { draft:'Draft', ready:'Ready', in_progress:'In progress', review:'Needs review', complete:'Complete', archived:'Archived' };
const queueFilters = [
  { id:'active', label:'Active' }, { id:'draft', label:'Draft' }, { id:'ready', label:'Ready' },
  { id:'in_progress', label:'In progress' }, { id:'review', label:'Needs review' }, { id:'complete', label:'Complete' },
];

export default async function Home({ searchParams }) {
  const { user, sql } = await requireAdmin();
  const [github, vercel] = await Promise.all([getGitHubStatus(), getVercelStatus()]);
  let tasks = [], projects = [], databaseError = false, projectDatabaseError = false;
  try {
    tasks = await sql`SELECT t.id, COALESCE(p.name, t.project) AS project, t.project_id,
        t.category, t.description, t.status, t.mode, t.created_at
      FROM devhq_tasks t LEFT JOIN devhq_projects p ON p.id=t.project_id AND p.owner_id=t.owner_id
      WHERE t.owner_id=${user.id} AND t.status <> 'archived'
      ORDER BY t.created_at DESC LIMIT 100`;
  } catch {
    databaseError = true;
  }
  try { projects = await getProjectAreas(sql,user.id); }
  catch {
    projectDatabaseError = true;
    projects = PROJECTS.filter(project=>!project.unassigned).map((project,index)=>({
      id:`unavailable-${index}`,slug:project.id,name:project.name,description:project.description,
      repository_name:project.repository.name,repository_url:project.repository.url,public_url:project.publicUrl,
      base_branch:project.baseBranch,development_branch:project.developmentBranch,
      vercel_project_id:project.vercelProjectId,documentation_url:project.documentationUrl,lifecycle:project.lifecycle,
    }));
  }
  const taskProjects=projects.filter(project=>project.lifecycle==='active');
  const q = await searchParams;
  const queueFilter=queueFilters.some(filter=>filter.id===q?.queue)?q.queue:'active';
  const filteredTasks=tasks.filter(task=>queueFilter==='active'?task.status!=='complete':task.status===queueFilter);
  const activeTaskCount=tasks.filter(task=>task.status!=='complete').length;
  const readyCount=tasks.filter(task=>task.status==='ready').length;
  const reviewCount=tasks.filter(task=>task.status==='review').length;
  return <div className="shell">
    <header><div><div className="eyebrow">TEACH ARCADE</div><h1>Development HQ</h1>
      <p>Private development operations · Administrator</p></div>
      <form action={signOut}><button className="subtle">Sign out</button></form></header>
    <div className="banner"><b>Safe foundation:</b> No AI tasks are executed. Mode 2 API billing is OFF. No merge, deploy, or production controls are available.</div>
    <section className="card"><div className="eyebrow">LAUNCH PREPARATION</div><h2>Launch &amp; Feature Management</h2><p>Inventory features, record release decisions and review status history. Planning only until public enforcement is connected.</p><a href="/launch">Open Feature Control Center</a></section>
    <section className="stats">
      <article><span>Active task queue</span><strong>{databaseError ? '—' : activeTaskCount}</strong><small>{readyCount} ready · {reviewCount} need review</small></article>
      <article><span>AI executions</span><strong>0</strong><small>Runner not connected</small></article>
      <article><span>GitHub / Vercel</span><strong>{github.connected ? 'GitHub live' : 'Unavailable'}</strong><small>GitHub {github.connected ? 'connected' : 'unavailable'} · Vercel {vercel.connected ? 'connected' : 'not connected'}</small></article>
    </section>
    <section className="integrations">
      <article className="card"><div className="eyebrow">READ-ONLY SOURCE STATUS</div><h2>GitHub</h2>
        {github.connected ? <><span className="pill connected">Connected · read-only</span><p><b>{github.repository}</b><br/>Branch: <code>{github.branch}</code></p>
          <p>Latest commit: <code>{github.commit.slice(0, 7)}</code> · {github.commitMessage}</p>
          {github.pullRequests.length ? <div><b>Open pull requests</b>{github.pullRequests.map(pr=><p className="integration-row" key={pr.number}><a href={pr.url} target="_blank" rel="noreferrer">#{pr.number} {pr.title}</a>{pr.draft && <span className="tag">Draft</span>}</p>)}</div> : <p>No open pull request for this branch.</p>}
          {github.updatedAt && <small>Latest commit {new Date(github.updatedAt).toLocaleString('en-US',{timeZone:'UTC'})} UTC</small>}</>
          : <><span className="pill">Unavailable</span><p>GitHub status could not be loaded. {github.error}</p></>}
      </article>
      <article className="card"><div className="eyebrow">READ-ONLY DEPLOYMENT STATUS</div><h2>Vercel</h2>
        {vercel.connected ? <><span className="pill connected">Connected · read-only</span>{vercel.deployments.length ? vercel.deployments.map(d=><div className="deployment" key={d.id}><b>{d.state}</b> · {d.target}{d.branch && <> · <code>{d.branch}</code></>}{d.commit && <> · <code>{d.commit.slice(0,7)}</code></>}{d.url && <> · <a href={d.url} target="_blank" rel="noreferrer">Open deployment</a></>}{d.createdAt && <small>{new Date(d.createdAt).toLocaleString('en-US',{timeZone:'UTC'})} UTC</small>}</div>) : <p>No deployments returned for this project.</p>}{vercel.currentOnly && <p className="integration-note">Showing this dashboard’s current Vercel deployment. Deployment history requires a read-only Vercel API connection.</p>}</>
          : <><span className="pill">{vercel.error ? 'Connection error' : 'Not connected to this app'}</span><p>{vercel.error ? `Vercel status could not be loaded. ${vercel.error}` : 'The Vercel account is connected in ChatGPT, but this private dashboard has no Vercel API credentials yet. Add the server-only settings below to show its latest deployments.'}</p>{vercel.missing && <p className="setup-hint"><code>VERCEL_API_TOKEN</code>, <code>VERCEL_TEAM_ID</code>, and <code>VERCEL_PROJECT_ID</code></p>}</>}
      </article>
    </section>
    <section className="projects-section">
      <div className="section-heading"><div><div className="eyebrow">PROJECT PORTFOLIO</div><h2>Project areas</h2></div><span className="pill">{projects.length} tracked</span></div>
      <p className="section-intro">Each area can keep its purpose, source repository, branches, documentation, and Vercel project reference. These settings organize work; they do not trigger builds, merges, or deployments.</p>
      {projectDatabaseError && <p className="integration-note">Project settings are unavailable until the HQ database update is applied.</p>}
      {q?.projectSaved && <p className="alert">Project settings saved.</p>}{q?.projectCreated && <p className="alert">Project area added.</p>}
      {(q?.error==='project'||q?.error==='project-save') && <p role="alert" className="error">Project settings could not be saved. Check the values and try again.</p>}
      <div className="project-grid">{projects.map(project=>{
        const projectTaskCount=tasks.filter(task=>task.project_id===project.id).length;
        return <article className="project-card" key={project.id}>
          <div className="project-title"><h3>{project.name}</h3><span className={`pill ${project.lifecycle==='active'?'connected':''}`}>{project.lifecycle}</span></div>
          <div className="project-count"><strong>{projectTaskCount}</strong><span>{projectTaskCount===1?'task':'tasks'} in queue</span></div>
          <details className="project-editor" open={q?.editProject===project.id}>
            <summary>Edit project details</summary>
            <form action={updateProject}>
              <input type="hidden" name="id" value={project.id}/>
              <label>Name<input name="name" defaultValue={project.name} required minLength="2" maxLength="80"/></label>
              <label>Purpose<textarea name="description" defaultValue={project.description} maxLength="500"/></label>
              <label>GitHub repository name<input name="repository_name" defaultValue={project.repository_name} maxLength="200" required/></label>
              <label>GitHub repository URL<input type="url" name="repository_url" defaultValue={project.repository_url} required/></label>
              <label>Public site URL<input type="url" name="public_url" defaultValue={project.public_url ?? ''}/></label>
              <div className="fields"><label>Base branch<input name="base_branch" defaultValue={project.base_branch} maxLength="120" required/></label>
              <label>Development branch<input name="development_branch" defaultValue={project.development_branch ?? ''} maxLength="160"/></label></div>
              <label>Vercel project ID<input name="vercel_project_id" defaultValue={project.vercel_project_id ?? ''} maxLength="200"/></label>
              <label>Project documentation URL<input type="url" name="documentation_url" defaultValue={project.documentation_url ?? ''}/></label>
              <label>Workstream status<select name="lifecycle" defaultValue={project.lifecycle}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label>
              <button disabled={projectDatabaseError || project.id.startsWith('unavailable-')}>Save project settings</button>
            </form>
          </details>
          <div className="project-source"><a href={project.repository_url} target="_blank" rel="noreferrer">{project.repository_name}</a></div>
          <div className="project-source">Base branch: <a href={`${project.repository_url}/tree/${project.base_branch}`} target="_blank" rel="noreferrer"><code>{project.base_branch}</code></a><br/>Development branch: {project.development_branch || 'not assigned'}</div>
          {project.public_url && <div className="project-source"><a href={project.public_url} target="_blank" rel="noreferrer">Open public site</a></div>}
          {project.documentation_url && <div className="project-source"><a href={project.documentation_url} target="_blank" rel="noreferrer">Project documentation</a></div>}
          <div className="project-health">{github.connected ? 'GitHub source available' : 'GitHub source status unavailable'} · {project.vercel_project_id ? 'Vercel project configured' : 'Vercel project not linked'}</div>
        </article>;
      })}</div>
      {!projectDatabaseError && <details className="add-project"><summary>Add a project area</summary><form action={createProject}>
        <div className="fields"><label>Name<input name="name" required minLength="2" maxLength="80" placeholder="Project or workstream name"/></label><label>Workstream status<select name="lifecycle"><option value="active">Active</option><option value="paused">Paused</option></select></label></div>
        <label>Purpose<textarea name="description" maxLength="500" placeholder="What belongs in this workstream?"/></label>
        <div className="fields"><label>GitHub repository name<input name="repository_name" defaultValue="box2board/Teach-arcade-structure" required/></label><label>GitHub repository URL<input type="url" name="repository_url" defaultValue="https://github.com/box2board/Teach-arcade-structure" required/></label></div>
        <div className="fields"><label>Public site URL<input type="url" name="public_url" placeholder="https://..."/></label><label>Base branch<input name="base_branch" defaultValue="main" required/></label></div>
        <div className="fields"><label>Development branch<input name="development_branch" maxLength="160" placeholder="Optional"/></label><label>Vercel project ID<input name="vercel_project_id" maxLength="200" placeholder="Optional"/></label></div>
        <label>Project documentation URL<input type="url" name="documentation_url" placeholder="Optional https://..."/></label>
        <button>Add project area</button>
      </form></details>}
      <p className="registry-note"><b>Project links are informational.</b> Saving repository or Vercel identifiers does not grant the HQ access or run deployments. New Game remains an unassigned task route.</p>
    </section>
    <section className="modes">
      <article className="card"><div className="eyebrow">MODE 1 · PREFERRED</div><h2>ChatGPT Plus / Codex</h2><span className="pill">Not connected</span><p>Task drafts can be handed to a supported Codex workflow. Subscription-backed direct execution requires eligibility verification.</p></article>
      <article className="card"><div className="eyebrow">MODE 2 · OPTIONAL</div><h2>OpenAI API</h2><span className="pill">Disabled · No charges</span><p>Separately billed automated coding is unavailable. Paid execution requires future approval and budget controls.</p></article>
    </section>
    <section className="card"><h2>Create development task</h2><p>Create a permanent task record. Nothing is submitted to an AI agent.</p>
      {q?.created && <p className="alert">Task draft saved.</p>}
      {q?.error && q.error!=='project' && q.error!=='project-save' && <p role="alert" className="error">Unable to save task. Check the fields and database setup.</p>}
      <form action={createTask}><div className="fields"><div><label htmlFor="project">Project</label>
      <select id="project" name="project">{taskProjects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}<option value="unassigned-new-game">New Game (unassigned)</option></select></div>
      <div><label htmlFor="category">Work type</label><select id="category" name="category">{categories.map(x=><option key={x}>{x}</option>)}</select></div></div>
      <label htmlFor="description">Development request</label><textarea id="description" name="description" minLength="12" maxLength="5000" required placeholder="Describe the game, bug, or improvement, including anything that must be preserved."/>
      <button disabled={databaseError || projectDatabaseError}>Save task draft</button></form></section>
    <section className="card queue-card"><div className="section-heading"><div><div className="eyebrow">DEVELOPMENT WORK</div><h2>Task queue</h2></div><span className="pill">{databaseError?'—':tasks.length} shown</span></div>
      <p>Move tasks through the workflow as you shape, hand off, and review the work. Status changes do not start an agent or deploy anything.</p>
      {q?.statusUpdated && <p className="alert">Task status updated.</p>}
      {q?.error==='task-status' && <p role="alert" className="error">The task status could not be updated. Try again.</p>}
      <nav className="queue-filters" aria-label="Filter tasks">{queueFilters.map(filter=><a key={filter.id} className={queueFilter===filter.id?'selected':''} href={`/?queue=${filter.id}`}>{filter.label}</a>)}</nav>
      {databaseError && <p role="alert" className="error">Task database not provisioned or temporarily unavailable. No production data was changed.</p>}
      {!databaseError && !filteredTasks.length && <p className="empty-queue">{tasks.length?'No tasks in this view.':'No tasks yet. Create a task draft above to start the queue.'}</p>}
      {filteredTasks.map(task=><article className="queue-task" key={task.id}>
        <div className="queue-task-main"><div className="eyebrow">{task.project} · {task.category}</div><p>{task.description}</p>
          <small>{new Date(task.created_at).toLocaleDateString('en-US',{timeZone:'UTC'})}</small></div>
        <span className={`pill status-${task.status}`}>{statusLabels[task.status]??task.status}</span>
        <div className="queue-task-actions"><CopyTask task={{project:task.project,category:task.category,description:task.description}}/>
          {task.status!=='complete' && <form action={updateTaskStatus} className="status-form"><input type="hidden" name="id" value={task.id}/>
            <label className="sr-only" htmlFor={`status-${task.id}`}>Task status for {task.project}</label>
            <select id={`status-${task.id}`} name="status" defaultValue={task.status}>{queueFilters.filter(filter=>filter.id!=='active').map(filter=><option key={filter.id} value={filter.id}>{filter.label}</option>)}<option value="archived">Archived</option></select>
            <button className="subtle">Update status</button></form>}
        </div>
      </article>)}
    </section>
    <footer>Development HQ alpha · separate from public Teach Arcade · human approval required for releases</footer>
  </div>;
}
