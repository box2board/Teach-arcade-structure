# Teach Arcade Development HQ — two-mode foundation

Status: **isolated prototype; NOT deployed; NOT authenticated; NO AI tasks are executed.**

This folder establishes a separate future private application for `dev.teacharcade.com`. It is deliberately independent from public game pages. **Do not link or deploy this prototype publicly** until server-side authentication and authorization are implemented.

## Run prototype

Open `development-hq/prototype.html` locally in a browser. This is a clickable, local-only UI concept; tasks entered here are not saved or sent anywhere.

## Two modes

1. **Mode 1: ChatGPT Plus / Codex (preferred)**. Begin with a supported Codex integration, and verify whether ChatGPT-plan usage through Sign in with ChatGPT is permitted for a private hosted application. Plus does *not* imply unlimited Codex tasks or general API credits. A local or eligible open-source bridge may be needed. Until proven, offer a documented manual handoff to ChatGPT/Codex rather than falsely claiming an active connection.
2. **Mode 2: OpenAI API (opt-in only)**. Separately billed through OpenAI Platform. Default disabled. Must require explicit administrator activation, a spend allowance, task-level caps, cost display, server-side API credentials, usage records, and an independent queue kill switch. Never silently fail over from Mode 1 to Mode 2.

## Stage gates

- Stage A: Read-only inventory of projects, GitHub branches/PRs, Vercel preview deployments, and task records.
- Stage B: Authenticated, server-enforced admin-only dashboard with project/task/bug records and audit trail.
- Stage C: Mode 1 proof of concept: verify eligible ChatGPT plan connection and a successful code task on a TEST repository. If unsupported, continue manual Codex handoff.
- Stage D: Mode 2 API integration only after user opts in and a strict server-enforced task budget is validated.
- Stage E: Coding-agent execution isolated from production; branches and draft PRs only, automated tests, preview environments, human merge/deploy approval.

## Security and rollout requirements

- Separate private Vercel project and subdomain, not the existing public site deployment.
- Enforce admin authorization on every server API and page; hide no secrets in browser JavaScript.
- GitHub App with minimal repository permissions; no admin or production deployment permissions granted to the AI agent.
- Never copy production Supabase credentials into the coding runner; use fake/test data.
- Keep API billing off until explicit opt-in. Kill switch and per-task budgets must be enforced server-side; provider billing alerts alone do not constitute a hard cap.
- All code modifications must occur on isolated branches, with draft PRs and review before merge.
- Production deployment stays manual/approved; preserve current games and teacher authentication.
- Task statuses must come from actual execution records; never show fabricated progress.
- This repository's `README.md` is an old static-site starter description; validate live code and deployment configuration before integrating.

## Verified 2026 documentation

- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- https://developers.openai.com/blog/codex-as-a-platform

## Important deployment note

A preliminary Vercel project search returned no matching projects in the current connector scope. This does NOT establish that Teach Arcade is not deployed; the correct Vercel account/team and project must be verified before any deployment or domain changes.
