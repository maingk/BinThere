-- Function execution grants.
--
-- PostgREST publishes every function in `public` as an RPC endpoint, so the
-- default PUBLIC execute grant has to be revoked from anything that is not
-- meant to be called over HTTP.

-- Trigger-only helpers: never called directly.
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.touch_parent_tote() from public, anon, authenticated;

-- Internal helper for create_household.
revoke all on function public.gen_household_slug() from public, anon, authenticated;

-- Callable by signed-in users only. Each already refuses an anonymous caller,
-- but there is no reason to publish the endpoint at all.
revoke all on function public.current_household_id() from public, anon;
revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.join_household(text, text) from public, anon;
revoke all on function public.mint_totes(text, int) from public, anon;
revoke all on function public.next_tote_index(text) from public, anon;
revoke all on function public.find_tote_by_label(text) from public, anon;
revoke all on function public.search_totes(text) from public, anon;

grant execute on function public.current_household_id() to authenticated;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
grant execute on function public.mint_totes(text, int) to authenticated;
grant execute on function public.next_tote_index(text) to authenticated;
grant execute on function public.find_tote_by_label(text) to authenticated;
grant execute on function public.search_totes(text) to authenticated;
