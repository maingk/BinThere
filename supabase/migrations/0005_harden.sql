-- Hardening pass, driven by Supabase's database linter.

-- 1. Pin search_path on the functions that didn't set one. Without this a
--    caller can shadow `totes` with a temp table and change what runs.
alter function public.gen_tote_code() set search_path = '';
alter function public.touch_updated_at() set search_path = '';
alter function public.next_tote_index(text) set search_path = public;

-- 2. Move pg_trgm out of the public schema. Index opclasses are stored by OID,
--    so the existing GIN indexes follow the extension automatically.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- 3. Lock down function execution. PostgREST exposes every function in
--    `public` as an RPC endpoint, so anything not meant to be called over HTTP
--    needs its default PUBLIC grant revoked.

-- Trigger-only helpers: never called directly.
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.touch_parent_tote() from public, anon, authenticated;

-- Internal helper for mint_tote_codes.
revoke all on function public.gen_tote_code() from public, anon, authenticated;

-- Callable by signed-in users only. Each already refuses an anonymous caller,
-- but there's no reason to publish the endpoint at all.
revoke all on function public.current_household_id() from public, anon;
revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.join_household(text, text) from public, anon;
revoke all on function public.mint_tote_codes(int) from public, anon;
revoke all on function public.next_tote_index(text) from public, anon;
revoke all on function public.search_totes(text) from public, anon;

grant execute on function public.current_household_id() to authenticated;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
grant execute on function public.mint_tote_codes(int) to authenticated;
grant execute on function public.next_tote_index(text) to authenticated;
grant execute on function public.search_totes(text) to authenticated;
