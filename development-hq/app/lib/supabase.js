import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServer() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Development HQ Supabase is not configured');
  return createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(items) {
        try { items.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* On read-only render, proxy.js refreshes tokens instead. */ }
      }
    }
  });
}

export function isAdmin(user) {
  const adminId = process.env.DEVHQ_ADMIN_USER_ID;
  // Both the fixed Auth UUID and trusted application metadata must match.
  return Boolean(adminId && user && user.id === adminId && user.app_metadata?.devhq_admin === true);
}

export async function requireAdmin() {
  const { redirect } = await import('next/navigation');
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect('/login');
  if (!isAdmin(data.user)) redirect('/unauthorized');
  return { supabase, user: data.user };
}
