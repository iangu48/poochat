-- Poochat schema (Supabase/Postgres)
-- Applies cleanly on a fresh Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  display_name text not null check (char_length(display_name) between 1 and 40),
  share_feed boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.poop_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  occurred_at timestamptz not null,
  bristol_type smallint not null check (bristol_type between 1 and 7),
  rating smallint not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (note is null or char_length(note) <= 280)
);

create type public.friendship_status as enum ('pending', 'accepted', 'blocked');

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

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- One canonical row per pair (lower UUID first) to avoid duplicates.
create unique index if not exists friendships_pair_unique_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  is_direct boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_room_members (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

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

alter table public.profiles
  add column if not exists share_feed boolean not null default true;

alter table public.poop_entries
  add column if not exists visibility public.poop_entry_visibility not null default 'friends_default';

alter table public.chat_rooms
  add column if not exists room_type public.chat_room_type not null default 'dm',
  add column if not exists name text;

alter table public.chat_rooms
  alter column created_by set default auth.uid();

alter table public.chat_room_members
  add column if not exists role public.chat_room_role not null default 'member';

create index if not exists poop_entries_user_occurred_idx
  on public.poop_entries(user_id, occurred_at desc);

create index if not exists poop_entries_occurred_idx
  on public.poop_entries(occurred_at desc);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages(room_id, created_at desc);

create index if not exists friendships_requester_status_idx
  on public.friendships(requester_id, status);

create index if not exists friendships_addressee_status_idx
  on public.friendships(addressee_id, status);

create index if not exists poop_entries_visibility_idx
  on public.poop_entries(visibility);

create index if not exists chat_room_invites_room_status_idx
  on public.chat_room_invites(room_id, status, created_at desc);

create index if not exists chat_room_invites_invitee_status_idx
  on public.chat_room_invites(invitee_id, status, created_at desc);

create unique index if not exists chat_room_invites_pending_unique_idx
  on public.chat_room_invites(room_id, invitee_id)
  where status = 'proposed';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_room_admin(target_room_id uuid, target_user_id uuid default auth.uid())
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
      and m.role in ('owner', 'admin')
  );
$$;

drop trigger if exists poop_entries_touch_updated_at on public.poop_entries;
create trigger poop_entries_touch_updated_at
before update on public.poop_entries
for each row execute function public.touch_updated_at();

drop trigger if exists friendships_touch_updated_at on public.friendships;
create trigger friendships_touch_updated_at
before update on public.friendships
for each row execute function public.touch_updated_at();

drop trigger if exists chat_room_invites_touch_updated_at on public.chat_room_invites;
create trigger chat_room_invites_touch_updated_at
before update on public.chat_room_invites
for each row execute function public.touch_updated_at();

-- Helper view for accepted friend graph.
create or replace view public.accepted_friend_edges
with (security_invoker = true) as
select requester_id as user_id, addressee_id as friend_id
from public.friendships
where status = 'accepted'
union all
select addressee_id as user_id, requester_id as friend_id
from public.friendships
where status = 'accepted';

-- Feed events visible to the current user (self + accepted friends unless blocked).
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
    p.share_feed = true
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

-- Yearly leaderboard in friend scope (self + accepted friends).
create or replace view public.yearly_friend_leaderboard
with (security_invoker = true) as
with scoped_entries as (
  select
    u.id as viewer_id,
    p.id as subject_id,
    p.username,
    p.display_name,
    extract(year from e.occurred_at)::int as year,
    e.rating
  from public.profiles u
  join public.profiles p on p.id = u.id
  join public.poop_entries e on e.user_id = p.id
  union all
  select
    v.user_id as viewer_id,
    p.id as subject_id,
    p.username,
    p.display_name,
    extract(year from e.occurred_at)::int as year,
    e.rating
  from public.accepted_friend_edges v
  join public.profiles p on p.id = v.friend_id
  join public.poop_entries e on e.user_id = p.id
)
select
  viewer_id,
  subject_id,
  username,
  display_name,
  year,
  count(*)::int as score,
  round(avg(rating)::numeric, 2) as avg_rating,
  dense_rank() over (
    partition by viewer_id, year
    order by count(*) desc, avg(rating) desc, subject_id::text
  ) as rank
from scoped_entries
group by viewer_id, subject_id, username, display_name, year;

alter table public.profiles enable row level security;
alter table public.poop_entries enable row level security;
alter table public.friendships enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_room_invites enable row level security;

-- Profiles: anyone authenticated can read basic profile rows; users manage self.
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Poop entries: owner CRUD + feed visibility for accepted friends when account sharing is enabled.
create policy poop_entries_select_visible
  on public.poop_entries
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      exists (
        select 1
        from public.profiles p
        where p.id = public.poop_entries.user_id
          and p.share_feed = true
      )
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

create policy poop_entries_insert_own
  on public.poop_entries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy poop_entries_update_own
  on public.poop_entries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy poop_entries_delete_own
  on public.poop_entries
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Friendships: only involved users can read; requester creates; either side can update status.
create policy friendships_select_participants
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy friendships_insert_requester
  on public.friendships
  for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy friendships_update_participants
  on public.friendships
  for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Chat rooms/members/messages: visible only to members.
create policy chat_rooms_select_member
  on public.chat_rooms
  for select
  to authenticated
  using (
    public.chat_rooms.created_by = auth.uid()
    or
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

create policy chat_rooms_insert_creator
  on public.chat_rooms
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy chat_room_members_select_member
  on public.chat_room_members
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_room_admin(public.chat_room_members.room_id)
  );

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
    or (
      public.is_room_admin(public.chat_room_members.room_id)
      and public.chat_room_members.role = 'member'
    )
  );

create policy chat_room_members_update_owner_admin
  on public.chat_room_members
  for update
  to authenticated
  using (public.is_room_admin(public.chat_room_members.room_id))
  with check (public.is_room_admin(public.chat_room_members.room_id));

create policy chat_messages_select_member
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_room_members m2
      where m2.room_id = public.chat_messages.room_id
        and m2.user_id = auth.uid()
    )
  );

create policy chat_messages_insert_member_sender
  on public.chat_messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.chat_room_members m2
      where m2.room_id = public.chat_messages.room_id
        and m2.user_id = auth.uid()
    )
  );

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

-- Realtime: stream new chat messages to subscribed clients.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end
$$;

-- Realtime: stream invite updates to subscribed clients.
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
