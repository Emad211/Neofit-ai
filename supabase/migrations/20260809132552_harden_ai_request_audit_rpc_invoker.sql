revoke all on table public.ai_request_audit from authenticated;
grant select on table public.ai_request_audit to authenticated;
grant insert (user_id, request_kind) on table public.ai_request_audit to authenticated;
grant update (
  status, provider, model_id, fallback_from, attempt_count, router_latency_ms,
  input_chars, system_chars, output_chars, input_tokens, output_tokens,
  total_tokens, failure_code, completed_at
) on table public.ai_request_audit to authenticated;

create policy "ai_request_audit_insert_own_pending"
  on public.ai_request_audit
  for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

create policy "ai_request_audit_complete_own_pending"
  on public.ai_request_audit
  for update to authenticated
  using ((select auth.uid()) = user_id and status = 'pending')
  with check ((select auth.uid()) = user_id and status in ('success', 'failure'));

alter function public.reserve_ai_request(text, integer, integer) security invoker;
alter function public.complete_ai_request(uuid, text, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer, text) security invoker;

comment on function public.reserve_ai_request(text, integer, integer) is 'SECURITY INVOKER. Atomically reserves a request under auth.uid(); direct callers can only consume their own budget because column grants/RLS prevent backdating, deletion or cross-user writes.';
comment on function public.complete_ai_request(uuid, text, text, text, text, integer, integer, integer, integer, integer, integer, integer, integer, text) is 'SECURITY INVOKER. Completes only the caller-owned pending row; immutable budget fields remain outside authenticated UPDATE privileges.';
