# Development workflow specification

## Entities
- Project: ID, name, public URL, repository, development branch, lifecycle state, owner, docs pointer.
- Task: ID, project ID, type, description, requirements, acceptance criteria, assigned mode, state, created/updated timestamps, approval record.
- Execution: task ID, mode, run ID, runner, status, logs, token/cost accounting where available, started/ended times.
- PR: task ID, GitHub PR number/link, changed files, tests and review state.
- Preview: task ID, deployment ID/link, environment, build state.
- Issue: project ID, reproduction steps, severity, screenshots/references, linked task and resolution.

## State machine
DRAFT -> APPROVED_FOR_EXECUTION -> QUEUED -> RUNNING -> TESTING -> AWAITING_REVIEW -> APPROVED_FOR_MERGE -> MERGED -> DEPLOYED.

Any active state -> BLOCKED or FAILED. A user may cancel queued/running tasks. Never mark a state as complete without trustworthy runner/build evidence.

## Mode 1
- Prefer a supported ChatGPT/Codex usage path where available and authorized.
- Sign in with ChatGPT may be restricted by distribution/deployment eligibility; do not treat it as a universal web-app OAuth method.
- Authorization and usage scopes must be verified and remain separate from admin login.
- If unsupported for the hosted dashboard, generate a reusable coding-task handoff for ChatGPT/Codex and track imported PRs and previews.

## Mode 2
- Disabled unless explicitly activated in secure admin settings.
- Server validates task price/allowance and authorization before every model call.
- No fallback to separately billed API on Plus quota failure or unavailability.
- Display actual usage vs estimate and enforce per-task and rolling monthly limits in the application; fail closed if accounting is unavailable.
- API keys and refresh tokens are stored in protected server-side secrets, never in client bundles or Git commits.

## Execution security
- Dedicated, ephemeral runner with time/CPU/memory/network limits and no production secrets.
- Explicit allowed repository and branch scope.
- Pull request first; no push directly to main.
- Test commands reviewed or sandboxed; untrusted repository scripts treated as executable code.
- Preview deployment link shown only after provider confirms actual deployment.
- Record prompt, code diffs, tool actions, approvals, and errors in audit log.

## MVP acceptance criteria
- Admin can see actual projects and development tasks.
- New task can be drafted and tracked without launching billable AI.
- Mode 2 clearly displays DISABLED, and no API key is needed for MVP.
- Mode 1 status shows NOT CONNECTED until a real supported authorization succeeds.
- No part of prototype is accessible as a public production page.
- No action can merge, deploy, or access secrets without explicit approval.
