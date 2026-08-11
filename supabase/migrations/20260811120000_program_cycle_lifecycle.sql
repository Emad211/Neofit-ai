alter table public.workout_plans
  add constraint workout_plans_id_user_version_unique unique (id, user_id, version);

create table public.program_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version smallint not null default 1,
  status text not null default 'draft',
  requested_duration_days integer not null,
  start_date date not null,
  end_date date generated always as (start_date + (requested_duration_days - 1)) stored,
  onboarding_schema_version smallint not null,
  onboarding_updated_at timestamptz not null,
  onboarding_snapshot_sha256 text not null,
  generation_idempotency_key text not null,
  generation_attempt integer not null default 0,
  generation_failure_code text,
  active_workout_plan_id uuid,
  active_workout_plan_version integer,
  active_nutrition_plan_id uuid,
  active_nutrition_plan_version integer,
  revision integer not null default 1,
  source text not null default 'onboarding',
  generated_at timestamptz,
  activated_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_cycles_schema_version_positive check (schema_version > 0),
  constraint program_cycles_status_valid check (status in ('draft','generating','ready','failed','active','paused','completed')),
  constraint program_cycles_duration_bounded check (requested_duration_days between 14 and 84),
  constraint program_cycles_date_order check (end_date >= start_date),
  constraint program_cycles_onboarding_schema_positive check (onboarding_schema_version > 0),
  constraint program_cycles_onboarding_hash_valid check (onboarding_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  constraint program_cycles_idempotency_key_valid check (generation_idempotency_key ~ '^[0-9a-f]{64}$'),
  constraint program_cycles_attempt_nonnegative check (generation_attempt >= 0),
  constraint program_cycles_failure_code_length check (generation_failure_code is null or char_length(generation_failure_code) between 1 and 120),
  constraint program_cycles_revision_positive check (revision > 0),
  constraint program_cycles_source_valid check (source in ('onboarding','manual','imported')),
  constraint program_cycles_workout_plan_pair check (
    (active_workout_plan_id is null and active_workout_plan_version is null)
    or (active_workout_plan_id is not null and active_workout_plan_version is not null)
  ),
  constraint program_cycles_nutrition_plan_pair check (
    (active_nutrition_plan_id is null and active_nutrition_plan_version is null)
    or (active_nutrition_plan_id is not null and active_nutrition_plan_version is not null)
  ),
  constraint program_cycles_ready_has_plans check (
    status not in ('ready','active','paused','completed')
    or (active_workout_plan_id is not null and active_nutrition_plan_id is not null and generated_at is not null)
  ),
  constraint program_cycles_active_timestamp check (status not in ('active','paused','completed') or activated_at is not null),
  constraint program_cycles_paused_timestamp check (status <> 'paused' or paused_at is not null),
  constraint program_cycles_completed_timestamp check (status <> 'completed' or completed_at is not null),
  constraint program_cycles_user_id_unique unique (id, user_id),
  constraint program_cycles_user_idempotency_unique unique (user_id, generation_idempotency_key),
  constraint program_cycles_workout_plan_fk foreign key (active_workout_plan_id, user_id, active_workout_plan_version)
    references public.workout_plans(id, user_id, version) on delete restrict,
  constraint program_cycles_nutrition_plan_fk foreign key (active_nutrition_plan_id, user_id, active_nutrition_plan_version)
    references public.nutrition_plans(id, user_id, version) on delete restrict
);

create unique index program_cycles_one_open_per_user_idx
  on public.program_cycles(user_id)
  where status in ('draft','generating','ready','failed','active','paused');
create index program_cycles_user_history_idx
  on public.program_cycles(user_id, created_at desc);

create trigger set_program_cycles_updated_at
before update on public.program_cycles
for each row execute function public.set_updated_at();

create or replace function public.enforce_program_cycle_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(
    new.user_id, new.schema_version, new.requested_duration_days, new.start_date,
    new.onboarding_schema_version, new.onboarding_updated_at,
    new.onboarding_snapshot_sha256, new.generation_idempotency_key,
    new.source, new.created_at
  ) is distinct from row(
    old.user_id, old.schema_version, old.requested_duration_days, old.start_date,
    old.onboarding_schema_version, old.onboarding_updated_at,
    old.onboarding_snapshot_sha256, old.generation_idempotency_key,
    old.source, old.created_at
  ) then
    raise exception 'immutable_program_cycle_metadata' using errcode = '55000';
  end if;
  if new.revision <> old.revision + 1 then
    raise exception 'invalid_program_cycle_revision' using errcode = '40001';
  end if;
  if new.status <> old.status and not (
    (old.status = 'draft' and new.status = 'generating')
    or (old.status = 'generating' and new.status in ('ready','failed'))
    or (old.status = 'failed' and new.status = 'generating')
    or (old.status = 'ready' and new.status = 'active')
    or (old.status = 'active' and new.status in ('paused','completed'))
    or (old.status = 'paused' and new.status in ('active','completed'))
  ) then
    raise exception 'invalid_program_cycle_transition' using errcode = '55000';
  end if;
  if row(
    new.active_workout_plan_id, new.active_workout_plan_version,
    new.active_nutrition_plan_id, new.active_nutrition_plan_version
  ) is distinct from row(
    old.active_workout_plan_id, old.active_workout_plan_version,
    old.active_nutrition_plan_id, old.active_nutrition_plan_version
  ) and old.status <> 'generating' then
    raise exception 'program_cycle_plan_linkage_locked' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger enforce_program_cycle_transition
before update on public.program_cycles
for each row execute function public.enforce_program_cycle_transition();

alter table public.program_cycles enable row level security;
revoke all on table public.program_cycles from public, anon, authenticated;
grant select on table public.program_cycles to authenticated;
grant insert (
  user_id, requested_duration_days, start_date,
  onboarding_schema_version, onboarding_updated_at, onboarding_snapshot_sha256,
  generation_idempotency_key
) on table public.program_cycles to authenticated;
grant update (
  status, generation_attempt, generation_failure_code,
  active_workout_plan_id, active_workout_plan_version,
  active_nutrition_plan_id, active_nutrition_plan_version,
  revision, generated_at, activated_at, paused_at, completed_at
) on table public.program_cycles to authenticated;

create policy "program_cycles_select_own" on public.program_cycles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "program_cycles_insert_own" on public.program_cycles
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_onboarding onboarding
      where onboarding.user_id = program_cycles.user_id
        and onboarding.status = 'completed'
        and onboarding.schema_version = onboarding_schema_version
        and onboarding.updated_at = onboarding_updated_at
        and onboarding.draft ->> 'version' = onboarding_schema_version::text
        and onboarding.draft -> 'confirmation' ->> 'startDate' = start_date::text
        and (onboarding.draft -> 'confirmation' ->> 'programDurationDays')::integer = requested_duration_days
        and (onboarding.draft -> 'confirmation' ->> 'finalConsent')::boolean = true
    )
  );
create policy "program_cycles_update_own" on public.program_cycles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.ensure_program_cycle(
  p_requested_duration_days integer,
  p_start_date date,
  p_onboarding_schema_version smallint,
  p_onboarding_updated_at timestamptz,
  p_onboarding_snapshot_sha256 text,
  p_generation_idempotency_key text
)
returns table (cycle_id uuid, cycle_status text, cycle_revision integer, created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.program_cycles%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_requested_duration_days not between 14 and 84 then
    raise exception 'invalid_program_duration' using errcode = '22023';
  end if;
  if p_onboarding_schema_version <= 0 or p_onboarding_updated_at is null then
    raise exception 'invalid_onboarding_provenance' using errcode = '22023';
  end if;
  if p_onboarding_snapshot_sha256 !~ '^[0-9a-f]{64}$'
    or p_generation_idempotency_key !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_program_fingerprint' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':program-cycle', 0));

  select * into v_existing from public.program_cycles
    where user_id = v_uid and generation_idempotency_key = p_generation_idempotency_key;
  if found then
    return query select v_existing.id, v_existing.status, v_existing.revision, false;
    return;
  end if;

  select * into v_existing from public.program_cycles
    where user_id = v_uid and status in ('draft','generating','ready','failed','active','paused')
    order by created_at desc limit 1;
  if found then
    if v_existing.onboarding_snapshot_sha256 = p_onboarding_snapshot_sha256
      and v_existing.requested_duration_days = p_requested_duration_days
      and v_existing.start_date = p_start_date then
      return query select v_existing.id, v_existing.status, v_existing.revision, false;
      return;
    end if;
    raise exception 'program_cycle_already_open' using errcode = '55000';
  end if;

  insert into public.program_cycles (
    user_id, requested_duration_days, start_date, onboarding_schema_version,
    onboarding_updated_at, onboarding_snapshot_sha256, generation_idempotency_key
  ) values (
    v_uid, p_requested_duration_days, p_start_date, p_onboarding_schema_version,
    p_onboarding_updated_at, p_onboarding_snapshot_sha256, p_generation_idempotency_key
  ) returning * into v_existing;

  return query select v_existing.id, v_existing.status, v_existing.revision, true;
end;
$$;

create or replace function public.transition_program_cycle(
  p_cycle_id uuid,
  p_expected_revision integer,
  p_target_status text,
  p_failure_code text default null
)
returns table (cycle_id uuid, cycle_status text, cycle_revision integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cycle public.program_cycles%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_target_status not in ('generating','ready','failed','active','paused','completed') then
    raise exception 'invalid_program_cycle_target' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':program-cycle', 0));
  select * into v_cycle from public.program_cycles
    where id = p_cycle_id and user_id = v_uid for update;
  if not found then raise exception 'program_cycle_not_found' using errcode = 'P0002'; end if;
  if v_cycle.revision <> p_expected_revision then
    raise exception 'stale_program_cycle_revision' using errcode = '40001';
  end if;
  if v_cycle.status = p_target_status then
    return query select v_cycle.id, v_cycle.status, v_cycle.revision;
    return;
  end if;
  if not (
    (v_cycle.status = 'draft' and p_target_status = 'generating')
    or (v_cycle.status = 'generating' and p_target_status in ('ready','failed'))
    or (v_cycle.status = 'failed' and p_target_status = 'generating')
    or (v_cycle.status = 'ready' and p_target_status = 'active')
    or (v_cycle.status = 'active' and p_target_status in ('paused','completed'))
    or (v_cycle.status = 'paused' and p_target_status in ('active','completed'))
  ) then
    raise exception 'invalid_program_cycle_transition' using errcode = '55000';
  end if;
  if p_target_status = 'ready' and (
    v_cycle.active_workout_plan_id is null or v_cycle.active_nutrition_plan_id is null
  ) then
    raise exception 'program_cycle_plans_missing' using errcode = '55000';
  end if;

  update public.program_cycles set
    status = p_target_status,
    revision = revision + 1,
    generation_attempt = case when p_target_status = 'generating' then generation_attempt + 1 else generation_attempt end,
    generation_failure_code = case
      when p_target_status = 'failed' then coalesce(nullif(left(btrim(p_failure_code), 120), ''), 'generation_failed')
      when p_target_status = 'generating' then null
      else generation_failure_code
    end,
    generated_at = case when p_target_status = 'ready' then coalesce(generated_at, now()) else generated_at end,
    activated_at = case when p_target_status = 'active' then coalesce(activated_at, now()) else activated_at end,
    paused_at = case when p_target_status = 'paused' then now() when p_target_status = 'active' then null else paused_at end,
    completed_at = case when p_target_status = 'completed' then now() else completed_at end
  where id = v_cycle.id
  returning * into v_cycle;

  return query select v_cycle.id, v_cycle.status, v_cycle.revision;
end;
$$;

revoke all on function public.ensure_program_cycle(integer,date,smallint,timestamptz,text,text) from public, anon;
grant execute on function public.ensure_program_cycle(integer,date,smallint,timestamptz,text,text) to authenticated;
revoke all on function public.transition_program_cycle(uuid,integer,text,text) from public, anon;
grant execute on function public.transition_program_cycle(uuid,integer,text,text) to authenticated;

comment on table public.program_cycles is 'User-owned course lifecycle and plan-version linkage. Stores hashes/provenance only, never raw prompts, provider secrets or duplicated health narratives.';
;
