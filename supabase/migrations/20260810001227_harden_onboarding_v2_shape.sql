alter table public.user_onboarding
  add constraint user_onboarding_draft_version_matches
  check (
    jsonb_typeof(draft -> 'version') = 'number'
    and (draft ->> 'version')::smallint = schema_version
  );

alter table public.user_onboarding
  add constraint user_onboarding_v2_current_step_valid
  check (
    schema_version <> 2
    or current_step between 1 and 13
  );;
