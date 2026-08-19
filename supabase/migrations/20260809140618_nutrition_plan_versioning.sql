create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  schema_version smallint not null default 1,
  status text not null default 'draft',
  source text not null default 'manual',
  title text not null,
  plan jsonb not null,
  activated_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint nutrition_plans_version_positive check (version > 0),
  constraint nutrition_plans_schema_version_positive check (schema_version > 0),
  constraint nutrition_plans_status_valid check (status in ('draft','active','archived')),
  constraint nutrition_plans_source_valid check (source in ('manual','coach','onboarding','imported')),
  constraint nutrition_plans_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint nutrition_plans_plan_object check (jsonb_typeof(plan) = 'object'),
  constraint nutrition_plans_days_array check (jsonb_typeof(plan -> 'days') = 'array'),
  constraint nutrition_plans_days_count check (jsonb_array_length(plan -> 'days') between 1 and 14),
  constraint nutrition_plans_user_version_unique unique (user_id, version)
);

create unique index nutrition_plans_one_active_per_user_idx
  on public.nutrition_plans(user_id) where status='active';
create index nutrition_plans_user_version_idx
  on public.nutrition_plans(user_id, version desc);

alter table public.nutrition_plans enable row level security;
revoke all on table public.nutrition_plans from public, anon, authenticated;
grant select on table public.nutrition_plans to authenticated;
grant insert (user_id, version, schema_version, status, source, title, plan, activated_at, archived_at)
  on table public.nutrition_plans to authenticated;
grant update (status, activated_at, archived_at)
  on table public.nutrition_plans to authenticated;

create policy "nutrition_plans_select_own" on public.nutrition_plans
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "nutrition_plans_insert_own" on public.nutrition_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "nutrition_plans_update_own" on public.nutrition_plans
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.create_nutrition_plan_version(
  p_title text,
  p_plan jsonb,
  p_source text default 'manual',
  p_activate boolean default false
)
returns table (plan_id uuid, plan_version integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_version integer;
  v_id uuid;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_source not in ('manual','coach','onboarding','imported') then
    raise exception 'invalid_plan_source' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':nutrition-plan', 0));
  select coalesce(max(version),0)+1 into v_version from public.nutrition_plans where user_id=v_uid;
  if p_activate then
    update public.nutrition_plans set status='archived', archived_at=now()
      where user_id=v_uid and status='active';
  end if;
  insert into public.nutrition_plans(user_id,version,schema_version,status,source,title,plan,activated_at)
    values(v_uid,v_version,1,case when p_activate then 'active' else 'draft' end,p_source,btrim(p_title),p_plan,case when p_activate then now() else null end)
    returning id into v_id;
  return query select v_id,v_version;
end;
$$;

create or replace function public.activate_nutrition_plan(p_plan_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':nutrition-plan', 0));
  if not exists(select 1 from public.nutrition_plans where id=p_plan_id and user_id=v_uid) then
    raise exception 'nutrition_plan_not_found' using errcode='P0002';
  end if;
  update public.nutrition_plans set status='archived', archived_at=now()
    where user_id=v_uid and status='active' and id<>p_plan_id;
  update public.nutrition_plans set status='active', activated_at=coalesce(activated_at,now()), archived_at=null
    where id=p_plan_id and user_id=v_uid;
end;
$$;

revoke all on function public.create_nutrition_plan_version(text,jsonb,text,boolean) from public,anon;
grant execute on function public.create_nutrition_plan_version(text,jsonb,text,boolean) to authenticated;
revoke all on function public.activate_nutrition_plan(uuid) from public,anon;
grant execute on function public.activate_nutrition_plan(uuid) to authenticated;

alter table public.nutrition_entries
  add column nutrition_plan_id uuid references public.nutrition_plans(id) on delete set null,
  add column nutrition_plan_version integer,
  add column nutrition_plan_meal_id text;
create index nutrition_entries_nutrition_plan_id_idx
  on public.nutrition_entries(nutrition_plan_id) where nutrition_plan_id is not null;
create index nutrition_entries_plan_history_idx
  on public.nutrition_entries(user_id,nutrition_plan_id,local_date desc)
  where nutrition_plan_id is not null;

comment on table public.nutrition_plans is 'Versioned user-owned meal identity/portion plans. Calories/macros are not authoritative plan data; NeoFit resolves food identity/version and calculates nutrition through the shared Nutrition Core.';
comment on column public.nutrition_entries.nutrition_plan_id is 'Optional immutable plan provenance when a diary entry is created from a versioned Nutrition Plan.';;
