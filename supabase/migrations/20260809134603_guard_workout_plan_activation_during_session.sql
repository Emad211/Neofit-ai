create or replace function public.create_workout_plan_version(
  p_title text,
  p_plan jsonb,
  p_source text default 'manual',
  p_activate boolean default false
)
returns table (plan_id uuid, plan_version integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_version integer;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_source not in ('manual', 'coach', 'onboarding', 'imported') then
    raise exception 'invalid_plan_source' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':workout-plan', 0));

  if p_activate and exists (
    select 1 from public.workout_sessions where user_id = v_uid and status = 'active'
  ) then
    raise exception 'active_workout_session_exists' using errcode = '55000';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.workout_plans where user_id = v_uid;

  if p_activate then
    update public.workout_plans
    set status = 'archived', archived_at = now()
    where user_id = v_uid and status = 'active';
  end if;

  insert into public.workout_plans (
    user_id, version, schema_version, status, source, title, plan, activated_at
  ) values (
    v_uid, v_version, 1, case when p_activate then 'active' else 'draft' end,
    p_source, btrim(p_title), p_plan, case when p_activate then now() else null end
  ) returning id into v_id;

  return query select v_id, v_version;
end;
$$;

create or replace function public.activate_workout_plan(p_plan_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':workout-plan', 0));
  if not exists (select 1 from public.workout_plans where id = p_plan_id and user_id = v_uid) then
    raise exception 'workout_plan_not_found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.workout_sessions where user_id = v_uid and status = 'active') then
    raise exception 'active_workout_session_exists' using errcode = '55000';
  end if;

  update public.workout_plans
  set status = 'archived', archived_at = now()
  where user_id = v_uid and status = 'active' and id <> p_plan_id;

  update public.workout_plans
  set status = 'active', activated_at = coalesce(activated_at, now()), archived_at = null
  where id = p_plan_id and user_id = v_uid;
end;
$$;
