drop policy if exists storage_avatars_insert_own on storage.objects;

create policy storage_avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
  );
