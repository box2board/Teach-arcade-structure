const sharedSource = {
  repository: {
    name: 'box2board/Teach-arcade-structure',
    url: 'https://github.com/box2board/Teach-arcade-structure',
  },
  publicUrl: 'https://www.teacharcade.com/',
  baseBranch: 'main',
  developmentBranch: null,
  vercelProjectId: null,
  documentationUrl: null,
  lifecycle: 'active',
};

export const PROJECTS = [
  {
    ...sharedSource,
    id: 'multiplayer-arcade',
    kind: 'workstream',
    name: 'Multiplayer Arcade',
    description: 'Multiplayer classroom sessions and arcade-map gameplay.',
  },
  {
    ...sharedSource,
    id: 'midway-mashup',
    kind: 'workstream',
    name: 'Midway Mashup',
    description: 'Board play, lobby flow, and reusable mini-games.',
  },
  {
    ...sharedSource,
    id: 'trench-run-v2',
    kind: 'workstream',
    name: 'Trench Run V2',
    description: 'The World War I side-scrolling review game.',
  },
  {
    ...sharedSource,
    id: 'factory-flow',
    kind: 'workstream',
    name: 'Factory Flow',
    description: 'Teach Arcade factory and production-management game work.',
  },
  {
    ...sharedSource,
    id: 'teacher-hq',
    kind: 'workstream',
    name: 'Teacher HQ',
    description: 'Teacher accounts, question sets, and the Arcade Cabinet.',
  },
  {
    id: 'unassigned-new-game',
    kind: 'placeholder',
    name: 'New Game',
    description: 'A new game or prototype that has not been assigned to a workstream yet.',
    unassigned: true,
  },
];

export const PROJECT_NAMES = PROJECTS.map((project) => project.name);

export const SOURCE_REPOSITORY = PROJECTS[0].repository;

export async function getProjectAreas(sql, ownerId) {
  return sql`SELECT id, slug, name, description, repository_name,
      repository_url, public_url, base_branch, development_branch,
      vercel_project_id, documentation_url, lifecycle
    FROM devhq_projects WHERE owner_id=${ownerId} ORDER BY created_at ASC`;
}
