create index nutrition_entries_plan_provenance_idx
on public.nutrition_entries (nutrition_plan_id, user_id, nutrition_plan_version)
where nutrition_plan_id is not null;

drop index if exists public.nutrition_entries_nutrition_plan_id_idx;
