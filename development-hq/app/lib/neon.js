import 'server-only';
import { neon } from '@neondatabase/serverless';
import { createNeonAuth } from '@neon/auth/next/server';
import { redirect } from 'next/navigation';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET,
    sessionDataTtl: 0,
  },
});

export function db() {
  if (!process.env.DATABASE_URL) throw new Error('Development HQ database not configured');
  return neon(process.env.DATABASE_URL);
}

export async function requireAdmin() {
  const { data, error } = await auth.getSession();
  const user = data?.user;
  if (error || !user) redirect('/auth/sign-in');
  const id = process.env.DEVHQ_ADMIN_USER_ID;
  if (!id || id.length < 8 || user.id !== id) redirect('/unauthorized');
  return { user, sql: db() };
}
