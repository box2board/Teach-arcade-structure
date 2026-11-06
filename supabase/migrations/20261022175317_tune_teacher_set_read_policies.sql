alter policy teacher_sets_public_read on public.teacher_question_sets to anon; alter policy teacher_sets_owner_read on public.teacher_question_sets using(visibility='public' or (select auth.uid())=owner_id);

