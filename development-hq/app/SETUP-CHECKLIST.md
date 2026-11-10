# Development HQ — Neon foundation checklist (November 10, 2026)

## Verified in separate Neon project
- [x] Correct organization: `org-broad-sun-58837901`
- [x] Correct Dev HQ project: `muddy-wildflower-58522232`, production branch `br-raspy-leaf-belktrx2`
- [x] Managed Better Auth enabled (separate from Supabase Auth)
- [x] Public email/password registration disabled; email verification required
- [x] Revocation of existing sessions after password reset enabled
- [x] Auth email branding set to "Teach Arcade Development HQ"
- [x] Dedicated administrator Auth account exists, email unverified as of most recent check
- [x] `public.devhq_tasks` table/index tested in temporary branch and PROMOTED to Neon production
- [x] Production branch `SELECT count(*)` succeeded, returning 0 rows
- [x] Temporary migration branch deleted automatically by Neon
- [x] Code isolated to branch `prototype/development-hq-two-mode-foundation`; public Teach Arcade Supabase remains unchanged
- [x] App migrated to current documented `@neon/auth/next/server` implementation

## Required before application is usable
- [ ] Implement and **test** the first-time administrator password/verification flow. Account was created by admin API without a usable password; do not claim login works. Official Neon guidance recommends Better Auth UI for reset flows, including emailed links.
- [ ] Securely set `DEVHQ_ADMIN_USER_ID` to the Auth account's ID in the protected hosting environment; do not expose credentials in repository
- [ ] Obtain a pooled Neon `DATABASE_URL` for a dedicated least-privileged app role; never use a superuser in a hosted application
- [ ] Set `NEON_AUTH_BASE_URL`, random 32+ char `NEON_AUTH_COOKIE_SECRET`, and `DEVHQ_API_MODE_ENABLED=false` as Vercel secrets
- [ ] Configure trusted origins for actual secure preview and final domains; disable localhost if no longer needed
- [ ] Make sure every deploy URL has access protection independently from app authentication
- [ ] Install dependencies and commit lockfile; `npm run check:safety` and `npm run build` MUST pass
- [ ] Test admin login, session persistence, denial of unauthorized users, and sign-out
- [ ] Test app-level create/archive actions with seeded disposable data after review
- [ ] Create a separate Vercel project rooted at `development-hq/app` rather than merging into the public site
- [ ] Validate Mode 1 Codex handoff; Mode 2 paid OpenAI API stays disabled

## Blockers
Package registry access currently fails with `EAI_AGAIN`, so npm installation/build and E2E browser tests are not yet possible in this execution container. Vercel connector's project visibility is also unresolved. Do not report the app as deployed.
