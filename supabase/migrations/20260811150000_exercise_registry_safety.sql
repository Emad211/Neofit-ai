create table public.exercise_registry (
  id text primary key,
  catalog_version smallint not null default 1,
  name_fa text not null,
  name_en text not null,
  aliases_fa text[] not null default '{}',
  aliases_en text[] not null default '{}',
  movement_pattern text not null,
  primary_muscles text[] not null,
  secondary_muscles text[] not null default '{}',
  equipment text[] not null,
  difficulty text not null,
  contraindication_tags text[] not null default '{}',
  video_search_hints jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint exercise_registry_id_valid check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint exercise_registry_catalog_version_valid check (catalog_version = 1),
  constraint exercise_registry_names_valid check (char_length(btrim(name_fa)) between 1 and 160 and char_length(btrim(name_en)) between 1 and 160),
  constraint exercise_registry_movement_pattern_valid check (movement_pattern in ('squat','hinge','horizontal_push','vertical_push','horizontal_pull','vertical_pull','lunge','isolation')),
  constraint exercise_registry_primary_muscles_valid check (cardinality(primary_muscles) between 1 and 12),
  constraint exercise_registry_equipment_valid check (cardinality(equipment) between 1 and 8 and equipment <@ array['bodyweight','dumbbell','barbell','cable','bands','bench','full-gym','pull-up-bar','cardio-machine','landmine']::text[]),
  constraint exercise_registry_difficulty_valid check (difficulty in ('beginner','intermediate','advanced')),
  constraint exercise_registry_contraindications_valid check (contraindication_tags <@ array['shoulder_overhead','shoulder_extension','elbow_load','wrist_extension','spinal_axial_load','spinal_hinge','knee_deep_flexion','knee_shear','balance_demand','high_impact','valsalva_risk']::text[]),
  constraint exercise_registry_video_hints_object check (jsonb_typeof(video_search_hints) = 'object')
);

create table public.exercise_substitutions (
  source_exercise_id text not null references public.exercise_registry(id) on delete restrict,
  substitute_exercise_id text not null references public.exercise_registry(id) on delete restrict,
  reason text not null,
  priority smallint not null,
  created_at timestamptz not null default now(),
  primary key (source_exercise_id, substitute_exercise_id),
  constraint exercise_substitutions_distinct check (source_exercise_id <> substitute_exercise_id),
  constraint exercise_substitutions_reason_valid check (reason in ('equipment','skill_regression','joint_friendly','same_pattern')),
  constraint exercise_substitutions_priority_valid check (priority between 1 and 20)
);

insert into public.exercise_registry (
  id, name_fa, name_en, aliases_fa, aliases_en, movement_pattern,
  primary_muscles, secondary_muscles, equipment, difficulty,
  contraindication_tags, video_search_hints
) values
  ('bench-press','پرس سینه هالتر','Barbell bench press',array['پرس سینه'],array['bench press'],'horizontal_push',array['chest'],array['triceps','anterior-deltoid'],array['barbell','bench'],'intermediate',array['shoulder_extension','elbow_load','wrist_extension','valsalva_risk'],'{"fa":["آموزش فرم صحیح پرس سینه هالتر"],"en":["barbell bench press proper form"]}'),
  ('incline-db-press','پرس بالاسینه دمبل','Incline dumbbell press',array['پرس بالا سینه دمبل'],array['incline db press'],'horizontal_push',array['upper-chest'],array['triceps','anterior-deltoid'],array['dumbbell','bench'],'intermediate',array['shoulder_extension','shoulder_overhead','elbow_load','wrist_extension'],'{"fa":["آموزش پرس بالاسینه دمبل"],"en":["incline dumbbell press proper form"]}'),
  ('shoulder-press','پرس سرشانه دمبل','Dumbbell shoulder press',array['پرس سرشانه'],array['dumbbell overhead press'],'vertical_push',array['deltoids'],array['triceps'],array['dumbbell'],'intermediate',array['shoulder_overhead','elbow_load','wrist_extension','spinal_axial_load','valsalva_risk'],'{"fa":["آموزش پرس سرشانه دمبل"],"en":["dumbbell shoulder press proper form"]}'),
  ('triceps-pushdown','پشت بازو سیم‌کش','Cable triceps pushdown',array['پشت بازو کابل'],array['triceps pushdown'],'isolation',array['triceps'],array[]::text[],array['cable'],'beginner',array['elbow_load'],'{"fa":["آموزش پشت بازو سیم کش"],"en":["cable triceps pushdown proper form"]}'),
  ('lat-pulldown','لت سیم‌کش','Lat pulldown',array['لت از بالا'],array['cable lat pulldown'],'vertical_pull',array['latissimus'],array['biceps','upper-back'],array['cable'],'beginner',array['shoulder_overhead','elbow_load'],'{"fa":["آموزش لت سیم کش فرم صحیح"],"en":["lat pulldown proper form"]}'),
  ('row','قایقی سیم‌کش','Seated cable row',array['قایقی'],array['cable row'],'horizontal_pull',array['upper-back'],array['latissimus','biceps'],array['cable'],'beginner',array['elbow_load'],'{"fa":["آموزش قایقی سیم کش"],"en":["seated cable row proper form"]}'),
  ('rear-delt','نشر خم دمبل','Bent-over rear-delt raise',array['نشر خم'],array['rear delt raise'],'isolation',array['rear-deltoid'],array['upper-back'],array['dumbbell'],'beginner',array['shoulder_extension','spinal_hinge'],'{"fa":["آموزش نشر خم دمبل"],"en":["bent over rear delt raise form"]}'),
  ('curl','جلو بازو دمبل','Dumbbell curl',array['جلو بازو'],array['dumbbell biceps curl'],'isolation',array['biceps'],array['forearms'],array['dumbbell'],'beginner',array['elbow_load','wrist_extension'],'{"fa":["آموزش جلو بازو دمبل"],"en":["dumbbell curl proper form"]}'),
  ('squat','اسکوات هالتر','Barbell back squat',array['اسکوات'],array['back squat','barbell squat'],'squat',array['quadriceps','glutes'],array['hamstrings','core'],array['barbell'],'intermediate',array['knee_deep_flexion','knee_shear','spinal_axial_load','balance_demand','valsalva_risk'],'{"fa":["آموزش اسکوات هالتر فرم صحیح"],"en":["barbell back squat proper form"]}'),
  ('rdl','ددلیفت رومانیایی','Romanian deadlift',array['ددلیفت رومانیایی هالتر'],array['rdl'],'hinge',array['hamstrings','glutes'],array['back','forearms'],array['barbell'],'intermediate',array['spinal_hinge','valsalva_risk'],'{"fa":["آموزش ددلیفت رومانیایی"],"en":["romanian deadlift proper form"]}'),
  ('leg-press','پرس پا','Leg press',array['پرس پا دستگاه'],array['machine leg press'],'squat',array['quadriceps','glutes'],array['hamstrings'],array['full-gym'],'beginner',array['knee_deep_flexion','knee_shear','valsalva_risk'],'{"fa":["آموزش پرس پا دستگاه"],"en":["leg press proper form"]}'),
  ('calf-raise','ساق پا ایستاده','Standing calf raise',array['ساق پا'],array['standing calf raise'],'isolation',array['calves'],array[]::text[],array['bodyweight'],'beginner',array['balance_demand'],'{"fa":["آموزش ساق پا ایستاده"],"en":["standing calf raise proper form"]}'),
  ('push-up','شنا سوئدی','Push-up',array['شنا'],array['pushup'],'horizontal_push',array['chest'],array['triceps','anterior-deltoid'],array['bodyweight'],'beginner',array['shoulder_extension','elbow_load','wrist_extension'],'{"fa":["آموزش شنا سوئدی فرم صحیح"],"en":["push up proper form"]}'),
  ('dumbbell-floor-press','پرس سینه دمبل روی زمین','Dumbbell floor press',array['فلور پرس دمبل'],array['dumbbell floor press'],'horizontal_push',array['chest'],array['triceps'],array['dumbbell'],'beginner',array['elbow_load','wrist_extension'],'{"fa":["آموزش پرس سینه دمبل روی زمین"],"en":["dumbbell floor press proper form"]}'),
  ('half-kneeling-landmine-press','پرس لندماین نیم‌زانو','Half-kneeling landmine press',array['پرس لندماین'],array['landmine press'],'vertical_push',array['deltoids'],array['chest','triceps'],array['landmine'],'beginner',array['shoulder_overhead','elbow_load'],'{"fa":["آموزش پرس لندماین نیم زانو"],"en":["half kneeling landmine press form"]}'),
  ('band-triceps-extension','پشت بازو با کش','Band triceps extension',array['پشت بازو کشی'],array['band triceps pressdown'],'isolation',array['triceps'],array[]::text[],array['bands'],'beginner',array['elbow_load'],'{"fa":["آموزش پشت بازو با کش"],"en":["band triceps extension form"]}'),
  ('band-row','قایقی با کش','Resistance-band row',array['پارویی با کش'],array['band row'],'horizontal_pull',array['upper-back'],array['latissimus','biceps'],array['bands'],'beginner',array['elbow_load'],'{"fa":["آموزش قایقی با کش"],"en":["resistance band row proper form"]}'),
  ('face-pull','فیس پول','Cable face pull',array['فیس‌پول'],array['face pull'],'horizontal_pull',array['rear-deltoid','upper-back'],array['rotator-cuff'],array['cable'],'beginner',array['shoulder_extension','elbow_load'],'{"fa":["آموزش فیس پول"],"en":["cable face pull proper form"]}'),
  ('hammer-curl','جلو بازو چکشی','Hammer curl',array['جلو بازو دمبل چکشی'],array['dumbbell hammer curl'],'isolation',array['biceps','brachialis'],array['forearms'],array['dumbbell'],'beginner',array['elbow_load'],'{"fa":["آموزش جلو بازو چکشی"],"en":["hammer curl proper form"]}'),
  ('box-squat','اسکوات روی جعبه با وزن بدن','Bodyweight box squat',array['باکس اسکوات'],array['bodyweight box squat'],'squat',array['quadriceps','glutes'],array['hamstrings'],array['bodyweight'],'beginner',array['knee_deep_flexion','knee_shear','balance_demand'],'{"fa":["آموزش باکس اسکوات وزن بدن"],"en":["bodyweight box squat proper form"]}'),
  ('glute-bridge','پل باسن','Glute bridge',array['بریج باسن'],array['bodyweight glute bridge'],'hinge',array['glutes'],array['hamstrings','core'],array['bodyweight'],'beginner',array[]::text[],'{"fa":["آموزش پل باسن فرم صحیح"],"en":["glute bridge proper form"]}'),
  ('reverse-lunge','لانج معکوس','Reverse lunge',array['لانگز معکوس'],array['reverse lunge'],'lunge',array['quadriceps','glutes'],array['hamstrings'],array['bodyweight'],'beginner',array['knee_deep_flexion','knee_shear','balance_demand'],'{"fa":["آموزش لانج معکوس"],"en":["reverse lunge proper form"]}'),
  ('seated-calf-raise','ساق پا نشسته','Seated calf raise',array['ساق نشسته'],array['seated calf raise'],'isolation',array['calves'],array[]::text[],array['bodyweight'],'beginner',array[]::text[],'{"fa":["آموزش ساق پا نشسته"],"en":["seated calf raise proper form"]}');

insert into public.exercise_substitutions (source_exercise_id, substitute_exercise_id, reason, priority) values
  ('bench-press','push-up','equipment',1),
  ('bench-press','dumbbell-floor-press','joint_friendly',2),
  ('incline-db-press','push-up','equipment',1),
  ('shoulder-press','half-kneeling-landmine-press','joint_friendly',1),
  ('triceps-pushdown','band-triceps-extension','equipment',1),
  ('row','band-row','equipment',1),
  ('rear-delt','face-pull','same_pattern',1),
  ('curl','hammer-curl','joint_friendly',1),
  ('squat','box-squat','skill_regression',1),
  ('squat','glute-bridge','joint_friendly',2),
  ('leg-press','box-squat','equipment',1),
  ('leg-press','glute-bridge','joint_friendly',2),
  ('calf-raise','seated-calf-raise','joint_friendly',1);

revoke all on table public.exercise_registry, public.exercise_substitutions from public, anon, authenticated;
grant select on table public.exercise_registry to anon, authenticated;
grant select on table public.exercise_substitutions to anon, authenticated;

alter table public.workout_plans
  add column exercise_catalog_version smallint not null default 1,
  add constraint workout_plans_exercise_catalog_version_valid check (exercise_catalog_version = 1);

create or replace function public.validate_workout_plan_exercise_registry()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_day jsonb;
  v_exercise jsonb;
  v_exercise_id text;
  v_exercise_name text;
  v_canonical_name text;
  v_aliases text[];
begin
  if jsonb_typeof(new.plan -> 'days') <> 'array' then
    raise exception 'invalid_workout_plan_days' using errcode = '22023';
  end if;

  for v_day in select value from jsonb_array_elements(new.plan -> 'days') loop
    if jsonb_typeof(v_day) <> 'object' or jsonb_typeof(v_day -> 'exercises') <> 'array' then
      raise exception 'invalid_workout_plan_exercises' using errcode = '22023';
    end if;
    for v_exercise in select value from jsonb_array_elements(v_day -> 'exercises') loop
      if jsonb_typeof(v_exercise) <> 'object' then
        raise exception 'invalid_workout_plan_exercise' using errcode = '22023';
      end if;
      v_exercise_id := nullif(btrim(v_exercise ->> 'id'), '');
      v_exercise_name := nullif(btrim(v_exercise ->> 'name'), '');
      select name_fa, aliases_fa into v_canonical_name, v_aliases
      from public.exercise_registry
      where id = v_exercise_id
        and catalog_version = new.exercise_catalog_version
        and is_active = true;
      if not found then
        raise exception 'unregistered_exercise_id' using errcode = '23514';
      end if;
      if v_exercise_name is null or (v_exercise_name <> v_canonical_name and not (v_exercise_name = any(v_aliases))) then
        raise exception 'exercise_name_mismatch' using errcode = '23514';
      end if;
    end loop;
  end loop;
  return new;
end;
$$;

revoke all on function public.validate_workout_plan_exercise_registry() from public, anon, authenticated;

create trigger validate_workout_plan_exercise_registry
before insert or update of plan, exercise_catalog_version on public.workout_plans
for each row execute function public.validate_workout_plan_exercise_registry();

comment on table public.exercise_registry is 'Versioned deterministic exercise identities and safety tags. Publicly readable, never client-writable.';
comment on table public.exercise_substitutions is 'Curated directed substitutions. AI may rank these candidates but cannot invent persisted identities.';
