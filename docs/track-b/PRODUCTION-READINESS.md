# Teacher beta production readiness

Checked November 6, 2026. This is a release checklist, not authorization to publish.

## Verified release candidate

- Draft release PR: #193, `track-b/teacher-foundation` into `main`.
- Reviewed head: `17cc3aa269ddd47b36d78e28db8f142e6c70a9ef`; integrates main `a9b0491279b5f60f673e1c67e8e6bbc23302389e`.
- 114 checks and full build passed. Cabinet catalog: 70 game entries and 20 tools; official question library: 390 sets.
- Signed-in browser verified independent official-set copying, editing to 10 questions, reopening, and Category Clash loading. New Mini Games/RV bookmarks persisted after reload.
- Public/private ownership, independent copies, one-question publication, moderation, account deletion, and session renewal have development tests.

## Production infrastructure configured

The user approved creating and configuring production infrastructure while keeping the beta unpublished.

- Created separate Supabase project `teach-arcade-production` (`rtzsmtrfdmappcqkajnr`), organization `yagaczlnhvvwpzmzcpdg`, region `us-east-2`. Supabase quoted $0/month at creation. Development and the older inactive project remain untouched.
- Confirmed the new application's public schema was empty before applying the ten tested migrations. Production migration history now matches development's canonical versions exactly.
- Reconciled repository migration sources: added the two foundation migrations and missing read-policy tuning migration, and corrected the initial question-set migration timestamp/content to the recorded development migration. Historical `db/track-b` foundation sources remain available.
- Read-only comparison matched 125 schema/security objects across development and production, including columns/defaults, RLS, policies, function definitions/ACLs, and table grants. Production security advisors returned zero findings. Production starts with zero teachers, question sets, and bookmarks.
- Automatic approval review rejected production account/RLS and account-deletion mutation tests because they target production authentication/data with development-only or destructive test operations, despite transaction rollback. Those tests remain development-only; production verification used the read-only comparison above.
- Saved five Vercel Production-only secret variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (active publishable key), `TEACHER_APP_ORIGIN=https://www.teacharcade.com`, `TEACHER_AUTH_ENABLED=false`, and `TEACHER_CABINET_ENABLED=false`. Vercel confirmed success and that a new deployment is required. No production deployment was triggered. Preview configuration remains separate.
- Dashboard sign-in succeeded. Saved production Site URL `https://www.teacharcade.com`, email OTP length 6, and expiry 600 seconds. Email confirmation remains enabled; anonymous sign-in remains disabled. Existing rate limits show 30 sign-in/verification requests per 5 minutes and a 60-second per-user email interval once SMTP is configured.
- With explicit user authorization, connected Resend’s native Supabase integration to `teach-arcade-production` and the existing verified domain `auth.teacharcade.com`. The integration created its credential without exposing it and saved SMTP using sender `noreply@auth.teacharcade.com`, name Teach Arcade, host `smtp.resend.com`, port 465. Resend reports “Ready to send”; a fresh Supabase page confirms SMTP enabled and the password stored. No new email service, subscription, or DNS change was required.
- Saved signup-confirmation and returning-user magic-link/OTP templates with subject “Your Teach Arcade sign-in code” and the `{{ .Token }}` placeholder. Templates explain the 10-minute expiry and ignore-if-unrequested behavior. Reload verified the signup template persisted. Real production inbox delivery and end-to-end sign-in remain **not yet verified**.

Canonical migration order: `20261018170547`, `20261018170550`, `20261022165630`, `20261022175317`, `20261023022631`, `20261029013227`, `20261029013328`, `20261029013356`, `20261029014208`, `20261106160222`.

## Remaining verification

Production email configuration is complete. Before public beta access, verify a real production email-code delivery and sign-in, including a returning-user resend. This requires an intended test recipient and a production-connected review flow; existing development tests do not establish production inbox delivery. Do not enable account flags, merge, or deploy production merely to complete configuration. Keep credentials out of logs and committed files.

## Separate release decision

After production setup is verified, obtain explicit approval to merge and publish the teacher beta. Then verify production sign-in, renewal, one resource bookmark, a private set, a public copy, and one compatible game launch. Check API errors and email delivery during the initial beta.

Keep a rollback target. Disabling the account feature flags can stop account operations while static games and tools stay available. A code rollback does not roll back schema or erase teacher-created data; do not drop tables as a rollback step.

Not included in this beta: payments/subscriptions, student accounts, classes/assignments, tool-project persistence, custom level creation, or saved game configurations/progress.

