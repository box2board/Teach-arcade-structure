# Teach Arcade Development HQ — Neon application

**Status 2026-11-10:** The separate Neon project `muddy-wildflower-58522232` in organization `org-broad-sun-58837901` is connected via the Neon plugin. Branch `production` (`br-raspy-leaf-belktrx2`) has Managed Better Auth provisioned and public email sign-up **disabled**. The `devhq_tasks` schema was tested on a temporary branch and **successfully promoted to production** on November 10, 2026. The temporary branch was deleted; a read-only production query verified the table is empty.

The Next.js application has **NOT** passed an npm installation, build, browser test, or deployment. npm registry lookups failed with `EAI_AGAIN` in this execution environment.

## Separate architectures
- `teacharcade.com` continues using existing Supabase production and development databases. **No migration of teachers, games, or student data is planned.**
- `dev.teacharcade.com` will be a separate protected Vercel project powered by the isolated Neon database.
- Neon Auth authenticates Dev HQ admins. Every protected read/write checks the exact `DEVHQ_ADMIN_USER_ID` server-side.
- Mode 1: manual Codex task handoff pending supported Plus integration verification.
- Mode 2: OFF; no paid OpenAI API calls or fallback.

## Provisioning (when CLI environment is available)
From `development-hq/app`:

```sh
npm i -g neon@latest
neon init -y --org-id org-broad-sun-58837901 --project-id muddy-wildflower-58522232 --branch production --services postgres
neon deploy
```

Auth has already been enabled through the Neon connector. The `neon.ts` file declares `auth:true` to keep policy consistent; this does **not** mean the CLI has run.

## Environment
- `DATABASE_URL`: pooled Neon connection string for the isolated Dev HQ DB
- `NEON_AUTH_BASE_URL`: branch's Managed Auth URL
- `NEON_AUTH_COOKIE_SECRET`: independently generated random 32+ character secret for signed cookies
- `DEVHQ_ADMIN_USER_ID`: exact Neon Auth administrator account ID (must be configured after securely creating the admin)
- `DEVHQ_SITE_ORIGIN`: intended local/private website origin
- `DEVHQ_API_MODE_ENABLED=false`

Do not paste credentials into chat or commit `.env.local`. Keep secrets in an environment manager. A database role limited to the Dev HQ task table should be created before hosting.

## Outstanding gates
1. **Completed:** explicit approval received; task schema promoted to Neon production and verified.
2. **Account created:** configure the existing Neon Auth administrator ID in protected hosting secrets, finish email verification/password setup, and verify no other account can reach Dev HQ.
3. Configure and verify allowed authentication origins and deployment protection.
4. Resolve npm registry access. Pin the installed `@neon/auth` version after resolving `latest`, commit package-lock.json and run `npm run build`.
5. Run live sign-in, session, task create/archive, unauthorized-access and permission tests.
6. Set up a **separate** Vercel project with root directory `development-hq/app`; do not merge the draft PR into public site's main to deploy it.
