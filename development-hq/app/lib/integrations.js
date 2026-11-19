const OWNER = 'box2board';
const REPO = 'Teach-arcade-structure';
const BRANCH = 'prototype/development-hq-two-mode-foundation';

async function githubJson(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    cache: 'no-store', signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json();
}

export async function getGitHubStatus() {
  try {
    const [branch, pulls] = await Promise.all([
      githubJson(`/repos/${OWNER}/${REPO}/branches/${encodeURIComponent(BRANCH)}`),
      githubJson(`/repos/${OWNER}/${REPO}/pulls?state=open&head=${OWNER}:${encodeURIComponent(BRANCH)}&per_page=5`),
    ]);
    return {
      connected: true, repository: `${OWNER}/${REPO}`, branch: BRANCH,
      commit: branch.commit.sha, commitMessage: branch.commit.commit.message.split('\n')[0],
      updatedAt: branch.commit.commit.author?.date ?? null,
      pullRequests: pulls.map(({ number, title, html_url, draft }) => ({ number, title, url: html_url, draft })),
    };
  } catch (error) {
    return { connected: false, repository: `${OWNER}/${REPO}`, branch: BRANCH, error: error.message };
  }
}

export async function getVercelStatus() {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !teamId || !projectId) return { connected: false, deployments: [], missing: ['VERCEL_API_TOKEN', 'VERCEL_TEAM_ID', 'VERCEL_PROJECT_ID'] };
  try {
    const url = new URL('https://api.vercel.com/v6/deployments');
    url.searchParams.set('teamId', teamId); url.searchParams.set('projectId', projectId); url.searchParams.set('limit', '5');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Vercel returned ${response.status}`);
    const data = await response.json();
    return { connected: true, deployments: (data.deployments ?? []).map(d => ({
      id: d.uid, url: d.url ? `https://${d.url}` : null, state: d.state ?? d.readyState,
      target: d.target ?? 'preview', branch: d.meta?.githubCommitRef ?? null, createdAt: d.createdAt ?? null,
    })) };
  } catch (error) { return { connected: false, deployments: [], error: error.message }; }
}
