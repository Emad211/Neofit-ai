create table public.user_onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'draft',
  current_step smallint not null default 1,
  draft jsonb not null default '{}'::jsonb,
  schema_version smallint not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_onboarding_status_valid check (status in ('draft', 'completed')),
  constraint user_onboarding_current_step_valid check (current_step between 1 and 15),
  constraint user_onboarding_draft_object check (jsonb_typeof(draft) = 'object'),
  constraint user_onboarding_schema_version_positive check (schema_version > 0),
  constraint user_onboarding_completion_consistent check (
    (status = 'draft' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create trigger user_onboarding_set_updated_at
before update on public.user_onboarding
for each row execute function public.set_updated_at();

alter table public.user_onboarding enable row level security;

revoke all on table public.user_onboarding from public;
revoke all on table public.user_onboarding from anon;
revoke all on table public.user_onboarding from authenticated;
grant select, insert, update, delete on table public.user_onboarding to authenticated;

create policy "user_onboarding_select_own"
on public.user_onboarding for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user_onboarding_insert_own"
on public.user_onboarding for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_onboarding_update_own"
on public.user_onboarding for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_onboarding_delete_own"
on public.user_onboarding for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.user_onboarding is
  'Versioned user-owned onboarding draft including goals, medical constraints, injury body-map selections, lifestyle, availability and coaching preferences.';
