alter table public.nutrition_entries
  drop constraint nutrition_entries_plan_provenance_shape;

alter table public.nutrition_entries
  add constraint nutrition_entries_plan_provenance_shape check (
    (
      nutrition_plan_id is null
      and nutrition_plan_version is null
      and nutrition_plan_meal_id is null
    )
    or
    (
      nutrition_plan_id is not null
      and nutrition_plan_version is not null
      and nutrition_plan_version > 0
      and nutrition_plan_meal_id is not null
      and char_length(btrim(nutrition_plan_meal_id)) between 1 and 160
    )
  );
