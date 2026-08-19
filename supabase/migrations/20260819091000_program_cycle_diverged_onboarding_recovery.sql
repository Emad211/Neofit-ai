-- Diverged-onboarding recovery.
--
-- Before this migration a Program Cycle in 'draft' or 'failed' had no terminal
-- exit. If a user re-completed onboarding after the cycle was pinned, the
-- generate action failed closed on the snapshot mismatch, yet the single-open
-- cycle index forbade creating a fresh cycle from the new answers. The user was
-- trapped with a permanently un-generatable cycle.
--
-- The fix adds one terminal status, 'abandoned', reachable only from the two
-- pre-generation states, plus a dedicated RPC to reach it. An abandoned cycle
-- already falls outside program_cycles_one_open_per_user_idx and the open-cycle
-- lookup inside ensure_program_cycle (both list only the six live statuses), so
-- discarding immediately frees the slot for a fresh, correctly-pinned cycle. No
-- generated plan is ever touched: only draft/failed cycles, which by definition
-- have no linked plans, can be discarded this way.

alter table public.program_cycles drop constraint program_cycles_status_valid;
alter table public.program_cycles add constraint program_cycles_status_valid
  check (status in ('draft','generating','ready','failed','active','paused','completed','abandoned'));

-- Re-declare the transition guard with the single new edge. Every other rule is
-- reproduced verbatim from 20260811120000 so behaviour is otherwise identical.
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
    or (old.status in ('draft','failed') and new.status = 'abandoned')
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

-- Dedicated, narrowly-scoped discard. Mirrors transition_program_cycle's
-- locking and optimistic-concurrency idiom but accepts only draft/failed and
-- can only ever produce 'abandoned', so it can never touch a live or generated
-- cycle. The update grant on program_cycles already covers status + revision.
create or replace function public.discard_program_cycle(
  p_cycle_id uuid,
  p_expected_revision integer
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

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':program-cycle', 0));
  select * into v_cycle from public.program_cycles
    where id = p_cycle_id and user_id = v_uid for update;
  if not found then raise exception 'program_cycle_not_found' using errcode = 'P0002'; end if;
  if v_cycle.revision <> p_expected_revision then
    raise exception 'stale_program_cycle_revision' using errcode = '40001';
  end if;
  if v_cycle.status not in ('draft','failed') then
    raise exception 'program_cycle_not_discardable' using errcode = '55000';
  end if;

  update public.program_cycles set
    status = 'abandoned',
    revision = revision + 1
  where id = v_cycle.id
  returning * into v_cycle;

  return query select v_cycle.id, v_cycle.status, v_cycle.revision;
end;
$$;

revoke all on function public.discard_program_cycle(uuid,integer) from public, anon;
grant execute on function public.discard_program_cycle(uuid,integer) to authenticated;

comment on function public.discard_program_cycle(uuid,integer) is 'Terminally abandons a pre-generation (draft/failed) cycle so a fresh cycle can be pinned to re-completed onboarding. Never touches a generated or live cycle.';
