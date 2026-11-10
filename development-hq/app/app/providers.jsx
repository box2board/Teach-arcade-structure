'use client';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from './lib-auth-client';
export default function Providers({ children }) {
  const router = useRouter();
  return <NeonAuthUIProvider authClient={authClient} navigate={router.push} replace={router.replace}
    onSessionChange={() => router.refresh()} emailOTP redirectTo="/" Link={Link}>
    {children}
  </NeonAuthUIProvider>;
}
