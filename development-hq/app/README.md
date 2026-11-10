# Teach Arcade Development HQ — Neon foundation

**Status: code committed but NOT deployed, NOT built, and NOT connected to an authenticated Neon project.**

## Architecture
- Independent Next.js application in `development-hq/app`; proposed future private Vercel project `dev.teacharcade.com`.
- Neon database and Neon Auth apply **only** to Development HQ. The live Teach Arcade website and its production/development Supabase projects are untouched.
- Database uses server-side parameterized queries via `@neondatabase/serverless`.
- One administrator is enforced by `DEVHQ_ADMIN_USER_ID` on every privileged server page/action.
- Mode 1 prepares manual ChatGPT/Codex task handoff pending official hosted-subscription integration eligibility.
- Mode 2 OpenAI API remains disabled and has no code path that can incur AI API charges.

## Provisioning (requires working Neon CLI or connected Neon plugin)
From `development-hq/app` (not from the public website root):

```sh
npm i -g neon@latest
neon init -y --org-id org-broad-sun-58837901 --project-id muddy-wildflower-58522232 --branch production --services postgres
neon deploy
```

These commands are **not verified as executed**. Neon CLI installs could not complete due to lack of npm registry access in this environment. The owner can connect the Neon plugin in ChatGPT to enable direct project operations. Do NOT commit generated `.env.local`.

## Login and database
1. Confirm Neon Auth is available for the project/branch and provision it using `neon.ts` (`auth:true`), with secure authentication settings.
2. Configure Neon Auth so only invited/approved administrators can sign in; **disable public registration**. An allowlisted user ID is an additional mandatory gate.
3. Add `DEVHQ_ADMIN_USER_ID` and valid Neon Auth/DB environment variables in private hosting environment.
4. Only once project identity is verified, apply `../schema.sql` to the intended Neon project. Use a least-privilege DB account with access only to Development HQ data and no production credentials.
5. Install exact dependency versions, generate and commit a lockfile, run `npm run check:safety` and `npm run build`.
6. Test both authorized and unauthorized login, task create/archive, expiry, DB permissions, and behavior when connection is unavailable.
7. Create a distinct Vercel project with protection on all deploy URLs and the custom domain, and verify unauthenticated access is refused before inviting the administrator.

## Notes
- Current `@neondatabase/auth-ui@0.4.0-beta` declares an exact peer on `@neondatabase/auth@0.6.0-beta`, so these versions are aligned to avoid a published dependency conflict.
- Code uses documented `@neondatabase/auth/next/server` integration. These SDKs are beta and must be checked with a real build.
- Neon App/database schema is separate from the site's existing Supabase data. No migrations between those providers are being attempted.
- Do not merge the draft PR into the public site's main branch as a deployment shortcut.
