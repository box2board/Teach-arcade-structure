import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const configuredOrigin = process.env.DEVHQ_SITE_ORIGIN;
  if (!configuredOrigin || requestUrl.origin !== configuredOrigin)
    return new Response('Invalid callback origin', {status: 400});
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/', configuredOrigin));
  }
  return NextResponse.redirect(new URL('/login?error=login', configuredOrigin));
}
