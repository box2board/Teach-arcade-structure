'use server';
import { auth } from '../../../lib/neon';

// This is the only account that may request a Development HQ sign-in link.
// The final authorization gate independently checks DEVHQ_ADMIN_USER_ID on the server.
const ADMIN_EMAIL = 'ashdchristie@gmail.com';
const NEUTRAL_MESSAGE = 'If this address is authorized, a sign-in link will arrive shortly. The link expires after five minutes.';

export async function sendAdminMagicLink(_state, formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || email.length > 254) return { error: 'Enter a valid email address.' };

  // Never disclose whether an account exists or whether an email is authorized.
  if (email !== ADMIN_EMAIL) return { message: NEUTRAL_MESSAGE };

  try {
    const { error } = await auth.signIn.magicLink({
      email,
      callbackURL: '/',
    });
    if (error) {
      console.error('Development HQ magic-link request failed:', error.code ?? 'auth_error');
      return { error: 'Unable to send the sign-in link. Try again shortly.' };
    }
  } catch {
    console.error('Development HQ magic-link request failed.');
    return { error: 'Unable to send the sign-in link. Try again shortly.' };
  }
  return { message: NEUTRAL_MESSAGE };
}
