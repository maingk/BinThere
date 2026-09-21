-- RPCs for onboarding, label minting, lookup and search.

-- ------------------------------------------------------------ household slug
-- Lowercase, no vowels-that-form-words, no ambiguous glyphs (i/l/o/0/1).

create or replace function public.gen_household_slug()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstvwxyz';
  result text := '';
  i int;
begin
  for i in 1..5 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- --------------------------------------------------------------- onboarding

create or replace function public.create_household(p_name text, p_display_name text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  hh uuid;
  new_slug text;
  attempts int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  loop
    new_slug := public.gen_household_slug();
    exit when not exists (select 1 from public.households where slug = new_slug);
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'could not generate a unique household slug';
    end if;
  end loop;

  insert into public.households (name, slug) values (p_name, new_slug) returning id into hh;

  insert into public.profiles (id, household_id, display_name)
  values (auth.uid(), hh, p_display_name)
  on conflict (id) do update
    set household_id = excluded.household_id,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);

  insert into public.categories (household_id, name, color, sort_order)
  values
    (hh, 'Holiday Decorations', 'red',     10),
    (hh, 'Tableware',           'amber',   20),
    (hh, 'Electronics',         'blue',    30),
    (hh, 'Clothing',            'violet',  40),
    (hh, 'Books & Paper',       'emerald', 50),
    (hh, 'Tools & Hardware',    'slate',   60),
    (hh, 'Kids & Toys',         'pink',    70),
    (hh, 'Keepsakes',           'teal',    80);

  return hh;
end;
$$;

-- Joining needs to read a household the caller cannot yet see, hence definer.
create or replace function public.join_household(p_invite_code text, p_display_name text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  hh uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into hh from public.households
  where lower(invite_code) = lower(trim(p_invite_code));

  if hh is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.profiles (id, household_id, display_name)
  values (auth.uid(), hh, p_display_name)
  on conflict (id) do update
    set household_id = excluded.household_id,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return hh;
end;
$$;

-- ------------------------------------------------------------ label minting

-- Next free sequence number for a size, e.g. next_tote_index('17G') -> 15.
create or replace function public.next_tote_index(p_size_prefix text)
returns int
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(max(index_no), 0) + 1
  from public.totes
  where household_id = public.current_household_id()
    and size_prefix = upper(trim(p_size_prefix))
$$;

-- Reserves `p_count` consecutive labels for a size, ready to print and stick.
-- The rows exist before the totes are filled in; scanning one opens the
-- registration form.
create or replace function public.mint_totes(p_size_prefix text, p_count int)
returns setof public.totes
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  hh uuid := public.current_household_id();
  prefix text := upper(trim(p_size_prefix));
  start_at int;
  i int;
begin
  if hh is null then
    raise exception 'no household for current user';
  end if;
  if p_count is null or p_count < 1 or p_count > 200 then
    raise exception 'p_count must be between 1 and 200';
  end if;
  if prefix !~ '^[0-9]{1,3}[A-Z]{1,2}$' then
    raise exception 'size must look like 17G or 27G, got %', p_size_prefix;
  end if;

  select coalesce(max(index_no), 0) + 1 into start_at
  from public.totes where household_id = hh and size_prefix = prefix;

  if start_at + p_count - 1 > 999 then
    raise exception 'that would run past label %-999', prefix;
  end if;

  for i in 0..(p_count - 1) loop
    return query
      insert into public.totes (household_id, size_prefix, index_no, status, created_by)
      values (hh, prefix, start_at + i, 'unclaimed', auth.uid())
      returning *;
  end loop;
end;
$$;

-- -------------------------------------------------------------------- lookup

-- Resolves a label a person typed off a sticker. Deliberately forgiving:
-- "17G-01", "17g 1" and "17G1" all find the same tote.
create or replace function public.find_tote_by_label(p_label text)
returns uuid
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  cleaned text;
  prefix text;
  idx int;
  found uuid;
begin
  cleaned := upper(regexp_replace(coalesce(p_label, ''), '[^0-9A-Za-z]', '', 'g'));

  -- Split "17G01" into a size prefix (digits + letters) and a sequence number.
  prefix := (regexp_match(cleaned, '^([0-9]{1,3}[A-Z]{1,2})([0-9]{1,3})$'))[1];
  idx    := (regexp_match(cleaned, '^([0-9]{1,3}[A-Z]{1,2})([0-9]{1,3})$'))[2]::int;

  if prefix is null or idx is null then
    return null;
  end if;

  select id into found from public.totes
  where household_id = public.current_household_id()
    and size_prefix = prefix
    and index_no = idx;

  return found;
end;
$$;

-- ------------------------------------------------------------------- search
-- Invoker rights on purpose: RLS confines results to the caller's household.

create or replace function public.search_totes(q text)
returns table (
  id uuid,
  size_prefix text,
  index_no int,
  name text,
  description text,
  location text,
  category_name text,
  matched_items text[],
  item_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with needle as (
    select
      '%' || trim(q) || '%' as pat,
      -- Lets "17G01", "17g-1" and "17G-01" all match the printed label.
      '%' || upper(regexp_replace(coalesce(q, ''), '[^0-9A-Za-z]', '', 'g')) || '%' as label_pat
  )
  select
    t.id,
    t.size_prefix,
    t.index_no,
    t.name,
    t.description,
    t.location,
    c.name as category_name,
    coalesce(
      array_agg(i.name order by i.name) filter (where i.name ilike (select pat from needle)),
      '{}'
    ) as matched_items,
    count(i.id) as item_count
  from public.totes t
  left join public.categories c on c.id = t.category_id
  left join public.items i on i.tote_id = t.id
  where t.status = 'active'
    and (
      t.name           ilike (select pat from needle)
      or t.description ilike (select pat from needle)
      or t.location    ilike (select pat from needle)
      or c.name        ilike (select pat from needle)
      or t.size_prefix || lpad(t.index_no::text, 2, '0') like (select label_pat from needle)
      or exists (
        select 1 from public.items i2
        where i2.tote_id = t.id and i2.name ilike (select pat from needle)
      )
    )
  group by t.id, c.name
  order by
    (t.name ilike (select pat from needle)) desc,
    t.size_prefix,
    t.index_no
$$;
