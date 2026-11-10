import { NextResponse } from 'next/server';
import { supabaseServer, isAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const configuredOrigin = process.env.DEVHQ_SITE_ORIGIN;
  if (!configuredOrigin || requestUrl.origin !== configuredOrigin)
    return new Response('Invalid callback origin', { status: 400 });

  const code = requestUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=login', configuredOrigin));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/login?error=login', configuredOrigin));

  const { data } = await supabase.auth.getUser();
  if (!isAdmin(data?.user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/unauthorized', configuredOrigin));
  }
  return NextResponse.redirect(new URL('/', configuredOrigin));
}
