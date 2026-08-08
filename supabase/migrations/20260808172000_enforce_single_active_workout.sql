create unique index workout_sessions_one_active_per_workout_idx
on public.workout_sessions (user_id, workout_id)
where status = 'active';
