'use client';
import { useActionState } from 'react';
import { requestAdminCode, verifyAdminCode } from './actions';

export default function SignIn() {
  const [requestState, requestAction, requesting] = useActionState(requestAdminCode, null);
  const [verifyState, verifyAction, verifying] = useActionState(verifyAdminCode, null);
  const email = verifyState?.email || requestState?.email;
  const showCodeForm = Boolean(email && (requestState?.stage === 'verify' || verifyState?.stage === 'verify'));

  return <main className="auth-card">
    <div className="eyebrow">TEACH ARCADE · PRIVATE</div>
    <h1>Development HQ</h1>
    <p>Administrator sign-in only. Enter your email to receive a secure, single-use code. New account registration is disabled.</p>
    {!showCodeForm ? <form action={requestAction}>
      <label htmlFor="email">Administrator email</label>
      <input id="email" type="email" name="email" autoComplete="email" required maxLength="254"
        defaultValue="ashdchristie@gmail.com" />
      {requestState?.error && <p role="alert" className="error">{requestState.error}</p>}
      <button disabled={requesting}>{requesting ? 'Sending code…' : 'Email me a sign-in code'}</button>
    </form> : <>
      <p role="status" className="alert">{verifyState?.error || requestState?.message} Enter the six-digit code from that email below.</p>
      <form action={verifyAction}>
        <input type="hidden" name="email" value={email} />
        <label htmlFor="otp">Six-digit code</label>
        <input id="otp" type="text" name="otp" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" minLength="6" maxLength="6" required autoFocus />
        {verifyState?.error && <p role="alert" className="error">{verifyState.error}</p>}
        <button disabled={verifying}>{verifying ? 'Verifying…' : 'Verify and sign in'}</button>
      </form>
      <form action={requestAction}>
        <input type="hidden" name="email" value={email} />
        <button disabled={requesting}>{requesting ? 'Sending code…' : 'Send a new code'}</button>
      </form>
      <a href="/auth/sign-in">Start over</a>
    </>}
    <p>No password needed. Your account is restricted to the administrator.</p>
  </main>;
}
