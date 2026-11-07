# Public question-set reporting and moderation

Development preview only. Teachers can report another teacher's visible public set by choosing a reason and confirming. Sign-in is required. Reports contain a fixed reason, not free text or student information. Repeated reports from the same teacher for the same set are idempotent. The database allows at most 20 submissions per teacher per rolling day, serialized by an advisory lock. Reports never automatically hide a set.

## Moderator workflow

The first moderation console is the Supabase project's Table Editor, accessible only through the project's existing administrator access. No teacher gets administrator capabilities or a service key.

1. In `teacher_set_reports`, filter `status = open`, inspect the `set_id` and reason.
2. Open that ID in `teacher_question_sets` and review its content.
3. If necessary set `moderation_hidden = true`. This is reversible. It removes the source from public discovery, other teachers' saved lists, direct detail reads, and question-bank loading through database RLS. The creator retains their original and can edit it, but cannot reset the moderation flag.
4. Set report `status` to `resolved` or `dismissed`. Restore a reviewed set by setting `moderation_hidden = false`.

Reports are readable only by their reporter and project administrators. Creators cannot see who reported them. Existing independent copies are not affected by hiding a source; assess independently if needed. Reporting is not an instant notification service: check the queue regularly. A dedicated in-site moderator dashboard and moderator notifications are not implemented.

Three additive development migrations record the reporting schema, rate-limit trigger correction, and explicit anonymous restriction. Rolled-back two-teacher SQL tests cover hidden reads, saved joins, copy preservation, report privacy, duplicate reports and blocked teacher moderation. API tests cover sign-in, ownership, reasons, and spoofed fields. Account deletion and privacy-policy expansion remain separate launch work.
