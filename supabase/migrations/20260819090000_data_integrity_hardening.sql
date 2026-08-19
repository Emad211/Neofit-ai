-- Data-integrity hardening for the program lifecycle.
--
-- Four independent backstops, none of which changes an existing behaviour:
--   1. Row-level security on the two publicly-readable reference tables, so a
--      future write grant or a direct PostgREST call can never mutate them.
--   2. Covering indexes for the two program_cycles -> plan foreign keys, whose
--      ON DELETE RESTRICT checks otherwise scan program_cycles unindexed.
--   3. Immutability triggers that enforce invariant 6 at the database edge:
--      a completed/cancelled workout session is frozen, sets cannot be written
--      once their session leaves 'active', and a logged diary entry is never
--      rewritten. Each mirrors the only write path the app actually uses, so a
--      legitimate flow is untouched; only an out-of-band rewrite is rejected.
--   4. A generous per-day exercise-count cap on workout_plans, far above any
--      real plan, so a malformed plan can never be persisted as authority.

-- 1. Reference tables: read-only for everyone, enforced by RLS, not just grants.
alter table public.exercise_registry enable row level security;
alter table public.exercise_substitutions enable row level security;

create policy exercise_registry_read on public.exercise_registry
  for select to anon, authenticated using (true);
create policy exercise_substitutions_read on public.exercise_substitutions
  for select to anon, authenticated using (true);

-- 2. Covering indexes for the composite plan foreign keys. Partial, because a
-- draft/generating cycle has no linked plans and should not sit in the index.
create index if not exists program_cycles_active_workout_plan_fk_idx
  on public.program_cycles (active_workout_plan_id, user_id, active_workout_plan_version)
  where active_workout_plan_id is not null;
create index if not exists program_cycles_active_nutrition_plan_fk_idx
  on public.program_cycles (active_nutrition_plan_id, user_id, active_nutrition_plan_version)
  where active_nutrition_plan_id is not null;

-- 3a. A completed or cancelled session is terminal history and never rewritten.
-- The app only ever updates a session while it is 'active' (both the complete
-- and cancel paths guard on status = 'active'), so this rejects only an
-- out-of-band edit of already-finished history.
create or replace function public.freeze_terminal_workout_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('completed', 'cancelled') then
    raise exception 'workout_session_frozen' using errcode = '55000';
  end if;
  return new;
end;
$$;

revoke all on function public.freeze_terminal_workout_session() from public, anon, authenticated;

create trigger freeze_terminal_workout_session
before update on public.workout_sessions
for each row execute function public.freeze_terminal_workout_session();

-- 3b. Sets belong to the play session and are written only while it is active.
-- Once the session is completed/cancelled its sets are frozen logged history.
create or replace function public.freeze_workout_sets_when_session_inactive()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.workout_sessions
  where id = new.session_id and user_id = new.user_id;
  if v_status is null or v_status <> 'active' then
    raise exception 'workout_set_session_not_active' using errcode = '55000';
  end if;
  return new;
end;
$$;

revoke all on function public.freeze_workout_sets_when_session_inactive() from public, anon, authenticated;

create trigger freeze_workout_sets_when_session_inactive
before insert or update on public.workout_sets
for each row execute function public.freeze_workout_sets_when_session_inactive();

-- 3c. A logged diary entry is immutable. The only write path is an idempotent
-- insert (ON CONFLICT DO NOTHING); correcting a mistake is a delete + re-log,
-- never an in-place rewrite, so blocking UPDATE leaves every real flow intact.
create or replace function public.freeze_nutrition_entry_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'nutrition_entry_immutable' using errcode = '55000';
end;
$$;

revoke all on function public.freeze_nutrition_entry_update() from public, anon, authenticated;

create trigger freeze_nutrition_entry_update
before update on public.nutrition_entries
for each row execute function public.freeze_nutrition_entry_update();

-- 4. Per-day exercise-count ceiling. Days are already bounded 1..14 by
-- workout_plans_days_count; this bounds each day's exercise list. The ceiling is
-- deliberately far above any real plan (the planner emits at most 7 per day) so
-- it never rejects a legitimate plan, only an absurd or malformed one. Runs
-- before the registry-identity trigger (alphabetical order), so it guards its
-- own array access rather than relying on the other trigger.
create or replace function public.enforce_workout_plan_day_shape()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_day jsonb;
  v_count integer;
begin
  if jsonb_typeof(new.plan -> 'days') <> 'array' then
    return new;
  end if;
  for v_day in select value from jsonb_array_elements(new.plan -> 'days') loop
    if jsonb_typeof(v_day -> 'exercises') <> 'array' then
      continue;
    end if;
    v_count := jsonb_array_length(v_day -> 'exercises');
    if v_count < 1 or v_count > 50 then
      raise exception 'workout_plan_day_exercise_count' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.enforce_workout_plan_day_shape() from public, anon, authenticated;

create trigger enforce_workout_plan_day_shape
before insert or update of plan on public.workout_plans
for each row execute function public.enforce_workout_plan_day_shape();

comment on function public.freeze_terminal_workout_session() is 'Invariant 6: a completed/cancelled workout session is immutable history.';
comment on function public.freeze_workout_sets_when_session_inactive() is 'Invariant 6: workout sets are writable only while their session is active.';
comment on function public.freeze_nutrition_entry_update() is 'Invariant 6: a logged diary entry is never rewritten in place.';
comment on function public.enforce_workout_plan_day_shape() is 'Bounds per-day exercise count so a malformed plan cannot become persisted authority.';
