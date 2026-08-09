create or replace function public.reserve_agent_tool_call(
  p_tool_name text,
  p_query_fingerprint text
)
returns table(
  allowed boolean,
  audit_id uuid,
  burst_used integer,
  daily_used integer,
  retry_after_seconds integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_now timestamptz := clock_timestamp();
  v_burst integer;
  v_daily integer;
  v_id uuid;
  v_retry integer := 0;
  v_oldest timestamptz;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_tool_name <> 'youtube_search' then
    raise exception 'unsupported agent tool' using errcode = '22023';
  end if;
  if p_query_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid query fingerprint' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_tool_name, 0));

  select count(*)::integer into v_burst
  from public.agent_tool_audit
  where user_id = v_user_id
    and tool_name = p_tool_name
    and created_at >= v_now - interval '60 seconds';

  select count(*)::integer into v_daily
  from public.agent_tool_audit
  where user_id = v_user_id
    and tool_name = p_tool_name
    and created_at >= v_now - interval '24 hours';

  if v_burst >= 3 then
    select min(created_at) into v_oldest
    from public.agent_tool_audit
    where user_id = v_user_id
      and tool_name = p_tool_name
      and created_at >= v_now - interval '60 seconds';
    v_retry := greatest(1, ceil(extract(epoch from ((v_oldest + interval '60 seconds') - v_now)))::integer);
    return query select false, null::uuid, v_burst, v_daily, v_retry;
    return;
  end if;

  if v_daily >= 30 then
    select min(created_at) into v_oldest
    from public.agent_tool_audit
    where user_id = v_user_id
      and tool_name = p_tool_name
      and created_at >= v_now - interval '24 hours';
    v_retry := greatest(1, ceil(extract(epoch from ((v_oldest + interval '24 hours') - v_now)))::integer);
    return query select false, null::uuid, v_burst, v_daily, v_retry;
    return;
  end if;

  insert into public.agent_tool_audit (user_id, tool_name, query_fingerprint)
  values (v_user_id, p_tool_name, p_query_fingerprint)
  returning id into v_id;

  return query select true, v_id, v_burst + 1, v_daily + 1, 0;
end;
$$;

revoke all on function public.reserve_agent_tool_call(text, text) from public, anon;
grant execute on function public.reserve_agent_tool_call(text, text) to authenticated;
