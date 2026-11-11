# Teach Arcade Development HQ — Neon foundation

## Current status
The separate Neon project `muddy-wildflower-58522232`, branch `production`, has a verified task table, Managed Better Auth, and an administrator account. Neon Magic Link is enabled, expires after 5 minutes, and explicitly disables new user registration. Email/password self-registration is also disabled.

The dashboard login form now requests magic links for the pre-existing administrator email address and never requests a password. The server-side dashboard access control still requires the exact Neon Auth user ID from `DEVHQ_ADMIN_USER_ID`.

**Not deployment-ready:** npm registry DNS access is blocked in the current execution environment (`EAI_AGAIN`), so package installation, a lockfile, `npm run build`, and browser E2E tests could not yet run. Neither production nor preview Vercel deployments have been made.

## Architecture and isolation
- Public `teacharcade.com` and teacher account data **stay on Supabase**.
- Private Development HQ uses **only the distinct Neon project**.
- A separately protected Vercel project will eventually host `dev.teacharcade.com`.
- Mode 1 is manual task-copy handoff; it is **not** automatic or confirmed to be covered by ChatGPT Plus in a custom web app.
- Mode 2 paid OpenAI API remains off. No project merges or production deployments are authorized.

## Configuration checklist
1. Root directory for the Vercel project: `development-hq/app`.
2. Set `DATABASE_URL` to Neon pooled Postgres connection with a **least-privilege** DB role.
3. Set `NEON_AUTH_BASE_URL` to the branch Auth URL.
4. Create `NEON_AUTH_COOKIE_SECRET` with at least 32 random characters.
5. Set `DEVHQ_ADMIN_USER_ID` to the previously verified administrator UUID (in protected hosting settings, not committed in source).
6. Keep `DEVHQ_API_MODE_ENABLED=false`.
7. Configure Neon Auth trusted origins for the **real** protected Vercel preview and final custom domain.
8. Install dependencies and pin the installed `@neon/auth` version; commit the generated package-lock.json.
9. Run `npm run check:safety`, `npm run build`, then test real magic-link delivery, callback, auth session, admin access, and task save/archive.
10. Never deploy by merging this branch into the public Teach Arcade website.

## Neon CLI commands for this separate project (optional if connector is in use)
```sh
cd development-hq/app
npm i -g neon@latest
neon init -y --org-id org-broad-sun-58837901 --project-id muddy-wildflower-58522232 --branch production --services postgres
neon deploy
```
The Neon connection and database service already exist. These CLI commands have not been run in this execution environment.
