alter table public.profiles
  add column if not exists share_feed boolean not null default true;

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

drop policy if exists poop_entries_select_visible on public.poop_entries;
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
