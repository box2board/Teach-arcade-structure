'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, auth } from '../lib/neon';
import { SOURCE_REPOSITORY } from '../lib/projects';

const CATEGORIES = ['Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA'];
const TASK_STATUSES = ['draft','ready','in_progress','review','complete','archived'];

export async function createTask(formData) {
  const { user, sql } = await requireAdmin();
  const projectId = String(formData.get('project') ?? '');
  const category = String(formData.get('category') ?? '');
  const description = String(formData.get('description') ?? '').trim();
  if (!CATEGORIES.includes(category) || description.length < 12 || description.length > 5000)
    redirect('/?error=invalid');
  if (projectId === 'unassigned-new-game') {
    try {
      await sql`INSERT INTO devhq_tasks (owner_id, project, project_id, category, description, status, mode)
        VALUES (${user.id}, 'New Game', NULL, ${category}, ${description}, 'draft', 'plus')`;
    } catch { redirect('/?error=save'); }
  } else {
    let project;
    try {
      [project] = await sql`SELECT id, name FROM devhq_projects
        WHERE id=${projectId}::uuid AND owner_id=${user.id} AND lifecycle='active' LIMIT 1`;
    } catch { redirect('/?error=save'); }
    if (!project) redirect('/?error=invalid');
    try {
      await sql`INSERT INTO devhq_tasks (owner_id, project, project_id, category, description, status, mode)
        VALUES (${user.id}, ${project.name}, ${project.id}::uuid, ${category}, ${description}, 'draft', 'plus')`;
    } catch { redirect('/?error=save'); }
  }
  revalidatePath('/');
  redirect('/?created=1');
}

function field(formData, name) { return String(formData.get(name) ?? '').trim(); }

function safeUrl(value) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : null; }
  catch { return null; }
}

function projectFields(formData) {
  const name=field(formData,'name'), description=field(formData,'description');
  const repositoryName=field(formData,'repository_name')||SOURCE_REPOSITORY.name;
  const repositoryUrl=safeUrl(field(formData,'repository_url')||SOURCE_REPOSITORY.url);
  const publicValue=field(formData,'public_url'), docsValue=field(formData,'documentation_url');
  const publicUrl=safeUrl(publicValue), documentationUrl=safeUrl(docsValue);
  const baseBranch=field(formData,'base_branch')||'main', developmentBranch=field(formData,'development_branch')||null;
  const vercelProjectId=field(formData,'vercel_project_id')||null, lifecycle=field(formData,'lifecycle');
  if(name.length<2||name.length>80||description.length>500||repositoryName.length>200||!repositoryUrl||
    (publicValue&&!publicUrl)||(docsValue&&!documentationUrl)||baseBranch.length>120||
    (developmentBranch&&developmentBranch.length>160)||(vercelProjectId&&vercelProjectId.length>200)||
    !['active','paused','archived'].includes(lifecycle)) return null;
  return {name,description,repositoryName,repositoryUrl,publicUrl,baseBranch,developmentBranch,vercelProjectId,documentationUrl,lifecycle};
}

function makeSlug(name) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72);
}

export async function updateProject(formData) {
  const {user,sql}=await requireAdmin(), id=field(formData,'id'), values=projectFields(formData);
  if(!/^[0-9a-f-]{36}$/i.test(id)||!values) redirect('/?error=project');
  try {
    await sql`UPDATE devhq_projects SET name=${values.name}, description=${values.description},
      repository_name=${values.repositoryName}, repository_url=${values.repositoryUrl}, public_url=${values.publicUrl},
      base_branch=${values.baseBranch}, development_branch=${values.developmentBranch},
      vercel_project_id=${values.vercelProjectId}, documentation_url=${values.documentationUrl},
      lifecycle=${values.lifecycle}, updated_at=now() WHERE id=${id}::uuid AND owner_id=${user.id}`;
  } catch { redirect('/?error=project-save'); }
  revalidatePath('/');
  redirect('/?projectSaved=1');
}

export async function createProject(formData) {
  const {user,sql}=await requireAdmin(), values=projectFields(formData), slug=values&&makeSlug(values.name);
  if(!values||!slug||values.lifecycle==='archived') redirect('/?error=project');
  try {
    await sql`INSERT INTO devhq_projects (owner_id,slug,name,description,repository_name,repository_url,public_url,
      base_branch,development_branch,vercel_project_id,documentation_url,lifecycle)
      VALUES (${user.id},${slug},${values.name},${values.description},${values.repositoryName},${values.repositoryUrl},
      ${values.publicUrl},${values.baseBranch},${values.developmentBranch},${values.vercelProjectId},
      ${values.documentationUrl},${values.lifecycle})`;
  } catch { redirect('/?error=project-save'); }
  revalidatePath('/');
  redirect('/?projectCreated=1');
}

export async function updateTaskStatus(formData) {
  const { user, sql } = await requireAdmin();
  const id = field(formData, 'id');
  const status = field(formData, 'status');
  if (!/^[0-9a-f-]{36}$/i.test(id) || !TASK_STATUSES.includes(status)) redirect('/?error=invalid');
  try {
    await sql`UPDATE devhq_tasks SET status=${status}, updated_at=now()
      WHERE id=${id}::uuid AND owner_id=${user.id} AND status <> 'archived'`;
  } catch {
    redirect('/?error=task-status');
  }
  revalidatePath('/');
  redirect('/?statusUpdated=1');
}

export async function signOut() {
  await requireAdmin();
  await auth.signOut();
  redirect('/auth/sign-in');
}
