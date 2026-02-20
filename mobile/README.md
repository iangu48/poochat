# Mobile App

Expo + React Native app for Poochat MVP.

## Current Product Areas
- Auth
  - Phone OTP (recommended) and email/password login
- Onboarding
  - Required profile setup (`username`, `display_name`)
  - Default avatar support
- Home
  - Personal recent entries
  - Friends feed preview (latest 5)
  - Floating add-entry modal
- Social
  - Segmented `Feed`, `Friends`, `Chat`
  - Friends: send by username, accept incoming requests, open direct chat
  - Chat inbox: list of rooms, create group, unified `Unread` notifications
  - Chat room: realtime messages, grouped consecutive messages by sender
  - Group management actions (not available in direct chats)
- Account
  - Avatar upload
  - Feed visibility toggle
  - Current rank + leaderboard view (current/previous year)
  - Sign out

## Technical Notes
- Data/services live in `mobile/src/services/supabase.ts`
- App state and async orchestration live in `mobile/src/hooks/useAppController.ts`
- Buttons and actions use loading + disabled states to prevent duplicate submissions

## Prerequisites
- Node 20 (recommended via `nvm`)
- Expo SDK 54 compatible tooling

## Environment
Create `mobile/.env` with:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Run
From `mobile/`:

```bash
npm install
npm run start
```

If local LAN networking is unreliable, use Expo tunnel mode:

```bash
npx expo start --go --tunnel --clear
```

## Useful Scripts
- `npm run start` - start Expo dev server
- `npm run ios` - run iOS native project
- `npm run android` - run Android native project
- `npm run web` - run web preview
- `npm run typecheck` - run TypeScript checks
