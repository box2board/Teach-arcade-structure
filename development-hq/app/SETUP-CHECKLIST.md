# Deployment readiness checklist — not yet complete

- [ ] Confirm the owner's chosen Supabase organization and any $0/nonzero creation quote
- [ ] Create an isolated development-hq Supabase project (never reuse teacher/student production)
- [ ] Review schema.sql, run against isolated DB, and inspect security advisors
- [ ] Invite the single admin user and add trusted app_metadata.devhq_admin=true
- [ ] Configure Auth email template using `{{ .TokenHash }}` (not only default magic link) pointing to `<DEVHQ_SITE_ORIGIN>/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- [ ] Configure Auth Site URL and exact allowed redirect(s)
- [ ] Configure server env secrets and publishable key safely; admin UUID not inferred from email
- [ ] Generate and commit npm lockfile, run real build and test suite
- [ ] Test successful and rejected login, task save, archive, logout, expired sessions, RLS, and cookie handling
- [ ] Confirm correct Vercel project access / exact account, then create separate project with deployment protection
- [ ] Configure production branch for the new project to avoid deploying the live game's main branch
- [ ] Deploy the isolated app only after security checks; verify protection via unauthenticated requests
- [ ] Connect GitHub read-only project inventory next
- [ ] Test Mode 1 Codex supported login path; never assume Plus covers arbitrary API calls
- [ ] Only when explicitly approved, consider Mode 2 billing integration with server-side spend limits

## Login template for a Supabase project

A safe initial Magic Link email template is:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in to Development HQ</a>
```

The application requires a configured `DEVHQ_SITE_ORIGIN` matching Supabase Site URL. The callback enforces the exact host. The dashboard makes no paid AI calls.

## Run minimum static checks

`node scripts/check-safety.mjs`

These inspect source invariants only. They do **not** replace running the app, database authorization tests, or an actual build.
