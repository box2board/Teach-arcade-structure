-- Expand the Development HQ task status flow without changing saved task data.
ALTER TABLE public.devhq_tasks DROP CONSTRAINT IF EXISTS devhq_tasks_status_check;
ALTER TABLE public.devhq_tasks ADD CONSTRAINT devhq_tasks_status_check
  CHECK (status IN ('draft','ready','in_progress','review','complete','archived'));
