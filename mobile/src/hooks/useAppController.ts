import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as TextInputHandle } from 'react-native';
import type { RealtimePostgresInsertPayload, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  createSupabaseChatService,
  createSupabaseFeedService,
  createSupabaseFriendsService,
  createSupabaseLeaderboardService,
  createSupabasePoopService,
  createSupabaseProfileService,
} from '../services/supabase';
import type {
  ChatMessage,
  ChatRoom,
  ChatRoomInvite,
  FeedItem,
  IncomingFriendRequest,
  LeaderboardRow,
  PoopEntry,
  Profile,
} from '../types/domain';
import type { Tab } from '../screens/TabBar';
import type { ChatRoute } from '../screens/ChatScreen';

type AuthMethod = 'phone' | 'email';
export type SocialSection = 'feed' | 'friends' | 'chat';

export function useAppController() {
  const [session, setSession] = useState<Session | null>(null);
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
  const chatService = useMemo(() => createSupabaseChatService(supabase), []);

  const [tab, setTab] = useState<Tab>('home');
  const [socialSection, setSocialSection] = useState<SocialSection>('friends');

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
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(formatDateInput(new Date()));
  const [entryTime, setEntryTime] = useState(formatTimeInput(new Date()));
  const [showEntryComposer, setShowEntryComposer] = useState(false);
  const [addEntryLoading, setAddEntryLoading] = useState(false);
  const [deletingEntryIds, setDeletingEntryIds] = useState<string[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedError, setFeedError] = useState('');

  const [friendUsername, setFriendUsername] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [friendError, setFriendError] = useState('');
  const [friendStatus, setFriendStatus] = useState('');
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [sendFriendRequestLoading, setSendFriendRequestLoading] = useState(false);
  const [acceptingRequestIds, setAcceptingRequestIds] = useState<string[]>([]);
  const [openDirectChatLoading, setOpenDirectChatLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const [selectedLeaderboardYear, setSelectedLeaderboardYear] = useState<number>(currentYear);
  const [accountLeaderboardRows, setAccountLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [accountLeaderboardError, setAccountLeaderboardError] = useState('');
  const [accountLeaderboardLoading, setAccountLeaderboardLoading] = useState(false);
  const [currentYearRank, setCurrentYearRank] = useState<number | null>(null);
  const [previousYearRank, setPreviousYearRank] = useState<number | null>(null);

  const [activeRoomId, setActiveRoomId] = useState('');
  const [chatRoute, setChatRoute] = useState<ChatRoute>('inbox');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomRole, setActiveRoomRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [approvalsRequired, setApprovalsRequired] = useState<ChatRoomInvite[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteQueue, setShowInviteQueue] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showRoomActions, setShowRoomActions] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [pendingInvites, setPendingInvites] = useState<ChatRoomInvite[]>([]);
  const [approvedInvitesForMe, setApprovedInvitesForMe] = useState<ChatRoomInvite[]>([]);
  const [inviteParticipantLabels, setInviteParticipantLabels] = useState<Record<string, string>>({});
  const [inviteRoomLabels, setInviteRoomLabels] = useState<Record<string, string>>({});
  const [chatRoomLabels, setChatRoomLabels] = useState<Record<string, string>>({});
  const [chatRoomProfiles, setChatRoomProfiles] = useState<Record<string, Profile>>({});
  const [chatUserLabels, setChatUserLabels] = useState<Record<string, string>>({});
  const [messageBody, setMessageBody] = useState('');
  const [chatRows, setChatRows] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [chatRefreshInboxLoading, setChatRefreshInboxLoading] = useState(false);
  const [chatCreateGroupLoading, setChatCreateGroupLoading] = useState(false);
  const [chatJoinInviteIdsLoading, setChatJoinInviteIdsLoading] = useState<string[]>([]);
  const [chatApproveInviteIdsLoading, setChatApproveInviteIdsLoading] = useState<string[]>([]);
  const [chatRejectInviteIdsLoading, setChatRejectInviteIdsLoading] = useState<string[]>([]);
  const [chatOpenRoomLoadingId, setChatOpenRoomLoadingId] = useState('');
  const [chatProposeInviteLoading, setChatProposeInviteLoading] = useState(false);
  const [chatRefreshMessagesLoading, setChatRefreshMessagesLoading] = useState(false);
  const [chatSendMessageLoading, setChatSendMessageLoading] = useState(false);

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
      setFriends([]);
      setIncomingRequests([]);
      setActiveRoomId('');
      setChatRoute('inbox');
      setActiveRoomRole(null);
      setChatRooms([]);
      setPendingInvites([]);
      setApprovedInvitesForMe([]);
      setApprovalsRequired([]);
      setInviteParticipantLabels({});
      setInviteRoomLabels({});
      setChatRoomLabels({});
      setChatRoomProfiles({});
      setChatUserLabels({});
      setProfilesById({});
      setAccountLeaderboardRows([]);
      setAccountLeaderboardError('');
      setCurrentYearRank(null);
      setPreviousYearRank(null);
      return;
    }
    void bootstrapAuthedState();
  }, [session]);

  useEffect(() => {
    if (!session || !activeRoomId) return;
    const channel = supabase
      .channel(`chat-room-${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload: RealtimePostgresInsertPayload<{
          id: string;
          room_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        }>) => {
          const incoming = asRealtimeMessage(payload);
          if (!incoming) return;
          setChatRows((prev) => mergeMessages(prev, incoming));
          void hydrateChatUserLabels([incoming.senderId]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRoomId, session]);

  useEffect(() => {
    if (!session || !activeRoomId) return;
    const channel = supabase
      .channel(`chat-room-invites-${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_room_invites',
          filter: `room_id=eq.${activeRoomId}`,
        },
        () => {
          void refreshPendingInvites(activeRoomId);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRoomId, session]);

  async function bootstrapAuthedState(): Promise<void> {
    setProfileLoading(true);
    setProfileError('');
    try {
      const profile = await profileService.getMine();
      setMyProfile(profile);
      if (profile) {
        setProfilesById((prev) => ({ ...prev, [profile.id]: profile }));
      }
      if (profile) {
        await Promise.all([refreshEntries(), refreshFeed(), refreshFriends(), refreshMyApprovedInvites()]);
        const rooms = await refreshRooms();
        await Promise.all([
          refreshApprovalsRequired(rooms),
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

  async function refreshEntries(): Promise<void> {
    setLoadingEntries(true);
    setEntryError('');
    try {
      const list = await poopService.listMine(30);
      setEntries(list);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to load entries.');
    } finally {
      setLoadingEntries(false);
    }
  }

  async function refreshFeed(): Promise<void> {
    setFeedLoading(true);
    setFeedError('');
    try {
      const items = await feedService.listMineAndFriends(60);
      setFeedItems(items);
      void hydrateProfilesByIds(items.map((item) => item.subjectId));
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Failed to load feed.');
    } finally {
      setFeedLoading(false);
    }
  }

  async function refreshFriends(): Promise<void> {
    setFriendsLoading(true);
    setFriendError('');
    try {
      const [accepted, incoming] = await Promise.all([
        friendsService.listAccepted(),
        friendsService.listIncomingPending(),
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
      setFriendsLoading(false);
    }
  }

  async function refreshRooms(): Promise<ChatRoom[]> {
    setChatError('');
    try {
      const rooms = await chatService.listRooms();
      setChatRooms(rooms);
      try {
        await hydrateChatRoomLabels(rooms);
      } catch {
        // Keep room list usable even if profile label hydration fails.
      }
      return rooms;
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load rooms.');
      return [];
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

  async function hydrateChatUserLabels(userIds: string[]): Promise<Record<string, string>> {
    const hydratedProfiles = await hydrateProfilesByIds(userIds);
    const next: Record<string, string> = {};
    for (const profile of Object.values(hydratedProfiles)) {
      next[profile.id] = formatProfileLabel(profile.displayName, profile.username);
    }
    if (Object.keys(next).length > 0) {
      setChatUserLabels((prev) => ({ ...prev, ...next }));
    }
    return next;
  }

  async function hydrateChatRoomLabels(rooms: ChatRoom[]): Promise<void> {
    const myUserId = session?.user.id;
    const next: Record<string, string> = {};
    for (const room of rooms) {
      if (room.type !== 'dm') {
        next[room.id] = room.name?.trim() || 'Untitled Group';
      }
    }

    const directRooms = rooms.filter((room) => room.type === 'dm');
    if (directRooms.length === 0 || !myUserId) {
      for (const room of directRooms) {
        next[room.id] = room.name?.trim() || 'Direct Chat';
      }
      setChatRoomLabels((prev) => ({ ...prev, ...next }));
      return;
    }

    const dmRoomIds = directRooms.map((room) => room.id);
    const { data, error } = await supabase
      .from('chat_room_members')
      .select('room_id,user_id')
      .in('room_id', dmRoomIds);
    if (error) throw error;

    const otherUserByRoom = new Map<string, string>();
    for (const row of data ?? []) {
      const roomId = String(row.room_id);
      const userId = String(row.user_id);
      if (!roomId || !userId) continue;
      if (userId !== myUserId) {
        otherUserByRoom.set(roomId, userId);
      } else if (!otherUserByRoom.has(roomId)) {
        otherUserByRoom.set(roomId, userId);
      }
    }

    const otherUserIds = Array.from(
      new Set(
        directRooms
          .map((room) => otherUserByRoom.get(room.id))
          .filter((id): id is string => Boolean(id) && id !== myUserId)
      )
    );
    let hydratedUserLabels: Record<string, string> = {};
    let hydratedProfilesById: Record<string, Profile> = {};
    if (otherUserIds.length > 0) {
      hydratedProfilesById = await hydrateProfilesByIds(otherUserIds);
      hydratedUserLabels = await hydrateChatUserLabels(otherUserIds);
    }

    const nextRoomProfiles: Record<string, Profile> = {};

    for (const room of directRooms) {
      const otherUserId = otherUserByRoom.get(room.id);
      const label =
        (otherUserId && hydratedUserLabels[otherUserId]) ||
        (otherUserId && chatUserLabels[otherUserId]) ||
        room.name?.trim() ||
        'Direct Chat';
      next[room.id] = label;
      if (otherUserId && hydratedProfilesById[otherUserId]) {
        nextRoomProfiles[room.id] = hydratedProfilesById[otherUserId];
      } else if (otherUserId && profilesById[otherUserId]) {
        nextRoomProfiles[room.id] = profilesById[otherUserId];
      }
    }

    setChatRoomLabels((prev) => ({ ...prev, ...next }));
    setChatRoomProfiles((prev) => ({ ...prev, ...nextRoomProfiles }));
  }

  async function refreshApprovalsRequired(rooms: ChatRoom[] = chatRooms): Promise<void> {
    if (rooms.length === 0) {
      setApprovalsRequired([]);
      return;
    }
    setChatError('');
    try {
      const nested = await Promise.all(
        rooms.map(async (room) => {
          const role = await chatService.getMyRoleInRoom(room.id);
          if (role !== 'owner' && role !== 'admin') return [] as ChatRoomInvite[];
          return chatService.listPendingInvites(room.id);
        })
      );
      const all = nested.flat();
      setApprovalsRequired(all);
      await Promise.all([hydrateInviteParticipantLabels(all), hydrateInviteRoomLabels(all)]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load approval queue.');
    }
  }

  async function refreshPendingInvites(roomId: string): Promise<void> {
    if (!roomId.trim()) {
      setPendingInvites([]);
      return;
    }
    setChatError('');
    try {
      const invites = await chatService.listPendingInvites(roomId);
      setPendingInvites(invites);
      await Promise.all([hydrateInviteParticipantLabels(invites), hydrateInviteRoomLabels(invites)]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load pending invites.');
    }
  }

  async function refreshActiveRoomRole(roomId: string): Promise<void> {
    if (!roomId.trim()) {
      setActiveRoomRole(null);
      return;
    }
    setChatError('');
    try {
      const role = await chatService.getMyRoleInRoom(roomId);
      setActiveRoomRole(role);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load room role.');
    }
  }

  async function refreshMyApprovedInvites(): Promise<void> {
    setChatError('');
    try {
      const invites = await chatService.listMyApprovedInvites();
      setApprovedInvitesForMe(invites);
      await Promise.all([hydrateInviteParticipantLabels(invites), hydrateInviteRoomLabels(invites)]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load approved invites.');
    }
  }

  async function hydrateInviteParticipantLabels(invites: ChatRoomInvite[]): Promise<void> {
    const ids = Array.from(
      new Set(
        invites
          .flatMap((invite) => [invite.proposerId, invite.inviteeId])
          .filter((id) => Boolean(id))
      )
    );
    if (ids.length === 0) return;

    const hydratedProfiles = await hydrateProfilesByIds(ids);
    const next: Record<string, string> = {};
    for (const profile of Object.values(hydratedProfiles)) {
      next[profile.id] = formatProfileLabel(profile.displayName, profile.username);
    }
    setInviteParticipantLabels((prev) => ({ ...prev, ...next }));
  }

  async function hydrateInviteRoomLabels(invites: ChatRoomInvite[]): Promise<void> {
    const roomIds = Array.from(new Set(invites.map((invite) => invite.roomId).filter((id) => Boolean(id))));
    if (roomIds.length === 0) return;

    const { data, error } = await supabase.from('chat_rooms').select('id,name,room_type').in('id', roomIds);
    if (error) throw error;

    const next: Record<string, string> = {};
    for (const row of data ?? []) {
      const roomId = String(row.id);
      const fallback = row.room_type === 'dm' ? 'Direct Chat' : 'Untitled Group';
      next[roomId] = chatRoomLabels[roomId] ?? (row.name ? String(row.name) : fallback);
    }
    setInviteRoomLabels((prev) => ({ ...prev, ...next }));
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
      });
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
      const occurredAtIso = combineDateTimeInputs(entryDate, entryTime);
      if (editingEntryId) {
        await poopService.updateMine(editingEntryId, {
          occurredAt: occurredAtIso,
          bristolType: typeValue as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          rating: ratingValue as 1 | 2 | 3 | 4 | 5,
          note: note.trim() || undefined,
        });
      } else {
        await poopService.createMine({
          occurredAt: occurredAtIso,
          bristolType: typeValue as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          rating: ratingValue as 1 | 2 | 3 | 4 | 5,
          note: note.trim() || undefined,
        });
      }
      setNote('');
      setEditingEntryId(null);
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
    setNote('');
    const now = new Date();
    setEntryDate(formatDateInput(now));
    setEntryTime(formatTimeInput(now));
    setShowEntryComposer(true);
  }

  function closeEntryComposer(): void {
    setEditingEntryId(null);
    setShowEntryComposer(false);
  }

  function handleStartEditEntry(entry: PoopEntry): void {
    setEntryError('');
    setEditingEntryId(entry.id);
    setBristolType(String(entry.bristolType));
    setRating(String(entry.rating));
    setNote(entry.note ?? '');
    const occurredAtDate = new Date(entry.occurredAt);
    setEntryDate(formatDateInput(occurredAtDate));
    setEntryTime(formatTimeInput(occurredAtDate));
    setShowEntryComposer(true);
  }

  async function handleDeleteEntry(entryId: string): Promise<void> {
    setDeletingEntryIds((prev) => (prev.includes(entryId) ? prev : [...prev, entryId]));
    setEntryError('');
    try {
      await poopService.deleteMine(entryId);
      await refreshEntries();
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to delete entry.');
    } finally {
      setDeletingEntryIds((prev) => prev.filter((id) => id !== entryId));
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
      await friendsService.sendRequest(profile.id);
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

  async function handleOpenDirectChat(friendUserId: string): Promise<void> {
    if (openDirectChatLoading) return;
    setOpenDirectChatLoading(true);
    setChatError('');
    setChatStatus('');
    try {
      const roomId = await chatService.createOrGetDirectRoom(friendUserId);
      setActiveRoomId(roomId);
      setChatRoute('room');
      setSocialSection('chat');
      setTab('social');
      const rooms = await refreshRooms();
      await Promise.all([loadMessages(roomId), refreshPendingInvites(roomId), refreshActiveRoomRole(roomId)]);
      await refreshApprovalsRequired(rooms);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to open chat.');
    } finally {
      setOpenDirectChatLoading(false);
    }
  }

  async function handleCreateGroup(): Promise<void> {
    if (chatCreateGroupLoading) return;
    setChatCreateGroupLoading(true);
    setChatError('');
    setChatStatus('');
    try {
      const room = await chatService.createGroupRoom(groupName);
      setGroupName('');
      setActiveRoomId(room.id);
      setChatRoute('room');
      setShowCreateGroup(false);
      setChatStatus(`Created group "${room.name ?? 'Untitled'}".`);
      const rooms = await refreshRooms();
      await Promise.all([loadMessages(room.id), refreshPendingInvites(room.id), refreshActiveRoomRole(room.id)]);
      await refreshApprovalsRequired(rooms);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to create group.');
    } finally {
      setChatCreateGroupLoading(false);
    }
  }

  async function handleOpenRoom(roomId: string): Promise<void> {
    setChatOpenRoomLoadingId(roomId);
    setChatError('');
    setChatStatus('');
    try {
      setActiveRoomId(roomId);
      setChatRoute('room');
      await Promise.all([loadMessages(roomId), refreshPendingInvites(roomId), refreshActiveRoomRole(roomId)]);
      setChatStatus('Room opened.');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to open room.');
    } finally {
      setChatOpenRoomLoadingId('');
    }
  }

  async function handleProposeInvite(): Promise<void> {
    if (chatProposeInviteLoading) return;
    if (!activeRoomId.trim()) {
      setChatError('Open a room first.');
      return;
    }
    if (activeRoom?.type === 'dm') {
      setChatError('Direct chats do not support invite proposals.');
      return;
    }
    setChatProposeInviteLoading(true);
    setChatError('');
    setChatStatus('');
    try {
      const profile = await profileService.findByUsername(inviteUsername);
      if (!profile) {
        setChatError('No user found with that username.');
        return;
      }
      await chatService.proposeInvite(activeRoomId, profile.id);
      setInviteUsername('');
      setChatStatus(`Invite proposed for @${profile.username}.`);
      await refreshPendingInvites(activeRoomId);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to propose invite.');
    } finally {
      setChatProposeInviteLoading(false);
    }
  }

  async function handleApproveInvite(inviteId: string): Promise<void> {
    setChatApproveInviteIdsLoading((prev) => (prev.includes(inviteId) ? prev : [...prev, inviteId]));
    setChatError('');
    setChatStatus('');
    try {
      await chatService.approveInvite(inviteId);
      setChatStatus('Invite approved.');
      const rooms = await refreshRooms();
      await Promise.all([refreshPendingInvites(activeRoomId), refreshMyApprovedInvites()]);
      await refreshApprovalsRequired(rooms);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to approve invite.');
    } finally {
      setChatApproveInviteIdsLoading((prev) => prev.filter((id) => id !== inviteId));
    }
  }

  async function handleRejectInvite(inviteId: string): Promise<void> {
    setChatRejectInviteIdsLoading((prev) => (prev.includes(inviteId) ? prev : [...prev, inviteId]));
    setChatError('');
    setChatStatus('');
    try {
      await chatService.rejectInvite(inviteId);
      setChatStatus('Invite rejected.');
      await refreshPendingInvites(activeRoomId);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to reject invite.');
    } finally {
      setChatRejectInviteIdsLoading((prev) => prev.filter((id) => id !== inviteId));
    }
  }

  async function handleJoinApprovedInvite(inviteId: string): Promise<void> {
    setChatJoinInviteIdsLoading((prev) => (prev.includes(inviteId) ? prev : [...prev, inviteId]));
    setChatError('');
    setChatStatus('');
    try {
      const invite = approvedInvitesForMe.find((item) => item.id === inviteId);
      await chatService.joinApprovedInvite(inviteId);
      setChatStatus('Joined group invite.');
      const rooms = await refreshRooms();
      await Promise.all([refreshMyApprovedInvites()]);
      await refreshApprovalsRequired(rooms);
      if (invite) {
        setActiveRoomId(invite.roomId);
        setChatRoute('room');
        await Promise.all([
          loadMessages(invite.roomId),
          refreshPendingInvites(invite.roomId),
          refreshActiveRoomRole(invite.roomId),
        ]);
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to join invite.');
    } finally {
      setChatJoinInviteIdsLoading((prev) => prev.filter((id) => id !== inviteId));
    }
  }

  async function refreshAccountRankings(profileId: string): Promise<void> {
    try {
      const [rowsCurrent, rowsPrevious] = await Promise.all([
        leaderboardService.listYear(currentYear),
        leaderboardService.listYear(previousYear),
      ]);
      setCurrentYearRank(rowsCurrent.find((row) => row.subjectId === profileId)?.rank ?? null);
      setPreviousYearRank(rowsPrevious.find((row) => row.subjectId === profileId)?.rank ?? null);
    } catch {
      setCurrentYearRank(null);
      setPreviousYearRank(null);
    }
  }

  async function loadAccountLeaderboard(profileId: string, year: number): Promise<void> {
    setAccountLeaderboardLoading(true);
    setAccountLeaderboardError('');
    try {
      const rows = await leaderboardService.listYear(year);
      setAccountLeaderboardRows(rows);
      void hydrateProfilesByIds(rows.map((row) => row.subjectId));
      const myRank = rows.find((row) => row.subjectId === profileId)?.rank ?? null;
      if (year === currentYear) setCurrentYearRank(myRank);
      if (year === previousYear) setPreviousYearRank(myRank);
    } catch (error) {
      setAccountLeaderboardError(error instanceof Error ? error.message : 'Failed to load leaderboard.');
      setAccountLeaderboardRows([]);
    } finally {
      setAccountLeaderboardLoading(false);
    }
  }

  async function handleSelectLeaderboardYear(year: number): Promise<void> {
    setSelectedLeaderboardYear(year);
    if (!myProfile) return;
    await loadAccountLeaderboard(myProfile.id, year);
  }

  async function refreshAccountLeaderboard(): Promise<void> {
    if (!myProfile) return;
    await loadAccountLeaderboard(myProfile.id, selectedLeaderboardYear);
  }

  async function loadMessages(roomId: string): Promise<void> {
    if (!roomId.trim()) {
      setChatRows([]);
      return;
    }
    setChatError('');
    try {
      const rows = await chatService.listMessages(roomId.trim(), 100);
      setChatRows(rows);
      try {
        await hydrateChatUserLabels(rows.map((row) => row.senderId));
      } catch {
        // Ignore participant label failures; messages should still render.
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load messages.');
    }
  }

  async function handleSendMessage(): Promise<void> {
    if (chatSendMessageLoading) return;
    if (!activeRoomId.trim()) {
      setChatError('Open chat from Social tab first.');
      return;
    }
    if (!messageBody.trim()) return;
    setChatSendMessageLoading(true);
    setChatError('');
    try {
      const sent = await chatService.sendMessage(activeRoomId.trim(), messageBody.trim());
      setChatRows((prev) => mergeMessages(prev, sent));
      try {
        await hydrateChatUserLabels([sent.senderId]);
      } catch {
        // Ignore participant label failures for sent messages.
      }
      setMessageBody('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setChatSendMessageLoading(false);
    }
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
      const updated = await profileService.setShareFeed(!myProfile.shareFeed);
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
        asset.base64 ?? undefined
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

  async function handleRefreshChatInbox(): Promise<void> {
    if (chatRefreshInboxLoading) return;
    setChatRefreshInboxLoading(true);
    try {
      const rooms = await refreshRooms();
      await Promise.all([refreshMyApprovedInvites(), refreshApprovalsRequired(rooms)]);
    } finally {
      setChatRefreshInboxLoading(false);
    }
  }

  async function handleRefreshMessages(): Promise<void> {
    if (chatRefreshMessagesLoading) return;
    setChatRefreshMessagesLoading(true);
    try {
      await loadMessages(activeRoomId);
    } finally {
      setChatRefreshMessagesLoading(false);
    }
  }

  const activeRoom = chatRooms.find((room) => room.id === activeRoomId) ?? null;
  const approvalsByRoom = approvalsRequired.reduce<Record<string, number>>((acc, invite) => {
    acc[invite.roomId] = (acc[invite.roomId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    session,
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
    deletingEntryIds,
    entryError,
    bristolType,
    setBristolType,
    rating,
    setRating,
    note,
    setNote,
    entryDate,
    setEntryDate,
    entryTime,
    setEntryTime,
    showEntryComposer,
    editingEntryId,
    feedItems,
    feedError,
    refreshEntries,
    refreshFeed,
    handleDeleteEntry,
    handleAddEntry,
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
    openDirectChatLoading,
    handleSendFriendRequest,
    refreshFriends,
    handleAcceptRequest,
    handleOpenDirectChat,
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
    chatRoute,
    setChatRoute,
    activeRoomId,
    activeRoom,
    activeRoomRole,
    chatRooms,
    approvalsByRoom,
    approvalsRequired,
    approvedInvitesForMe,
    pendingInvites,
    inviteParticipantLabels,
    inviteRoomLabels,
    chatRoomLabels,
    chatRoomProfiles,
    chatUserLabels,
    showCreateGroup,
    setShowCreateGroup,
    showInviteQueue,
    setShowInviteQueue,
    showApprovalQueue,
    setShowApprovalQueue,
    showRoomActions,
    setShowRoomActions,
    groupName,
    setGroupName,
    inviteUsername,
    setInviteUsername,
    messageBody,
    setMessageBody,
    chatRows,
    chatStatus,
    chatError,
    chatRefreshInboxLoading,
    chatCreateGroupLoading,
    chatJoinInviteIdsLoading,
    chatApproveInviteIdsLoading,
    chatRejectInviteIdsLoading,
    chatOpenRoomLoadingId,
    chatProposeInviteLoading,
    chatRefreshMessagesLoading,
    chatSendMessageLoading,
    currentUserId: session?.user.id ?? '',
    handleRefreshChatInbox,
    handleCreateGroup,
    handleJoinApprovedInvite,
    handleApproveInvite,
    handleRejectInvite,
    handleOpenRoom,
    handleProposeInvite,
    handleRefreshMessages,
    handleSendMessage,
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
  const combined = new Date(`${date}T${time}:00`);
  if (Number.isNaN(combined.getTime())) throw new Error('Invalid date/time.');
  return combined.toISOString();
}

function asRealtimeMessage(
  payload: RealtimePostgresInsertPayload<{
    id: string;
    room_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }>
): ChatMessage | null {
  const row = payload.new;
  if (!row?.id || !row.room_id || !row.sender_id || !row.body || !row.created_at) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (existing.some((message) => message.id === incoming.id)) return existing;
  return [incoming, ...existing];
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
