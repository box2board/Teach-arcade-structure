# Teach Arcade Development HQ — authenticated app foundation

**NOT deployed.** The current changes live only on `prototype/development-hq-two-mode-foundation`. No paid AI execution, GitHub writes, deployment controls or live data connections are implemented.

## Technical foundation

- Next.js 16 app isolated in `development-hq/app`, suitable for a separate Vercel project with Root Directory `development-hq/app`.
- Supabase cookie-backed SSR with server-side verified `getUser()` and a single admin UUID allowlist.
- Email link authentication and session refresh proxy.
- Server Actions for creating and archiving persistent task drafts.
- Isolated SQL schema in `../schema.sql` with per-user RLS and no cross-user access.
- Mode 1 is a *manual/subscription handoff placeholder* pending official hosted-app eligibility; no claim of active Plus connection.
- Mode 2 is *off and unimplemented*: no API key, billing fallback, or AI execution endpoint.
- Project entries in the UI are choices, NOT synchronized project statuses.

## Before running

1. Create a **separate Supabase project** for Development HQ. Do not apply the SQL to the existing teacher accounts database.
2. Review and apply `../schema.sql` in that isolated project's SQL editor. Ensure auth user is precreated and email OTP/PKCE redirect is configured.
3. In an isolated local environment, copy `.env.example` into `.env.local`. Fill Supabase URL, publishable key, your actual Auth user UUID as `DEVHQ_ADMIN_USER_ID`, and `DEVHQ_SITE_ORIGIN` (exact origin, no trailing slash; e.g. `http://localhost:3000`).
4. Configure the exact `/auth/callback` redirect URL in Supabase Auth redirect allowlist.
5. Run `npm install`, then `npm run dev`; verify signing in as the allowlisted account, rejecting non-admin accounts, drafting/archiving tasks and session expiry.
6. Run `npm run build` and security/authorization testing BEFORE any deployment.
7. For Vercel, create a **separate** private project; implement deployment protection and per-request authorization, and confirm no unauthenticated pages expose task details. Choose an appropriate plan for commercial use.
8. Do not connect `dev.teacharcade.com` until actual administrator protection and deployment testing are complete.

## Security caveats

- Supabase Auth magic links require proper PKCE redirect and Auth provider configuration.
- Admin allowlist uses an immutable Auth user ID, not user-editable metadata.
- Never put API secret keys or GitHub tokens in `NEXT_PUBLIC_` environment variables.
- Vercel deployment protection should be enabled in addition to application authorization.
- The SQL grants per-owner RLS to authenticated users; the application's server layer restricts the dashboard to one admin. For stronger database-level restriction, harden RLS for the admin UUID before production deployment.
- Subscription-backed Codex compatibility for remotely hosted private apps remains unverified.
- Dependencies are pinned in package.json; lockfile should be generated with a verified npm registry and committed before CI/deployment (registry not available in this execution environment).
