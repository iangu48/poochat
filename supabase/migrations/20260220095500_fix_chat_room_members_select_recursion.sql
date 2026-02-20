create or replace function public.is_room_member(target_room_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.chat_room_members m
    where m.room_id = target_room_id
      and m.user_id = target_user_id
  );
$$;

drop policy if exists chat_room_members_select_member on public.chat_room_members;

create policy chat_room_members_select_member
  on public.chat_room_members
  for select
  to authenticated
  using (
    public.is_room_member(public.chat_room_members.room_id)
  );
