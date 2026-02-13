drop policy if exists chat_rooms_select_member on public.chat_rooms;
create policy chat_rooms_select_member
  on public.chat_rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_room_members m
      where m.room_id = public.chat_rooms.id
        and m.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.chat_room_invites i
      where i.room_id = public.chat_rooms.id
        and (i.invitee_id = auth.uid() or i.proposer_id = auth.uid())
    )
  );
