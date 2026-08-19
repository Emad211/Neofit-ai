create table public.encrypted_integration_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  integration text not null,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  key_version smallint not null default 1,
  key_hint text not null,
  status text not null default 'active',
  cooldown_until timestamptz,
  last_validated_at timestamptz not null default now(),
  last_failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint encrypted_integration_credentials_integration_valid check (integration in ('youtube')),
  constraint encrypted_integration_credentials_key_version_positive check (key_version > 0),
  constraint encrypted_integration_credentials_key_hint_length check (char_length(key_hint) between 4 and 12),
  constraint encrypted_integration_credentials_status_valid check (status in ('active', 'invalid')),
  constraint encrypted_integration_credentials_ciphertext_length check (char_length(ciphertext) between 8 and 16384),
  constraint encrypted_integration_credentials_iv_length check (char_length(iv) between 8 and 128),
  constraint encrypted_integration_credentials_auth_tag_length check (char_length(auth_tag) between 8 and 128),
  constraint encrypted_integration_credentials_failure_code_length check (last_failure_code is null or char_length(last_failure_code) between 1 and 120),
  constraint encrypted_integration_credentials_user_integration_unique unique (user_id, integration)
);

create trigger encrypted_integration_credentials_set_updated_at
before update on public.encrypted_integration_credentials
for each row execute function public.set_updated_at();

alter table public.encrypted_integration_credentials enable row level security;
revoke all on table public.encrypted_integration_credentials from public, anon, authenticated;
grant select, insert, update, delete on table public.encrypted_integration_credentials to authenticated;

create policy encrypted_integration_credentials_select_own on public.encrypted_integration_credentials
for select to authenticated using ((select auth.uid()) = user_id);
create policy encrypted_integration_credentials_insert_own on public.encrypted_integration_credentials
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy encrypted_integration_credentials_update_own on public.encrypted_integration_credentials
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy encrypted_integration_credentials_delete_own on public.encrypted_integration_credentials
for delete to authenticated using ((select auth.uid()) = user_id);

create table public.agent_tool_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_name text not null,
  query_fingerprint text not null,
  status text not null default 'pending',
  result_count smallint,
  latency_ms integer,
  failure_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint agent_tool_audit_tool_valid check (tool_name in ('youtube_search')),
  constraint agent_tool_audit_fingerprint_length check (char_length(query_fingerprint) = 64),
  constraint agent_tool_audit_status_valid check (status in ('pending','success','failure')),
  constraint agent_tool_audit_result_count_valid check (result_count is null or result_count between 0 and 50),
  constraint agent_tool_audit_latency_valid check (latency_ms is null or latency_ms between 0 and 300000),
  constraint agent_tool_audit_failure_code_length check (failure_code is null or char_length(failure_code) between 1 and 120),
  constraint agent_tool_audit_completion_shape check (
    (status = 'pending' and completed_at is null)
    or (status in ('success','failure') and completed_at is not null)
  )
);

create index agent_tool_audit_user_created_idx on public.agent_tool_audit (user_id, created_at desc);
alter table public.agent_tool_audit enable row level security;
revoke all on table public.agent_tool_audit from public, anon, authenticated;
grant select on table public.agent_tool_audit to authenticated;
grant insert (user_id, tool_name, query_fingerprint) on table public.agent_tool_audit to authenticated;
grant update (status, result_count, latency_ms, failure_code, completed_at) on table public.agent_tool_audit to authenticated;

create policy agent_tool_audit_select_own on public.agent_tool_audit
for select to authenticated using ((select auth.uid()) = user_id);
create policy agent_tool_audit_insert_own_pending on public.agent_tool_audit
for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending');
create policy agent_tool_audit_complete_own_pending on public.agent_tool_audit
for update to authenticated
using ((select auth.uid()) = user_id and status = 'pending')
with check ((select auth.uid()) = user_id and status in ('success','failure'));

comment on table public.encrypted_integration_credentials is 'User-owned encrypted external integration credentials. Raw keys are never stored in plaintext or returned to the browser.';
comment on table public.agent_tool_audit is 'Metadata-only audit for bounded external Agent Tool calls. Raw search queries and result content are not stored.';;
