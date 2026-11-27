# Direct Vercel connection for the feature preview

The Launch page keeps the existing HQ administrator sign-in. Its feature registry, decision history, and publication audit use the isolated Neon branch on the feature-management preview. Other HQ pages keep their existing data connection.

## Branch settings

Add these secret variables to the existing `teach-arcade-development-hq` project. Set the environment to **Preview** and select only `prototype/devhq-launch-feature-management`.

| Variable | Value source |
| --- | --- |
| `DEVHQ_PREVIEW_VERCEL_TOKEN` | Short-lived Vercel account token scoped to the team that owns both projects and the preview store |
| `DEVHQ_FEATURE_PREVIEW_DATABASE_URL` | Neon Postgres connection string for `devhq-feature-blocker-preview` |

Use the Vercel settings form to enter both values. Keep credentials out of chat, terminal output, browser logs and Git. The feature preview checks the Neon compute hostname before accepting the database connection. The Vercel token's upstream permissions are broader than the operations exposed by this page, so rotate it at expiration and revoke it when the preview is retired.

Redeploy the HQ feature-management branch after saving. Open Launch as the existing administrator and confirm the three pilot entries are present. On the Vercel connection panel, **CONNECT PREVIEW** provisions the read credential and the two branch-specific environment variables on the existing public pilot project. Inspect the project if setup reports a partial result. Rebuild only the public blocker branch, then check `/api/feature-availability` on that preview for `mode: "configured"` and the three expected statuses.

## Acceptance and recovery

Save Chess as Coming Soon, review the proposed change, and approve it with **PUBLISH PREVIEW**. Compare the public Brain Arcade tile, the Chess document and its game files, and the availability endpoint. Launch Sudoku and RV Road Trip Mayhem. Restore Chess to Live through Launch and record the deployment ID before and after the two publications.

The publication audit marks a change verified when the management API reads back the approved snapshot. Website verification is a separate check. For an uncertain publication, use **Verify against preview config** to read the store and close the audit if the full approved value is present. The same option becomes available for pending records after ten minutes. If the value differs, retain the audit lock while investigating the remote outcome. Avoid retrying a write of unknown outcome.

The preview store survives redeployments. Restore an approved configuration to recover availability, or roll back the preview deployment and its branch-scoped settings to recover from a bad code change. Previously loaded or downloaded games can remain usable on the device.
