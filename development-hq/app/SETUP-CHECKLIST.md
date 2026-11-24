# Development HQ – Neon and deployment checklist

## Completed (verified)
- [x] Project `muddy-wildflower-58522232`, branch `production`, is isolated from Teach Arcade's two Supabase databases
- [x] Neon Auth enabled and dedicated admin account exists
- [x] Email/password public signup disabled; verified-email requirement enabled
- [x] Magic Link plugin enabled, 5-minute expiry, new-user signup disabled (verified live)
- [x] New login page and Server Action use `auth.signIn.magicLink()` and do not ask for a password
- [x] Login action only sends links to the previously authorized email
- [x] `requireAdmin()` enforces exact Neon Auth administrator ID in every protected task action
- [x] `public.devhq_tasks` and index promoted to main Neon branch and verified
- [x] Code remains on isolated draft PR #283; no merge or live deployment
- [x] 7/7 source-level integration checks passed (NOT a build or browser test)

## Needed before first private preview
- [x] Install npm packages on an isolated GitHub Actions runner; installation succeeded (lockfile not yet committed)
- [x] GitHub Actions run 42955999137: all 10 safety checks and `npm run build` succeeded after fixing positive session TTL
- [ ] Commit generated package-lock.json for reproducible installs
- [ ] Configure restricted Neon database user for production application
- [ ] Use independent Vercel project with Root Directory `development-hq/app`
- [ ] Set `DATABASE_URL` (pooled), `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (secure random 32+ chars), `DEVHQ_ADMIN_USER_ID` (verified UUID), `DEVHQ_API_MODE_ENABLED=false`
- [ ] Protect *all* preview URLs and do not expose admin pages without protection
- [ ] Add actual Vercel HTTPS URL as a Neon Auth trusted domain; don't invent domains
- [ ] Test a real magic-link email, clicking it, session restoration, sign out, unauthorized-user denial
- [ ] Test real task save, retrieval and archive
- [ ] Only then consider production domain `dev.teacharcade.com`

## Current constraints
- npm package registry DNS lookup fails with EAI_AGAIN in this assistant execution environment, so the build remains unverified.
- Vercel connector can access team `team_NirDV3d21APaLS7d8ZtZNun9`, but currently lists zero projects in it. Confirm the correct Vercel team/workspace before deployment.
- Never merge the Dev HQ branch to the site's `main` solely for preview.
- Mode 2 separately billed OpenAI API remains OFF; Mode 1 Codex execution is not connected.
