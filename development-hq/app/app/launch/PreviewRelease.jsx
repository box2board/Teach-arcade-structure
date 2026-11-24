import {inspectDirect} from '../../lib/direct-vercel';
import {readPreview} from '../../lib/preview-release-store';
import {IDS,makePlan} from '../../lib/preview-release-policy';
import {publishPreview} from './preview-actions';

const names={'brain-rv-road-trip-mayhem':'RV Road Trip Mayhem','brain-chess':'Chess','brain-sudoku':'Sudoku'};
export default async function PreviewRelease({rows,user,sql,query}){
 let current=null,plan=null,logs=[],error=false;
 try {logs=await sql`SELECT id,state,snapshot,created_at FROM devhq_preview_publications WHERE owner_id=${user.id} ORDER BY created_at DESC LIMIT 10`;}catch{error=true;}
 try {current=await readPreview();plan=makePlan(rows,current);}catch{/* Missing config or incompatible decision: no publish. */}
 const direct=await inspectDirect();
 const unresolved=logs.some(x=>['pending','uncertain'].includes(x.state));
 return <section className="card"><div className="eyebrow">SEPARATE PREVIEW TARGET</div><h2>Preview blocker publishing</h2>
  <p>Only the three pilot games are supported. Save decisions below first, then explicitly publish a snapshot to the dedicated preview configuration. No production publishing is available.</p>
  {query?.publish==='verified'&&<p className="alert">Preview configuration updated and read back successfully. Live HTTP enforcement has not been verified.</p>}
  {query?.publish&&query.publish!=='verified'&&<p role="alert" className="error">Publish not verified: {query.publish}. Review the configuration and history before trying again.</p>}
  {!current&&<p className="integration-note">Dedicated preview configuration is disabled or unavailable. No publish action is available.</p>}
  {current&&!plan&&<p className="integration-note">Import all three pilot entries and use Live, Coming Soon, Under Improvement or Not reviewed. Unsupported statuses cannot be published.</p>}
  {error&&<p className="error">Publication audit unavailable. Apply the separate HQ migration before publishing.</p>}
  {unresolved&&<p className="error">An unresolved publication exists. Reconcile the preview store and audit record before retrying.</p>}
  <div className="project-grid">{IDS.map(id=><article key={id} className="project-card"><h3>{names[id]}</h3><p>HQ decision: {rows.find(r=>r.slug===id)?.desired_status??'Not imported'}</p><p>Preview config: {current?.[id]??'Not verified'}</p><p>Proposed: {plan?.after[id]??'—'}</p></article>)}</div>
  {plan?.changed&&!direct.configured&&<p>Connect the public preview before publishing.</p>}
  {direct.configured&&plan?.changed&&!error&&!unresolved&&<form action={publishPreview}><input type="hidden" name="snapshot" value={JSON.stringify(plan)}/><label>Type PUBLISH PREVIEW to approve these exact changes<input name="confirm" required autoComplete="off"/></label><button>Publish preview flags</button></form>}
  {plan&&!plan.changed&&<p>No preview configuration changes to publish.</p>}
  <details><summary>Preview publication audit</summary>{logs.map(log=><article className="queue-task" key={log.id}><p>{log.state} · {new Date(log.created_at).toISOString()}</p><pre>{JSON.stringify(log.snapshot,null,2)}</pre></article>)}</details>
 </section>;
}
