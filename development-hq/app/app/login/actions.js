'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseServer } from '../../lib/supabase';

export async function sendLogin(formData) {
  const email = String(formData.get('email') || '').trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect('/login?error=invalid');
  const expected = process.env.DEVHQ_SITE_ORIGIN;
  const origin = (await headers()).get('origin');
  if (!expected || origin !== expected) redirect('/login?error=config');

  const supabase = await supabaseServer();
  // Ensure the existing, preinvited administrator is the only eligible account.
  // Even if Supabase conceals existence, requireAdmin and RLS enforce access.
  await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: `${expected}/auth/confirm`, shouldCreateUser: false }
  });
  // Do not disclose whether an email belongs to a valid administrator.
  redirect('/login?sent=1');
}
