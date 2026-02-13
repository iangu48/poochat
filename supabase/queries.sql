-- Useful query snippets for app services.

-- 1) Create a direct room if one does not exist between two users.
-- This query assumes application logic checks friendship=accepted first.
with existing as (
  select r.id
  from public.chat_rooms r
  join public.chat_room_members m1 on m1.room_id = r.id and m1.user_id = :me
  join public.chat_room_members m2 on m2.room_id = r.id and m2.user_id = :friend
  where r.is_direct = true
)
select id from existing;

-- 2) Leaderboard for current user/year.
select subject_id, username, display_name, score, avg_rating, rank
from public.yearly_friend_leaderboard
where viewer_id = auth.uid() and year = :year
order by rank asc;

-- 3) Friend list.
select
  case
    when requester_id = auth.uid() then addressee_id
    else requester_id
  end as friend_id
from public.friendships
where status = 'accepted'
  and (requester_id = auth.uid() or addressee_id = auth.uid());
