'use client';
import { useActionState } from 'react';
import { sendAdminMagicLink } from './actions';

export default function SignIn() {
  const [state, action, pending] = useActionState(sendAdminMagicLink, null);
  return <main className="auth-card">
    <div className="eyebrow">TEACH ARCADE · PRIVATE</div>
    <h1>Development HQ</h1>
    <p>Administrator sign-in only. Enter your email to request a secure, single-use sign-in link. New account registration is disabled.</p>
    <form action={action}>
      <label htmlFor="email">Administrator email</label>
      <input id="email" type="email" name="email" autoComplete="email" required maxLength="254"
        defaultValue="ashdchristie@gmail.com"/>
      {state?.message && <p role="status" className="alert">{state.message}</p>}
      {state?.error && <p role="alert" className="error">{state.error}</p>}
      <button disabled={pending}>{pending ? 'Sending link…' : 'Email me a sign-in link'}</button>
    </form>
    <p>Check your email and open the link on this device within five minutes. No password needed.</p>
  </main>;
}
