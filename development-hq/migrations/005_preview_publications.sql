-- Separate HQ Neon database ONLY; no production flags modified.
BEGIN;
CREATE TABLE IF NOT EXISTS public.devhq_preview_publications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id text NOT NULL,
 target text NOT NULL CHECK(target='teach-arcade-blocker-preview'),
 snapshot jsonb NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','verified','uncertain')),
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS devhq_one_unresolved_preview_publication ON public.devhq_preview_publications(owner_id) WHERE state IN ('pending','uncertain');
ALTER TABLE public.devhq_preview_publications ENABLE ROW LEVEL SECURITY;
COMMIT;
