do $$
begin
  if not exists (select 1 from pg_type where typname = 'poop_entry_visibility') then
    create type public.poop_entry_visibility as enum ('friends_default', 'private');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_room_type') then
    create type public.chat_room_type as enum ('dm', 'group_private');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_room_role') then
    create type public.chat_room_role as enum ('owner', 'admin', 'member');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_room_invite_status') then
    create type public.chat_room_invite_status as enum ('proposed', 'approved', 'rejected', 'joined', 'expired');
  end if;
end
$$;

alter table public.poop_entries
  add column if not exists visibility public.poop_entry_visibility not null default 'friends_default';

alter table public.chat_rooms
  add column if not exists room_type public.chat_room_type not null default 'dm',
  add column if not exists name text;

alter table public.chat_room_members
  add column if not exists role public.chat_room_role not null default 'member';

update public.chat_room_members m
set role = 'owner'
from public.chat_rooms r
where r.id = m.room_id
  and r.created_by = m.user_id
  and m.role <> 'owner';

create table if not exists public.chat_room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  proposer_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  approved_by uuid references public.profiles(id) on delete set null,
  status public.chat_room_invite_status not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  resolved_at timestamptz,
  check (proposer_id <> invitee_id)
);

create index if not exists poop_entries_visibility_idx
  on public.poop_entries(visibility);

create index if not exists chat_room_invites_room_status_idx
  on public.chat_room_invites(room_id, status, created_at desc);

create index if not exists chat_room_invites_invitee_status_idx
  on public.chat_room_invites(invitee_id, status, created_at desc);

create unique index if not exists chat_room_invites_pending_unique_idx
  on public.chat_room_invites(room_id, invitee_id)
  where status = 'proposed';

drop trigger if exists chat_room_invites_touch_updated_at on public.chat_room_invites;
create trigger chat_room_invites_touch_updated_at
before update on public.chat_room_invites
for each row execute function public.touch_updated_at();

create or replace view public.friend_feed_events
with (security_invoker = true) as
select
  e.id as entry_id,
  e.user_id as subject_id,
  p.username,
  p.display_name,
  e.occurred_at,
  e.rating,
  e.created_at
from public.poop_entries e
join public.profiles p on p.id = e.user_id
where (
  e.user_id = auth.uid()
  or (
    e.visibility = 'friends_default'
    and exists (
      select 1
      from public.accepted_friend_edges af
      where af.user_id = auth.uid()
        and af.friend_id = e.user_id
    )
  )
)
and not exists (
  select 1
  from public.friendships f
  where f.status = 'blocked'
    and (
      (f.requester_id = auth.uid() and f.addressee_id = e.user_id)
      or (f.requester_id = e.user_id and f.addressee_id = auth.uid())
    )
);

alter table public.chat_room_invites enable row level security;

drop policy if exists poop_entries_select_own on public.poop_entries;
drop policy if exists poop_entries_select_visible on public.poop_entries;
create policy poop_entries_select_visible
  on public.poop_entries
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      visibility = 'friends_default'
      and exists (
        select 1
        from public.accepted_friend_edges af
        where af.user_id = auth.uid()
          and af.friend_id = public.poop_entries.user_id
      )
      and not exists (
        select 1
        from public.friendships f
        where f.status = 'blocked'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = public.poop_entries.user_id)
            or (f.requester_id = public.poop_entries.user_id and f.addressee_id = auth.uid())
          )
      )
    )
  );

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
      from public.chat_room_members me
      where me.room_id = public.chat_room_members.room_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );

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
  with check (true);

drop policy if exists chat_room_invites_select_member_or_participant on public.chat_room_invites;
create policy chat_room_invites_select_member_or_participant
  on public.chat_room_invites
  for select
  to authenticated
  using (
    auth.uid() = proposer_id
    or auth.uid() = invitee_id
    or exists (
      select 1
      from public.chat_room_members me
      where me.room_id = public.chat_room_invites.room_id
        and me.user_id = auth.uid()
    )
  );

drop policy if exists chat_room_invites_insert_member_proposal on public.chat_room_invites;
create policy chat_room_invites_insert_member_proposal
  on public.chat_room_invites
  for insert
  to authenticated
  with check (
    auth.uid() = proposer_id
    and status = 'proposed'
    and exists (
      select 1
      from public.chat_room_members me
      where me.room_id = public.chat_room_invites.room_id
        and me.user_id = auth.uid()
    )
    and not exists (
      select 1
      from public.chat_room_members target
      where target.room_id = public.chat_room_invites.room_id
        and target.user_id = public.chat_room_invites.invitee_id
    )
  );

drop policy if exists chat_room_invites_update_owner_admin_or_invitee on public.chat_room_invites;
create policy chat_room_invites_update_owner_admin_or_invitee
  on public.chat_room_invites
  for update
  to authenticated
  using (
    (
      auth.uid() = invitee_id
      and status in ('approved', 'proposed')
    )
    or exists (
      select 1
      from public.chat_room_members me
      where me.room_id = public.chat_room_invites.room_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  )
  with check (
    (
      auth.uid() = invitee_id
      and status = 'joined'
    )
    or (
      exists (
        select 1
        from public.chat_room_members me
        where me.room_id = public.chat_room_invites.room_id
          and me.user_id = auth.uid()
          and me.role in ('owner', 'admin')
      )
      and status in ('approved', 'rejected', 'expired', 'proposed')
    )
  );

-- Realtime: stream invite updates as well.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_room_invites'
  ) then
    alter publication supabase_realtime add table public.chat_room_invites;
  end if;
end
$$;
