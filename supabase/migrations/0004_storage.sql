-- Private bucket for tote content photos. No UI in v1; wired up so the
-- photo feature is a front-end addition rather than a migration.

insert into storage.buckets (id, name, public)
values ('tote-photos', 'tote-photos', false)
on conflict (id) do nothing;

-- Objects live under <household_id>/<tote_id>/<file>, so the first path
-- segment is the tenant key.
create policy "tote photos are household scoped"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'tote-photos'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  )
  with check (
    bucket_id = 'tote-photos'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );
