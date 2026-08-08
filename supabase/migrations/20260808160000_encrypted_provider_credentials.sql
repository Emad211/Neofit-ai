create table public.encrypted_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  key_version smallint not null default 1,
  key_hint text not null,
  model_id text not null,
  status text not null default 'active',
  cooldown_until timestamptz,
  last_validated_at timestamptz not null default now(),
  last_failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint encrypted_provider_credentials_provider_valid check (provider in ('google', 'avalai')),
  constraint encrypted_provider_credentials_key_version_positive check (key_version > 0),
  constraint encrypted_provider_credentials_status_valid check (status in ('active', 'invalid')),
  constraint encrypted_provider_credentials_user_provider_unique unique (user_id, provider)
);

create index encrypted_provider_credentials_user_provider_idx
on public.encrypted_provider_credentials (user_id, provider);

create trigger encrypted_provider_credentials_set_updated_at
before update on public.encrypted_provider_credentials
for each row execute function public.set_updated_at();

alter table public.encrypted_provider_credentials enable row level security;

revoke all on table public.encrypted_provider_credentials from public;
revoke all on table public.encrypted_provider_credentials from anon;
revoke all on table public.encrypted_provider_credentials from authenticated;
grant select, insert, update, delete on table public.encrypted_provider_credentials to authenticated;

create policy "encrypted_provider_credentials_select_own"
on public.encrypted_provider_credentials
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "encrypted_provider_credentials_insert_own"
on public.encrypted_provider_credentials
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "encrypted_provider_credentials_update_own"
on public.encrypted_provider_credentials
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "encrypted_provider_credentials_delete_own"
on public.encrypted_provider_credentials
for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.encrypted_provider_credentials is
'User-owned encrypted BYOK provider credentials. Raw API keys never enter Browser storage or database plaintext.';
