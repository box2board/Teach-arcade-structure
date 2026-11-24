# Launch & Feature Management — phase 1

Private HQ decision registry. Apply migration 004 to the separate HQ Neon database only, with owner approval. The existing HQ SQL connection must be the table owner or otherwise explicitly authorized for the new tables; RLS is enabled with no public policies. All actions and reads require the existing administrator identity, scope rows to the owner and use parameterized SQL. Decisions and their audit events are written together in one statement; stale revisions are rejected.

This is intentionally NOT a functioning public blocker. No status has been chosen or changed on Teach Arcade. Before activation:
1. Inventory public entry points, alternate URLs, tile/search catalogs, shared assets and server/session endpoints against main. Distinguish independently accessible experiences from reusable components.
2. Implement a separate public runtime registry with a minimal read contract and authenticated server-side write path; do not share HQ credentials. Keep current availability during migration. Require explicit owner approval for activation. Enforce status on direct page requests and on API/session create/join, not merely the client. Design admin preview auth and cache propagation. Coming Soon and Under Improvement must retain existing artwork, title and description, with play disabled. Hidden entries must be excluded from discovery. Avoid blocking shared engines.
3. Add per-feature enforcement verification and actual-versus-desired status. Fail safely for blocked routes when flag data is unavailable. Define ongoing-session behavior and test aliases, trailing slashes, encoded paths, cache, authorization and direct access.
4. Test existing HQ sign-in, task queue, registry validation, concurrent edits, audit atomicity, public access and admin bypass in preview. Only then seek separate production release approval.

No migration, production deployment, or live availability change is included in this commit.
