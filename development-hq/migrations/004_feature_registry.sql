-- Development HQ Neon ONLY. Apply after separate migration approval.
-- Planning data only: no production flags or application permissions are altered.
BEGIN;
CREATE TABLE IF NOT EXISTS public.devhq_features (
 owner_id text NOT NULL,
 slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug)<=80),
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
 category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 80),
 public_path text NOT NULL DEFAULT '' CHECK (char_length(public_path)<=500),
 desired_status text NOT NULL DEFAULT 'unreviewed' CHECK (desired_status IN ('unreviewed','live','beta','coming_soon','under_improvement','hidden')),
 reason text NOT NULL DEFAULT '' CHECK (char_length(reason)<=1000),
 revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,slug)
);
CREATE TABLE IF NOT EXISTS public.devhq_feature_history (
 owner_id text NOT NULL,
 slug text NOT NULL,
 revision integer NOT NULL,
 previous_status text,
 desired_status text NOT NULL,
 reason text NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,slug,revision),
 FOREIGN KEY(owner_id,slug) REFERENCES public.devhq_features(owner_id,slug)
);
ALTER TABLE public.devhq_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devhq_feature_history ENABLE ROW LEVEL SECURITY;
COMMIT;
