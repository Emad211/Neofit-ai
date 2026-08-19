create index workout_sessions_workout_plan_id_idx
  on public.workout_sessions (workout_plan_id)
  where workout_plan_id is not null;;
