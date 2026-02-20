drop policy if exists storage_avatars_update_own on storage.objects;

create policy storage_avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );
