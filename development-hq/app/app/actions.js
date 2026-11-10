'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '../lib/supabase';

const PROJECTS = ['Multiplayer Arcade', 'Midway Mashup', 'Trench Run V2', 'Factory Flow', 'Teacher HQ', 'New Game'];
const CATEGORIES = ['Gameplay feature', 'Bug fix', 'Visual quality', 'New game prototype', 'Testing and QA'];

export async function createTask(formData) {
  const { supabase, user } = await requireAdmin();
  const project = String(formData.get('project') || '');
  const category = String(formData.get('category') || '');
  const description = String(formData.get('description') || '').trim();
  if (!PROJECTS.includes(project) || !CATEGORIES.includes(category) || description.length < 12 || description.length > 5000)
    redirect('/?error=invalid');
  const { error } = await supabase.from('devhq_tasks').insert({
    owner_id: user.id, project, category, description, status: 'draft', mode: 'plus'
  });
  if (error) redirect('/?error=save');
  revalidatePath('/');
  redirect('/?created=1');
}

export async function archiveTask(formData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/?error=invalid');
  const { error } = await supabase.from('devhq_tasks').update({status: 'archived'})
    .eq('id', id).eq('owner_id', user.id).eq('status', 'draft');
  if (error) redirect('/?error=save');
  revalidatePath('/');
  redirect('/');
}

export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect('/login');
}
