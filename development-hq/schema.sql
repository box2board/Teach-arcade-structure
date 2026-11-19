-- This schema is only for the separate Neon Development HQ project.
-- Run ONLY after confirming the Neon project/branch IDs. Never run on Teach Arcade Supabase.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
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
CREATE TABLE IF NOT EXISTS public.devhq_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 8 AND 255),
  project text NOT NULL,
  project_id uuid REFERENCES public.devhq_projects(id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN ('Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 12 AND 5000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','in_progress','review','complete','archived')),
  mode text NOT NULL DEFAULT 'plus' CHECK (mode = 'plus'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS devhq_tasks_owner_created_idx ON public.devhq_tasks(owner_id, created_at DESC);
-- Existing installations should use the matching, reviewed migration in the repository before deploying.
-- The dashboard exclusively uses server-side parametrized SQL after Neon Auth + strict admin ID checks.
-- Do not expose this table through a public Data API, and do not use superuser credentials in the app.
-- Before deploying production, create a least-privileged database role for the dashboard with
-- only SELECT, INSERT, UPDATE on devhq_tasks and devhq_projects; revoke schema-create/DDL privileges.
