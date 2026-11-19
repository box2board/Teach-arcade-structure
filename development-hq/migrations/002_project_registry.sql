-- Development HQ project registry.
-- Existing task drafts are backfilled by project name. "New Game" stays unassigned.
CREATE TABLE IF NOT EXISTS public.devhq_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 8 AND 255),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  repository_name text NOT NULL CHECK (char_length(repository_name) BETWEEN 1 AND 200),
  repository_url text NOT NULL,
  public_url text,
  base_branch text NOT NULL DEFAULT 'main' CHECK (char_length(base_branch) BETWEEN 1 AND 120),
  development_branch text,
  vercel_project_id text,
  documentation_url text,
  lifecycle text NOT NULL DEFAULT 'active' CHECK (lifecycle IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slug),
  UNIQUE (owner_id, name)
);
CREATE INDEX IF NOT EXISTS devhq_projects_owner_status_idx ON public.devhq_projects(owner_id, lifecycle, created_at);
INSERT INTO public.devhq_projects (owner_id, slug, name, description, repository_name, repository_url, public_url, base_branch, lifecycle)
SELECT owners.owner_id, seed.slug, seed.name, seed.description, 'box2board/Teach-arcade-structure',
  'https://github.com/box2board/Teach-arcade-structure', 'https://www.teacharcade.com/', 'main', 'active'
FROM (SELECT DISTINCT owner_id FROM public.devhq_tasks) owners
CROSS JOIN (VALUES
  ('multiplayer-arcade','Multiplayer Arcade','Multiplayer classroom sessions and arcade-map gameplay.'),
  ('midway-mashup','Midway Mashup','Board play, lobby flow, and reusable mini-games.'),
  ('trench-run-v2','Trench Run V2','The World War I side-scrolling review game.'),
  ('factory-flow','Factory Flow','Factory Flow game workstream.'),
  ('teacher-hq','Teacher HQ','Teacher accounts, question sets, and the Arcade Cabinet.')
) AS seed(slug, name, description)
ON CONFLICT (owner_id, slug) DO NOTHING;
ALTER TABLE public.devhq_tasks ADD COLUMN project_id uuid;
ALTER TABLE public.devhq_tasks DROP CONSTRAINT IF EXISTS devhq_tasks_project_check;
UPDATE public.devhq_tasks task SET project_id=project_area.id
FROM public.devhq_projects project_area
WHERE task.project_id IS NULL AND task.owner_id=project_area.owner_id AND task.project=project_area.name;
ALTER TABLE public.devhq_tasks ADD CONSTRAINT devhq_tasks_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.devhq_projects(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS devhq_tasks_project_owner_created_idx
  ON public.devhq_tasks(owner_id, project_id, created_at DESC);
