'use server';
import { requireAdmin } from '../../lib/neon';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const statuses = ['unreviewed','live','beta','coming_soon','under_improvement','hidden'];
const field = (form, name) => String(form.get(name) ?? '').trim();
const validSlug = slug => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
const validPath = path => !path || (path.length <= 500 && /^\/(?!\/)[a-zA-Z0-9/_\-.%]+$/.test(path) && !path.includes('..') && !path.includes('%'));
export async function addFeature(form) {
 const {user,sql} = await requireAdmin();
 const slug=field(form,'slug'), name=field(form,'name'), category=field(form,'category'), path=field(form,'path');
 if(!validSlug(slug)||name.length<2||name.length>100||category.length<2||category.length>80||!validPath(path)) redirect('/launch?error=invalid');
 try {
  await sql`WITH added AS (
    INSERT INTO devhq_features(owner_id,slug,name,category,public_path)
    VALUES (${user.id},${slug},${name},${category},${path})
    RETURNING owner_id,slug,revision,desired_status,reason
  ) INSERT INTO devhq_feature_history(owner_id,slug,revision,desired_status,reason)
    SELECT owner_id,slug,revision,desired_status,reason FROM added`;
 } catch { redirect('/launch?error=save'); }
 revalidatePath('/launch'); redirect('/launch?saved=1');
}
export async function saveDecision(form) {
 const {user,sql} = await requireAdmin();
 const slug=field(form,'slug'), status=field(form,'status'), reason=field(form,'reason'), revision=Number(field(form,'revision'));
 if(!validSlug(slug)||!statuses.includes(status)||reason.length>1000||!Number.isSafeInteger(revision)||revision<1||revision>=2147483647||(status!=='unreviewed'&&!reason)) redirect('/launch?error=invalid');
 let changed;
 try {
  changed=await sql`WITH previous AS (
    SELECT owner_id,slug,desired_status,revision FROM devhq_features
    WHERE owner_id=${user.id} AND slug=${slug} AND revision=${revision} FOR UPDATE
  ), updated AS (
    UPDATE devhq_features f SET desired_status=${status}, reason=${reason}, revision=f.revision+1, updated_at=now()
    FROM previous p WHERE f.owner_id=p.owner_id AND f.slug=p.slug AND f.revision=p.revision
    RETURNING f.owner_id,f.slug,f.revision,f.desired_status,f.reason,p.desired_status AS previous_status
  ) INSERT INTO devhq_feature_history(owner_id,slug,revision,previous_status,desired_status,reason)
    SELECT owner_id,slug,revision,previous_status,desired_status,reason FROM updated RETURNING revision`;
 } catch { redirect('/launch?error=save'); }
 if(!changed.length) redirect('/launch?error=conflict');
 revalidatePath('/launch'); redirect('/launch?saved=1');
}
