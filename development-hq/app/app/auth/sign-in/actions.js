'use server';
import { auth } from '../../../lib/neon';
import { redirect } from 'next/navigation';

export async function signInWithEmail(_state, formData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || email.length > 254 || password.length < 1) {
    return { error: 'Enter your email and password.' };
  }
  try {
    const { data, error } = await auth.signIn.email({email, password});
    if (error || !data) return { error: 'Invalid credentials or sign-in unavailable.' };
  } catch {
    return { error: 'Unable to sign in. Please try again.' };
  }
  redirect('/');
}
