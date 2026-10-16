# Track B: teacher foundation

## First-use workflow pass (October 16)

Teacher HQ now follows Topic → Game → Engine setup → Public practice. Question Library and Saved Sets are separate navigation destinations; planned classes/assignments/reports are explained in a roadmap rather than presented as working navigation. Older bookmarks show an honest future-feature message.

Every public topic has a primary Choose a game action and independent question preview. Game selection shows shared catalog artwork, descriptions and participation mode, plus the selected topic and a clear new-tab/public-practice disclosure. Launch URLs retain the catalog set ID and add `from=teacher-hq`. The shared topic picker recognizes this marker only with a valid already-selected set, collapsing optional reselection without changing engine settings or loading a different topic. Public non-HQ entry remains unchanged. Engines retain their own setup options; there is no universal difficulty/settings layer and no claim of teacher-locked configuration.

Featured HQ artwork routes through topic selection, remembering the preferred game for ordering. Saves are disabled and labeled when the account service is unconfigured. The account screen offers a useful library exit instead of an unusable login form. With configured auth, a requested save is retained in memory through sign-in, saved on the server, then returns to the library. No localStorage/account impersonation is introduced.

Verification: `node scripts/test-teacher-workflow.mjs` exercises the launch navigation, topic retention in all compatible links, unavailable account paths, invalid-link recovery and optional topic-picker behavior using a DOM simulation. Run alongside the foundation and question-bank suites. This is not visual/browser QA; hosted sign-in and two-account ownership tests remain outstanding.

## Inspected baseline

Repository: box2board/Teach-arcade-structure. Fresh checkout of main at d6c1e3b4; clean before edits. Branch: track-b/teacher-foundation. No staged, unstaged, or untracked project work was overwritten. Other Work checkouts were not modified. No AGENTS.md found in this checkout.

The current product is buildless HTML/CSS/ES modules under public/, not Next.js. package.json builds the portable question library, checks crosswords, synchronizes interactive content, and generates discovery files. vercel.json specifies public/ as output, common security headers, redirects, and a retired api/resources.js function. README deployment instructions are outdated relative to these files. Hosted settings could not be inspected: Vercel returned team-scope 403; CLI unavailable.

No existing auth, active database, user model, or account API was found. The retired resource API no longer reads Google Sheets. Existing public navigation/global scripts load Google Analytics; the teacher workspace intentionally does not import them. No existing games or public navigation were changed.

## Decision

Keep static delivery and introduce a small Vercel Node API boundary. Use Supabase Auth and Postgres rather than migrating the whole site. Email one-time code is the only initial sign-in method. It avoids password reset flows and works across a teacher's devices without callback URL complexity. Google OAuth can follow demand. Supabase offers integrated auth/RLS, relational reporting, and ordinary portable Postgres migrations. A separate identity provider plus Neon would introduce two services and identity synchronization; Firebase would require more reporting-specific denormalization. Full Next.js migration is unnecessary for this slice.

Supabase's development free tier is a starting point, not a production capacity promise. Track database storage, compute, auth MAUs, egress, backups, SMTP and Vercel function usage separately. Public browsing and static games continue without account/database reads. Later student responses, not teacher count alone, will drive row volume. Batch/index ingestion and define retention before onboarding classes. See https://supabase.com/pricing and https://supabase.com/docs/guides/platform/billing-on-supabase for current limits; no service has been purchased.

## Working slice and limits

/teacher/ is an isolated, noindex workspace. It imports QUESTION_SETS, loadQuestionSet, gamesForSet and gameUrl from the existing Review Lab catalog. At inspection there were 278 total entries (275 generated plus three foundational packs), four subjects and six engines. UI counts are calculated at runtime, never hardcoded. Search, subject/category filters, pagination, question/answer explanations and compatible-game practice links use real content. Browsing is public; account data is protected at the API and database boundaries. No assignment or performance collection is implied by practice links.

Home, My Question Sets and Account are implemented. Classes, Assignments and Reports describe their future role in a single honest empty state; no fake activity, classes or statistics. No localStorage persistence. Favorites write to Postgres only after authentication; absent configuration yields a clearly labeled browsing preview.

### Service setup (development only)

1. Create a dedicated development Supabase project; do not reuse unknown production data.
2. Apply db/track-b/001-teachers-favorites.sql once. This creates only teachers and favorites, not the future student schema.
3. Configure email OTP templates for both new sign-ups and returning sign-ins with `{{ .Token }}`; choose six-digit codes. Set expiry and rate limits. Configure authenticated SMTP for real delivery; default SMTP is not a production email service.
4. Before exposing signup publicly, add provider CAPTCHA with server verification and durable request limits at the API edge. The provider's own limits apply now, but this slice has no custom distributed anti-abuse layer. Keep the feature disabled or restrict access to the preview until then.
5. Configure Preview-only SUPABASE_URL, SUPABASE_ANON_KEY (publishable or legacy anon, NEVER service_role), TEACHER_APP_ORIGIN (exact HTTPS origin without slash), TEACHER_AUTH_ENABLED=true. Default is disabled. Never commit actual env files.
6. Test two real teacher identities, session expiry and logout, persistence across devices, cross-owner direct REST reads/writes/deletes, invalid codes, and email delivery on the isolated deployment. Live service tests have not run in this workspace.

The API uses Supabase's REST auth and PostgREST endpoints with fetch; no new dependency or service key. Identity is checked using /auth/v1/user, not a decoded/unverified JWT. All private requests use the teacher token so RLS remains enforced. POST requires the exact configured Origin, and session cookies are Secure, HttpOnly, SameSite=Lax and host-only with __Host- prefix. Responses are private/no-store. Unknown catalog IDs are rejected on favorite writes. Plan fields have no teacher write grant. No email or provider error contents are logged/returned by the API.

This intentionally short-lived session stores only the access token, with a maximum one-hour cookie lifetime (or provider expiry if shorter). Refresh tokens are not retained; teachers sign in again on expiry. Logout clears the cookie and requests provider logout; an already issued access token may remain valid until expiration. A later SDK-backed refresh lifecycle can replace this boundary without changing catalog/UI data models. Do not advertise persistent login yet.

API: GET /api/teacher?action=session|favorites; POST login {email}, verify {email,code}, logout {}, save/unsave {setId}. No client-supplied owner ID is accepted. REST calls time out after ten seconds. Authentication failures cannot fall back to a pretend identity.

## Proposed platform schema (not migrated yet)

UUID primary keys unless otherwise stated; timestamps are timestamptz. Every owned table needs RLS, explicit grants, indexed ownership paths and cross-owner integration tests before exposure.

| Entity | Proposed fields and relationships |
| --- | --- |
| Teacher (implemented) | id -> auth.users, plan free/pro/school default free, created_at. Auth owns email; do not duplicate it. Entitlements remain server-controlled. |
| TeacherFavorite (implemented) | composite teacher_id/public_set_id, created_at. Public IDs remain canonical catalog IDs; no public-content copy needed. |
| QuestionSet | id, owner_teacher_id nullable for publisher content, source public/teacher, visibility private/public, title, subject, category, created_at, updated_at. Teacher sets default private; publishing rights are not implied by ownership. |
| QuestionSetVersion | id, question_set_id or public_catalog_id, version, content_hash, schema_version, immutable normalized question snapshot. Distinguish a public namespace from teacher UUIDs. Correct answers are protected when assignments use these versions. |
| Class | id, teacher_id, display_name, archived_at, created_at. No student roster/email required initially. |
| Assignment | id, teacher_id, class_id nullable, question_set_version_id, normalized settings, status draft/open/closed, due_at, created_at. Composite ownership constraints prevent selecting another teacher's class or private set. |
| AssignmentEngine | assignment_id, engine_id, versioned engine_settings, difficulty. One or more enabled compatible engines; the same assignment/content version can support different engines. |
| AssignmentJoin | assignment_id, random unique code, expires_at, revoked_at. Public code resolves only a minimal join payload; not a teacher-data credential. Rate-limit lookups. |
| StudentSession | id, assignment_id, opaque participant_id, teacher-approved display_label, attempt_number, status, started_at, completed_at. No student auth.users/email; scoped opaque session credential stored hashed, expiry enforced. |
| QuestionResponse | id, student_session_id, question_id within immutable version, presentation_id, selected_choice_id, correct (server graded), ordinal, answered_at, duration_ms. Unique session/presentation key supports idempotent retry. Record stable choice IDs, not shuffled indices alone. |
| GameResult | id, student_session_id, engine_id, engine_version, score, level, versioned metrics JSON, recorded_at. No academic correctness authority. |

Accuracy = server-graded correct answers / defined submitted response count; completion and unanswered questions have explicit separate fields. Specify repeated-question and attempt policies before reporting. Time and game score reported by clients are untrusted; never use score to infer accuracy. A reporting read model aggregates responses and joins game metrics without mixing the records. Engine settings are resolved on the server; student query strings cannot override teacher settings.

### Integration contract

Existing catalog.js loads generated portable JSON and maps correctAnswer -> answer, prefixes question IDs, validates metadata/counts, then calls validateQuestionBank. question-decks.js shuffles choices and questions; adapters turn decks into engine-specific models. Reuse these functions unchanged in this slice.

Future resolver accepts `{source:'public', id}` or `{source:'teacher', id, version}`. Public calls delegate to loadQuestionSet. Teacher calls require authorization at the API, normalize private content to `{id,title,questions:[{id,question,choices,answer,explanation}]}`, and validate the same contract before adapting. Do not expose a second engine loader. Assignment grading requires preserving stable choice/presentation IDs through shuffling; this is a future adapter extension, not implemented here. Public practice banks already expose answers; managed assessment cannot promise cheat resistance simply by hiding a private answer key.

/play/[code] eventually resolves a join code, issues a scoped participant credential, and returns only a sanitized versioned engine configuration with questions for that session. Engines do not query teacher tables. Session creation and response ingestion must enforce assignment status, access, quotas, attempts and idempotency server-side. No student endpoint exists in this phase.

## Privacy decisions and release gates

No student records, accounts, trackers or billing added. Teacher email is necessary for authentication. No student route should import the existing analytics/advertising scripts by default. FERPA/COPPA and school requirements need review before collecting student data: jurisdiction/hosting region, provider DPA/subprocessors, school consent and age handling, retention/deletion/export, teacher authority, incident response, and access auditability. These are product/legal review topics, not a claim of compliance. Avoid collecting full student names; even nicknames plus classroom performance can be identifiable education records. Set explicit retention before ingesting any responses. Account deletion currently requires an operator; cascading favorite deletion is modeled, while a self-service delete/export workflow remains future work.

## Next sequence

1. Connect an isolated development Supabase project and Vercel Preview; test two-account ownership, email and cookies end to end. Add signup abuse protection and deletion/export policy before public access.
2. Add teacher-created question sets and immutable versions through the same normalized contract; validation and private ownership first.
3. Add minimal classes and assignment draft configuration against a single engine. Snapshot content and teacher settings.
4. Add code-based student join and one engine adapter with server-graded responses, separate game metrics and no student accounts.
5. Prove one assignment report, attempts and retention/deletion flows, then extend adapters.
6. Introduce entitlements and billing only after the workflow is useful. School administration remains out of scope.

## Verification

Run node --test scripts/test-teacher-foundation.mjs and npm run test:question-bank. SQL policy assertions in unit tests are structural checks, not substitutes for executing migrations and two-identity RLS tests on Postgres. Browser visual QA and hosted auth/database integration are still required. This environment has no supported control-browser capability, so no browser QA was claimed. No merge or production deployment is authorized.
