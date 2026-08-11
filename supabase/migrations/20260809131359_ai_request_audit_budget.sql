create table public.ai_request_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_kind text not null,
  status text not null default 'pending',
  provider text,
  model_id text,
  fallback_from text,
  attempt_count smallint not null default 0,
  router_latency_ms integer,
  input_chars integer not null default 0,
  system_chars integer not null default 0,
  output_chars integer,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  failure_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ai_request_audit_kind_valid check (request_kind in ('coach', 'respond')),
  constraint ai_request_audit_status_valid check (status in ('pending', 'success', 'failure')),
  constraint ai_request_audit_provider_valid check (provider is null or provider in ('google', 'avalai')),
  constraint ai_request_audit_fallback_valid check (fallback_from is null or fallback_from in ('google', 'avalai')),
  constraint ai_request_audit_model_length check (model_id is null or char_length(model_id) between 1 and 120),
  constraint ai_request_audit_failure_length check (failure_code is null or char_length(failure_code) between 1 and 160),
  constraint ai_request_audit_attempt_count check (attempt_count between 0 and 2),
  constraint ai_request_audit_latency_nonnegative check (router_latency_ms is null or router_latency_ms between 0 and 300000),
  constraint ai_request_audit_char_counts check (
    input_chars between 0 and 50000 and
    system_chars between 0 and 50000 and
    (output_chars is null or output_chars between 0 and 200000)
  ),
  constraint ai_request_audit_token_counts check (
    (input_tokens is null or input_tokens between 0 and 10000000) and
    (output_tokens is null or output_tokens between 0 and 10000000) and
    (total_tokens is null or total_tokens between 0 and 20000000)
  )
);

create index ai_request_audit_user_created_idx
  on public.ai_request_audit (user_id, created_at desc);

alter table public.ai_request_audit enable row level security;

revoke all on table public.ai_request_audit from public;
revoke all on table public.ai_request_audit from anon;
revoke all on table public.ai_request_audit from authenticated;
grant select on table public.ai_request_audit to authenticated;

create policy "ai_request_audit_select_own"
  on public.ai_request_audit
  for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.reserve_ai_request(
  p_request_kind text,
  p_burst_limit integer default 12,
  p_hourly_limit integer default 120
)
returns table (
  allowed boolean,
  request_id uuid,
  burst_used integer,
  hourly_used integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_burst_limit integer := least(greatest(coalesce(p_burst_limit, 12), 1), 1000);
  v_hourly_limit integer;
  v_burst_count integer;
  v_hourly_count integer;
  v_retry integer := 0;
  v_request_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_request_kind not in ('coach', 'respond') then
    raise exception 'invalid_request_kind' using errcode = '22023';
  end if;

  v_hourly_limit := least(greatest(coalesce(p_hourly_limit, 120), v_burst_limit), 5000);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

  select count(*)::integer into v_burst_count
    from public.ai_request_audit
    where user_id = v_uid and created_at >= v_now - interval '60 seconds';

  select count(*)::integer into v_hourly_count
    from public.ai_request_audit
    where user_id = v_uid and created_at >= v_now - interval '1 hour';

  if v_burst_count >= v_burst_limit then
    select greatest(1, ceil(extract(epoch from (min(created_at) + interval '60 seconds' - v_now)))::integer)
      into v_retry
      from public.ai_request_audit
      where user_id = v_uid and created_at >= v_now - interval '60 seconds';
    return query select false, null::uuid, v_burst_count, v_hourly_count, v_retry;
    return;
  end if;

  if v_hourly_count >= v_hourly_limit then
    select greatest(1, ceil(extract(epoch from (min(created_at) + interval '1 hour' - v_now)))::integer)
      into v_retry
      from public.ai_request_audit
      where user_id = v_uid and created_at >= v_now - interval '1 hour';
    return query select false, null::uuid, v_burst_count, v_hourly_count, v_retry;
    return;
  end if;

  insert into public.ai_request_audit (user_id, request_kind)
  values (v_uid, p_request_kind)
  returning id into v_request_id;

  return query select true, v_request_id, v_burst_count + 1, v_hourly_count + 1, 0;
end;
$$;

create or replace function public.complete_ai_request(
  p_request_id uuid,
  p_status text,
  p_provider text default null,
  p_model_id text default null,
  p_fallback_from text default null,
  p_attempt_count integer default 0,
  p_router_latency_ms integer default null,
  p_input_chars integer default 0,
  p_system_chars integer default 0,
  p_output_chars integer default null,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_total_tokens integer default null,
  p_failure_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_status not in ('success', 'failure') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_provider is not null and p_provider not in ('google', 'avalai') then
    raise exception 'invalid_provider' using errcode = '22023';
  end if;
  if p_fallback_from is not null and p_fallback_from not in ('google', 'avalai') then
    raise exception 'invalid_fallback_provider' using errcode = '22023';
  end if;

  update public.ai_request_audit
  set
    status = p_status,
    provider = p_provider,
    model_id = case when p_model_id is null then null else left(p_model_id, 120) end,
    fallback_from = p_fallback_from,
    attempt_count = least(greatest(coalesce(p_attempt_count, 0), 0), 2)::smallint,
    router_latency_ms = case when p_router_latency_ms is null then null else least(greatest(p_router_latency_ms, 0), 300000) end,
    input_chars = least(greatest(coalesce(p_input_chars, 0), 0), 50000),
    system_chars = least(greatest(coalesce(p_system_chars, 0), 0), 50000),
    output_chars = case when p_output_chars is null then null else least(greatest(p_output_chars, 0), 200000) end,
    input_tokens = case when p_input_tokens is null then null else least(greatest(p_input_tokens, 0), 10000000) end,
    output_tokens = case when p_output_tokens is null then null else least(greatest(p_output_tokens, 0), 10000000) end,
    total_tokens = case when p_total_tokens is null then null else least(greatest(p_total_tokens, 0), 20000000) end,
    failure_code = case when p_failure_code is null or btrim(p_failure_code) = '' then null else left(btrim(p_failure_code), 160) end,
    completed_at = now()
  where id = p_request_id and user_id = v_uid and status = 'pending';
end;
$$;

revoke all on function public.reserve_ai_request(text, integer, integer) from public;
revoke all on function public.reserve_ai_request(text, integer, integer) from anon;
grant execute on function public.reserve_ai_request(text, integer, integer) to authenticated;

revoke all on function public.complete_ai_request(uuid, text, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer, text) from public;
revoke all on function public.complete_ai_request(uuid, text, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer, text) from anon;
grant execute on function public.complete_ai_request(uuid, text, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer, text) to authenticated;

comment on table public.ai_request_audit is 'Metadata-only AI request audit. Never stores prompts, model output text, raw provider payloads, or API keys.';
comment on function public.reserve_ai_request(text, integer, integer) is 'Atomically reserves a user AI request and enforces burst/hourly request budgets using auth.uid().';
comment on function public.complete_ai_request(uuid, text, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer, text) is 'Completes metadata for an already-reserved AI request owned by auth.uid().';;
