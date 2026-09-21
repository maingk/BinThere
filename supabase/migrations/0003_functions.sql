-- RPCs for onboarding, code minting, labelling and search.

-- ------------------------------------------------------------- code minting
-- Crockford-style alphabet: no I, L, O or U, so a hand-read code is unambiguous.

create or replace function public.gen_tote_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- Creates `p_count` unclaimed totes and returns their codes, ready to print.
create or replace function public.mint_tote_codes(p_count int)
returns setof public.totes
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  hh uuid := public.current_household_id();
  i int;
  new_code text;
  attempts int;
begin
  if hh is null then
    raise exception 'no household for current user';
  end if;
  if p_count is null or p_count < 1 or p_count > 200 then
    raise exception 'p_count must be between 1 and 200';
  end if;

  for i in 1..p_count loop
    attempts := 0;
    loop
      new_code := public.gen_tote_code();
      exit when not exists (select 1 from public.totes where code = new_code);
      attempts := attempts + 1;
      if attempts > 20 then
        raise exception 'could not generate a unique tote code';
      end if;
    end loop;

    return query
      insert into public.totes (household_id, code, status, created_by)
      values (hh, new_code, 'unclaimed', auth.uid())
      returning *;
  end loop;
end;
$$;

-- Next free index number for a size prefix, e.g. next_tote_index('L') -> 15.
create or replace function public.next_tote_index(p_size_prefix text)
returns int
language sql
stable
security invoker
as $$
  select coalesce(max(index_no), 0) + 1
  from public.totes
  where household_id = public.current_household_id()
    and size_prefix = upper(p_size_prefix)
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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.households (name) values (p_name) returning id into hh;

  insert into public.profiles (id, household_id, display_name)
  values (auth.uid(), hh, p_display_name)
  on conflict (id) do update
    set household_id = excluded.household_id,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);

  insert into public.categories (household_id, name, color, sort_order)
  values
    (hh, 'Holiday Decorations', 'red',    10),
    (hh, 'Tableware',           'amber',  20),
    (hh, 'Electronics',         'blue',   30),
    (hh, 'Clothing',            'violet', 40),
    (hh, 'Books & Paper',       'emerald',50),
    (hh, 'Tools & Hardware',    'slate',  60),
    (hh, 'Kids & Toys',         'pink',   70),
    (hh, 'Keepsakes',           'teal',   80);

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

-- ------------------------------------------------------------------- search
-- Invoker rights on purpose: RLS confines results to the caller's household.

create or replace function public.search_totes(q text)
returns table (
  id uuid,
  code text,
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
  with needle as (select '%' || trim(q) || '%' as pat)
  select
    t.id,
    t.code,
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
      t.name        ilike (select pat from needle)
      or t.description ilike (select pat from needle)
      or t.location    ilike (select pat from needle)
      or t.code        ilike (select pat from needle)
      or c.name        ilike (select pat from needle)
      or coalesce(t.size_prefix, '') || '-' || coalesce(t.index_no::text, '')
           ilike (select pat from needle)
      or exists (
        select 1 from public.items i2
        where i2.tote_id = t.id and i2.name ilike (select pat from needle)
      )
    )
  group by t.id, c.name
  order by
    (t.name ilike (select pat from needle)) desc,
    t.size_prefix nulls last,
    t.index_no
$$;
