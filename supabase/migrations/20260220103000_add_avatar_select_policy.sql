drop policy if exists storage_avatars_select_own on storage.objects;

create policy storage_avatars_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
