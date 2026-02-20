create or replace function public.random_avatar_tint()
returns text
language sql
volatile
set search_path = public, pg_catalog
as $$
  select (
    array[
      '#5b6c8a',
      '#6b8f71',
      '#8a6b5b',
      '#6b5b8a',
      '#5b8a86',
      '#8a855b',
      '#7a5b8a',
      '#5b7f8a'
    ]
  )[1 + floor(random() * 8)::int];
$$;

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_tint text not null default public.random_avatar_tint();

update public.profiles
set avatar_tint = public.random_avatar_tint()
where avatar_tint is null;

insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (
  select 1 from storage.buckets where id = 'avatars'
);

drop policy if exists storage_avatars_insert_own on storage.objects;
create policy storage_avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_avatars_update_own on storage.objects;
create policy storage_avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_avatars_delete_own on storage.objects;
create policy storage_avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
