-- This schema is only for the separate Neon Development HQ project.
-- Run ONLY after confirming the Neon project/branch IDs. Never run on Teach Arcade Supabase.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.devhq_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 8 AND 255),
  project text NOT NULL CHECK (project IN ('Multiplayer Arcade','Midway Mashup','Trench Run V2','Factory Flow','Teacher HQ','New Game')),
  category text NOT NULL CHECK (category IN ('Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 12 AND 5000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','archived')),
  mode text NOT NULL DEFAULT 'plus' CHECK (mode = 'plus'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS devhq_tasks_owner_created_idx ON public.devhq_tasks(owner_id, created_at DESC);
-- The dashboard exclusively uses server-side parametrized SQL after Neon Auth + strict admin ID checks.
-- Do not expose this table through a public Data API, and do not use superuser credentials in the app.
-- Before deploying production, create a least-privileged database role for the dashboard with
-- only SELECT, INSERT, UPDATE on devhq_tasks; revoke schema-create/DDL privileges.
