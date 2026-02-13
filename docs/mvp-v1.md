# Poochat MVP v1 (<100 DAU)

## Product scope
- Authentication (implemented)
  - Phone number auth via SMS OTP (preferred): send code, verify code, resend cooldown, OTP auto-verify at 6 digits.
  - Email/password sign in and sign up fallback.
  - Persistent auth session via Supabase auth storage on device.
- Profile (implemented)
  - Required onboarding profile (`username`, `display_name`) after first auth.
  - Username lookup used by social flows (friend requests, group invites).
- Poop logging (implemented)
  - Create entries with timestamp (`occurred_at`), Bristol type (1-7), rating (1-5), optional note.
  - Delete own entries.
  - Entry creation is intentionally behind a floating action button on Home (not always-expanded form).
- Feed visibility controls (implemented)
  - Feed visibility is account-level, not entry-level.
  - Profile setting `share_feed` determines whether friends can see your feed activity.
  - You can toggle this from Account screen.
- Friends system (implemented)
  - Send friend request by username.
  - Accept incoming friend requests.
  - List accepted friends.
  - Friend graph powers leaderboard scope and DM eligibility.
- Social feed (implemented)
  - Continuous feed for self + accepted friends from `friend_feed_events`.
  - Feed cards intentionally show limited details (timestamp + rating + identity).
  - Blocked relationships are excluded from feed visibility.
- Leaderboard (implemented)
  - Yearly ranking scoped to self + accepted friends.
  - Score is yearly entry count.
  - Tie-breakers: higher average rating, then stable subject ordering.
- Chat: direct + invite-only groups (implemented)
  - 1:1 direct rooms between accepted friends.
  - Private group rooms (`group_private`) with room name.
  - Room membership roles: `owner`, `admin`, `member`.
  - Group invites lifecycle:
    - members can propose invites,
    - owner/admin can approve or reject,
    - invitee can join once approved.
  - Room list, room open, message send/load flows in app.
- Realtime behavior (implemented)
  - Live message updates on active room via Supabase Realtime (`chat_messages` inserts).
  - Live invite state refresh on active room via Realtime (`chat_room_invites` changes).
- Security and access controls (implemented)
  - RLS enforced across profiles, entries, friendships, rooms, membership, messages, invites.
  - Feed and entry visibility enforced in DB policies and views.
  - Invite and moderation actions constrained by role-aware policies.
  - No region-based/public rooms in MVP; chat remains relationship/invite based.

## Non-goals (v1)
- AI insights
- image uploads
- public channels or region/topic discovery rooms
- advanced moderation
- offline-first sync

## Core screens
- Auth: phone OTP (preferred) + email fallback
- Home: recent entries + friends feed
- Add Entry Composer: opened from floating add button on Home
- Log Entry: create/edit/delete
- Friends: requests + friend list
- Leaderboard: year selector + ranked list
- Chat List: active DMs + private groups + approved invites
- Chat Room: realtime messages + room invite moderation (owner/admin)

## Event model
- Leaderboard updates when a poop entry is inserted/deleted.
- Chat messages update in realtime via Supabase Realtime subscriptions.
- Group invite status updates in realtime via Supabase Realtime subscriptions.

## Initial ranking rule
- `score = COUNT(poop_entries)` in that year.
- Tie-breakers:
  1. higher average `rating`
  2. earlier account creation (`profiles.created_at`)
