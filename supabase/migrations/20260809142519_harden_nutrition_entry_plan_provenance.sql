alter table public.nutrition_plans
  add constraint nutrition_plans_id_user_version_unique unique (id, user_id, version);

alter table public.nutrition_entries
  drop constraint nutrition_entries_nutrition_plan_id_fkey;

alter table public.nutrition_entries
  add constraint nutrition_entries_plan_provenance_fk
  foreign key (nutrition_plan_id, user_id, nutrition_plan_version)
  references public.nutrition_plans (id, user_id, version)
  deferrable initially deferred;

alter table public.nutrition_entries
  add constraint nutrition_entries_plan_provenance_shape check (
    nutrition_plan_id is null
    or (
      nutrition_plan_version is not null
      and nutrition_plan_version > 0
      and nutrition_plan_meal_id is not null
      and char_length(btrim(nutrition_plan_meal_id)) between 1 and 160
    )
  );;
