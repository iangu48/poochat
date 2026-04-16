import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as TextInputHandle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { FEED_REACTION_OPTIONS } from '../types/domain';
import {
  createSupabaseFeedService,
  createSupabaseFriendsService,
  createSupabaseLeaderboardService,
  createSupabasePoopService,
  createSupabaseProfileService,
} from '../services/supabase';
import type {
  FeedItem,
  FeedComment,
  FeedReactionKind,
  FeedReactionSummary,
  IncomingFriendRequest,
  LeaderboardRow,
  PoopEntry,
  Profile,
} from '../types/domain';
import type { Tab } from '../screens/TabBar';

type AuthMethod = 'phone' | 'email';
export type SocialSection = 'feed' | 'friends';
export type ThemeMode = 'dark' | 'light';
const THEME_MODE_KEY = 'poochat.theme_mode';
type RefreshOptions = { minDurationMs?: number };

export function useAppController() {
  const [session, setSession] = useState<Session | null>(null);
  const currentUserId = session?.user.id;
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [authOtpCooldownSec, setAuthOtpCooldownSec] = useState(0);
  const [authVerifyingOtp, setAuthVerifyingOtp] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authSendingOtp, setAuthSendingOtp] = useState(false);
  const [lastAutoSubmittedOtp, setLastAutoSubmittedOtp] = useState('');
  const otpInputRef = useRef<TextInputHandle | null>(null);

  const profileService = useMemo(() => createSupabaseProfileService(supabase), []);
  const poopService = useMemo(() => createSupabasePoopService(supabase), []);
  const feedService = useMemo(() => createSupabaseFeedService(supabase), []);
  const friendsService = useMemo(() => createSupabaseFriendsService(supabase), []);
  const leaderboardService = useMemo(() => createSupabaseLeaderboardService(supabase), []);
  // Chat is intentionally disabled indefinitely. Keep it out of controller setup and startup work.

  const [tab, setTab] = useState<Tab>('home');
  const [socialSection, setSocialSection] = useState<SocialSection>('friends');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [toggleShareFeedLoading, setToggleShareFeedLoading] = useState(false);
  const [onboardingUsername, setOnboardingUsername] = useState('');
  const [onboardingDisplayName, setOnboardingDisplayName] = useState('');

  const [entries, setEntries] = useState<PoopEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [bristolType, setBristolType] = useState('4');
  const [rating, setRating] = useState('3');
  const [volume, setVolume] = useState('2');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(formatDateInput(new Date()));
  const [entryTime, setEntryTime] = useState(formatTimeInput(new Date()));
  const [showEntryComposer, setShowEntryComposer] = useState(false);
  const [entryComposerLocation, setEntryComposerLocation] = useState<{ latitude: number; longitude: number; source: 'gps' | 'manual' } | null>(null);
  const [addEntryLoading, setAddEntryLoading] = useState(false);
  const [updatingEntryLocationIds, setUpdatingEntryLocationIds] = useState<string[]>([]);
  const [deletingEntryIds, setDeletingEntryIds] = useState<string[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedCommentsByEntry, setFeedCommentsByEntry] = useState<Record<string, FeedComment[]>>({});
  const [feedReactionsByEntry, setFeedReactionsByEntry] = useState<Record<string, FeedReactionSummary>>({});
  const [feedCommentDraftByEntry, setFeedCommentDraftByEntry] = useState<Record<string, string>>({});
  const [feedCommentSubmittingEntryId, setFeedCommentSubmittingEntryId] = useState('');
  const [feedReactionSubmittingEntryId, setFeedReactionSubmittingEntryId] = useState('');
  const [feedError, setFeedError] = useState('');

  const [friendUsername, setFriendUsername] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [friendError, setFriendError] = useState('');
  const [friendStatus, setFriendStatus] = useState('');
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [sendFriendRequestLoading, setSendFriendRequestLoading] = useState(false);
  const [acceptingRequestIds, setAcceptingRequestIds] = useState<string[]>([]);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const [selectedLeaderboardYear, setSelectedLeaderboardYear] = useState<number>(currentYear);
  const [accountLeaderboardRows, setAccountLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [accountLeaderboardError, setAccountLeaderboardError] = useState('');
  const [accountLeaderboardLoading, setAccountLeaderboardLoading] = useState(false);
  const [currentYearRank, setCurrentYearRank] = useState<number | null>(null);
  const [previousYearRank, setPreviousYearRank] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (!active) return;
        if (stored === 'light' || stored === 'dark') {
          setThemeMode(stored);
        }
      } catch {
        // Keep default mode on storage failures.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authOtpCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setAuthOtpCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [authOtpCooldownSec]);

  useEffect(() => {
    if (authMethod !== 'phone') return;
    const token = authOtp.replace(/\D/g, '');
    if (token !== authOtp) {
      setAuthOtp(token);
      return;
    }
    if (token.length === 6 && token !== lastAutoSubmittedOtp && !authVerifyingOtp) {
      setLastAutoSubmittedOtp(token);
      void handleVerifyPhoneOtp(token);
    }
  }, [authMethod, authOtp, authVerifyingOtp, lastAutoSubmittedOtp]);

  useEffect(() => {
    if (!session) {
      setMyProfile(null);
      setEntries([]);
      setFeedItems([]);
      setFeedCommentsByEntry({});
      setFeedReactionsByEntry({});
      setFeedCommentDraftByEntry({});
      setFeedCommentSubmittingEntryId('');
      setFeedReactionSubmittingEntryId('');
      setFriends([]);
      setIncomingRequests([]);
      setProfilesById({});
      setAccountLeaderboardRows([]);
      setAccountLeaderboardError('');
      setCurrentYearRank(null);
      setPreviousYearRank(null);
      return;
    }
    void bootstrapAuthedState();
  }, [session]);

  async function bootstrapAuthedState(): Promise<void> {
    setProfileLoading(true);
    setProfileError('');
    try {
      const profile = await profileService.getMine(currentUserId);
      setMyProfile(profile);
      if (profile) {
        setProfilesById((prev) => ({ ...prev, [profile.id]: profile }));
      }
      if (profile) {
        await Promise.all([refreshEntries(), refreshFeed(), refreshFriends()]);
        await Promise.all([
          refreshAccountRankings(profile.id),
          loadAccountLeaderboard(profile.id, selectedLeaderboardYear),
        ]);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to load profile state.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshEntries(options: RefreshOptions = {}): Promise<void> {
    const startedAt = Date.now();
    setLoadingEntries(true);
    setEntryError('');
    try {
      const list = await poopService.listMine(30, currentUserId);
      setEntries(list);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to load entries.');
    } finally {
      await waitForMinimumDuration(startedAt, options.minDurationMs);
      setLoadingEntries(false);
    }
  }

  async function refreshFeed(options: RefreshOptions = {}): Promise<void> {
    const startedAt = Date.now();
    setFeedLoading(true);
    setFeedError('');
    try {
      const items = await feedService.listMineAndFriends(60);
      setFeedItems(items);
      const [comments, reactions] = await Promise.all([
        feedService.listCommentsByEntryIds(items.map((item) => item.entryId), 20),
        feedService.listReactionsByEntryIds(items.map((item) => item.entryId), currentUserId),
      ]);
      setFeedCommentsByEntry(comments);
      setFeedReactionsByEntry(reactions);
      if (items.length > 0) {
        setProfilesById((prev) =>
          mergeProfiles(
            prev,
            items.map((item) => ({
              id: item.subjectId,
              username: item.username,
              displayName: item.displayName,
              shareFeed: prev[item.subjectId]?.shareFeed ?? true,
              avatarUrl: item.avatarUrl,
              avatarTint: item.avatarTint,
            }))
          )
        );
      }
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Failed to load feed.');
    } finally {
      await waitForMinimumDuration(startedAt, options.minDurationMs);
      setFeedLoading(false);
    }
  }

  function setFeedCommentDraft(entryId: string, value: string): void {
    setFeedCommentDraftByEntry((prev) => ({ ...prev, [entryId]: value }));
  }

  async function handleAddFeedComment(entryId: string): Promise<void> {
    if (!entryId || feedCommentSubmittingEntryId === entryId) return;
    const draft = (feedCommentDraftByEntry[entryId] ?? '').trim();
    if (!draft) return;
    setFeedCommentSubmittingEntryId(entryId);
    setFeedError('');
    try {
      const created = await feedService.addComment(entryId, draft, currentUserId);
      setFeedCommentDraftByEntry((prev) => ({ ...prev, [entryId]: '' }));
      setFeedCommentsByEntry((prev) => ({
        ...prev,
        [entryId]: [created, ...(prev[entryId] ?? [])].slice(0, 20),
      }));
      void hydrateProfilesByIds([created.userId]);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Failed to add comment.');
    } finally {
      setFeedCommentSubmittingEntryId('');
    }
  }

  async function handleToggleFeedReaction(entryId: string, reaction: FeedReactionKind): Promise<void> {
    if (!entryId || feedReactionSubmittingEntryId === entryId) return;
    setFeedReactionSubmittingEntryId(entryId);
    setFeedError('');
    const previousSummary = feedReactionsByEntry[entryId] ?? {
      entryId,
      myReaction: null,
      counts: FEED_REACTION_OPTIONS.reduce<Record<string, number>>((acc, item) => {
        acc[item.key] = 0;
        return acc;
      }, {}),
      total: 0,
    };
    const optimisticReaction = previousSummary.myReaction === reaction ? null : reaction;

    setFeedReactionsByEntry((prev) => {
      const nextCounts: Record<string, number> = { ...previousSummary.counts };
      let nextTotal = previousSummary.total;

      if (previousSummary.myReaction) {
        nextCounts[previousSummary.myReaction] = Math.max(0, (nextCounts[previousSummary.myReaction] ?? 0) - 1);
        nextTotal = Math.max(0, nextTotal - 1);
      }

      if (optimisticReaction) {
        nextCounts[optimisticReaction] = (nextCounts[optimisticReaction] ?? 0) + 1;
        nextTotal += 1;
      }

      return {
        ...prev,
        [entryId]: {
          entryId,
          myReaction: optimisticReaction,
          counts: nextCounts,
          total: nextTotal,
        },
      };
    });

    try {
      await feedService.toggleReaction(entryId, reaction, currentUserId);
    } catch (error) {
      setFeedReactionsByEntry((prev) => ({
        ...prev,
        [entryId]: previousSummary,
      }));
      setFeedError(error instanceof Error ? error.message : 'Failed to set reaction.');
    } finally {
      setFeedReactionSubmittingEntryId('');
    }
  }

  async function refreshFriends(options: RefreshOptions = {}): Promise<void> {
    const startedAt = Date.now();
    setFriendsLoading(true);
    setFriendError('');
    try {
      const [accepted, incoming] = await Promise.all([
        friendsService.listAccepted(currentUserId),
        friendsService.listIncomingPending(currentUserId),
      ]);
      setFriends(accepted);
      setIncomingRequests(incoming);
      const nextProfiles = [...accepted, ...incoming.map((request) => request.from)];
      if (nextProfiles.length > 0) {
        setProfilesById((prev) => mergeProfiles(prev, nextProfiles));
      }
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : 'Failed to load friends.');
    } finally {
      await waitForMinimumDuration(startedAt, options.minDurationMs);
      setFriendsLoading(false);
    }
  }

  async function hydrateProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter((id) => Boolean(id))));
    if (uniqueIds.length === 0) return {};

    const { data, error } = await supabase
      .from('profiles')
      .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
      .in('id', uniqueIds);
    if (error) throw error;

    const next: Record<string, Profile> = {};
    for (const row of data ?? []) {
      const id = String(row.id);
      next[id] = {
        id,
        username: String(row.username),
        displayName: String(row.display_name),
        shareFeed: Boolean(row.share_feed ?? true),
        avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
        avatarTint: row.avatar_tint ? String(row.avatar_tint) : '#5b6c8a',
      };
    }

    if (Object.keys(next).length > 0) {
      setProfilesById((prev) => ({ ...prev, ...next }));
    }
    return next;
  }


  async function handleAuth(mode: 'sign-in' | 'sign-up'): Promise<void> {
    if (authSubmitting) return;
    setAuthSubmitting(true);
    setAuthError('');
    setAuthStatus('');
    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        setAuthStatus('Check your email for confirmation if required.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSendPhoneOtp(): Promise<void> {
    if (authSendingOtp) return;
    setAuthError('');
    setAuthStatus('');
    if (authOtpCooldownSec > 0) {
      setAuthError(`Please wait ${authOtpCooldownSec}s before requesting another code.`);
      return;
    }
    setAuthSendingOtp(true);
    try {
      const normalizedPhone = normalizePhone(authPhone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setAuthStatus(`SMS code sent to ${normalizedPhone}.`);
      setAuthOtpCooldownSec(30);
      setAuthOtp('');
      setLastAutoSubmittedOtp('');
      otpInputRef.current?.focus();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to send SMS code.');
    } finally {
      setAuthSendingOtp(false);
    }
  }

  async function handleVerifyPhoneOtp(tokenOverride?: string): Promise<void> {
    setAuthError('');
    setAuthStatus('');
    setAuthVerifyingOtp(true);
    try {
      const normalizedPhone = normalizePhone(authPhone);
      const token = (tokenOverride ?? authOtp).trim();
      if (!token) throw new Error('Enter the SMS code.');
      const { error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      setAuthStatus('Phone verification successful.');
      setAuthOtp('');
      setLastAutoSubmittedOtp('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to verify SMS code.');
    } finally {
      setAuthVerifyingOtp(false);
    }
  }

  async function handleSaveProfile(): Promise<void> {
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      const profile = await profileService.upsertMine({
        username: onboardingUsername,
        displayName: onboardingDisplayName,
      }, currentUserId);
      setMyProfile(profile);
      setProfilesById((prev) => ({ ...prev, [profile.id]: profile }));
      await Promise.all([
        refreshEntries(),
        refreshFriends(),
        refreshFeed(),
        refreshAccountRankings(profile.id),
        loadAccountLeaderboard(profile.id, selectedLeaderboardYear),
      ]);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAddEntry(): Promise<void> {
    if (addEntryLoading) return;
    setAddEntryLoading(true);
    setEntryError('');
    try {
      const typeValue = clampInt(Number(bristolType), 1, 7);
      const ratingValue = clampInt(Number(rating), 1, 5);
      const volumeValue = clampInt(Number(volume), 0, 4);
      const occurredAtIso = combineDateTimeInputs(entryDate, entryTime);
      if (editingEntryId) {
        await poopService.updateMine(editingEntryId, {
          occurredAt: occurredAtIso,
          bristolType: typeValue as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          rating: ratingValue as 1 | 2 | 3 | 4 | 5,
          volume: volumeValue as 0 | 1 | 2 | 3 | 4,
          note: note.trim() || undefined,
        }, currentUserId);
      } else {
        const currentLocation = entryComposerLocation ?? await getCurrentCoordinates();
        await poopService.createMine({
          occurredAt: occurredAtIso,
          bristolType: typeValue as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          rating: ratingValue as 1 | 2 | 3 | 4 | 5,
          volume: volumeValue as 0 | 1 | 2 | 3 | 4,
          note: note.trim() || undefined,
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
          locationSource: currentLocation?.source,
        }, currentUserId);
      }
      setNote('');
      setEditingEntryId(null);
      setEntryComposerLocation(null);
      setShowEntryComposer(false);
      await Promise.all([refreshEntries(), refreshFeed()]);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to save entry.');
    } finally {
      setAddEntryLoading(false);
    }
  }

  function openAddEntryComposer(): void {
    setEntryError('');
    setEditingEntryId(null);
    setBristolType('4');
    setRating('3');
    setVolume('2');
    setNote('');
    const now = new Date();
    setEntryDate(formatDateInput(now));
    setEntryTime(formatTimeInput(now));
    setEntryComposerLocation(null);
    setShowEntryComposer(true);
  }

  function closeEntryComposer(): void {
    setEditingEntryId(null);
    setEntryComposerLocation(null);
    setShowEntryComposer(false);
  }

  function handleStartEditEntry(entry: PoopEntry): void {
    setEntryError('');
    setEditingEntryId(entry.id);
    setBristolType(String(entry.bristolType));
    setRating(String(entry.rating));
    setVolume(String(entry.volume));
    setNote(entry.note ?? '');
    const occurredAtDate = new Date(entry.occurredAt);
    setEntryDate(formatDateInput(occurredAtDate));
    setEntryTime(formatTimeInput(occurredAtDate));
    setEntryComposerLocation(null);
    setShowEntryComposer(true);
  }

  function handleSetEntryComposerLocation(latitude: number, longitude: number, source: 'gps' | 'manual' = 'manual'): void {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    setEntryComposerLocation({ latitude: lat, longitude: lon, source });
  }

  async function handleDeleteEntry(entryId: string): Promise<void> {
    setDeletingEntryIds((prev) => (prev.includes(entryId) ? prev : [...prev, entryId]));
    setEntryError('');
    try {
      await poopService.deleteMine(entryId, currentUserId);
      await refreshEntries();
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to delete entry.');
    } finally {
      setDeletingEntryIds((prev) => prev.filter((id) => id !== entryId));
    }
  }

  async function handleUpdateEntryLocation(entryId: string, latitude: number, longitude: number): Promise<void> {
    if (!entryId.trim()) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setUpdatingEntryLocationIds((prev) => (prev.includes(entryId) ? prev : [...prev, entryId]));
    setEntryError('');
    try {
      const updated = await poopService.updateMine(entryId, {
        latitude,
        longitude,
        locationSource: 'manual',
      }, currentUserId);
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to update entry location.');
    } finally {
      setUpdatingEntryLocationIds((prev) => prev.filter((id) => id !== entryId));
    }
  }

  async function handleSendFriendRequest(): Promise<void> {
    if (sendFriendRequestLoading) return;
    setSendFriendRequestLoading(true);
    setFriendError('');
    setFriendStatus('');
    try {
      const profile = await profileService.findByUsername(friendUsername);
      if (!profile) {
        setFriendError('No user found with that username.');
        return;
      }
      await friendsService.sendRequest(profile.id, currentUserId);
      setFriendUsername('');
      setFriendStatus(`Request sent to @${profile.username}.`);
      await refreshFriends();
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : 'Failed to send request.');
    } finally {
      setSendFriendRequestLoading(false);
    }
  }

  async function handleAcceptRequest(friendshipId: string): Promise<void> {
    setAcceptingRequestIds((prev) => (prev.includes(friendshipId) ? prev : [...prev, friendshipId]));
    setFriendError('');
    setFriendStatus('');
    try {
      await friendsService.acceptRequest(friendshipId);
      setFriendStatus('Friend request accepted.');
      await refreshFriends();
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : 'Failed to accept request.');
    } finally {
      setAcceptingRequestIds((prev) => prev.filter((id) => id !== friendshipId));
    }
  }


  async function refreshAccountRankings(profileId: string): Promise<void> {
    try {
      const [rowsCurrent, rowsPrevious] = await Promise.all([
        leaderboardService.listYear(currentYear, currentUserId),
        leaderboardService.listYear(previousYear, currentUserId),
      ]);
      setCurrentYearRank(rowsCurrent.find((row) => row.subjectId === profileId)?.rank ?? null);
      setPreviousYearRank(rowsPrevious.find((row) => row.subjectId === profileId)?.rank ?? null);
    } catch {
      setCurrentYearRank(null);
      setPreviousYearRank(null);
    }
  }

  async function loadAccountLeaderboard(profileId: string, year: number, options: RefreshOptions = {}): Promise<void> {
    const startedAt = Date.now();
    setAccountLeaderboardLoading(true);
    setAccountLeaderboardError('');
    try {
      const rows = await leaderboardService.listYear(year, currentUserId);
      setAccountLeaderboardRows(rows);
      void hydrateProfilesByIds(rows.map((row) => row.subjectId));
      const myRank = rows.find((row) => row.subjectId === profileId)?.rank ?? null;
      if (year === currentYear) setCurrentYearRank(myRank);
      if (year === previousYear) setPreviousYearRank(myRank);
    } catch (error) {
      setAccountLeaderboardError(error instanceof Error ? error.message : 'Failed to load leaderboard.');
      setAccountLeaderboardRows([]);
    } finally {
      await waitForMinimumDuration(startedAt, options.minDurationMs);
      setAccountLeaderboardLoading(false);
    }
  }

  async function handleSelectLeaderboardYear(year: number): Promise<void> {
    setSelectedLeaderboardYear(year);
    if (!myProfile) return;
    await loadAccountLeaderboard(myProfile.id, year);
  }

  async function refreshAccountLeaderboard(options: RefreshOptions = {}): Promise<void> {
    if (!myProfile) return;
    await loadAccountLeaderboard(myProfile.id, selectedLeaderboardYear, options);
  }

  async function handleSignOut(): Promise<void> {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setTab('home');
    } finally {
      setSigningOut(false);
    }
  }

  async function handleToggleShareFeed(): Promise<void> {
    if (toggleShareFeedLoading || !myProfile) return;
    setToggleShareFeedLoading(true);
    setProfileError('');
    try {
      const updated = await profileService.setShareFeed(!myProfile.shareFeed, currentUserId);
      setMyProfile(updated);
      await refreshFeed();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update feed visibility.');
    } finally {
      setToggleShareFeedLoading(false);
    }
  }

  async function handleUploadAvatar(): Promise<void> {
    if (!myProfile) return;
    setProfileError('');
    setAvatarUploading(true);
    try {
      const imagePickerModule = 'expo-image-picker';
      const ImagePicker = (await import(imagePickerModule)) as {
        requestMediaLibraryPermissionsAsync: () => Promise<{ status: string }>;
        launchImageLibraryAsync: (options: {
          mediaTypes?: string[];
          allowsEditing?: boolean;
          aspect?: [number, number];
          quality?: number;
          base64?: boolean;
        }) => Promise<{
          canceled: boolean;
          assets?: Array<{ uri: string; mimeType?: string | null; base64?: string | null }>;
        }>;
      };

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setProfileError('Photo permission is required to upload an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('No image selected.');

      const updated = await profileService.uploadAvatar(
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
        asset.base64 ?? undefined,
        currentUserId
      );
      setMyProfile(updated);
      setProfilesById((prev) => ({ ...prev, [updated.id]: updated }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('expo-image-picker')) {
        setProfileError('Avatar upload requires expo-image-picker. Run `npx expo install expo-image-picker`.');
      } else {
        setProfileError(error instanceof Error ? error.message : 'Failed to upload avatar.');
      }
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleToggleThemeMode(): Promise<void> {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
    } catch {
      // Keep in-memory mode even if persistence fails.
    }
  }

  return {
    session,
    themeMode,
    handleToggleThemeMode,
    tab,
    setTab,
    socialSection,
    setSocialSection,
    authMethod,
    setAuthMethod,
    authEmail,
    setAuthEmail,
    authPhone,
    setAuthPhone,
    authOtp,
    setAuthOtp,
    authPassword,
    setAuthPassword,
    authError,
    authStatus,
    authOtpCooldownSec,
    authVerifyingOtp,
    authSubmitting,
    authSendingOtp,
    otpInputRef,
    handleAuth,
    handleSendPhoneOtp,
    handleVerifyPhoneOtp,
    myProfile,
    profilesById,
    profileLoading,
    profileError,
    profileSaving,
    avatarUploading,
    signingOut,
    toggleShareFeedLoading,
    onboardingUsername,
    setOnboardingUsername,
    onboardingDisplayName,
    setOnboardingDisplayName,
    handleSaveProfile,
    handleSignOut,
    handleToggleShareFeed,
    handleUploadAvatar,
    entries,
    loadingEntries,
    feedLoading,
    addEntryLoading,
    updatingEntryLocationIds,
    deletingEntryIds,
    entryError,
    bristolType,
    setBristolType,
    rating,
    setRating,
    volume,
    setVolume,
    note,
    setNote,
    entryDate,
    setEntryDate,
    entryTime,
    setEntryTime,
    showEntryComposer,
    editingEntryId,
    feedItems,
    feedCommentsByEntry,
    feedReactionsByEntry,
    feedCommentDraftByEntry,
    feedCommentSubmittingEntryId,
    feedReactionSubmittingEntryId,
    feedError,
    refreshEntries,
    refreshFeed,
    setFeedCommentDraft,
    handleAddFeedComment,
    handleToggleFeedReaction,
    handleDeleteEntry,
    handleUpdateEntryLocation,
    handleAddEntry,
    handleSetEntryComposerLocation,
    openAddEntryComposer,
    closeEntryComposer,
    handleStartEditEntry,
    friendUsername,
    setFriendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
    friendsLoading,
    sendFriendRequestLoading,
    acceptingRequestIds,
    handleSendFriendRequest,
    refreshFriends,
    handleAcceptRequest,
    currentYear,
    previousYear,
    selectedLeaderboardYear,
    accountLeaderboardRows,
    accountLeaderboardError,
    accountLeaderboardLoading,
    currentYearRank,
    previousYearRank,
    handleSelectLeaderboardYear,
    refreshAccountLeaderboard,
    currentUserId: session?.user.id ?? '',
  };
}

function clampInt(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatDateInput(value: Date): string {
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeInput(value: Date): string {
  if (Number.isNaN(value.getTime())) return '';
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function combineDateTimeInputs(dateInput: string, timeInput: string): string {
  const date = dateInput.trim();
  const time = timeInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Date must be in YYYY-MM-DD format.');
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('Time must be in HH:mm format.');
  const [year, month, day] = date.split('-').map((value) => Number(value));
  const [hour, minute] = time.split(':').map((value) => Number(value));
  const combined = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(combined.getTime())) throw new Error('Invalid date/time.');
  return combined.toISOString();
}

async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number; source: 'gps' } | null> {
  try {
    const Location = require('expo-location');
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const latitude = Number(position?.coords?.latitude);
    const longitude = Number(position?.coords?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude, source: 'gps' };
  } catch {
    return null;
  }
}

function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Phone number is required.');

  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    if (!/^\+\d{10,15}$/.test(digits)) throw new Error('Use phone format like +15551234567.');
    return digits;
  }

  const usDigits = digits.replace(/\D/g, '');
  if (/^\d{10}$/.test(usDigits)) return `+1${usDigits}`;
  if (/^\d{11,15}$/.test(usDigits)) return `+${usDigits}`;
  throw new Error('Use phone format like +15551234567.');
}

async function waitForMinimumDuration(startedAt: number, minDurationMs = 0): Promise<void> {
  const remaining = minDurationMs - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

function formatProfileLabel(displayName: unknown, username: unknown): string {
  const cleanDisplay = typeof displayName === 'string' ? displayName.trim() : '';
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  if (cleanDisplay && cleanUsername) return `${cleanDisplay} (@${cleanUsername})`;
  if (cleanDisplay) return cleanDisplay;
  if (cleanUsername) return `@${cleanUsername}`;
  return 'Member';
}

function mergeProfiles(existing: Record<string, Profile>, profiles: Profile[]): Record<string, Profile> {
  const next = { ...existing };
  for (const profile of profiles) {
    next[profile.id] = profile;
  }
  return next;
}
