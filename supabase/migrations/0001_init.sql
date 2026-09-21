-- ToteNotes initial schema
-- Households, members, totes, items, categories, photos + RLS.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- households

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete set null,
  display_name text,
  created_at timestamptz not null default now()
);

create index profiles_household_idx on public.profiles (household_id);

-- Resolves the caller's household without re-entering RLS on profiles.
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------- categories

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  color text not null default 'slate',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create index categories_household_idx on public.categories (household_id);

-- --------------------------------------------------------------------- totes

create type public.tote_status as enum ('unclaimed', 'active', 'archived');

create table public.totes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- Value encoded in the printed QR label. Assigned at print time, never reused.
  code text not null unique,
  status public.tote_status not null default 'unclaimed',
  size_prefix text,
  index_no int,
  name text,
  category_id uuid references public.categories (id) on delete set null,
  description text,
  location text,
  created_by uuid references public.profiles (id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint totes_active_needs_label check (
    status = 'unclaimed' or (size_prefix is not null and index_no is not null)
  )
);

-- A tote's human label (e.g. "L-14") is unique within a household.
create unique index totes_label_key
  on public.totes (household_id, size_prefix, index_no)
  where size_prefix is not null and index_no is not null;

create index totes_household_idx on public.totes (household_id, status);
create index totes_category_idx on public.totes (category_id);
create index totes_name_trgm on public.totes using gin (name gin_trgm_ops);

-- --------------------------------------------------------------------- items

create table public.items (
  id uuid primary key default gen_random_uuid(),
  tote_id uuid not null references public.totes (id) on delete cascade,
  name text not null,
  quantity int not null default 1 check (quantity > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_tote_idx on public.items (tote_id);
create index items_name_trgm on public.items using gin (name gin_trgm_ops);

-- -------------------------------------------------------------------- photos
-- Storage-backed; no UI in v1, but the shape is fixed so adding one is additive.

create table public.tote_photos (
  id uuid primary key default gen_random_uuid(),
  tote_id uuid not null references public.totes (id) on delete cascade,
  storage_path text not null,
  caption text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index tote_photos_tote_idx on public.tote_photos (tote_id);

-- ------------------------------------------------------------------ triggers

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger totes_touch before update on public.totes
  for each row execute function public.touch_updated_at();
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

-- Keep the parent tote's updated_at fresh when its contents change,
-- so "recently updated" ordering reflects item edits too.
create or replace function public.touch_parent_tote()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.totes set updated_at = now()
  where id = coalesce(new.tote_id, old.tote_id);
  return coalesce(new, old);
end;
$$;

create trigger items_touch_tote after insert or update or delete on public.items
  for each row execute function public.touch_parent_tote();
