import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServer() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase environment is not configured');
  return createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(items) {
        try { items.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Server components are read-only; proxy handles refresh. */ }
      }
    }
  });
}

export async function requireAdmin() {
  const { redirect } = await import('next/navigation');
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect('/login');
  const admin = process.env.DEVHQ_ADMIN_USER_ID;
  if (!admin || data.user.id !== admin) redirect('/unauthorized');
  return { supabase, user: data.user };
}
