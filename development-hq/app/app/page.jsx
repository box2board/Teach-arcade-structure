import { requireAdmin } from '../lib/neon';
import { createTask, archiveTask, signOut } from './actions';
import CopyTask from './CopyTask';
import { getGitHubStatus, getVercelStatus } from '../lib/integrations';
import { PROJECTS } from '../lib/projects';

export const dynamic = 'force-dynamic';
const categories = ['Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA'];

export default async function Home({ searchParams }) {
  const { user, sql } = await requireAdmin();
  const [github, vercel] = await Promise.all([getGitHubStatus(), getVercelStatus()]);
  let tasks = [], databaseError = false;
  try {
    tasks = await sql`SELECT id, project, category, description, status, mode, created_at
      FROM devhq_tasks WHERE owner_id=${user.id} AND status <> 'archived'
      ORDER BY created_at DESC LIMIT 100`;
  } catch {
    databaseError = true;
  }
  const q = await searchParams;
  return <div className="shell">
    <header><div><div className="eyebrow">TEACH ARCADE</div><h1>Development HQ</h1>
      <p>Private development operations · Administrator</p></div>
      <form action={signOut}><button className="subtle">Sign out</button></form></header>
    <div className="banner"><b>Safe foundation:</b> No AI tasks are executed. Mode 2 API billing is OFF. No merge, deploy, or production controls are available.</div>
    <section className="stats">
      <article><span>Task drafts</span><strong>{databaseError ? '—' : tasks.filter(t=>t.status==='draft').length}</strong></article>
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
      <div className="section-heading"><div><div className="eyebrow">PROJECT PORTFOLIO</div><h2>Project areas</h2></div><span className="pill">{PROJECTS.filter(project=>!project.unassigned).length} tracked</span></div>
      <p className="section-intro">These workstreams share the Teach Arcade repository. The repository’s <b>{PROJECTS[0].baseBranch}</b> branch is the source branch; a task-specific work branch is assigned when execution is connected. Vercel health for the public site is not yet linked here.</p>
      <div className="project-grid">{PROJECTS.filter(project=>!project.unassigned).map(project=>{
        const draftCount=tasks.filter(task=>task.project===project.name).length;
        return <article className="project-card" key={project.id}>
          <div className="project-title"><h3>{project.name}</h3><span className="pill">Workstream</span></div>
          <p>{project.description}</p>
          <div className="project-count"><strong>{draftCount}</strong><span>saved {draftCount===1?'draft':'drafts'}</span></div>
          <a href={project.repository.url} target="_blank" rel="noreferrer">{project.repository.name}</a>
          <div className="project-source">Base branch: <a href={github.baseBranchUrl ?? `${project.repository.url}/tree/${project.baseBranch}`} target="_blank" rel="noreferrer"><code>{project.baseBranch}{github.baseCommit ? ` · ${github.baseCommit.slice(0,7)}` : ''}</code></a><br/>Task branch: not assigned</div>
          <div className="project-source"><a href={project.publicUrl} target="_blank" rel="noreferrer">Open Teach Arcade</a></div>
          <div className="project-health">{github.connected ? 'GitHub source available' : 'GitHub source status unavailable'} · Public site deployment: not linked</div>
        </article>;
      })}</div>
      <p className="registry-note"><b>Registry note:</b> This first pass uses the HQ’s existing workstream names. New Game remains available on task drafts as an unassigned routing choice; it is not listed as a tracked project.</p>
    </section>
    <section className="modes">
      <article className="card"><div className="eyebrow">MODE 1 · PREFERRED</div><h2>ChatGPT Plus / Codex</h2><span className="pill">Not connected</span><p>Task drafts can be handed to a supported Codex workflow. Subscription-backed direct execution requires eligibility verification.</p></article>
      <article className="card"><div className="eyebrow">MODE 2 · OPTIONAL</div><h2>OpenAI API</h2><span className="pill">Disabled · No charges</span><p>Separately billed automated coding is unavailable. Paid execution requires future approval and budget controls.</p></article>
    </section>
    <section className="card"><h2>Create development task</h2><p>Create a permanent task record. Nothing is submitted to an AI agent.</p>
      {q?.created && <p className="alert">Task draft saved.</p>}
      {q?.error && <p role="alert" className="error">Unable to save task. Check the fields and database setup.</p>}
      <form action={createTask}><div className="fields"><div><label htmlFor="project">Project</label>
      <select id="project" name="project">{PROJECTS.map(x=><option key={x.name}>{x.name}</option>)}</select></div>
      <div><label htmlFor="category">Work type</label><select id="category" name="category">{categories.map(x=><option key={x}>{x}</option>)}</select></div></div>
      <label htmlFor="description">Development request</label><textarea id="description" name="description" minLength="12" maxLength="5000" required placeholder="Describe the game, bug, or improvement, including anything that must be preserved."/>
      <button>Save task draft</button></form></section>
    <section className="card"><h2>Saved development tasks</h2>
      {databaseError && <p role="alert" className="error">Task database not provisioned or temporarily unavailable. No production data was changed.</p>}
      {!databaseError && !tasks.length && <p>No tasks yet. Use the form above to create your first development task.</p>}
      {tasks.map(t=><div className="task" key={t.id}><div><div className="eyebrow">{t.project} · {t.category}</div>
        <p>{t.description}</p><small>{t.status.toUpperCase()} · {new Date(t.created_at).toLocaleDateString('en-US',{timeZone:'UTC'})}</small>
        </div><div className="task-actions"><CopyTask task={{project:t.project,category:t.category,description:t.description}}/>
        <form action={archiveTask}><input type="hidden" name="id" value={t.id}/><button className="subtle">Archive</button></form></div></div>)}
    </section>
    <footer>Development HQ alpha · separate from public Teach Arcade · human approval required for releases</footer>
  </div>;
}
