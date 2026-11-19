'use server';
import { redirect } from 'next/navigation';
import { auth } from '../../../lib/neon';

// This is the only account that may request a Development HQ sign-in code.
// The final authorization gate independently checks DEVHQ_ADMIN_USER_ID.
const ADMIN_EMAIL = 'ashdchristie@gmail.com';
const NEUTRAL_MESSAGE = 'If this address is authorized, a one-time sign-in code will arrive shortly.';

export async function requestAdminCode(_state, formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || email.length > 254) return { error: 'Enter a valid email address.' };

  // Keep responses neutral for addresses other than the pre-authorized admin.
  if (email !== ADMIN_EMAIL) return { stage: 'verify', email, message: NEUTRAL_MESSAGE };

  try {
    const { error } = await auth.emailOtp.sendVerificationOtp({ email, type: 'sign-in' });
    if (error) {
      console.error('Development HQ sign-in code request failed:', error.code ?? 'auth_error');
      return { error: 'Unable to send a sign-in code. Try again shortly.' };
    }
  } catch {
    console.error('Development HQ sign-in code request failed.');
    return { error: 'Unable to send a sign-in code. Try again shortly.' };
  }

  return { stage: 'verify', email, message: NEUTRAL_MESSAGE };
}

export async function verifyAdminCode(_state, formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const otp = String(formData.get('otp') ?? '').trim();
  if (email !== ADMIN_EMAIL || !/^\\d{6}$/.test(otp)) {
    return { stage: 'verify', email, error: 'That code is invalid or expired. Request a new code and try again.' };
  }

  try {
    const { error } = await auth.signIn.emailOtp({ email, otp });
    if (error) {
      console.error('Development HQ sign-in code verification failed:', error.code ?? 'auth_error');
      return { stage: 'verify', email, error: 'That code is invalid or expired. Request a new code and try again.' };
    }
  } catch {
    console.error('Development HQ sign-in code verification failed.');
    return { stage: 'verify', email, error: 'Unable to verify the code. Try again shortly.' };
  }

  redirect('/');
}
