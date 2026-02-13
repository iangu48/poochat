drop policy if exists chat_room_members_insert_self_or_room_creator on public.chat_room_members;

create policy chat_room_members_insert_self_or_room_creator
  on public.chat_room_members
  for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id
      and role = 'member'
    )
    or exists (
      select 1
      from public.chat_rooms r
      where r.id = public.chat_room_members.room_id
        and r.created_by = auth.uid()
        and public.chat_room_members.user_id = auth.uid()
        and public.chat_room_members.role = 'owner'
    )
    or exists (
      select 1
      from public.chat_rooms r
      where r.id = public.chat_room_members.room_id
        and r.created_by = auth.uid()
        and r.room_type = 'dm'
        and public.chat_room_members.role = 'member'
    )
  );
