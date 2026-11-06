# Teacher beta production readiness

Checked November 6, 2026. This is a release checklist, not authorization to publish.

## Verified release candidate

- Draft release PR: #193, `track-b/teacher-foundation` into `main`.
- Reviewed head: `17cc3aa269ddd47b36d78e28db8f142e6c70a9ef`; integrates main `a9b0491279b5f60f673e1c67e8e6bbc23302389e`.
- 114 checks and full build passed. Cabinet catalog: 70 game entries and 20 tools; official question library: 390 sets.
- Signed-in browser verified independent official-set copying, editing to 10 questions, reopening, and Category Clash loading. New Mini Games/RV bookmarks persisted after reload.
- Public/private ownership, independent copies, one-question publication, moderation, account deletion, and session renewal have development tests.

## Setup blockers confirmed

1. The only active Supabase service is `teach-arcade-development` (`wwpptcguilarkbouvdyj`). The older `TEACH-arcade` project (`ohrdaqnaoyiyaeebbpby`) is inactive; its contents and suitability as the production target have not been inspected. Do not point production at the development database or move QA data into production implicitly.
2. Vercel's connector still returns project-not-found after team authorization, but the user authorized browser inspection. The signed-in dashboard confirms that the existing project's Production environment has no variables and its Shared tab has no linked variables. All five account variables exist only for Preview on `track-b/teacher-foundation`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TEACHER_APP_ORIGIN`, `TEACHER_AUTH_ENABLED`, and `TEACHER_CABINET_ENABLED`. No values were revealed or changed.
3. Production authentication configuration and SMTP delivery have not been inspected. Real email-code tests in the development preview do not establish production delivery readiness.

## Configuration to review after access is restored

- Select a separate production Supabase target. Inspect the existing project before restoring/reusing it; if creating a new project, review the quoted cost first.
- Capture a baseline/backups and inspect existing application tables before migration. Preserve unrelated data.
- Assemble the complete tested migration sequence, including foundation/profile/bookmarks and the read-policy tuning migration. The foundation SQL currently also lives under `db/track-b`; the local question-set migration filename differs from development history. Reconcile that history before any blanket `supabase db push`.
- Development migration history, in order: `20261018170547`, `20261018170550`, `20261022165630`, `20261022175317`, `20261023022631`, `20261029013227`, `20261029013328`, `20261029013356`, `20261029014208`, `20261106160222`.
- Verify RLS/privileges, the profile trigger, multi-answer validation, one-question publication, moderation restrictions, and account deletion on the selected target. Keep temporary verification data separate and removable.
- Inspect production Auth settings: email signup/sign-in behavior, six-digit OTP templates, expiry, resend/rate limits, signup policy, and authenticated SMTP. Verify the sender/domain and real delivery; do not assume the preview's email settings apply.
- Review these Vercel Production-only settings: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable/anon, never service-role), `TEACHER_APP_ORIGIN` (the exact final HTTPS origin), `TEACHER_AUTH_ENABLED`, `TEACHER_CABINET_ENABLED`. Keep preview credentials isolated. Never log credential values or commit env files.
- Preserve the current development accounts, test sets, and saved items when establishing production. Decide explicitly whether beta testers will create fresh production accounts.

## Separate release decision

After production setup is verified, obtain explicit approval to merge and publish the teacher beta. Then verify production sign-in, renewal, one resource bookmark, a private set, a public copy, and one compatible game launch. Check API errors and email delivery during the initial beta.

Keep a rollback target. Disabling the account feature flags can stop account operations while static games and tools stay available. A code rollback does not roll back schema or erase teacher-created data; do not drop tables as a rollback step.

Not included in this beta: payments/subscriptions, student accounts, classes/assignments, tool-project persistence, custom level creation, or saved game configurations/progress.

## Proposed production setup for approval

Create a separate `teach-arcade-production` project in the existing organization (`yagaczlnhvvwpzmzcpdg`), region `us-east-2`, and retain development/QA data in the current development project. The Supabase cost tool quoted a recurring project cost of $0/month on November 6; the user has not yet approved project creation. Confirm that quote with the user before creating it.

Then reconcile/apply the tested database migration sequence and verify ownership/privacy rules. Configure production email-code delivery and the five production-scoped Vercel variables. Do not merge the release PR, deploy to production, or enable public beta access under this setup approval alone; publication remains a separate decision.
