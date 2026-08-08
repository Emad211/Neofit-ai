drop index if exists public.workout_sessions_user_started_idx;
drop index if exists public.workout_sets_user_session_idx;
create index workout_sets_session_owner_idx on public.workout_sets (session_id, user_id);
