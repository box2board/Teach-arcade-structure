# Development HQ — Neon checklist

This is a **separate application**, not a migration of Teach Arcade's existing Supabase production or development projects.

## Neon
- [x] Neon organization/project/branch identified from owner's setup prompt
- [ ] Neon plugin connected to ChatGPT or Neon CLI authenticated
- [ ] Verify project `muddy-wildflower-58522232` belongs to organization `org-broad-sun-58837901`
- [ ] Run `neon init -y --org-id org-broad-sun-58837901 --project-id muddy-wildflower-58522232 --branch production --services postgres` from `development-hq/app`
- [ ] Run `neon deploy`, verify actual Neon Auth/Postgres state, and securely populate local/hosting environment
- [ ] Provision secure Neon Auth, prevent open signup, create one administrator and securely configure `DEVHQ_ADMIN_USER_ID`
- [ ] Review `../schema.sql`, apply only to verified Neon project, test permissions with a least-privilege DB role

## Build, security and hosting
- [ ] Install dependencies and commit generated package-lock.json
- [ ] Run `npm run check:safety` and `npm run build`, fix every failure
- [ ] Exercise real administrator sign-in, unauthorized denial, sign-out and expiry
- [ ] Exercise task creation and archive against isolated Neon DB
- [ ] Verify no browser-accessible API enables editing without admin authorization
- [ ] Create separate private Vercel project only after identifying correct workspace, and configure root `development-hq/app`
- [ ] Require deployment protection at all URLs before sharing
- [ ] Configure `dev.teacharcade.com` only after protected preview works
- [ ] Connect read-only GitHub information
- [ ] Validate Mode 1 Plus/Codex integration eligibility; never assume API calls are covered by Plus
- [ ] Keep Mode 2 disabled until explicit spending approval and server-enforced controls

## Current blocker
Neon CLI and npm dependency installation are unavailable in the present execution environment. A Neon connector is available to connect through ChatGPT. Until connected, database commands cannot be validated and no successful end-to-end test or deployed preview can be claimed.
