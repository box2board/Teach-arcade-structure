'use server';
import {inspectDirect} from '../../lib/direct-vercel';
import {requireFeatureAdmin} from '../../lib/neon';
import {readPreview,writePreview} from '../../lib/preview-release-store';
import {IDS,makePlan,validateConfig} from '../../lib/preview-release-policy';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

export async function publishPreview(form){
 const {user,sql}=await requireFeatureAdmin();
 if(form.get('confirm')!=='PUBLISH PREVIEW')redirect('/launch?publish=invalid');
 let plan;
 try {
  if(!(await inspectDirect()).configured)throw Error('Public preview not configured');
  const rows=await sql`SELECT slug,desired_status,revision,reason FROM devhq_features WHERE owner_id=${user.id} AND slug=ANY(${IDS}::text[])`;
  plan=makePlan(rows,await readPreview());
  if(JSON.stringify(plan)!==String(form.get('snapshot'))||!plan.changed)throw Error('Stale or unchanged plan');
 } catch {redirect('/launch?publish=stale');}
 let record;
 try {
  // Atomically verify registry revisions and reserve the only in-flight publish slot.
  [record]=await sql`INSERT INTO devhq_preview_publications(owner_id,target,snapshot)
    SELECT ${user.id},'teach-arcade-blocker-preview',${JSON.stringify(plan)}::jsonb
    WHERE (SELECT count(*) FROM devhq_features WHERE owner_id=${user.id}
      AND (slug,revision) IN (SELECT key,value::integer FROM jsonb_each_text(${JSON.stringify(plan.revisions)}::jsonb)))=${IDS.length}
    RETURNING id`;
  if(!record)throw Error('Stale plan');
 } catch {redirect('/launch?publish=locked');}
 let verified=false;
 try {
  await writePreview(plan.before,plan.after);
  verified=true;
 } catch {/* External update might have succeeded; never automatically retry. */}
 try {
  await sql`UPDATE devhq_preview_publications SET state=${verified?'verified':'uncertain'},completed_at=now()
    WHERE owner_id=${user.id} AND id=${record.id}::uuid AND state='pending'`;
 } catch {redirect('/launch?publish=uncertain');}
 revalidatePath('/launch');
 redirect('/launch?publish='+(verified?'verified':'uncertain'));
}


export async function reconcilePreview(form) {
 const {user,sql}=await requireFeatureAdmin();
 const id=String(form.get('id')??'');
 if(!sql||!/^[0-9a-f-]{36}$/i.test(id))redirect('/launch?publish=reconcile-failed');
 let recovered=false;
 try {
  const [record]=await sql`SELECT snapshot FROM devhq_preview_publications
    WHERE owner_id=${user.id} AND id=${id}::uuid AND
    (state='uncertain' OR (state='pending' AND created_at < now() - interval '10 minutes'))`;
  if(record&&JSON.stringify(await readPreview())===JSON.stringify(validateConfig(record.snapshot.after))){
   const updated=await sql`UPDATE devhq_preview_publications SET state='verified',completed_at=now()
     WHERE owner_id=${user.id} AND id=${id}::uuid AND
     (state='uncertain' OR (state='pending' AND created_at < now() - interval '10 minutes'))
     RETURNING id`;
   recovered=updated.length===1;
  }
 }catch{/* Leave the existing audit lock in place when the target cannot be confirmed. */}
 revalidatePath('/launch');
 redirect('/launch?publish='+(recovered?'verified':'reconcile-failed'));
}
