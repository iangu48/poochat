# Mobile App

Expo + React Native app for Poochat MVP.

## Implemented in this pass
- Email/password auth
- Profile onboarding (`username`, `display_name`)
- Home tab: quick poop log + list + delete
- Friends tab: send request by username, accept incoming, list accepted friends
- Direct chat room open from friend list
- Leaderboard tab: yearly leaderboard query
- Chat tab: load/send messages for selected direct room + realtime updates
- Account tab: sign out
- Supabase-backed services in `src/services/supabase.ts`

## Run
From `mobile/`:

```bash
npm install
npm run start
```

## Environment
Set these in repo root `.env` (or Expo env mechanism):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
