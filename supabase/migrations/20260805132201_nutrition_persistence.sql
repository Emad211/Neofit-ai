create table public.nutrition_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily jsonb not null default '{}'::jsonb,
  core_schema_version smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_goals_daily_object
    check (jsonb_typeof(daily) = 'object'),
  constraint nutrition_goals_schema_version_positive
    check (core_schema_version > 0)
);

create table public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_mutation_id text not null,
  local_date date not null,
  meal_type text not null,
  label text not null,
  source_type text not null,
  source_id text not null,
  estimate jsonb not null,
  core_schema_version smallint not null default 1,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_entries_client_mutation_id_length
    check (char_length(btrim(client_mutation_id)) between 1 and 120),
  constraint nutrition_entries_meal_type_valid
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  constraint nutrition_entries_label_length
    check (char_length(btrim(label)) between 1 and 160),
  constraint nutrition_entries_source_type_valid
    check (source_type in ('food', 'recipe', 'custom')),
  constraint nutrition_entries_source_id_length
    check (char_length(btrim(source_id)) between 1 and 200),
  constraint nutrition_entries_estimate_object
    check (
      jsonb_typeof(estimate) = 'object'
      and estimate ? 'grams'
      and estimate ? 'center'
      and jsonb_typeof(estimate -> 'center') = 'object'
      and (
        estimate -> 'grams' = 'null'::jsonb
        or jsonb_typeof(estimate -> 'grams') = 'number'
      )
    ),
  constraint nutrition_entries_schema_version_positive
    check (core_schema_version > 0),
  constraint nutrition_entries_user_mutation_unique
    unique (user_id, client_mutation_id)
);

create index nutrition_entries_user_date_idx
on public.nutrition_entries (user_id, local_date desc, logged_at desc);

create trigger nutrition_goals_set_updated_at
before update on public.nutrition_goals
for each row execute function public.set_updated_at();

create trigger nutrition_entries_set_updated_at
before update on public.nutrition_entries
for each row execute function public.set_updated_at();

alter table public.nutrition_goals enable row level security;
alter table public.nutrition_entries enable row level security;

revoke all on table public.nutrition_goals from public;
revoke all on table public.nutrition_goals from anon;
revoke all on table public.nutrition_goals from authenticated;
grant select, insert, update, delete on table public.nutrition_goals to authenticated;

revoke all on table public.nutrition_entries from public;
revoke all on table public.nutrition_entries from anon;
revoke all on table public.nutrition_entries from authenticated;
grant select, insert, update, delete on table public.nutrition_entries to authenticated;

create policy "nutrition_goals_select_own"
on public.nutrition_goals
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "nutrition_goals_insert_own"
on public.nutrition_goals
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "nutrition_goals_update_own"
on public.nutrition_goals
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "nutrition_goals_delete_own"
on public.nutrition_goals
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "nutrition_entries_select_own"
on public.nutrition_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "nutrition_entries_insert_own"
on public.nutrition_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "nutrition_entries_update_own"
on public.nutrition_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "nutrition_entries_delete_own"
on public.nutrition_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.nutrition_goals is
  'User-owned daily Nutrition Core goals. SQL stores the versioned JSON and performs no nutrition arithmetic.';

comment on table public.nutrition_entries is
  'User-owned Nutrition Core diary entries. estimate stores grams, center and optional range exactly as produced by Shared Core.';
