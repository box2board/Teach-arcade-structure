import CopyTask from './CopyTask';
import { requireAdmin } from '../lib/supabase';
import { createTask, archiveTask, signOut } from './actions';

export const dynamic = 'force-dynamic';
const projects = ['Multiplayer Arcade', 'Midway Mashup', 'Trench Run V2', 'Factory Flow', 'Teacher HQ', 'New Game'];
const categories = ['Gameplay feature', 'Bug fix', 'Visual quality', 'New game prototype', 'Testing and QA'];
export default async function Home({searchParams}) {
  const { supabase, user } = await requireAdmin();
  const { data: tasks, error } = await supabase.from('devhq_tasks')
    .select('id,project,category,description,status,mode,created_at')
    .eq('owner_id', user.id).neq('status','archived')
    .order('created_at',{ascending:false}).limit(100);
  const q = await searchParams;
  return <div className="shell">
    <header><div><div className="eyebrow">TEACH ARCADE</div><h1>Development HQ</h1><p>Private development operations · Administrator</p></div><form action={signOut}><button className="subtle">Sign out</button></form></header>
    <div className="banner"><b>Safe foundation:</b> No AI tasks are executed. Mode 2 API billing is OFF. No merge, deploy, or production controls are available.</div>
    <section className="stats">
      <article><span>Task drafts</span><strong>{tasks?.filter(t=>t.status==='draft').length ?? '—'}</strong></article>
      <article><span>AI executions</span><strong>0</strong><small>Runner not connected</small></article>
      <article><span>GitHub / Vercel</span><strong>Pending</strong><small>Read-only integration planned</small></article>
    </section>
    <section className="modes">
      <article className="card"><div className="eyebrow">MODE 1 · PREFERRED</div><h2>ChatGPT Plus / Codex</h2><span className="pill">Not connected</span><p>Task drafts can be handed to a supported Codex workflow. Subscription-backed direct execution requires eligibility verification.</p></article>
      <article className="card"><div className="eyebrow">MODE 2 · OPTIONAL</div><h2>OpenAI API</h2><span className="pill">Disabled · No charges</span><p>Separately billed automated coding is intentionally unavailable. Paid execution requires a future approval and budget controls.</p></article>
    </section>
    <section className="card"><h2>Create development task</h2><p>Create a permanent task record. Nothing is submitted to an AI agent.</p>
      {q?.created && <p className="alert">Task draft saved.</p>}
      {q?.error && <p role="alert" className="error">Unable to save task. Please check the fields and database setup.</p>}
      <form action={createTask}>
        <div className="fields"><div><label htmlFor="project">Project</label><select id="project" name="project">{projects.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label htmlFor="category">Work type</label><select id="category" name="category">{categories.map(x=><option key={x}>{x}</option>)}</select></div></div>
        <label htmlFor="description">Development request</label><textarea id="description" name="description" minLength="12" maxLength="5000" required placeholder="Describe the game, bug, or improvement, including anything that must be preserved."/>
        <button>Save task draft</button>
      </form>
    </section>
    <section className="card"><h2>Saved development tasks</h2>
      {error && <p role="alert" className="error">Task database is not configured or is unavailable. No production database changes were made.</p>}
      {!error && !tasks?.length && <p>No tasks yet. Use the form above to create your first development task.</p>}
      {tasks?.map(t=><div className="task" key={t.id}><div><div className="eyebrow">{t.project} · {t.category}</div><p>{t.description}</p><small>{t.status.toUpperCase()} · {new Date(t.created_at).toLocaleDateString('en-US',{timeZone:'UTC'})}</small></div><div className="task-actions"><CopyTask task={{project:t.project,category:t.category,description:t.description}}/><form action={archiveTask}><input type="hidden" name="id" value={t.id}/><button className="subtle">Archive</button></form></div></div>)}
    </section>
    <footer>Development HQ alpha · separate from public Teach Arcade · manual review required for all releases</footer>
  </div>;
}
