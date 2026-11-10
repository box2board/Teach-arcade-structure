# Development HQ — verified and pending

## Completed
- [x] Neon connector is authenticated
- [x] Verified project `muddy-wildflower-58522232` and production branch `br-raspy-leaf-belktrx2`
- [x] Neon Managed Better Auth enabled on `neondb`
- [x] Disabled public email sign-up and required email verification (confirmed from live config)
- [x] Prepared `devhq_tasks` table and its index on temporary branch `br-cool-rain-bezkoj3b`
- [x] Verified temporary-branch table, column types, and indexes
- [x] Updated Next.js integration to official `@neon/auth/next/server` API and private sign-in page
- [x] Preserved Supabase production/development database separation

## Next
- [ ] Obtain approval to complete prepared migration onto Neon production branch; Neon tool requires explicit confirmation
- [ ] Apply/verify schema, test read/write safely, create least-privilege DB application role
- [ ] Set up authorized admin account without exposing password in chat
- [ ] Configure auth trusted origin when preview URL is known; secure app deployment URLs
- [ ] Install npm dependencies, resolve `@neon/auth` latest to exact version and commit npm lockfile
- [ ] Run actual `npm run check:safety` and `npm run build`; static source checks are not substitutes
- [ ] End-to-end test sign in, 403/redirect for unauthorized, save task, archive, sign out, expiry
- [ ] Create separate Vercel project; existing Vercel connector's workspace/project visibility still needs resolution
- [ ] Leave paid AI Mode 2 OFF; validate subscription-based Codex handoff independently

## Caution
The static website and teacher accounts remain on Supabase. Do not use `teach-arcade-production` or `teach-arcade-development` credentials in Dev HQ.
