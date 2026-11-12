'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, auth } from '../lib/neon';

const PROJECTS = ['Multiplayer Arcade','Midway Mashup','Trench Run V2','Factory Flow','Teacher HQ','New Game'];
const CATEGORIES = ['Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA'];

export async function createTask(formData) {
  const { user, sql } = await requireAdmin();
  const project = String(formData.get('project') ?? '');
  const category = String(formData.get('category') ?? '');
  const description = String(formData.get('description') ?? '').trim();
  if (!PROJECTS.includes(project) || !CATEGORIES.includes(category) || description.length < 12 || description.length > 5000)
    redirect('/?error=invalid');
  try {
    await sql`INSERT INTO devhq_tasks (owner_id, project, category, description, status, mode)
       VALUES (${user.id}, ${project}, ${category}, ${description}, 'draft', 'plus')`;
  } catch {
    redirect('/?error=save');
  }
  revalidatePath('/');
  redirect('/?created=1');
}

export async function archiveTask(formData) {
  const { user, sql } = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/?error=invalid');
  try {
    await sql`UPDATE devhq_tasks SET status='archived', updated_at=now()
      WHERE id=${id}::uuid AND owner_id=${user.id} AND status='draft'`;
  } catch {
    redirect('/?error=save');
  }
  revalidatePath('/');
  redirect('/');
}

export async function signOut() {
  await requireAdmin();
  await auth.signOut();
  redirect('/auth/sign-in');
}
