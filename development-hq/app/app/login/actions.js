'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseServer } from '../../lib/supabase';

export async function sendLogin(formData) {
  const email = String(formData.get('email') || '').trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect('/login?error=invalid');
  const supabase = await supabaseServer();
  // Only configured allow-listed accounts can ever pass requireAdmin.
  const h = await headers();
  const origin = h.get('origin');
  const expected = process.env.DEVHQ_SITE_ORIGIN;
  if (!expected || origin !== expected) redirect('/login?error=config');
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: `${expected}/auth/callback`, shouldCreateUser: false }
  });
  if (error) redirect('/login?error=login');
  redirect('/login?sent=1');
}
