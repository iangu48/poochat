# Poochat MVP v1 Status (<100 DAU)

Last updated: March 10, 2026.

This document reflects what is currently wired in the app shell and services, based on the code in `mobile/` and `supabase/`.

## Implemented and currently accessible
- Authentication
  - Phone auth via SMS OTP (send + verify, resend cooldown, auto-verify at 6 digits).
  - Email/password sign-in and sign-up fallback.
  - Persistent Supabase session handling.
- Onboarding and profile
  - Required profile setup (`username`, `display_name`) after first auth.
  - Profile lookup by username for social actions.
  - Avatar upload from media library to Supabase Storage (`avatars`).
  - Avatar shown across account, feed comments, and friends surfaces.
- Home (map-first)
  - Full-screen map as primary Home surface.
  - Add-entry flow from Home map action.
  - Entry composer supports Bristol type, comfort rating, date/time, optional note.
  - Entry location support (`latitude`, `longitude`, `location_source`) on create.
  - Current location lookup (`expo-location`) and map recenter support.
  - Home map shows today-only feed markers (self + accepted friends).
  - Marker tap opens comments drawer for that entry.
  - Friend actions moved to Home top action modal:
    - send friend request by username
    - accept incoming friend requests
  - Draggable map markers remain enabled only for own entries.
- Overview
  - Month overview stats with calendar drill-down.
  - Recent entries rail.
  - Entry edit/delete via actions menu.
- Account and leaderboard
  - Feed visibility toggle (`share_feed`) at profile level.
  - Current-year and previous-year rank display.
  - Year toggle with refresh for leaderboard rows.
  - Sign out.
- Security and data model
  - RLS policies for profiles, entries, friendships, feed comments, chat rooms/members/messages/invites.
  - Feed visibility and blocked relationship constraints enforced in SQL view/policies.
  - Location columns and paired lat/lng constraint on `poop_entries`.

## Implemented in code but not fully wired in current UI shell
- Chat domain/services/controller logic is implemented:
  - direct rooms, private groups, invite lifecycle, room roles
  - message send/load
  - realtime subscriptions for messages and invite state updates
- `ChatScreen.tsx` exists, but the current `App.tsx` shell does not mount `ChatScreen` or expose a chat entry point in the visible Social navigation.

## Known MVP limitations
- Friend request lifecycle is incomplete in UI:
  - no outgoing-request management (cancel)
  - no decline action for incoming requests
- No automated tests are currently present in the repo.
- Home map clustering behavior is platform-asymmetric (cluster path differs between Android and iOS).

## Non-goals (v1)
- AI insights
- public channels or region/topic discovery rooms
- advanced moderation workflows
- offline-first sync
- entry photo/media attachments (avatar upload is supported)

## Core screens currently mounted in app shell
- Auth (phone OTP preferred, email fallback)
- Onboarding profile setup
- Overview
- Home (map + today social feed + comments drawer + friend actions + entry composer)
- Account

## Event model
- Leaderboard ranks update when entries are inserted/deleted.
- Feed comments update on refresh (no feed-specific realtime channel yet).
- Chat message/invite realtime subscriptions are implemented in controller logic and activate when chat UI is mounted.

## Ranking rule
- `score = COUNT(poop_entries)` in selected year.
- Tie-breakers:
  1. higher average `rating`
  2. earlier account creation (`profiles.created_at`)
