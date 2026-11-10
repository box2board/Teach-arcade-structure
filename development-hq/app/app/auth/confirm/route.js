import { NextResponse } from 'next/server';
import { supabaseServer, isAdmin } from '../../../lib/supabase';

export async function GET(request) {
  const url = new URL(request.url);
  const origin = process.env.DEVHQ_SITE_ORIGIN;
  if (!origin || url.origin !== origin) return new Response('Invalid origin', { status: 400 });

  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (!token_hash || type !== 'email') {
    return NextResponse.redirect(new URL('/login?error=login', origin));
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'email' });
  if (error) return NextResponse.redirect(new URL('/login?error=login', origin));
  const { data } = await supabase.auth.getUser();
  if (!isAdmin(data?.user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/unauthorized', origin));
  }
  return NextResponse.redirect(new URL('/', origin));
}
