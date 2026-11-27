import {setupPublicPreview} from './direct-actions';
export default function DirectConnection({query,diagnostics:d}){
 return <section className="card"><div className="eyebrow">DIRECT VERCEL API · PREVIEW ONLY</div><h2>Vercel connection</h2>
 <p>Independent of the ChatGPT connector. This connection never modifies production settings or deploys code.</p>
 {!d.enabled&&<p>Set the server-only <code>DEVHQ_PREVIEW_VERCEL_TOKEN</code> on the HQ feature-management preview branch, then rebuild HQ. No credential is entered in this page.</p>}
 {d.checks.map(c=><p key={c.name}><b>{c.name}</b> · {c.ok?'OK':'Unavailable'} · {c.detail}</p>)}
 {query?.direct&&<p role="status">{query.direct==='configured'?'Preview environment configured. Rebuild the public pilot before testing.':query.direct==='already-present'?'Both preview keys exist; verify the deployed pilot before publishing.':'Setup not verified. Inspect settings and do not blindly retry.'}</p>}
 {d.partial&&<p role="alert">Partial configuration detected. Review existing keys before attempting setup.</p>}
 {d.ready&&!d.configured&&!d.partial&&<form action={setupPublicPreview}><p>Creates a read credential for the dedicated store and two encrypted environment variables only on the public blocker preview branch. Existing values are never overwritten. A new public preview build is required once.</p><label>Type CONNECT PREVIEW<input name="confirm" required autoComplete="off"/></label><button>Connect public preview</button></form>}
 {d.configured&&<p>Both public preview keys are present. This is configuration verification, not gameplay enforcement verification.</p>}
 </section>;
}
