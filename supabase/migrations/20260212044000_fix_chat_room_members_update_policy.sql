drop policy if exists chat_room_members_update_owner_admin on public.chat_room_members;
create policy chat_room_members_update_owner_admin
  on public.chat_room_members
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.chat_room_members me
      where me.room_id = public.chat_room_members.room_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.chat_room_members me
      where me.room_id = public.chat_room_members.room_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );
