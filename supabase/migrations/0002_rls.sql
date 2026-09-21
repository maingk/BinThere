-- Row level security: everything is scoped to the caller's household.

alter table public.households   enable row level security;
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.totes        enable row level security;
alter table public.items        enable row level security;
alter table public.tote_photos  enable row level security;

-- ---------------------------------------------------------------- households

create policy households_select on public.households for select to authenticated
  using (id = public.current_household_id());

-- Anyone signed in may create a household; they then join it via their profile.
create policy households_insert on public.households for insert to authenticated
  with check (true);

create policy households_update on public.households for update to authenticated
  using (id = public.current_household_id())
  with check (id = public.current_household_id());

-- ------------------------------------------------------------------ profiles

create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid() or household_id = public.current_household_id());

create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------- household-scoped data tables

create policy categories_all on public.categories for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy totes_all on public.totes for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy items_all on public.items for all to authenticated
  using (exists (
    select 1 from public.totes t
    where t.id = items.tote_id and t.household_id = public.current_household_id()
  ))
  with check (exists (
    select 1 from public.totes t
    where t.id = items.tote_id and t.household_id = public.current_household_id()
  ));

create policy tote_photos_all on public.tote_photos for all to authenticated
  using (exists (
    select 1 from public.totes t
    where t.id = tote_photos.tote_id and t.household_id = public.current_household_id()
  ))
  with check (exists (
    select 1 from public.totes t
    where t.id = tote_photos.tote_id and t.household_id = public.current_household_id()
  ));
