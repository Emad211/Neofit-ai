create or replace function public.finalize_program_cycle_generation(
  p_cycle_id uuid,
  p_expected_revision integer,
  p_workout_title text,
  p_workout_plan jsonb,
  p_nutrition_title text,
  p_nutrition_plan jsonb
)
returns table (
  cycle_id uuid,
  cycle_revision integer,
  workout_plan_id uuid,
  workout_plan_version integer,
  nutrition_plan_id uuid,
  nutrition_plan_version integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cycle public.program_cycles%rowtype;
  v_workout_id uuid;
  v_workout_version integer;
  v_nutrition_id uuid;
  v_nutrition_version integer;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if jsonb_typeof(p_workout_plan) <> 'object' or jsonb_typeof(p_nutrition_plan) <> 'object' then
    raise exception 'invalid_program_plan_document' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':program-cycle', 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':workout-plan', 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':nutrition-plan', 0));

  select * into v_cycle from public.program_cycles
    where id = p_cycle_id and user_id = v_uid for update;
  if not found then raise exception 'program_cycle_not_found' using errcode = 'P0002'; end if;
  if v_cycle.revision <> p_expected_revision then
    raise exception 'stale_program_cycle_revision' using errcode = '40001';
  end if;
  if v_cycle.status <> 'generating' then
    raise exception 'program_cycle_not_generating' using errcode = '55000';
  end if;

  select coalesce(max(version), 0) + 1 into v_workout_version
    from public.workout_plans where user_id = v_uid;
  insert into public.workout_plans (
    user_id, version, schema_version, status, source, title, plan
  ) values (
    v_uid, v_workout_version, 1, 'draft', 'onboarding', btrim(p_workout_title), p_workout_plan
  ) returning id into v_workout_id;

  select coalesce(max(version), 0) + 1 into v_nutrition_version
    from public.nutrition_plans where user_id = v_uid;
  insert into public.nutrition_plans (
    user_id, version, schema_version, status, source, title, plan
  ) values (
    v_uid, v_nutrition_version, 1, 'draft', 'onboarding', btrim(p_nutrition_title), p_nutrition_plan
  ) returning id into v_nutrition_id;

  update public.program_cycles set
    status = 'ready',
    revision = revision + 1,
    generation_failure_code = null,
    active_workout_plan_id = v_workout_id,
    active_workout_plan_version = v_workout_version,
    active_nutrition_plan_id = v_nutrition_id,
    active_nutrition_plan_version = v_nutrition_version,
    generated_at = now()
  where id = v_cycle.id
  returning * into v_cycle;

  return query select
    v_cycle.id, v_cycle.revision,
    v_workout_id, v_workout_version,
    v_nutrition_id, v_nutrition_version;
end;
$$;

create or replace function public.activate_program_cycle_plans(
  p_cycle_id uuid,
  p_expected_revision integer
)
returns table (cycle_id uuid, cycle_revision integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cycle public.program_cycles%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':program-cycle', 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':workout-plan', 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':nutrition-plan', 0));

  select * into v_cycle from public.program_cycles
    where id = p_cycle_id and user_id = v_uid for update;
  if not found then raise exception 'program_cycle_not_found' using errcode = 'P0002'; end if;
  if v_cycle.revision <> p_expected_revision then
    raise exception 'stale_program_cycle_revision' using errcode = '40001';
  end if;
  if v_cycle.status <> 'ready' then
    raise exception 'program_cycle_not_ready' using errcode = '55000';
  end if;
  if v_cycle.active_workout_plan_id is null or v_cycle.active_nutrition_plan_id is null then
    raise exception 'program_cycle_plans_missing' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.workout_plans
    where id = v_cycle.active_workout_plan_id and user_id = v_uid
      and version = v_cycle.active_workout_plan_version and status = 'draft'
  ) or not exists (
    select 1 from public.nutrition_plans
    where id = v_cycle.active_nutrition_plan_id and user_id = v_uid
      and version = v_cycle.active_nutrition_plan_version and status = 'draft'
  ) then
    raise exception 'program_cycle_plan_versions_invalid' using errcode = '55000';
  end if;

  update public.workout_plans set status = 'archived', archived_at = now()
    where user_id = v_uid and status = 'active';
  update public.nutrition_plans set status = 'archived', archived_at = now()
    where user_id = v_uid and status = 'active';

  update public.workout_plans set status = 'active', activated_at = now(), archived_at = null
    where id = v_cycle.active_workout_plan_id and user_id = v_uid;
  update public.nutrition_plans set status = 'active', activated_at = now(), archived_at = null
    where id = v_cycle.active_nutrition_plan_id and user_id = v_uid;

  update public.program_cycles set
    status = 'active',
    revision = revision + 1,
    activated_at = now()
  where id = v_cycle.id
  returning * into v_cycle;

  return query select v_cycle.id, v_cycle.revision;
end;
$$;

revoke all on function public.finalize_program_cycle_generation(uuid,integer,text,jsonb,text,jsonb) from public, anon;
grant execute on function public.finalize_program_cycle_generation(uuid,integer,text,jsonb,text,jsonb) to authenticated;
revoke all on function public.activate_program_cycle_plans(uuid,integer) from public, anon;
grant execute on function public.activate_program_cycle_plans(uuid,integer) to authenticated;

comment on function public.finalize_program_cycle_generation(uuid,integer,text,jsonb,text,jsonb)
  is 'Atomically persists both validated draft plans and moves one owned generating cycle to ready.';
comment on function public.activate_program_cycle_plans(uuid,integer)
  is 'Atomically activates both linked plan versions and their owned ready Program Cycle.';
