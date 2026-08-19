create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'fa',
  timezone text not null default 'Asia/Tehran',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (
      display_name is null
      or char_length(btrim(display_name)) between 1 and 80
    ),
  constraint profiles_locale_valid
    check (locale in ('fa', 'en')),
  constraint profiles_timezone_length
    check (char_length(btrim(timezone)) between 1 and 64)
);

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system',
  units text not null default 'metric',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_theme_valid
    check (theme in ('system', 'light', 'dark')),
  constraint user_settings_units_valid
    check (units in ('metric', 'imperial'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

revoke all on table public.profiles from public;
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;

revoke all on table public.user_settings from public;
revoke all on table public.user_settings from anon;
revoke all on table public.user_settings from authenticated;

grant select, insert, update, delete on table public.user_settings to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

create policy "user_settings_select_own"
on public.user_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_settings_insert_own"
on public.user_settings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_settings_update_own"
on public.user_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_settings_delete_own"
on public.user_settings
for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.profiles is
  'User-owned identity profile. Nutrition and clinical data are out of scope.';

comment on table public.user_settings is
  'User-owned display and unit preferences. Nutrition calculations are out of scope.';;
