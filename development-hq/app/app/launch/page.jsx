import { requireAdmin } from '../../lib/neon';
import { addFeature, saveDecision } from './actions';
export const dynamic='force-dynamic';
const labels={unreviewed:'Not reviewed',live:'Live',beta:'Beta',coming_soon:'Coming Soon',under_improvement:'Under Improvement',hidden:'Hidden'};
const meanings={unreviewed:'No decision yet',live:'Visible and playable',beta:'Visible and playable with a beta label',coming_soon:'Visible; play blocked',under_improvement:'Visible; play blocked temporarily',hidden:'Not visible; play blocked'};
export default async function Launch({searchParams}) {
 const {user,sql}=await requireAdmin();
 const q=await searchParams;
 let rows=[], history=[], unavailable=false;
 try {
  [rows,history]=await Promise.all([
   sql`SELECT * FROM devhq_features WHERE owner_id=${user.id} ORDER BY category,name`,
   sql`SELECT slug,revision,previous_status,desired_status,reason,changed_at FROM devhq_feature_history WHERE owner_id=${user.id} ORDER BY changed_at DESC,revision DESC LIMIT 50`
  ]);
 } catch { unavailable=true; }
 const counts=Object.keys(labels).map(key=>({key,n:rows.filter(r=>r.desired_status===key).length}));
 const filter=Object.hasOwn(labels,q?.status)?q.status:'all';
 const shown=rows.filter(r=>filter==='all'||r.desired_status===filter);
 return <main className="shell">
  <header><div><div className="eyebrow">TEACH ARCADE · PRIVATE HQ</div><h1>Launch &amp; Feature Management</h1><p>Plan availability without deleting games, tools or shared engines.</p></div><a href="/">Back to HQ</a></header>
  <div className="banner"><b>Planning only — public enforcement not connected.</b> Decisions here do not change the live website. Public status is not verified. Coming Soon and Under Improvement are intended to keep tiles visible but block play after integration. No production deployment or automatic release.</div>
  {q?.saved && <p className="alert">Launch decision saved in HQ only.</p>}
  {q?.error && <p role="alert" className="error">{q.error==='conflict'?'Another change was saved first. Review the latest decision and try again.':'Could not save. Check fields, duplicate IDs and HQ database setup.'}</p>}
  {unavailable && <p role="alert" className="error">Feature registry unavailable. The separate HQ migration may not have been applied. No public availability has changed.</p>}
  <section className="stats">{counts.map(({key,n})=><article key={key}><span>{labels[key]}</span><strong>{unavailable?'—':n}</strong><small>{meanings[key]}</small></article>)}</section>
  <section className="card"><h2>Add feature</h2><p>Register an individual game or tool, not a shared engine. Every new entry starts Not reviewed.</p>
   <form action={addFeature}><div className="fields"><label>Feature name<input name="name" required maxLength={100} minLength={2}/></label><label>Stable feature ID<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} placeholder="midway-mayhem"/></label></div><div className="fields"><label>Category<input name="category" required minLength={2} maxLength={80} placeholder="Multiplayer"/></label><label>Public path (optional)<input name="path" maxLength={500} placeholder="/games/example/"/></label></div><button disabled={unavailable}>Register feature</button></form>
  </section>
  <section className="card"><h2>Feature inventory</h2><nav className="queue-filters" aria-label="Filter feature decisions"><a href="/launch" className={filter==='all'?'selected':''}>All</a>{Object.entries(labels).map(([key,label])=><a key={key} href={'/launch?status='+key} className={filter===key?'selected':''}>{label}</a>)}</nav>
   {!unavailable&&!shown.length&&<p>No features in this view. Add features above after verifying their public paths.</p>}
   <div className="project-grid">{shown.map(r=><article className="project-card" key={r.slug}><div className="project-title"><h3>{r.name}</h3><span className="pill">{labels[r.desired_status]}</span></div><p>{r.category} · <code>{r.slug}</code></p><p>{r.public_path||'Public path not mapped'}</p><form action={saveDecision}><input type="hidden" name="slug" value={r.slug}/><input type="hidden" name="revision" value={r.revision}/><label>Desired release status<select name="status" defaultValue={r.desired_status}>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Reason / remaining work<textarea name="reason" maxLength={1000} defaultValue={r.reason}/></label><button>Save planning decision</button></form></article>)}</div>
  </section>
  <section className="card"><h2>Decision history</h2><p>Latest 50 registry changes, not production releases.</p>{history.map(h=><article className="queue-task" key={h.slug+':'+h.revision}><div className="queue-task-main"><b>{h.slug}</b><p>{h.previous_status?labels[h.previous_status]:'Registered'} → {labels[h.desired_status]}</p><p>{h.reason}</p><small>{new Date(h.changed_at).toISOString()}</small></div></article>)}</section>
 </main>;
}
