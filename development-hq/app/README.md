# Teach Arcade Development HQ — authenticated app foundation

**NOT deployed, NOT tested against a running database, and NOT ready for production.**
All work remains on `prototype/development-hq-two-mode-foundation`. No paid AI execution or deployment controls have been added.

## Technical foundation

- Separate Next.js 16 app in `development-hq/app` (future Vercel Root Directory).
- Supabase cookie-backed SSR with verified `getUser()`, a hard admin UUID allowlist on server, and authenticated session-refresh proxy.
- Email-link sign-in; server-side task create/archive actions; persisted tasks after DB configuration.
- Dedicated SQL schema in `../schema.sql` with row-level owner/admin authorization.
- Mode 1: manual ChatGPT/Codex task handoff pending supported Plus integration.
- Mode 2: DISABLED and unimplemented. No API key or billable AI endpoint.
- No GitHub writes, automatic merges, production deployment actions, or live project inventory.

## Environment & setup (NOT YET PERFORMED)

1. Create a **separate Supabase project**. Do not execute the schema against the live teacher-account database.
2. Review and apply `../schema.sql` to that project.
3. Create or invite an administrator in Supabase Auth; enable email OTP links and whitelist the exact `/auth/callback` redirect URL. Mark admin through trusted **app_metadata** with `devhq_admin=true` (never user_metadata).
4. Copy `.env.example` to `.env.local`, set credentials, exact `DEVHQ_SITE_ORIGIN` (e.g. `http://localhost:3000`), and set `DEVHQ_ADMIN_USER_ID` to that administrator's Auth UUID.
5. `npm install`, review and commit `package-lock.json`, and `npm run dev`. Test legitimate login, unauthorized account denial, RLS, create/archive, expiry, and CSRF/origin behavior.
6. `npm run build` plus security tests before deploying.
7. Only then create a separate private Vercel project, restrict it using deployment protection and app authorization, and configure the custom subdomain.
8. Do not merge this branch to `main` as a substitute for independent dashboard deployment.

## Security and billing safeguards

- Supabase service_role keys, GitHub write tokens, and OpenAI API secrets must never be browser-exposed.
- A future coding agent must be sandboxed, branch-only, and subject to human review.
- Codex Plus usage for remotely hosted private applications has **not** been validated.
- Mode 2 is disabled unless admin separately approves it with actual budget controls and no hidden fallback.
- No lockfile/build verification was possible in this session due to npm registry connectivity. **Do not deploy until dependency versions and lockfile are resolved and tests pass.**
- Public documentation for Supabase 2026 SSR emphasizes `@supabase/ssr`, server-verified auth, and refresh proxy: https://supabase.com/docs/guides/auth/server-side/creating-a-client
