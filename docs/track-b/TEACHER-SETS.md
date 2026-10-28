# Teacher-created sets (development preview)

Entry: `/teacher/sets/`. Teachers can create incomplete private drafts, edit their
own sets, publish completed sets, browse/search the public library, save a shortcut,
or make an independent private copy. Titles are required; publishing and playing
require 12 complete questions for compatibility with the existing Review Lab.
Questions have four distinct choices and one correct answer. The 100-question and
256 KB request bounds are technical safeguards, not plan or billing limits.

The database stores `teacher_question_sets` and `teacher_set_saves`. RLS makes
private sets owner-only and public sets readable by anyone. Inserts default to
private. Column grants prevent clients from changing IDs, owners, or revisions.
All writes use the teacher's verified JWT and the existing exact-origin check.
No service-role key is used. Optimistic revisions prevent stale-tab overwrites.
Search/list responses exclude question bodies and paginate 25 sets at a time.

Publication is explicit. Saving public edits updates the original for its users.
Making a set private removes future access for others, including saved-shortcut
joins. It cannot recall content someone already downloaded; independent copies
remain theirs. Private game launches require the creator's signed-in browser.
Public play links need no account. Neither creates a classroom assignment.

Games accept `?set=teacher:<uuid>` through the shared catalog. Only the requested
teacher set is loaded. Unavailable or incomplete sets keep an error entry instead
of silently launching with another topic. Banks are loaded again at game setup
to respect visibility changes. Text uses DOM textContent rather than user HTML.

Development migration: `supabase/migrations/20261022141322_teacher_question_sets.sql`.
Applied through the Supabase connector to `teach-arcade-development` only. The local
CLI generated the migration filename but was subsequently blocked by approval
review for external telemetry; no further CLI operations were attempted. The
checked-in SQL includes the final combined authenticated SELECT policy; the remote
history also records the additive `tune_teacher_set_read_policies` adjustment.

Validation: `node --test scripts/test-teacher-sets.mjs scripts/test-teacher-set-editor.mjs scripts/test-teacher-foundation.mjs scripts/test-teacher-workflow.mjs scripts/test-cabinet-catalog.mjs`.
Database ownership tests: `scripts/test-teacher-sets-rls.sql`, run against the
development database. Test identities and content are rolled back.

Session renewal is shared with the Cabinet API (see FOUNDATION.md).

Not implemented here: Google login, student reporting,
subscriptions, image uploads, moderation/reporting workflows, or the level builder.
Community moderation and account export/deletion remain public-release work.
Existing password-protection advisor warning concerns password auth; this preview
uses email codes. Fresh-index unused notices are expected before real traffic.

## Multiple correct answers

Teacher questions now accept an answer index or an array of unique indices (0–3). The editor uses independent checkboxes. Empty selections may be saved privately; publication requires at least one correct answer per question. Existing scalar answers remain valid. Copies retain every correct answer.

All eight current Review Lab games accept multiple correct answers. `teacherBank` keeps multi-answer arrays and normalizes one-element arrays for compatibility. Shared answer helpers preserve the key during shuffling, require exact selections, and format every correct answer in feedback and review summaries. Multi-answer questions use selectable buttons, an instruction above the choices, and a separate Submit button. Single-answer questions retain immediate submission.

Keyboard: existing 1–4 choice shortcuts toggle choices where supported. Enter/Space activate the focused choice; Tab reaches Submit. Snow Gear includes Submit in its arrow/Tab focus loop. No score or reward is recorded before Submit, and duplicate submission is blocked. Wrong-answer recovery rewards already present in a game remain distinct from academic correctness.

Validation: `node --test scripts/test-multi-answer-gameplay.mjs` covers exact scoring, shuffled keys, shared controls, duplicate submission, teacher-to-game conversion, all public banks, three engine command paths, and real callbacks for Pinball, Slime Slinger, Power Clash, and Category Clash. Snow Day’s full gameplay harness includes a multiple-answer rewards regression. Existing Acorn, Raceway, Treasure, and Snow launch suites also pass. The older general question-bank inventory snapshot expects outdated subject totals and fails independently of this change; the new suite validates every current catalog bank instead.

The additive `teacher_multiple_correct_answers` development migration replaces only the existing private validation function, preserving ownership policies, grants, and stored sets. CLI use remains blocked by the earlier automatic review; the migration was created through the Supabase connector and its assigned version was saved here.
