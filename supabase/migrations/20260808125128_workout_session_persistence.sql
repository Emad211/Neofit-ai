create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_mutation_id text not null,
  workout_id text not null,
  workout_title text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_minutes smallint,
  rpe smallint,
  pain_scale smallint,
  notes text,
  total_volume_kg numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_client_mutation_id_length check (char_length(btrim(client_mutation_id)) between 1 and 120),
  constraint workout_sessions_workout_id_length check (char_length(btrim(workout_id)) between 1 and 120),
  constraint workout_sessions_workout_title_length check (char_length(btrim(workout_title)) between 1 and 160),
  constraint workout_sessions_status_valid check (status in ('active', 'completed', 'cancelled')),
  constraint workout_sessions_duration_valid check (duration_minutes is null or duration_minutes between 1 and 1440),
  constraint workout_sessions_rpe_valid check (rpe is null or rpe between 1 and 10),
  constraint workout_sessions_pain_valid check (pain_scale is null or pain_scale between 0 and 10),
  constraint workout_sessions_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint workout_sessions_volume_valid check (total_volume_kg is null or total_volume_kg >= 0),
  constraint workout_sessions_completion_state check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null)),
  constraint workout_sessions_user_mutation_unique unique (user_id, client_mutation_id),
  constraint workout_sessions_id_user_unique unique (id, user_id)
);
create index workout_sessions_user_started_idx on public.workout_sessions (user_id, started_at desc);
create index workout_sessions_user_status_idx on public.workout_sessions (user_id, status, started_at desc);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  exercise_id text not null,
  exercise_name text not null,
  exercise_order smallint not null,
  set_order smallint not null,
  target_reps text not null,
  reps smallint,
  weight_kg numeric(8,2),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sets_session_owner_fk foreign key (session_id, user_id) references public.workout_sessions (id, user_id) on delete cascade,
  constraint workout_sets_exercise_id_length check (char_length(btrim(exercise_id)) between 1 and 160),
  constraint workout_sets_exercise_name_length check (char_length(btrim(exercise_name)) between 1 and 160),
  constraint workout_sets_exercise_order_valid check (exercise_order between 1 and 100),
  constraint workout_sets_set_order_valid check (set_order between 1 and 100),
  constraint workout_sets_target_reps_length check (char_length(btrim(target_reps)) between 1 and 40),
  constraint workout_sets_reps_valid check (reps is null or reps between 1 and 1000),
  constraint workout_sets_weight_valid check (weight_kg is null or weight_kg between 0 and 10000),
  constraint workout_sets_completion_valid check ((completed_at is null and reps is null and weight_kg is null) or (completed_at is not null and reps is not null and weight_kg is not null)),
  constraint workout_sets_session_order_unique unique (session_id, exercise_order, set_order)
);
create index workout_sets_user_session_idx on public.workout_sets (user_id, session_id, exercise_order, set_order);
create index workout_sets_user_exercise_idx on public.workout_sets (user_id, exercise_id, completed_at desc) where completed_at is not null;

create trigger workout_sessions_set_updated_at before update on public.workout_sessions for each row execute function public.set_updated_at();
create trigger workout_sets_set_updated_at before update on public.workout_sets for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

revoke all on table public.workout_sessions from public;
revoke all on table public.workout_sessions from anon;
revoke all on table public.workout_sessions from authenticated;
grant select, insert, update, delete on table public.workout_sessions to authenticated;
revoke all on table public.workout_sets from public;
revoke all on table public.workout_sets from anon;
revoke all on table public.workout_sets from authenticated;
grant select, insert, update, delete on table public.workout_sets to authenticated;

create policy "workout_sessions_select_own" on public.workout_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "workout_sessions_insert_own" on public.workout_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "workout_sessions_update_own" on public.workout_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workout_sessions_delete_own" on public.workout_sessions for delete to authenticated using ((select auth.uid()) = user_id);
create policy "workout_sets_select_own" on public.workout_sets for select to authenticated using ((select auth.uid()) = user_id);
create policy "workout_sets_insert_own" on public.workout_sets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "workout_sets_update_own" on public.workout_sets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workout_sets_delete_own" on public.workout_sets for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.workout_sessions is 'User-owned workout session summaries. Exercise/set detail lives in workout_sets; SQL performs no training arithmetic.';
comment on table public.workout_sets is 'User-owned set-level workout log rows linked to the owning workout session by a composite owner foreign key.';;
