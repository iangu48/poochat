# Poochat TODO

## Features
- [ ] Merge same-day, same-location entries into one marker with count badge and timestamp list.
- [ ] Add entry-detail state for grouped markers (multi-entry location drill-down).
- [ ] Add optional location privacy controls (exact vs rounded coordinates).
- [ ] Expand friend management (remove/block, sent-request states, mutuals).
- [ ] Add trigger journal tags per entry (food, stress, sleep, travel, meds) with trend correlations.
- [ ] Add privacy zones (home/work/custom geofences) to auto-obfuscate precise coordinates.
- [ ] Add travel mode (timezone/city change detection + routine disruption/recovery insights).
- [ ] Add monthly digestive persona summaries with personalized guidance.
- [ ] Add optional photo attachments to entries (private by default with clear retention controls; blocked pending legal/privacy/safety and moderation evaluation).
- [ ] Add clinician export (PDF/CSV summary of ratings, Bristol trends, notes, and outlier periods).
- [ ] Add pattern alerts for prolonged extremes or meaningful behavior changes.
- [ ] Add lightweight gamification (streaks, consistency milestones, insight unlocks).

## Optimization
- [ ] Reduce map rerenders (memoize marker data and stabilize callbacks).
- [ ] Optimize feed/comment rendering for larger datasets.
- [ ] Use selective refresh instead of full reloads after single mutations.
- [ ] Debounce expensive map region calculations during pan/zoom.
- [ ] Profile JS/UI thread during drawer + map interactions and remove frame drops.
- [ ] Add local caching layer (profiles, entries, feed, comments, friends) for fast cold-start and tab switching.
- [ ] Define cache invalidation strategy (TTL + event-based invalidation on writes/realtime updates).
- [ ] Add stale-while-revalidate behavior so cached data renders instantly and refreshes in background.

## UX/UI
- [ ] Full light/dark parity audit for all states (empty/loading/error/disabled).
- [ ] Improve marker visual states (selected, pressed, updating, inaccessible).
- [ ] Standardize button hierarchy (primary/secondary/danger/icon-only) across screens.
- [ ] Refine account page density and spacing consistency.
- [ ] Normalize motion across drawers, modals, and tab transitions.

## Testing
- [ ] Integration tests for auth (phone/email) and onboarding.
- [ ] Flow tests for create/edit/delete entry (including date/time + location updates).
- [ ] Comment tests (open drawer, post, refresh, keyboard behavior).
- [ ] Friend request tests (send/accept/error paths).
- [ ] Theme toggle persistence + map theme switching tests.
- [ ] Regression test for map centering/crosshair coordinate accuracy.
- [ ] Add cache consistency tests (read-after-write, invalidation, hydration, stale fallback).
- [ ] Add offline/online durability tests (queued writes, app restart recovery, replay idempotency).
- [ ] Add corruption simulation tests (bad cache payload/version mismatch should self-heal).
- [ ] Add dedicated test DB setup for integration/e2e test runs.
- [ ] Add seed reset command for test DB so each test run starts from a clean baseline.

## Stability / Reliability
- [ ] Replace manual `node_modules` map patch with a durable solution (`patch-package` or version strategy).
- [ ] Document and enforce supported dependency versions for current Expo SDK.
- [ ] Add runtime guards/fallbacks for location/map permission failures.
- [ ] Add error boundary + retry UX for critical network actions.
- [ ] Add cache/server consistency guardrails (schema versioning + payload validation).
- [ ] Add reconciliation flow for conflict cases (last-write-wins baseline, with conflict logging).
- [ ] Add write-ahead queue for offline mutations and guaranteed replay on reconnect.
- [ ] Add startup durability checks (cache integrity check + auto-repair/clear on corruption).

## Data / Backend
- [ ] Add backend query support for grouped map entries (day + geohash/rounded coords).
- [ ] Add indexes for high-frequency feed/comment/location queries.
- [ ] Re-verify RLS policies after recent schema and feature changes.
- [ ] Add migration checks and rollback notes for each schema change.
- [ ] Create deterministic seed dataset generator (users, friendships, entries, comments, locations).
- [ ] Add seed profiles for edge cases (no friends, heavy user, malformed/legacy data, privacy-off).
- [ ] Ensure seeds are idempotent and versioned alongside migrations.

## DevEx / Docs
- [ ] Update `docs/mvp-v1.md` to reflect map-first navigation and current UX.
- [ ] Update `mobile/README.md` with exact local setup/run/debug instructions.
- [ ] Add release checklist (SDK compatibility, iOS/Android smoke tests, migrations).
- [ ] Add commit conventions for feature/theme/refactor/test scopes.
- [ ] Document local test DB workflow (create, link, migrate, seed, reset).
- [ ] Add CI workflow step to provision test DB and run seed before integration tests.
