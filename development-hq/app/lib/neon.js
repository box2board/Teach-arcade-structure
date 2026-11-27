import 'server-only';
import { neon } from '@neondatabase/serverless';
import { createNeonAuth } from '@neon/auth/next/server';
import { redirect } from 'next/navigation';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET,
    sessionDataTtl: 30, // SDK requires a positive value; short cache for admin-only UI.
    // Magic-link verification returns from the Neon Auth host to this app.
    // Lax cookies survive that top-level GET callback; Strict cookies do not.
    sameSite: 'lax',
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


// Keep the existing administrator identity, but isolate feature data for the pilot.
export async function requireFeatureAdmin() {
  const admin = await requireAdmin();
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'prototype/devhq-launch-feature-management') return admin;

  const connection = process.env.DEVHQ_FEATURE_PREVIEW_DATABASE_URL;
  let url;
  try { url = new URL(connection); } catch { return {...admin, sql: null}; }
  const endpoint = 'ep-restless-dream-bed1oy6s';
  const domain = 'c-9.us-east-2.aws.neon.tech';
  const isIsolated = [endpoint + '.' + domain, endpoint + '-pooler.' + domain].includes(url.hostname);
  if (!isIsolated || !['postgres:', 'postgresql:'].includes(url.protocol)) return {...admin, sql: null};
  return {...admin, sql: neon(connection)};
}
