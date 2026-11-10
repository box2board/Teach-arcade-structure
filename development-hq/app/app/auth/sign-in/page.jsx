'use client';
import { useActionState } from 'react';
import { signInWithEmail } from './actions';

export default function SignIn() {
  const [state, action, pending] = useActionState(signInWithEmail, null);
  return <main className="auth-card">
    <div className="eyebrow">TEACH ARCADE · PRIVATE</div>
    <h1>Development HQ</h1>
    <p>Administrator sign-in only. Accounts are issued privately; public registration is disabled.</p>
    <form action={action}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" name="email" autoComplete="username" required maxLength="254" />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" name="password" autoComplete="current-password" required />
      {state?.error && <p role="alert" className="error">{state.error}</p>}
      <button disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>;
}
