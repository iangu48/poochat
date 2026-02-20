drop policy if exists chat_room_members_select_member on public.chat_room_members;

create policy chat_room_members_select_member
  on public.chat_room_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_room_members me
      where me.room_id = public.chat_room_members.room_id
        and me.user_id = auth.uid()
    )
  );
