# poochat

Poo tracking + friends leaderboard + chat.

## Current status
This repo now includes:
- `docs/mvp-v1.md` product scope
- `supabase/schema.sql` DB schema + RLS + leaderboard view
- `supabase/queries.sql` query snippets
- `mobile/` Expo app scaffold with working auth/log/leaderboard/chat tabs
- `mobile/src/services/supabase.ts` concrete Supabase services
- profile onboarding + friends flow + direct room chat creation

## Chosen stack
- Mobile: Expo + React Native + TypeScript
- Backend: Supabase (Auth, Postgres, Realtime)
- Data strategy for MVP: direct service calls (no TanStack yet)

## Run mobile app
1. `cd mobile`
2. `npm install`
3. `npm run start`

## Next implementation step
1. Add realtime subscription on `chat_messages` for active room
2. Add outgoing friend request state and cancel/decline actions
3. Add basic navigation stack and split tabs into separate screen files
4. Add profile editing from account tab

## Supabase setup
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL editor (initial bootstrap)
3. Apply SQL files in `supabase/migrations/` (incremental updates)
4. Copy `.env.example` to `.env` and set public keys
