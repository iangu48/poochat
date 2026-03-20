alter table public.poop_entries
  add column if not exists volume smallint not null default 2 check (volume between 0 and 4);

create or replace view public.friend_feed_events
with (security_invoker = true) as
select
  e.id as entry_id,
  e.user_id as subject_id,
  p.username,
  p.display_name,
  e.occurred_at,
  e.rating,
  e.created_at,
  e.bristol_type,
  e.volume
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
