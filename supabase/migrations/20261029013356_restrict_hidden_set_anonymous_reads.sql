alter policy teacher_sets_moderation on public.teacher_question_sets using(not moderation_hidden or (current_user='authenticated' and owner_id=(select auth.uid())));
