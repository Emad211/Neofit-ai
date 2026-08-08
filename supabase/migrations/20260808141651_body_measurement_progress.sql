create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_mutation_id text not null,
  local_date date not null,
  measured_at timestamptz not null default now(),
  weight_kg numeric(7,2),
  waist_cm numeric(7,2),
  body_fat_percent numeric(5,2),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_measurements_client_mutation_length check (char_length(btrim(client_mutation_id)) between 1 and 120),
  constraint body_measurements_has_value check (weight_kg is not null or waist_cm is not null or body_fat_percent is not null),
  constraint body_measurements_weight_valid check (weight_kg is null or (weight_kg > 0 and weight_kg <= 1000)),
  constraint body_measurements_waist_valid check (waist_cm is null or (waist_cm > 0 and waist_cm <= 500)),
  constraint body_measurements_body_fat_valid check (body_fat_percent is null or (body_fat_percent >= 0 and body_fat_percent <= 100)),
  constraint body_measurements_note_length check (note is null or char_length(note) <= 1000),
  constraint body_measurements_user_mutation_unique unique (user_id, client_mutation_id)
);

create index body_measurements_user_measured_idx
  on public.body_measurements (user_id, measured_at desc);

create trigger body_measurements_set_updated_at
before update on public.body_measurements
for each row execute function public.set_updated_at();

alter table public.body_measurements enable row level security;

revoke all on table public.body_measurements from public;
revoke all on table public.body_measurements from anon;
revoke all on table public.body_measurements from authenticated;
grant select, insert, update, delete on table public.body_measurements to authenticated;

create policy "body_measurements_select_own"
on public.body_measurements for select to authenticated
using ((select auth.uid()) = user_id);

create policy "body_measurements_insert_own"
on public.body_measurements for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "body_measurements_update_own"
on public.body_measurements for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "body_measurements_delete_own"
on public.body_measurements for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.body_measurements is
  'User-owned body measurement history for real Progress trends. No synthetic personal values are seeded.';
