import { sendLogin } from './actions';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }) {
  const q = await searchParams;
  return <main className="auth-card">
    <div className="eyebrow">Teach Arcade · Private</div>
    <h1>Development HQ</h1>
    <p>Administrator sign-in. Use the authorized email account to request a secure sign-in link.</p>
    {q?.sent && <p role="status" className="alert">If this account is permitted, check your email for a login link.</p>}
    {q?.error && <p role="alert" className="error">Unable to send sign-in email. Check configuration or try again.</p>}
    <form action={sendLogin}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength="254"/><button>Send secure sign-in link</button></form>
    <small>Only the configured administrator can access development records.</small>
  </main>;
}
